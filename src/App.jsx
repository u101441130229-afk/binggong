// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 应用入口：恢复登录会话，按数据库角色渲染学生端、教师端或学校端。
import { lazy, Suspense, useEffect, useState } from "react";
import { APP_NAME, APP_SHORT_NAME } from "./appInfo.js";
import { onAuthStateChange, restoreSession, signIn, signOut } from "./api/auth.js";
import LoginPage from "./pages/LoginPage.jsx";
import XiaoBeiFloat from "./components/XiaoBeiFloat.jsx";
import { blue, dark0, dark1, gray1, gray2, gray3, purple, text1, yellow } from "./constants.js";

const StudentView = lazy(function () {
  return import("./views/StudentView.jsx");
});
const TeacherView = lazy(function () {
  return import("./views/TeacherView.jsx");
});
const SchoolView = lazy(function () {
  return import("./views/SchoolView.jsx");
});

const ROLE_LABELS = { student: "学生", teacher: "教师", admin: "管理员" };
const ROLE_COLORS = { student: blue, teacher: purple, admin: yellow };
const ROLE_ICONS = { student: "🎓", teacher: "👨‍🏫", admin: "🏫" };

const TAB_CONFIG = {
  student: [{ key: "student", label: "学生端", color: blue }],
  teacher: [{ key: "teacher", label: "教师端", color: purple }],
  admin: [
    { key: "school", label: "学校端", color: yellow },
    { key: "teacher", label: "教师端", color: purple },
  ],
};

function defaultTab(role) {
  return role === "student" ? "student" : role === "teacher" ? "teacher" : "school";
}

function roleSubtitle(profile) {
  if (profile.role === "student") {
    return [profile.major, profile.class_code].filter(Boolean).join(" · ") || "装备工程学院试点组";
  }
  if (profile.role === "teacher") {
    return profile.group_name || "装备工程学院";
  }
  return "系统管理员";
}

function LoadingScreen({ label }) {
  return (
    <div
      style={{
        background: dark0,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        color: gray3,
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: "2px solid rgba(6,182,212,0.25)",
          borderTopColor: "#06b6d4",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <div style={{ fontSize: 12 }}>{label || "加载中…"}</div>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState(null);
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState("student");

  useEffect(function () {
    let mounted = true;
    restoreSession()
      .then(function (result) {
        if (!mounted) return;
        if (result?.profile) {
          setProfile(result.profile);
          setActiveTab(defaultTab(result.profile.role));
        }
      })
      .catch(function () {
        if (mounted) setProfile(null);
      })
      .finally(function () {
        if (mounted) setBooting(false);
      });

    const unsubscribe = onAuthStateChange(function (event) {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setActiveTab("student");
      }
    });
    return function () {
      mounted = false;
      unsubscribe();
    };
  }, []);

  async function handleLogin(loginId, password) {
    const result = await signIn(loginId, password);
    if (!result.ok) {
      const error = new Error(result.kind);
      error.kind = result.kind;
      throw error;
    }
    setProfile(result.profile);
    setActiveTab(defaultTab(result.profile.role));
  }

  async function handleLogout() {
    await signOut();
    setProfile(null);
    setActiveTab("student");
  }

  if (booting) return <LoadingScreen label="正在恢复登录状态…" />;
  if (!profile) return <LoginPage onLogin={handleLogin} />;

  const tabs = TAB_CONFIG[profile.role] || TAB_CONFIG.student;
  const roleColor = ROLE_COLORS[profile.role] || blue;
  const subtitle = roleSubtitle(profile);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: dark0, color: text1 }}>
      <header
        className="app-header"
        style={{
          display: "flex",
          background: dark1,
          borderBottom: "1px solid rgba(51,65,85,0.5)",
          flexShrink: 0,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 10px",
            borderRight: "1px solid rgba(51,65,85,0.4)",
            minWidth: 0,
          }}
        >
          <img
            src="/favicon.png"
            alt=""
            style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
          />
          <div className="app-brand-name" style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: text1, whiteSpace: "nowrap" }} title={APP_NAME}>
              {APP_SHORT_NAME}
            </div>
            <div style={{ fontSize: 9, color: gray2, whiteSpace: "nowrap" }}>AI思政教学</div>
          </div>
        </div>

        {tabs.length > 1 ? (
          <nav style={{ display: "flex", flex: 1, minWidth: 0, overflowX: "auto" }}>
            {tabs.map(function (tab) {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={function () {
                    setActiveTab(tab.key);
                  }}
                  style={{
                    flex: "1 0 auto",
                    minWidth: 88,
                    padding: "13px 14px",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? tab.color : gray1,
                    background: active ? "rgba(59,130,246,0.08)" : "transparent",
                    border: "none",
                    borderBottom: "2px solid " + (active ? tab.color : "transparent"),
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }} />
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "0 10px",
            borderLeft: "1px solid rgba(51,65,85,0.4)",
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: roleColor + "22",
              border: "1px solid " + roleColor + "44",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {ROLE_ICONS[profile.role] || "👤"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: roleColor, whiteSpace: "nowrap" }}>
              {profile.name} · {ROLE_LABELS[profile.role] || "用户"}
            </div>
            <div
              className="app-user-sub"
              style={{
                fontSize: 9,
                color: gray2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 180,
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "13px 12px",
            fontSize: 11,
            color: gray3,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          退出
        </button>
      </header>

      <main className="app-content" style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        <Suspense fallback={<LoadingScreen label="正在加载页面…" />}>
          {activeTab === "student" && <StudentView user={profile} />}
          {activeTab === "teacher" && <TeacherView />}
          {activeTab === "school" && <SchoolView />}
        </Suspense>
      </main>

      <XiaoBeiFloat role={profile.role} />
    </div>
  );
}
