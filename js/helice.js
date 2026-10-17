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
  const original = [...Genetics.DNA.slice(0, 26)];
  const letters = [...original];
  let width = 0,
    height = 0,
    tilt = 0,
    targetTilt = 0,
    mutation = null,
    nextMutation = 2200;

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
      spin = reduced.matches ? 0.6 : time * 0.0007;
    tilt += (targetTilt - tilt) * 0.05;

    // Cada par de letras: posición a lo largo de la hélice y profundidad z (-1 atrás, 1 adelante).
    const points = [];
    for (let i = 0; i < steps; i++) {
      const angle = i * 0.55 + spin,
        along = spacing * (i + 1),
        center =
          across / 2 +
          Math.sin(i * 0.16 + spin * 0.3) * across * 0.05 +
          tilt * (along - length / 2) * 0.35;
      points.push({ i, along, center, offset: radius * Math.sin(angle), z: Math.cos(angle) });
    }
    if (!reduced.matches) mutate(time, points);
    const pos = (p, side) => {
      const a = p.center + side * p.offset;
      return vertical ? [a, p.along] : [p.along, a];
    };

    // 1) Los «peldaños»: cada letra unida con su pareja.
    ctx.lineWidth = 3;
    for (const p of points) {
      const [x1, y1] = pos(p, 1),
        [x2, y2] = pos(p, -1),
        base = letters[p.i],
        gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, COLORS[base]);
      gradient.addColorStop(1, COLORS[PAIR[base]]);
      ctx.globalAlpha = 0.16 + 0.24 * (1 - Math.abs(p.z));
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 2) Las dos hebras, como curvas suaves que pasan entre las letras.
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    for (const side of [1, -1]) {
      ctx.beginPath();
      points.forEach((p, k) => {
        const [x, y] = pos(p, side);
        if (!k) return ctx.moveTo(x, y);
        const [px, py] = pos(points[k - 1], side);
        ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
      });
      ctx.strokeStyle = side === 1 ? '#ffffff3d' : '#ffffff24';
      ctx.stroke();
    }

    // 3) Las letras, de atrás hacia adelante para que las de adelante tapen a las de atrás.
    const nodes = points
      .flatMap(p => [
        { p, side: 1, z: p.z, base: letters[p.i] },
        { p, side: -1, z: -p.z, base: PAIR[letters[p.i]] },
      ])
      .sort((a, b) => a.z - b.z);
    for (const n of nodes) {
      const [x, y] = pos(n.p, n.side),
        depth = (n.z + 1) / 2,
        r = node * (0.6 + 0.45 * depth),
        mutated = mutation && mutation.i === n.p.i;
      ctx.globalAlpha = 0.3 + 0.7 * depth;
      ctx.shadowColor = COLORS[n.base];
      ctx.shadowBlur = mutated ? 32 : 16 * depth;
      ctx.fillStyle = COLORS[n.base];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (mutated && n.side === 1) {
        const pulse = ((time - mutation.start) % 1000) / 1000;
        ctx.globalAlpha = 1 - pulse;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, r + 4 + pulse * 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (depth > 0.6 && r > 9) {
        ctx.fillStyle = '#1a1335';
        ctx.font = `800 ${Math.round(r * 1.1)}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.base, x, y + 1);
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
