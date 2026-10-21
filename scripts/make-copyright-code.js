// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 生成软件著作权源代码文档：每页 50 行，超过 60 页时取前 30 页与后 30 页。
// 用法：node scripts/make-copyright-code.js

import fs from "node:fs";
import path from "node:path";
import { AlignmentType, Document, Footer, Header, LineRuleType, PageNumber, Packer, Paragraph, TextRun } from "docx";
import { APP_NAME, APP_VERSION } from "../src/appInfo.js";
import { parseCsv } from "./_csv.js";
import { ROOT_DIR, loadEnvFile } from "./_env.js";

const SOURCE_DIRS = ["supabase", "api", "src", "scripts"];
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".css", ".sql"]);
const EXCLUDED_DIRS = new Set(["node_modules", "dist", "dist-ssr", "assets", "copyright", "report"]);
const LINES_PER_PAGE = 50;
const MAX_PAGES = 60;
const CONTENT_WIDTH = 96;
const OUTPUT_DIR = path.join(ROOT_DIR, "copyright");

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      files.push(...collectFiles(fullPath));
      continue;
    }
    const extension = path.extname(entry.name).toLowerCase();
    if (!SOURCE_EXTENSIONS.has(extension)) continue;
    if (entry.name.endsWith(".min.js") || entry.name.endsWith(".min.css")) continue;
    files.push(fullPath);
  }
  return files;
}

function filePriority(relativePath) {
  if (relativePath.startsWith("supabase/")) return 0;
  if (relativePath.startsWith("api/_lib/")) return 1;
  if (relativePath.startsWith("api/")) return 2;
  if (relativePath === "src/appInfo.js") return 3;
  if (relativePath === "src/constants.js") return 4;
  if (relativePath.startsWith("src/api/")) return 5;
  if (relativePath.startsWith("src/pages/")) return 6;
  if (relativePath.startsWith("src/components/")) return 7;
  if (relativePath.startsWith("src/views/")) return 8;
  if (relativePath.startsWith("src/")) return 9;
  return 10;
}

function lineHeader(relativePath, extension) {
  const title = ` ${relativePath} `;
  if (extension === ".sql") {
    return `-- ====================${title}====================`;
  }
  if (extension === ".css") {
    return `/* ====================${title}==================== */`;
  }
  return `// ====================${title}====================`;
}

function displayWidth(char) {
  return /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/.test(
    char
  )
    ? 2
    : 1;
}

