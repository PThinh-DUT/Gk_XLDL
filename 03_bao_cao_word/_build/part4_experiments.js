// Phần 4: Chương 6 — Thực nghiệm của nhóm (đọc số liệu trực tiếp từ 02_demo/results)
const path = require("path");
const fs = require("fs");
const L = require("./lib");
const { P, H1, H2, H3, B, N, T, BOX, SP, FIG, TCAP } = L;

const DEMO = path.join(__dirname, "..", "..", "02_demo");
const J = (f) => JSON.parse(fs.readFileSync(path.join(DEMO, "results", f), "utf8"));
const has = (f) => fs.existsSync(path.join(DEMO, "results", f));
const f2 = (x) => Number(x).toFixed(2);
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const NAME = { posit8_0: "posit⟨8,0⟩", posit8_1: "posit⟨8,1⟩", posit8_2: "posit⟨8,2⟩", posit16_1: "posit⟨16,1⟩",
  posit16_2: "posit⟨16,2⟩", fp8e4m3: "FP8 E4M3", fp8e5m2: "FP8 E5M2", fp16: "FP16", bf16: "BF16", int8: "INT8", fp32: "FP32" };
const SCALE = { none: "không", pow2: "lũy thừa 2 / lớp", max: "max|W|", mse: "cắt tối ưu MSE" };

function setup() {
  const base = J("01_baselines.json");
  const accs = Object.values(base).map((v) => v.test_acc);
  const val = J("00_validation.json");
  const vrows = [["Phép kiểm chứng", "Số phép thử", "Sai khác"]];
  for (const [k, v] of Object.entries(val)) {
    if (k === "format_properties") continue;
    const label = k.replace("decode_", "Giải mã toàn bộ mẫu bit ").replace("round_", "Làm tròn ").replace("fp8_", "FP8 ").replace("_vs_torch", " so với PyTorch").replace("<", "⟨").replace(">", "⟩");
    vrows.push([label, String(v.patterns || v.tests), String(v.mismatches)]);
  }
  return [
    H1("Chương 6. Thực nghiệm của nhóm"),
    H2("6.1. Mục tiêu và thiết kế thí nghiệm"),
    P("Thay vì chỉ trích dẫn, nhóm **tự kiểm chứng** các kết luận quan trọng nhất của tài liệu bằng 5 thí nghiệm nhỏ, chạy được trên laptop:"),
    T([["TN", "Câu hỏi", "Đối chiếu với"],
      ["A", "Độ chính xác thon dần của posit có khớp phân bố trọng số/activation thật không?", "[03], [05], [11], [42]"],
      ["B", "Lượng tử hóa trọng số sau huấn luyện: cùng số bit, định dạng nào tốt hơn? Co giãn ảnh hưởng ra sao?", "[01], [04], [07], [18]"],
      ["C", "Khi trọng số **và** activation đều 8-bit, quire quan trọng thế nào so với FMA?", "[03], [43], [11], [27]"],
      ["D", "Có huấn luyện được bằng posit 8-bit không? Mixed precision có cứu được không?", "[05], [06], [11]"],
      ["E", "Công thức sigmoid/tanh nhanh của posit es = 0 sai số bao nhiêu?", "[05], [21], [40]"]], [0.5, 5.2, 2]),
    H2("6.2. Môi trường, dữ liệu và mô hình"),
    B("**Phần cứng:** báo cáo trước ghi MacBook Apple M2 (8 nhân CPU, 8 GB RAM), chạy CPU; JSON chưa lưu metadata phần cứng để đối chiếu từng lần chạy. **Phần mềm:** Python/PyTorch (phiên bản của lần chạy gốc chưa được lưu trong JSON; xem requirements-notebooks.lock.txt cho môi trường tái lập), NumPy, Matplotlib; SoftPosit (Python) để kiểm chứng."),
    B("**Dữ liệu:** Fashion-MNIST [S3] — 60 000 ảnh huấn luyện, 10 000 ảnh kiểm tra, 28×28 xám, 10 lớp quần áo; tải từ nguồn chính thức, **MD5 khớp** với giá trị công bố; chuẩn hóa (mean 0.2860, std 0.3530). Chọn Fashion-MNIST vì được dùng trong [04], [06], [07], [11] → so sánh được."),
    B("**Mô hình:** LeNet-5 [S4] bản hiện đại (ReLU + MaxPool): conv 5×5×6 → conv 5×5×16 → FC 120 → FC 84 → FC 10, **61 706 tham số** (cùng kiến trúc [11] dùng)."),
    B(`**Mô hình gốc FP32:** 3 lần huấn luyện (seed 0, 1, 2), SGD momentum 0.9, lr 0.05 giảm cosine, batch 128, 15 epoch → độ chính xác test **${accs.map(f2).join("%, ")}%** (TB **${f2(mean(accs))} ± ${f2(std(accs))}%**), tương đương [11] (90.42%) và [07] (92.54% với mạng lớn hơn).`),
    B("**Phương pháp mô phỏng:** dữ liệu vẫn lưu dạng float32/float64 nhưng **chỉ nhận giá trị mà định dạng đích biểu diễn được** (fake quantization) — chỉ tương đồng về hướng mô phỏng, không phải triển khai hoặc tái lập chính xác QPyTorch, Deep PeNSieve hay PositNN. Mọi phép làm tròn tuân theo đúng quy tắc của định dạng (posit: RNE trên chuỗi bit, bão hòa, không về 0)."),
    H2("6.3. Bước 0 — Kiểm chứng bộ mô phỏng định dạng số"),
    P("Trước khi dùng cho thí nghiệm, nhóm so sánh bộ mã hóa/giải mã posit tự viết (`posit_lab/numformats.py`) với **SoftPosit** — thư viện tham chiếu của nhóm phát triển posit — trên **toàn bộ** mẫu bit và hàng trăm nghìn phép làm tròn (gồm cả mọi điểm hòa — trường hợp khó nhất), và so sánh FP8 với kiểu float8 có sẵn của PyTorch:"),
    TCAP("Kết quả kiểm chứng bộ mô phỏng (file results/00_validation.json)"),
    T(vrows, [5, 2, 1.2], { size: 19, center: [1, 2] }),
    BOX("Kết luận bước 0", ["**0 sai khác** trên tất cả phép thử → bộ mô phỏng của nhóm cho kết quả phù hợp với tham chiếu trên posit⟨8,0⟩, posit⟨16,1⟩, posit⟨8,2⟩, posit⟨16,2⟩ và các mẫu FP8 đã thử. Chưa kiểm chứng mọi cấu hình, phép toán hoặc toàn bộ pipeline huấn luyện."]),
  ];
}

