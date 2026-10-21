// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 画像分享卡片：本地生成雷达图与金句，登录后可额外获取一条 AI 寄语。
import { useEffect, useState } from "react";
import { DIMS, PROFILE_IMAGES, cyan, dimMeta, gray2, gray3, green, red, text1, yellow } from "../constants.js";
import { requestAi } from "../api/ai.js";
import useTyping from "../hooks/useTyping.js";

const FALLBACK_QUOTES = {
  SOLID: "稳健不是保守，是每一步都站得住的从容。",
  PERSIST: "坚持本身就是一种答案，但别忘了让它被看见。",
  VALUE: "愿意提问的人，已经走在了思考的路上。",
  COLLAB: "系统胜利，是每一个螺丝钉都转到了对的位置。",
  EXPLORE: "方向还在形成，这不是迷失，是真实的出发。",
  RESOURCE: "潜力不会消失，只是在等一个连接的时机。",
  GROW: "成长不是跳跃，是每一步都比昨天扎实一点。",
  GUIDE: "主动寻求引导，本身就是一种清醒的勇气。",
};

export default function ProfileShareCard({ profile, onClose }) {
  const type = profile.final;
  const [aiQuote, setAiQuote] = useState(null);
  const today = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
  const displayQuote = aiQuote || FALLBACK_QUOTES[type.code] || "兵工铸魂，每一步都算数。";
  const [typedQuote, quoteDone] = useTyping(displayQuote, 30, true);

  useEffect(
    function () {
      let mounted = true;
      const highDims = DIMS.filter(function (dim) {
        return profile.lvls[dim] === "H";
      }).map(function (dim) {
        return dimMeta[dim].name;
      });
      const lowDims = DIMS.filter(function (dim) {
        return profile.lvls[dim] === "L";
      }).map(function (dim) {
        return dimMeta[dim].name;
      });
      const prompt = `你是兵工思政画像系统。根据以下学生数据，生成一句个性化励志金句（20字以内，不加引号，不加解释，只输出金句本身）：\n画像类型：${type.cn}\n优势维度：${highDims.join("、") || "均衡"}\n待提升：${lowDims.join("、") || "无明显短板"}\n风格：简洁有力，结合兵工或国防精神，有画面感`;
      requestAi("/api/deepseek", { messages: [{ role: "user", content: prompt }], max_tokens: 60 })
        .then(function (data) {
          if (!mounted) return;
          const quote = data.choices?.[0]?.message?.content?.trim().replace(/["“”]/g, "");
          if (quote && quote.length <= 30) setAiQuote(quote);
        })
        .catch(function () {
          // 获取失败时保留本地金句，不打断分享卡片的展示。
        });
      return function () {
        mounted = false;
      };
    },
    [profile, type.cn]
  );

  const angleStep = (Math.PI * 2) / DIMS.length;
  const centerX = 110;
  const centerY = 110;
  const radius = 64;
  const values = DIMS.map(function (dim) {
    return { L: 0.25, M: 0.58, H: 0.92 }[profile.lvls[dim]] || 0.5;
  });

  function point(index, ratio) {
    const angle = -Math.PI / 2 + index * angleStep;
    return { x: centerX + radius * ratio * Math.cos(angle), y: centerY + radius * ratio * Math.sin(angle) };
  }

  const grids = [0.33, 0.67, 1].map(function (ratio) {
    return (
      DIMS.map(function (_, index) {
        return point(index, ratio);
      })
        .map(function (item, index) {
          return `${index === 0 ? "M" : "L"} ${item.x.toFixed(1)} ${item.y.toFixed(1)}`;
        })
        .join(" ") + " Z"
    );
  });
  const dataPath =
    values
      .map(function (value, index) {
        const item = point(index, value);
        return `${index === 0 ? "M" : "L"} ${item.x.toFixed(1)} ${item.y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ fontSize: 18 }}>📸</div>
        <div style={{ fontSize: 12, color: gray3 }}>截图或长按保存你的专属画像卡片</div>
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: 340,
          background: "linear-gradient(145deg,#0f172a,#1e293b)",
          borderRadius: 24,
          overflow: "hidden",
          border: "1px solid " + type.color + "55",
          boxShadow: "0 0 40px " + type.color + "33, 0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ height: 4, background: "linear-gradient(90deg," + type.color + "," + cyan + ")" }} />
        {PROFILE_IMAGES && PROFILE_IMAGES[type.code] && (
          <div style={{ position: "relative", width: "100%", height: 130, overflow: "hidden", background: "#050a14" }}>
            <img
              src={PROFILE_IMAGES[type.code]}
              alt={type.cn}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center center",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 70,
                background: "linear-gradient(transparent,#0f172a)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 2,
                background: "linear-gradient(to bottom," + type.color + "00," + type.color + "99," + type.color + "00)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 2,
                background: "linear-gradient(to bottom," + type.color + "00," + type.color + "99," + type.color + "00)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 10,
                padding: "3px 8px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.55)",
                border: "1px solid " + type.color + "66",
                fontSize: 9,
                color: type.color,
                fontWeight: 700,
              }}
            >
              ✦ {type.cn}
            </div>
          </div>
        )}
        <div style={{ padding: "16px 22px 14px", borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: type.color + "22",
                border: "1px solid " + type.color + "55",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: type.color, letterSpacing: 1 }}>兵</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: gray2, letterSpacing: 1 }}>兵工铸魂 · 思政成长画像</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: text1, marginTop: 2 }}>{type.cn}</div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                fontSize: 10,
                color: type.color,
                padding: "4px 10px",
                background: type.color + "18",
                border: "1px solid " + type.color + "33",
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              {type.code}
            </div>
          </div>
          <div
            style={{
              marginTop: 14,
              minHeight: 40,
              padding: "10px 12px",
              background: "rgba(0,0,0,0.3)",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: 12, color: type.color, fontStyle: "italic", lineHeight: 1.7 }}>
              “{typedQuote}
              {!quoteDone && <span style={{ animation: "pulse 0.6s infinite" }}>▍</span>}”
              {quoteDone && aiQuote && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 9,
                    color: green,
                    padding: "1px 5px",
                    background: "rgba(34,197,94,0.1)",
                    borderRadius: 999,
                    fontStyle: "normal",
                  }}
                >
                  AI 寄语
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 22px", display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="180" height="180" viewBox="0 0 220 220" style={{ flexShrink: 0 }}>
            {grids.map(function (path, index) {
              return <path key={index} d={path} fill="none" stroke="rgba(100,116,139,0.2)" strokeWidth="1" />;
            })}
            {DIMS.map(function (_, index) {
              const item = point(index, 1);
              return (
                <line
                  key={index}
                  x1={centerX}
                  y1={centerY}
                  x2={item.x.toFixed(1)}
                  y2={item.y.toFixed(1)}
                  stroke="rgba(100,116,139,0.15)"
                  strokeWidth="1"
                />
              );
            })}
            <path d={dataPath} fill={type.color + "28"} stroke={type.color} strokeWidth="2" strokeLinejoin="round" />
            {values.map(function (value, index) {
              const item = point(index, value);
              const color = value >= 0.85 ? green : value >= 0.5 ? yellow : red;
              return (
                <circle key={index} cx={item.x} cy={item.y} r="3.5" fill={color} stroke="#0f172a" strokeWidth="1.5" />
              );
            })}
            {DIMS.map(function (dim, index) {
              const item = point(index, 1.28);
              const anchor = item.x < centerX - 4 ? "end" : item.x > centerX + 4 ? "start" : "middle";
              const levelColor = profile.lvls[dim] === "H" ? green : profile.lvls[dim] === "M" ? yellow : red;
              return (
                <g key={dim}>
                  <text x={item.x} y={item.y - 3} textAnchor={anchor} fontSize="8" fontWeight="700" fill={levelColor}>
                    {dim}
                  </text>
                  <text x={item.x} y={item.y + 8} textAnchor={anchor} fontSize="7" fill="#64748b">
                    {dimMeta[dim].name}
                  </text>
                </g>
              );
            })}
          </svg>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
            {DIMS.map(function (dim) {
              const level = profile.lvls[dim];
              const levelColor = level === "H" ? green : level === "M" ? yellow : red;
              const levelText = level === "H" ? "高" : level === "M" ? "中" : "低";
              return (
                <div key={dim} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 3, height: 3, borderRadius: "50%", background: levelColor, flexShrink: 0 }} />
                  <div style={{ fontSize: 9, color: gray3, flex: 1, whiteSpace: "nowrap" }}>{dimMeta[dim].name}</div>
                  <div style={{ fontSize: 9, color: levelColor, fontWeight: 700 }}>{levelText}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div
          style={{
            padding: "12px 22px 18px",
            borderTop: "1px solid rgba(51,65,85,0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 9, color: "#334155" }}>沈阳理工大学 · 装备工程学院</div>
          <div style={{ fontSize: 9, color: "#334155" }}>{today}</div>
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          marginTop: 20,
          padding: "10px 32px",
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 600,
          background: "rgba(51,65,85,0.5)",
          border: "1px solid rgba(100,116,139,0.3)",
          color: gray3,
          cursor: "pointer",
        }}
      >
        关闭
      </button>
    </div>
  );
}
