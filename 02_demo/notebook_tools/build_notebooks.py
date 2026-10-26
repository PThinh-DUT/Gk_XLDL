"""Build readable notebooks from the original sources; never execute experiments."""
import ast
import base64
import html
import json
from pathlib import Path

from reporting import STYLE, table_html, tables

ROOT = Path(__file__).resolve().parents[1]
SPECS = {
 '01': (['00_validation.json'], [], 'Kiểm tra cách giải mã và làm tròn trước khi tin vào số liệu. SoftPosit là tùy chọn; thiếu nó thì phần đối chiếu Posit sẽ bị bỏ qua.'),
 '02': (['01_baselines.json'], [], 'Huấn luyện ba mô hình FP32 làm mốc. Dữ liệu nằm trong data/. Chạy lại sẽ huấn luyện lại và thay mô hình chuẩn; có bản sao trước chạy trong before_run/.'),
 '03': (['03_expA_tapered.json'], ['A_*.png'], 'Cần checkpoint seed 0 của bước 02. Quan sát vùng chính xác của định dạng có trùng vùng trọng số/activation hay không.'),
 '04': (['04_expB_weight_ptq.json'], ['B_*.png'], 'Cần ba checkpoint từ bước 02. Đây là giảm bit trọng số sau huấn luyện. acc_mean là phần trăm trung bình; acc_std là độ lệch chuẩn giữa các seed.'),
 '05': (['05_expC_quire.json'], ['C*.png'], 'Cần ba checkpoint từ bước 02. So sánh làm tròn cuối với làm tròn từng bước. Quire được mô phỏng bằng FP64; thời gian chạy phần mềm không phải tốc độ phần cứng Posit.'),
 '06': (['06_expD_training.json'], ['D_*.png'], 'Huấn luyện 10 epoch mỗi cấu hình; có thể chạy lâu. Mặc định seed 0. Script bỏ qua cấu hình/seed đã có trong JSON; muốn học seed mới, sửa SCRIPT_ARGS. Nhân–cộng vẫn dùng FP32: kết quả phản ánh xu hướng mô phỏng.'),
 '07': (['07_expE_fast_sigmoid.json'], ['E_*.png'], 'So sánh sigmoid/tanh xấp xỉ với hàm chuẩn. max_abs_err là sai số tuyệt đối lớn nhất, không phải phần trăm accuracy. Không đo tăng tốc phần cứng.'),
 '08': (['04_expB_weight_ptq.json', '05_expC_quire.json', '06_expD_training.json'], ['B_*.png', 'C*.png', 'D_*.png'], 'Vẽ lại biểu đồ từ kết quả B/C/D, không huấn luyện. Chạy notebook này sau 04/05/06 để cập nhật hình theo số liệu mới.'),
 '09': (['09_decode_examples.json'], [], 'Đọc sign/regime/exponent/fraction và giá trị giải mã. Ví dụ dùng cho phần lý thuyết và báo cáo.'),
 '10': ([], ['slide_*.png'], 'Tạo hai hình giải thích cấu trúc bit và mật độ số cho slide.'),
 '11': (['06_expD_training.json'], ['D_*.png'], 'Chỉ dùng khi thực sự cần gộp hai file kết quả D. Nếu trùng config/seed, bản part2 thắng. Sau đó chạy 08 để cập nhật đồ thị.'),
}


def cell(kind, source, outputs=None):
    result = {'cell_type': kind, 'metadata': {}, 'source': source.splitlines(keepends=True)}
    if kind == 'code':
        result.update(execution_count=None, outputs=outputs or [])
    return result


def chunks(source):
    lines = source.splitlines(keepends=True)
    nodes = ast.parse(source).body
    boundaries = [0]
    for node in nodes:
        start = min([node.lineno] + [d.lineno for d in getattr(node, "decorator_list", [])]) - 1
        if start - boundaries[-1] >= 45:
            boundaries.append(start)
    boundaries.append(len(lines))
    return [''.join(lines[a:b]) for a, b in zip(boundaries, boundaries[1:]) if a < b]


def preview(names, patterns):
    parts = [STYLE, '<h2>Kết quả đã lưu trong repository</h2><p>Ảnh chụp dữ liệu khi tạo notebook; chưa chạy lại thí nghiệm. Run All để đọc lại các file hiện tại và xuất báo cáo.</p>']
    for name in names:
        path = ROOT / 'results' / name
        if path.exists():
            parts.append(f'<h3>{html.escape(name)}</h3>')
            for label, rows in tables(json.loads(path.read_text()), path.stem):
                if rows:
                    parts.append(f'<details><summary>{html.escape(label)} ({len(rows)} dòng)</summary>{table_html(rows)}</details>')
    for path in sorted({p for pattern in patterns for p in (ROOT / 'figures').glob(pattern)}):
        parts.append(f'<p>{html.escape(path.name)}</p><img alt="{html.escape(path.stem)}" src="data:image/png;base64,{base64.b64encode(path.read_bytes()).decode()}">')
    return ''.join(parts)


