// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 从 Supabase 实时汇总试点数据，生成汇报文档与名单 CSV，不填充任何模拟数字。
// 用法：node scripts/make-report.js

import fs from "node:fs";
import path from "node:path";
import { APP_NAME, APP_VERSION } from "../src/appInfo.js";
import {
  buildClassStats,
  buildMajorStats,
  buildRosterCsv,
  buildStudentRecords,
  buildTypeDistribution,
  computeDimensionAverages,
  formatDateTime,
  summarizeActivityCounts,
  topAndWeakDimensions,
} from "../src/api/analytics.js";
import { DIMS, dimMeta } from "../src/constants.js";
import { ROOT_DIR } from "./_env.js";
import { createAdminClient, fetchAllRows, listAllAuthUsers } from "./_supabase.js";

const REPORT_DIR = path.join(ROOT_DIR, "report");

function percent(part, total) {
  if (!total) return "暂无";
  return `${Math.round((part / total) * 1000) / 10}%`;
}

function table(headers, rows) {
  const head = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers
    .map(function () {
      return "---";
    })
    .join(" | ")} |`;
  const body = rows.map(function (row) {
    return `| ${row.join(" | ")} |`;
  });
  return [head, divider, ...body].join("\n");
}

function countLoggedIn(records, authMap) {
  return records.filter(function (record) {
    const user = authMap.get(record.id);
    return Boolean(user && user.last_sign_in_at);
  }).length;
}

function buildOverview(studentCount, staffCount) {
  return [
    `“${APP_NAME}”是面向高校国防类专业思政教育的教学应用，本版本为 ${APP_VERSION}。`,
    "系统以大国重器案例学习、每日问题、AI 问答与视觉识别为主要学习入口，并通过 16 题测评形成八维画像。",
    `当前试点共导入学生账号 ${studentCount} 个、教师与管理员账号 ${staffCount} 个，全部学习与测评数据保存在 Supabase 数据库中。`,
    "本汇报中的统计数字均来自数据库实时查询；无数据的项目统一标注为“暂无”，未使用任何模拟或估算值。",
  ].join("\n\n");
}

function buildScopeSection(records, authMap, staffCounts) {
  const total = records.length;
  const loggedIn = countLoggedIn(records, authMap);
  const assessed = records.filter(function (record) {
    return record.profile;
  }).length;
  const summary = [
    `- 学生账号总数：${total}`,
    `- 已登录人数：${loggedIn}（依据 auth.users.last_sign_in_at，登录率 ${percent(loggedIn, total)}）`,
    `- 已完成测评人数：${assessed}（占学生账号 ${percent(assessed, total)}，占已登录人数 ${percent(
      assessed,
      loggedIn
    )}）`,
    `- 教师账号：${staffCounts.teacher}；管理员账号：${staffCounts.admin}`,
  ].join("\n");

  const classGroups = new Map();
  records.forEach(function (record) {
    if (!classGroups.has(record.classCode)) {
      classGroups.set(record.classCode, { total: 0, loggedIn: 0, assessed: 0 });
    }
    const group = classGroups.get(record.classCode);
    group.total += 1;
    const user = authMap.get(record.id);
    if (user && user.last_sign_in_at) group.loggedIn += 1;
    if (record.profile) group.assessed += 1;
  });
  const classStats = buildClassStats(records).map(function (item) {
    const group = classGroups.get(item.className);
    return [
      item.className,
      String(item.total),
      String(group.loggedIn),
      String(item.assessed),
      percent(item.assessed, item.total),
    ];
  });

  const majorStats = buildMajorStats(records).map(function (item) {
    const group = records.filter(function (record) {
      return record.major === item.major;
    });
    return [
      item.major,
      String(item.students),
      String(countLoggedIn(group, authMap)),
      String(item.assessed),
      percent(item.assessed, item.students),
    ];
  });

  return [
    summary,
    "",
    "### 按班级参与情况",
    "",
    records.length ? table(["班级", "学生数", "已登录", "完成测评", "测评完成率"], classStats) : "暂无班级数据。",
    "",
    "### 按专业参与情况",
    "",
    records.length ? table(["专业", "学生数", "已登录", "完成测评", "测评完成率"], majorStats) : "暂无专业数据。",
  ].join("\n");
}

function buildAssessmentSection(records) {
  const assessed = records.filter(function (record) {
    return record.profile;
  });
  if (assessed.length === 0) {
    return "暂无测评数据。";
  }
  const averages = computeDimensionAverages(records);
  const dimensionRows = averages.map(function (item) {
    return [dimMeta[item.dim].name, item.avg === null ? "暂无" : item.avg.toFixed(1)];
  });
  const distribution = buildTypeDistribution(records);
  const distributionRows = distribution.map(function (item) {
    return [item.cn, String(item.count), percent(item.count, assessed.length)];
  });
  const ranking = topAndWeakDimensions(averages, 3);
  const topText = ranking.hasData
    ? ranking.top
        .map(function (item) {
          return `${item.name}（${item.avg.toFixed(1)}）`;
        })
        .join("、")
    : "暂无";
  const weakText = ranking.hasData
    ? ranking.weak
        .map(function (item) {
          return `${item.name}（${item.avg.toFixed(1)}）`;
        })
        .join("、")
    : "暂无";

  return [
    "以下平均分按每位学生最近一次测评计算，分数取值范围为 1-10。",
    "",
    "### 八维平均分",
    "",
    table(["维度", "平均分"], dimensionRows),
    "",
    "### 画像类型分布",
    "",
    distribution.length ? table(["画像类型", "人数", "占已测评人数"], distributionRows) : "暂无画像分布数据。",
    "",
    "### 优势与薄弱维度",
    "",
    `- 平均分最高的三个维度：${topText}`,
    `- 平均分最低的三个维度：${weakText}`,
    "",
    `维度代码：${DIMS.map(function (dim) {
      return `${dim}（${dimMeta[dim].name}）`;
    }).join("、")}`,
  ].join("\n");
}

function buildActivitySection(activities) {
  const counts = summarizeActivityCounts(activities);
  return [
    "学习行为只统计次数与事件类型，不保存 AI 对话内容、学生回答文本或上传图片。",
    "",
    table(
      ["行为类型", "累计次数"],
      [
        ["案例学习", String(counts.case_study)],
        ["每日问题", String(counts.daily_question)],
        ["DeepSeek 文本 AI 调用", String(counts.ai_deepseek)],
        ["千问视觉 AI 调用", String(counts.ai_qwen)],
        ["合计", String(counts.total)],
      ]
    ),
  ].join("\n");
}

function buildSystemSection() {
  return [
    "系统采用 React + Vite 前端、Vercel Serverless 函数与 Supabase（PostgreSQL + Auth）后端。",
    "",
    "- 学生端：案例学习、每日问题、AI 问答、拍照识别、16 题测评、个人画像与历史记录。",
    "- 教师端：查看学生名单、测评结果、八维统计、学习行为与班级完成情况，可导出名单数据。",
    "- 管理端：在学生端数据基础上增加学校层面的汇总视图，可按班级、专业查看参与情况。",
    "- 权限控制：数据库启用行级安全策略；学生只能读取自己的资料与记录，教师和管理员只能读取、不能改写业务数据。",
    "- 数据安全：AI 请求由服务端代理，模型与密钥不出现在浏览器；AI 对话、答案、上传图片与识别结果均不落库。",
  ].join("\n");
}

async function main() {
  const admin = createAdminClient();
  const [profiles, assessments, activities, authUsers] = await Promise.all([
    fetchAllRows(function () {
      return admin.from("profiles").select("*").order("login_id", { ascending: true });
    }),
    fetchAllRows(function () {
      return admin.from("assessment_results").select("*").order("created_at", { ascending: true });
    }),
    fetchAllRows(function () {
      return admin.from("activity_records").select("*").order("created_at", { ascending: true });
    }),
    listAllAuthUsers(admin),
  ]);

  const authMap = new Map();
  authUsers.forEach(function (user) {
    authMap.set(user.id, user);
  });
  const studentProfiles = profiles.filter(function (profile) {
    return profile.role === "student";
  });
  const staffCounts = {
    teacher: profiles.filter(function (profile) {
      return profile.role === "teacher";
    }).length,
    admin: profiles.filter(function (profile) {
      return profile.role === "admin";
    }).length,
  };
  const studentIds = new Set(
    studentProfiles.map(function (profile) {
      return profile.id;
    })
  );
  const studentAssessments = assessments.filter(function (row) {
    return studentIds.has(row.user_id);
  });
  const studentActivities = activities.filter(function (row) {
    return studentIds.has(row.user_id);
  });
  const records = buildStudentRecords(studentProfiles, studentAssessments, studentActivities);
  const generatedAt = formatDateTime(new Date().toISOString());

  const report = [
    `# ${APP_NAME} ${APP_VERSION} 试点运行汇报`,
    "",
    `生成时间：${generatedAt}`,
    "",
    "## 一、项目概述",
    "",
    buildOverview(studentProfiles.length, staffCounts.teacher + staffCounts.admin),
    "",
    "## 二、试点范围",
    "",
    buildScopeSection(records, authMap, staffCounts),
    "",
    "## 三、测评结果",
    "",
    buildAssessmentSection(records),
    "",
    "## 四、学习行为",
    "",
    buildActivitySection(studentActivities),
    "",
    "## 五、系统说明",
    "",
    buildSystemSection(),
    "",
    "## 六、数据来源与生成时间",
    "",
    `- 数据来源：Supabase 数据库（profiles、assessment_results、activity_records、auth.users）。`,
    "- 统计口径：测评结果按每位学生最近一次记录计算；登录状态依据 auth.users.last_sign_in_at。",
    `- 生成时间：${generatedAt}`,
    "- 本文件不包含教师或管理员密码，不包含 AI 对话内容、学生回答文本或图片。",
    "",
  ].join("\n");

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, "汇报.md");
  const csvPath = path.join(REPORT_DIR, "名单数据.csv");
  fs.writeFileSync(reportPath, report, "utf8");
  fs.writeFileSync(csvPath, buildRosterCsv(records), "utf8");

  console.info(`汇报已生成：${path.relative(ROOT_DIR, reportPath)}`);
  console.info(`名单数据已生成：${path.relative(ROOT_DIR, csvPath)}（仅本机保存，不提交版本库）`);
  console.info(
    `学生账号 ${records.length}，已登录 ${countLoggedIn(records, authMap)}，已测评 ${
      records.filter(function (record) {
        return record.profile;
      }).length
    }`
  );
}

main().catch(function (error) {
  console.error(`生成汇报失败：${error.message}`);
  process.exitCode = 1;
});
