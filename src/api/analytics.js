// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 基于数据库记录生成教师端与学校端统计，不保留任何模拟或估算指标。

import { CASES, CASE_ORDER, DIMS, TYPES, dimMeta, toLevel } from "../constants.js";

export const EVENT_LABELS = {
  case_study: "案例学习",
  daily_question: "每日问题",
  ai_deepseek: "DeepSeek 调用",
  ai_qwen: "千问 VL 调用",
};

export function formatDateTime(value) {
  if (!value) return "暂无";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "暂无";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value) {
  if (!value) return "暂无";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "暂无";
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function buildProfileFromAssessment(row) {
  const scores = row?.scores || {};
  const raw = {};
  const lvls = {};
  DIMS.forEach(function (dim) {
    raw[dim] = Number(scores.raw?.[dim]) || 0;
    lvls[dim] = scores.lvls?.[dim] || toLevel(raw[dim]);
  });
  return {
    raw,
    lvls,
    final: TYPES[row?.profile_type] || TYPES.GROW,
    matchInfo: scores.matchInfo || `测评记录 · ${formatDate(row?.created_at)}`,
    createdAt: row?.created_at || null,
  };
}

export function latestAssessmentByUser(assessments) {
  const map = new Map();
  assessments.forEach(function (row) {
    const current = map.get(row.user_id);
    if (!current || new Date(row.created_at) >= new Date(current.created_at)) {
      map.set(row.user_id, row);
    }
  });
  return map;
}

export function buildStudentRecords(profiles, assessments, activities) {
  const latestMap = latestAssessmentByUser(assessments);
  return profiles
    .map(function (profile) {
      const ownAssessments = assessments
        .filter(function (row) {
          return row.user_id === profile.id;
        })
        .sort(function (a, b) {
          return new Date(b.created_at) - new Date(a.created_at);
        });
      const ownActivities = activities.filter(function (row) {
        return row.user_id === profile.id;
      });
      const latest = latestMap.get(profile.id) || null;
      return {
        id: profile.id,
        loginId: profile.login_id,
        name: profile.name,
        classCode: profile.class_code || "未分班",
        major: profile.major || "未填写专业",
        groupName: profile.group_name || "",
        assessments: ownAssessments,
        latestAssessment: latest,
        profile: latest ? buildProfileFromAssessment(latest) : null,
        activities: ownActivities,
        activityCounts: summarizeActivityCounts(ownActivities),
      };
    })
    .sort(function (a, b) {
      return a.loginId.localeCompare(b.loginId);
    });
}

export function summarizeActivityCounts(activities) {
  const counts = { case_study: 0, daily_question: 0, ai_deepseek: 0, ai_qwen: 0 };
  activities.forEach(function (row) {
    if (counts[row.event_type] !== undefined) counts[row.event_type] += 1;
  });
  counts.total = counts.case_study + counts.daily_question + counts.ai_deepseek + counts.ai_qwen;
  return counts;
}

export function computeDimensionAverages(studentRecords) {
  const assessed = studentRecords.filter(function (student) {
    return student.profile;
  });
  return DIMS.map(function (dim) {
    if (assessed.length === 0) {
      return { dim, name: dimMeta[dim].name, avg: null };
    }
    const sum = assessed.reduce(function (total, student) {
      return total + (student.profile.raw[dim] || 0);
    }, 0);
    return {
      dim,
      name: dimMeta[dim].name,
      avg: Math.round((sum / assessed.length) * 10) / 10,
    };
  });
}

export function buildTypeDistribution(studentRecords) {
  const counts = new Map();
  studentRecords.forEach(function (student) {
    if (!student.profile) return;
    const code = student.profile.final.code;
    counts.set(code, (counts.get(code) || 0) + 1);
  });
  return Object.values(TYPES)
    .map(function (type) {
      return {
        code: type.code,
        cn: type.cn,
        color: type.color,
        count: counts.get(type.code) || 0,
      };
    })
    .filter(function (item) {
      return item.count > 0;
    });
}

export function buildClassStats(studentRecords) {
  const groups = new Map();
  studentRecords.forEach(function (student) {
    const key = student.classCode;
    if (!groups.has(key)) {
      groups.set(key, { className: key, students: [], assessed: [] });
    }
    const group = groups.get(key);
    group.students.push(student);
    if (student.profile) group.assessed.push(student);
  });
  return Array.from(groups.values())
    .map(function (group) {
      const typeCounts = new Map();
      group.assessed.forEach(function (student) {
        const code = student.profile.final.code;
        typeCounts.set(code, (typeCounts.get(code) || 0) + 1);
      });
      let dominant = "暂无";
      let dominantCount = 0;
      typeCounts.forEach(function (count, code) {
        if (count > dominantCount) {
          dominantCount = count;
          dominant = TYPES[code]?.cn || "暂无";
        }
      });
      return {
        className: group.className,
        total: group.students.length,
        assessed: group.assessed.length,
        participation: group.students.length ? Math.round((group.assessed.length / group.students.length) * 100) : 0,
        dominant,
      };
    })
    .sort(function (a, b) {
      return a.className.localeCompare(b.className);
    });
}

export function buildMajorStats(studentRecords) {
  const groups = new Map();
  studentRecords.forEach(function (student) {
    if (!groups.has(student.major)) {
      groups.set(student.major, { major: student.major, students: 0, assessed: 0 });
    }
    const group = groups.get(student.major);
    group.students += 1;
    if (student.profile) group.assessed += 1;
  });
  return Array.from(groups.values())
    .map(function (group) {
      return {
        ...group,
        participation: group.students ? Math.round((group.assessed / group.students) * 100) : 0,
      };
    })
    .sort(function (a, b) {
      return a.major.localeCompare(b.major);
    });
}

export function startOfWeek(date) {
  const value = new Date(date);
  const day = value.getDay() || 7;
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - day + 1);
  return value;
}

