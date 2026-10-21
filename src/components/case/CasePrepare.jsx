// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 案例学习准备：按顺序展示案例背景、图片资料、思政映射与引导问题的加载状态。
import { blue, gray1, gray3, green, text1 } from "../../constants.js";

const PREPARE_STEPS = [
  { label: "案例背景", desc: "整理型号研制历程与关键节点", icon: "📖" },
  { label: "图片资料", desc: "加载公开影像资料与装备图片", icon: "🖼" },
  { label: "思政映射", desc: "关联兵工精神与思政育人主题", icon: "🔗" },
  { label: "引导问题", desc: "准备案例后的思考与讨论问题", icon: "💡" },
];

export default function CasePrepare({ prepareStep }) {
  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ fontSize: 14, color: gray1, marginBottom: 20, textAlign: "center" }}>正在准备案例学习内容…</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {PREPARE_STEPS.map(function (step, index) {
          const done = prepareStep > index;
          const current = prepareStep === index + 1;
          const isLast = index === PREPARE_STEPS.length - 1;
          return (
            <div key={step.label}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 20px",
                  borderRadius: 12,
                  background: current ? "rgba(59,130,246,0.15)" : done ? "rgba(34,197,94,0.08)" : "rgba(30,41,59,0.6)",
                  border:
                    "1px solid " +
                    (current ? "rgba(59,130,246,0.4)" : done ? "rgba(34,197,94,0.2)" : "rgba(51,65,85,0.4)"),
                  transition: "all 0.4s",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: done ? "rgba(34,197,94,0.2)" : current ? "rgba(59,130,246,0.25)" : "rgba(30,41,59,0.8)",
                    border: "2px solid " + (done ? green : current ? blue : "#334155"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    transition: "all 0.4s",
                  }}
                >
                  {done ? (
                    <span style={{ color: green, fontSize: 13 }}>✓</span>
                  ) : (
                    <span style={{ fontSize: 15 }}>{step.icon}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: done ? text1 : gray1 }}>{step.label}</div>
                  <div style={{ fontSize: 12, color: gray3, marginTop: 2 }}>{step.desc}</div>
                </div>
                <div style={{ fontSize: 11, color: done ? green : current ? blue : "#334155", fontWeight: 600 }}>
                  {done ? "✓ 完成" : current ? "准备中…" : "等待"}
                </div>
              </div>
              {!isLast && (
                <div style={{ display: "flex", alignItems: "center", paddingLeft: 34, height: 24 }}>
                  <div
                    style={{
                      width: 2,
                      height: "100%",
                      background: done ? "rgba(34,197,94,0.5)" : "rgba(51,65,85,0.4)",
                      margin: "0 15px",
                      transition: "background 0.4s",
                      position: "relative",
                    }}
                  >
                    {done && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: -4,
                          left: -4,
                          width: 0,
                          height: 0,
                          borderLeft: "5px solid transparent",
                          borderRight: "5px solid transparent",
                          borderTop: "7px solid rgba(34,197,94,0.6)",
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: done ? "rgba(34,197,94,0.6)" : "rgba(51,65,85,0.5)",
                      marginLeft: 4,
                    }}
                  >
                    {done ? "→ 已就绪" : ""}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
