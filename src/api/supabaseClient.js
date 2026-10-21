// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 浏览器端 Supabase 客户端，仅使用公开的 URL 与匿名密钥。

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 环境变量");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
