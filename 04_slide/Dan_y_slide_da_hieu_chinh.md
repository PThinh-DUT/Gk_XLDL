# Nghiên cứu và đánh giá hệ thống số Posit cho mô hình AI hiệu năng cao

Bản nội dung đã hiệu chỉnh để thiết kế slide. Mã [NN] trỏ tới PDF và ghi chú trong project. Các kết quả của bài báo phải gắn nhãn “Bài báo”; kết quả trong `02_demo/results` gắn nhãn “Nhóm thực nghiệm”. Không dùng bản PDF/Word cũ làm nội dung chốt trước khi đồng bộ bản xuất.

## Slide 1 — Đề tài

- Nghiên cứu và đánh giá hệ thống số Posit cho mô hình AI hiệu năng cao.
- Nhóm thực hiện, giảng viên, môn học: điền thông tin thực tế.
- Phạm vi: khảo sát tài liệu và kiểm chứng bằng mô phỏng phần mềm.

## Slide 2 — Bài toán giảm số bit trong AI

- Giảm số bit có thể giảm dung lượng biểu diễn và lượng dữ liệu di chuyển.
- Đổi lại, lượng tử hóa có thể làm giảm độ chính xác suy luận và khả năng hội tụ.
- IEEE 754 có các giá trị đặc biệt và độ chính xác tương đối gần đồng đều trong miền số chuẩn; độ chính xác tuyệt đối thay đổi theo độ lớn. Miền subnormal có đặc tính khác.
- Câu hỏi: posit có đem lại lợi ích so với FP/INT cùng số bit và cùng điều kiện hiệu chỉnh?

Nguồn: [03], [06], [07]. Không coi NaN/Inf hay số không có dấu là vô ích trong mọi ứng dụng.

## Slide 3 — Mục tiêu và phạm vi

- Tổng hợp 21 tài liệu về biểu diễn, suy luận, huấn luyện và phần cứng posit.
- Phân tích phương pháp, điểm mạnh, điểm yếu và điều kiện so sánh.
- Tự chạy 5 nhóm thí nghiệm A–E trên bộ mô phỏng và LeNet-5/Fashion-MNIST.
- Chưa tự đo năng lượng, diện tích hay tốc độ phần cứng posit.

## Slide 4 — Nguồn gốc và phát triển

- Posit được Gustafson và Yonemoto giới thiệu năm 2017, liên quan tới hướng nghiên cứu unum.
- Các nghiên cứu tiếp theo khảo sát FPGA, huấn luyện, RISC-V và định dạng thích ứng.
- Phân biệt cấu hình nghiên cứu ⟨n,es⟩ với Posit Standard 2022.
- Tài liệu trong project dẫn chuẩn 2022 với es=2 và quire 16n bit; cần bổ sung bản chuẩn gốc để đối chiếu trực tiếp.

Nguồn: [03], [05], [18], [21], [44]. Không khẳng định tháng ban hành cụ thể, triển khai của tập đoàn hoặc khả năng thay thế trực tiếp toàn bộ IEEE 754 khi chưa có nguồn.

## Slide 5 — Cấu trúc và giá trị posit

- Sign | Regime | Exponent | Fraction; regime có độ dài thay đổi.
- Với posit dương hữu hạn khác 0: x = useed^k × 2^e × (1+f), useed = 2^(2^es).
- Ví dụ posit⟨8,1⟩: 0|10|1|0101 → k=0, e=1, f=5/16 → x=2.625.
- Số âm: lấy bù hai mẫu bit để giải mã độ lớn, sau đó đổi dấu; không đọc trực tiếp các trường sau bit dấu như số dương.
- Có 0 và NaR; không có Inf hoặc hai mã ±0 như IEEE 754.

Nguồn: [03], [06]; `results/09_decode_examples.json`.

## Slide 6 — Tapered precision và scaling

- Độ phân giải tương đối cao quanh |x|≈1, giảm khi ra xa vùng này.
- Nhóm đo trung vị |W|≈0.0402; khoảng 20.25% trọng số dưới minpos của posit(8,0).
- Phân bố trọng số không tự động khớp vùng chính xác cao của posit.
- Scaling theo lớp có thể cải thiện; hiệu quả phải so với FP/INT cũng được hiệu chỉnh.

Hình: `A_tapered_precision.png`. Nguồn: thí nghiệm A; [08].

## Slide 7 — Quire và giới hạn biểu diễn

- Quire là bộ cộng dồn rộng, giữ tích và tổng chính xác trong giới hạn dung lượng thiết kế.
- Làm tròn khi chuyển kết quả cuối về posit; kết quả xuất vẫn có sai số lượng tử hóa.
- FMA làm tròn sau mỗi bước tích lũy; nhân/cộng riêng có thêm lần làm tròn tích.
- Ngoài dải hữu hạn: bão hòa maxpos/minpos vẫn làm mất thông tin; không đồng nghĩa không có vấn đề về dải động.

