"""
Mô phỏng các định dạng số dùng trong thí nghiệm: Posit<n,es>, dấu phẩy động
thu nhỏ (FP8 E4M3/E5M2, FP16, BF16, FP n-bit tổng quát) và số nguyên INT n-bit.

Mọi phép "lượng tử hóa" (quantize) đều trả về giá trị thực (float) gần nhất có
thể biểu diễn được trong định dạng đích, theo đúng quy tắc làm tròn của định
dạng đó. Đây là kỹ thuật mô phỏng phổ biến trong các bài báo (ví dụ [11] PositNN,
[40] QPyTorch): dữ liệu được lưu dưới dạng float32/float64 nhưng chỉ nhận các
giá trị mà định dạng đích biểu diễn được.

Quy ước Posit theo Posit Standard (2022) / Gustafson & Yonemoto (2017):
  - Mẫu bit toàn 0  -> 0 ; mẫu 100...0 -> NaR (Not a Real).
  - Số âm = bù hai (two's complement) của số dương tương ứng.
  - Giá trị: x = (-1)^s * useed^k * 2^e * (1 + f),  useed = 2^(2^es).
  - Làm tròn: round-to-nearest-even trên chuỗi bit; không bao giờ tràn thành
    NaR và không bao giờ làm tròn một số khác 0 về 0 (bão hòa về maxpos/minpos).
"""
from __future__ import annotations

from fractions import Fraction
from functools import lru_cache

import numpy as np
import torch


# ---------------------------------------------------------------------------
# POSIT
# ---------------------------------------------------------------------------
def decode_posit(bits: int, n: int, es: int) -> float:
    """Giải mã chính xác một mẫu bit posit<n,es> (số nguyên không dấu) ra float.

    Dùng Fraction để tính chính xác tuyệt đối rồi mới đổi sang float64
    (với n <= 32 mọi giá trị posit đều biểu diễn chính xác trong float64
    khi es <= 2 và n <= 16; với n lớn hơn có thể mất bit cuối khi đổi ra float).
    """
    mask = (1 << n) - 1
    bits &= mask
    if bits == 0:
        return 0.0
    if bits == 1 << (n - 1):
        return float("nan")  # NaR
    sign = bits >> (n - 1)
    if sign:
        bits = (-bits) & mask  # bù hai
    # Đọc các bit sau bit dấu, từ trái sang phải
    body = [(bits >> i) & 1 for i in range(n - 2, -1, -1)]
    r0 = body[0]
    m = 1
    while m < len(body) and body[m] == r0:
        m += 1
    k = (m - 1) if r0 == 1 else -m
    idx = m + 1  # bỏ qua bit kết thúc regime (nếu có)
    rest = body[idx:] if idx <= len(body) else []
    e_bits = rest[:es]
    e_bits = e_bits + [0] * (es - len(e_bits))  # bit mũ bị "cắt" coi như 0
    e = 0
    for b in e_bits:
        e = (e << 1) | b
    f_bits = rest[es:]
    f = Fraction(0)
    for i, b in enumerate(f_bits):
        if b:
            f += Fraction(1, 1 << (i + 1))
    scale = k * (1 << es) + e
    val = (Fraction(2) ** scale) * (1 + f)
    out = float(val)
    return -out if sign else out


@lru_cache(maxsize=None)
def posit_table(n: int, es: int):
    """Bảng các giá trị dương của posit<n,es> theo thứ tự tăng dần.

    Trả về (values, thresholds, odd):
      values[j]     : giá trị dương thứ j (j=0 là minpos, j cuối là maxpos)
      thresholds[j] : ngưỡng làm tròn giữa values[j] và values[j+1]. Ngưỡng này
                      chính là giá trị của posit<n+1,es> có mẫu bit (p_j << 1) | 1,
                      tức trung điểm *trên không gian bit* (round-to-nearest-even
                      trên chuỗi bit), KHÔNG phải trung bình cộng hai giá trị.
      odd[j]        : mẫu bit của values[j] là số lẻ (dùng cho tie-to-even).
    """
    pats = range(1, 1 << (n - 1))  # 0...01 -> 01...1 : toàn bộ số dương
    values = np.array([decode_posit(p, n, es) for p in pats], dtype=np.float64)
    thresholds = np.array(
        [decode_posit((p << 1) | 1, n + 1, es) for p in range(1, (1 << (n - 1)) - 1)],
        dtype=np.float64,
    )
    odd = np.array([p & 1 for p in pats], dtype=bool)
    assert np.all(np.diff(values) > 0)
    assert np.all(thresholds > values[:-1]) and np.all(thresholds < values[1:])
    return values, thresholds, odd


