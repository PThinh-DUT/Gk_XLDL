# Slide Posit AI bằng impress.js

18 slide tiếng Việt, 16:9, HTML/CSS/JavaScript. Thư viện và ảnh nằm trong thư mục này, không cần npm/Node.js hoặc mạng khi trình chiếu.

## Mở trên localhost

Từ thư mục XLDL, chạy:

```bash
.venv/bin/python -m http.server 8001 --bind 127.0.0.1 --directory Gk_XLDL/04_slide/impress
```

Mở http://localhost:8001 trên trình duyệt. Giữ Terminal đang chạy; Ctrl+C để dừng server. Nếu cổng đang dùng, đổi 8001 thành 8002 trong cả lệnh và địa chỉ. Nếu không dùng môi trường của project, thay `.venv/bin/python` bằng `python3` đã cài trên máy.

## Điều khiển

- Space, phím mũi tên, Page Up/Down: chuyển slide (impress.js).
- N hoặc nút Ghi chú: xem lời nhắc của slide hiện tại. Đóng ghi chú trước khi chiếu cho khán giả; nội dung này hiện trên cùng màn hình.
- Home / End: về đầu / cuối. Các nút mũi tên không chuyển vòng ở hai đầu.
- Toàn màn hình: mở chế độ fullscreen của trình duyệt.
- Đọc / in: xếp tất cả slide thành trang liên tiếp.
- Mở `http://localhost:8001/?print` rồi dùng chức năng Print → Save as PDF của trình duyệt. Bật Background graphics; tắt headers/footers; dùng Landscape nếu trình duyệt yêu cầu. Kiểm tra preview trước khi lưu.

Không cần “import” vào ứng dụng: impress.js chính là thư viện chạy slide trong trang HTML.

## Chỉnh sửa

- `index.html`: 18 phần tử `<section class="step">`; sửa chữ, nguồn, bảng và `<aside class="notes">` tương ứng. Slide đầu có chỗ điền tên nhóm, giảng viên, lớp.
- `style.css`: màu sắc, cỡ chữ và bố cục. Canvas 1600×900; tăng/giảm nội dung trước khi giảm cỡ chữ.
- `deck.js`: nút điều khiển và chế độ đọc/in.
- `assets/`: ảnh gốc sao chép từ `02_demo/figures`; muốn cập nhật số liệu phải cập nhật bảng, ghi chú và ảnh đồng bộ.
- `vendor/impress.js`: thư viện từ đường dẫn bản phát hành 2.0.0 được README chính thức giới thiệu; giữ kèm giấy phép MIT trong `vendor/LICENSE.impress.txt`.

Nội dung dựa trên `../Dan_y_slide_da_hieu_chinh.md`. Bảng D lấy từ `02_demo/results/06_expD_training.json` tại thời điểm dựng; không tự động đọc lại JSON khi mở trình duyệt. C xấp xỉ quire bằng float64; D dùng fake quantization và MAC/cross-entropy FP32. Chỉ có seed 0 ở D; không suy ra hiệu năng phần cứng.

## Đưa lên GitHub khi cần

Đây là thư mục web tĩnh có thể chia sẻ hoặc đưa lên GitHub Pages. Chưa thực hiện push/publish trong phiên này. Nếu xuất bản riêng, giữ nguyên `index.html`, `style.css`, `deck.js`, `assets/` và `vendor/` cùng cấu trúc. Không cần đưa dữ liệu huấn luyện và checkpoint lên website.

Tài liệu thư viện: https://github.com/impress/impress.js

## Phong cách theo PDF tham chiếu

Giao diện được cập nhật theo PDF “Posit Number for  Afficient AI Models.pdf” người dùng cung cấp: nền trắng/xám xanh, navy #1d4060, tiêu đề sans nét vừa và đường kẻ mảnh. Ảnh nền trừu tượng và hai ảnh cầu thang trong assets được trích nguyên từ PDF; không sao chép logo trường, tên tác giả hay ngày giả trong mẫu. Bố cục thích ứng cho 18 slide, không phải bản sao từng trang PDF. Nội dung và bảng số liệu được giữ lại. Biểu đồ giữ màu và nhãn gốc.
