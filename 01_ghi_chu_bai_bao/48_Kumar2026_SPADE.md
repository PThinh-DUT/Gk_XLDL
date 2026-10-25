# [48] SPADE: A SIMD Posit-enabled compute engine for Accelerating DNN Efficiency

- **Tác giả:** Sonu Kumar, Lavanya Vinnakota, Mukul Lokhande, Santosh Kumar Vishvakarma (**IIT Indore**, Ấn Độ), Adam Teman (tr.1)
- **Nguồn:** preprint **arXiv:2601.17279v1, 24/01/2026**, định dạng bản thảo gửi **IEEE Transactions on VLSI Systems** ("VOL. XX, NO. X, 202X") → **chưa chính thức xuất bản** tại thời điểm làm báo cáo. **Bài mới nhất** trong bộ tài liệu.

## Bài toán (tr.1–2)
- DNN có **độ nhạy độ chính xác khác nhau theo lớp**: lớp tích chập đầu chịu lượng tử hóa mạnh tốt, lớp sâu/FC cần chính xác hơn → cần phần cứng **đa độ chính xác (multi-precision)**.
- NPU thương mại đã đa độ chính xác nhưng với float/bfloat: NPU Samsung (SoC 4 nm) hỗ trợ FP 8/16/32/64; AMD XDNA hỗ trợ FP, BF16, TF32 (tr.2). **Chưa có MAC SIMD đa độ chính xác cho posit**; khó khăn: regime độ dài thay đổi, căn chỉnh/chuẩn hóa phụ thuộc độ chính xác, lan truyền nhớ (carry).

## Đóng góp (tr.2–3)
- **Một datapath MAC duy nhất** chạy được **1× Posit(32,2)**, **2× Posit(16,1)** hoặc **4× Posit(8,0)** mỗi chu kỳ (tín hiệu MODE 2 bit), bằng cách **chia sẻ** các khối đặc thù posit: bộ bù hai, bộ dò số 1 đầu (LOD), bộ dịch, bộ nhân Booth — **không nhân bản datapath**.
- Pipeline 5 tầng: giải mã → nhân định trị → **cộng dồn bằng quire** (không làm tròn trung gian) → chuẩn hóa → làm tròn RNE & đóng gói.
- Tích hợp vào mảng systolic điều khiển bởi lõi RISC-V CVA6 (Hình 3).
- Kiểm chứng chức năng: **1000 ca ngẫu nhiên**, khớp hoàn toàn với **SoftPosit (Python)** cho Posit(8,0), (16,1), (32,2) (tr.4) — cùng thư viện tham chiếu mà nhóm dùng để kiểm chứng bộ mô phỏng.

## Kết quả
**Bảng I (tr.4) — FPGA:**
| Thiết kế | LUT | FF | Trễ (ns) | Công suất (mW) |
|---|---|---|---|---|
| SPADE Posit-8 | 366 | 41 | 1.22 | 93 |
| SPADE Posit-16 | 1 341 | 144 | 1.52 | 119 |
| SPADE Posit-32 | 5 097 | 544 | 2.45 | 402 |
| **SPADE SIMD 8/16/32** | **5 674** | **625** | 2.51 | 569 |
| ISCAS'25 (SIMD log-posit xấp xỉ) | 4 613 | 2 078 | 6.2 | 276 |
| TCAS-II'24 (SIMD INT4/FP8/16/32) | 8 054 | 1 718 | 4.62 | 296 |
| TVLSI'23 (SIMD FP16/32/64) | 8 065 | 1 072 | 5.56 | 376 |
| TCAS-II'22 (Posit-FP 8/16/32) | 5 972 | 1 634 | 3.74 | 99 |
- Tác giả báo: Posit(8,0) giảm **45.13% LUT, 80% slice**; Posit(16,1) / (32,2) giảm **28.44% / 17.47%** LUT so với công trình trước; **không dùng DSP**; hỗ trợ đa độ chính xác chỉ tốn thêm **6.9% LUT, 14.9% thanh ghi** so với MAC Posit-32 đơn lẻ (tr.4).
- **ASIC 28 nm (Bảng II):** **1.38 GHz, 0.9 V, 6.1 mW, 0.025 mm²** — công suất thấp nhất trong bảng so sánh (các thiết kế khác 7.3–99 mW).
- Thông lượng/W ở chế độ Posit-8 cao **tới 4×** so với MAC Posit-32 đơn lẻ (tr.4).

