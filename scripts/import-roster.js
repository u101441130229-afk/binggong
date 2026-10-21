// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 学生名册导入：学号即初始密码，已存在的账号跳过且不重置密码。
// 用法：node scripts/import-roster.js [--file private/名册.csv]

import fs from "node:fs";
import path from "node:path";
import { loginIdToEmail, normalizeLoginId } from "../src/api/loginId.js";
import { parseCsv } from "./_csv.js";
import { ROOT_DIR } from "./_env.js";
import { callWithRetry, delay, isAlreadyExists } from "./_retry.js";
import { createAdminClient, listAllAuthUsers } from "./_supabase.js";

const DEFAULT_FILE = path.join(ROOT_DIR, "private", "roster.csv");
const GROUP_NAME = "装备工程学院试点组";

function parseArguments() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");
  if (fileIndex >= 0 && args[fileIndex + 1]) {
    return { file: path.resolve(args[fileIndex + 1]) };
  }
  return { file: DEFAULT_FILE };
}

function readRoster(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`找不到名册文件：${file}`);
  }
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  if (rows.length < 2) throw new Error("名册为空或缺少数据行");
  const headers = rows[0].map(function (item) {
    return item.trim();
  });
  const required = ["student_no", "name", "class_code", "major"];
  for (const key of required) {
    if (!headers.includes(key)) throw new Error(`名册缺少列：${key}`);
  }
  const indexes = {};
  for (const key of required) indexes[key] = headers.indexOf(key);
  return rows.slice(1).map(function (row, index) {
    return {
      line: index + 2,
      studentNo: normalizeLoginId(row[indexes.student_no]),
      name: (row[indexes.name] || "").trim(),
      classCode: (row[indexes.class_code] || "").trim(),
      major: (row[indexes.major] || "").trim(),
    };
  });
}

async function findAuthUserByEmail(admin, email) {
  const users = await listAllAuthUsers(admin);
  return users.find(function (user) {
    return (user.email || "").toLowerCase() === email;
  });
}

async function main() {
  const options = parseArguments();
  const roster = readRoster(options.file);
  const admin = createAdminClient();
  const stats = { added: 0, skipped: 0, failed: 0 };
  const failures = [];

  console.info(`开始导入名册：${roster.length} 条，账号格式为“学号@users.bgzh.top”`);

  for (let index = 0; index < roster.length; index += 1) {
    const student = roster[index];
    const position = index + 1;
    if (!student.studentNo || !student.name) {
      stats.failed += 1;
      failures.push({ ...student, reason: "学号或姓名为空" });
      console.info(`[${position}/${roster.length}] 失败：第 ${student.line} 行学号或姓名为空`);
      continue;
    }
    const email = loginIdToEmail(student.studentNo);

    const existingProfile = await admin.from("profiles").select("id").eq("login_id", student.studentNo).maybeSingle();
    if (existingProfile.error) {
      stats.failed += 1;
      failures.push({ ...student, reason: existingProfile.error.message });
      console.info(`[${position}/${roster.length}] 失败：${student.studentNo} 查询资料出错`);
      continue;
    }
    if (existingProfile.data) {
      stats.skipped += 1;
      console.info(`[${position}/${roster.length}] 跳过：${student.studentNo} 已存在`);
      continue;
    }

    let userId = null;
    const created = await callWithRetry(function () {
      return admin.auth.admin.createUser({
        email,
        password: student.studentNo,
        email_confirm: true,
        user_metadata: { login_id: student.studentNo, name: student.name },
      });
    }, student.studentNo);

    if (created.error) {
      if (isAlreadyExists(created.error)) {
        const existingUser = await findAuthUserByEmail(admin, email);
        if (existingUser) {
          userId = existingUser.id;
        } else {
          stats.failed += 1;
          failures.push({ ...student, reason: created.error.message });
          console.info(`[${position}/${roster.length}] 失败：${student.studentNo} 账号已存在但资料缺失`);
          continue;
        }
      } else {
        stats.failed += 1;
        failures.push({ ...student, reason: created.error.message });
        console.info(`[${position}/${roster.length}] 失败：${student.studentNo} 创建账号失败`);
        continue;
      }
    } else {
      userId = created.data.user.id;
    }

    const inserted = await admin.from("profiles").insert({
      id: userId,
      login_id: student.studentNo,
      name: student.name,
      role: "student",
      class_code: student.classCode || null,
      major: student.major || null,
      group_name: GROUP_NAME,
      is_active: true,
    });
    if (inserted.error) {
      stats.failed += 1;
      failures.push({ ...student, reason: inserted.error.message });
      console.info(`[${position}/${roster.length}] 失败：${student.studentNo} 写入资料失败`);
      continue;
    }

    stats.added += 1;
    console.info(`[${position}/${roster.length}] 新增：${student.studentNo} ${student.name}`);
    await delay(80);
  }

  console.info("");
  console.info(`导入完成：新增 ${stats.added}，跳过 ${stats.skipped}，失败 ${stats.failed}`);
  if (failures.length > 0) {
    console.info("失败明细：");
    for (const item of failures) {
      console.info(`  第 ${item.line} 行 ${item.studentNo || "(空学号)"} ${item.name || ""}：${item.reason}`);
    }
    process.exitCode = 1;
  }
}

main().catch(function (error) {
  console.error(`导入未完成：${error.message}`);
  process.exitCode = 1;
});
