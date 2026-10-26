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

## Mô phỏng và xem kết quả lớn

- Slide 5: chọn mã bit/es, bấm Chạy mô phỏng hoặc Bước tiếp để giải mã sign, regime, exponent, fraction; có ví dụ âm, zero, NaR và biên dải.
- Slide 6: đổi w và kéo thanh dịch s; tính thật Q(w·2^s)/2^s, cập nhật sai số. Vùng tô trên trục chỉ là vùng minh họa quanh 1, không phải ranh giới độ chính xác cứng.
- Slide 7: chạy 10 số hạng của ví dụ triệt tiêu; thấy FMA posit8 làm mất 0.125 mỗi bước trong khi bộ cộng dồn rộng giữ lại tổng 1.
- Slide 9: theo dõi forward → loss → backward → optimizer; chuyển giữa 8-bit và O12L10 để xem độ rộng ở từng giai đoạn. Hoạt họa này không huấn luyện lại mạng.
- Slide 11: kéo fA/fB để tính PLAM, xét cả hai nhánh t<1/t≥1; sai số là của xấp xỉ phần định trị trước làm tròn posit.
- Slide 12: ngoài đồ thị lớn còn có mô phỏng XOR → dịch phải 2 bit, hiển thị mã trung gian, kết quả sigmoid và sai số.
- Slide 12, 14, 15, 16: Đồ thị lớn / Bảng hoặc giải thích. Nhấn ảnh hoặc nút phóng để mở đồ thị lớn; cuộn khi ảnh vượt màn hình, Esc để đóng.
- Hoạt họa chỉ chạy khi bấm; tự dừng khi chuyển slide hoặc ẩn tab. Chế độ giảm chuyển động bỏ hiệu ứng trượt và kéo dài thời gian đọc mỗi bước.

`models.js` chứa mô hình số học độc lập với giao diện. `tests/models.test.cjs` đối chiếu 768 mã bit và 522 giá trị làm tròn với bộ mô phỏng Python đã kiểm chứng; kiểm thêm triệt tiêu, các nhánh PLAM và scaling (2 314 kiểm tra tham chiếu/tính chất). Chạy bằng `node tests/models.test.cjs` nếu có Node.js. `tests/reference.json` được sinh từ `posit_lab/numformats.py`, không phải kết quả benchmark mới.

Kiểm thử sigmoid bổ sung: đối chiếu toàn bộ 255 mã hữu hạn posit(8,0), kiểm tra NaR và sai số max trùng kết quả E. Các mô phỏng này không tạo số đo phần cứng mới.
