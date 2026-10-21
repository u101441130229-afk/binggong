// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 画像配图：按画像类型加载对应装备图片，加载失败时静默隐藏。
import { useState } from "react";

export default function ProfileWeaponImage({ src, color, typeName }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (errored) return null;

  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden", maxHeight: 260, background: "#050a14" }}>
      <img
        src={src}
        alt={typeName + " 画像配图"}
        onLoad={function () {
          setLoaded(true);
        }}
        onError={function () {
          setErrored(true);
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          maxHeight: 260,
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      />
      {!loaded && !errored && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 120,
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(100,116,139,0.6)", animation: "pulse 1s infinite" }}>
            加载画像图…
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 90,
          background: "linear-gradient(transparent, #1e293b)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: "linear-gradient(to bottom," + color + "00," + color + "cc," + color + "00)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: "linear-gradient(to bottom," + color + "00," + color + "cc," + color + "00)",
        }}
      />
      {loaded && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 14,
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.55)",
            border: "1px solid " + color + "66",
            fontSize: 10,
            color: color,
            fontWeight: 700,
            backdropFilter: "blur(4px)",
          }}
        >
          ✦ {typeName}
        </div>
      )}
    </div>
  );
}
