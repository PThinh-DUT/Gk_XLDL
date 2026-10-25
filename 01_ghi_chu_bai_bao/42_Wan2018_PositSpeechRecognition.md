# [42] Study of Posit Numeric in Speech Recognition Neural Inference

- **Tác giả:** Zishen Wan, Eric Mibuari, En-Yu Yang, Thierry Tambe — Harvard University (tr.1)
- **Nguồn:** ⚠ **Báo cáo đồ án môn học CS247r, Fall 2018, Harvard** (header từng trang) — **không phải bài đã qua bình duyệt (peer review)**. Khi trích dẫn cần ghi rõ là "báo cáo kỹ thuật/đồ án", độ tin cậy thấp hơn các bài khác.

## Bài toán (tr.1)
- Mô hình nhận dạng tiếng nói seq2seq có attention dễ vượt **30 M tham số → 120 MB** ở FP32, quá lớn cho SoC. Câu hỏi: lượng tử hóa tham số xuống posit thấp bit có giữ được chất lượng không?
- Mở rộng posit sang **mạng hồi quy (RNN: GRU, LSTM)** và bài toán **tiếng nói** — khác hẳn ảnh.

## Phương pháp
- Viết module Python chuyển đổi float ↔ fixed ↔ posit với **độ rộng bit bất kỳ** (tr.4).
- Huấn luyện bằng OpenNMT trên **LibriSpeech** (tr.4):
  - Model 1: 4 lớp GRU hai chiều 1024 đơn vị, ~**20 M** tham số, **WER 18.80** (FP32).
  - Model 2: 5 lớp LSTM 800 đơn vị, ~**30 M** tham số, **WER 26.28** (FP32).
- Lượng tử hóa **tham số**, **không huấn luyện lại** (tr.4).

## Kết quả
**Bảng 1 (tr.4) — WER (tỉ lệ lỗi từ, càng thấp càng tốt):**
| Định dạng | Model 1 | Model 2 |
|---|---|---|
| FP32 (gốc) | 18.80 | 26.28 |
| 8-bit fixed ⟨2,6⟩ | 22.33 | 27.25 |
| 8-bit fixed ⟨3,5⟩ | 37.05 | – |
| **8-bit posit ⟨8,0⟩** | **19.10** | **26.28** |
| FP16 | 18.80 | 26.29 |
| BF16 | 18.97 | 26.36 |
| 16-bit fixed ⟨2,14⟩ | 18.80 | 26.27 |
| 16-bit posit ⟨16,1⟩ | 18.80 | 26.28 |
- Posit 8-bit: Model 1 chỉ tăng **0.3 điểm WER**, Model 2 **không đổi**; fixed 8-bit tệ hơn rõ (tr.4).
- Mọi định dạng 16-bit ≈ FP32 (trọng số nằm trong [−2.5, 2.5]).
- Huấn luyện lại 1 epoch sau lượng tử hóa posit 8-bit: WER 19.10 → **18.84** (tr.4).

**Bảng 2 (tr.5) — độ chính xác tối đa (bit) — dữ liệu gốc của Gustafson:**
| Số bit | Float (bit) | Posit (bit) | Vùng mà posit ≥ float |
|---|---|---|---|
| 8 | 5 | 6 | 1/4 … 4 |
| 16 | 11 | 13 | 1/64 … 64 |
| 32 | 24 | 28 | 10⁻⁶ … 10⁶ |
- Định nghĩa **độ chính xác thập phân** (tr.5): `decimal accuracy = −log₁₀ |log₁₀(x_computed / x_exact)|` — nhóm dùng định nghĩa này trong Thí nghiệm A.

**Bảng 3–4 (tr.5) — phần cứng 90 nm, 100 MHz:**
| Khối | Công suất (nW) | Diện tích (µm²) |
|---|---|---|
| Bộ cộng posit 8-bit | 7 847.93 | 274.32 |
| Bộ nhân posit 8-bit | 298 139.76 | 5 090.91 |
| Bộ cộng fixed 8-bit | 8 465.93 | 336.58 |
| Bộ cộng float 32-bit | 27 753.62 | 1 153.33 |
| Bộ chuyển FP32 → posit8 | 19 841.83 | 774.49 |
| Bộ chuyển posit8 → FP32 | 19 211.70 | 695.01 |
- Bộ cộng posit 8-bit ≈ **25%** chi phí bộ cộng float 32-bit (nhóm tính: 23.8% diện tích, 28.3% công suất).

## ⚠ Nhận xét phản biện (nhóm)
- Kết luận "phần cứng posit **rẻ hơn** float hoặc fixed" (tr.6) là **quá mức**: so bộ cộng posit **8-bit** với bộ cộng float **32-bit**; còn **bộ nhân posit 8-bit** (5 090.91 µm²) **lớn gấp ~4.4 lần bộ cộng float 32-bit** và bài **không so** với bộ nhân float/fixed cùng số bit.
- Công thức (2) trong bài ghi k = m + 1 khi r = 1 — **sai đánh máy**, đúng phải là **k = m − 1**.
- Không qua bình duyệt; mô hình chỉ lượng tử hóa tham số (activation vẫn FP32).

## Dùng cho
- Slide "Tổng quan – ứng dụng ngoài ảnh (tiếng nói, RNN)", "Tapered precision (Bảng 2)". Báo cáo mục 3.1. Nhắc rõ đây là báo cáo môn học.
