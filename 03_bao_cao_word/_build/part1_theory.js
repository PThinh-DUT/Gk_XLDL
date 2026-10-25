// Phần 1: Bìa, hướng dẫn đọc, Chương 1 (Đặt vấn đề), Chương 2 (Hệ thống số Posit)
const path = require("path");
const fs = require("fs");
const L = require("./lib");
const { D, P, H1, H1c, H2, H3, B, N, T, BOX, SP, FIG, TCAP, EQ, r, sup, sub, frac } = L;
const { Paragraph, TextRun, AlignmentType, TableOfContents } = D;

const DEMO = path.join(__dirname, "..", "..", "02_demo");
const J = (f) => JSON.parse(fs.readFileSync(path.join(DEMO, "results", f), "utf8"));

function cover() {
  const c = (t, size, opt = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: opt.after ?? 120, before: opt.before ?? 0 },
    children: [new TextRun({ text: t, size, bold: opt.bold, color: opt.color, italics: opt.italics })] });
  return [
    c("TRƯỜNG ĐẠI HỌC BÁCH KHOA – ĐẠI HỌC ĐÀ NẴNG", 26, { bold: true }),
    c("Học phần: Xử lý dữ liệu", 26, { after: 1200 }),
    c("BÁO CÁO TỔNG HỢP KIẾN THỨC", 30, { bold: true, color: L.ACCENT }),
    c("(Tài liệu đọc kèm slide thuyết trình giữa kỳ)", 24, { italics: true, after: 600 }),
    c("NGHIÊN CỨU, ĐÁNH GIÁ HỆ THỐNG SỐ POSIT", 36, { bold: true, color: L.ACCENT, after: 80 }),
    c("VÀ CÁC PHƯƠNG PHÁP TỐI ƯU CHO MÔ HÌNH AI HIỆU NĂNG CAO", 32, { bold: true, color: L.ACCENT, after: 1200 }),
    c("Sinh viên thực hiện: ………………………………………………", 26),
    c("………………………………………………", 26, { after: 240 }),
    c("Giảng viên hướng dẫn: ………………………………………………", 26, { after: 1600 }),
    c("Đà Nẵng, tháng 10/2026", 26, { italics: true }),
  ];
}

