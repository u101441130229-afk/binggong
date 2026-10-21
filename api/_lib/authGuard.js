// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 校验 Authorization 令牌并读取数据库角色，作为所有 AI 代理的入口权限判断。

export async function authenticateRequest(req, admin) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  if (typeof header !== "string" || !header.startsWith("Bearer ")) {
    return { status: 401, error: "unauthorized" };
  }

  const token = header.slice(7).trim();
  if (!token) return { status: 401, error: "unauthorized" };

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    return { status: 401, error: "unauthorized" };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id,login_id,name,role,is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    return { status: 503, error: "service_unavailable" };
  }
  if (!profile || !profile.is_active) {
    return { status: 403, error: "forbidden" };
  }
  if (!["student", "teacher", "admin"].includes(profile.role)) {
    return { status: 403, error: "forbidden" };
  }

  return { user: data.user, profile };
}
