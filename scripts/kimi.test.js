import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule } from "node:vm";
import { resolve, dirname } from "node:path";

const image = "data:image/png;base64,iVBORw0KGgo=";
const body = {
  messages: [
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: image } },
        { type: "text", text: "识别图片" },
      ],
    },
  ],
  max_tokens: 200,
};

async function fixture(options = {}) {
  const calls = [],
    logs = [],
    filters = [];
  const admin = {
    auth: { getUser: async () => ({ data: { user: { id: "student-1" } } }) },
    from(table) {
      const query = {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        in(column, values) {
          filters.push(values);
          return this;
        },
        gte() {
          return Promise.resolve({ count: options.count || 0 });
        },
        maybeSingle() {
          return Promise.resolve({
            data: { id: "student-1", role: options.role || "student", is_active: options.active !== false },
          });
        },
        async insert(row) {
          assert.equal(table, "activity_records");
          logs.push(row);
          return { error: null };
        },
      };
      return query;
    },
  };
  const modules = new Map();
  async function load(path) {
    if (modules.has(path)) return modules.get(path);
    let module;
    if (path.replace(/\\/g, "/").endsWith("/supabaseAdmin.js")) {
      module = new SyntheticModule(["getAdminClient"], function () {
        this.setExport("getAdminClient", () => admin);
      });
    } else {
      module = new SourceTextModule(await readFile(path, "utf8"), { identifier: path });
    }
    modules.set(path, module);
    await module.link((specifier, referencing) => load(resolve(dirname(referencing.identifier), specifier)));
    return module;
  }
  // Before migration this loads the old handler to prove the new contract fails.
  let entry = resolve("api/kimi-vl.js");
  try {
    await readFile(entry);
  } catch {
    entry = resolve("api/qwen-vl.js");
  }
  if (options.legacy) entry = resolve("api/qwen-vl.js");
  const module = await load(entry);
  await module.evaluate();
  process.env.MOONSHOT_API_KEY = "test-only-moonshot-key";
  process.env.KIMI_VL_MODEL = options.modelEnv || "kimi-k3.1-pro";
  delete process.env.DASHSCOPE_API_KEY;
  delete process.env.QWEN_VL_MODEL;
  if (options.noKey) delete process.env.MOONSHOT_API_KEY;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, headers: init.headers, body: JSON.parse(init.body) });
    if (options.networkError) throw new Error("SECRET_UPSTREAM_DETAIL");
    if (options.badJson) return new Response("not json");
    if (options.upstreamError) return new Response("SECRET_UPSTREAM_DETAIL", { status: 401 });
    return Response.json({ choices: [{ message: { content: "图片识别成功" } }] });
  };
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(n) {
      this.statusCode = n;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  try {
    await module.namespace.default(
      {
        method: options.method || "POST",
        headers: options.anonymous ? {} : { authorization: "Bearer test-token" },
        body: options.body || body,
      },
      res
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
  return { res, calls, logs, filters };
}

test("Kimi receives image, fixed credentials/model and bounded completion tokens", async () => {
  const { res, calls, logs } = await fixture({
    body: { ...body, model: "attacker", temperature: 2, thinking: { type: "enabled" }, max_tokens: 999999 },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.moonshot.cn/v1/chat/completions");
  assert.equal(calls[0].headers.Authorization, "Bearer test-only-moonshot-key");
  assert.equal(calls[0].body.model, "kimi-k3.1-pro");
  assert.equal(calls[0].body.reasoning_effort, "low");
  assert.equal(calls[0].body.max_completion_tokens, 1024);
  assert.equal(calls[0].body.temperature, undefined);
  assert.equal(calls[0].body.thinking, undefined);
  assert.equal(calls[0].body.max_tokens, undefined);
  assert.equal(calls[0].body.messages[0].content[0].image_url.url, image);
  assert.equal(res.body.choices[0].message.content, "图片识别成功");
  assert.deepEqual(logs, [{ user_id: "student-1", event_type: "ai_qwen", success: true }]);
});

test("legacy route forwards to Kimi and retains small output budget", async () => {
  const { res, calls } = await fixture({ legacy: true });
  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].url, "https://api.moonshot.cn/v1/chat/completions");
  assert.equal(calls[0].body.model, "kimi-k3.1-pro");
  assert.equal(calls[0].body.max_completion_tokens, 1024);
});

test("retired KIMI_VL_MODEL falls back to the current model", async () => {
  const { res, calls } = await fixture({ modelEnv: "kimi-k2.5" });
  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].body.model, "kimi-k3.1-pro");
});

for (const [name, options, status] of [
  ["missing key", { noKey: true }, 503],
  ["anonymous", { anonymous: true }, 401],
  ["teacher", { role: "teacher" }, 403],
  ["admin", { role: "admin" }, 403],
  ["inactive", { active: false }, 403],
  ["GET", { method: "GET" }, 405],
  ["rate limit", { count: 6 }, 429],
  [
    "invalid image",
    {
      body: {
        messages: [
          { role: "user", content: [{ type: "image_url", image_url: { url: "https://untrusted.invalid/image.png" } }] },
        ],
      },
    },
    400,
  ],
]) {
  test(`${name} rejects before upstream`, async () => {
    const { res, calls } = await fixture(options);
    assert.equal(res.statusCode, status);
    assert.equal(calls.length, 0);
  });
}
for (const kind of ["networkError", "upstreamError", "badJson"]) {
  test(`${kind} returns sanitized error and failed activity`, async () => {
    const { res, logs } = await fixture({ [kind]: true });
    assert.equal(res.statusCode, 502);
    assert.deepEqual(res.body, { error: "ai_service_unavailable" });
    assert.equal(logs.length, 1);
    assert.equal(logs[0].success, false);
  });
}
test("historical vision usage still counts toward limits", async () => {
  const { filters } = await fixture();
  assert.equal(filters.length, 2);
  assert.ok(filters.every((values) => values.includes("ai_qwen") && values.includes("ai_deepseek")));
});
test("analytics expose Kimi vision totals without losing historical events", async () => {
  const { summarizeActivityCounts, EVENT_LABELS } = await import("../src/api/analytics.js");
  const counts = summarizeActivityCounts([
    { event_type: "ai_qwen" },
    { event_type: "ai_deepseek" },
    { event_type: "case_study" },
  ]);
  assert.equal(counts.ai_kimi, 1);
  assert.equal(counts.total, 3);
  assert.equal(EVENT_LABELS.ai_qwen, "图像识别调用");
});