function wrapLine(line) {
  const source = line.replace(/\t/g, "  ").replace(/\s+$/, "");
  if (source.trim() === "") return [" "];
  const chunks = [];
  let current = "";
  let width = 0;
  for (const char of source) {
    const charWidth = displayWidth(char);
    if (width + charWidth > CONTENT_WIDTH && current.trim() !== "") {
      chunks.push(current);
      current = "    ";
      width = 4;
    }
    current += char;
    width += charWidth;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

function buildSourceLines() {
  const files = [];
  for (const dir of SOURCE_DIRS) {
    files.push(...collectFiles(path.join(ROOT_DIR, dir)));
  }
  files.sort(function (a, b) {
    const relativeA = path.relative(ROOT_DIR, a).replace(/\\/g, "/");
    const relativeB = path.relative(ROOT_DIR, b).replace(/\\/g, "/");
    const priority = filePriority(relativeA) - filePriority(relativeB);
    return priority !== 0 ? priority : relativeA.localeCompare(relativeB);
  });

  const sourceLines = [];
  let physicalLines = 0;
  files.forEach(function (file, fileIndex) {
    const relativePath = path.relative(ROOT_DIR, file).replace(/\\/g, "/");
    const extension = path.extname(file).toLowerCase();
    if (fileIndex > 0) sourceLines.push("");
    sourceLines.push(lineHeader(relativePath, extension));
    const content = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = content.split("\n");
    while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
    for (const line of lines) {
      physicalLines += 1;
      sourceLines.push(...wrapLine(line));
    }
  });
  return { sourceLines, physicalLines, fileCount: files.length };
}

function verifyNoPrivateData(text) {
  loadEnvFile();
  const secrets = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.DEEPSEEK_API_KEY,
    process.env.DASHSCOPE_API_KEY,
  ].filter(function (value) {
    return typeof value === "string" && value.length >= 20;
  });
  for (const secret of secrets) {
    if (text.includes(secret)) {
      throw new Error("源文件中检测到密钥值，已停止生成文档");
    }
  }
  if (/sb_secret_[A-Za-z0-9_-]{10,}/.test(text) || /sk-[A-Za-z0-9]{20,}/.test(text)) {
    throw new Error("源文件中检测到疑似密钥，已停止生成文档");
  }

  // 文档只收录源代码目录，不含名册；此处再核验一遍学号未被误写入。
  const rosterPath = path.join(ROOT_DIR, "private", "roster.csv");
  if (!fs.existsSync(rosterPath)) return;
  const rows = parseCsv(fs.readFileSync(rosterPath, "utf8"));
  for (const row of rows.slice(1)) {
    const studentNo = (row[0] || "").trim();
    if (studentNo && text.includes(studentNo)) {
      throw new Error(`源文件中检测到学号 ${studentNo}，已停止生成文档`);
    }
  }
}

function buildParagraphs(lines) {
  return lines.map(function (line, index) {
    return new Paragraph({
      pageBreakBefore: index > 0 && index % LINES_PER_PAGE === 0,
      spacing: { before: 0, after: 0, line: 200, lineRule: LineRuleType.EXACT },
      children: [
        new TextRun({
          text: line || " ",
          font: "Consolas",
          size: 16,
        }),
      ],
    });
  });
}

function buildHeader() {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: `${APP_NAME} ${APP_VERSION}`,
            font: "宋体",
            size: 18,
          }),
        ],
      }),
    ],
  });
}

function buildFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "第 ", font: "宋体", size: 18 }),
          new TextRun({ children: [PageNumber.CURRENT], font: "宋体", size: 18 }),
          new TextRun({ text: " 页 / 共 ", font: "宋体", size: 18 }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "宋体", size: 18 }),
          new TextRun({ text: " 页", font: "宋体", size: 18 }),
        ],
      }),
    ],
  });
}

async function main() {
  const collected = buildSourceLines();
  const allLines = collected.sourceLines;
  const originalPages = Math.ceil(allLines.length / LINES_PER_PAGE);
  let documentLines = allLines;
  if (originalPages > MAX_PAGES) {
    const half = (MAX_PAGES / 2) * LINES_PER_PAGE;
    documentLines = allLines.slice(0, half).concat(allLines.slice(-half));
  }

  verifyNoPrivateData(documentLines.join("\n"));

  const document = new Document({
    creator: APP_NAME,
    title: `${APP_NAME} ${APP_VERSION} 源代码文档`,
    description: `${APP_NAME} ${APP_VERSION} 软件著作权源代码`,
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        headers: { default: buildHeader() },
        footers: { default: buildFooter() },
        children: buildParagraphs(documentLines),
      },
    ],
  });

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, "源代码文档.docx");
  const buffer = await Packer.toBuffer(document);
  fs.writeFileSync(outputPath, buffer);

  console.info(`已收录文件 ${collected.fileCount} 个，源代码 ${collected.physicalLines} 行`);
  console.info(`排版后共 ${originalPages} 页；提交页数 ${Math.ceil(documentLines.length / LINES_PER_PAGE)} 页`);
  console.info(
    originalPages > MAX_PAGES ? `已按要求取前 30 页与后 30 页（共 ${MAX_PAGES} 页）` : "未超过 60 页，已提交全部源代码"
  );
  console.info(`文档已生成：${path.relative(ROOT_DIR, outputPath)}`);
}

main().catch(function (error) {
  console.error(`生成源代码文档失败：${error.message}`);
  process.exitCode = 1;
});
