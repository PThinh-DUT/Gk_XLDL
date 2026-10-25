# [21] Vectorizing posit operations on RISC-V for faster deep neural networks: experiments and comparison with ARM SVE

- **Tác giả:** Marco Cococcioni, Federico Rossi, Sergio Saponara (University of Pisa), Emanuele Ruffaldi (MMI spa) — Ý
- **Nguồn:** **Neural Computing and Applications (2021) 33:10575–10585**, Springer, DOI 10.1007/s00521-021-05814-0. Nhận bài 14/10/2020, công bố 28/02/2021 (tr.1). Truy cập mở (CC BY 4.0).

## Bài toán (tr.1–2)
- Kết hợp 2 "đổi mới đột phá": **RISC-V** (kiến trúc tập lệnh mở, miễn phí bản quyền, cho phép tự thêm lệnh) + **posit**.
- Mục tiêu dài hạn: gắn **PPU (Posit Processing Unit)** làm đồng xử lý cho RISC-V. Trước mắt: **vector hóa** các phép toán posit bằng phần mở rộng vector "V" của RISC-V, so sánh với **ARM SVE**.

## Nhược điểm IEEE Float32 bài nêu (tr.2)
- **Lãng phí hàng triệu mẫu bit cho NaN** (nhóm tính: Float32 có 2 × (2²³ − 1) = **16 777 214** mẫu NaN).
- Hai số 0 (±0) — "không đúng về mặt toán học".
- Số bit mũ/định trị cố định, không cấu hình được.

## Ý tưởng chính
1. **Posit với es = 0 cho phép các phép toán "mức L1"** chỉ dùng **ALU số nguyên** (thao tác bit + số nguyên): 2x, x/2, 1/x, 1 − x và **sigmoid nhanh** (tr.3). Từ đó xây:
   - **FastTanh:** tanh(x) = 2·sigmoid(2x) − 1
   - **FastELU:** eˣ − 1 = −2·(1 − 1/(2·sigmoid(−x)))
   → **vector hóa dễ dàng** vì chỉ là chuỗi lệnh ALU.
2. **Thư viện cppPosit** (C++14, của nhóm Pisa): phân cấp phép toán L1–L4; ba back-end cho phép toán không làm được bằng ALU: dấu phẩy động (FPU), fixed-point số nguyên lớn, **bảng tra** (cho posit 8–12 bit) (tr.4).
3. **Posit làm định dạng nén khi truyền dữ liệu**: nạp posit 8/16-bit vào thanh ghi vector rồi mới giải nén sang FP32 bên trong → mỗi lệnh nạp mang **2× hoặc 4× dữ liệu** (tr.4).
4. Vector hóa thủ công bộ mã hóa/giải mã posit ↔ FP32 (Algorithm 1–3).

## Kết quả
**Bảng 1 (tr.3) — độ chính xác DNN trên GTSRB (biển báo giao thông Đức):**
| Float32 | posit⟨16,0⟩ | ⟨14,0⟩ | ⟨12,0⟩ | ⟨10,0⟩ | ⟨8,0⟩ |
|---|---|---|---|---|---|
| 94.01% | 94.02% | 94.01% | 94.01% | 94.01% | 93.81% |
- Posit 10-bit = Float32; posit 8-bit chỉ giảm **0.2%** với dữ liệu nhỏ hơn **4×** (tr.3).

**Tốc độ (tr.5–8):**
- Hàm kích hoạt vector hóa (sigmoid, ELU; vector 8192 phần tử): nhanh hơn bản không vector hóa **ít nhất 10×** (tr.6).
- Tích vô hướng, tích chập 3×3, GEMM: giảm thời gian **hơn 2 bậc độ lớn** (> 100×) so với bản không vector hóa (tr.7).
- RISC-V vs ARM SVE (vector 512-bit, như chip Fujitsu A64FX): kết quả **"gần như hòa"** (tr.8).

## ⚠ Hạn chế quan trọng (nhóm nhận xét)
- Toàn bộ thời gian đo trên **trình mô phỏng** (RISC-V Spike RVV 0.8; QEMU cho ARM) chạy trên Intel i7-9700 (tr.4–5) → **không phải phần cứng thật**.
- Mức tăng tốc so với **bản posit không vector hóa (naive)**, **không phải so với float32 trên FPU** → không thể nói "posit nhanh hơn float 100×".
- Sigmoid/tanh/ELU nhanh là **xấp xỉ**.
- Bộ mã hóa (epilogue) vẫn còn chi phí đáng kể do chuyển đổi số nguyên 32 ↔ 16 bit (tr.8).

## Hướng tích hợp PPU vào RISC-V (tr.8–9)
1. PPU **bên trong** CPU (thêm tập lệnh, sửa trình biên dịch) — nhóm đang theo hướng này.
2. PPU là thiết bị ngoại vi (FPGA qua PCIe) — trễ cao nhất.
3. PPU là IP-core trên cùng SoC — trung gian.
- Cách tiếp cận vector hóa trên ALU có ích cho: CPU không FPU, CPU có FPU + vector, CPU nhiều lõi.

## Dùng cho
- Slide "Phương pháp tối ưu: es = 0 & hàm kích hoạt nhanh" (cùng [05]), "Tích hợp hệ thống (RISC-V)", "Hướng phát triển". Báo cáo mục 4.3.
- Thay cho ý "L1-level bit manipulations" trong sườn → nguồn đúng là [21] (thuật ngữ L1 do nhóm Pisa đặt).
