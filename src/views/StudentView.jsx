// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 学生端：测评写入数据库，画像、历史记录与案例进度全部来自本人真实数据。
import { useEffect, useMemo, useState } from "react";
import { CASES, DIMS, TYPES, dark0, gray3, lv, qs, red, toLevel } from "../constants.js";
import { buildProfileFromAssessment } from "../api/analytics.js";
import { requestAi } from "../api/ai.js";
import { fetchMyActivities, fetchMyAssessments, recordActivity, saveAssessment } from "../api/studentData.js";
import CaseStudyView from "../components/CaseStudyView.jsx";
import DailyQuestion from "../components/DailyQuestion.jsx";
import ProfileGenerating from "../components/ProfileGenerating.jsx";
import ProfileResultView from "../components/ProfileResultView.jsx";
import HistoryModal from "../components/student/HistoryModal.jsx";
import SurveyView from "../components/SurveyView.jsx";

const DAILY_KEY = "bgzh_dailyq_date";

function computeProfile(answers) {
  const raw = {};
  const lvls = {};
  DIMS.forEach(function (dim) {
    raw[dim] = 0;
  });
  qs.forEach(function (question) {
    raw[question.dim] += answers[question.id] || 0;
  });
  DIMS.forEach(function (dim) {
    lvls[dim] = toLevel(raw[dim]);
  });

  const userVector = DIMS.map(function (dim) {
    return lv(lvls[dim]);
  });
  const candidates = Object.values(TYPES)
    .filter(function (type) {
      return type.pattern;
    })
    .map(function (type) {
      const pattern = type.pattern.split("").map(lv);
      let distance = 0;
      let exact = 0;
      for (let index = 0; index < DIMS.length; index += 1) {
        const difference = Math.abs(userVector[index] - pattern[index]);
        distance += difference;
        if (difference === 0) exact += 1;
      }
      return { ...type, distance, exact, similarity: Math.max(0, Math.round((1 - distance / 16) * 100)) };
    })
    .sort(function (a, b) {
      return a.distance !== b.distance ? a.distance - b.distance : b.exact - a.exact;
    });

  const best = candidates[0];
  const needsGuide = answers.guide_gate_q1 === 3;
  if (needsGuide) {
    return { raw, lvls, best, final: TYPES.GUIDE, matchInfo: "系统已生成引导建议" };
  }
  if (best.similarity < 55) {
    return { raw, lvls, best, final: TYPES.GROW, matchInfo: `当前最高匹配 ${best.similarity}% · 系统归为成长进行时型` };
  }
  return { raw, lvls, best, final: best, matchInfo: `匹配度 ${best.similarity}% · 命中 ${best.exact}/8 维` };
}

function LoadingView({ error, onRetry }) {
  return (
    <div
      style={{
        background: dark0,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: 24,
        color: error ? red : gray3,
        textAlign: "center",
      }}
    >
      {!error && (
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "2px solid rgba(6,182,212,0.25)",
            borderTopColor: "#06b6d4",
            animation: "spin 0.8s linear infinite",
          }}
        />
      )}
      <div style={{ fontSize: 12, lineHeight: 1.7 }}>{error || "正在读取你的学习数据…"}</div>
      {error && (
        <button
          onClick={onRetry}
          style={{
            padding: "9px 20px",
            borderRadius: 10,
            border: "1px solid rgba(6,182,212,0.3)",
            background: "rgba(6,182,212,0.1)",
            color: "#06b6d4",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          重新加载
        </button>
      )}
    </div>
  );
}

