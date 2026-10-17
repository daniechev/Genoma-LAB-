// Hélice de ADN de la portada: dos hebras que giran unidas por pares de letras (A con T, C con G).
// Usa las primeras letras reales del gen HBB y, cada tanto, «muta» una letra: la idea del proyecto.
(() => {
  'use strict';
  const canvas = document.getElementById('helix');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const COLORS = { A: '#ff7a66', T: '#ffd447', C: '#4fd8ff', G: '#b693ff' };
  const PAIR = { A: 'T', T: 'A', C: 'G', G: 'C' };
  const FONT = "'Segoe UI Variable Text', Aptos, 'Segoe UI', system-ui, sans-serif";
  // Color del fondo hacia el que «se pierde» lo que queda atrás (niebla de profundidad).
  const FOG = [12, 9, 34];
  // Las hebras: una cian y otra lila, apenas tenues.
  const STRANDS = { 1: [150, 228, 255], [-1]: [214, 180, 255] };
  // En el ADN real las hebras no están enfrentadas: dejan un surco mayor y uno menor.
  const GROOVE = Math.PI * 0.8;
  const LEVELS = 8;
  const original = [...Genetics.DNA.slice(0, 26)];
  const letters = [...original];
  let width = 0,
    height = 0,
    tilt = 0,
    targetTilt = 0,
    mutation = null,
    nextMutation = 2200;

  const hex = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
  const mix = (c, f, light = 0) =>
    `rgb(${c.map((v, k) => Math.round(FOG[k] + (v + (255 - v) * light - FOG[k]) * f)).join()})`;

  // Esferas ya pintadas (con luz arriba a la izquierda) para cada letra y nivel de profundidad:
  // así no se crean gradientes ni sombras por cuadro.
  const SPRITE = 64;
  const sprites = {};
  for (const base of 'ATCG') {
    const c = hex(COLORS[base]);
    sprites[base] = Array.from({ length: LEVELS }, (_, l) => {
      const f = 0.32 + (0.68 * l) / (LEVELS - 1),
        s = document.createElement('canvas');
      s.width = s.height = SPRITE;
      const g = s.getContext('2d'),
        r = SPRITE / 2,
        grad = g.createRadialGradient(r * 0.68, r * 0.6, r * 0.08, r, r, r);
      grad.addColorStop(0, mix(c, f, 0.62));
      grad.addColorStop(0.45, mix(c, f));
      grad.addColorStop(
        1,
        mix(
          c.map(v => v * 0.45),
          f,
        ),
      );
      g.fillStyle = grad;
      g.beginPath();
      g.arc(r, r, r - 0.5, 0, Math.PI * 2);
      g.fill();
      return s;
    });
  }
  // Halo suave para las letras de adelante (reemplaza a shadowBlur).
  const halos = {};
  for (const base of 'ATCG') {
    const s = document.createElement('canvas');
    s.width = s.height = SPRITE;
    const g = s.getContext('2d'),
      r = SPRITE / 2,
      grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, COLORS[base] + '66');
    grad.addColorStop(1, COLORS[base] + '00');
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE, SPRITE);
    halos[base] = s;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduced.matches) draw(0);
  }
  new ResizeObserver(resize).observe(canvas);

  // La hélice se inclina un poco hacia donde está el mouse.
  canvas.parentElement.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    targetTilt = ((e.clientX - r.left) / r.width - 0.5) * 0.6;
  });
  canvas.parentElement.addEventListener('pointerleave', () => (targetTilt = 0));

  // Cada tanto cambia una letra que mira al frente, la resalta y después la devuelve a la original.
  function mutate(time, points) {
    if (mutation && time - mutation.start > 2000) {
      letters[mutation.i] = original[mutation.i];
      mutation = null;
    }
    if (!mutation && time > nextMutation) {
      const front = points.filter(p => p.z > 0.6);
      if (!front.length) return;
      const p = front[Math.floor(Math.random() * front.length)],
        options = [...'ATCG'].filter(b => b !== letters[p.i]);
      letters[p.i] = options[Math.floor(Math.random() * options.length)];
      mutation = { i: p.i, start: time };
      nextMutation = time + 4200;
    }
  }

  function draw(time) {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const vertical = height >= width,
      length = vertical ? height : width,
      across = vertical ? width : height,
      steps = Math.max(12, Math.min(letters.length, Math.round(length / 38))),
      spacing = length / (steps + 1),
      radius = Math.min(across * 0.34, 150),
      node = Math.max(7, Math.min(20, spacing * 0.5)),
      spin = reduced.matches ? 0.6 : time * 0.00045;
    tilt += (targetTilt - tilt) * 0.05;

    // Punto de una hebra para un paso t (puede ser fraccionario): posición en pantalla,
    // profundidad z (-1 atrás, 1 adelante) y escala de perspectiva.
    const at = (t, side) => {
      const angle = t * 0.55 + spin + (side === 1 ? 0 : GROOVE),
        along = spacing * (t + 1),
        center =
          across / 2 +
          Math.sin(t * 0.16 + spin * 0.3) * across * 0.05 +
          tilt * (along - length / 2) * 0.35,
        z = Math.cos(angle),
        scale = 1 + 0.2 * z,
        a = center + radius * Math.sin(angle) * scale,
        // Los extremos se desvanecen para que la hélice no termine de golpe.
        edge = Math.min(1, (t + 0.8) / 2.2, (steps - 0.2 - t) / 2.2);
      return { x: vertical ? a : along, y: vertical ? along : a, z, scale, edge };
    };
    const fog = (z, edge) => Math.max(0, (0.3 + 0.7 * ((z + 1) / 2)) * edge);

    // Cada par de letras: la hebra 1 lleva la letra del gen y la hebra 2 su pareja.
    const points = [];
    for (let i = 0; i < steps; i++) {
      const a = at(i, 1),
        b = at(i, -1);
      points.push({ i, a, b, z: a.z });
    }
    if (!reduced.matches) mutate(time, points);

    // Todo lo que se dibuja va a una lista ordenada por profundidad: así lo de adelante
    // tapa de verdad a lo de atrás (hebras, peldaños y letras se cruzan bien).
    const items = [];

    // 1) Las hebras de azúcar-fosfato, como un tubo continuo cortado en tramos cortos.
    const SUB = 5;
    for (const side of [1, -1]) {
      let prev = at(-0.6, side);
      for (let k = 1; k <= (steps - 0.2 + 0.6) * SUB; k++) {
        const cur = at(-0.6 + k / SUB, side);
        items.push({ kind: 'strand', side, p: prev, q: cur, z: (prev.z + cur.z) / 2 - 0.02 });
        prev = cur;
      }
    }

    // 2) Los peldaños: cada mitad tiene el color de su letra y se encuentran en el medio.
    for (const p of points) {
      const mid = {
          x: (p.a.x + p.b.x) / 2,
          y: (p.a.y + p.b.y) / 2,
          z: (p.a.z + p.b.z) / 2,
          scale: (p.a.scale + p.b.scale) / 2,
          edge: p.a.edge,
        },
        base = letters[p.i];
      items.push({ kind: 'rung', from: p.a, to: mid, base, z: (p.a.z * 2 + mid.z) / 3 - 0.04 });
      items.push({
        kind: 'rung',
        from: p.b,
        to: mid,
        base: PAIR[base],
        z: (p.b.z * 2 + mid.z) / 3 - 0.04,
      });
      items.push({ kind: 'node', at: p.a, p, side: 1, base, z: p.a.z + 0.15 });
      items.push({ kind: 'node', at: p.b, p, side: -1, base: PAIR[base], z: p.b.z + 0.15 });
    }
    items.sort((m, n) => m.z - n.z);

    ctx.lineCap = 'round';
    for (const it of items) {
      if (it.kind === 'strand') {
        const { p, q } = it,
          f = fog(it.z, Math.min(p.edge, q.edge)),
          w = 4.2 * ((p.scale + q.scale) / 2),
          c = STRANDS[it.side];
        if (f <= 0.02) continue;
        // Cuerpo del tubo y, encima, un brillo fino corrido hacia la luz.
        ctx.strokeStyle = mix(
          c.map(v => v * 0.55),
          f,
        );
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.strokeStyle = mix(c, f, 0.25);
        ctx.lineWidth = w * 0.38;
        ctx.beginPath();
        ctx.moveTo(p.x - w * 0.16, p.y - w * 0.16);
        ctx.lineTo(q.x - w * 0.16, q.y - w * 0.16);
        ctx.stroke();
      } else if (it.kind === 'rung') {
        const { from, to } = it,
          f = fog(it.z, from.edge),
          w = node * 0.42 * from.scale,
          c = hex(COLORS[it.base]);
        if (f <= 0.02) continue;
        // Barra con volumen: borde oscuro, cuerpo y una línea de luz.
        ctx.lineCap = 'butt';
        ctx.strokeStyle = mix(
          c.map(v => v * 0.4),
          f * 0.9,
        );
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.strokeStyle = mix(
          c.map(v => v * 0.78),
          f * 0.9,
        );
        ctx.lineWidth = w * 0.62;
        ctx.stroke();
        ctx.strokeStyle = mix(c, f * 0.9, 0.35);
        ctx.lineWidth = w * 0.2;
        const dx = to.x - from.x,
          dy = to.y - from.y,
          len = Math.hypot(dx, dy) || 1,
          ox = (dy / len) * w * 0.18,
          oy = (-dx / len) * w * 0.18,
          sx = oy > 0 ? -ox : ox,
          sy = oy > 0 ? -oy : oy;
        ctx.beginPath();
        ctx.moveTo(from.x + sx, from.y + sy);
        ctx.lineTo(to.x + sx, to.y + sy);
        ctx.stroke();
        ctx.lineCap = 'round';
      } else {
        const { at: q, p, side, base } = it,
          depth = (q.z + 1) / 2,
          f = fog(q.z, q.edge),
          r = node * (0.55 + 0.45 * depth) * (q.edge * 0.4 + 0.6),
          mutated = mutation && mutation.i === p.i;
        if (f <= 0.02) continue;
        const level = Math.max(0, Math.min(LEVELS - 1, Math.round((f / q.edge - 0.32) / 0.0971)));
        ctx.globalAlpha = Math.min(1, q.edge * 1.2);
        if (depth > 0.55 || mutated) {
          const hr = r * (mutated ? 3.2 : 2.1);
          // El brillo de la letra mutada también se apaga si queda atrás.
          ctx.globalAlpha *= mutated ? 0.25 + 0.75 * depth : (depth - 0.55) * 2.2;
          ctx.drawImage(halos[base], q.x - hr, q.y - hr, hr * 2, hr * 2);
          ctx.globalAlpha = Math.min(1, q.edge * 1.2);
        }
        ctx.drawImage(sprites[base][level], q.x - r, q.y - r, r * 2, r * 2);
        if (mutated && side === 1) {
          const pulse = ((time - mutation.start) % 1000) / 1000,
            ease = 1 - (1 - pulse) ** 3;
          ctx.globalAlpha = 1 - pulse;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5 * (1 - pulse * 0.6);
          ctx.beginPath();
          ctx.arc(q.x, q.y, r + 4 + ease * 14, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (depth > 0.6 && r > 9) {
          ctx.globalAlpha = Math.min(1, (depth - 0.6) * 4) * q.edge;
          ctx.fillStyle = '#1a1335';
          ctx.font = `800 ${Math.round(r * 1.1)}px ${FONT}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(base, q.x, q.y + 1);
        }
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(time) {
    // Solo dibuja si la portada está a la vista.
    if (!document.hidden && canvas.offsetParent) draw(time);
    requestAnimationFrame(frame);
  }
  if (!reduced.matches) requestAnimationFrame(frame);
})();
