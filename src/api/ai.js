// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// AI 代理请求封装，统一携带登录令牌，前端不再传递模型与随机性参数。

import { supabase } from "./supabaseClient.js";

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

export async function requestAi(path, payload) {
  const token = await getAccessToken();
  if (!token) {
    const error = new Error("unauthorized");
    error.kind = "unauthorized";
    throw error;
  }

  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    const error = new Error("unauthorized");
    error.kind = "unauthorized";
    throw error;
  }

  if (response.status === 403) {
    const error = new Error("forbidden");
    error.kind = "forbidden";
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`ai_request_failed_${response.status}`);
    error.kind = response.status === 429 ? "rate_limited" : "upstream";
    throw error;
  }

  return response.json();
}

export function mergeChatHistory(history, limit = 6) {
  return history.slice(-limit).map(function (message) {
    return {
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.text,
    };
  });
}
