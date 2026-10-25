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
