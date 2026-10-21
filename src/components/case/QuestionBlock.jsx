// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 案例引导问题：学生写下自己的思考后，展示与小备的引导式回应。
import { useState } from "react";
import { cyan, gray2, gray3, green, text1, text2 } from "../../constants.js";
import XiaoBei from "../XiaoBei.jsx";

const RESPONSES = {
  beidou: [
    "你触到了关键——资源不是成功的前提，路径选择才是。陈芳允选择双星，不是因为条件好，恰恰是因为条件不够好。这是在约束里找创造力，而不是等条件够了再出发。",
    "你说的这个场景，其实是工程学习最真实的日常。条件不足时能出发，靠的不是勇气，是对最小可行方案的判断力——先找到一个能开始的入口，再边走边完善。",
    "26年的接力，靠的不是某个人的热情，是制度性的信念——国家战略需求本身就是一种长期承诺。你认同这种因为国家需要所以我们做的逻辑吗？",
  ],
  df41: [
    "你说到了核心悖论：最强大的武器，存在的意义是让自己永远不被使用。这种实力与克制的逻辑，在个人层面有没有类似的体验？",
    "隐姓埋名几十年，支撑他们的不是外部认可，而是内部的价值确认——我知道我在做什么，我知道它的价值。这和你理解的意义感一样吗？",
    "半个世纪的政策定力，在外部压力持续变化的今天显得尤其不易。你觉得一个国家怎样才能做到这种程度的战略稳定？",
  ],
  j20: [
    "借鉴和原创的边界，其实是理解之后再超越。先真正消化别人的逻辑，再在此基础上做出自己的判断——你觉得这个顺序重要吗？",
    "6年从首飞到列装，背后是无数人同时解决不同子问题的并行工程。你认为集中力量办大事和分布式创新各自的适用边界在哪里？",
    "技术自主和国际合作不是非此即彼——北斗也有部分国际合作，歼-20也参考了公开资料。关键是合作的边界在哪里。你怎么划这条线？",
  ],
  fujian: [
    "技术往往比流程好解决，因为技术有标准答案，流程涉及人的协调。你在团队合作里，遇到的最难的看不见的部分是什么？",
    "大协同需要的是让每个专业都看到整体的能力。你认为工程师需要懂多少自己专业以外的东西？",
    "每个环节都关键，意味着每个环节都是潜在的失效点。工程伦理的核心是：在交付压力下，你能不能说出这还不够好。你有过这样的时刻吗？",
  ],
  tank99a: [
    "慢但稳的路径适合复杂系统，快速颠覆适合技术窗口期短的领域。坦克工业是前者——你觉得你未来想走的方向，更接近哪种节奏？",
    "信息力的融入意味着99A不再只是一辆坦克，而是一个信息节点。你所在的专业，有没有类似加入数字化维度之后变成完全不同的东西的案例？",
    "两代总师的接力，意味着毛明首先要真正理解祝榆生的工作，才能在此基础上创新。你现在的学习，有多少是在为真正理解前人做准备？",
  ],
  df17: [
    "换道领跑的关键，不是回避竞争，而是重新定义竞争发生的维度。你在学习或竞赛中，有没有找到过属于自己的非对称路径？",
    "气动、制导、材料三个极限同时推进，任何一项落后都会拖住整体。这让你如何理解跨学科协作中的短板效应？",
    "长期潜伏、一朝激活，听起来像运气，其实是积累到一定程度后的必然。你现在正在积累的那件事，是什么？",
  ],
  tiangong: [
    "三十年三步走，每一步都要等上一阶段真正成熟。你觉得在个人成长中，哪些事是急不得的？",
    "空间站每个子系统都必须可靠，但只有整体协同到位才能形成能力。你更擅长做好自己那一部分，还是推动整体协同？",
    "一代人只完成项目中的一小段，却共同托起了长期目标。你希望自己在一个长期项目里留下什么？",
  ],
  y20: [
    "填补空白往往不如争夺名次显眼，但它决定了体系能不能运转。你愿意选择一条不热闹但关键的路吗？",
    "一个大项目会带动整条产业链升级。你所在专业的一个关键技术，可能牵动哪些上下游能力？",
    "运-20的定位是让别人飞得更远。在一个团队里，你更愿意成为被支持的人，还是做支持的人？为什么？",
  ],
};

export default function QuestionBlock({ index, question, caseId }) {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function handleSubmit() {
    if (!input.trim() || submitted) return;
    setSubmitted(true);
    setTimeout(function () {
      setShowResponse(true);
    }, 500);
  }

  const response = (RESPONSES[caseId] || [])[index] || "你的思考很有价值。带着这个问题继续看下去，会有新的发现。";

  return (
    <div
      style={{
        borderRadius: 10,
        background: "rgba(6,182,212,0.04)",
        border: "1px solid " + (submitted ? "rgba(34,197,94,0.2)" : "rgba(6,182,212,0.15)"),
        overflow: "hidden",
        transition: "border-color 0.3s",
      }}
    >
      <div
        style={{ padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}
        onClick={function () {
          setExpanded(!expanded);
        }}
      >
        <span style={{ color: submitted ? green : cyan, fontWeight: 700, flexShrink: 0, fontSize: 13 }}>
          Q{index + 1}
        </span>
        <span style={{ fontSize: 13, lineHeight: 1.75, color: submitted ? text2 : gray3, flex: 1 }}>{question}</span>
        <span style={{ color: gray2, fontSize: 11, flexShrink: 0, marginTop: 2 }}>
          {submitted ? "✓" : expanded ? "▲" : "▼"}
        </span>
      </div>
      {(expanded || submitted) && (
        <div style={{ padding: "0 14px 12px", borderTop: "1px solid rgba(51,65,85,0.2)" }}>
          {!submitted ? (
            <div style={{ paddingTop: 10 }}>
              <textarea
                value={input}
                onChange={function (event) {
                  setInput(event.target.value);
                }}
                placeholder="写下你的第一反应，几句话就够…"
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(51,65,85,0.4)",
                  color: text1,
                  fontSize: 12,
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                  lineHeight: 1.6,
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                style={{
                  marginTop: 6,
                  padding: "7px 16px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  background: input.trim() ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "rgba(51,65,85,0.4)",
                  border: "none",
                  color: input.trim() ? "#fff" : gray2,
                  cursor: input.trim() ? "pointer" : "not-allowed",
                }}
              >
                提交思考
              </button>
            </div>
          ) : (
            <div style={{ paddingTop: 10 }}>
              <div
                style={{
                  padding: "8px 10px",
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.15)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: text2,
                  lineHeight: 1.65,
                  marginBottom: 8,
                }}
              >
                {input}
              </div>
              {showResponse && (
                <div
                  style={{ display: "flex", gap: 8, alignItems: "flex-start", animation: "fadeSlideUp 0.3s ease both" }}
                >
                  <XiaoBei size={24} speaking={false} />
                  <div
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      background: "rgba(6,182,212,0.06)",
                      border: "1px solid rgba(6,182,212,0.15)",
                      borderRadius: "4px 8px 8px 8px",
                      fontSize: 12,
                      color: text1,
                      lineHeight: 1.7,
                    }}
                  >
                    {response}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
