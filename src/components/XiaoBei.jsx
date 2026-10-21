// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 小备形象组件：统一使用压缩后的本地图片，并复用全局呼吸与说话动画。
export default function XiaoBei({ size, speaking }) {
  const width = size || 60;
  const height = Math.round(width * 1.167);

  return (
    <img
      src="/xiaobei.webp"
      width={width}
      height={height}
      alt="小备 - 沈阳理工大学装备工程学院官方吉祥物"
      style={{
        display: "block",
        flexShrink: 0,
        animation: speaking ? "xb-speak 2s ease-in-out infinite" : "xb-breathe 3s ease-in-out infinite",
        transformOrigin: "bottom center",
        userSelect: "none",
      }}
    />
  );
}
