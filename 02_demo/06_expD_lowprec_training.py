"""
Thí nghiệm D — Mô phỏng HUẤN LUYỆN LeNet-5/Fashion-MNIST hoàn toàn bằng số độ chính xác thấp.

Mục tiêu: tự kiểm chứng xu hướng mà [11] PositNN (Bảng 2–5) và [05], [06] báo cáo:
  - posit 16-bit huấn luyện được như FP32;
  - posit(8,0) "thuần" thất bại (bị kẹt quanh 10% = đoán ngẫu nhiên);
  - posit 8-bit + độ chính xác hỗn hợp cho optimizer/loss (posit(8,2)*, cấu hình O12L10
    của [11]) gần như bằng FP32.

Cách mô phỏng (fake quantization — như QPyTorch [40] và mô phỏng phần mềm của [06], [11]):
  - Trọng số dùng để tính (W), activation (A) sau mỗi lớp, gradient của activation và của
    trọng số (G) đều được làm tròn về định dạng chỉ định (RNE, bão hòa — theo Posit Standard).
  - Gradient của logits ("loss" stage) làm tròn theo định dạng L.
  - Optimizer: SGD momentum 0.9; bộ nhớ momentum và TRỌNG SỐ CHÍNH (master) lưu ở định dạng O
    — sau mỗi bước cập nhật đều làm tròn về O.
  - Phép nhân–cộng trong conv/linear tính bằng FP32 (tương đương có quire/accumulator rộng).
  - Không dùng loss scaling, không warm-up, không co giãn theo lớp ("thuần").
Khác biệt với [11]: [11] dùng thư viện posit thật ở mức bit (Universal) và quire cho mọi
tích vô hướng; ở đây là mô phỏng làm tròn trên PyTorch → so sánh XU HƯỚNG, không so từng số.
"""
import json
import math
import os
import sys
import time

import torch
import torch.nn.functional as F

from posit_lab.data import load_fashion_mnist
from posit_lab.model import LeNet5
from posit_lab.numformats import make_quantizer

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, "results")
torch.set_num_threads(int(os.environ.get('D_THREADS', 3)))

CONFIGS = {
    # tên: (W/A tính toán, G gradient, L gradient của loss, O master weight + momentum)
    "FP32": ("fp32", "fp32", "fp32", "fp32"),
    "FP16 thuần": ("fp16", "fp16", "fp16", "fp16"),
    "Posit(16,1) thuần": ("posit16_1", "posit16_1", "posit16_1", "posit16_1"),
    "Posit(8,0) thuần": ("posit8_0", "posit8_0", "posit8_0", "posit8_0"),
    "Posit(8,2) thuần": ("posit8_2", "posit8_2", "posit8_2", "posit8_2"),
    "Posit(8,2)* hỗn hợp (O12L10)": ("posit8_2", "posit8_2", "posit10_2", "posit12_2"),
}
EPOCHS, BS, LR, MOM = 10, 128, 0.05, 0.9


class Q(torch.autograd.Function):
    """Làm tròn giá trị ở chiều xuôi (qf) và gradient ở chiều ngược (qb)."""

    @staticmethod
    def forward(ctx, x, qf, qb):
        ctx.qb = qb
        return qf(x)

    @staticmethod
    def backward(ctx, g):
        return ctx.qb(g), None, None


def forward(model, x, qA, qG, qL):
    m = model
    t = Q.apply(x, qA, qG)
    t = F.conv2d(t, Q.apply(m.conv1.weight, qA, qG), Q.apply(m.conv1.bias, qA, qG), padding=2)
    t = F.max_pool2d(F.relu(Q.apply(t, qA, qG)), 2)
    t = F.conv2d(t, Q.apply(m.conv2.weight, qA, qG), Q.apply(m.conv2.bias, qA, qG))
    t = F.max_pool2d(F.relu(Q.apply(t, qA, qG)), 2).flatten(1)
    for name in ["fc1", "fc2"]:
        layer = getattr(m, name)
        t = F.linear(t, Q.apply(layer.weight, qA, qG), Q.apply(layer.bias, qA, qG))
        t = F.relu(Q.apply(t, qA, qG))
    t = F.linear(t, Q.apply(m.fc3.weight, qA, qG), Q.apply(m.fc3.bias, qA, qG))
    return Q.apply(t, qA, qL)


