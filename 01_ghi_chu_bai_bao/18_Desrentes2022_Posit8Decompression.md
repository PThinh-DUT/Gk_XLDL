# [18] A Posit8 Decompression Operator for Deep Neural Network Inference

- **Tác giả:** Orégane Desrentes (ENS Lyon & Kalray), Diana Resmerita (Kalray), Benoît Dupont de Dinechin (Kalray) — Pháp. **Kalray** là công ty sản xuất bộ xử lý nhiều lõi (MPPA).
- **Nguồn:** **CoNGA 2022** (Third International Conference on Next Generation Arithmetic), 03/2022, Singapore, Springer LNCS, tr. 14–30, DOI 10.1007/978-3-031-09779-9_2; bản HAL hal-04240741 (tr.1).

## Bài toán & cách tiếp cận khác biệt (tr.2)
- **Không tính toán bằng posit.** Thay vào đó: **lưu tham số dạng Posit8** (nén từ FP32) rồi **giải nén sang FP16** ngay trước khi đưa vào các bộ nhân–cộng ma trận **FP16.32** sẵn có của bộ xử lý Kalray MPPA3.
  → Một con đường thực tế để hưởng lợi từ posit **khi phần cứng chưa có ALU posit**.
- Bộ giải nén phải được nhân bản **32 lần** để theo kịp băng thông nạp 32 byte/chu kỳ của mỗi PE; tham số es (0–3) truyền qua 2 bit trong mã lệnh (tr.2).
- Bài khẳng định: "**es = 2 hiện là chuẩn cho Posit8**" (tr.2) → phù hợp Posit Standard 2022.

## Bảng 2 (tr.4) — dải động (log10(max/min), đơn vị "thập phân")
| FP32 | FP16 | BF16 | MSFP8 | Posit8.0 | Posit8.1 | Posit8.2 | Posit8.3 |
|---|---|---|---|---|---|---|---|
| 83.38 | 12.04 | 78.57 | 9.63 | 3.61 | 7.22 | 14.45 | 28.89 |
- ✔ Nhóm đã **tự tính lại** posit8.0/8.1/8.2, FP16, BF16 bằng bộ mô phỏng (`02_demo/results/00_validation.json`) → **khớp hoàn toàn** (3.61 / 7.22 / 14.45 / 12.04 / 78.57).
- Posit8.0 và Posit8.1: **mọi giá trị biểu diễn chính xác trong FP16**. Posit8.2: 8 giá trị lớn không vừa FP16 (vừa BF16). Posit8.3: 46 giá trị không vừa FP16, 12 không vừa BF16 (tr.5).

## Thí nghiệm nén tham số (tính toán vẫn FP32, chỉ thay tham số) — mạng ImageNet huấn luyện sẵn
**Bảng 3 (tr.5) — nén TẤT CẢ tham số, Top-1 (%):**
| Mạng | FP32 | FP16 | BF16 | MSFP8 | P8.0 | P8.1 | P8.2 | P8.3 |
|---|---|---|---|---|---|---|---|---|
| VGG16 | 70.6 | 70.6 | 70.8 | 69.7 | **10.2** | 70.8 | 70.5 | 70 |
| VGG19 | 70.1 | 70.1 | 70.3 | 67.9 | 4.8 | 70.1 | 69.9 | 70.6 |
| ResNet50 | 75.7 | 71.3 | 75.5 | 62.8 | **0.0** | 27.7 | 73.2 | 66 |
| InceptionV3 | 71.1 | 71.1 | 71.3 | 44.8 | 65.1 | 69.4 | 69.7 | 63.1 |
| Xception | 73.5 | 73.4 | 73.6 | 37.5 | 70.6 | 72.4 | 72.1 | 63.8 |
| MobileNetV2 | 71.2 | 71.2 | 71 | 0.2 | 12.7 | 12.3 | 11.0 | 3.2 |
- YOLOv3 (Bảng 4) mAP: FP32 0.41595; P8.1 0.4155; P8.2 0.411; MSFP8 0.3022.

**Bảng 5 (tr.6) — KHÔNG nén tham số BatchNorm (chỉ nén Conv & FC), Top-1:**
| Mạng | FP32 | P8.0 | P8.1 | P8.2 | P8.3 |
|---|---|---|---|---|---|
| ResNet50 | 75.7 | 71.3 | 75.0 | 75 | 73.6 |
| InceptionV3 | 71.1 | 66.0 | 70.9 | 70.1 | 69.9 |
| Xception | 73.5 | 72.1 | 72.6 | 72.8 | 68.8 |
| MobileNetV2 | 70.8 | 25.3 | 53.5 | 52.7 | 39.4 |

## Kết luận rút ra
- **es quyết định thành bại**: Posit8.0 (dải 3.61 thập phân) làm sụp VGG16 (10.2%) và ResNet50 (0%); Posit8.1/8.2 giữ gần nguyên độ chính xác.
- **Tham số BatchNorm rất nhạy** → nên giữ ở độ chính xác cao (giống kết luận của [08]).
- **MobileNetV2** (mạng gọn, depthwise conv) **sụt mạnh với mọi định dạng 8-bit** → mạng càng gọn càng nhạy với lượng tử hóa.
- MSFP8 (FP16 cắt còn 8 bit: 1-5-2) kém xa posit8.1/8.2 → **cần cân bằng dải động và độ chính xác**.
- ⚠ Lỗi số liệu trong bài: Bảng 5, ResNet50 P8.0 ghi Top-1 = 71.3 nhưng **Top-5 = 9.8** — vô lý (Top-5 luôn ≥ Top-1) → có lẽ lỗi đánh máy; tránh trích con số này.
- Đáng chú ý: ResNet50 với FP16 tụt 75.7 → 71.3 trong khi BF16 giữ 75.5 → dải động FP16 không đủ cho một số tham số.

## Phần cứng (tr.7–15) — Synopsys DC NXT, TSMC 16FFC, mục tiêu 1.5 GHz
- **Bổ đề 1:** với Posit8.2/8.3, **chỉ cần biết regime** là phát hiện trước được tràn trên/tràn dưới khi đổi sang FP16 (Posit8.2 tràn khi regime ≥ 4; Posit8.3 tràn khi regime ≥ 2, tràn dưới khi regime ≤ −4) (tr.6).
- Bộ giải nén tổ hợp có pipeline, so với bảng tra 4096 mục: **2/3 diện tích**, **½ công suất rò** (tr.10).
- Bản chỉ hỗ trợ làm tròn RN: **5/6 diện tích**, **2/3 công suất rò** so với bảng tra đã tối ưu (tr.14).
- Bản chỉ hỗ trợ Posit8.2 (chuẩn) còn nhỏ hơn nữa (Hình 10).

## Ý quan trọng để hiểu
- Đây là hướng **"posit làm định dạng lưu trữ, FP16 làm định dạng tính toán"** — giảm 2× bộ nhớ tham số so với FP16 mà không cần thay ALU. Đây là hướng triển khai **thực tế, công nghiệp** (Kalray).

## Dùng cho
- Slide "Phương pháp tối ưu: tích hợp vào phần cứng sẵn có", "Điểm yếu: es nhỏ, mạng gọn". Bảng dải động dùng cho slide cấu trúc. Đối chiếu Thí nghiệm A/B.