export default function StudentView({ user }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [assessments, setAssessments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stage, setStage] = useState("survey");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [currentCase, setCurrentCase] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showDailyQuestion, setShowDailyQuestion] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiPending, setAiPending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(
    function () {
      let mounted = true;
      Promise.all([fetchMyAssessments(user.id), fetchMyActivities(user.id)])
        .then(function ([assessmentRows, activityRows]) {
          if (!mounted) return;
          setAssessments(assessmentRows);
          setActivities(activityRows);
          setSelectedAssessmentId(assessmentRows[0]?.id || null);
          setStage(assessmentRows.length > 0 ? "profile" : "survey");
          try {
            const seen = localStorage.getItem(DAILY_KEY);
            const today = new Date().toLocaleDateString("zh-CN");
            if (seen !== today) setShowDailyQuestion(true);
          } catch {
            setShowDailyQuestion(true);
          }
        })
        .catch(function (error) {
          if (mounted) setLoadError(error?.message || "读取学习数据失败，请检查网络后重试");
        })
        .finally(function () {
          if (mounted) setLoading(false);
        });
      return function () {
        mounted = false;
      };
    },
    [user.id, reloadKey]
  );

  const selectedAssessment = useMemo(
    function () {
      return (
        assessments.find(function (row) {
          return row.id === selectedAssessmentId;
        }) ||
        assessments[0] ||
        null
      );
    },
    [assessments, selectedAssessmentId]
  );

  const profile = useMemo(
    function () {
      return selectedAssessment ? buildProfileFromAssessment(selectedAssessment) : null;
    },
    [selectedAssessment]
  );

  const learnedCases = useMemo(
    function () {
      const ids = new Set();
      activities.forEach(function (row) {
        if (row.event_type === "case_study" && CASES[row.reference_id]) ids.add(row.reference_id);
      });
      return Array.from(ids);
    },
    [activities]
  );

  async function generateAiAnalysis(computed) {
    setAiPending(true);
    setAiAnalysis(null);
    try {
      const highDims = DIMS.filter(function (dim) {
        return computed.lvls[dim] === "H";
      });
      const lowDims = DIMS.filter(function (dim) {
        return computed.lvls[dim] === "L";
      });
      const prompt = `你是“小备”，沈阳理工大学装备工程学院的AI思政学习伙伴。请根据以下学生画像数据，生成一段温暖、个性化的画像解读（150字以内，第二人称“你”，结合兵工精神，不要分点列表）：
画像类型：${computed.final.cn}（${computed.final.code}）
${computed.matchInfo}
较高维度：${highDims.length > 0 ? highDims.join("、") : "暂无突出维度"}
需关注维度：${lowDims.length > 0 ? lowDims.join("、") : "各维度较均衡"}
各维度得分：${DIMS.map(function (dim) {
        return dim + computed.raw[dim] + "分";
      }).join("、")}`;
      const data = await requestAi("/api/deepseek", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      });
      setAiAnalysis(data.choices?.[0]?.message?.content || null);
    } catch {
      setAiAnalysis(null);
    } finally {
      setAiPending(false);
    }
  }

  async function handleSurveyComplete(answers) {
    const computed = computeProfile(answers);
    let saved;
    try {
      saved = await saveAssessment(user.id, computed.raw, computed.lvls, computed.final.code, computed.matchInfo);
    } catch {
      throw new Error("测评保存失败，请检查网络后重试");
    }
    setAssessments(function (previous) {
      return [saved, ...previous];
    });
    setSelectedAssessmentId(saved.id);
    setStage("generating");
    generateAiAnalysis(computed);
  }

  function closeDailyQuestion() {
    try {
      localStorage.setItem(DAILY_KEY, new Date().toLocaleDateString("zh-CN"));
    } catch {
      // 浏览器禁用本地存储时，仅在本次会话内关闭。
    }
    setShowDailyQuestion(false);
  }

  async function handleDailySubmit(tag) {
    const row = await recordActivity(user.id, "daily_question", tag);
    setActivities(function (previous) {
      return [row, ...previous];
    });
  }

  async function handleCaseComplete(caseId) {
    const row = await recordActivity(user.id, "case_study", caseId);
    setActivities(function (previous) {
      return [row, ...previous];
    });
  }

  function handleRetake() {
    setAiAnalysis(null);
    setAiPending(false);
    setStage("survey");
  }

  function handleSelectHistory(assessmentId) {
    setSelectedAssessmentId(assessmentId);
    setAiAnalysis(null);
    setAiPending(false);
    setShowHistory(false);
    setStage("profile");
  }

  if (loading) return <LoadingView />;
  if (loadError) {
    return (
      <LoadingView
        error={loadError}
        onRetry={function () {
          setLoading(true);
          setLoadError("");
          setReloadKey(function (key) {
            return key + 1;
          });
        }}
      />
    );
  }

  const content = (function () {
    if (stage === "survey" || !profile) {
      return <SurveyView onComplete={handleSurveyComplete} />;
    }
    if (stage === "generating") {
      return (
        <ProfileGenerating
          onDone={function () {
            setStage("profile");
          }}
        />
      );
    }
    if (stage === "study" && currentCase) {
      return (
        <CaseStudyView
          key={currentCase}
          caseId={currentCase}
          learnedCases={learnedCases}
          onComplete={handleCaseComplete}
          onBack={function () {
            setStage(profile ? "profile" : "survey");
          }}
          onSwitchCase={function (caseId) {
            setCurrentCase(caseId);
          }}
          onRetake={handleRetake}
        />
      );
    }
    return (
      <ProfileResultView
        profile={profile}
        aiAnalysis={aiAnalysis}
        aiPending={aiPending}
        learnedCases={learnedCases}
        onChooseCase={function (caseId) {
          setCurrentCase(caseId);
          setStage("study");
        }}
        onRetake={handleRetake}
      />
    );
  })();

  return (
    <div style={{ position: "relative", minHeight: "100%" }}>
      {content}

      {assessments.length > 1 && stage !== "study" && !showDailyQuestion && (
        <button
          onClick={function () {
            setShowHistory(true);
          }}
          style={{
            position: "fixed",
            bottom: 108,
            right: 24,
            zIndex: 100,
            padding: "9px 14px",
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            background: "rgba(139,92,246,0.15)",
            border: "1px solid rgba(139,92,246,0.4)",
            color: "#a855f7",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(139,92,246,0.2)",
          }}
        >
          历史测评（{assessments.length}）
        </button>
      )}

      {showDailyQuestion && <DailyQuestion onClose={closeDailyQuestion} onSubmit={handleDailySubmit} />}
      {showHistory && (
        <HistoryModal
          assessments={assessments}
          onSelect={handleSelectHistory}
          onClose={function () {
            setShowHistory(false);
          }}
        />
      )}
    </div>
  );
}
