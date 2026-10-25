// Nhận xét cho Thí nghiệm C và D — số liệu lấy trực tiếp từ JSON, câu kết luận chọn theo kết quả.
const L = require("./lib");
const { N, BOX } = L;
const f1 = (x) => Number(x).toFixed(1), f2 = (x) => Number(x).toFixed(2);
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

function C_COMMENTS(d, agg, base) {
  const k = d.C1_dot_product.filter((r) => r.format === "posit8_1");
  const first = k[0], last = k[k.length - 1];
  const qErr = k.map((r) => 100 * r.median_rel_err_quire);
  const m = (f, a) => (agg[`${f}|${a}`] ? mean(agg[`${f}|${a}`]) : null);
  const out = [];
  out.push(N(`**C1 — quire giữ sai số không đổi, FMA thì không:** với posit⟨8,1⟩, sai số trung vị khi có quire luôn trong khoảng **${f1(Math.min(...qErr))}–${f1(Math.max(...qErr))}%** (chỉ do một lần làm tròn cuối), còn FMA tăng từ **${f1(100 * first.median_rel_err_fma)}%** (K = ${first.K}) lên **${f1(100 * last.median_rel_err_fma)}%** (K = ${last.K}). Nguyên nhân: khi tổng tích lũy lớn dần so với mỗi tích mới, khoảng cách giữa hai posit liền kề quanh tổng lớn hơn tích → tích mới bị làm tròn mất (**c + ab = c**) — đúng hiện tượng [43] tr.3 mô tả. FP8 E4M3 cho kết quả tương tự (${f1(100 * d.C1_dot_product.filter((r) => r.format === "fp8e4m3").slice(-1)[0].median_rel_err_fma)}% ở K = ${last.K}).`));
  const rows = [];
  for (const f of ["posit8_0", "posit8_1", "posit8_2", "fp8e4m3"]) {
    const q = m(f, "quire"), fm = m(f, "fma");
    if (q != null && fm != null) rows.push({ f, q, fm, drop: Number(f2(q)) - Number(f2(fm)) });
  }
  const name = { posit8_0: "posit⟨8,0⟩", posit8_1: "posit⟨8,1⟩", posit8_2: "posit⟨8,2⟩", fp8e4m3: "FP8 E4M3" };
  const qtxt = rows.map((r) => `${name[r.f]} ${f2(r.q)}%`).join(", ");
  const maxQdrop = Math.max(...rows.map((r) => Number(f2(base)) - Number(f2(r.q))));
  out.push(N(`**C2 — có quire, suy luận hoàn toàn 8-bit gần như không mất độ chính xác:** ${qtxt} so với FP32 ${f2(base)}% (giảm tối đa ${f2(maxQdrop)} điểm). Khớp kết luận của [03], [04], [43]: 8-bit + cộng dồn chính xác ≈ FP32.`));
  const ftxt = rows.map((r) => `${name[r.f]} −${f2(r.drop)}`).join(", ");
  out.push(N(`**C2 — bỏ quire (FMA) thì mất độ chính xác ở mọi định dạng 8-bit:** mức giảm so với quire: ${ftxt} điểm. Lớp fc1 cộng 400 tích, conv2 cộng 150 tích → hiện tượng c + ab = c xuất hiện thật trong mạng.${m("posit8_1", "sep") != null ? ` Làm tròn cả tích (nhân/cộng riêng) cho posit⟨8,1⟩: ${f2(m("posit8_1", "sep"))}% — xấp xỉ FMA, tức **phần lớn sai số đến từ phép cộng dồn**, không phải phép nhân.` : ""}`));
  const p16q = m("posit16_1", "quire"), p16f = m("posit16_1", "fma");
  if (p16q != null && p16f != null) out.push(N(`**Ở 16 bit, quire không còn cần thiết:** posit⟨16,1⟩ có quire ${f2(p16q)}%, không quire ${f2(p16f)}% — 12 bit phần lẻ quanh 1 đủ để mỗi lần cộng không mất thông tin đáng kể. Điều này giải thích vì sao POSAR [44] (32-bit) có thể bỏ quire mà vẫn chính xác.`));
  const i8 = m("int8", "quire");
  if (i8 != null) out.push(N(`**INT8 ${f2(i8)}%** — vì phép cộng dồn số nguyên trong thanh ghi int32 vốn **đã chính xác** (không làm tròn). Nói cách khác, quire là cách để posit/float 8-bit có được tính chất \"cộng dồn chính xác\" mà INT8 có sẵn — và đó cũng là lý do quire tốn phần cứng ([44] tr.3, [27]).`));
  out.push(BOX("Điều nhóm hiểu ra", ["Độ chính xác của mạng 8-bit **phụ thuộc vào bộ cộng dồn không kém gì định dạng số**. Posit 8-bit chỉ phát huy khi đi kèm quire (hoặc bộ cộng dồn rộng). Vì quire đắt, các hướng tối ưu như **quire nhỏ** [27] hay **cộng dồn trong miền tuyến tính rộng** [43], [35] là cần thiết để posit có lợi về phần cứng."]));
  return out;
}

