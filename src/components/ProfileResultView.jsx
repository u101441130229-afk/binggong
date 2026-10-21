// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 画像结果页：展示八维画像、关注维度说明、行动建议与推荐学习路径。
import { useState } from "react";
import {
  CASES,
  CASE_ORDER,
  DIM_EXP,
  DIMS,
  PROFILE_IMAGES,
  RECOMMEND_MAP,
  blue,
  cyan,
  dark0,
  dark1,
  dark2,
  dark3,
  dimMeta,
  gray1,
  gray2,
  gray3,
  green,
  red,
  text1,
  text2,
  yellow,
} from "../constants.js";
import useTyping from "../hooks/useTyping.js";
import ProfileShareCard from "./ProfileShareCard.jsx";
import LearnedCasesBanner from "./profile/LearnedCasesBanner.jsx";
import ProfileWeaponImage from "./profile/ProfileWeaponImage.jsx";
import RadarChart from "./RadarChart.jsx";
import XiaoBei from "./XiaoBei.jsx";

const FALLBACK_WELCOME = {
  SOLID:
    "你的画像生成了。稳进发展型——你对自己的方向有清晰的感知，这很难得。接下来，让我们一起找一个真正触动你的兵工故事。",
  PERSIST: "你的画像生成了。高压坚持型——你一直在用力，但思辨的空间还可以更大。今天，试着把你的一个想法说出来？",
  VALUE: "你的画像生成了。价值思辨型——愿意提问本身就是一种力量。我为你准备了几个值得深想的兵工故事。",
  COLLAB: "你的画像生成了。集体凝聚型——你天然理解“系统胜利”。福建舰的故事，可能是最适合你的那个。",
  EXPLORE: "你的画像生成了。方向探索型——不是不努力，只是方向还在形成。没关系，我们一起看看别人是怎么选的。",
  RESOURCE: "你的画像生成了。资源激活型——你有潜力，只是还没接上资源。今天，我来帮你找到那个入口。",
  GROW: "你的画像生成了。成长进行时——均衡而有活力。每一步都算数，我们从一个真实的兵工故事开始。",
  GUIDE: "你的画像生成了。重点引导型——你主动寻求引导，这是清醒的表现。小备已为你准备好了下一步。",
};

const PATH_MAP = {
  SOLID: ["beidou", "tiangong", "fujian", "y20", "tank99a", "j20", "df41", "df17"],
  PERSIST: ["df41", "tank99a", "y20", "beidou", "fujian", "tiangong", "j20", "df17"],
  VALUE: ["j20", "df17", "tank99a", "beidou", "df41", "fujian", "y20", "tiangong"],
  COLLAB: ["fujian", "y20", "tiangong", "beidou", "tank99a", "j20", "df41", "df17"],
  EXPLORE: ["tank99a", "j20", "df17", "beidou", "fujian", "df41", "y20", "tiangong"],
  RESOURCE: ["df17", "beidou", "tank99a", "j20", "tiangong", "fujian", "df41", "y20"],
  GROW: ["tiangong", "tank99a", "beidou", "fujian", "y20", "j20", "df17", "df41"],
  GUIDE: ["y20", "fujian", "df41", "tiangong", "beidou", "tank99a", "j20", "df17"],
};

const DIM_ACTIONS = {
  PA: "主动参与一次兵工相关的社团活动或讲座",
  MP: "和同学聊聊你理解的“为什么要搞国防”",
  VS: "找一篇争议性文章，试着自己判断立场",
  CC: "在下次团队任务中主动承担协调角色",
  CT: "在课堂上提出至少一个你真正想问的问题",
  SC: "回顾一次你做成的事，写下它对国家有什么意义",
  CD: "和学长或老师聊聊军工就业的真实路径",
  IR: "查一下学院本学期有哪些思政讲座资源",
};

const TYPE_ACTIONS = {
  SOLID: "尝试帮助一位同学了解你认同的兵工精神",
  PERSIST: "找一次公开讨论的机会，把你坚持的观点说出来",
  VALUE: "带着一个疑问去看一个兵工案例，找到你自己的答案",
  COLLAB: "主动在下次协作中提出“系统优先”的决策建议",
  EXPLORE: "今天就把你理想的毕业去向写下来，哪怕只是草稿",
  RESOURCE: "花10分钟看看学校思政平台上有什么你没用过的资源",
  GROW: "完整看完一个推荐案例，写3句话总结你的收获",
  GUIDE: "整理三个最想和老师交流的问题，主动找辅导员聊一次",
};

