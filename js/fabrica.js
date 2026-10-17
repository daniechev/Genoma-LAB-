// La fábrica: el ribosoma lee el ARN de a tres letras y por cada codón un ARN de transferencia trae su pieza.
// Lee la secuencia de verdad (la normal o la que cambiaste): si aparece un STOP, la cadena se suelta ahí.
// Nada pasa de largo: se detiene en el codón que cambió hasta que alguien toca «Seguir» y al final se queda quieta.
(() => {
  'use strict';
  const canvas = document.getElementById('factory');
  if (!canvas) return;
  const G = Genetics,
    ctx = canvas.getContext('2d'),
    caption = document.getElementById('factory-caption'),
    goOn = document.getElementById('factory-next'),
    reduced = matchMedia('(prefers-reduced-motion: reduce)'),
    FONT = "'Segoe UI Variable Text', Aptos, 'Segoe UI', system-ui, sans-serif",
    MONO = "'Cascadia Mono', Consolas, monospace",
    COLORS = { A: '#ff7a66', U: '#ffd447', C: '#4fd8ff', G: '#b693ff' },
    PAIR = { A: 'U', U: 'A', C: 'G', G: 'C' },
    BEAD = { same: '#4fd8ff', changed: '#ff5d6c', wrong: '#ffb020', start: '#c2bdea' };
  const rna = codon => codon.replace(/T/g, 'U');
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)),
    ease = v => {
      const t = clamp(v);
      return t * t * (3 - 2 * t);
    };
  let w = 0,
    h = 0,
    visible = false,
    result = null,
    seq = G.DNA,
    start = 0,
    cur = 0,
    phase = 0,
    mode = 'reading',
    chain = [],
    paused = false,
    done = false,
    lastTime = 0,
    told = new Set();

  function resize() {
    const r = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduced.matches) draw();
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  const codonAt = (dna, k) => dna.slice(k * 3, k * 3 + 3);
  // Qué tipo de pieza sale en el codón k: igual a la normal, cambiada o distinta por el corrimiento.
  function beadKind(k, aa) {
    if (k === 0) return 'start';
    const original = G.table[codonAt(G.DNA, k)];
    if (!result || aa === original) return 'same';
    return result.effect === 'frameshift' ? 'wrong' : 'changed';
  }
  function say(text) {
    caption.innerHTML = text;
  }
  // Empieza a fabricar: con un cambio, arranca unos codones antes para llegar rápido a la parte interesante.
  function restart() {
    result = GenomaLab.result;
    seq = result ? result.mutated : G.DNA;
    start = result && !result.startLost ? Math.max(0, Math.min(140, result.codon - 4)) : 0;
    cur = start;
    phase = 0;
    paused = false;
    done = false;
    goOn.hidden = true;
    told = new Set();
    chain = Array.from({ length: start }, (_, k) => beadKind(k, G.table[codonAt(seq, k)]));
    mode = result?.startLost ? 'scan' : 'reading';
    if (mode === 'scan')
      say(
        `El primer codón ahora es <b>${rna(codonAt(seq, 0))}</b>, no AUG. El ribosoma no encuentra dónde empezar y <b>no fabrica la cadena</b>.`,
      );
    else if (!result)
      say(
        'El ribosoma lee el ARN de a tres letras. Por cada codón llega un ARN de transferencia con su pieza y la cadena crece.',
      );
    else
      say(
        `El ribosoma lee tu ARN de a tres letras. Mirá el codón ${result.codon + 1}, subrayado en rojo.`,
      );
    if (reduced.matches) {
      // Sin animación: se muestra directamente el momento en que se lee el codón que cambió.
      if (mode === 'reading') {
        while (cur < (result ? result.codon : 3) && step()) {}
        phase = 0.5;
      }
      draw();
    }
  }
  // Termina de leer un codón: la pieza se suma a la cadena y el ARN avanza.
  function step() {
    const codon = codonAt(seq, cur);
    chain.push(beadKind(cur, G.table[codon]));
    cur++;
    const next = codonAt(seq, cur);
    if (next.length < 3) {
      mode = 'runoff';
      phase = 0;
      say(
        'No apareció ningún STOP: el ribosoma <b>sigue de largo</b> por un ARN que no está en el modelo, y no sabemos dónde termina.',
      );
      return false;
    }
    if (G.table[next] === '*') {
      mode = 'release';
      phase = 0;
      const pieces = cur - 1;
      say(
        pieces !== 146
          ? `<b>${rna(next)} es STOP.</b> La cadena se suelta antes de tiempo, con <b>${pieces} piezas</b> en lugar de 146.`
          : result?.effect === 'missense'
            ? `<b>Listo.</b> La cadena sale completa, con 146 piezas, pero la pieza ${result.piece} es <b>distinta</b> (en rojo).`
            : result?.effect === 'synonymous'
              ? '<b>Listo.</b> La cadena sale completa y es <b>igual</b> a la normal.'
              : `<b>${rna(next)} es STOP.</b> La cadena se suelta completa, con 146 piezas, y se pliega para formar la hemoglobina.`,
      );
      return false;
    }
    explain(cur, next);
    return true;
  }
  // Cuenta qué pasa cuando el ribosoma llega al codón que cambió.
  function explain(k, codon) {
    if (!result || told.has('change') || k !== result.codon) return;
    told.add('change');
    const before = codonAt(G.DNA, k),
      aa = G.names[G.table[codon]],
      old = G.names[G.table[before]];
    if (result.effect === 'frameshift')
      say(
        `Desde el codón ${k + 1}, los grupos de tres <b>se corrieron</b>: llegan ARN de transferencia distintos y cada pieza nueva sale <b>distinta</b> (en naranja).`,
      );
    else if (aa === old)
      say(
        `Codón ${k + 1}: <b>${rna(before)} → ${rna(codon)}</b>. Llega otro ARN de transferencia, pero trae <b>la misma pieza</b>: ${aa}.`,
      );
    else
      say(
        `Codón ${k + 1}: <b>${rna(before)} → ${rna(codon)}</b>. Llega otro ARN de transferencia y trae <b>${aa}</b> en lugar de ${old}: la pieza cambió (en rojo).`,
      );
  }

  // ---- Dibujo ----
  function tileRow(x, y, codon, size, mark) {
    [...codon].forEach((b, i) => {
      const left = x + i * (size + 2);
      ctx.fillStyle = COLORS[b] || '#3d3890';
      ctx.beginPath();
      ctx.roundRect(left, y, size, size, 4);
      ctx.fill();
      ctx.fillStyle = '#1a1335';
      ctx.font = `800 ${size * 0.62}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b, left + size / 2, y + size / 2 + 1);
    });
    if (mark) {
      ctx.strokeStyle = '#ff5d6c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 1, y + size + 5);
      ctx.lineTo(x + 3 * size + 5, y + size + 5);
      ctx.stroke();
    }
  }
  function bead(x, y, r, kind, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = BEAD[kind];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
    if (kind === 'changed') {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // Un ARN de transferencia: el anticodón abajo (se aparea con el codón) y la pieza arriba.
  function trna(x, y, codon, aa, kind, alpha, cw, empty = false) {
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    const bw = cw * 0.86,
      bh = 34;
    ctx.fillStyle = '#272264';
    ctx.strokeStyle = '#8f7cff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - bw / 2, y - bh, bw, bh, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c2bdea';
    ctx.font = `700 ${Math.max(10, cw * 0.22)}px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText([...codon].map(b => PAIR[b]).join(''), x, y - bh / 2 + 2);
    ctx.strokeStyle = '#8f7cff';
    ctx.beginPath();
    ctx.moveTo(x, y - bh);
    ctx.lineTo(x, y - bh - 8);
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (empty) return;
    bead(x, y - bh - 18, 10, kind, alpha);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f7f5ff';
    ctx.font = `700 12px ${FONT}`;
    ctx.fillText(G.names[aa] || '', x, y - bh - 38);
    ctx.globalAlpha = 1;
  }
  function chainPoint(i, ex, ey) {
    // i = 0 es la pieza más nueva, la que acaba de salir del túnel del ribosoma.
    return [ex - 8 - i * 12.5, ey - 14 - Math.sin(i * 0.5) * 16 - i * 2.2];
  }
  function draw() {
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const cw = clamp(w / 6, 44, 72),
      size = cw / 3 - 3,
      y = h * 0.74,
      rx = w * 0.6,
      slide = mode === 'reading' ? ease((phase - 0.6) / 0.4) : 0;
    // Las dos partes del ribosoma: la chica abajo del ARN y la grande arriba.
    const open = mode === 'release' ? ease((phase - 0.5) / 0.5) * 30 : 0,
      scanX = mode === 'scan' ? (ease(phase) * 1.4 - 0.7) * w : 0,
      bodyX = (mode === 'scan' ? w * 0.12 + scanX + w * 0.35 : rx) - cw * 0.5;
    ctx.fillStyle = '#8f7cff55';
    ctx.strokeStyle = '#8f7cff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(bodyX, y + size + 12 + open, cw * 1.45, 17, 0, 0, 7);
    ctx.fill();
    ctx.stroke();
    if (mode !== 'scan') {
      ctx.fillStyle = '#5a45c955';
      ctx.beginPath();
      ctx.ellipse(bodyX, y - 30 - open, cw * 1.6, 36, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
    }
    // El ARN: una tira de codones que pasa por el ribosoma.
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y + size / 2);
    ctx.lineTo(w, y + size / 2);
    ctx.stroke();
    const shift = mode === 'runoff' ? ease(phase) * 2 : 0;
    for (let k = cur - 16; k <= cur + 16; k++) {
      if (k < 0) continue;
      const x = rx + (k - cur - slide - shift) * cw - (3 * size + 4) / 2,
        codon = codonAt(seq, k);
      if (x < -cw || x > w + cw) continue;
      if (codon.length < 3) {
        ctx.fillStyle = '#ffffff30';
        ctx.font = `700 ${size * 0.6}px ${MONO}`;
        ctx.textAlign = 'center';
        ctx.fillText('? ? ?', x + cw / 2, y + size / 2);
        continue;
      }
      tileRow(x, y, rna(codon), size, result && k === result.codon && mode !== 'scan');
    }
    const ex = rx - cw * 0.5,
      ey = y - 68;
    // La cadena que va saliendo.
    const flyOff = mode === 'release' ? ease((phase - 0.3) / 0.5) : 0;
    const shown = chain.slice(-26).reverse();
    shown.forEach((kind, i) => {
      const [px, py] = chainPoint(
        i + (mode === 'reading' && phase > 0.45 ? ease((phase - 0.45) / 0.15) : 0),
        ex,
        ey,
      );
      bead(px - flyOff * 60, py - flyOff * 90, 7.5, kind, 1 - flyOff * 0.6);
    });
    if (mode === 'reading' && phase > 0.55) {
      const [px, py] = chainPoint(0, ex, ey);
      bead(px, py, 7.5, beadKind(cur, G.table[codonAt(seq, cur)]));
    }
    if (chain.length > 26) {
      const [px, py] = chainPoint(26, ex, ey);
      ctx.fillStyle = '#c2bdea';
      ctx.font = `700 13px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(`+${chain.length - 26}`, px - flyOff * 60, py - flyOff * 90);
    }
    if (mode === 'reading') {
      const codon = codonAt(seq, cur),
        aa = G.table[codon],
        kind = beadKind(cur, aa),
        arrive = ease(phase / 0.45),
        tx = rx + cw * 2.6 * (1 - arrive) - slide * cw,
        ty = y - 4 - (1 - arrive) * 110;
      // El ARN de transferencia anterior se va hacia arriba.
      if (cur > start) {
        const prev = codonAt(seq, cur - 1),
          leave = ease(phase / 0.4);
        trna(
          rx - cw - leave * cw * 1.2,
          y - 4 - leave * 70,
          rna(prev),
          G.table[prev],
          'same',
          1 - leave,
          cw,
          true,
        );
      }
      // Al acoplarse, su pieza pasa a la cadena: el ARN de transferencia queda vacío.
      trna(tx, ty, rna(codon), aa, kind, 1, cw, phase > 0.55);
      ctx.fillStyle = '#c2bdea';
      ctx.font = `700 13px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(cur ? `Pieza ${cur} de 146` : 'Inicio (Met)', 14, 22);
    }
    if (mode === 'release') {
      // El factor de liberación ocupa el lugar del STOP y suelta la cadena.
      const inX = rx + (1 - ease(phase / 0.3)) * cw * 2.6,
        inY = y - 4 - (1 - ease(phase / 0.3)) * 100;
      ctx.fillStyle = '#ff9a4d';
      ctx.beginPath();
      ctx.roundRect(inX - cw * 0.42, inY - 40, cw * 0.84, 40, 10);
      ctx.fill();
      ctx.fillStyle = '#1a1335';
      ctx.font = `800 12px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('STOP', inX, inY - 18);
    }
    if (mode === 'scan') {
      ctx.fillStyle = '#ff5d6c';
      ctx.font = `800 28px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('✕', rx - cw * 2, y - 24);
    }
  }

  function frame(time) {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    if (visible && !document.hidden && canvas.offsetParent && !reduced.matches) {
      // Después del codón que cambió, adelanta rápido hasta el final.
      const fast = result && mode === 'reading' && cur > result.codon,
        stepTime = fast ? 0.06 : 0.62;
      // Con la pieza nueva ya puesta en el codón que cambió, espera a que alguien toque «Seguir».
      if (
        mode === 'reading' &&
        result &&
        cur === result.codon &&
        phase >= 0.62 &&
        !told.has('seguir')
      ) {
        if (!paused) {
          paused = true;
          goOn.hidden = false;
        }
      } else if (mode === 'reading') {
        phase += dt / stepTime;
        if (phase >= 1) {
          phase -= 1;
          if (!step()) phase = 0;
        }
      } else if (!done) {
        // STOP, sin STOP o sin inicio: termina la escena y se queda quieta. «↺» la repite.
        phase = Math.min(1, phase + dt / (stepTime * (mode === 'release' ? 3 : 4)));
        done = phase >= 1;
      }
      draw();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener('genoma:resultado', restart);
  document.addEventListener('genoma:limpio', restart);
  document.getElementById('factory-play').onclick = restart;
  goOn.onclick = () => {
    told.add('seguir');
    paused = false;
    goOn.hidden = true;
  };
  restart();
})();
