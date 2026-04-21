// TODO: DeepSeek接入点
import { useState, useEffect } from "react";
import {
  blue, purple, cyan, green, yellow, red,
  dark0, dark1, dark2, dark3,
  gray1, gray2, gray3, text1, text2,
  getDailyBase, jitter
} from "../constants.js";

// ============================================================
// PieChart - 画像类型分布饼图（含hover/tap）
// ============================================================
function PieChart({ barsVisible }) {
  const [hovered, setHovered] = useState(null);
  const typeData = [
    { code: "GROW",     cn: "成长进行时", count: 72, color: cyan },
    { code: "PERSIST",  cn: "高压坚持型", count: 58, color: yellow },
    { code: "SOLID",    cn: "稳进发展型", count: 44, color: blue },
    { code: "EXPLORE",  cn: "方向探索型", count: 38, color: purple },
    { code: "VALUE",    cn: "价值思辨型", count: 26, color: "#06b6d4" },
    { code: "COLLAB",   cn: "集体凝聚型", count: 21, color: green },
    { code: "RESOURCE", cn: "资源激活型", count: 16, color: "#38bdf8" },
    { code: "GUIDE",    cn: "重点引导型", count: 12, color: red },
  ];
  const total = typeData.reduce(function (s, d) { return s + d.count; }, 0);
  const cx = 80, cy = 80, r = 64, innerR = 30, hoverR = 70;
  let startAngle = -Math.PI / 2;

  function polarToCart(angle, radius) {
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  }
  function slicePath(start, end, outerR, innerRad) {
    const s1 = polarToCart(start, outerR), e1 = polarToCart(end, outerR);
    const s2 = polarToCart(end, innerRad), e2 = polarToCart(start, innerRad);
    const largeArc = (end - start) > Math.PI ? 1 : 0;
    return `M ${s1.x.toFixed(2)} ${s1.y.toFixed(2)} A ${outerR} ${outerR} 0 ${largeArc} 1 ${e1.x.toFixed(2)} ${e1.y.toFixed(2)} L ${s2.x.toFixed(2)} ${s2.y.toFixed(2)} A ${innerRad} ${innerRad} 0 ${largeArc} 0 ${e2.x.toFixed(2)} ${e2.y.toFixed(2)} Z`;
  }

  const slices = typeData.map(function (d) {
    const angle = (d.count / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    const normalPath = slicePath(startAngle, endAngle, r, innerR);
    const hoverPath  = slicePath(startAngle, endAngle, hoverR, innerR - 2);
    const midAngle = startAngle + angle / 2;
    startAngle = endAngle;
    return Object.assign({}, d, { normalPath, hoverPath, pct: Math.round(d.count / total * 100), midAngle });
  });

  const hoveredSlice = hovered !== null ? slices[hovered] : null;

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
        {slices.map(function (s, i) {
          const isHov = hovered === i;
          return (
            <path key={i}
              d={isHov ? s.hoverPath : s.normalPath}
              fill={s.color}
              opacity={barsVisible ? (isHov ? 1 : 0.78) : 0}
              style={{ transition: "opacity 0.8s " + (i * 0.08) + "s ease, d 0.15s ease" }}
              onMouseEnter={function () { setHovered(i); }}
              onMouseLeave={function () { setHovered(null); }}
              onClick={function () { setHovered(hovered === i ? null : i); }}
            />
          );
        })}
        {hoveredSlice ? (
          <>
            <text x={cx} y={cy - 10} textAnchor="middle" fontSize="13" fontWeight="800" fill={hoveredSlice.color}>{hoveredSlice.count}人</text>
            <text x={cx} y={cy + 4}  textAnchor="middle" fontSize="8"  fill={text2}>{hoveredSlice.cn}</text>
            <text x={cx} y={cy + 16} textAnchor="middle" fontSize="9"  fontWeight="700" fill={hoveredSlice.color}>{hoveredSlice.pct}%</text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 6}  textAnchor="middle" fontSize="18" fontWeight="800" fill={text1}>{total}</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8"  fill={gray3}>学生总数</text>
          </>
        )}
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, minWidth: 140 }}>
        {slices.map(function (s, i) {
          const isHov = hovered === i;
          return (
            <div key={s.code}
              onMouseEnter={function () { setHovered(i); }}
              onMouseLeave={function () { setHovered(null); }}
              onClick={function () { setHovered(hovered === i ? null : i); }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 6px", borderRadius: 6, cursor: "pointer", background: isHov ? s.color + "12" : "transparent", transition: "background 0.15s" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0, transform: isHov ? "scale(1.3)" : "scale(1)", transition: "transform 0.15s" }} />
              <div style={{ fontSize: 11, color: isHov ? text1 : text2, flex: 1, fontWeight: isHov ? 600 : 400 }}>{s.cn}</div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>{s.count}人</div>
              <div style={{ fontSize: 10, color: isHov ? s.color : gray2, minWidth: 28, textAlign: "right", fontWeight: isHov ? 700 : 400 }}>{s.pct}%</div>
            </div>
          );
        })}
        <div style={{ fontSize: 10, color: gray2, marginTop: 4, paddingLeft: 6 }}>点击扇形或图例查看详情</div>
      </div>
    </div>
  );
}