function D_COMMENTS(d) {
  const get = (c) => d.find((r) => r.config === c && r.seed === 0);
  const fin = (c) => { const r = get(c); return r ? r.history[r.history.length - 1].test_acc : null; };
  const out = [];
  const fp32 = fin("FP32"), fp16 = fin("FP16 thuần"), p16 = fin("Posit(16,1) thuần");
  const p80 = fin("Posit(8,0) thuần"), p82 = fin("Posit(8,2) thuần"), mix = fin("Posit(8,2)* hỗn hợp (O12L10)");
  if (p16 != null) out.push(N(`**Posit⟨16,1⟩ huấn luyện như FP32:** ${f2(p16)}% so với ${f2(fp32)}% (chênh ${f2(fp32 - p16)} điểm) — khớp [06], [08] (16-bit đủ cho huấn luyện).`));
  if (fp16 != null) out.push(N(`**FP16 thuần cũng đạt ${f2(fp16)}%** — khác với [06] (Float-16 thuần chỉ 81.7% trên Fashion-MNIST). Lý do có thể: mô phỏng của nhóm cộng dồn bên trong conv/FC bằng FP32 (giống tensor core) và LeNet-5 có gradient không quá nhỏ; [06] làm mọi phép toán ở 16-bit với MLP. → Kết luận \"posit16 hơn float16\" của [06] **phụ thuộc cách cài đặt**, không nên khái quát.`));
  if (p80 != null) {
    let t;
    if (p80 < 20) t = `**thất bại hoàn toàn: ${f2(p80)}%** — xấp xỉ đoán ngẫu nhiên 10 lớp, **cùng kết luận với [11]**: posit(8,0) không huấn luyện được, cả khi không quire (10.00%, Bảng 2) lẫn có quire (13.84%, Bảng 3) [11] tr.3–4.`;
    else if (p80 < fp32 - 5) t = `**giảm mạnh còn ${f2(p80)}%** (FP32 ${f2(fp32)}%) — cùng xu hướng thất bại như [11] (10%), dù không sụp hoàn toàn trong mô phỏng của nhóm (cộng dồn FP32 bên trong lớp).`;
    else t = `**đạt ${f2(p80)}%** — **khác** với [11] (10%). Có thể do mô phỏng của nhóm cộng dồn bằng FP32 bên trong lớp, còn [11] dùng posit thật cho mọi phép toán; đây là điểm cần nêu khi trình bày.`;
    out.push(N(`**Posit⟨8,0⟩ thuần:** ${t}`));
  }
  if (p82 != null) out.push(N(`**Posit⟨8,2⟩ thuần:** ${f2(p82)}% — es = 2 cho dải động rộng hơn (2^{±24} so với 2^{±6}) nên ${p80 != null && p82 > p80 + 1 ? "tốt hơn es = 0" : "khác biệt không lớn so với es = 0"}; vấn đề còn lại là **độ phân giải khi cập nhật trọng số** (chỉ 3 bit phần lẻ). **Lưu ý khi so với [11]:** cùng cấu hình này (posit(8,2) + quire) [11] chỉ đạt **19.39%** (Bảng 3, tr.4), thấp hơn nhiều so với ${f2(p82)}% của nhóm. Lý do: [11] thực hiện mọi phép toán bằng posit và tránh biểu diễn float trung gian (tr.2), còn mô phỏng của nhóm chỉ làm tròn ở biên các tensor — tích vô hướng, softmax/cross-entropy và các phép toán trung gian vẫn tính FP32. Vì vậy số của nhóm là **cận trên lạc quan**; kết luận định tính (8-bit thuần chưa đủ, cần độ chính xác hỗn hợp) không đổi.`));
  if (mix != null) out.push(N(`**Posit(8,2)**^{*} **hỗn hợp (O12L10 của [11]):** ${f2(mix)}% so với FP32 ${f2(fp32)}% (chênh ${f2(fp32 - mix)} điểm) — ${Math.abs(fp32 - mix) < 1 ? "**gần như bằng FP32**, khớp [11] (90.25% vs 90.42%)" : "cải thiện so với 8-bit thuần nhưng vẫn còn khoảng cách"}. Chỉ cần tăng độ chính xác cho **optimizer/trọng số chính (12 bit)** và **loss (10 bit)** — phần chiếm ~15% số phép toán [11] tr.4.`));
  out.push(BOX("Điều nhóm hiểu ra", ["Khi huấn luyện, nút thắt là **bước cập nhật trọng số**: w ← w − lr·g với lr·g rất nhỏ so với w. Nếu w lưu ở 8 bit thì khoảng cách giữa hai giá trị liền kề quanh w lớn hơn lr·g → bước cập nhật bị làm tròn mất, mạng không học được. Giữ **trọng số chính & optimizer ở độ chính xác cao hơn** là giải pháp chung cho mọi định dạng (FP16 mixed precision [06], PositNN [11], GAN [40])."]));
  return out;
}

module.exports = { C_COMMENTS, D_COMMENTS };
