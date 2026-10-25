"""
Bước 0 — Kiểm chứng bộ mô phỏng posit / FP8 trước khi dùng cho thí nghiệm.

1. Giải mã: so sánh TOÀN BỘ mẫu bit với thư viện tham chiếu SoftPosit
   (thư viện C chính thức của nhóm Gustafson/NGA, bản Python `softposit`).
2. Làm tròn: so sánh hàm quantize_posit với SoftPosit trên các số ngẫu nhiên
   (phân bố log-đều), trên đúng các ngưỡng làm tròn (trường hợp hòa) và lân cận.
3. FP8: so sánh bộ mô phỏng minifloat với kiểu float8 có sẵn trong PyTorch.
4. In bảng thuộc tính các định dạng (maxpos, minpos, dải động...) -> results/.

Chạy:  python 01_validate_formats.py   (cần gói `softposit`; nếu thiếu sẽ bỏ qua 1-2)
"""
import json
import math
import os

import numpy as np
import torch

from posit_lab.numformats import (decode_posit, posit_table, quantize_posit,
                                  posit_props, minifloat_props, quantize_minifloat)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "results")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(2026)
report = {}

try:
    import softposit as sp
except ImportError:
    sp = None
    print("!! Không có softposit -> bỏ qua phần so sánh với thư viện tham chiếu")


def sp_decode(bits, n, es):
    """Giải mã bằng SoftPosit."""
    if (n, es) == (8, 0):
        p = sp.posit8(0); p.fromBits(bits)
    elif (n, es) == (16, 1):
        p = sp.posit16(0); p.fromBits(bits)
    elif es == 2:
        p = sp.posit_2(0, n); p.fromBits(bits << (32 - n))
    else:
        raise ValueError
    return float("nan") if p.isNaR() else float(p)


def sp_round(x, n, es):
    """Làm tròn số thực x về posit bằng SoftPosit."""
    if (n, es) == (8, 0):
        p = sp.posit8(float(x))
    elif (n, es) == (16, 1):
        p = sp.posit16(float(x))
    elif es == 2:
        p = sp.posit_2(float(x), n)
    else:
        raise ValueError
    return float(p)


CONFIGS_SP = [(8, 0), (16, 1), (8, 2), (16, 2)]

if sp is not None:
    # ---- 1. Giải mã toàn bộ mẫu bit
    for n, es in CONFIGS_SP:
        mism = 0
        for b in range(1 << n):
            a = decode_posit(b, n, es)
            r = sp_decode(b, n, es)
            if not ((math.isnan(a) and math.isnan(r)) or a == r):
                mism += 1
        report[f"decode_posit<{n},{es}>"] = {"patterns": 1 << n, "mismatches": mism}
        print(f"[giải mã] posit<{n},{es}>: {1 << n} mẫu bit, sai khác = {mism}")

    # ---- 2. Làm tròn
    for n, es in CONFIGS_SP:
        values, thresholds, _ = posit_table(n, es)
        lo, hi = math.log2(values[0]) - 4, math.log2(values[-1]) + 4
        rand = 2.0 ** rng.uniform(lo, hi, 20000) * rng.choice([-1, 1], 20000)
        ties = np.concatenate([thresholds, -thresholds])
        near = np.concatenate([np.nextafter(thresholds, 0), np.nextafter(thresholds, np.inf)])
        specials = np.array([0.0, values[0] / 3, values[-1] * 7, 1.0, -1.0])
        xs = np.concatenate([rand, ties, near, specials])
        ours = quantize_posit(torch.from_numpy(xs), n, es).numpy()
        ref = np.array([sp_round(x, n, es) for x in xs])
        mism = int(np.sum(ours != ref))
        report[f"round_posit<{n},{es}>"] = {"tests": len(xs), "ties_tested": len(ties),
                                            "mismatches": mism}
        print(f"[làm tròn] posit<{n},{es}>: {len(xs)} phép thử (gồm {len(ties)} điểm hòa), "
              f"sai khác = {mism}")

# ---- 3. FP8 so với PyTorch
for (e, m, ieee, tdt, mx) in [(4, 3, False, torch.float8_e4m3fn, 448.0),
                              (5, 2, True, torch.float8_e5m2, 57344.0)]:
    xs = torch.from_numpy(2.0 ** rng.uniform(-20, math.log2(mx), 50000)
                          * rng.choice([-1, 1], 50000)).float()
    ours = quantize_minifloat(xs, e, m, ieee)
    ref = xs.to(tdt).float()
    mism = int((ours != ref).sum())
    report[f"fp8_E{e}M{m}_vs_torch"] = {"tests": len(xs), "mismatches": mism}
    print(f"[FP8] E{e}M{m} so với torch.{str(tdt).split('.')[-1]}: {len(xs)} phép thử, sai khác = {mism}")

# ---- 4. Bảng thuộc tính
props = [posit_props(n, es) for n, es in [(8, 0), (8, 1), (8, 2), (16, 1), (16, 2)]]
props += [minifloat_props(4, 3, False) | {"format": "FP8 E4M3 (OCP)"},
          minifloat_props(5, 2, True) | {"format": "FP8 E5M2 (OCP)"},
          minifloat_props(5, 10, True) | {"format": "FP16 (IEEE half)"},
          minifloat_props(8, 7, True) | {"format": "BF16"}]
props.append({"format": "INT8 (đối xứng)", "maxpos": 127.0, "minpos": 1.0,
              "dynamic_range_decades": math.log10(127), "num_positive_values": 127})
for p in props:
    assert "maxpos_formula" not in p or p["maxpos"] == p["maxpos_formula"]
    print(f"  {p['format']:<18} maxpos={p['maxpos']:<12.6g} minpos={p['minpos']:<12.6g} "
          f"dải động={p['dynamic_range_decades']:.2f} thập phân, số giá trị dương={p['num_positive_values']}")
report["format_properties"] = props

with open(os.path.join(OUT, "00_validation.json"), "w") as f:
    json.dump(report, f, indent=2, ensure_ascii=False, default=float)
print("-> results/00_validation.json")
