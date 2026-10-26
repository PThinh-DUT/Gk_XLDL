// Dựng file Word "Khung slide đề xuất":  node build_slides.js
const fs = require("fs");
const path = require("path");
const L = require("./lib");
const { D, P, H1, H1c, H2, H3, B, N, T, BOX, SP, FIG } = L;
const { Document, Packer, Footer, Paragraph, TextRun, AlignmentType, PageNumber, PageOrientation } = D;

const DEMO = path.join(__dirname, "..", "..", "02_demo");
const J = (f) => JSON.parse(fs.readFileSync(path.join(DEMO, "results", f), "utf8"));
const has = (f) => fs.existsSync(path.join(DEMO, "results", f));
const f2 = (x) => Number(x).toFixed(2), f1 = (x) => Number(x).toFixed(1);
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

// ---------- số liệu thực nghiệm (đọc động)
const base = mean(Object.values(J("01_baselines.json")).map((v) => v.test_acc));
const Bd = J("04_expB_weight_ptq.json");
const bget = (fmt, sc) => Bd.B2_sweep.find((r) => r.format === fmt && r.scale === sc) || Bd.B1.find((r) => r.format === fmt && r.scale === sc);
let Ctxt = "(đang chạy)", C1txt = "", Dtxt = "(đang chạy)", Drows = [];
if (has("05_expC_quire.json")) {
  const c = J("05_expC_quire.json"); const agg = {};
  for (const r of c.C2_network) (agg[`${r.format}|${r.accum}`] ||= []).push(r.acc);
  const m = (f, a) => (agg[`${f}|${a}`] ? f1(mean(agg[`${f}|${a}`])) : "—");
  Ctxt = `posit⟨8,1⟩: quire ${m("posit8_1", "quire")}% · FMA ${m("posit8_1", "fma")}% · nhân/cộng riêng ${m("posit8_1", "sep")}%; posit⟨8,0⟩: ${m("posit8_0", "quire")} / ${m("posit8_0", "fma")} / ${m("posit8_0", "sep")}%; FP8 E4M3: ${m("fp8e4m3", "quire")} / ${m("fp8e4m3", "fma")} / ${m("fp8e4m3", "sep")}%; INT8: ${m("int8", "quire")}%; FP32: ${f1(base)}%`;
  const k = c.C1_dot_product.filter((r) => r.format === "posit8_1");
  C1txt = `Tích vô hướng posit⟨8,1⟩ dài K = ${k[k.length - 1].K}: sai số quire ${f1(100 * k[k.length - 1].median_rel_err_quire)}% vs FMA ${f1(100 * k[k.length - 1].median_rel_err_fma)}%`;
}
if (has("06_expD_training.json")) {
  const d = J("06_expD_training.json").filter((r) => r.seed === 0);
  Drows = d.map((r) => [r.config, f2(r.history[r.history.length - 1].test_acc) + "%"]);
  Dtxt = d.map((r) => `${r.config}: ${f1(r.history[r.history.length - 1].test_acc)}%`).join(" · ");
}

// ---------- một slide = một bảng 2 cột
let sno = 0;
function SLIDE(title, o) {
  sno += 1;
  const rows = [["Mục", `Slide ${sno} — ${title}`]];
  rows.push(["Bố cục template", o.layout]);
  rows.push(["Nội dung hiển thị", o.show.join("\n")]);
  if (o.visual) rows.push(["Hình / bảng", o.visual]);
  rows.push(["Nguồn (chân slide)", o.src || "—"]);
  rows.push(["Lời thuyết trình", o.say]);
  rows.push(["Người nói · thời lượng", o.who]);
  if (o.ref) rows.push(["Đọc thêm trong báo cáo", o.ref]);
  return [new Paragraph({ children: [], spacing: { after: 60 } }), T(rows, [1.5, 6.5], { size: 19, keepTogether: true })];
}

