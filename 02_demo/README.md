# 02_demo — Thực nghiệm mô phỏng posit trên LeNet-5 / Fashion-MNIST

Yêu cầu: Python ≥ 3.11, `torch`, `numpy`, `matplotlib`; tùy chọn `softposit` (chỉ để kiểm chứng ở bước 0).
Dữ liệu Fashion-MNIST gốc (4 file `.gz`, MD5 đã kiểm tra) nằm trong `data/`.

| Bước | Script | Việc làm | Kết quả |
|---|---|---|---|
| 0 | `01_validate_formats.py` | So bộ mô phỏng posit/FP8 với SoftPosit & PyTorch (toàn bộ mẫu bit, mọi điểm hòa) | `results/00_validation.json` |
| 1 | `02_train_baselines.py` | Huấn luyện 3 LeNet-5 FP32 (seed 0, 1, 2) | `results/checkpoints/`, `01_baselines.json` |
| A | `03_expA_tapered_precision.py` | Độ chính xác thập phân theo độ lớn vs phân bố trọng số/activation | `figures/A_tapered_precision.png` |
| B | `04_expB_weight_ptq.py` | Lượng tử hóa trọng số 4–16 bit (posit/FP/INT, có/không co giãn) | `results/04_expB_weight_ptq.json` |
| C | `05_expC_quire.py` | Trọng số + activation 8-bit: quire vs FMA vs nhân/cộng riêng | `results/05_expC_quire.json` |
| D | `06_expD_lowprec_training.py 0` | Huấn luyện bằng FP16/posit16/posit8/posit8 hỗn hợp | `results/06_expD_training.json` |
| E | `07_expE_fast_sigmoid.py` | Sigmoid/tanh nhanh bằng thao tác bit (es = 0) | `figures/E_fast_sigmoid.png` |
| — | `08_make_figures.py` | Vẽ hình B, C, D | `figures/` |
| — | `09_export_decode_examples.py` | Bảng ví dụ giải mã posit cho báo cáo | `results/09_decode_examples.json` |

Thư viện dùng chung trong `posit_lab/`: `numformats.py` (posit, minifloat, INT), `quant.py` (co giãn theo lớp),
`model.py` (LeNet-5), `data.py` (đọc IDX), `plotstyle.py` (bảng màu đồ thị).
Mọi log chạy nằm trong `results/log_*.txt`.

## Notebook tương tác

Mở [00_BAT_DAU.ipynb](00_BAT_DAU.ipynb) để đọc bảng và hình ngay trong VS Code. Đã có notebook cho toàn bộ 11 script và 6 module thư viện. Xem [hướng dẫn chạy và lưu kết quả](HUONG_DAN_NOTEBOOK.md). Mặc định đọc kết quả đã lưu; bật `RUN_EXPERIMENT` để chạy lại.

## Phạm vi kết luận thực nghiệm

- A–E kiểm tra các đặc tính và xu hướng trên mô phỏng; không tái lập toàn bộ thuật toán của 21 bài báo.
- D dùng fake quantization: conv/linear và cross-entropy tính FP32; W/A/G, gradient logits, trọng số chính và momentum được làm tròn theo cấu hình. Chưa tương đương thư viện posit/quire ở mức phép toán.
- D có 6 cấu hình, 10 epoch, chỉ seed 0. FP32 90.66%; FP16 90.58%; posit(16,1) 90.56%; posit(8,0) 10.00%; posit(8,2) 82.40%; O12L10 90.07%. Chưa đủ để kết luận chênh lệch nhỏ có ý nghĩa thống kê.
- C xấp xỉ quire bằng float64; không phải quire số nguyên chính xác, chưa đo giới hạn dung lượng phần cứng. Phần lớn cấu hình có 3 seed; chế độ sep chỉ seed 0 cho hai định dạng được chọn.
- Chưa chạy PLAM, CIFAR-10, ResNet, ViT hoặc RTL/FPGA trong A–E. Các số liệu tương ứng trong khảo sát là của bài báo.
- time_s là thời gian mô phỏng; không dùng để kết luận tốc độ, năng lượng hoặc diện tích phần cứng posit.
- Bước 0 đối chiếu SoftPosit cho (8,0), (16,1), (8,2), (16,2) và FP8 với PyTorch; 0 sai khác trên bộ thử không bảo đảm mọi cấu hình và mọi phép toán đều đúng.
