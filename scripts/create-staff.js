// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 教师/管理员账号管理：随机生成强密码，只输出到终端并追加到本机私有密码文件。
// 用法：node scripts/create-staff.js --role admin --login-id bgzh_admin --name 系统管理员

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { isValidLoginId, loginIdToEmail, normalizeLoginId } from "../src/api/loginId.js";
import { ROOT_DIR, loadEnvFile } from "./_env.js";
import { callWithRetry, isAlreadyExists } from "./_retry.js";
import { createAdminClient, listAllAuthUsers } from "./_supabase.js";

const ALPHABET_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const ALPHABET_LOWER = "abcdefghijkmnopqrstuvwxyz";
const ALPHABET_DIGITS = "23456789";
const ALPHABET_SYMBOLS = "!@#%&*";
const PASSWORD_ALPHABET = ALPHABET_UPPER + ALPHABET_LOWER + ALPHABET_DIGITS + ALPHABET_SYMBOLS;
const CREDENTIAL_FILE = path.join(ROOT_DIR, "private", "账号密码.txt");
const ROLE_LABELS = { teacher: "教师", admin: "管理员" };

function parseArguments() {
  const args = process.argv.slice(2);
  const options = { resetPassword: false, passwordEnv: null };
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (key === "--reset-password") {
      options.resetPassword = true;
    } else if (key === "--role" || key === "--login-id" || key === "--name" || key === "--password-env") {
      const value = args[index + 1];
      if (!value) throw new Error(`${key} 缺少参数值`);
      index += 1;
      if (key === "--role") options.role = value.trim();
      if (key === "--login-id") options.loginId = normalizeLoginId(value);
      if (key === "--name") options.name = value.trim();
      if (key === "--password-env") options.passwordEnv = value.trim();
    } else {
      throw new Error(`未知参数：${key}`);
    }
  }
  return options;
}

function generatePassword(length = 20) {
  let password = "";
  for (let index = 0; index < length; index += 1) {
    password += PASSWORD_ALPHABET[crypto.randomInt(0, PASSWORD_ALPHABET.length)];
  }
  return password;
}

function timestamp() {
  const now = new Date();
  const pad = function (value) {
    return String(value).padStart(2, "0");
  };
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function appendCredential(options, password, action) {
  fs.mkdirSync(path.dirname(CREDENTIAL_FILE), { recursive: true });
  const passwordLine = password ? `密码：${password}` : `密码：（由环境变量 ${options.passwordEnv} 提供，未记录）`;
  const content = [
    `===== ${timestamp()} ${action} =====`,
    `账号：${options.loginId}`,
    passwordLine,
    `角色：${ROLE_LABELS[options.role]}`,
    `姓名：${options.name}`,
    "",
  ].join("\n");
  fs.appendFileSync(CREDENTIAL_FILE, content, "utf8");
}

function printCredential(options, password, action) {
  console.info("");
  console.info(`${action}成功`);
  console.info(`账号：${options.loginId}`);
  if (password) {
    console.info(`密码：${password}`);
    console.info("提示：密码只显示这一次，已同步写入 private/账号密码.txt。");
  } else {
    console.info(`密码：取自环境变量 ${options.passwordEnv}，未回显、未记录。`);
  }
  console.info(`角色：${ROLE_LABELS[options.role]}`);
  console.info(`姓名：${options.name}`);
  console.info(`记录文件：${path.relative(ROOT_DIR, CREDENTIAL_FILE)}`);
}

async function main() {
  loadEnvFile();
  const options = parseArguments();
  if (!["teacher", "admin"].includes(options.role)) {
    throw new Error("--role 只能是 teacher 或 admin");
  }
  if (!isValidLoginId(options.loginId)) {
    throw new Error("--login-id 需为 3-40 位小写字母、数字或下划线");
  }
  if (!options.name) throw new Error("缺少 --name 姓名");

  let password = null;
  if (options.passwordEnv) {
    password = process.env[options.passwordEnv];
    if (!password) throw new Error(`环境变量 ${options.passwordEnv} 未设置`);
  } else {
    password = generatePassword();
  }

  const admin = createAdminClient();
  const email = loginIdToEmail(options.loginId);
  const existing = await admin
    .from("profiles")
    .select("id, role, name, is_active")
    .eq("login_id", options.loginId)
    .maybeSingle();
  if (existing.error) throw new Error(`查询账号失败：${existing.error.message}`);

  if (existing.data) {
    if (!options.resetPassword) {
      throw new Error(`账号 ${options.loginId} 已存在；如需重置密码请加 --reset-password`);
    }
    const updatedUser = await callWithRetry(function () {
      return admin.auth.admin.updateUserById(existing.data.id, { password });
    }, options.loginId);
    if (updatedUser.error) throw new Error(`重置密码失败：${updatedUser.error.message}`);
    const updatedProfile = await admin
      .from("profiles")
      .update({ name: options.name, role: options.role, is_active: true })
      .eq("id", existing.data.id);
    if (updatedProfile.error) throw new Error(`更新资料失败：${updatedProfile.error.message}`);
    appendCredential(options, options.passwordEnv ? null : password, "重置密码");
    printCredential(options, options.passwordEnv ? null : password, "密码重置");
    return;
  }

  const created = await callWithRetry(function () {
    return admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { login_id: options.loginId, name: options.name },
    });
  }, options.loginId);
  if (created.error) {
    if (isAlreadyExists(created.error)) {
      const users = await listAllAuthUsers(admin);
      const matched = users.find(function (user) {
        return (user.email || "").toLowerCase() === email;
      });
      if (matched) {
        throw new Error(`账号 ${options.loginId} 的登录账号已存在但资料缺失，请先在 Supabase 后台核对`);
      }
      throw new Error(`登录邮箱 ${email} 已被其他账号占用`);
    }
    throw new Error(`创建账号失败：${created.error.message}`);
  }

  const inserted = await admin.from("profiles").insert({
    id: created.data.user.id,
    login_id: options.loginId,
    name: options.name,
    role: options.role,
    is_active: true,
  });
  if (inserted.error) throw new Error(`写入资料失败：${inserted.error.message}`);

  appendCredential(options, options.passwordEnv ? null : password, "新建账号");
  printCredential(options, options.passwordEnv ? null : password, "账号创建");
}

main().catch(function (error) {
  console.error(`操作未完成：${error.message}`);
  process.exitCode = 1;
});
