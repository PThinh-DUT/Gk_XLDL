# [06] Deep Learning Training on the Edge with Low-Precision Posits

- **Tác giả:** Hamed F. Langroudi, Zachariah Carmichael, Dhireesha Kudithipudi — RIT
- **Nguồn:** preprint arXiv:1907.13216v1, 30/07/2019 (tr.1). Bài ngắn (thực chất ~1.5 trang nội dung).

## Bài toán
- Đa số nghiên cứu posit chỉ làm **suy luận**; bài này thử **huấn luyện end-to-end** bằng posit 16/32 bit và so với float cùng số bit (tr.1).
- Động cơ năng lượng (tr.1, trích Horowitz): ở công nghệ 45 nm, từ float16 lên float32 thì năng lượng **phép cộng tăng 2×**, **phép nhân tăng ~4×**; truy cập bộ nhớ 1 MB tốn **~10×** so với 8 kB.

## Định nghĩa posit (công thức (1)–(2), tr.1) — trích dẫn tốt cho slide cấu trúc
- x = 0 nếu 00…0; NaR nếu 10…0; còn lại x = (−1)^s × 2^(2^es · k) × 2^e × (1 + f / 2^fs).
- k = −m nếu chuỗi regime là các bit 0; k = m − 1 nếu là các bit 1 (m = độ dài chuỗi).
- Chỉ **một** mẫu bit cho số 0 (không có ±0), **một** mẫu NaR cho mọi ngoại lệ; **NaR không bao giờ sinh ra do overflow/underflow** (tr.1).

## Thiết lập
- Mạng feedforward 4 lớp (3 lớp ẩn), Keras + TensorFlow; posit/float 16 & 32 bit được **mô phỏng bằng phần mềm** (tr.2).
- **Toàn bộ** tham số (trọng số, activation, gradient) dùng định dạng chỉ định, làm tròn **round-to-nearest** (không dùng stochastic rounding, không loss scaling) (tr.2).
- Kết quả là **trung bình 10 lần chạy độc lập** (Bảng I).

## Kết quả (Bảng I, tr.2)
| Tác vụ | Posit-32 | Float-32 | Posit-16 | Float-16 |
|---|---|---|---|---|
| MNIST | 98.131% | 98.087% | **96.535%** | 90.646% |
| Fashion-MNIST | 89.263% | 89.105% | **87.400%** | 81.725% |
- Posit-16 hơn Float-16 **~5.9 điểm %** (MNIST) và **~5.7 điểm %** (Fashion-MNIST) — nhóm tự tính từ bảng.
- So với float-32: posit-16 giảm 1.55 điểm (MNIST) và 1.71 điểm (Fashion) → khớp tuyên bố "**giảm < 2%**" (tr.2).
- Ý nghĩa: float16 huấn luyện thuần (không loss scaling) bị **underflow gradient**; posit16 có dải động rộng hơn quanh 1 nên chịu tốt hơn.

## Hạn chế (nhóm nhận xét)
- Mạng nhỏ (MLP), dataset nhỏ; chưa thử CNN.
- Không nêu es của posit-16 trong phần văn bản.
- Kết luận nói "vượt fixed-point" nhưng bảng **không có kết quả fixed-point** → không nên trích ý đó.
- Float16 trong thực tế luôn đi kèm loss scaling + master weights FP32 (bài cũng nhắc Narang et al., tr.2) → so sánh với float16 "trần" là bất lợi cho float16.

## Dùng cho
- Slide "Tổng quan nghiên cứu – huấn luyện". Đối chiếu Thí nghiệm D của nhóm (huấn luyện mô phỏng posit16 vs posit8).
- Phát triển thành Cheetah [07].
