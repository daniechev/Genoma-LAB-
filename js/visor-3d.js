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
    // Velocidad del arrastre (inercia al soltar) y vista suavizada hacia el zoom y el centro pedidos.
    this.spin = { x: 0, y: 0 };
    this.lastMove = 0;
    this.view = null;
    this.rgbCache = new Map();
    this.reduced.addEventListener('change', () => {
      this.rotating = !this.reduced.matches;
      this.onRotation?.();
    });
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    canvas.addEventListener('pointerdown', e => {
      this.pointers.set(e.pointerId, [e.clientX, e.clientY]);
      canvas.setPointerCapture(e.pointerId);
      this.spin = { x: 0, y: 0 };
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
        const dy = (e.clientX - old[0]) * 0.012,
          dx = (e.clientY - old[1]) * 0.012;
        this.ry += dy;
        this.rx += dx;
        // Promedio suave de la velocidad, para que el giro siga un poco al soltar.
        this.spin = { x: this.spin.x * 0.5 + dx * 0.5, y: this.spin.y * 0.5 + dy * 0.5 };
        this.lastMove = performance.now();
      }
      this.pointers.set(e.pointerId, [e.clientX, e.clientY]);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      canvas.addEventListener(event, e => {
        this.pointers.delete(e.pointerId);
        // Sin inercia si se soltó quieto (el último movimiento fue hace rato) o con varios dedos.
        if (this.pointers.size || this.reduced.matches || performance.now() - this.lastMove > 90)
          this.spin = { x: 0, y: 0 };
      });
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
        // Inercia: el giro se frena solo, como una pieza con rozamiento.
        if (!this.pointers.size && (this.spin.x || this.spin.y)) {
          const k = Math.pow(0.86, dt / 16.7);
          this.rx += this.spin.x * (dt / 16.7);
          this.ry += this.spin.y * (dt / 16.7);
          this.spin = { x: this.spin.x * k, y: this.spin.y * k };
          if (Math.abs(this.spin.x) + Math.abs(this.spin.y) < 0.0004) this.spin = { x: 0, y: 0 };
        }
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
    this.spin = { x: 0, y: 0 };
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
  // Pasa '#rrggbb' o 'rgb(r,g,b)' a números (con caché, se usa miles de veces por cuadro).
  rgb(c) {
    let v = this.rgbCache.get(c);
    if (!v) {
      v =
        c[0] === '#'
          ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16))
          : c.match(/\d+/g).map(Number);
      this.rgbCache.set(c, v);
    }
    return v;
  }
  // Tono final: más luz adelante y niebla violeta (la del fondo del visor) hacia atrás.
  shade(c, light, fog) {
    const r = Math.min(255, c[0] * light),
      g = Math.min(255, c[1] * light),
      b = Math.min(255, c[2] * light);
    return `rgb(${Math.round(r + (24 - r) * fog)},${Math.round(g + (19 - g) * fog)},${Math.round(b + (60 - b) * fog)})`;
  }
  // Esfera iluminada desde arriba a la izquierda, con un halo suave en vez de shadowBlur.
  sphere(x, y, r, [cr, cg, cb], halo) {
    const ctx = this.ctx;
    if (halo) {
      const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * halo);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},0.35)`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * halo, 0, Math.PI * 2);
      ctx.fill();
    }
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.25, `rgb(${cr},${cg},${cb})`);
    g.addColorStop(
      1,
      `rgb(${Math.round(cr * 0.35)},${Math.round(cg * 0.3)},${Math.round(cb * 0.4)})`,
    );
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
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
    const target =
      this.focus ||
      pts.reduce(
        (s, p) => ({
          x: s.x + p.x / pts.length,
          y: s.y + p.y / pts.length,
          z: s.z + p.z / pts.length,
        }),
        { x: 0, y: 0, z: 0 },
      );
    // La cámara se acerca al zoom y al centro pedidos con un frenado suave (salto directo si se reduce el movimiento).
    const now = performance.now(),
      v = this.view,
      k = !v || this.reduced.matches ? 1 : 1 - Math.pow(0.86, Math.min(50, now - v.t) / 16.7);
    this.view = v
      ? {
          t: now,
          zoom: v.zoom + (this.zoom - v.zoom) * k,
          x: v.x + (target.x - v.x) * k,
          y: v.y + (target.y - v.y) * k,
          z: v.z + (target.z - v.z) * k,
        }
      : { t: now, zoom: this.zoom, ...target };
    const center = this.view;
    const scale = Math.min(w / (all ? 99 : 68), h / (all ? 92 : 65)) * this.view.zoom;
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
        for (let j = 1; j <= 8; j++) {
          const t = j / 8,
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
            color: this.rgb(this.color(p1.res, p1.confidence, isBeta)),
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
    // Profundidad normalizada: 0 = lo más cercano, 1 = lo más lejano.
    const zNear = segments.length ? segments[segments.length - 1].z : 0,
      zFar = segments.length ? segments[0].z : 1,
      zSpan = Math.max(1, zFar - zNear);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Tubo con volumen: borde oscuro, cuerpo y un brillo corrido hacia la luz (arriba a la izquierda).
    // Todo opaco (sin globalAlpha) y por capas de profundidad: en cada capa van primero los bordes, después
    // los cuerpos y al final los brillos, así las uniones entre tramos no se marcan como anillos.
    const line = (s, dx, dy) => {
      ctx.beginPath();
      ctx.moveTo(s.a.x + dx, s.a.y + dy);
      ctx.lineTo(s.b.x + dx, s.b.y + dy);
      ctx.stroke();
    };
    for (let i = 0; i < segments.length; ) {
      let j = i;
      while (j < segments.length && segments[i].z - segments[j].z < zSpan * 0.05) j++;
      const layer = segments.slice(i, j);
      for (const s of layer) {
        const d = (s.z - zNear) / zSpan;
        s.lw = s.width * (1.12 - 0.34 * d);
        s.fog = 1 - s.opacity * (1 - d * 0.55);
        s.light = 1.08 - 0.3 * d;
        s.d = d;
        ctx.strokeStyle = this.shade(s.color, s.light * 0.5, s.fog);
        ctx.lineWidth = s.lw;
        line(s, 0, 0);
      }
      for (const s of layer) {
        ctx.strokeStyle = this.shade(s.color, s.light, s.fog);
        ctx.lineWidth = s.lw * 0.7;
        line(s, -s.lw * 0.06, -s.lw * 0.08);
      }
      for (const s of layer) {
        if (s.opacity < 0.3) continue;
        ctx.strokeStyle = this.shade(s.color, 1 + 0.5 * (1 - s.d), s.fog + 0.15 * s.d);
        ctx.lineWidth = s.lw * 0.24;
        line(s, -s.lw * 0.2, -s.lw * 0.2);
      }
      i = j;
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
      this.sphere(p.x, p.y, big ? 7.5 : 5, big ? [255, 212, 71] : [223, 160, 90], big ? 2.4 : 0);
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
      this.sphere(marker.x, marker.y, 6, this.rgb(col), 2.6);
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
