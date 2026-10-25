"""
Thí nghiệm A — "Độ chính xác thon dần" (tapered precision) có khớp phân bố dữ liệu DNN không?

A1. Độ chính xác thập phân theo độ lớn: với mỗi cặp giá trị liền kề (a, b) của một định dạng,
    độ chính xác tệ nhất trong khoảng là  -log10( log10(b/a) / 2 )  (định nghĩa theo
    Gustafson, xem [42] tr.5), đặt tại trung bình nhân sqrt(a·b).
A2. Phân bố log2|giá trị| của TRỌNG SỐ và ACTIVATION (đầu vào các lớp) của LeNet-5 đã huấn luyện.
Hai hình dùng chung trục hoành log2|x| để thấy "vùng vàng" của posit nằm ở đâu so với dữ liệu.
"""
import json
import os

import numpy as np
import torch
import torch.nn.functional as F

from posit_lab.data import load_fashion_mnist
from posit_lab.model import LeNet5
from posit_lab.numformats import posit_table, minifloat_table
from posit_lab.plotstyle import setup, plt, FMT_COLOR, INK2, MUTED, C

HERE = os.path.dirname(os.path.abspath(__file__))
RES, FIG = os.path.join(HERE, "results"), os.path.join(HERE, "figures")
os.makedirs(FIG, exist_ok=True)
setup()


def decimal_accuracy(vals):
    v = np.sort(vals[vals > 0])
    a, b = v[:-1], v[1:]
    return np.log2(np.sqrt(a * b)), -np.log10(np.log10(b / a) / 2)


model = LeNet5()
model.load_state_dict(torch.load(os.path.join(RES, "checkpoints", "lenet5_fp32_seed0.pt")))
model.eval()
W = torch.cat([getattr(model, n).weight.detach().flatten() for n in ["conv1", "conv2", "fc1", "fc2", "fc3"]])
xte, _ = load_fashion_mnist("test")
with torch.no_grad():
    x = xte[:1000]
    acts = [x.flatten()]
    t = F.max_pool2d(F.relu(model.conv1(x)), 2); acts.append(t.flatten())
    t = F.max_pool2d(F.relu(model.conv2(t)), 2).flatten(1); acts.append(t.flatten())
    t = F.relu(model.fc1(t)); acts.append(t.flatten())
    t = F.relu(model.fc2(t)); acts.append(t.flatten())
A = torch.cat(acts)
w_abs = W.abs().numpy(); w_abs = w_abs[w_abs > 0]
a_abs = A.abs().numpy(); a_abs = a_abs[a_abs > 0]
int8_step = float(W.abs().max()) / 127
int8_vals = np.arange(1, 128) * int8_step

curves = {
    "posit⟨8,0⟩": (posit_table(8, 0)[0], FMT_COLOR["posit_es0"], "-"),
    "posit⟨8,1⟩": (posit_table(8, 1)[0], FMT_COLOR["posit_es1"], "-"),
    "posit⟨8,2⟩": (posit_table(8, 2)[0], FMT_COLOR["posit_es2"], "-"),
    "FP8 E4M3": (minifloat_table(4, 3, False), FMT_COLOR["fp"], "-"),
    "INT8 (thang đo theo max|W|)": (int8_vals, FMT_COLOR["int"], "-"),
}

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8.2, 6.4), sharex=True,
                               gridspec_kw={"height_ratios": [1.15, 1]})
for name, (vals, col, ls) in curves.items():
    lx, acc = decimal_accuracy(np.asarray(vals))
    ax1.step(lx, acc, where="mid", color=col, ls=ls, lw=1.8, label=name)
ax1.set_ylabel("Độ chính xác thập phân\n(số chữ số đúng)")
ax1.set_ylim(0, 3.0)
ax1.set_title("A1 · Độ chính xác theo độ lớn: posit 'thon dần' quanh 1, FP8 'phẳng', INT8 dồn về một đầu",
              loc="left", fontsize=10.5, color="#0b0b0b")
ax1.legend(loc="upper left", fontsize=8.5, ncol=2)

bins = np.arange(-26, 8, 0.5)
ax2.hist(np.log2(w_abs), bins=bins, color=C["blue"], alpha=0.85, label=f"Trọng số ({len(w_abs):,} giá trị)",
         density=True, rwidth=0.9)
ax2.hist(np.log2(a_abs), bins=bins, histtype="step", color=C["orange"], lw=1.8, density=True,
         label=f"Activation đầu vào các lớp (1000 ảnh)")
ax2.set_xlabel("log₂|x|   (0 ↔ |x| = 1;  −4 ↔ 0.0625;  −8 ↔ 0.0039)")
ax2.set_ylabel("Mật độ")
ax2.set_title("A2 · Phân bố giá trị thật của LeNet-5 (Fashion-MNIST, mô hình seed 0)", loc="left",
              fontsize=10.5, color="#0b0b0b")
ax2.legend(loc="upper left", fontsize=8.5)
ax2.set_xlim(-26, 8)
for ax in (ax1, ax2):
    ax.axvline(0, color=MUTED, lw=0.8, ls=":")
fig.tight_layout()
fig.savefig(os.path.join(FIG, "A_tapered_precision.png"))

# Thống kê định lượng
lw = np.log2(w_abs)
stats = {
    "num_weights": int(len(w_abs)),
    "weight_abs_max": float(W.abs().max()), "weight_abs_median": float(np.median(w_abs)),
    "weight_log2_median": float(np.median(lw)),
    "weight_frac_in_[2^-6,2^0)": float(np.mean((lw >= -6) & (lw < 0))),
    "weight_frac_below_2^-6(=posit8_0 minpos)": float(np.mean(lw < -6)),
    "weight_frac_below_2^-8": float(np.mean(lw < -8)),
    "act_nonzero_frac": float((A != 0).float().mean()),
    "act_abs_median_nonzero": float(np.median(a_abs)), "act_abs_max": float(A.abs().max()),
    "int8_step": int8_step,
    "weight_frac_below_half_int8_step(-> round to 0)": float(np.mean(w_abs < int8_step / 2)),
}
# độ chính xác thập phân đỉnh của từng định dạng
for name, (vals, _, _) in curves.items():
    lx, acc = decimal_accuracy(np.asarray(vals))
    stats[f"peak_decimal_acc {name}"] = float(acc.max())
    stats[f"log2_range_with_acc>=1.5 {name}"] = [float(lx[acc >= 1.5].min()), float(lx[acc >= 1.5].max())] \
        if np.any(acc >= 1.5) else None
with open(os.path.join(RES, "03_expA_tapered.json"), "w") as f:
    json.dump(stats, f, indent=1, ensure_ascii=False)
for k, v in stats.items():
    print(f"{k}: {v}")
print("-> figures/A_tapered_precision.png, results/03_expA_tapered.json")
