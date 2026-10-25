"""Đọc Fashion-MNIST từ các file .gz gốc (định dạng IDX) — không cần torchvision.

Nguồn: https://github.com/zalandoresearch/fashion-mnist (MD5 đã kiểm tra khớp).
"""
import gzip
import os

import numpy as np
import torch

DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
MEAN, STD = 0.2860, 0.3530  # thống kê chuẩn của tập train Fashion-MNIST
CLASSES = ["T-shirt/top", "Trouser", "Pullover", "Dress", "Coat",
           "Sandal", "Shirt", "Sneaker", "Bag", "Ankle boot"]


def _read_idx(path):
    with gzip.open(path, "rb") as f:
        data = f.read()
    ndim = data[3]
    dims = [int.from_bytes(data[4 + 4 * i: 8 + 4 * i], "big") for i in range(ndim)]
    return np.frombuffer(data, dtype=np.uint8, offset=4 + 4 * ndim).reshape(dims)


def load_fashion_mnist(split: str):
    prefix = "train" if split == "train" else "t10k"
    x = _read_idx(os.path.join(DATA, f"{prefix}-images-idx3-ubyte.gz"))
    y = _read_idx(os.path.join(DATA, f"{prefix}-labels-idx1-ubyte.gz"))
    x = torch.from_numpy(x.astype(np.float32) / 255.0).unsqueeze(1)
    x = (x - MEAN) / STD
    return x, torch.from_numpy(y.astype(np.int64))
