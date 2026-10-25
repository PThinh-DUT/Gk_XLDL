# [07] Cheetah: Mixed Low-Precision Hardware & Software Co-Design Framework for DNNs on the Edge

- **Tác giả:** Hamed F. Langroudi, Zachariah Carmichael, David Pastuch, Dhireesha Kudithipudi — RIT
- **Nguồn:** preprint arXiv:1908.02386v1, 06/08/2019 (tr.1).
- **Quan hệ:** gộp và mở rộng [03], [04], [06] thành một framework đồng thiết kế phần cứng–phần mềm.

## Bài toán (tr.1–2)
- Thiết bị biên cần mô hình nhỏ: AlexNet ~61 M tham số, ~1.4 GFLOPS; MobileNet 8-bit fixed ~4.2 M tham số nhưng **kém ~10%** so với bản FP32 trên ImageNet (Snapdragon 835) (tr.1).
- Thiếu một framework so sánh **cùng số bit** giữa posit/float/fixed cho **cả huấn luyện lẫn suy luận**, và so sánh **cách lượng tử hóa** (tr.1–2).

## Phương pháp (tr.3–6)
- Cheetah = phần mềm (Keras/TensorFlow + thư viện C/C++) + phần cứng (lõi EMAC VHDL trên FPGA Virtex-7).
- Hỗ trợ: 3 định dạng (fixed, float, posit), **2 cách lượng tử hóa**, mạng FC và CNN.
- Công thức lớp (5) (tr.4): `Y_j = B_j + 1/(α1·α2) · Σ Q(α1·A_i) · Q(α2·W_ij)`
  - **Rounding quantization:** α1 = α2 = 1, giá trị ngoài dải bị **kẹp (clip)** về max/min, còn lại làm tròn gần nhất.
  - **Linear quantization:** co giãn activation & trọng số về [−β, β] trước khi làm tròn: α1 = β / max(A), α2 = 2β / (max(W) − min(W)); β ∈ {1, 2, 4, 8}. Có thể thay phép nhân α bằng **phép dịch bit** (α xấp xỉ lũy thừa 2).
- Cộng dồn bằng EMAC/quire: độ rộng `w_q = ⌈log2 N_op⌉ + 2^(es+2)·(n−2) + 2` (công thức (6), tr.5).
- Độ phủ dải động của định dạng ≤ 8 bit với β ∈ {1,2,4,8} (Bảng I, tr.6): posit es0 94.12%, es1 81.57%, es2 69.02%; float we4 66.66%, we3 85.71%; fixed 100%.

## Thiết lập (Bảng II, tr.7)
| Dataset | Mạng | Tham số | FP32 |
|---|---|---|---|
| MNIST | 4 FC / 2 Conv + 2 FC | 0.34 M / 1.40 M | 98.46% / 99.32% |
| Fashion-MNIST | 4 FC / 2 Conv + 3 FC + BN | 0.34 M / 1.88 M | 89.51% / 92.54% |
| CIFAR-10 | 7 Conv + 1 FC | 0.95 M | 81.37% |

## Kết quả chính
**(a) Suy luận, rounding quantization (Bảng III, tr.7)** — chọn tham số tốt nhất cho mỗi định dạng:
| Dataset / mạng | Posit 8b | Posit 5b | Float 8b | Float 5b | Fixed 8b | Fixed 5b |
|---|---|---|---|---|---|---|
| MNIST Conv | 99.35 | 98.94 | 99.34 | 92.27 | 99.18 | 96.96 |
| Fashion FC | 89.59 | 88.14 | 89.56 | 83.00 | 89.16 | 83.97 |
| Fashion Conv | 92.70 | 88.92 | 92.63 | 68.21 | 89.59 | 83.46 |
| **CIFAR-10 Conv** | **80.40** | **41.33** | 79.75 | **12.83** | **24.27** | 9.71 |
- Ở 8 bit, posit ≈ float (chênh < 1 điểm); **khác biệt lớn xuất hiện ở 5–6 bit**: CIFAR-10 5-bit posit hơn float **28.5 điểm** và hơn fixed **31.62 điểm** (tr.6; nhóm kiểm tra: 41.33 − 12.83 = 28.50 ✔, 41.33 − 9.71 = 31.62 ✔).
- Fashion FC 5-bit: posit hơn float **5.14** và fixed **4.17** điểm (✔ 88.14 − 83.00; 88.14 − 83.97).
- Posit tốt nhất phần lớn với **es = 1**, float với we = 4 (tr.6).
- Độ méo (distortion, công thức (7)) của posit thấp nhất, rõ nhất ở 5 bit (Hình 4).

