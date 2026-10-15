// En la sangre: cómo se ven los glóbulos rojos en los casos que la ciencia ya conoce.
// Falciforme: con poco oxígeno se vuelven medialunas rígidas y se traban. Hemoglobina C: cristales adentro.
// Talasemia (STOP, sin inicio o corrimiento): menos glóbulos, chicos y pálidos. Para el resto: no se sabe.
// Es una ilustración: el simulador no calcula la forma de las células.
(() => {
  'use strict';
  const canvas = document.getElementById('blood');
  if (!canvas) return;
  const ctx = canvas.getContext('2d'),
    caption = document.getElementById('blood-caption'),
    lowBox = document.getElementById('blood-low'),
    copyButtons = [...document.querySelectorAll('[data-copies]')],
    reduced = matchMedia('(prefers-reduced-motion: reduce)'),
    FONT = "'Segoe UI Variable Text', Aptos, 'Segoe UI', system-ui, sans-serif";
  let w = 0,
    h = 0,
    visible = false,
    copies = 2,
    kind = 'normal',
    result = null,
    cells = [],
    lastTime = 0;
  let seed = 3;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function resize() {
    const r = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!cells.length || reduced.matches) populate();
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  // Qué se sabe de este cambio.
  function profile(r) {
    if (!r || r.effect === 'synonymous') return 'normal';
    if (r.realCase?.id === 'sickle') return 'sickle';
    if (r.realCase?.id === 'hbc') return 'hbc';
    if (['nonsense', 'start-loss', 'frameshift'].includes(r.effect)) return 'thal';
    if (r.effect === 'stop-loss') return 'unknown';
    if (r.species) return 'species';
    return 'unknown';
  }
  const TEXTS = {
    normal: () =>
      result
        ? 'Tu cambio no modifica la proteína: los glóbulos rojos quedan <b>normales</b>, discos flexibles que se doblan para pasar por los vasos más finos.'
        : 'Glóbulos rojos normales: <b>discos flexibles</b> que se doblan para pasar por los vasos más finos.',
    sickle: () =>
      copies === 1
        ? 'Con <b>una copia</b> (portador), la mitad de la hemoglobina es normal y alcanza: los glóbulos se ven casi siempre redondos. Y además protege contra la malaria.'
        : lowBox.checked
          ? 'Con dos copias y <b>poco oxígeno</b>, la hemoglobina forma fibras: los glóbulos se vuelven <b>medialunas rígidas</b> y se traban en los vasos finos. Eso causa dolor y anemia.'
          : 'Con dos copias y bastante oxígeno, los glóbulos todavía se ven redondos. Activá <b>poco oxígeno</b> (como al hacer ejercicio o en la altura) y mirá qué pasa.',
    hbc: () =>
      copies === 1
        ? 'Con una copia de la hemoglobina C casi no se nota nada.'
        : 'Con dos copias, la hemoglobina C forma <b>cristales</b> dentro del glóbulo: se vuelven más rígidos y duran menos. Suele dar una anemia leve.',
    thal: () =>
      copies === 1
        ? 'Con una copia (como en la talasemia menor), los glóbulos salen <b>un poco más chicos y claros</b>, casi sin síntomas.'
        : 'Si las dos copias tienen un cambio así, casi no se fabrica cadena beta útil: hay <b>menos glóbulos, más chicos y pálidos</b>. Es lo que pasa en la beta-talasemia mayor.',
    species: () =>
      `Este cambio existe en la naturaleza: lo tiene ${result.species.id === 'llama' ? 'la llama' : 'el mamut lanudo'}, y su sangre funcionaba bien en su ambiente. En personas no se sabe qué haría.`,
    unknown: () =>
      result?.effect === 'stop-loss'
        ? 'Sin el STOP, la cadena podría salir más larga. <b>No sabemos</b> cómo afectaría a la sangre.'
        : 'Para la mayoría de los cambios de una pieza <b>no se sabe</b> qué pasa: se conocen cientos de variantes de la hemoglobina; algunas no se notan y otras causan enfermedades.',
  };
  function update() {
    result = GenomaLab.result;
    const next = profile(result);
    if (next !== kind) {
      kind = next;
      if (kind !== 'sickle') lowBox.checked = false;
      populate();
    }
    lowBox.disabled = kind !== 'sickle';
    lowBox.closest('label').classList.toggle('disabled', lowBox.disabled);
    const twoKinds = ['sickle', 'hbc', 'thal'].includes(kind);
    copyButtons.forEach(b => {
      b.disabled = !twoKinds;
      const on = Number(b.dataset.copies) === copies;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    caption.innerHTML = TEXTS[kind]();
    canvas.setAttribute('aria-label', caption.textContent);
    if (reduced.matches) settle();
  }
  // Arma los glóbulos de la escena. En la talasemia hay menos.
  function populate() {
    const thal = kind === 'thal',
      n = thal && copies === 2 ? 8 : thal ? 12 : 14;
    seed = 3;
    cells = Array.from({ length: n }, (_, i) => ({
      x: (i / n) * (w + 80) - 40,
      y: (rand() - 0.5) * 0.9,
      tilt: (rand() - 0.5) * 0.8,
      speed: 34 + rand() * 18,
      threshold: rand(),
      deform: 0,
      crystal: rand(),
      spin: rand() * 6,
    }));
    if (reduced.matches) settle();
  }
  // Sin animación, cada glóbulo toma directamente su forma final.
  function settle() {
    for (const c of cells) c.deform = target(c);
    draw(0);
  }
  function target(c) {
    if (kind !== 'sickle' || !lowBox.checked) return 0;
    return copies === 2 ? (c.threshold < 0.9 ? 1 : 0.4) : c.threshold < 0.08 ? 0.6 : 0;
  }
  // El vaso se angosta en un punto, como un capilar.
  const waistX = () => w * 0.7,
    half = x => {
      const base = h * 0.34,
        narrow = h * 0.2,
        d = (x - waistX()) / (w * 0.16);
      return base - (base - narrow) * Math.exp(-d * d);
    };
  function cellShape(c, x, y, r) {
    const d = c.deform,
      squeeze = d < 0.3 ? half(x) / half(0) : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(c.tilt * (1 - d) + d * (Math.sin(c.spin) * 0.6));
    // Los glóbulos sanos se estiran para pasar por la parte angosta; los rígidos no.
    ctx.scale((1 + 0.55 * d) / Math.sqrt(squeeze), (1 - 0.35 * d) * Math.sqrt(squeeze) * 0.86);
    const thal = kind === 'thal',
      pale = thal ? (copies === 2 ? 1 : 0.5) : 0,
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, pale ? `rgba(255,214,220,${0.6 + 0.3 * pale})` : '#f2707f');
    g.addColorStop(pale ? 0.62 : 0.42, pale ? '#e35c70' : '#d3263f');
    g.addColorStop(0.85, d > 0.5 ? '#9c0f28' : '#b5132e');
    g.addColorStop(1, '#7c0a20');
    ctx.fillStyle = g;
    if (d > 0.02) {
      // Medialuna: el disco con un «mordisco» que crece.
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 7);
      ctx.save();
      ctx.clip();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 7);
      ctx.arc(r * (1.25 - 0.45 * d), -r * 0.35 * d, r * (0.15 + 0.85 * d), 0, 7);
      ctx.fill('evenodd');
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 7);
      ctx.fill();
    }
    // Hemoglobina C: un cristal oscuro adentro.
    if (kind === 'hbc' && copies === 2 && c.crystal < 0.7) {
      ctx.rotate(c.spin);
      ctx.fillStyle = '#5a0614';
      ctx.beginPath();
      const L = r * 0.55,
        T = r * 0.16;
      ctx.moveTo(-L, 0);
      ctx.lineTo(-L + T, -T);
      ctx.lineTo(L - T, -T);
      ctx.lineTo(L, 0);
      ctx.lineTo(L - T, T);
      ctx.lineTo(-L + T, T);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ff9aa766';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }
  function draw(dt) {
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const cy = h / 2,
      r0 = Math.min(h * 0.13, 22) * (kind === 'thal' ? (copies === 2 ? 0.72 : 0.88) : 1);
    // Pared del vaso.
    ctx.fillStyle = '#2a0b18';
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) ctx.lineTo(x, cy - half(x));
    for (let x = w; x >= 0; x -= 6) ctx.lineTo(x, cy + half(x));
    ctx.closePath();
    ctx.fillStyle = '#16040b';
    ctx.fill();
    ctx.strokeStyle = '#ff8aa066';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Movimiento: los glóbulos rígidos se frenan en la parte angosta y hacen fila.
    const jam = kind === 'sickle' && lowBox.checked && copies === 2;
    const order = [...cells].sort((a, b) => b.x - a.x);
    let barrier = Infinity;
    for (const c of order) {
      c.deform += (target(c) - c.deform) * Math.min(1, dt * (1.2 + 2 * c.threshold));
      let x = c.x + c.speed * dt * (1 - 0.3 * c.deform);
      if (jam && c.deform > 0.6 && c.x < waistX()) {
        const stopAt = Math.min(barrier, waistX() - r0 * 1.2);
        // Cada tanto uno logra pasar.
        if (x > stopAt && c.threshold > 0.12) x = Math.max(c.x, stopAt);
        barrier = x - r0 * 1.7;
      }
      c.x = x;
      if (c.x > w + 40) {
        c.x = -40 - rand() * 30;
        c.deform = 0;
        c.y = (rand() - 0.5) * 0.9;
      }
    }
    for (const c of cells) {
      const limit = half(c.x) - r0 * 0.9;
      cellShape(c, c.x, cy + c.y * Math.max(0, limit), r0);
    }
    if (kind === 'unknown') {
      ctx.fillStyle = '#ffffffcc';
      ctx.font = `800 ${h * 0.35}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.18;
      ctx.fillText('?', w / 2, cy + 4);
      ctx.globalAlpha = 1;
    }
  }
  function frame(time) {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    if (visible && !document.hidden && canvas.offsetParent && !reduced.matches) draw(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  copyButtons.forEach(
    b =>
      (b.onclick = () => {
        copies = Number(b.dataset.copies);
        populate();
        update();
      }),
  );
  lowBox.onchange = update;
  document.addEventListener('genoma:resultado', update);
  document.addEventListener('genoma:limpio', update);
  update();
})();
