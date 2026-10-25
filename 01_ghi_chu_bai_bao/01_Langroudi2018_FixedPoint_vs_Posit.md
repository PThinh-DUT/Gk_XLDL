# [01] Deep Learning Inference on Embedded Devices: Fixed-Point vs Posit

- **Tác giả:** Seyed H. F. Langroudi, Tej Pandit, Dhireesha Kudithipudi — Neuromorphic AI Lab, Rochester Institute of Technology (RIT)
- **Nguồn:** arXiv:1805.08624v1, 22/05/2018 (tr.1). Đăng tại hội thảo EMC² 2018 (Workshop on Energy Efficient ML and Cognitive Computing for Embedded Applications).
- **Loại bài:** bài ngắn 4 trang, "introductory paper" (tác giả tự gọi, tr.1).

## Bài toán
- Fixed-point là chuẩn phổ biến cho suy luận độ chính xác thấp, nhưng nó biểu diễn số **đều nhau** (uniform), trong khi trọng số DNN phân bố **không đều** (tr.1).
- Câu hỏi: dùng posit (biểu diễn không đều) để lưu trọng số CNN có tốt hơn fixed-point không, **mà không lượng tử hóa lại / không huấn luyện lại**? (tr.1).

## Phương pháp
- Posit chỉ dùng để **lưu trữ trọng số** trong bộ nhớ; khi tính toán thì đổi ngược về float32 (tr.2, Hình 2). Tức là **chưa** tính toán bằng posit.
- Fixed-point: 1 bit phần nguyên, phần lẻ 0–15 bit (tổng tối đa 16 bit), vì trọng số chủ yếu nằm trong [−1, 1] (tr.3).
- Posit: P(i,0), i = 2..8, **es = 0** vì dải động của es=0 gần với dải của trọng số nhất (tr.3).
- "**Normalized posit**": co giãn tất cả định dạng posit về cùng dải [−1, 1] để so sánh công bằng với fixed-point (tr.3).
- Ví dụ trong bài (tr.2, Hình 1): 2.56 trong P(16,1) = 4^0 × 2^1 × (1 + 0.280).

## Thiết lập thí nghiệm (Bảng I, tr.3)
| Tác vụ | Dataset | Mạng | Top-1 FP32 |
|---|---|---|---|
| Nhận dạng chữ số | MNIST (10 000 ảnh test) | LeNet (2 Conv + 2 FC) | 99.03% |
| Phân loại ảnh | CIFAR-10 (10 000) | ConvNet (3 Conv + 2 FC) | 68.45% |
| Phân loại ảnh | ImageNet (tập con 10 000) | AlexNet (5 Conv + 3 FC) | 55.45% |

## Kết quả chính (tr.3)
- Với **sai lệch < 1%** so với FP32, posit cần **5 / 7 / 7 bit** (LeNet / ConvNet / AlexNet), trong khi fixed-point cần **7 / 11 / 9 bit**.
- Tiết kiệm bộ nhớ trọng số: **28.6% / 36.4% / 23%** (tác giả công bố).
  - Nhóm tự kiểm tra: 1 − 5/7 = 28.6% ✔; 1 − 7/11 = 36.4% ✔; 1 − 7/9 = 22.2% (bài ghi 23% — có lẽ làm tròn lên). → Khi trích dẫn nên ghi "khoảng 22–23%".
- Không cần lượng tử hóa hay huấn luyện lại.

## Hạn chế (nhóm nhận xét)
- Chỉ lưu trọng số bằng posit, **tính toán vẫn bằng float32** → chưa chứng minh lợi ích về năng lượng tính toán.
- Activation (dữ liệu trung gian) vẫn là float32.
- Baseline FP32 khá thấp (CIFAR-10 68.45%, ImageNet tập con 55.45%) → mạng nhỏ, cổ điển.
- Bài 4 trang, kết quả chỉ ở dạng đồ thị (Hình 3, tr.4), không có bảng số chi tiết.

## Ý quan trọng để hiểu
- Đây là một trong những bài **đầu tiên** đưa posit vào DNN (05/2018) → đặt nền móng cho [03], [04], [07].
- Thông điệp: **cùng số bit, biểu diễn không đều (posit) khớp phân phối trọng số tốt hơn biểu diễn đều (fixed-point)**.
- Nhóm tác giả RIT (Langroudi, Kudithipudi) sau đó phát triển Deep Positron [03], [04], Cheetah [07], Adaptive Posit [33], ALPS [12].

## Dùng cho
- Slide "Tổng quan nghiên cứu – giai đoạn suy luận"; báo cáo Word mục 3.1. Đối chiếu với Thí nghiệm B của nhóm (lượng tử hóa trọng số, không huấn luyện lại).
