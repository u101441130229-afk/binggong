// TODO: DeepSeek接入点
import { useState } from "react";
import {
  DIMS, TYPES, qs,
  lv, toLevel, dimMeta
} from "../constants.js";
import SurveyView from "../components/SurveyView.jsx";
import ProfileResultView from "../components/ProfileResultView.jsx";
import CaseStudyView from "../components/CaseStudyView.jsx";
import QuickProfileSelect from "../components/QuickProfileSelect.jsx";
import ProfileGenerating from "../components/ProfileGenerating.jsx";
import DailyQuestion from "../components/DailyQuestion.jsx";

// ============================================================
// StudentView - 学生端主视图
// ============================================================
export default function StudentView() {
  const [stage, setStage] = useState(function() {
    const autoCase = typeof window !== "undefined" && window.__autoCase;
    return autoCase ? "study" : "survey";
  });
  const [profile, setProfile] = useState(null);
  const [currentCase, setCurrentCase] = useState(function() {
    const autoCase = typeof window !== "undefined" && window.__autoCase;
    if (autoCase) { window.__autoCase = null; return autoCase; }
    return null;
  });
  const [learnedCases, setLearnedCases] = useState([]);
  const [openChatOnReturn, setOpenChatOnReturn] = useState(false);
  const [showDailyQ, setShowDailyQ] = useState(function() {
    try {
      const last = localStorage.getItem("bgzh_dailyq_date");
      const today = new Date().toLocaleDateString("zh-CN");
      return last !== today; // 今天没看过才弹
    } catch(e) { return true; }
  });
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // 从 localStorage 读取历史画像
  const historyProfiles = (function() {
    try {
      const stored = JSON.parse(localStorage.getItem("bgzh_students") || "[]");
      return stored.filter(function(s) { return s.profile && s.profile.final; });
    } catch(e) { return []; }
  })();

  // ====================== DeepSeek 画像解读 ======================
  async function fetchAiAnalysis(p) {
    try {
      const dimNames = { PA:"专业认同度", MP:"使命感知度", VS:"价值定力", CC:"集体协同感", CT:"思辨开放度", SC:"报国信心", CD:"职业方向感", IR:"思政资源感知" };
      const lowDims = DIMS.filter(d => p.lvls[d] === "L");
      const highDims = DIMS.filter(d => p.lvls[d] === "H");
      const prompt = `你是"小备"，沈阳理工大学装备工程学院的AI思政学习伙伴。请根据以下学生画像数据，生成一段温暖、个性化的画像解读（150字以内，第二人称"你"，结合兵工精神，不要分点列表）：

画像类型：${p.final.cn}（${p.final.code}）
${p.matchInfo}
较高维度：${highDims.length > 0 ? highDims.map(d => dimNames[d]).join("、") : "暂无突出维度"}
需关注维度：${lowDims.length > 0 ? lowDims.map(d => dimNames[d]).join("、") : "各维度较均衡"}
各维度得分：${DIMS.map(d => dimNames[d] + p.raw[d] + "分").join("、")}`;

      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer sk-881c1a3f71794c418186d46bd6628167" },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
          temperature: 0.85
        })
      });
      const data = await res.json();
      const analysis = data.choices?.[0]?.message?.content || null;
      setAiAnalysis(analysis);
    } catch(e) { console.warn("AI画像解读生成失败", e); }
  }

  // ====================== 画像计算算法 ======================
  function computeProfile(answers) {
    const raw = {};
    const lvls = {};
    DIMS.forEach(function (d) { raw[d] = 0; });
    qs.forEach(function (q) { raw[q.dim] += answers[q.id] || 0; });
    DIMS.forEach(function (d) { lvls[d] = toLevel(raw[d]); });

    const uv = DIMS.map(function (d) { return lv(lvls[d]); });
    const normal = Object.values(TYPES)
      .filter(function (t) { return t.pattern; })
      .map(function (t) {
        const pv = t.pattern.split("").map(lv);
        let dist = 0, exact = 0;
        for (let i = 0; i < 8; i++) {
          const d = Math.abs(uv[i] - pv[i]);
          dist += d;
          if (d === 0) exact++;
        }
        const sim = Math.max(0, Math.round((1 - dist / 16) * 100));
        return Object.assign({}, t, { dist, exact, sim });
      })
      .sort(function (a, b) {
        return a.dist !== b.dist ? a.dist - b.dist : b.exact - a.exact;
      });

    const best = normal[0];
    const guide = answers["guide_gate_q1"] === 3;
    let final, matchInfo;
    if (guide) {
      final = TYPES.GUIDE;
      matchInfo = "系统已生成引导建议";
    } else if (best.sim < 55) {
      final = TYPES.GROW;
      matchInfo = "当前最高匹配 " + best.sim + "% · 系统归为成长进行时型";
    } else {
      final = best;
      matchInfo = "匹配度 " + best.sim + "% · 命中 " + best.exact + "/8 维";
    }
    return { raw, lvls, best, final, matchInfo };
  }

  // ====================== 事件处理 ======================
  function handleSurveyComplete(answers) {
    const p = computeProfile(answers);
    setProfile(p);
    if (typeof window !== "undefined") { window.__lastStudentProfile = p; }
    // 保存到 localStorage，供教师端/学校端读取
    try {
      const studentRecord = {
        id: "stu_" + Date.now(),
        name: "当前测评学生",
        num: "2301060" + Math.floor(Math.random() * 900 + 100),
        time: new Date().toISOString(),
        profile: p
      };
      const existing = JSON.parse(localStorage.getItem("bgzh_students") || "[]");
      // 避免重复，同一session只保留最新一条
      const filtered = existing.filter(s => s.id !== window.__currentStudentId);
      window.__currentStudentId = studentRecord.id;
      filtered.unshift(studentRecord);
      // 最多保留20条
      localStorage.setItem("bgzh_students", JSON.stringify(filtered.slice(0, 20)));
    } catch(e) { console.warn("localStorage写入失败", e); }
    fetchAiAnalysis(p); // DeepSeek异步生成画像解读
    setStage("generating");
  }

  function handleSkip() {
    setStage("quick");
  }

  function handleQuickProfile(choice) {
    const choiceMap = [
      {
        raw: { PA: 7, MP: 7, VS: 7, CC: 7, CT: 6, SC: 7, CD: 7, IR: 6 },
        lvls: { PA: "H", MP: "H", VS: "H", CC: "H", CT: "M", SC: "H", CD: "H", IR: "M" },
        final: TYPES.SOLID, matchInfo: "快速画像 · 稳进发展型"
      },
      {
        raw: { PA: 5, MP: 5, VS: 5, CC: 5, CT: 5, SC: 5, CD: 4, IR: 4 },
        lvls: { PA: "M", MP: "M", VS: "M", CC: "M", CT: "M", SC: "M", CD: "L", IR: "L" },
        final: TYPES.EXPLORE, matchInfo: "快速画像 · 方向探索型"
      },
      {
        raw: { PA: 4, MP: 4, VS: 4, CC: 4, CT: 4, SC: 4, CD: 3, IR: 3 },
        lvls: { PA: "L", MP: "L", VS: "L", CC: "L", CT: "L", SC: "L", CD: "L", IR: "L" },
        final: TYPES.GUIDE, matchInfo: "快速画像 · 重点引导型"
      },
    ][choice];
    const p = Object.assign({ best: choiceMap.final }, choiceMap);
    setProfile(p);
    if (typeof window !== "undefined") { window.__lastStudentProfile = p; }
    // 保存到 localStorage
    try {
      const studentRecord = {
        id: "stu_" + Date.now(),
        name: "当前测评学生",
        num: "2301060" + Math.floor(Math.random() * 900 + 100),
        time: new Date().toISOString(),
        profile: p
      };
      const existing = JSON.parse(localStorage.getItem("bgzh_students") || "[]");
      const filtered = existing.filter(s => s.id !== window.__currentStudentId);
      window.__currentStudentId = studentRecord.id;
      filtered.unshift(studentRecord);
      localStorage.setItem("bgzh_students", JSON.stringify(filtered.slice(0, 20)));
    } catch(e) { console.warn("localStorage写入失败", e); }
    fetchAiAnalysis(p); // DeepSeek异步生成画像解读
    setStage("generating");
  }

  // ====================== 路由渲染 ======================
  if (stage === "survey") return (
    <div style={{ position: "relative", height: "100%" }}>
      <SurveyView onComplete={handleSurveyComplete} onSkip={handleSkip} />
      {showDailyQ && <DailyQuestion onClose={function () {
        setShowDailyQ(false);
        try { localStorage.setItem("bgzh_dailyq_date", new Date().toLocaleDateString("zh-CN")); } catch(e) {}
      }} />}

      {/* 历史画像按钮 */}
      {historyProfiles.length > 0 && !showDailyQ && (
        <div style={{ position: "fixed", bottom: 180, right: 24, zIndex: 100 }}>
          <button onClick={function() { setShowHistory(true); }} style={{
            padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700,
            background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)",
            color: "#a855f7", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 4px 16px rgba(139,92,246,0.2)"
          }}>
            📋 历史画像（{historyProfiles.length}）
          </button>
        </div>
      )}

      {/* 历史画像弹窗 */}
      {showHistory && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 560, background: "#0f172a", borderRadius: "20px 20px 0 0", border: "1px solid rgba(139,92,246,0.3)", maxHeight: "75vh", display: "flex", flexDirection: "column", animation: "profileGen 0.3s ease both" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(51,65,85,0.4)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>📋 历史测评记录</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>共 {historyProfiles.length} 次测评</div>
              </div>
              <button onClick={function() { setShowHistory(false); }} style={{ background: "transparent", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {historyProfiles.map(function(s, i) {
                const t = s.profile.final;
                const timeStr = s.time ? new Date(s.time).toLocaleDateString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "未知时间";
                return (
                  <div key={s.id || i} style={{ background: "rgba(30,41,59,0.8)", borderRadius: 14, border: "1px solid " + t.color + "44", padding: "14px 16px", cursor: "pointer" }}
                    onClick={function() {
                      setProfile(s.profile);
                      setAiAnalysis(null);
                      setShowHistory(false);
                      setStage("profile");
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: t.color + "22", border: "1px solid " + t.color + "44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: t.color }}>兵</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{t.cn}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{timeStr} · {s.profile.matchInfo || t.code}</div>
                      </div>
                      {i === 0 && <div style={{ fontSize: 10, color: "#22c55e", padding: "3px 8px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 999 }}>最新</div>}
                      <div style={{ fontSize: 12, color: t.color }}>查看 →</div>
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {Object.entries(s.profile.lvls || {}).filter(([,v]) => v === "H").slice(0,3).map(([d]) => (
                        <span key={d} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", borderRadius: 999 }}>↑{d}</span>
                      ))}
                      {Object.entries(s.profile.lvls || {}).filter(([,v]) => v === "L").slice(0,2).map(([d]) => (
                        <span key={d} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 999 }}>↓{d}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(51,65,85,0.3)", flexShrink: 0 }}>
              <button onClick={function() { setShowHistory(false); }} style={{ width: "100%", padding: "11px", borderRadius: 10, fontSize: 13, background: "transparent", border: "1px solid rgba(51,65,85,0.4)", color: "#94a3b8", cursor: "pointer" }}>关闭，重新测评</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (stage === "quick") return (
    <QuickProfileSelect
      onSelect={handleQuickProfile}
      onBack={function () { setStage("survey"); }}
    />
  );

  if (stage === "generating") return (
    <ProfileGenerating onDone={function () { setStage("profile"); }} />
  );

  if (stage === "profile" && profile) return (
    <ProfileResultView
      profile={profile}
      aiAnalysis={aiAnalysis}
      learnedCases={learnedCases}
      openChatOnReturn={openChatOnReturn}
      onChatOpened={function () { setOpenChatOnReturn(false); }}
      onChooseCase={function (id) { setCurrentCase(id); setStage("study"); }}
      onRetake={function () { setProfile(null); setAiAnalysis(null); setStage("survey"); }}
    />
  );

  if (stage === "study" && currentCase) return (
    <CaseStudyView
      caseId={currentCase}
      learnedCases={learnedCases}
      onComplete={function (id) {
        setLearnedCases(function (prev) { return prev.includes(id) ? prev : [...prev, id]; });
      }}
      onBack={function () { setStage("profile"); }}
      onSwitchCase={function (id) { setCurrentCase(id); }}
      onOpenChat={function () { setOpenChatOnReturn(true); setStage("profile"); }}
      onRetake={function () { setProfile(null); setAiAnalysis(null); setStage("survey"); }}
    />
  );

  return null;
}