Nguồn: [03], [11], [43]. Phân biệt kích thước quire trong chuẩn nháp cũ, chuẩn 2022 và thiết kế từng bài.

## Slide 8 — Nghiên cứu về suy luận

- Deep Positron [03]: EMAC trên FPGA, MLP và dữ liệu bảng nhỏ; posit thường tốt hơn float/fixed cùng bit trong thiết lập đã thử.
- Cheetah [07]: scaling ảnh hưởng mạnh tới chất lượng ở độ rộng thấp.
- Johnson [43]: es và bộ cộng dồn quyết định kết quả trên ResNet-50/ImageNet.
- Desrentes [18]: lưu Posit8, giải nén sang FP16 để tận dụng phần cứng sẵn có.

Nhận xét: không khái quát kết quả MLP thành kết luận cho mọi CNN; ghi rõ mô hình, dataset và kiểu cộng dồn.

## Slide 9 — Nghiên cứu về huấn luyện

- Lu [08]: warm-up FP32, scaling từng lớp, es khác nhau cho trọng số và gradient.
- PositNN của Raposo [11]: huấn luyện bằng posit và tùy chọn quire; mixed precision cho optimizer/loss.
- Bài PositNN: Fashion-MNIST FP32 90.42%, cấu hình O12L10 90.25%; CIFAR-10 giảm 1.64 điểm phần trăm.
- Chỉ quire chưa đủ: cấu hình 8-bit tốt nhất trong Bảng 3 của [11] đạt 19.39%.

Tất cả số trên slide này là kết quả bài báo, không phải nhóm tự chạy.

## Slide 10 — Đánh giá điểm mạnh và điểm yếu

| Tiêu chí | Điểm mạnh có điều kiện | Giới hạn |
|---|---|---|
| Accuracy | Có thể giữ chất lượng với ít bit trong một số thiết lập | Phụ thuộc es, scaling, mô hình và accumulator |
| Dải động/độ phân giải | Điều chỉnh đánh đổi bằng es và tapered precision | Không đồng thời hơn FP16/BF16 trên mọi tiêu chí |
| Bộ nhớ | Giảm bit lưu trữ so với FP32 | Fake quantization của nhóm vẫn lưu tensor float, chưa đo giảm RAM |
| Phần cứng | Một số thiết kế chuyên dụng có lợi | Giải mã regime, quire, chuyển đổi có chi phí |
| Mở rộng | Đã có nghiên cứu CNN và các biến thể mới | Thực nghiệm nhóm mới ở LeNet-5/Fashion-MNIST |

Nguồn: [03], [05], [08], [11], [18], [44]. Luôn ghi điều kiện và đối tượng so sánh.

## Slide 11 — PLAM

- PLAM: Posit Logarithm-Approximate Multiplier; dùng xấp xỉ Mitchell log₂(1+f)≈f.
- Thay nhân phần định trị bằng cộng và xử lý các trường số.
- Bài báo: bộ nhân 32-bit giảm 72.86% diện tích, 81.79% công suất so với bộ nhân posit chính xác được chọn.
- Sai số tương đối tối đa của xấp xỉ được phân tích là 11.1%; kiểm thử AI trong bài dùng posit16.
- Nhóm chưa cài đặt/chạy PLAM; đây là kết quả khảo sát, không phải số đo của nhóm.

Nguồn: [36], tr.4–6. Không suy ra mức giảm năng lượng của toàn mạng hoặc kết quả tương tự ở 8-bit.

## Slide 12 — Sigmoid và tanh bằng thao tác bit

- Với es=0, có thể xấp xỉ sigmoid bằng (X XOR 2^(n−1)) >> 2, với X là mã bit posit đầu vào.
- Đây là xấp xỉ có sai số, không thay thế chính xác hàm sigmoid/tanh.
- Nhóm đo sigmoid posit(8,0): sai số tuyệt đối lớn nhất khoảng 0.0607.
- Tanh posit(16,0) trên miền thử: sai số max 0.0980, sau hiệu chỉnh 0.0379.
- Chưa đo speedup hoặc năng lượng; chưa đánh giá tác động thay hàm kích hoạt lên accuracy toàn mạng.

Hình: `E_fast_sigmoid.png`. Nguồn: thí nghiệm E; [05], [21], [40].

## Slide 13 — Thiết lập thực nghiệm của nhóm

