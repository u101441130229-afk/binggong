// TODO: DeepSeek接入点
import { useEffect } from "react";
import { XIAOBEI_IMG, XIAOBEI_STYLE } from "../constants.js";

// ====================== 小备组件 (真实图片版) ======================
export default function XiaoBei({ size, speaking }) {
  const s = size || 60;
  const h = Math.round(s * 1.167);

  useEffect(function () {
    if (typeof document === "undefined") return;
    const id = "xiaobei-keyframes";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = XIAOBEI_STYLE;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <img
      src={XIAOBEI_IMG}
      width={s}
      height={h}
      alt="小备 - 沈阳理工大学装备工程学院官方吉祥物"
      style={{
        display: "block",
        flexShrink: 0,
        animation: speaking
          ? "xb-speak 2s ease-in-out infinite"
          : "xb-breathe 3s ease-in-out infinite",
        transformOrigin: "bottom center",
        userSelect: "none"
      }}
    />
  );
}
