# [46] An Investigation on Inherent Robustness of Posit Data Representation

- **Tác giả:** Ihsen Alouani (IEMN CNRS, INSA Hauts-de-France, Pháp), Anouar Ben Khalifa (University of Sousse, Tunisia), **Farhad Merchant**, Rainer Leupers (RWTH Aachen, Đức) (tr.1)
- **Nguồn:** **VLSID 2021** (International Conference on VLSI Design; ghi "to appear"), arXiv:2101.01416v1 (05/01/2021). Công cụ mở mã nguồn (tr.1).
- **Góc nhìn khác biệt:** không phải độ chính xác hay tốc độ, mà là **độ tin cậy / khả năng chịu lỗi** (soft error).

## Bài toán (tr.1–2)
- Transistor càng nhỏ, điện áp càng thấp → chip càng nhạy với **lỗi mềm (soft error)**: hạt alpha, neutron từ tia vũ trụ làm **lật bit** (SEU — single event upset; MBU — multi-bit upset). Từ công nghệ 40 nm, **> 35% sự kiện là MBU** (tr.4).
- Câu hỏi: khi một/hai bit bị lật, số posit hay số float bị sai lệch nhiều hơn? (Bài tự nhận là nghiên cứu so sánh đầu tiên về chủ đề này.)

## Phân tích lý thuyết (tr.3)
- Với giá trị gần 1, posit(32,2) có **nhiều bit định trị hơn** float32 (thêm m bit, m = exp_size − k − es) → một bit lật ở cùng vị trí trong posit mang **trọng số nhỏ hơn** → sai số nhỏ hơn.
- Lật bit trong **exponent**: float chịu thiệt hơn (bit mũ float mang trọng số lớn).
- ⚠ Ngược lại, lật bit trong **regime** của posit gây sai số **lớn hơn** lật bit 3–8 của float (tr.3).

## Thí nghiệm & kết quả
- Định dạng: **Posit(32,2)** vs **IEEE 754 FP32**; tiêm lỗi **vét cạn** từng bit, đo **MRED** (mean relative error distance, công thức (3)); cài trên SoftPosit (tr.3–4).
- **Lật 1 bit (SEU):** trong **> 95%** trường hợp, float lệch khỏi giá trị đúng **nhiều hơn** posit. Posit chỉ ra NaR **31 lần (~0.7×10⁻⁶ %)**, còn float ra **NaN > 4%** số lần tiêm lỗi (tr.4).
- **Lật 2 bit (MBU):** sai số lớn hơn nhưng xu hướng posit bền hơn **vẫn giữ** (Hình 4b).
- **Ứng dụng ML** (tr.6, Hình 5–8): nhận dạng hành động người (Berkeley MHAD, gia tốc kế) và xác thực sinh trắc ECG (LATIS) với 10 bộ phân loại (SVM, cây quyết định, KNN, AdaBoost, random forest, MLP…), tiêm 1 lỗi vào đầu vào:
  - Độ chính xác **giảm 0–30% với posit**, **10–67% với float**.
  - Ví dụ (Hình 5, HAR đặc trưng thống kê, SVM tuyến tính): không lỗi 0.84 → posit 0.77 → float **0.31**.
- Hai lý do posit bền hơn: (1) trường scale (regime) có độ dài thay đổi và (2) phần định trị dài hơn ở đa số giá trị; thêm vào đó posit **không có mẫu NaN dư thừa** (tr.5–6).

## Hạn chế (nhóm nhận xét)
- Chỉ xét 32-bit (es = 2); chưa xét 8/16-bit — nơi posit được dùng cho AI.
- Lỗi chỉ tiêm vào **dữ liệu đầu vào** của bộ phân loại, không phải vào trọng số/phép tính bên trong mạng.
- Ưu thế phụ thuộc giá trị nằm gần 1; giá trị rất lớn/nhỏ (regime dài) thì posit có ít bit định trị hơn.

## Ý quan trọng để hiểu
- Thêm một **ưu điểm ít được nhắc** của posit: **bền với lỗi phần cứng** → hấp dẫn cho hệ thống an toàn (ô tô tự lái, hàng không vũ trụ) và tính toán xấp xỉ.

## Dùng cho
- Slide "Điểm mạnh của posit" (một ý: độ bền), "Bảng đánh giá". Báo cáo mục 2.6, 5.
