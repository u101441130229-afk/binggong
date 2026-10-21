// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 登录名与认证邮箱的唯一映射规则，前端、Vercel 函数和本地脚本共用。

const EMAIL_DOMAIN = "users.bgzh.top";

export function normalizeLoginId(loginId) {
  return String(loginId == null ? "" : loginId)
    .trim()
    .toLowerCase();
}

export function loginIdToEmail(loginId) {
  return `${normalizeLoginId(loginId)}@${EMAIL_DOMAIN}`;
}

export function isValidLoginId(loginId) {
  return /^[a-z0-9_]{3,40}$/.test(normalizeLoginId(loginId));
}
