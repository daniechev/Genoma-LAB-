// Visor 3D: dibuja la cadena de la hemoglobina en un canvas, sin librerías.
// Cada aminoácido es un punto con coordenadas x, y, z; se unen con curvas y se giran con el mouse o el dedo.
class ProteinViewer {
  constructor(canvas, models) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.models = models;
    this.model = 'pdb';
    this.all = false;
    this.confidence = false;
    this.result = null;
    // Conservación en 16 especies (una por pieza) y el hierro del hemo de la cadena beta, para el modo evolución.
    this.evolution = null;
    this.evolutionHeme = null;
    this.rx = -0.25;
    this.ry = 0.35;
    this.zoom = 1;
    this.focus = null;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    this.rotating = !this.reduced.matches;
    this.pointers = new Map();
    this.lastTime = 0;
    this.reduced.addEventListener('change', () => {
      this.rotating = !this.reduced.matches;
      this.onRotation?.();
    });
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    canvas.addEventListener('pointerdown', e => {
      this.pointers.set(e.pointerId, [e.clientX, e.clientY]);
      canvas.setPointerCapture(e.pointerId);
      this.rotating = false;
      this.onRotation?.();
    });
    canvas.addEventListener('pointermove', e => {
      if (!this.pointers.has(e.pointerId)) return;
      const old = this.pointers.get(e.pointerId);
      if (this.pointers.size === 2) {
        const other = [...this.pointers.entries()].find(([id]) => id !== e.pointerId)[1];
        const before = Math.hypot(old[0] - other[0], old[1] - other[1]);
        const after = Math.hypot(e.clientX - other[0], e.clientY - other[1]);
        if (before > 0) this.zoomBy(after / before);
      } else {
        this.ry += (e.clientX - old[0]) * 0.012;
        this.rx += (e.clientY - old[1]) * 0.012;
      }
      this.pointers.set(e.pointerId, [e.clientX, e.clientY]);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      canvas.addEventListener(event, e => this.pointers.delete(e.pointerId));
    canvas.addEventListener(
      'wheel',
      e => {
        e.preventDefault();
        this.zoomBy(Math.exp(-e.deltaY * 0.001));
      },
      { passive: false },
    );
    canvas.addEventListener('dblclick', () => this.reset());
    canvas.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '=', '0'].includes(e.key))
        return;
      e.preventDefault();
      this.rotating = false;
      this.onRotation?.();
      if (e.key === 'ArrowLeft') this.ry -= 0.12;
      if (e.key === 'ArrowRight') this.ry += 0.12;
      if (e.key === 'ArrowUp') this.rx -= 0.12;
      if (e.key === 'ArrowDown') this.rx += 0.12;
      if (['+', '='].includes(e.key)) this.zoomBy(1.15);
      if (e.key === '-') this.zoomBy(1 / 1.15);
      if (e.key === '0') this.reset();
    });
    this.frame = t => {
      const dt = Math.min(50, t - this.lastTime);
      this.lastTime = t;
      if (!document.hidden && this.canvas.clientWidth) {
        if (this.rotating) this.ry += dt * 0.00012;
        this.draw();
      }
      requestAnimationFrame(this.frame);
    };
    requestAnimationFrame(this.frame);
  }
  // Ajusta el tamaño del dibujo a la pantalla (nítido en pantallas de alta densidad).
  resize() {
    const rect = this.canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  zoomBy(f) {
    this.zoom = Math.max(0.45, Math.min(4, this.zoom * f));
  }
  reset() {
    this.rx = -0.25;
    this.ry = 0.35;
    this.zoom = 1;
    this.focus = null;
  }
  // Centra y acerca la vista en la pieza que cambió.
  focusMutation() {
    if (!this.result) return;
    const m = this.models[this.model],
      p = m.chains[m.beta].find(p => p.res === Math.max(1, Math.min(146, this.result.piece)));
    this.focus = p ? { x: p.x, y: p.y, z: p.z } : null;
    this.zoom = 1.5;
    this.rotating = false;
    this.onRotation?.();
  }
  // Color de cada pieza: rojo si cambió, naranja si se desordenó, apagado si ya no se fabrica.
  color(res, confidence, isBeta) {
    if (!isBeta) return '#5a5f96';
    if (this.evolution && !this.result) {
      const v = this.evolution[res - 1] / 16;
      return v === 1 ? '#ffd447' : this.mix([74, 66, 150], [255, 154, 77], v * 0.85);
    }
    if (this.result) {
      const r = this.result;
      if (r.startLost || res > r.mature.length) return '#4a4780';
      if (r.effect === 'frameshift' && res >= Math.max(1, r.piece)) return '#ffb020';
      if (res === r.piece) return r.category === 'nada' ? '#ffffff' : '#ff5d6c';
    }
    if (this.model === 'af' && this.confidence)
      return confidence > 90
        ? '#388de7'
        : confidence >= 70
          ? '#65cbf3'
          : confidence >= 50
            ? '#ffdb13'
            : '#ff7d45';
    const t = res / 146;
    return t < 0.5
      ? this.mix([62, 212, 255], [111, 139, 255], t * 2)
      : this.mix([111, 139, 255], [255, 122, 217], (t - 0.5) * 2);
  }
  mix(a, b, t) {
    return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
  }
  // Se llama en cada cuadro: gira los puntos, los proyecta en 2D y dibuja primero lo que está más lejos.
  draw() {
    const ctx = this.ctx,
      w = this.width,
      h = this.height;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const model = this.models[this.model],
      beta = model.beta,
      pts = model.chains[beta],
      all = this.all && this.model === 'pdb';
    const visible = all ? Object.entries(model.chains) : [[beta, pts]];
    const center =
      this.focus ||
      pts.reduce(
        (s, p) => ({
          x: s.x + p.x / pts.length,
          y: s.y + p.y / pts.length,
          z: s.z + p.z / pts.length,
        }),
        { x: 0, y: 0, z: 0 },
      );
    const scale = Math.min(w / (all ? 99 : 68), h / (all ? 92 : 65)) * this.zoom;
    const cy = Math.cos(this.ry),
      sy = Math.sin(this.ry),
      cx = Math.cos(this.rx),
      sx = Math.sin(this.rx);
    const project = p => {
      const x = p.x - center.x,
        y = p.y - center.y,
        z = p.z - center.z;
      const x1 = x * cy + z * sy,
        z1 = -x * sy + z * cy,
        y1 = y * cx - z1 * sx,
        z2 = y * sx + z1 * cx;
      const persp = 180 / (180 + z2);
      return { x: w / 2 + x1 * scale * persp, y: h / 2 - 8 + y1 * scale * persp, z: z2 };
    };
    // Las curvas (Catmull-Rom) pasan por las posiciones medidas: no calculan cómo se plegaría una proteína mutada.
    const segments = [];
    let marker = null;
    for (const [chain, points] of visible) {
      const isBeta = chain === beta;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)],
          p1 = points[i],
          p2 = points[i + 1],
          p3 = points[Math.min(points.length - 1, i + 2)];
        let prev = project(p1);
        for (let j = 1; j <= 6; j++) {
          const t = j / 6,
            t2 = t * t,
            t3 = t2 * t,
            p = {};
          for (const a of ['x', 'y', 'z'])
            p[a] =
              0.5 *
              (2 * p1[a] +
                (-p0[a] + p2[a]) * t +
                (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 +
                (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3);
          const next = project(p);
          let opacity = isBeta ? 1 : 0.42;
          if (
            isBeta &&
            this.result &&
            (this.result.startLost || p1.res > this.result.mature.length)
          )
            opacity = 0.12;
          segments.push({
            a: prev,
            b: next,
            z: (prev.z + next.z) / 2,
            color: this.color(p1.res, p1.confidence, isBeta),
            opacity,
            width: isBeta ? Math.max(3.4, scale * 1.05) : Math.max(2, scale * 0.65),
          });
          prev = next;
        }
      }
      if (isBeta && this.result && this.result.piece >= 1 && this.result.piece <= 146)
        marker = project(points[this.result.piece - 1]);
    }
    segments.sort((a, b) => b.z - a.z);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of segments) {
      ctx.globalAlpha = s.opacity * Math.max(0.52, Math.min(1, 0.85 - s.z * 0.009));
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(s.a.x, s.a.y);
      ctx.lineTo(s.b.x, s.b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const hemes = all
      ? model.hemes
      : this.evolution && !this.result && this.model === 'pdb' && this.evolutionHeme
        ? [this.evolutionHeme]
        : [];
    for (const heme of hemes) {
      const p = project({ x: heme[0], y: heme[1], z: heme[2] }),
        big = !all;
      ctx.fillStyle = big ? '#fff3b0' : '#dfbc72';
      ctx.beginPath();
      ctx.arc(p.x, p.y, big ? 7 : 4.5, 0, Math.PI * 2);
      ctx.fill();
      if (big) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    if (marker) {
      const col = this.result.category === 'nada' ? '#ffffff' : '#ff5d6c';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 5, 0, Math.PI * 2);
      ctx.fill();
      const label = `Pieza ${this.result.piece}`;
      ctx.font = '700 15px Consolas, monospace';
      const tw = ctx.measureText(label).width;
      const x = Math.max(12, Math.min(w - tw - 25, marker.x + 19)),
        y = Math.max(30, Math.min(h - 30, marker.y - 24));
      ctx.fillStyle = '#100d2c';
      ctx.fillRect(x - 8, y - 17, tw + 16, 26);
      ctx.fillStyle = col;
      ctx.fillText(label, x, y + 1);
      ctx.strokeStyle = col;
      ctx.beginPath();
      ctx.moveTo(marker.x + 6, marker.y - 6);
      ctx.lineTo(x - 6, y);
      ctx.stroke();
    }
  }
}