def build(path):
    relative = path.relative_to(ROOT).as_posix()
    library = path.parent.name == 'posit_lab'
    source = path.read_text(encoding='utf-8')
    description = ast.get_docstring(ast.parse(source)) or 'Thư viện dùng chung cho các thí nghiệm.'
    names, patterns, note = ([], [], 'Đây là thư viện hỗ trợ, không phải thí nghiệm độc lập. Các notebook 01–11 tự nhập thư viện này. Bật RUN_EXPERIMENT để nạp các định nghĩa khi muốn tìm hiểu.') if library else SPECS[path.name[:2]]
    setup = f'''from pathlib import Path
import os
import sys

# Tìm 02_demo dù kernel bắt đầu ở thư mục workspace hoặc thư mục notebook.
candidates = [Path.cwd(), *Path.cwd().parents]
DEMO_ROOT = next((base / suffix for base in candidates
                  for suffix in ("", "02_demo", "Gk_XLDL/02_demo")
                  if (base / suffix / "posit_lab/numformats.py").is_file()), None)
if DEMO_ROOT is None:
    raise FileNotFoundError("Mở notebook trong workspace chứa Gk_XLDL/02_demo.")
DEMO_ROOT = DEMO_ROOT.resolve()
os.chdir(DEMO_ROOT)
if str(DEMO_ROOT) not in sys.path:
    sys.path.insert(0, str(DEMO_ROOT))
from notebook_tools.reporting import NotebookRun

# False: xem số liệu sẵn có. True: chạy code thí nghiệm bên dưới.
RUN_EXPERIMENT = False
SCRIPT_ARGS = {["0"] if path.name.startswith("06") else []!r}
__file__ = str(DEMO_ROOT / {relative!r})
__package__ = {"posit_lab" if library else None!r}
session = NotebookRun(DEMO_ROOT, {relative!r}, RUN_EXPERIMENT, SCRIPT_ARGS)
print("Thư mục lưu lần này:", session.out)

# Cell magic giữ code thẳng hàng; vẫn áp dụng chế độ chạy và lưu nhật ký.
from IPython.core.magic import register_cell_magic
import __future__

@register_cell_magic
def experiment(line, cell):
    if not RUN_EXPERIMENT:
        print("Đã bỏ qua tính toán; đặt RUN_EXPERIMENT = True để chạy ô này.")
        return
    with session.execute():
        code = compile(cell, str(session.source), "exec",
                       flags=__future__.annotations.compiler_flag)
        exec(code, get_ipython().user_ns)
'''
    cells = [cell('markdown', f'# {path.stem}\n\n{description}\n\n## Mục tiêu và cách đọc\n\n{note}\n\n## Cách sử dụng\n\n1. Chọn kernel Python có `ipykernel`, `numpy`, `torch`, `matplotlib`.\n2. Giữ `RUN_EXPERIMENT = False` và chọn **Run All** để xem dữ liệu sẵn có.\n3. Đổi thành `True` nếu muốn thực hiện lại; chạy tuần tự các ô từ đầu.\n4. **Ctrl+S / Cmd+S** lưu toàn bộ output vào notebook. Báo cáo HTML và CSV được xuất tự động ở ô cuối.\n\n**Lưu ý:** các hình B/C/D là file đã lưu; sau khi đổi kết quả, chạy notebook 08 để vẽ lại trước khi dùng hình trong bài. Thời điểm xuất báo cáo không phải thời điểm thực hiện thí nghiệm gốc.\n'), cell('markdown', '## 1. Thiết lập và chọn chế độ\n\nCài môi trường một lần theo `HUONG_DAN_NOTEBOOK.md`. Mỗi lần chạy tạo thư mục riêng trong `results/notebook_runs/`. Khi chạy lại thí nghiệm, các kết quả chuẩn và checkpoint hiện có được sao lưu trước.'), cell('code', setup)]
    for i, block in enumerate(chunks(source), 1):
        tree = ast.parse(block)
        functions = [node.name for node in tree.body if isinstance(node, (ast.FunctionDef, ast.ClassDef))]
        label = ', '.join(functions) if functions else 'Chuẩn bị / tính toán / lưu dữ liệu theo thứ tự script'
        cells.append(cell('markdown', f'## {i + 1}. {label}\n\nMã chuyển nguyên từ `{relative}`. Ô chỉ thực thi khi `RUN_EXPERIMENT = True`; giữ thứ tự để các biến và hàm được khởi tạo đúng.'))
        code = '%%experiment\n' + block
        cells.append(cell('code', code))
    cells.append(cell('markdown', '## Kết quả, bảng số liệu và hình\n\nÔ cuối đọc đầy đủ các trường JSON, xuất CSV UTF-8 cho Excel, lưu JSON gốc, nhúng hình vào HTML để mở độc lập. Các bảng dài có thanh cuộn. Khi viết bài, ghi rõ cấu hình, seed, tập dữ liệu và giới hạn mô phỏng.'))
    report_code = f'session.report({names!r}, {patterns!r})'
    cells.append(cell('code', report_code, [{'output_type': 'display_data', 'metadata': {}, 'data': {'text/html': preview(names, patterns), 'text/plain': 'Kết quả đã lưu; chưa chạy lại thí nghiệm.'}}] if not library else []))
    notebook = {'cells': cells, 'metadata': {'kernelspec': {'display_name': 'Python 3 (ipykernel)', 'language': 'python', 'name': 'python3'}, 'language_info': {'name': 'python', 'version': '3.11'}, 'source_script': relative}, 'nbformat': 4, 'nbformat_minor': 5}
    for i, c in enumerate(cells):
        c['id'] = f'cell-{i:03d}'
    path.with_suffix('.ipynb').write_text(json.dumps(notebook, ensure_ascii=False, indent=1), encoding='utf-8')


if __name__ == '__main__':
    paths = sorted(ROOT.glob('[0-9][0-9]_*.py')) + sorted((ROOT / 'posit_lab').glob('*.py'))
    for path in paths:
        build(path)
    print(f'Đã tạo {len(paths)} notebook.')
