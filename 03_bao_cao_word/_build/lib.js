// Thư viện dựng tài liệu Word (docx-js) dùng chung cho báo cáo và khung slide.
const fs = require("fs");
const path = require("path");
const D = require("docx");
const {
  Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, ImageRun, LevelFormat, VerticalAlign, PageBreak,
  Math: OMath, MathRun, MathSuperScript, MathSubScript, MathFraction,
} = D;

const FONT = "Times New Roman";
const PAGE_W = 11906, MARGIN_L = 1701, MARGIN_R = 1134; // A4, lề trái 3 cm, phải 2 cm
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;            // 9071 DXA
const ACCENT = "1F3864", SHADE = "DCE6F2", NOTE_SHADE = "F2F2F2", WARN_SHADE = "FFF4E5";

// ---------- chữ có định dạng nội dòng: **đậm**, *nghiêng*, ^{trên}, _{dưới}, `mã`
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+?\*\*|\*[^*]+\*|\^\{[^}]+\}|_\{[^}]+\}|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith("**")) out.push(...runs(t.slice(2, -2), { ...base, bold: true }));
    else if (t.startsWith("^{")) out.push(new TextRun({ text: t.slice(2, -1), superScript: true, ...base }));
    else if (t.startsWith("_{")) out.push(new TextRun({ text: t.slice(2, -1), subScript: true, ...base }));
    else if (t.startsWith("`")) out.push(new TextRun({ text: t.slice(1, -1), font: "Consolas", size: 22, ...base }));
    else out.push(...runs(t.slice(1, -1), { ...base, italics: true }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}

// Danh sách đánh số tự bắt đầu lại từ 1 khi bị ngắt bởi phần tử khác
let listInst = 0, listBroken = true;
const brk = (x) => { listBroken = true; return x; };
const P = (text, opt = {}) => brk(new Paragraph({
  children: runs(text, opt.run || {}), alignment: opt.align || AlignmentType.JUSTIFIED,
  spacing: { after: opt.after ?? 120, before: opt.before ?? 0 }, indent: opt.indent,
  keepNext: opt.keepNext,
}));
const H1 = (t) => brk(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)], pageBreakBefore: true }));
const H1c = (t, pb = false) => brk(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)], pageBreakBefore: pb }));
const H2 = (t) => brk(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)], keepNext: true }));
const H3 = (t) => brk(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)], keepNext: true }));
const B = (text, level = 0) => brk(new Paragraph({ numbering: { reference: "bullets", level }, children: runs(text),
  spacing: { after: 60 }, alignment: AlignmentType.JUSTIFIED }));
const N = (text, ref = "numbers", level = 0) => {
  if (listBroken) { listInst += 1; listBroken = false; }
  return new Paragraph({ numbering: { reference: ref, level, instance: listInst },
    children: runs(text), spacing: { after: 60 }, alignment: AlignmentType.JUSTIFIED });
};
const PB = () => new Paragraph({ children: [new PageBreak()] });

