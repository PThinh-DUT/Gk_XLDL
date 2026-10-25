"""Kiểu đồ thị dùng chung (bảng màu phân loại đã kiểm tra an toàn cho người mù màu)."""
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

# Thứ tự cố định — màu đi theo đối tượng, không theo thứ hạng
C = {"blue": "#2a78d6", "orange": "#eb6834", "aqua": "#1baf7a", "yellow": "#eda100",
     "magenta": "#e87ba4", "green": "#008300", "violet": "#6250d6", "red": "#e34948"}
INK, INK2, MUTED, GRID, SURFACE = "#0b0b0b", "#52514e", "#8a8984", "#e4e3df", "#fcfcfb"

# Màu cố định cho từng định dạng (dùng nhất quán ở mọi hình)
FMT_COLOR = {"posit_es0": C["blue"], "posit_es1": C["orange"], "posit_es2": C["aqua"],
             "fp": C["yellow"], "int": C["magenta"], "fp32": INK2}
FMT_MARK = {"posit_es0": "o", "posit_es1": "s", "posit_es2": "^", "fp": "D", "int": "v"}


def setup():
    plt.rcParams.update({
        "font.family": "DejaVu Sans", "font.size": 10, "axes.titlesize": 11,
        "axes.labelcolor": INK2, "axes.edgecolor": MUTED, "axes.linewidth": 0.8,
        "xtick.color": INK2, "ytick.color": INK2, "axes.grid": True,
        "grid.color": GRID, "grid.linewidth": 0.6, "axes.axisbelow": True,
        "axes.spines.top": False, "axes.spines.right": False,
        "lines.linewidth": 2.0, "lines.markersize": 6, "legend.frameon": False,
        "figure.facecolor": "white", "axes.facecolor": "white", "savefig.dpi": 200,
        "savefig.bbox": "tight",
    })
