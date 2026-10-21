// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 前端入口：挂载根组件并加载全局样式。
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
