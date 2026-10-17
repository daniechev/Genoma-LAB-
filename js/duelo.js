// Duelo de predicciones: dos personas en la misma pantalla adivinan qué le pasa a la proteína.
// Cada ronda elige primero un resultado al azar (nada, pieza, corte o desorden) y después una mutación de ese tipo,
// así las cuatro respuestas salen igual de seguido y no conviene contestar siempre «cambia una pieza».
(function (root) {
  'use strict';
  const G = root.Genetics || require('./genetica.js');
  const CATEGORIES = ['nada', 'pieza', 'corte', 'desorden'];
  let pool = null;
  // Todas las mutaciones posibles de una letra, agrupadas por resultado.
  function mutationPool() {
    if (pool) return pool;
    pool = Object.fromEntries(CATEGORIES.map(c => [c, []]));
    for (const m of G.substitutionMap())
      pool[m.category].push({ position: m.position, type: 'sub', base: m.base });
    // Quitar o agregar letras: se eligen de a una por codón para que no dominen el grupo «desorden».
    for (let codon = 1; codon < 147; codon += 3) {
      pool.desorden.push({ position: codon * 3 + 1, type: 'del' });
      pool.desorden.push({ position: codon * 3, type: 'ins', base: 'ATCG'[codon % 4] });
    }
    return pool;
  }
  // Arma las rondas del duelo: sin repetir mutaciones y con los cuatro resultados mezclados.
  function makeRounds(count = 5, rand = Math.random) {
    const groups = mutationPool(),
      used = new Set(),
      rounds = [];
    let bag = [];
    while (rounds.length < count) {
      if (!bag.length) {
        bag = [...CATEGORIES];
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
      }
      const list = groups[bag.pop()];
      let pick;
      do pick = list[Math.floor(rand() * list.length)];
      while (used.has(JSON.stringify(pick)));
      used.add(JSON.stringify(pick));
      rounds.push({ ...pick, result: G.simulate(pick) });
    }
    return rounds;
  }
  // Puntaje: acertar suma 1; si los dos aciertan, el más rápido suma 1 extra.
  function score(round, answers) {
    const right = answers.map(a => a && a.guess === round.result.category);
    const points = right.map(r => (r ? 1 : 0));
    if (right[0] && right[1]) points[answers[0].time <= answers[1].time ? 0 : 1]++;
    return { right, points };
  }
  const api = { CATEGORIES, mutationPool, makeRounds, score };
  if (typeof module !== 'undefined') module.exports = api;
  root.Duel = api;
})(globalThis);
