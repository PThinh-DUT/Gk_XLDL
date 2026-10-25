# [27] A Posit Based Multiply-accumulate Unit with Small Quire Size for Deep Neural Networks

- **Tác giả:** Yasuhiro Nakahara, Yuta Masuda, Masato Kiyama, Motoki Amagasaki, Masahiro Iida — **Kumamoto University**, Nhật Bản
- **Nguồn:** **IPSJ Transactions on System LSI Design Methodology**, Vol. 15, tr. 16–19 (06/2022), DOI 10.2197/ipsjtsldm.15.16. Bài ngắn (Short Paper), nhận 06/10/2021, chấp nhận 18/03/2022 (tr.1).

## Bài toán (tr.1)
- MAC posit cần thanh ghi **quire rất lớn** để cộng dồn chính xác; kích thước quire **cố định**, phải phủ toàn bộ dải động của posit → tốn diện tích, bất lợi cho thiết bị biên.

## Ý tưởng (tr.1–2, Hình 1–2)
- Thay quire dạng fixed-point khổng lồ bằng **"quire nhỏ" có dạng dấu phẩy động**: r bit phần định trị (r ≥ 3, chọn tùy ứng dụng) + **thanh ghi số mũ riêng**: `x_quire = q_frac × 2^q_exp` (công thức (2)).
- Khi cộng dồn: so sánh số mũ, **dịch số nhỏ hơn sang phải** rồi cộng; nếu tràn thì dịch quire sang phải → chỉ cần **1 bit bảo vệ (guard bit)**.
- Kèm **thư viện DNN** (Python + Rust, tích hợp PyTorch) mô phỏng chính xác MAC đề xuất ở mức bit để **dò kích thước quire tối ưu** (Bảng 1, tr.2).

## Thiết lập (tr.2)
- ResNet-9, posit **n = 8, es = 1**; Deep Positron [03] đạt 92.42% với cấu hình này.
- Tổng hợp mạch TSMC **22 nm**, Synopsys Design Compiler R-2020.09.

## Kết quả (tr.3)
- Quire **15 bit** đạt **độ chính xác ngang** Deep Positron dùng quire **63 bit** → quire giảm **76.2%** (nhóm kiểm tra: 1 − 15/63 = 76.2% ✔), **diện tích MAC giảm 43%** dù thêm mạch so sánh mũ.
- Chấp nhận giảm **9.24 điểm %** độ chính xác → quire còn 12 bit, diện tích giảm **47%**.
- **Bảng 2 — độ trễ:**
| Mạch | Ours 10b | Ours 12b | Ours 15b | Ours 20b | Deep Positron 63b |
|---|---|---|---|---|---|
| Delay (ns) | 1.95 | 2.02 | 2.02 | 2.59 | 3.86 |
- Mạch bổ sung chỉ tăng theo log₂(kích thước quire).

## ⚠ Điểm cần hiểu đúng (nhóm nhận xét)
- "Quire nhỏ" này **không còn là phép cộng dồn chính xác tuyệt đối** như quire chuẩn — nó là một bộ cộng dồn dấu phẩy động có độ chính xác giới hạn. Ý nghĩa: **không phải mọi ứng dụng DNN đều cần quire đầy đủ**; có thể đánh đổi độ chính xác cộng dồn lấy diện tích.
- Chỉ đánh giá 1 mạng (ResNet-9) và 1 cấu hình posit; bài 4 trang.
- Kiểm tra chéo kích thước 63 bit: theo công thức (4) của [03], qsize = 2^(es+2)·(n−2) + 2 + ⌈log₂k⌉ = 8·6 + 2 + ⌈log₂k⌉ = 50 + ⌈log₂k⌉ → 63 bit ứng với k tối đa 2¹³ = 8192 phép cộng — hợp lý.

## Dùng cho
- Slide "Phương pháp tối ưu – phần cứng MAC/quire", "Điểm yếu: chi phí quire". Liên hệ Thí nghiệm C của nhóm (đo ảnh hưởng của cộng dồn chính xác vs làm tròn từng bước).
