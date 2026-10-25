# Mục lục ghi chú & Ma trận bằng chứng

**Quy ước trích dẫn:** `[NN]` = số đầu tên file trong `papers_download/` (ví dụ [36] = `36_PLAM_...pdf`). "tr.X" = **trang của file PDF** (không phải số trang in trên tạp chí). Nguồn ngoài thư mục ký hiệu `[S1]`, `[S2]`…

## 1. Danh sách 21 bài (theo nhóm chủ đề)

| Mã | Năm | Nhóm tác giả | Nơi công bố | Chủ đề | Ghi chú |
|---|---|---|---|---|---|
| [01] | 2018 | Langroudi – RIT | EMC² workshop | Suy luận: posit vs fixed (chỉ lưu trọng số) | `01_...md` |
| [43] | 2018 | Johnson – Facebook AI | arXiv | Log float + quire (EMA) + tapered; ResNet-50 ImageNet | `43_...md` |
| [42] | 2018 | Wan – Harvard | ⚠ báo cáo môn học | Posit trong nhận dạng tiếng nói (RNN) | `42_...md` |
| [03] | 2019 | Carmichael, Gustafson – RIT/NUS | DATE | Deep Positron: EMAC trên FPGA, MLP | `03_...md` |
| [04] | 2019 | Carmichael, Gustafson – RIT/NUS | CoNGA | Đánh đổi hiệu năng–hiệu quả 5–8 bit | `04_...md` |
| [05] | 2019 | Murillo – UCM | arXiv | Bộ nhân posit (FloPoCo), es=0, sigmoid nhanh, huấn luyện đầu tiên | `05_...md` |
| [06] | 2019 | Langroudi – RIT | arXiv | Huấn luyện 16-bit posit vs float | `06_...md` |
| [07] | 2019 | Langroudi – RIT | arXiv | Cheetah: framework, linear quantization | `07_...md` |
| [08] | 2019 | Lu – Nanjing Univ. | arXiv (SOCC) | Huấn luyện ResNet-18 ImageNet bằng posit: warm-up + layer-wise scaling | `08_...md` |
| [33] | 2020 | Langroudi, Gustafson | CVPRW | Adaptive Posit (rs, Kb) | `33_...md` |
| [11] | 2021 | Raposo – INESC-ID Lisboa | ICASSP | PositNN: mixed precision, posit(8,2)* | `11_...md` |
| [12] | 2021 | Langroudi, Gustafson | CVPR Workshops | ALPS: generalized posit, SQNR | `12_...md` |
| [21] | 2021 | Cococcioni – Pisa | Neural Comput. Appl. | Vector hóa posit trên RISC-V vs ARM SVE | `21_...md` |
| [36] | 2021 | Murillo – UCM | IEEE TETC | PLAM: nhân xấp xỉ logarit | `36_...md` |
| [40] | 2021 | Ho, Gustafson – NUS | DATE | Huấn luyện GAN bằng posit 8-bit | `40_...md` |
| [44] | 2021 | Ciocirlan – NUS/Bucharest | arXiv | POSAR: thay FPU trong RISC-V Rocket, đánh giá phản biện | `44_...md` |
| [46] | 2021 | Alouani – CNRS/RWTH | VLSID | Độ bền của posit với lỗi lật bit | `46_...md` |
| [18] | 2022 | Desrentes – Kalray | CoNGA | Giải nén Posit8 → FP16 | `18_...md` |
| [27] | 2022 | Nakahara – Kumamoto | IPSJ TSLDM | MAC với quire nhỏ | `27_...md` |
| [35] | 2024 | Ramachandran, Gustafson – Georgia Tech | DAC | Logarithmic Posit + LPQ + LPA | `35_...md` |
| [48] | 2026 | Kumar – IIT Indore | ⚠ preprint | SPADE: MAC SIMD posit 8/16/32 | `48_...md` |

Nguồn ngoài thư mục (nên tải thêm để đối chiếu):
- **[S1]** J. L. Gustafson, I. T. Yonemoto, "Beating Floating Point at its Own Game: Posit Arithmetic," *Supercomputing Frontiers and Innovations*, vol. 4, no. 2, pp. 71–86, 2017. (bài gốc về posit; được trích trong [03], [11], [40]…)
- **[S2]** Posit Working Group, *Standard for Posit™ Arithmetic (2022)*. (es = 2 cố định, quire 16n bit — xem [18] tr.2 xác nhận "es=2 is now the standard for Posit8")

## 2. Ma trận bằng chứng — các khẳng định chính dùng trên slide

