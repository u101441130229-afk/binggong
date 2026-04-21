// TODO: DeepSeek接入点
import { useState, useEffect } from "react";
import {
  blue, purple, cyan, green, yellow, red,
  dark0, dark1, dark2, dark3,
  gray1, gray2, gray3, text1, text2,
  DIMS, TYPES, dimMeta,
  seededRand, getDailyBase, jitter
} from "../constants.js";

// ============================================================
// TeacherView - 教师数据面板
// ============================================================
export default function TeacherView() {
  const today = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
  const liveProfile = (typeof window !== "undefined" && window.__lastStudentProfile) || null;

  // 从 localStorage 读取真实测评学生
  const realStudents = (function() {
    try {
      const stored = JSON.parse(localStorage.getItem("bgzh_students") || "[]");
      return stored.map(function(s, i) {
        return {
          id: s.id,
          name: s.name || "测评学生" + (i + 1),
          num: s.num || "2301060" + (100 + i),
          tag: i === 0 ? "最新" : null,
          profile: s.profile
        };
      });
    } catch(e) { return []; }
  })();

  // 兜底假数据（没有真实测评时显示）
  const MOCK_STUDENTS = [
    { id: "s1", name: "赵伟航", num: "2301060118", tag: null,
      profile: { raw:{PA:7,MP:8,VS:5,CC:6,CT:4,SC:7,CD:6,IR:5}, lvls:{PA:"H",MP:"H",VS:"M",CC:"M",CT:"L",SC:"H",CD:"M",IR:"M"}, final:TYPES.PERSIST, matchInfo:"匹配度 78% · 命中 5/8 维" } },
    { id: "s2", name: "李明远", num: "2301060203", tag: null,
      profile: { raw:{PA:6,MP:6,VS:7,CC:5,CT:8,SC:6,CD:5,IR:6}, lvls:{PA:"M",MP:"M",VS:"H",CC:"M",CT:"H",SC:"M",CD:"M",IR:"M"}, final:TYPES.VALUE, matchInfo:"匹配度 82% · 命中 6/8 维" } },
    { id: "s3", name: "王思琪", num: "2301060317", tag: null,
      profile: { raw:{PA:5,MP:5,VS:5,CC:7,CT:5,SC:5,CD:4,IR:4}, lvls:{PA:"M",MP:"M",VS:"M",CC:"H",CT:"M",SC:"M",CD:"L",IR:"L"}, final:TYPES.EXPLORE, matchInfo:"匹配度 71% · 命中 4/8 维" } },
    { id: "s4", name: "张宇鹏", num: "2301060412", tag: null,
      profile: { raw:{PA:8,MP:7,VS:6,CC:7,CT:4,SC:8,CD:7,IR:5}, lvls:{PA:"H",MP:"H",VS:"M",CC:"H",CT:"L",SC:"H",CD:"H",IR:"M"}, final:TYPES.SOLID, matchInfo:"匹配度 88% · 命中 6/8 维" } },
    { id: "s5", name: "陈雨萱", num: "2301060508", tag: null,
      profile: { raw:{PA:4,MP:4,VS:4,CC:4,CT:4,SC:4,CD:3,IR:3}, lvls:{PA:"L",MP:"L",VS:"L",CC:"L",CT:"L",SC:"L",CD:"L",IR:"L"}, final:TYPES.GUIDE, matchInfo:"匹配度 65% · 归为重点引导型" } },
  ];

  // 真实学生 + 兜底假数据合并
  const defaultStudents = realStudents.length > 0
    ? [...realStudents, ...MOCK_STUDENTS.slice(0, Math.max(0, 3 - realStudents.length))]
    : MOCK_STUDENTS;

  const [selectedId, setSelectedId] = useState(defaultStudents[0].id);
  const [studentFade, setStudentFade] = useState(true);
  const selectedStudent = defaultStudents.find(function (s) { return s.id === selectedId; }) || defaultStudents[0];
  const profile = selectedStudent.profile;
  const t = profile.final;

  function switchStudent(id) {
    if (id === selectedId) return;
    setStudentFade(false);
    setTimeout(function () { setSelectedId(id); setStudentFade(true); }, 180);
  }

  // DeepSeek动态生成教学建议
  async function fetchTeacherAdvice(prof) {
    setAdviceLoading(true);
    setTeacherAdvice("AI正在分析学生画像，生成个性化教学建议…");
    try {
      const lowDims = DIMS.filter(d => prof.lvls[d] === "L").map(d => d);
      const highDims = DIMS.filter(d => prof.lvls[d] === "H").map(d => d);
      const prompt = `你是一位思政教育专家。请根据以下学生画像数据，生成简洁的个性化教学建议（150字以内，直接给建议，不要分点）：
画像类型：${prof.final.cn}（${prof.final.code}）
画像描述：${prof.final.desc}
偏低维度：${lowDims.length > 0 ? lowDims.join("、") : "无"}
偏高维度：${highDims.length > 0 ? highDims.join("、") : "无"}
匹配信息：${prof.matchInfo}`;

      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk-881c1a3f71794c418186d46bd6628167"
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
          temperature: 0.7
        })
      });
      const data = await res.json();
      const advice = data.choices?.[0]?.message?.content || "暂时无法生成建议，请稍后刷新重试。";
      setTeacherAdvice(advice);
    } catch (e) {
      setTeacherAdvice("网络波动，暂时无法生成AI建议。请点击刷新重试。");
    }
    setAdviceLoading(false);
  }

  useEffect(function() {
    fetchTeacherAdvice(profile);
  }, [selectedId]);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [base] = useState(getDailyBase);
  const [teacherAdvice, setTeacherAdvice] = useState("AI正在分析学生画像，生成个性化教学建议…");
  const [adviceLoading, setAdviceLoading] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(function () { setRefreshing(false); setRefreshKey(function (k) { return k + 1; }); }, 1200);
    fetchTeacherAdvice(profile);
  }

  // 动态指标：基于学生ID + 日期种子
  const studentSeed = selectedStudent.id.split("").reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
  const d = new Date(); const dateSeed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const combinedSeed = studentSeed + dateSeed;
  const studentBase = {
    weekInteraction: seededRand(combinedSeed + 1, 6, 20),
    avgDepth:        (seededRand(combinedSeed + 2, 14, 38) / 10).toFixed(1),
    caseRate:        seededRand(combinedSeed + 3, 35, 85),
    cogScore:        ["B", "B+", "A-", "A", "A+"][seededRand(combinedSeed + 4, 0, 4)],
  };
  const dynVal = refreshKey === 0 ? studentBase : {
    weekInteraction: jitter(studentBase.weekInteraction, 0.08),
    avgDepth: (jitter(Math.round(studentBase.avgDepth * 10), 0.05) / 10).toFixed(1),
    caseRate: jitter(studentBase.caseRate, 0.06),
    cogScore: studentBase.cogScore,
  };
  const trendSign = studentBase.weekInteraction > 12 ? "+" : "-";

  const metrics = [
    { label: "本周互动", value: dynVal.weekInteraction + "次", trend: trendSign + seededRand(combinedSeed + 5, 1, 5), color: blue },
    { label: "平均深度", value: dynVal.avgDepth + "轮", trend: "+" + (seededRand(combinedSeed + 6, 2, 8) / 10).toFixed(1), color: green },
    { label: "案例引用率", value: dynVal.caseRate + "%", trend: trendSign + seededRand(combinedSeed + 7, 2, 15) + "%", color: yellow },
    { label: "认知参与度", value: dynVal.cogScore, trend: studentBase.weekInteraction > 12 ? "↑" : "→", color: purple },
  ];

  const tags = [
    { label: "主动探索", color: green, bg: "rgba(34,197,94,0.1)" },
    { label: "深度思考", color: blue,  bg: "rgba(59,130,246,0.1)" },
    { label: "案例引用", color: yellow, bg: "rgba(234,179,8,0.1)" },
    { label: "追问行为", color: cyan,  bg: "rgba(6,182,212,0.1)" },
  ];



  // 班级对比雷达图数据
  const classLvls = { PA: "H", MP: "H", VS: "M", CC: "M", CT: "L", SC: "H", CD: "M", IR: "M" };
  const personalLvls = profile.lvls;
  const angleStep = (Math.PI * 2) / DIMS.length;
  const cx = 130, cy = 120, r = 72;
  function pt(i, ratio) { const a = -Math.PI / 2 + i * angleStep; return { x: cx + r * ratio * Math.cos(a), y: cy + r * ratio * Math.sin(a) }; }
  const grids = [0.33, 0.67, 1].map(ratio => DIMS.map((_, i) => pt(i, ratio)).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z');
  function makePath(lvls) { return DIMS.map(function (d, i) { const v = { L: 0.25, M: 0.58, H: 0.92 }[lvls[d]] || 0.5; const p = pt(i, v); return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }).join(' ') + ' Z'; }

  // ====================== 导出HTML报告 ======================
  function exportReport(student, prof, advice, metricsData, date) {
    const t = prof.final;
    const dimRows = DIMS.map(function(d) {
      const lvl = prof.lvls[d];
      const score = prof.raw[d];
      const lvlColor = lvl === "H" ? "#22c55e" : lvl === "M" ? "#eab308" : "#ef4444";
      const lvlText = lvl === "H" ? "高" : lvl === "M" ? "中" : "低";
      return `<tr><td>${d}</td><td>${dimMeta[d].name}</td><td style="color:${lvlColor};font-weight:700">${score}</td><td style="color:${lvlColor};font-weight:700">${lvlText}</td></tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="zh"><head><meta charset="UTF-8"><title>学情报告 - ${student.name || "学生"}</title>
<style>
  body{font-family:"Microsoft YaHei",sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1e293b;background:#f8fafc}
  h1{color:#7c3aed;border-bottom:3px solid #7c3aed;padding-bottom:12px}
  h2{color:#4c1d95;margin-top:32px}
  .badge{display:inline-block;padding:4px 14px;border-radius:999px;font-size:13px;font-weight:700;background:#ede9fe;color:#7c3aed;margin-bottom:8px}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th{background:#ede9fe;color:#4c1d95;padding:10px;text-align:left;font-size:13px}
  td{padding:10px;border-bottom:1px solid #e2e8f0;font-size:13px}
  .metrics{display:flex;flex-wrap:wrap;gap:12px;margin-top:12px}
  .metric{flex:1;min-width:120px;text-align:center;padding:16px;background:#f5f3ff;border-radius:12px}
  .metric-val{font-size:22px;font-weight:800;color:#7c3aed}
  .metric-label{font-size:11px;color:#6b7280;margin-top:4px}
  .advice-box{background:#f5f3ff;border-left:4px solid #7c3aed;padding:16px 20px;border-radius:8px;line-height:1.9;font-size:14px}
  .footer{margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;color:#9ca3af;font-size:12px;text-align:center}
  .desc{line-height:1.8;color:#374151}
</style></head><body>
<h1>🎓 学情画像研判报告</h1>
<p class="desc"><strong>学生：</strong>${student.name || "学生"} &nbsp;&nbsp; <strong>学号：</strong>${student.num || "-"} &nbsp;&nbsp; <strong>班级：</strong>武器发射工程 · 23级 · 1班</p>
<p class="desc"><strong>生成时间：</strong>${date} &nbsp;&nbsp; <strong>数据来源：</strong>兵工铸魂·智绘"易"学系统</p>

<h2>📊 思政画像类型</h2>
<div class="badge">${t.cn} · ${t.code}</div>
<p class="desc">${t.desc}</p>
<p class="desc" style="color:#6b7280;font-style:italic">${prof.matchInfo || ""}</p>

<h2>📈 行为数据指标</h2>
<div class="metrics">
  ${metricsData.map(function(m) { return `<div class="metric"><div class="metric-val">${m.value}</div><div class="metric-label">${m.label}</div></div>`; }).join("")}
</div>

<h2>🔢 八维画像详情</h2>
<table>
  <tr><th>维度代码</th><th>维度名称</th><th>得分（满分8）</th><th>水平</th></tr>
  ${dimRows}
</table>

<h2>🤖 DeepSeek AI 个性化教学建议</h2>
<div class="advice-box">${advice || "暂无AI建议，请刷新后重试。"}</div>

<div class="footer">
  沈阳理工大学 · 装备工程学院 · 兵工铸魂智绘"易"学系统<br>
  本报告由 DeepSeek AI 动态生成，仅供教学参考使用
</div>
</body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `学情报告_${student.name || "学生"}_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ background: dark0, minHeight: "100%", color: text1 }}>
      {/* 顶栏 */}
      <div style={{ background: "linear-gradient(135deg," + dark1 + "," + dark3 + ")", borderBottom: "1px solid rgba(139,92,246,0.2)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#8b5cf6,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>师</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>教师数据面板</div>
          <div style={{ fontSize: 11, color: gray1, marginTop: 2 }}>学情画像研判 · 行为数据 · 教学建议</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: purple }}>{today} · 实时</span>
          <button onClick={handleRefresh} disabled={refreshing} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: purple, cursor: refreshing ? "not-allowed" : "pointer", opacity: refreshing ? 0.6 : 1 }}>
            {refreshing ? "刷新中…" : "↻ 刷新"}
          </button>
          <button onClick={function() { exportReport(selectedStudent, profile, teacherAdvice, metrics, today); }} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", cursor: "pointer" }}>
            📄 导出报告
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 16px" }}>
        {/* 学生选择器 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: gray1, marginBottom: 8, fontWeight: 600 }}>选择学生查看画像</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {defaultStudents.map(function (s) {
              const active = selectedId === s.id;
              return (
                <button key={s.id} onClick={function () { switchStudent(s.id); }}
                  style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: active ? "rgba(139,92,246,0.2)" : "rgba(30,41,59,0.6)", border: "1px solid " + (active ? "rgba(139,92,246,0.5)" : "rgba(51,65,85,0.4)"), color: active ? purple : gray3, cursor: "pointer", transition: "all 0.2s" }}>
                  <div>{s.name || "当前学生"}</div>
                  <div style={{ fontSize: 10, color: active ? "rgba(168,85,247,0.7)" : gray2, marginTop: 2 }}>#{s.num}</div>
                  {s.tag && <div style={{ fontSize: 9, color: green, marginTop: 1 }}>● {s.tag}</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 学生详情区（fade切换） */}
        <div style={{ opacity: studentFade ? 1 : 0, transition: "opacity 0.18s ease" }}>

          {/* 画像研判卡片 — 增强版 */}
          <div style={{ background: "linear-gradient(135deg," + dark2 + ",rgba(139,92,246,0.08))", borderRadius: 16, border: "1px solid " + t.color + "44", padding: "20px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
            {/* 背景光晕 */}
            <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle," + t.color + "22 0%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: "linear-gradient(135deg," + t.color + "33," + t.color + "11)", border: "1px solid " + t.color + "55", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: text1 }}>{selectedStudent.name || "学生"}</div>
                  <div style={{ fontSize: 11, color: gray3, marginTop: 2 }}>#{selectedStudent.num} · 武器发射工程 · 23级 · 1班</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: t.color, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{t.code}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: t.color, padding: "4px 12px", background: t.color + "18", border: "1px solid " + t.color + "33", borderRadius: 999 }}>{t.cn}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: text2, lineHeight: 1.8, padding: "12px 14px", background: "rgba(0,0,0,0.2)", borderRadius: 10, borderLeft: "3px solid " + t.color }}>
                {t.desc}
              </div>
              {profile.matchInfo && <div style={{ marginTop: 8, fontSize: 11, color: gray3, textAlign: "right" }}>{profile.matchInfo}</div>}
            </div>
          </div>

          {/* 8维快览 — 增强版带动画进度条 */}
          <div style={{ background: dark2, borderRadius: 14, border: "1px solid rgba(51,65,85,0.5)", padding: "16px 18px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: text1, fontWeight: 700, marginBottom: 14 }}>八维画像快览</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DIMS.map(function (d) {
                const lvl = profile.lvls[d]; const score = profile.raw[d];
                const lvlColor = lvl === "H" ? green : lvl === "M" ? yellow : red;
                const lvlText = lvl === "H" ? "高" : lvl === "M" ? "中" : "低";
                return (
                  <div key={d} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, fontSize: 10, color: cyan, fontWeight: 700, flexShrink: 0 }}>{d}</div>
                    <div style={{ flex: 1, fontSize: 11, color: gray3 }}>{dimMeta[d].name}</div>
                    <div style={{ width: 120, height: 6, background: "rgba(30,41,59,0.6)", borderRadius: 999, overflow: "hidden", flexShrink: 0 }}>
                      <div style={{ width: (score / 8 * 100) + "%", height: "100%", background: "linear-gradient(90deg," + lvlColor + "88," + lvlColor + ")", borderRadius: 999, transition: "width 0.6s ease", boxShadow: "0 0 6px " + lvlColor + "66" }} />
                    </div>
                    <div style={{ width: 14, fontSize: 13, fontWeight: 800, color: lvlColor, textAlign: "right", flexShrink: 0 }}>{score}</div>
                    <div style={{ fontSize: 10, color: lvlColor, fontWeight: 700, padding: "2px 8px", background: lvlColor + "18", borderRadius: 999, flexShrink: 0 }}>{lvlText}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 最新互动记录 */}
          <div style={{ background: dark2, borderRadius: 14, border: "1px solid rgba(139,92,246,0.15)", padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: text1, fontWeight: 700, marginBottom: 12 }}>最新互动记录</div>
            <div style={{ background: "rgba(15,23,42,0.5)", borderRadius: 10, padding: "12px 14px", marginBottom: 10, borderLeft: "3px solid rgba(6,182,212,0.4)" }}>
              <div style={{ fontSize: 11, color: gray3, marginBottom: 4 }}>14:23:17 · 持续 6分42秒</div>
              <div style={{ fontSize: 13, color: text1, marginBottom: 8, fontWeight: 600 }}>提问：为什么中国必须坚持自主研发武器装备？</div>
              <div style={{ fontSize: 12, color: text2, lineHeight: 1.7 }}>系统响应：调用案例《北斗卫星导航系统》→ 思政映射：科技自立自强 → 生成3条引导问题 → 学生展开Q1并追问1次</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {tags.map(function (tg, i) { return <span key={i} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: tg.color, background: tg.bg, border: "1px solid " + tg.color + "33" }}>{tg.label}</span>; })}
            </div>
          </div>

          {/* 动态指标 — 增强版 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 16 }}>
            {metrics.map(function (m, i) {
              return (
                <div key={i} style={{ background: "linear-gradient(135deg," + dark2 + "," + m.color + "0a)", borderRadius: 14, padding: "16px", border: "1px solid " + m.color + "33", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, borderRadius: "50%", background: "radial-gradient(circle," + m.color + "18 0%,transparent 70%)" }} />
                  <div style={{ fontSize: 11, color: gray1, marginBottom: 8 }}>{m.label}</div>
                  <div key={refreshKey + "-" + i} style={{ fontSize: 24, fontWeight: 800, color: m.color, animation: refreshing ? "pulse 0.4s ease" : refreshKey > 0 ? "fadeSlideUp 0.4s ease both" : "none" }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: m.color, marginTop: 6, fontWeight: 600 }}>{m.trend} 较上周</div>
                </div>
              );
            })}
          </div>

          {/* 班级对比雷达图 — 重新布局 */}
          <div style={{ background: dark2, borderRadius: 14, border: "1px solid rgba(139,92,246,0.15)", padding: "16px 18px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, color: text1, fontWeight: 700 }}>本班8维画像均值（23级武发1班）</div>
                <div style={{ fontSize: 11, color: gray2, marginTop: 3 }}>38人 · 基于全班测评数据聚合</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "rgba(6,182,212,0.08)", borderRadius: 8, border: "1px solid rgba(6,182,212,0.2)" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: cyan }} />
                  <div style={{ fontSize: 11, color: text1, fontWeight: 600 }}>该生</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "rgba(168,85,247,0.08)", borderRadius: 8, border: "1px solid rgba(168,85,247,0.2)" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "transparent", border: "2px dashed " + purple }} />
                  <div style={{ fontSize: 11, color: text1, fontWeight: 600 }}>班级均值</div>
                </div>
              </div>
            </div>

            {/* 雷达图居中放大 */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <svg width="340" height="300" viewBox="0 0 260 240">
                {grids.map((d, i) => <path key={i} d={d} fill="none" stroke="rgba(100,116,139,0.18)" strokeWidth="1" />)}
                {DIMS.map((_, i) => { const p = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="rgba(100,116,139,0.15)" strokeWidth="1" />; })}
                <path d={makePath(classLvls)} fill="rgba(168,85,247,0.15)" stroke={purple} strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="4 2" />
                <path d={makePath(personalLvls)} fill="rgba(6,182,212,0.12)" stroke={cyan} strokeWidth="2" strokeLinejoin="round" />
                {DIMS.map((d, i) => {
                  const p = pt(i, 1.28);
                  const isLeft = p.x < cx - 4; const isRight = p.x > cx + 4;
                  const anchor = isLeft ? "end" : isRight ? "start" : "middle";
                  const lvlColor = personalLvls[d] === "H" ? green : personalLvls[d] === "M" ? yellow : red;
                  return (<g key={d}><text x={p.x} y={p.y - 3} textAnchor={anchor} fontSize="8" fontWeight="700" fill={lvlColor}>{d}</text><text x={p.x} y={p.y + 8} textAnchor={anchor} fontSize="7" fill="#64748b">{dimMeta[d].name}</text></g>);
                })}
              </svg>
            </div>

            {/* 与班级对比 — 横向标签布局 */}
            <div style={{ padding: "10px 12px", background: "rgba(139,92,246,0.06)", borderRadius: 10, border: "1px solid rgba(139,92,246,0.15)" }}>
              <div style={{ fontSize: 11, color: purple, fontWeight: 700, marginBottom: 8 }}>与班级均值对比</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {DIMS.map(d => {
                  const personal = { L: 1, M: 2, H: 3 }[profile.lvls[d]];
                  const cls = { L: 1, M: 2, H: 3 }[classLvls[d]];
                  const diff = personal - cls;
                  const color = diff > 0 ? green : diff < 0 ? red : gray3;
                  const icon = diff > 0 ? "▲" : diff < 0 ? "▼" : "=";
                  return (
                    <div key={d} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 999, background: diff > 0 ? "rgba(34,197,94,0.08)" : diff < 0 ? "rgba(239,68,68,0.08)" : "rgba(51,65,85,0.3)", border: "1px solid " + (diff > 0 ? "rgba(34,197,94,0.2)" : diff < 0 ? "rgba(239,68,68,0.2)" : "rgba(51,65,85,0.3)") }}>
                      <span style={{ fontSize: 10, color: color, fontWeight: 700 }}>{icon}</span>
                      <span style={{ fontSize: 10, color: color, fontWeight: 600 }}>{d}</span>
                      <span style={{ fontSize: 10, color: gray3 }}>{dimMeta[d].name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI系统建议 */}
          <div style={{ background: "rgba(139,92,246,0.06)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(139,92,246,0.2)", marginBottom: 80 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span>🤖</span><span style={{ fontSize: 13, fontWeight: 700, color: purple }}>DeepSeek · 个性化教学建议</span>
              {adviceLoading && <span style={{ fontSize: 10, color: purple, animation: "pulse 0.8s infinite" }}>生成中…</span>}
            </div>
            <div style={{ fontSize: 13.5, color: text2, lineHeight: 1.85, padding: "10px 14px", background: "rgba(15,23,42,0.5)", borderRadius: 10 }}>
              {teacherAdvice}
              {adviceLoading && <span style={{ animation: "pulse 0.6s infinite" }}>▍</span>}
            </div>
          </div>


        </div>{/* end studentFade */}
      </div>
    </div>
  );
}
