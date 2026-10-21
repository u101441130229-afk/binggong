// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 兵工案例学习页：展示课程团队编写的案例材料，完成学习后写入真实行为记录。
import { useEffect, useState } from "react";
import {
  CASES,
  CASE_LINKS,
  CASE_ORDER,
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
import useTyping from "../hooks/useTyping.js";
import { FadeIn } from "../utils.jsx";
import ImageCarousel from "./case/ImageCarousel.jsx";
import CaseCompletion from "./case/CaseCompletion.jsx";
import CasePrepare from "./case/CasePrepare.jsx";
import KnowledgeGraph from "./case/KnowledgeGraph.jsx";
import QuestionBlock from "./case/QuestionBlock.jsx";
import XiaoBei from "./XiaoBei.jsx";

export default function CaseStudyView({ caseId, learnedCases = [], onComplete, onBack, onSwitchCase, onRetake }) {
  const currentCase = CASES[caseId];
  const [phase, setPhase] = useState(1);
  const [prepareStep, setPrepareStep] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [typedContent, contentDone] = useTyping(currentCase.content, 10, phase === 2);

  useEffect(
    function () {
      const timers = [
        setTimeout(function () {
          setPrepareStep(1);
        }, 450),
        setTimeout(function () {
          setPrepareStep(2);
        }, 900),
        setTimeout(function () {
          setPrepareStep(3);
        }, 1350),
        setTimeout(function () {
          setPrepareStep(4);
        }, 1800),
        setTimeout(function () {
          setPhase(2);
        }, 2150),
      ];
      return function () {
        timers.forEach(clearTimeout);
      };
    },
    [caseId]
  );

  async function handleCompleteCase() {
    if (completing || showComplete) return;
    setCompleting(true);
    setCompleteError("");
    try {
      if (onComplete) await onComplete(caseId);
      setShowComplete(true);
    } catch (error) {
      setCompleteError(error?.message || "学习记录保存失败，请检查网络后重试");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div style={{ background: dark0, minHeight: "100%", color: text1 }}>
      <div
        style={{
          background: "linear-gradient(135deg," + dark1 + "," + dark3 + ")",
          borderBottom: "1px solid rgba(59,130,246,0.2)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          兵
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>兵工案例 · 智能学习</div>
          <div style={{ fontSize: 11, color: gray1, marginTop: 2 }}>当前案例：{currentCase.name}</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={function () {
              setShowGraph(true);
            }}
            style={{
              fontSize: 10,
              color: cyan,
              padding: "4px 10px",
              background: "rgba(6,182,212,0.1)",
              border: "1px solid rgba(6,182,212,0.25)",
              borderRadius: 999,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            🕸 知识图谱
          </button>
        </div>
      </div>

      {showGraph && (
        <KnowledgeGraph
          caseId={caseId}
          onClose={function () {
            setShowGraph(false);
          }}
        />
      )}

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: gray1 }}>切换案例：</span>
          {CASE_ORDER.map(function (id) {
            const item = CASES[id];
            const active = caseId === id;
            const disabled = phase === 1 && !active;
            const learned = learnedCases.indexOf(id) >= 0;
            return (
              <button
                key={id}
                onClick={function () {
                  if (!disabled) onSwitchCase(id);
                }}
                disabled={disabled}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.35 : 1,
                  background: active ? "rgba(59,130,246,0.2)" : "rgba(30,41,59,0.6)",
                  border: "1px solid " + (active ? "rgba(59,130,246,0.5)" : "rgba(51,65,85,0.4)"),
                  color: active ? "#60a5fa" : gray1,
                  transition: "opacity 0.3s",
                }}
              >
                {item.name}
                {learned ? " ✓" : ""}
              </button>
            );
          })}
        </div>

        {phase === 1 && (
          <FadeIn keyProp={"prepare-" + caseId}>
            <CasePrepare prepareStep={prepareStep} />
          </FadeIn>
        )}

        {phase === 2 && (
          <FadeIn keyProp={"result-" + caseId}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {["案例背景", "图片资料", "思政映射", "引导问题"].map(function (name) {
                return (
                  <div
                    key={name}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      color: green,
                    }}
                  >
                    ✓ {name}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "14px 16px",
                background: "rgba(6,182,212,0.06)",
                border: "1px solid rgba(6,182,212,0.2)",
                borderRadius: 12,
                marginBottom: 14,
              }}
            >
              <XiaoBei size={56} speaking={true} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: cyan, fontWeight: 600, marginBottom: 4 }}>小备讲解</div>
                <div style={{ fontSize: 13, color: text2, lineHeight: 1.7 }}>
                  这是 {currentCase.title} 的故事。读完之后，我会和你一起，从三个角度展开思考。
                </div>
              </div>
            </div>

            <div
              style={{
                background: dark2,
                borderRadius: 14,
                border: "1px solid rgba(59,130,246,0.15)",
                overflow: "hidden",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  background: "rgba(59,130,246,0.08)",
                  borderBottom: "1px solid rgba(59,130,246,0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span>📖</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{currentCase.title}</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: gray3,
                    background: "rgba(59,130,246,0.1)",
                    padding: "3px 10px",
                    borderRadius: 10,
                  }}
                >
                  {currentCase.type}
                </span>
              </div>
              {currentCase.images && currentCase.images.length > 0 && (
                <ImageCarousel images={currentCase.images} title={currentCase.title} />
              )}
              <div style={{ padding: "16px 18px" }}>
                {!contentDone ? (
                  <div style={{ fontSize: 13.5, lineHeight: 1.9, color: text2, whiteSpace: "pre-wrap" }}>
                    {typedContent}
                    <span style={{ animation: "pulse 0.8s infinite" }}>▍</span>
                  </div>
                ) : (
                  typedContent.split("\n\n").map(function (paragraph, index, all) {
                    return (
                      <div
                        key={index}
                        style={{
                          fontSize: 13.5,
                          lineHeight: 1.9,
                          color: text2,
                          marginBottom: index < all.length - 1 ? 14 : 0,
                          paddingBottom: index < all.length - 1 ? 14 : 0,
                          borderBottom: index < all.length - 1 ? "1px solid rgba(51,65,85,0.2)" : "none",
                        }}
                      >
                        {paragraph}
                      </div>
                    );
                  })
                )}
              </div>
              {contentDone && (
                <div
                  style={{
                    padding: "10px 18px 14px",
                    borderTop: "1px solid rgba(51,65,85,0.3)",
                    display: "flex",
                    gap: 12,
                    fontSize: 11,
                    color: gray3,
                    flexWrap: "wrap",
                  }}
                >
                  <span>关键人物：{currentCase.keyPeople}</span>
                  <span>·</span>
                  <span>时间线：{currentCase.timeline}</span>
                </div>
              )}
            </div>

            {contentDone && (
              <FadeIn keyProp={"after-" + caseId}>
                <div
                  style={{
                    background: "rgba(234,179,8,0.06)",
                    borderRadius: 12,
                    padding: "12px 18px",
                    border: "1px solid rgba(234,179,8,0.15)",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span>🔗</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: yellow, fontWeight: 600, marginBottom: 4 }}>
                      思政映射 · 本案例关联主题
                    </div>
                    <div style={{ fontSize: 13, color: "#fbbf24" }}>{currentCase.tags.join(" · ")}</div>
                  </div>
                </div>

                <div
                  style={{
                    background: dark2,
                    borderRadius: 14,
                    border: "1px solid rgba(6,182,212,0.15)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 18px",
                      background: "rgba(6,182,212,0.08)",
                      borderBottom: "1px solid rgba(6,182,212,0.1)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span>💡</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>引导思考</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: gray2 }}>写下你的思考，小备会回应</span>
                  </div>
                  <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                    {currentCase.questions.map(function (question, index) {
                      return <QuestionBlock key={index} index={index} question={question} caseId={caseId} />;
                    })}
                  </div>
                </div>

                {!showComplete ? (
                  <div style={{ paddingBottom: 80 }}>
                    <button
                      onClick={handleCompleteCase}
                      disabled={completing}
                      style={{
                        marginTop: 16,
                        width: "100%",
                        padding: "14px",
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 700,
                        background: completing ? "rgba(51,65,85,0.6)" : "linear-gradient(135deg,#22c55e,#16a34a)",
                        border: "none",
                        color: completing ? gray2 : "#fff",
                        cursor: completing ? "wait" : "pointer",
                      }}
                    >
                      {completing ? "正在保存学习记录…" : "✓ 标记本案例学习完成"}
                    </button>
                    {completeError && (
                      <div style={{ marginTop: 8, fontSize: 12, color: red, textAlign: "center" }}>{completeError}</div>
                    )}
                    <button
                      onClick={onBack}
                      style={{
                        marginTop: 10,
                        width: "100%",
                        padding: "10px",
                        borderRadius: 10,
                        background: "transparent",
                        border: "1px solid rgba(59,130,246,0.2)",
                        color: "#60a5fa",
                        fontSize: 13,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      ← 返回我的画像
                    </button>
                  </div>
                ) : (
                  <CaseCompletion caseId={caseId} onSwitchCase={onSwitchCase} onBack={onBack} onRetake={onRetake} />
                )}
              </FadeIn>
            )}
          </FadeIn>
        )}
      </div>
    </div>
  );
}