| # | Khẳng định | Nguồn (trang PDF) | Độ tin cậy |
|---|---|---|---|
| 1 | Float32 có dải động > 80 bậc độ lớn, thừa cho DNN → information-per-bit thấp | [03] tr.2; [04] tr.2 | Cao |
| 2 | FP16 có nhiều mẫu NaN, hai số 0, gradual underflow | [03] tr.2; [05] tr.2; [21] tr.2 | Cao |
| 3 | Float32 có ~16.7 triệu mẫu bit NaN (2×(2²³−1)) | [21] tr.2 ("millions") + nhóm tự tính | Cao |
| 4 | Float 8-bit (4,3) kiểu IEEE lãng phí ~6% mã cho NaN | [43] tr.2 | Cao |
| 5 | Ở 45 nm: float32 vs float16 — phép cộng tốn 2×, phép nhân ~4× năng lượng; truy cập bộ nhớ 1 MB ~10× so với 8 kB | [06] tr.1; [07] tr.1 | Cao (trích Horowitz) |
| 6 | Ở 28 nm: đọc SRAM 16-bit tốn 80× một MAC; DRAM ~2.6 bậc độ lớn | [33] tr.2 | Cao |
| 7 | Công thức posit x = (−1)ˢ·useedᵏ·2ᵉ·(1+f), useed = 2^(2^es); k = −m hoặc m−1 | [06] tr.1; [03] tr.2; [11] tr.2 | Cao (đã kiểm chứng bằng code) |
| 8 | maxpos = useed^(n−2), minpos = useed^(−(n−2)) | [03] tr.4; [08] tr.2 | Cao (kiểm chứng) |
| 9 | Dải động posit8 es=0/1/2: 3.61 / 7.22 / 14.45 thập phân | [18] tr.4 Bảng 2 | Cao (nhóm tính lại khớp) |
| 10 | Độ chính xác tối đa 8-bit: posit 6 bit vs float 5 bit; vùng posit ≥ float: 1/4…4 | [42] tr.5 Bảng 2 (theo Gustafson) | Trung bình (báo cáo môn học) |
| 11 | Quire = bộ cộng dồn Kulisch, chỉ làm tròn 1 lần; FMA làm tròn mỗi bước, có hiện tượng c+ab=c | [43] tr.3; [03] tr.3 | Cao (Thí nghiệm C) |
| 12 | Kích thước quire (EMAC): 2^(es+2)·(n−2) + 2 + ⌈log₂k⌉ | [03] tr.4 công thức (4) | Cao |
| 13 | Quire theo chuẩn cũ n²/2 bit (8-bit: 32 bit) | [11] tr.2 Bảng 1 | Cao |
| 14 | Quire tốn ~10× diện tích, ~8× độ trễ → POSAR không cài quire | [44] tr.3 | Trung bình (trích lại) |
| 15 | Posit 8-bit ≥ float/fixed 8-bit trên dữ liệu bảng & MNIST/Fashion (MLP) | [03] tr.5; [04] tr.6 | Cao (nhưng mạng nhỏ) |
| 16 | Lợi thế posit rõ nhất ở ≤ 6 bit: CIFAR-10 5-bit posit 41.33% vs float 12.83% vs fixed 9.71% | [07] tr.7 Bảng III | Cao |
| 17 | Co giãn tuyến tính cứu posit es=0: MNIST 5-bit 91.05% → 98.28% | [07] tr.8 Bảng IV | Cao |
| 18 | ResNet-50 ImageNet: posit(8,1)+EMA chỉ −0.87% Top-1; posit(8,0) sụp (−76.03%) | [43] tr.5 Bảng 2 | Cao |
| 19 | Posit8 es=0 làm sụp VGG16 (10.2%), ResNet50 (0%); es=1/2 giữ gần nguyên | [18] tr.5 Bảng 3 | Cao |
| 20 | Huấn luyện posit-16 hơn float-16 ~6 điểm (MNIST 96.5 vs 90.6; Fashion 87.4 vs 81.7) | [06] tr.2; [07] tr.8 | Cao (float16 không loss scaling) |
| 21 | Huấn luyện ImageNet ResNet-18 bằng posit 16-bit không mất độ chính xác (71.09 vs 71.02) | [08] tr.4 Bảng III | Cao |
| 22 | Warm-up FP32 + layer-wise scaling S_f = 2^(center+σ) + es=2 cho gradient | [08] tr.3–4 | Cao |
| 23 | Posit(8,0) huấn luyện kẹt ở 10%; quire chỉ nâng lên ≤ 19.39%; cần mixed precision O12L10 → 90.25% | [11] tr.3–4 Bảng 2–4 | Cao (Thí nghiệm D) |
| 24 | Posit(8,2)* trên CIFAR-10 vẫn mất 1.64 điểm | [11] tr.4 Bảng 5 | Cao |
| 25 | PLAM: giảm diện tích 72.86%, công suất 81.79%, trễ 17.01% (32-bit, so với bộ nhân posit chính xác), sai số max 11.1% | [36] tr.1, tr.4–5 | Cao |
| 26 | Huấn luyện CifarNet bằng mô phỏng posit mất ~10 ngày | [36] tr.4 | Cao |
| 27 | Sigmoid nhanh: (X ⊕ 2^(n−1)) >> 2 với es = 0 | [05] tr.7; [21] tr.3; [40] tr.4 | Cao (Thí nghiệm E) |
| 28 | Vector hóa trên RISC-V: hàm kích hoạt nhanh ≥ 10×, matrix > 100× so với bản không vector hóa; ngang ARM SVE | [21] tr.6–8 | Trung bình (trên trình mô phỏng) |
| 29 | Quire 15 bit thay 63 bit: diện tích MAC −43% | [27] tr.3 | Trung bình (1 mạng) |
| 30 | Generalized posit (ALPS) hơn posit 14%, scaled float 6% (TB); 5-bit ResNet-50 CIFAR-10 +41.63 điểm | [12] tr.6–7 | Cao |
| 31 | Adaptive Posit 5-bit ResNet-50 CIFAR-10: 51.49% vs posit 15.18%; ImageNet không cải thiện | [33] tr.7 | Cao |
| 32 | LP (DAC 2024): CNN giảm < 1%; ViT-B −4.39; ~2× TOPS/mm² so với ANT/BitFusion | [35] tr.5–6 | Cao (ViT không < 1%) |
| 33 | GAN: P8+ ngang FP16, FP8 thất bại (FID 423 vs 70 trên CGAN) | [40] tr.5 Bảng I | Cao |
| 34 | Posit 8-bit nhận dạng tiếng nói: WER +0.3 (Model 1), 0 (Model 2); fixed 8-bit +3.5 | [42] tr.4 | Trung bình |
| 35 | POSAR: posit32 nhanh hơn 30% (π) nhưng +30% LUT, +27% DSP, +6% công suất; posit8 sai ở nhân ML cổ điển; posit16 tốt nhất | [44] tr.9–11 | Cao (phần cứng thật) |
| 36 | Posit bền hơn float với lỗi lật bit trong > 95% trường hợp; ML: giảm 0–30% vs 10–67% | [46] tr.4, tr.6 | Cao (32-bit) |
| 37 | Posit8 → FP16: tận dụng tensor core FP16 sẵn có; bộ giải nén pipeline = 2/3 diện tích bảng tra | [18] tr.2, tr.10 | Cao |
| 38 | SPADE: 1×P32 / 2×P16 / 4×P8 trên một datapath; 28 nm 1.38 GHz, 6.1 mW | [48] tr.2–4 | Thấp–TB (preprint, có lỗi) |
| 39 | Bộ nhân posit tốn diện tích/năng lượng hơn float cùng bit (posit⟨8,0⟩ 1488 µm² vs FP⟨4,3⟩ 700 µm²) | [05] tr.9 Bảng 1 | Cao |
| 40 | EDP posit ≈ float; fixed tốt nhất; posit tốn LUT hơn (giải mã regime) | [03] tr.5; [04] tr.5; [07] tr.10 | Cao |

