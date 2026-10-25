# [40] Posit Arithmetic for the Training and Deployment of Generative Adversarial Networks

- **Tác giả:** Nhut-Minh Ho, Duy-Thanh Nguyen, Himeshi De Silva, **John L. Gustafson**, Weng-Fai Wong (National University of Singapore); Ik Joon Chang (Kyung Hee University, Hàn Quốc) (tr.1)
- **Nguồn:** **DATE 2021** (Design, Automation & Test in Europe, 01–05/02/2021), tr. 1350–1355 — đã xác nhận trên kho kỷ yếu DATE (bản PDF trong thư mục không ghi nơi đăng).
- Mở rộng thư viện **QPyTorch** để hỗ trợ posit bất kỳ độ rộng (tr.4).

## Bài toán (tr.1–2)
- GAN (mạng sinh đối nghịch) khó hơn CNN phân loại: 2 mạng (Generator G, Discriminator D), dùng LeakyReLU, tanh, transposed convolution; đầu ra là **hàng nghìn/triệu điểm ảnh** rất nhạy với sai số số học → thường phải huấn luyện bằng FP32.
- Cách duy nhất đáng tin cậy trước đó: **mixed precision FP16 của NVIDIA Apex (chế độ O1)**. Chưa ai huấn luyện GAN với 8 bit.

## Phương pháp (tr.3–4)
1. **Phân bổ định dạng** (Hình 5): trọng số, activation, error dùng **P(8,2)**; gradient & trạng thái optimizer dùng **P(16,2)** (cùng es → đổi qua lại giữa 8 và 16 bit chỉ cần thêm/bớt bit cuối).
   - Thử es = 1, 2, 3: **es = 2 tốt nhất**; **es ≤ 1 không hội tụ** ở đa số GAN do tràn trên/dưới; es ≥ 3 chất lượng thấp do ít bit định trị (tr.3).
2. **Co giãn trọng số bằng "độ lệch mũ" t** (biased encoder/decoder): trọng số GAN tập trung ở [2⁻⁵, 2⁻⁴] → dịch về quanh 2⁰ (vùng posit chính xác nhất). t = ⌊0 − (bin đỉnh của histogram log₂|W|)⌋; t ổn định 3–5, **dùng chung một t cho mọi lớp**, tính một lần ở vòng lặp đầu (tr.3–4). Vì t là lũy thừa 2 nên co giãn **chỉ là cộng/trừ vào trường mũ**, không cần phép nhân.
   - Nhận xét then chốt của tác giả: **co giãn trọng số không có lợi cho float** vì độ chính xác của float **phẳng** (không phụ thuộc độ lớn) — chỉ posit (độ chính xác thon) mới hưởng lợi (tr.3).
3. **Loss scaling kiểu posit**: float dịch gradient lên gần giá trị lớn nhất (tránh underflow, ví dụ FP16 max 65504); posit dịch gradient về **vùng chính xác cao 2⁻⁴ … 2⁴** (es = 2) (tr.4, Hình 6).
4. **tanh xấp xỉ nhanh**: Sigmoid(x) = (x ⊕ 0x8000) >> 2 (posit es = 0), **PositTanh(x) = 2·Sigmoid(2x) − 1**, dùng P(16,0); hiệu chỉnh: nếu |R| > θ = 0.76 thì cộng δ = 0.068 (tr.4, Hình 7):
| | Sai số tuyệt đối max | Sai số TB | Năng lượng (so với tanh FP16) |
|---|---|---|---|
| P_approx | 0.098 | 0.056 | 0.066 |
| P_approx + hiệu chỉnh | **0.0379** | **0.0086** | 0.087 |
- Lưu ý mô phỏng: cộng dồn dùng **FP32 thay cho quire** (quire 256-bit chậm hơn cả FP64 khi chạy phần mềm) → kết quả là **cận dưới** của chất lượng (tr.4).

## Kết quả
**Bảng I (tr.5) — chất lượng sau huấn luyện, FID (càng thấp càng tốt; ESRGAN dùng PSNR, càng cao càng tốt):**
| GAN | FP32 | FP16 (Apex) | **P8+** (có co giãn) | P8 | FP8 (HFP8) |
|---|---|---|---|---|---|
| CGAN-MNIST | 67.31 | 64.58 | 70 | 75.41 | **423.28** |
| DCGAN-LSUN | 43.12 | 49 | 44.82 | 49.54 | **318.07** |
| Horse2zebra | 77.2 | 64.3 | 61.1 | 70.1 | 75.63 |
| Summer2winter | 77.6 | 78.52 | 77.12 | 75.67 | 84.01 |
| Zebra2horse | 134.2 | 134.5 | 138.36 | 148.49 | 138.13 |
| Winter2summer | 75 | 73.46 | 72.79 | 74.75 | 77.16 |
| ESRGAN (PSNR ↑, > 500 lớp) | 24.67 | 24.69 | 24.74 | 24.53 | **4.62** |
- **P8 thắng FP8 cùng số bit**; FP8 **thất bại nặng** ở CGAN, DCGAN, ESRGAN. Với kỹ thuật co giãn, **P8+ ngang FP16** ở đa số GAN (tr.5).
- **Triển khai (chỉ chạy G):** posit **6-bit** (es = 1) + co giãn + tanh xấp xỉ: đa số thí nghiệm **SSIM > 0.9** (Hình 9, tr.5).
- **Mô phỏng phần cứng** (GEM5 + thư viện 65 nm, 1 GHz): P8 tiêu thụ **ít năng lượng và thời gian hơn FP8** khi huấn luyện; khi triển khai lợi ích giảm bit là **siêu tuyến tính** (công suất giảm ít nhất tuyến tính và thời gian cũng giảm; chi phí phép nhân ~ bình phương số bit) (tr.6). Bài không ghi số cụ thể trong văn bản (chỉ có đồ thị Hình 10).

## Hạn chế (nhóm nhận xét)
- FID của P8+ vẫn kém FP32/FP16 ở một số GAN (CGAN 70 vs 64.58; Zebra2horse 138.36 vs 134.2).
- Không dùng quire thật; kết quả phần cứng là mô phỏng.

## Ý quan trọng để hiểu
- Mở rộng posit sang **mô hình sinh (GAN)** — bài toán nhạy số học hơn phân loại → cho thấy tầm áp dụng rộng.
- Một lần nữa: **co giãn (scaling) về vùng quanh 1** là "chìa khóa" để posit 8-bit hoạt động — nhất quán với [07], [08], [12], [33].

## Dùng cho
- Slide "Tổng quan – huấn luyện (GAN)", "Phương pháp tối ưu: co giãn bằng độ lệch mũ, tanh nhanh". Báo cáo mục 3.2, 4.
