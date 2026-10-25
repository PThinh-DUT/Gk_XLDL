# [11] PositNN: Training Deep Neural Networks with Mixed Low-Precision Posit

- **Tác giả:** Gonçalo Raposo, Pedro Tomás, Nuno Roma — INESC-ID, Instituto Superior Técnico, Universidade de Lisboa, Bồ Đào Nha
- **Nguồn:** **ICASSP 2021** (IEEE International Conference on Acoustics, Speech and Signal Processing), DOI 10.1109/ICASSP39728.2021.9413919; arXiv:2105.00053v3 (tr.1).
- Mã nguồn mở: github.com/hpc-ulisboa/posit-neuralnet (tr.1). Dùng thư viện **Universal** (stillwater-sc) cho phép toán posit & quire (tr.2).
- ⚠ **Trùng tên:** có một "PositNN Framework" khác của Langroudi et al. (IEEE SCC 2019, về *suy luận*) — xem tài liệu tham khảo [11] của chính bài này. Khi trình bày cần ghi rõ tác giả để tránh nhầm.

## Bài toán (tr.1)
- Đa số nghiên cứu chỉ dùng posit cho suy luận (dễ hơn vì suy luận ít nhạy với sai số). Huấn luyện là giai đoạn tốn tài nguyên nhất → đáng tối ưu hơn.
- Các bài trước: [05] (MLP đồ chơi), [06]/[07] (MLP, 16/32-bit), [08] (CNN nhưng vẫn cần FP32 cho epoch đầu và một số lớp), Deep PeNSieve (CNN CIFAR-10 nhưng chỉ 16/32-bit).

## Phương pháp
- Framework C++ viết lại từ đầu theo API của PyTorch (LibTorch), đa luồng; **posit "thật" mô phỏng ở mức bit** (không đi qua float trung gian) (tr.2).
- **Mixed precision theo giai đoạn** (Hình 3, tr.3): forward, backward, gradient, optimizer, loss có thể dùng các cấu hình posit khác nhau; có tùy chọn **dùng quire** khi cộng dồn.
- Hỗ trợ: Linear, Conv, Pooling, BatchNorm, Dropout, ReLU/Sigmoid/Tanh, Cross-Entropy/MSE, SGD (Hình 2).

## Bảng 1 (tr.2) — cấu hình khuyến nghị theo Posit Standard bản nháp 3.2 (2018)
| n bit | 8 | 16 | 32 | 64 |
|---|---|---|---|---|
| es | 0 | 1 | 2 | 3 |
| Dải động | 2^±6 | 2^±28 | 2^±120 | 2^±496 |
| Quire (bit) | 32 | 128 | 512 | 2048 |
| Giới hạn tích vô hướng | 127 | 32 767 | 2³¹−1 | 2⁶³−1 |
- (Quire = n²/2 bit ở bản nháp này. **Posit Standard 2022 đổi thành es = 2 cố định và quire = 16n bit** — xem phần tổng quan.)

## Kết quả — LeNet-5 trên Fashion-MNIST, 10 epoch
**Bảng 2 (tr.3) — không dùng quire:**
| Float | (16,1) | (12,1) | (10,1) | **(8,0)** |
|---|---|---|---|---|
| 90.42% | 90.87% | 90.15% | 88.15% | **10.00%** |
- Posit(8,0): "độ chính xác không cải thiện và **kẹt ở 10%** (tương đương đoán ngẫu nhiên 10 lớp), có lẽ do **dải động hẹp**" (tr.3).

**Bảng 3 (tr.4) — có quire:**
| Float | (10,1) | (8,0) | (8,1) | (8,2) |
|---|---|---|---|---|
| 90.42% | 88.40% | 13.84% | 12.86% | 19.39% |
- **Chỉ thêm quire là chưa đủ** cho 8-bit: tăng nhẹ, tốt nhất khi es = 2 (19.39%).

**Bảng 4 (tr.4) — quire + mixed precision** (OxLy = optimizer posit(x,2), loss posit(y,2), còn lại posit(8,2)):
| Float | O12L8 | O12L12 | **O12L10** | O10L10 |
|---|---|---|---|---|
| 90.42% | 88.40% | 90.07% | **90.25%** | 88.08% |
- Nguyên nhân thất bại của 8-bit thuần: **vanishing gradient** — gradient ngày càng nhỏ, trọng số cập nhật bằng posit thấp bit **không đủ độ phân giải cho số nhỏ** (tr.4). Giải pháp: optimizer & loss dùng bit cao hơn.
- Cấu hình O12L10 gọi là **posit(8,2)\***; phần loss + cập nhật trọng số chỉ chiếm **~15% số phép toán** (tr.4).

**Bảng 5 (tr.4) — xác nhận trên nhiều dataset:**
| Dataset | Mạng | Float | Posit(8,2)* | Chênh lệch |
|---|---|---|---|---|
| MNIST | LeNet-5 | 99.19% | 99.17% | −0.02 |
| Fashion-MNIST | LeNet-5 | 90.42% | 90.25% | −0.17 |
| CIFAR-10 | CifarNet | 70.29% | 68.65% | **−1.64** |
- Tác giả coi chênh lệch < 1% là do ngẫu nhiên của huấn luyện (tr.3).

## ⚠ Đối chiếu với sườn của bạn cùng nhóm
- Slide 11 sườn ghi "Posit 8-bit thuần → ~10%" và gọi là "kết quả chạy thử nghiệm thực tế" → **thực chất là Bảng 2 của [11]** (posit(8,0), không quire). Phải ghi nguồn.
- Sườn ghi "dùng Mixed-Precision **hoặc** Quire → chênh < 1% so với FP32" → **chưa chính xác**:
  - Chỉ quire: vẫn **≤ 19.39%** (Bảng 3).
  - Phải **kết hợp** quire + mixed precision (optimizer 12-bit, loss 10-bit).
  - Trên CIFAR-10 vẫn mất **1.64 điểm** (> 1%).

## Hạn chế (nhóm nhận xét)
- Mạng nhỏ (LeNet-5, CifarNet), 10 epoch; chỉ 1 lần chạy (không có độ lệch chuẩn).
- Mô phỏng phần mềm trên CPU → rất chậm; chưa có phần cứng.

## Dùng cho
- Slide "Tổng quan – huấn luyện", "Điểm yếu: dải động posit 8-bit", "Kết quả thực nghiệm". Thí nghiệm D của nhóm tái hiện xu hướng này (posit8 thuần thất bại; mixed precision thành công).
