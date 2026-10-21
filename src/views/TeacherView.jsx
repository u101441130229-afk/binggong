// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 教师端：读取真实学生名单、测评与行为记录，支持检索、班级均值对比与教学建议生成。
import { useEffect, useMemo, useState } from "react";
import {
  CASES,
  DIMS,
  dark0,
  dark1,
  dark3,
  dimMeta,
  gray1,
  gray2,
  gray3,
  green,
  purple,
  red,
  text1,
} from "../constants.js";
import { EVENT_LABELS, buildRosterCsv, buildStudentRecords } from "../api/analytics.js";
import { requestAi } from "../api/ai.js";
import { fetchTeacherSnapshot } from "../api/dataAccess.js";
import { downloadTextFile } from "../fileUtils.js";
import XiaoBei from "../components/XiaoBei.jsx";
import StudentDetail from "../components/teacher/StudentDetail.jsx";

const LEVEL_RATIO = { L: 0.25, M: 0.58, H: 0.92 };

function EmptyState({ text }) {
  return (
    <div
      style={{
        padding: "40px 20px",
        textAlign: "center",
        color: gray3,
        fontSize: 13,
        lineHeight: 1.8,
        background: "rgba(15,23,42,0.4)",
        border: "1px dashed rgba(100,116,139,0.35)",
        borderRadius: 14,
      }}
    >
      {text}
    </div>
  );
}

