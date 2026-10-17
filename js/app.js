// Interfaz de la página: pestañas, simulador, recorrido guiado y contador del stand.
// La ciencia está en genetica.js; acá solo se muestra.
(() => {
  'use strict';
  const G = Genetics,
    $ = id => document.getElementById(id),
    all = selector => [...document.querySelectorAll(selector)];
  // ---- Textos de los casos reales ----
  const caseInfo = {
    sickle: {
      goal: 'Andá al <b>codón 7: GAG</b>. Cambiá su letra del medio para que la pieza 6 deje de ser glutamato (Glu) y pase a ser valina (Val).',
      display: 'G <span>?</span> G',
      hint: 'Pista: el codón tiene que quedar GTG.',
      toast: 'Codón 7 seleccionado: cambiá la A del medio por T y hacé tu predicción.',
      tour: [
        'Este es el codón 7 del gen de la hemoglobina: GAG. Le indica a la célula que ponga la pieza 6, glutamato (Glu).',
        'Cambiamos una sola letra: la A del medio por una T. GAG pasa a ser GTG. ¿Qué creés que le pasa a la proteína?',
        'Ahora la pieza 6 es valina (Val). Cambió 1 pieza de 146, pero alcanza: esta hemoglobina forma fibras cuando falta oxígeno y deforma los glóbulos rojos. Es la anemia falciforme.',
      ],
      note: '<b>Encontraste el caso de la anemia falciforme: Glu6Val.</b> Cambiaste la letra 20, A por T. La hemoglobina alterada puede formar fibras cuando hay poco oxígeno y deformar los glóbulos rojos. El visor marca la pieza 6 en la estructura normal.',
    },
    hbc: {
      goal: 'Andá al <b>codón 7: GAG</b>, el mismo de la anemia falciforme. Cambiá su <b>primera</b> letra para que la pieza 6 pase de glutamato (Glu) a lisina (Lys).',
      display: '<span>?</span> A G',
      hint: 'Pista: la lisina se escribe con los codones AAA o AAG.',
      toast: 'Codón 7 seleccionado: cambiá la G del principio por A y hacé tu predicción.',
      tour: [
        'Volvemos al mismo codón 7: GAG. Esta vez vamos a cambiar otra de sus letras.',
        'Cambiamos la primera letra: la G por una A. GAG pasa a ser AAG. ¿Será el mismo resultado?',
        'La pieza 6 ahora es lisina (Lys). Mismo lugar, otra letra, otra enfermedad: la hemoglobina C forma cristales y suele dar una anemia más leve.',
      ],
      note: '<b>Encontraste la hemoglobina C: Glu6Lys.</b> Cambiaste la letra 19, G por A. Es el mismo lugar que la anemia falciforme, pero con otra letra, y el resultado es distinto: esta hemoglobina tiende a formar cristales dentro del glóbulo rojo y suele causar una anemia más leve. El visor marca la pieza 6 en la estructura normal.',
    },
    thal: {
      goal: 'Andá al <b>codón 40: CAG</b>, que fabrica la pieza 39, glutamina (Gln). Cambiá su <b>primera</b> letra para convertirlo en una señal de STOP.',
      display: '<span>?</span> A G',
      hint: 'Pista: las señales de STOP son TAA, TAG y TGA.',
      toast: 'Codón 40 seleccionado: cambiá la C del principio por T y hacé tu predicción.',
      tour: [
        'Ahora vamos al codón 40: CAG. Le indica a la célula que ponga la pieza 39, glutamina (Gln).',
        'Cambiamos la primera letra: la C por una T. CAG pasa a ser TAG, que es una señal de STOP.',
        'La lectura se corta antes de tiempo: la cadena beta queda con 38 de sus 146 piezas. Sin suficiente cadena beta, el cuerpo fabrica menos hemoglobina. Es una beta-talasemia.',
      ],
      note: '<b>Encontraste un caso de beta-talasemia: Gln39Stop.</b> Cambiaste la letra 118, C por T, y el codón CAG se volvió TAG, una señal de STOP. La lectura se corta y la cadena beta queda con solo 38 de sus 146 piezas. Sin suficiente cadena beta, el cuerpo fabrica menos hemoglobina.',
    },
  };
  // ---- Nombres de cada resultado ----
  const titles = {
    nada: 'No cambió ninguna pieza',
    pieza: 'Cambió una pieza',
    corte: 'La proteína se cortó',
    desorden: 'Se desordenó lo que sigue',
  };
  const effects = {
    synonymous: 'Mutación silenciosa',
    missense: 'Cambio de aminoácido',
    nonsense: 'STOP prematuro',
    'start-loss': 'Pérdida del inicio',
    'stop-loss': 'Pérdida del STOP',
    frameshift: 'Cambio del marco de lectura',
  };
  const baseNames = { A: 'adenina', T: 'timina', C: 'citosina', G: 'guanina' };
  const idle = 'La hemoglobina ayuda a llevar oxígeno por tu cuerpo.';
  const empty = () => ({ nada: 0, pieza: 0, corte: 0, desorden: 0, ok: 0, n: 0 });
  // ---- Estado: qué letra está elegida, qué mutación se hizo y el contador del stand ----
  let stats = empty(),
    persistent = true,
    position = 19,
    offset = 0,
    perView = 4,
    current = null,
    revealed = false,
    toastTimer,
    resetTimer,
    resetArmed = false;
  const counterKey = 'genomalab-app-contador';
  function notify(message) {
    $('toast').textContent = message;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($('toast').hidden = true), 5500);
  }
  // Guarda el contador del stand en este navegador.
  function save() {
    try {
      localStorage.setItem(counterKey, JSON.stringify(stats));
    } catch {
      persistent = false;
      notify(
        'El navegador no permite guardar. Los resultados duran hasta cerrar esta página; podés descargarlos.',
      );
    }
    renderStats();
  }
  try {
    const stored = JSON.parse(localStorage.getItem(counterKey) || 'null');
    if (
      stored &&
      Object.keys(empty()).every(k => Number.isSafeInteger(stored[k]) && stored[k] >= 0) &&
      stored.ok <= stored.n &&
      stored.n <= stored.nada + stored.pieza + stored.corte + stored.desorden
    )
      stats = Object.fromEntries(Object.keys(empty()).map(k => [k, stored[k]]));
  } catch {
    persistent = false;
  }
  // ---- Visor 3D ----
  const viewer = new ProteinViewer($('protein'), MODELS);
  const piezas = n => (n === 1 ? '1 pieza' : `${n} piezas`);
  const aaName = codon => G.names[G.table[codon]];
  const fullNames = {
    A: 'alanina',
    R: 'arginina',
    N: 'asparagina',
    D: 'aspartato',
    C: 'cisteína',
    E: 'glutamato',
    Q: 'glutamina',
    G: 'glicina',
    H: 'histidina',
    I: 'isoleucina',
    L: 'leucina',
    K: 'lisina',
    M: 'metionina',
    F: 'fenilalanina',
    P: 'prolina',
    S: 'serina',
    T: 'treonina',
    W: 'triptófano',
    Y: 'tirosina',
    V: 'valina',
  };
  const aaFull = codon => `${fullNames[G.table[codon]]} (${aaName(codon)})`;
  function tile(b, tag = 'span', extra = '') {
    const el = document.createElement(tag);
    el.className = `base ${b.toLowerCase()}${extra}`;
    el.textContent = b;
    return el;
  }

  // Una sola pantalla: el ADN, el cambio y la proteína se ven a la vez.
  function clearResult() {
    const had = current;
    current = null;
    revealed = false;
    viewer.result = null;
    viewer.focus = null;
    $('focus-mutation').hidden = true;
    $('science-note').hidden = true;
    $('viewer-overlay').textContent = idle;
    if (had) emit('limpio');
  }
  // Avisa a los otros módulos (fábrica, sangre…) qué pasó en el simulador.
  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent(`genoma:${name}`, { detail }));
  }
  const labelWidth = () => $('codons').querySelector('.codon-labels')?.offsetWidth || 70;
  function measure() {
    const strip = $('codons'),
      width = strip.clientWidth - labelWidth();
    if (width <= 0) return false;
    const css = getComputedStyle(strip),
      size = parseFloat(css.getPropertyValue('--tile')) || 36,
      gap = parseFloat(css.columnGap) || 14;
    const n = Math.max(2, Math.min(12, Math.floor((width + gap) / (3 * size + 6 + gap))));
    const changed = n !== perView;
    perView = n;
    return changed;
  }
  function cell(cls, text) {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    return el;
  }
  // Pieza que fabrica el codón n de la secuencia mutada: '' si ya no se fabrica (después del STOP o sin inicio).
  function mutatedPiece(r, n) {
    const codon = r.mutated.slice(n * 3, n * 3 + 3);
    if (r.startLost || codon.length < 3 || (r.stop >= 0 && n > r.stop)) return '';
    return aaName(codon);
  }
  // Dibuja la fila de codones: letras, número de codón y la pieza que indica (antes y después del cambio).
  function renderGene() {
    const sel = Math.floor(position / 3);
    if (measure() && (sel < offset || sel >= offset + perView)) centerOn(position);
    const max = 148 - perView;
    offset = Math.max(0, Math.min(max, offset));
    const r = current,
      strip = $('codons');
    strip.replaceChildren();
    strip.classList.toggle('mutated', !!r);
    $('gene-range').max = max;
    $('gene-range').value = offset;
    $('region-label').textContent = `Codones ${offset + 1}–${offset + perView} de 148`;
    const labels = document.createElement('div');
    labels.className = 'codon-labels';
    labels.setAttribute('aria-hidden', 'true');
    labels.append(
      cell('codon-number', 'Codón'),
      cell('codon-row-label', r ? 'Antes' : 'ADN'),
      cell('codon-aa', 'Pieza'),
    );
    if (r) labels.append(cell('codon-row-label after', 'Después'), cell('codon-aa', 'Pieza'));
    strip.append(labels);
    for (let codon = offset; codon < offset + perView; codon++) {
      const el = document.createElement('div');
      el.className = 'codon' + (Math.floor(position / 3) === codon ? ' active' : '');
      el.append(cell('codon-number', codon + 1));
      const group = document.createElement('div');
      group.className = 'codon-bases';
      for (let j = 0; j < 3; j++) {
        const p = codon * 3 + j,
          b = G.DNA[p],
          mark =
            r && p === r.position && r.type !== 'ins'
              ? r.type === 'del'
                ? ' removed'
                : ' changed'
              : '',
          button = tile(b, 'button', (position === p ? ' selected' : '') + mark);
        button.dataset.pos = p;
        button.setAttribute(
          'aria-label',
          `Letra ${p + 1}: ${b} (${baseNames[b]}), codón ${codon + 1}`,
        );
        button.setAttribute('aria-pressed', String(position === p));
        button.addEventListener('click', () => {
          select(p);
          $('codons').querySelector(`[data-pos="${p}"]`)?.focus({ preventScroll: true });
        });
        group.append(button);
      }
      el.append(group);
      const original = aaName(G.DNA.slice(codon * 3, codon * 3 + 3));
      el.append(cell('codon-aa', original));
      if (r) {
        const after = document.createElement('div');
        after.className = 'codon-bases after';
        for (let i = codon * 3; i < Math.min(r.mutated.length, codon * 3 + 3); i++)
          after.append(
            tile(r.mutated[i], 'span', i === r.changeIndex && r.type !== 'del' ? ' changed' : ''),
          );
        el.append(after);
        const piece = mutatedPiece(r, codon);
        el.append(
          cell(
            'codon-aa' +
              (!revealed
                ? ' hidden-aa'
                : piece === ''
                  ? ' gone'
                  : piece !== original
                    ? ' diff'
                    : ''),
            !revealed ? '?' : piece || '—',
          ),
        );
      }
      strip.append(el);
    }
    $('previous').disabled = offset === 0;
    $('next').disabled = offset === max;
  }
  function centerOn(p) {
    offset = Math.floor(p / 3) - Math.floor(perView / 2);
  }
  // Herramienta: con la letra elegida, un toque cambia, quita o agrega.
  function renderTool() {
    const b = G.DNA[position],
      codon = Math.floor(position / 3),
      triplet = G.DNA.slice(codon * 3, codon * 3 + 3),
      r = current,
      tool = $('tool');
    const summary = !r
      ? ''
      : r.type === 'sub'
        ? `Cambiaste la letra ${r.position + 1}: ${b} → ${r.base}.`
        : r.type === 'del'
          ? `Quitaste la letra ${r.position + 1} (${b}).`
          : `Agregaste una ${r.base} después de la letra ${r.position + 1}.`;
    tool.innerHTML = `<div class="tool-info"><span class="base big ${b.toLowerCase()}">${b}</span><div><b>Letra ${position + 1} de 444</b><span>Codón ${codon + 1}: ${triplet} → ${aaName(triplet)}</span></div>${r ? `<div class="tool-change"><p class="tool-summary">${summary}</p><button class="ghost tool-undo" id="undo"><span aria-hidden="true">↶</span> Deshacer</button></div>` : ''}</div><div class="tool-actions"><div class="tool-group"><span>Cambiar por</span><div class="tool-bases" data-kind="sub"></div></div><div class="tool-group"><span>Agregar después</span><div class="tool-bases" data-kind="ins"></div></div><div class="tool-group"><span>Quitar</span><button class="ghost tool-del${r?.type === 'del' ? ' active' : ''}" id="delete" aria-pressed="${r?.type === 'del'}">✕ Quitar la ${b}</button></div></div>`;
    for (const box of tool.querySelectorAll('.tool-bases')) {
      const kind = box.dataset.kind;
      for (const option of 'ATCG') {
        if (kind === 'sub' && option === b) continue;
        const on = r?.type === kind && r.base === option,
          button = tile(option, 'button', on ? ' active' : '');
        button.setAttribute(
          'aria-label',
          `${kind === 'sub' ? 'Cambiar por' : 'Agregar después'} ${option} (${baseNames[option]})`,
        );
        button.setAttribute('aria-pressed', String(on));
        button.onclick = () => apply({ position, type: kind, base: option });
        box.append(button);
      }
    }
    $('delete').onclick = () => apply({ position, type: 'del' });
    $('undo') && ($('undo').onclick = undo);
  }
  function render() {
    renderGene();
    renderTool();
    renderResult();
  }
  function select(p) {
    if (p !== position) clearResult();
    position = p;
    render();
  }
  function undo() {
    clearResult();
    render();
    $('tool').querySelector('.tool-bases button')?.focus({ preventScroll: true });
  }
  // Aplica una mutación y muestra el resultado al instante (el recorrido guiado pide adivinar antes).
  function apply(input, { guess = false, count = true } = {}) {
    let result;
    try {
      result = G.simulate(input);
    } catch (e) {
      notify(e.message);
      return null;
    }
    clearResult();
    position = input.position;
    current = result;
    if (Math.floor(position / 3) < offset || Math.floor(position / 3) >= offset + perView)
      centerOn(position);
    if (guess) render();
    else reveal(null, count);
    if (!tour.active)
      $('result')
        .closest('.panel')
        .scrollIntoView({
          block: 'nearest',
          behavior: viewer.reduced.matches ? 'instant' : 'smooth',
        });
    return result;
  }
  // ---- Panel de resultado ----
  // Resumen en palabras simples: es lo primero que se lee.
  function lead(r) {
    if (r.effect === 'start-loss')
      return 'Se perdió la señal de inicio de la receta. En este modelo, la proteína no se fabrica.';
    if (r.effect === 'stop-loss')
      return 'Se perdió la señal de STOP del final. La fabricación podría continuar y no sabemos dónde termina.';
    if (r.effect === 'synonymous')
      return `Cambiaste una letra, pero el codón sigue indicando la misma pieza: ${aaFull(r.originalCodon)}. La proteína queda igual.`;
    if (r.effect === 'missense')
      return `La pieza ${r.piece} de la proteína cambió: antes era ${aaFull(r.originalCodon)} y ahora es ${aaFull(r.mutatedCodon)}. Todas las demás quedaron igual.`;
    if (r.effect === 'nonsense')
      return `Apareció una señal de STOP antes de tiempo. La proteína queda con ${piezas(r.mature.length)} en lugar de 146.`;
    return `Al ${r.type === 'del' ? 'quitar' : 'agregar'} una letra, los grupos de tres que siguen se corrieron.${r.startLost ? ' Además se perdió la señal de inicio: en este modelo, la proteína no se fabrica.' : r.lengthUnknown ? ' No aparece una señal de STOP, así que no sabemos dónde termina la proteína.' : r.mature.length === 146 ? ' La proteína conserva 146 piezas.' : ` La proteína queda con ${piezas(r.mature.length)} en lugar de 146.`}`;
  }
  // Barra que compara la proteína normal (146 piezas) con la mutada.
  function chainBar(r) {
    const length = Math.min(146, r.mature.length),
      first = r.differences[0],
      pct = n => `${((n / 146) * 100).toFixed(2)}%`;
    const same = r.effect === 'frameshift' && first ? first - 1 : length,
      wrong = length - same;
    const pin =
      ['missense', 'synonymous'].includes(r.effect) && r.piece >= 1 && r.piece <= 146
        ? `<i class="pin${r.effect === 'missense' ? ' bad' : ''}" style="left:${pct(r.piece - 0.5)}"></i>`
        : '';
    const count = r.lengthUnknown ? `${r.mature.length}+ piezas` : piezas(r.mature.length);
    return `<div class="chain-compare"><div class="chain-row"><span>Proteína normal</span><div class="chain-bar"><i class="ok full" style="width:100%"></i></div><b>146 piezas</b></div><div class="chain-row"><span>Tu proteína</span><div class="chain-bar"><i class="ok${same === 146 ? ' full' : ''}" style="width:${pct(same)}"></i><i class="wrong" style="width:${pct(wrong)}"></i>${pin}</div><b>${count}</b></div><div class="chain-key"><span><i></i>Igual</span>${r.effect === 'missense' ? '<span><i class="bad"></i>Pieza cambiada</span>' : ''}${wrong ? '<span><i class="wrong"></i>Piezas distintas</span>' : ''}${length < 146 ? '<span><i class="gone"></i>No se fabrica</span>' : ''}</div></div>`;
  }
  const guesses = [
    [
      'nada',
      '<i></i><i></i><i></i><i></i><i></i><i></i><i></i>',
      'No cambia nada',
      'La proteína queda igual',
    ],
    [
      'pieza',
      '<i></i><i></i><i></i><i class="x"></i><i></i><i></i><i></i>',
      'Cambia una pieza',
      'Solo una pieza es distinta',
    ],
    [
      'corte',
      '<i></i><i></i><i></i><i class="o"></i><i class="o"></i><i class="o"></i><i class="o"></i>',
      'La proteína se corta',
      'Queda más corta, incompleta',
    ],
    [
      'desorden',
      '<i></i><i></i><i></i><i class="w"></i><i class="w"></i><i class="w"></i><i class="w"></i>',
      'Se desordena lo que sigue',
      'Las piezas siguientes salen distintas, o la proteína no sabe dónde terminar',
    ],
  ];
  let lastGuess = null;
  function resultHeading(r) {
    if (r.effect === 'start-loss') return 'Falta la señal para empezar';
    if (r.effect === 'stop-loss') return 'Falta la señal para terminar';
    if (r.effect === 'frameshift') return 'Se corrió toda la lectura';
    return titles[r.category];
  }
  function renderResult() {
    const box = $('result'),
      r = current;
    if (!r) {
      box.innerHTML = `<p class="result-lead">Así es la cadena beta normal: <b>146 piezas</b>. Elegí una letra del ADN y cambiala para ver qué le pasa.</p><div class="chain-compare"><div class="chain-row"><span>Proteína normal</span><div class="chain-bar"><i class="ok full" style="width:100%"></i></div><b>146 piezas</b></div></div>`;
      return;
    }
    if (!revealed) {
      box.innerHTML = `<p class="result-lead">¿Qué creés que le pasa a la proteína?</p><div class="prediction-options">${guesses.map(([key, beads, title, text]) => `<button data-guess="${key}"><span class="beads" aria-hidden="true">${beads}</span><b>${title}</b><span>${text}</span></button>`).join('')}</div><button class="text-button" id="skip-guess">Ver el resultado sin adivinar</button>`;
      box.querySelectorAll('[data-guess]').forEach(
        b =>
          (b.onclick = () => {
            reveal(b.dataset.guess);
            if (tour.active) tourGo(tour.i + 1);
          }),
      );
      $('skip-guess').onclick = () => reveal();
      return;
    }
    const guess = lastGuess,
      heading = resultHeading(r);
    box.innerHTML = `<div class="result-top"><h3>${heading}</h3>${guess ? `<span class="guess-feedback${guess === r.category ? ' hit' : ''}">${guess === r.category ? '✓ ¡Acertaste!' : 'Esta vez no acertaste'}</span>` : ''}</div><p class="result-lead">${lead(r)}</p><p class="sci-name">En ciencia se llama: ${effects[r.effect].toLowerCase()}.</p><button class="see-3d" id="see-3d">Ver mi proteína en 3D <span aria-hidden="true">↓</span></button>${chainBar(r)}${r.realCase ? `<p class="sickle-note">${caseInfo[r.realCase.id].note}</p>` : ''}`;
    $('see-3d').onclick = () => {
      if (!$('focus-mutation').hidden) viewer.focusMutation();
      document.querySelector('.protein-panel').scrollIntoView({
        block: 'center',
        behavior: viewer.reduced.matches ? 'instant' : 'smooth',
      });
    };
  }
  // Muestra el resultado, lo suma al contador y lo marca en el visor 3D.
  function reveal(guess = null, count = true) {
    if (!current || revealed) return;
    revealed = true;
    lastGuess = guess;
    const r = current;
    if (count) {
      stats[r.category]++;
      if (guess) {
        stats.n++;
        if (guess === r.category) stats.ok++;
      }
      save();
    }
    viewer.result = r;
    viewer.focus = null;
    $('focus-mutation').hidden = r.piece < 1 || r.piece > 146;
    $('science-note').hidden = false;
    $('viewer-overlay').textContent =
      r.effect === 'stop-loss'
        ? 'El cambio está en el STOP, fuera de la cadena dibujada.'
        : r.startLost
          ? 'La cadena no se fabrica por esta vía en el modelo.'
          : r.piece > 146
            ? 'Cambio al final de la secuencia.'
            : r.effect === 'missense'
              ? `El punto rojo marca la pieza ${r.piece}, la que cambió.`
              : r.effect === 'synonymous'
                ? `El punto marca la pieza ${r.piece}: quedó igual.`
                : r.effect === 'nonsense'
                  ? 'La parte apagada ya no se fabrica.'
                  : 'En naranja, las piezas distintas. La parte apagada ya no se fabrica.';
    render();
    emit('resultado', { result: r, guess, hit: guess ? guess === r.category : null });
  }
  function restart() {
    stopTour();
    clearResult();
    viewer.reset();
    viewer.rotating = !viewer.reduced.matches;
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  // ---- Pestañas y estadísticas del stand ----
  let currentTab = 'proyecto';
  function showTab(tab) {
    const changed = tab !== currentTab;
    currentTab = tab;
    all('.tab-page').forEach(p => {
      p.hidden = p.id !== `tab-${tab}`;
      // Entrada de cine: la página nueva sube y se enfoca; se reinicia la animación cada vez.
      if (!p.hidden && changed) {
        p.classList.remove('entering');
        void p.offsetWidth;
        p.classList.add('entering');
      }
    });
    all('.nav').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
      if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    moveNavPill();
    if (tab === 'stats' || tab === 'proyecto') renderStats();
    if (tab === 'lab') {
      viewer.resize();
      render();
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (changed) {
      Sound.ui('swoosh');
      emit('pestaña', tab);
    }
  }
  // La píldora blanca de la barra se desliza hasta la pestaña elegida.
  function moveNavPill() {
    const nav = document.querySelector('.topbar nav'),
      active = nav.querySelector('.nav.active');
    nav.classList.toggle('has-pill', !!active);
    if (!active) return;
    nav.style.setProperty('--pill-x', `${active.offsetLeft}px`);
    nav.style.setProperty('--pill-w', `${active.offsetWidth}px`);
  }
  new ResizeObserver(moveNavPill).observe(document.querySelector('.topbar nav'));
  function renderStats() {
    const total = stats.nada + stats.pieza + stats.corte + stats.desorden;
    $('stats-overview').innerHTML =
      `<div class="stat"><b>${total}</b>Mutaciones descubiertas</div><div class="stat"><b>${stats.n}</b>Predicciones del público</div><div class="stat"><b>${stats.n ? Math.round((stats.ok / stats.n) * 100) + ' %' : '—'}</b>${stats.n ? `${stats.ok} respuestas correctas` : 'Todavía sin predicciones'}</div>`;
    $('stats-bars').innerHTML = Object.entries(titles)
      .map(
        ([key, label]) =>
          `<div class="bar-row"><div><span>${label}</span><b>${stats[key]}</b></div><div class="bar-track"><i style="width:${total ? (stats[key] / total) * 100 : 0}%"></i></div></div>`,
      )
      .join('');
    $('stand-stats').innerHTML =
      `<div class="stat"><b>${total}</b>mutaciones probadas</div><div class="stat"><b>${stats.n ? Math.round((stats.ok / stats.n) * 100) + ' %' : '—'}</b>${stats.n ? `de ${stats.n === 1 ? '1 predicción acertada' : stats.n + ' predicciones acertadas'}` : 'todavía sin predicciones'}</div>`;
    $('storage-status').textContent = persistent
      ? 'Los datos persisten en este navegador. Descargalos antes de cambiar de equipo o borrar los datos del navegador.'
      : 'Guardado permanente no disponible. Descargá los resultados antes de cerrar.';
  }
  // ---- Botones ----
  all('[data-tab]').forEach(
    b =>
      (b.onclick = () => {
        stopTour();
        showTab(b.dataset.tab);
      }),
  );
  all('[data-return-lab]').forEach(b => (b.onclick = () => showTab('lab')));
  document.querySelector('.brand').onclick = e => {
    e.preventDefault();
    stopTour();
    showTab('proyecto');
  };
  $('previous').onclick = () => {
    offset -= Math.max(1, perView - 1);
    renderGene();
  };
  $('next').onclick = () => {
    offset += Math.max(1, perView - 1);
    renderGene();
  };
  $('gene-range').oninput = e => {
    offset = Number(e.target.value);
    renderGene();
  };
  $('random').onclick = () => {
    const n = Math.random(),
      p = Math.floor(Math.random() * G.DNA.length),
      kind = n < 0.6 ? 'sub' : n < 0.8 ? 'del' : 'ins',
      choices = [...'ATCG'].filter(b => kind !== 'sub' || b !== G.DNA[p]);
    position = p;
    centerOn(p);
    apply({ position: p, type: kind, base: choices[Math.floor(Math.random() * choices.length)] });
  };
  // Casos reales: textos de cada misión (los datos científicos están en genetica.js).
  let missionCase = 'sickle';
  function renderMission() {
    const c = G.CASES.find(x => x.id === missionCase),
      info = caseInfo[c.id];
    all('[data-case]').forEach(b => {
      const on = b.dataset.case === c.id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    $('case-detail').innerHTML =
      `<h3>${c.name}</h3><p>${info.goal}</p><div class="mission-codon">${info.display}</div><p class="muted">${info.hint}</p>`;
    $('start-mission').textContent = `Ir al codón ${Math.floor(c.position / 3) + 1}`;
  }
  all('[data-case]').forEach(
    b =>
      (b.onclick = () => {
        missionCase = b.dataset.case;
        renderMission();
      }),
  );
  $('mission').onclick = () => {
    renderMission();
    $('mission-dialog').showModal();
  };
  $('close-mission').onclick = () => $('mission-dialog').close();
  $('start-mission').onclick = () => {
    const c = G.CASES.find(x => x.id === missionCase);
    $('mission-dialog').close();
    stopTour();
    showTab('lab');
    clearResult();
    position = c.position;
    centerOn(c.position);
    render();
    $('tool').scrollIntoView({ block: 'nearest' });
    notify(caseInfo[c.id].toast);
  };
  // Modo evolución del visor: dorado = pieza igual en las 16 especies; el punto amarillo es el hierro del hemo.
  const study = Evolution.hemeStudy(MODELS.pdb);
  viewer.evolutionHeme = (() => {
    const chain = MODELS.pdb.chains[MODELS.pdb.beta],
      his = chain[91];
    return MODELS.pdb.hemes.reduce((best, fe) =>
      Math.hypot(his.x - fe[0], his.y - fe[1], his.z - fe[2]) <
      Math.hypot(his.x - best[0], his.y - best[1], his.z - best[2])
        ? fe
        : best,
    );
  })();
  // Con un resultado nuevo, el visor vuelve a marcar la mutación.
  document.addEventListener('genoma:resultado', () => (viewer.evolution = null));
  all('[data-evo-view]').forEach(
    b =>
      (b.onclick = () => {
        stopTour();
        showTab('lab');
        clearResult();
        render();
        viewer.model = 'pdb';
        viewer.reset();
        viewer.evolution = study.conservation;
        document.querySelector('.protein-panel').scrollIntoView({ block: 'center' });
        notify(
          'Dorado: piezas iguales en las 16 especies. El punto amarillo es el hierro del hemo.',
        );
      }),
  );
  $('focus-mutation').onclick = () => viewer.focusMutation();
  $('zoom-in').onclick = () => viewer.zoomBy(1.2);
  $('zoom-out').onclick = () => viewer.zoomBy(1 / 1.2);
  $('reset-view').onclick = () => viewer.reset();
  $('fullscreen').onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      notify('Este navegador no permite activar pantalla completa aquí. Podés usar F11.');
    }
  };
  document.addEventListener('fullscreenchange', () => {
    $('fullscreen').setAttribute(
      'aria-label',
      document.fullscreenElement ? 'Salir de pantalla completa' : 'Activar pantalla completa',
    );
  });
  $('reset-count').onclick = () => {
    if (!resetArmed) {
      resetArmed = true;
      $('reset-count').textContent = 'Confirmar: borrar todos los resultados';
      resetTimer = setTimeout(() => {
        resetArmed = false;
        $('reset-count').textContent = 'Reiniciar contador';
      }, 7000);
      return;
    }
    clearTimeout(resetTimer);
    resetArmed = false;
    stats = empty();
    save();
    $('reset-count').textContent = 'Reiniciar contador';
    notify('Contador reiniciado.');
  };
  $('export').onclick = () => {
    const rows = [
      'Categoría;Cantidad',
      ...Object.entries(titles).map(([key, label]) => `${label};${stats[key]}`),
      `Predicciones;${stats.n}`,
      `Aciertos;${stats.ok}`,
    ];
    const url = URL.createObjectURL(
        new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' }),
      ),
      a = document.createElement('a');
    a.href = url;
    a.download = `resultados-adn-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (document.modelContext?.registerTool) {
    try {
      document.modelContext.registerTool({
        name: 'stage_hbb_mutation',
        title: 'Preparar una mutación de HBB',
        description:
          'Prepara una mutación en la interfaz, sin revelar ni contabilizar el resultado. La posición es de 1 a 444.',
        inputSchema: {
          type: 'object',
          properties: {
            position: { type: 'integer', minimum: 1, maximum: 444 },
            type: { type: 'string', enum: ['sub', 'del', 'ins'] },
            base: { type: 'string', enum: ['A', 'T', 'C', 'G'] },
          },
          required: ['position', 'type'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute(input) {
          const config = { position: input.position - 1, type: input.type, base: input.base };
          G.simulate(config);
          showTab('lab');
          apply(config, { guess: true });
          return { position: position + 1, type: config.type, stage: 'prediction' };
        },
      });
    } catch {
      /* API opcional del navegador: si falla, los botones normales siguen funcionando. */
    }
  }
  new ResizeObserver(() => {
    if (measure()) renderGene();
  }).observe($('codons'));
  // Póster: resultados de las 1.332 sustituciones, calculados con el mismo motor del simulador.
  function renderSurvey() {
    const counts = G.substitutionSurvey(),
      total = Object.values(counts).reduce((a, b) => a + b, 0),
      pct = n =>
        ((n / total) * 100).toLocaleString('es-AR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }) + ' %';
    const rows = [
      ['missense', 'Cambia una pieza', 'cambio de aminoácido', 'pieza'],
      ['synonymous', 'No cambia nada', 'mutación silenciosa', 'nada'],
      ['nonsense', 'La proteína se corta', 'STOP prematuro', 'corte'],
      ['start-loss', 'No arranca', 'pérdida del inicio', 'corte'],
      ['stop-loss', 'No termina', 'pérdida del STOP', 'desorden'],
    ];
    $('survey-headline').innerHTML =
      `<b>${Math.round((counts.missense / total) * 10)} de cada 10</b> cambian una pieza de la proteína`;
    $('survey').innerHTML = rows
      .map(
        ([key, label, sci, cat]) =>
          `<div class="survey-row"><div class="survey-label"><span>${label} <small>${sci}</small></span><b>${counts[key].toLocaleString('es-AR')} · ${pct(counts[key])}</b></div><div class="bar-track"><i class="${cat}" style="width:${Math.max(0.6, (counts[key] / total) * 100)}%"></i></div></div>`,
      )
      .join('');
    $('survey-table').innerHTML = rows
      .map(
        ([key, , sci]) =>
          `<tr><td>${sci[0].toUpperCase() + sci.slice(1)}</td><td>${counts[key].toLocaleString('es-AR')}</td><td>${pct(counts[key])}</td></tr>`,
      )
      .join('');
  }

  // Recorrido guiado: muestra los tres casos reales solo, paso a paso, sin sumar al contador del stand.
  const scenes = [
    ...G.CASES.flatMap((c, n) =>
      [0, 1, 2].map(stage => ({ c, n, stage, text: caseInfo[c.id].tour[stage] })),
    ),
    {
      end: true,
      text: 'Conclusión: una sola letra puede no cambiar nada, cambiar una pieza o cortar toda la proteína. Lo que decide es dónde cae el cambio y qué tipo de cambio es.',
    },
  ];
  // auto: lo arrancó el modo stand y se repite solo hasta que alguien toque la pantalla.
  const tour = {
    active: false,
    auto: false,
    i: 0,
    paused: false,
    timer: null,
    remaining: 0,
    started: 0,
  };
  function playScene(scene) {
    const { c, stage } = scene;
    const mutation = { position: c.position, type: 'sub', base: c.base };
    if (stage === 0) {
      clearResult();
      viewer.reset();
      viewer.rotating = !viewer.reduced.matches;
      position = c.position;
      centerOn(position);
      render();
    } else if (stage === 1) apply(mutation, { guess: true });
    else {
      if (!(revealed && current?.realCase?.id === c.id))
        apply(mutation, { guess: false, count: false });
      viewer.focusMutation();
    }
    scrollBelowTour(document.querySelector(stage === 2 ? '.result-panel' : '.dna-panel'));
  }
  function tourGo(i) {
    if (!tour.active) return;
    tour.i = Math.max(0, Math.min(scenes.length - 1, i));
    const scene = scenes[tour.i];
    clearTimeout(tour.timer);
    if (!scene.end) playScene(scene);
    $('tour-label').textContent = scene.end
      ? 'RECORRIDO GUIADO · FINAL'
      : `CASO ${scene.n + 1} DE 3 · ${scene.c.name.toUpperCase()}`;
    $('tour-text').textContent = scene.text;
    $('tour-count').textContent = `${tour.i + 1} / ${scenes.length}`;
    $('tour-prev').disabled = tour.i === 0;
    $('tour-next').hidden = scene.end;
    $('tour-pause').hidden = scene.end;
    $('tour-end').hidden = !scene.end;
    tour.remaining = scene.end ? 0 : 3000 + scene.text.split(' ').length * 300;
    const bar = $('tour-timer');
    bar.style.animation = 'none';
    void bar.offsetWidth;
    bar.style.animation = scene.end ? 'none' : `tour-timer ${tour.remaining}ms linear forwards`;
    bar.style.width = scene.end ? '100%' : '';
    if (!scene.end && !tour.paused) runTimer();
    else if (scene.end && tour.auto) tour.timer = setTimeout(() => tourGo(0), 15000);
    bar.style.animationPlayState = tour.paused ? 'paused' : 'running';
  }
  // Lleva el panel a la vista sin que lo tape la barra fija del recorrido.
  function scrollBelowTour(el) {
    const bar = $('tour-bar').getBoundingClientRect().bottom + 12,
      rect = el.getBoundingClientRect();
    if (rect.top < bar || rect.top > innerHeight * 0.6)
      window.scrollBy({ top: rect.top - bar, behavior: 'instant' });
  }
  function runTimer() {
    tour.started = performance.now();
    tour.timer = setTimeout(() => tourGo(tour.i + 1), tour.remaining);
  }
  function setPaused(paused) {
    tour.paused = paused;
    clearTimeout(tour.timer);
    if (paused) tour.remaining -= performance.now() - tour.started;
    else if (!scenes[tour.i].end) runTimer();
    $('tour-timer').style.animationPlayState = paused ? 'paused' : 'running';
    $('tour-pause').textContent = paused ? '▶' : '❚❚';
    $('tour-pause').setAttribute('aria-label', paused ? 'Seguir' : 'Pausar');
  }
  function startTour(auto = false) {
    if ($('mission-dialog').open) $('mission-dialog').close();
    showTab('lab');
    tour.active = true;
    tour.auto = auto;
    document.body.classList.add('touring');
    $('tour-bar').hidden = false;
    setPaused(false);
    tourGo(0);
  }
  function stopTour() {
    if (!tour.active) return;
    tour.active = false;
    tour.auto = false;
    clearTimeout(tour.timer);
    document.body.classList.remove('touring');
    $('tour-bar').hidden = true;
  }
  $('start-tour').onclick = () => startTour();
  $('tour-replay').onclick = () => {
    setPaused(false);
    tourGo(0);
  };
  $('tour-prev').onclick = () => tourGo(tour.i - 1);
  $('tour-next').onclick = () => tourGo(tour.i + 1);
  $('tour-pause').onclick = () => setPaused(!tour.paused);
  $('tour-exit').onclick = () => {
    stopTour();
    restart();
  };
  $('tour-try').onclick = () => restart();
  $('tour-project').onclick = () => {
    stopTour();
    showTab('proyecto');
  };
  // Teclado y control remoto de presentaciones: flechas o AvPág/RePág para avanzar, espacio para pausar, Esc para salir.
  document.addEventListener('keydown', e => {
    if (
      !tour.active ||
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.target.closest('input,canvas,dialog,textarea,select')
    )
      return;
    if (['ArrowRight', 'PageDown'].includes(e.key)) {
      e.preventDefault();
      tourGo(tour.i + 1);
    } else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      tourGo(tour.i - 1);
    } else if (e.key === ' ' && !e.target.closest('button')) {
      e.preventDefault();
      if (!scenes[tour.i].end) setPaused(!tour.paused);
    } else if (e.key === 'Escape') {
      stopTour();
      restart();
    }
  });

  // ---- Modo stand: si nadie usa la pantalla un rato, vuelve al inicio y muestra el recorrido guiado ----
  // Se activa en «Resultados del stand» o abriendo la página con ?stand. Queda guardado en este navegador.
  const standKey = 'genomalab-modo-stand',
    STAND_IDLE = 90000;
  let standMode = false,
    lastActivity = performance.now();
  try {
    standMode = localStorage.getItem(standKey) === '1';
  } catch {}
  function setStandMode(on) {
    standMode = on;
    lastActivity = performance.now();
    $('stand-mode').checked = on;
    document.body.classList.toggle('stand', on);
    try {
      localStorage.setItem(standKey, on ? '1' : '0');
    } catch {}
  }
  setStandMode(standMode || new URLSearchParams(location.search).has('stand'));
  $('stand-mode').onchange = e => {
    setStandMode(e.target.checked);
    notify(
      e.target.checked
        ? 'Modo stand activado: tras 90 segundos sin uso, la pantalla vuelve al inicio sola.'
        : 'Modo stand desactivado.',
    );
  };
  let stopOnClick = false;
  for (const type of ['pointerdown', 'pointermove', 'keydown', 'wheel'])
    document.addEventListener(
      type,
      e => {
        lastActivity = performance.now();
        if (type === 'pointermove') return;
        // Alguien tomó el control: el recorrido deja de repetirse y, si tocó fuera de la barra, se corta.
        if (type === 'pointerdown') stopOnClick = tour.auto && !e.target.closest('#tour-bar');
        tour.auto = false;
      },
      { capture: true, passive: true },
    );
  // Se corta en el clic (no en el toque) para que ese mismo clic funcione: elegir una letra, girar la proteína…
  document.addEventListener(
    'click',
    () => {
      if (stopOnClick) stopTour();
      stopOnClick = false;
    },
    { capture: true },
  );
  function goIdle() {
    for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
    stopTour();
    clearResult();
    emit('reposo');
    startTour(true);
  }
  setInterval(() => {
    if (standMode && !tour.auto && performance.now() - lastActivity > STAND_IDLE) goIdle();
  }, 5000);

  // ---- Apariciones al bajar: cada sección entra suavemente la primera vez que se ve ----
  if ('IntersectionObserver' in window && !viewer.reduced.matches) {
    const appear = new IntersectionObserver(
      entries => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            appear.unobserve(entry.target);
          }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    for (const el of document.querySelectorAll('.poster-card, .learning-grid article')) {
      el.classList.add('reveal');
      appear.observe(el);
    }
  }

  // ---- Lo que usan los otros módulos (viaje, fábrica, sangre, mapa de calor…) ----
  window.GenomaLab = {
    viewer,
    notify,
    emit,
    showTab: tab => {
      stopTour();
      showTab(tab);
    },
    startTour,
    get tab() {
      return currentTab;
    },
    get result() {
      return revealed ? current : null;
    },
    get standMode() {
      return standMode;
    },
    // Lleva una mutación al simulador y muestra el resultado (sin modo desafío).
    tryMutation(m, { guess = false } = {}) {
      stopTour();
      showTab('lab');
      clearResult();
      position = m.position;
      centerOn(position);
      return apply(m, { guess });
    },
  };

  centerOn(position);
  renderSurvey();
  renderStats();
  render();
  if (location.hash === '#jurado') startTour();

  // ---- Sin internet: guarda una copia de la app en el dispositivo (solo funciona publicada en la web) ----
  if (
    'serviceWorker' in navigator &&
    (location.protocol === 'https:' || location.hostname === 'localhost')
  ) {
    const firstTime = !navigator.serviceWorker.controller;
    navigator.serviceWorker
      .register('sw.js')
      .then(registration => navigator.serviceWorker.ready.then(() => registration))
      .then(() => {
        if (firstTime) notify('Listo: la app ya funciona aunque no tengas internet.');
      })
      .catch(() => {});
  }
})();
