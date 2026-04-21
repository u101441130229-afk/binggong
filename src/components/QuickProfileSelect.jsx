// TODO: DeepSeek接入点
import { useState } from "react";
import {
  blue, cyan, purple,
  dark0, dark1, dark2,
  gray1, gray3, text1, text2
} from "../constants.js";
import XiaoBei from "./XiaoBei.jsx";

// ============================================================
// QuickProfileSelect - 快速画像选择（跳过测评版）
// ============================================================
export default function QuickProfileSelect({ onSelect, onBack }) {
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);

  const options = [
    { icon: "🧭", title: "我对方向很清晰", desc: "我对国防/军工方向有明确意向，想直接深入学习兵工案例", color: blue, type: "稳进发展型" },
    { icon: "🔍", title: "我还在探索中",   desc: "我有一些想法但方向不够清晰，希望从案例里找到参照",     color: cyan,   type: "方向探索型" },
    { icon: "🤝", title: "我希望被系统引导", desc: "我刚开始了解这个领域，希望获得系统化的引导和支持",    color: purple, type: "重点引导型" },
  ];

  return (
    <div style={{ background: dark0, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg," + dark1 + "," + dark1 + ")", borderBottom: "1px solid rgba(59,130,246,0.2)", padding: "16px 24px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: text1, letterSpacing: 1 }}>快速画像</div>
        <div style={{ fontSize: 11, color: gray1, marginTop: 2 }}>选择最接近你现在状态的描述 · 10秒完成</div>
      </div>

      <div style={{ flex: 1, maxWidth: 780, margin: "0 auto", padding: "32px 16px", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, animation: "fadeSlideUp 0.4s ease both" }}>
          <XiaoBei size={48} speaking={false} />
          <div style={{ fontSize: 13.5, color: text2, lineHeight: 1.75 }}>
            没关系，不用做完整测评也能开始。选一个最接近你现在状态的描述，小备会为你匹配一个起点画像。
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {options.map(function (opt, i) {
            const isHover = hover === i;
            const isSelected = selected === i;
            return (
              <div key={i}
                onClick={function () {
                  if (selected !== null) return;
                  setSelected(i);
                  setTimeout(function () { onSelect(i); }, 350);
                }}
                onMouseEnter={function () { setHover(i); }}
                onMouseLeave={function () { setHover(null); }}
                style={{
                  padding: "20px 22px", borderRadius: 16, cursor: selected !== null ? "default" : "pointer",
                  background: isSelected ? opt.color + "18" : isHover ? "rgba(59,130,246,0.06)" : dark2,
                  border: "2px solid " + (isSelected ? opt.color : isHover ? opt.color : "rgba(51,65,85,0.4)"),
                  transition: "all 0.22s",
                  transform: isSelected ? "scale(1.02)" : isHover ? "translateY(-2px)" : "none",
                  display: "flex", alignItems: "center", gap: 16,
                  animation: `fadeSlideUp 0.4s ${0.1 + i * 0.1}s ease both`,
                  opacity: 0
                }}>
                <div style={{ fontSize: 32, flexShrink: 0 }}>{isSelected ? "✓" : opt.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isSelected ? opt.color : isHover ? opt.color : text1, marginBottom: 6 }}>{opt.title}</div>
                  <div style={{ fontSize: 13, color: gray3, lineHeight: 1.65 }}>{opt.desc}</div>
                </div>
                <div style={{ fontSize: 10, color: opt.color, padding: "4px 10px", background: opt.color + "18", border: "1px solid " + opt.color + "33", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 }}>
                  {isSelected ? "已选择 ✓" : opt.type}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={onBack} style={{ marginTop: 24, padding: "10px 20px", borderRadius: 10, background: "transparent", border: "1px solid rgba(100,116,139,0.3)", color: gray3, cursor: "pointer", fontSize: 13 }}>← 返回完整测评</button>
      </div>
    </div>
  );
}
