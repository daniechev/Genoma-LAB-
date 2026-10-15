// El duelo en pantalla: dos jugadores eligen en secreto, se revela la respuesta y se suman los puntos.
// Las rondas y el puntaje salen de duelo.js; el resultado de cada mutación, del mismo motor del simulador.
(() => {
  'use strict';
  const dialog = document.getElementById('duel-dialog');
  if (!dialog) return;
  const D = Duel,
    G = Genetics,
    $ = id => document.getElementById(id),
    ROUNDS = 5,
    TIME = 15000,
    OPTIONS = [
      ['nada', 'No cambia nada', '<i></i><i></i><i></i><i></i><i></i>'],
      ['pieza', 'Cambia una pieza', '<i></i><i></i><i class="x"></i><i></i><i></i>'],
      ['corte', 'Se corta', '<i></i><i></i><i class="o"></i><i class="o"></i><i class="o"></i>'],
      [
        'desorden',
        'Se desordena',
        '<i></i><i></i><i class="w"></i><i class="w"></i><i class="w"></i>',
      ],
    ],
    KEYS = [
      ['1', '2', '3', '4'],
      ['7', '8', '9', '0'],
    ],
    players = [...dialog.querySelectorAll('.duel-player')];
  let rounds = [],
    index = 0,
    scores = [0, 0],
    answers = [null, null],
    started = 0,
    timer = null,
    revealed = false;

  const name = i => $(`duel-n${i + 1}`).value.trim() || `Jugador ${i + 1}`;
  const tiles = (codon, mark, cls = '') =>
    [...codon]
      .map(
        (b, i) => `<span class="base ${b.toLowerCase()}${i === mark ? ` ${cls}` : ''}">${b}</span>`,
      )
      .join('');
  // Cómo se muestra el cambio: el codón antes y después, sin decir qué pieza sale.
  function describe(r) {
    const letter = G.DNA[r.position],
      inCodon = r.position % 3,
      before = G.DNA.slice(r.codon * 3, r.codon * 3 + 3),
      text =
        r.type === 'sub'
          ? `Codón ${r.codon + 1}: la <b>${letter}</b> pasa a ser <b>${r.base}</b>`
          : r.type === 'del'
            ? `Codón ${Math.floor(r.position / 3) + 1}: se <b>quita</b> la ${letter}`
            : `Codón ${Math.floor(r.position / 3) + 1}: se <b>agrega</b> una ${r.base} después de la ${letter}`;
    const original = G.DNA.slice(
      Math.floor(r.position / 3) * 3,
      Math.floor(r.position / 3) * 3 + 3,
    );
    return `<p>${text}</p><div class="duel-codons"><span class="duel-codon">${tiles(r.type === 'sub' ? before : original, r.type === 'ins' ? -1 : inCodon, r.type === 'del' ? 'removed' : 'changed')}</span><span class="duel-arrow" aria-hidden="true">→</span><span class="duel-codon">${r.type === 'sub' ? tiles(r.mutatedCodon, inCodon, 'changed') : '<b class="duel-q">?</b>'}</span></div><p class="muted">${r.type === 'sub' ? `${before} escribe ${G.names[G.table[before]] || 'STOP'}` : 'Ojo: quitar o agregar mueve todas las letras que siguen.'}</p>`;
  }
  function why(r) {
    const old = G.names[G.table[r.originalCodon]],
      neu = G.names[G.table[r.mutatedCodon]];
    if (r.effect === 'synonymous')
      return `${r.originalCodon} y ${r.mutatedCodon} escriben la misma pieza: ${old}.`;
    if (r.effect === 'missense')
      return `${r.originalCodon} → ${r.mutatedCodon}: la pieza ${r.piece} pasa de ${old} a ${neu}.`;
    if (r.effect === 'nonsense')
      return `${r.mutatedCodon} es una señal de STOP: la proteína queda con ${r.mature.length} piezas.`;
    if (r.effect === 'start-loss') return 'Se perdió el ATG de inicio: la proteína no se fabrica.';
    if (r.effect === 'stop-loss')
      return 'Se perdió el STOP del final: la proteína no sabe dónde terminar.';
    return `Al ${r.type === 'del' ? 'quitar' : 'agregar'} una letra, todos los grupos de tres se corren desde el codón ${r.codon + 1}.`;
  }
  function paintScores() {
    players.forEach((p, i) => {
      p.querySelector('.duel-name').textContent = name(i);
      p.querySelector('.duel-score').textContent = scores[i];
    });
  }
  function startGame() {
    rounds = D.makeRounds(ROUNDS);
    index = 0;
    scores = [0, 0];
    $('duel-intro').hidden = true;
    $('duel-end').hidden = true;
    $('duel-game').hidden = false;
    paintScores();
    startRound();
  }
  function startRound() {
    const round = rounds[index];
    answers = [null, null];
    revealed = false;
    $('duel-round').textContent = `RONDA ${index + 1} DE ${ROUNDS}`;
    $('duel-change').innerHTML = describe(round.result);
    $('duel-reveal').hidden = true;
    players.forEach((p, i) => {
      p.classList.remove('right', 'wrong', 'ready');
      p.querySelector('.duel-options').innerHTML = OPTIONS.map(
        ([key, label, beads], k) =>
          `<button data-guess="${key}"><span class="beads" aria-hidden="true">${beads}</span><b>${label}</b><kbd>${KEYS[i][k]}</kbd></button>`,
      ).join('');
      p.querySelectorAll('[data-guess]').forEach(
        b => (b.onclick = () => answer(i, b.dataset.guess)),
      );
      p.querySelector('.duel-status').textContent = 'Elegí en secreto';
    });
    started = performance.now();
    const bar = $('duel-timer');
    bar.style.transition = 'none';
    bar.style.width = '100%';
    void bar.offsetWidth;
    bar.style.transition = `width ${TIME}ms linear`;
    bar.style.width = '0%';
    clearTimeout(timer);
    timer = setTimeout(reveal, TIME);
  }
  function answer(i, guess) {
    if (revealed || answers[i]) return;
    answers[i] = { guess, time: performance.now() - started };
    const p = players[i];
    p.classList.add('ready');
    p.querySelector('.duel-status').textContent = '✓ ¡Listo! Esperando al otro jugador…';
    Sound.ui('tap', { force: true });
    if (answers[0] && answers[1]) reveal();
  }
  function reveal() {
    if (revealed) return;
    revealed = true;
    clearTimeout(timer);
    const round = rounds[index],
      r = round.result,
      { right, points } = D.score(round, answers),
      correct = OPTIONS.find(o => o[0] === r.category)[1];
    points.forEach((n, i) => (scores[i] += n));
    players.forEach((p, i) => {
      p.classList.remove('ready');
      p.classList.add(right[i] ? 'right' : 'wrong');
      p.querySelectorAll('[data-guess]').forEach(b => {
        b.disabled = true;
        b.classList.toggle('picked', answers[i]?.guess === b.dataset.guess);
        b.classList.toggle('correct', b.dataset.guess === r.category);
      });
      p.querySelector('.duel-status').textContent = !answers[i]
        ? 'Se acabó el tiempo'
        : right[i]
          ? `✓ ¡Acertaste! +${points[i]}${points[i] > 1 ? ' (el más rápido)' : ''}`
          : '✗ No era esa';
    });
    paintScores();
    const last = index === ROUNDS - 1;
    $('duel-reveal').innerHTML =
      `<p><b>${correct}.</b> ${why(r)}</p><button class="primary" id="duel-next">${last ? 'Ver quién ganó' : 'Siguiente ronda'} <span aria-hidden="true">→</span></button>`;
    $('duel-reveal').hidden = false;
    $('duel-next').onclick = next;
    $('duel-next').focus({ preventScroll: true });
    Sound.ui(right.some(Boolean) ? 'hit' : 'miss', { force: true });
  }
  function next() {
    if (index < ROUNDS - 1) {
      index++;
      startRound();
    } else finish();
  }
  function finish() {
    $('duel-game').hidden = true;
    $('duel-end').hidden = false;
    const [a, b] = scores;
    $('duel-winner').textContent = a === b ? '¡Empate!' : `¡Ganó ${name(a > b ? 0 : 1)}!`;
    const pts = n => (n === 1 ? '1 punto' : `${n} puntos`);
    $('duel-final').textContent = `${name(0)}: ${pts(a)} · ${name(1)}: ${pts(b)}`;
    confetti();
    Sound.ui('hit', { force: true });
  }
  // Papelitos de colores (los colores de las cuatro letras del ADN).
  function confetti() {
    const canvas = $('duel-confetti'),
      ctx = canvas.getContext('2d'),
      rect = canvas.getBoundingClientRect(),
      colors = ['#ff7a66', '#ffd447', '#4fd8ff', '#b693ff'];
    canvas.width = rect.width;
    canvas.height = rect.height;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bits = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      vy: 2 + Math.random() * 3,
      vx: (Math.random() - 0.5) * 2,
      r: Math.random() * 6.28,
      c: colors[Math.floor(Math.random() * 4)],
    }));
    const t0 = performance.now();
    (function fall(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of bits) {
        p.x += p.vx;
        p.y += p.vy;
        p.r += 0.08;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-5, -3, 10, 6);
        ctx.restore();
      }
      if (t - t0 < 4500 && !$('duel-end').hidden) requestAnimationFrame(fall);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    })(t0);
  }
  function open() {
    $('duel-intro').hidden = false;
    $('duel-game').hidden = true;
    $('duel-end').hidden = true;
    dialog.showModal();
  }
  function close() {
    clearTimeout(timer);
    dialog.close();
  }
  $('duel-open').onclick = open;
  $('duel-start').onclick = startGame;
  $('duel-again').onclick = startGame;
  $('duel-close').onclick = close;
  $('duel-exit').onclick = close;
  dialog.addEventListener('close', () => clearTimeout(timer));
  // Las teclas funcionan aunque el foco no esté dentro del cuadro (por ejemplo, después de tocar «Empezar»).
  document.addEventListener('keydown', e => {
    if (!dialog.open || $('duel-game').hidden || e.target.closest?.('input')) return;
    KEYS.forEach((keys, i) => {
      const k = keys.indexOf(e.key);
      if (k >= 0) {
        e.preventDefault();
        answer(i, OPTIONS[k][0]);
      }
    });
  });
  // Para que otros botones (por ejemplo, el final del recorrido) puedan abrir el duelo.
  GenomaLab.openDuel = open;
})();
