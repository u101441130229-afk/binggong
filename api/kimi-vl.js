// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// Kimi视觉代理：仅学生可用，服务端校验图片类型、体积并固定模型。

import { getAdminClient } from "./_lib/supabaseAdmin.js";
import { authenticateRequest } from "./_lib/authGuard.js";
import { validateVisionPayload } from "./_lib/validation.js";
import { checkRateLimit, logAiActivity } from "./_lib/rateLimit.js";

// ai_qwen is a legacy database identifier retained for existing CHECK constraints and history.
// The provider is exclusively Kimi; no Alibaba API or key is used.
const UPSTREAM_URL = "https://api.moonshot.cn/v1/chat/completions";
// K2.5 was retired on 2026-08-31; K3.1 Pro is the current vision-capable flagship.
const DEFAULT_MODEL = "kimi-k3.1-pro";
const RETIRED_VISION_MODELS = new Set(["kimi-k2.5"]);
// K3 always reasons, so leave room for low-effort reasoning plus the short answer.
const MAX_COMPLETION_TOKENS = 1024;
const UPSTREAM_TIMEOUT_MS = 50000;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "7mb",
    },
  },
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const apiKey = process.env.MOONSHOT_API_KEY;
  const configuredModel = process.env.KIMI_VL_MODEL;
  const model = configuredModel && !RETIRED_VISION_MODELS.has(configuredModel) ? configuredModel : DEFAULT_MODEL;
  if (configuredModel && model !== configuredModel) {
    console.warn("KIMI_VL_MODEL is retired; using current default", { configuredModel, model });
  }
  const admin = getAdminClient();
  if (!apiKey || !model || !admin) {
    return res.status(503).json({ error: "service_unavailable" });
  }

  const auth = await authenticateRequest(req, admin);
  if (!auth.profile) {
    return res.status(auth.status).json({ error: auth.error });
  }
  if (auth.profile.role !== "student") {
    return res.status(403).json({ error: "forbidden" });
  }

  const limit = await checkRateLimit(admin, auth.profile.id);
  if (!limit.allowed) {
    return res.status(limit.status).json({ error: limit.error });
  }

  const payload = validateVisionPayload(req.body);
  if (!payload.ok) {
    return res.status(400).json({ error: payload.error });
  }

  let upstream;
  try {
    upstream = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: payload.messages,
        // K3 always reasons and rejects the K2-only temperature/thinking fields.
        max_completion_tokens: MAX_COMPLETION_TOKENS,
        reasoning_effort: "low",
        stream: false,
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    console.warn("Kimi vision transport failure", { model, timeout: error?.name === "TimeoutError" });
    await logAiActivity(admin, auth.profile.id, "ai_qwen", false);
    return res.status(502).json({ error: "ai_service_unavailable" });
  }

  if (!upstream.ok) {
    console.warn("Kimi vision upstream rejected request", { model, status: upstream.status });
    await logAiActivity(admin, auth.profile.id, "ai_qwen", false);
    return res.status(502).json({ error: "ai_service_unavailable" });
  }

  let data;
  try {
    data = await upstream.json();
  } catch {
    await logAiActivity(admin, auth.profile.id, "ai_qwen", false);
    return res.status(502).json({ error: "ai_service_unavailable" });
  }

  await logAiActivity(admin, auth.profile.id, "ai_qwen", true);
  return res.status(200).json(data);
}
