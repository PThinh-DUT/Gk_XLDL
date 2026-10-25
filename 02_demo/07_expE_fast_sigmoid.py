"""
Thí nghiệm E — Kiểm chứng "sigmoid nhanh" của posit es = 0 ([05] công thức (3), [21], [40]).

Với posit⟨n,0⟩ có mẫu bit X (số nguyên không dấu n bit):
    sigmoid_fast(X) = (X XOR 2^(n-1)) >> 2        (đảo bit dấu rồi dịch phải logic 2 bit)
Kết quả là MẪU BIT của một posit⟨n,0⟩ xấp xỉ 1/(1+e^-x). Chỉ cần 2 phép toán trên số nguyên.
Từ đó tanh_fast(x) = 2·sigmoid_fast(2x) − 1, kèm hiệu chỉnh của [40]: nếu |R| > θ=0.76 thì
cộng/trừ δ=0.068 (giới hạn ±1). [40] báo cáo trên [0, 8] với posit(16,0): sai số tuyệt đối
lớn nhất 0.098 → 0.0379 sau hiệu chỉnh; trung bình 0.056 → 0.0086.
"""
import json
import os

import numpy as np
import torch

from posit_lab.numformats import decode_posit, quantize_posit
from posit_lab.plotstyle import setup, plt, C, INK2, MUTED

HERE = os.path.dirname(os.path.abspath(__file__))
RES, FIG = os.path.join(HERE, "results"), os.path.join(HERE, "figures")
setup()


def encode_bits(v, n, es=0):
    """Giá trị (đã là posit) -> mẫu bit, bằng tra bảng toàn bộ mẫu bit."""
    table = {decode_posit(p, n, es): p for p in range(1 << n) if p != 1 << (n - 1)}
    return np.array([table[float(x)] for x in v])


def fast_sigmoid_bits(bits, n):
    return ((bits ^ (1 << (n - 1))) & ((1 << n) - 1)) >> 2


out = {}
fig, axes = plt.subplots(1, 2, figsize=(9.6, 3.6))
for n, ax in [(8, axes[0]), (16, axes[1])]:
    pats = np.array([p for p in range(1 << n) if p != 1 << (n - 1)])
    x = np.array([decode_posit(int(p), n, 0) for p in pats])
    y = np.array([decode_posit(int(b), n, 0) for b in fast_sigmoid_bits(pats, n)])
    true = 1 / (1 + np.exp(-x))
    err = np.abs(y - true)
    mask8 = np.abs(x) <= 8
    out[f"posit<{n},0> sigmoid"] = {"num_patterns": int(len(pats)),
                                    "max_abs_err_all": float(err.max()),
                                    "max_abs_err_|x|<=8": float(err[mask8].max()),
                                    "mean_abs_err_|x|<=8": float(err[mask8].mean())}
    o = np.argsort(x)
    sel = (x[o] >= -8) & (x[o] <= 8)
    ax.plot(x[o][sel], true[o][sel], color=C["blue"], lw=2, label="σ(x) = 1/(1+e⁻ˣ) chính xác")
    ax.plot(x[o][sel], y[o][sel], color=C["orange"], lw=1.4, ls="--", label="(X ⊕ 2ⁿ⁻¹) >> 2")
    ax.set_title(f"posit⟨{n},0⟩: sai số lớn nhất {err[mask8].max():.4f} trên [−8, 8]", loc="left",
                 fontsize=10)
    ax.set_xlabel("x")
    ax.legend(fontsize=8, loc="upper left")
axes[0].set_ylabel("sigmoid(x)")
fig.tight_layout()
fig.savefig(os.path.join(FIG, "E_fast_sigmoid.png"))

# ---- tanh theo [40]: posit(16,0), x trong [0, 8]
n = 16
pats = np.array([p for p in range(1 << n) if p != 1 << (n - 1)])
x_all = np.array([decode_posit(int(p), n, 0) for p in pats])
x = x_all[(x_all >= 0) & (x_all <= 8)]
two_x = quantize_posit(torch.from_numpy(2 * x), 16, 0).numpy()
sig = np.array([decode_posit(int(b), n, 0) for b in fast_sigmoid_bits(encode_bits(two_x, n), n)])
R = quantize_posit(torch.from_numpy(2 * sig - 1), 16, 0).numpy()
Rc = np.where(R > 0.76, np.minimum(R + 0.068, 1.0), np.where(R < -0.76, np.maximum(R - 0.068, -1.0), R))
te = np.abs(R - np.tanh(x)); tc = np.abs(Rc - np.tanh(x))
out["posit<16,0> tanh [40] on [0,8]"] = {
    "max_abs_err": float(te.max()), "mean_abs_err": float(te.mean()),
    "max_abs_err_corrected": float(tc.max()), "mean_abs_err_corrected": float(tc.mean()),
    "paper_reported": {"max": 0.098, "mean": 0.056, "max_corrected": 0.0379, "mean_corrected": 0.0086}}
with open(os.path.join(RES, "07_expE_fast_sigmoid.json"), "w") as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
for k, v in out.items():
    print(k, v)
print("-> figures/E_fast_sigmoid.png")
