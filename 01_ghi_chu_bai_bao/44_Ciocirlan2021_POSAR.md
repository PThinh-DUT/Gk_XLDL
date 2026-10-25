# [44] The Accuracy and Efficiency of Posit Arithmetic

- **Tác giả:** Stefan Dan Ciocirlan, Dumitrel Loghin, Lavanya Ramapantulu, Nicolae Țăpuș, Yong Meng Teo — National University of Singapore & University Politehnica of Bucharest (Romania) (tr.1)
- **Nguồn:** arXiv:2109.08225v1, 16/09/2021 (tr.1). (Chưa xác nhận được nơi đăng chính thức — trích theo bản arXiv.) Mã nguồn mở: github.com/dloghin/posar.
- ⭐ **Bài đánh giá khách quan nhất trong bộ tài liệu**: tác giả tự kết luận lợi ích của posit "**not spectacular**" (không ngoạn mục).

## Bài toán (tr.1)
- Hai câu hỏi: (i) posit có hiệu quả hơn IEEE 754 cho suy luận ML ở biên không? (ii) đánh đổi độ chính xác – thời gian/năng lượng khi giảm số bit posit?
- Đánh giá trên **phần cứng thật (FPGA)**, không chỉ mô phỏng phần mềm.

## Phương pháp (tr.2–7)
- **POSAR** (Posit Arithmetic Unit) viết bằng **Chisel**, **thay thế FPU** trong lõi RISC-V **Rocket Chip**; hỗ trợ toàn bộ lệnh mở rộng F của RISC-V (không đổi tập lệnh). Chạy trên **FPGA Arty A7-100T** (SiFive Freedom E310).
- 3 cấu hình: **Posit(8,1)**, **Posit(16,2)**, **Posit(32,3)** (lưu ý es khác Posit Standard 2022).
- **Không cài quire** vì theo tài liệu, quire tốn **~10× diện tích, ~8× độ trễ**; bộ đồng xử lý unum SMURF tốn 9× diện tích, 12× năng lượng so với FPU 64-bit (tr.3).
- Không có trình biên dịch hỗ trợ posit → phải nạp hằng số posit dạng bit vào biến (Listing 1).
- ⚠ Phát hiện: nếu **chuyển đổi FP32 ↔ posit lúc chạy** (bộ nhớ giữ FP32, lõi tính posit) thì tính số e **chỉ đúng 1 chữ số** (2.7), so với 6 chữ số khi dùng posit xuyên suốt (Hình 3, tr.7).

## Kết quả
**Bảng III (tr.10) — số chữ số thập phân đúng:**
| Bài toán | FP32 | Posit(8,1) | Posit(16,2) | Posit(32,3) |
|---|---|---|---|---|
| π (Leibniz, 2 triệu vòng) | 5 | 0 (3.5) | 2 | 5 |
| π (Nilakantha, 200 vòng) | 6 | 1 | 3 | 6 |
| e (Euler, 20 vòng) | 6 | 0 (2.625) | 3 | 6 |
| sin(1) | 7 | 0 | 3 | **8** |

**Bảng IV — tốc độ (so với FP32):** π Leibniz **1.30×**, Nilakantha 1.09×, e 1.03×, sin(1) 1.02× — do **nhân/chia posit nhanh hơn** (xử lý ngoại lệ đơn giản) (tr.9).

**Nhân ML cổ điển (Bảng V, tr.10)** trên Iris: Posit(32,3) và (16,2) cho kết quả đúng (nhanh hơn tối đa ~6%), **Posit(8,1) cho kết quả SAI ở mọi nhân trừ Classification Tree**; hồi quy tuyến tính sai cả với Posit(16,2).

**NPB BT (tính toán khoa học):** Posit(32,3) đạt ngưỡng ε = 10⁻⁴ còn FP32 cần ε = 10⁻³ → **chính xác hơn 1 bậc** (tr.9).

