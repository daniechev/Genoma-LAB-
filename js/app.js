// Interfaz de la página: pestañas, simulador, recorrido guiado, naturaleza y contador del stand.
// La ciencia está en genetica.js; acá solo se muestra.
(() => {
  'use strict';
  const G = Genetics,
    $ = id => document.getElementById(id),
    all = selector => [...document.querySelectorAll(selector)];
  // ---- Textos de los casos reales y de las especies ----
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
  const speciesNotes = {
    leopard:
      '<b>¡El mismo STOP que el del leopardo negro!</b> La pieza 93 es una cisteína, escrita TGT. Con la A, queda TGA y la lectura se corta. Al leopardo le pasó algo parecido en otro gen, el ASIP: su codón TGC se volvió TGA, la proteína quedó cortada y su pelo se volvió negro.',
    llama:
      '<b>¡Así es en la llama!</b> Con esta letra, la pieza 2 pasa de histidina a asparagina, como en la hemoglobina de las llamas, alpacas y guanacos. Ese cambio ayuda a que su hemoglobina agarre más fuerte el oxígeno en la altura de los Andes.',
    mammoth12:
      '<b>¡Uno de los cambios del mamut lanudo!</b> La pieza 12 pasa de treonina a alanina. Junto con otros dos cambios (Ala86Ser y Glu101Gln), ayudaba a que su hemoglobina soltara bien el oxígeno aunque hiciera mucho frío.',
    mammoth86:
      '<b>¡Uno de los cambios del mamut lanudo!</b> La pieza 86 pasa de alanina a serina. Junto con otros dos cambios (Thr12Ala y Glu101Gln), ayudaba a que su hemoglobina soltara bien el oxígeno aunque hiciera mucho frío.',
    kingcheetah:
      '<b>¡Como el guepardo rey!</b> Agregaste una letra cerca del final: la lectura se corre, las últimas piezas cambian y ya no aparece el STOP. Al guepardo rey le pasó algo parecido en otro gen, el <i>Taqpep</i>: una letra de más cambió el final de la proteína y sus manchas se volvieron rayas.',
    mammoth101:
      '<b>¡Uno de los cambios del mamut lanudo!</b> La pieza 101 pasa de glutamato a glutamina. Junto con otros dos cambios (Thr12Ala y Ala86Ser), ayudaba a que su hemoglobina soltara bien el oxígeno aunque hiciera mucho frío.',
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
  const counterKey = 'genomalab-app-contador',
    challengeKey = 'genomalab-desafio';
  let challenge = false;
  try {
    challenge = localStorage.getItem(challengeKey) === '1';
  } catch {}
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
  const bundledAF = JSON.parse(JSON.stringify(MODELS.af));
  const viewer = new ProteinViewer($('protein'), MODELS);
  function restoreCustom() {
    try {
      const text = localStorage.getItem('adn-hbb-custom-pdb');
      if (text) {
        MODELS.af = G.parsePDB(text, true);
        $('import-status').textContent = 'Se restauró tu modelo P68871 guardado en este navegador.';
      }
    } catch {
      $('import-status').textContent =
        'No se pudo restaurar el archivo guardado; se usará el modelo incluido.';
    }
  }
  restoreCustom();
  viewer.onRotation = () => {
    $('rotate').textContent = viewer.rotating ? 'Ⅱ Pausar giro' : '▷ Girar';
    $('rotate').setAttribute('aria-pressed', String(viewer.rotating));
  };
  viewer.onRotation();
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
    current = null;
    revealed = false;
    viewer.result = null;
    viewer.focus = null;
    $('focus-mutation').hidden = true;
    $('science-note').hidden = true;
    $('viewer-overlay').textContent = idle;
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
  // Herramienta: con la letra elegida, un toque la cambia. Agregar y quitar quedan plegados para no cargar la pantalla.
  let moreTools = false;
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
    tool.innerHTML = `<div class="tool-info"><span class="base big ${b.toLowerCase()}">${b}</span><div><b>Letra ${position + 1} de 444</b><span>Codón ${codon + 1}: ${triplet} → ${aaName(triplet)}</span></div>${r ? `<div class="tool-change"><p class="tool-summary">${summary}</p><button class="ghost tool-undo" id="undo"><span aria-hidden="true">↶</span> Deshacer</button></div>` : ''}</div><div class="tool-actions"><div class="tool-group main"><span>Cambiar la ${b} por</span><div class="tool-bases" data-kind="sub"></div></div><button class="text-button tool-more" id="tool-more" aria-expanded="${moreTools}" aria-controls="tool-extra">${moreTools ? 'Ocultar agregar y quitar' : '+ Agregar o quitar una letra'}</button></div><div class="tool-actions tool-extra" id="tool-extra"${moreTools ? '' : ' hidden'}><div class="tool-group"><span>Agregar después</span><div class="tool-bases" data-kind="ins"></div></div><div class="tool-group"><span>Quitar</span><button class="ghost tool-del${r?.type === 'del' ? ' active' : ''}" id="delete" aria-pressed="${r?.type === 'del'}">✕ Quitar la ${b}</button></div></div>`;
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
    $('tool-more').onclick = () => {
      moreTools = !moreTools;
      renderTool();
      $('tool-more').focus({ preventScroll: true });
    };
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
  // Aplica una mutación. Sin el modo desafío, el resultado se ve al instante.
  function apply(input, { guess = challenge, count = true } = {}) {
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
    if (input.type !== 'sub') moreTools = true;
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
  // Explicación completa, para el desplegable «Para curiosos».
  function explanation(r) {
    if (r.effect === 'start-loss')
      return 'El inicio ATG dejó de existir. En este modelo, la célula ya no encuentra la señal para empezar y no fabrica la cadena por esa vía.';
    if (r.effect === 'stop-loss')
      return 'Se perdió la señal STOP del final. El marco de lectura no cambió, pero la fabricación podría continuar. No conocemos la longitud final porque aquí no está incluida la secuencia posterior al gen.';
    if (r.effect === 'synonymous')
      return `El codón ${r.originalCodon} pasó a ${r.mutatedCodon}, pero ambos indican ${aaName(r.originalCodon)}. La secuencia de aminoácidos quedó igual; esto no evalúa otros posibles efectos celulares.`;
    if (r.effect === 'missense')
      return `El codón ${r.codon + 1} pasó de ${r.originalCodon} a ${r.mutatedCodon}. En la pieza ${r.piece}, ${aaName(r.originalCodon)} fue reemplazado por ${aaName(r.mutatedCodon)}. Cambiar una pieza no permite saber por sí solo cuánto cambia la función.`;
    if (r.effect === 'nonsense')
      return `Apareció una señal STOP en el codón ${r.stop + 1}. La traducción se detiene antes de tiempo y la cadena queda con ${r.mature.length} piezas.`;
    return `Al ${r.type === 'del' ? 'quitar' : 'agregar'} una letra, los grupos de tres se desplazan desde el codón ${r.codon + 1}. Se altera cómo se lee lo que sigue.${r.startLost ? ' Además se perdió ATG: en este modelo no se fabrica la cadena por esa vía.' : r.lengthUnknown ? ' No aparece un STOP en la secuencia disponible, así que no conocemos la longitud final.' : ` El primer STOP aparece en el codón ${r.stop + 1}.`}${r.codon >= 147 ? ' El cambio ocurre en el extremo final; el modelo puede no mostrar diferencias en las piezas ya fabricadas.' : ''}`;
  }
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
    const length = r.lengthUnknown ? `${r.mature.length}+` : `${r.mature.length}`;
    box.innerHTML = `<div class="result-top"><h3>${heading}</h3>${guess ? `<span class="guess-feedback${guess === r.category ? ' hit' : ''}">${guess === r.category ? '✓ ¡Acertaste!' : 'Esta vez no acertaste'}</span>` : ''}</div><p class="result-lead">${lead(r)}</p><p class="sci-name">En ciencia se llama: ${effects[r.effect].toLowerCase()}.</p><button class="see-3d" id="see-3d">Ver mi proteína en 3D <span aria-hidden="true">↓</span></button>${chainBar(r)}${r.realCase ? `<p class="sickle-note">${caseInfo[r.realCase.id].note}${r.realCase.id === 'sickle' ? ' <button class="text-button" data-goto="naturaleza:malaria">¿Por qué es tan común? La historia de la malaria →</button>' : ''}</p>` : ''}${r.species ? `<p class="sickle-note species-note">${speciesNotes[r.species.id]} <button class="text-button" data-goto="naturaleza:${{ leopard: 'felinos:3', kingcheetah: 'felinos:4' }[r.species.id] || 'animales'}">${{ leopard: 'La pantera negra →', kingcheetah: 'El guepardo rey →' }[r.species.id] || 'Conocé más animales →'}</button></p>` : ''}${r.effect === 'start-loss' ? `<p class="sickle-note species-note"><b>Algo parecido le pasó al pez de hielo de la Antártida.</b> En la mayoría de estas especies el gen de la cadena beta desapareció y no tienen hemoglobina: su sangre es casi transparente. <button class="text-button" data-goto="naturaleza:animales">Conocé más animales →</button></p>` : ''}<button class="secondary save-card" id="save-card"><span aria-hidden="true">★</span> Guardar mi descubrimiento</button><details><summary>Para curiosos: la explicación completa</summary><p>${explanation(r)}</p><div class="result-metrics"><div><b>146 → ${length}</b>Piezas${r.lengthUnknown ? ' · final desconocido' : ''}</div><div><b>${r.differences.length}</b>Piezas distintas</div><div><b>${r.originalCodon || '—'} / ${r.mutatedCodon || '—'}</b>Codón original / mutado</div></div><p>Las dos proteínas pieza por pieza. Cada letra es un aminoácido; las piezas distintas están resaltadas.</p><div class="result-amino">Original<br>${G.EXPECTED.slice(1)}<br><br>Mutada<br>${
      r.mature
        ? r.mature
            .split('')
            .map((aa, i) => (G.EXPECTED[i + 1] !== aa ? `<mark>${aa}</mark>` : aa))
            .join('')
        : 'No se fabrica en este modelo.'
    }</div></details>`;
    box.querySelectorAll('[data-goto]').forEach(b => (b.onclick = () => goTo(b.dataset.goto)));
    $('save-card').onclick = openCard;
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
  }
  function restart() {
    stopTour();
    clearResult();
    viewer.reset();
    viewer.rotating = !viewer.reduced.matches;
    viewer.onRotation();
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  // ---- Tarjeta del descubrimiento: una imagen para llevarse el resultado ----
  const CARD_FONT = "'Segoe UI Variable Text', Aptos, 'Segoe UI', system-ui, sans-serif",
    BASE_COLORS = { A: '#ff7a66', T: '#ffd447', C: '#4fd8ff', G: '#b693ff' };
  function roundRect(ctx, x, y, w, h, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
  }
  // Escribe un texto en varias líneas sin pasarse del ancho; devuelve dónde terminó.
  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 5) {
    const lines = [];
    let line = '';
    for (const word of text.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      lines.length = maxLines;
      lines[maxLines - 1] += '…';
    }
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
    return y + lines.length * lineHeight;
  }
  function drawCodon(ctx, codon, x, y, size, mark, removed) {
    [...codon].forEach((b, i) => {
      const left = x + i * (size + 12);
      ctx.globalAlpha = removed && i === mark ? 0.35 : 1;
      ctx.fillStyle = BASE_COLORS[b];
      roundRect(ctx, left, y, size, size, 18);
      ctx.fill();
      if (i === mark) {
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
      ctx.fillStyle = '#1a1335';
      ctx.font = `800 ${size * 0.58}px ${CARD_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(b, left + size / 2, y + size * 0.7);
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
  // Lleva a una pestaña y, si se indica, a un capítulo y paso de Naturaleza (por ejemplo, «naturaleza:felinos:3»).
  function goTo(spec) {
    stopTour();
    const [tab, chapter, step] = spec.split(':');
    showTab(tab);
    if (!chapter) return;
    showChapter(chapter, Number(step) || 1);
    $(`chapter-${chapter}`).scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function cardBadge(r) {
    if (r.realCase) return `¡Es un caso real: ${r.realCase.name}! · ${r.realCase.notation}`;
    if (r.species?.id === 'leopard') return '¡El mismo STOP que el del leopardo negro! · TGA';
    if (r.species?.id === 'kingcheetah') return '¡Como el guepardo rey! · una letra de más';
    if (r.species)
      return `¡Como en ${r.species.id === 'llama' ? 'la' : 'el'} ${r.species.name.toLowerCase()}! · ${r.species.notation}`;
    if (r.effect === 'start-loss') return 'Como el pez de hielo: sin cadena beta';
    return '';
  }
  function drawCard(canvas, r) {
    const ctx = canvas.getContext('2d'),
      W = canvas.width,
      H = canvas.height,
      pad = 96;
    const bg = ctx.createRadialGradient(80, 0, 0, 80, 0, 900);
    bg.addColorStop(0, '#4b2bb8');
    bg.addColorStop(1, '#0e0b24');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1a1744';
    ctx.strokeStyle = '#3d3890';
    ctx.lineWidth = 3;
    roundRect(ctx, 48, 48, W - 96, H - 96, 40);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#c2bdea';
    ctx.font = `700 28px ${CARD_FONT}`;
    ctx.fillText('ADN, GENES Y PROTEÍNAS · FERIA DE CIENCIAS', pad, 140);
    const title = ctx.createLinearGradient(pad, 0, pad + 640, 0);
    title.addColorStop(0, '#ff9a4d');
    title.addColorStop(1, '#ff5c9d');
    ctx.fillStyle = title;
    ctx.font = `800 80px ${CARD_FONT}`;
    ctx.fillText('Mi descubrimiento', pad, 236);
    ctx.fillStyle = '#ffd447';
    ctx.font = `800 50px ${CARD_FONT}`;
    ctx.fillText(resultHeading(r), pad, 320);
    if (lastGuess && lastGuess === r.category) {
      ctx.fillStyle = '#4fd8ff';
      ctx.font = `700 30px ${CARD_FONT}`;
      ctx.fillText('✓ Lo predije bien', pad, 368);
    }

    // El codón antes y después del cambio, con la letra tocada remarcada.
    const size = 104,
      codonWidth = 3 * size + 24,
      top = 410,
      before = r.originalCodon,
      after = r.mutatedCodon,
      markBefore = r.type !== 'ins' && Math.floor(r.position / 3) === r.codon ? r.position % 3 : -1,
      markAfter = r.type !== 'del' ? r.changeIndex % 3 : -1,
      startX = (W - (codonWidth * 2 + 120)) / 2;
    drawCodon(ctx, before, startX, top, size, markBefore, r.type === 'del');
    ctx.fillStyle = '#c2bdea';
    ctx.font = `700 64px ${CARD_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('→', W / 2, top + size * 0.72);
    ctx.textAlign = 'left';
    drawCodon(ctx, after, startX + codonWidth + 120, top, size, markAfter, false);
    const letter = G.DNA[r.position],
      action =
        r.type === 'sub'
          ? `letra ${r.position + 1}: ${letter} → ${r.base}`
          : r.type === 'del'
            ? `quité la letra ${r.position + 1} (${letter})`
            : `agregué una ${r.base} después de la letra ${r.position + 1}`;
    ctx.fillStyle = '#c2bdea';
    ctx.font = `600 32px ${CARD_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`Codón ${r.codon + 1} · ${action}`, W / 2, top + size + 62);
    ctx.textAlign = 'left';

    let y = top + size + 120;
    const badge = cardBadge(r);
    if (badge) {
      ctx.font = `800 34px ${CARD_FONT}`;
      const bw = Math.min(W - 2 * pad, ctx.measureText(badge).width + 56);
      ctx.fillStyle = '#ffd44722';
      ctx.strokeStyle = '#ffd447';
      ctx.lineWidth = 3;
      roundRect(ctx, (W - bw) / 2, y, bw, 70, 35);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffd447';
      ctx.textAlign = 'center';
      ctx.fillText(badge, W / 2, y + 47, W - 2 * pad - 40);
      ctx.textAlign = 'left';
      y += 120;
    }
    ctx.fillStyle = '#f7f5ff';
    ctx.font = `500 36px ${CARD_FONT}`;
    wrapText(ctx, lead(r), pad, y + 20, W - 2 * pad, 50, badge ? 4 : 5);

    // Barras: la proteína normal (146 piezas) contra la mutada.
    const length = Math.min(146, r.mature.length),
      first = r.differences[0],
      same = r.effect === 'frameshift' && first ? first - 1 : length,
      barX = pad + 250,
      barW = W - pad - barX,
      rows = [
        ['Proteína normal', 146, 0, '146 piezas'],
        [
          'Mi proteína',
          same,
          length - same,
          r.lengthUnknown ? `${r.mature.length}+ piezas` : piezas(r.mature.length),
        ],
      ];
    rows.forEach(([label, ok, wrong, count], i) => {
      const by = 1060 + i * 86;
      ctx.fillStyle = '#c2bdea';
      ctx.font = `600 30px ${CARD_FONT}`;
      ctx.fillText(label, pad, by + 24);
      ctx.fillStyle = '#100d2c';
      roundRect(ctx, barX, by, barW, 32, 16);
      ctx.fill();
      ctx.fillStyle = '#4fd8ff';
      if (ok) {
        roundRect(ctx, barX, by, (barW * ok) / 146, 32, 16);
        ctx.fill();
      }
      if (wrong) {
        ctx.fillStyle = '#ffb020';
        ctx.fillRect(barX + (barW * ok) / 146, by, (barW * wrong) / 146, 32);
      }
      if (i === 1 && r.effect === 'missense' && r.piece >= 1 && r.piece <= 146) {
        ctx.fillStyle = '#ff5d6c';
        ctx.fillRect(barX + (barW * (r.piece - 1)) / 146 - 4, by - 8, 12, 48);
      }
      ctx.fillStyle = '#f7f5ff';
      ctx.font = `700 26px ${CARD_FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(count, W - pad, by - 10);
      ctx.textAlign = 'left';
    });

    ctx.fillStyle = '#c2bdea';
    ctx.font = `500 26px ${CARD_FONT}`;
    const date = new Date().toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    ctx.fillText(`${date} · Simulación educativa, no es un diagnóstico`, pad, H - 92);
  }
  function openCard() {
    if (!current || !revealed) return;
    const canvas = $('card-canvas');
    drawCard(canvas, current);
    canvas.setAttribute('aria-label', `Tarjeta: ${resultHeading(current)}. ${lead(current)}`);
    $('card-share').hidden = !navigator.canShare;
    $('card-dialog').querySelector('.card-photo').textContent = standMode
      ? 'Sacale una foto con tu celular para llevártela.'
      : 'Descargala o compartila para llevártela.';
    $('card-dialog').showModal();
  }
  function cardFile() {
    return new Promise(resolve =>
      $('card-canvas').toBlob(blob =>
        resolve(new File([blob], 'mi-descubrimiento-adn.png', { type: 'image/png' })),
      ),
    );
  }
  $('close-card').onclick = () => $('card-dialog').close();
  $('card-download').onclick = async () => {
    const file = await cardFile(),
      url = URL.createObjectURL(file),
      a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $('card-share').onclick = async () => {
    const file = await cardFile();
    if (!navigator.canShare?.({ files: [file] }))
      return notify('Este navegador no permite compartir imágenes. Descargala.');
    try {
      await navigator.share({
        files: [file],
        title: 'Mi descubrimiento',
        text: '¿Qué cambia con una letra del ADN?',
      });
    } catch {}
  };

  // ---- Tu nombre en proteína: las letras del nombre son piezas, y la receta se puede mutar ----
  const nameState = { gene: null, mutation: null };
  const nameTiles = (letters, compare = null) =>
    letters
      .map((ch, i) => {
        const piece = G.names[ch] && ch !== '*';
        return `<span class="name-piece${piece ? '' : ' off'}${compare && compare[i] !== ch ? ' diff' : ''}"><b>${ch}</b><small>${piece ? G.names[ch] : '—'}</small></span>`;
      })
      .join('');
  function nameDNA(dna, mark = -1) {
    const groups = [];
    for (let i = 0; i < dna.length; i += 3) {
      const last = i + 3 >= dna.length,
        label = i === 0 ? 'inicio' : last ? 'STOP' : '';
      groups.push(
        `<span class="name-codon">${[...dna.slice(i, i + 3)].map((b, j) => `<span class="base small ${b.toLowerCase()}${i + j === mark ? ' changed' : ''}">${b}</span>`).join('')}${label ? `<small>${label}</small>` : ''}</span>`,
      );
    }
    return groups.join('');
  }
  // Qué le pasó al nombre con la mutación: la misma clasificación que en el simulador, en chiquito.
  function nameOutcome(gene, m) {
    const startLost = m.dna.slice(0, 3) !== 'ATG',
      t = G.translate(m.dna),
      after = startLost ? '' : t.protein.slice(1);
    const letter = `Cambiaste la letra ${m.position + 1} de la receta: ${gene.dna[m.position]} → ${m.base}.`;
    if (startLost)
      return {
        after,
        text: `${letter} <b>Se perdió el inicio ATG:</b> la célula no encuentra dónde empezar y tu nombre no se fabrica.`,
      };
    if (t.stop === -1)
      return {
        after,
        text: `${letter} <b>Se perdió el STOP:</b> la lectura sigue de largo y no sabe dónde terminar.`,
      };
    if (after.length < gene.pieces.length)
      return {
        after,
        text: `${letter} <b>Apareció un STOP antes de tiempo:</b> tu nombre quedó cortado.`,
      };
    if (after === gene.pieces)
      return {
        after,
        text: `${letter} <b>Mutación silenciosa:</b> cambió la receta, pero el codón indica la misma pieza y tu nombre quedó igual.`,
      };
    return { after, text: `${letter} <b>Cambió una pieza:</b> ahora tu nombre dice otra cosa.` };
  }
  function renderName() {
    const box = $('name-result'),
      g = nameState.gene,
      m = nameState.mutation;
    if (!g || !g.letters.length) {
      box.innerHTML = '';
      return;
    }
    if (!g.pieces) {
      box.innerHTML = `<p class="name-note">Ninguna letra de <b>${g.letters.join('')}</b> es una pieza. ¡Probá con otro nombre o un apodo!</p>`;
      return;
    }
    const skipped = g.skipped.length
      ? `<p class="name-note">${g.skipped.length === 1 ? `La <b>${g.skipped[0]}</b> no es` : `Las letras <b>${g.skipped.join(', ')}</b> no son`} de ninguna pieza: las proteínas usan 20 piezas y a ninguna le tocó la B, la J, la O, la U, la X ni la Z. Se saltea${g.skipped.length === 1 ? '' : 'n'}.</p>`
      : '<p class="name-note">¡Todas las letras de tu nombre son piezas!</p>';
    const outcome = m && nameOutcome(g, m);
    box.innerHTML = `<div class="name-pieces">${nameTiles(g.letters)}</div>${skipped}<h3 class="name-sub">La receta: ${g.dna.length} letras de ADN</h3><div class="name-dna">${nameDNA(m ? m.dna : g.dna, m ? m.position : -1)}</div>${
      outcome
        ? `<div class="name-mutation"><p>${outcome.text}</p>${outcome.after ? `<div class="name-pieces">${nameTiles([...outcome.after], g.pieces)}</div>` : ''}</div>`
        : ''
    }<div class="name-actions"><button class="primary" id="name-mutate"><span aria-hidden="true">⚄</span> ${m ? 'Mutar otra letra' : 'Mutar una letra al azar'}</button>${m ? '<button class="ghost" id="name-undo"><span aria-hidden="true">↶</span> Volver al original</button>' : ''}<button class="secondary" id="name-card"><span aria-hidden="true">★</span> Guardar tarjeta</button></div>`;
    $('name-mutate').onclick = () => {
      const position = Math.floor(Math.random() * g.dna.length),
        options = [...'ATCG'].filter(b => b !== g.dna[position]),
        base = options[Math.floor(Math.random() * options.length)];
      nameState.mutation = {
        position,
        base,
        dna: g.dna.slice(0, position) + base + g.dna.slice(position + 1),
      };
      renderName();
      $('name-mutate').focus({ preventScroll: true });
    };
    if (m)
      $('name-undo').onclick = () => {
        nameState.mutation = null;
        renderName();
        $('name-mutate').focus({ preventScroll: true });
      };
    $('name-card').onclick = openNameCard;
  }
  $('open-name').onclick = () => {
    $('name-dialog').showModal();
    $('name-input').focus();
  };
  $('close-name').onclick = () => $('name-dialog').close();
  $('name-form').onsubmit = e => {
    e.preventDefault();
    nameState.gene = G.nameToGene($('name-input').value);
    nameState.mutation = null;
    renderName();
  };
  function drawNameCard(canvas, g) {
    const ctx = canvas.getContext('2d'),
      W = canvas.width,
      H = canvas.height,
      pad = 96;
    const bg = ctx.createRadialGradient(80, 0, 0, 80, 0, 900);
    bg.addColorStop(0, '#4b2bb8');
    bg.addColorStop(1, '#0e0b24');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1a1744';
    ctx.strokeStyle = '#3d3890';
    ctx.lineWidth = 3;
    roundRect(ctx, 48, 48, W - 96, H - 96, 40);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c2bdea';
    ctx.font = `700 28px ${CARD_FONT}`;
    ctx.fillText('ADN, GENES Y PROTEÍNAS · FERIA DE CIENCIAS', pad, 140);
    const title = ctx.createLinearGradient(pad, 0, pad + 700, 0);
    title.addColorStop(0, '#ff9a4d');
    title.addColorStop(1, '#ff5c9d');
    ctx.fillStyle = title;
    ctx.font = `800 76px ${CARD_FONT}`;
    ctx.fillText('Mi nombre en proteína', pad, 236);

    // Las piezas del nombre, en una o dos filas de fichas.
    const pieces = [...g.pieces],
      perRow = Math.min(8, Math.max(4, Math.ceil(pieces.length / 2))),
      gap = 14,
      size = Math.min(132, (W - 2 * pad - (perRow - 1) * gap) / perRow);
    pieces.forEach((aa, i) => {
      const row = Math.floor(i / perRow),
        inRow = Math.min(perRow, pieces.length - row * perRow),
        x = (W - (inRow * size + (inRow - 1) * gap)) / 2 + (i % perRow) * (size + gap),
        y = 320 + row * (size + 70);
      ctx.fillStyle = '#ffd447';
      roundRect(ctx, x, y, size, size, 20);
      ctx.fill();
      ctx.fillStyle = '#1a1335';
      ctx.font = `800 ${size * 0.6}px ${CARD_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(aa, x + size / 2, y + size * 0.72);
      ctx.fillStyle = '#c2bdea';
      ctx.font = `600 ${Math.round(size * 0.27)}px ${CARD_FONT}`;
      ctx.fillText(G.names[aa], x + size / 2, y + size + 36);
      ctx.textAlign = 'left';
    });
    let y = 320 + Math.ceil(pieces.length / perRow) * (size + 70) + 70;
    ctx.fillStyle = '#f7f5ff';
    ctx.font = `600 34px ${CARD_FONT}`;
    ctx.fillText(`Mi receta de ADN (${g.dna.length} letras):`, pad, y);
    ctx.font = `700 40px 'Cascadia Mono', Consolas, monospace`;
    const codons = g.dna.match(/.{3}/g);
    let line = '',
      lineY = y + 70;
    for (const codon of codons) {
      const test = line ? `${line} ${codon}` : codon;
      if (ctx.measureText(test).width > W - 2 * pad && line) {
        ctx.fillStyle = '#4fd8ff';
        ctx.fillText(line, pad, lineY);
        line = codon;
        lineY += 58;
      } else line = test;
    }
    ctx.fillStyle = '#4fd8ff';
    ctx.fillText(line, pad, lineY);
    ctx.fillStyle = '#c2bdea';
    ctx.font = `500 30px ${CARD_FONT}`;
    wrapText(
      ctx,
      'Empieza con ATG (la señal de inicio) y termina con TAA (STOP). Cada grupo de tres letras fabrica una pieza.',
      pad,
      Math.min(lineY + 76, H - 220),
      W - 2 * pad,
      42,
      3,
    );
    ctx.font = `500 26px ${CARD_FONT}`;
    ctx.fillText('Simulación educativa · daniechev.github.io/Genoma-LAB-', pad, H - 92);
  }
  function openNameCard() {
    const g = nameState.gene;
    if (!g?.pieces) return;
    const canvas = $('card-canvas');
    drawNameCard(canvas, g);
    canvas.setAttribute('aria-label', `Tarjeta: mi nombre en proteína, ${g.pieces}.`);
    $('card-share').hidden = !navigator.canShare;
    $('card-dialog').querySelector('.card-photo').textContent = standMode
      ? 'Sacale una foto con tu celular para llevártela.'
      : 'Descargala o compartila para llevártela.';
    $('card-dialog').showModal();
  }

  // ---- Pestañas y estadísticas del stand ----
  function showTab(tab) {
    all('.tab-page').forEach(p => (p.hidden = p.id !== `tab-${tab}`));
    all('.nav').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
      if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    if (tab === 'stats' || tab === 'proyecto') renderStats();
    if (tab === 'lab') {
      viewer.resize();
      render();
    }
    if (tab !== 'naturaleza') evoStop();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
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
  function setModel(model) {
    viewer.model = model;
    viewer.reset();
    all('[data-model]').forEach(b => {
      b.classList.toggle('active', b.dataset.model === model);
      b.setAttribute('aria-pressed', String(b.dataset.model === model));
    });
    $('all-chains').disabled = model === 'af';
    $('confidence-label').hidden = model !== 'af';
    $('viewer-badge').textContent =
      model === 'pdb' ? 'CADENA BETA · PDB 2HHB' : 'CADENA BETA · ALPHAFOLD P68871';
    $('model-caption').textContent =
      model === 'pdb'
        ? 'Estructura medida por rayos X. Cada tramo conecta las posiciones reales de los aminoácidos.'
        : 'Predicción de la cadena beta normal. La confianza de IA describe el modelo, no el efecto de una mutación.';
    updateLegend();
  }
  function updateLegend() {
    const confidence = viewer.model === 'af' && viewer.confidence;
    $('protein-legend').innerHTML = confidence
      ? '<span class="gradient-line" style="background:linear-gradient(90deg,#388de7 25%,#65cbf3 25%,#65cbf3 50%,#ffdb13 50%,#ffdb13 75%,#ff7d45 75%)"></span><span>pLDDT &gt;90</span><span>70–90</span><span>50–70</span><span>&lt;50</span>'
      : '<span class="gradient-line"></span><span>Inicio de la cadena</span><span>Final</span>';
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
  $('challenge').checked = challenge;
  $('challenge').onchange = e => {
    challenge = e.target.checked;
    try {
      localStorage.setItem(challengeKey, challenge ? '1' : '0');
    } catch {}
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
  all('[data-model]').forEach(b => (b.onclick = () => setModel(b.dataset.model)));
  $('all-chains').onchange = e => {
    viewer.all = e.target.checked;
    viewer.focus = null;
    viewer.zoom = 1;
  };
  $('confidence').onchange = e => {
    viewer.confidence = e.target.checked;
    updateLegend();
  };
  $('rotate').onclick = () => {
    viewer.rotating = !viewer.rotating;
    viewer.onRotation();
  };
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
  $('pdb-file').onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 2e6)
        throw new Error('El archivo es demasiado grande. Usá el PDB de una sola cadena P68871.');
      const text = await file.text(),
        parsed = G.parsePDB(text, true);
      MODELS.af = parsed;
      try {
        localStorage.setItem('adn-hbb-custom-pdb', text);
        $('import-status').textContent = 'Modelo verificado y guardado: hemoglobina beta P68871.';
      } catch {
        $('import-status').textContent =
          'Modelo verificado. No pudo guardarse y estará disponible solo durante esta sesión.';
      }
      setModel('af');
      notify('Modelo de hemoglobina beta cargado.');
    } catch (err) {
      $('import-status').textContent = err.message;
    }
    e.target.value = '';
  };
  $('restore-model').onclick = () => {
    MODELS.af = JSON.parse(JSON.stringify(bundledAF));
    try {
      localStorage.removeItem('adn-hbb-custom-pdb');
    } catch {}
    setModel('af');
    $('import-status').textContent = 'Modelo incluido restaurado: AlphaFold P68871, versión 6.';
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
      viewer.onRotation();
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
    startTour(true);
  }
  setInterval(() => {
    if (standMode && !tour.auto && performance.now() - lastActivity > STAND_IDLE) goIdle();
  }, 5000);

  // Naturaleza: mapa de la malaria y las mutaciones que protegen (esquema por país, códigos ISO 3166 numéricos).
  const AFRICA_HBS =
      '686 270 624 324 694 430 384 466 854 288 768 204 562 566 120 148 140 729 728 226 266 178 180 024 800 404 834 646 108 894 454 508',
    MAP_LAYERS = {
      hbs: {
        name: 'Anemia falciforme (HbS) frecuente',
        ids: AFRICA_HBS + ' 682 512 887 356',
        text: 'La mutación de la anemia falciforme es frecuente en África al sur del Sahara, en partes de Arabia y en la India: justo donde la malaria era más común.',
      },
      hbc: {
        name: 'Hemoglobina C (HbC) frecuente',
        ids: '854 288 466 768 204 384 566',
        text: 'La hemoglobina C, el otro cambio del codón 7, se concentra en África occidental, una zona de malaria intensa. También protege, sobre todo con dos copias.',
      },
      thal: {
        name: 'Talasemias y HbE frecuentes',
        ids: '380 300 196 792 364 368 760 422 682 586 356 050 104 764 418 116 704 458 360 608 144 818 788',
        text: 'Donde no llegó la mutación falciforme, otras mutaciones de la hemoglobina se volvieron comunes: talasemias en el Mediterráneo y Asia, y HbE en el sudeste asiático. También coinciden con la malaria.',
      },
    },
    MALARIA_IDS = new Set(
      (
        AFRICA_HBS +
        ' 231 706 232 450 716 516 072 478 262 682 512 887 356 586 050 104 764 418 116 704 458 360 608 144 598 626 380 300 196 792 364 368 760 422 400 818 788 012 504 724 620 340 222 558 188 591 076 170 862 328 740 604 068 218 600 332 214 192 388 484 320 084 004'
      ).split(' '),
    );
  let mapLayer = 'hbs';
  function renderMap() {
    const svg = $('world-map');
    if (!svg.childElementCount) {
      svg.setAttribute('viewBox', `0 0 ${WORLD_MAP.width} ${WORLD_MAP.height}`);
      svg.innerHTML = `<defs><pattern id="malaria-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.6" height="7" fill="#ff5d6c"/></pattern></defs><g class="countries">${WORLD_MAP.countries.map(c => `<path data-id="${c.id}" d="${c.d}"/>`).join('')}</g><g class="malaria">${WORLD_MAP.countries
        .filter(c => MALARIA_IDS.has(c.id))
        .map(c => `<path d="${c.d}"/>`)
        .join('')}</g>`;
    }
    const layer = MAP_LAYERS[mapLayer],
      ids = new Set(layer.ids.split(' '));
    svg
      .querySelectorAll('.countries path')
      .forEach(p => p.classList.toggle('on', ids.has(p.dataset.id)));
    svg.querySelector('.malaria').style.display = $('map-malaria').checked ? '' : 'none';
    all('[data-layer]').forEach(b => {
      const on = b.dataset.layer === mapLayer;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    $('map-layer-name').textContent = layer.name;
    $('map-text').textContent = layer.text;
  }
  all('[data-layer]').forEach(
    b =>
      (b.onclick = () => {
        mapLayer = b.dataset.layer;
        renderMap();
      }),
  );
  $('map-malaria').onchange = renderMap;

  // Capítulos de Naturaleza: se ve una historia por vez, y las largas van de a un paso, para que no quede cargada.
  function showChapter(name, step = 1) {
    all('.chapter').forEach(b => {
      const on = b.dataset.chapter === name;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    all('.chapter-page').forEach(p => (p.hidden = p.id !== `chapter-${name}`));
    showStep($(`chapter-${name}`), step, false);
  }
  function showStep(page, n, scroll = true) {
    const steps = [...page.querySelectorAll('.step')];
    if (!steps.length) return;
    n = Math.max(1, Math.min(steps.length, n));
    steps.forEach((s, i) => (s.hidden = i + 1 !== n));
    page.querySelectorAll('.step-dot').forEach((b, i) => {
      b.classList.toggle('active', i + 1 === n);
      b.classList.toggle('done', i + 1 < n);
      if (i + 1 === n) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    if (!page.querySelector('.step:not([hidden]) .evolution')) evoStop();
    if (scroll)
      page.querySelector('.steps').scrollIntoView({
        block: 'start',
        behavior: viewer.reduced.matches ? 'instant' : 'smooth',
      });
  }
  all('[data-goto-step]').forEach(b => {
    b.onclick = () => {
      const page = b.closest('.chapter-page'),
        now = [...page.querySelectorAll('.step')].findIndex(s => !s.hidden) + 1;
      showStep(page, b.dataset.gotoStep === 'next' ? now + 1 : Number(b.dataset.gotoStep));
    };
  });
  all('[data-next-chapter]').forEach(b => {
    b.onclick = () => {
      showChapter(b.dataset.nextChapter);
      document.querySelector('.chapters').scrollIntoView({
        block: 'start',
        behavior: viewer.reduced.matches ? 'instant' : 'smooth',
      });
    };
  });
  all('.chapter').forEach(b => {
    b.onclick = () => showChapter(b.dataset.chapter);
    b.onkeydown = e => {
      const tabs = all('.chapter'),
        step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      const next = tabs[(tabs.indexOf(b) + step + tabs.length) % tabs.length];
      showChapter(next.dataset.chapter);
      next.focus();
    };
  });

  // Misma proyección que el mapa (Natural Earth): pasa de longitud y latitud a un punto del dibujo.
  function project(lon, lat) {
    const l = (lon * Math.PI) / 180,
      p = (lat * Math.PI) / 180,
      p2 = p * p,
      p4 = p2 * p2,
      x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4))),
      y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
    return [WORLD_MAP.width / 2 + 175.5 * x, 270.3 - 175.5 * y];
  }
  const shape = points =>
    'M' +
    points
      .map(([lon, lat]) =>
        project(lon, lat)
          .map(n => n.toFixed(1))
          .join(','),
      )
      .join('L') +
    'Z';
  const land = () => WORLD_MAP.countries.map(c => `<path d="${c.d}"/>`).join('');

  // Dónde viven el jaguar y el leopardo (esquema aproximado; se recorta con la forma de los continentes).
  // prettier-ignore
  const CAT_RANGES = {
    jaguar: [
      [[-109, 29], [-105, 24], [-104, 19], [-97, 16], [-92, 15], [-90, 21.5], [-87, 21], [-87, 16], [-83, 10], [-79, 9], [-75, 11], [-71, 12], [-63, 11], [-60, 8.5], [-52, 5], [-50, 0], [-44, -2.5], [-38, -8], [-39, -15], [-41, -21], [-48, -26], [-54, -28], [-58, -30], [-62, -29], [-65, -24], [-66, -18], [-70, -13], [-75, -10], [-78, -4], [-79, 0], [-78, 4], [-77, 8], [-80, 8], [-85, 11], [-90, 13], [-95, 16], [-99, 20], [-106, 27]],
    ],
    leopard: [
      [[-17, 13], [-12, 9], [-5, 5], [3, 6], [9, 4], [9, -1], [12, -6], [13, -12], [12, -18], [15, -27], [18, -34], [25, -34.5], [30, -31], [33, -26], [36, -20], [40, -14], [40, -5], [42, 0], [48, 4], [51, 11], [44, 11], [42, 13], [38, 15], [34, 13], [24, 12], [16, 13], [4, 13], [-5, 15], [-12, 15]],
      [[61, 28], [66, 30], [70, 33], [74, 35], [80, 31], [88, 28], [95, 29], [100, 31], [106, 32], [112, 33], [119, 31], [121, 25], [114, 22], [108, 21], [106, 17], [109, 12], [104, 9], [103, 2], [100, 4], [98, 9], [97, 16], [94, 19], [91, 22], [87, 22], [82, 17], [80, 13], [80, 10], [78, 8], [76, 9], [73, 16], [72, 21], [69, 23], [64, 25]],
      [[79.7, 9.8], [81.9, 8.5], [81.7, 6.3], [80.2, 5.9], [79.8, 7.5]],
      [[105.2, -6.2], [110, -6.6], [114.5, -7.6], [114.5, -8.7], [108, -7.8], [105.3, -6.9]],
      [[44, 38], [46, 41], [49, 41], [54, 38], [60, 37], [63, 35], [62, 30], [58, 27], [54, 28], [50, 30], [47, 32], [45, 35]],
      [[43, 13], [45, 15], [52, 17], [55, 18], [54, 16.5], [48, 14], [44, 12.6]],
      [[127, 42], [131, 42.5], [134, 44], [135, 47], [131, 47], [128, 44]],
    ],
  };
  function renderCatsMap() {
    const svg = $('cats-map'),
      label = (text, lon, lat, cls) => {
        const [x, y] = project(lon, lat);
        return `<text class="map-label ${cls}" x="${x.toFixed(0)}" y="${y.toFixed(0)}">${text}</text>`;
      };
    svg.setAttribute('viewBox', '150 120 720 270');
    svg.innerHTML = `<defs><clipPath id="land-clip">${land()}</clipPath></defs><g class="countries">${land()}</g>${[
      'jaguar',
      'leopard',
    ]
      .map(
        cat =>
          `<g class="range ${cat}" clip-path="url(#land-clip)"><path d="${CAT_RANGES[cat].map(shape).join('')}"/></g>`,
      )
      .join(
        '',
      )}${label('Jaguar', -72, -6, 'jaguar')}${label('Leopardo', 22, -5, 'leopard')}${label('Leopardo', 92, 24, 'leopard')}`;
  }

  // Animales récord sobre el mapa: tocar uno abre su tarjeta.
  const ANIMAL_PINS = [
    { id: 'llama', name: 'Llama', lon: -68, lat: -17, cls: 'mountain' },
    { id: 'goose', name: 'Ánsar indio', lon: 86, lat: 29, cls: 'sky' },
    { id: 'mammoth', name: 'Mamut lanudo', lon: 125, lat: 66, cls: 'ice' },
    { id: 'icefish', name: 'Pez de hielo', lon: -58, lat: -58, cls: 'water' },
  ];
  function openSpecies(id) {
    const card = document.querySelector(`.species[data-species="${id}"]`),
      button = card.querySelector('.species-open');
    if (button.getAttribute('aria-expanded') !== 'true') button.click();
    card.scrollIntoView({ behavior: viewer.reduced.matches ? 'auto' : 'smooth', block: 'center' });
  }
  function renderAnimalsMap() {
    const svg = $('animals-map');
    svg.setAttribute('viewBox', `0 0 ${WORLD_MAP.width} ${WORLD_MAP.height}`);
    svg.innerHTML = `<g class="countries">${land()}</g>${ANIMAL_PINS.map(a => {
      const [x, y] = project(a.lon, a.lat);
      return `<g class="pin ${a.cls}" role="button" tabindex="0" data-pin="${a.id}" aria-label="${a.name}" transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><rect class="hit" x="-70" y="-42" width="140" height="58" rx="12"/><circle class="pulse" r="12"/><circle r="9"/><text y="-18">${a.name}</text></g>`;
    }).join('')}`;
    svg.querySelectorAll('.pin').forEach(pin => {
      pin.onclick = () => openSpecies(pin.dataset.pin);
      pin.onkeydown = e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openSpecies(pin.dataset.pin);
        }
      };
    });
  }

  // Pelaje dibujado: rosetas grandes con puntos (jaguar) o chicas sin puntos (leopardo).
  function furSVG(kind) {
    const jaguar = kind.startsWith('jaguar'),
      black = kind.endsWith('black'),
      base = black ? '#17121c' : jaguar ? '#dca04c' : '#e6b464',
      inner = black ? '#120e16' : jaguar ? '#b97a34' : '#cf9447',
      spot = black ? '#050307' : '#2a1a10',
      gap = jaguar ? 62 : 36,
      r0 = gap * 0.3;
    let seed = jaguar ? 11 : 5;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280,
      f = n => n.toFixed(1);
    let centers = '',
      rings = '';
    for (let row = 0, y = 4; y < 200; row++, y += gap * 0.82)
      for (let x = (row % 2) * (gap / 2) - 8; x < 340; x += gap) {
        const cx = x + (rand() - 0.5) * gap * 0.16,
          cy = y + (rand() - 0.5) * gap * 0.16,
          r = r0 * (0.85 + rand() * 0.3),
          blobs = jaguar ? 6 + Math.floor(rand() * 2) : 5,
          turn = rand() * Math.PI;
        // El centro de cada roseta es un poco más oscuro que el resto del pelo.
        centers += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(r * 0.95)}" ry="${f(r * 0.8)}"/>`;
        for (let k = 0; k < blobs; k++) {
          if (rand() < 0.12) continue;
          const a = turn + (k / blobs) * Math.PI * 2,
            bx = cx + Math.cos(a) * r,
            by = cy + Math.sin(a) * r * 0.85;
          rings += `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(r * (jaguar ? 0.42 : 0.5))}" ry="${f(r * 0.2)}" transform="rotate(${((a * 180) / Math.PI + 90).toFixed(0)} ${f(bx)} ${f(by)})"/>`;
        }
        // Solo el jaguar tiene puntos dentro de las rosetas.
        if (jaguar)
          for (let k = 0, n = 1 + Math.floor(rand() * 3); k < n; k++)
            rings += `<circle cx="${f(cx + (rand() - 0.5) * r * 0.7)}" cy="${f(cy + (rand() - 0.5) * r * 0.6)}" r="${f(r * 0.13)}"/>`;
      }
    return `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice"><rect width="320" height="180" fill="${base}"/><g fill="${inner}">${centers}</g><g fill="${spot}" opacity="${black ? 0.8 : 0.92}">${rings}</g>${black ? `<defs><linearGradient id="shine-${kind}" x1="0" y1="0" x2="1" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".16"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="320" height="180" fill="url(#shine-${kind})"/>` : ''}</svg>`;
  }
  // Guepardo: manchas chicas, redondas y llenas. Guepardo rey: manchones grandes que se juntan y rayas en el lomo.
  function cheetahSVG(king) {
    let seed = king ? 7 : 3;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280,
      f = n => n.toFixed(1);
    let spots = '';
    if (king) {
      for (const y of [16, 44, 72])
        spots += `<path d="M-10 ${y} C 60 ${y - 10}, 120 ${y + 12}, 190 ${y} S 290 ${y - 8}, 340 ${y + 4}" stroke="#2a1a10" stroke-width="${y === 44 ? 20 : 14}" fill="none" stroke-linecap="round"/>`;
      for (let y = 104; y < 200; y += 34)
        for (let x = -10 + (y % 68 ? 24 : 0); x < 340; x += 58) {
          const cx = x + rand() * 16,
            cy = y + rand() * 10;
          for (let k = 0; k < 3; k++)
            spots += `<ellipse cx="${f(cx + (rand() - 0.5) * 26)}" cy="${f(cy + (rand() - 0.5) * 14)}" rx="${f(11 + rand() * 9)}" ry="${f(8 + rand() * 5)}"/>`;
        }
    } else
      for (let row = 0, y = 6; y < 190; row++, y += 17)
        for (let x = (row % 2) * 10 - 6; x < 330; x += 21)
          spots += `<circle cx="${f(x + (rand() - 0.5) * 8)}" cy="${f(y + (rand() - 0.5) * 6)}" r="${f(4.2 + rand() * 2)}"/>`;
    return `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice"><rect width="320" height="180" fill="#e3b768"/><g fill="#2a1a10">${spots}</g></svg>`;
  }
  all('[data-fur]').forEach(
    el =>
      (el.innerHTML = el.dataset.fur.startsWith('cheetah')
        ? cheetahSVG(false)
        : el.dataset.fur === 'king'
          ? cheetahSVG(true)
          : furSVG(el.dataset.fur)),
  );

  // Gato siamés: cada parte del cuerpo se enfría distinto según el ambiente. La enzima del color solo funciona
  // donde la piel está por debajo de unos 36 °C (valores ilustrativos).
  const SIAMESE_PARTS = [
    [
      'tail',
      0.85,
      '<path d="M250 132 C 300 128, 318 92, 304 58" stroke-width="16" fill="none" stroke-linecap="round"/>',
    ],
    [
      'legs',
      0.5,
      '<rect x="96" y="140" width="20" height="44" rx="9"/><rect x="128" y="142" width="20" height="42" rx="9"/><rect x="206" y="140" width="20" height="44" rx="9"/><rect x="232" y="138" width="20" height="46" rx="9"/>',
    ],
    ['body', 0.12, '<ellipse cx="176" cy="126" rx="88" ry="38"/>'],
    [
      'paws',
      0.9,
      '<ellipse cx="106" cy="186" rx="13" ry="7"/><ellipse cx="138" cy="186" rx="13" ry="7"/><ellipse cx="216" cy="186" rx="13" ry="7"/><ellipse cx="242" cy="186" rx="13" ry="7"/>',
    ],
    ['ears', 0.95, '<path d="M54 66 L 58 26 L 82 54 Z"/><path d="M96 52 L 114 18 L 124 58 Z"/>'],
    ['head', 0.3, '<circle cx="88" cy="84" r="38"/>'],
    ['mask', 0.55, '<ellipse cx="82" cy="96" rx="24" ry="22"/>'],
  ];
  function renderSiamese() {
    const ambient = Number($('siamese-temp').value),
      mix = (a, b, t) =>
        '#' +
        [0, 2, 4]
          .map(i =>
            Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t)
              .toString(16)
              .padStart(2, '0'),
          )
          .join('');
    $('siamese-cat').innerHTML =
      SIAMESE_PARTS.map(([id, exposure, shape]) => {
        const skin = 38.5 - exposure * (38.5 - ambient) * 0.55,
          dark = Math.max(0, Math.min(1, (36 - skin) / 3)),
          color = mix('efe3cd', '3b2820', dark);
        return `<g class="cat-${id}" fill="${color}" stroke="${color}">${shape}</g>`;
      }).join('') +
      '<g fill="#5fb8ff"><ellipse cx="72" cy="80" rx="6" ry="7"/><ellipse cx="100" cy="80" rx="6" ry="7"/></g><path d="M82 96 l6 5 6 -5" stroke="#1a1335" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
    $('siamese-temp-label').textContent = `${ambient} °C`;
    $('siamese-text').textContent =
      ambient >= 32
        ? 'Con mucho calor, ninguna parte se enfría lo suficiente: la enzima casi no funciona y el gato queda claro, como un gatito recién nacido.'
        : ambient <= 10
          ? 'Con frío, se enfrían más partes del cuerpo: la enzima funciona en más lugares y el pelaje se oscurece más.'
          : 'Las orejas, la cara, las patas y la cola están más frías que el resto: ahí la enzima funciona y el pelo sale oscuro. El cuerpo, más calentito, queda claro.';
  }
  $('siamese-temp').oninput = renderSiamese;
  renderSiamese();

  // Ojos celestes: una pregunta rápida para el público.
  const EYE_ANSWERS = {
    blue: 'Entonces seguramente tenés esta letra en tus dos copias del gen. La heredaste de aquel antepasado de hace miles de años: ¡todas las personas de ojos celestes que pasan por el stand son parientes lejanas!',
    green:
      'Los ojos verdes tienen poco pigmento, pero un poco más que los celestes. Suelen combinar esta letra con cambios en otros genes.',
    brown:
      'Tu interruptor probablemente está en la versión original, que fabrica mucho pigmento. Es la más común del mundo: la de los ojos celestes apareció mucho después.',
  };
  all('[data-eyes]').forEach(
    b =>
      (b.onclick = () => {
        all('[data-eyes]').forEach(x => {
          x.classList.toggle('active', x === b);
          x.setAttribute('aria-pressed', String(x === b));
        });
        $('eye-answer').textContent = EYE_ANSWERS[b.dataset.eyes];
      }),
  );
  // Enlaces entre historias (por ejemplo, del jaguar negro a los pelirrojos).
  all('.nature [data-goto]').forEach(b => (b.onclick = () => goTo(b.dataset.goto)));

  // Jugá a la evolución: frecuencia de la mutación (q) en un pueblo, generación a generación.
  // Hardy-Weinberg con selección: q' = (p·q·wAS + q²·wSS) / (p²·wAA + 2·p·q·wAS + q²·wSS). Valores ilustrativos.
  const evo = { q0: 0.02, q: 0.02, gen: 0, history: [], timer: null };
  const fitness = malaria => ({ AA: malaria ? 0.85 : 1, AS: 1, SS: 0.2 });
  const genotypes = q => {
    const p = 1 - q;
    return { AA: p * p, AS: 2 * p * q, SS: q * q };
  };
  // Orden fijo y mezclado de los 100 lugares, para que cada persona no salte de lugar entre generaciones.
  const seats = [...Array(100).keys()]
    .map(i => [i, (Math.sin(i * 12.9898) * 43758.5453) % 1])
    .sort((a, b) => a[1] - b[1])
    .map(x => x[0]);
  function evoStep() {
    const w = fitness($('evo-malaria').checked),
      p = 1 - evo.q,
      mean = p * p * w.AA + 2 * p * evo.q * w.AS + evo.q * evo.q * w.SS;
    evo.q = (p * evo.q * w.AS + evo.q * evo.q * w.SS) / mean;
    evo.gen++;
    evo.history.push([evo.gen, genotypes(evo.q).AS, $('evo-malaria').checked]);
  }
  function renderEvolution() {
    const g = genotypes(evo.q),
      ss = Math.round(g.SS * 100),
      as = Math.round(g.AS * 100),
      kind = Array(100).fill('aa');
    seats.slice(0, as).forEach(i => (kind[i] = 'as'));
    seats.slice(as, as + ss).forEach(i => (kind[i] = 'ss'));
    $('village').innerHTML = kind.map(k => `<i class="${k}"></i>`).join('');
    const pct = v => `${(v * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`;
    $('evo-stats').innerHTML =
      `<div><b>${evo.gen}</b>generaciones</div><div><b>${pct(g.AS)}</b>portadores</div><div><b>${pct(g.SS)}</b>con anemia falciforme</div>`;
    const maxGen = Math.max(40, evo.gen),
      x = n => 40 + (n / maxGen) * 350,
      y = v => 150 - (v / 0.4) * 135,
      points = [[0, genotypes(evo.q0).AS], ...evo.history.map(([n, v]) => [n, v])];
    const eq = fitness(true),
      qEq = (1 - eq.AA) / (1 - eq.AA + (1 - eq.SS)),
      asEq = 2 * qEq * (1 - qEq);
    $('evo-chart').innerHTML =
      `<g class="grid">${[0, 0.1, 0.2, 0.3, 0.4].map(v => `<line x1="40" x2="390" y1="${y(v)}" y2="${y(v)}"/><text x="34" y="${y(v) + 4}">${v * 100}%</text>`).join('')}</g><line class="eq" x1="40" x2="390" y1="${y(asEq)}" y2="${y(asEq)}"/><text class="eq-label" x="388" y="${y(asEq) - 6}">equilibrio con malaria</text><polyline points="${points.map(([n, v]) => `${x(n).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}"/><text x="205" y="168" class="axis">generaciones</text>`;
  }
  function evoStop() {
    clearInterval(evo.timer);
    evo.timer = null;
    $('evo-play').innerHTML = '<span aria-hidden="true">▶</span> Avanzar 10';
  }
  $('evo-step').onclick = () => {
    evoStop();
    evoStep();
    renderEvolution();
  };
  $('evo-play').onclick = () => {
    if (evo.timer) return evoStop();
    let n = 0;
    $('evo-play').textContent = '❚❚ Pausar';
    const tick = () => {
      evoStep();
      renderEvolution();
      if (++n >= 10) evoStop();
    };
    if (viewer.reduced.matches) {
      while (evo.timer === null && n < 10) tick();
      evoStop();
    } else evo.timer = setInterval(tick, 260);
  };
  $('evo-reset').onclick = () => {
    evoStop();
    evo.q = evo.q0;
    evo.gen = 0;
    evo.history = [];
    renderEvolution();
  };

  // Tarjetas de especies: se abren al tocarlas y algunas llevan su cambio al simulador.
  all('.species-open').forEach(
    b =>
      (b.onclick = () => {
        const answer = b.nextElementSibling,
          open = answer.hidden;
        answer.hidden = !open;
        b.setAttribute('aria-expanded', String(open));
        b.textContent = open ? 'Ocultar' : 'Descubrí cómo';
        b.closest('.species').classList.toggle('open', open);
      }),
  );
  const tries = {
    ...Object.fromEntries(
      G.SPECIES.map(c => [c.id, { position: c.position, type: c.type || 'sub', base: c.base }]),
    ),
    icefish: { position: 0, type: 'sub', base: 'C' },
  };
  all('.species-try').forEach(
    b =>
      (b.onclick = () => {
        const m = tries[b.dataset.try];
        showTab('lab');
        clearResult();
        position = m.position;
        centerOn(position);
        apply(m, { guess: false });
      }),
  );

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
    for (const el of document.querySelectorAll('.poster-card, .species, .learning-grid article')) {
      el.classList.add('reveal');
      appear.observe(el);
    }
  }

  // En el celular, el método del póster arranca plegado para que la portada no sea tan larga.
  const phone = matchMedia('(max-width: 560px)'),
    foldMethod = () => (document.querySelector('.method-more').open = !phone.matches);
  phone.addEventListener('change', foldMethod);
  foldMethod();

  centerOn(position);
  renderSurvey();
  renderStats();
  render();
  renderMap();
  renderCatsMap();
  renderAnimalsMap();
  renderEvolution();
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
