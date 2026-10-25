# [08] Training Deep Neural Networks Using Posit Number System

- **Tác giả:** Jinming Lu, Siyuan Lu, Zhisheng Wang, Chao Fang, Jun Lin, Zhongfeng Wang, Li Du — School of Electronic Science and Engineering, **Nanjing University**, Trung Quốc
- **Nguồn:** arXiv:1909.03831v1, 06/09/2019 (tr.1). Bản hội nghị: SoCC 2019 (IEEE International System-on-Chip Conference), tr. 62–67 — theo DBLP (tra cứu 25/10/2026); bản tạp chí mở rộng: IEEE Trans. Computers 2021, vol. 70, no. 2.

## Bài toán (tr.1)
- Huấn luyện cần định dạng có **dải động đủ rộng** (cho gradient) và **độ chính xác cao ở tâm phân bố dữ liệu** → posit phù hợp về lý thuyết, nhưng thay FP32 bằng posit độ chính xác thấp **một cách trực tiếp thì không cho kết quả như mong đợi** (tr.3).
- 3 nguyên nhân tác giả chỉ ra (tr.3):
  1. Giai đoạn đầu huấn luyện mô hình rất nhạy với độ chính xác; phân bố trọng số lớp **BatchNorm** thay đổi mạnh trong vài epoch đầu (Hình 2).
  2. Độ chính xác của posit **đối xứng quanh 1**, còn dữ liệu DNN tập trung ở một dải hẹp khác → lệch nhau.
  3. Mỗi lớp có dải giá trị khác nhau → dùng chung một es là chưa tối ưu.

## Phương pháp — 3 kỹ thuật (tr.3–4)
1. **Warm-up training bằng FP32**: 1–5 epoch đầu chạy FP32 (CIFAR-10: 1 epoch; ImageNet: 5 epoch), sau đó mới chuyển sang posit.
2. **Layer-wise scaling (dịch phân bố theo từng lớp)** — công thức (2), (3):
   - `center = round(mean(log2 |x|))`, `S_f = 2^(center + σ)`, σ = 2.
   - `p_x = P(x / S_f) · S_f` → đưa phần lớn giá trị của mỗi lớp về vùng quanh 1, nơi posit chính xác nhất. Hệ số là **lũy thừa của 2** → nhân/chia chỉ là dịch bit.
3. **Chọn es theo loại dữ liệu**: es = 1 cho trọng số & activation; **es = 2 cho gradient & error** (dải động rộng hơn).
- Toán tử chuyển đổi P(x) (Algorithm 1, tr.3): ⚠ dùng **làm tròn về 0 (round-to-zero/truncation)** vì thân thiện phần cứng, và **|x| < minpos → 0**. Hai điểm này **khác Posit Standard** (chuẩn dùng round-to-nearest-even và không bao giờ làm tròn số khác 0 về 0).
- Bảng I (tr.2): liệt kê đầy đủ 16 giá trị dương của posit⟨5,1⟩ (1/64 … 64) — rất hữu ích để minh họa trên slide.

## Kết quả (Bảng III, tr.4)
| Dataset | Mô hình | FP32 | Posit | Cấu hình posit |
|---|---|---|---|---|
| CIFAR-10 | ResNet-18 | 93.40% | **92.87%** | Conv: (8,1) forward & cập nhật trọng số, (8,2) backward; BN: (16,1)/(16,2) |
| ImageNet | ResNet-18 | 71.02% | **71.09%** | (16,1) forward & cập nhật trọng số, (16,2) backward |
- Lần đầu **huấn luyện ImageNet bằng posit 16-bit không mất độ chính xác** (tr.1). CIFAR-10 với posit 8-bit cho lớp Conv mất 0.53 điểm.
- Huấn luyện bằng PyTorch trên GPU NVIDIA P100 (**mô phỏng phần mềm**), SGD momentum 0.9, batch 512 (tr.4).
- ⚠ Mâu thuẫn nhỏ: Bảng III ghi ImageNet **120 epoch**, phần văn bản ghi **90 epoch** (tr.4).

## Phần cứng posit MAC (tr.4–6) — TSMC 28 nm, 750 MHz
- Kiến trúc: **giải mã posit → FP, MAC dấu phẩy động, mã hóa FP → posit**. Ở thiết kế gốc [Zhang et al.], bộ mã hóa + giải mã chiếm **~40% độ trễ** của MAC (tr.5).
- Tối ưu: tách đường dịch bit, bỏ bộ cộng trên đường găng → encoder **nhanh hơn 25–35%**, decoder **nhanh hơn 15–30%** (Bảng IV).
- **Bảng V (tr.6):**
| MAC | Công suất (mW) | Diện tích (µm²) |
|---|---|---|
| FP32 | 2.52 | 4 322 |
| posit(8,1) | 0.45 | 1 208 |
| posit(8,2) | 0.35 | 1 032 |
| posit(16,1) | 1.77 | 4 079 |
| posit(16,2) | 1.60 | 3 897 |
- Bài tuyên bố: so với FP32 MAC, giảm **công suất 22–83%**, **diện tích 6–76%**.
  - ⚠ Nhóm tính lại từ Bảng V: diện tích giảm 5.6% (16,1) → 76.1% (8,2) ✔ **khớp**; công suất giảm 29.8% (16,1) → 86.1% (8,2) — **không khớp** hẳn với "22–83%". → Khi trích, nên ghi theo số trong bảng.
  - ⚠ So sánh này là **posit 8/16-bit với FP32** (khác số bit) → phần lớn mức tiết kiệm đến từ việc **ít bit hơn**, không chỉ do định dạng posit.

## Hạn chế (nhóm nhận xét)
- Vẫn cần FP32 cho warm-up; BN cần 16-bit → chưa phải "thuần posit 8-bit".
- Phần cứng không có quire (dùng FP MAC bên trong).

## Ý quan trọng để hiểu
- Đây là **nguồn gốc đúng** của ý "warm-up training + layer-wise scaling" trong sườn (sườn đang ghi nhầm là Deep PeNSieve/QPyTorch).
- Cho thấy công thức thành công khi huấn luyện posit thấp bit = **posit + scaling theo lớp + es khác nhau cho gradient + (một chút FP32/16-bit ở chỗ nhạy cảm)**.

## Dùng cho
- Slide "Tổng quan – huấn luyện", "Phương pháp tối ưu: layer-wise scaling". Thí nghiệm B/D của nhóm dùng scaling lũy thừa 2 theo cùng tinh thần.
