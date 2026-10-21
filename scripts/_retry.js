// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// Supabase 管理接口重试工具：仅对限频、服务端错误与网络波动退避重试。

export function delay(milliseconds) {
  return new Promise(function (resolve) {
    setTimeout(resolve, milliseconds);
  });
}

export function isRetryable(error) {
  if (!error) return false;
  if (error.status === 429 || (error.status >= 500 && error.status < 600)) return true;
  return /rate limit|too many requests|fetch failed|timeout|timed out/i.test(error.message || "");
}

export function isAlreadyExists(error) {
  return /already registered|already exists|email_exists|user_already_exists/i.test(
    error && error.message ? error.message : ""
  );
}

export async function callWithRetry(operation, label, maxAttempts = 5) {
  let lastResult = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await operation();
      if (!result.error) return result;
      lastResult = result;
    } catch (error) {
      lastResult = { data: null, error: { message: error.message, status: error.status } };
    }
    if (!isRetryable(lastResult.error) || attempt === maxAttempts) return lastResult;
    const wait = 1000 * 2 ** (attempt - 1);
    console.info(`${label} 触发限频或网络波动，${wait / 1000} 秒后重试（${attempt}/${maxAttempts}）`);
    await delay(wait);
  }
  return lastResult;
}
