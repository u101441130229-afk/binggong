// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 案例知识图谱：展示案例、人物、精神内核与思政维度之间的关联。
import { useState } from "react";
import { CASES, blue, cyan, dark1, gray2, gray3, green, purple, red, text2, yellow } from "../../constants.js";

const GRAPH_DATA = {
  beidou: {
    center: { id: "case", label: "北斗系统", color: cyan, x: 200, y: 160 },
    nodes: [
      { id: "p1", label: "陈芳允", color: "#38bdf8", x: 80, y: 60, type: "人物" },
      { id: "p2", label: "孙家栋", color: "#38bdf8", x: 320, y: 60, type: "人物" },
      { id: "p3", label: "杨长风", color: "#38bdf8", x: 200, y: 30, type: "人物" },
      { id: "s1", label: "科技自立自强", color: green, x: 60, y: 220, type: "精神" },
      { id: "s2", label: "迭代式成长", color: green, x: 340, y: 220, type: "精神" },
      { id: "s3", label: "战略定力", color: green, x: 200, y: 270, type: "精神" },
      { id: "d1", label: "PA 专业认同", color: yellow, x: 70, y: 300, type: "维度" },
      { id: "d2", label: "MP 使命感知", color: yellow, x: 330, y: 300, type: "维度" },
      { id: "d3", label: "SC 报国信心", color: yellow, x: 200, y: 330, type: "维度" },
    ],
    edges: [
      ["case", "p1"],
      ["case", "p2"],
      ["case", "p3"],
      ["case", "s1"],
      ["case", "s2"],
      ["case", "s3"],
      ["s1", "d1"],
      ["s2", "d3"],
      ["s3", "d2"],
    ],
  },
  df41: {
    center: { id: "case", label: "东风-41", color: red, x: 200, y: 160 },
    nodes: [
      { id: "s1", label: "战略威慑", color: green, x: 80, y: 60, type: "精神" },
      { id: "s2", label: "战略定力", color: green, x: 320, y: 60, type: "精神" },
      { id: "s3", label: "长期主义", color: green, x: 200, y: 40, type: "精神" },
      { id: "s4", label: "无名坚守", color: green, x: 60, y: 220, type: "精神" },
      { id: "d1", label: "VS 价值定力", color: yellow, x: 340, y: 220, type: "维度" },
      { id: "d2", label: "SC 报国信心", color: yellow, x: 120, y: 290, type: "维度" },
      { id: "d3", label: "MP 使命感知", color: yellow, x: 280, y: 290, type: "维度" },
      { id: "c1", label: "核政策", color: "#f87171", x: 200, y: 290, type: "概念" },
    ],
    edges: [
      ["case", "s1"],
      ["case", "s2"],
      ["case", "s3"],
      ["case", "s4"],
      ["s2", "d1"],
      ["s3", "d2"],
      ["s1", "c1"],
      ["c1", "d3"],
      ["s4", "d2"],
    ],
  },
  j20: {
    center: { id: "case", label: "歼-20", color: blue, x: 200, y: 160 },
    nodes: [
      { id: "p1", label: "杨伟", color: "#38bdf8", x: 200, y: 40, type: "人物" },
      { id: "s1", label: "科技自立自强", color: green, x: 60, y: 100, type: "精神" },
      { id: "s2", label: "原创设计", color: green, x: 340, y: 100, type: "精神" },
      { id: "s3", label: "从跟跑到并跑", color: green, x: 60, y: 240, type: "精神" },
      { id: "d1", label: "PA 专业认同", color: yellow, x: 340, y: 240, type: "维度" },
      { id: "d2", label: "CD 职业方向", color: yellow, x: 120, y: 310, type: "维度" },
      { id: "d3", label: "SC 报国信心", color: yellow, x: 280, y: 310, type: "维度" },
      { id: "c1", label: "技术封锁", color: "#f97316", x: 200, y: 290, type: "概念" },
    ],
    edges: [
      ["case", "p1"],
      ["case", "s1"],
      ["case", "s2"],
      ["case", "s3"],
      ["s1", "d1"],
      ["s3", "d2"],
      ["s2", "d3"],
      ["c1", "s1"],
      ["p1", "s2"],
    ],
  },
  fujian: {
    center: { id: "case", label: "福建舰", color: purple, x: 200, y: 160 },
    nodes: [
      { id: "p1", label: "田伟", color: "#38bdf8", x: 100, y: 50, type: "人物" },
      { id: "p2", label: "雷凡培", color: "#38bdf8", x: 300, y: 50, type: "人物" },
      { id: "s1", label: "体系胜利", color: green, x: 55, y: 210, type: "精神" },
      { id: "s2", label: "集体协同", color: green, x: 345, y: 210, type: "精神" },
      { id: "s3", label: "工程系统观", color: green, x: 200, y: 270, type: "精神" },
      { id: "d1", label: "CC 集体协同", color: yellow, x: 80, y: 310, type: "维度" },
      { id: "d2", label: "MP 使命感知", color: yellow, x: 320, y: 310, type: "维度" },
      { id: "c1", label: "电磁弹射", color: "#a855f7", x: 200, y: 55, type: "概念" },
    ],
    edges: [
      ["case", "p1"],
      ["case", "p2"],
      ["case", "s1"],
      ["case", "s2"],
      ["case", "s3"],
      ["s2", "d1"],
      ["s1", "d2"],
      ["s3", "d1"],
      ["c1", "s3"],
      ["p1", "s3"],
    ],
  },
  tank99a: {
    center: { id: "case", label: "99A坦克", color: yellow, x: 200, y: 160 },
    nodes: [
      { id: "p1", label: "祝榆生", color: "#38bdf8", x: 100, y: 50, type: "人物" },
      { id: "p2", label: "毛明", color: "#38bdf8", x: 300, y: 50, type: "人物" },
      { id: "s1", label: "工匠精神", color: green, x: 55, y: 210, type: "精神" },
      { id: "s2", label: "迭代成长", color: green, x: 345, y: 210, type: "精神" },
      { id: "s3", label: "代际传承", color: green, x: 200, y: 270, type: "精神" },
      { id: "d1", label: "PA 专业认同", color: yellow, x: 80, y: 310, type: "维度" },
      { id: "d2", label: "CD 职业方向", color: yellow, x: 200, y: 330, type: "维度" },
      { id: "d3", label: "SC 报国信心", color: yellow, x: 320, y: 310, type: "维度" },
    ],
    edges: [
      ["case", "p1"],
      ["case", "p2"],
      ["case", "s1"],
      ["case", "s2"],
      ["case", "s3"],
      ["s1", "d1"],
      ["s2", "d2"],
      ["s3", "d3"],
      ["p1", "s3"],
      ["p2", "s3"],
    ],
  },
  df17: {
    center: { id: "case", label: "东风-17", color: red, x: 200, y: 160 },
    nodes: [
      { id: "p1", label: "型号团队", color: "#38bdf8", x: 100, y: 50, type: "人物" },
      { id: "s1", label: "换道领跑", color: green, x: 55, y: 210, type: "精神" },
      { id: "s2", label: "长期积累", color: green, x: 345, y: 210, type: "精神" },
      { id: "s3", label: "跨学科融合", color: green, x: 200, y: 270, type: "精神" },
      { id: "d1", label: "CT 思辨开放", color: yellow, x: 80, y: 310, type: "维度" },
      { id: "d2", label: "IR 资源感知", color: yellow, x: 320, y: 310, type: "维度" },
      { id: "c1", label: "高超音速", color: "#f97316", x: 300, y: 50, type: "概念" },
    ],
    edges: [
      ["case", "p1"],
      ["case", "s1"],
      ["case", "s2"],
      ["case", "s3"],
      ["s1", "d1"],
      ["s2", "d2"],
      ["s3", "d1"],
      ["c1", "s3"],
      ["p1", "s2"],
    ],
  },
  tiangong: {
    center: { id: "case", label: "天宫空间站", color: cyan, x: 200, y: 160 },
    nodes: [
      { id: "p1", label: "王永志", color: "#38bdf8", x: 80, y: 50, type: "人物" },
      { id: "p2", label: "张柏楠", color: "#38bdf8", x: 320, y: 50, type: "人物" },
      { id: "s1", label: "战略耐心", color: green, x: 55, y: 210, type: "精神" },
      { id: "s2", label: "系统协同", color: green, x: 345, y: 210, type: "精神" },
      { id: "s3", label: "代际接力", color: green, x: 200, y: 270, type: "精神" },
      { id: "d1", label: "CC 集体协同", color: yellow, x: 80, y: 310, type: "维度" },
      { id: "d2", label: "MP 使命感知", color: yellow, x: 320, y: 310, type: "维度" },
      { id: "c1", label: "921工程", color: "#22d3ee", x: 200, y: 55, type: "概念" },
    ],
    edges: [
      ["case", "p1"],
      ["case", "p2"],
      ["case", "s1"],
      ["case", "s2"],
      ["case", "s3"],
      ["s1", "d2"],
      ["s2", "d1"],
      ["s3", "d1"],
      ["c1", "s1"],
      ["p1", "s3"],
      ["p2", "s3"],
    ],
  },
  y20: {
    center: { id: "case", label: "运-20", color: purple, x: 200, y: 160 },
    nodes: [
      { id: "p1", label: "唐长红", color: "#38bdf8", x: 200, y: 40, type: "人物" },
      { id: "s1", label: "填补空白", color: green, x: 55, y: 210, type: "精神" },
      { id: "s2", label: "体系价值", color: green, x: 345, y: 210, type: "精神" },
      { id: "s3", label: "甘当支撑", color: green, x: 200, y: 270, type: "精神" },
      { id: "d1", label: "CD 职业方向", color: yellow, x: 80, y: 310, type: "维度" },
      { id: "d2", label: "CC 集体协同", color: yellow, x: 320, y: 310, type: "维度" },
      { id: "c1", label: "战略投送", color: "#a855f7", x: 100, y: 50, type: "概念" },
    ],
    edges: [
      ["case", "p1"],
      ["case", "s1"],
      ["case", "s2"],
      ["case", "s3"],
      ["s1", "d1"],
      ["s2", "d1"],
      ["s3", "d2"],
      ["c1", "s2"],
      ["p1", "s2"],
    ],
  },
};

