# [04] Performance-Efficiency Trade-off of Low-Precision Numerical Formats in Deep Neural Networks

- **Tác giả:** Z. Carmichael, H. F. Langroudi, C. Khazanov, J. Lillie, **J. L. Gustafson**, D. Kudithipudi — RIT & NUS
- **Nguồn:** CoNGA'19 (Conference for Next Generation Arithmetic), 13–14/03/2019, Singapore, ACM. DOI 10.1145/3316279.3316282; arXiv:1903.10584 (tr.1).
- **Quan hệ:** bản mở rộng của Deep Positron [03] (cùng nhóm tác giả, cùng kiến trúc EMAC trên FPGA).

## Bài toán
- Đánh giá **công bằng (cùng số bit 5–8)** giữa fixed-point, floating-point và posit trong bộ tăng tốc Deep Positron, xét cả độ chính xác lẫn chi phí phần cứng (năng lượng, độ trễ, công suất, EDP) (tr.1–2).

## Phương pháp
- EMAC (Kulisch accumulator), 3 tầng pipeline: nhân – cộng dồn – làm tròn (+ tầng ReLU) (tr.3).
- Mạng: **feedforward (fully-connected) 3–4 lớp** (tr.5) — vẫn **không phải CNN**.
- Lượng tử hóa trọng số & đầu vào từ FP32 sang định dạng đích bằng **round-to-nearest-even** (tr.6), **không huấn luyện lại**.
- Quét tham số: posit es ∈ {0,1,2}; float we (bit mũ); fixed Q (bit lẻ) → chọn cấu hình tốt nhất cho mỗi định dạng (tr.6).
- Sai số lượng tử hóa đo bằng MSE (công thức (3), tr.5).

## Kết quả chính
**Bảng 1 (tr.6) — độ chính xác với EMAC 8-bit (trong ngoặc: tham số tốt nhất):**
| Dataset | Số mẫu | Posit (es) | Float (we) | Fixed (Q) | FP32 |
|---|---|---|---|---|---|
| WI Breast Cancer | 190 | 85.9% (2) | 77.4% (4) | 57.8% (5) | 90.1% |
| Iris | 50 | 98.0% (1) | 96.0% (3) | 92.0% (4) | 98.0% |
| Mushroom | 2 708 | 96.4% (1) | 96.4% (4) | 95.9% (5) | 96.8% |
| MNIST | 10 000 | 98.5% (1) | 98.4% (4) | 98.3% (5) | 98.5% |
| Fashion-MNIST | 10 000 | 89.6% (1) | 89.6% (4) | 89.2% (4) | 89.5% |

- Posit **bằng hoặc vượt** float và fixed trên mọi dataset; với Fashion-MNIST cả posit lẫn float 8-bit còn nhỉnh hơn FP32 (89.6 vs 89.5) (tr.6).
- Heatmap MSE theo từng lớp (Hình 5, tr.6): posit có sai số lượng tử hóa thấp nhất, **rõ nhất ở ≤ 5 bit** (tr.5).
- **Ảnh hưởng của es (mục 5.1, tr.6–8):**
  - EDP của EMAC posit es=0 **thấp hơn 3×** so với es=2 và **1.4×** so với es=1.
  - Độ chính xác trung bình (5–7 bit) với es=1 **cao hơn 2%** so với es=2 và **4%** so với es=0.
  - Khuyến nghị: 8-bit → **es=1 cho ứng dụng tiết kiệm năng lượng**, **es=2 cho ứng dụng cần độ chính xác** (tr.8).
- **Phần cứng (tr.5–6):** posit tốn nhiều tài nguyên hơn ở cùng số bit, nhưng **dải động rộng hơn**, **tần số tối đa cao hơn** float; EDP posit ≈ float; float thường **tiêu thụ ít công suất hơn** posit; fixed có độ trễ thấp nhất nhưng độ chính xác kém nhất.
- Bảng 2 (tr.8): tổng hợp các thiết kế phần cứng posit trước 2019 (FPGA/ASIC, 20–90 nm) — đa số **không hỗ trợ quire**.

## Hạn chế (nhóm nhận xét)
- Vẫn là mạng fully-connected nhỏ; dataset nhỏ.
- Chọn "best of sweep" cho từng định dạng → đây là kết quả *tốt nhất có thể*, không phải một cấu hình cố định.
- Kết quả phần cứng trên FPGA, không phải ASIC.

## Ý quan trọng để hiểu
- **Đánh đổi es:** es nhỏ → phần cứng rẻ (EDP thấp) nhưng dải động hẹp; es lớn → dải động rộng nhưng độ chính xác cục bộ thấp hơn. es=1 là điểm cân bằng cho 5–7 bit.
- So với [03], bài này thêm MNIST & Fashion-MNIST (10 000 mẫu test) → kết luận đáng tin hơn.

## Dùng cho
- Slide "Tổng quan nghiên cứu – suy luận", "Bảng đánh giá ưu/nhược", "Lựa chọn es". Đối chiếu với Thí nghiệm B (lượng tử hóa trọng số LeNet-5 trên Fashion-MNIST, quét es).
