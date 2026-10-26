/* Additional numerical explanations. Explicit playback only; no benchmark claims. */
document.addEventListener('DOMContentLoaded', () => {
  const M=globalThis.PositDemo, $=id=>document.getElementById(id);
  const timers=new Map(), reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt=x=>{if(x!==0&&(Math.abs(x)<.0001||Math.abs(x)>1e7))return x.toExponential(4);return Number(x.toPrecision(7)).toLocaleString('vi-VN',{maximumFractionDigits:9});};
  const text=(id,v)=>{$(id).textContent=v;}, bin=(b,n=8)=>b.toString(2).padStart(n,'0');
  function button(id){return document.querySelector(`[data-deep-play="${id}"]`)||$(`${id}-play`);}
  function stop(id){clearInterval(timers.get(id));timers.delete(id);if(button(id))button(id).textContent=id==='es'?'Lần lượt so sánh es':'Chạy minh họa';}
  function play(id,count,render,delay=1500){
    if(timers.has(id)){stop(id);return;}
    let frame=0;render(frame);button(id).textContent='Tạm dừng';
    timers.set(id,setInterval(()=>{render(++frame);if(frame===count-1)stop(id);},reduced?2000:delay));
  }
  document.addEventListener('impress:stepleave',()=>[...timers.keys()].forEach(stop));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)[...timers.keys()].forEach(stop);});
  for(const event of ['keydown','keyup'])document.addEventListener(event,e=>{
    if(e.target.closest('.deep-demo')&&e.target.closest('button,input,select'))e.stopPropagation();
  },true);

  let roundStage=0;
  function renderRound(stage=roundStage,manualX){
    roundStage=Math.max(0,Math.min(4,stage));
    const r=M.roundingCase(Number($('round-case').value),2);
    const frames=[r.low+(r.threshold-r.low)*.4,r.threshold-(r.threshold-r.low)*.01,r.threshold,r.threshold+(r.high-r.threshold)*.01,r.high];
    const x=manualX===undefined?frames[roundStage]:manualX;
    const t=(r.threshold-r.low)/(r.high-r.low),p=(x-r.low)/(r.high-r.low);
    const q=M.quantize(x,8,2),tie=x===r.threshold;
    $('round-position').value=Math.round(p*1000);
    text('round-x',`x = ${fmt(x)}`);text('round-low',fmt(r.low));text('round-high',fmt(r.high));
    text('round-threshold',fmt(r.threshold));text('round-low-code',bin(r.lower));text('round-high-code',bin(r.upper));
    text('round-extended',bin((r.lower<<1)|1,9));
    $('round-dot').setAttribute('cx',100+1120*p);
    const tx=100+1120*t;
    for(const a of ['x1','x2'])$('round-threshold-line').setAttribute(a,tx);
    $('round-threshold-label').setAttribute('x',tx);
    $('round-threshold-label').setAttribute('text-anchor',tx<280?'start':tx>1040?'end':'middle');
    text('round-threshold-label','Ngưỡng bit');
    text('round-explain',tie?`Đúng ngưỡng: chọn mã ${bin(r.tieCode)} chẵn → ${fmt(q)}. Trung điểm số học = ${fmt(r.arithmeticMidpoint)}.`:`x ${x<r.threshold?'<':'>'} ngưỡng bit → chọn ${q===r.low?'mã dưới':'mã trên'} = ${fmt(q)}. Trung điểm số học = ${fmt(r.arithmeticMidpoint)}${r.threshold!==r.arithmeticMidpoint?' ≠ ngưỡng bit.':', trùng ngưỡng trong cặp mã này.'}`);
    text('round-progress',manualX===undefined?`Bước ${roundStage+1} / 5`:'Đang điều chỉnh x');
    document.querySelectorAll('#deep-round-demo .deep-three>div').forEach((e,i)=>e.classList.toggle('deep-selected',i===0&&q===r.low||i===2&&q===r.high));
  }
  $('round-case').onchange=()=>{stop('round');renderRound(0);};
  $('round-position').oninput=()=>{stop('round');const r=M.roundingCase(Number($('round-case').value),2);renderRound(roundStage,r.low+(r.high-r.low)*Number($('round-position').value)/1000);};
  $('round-tie').onclick=()=>{stop('round');renderRound(2);};
  document.querySelector('[data-deep-prev="round"]').onclick=()=>{stop('round');renderRound(roundStage-1);};
  document.querySelector('[data-deep-next="round"]').onclick=()=>{stop('round');renderRound(roundStage+1);};
  button('round').onclick=()=>play('round',5,renderRound);
  renderRound();

  let esStage=0;
  function renderEs(stage=esStage){
    esStage=stage;const x=Number($('es-x').value);
    const rows=[0,1,2].map(es=>{
      const p=M.formatProbe(x,es);
      const allocations=p.special?'Mã đặc biệt':`Regime ${p.regime.length} · Exponent ${p.exponentBits.length} · Fraction ${p.fractionBits.length} bit`;
      return `<div class="es-row ${stage===es?'deep-selected':''}"><div><h3>es = ${es}</h3><small>min ${fmt(p.min)}<br>max ${fmt(p.max)}</small></div><div class="es-range"><div class="range-bar" style="width:${(2**es)*25}%"></div><small>log₂: −${6*2**es} … +${6*2**es}</small></div><div><code>${bin(p.bits)}</code><p>${allocations}</p></div><div><strong>Q(x) = ${fmt(p.quantized)}</strong><p>Sai số ${fmt(p.relativeError*100)}%</p></div></div>`;
    });
    $('es-rows').innerHTML=rows.join('');
    const p=M.formatProbe(x,stage);
    text('es-explain',`Đang xét es=${stage}: dải động ±${6*2**stage} bậc log₂. ${p.special?'':`Mã của Q(x) còn ${p.fractionBits.length} bit fraction tại giá trị này.`} es lớn giúp tránh bão hòa nhưng không bảo đảm sai số nhỏ hơn.`);
  }
  $('es-x').onchange=()=>{stop('es');renderEs();};button('es').onclick=()=>play('es',3,renderEs,2000);renderEs();

  let updateStage=0;
  const trace=M.optimizerTrace(12);
  function renderUpdate(stage=updateStage){
    updateStage=Math.max(0,Math.min(12,stage));
    const r=updateStage?trace[updateStage-1]:{pure:1,master:1,forward:1,pureRaw:1,delta:1/256};
    text('update-pure',fmt(r.pure));text('update-master',fmt(r.master));text('update-forward',fmt(r.forward));
    text('update-pure-detail',updateStage?`1 − δ = ${fmt(1-1/256)} → Q₈ = 1`:'Chưa có bước cập nhật.');
    text('update-master-detail',`Giữ được ${updateStage} × δ = ${fmt(1-r.master)}`);
    text('update-forward-detail',r.forward===1?'Chưa đủ để đổi mã forward.':'Mã forward đã đổi sau khi master tích lũy đủ.');
    text('update-progress',`${updateStage} / 12`);$('update-step').value=updateStage;
    const pts=[[100,25],...trace.slice(0,updateStage).map((p,i)=>[100+(i+1)/12*1120,25+(1-p.master)/(.05)*100])];
    $('update-master-line').setAttribute('points',pts.map(p=>p.join(',')).join(' '));
    const last=pts.at(-1);$('update-master-dot').setAttribute('cx',last[0]);$('update-master-dot').setAttribute('cy',last[1]);
    text('update-explain',updateStage===0?'Độ phân giải quanh w quyết định cập nhật có được giữ lại. Cùng δ, hai cách lưu trạng thái có thể khác nhau.':updateStage<9?'Master 12-bit giảm dần dù bản forward 8-bit vẫn là 1. Nếu ghi đè master bằng forward, toàn bộ cập nhật nhỏ này sẽ mất.':'Từ bước 9, Q₈(master) giảm xuống 0,9375. Đây là cơ chế giữ trạng thái tích lũy, không phải gradient tự lớn lên.');
  }
  $('update-step').oninput=()=>{stop('update');renderUpdate(Number($('update-step').value));};
  button('update').onclick=()=>play('update',13,renderUpdate,900);renderUpdate();

  let productStage=0;
  function renderProduct(stage=productStage){
    productStage=Math.max(0,Math.min(3,stage));
    const [a,b]=$('product-case').value.split(',').map(Number),p=M.plamProduct(a,b,1);
    const output=M.decode(p.outputCode,8,1);
    text('product-decode',`A=${fmt(p.a.value)}: k=${p.a.k}, e=${p.a.exponent}, f=${fmt(p.a.fraction)}\nB=${fmt(p.b.value)}: k=${p.b.k}, e=${p.b.exponent}, f=${fmt(p.b.fraction)}`);
    text('product-scale',`Dấu = ${p.sign<0?'âm':'dương'}\nE_A = 2k_A+e_A = ${p.scaleA}\nE_B = 2k_B+e_B = ${p.scaleB}`);
    text('product-normalize',`f_A+f_B = ${fmt(p.sum)}\ncarry = ${p.carry}; f̂ = ${fmt(p.normalizedFraction)}\nE = ${p.scaleA}+${p.scaleB}+${p.carry} = ${p.scale}`);
    text('product-code',`${bin(p.outputCode)}\nk=${output.k}, e=${output.exponent}\nf=${fmt(output.fraction)}`);
    text('product-exact',fmt(p.exact));text('product-approx',fmt(p.approx));text('product-output',fmt(p.roundedApprox));
    text('product-error',`Sai số xấp xỉ ${fmt(100*p.relativeError)}%`);text('product-rounded-exact',`Nếu nhân chính xác rồi Q: ${fmt(p.roundedExact)}`);
    const descriptions=[`Giải mã độ lớn, xử lý dấu riêng: x = (−1)^s · 2^(2k+e) · (1+f) với es=1.`,`Bộ nhân phần định trị được thay bằng xấp xỉ log; phần scale vẫn cần cộng và dấu vẫn cần XOR.`,p.carry?'Tổng phần lẻ ≥1: chuyển carry sang scale, chỉ giữ phần lẻ còn lại. Bỏ carry sẽ cho kết quả sai.':'Tổng phần lẻ <1: không có carry; giữ scaleA + scaleB.',Math.abs(p.approx)>4096?'Tích vượt maxpos=4096: bão hòa. Hai đầu ra cùng bằng 4096 không có nghĩa tích thực được bảo toàn.':`Sau lượng tử hóa: PLAM → ${fmt(p.roundedApprox)}, nhân chính xác → ${fmt(p.roundedExact)}. Phải tách sai số xấp xỉ khỏi sai số mã hóa.`];
    text('product-explain',descriptions[productStage]);text('product-progress',`Bước ${productStage+1} / 4`);
    document.querySelectorAll('[data-product-stage]').forEach((e,i)=>e.classList.toggle('deep-selected',i===productStage));
  }
  $('product-case').onchange=()=>{stop('product');renderProduct(0);};
  document.querySelector('[data-deep-prev="product"]').onclick=()=>{stop('product');renderProduct(productStage-1);};
  document.querySelector('[data-deep-next="product"]').onclick=()=>{stop('product');renderProduct(productStage+1);};
  button('product').onclick=()=>play('product',4,renderProduct,1800);renderProduct();
});