def posit_props(n: int, es: int) -> dict:
    values, _, _ = posit_table(n, es)
    useed = 2 ** (2 ** es)
    return {
        "format": f"posit<{n},{es}>",
        "n": n,
        "es": es,
        "useed": useed,
        "maxpos": values[-1],
        "minpos": values[0],
        "maxpos_formula": float(useed) ** (n - 2),
        "dynamic_range_decades": float(np.log10(values[-1] / values[0])),
        "num_positive_values": len(values),
        "quire_bits_std2022": 16 * n,  # Posit Standard (2022): quire = 16n bit
        "quire_bits_legacy": n * n // 2,  # quy ước cũ (n^2/2, dùng trong [03],[11])
    }


@lru_cache(maxsize=None)
def _posit_tensors(n: int, es: int, dtype_name: str):
    """Bảng giá trị/ngưỡng dạng tensor (cache). Kiểm tra biểu diễn chính xác trong kiểu dtype."""
    values, thresholds, odd = posit_table(n, es)
    dt = getattr(torch, dtype_name)
    V, T = torch.tensor(values, dtype=dt), torch.tensor(thresholds, dtype=dt)
    assert np.array_equal(V.double().numpy(), values) and np.array_equal(T.double().numpy(), thresholds)
    return V, T, torch.from_numpy(odd.copy())


def quantize_posit(x: torch.Tensor, n: int, es: int) -> torch.Tensor:
    """Làm tròn tensor x về giá trị posit<n,es> gần nhất (RNE trên chuỗi bit).

    Với đầu vào float32 và n <= 16, mọi giá trị và ngưỡng của posit đều biểu diễn chính xác
    trong float32 nên tính trực tiếp bằng float32 (nhanh hơn, kết quả giống hệt float64).
    """
    work = torch.float32 if (x.dtype == torch.float32 and n <= 16) else torch.float64
    V, T, ODD = _posit_tensors(n, es, str(work).split(".")[1])
    xd = x.detach().to(work)
    a = xd.abs().contiguous()
    idx = torch.bucketize(a, T, right=False)  # T[idx-1] < a <= T[idx]
    # Trường hợp hòa (a đúng bằng ngưỡng T[idx]): chọn mẫu bit chẵn -> lên 1 nếu mẫu hiện tại lẻ
    idx_c = idx.clamp(max=len(T) - 1)
    idx = idx + ((a == T[idx_c]) & ODD[idx_c]).long()
    q = V[idx]  # bão hòa: > maxpos -> maxpos, (0, minpos) -> minpos (không bao giờ về 0)
    q = torch.where(a == 0, torch.zeros_like(q), q)
    q = torch.where(torch.isfinite(a), q, torch.full_like(q, float("nan")))
    return torch.copysign(q, xd).to(x.dtype)


# ---------------------------------------------------------------------------
# DẤU PHẨY ĐỘNG THU NHỎ (minifloat) TỔNG QUÁT
# ---------------------------------------------------------------------------
@lru_cache(maxsize=None)
def minifloat_table(e_bits: int, m_bits: int, ieee_special: bool = False):
    """Các giá trị không âm của minifloat (1 bit dấu, e_bits mũ, m_bits định trị).

    - Có số dưới chuẩn (subnormal), bias = 2^(e_bits-1) - 1.
    - ieee_special=False: kiểu "fn" (finite) như FP8 E4M3 của OCP — dùng toàn bộ
      mã mũ cao nhất cho số hữu hạn, chỉ dành mẫu S.1111.111 cho NaN.
    - ieee_special=True: kiểu IEEE (như FP16, E5M2) — mã mũ cao nhất dành cho
      Inf/NaN.
    """
    bias = 2 ** (e_bits - 1) - 1
    vals = []
    max_e = 2 ** e_bits - 1
    for E in range(0, max_e + 1):
        for M in range(0, 2 ** m_bits):
            if ieee_special and E == max_e:
                continue
            if (not ieee_special) and E == max_e and M == 2 ** m_bits - 1 and e_bits > 1:
                continue  # NaN của định dạng fn
            if E == 0:
                v = Fraction(M, 2 ** m_bits) * Fraction(2) ** (1 - bias)
            else:
                v = (1 + Fraction(M, 2 ** m_bits)) * Fraction(2) ** (E - bias)
            vals.append(float(v))
    vals = np.array(vals, dtype=np.float64)  # đã tăng dần theo mẫu bit
    assert np.all(np.diff(vals) > 0)
    return vals


