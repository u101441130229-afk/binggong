// TODO: DeepSeek接入点
import { useState, useEffect } from "react";
import {
  blue, cyan, green, yellow, red, purple,
  dark0, dark1, dark2, dark3,
  gray1, gray2, gray3, text1, text2,
  DIMS, CASES, CASE_ORDER, CASE_LINKS, dimMeta
} from "../constants.js";
import XiaoBei from "./XiaoBei.jsx";
import { useTyping, FadeIn } from "../utils.jsx";

// ====================== 小备回应预设 ======================
const Q_RESPONSES = {
  beidou: [
    "你触到了关键——资源不是成功的前提，路径选择才是。陈芳允选择双星，不是因为条件好，恰恰是因为条件不够好。这是'在约束里找创造力'而不是'等条件够了再出发'。",
    "你说的这个场景，其实是工程学习最真实的日常。条件不足时能出发，靠的不是勇气，是对'最小可行方案'的判断力——先找到一个能开始的入口，再边走边完善。",
    "26年的接力，靠的不是某个人的热情，是制度性的信念——国家战略需求本身就是一种长期承诺。你认同这种'因为国家需要，所以我们做'的逻辑吗？"
  ],
  df41: [
    "你说到了核心悖论：最强大的武器，存在的意义是让自己永远不被使用。这种'实力与克制'的逻辑，在个人层面有没有类似的体验？",
    "隐姓埋名几十年，支撑他们的不是外部认可，而是内部的价值确认——'我知道我在做什么，我知道它的价值'。这和你理解的'意义感'一样吗？",
    "半个世纪的政策定力，在外部压力持续变化的今天显得尤其不易。你觉得一个国家怎样才能做到这种程度的'战略稳定'？"
  ],
  j20: [
    "借鉴和原创的边界，其实是'理解之后再超越'。先真正消化别人的逻辑，再在此基础上做出自己的判断——你觉得这个顺序重要吗？",
    "6年从首飞到列装，背后是无数人同时解决不同子问题的并行工程。你认为'集中力量办大事'和'分布式创新'各自的适用边界在哪里？",
    "技术自主和国际合作不是非此即彼——北斗也有部分国际合作，歼-20也参考了公开资料。关键是'合作的边界在哪里'。你怎么划这条线？"
  ],
  fujian: [
    "技术往往比流程好解决，因为技术有标准答案，流程涉及人的协调。你在团队合作里，遇到的最难的'看不见的部分'是什么？",
    "大协同需要的是'让每个专业都看到整体'的能力。你认为工程师需要懂多少'自己专业以外的东西'？",
    "每个环节都关键意味着每个环节都是潜在的失效点。工程伦理的核心是：在交付压力下，你能不能说出'这还不够好'？你有过这样的时刻吗？"
  ],
  tank99a: [
    "慢但稳的路径适合复杂系统，快速颠覆适合技术窗口期短的领域。坦克工业是前者——你觉得你未来想走的方向，更接近哪种节奏？",
    "信息力的融入意味着99A不再只是一辆坦克，而是一个信息节点。你所在的专业，有没有类似'加入数字化维度之后变成完全不同的东西'的案例？",
    "两代总师的接力，意味着毛明首先要真正理解祝榆生的工作，才能在此基础上创新。你现在的学习，有多少是在为'真正理解前人'做准备？"
  ]
};

