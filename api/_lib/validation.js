// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 请求体白名单校验与限额，模型、温度、输出长度均不由前端决定。

const ALLOWED_ROLES = new Set(["system", "user", "assistant"]);
const MAX_MESSAGES = 30;
const MAX_TEXT_CHARS = 8000;
const MAX_OUTPUT_TOKENS = 600;
const MAX_VISION_BYTES = 6 * 1024 * 1024;
const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=\s]+$/;

export const DEEPSEEK_TEMPERATURE = 0.7;
export const QWEN_TEMPERATURE = 0.6;

function clampMaxTokens(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), MAX_OUTPUT_TOKENS);
}

function textLength(messages) {
  return messages.reduce(function (total, message) {
    if (typeof message.content === "string") return total + message.content.length;
    if (Array.isArray(message.content)) {
      return (
        total +
        message.content.reduce(function (sum, part) {
          return part && part.type === "text" && typeof part.text === "string" ? sum + part.text.length : sum;
        }, 0)
      );
    }
    return total;
  }, 0);
}

function normalizeTextMessages(messages) {
  const normalized = [];
  for (const message of messages) {
    if (!message || !ALLOWED_ROLES.has(message.role)) return null;
    let content = "";
    if (typeof message.content === "string") {
      content = message.content;
    } else if (Array.isArray(message.content)) {
      content = message.content
        .filter(function (part) {
          return part && part.type === "text" && typeof part.text === "string";
        })
        .map(function (part) {
          return part.text;
        })
        .join("\n");
    } else {
      return null;
    }
    normalized.push({ role: message.role, content });
  }
  return normalized;
}

export function validateTextPayload(body) {
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return { ok: false, error: "invalid_messages" };
  }
  const normalized = normalizeTextMessages(messages);
  if (!normalized) return { ok: false, error: "invalid_messages" };
  if (textLength(normalized) > MAX_TEXT_CHARS) {
    return { ok: false, error: "payload_too_large" };
  }
  return {
    ok: true,
    messages: normalized,
    maxTokens: clampMaxTokens(body.max_tokens, 300),
  };
}

export function validateVisionPayload(body) {
  if (Buffer.byteLength(JSON.stringify(body || {}), "utf8") > MAX_VISION_BYTES) {
    return { ok: false, error: "payload_too_large" };
  }
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return { ok: false, error: "invalid_messages" };
  }

  const normalized = [];
  for (const message of messages) {
    if (!message || !ALLOWED_ROLES.has(message.role)) {
      return { ok: false, error: "invalid_messages" };
    }
    if (!Array.isArray(message.content)) {
      return { ok: false, error: "invalid_messages" };
    }
    const parts = [];
    for (const part of message.content) {
      if (!part || typeof part !== "object") return { ok: false, error: "invalid_messages" };
      if (part.type === "text") {
        if (typeof part.text !== "string") return { ok: false, error: "invalid_messages" };
        parts.push({ type: "text", text: part.text });
      } else if (part.type === "image_url") {
        const url = part.image_url?.url;
        if (typeof url !== "string" || !IMAGE_DATA_URL.test(url)) {
          return { ok: false, error: "invalid_image" };
        }
        parts.push({ type: "image_url", image_url: { url } });
      } else {
        return { ok: false, error: "invalid_messages" };
      }
    }
    normalized.push({ role: message.role, content: parts });
  }

  if (textLength(normalized) > MAX_TEXT_CHARS) {
    return { ok: false, error: "payload_too_large" };
  }
  return {
    ok: true,
    messages: normalized,
    maxTokens: clampMaxTokens(body.max_tokens, 300),
  };
}
