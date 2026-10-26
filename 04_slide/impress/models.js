/* Small deterministic numerical models for teaching, independent of the DOM.
   Rounding uses the same extended-bit thresholds as posit_lab/numformats.py.
   Supported teaching domain: n=3..16, es=0..2. */
(function (global) {
  'use strict';
  const cache = new Map();
  function validate(n, es) {
    if (!Number.isInteger(n) || n < 3 || n > 16 || !Number.isInteger(es) || es < 0 || es > 2)
      throw new RangeError('Teaching model supports n=3..16 and es=0..2.');
  }
  function decode(bits, n = 8, es = 1) {
    validate(n, es);
    const mask = 2 ** n - 1;
    bits = bits & mask;
    const raw = bits.toString(2).padStart(n, '0');
    if (bits === 0) return { value: 0, raw, special: 'zero' };
    if (bits === 2 ** (n - 1)) return { value: NaN, raw, special: 'NaR' };
    const sign = bits >>> (n - 1);
    const magnitudeBits = sign ? (-bits) & mask : bits;
    const magnitude = magnitudeBits.toString(2).padStart(n, '0');
    const body = magnitude.slice(1);
    let run = 1;
    while (run < body.length && body[run] === body[0]) run++;
    const regimeLength = Math.min(run + 1, body.length);
    const k = body[0] === '1' ? run - 1 : -run;
    const rest = body.slice(run + 1);
    const exponentBits = rest.slice(0, es);
    const exponent = parseInt(exponentBits.padEnd(es, '0') || '0', 2);
    const fractionBits = rest.slice(es);
    const fraction = fractionBits ? parseInt(fractionBits, 2) / 2 ** fractionBits.length : 0;
    const value = (sign ? -1 : 1) * 2 ** (k * 2 ** es + exponent) * (1 + fraction);
    return { value, raw, sign, magnitude, regime: body.slice(0, regimeLength),
      exponentBits, fractionBits, k, exponent, fraction, useed: 2 ** (2 ** es) };
  }
  function table(n, es) {
    const key = `${n}/${es}`;
    if (!cache.has(key)) {
      const values = [], thresholds = [];
      for (let b = 1; b < 2 ** (n - 1); b++) {
        values.push(decode(b, n, es).value);
        // Internal n+1 decode (up to n=16) follows the same exact bit rules.
        if (b < 2 ** (n - 1) - 1) thresholds.push(decode((b << 1) | 1, n + 1, es).value);
      }
      cache.set(key, { values, thresholds });
    }
    return cache.get(key);
  }
  function quantize(x, n = 8, es = 0) {
    // Interactive demos only need p8. Avoid allocating a large p16 table.
    validate(n, es);
    if (n > 15) throw new RangeError('Quantizer supports n<=15.');
    if (Number.isNaN(x)) return NaN;
    if (x === 0) return x;
    const { values, thresholds } = table(n, es);
    const a = Math.abs(x);
    let lo = 0, hi = thresholds.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (a > thresholds[mid]) lo = mid + 1;
      else hi = mid;
    }
    // At a tie the lower positive code is lo+1; choose the even bit pattern.
    if (a === thresholds[lo] && ((lo + 1) & 1)) lo++;
    return (x < 0 ? -1 : 1) * values[lo];
  }
  function scaledQuantize(x, shift, es = 0) {
    return quantize(x * 2 ** shift, 8, es) / 2 ** shift;
  }
  function quireTrace() {
    const terms = [8, ...Array(8).fill(.125), -8];
    let fma = 0, wide = 0;
    return terms.map((term, i) => {
      const unrounded = fma + term;
      fma = quantize(unrounded);
      wide += term;
      return { step: i + 1, term, unrounded, fma, wide, output: quantize(wide) };
    });
  }
  function plam(a, b) {
    if (a < 0 || a >= 1 || b < 0 || b >= 1) throw new RangeError('Fractions must lie in [0,1).');
    const sum = a + b;
    const carry = sum >= 1 ? 1 : 0;
    const approx = carry ? 2 * sum : 1 + sum;
    const exact = (1 + a) * (1 + b);
    return { sum, carry, normalizedFraction: sum - carry, approx, exact,
      relativeError: Math.abs(exact - approx) / exact };
  }
  function fastSigmoid(bits) {
    if (!Number.isInteger(bits) || bits < 0 || bits > 255 || bits === 128) throw new RangeError('Finite posit8 code required.');
    const input = decode(bits, 8, 0).value;
    const xor = bits ^ 128;
    const code = xor >>> 2;
    const approx = decode(code, 8, 0).value;
    const exact = 1 / (1 + Math.exp(-input));
    return { input, bits, xor, code, approx, exact, error: Math.abs(approx-exact) };
  }
  function roundingCase(lower = 64, es = 2) {
    if (!Number.isInteger(lower) || lower<1 || lower>126) throw new RangeError('Adjacent positive codes required.');
    const low = decode(lower,8,es).value, high = decode(lower+1,8,es).value;
    const threshold = decode((lower<<1)|1,9,es).value;
    return { lower, upper:lower+1, low, high, threshold, arithmeticMidpoint:(low+high)/2,
      tieCode:(lower&1)?lower+1:lower };
  }
  function codeFor(value, es, n=8) {
    for(let bits=0;bits<2**n;bits++) if(decode(bits,n,es).value===value) return bits;
    throw new RangeError('Value is not representable.');
  }
  function formatProbe(x,es) {
    const quantized=quantize(x,8,es), bits=codeFor(quantized,es);
    const max=2**((2**es)*6);
    return { ...decode(bits,8,es), bits,quantized,max,min:1/max,
      relativeError:x===0?0:Math.abs(quantized-x)/Math.abs(x) };
  }
  function optimizerTrace(steps=12) {
    let pure=1,master=1;
    const delta=1/256;
    return Array.from({length:steps},(_,i)=>{
      const pureRaw=pure-delta;
      pure=quantize(pureRaw,8,2);
      master=quantize(master-delta,12,2);
      return { step:i+1,delta,pureRaw,pure,master,forward:quantize(master,8,2),ideal:1-(i+1)*delta };
    });
  }
  function plamProduct(bitsA,bitsB,es=1) {
    const a=decode(bitsA,8,es),b=decode(bitsB,8,es);
    if(a.special||b.special) throw new RangeError('Nonzero finite posit inputs required.');
    const p=plam(a.fraction,b.fraction);
    const scaleA=a.k*2**es+a.exponent,scaleB=b.k*2**es+b.exponent;
    const scale=scaleA+scaleB+p.carry;
    const sign=a.sign===b.sign?1:-1;
    const approx=sign*2**scale*(1+p.normalizedFraction);
    const exact=a.value*b.value;
    const roundedApprox=quantize(approx,8,es),roundedExact=quantize(exact,8,es);
    return {...p,a,b,scaleA,scaleB,scale,sign,approx,exact,roundedApprox,roundedExact,
      outputCode:codeFor(roundedApprox,es),relativeError:Math.abs(approx-exact)/Math.abs(exact)};
  }
  global.PositDemo = { decode, quantize, scaledQuantize, quireTrace, plam, fastSigmoid, roundingCase, formatProbe, optimizerTrace, plamProduct };
})(globalThis);