function expA() {
  return [
    H2("6.4. Thí nghiệm A — Độ chính xác thon dần và phân bố dữ liệu"),
    P("Kết quả đã trình bày ở Mục 2.5 (hình độ chính xác thập phân và bảng số liệu Thí nghiệm A). Tóm tắt: **activation** của LeNet-5 nằm quanh |x| ≈ 1 — khớp \"vùng vàng\" của posit; **trọng số** tập trung quanh 0.04 (≈ 2^{−4.6}), **lệch** khỏi vùng vàng → dự đoán: posit sẽ có lợi rõ khi **co giãn trọng số** về gần 1. Thí nghiệm B kiểm tra dự đoán này."),
  ];
}

function expB() {
  const d = J("04_expB_weight_ptq.json");
  const rows = [["Định dạng", "Co giãn", "Độ chính xác (%)", "Sai số trọng số (%)"]];
  for (const r of d.B1) rows.push([NAME[r.format] || r.format, SCALE[r.scale] || r.scale,
    `${f2(r.acc_mean)} ± ${f2(r.acc_std)}`, r.format === "fp32" ? "0" : f2(100 * r.rel_weight_err_mean)]);
  const sw = d.B2_sweep;
  const get = (fmt, sc) => sw.find((r) => r.format === fmt && r.scale === sc);
  const sweepRows = [["Số bit", "Posit es=0 (không / có co giãn)", "Posit es=1", "Posit es=2", "FP tốt nhất (không / có)", "INT (cắt MSE)"]];
  for (const n of [4, 5, 6, 7, 8]) {
    const fpBest = (sc) => sw.filter((r) => r.bits === n && r.format.startsWith("fp") && r.scale === sc)
      .reduce((a, b) => (b.acc_mean > a.acc_mean ? b : a));
    const pp = (es) => `${f2(get(`posit${n}_${es}`, "none").acc_mean)} / ${f2(get(`posit${n}_${es}`, "pow2").acc_mean)}`;
    const fn = fpBest("none"), fs_ = fpBest("pow2");
    sweepRows.push([String(n), pp(0), pp(1), pp(2), `${f2(fn.acc_mean)} (${fn.format.slice(2 + String(n).length)}) / ${f2(fs_.acc_mean)} (${fs_.format.slice(2 + String(n).length)})`,
      f2(get(`int${n}`, "mse").acc_mean)]);
  }
  const p40 = get("posit4_1", "none"), f40 = sw.filter((r) => r.bits === 4 && r.format.startsWith("fp") && r.scale === "none");
  const fp4e2 = get("fp4e2m1", "none");
  return [
    H2("6.5. Thí nghiệm B — Lượng tử hóa trọng số sau huấn luyện"),
    H3("Thiết lập"),
    B("Lượng tử hóa **chỉ trọng số** của 5 lớp conv/FC (bias giữ FP32, activation FP32), **không huấn luyện lại** — giống [01], [18]."),
    B("Hai chế độ cho các định dạng dải cố định (posit, FP): **không co giãn** (làm tròn trực tiếp — \"rounding quantization\" của [07]) và **co giãn lũy thừa 2 theo lớp** (chọn 2^{s} làm sai số bình phương nhỏ nhất — tinh thần [08], [40]). INT luôn cần hệ số co giãn: theo max|W| hoặc cắt tối ưu MSE."),
    B("**B1:** các định dạng 8/16-bit. **B2:** quét 4–8 bit cho posit es = 0/1/2, FP n-bit với 2/3/4 bit mũ, INT n-bit. Mỗi cấu hình chạy trên 3 mô hình gốc → báo cáo trung bình ± độ lệch chuẩn."),
    TCAP("Thí nghiệm B1 — trọng số 8/16-bit (LeNet-5, Fashion-MNIST, 10 000 ảnh test, 3 mô hình)"),
    T(rows, [2, 2, 2, 2], { size: 19, center: [2, 3] }),
    ...FIG(path.join(DEMO, "figures", "B_weight_error_8bit.png"), "Sai số tương đối khi lượng tử hóa trọng số về 8 bit (Thí nghiệm B1).", 480),
    TCAP("Thí nghiệm B2 — độ chính xác (%) theo số bit trọng số (TB 3 mô hình; FP: trong ngoặc là cấu hình bit mũ/định trị tốt nhất)"),
    T(sweepRows, [0.7, 1.8, 1.6, 1.6, 2.4, 1.1], { size: 18, center: [0, 1, 2, 3, 4, 5] }),
    ...FIG(path.join(DEMO, "figures", "B_bit_sweep.png"), "Độ chính xác theo số bit trọng số: trái — không co giãn; phải — có co giãn theo lớp (Thí nghiệm B2)."),
    H3("Nhận xét"),
    N(`**Ở 8 bit, mọi định dạng đều ≈ FP32** (chênh ≤ 0.3 điểm, nằm trong độ lệch giữa các mô hình) — lượng tử hóa trọng số 8-bit cho mạng nhỏ là \"dễ\", khớp [04] (Fashion-MNIST: posit 89.6 / float 89.6 / fixed 89.2).`),
    N(`Dù độ chính xác bão hòa, **sai số trọng số** phân biệt rõ khả năng giữ thông tin: posit⟨8,0⟩ + co giãn **${f2(100 * d.B1.find((r) => r.format === "posit8_0" && r.scale === "pow2").rel_weight_err_mean)}%** < INT8 ${f2(100 * d.B1.find((r) => r.format === "int8" && r.scale === "mse").rel_weight_err_mean)}% < FP8 E4M3 ${f2(100 * d.B1.find((r) => r.format === "fp8e4m3" && r.scale === "none").rel_weight_err_mean)}% < FP8 E5M2 ${f2(100 * d.B1.find((r) => r.format === "fp8e5m2" && r.scale === "none").rel_weight_err_mean)}% → **cho thấy posit có sai số lượng tử hóa thấp hơn trong cấu hình đã thử** khi dữ liệu được đưa về vùng vàng; không co giãn thì posit⟨8,0⟩ sai số ${f2(100 * d.B1.find((r) => r.format === "posit8_0" && r.scale === "none").rel_weight_err_mean)}% (do 20% trọng số < minpos = 2^{−6}).`),
    N(`**Không co giãn, ở 4 bit posit thắng lớn:** posit⟨4,1⟩ ${f2(p40.acc_mean)}% so với FP4 E2M1 chỉ ${f2(fp4e2.acc_mean)}% và FP4 tốt nhất ${f2(Math.max(...f40.map((r) => r.acc_mean)))}% — đúng như [07] quan sát ở 5 bit: dải động tự nhiên của posit giúp nó **không cần hiệu chỉnh**.`),
    N(`**Có co giãn theo lớp, FP và INT bắt kịp và nhỉnh hơn posit** ở 4–5 bit (4 bit: INT ${f2(get("int4", "mse").acc_mean)}%, posit es=1 ${f2(get("posit4_1", "pow2").acc_mean)}%) — nhất quán với nhận xét của [12] rằng \"scaled float\" bám rất sát posit, và với đánh giá thận trọng của [44].`),
    N("**es = 2 kém nhất ở 4–5 bit** (ít bit phần lẻ nhất), **es = 1 tốt nhất** khi không co giãn — khớp [04], [07]."),
    BOX("Điều nhóm hiểu ra", ["Lợi thế của posit **không nằm ở 8 bit với mạng nhỏ**, mà ở chỗ: (1) dùng được **ngay cả khi không hiệu chỉnh** nhờ dải động rộng + độ chính xác thon dần; (2) **cùng số bit giữ thông tin tốt hơn** nếu dữ liệu nằm gần 1. Khi đã có bước hiệu chỉnh tốt, INT/FP đuổi kịp — đây là lý do các nghiên cứu mới chuyển sang **định dạng posit thích ứng** [33], [12], [35]."]),
  ];
}

