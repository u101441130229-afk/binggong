// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 每日一问弹窗：提交时记录一次学习行为，跳过不产生任何记录。
import { useState } from "react";
import { dark1, gray2, gray3, red, yellow, text1, getTodayQuestion } from "../constants.js";
import XiaoBei from "./XiaoBei.jsx";

const RESPONSES = [
  "这是一个很真实的思考。兵工人面对的很多选择，都没有标准答案——但认真想过，本身就是一种成长。",
  "你说的触到了核心。很多看似技术问题的背后，其实是价值判断。继续带着这个问题去看案例，会有新的感受。",
  "有自己的判断，这很好。去看看今天推荐的案例，看看那些做出类似选择的人是怎么想的。",
];

export default function DailyQuestion({ onClose, onSubmit }) {
  const question = getTodayQuestion();
  const [answered, setAnswered] = useState(false);
  const [input, setInput] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [response] = useState(function () {
    return RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
  });

  async function handleSubmit() {
    if (!input.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      if (onSubmit) await onSubmit(question.tag);
      setAnswered(true);
      setTimeout(function () {
        setShowResponse(true);
      }, 400);
    } catch (error) {
      setSubmitError(error?.message || "记录失败，请检查网络后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: dark1,
          borderRadius: 20,
          border: "1px solid rgba(234,179,8,0.3)",
          overflow: "hidden",
          animation: "profileGen 0.4s ease both",
        }}
      >
        <div
          style={{
            padding: "16px 18px 12px",
            borderBottom: "1px solid rgba(51,65,85,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: yellow, fontWeight: 700, letterSpacing: 1 }}>💡 今日一问</div>
            <div style={{ fontSize: 10, color: gray2, marginTop: 2 }}>每天一个兵工思政问题 · {question.tag}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: gray2, fontSize: 18, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "18px 18px 20px" }}>
          {!answered ? (
            <>
              <div style={{ fontSize: 14.5, color: text1, lineHeight: 1.8, marginBottom: 10, fontWeight: 500 }}>
                {question.q}
              </div>
              <div style={{ fontSize: 11, color: gray2, marginBottom: 16, fontStyle: "italic" }}>
                💭 {question.hint}
              </div>
              <textarea
                value={input}
                onChange={function (event) {
                  setInput(event.target.value);
                }}
                placeholder="写下你的第一反应，不用完整，几句话就行…"
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(51,65,85,0.5)",
                  color: text1,
                  fontSize: 16,
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                  lineHeight: 1.6,
                }}
              />
              {submitError && <div style={{ fontSize: 12, color: red, marginTop: 8 }}>{submitError}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  onClick={onClose}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 10,
                    background: "transparent",
                    border: "1px solid rgba(51,65,85,0.4)",
                    color: gray3,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontSize: 13,
                  }}
                >
                  跳过
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || submitting}
                  style={{
                    flex: 2,
                    padding: "10px",
                    borderRadius: 10,
                    background:
                      input.trim() && !submitting ? "linear-gradient(135deg,#eab308,#f59e0b)" : "rgba(51,65,85,0.4)",
                    border: "none",
                    color: input.trim() && !submitting ? dark1 : gray3,
                    cursor: input.trim() && !submitting ? "pointer" : "not-allowed",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {submitting ? "记录中…" : "提交我的思考"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ animation: "fadeSlideUp 0.4s ease both" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                <XiaoBei size={40} speaking={false} />
                <div
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    background: "rgba(6,182,212,0.08)",
                    border: "1px solid rgba(6,182,212,0.2)",
                    borderRadius: "4px 12px 12px 12px",
                    fontSize: 13,
                    color: text1,
                    lineHeight: 1.75,
                  }}
                >
                  {showResponse ? response : <span style={{ animation: "pulse 0.8s infinite" }}>▍</span>}
                </div>
              </div>
              {showResponse && (
                <button
                  onClick={onClose}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    animation: "fadeIn 0.3s ease both",
                  }}
                >
                  带着这个问题，开始今天的学习 →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
