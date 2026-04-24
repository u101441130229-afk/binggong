// TODO: DeepSeek接入点
import { useState, useEffect, useRef } from "react";
import {
  blue, purple, yellow, cyan, green, red,
  dark0, dark1, dark2, dark3,
  gray1, gray2, gray3, text1, text2
} from "./constants.js";
import XiaoBei from "./components/XiaoBei.jsx";
import StudentView from "./views/StudentView.jsx";
import TeacherView from "./views/TeacherView.jsx";
import SchoolView from "./views/SchoolView.jsx";

// ============================================================
// LoginPage - 星空登录页
// ============================================================
function LoginPage({ onLogin }) {
  const [sel, setSel] = useState(null);
  const [hover, setHover] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const canvasRef = useRef(null);

  // 通义千问VL识别状态
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // 装备关键词 → 案例ID映射（顺序即优先级，越靠前越优先匹配）
  const equipmentMap = [
    { keywords: ["运输机","运-20","运20","Y-20","Y20","大型运输","战略运输","空运","空投"], caseId: "y20", name: "运-20大型运输机" },
    { keywords: ["歼20","歼-20","J-20","J20","隐身战斗机","战斗机","战机"], caseId: "j20", name: "歼-20隐身战斗机" },
    { keywords: ["航母","福建舰","福建","电磁弹射","舰载机","军舰","舰船"], caseId: "fujian", name: "福建舰航母" },
    { keywords: ["东风-41","东风41","DF-41","洲际导弹","洲际弹道"], caseId: "df41", name: "东风-41导弹" },
    { keywords: ["东风-17","东风17","DF-17","高超音速","滑翔导弹"], caseId: "df17", name: "东风-17高超音速导弹" },
    { keywords: ["导弹","弹道导弹","发射车","火箭炮","东风"], caseId: "df41", name: "东风-41导弹" },
    { keywords: ["坦克","装甲","99A","99式","履带","炮塔","装甲车"], caseId: "tank99a", name: "99A主战坦克" },
    { keywords: ["北斗","卫星导航","导航卫星","GPS","GNSS","卫星网络"], caseId: "beidou", name: "北斗卫星导航系统" },
    { keywords: ["空间站","天宫","天和","问天","梦天","航天员","载人航天","神舟"], caseId: "tiangong", name: "天宫空间站" },
    { keywords: ["卫星","航天","火箭","长征"], caseId: "tiangong", name: "天宫空间站" },
  ];

  async function handleImageRecognize(file) {
    if (!file) return;
    setScanning(true);
    setScanResult(null);
    setScanError(null);
    try {
      // 转base64
      const base64 = await new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function(e) { resolve(e.target.result.split(",")[1]); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const mediaType = file.type || "image/jpeg";

      const res = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk-47291327d13c4388abc42a898e0af76c"
        },
        body: JSON.stringify({
          model: "qwen-vl-max-latest",
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}` } },
              { type: "text", text: "请识别图片中的军事装备或国防相关内容。按以下格式用中文回答（总字数60字以内）：第一行装备名称及简介15字以内。第二行一个有画面感的细节或成就20字以内。第三行一句引导思考的问题以→开头20字以内。如果不是军事装备也请按此格式描述。" }
            ]
          }],
          max_tokens: 150
        })
      });
      const data = await res.json();
      const description = data.choices?.[0]?.message?.content || "";

      // 匹配案例
      let matched = null;
      for (const item of equipmentMap) {
        if (item.keywords.some(kw => description.includes(kw))) {
          matched = item;
          break;
        }
      }
      setScanResult({ description, matched });
    } catch(e) {
      setScanError("识别失败，请检查网络或重试");
    }
    setScanning(false);
  }

  useEffect(function () {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

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
        r: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.3 + 0.05,
        opacity: Math.random() * 0.6 + 0.2,
        pulse: Math.random() * Math.PI * 2,
      };
    });

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(function (s) {
        s.pulse += 0.012;
        const alpha = s.opacity * (0.7 + 0.3 * Math.sin(s.pulse));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,184,${alpha})`;
        ctx.fill();
        if (s.r > 1.5) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(6,182,212,${alpha * 0.15})`;
          ctx.fill();
        }
        s.y -= s.speed;
        if (s.y < -2) { s.y = canvas.height + 2; s.x = Math.random() * canvas.width; }
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return function () { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const roles = [
    { key: "student", icon: "🎓", label: "学生",      desc: "思政画像测评 · 个性化案例引导", color: blue },
    { key: "teacher", icon: "👨‍🏫", label: "教师",      desc: "学情画像研判 · 教学建议",        color: purple },
    { key: "school",  icon: "🏫", label: "学校管理员", desc: "群体画像分析 · 决策支持",        color: yellow },
  ];

  return (
    <div style={{ background: dark0, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {/* 星空Canvas */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

      {/* 右上角问号 */}
      <button onClick={function () { setShowInfo(true); }} style={{ position: "absolute", top: 16, right: 16, zIndex: 2, width: 32, height: 32, borderRadius: "50%", background: "rgba(51,65,85,0.5)", border: "1px solid rgba(100,116,139,0.4)", color: gray3, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>?</button>

      {/* 系统介绍弹窗 */}
      {showInfo && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={function () { setShowInfo(false); }}>
          <div style={{ width: "100%", maxWidth: 420, background: dark1, borderRadius: 20, border: "1px solid rgba(6,182,212,0.3)", overflow: "hidden", animation: "profileGen 0.4s ease both" }} onClick={function (e) { e.stopPropagation(); }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(51,65,85,0.4)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}><img src="/favicon.png" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} alt="兵" /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: text1 }}>兵工铸魂 · 智绘"易"学</div>
                <div style={{ fontSize: 10, color: gray2 }}>沈阳理工大学装备工程学院 · AI思政教育系统</div>
              </div>
              <button onClick={function () { setShowInfo(false); }} style={{ marginLeft: "auto", background: "transparent", border: "none", color: gray2, fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "18px 20px" }}>
              {[
                { icon: "🎯", title: "解决什么问题", desc: "传统思政教育缺乏个性化——每位学生的认知状态、价值底座、职业方向感各不相同，却接受同一套教学内容。本系统通过8维画像，让思政教育真正因材施教。" },
                { icon: "🤖", title: "核心技术", desc: "DeepSeek大模型驱动八维画像动态分析、个性化教学建议与小备对话；通义千问VL实现拍照识别兵工装备；localStorage实现三端数据实时流转。" },
                { icon: "👥", title: "三端是谁用的", desc: "学生端完成画像测评、个性化案例学习和与小备的深度对话；教师端查看真实学情并获得DeepSeek个性化建议；学校端宏观把握院级群体画像与趋势。" },
                { icon: "🏆", title: "参赛信息", desc: "第十届全国高校易班技术创新大会 · 智能体AIGC应用赛道。沈阳理工大学装备工程学院参赛作品。" },
              ].map(function (item, i) {
                return (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < 3 ? 16 : 0, paddingBottom: i < 3 ? 16 : 0, borderBottom: i < 3 ? "1px solid rgba(51,65,85,0.3)" : "none" }}>
                    <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: cyan, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: text2, lineHeight: 1.7 }}>{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 主体内容 */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Logo + 标题 */}
        <div style={{ marginBottom: 40, textAlign: "center", animation: "fadeSlideUp 0.5s ease both" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, overflow: "hidden", margin: "0 auto 16px" }}><img src="/favicon.png" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} alt="兵" /></div>
          <div style={{ fontSize: 22, fontWeight: 800, color: text1, letterSpacing: 2 }}>兵工铸魂 · 智绘"易"学</div>
          <div style={{ fontSize: 13, color: gray2, marginTop: 6 }}>沈阳理工大学 · 装备工程学院 · AI思政教育系统</div>
        </div>

        {/* 小备入场 */}
        <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, animation: "fadeSlideUp 0.5s 0.15s ease both", opacity: 0 }}>
          <XiaoBei size={90} speaking={false} />
          <div style={{ fontSize: 12, color: gray1, fontStyle: "italic" }}>嗨!我是小备,欢迎来到兵工铸魂学习系统 👋</div>
        </div>

        <div style={{ fontSize: 14, color: gray1, marginBottom: 24, animation: "fadeIn 0.4s 0.3s ease both", opacity: 0 }}>请选择您的身份</div>

        {/* 角色卡片 */}
        <div style={{ display: "flex", gap: 20, marginBottom: 40, flexWrap: "wrap", justifyContent: "center", padding: "0 16px" }}>
          {roles.map(function (r, idx) {
            const active = sel === r.key;
            const isHover = hover === r.key && !active;
            return (
              <div key={r.key}
                onClick={function () { setSel(r.key); }}
                onMouseEnter={function () { setHover(r.key); }}
                onMouseLeave={function () { setHover(null); }}
                style={{
                  width: 180, padding: "28px 20px", borderRadius: 20, cursor: "pointer", textAlign: "center",
                  background: active ? "rgba(59,130,246,0.08)" : dark2,
                  border: "2px solid " + (active ? r.color : isHover ? "rgba(100,116,139,0.6)" : "rgba(51,65,85,0.4)"),
                  transition: "all 0.25s",
                  transform: active ? "translateY(-4px)" : isHover ? "translateY(-2px)" : "none",
                  animation: `fadeSlideUp 0.45s ${0.35 + idx * 0.1}s ease both`,
                  opacity: 0, position: "relative"
                }}>
                {active && (
                  <div style={{ position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 800, animation: "profileGen 0.3s ease both" }}>✓</div>
                )}
                <div style={{ fontSize: 32, marginBottom: 14 }}>{r.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: active ? r.color : text1, marginBottom: 8 }}>{r.label}</div>
                <div style={{ fontSize: 12, color: gray3, lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            );
          })}
        </div>

        {/* 进入按钮 */}
        <button onClick={function () { if (sel) onLogin(sel); }} style={{
          padding: "14px 48px", borderRadius: 14, fontSize: 15, fontWeight: 700,
          background: sel ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "rgba(51,65,85,0.4)",
          border: "none", color: sel ? "#fff" : gray2, cursor: sel ? "pointer" : "not-allowed",
          animation: "fadeSlideUp 0.45s 0.65s ease both", opacity: 0
        }}>进入系统 →</button>

        {/* 拍照识别装备按钮 */}
        <div style={{ marginTop: 20, animation: "fadeSlideUp 0.45s 0.75s ease both", opacity: 0 }}>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
            onChange={function(e) { if (e.target.files[0]) handleImageRecognize(e.target.files[0]); }} />
          <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={function(e) { if (e.target.files[0]) handleImageRecognize(e.target.files[0]); }} />
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={function() { fileInputRef.current.click(); }} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 12,
              background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)",
              color: cyan, cursor: "pointer", fontSize: 13, fontWeight: 600
            }}>📷 拍照识别</button>
            <button onClick={function() { galleryInputRef.current.click(); }} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 12,
              background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
              color: "#a78bfa", cursor: "pointer", fontSize: 13, fontWeight: 600
            }}>🖼️ 从相册选取</button>
          </div>
          <div style={{ fontSize: 10, color: gray2, textAlign: "center", marginTop: 6 }}>拍照或选取兵工装备图片，自动跳转对应案例</div>
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: "#2d3748", textAlign: "center", lineHeight: 1.8, animation: "fadeIn 0.4s 0.8s ease both", opacity: 0 }}>
          形象设计:沈阳理工大学装备工程学院官方吉祥物"小备"
        </div>
      </div>

      {/* 识别中遮罩 */}
      {scanning && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <XiaoBei size={80} speaking={true} />
          <div style={{ fontSize: 16, fontWeight: 700, color: text1 }}>通义千问识别中…</div>
          <div style={{ fontSize: 12, color: cyan, animation: "pulse 1s infinite" }}>正在分析图片内容</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: cyan, animation: "pulse 1s " + (i*0.2) + "s infinite" }} />)}
          </div>
        </div>
      )}

      {/* 识别结果弹窗 */}
      {scanResult && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 360, background: dark1, borderRadius: 20, border: "1px solid rgba(6,182,212,0.3)", overflow: "hidden", animation: "profileGen 0.4s ease both" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(51,65,85,0.4)", display: "flex", alignItems: "center", gap: 10 }}>
              <XiaoBei size={36} speaking={false} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: cyan }}>通义千问VL · 识别结果</div>
                <div style={{ fontSize: 10, color: gray2 }}>qwen-vl-max-latest 视觉理解</div>
              </div>
            </div>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 12, color: gray3, marginBottom: 8 }}>识别到的内容：</div>
              <div style={{ fontSize: 13, color: text1, lineHeight: 2, padding: "12px 14px", background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 10, marginBottom: 16 }}>
                {scanResult.description.split(/\n|。(?=[第→])/).map(function(line, i) {
                  if (!line.trim()) return null;
                  const isQuestion = line.startsWith("→");
                  return (
                    <div key={i} style={{ marginBottom: i < 2 ? 8 : 0, color: isQuestion ? cyan : i === 0 ? text1 : "#94a3b8", fontWeight: isQuestion ? 600 : i === 0 ? 700 : 400, fontSize: isQuestion ? 13 : i === 0 ? 14 : 12 }}>
                      {line}
                    </div>
                  );
                })}
              </div>
              {scanResult.matched ? (
                <>
                  <div style={{ fontSize: 12, color: green, fontWeight: 600, marginBottom: 10 }}>
                    ✓ 匹配到兵工案例：{scanResult.matched.name}
                  </div>
                  <button onClick={function() {
                    setScanResult(null);
                    // 自动以学生身份进入，跳转到对应案例
                    window.__autoCase = scanResult.matched.caseId;
                    onLogin("student");
                  }} style={{
                    width: "100%", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", color: "#fff", cursor: "pointer", marginBottom: 8
                  }}>🚀 进入案例学习 →</button>
                </>
              ) : (
                <div style={{ fontSize: 12, color: yellow, marginBottom: 10 }}>
                  未匹配到兵工装备案例，可以手动进入系统探索
                </div>
              )}
              <button onClick={function() { setScanResult(null); }} style={{
                width: "100%", padding: "10px", borderRadius: 10, fontSize: 13,
                background: "transparent", border: "1px solid rgba(51,65,85,0.4)", color: gray3, cursor: "pointer"
              }}>返回</button>
            </div>
          </div>
        </div>
      )}

      {/* 识别失败提示 */}
      {scanError && (
        <div style={{ position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 500, padding: "12px 24px", background: "rgba(239,68,68,0.9)", borderRadius: 12, fontSize: 13, color: "#fff", fontWeight: 600 }}>
          {scanError}
          <button onClick={function() { setScanError(null); }} style={{ marginLeft: 12, background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// App - 主入口 + Tab路由
// ============================================================
// ============================================================
// XiaoBeiFloat - 全局悬浮小备聊天窗口
// ============================================================
function XiaoBeiFloat({ role }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "嗨！我是小备 👋 有任何兵工思政问题都可以问我，不用答题也能聊！也可以点 📷 拍照识别兵工装备～", id: 1 }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgScanning, setImgScanning] = useState(false);
  const scrollRef = useRef(null);
  const camInputRef = useRef(null);
  const camGalleryRef = useRef(null);

  useEffect(function() {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  // 通义千问VL图片识别
  async function handleCameraInput(file) {
    if (!file) return;
    setImgScanning(true);
    setMessages(function(prev) { return [...prev, { role: "assistant", text: "📷 小备正在识别图片，请稍候…", id: Date.now(), isScanning: true }]; });
    try {
      const base64 = await new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function(e) { resolve(e.target.result.split(",")[1]); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const mediaType = file.type || "image/jpeg";
      const res = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer sk-47291327d13c4388abc42a898e0af76c" },
        body: JSON.stringify({
          model: "qwen-vl-max-latest",
          messages: [{ role: "user", content: [
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}` } },
            { type: "text", text: "请识别图片中的军事装备或国防相关内容，用中文描述（50字以内），并结合兵工精神给出一句简短点评。如不是军事装备，也请描述并尝试联系国防主题。" }
          ]}],
          max_tokens: 200
        })
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "小备没能识别出这张图片，换一张试试吧～";
      setMessages(function(prev) {
        return [...prev.filter(m => !m.isScanning), { role: "assistant", text: "📷 " + reply, id: Date.now() }];
      });
    } catch(e) {
      setMessages(function(prev) {
        return [...prev.filter(m => !m.isScanning), { role: "assistant", text: "识别失败，请检查网络后重试～", id: Date.now() }];
      });
    }
    setImgScanning(false);
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", text: text.trim(), id: Date.now() };
    setMessages(function(prev) { return [...prev, userMsg]; });
    setInput("");
    setLoading(true);
    try {
      const roleCtx = role === "teacher" ? "教师用户" : role === "school" ? "学校管理员" : "学生用户";
      const systemPrompt = `你是"小备"，沈阳理工大学装备工程学院的AI思政学习伙伴，专注于兵工文化、国防精神和思政教育。当前用户身份：${roleCtx}。用温暖简洁的语气回应，回复控制在120字以内。`;
      const history = messages.slice(-6).map(function(m) {
        return { role: m.role === "assistant" ? "assistant" : "user", content: m.text };
      });
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer sk-881c1a3f71794c418186d46bd6628167" },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: text.trim() }],
          max_tokens: 250,
          temperature: 0.8
        })
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "小备暂时离线，请稍后再试～";
      setMessages(function(prev) { return [...prev, { role: "assistant", text: reply, id: Date.now() }]; });
    } catch(e) {
      setMessages(function(prev) { return [...prev, { role: "assistant", text: "网络波动，小备暂时离线了～", id: Date.now() }]; });
    }
    setLoading(false);
  }

  const quickQuestions = ["什么是兵工精神？", "北斗系统是怎么建成的？", "军工专业就业方向有哪些？"];

  return (
    <>
      {/* 悬浮按钮 */}
      {!open && (
        <div onClick={function() { setOpen(true); }} style={{
          position: "fixed", bottom: 28, right: 24, zIndex: 999,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          cursor: "pointer", animation: "xb-breathe 3s ease-in-out infinite"
        }}>
          <div style={{ position: "relative" }}>
            <XiaoBei size={56} speaking={false} />
            <div style={{
              position: "absolute", top: -6, right: -6,
              background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
              borderRadius: "50%", width: 20, height: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#fff", fontWeight: 700,
              boxShadow: "0 2px 8px rgba(6,182,212,0.5)"
            }}>💬</div>
          </div>
          <div style={{
            fontSize: 10, color: cyan, fontWeight: 600,
            background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)",
            borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap"
          }}>问小备</div>
        </div>
      )}

      {/* 侧边聊天窗口 */}
      {open && (
        <>
          <div onClick={function() { setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 998, background: "rgba(0,0,0,0.5)" }} />
          <div style={{
            position: "fixed", bottom: 0, right: 0, left: 0, zIndex: 999,
            width: "100%", maxWidth: 480, margin: "0 auto",
            height: "75vh",
            background: dark1, borderRadius: "20px 20px 0 0",
            border: "1px solid rgba(6,182,212,0.3)",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.5)",
            display: "flex", flexDirection: "column",
          animation: "profileGen 0.3s ease both"
        }}>
          {/* 顶栏 */}
          <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(51,65,85,0.4)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <XiaoBei size={32} speaking={loading} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: text1 }}>小备</div>
              <div style={{ fontSize: 10, color: loading ? yellow : cyan }}>
                {loading ? "思考中…" : "● 在线 · DeepSeek驱动"}
              </div>
            </div>
            <button onClick={function() { setOpen(false); }} style={{ background: "transparent", border: "none", color: gray2, fontSize: 18, cursor: "pointer", padding: "4px" }}>✕</button>
          </div>

          {/* 消息区 */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map(function(msg) {
              const isUser = msg.role === "user";
              return (
                <div key={msg.id} style={{ display: "flex", gap: 8, justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-start" }}>
                  {!isUser && <XiaoBei size={24} speaking={false} />}
                  <div style={{
                    maxWidth: "80%", padding: "8px 12px", fontSize: 12.5, lineHeight: 1.75, color: text1,
                    borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                    background: isUser ? "rgba(59,130,246,0.2)" : "rgba(6,182,212,0.08)",
                    border: "1px solid " + (isUser ? "rgba(59,130,246,0.3)" : "rgba(6,182,212,0.2)"),
                    whiteSpace: "pre-wrap"
                  }}>{msg.text}</div>
                </div>
              );
            })}
            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <XiaoBei size={24} speaking={true} />
                <div style={{ padding: "8px 12px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "4px 12px 12px 12px", display: "flex", gap: 4 }}>
                  {[0,1,2].map(function(i) { return <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: cyan, animation: "pulse 1s " + (i*0.2) + "s infinite" }} />; })}
                </div>
              </div>
            )}
            {messages.length === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {quickQuestions.map(function(q) {
                  return (
                    <button key={q} onClick={function() { sendMessage(q); }} style={{
                      textAlign: "left", padding: "7px 12px", borderRadius: 10, fontSize: 11,
                      background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)",
                      color: cyan, cursor: "pointer"
                    }}>{q}</button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 输入区 */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(51,65,85,0.3)", flexShrink: 0, display: "flex", gap: 8 }}>
            <input ref={camInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
              onChange={function(e) { if (e.target.files[0]) handleCameraInput(e.target.files[0]); }} />
            <input ref={camGalleryRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={function(e) { if (e.target.files[0]) handleCameraInput(e.target.files[0]); }} />
            <button onClick={function() { camInputRef.current.click(); }} disabled={imgScanning || loading} style={{
              padding: "8px 10px", borderRadius: 10, fontSize: 16,
              background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)",
              color: cyan, cursor: imgScanning ? "not-allowed" : "pointer", flexShrink: 0,
              opacity: imgScanning ? 0.5 : 1
            }}>📷</button>
            <button onClick={function() { camGalleryRef.current.click(); }} disabled={imgScanning || loading} style={{
              padding: "8px 10px", borderRadius: 10, fontSize: 16,
              background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
              color: "#a78bfa", cursor: imgScanning ? "not-allowed" : "pointer", flexShrink: 0,
              opacity: imgScanning ? 0.5 : 1
            }}>🖼️</button>
            <input
              value={input}
              onChange={function(e) { setInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="问小备任何问题…"
              style={{ flex: 1, padding: "8px 12px", borderRadius: 10, fontSize: 16, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.5)", color: text1, outline: "none" }}
            />
            <button onClick={function() { sendMessage(input); }} disabled={loading || !input.trim()} style={{
              padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: loading || !input.trim() ? "rgba(51,65,85,0.4)" : "linear-gradient(135deg,#3b82f6,#06b6d4)",
              border: "none", color: loading || !input.trim() ? gray2 : "#fff",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer"
            }}>发</button>
          </div>
        </div>
        </>
      )}
    </>
  );
}

export default function App() {
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState(0);

  function handleLogin(r) {
    setRole(r);
    setTab(r === "student" ? 0 : r === "teacher" ? 1 : 2);
  }

  if (!role) return <LoginPage onLogin={handleLogin} />;

  const tabs = ["学生端", "教师端", "学校端"];
  const tabColors = [blue, purple, yellow];

  const roleInfo = {
    student: { icon: "🎓", label: "同学",   sub: "23级 · 武器发射工程", color: blue },
    teacher: { icon: "👨‍🏫", label: "教师",   sub: "装备工程学院",        color: purple },
    school:  { icon: "🏫", label: "管理员", sub: "学校端",              color: yellow },
  }[role];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: dark0 }}>
      {/* Tab栏 + 角色标识 */}
      <div style={{ display: "flex", background: dark1, borderBottom: "1px solid rgba(51,65,85,0.5)", flexShrink: 0, alignItems: "stretch" }}>
        {tabs.map(function (t, i) {
          const active = tab === i;
          return (
            <button key={i} onClick={function () { setTab(i); }} style={{
              flex: 1, padding: "14px 0", fontSize: 14, fontWeight: active ? 700 : 500,
              color: active ? tabColors[i] : gray1,
              background: active ? "rgba(59,130,246,0.08)" : "transparent",
              border: "none", borderBottom: "2px solid " + (active ? tabColors[i] : "transparent"),
              cursor: "pointer"
            }}>{t}</button>
          );
        })}
        {/* 角色标识 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px", borderLeft: "1px solid rgba(51,65,85,0.4)", minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: roleInfo.color + "22", border: "1px solid " + roleInfo.color + "44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{roleInfo.icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: roleInfo.color, whiteSpace: "nowrap" }}>{roleInfo.label}</div>
            <div style={{ fontSize: 9, color: gray2, whiteSpace: "nowrap" }}>{roleInfo.sub}</div>
          </div>
        </div>
        <button onClick={function () { setRole(null); }} style={{ padding: "14px 12px", fontSize: 11, color: gray3, background: "transparent", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap" }}>退出↩</button>
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {tab === 0 && <StudentView />}
        {tab === 1 && <TeacherView />}
        {tab === 2 && <SchoolView />}
      </div>

      {/* 全局悬浮小备 */}
      <XiaoBeiFloat role={role} />
    </div>
  );
}
