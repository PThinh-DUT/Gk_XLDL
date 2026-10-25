"""Hình minh họa cho slide: (1) cấu trúc bit posit + ví dụ giải mã, (2) trục số mật độ giá trị."""
import os

import numpy as np
from matplotlib.patches import FancyBboxPatch

from posit_lab.numformats import posit_table, minifloat_table
from posit_lab.plotstyle import setup, plt, C, INK2, MUTED

HERE = os.path.dirname(os.path.abspath(__file__))
FIG = os.path.join(HERE, "figures")
setup()

# ---------------- (1) Cấu trúc bit: posit<8,1> = 0 10 1 0101 -> 2.625
fig, ax = plt.subplots(figsize=(9, 3.2))
ax.set_xlim(0, 8); ax.set_ylim(-1.9, 1.6); ax.axis("off")
bits = "01010101"
fields = [(0, 1, "Sign", "dấu", C["red"]), (1, 3, "Regime", "chế độ (độ dài thay đổi)", C["blue"]),
          (3, 4, "Exponent", "mũ (≤ es bit)", C["aqua"]), (4, 8, "Fraction", "phần lẻ", C["orange"])]
for i, b in enumerate(bits):
    col = next(f[4] for f in fields if f[0] <= i < f[1])
    ax.add_patch(FancyBboxPatch((i + 0.06, 0), 0.88, 0.9, boxstyle="round,pad=0,rounding_size=0.08",
                                fc=col, ec="white", lw=2, alpha=0.9))
    ax.text(i + 0.5, 0.45, b, ha="center", va="center", fontsize=20, color="white", fontweight="bold")
for s, e, name, vn, col in fields:
    ax.annotate("", xy=(s + 0.08, 1.1), xytext=(e - 0.08, 1.1), arrowprops=dict(arrowstyle="-", color=col, lw=2))
    ax.text((s + e) / 2, 1.3, f"{name}", ha="center", fontsize=11, color=col, fontweight="bold")
    ax.text((s + e) / 2, -0.3, vn, ha="center", fontsize=8.5, color=INK2)
ax.text(0.5, -0.75, "s = 0", ha="center", fontsize=10.5, color=INK2)
ax.text(2, -0.75, "'10' → k = 0", ha="center", fontsize=10.5, color=INK2)
ax.text(3.5, -0.75, "e = 1", ha="center", fontsize=10.5, color=INK2)
ax.text(6, -0.75, "0101 → f = 5/16", ha="center", fontsize=10.5, color=INK2)
ax.text(4, -1.5, "x = (−1)⁰ × useed⁰ × 2¹ × (1 + 5/16) = 2.625      (posit⟨8,1⟩, useed = 2^(2^es) = 4)",
        ha="center", fontsize=11.5, color="#0b0b0b")
fig.savefig(os.path.join(FIG, "slide_posit_bit_layout.png"))

# ---------------- (2) Trục số log: vị trí 127 giá trị dương của mỗi định dạng 8-bit
fig, ax = plt.subplots(figsize=(9.5, 3.0))
rows = [("posit⟨8,1⟩", posit_table(8, 1)[0], C["orange"]),
        ("FP8 E4M3", minifloat_table(4, 3, False), C["yellow"]),
        ("INT8 (max = 4)", np.arange(1, 128) * 4 / 127, C["magenta"])]
for j, (name, vals, col) in enumerate(rows):
    y = 2 - j
    v = vals[vals > 0]
    ax.vlines(np.log2(v), y - 0.32, y + 0.32, color=col, lw=1.0)
    near = np.sum((v >= 0.5) & (v < 2))
    ax.text(-12.4, y, f"{name}\n{near} giá trị trong [0.5, 2)", ha="right", va="center", fontsize=9, color=INK2)
ax.axvline(0, color=MUTED, ls=":", lw=1)
ax.set_xlim(-12, 12); ax.set_ylim(-0.6, 2.6); ax.set_yticks([])
ax.set_xticks(range(-12, 13, 2))
ax.set_xlabel("log₂ x   (0 ↔ x = 1)")
ax.set_title("Trên thang log: posit dày quanh 1 rồi thưa dần (thon dần) · FP8 đều mỗi bậc · INT8 dồn về đầu lớn",
             loc="left", fontsize=10)
ax.spines["left"].set_visible(False)
fig.savefig(os.path.join(FIG, "slide_number_line.png"))
print("-> figures/slide_posit_bit_layout.png, figures/slide_number_line.png")
