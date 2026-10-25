"""Tiện ích lượng tử hóa trọng số theo từng lớp (dùng cho Thí nghiệm B, C).

Hai chế độ co giãn (scaling) cho các định dạng có dải cố định (posit, FP8):
  - "none" : làm tròn trực tiếp giá trị gốc (rounding quantization, như [07]).
  - "pow2" : nhân trọng số của mỗi lớp với 2^s trước khi làm tròn rồi chia lại,
             s là số nguyên chọn để sai số bình phương nhỏ nhất (giống layer-wise
             scaling của [08] và "exponent bias" của [40]; vì là lũy thừa 2 nên
             trong phần cứng chỉ là cộng/trừ vào số mũ).
INT n-bit luôn cần hệ số co giãn: "max" (s = max|W|/(2^(n-1)-1)) hoặc
"mse" (dò hệ số cắt α·max để sai số bình phương nhỏ nhất — hiệu chỉnh chuẩn).
"""
import copy

import torch

from .numformats import make_quantizer, quantize_int
from .model import LAYERS


def pow2_shift(w: torch.Tensor, qfn, lo: int = -12, hi: int = 12) -> int:
    best, best_s = None, 0
    for s in range(lo, hi + 1):
        sc = 2.0 ** s
        err = torch.sum((w - qfn(w * sc) / sc) ** 2).item()
        if best is None or err < best:
            best, best_s = err, s
    return best_s


def int_mse_scale(w: torch.Tensor, n: int) -> float:
    qmax = 2 ** (n - 1) - 1
    amax = w.abs().max().item()
    best, best_sc = None, amax / qmax
    for a in [1.0 - 0.02 * i for i in range(0, 40)]:  # α từ 1.0 xuống 0.22
        sc = a * amax / qmax
        err = torch.sum((w - quantize_int(w, n, sc)) ** 2).item()
        if best is None or err < best:
            best, best_sc = err, sc
    return best_sc


def quantize_tensor(w: torch.Tensor, fmt: str, scale: str = "none"):
    """Trả về (w_q, info) — info ghi lại hệ số co giãn đã dùng."""
    if fmt.startswith("int"):
        n = int(fmt[3:])
        sc = int_mse_scale(w, n) if scale == "mse" else None
        wq = quantize_int(w, n, sc)
        return wq, {"int_scale": sc if sc is not None else w.abs().max().item() / (2 ** (n - 1) - 1)}
    qfn = make_quantizer(fmt)
    if scale == "pow2":
        s = pow2_shift(w, qfn)
        return qfn(w * 2.0 ** s) / 2.0 ** s, {"pow2_shift": s}
    return qfn(w), {}


@torch.no_grad()
def quantize_model_weights(model, fmt: str, scale: str = "none"):
    """Bản sao mô hình với trọng số conv/fc đã lượng tử hóa (bias giữ FP32)."""
    m = copy.deepcopy(model)
    infos, rel_err = {}, {}
    for name in LAYERS:
        layer = getattr(m, name)
        w = layer.weight.data
        wq, info = quantize_tensor(w, fmt, scale)
        rel_err[name] = (torch.norm(w - wq) / torch.norm(w)).item()
        layer.weight.data.copy_(wq)
        infos[name] = info
    return m, infos, rel_err