const intro = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "KHUNG SLIDE ĐỀ XUẤT", bold: true, size: 36, color: L.ACCENT })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: "Nghiên cứu, đánh giá hệ thống số Posit và các phương pháp tối ưu cho mô hình AI hiệu năng cao", italics: true, size: 26 })] }),
  P("Tài liệu này là **sườn slide do nhóm đề xuất lại**, xây dựng trên sườn ban đầu của bạn cùng nhóm (file gốc được giữ nguyên, không chỉnh sửa) nhưng: (1) **sửa các chỗ trích dẫn sai**, (2) **bổ sung 15 bài báo** chưa dùng, (3) **thay \"kết quả chạy thử\" trích từ bài báo bằng kết quả nhóm tự chạy**, (4) **gán từng slide vào một bố cục của template Canva** (file PDF 15 trang bạn đề xuất)."),
  H2("Nguyên tắc trình bày"),
  B("**Mỗi khẳng định có nguồn**: ghi [mã bài] ở chân slide; mã = số đầu tên file trong `papers_download`. Chi tiết số trang tra trong báo cáo Word."),
  B("**Ít chữ trên slide**: tối đa 4–5 gạch đầu dòng, mỗi dòng ≤ 15 từ; phần giải thích nằm trong lời thuyết trình (cột \"Lời thuyết trình\")."),
  B("**Ngôn ngữ**: template Canva bằng tiếng Anh — đề xuất **giữ tiêu đề song ngữ** (ví dụ \"Problem Statement – Đặt vấn đề\"), nội dung tiếng Việt, thuật ngữ chuyên ngành giữ tiếng Anh (posit, regime, quire, es…). Nhóm chốt lại theo yêu cầu của thầy."),
  B("**Hình**: các hình thực nghiệm có sẵn trong `02_demo/figures` (PNG 200 dpi, nền trắng — hợp tông xám–xanh navy của template)."),
  B("**Thời lượng**: 24 slide chính ≈ 20 phút (≈ 50 giây/slide) + 2 slide dự phòng cho phần hỏi đáp."),
  H2("So sánh với sườn ban đầu"),
  T([["Sườn ban đầu (12 slide)", "Sườn đề xuất (24 + 2 slide)", "Lý do"],
    ["Slide 1–4: bìa, đặt vấn đề, lịch sử, cấu trúc", "Slide 1–8: thêm mục lục, mục tiêu, ví dụ giải mã, hình độ chính xác thon dần, quire/es/NaR", "Thầy đánh giá cao phần \"hiểu được\" → cần ví dụ cụ thể và hình nhóm tự vẽ"],
    ["Slide 5: tổng quan (gộp)", "Slide 9–10: tách suy luận / huấn luyện, dùng 15 bài thay vì 3", "Sườn cũ ghi sai nguồn (Deep Positron, PositNN, Deep PeNSieve)"],
    ["Slide 6–8: ưu, nhược, bảng", "Slide 11–13: giữ, mỗi ý có bằng chứng + số trang; thêm bằng chứng ngược chiều [44]", "Đánh giá khách quan"],
    ["Slide 9–10: PLAM, es = 0", "Slide 14–17: 4 hướng tối ưu (phần cứng, định dạng thích ứng, tích hợp, huấn luyện)", "Đúng tên đề tài \"các phương pháp tối ưu\"; sửa \"PLAU\" → PLAM"],
    ["Slide 11: \"chạy thử nghiệm thực tế\" (thực ra số của [11])", "Slide 18–21: 5 thí nghiệm nhóm tự chạy, kiểm chứng với SoftPosit", "Trung thực, có giá trị \"tự làm\""],
    ["Slide 12: kết luận", "Slide 22–24: kết luận, hướng cuối kỳ, cảm ơn", "—"]], [2.6, 3.4, 2.4], { size: 18 }),
  H2("Phân công đề xuất"),
  T([["Người", "Phần", "Slide", "Ghi chú tài liệu cần đọc kỹ"],
    ["Bạn A", "Mở đầu, lý thuyết posit, tổng quan, ưu/nhược", "1–13", "[S1], [03], [04], [05], [06], [08], [11], [18], [42], [43], [44], [46]; báo cáo Chương 1–3, 5"],
    ["Bạn B", "Phương pháp tối ưu, thực nghiệm, kết luận", "14–24", "[07], [12], [21], [27], [33], [35], [36], [40], [48]; báo cáo Chương 4, 6, 7; thư mục 02_demo"],
    ["Cả hai", "Hỏi đáp", "—", "Phần \"Chuẩn bị hỏi đáp\" cuối tài liệu này"]], [1, 2.6, 0.8, 4], { size: 18 }),
];