## 3. Đính chính sườn ban đầu (file của bạn cùng nhóm — KHÔNG sửa file gốc)

| Vị trí trong sườn | Nội dung sườn | Đính chính | Nguồn |
|---|---|---|---|
| Slide 5 | "Deep Positron và PositNN… suy luận **mạng CNN** 8/7-bit" | Deep Positron dùng **MLP trên dữ liệu bảng** (Iris, Breast Cancer, Mushroom; sau thêm MNIST/Fashion); PositNN [11] là bài **huấn luyện**. CNN suy luận: [01], [07], [43], [18] | [03] tr.5; [11] tr.1 |
| Slide 5 | "Deep PeNSieve hoặc QPyTorch… warm-up + layer-wise scaling" | Kỹ thuật này là của **[08] Lu et al.**; Deep PeNSieve/QPyTorch chỉ được nhắc trong tài liệu tham khảo của bài khác | [08] tr.3–4 |
| Slide 9 | "PLAU… 72.8% / 81.8%" | Tên đúng **PLAM**; số chính xác **72.86% / 81.79% / 17.01%**; là bộ nhân 32-bit so với bộ nhân posit chính xác; kiểm chứng độ chính xác với posit 16-bit | [36] tr.1, tr.5 |
| Slide 10 | "L1-level bit manipulations… loại bỏ hoàn toàn LUT" | Đúng ý, nguồn [05] công thức (3), [21] (thuật ngữ L1 của nhóm Pisa); cần nói rõ là **xấp xỉ** (sai số max ~0.06 với posit(8,0) — Thí nghiệm E) | [05] tr.7; [21] tr.3 |
| Slide 11 | "Chạy thử nghiệm thực tế… ~10%" | Con số 10% là **Bảng 2 của [11]**, không phải nhóm tự chạy. Nay nhóm đã **tự chạy Thí nghiệm D** để kiểm chứng | [11] tr.3 |
| Slide 11 | "Mixed-Precision **hoặc** Quire → chênh < 1%" | Chỉ quire: ≤ 19.39%. Phải **cả hai**; CIFAR-10 vẫn −1.64 điểm | [11] tr.4 |
| Slide 4, 6 | Công thức bị mất khi lưu file | Viết lại (xem báo cáo Word chương 2) | — |
| Slide 3 | Chuẩn hóa 3/2022 | Cần nguồn [S2] (chưa có trong thư mục); [18] tr.2 xác nhận es = 2 là chuẩn cho Posit8 | [18] tr.2 |