function guide() {
  return [
    H1c("Hướng dẫn đọc tài liệu", true),
    P("Tài liệu này tổng hợp **toàn bộ những gì nhóm tìm hiểu được** từ 21 bài báo khoa học trong thư mục `papers_download` cùng kết quả **5 thí nghiệm do nhóm tự thực hiện**. Slide thuyết trình chỉ trình bày ý chính; khi cần hiểu sâu một ý, hãy tra mục tương ứng ở đây."),
    B("**Quy ước trích dẫn:** [NN] là **số đầu tên file** trong thư mục `papers_download` (ví dụ [36] ↔ `36_PLAM_A_Posit_Logarithm-Approximate_Multiplier.pdf`). Nhờ vậy mở đúng bài báo rất nhanh. Nguồn nằm ngoài thư mục ký hiệu [S1], [S2]…"),
    B("**\"tr.X\"** là **số trang của file PDF** (trang thứ X khi mở file), không phải số trang in trên tạp chí."),
    B("Mọi con số trích từ bài báo đều được nhóm **đọc lại tại trang gốc**. Khi nhóm **tự tính lại** (ví dụ phần trăm chênh lệch) sẽ ghi rõ \"nhóm tính\". Các chỗ bài báo tự mâu thuẫn hoặc có lỗi số liệu được đánh dấu ⚠ và tổng hợp ở Phụ lục A."),
    B("Kết quả thực nghiệm của nhóm nằm ở Chương 6; mã nguồn và số liệu gốc ở thư mục `02_demo` (chạy lại được, xem Phụ lục D)."),
    B("Ghi chú chi tiết từng bài báo (1–2 trang/bài) nằm ở thư mục `01_ghi_chu_bai_bao`."),
    SP(),
    BOX("Tóm tắt 6 thông điệp chính", [
      "1. **Posit** (Gustafson, 2017) là định dạng số thực thay thế IEEE 754: dùng trường **regime** độ dài thay đổi nên có **độ chính xác thon dần** — rất chính xác quanh ±1, thô dần ở hai đầu — và chỉ có 2 giá trị đặc biệt (0 và NaR).",
      "2. Ở **8 bit trở lên**, posit, FP8 và INT8 cho độ chính xác suy luận gần như nhau trên mạng nhỏ; **lợi thế của posit rõ nhất ở ≤ 6 bit** và khi **không có bước hiệu chỉnh/co giãn** [07], [12], (Thí nghiệm B).",
      "3. **Quire** (bộ cộng dồn chính xác) là thành phần then chốt: không có nó, sai số tích vô hướng 8-bit tăng mạnh theo độ dài vector (Thí nghiệm C) — nhưng quire tốn phần cứng [44], [27].",
      "4. **Huấn luyện thuần posit 8-bit thất bại**; cần posit 16-bit hoặc **độ chính xác hỗn hợp** (optimizer/loss 10–12 bit), co giãn theo lớp, warm-up [08], [11], [40], (Thí nghiệm D).",
      "5. **Phương pháp tối ưu mới**: nhân xấp xỉ logarit (PLAM) [36], quire nhỏ [27], MAC SIMD đa độ chính xác [48], định dạng posit thích ứng (Adaptive Posit, ALPS, Logarithmic Posit) [33], [12], [35], giải nén Posit8→FP16 [18], vector hóa RISC-V [21].",
      "6. **Điểm yếu lớn nhất**: chưa có phần cứng phổ biến; mô phỏng phần mềm rất chậm (huấn luyện CifarNet ~10 ngày [36]); mạch giải mã regime tốn tài nguyên; posit 32-bit trên RISC-V chỉ thắng float \"không ngoạn mục\" [44].",
    ]),
    new Paragraph({ children: [], pageBreakBefore: true }),
    new Paragraph({ children: [new TextRun({ text: "MỤC LỤC", bold: true, size: 30, color: L.ACCENT })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
    new TableOfContents("Mục lục", { hyperlink: true, headingStyleRange: "1-3" }),
    P("(Nếu mục lục trống: trong Word nhấn chuột phải vào vùng này → Update Field → Update entire table.)", { run: { italics: true, size: 20 } }),
  ];
}

function chapter1() {
  return [
    H1("Chương 1. Đặt vấn đề"),
    H2("1.1. Mô hình AI ngày càng lớn – bài toán chi phí tính toán"),
    P("Các mạng nơ-ron sâu (DNN) đạt độ chính xác cao nhờ số tham số và số phép tính khổng lồ. Một số con số được các bài báo trong bộ tài liệu dẫn ra:"),
    TCAP("Quy mô một số mô hình được nêu trong tài liệu"),
    T([["Mô hình", "Quy mô", "Nguồn"],
      ["AlexNet", "~61 triệu tham số, ~1.4 GFLOPS mỗi ảnh", "[07] tr.1"],
      ["VGG-16", "~138 triệu tham số, ~15 300 triệu phép nhân–cộng", "[44] tr.1"],
      ["LSTM mixture-of-experts", "~137 tỉ tham số; dịch máy ở FP32 tốn ~128 W chỉ cho truy cập DRAM", "[03] tr.1"],
      ["GPT-3", "175 tỉ tham số; huấn luyện ước tính 355 năm trên 1 GPU V100, ~4.6 triệu USD", "[11] tr.1"],
      ["Seq2seq nhận dạng tiếng nói", "> 30 triệu tham số → ~120 MB ở FP32", "[42] tr.1"],
      ["Triển khai trên vi điều khiển ARM M-7", "cần ~153.5× bộ nhớ và ~4× công suất so với ngân sách", "[12] tr.1"]], [2.2, 4.6, 1.2]),
    P("Với thiết bị biên (điện thoại, IoT, xe tự hành), khoảng cách giữa nhu cầu của mô hình và tài nguyên phần cứng là rất lớn [06], [07]. **Giảm số bit biểu diễn mỗi số** (low-precision arithmetic) là hướng tiếp cận được đánh giá cao vì cùng lúc giảm bộ nhớ, băng thông, độ trễ và năng lượng của các phép nhân–cộng (MAC) [06] tr.1, [07] tr.1."),
    H2("1.2. Năng lượng nằm ở đâu? – Vì sao số bit quan trọng"),
    B("Ở công nghệ 45 nm, chuyển từ float16 lên float32 làm **năng lượng phép cộng tăng 2×** và **phép nhân tăng ~4×**; đọc bộ nhớ 1 MB tốn **~10×** so với bộ nhớ 8 kB [06] tr.1, [07] tr.1."),
    B("Ở 28 nm, **một lần đọc SRAM 16-bit tốn ~80× năng lượng một phép MAC**, đọc DRAM tốn **~2.6 bậc độ lớn** (khoảng 400×) [33] tr.2 → **di chuyển dữ liệu mới là phần tốn kém nhất** [43] tr.1."),
    B("Trong một bộ MAC int8/32 ở 28 nm, **riêng bộ nhân chiếm 63.4% công suất tổ hợp** [43] tr.4; trong bộ nhân posit⟨32,2⟩, **bộ nhân phần định trị chiếm 67.8% diện tích và 79% công suất** [36] tr.1."),
    P("Do đó, một định dạng số **mang nhiều thông tin hơn trên mỗi bit** cho phép dùng ít bit hơn mà vẫn giữ độ chính xác → tiết kiệm trực tiếp bộ nhớ và năng lượng. Đây chính là luận điểm cốt lõi của posit."),
    H2("1.3. Hạn chế của chuẩn IEEE 754 đối với học sâu"),
    P("Chuẩn IEEE 754 (1985, sửa đổi 2008, 2019) là chuẩn số thực của mọi CPU/GPU hiện nay. Các bài báo chỉ ra những điểm không tối ưu khi dùng cho DNN:"),
    N("**Dải động quá thừa:** float32 phủ hơn **80 bậc độ lớn** (khoảng 10^{−38}…10^{38}, tính cả subnormal là 10^{−45}) trong khi tham số DNN chỉ tập trung trong vài bậc → \"thông tin trên mỗi bit\" thấp theo nghĩa entropy Shannon [03] tr.2, [04] tr.2."),
    N("**Độ chính xác phẳng:** float32 có **cùng** 23 bit định trị ở 10^{−10} cũng như ở 10^{10} [43] tr.2, trong khi trọng số/activation lại dồn quanh một vùng hẹp."),
    N("**Lãng phí mẫu bit cho NaN:** float32 có **2 × (2^{23} − 1) = 16 777 214** mẫu NaN (nhóm tính; [21] tr.2 nêu \"hàng triệu\"); float 8-bit kiểu IEEE (4 bit mũ, 3 bit định trị) lãng phí **~6%** số mã cho NaN [43] tr.2."),
    N("**Hai số 0** (+0 và −0), **tràn trên thành ±∞ và tràn dưới thành 0**, **số dưới chuẩn (subnormal)** tốn mạch phần cứng [03] tr.2, [05] tr.2."),
    N("**Tính tái lập kém và làm tròn ở mỗi phép toán:** cùng một chương trình trên hai máy có thể cho kết quả khác nhau; phép cộng float không có tính kết hợp → tổng phụ thuộc thứ tự [05] tr.1–2, [43] tr.3."),
    H2("1.4. Các hướng giảm độ chính xác đang được dùng và giới hạn của chúng"),
    TCAP("Các định dạng độ chính xác thấp phổ biến (tổng hợp từ tài liệu)"),
    T([["Hướng", "Ý tưởng", "Giới hạn được nêu", "Nguồn"],
      ["FP16 + loss scaling", "Tính FP16, cập nhật trọng số FP32, nhân loss để tránh gradient underflow", "Cần trọng số chính FP32, loss scaling động; FP16 thuần huấn luyện kém", "[06] tr.2, [08] tr.2"],
      ["BF16 (bfloat16)", "Giữ 8 bit mũ như FP32, chỉ 7 bit định trị", "Độ chính xác thấp; vẫn 16 bit", "[06] tr.2, [07] tr.3"],
      ["INT8 / fixed-point", "Lượng tử hóa đều với hệ số co giãn", "Lưới đều không khớp phân bố không đều; cần hiệu chỉnh, đôi khi huấn luyện lại", "[01] tr.1, [43] tr.1"],
      ["FP8 (HFP8, E4M3/E5M2)", "Float 8 bit, 2 biến thể cho forward/backward", "Dải động hẹp; huấn luyện GAN thất bại", "[40] tr.2, tr.5"],
      ["Block floating point", "Nhiều giá trị dùng chung một số mũ (Flexpoint, Brainwave)", "Phải cập nhật hệ số chia sẻ theo thống kê → tăng phức tạp", "[07] tr.3, [33] tr.2"],
      ["**Posit** (đề tài này)", "Độ chính xác thon dần, ít ngoại lệ, có quire", "Phần cứng chưa phổ biến; giải mã phức tạp (Chương 5)", "[S1], các bài còn lại"]], [1.6, 2.8, 2.8, 1.3], { size: 19 }),
    H2("1.5. Mục tiêu và câu hỏi nghiên cứu"),
    P("Đề tài trả lời bốn câu hỏi:"),
    N("**Posit là gì**, khác IEEE 754 ở đâu, vì sao được cho là hợp với học sâu? (Chương 2)"),
    N("**Bằng chứng thực nghiệm** đã công bố về posit cho suy luận và huấn luyện nói gì — kể cả bằng chứng **ngược chiều**? (Chương 3, 5)"),
    N("**Các phương pháp tối ưu mới nhất** (2019–2026) để khắc phục điểm yếu của posit là gì? (Chương 4)"),
    N("Nhóm có **tự tái hiện** được các kết luận chính bằng thí nghiệm của mình không? (Chương 6)"),
    H2("1.6. Phương pháp thực hiện"),
    B("**Thu thập & đọc kỹ 21 bài báo** (2018–2026): ghi chú theo mẫu thống nhất (bài toán – phương pháp – thiết lập – số liệu kèm trang – hạn chế – dùng cho slide nào)."),
    B("**Ma trận bằng chứng:** mỗi khẳng định trên slide gắn với nguồn và trang (Phụ lục B); **kiểm tra chéo số liệu** — tính lại phần trăm, đối chiếu bảng với văn bản (phát hiện 10+ chỗ mâu thuẫn, Phụ lục A)."),
    B("**Tự xây bộ mô phỏng posit** bằng Python/PyTorch, **kiểm chứng 100% khớp thư viện chuẩn SoftPosit**, rồi chạy 5 thí nghiệm trên LeNet-5/Fashion-MNIST (Chương 6)."),
  ];
}

function chapter2() {
  const ex = J("09_decode_examples.json");
  const val = J("00_validation.json");
  const props = val.format_properties;
  const fmt = (x) => (x >= 1e5 || x < 1e-3) ? Number(x).toExponential(2).replace("e", "×10^").replace(/\^\+?(-?\d+)/, "^{$1}") : String(+Number(x).toPrecision(5));
  const p81 = ex["posit<8,1>"];
  const exRows = [["Mẫu bit", "Dấu", "Regime → k", "Mũ e", "Phần lẻ f", "Giá trị"]];
  for (const e of p81) {
    if (e.kind === "zero") { exRows.push([e.bits, "–", "–", "–", "–", "0 (số không)"]); continue; }
    if (e.kind === "NaR") { exRows.push([e.bits, "–", "–", "–", "–", "NaR (Not a Real)"]); continue; }
    exRows.push([e.bits, String(e.sign), `${e.regime} → ${e.k}`, e.exp_bits ? `${e.exp_bits} → ${e.e}` : "(hết bit) → 0",
      e.frac_bits ? `${e.frac_bits} → ${e.f}` : "(hết bit) → 0", String(e.value)]);
  }
  const p51 = ex["posit<5,1>_all_positive"].filter((e) => e.kind !== "zero").map((e) => `${e.bits}=${e.value}`);
  const ex256 = ex["posit<16,1>_2.56"];
  const propRows = [["Định dạng", "maxpos", "minpos", "Dải động (thập phân)", "Số giá trị dương"]];
  for (const p of props) propRows.push([p.format, fmt(p.maxpos), fmt(p.minpos), p.dynamic_range_decades.toFixed(2), String(p.num_positive_values)]);
  const A = J("03_expA_tapered.json");
  const E = J("07_expE_fast_sigmoid.json");
  return [
    H1("Chương 2. Hệ thống số Posit"),
    H2("2.1. Lịch sử hình thành"),
    P("Posit là thế hệ thứ ba của họ **unum** (universal number) do **John L. Gustafson** đề xuất:"),
    TCAP("Các mốc phát triển của posit (tổng hợp từ tài liệu)"),
    T([["Thời điểm", "Sự kiện", "Nguồn"],
      ["2015", "Unum Type I: độ dài thay đổi (variable size) → bị phàn nàn vì khó cài đặt phần cứng", "[03] tr.2, [04] tr.2"],
      ["2016", "Unum Type II: kích thước cố định nhưng phải dùng bảng tra → giới hạn độ chính xác", "[03] tr.2"],
      ["Đầu 2017", "**Type III Unum = Posit** (Gustafson & Yonemoto, *Beating Floating Point at its Own Game*) — thay thế trực tiếp (drop-in) cho IEEE 754, không overflow/underflow, không lãng phí NaN", "[S1]; [05] tr.2"],
      ["2018", "Các bài đầu tiên đưa posit vào DNN: lưu trọng số [01], log-float + quire của Facebook [43]; Posit Standard bản nháp 3.2", "[01], [43], [11] (TLTK)"],
      ["2019", "Phần cứng FPGA: Deep Positron (EMAC) [03], [04]; huấn luyện đầu tiên [05], [06]; ImageNet 16-bit [08]; hội nghị CoNGA", "[03]–[08]"],
      ["2020–2021", "Định dạng thích ứng [33], [12]; mixed precision PositNN [11]; PLAM [36]; RISC-V [21], [44]; GAN [40]; độ bền [46]", "các bài tương ứng"],
      ["2022", "**Posit Standard (2022)** — chuẩn chính thức đầu tiên của Posit Working Group: **es = 2 cố định** cho mọi độ rộng, quire 16n bit (posit8 → 128 bit, posit32 → 512 bit). Sườn ban đầu ghi tháng 3/2022 — cần đối chiếu bản chuẩn", "[S2]; [18] tr.2 xác nhận es=2 là chuẩn"],
      ["2022–2026", "Tích hợp công nghiệp (Kalray: Posit8→FP16) [18]; quire nhỏ [27]; Logarithmic Posit (DAC 2024) [35]; MAC SIMD 8/16/32 [48]", "[18], [27], [35], [48]"]], [1.2, 5.6, 1.6], { size: 19 }),
    BOX("Lưu ý về chuẩn", ["Phần lớn bài báo trước 2022 dùng các cặp (n, es) **không theo chuẩn 2022**, ví dụ posit⟨8,0⟩, ⟨16,1⟩, ⟨32,2⟩ (khuyến nghị cũ, [05] tr.2, [11] tr.2) hoặc ⟨32,3⟩ [44]. Khi so sánh kết quả giữa các bài phải để ý es. Tài liệu chuẩn [S2] **chưa có trong thư mục** — nhóm nên tải bản PDF tại posithub.org để đối chiếu khi trình bày."], "warn"),
    H2("2.2. Cấu trúc một số posit"),
    P("Một posit được xác định bởi **n** (tổng số bit) và **es** (số bit mũ tối đa), ký hiệu posit⟨n, es⟩. Chuỗi bit gồm tối đa 4 trường [03] tr.2, [11] tr.2:"),
    T([["Sign (dấu)", "Regime (chế độ)", "Exponent (mũ)", "Fraction (phần lẻ)"],
      ["1 bit", "chuỗi r r … r r̄ — **độ dài thay đổi**", "tối đa es bit (có thể bị cắt)", "các bit còn lại (có thể 0 bit)"]], [1, 2.2, 1.8, 2], { center: [0, 1, 2, 3] }),
    SP(60),
    ...FIG(path.join(DEMO, "figures", "slide_posit_bit_layout.png"), "Bốn trường bit của posit⟨8,1⟩ và ví dụ giải mã 01010101 = 2.625 (hình nhóm vẽ, giá trị kiểm chứng bằng bộ giải mã).", 560),
    B("**Sign:** 0 là dương, 1 là âm. Số âm được lưu ở dạng **bù hai** của số dương tương ứng → phải lấy bù hai trước khi giải mã các trường còn lại [03] tr.2."),
    B("**Regime:** chuỗi gồm m bit giống nhau liên tiếp, kết thúc bằng một bit ngược lại (hoặc hết chuỗi). Giá trị k = −m nếu các bit là 0; k = m − 1 nếu các bit là 1 [06] tr.1."),
    B("**Exponent:** số nguyên không dấu e (0 ≤ e < 2^{es}); nếu regime chiếm hết chỗ thì các bit mũ bị thiếu được coi là 0 [40] tr.2."),
    B("**Fraction:** phần lẻ f ∈ [0, 1) với bit ẩn luôn bằng 1 (giống float)."),
    P("Giá trị của posit (khác 0 và NaR):"),
    EQ([r("x = "), sup("(−1)", "s"), r(" × "), sup("useed", "k"), r(" × "), sup("2", "e"), r(" × (1 + f),    useed = "), sup("2", [sup("2", "es")])]),
    P("Hai mẫu bit đặc biệt: **00…0 = 0** và **10…0 = NaR** (Not a Real — thay cho mọi ∞, 0/0, √−1). Không có ±0, không có hàng triệu NaN [06] tr.1, [03] tr.2."),
    TCAP("Cách đọc regime (theo [03] tr.2, Bảng I)"),
    T([["Bit regime", "0001", "001", "01", "10", "110", "1110"],
      ["k", "−3", "−2", "−1", "0", "1", "2"]], [1.6, 1, 1, 1, 1, 1, 1], { center: [0, 1, 2, 3, 4, 5, 6] }),
    P("**Hiểu trực quan:** useed^{k} × 2^{e} chính là \"số mũ\" của posit. Regime giống như **mã hóa unary** (đếm số bit) cho phần lớn của số mũ — nên số **càng gần 1 thì regime càng ngắn**, chừa nhiều bit hơn cho phần lẻ (chính xác hơn); số **rất lớn hoặc rất nhỏ** thì regime dài, ít bit phần lẻ. Johnson [43] tr.2 mô tả đây là mã **Golomb–Rice**: regime là phần thương mã unary, exponent là phần dư."),
    H2("2.3. Ví dụ giải mã từng bước"),
    H3("Ví dụ 1 — posit⟨8,1⟩ = 01010101"),
    N("Bit dấu = 0 → số dương; es = 1 nên useed = 2^{2} = 4."),
    N("Regime: sau bit dấu là `10` → một bit 1 rồi bit kết thúc 0 → m = 1, **k = m − 1 = 0**."),
    N("Exponent (es = 1 bit): `1` → **e = 1**."),
    N("Fraction: `0101` → f = 5/16 = 0.3125."),
    N("x = 4^{0} × 2^{1} × (1 + 0.3125) = **2.625**."),
    P("Đây chính là posit⟨8,1⟩ gần số e = 2.71828 nhất từ phía dưới; giá trị kế tiếp 01010110 = 2.75 — khớp với nhận xét của [44] tr.9 (nhóm đã giải mã lại bằng chương trình)."),
    H3("Ví dụ 2 — số âm 11000000 trong posit⟨8,1⟩"),
    P("Bit dấu = 1 → lấy bù hai của 8 bit: 11000000 → 01000000. Giải mã 01000000: regime `10` → k = 0, e = 0, f = 0 → 1.0. Vậy giá trị là **−1.0**."),
    H3("Ví dụ 3 — số 2.56 trong posit⟨16,1⟩ (ví dụ của [01] tr.2)"),
    P(`Làm tròn 2.56 về posit⟨16,1⟩ được mẫu bit **${ex256.bits}**: regime ${ex256.regime} → k = ${ex256.k}; mũ ${ex256.exp_bits} → e = ${ex256.e}; phần lẻ ${ex256.frac_bits} → f = ${ex256.f} ≈ 0.280. Giá trị = 4^{0} × 2^{1} × (1 + 0.280) = **${ex256.value}** — khớp với ví dụ \"4^{0} × 2^{1} × (1 + 0.280)\" trong [01].`),
    TCAP("Một số mẫu bit posit⟨8,1⟩ — sinh bằng bộ giải mã của nhóm (đã kiểm chứng với SoftPosit)"),
    T(exRows, [1.4, 0.6, 1.4, 1.2, 1.4, 1.4], { size: 19, center: [0, 1, 5] }),
    P(`**Toàn bộ 15 giá trị dương của posit⟨5,1⟩** (tái hiện Bảng I của [08] tr.2): ${p51.join("; ")}. Có thể thấy mật độ giá trị dày đặc quanh 1 và thưa dần ra hai phía.`, { run: { size: 22 } }),
    H2("2.4. Dải động và các thuộc tính định lượng"),
    EQ([r("maxpos = "), sup("useed", "n−2"), r(",    minpos = "), sup("useed", "−(n−2)"), r(",    dải động = "), sub("log", "10"), frac("maxpos", "minpos"), r(" = 2(n−2)·"), sup("2", "es"), r("·"), sub("log", "10"), r("2")]),
    P("Công thức maxpos/minpos theo [03] tr.4, [08] tr.2. Bảng dưới được **nhóm tính bằng bộ mô phỏng** (file `02_demo/results/00_validation.json`):"),
    TCAP("Thuộc tính các định dạng 8/16 bit (nhóm tính)"),
    T(propRows, [2.2, 1.6, 1.6, 1.6, 1.4], { size: 19, center: [1, 2, 3, 4] }),
    P("Đối chiếu: dải động posit8 es = 0/1/2 là **3.61 / 7.22 / 14.45** bậc thập phân, FP16 là **12.04**, BF16 là **78.57** — **khớp hoàn toàn** với Bảng 2 của [18] tr.4; quy đổi sang dB (×20) khớp Bảng 1 của [43] tr.2 (72.2 / 144.5 / 289.0 dB)."),
    B("Cùng 8 bit, **posit⟨8,2⟩ có dải động rộng hơn FP16** (14.45 so với 12.04 bậc) — ưu thế \"dải động lớn\" của posit."),
    B("Mỗi bit es tăng **gấp đôi** dải động (useed bình phương) nhưng **bớt 1 bit phần lẻ** ở vùng quanh 1 [35] tr.2, [18] tr.4."),
    B("Posit làm tròn **không bao giờ tràn**: giá trị > maxpos bão hòa về maxpos, giá trị (0, minpos) bão hòa về minpos (không về 0) [12] tr.2."),
    H2("2.5. Độ chính xác thon dần (tapered precision)"),
    P("Đây là đặc tính quan trọng nhất. Với float, số bit định trị **cố định** nên độ chính xác tương đối **gần như không đổi** trên toàn dải (\"phẳng\"). Với posit, độ chính xác **cao nhất quanh ±1** (gọi là \"golden zone\" [44] tr.2) và **giảm dần** khi đi xa. Gustafson cho rằng phân bố này khớp với phân bố trọng số/activation của DNN — thường tập trung quanh 0 với độ lớn nhỏ [03] tr.2, [05] tr.6, [11] tr.2."),
    ...FIG(path.join(DEMO, "figures", "slide_number_line.png"), "Vị trí 127 giá trị dương của ba định dạng 8-bit trên thang log₂: posit dày đặc quanh 1 (32 giá trị trong [0.5, 2) so với 16 của FP8) rồi thưa dần."),
    P("Hình dưới (Thí nghiệm A của nhóm) vẽ **độ chính xác thập phân** (số chữ số thập phân đúng tối thiểu, định nghĩa theo [42] tr.5) của từng định dạng 8-bit theo log₂|x|, đặt cạnh phân bố thật của trọng số và activation LeNet-5:"),
    ...FIG(path.join(DEMO, "figures", "A_tapered_precision.png"), "Độ chính xác thập phân của các định dạng 8-bit (trên) và phân bố giá trị thật của LeNet-5 (dưới) — Thí nghiệm A của nhóm."),
    TCAP("Số liệu định lượng từ Thí nghiệm A"),
    T([["Đại lượng", "Giá trị", "Ý nghĩa"],
      ["Độ chính xác thập phân đỉnh posit⟨8,0⟩ / ⟨8,1⟩ / ⟨8,2⟩", `${A["peak_decimal_acc posit⟨8,0⟩"].toFixed(2)} / ${A["peak_decimal_acc posit⟨8,1⟩"].toFixed(2)} / ${A["peak_decimal_acc posit⟨8,2⟩"].toFixed(2)}`, "es nhỏ → đỉnh cao hơn nhưng hẹp hơn"],
      ["Độ chính xác thập phân đỉnh FP8 E4M3", A["peak_decimal_acc FP8 E4M3"].toFixed(2), "phẳng ~1.6–1.85 trên toàn dải"],
      ["Vùng posit⟨8,1⟩ đạt ≥ 1.5 chữ số", `2^{${A["log2_range_with_acc>=1.5 posit⟨8,1⟩"][0].toFixed(1)}} … 2^{${A["log2_range_with_acc>=1.5 posit⟨8,1⟩"][1].toFixed(1)}}`, "khoảng 0.03 … 60"],
      ["Trung vị |trọng số| LeNet-5", `${A.weight_abs_median.toFixed(4)} (≈ 2^{${A.weight_log2_median.toFixed(2)}})`, "trọng số nằm **lệch trái** so với vùng vàng quanh 1"],
      ["Tỉ lệ trọng số < minpos của posit⟨8,0⟩ (2^{−6})", `${(100 * A["weight_frac_below_2^-6(=posit8_0 minpos)"]).toFixed(1)}%`, "bị bão hòa lên minpos nếu không co giãn"],
      ["Trung vị |activation| ≠ 0", A.act_abs_median_nonzero.toFixed(3), "activation nằm **đúng** vùng vàng"],
      ["Tỉ lệ trọng số bị INT8 làm tròn về 0", `${(100 * A["weight_frac_below_half_int8_step(-> round to 0)"]).toFixed(1)}%`, "INT8 mất các trọng số nhỏ"]], [3, 2, 3], { size: 19 }),
    BOX("Điều nhóm hiểu ra từ hình độ chính xác thập phân", [
      "• Activation (sau chuẩn hóa đầu vào và ReLU) nằm quanh |x| ≈ 1 — đúng \"vùng vàng\" của posit.",
      "• Trọng số lại tập trung quanh 2^{−4.6} ≈ 0.04, tức **lệch khỏi vùng vàng** khoảng 4–5 bậc nhị phân → muốn tận dụng posit phải **co giãn theo lớp** (nhân với 2^{s}) — chính là kỹ thuật của [08] (layer-wise scaling), [40] (exponent bias), [07] (linear quantization), và lý do ra đời Adaptive Posit/ALPS/LP [33], [12], [35].",
      "• INT8 có độ chính xác cao nhất ở **đầu lớn** của dải và tệ dần về phía số nhỏ; FP8 phẳng; posit nhọn ở giữa — ba \"hình dạng\" khác nhau, không định dạng nào thắng tuyệt đối.",
    ]),
    P("Bảng 2 của [42] tr.5 (dữ liệu của Gustafson) cho cùng kết luận ở dạng số bit: 8-bit posit đạt tối đa **6 bit** chính xác (float 8-bit: 5 bit) và posit ≥ float trong vùng **1/4 … 4**; 16-bit: 13 vs 11 bit, vùng 1/64 … 64; 32-bit: 28 vs 24 bit, vùng 10^{−6} … 10^{6}."),
    H2("2.6. Làm tròn, so sánh và các ngoại lệ"),
    B("**Một chế độ làm tròn duy nhất:** round-to-nearest-even trên chuỗi bit [36] tr.3. ⚠ Lưu ý tinh tế (nhóm phát hiện khi cài đặt): điểm \"giữa\" để làm tròn là trung điểm **trên không gian bit**, tức giá trị của posit⟨n+1, es⟩ có mẫu bit (p<<1)|1 — **không phải** trung bình cộng hai giá trị khi phải cắt bit mũ. Cài đặt theo cách này cho kết quả **trùng khớp 100%** với SoftPosit (Mục 6.2)."),
    B("**So sánh hai posit dùng chung mạch so sánh số nguyên** (vì thứ tự mẫu bit bù hai trùng thứ tự giá trị) → max-pooling, ReLU rất rẻ [05] tr.8."),
    B("**Không underflow:** số khác 0 không bao giờ làm tròn về 0. Ưu điểm: không mất thông tin nhỏ. Nhược điểm: gradient cực nhỏ bị \"phóng to\" lên minpos — [05] tr.9 cho rằng đây là nguyên nhân posit 8/10-bit hội tụ bất thường khi huấn luyện (Thí nghiệm D)."),
    B("**Độ bền với lỗi lật bit:** với posit⟨32,2⟩, lật 1 bit làm sai lệch ít hơn float32 trong **> 95%** trường hợp; posit ra NaR chỉ ~0.7×10^{−6} %, float ra NaN > 4% [46] tr.4."),
    H2("2.7. Quire – bộ cộng dồn chính xác"),
    P("Tích vô hướng y = Σ a_{i}b_{i} là phép toán chiếm đa số trong DNN (một lớp conv 3×3 với 512 kênh của ResNet-50 cộng **4 608** tích [43] tr.3). Có hai cách cộng:"),
    EQ([r("FMA:  y = r( "), sub("a", "n"), sub("b", "n"), r(" + r( "), sub("a", "n−1"), sub("b", "n−1"), r(" + r( … + r( "), sub("a", "1"), sub("b", "1"), r(" ) … ) ) )        Quire (EMA):  y = r( Σ "), sub("a", "i"), sub("b", "i"), r(" )")]),
    P("FMA làm tròn **sau mỗi bước**; với số 8-bit, khi tổng tích lũy lớn dần so với tích mới thì tích mới bị \"nuốt\" (hiện tượng **c + ab = c**) [43] tr.3. **Quire** (bộ cộng dồn Kulisch) là thanh ghi fixed-point **đủ rộng để chứa chính xác mọi tích**, chỉ làm tròn **một lần** ở cuối [43] tr.3, [03] tr.3. Gustafson đề xuất quire là thành phần chuẩn của posit [43] tr.3."),
    TCAP("Kích thước quire theo các tài liệu"),
    T([["Quy ước", "Công thức / giá trị", "Nguồn"],
      ["Posit Standard bản nháp 3.2 (2018)", "n²/2 bit: posit8 → 32, posit16 → 128, posit32 → 512, posit64 → 2048 bit", "[11] tr.2 Bảng 1"],
      ["EMAC Deep Positron (k tích)", "2^{es+2}·(n−2) + 2 + ⌈log₂k⌉ bit", "[03] tr.4 (4); [07] tr.5 (6)"],
      ["Posit Standard 2022", "16n bit (posit8 → 128, posit16 → 256, posit32 → 512)", "[S2]"],
      ["Quire nhỏ dạng dấu phẩy động", "15 bit thay cho 63 bit (ResNet-9) — không còn chính xác tuyệt đối", "[27] tr.3"]], [2.4, 4, 1.6], { size: 19 }),
    P("Cái giá của quire: một cài đặt quire tốn **~10× diện tích, ~8× độ trễ** so với posit không quire (theo [44] tr.3), nên POSAR [44] bỏ quire, còn [27] thu nhỏ quire. Thí nghiệm C (Chương 6) đo trực tiếp quire quan trọng thế nào."),
    H2("2.8. Tham số es – đánh đổi dải động và độ chính xác"),
    B("es = 0: dải hẹp (posit8: [1/64, 64]), đỉnh chính xác cao nhất, **phần cứng rẻ nhất** (EDP thấp hơn es = 2 tới **3×** [04] tr.6), có sigmoid nhanh. Nhưng **sụp** trên mạng lớn nếu không co giãn: ResNet-50 −76% [43] tr.5, VGG16 10.2% [18] tr.5."),
    B("es = 1: thường là **điểm cân bằng tốt nhất** cho 5–8 bit: [04] tr.8, [07] tr.10 (độ chính xác hơn es = 2 khoảng 2%, hơn es = 0 khoảng 4%); [43] tr.5 (ResNet-50 chỉ −0.87%)."),
    B("es = 2: dải rộng (cần cho **gradient** khi huấn luyện [08] tr.4, [11] tr.4, [40] tr.3), là **chuẩn 2022**, nhưng ít bit phần lẻ hơn."),
    H2("2.9. Phép toán \"miễn phí\" khi es = 0: sigmoid nhanh"),
    P("Với posit⟨n,0⟩, nhiều phép toán chỉ cần **thao tác bit trên ALU số nguyên** — nhóm Pisa gọi là phép toán mức L1: 2x, x/2, 1/x, 1 − x và **sigmoid xấp xỉ** [21] tr.3:"),
    EQ([r("σ_fast(X) = (X ⊕ "), sup("2", "n−1"), r(") >> 2"), r("        tanh_fast(x) = 2·σ_fast(2x) − 1")]),
    P("tức là **đảo bit dấu rồi dịch phải 2 bit** [05] tr.7, [40] tr.4 — thay cho việc tính e^{−x} và phép chia (\"hơn trăm chu kỳ\" theo Gustafson, trích trong [40] tr.2). Nhóm đã kiểm chứng (Thí nghiệm E):"),
    B(`posit⟨8,0⟩: sai số tuyệt đối lớn nhất **${E["posit<8,0> sigmoid"]["max_abs_err_|x|<=8"].toFixed(4)}**, trung bình ${E["posit<8,0> sigmoid"]["mean_abs_err_|x|<=8"].toFixed(4)} trên [−8, 8]; posit⟨16,0⟩: lớn nhất **${E["posit<16,0> sigmoid"]["max_abs_err_|x|<=8"].toFixed(4)}**.`),
    B(`tanh xấp xỉ của [40] trên posit⟨16,0⟩, đoạn [0, 8]: sai số lớn nhất **${E["posit<16,0> tanh [40] on [0,8]"].max_abs_err.toFixed(4)}** → sau hiệu chỉnh **${E["posit<16,0> tanh [40] on [0,8]"].max_abs_err_corrected.toFixed(4)}** — **trùng khớp** với số [40] công bố (0.098 → 0.0379).`),
    ...FIG(path.join(DEMO, "figures", "E_fast_sigmoid.png"), "Sigmoid nhanh bằng 2 phép toán bit so với sigmoid chính xác (Thí nghiệm E).", 560),
    H2("2.10. So sánh tổng hợp posit với các định dạng khác"),
    TCAP("So sánh đặc tính (tổng hợp)"),
    T([["Tiêu chí", "IEEE float (FP32/16/8)", "INT8 / fixed", "Posit"],
      ["Phân bố giá trị", "Logarit, độ chính xác phẳng", "Đều (uniform)", "Logarit, **thon dần**, dày quanh ±1"],
      ["Giá trị đặc biệt", "±0, ±∞, rất nhiều NaN, subnormal", "Không", "Chỉ 0 và NaR"],
      ["Tràn", "→ ±∞ / 0", "Bão hòa hoặc quấn", "Bão hòa maxpos/minpos"],
      ["Cần hệ số co giãn", "Ít (dải rộng)", "**Bắt buộc**", "Có lợi (Chương 4) nhưng không bắt buộc"],
      ["Cộng dồn chuẩn", "FMA", "Bộ cộng int32 (chính xác)", "Quire (chính xác, tốn phần cứng)"],
      ["Giải mã phần cứng", "Trường cố định", "Không cần", "**Regime độ dài thay đổi** → cần LZD/LOD, bộ dịch"],
      ["Hỗ trợ phần cứng hiện nay", "Mọi CPU/GPU", "Mọi NPU", "Chủ yếu nghiên cứu (FPGA, RISC-V, Kalray)"]], [1.6, 2.2, 1.6, 2.4], { size: 19 }),
  ];
}

module.exports = { cover, guide, chapter1, chapter2 };