const slides = [
  H1("Chi tiết từng slide"),
  H3("PHẦN I — MỞ ĐẦU"),
  ...SLIDE("Trang bìa", { layout: "Trang 1 (Title) — đổi \"Posit Number\" thành tên đề tài; bỏ logo Borcelle, thay logo trường",
    show: ["Nghiên cứu, đánh giá hệ thống số Posit", "và các phương pháp tối ưu cho mô hình AI hiệu năng cao", "Học phần: Xử lý dữ liệu · GVHD: … · Nhóm: … · 10/2026"],
    say: "Chào thầy và các bạn. Nhóm em trình bày đề tài về hệ thống số posit — một cách biểu diễn số thực mới thay cho chuẩn IEEE 754 — và các phương pháp tối ưu để dùng nó cho mô hình AI hiệu năng cao.", who: "A · 20 s" }),
  ...SLIDE("Nội dung trình bày", { layout: "Trang 2 (Overview — danh sách 01–10)",
    show: ["01 Đặt vấn đề · 02 Posit là gì · 03 Lịch sử · 04 Tổng quan nghiên cứu · 05 Ưu – nhược điểm", "06 Phương pháp tối ưu · 07 Thực nghiệm · 08 Kết quả · 09 Kết luận · 10 Hỏi đáp"],
    say: "Bài gồm năm phần: vì sao cần định dạng số mới; posit là gì; các nghiên cứu đã làm và đánh giá; các phương pháp tối ưu mới nhất; và các thí nghiệm nhóm tự chạy để kiểm chứng.", who: "A · 20 s" }),
  ...SLIDE("Đặt vấn đề – AI ngày càng \"đắt\"", { layout: "Trang 6 (Problem Statement — 2 mục 01/02)",
    show: ["01 Mô hình lớn, năng lượng nằm ở dữ liệu: GPT-3 175 tỉ tham số; đọc SRAM 16-bit = 80× năng lượng 1 phép MAC; nhân FP32 tốn ~4× FP16",
      "02 IEEE 754 không tối ưu cho DL: dải 80 bậc (thừa) · độ chính xác \"phẳng\" · FP32 có 16.7 triệu mẫu NaN · ±0, subnormal"],
    src: "[11] tr.1 · [33] tr.2 · [06] tr.1 · [03] tr.2 · [21] tr.2",
    say: "Mô hình càng lớn thì chi phí càng lớn, và phần tốn nhất là di chuyển dữ liệu. Vì vậy giảm số bit mỗi số là hướng hiệu quả. Nhưng chuẩn IEEE 754 được thiết kế cho tính toán khoa học: dải giá trị khổng lồ, độ chính xác tương đối gần đồng đều trong miền số chuẩn, nhiều mẫu bit lãng phí — không khớp với dữ liệu của mạng nơ-ron.", who: "A · 60 s", ref: "Báo cáo Chương 1" }),
  ...SLIDE("Mục tiêu & phương pháp", { layout: "Trang 7 (Research Objectives — 4 dòng)",
    show: ["Q1 Posit là gì, khác IEEE 754 ở đâu?", "Q2 Bằng chứng nào cho posit trong suy luận & huấn luyện (cả chiều ngược)?", "Q3 Phương pháp tối ưu mới nhất 2019–2026?", "Q4 Tự kiểm chứng bằng thực nghiệm", "Phương pháp: đọc 21 bài · ma trận bằng chứng · 5 thí nghiệm (đã kiểm chứng với SoftPosit)"],
    say: "Nhóm đặt bốn câu hỏi. Để trả lời, nhóm đọc 21 bài báo từ 2018 đến 2026, lập bảng mỗi khẳng định gắn nguồn và số trang, rồi tự viết bộ mô phỏng posit để chạy 5 thí nghiệm.", who: "A · 40 s" }),
  H3("PHẦN II — POSIT LÀ GÌ"),
  ...SLIDE("Lịch sử phát triển", { layout: "Trang 9 (Theoretical Framework — sơ đồ hộp nối tiếp) dùng làm dòng thời gian",
    show: ["2015 Unum I (độ dài thay đổi) → 2016 Unum II (bảng tra) → 2017 Posit = Unum III (Gustafson) → 2019 FPGA, huấn luyện đầu tiên → 2022 Posit Standard (es = 2) → 2024–26 Logarithmic Posit, SPADE"],
    src: "[S1] · [03] tr.2 · [05] tr.2 · [18] tr.2 · [35] · [48]",
    say: "Posit là thế hệ thứ ba của họ unum do John Gustafson đề xuất năm 2017. Hai thế hệ trước khó cài đặt phần cứng. Từ 2019 bắt đầu có phần cứng FPGA, năm 2022 có chuẩn chính thức với es bằng 2, và gần đây là các biến thể như logarithmic posit và bộ MAC đa độ chính xác.", who: "A · 50 s", ref: "Mục 2.1" }),
  ...SLIDE("Cấu trúc một số posit", { layout: "Trang 5 (Introduction — hộp chữ + ảnh) — thay ảnh cầu thang bằng sơ đồ 4 trường bit",
    show: ["Sign | Regime (độ dài thay đổi) | Exponent (≤ es bit) | Fraction", "Số dương hữu hạn: x = useed^k × 2^e × (1 + f), useed = 2^(2^es); số âm giải mã độ lớn từ bù hai", "Ví dụ posit⟨8,1⟩ 0|10|1|0101: k = 0, e = 1, f = 5/16 → 2.625", "Chỉ 2 giá trị đặc biệt: 0 và NaR"],
    visual: "02_demo/figures/slide_posit_bit_layout.png (sơ đồ 4 trường bit + ví dụ)", src: "[03] tr.2 · [06] tr.1 · [44] tr.9",
    say: "Khác float, posit có thêm trường regime với độ dài thay đổi, đếm số bit giống nhau liên tiếp. Số càng gần 1 thì regime càng ngắn, còn nhiều bit cho phần lẻ nên chính xác hơn. Ví dụ chuỗi 01010101 là 2.625 — đây cũng là giá trị posit 8 bit gần số e nhất.", who: "A · 70 s", ref: "Mục 2.2–2.3" }),
  ...SLIDE("Độ chính xác thon dần (tapered precision)", { layout: "Trang 12 (Research Results — biểu đồ + đoạn chữ)",
    show: ["Posit: chính xác nhất quanh ±1, thô dần ra hai phía · FP8: phẳng · INT8: dồn về đầu lớn", "Activation LeNet-5 ≈ 1 → đúng vùng vàng", "Trọng số ≈ 0.04 → lệch vùng vàng → cần co giãn"],
    visual: "02_demo/figures/slide_number_line.png (trục số log — dễ hiểu nhất) và/hoặc A_tapered_precision.png (nhóm tự vẽ)", src: "Thí nghiệm A của nhóm · [42] tr.5 · [08] tr.3",
    say: "Đây là hình nhóm tự vẽ. Trục ngang là độ lớn theo log 2. Phía trên là số chữ số chính xác của từng định dạng 8 bit; phía dưới là phân bố giá trị thật của mạng LeNet-5. Activation nằm đúng vùng posit chính xác nhất, nhưng trọng số nằm lệch trái — điều này giải thích vì sao các nghiên cứu phải co giãn trọng số theo lớp.", who: "A · 70 s", ref: "Mục 2.5" }),
  ...SLIDE("Quire, es và các phép toán đặc biệt", { layout: "Trang 3 (Table of Contents — 4 ô đánh số 01–04)",
    show: ["01 Quire: cộng dồn chính xác trong giới hạn dung lượng, làm tròn khi xuất (n²/2 bit theo chuẩn cũ; 16n bit theo chuẩn 2022)", "02 es: đánh đổi dải động ↔ độ chính xác; es = 0 sụp ở ResNet-50", "03 Ngoài dải hữu hạn: bão hòa maxpos/minpos; vẫn có sai số và mất thông tin", "04 es = 0: sigmoid = (X ⊕ 2^(n−1)) >> 2"],
    src: "[43] tr.3 · [11] tr.2 · [43] tr.5 · [12] tr.2 · [05] tr.7",
    say: "Bốn đặc điểm cần nhớ. Quire là thanh ghi rộng giúp cộng dồn chính xác trong giới hạn dung lượng, rồi làm tròn khi xuất kết quả. Tham số es quyết định dải động: posit 8 bit với es bằng 0 làm ResNet-50 sụp hoàn toàn. Với đầu vào hữu hạn khác 0, bộ lượng tử hóa bão hòa về maxpos/minpos thay vì sinh vô cùng hoặc làm tròn về 0; điều này vẫn gây sai số. Và với es bằng 0, hàm sigmoid chỉ cần 2 phép toán bit — nhóm đã kiểm chứng sai số lớn nhất khoảng 0.06.", who: "A · 70 s", ref: "Mục 2.6–2.9" }),
  H3("PHẦN III — TỔNG QUAN NGHIÊN CỨU & ĐÁNH GIÁ"),
  ...SLIDE("Tổng quan nghiên cứu — Suy luận", { layout: "Trang 8 (Significance — hộp + ảnh) hoặc slide trắng với bảng",
    show: ["2018 [01] Lưu trọng số: posit 5–7 bit = fixed 7–11 bit", "2019 [03][04] Deep Positron (FPGA, MLP): posit 8-bit ≥ float/fixed", "2018 [43] ResNet-50 ImageNet: posit(8,1) −0.87%; posit(8,0) sụp", "2019 [07] 5-bit CIFAR-10: posit 41% / float 13% / fixed 10%", "2022 [18] Kalray: es = 0 làm sụp VGG16; es = 1, 2 giữ nguyên"],
    src: "[01] tr.3 · [04] tr.6 · [43] tr.5 · [07] tr.7 · [18] tr.5",
    say: "Với suy luận, posit 8 bit với es phù hợp và bộ cộng dồn chính xác giữ được độ chính xác FP32, kể cả trên ResNet-50 ImageNet. Ưu thế so với float rõ nhất khi chỉ còn 5–6 bit. Lưu ý: Deep Positron thử trên mạng MLP nhỏ, không phải CNN như sườn cũ ghi.", who: "A · 60 s", ref: "Mục 3.2" }),
  ...SLIDE("Tổng quan nghiên cứu — Huấn luyện", { layout: "Như slide trước",
    show: ["[06] 16-bit: posit 96.5% vs float16 90.6% (MNIST)", "[08] ImageNet ResNet-18 posit16: 71.09% = FP32 (warm-up + co giãn theo lớp)", "[11] posit(8,0) thuần: kẹt 10% · hỗn hợp O12L10: 90.25% (FP32 90.42%)", "[40] GAN: posit 8-bit ≈ FP16, FP8 thất bại"],
    src: "[06] tr.2 · [08] tr.4 · [11] tr.3–4 · [40] tr.5",
    say: "Với huấn luyện: 16 bit posit đủ để đạt như FP32, kể cả ImageNet. Nhưng 8 bit thuần thì thất bại — con số 10% là của bài PositNN. Muốn dùng 8 bit phải kết hợp độ chính xác hỗn hợp: optimizer 12 bit, loss 10 bit. Nhóm kiểm chứng xu hướng bằng mô phỏng khác ở phần sau; chưa tái lập chính xác bài báo.", who: "A · 60 s", ref: "Mục 3.3" }),
  ...SLIDE("Điểm mạnh", { layout: "Trang 14 (Conclusion — 3 mục có ảnh nhỏ)",
    show: ["Nhiều thông tin/bit quanh ±1: 8-bit có 6 bit chính xác vs 5 (float)", "Dải động rộng: posit⟨8,2⟩ 14.45 bậc > FP16 12.04", "Ngoại lệ đơn giản; quire; sigmoid bằng thao tác bit; bền với lỗi lật bit (> 95%)"],
    src: "[42] tr.5 · [18] tr.4 · [43] · [46] tr.4", say: "Ba nhóm điểm mạnh: mỗi bit chứa nhiều thông tin hơn ở vùng giá trị hay gặp; dải động rộng hơn cả FP16 dù chỉ 8 bit; và thiết kế gọn — chỉ hai giá trị đặc biệt, có quire, có phép toán bit nhanh, lại bền hơn với lỗi phần cứng.", who: "A · 50 s", ref: "Mục 5.1" }),
  ...SLIDE("Điểm yếu & khoảng trống", { layout: "Trang 13 (Recommendations — 2 thẻ ảnh)",
    show: ["Chưa có phần cứng phổ biến: mô phỏng huấn luyện CifarNet ~10 ngày", "Giải mã regime tốn mạch: posit32 +30% LUT, +27% DSP so với FPU (RISC-V thật) — \"not spectacular\"", "≤ 8 bit es = 0 sụp; huấn luyện 8-bit thuần thất bại; quire ~10× diện tích", "Khoảng trống: LLM/Transformer, chip thật, so sánh công bằng với INT/FP8 có hiệu chỉnh"],
    src: "[36] tr.4 · [44] tr.1, 11 · [43] · [11] · [44] tr.3", say: "Điểm yếu lớn nhất là chưa có phần cứng: chạy mô phỏng rất chậm. Khi làm phần cứng thật trên RISC-V, posit 32 bit chỉ nhanh hơn chút nhưng tốn thêm 30% tài nguyên — chính tác giả gọi là không ngoạn mục. Ngoài ra posit ít bit dễ sụp và quire rất tốn diện tích.", who: "A · 60 s", ref: "Mục 5.2, 5.4" }),
  ...SLIDE("Bảng đánh giá tổng hợp", { layout: "Slide bảng (dùng nền Trang 8)",
    show: ["Bảng 7 tiêu chí × 6 định dạng (FP32, FP16/BF16, INT8, FP8, Posit8, Posit16) — bản rút gọn của Bảng \"Đánh giá tổng hợp\" trong báo cáo Mục 5.3"],
    src: "Tổng hợp của nhóm từ Chương 3–5", say: "Tóm lại: posit 8 bit mạnh về bộ nhớ và độ chính xác suy luận nếu chọn es đúng, nhưng yếu ở hỗ trợ phần cứng và huấn luyện; posit 16 bit tốt cho huấn luyện. Đây là đánh giá định tính của nhóm dựa trên các bằng chứng vừa trình bày.", who: "A → B · 40 s", ref: "Mục 5.3" }),
  H3("PHẦN IV — CÁC PHƯƠNG PHÁP TỐI ƯU"),
  ...SLIDE("Bốn hướng tối ưu", { layout: "Trang 4 (câu trích dẫn lớn, \"We bend so we don't break\") làm slide chuyển phần",
    show: ["1 Phần cứng tính toán · 2 Định dạng thích ứng · 3 Tích hợp hệ thống · 4 Kỹ thuật huấn luyện"],
    say: "Để khắc phục các điểm yếu đó, tài liệu đề xuất bốn hướng tối ưu.", who: "B · 15 s", ref: "Chương 4" }),
  ...SLIDE("Hướng 1 — Tối ưu phần cứng", { layout: "Trang 10 (Methodology — 2 hộp) hoặc trang 14 (3 mục)",
    show: ["PLAM: nhân xấp xỉ bằng cộng; −72.86% diện tích, −81.79% công suất bộ nhân 32-bit so với posit chính xác; kiểm thử AI trong bài dùng 16-bit", "Quire nhỏ 15 bit thay 63 bit: −43% diện tích MAC", "SPADE (preprint 2026, cần thận trọng): 1 MAC chạy 1×P32 / 2×P16 / 4×P8; 28 nm, 6.1 mW"],
    src: "[36] tr.1, 4 · [27] tr.3 · [48] tr.4",
    say: "Hướng một tối ưu phần cứng. PLAM dùng xấp xỉ logarit của Mitchell: nhân hai phần lẻ được thay bằng cộng, giảm gần 3/4 diện tích và hơn 80% công suất so với bộ nhân posit chính xác. Lưu ý sườn cũ ghi nhầm là PLAU. Thứ hai, thu nhỏ quire từ 63 xuống 15 bit. Thứ ba, bộ MAC SIMD chạy được cả 8, 16 và 32 bit.", who: "B · 70 s", ref: "Mục 4.1" }),
  ...SLIDE("Hướng 2 — Định dạng & lượng tử hóa thích ứng", { layout: "Trang 9 (sơ đồ 3 hộp nối tiếp)",
    show: ["Co giãn lũy thừa 2 theo lớp: MNIST 5-bit es = 0: 91% → 98%", "Adaptive Posit (2020) → ALPS (2021) → Logarithmic Posit (DAC 2024)", "ALPS: +14% vs posit; LP: CNN ImageNet giảm 0.74–1.29 điểm; ViT-B giảm 4.39 điểm, 2× TOPS/mm²"],
    src: "[07] tr.8 · [08] tr.4 · [33] · [12] tr.6 · [35] tr.5",
    say: "Hướng hai là đưa dữ liệu về vùng posit chính xác nhất, hoặc ngược lại dịch vùng chính xác của posit về chỗ dữ liệu. Đơn giản nhất là nhân với lũy thừa của 2 theo từng lớp — trong phần cứng chỉ là cộng vào số mũ. Phức tạp hơn là các định dạng posit thích ứng, mới nhất là logarithmic posit năm 2024.", who: "B · 60 s", ref: "Mục 4.2" }),
  ...SLIDE("Hướng 3 & 4 — Tích hợp hệ thống và huấn luyện", { layout: "Trang 10 (Methodology — 2 hộp 01/02)",
    show: ["01 Tích hợp: lưu Posit8 → giải nén FP16 cho tensor core (Kalray); vector hóa RISC-V ≈ ARM SVE; lưu 8-bit tính 16-bit không mất độ chính xác", "02 Huấn luyện: warm-up FP32 · es = 2 cho gradient · optimizer 12-bit, loss 10-bit · loss scaling về vùng 2^−4…2^4"],
    src: "[18] · [21] · [44] tr.9 · [08] · [11] · [40]",
    say: "Hướng ba là tận dụng phần cứng sẵn có: dùng posit để nén khi lưu trữ rồi giải nén ra FP16. Hướng bốn là các kỹ thuật giúp huấn luyện 8 bit: khởi động bằng FP32, es lớn hơn cho gradient, và dùng nhiều bit hơn cho bước cập nhật trọng số.", who: "B · 60 s", ref: "Mục 4.3–4.4" }),
  H3("PHẦN V — THỰC NGHIỆM CỦA NHÓM"),
  ...SLIDE("Thiết lập thực nghiệm", { layout: "Trang 10 (Methodology — hộp \"Research\" và \"Action\")",
    show: ["Research: LeNet-5 (61 706 tham số) · Fashion-MNIST · Apple M2 CPU · PyTorch", `Mô hình gốc FP32: ${f2(base)}% (TB 3 seed)`, "Bộ mô phỏng posit của nhóm không sai khác với SoftPosit/PyTorch trên bộ kiểm chứng đã chạy", "Action: 5 thí nghiệm A–E (độ chính xác thon dần, lượng tử hóa, quire, huấn luyện, sigmoid)"],
    src: "02_demo/results/00_validation.json", say: "Nhóm tự viết bộ mô phỏng posit và kiểm chứng với thư viện chuẩn SoftPosit trên toàn bộ mẫu bit — không sai một giá trị nào. Sau đó chạy 5 thí nghiệm trên LeNet-5 và Fashion-MNIST, cùng bộ dữ liệu với nhiều bài báo để so sánh.", who: "B · 50 s", ref: "Mục 6.1–6.3" }),
  ...SLIDE("Kết quả TN B — Lượng tử hóa trọng số", { layout: "Trang 12 (Research Results — biểu đồ + chữ)",
    show: [`8 bit: mọi định dạng ≈ FP32 (${f1(base)}%)`, `4 bit, không hiệu chỉnh: posit⟨4,1⟩ ${f1(bget("posit4_1", "none").acc_mean)}% vs FP4 ${f1(bget("fp4e2m1", "none").acc_mean)}%`, `4 bit, có co giãn: INT ${f1(bget("int4", "mse").acc_mean)}% ≈ FP ${f1(bget("fp4e2m1", "pow2").acc_mean)}% ≈ posit ${f1(bget("posit4_1", "pow2").acc_mean)}%`, "Sai số trọng số 8-bit: posit+co giãn 1.02% < INT8 1.17% < FP8 2.64%"],
    visual: "02_demo/figures/B_bit_sweep.png (+ B_weight_error_8bit.png nếu còn chỗ)", src: "Thí nghiệm B · đối chiếu [07], [12]",
    say: "Kết quả thú vị: ở 8 bit mọi định dạng đều như nhau. Khi giảm còn 4 bit mà không hiệu chỉnh, posit vượt trội nhờ dải động tự nhiên. Nhưng nếu cho phép co giãn theo lớp thì INT và FP bắt kịp. Nghĩa là lợi thế của posit nằm ở chỗ không cần hiệu chỉnh và giữ thông tin tốt hơn — khớp với nhận định của bài ALPS.", who: "B · 70 s", ref: "Mục 6.5" }),
  ...SLIDE("Kết quả TN C — Quire có quan trọng không?", { layout: "Trang 12 (Research Results)",
    show: [C1txt || "(đang chạy)", Ctxt],
    visual: "02_demo/figures/C2_network_quire.png và C1_dot_product.png", src: "Thí nghiệm C · đối chiếu [43] tr.3, [03]",
    say: "Thí nghiệm C cho trọng số và activation đều 8 bit, so sánh cộng dồn bằng quire với cách làm tròn sau mỗi phép cộng. Với tích vô hướng dài, sai số khi không có quire tăng rất nhanh — đúng hiện tượng c cộng ab bằng c mà bài của Facebook mô tả.", who: "B · 70 s", ref: "Mục 6.6" }),
  ...SLIDE("Kết quả TN D — Huấn luyện 8-bit", { layout: "Trang 12 (Research Results)",
    show: [Dtxt, "10 epoch · seed 0 · fake quantization; MAC và cross-entropy FP32", "Kiểm chứng xu hướng; không tái lập chính xác PositNN; chưa đo phần cứng"],
    visual: "02_demo/figures/D_training_curves.png", src: "Thí nghiệm D · đối chiếu [11] Bảng 2–4, [06]",
    say: "Thí nghiệm D mô phỏng lượng tử hóa khi huấn luyện LeNet-5 từ đầu; conv/linear và cross-entropy vẫn tính FP32. Đây là phần nhóm tự kiểm chứng con số 10% của bài PositNN và cấu hình hỗn hợp O12L10 của họ. Lưu ý: posit⟨8,2⟩ thuần của nhóm đạt 82% trong khi PositNN chỉ 19% — hai triển khai khác nhau về vị trí làm tròn và toán tử. Chưa tách riêng nguyên nhân của chênh lệch này; không coi kết quả nhóm là cận trên của bài báo.", who: "B · 70 s", ref: "Mục 6.7" }),
  H3("PHẦN VI — KẾT LUẬN"),
  ...SLIDE("Kết luận", { layout: "Trang 14 (Conclusion — 3 mục)",
    show: ["Posit có lợi trong một số cấu hình ít bit; lợi ích phụ thuộc scaling và bộ cộng dồn", "Trên LeNet-5/Fashion-MNIST đã thử: hỗn hợp đạt 90.07%, FP32 đạt 90.66% (seed 0)", "Rào cản: phần cứng & hệ sinh thái; xu hướng: định dạng lai lấy cảm hứng từ posit"],
    say: "Kết luận: posit là một ý tưởng tốt với bằng chứng rõ ở độ chính xác rất thấp, nhưng chưa thay thế ngay được FP16 hay INT8 do thiếu phần cứng. Các ý tưởng của nó — độ chính xác thon dần và cộng dồn chính xác — đang được đưa vào các định dạng thế hệ mới.", who: "B · 50 s", ref: "Chương 7" }),
  ...SLIDE("Hướng phát triển (cuối kỳ)", { layout: "Trang 13 (Recommendations — 2 thẻ)",
    show: ["Mở rộng ResNet-18/CIFAR-10, áp dụng Posit Standard 2022 (es = 2)", "Thử PLAM ở 8-bit; generalized posit (sc, rs) theo ALPS ở 4–6 bit", "Khảo sát RTL bộ giải mã posit trên FPGA / RISC-V"],
    say: "Giai đoạn cuối kỳ nhóm dự định mở rộng thí nghiệm lên mạng lớn hơn và thử các phương pháp tối ưu đã tìm hiểu trong bộ mô phỏng của mình.", who: "B · 30 s", ref: "Mục 7.2" }),
  ...SLIDE("Cảm ơn & Hỏi đáp", { layout: "Trang 15 (Thank You)",
    show: ["Cảm ơn thầy và các bạn đã lắng nghe!", "Tài liệu: báo cáo Word + 02_demo (mã nguồn chạy lại được)"],
    say: "Em xin cảm ơn thầy và các bạn. Nhóm sẵn sàng trả lời câu hỏi.", who: "Cả nhóm" }),
  H3("SLIDE DỰ PHÒNG (chỉ mở khi được hỏi)"),
  ...SLIDE("Dự phòng — Sigmoid nhanh (TN E)", { layout: "Slide hình",
    show: ["σ_fast = (X ⊕ 2^(n−1)) >> 2; sai số max 0.061 (posit⟨8,0⟩); tanh của [40]: 0.0980 → 0.0379 — trùng bài báo"], visual: "02_demo/figures/E_fast_sigmoid.png", src: "Thí nghiệm E · [05], [40]", say: "Dùng khi được hỏi về es = 0 và hàm kích hoạt nhanh.", who: "B" }),
  ...SLIDE("Dự phòng — Tài liệu tham khảo chính", { layout: "Slide chữ nhỏ",
    show: ["[S1] Gustafson & Yonemoto 2017 · [03] DATE 2019 · [08] 2019 · [11] ICASSP 2021 · [36] IEEE TETC 2021 · [43] FAIR 2018 · [44] 2021 · [18] CoNGA 2022 · [35] DAC 2024 · [48] 2026"],
    say: "Danh mục đầy đủ có trong báo cáo Word.", who: "—" }),
];

