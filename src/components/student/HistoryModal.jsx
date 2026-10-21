// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 历史测评弹窗：按时间倒序展示本人测评记录与高低维度标签。
import { DIMS, TYPES, dark1, gray1, gray3, green, red, text1 } from "../../constants.js";
import { formatDateTime } from "../../api/analytics.js";

export default function HistoryModal({ assessments, onSelect, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: dark1,
          borderRadius: "20px 20px 0 0",
          border: "1px solid rgba(139,92,246,0.3)",
          maxHeight: "75vh",
          display: "flex",
          flexDirection: "column",
          animation: "profileGen 0.3s ease both",
        }}
        onClick={function (event) {
          event.stopPropagation();
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(51,65,85,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: text1 }}>历史测评记录</div>
            <div style={{ fontSize: 11, color: gray1, marginTop: 2 }}>共 {assessments.length} 次测评</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: gray1, fontSize: 20, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {assessments.map(function (assessment, index) {
            const type = TYPES[assessment.profile_type] || TYPES.GROW;
            const scores = assessment.scores || {};
            const levels = scores.lvls || {};
            return (
              <div
                key={assessment.id}
                onClick={function () {
                  onSelect(assessment.id);
                }}
                style={{
                  background: "rgba(30,41,59,0.8)",
                  borderRadius: 14,
                  border: "1px solid " + type.color + "44",
                  padding: "14px 16px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: type.color + "22",
                      border: "1px solid " + type.color + "44",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      color: type.color,
                    }}
                  >
                    兵
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: text1 }}>{type.cn}</div>
                    <div style={{ fontSize: 11, color: gray1, marginTop: 2 }}>
                      {formatDateTime(assessment.created_at)} · {scores.matchInfo || type.code}
                    </div>
                  </div>
                  {index === 0 && (
                    <div
                      style={{
                        fontSize: 10,
                        color: green,
                        padding: "3px 8px",
                        background: "rgba(34,197,94,0.1)",
                        border: "1px solid rgba(34,197,94,0.3)",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                      }}
                    >
                      最新
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: type.color }}>查看 →</div>
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {DIMS.filter(function (dim) {
                    return levels[dim] === "H";
                  })
                    .slice(0, 3)
                    .map(function (dim) {
                      return (
                        <span
                          key={dim}
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            background: "rgba(34,197,94,0.1)",
                            border: "1px solid rgba(34,197,94,0.2)",
                            color: green,
                            borderRadius: 999,
                          }}
                        >
                          ↑{dim}
                        </span>
                      );
                    })}
                  {DIMS.filter(function (dim) {
                    return levels[dim] === "L";
                  })
                    .slice(0, 2)
                    .map(function (dim) {
                      return (
                        <span
                          key={dim}
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            color: red,
                            borderRadius: 999,
                          }}
                        >
                          ↓{dim}
                        </span>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(51,65,85,0.3)", flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 10,
              fontSize: 13,
              background: "transparent",
              border: "1px solid rgba(51,65,85,0.4)",
              color: gray3,
              cursor: "pointer",
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