function expC() {
  if (!has("05_expC_quire.json")) return [H2("6.6. Thí nghiệm C — (đang chạy)")];
  const d = J("05_expC_quire.json");
  const c1 = d.C1_dot_product;
  const c1rows = [["K", "Quire", "FMA", "Nhân/cộng riêng"]];
  for (const r of c1.filter((x) => x.format === "posit8_1")) c1rows.push([String(r.K), f2(100 * r.median_rel_err_quire) + "%",
    f2(100 * r.median_rel_err_fma) + "%", f2(100 * r.median_rel_err_sep) + "%"]);
  const agg = {};
  for (const r of d.C2_network) (agg[`${r.format}|${r.accum}`] ||= []).push(r.acc);
  const cell = (f, m) => { const a = agg[`${f}|${m}`]; if (!a) return "—"; return a.length > 1 ? `${f2(mean(a))} ± ${f2(std(a))}` : `${f2(a[0])} (seed 0)`; };
  const c2rows = [["Định dạng (W + A)", "Quire", "FMA", "Nhân/cộng riêng"]];
  for (const f of ["posit8_0", "posit8_1", "posit8_2", "fp8e4m3", "posit16_1"]) c2rows.push([NAME[f], cell(f, "quire"), cell(f, "fma"), cell(f, "sep")]);
  c2rows.push(["INT8 (cộng dồn int32)", cell("int8", "quire"), "—", "—"]);
  const base = mean(Object.values(J("01_baselines.json")).map((v) => v.test_acc));
  return [
    H2("6.6. Thí nghiệm C — Vai trò của quire"),
    H3("Thiết lập"),
    B("**C1 (vi mô):** tích vô hướng của K cặp số ngẫu nhiên (x giống activation sau ReLU, w giống trọng số), đều đã làm tròn về 8-bit; K = 16 … 4096; 300 lần lặp; đo sai số tương đối trung vị so với kết quả chính xác."),
    B("**C2 (mạng):** suy luận LeNet-5 với **cả trọng số và activation** (đầu vào mỗi lớp) ở định dạng thấp bit; trọng số co giãn lũy thừa 2 theo lớp (như B); đầu ra mỗi lớp làm tròn về định dạng; so sánh 3 cách cộng dồn: **Quire** r(b + Σ x·w); **FMA** acc = r(acc + x·w) mỗi bước; **Nhân/cộng riêng** acc = r(acc + r(x·w)). Quire mô phỏng bằng float64. INT8 dùng hệ số co giãn activation hiệu chỉnh trên 2000 ảnh huấn luyện, cộng dồn int32 (chính xác)."),
    TCAP("C1 — sai số tương đối trung vị của tích vô hướng posit⟨8,1⟩ theo độ dài K"),
    T(c1rows, [1, 2, 2, 2], { size: 19, center: [0, 1, 2, 3] }),
    ...FIG(path.join(DEMO, "figures", "C1_dot_product.png"), "Sai số tích vô hướng posit⟨8,1⟩: quire giữ sai số ổn định quanh 1–1.6% (chỉ do 1 lần làm tròn), FMA tăng theo K (Thí nghiệm C1).", 520),
    TCAP(`C2 — độ chính xác suy luận LeNet-5 (%) với trọng số + activation thấp bit (FP32: ${f2(base)}%)`),
    T(c2rows, [2.2, 2, 2, 2], { size: 19, center: [1, 2, 3] }),
    ...FIG(path.join(DEMO, "figures", "C2_network_quire.png"), "Ảnh hưởng của cách cộng dồn khi suy luận hoàn toàn 8-bit (Thí nghiệm C2)."),
    H3("Nhận xét"),
    ...C_COMMENTS(d, agg, base),
  ];
}

