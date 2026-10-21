// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// Vercel 函数专用 Supabase 管理客户端，密钥只从服务端环境变量读取。

import { createClient } from "@supabase/supabase-js";

let cachedClient = null;

export function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  if (!cachedClient) {
    cachedClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedClient;
}