@lru_cache(maxsize=None)
def _minifloat_tensors(e_bits: int, m_bits: int, ieee_special: bool, dtype_name: str):
    vals = minifloat_table(e_bits, m_bits, ieee_special)
    dt = getattr(torch, dtype_name)
    V = torch.tensor(vals, dtype=dt)
    mids = (torch.tensor(vals[:-1], dtype=torch.float64) + torch.tensor(vals[1:], dtype=torch.float64)) / 2
    M = mids.to(dt)
    assert np.array_equal(V.double().numpy(), vals) and torch.equal(M.double(), mids)
    return V, M


def quantize_minifloat(x: torch.Tensor, e_bits: int, m_bits: int,
                       ieee_special: bool = False) -> torch.Tensor:
    """RNE theo giá trị (trung điểm cộng), bão hòa khi tràn (không sinh Inf)."""
    work = torch.float32 if (x.dtype == torch.float32 and e_bits <= 5 and m_bits <= 10) else torch.float64
    V, mids = _minifloat_tensors(e_bits, m_bits, ieee_special, str(work).split(".")[1])
    xd = x.detach().to(work)
    a = xd.abs().contiguous()
    idx = torch.bucketize(a, mids, right=False)
    idx_c = idx.clamp(max=len(mids) - 1)
    # mẫu bit của V[j] chính là j (liệt kê theo thứ tự mẫu bit) -> lẻ khi j lẻ
    idx = (idx + ((a == mids[idx_c]) & (idx_c % 2 == 1)).long()).clamp(max=len(V) - 1)
    q = V[idx]
    q = torch.where(torch.isnan(a), torch.full_like(q, float("nan")), q)
    return torch.copysign(q, xd).to(x.dtype)


def minifloat_props(e_bits: int, m_bits: int, ieee_special: bool = False) -> dict:
    vals = minifloat_table(e_bits, m_bits, ieee_special)
    pos = vals[vals > 0]
    return {
        "format": f"FP{1 + e_bits + m_bits} E{e_bits}M{m_bits}",
        "maxpos": pos[-1],
        "minpos": pos[0],
        "dynamic_range_decades": float(np.log10(pos[-1] / pos[0])),
        "num_positive_values": len(pos),
    }


# ---------------------------------------------------------------------------
# INT n-bit (đối xứng, theo tensor) — chuẩn lượng tử hóa sau huấn luyện phổ biến
# ---------------------------------------------------------------------------
def quantize_int(x: torch.Tensor, n: int, scale: float | None = None) -> torch.Tensor:
    """q = clamp(round(x/s), -(2^(n-1)-1), 2^(n-1)-1) * s ; s = max|x| / (2^(n-1)-1)."""
    qmax = 2 ** (n - 1) - 1
    if scale is None:
        amax = x.detach().abs().max().item()
        scale = amax / qmax if amax > 0 else 1.0
    return torch.clamp(torch.round(x / scale), -qmax, qmax) * scale


# ---------------------------------------------------------------------------
# Giao diện thống nhất
# ---------------------------------------------------------------------------
def make_quantizer(spec: str):
    """Tạo hàm lượng tử hóa từ chuỗi mô tả, ví dụ:
       'fp32', 'fp16', 'bf16', 'fp8e4m3', 'fp8e5m2', 'posit8_1', 'int8', 'fp6e3m2'
    """
    s = spec.lower()
    if s == "fp32":
        return lambda t: t
    if s == "fp16":
        return lambda t: t.to(torch.float16).to(t.dtype)
    if s == "bf16":
        return lambda t: t.to(torch.bfloat16).to(t.dtype)
    if s == "fp8e4m3":  # OCP FP8 E4M3 (max 448), bão hòa khi tràn
        return lambda t: quantize_minifloat(t, 4, 3, ieee_special=False)
    if s == "fp8e5m2":  # OCP FP8 E5M2 (kiểu IEEE, max 57344), bão hòa khi tràn
        return lambda t: quantize_minifloat(t, 5, 2, ieee_special=True)
    if s.startswith("posit"):
        n, es = s[5:].split("_")
        n, es = int(n), int(es)
        return lambda t: quantize_posit(t, n, es)
    if s.startswith("int"):
        n = int(s[3:])
        return lambda t: quantize_int(t, n)
    if s.startswith("fp") and "e" in s and "m" in s:  # fpNeXmY tổng quát, kiểu fn
        body = s[2:]
        n = int(body.split("e")[0])
        e = int(body.split("e")[1].split("m")[0])
        m = int(body.split("m")[1])
        assert n == 1 + e + m, spec
        return lambda t: quantize_minifloat(t, e, m, ieee_special=False)
    raise ValueError(spec)