export default function TeacherView() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [adviceById, setAdviceById] = useState({});
  const [adviceLoadingId, setAdviceLoadingId] = useState(null);
  const [adviceError, setAdviceError] = useState("");

  useEffect(
    function () {
      let mounted = true;
      fetchTeacherSnapshot()
        .then(function (snapshot) {
          if (!mounted) return;
          const nextRecords = buildStudentRecords(snapshot.students, snapshot.assessments, snapshot.activities);
          setRecords(nextRecords);
          setSelectedId(function (previous) {
            if (
              previous &&
              nextRecords.some(function (item) {
                return item.id === previous;
              })
            )
              return previous;
            const firstAssessed = nextRecords.find(function (item) {
              return item.profile;
            });
            return firstAssessed?.id || nextRecords[0]?.id || null;
          });
        })
        .catch(function (error) {
          if (mounted) setLoadError(error?.message || "读取学生数据失败，请检查网络后重试");
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

  const classOptions = useMemo(
    function () {
      const set = new Set(
        records.map(function (item) {
          return item.classCode;
        })
      );
      return Array.from(set).sort(function (a, b) {
        return a.localeCompare(b);
      });
    },
    [records]
  );

  const filteredRecords = useMemo(
    function () {
      const keyword = search.trim().toLowerCase();
      return records.filter(function (item) {
        if (classFilter !== "all" && item.classCode !== classFilter) return false;
        if (statusFilter === "assessed" && !item.profile) return false;
        if (statusFilter === "unassessed" && item.profile) return false;
        if (!keyword) return true;
        return item.name.toLowerCase().includes(keyword) || item.loginId.toLowerCase().includes(keyword);
      });
    },
    [records, search, classFilter, statusFilter]
  );

  const selectedStudent =
    records.find(function (item) {
      return item.id === selectedId;
    }) || null;
  const assessedCount = records.filter(function (item) {
    return item.profile;
  }).length;
  const classRecords = selectedStudent
    ? records.filter(function (item) {
        return item.classCode === selectedStudent.classCode;
      })
    : [];

  async function generateAdvice() {
    if (!selectedStudent || !selectedStudent.profile || adviceLoadingId) return;
    const student = selectedStudent;
    const profile = student.profile;
    setAdviceLoadingId(student.id);
    setAdviceError("");
    try {
      const lowDims = DIMS.filter(function (dim) {
        return profile.lvls[dim] === "L";
      }).map(function (dim) {
        return dim + " " + dimMeta[dim].name;
      });
      const highDims = DIMS.filter(function (dim) {
        return profile.lvls[dim] === "H";
      }).map(function (dim) {
        return dim + " " + dimMeta[dim].name;
      });
      const prompt = `你是一位思政教育专家。请根据以下学生画像数据，生成简洁的个性化教学建议（150字以内，直接给建议，不要分点，不要提及具体姓名）：
画像类型：${profile.final.cn}（${profile.final.code}）
画像描述：${profile.final.desc}
偏低维度：${lowDims.length > 0 ? lowDims.join("、") : "无"}
偏高维度：${highDims.length > 0 ? highDims.join("、") : "无"}
匹配信息：${profile.matchInfo}`;
      const data = await requestAi("/api/deepseek", { messages: [{ role: "user", content: prompt }], max_tokens: 300 });
      const advice = data.choices?.[0]?.message?.content?.trim();
      if (!advice) throw new Error("empty");
      setAdviceById(function (previous) {
        return { ...previous, [student.id]: advice };
      });
    } catch (error) {
      const kind = error?.kind || "";
      if (kind === "rate_limited") setAdviceError("AI 调用过于频繁，请稍后再试。");
      else if (kind === "unauthorized" || kind === "forbidden") setAdviceError("登录状态已失效，请重新登录后重试。");
      else setAdviceError("暂时无法生成教学建议，请稍后重试。");
    } finally {
      setAdviceLoadingId(null);
    }
  }

  function handleExport() {
    const date = new Date().toLocaleDateString("zh-CN").replace(/\//g, "-");
    downloadTextFile(`学生名单数据_${date}.csv`, buildRosterCsv(filteredRecords), "text/csv;charset=utf-8");
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
            border: "2px solid rgba(139,92,246,0.25)",
            borderTopColor: purple,
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div style={{ fontSize: 12 }}>正在读取学生数据…</div>
      </div>
    );
  }

  return (
    <div style={{ background: dark0, minHeight: "100%", color: text1 }}>
      <div
        style={{
          background: "linear-gradient(135deg," + dark1 + "," + dark3 + ")",
          borderBottom: "1px solid rgba(139,92,246,0.2)",
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
            background: "linear-gradient(135deg,#8b5cf6,#a855f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          师
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>教师数据面板</div>
          <div style={{ fontSize: 11, color: gray1, marginTop: 2 }}>
            学生 {records.length} 人 · 已完成测评 {assessedCount} 人 · 数据来自数据库
          </div>
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
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.3)",
              color: purple,
              cursor: "pointer",
            }}
          >
            ↻ 刷新
          </button>
          <button
            onClick={handleExport}
            disabled={filteredRecords.length === 0}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: green,
              cursor: filteredRecords.length === 0 ? "not-allowed" : "pointer",
              opacity: filteredRecords.length === 0 ? 0.5 : 1,
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
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <input
                value={search}
                onChange={function (event) {
                  setSearch(event.target.value);
                }}
                placeholder="搜索姓名或学号"
                style={{
                  flex: "1 1 180px",
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(51,65,85,0.5)",
                  color: text1,
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <select
                value={classFilter}
                onChange={function (event) {
                  setClassFilter(event.target.value);
                }}
                style={{
                  padding: "9px 10px",
                  borderRadius: 10,
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(51,65,85,0.5)",
                  color: text1,
                  fontSize: 12,
                  outline: "none",
                }}
              >
                <option value="all">全部班级</option>
                {classOptions.map(function (code) {
                  return (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  );
                })}
              </select>
              <select
                value={statusFilter}
                onChange={function (event) {
                  setStatusFilter(event.target.value);
                }}
                style={{
                  padding: "9px 10px",
                  borderRadius: 10,
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(51,65,85,0.5)",
                  color: text1,
                  fontSize: 12,
                  outline: "none",
                }}
              >
                <option value="all">全部状态</option>
                <option value="assessed">已完成测评</option>
                <option value="unassessed">未完成测评</option>
              </select>
            </div>
            <div style={{ fontSize: 11, color: gray2, marginBottom: 8 }}>
              共 {records.length} 名学生，当前筛选出 {filteredRecords.length} 名
            </div>

            {filteredRecords.length === 0 ? (
              <EmptyState text="没有符合筛选条件的学生，请调整搜索关键词或筛选条件。" />
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(148px,1fr))",
                    gap: 8,
                    maxHeight: 220,
                    overflowY: "auto",
                    padding: 4,
                    marginBottom: 18,
                    background: "rgba(15,23,42,0.35)",
                    borderRadius: 12,
                    border: "1px solid rgba(51,65,85,0.35)",
                  }}
                >
                  {filteredRecords.map(function (student) {
                    const active = student.id === selectedId;
                    return (
                      <button
                        key={student.id}
                        onClick={function () {
                          setSelectedId(student.id);
                          setAdviceError("");
                        }}
                        style={{
                          textAlign: "left",
                          padding: "9px 11px",
                          borderRadius: 10,
                          background: active ? "rgba(139,92,246,0.2)" : "rgba(30,41,59,0.6)",
                          border: "1px solid " + (active ? "rgba(139,92,246,0.5)" : "rgba(51,65,85,0.4)"),
                          color: active ? purple : gray3,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {student.name}
                        </div>
                        <div style={{ fontSize: 10, color: gray2, marginTop: 2 }}>{student.loginId}</div>
                        <div style={{ fontSize: 10, marginTop: 3, color: student.profile ? green : gray2 }}>
                          {student.profile ? "● 已测评" : "○ 未测评"} · {student.classCode}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!selectedStudent ? (
                  <EmptyState text="请选择一名学生查看画像与学习记录。" />
                ) : (
                  <>
                    <StudentDetail
                      student={selectedStudent}
                      classRecords={classRecords}
                      advice={adviceById[selectedStudent.id]}
                      adviceLoading={adviceLoadingId === selectedStudent.id}
                      adviceError={adviceError}
                      onGenerateAdvice={generateAdvice}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
