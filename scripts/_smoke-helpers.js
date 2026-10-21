// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 冒烟测试公共工具：断言、用例执行器与无框架 HTTP 响应模拟。

export const results = { passed: 0, failed: 0, failures: [] };

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function test(name, operation) {
  try {
    await operation();
    results.passed += 1;
    console.info(`通过：${name}`);
  } catch (error) {
    results.failed += 1;
    results.failures.push({ name, message: error.message });
    console.info(`失败：${name} -> ${error.message}`);
  }
}

export function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

export async function callHandler(handler, token, body) {
  const response = mockResponse();
  const request = {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  };
  await handler(request, response);
  return response;
}
