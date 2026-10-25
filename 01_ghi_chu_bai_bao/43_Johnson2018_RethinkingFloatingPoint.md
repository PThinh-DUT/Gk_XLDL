# [43] Rethinking floating point for deep learning

- **Tác giả:** Jeff Johnson — **Facebook AI Research (FAIR)**, New York (tr.1)
- **Nguồn:** preprint arXiv:1811.01721v1, 01/11/2018 ("Preprint. Work in progress", tr.1). Mã nguồn: github.com/facebookresearch/deepfloat (tr.5). Được trích dẫn rộng rãi bởi [03], [04], [05], [07], [11]… (định dạng "log float"/ELMA).

## Bài toán (tr.1)
- Thay vì tìm cách lượng tử hóa số nguyên ngày càng phức tạp (cần học tham số lượng tử, fine-tune), tác giả **cải tiến chính dấu phẩy động** để vừa giữ tính "đa dụng" vừa hiệu quả như số nguyên.
- Lịch sử: float kém hiệu quả năng lượng **tới 10×** so với số nguyên; **di chuyển dữ liệu (SRAM/DRAM/flip-flop) chiếm phần lớn năng lượng** → giảm số bit có lợi rất lớn (tr.1).

## Ba ý tưởng kết hợp
1. **Mã hóa tapered của posit** (tr.2–3): posit dùng mã **Golomb–Rice** cho số mũ (regime = phần thương mã unary). Độ chính xác cao nhất trong ±[2^−(s+1), 2^(s+1)) với N − 3 − s bit định trị, thon dần về 0 bit ở ±maxpos. Float (4,3) 8-bit kiểu IEEE lãng phí **~6% mã cho NaN** (tr.2).
2. **Bộ cộng dồn Kulisch (= quire)** (tr.3): thanh ghi fixed-point đủ rộng chứa mọi tích ±(f²max + f²min) → **cộng dồn kết hợp được (associative), không lỗi**, chỉ làm tròn **một lần** cuối. Gọi là **EMA (exact multiply-add)**:
   - EMA tính `r(Σ aᵢbᵢ)`; FMA tính `r(aₙbₙ + r(aₙ₋₁bₙ₋₁ + r(… + r(a₁b₁ + 0))))` — **làm tròn sau mỗi bước**.
   - Với float 8-bit, bộ cộng dồn lớn dần so với tích mới → hiện tượng **c + ab = c** (tích nhỏ bị "nuốt mất") — tăng vài bit cho accumulator chỉ trì hoãn vấn đề.
   - ResNet-50 có tới **4 608** tích trong một tổng (conv 3×3, 512 kênh vào).
   - Lịch sử: máy Z3 của Konrad Zuse (1941) đã có phép tương tự ("Auflaufenlassen").
3. **Nhân trong miền logarit, cộng trong miền tuyến tính (ELMA)** (tr.4): nhân log = cộng số mũ; đổi sang tuyến tính bằng LUT nhỏ p(f) = 2^f − 1 rồi cộng dồn Kulisch. Với int8/32 MAC, **phép nhân chiếm 63.4% công suất tổ hợp** (28 nm) (tr.4).

## Bảng 1 (tr.2) — dải động (dB = 20·log₁₀(max/min))
| Định dạng | dB | Bit định trị max |
|---|---|---|
| int8 đối xứng | 42.1 | – |
| **posit (8,0)** | **72.2** | 5 |
| float (4,3) không denormal | 83.7 | 3 |
| float (4,3) có denormal | 101.8 | 3 |
| **posit (8,1)** | **144.5** | 4 |
| float16 có denormal | 240.8 | 10 |
| **posit (8,2)** | **289.0** | 3 |
| posit (16,1) | 337.2 | 12 |
- ✔ Khớp với số liệu nhóm tự tính (posit8,0 = 3.61 thập phân × 20 = 72.2 dB; posit8,1 = 144.4; posit8,2 = 289.0; FP16 = 240.8).

## Bảng 2 (tr.5) — ResNet-50 ImageNet, **không huấn luyện lại**, chỉ làm tròn RNE, mọi phép toán thay bằng posit/log + EMA
| Kiểu | Top-1 (so với FP32 76.130%) | Top-5 (so với 92.862%) |
|---|---|---|
| (8,1,5,5,7) log ELMA | −0.90 | −0.20 |
| (7,1) posit EMA | −4.63 | −2.28 |
| **(8,0) posit EMA** | **−76.03 (sụp hoàn toàn)** | −92.36 |
| **(8,1) posit EMA** | **−0.87** | −0.19 |
| (8,2) posit EMA | −2.20 | −0.85 |
| (9,1) posit EMA | −0.30 | −0.09 |
| *int8/32 (Jacob et al., có huấn luyện mô phỏng lượng tử)* | −1.50 | – |
| *int8/32 (Migacz, hiệu chỉnh KL)* | −0.20 | −0.03 |
- **posit(8,0) có dải động không đủ**: activation bị làm tròn về rất nhỏ → mạng sụp (tr.5). **posit(8,1) tốt nhất** trong các posit 8-bit; posit(8,2) kém hơn vì ít bit định trị.
- Lưu ý: có dùng một độ lệch mũ n = −4 ở lớp FC cuối để đưa log-xác suất từ ~16 về ~1; thiếu nó mất thêm 0.5–1% Top-1 (tr.5). BatchNorm được gộp vào lớp trước.

## Bảng 3 (tr.6) — ASIC 28 nm, 500 MHz
| PE | Diện tích (µm²) | Công suất (µW) |
|---|---|---|
| int8/32 MAC | 336.672 | 283 |
| (8,1,5,5,7) log ELMA | 376.110 | 272 |
| float16 FMA (không denormal) | 1 545.012 | 1 358 |
| 16-bit log ELMA (dải như float16) | 1 043.154 | 805 |
| Mảng systolic 32×32 int8/32 | 348 231 | 226 000 |
| Mảng systolic 32×32 log ELMA 8-bit | 457 738 | 195 500 |
- ELMA 8-bit = **0.96× công suất, 1.12× diện tích** của int8/32 MAC (✔ 272/283; 376.1/336.7). ELMA 16-bit = **0.59× công suất, 0.68× diện tích** float16 FMA (✔).
- Mức mảng 32×32: diện tích **+31%**, công suất **−13.5%** so với int8 (nhóm tính).

## Hạn chế (nhóm nhận xét)
- Preprint "work in progress"; so sánh với int8 dùng mô hình gốc khác nhau (tác giả tự nêu là "không so sánh trực tiếp được", tr.6).
- Giới hạn dải của accumulator về [f²min, fmax] để tiết kiệm năng lượng → không còn hoàn toàn "chính xác".

## Ý quan trọng để hiểu
- Bài cho thấy rõ **3 thành phần độc lập** làm nên hiệu quả: (1) mã hóa tapered, (2) cộng dồn chính xác (quire), (3) nhân trong miền log — PLAM [36] và LP [35] phát triển tiếp ý (3).
- **es quan trọng sống còn**: cùng 8 bit, es = 0 sụp hoàn toàn trên ImageNet, es = 1 gần như không mất.

## Dùng cho
- Slide "Quire / tích lũy chính xác" (công thức EMA vs FMA), "Tổng quan – suy luận ImageNet", "Phương pháp tối ưu: miền log". Thí nghiệm C của nhóm minh họa đúng hiện tượng "c + ab = c" khi không có quire.
