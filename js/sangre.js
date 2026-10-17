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
      wasHidden = !w,
      dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!cells.length || wasHidden || reduced.matches) populate();
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
      // Profundidad: los de atrás se ven más chicos y tenues.
      z: rand(),
      sq: 1,
    }));
    layers = [...cells].sort((a, b) => a.z - b.z);
    if (reduced.matches) settle();
  }
  let layers = [];
  // Sin animación, cada glóbulo toma directamente su forma final.
  function settle() {
    for (const c of cells) {
      c.deform = target(c);
      c.sq = squeezeAt(c);
    }
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
  // Cuánto se aprieta un glóbulo flexible en este punto del vaso (1 = nada).
  const squeezeAt = c => (c.deform < 0.3 ? half(c.x) / half(0) : 1);

  // Gradientes en unidades del radio: se crean una vez y se reusan con ctx.scale.
  const grads = new Map();
  function grad(key, stops, x0 = 0, y0 = 0) {
    let g = grads.get(key);
    if (!g) {
      g = ctx.createRadialGradient(x0, y0, 0, 0, 0, 1);
      stops.forEach(([o, col]) => g.addColorStop(o, col));
      grads.set(key, g);
    }
    return g;
  }
  // Disco bicóncavo: centro hundido y claro, reborde grueso más oscuro.
  const BODY = {
    normal: [
      [0, '#ee8590'],
      [0.3, '#e05467'],
      [0.58, '#cf2840'],
      [0.78, '#b8172f'],
      [0.92, '#8f0d25'],
      [1, '#5c0617'],
    ],
    thal1: [
      [0, '#f9b9c0'],
      [0.4, '#ee8592'],
      [0.68, '#d63c52'],
      [0.88, '#a2122b'],
      [1, '#62071a'],
    ],
    thal2: [
      [0, '#ffe3e6'],
      [0.5, '#f6b3bb'],
      [0.74, '#e0566a'],
      [0.9, '#a8162f'],
      [1, '#68081c'],
    ],
    // La medialuna no tiene hundimiento: es más pareja y oscura.
    rigid: [
      [0, '#d63249'],
      [0.6, '#b51830'],
      [0.88, '#8c0c24'],
      [1, '#560516'],
    ],
  };
  function cellShape(c, x, y, r) {
    const d = c.deform,
      sq = c.sq;
    ctx.save();
    ctx.translate(x, y);
    // Apretado en el capilar, el glóbulo flexible se alinea con el flujo.
    const align = 1 - (1 - sq) * 1.6;
    ctx.rotate(c.tilt * (1 - d) * Math.max(0, align) + d * (Math.sin(c.spin) * 0.6));
    // Los glóbulos sanos se estiran para pasar por la parte angosta; los rígidos no.
    ctx.scale(
      (r * (1 + 0.55 * d)) / Math.pow(sq, 0.7),
      r * (1 - 0.35 * d) * Math.pow(sq, 0.7) * 0.86,
    );
    const thal = kind === 'thal',
      bodyKey = d > 0.5 ? 'rigid' : thal ? (copies === 2 ? 'thal2' : 'thal1') : 'normal';
    const bx = 1.25 - 0.45 * d,
      by = -0.35 * d,
      br = 0.15 + 0.85 * d,
      // Medialuna: el disco con un «mordisco» que crece (recortado al disco).
      crescent = () => {
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, 7);
        ctx.clip();
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, 7);
        ctx.moveTo(bx + br, by);
        ctx.arc(bx, by, br, 0, 7);
      };
    // Sombra suave sobre el plasma.
    ctx.fillStyle = 'rgba(8,0,4,0.35)';
    ctx.save();
    ctx.translate(0.08, 0.16);
    if (d > 0.02) {
      crescent();
      ctx.fill('evenodd');
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 1.03, 0, 7);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = grad(bodyKey, BODY[bodyKey]);
    if (d > 0.02) {
      ctx.save();
      crescent();
      ctx.fill('evenodd');
      // Fibras de hemoglobina a lo largo de la medialuna.
      ctx.clip('evenodd');
      ctx.strokeStyle = `rgba(70,0,14,${0.45 * d})`;
      ctx.lineWidth = 0.05;
      ctx.beginPath();
      for (let k = 1; k <= 5; k++) {
        ctx.moveTo(bx + br + k * 0.17, by);
        ctx.arc(bx, by, br + k * 0.17, 0, 7);
      }
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,160,170,${0.18 * d})`;
      ctx.lineWidth = 0.035;
      ctx.beginPath();
      ctx.arc(bx, by, br + 0.1, 0, 7);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, 7);
      ctx.fill();
      // Brillo del reborde iluminado desde arriba.
      ctx.strokeStyle = 'rgba(255,190,198,0.28)';
      ctx.lineWidth = 0.09;
      ctx.beginPath();
      ctx.arc(0, 0, 0.8, Math.PI * 1.05, Math.PI * 1.75);
      ctx.stroke();
    }
    // Brillo húmedo, chiquito y suave.
    ctx.fillStyle = grad('spec', [
      [0, 'rgba(255,235,238,0.32)'],
      [1, 'rgba(255,235,238,0)'],
    ]);
    ctx.save();
    ctx.translate(-0.42, -0.5);
    ctx.scale(0.32, 0.2);
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, 7);
    ctx.fill();
    ctx.restore();
    // Hemoglobina C: un cristal oscuro adentro.
    if (kind === 'hbc' && copies === 2 && c.crystal < 0.7) {
      ctx.rotate(c.spin);
      ctx.fillStyle = '#5a0614';
      ctx.beginPath();
      const L = 0.55,
        T = 0.16;
      ctx.moveTo(-L, 0);
      ctx.lineTo(-L + T, -T);
      ctx.lineTo(L - T, -T);
      ctx.lineTo(L, 0);
      ctx.lineTo(L - T, T);
      ctx.lineTo(-L + T, T);
      ctx.closePath();
      ctx.fill();
      // Una cara del cristal refleja la luz.
      ctx.fillStyle = '#ff9aa733';
      ctx.beginPath();
      ctx.moveTo(-L, 0);
      ctx.lineTo(-L + T, -T);
      ctx.lineTo(L - T, -T);
      ctx.lineTo(L, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ff9aa766';
      ctx.lineWidth = 0.04;
      ctx.stroke();
    }
    ctx.restore();
  }
  // Fondo del vaso: se arma una vez por tamaño.
  let wallKey = '',
    tissue = null,
    plasma = null;
  function wallPaint(cy) {
    const key = w + 'x' + h;
    if (key === wallKey) return;
    wallKey = key;
    tissue = ctx.createLinearGradient(0, 0, 0, h);
    tissue.addColorStop(0, '#1d0712');
    tissue.addColorStop(0.5, '#33101f');
    tissue.addColorStop(1, '#1d0712');
    // El plasma se ve más hondo al centro y más claro contra la pared.
    plasma = ctx.createLinearGradient(0, cy - h * 0.34, 0, cy + h * 0.34);
    plasma.addColorStop(0, '#2c0918');
    plasma.addColorStop(0.18, '#1a050d');
    plasma.addColorStop(0.5, '#120309');
    plasma.addColorStop(0.82, '#1a050d');
    plasma.addColorStop(1, '#2c0918');
  }
  function vesselPath(cy) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) ctx.lineTo(x, cy - half(x));
    for (let x = w; x >= 0; x -= 6) ctx.lineTo(x, cy + half(x));
    ctx.closePath();
  }
  function draw(dt) {
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const cy = h / 2,
      r0 = Math.min(h * 0.13, 22) * (kind === 'thal' ? (copies === 2 ? 0.72 : 0.88) : 1);
    wallPaint(cy);
    // Pared del vaso, con volumen.
    ctx.fillStyle = tissue;
    ctx.fillRect(0, 0, w, h);
    vesselPath(cy);
    ctx.fillStyle = plasma;
    ctx.fill();
    ctx.strokeStyle = '#ff8aa01f';
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.strokeStyle = '#ff8aa070';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Movimiento: los glóbulos rígidos se frenan en la parte angosta y hacen fila.
    const jam = kind === 'sickle' && lowBox.checked && copies === 2;
    const order = [...cells].sort((a, b) => b.x - a.x);
    let barrier = Infinity;
    for (const c of order) {
      c.deform += (target(c) - c.deform) * Math.min(1, dt * (1.2 + 2 * c.threshold));
      // Perfil de velocidad: el centro del vaso corre más que los bordes.
      const flow = 1 - 0.45 * (c.y / 0.45) ** 2;
      let x = c.x + c.speed * flow * dt * (1 - 0.3 * c.deform);
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
      // Elasticidad: se aprieta y recupera la forma con un poco de demora.
      c.sq += (squeezeAt(c) - c.sq) * Math.min(1, dt * 7);
    }
    for (const c of layers) {
      const r = r0 * (0.8 + 0.2 * c.z),
        limit = half(c.x) - r * 0.9;
      ctx.globalAlpha = 0.6 + 0.4 * c.z;
      cellShape(c, c.x, cy + c.y * Math.max(0, limit), r);
    }
    ctx.globalAlpha = 1;
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
