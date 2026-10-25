"""
Huấn luyện 3 mô hình LeNet-5 FP32 (seed 0, 1, 2) trên Fashion-MNIST làm mô hình gốc
cho các thí nghiệm lượng tử hóa sau huấn luyện (Thí nghiệm B, C).

Cấu hình: SGD momentum 0.9, lr 0.05 giảm theo cosine, batch 128, 15 epoch,
không weight decay, không tăng cường dữ liệu.
"""
import json
import math
import os
import time

import torch
import torch.nn.functional as F

from posit_lab.data import load_fashion_mnist
from posit_lab.model import LeNet5, evaluate

HERE = os.path.dirname(os.path.abspath(__file__))
CKPT = os.path.join(HERE, "results", "checkpoints")
os.makedirs(CKPT, exist_ok=True)
torch.set_num_threads(4)

EPOCHS, BS, LR = 15, 128, 0.05
xtr, ytr = load_fashion_mnist("train")
xte, yte = load_fashion_mnist("test")
summary = {}
for seed in [0, 1, 2]:
    torch.manual_seed(seed)
    model = LeNet5()
    opt = torch.optim.SGD(model.parameters(), lr=LR, momentum=0.9)
    steps = EPOCHS * math.ceil(len(xtr) / BS)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, steps)
    t0 = time.time()
    for ep in range(EPOCHS):
        model.train()
        perm = torch.randperm(len(xtr))
        for i in range(0, len(xtr), BS):
            idx = perm[i:i + BS]
            loss = F.cross_entropy(model(xtr[idx]), ytr[idx])
            opt.zero_grad()
            loss.backward()
            opt.step()
            sched.step()
        acc = evaluate(model, xte, yte)
        print(f"seed {seed} epoch {ep + 1:2d} loss {loss.item():.4f} test acc {acc:.2f}% "
              f"({time.time() - t0:.0f}s)", flush=True)
    torch.save(model.state_dict(), os.path.join(CKPT, f"lenet5_fp32_seed{seed}.pt"))
    summary[f"seed{seed}"] = {"test_acc": acc, "train_time_s": time.time() - t0}

with open(os.path.join(HERE, "results", "01_baselines.json"), "w") as f:
    json.dump(summary, f, indent=2)
print(summary)
