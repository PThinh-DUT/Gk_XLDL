/* Content is local; impress.js handles presentation positioning and navigation. */
(() => {
  const steps = [...document.querySelectorAll('.step')];
  const root = document.getElementById('impress');
  const params = new URLSearchParams(location.search);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) root.dataset.transitionDuration = '0';
  let api;
  let current = steps[0];
  const speaker = document.getElementById('speaker');
  const notes = document.getElementById('notes');
  function update(step) {
    current = step;
    const index = steps.indexOf(step);
    document.getElementById('counter').textContent = `${index + 1} / ${steps.length}`;
    speaker.textContent = step.querySelector('.notes').textContent;
    steps.forEach(s => {
      const inactive = s !== step && !document.body.classList.contains('reading');
      s.setAttribute('aria-hidden', String(inactive));
      s.inert = inactive;
    });
  }
  document.addEventListener('impress:stepenter', event => update(event.target));
  if (typeof impress === 'function') {
    api = impress();
    api.init();
    update(document.querySelector('.step.active') || steps[0]);
  }
  const move = direction => {
    const target = steps[steps.indexOf(current) + direction];
    if (target && api) api.goto(target);
  };
  document.getElementById('prev').addEventListener('click', () => move(-1));
  document.getElementById('next').addEventListener('click', () => move(1));
  function toggleNotes() {
    speaker.hidden = !speaker.hidden;
    notes.setAttribute('aria-pressed', String(!speaker.hidden));
  }
  notes.addEventListener('click', toggleNotes);
  document.getElementById('read').addEventListener('click', () => {
    const reading = document.body.classList.toggle('reading');
    document.getElementById('read').textContent = reading ? 'Trình chiếu' : 'Đọc / in';
    if (reading) steps.forEach(s => { s.inert = false; s.removeAttribute('aria-hidden'); });
    else { update(current); api?.goto(current, 0); }
  });
  document.getElementById('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* Fullscreen may be unavailable; the deck remains usable. */ }
  });
  document.addEventListener('keydown', event => {
    if (event.target.closest('button,input,textarea,select') || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.toLowerCase() === 'n') toggleNotes();
    if (event.key === 'Home') { event.preventDefault(); api?.goto(steps[0]); }
    if (event.key === 'End') { event.preventDefault(); api?.goto(steps.at(-1)); }
  });
  // Avoid two navigation handlers (button activation + impress keyboard plugin).
  for (const type of ['keydown', 'keyup']) document.querySelector('.controls').addEventListener(type, e => e.stopPropagation());
  if (params.has('read') || params.has('print')) document.getElementById('read').click();
})();
