# [35] Algorithm-Hardware Co-Design of Distribution-Aware Logarithmic-Posit Encodings for Efficient DNN Inference

- **Tác giả:** Akshat Ramachandran, Zishen Wan, Geonhwa Jeong, Tushar Krishna (**Georgia Institute of Technology**), **John Gustafson** (Arizona State University) (tr.1)
- **Nguồn:** **DAC 2024** — 61st IEEE/ACM Design Automation Conference (hội nghị hàng đầu về thiết kế vi mạch); arXiv:2403.05465v2 (26/03/2024). Mã nguồn: github.com/georgia-tech-synergy-lab/LogarithmicPosit (tr.1).
- **Bài mới nhất về phương pháp** trong bộ tài liệu (2024), áp dụng cả cho **Vision Transformer**.

## Bài toán (tr.1–2)
- Phân bố tham số khác nhau rất lớn giữa các lớp và giữa các mô hình (CNN vs ViT) (Hình 1a) → lượng tử hóa đều (INT/fixed) sai số lớn.
- AdaptivFloat chỉ chỉnh **dải động**, không chỉnh **hình dạng phân bố**; float có phần cứng phức tạp, lãng phí mẫu bit.
- Phần cứng posit "dù rẻ hơn float vẫn **chưa đủ hiệu quả** cho thiết bị hạn chế tài nguyên" (tr.1).

## Đóng góp — 3 phần đồng thiết kế
1. **LP (Logarithmic Posit)** — kiểu dữ liệu lai **posit + hệ đếm logarit (LNS)** (tr.2):
   - `x⟨n, es, rs, sf⟩ = (−1)^sign × 2^(2^es·k − sf) × 2^ulfx`, với **ulfx = e + log₂(1.f)** (gộp exponent và phần lẻ vào miền log).
   - 4 tham số chỉnh theo từng lớp: **n** (số bit, cho mixed precision), **es** (dải động), **rs** (độ "thon"/hình dạng), **sf** (hệ số co giãn liên tục — dịch vùng chính xác cao nhất).
   - Ở miền log, **phép nhân trở thành phép cộng** (cộng regime và ulfx) → rẻ.
2. **LPQ** — khung lượng tử hóa sau huấn luyện (PTQ) bằng **thuật toán di truyền** (tr.2–3):
   - Chỉ cần **128 ảnh không nhãn** để hiệu chỉnh.
   - Hàm thích nghi: **contrastive loss toàn cục–cục bộ** (so khớp biểu diễn trung gian từng lớp giữa mô hình lượng tử hóa và FP32, chống overfit vào tập hiệu chỉnh) × chi phí kích thước mô hình (λ = 0.4).
   - Tham số: quần thể K = 20, P = 10 lượt, C = 4 chu kỳ, khối B = 4 lớp (tr.5).
3. **LPA** — bộ tăng tốc mảng systolic 8×8 weight-stationary, PE hỗ trợ **2/4/8-bit trong cùng một PE** (MODE-A: bốn trọng số 2-bit, MODE-B: hai trọng số 4-bit, MODE-C: một trọng số 8-bit). Nhân = cộng trong miền log; cộng dồn đổi về miền tuyến tính bằng **bộ chuyển log–tuyến tính dạng mạch logic** (không dùng LUT). TSMC 28 nm (tr.3–5).

## Kết quả (ImageNet)
**Bảng 1 (tr.5) — CNN:**
| Mô hình | FP32 Top-1 | LPQ Top-1 | Bit W/A trung bình | Kích thước (MB) |
|---|---|---|---|---|
| ResNet18 | 71.08 | 70.30 | 4.2 / 5.5 | 44.60 → **4.10** |
| ResNet50 | 77.72 | 76.98 | 5.3 / 5.9 | 97.80 → **14.0** |
| MobileNetV2 | 72.49 | 71.20 | 4.1 / 4.98 | 13.40 → **1.30** |

**Bảng 2 (tr.5) — Vision Transformer:**
| Mô hình | FP32 | LPQ | W/A | Evol-Q (4/8) | FQ-ViT (4/8) |
|---|---|---|---|---|---|
| ViT-B | 84.53 | 80.14 | 4.7 / 6.3 | 79.50 | 78.73 |
| DeiT-S | 79.80 | 78.01 | 3.9 / 5.5 | 77.06 | 76.93 |
| Swin-T | 81.20 | 80.98 | 4.5 / 6.2 | 80.43 | 80.73 |
- LPQ **tốt hơn các phương pháp đối chứng** ở cùng mức bit thấp; nén trung bình **7.5×** (tr.5).
- ⚠ Nhóm kiểm tra tuyên bố "**giảm trung bình < 1%** trên CNN và ViT" (tr.1): mức giảm là 0.78 / 0.74 / 1.29 (CNN, TB **0.94** ✔) và 4.39 / 1.79 / 0.22 (ViT, TB **2.13** ✘). Trung bình cả 6 mô hình = **1.54%**. → Tuyên bố chỉ đúng cho CNN; khi trích nên ghi rõ.

**Bảng 3 (tr.5) — phần cứng (28 nm, cùng bộ đệm 512 kB):**
| Kiến trúc | Thông lượng (GOPS) | Mật độ tính toán (TOPS/mm²) |
|---|---|---|
| **LPA** | 203.4 | **16.84** |
| ANT | 44.95 | 8.81 |
| BitFusion | 44.01 | 8.64 |
| AdaptivFloat | 63.99 | 2.74 |
- ~**2×** hiệu năng/diện tích so với ANT, BitFusion (✔ 16.84/8.81 = 1.91); tác giả báo ~**2.2×** hiệu quả năng lượng so với SoTA (tr.1).

**Bảng 4 (tr.6) — so sánh loại PE trên ResNet50:**
| PE | TOPS/mm² | Top-1 | GOPS/W |
|---|---|---|---|
| LPA-2/4/8 (mixed) | 16.84 | 76.98 | 212.17 |
| LPA-8 | 6.98 | 77.70 | 124.26 |
| LPA-2 | 23.79 | **0.0** | 438.96 |
| **Posit-2/4/8 (posit chuẩn)** | **3.15** | 73.65 | **70.36** |
| AdaptivFloat-8 | 2.74 | 76.13 | 71.12 |
- So với PE **posit chuẩn**: LP có mật độ **cao hơn ~5.3×**, hiệu quả năng lượng **cao hơn ~3×** và độ chính xác cao hơn 3.33 điểm (nhóm tự tính từ bảng).

## Hạn chế (nhóm nhận xét)
- Thuật toán di truyền cần nhiều lần đánh giá mô hình → chi phí tìm kiếm (bài không báo thời gian tìm kiếm).
- ViT-B vẫn mất 4.39 điểm.
- Kết quả phần cứng từ mô phỏng chu kỳ (DnnWeaver) + tổng hợp, chưa có chip.

## Ý quan trọng để hiểu
- Xu hướng mới nhất (2024): **không dùng posit "nguyên bản"** mà dùng **họ định dạng lấy cảm hứng từ posit** (tapered + tham số hóa + miền log), chọn tham số **tự động theo từng lớp**, đồng thiết kế với phần cứng mixed-precision.
- Ngay cả Gustafson (tác giả posit) cũng là đồng tác giả → chính cộng đồng posit thừa nhận posit chuẩn cần biến thể để cạnh tranh ở ≤ 8 bit.

## Dùng cho
- Slide "Phương pháp tối ưu mới nhất (2024): Logarithmic Posit", "Xu hướng & hướng phát triển (ViT)". Báo cáo mục 4.2, 6.
