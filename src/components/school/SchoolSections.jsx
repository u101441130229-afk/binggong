// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 学校端数据区：概览指标、八维群体画像与思政主题热度。
import { dark2, gray1, gray2, green, red, text1, text2, yellow } from "../../constants.js";
import { EmptyState } from "./SchoolCharts.jsx";

export function StatCards({ stats }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
        gap: 12,
        marginBottom: 24,
      }}
    >
      {stats.map(function (stat) {
        return (
          <div
            key={stat.label}
            style={{
              background: "linear-gradient(135deg," + dark2 + "," + stat.color + "0a)",
              borderRadius: 14,
              padding: "18px 16px",
              textAlign: "center",
              border: "1px solid " + stat.color + "33",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -15,
                right: -15,
                width: 70,
                height: 70,
                borderRadius: "50%",
                background: "radial-gradient(circle," + stat.color + "22 0%,transparent 70%)",
              }}
            />
            <div style={{ fontSize: 26, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: gray2, marginTop: 6, fontWeight: 600 }}>{stat.label}</div>
            {stat.sub && <div style={{ fontSize: 10, color: stat.color, marginTop: 4 }}>{stat.sub}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function DimensionPanel({ dimensionAverages, dimensionSummary, hasDimensionData, barsVisible }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, color: text1, marginBottom: 10, fontWeight: 700 }}>八维群体思政画像</div>
      <div style={{ background: dark2, borderRadius: 14, border: "1px solid rgba(51,65,85,0.4)", padding: 16 }}>
        {!hasDimensionData ? (
          <EmptyState text="暂无测评数据。学生完成测评后，这里会显示群体八维均值。" />
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {dimensionAverages.map(function (item, index) {
                const value = item.avg === null ? 0 : item.avg;
                const color = value >= 6.5 ? green : value >= 5 ? yellow : red;
                return (
                  <div key={item.dim} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 110, flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: text1 }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: color, fontWeight: 600 }}>
                        {item.dim} ·{" "}
                        {item.avg === null ? "暂无" : value >= 6.5 ? "较高" : value >= 5 ? "中等" : "待关注"}
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 24,
                        background: "rgba(30,41,59,0.6)",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: barsVisible ? (value / 8) * 100 + "%" : "0%",
                          background: "linear-gradient(90deg," + color + "88," + color + ")",
                          borderRadius: 8,
                          transition: "width 1.2s cubic-bezier(0.4,0,0.2,1) " + index * 0.08 + "s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          paddingRight: 10,
                          boxSizing: "border-box",
                        }}
                      >
                        {barsVisible && (
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{item.avg}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {dimensionSummary.hasData && (
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div
                  style={{
                    padding: "10px 12px",
                    background: "rgba(34,197,94,0.06)",
                    border: "1px solid rgba(34,197,94,0.15)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 11, color: green, fontWeight: 700, marginBottom: 6 }}>优势维度</div>
                  <div style={{ fontSize: 11, color: text2, lineHeight: 1.7 }}>
                    {dimensionSummary.top
                      .map(function (item) {
                        return item.name + " " + item.avg;
                      })
                      .join(" · ")}
                  </div>
                </div>
                <div
                  style={{
                    padding: "10px 12px",
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 11, color: red, fontWeight: 700, marginBottom: 6 }}>待关注维度</div>
                  <div style={{ fontSize: 11, color: text2, lineHeight: 1.7 }}>
                    {dimensionSummary.weak
                      .map(function (item) {
                        return item.name + " " + item.avg;
                      })
                      .join(" · ")}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function TopicHeat({ topicHeat, barsVisible }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, color: gray1, marginBottom: 10, fontWeight: 600 }}>思政主题参与热度</div>
      {topicHeat.length === 0 ? (
        <EmptyState text="暂无案例学习记录，暂无法统计主题热度。" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {topicHeat.map(function (topic, index) {
            return (
              <div key={topic.topic} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, width: 100, flexShrink: 0 }}>{topic.topic}</span>
                <div
                  style={{
                    flex: 1,
                    height: 24,
                    background: "rgba(30,41,59,0.6)",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: barsVisible ? topic.heat + "%" : "0%",
                      background: topic.color,
                      borderRadius: 6,
                      transition: "width 1.2s cubic-bezier(0.4,0,0.2,1) " + index * 0.1 + "s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      paddingRight: 8,
                      boxSizing: "border-box",
                    }}
                  >
                    {barsVisible && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{topic.count}次</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
