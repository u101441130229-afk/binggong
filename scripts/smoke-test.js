// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 端到端冒烟测试：验证登录、行级安全隔离、AI 代理鉴权与限频，结束后清理测试数据。
// 用法：node scripts/smoke-test.js

import crypto from "node:crypto";
import { loginIdToEmail } from "../src/api/loginId.js";
import { loadEnvFile } from "./_env.js";
import { assert, results, test } from "./_smoke-helpers.js";
import { runAiTests } from "./_smoke-ai.js";
import { runRlsTests } from "./_smoke-rls.js";
import { createAdminClient, createAnonClient } from "./_supabase.js";

const createdUserIds = [];
let originalFetch = null;

async function createTestUser(admin, role, loginId, name, password) {
  const { data, error } = await admin.auth.admin.createUser({
    email: loginIdToEmail(loginId),
    password,
    email_confirm: true,
    user_metadata: { login_id: loginId, name },
  });
  if (error) throw new Error(`创建测试账号失败：${error.message}`);
  createdUserIds.push(data.user.id);
  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    login_id: loginId,
    name,
    role,
    class_code: role === "student" ? "26110101" : null,
    major: role === "student" ? "弹药工程与爆炸技术" : null,
    is_active: true,
  });
  if (profileError) throw new Error(`创建测试资料失败：${profileError.message}`);
  return data.user.id;
}

async function signIn(loginId, password) {
  const client = createAnonClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: loginIdToEmail(loginId),
    password,
  });
  if (error) throw new Error(`登录失败：${error.message}`);
  return { client, token: data.session.access_token, userId: data.user.id };
}

function installUpstreamStub() {
  const captured = { deepseek: [], qwen: [], mode: "ok" };
  originalFetch = globalThis.fetch;
  globalThis.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input.url;
    const isDeepseek = url.includes("api.deepseek.com");
    const isQwen = url.includes("dashscope.aliyuncs.com");
    if (!isDeepseek && !isQwen) return originalFetch(input, init);
    captured[isDeepseek ? "deepseek" : "qwen"].push(JSON.parse(init.body));
    if (captured.mode === "fail") {
      return new Response(JSON.stringify({ error: { message: "SECRET_UPSTREAM_DETAIL" } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ choices: [{ message: { content: "测试回复" } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  return captured;
}

async function main() {
  loadEnvFile();
  process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "smoke-test-key";
  process.env.DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || "smoke-test-key";
  process.env.DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-flash";
  process.env.QWEN_VL_MODEL = process.env.QWEN_VL_MODEL || "qwen3.7-plus";

  const admin = createAdminClient();
  const stamp = Date.now().toString(36);
  // 测试密码由随机字节生成，末尾字符仅用于满足密码复杂度，不是真实凭据。
  const password = crypto.randomBytes(24).toString("base64url") + String.fromCharCode(33, 65, 97, 49);
  const loginIds = {
    studentA: `smokea${stamp}`,
    studentB: `smokeb${stamp}`,
    teacher: `smoket${stamp}`,
    admin: `smokem${stamp}`,
  };

  const contexts = {};
  let captured = null;

  try {
    contexts.studentA = {
      userId: await createTestUser(admin, "student", loginIds.studentA, "冒烟学生甲", password),
    };
    contexts.studentB = {
      userId: await createTestUser(admin, "student", loginIds.studentB, "冒烟学生乙", password),
    };
    contexts.teacher = {
      userId: await createTestUser(admin, "teacher", loginIds.teacher, "冒烟教师", password),
    };
    contexts.adminUser = {
      userId: await createTestUser(admin, "admin", loginIds.admin, "冒烟管理员", password),
    };

    const studentASession = await signIn(loginIds.studentA, password);
    const studentBSession = await signIn(loginIds.studentB, password);
    const teacherSession = await signIn(loginIds.teacher, password);
    const adminSession = await signIn(loginIds.admin, password);
    Object.assign(contexts.studentA, studentASession);
    Object.assign(contexts.studentB, studentBSession);
    Object.assign(contexts.teacher, teacherSession);
    Object.assign(contexts.adminUser, adminSession);
    contexts.adminClient = adminSession.client;

    console.info("开始执行冒烟测试：登录与行级安全");
    await test("学号与初始密码相同时可以登录", async function () {
      const loginId = `smokei${stamp}`;
      const initialUserId = await createTestUser(admin, "student", loginId, "冒烟新生", loginId);
      const session = await signIn(loginId, loginId);
      assert(session.userId === initialUserId, "登录后的账号与测试账号不一致");
      await session.client.auth.signOut();
    });

    await test("错误密码与不存在账号返回相同提示", async function () {
      const wrongClient = createAnonClient();
      const wrongPassword = await wrongClient.auth.signInWithPassword({
        email: loginIdToEmail(loginIds.studentA),
        password: `${password}Wrong`,
      });
      const missingClient = createAnonClient();
      const missingAccount = await missingClient.auth.signInWithPassword({
        email: loginIdToEmail(`notexist${stamp}`),
        password,
      });
      assert(Boolean(wrongPassword.error), "错误密码未报错");
      assert(Boolean(missingAccount.error), "不存在账号未报错");
      assert(
        wrongPassword.error.message === missingAccount.error.message,
        `两条提示不一致：${wrongPassword.error.message} / ${missingAccount.error.message}`
      );
    });

    await runRlsTests(admin, contexts);

    console.info("开始执行冒烟测试：AI 代理");
    captured = installUpstreamStub();
    await runAiTests(admin, contexts, captured);
  } finally {
    if (originalFetch) globalThis.fetch = originalFetch;
    if (createdUserIds.length > 0) {
      await admin.from("activity_records").delete().in("user_id", createdUserIds);
      await admin.from("assessment_results").delete().in("user_id", createdUserIds);
      await admin.from("profiles").delete().in("id", createdUserIds);
      for (const userId of createdUserIds) {
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) console.error(`清理测试账号失败 ${userId}：${error.message}`);
      }
    }
    const leftovers = await admin
      .from("profiles")
      .select("id")
      .in("id", createdUserIds.length > 0 ? createdUserIds : [crypto.randomUUID()]);
    console.info(`测试数据清理完成，残留资料 ${leftovers.data ? leftovers.data.length : 0} 条`);
  }

  console.info("");
  console.info(`冒烟测试结果：通过 ${results.passed}，失败 ${results.failed}`);
  if (results.failures.length > 0) {
    for (const failure of results.failures) {
      console.info(`  ${failure.name}：${failure.message}`);
    }
    process.exitCode = 1;
  }
}

main().catch(function (error) {
  console.error(`冒烟测试未完成：${error.message}`);
  process.exitCode = 1;
});