@torch.no_grad()
def evaluate(model, x, y, qA):
    ident = make_quantizer("fp32")
    correct = 0
    for i in range(0, len(x), 2000):
        correct += (forward(model, x[i:i + 2000], qA, ident, ident).argmax(1) == y[i:i + 2000]).sum().item()
    return 100.0 * correct / len(x)


def train(cfg_name, seed):
    fa, fg, fl, fo = CONFIGS[cfg_name]
    qA, qG, qL, qO = (make_quantizer(f) for f in (fa, fg, fl, fo))
    torch.manual_seed(seed)
    model = LeNet5()
    params = list(model.parameters())
    with torch.no_grad():
        for p in params:
            p.copy_(qO(p))
    bufs = [torch.zeros_like(p) for p in params]
    xtr, ytr = load_fashion_mnist("train")
    xte, yte = load_fashion_mnist("test")
    steps, step = EPOCHS * math.ceil(len(xtr) / BS), 0
    hist, t0 = [], time.time()
    for ep in range(EPOCHS):
        perm = torch.randperm(len(xtr))
        run_loss, nb, nan_stop = 0.0, 0, False
        for i in range(0, len(xtr), BS):
            idx = perm[i:i + BS]
            logits = forward(model, xtr[idx], qA, qG, qL)
            loss = F.cross_entropy(logits, ytr[idx])
            for p in params:
                p.grad = None
            loss.backward()
            lr = 0.5 * LR * (1 + math.cos(math.pi * step / steps))
            with torch.no_grad():
                for p, b in zip(params, bufs):
                    g = qG(p.grad)
                    b.copy_(qO(MOM * b + g))
                    p.copy_(qO(p - lr * b))
            step += 1
            if not math.isfinite(loss.item()):
                nan_stop = True
                break
            run_loss += loss.item(); nb += 1
        acc = evaluate(model, xte, yte, qA)
        hist.append({"epoch": ep + 1, "train_loss": run_loss / max(nb, 1), "test_acc": acc,
                     "time_s": time.time() - t0})
        print(f"[D] {cfg_name:<30} seed={seed} epoch {ep + 1:2d} loss={run_loss / max(nb, 1):.4f} "
              f"test acc={acc:.2f}% ({time.time() - t0:.0f}s)", flush=True)
        if nan_stop:
            print("   -> loss NaN/Inf, dừng sớm", flush=True)
            break
    return {"config": cfg_name, "formats": {"W/A": fa, "G": fg, "L": fl, "O": fo},
            "seed": seed, "history": hist, "final_acc": hist[-1]["test_acc"]}


if __name__ == "__main__":
    # Tùy chọn: D_CONFIGS="tên1|tên2" để chỉ chạy một số cấu hình; D_OUT=đường dẫn file kết quả khác
    seeds = [int(s) for s in sys.argv[1:]] or [0]
    out_path = os.environ.get("D_OUT") or os.path.join(RES, "06_expD_training.json")
    only = [c for c in os.environ.get("D_CONFIGS", "").split("|") if c]
    results = json.load(open(out_path)) if os.path.exists(out_path) else []
    for seed in seeds:
        for name in CONFIGS:
            if only and name not in only:
                continue
            if any(r["config"] == name and r["seed"] == seed for r in results):
                continue
            results.append(train(name, seed))
            with open(out_path, "w") as f:
                json.dump(results, f, indent=1, ensure_ascii=False)
    print("Xong -> results/06_expD_training.json")
