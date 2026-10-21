// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 登录、会话恢复、角色资料读取与退出，页面不直接接触认证客户端。

import { supabase } from "./supabaseClient.js";
import { loginIdToEmail, normalizeLoginId } from "./loginId.js";

const VALID_ROLES = new Set(["student", "teacher", "admin"]);

function isCredentialError(error) {
  const text = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  return (
    text.includes("invalid login credentials") ||
    text.includes("invalid_credentials") ||
    text.includes("email not confirmed") ||
    text.includes("invalid email") ||
    text.includes("user not found")
  );
}

export async function fetchProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,login_id,name,role,class_code,major,group_name,is_active,created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  if (!data.is_active || !VALID_ROLES.has(data.role)) return null;
  return data;
}

export async function signIn(loginId, password) {
  const normalized = normalizeLoginId(loginId);
  if (!normalized || !password) return { ok: false, kind: "credentials" };

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginIdToEmail(normalized),
    password,
  });

  if (error) {
    return { ok: false, kind: isCredentialError(error) ? "credentials" : "unavailable" };
  }

  const profile = await fetchProfile(data.user?.id);
  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, kind: "forbidden" };
  }
  return { ok: true, session: data.session, profile };
}

export async function restoreSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  const profile = await fetchProfile(data.session.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    return null;
  }
  return { session: data.session, profile };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange(function (event) {
    callback(event);
  });
  return function () {
    data.subscription.unsubscribe();
  };
}
