// TODO: DeepSeek接入点
import { useState, useEffect, useRef } from "react";
import {
  blue, purple, yellow, cyan, green, red,
  dark0, dark1, dark2, dark3,
  gray1, gray2, gray3, text1, text2,
  DIMS, CASES, CASE_ORDER, RECOMMEND_MAP,
  CHAT_SCRIPTS, dimMeta, DIM_EXP,
  COZE_BOT_ID, COZE_API, PROFILE_IMAGES
} from "../constants.js";
import XiaoBei from "./XiaoBei.jsx";
import RadarChart from "./RadarChart.jsx";
import { useTyping } from "../utils.jsx";

// ====================== GUIDE预约按钮组件 ======================
function GuideAppointment({ reason }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <div>
      <div style={{ fontSize: 14, color: text2, lineHeight: 1.75, marginBottom: 14 }}>{reason}</div>
      <button
        onClick={function () { setShowModal(true); }}
        style={{
          width: "100%", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700,
          background: "linear-gradient(135deg,#ef4444,#dc2626)",
          border: "none", color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
        <span>📅</span> 预约辅导员一对一沟通 →
      </button>
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }} onClick={function () { setShowModal(false); }}>
          <div style={{
            background: dark2, borderRadius: 20, padding: "28px 24px", maxWidth: 340, width: "100%",
            border: "1px solid rgba(239,68,68,0.3)", textAlign: "center"
          }} onClick={function (e) { e.stopPropagation(); }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: text1, marginBottom: 8 }}>预约功能开发中</div>
            <div style={{ fontSize: 13, color: text2, lineHeight: 1.8, marginBottom: 20 }}>
              在线预约系统正在与学院辅导员管理平台对接中。<br />
              你可以通过以下方式直接联系辅导员：<br />
              <span style={{ color: cyan, fontWeight: 600 }}>装备工程学院学生工作办公室</span>
            </div>
            <button onClick={function () { setShowModal(false); }} style={{
              width: "100%", padding: "11px", borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              color: red, cursor: "pointer"
            }}>我知道了</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CozeChat - 真实Coze Bot对话界面
