# Báo cáo giữa kỳ — Hệ thống số Posit cho AI hiệu năng cao

## Cấu trúc thư mục

| Thư mục / file | Nội dung |
|---|---|
| `BẢN NỘI DUNG CHI TIẾT BÁO CÁO GIỮA KỲ - Xử lý dữ liệu.docx` | Sườn ban đầu của bạn cùng nhóm — **giữ nguyên, không sửa** |
| `Posit Number for  Afficient AI Models.pdf` | Template slide Canva (15 trang) — giữ nguyên |
| `papers_download/` | 21 bài báo gốc (mã [NN] = số đầu tên file) |
| `01_ghi_chu_bai_bao/` | Ghi chú chi tiết từng bài (1 file .md / bài) + `00_MUC_LUC_va_MA_TRAN_BANG_CHUNG.md` |
| `02_demo/` | Mã nguồn + dữ liệu + kết quả 5 thí nghiệm (xem `02_demo/README.md`) |
| `03_bao_cao_word/Bao_cao_tong_hop_Posit_AI.docx` | **Báo cáo Word tổng hợp toàn bộ kiến thức** (đọc khi cần hiểu sâu) |
| `03_bao_cao_word/Khung_slide_de_xuat.docx` | **Khung slide đề xuất**: từng slide → bố cục template, nội dung, nguồn, lời thuyết trình; câu hỏi phản biện |
| `03_bao_cao_word/_build/` | Script Node.js (thư viện `docx`) để dựng lại 2 file Word từ số liệu mới nhất |
| `04_slide/Slide_Posit_AI_hieu_nang_cao.pdf` | **Bản PDF của bộ slide** (26 trang 16:9) — bản gốc chỉnh sửa được nằm trên trang deck (link trong chat); cần .pptx thì dùng nút Export của deck |

## Quy ước trích dẫn
- `[NN]` = số đầu tên file trong `papers_download/`; `tr.X` = trang thứ X của file PDF.
- `[S1]` Gustafson & Yonemoto 2017, `[S2]` Posit Standard 2022 — **chưa có trong thư mục**, nên tải thêm để đối chiếu.

## Dựng lại file Word (khi số liệu thí nghiệm thay đổi)
```bash
cd 03_bao_cao_word/_build && npm install docx@9 && node build_report.js && node build_slides.js
```
Sau khi dựng lại, mở báo cáo bằng Word và chọn **Yes** khi được hỏi "update the fields" để mục lục có số trang, rồi lưu lại. Đóng mọi bản đang mở trong Word **trước** khi dựng lại, nếu không bấm Lưu trong Word sẽ ghi đè bản cũ lên bản mới.