export default function KnowledgeGraph({ caseId, onClose }) {
  const currentCase = CASES[caseId];
  const [hoveredNode, setHoveredNode] = useState(null);
  const graph = GRAPH_DATA[caseId] || GRAPH_DATA.beidou;
  const allNodes = [graph.center, ...graph.nodes];
  const nodeMap = {};
  allNodes.forEach(function (node) {
    nodeMap[node.id] = node;
  });
  const typeLabels = { 人物: "👤", 精神: "✦", 维度: "◈", 概念: "◉" };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
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
            padding: "14px 18px",
            borderBottom: "1px solid rgba(51,65,85,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: cyan }}>🕸 知识图谱 · {currentCase.title}</div>
            <div style={{ fontSize: 10, color: gray2, marginTop: 2 }}>案例 → 人物 → 精神内核 → 思政维度</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: gray2, fontSize: 18, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "8px 0" }}>
          <svg width="100%" viewBox="0 0 400 370" style={{ display: "block" }}>
            {graph.edges.map(function ([from, to], index) {
              const fromNode = nodeMap[from];
              const toNode = nodeMap[to];
              if (!fromNode || !toNode) return null;
              const isActive = hoveredNode === from || hoveredNode === to;
              return (
                <line
                  key={index}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isActive ? cyan : "rgba(100,116,139,0.3)"}
                  strokeWidth={isActive ? 1.5 : 1}
                  strokeDasharray={isActive ? "none" : "4 3"}
                  style={{ transition: "all 0.2s" }}
                />
              );
            })}
            {allNodes.map(function (node) {
              const isCenter = node.id === "case";
              const isHovered = hoveredNode === node.id;
              const radius = isCenter ? 30 : 20;
              const label = node.label;
              const line1 = label.length > 4 ? label.slice(0, Math.ceil(label.length / 2)) : label;
              const line2 = label.length > 4 ? label.slice(Math.ceil(label.length / 2)) : "";
              return (
                <g
                  key={node.id}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={function () {
                    setHoveredNode(node.id);
                  }}
                  onMouseLeave={function () {
                    setHoveredNode(null);
                  }}
                  onClick={function () {
                    setHoveredNode(hoveredNode === node.id ? null : node.id);
                  }}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isHovered ? radius + 4 : radius}
                    fill={node.color + (isCenter ? "33" : "22")}
                    stroke={node.color}
                    strokeWidth={isCenter ? 2.5 : 1.5}
                    style={{ transition: "all 0.2s" }}
                  />
                  {!isCenter && (
                    <text x={node.x} y={node.y - radius - 4} textAnchor="middle" fontSize="8" fill={gray3}>
                      {typeLabels[node.type] || ""}
                    </text>
                  )}
                  {line2 ? (
                    <>
                      <text
                        x={node.x}
                        y={node.y + (isCenter ? 0 : -2)}
                        textAnchor="middle"
                        fontSize={isCenter ? 11 : 9}
                        fontWeight={isCenter ? 700 : 600}
                        fill={isHovered ? "#fff" : node.color}
                      >
                        {line1}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + (isCenter ? 13 : 9)}
                        textAnchor="middle"
                        fontSize={isCenter ? 11 : 9}
                        fontWeight={isCenter ? 700 : 600}
                        fill={isHovered ? "#fff" : node.color}
                      >
                        {line2}
                      </text>
                    </>
                  ) : (
                    <text
                      x={node.x}
                      y={node.y + (isCenter ? 5 : 4)}
                      textAnchor="middle"
                      fontSize={isCenter ? 11 : 9}
                      fontWeight={isCenter ? 700 : 600}
                      fill={isHovered ? "#fff" : node.color}
                    >
                      {label}
                    </text>
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
            {[
              ["👤 人物", "#38bdf8"],
              ["✦ 精神内核", green],
              ["◈ 思政维度", yellow],
              ["◉ 核心概念", "#f97316"],
            ].map(function ([label, color]) {
              return (
                <span key={label} style={{ fontSize: 10, color }}>
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