export default function ProfileResultView({
  profile,
  aiAnalysis,
  aiPending,
  learnedCases = [],
  onChooseCase,
  onRetake,
}) {
  const type = profile.final;
  const recommendation = RECOMMEND_MAP[type.code];
  const recommendedCase = recommendation.primary ? CASES[recommendation.primary] : null;
  const [showShare, setShowShare] = useState(false);
  const hour = new Date().getHours();
  const greeting =
    hour < 6 ? "深夜了还在学习" : hour < 12 ? "早上好" : hour < 18 ? "下午好" : hour < 22 ? "晚上好" : "夜深了还没休息";
  const welcomeText = aiAnalysis || FALLBACK_WELCOME[type.code] || "你的画像生成了，让我们开始吧。";
  const [typedWelcome, welcomeDone] = useTyping(welcomeText, 18, true);
  const path = PATH_MAP[type.code] || CASE_ORDER;
  const lowDims = DIMS.filter(function (dim) {
    return profile.lvls[dim] === "L";
  });
  const action =
    lowDims.length > 0 ? DIM_ACTIONS[lowDims[0]] : TYPE_ACTIONS[type.code] || "选一个案例，开始你的兵工铸魂之旅";

  return (
    <div style={{ background: dark0, minHeight: "100%", color: text1 }}>
      <div
        style={{
          background: "linear-gradient(135deg," + dark1 + "," + dark3 + ")",
          borderBottom: "1px solid rgba(59,130,246,0.2)",
          padding: "16px 24px",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>你的兵工思政画像</div>
        <div style={{ fontSize: 11, color: gray1, marginTop: 2 }}>基于 16 题作答 · 8 维成长画像 · 匹配度计算</div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "14px 16px",
            background: "rgba(6,182,212,0.05)",
            border: "1px solid rgba(6,182,212,0.18)",
            borderRadius: 14,
            marginBottom: 18,
            animation: "fadeSlideUp 0.5s ease both",
          }}
        >
          <XiaoBei size={48} speaking={false} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: cyan, fontWeight: 600 }}>小备 · {greeting}</div>
              <div
                style={{
                  fontSize: 9,
                  color: aiAnalysis ? green : gray2,
                  padding: "1px 6px",
                  background: aiAnalysis ? "rgba(34,197,94,0.1)" : "rgba(51,65,85,0.3)",
                  border: aiAnalysis ? "1px solid rgba(34,197,94,0.3)" : "none",
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                {aiAnalysis ? "AI 寄语" : aiPending ? "AI 寄语生成中…" : "本地寄语"}
              </div>
            </div>
            <div style={{ fontSize: 13.5, color: text2, lineHeight: 1.8 }}>
              {typedWelcome}
              {!welcomeDone && <span style={{ animation: "pulse 0.8s infinite" }}>▍</span>}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg," + dark2 + "," + dark3 + ")",
            border: "1px solid " + type.color + "55",
            borderRadius: 18,
            marginBottom: 18,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {PROFILE_IMAGES && PROFILE_IMAGES[type.code] && (
            <ProfileWeaponImage src={PROFILE_IMAGES[type.code]} color={type.color} typeName={type.cn} />
          )}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "radial-gradient(circle," + type.color + "22 0%,transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", padding: "24px 22px" }}>
            <div style={{ fontSize: 11, color: type.color, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
              画像类型 · {type.code}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 10, letterSpacing: -0.5 }}>{type.cn}</div>
            <div style={{ fontSize: 14, color: text2, marginBottom: 12, fontStyle: "italic" }}>{type.intro}</div>
            <div style={{ fontSize: 13.5, color: text2, lineHeight: 1.85 }}>{type.desc}</div>
            {profile.matchInfo && (
              <div
                style={{
                  marginTop: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  background: "rgba(15,23,42,0.6)",
                  border: "1px solid " + type.color + "44",
                  borderRadius: 999,
                  fontSize: 11,
                  color: type.color,
                  fontWeight: 600,
                }}
              >
                {profile.matchInfo}
              </div>
            )}
            <button
              onClick={function () {
                setShowShare(true);
              }}
              style={{
                width: "100%",
                marginTop: 14,
                padding: "10px 14px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.3)",
                color: yellow,
                cursor: "pointer",
              }}
            >
              🪪 生成画像卡片
            </button>
          </div>
        </div>

        {showShare && (
          <ProfileShareCard
            profile={profile}
            onClose={function () {
              setShowShare(false);
            }}
          />
        )}

        <LearnedCasesBanner learnedCases={learnedCases} />

        <div
          style={{
            background: dark2,
            border: "1px solid rgba(51,65,85,0.5)",
            borderRadius: 14,
            padding: "16px 18px",
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: text1, marginBottom: 4 }}>八维成长画像</div>
          <div style={{ fontSize: 11, color: gray1, marginBottom: 14 }}>点击维度查看说明</div>
          <RadarChart lvls={profile.lvls} size={310} />
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
            {DIMS.map(function (dim) {
              const level = profile.lvls[dim];
              const score = profile.raw[dim];
              const levelColor = level === "H" ? green : level === "M" ? yellow : red;
              return (
                <div
                  key={dim}
                  style={{ padding: "6px 8px", background: "rgba(15,23,42,0.5)", borderRadius: 8, textAlign: "center" }}
                >
                  <div style={{ fontSize: 10, color: cyan, fontWeight: 700 }}>{dim}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: levelColor, margin: "2px 0" }}>{score}</div>
                  <div style={{ height: 3, background: "rgba(30,41,59,0.6)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: (score / 8) * 100 + "%", height: "100%", background: levelColor }} />
                  </div>
                </div>
              );
            })}
          </div>
          {lowDims.length > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
                borderRadius: 10,
              }}
            >
              <div style={{ fontSize: 11, color: red, fontWeight: 700, marginBottom: 6 }}>▼ 需关注的维度</div>
              {lowDims.map(function (dim) {
                return (
                  <div key={dim} style={{ fontSize: 12, color: gray3, lineHeight: 1.65, marginBottom: 4 }}>
                    <span style={{ color: red, fontWeight: 700 }}>
                      {dim} {dimMeta[dim].name}：
                    </span>
                    {DIM_EXP[dim].L}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          style={{
            background: "linear-gradient(135deg,rgba(59,130,246,0.08),rgba(6,182,212,0.06))",
            border: "1px solid rgba(59,130,246,0.25)",
            borderRadius: 14,
            padding: "14px 18px",
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 11, color: blue, fontWeight: 700, marginBottom: 6 }}>🎯 你当前最值得做的一件事</div>
          <div style={{ fontSize: 14, color: text1, lineHeight: 1.75, fontWeight: 500 }}>{action}</div>
        </div>

        <div
          style={{
            background: "rgba(6,182,212,0.06)",
            border: "1px solid rgba(6,182,212,0.25)",
            borderRadius: 14,
            padding: "16px 18px",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <XiaoBei size={64} speaking={true} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: cyan, fontWeight: 600, marginBottom: 6 }}>小备的推荐</div>
              <div style={{ fontSize: 14.5, color: text1, lineHeight: 1.75, marginBottom: 12 }}>
                {recommendation.reason}
              </div>
              {recommendedCase && (
                <div
                  onClick={function () {
                    onChooseCase(recommendedCase.id);
                  }}
                  style={{
                    background: dark2,
                    border: "1px solid rgba(6,182,212,0.4)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.18s",
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 700, color: cyan }}>{recommendedCase.title}</div>
                    <div style={{ fontSize: 11, color: gray3 }}>{recommendedCase.timeline}</div>
                  </div>
                  <div style={{ fontSize: 12, color: gray3, marginBottom: 8 }}>{recommendedCase.type}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {recommendedCase.tags.map(function (tag, index) {
                      return (
                        <span
                          key={index}
                          style={{
                            fontSize: 11,
                            padding: "3px 10px",
                            background: "rgba(6,182,212,0.1)",
                            border: "1px solid rgba(6,182,212,0.2)",
                            color: cyan,
                            borderRadius: 999,
                          }}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: cyan, fontWeight: 600 }}>点击进入学习 →</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {recommendedCase && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: gray1, marginBottom: 10, fontWeight: 600 }}>🗺️ 为你规划的学习路径</div>
            <div
              style={{
                background: dark2,
                borderRadius: 14,
                border: "1px solid rgba(51,65,85,0.4)",
                padding: "14px 16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
                {path.map(function (id, index) {
                  const item = CASES[id];
                  const done = learnedCases.indexOf(id) >= 0;
                  const current = id === recommendedCase.id && !done;
                  const stepColor = done ? green : current ? cyan : gray2;
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                      <div
                        onClick={function () {
                          if (!done) onChooseCase(id);
                        }}
                        style={{ textAlign: "center", cursor: done ? "default" : "pointer", padding: "0 4px" }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: done
                              ? "rgba(34,197,94,0.15)"
                              : current
                                ? "rgba(6,182,212,0.15)"
                                : "rgba(30,41,59,0.8)",
                            border: "2px solid " + stepColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 4px",
                            fontSize: 14,
                            transition: "all 0.2s",
                          }}
                        >
                          {done ? "✓" : index + 1}
                        </div>
                        <div style={{ fontSize: 10, color: stepColor, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {item.name}
                        </div>
                        {current && <div style={{ fontSize: 9, color: cyan, marginTop: 2 }}>推荐</div>}
                        {done && <div style={{ fontSize: 9, color: green, marginTop: 2 }}>已完成</div>}
                      </div>
                      {index < path.length - 1 && (
                        <div
                          style={{
                            width: 20,
                            height: 2,
                            background: done ? "rgba(34,197,94,0.4)" : "rgba(51,65,85,0.4)",
                            flexShrink: 0,
                            margin: "0 2px",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: gray3 }}>
                进度 {learnedCases.length}/{CASE_ORDER.length} · 按推荐顺序学习效果更佳
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 12, paddingBottom: 80 }}>
          <button
            onClick={onRetake}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: "transparent",
              border: "1px solid rgba(100,116,139,0.4)",
              color: gray3,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            重新测评
          </button>
        </div>
      </div>
    </div>
  );
}
