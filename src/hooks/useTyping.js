// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 打字机效果 Hook：按固定速度逐字展示文本，内容切换时重建计时器。
import { useEffect, useState } from "react";

export default function useTyping(text, speed, trigger) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(
    function () {
      let index = 0;
      let typeTimer = null;
      const resetTimer = setTimeout(function () {
        setDisplayed("");
        setDone(false);
      }, 0);
      if (trigger) {
        typeTimer = setInterval(function () {
          index += 1;
          setDisplayed(text.slice(0, index));
          if (index >= text.length) {
            clearInterval(typeTimer);
            setDone(true);
          }
        }, speed || 12);
      }
      return function () {
        clearTimeout(resetTimer);
        clearInterval(typeTimer);
      };
    },
    [trigger, text, speed]
  );

  return [displayed, done];
}