// Nhận xét Thí nghiệm C — viết sau khi có kết quả (xem file comments.js)
let C_COMMENTS = () => [];
let D_COMMENTS = () => [];
try { ({ C_COMMENTS, D_COMMENTS } = require("./comments")); } catch (e) { /* chưa có */ }

function expD() {
  if (!has("06_expD_training.json")) return [H2("6.7. Thí nghiệm D — (đang chạy)")];
  const d = J("06_expD_training.json");
  const rows = [["Cấu hình", "W/A tính", "Gradient", "Loss", "Optimizer + trọng số chính", "Acc epoch 1", "Acc epoch 10"]];
  for (const r of d.filter((x) => x.seed === 0)) {
    const h = r.history;
    const nm = (x) => NAME[x] || (x.startsWith("posit") ? `posit⟨${x.slice(5).replace("_", ",")}⟩` : x.toUpperCase());
    rows.push([r.config, nm(r.formats["W/A"]), nm(r.formats.G), nm(r.formats.L), nm(r.formats.O),
      f2(h[0].test_acc), f2(h[h.length - 1].test_acc)]);
  }
  return [
    H2("6.7. Thí nghiệm D — Huấn luyện bằng số độ chính xác thấp"),
    H3("Thiết lập"),
    B("LeNet-5/Fashion-MNIST, 10 epoch (như [11]), SGD momentum 0.9, lr 0.05 cosine, batch 128, seed 0. Không warm-up, không loss scaling, không co giãn (\"thuần\")."),
    B("Làm tròn ở mọi nơi dữ liệu chảy qua: trọng số dùng để tính, activation sau mỗi lớp, gradient của activation và trọng số, gradient của logits (loss), bộ nhớ momentum và **trọng số chính** sau mỗi bước cập nhật. Phép nhân–cộng bên trong conv/FC tính FP32 (bộ cộng dồn rộng nhưng không tương đương quire chính xác)."),
    B("Cấu hình hỗn hợp **posit(8,2)**^{*} lấy cảm hứng từ **O12L10** của [11]: W/A/G posit⟨8,2⟩, loss posit⟨10,2⟩, optimizer & trọng số chính posit⟨12,2⟩."),
    TCAP("Thí nghiệm D — độ chính xác test (%)"),
    T(rows, [2.6, 1.1, 1.1, 1, 1.4, 0.9, 0.9], { size: 17, center: [5, 6] }),
    ...FIG(path.join(DEMO, "figures", "D_training_curves.png"), "Đường cong độ chính xác khi huấn luyện bằng các định dạng khác nhau (Thí nghiệm D).", 540),
    H3("Nhận xét"),
    ...D_COMMENTS(d),
  ];
}

