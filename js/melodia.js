// Cómo suena: un tramo de la proteína tocado como melodía, normal y con tu cambio.
// Arriba están las piezas que tienen carga eléctrica (agudas) y abajo las que huyen del agua (graves).
(() => {
  'use strict';
  const canvas = document.getElementById('melody');
  if (!canvas) return;
  const G = Genetics,
    ctx = canvas.getContext('2d'),
    caption = document.getElementById('melody-caption'),
    buttons = [...document.querySelectorAll('[data-melody]')],
    FONT = "'Segoe UI Variable Text', Aptos, 'Segoe UI', system-ui, sans-serif",
    LENGTH = 24;
  let w = 0,
    h = 0,
    result = null,
    first = 1,
    playing = null,
    cursor = -1;

  function resize() {
    const r = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  new ResizeObserver(resize).observe(canvas);

  // Las notas de un tramo: { aa } por pieza, { stop } donde se corta y nada después.
  function notes(which) {
    const out = [];
    for (let k = first; k < first + LENGTH && k <= 146; k++) {
      if (which === 'normal' || !result) {
        out.push({ aa: G.EXPECTED[k], k });
        continue;
      }
      if (result.startLost) out.push({ k });
      else if (k < result.protein.length) out.push({ aa: result.protein[k], k });
      else if (k === result.protein.length && !result.lengthUnknown) out.push({ stop: true, k });
      else out.push({ k });
    }
    return out;
  }
  function describe() {
    const r = result;
    if (!r)
      return 'Cada pieza es una nota: las que huyen del agua suenan <b>graves</b> y las que tienen carga eléctrica, <b>agudas</b>. Hacé un cambio en el ADN para comparar.';
    if (r.startLost) return '<b>Silencio:</b> sin la señal de inicio, la proteína no se fabrica.';
    if (r.effect === 'synonymous')
      return '<b>Suenan igual:</b> cambió una letra, pero no la pieza.';
    if (r.effect === 'missense') {
      const old = G.EXPECTED[r.piece],
        neu = r.protein[r.piece];
      return `Una sola nota distinta: la pieza ${r.piece} pasa de <b>${G.names[old]}</b> (${Sound.noteName(old)}) a <b>${G.names[neu]}</b> (${Sound.noteName(neu)}).${old === 'E' && neu === 'V' ? ' Salta de aguda a grave: la valina huye del agua y por eso se pega a otras hemoglobinas.' : ''}`;
    }
    if (r.effect === 'nonsense')
      return `La melodía <b>se corta</b> en la pieza ${r.mature.length + 1}: ahí está el STOP.`;
    if (r.effect === 'stop-loss')
      return 'Al final, en vez de terminar, la melodía seguiría con notas que no conocemos.';
    return 'Después del cambio, <b>la melodía es otra</b>: todas las notas que siguen se corrieron.';
  }
  function update() {
    result = GenomaLab.result;
    first = result ? Math.max(1, Math.min(146 - LENGTH + 1, result.piece - 7)) : 1;
    buttons.forEach(b => (b.disabled = b.dataset.melody !== 'normal' && !result));
    caption.innerHTML = describe();
    stop();
    draw();
  }
  const ROWS = Sound.ORDER.length;
  function lane(list, top, height, label, compare) {
    const left = 56,
      cell = (w - left - 10) / LENGTH,
      row = height / ROWS;
    ctx.fillStyle = '#ffffff08';
    ctx.fillRect(left, top, w - left - 10, height);
    ctx.fillStyle = '#c2bdea';
    ctx.font = `700 12px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 6, top + height / 2);
    list.forEach((n, i) => {
      const x = left + i * cell;
      if (n.stop) {
        ctx.fillStyle = '#ff5d6c';
        ctx.fillRect(x + 1, top, 3, height);
        ctx.font = `800 11px ${FONT}`;
        ctx.fillText('STOP', x + 6, top + 10);
        return;
      }
      if (!n.aa) return;
      const pitch = Sound.ORDER.indexOf(n.aa),
        y = top + height - (pitch + 1) * row,
        differs = compare && compare[i]?.aa !== n.aa,
        active = playing?.lane === label && cursor === i;
      ctx.fillStyle = differs
        ? result.effect === 'frameshift'
          ? '#ffb020'
          : '#ff5d6c'
        : '#4fd8ff';
      ctx.globalAlpha = active ? 1 : compare && !differs ? 0.45 : 0.9;
      ctx.beginPath();
      ctx.roundRect(x + 1.5, y, Math.max(3, cell - 3), Math.max(4, row * 1.1), 3);
      ctx.fill();
      if (active) {
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    });
    if (playing?.lane === label && cursor >= 0) {
      ctx.strokeStyle = '#ffd447';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left + (cursor + 0.5) * cell, top - 3);
      ctx.lineTo(left + (cursor + 0.5) * cell, top + height + 3);
      ctx.stroke();
    }
  }
  function draw() {
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const normal = notes('normal'),
      gap = 18,
      laneH = result ? (h - gap - 22) / 2 : h - 30;
    lane(normal, 6, laneH, 'Normal');
    if (result) lane(notes('mutated'), 6 + laneH + gap, laneH, 'Tu cambio', normal);
    ctx.fillStyle = '#c2bdea';
    ctx.font = `600 11px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Piezas ${first}–${first + LENGTH - 1}`, 56, h - 8);
    ctx.textAlign = 'right';
    ctx.fillText(
      w > 420 ? '↑ con carga eléctrica · ↓ huyen del agua' : '↑ carga · ↓ agua',
      w - 10,
      h - 8,
    );
  }
  function stop() {
    const was = playing;
    playing = null;
    cursor = -1;
    if (was) Sound.stop();
  }
  function play(which, then) {
    const steps = notes(which === 'normal' ? 'normal' : 'mutated');
    const token = { lane: which === 'normal' ? 'Normal' : 'Tu cambio' };
    playing = token;
    const ok = Sound.melody(steps, {
      tempo: 6,
      onStep: i => {
        if (playing !== token) return;
        cursor = i;
        draw();
      },
      // Si se cortó porque empezó otra melodía, no sigue con «las dos».
      onEnd: () => {
        if (playing !== token) return;
        playing = null;
        cursor = -1;
        draw();
        then?.();
      },
    });
    if (!ok) GenomaLab.notify('Este navegador no puede generar sonido.');
  }
  buttons.forEach(
    b =>
      (b.onclick = () => {
        if (!Sound.enabled) {
          GenomaLab.notify('El sonido está apagado: prendelo con el botón del parlante, arriba.');
          return;
        }
        stop();
        const which = b.dataset.melody;
        if (which === 'both') play('normal', () => setTimeout(() => play('mutated'), 350));
        else play(which);
      }),
  );
  document.addEventListener('genoma:resultado', update);
  document.addEventListener('genoma:limpio', update);
  document.addEventListener('genoma:sonido', e => !e.detail && stop());
  update();
})();
