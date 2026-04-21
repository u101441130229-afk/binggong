// TODO: DeepSeek接入点
import { useState } from "react";
import {
  green, yellow, red,
  dark1, gray2, text2,
  DIMS, dimMeta, DIM_EXP
} from "../constants.js";

// ====================== 雷达图组件 ======================
export default function RadarChart({ lvls, size }) {
  const s = size || 260;
  const VB = s * 1.3;
  const cx = VB / 2, cy = VB / 2;
  const r = s * 0.38;
  const dims = DIMS;
  const n = dims.length;
  const angleStep = (Math.PI * 2) / n;
  const [activeDim, setActiveDim] = useState(null);

  const vals = dims.map(d => ({ L: 0.25, M: 0.58, H: 0.92 }[lvls[d]] || 0.5));
  function pt(i, ratio) {
    const a = -Math.PI / 2 + i * angleStep;
    return { x: cx + r * ratio * Math.cos(a), y: cy + r * ratio * Math.sin(a) };
  }
  const grids = [0.33, 0.67, 1].map(ratio =>
    dims.map((_, i) => pt(i, ratio)).map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    ).join(' ') + ' Z'
  );
  const axes = dims.map((_, i) => {
    const p = pt(i, 1);
    return `M ${cx} ${cy} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  });
  const dataPath = vals.map((v, i) => {
    const p = pt(i, v);
    return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(' ') + ' Z';
  const labelOffset = 1.22;

  return (
    <div style={{ position: "relative" }}>
      <svg width={s} height={s} viewBox={`0 0 ${VB} ${VB}`} style={{ animation: "radarGrow 0.9s cubic-bezier(0.34,1.2,0.64,1) both", display: "block", margin: "0 auto" }}>
        {grids.map((d, i) => <path key={i} d={d} fill="none" stroke="rgba(100,116,139,0.25)" strokeWidth="1" />)}
        {axes.map((d, i) => <path key={i} d={d} stroke="rgba(100,116,139,0.2)" strokeWidth="1" />)}
        <path d={dataPath} fill="rgba(6,182,212,0.18)" stroke="#06b6d4" strokeWidth="2" strokeLinejoin="round"
          style={{ animation: "radarBreathe 4s ease-in-out infinite", transformOrigin: `${cx}px ${cy}px` }} />
        {vals.map((v, i) => {
          const p = pt(i, v);
          const c = v >= 0.85 ? "#22c55e" : v >= 0.5 ? "#eab308" : "#ef4444";
          return <circle key={i} cx={p.x} cy={p.y} r="4" fill={c} stroke="#0a0f1a" strokeWidth="1.5" />;
        })}
        {dims.map((d, i) => {
          const p = pt(i, labelOffset);
          const isLeft = p.x < cx - 4;
          const isRight = p.x > cx + 4;
          const anchor = isLeft ? "end" : isRight ? "start" : "middle";
          const lvlColor = lvls[d] === "H" ? "#22c55e" : lvls[d] === "M" ? "#eab308" : "#ef4444";
          const isActive = activeDim === d;
          return (
            <g key={d} style={{ cursor: "pointer" }} onClick={function () { setActiveDim(isActive ? null : d); }}>
              <circle cx={p.x} cy={p.y - 2} r="14" fill={isActive ? lvlColor + "22" : "transparent"} />
              <text x={p.x} y={p.y - 4} textAnchor={anchor} fontSize="10" fontWeight="700" fill={lvlColor}>{d}</text>
              <text x={p.x} y={p.y + 9} textAnchor={anchor} fontSize="9" fill={isActive ? "#e2e8f0" : "#94a3b8"}>{dimMeta[d].name}</text>
            </g>
          );
        })}
      </svg>
      {activeDim && (function () {
        const lvl = lvls[activeDim];
        const lvlColor = lvl === "H" ? green : lvl === "M" ? yellow : red;
        const lvlText = lvl === "H" ? "较高" : lvl === "M" ? "中等" : "偏低";
        return (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 10, width: Math.min(s * 0.75, 200), background: dark1, border: "1px solid " + lvlColor + "55", borderRadius: 12, padding: "14px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", animation: "fadeIn 0.2s ease both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: lvlColor }}>{activeDim} · {dimMeta[activeDim].name}</div>
              <button onClick={function (e) { e.stopPropagation(); setActiveDim(null); }} style={{ background: "transparent", border: "none", color: gray2, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>✕</button>
            </div>
            <div style={{ fontSize: 11, color: lvlColor, fontWeight: 600, marginBottom: 6, padding: "3px 8px", background: lvlColor + "18", borderRadius: 999, display: "inline-block" }}>当前水平：{lvlText}</div>
            <div style={{ fontSize: 12, color: text2, lineHeight: 1.7, marginTop: 6 }}>{DIM_EXP[activeDim][lvl]}</div>
          </div>
        );
      })()}
    </div>
  );
}
