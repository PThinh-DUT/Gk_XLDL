"""
Thí nghiệm B — Lượng tử hóa TRỌNG SỐ sau huấn luyện (post-training, không huấn luyện lại).

Câu hỏi: cùng số bit, định dạng nào giữ độ chính xác LeNet-5/Fashion-MNIST tốt nhất?
Đối chiếu với [01] (posit vs fixed, chỉ lưu trọng số), [04]/[07] (quét 5-8 bit, có/không
co giãn), [18] (Posit8 es 0..3 trên ImageNet).

B1: 8 bit và 16 bit — FP16, BF16, Posit16, INT8, FP8 E4M3/E5M2, Posit8 es=0/1/2,
    mỗi định dạng có dải cố định chạy 2 chế độ: không co giãn / co giãn lũy thừa 2 theo lớp.
B2: quét 4..8 bit — Posit(n, es=0/1/2), FP(n) với số bit mũ e=2/3/4, INT(n).
Mỗi cấu hình đánh giá trên 3 mô hình gốc (seed 0,1,2), báo cáo trung bình ± độ lệch chuẩn.
"""
import json
import os
import time

import numpy as np
import torch

from posit_lab.data import load_fashion_mnist
from posit_lab.model import LeNet5, evaluate
from posit_lab.quant import quantize_model_weights

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, "results")
torch.set_num_threads(4)

xte, yte = load_fashion_mnist("test")
models = []
for seed in [0, 1, 2]:
    m = LeNet5()
    m.load_state_dict(torch.load(os.path.join(RES, "checkpoints", f"lenet5_fp32_seed{seed}.pt")))
    m.eval()
    models.append(m)


def run(fmt, scale):
    accs, errs, infos = [], [], []
    for m in models:
        mq, info, rel = quantize_model_weights(m, fmt, scale)
        accs.append(evaluate(mq, xte, yte))
        errs.append(float(np.mean(list(rel.values()))))
        infos.append(info)
    return {"format": fmt, "scale": scale, "acc_mean": float(np.mean(accs)),
            "acc_std": float(np.std(accs)), "accs": accs,
            "rel_weight_err_mean": float(np.mean(errs)), "scale_info_seed0": infos[0]}


t0 = time.time()
rows = []
base = [evaluate(m, xte, yte) for m in models]
rows.append({"format": "fp32", "scale": "none", "acc_mean": float(np.mean(base)),
             "acc_std": float(np.std(base)), "accs": base, "rel_weight_err_mean": 0.0})
print(f"FP32 baseline: {np.mean(base):.2f} ± {np.std(base):.2f}", flush=True)

# ---- B1
B1 = [("fp16", ["none"]), ("bf16", ["none"]), ("posit16_1", ["none"]), ("posit16_2", ["none"]),
      ("int8", ["max", "mse"]), ("fp8e4m3", ["none", "pow2"]), ("fp8e5m2", ["none", "pow2"]),
      ("posit8_0", ["none", "pow2"]), ("posit8_1", ["none", "pow2"]), ("posit8_2", ["none", "pow2"])]
for fmt, scales in B1:
    for sc in scales:
        r = run(fmt, sc)
        rows.append(r)
        print(f"[B1] {fmt:<10} scale={sc:<5} acc={r['acc_mean']:.2f} ± {r['acc_std']:.2f}  "
              f"rel_err={r['rel_weight_err_mean']:.4f}", flush=True)

# ---- B2
sweep = []
for n in [4, 5, 6, 7, 8]:
    cands = [(f"posit{n}_{es}", sc) for es in [0, 1, 2] for sc in ["none", "pow2"]]
    cands += [(f"fp{n}e{e}m{n - 1 - e}", sc) for e in [2, 3, 4] if n - 1 - e >= 0
              for sc in ["none", "pow2"]]
    cands += [(f"int{n}", sc) for sc in ["max", "mse"]]
    for fmt, sc in cands:
        r = run(fmt, sc)
        r["bits"] = n
        sweep.append(r)
        print(f"[B2] n={n} {fmt:<10} scale={sc:<5} acc={r['acc_mean']:.2f} ± {r['acc_std']:.2f}",
              flush=True)

with open(os.path.join(RES, "04_expB_weight_ptq.json"), "w") as f:
    json.dump({"B1": rows, "B2_sweep": sweep, "runtime_s": time.time() - t0}, f, indent=1)
print(f"Xong trong {time.time() - t0:.0f}s -> results/04_expB_weight_ptq.json")
