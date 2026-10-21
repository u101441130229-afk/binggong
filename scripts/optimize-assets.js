// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 静态资源压缩脚本：favicon 瘦身、案例与画像图转 WebP、小备图落盘。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");

async function compressFavicon() {
  const source = path.join(publicDir, "favicon.png");
  const temp = path.join(publicDir, "favicon.optimized.png");
  await sharp(source)
    .resize(256, 256, { fit: "cover" })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(temp);
  const before = fs.statSync(source).size;
  const after = fs.statSync(temp).size;
  if (after < 50 * 1024) {
    fs.renameSync(temp, source);
    console.info(`favicon.png ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`);
  } else {
    fs.unlinkSync(temp);
    console.info(`favicon.png 压缩后仍为 ${Math.round(after / 1024)}KB，保留原文件`);
  }
}

async function convertDirectory(dir, quality, maxWidth) {
  const files = fs.readdirSync(dir).filter(function (name) {
    return /\.(jpe?g|png)$/i.test(name);
  });
  for (const name of files) {
    const source = path.join(dir, name);
    const target = source.replace(/\.(jpe?g|png)$/i, ".webp");
    await sharp(source).resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality }).toFile(target);
    const before = fs.statSync(source).size;
    const after = fs.statSync(target).size;
    console.info(
      `${path.relative(root, source)} -> .webp ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`
    );
  }
}

async function dumpXiaoBei() {
  const constantsPath = path.join(root, "src/constants.js");
  const text = fs.readFileSync(constantsPath, "utf8");
  const match = text.match(/export const XIAOBEI_IMG = "data:image\/png;base64,([^"]+)";/);
  if (!match) {
    console.info("未找到内嵌小备图片，跳过");
    return;
  }
  const source = path.join(root, "xiaobei.source.png");
  const target = path.join(publicDir, "xiaobei.webp");
  fs.writeFileSync(source, Buffer.from(match[1], "base64"));
  await sharp(source).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 90 }).toFile(target);
  fs.unlinkSync(source);
  console.info(`小备图已输出 public/xiaobei.webp ${Math.round(fs.statSync(target).size / 1024)}KB`);
}

async function main() {
  await compressFavicon();
  await convertDirectory(path.join(publicDir, "cases"), 78, 1280);
  await convertDirectory(path.join(publicDir, "profiles"), 82, 900);
  await dumpXiaoBei();
}

main().catch(function (error) {
  console.error(error.message);
  process.exitCode = 1;
});
