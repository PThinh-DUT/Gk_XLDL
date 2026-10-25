# [12] ALPS: Adaptive Quantization of Deep Neural Networks with GeneraLized PositS

- **Tác giả:** Hamed F. Langroudi, Vedant Karia, Zachariah Carmichael, Abdullah Zyarah, Tej Pandit, **John L. Gustafson**, Dhireesha Kudithipudi — University of Texas at San Antonio (UTSA), RIT, NUS (tr.1)
- **Nguồn:** **IEEE/CVF CVPR Workshops 2021** (workshop Efficient Deep Learning for Computer Vision), tr. 3100–3109, DOI 10.1109/CVPRW53098.2021.00346 — đã xác nhận trên CVF Open Access (bản PDF trong thư mục không ghi nơi công bố).

## Bài toán (tr.1–3)
- Posit < 8 bit **không theo kịp sự khác biệt phân bố tham số giữa các lớp và trong từng lớp** → độ chính xác sụt "thảm họa".
- Dùng mixed-precision từng lớp thì không gian tìm kiếm bùng nổ: ResNet-110 với 4 lựa chọn bit → 4¹¹⁰ ≈ **1.68 × 10⁶⁶** cấu hình (tr.1).
- Adaptive Posit [33] giải quyết được nhưng **phụ thuộc tìm kiếm lớn** (tr.3).
- Động cơ thiết bị biên: triển khai trên vi điều khiển ARM M-7 cần **~153.5× bộ nhớ** và **~4× công suất** so với ngân sách thiết bị (tr.1).

## Ý tưởng: "Generalized posit" (tr.2)
Thêm 2 tham số vào posit:
- **sc** (exponent bias, sc ∈ [−(n−2)/2, (n−2)/2]): **dịch "vùng vàng"** (vùng chính xác nhất) lên/xuống. maxpos = 2^(2^es·(n−2)+sc), minpos = 2^(−2^es·(n−2)+sc).
- **rs** (độ dài regime tối đa, rs ∈ [1, n−1]): **giới hạn regime** để exponent/fraction không biến mất ở hai đầu dải.
  - rs = 1 → giống **float IEEE** (phần định trị cố định); rs = n − 1 → **posit chuẩn**; ở giữa → các dạng tapered khác.
- Mô hình hóa lượng tử hóa posit tổng quát như **hệ compander** (nén – lượng tử hóa đều – giãn), compressor `y = (1/γ)·sinh⁻¹(θx)` (Hình 1, công thức (5)–(6)).
- **SQNR** (tỉ số tín hiệu/nhiễu lượng tử): `SQNR_GP(dB) ≈ (10.79 − 20·log γ) + 20·log(1/Δ_GP)` (công thức (8), tr.3) → dùng để chọn cấu hình mà **không phải dò hết**.
- Cận trên xác suất phân loại sai theo SQNR của trọng số & activation từng lớp (công thức (12), tr.4).

## Thuật toán ALPS (tr.4–5)
1. Chọn một lớp tham chiếu; chọn **rs** sao cho **độ nhọn (excess kurtosis)** của phân bố giá trị posit tổng quát gần với của trọng số nhất; chọn **sc** khớp **giá trị trung bình** (Algorithm 1).
2. Suy ra rs, sc cho các lớp khác theo tỉ lệ sai số (công thức (13)–(16)).
3. Lượng tử hóa: kẹp về [min, max] rồi làm tròn RNE (công thức (17)).
4. Tích vô hướng dùng **quire** (Algorithm 2).
- Phần cứng mô phỏng: mảng systolic **16×16 PE** (theo Eyeriss v2), dataflow output-stationary, SRAM 3×108 kB, công nghệ 32 nm, dùng SCALE-Sim (tr.5–6).

## Kết quả
**Bảng 1 (tr.7) — baseline FP32:** CIFAR-10: ResNet-50 92.10%, EfficientNet-B0 98.00%; ImageNet: ResNet-50 74.60%, EfficientNet-B4 83.00%. Trọng số nằm khoảng [−2.2, 2.8].

**Bảng 2 (tr.7) — CIFAR-10 (lượng tử hóa trọng số + activation):**
| Bit | GP ResNet-50 | Posit ResNet-50 | Scaled float ResNet-50 | GP EffNet | Posit EffNet | Scaled float EffNet |
|---|---|---|---|---|---|---|
| 8 | 91.75 | 91.15 | 91.66 | 97.37 | 96.89 | 96.91 |
| 6 | 76.00 | 58.31 | 70.00 | 70.64 | 60.09 | 66.59 |
| 5 | **51.65** | **10.02** | 46.70 | 53.66 | 10.00 | 47.20 |

**Bảng 3 (tr.7) — ImageNet:**
| Bit | GP ResNet-50 | Posit ResNet-50 | Scaled float ResNet-50 | GP EffNet-B4 | Posit EffNet-B4 | Scaled float EffNet-B4 |
|---|---|---|---|---|---|---|
| 8 | 74.11 | 73.61 | 74.06 | 81.39 | 80.24 | 80.70 |
| 6 | 63.76 | 53.46 | 62.31 | 66.41 | 57.33 | 64.20 |
| 5 | **46.22** | **0.10** | 10.00 | 48.15 | 0.10 | 11.37 |
- Trung bình, generalized posit (es = 1) hơn posit chuẩn **14%** và scaled float **6%** (tr.6).
- ResNet-50 CIFAR-10 5-bit: hơn posit chuẩn **41.63 điểm** (✔ 51.65 − 10.02).
- So với posit chuẩn: độ chính xác +0.6% (8-bit) đến +12% (6-bit), **chi phí EDP tăng ~6%** (tr.7).
- **es nhỏ hơn → năng lượng thấp hơn** do mã hóa/giải mã đơn giản (Hình 5).
- Output-stationary giảm 24% độ trễ so với weight-stationary (tr.7).

## Nhận xét quan trọng của chính tác giả (tr.6)
- Chỉ lượng tử hóa **trọng số**: posit thắng float vì trọng số tập trung quanh 0 với dải ~2, đúng vùng SQNR cao của posit.
- Khi lượng tử hóa **cả activation**: dải của activation thay đổi theo lớp → có lúc **float thắng posit**. → Cần định dạng có SQNR **điều chỉnh được** như generalized posit.

## Hạn chế (nhóm nhận xét)
- Ở 5 bit, dù tốt hơn hẳn, ImageNet vẫn chỉ ~46–48% (so với 74–83%) → chưa dùng được thực tế; 8 bit thì posit chuẩn đã gần đạt.
- Kết quả phần cứng là **mô phỏng** (cycle emulator), chưa có chip thật.

## Ý quan trọng để hiểu
- **Posit chuẩn ≤ 5 bit có thể sụp đổ hoàn toàn (0.1–10%)** trên mạng thật → bằng chứng mạnh cho slide "Điểm yếu".
- Generalized posit = "**posit có thể chỉnh vị trí vùng vàng (sc) và độ nhọn (rs)**" → hợp nhất float và posit trong một họ định dạng.

## Dùng cho
- Slide "Phương pháp tối ưu mới: lượng tử hóa thích ứng (ALPS, Adaptive Posit, LP)", "Điểm yếu (≤ 5 bit)". Báo cáo mục 4.2.
