// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 通义千问视觉代理：仅学生可用，服务端校验图片类型、体积并固定模型。

import { getAdminClient } from "./_lib/supabaseAdmin.js";
import { authenticateRequest } from "./_lib/authGuard.js";
import { validateVisionPayload, QWEN_TEMPERATURE } from "./_lib/validation.js";
import { checkRateLimit, logAiActivity } from "./_lib/rateLimit.js";

const UPSTREAM_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "7mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const apiKey = process.env.DASHSCOPE_API_KEY;
  const model = process.env.QWEN_VL_MODEL;
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
        max_tokens: payload.maxTokens,
        temperature: QWEN_TEMPERATURE,
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    await logAiActivity(admin, auth.profile.id, "ai_qwen", false);
    return res.status(502).json({ error: "ai_service_unavailable" });
  }

  if (!upstream.ok) {
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
