// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 案例图片轮播：支持自动播放、左右切换与加载失败降级。
import { useCallback, useEffect, useRef, useState } from "react";
import { cyan, gray2 } from "../../constants.js";

export default function ImageCarousel({ images, title }) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState({});
  const [errored, setErrored] = useState({});
  const timerRef = useRef(null);

  const startAuto = useCallback(
    function () {
      if (images.length <= 1) return;
      timerRef.current = setInterval(function () {
        setCurrent(function (previous) {
          return (previous + 1) % images.length;
        });
      }, 4000);
    },
    [images.length]
  );

  useEffect(
    function () {
      startAuto();
      return function () {
        clearInterval(timerRef.current);
      };
    },
    [startAuto]
  );

  function goTo(index) {
    clearInterval(timerRef.current);
    setCurrent(index);
    startAuto();
  }

  function prev() {
    clearInterval(timerRef.current);
    setCurrent(function (previous) {
      return (previous - 1 + images.length) % images.length;
    });
    startAuto();
  }

  function next() {
    clearInterval(timerRef.current);
    setCurrent(function (previous) {
      return (previous + 1) % images.length;
    });
    startAuto();
  }

  const validImages = images.filter(function (_, index) {
    return !errored[index];
  });
  if (!images || images.length === 0 || (Object.keys(errored).length > 0 && validImages.length === 0)) return null;

  const imageSource = images[current];
  const isError = errored[current];
  const isLoading = !loaded[current] && !errored[current];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        borderRadius: "8px 8px 0 0",
        overflow: "hidden",
        background: "#0a0f1a",
        aspectRatio: "16/9",
        maxHeight: 280,
        cursor: images.length > 1 ? "grab" : "default",
      }}
    >
      {!isError && (
        <img
          key={imageSource}
          src={imageSource}
          alt={title}
          onLoad={function () {
            setLoaded(function (previous) {
              return { ...previous, [current]: true };
            });
          }}
          onError={function () {
            setErrored(function (previous) {
              return { ...previous, [current]: true };
            });
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "opacity 0.4s",
            opacity: isLoading ? 0 : 1,
          }}
        />
      )}
      {isLoading && (
        <div
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div style={{ fontSize: 11, color: gray2, animation: "pulse 1s infinite" }}>图片加载中…</div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "linear-gradient(transparent, rgba(10,15,26,0.8))",
          pointerEvents: "none",
        }}
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="上一张"
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.45)",
              border: "none",
              color: "#fff",
              width: 32,
              height: 32,
              borderRadius: "50%",
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="下一张"
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.45)",
              border: "none",
              color: "#fff",
              width: 32,
              height: 32,
              borderRadius: "50%",
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            ›
          </button>
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 6,
              zIndex: 2,
            }}
          >
            {images.map(function (_, index) {
              return (
                <button
                  key={index}
                  onClick={function () {
                    goTo(index);
                  }}
                  aria-label={"第 " + (index + 1) + " 张"}
                  style={{
                    width: index === current ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: index === current ? cyan : "rgba(255,255,255,0.4)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.3s",
                  }}
                />
              );
            })}
          </div>
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 12,
              fontSize: 10,
              color: "rgba(255,255,255,0.7)",
              background: "rgba(0,0,0,0.45)",
              padding: "2px 8px",
              borderRadius: 999,
              zIndex: 2,
            }}
          >
            {current + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
