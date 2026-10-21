// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 星空登录页：仅使用学号/账号与密码登录，角色由数据库资料决定。
import { useEffect, useRef, useState } from "react";
import { APP_NAME, APP_SHORT_NAME, APP_SUBTITLE, APP_VERSION } from "../appInfo.js";
import { blue, cyan, dark0, dark1, dark2, gray1, gray2, gray3, red, text1, text2 } from "../constants.js";
import XiaoBei from "../components/XiaoBei.jsx";

const ERROR_MESSAGES = {
  credentials: "账号或密码错误",
  forbidden: "账号不可用，请联系管理员",
  unavailable: "登录服务暂时不可用，请稍后重试",
};

function StarField() {
  const canvasRef = useRef(null);

  useEffect(function () {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    let frame = 0;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 120 }, function () {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.3 + 0.05,
        opacity: Math.random() * 0.6 + 0.2,
        pulse: Math.random() * Math.PI * 2,
      };
    });

    function draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(function (star) {
        star.pulse += 0.012;
        const alpha = star.opacity * (0.7 + 0.3 * Math.sin(star.pulse));
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(148,163,184,${alpha})`;
        context.fill();
        if (star.radius > 1.5) {
          context.beginPath();
          context.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2);
          context.fillStyle = `rgba(6,182,212,${alpha * 0.15})`;
          context.fill();
        }
        star.y -= star.speed;
        if (star.y < -2) {
          star.y = canvas.height + 2;
          star.x = Math.random() * canvas.width;
        }
      });
      frame = requestAnimationFrame(draw);
    }
    draw();
    return function () {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

function InfoModal({ onClose }) {
  const items = [
    {
      title: "解决什么问题",
      desc: "传统思政教育难以照顾每位学生的认知差异。系统通过八维画像、兵工案例与每日问题，为不同学生提供更有针对性的学习入口。",
    },
    {
      title: "系统能力",
      desc: "思政画像测评、兵工案例学习、每日一问、小备 AI 问答与拍照识别。学习记录与测评结果保存在 Supabase 数据库，AI 请求统一由服务端代理。",
    },
    {
      title: "三种角色",
      desc: "学生完成测评与案例学习；教师查看本组学情与教学建议；管理员在学生数据基础上查看学院汇总视图并导出名单。",
    },
    {
      title: "参赛信息",
      desc: "第十届全国高校易班技术创新大会 · 智能体 AIGC 应用赛道。沈阳理工大学装备工程学院参赛作品。",
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          background: dark1,
          borderRadius: 20,
          border: "1px solid rgba(6,182,212,0.3)",
          overflow: "hidden",
          animation: "profileGen 0.4s ease both",
        }}
        onClick={function (event) {
          event.stopPropagation();
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(51,65,85,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <img src="/favicon.png" alt="" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: text1 }}>{APP_SHORT_NAME}</div>
            <div style={{ fontSize: 10, color: gray2 }}>{APP_SUBTITLE}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: gray2, fontSize: 18, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "18px 20px" }}>
          {items.map(function (item, index) {
            return (
              <div
                key={item.title}
                style={{
                  marginBottom: index < items.length - 1 ? 16 : 0,
                  paddingBottom: index < items.length - 1 ? 16 : 0,
                  borderBottom: index < items.length - 1 ? "1px solid rgba(51,65,85,0.3)" : "none",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: cyan, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: text2, lineHeight: 1.75 }}>{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage({ onLogin }) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (!account.trim() || !password) {
      setError("请输入账号和密码");
      return;
    }
    setLoading(true);
    try {
      await onLogin(account, password);
    } catch (loginError) {
      setError(ERROR_MESSAGES[loginError?.kind] || ERROR_MESSAGES.credentials);
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    background: "rgba(15,23,42,0.85)",
    border: "1px solid rgba(71,85,105,0.6)",
    color: text1,
    fontSize: 16,
    lineHeight: 1.4,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div
      style={{
        background: dark0,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 16px)",
      }}
    >
      <StarField />

      <button
        onClick={function () {
          setShowInfo(true);
        }}
        aria-label="系统介绍"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 2,
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "rgba(51,65,85,0.5)",
          border: "1px solid rgba(100,116,139,0.4)",
          color: gray3,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ?
      </button>

      {showInfo && (
        <InfoModal
          onClose={function () {
            setShowInfo(false);
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ marginBottom: 24, textAlign: "center", animation: "fadeSlideUp 0.5s ease both" }}>
          <img
            src="/favicon.png"
            alt=""
            style={{
              width: 62,
              height: 62,
              borderRadius: 16,
              objectFit: "cover",
              margin: "0 auto 14px",
              display: "block",
              boxShadow: "0 8px 32px rgba(6,182,212,0.18)",
            }}
          />
          <div style={{ fontSize: 21, fontWeight: 800, color: text1, letterSpacing: 1.5, lineHeight: 1.5 }}>
            {APP_NAME}
          </div>
          <div style={{ fontSize: 12, color: gray2, marginTop: 6 }}>{APP_SUBTITLE}</div>
          <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>{APP_VERSION}</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            marginBottom: 20,
            animation: "fadeSlideUp 0.5s 0.12s ease both",
          }}
        >
          <XiaoBei size={76} speaking={false} />
          <div style={{ fontSize: 12, color: gray1, fontStyle: "italic" }}>嗨，我是小备，欢迎回来</div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            background: dark2,
            border: "1px solid rgba(51,65,85,0.6)",
            borderRadius: 18,
            padding: "22px 20px",
            boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
            animation: "fadeSlideUp 0.5s 0.2s ease both",
          }}
        >
          <div style={{ fontSize: 12, color: gray3, fontWeight: 600, marginBottom: 8 }}>学号 / 账号</div>
          <input
            value={account}
            onChange={function (event) {
              setAccount(event.target.value);
            }}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="请输入学号或账号"
            style={inputStyle}
          />

          <div style={{ fontSize: 12, color: gray3, fontWeight: 600, margin: "16px 0 8px" }}>密码</div>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={function (event) {
                setPassword(event.target.value);
              }}
              autoComplete="current-password"
              placeholder="请输入密码"
              style={{ ...inputStyle, paddingRight: 64 }}
            />
            <button
              type="button"
              onClick={function () {
                setShowPassword(!showPassword);
              }}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                padding: "6px 8px",
                background: "transparent",
                border: "none",
                color: gray3,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {showPassword ? "隐藏" : "显示"}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 14,
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: red,
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 20,
              padding: "13px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              background: loading ? "rgba(51,65,85,0.5)" : "linear-gradient(135deg,#3b82f6,#06b6d4)",
              border: "none",
              color: loading ? gray2 : "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 8px 24px rgba(6,182,212,0.22)",
            }}
          >
            {loading ? "登录中…" : "登录系统"}
          </button>

          <div style={{ marginTop: 14, fontSize: 11, color: gray1, lineHeight: 1.7, textAlign: "center" }}>
            学生初始密码为本人学号，登录后即可开始测评
          </div>
        </form>

        <div
          style={{
            marginTop: 22,
            fontSize: 10,
            color: "#2d3748",
            textAlign: "center",
            lineHeight: 1.8,
            animation: "fadeIn 0.4s 0.5s ease both",
          }}
        >
          形象设计：沈阳理工大学装备工程学院官方吉祥物“小备”
          <br />
          {APP_SHORT_NAME} {APP_VERSION} · <span style={{ color: blue }}>©</span> 沈阳理工大学装备工程学院
        </div>
      </div>
    </div>
  );
}
