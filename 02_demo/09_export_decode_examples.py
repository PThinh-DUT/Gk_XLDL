"""Xuất bảng ví dụ giải mã posit (dùng trong báo cáo) — sinh bằng bộ giải mã đã kiểm chứng."""
import json
import os
from fractions import Fraction

from posit_lab.numformats import decode_posit

HERE = os.path.dirname(os.path.abspath(__file__))


def fields(bits, n, es):
    """Tách các trường sign | regime | exponent | fraction của một mẫu bit posit."""
    s = f"{bits:0{n}b}"
    if bits == 0:
        return {"bits": s, "kind": "zero", "value": 0.0}
    if bits == 1 << (n - 1):
        return {"bits": s, "kind": "NaR", "value": None}
    sign = bits >> (n - 1)
    mag = ((-bits) & ((1 << n) - 1)) if sign else bits
    body = f"{mag:0{n}b}"[1:]
    r0 = body[0]
    m = 1
    while m < len(body) and body[m] == r0:
        m += 1
    k = m - 1 if r0 == "1" else -m
    reg = body[:min(m + 1, len(body))]
    rest = body[len(reg):]
    e_str = rest[:es]
    f_str = rest[es:]
    e = int(e_str.ljust(es, "0"), 2) if es else 0
    f = Fraction(int(f_str, 2), 1 << len(f_str)) if f_str else Fraction(0)
    return {"bits": s, "sign": sign, "regime": reg, "k": k, "exp_bits": e_str, "e": e,
            "frac_bits": f_str, "f": str(f), "value": decode_posit(bits, n, es),
            "twos_complement_body": body if sign else None}


examples = {"posit<8,1>": [fields(b, 8, 1) for b in
                           [0x00, 0x01, 0x10, 0x20, 0x30, 0x40, 0x48, 0x50, 0x55, 0x56, 0x60, 0x70, 0x7F,
                            0x80, 0xC0]],
            "posit<5,1>_all_positive": [fields(b, 5, 1) for b in range(0, 16)],
            "posit<16,1>_2.56": None}
# Ví dụ 2.56 của [01] (P(16,1)): tìm posit gần nhất
import torch
from posit_lab.numformats import quantize_posit
v = float(quantize_posit(torch.tensor([2.56], dtype=torch.float64), 16, 1)[0])
for b in range(1 << 15):
    if decode_posit(b, 16, 1) == v:
        examples["posit<16,1>_2.56"] = fields(b, 16, 1)
        break
with open(os.path.join(HERE, "results", "09_decode_examples.json"), "w") as f:
    json.dump(examples, f, indent=1, ensure_ascii=False)
for r in examples["posit<8,1>"]:
    print(r)
print(examples["posit<16,1>_2.56"])
