// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 基于数据库活动记录的 AI 调用限频，避免 Serverless 内存状态不可靠。

const AI_EVENT_TYPES = ["ai_deepseek", "ai_qwen"];
const PER_MINUTE_LIMIT = 6;
const PER_DAY_LIMIT = 60;

function startOfDay() {
  // 以北京时间零点为每日限频的起算点，避免用户在凌晨遇到未重置的额度。
  const offset = 8 * 60 * 60 * 1000;
  const local = new Date(Date.now() + offset);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - offset).toISOString();
}

async function countCalls(admin, userId, since) {
  const { count, error } = await admin
    .from("activity_records")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("event_type", AI_EVENT_TYPES)
    .gte("created_at", since);
  if (error) return null;
  return count || 0;
}

export async function checkRateLimit(admin, userId) {
  const minuteSince = new Date(Date.now() - 60 * 1000).toISOString();
  const [minuteCount, dayCount] = await Promise.all([
    countCalls(admin, userId, minuteSince),
    countCalls(admin, userId, startOfDay()),
  ]);
  if (minuteCount === null || dayCount === null) {
    return { allowed: false, status: 503, error: "service_unavailable" };
  }
  if (minuteCount >= PER_MINUTE_LIMIT || dayCount >= PER_DAY_LIMIT) {
    return { allowed: false, status: 429, error: "rate_limited" };
  }
  return { allowed: true };
}

export async function logAiActivity(admin, userId, eventType, success) {
  try {
    await admin.from("activity_records").insert({
      user_id: userId,
      event_type: eventType,
      success: Boolean(success),
    });
  } catch {
    // 记录失败不影响本次响应，也不向客户端暴露内部错误。
  }
}
