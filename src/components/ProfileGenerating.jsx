// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 测评提交后的过渡动画：等待画像计算与 AI 寄语返回，再进入结果页。
import { useState, useEffect, useRef } from "react";
import { dark0, cyan, text1 } from "../constants.js";
import XiaoBei from "./XiaoBei.jsx";

// ============================================================
// ProfileGenerating - 画像生成过渡动画
// ============================================================
export default function ProfileGenerating({ onDone }) {
  const [step, setStep] = useState(0);
  const steps = ["采集维度数据…", "计算画像模式匹配…", "生成个性化推荐…", "画像已生成 ✓"];
  const onDoneRef = useRef(onDone);

  useEffect(
    function () {
      onDoneRef.current = onDone;
    },
    [onDone]
  );

  useEffect(function () {
    const timers = [
      setTimeout(function () {
        setStep(1);
      }, 400),
      setTimeout(function () {
        setStep(2);
      }, 900),
      setTimeout(function () {
        setStep(3);
      }, 1400),
      setTimeout(function () {
        onDoneRef.current();
      }, 2000),
    ];
    return function () {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      style={{
        background: dark0,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
      }}
    >
      <XiaoBei size={88} speaking={step < 3} />
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: text1,
            marginBottom: 8,
            animation: "profileGen 0.4s ease both",
          }}
        >
          正在生成你的兵工思政画像
        </div>
        <div style={{ fontSize: 13, color: cyan, animation: "pulse 1s ease-in-out infinite" }}>{steps[step]}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: i <= step ? cyan : "rgba(100,116,139,0.3)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