const qa = [
  H1("Chuẩn bị hỏi đáp (dự kiến câu hỏi của thầy)"),
  T([["Câu hỏi", "Trả lời gợi ý", "Nguồn"],
    ["Posit khác float ở điểm cốt lõi nào?", "Trường regime độ dài thay đổi → độ chính xác thon dần (cao quanh ±1), dải động rộng hơn; chỉ 2 giá trị đặc biệt; làm tròn bão hòa, không tràn.", "Mục 2.2–2.6"],
    ["Vì sao GPU/CPU chưa dùng posit?", "Phải viết lại toàn bộ phần cứng & phần mềm; giải mã regime tốn mạch (posit32 +30% LUT trên RISC-V); lợi ích ở 16–32 bit không lớn; FP16/BF16/INT8 đã đủ tốt và có hệ sinh thái.", "[44]; [05] tr.9"],
    ["Quire là gì, bao nhiêu bit?", "Thanh ghi fixed-point đủ rộng để cộng dồn chính xác tích vô hướng, làm tròn 1 lần. Chuẩn nháp cũ n²/2 (posit8: 32 bit); chuẩn 2022: 16n bit. Tốn ~10× diện tích nên có hướng thu nhỏ quire.", "[11] tr.2; [44] tr.3; [27]"],
    ["Chọn es thế nào? Chuẩn 2022 là gì?", "es nhỏ: chính xác hơn quanh 1, rẻ phần cứng nhưng dải hẹp; es lớn: dải rộng. Thực nghiệm: es = 1 tốt cho trọng số/activation 5–8 bit, es = 2 cho gradient. Chuẩn 2022 cố định es = 2.", "[04] tr.8; [08] tr.4; [18] tr.2"],
    ["Posit có thắng INT8 không?", "Ở 8 bit suy luận mạng nhỏ: ngang nhau (TN B). Ở 4–5 bit không hiệu chỉnh posit thắng rõ; có hiệu chỉnh thì INT/FP bắt kịp. Posit giữ thông tin/bit tốt hơn khi dữ liệu được đưa về gần 1.", "TN B; [12]"],
    ["Vì sao posit 8-bit huấn luyện thất bại?", "Gradient rất nhỏ; trọng số cập nhật bằng 8 bit không đủ phân giải nên bước cập nhật bị làm tròn mất; posit không underflow nên giá trị tí hon bị đẩy lên minpos. Cần mixed precision.", "[11] tr.4; [05] tr.9; TN D"],
    ["Sao posit⟨8,2⟩ thuần của nhóm đạt 82% mà PositNN chỉ 19.39%?", "Nhóm mô phỏng bằng PyTorch: chỉ làm tròn dữ liệu ở biên các tensor (trọng số, activation, gradient, trạng thái optimizer); tích vô hướng, softmax/cross-entropy vẫn tính FP32. PositNN tính mọi phép toán bằng posit, tránh float trung gian. Các khác biệt triển khai có thể ảnh hưởng kết quả nhưng chưa được cô lập bằng ablation. Trong lần chạy của nhóm, mixed precision cải thiện accuracy; chưa chứng minh kết quả là cận trên của bài báo.", "[11] tr.2, tr.4 Bảng 3; Mục 6.7"],
    ["PLAM sai số 11.1% có làm hỏng mạng không?", "Với posit 16-bit, độ chính xác giảm tối đa 0.42 điểm; chưa có kiểm chứng ở 8-bit — là khoảng trống, nhóm dự định thử cuối kỳ.", "[36] tr.5"],
    ["Thí nghiệm của nhóm có đáng tin?", "Bộ mô phỏng không sai khác với SoftPosit trên các phép thử đã chạy; dữ liệu MD5 khớp; 3 mô hình gốc (báo cáo TB ± độ lệch chuẩn); mã nguồn chạy lại được. Hạn chế: D chỉ seed 0; mạng nhỏ, chưa đo năng lượng/tốc độ phần cứng; kiểm chứng định dạng không đảm bảo toàn pipeline đúng.", "Mục 6.3, 6.9"],
    ["Posit⟨8,2⟩ dải rộng hơn FP16 sao lại kém chính xác hơn?", "Dải động khác độ chính xác: posit⟨8,2⟩ chỉ có tối đa 3 bit phần lẻ, FP16 có 10 bit. Dải rộng giúp không tràn, không giúp phân giải.", "Bảng thuộc tính Mục 2.4; [43] tr.2"],
    ["NaR khác NaN thế nào?", "NaR là 1 mẫu bit duy nhất (10…0) cho mọi ngoại lệ, kể cả ∞; float32 có ~16.7 triệu mẫu NaN và ±∞ riêng.", "[06] tr.1; [21] tr.2"],
    ["Có ứng dụng công nghiệp chưa?", "Kalray (Pháp) đề xuất lệnh giải nén Posit8 → FP16 cho bộ xử lý MPPA3; còn lại chủ yếu là FPGA/ASIC nghiên cứu, lõi RISC-V.", "[18]; [44]; [21]"],
    ["Sườn ban đầu ghi \"PLAU\", \"Deep PeNSieve\"…?", "Nhóm đã kiểm tra lại: tên đúng là PLAM; kỹ thuật warm-up + layer-wise scaling là của Lu et al. [08]; Deep Positron là MLP không phải CNN.", "Phụ lục A báo cáo"]], [2.2, 4.6, 1.6], { size: 18 }),
  H2("Danh sách kiểm tra trước buổi thuyết trình"),
  B("Mỗi slide có [mã nguồn] ở chân trang; tra được số trang trong báo cáo Word."),
  B("Thay toàn bộ chữ \"Lorem ipsum\", \"Borcelle University\", \"Samira hadid\", \"12 March 2030\" trong template."),
  B("Chèn hình từ `02_demo/figures` (đúng tỉ lệ, không kéo méo)."),
  B("Tập nói theo cột \"Lời thuyết trình\", canh giờ ≈ 20 phút."),
  B("Mang theo laptop có sẵn thư mục `02_demo` để demo chạy lại `01_validate_formats.py` (< 1 phút) nếu thầy yêu cầu."),
];

const doc = new Document({
  creator: "Nhóm báo cáo Xử lý dữ liệu", title: "Khung slide đề xuất – Posit cho AI", styles: L.styles, numbering: L.numbering,
  sections: [{ properties: { page: L.page }, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: ["Trang ", PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES], size: 20 })] })] }) },
  children: [...intro, ...slides, ...qa] }],
});
const out = process.env.OUT || path.join(__dirname, "..", "Khung_slide_de_xuat.docx");
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log("Đã ghi", out, (buf.length / 1024).toFixed(0), "KB"); });
