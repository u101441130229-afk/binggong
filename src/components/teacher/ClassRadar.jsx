// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 教师端班级八维雷达图：对比学生个人画像与本班已测评学生均值。
import { DIMS, cyan, dark2, dimMeta, gray2, gray3, green, purple, red, text1, yellow } from "../../constants.js";
import { computeDimensionAverages } from "../../api/analytics.js";

const LEVEL_RATIO = { L: 0.25, M: 0.58, H: 0.92 };

export default function ClassRadar({ student, classRecords }) {
  const classAverages = computeDimensionAverages(classRecords);
  const assessedPeers = classRecords.filter(function (item) {
    return item.profile;
  }).length;
  const hasClass = assessedPeers > 1;
  const angleStep = (Math.PI * 2) / DIMS.length;
  const centerX = 130;
  const centerY = 120;
  const radius = 72;

  function point(index, ratio) {
    const angle = -Math.PI / 2 + index * angleStep;
    return { x: centerX + radius * ratio * Math.cos(angle), y: centerY + radius * ratio * Math.sin(angle) };
  }
  function buildPath(ratios) {
    return (
      ratios
        .map(function (ratio, index) {
          const item = point(index, ratio);
          return `${index === 0 ? "M" : "L"} ${item.x.toFixed(1)} ${item.y.toFixed(1)}`;
        })
        .join(" ") + " Z"
    );
  }

  const personalPath = buildPath(
    DIMS.map(function (dim) {
      return LEVEL_RATIO[student.profile.lvls[dim]] || 0.5;
    })
  );
  const classPath = buildPath(
    classAverages.map(function (item) {
      return item.avg === null ? 0 : Math.max(0.06, item.avg / 8);
    })
  );
  const grids = [0.33, 0.67, 1]
    .map(function (ratio) {
      return DIMS.map(function (_, index) {
        return point(index, ratio);
      });
    })
    .map(function (items) {
      return (
        items
          .map(function (item, index) {
            return `${index === 0 ? "M" : "L"} ${item.x.toFixed(1)} ${item.y.toFixed(1)}`;
          })
          .join(" ") + " Z"
      );
    });

  return (
    <div
      style={{
        background: dark2,
        borderRadius: 14,
        border: "1px solid rgba(139,92,246,0.15)",
        padding: "16px 18px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: text1, fontWeight: 700 }}>本班八维画像均值（{student.classCode}）</div>
          <div style={{ fontSize: 11, color: gray2, marginTop: 3 }}>
            已测评 {assessedPeers} 人 · 数据来自本人测评记录
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              background: "rgba(6,182,212,0.08)",
              borderRadius: 8,
              border: "1px solid rgba(6,182,212,0.2)",
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 2, background: cyan }} />
            <div style={{ fontSize: 11, color: text1, fontWeight: 600 }}>该生</div>
          </div>
          {hasClass && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                background: "rgba(168,85,247,0.08)",
                borderRadius: 8,
                border: "1px solid rgba(168,85,247,0.2)",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: "transparent",
                  border: "2px dashed " + purple,
                }}
              />
              <div style={{ fontSize: 11, color: text1, fontWeight: 600 }}>班级均值</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <svg width="340" height="300" viewBox="0 0 260 240">
          {grids.map(function (path, index) {
            return <path key={index} d={path} fill="none" stroke="rgba(100,116,139,0.18)" strokeWidth="1" />;
          })}
          {DIMS.map(function (dim, index) {
            const item = point(index, 1);
            return (
              <line
                key={dim}
                x1={centerX}
                y1={centerY}
                x2={item.x.toFixed(1)}
                y2={item.y.toFixed(1)}
                stroke="rgba(100,116,139,0.15)"
                strokeWidth="1"
              />
            );
          })}
          {hasClass && (
            <path
              d={classPath}
              fill="rgba(168,85,247,0.15)"
              stroke={purple}
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeDasharray="4 2"
            />
          )}
          <path d={personalPath} fill="rgba(6,182,212,0.12)" stroke={cyan} strokeWidth="2" strokeLinejoin="round" />
          {DIMS.map(function (dim, index) {
            const item = point(index, 1.28);
            const anchor = item.x < centerX - 4 ? "end" : item.x > centerX + 4 ? "start" : "middle";
            const levelColor =
              student.profile.lvls[dim] === "H" ? green : student.profile.lvls[dim] === "M" ? yellow : red;
            return (
              <g key={dim}>
                <text x={item.x} y={item.y - 3} textAnchor={anchor} fontSize="8" fontWeight="700" fill={levelColor}>
                  {dim}
                </text>
                <text x={item.x} y={item.y + 8} textAnchor={anchor} fontSize="7" fill="#64748b">
                  {dimMeta[dim].name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hasClass ? (
        <div
          style={{
            padding: "10px 12px",
            background: "rgba(139,92,246,0.06)",
            borderRadius: 10,
            border: "1px solid rgba(139,92,246,0.15)",
          }}
        >
          <div style={{ fontSize: 11, color: purple, fontWeight: 700, marginBottom: 8 }}>
            与班级均值对比（个人得分 / 班级均分）
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DIMS.map(function (dim) {
              const average = classAverages.find(function (item) {
                return item.dim === dim;
              });
              const personal = student.profile.raw[dim];
              const difference = average.avg === null ? 0 : Math.round((personal - average.avg) * 10) / 10;
              const color = difference > 0 ? green : difference < 0 ? red : gray3;
              const icon = difference > 0 ? "▲" : difference < 0 ? "▼" : "=";
              return (
                <div
                  key={dim}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background:
                      difference > 0
                        ? "rgba(34,197,94,0.08)"
                        : difference < 0
                          ? "rgba(239,68,68,0.08)"
                          : "rgba(51,65,85,0.3)",
                    border:
                      "1px solid " +
                      (difference > 0
                        ? "rgba(34,197,94,0.2)"
                        : difference < 0
                          ? "rgba(239,68,68,0.2)"
                          : "rgba(51,65,85,0.3)"),
                  }}
                >
                  <span style={{ fontSize: 10, color: color, fontWeight: 700 }}>{icon}</span>
                  <span style={{ fontSize: 10, color: color, fontWeight: 600 }}>{dim}</span>
                  <span style={{ fontSize: 10, color: gray3 }}>
                    {personal} / {average.avg === null ? "暂无" : average.avg}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "10px 12px",
            background: "rgba(15,23,42,0.5)",
            borderRadius: 10,
            fontSize: 11,
            color: gray3,
          }}
        >
          本班暂无其他已测评学生，暂只能展示该生个人画像。
        </div>
      )}
    </div>
  );
}