// ============================================================
// SchoolView - 学校思政教学数据看板
// ============================================================
export default function SchoolView() {
  const [barsVisible, setBarsVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [base] = useState(getDailyBase);
  const [aiTyping, setAiTyping] = useState(false);
  const [aiText, setAiText] = useState("");

  // 从 localStorage 读取真实学生数据并聚合
  const realStats = (function() {
    try {
      const stored = JSON.parse(localStorage.getItem("bgzh_students") || "[]");
      if (stored.length === 0) return null;
      const tested = stored.length;
      const covered = Math.max(tested, base.covered);
      // 聚合8维平均分
      const dimSums = { PA:0, MP:0, VS:0, CC:0, CT:0, SC:0, CD:0, IR:0 };
      stored.forEach(function(s) {
        if (s.profile && s.profile.raw) {
          Object.keys(dimSums).forEach(function(d) {
            dimSums[d] += (s.profile.raw[d] || 0);
          });
        }
      });
      const dimAvg = {};
      Object.keys(dimSums).forEach(function(d) {
        dimAvg[d] = Math.round(dimSums[d] / tested * 10) / 10;
      });
      return { tested, covered, dimAvg, interactions: base.interactions + tested * 3 };
    } catch(e) { return null; }
  })();

  const dynBase = refreshKey === 0 ? base : {
    covered:      jitter(base.covered, 0.03),
    tested:       jitter(base.tested, 0.03),
    interactions: jitter(base.interactions, 0.05),
  };

  const displayTested = realStats ? realStats.tested + base.tested : dynBase.tested;
  const displayCovered = realStats ? realStats.covered : dynBase.covered;
  const displayInteractions = realStats ? realStats.interactions : dynBase.interactions;

  const stats = [
    { label: "覆盖学生", value: displayCovered + "人",      icon: "👥" },
    { label: "完成测评", value: displayTested + "人",       icon: "📋" },
    { label: "累计互动", value: displayInteractions + "次", icon: "💬" },
    { label: "案例覆盖", value: "5/5",                      icon: "📄" },
  ];

  useEffect(function () {
    const t = setTimeout(function () { setBarsVisible(true); }, 400);
    const t2 = setTimeout(function () { fetchAiAdvice(); }, 800);
    return function () { clearTimeout(t); clearTimeout(t2); };
  }, []);

  async function fetchAiAdvice() {
    setAiTyping(true);
    setAiText("DeepSeek 正在分析全院数据…");
    try {
      const dimData = realStats ? Object.entries(realStats.dimAvg).map(([k,v]) => `${k}:${v}`).join("、") : "专业认同度7.1、使命感知度7.4、价值定力5.6、集体协同感6.5、思辨开放度4.8、报国信心6.3、职业方向感5.4、思政资源感知5.9";
      const prompt = `你是一位高校思政教育数据分析专家。请根据以下学院数据生成简洁的决策建议（200字以内，直接给结论和建议）：
八维画像均值：${dimData}
学生总数：${displayCovered}人，完成测评：${displayTested}人，累计互动：${displayInteractions}次
主要短板：思辨开放度和职业方向感`;
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer sk-881c1a3f71794c418186d46bd6628167" },
        body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], max_tokens: 400, temperature: 0.7 })
      });
      const data = await res.json();
      const advice = data.choices?.[0]?.message?.content || "暂时无法生成分析，请点击刷新重试。";
      setAiText("");
      let i = 0;
      const id = setInterval(function () {
        i++;
        setAiText(advice.slice(0, i));
        if (i >= advice.length) { clearInterval(id); setAiTyping(false); }
      }, 18);
    } catch (e) {
      setAiText("网络波动，暂时无法生成AI分析。请点击刷新重试。");
      setAiTyping(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    setBarsVisible(false);
    setTimeout(function () {
      setRefreshing(false);
      setRefreshKey(function (k) { return k + 1; });
      setBarsVisible(true);
      fetchAiAdvice();
    }, 1000);
  }

  const groupDims = [
    { dim: "PA", name: "专业认同度",   score: 7.1, level: "中高", color: green,  text: "学院学生整体专业认同度较高，武器装备方向情感连接稳固。" },
    { dim: "MP", name: "使命感知度",   score: 7.4, level: "高",   color: green,  text: "对国防使命的认同度位居八维之首，体现院校特色与教育成效。" },
    { dim: "VS", name: "价值定力",     score: 5.6, level: "中",   color: yellow, text: "面对复杂信息环境，部分学生的价值判断稳定性仍有提升空间。" },
    { dim: "CC", name: "集体协同感",   score: 6.5, level: "中",   color: yellow, text: "整体集体协同意识良好,但工程化的协同方法论训练可加强。" },
    { dim: "CT", name: "思辨开放度",   score: 4.8, level: "中低", color: red,    text: "思辨开放度是当前八维短板,学生在公开讨论中表达意愿偏弱。" },
    { dim: "SC", name: "报国信心",     score: 6.3, level: "中",   color: yellow, text: "整体报国信心稳定,但部分学生仍对自身贡献能力持保留态度。" },
    { dim: "CD", name: "职业方向感",   score: 5.4, level: "中低", color: red,    text: "职业方向感是当前八维另一短板,需加强生涯规划与就业引导。" },
    { dim: "IR", name: "思政资源感知", score: 5.9, level: "中",   color: yellow, text: "学生对学校思政资源的感知和使用率仍有提升空间。" },
  ];

  const classes = [
    { name: "23级武器发射1班", students: 38, participation: 92, profile: "高压坚持型为主", trend: "+9" },
    { name: "23级武器发射2班", students: 40, participation: 89, profile: "稳进发展型为主", trend: "+7" },
    { name: "23级装甲车辆班",  students: 35, participation: 76, profile: "方向探索型偏多", trend: "+4" },
    { name: "24级武器发射1班", students: 42, participation: 84, profile: "成长进行时型",   trend: "+6" },
  ];

  const topics = [
    { topic: "科技自立自强", heat: 94, color: "#ef4444" },
    { topic: "工匠精神",     heat: 81, color: "#f97316" },
    { topic: "集体主义",     heat: 76, color: yellow },
    { topic: "历史使命",     heat: 68, color: green },
    { topic: "爱国主义",     heat: 87, color: blue },
  ];

  // 折线图数据
  const weeks = ["第1周", "第2周", "第3周", "第4周"];
  const lines = [
    { label: "23级武发1班", data: [71, 78, 85, 92], color: blue },
    { label: "23级武发2班", data: [68, 74, 82, 89], color: cyan },
    { label: "23级装甲班",  data: [55, 60, 68, 76], color: yellow },
    { label: "24级武发1班", data: [62, 70, 77, 84], color: purple },
  ];
  const W = 320, H = 120, padL = 8, padR = 8, padT = 8, padB = 24;
  const minV = 50, maxV = 100;
  function xPos(i) { return padL + (i / (weeks.length - 1)) * (W - padL - padR); }
  function yPos(v) { return padT + (1 - (v - minV) / (maxV - minV)) * (H - padT - padB); }

  return (
    <div style={{ background: dark0, minHeight: "100%", color: text1 }}>
      {/* 顶栏 */}
      <div style={{ background: "linear-gradient(135deg," + dark1 + "," + dark3 + ")", borderBottom: "1px solid rgba(234,179,8,0.2)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#eab308,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: dark1 }}>校</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>学校思政教学数据看板</div>
          <div style={{ fontSize: 11, color: gray1, marginTop: 2 }}>装备工程学院 · 2025-2026学年春季学期</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: yellow }}>实时</span>
          <button onClick={handleRefresh} disabled={refreshing} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", color: yellow, cursor: refreshing ? "not-allowed" : "pointer", opacity: refreshing ? 0.6 : 1 }}>
            {refreshing ? "刷新中…" : "↻ 刷新"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 16px" }}>

        {/* 4项统计卡片 — 增强版 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { ...stats[0], color: cyan,   glow: "rgba(6,182,212,0.2)" },
            { ...stats[1], color: green,  glow: "rgba(34,197,94,0.2)" },
            { ...stats[2], color: blue,   glow: "rgba(59,130,246,0.2)" },
            { ...stats[3], color: yellow, glow: "rgba(234,179,8,0.2)" },
          ].map(function (s, i) {
            return (
              <div key={i} style={{ background: "linear-gradient(135deg," + dark2 + "," + s.color + "0a)", borderRadius: 14, padding: "18px 16px", textAlign: "center", border: "1px solid " + s.color + "33", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -15, right: -15, width: 70, height: 70, borderRadius: "50%", background: "radial-gradient(circle," + s.glow + " 0%,transparent 70%)" }} />
                <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
                <div key={refreshKey + "-" + i} style={{ fontSize: 22, fontWeight: 800, color: s.color, animation: refreshing ? "pulse 0.4s ease" : refreshKey > 0 ? "fadeSlideUp 0.4s ease both" : "none" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: gray2, marginTop: 6, fontWeight: 600 }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* 八维群体画像 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: text1, marginBottom: 10, fontWeight: 700 }}>八维群体思政画像</div>
          <div style={{ background: dark2, borderRadius: 14, border: "1px solid rgba(51,65,85,0.4)", padding: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {groupDims.map(function (d, i) {
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 110, flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: text1 }}>{d.name}</div>
                      <div style={{ fontSize: 10, color: d.color, fontWeight: 600 }}>{d.dim} · {d.level}</div>
                    </div>
                    <div style={{ flex: 1, height: 24, background: "rgba(30,41,59,0.6)", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: barsVisible ? (d.score / 8 * 100) + "%" : "0%", background: "linear-gradient(90deg," + d.color + "88," + d.color + ")", borderRadius: 8, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1) " + (i * 0.08) + "s", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10, boxSizing: "border-box", boxShadow: barsVisible ? "0 0 10px " + d.color + "55" : "none" }}>
                        {barsVisible && <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{d.score}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(239,68,68,0.06)", borderRadius: 8, fontSize: 12, color: gray3, lineHeight: 1.7, border: "1px solid rgba(239,68,68,0.15)" }}>
              <span style={{ color: red, fontWeight: 700 }}>★ 重点关注:</span> 思辨开放度 (4.8)、职业方向感 (5.4) 是当前八维的两个明显短板，建议作为下学期教学重点。
            </div>
          </div>
        </div>

        {/* 班级分布表 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: gray1, marginBottom: 10, fontWeight: 600 }}>班级思政画像分布</div>
          <div style={{ background: dark2, borderRadius: 14, border: "1px solid rgba(51,65,85,0.4)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 600 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 60px 90px 2fr 60px", padding: "10px 18px", background: "rgba(30,41,59,0.6)", fontSize: 11, color: gray1, fontWeight: 600 }}>
                  <span>班级</span><span style={{ textAlign: "center" }}>人数</span><span style={{ textAlign: "center" }}>参与率</span><span style={{ paddingLeft: 8 }}>主导画像类型</span><span style={{ textAlign: "center" }}>趋势</span>
                </div>
                {classes.map(function (c, i) {
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 60px 90px 2fr 60px", padding: "12px 18px", borderTop: "1px solid rgba(51,65,85,0.3)", fontSize: 12, alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      <span style={{ textAlign: "center", color: gray3 }}>{c.students}</span>
                      <span style={{ textAlign: "center" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 8, background: c.participation > 85 ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)", color: c.participation > 85 ? green : yellow, fontSize: 11, fontWeight: 600 }}>{c.participation}%</span>
                      </span>
                      <span style={{ paddingLeft: 8, color: cyan, fontSize: 11 }}>{c.profile}</span>
                      <span style={{ textAlign: "center", color: green, fontWeight: 600, fontSize: 11 }}>{c.trend}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 饼图 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: gray1, marginBottom: 10, fontWeight: 600 }}>学生思政画像类型分布</div>
          <div style={{ background: dark2, borderRadius: 14, border: "1px solid rgba(51,65,85,0.4)", padding: "16px 18px" }}>
            <PieChart barsVisible={barsVisible} />
          </div>
        </div>

        {/* 折线图 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: gray1, marginBottom: 10, fontWeight: 600 }}>近4周系统参与率趋势</div>
          <div style={{ background: dark2, borderRadius: 14, border: "1px solid rgba(51,65,85,0.4)", padding: "16px 18px" }}>
            <div style={{ overflowX: "auto" }}>
              <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", minWidth: 280 }}>
                {[60, 70, 80, 90, 100].map(v => (
                  <g key={v}>
                    <line x1={padL} y1={yPos(v)} x2={W - padR} y2={yPos(v)} stroke="rgba(100,116,139,0.15)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x={padL - 2} y={yPos(v) + 4} fontSize="7" fill="#475569" textAnchor="end">{v}%</text>
                  </g>
                ))}
                {weeks.map((w, i) => (
                  <text key={i} x={xPos(i)} y={H - 4} fontSize="8" fill="#64748b" textAnchor="middle">{w}</text>
                ))}
                {lines.map(function (line) {
                  const pts = line.data.map((v, i) => `${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`).join(" ");
                  return (
                    <g key={line.label}>
                      <polyline points={pts} fill="none" stroke={line.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
                        style={{ animation: barsVisible ? "fadeIn 1s ease both" : "none", opacity: barsVisible ? 1 : 0 }} />
                      {line.data.map((v, i) => (
                        <g key={i}>
                          <circle cx={xPos(i)} cy={yPos(v)} r="5" fill="transparent" stroke="transparent" />
                          <circle cx={xPos(i)} cy={yPos(v)} r="3" fill={line.color} stroke="#111827" strokeWidth="1.5"
                            style={{ animation: barsVisible ? `fadeIn 1s ${i * 0.15}s ease both` : "none", opacity: barsVisible ? 1 : 0 }}>
                            <title>{line.label} · {weeks[i]}：{v}%</title>
                          </circle>
                        </g>
                      ))}
                    </g>
                  );
                })}
              </svg>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                {lines.map(function (line) {
                  return (
                    <div key={line.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 16, height: 2, background: line.color, borderRadius: 1 }} />
                      <span style={{ fontSize: 10, color: gray3 }}>{line.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 主题热度 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: gray1, marginBottom: 10, fontWeight: 600 }}>思政主题参与热度</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topics.map(function (tp, i) {
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, width: 90, flexShrink: 0 }}>{tp.topic}</span>
                  <div style={{ flex: 1, height: 24, background: "rgba(30,41,59,0.6)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: barsVisible ? tp.heat + "%" : "0%", background: tp.color, borderRadius: 6, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1) " + (i * 0.1) + "s", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, boxSizing: "border-box" }}>
                      {barsVisible && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{tp.heat}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI实时分析 */}
        <div style={{ background: "rgba(234,179,8,0.06)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(234,179,8,0.2)", marginBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span>📊</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: yellow }}>DeepSeek · 数据驱动AI实时分析</span>
            {aiTyping && <span style={{ fontSize: 10, color: yellow, animation: "pulse 0.8s infinite", marginLeft: 4 }}>分析中…</span>}
          </div>
          <div style={{ fontSize: 13, color: text2, lineHeight: 1.85, minHeight: 60 }}>
            {aiText || <span style={{ color: gray2, animation: "pulse 1s infinite" }}>AI正在分析全院数据…</span>}
            {aiTyping && <span style={{ animation: "pulse 0.6s infinite" }}>▍</span>}
          </div>
        </div>

      </div>
    </div>
  );
}
