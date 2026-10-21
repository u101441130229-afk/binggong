// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 淡入容器：keyProp 变化时重新播放一次轻微上浮的入场动画。
import { useEffect, useState } from "react";

function FadeInInner({ children }) {
  const [visible, setVisible] = useState(false);

  useEffect(function () {
    const timer = setTimeout(function () {
      setVisible(true);
    }, 20);
    return function () {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.28s ease, transform 0.28s ease",
      }}
    >
      {children}
    </div>
  );
}

export function FadeIn({ children, keyProp }) {
  return <FadeInInner key={keyProp}>{children}</FadeInInner>;
}