// ============================================================
function CozeChat({ profile, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState(null);
  const scrollRef = useRef(null);

  const hour = new Date().getHours();
  const greeting = hour < 6 ? "还在熬夜呢" : hour < 12 ? "早上好" : hour < 18 ? "下午好" : hour < 22 ? "晚上好" : "还没休息呀";

  const openerMap = {
    SOLID:    `${greeting}！我看到你的画像——稳进发展型，方向感很强。你想从哪个兵工案例开始聊？`,
    PERSIST:  `${greeting}！你的画像是高压坚持型，一直在用力。今天想聊点什么？`,
    VALUE:    `${greeting}！思辨型的你一定有很多问题想问。来，说说你最近在思考什么？`,
    COLLAB:   `${greeting}！集体凝聚型——你天然理解系统胜利。今天想深入哪个案例？`,
    EXPLORE:  `${greeting}！方向还在形成中，这很正常。有什么想聊的？我们一起梳理。`,
    RESOURCE: `${greeting}！我来帮你把学校的资源和兵工案例连起来。你想从哪里开始？`,
    GROW:     `${greeting}！你在成长进行时——每一步都算数。今天想聊哪个兵工故事？`,
    GUIDE:    `${greeting}！你希望获得系统化引导，这非常好。我们先从你最困惑的地方开始。`,
  };
  const opener = openerMap[profile.final.code] || `${greeting}！我是小备，你的兵工思政学习伙伴。有什么想聊的？`;

  useEffect(function () {
    setMessages([{ role: "assistant", text: opener, id: Date.now() }]);
  }, []);

  useEffect(function () {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", text: text.trim(), id: Date.now() };
    setMessages(function (prev) { return [...prev, userMsg]; });
    setInput("");
    setLoading(true);
    try {
      // ======= DeepSeek接入点 =======
      const systemPrompt = `你是"小备"，沈阳理工大学装备工程学院的AI思政学习伙伴，专注于兵工文化、国防精神和思政教育。
当前学生画像类型：${profile.final.cn}（${profile.final.code}）。
请用温暖、引导式的语气回应，结合兵工精神、国防案例进行思政引导。回复控制在150字以内。`;

      const historyMessages = messages.slice(-6).map(function(m) {
        return { role: m.role === "assistant" ? "assistant" : "user", content: m.text };
      });

      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk-881c1a3f71794c418186d46bd6628167"
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            ...historyMessages,
            { role: "user", content: text.trim() }
          ],
          max_tokens: 300,
          temperature: 0.8
        })
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "小备思考中，请稍候再试～";
      setMessages(function (prev) {
        return [...prev, { role: "assistant", text: reply, id: Date.now() }];
      });
    } catch (e) {
      setMessages(function (prev) {
        return [...prev, { role: "assistant", text: "网络波动，小备暂时离线了。请稍后再试，或直接去看推荐案例～", id: Date.now() }];
      });
    }
    setLoading(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
      <div style={{ width: "100%", maxWidth: 560, background: dark1, borderRadius: "20px 20px 0 0", border: "1px solid rgba(6,182,212,0.3)", display: "flex", flexDirection: "column", maxHeight: "88vh" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(51,65,85,0.4)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <XiaoBei size={36} speaking={loading} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: text1 }}>小备 · 兵工思政智能体</div>
            <div style={{ fontSize: 11, color: loading ? yellow : green }}>{loading ? "小备思考中…" : "● 已连接 · DeepSeek驱动"}</div>
          </div>
          <div style={{ fontSize: 10, color: gray2, padding: "3px 8px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 999 }}>{profile.final.cn}画像</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: gray2, fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>✕</button>
        </div>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map(function (msg) {
            const isUser = msg.role === "user";
            return (
              <div key={msg.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: isUser ? "flex-end" : "flex-start", animation: "fadeSlideUp 0.3s ease both" }}>
                {!isUser && <XiaoBei size={32} speaking={false} />}
                <div style={{ maxWidth: "82%", padding: "10px 14px", fontSize: 13.5, lineHeight: 1.8, color: text1, borderRadius: isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px", background: isUser ? "rgba(59,130,246,0.2)" : "rgba(6,182,212,0.08)", border: "1px solid " + (isUser ? "rgba(59,130,246,0.3)" : "rgba(6,182,212,0.2)"), whiteSpace: "pre-wrap" }}>{msg.text}</div>
              </div>
            );
          })}
          {loading && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <XiaoBei size={32} speaking={true} />
              <div style={{ padding: "10px 14px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "4px 14px 14px 14px", display: "flex", gap: 5 }}>
                {[0, 1, 2].map(function (i) { return <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: cyan, animation: "pulse 1s " + (i * 0.2) + "s infinite" }} />; })}
              </div>
            </div>
          )}
        </div>
        {messages.length === 1 && (
          <div style={{ padding: "0 18px 10px", display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
            {["介绍一个兵工英雄的故事", "北斗系统是怎么建成的", "什么是科技自立自强"].map(function (q) {
              return <button key={q} onClick={function () { sendMessage(q); }} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)", color: cyan, cursor: "pointer" }}>{q}</button>;
            })}
          </div>
        )}
        <div style={{ padding: "12px 18px 20px", borderTop: "1px solid rgba(51,65,85,0.3)", flexShrink: 0, display: "flex", gap: 10 }}>
          <input value={input} onChange={function (e) { setInput(e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} onFocus={function () { setTimeout(function () { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 300); }} placeholder="问小备任何兵工思政问题…" style={{ flex: 1, padding: "10px 14px", borderRadius: 12, fontSize: 16, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.5)", color: text1, outline: "none" }} />
          <button onClick={function () { sendMessage(input); }} disabled={loading || !input.trim()} style={{ padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, background: loading || !input.trim() ? "rgba(51,65,85,0.4)" : "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", color: loading || !input.trim() ? gray2 : "#fff", cursor: loading || !input.trim() ? "not-allowed" : "pointer" }}>发送</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ShareCard - 画像分享卡片
// ============================================================
function ShareCard({ profile, onClose }) {
  const t = profile.final;
  const today = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
  const fallbackQuotes = { SOLID: "稳健不是保守，是每一步都站得住的从容。", PERSIST: "坚持本身就是一种答案，但别忘了让它被看见。", VALUE: "愿意提问的人，已经走在了思考的路上。", COLLAB: "系统胜利，是每一个螺丝钉都转到了对的位置。", EXPLORE: "方向还在形成，这不是迷失，是真实的出发。", RESOURCE: "潜力不会消失，只是在等一个连接的时机。", GROW: "成长不是跳跃，是每一步都比昨天扎实一点。", GUIDE: "主动寻求引导，本身就是一种清醒的勇气。" };
  const [aiQuote, setAiQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const displayQuote = aiQuote || fallbackQuotes[t.code] || "兵工铸魂，每一步都算数。";
  const [typedQuote, quoteDone] = useTyping(displayQuote, 30, !quoteLoading);

  useEffect(function() {
    const lowDims = DIMS.filter(d => profile.lvls[d] === "L").map(d => dimMeta[d].name);
    const highDims = DIMS.filter(d => profile.lvls[d] === "H").map(d => dimMeta[d].name);
    const prompt = `你是兵工思政画像系统。根据以下学生数据，生成一句个性化励志金句（20字以内，不加引号，不加任何解释，只输出金句本身）：\n画像类型：${t.cn}\n优势维度：${highDims.join("、") || "均衡"}\n待提升：${lowDims.join("、") || "无明显短板"}\n风格：简洁有力，结合兵工/国防精神，有画面感`;
    fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer sk-881c1a3f71794c418186d46bd6628167" },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], max_tokens: 60, temperature: 0.9 })
    }).then(function(res) { return res.json(); })
      .then(function(data) {
        const q = data.choices?.[0]?.message?.content?.trim().replace(/["""]/g, "") || null;
        if (q && q.length <= 30) setAiQuote(q);
        setQuoteLoading(false);
      }).catch(function() { setQuoteLoading(false); });
  }, []);

  const dims = DIMS; const angleStep = (Math.PI * 2) / dims.length; const cx = 110, cy = 110, r = 64;
  const vals = dims.map(d => ({ L: 0.25, M: 0.58, H: 0.92 }[profile.lvls[d]] || 0.5));
  function pt(i, ratio) { const a = -Math.PI / 2 + i * angleStep; return { x: cx + r * ratio * Math.cos(a), y: cy + r * ratio * Math.sin(a) }; }
  const grids = [0.33, 0.67, 1].map(ratio => dims.map((_, i) => pt(i, ratio)).map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z");
  const dataPath = vals.map((v, i) => { const p = pt(i, v); return `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }).join(" ") + " Z";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ fontSize: 18 }}>📸</div>
        <div style={{ fontSize: 12, color: gray3 }}>截图或长按保存你的专属画像卡片</div>
      </div>
      <div style={{ width: "100%", maxWidth: 340, background: "linear-gradient(145deg,#0f172a,#1e293b)", borderRadius: 24, overflow: "hidden", border: "1px solid " + t.color + "55", boxShadow: "0 0 40px " + t.color + "33, 0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ height: 4, background: "linear-gradient(90deg," + t.color + "," + cyan + ")" }} />
        {/* 动漫武器图 */}
        {PROFILE_IMAGES && PROFILE_IMAGES[t.code] && (
          <div style={{ position: "relative", width: "100%", height: 130, overflow: "hidden", background: "#050a14" }}>
            <img
              src={PROFILE_IMAGES[t.code]}
              alt={t.cn}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }}
            />
            {/* 底部渐变融合 */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 70, background: "linear-gradient(transparent,#0f172a)", pointerEvents: "none" }} />
            {/* 左右彩边 */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom," + t.color + "00," + t.color + "99," + t.color + "00)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom," + t.color + "00," + t.color + "99," + t.color + "00)", pointerEvents: "none" }} />
            {/* 画像标签 */}
            <div style={{ position: "absolute", top: 8, left: 10, padding: "3px 8px", borderRadius: 999, background: "rgba(0,0,0,0.55)", border: "1px solid " + t.color + "66", fontSize: 9, color: t.color, fontWeight: 700 }}>✦ {t.cn}</div>
          </div>
        )}
        <div style={{ padding: "16px 22px 14px", borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: t.color + "22", border: "1px solid " + t.color + "55", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 11, fontWeight: 800, color: t.color, letterSpacing: 1 }}>兵</div></div>
            <div><div style={{ fontSize: 10, color: gray2, letterSpacing: 1 }}>兵工铸魂 · 思政成长画像</div><div style={{ fontSize: 18, fontWeight: 800, color: text1, marginTop: 2 }}>{t.cn}</div></div>
            <div style={{ marginLeft: "auto", fontSize: 10, color: t.color, padding: "4px 10px", background: t.color + "18", border: "1px solid " + t.color + "33", borderRadius: 999, fontWeight: 700 }}>{t.code}</div>
          </div>
          <div style={{ marginTop: 14, minHeight: 40, padding: "10px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
            {quoteLoading ? (
              <div style={{ fontSize: 10, color: gray2, animation: "pulse 1s infinite" }}>✦ AI生成金句中…</div>
            ) : (
              <div style={{ fontSize: 12, color: t.color, fontStyle: "italic", lineHeight: 1.7 }}>
                "{typedQuote}{!quoteDone && <span style={{ animation: "pulse 0.6s infinite" }}>▍</span>}"
                {quoteDone && aiQuote && <span style={{ marginLeft: 6, fontSize: 9, color: green, padding: "1px 5px", background: "rgba(34,197,94,0.1)", borderRadius: 999, fontStyle: "normal" }}>✦ AI</span>}
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: "16px 22px", display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="180" height="180" viewBox="0 0 220 220" style={{ flexShrink: 0 }}>
            {grids.map((d, i) => <path key={i} d={d} fill="none" stroke="rgba(100,116,139,0.2)" strokeWidth="1" />)}
            {dims.map((_, i) => { const p = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="rgba(100,116,139,0.15)" strokeWidth="1" />; })}
            <path d={dataPath} fill={t.color + "28"} stroke={t.color} strokeWidth="2" strokeLinejoin="round" />
            {vals.map((v, i) => { const p = pt(i, v); const c = v >= 0.85 ? green : v >= 0.5 ? yellow : red; return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={c} stroke="#0f172a" strokeWidth="1.5" />; })}
            {dims.map((d, i) => { const p = pt(i, 1.28); const isLeft = p.x < cx - 4; const isRight = p.x > cx + 4; const anchor = isLeft ? "end" : isRight ? "start" : "middle"; const lvlColor = profile.lvls[d] === "H" ? green : profile.lvls[d] === "M" ? yellow : red; return (<g key={d}><text x={p.x} y={p.y - 3} textAnchor={anchor} fontSize="8" fontWeight="700" fill={lvlColor}>{d}</text><text x={p.x} y={p.y + 8} textAnchor={anchor} fontSize="7" fill="#64748b">{dimMeta[d].name}</text></g>); })}
          </svg>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
            {DIMS.map(function(d) { const lvl = profile.lvls[d]; const lvlColor = lvl === "H" ? green : lvl === "M" ? yellow : red; const lvlText = lvl === "H" ? "高" : lvl === "M" ? "中" : "低"; return (<div key={d} style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 3, height: 3, borderRadius: "50%", background: lvlColor, flexShrink: 0 }} /><div style={{ fontSize: 9, color: gray3, flex: 1, whiteSpace: "nowrap" }}>{dimMeta[d].name}</div><div style={{ fontSize: 9, color: lvlColor, fontWeight: 700 }}>{lvlText}</div></div>); })}
          </div>
        </div>
        <div style={{ padding: "12px 22px 18px", borderTop: "1px solid rgba(51,65,85,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 9, color: "#334155" }}>沈阳理工大学 · 装备工程学院</div>
          <div style={{ fontSize: 9, color: "#334155" }}>{today}</div>
        </div>
      </div>
      <button onClick={onClose} style={{ marginTop: 20, padding: "10px 32px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "rgba(51,65,85,0.5)", border: "1px solid rgba(100,116,139,0.3)", color: gray3, cursor: "pointer" }}>关闭</button>
    </div>
  );
}

// ============================================================
// XiaoBeiChat - 画像驱动对话界面（脚本式）
// ============================================================
function XiaoBeiChat({ profile, onClose }) {
  const typeCode = profile.final.code;
  const script = CHAT_SCRIPTS[typeCode] || CHAT_SCRIPTS["GROW"];
  const [round, setRound] = useState(-1);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [history, setHistory] = useState([]);
  const [openerDone, setOpenerDone] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(-1);
  const [typedOpener, openerTyped] = useTyping(script.opener, 14, true);
  const scrollRef = useRef(null);

  useEffect(function () { if (openerTyped) setOpenerDone(true); }, [openerTyped]);
  useEffect(function () { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [history, typedOpener]);

  function handleOpt(opt) {
    if (selectedOpt !== null) return;
    setSelectedOpt(opt.label);
    const newHistory = [...history, { role: "user", text: opt.label }, { role: "xb", text: opt.next }];
    setHistory(newHistory);
    const xbIdx = newHistory.filter(m => m.role === "xb").length - 1;
    setSpeakingIdx(xbIdx);
    setTimeout(function () { setSpeakingIdx(-1); }, 1500);
    const nextRound = round + 1;
    setTimeout(function () { setSelectedOpt(null); if (nextRound >= script.rounds.length) { setRound(99); } else { setRound(nextRound); } }, 400);
  }

  const currentRound = round >= 0 && round < script.rounds.length ? script.rounds[round] : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
      <div style={{ width: "100%", maxWidth: 560, background: dark1, borderRadius: "20px 20px 0 0", border: "1px solid rgba(6,182,212,0.25)", display: "flex", flexDirection: "column", maxHeight: "88vh" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(51,65,85,0.4)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <XiaoBei size={36} speaking={round === -1 && !openerDone} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: text1 }}>小备 · 画像引导对话</div><div style={{ fontSize: 11, color: cyan }}>基于你的{profile.final.cn}画像 · 个性化引导</div></div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: gray2, fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>✕</button>
        </div>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <XiaoBei size={32} speaking={!openerDone} />
            <div style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "4px 14px 14px 14px", padding: "10px 14px", maxWidth: "82%", fontSize: 13.5, color: text1, lineHeight: 1.75 }}>
              {typedOpener}{!openerDone && <span style={{ animation: "pulse 0.8s infinite" }}>▍</span>}
            </div>
          </div>
          {history.map(function (msg, i) {
            if (msg.role === "user") return (<div key={i} style={{ display: "flex", justifyContent: "flex-end" }}><div style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "14px 4px 14px 14px", padding: "10px 14px", maxWidth: "82%", fontSize: 13.5, color: text1, lineHeight: 1.75 }}>{msg.text}</div></div>);
            const xbIdx = history.slice(0, i + 1).filter(m => m.role === "xb").length - 1;
            const isSpeaking = xbIdx === speakingIdx;
            return (<div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: "fadeSlideUp 0.3s ease both" }}><XiaoBei size={32} speaking={isSpeaking} /><div style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "4px 14px 14px 14px", padding: "10px 14px", maxWidth: "82%", fontSize: 13.5, color: text1, lineHeight: 1.75 }}>{msg.text}</div></div>);
          })}
          {round === 99 && (
            <div style={{ textAlign: "center", padding: "16px 0", animation: "fadeSlideUp 0.4s ease both" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✨</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: cyan, marginBottom: 4 }}>对话完成</div>
              <div style={{ fontSize: 12, color: gray3, marginBottom: 16 }}>小备已记录本次引导内容</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 4px" }}>
                <button onClick={onClose} style={{ padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,rgba(6,182,212,0.2),rgba(59,130,246,0.15))", border: "1px solid rgba(6,182,212,0.4)", color: cyan, cursor: "pointer" }}>📖 去看看推荐的兵工案例</button>
                <button onClick={onClose} style={{ padding: "10px", borderRadius: 10, fontSize: 12, background: "transparent", border: "1px solid rgba(51,65,85,0.4)", color: gray3, cursor: "pointer" }}>返回我的画像</button>
              </div>
            </div>
          )}
        </div>
        {openerDone && currentRound && round !== 99 && (
          <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(51,65,85,0.3)", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: cyan, fontWeight: 600, marginBottom: 10 }}>💬 {currentRound.q}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {currentRound.opts.map(function (opt, i) {
                const isSelected = selectedOpt === opt.label;
                return (<button key={i} onClick={function () { handleOpt(opt); }} disabled={selectedOpt !== null} style={{ textAlign: "left", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: isSelected ? "rgba(59,130,246,0.2)" : "rgba(30,41,59,0.6)", border: "1px solid " + (isSelected ? "rgba(59,130,246,0.5)" : "rgba(51,65,85,0.4)"), color: isSelected ? "#60a5fa" : text2, cursor: selectedOpt !== null ? "not-allowed" : "pointer", transition: "all 0.2s", lineHeight: 1.6 }}>{opt.label}</button>);
              })}
            </div>
          </div>
        )}
        {!openerDone && (<div style={{ padding: "12px 18px", borderTop: "1px solid rgba(51,65,85,0.3)", flexShrink: 0, textAlign: "center", fontSize: 12, color: gray3, animation: "pulse 1s infinite" }}>小备正在思考…</div>)}
      </div>
    </div>
  );
}

// ============================================================
// ProfileWeaponImage - 画像动漫武器图展示组件
// ============================================================
function ProfileWeaponImage({ src, color, typeName }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (errored) return null;

  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden", maxHeight: 260, background: "#050a14" }}>
      <img
        src={src}
        alt={typeName + " 动漫武器图"}
        onLoad={function () { setLoaded(true); }}
        onError={function () { setErrored(true); }}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          display: "block", maxHeight: 260,
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      />
      {/* 加载占位 */}
      {!loaded && !errored && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
          <div style={{ fontSize: 11, color: "rgba(100,116,139,0.6)", animation: "pulse 1s infinite" }}>加载画像图…</div>
        </div>
      )}
      {/* 底部渐变 - 与卡片背景融合 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 90,
        background: "linear-gradient(transparent, #1e293b)",
        pointerEvents: "none",
      }} />
      {/* 左侧彩色竖线装饰 */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: "linear-gradient(to bottom," + color + "00," + color + "cc," + color + "00)",
      }} />
      {/* 右侧彩色竖线装饰 */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 3,
        background: "linear-gradient(to bottom," + color + "00," + color + "cc," + color + "00)",
      }} />
      {/* 画像类型标签 */}
      {loaded && (
        <div style={{
          position: "absolute", top: 12, left: 14,
          padding: "4px 10px", borderRadius: 999,
          background: "rgba(0,0,0,0.55)",
          border: "1px solid " + color + "66",
          fontSize: 10, color: color, fontWeight: 700,
          backdropFilter: "blur(4px)",
        }}>
          ✦ {typeName}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ProfileResultView - 画像结果页主组件
// ============================================================
export default function ProfileResultView({ profile, aiAnalysis, learnedCases = [], openChatOnReturn = false, onChatOpened, onChooseCase, onRetake }) {
  const t = profile.final;
  const rec = RECOMMEND_MAP[t.code];
  const recCase = rec.primary ? CASES[rec.primary] : null;
  const [showChat, setShowChat] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(function () {
    if (openChatOnReturn) { setShowChat(true); if (onChatOpened) onChatOpened(); }
  }, []);

  const hour = new Date().getHours();
  const timeGreet = hour < 6 ? "深夜了还在学习" : hour < 12 ? "早上好" : hour < 18 ? "下午好" : hour < 22 ? "晚上好" : "夜深了还没休息";
  const fallbackWelcome = { SOLID: "你的画像生成了。稳进发展型——你对自己的方向有清晰的感知，这很难得。接下来，让我们一起找一个真正触动你的兵工故事。", PERSIST: "你的画像生成了。高压坚持型——你一直在用力，但思辨的空间还可以更大。今天，试着把你的一个想法说出来？", VALUE: "你的画像生成了。价值思辨型——愿意提问本身就是一种力量。我为你准备了几个值得深想的兵工故事。", COLLAB: "你的画像生成了。集体凝聚型——你天然理解'系统胜利'。福建舰的故事，可能是最适合你的那个。", EXPLORE: "你的画像生成了。方向探索型——不是不努力，只是方向还在形成。没关系，我们一起看看别人是怎么选的。", RESOURCE: "你的画像生成了。资源激活型——你有潜力，只是还没接上资源。今天，我来帮你找到那个入口。", GROW: "你的画像生成了。成长进行时——均衡而有活力。每一步都算数，我们从一个真实的兵工故事开始。", GUIDE: "你的画像生成了。重点引导型——你主动寻求引导，这是清醒的表现。小备已为你准备好了下一步。" };
  const welcomeText = aiAnalysis || fallbackWelcome[t.code] || "你的画像生成了，让我们开始吧。";
  const [typedWelcome, welcomeDone] = useTyping(welcomeText, 18, true);

  const pathMap = {
    SOLID:   ["beidou",   "tiangong", "fujian",  "y20",     "tank99a", "j20",      "df41",  "df17"],
    PERSIST: ["df41",     "tank99a",  "y20",     "beidou",  "fujian",  "tiangong", "j20",   "df17"],
    VALUE:   ["j20",      "df17",     "tank99a", "beidou",  "df41",    "fujian",   "y20",   "tiangong"],
    COLLAB:  ["fujian",   "y20",      "tiangong","beidou",  "tank99a", "j20",      "df41",  "df17"],
    EXPLORE: ["tank99a",  "j20",      "df17",    "beidou",  "fujian",  "df41",     "y20",   "tiangong"],
    RESOURCE:["df17",     "beidou",   "tank99a", "j20",     "tiangong","fujian",   "df41",  "y20"],
    GROW:    ["tiangong", "tank99a",  "beidou",  "fujian",  "y20",     "j20",      "df17",  "df41"],
    GUIDE:   ["y20",      "fujian",   "df41",    "tiangong","beidou",  "tank99a",  "j20",   "df17"],
  };
  const path = pathMap[t.code] || CASE_ORDER;

  const lowDims = DIMS.filter(d => profile.lvls[d] === "L");
  const actionMap = { PA: "主动参与一次兵工相关的社团活动或讲座", MP: "和同学聊聊你理解的'为什么要搞国防'", VS: "找一篇争议性文章，试着自己判断立场", CC: "在下次团队任务中主动承担协调角色", CT: "在课堂上提出至少一个你真正想问的问题", SC: "回顾一次你做成的事，写下它对国家有什么意义", CD: "和学长或老师聊聊军工就业的真实路径", IR: "查一下学院本学期有哪些思政讲座资源" };
  const typeAction = { SOLID: "尝试帮助一位同学了解你认同的兵工精神", PERSIST: "找一次公开讨论的机会，把你坚持的观点说出来", VALUE: "带着一个疑问去看一个兵工案例，找到你自己的答案", COLLAB: "主动在下次协作中提出'系统优先'的决策建议", EXPLORE: "今天就把你理想的毕业去向写下来，哪怕只是草稿", RESOURCE: "花10分钟看看学校思政平台上有什么你没用过的资源", GROW: "完整看完一个推荐案例，写3句话总结你的收获", GUIDE: "今天就和辅导员预约一次一对一沟通" };
  const action = lowDims.length > 0 ? actionMap[lowDims[0]] : typeAction[t.code] || "选一个案例，开始你的兵工铸魂之旅";

  return (
    <div style={{ background: dark0, minHeight: "100%", color: text1 }}>
      <div style={{ background: "linear-gradient(135deg," + dark1 + "," + dark3 + ")", borderBottom: "1px solid rgba(59,130,246,0.2)", padding: "16px 24px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>你的兵工思政画像</div>
        <div style={{ fontSize: 11, color: gray1, marginTop: 2 }}>基于 16 题作答 · 8 维成长画像 · AI 智能匹配</div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 16px" }}>
        {/* 小备欢迎 */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.18)", borderRadius: 14, marginBottom: 18, animation: "fadeSlideUp 0.5s ease both" }}>
          <XiaoBei size={48} speaking={false} />
          <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: cyan, fontWeight: 600 }}>小备 · {timeGreet}</div>
                {aiAnalysis && <div style={{ fontSize: 9, color: green, padding: "1px 6px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 999, fontWeight: 600 }}>✦ DeepSeek生成</div>}
                {!aiAnalysis && <div style={{ fontSize: 9, color: gray2, padding: "1px 6px", background: "rgba(51,65,85,0.3)", borderRadius: 999 }}>AI生成中…</div>}
              </div>
              <div style={{ fontSize: 13.5, color: text2, lineHeight: 1.8 }}>
                {typedWelcome}{!welcomeDone && <span style={{ animation: "pulse 0.8s infinite" }}>▍</span>}
              </div>
            </div>
        </div>

        {/* 画像主卡片 */}
        <div style={{ background: "linear-gradient(135deg," + dark2 + "," + dark3 + ")", border: "1px solid " + t.color + "55", borderRadius: 18, marginBottom: 18, position: "relative", overflow: "hidden" }}>
          {/* 动漫武器图 */}
          {PROFILE_IMAGES && PROFILE_IMAGES[t.code] && (
            <ProfileWeaponImage src={PROFILE_IMAGES[t.code]} color={t.color} typeName={t.cn} />
          )}
          <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle," + t.color + "22 0%,transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", padding: "24px 22px" }}>
            <div style={{ fontSize: 11, color: t.color, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>画像类型 · {t.code}</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 10, letterSpacing: -0.5 }}>{t.cn}</div>
            <div style={{ fontSize: 14, color: text2, marginBottom: 12, fontStyle: "italic" }}>{t.intro}</div>
            <div style={{ fontSize: 13.5, color: text2, lineHeight: 1.85 }}>{t.desc}</div>
            {profile.matchInfo && (<div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(15,23,42,0.6)", border: "1px solid " + t.color + "44", borderRadius: 999, fontSize: 11, color: t.color, fontWeight: 600 }}>{profile.matchInfo}</div>)}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={function () { setShowShare(true); }} style={{ flex: 1, padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 700, background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", color: yellow, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>🪪 生成画像卡片</button>
              <button onClick={function () { if (syncDone || syncing) return; setSyncing(true); setTimeout(function () { setSyncing(false); setSyncDone(true); }, 1500); }} style={{ flex: 1, padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 700, background: syncDone ? "rgba(34,197,94,0.1)" : "rgba(139,92,246,0.1)", border: "1px solid " + (syncDone ? "rgba(34,197,94,0.3)" : "rgba(139,92,246,0.3)"), color: syncDone ? green : purple, cursor: syncDone ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center", whiteSpace: "nowrap" }}>{syncing ? <span style={{ animation: "pulse 0.6s infinite" }}>⏳</span> : syncDone ? "✓" : "📤"}{syncing ? "同步中…" : syncDone ? "已同步给老师" : "同步给老师"}</button>
            </div>
            {/* GUIDE类型额外显示预约辅导员按钮 */}
            {t.code === "GUIDE" && (
              <div style={{ marginTop: 12 }}>
                <GuideAppointment reason="系统检测到你当前需要更多个性化支持，建议与辅导员进行一对一沟通。" />
              </div>
            )}
          </div>
        </div>

        {showChat && <CozeChat profile={profile} onClose={function () { setShowChat(false); }} />}
        {showShare && <ShareCard profile={profile} onClose={function () { setShowShare(false); }} />}

        {/* 学习进度 */}
        {learnedCases.length > 0 && (
          <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "12px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 22 }}>🏅</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: green, fontWeight: 700, marginBottom: 4 }}>兵工学习进度 · 已完成 {learnedCases.length}/{CASE_ORDER.length} 个案例</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {CASE_ORDER.map(function (id) { const done = learnedCases.includes(id); return (<span key={id} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, fontWeight: 600, background: done ? "rgba(34,197,94,0.15)" : "rgba(51,65,85,0.3)", color: done ? green : gray2, border: "1px solid " + (done ? "rgba(34,197,94,0.3)" : "rgba(51,65,85,0.3)") }}>{done ? "✓ " : ""}{CASES[id].name}</span>); })}
              </div>
            </div>
          </div>
        )}

        {/* 雷达图 */}
        <div style={{ background: dark2, border: "1px solid rgba(51,65,85,0.5)", borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: text1, marginBottom: 4 }}>八维成长画像</div>
          <div style={{ fontSize: 11, color: gray1, marginBottom: 14 }}>点击维度查看说明</div>
          <RadarChart lvls={profile.lvls} size={310} />
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
            {DIMS.map(function (d) { const lvl = profile.lvls[d]; const score = profile.raw[d]; const lvlColor = lvl === "H" ? green : lvl === "M" ? yellow : red; return (<div key={d} style={{ padding: "6px 8px", background: "rgba(15,23,42,0.5)", borderRadius: 8, textAlign: "center" }}><div style={{ fontSize: 10, color: cyan, fontWeight: 700 }}>{d}</div><div style={{ fontSize: 13, fontWeight: 800, color: lvlColor, margin: "2px 0" }}>{score}</div><div style={{ height: 3, background: "rgba(30,41,59,0.6)", borderRadius: 999, overflow: "hidden" }}><div style={{ width: (score / 8 * 100) + "%", height: "100%", background: lvlColor }} /></div></div>); })}
          </div>
          {lowDims.length > 0 && (<div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10 }}><div style={{ fontSize: 11, color: red, fontWeight: 700, marginBottom: 6 }}>▼ 需关注的维度</div>{lowDims.map(d => (<div key={d} style={{ fontSize: 12, color: gray3, lineHeight: 1.65, marginBottom: 4 }}><span style={{ color: red, fontWeight: 700 }}>{d} {dimMeta[d].name}：</span>{DIM_EXP[d]["L"]}</div>))}</div>)}
        </div>

        {/* 下一步行动 */}
        <div style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.08),rgba(6,182,212,0.06))", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 14, padding: "14px 18px", marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: blue, fontWeight: 700, marginBottom: 6 }}>🎯 你当前最值得做的一件事</div>
          <div style={{ fontSize: 14, color: text1, lineHeight: 1.75, fontWeight: 500 }}>{action}</div>
        </div>

        {/* 小备推荐 */}
        <div style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <XiaoBei size={64} speaking={true} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: cyan, fontWeight: 600, marginBottom: 6 }}>小备的推荐</div>
              {recCase ? (<><div style={{ fontSize: 14.5, color: text1, lineHeight: 1.75, marginBottom: 12 }}>{rec.reason}</div><div onClick={function () { onChooseCase(recCase.id); }} style={{ background: dark2, border: "1px solid rgba(6,182,212,0.4)", borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.18s" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><div style={{ fontSize: 15, fontWeight: 700, color: cyan }}>{recCase.title}</div><div style={{ fontSize: 11, color: gray3 }}>{recCase.timeline}</div></div><div style={{ fontSize: 12, color: gray3, marginBottom: 8 }}>{recCase.type}</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{recCase.tags.map(function (tag, i) { return <span key={i} style={{ fontSize: 11, padding: "3px 10px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: cyan, borderRadius: 999 }}>{tag}</span>; })}</div><div style={{ marginTop: 10, fontSize: 12, color: cyan, fontWeight: 600 }}>点击进入学习 →</div></div></>) : (<GuideAppointment reason={rec.reason} />)}
            </div>
          </div>
        </div>

        {/* 推荐学习路径 */}
        {recCase && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: gray1, marginBottom: 10, fontWeight: 600 }}>🗺️ 为你规划的学习路径</div>
            <div style={{ background: dark2, borderRadius: 14, border: "1px solid rgba(51,65,85,0.4)", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
                {path.map(function (id, idx) {
                  const c = CASES[id]; const isDone = learnedCases.includes(id); const isCurrent = id === recCase.id && !isDone;
                  const stepColor = isDone ? green : isCurrent ? cyan : gray2;
                  return (<div key={id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}><div onClick={function () { if (!isDone) onChooseCase(id); }} style={{ textAlign: "center", cursor: isDone ? "default" : "pointer", padding: "0 4px" }}><div style={{ width: 36, height: 36, borderRadius: "50%", background: isDone ? "rgba(34,197,94,0.15)" : isCurrent ? "rgba(6,182,212,0.15)" : "rgba(30,41,59,0.8)", border: "2px solid " + stepColor, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: 14, transition: "all 0.2s" }}>{isDone ? "✓" : idx + 1}</div><div style={{ fontSize: 10, color: stepColor, fontWeight: 600, whiteSpace: "nowrap" }}>{c.name}</div>{isCurrent && <div style={{ fontSize: 9, color: cyan, marginTop: 2 }}>推荐</div>}{isDone && <div style={{ fontSize: 9, color: green, marginTop: 2 }}>已完成</div>}</div>{idx < path.length - 1 && (<div style={{ width: 20, height: 2, background: isDone ? "rgba(34,197,94,0.4)" : "rgba(51,65,85,0.4)", flexShrink: 0, margin: "0 2px" }} />)}</div>);
                })}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: gray3 }}>进度 {learnedCases.length}/{CASE_ORDER.length} · 按推荐顺序学习效果更佳</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 12, paddingBottom: 80 }}>
          <button onClick={onRetake} style={{ padding: "10px 20px", borderRadius: 10, background: "transparent", border: "1px solid rgba(100,116,139,0.4)", color: gray3, cursor: "pointer", fontSize: 13 }}>重新测评</button>
        </div>
      </div>
    </div>
  );
}
