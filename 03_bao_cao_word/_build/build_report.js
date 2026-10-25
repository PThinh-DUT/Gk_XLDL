// Dựng file Word báo cáo tổng hợp:  node build_report.js
const fs = require("fs");
const path = require("path");
const L = require("./lib");
const { D } = L;
const { Document, Packer, Footer, Header, Paragraph, TextRun, AlignmentType, PageNumber } = D;
const p1 = require("./part1_theory");
const p2 = require("./part2_review");
const p3 = require("./part3_eval");
const p4 = require("./part4_experiments");

const children = [
  ...p1.cover(), ...p1.guide(), ...p1.chapter1(), ...p1.chapter2(),
  ...p2.chapter3(), ...p2.chapter4(), ...p3.chapter5(),
  ...p4.setup(), ...p4.expA(), ...p4.expB(), ...p4.expC(), ...p4.expD(), ...p4.expE_and_limits(),
  ...p3.chapter7(), ...p3.appendixA(), ...p3.appendixB(), ...p3.appendixC(), ...p3.appendixD(), ...p3.references(),
];

const doc = new Document({
  creator: "Nhóm báo cáo Xử lý dữ liệu", title: "Báo cáo tổng hợp: Hệ thống số Posit cho AI hiệu năng cao",
  description: "Tổng hợp kiến thức từ 21 bài báo và 5 thí nghiệm", features: { updateFields: !process.env.NOUPDATE },
  styles: L.styles, numbering: L.numbering,
  sections: [{
    properties: { page: L.page, titlePage: true },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
      new TextRun({ text: "Hệ thống số Posit cho AI hiệu năng cao — Báo cáo tổng hợp", size: 18, italics: true, color: "7F7F7F" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ children: ["Trang ", PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES], size: 20 })] })] }) },
    children,
  }],
});

const out = process.env.OUT || path.join(__dirname, "..", "Bao_cao_tong_hop_Posit_AI.docx");
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log("Đã ghi", out, (buf.length / 1024).toFixed(0), "KB"); });
