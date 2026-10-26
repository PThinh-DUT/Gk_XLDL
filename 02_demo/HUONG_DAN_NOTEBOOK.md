# Học và lấy số liệu bằng notebook

Mở `00_BAT_DAU.ipynb` trước. Đã có 11 notebook ứng với 11 script thí nghiệm/công cụ và 6 notebook của thư viện `posit_lab/`. Giữ nguyên Python gốc để đối chiếu. Hai file Python trong `notebook_tools/` là công cụ tạo notebook và xuất báo cáo, không phải thí nghiệm.

## Môi trường

Dùng Python 3.11 trở lên. Trong terminal tại `02_demo`, thiết lập một lần:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-notebooks.txt
python -m ipykernel install --user --name posit-lab --display-name "Posit Lab"
```

Trong VS Code cài extension Python và Jupyter, mở `.ipynb`, chọn kernel **Posit Lab**. Hoặc chạy `jupyter lab`. Gói tùy chọn `softposit` dùng để đối chiếu Posit ở notebook 01; nếu thiếu, script thông báo bỏ qua, không được coi là đã kiểm chứng phần đó.

## Hai chế độ

- **Đọc số liệu:** `RUN_EXPERIMENT = False` (mặc định). Run All đọc JSON/hình sẵn có, hiển thị bảng và xuất bản báo cáo mới. Những output có sẵn khi vừa mở notebook là ảnh chụp số liệu trong repo, không phải một lần chạy thí nghiệm mới.
- **Thực hiện thí nghiệm:** đổi `RUN_EXPERIMENT = True` rồi Restart Kernel & Run All. Code được chia thành các ô theo đúng thứ tự script. Không chạy nhảy ô. Notebook C và D có thể mất lâu. D mặc định tiếp tục từ JSON và bỏ qua config/seed đã có; dùng `SCRIPT_ARGS = ["1", "2"]` để thêm seed. Muốn chạy lại đúng seed cũ, sao lưu và di chuyển JSON cũ trước khi bắt đầu.

Thứ tự: 01 → 02 → 03/04/05/06 → 07 → 08 → 09/10. Notebook 11 chỉ để gộp kết quả D ở hai file; không cần chạy trong luồng thông thường. Thư viện `posit_lab/*.ipynb` dùng để đọc thuật toán; không cần chạy trước các thí nghiệm.

## Kết quả được lưu

Mỗi lần chạy ô thiết lập tạo `results/notebook_runs/<tên_script>/<thời_gian_UTC>/`:

- `report.html`: bảng và hình nhúng đầy đủ, mở bằng trình duyệt, có thể in thành PDF.
- JSON gốc: đầy đủ dữ liệu lồng nhau, lịch sử epoch, từng seed và cấu hình.
- CSV UTF-8 có BOM: mở trong Excel; bảng lịch sử và thông tin lồng nhau được xuất riêng.
- PNG liên quan: hình để đưa vào bài.
- `manifest.json`: chế độ, nguồn script, SHA-256, phiên bản Python, tham số, trạng thái và thời điểm xuất.
- `artifacts.json`: checksum các JSON đã dùng.
- `execution.log`: stdout/stderr khi thực hiện lại code, kể cả lỗi; chế độ đọc dữ liệu không có log thực nghiệm mới.
- `before_run/`: sao lưu kết quả, hình và checkpoint trước khi chạy lại để tránh mất bản trước.

Script vẫn ghi kết quả chuẩn vào `results/`, `figures/`, `results/checkpoints/` để các bước tiếp theo đọc được. CSV và HTML là bản xuất theo lần, không ghi đè bản xuất cũ. Nhấn **Ctrl+S / Cmd+S** sau khi chạy để lưu output vào `.ipynb`; Python không tự lưu nội dung ô notebook trong VS Code.

**Hình B/C/D phải được cập nhật bằng notebook 08 sau khi số liệu thay đổi.** Nếu không, hình vẫn có thể phản ánh kết quả cũ. Checkpoint chuẩn nằm trong `results/checkpoints/`; bản trước chạy được sao lưu khi bật chạy thực nghiệm.

## Dùng số liệu viết bài

Phân biệt số liệu tự mô phỏng với số liệu trích bài báo. Báo cáo rõ seed, số epoch, định dạng, scaling, accumulator và đơn vị. Dữ liệu D hiện có chỉ seed 0; không suy diễn độ lệch chuẩn nhiều lần chạy. Quire ở C mô phỏng bằng FP64; nhân–cộng ở D dùng FP32. Thời gian mô phỏng không chứng minh tốc độ/năng lượng phần cứng Posit.

## Cập nhật từ Python gốc

Sau khi sửa `.py`, có thể dựng lại notebook bằng `python notebook_tools/build_notebooks.py`. Lệnh này ghi đè các notebook được sinh, bao gồm output và sửa đổi trong đó; hãy lưu bản riêng trước. Việc sửa một notebook không tự cập nhật script gốc.

## Venv hiện có của workspace

Đã cài và kiểm tra thư viện trong `XLDL/.venv` (Python 3.9.6), gồm cả SoftPosit. Đã thử đọc Fashion-MNIST và chạy forward LeNet-5 thành công. Trong VS Code chọn kernel **XLDL (.venv)** hoặc Python tại `XLDL/.venv/bin/python`. Kernel được đăng ký bên trong venv. File `requirements-notebooks.lock.txt` ghi các phiên bản đã cài trên máy này. Khuyến nghị Python 3.11 ở trên áp dụng khi tạo môi trường mới; venv hiện có vẫn được giữ nguyên.
