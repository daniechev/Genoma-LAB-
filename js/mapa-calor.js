// Mapa de calor del póster: las 1.332 sustituciones posibles, una columna por codón.
// En cada columna hay 9 cuadraditos: las 3 letras del codón (filas 1.ª, 2.ª y 3.ª) por las 3 letras nuevas.
// Arriba, en dorado, cuántas de las 16 especies tienen la misma pieza que nosotros.
(() => {
  'use strict';
  const box = document.getElementById('heatmap');
  if (!box) return;
  const G = Genetics,
    E = Evolution,
    canvas = box.querySelector('canvas'),
    ctx = canvas.getContext('2d'),
    tip = document.getElementById('heatmap-tip'),
    FONT = "'Segoe UI Variable Text', Aptos, 'Segoe UI', system-ui, sans-serif",
    COLOR = {
      pieza: '#ff5d6c',
      nada: '#4fd8ff',
      corte: '#ffd447',
      desorden: '#ffb020',
    },
    LABEL = {
      missense: 'Cambia una pieza',
      synonymous: 'No cambia nada',
      nonsense: 'La proteína se corta (STOP)',
      'start-loss': 'No arranca (sin inicio)',
      'stop-loss': 'No termina (sin STOP)',
    };
  const map = G.substitutionMap(),
    cons = E.conservation(),
    // Cada sustitución en su lugar de la grilla: columna = codón, fila = letra del codón × letra nueva.
    grid = map.map(m => {
      const alternatives = [...'ATCG'].filter(b => b !== G.DNA[m.position]);
      return { ...m, col: m.codon, row: m.letter * 3 + alternatives.indexOf(m.base) };
    }),
    known = new Set(G.CASES.map(c => `${c.position}${c.base}`));
  let layout = null,
    limit = 148,
    hover = null,
    pinned = null;

  function measure() {
    const width = box.clientWidth,
      labelW = width > 600 ? 40 : 30,
      minCol0 = width > 900 ? 7 : 8.5;
    // data-compact: en pantallas angostas se muestra solo el comienzo del gen, en una banda.
    let minCol = minCol0;
    limit = box.dataset.compact !== undefined && width < 600 ? 37 : 148;
    if (limit < 148) minCol = Math.min(minCol, (width - labelW) / limit);
    let cols = Math.min(limit, Math.floor((width - labelW) / minCol));
    const bands = Math.ceil(limit / cols);
    cols = Math.ceil(limit / bands);
    const cell = (width - labelW) / cols,
      // data-stretch permite filas más altas (la presentación tiene lugar de sobra).
      stretch = Number(box.dataset.stretch) || 1.05,
      cellH = Math.max(7, Math.min(stretch > 1.05 ? 30 : 16, cell * stretch)),
      track = 22,
      bandH = track + 6 + 9 * cellH + 8 + 26 + (bands > 1 ? 18 : 0);
    layout = { width, labelW, cols, bands, cell, cellH, track, bandH, height: bands * bandH };
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.style.height = `${layout.height}px`;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(layout.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const rowY = (row, top) => top + layout.track + 6 + row * layout.cellH + Math.floor(row / 3) * 4;
  function place(col) {
    const band = Math.floor(col / layout.cols),
      x = layout.labelW + (col % layout.cols) * layout.cell,
      top = band * layout.bandH;
    return { x, top };
  }
  function draw() {
    if (!layout) return;
    const { width, labelW, cell, cellH, track, bands, cols } = layout;
    ctx.clearRect(0, 0, width, layout.height);
    for (let band = 0; band < bands; band++) {
      const top = band * layout.bandH;
      ctx.fillStyle = '#c2bdea';
      ctx.font = `700 11px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelW >= 40 ? '16 esp.' : 'esp.', 0, top + track / 2);
      ['1.ª', '2.ª', '3.ª'].forEach((t, i) => ctx.fillText(t, 4, rowY(i * 3 + 1.5, top)));
      // Números de codón debajo de cada banda.
      const from = band * cols,
        to = Math.min(limit, from + cols);
      ctx.textAlign = 'center';
      for (let c = from; c < to; c++)
        if ((c + 1) % 10 === 0 || (c === from && (c + 1) % 10 < 8)) {
          const { x } = place(c);
          ctx.fillText(String(c + 1), x + cell / 2, rowY(9, top) + 14);
        }
    }
    // Conservación: barra dorada por pieza (los codones 1 y 148 no fabrican piezas de la cadena madura).
    for (let c = 1; c <= Math.min(146, limit - 1); c++) {
      const { x, top } = place(c),
        v = cons[c - 1] / E.SPECIES.length;
      ctx.fillStyle = v === 1 ? '#ffd447' : `rgba(255,212,71,${0.25 + 0.5 * v})`;
      ctx.fillRect(x + 0.5, top + track * (1 - v), Math.max(1, cell - 1), track * v);
    }
    for (const g of grid) {
      if (g.col >= limit) continue;
      const { x, top } = place(g.col),
        y = rowY(g.row, top);
      ctx.fillStyle = COLOR[g.category];
      ctx.globalAlpha = g.category === 'pieza' ? 0.82 : 1;
      ctx.fillRect(x + 0.5, y + 0.5, Math.max(1, cell - 1), cellH - 1);
      ctx.globalAlpha = 1;
      if (known.has(`${g.position}${g.base}`)) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 1, y - 1, cell + 1, cellH + 1);
      }
    }
    const active = pinned || hover;
    if (active) {
      const { x, top } = place(active.col),
        y = rowY(active.row, top);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x - 1.5, y - 1.5, cell + 2, cellH + 2);
      ctx.strokeStyle = '#ffffff55';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 1, top, cell + 1, rowY(9, top) - top);
    }
  }
  function hit(e) {
    // Si el mapa está escalado (como en la presentación), se pasa del tamaño en pantalla al del dibujo.
    const r = canvas.getBoundingClientRect(),
      k = layout.width / r.width,
      mx = (e.clientX - r.left) * k,
      my = (e.clientY - r.top) * k,
      band = Math.floor(my / layout.bandH),
      col = band * layout.cols + Math.floor((mx - layout.labelW) / layout.cell);
    if (mx < layout.labelW || col < 0 || col >= limit) return null;
    const top = band * layout.bandH;
    for (let row = 0; row < 9; row++) {
      const y = rowY(row, top);
      if (my >= y && my < y + layout.cellH) return grid.find(g => g.col === col && g.row === row);
    }
    return null;
  }
  function show(g, e) {
    if (!g) {
      tip.hidden = true;
      return;
    }
    const before = G.DNA.slice(g.codon * 3, g.codon * 3 + 3),
      after = before.slice(0, g.letter) + g.base + before.slice(g.letter + 1),
      piece = g.codon,
      same = piece >= 1 && piece <= 146 ? cons[piece - 1] : null,
      also = g.effect === 'missense' ? E.sameChange(piece, g.to) : [];
    tip.innerHTML = `<b>Codón ${g.codon + 1}, letra ${g.letter + 1}: ${G.DNA[g.position]} → ${g.base}</b><span class="mono">${before} → ${after}${g.from && g.to ? ` · ${G.names[g.from]} → ${G.names[g.to]}` : ''}</span><span class="tip-cat ${g.category}">${LABEL[g.effect]}</span>${same !== null ? `<span>Pieza ${piece}: igual en ${same} de ${E.SPECIES.length} especies.</span>` : ''}${also.length ? `<span class="tip-nature">En la naturaleza: ${also.slice(0, 3).join(', ')}${also.length > 3 ? ' y más' : ''} ${also.length === 1 ? 'tiene' : 'tienen'} justo esta pieza.</span>` : ''}<button class="text-button" type="button">Probala en el simulador →</button>`;
    tip.querySelector('button').onclick = () =>
      GenomaLab.tryMutation({ position: g.position, type: 'sub', base: g.base });
    tip.hidden = false;
    const r = box.getBoundingClientRect(),
      { x, top } = place(g.col),
      y = rowY(g.row, top),
      left = Math.max(0, Math.min(r.width - tip.offsetWidth, x - tip.offsetWidth / 2)),
      above = y - tip.offsetHeight - 12;
    tip.style.left = `${left}px`;
    tip.style.top = `${above > 0 ? above : y + layout.cellH + 12}px`;
  }
  canvas.addEventListener('pointermove', e => {
    if (pinned || e.pointerType === 'touch') return;
    const g = hit(e);
    if (g !== hover) {
      hover = g;
      draw();
      show(g, e);
    }
  });
  canvas.addEventListener('pointerleave', () => {
    if (pinned) return;
    hover = null;
    draw();
    show(null);
  });
  // Tocar fija el cartelito (en el celular es la única forma); tocar otra vez lo suelta.
  canvas.addEventListener('click', e => {
    const g = hit(e);
    pinned = g && g !== pinned ? g : null;
    hover = null;
    draw();
    show(pinned, e);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && pinned) {
      pinned = null;
      draw();
      show(null);
    }
  });
  new ResizeObserver(() => {
    if (box.clientWidth && box.clientWidth !== layout?.width) {
      measure();
      draw();
    }
  }).observe(box);

  // Lo que se aprende del mapa: cifras calculadas con el mismo motor.
  const letters = G.letterSurvey(),
    seen = E.missenseSeenInNature(),
    pct = (a, b) => Math.round((a / b) * 100);
  const insights = document.getElementById('insights');
  if (insights)
    insights.innerHTML = `
    <div><b>${letters[1].synonymous} de ${letters[1].total}</b><span>Cambiar la <em>2.ª letra</em> de un codón casi nunca sale gratis: solo ${letters[1].synonymous === 1 ? 'un cambio deja' : `${letters[1].synonymous} cambios dejan`} la proteína igual.</span></div>
    <div><b>${pct(letters[2].synonymous, letters[2].total)} %</b><span>de los cambios en la <em>3.ª letra</em> no cambian nada (${letters[2].synonymous} de ${letters[2].total}): el código genético tiene «sinónimos» que se diferencian justo ahí.</span></div>
    <div><b>1 de cada ${Math.round(seen.missense / seen.seen)}</b><span>cambios de pieza (${seen.seen} de ${seen.missense}) pone una pieza que <em>ya tiene otro animal</em> en ese mismo lugar.</span></div>`;
})();
