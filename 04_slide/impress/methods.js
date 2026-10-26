/* Interactive teaching diagrams. All values are illustrative unless labelled empirical. */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const M = globalThis.PositDemo;
  const $ = id => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timers = new Map();
  const fmt = (x, digits = 6) => Number.isNaN(x) ? 'NaR' : Number(x.toPrecision(digits)).toLocaleString('vi-VN', { maximumFractionDigits: 9 });
  const text = (id, value) => { $(id).textContent = value; };
  function stop(id) {
    clearInterval(timers.get(id));
    timers.delete(id);
    const b = document.querySelector(`[data-demo-play="${id}"]`) || $(`${id}-play`);
    if (b) b.textContent = id === 'scale' ? 'Chạy dịch chuyển' : id === 'training' ? 'Chạy luồng huấn luyện' : id === 'sigmoid' ? 'Chạy thao tác bit' : 'Chạy mô phỏng';
  }
  function play(id, length, render, delay = 1250) {
    if (timers.has(id)) { stop(id); return; }
    let frame = 0;
    render(frame);
    const b = document.querySelector(`[data-demo-play="${id}"]`) || $(`${id}-play`);
    if (b) b.textContent = 'Tạm dừng';
    // Reduced motion keeps the same informative frames without tweening.
    timers.set(id, setInterval(() => {
      frame++;
      render(frame);
      if (frame >= length - 1) stop(id);
    }, reduced ? 1800 : delay));
  }
  document.addEventListener('impress:stepleave', () => [...timers.keys()].forEach(stop));
  document.addEventListener('visibilitychange', () => { if (document.hidden) [...timers.keys()].forEach(stop); });
  // Let arrows/Space operate controls without also navigating the presentation.
  for (const type of ['keydown', 'keyup']) document.addEventListener(type, e => {
    if (e.target.closest('.demo,.evidence-toolbar,#chart-dialog') && e.target.closest('button,input,select,dialog')) e.stopPropagation();
  }, true);

  let decodeStage = 0;
  function decodeRender(stage = decodeStage) {
    decodeStage = Math.max(0, Math.min(4, stage));
    const d = M.decode(Number($('decode-code').value), 8, Number($('decode-es').value));
    const labels = ['Dấu và ngoại lệ', 'Đếm chuỗi regime', 'Đọc exponent', 'Đọc fraction', 'Ghép các thành phần'];
    text('decode-progress', `Bước ${decodeStage + 1} / 5`);
    text('decode-stage-label', `0${decodeStage + 1} / 05`);
    text('decode-stage-title', labels[decodeStage]);
    $('decode-raw').replaceChildren(...[...d.raw].map((bit, i) => {
      const el = document.createElement('span'); el.textContent = bit;
      el.className = i === 0 ? 'bit bit-sign' : 'bit'; return el;
    }));
    if (d.special) {
      $('decode-fields').textContent = d.special === 'zero' ? 'ZERO · không tách regime / exponent / fraction' : 'NaR · không phải số thực';
      text('decode-sign-note', 'Nhận diện mẫu đặc biệt trước khi giải mã.');
      text('decode-stage-text', d.special === 'zero' ? 'Tất cả bit bằng 0 → giá trị 0.' : 'Chỉ bit dấu bằng 1 → NaR. Không đưa vào công thức số hữu hạn.');
      text('decode-value', fmt(d.value)); return;
    }
    text('decode-sign-note', d.sign ? `Số âm: bù hai ${d.raw} → ${d.magnitude}; giải mã độ lớn rồi đổi dấu.` : 'Bit dấu = 0: giải mã trực tiếp độ lớn.');
    const groups = [{bits:'0', key:'sign'}, {bits:d.regime,key:'regime'}, {bits:d.exponentBits,key:'exponent'}, {bits:d.fractionBits,key:'fraction'}];
    const bits = [];
    groups.forEach((g, gi) => [...g.bits].forEach(bit => {
      const el = document.createElement('span'); el.textContent = bit;
      el.className = `bit bit-${g.key} ${decodeStage === gi || decodeStage === 4 ? 'emphasized' : 'dimmed'}`;
      bits.push(el);
    }));
    $('decode-fields').replaceChildren(...bits);
    const explanations = [
      `s = ${d.sign}; ${d.sign ? 'phải xử lý bù hai để tìm độ lớn.' : 'mã hiện tại là số dương.'}`,
      `Regime ${d.regime}: k = ${d.k}. Chuỗi 1 dài m cho k=m−1; chuỗi 0 dài m cho k=−m. Bit kết thúc không thuộc exponent.`,
      `es=${$('decode-es').value}; các bit mũ “${d.exponentBits || 'rỗng'}” cho e=${d.exponent}. Nếu thiếu bit, bổ sung 0 ở bên phải.`,
      `Fraction “${d.fractionBits || 'rỗng'}” cho f=${fmt(d.fraction)}. Phần định trị là 1+f=${fmt(1+d.fraction)}.`,
      `${d.sign ? '−' : ''}${d.useed}^(${d.k}) × 2^(${d.exponent}) × (1 + ${fmt(d.fraction)}) = ${fmt(d.value)}.`
    ];
    text('decode-stage-text', explanations[decodeStage]);
    text('decode-value', decodeStage === 4 ? `x = ${fmt(d.value)}` : ['s','k','e','f'][decodeStage] + ' = ' + fmt([d.sign,d.k,d.exponent,d.fraction][decodeStage]));
  }
  for (const id of ['decode-code','decode-es']) $(id).addEventListener('change', () => {stop('decode');decodeRender(0);});
  document.querySelector('[data-demo-prev="decode"]').onclick = () => {stop('decode');decodeRender(decodeStage - 1);};
  document.querySelector('[data-demo-next="decode"]').onclick = () => {stop('decode');decodeRender(decodeStage + 1);};
  document.querySelector('[data-demo-play="decode"]').onclick = () => play('decode',5,decodeRender);
  decodeRender();

  const ns = 'http://www.w3.org/2000/svg';
  const xMap = log => 95 + (log + 11) / 14 * 1155;
  for (let e = -11; e <= 3; e++) {
    const x = xMap(e), line = document.createElementNS(ns, 'line'), label = document.createElementNS(ns, 'text');
    line.setAttribute('x1',x);line.setAttribute('x2',x);line.setAttribute('y1',145);line.setAttribute('y2',154);
    label.setAttribute('x',x);label.setAttribute('y',185);label.setAttribute('text-anchor','middle');label.textContent = e === 0 ? '1' : `2^${e}`;
    $('scale-ticks').append(line,label);
  }
  // The highlighted ±1 log2 band is explanatory, not a hard precision boundary.
  const region = document.querySelector('.golden-region');
  region.setAttribute('x', xMap(-1));region.setAttribute('width',xMap(1)-xMap(-1));
  const regionText = region.nextElementSibling;regionText.setAttribute('x',xMap(0));
  function scaleRender() {
    const w = Number($('scale-input').value), shift = Number($('scale-shift').value);
    const z = w * 2 ** shift, q = M.quantize(z), back = q / 2 ** shift;
    const original = M.quantize(w);
    text('scale-shift-value',shift);text('scale-forward',`${fmt(w)} × 2^${shift} = ${fmt(z)}`);
    text('scale-quantized',`Q(${fmt(z)}) = ${fmt(q)}`);text('scale-back',`${fmt(q)} / 2^${shift} = ${fmt(back)}`);
    text('scale-error',`Sai số tương đối: ${fmt(100*Math.abs(back-w)/Math.abs(w),4)}% · không scaling: ${fmt(100*Math.abs(original-w)/Math.abs(w),4)}%.`);
    const log = Math.log2(z), clamped = Math.max(-11,Math.min(3,log)), x=xMap(clamped);
    $('scale-dot').setAttribute('cx',x);$('scale-dot-label').setAttribute('x',x);$('scale-dot-label').setAttribute('text-anchor',x>1100?'end':'middle');
    text('scale-dot-label',`${log > 3 ? '→ ngoài trục · ' : ''}w·2ˢ = ${fmt(z)}`);
    $('scale-dot').classList.toggle('in-range',Math.abs(log)<=1);
  }
  for (const id of ['scale-input','scale-shift']) $(id).addEventListener('input',() => {stop('scale');scaleRender();});
  $('scale-play').onclick = () => play('scale',9,i=>{$('scale-shift').value=i;scaleRender();},1000);
  scaleRender();

  let quireStage=0;
  const trace=M.quireTrace();
  trace.forEach((r,i)=>{const e=document.createElement('span');e.className='term';e.textContent=fmt(r.term);e.dataset.termIndex=i;$('quire-terms').append(e);});
  function quireRender(stage=quireStage) {
    quireStage=Math.max(0,Math.min(trace.length-1,stage));const r=trace[quireStage];
    document.querySelectorAll('[data-term-index]').forEach((e,i)=>{e.classList.toggle('term-active',i===quireStage);e.classList.toggle('term-done',i<quireStage);});
    text('quire-progress',`Tích ${quireStage+1} / 10`);
    text('quire-fma-expression',`${fmt(quireStage ? trace[quireStage-1].fma:0)} + (${fmt(r.term)}) = ${fmt(r.unrounded)} → Q`);
    text('quire-wide-expression',`${fmt(quireStage ? trace[quireStage-1].wide:0)} + (${fmt(r.term)}) = ${fmt(r.wide)}`);
    text('quire-fma',fmt(r.fma));text('quire-wide',fmt(r.wide));
    text('quire-fma-error',`Sai lệch với tổng chính xác hiện tại: ${fmt(Math.abs(r.fma-r.wide))}`);
    text('quire-output',quireStage===9?`Chỉ làm tròn lúc xuất: Q(1) = ${fmt(r.output)}`:'Chưa làm tròn; giữ lại các đóng góp nhỏ.');
    text('quire-explanation',quireStage===0?'Bắt đầu với 8: hai cách cho cùng kết quả.':quireStage===9?'Sau triệt tiêu 8 và −8: FMA còn 0; quire giữ được 8 × 0,125 = 1.':'Từ 8 lên giá trị kế tiếp là 9: cộng 0,125 rồi làm tròn mỗi lần vẫn ra 8.');
  }
  document.querySelector('[data-demo-prev="quire"]').onclick=()=>{stop('quire');quireRender(quireStage-1);};
  document.querySelector('[data-demo-next="quire"]').onclick=()=>{stop('quire');quireRender(quireStage+1);};
  document.querySelector('[data-demo-play="quire"]').onclick=()=>play('quire',10,quireRender,1000);
  quireRender();

  let plamStage=0;
  function plamRender(stage=plamStage) {
    plamStage=Math.max(0,Math.min(2,stage));const a=Number($('plam-a').value),b=Number($('plam-b').value),p=M.plam(a,b);
    text('plam-a-value',fmt(a));text('plam-b-value',fmt(b));
    text('plam-log',`${fmt(a)} ; ${fmt(b)}`);text('plam-sum',`t = ${fmt(p.sum)}`);
    text('plam-carry',`c = ${p.carry}; f̂ = ${fmt(p.normalizedFraction)}`);
    text('plam-exact',fmt(p.exact));text('plam-approx',fmt(p.approx));text('plam-error',`${fmt(p.relativeError*100,4)}%`);
    document.querySelectorAll('[data-plam-stage]').forEach((e,i)=>e.classList.toggle('flow-active',i===plamStage));
    text('plam-progress',`Bước ${plamStage+1} / 3`);
    const details=[`Phép nhân phần định trị chính xác là (${fmt(1+a)}) × (${fmt(1+b)}). Xấp xỉ log₂(1+f) bằng f bỏ độ cong của log.`, `Cộng hai xấp xỉ: t=${fmt(p.sum)}. ${p.carry?'t≥1 nên chuyển 1 đơn vị sang số mũ.':'t<1 nên chưa cần carry sang số mũ.'}`, `Đảo ánh xạ tuyến tính từng đoạn: ${p.carry?'2t':'1+t'} = ${fmt(p.approx)}. Sai số max 1/9 ≈ 11,11% ở fA=fB=0,5, trước làm tròn posit.`];
    text('plam-explanation',details[plamStage]);
  }
  for (const id of ['plam-a','plam-b']) $(id).addEventListener('input',()=>{stop('plam');plamRender(2);});
  document.querySelector('[data-demo-prev="plam"]').onclick=()=>{stop('plam');plamRender(plamStage-1);};
  document.querySelector('[data-demo-next="plam"]').onclick=()=>{stop('plam');plamRender(plamStage+1);};
  document.querySelector('[data-demo-play="plam"]').onclick=()=>play('plam',3,plamRender,1500);
  plamRender();

  let trainingStage=0;
  function trainingRender(stage=trainingStage){
    trainingStage=stage;const mixed=$('training-config').value==='mixed';
    text('training-loss',mixed?'10-bit':'8-bit');text('training-optimizer',mixed?'12-bit':'8-bit');
    document.querySelectorAll('[data-train-stage]').forEach((e,i)=>e.classList.toggle('flow-active',i===stage));
    const descriptions=['Forward: trọng số và activation 8-bit; conv/linear của nhóm vẫn dùng FP32 rồi lượng tử hóa tensor.',`Loss: gradient logits được làm tròn ${mixed?'10':'8'}-bit; cross-entropy của nhóm vẫn tính FP32.`,`Backward: gradient 8-bit. Độ rộng lớn hơn ở optimizer không khôi phục được mọi thông tin đã mất ở gradient.`,mixed?'Optimizer: giữ master weight và momentum 12-bit giúp tăng độ phân giải của cập nhật. Đây là một thay đổi cấu hình, không chứng minh mọi gradient nhỏ đều được giữ.':'Optimizer 8-bit: bước η·v có thể nhỏ hơn độ phân giải quanh w nên cập nhật bị làm tròn mất.'];
    text('training-explanation',descriptions[stage]);
  }
  $('training-config').onchange=()=>{stop('training');trainingRender(0);};
  $('training-play').onclick=()=>play('training',4,trainingRender,1700);
  trainingRender();

  let sigmoidStage = 0;
  function sigmoidRender(stage = sigmoidStage) {
    sigmoidStage = stage;
    const v = M.fastSigmoid(Number($('sigmoid-code').value));
    const binary = n => n.toString(2).padStart(8,'0');
    text('sigmoid-input-bits', binary(v.bits)); text('sigmoid-x', `x = ${fmt(v.input)}`);
    text('sigmoid-xor', binary(v.xor)); text('sigmoid-output-bits', binary(v.code));
    text('sigmoid-exact',fmt(v.exact));text('sigmoid-approx',fmt(v.approx));text('sigmoid-error',fmt(v.error));
    document.querySelectorAll('[data-sigmoid-stage]').forEach((e,i)=>e.classList.toggle('flow-active',i===stage));
  }
  $('sigmoid-code').onchange=()=>{stop('sigmoid');sigmoidRender(0);};
  $('sigmoid-play').onclick=()=>play('sigmoid',3,sigmoidRender,1500);
  sigmoidRender();

  document.querySelectorAll('.evidence-view').forEach(view=>{
    view.querySelectorAll('[data-evidence]').forEach(button=>button.addEventListener('click',()=>{
      const key=button.dataset.evidence;
      view.querySelectorAll('[data-panel]').forEach(panel=>panel.hidden=panel.dataset.panel!==key);
      view.querySelectorAll('[data-evidence]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});
    }));
  });
  const dialog=$('chart-dialog');
  document.querySelectorAll('[data-zoom-src]').forEach(button=>button.addEventListener('click',()=>{
    [...timers.keys()].forEach(stop);
    $('chart-dialog-title').textContent=button.dataset.zoomTitle;
    $('chart-dialog-image').src=button.dataset.zoomSrc;
    $('chart-dialog-image').alt=button.dataset.zoomTitle;
    dialog.showModal();
  }));
  document.querySelectorAll('.chart-panel img').forEach(image=>image.addEventListener('click',()=>{image.closest('.evidence-view').querySelector('[data-zoom-src]').click();}));
  $('chart-dialog-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
});
