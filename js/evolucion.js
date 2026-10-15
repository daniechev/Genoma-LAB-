// Segundo experimento: comparar la cadena beta humana con la de otras 16 especies.
// Pregunta: ¿las piezas que la evolución nunca cambió son las que sostienen el hemo, el que lleva el oxígeno?
// No toca la página: se usa igual en el navegador y en las pruebas (node --test).
(function (root) {
  'use strict';
  const G = root.Genetics || require('./genetica.js');
  const SPECIES = root.SPECIES_HBB || require('./datos-especies.js');
  const HUMAN = G.EXPECTED.slice(1);
  // Distancia (en angstroms) que usamos para decir que una pieza está «cerca del hemo».
  const NEAR = 12;

  // Cuántas especies tienen la misma pieza que nosotros en cada lugar (de 0 a 16).
  function conservation() {
    return [...HUMAN].map((aa, i) => SPECIES.filter(s => s.seq[i] === aa).length);
  }
  // Cuántas piezas de 146 son iguales a las nuestras en una especie.
  function identity(species) {
    let same = 0;
    for (let i = 0; i < HUMAN.length; i++) if (species.seq[i] === HUMAN[i]) same++;
    return same;
  }
  // Qué especies tienen otra pieza en un lugar (piece se cuenta desde 1, como en el simulador).
  function differentAt(piece) {
    return SPECIES.filter(s => s.seq[piece - 1] !== HUMAN[piece - 1]).map(s => ({
      name: s.name,
      aa: s.seq[piece - 1],
    }));
  }
  // Qué especies tienen justo esta pieza nueva en ese lugar: la evolución ya «probó» ese cambio.
  function sameChange(piece, aa) {
    return SPECIES.filter(s => s.seq[piece - 1] === aa && aa !== HUMAN[piece - 1]).map(s => s.name);
  }
  // Distancia de cada pieza de la cadena beta (carbono alfa) al hierro de su hemo, en la estructura 2HHB.
  // El hemo de la cadena beta es el más cercano a la histidina 92, que se une directamente a su hierro.
  function hemeDistances(model) {
    const chain = model.chains[model.beta],
      his92 = chain[91],
      d = (p, fe) => Math.hypot(p.x - fe[0], p.y - fe[1], p.z - fe[2]);
    if (!his92 || his92.aa !== 'HIS')
      throw new Error('No se encontró la histidina 92 de la cadena beta.');
    const fe = model.hemes.reduce((best, h) => (d(his92, h) < d(his92, best) ? h : best));
    return chain.map(p => d(p, fe));
  }
  // El resultado del experimento: piezas cerca y lejos del hemo, y cuántas no cambiaron en ninguna especie.
  function hemeStudy(model, cutoff = NEAR) {
    const cons = conservation(),
      dist = hemeDistances(model),
      group = () => ({ n: 0, invariant: 0, sum: 0 }),
      near = group(),
      far = group();
    dist.forEach((x, i) => {
      const g = x < cutoff ? near : far;
      g.n++;
      g.sum += cons[i] / SPECIES.length;
      if (cons[i] === SPECIES.length) g.invariant++;
    });
    for (const g of [near, far]) g.mean = g.sum / g.n;
    return { cutoff, near, far, distances: dist, conservation: cons, species: SPECIES.length };
  }
  // Entre los cambios de una pieza del póster (1.332 sustituciones), cuántos ponen una pieza que ya tiene otra especie.
  function missenseSeenInNature() {
    let missense = 0,
      seen = 0;
    for (const m of G.substitutionMap())
      if (m.effect === 'missense') {
        missense++;
        if (sameChange(m.codon, m.to).length) seen++;
      }
    return { missense, seen };
  }
  const api = {
    SPECIES,
    HUMAN,
    NEAR,
    conservation,
    identity,
    differentAt,
    sameChange,
    hemeDistances,
    hemeStudy,
    missenseSeenInNature,
  };
  if (typeof module !== 'undefined') module.exports = api;
  root.Evolution = api;
})(globalThis);