// ---------- bảng
const border = { style: BorderStyle.SINGLE, size: 4, color: "A6A6A6" };
const borders = { top: border, bottom: border, left: border, right: border };
function cell(text, w, opt = {}) {
  const paras = String(text).split("\n").map((line) => new Paragraph({
    children: runs(line, { size: opt.size || 20, bold: opt.bold, color: opt.color }),
    alignment: opt.align || AlignmentType.LEFT, spacing: { after: 0 }, keepNext: opt.keepNext,
  }));
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
    shading: opt.fill ? { fill: opt.fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 50, bottom: 50, left: 90, right: 90 }, children: paras,
    columnSpan: opt.span,
  });
}
// rows: mảng các mảng chuỗi; hàng đầu là tiêu đề. widths: tỉ lệ tương đối.
function T(rows, widths, opt = {}) {
  listBroken = true;
  const total = opt.width || CONTENT_W;
  const sum = widths.reduce((a, b) => a + b, 0);
  const w = widths.map((x) => Math.floor((x / sum) * total));
  w[w.length - 1] += total - w.reduce((a, b) => a + b, 0);
  const size = opt.size || 20;
  const trs = rows.map((r, i) => new TableRow({
    tableHeader: i === 0, cantSplit: true,
    children: r.map((c, j) => cell(c, w[j], {
      size, bold: i === 0, fill: i === 0 ? SHADE : (opt.highlight && opt.highlight(i, j) ? "FFF2CC" : undefined),
      align: i === 0 || (opt.center && opt.center.includes(j)) ? AlignmentType.CENTER : AlignmentType.LEFT,
      keepNext: opt.keepTogether && i < rows.length - 1,
    })),
  }));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: w, rows: trs });
}
// hộp ghi chú 1 ô
function BOX(title, lines, kind = "note") {
  listBroken = true;
  const fill = kind === "warn" ? WARN_SHADE : NOTE_SHADE;
  const children = [new Paragraph({ children: runs(title, { bold: true, size: 22, color: ACCENT }), spacing: { after: 60 } })];
  for (const l of lines) children.push(new Paragraph({ children: runs(l, { size: 22 }), spacing: { after: 40 },
    alignment: AlignmentType.JUSTIFIED }));
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W], rows: [
    new TableRow({ cantSplit: true, children: [new TableCell({
      borders: { top: border, bottom: border, right: border,
        left: { style: BorderStyle.SINGLE, size: 24, color: kind === "warn" ? "E36C09" : ACCENT } },
      width: { size: CONTENT_W, type: WidthType.DXA }, shading: { fill, type: ShadingType.CLEAR, color: "auto" },
      margins: { top: 100, bottom: 100, left: 160, right: 160 }, children })] })] });
}
const SP = (after = 120) => new Paragraph({ children: [], spacing: { after } });

// ---------- hình
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
let figNo = 0, tabNo = 0;
function FIG(file, caption, maxWpx = 600) {
  listBroken = true;
  if (!fs.existsSync(file)) return [P(`[Hình chưa có: ${path.basename(file)}]`, { run: { color: "C00000" } })];
  const { w, h } = pngSize(file);
  const width = Math.min(maxWpx, 620), height = Math.round((width * h) / w);
  figNo += 1;
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { after: 60, before: 120 },
      children: [new ImageRun({ type: "png", data: fs.readFileSync(file), transformation: { width, height },
        altText: { title: caption, description: caption, name: path.basename(file) } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: runs(`**Hình ${figNo}.** ${caption}`, { size: 22, italics: false }) }),
  ];
}
function TCAP(caption) {
  tabNo += 1;
  return new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 160, after: 80 },
    children: runs(`**Bảng ${tabNo}.** ${caption}`, { size: 22 }) });
}

// ---------- công thức (OMML)
const r = (t) => new MathRun(t);
const sup = (b, s) => new MathSuperScript({ children: Array.isArray(b) ? b : [r(b)], superScript: Array.isArray(s) ? s : [r(s)] });
const sub = (b, s) => new MathSubScript({ children: Array.isArray(b) ? b : [r(b)], subScript: Array.isArray(s) ? s : [r(s)] });
const frac = (n, d) => new MathFraction({ numerator: Array.isArray(n) ? n : [r(n)], denominator: Array.isArray(d) ? d : [r(d)] });
let eqNo = 0;
function EQ(parts, label = true) {
  eqNo += 1;
  const children = [new OMath({ children: parts })];
  if (label) children.push(new TextRun({ text: `\t(${eqNo})` }));
  return new Paragraph({ alignment: AlignmentType.CENTER, children, spacing: { before: 80, after: 120 },
    tabStops: [{ type: "right", position: CONTENT_W }] });
}

const numbering = {
  config: [
    { reference: "bullets", levels: [
      { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
      { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 1000, hanging: 270 } } } }] },
    { reference: "numbers", levels: [
      { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
  ],
};
const styles = {
  default: { document: { run: { font: FONT, size: 26 }, paragraph: { spacing: { line: 312 } } } },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 32, bold: true, font: FONT, color: ACCENT }, paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 28, bold: true, font: FONT, color: ACCENT }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 26, bold: true, italics: true, font: FONT, color: "2E2E2E" }, paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
  ],
};
const page = { size: { width: PAGE_W, height: 16838 }, margin: { top: 1134, bottom: 1134, left: MARGIN_L, right: MARGIN_R } };

module.exports = { D, P, H1, H1c, H2, H3, B, N, PB, T, BOX, SP, FIG, TCAP, EQ, r, sup, sub, frac, runs,
  numbering, styles, page, CONTENT_W, ACCENT, FONT };
