"""Display and archive experiment artifacts without changing numerical algorithms."""
import base64
import contextlib
import csv
import hashlib
import html
import io
import json
import platform
import shutil
import sys
import traceback
from datetime import datetime, timezone
from pathlib import Path


class Tee:
    def __init__(self, terminal, logfile):
        self.terminal, self.logfile = terminal, logfile

    def write(self, text):
        self.terminal.write(text)
        self.logfile.write(text)
        self.logfile.flush()
        return len(text)

    def flush(self):
        self.terminal.flush()
        self.logfile.flush()


def tables(value, prefix='results'):
    """Retain every scalar leaf, including nested histories and per-seed data."""
    if isinstance(value, list):
        if value and all(isinstance(row, dict) for row in value):
            rows = [{k: v for k, v in row.items() if not isinstance(v, (dict, list))} for row in value]
            if any(rows):
                yield prefix, rows
            for i, row in enumerate(value):
                for key, item in row.items():
                    if isinstance(item, (dict, list)):
                        yield from tables(item, f'{prefix}.{i}.{key}')
        else:
            yield prefix, [{'index': i, 'value': v if not isinstance(v, (list, dict)) else json.dumps(v, ensure_ascii=False)} for i, v in enumerate(value)]
    elif isinstance(value, dict):
        scalar = [{'metric': k, 'value': v} for k, v in value.items() if not isinstance(v, (dict, list))]
        if scalar:
            yield prefix, scalar
        for key, item in value.items():
            if isinstance(item, (dict, list)):
                yield from tables(item, f'{prefix}.{key}')
    else:
        yield prefix, [{'value': value}]


def table_html(rows):
    columns = list(dict.fromkeys(k for row in rows for k in row))
    esc = lambda value: html.escape(str(value))
    return '<div class="scroll"><table><thead><tr>' + ''.join(f'<th>{esc(k)}</th>' for k in columns) + '</tr></thead><tbody>' + ''.join('<tr>' + ''.join(f'<td>{esc(row.get(k, ""))}</td>' for k in columns) + '</tr>' for row in rows) + '</tbody></table></div>'


STYLE = '''<style>body{font:15px/1.6 system-ui;color:#172b4d;max-width:1200px;margin:40px auto;padding:0 24px}h1,h2,h3{color:#174a75}table{border-collapse:collapse;font-size:13px;width:100%}th{background:#174a75;color:white;text-align:left}td,th{padding:8px 12px;border:1px solid #dde5ed}tr:nth-child(even){background:#f1f6fa}.scroll{overflow:auto;max-height:520px;margin:16px 0}img{max-width:100%;height:auto}summary{cursor:pointer;font-weight:600;padding:10px}details{margin:12px 0}pre{white-space:pre-wrap}</style>'''


class NotebookRun:
    def __init__(self, root, source, recompute=False, args=()):
        self.root = Path(root)
        self.source = self.root / source
        self.recompute = recompute
        self.args = list(args)
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S_%fZ')
        self.out = self.root / 'results' / 'notebook_runs' / self.source.stem / stamp
        self.out.mkdir(parents=True, exist_ok=True)
        self.started = datetime.now(timezone.utc).isoformat()
        # Preserve originals before any experiment overwrites canonical artifacts.
        if recompute:
            for folder in ('results', 'figures'):
                for path in (self.root / folder).glob('*'):
                    if path.is_file():
                        dest = self.out / 'before_run' / folder / path.name
                        dest.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(path, dest)
            checkpoints = self.root / 'results' / 'checkpoints'
            if checkpoints.exists():
                shutil.copytree(checkpoints, self.out / 'before_run/results/checkpoints')
        self.metadata('started')

    def metadata(self, status):
        data = {'source': str(self.source.relative_to(self.root)), 'mode': 'recompute' if self.recompute else 'saved_results', 'status': status, 'started_utc': self.started, 'updated_utc': datetime.now(timezone.utc).isoformat(), 'python': sys.version, 'platform': platform.platform(), 'argv': self.args, 'source_sha256': hashlib.sha256(self.source.read_bytes()).hexdigest()}
        (self.out / 'manifest.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')

    @contextlib.contextmanager
    def execute(self):
        previous = sys.argv[:]
        sys.argv = [str(self.source), *self.args]
        try:
            with (self.out / 'execution.log').open('a', encoding='utf-8') as log:
                with contextlib.redirect_stdout(Tee(sys.stdout, log)), contextlib.redirect_stderr(Tee(sys.stderr, log)):
                    try:
                        yield
                    except BaseException:
                        traceback.print_exc()
                        self.metadata('failed')
                        raise
        finally:
            sys.argv = previous

    def report(self, json_names, image_patterns):
        from IPython.display import HTML, display
        parts = [STYLE, f'<h1>{html.escape(self.source.stem)}</h1>', f'<p>Chế độ: {"chạy lại thí nghiệm" if self.recompute else "đọc kết quả đã lưu; không chạy lại thí nghiệm"}. Thời điểm xuất UTC: {self.started}.</p>']
        missing = []
        inventory = []
        for name in json_names:
            src = self.root / 'results' / name
            if not src.exists():
                missing.append(name)
                continue
            raw = src.read_bytes()
            shutil.copy2(src, self.out / name)
            inventory.append({'file': name, 'sha256': hashlib.sha256(raw).hexdigest()})
            value = json.loads(raw)
            parts.append(f'<h2>{html.escape(name)}</h2>')
            for i, (label, rows) in enumerate(tables(value, Path(name).stem)):
                if not rows:
                    continue
                csv_path = self.out / f'{Path(name).stem}_{i:03}.csv'
                columns = list(dict.fromkeys(k for row in rows for k in row))
                with csv_path.open('w', newline='', encoding='utf-8-sig') as f:
                    writer = csv.DictWriter(f, fieldnames=columns)
                    writer.writeheader()
                    writer.writerows(rows)
                parts.append(f'<details open><summary>{html.escape(label)} — {len(rows)} dòng</summary>{table_html(rows)}</details>')
        paths = sorted({p for pattern in image_patterns for p in (self.root / 'figures').glob(pattern)})
        for src in paths:
            shutil.copy2(src, self.out / src.name)
            encoded = base64.b64encode(src.read_bytes()).decode()
            parts.append(f'<h2>{html.escape(src.name)}</h2><img alt="{html.escape(src.stem)}" src="data:image/png;base64,{encoded}">')
        if missing:
            parts.append('<p>Thiếu kết quả: ' + html.escape(', '.join(missing)) + '. Chạy bước tương ứng trước.</p>')
        body = ''.join(parts)
        (self.out / 'report.html').write_text('<!doctype html><meta charset="utf-8"><title>Kết quả Posit AI</title>' + body, encoding='utf-8')
        (self.out / 'artifacts.json').write_text(json.dumps(inventory, indent=2), encoding='utf-8')
        self.metadata('report_exported_with_missing_inputs' if missing else 'report_exported')
        display(HTML(body))
        print('Đã lưu JSON, CSV, hình, HTML và manifest tại:', self.out)
        print('Nhấn Ctrl+S / Cmd+S để lưu output hiển thị vào chính file .ipynb.')