**(b) Linear quantization (Bảng IV, tr.8)** — co giãn trước khi lượng tử hóa **cứu** các định dạng hẹp:
| MNIST, 5-bit | Rounding | Linear (nhân) | Linear (dịch bit) |
|---|---|---|---|
| Posit es=0 | 91.05% | 98.19% | 98.28% |
| Posit es=1 | 98.30% | 98.34% | 98.42% |
| Float | 93.91% | 98.02% | 98.06% |
| Fixed | 97.88% | 96.41% | 97.17% |
| (FP32 = 98.46%) | | | |
- Fashion-MNIST 5-bit posit es=0: 76.87% → 88.17% (nhân) / 88.10% (dịch).
- Kết luận: với linear quantization, **posit es=0 đạt độ chính xác ≈ es=1** → dùng EMAC es=0 (phần cứng rẻ hơn) tiết kiệm **18% EDP** (tr.10).

**(c) Huấn luyện (Bảng V, tr.8):** giống hệt Bảng I của [06] (Posit-16 96.535% vs Float-16 90.646% trên MNIST; 87.400% vs 81.725% trên Fashion-MNIST).

**(d) Phần cứng (tr.8–10):**
- Posit + rounding: cải thiện độ chính xác trung bình **tới 23%** so với fixed, đổi lại EDP tăng 0.41×10⁻¹⁰.
- EMAC posit có **độ trễ thấp hơn** float (không cần phát hiện subnormal/ngoại lệ) nhưng **mã hóa/giải mã tốn tài nguyên** do regime độ dài thay đổi (Hình 6–7).
- **Posit 6-bit** cho đánh đổi EDP–độ chính xác tốt nhất trong dải 5–8 bit.
- es=1 so với es=2: độ chính xác +2%, EDP **ít hơn 2.1×**; so với es=0: độ chính xác +4%, EDP **nhiều hơn 1.4×** (tr.10).

## ⚠ Mâu thuẫn nội tại phát hiện khi đọc
- Mục V.C (tr.8) viết posit-16 huấn luyện "**giảm < 1%**" so với FP32, nhưng Bảng V cho MNIST: 98.087 − 96.535 = **1.55 điểm**; Fashion: 89.105 − 87.400 = **1.71 điểm**. Bài [06] (cùng số liệu) viết "< 2%" — **đúng hơn**. → Khi trích, dùng "< 2%".

## Hạn chế (nhóm nhận xét)
- Huấn luyện chỉ với MLP 4 lớp và chỉ 16/32 bit.
- "Best of sweep" cho từng định dạng.

## Ý quan trọng để hiểu
- **Co giãn (scaling) quan trọng ngang với định dạng**: posit đẹp nhất quanh 1, nên phải đưa dữ liệu về gần 1 (linear quantization) — tư tưởng này phát triển thành layer-wise scaling [08], adaptive posit [33], ALPS [12].
- Lợi thế của posit chỉ thật sự nổi bật ở **≤ 6 bit**; ở 8 bit, float 8-bit (we = 4) gần như ngang bằng.

## Dùng cho
- Slide "Tổng quan – suy luận CNN", "Bảng đánh giá", "Phương pháp tối ưu: co giãn/lượng tử hóa tuyến tính". Đối chiếu Thí nghiệm B (quét số bit, có/không co giãn).
