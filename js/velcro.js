// El velcro de la anemia falciforme: por qué una sola pieza cambia todo.
// La valina 6 (los «ganchitos») se pega en un bolsillo de otra hemoglobina (piezas 85 y 88, los «pelitos»).
// Ese bolsillo solo queda al descubierto cuando la hemoglobina soltó su oxígeno: ahí se arman las fibras
// que estiran el glóbulo rojo hasta dejarlo con forma de medialuna. Es un esquema, no una simulación molecular.
(() => {
  'use strict';
  const canvas = document.getElementById('velcro-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d'),
    caption = document.getElementById('velcro-caption'),
    low = document.getElementById('velcro-low'),
    buttons = [...document.querySelectorAll('[data-velcro]')],
    reduced = matchMedia('(prefers-reduced-motion: reduce)'),
    N = 24;
  let w = 0,
    h = 0,
    visible = false,
    piece = 'V',
    lastTime = 0,
    bend = 0;
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const mols = Array.from({ length: N }, () => ({
    x: (rand() - 0.5) * 1.2,
    y: (rand() - 0.5) * 1.2,
    a: rand() * Math.PI * 2,
    vx: 0,
    vy: 0,
    lock: 0,
  }));

  function resize() {
    const r = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduced.matches) settle();
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  // Forma final de medialuna: el disco (radio 1) menos un «mordisco» circular.
  const BITE = { x: 0.95, y: -0.35, r: 0.95 };
  // Lugares de las fibras: tres filas paralelas siguiendo la curva de la medialuna.
  const slots = (() => {
    const out = [];
    for (const k of [0.2, 0.42, 0.64]) {
      const radius = BITE.r + k * 0.6;
      for (let t = 0; t < 24; t++) {
        const angle = Math.PI * 0.62 + (t / 23) * Math.PI * 1.02,
          x = BITE.x + Math.cos(angle) * radius,
          y = BITE.y + Math.sin(angle) * radius;
        if (Math.hypot(x, y) < 0.86) out.push({ x, y, a: angle + Math.PI / 2 });
      }
    }
    // Se eligen N lugares repartidos para que las fibras se vean continuas.
    const step = out.length / N;
    return Array.from({ length: N }, (_, i) => out[Math.floor(i * step)]);
  })();
  const sticky = () => piece === 'V' && low.checked;

  function update() {
    buttons.forEach(b => {
      const on = b.dataset.velcro === piece;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    caption.innerHTML =
      piece === 'E'
        ? 'Con <b>glutamato</b>, la pieza 6 tiene carga y le gusta el agua: no tiene ganchitos. Aunque el bolsillo se abra, las hemoglobinas no se pegan y el glóbulo queda redondo.'
        : !low.checked
          ? 'Con oxígeno, la hemoglobina tiene el bolsillo <b>cerrado</b>: la valina no tiene dónde engancharse. Activá <b>poco oxígeno</b>.'
          : 'Sin oxígeno, el bolsillo se abre y la <b>valina se engancha</b> en la hemoglobina vecina. Se arman fibras largas que estiran el glóbulo: así aparece la <b>medialuna</b>.';
    canvas.setAttribute('aria-label', caption.textContent);
    if (reduced.matches) settle();
  }
  function settle() {
    const on = sticky();
    mols.forEach((m, i) => {
      if (on) Object.assign(m, slots[i], { lock: 1 });
      else m.lock = 0;
    });
    bend = on ? 1 : 0;
    draw();
  }
  function step(dt) {
    const on = sticky();
    let locked = 0;
    mols.forEach((m, i) => {
      if (on) {
        // Cada hemoglobina va hacia su lugar en la fibra, una detrás de otra.
        const s = slots[i],
          ready = m.lock > 0 || Math.random() < dt * 1.6;
        if (ready) {
          m.lock = Math.min(1, m.lock + dt * 0.9);
          m.x += (s.x - m.x) * dt * 3;
          m.y += (s.y - m.y) * dt * 3;
          const da = Math.atan2(Math.sin(s.a - m.a), Math.cos(s.a - m.a));
          m.a += da * dt * 4;
        }
      } else m.lock = Math.max(0, m.lock - dt * 1.5);
      locked += m.lock;
      if (m.lock < 0.5) {
        // Movimiento al azar (browniano) dentro del glóbulo.
        m.vx += (Math.random() - 0.5) * dt * 2.4;
        m.vy += (Math.random() - 0.5) * dt * 2.4;
        m.vx *= 0.96;
        m.vy *= 0.96;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.a += (Math.random() - 0.5) * dt * 2;
        const d = Math.hypot(m.x, m.y),
          max = 0.78 - bend * 0.25;
        if (d > max) {
          m.x *= max / d;
          m.y *= max / d;
          m.vx *= -0.5;
          m.vy *= -0.5;
        }
      }
    });
    const target = on ? Math.min(1, (locked / N) * 1.15) : 0;
    bend += (target - bend) * dt * 1.5;
  }
  function molecule(m, u, cx, cy) {
    const x = cx + m.x * u,
      y = cy + m.y * u,
      s = u * 0.085,
      open = low.checked;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(m.a);
    // Cuerpo: dos mitades (cada una, un par de cadenas alfa y beta).
    ctx.fillStyle = m.lock > 0.6 ? '#9b86ff' : '#7b67e6';
    ctx.beginPath();
    ctx.ellipse(-s * 0.45, 0, s * 0.7, s * 0.62, 0, 0, 7);
    ctx.ellipse(s * 0.45, 0, s * 0.7, s * 0.62, 0, 0, 7);
    ctx.fill();
    // El bolsillo (piezas 85 y 88), atrás: abierto sin oxígeno.
    ctx.fillStyle = open ? '#2a0b18' : '#6553c8';
    ctx.beginPath();
    ctx.arc(-s * 1.1, 0, s * 0.3, -Math.PI / 2, Math.PI / 2, true);
    ctx.fill();
    if (open) {
      ctx.strokeStyle = '#ffb020';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // La pieza 6, adelante: celeste si es glutamato, naranja con ganchitos si es valina.
    ctx.fillStyle = piece === 'V' ? '#ffb020' : '#4fd8ff';
    ctx.beginPath();
    ctx.arc(s * 1.12, 0, s * 0.26, 0, 7);
    ctx.fill();
    if (piece === 'V') {
      ctx.strokeStyle = '#ffb020';
      ctx.lineWidth = 1.4;
      for (const k of [-1, 0, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 1.3, k * s * 0.18);
        ctx.lineTo(s * 1.48, k * s * 0.3);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  function draw() {
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const u = Math.min(w, h) * 0.44,
      cx = w / 2,
      cy = h / 2;
    // El glóbulo rojo: se deforma a medida que crecen las fibras.
    const d = bend,
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, u);
    g.addColorStop(0, '#5a1022');
    g.addColorStop(1, '#3a0a18');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, u, 0, 7);
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.arc(0, 0, u, 0, 7);
    if (d > 0.02) ctx.arc(BITE.x * u * (1.6 - 0.6 * d), BITE.y * u * d, BITE.r * u * d, 0, 7);
    ctx.fillStyle = g;
    ctx.fill('evenodd');
    ctx.restore();
    // El borde redondo se borra a medida que el glóbulo se vuelve medialuna.
    ctx.globalAlpha = 1 - d;
    ctx.strokeStyle = '#ff8aa055';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, u, 0, 7);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
    for (const m of mols) molecule(m, u, cx, cy);
  }
  function frame(time) {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    if (visible && !document.hidden && canvas.offsetParent && !reduced.matches) {
      step(dt);
      draw();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  buttons.forEach(
    b =>
      (b.onclick = () => {
        piece = b.dataset.velcro;
        update();
      }),
  );
  low.onchange = update;
  update();
})();
