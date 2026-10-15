// Viaje de la portada: al bajar con el scroll, la cámara se acerca de tu cuerpo a una sola letra del ADN.
// Cada escena se dibuja en el canvas y la siguiente nace dentro de un punto de la anterior (como «Potencias de diez»).
// La hemoglobina usa las coordenadas reales de la estructura 2HHB y el ADN, las letras reales del gen HBB.
(() => {
  'use strict';
  const section = document.getElementById('journey');
  if (!section) return;
  const canvas = document.getElementById('journey-canvas'),
    mainCtx = canvas.getContext('2d'),
    steps = [...section.querySelectorAll('.journey-step')],
    N = steps.length,
    ZMAX = 14,
    reduced = matchMedia('(prefers-reduced-motion: reduce)'),
    COLORS = { A: '#ff7a66', T: '#ffd447', C: '#4fd8ff', G: '#b693ff' },
    FONT = "'Segoe UI Variable Text', Aptos, 'Segoe UI', system-ui, sans-serif",
    DNA = Genetics.DNA;
  // Las escenas dibujan siempre en «ctx»: a veces es la pantalla y a veces una capa aparte.
  let ctx = mainCtx,
    w = 0,
    h = 0,
    s = 0,
    manual = 0,
    visible = false,
    finalStart = 0;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)),
    smooth = (a, b, v) => {
      const t = clamp((v - a) / (b - a));
      return t * t * (3 - 2 * t);
    };
  // Generador de números al azar con semilla: las células quedan siempre en el mismo lugar.
  function seeded(seed) {
    return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  }

  // Escribe un texto con un tamaño en unidades de la escena (u = píxeles por unidad).
  function label(text, x, y, size, u, weight = 800) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1 / u, 1 / u);
    ctx.font = `${weight} ${Math.max(1, size * u)}px ${FONT}`;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function resize() {
    const r = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(section);

  // ---- Escena 0: vos. Una silueta con los vasos sanguíneos que laten. ----
  const vessels = [
    [
      [0.05, -0.33],
      [0.02, -0.55],
      [0, -0.66],
    ],
    [
      [0.05, -0.33],
      [0.2, -0.46],
      [0.31, -0.25],
      [0.36, 0.02],
      [0.39, 0.13],
    ],
    [
      [0.05, -0.33],
      [-0.2, -0.46],
      [-0.31, -0.25],
      [-0.36, 0.02],
      [-0.39, 0.13],
    ],
    [
      [0.05, -0.33],
      [0.03, -0.05],
      [0.1, 0.12],
      [0.12, 0.5],
      [0.13, 0.88],
    ],
    [
      [0.03, -0.05],
      [-0.1, 0.12],
      [-0.12, 0.5],
      [-0.13, 0.88],
    ],
  ];
  function person(u, time) {
    const beat = Math.exp(-((time % 1000) / 140)) + 0.6 * Math.exp(-(((time + 720) % 1000) / 140));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const body = ctx.createLinearGradient(0, -0.9, 0, 0.9);
    body.addColorStop(0, '#3a3388');
    body.addColorStop(1, '#1f1a52');
    ctx.strokeStyle = body;
    ctx.fillStyle = body;
    // Brazos y piernas como trazos gruesos; tronco y cabeza como formas.
    ctx.lineWidth = 0.11;
    for (const side of [1, -1]) {
      ctx.beginPath();
      ctx.moveTo(side * 0.24, -0.47);
      ctx.quadraticCurveTo(side * 0.34, -0.2, side * 0.39, 0.13);
      ctx.stroke();
    }
    ctx.lineWidth = 0.14;
    for (const side of [1, -1]) {
      ctx.beginPath();
      ctx.moveTo(side * 0.1, 0.08);
      ctx.lineTo(side * 0.13, 0.9);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-0.27, -0.5);
    ctx.quadraticCurveTo(0, -0.58, 0.27, -0.5);
    ctx.lineTo(0.2, 0.14);
    ctx.quadraticCurveTo(0, 0.2, -0.2, 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-0.05, -0.62, 0.1, 0.1);
    ctx.beginPath();
    ctx.arc(0, -0.75, 0.15, 0, Math.PI * 2);
    ctx.fill();
    // Contorno de luz.
    ctx.strokeStyle = '#8f7cff55';
    ctx.lineWidth = 2 / u;
    ctx.beginPath();
    ctx.arc(0, -0.75, 0.15, 0, Math.PI * 2);
    ctx.stroke();
    // Vasos sanguíneos: brillan con cada latido del corazón.
    for (const path of vessels) {
      for (const [width, alpha] of [
        [0.035, 0.18 + 0.25 * beat],
        [0.01, 0.75 + 0.25 * beat],
      ]) {
        ctx.strokeStyle = `rgba(255,93,108,${alpha})`;
        ctx.lineWidth = width;
        ctx.beginPath();
        path.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
    }
    const heart = ctx.createRadialGradient(0.05, -0.33, 0, 0.05, -0.33, 0.09 + 0.03 * beat);
    heart.addColorStop(0, '#ff5d6c');
    heart.addColorStop(1, '#ff5d6c00');
    ctx.fillStyle = heart;
    ctx.beginPath();
    ctx.arc(0.05, -0.33, 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Escena 1: un capilar con glóbulos rojos que pasan. ----
  const flowRand = seeded(42),
    flow = Array.from({ length: 11 }, (_, i) => ({
      x: i * 0.42 - 2.2,
      y: (flowRand() - 0.5) * 0.36,
      r: 0.13 + flowRand() * 0.04,
      tilt: (flowRand() - 0.5) * 1.2,
      speed: 0.00018 + flowRand() * 0.00006,
    }));
  function redCell(x, y, r, tilt, squash = 0.86) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(1, squash);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, '#f2707f');
    g.addColorStop(0.42, '#d3263f');
    g.addColorStop(0.82, '#b5132e');
    g.addColorStop(1, '#7c0a20');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function capillary(u, time) {
    for (const side of [-1, 1]) {
      const wall = ctx.createLinearGradient(0, side * 0.36, 0, side * 0.62);
      wall.addColorStop(0, '#ff8aa055');
      wall.addColorStop(1, '#ff8aa000');
      ctx.fillStyle = wall;
      ctx.fillRect(-3, side > 0 ? 0.36 : -0.62, 6, 0.26);
      // Núcleos de las células de la pared.
      ctx.fillStyle = '#ffb3c133';
      for (let i = -3; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(i * 0.9 + (side > 0 ? 0.3 : 0), side * 0.44, 0.12, 0.03, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const c of flow) {
      const x = ((c.x + time * c.speed + 2.4) % 4.8) - 2.4;
      if (Math.abs(x - 0.12) < 0.3 && Math.abs(c.y - 0.04) < 0.3) continue;
      redCell(x, c.y, c.r, c.tilt + Math.sin(time / 900 + c.x) * 0.15);
    }
    // El glóbulo que vamos a visitar: quieto en el centro.
    redCell(0.12, 0.04, 0.17, 0.2, 0.9);
  }

  // ---- Escena 2: un glóbulo rojo, con millones de hemoglobinas (acá, unas pocas como muestra). ----
  const hbRand = seeded(7),
    hbDots = Array.from({ length: 320 }, () => {
      const a = hbRand() * Math.PI * 2,
        r = Math.sqrt(hbRand()) * 0.76;
      return [Math.cos(a) * r, Math.sin(a) * r, hbRand() * 6.28];
    });
  function bloodCell(u, time) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.84);
    g.addColorStop(0, '#ee6476');
    g.addColorStop(0.38, '#d62a44');
    g.addColorStop(0.72, '#b8162f');
    g.addColorStop(0.9, '#c42039');
    g.addColorStop(1, '#6e0819');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 0.84, 0, Math.PI * 2);
    ctx.fill();
    // El borde es más grueso que el centro (forma de rosquilla sin agujero).
    ctx.strokeStyle = '#ff9aa733';
    ctx.lineWidth = 0.08;
    ctx.beginPath();
    ctx.arc(0, 0, 0.66, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd6dd';
    for (const [x, y, p] of hbDots) {
      ctx.globalAlpha = 0.25 + 0.2 * Math.sin(time / 600 + p);
      ctx.beginPath();
      ctx.arc(
        x + Math.sin(time / 700 + p) * 0.006,
        y + Math.cos(time / 800 + p) * 0.006,
        0.011,
        0,
        7,
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const target = ctx.createRadialGradient(0.3, -0.22, 0, 0.3, -0.22, 0.05);
    target.addColorStop(0, '#4fd8ff');
    target.addColorStop(1, '#4fd8ff00');
    ctx.fillStyle = target;
    ctx.beginPath();
    ctx.arc(0.3, -0.22, 0.05, 0, 7);
    ctx.fill();
  }

  // ---- Escena 3: la hemoglobina, con sus cuatro cadenas medidas por rayos X (PDB 2HHB). ----
  const hb = (() => {
    const model = MODELS.pdb,
      pts = Object.values(model.chains).flat(),
      c = ['x', 'y', 'z'].map(a => pts.reduce((sum, p) => sum + p[a], 0) / pts.length),
      R = Math.max(...pts.map(p => Math.hypot(p.x - c[0], p.y - c[1], p.z - c[2]))),
      k = 0.86 / R,
      local = p => [(p.x - c[0]) * k, -(p.y - c[1]) * k, (p.z - c[2]) * k];
    return {
      chains: Object.entries(model.chains).map(([id, list]) => ({
        id,
        beta: id === 'B' || id === 'D',
        pts: list.map(local),
      })),
      hemes: model.hemes.map(fe => local({ x: fe[0], y: fe[1], z: fe[2] })),
    };
  })();
  function rotate([x, y, z], a, tilt) {
    const x1 = x * Math.cos(a) + z * Math.sin(a),
      z1 = -x * Math.sin(a) + z * Math.cos(a);
    return [x1, y * Math.cos(tilt) - z1 * Math.sin(tilt), y * Math.sin(tilt) + z1 * Math.cos(tilt)];
  }
  const hbAngle = time => 0.5 + time * 0.00012;
  function hemoglobin(u, time) {
    const a = hbAngle(time),
      chains = hb.chains
        .map(c => ({ ...c, rp: c.pts.map(p => rotate(p, a, -0.35)) }))
        .map(c => ({ ...c, z: c.rp.reduce((s, p) => s + p[2], 0) / c.rp.length }))
        .sort((p, q) => p.z - q.z);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const c of chains) {
      for (const [width, alpha] of [
        [0.05, 0.16],
        [0.018, 1],
      ]) {
        for (let i = 0; i < c.rp.length - 1; i++) {
          const t = i / c.rp.length,
            color = c.beta ? `hsl(${192 + t * 12},95%,${56 + t * 16}%)` : '#9b86ff';
          ctx.strokeStyle = color;
          ctx.globalAlpha = alpha * (0.55 + 0.45 * clamp((c.rp[i][2] + 1) / 2));
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(c.rp[i][0], c.rp[i][1]);
          ctx.lineTo(c.rp[i + 1][0], c.rp[i + 1][1]);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    for (const fe of hb.hemes) {
      const [x, y] = rotate(fe, a, -0.35),
        g = ctx.createRadialGradient(x, y, 0, x, y, 0.07);
      g.addColorStop(0, '#ffe08a');
      g.addColorStop(0.4, '#ffd447aa');
      g.addColorStop(1, '#ffd44700');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 0.07, 0, 7);
      ctx.fill();
    }
  }
  // La pieza 6 de una cadena beta: ahí nace la escena siguiente.
  const hbFocus = time => rotate(hb.chains.find(c => c.id === 'B').pts[5], hbAngle(time), -0.35);

  // ---- Escena 4: el cromosoma 11, con el gen HBB cerca de la punta del brazo corto (11p15.4). ----
  const BANDS = [-0.62, -0.5, -0.38, -0.05, 0.08, 0.2, 0.33, 0.46, 0.58, 0.7];
  function chromatid(x) {
    ctx.beginPath();
    const top = -0.86,
      bottom = 0.86,
      waist = -0.18,
      r = 0.085;
    ctx.moveTo(x - r, top + r);
    ctx.quadraticCurveTo(x - r, top, x, top);
    ctx.quadraticCurveTo(x + r, top, x + r, top + r);
    ctx.quadraticCurveTo(x + r, waist - 0.08, x + r * 0.45, waist);
    ctx.quadraticCurveTo(x + r, waist + 0.08, x + r, bottom - r);
    ctx.quadraticCurveTo(x + r, bottom, x, bottom);
    ctx.quadraticCurveTo(x - r, bottom, x - r, bottom - r);
    ctx.quadraticCurveTo(x - r, waist + 0.08, x - r * 0.45, waist);
    ctx.quadraticCurveTo(x - r, waist - 0.08, x - r, top + r);
    ctx.closePath();
  }
  function chromosome(u, time) {
    for (const x of [-0.1, 0.1]) {
      const g = ctx.createLinearGradient(x - 0.09, 0, x + 0.09, 0);
      g.addColorStop(0, '#5a3fd6');
      g.addColorStop(0.5, '#9b86ff');
      g.addColorStop(1, '#4a32b8');
      chromatid(x);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#20155a88';
      for (const y of BANDS) ctx.fillRect(x - 0.1, y, 0.2, 0.045);
      const glow = 0.6 + 0.4 * Math.sin(time / 300);
      ctx.fillStyle = `rgba(255,92,157,${glow})`;
      ctx.fillRect(x - 0.1, -0.79, 0.2, 0.025);
      ctx.restore();
    }
    ctx.fillStyle = '#ff5c9d';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    label('HBB', 0.24, -0.755, 0.07, u);
    ctx.strokeStyle = '#ff5c9d88';
    ctx.lineWidth = 1.5 / u;
    ctx.beginPath();
    ctx.moveTo(0.2, -0.78);
    ctx.lineTo(0.235, -0.78);
    ctx.stroke();
  }

  // ---- Escena 5: la doble hélice del gen HBB, con sus letras reales. ----
  const helixPhase = time => time * 0.0009;
  const helixY = (i, time) => 0.3 * Math.sin(helixPhase(time) + i * 0.62);
  function helix(u, time) {
    const PAIR = { A: 'T', T: 'A', C: 'G', G: 'C' },
      x = i => 0.18 + (i - 19) * 0.11,
      nodes = [];
    for (let i = 0; i < 46; i++) {
      const y = helixY(i, time),
        z = Math.cos(helixPhase(time) + i * 0.62);
      ctx.strokeStyle = `rgba(255,255,255,${0.12 + 0.12 * (1 - Math.abs(z))})`;
      ctx.lineWidth = 0.012;
      ctx.beginPath();
      ctx.moveTo(x(i), y);
      ctx.lineTo(x(i), -y);
      ctx.stroke();
      nodes.push({ x: x(i), y, z, b: DNA[i], i }, { x: x(i), y: -y, z: -z, b: PAIR[DNA[i]], i });
    }
    for (const side of [1, -1]) {
      ctx.strokeStyle = side > 0 ? '#ffffff55' : '#ffffff30';
      ctx.lineWidth = 0.014;
      ctx.beginPath();
      for (let k = 0; k <= 45 * 4; k++) {
        const i = k / 4,
          y = side * helixY(i, time);
        k ? ctx.lineTo(x(i), y) : ctx.moveTo(x(i), y);
      }
      ctx.stroke();
    }
    nodes.sort((a, b) => a.z - b.z);
    for (const n of nodes) {
      const depth = (n.z + 1) / 2,
        r = 0.028 + 0.016 * depth;
      ctx.globalAlpha = 0.35 + 0.65 * depth;
      ctx.fillStyle = COLORS[n.b];
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, 7);
      ctx.fill();
      if (depth > 0.55 && r * u > 9) {
        ctx.fillStyle = '#1a1335';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        label(n.b, n.x, n.y + r * 0.08, r * 1.15, u);
      }
    }
    // La letra 20 (una A) se dibuja al final, siempre adelante y con un anillo que late.
    const [fx, fy] = helixFocus(time),
      pulse = (time / 900) % 1;
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS[DNA[19]];
    ctx.beginPath();
    ctx.arc(fx, fy, 0.046, 0, 7);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3 / u;
    ctx.stroke();
    ctx.globalAlpha = 1 - pulse;
    ctx.beginPath();
    ctx.arc(fx, fy, 0.05 + pulse * 0.06, 0, 7);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#1a1335';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    label(DNA[19], fx, fy + 0.004, 0.055, u);
  }
  // La A de la letra 20 es la de arriba o la de abajo, según hacia dónde mire la hélice.
  const helixFocus = time => [0.18, helixY(19, time)];

  // ---- Escena 6: la letra 20 del gen. Cada tanto se convierte en T, como en la anemia falciforme. ----
  function letter(u, time) {
    const size = 0.17,
      gap = 0.025,
      groupGap = 0.09,
      first = 15,
      codonWidth = 3 * size + 2 * gap,
      x0 = -(codonWidth + groupGap) - (size + gap) * 1 - size / 2,
      phase = finalStart ? ((time - finalStart) % 5200) / 5200 : 0,
      mutated = phase > 0.35 && phase < 0.85,
      flip = Math.min(1, Math.abs(phase - 0.35) * 25, Math.abs(phase - 0.85) * 25);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let k = 0; k < 9; k++) {
      const i = first + k,
        codon = Math.floor(k / 3),
        x = x0 + codon * (codonWidth + groupGap) + (k % 3) * (size + gap),
        isTarget = i === 19,
        b = isTarget && mutated ? 'T' : DNA[i],
        sy = isTarget ? Math.max(0.05, flip) : 1;
      ctx.save();
      ctx.translate(x + size / 2, 0);
      ctx.scale(1, sy);
      if (isTarget) ctx.scale(1.12, 1.12);
      ctx.fillStyle = COLORS[b];
      ctx.globalAlpha = isTarget ? 1 : 0.8;
      ctx.beginPath();
      ctx.roundRect(-size / 2, -size / 2, size, size, 0.035);
      ctx.fill();
      if (isTarget) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3 / u;
        ctx.stroke();
      }
      ctx.fillStyle = '#1a1335';
      label(b, 0, size * 0.04, size * 0.6, u);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // Número de codón arriba y la pieza que indica abajo.
    for (let codon = 0; codon < 3; codon++) {
      const cx = x0 + codon * (codonWidth + groupGap) + codonWidth / 2,
        aa = codon === 1 && mutated ? 'Val' : ['Pro', 'Glu', 'Glu'][codon];
      ctx.fillStyle = '#c2bdea';
      label(`Codón ${codon + 6}`, cx, -0.2, 0.055, u, 700);
      ctx.fillStyle = codon === 1 ? (mutated ? '#ff5d6c' : '#ffd447') : '#c2bdea';
      label(aa, cx, 0.22, 0.075, u);
    }
  }

  const SCENES = [
    { bg: '#0d0a26', draw: person, focus: () => [0.36, 0.02] },
    { bg: '#1e0612', draw: capillary, focus: () => [0.12, 0.04] },
    { bg: '#2a0610', draw: bloodCell, focus: () => [0.3, -0.22] },
    { bg: '#0b0a28', draw: hemoglobin, focus: hbFocus },
    { bg: '#130a2c', draw: chromosome, focus: () => [0.1, -0.78] },
    { bg: '#0a0b2a', draw: helix, focus: helixFocus },
    { bg: '#0e0b24', draw: letter, focus: () => [0, 0] },
  ];
  function scene(k, ox, oy, u, alpha, time, lens = null) {
    if (alpha <= 0.01 || u <= 0) return;
    if (alpha < 0.99 || lens) return layer(k, ox, oy, u, alpha, time, lens);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(u, u);
    SCENES[k].draw(u, time);
    ctx.restore();
  }
  // Para mezclar dos escenas sin que se transparenten sus partes, la que se desvanece se dibuja en una capa aparte.
  const off = document.createElement('canvas'),
    offCtx = off.getContext('2d');
  function layer(k, ox, oy, u, alpha, time, lens) {
    if (off.width !== canvas.width || off.height !== canvas.height) {
      off.width = canvas.width;
      off.height = canvas.height;
    }
    const dpr = canvas.width / w;
    offCtx.setTransform(1, 0, 0, 1, 0, 0);
    offCtx.globalAlpha = 1;
    offCtx.clearRect(0, 0, off.width, off.height);
    offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // La escena que llega se ve primero a través de una lente redonda que se agranda.
    if (lens) {
      offCtx.fillStyle = SCENES[k].bg;
      offCtx.beginPath();
      offCtx.arc(lens.x, lens.y, lens.r, 0, 7);
      offCtx.fill();
      offCtx.save();
      offCtx.clip();
    }
    offCtx.translate(ox, oy);
    offCtx.scale(u, u);
    ctx = offCtx;
    SCENES[k].draw(u, time);
    ctx = mainCtx;
    if (lens) {
      offCtx.restore();
      offCtx.strokeStyle = '#ffffff40';
      offCtx.lineWidth = 2;
      offCtx.beginPath();
      offCtx.arc(lens.x, lens.y, lens.r, 0, 7);
      offCtx.stroke();
    }
    mainCtx.save();
    mainCtx.setTransform(1, 0, 0, 1, 0, 0);
    mainCtx.globalAlpha = alpha;
    mainCtx.drawImage(off, 0, 0);
    mainCtx.restore();
  }

  function mixColor(a, b, t) {
    const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)),
      pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
  }
  function draw(time) {
    if (!w || !h) return;
    const k = Math.min(N - 1, Math.floor(s)),
      t = k === N - 1 ? 0 : s - k,
      U = w > h ? Math.min(w, h) * 0.42 : Math.min(w * 0.5, h * 0.42),
      cx = w / 2,
      cy = h * (w > h ? 0.47 : 0.4);
    ctx.globalAlpha = 1;
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.75),
      color =
        k < N - 1 ? mixColor(SCENES[k].bg, SCENES[k + 1].bg, smooth(0.3, 0.9, t)) : SCENES[k].bg;
    bg.addColorStop(0, color);
    bg.addColorStop(1, '#07051a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    if (t < 0.0005) return scene(k, cx, cy, U, 1, time);
    const [fx, fy] = SCENES[k].focus(time),
      Z = ZMAX ** t,
      e = smooth(0, 1, t),
      // La escena actual se agranda alrededor de su punto; la siguiente crece desde ese punto.
      px = cx + U * fx * (1 - e),
      py = cy + U * fy * (1 - e);
    scene(k, px - U * Z * fx, py - U * Z * fy, U * Z, 1 - smooth(0.55, 0.97, t), time);
    const unit = (U * Z) / ZMAX;
    scene(k + 1, px, py, unit, smooth(0.15, 0.5, t), time, {
      x: px,
      y: py,
      r: unit * (1.3 + 10 * e ** 3),
    });
  }

  // ---- Leyendas, puntos de navegación y la letra final ----
  const dots = section.querySelector('.journey-dots');
  steps.forEach((step, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `${i + 1}. ${step.querySelector('b').textContent}`);
    b.onclick = () => go(i);
    dots.append(b);
  });
  function go(i) {
    if (reduced.matches) {
      manual = i;
      s = i;
      return;
    }
    const top = section.getBoundingClientRect().top + scrollY,
      total = section.offsetHeight - innerHeight;
    scrollTo({ top: top + (total * i) / (N - 1) + 2, behavior: 'smooth' });
  }
  let shown = -1;
  function captions() {
    const i = Math.round(s);
    if (i === shown) return;
    shown = i;
    steps.forEach((step, k) => step.classList.toggle('active', k === i));
    [...dots.children].forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
    if (i === N - 1 && !finalStart) finalStart = performance.now() + 600;
    if (i !== N - 1) finalStart = 0;
  }
  function progress() {
    const r = section.getBoundingClientRect(),
      total = r.height - innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  }
  function frame(time) {
    if (visible && !document.hidden && canvas.offsetParent) {
      const target = reduced.matches ? manual : progress() * (N - 1);
      s += (target - s) * 0.14;
      if (Math.abs(target - s) < 0.0004) s = target;
      captions();
      draw(time);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.getElementById('journey-tour').onclick = () => GenomaLab.startTour();
})();