**Hình 4 (tr.4) — độ chính xác suy luận (%)** (nhóm đọc trực tiếp từ đồ thị):
| Mô hình / dữ liệu | FxP8 | FxP16 | FP16 | FP32 | Posit(8,0) | Posit(16,1) | Q-Posit(8,0) | Q-Posit(16,1) |
|---|---|---|---|---|---|---|---|---|
| LeNet-5 / MNIST | 98.2 | 98.9 | 94.1 | 98.98 | 95.7 | 98.86 | 98.2 | 98.86 |
| LeNet-5 / CIFAR-10 | 98.2 ⚠ | 98.9 ⚠ | 94.1 ⚠ | 98.98 ⚠ | 78.1 | 85 | 81.2 | 85 |
| AlexNet / CIFAR-10 | 77.2 | 78 | 78.9 | 80.2 | **70.13** | 80.1 | 76.4 | 80.2 |
| VGG-16 / CIFAR-10(0) | 80.2 | 84.1 | 83.1 | 84.8 | 79.8 | 83 | 82.8 | 84.1 |
- Posit(16,1) ≈ FP32 ✔. Nhưng **Posit(8,0) giảm rõ**: −3.28 (MNIST), **−10.07** (AlexNet), −5.0 (VGG-16) điểm so với FP32 → tuyên bố "iso-accuracy" chỉ đúng với 16-bit.

## ⚠ Các điểm không nhất quán phát hiện trong bài (cần thận trọng khi trích)
1. **Hình 4:** 4 cột đầu của LeNet-5/CIFAR-10 **giống hệt** LeNet-5/MNIST (98.2/98.9/94.1/98.98) — LeNet-5 trên CIFAR-10 không thể đạt ~99% (thực tế ~65–70%, xem [05] 68.04%) → có lẽ **lỗi sao chép**.
2. Nhãn trục ghi "VGG-16/CIFAR-10" nhưng văn bản ghi "VGG-16 (CIFAR-100)"; tóm tắt nói có "alphabet datasets" nhưng hình không có.
3. Overhead đa độ chính xác: theo Bảng I, LUT tăng (5 674 − 5 097)/5 097 = **11.3%**, không phải 6.9% như văn bản (thanh ghi 625/544 → 14.9% ✔ khớp).
4. Thiết bị ghi "Virtex-7 (xc7z010clg400)" nhưng **xc7z010 là chip Zynq-7000**, không phải Virtex-7.
5. Diện tích ASIC 28 nm: văn bản ghi "2.548 µm²" nhưng Bảng II ghi 0.025 mm² (= 25 000 µm²) và Bảng III tổng 24 856 µm² → lỗi đơn vị trong văn bản.
6. Trên FPGA, công suất SIMD (569 mW) **cao hơn** mọi thiết kế so sánh trong Bảng I (99–376 mW) — bài không bình luận điểm này.

## Ý quan trọng để hiểu
- Xu hướng 2025–2026: **phần cứng posit đa độ chính xác** cho phép dùng posit 8-bit ở lớp chịu được và 16/32-bit ở lớp nhạy — tương tự hướng mixed-precision của PositNN [11] (phần mềm) và LP [35].
- Là preprint mới, **chưa qua bình duyệt**, có nhiều lỗi trình bày → dùng như "xu hướng mới nhất", không dùng làm bằng chứng chính.

## Dùng cho
- Slide "Phương pháp tối ưu – phần cứng SIMD đa độ chính xác (2026)", "Hướng phát triển". Báo cáo mục 4.1, 6.
