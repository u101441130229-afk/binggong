// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 案例学习完成页：展示完成提示、思政关联推荐与后续学习入口。
import { CASES, CASE_LINKS, cyan, dark1, gray3, green, text2, yellow } from "../../constants.js";

export default function CaseCompletion({ caseId, onSwitchCase, onBack, onRetake }) {
  const currentCase = CASES[caseId];
  return (
    <div style={{ paddingBottom: 80, animation: "profileGen 0.4s ease both" }}>
      <div
        style={{
          background: "linear-gradient(135deg,rgba(34,197,94,0.1),rgba(6,182,212,0.06))",
          border: "1px solid rgba(34,197,94,0.3)",
          borderRadius: 14,
          padding: "20px",
          textAlign: "center",
          marginTop: 16,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏅</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: green, marginBottom: 6 }}>
          《{currentCase.title}》学习完成！
        </div>
        <div style={{ fontSize: 13, color: text2, lineHeight: 1.75, marginBottom: 14 }}>
          本次学习已计入你的学习行为记录，可在教师端参与学习情况统计。
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          {currentCase.tags.map(function (tag, index) {
            return (
              <span
                key={index}
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  color: green,
                  borderRadius: 999,
                }}
              >
                {tag}
              </span>
            );
          })}
        </div>

        {CASE_LINKS[caseId] &&
          (function () {
            const link = CASE_LINKS[caseId];
            const nextCase = CASES[link.to];
            return (
              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(234,179,8,0.06)",
                  border: "1px solid rgba(234,179,8,0.2)",
                  borderRadius: 10,
                  marginBottom: 12,
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: 11, color: yellow, fontWeight: 600, marginBottom: 6 }}>
                  🔗 思政关联 · 共同精神内核
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: yellow,
                    fontWeight: 700,
                    marginBottom: 6,
                    padding: "3px 10px",
                    background: "rgba(234,179,8,0.1)",
                    borderRadius: 999,
                    display: "inline-block",
                  }}
                >
                  “{link.theme}”
                </div>
                <div style={{ fontSize: 12, color: text2, lineHeight: 1.7, marginBottom: 10 }}>{link.bridge}</div>
                <div
                  onClick={function () {
                    onSwitchCase(link.to);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    background: dark1,
                    border: "1px solid rgba(234,179,8,0.25)",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: gray3 }}>下一个推荐</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: yellow }}>{nextCase.title}</div>
                  </div>
                  <div style={{ fontSize: 12, color: yellow }}>→</div>
                </div>
              </div>
            );
          })()}

        <div
          style={{
            padding: "12px 14px",
            background: "rgba(6,182,212,0.06)",
            border: "1px solid rgba(6,182,212,0.2)",
            borderRadius: 10,
            marginBottom: 12,
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: 11, color: cyan, fontWeight: 600, marginBottom: 4 }}>💬 想继续聊？</div>
          <div style={{ fontSize: 12, color: text2, lineHeight: 1.65 }}>
            返回后点击页面右下角的小备，可以和它继续聊这个故事。
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: 10,
              background: "rgba(6,182,212,0.15)",
              border: "1px solid rgba(6,182,212,0.3)",
              color: cyan,
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            继续学习 →
          </button>
          <button
            onClick={function () {
              if (onRetake) onRetake();
              else onBack();
            }}
            style={{
              padding: "11px 16px",
              borderRadius: 10,
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.2)",
              color: "#a855f7",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            🔁 重新测评
          </button>
        </div>
      </div>
    </div>
  );
}
