// Página de inicio: una introducción y una historia guiada de once escenas, cada una contada en pasos cortos («beats»). «Seguir», las flechas del
// teclado o deslizar el dedo avanzan un paso; al terminar los pasos de una escena se pasa a la siguiente.
// En el modo stand (index.html?stand) avanza sola si nadie toca la pantalla, y vuelve a empezar al final.
(() => {
  const $ = id => document.getElementById(id),
    scenes = [...document.querySelectorAll('.scene')],
    reduced = matchMedia('(prefers-reduced-motion: reduce)'),
    stand = new URLSearchParams(location.search).has('stand');
  let current = 0,
    beat = 0,
    changed = false,
    fixed = false;

  const beatsOf = i => scenes[i].querySelectorAll('.beat').length || 1;
  // La escena 0 es la introducción; la historia va de la 1 a la 11.
  const DNA_SCENE = 3,
    CHANGE_SCENE = 4,
    CRISPR_SCENE = 10,
    FIX_BEAT = 2;

  // ---- Escena 1: glóbulos rojos que pasan ----
  $('blood').innerHTML =
    Array.from({ length: 14 }, (_, i) => {
      const size = 54 + ((i * 37) % 60);
      return `<svg class="rbc" style="--y:${(i * 53) % 92}%;--s:${size}px;--d:${9 + ((i * 7) % 8)}s;--delay:-${(i * 1.7) % 12}s" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="46" ry="40" fill="url(#rbc)"/><ellipse cx="50" cy="50" rx="20" ry="16" fill="#9b1426" opacity=".45"/></svg>`;
    }).join('') +
    // Un glóbulo grande en el centro: al seguir, la cámara «entra» en él y aparece el ADN.
    '<svg class="rbc hero" id="hero-cell" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="46" ry="40" fill="url(#rbc)"/><ellipse cx="50" cy="50" rx="20" ry="16" fill="#9b1426" opacity=".45"/></svg>';

  // ---- Escena 2: zoom de la célula al nucleosoma (una capa por paso) ----
  const TXT = 'fill="#c2bdea" font-size="17" text-anchor="middle"';
  const smallX = (x, y, k) =>
    `<g transform="translate(${x} ${y}) scale(${k})" opacity=".35" stroke="#8b5cf6" stroke-width="12" stroke-linecap="round" fill="none"><path d="M-10-40Q4 0-10 40M10-40Q-4 0 10 40"/></g>`;
  const fiber = Array.from({ length: 84 }, (_, i) => {
    const t = i * 0.42,
      depth = Math.cos(t);
    return `<circle cx="${(36 + i * 3.9).toFixed(1)}" cy="${(140 + 48 * Math.sin(t)).toFixed(1)}" r="11" fill="${depth > 0 ? '#c4a8ff' : '#6b4fc4'}" stroke="#0b0820" stroke-width="1.5"/>`;
  });
  // Primero las cuentas de atrás, después las de adelante, así la fibra parece enrollada.
  fiber.sort((a, b) => (a.includes('#6b4fc4') ? -1 : 1) - (b.includes('#6b4fc4') ? -1 : 1));
  const spools = [70, 160, 250, 340];
  $('zoom').innerHTML = [
    `<svg class="z-layer" data-at="0" viewBox="0 0 400 300"><ellipse cx="200" cy="150" rx="180" ry="128" fill="#241d55" stroke="#8b5cf6" stroke-width="3"/><ellipse cx="80" cy="110" rx="22" ry="10" fill="#3a2f80"/><ellipse cx="320" cy="190" rx="26" ry="11" fill="#3a2f80"/><ellipse cx="300" cy="90" rx="14" ry="8" fill="#3a2f80"/><ellipse cx="110" cy="210" rx="18" ry="9" fill="#3a2f80"/><circle class="ring" cx="200" cy="140" r="62" fill="#3b2a7a" stroke="#b693ff" stroke-width="3"/><path d="M160 130c14-20 30 10 44-6s26 18 36 2M166 156c16 10 26-14 40 0s22-10 32 6" fill="none" stroke="#b693ff" stroke-width="3" opacity=".7"/><text x="200" y="232" ${TXT}>núcleo</text></svg>`,
    `<svg class="z-layer" data-at="1" viewBox="0 0 400 300">${smallX(60, 70, 0.8)}${smallX(330, 80, 0.7)}${smallX(80, 230, 0.6)}${smallX(320, 220, 0.9)}<g fill="none" stroke-linecap="round" stroke-width="44"><path d="M178 40Q206 150 178 260" stroke="#b693ff"/><path d="M222 40Q194 150 222 260" stroke="#b693ff"/></g><g fill="#7c5cd6"><rect x="150" y="120" width="100" height="10"/><rect x="150" y="190" width="100" height="12"/><rect x="150" y="225" width="100" height="8"/></g><rect class="hbb-band" x="150" y="62" width="100" height="14" fill="#ffd447"/><path d="M252 69h40" stroke="#ffd447" stroke-width="2"/><text x="340" y="74" fill="#ffd447" font-size="17" font-weight="700" text-anchor="middle">gen HBB</text><text x="200" y="294" ${TXT}>cromosoma 11</text></svg>`,
    `<svg class="z-layer" data-at="2" viewBox="0 0 400 300">${fiber.join('')}<text x="200" y="250" ${TXT}>fibra de ADN enrollado</text></svg>`,
    `<svg class="z-layer" data-at="3" viewBox="0 0 400 300"><path d="M0 190${spools.map(x => `C${x - 40} 190 ${x - 40} 190 ${x - 34} 176M${x + 34} 124C${x + 50} 110 ${x + 60} 190 ${x + 90} 190`).join('')}" fill="none" stroke="#5ef2b0" stroke-width="5"/>${spools.map(x => `<circle cx="${x}" cy="150" r="30" fill="#b693ff"/><ellipse cx="${x}" cy="150" rx="38" ry="40" fill="none" stroke="#5ef2b0" stroke-width="5" stroke-dasharray="150 30" transform="rotate(-30 ${x} 150)"/>`).join('')}<text x="70" y="226" ${TXT}>histona</text><text x="205" y="80" fill="#5ef2b0" font-size="17" text-anchor="middle">ADN</text><text x="200" y="270" ${TXT}>cada carrete es un nucleosoma</text></svg>`,
  ].join('');

  // ---- Escena 3: la receta se separa de a tres y aparecen las piezas ----
  // Primeros 9 codones de HBB (los mismos de js/genetica.js). El codón 7 es el de la anemia falciforme.
  const CODONS = [
    ['ATG', 'Met'],
    ['GTG', 'Val'],
    ['CAT', 'His'],
    ['CTG', 'Leu'],
    ['ACT', 'Thr'],
    ['CCT', 'Pro'],
    ['GAG', 'Glu'],
    ['GAG', 'Glu'],
    ['AAG', 'Lys'],
  ];
  $('dna').innerHTML = CODONS.map(
    ([codon, piece], i) =>
      `<div class="codon${i === 6 ? ' seven' : ''}" style="--i:${i}"><div class="letters">${[
        ...codon,
      ]
        .map((b, j) => `<span class="base ${b.toLowerCase()}" style="--j:${i * 3 + j}">${b}</span>`)
        .join('')}</div><b class="aa">${piece}</b>${i === 6 ? '<small>codón 7</small>' : ''}</div>`,
  ).join('');

  // ---- Escena 4: el visitante cambia la letra ----
  const RESULTS = {
    T: { codon: 'GTG', piece: '<b>Val</b> valina' },
    C: {
      codon: 'GCG',
      piece: '<b>Ala</b> alanina',
      text: 'Cambió la pieza 6: ahora es <b>alanina</b>. Pero ese no es el cambio de la enfermedad. Probá con la <b>T</b>.',
    },
    G: {
      codon: 'GGG',
      piece: '<b>Gly</b> glicina',
      text: 'Cambió la pieza 6: ahora es <b>glicina</b>. Pero ese no es el cambio de la enfermedad. Probá con la <b>T</b>.',
    },
  };
  const START_TEXT =
    'El codón 7, <b>GAG</b>, pone un <b>glutamato</b> en la pieza 6: el aminoácido que se lleva bien con el agua.';
  function resetChange() {
    changed = false;
    const a = $('tap-a');
    a.textContent = 'A';
    a.className = 'tile a pulse';
    a.setAttribute('aria-expanded', 'false');
    $('choices').hidden = true;
    $('piece').innerHTML = 'pieza 6 · <b>Glu</b> glutamato';
    $('change-text').innerHTML = START_TEXT;
    $('t4').innerHTML =
      'Tocá la <span class="letter-a">A</span> y cambiala por una <span class="letter-t">T</span>.';
  }
  $('tap-a').onclick = () => {
    const open = $('choices').hidden;
    $('choices').hidden = !open;
    $('tap-a').setAttribute('aria-expanded', String(open));
    $('tap-a').classList.remove('pulse');
  };
  function choose(base) {
    const r = RESULTS[base],
      a = $('tap-a');
    a.textContent = base;
    a.className = `tile ${base.toLowerCase()} changed`;
    $('choices').hidden = true;
    $('piece').innerHTML = `pieza 6 · ${r.piece}`;
    changed = base === 'T';
    // La T cambiada es el hilo de la historia: en las escenas siguientes viaja al mapa y al escudo.
    a.classList.toggle('thread', changed);
    if (changed) {
      $('t4').textContent = '¡Cambiaste una sola letra!';
      $('change-text').innerHTML = START_TEXT;
      setBeat(1);
    } else {
      a.classList.add('pulse');
      $('change-text').innerHTML = r.text;
      updateControls();
    }
  }
  document.querySelectorAll('[data-base]').forEach(b => (b.onclick = () => choose(b.dataset.base)));

  // ---- Escena 5: mapa de la malaria y la letra ----
  // Mismos países que el mapa de Naturaleza en js/app.js (códigos ISO 3166 numéricos).
  const HBS = new Set(
      '686 270 624 324 694 430 384 466 854 288 768 204 562 566 120 148 140 729 728 226 266 178 180 024 800 404 834 646 108 894 454 508 682 512 887 356'.split(
        ' ',
      ),
    ),
    MALARIA = new Set([
      ...HBS,
      ...'231 706 232 450 716 516 072 478 262 586 050 104 764 418 116 704 458 360 608 144 598 626 380 300 196 792 364 368 760 422 400 818 788 012 504 724 620'.split(
        ' ',
      ),
    ]);
  const map = $('map');
  map.setAttribute('viewBox', '400 100 380 300');
  map.innerHTML = `<defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.6" height="7" fill="#ff5d6c"/></pattern></defs>${WORLD_MAP.countries
    .map(c => `<path class="land${HBS.has(c.id) ? ' hbs' : ''}" d="${c.d}"/>`)
    .join('')}<g class="malaria">${WORLD_MAP.countries
    .filter(c => MALARIA.has(c.id))
    .map(c => `<path d="${c.d}"/>`)
    .join('')}</g>`;

  // ---- Escena 10: CRISPR. El visitante repara la T que cambió antes. ----
  const FIX = {
    A: { piece: '<b>Glu</b> glutamato' },
    C: {
      piece: '<b>Ala</b> alanina',
      text: 'Con una C dice <b>GCG</b>, que pone alanina. Esa no es la letra original: probá otra.',
    },
    G: {
      piece: '<b>Gly</b> glicina',
      text: 'Con una G dice <b>GGG</b>, que pone glicina. Esa no es la letra original: probá otra.',
    },
  };
  const FIX_START = 'Reparalo vos: tocá la <b>T</b> y elegí qué letra tiene que ir.';
  function resetFix() {
    fixed = false;
    const t = $('fix-t');
    t.textContent = 'T';
    t.className = 's t pulse';
    $('fix-choices').hidden = true;
    $('fix-piece').innerHTML = 'pieza 6 · <b>Val</b> valina';
    $('fix-text').innerHTML = FIX_START;
    $('crispr').classList.remove('fixed');
  }
  $('fix-t').onclick = () => {
    if (fixed) return;
    const open = $('fix-choices').hidden;
    $('fix-choices').hidden = !open;
    $('fix-t').setAttribute('aria-expanded', String(open));
    $('fix-t').classList.remove('pulse');
  };
  function fix(base) {
    const r = FIX[base],
      t = $('fix-t');
    t.textContent = base;
    t.className = `s ${base.toLowerCase()}`;
    $('fix-choices').hidden = true;
    $('fix-piece').innerHTML = `pieza 6 · ${r.piece}`;
    fixed = base === 'A';
    $('crispr').classList.toggle('fixed', fixed);
    $('fix-text').innerHTML = fixed
      ? '¡Listo! El codón volvió a decir <b>GAG</b> y la pieza 6 es otra vez <b>glutamato</b>.'
      : r.text;
    if (!fixed) t.classList.add('pulse');
    updateControls();
  }
  document.querySelectorAll('[data-fix]').forEach(b => (b.onclick = () => fix(b.dataset.fix)));

  // ---- Pasos dentro de una escena ----
  // Cada escena muestra un párrafo por vez y su dibujo cambia según el paso (atributo data-beat).
  function setBeat(b) {
    const scene = scenes[current];
    beat = Math.max(0, Math.min(beatsOf(current) - 1, b));
    scene.dataset.beat = beat;
    scene.querySelectorAll('.beat').forEach((p, i) => p.classList.toggle('on', i === beat));
    // El dibujo sigue al texto: «data-at» muestra un elemento solo en ese paso, y «past-N» marca los pasos ya vistos.
    scene
      .querySelectorAll('[data-at]')
      .forEach(el => el.classList.toggle('on', Number(el.dataset.at) === beat));
    for (let k = 1; k < 6; k++) scene.classList.toggle(`past-${k}`, beat >= k);
    if (current === DNA_SCENE) {
      const dna = $('dna');
      dna.classList.toggle('split', beat >= 1);
      dna.classList.toggle('read', beat >= 2);
      dna.classList.toggle('chain', beat >= 3);
      dna.classList.toggle('focus', beat >= 4);
    }
    if (current === CHANGE_SCENE) {
      $('cell-swap').classList.toggle('fibers', changed && beat === 2);
      $('cell-swap').classList.toggle('sick', changed && beat >= 3);
    }
    updateControls();
  }

  // ---- Navegación ----
  $('progress').innerHTML = scenes
    .slice(1)
    .map((_, i) => `<li><button data-go="${i + 1}" aria-label="Escena ${i + 1}"></button></li>`)
    .join('');
  document
    .querySelectorAll('[data-go]')
    .forEach(b => (b.onclick = () => show(Number(b.dataset.go))));

  function updateControls() {
    const last = current === scenes.length - 1,
      blocked =
        (current === CHANGE_SCENE && !changed) ||
        (current === CRISPR_SCENE && beat === FIX_BEAT && !fixed);
    $('back').disabled = current === 0;
    // Al final se oculta sin moverse de lugar, así la flecha de volver no salta.
    $('next').style.visibility = last ? 'hidden' : '';
    $('next').disabled = blocked;
    $('next').innerHTML = blocked
      ? 'Cambiá la letra para seguir'
      : 'Seguir <span aria-hidden="true">→</span>';
    document.querySelectorAll('[data-go]').forEach(b => {
      const i = Number(b.dataset.go),
        fill = i < current ? 100 : i > current ? 0 : ((beat + 1) / beatsOf(i)) * 100;
      b.style.setProperty('--fill', `${fill}%`);
      if (i === current) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
  }

  // Las escenas pasan con View Transitions: los elementos con el mismo «view-transition-name» se
  // transforman de una escena a la otra (el glóbulo en ADN, el codón chico en el grande, la T en el mapa…).
  // Donde el navegador no las tiene, o con movimiento reducido, cambia directo.
  const canMorph = 'startViewTransition' in document;
  if (canMorph) document.documentElement.classList.add('vt');
  let started = false;
  function show(n, b = 0) {
    n = Math.max(0, Math.min(scenes.length - 1, n));
    document.documentElement.dataset.dir = n >= current ? 'next' : 'back';
    if (canMorph && started && !reduced.matches && n !== current)
      document.startViewTransition(() => render(n, b));
    else render(n, b);
    started = true;
  }
  function render(n, b) {
    current = n;
    document.body.dataset.scene = n;
    scenes.forEach((s, i) => (s.hidden = i !== n));
    if (n === CHANGE_SCENE && !changed) resetChange();
    if (n === CRISPR_SCENE && !fixed) resetFix();
    setBeat(b);
    history.replaceState(null, '', n ? `#${n}` : location.pathname + location.search);
    scenes[n].querySelector('h1').focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }
  function next() {
    if ($('next').disabled || $('next').style.visibility === 'hidden') return;
    if (beat < beatsOf(current) - 1) setBeat(beat + 1);
    else show(current + 1);
  }
  function back() {
    if (beat > 0) setBeat(beat - 1);
    else if (current > 0) show(current - 1, beatsOf(current - 1) - 1);
  }
  $('next').onclick = next;
  $('back').onclick = back;
  $('restart').onclick = () => {
    changed = false;
    fixed = false;
    show(1);
  };
  $('start').onclick = () => show(1);
  document.querySelector('[data-go-intro]').onclick = e => {
    e.preventDefault();
    show(0);
  };
  scenes.forEach(s => s.querySelector('h1').setAttribute('tabindex', '-1'));

  document.addEventListener('keydown', e => {
    if (e.target.closest('button, a') && (e.key === ' ' || e.key === 'Enter')) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      next();
    }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') back();
  });
  // Deslizar a la izquierda avanza; a la derecha, vuelve.
  let startX = null,
    startY = 0;
  document.addEventListener('pointerdown', e => {
    startX = e.clientX;
    startY = e.clientY;
  });
  document.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX,
      dy = e.clientY - startY;
    startX = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : back)();
  });

  // Modo stand: si nadie toca durante 8 segundos, sigue sola; en las escenas 4 y 10 hace ella misma el cambio.
  if (stand) {
    let idle = 0;
    ['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, () => (idle = 0), true));
    setInterval(() => {
      idle += 1;
      if (current === CHANGE_SCENE && !changed && idle >= 4) {
        idle = 0;
        $('tap-a').click();
        setTimeout(() => choose('T'), 900);
      } else if (current === CRISPR_SCENE && beat === FIX_BEAT && !fixed && idle >= 4) {
        idle = 0;
        $('fix-t').click();
        setTimeout(() => fix('A'), 900);
      } else if (idle >= 8) {
        idle = 0;
        if (current === scenes.length - 1) {
          changed = false;
          fixed = false;
          show(0);
        } else next();
      }
    }, 1000);
  }

  // Se puede abrir en una escena (de la #1 a la #4); más adelante no, porque antes hay que cambiar la letra.
  const start = Number(location.hash.slice(1));
  show(start >= 0 && start <= CHANGE_SCENE ? start : 0);

  // Sin internet: guarda una copia del sitio en el dispositivo (solo funciona publicado en la web).
  if (
    'serviceWorker' in navigator &&
    (location.protocol === 'https:' || location.hostname === 'localhost')
  )
    navigator.serviceWorker.register('sw.js').catch(() => {});
})();
