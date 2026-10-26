const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = __dirname + '/..';
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'models.js'), 'utf8'), ctx);
const M = ctx.PositDemo;
const refs = JSON.parse(fs.readFileSync(path.join(__dirname, 'reference.json'), 'utf8'));
let count = 0;
for (const es of [0, 1, 2]) {
  refs[es].decoded.forEach((value, bits) => {
    const actual = M.decode(bits, 8, es).value;
    if (value === null) assert.ok(Number.isNaN(actual));
    else assert.equal(actual, value, `decode p8/${es} bits=${bits}`);
    count++;
  });
  refs[es].round_inputs.forEach((x, i) => {
    assert.equal(M.quantize(x, 8, es), refs[es].round_outputs[i], `round ${x}, es=${es}`);
    count++;
  });
}
const t = M.quireTrace();
assert.equal(t.at(-1).wide, 1);
assert.equal(t.at(-1).fma, 0);
assert.equal(t.length, 10);
assert.equal(M.plam(.5, .5).exact, 2.25);
assert.equal(M.plam(.5, .5).approx, 2);
assert.ok(Math.abs(M.plam(.5, .5).relativeError - 1 / 9) < 1e-14);
assert.equal(M.plam(0, .7).relativeError, 0);
for (let a = 0; a < 1; a += .03125) for (let b = 0; b < 1; b += .03125) {
 const p = M.plam(a, b);
 assert.ok(p.approx <= p.exact + 1e-14);
 assert.ok(p.relativeError <= 1 / 9 + 1e-14);
 count++;
}
assert.equal(M.scaledQuantize(1 / 32, 5), 1 / 32);
assert.throws(() => M.decode(1, 8, -1));
assert.throws(() => M.decode(1, 32, 2));
console.log(`PASS: ${count} reference/property checks; exact cancellation, PLAM branches, scaling.`);

let maxSigmoidError = 0;
for (let bits = 0; bits < 256; bits++) {
 if (bits === 128) continue;
 const v = M.fastSigmoid(bits);
 assert.ok(v.approx >= 0 && v.approx <= 1);
 maxSigmoidError = Math.max(maxSigmoidError, v.error);
}
assert.ok(Math.abs(maxSigmoidError - 0.060664021611295804) < 1e-14);
assert.equal(M.fastSigmoid(0).approx, 0.5);
assert.throws(() => M.fastSigmoid(128));
console.log('PASS: fast sigmoid all 255 finite bit patterns; max error matches experiment E.');
const r = M.roundingCase(1, 2);
assert.notEqual(r.threshold, (r.low+r.high)/2);
assert.equal(M.quantize(r.threshold,8,2),r.high); // lower code odd -> upper even
assert.equal(M.quantize(M.roundingCase(64,2).threshold,8,2),1); // even lower code
for (const es of [0,1,2]) {
 const f = M.formatProbe(.04,es);
 assert.equal(M.decode(f.bits,8,es).value,f.quantized);
 assert.equal(f.max,2**((2**es)*6));
}
const update = M.optimizerTrace(12);
assert.equal(update.at(-1).pure,1);
assert.equal(update.at(-1).master,1-12/256);
assert.equal(update[7].forward,1);
assert.equal(update[8].forward,.9375);
const pp=M.plamProduct(88,88);
assert.equal(pp.exact,9);
assert.equal(pp.approx,8);
assert.equal(pp.carry,1);
assert.equal(M.plamProduct(168,88).approx,-8);
assert.equal(M.plamProduct(127,127).roundedApprox,4096);
console.log('PASS: rounding threshold/parity, es ranges, lost updates, full PLAM exponent/sign/saturation.');
