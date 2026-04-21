// TODO: DeepSeek接入点
import { useState, useEffect } from "react";

// ====================== 打字机 Hook ======================
export function useTyping(text, speed, trigger) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!trigger) { setDisplayed(""); setDone(false); return; }
    setDisplayed(""); setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed || 12);
    return () => clearInterval(id);
  }, [trigger, text]);
  return [displayed, done];
}

// ====================== FadeIn 动画容器 ======================
export function FadeIn({ children, keyProp }) {
  const [visible, setVisible] = useState(false);
  useEffect(function () {
    setVisible(false);
    const t = setTimeout(function () { setVisible(true); }, 20);
    return function () { clearTimeout(t); };
  }, [keyProp]);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)", transition: "opacity 0.28s ease, transform 0.28s ease" }}>
      {children}
    </div>
  );
}
