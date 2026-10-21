// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 学校端：聚合数据库中的真实测评与学习行为数据，提供群体画像、班级专业统计与名单导出。
import { useEffect, useMemo, useState } from "react";
import {
  DIMS,
  blue,
  cyan,
  dark0,
  dark1,
  dark2,
  dark3,
  gray1,
  gray2,
  gray3,
  green,
  red,
  text1,
  text2,
  yellow,
} from "../constants.js";
import {
  buildCaseCoverage,
  buildClassStats,
  buildMajorStats,
  buildRosterCsv,
  buildStudentRecords,
  buildTopicHeat,
  buildTypeDistribution,
  buildWeeklyAssessments,
  computeDimensionAverages,
  topAndWeakDimensions,
} from "../api/analytics.js";
import { requestAi } from "../api/ai.js";
import { fetchSchoolSnapshot } from "../api/dataAccess.js";
import { ClassTable, EmptyState, MajorTable, PieChart, WeeklyBars } from "../components/school/SchoolCharts.jsx";
import { DimensionPanel, StatCards, TopicHeat } from "../components/school/SchoolSections.jsx";
import { downloadTextFile } from "../fileUtils.js";

export default function SchoolView() {
  const [records, setRecords] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [barsVisible, setBarsVisible] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(
    function () {
      let mounted = true;
      fetchSchoolSnapshot()
        .then(function (snapshot) {
          if (!mounted) return;
          setRecords(buildStudentRecords(snapshot.students, snapshot.assessments, snapshot.activities));
          setAssessments(snapshot.assessments);
          setActivities(snapshot.activities);
          setBarsVisible(true);
        })
        .catch(function (error) {
          if (mounted) setLoadError(error?.message || "读取学院数据失败，请检查网络后重试");
        })
        .finally(function () {
          if (mounted) setLoading(false);
        });
      return function () {
        mounted = false;
      };
    },
    [reloadKey]
  );

  const assessedRecords = useMemo(
    function () {
      return records.filter(function (item) {
        return item.profile;
      });
    },
    [records]
  );

  const dimensionAverages = useMemo(
    function () {
      return computeDimensionAverages(records);
    },
    [records]
  );
  const hasDimensionData = dimensionAverages.some(function (item) {
    return item.avg !== null;
  });
  const dimensionSummary = useMemo(
    function () {
      return topAndWeakDimensions(dimensionAverages, 3);
    },
    [dimensionAverages]
  );
  const typeDistribution = useMemo(
    function () {
      return buildTypeDistribution(records);
    },
    [records]
  );
  const classStats = useMemo(
    function () {
      return buildClassStats(records);
    },
    [records]
  );
  const majorStats = useMemo(
    function () {
      return buildMajorStats(records);
    },
    [records]
  );
  const weekly = useMemo(
    function () {
      return buildWeeklyAssessments(assessments, 4);
    },
    [assessments]
  );
  const topicHeat = useMemo(
    function () {
      return buildTopicHeat(activities);
    },
    [activities]
  );
  const caseCoverage = useMemo(
    function () {
      return buildCaseCoverage(activities);
    },
    [activities]
  );

  const totalActivities = activities.length;
  const participation = records.length ? Math.round((assessedRecords.length / records.length) * 100) : 0;

  const stats = [
    { label: "覆盖学生", value: records.length + "人", icon: "👥", color: cyan },
    {
      label: "完成测评",
      value: assessedRecords.length + "人",
      icon: "📋",
      color: green,
      sub: "参与率 " + participation + "%",
    },
    { label: "累计互动", value: totalActivities + "次", icon: "💬", color: blue },
    { label: "案例覆盖", value: caseCoverage.covered + "/" + caseCoverage.total, icon: "📄", color: yellow },
  ];

  async function generateAnalysis() {
    if (aiLoading || assessedRecords.length === 0) return;
    setAiLoading(true);
    setAiError("");
    setAiText("");
    try {
      const dimensionText = dimensionAverages
        .filter(function (item) {
          return item.avg !== null;
        })
        .map(function (item) {
          return item.name + ":" + item.avg;
        })
        .join("、");
      const summary = dimensionSummary;
      const prompt = `你是一位高校思政教育数据分析专家。请根据以下真实统计生成简洁的决策建议（200字以内，直接给结论和建议，不要编造数据）：
八维画像均值：${dimensionText}
学生总数：${records.length}人，完成测评：${assessedRecords.length}人，累计互动：${totalActivities}次
优势维度：${
        summary.top
          .map(function (item) {
            return item.name + " " + item.avg;
          })
          .join("、") || "暂无"
      }
待关注维度：${
        summary.weak
          .map(function (item) {
            return item.name + " " + item.avg;
          })
          .join("、") || "暂无"
      }`;
      const data = await requestAi("/api/deepseek", { messages: [{ role: "user", content: prompt }], max_tokens: 400 });
      const analysis = data.choices?.[0]?.message?.content?.trim();
      if (!analysis) throw new Error("empty");
      setAiText(analysis);
    } catch (error) {
      const kind = error?.kind || "";
      if (kind === "rate_limited") setAiError("AI 调用过于频繁，请稍后再试。");
      else if (kind === "unauthorized" || kind === "forbidden") setAiError("登录状态已失效，请重新登录后重试。");
      else setAiError("暂时无法生成分析，请稍后重试。");
    } finally {
      setAiLoading(false);
    }
  }

  function handleExport() {
    const date = new Date().toLocaleDateString("zh-CN").replace(/\//g, "-");
    downloadTextFile(`学生名单数据_${date}.csv`, buildRosterCsv(records), "text/csv;charset=utf-8");
  }

  if (loading) {
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
          color: gray3,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "2px solid rgba(234,179,8,0.25)",
            borderTopColor: yellow,
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div style={{ fontSize: 12 }}>正在读取学院数据…</div>
      </div>
    );
  }

  return (
    <div style={{ background: dark0, minHeight: "100%", color: text1 }}>
      <div
        style={{
          background: "linear-gradient(135deg," + dark1 + "," + dark3 + ")",
          borderBottom: "1px solid rgba(234,179,8,0.2)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg,#eab308,#f59e0b)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            color: dark1,
          }}
        >
          校
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>学校思政教学数据看板</div>
          <div style={{ fontSize: 11, color: gray1, marginTop: 2 }}>装备工程学院 · 数据读取自数据库</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={function () {
              setReloadKey(function (key) {
                return key + 1;
              });
            }}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              background: "rgba(234,179,8,0.15)",
              border: "1px solid rgba(234,179,8,0.3)",
              color: yellow,
              cursor: "pointer",
            }}
          >
            ↻ 刷新
          </button>
          <button
            onClick={handleExport}
            disabled={records.length === 0}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: green,
              cursor: records.length === 0 ? "not-allowed" : "pointer",
              opacity: records.length === 0 ? 0.5 : 1,
            }}
          >
            导出名单数据
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 16px" }}>
        {loadError ? (
          <div style={{ padding: 24, textAlign: "center", color: red, fontSize: 13, lineHeight: 1.8 }}>
            {loadError}
            <div style={{ marginTop: 12 }}>
              <button
                onClick={function () {
                  setLoading(true);
                  setLoadError("");
                  setReloadKey(function (key) {
                    return key + 1;
                  });
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: 10,
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.08)",
                  color: red,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                重新加载
              </button>
            </div>
          </div>
        ) : records.length === 0 ? (
          <EmptyState text="暂无学生数据。请先在本地运行学生名单导入脚本，导入成功后刷新本页。" />
        ) : (
          <>
            <StatCards stats={stats} />

            <DimensionPanel
              dimensionAverages={dimensionAverages}
              dimensionSummary={dimensionSummary}
              hasDimensionData={hasDimensionData}
              barsVisible={barsVisible}
            />

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: gray1, marginBottom: 10, fontWeight: 600 }}>学生思政画像类型分布</div>
              <div
                style={{
                  background: dark2,
                  borderRadius: 14,
                  border: "1px solid rgba(51,65,85,0.4)",
                  padding: "16px 18px",
                }}
              >
                <PieChart typeData={typeDistribution} visible={barsVisible} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: gray1, marginBottom: 10, fontWeight: 600 }}>班级思政画像分布</div>
              <ClassTable rows={classStats} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: gray1, marginBottom: 10, fontWeight: 600 }}>专业测评参与情况</div>
              <MajorTable rows={majorStats} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: gray1, marginBottom: 10, fontWeight: 600 }}>近 4 周测评提交次数</div>
              <div
                style={{
                  background: dark2,
                  borderRadius: 14,
                  border: "1px solid rgba(51,65,85,0.4)",
                  padding: "16px 18px",
                }}
              >
                {assessments.length === 0 ? (
                  <EmptyState text="暂无测评提交记录。" />
                ) : (
                  <WeeklyBars weekly={weekly} visible={barsVisible} />
                )}
              </div>
            </div>

            <TopicHeat topicHeat={topicHeat} barsVisible={barsVisible} />

            <div
              style={{
                background: "rgba(234,179,8,0.06)",
                borderRadius: 14,
                padding: "16px 18px",
                border: "1px solid rgba(234,179,8,0.2)",
                marginBottom: 80,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <span>📊</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: yellow }}>AI 数据分析</span>
                <span style={{ fontSize: 10, color: gray2 }}>只在点击后生成，结果不写入数据库</span>
                <button
                  onClick={generateAnalysis}
                  disabled={!hasDimensionData || aiLoading}
                  style={{
                    marginLeft: "auto",
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    background: hasDimensionData ? "rgba(234,179,8,0.15)" : "rgba(51,65,85,0.4)",
                    border: "1px solid " + (hasDimensionData ? "rgba(234,179,8,0.35)" : "rgba(51,65,85,0.4)"),
                    color: hasDimensionData ? yellow : gray2,
                    cursor: hasDimensionData && !aiLoading ? "pointer" : "not-allowed",
                  }}
                >
                  {aiLoading ? "分析中…" : aiText ? "重新生成" : "生成分析"}
                </button>
              </div>
              {!hasDimensionData ? (
                <div
                  style={{
                    fontSize: 12,
                    color: gray3,
                    padding: "10px 14px",
                    background: "rgba(15,23,42,0.5)",
                    borderRadius: 10,
                  }}
                >
                  暂无测评数据，暂无法生成学院层面的分析建议。
                </div>
              ) : aiLoading ? (
                <div
                  style={{
                    fontSize: 13,
                    color: yellow,
                    padding: "10px 14px",
                    background: "rgba(15,23,42,0.5)",
                    borderRadius: 10,
                    animation: "pulse 1s infinite",
                  }}
                >
                  正在根据学院数据生成分析…
                </div>
              ) : aiText ? (
                <div
                  style={{
                    fontSize: 13,
                    color: text2,
                    lineHeight: 1.85,
                    padding: "10px 14px",
                    background: "rgba(15,23,42,0.5)",
                    borderRadius: 10,
                  }}
                >
                  {aiText}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    color: gray3,
                    padding: "10px 14px",
                    background: "rgba(15,23,42,0.5)",
                    borderRadius: 10,
                  }}
                >
                  点击右上角“生成分析”，系统将结合群体八维均值与参与情况给出教学参考。
                </div>
              )}
              {aiError && <div style={{ marginTop: 8, fontSize: 11, color: red }}>{aiError}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
