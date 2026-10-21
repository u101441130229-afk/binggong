// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 学校端图表：画像类型环图、周测评柱状图、班级与专业统计表。
import { useState } from "react";
import { blue, cyan, dark2, gray1, gray2, gray3, green, text1, text2, yellow } from "../../constants.js";

export function EmptyState({ text }) {
  return (
    <div
      style={{
        padding: "26px 18px",
        textAlign: "center",
        color: gray3,
        fontSize: 12,
        lineHeight: 1.8,
        background: "rgba(15,23,42,0.4)",
        border: "1px dashed rgba(100,116,139,0.35)",
        borderRadius: 12,
      }}
    >
      {text}
    </div>
  );
}

export function PieChart({ typeData, visible }) {
  const [hovered, setHovered] = useState(null);
  const total = typeData.reduce(function (sum, item) {
    return sum + item.count;
  }, 0);
  const cx = 80;
  const cy = 80;
  const radius = 64;
  const innerRadius = 30;
  const hoverRadius = 70;

  function polar(angle, distance) {
    return { x: cx + distance * Math.cos(angle), y: cy + distance * Math.sin(angle) };
  }
  function slicePath(start, end, outer, inner) {
    const startOuter = polar(start, outer);
    const endOuter = polar(end, outer);
    const startInner = polar(end, inner);
    const endInner = polar(start, inner);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M ${startOuter.x.toFixed(2)} ${startOuter.y.toFixed(2)} A ${outer} ${outer} 0 ${largeArc} 1 ${endOuter.x.toFixed(2)} ${endOuter.y.toFixed(2)} L ${startInner.x.toFixed(2)} ${startInner.y.toFixed(2)} A ${inner} ${inner} 0 ${largeArc} 0 ${endInner.x.toFixed(2)} ${endInner.y.toFixed(2)} Z`;
  }

  const slices = typeData.map(function (item, index) {
    const preceding = typeData.slice(0, index).reduce(function (sum, previous) {
      return sum + previous.count;
    }, 0);
    const startAngle = -Math.PI / 2 + (preceding / total) * Math.PI * 2;
    const endAngle = startAngle + (item.count / total) * Math.PI * 2;
    const normalPath = slicePath(startAngle, endAngle, radius, innerRadius);
    const hoverPath = slicePath(startAngle, endAngle, hoverRadius, innerRadius - 2);
    return { ...item, normalPath, hoverPath, percent: Math.round((item.count / total) * 100) };
  });
  const hoveredSlice = hovered !== null ? slices[hovered] : null;

  if (total === 0) return <EmptyState text="暂无测评类型数据。" />;

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
        {slices.map(function (slice, index) {
          const active = hovered === index;
          return (
            <path
              key={slice.code}
              d={active ? slice.hoverPath : slice.normalPath}
              fill={slice.color}
              opacity={visible ? (active ? 1 : 0.78) : 0}
              style={{ transition: "opacity 0.8s " + index * 0.08 + "s ease, d 0.15s ease", cursor: "pointer" }}
              onMouseEnter={function () {
                setHovered(index);
              }}
              onMouseLeave={function () {
                setHovered(null);
              }}
              onClick={function () {
                setHovered(hovered === index ? null : index);
              }}
            />
          );
        })}
        {hoveredSlice ? (
          <>
            <text x={cx} y={cy - 10} textAnchor="middle" fontSize="13" fontWeight="800" fill={hoveredSlice.color}>
              {hoveredSlice.count}人
            </text>
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="8" fill={text2}>
              {hoveredSlice.cn}
            </text>
            <text x={cx} y={cy + 16} textAnchor="middle" fontSize="9" fontWeight="700" fill={hoveredSlice.color}>
              {hoveredSlice.percent}%
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="800" fill={text1}>
              {total}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill={gray3}>
              已测评学生
            </text>
          </>
        )}
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, minWidth: 140 }}>
        {slices.map(function (slice, index) {
          const active = hovered === index;
          return (
            <div
              key={slice.code}
              onMouseEnter={function () {
                setHovered(index);
              }}
              onMouseLeave={function () {
                setHovered(null);
              }}
              onClick={function () {
                setHovered(hovered === index ? null : index);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "3px 6px",
                borderRadius: 6,
                cursor: "pointer",
                background: active ? slice.color + "12" : "transparent",
                transition: "background 0.15s",
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: 3, background: slice.color, flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: active ? text1 : text2, flex: 1 }}>{slice.cn}</div>
              <div style={{ fontSize: 11, color: slice.color, fontWeight: 700 }}>{slice.count}人</div>
              <div style={{ fontSize: 10, color: active ? slice.color : gray2, minWidth: 28, textAlign: "right" }}>
                {slice.percent}%
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: 10, color: gray2, marginTop: 4, paddingLeft: 6 }}>点击扇形或图例查看详情</div>
      </div>
    </div>
  );
}

export function WeeklyBars({ weekly, visible }) {
  const maxCount = Math.max(
    1,
    ...weekly.map(function (item) {
      return item.count;
    })
  );
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 150, padding: "8px 4px 0" }}>
      {weekly.map(function (item, index) {
        const height = item.count === 0 ? 2 : Math.max(10, (item.count / maxCount) * 100);
        return (
          <div
            key={item.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              height: "100%",
              justifyContent: "flex-end",
            }}
          >
            <div style={{ fontSize: 11, color: item.count > 0 ? cyan : gray2, fontWeight: 700 }}>{item.count}</div>
            <div
              style={{
                width: "100%",
                maxWidth: 56,
                height: visible ? height + "%" : 0,
                background:
                  item.count > 0 ? "linear-gradient(180deg," + cyan + "cc," + blue + "99)" : "rgba(51,65,85,0.6)",
                borderRadius: "6px 6px 0 0",
                transition: "height 0.8s cubic-bezier(0.4,0,0.2,1) " + index * 0.08 + "s",
              }}
            />
            <div style={{ fontSize: 10, color: gray3, whiteSpace: "nowrap" }}>{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export function ClassTable({ rows }) {
  return (
    <div style={{ background: dark2, borderRadius: 14, border: "1px solid rgba(51,65,85,0.4)", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 520 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 60px 70px 80px 2fr",
              padding: "10px 18px",
              background: "rgba(30,41,59,0.6)",
              fontSize: 11,
              color: gray1,
              fontWeight: 600,
            }}
          >
            <span>班级</span>
            <span style={{ textAlign: "center" }}>人数</span>
            <span style={{ textAlign: "center" }}>已测评</span>
            <span style={{ textAlign: "center" }}>参与率</span>
            <span style={{ textAlign: "center" }}>主导画像</span>
          </div>
          {rows.map(function (row) {
            return (
              <div
                key={row.className}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 60px 70px 80px 2fr",
                  padding: "12px 18px",
                  borderTop: "1px solid rgba(51,65,85,0.3)",
                  fontSize: 12,
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600 }}>{row.className}</span>
                <span style={{ textAlign: "center", color: gray3 }}>{row.total}</span>
                <span style={{ textAlign: "center", color: green }}>{row.assessed}</span>
                <span style={{ textAlign: "center" }}>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 8,
                      background: row.participation >= 80 ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)",
                      color: row.participation >= 80 ? green : yellow,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {row.participation}%
                  </span>
                </span>
                <span style={{ textAlign: "center", color: row.dominant === "暂无" ? gray2 : cyan, fontSize: 11 }}>
                  {row.dominant}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MajorTable({ rows }) {
  return (
    <div style={{ background: dark2, borderRadius: 14, border: "1px solid rgba(51,65,85,0.4)", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 420 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 70px 70px 80px",
              padding: "10px 18px",
              background: "rgba(30,41,59,0.6)",
              fontSize: 11,
              color: gray1,
              fontWeight: 600,
            }}
          >
            <span>专业</span>
            <span style={{ textAlign: "center" }}>人数</span>
            <span style={{ textAlign: "center" }}>已测评</span>
            <span style={{ textAlign: "center" }}>参与率</span>
          </div>
          {rows.map(function (row) {
            return (
              <div
                key={row.major}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 70px 70px 80px",
                  padding: "12px 18px",
                  borderTop: "1px solid rgba(51,65,85,0.3)",
                  fontSize: 12,
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600 }}>{row.major}</span>
                <span style={{ textAlign: "center", color: gray3 }}>{row.students}</span>
                <span style={{ textAlign: "center", color: green }}>{row.assessed}</span>
                <span style={{ textAlign: "center", color: yellow, fontWeight: 600 }}>{row.participation}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
