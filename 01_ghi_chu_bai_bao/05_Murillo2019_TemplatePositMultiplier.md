# [05] Template-Based Posit Multiplication for Training and Inferring in Neural Networks

- **Tác giả:** Raúl Murillo Montero, Alberto A. Del Barrio, Guillermo Botella — Complutense University of Madrid (UCM), Tây Ban Nha
- **Nguồn:** bản preprint arXiv:1907.04091v1, 10/07/2019 (tr.1). Mã nguồn: github.com/RaulMurillo/Posit-Multiplier_FloPoCo (tr.3).
- **Ghi chú:** nhóm UCM sau này là tác giả của PLAM [36] và framework Deep PeNSieve (được trích trong nhiều bài khác).

## Bài toán
- Các bộ nhân posit trước đó **không hỗ trợ es = 0**, trong khi es = 0 cho phép tính **sigmoid nhanh** (tr.3).
- Chưa có nghiên cứu nào **huấn luyện** mạng nơ-ron bằng posit (tác giả tuyên bố là bài đầu tiên, tr.1, tr.3).

## Nhược điểm của IEEE 754 mà bài liệt kê (tr.1–2) — dùng cho slide "Đặt vấn đề"
1. Cùng một định dạng IEEE nhưng máy khác nhau **không bắt buộc cho cùng kết quả** (tính tái lập kém).
2. **Quá nhiều mẫu bit cho NaN** → lãng phí giá trị, phần cứng phức tạp.
3. Overflow thành ±∞, underflow thành 0.
4. Làm tròn ở từng phép toán → mất tính kết hợp/phân phối; FMA không phải hệ thống nào cũng có.

## Phương pháp
1. **Thuật toán nhân posit tổng quát** cho mọi ⟨n, es⟩, kể cả es = 0 (Algorithm 1 giải mã, Algorithm 2 nhân, tr.4–5): giải mã → cộng hệ số mũ (scaling factor = regime + exponent) → nhân phần định trị như số nguyên → chuẩn hóa → đóng gói → làm tròn RNE với các bit LSB/Guard/Round/Sticky.
2. Tích hợp thành **template trong FloPoCo** (bộ sinh mạch số học mã nguồn mở, xuất VHDL): ví dụ `flopoco PositMult N=8 es=1` (tr.6).
3. **Sigmoid nhanh với es = 0** (công thức (3), tr.7, dựa trên Gustafson):
   `σ_fast(X, n) = (X ⊕ 2^(n−1)) >> 2` → **đảo bit đầu tiên rồi dịch phải 2 bit** — chỉ 2 phép toán bit, không cần bảng tra (LUT) hay phép chia.
4. Các lợi thế khác của posit cho NN (tr.8): **so sánh posit dùng chung phần cứng so sánh số nguyên** → max-pooling rẻ; phép cộng gần 0 rất chính xác.

## Thí nghiệm & kết quả
**(a) Tổng hợp phần cứng (Bảng 1, tr.9)** — Synopsys DC, công nghệ 65 nm; FP của FloPoCo **không xử lý ngoại lệ & subnormal**:
| Bộ nhân (tổ hợp) | Diện tích (µm²) | Công suất (µW) | Năng lượng (pJ) |
|---|---|---|---|
| Posit⟨8,0⟩ | 1 488 | 631.3 | 2.27 |
| Posit⟨16,1⟩ | 3 865 | 2 609.6 | 16.18 |
| Posit⟨32,2⟩ | 15 459 | 12 693.6 | 131.25 |
| FP⟨4,3⟩ (minifloat 8-bit) | 700 | 121.4 | 0.14 |
| FP⟨5,10⟩ (half) | 2 883 | 987.9 | 2.59 |
| FP⟨8,23⟩ (single) | 6 684 | 4 983.4 | 24.77 |
- Bộ nhân posit **lớn hơn và tốn năng lượng hơn** FP cùng số bit (posit⟨8,0⟩ ≈ 2.1× diện tích FP⟨4,3⟩). Bản pipeline 8-bit cần **7–8 tầng** — "rất nhiều" (tr.8). Tác giả giải thích: FP của FloPoCo chưa đầy đủ, còn bộ nhân posit thì đầy đủ.
- So với thiết kế [20] trên Zynq-7000: posit⟨16,1⟩ 266–321 LUT vs 218 LUT — **kém hơn** về LUT nhưng dùng ít DSP hơn ở 32-bit (Bảng 2, tr.9).

**(b) Huấn luyện (Bảng 3, tr.9)** — bài toán phân loại nhị phân 2 đặc trưng, MLP 2 lớp ẩn (4 và 8 nơ-ron), thư viện PySigmoid, MSE loss, 2500 epoch:
| Cấu hình | Loss @ epoch 0 | @ 1000 | @ 1250 |
|---|---|---|---|
| Float32 | 0.3701 | 0.0023 | 0.0010 |
| Posit⟨8,0⟩ | 0.3681 | 0.1530 | **0.1530 (kẹt)** |
| Posit⟨12,0⟩ | 0.3650 | 0.0140 | 0.0081 |
| Posit⟨16,1⟩ | 0.3337 | 0.0019 | 0.0011 |
| Posit⟨32,2⟩ | 0.3337 | 0.0017 | 0.0009 |
- Posit ⟨16,1⟩ và ⟨32,2⟩ hội tụ như float; **8 và 10 bit hội tụ bất thường**. Tác giả giải thích: do **posit không có underflow** (giá trị rất nhỏ bị "kẹt" ở minpos thay vì về 0) (tr.9).

**(c) Suy luận (Bảng 4, tr.10)** — LeNet-5 huấn luyện bằng float, đổi trọng số sang Posit⟨8,0⟩:
| Dataset | FP32 Top-1 | Posit⟨8,0⟩ Top-1 | Posit⟨8,0⟩ chỉ phép cộng |
|---|---|---|---|
| MNIST | 99.22% | 99.32% | 99.40% |
| CIFAR-10 | 68.04% | **56.11% (−12%)** | 58.92% |
- Posit⟨8,0⟩ tốt trên MNIST nhưng **mất ~12% Top-1 trên CIFAR-10** (tr.10).

## Hạn chế (nhóm nhận xét)
- Thí nghiệm huấn luyện là bài toán đồ chơi (2 đặc trưng). Phần suy luận chỉ xét es = 0 → dải động hẹp ([1/64, 64]), có lẽ là nguyên nhân sụt giảm trên CIFAR-10.
- So sánh phần cứng không hoàn toàn công bằng (FP thiếu xử lý ngoại lệ).

## Ý quan trọng để hiểu
- **Bằng chứng ngược chiều quan trọng:** posit 8-bit *không phải lúc nào cũng* bằng FP32 — với dữ liệu khó hơn (CIFAR-10) và es = 0 thì sụt mạnh. Dùng cho slide "Điểm yếu".
- Sigmoid nhanh là ưu điểm *đặc thù của es = 0*; nhưng es = 0 lại có dải động hẹp nhất → **đánh đổi**.

## ⚠ Đối chiếu với sườn
- Slide 10 trong sườn ("es=0 cho hàm kích hoạt nhanh") → **nguồn chính là [05] công thức (3)**, ngoài ra [21] (vector hóa trên RISC-V) có dùng. Nên ghi rõ đây là **xấp xỉ** sigmoid, không phải tính chính xác.

## Dùng cho
- Slide "Đặt vấn đề (nhược điểm IEEE 754)", "Phương pháp tối ưu: es = 0 & sigmoid nhanh", "Điểm yếu: chi phí phần cứng". Báo cáo mục 2, 4.
