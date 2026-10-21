// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 登录后的全局小备问答窗：文字对话面向全部角色，拍照识别仅限学生。
import { useEffect, useRef, useState } from "react";
import { mergeChatHistory, requestAi } from "../api/ai.js";
import { blobToBase64, compressImage } from "../fileUtils.js";
import { cyan, dark1, gray2, gray3, text1, yellow } from "../constants.js";
import XiaoBei from "./XiaoBei.jsx";

const ROLE_CONTEXT = {
  student: "学生用户",
  teacher: "教师用户",
  admin: "学校管理员",
};

const QUICK_QUESTIONS = ["什么是兵工精神？", "北斗系统是怎么建成的？", "军工专业就业方向有哪些？"];

function aiErrorMessage(error) {
  if (error?.kind === "rate_limited") return "今天问得有点多，稍后再来找小备吧。";
  if (error?.kind === "unauthorized" || error?.kind === "forbidden") return "登录状态已失效，请重新登录后再试。";
  return "网络波动，小备暂时离线了，请稍后再试。";
}

export default function XiaoBeiFloat({ role }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        role === "student"
          ? "嗨！我是小备，有任何兵工思政问题都可以问我，也可以点相机识别兵工装备。"
          : "嗨！我是小备，可以和你一起分析兵工思政内容。",
      id: 1,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const scrollRef = useRef(null);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const isStudent = role === "student";

  useEffect(
    function () {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    },
    [messages, loading, open]
  );

  async function handleImage(file) {
    if (!file || !isStudent) return;
    setImageLoading(true);
    const pendingId = Date.now();
    setMessages(function (previous) {
      return [...previous, { role: "assistant", text: "小备正在识别图片，请稍候…", id: pendingId, pending: true }];
    });
    try {
      const compressed = await compressImage(file);
      const base64 = await blobToBase64(compressed);
      const data = await requestAi("/api/qwen-vl", {
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
              {
                type: "text",
                text: "请识别图片中的军事装备或国防相关内容，用中文描述（50字以内），并结合兵工精神给出一句简短点评。如不是军事装备，也请描述并尝试联系国防主题。",
              },
            ],
          },
        ],
        max_tokens: 200,
      });
      const reply = data.choices?.[0]?.message?.content || "小备没能识别出这张图片，换一张试试吧。";
      setMessages(function (previous) {
        return [
          ...previous.filter(function (message) {
            return message.id !== pendingId;
          }),
          { role: "assistant", text: "📷 " + reply, id: Date.now() },
        ];
      });
    } catch (error) {
      setMessages(function (previous) {
        return [
          ...previous.filter(function (message) {
            return message.id !== pendingId;
          }),
          { role: "assistant", text: aiErrorMessage(error), id: Date.now() },
        ];
      });
    } finally {
      setImageLoading(false);
    }
  }

  async function sendMessage(text) {
    const content = String(text || "").trim();
    if (!content || loading || imageLoading) return;
    const userMessage = { role: "user", text: content, id: Date.now() };
    const history = mergeChatHistory(messages);
    setMessages(function (previous) {
      return [...previous, userMessage];
    });
    setInput("");
    setLoading(true);
    try {
      const systemPrompt = `你是“小备”，沈阳理工大学装备工程学院的AI思政学习伙伴，专注于兵工文化、国防精神和思政教育。当前用户身份：${ROLE_CONTEXT[role] || "学生用户"}。用温暖简洁的语气回应，回复控制在120字以内。`;
      const data = await requestAi("/api/deepseek", {
        messages: [{ role: "system", content: systemPrompt }, ...history, { role: "user", content }],
        max_tokens: 250,
      });
      const reply = data.choices?.[0]?.message?.content || "小备暂时离线，请稍后再试。";
      setMessages(function (previous) {
        return [...previous, { role: "assistant", text: reply, id: Date.now() }];
      });
    } catch (error) {
      setMessages(function (previous) {
        return [...previous, { role: "assistant", text: aiErrorMessage(error), id: Date.now() }];
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <div
          onClick={function () {
            setOpen(true);
          }}
          style={{
            position: "fixed",
            bottom: 28,
            right: 24,
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
            animation: "xb-breathe 3s ease-in-out infinite",
          }}
        >
          <div style={{ position: "relative" }}>
            <XiaoBei size={56} speaking={false} />
            <div
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                borderRadius: "50%",
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: "#fff",
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(6,182,212,0.5)",
              }}
            >
              💬
            </div>
          </div>
          <div
            style={{
              fontSize: 10,
              color: cyan,
              fontWeight: 600,
              background: "rgba(6,182,212,0.12)",
              border: "1px solid rgba(6,182,212,0.3)",
              borderRadius: 999,
              padding: "2px 8px",
              whiteSpace: "nowrap",
            }}
          >
            问小备
          </div>
        </div>
      )}

      {open && (
        <>
          <div
            onClick={function () {
              setOpen(false);
            }}
            style={{ position: "fixed", inset: 0, zIndex: 998, background: "rgba(0,0,0,0.5)" }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 0,
              right: 0,
              left: 0,
              zIndex: 999,
              width: "100%",
              maxWidth: 480,
              margin: "0 auto",
              height: "75vh",
              background: dark1,
              borderRadius: "20px 20px 0 0",
              border: "1px solid rgba(6,182,212,0.3)",
              boxShadow: "0 -4px 32px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              animation: "profileGen 0.3s ease both",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid rgba(51,65,85,0.4)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              <XiaoBei size={32} speaking={loading || imageLoading} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: text1 }}>小备</div>
                <div style={{ fontSize: 10, color: loading || imageLoading ? yellow : cyan }}>
                  {loading ? "思考中…" : imageLoading ? "识别中…" : "● 在线"}
                </div>
              </div>
              <button
                onClick={function () {
                  setOpen(false);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: gray2,
                  fontSize: 18,
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {messages.map(function (message) {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      alignItems: "flex-start",
                    }}
                  >
                    {!isUser && <XiaoBei size={24} speaking={false} />}
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "8px 12px",
                        fontSize: 12.5,
                        lineHeight: 1.75,
                        color: text1,
                        borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                        background: isUser ? "rgba(59,130,246,0.2)" : "rgba(6,182,212,0.08)",
                        border: "1px solid " + (isUser ? "rgba(59,130,246,0.3)" : "rgba(6,182,212,0.2)"),
                        whiteSpace: "pre-wrap",
                        opacity: message.pending ? 0.7 : 1,
                      }}
                    >
                      {message.text}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <XiaoBei size={24} speaking={true} />
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "rgba(6,182,212,0.08)",
                      border: "1px solid rgba(6,182,212,0.2)",
                      borderRadius: "4px 12px 12px 12px",
                      display: "flex",
                      gap: 4,
                    }}
                  >
                    {[0, 1, 2].map(function (index) {
                      return (
                        <div
                          key={index}
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: cyan,
                            animation: "pulse 1s " + index * 0.2 + "s infinite",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              {messages.length === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                  {QUICK_QUESTIONS.map(function (question) {
                    return (
                      <button
                        key={question}
                        onClick={function () {
                          sendMessage(question);
                        }}
                        style={{
                          textAlign: "left",
                          padding: "7px 12px",
                          borderRadius: 10,
                          fontSize: 11,
                          background: "rgba(6,182,212,0.06)",
                          border: "1px solid rgba(6,182,212,0.2)",
                          color: cyan,
                          cursor: "pointer",
                        }}
                      >
                        {question}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderTop: "1px solid rgba(51,65,85,0.3)",
                flexShrink: 0,
                display: "flex",
                gap: 8,
              }}
            >
              {isStudent && (
                <>
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={function (event) {
                      if (event.target.files?.[0]) handleImage(event.target.files[0]);
                      event.target.value = "";
                    }}
                  />
                  <input
                    ref={galleryRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={function (event) {
                      if (event.target.files?.[0]) handleImage(event.target.files[0]);
                      event.target.value = "";
                    }}
                  />
                  <button
                    onClick={function () {
                      cameraRef.current?.click();
                    }}
                    disabled={imageLoading || loading}
                    title="拍照识别"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      fontSize: 16,
                      background: "rgba(6,182,212,0.1)",
                      border: "1px solid rgba(6,182,212,0.25)",
                      color: cyan,
                      cursor: imageLoading ? "not-allowed" : "pointer",
                      flexShrink: 0,
                      opacity: imageLoading ? 0.5 : 1,
                    }}
                  >
                    📷
                  </button>
                  <button
                    onClick={function () {
                      galleryRef.current?.click();
                    }}
                    disabled={imageLoading || loading}
                    title="从相册选取"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      fontSize: 16,
                      background: "rgba(139,92,246,0.1)",
                      border: "1px solid rgba(139,92,246,0.25)",
                      color: "#a78bfa",
                      cursor: imageLoading ? "not-allowed" : "pointer",
                      flexShrink: 0,
                      opacity: imageLoading ? 0.5 : 1,
                    }}
                  >
                    🖼️
                  </button>
                </>
              )}
              <input
                value={input}
                onChange={function (event) {
                  setInput(event.target.value);
                }}
                onKeyDown={function (event) {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="问小备任何问题…"
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "8px 12px",
                  borderRadius: 10,
                  fontSize: 16,
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(51,65,85,0.5)",
                  color: text1,
                  outline: "none",
                }}
              />
              <button
                onClick={function () {
                  sendMessage(input);
                }}
                disabled={loading || imageLoading || !input.trim()}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  background:
                    loading || imageLoading || !input.trim()
                      ? "rgba(51,65,85,0.4)"
                      : "linear-gradient(135deg,#3b82f6,#06b6d4)",
                  border: "none",
                  color: loading || imageLoading || !input.trim() ? gray2 : "#fff",
                  cursor: loading || imageLoading || !input.trim() ? "not-allowed" : "pointer",
                }}
              >
                发
              </button>
            </div>
            {isStudent && (
              <div style={{ padding: "0 14px 10px", fontSize: 10, color: gray3 }}>
                图片仅用于本次识别，不会保存到数据库。
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
