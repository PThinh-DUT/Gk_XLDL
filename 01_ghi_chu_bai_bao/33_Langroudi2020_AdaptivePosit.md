# [33] Adaptive Posit: Parameter aware numerical format for deep learning inference on the edge

- **Tác giả:** Hamed F. Langroudi, Vedant Karia, **John L. Gustafson**, Dhireesha Kudithipudi — UTSA, RIT, NUS (tr.1)
- **Nguồn:** bản PDF không ghi nơi đăng. Tài liệu tham khảo [12] trong bài [11] PositNN ghi: **2020 IEEE/CVF CVPR Workshops (CVPRW), 06/2020, tr. 726–727, DOI 10.1109/CVPRW50498.2020.00371** (bản hội thảo 2 trang; file trong thư mục là bản đầy đủ).

## Bài toán (tr.1–2)
- Posit 5-bit **thất bại trên bài toán phức tạp**: ví dụ CIFAR-10, độ chính xác tụt từ **92.10% xuống 15.18%** khi dùng trọng số posit 5-bit (tr.1; số liệu tương ứng ResNet-50 trong Bảng 2).
- Nguyên nhân: posit **không theo kịp dải động khác nhau giữa các lớp**. Các giải pháp như linear quantization, mixed precision, scaling → **tăng độ phức tạp tính toán**.
- Lý do tập trung vào **biểu diễn/lưu trữ** (chưa phải tính toán) (tr.2):
  1. Phần cứng biên thương mại chủ yếu hỗ trợ float/fixed, **chưa có posit**.
  2. **Năng lượng chủ yếu tiêu tốn cho truy cập bộ nhớ**: ở 28 nm, đọc SRAM 16-bit (32 KB) tốn **80×** năng lượng một phép MAC; đọc DRAM 16-bit tốn **~2.6 bậc độ lớn (~400×)** (tr.2).
  3. Thiết bị biên thường có bộ nhớ < 1 MB.

## Ý tưởng: Adaptive Posit (tr.3–4)
- Thêm siêu tham số **nhúng vào định dạng** để chỉnh dải động theo từng lớp:
  - **Kb** — độ lệch regime (regime bias, ∈ [0, n−2]): dịch dải giá trị (giống "normalized posit" [01] / AdaptivFloat).
  - **rs** — độ dài regime tối đa (∈ [1, n−1]): rs = 1 → **float**; rs = n − 1 → **posit**; ở giữa → định dạng tapered trung gian (Hình 1).
- Bộ mã hóa/giải mã (Algorithm 1–2) và mạch RTL chuyển đổi Adaptive Posit ↔ FP32 (Hình 3–4). Lượng tử hóa: kẹp về [λ, δ] rồi làm tròn (công thức (7)).
- Khung mô phỏng: MemPosit (Python/TensorFlow), **trọng số & activation lưu ở định dạng thấp bit, tính toán đổi về FP32** (Hình 2).

## Kết quả
**Bảng 1 (tr.6) — baseline FP32:** Fashion-MNIST Conv 92.54%; CIFAR-10: Conv 81.37%, ResNet-18 91.54%, ResNet-50 92.10%; ImageNet ResNet-18 68.10%.

**Bảng 2 (tr.7) — độ chính xác suy luận (5-bit và 8-bit):**
| Dataset / mạng | AP (rs) 5b | Posit 5b | AP (Kb) 5b | AP (rs) 8b | Posit 8b |
|---|---|---|---|---|---|
| F-MNIST Conv | 91.94 | 90.48 | 92.25 | 92.61 | 92.60 |
| CIFAR-10 Conv | 71.28 | 71.30 | 73.29 | 81.22 | 81.19 |
| CIFAR-10 ResNet-18 | 46.70 | **48.57** | 57.44 | 91.10 | 91.10 |
| CIFAR-10 ResNet-50 | **51.49** | **15.18** | 15.18 | 91.65 | 91.57 |
| ImageNet ResNet-18 | 0.10 | 0.10 | 0.10 | 62.32 | 62.32 |
- ResNet-50 CIFAR-10 5-bit: Adaptive Posit (rs) hơn posit **36.31 điểm** (✔ 51.49 − 15.18) (tr.5).
- ⚠ Không phải lúc nào cũng thắng: ResNet-18 CIFAR-10 5-bit, bản rs **thua** posit (46.70 vs 48.57); CIFAR-10 Conv gần như hòa.
- ⚠ **ImageNet không cải thiện**: 8-bit cả hai đều 62.32% (FP32 68.10% → mất 5.78 điểm); 7-bit chỉ 12.65%; 5–6 bit sụp về 0.10%. Tác giả giải thích: trọng số lệch mạnh về 0 (tr.5).
- Phần cứng (Hình 5): bộ giải mã Adaptive Posit có **tần số tối đa cao hơn 5%** so với posit, cùng công suất (giảm số phép XOR khi tìm regime); bộ mã hóa không khác biệt.
- Tóm tắt của tác giả: cải thiện **2–10%** so với posit với độ rộng < 8 bit; es = 1 cho đánh đổi tốt nhất (tr.1, tr.7).

## Hạn chế (nhóm nhận xét)
- Chỉ lưu trữ, tính toán vẫn FP32.
- Kết quả ImageNet rất kém ở ≤ 7 bit → giải pháp chưa đủ cho mạng lớn; sau này được cải tiến thành ALPS [12] (chọn tham số tự động bằng SQNR/kurtosis).

## Dùng cho
- Slide "Phương pháp tối ưu – định dạng thích ứng", "Điểm yếu (ImageNet, ≤ 7 bit)". Dùng số liệu năng lượng bộ nhớ (80×, ~400×) cho slide "Đặt vấn đề".
