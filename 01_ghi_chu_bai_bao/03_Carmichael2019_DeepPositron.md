# [03] Deep Positron: A Deep Neural Network Using the Posit Number System

- **Tác giả:** Zachariah Carmichael, Hamed F. Langroudi, Char Khazanov, Jeffrey Lillie, **John L. Gustafson** (NUS — cha đẻ của posit), Dhireesha Kudithipudi — RIT & National University of Singapore
- **Nguồn:** arXiv:1812.01762v2 (19/01/2019) (tr.1). Đăng tại DATE 2019 (Design, Automation & Test in Europe).

## Bài toán
- Muốn suy luận DNN ở độ chính xác **siêu thấp (≤ 8 bit)** mà không phải huấn luyện lại (tr.1).
- Các so sánh trước đó thường so định dạng 8-bit với 32-bit → **không công bằng**. Bài này so sánh **cùng số bit** giữa fixed-point, floating-point và posit (tr.1).

## Lập luận về IEEE 754 (tr.2) — dùng được cho slide "Đặt vấn đề"
- Float32 có dải động **hơn 80 bậc độ lớn (orders of magnitude)**, quá thừa cho DNN → "information-per-bit" thấp (theo entropy Shannon).
- FP16 (dùng trong GPU NVIDIA) có nhược điểm: ngoại lệ phức tạp, gradual underflow, **rất nhiều mẫu bit NaN**, **hai số 0** (+0 và −0).

## Đóng góp / phương pháp
1. **EMAC (Exact Multiply-and-Accumulate)** (tr.2–3): nhân rồi cộng dồn **không làm tròn trung gian**, chỉ làm tròn **một lần** ở cuối. Dùng biến thể **bộ tích lũy Kulisch** (thanh ghi rộng dạng fixed-point).
   - Độ rộng thanh ghi cho k phép nhân (công thức (3), tr.3): `wa = ⌈log2 k⌉ + 2·⌈log2(max/min)⌉ + 2`.
   - Với posit, thanh ghi này chính là **quire**, kích thước (công thức (4), tr.4): `qsize = 2^(es+2)·(n−2) + 2 + ⌈log2 k⌉`, n ≥ 3.
   - Làm tròn: round-to-nearest-even (tr.3).
2. Thiết kế 3 lõi EMAC trên FPGA cho fixed / float / posit, tham số hóa theo độ rộng bit (Hình 3, 4, 5).
3. Thuật toán giải mã posit trên phần cứng (Algorithm 1, tr.3): lấy bù hai, **đảo bit để chỉ cần bộ đếm số 0 đầu (LZD)** thay vì cả LOD lẫn LZD.
4. Kiến trúc **Deep Positron**: mỗi lớp có các EMAC riêng, trọng số lưu on-chip, ReLU (tr.4–5, Hình 1).

## Thiết lập thí nghiệm
- FPGA Xilinx Virtex-7 (xc7vx485t-2ffg1761c), Vivado 2017.2 (tr.5).
- ⚠ **Dataset là dữ liệu bảng chiều thấp** (low-dimensional), **mạng là MLP nhỏ, không phải CNN** (Bảng II, tr.5): Wisconsin Breast Cancer, Iris, Mushroom.

## Kết quả chính
**Bảng II (tr.5) — độ chính xác với EMAC 8-bit:**
| Dataset | Số mẫu test | Posit | Float | Fixed | Float32 |
|---|---|---|---|---|---|
| Wisconsin Breast Cancer | 190 | **85.89%** | 77.4% | 57.8% | 90.1% |
| Iris | 50 | **98%** | 96% | 92% | 98% |
| Mushroom | 2708 | **96.4%** | 96.4% | 95.9% | 96.8% |

- Posit 8-bit **bằng hoặc tốt hơn** float/fixed 8-bit trên cả 3 dataset; trên Iris posit 8-bit = float32 ("với ít hơn 24 bit", tr.5).
- Dưới 8 bit (5–7 bit): độ chính xác giảm **0–4.21%** so với float32; cấu hình tốt nhất: posit es ∈ {0, 2}, float we ∈ {3, 4} (tr.5).
- **Phần cứng (tr.5, Hình 6–8):**
  - Fixed-point có **EDP (energy-delay product) tốt nhất ở mọi độ rộng bit**.
  - EDP của posit ≈ float.
  - Posit **tốn nhiều LUT hơn** do khâu giải mã/mã hóa phức tạp (Hình 8) ← **điểm yếu**.
  - Với cùng dải động, EMAC posit chạy được **tần số cao hơn** EMAC float (Hình 6).
  - Với n ≤ 7, posit có dải động lớn hơn float.

## Hạn chế (nhóm nhận xét)
- Dataset rất nhỏ (Iris chỉ 50 mẫu test → 1 mẫu sai = 2%). Không thể khái quát cho CNN lớn.
- Tác giả tự gọi là "preliminary results" (tr.1).
- Chỉ suy luận, không huấn luyện.

## Ý quan trọng để hiểu
- **Lợi ích của posit đến từ 2 yếu tố tách biệt**: (1) phân bố giá trị khớp dữ liệu; (2) **cộng dồn chính xác (quire/EMAC)**. Thí nghiệm C của nhóm kiểm chứng riêng yếu tố (2).
- Phần related work (tr.6) xác nhận [01] là "kiến trúc DNN đầu tiên dùng posit", tiết kiệm ~30% bộ nhớ so với fixed-point.

## ⚠ Sửa sườn của bạn cùng nhóm
- Sườn ghi "Deep Positron và PositNN chứng minh posit 8/7-bit cho suy luận **mạng CNN**" → **sai 2 chỗ**: Deep Positron dùng **MLP trên dữ liệu bảng**; PositNN [11] là bài về **huấn luyện**. Suy luận CNN với posit ≤ 8 bit có trong [01] (lưu trọng số), [04], [07].

## Dùng cho
- Slide "Quire / EMAC", "Tổng quan nghiên cứu", "Điểm yếu (chi phí phần cứng)". Báo cáo mục 2.5 (quire), 3.1.