// ====================== 引导问题交互组件 ======================
function QuestionBlock({ index, question, caseId }) {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showResp, setShowResp] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function handleSubmit() {
    if (!input.trim() || submitted) return;
    setSubmitted(true);
    setTimeout(function () { setShowResp(true); }, 500);
  }

  const response = (Q_RESPONSES[caseId] || [])[index] || "你的思考很有价值。带着这个问题继续看下去，会有新的发现。";

  return (
    <div style={{ borderRadius: 10, background: "rgba(6,182,212,0.04)", border: "1px solid " + (submitted ? "rgba(34,197,94,0.2)" : "rgba(6,182,212,0.15)"), overflow: "hidden", transition: "border-color 0.3s" }}>
      <div style={{ padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}
        onClick={function () { setExpanded(!expanded); }}>
        <span style={{ color: submitted ? green : cyan, fontWeight: 700, flexShrink: 0, fontSize: 13 }}>Q{index + 1}</span>
        <span style={{ fontSize: 13, lineHeight: 1.75, color: submitted ? text2 : gray3, flex: 1 }}>{question}</span>
        <span style={{ color: gray2, fontSize: 11, flexShrink: 0, marginTop: 2 }}>{submitted ? "✓" : expanded ? "▲" : "▼"}</span>
      </div>
      {(expanded || submitted) && (
        <div style={{ padding: "0 14px 12px", borderTop: "1px solid rgba(51,65,85,0.2)" }}>
          {!submitted ? (
            <div style={{ paddingTop: 10 }}>
              <textarea
                value={input}
                onChange={function (e) { setInput(e.target.value); }}
                placeholder="写下你的第一反应，几句话就够…"
                rows={2}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.4)", color: text1, fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
              />
              <button onClick={handleSubmit} disabled={!input.trim()}
                style={{ marginTop: 6, padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: input.trim() ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "rgba(51,65,85,0.4)", border: "none", color: input.trim() ? "#fff" : gray2, cursor: input.trim() ? "pointer" : "not-allowed" }}>
                提交思考
              </button>
            </div>
          ) : (
            <div style={{ paddingTop: 10 }}>
              <div style={{ padding: "8px 10px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8, fontSize: 12, color: text2, lineHeight: 1.65, marginBottom: 8 }}>{input}</div>
              {showResp && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", animation: "fadeSlideUp 0.3s ease both" }}>
                  <XiaoBei size={24} speaking={false} />
                  <div style={{ flex: 1, padding: "8px 10px", background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: "4px 8px 8px 8px", fontSize: 12, color: text1, lineHeight: 1.7 }}>{response}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ====================== 知识图谱可视化组件 ======================
function KnowledgeGraph({ caseId, onClose }) {
  const cur = CASES[caseId];
  const [hoveredNode, setHoveredNode] = useState(null);

  const graphData = {
    beidou: {
      center: { id: "case", label: "北斗系统", color: cyan, x: 200, y: 160 },
      nodes: [
        { id: "p1", label: "陈芳允", color: "#38bdf8", x: 80,  y: 60,  type: "人物" },
        { id: "p2", label: "孙家栋", color: "#38bdf8", x: 320, y: 60,  type: "人物" },
        { id: "p3", label: "杨长风", color: "#38bdf8", x: 200, y: 30,  type: "人物" },
        { id: "s1", label: "科技自立自强", color: green, x: 60,  y: 220, type: "精神" },
        { id: "s2", label: "迭代式成长",   color: green, x: 340, y: 220, type: "精神" },
        { id: "s3", label: "战略定力",     color: green, x: 200, y: 270, type: "精神" },
        { id: "d1", label: "PA 专业认同",  color: yellow, x: 70,  y: 300, type: "维度" },
        { id: "d2", label: "MP 使命感知",  color: yellow, x: 330, y: 300, type: "维度" },
        { id: "d3", label: "SC 报国信心",  color: yellow, x: 200, y: 330, type: "维度" },
      ],
      edges: [["case","p1"],["case","p2"],["case","p3"],["case","s1"],["case","s2"],["case","s3"],["s1","d1"],["s2","d3"],["s3","d2"]]
    },
    df41: {
      center: { id: "case", label: "东风-41", color: red, x: 200, y: 160 },
      nodes: [
        { id: "s1", label: "战略威慑",   color: green, x: 80,  y: 60,  type: "精神" },
        { id: "s2", label: "战略定力",   color: green, x: 320, y: 60,  type: "精神" },
        { id: "s3", label: "长期主义",   color: green, x: 200, y: 40,  type: "精神" },
        { id: "s4", label: "无名坚守",   color: green, x: 60,  y: 220, type: "精神" },
        { id: "d1", label: "VS 价值定力", color: yellow, x: 340, y: 220, type: "维度" },
        { id: "d2", label: "SC 报国信心", color: yellow, x: 120, y: 290, type: "维度" },
        { id: "d3", label: "MP 使命感知", color: yellow, x: 280, y: 290, type: "维度" },
        { id: "c1", label: "核政策",     color: "#f87171", x: 200, y: 290, type: "概念" },
      ],
      edges: [["case","s1"],["case","s2"],["case","s3"],["case","s4"],["s2","d1"],["s3","d2"],["s1","c1"],["c1","d3"],["s4","d2"]]
    },
    j20: {
      center: { id: "case", label: "歼-20", color: blue, x: 200, y: 160 },
      nodes: [
        { id: "p1", label: "杨伟",        color: "#38bdf8", x: 200, y: 40,  type: "人物" },
        { id: "s1", label: "科技自立自强", color: green, x: 60,  y: 100, type: "精神" },
        { id: "s2", label: "原创设计",    color: green, x: 340, y: 100, type: "精神" },
        { id: "s3", label: "从跟跑到并跑", color: green, x: 60,  y: 240, type: "精神" },
        { id: "d1", label: "PA 专业认同", color: yellow, x: 340, y: 240, type: "维度" },
        { id: "d2", label: "CD 职业方向", color: yellow, x: 120, y: 310, type: "维度" },
        { id: "d3", label: "SC 报国信心", color: yellow, x: 280, y: 310, type: "维度" },
        { id: "c1", label: "技术封锁",   color: "#f97316", x: 200, y: 290, type: "概念" },
      ],
      edges: [["case","p1"],["case","s1"],["case","s2"],["case","s3"],["s1","d1"],["s3","d2"],["s2","d3"],["c1","s1"],["p1","s2"]]
    },
    fujian: {
      center: { id: "case", label: "福建舰", color: purple, x: 200, y: 160 },
      nodes: [
        { id: "p1", label: "田伟",       color: "#38bdf8", x: 100, y: 50,  type: "人物" },
        { id: "p2", label: "雷凡培",     color: "#38bdf8", x: 300, y: 50,  type: "人物" },
        { id: "s1", label: "体系胜利",   color: green, x: 55,  y: 210, type: "精神" },
        { id: "s2", label: "集体协同",   color: green, x: 345, y: 210, type: "精神" },
        { id: "s3", label: "工程系统观", color: green, x: 200, y: 270, type: "精神" },
        { id: "d1", label: "CC 集体协同", color: yellow, x: 80,  y: 310, type: "维度" },
        { id: "d2", label: "MP 使命感知", color: yellow, x: 320, y: 310, type: "维度" },
        { id: "c1", label: "电磁弹射",   color: "#a855f7", x: 200, y: 55,  type: "概念" },
      ],
      edges: [["case","p1"],["case","p2"],["case","s1"],["case","s2"],["case","s3"],["s2","d1"],["s1","d2"],["s3","d1"],["c1","s3"],["p1","s3"]]
    },
    tank99a: {
      center: { id: "case", label: "99A坦克", color: yellow, x: 200, y: 160 },
      nodes: [
        { id: "p1", label: "祝榆生",     color: "#38bdf8", x: 100, y: 50,  type: "人物" },
        { id: "p2", label: "毛明",       color: "#38bdf8", x: 300, y: 50,  type: "人物" },
        { id: "s1", label: "工匠精神",   color: green, x: 55,  y: 210, type: "精神" },
        { id: "s2", label: "迭代成长",   color: green, x: 345, y: 210, type: "精神" },
        { id: "s3", label: "代际传承",   color: green, x: 200, y: 270, type: "精神" },
        { id: "d1", label: "PA 专业认同", color: yellow, x: 80,  y: 310, type: "维度" },
        { id: "d2", label: "CD 职业方向", color: yellow, x: 200, y: 330, type: "维度" },
        { id: "d3", label: "SC 报国信心", color: yellow, x: 320, y: 310, type: "维度" },
      ],
      edges: [["case","p1"],["case","p2"],["case","s1"],["case","s2"],["case","s3"],["s1","d1"],["s2","d2"],["s3","d3"],["p1","s3"],["p2","s3"]]
    },
  };

  const graph = graphData[caseId] || graphData.beidou;
  const allNodes = [graph.center, ...graph.nodes];
  const nodeMap = {};
  allNodes.forEach(function (n) { nodeMap[n.id] = n; });
  const typeLabels = { "人物": "👤", "精神": "✦", "维度": "◈", "概念": "◉" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 480, background: dark1, borderRadius: 20, border: "1px solid rgba(6,182,212,0.3)", overflow: "hidden", animation: "profileGen 0.4s ease both" }}
        onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(51,65,85,0.4)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: cyan }}>🕸 知识图谱 · {cur.title}</div>
            <div style={{ fontSize: 10, color: gray2, marginTop: 2 }}>案例 → 人物 → 精神内核 → 思政维度</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: gray2, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "8px 0" }}>
          <svg width="100%" viewBox="0 0 400 370" style={{ display: "block" }}>
            {graph.edges.map(function ([from, to], i) {
              const fn = nodeMap[from], tn = nodeMap[to];
              if (!fn || !tn) return null;
              const isActive = hoveredNode === from || hoveredNode === to;
              return <line key={i} x1={fn.x} y1={fn.y} x2={tn.x} y2={tn.y} stroke={isActive ? cyan : "rgba(100,116,139,0.3)"} strokeWidth={isActive ? 1.5 : 1} strokeDasharray={isActive ? "none" : "4 3"} style={{ transition: "all 0.2s" }} />;
            })}
            {allNodes.map(function (node) {
              const isCenter = node.id === "case";
              const isHov = hoveredNode === node.id;
              const r = isCenter ? 30 : 20;
              const label = node.label;
              const line1 = label.length > 4 ? label.slice(0, Math.ceil(label.length / 2)) : label;
              const line2 = label.length > 4 ? label.slice(Math.ceil(label.length / 2)) : "";
              return (
                <g key={node.id} style={{ cursor: "pointer" }}
                  onMouseEnter={function () { setHoveredNode(node.id); }}
                  onMouseLeave={function () { setHoveredNode(null); }}
                  onClick={function () { setHoveredNode(hoveredNode === node.id ? null : node.id); }}>
                  <circle cx={node.x} cy={node.y} r={isHov ? r + 4 : r} fill={node.color + (isCenter ? "33" : "22")} stroke={node.color} strokeWidth={isCenter ? 2.5 : 1.5} style={{ transition: "all 0.2s" }} />
                  {!isCenter && <text x={node.x} y={node.y - r - 4} textAnchor="middle" fontSize="8" fill={gray3}>{typeLabels[node.type] || ""}</text>}
                  {line2 ? (
                    <>
                      <text x={node.x} y={node.y + (isCenter ? 0 : -2)} textAnchor="middle" fontSize={isCenter ? 11 : 9} fontWeight={isCenter ? 700 : 600} fill={isHov ? "#fff" : node.color}>{line1}</text>
                      <text x={node.x} y={node.y + (isCenter ? 13 : 9)} textAnchor="middle" fontSize={isCenter ? 11 : 9} fontWeight={isCenter ? 700 : 600} fill={isHov ? "#fff" : node.color}>{line2}</text>
                    </>
                  ) : (
                    <text x={node.x} y={node.y + (isCenter ? 5 : 4)} textAnchor="middle" fontSize={isCenter ? 11 : 9} fontWeight={isCenter ? 700 : 600} fill={isHov ? "#fff" : node.color}>{label}</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <div style={{ padding: "10px 18px 16px", borderTop: "1px solid rgba(51,65,85,0.3)", minHeight: 44 }}>
          {hoveredNode ? (
            <div style={{ fontSize: 12, color: text2, animation: "fadeIn 0.2s ease both" }}>
              <span style={{ color: nodeMap[hoveredNode]?.color, fontWeight: 700 }}>{nodeMap[hoveredNode]?.label}</span>
              {nodeMap[hoveredNode]?.type && <span style={{ color: gray3 }}> · {nodeMap[hoveredNode].type}</span>}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: gray2 }}>点击节点查看详情 · 点击空白关闭</div>
          )}
          <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
            {[["👤 人物", "#38bdf8"], ["✦ 精神内核", green], ["◈ 思政维度", yellow], ["◉ 核心概念", "#f97316"]].map(function ([label, color]) {
              return <span key={label} style={{ fontSize: 10, color: color }}>{label}</span>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CaseStudyView - 案例智能学习页
// ============================================================
export default function CaseStudyView({ caseId, learnedCases = [], onComplete, onBack, onSwitchCase, onOpenChat, onRetake }) {
  const cur = CASES[caseId];
  const [phase, setPhase] = useState(1);
  const [agentStep, setAgentStep] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [graphNodes] = useState(2800 + Math.floor(Math.random() * 100));
  const [typedContent, contentDone] = useTyping(cur.content, 10, phase === 2);

  useEffect(function () {
    setPhase(1); setAgentStep(0);
    const t1 = setTimeout(function () { setAgentStep(1); }, 600);
    const t2 = setTimeout(function () { setAgentStep(2); }, 1300);
    const t3 = setTimeout(function () { setAgentStep(3); }, 2000);
    const t4 = setTimeout(function () { setAgentStep(4); }, 2700);
    const t5 = setTimeout(function () { setPhase(2); }, 3100);
    return function () { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [caseId]);

  const agents = [
    { name: "案例检索 Agent", desc: "GraphRAG · 知识图谱多跳检索", icon: "🔍" },
    { name: "思政映射 Agent", desc: "语义空间对齐 · 价值目标匹配", icon: "🔗" },
    { name: "引导提问 Agent", desc: "苏格拉底式提问 · 引导问题序列", icon: "💡" },
    { name: "效果评估 Agent", desc: "行为数据采集 · 学习画像更新",   icon: "📊" },
  ];

  return (
    <div style={{ background: dark0, minHeight: "100%", color: text1 }}>
      <div style={{ background: "linear-gradient(135deg," + dark1 + "," + dark3 + ")", borderBottom: "1px solid rgba(59,130,246,0.2)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>兵</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>兵工案例 · 智能学习</div>
          <div style={{ fontSize: 11, color: gray1, marginTop: 2 }}>当前案例:{cur.name}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={function () { setShowGraph(true); }} style={{ fontSize: 10, color: cyan, padding: "4px 10px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 999, cursor: "pointer", fontWeight: 600 }}>🕸 知识图谱</button>
          <span style={{ fontSize: 11, color: gray3 }}><span style={{ color: green }}>{graphNodes}</span>节点</span>
        </div>
      </div>

      {showGraph && <KnowledgeGraph caseId={caseId} onClose={function () { setShowGraph(false); }} />}

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 16px" }}>
        {/* 案例切换 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: gray1 }}>切换案例:</span>
          {phase === 1 && <span style={{ fontSize: 11, color: yellow, animation: "pulse 1s infinite" }}>加载中，请稍候…</span>}
          {CASE_ORDER.map(function (id) {
            const c = CASES[id];
            const active = caseId === id;
            const disabled = phase === 1 && !active;
            return (
              <button key={id} onClick={function () { if (!disabled) onSwitchCase(id); }} disabled={disabled} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1, background: active ? "rgba(59,130,246,0.2)" : "rgba(30,41,59,0.6)", border: "1px solid " + (active ? "rgba(59,130,246,0.5)" : "rgba(51,65,85,0.4)"), color: active ? "#60a5fa" : gray1, transition: "opacity 0.3s" }}>{c.name}</button>
            );
          })}
        </div>

        {/* 多Agent工作流 */}
        {phase === 1 && (
          <FadeIn keyProp={"agents-" + caseId}>
            <div style={{ marginTop: 36 }}>
              <div style={{ fontSize: 14, color: gray1, marginBottom: 20, textAlign: "center" }}>多Agent工作流执行中…</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {agents.map(function (a, i) {
                  const active = agentStep > i;
                  const current = agentStep === i + 1;
                  const isLast = i === agents.length - 1;
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderRadius: 12, background: current ? "rgba(59,130,246,0.15)" : active ? "rgba(34,197,94,0.08)" : "rgba(30,41,59,0.6)", border: "1px solid " + (current ? "rgba(59,130,246,0.4)" : active ? "rgba(34,197,94,0.2)" : "rgba(51,65,85,0.4)"), transition: "all 0.4s" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: active ? "rgba(34,197,94,0.2)" : current ? "rgba(59,130,246,0.25)" : "rgba(30,41,59,0.8)", border: "2px solid " + (active ? green : current ? blue : "#334155"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "all 0.4s" }}>
                          {active ? <span style={{ color: green, fontSize: 13 }}>✓</span> : <span style={{ fontSize: 15 }}>{a.icon}</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: active ? text1 : gray1 }}>{a.name}</div>
                          <div style={{ fontSize: 12, color: gray3, marginTop: 2 }}>{a.desc}</div>
                        </div>
                        <div style={{ fontSize: 11, color: active ? green : current ? blue : "#334155", fontWeight: 600 }}>{active ? "✓ 完成" : current ? "执行中…" : "等待"}</div>
                      </div>
                      {!isLast && (
                        <div style={{ display: "flex", alignItems: "center", paddingLeft: 34, height: 24 }}>
                          <div style={{ width: 2, height: "100%", background: active ? "rgba(34,197,94,0.5)" : "rgba(51,65,85,0.4)", margin: "0 15px", transition: "background 0.4s", position: "relative" }}>
                            {active && <div style={{ position: "absolute", bottom: -4, left: -4, width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "7px solid rgba(34,197,94,0.6)" }} />}
                          </div>
                          <div style={{ fontSize: 10, color: active ? "rgba(34,197,94,0.6)" : "rgba(51,65,85,0.5)", marginLeft: 4 }}>{active ? "→ 数据流转" : ""}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: gray3 }}>DAG调度 · 节点 {agentStep}/4 · 预计 3s</div>
              <div style={{ marginTop: 8, padding: "6px 14px", background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.3)", borderRadius: 8, textAlign: "center", fontSize: 11, color: gray3 }}>
                ⓘ 原型演示阶段 · 多Agent工作流为技术路线示意，实际核心能力由 Coze 智能体承载
              </div>
            </div>
          </FadeIn>
        )}

        {/* 案例展示 */}
        {phase === 2 && (
          <FadeIn keyProp={"result-" + caseId}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {["案例检索", "思政映射", "引导提问", "效果评估"].map(function (n, i) {
                return <div key={i} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: green }}>✓ {n} Agent</div>;
              })}
              <div style={{ marginLeft: "auto", fontSize: 11, color: gray3 }}>响应耗时 2.7s · 检索路径深度 3跳</div>
            </div>

            {/* 小备讲解 */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 12, marginBottom: 14 }}>
              <XiaoBei size={56} speaking={true} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: cyan, fontWeight: 600, marginBottom: 4 }}>小备讲解</div>
                <div style={{ fontSize: 13, color: text2, lineHeight: 1.7 }}>这是 {cur.title} 的故事。讲完之后,我会和你一起,从三个角度展开思考。</div>
              </div>
            </div>

            {/* 案例正文 */}
            <div style={{ background: dark2, borderRadius: 14, border: "1px solid rgba(59,130,246,0.15)", overflow: "hidden", marginBottom: 14 }}>
              <div style={{ padding: "14px 18px", background: "rgba(59,130,246,0.08)", borderBottom: "1px solid rgba(59,130,246,0.1)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span>📖</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{cur.title}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: gray3, background: "rgba(59,130,246,0.1)", padding: "3px 10px", borderRadius: 10 }}>GraphRAG · 3跳关联</span>
              </div>
              <div style={{ padding: "16px 18px" }}>
                {!contentDone ? (
                  <div style={{ fontSize: 13.5, lineHeight: 1.9, color: text2, whiteSpace: "pre-wrap" }}>
                    {typedContent}<span style={{ animation: "pulse 0.8s infinite" }}>▍</span>
                  </div>
                ) : (
                  typedContent.split("\n\n").map(function (para, pi, arr) {
                    return (
                      <div key={pi} style={{ fontSize: 13.5, lineHeight: 1.9, color: text2, marginBottom: pi < arr.length - 1 ? 14 : 0, paddingBottom: pi < arr.length - 1 ? 14 : 0, borderBottom: pi < arr.length - 1 ? "1px solid rgba(51,65,85,0.2)" : "none" }}>
                        {para}
                      </div>
                    );
                  })
                )}
              </div>
              {contentDone && (
                <div style={{ padding: "10px 18px 14px", borderTop: "1px solid rgba(51,65,85,0.3)", display: "flex", gap: 12, fontSize: 11, color: gray3, flexWrap: "wrap" }}>
                  <span>关键人物: {cur.keyPeople}</span><span>·</span><span>时间线: {cur.timeline}</span>
                </div>
              )}
            </div>

            {contentDone && (
              <FadeIn keyProp={"after-" + caseId}>
                {/* 思政映射 */}
                <div style={{ background: "rgba(234,179,8,0.06)", borderRadius: 12, padding: "12px 18px", border: "1px solid rgba(234,179,8,0.15)", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  <span>🔗</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: yellow, fontWeight: 600, marginBottom: 4 }}>思政映射 → 已对齐教学目标</div>
                    <div style={{ fontSize: 13, color: "#fbbf24" }}>{cur.tags.join(" · ")}</div>
                  </div>
                </div>

                {/* 引导思考 */}
                <div style={{ background: dark2, borderRadius: 14, border: "1px solid rgba(6,182,212,0.15)", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", background: "rgba(6,182,212,0.08)", borderBottom: "1px solid rgba(6,182,212,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
                    <span>💡</span><span style={{ fontSize: 14, fontWeight: 700 }}>引导思考 (苏格拉底式)</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: gray2 }}>写下你的思考，小备会回应</span>
                  </div>
                  <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                    {cur.questions.map(function (q, qi) {
                      return <QuestionBlock key={qi} index={qi} question={q} caseId={caseId} />;
                    })}
                  </div>
                </div>

                {/* 完成/完成卡片 */}
                {!showComplete ? (
                  <div style={{ paddingBottom: 80 }}>
                    <button onClick={function () { setShowComplete(true); if (onComplete) onComplete(caseId); }} style={{ marginTop: 16, width: "100%", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", color: "#fff", cursor: "pointer" }}>✓ 标记本案例学习完成</button>
                    <button onClick={onBack} style={{ marginTop: 10, width: "100%", padding: "10px", borderRadius: 10, background: "transparent", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>← 返回我的画像</button>
                  </div>
                ) : (
                  <div style={{ paddingBottom: 80, animation: "profileGen 0.4s ease both" }}>
                    <div style={{ background: "linear-gradient(135deg,rgba(34,197,94,0.1),rgba(6,182,212,0.06))", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 14, padding: "20px", textAlign: "center", marginTop: 16 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🏅</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: green, marginBottom: 6 }}>《{cur.title}》学习完成！</div>
                      <div style={{ fontSize: 13, color: text2, lineHeight: 1.75, marginBottom: 14 }}>学习记录已更新 · 你的思政画像将在下次评估时同步优化</div>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 14 }}>
                        {cur.tags.map(function (tag, i) { return <span key={i} style={{ fontSize: 11, padding: "3px 10px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: green, borderRadius: 999 }}>{tag}</span>; })}
                      </div>

                      {/* 思政关联提示 */}
                      {CASE_LINKS[caseId] && (function () {
                        const link = CASE_LINKS[caseId];
                        const nextCase = CASES[link.to];
                        return (
                          <div style={{ padding: "12px 14px", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 10, marginBottom: 12, textAlign: "left" }}>
                            <div style={{ fontSize: 11, color: yellow, fontWeight: 600, marginBottom: 6 }}>🔗 思政关联 · 共同精神内核</div>
                            <div style={{ fontSize: 11, color: yellow, fontWeight: 700, marginBottom: 6, padding: "3px 10px", background: "rgba(234,179,8,0.1)", borderRadius: 999, display: "inline-block" }}>"{link.theme}"</div>
                            <div style={{ fontSize: 12, color: text2, lineHeight: 1.7, marginBottom: 10 }}>{link.bridge}</div>
                            <div onClick={function () { onSwitchCase(link.to); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: dark1, border: "1px solid rgba(234,179,8,0.25)", borderRadius: 8, cursor: "pointer" }}>
                              <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: gray3 }}>下一个推荐</div><div style={{ fontSize: 13, fontWeight: 700, color: yellow }}>{nextCase.title}</div></div>
                              <div style={{ fontSize: 12, color: yellow }}>→</div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 引导进入小备对话 */}
                      <div style={{ padding: "12px 14px", background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 10, marginBottom: 12, textAlign: "left" }}>
                        <div style={{ fontSize: 11, color: cyan, fontWeight: 600, marginBottom: 4 }}>💬 小备想和你聊聊</div>
                        <div style={{ fontSize: 12, color: text2, lineHeight: 1.65 }}>刚才看了《{cur.title}》，有没有触动你的地方？点右边按钮，和小备深入聊聊这个故事。</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={onBack} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: cyan, fontSize: 13, cursor: "pointer", fontWeight: 700 }}>继续学习 →</button>
                        <button onClick={function() { if (onRetake) onRetake(); else onBack(); }} style={{ padding: "11px 16px", borderRadius: 10, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a855f7", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>🔁 重新测评</button>
                      </div>
                    </div>
                  </div>
                )}
              </FadeIn>
            )}
          </FadeIn>
        )}
      </div>
    </div>
  );
}