export function buildWeeklyAssessments(assessments, weekCount) {
  const totalWeeks = weekCount || 4;
  const currentWeek = startOfWeek(new Date());
  const buckets = [];
  for (let i = totalWeeks - 1; i >= 0; i -= 1) {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    buckets.push({
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      start,
      end,
      count: 0,
    });
  }
  assessments.forEach(function (row) {
    const time = new Date(row.created_at).getTime();
    buckets.forEach(function (bucket) {
      if (time >= bucket.start.getTime() && time < bucket.end.getTime()) {
        bucket.count += 1;
      }
    });
  });
  return buckets;
}

export function buildTopicHeat(activities) {
  const counts = new Map();
  activities.forEach(function (row) {
    if (row.event_type !== "case_study" || !row.reference_id) return;
    const topic = CASES[row.reference_id]?.tags?.[0];
    if (!topic) return;
    counts.set(topic, (counts.get(topic) || 0) + 1);
  });
  const maxCount = Math.max(0, ...counts.values());
  if (maxCount === 0) return [];
  const palette = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#06b6d4", "#a855f7"];
  return Array.from(counts.entries())
    .sort(function (a, b) {
      return b[1] - a[1];
    })
    .slice(0, 5)
    .map(function ([topic, count], index) {
      return {
        topic,
        count,
        heat: Math.round((count / maxCount) * 100),
        color: palette[index % palette.length],
      };
    });
}

export function buildCaseCoverage(activities) {
  const covered = new Set();
  activities.forEach(function (row) {
    if (row.event_type === "case_study" && row.reference_id && CASES[row.reference_id]) {
      covered.add(row.reference_id);
    }
  });
  return { covered: covered.size, total: CASE_ORDER.length };
}

export function topAndWeakDimensions(averages, limit) {
  const valid = averages.filter(function (item) {
    return item.avg !== null;
  });
  const sorted = valid.slice().sort(function (a, b) {
    return b.avg - a.avg;
  });
  return {
    top: sorted.slice(0, limit || 3),
    weak: sorted.slice(-(limit || 3)).reverse(),
    hasData: valid.length > 0,
  };
}

function csvCell(value) {
  const text = String(value == null ? "" : value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function buildRosterCsv(studentRecords) {
  const header = ["学号", "姓名", "班级", "专业", "是否完成测评", "画像类型", "八维分数", "最近测评时间"];
  const lines = [header.map(csvCell).join(",")];
  studentRecords.forEach(function (student) {
    const profile = student.profile;
    const scores = profile
      ? DIMS.map(function (dim) {
          return `${dim}:${profile.raw[dim]}`;
        }).join(";")
      : "";
    lines.push(
      [
        student.loginId,
        student.name,
        student.classCode,
        student.major,
        profile ? "是" : "否",
        profile ? profile.final.cn : "暂无",
        scores,
        profile ? formatDateTime(profile.createdAt) : "暂无",
      ]
        .map(csvCell)
        .join(",")
    );
  });
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