function expE_and_limits() {
  return [
    H2("6.8. Thí nghiệm E — Sigmoid/tanh nhanh"),
    P("Kết quả đã trình bày ở Mục 2.9 (Hình sigmoid). Điểm đáng chú ý: sai số **lớn nhất** của tanh xấp xỉ do nhóm đo (0.0980 → 0.0379 sau hiệu chỉnh) **trùng khớp đến 4 chữ số** với [40], chứng tỏ nhóm đã cài đặt đúng công thức; sai số **trung bình** khác vì cách lấy mẫu khác (nhóm lấy mọi giá trị posit⟨16,0⟩ trong [0, 8], dày đặc gần 0)."),
    H2("6.9. Hạn chế của thực nghiệm"),
    B("**Mạng nhỏ, dữ liệu nhỏ** (LeNet-5, Fashion-MNIST) — chạy được trên laptop nhưng không đại diện cho ResNet/Transformer; ở 8 bit kết quả dễ bão hòa."),
    B("**Mô phỏng**, không phải phần cứng posit thật; chưa chạy CIFAR-10, ResNet/ViT hoặc PLAM trong bộ thí nghiệm A–E → không đo được năng lượng/tốc độ; quire được xấp xỉ bằng float64; chưa kiểm chứng tính chính xác bằng bộ cộng dồn số nguyên hoặc đánh giá giới hạn dung lượng quire."),
    B("Thí nghiệm D chạy **1 seed** (như [11]) do thời gian (~30–45 phút/cấu hình khi chạy song song trên CPU); Thí nghiệm C chế độ \"nhân/cộng riêng\" chỉ chạy trên mô hình seed 0 cho FP8 E4M3 và posit⟨8,1⟩ (chậm nhất, kết quả gần FMA)."),
    B("Dùng các cặp (n, es) của tài liệu (⟨8,0⟩, ⟨8,1⟩, ⟨8,2⟩, ⟨16,1⟩), không chỉ chuẩn 2022 (es = 2)."),
  ];
}

module.exports = { setup, expA, expB, expC, expD, expE_and_limits };
