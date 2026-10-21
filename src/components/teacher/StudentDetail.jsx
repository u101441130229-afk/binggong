// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 教师端学生详情：画像摘要、八维均值对比、学习行为与按需生成的教学建议。
import {
  CASES,
  DIMS,
  blue,
  cyan,
  dark2,
  dimMeta,
  gray1,
  gray2,
  gray3,
  green,
  purple,
  red,
  text1,
  text2,
  yellow,
} from "../../constants.js";
import { EVENT_LABELS, formatDateTime } from "../../api/analytics.js";
import XiaoBei from "../XiaoBei.jsx";
import ClassRadar from "./ClassRadar.jsx";

export default function StudentDetail({ student, classRecords, advice, adviceLoading, adviceError, onGenerateAdvice }) {
  return (
    <>
      <div
        style={{
          background: "linear-gradient(135deg," + dark2 + ",rgba(139,92,246,0.08))",
          borderRadius: 16,
          border: "1px solid " + (student.profile ? student.profile.final.color + "44" : "rgba(100,116,139,0.3)"),
          padding: 20,
          marginBottom: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            👤
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: text1 }}>{student.name}</div>
            <div style={{ fontSize: 11, color: gray3, marginTop: 2 }}>
              {student.loginId} · {student.classCode} · {student.major}
            </div>
          </div>
          {student.profile && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 10,
                  color: student.profile.final.color,
                  fontWeight: 700,
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                {student.profile.final.code}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: student.profile.final.color,
                  padding: "4px 12px",
                  background: student.profile.final.color + "18",
                  border: "1px solid " + student.profile.final.color + "33",
                  borderRadius: 999,
                }}
              >
                {student.profile.final.cn}
              </div>
            </div>
          )}
        </div>
        {student.profile ? (
          <>
            <div
              style={{
                fontSize: 13,
                color: text2,
                lineHeight: 1.8,
                padding: "12px 14px",
                background: "rgba(0,0,0,0.2)",
                borderRadius: 10,
                borderLeft: "3px solid " + student.profile.final.color,
              }}
            >
              {student.profile.final.desc}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: gray3,
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span>{student.profile.matchInfo}</span>
              <span>最近测评：{formatDateTime(student.profile.createdAt)}</span>
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: 13,
              color: gray3,
              lineHeight: 1.8,
              padding: "12px 14px",
              background: "rgba(0,0,0,0.2)",
              borderRadius: 10,
            }}
          >
            该生尚未完成测评，暂无画像数据。学生完成测评后，这里会自动显示最新画像。
          </div>
        )}
      </div>

      {student.profile && (
        <>
          <div
            style={{
              background: dark2,
              borderRadius: 14,
              border: "1px solid rgba(51,65,85,0.5)",
              padding: "16px 18px",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, color: text1, fontWeight: 700, marginBottom: 14 }}>八维画像快览</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DIMS.map(function (dim) {
                const level = student.profile.lvls[dim];
                const score = student.profile.raw[dim];
                const levelColor = level === "H" ? green : level === "M" ? yellow : red;
                const levelText = level === "H" ? "高" : level === "M" ? "中" : "低";
                return (
                  <div key={dim} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, fontSize: 10, color: cyan, fontWeight: 700, flexShrink: 0 }}>{dim}</div>
                    <div style={{ flex: 1, fontSize: 11, color: gray3 }}>{dimMeta[dim].name}</div>
                    <div
                      style={{
                        width: 120,
                        height: 6,
                        background: "rgba(30,41,59,0.6)",
                        borderRadius: 999,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: (score / 8) * 100 + "%",
                          height: "100%",
                          background: "linear-gradient(90deg," + levelColor + "88," + levelColor + ")",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        width: 14,
                        fontSize: 13,
                        fontWeight: 800,
                        color: levelColor,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {score}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: levelColor,
                        fontWeight: 700,
                        padding: "2px 8px",
                        background: levelColor + "18",
                        borderRadius: 999,
                        flexShrink: 0,
                      }}
                    >
                      {levelText}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <ClassRadar student={student} classRecords={classRecords} />
        </>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          { label: "测评次数", value: student.assessments.length, color: blue },
          { label: "案例学习", value: student.activityCounts.case_study, color: green },
          { label: "每日问题", value: student.activityCounts.daily_question, color: yellow },
          {
            label: "AI 对话",
            value: student.activityCounts.ai_deepseek + student.activityCounts.ai_qwen,
            color: purple,
          },
        ].map(function (metric) {
          return (
            <div
              key={metric.label}
              style={{
                background: "linear-gradient(135deg," + dark2 + "," + metric.color + "0a)",
                borderRadius: 14,
                padding: 16,
                border: "1px solid " + metric.color + "33",
              }}
            >
              <div style={{ fontSize: 11, color: gray1, marginBottom: 8 }}>{metric.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: metric.color }}>
                {metric.value}
                <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 4 }}>次</span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: dark2,
          borderRadius: 14,
          border: "1px solid rgba(139,92,246,0.15)",
          padding: "14px 18px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 13, color: text1, fontWeight: 700 }}>最近学习记录</div>
          <div style={{ fontSize: 10, color: gray2 }}>仅记录行为类型与时间，不保存对话内容、作答文字或图片</div>
        </div>
        {student.activities.length === 0 ? (
          <div style={{ fontSize: 12, color: gray3, padding: "12px 0" }}>暂无学习行为记录。</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {student.activities
              .slice()
              .sort(function (a, b) {
                return new Date(b.created_at) - new Date(a.created_at);
              })
              .slice(0, 6)
              .map(function (row) {
                const reference =
                  row.event_type === "case_study"
                    ? CASES[row.reference_id]?.name || row.reference_id
                    : row.reference_id || "—";
                return (
                  <div
                    key={row.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      background: "rgba(15,23,42,0.5)",
                      borderRadius: 10,
                      borderLeft: "3px solid rgba(6,182,212,0.4)",
                    }}
                  >
                    <div style={{ fontSize: 12, color: cyan, fontWeight: 600, flexShrink: 0 }}>
                      {EVENT_LABELS[row.event_type] || row.event_type}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: gray3,
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {reference}
                    </div>
                    <div style={{ fontSize: 10, color: gray2, flexShrink: 0 }}>{formatDateTime(row.created_at)}</div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div
        style={{
          background: "rgba(139,92,246,0.06)",
          borderRadius: 14,
          padding: "16px 18px",
          border: "1px solid rgba(139,92,246,0.2)",
          marginBottom: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <XiaoBei size={26} speaking={adviceLoading} />
          <span style={{ fontSize: 13, fontWeight: 700, color: purple }}>AI 个性化教学建议</span>
          <span style={{ fontSize: 10, color: gray2 }}>只在点击后生成，结果不写入数据库</span>
          <button
            onClick={onGenerateAdvice}
            disabled={!student.profile || adviceLoading}
            style={{
              marginLeft: "auto",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              background: student.profile ? "rgba(139,92,246,0.18)" : "rgba(51,65,85,0.4)",
              border: "1px solid " + (student.profile ? "rgba(139,92,246,0.4)" : "rgba(51,65,85,0.4)"),
              color: student.profile ? purple : gray2,
              cursor: student.profile && !adviceLoading ? "pointer" : "not-allowed",
            }}
          >
            {adviceLoading ? "生成中…" : advice ? "重新生成" : "生成建议"}
          </button>
        </div>
        {!student.profile ? (
          <div
            style={{
              fontSize: 12,
              color: gray3,
              padding: "10px 14px",
              background: "rgba(15,23,42,0.5)",
              borderRadius: 10,
            }}
          >
            该生尚未完成测评，暂无法生成教学建议。
          </div>
        ) : adviceLoading ? (
          <div
            style={{
              fontSize: 13,
              color: purple,
              padding: "10px 14px",
              background: "rgba(15,23,42,0.5)",
              borderRadius: 10,
              animation: "pulse 1s infinite",
            }}
          >
            正在根据画像生成建议…
          </div>
        ) : advice ? (
          <div
            style={{
              fontSize: 13.5,
              color: text2,
              lineHeight: 1.85,
              padding: "10px 14px",
              background: "rgba(15,23,42,0.5)",
              borderRadius: 10,
            }}
          >
            {advice}
          </div>
        ) : (
          <div
            style={{
              fontSize: 12,
              color: gray3,
              padding: "10px 14px",
              background: "rgba(15,23,42,0.5)",
              borderRadius: 10,
            }}
          >
            点击右上角“生成建议”，系统将结合该生画像与关注维度给出教学参考。
          </div>
        )}
        {adviceError && <div style={{ marginTop: 8, fontSize: 11, color: red }}>{adviceError}</div>}
      </div>
    </>
  );
}