**CNN CIFAR-10** (4 lớp cuối của CNN Caffe 14 lớp; bộ nhớ FPGA chỉ 512 kB) (tr.9):
| FP32 | Posit(32,3) | Posit(16,2) | Posit(8,1) | Lưu P8 + tính P16 |
|---|---|---|---|---|
| 68.15% | 68.15% | 68.15% | 62.68% | **68.47%** |
- Cả 3 posit **nhanh hơn ~18%**. Posit(8,1) mất 5.47 điểm do giá trị ngoài dải (vd. trọng số nhỏ nhất của lớp ip1 = 1.119×10⁻⁶ < minpos) và tràn ở phép mũ (softmax). Giải pháp lai: **lưu 8-bit, tính 16-bit** → không mất độ chính xác.

**Bảng VII (tr.11) — tài nguyên FPGA toàn hệ thống:**
| | FP32 | Posit(8,1) | Posit(16,2) | Posit(32,3) |
|---|---|---|---|---|
| LUT | 29 335 | 19 367 (−34%) | 25 598 (−13%) | **38 155 (+30%)** |
| FF | 14 756 | 11 596 (−21%) | 12 031 (−19%) | 12 951 (−12%) |
| DSP | 15 | 5 (−67%) | 8 (−47%) | **19 (+27%)** |
- **Cùng 32 bit, posit tốn hơn float 30% LUT, 27% DSP.**
- Công suất (π): FPU 1.39 W; P8 1.38; P16 1.40; **P32 1.48 W (+6%)** nhưng nhanh hơn 30% → năng lượng tổng tốt hơn (tr.11).
- Phân tích dải động (Bảng VI) **không dự đoán được** cấu hình nào cho kết quả đúng → phải chạy thử từng kích thước (tr.10).

## ⚠ Lỗi số liệu phát hiện trong bài
- Bài ghi "giá trị lớn nhất Posit(8,1) là **192**" (tr.9) và minpos/maxpos của (8,1), (16,2), (32,3) là 2⁻¹⁰/2⁹, 2⁻⁴⁸/2⁴⁷, 2⁻²¹⁶/2²¹⁵ (tr.10). Theo định nghĩa chuẩn maxpos = useed^(n−2): posit(8,1) = 4⁶ = **4096 = 2¹²**, minpos = **2⁻¹²**; posit(16,2) = 2^±56; posit(32,3) = 2^±240.
  - Chính bài cũng viết "dải của Posit(8,1) dừng ở 2.44×10⁻⁴ (0x1)" = 2⁻¹² → **tự mâu thuẫn**.
  - Nhóm đã kiểm chứng bằng bộ mô phỏng của mình (khớp 100% SoftPosit với es = 0, 1, 2): posit⟨8,1⟩ maxpos = 4096, minpos = 2⁻¹² ≈ 2.44×10⁻⁴.
- Xác nhận đúng: hai posit(8,1) gần e nhất là **2.625 (0x55)** và **2.75 (0x56)** (nhóm tự giải mã lại: khớp).

## Ý quan trọng để hiểu
- **Phản biện mạnh nhất cho slide "Điểm yếu"**: posit 32-bit chỉ thắng nhẹ, tốn phần cứng hơn; posit 8-bit **không thay được FP32** cho tính toán khoa học/ML cổ điển; **16-bit là điểm cân bằng**.
- Mâu thuẫn với Deep Positron [03] được tác giả tự giải thích: [03] dùng dữ liệu y tế chiều thấp; [44] dùng Iris/CIFAR-10 với các nhân khác (tr.3).
- Đây chính là thiết kế **POSAR** mà sườn của bạn cùng nhóm nhắc ở Slide 3 → nguồn là [44].

## Dùng cho
- Slide "Điểm yếu & khoảng trống", "Bảng tổng hợp đánh giá", "Lịch sử – tích hợp RISC-V". Báo cáo mục 5.
