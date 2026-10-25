# [36] PLAM: A Posit Logarithm-Approximate Multiplier

- **Tác giả:** Raul Murillo, Alberto A. Del Barrio, Guillermo Botella (Complutense University of Madrid); Min Soo Kim (NGD Systems, Mỹ); HyunJin Kim (Dankook University, Hàn Quốc); Nader Bagherzadeh (UC Irvine, Mỹ) (tr.1)
- **Nguồn:** **IEEE Transactions on Emerging Topics in Computing (TETC)**, 2021, DOI 10.1109/TETC.2021.3109127; arXiv:2102.09262v2 (07/09/2021).
- Thiết kế được đưa vào kho mã nguồn mở **FloPoCo** (tr.5).

## Bài toán (tr.1)
- Bộ nhân posit "**còn lâu mới cạnh tranh được** với bộ nhân dấu phẩy động" về công suất (tr.1).
- Phân tích bộ nhân Posit⟨32,2⟩ (Hình 1): **bộ nhân phần định trị chiếm 67.8% diện tích và 79.0% công suất**; bộ giải mã 14.5% / 7.0%; bộ mã hóa 11.0% / 7.4% → **muốn giảm công suất phải tối ưu phép nhân phần định trị**.

## Phương pháp: nhân xấp xỉ logarit (thuật toán Mitchell, 1962) (tr.3–4)
- Posit dương: X = (2^(2^es))^k × 2^e × (1 + f) → log₂X = 2^es·k + e + log₂(1 + f) **≈ 2^es·k + e + f**, vì **log₂(1 + x) ≈ x** với 0 ≤ x ≤ 1 (công thức (12)–(13)).
- Do đó phép nhân hai posit **chỉ còn là các phép cộng**: S = S_A ⊕ S_B; K = K_A + K_B; E = E_A + E_B; **F = F_A + F_B** (thay cho (1+F_A)(1+F_B)) (công thức (14)–(17)).
- Trong phần cứng: ghép regime và exponent thành một số fixed-point → nhớ (carry) từ E_A + E_B cộng thẳng vào K_A + K_B (Hình 4). **Không cần bộ nhân, không dùng DSP.**
- **Sai số tương đối lớn nhất 11.1%**, xảy ra khi f_A = f_B = 0.5; sai số **chỉ phụ thuộc phần định trị**, không phụ thuộc regime hay exponent (công thức (24), tr.4).
  - Kiểm tra: với f_A = f_B = 0.5: f_A + f_B = 1 → nhánh thứ hai: (1−0.5)(1−0.5)/((1.5)(1.5)) = 0.25/2.25 = **0.111** ✔.

## Thí nghiệm độ chính xác (tr.4–5)
- Mô phỏng phần mềm bằng **Deep PeNSieve** + **SoftPosit** (mở rộng để hỗ trợ PLAM).
- Mô hình được **huấn luyện bằng Posit⟨16,1⟩**, rồi suy luận bằng Posit⟨16,1⟩ chính xác vs PLAM; trung bình 3 mô hình mỗi dataset.
- ⚠ Chi phí mô phỏng: huấn luyện CifarNet trên Intel i7-9700K (32 GB RAM) mất **khoảng 10 ngày** (tr.4) — bằng chứng rõ cho điểm yếu "thiếu phần cứng posit nguyên bản".

**Bảng II (tr.5) — Top-1:**
| Dataset | Float32 | Posit⟨16,1⟩ | Posit⟨16,1⟩ + PLAM |
|---|---|---|---|
| ISOLET | 0.9066 | 0.9093 | 0.9051 |
| UCI HAR | 0.9383 | 0.9307 | 0.9282 |
| MNIST | 0.9907 | 0.9903 | 0.9898 |
| SVHN | 0.8624 | 0.8513 | 0.8489 |
| CIFAR-10 | 0.6933 | 0.7247 | 0.7251 |
- PLAM chênh với posit chính xác tối đa **0.42 điểm** (ISOLET) → "không suy giảm độ chính xác" là hợp lý **với posit 16-bit**.

## Kết quả phần cứng (tr.5–6)
**Bảng III — FPGA Zynq-7000 (Vivado 2020.1):**
| Thiết kế | 16-bit LUT / DSP | 32-bit LUT / DSP |
|---|---|---|
| Các bộ nhân posit trước (5 thiết kế) | 218–273 / 1 | 469–682 / 4 |
| **PLAM** | **185 / 0** | **435 / 0** |

**ASIC TSMC 45 nm, es = 2 (Hình 5):**
- So với bộ nhân posit chính xác FloPoCo-Posit: **16-bit giảm 69.06% diện tích, 63.63% công suất**; **32-bit giảm 72.86% diện tích, 81.79% công suất**.
- Độ trễ giảm tối đa **17.01%** (so với Posit-HDL 32-bit), nhưng **vẫn chậm hơn bộ nhân float cùng số bit** do khâu phát hiện trường độ dài thay đổi.
- So với FP32 (FloPoCo, không hỗ trợ subnormal/ngoại lệ đầy đủ): PLAM 32-bit giảm **50.40% diện tích, 66.86% công suất**. Ở 16-bit, PLAM gần bằng FP16, chỉ **bfloat16 tốt hơn**.

## ⚠ Đối chiếu với sườn của bạn cùng nhóm
- Sườn ghi "**PLAU** … giảm 72.8% diện tích, 81.8% công suất" → tên đúng là **PLAM**; số chính xác **72.86% / 81.79% / 17.01%**.
- Cần nói rõ: các con số này là cho **bộ nhân 32-bit**, so với **bộ nhân posit chính xác** (không phải so với float); độ chính xác được kiểm chứng với **posit 16-bit**, chưa phải 8-bit.

## Hạn chế (nhóm nhận xét)
- Chưa đánh giá trên mạng lớn (ImageNet) do mô phỏng quá chậm.
- Sai số tối đa 11.1% mỗi phép nhân — ở mạng sâu/độ chính xác thấp có thể tích lũy (bài chưa kiểm chứng ở 8-bit).

## Dùng cho
- Slide "Phương pháp tối ưu 1: Nhân xấp xỉ logarit (PLAM)", "Điểm yếu: mô phỏng phần mềm chậm (10 ngày)". Báo cáo mục 4.1.