- Python/PyTorch, bộ mô phỏng posit và lượng tử hóa của nhóm; SoftPosit dùng kiểm chứng định dạng.
- LeNet-5 bản ReLU/MaxPool: 61 706 tham số; Fashion-MNIST 60 000 train / 10 000 test.
- Baseline: 3 seed, 15 epoch; thí nghiệm D: 10 epoch, seed 0.
- Fake quantization: tensor vẫn lưu float; MAC của D và cross-entropy tính FP32.
- C dùng float64 để xấp xỉ bộ cộng dồn rộng; chưa tương đương quire số nguyên chính xác.

Nguồn: `02_train_baselines.py`, `05_expC_quire.py`, `06_expD_lowprec_training.py`.

## Slide 14 — Kiểm chứng định dạng và lượng tử hóa trọng số

- Bộ kiểm chứng đã chạy: không sai khác với SoftPosit ở các cấu hình (8,0), (16,1), (8,2), (16,2).
- FP8 E4M3/E5M2: không sai khác trên 50 000 mẫu thử mỗi định dạng so với PyTorch.
- B so sánh lượng tử hóa trọng số 4–16 bit và các chế độ scaling.
- Trình bày cả trước và sau hiệu chỉnh, lấy trực tiếp số từ JSON; không suy luận độ đúng của toàn bộ training từ kiểm thử định dạng.

Hình: `B_bit_sweep.png`, `B_weight_error_8bit.png`. Nguồn: `00_validation.json`, `04_expB_weight_ptq.json`.

## Slide 15 — Vai trò của cộng dồn rộng

- C1: 15 trường hợp format/độ dài tích vô hướng; so sánh quire xấp xỉ, FMA, nhân/cộng riêng.
- C2: 35 kết quả cấu hình/seed trên mạng; phần lớn cấu hình chạy 3 seed.
- Chế độ nhân/cộng riêng chỉ seed 0 cho FP8 E4M3 và posit(8,1); không trình bày như trung bình 3 seed.
- Dùng biểu đồ để đánh giá sai số và accuracy; không lấy thời gian mô phỏng làm latency phần cứng.

Hình: `C1_dot_product.png`, `C2_network_quire.png`. Nguồn: `05_expC_quire.json`.

## Slide 16 — Huấn luyện và mixed precision

| Cấu hình | Accuracy cuối (%) |
|---|---:|
| FP32 | 90.66 |
| FP16 | 90.58 |
| Posit(16,1) | 90.56 |
| Posit(8,0) | 10.00 |
| Posit(8,2) | 82.40 |
| Posit(8,2), O12L10 | 90.07 |

- Nhóm thực nghiệm: LeNet-5/Fashion-MNIST, 10 epoch, seed 0; không warm-up/loss scaling/scaling theo lớp.
- O12L10: W/A/G 8-bit, gradient logits 10-bit, master weights/momentum 12-bit.
- Mixed precision giảm khoảng cách so với FP32 trong lần chạy này: 0.59 điểm phần trăm.
- Chỉ kiểm chứng xu hướng; không tái lập chính xác PositNN, không chứng minh kết quả là cận trên và chưa có ý nghĩa thống kê từ nhiều seed.

Hình: `D_training_curves.png`. Nguồn: `06_expD_training.json`.

## Slide 17 — Kết luận và giới hạn

- Đã khảo sát tài liệu, phân tích đánh đổi và chạy 5 nhóm kiểm chứng phần mềm.
- Scaling, es và bộ cộng dồn ảnh hưởng mạnh tới hiệu quả của posit thấp bit.
- Kết quả nhóm ủng hộ việc dùng mixed precision trong thiết lập đã thử.
- Chưa có bằng chứng tự đo về giảm năng lượng/diện tích/tốc độ; chưa chạy PLAM, CIFAR-10, ResNet hoặc ViT.
- Posit là hướng đáng nghiên cứu; chưa có cơ sở kết luận thay thế mọi định dạng trong AI.

## Slide 18 — Hướng tiếp theo và tài liệu tham khảo

- Ưu tiên: thêm seed 1,2 cho D; tổng hợp mean ± SD và lưu thông tin môi trường thực thi.
- Cài đặt PLAM, so sai số phép nhân và accuracy với phép nhân posit chính xác cùng số bit.
- Sau đó mở rộng ResNet-18/CIFAR-10; ViT và RTL/RISC-V là hướng xa hơn tùy nguồn lực.
- Nguồn chính: [03] Deep Positron; [07] Cheetah; [08] Lu; [11] Raposo PositNN; [18] Posit8 Decompression; [36] PLAM; [43] Johnson; [44] POSAR.
- Tra thông tin thư mục đầy đủ trong `01_ghi_chu_bai_bao/00_MUC_LUC_va_MA_TRAN_BANG_CHUNG.md` và ghi chú từng bài.
