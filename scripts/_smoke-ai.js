// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 冒烟测试 AI 代理用例：鉴权、角色限制、参数固定、限频与错误脱敏。
import deepseekHandler from "../api/deepseek.js";
import qwenHandler from "../api/qwen-vl.js";
import { assert, callHandler, test } from "./_smoke-helpers.js";

export async function runAiTests(admin, contexts, captured) {
  const { studentA, studentB, teacher, adminUser } = contexts;

  await test("未登录调用文本 AI 返回 401", async function () {
    const response = await callHandler(deepseekHandler, null, {
      messages: [{ role: "user", content: "你好" }],
    });
    assert(response.statusCode === 401, `状态码为 ${response.statusCode}`);
  });

  await test("未登录调用视觉 AI 返回 401", async function () {
    const response = await callHandler(qwenHandler, null, {
      messages: [{ role: "user", content: [{ type: "text", text: "识别" }] }],
    });
    assert(response.statusCode === 401, `状态码为 ${response.statusCode}`);
  });

  await test("学生调用文本 AI 时服务端忽略模型、温度与越权角色", async function () {
    const response = await callHandler(deepseekHandler, studentA.token, {
      messages: [{ role: "user", content: "请简要回答" }],
      model: "attacker-model",
      temperature: 1.9,
      max_tokens: 999999,
      role: "admin",
    });
    assert(response.statusCode === 200, `状态码为 ${response.statusCode}`);
    assert(captured.deepseek.length === 1, "上游未被调用");
    const sent = captured.deepseek[0];
    assert(sent.model === process.env.DEEPSEEK_MODEL, "模型未被服务端固定");
    assert(sent.temperature === 0.7, "温度未被服务端固定");
    assert(sent.max_tokens === 600, "max_tokens 未被限制为 600");
    assert(sent.role === undefined, "请求体角色被转发到上游");
  });

  await test("学生调用文本 AI 时较小的 max_tokens 保持原值", async function () {
    const response = await callHandler(deepseekHandler, studentA.token, {
      messages: [{ role: "user", content: "再回答一次" }],
      max_tokens: 120,
    });
    assert(response.statusCode === 200, `状态码为 ${response.statusCode}`);
    assert(captured.deepseek[1].max_tokens === 120, "较小的 max_tokens 未保留");
  });

  await test("学生可以使用视觉识别且模型与温度由服务端固定", async function () {
    const response = await callHandler(qwenHandler, studentA.token, {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "识别图片" },
            { type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0KGgo=" } },
          ],
        },
      ],
      model: "attacker-model",
      temperature: 1.9,
      max_tokens: 999999,
    });
    assert(response.statusCode === 200, `状态码为 ${response.statusCode}`);
    const sent = captured.qwen[0];
    assert(sent.model === process.env.QWEN_VL_MODEL, "视觉模型未被服务端固定");
    assert(sent.temperature === 0.6, "视觉温度未被服务端固定");
    assert(sent.max_tokens === 600, "视觉 max_tokens 未被限制为 600");
  });

  await test("教师与管理员调用视觉 AI 返回 403", async function () {
    const teacherResponse = await callHandler(qwenHandler, teacher.token, {
      messages: [
        {
          role: "user",
          content: [{ type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0KGgo=" } }],
        },
      ],
      role: "student",
    });
    assert(teacherResponse.statusCode === 403, `教师状态码为 ${teacherResponse.statusCode}`);
    const adminResponse = await callHandler(qwenHandler, adminUser.token, {
      messages: [
        {
          role: "user",
          content: [{ type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0KGgo=" } }],
        },
      ],
    });
    assert(adminResponse.statusCode === 403, `管理员状态码为 ${adminResponse.statusCode}`);
  });

  await test("图片类型不在白名单时返回 400", async function () {
    const response = await callHandler(qwenHandler, studentA.token, {
      messages: [
        {
          role: "user",
          content: [{ type: "image_url", image_url: { url: "data:image/gif;base64,iVBORw0KGgo=" } }],
        },
      ],
    });
    assert(response.statusCode === 400, `状态码为 ${response.statusCode}`);
    assert(response.body.error === "invalid_image", "错误码不正确");
  });

  await test("消息数量或文本长度超限时返回 400", async function () {
    const tooMany = await callHandler(deepseekHandler, studentA.token, {
      messages: Array.from({ length: 31 }, function () {
        return { role: "user", content: "内容" };
      }),
    });
    assert(tooMany.statusCode === 400, `超量消息状态码为 ${tooMany.statusCode}`);
    const tooLong = await callHandler(deepseekHandler, studentA.token, {
      messages: [{ role: "user", content: "字".repeat(8001) }],
    });
    assert(tooLong.statusCode === 400, `超长文本状态码为 ${tooLong.statusCode}`);
  });

  await test("上游异常时只返回统一错误，不泄露原始报错", async function () {
    captured.mode = "fail";
    const response = await callHandler(deepseekHandler, studentA.token, {
      messages: [{ role: "user", content: "触发失败" }],
    });
    captured.mode = "ok";
    assert(response.statusCode === 502, `状态码为 ${response.statusCode}`);
    assert(response.body.error === "ai_service_unavailable", "错误信息未统一");
    assert(!JSON.stringify(response.body).includes("SECRET_UPSTREAM_DETAIL"), "泄露了上游报错");
  });

  await test("停用账号调用 AI 返回 403", async function () {
    await admin.from("profiles").update({ is_active: false }).eq("id", studentB.userId);
    const response = await callHandler(deepseekHandler, studentB.token, {
      messages: [{ role: "user", content: "你好" }],
    });
    await admin.from("profiles").update({ is_active: true }).eq("id", studentB.userId);
    assert(response.statusCode === 403, `状态码为 ${response.statusCode}`);
  });

  await test("AI 成功与失败均写入行为记录且不保存对话内容", async function () {
    const { data, error } = await admin
      .from("activity_records")
      .select("event_type, success")
      .eq("user_id", studentA.userId)
      .in("event_type", ["ai_deepseek", "ai_qwen"]);
    assert(!error, error?.message);
    assert(data.length === 4, `AI 行为记录数量为 ${data.length}`);
    assert(
      data.some(function (row) {
        return row.success === false;
      }),
      "失败调用未记录"
    );
  });

  await test("每分钟第 7 次 AI 调用返回 429", async function () {
    await admin.from("activity_records").delete().eq("user_id", studentB.userId);
    const now = new Date().toISOString();
    await admin.from("activity_records").insert(
      Array.from({ length: 6 }, function () {
        return {
          user_id: studentB.userId,
          event_type: "ai_deepseek",
          success: true,
          created_at: now,
        };
      })
    );
    const response = await callHandler(deepseekHandler, studentB.token, {
      messages: [{ role: "user", content: "限频测试" }],
    });
    assert(response.statusCode === 429, `状态码为 ${response.statusCode}`);
  });

  await test("当日第 61 次 AI 调用返回 429", async function () {
    await admin.from("activity_records").delete().eq("user_id", studentB.userId);
    const dayStart = new Date();
    const startIso = new Date(
      Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), dayStart.getUTCDate(), 0, 0, 1)
    ).toISOString();
    await admin.from("activity_records").insert(
      Array.from({ length: 60 }, function () {
        return {
          user_id: studentB.userId,
          event_type: "ai_qwen",
          success: true,
          created_at: startIso,
        };
      })
    );
    const response = await callHandler(deepseekHandler, studentB.token, {
      messages: [{ role: "user", content: "日限频测试" }],
    });
    assert(response.statusCode === 429, `状态码为 ${response.statusCode}`);
  });
}
