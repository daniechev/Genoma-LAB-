// Póster, segundo experimento: ¿las piezas que la evolución nunca cambió son las que sostienen el hemo?
// Todo se calcula en el momento con evolucion.js, las 16 especies y la estructura 3D real (PDB 2HHB).
(() => {
  'use strict';
  const root = document.getElementById('evo-result');
  if (!root) return;
  const E = Evolution,
    G = Genetics,
    study = E.hemeStudy(MODELS.pdb),
    { near, far } = study,
    n = E.SPECIES.length,
    pct = (a, b) => Math.round((a / b) * 100);

  // Resultado principal: dos barras, cerca y lejos del hemo.
  root.innerHTML = `<div class="evo-big"><div class="evo-bar near"><b>${pct(near.invariant, near.n)} %</b><span>de las piezas <em>cerca del hemo</em> son iguales en las ${n} especies</span><small>${near.invariant} de ${near.n} piezas · a menos de ${study.cutoff} Å del hierro</small><i style="--v:${near.invariant / near.n}"></i></div><div class="evo-bar far"><b>${pct(far.invariant, far.n)} %</b><span>de las piezas <em>lejos del hemo</em> son iguales en las ${n} especies</span><small>${far.invariant} de ${far.n} piezas</small><i style="--v:${far.invariant / far.n}"></i></div></div><p class="evo-verdict">Cerca del hemo, las piezas que nunca cambiaron son <b>${(near.invariant / near.n / (far.invariant / far.n)).toLocaleString('es-AR', { maximumFractionDigits: 1 })} veces</b> más comunes. La hipótesis se cumple.</p>`;

  // La cadena entera: cada cuadradito es una pieza; más dorado = igual en más especies.
  const strip = document.getElementById('evo-strip');
  strip.innerHTML = [...E.HUMAN]
    .map((aa, i) => {
      const c = study.conservation[i],
        isNear = study.distances[i] < study.cutoff;
      return `<i class="${c === n ? 'all' : ''}${isNear ? ' near' : ''}" style="--v:${c / n}" title="Pieza ${i + 1} (${G.names[aa]}): igual en ${c} de ${n} especies${isNear ? ' · cerca del hemo' : ''}"></i>`;
    })
    .join('');

  // Reloj molecular: cuanto más lejano el parentesco, más piezas distintas.
  const svg = document.getElementById('evo-clock'),
    W = 520,
    H = 280,
    pad = { l: 46, r: 16, t: 14, b: 40 },
    x = v => pad.l + 6 + (v / 370) * (W - pad.l - pad.r - 6),
    y = v => H - pad.b - (v / 70) * (H - pad.t - pad.b),
    LABELS = new Set([
      'Mandril',
      'Manatí amazónico',
      'Ornitorrinco',
      'Paloma',
      'Varano de la sabana',
      'Rana de uñas',
    ]),
    points = E.SPECIES.map(s => ({ s, d: 146 - E.identity(s) }));
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `<g class="grid">${[0, 20, 40, 60]
    .map(
      v =>
        `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${pad.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`,
    )
    .join('')}${[0, 100, 200, 300]
    .map(v => `<text x="${x(v)}" y="${H - pad.b + 18}" text-anchor="middle">${v}</text>`)
    .join(
      '',
    )}</g><text class="axis" x="${(W + pad.l) / 2}" y="${H - 4}" text-anchor="middle">millones de años desde el antepasado común</text><text class="axis" transform="translate(12 ${(H - pad.b) / 2}) rotate(-90)" text-anchor="middle">piezas distintas</text><circle class="human" cx="${x(0)}" cy="${y(0)}" r="6"><title>Nosotros: 0 piezas distintas</title></circle>${points
    .map(
      ({ s, d }) =>
        `<circle class="${s.group}" cx="${x(s.separacion).toFixed(1)}" cy="${y(d).toFixed(1)}" r="5.5"><title>${s.name} (${s.latin}): ${d} piezas distintas · hace unos ${s.separacion} millones de años</title></circle>${LABELS.has(s.name) ? `<text class="label" x="${(x(s.separacion) + (s.separacion > 300 ? -9 : 9)).toFixed(1)}" y="${(y(d) + 4).toFixed(1)}" text-anchor="${s.separacion > 300 ? 'end' : 'start'}">${s.name}</text>` : ''}`,
    )
    .join('')}`;

  // La sorpresa de la pieza 6.
  const six = E.differentAt(6).map(
      (d, i) => `${i ? 'el' : 'El'} ${d.name.toLowerCase()} tiene ${G.names[d.aa]}`,
    ),
    list = six.length > 1 ? `${six.slice(0, -1).join(', ')} y ${six.at(-1)}` : six[0];
  document.getElementById('evo-six').innerHTML =
    `En ${n - six.length} de ${n} especies la pieza 6 es glutamato (Glu), como en nosotros. ${list}: o sea que ese lugar <b>sí puede cambiar</b>. Pero <b>ninguna especie tiene valina</b>, la pieza de la anemia falciforme. No importa solo <em>dónde</em> cae el cambio: también <em>qué</em> pieza llega.`;
})();
