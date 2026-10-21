// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 兵工学习进度条：展示已完成案例数量与各案例完成状态。
import { CASES, CASE_ORDER, gray2, green } from "../../constants.js";

export default function LearnedCasesBanner({ learnedCases }) {
  if (learnedCases.length === 0) return null;
  return (
    <div
      style={{
        background: "rgba(34,197,94,0.06)",
        border: "1px solid rgba(34,197,94,0.2)",
        borderRadius: 14,
        padding: "12px 18px",
        marginBottom: 18,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 22 }}>🏅</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: green, fontWeight: 700, marginBottom: 4 }}>
          兵工学习进度 · 已完成 {learnedCases.length}/{CASE_ORDER.length} 个案例
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CASE_ORDER.map(function (id) {
            const done = learnedCases.indexOf(id) >= 0;
            return (
              <span
                key={id}
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontWeight: 600,
                  background: done ? "rgba(34,197,94,0.15)" : "rgba(51,65,85,0.3)",
                  color: done ? green : gray2,
                  border: "1px solid " + (done ? "rgba(34,197,94,0.3)" : "rgba(51,65,85,0.3)"),
                }}
              >
                {done ? "✓ " : ""}
                {CASES[id].name}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
