// TODO: DeepSeek接入点
import { useState, useEffect, useRef } from "react";
import {
  dark0, dark1, dark2, dark3,
  gray1, gray2, gray3,
  cyan, yellow, green, text1, text2,
  qs, optLabels, optValues, spQ1, spQ2,
  shuffle
} from "../constants.js";
import XiaoBei from "./XiaoBei.jsx";

// ============================================================
// SurveyView - 思政成长画像测评
// ============================================================
export default function SurveyView({ onComplete, onSkip }) {
  const [shuffled, setShuffled] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(function () {
    const s = shuffle(qs);
    s.splice(12, 0, spQ1); // 插入第13题位置，更自然
    setShuffled(s);
  }, []);

  function getVisible() {
    const v = shuffled.slice();
    const gi = v.findIndex(function (q) { return q.id === "guide_gate_q1"; });
    if (gi !== -1 && answers["guide_gate_q1"] === 3) { v.splice(gi + 1, 0, spQ2); }
    return v;
  }

  const vis = getVisible();
  const total = vis.length;
  const done = vis.filter(function (q) { return answers[q.id] !== undefined; }).length;
  const ok = done === total && total > 0;
  const questionRefs = useRef({});

  function selectAnswer(qid, val) {
    const next = Object.assign({}, answers, { [qid]: val });
    if (qid === "guide_gate_q1" && val !== 3) { delete next["guide_gate_q2"]; }
    setAnswers(next);

    // 自动滚动到下一题
    const visNow = getVisible();
    const curIdx = visNow.findIndex(function(q) { return q.id === qid; });
    const nextQ = visNow[curIdx + 1];
    if (nextQ) {
      setTimeout(function() {
        const el = questionRefs.current[nextQ.id];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 180);
    }
  }

  return (
    <div style={{ background: dark0, minHeight: "100%", color: text1 }}>
      <div style={{ background: "linear-gradient(135deg," + dark1 + "," + dark3 + ")", borderBottom: "1px solid rgba(59,130,246,0.2)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>兵</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>思政成长画像测评</div>
          <div style={{ fontSize: 11, color: gray1, marginTop: 2 }}>共 {total} 题 · 用于生成你的兵工思政画像</div>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 16px" }}>
        {/* 小备欢迎条 */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 14, marginBottom: 20 }}>
          <XiaoBei size={64} speaking={false} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: cyan, fontWeight: 600, marginBottom: 4 }}>小备说</div>
            <div style={{ fontSize: 13.5, color: text2, lineHeight: 1.7 }}>欢迎你。请凭第一感觉作答,没有标准答案——你的回答会用来为你匹配最契合的兵工故事。</div>
          </div>
        </div>

        {/* 进度条 — 增强版 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 10, background: "rgba(30,41,59,0.6)", borderRadius: 999, overflow: "hidden", position: "relative" }}>
              <div style={{
                width: (total ? (done / total * 100) : 0) + "%",
                height: "100%",
                background: (function () {
                  const pct = total ? done / total : 0;
                  return pct < 0.4
                    ? "linear-gradient(90deg,#ef4444,#f97316)"
                    : pct < 0.7
                      ? "linear-gradient(90deg,#f97316,#eab308)"
                      : "linear-gradient(90deg,#22c55e,#06b6d4)";
                })(),
                borderRadius: 999,
                transition: "width 0.4s cubic-bezier(0.34,1.2,0.64,1), background 0.6s ease",
                boxShadow: (function() {
                  const pct = total ? done / total : 0;
                  return pct < 0.4 ? "0 0 8px rgba(239,68,68,0.6)"
                    : pct < 0.7 ? "0 0 8px rgba(234,179,8,0.6)"
                    : "0 0 8px rgba(34,197,94,0.6)";
                })(),
                position: "relative"
              }}>
                {/* 流光效果 */}
                {done > 0 && (
                  <div style={{ position: "absolute", top: 0, right: 0, width: 20, height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)", animation: "pulse 1.5s ease-in-out infinite" }} />
                )}
              </div>
            </div>
            <div style={{ fontSize: 12, color: gray1, whiteSpace: "nowrap", minWidth: 40, textAlign: "right" }}>
              <span style={{ color: done === total && total > 0 ? "#22c55e" : "#06b6d4", fontWeight: 700 }}>{done}</span>
              <span style={{ color: gray2 }}>/{total}</span>
            </div>
          </div>
          {/* 里程碑节点 */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px" }}>
            {[0.25, 0.5, 0.75, 1].map(function(milestone, i) {
              const reached = total > 0 && done / total >= milestone;
              const labels = ["1/4", "一半啦", "快好了", "完成！"];
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: reached ? "#22c55e" : "rgba(51,65,85,0.6)", border: "1px solid " + (reached ? "#22c55e" : "rgba(51,65,85,0.4)"), transition: "all 0.3s", boxShadow: reached ? "0 0 6px rgba(34,197,94,0.6)" : "none" }} />
                  <div style={{ fontSize: 9, color: reached ? "#22c55e" : gray2, transition: "color 0.3s", fontWeight: reached ? 700 : 400 }}>{labels[i]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 题目列表 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {vis.map(function (q, i) {
            const labels = q.special ? q.labels : optLabels;
            const values = q.special ? q.opts : optValues;
            const isFirstSpecial = q.id === "guide_gate_q1";
            return (
              <div key={q.id} ref={function(el) { questionRefs.current[q.id] = el; }}>
                {/* 补充题出现提示 */}
                {isFirstSpecial && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 12, marginBottom: 8, animation: "fadeSlideUp 0.4s ease both" }}>
                    <XiaoBei size={32} speaking={false} />
                    <div style={{ flex: 1, fontSize: 12, color: yellow, lineHeight: 1.65 }}>
                      根据你的回答，小备想多问你一个问题——这会帮助系统为你生成更准确的画像。
                    </div>
                  </div>
                )}
                <div style={{ background: dark2, border: "1px solid " + (q.special ? "rgba(234,179,8,0.3)" : "rgba(51,65,85,0.5)"), borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: gray1, fontWeight: 600 }}>第 {i + 1} 题</div>
                    <div style={{ fontSize: 11, color: q.special ? yellow : gray2, padding: "3px 10px", background: q.special ? "rgba(234,179,8,0.1)" : "rgba(51,65,85,0.4)", borderRadius: 999 }}>
                      {q.special ? "补充题" : "维度已隐藏"}
                    </div>
                  </div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.7, color: text1, marginBottom: 12 }}>{q.text}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {values.map(function (v, j) {
                      const sel = answers[q.id] === v;
                      return (
                        <div key={j} onClick={function () { selectAnswer(q.id, v); }} style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10,
                          background: sel ? "rgba(59,130,246,0.15)" : "rgba(15,23,42,0.6)",
                          border: "1px solid " + (sel ? "rgba(59,130,246,0.5)" : "rgba(51,65,85,0.3)"),
                          cursor: "pointer", transition: "all 0.18s"
                        }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid " + (sel ? "#3b82f6" : gray2), background: sel ? "#3b82f6" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                          </div>
                          <div style={{ fontWeight: 700, color: sel ? "#60a5fa" : gray3, minWidth: 16 }}>{["A", "B", "C", "D"][j]}</div>
                          <div style={{ fontSize: 13.5, color: sel ? text1 : text2 }}>{labels[j]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部操作 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: ok ? green : gray1, lineHeight: 1.6, flex: 1, minWidth: 200 }}>
            {ok ? "✓ 全部完成,可以生成你的画像了" : "请完成全部题目后提交"}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onSkip} disabled={submitting} style={{ padding: "10px 18px", borderRadius: 10, background: "transparent", border: "1px solid rgba(100,116,139,0.4)", color: gray3, cursor: submitting ? "not-allowed" : "pointer", fontSize: 13, opacity: submitting ? 0.5 : 1 }}>跳过测评</button>
            <button
              onClick={function () {
                if (!ok || submitting) return;
                setSubmitting(true);
                setTimeout(function () { onComplete(answers); }, 600);
              }}
              disabled={!ok || submitting}
              style={{
                padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: ok && !submitting ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "rgba(51,65,85,0.4)",
                border: "none", color: ok && !submitting ? "#fff" : gray2,
                cursor: ok && !submitting ? "pointer" : "not-allowed",
                minWidth: 140, transition: "all 0.2s"
              }}>
              {submitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <span style={{ animation: "pulse 0.6s infinite" }}>⏳</span> 生成中…
                </span>
              ) : "生成我的画像 →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
