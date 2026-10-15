// Pruebas de los experimentos nuevos: evolución, mapa de mutaciones, nombre, duelo e impresión 3D.
// Ejecutar con: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const G = require('../js/genetica.js');
const E = require('../js/evolucion.js');
const N = require('../js/nombre.js');
const D = require('../js/duelo.js');
const S = require('../js/stl.js');

const MODELS = new Function(
  fs.readFileSync(path.join(__dirname, '..', 'js', 'datos-modelos.js'), 'utf8') + ';return MODELS',
)();

test('las 16 especies tienen una cadena beta de 146 piezas válidas', () => {
  assert.equal(E.SPECIES.length, 16);
  for (const s of E.SPECIES) {
    assert.equal(s.seq.length, 146, s.entry);
    assert.match(s.seq, /^[ACDEFGHIKLMNPQRSTVWY]+$/, s.entry);
    assert.ok(s.separacion > 0 && s.separacion < 400, s.entry);
  }
  assert.equal(new Set(E.SPECIES.map(s => s.entry)).size, 16);
});

test('las dos histidinas que sostienen el hierro del hemo son iguales en todas las especies', () => {
  const cons = E.conservation();
  assert.equal(E.HUMAN[62], 'H'); // His63, del lado del oxígeno
  assert.equal(E.HUMAN[91], 'H'); // His92, unida al hierro
  assert.equal(cons[62], 16);
  assert.equal(cons[91], 16);
});

test('cerca del hemo hay más piezas que la evolución nunca cambió', () => {
  const s = E.hemeStudy(MODELS.pdb);
  assert.equal(s.near.n + s.far.n, 146);
  assert.deepEqual([s.near.n, s.near.invariant], [37, 21]);
  assert.deepEqual([s.far.n, s.far.invariant], [109, 22]);
  assert.ok(s.near.invariant / s.near.n > 2 * (s.far.invariant / s.far.n));
  // El hierro está a pocos angstroms de la histidina 92.
  assert.ok(s.distances[91] < 7);
});

test('ninguna especie tiene la valina de la anemia falciforme en la pieza 6', () => {
  assert.equal(E.HUMAN[5], 'E');
  assert.deepEqual(E.sameChange(6, 'V'), []);
  assert.equal(E.differentAt(6).length, 3);
  // El parentesco se nota: los primates se parecen más que la rana.
  const id = Object.fromEntries(E.SPECIES.map(s => [s.name, E.identity(s)]));
  assert.ok(id['Mandril'] > id['Paloma'] && id['Paloma'] > id['Rana de uñas']);
});

test('el mapa de las 1.332 sustituciones coincide con el póster', () => {
  const map = G.substitutionMap();
  assert.equal(map.length, 1332);
  const letters = G.letterSurvey();
  assert.deepEqual(
    letters.map(l => l.total),
    [444, 444, 444],
  );
  assert.equal(letters[1].synonymous, 1); // la 2.ª letra casi nunca perdona
  assert.equal(letters[2].synonymous, 306); // la 3.ª perdona 7 de cada 10 veces
  const total = G.substitutionSurvey();
  for (const effect of Object.keys(total))
    assert.equal(
      letters.reduce((n, l) => n + l[effect], 0),
      total[effect],
    );
  assert.deepEqual(E.missenseSeenInNature(), { missense: 957, seen: 165 });
});

test('un nombre se escribe en ADN con inicio, un codón por letra y STOP', () => {
  const ana = N.encodeName('Ána');
  assert.equal(ana.text, 'ANA');
  assert.equal(ana.dna, 'ATGGCCAACGCCTAA');
  assert.equal(G.translate(ana.dna).protein, 'MANA');
  assert.equal(ana.ways, 4 * 2 * 4);
  // Cada codón elegido de verdad escribe su pieza.
  for (const [aa, codon] of Object.entries(N.CODON)) assert.equal(G.table[codon], aa);
  const juan = N.encodeName('Juan');
  assert.deepEqual(juan.missing, ['J']);
  assert.equal(juan.protein, 'MUAN');
  assert.equal(N.readName(juan.dna, juan.specials).protein, 'MUAN');
  // Sin el contexto especial, la U se lee como un STOP.
  assert.equal(G.translate(juan.dna).protein, 'M');
});

test('una letra cambia el nombre', () => {
  const ana = N.encodeName('ANA');
  // ADN de ANA: ATG GCC AAC GCC TAA (la letra 3 es la primera del nombre).
  assert.equal(N.mutateName(ana, 4, 'T').name, 'VNA'); // GCC → GTC: A pasa a V
  assert.equal(N.mutateName(ana, 5, 'A').effect, 'synonymous'); // GCC → GCA: sigue siendo A
  assert.equal(N.mutateName(ana, 6, 'T').name, 'AYA'); // AAC → TAC: N pasa a Y
  const cut = N.mutateName(N.encodeName('AKA'), 6, 'T'); // AAG → TAG: un STOP corta el nombre
  assert.equal(cut.effect, 'nonsense');
  assert.equal(cut.name, 'A');
  for (let i = 0; i < 200; i++) {
    const m = N.randomNameMutation(N.encodeName('Rosalind'), Math.random);
    assert.ok(m.position >= 3 && m.position < 3 + 8 * 3);
  }
});

test('el duelo mezcla los cuatro resultados sin repetir mutaciones', () => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const rounds = D.makeRounds(8, rand);
  const count = Object.fromEntries(D.CATEGORIES.map(c => [c, 0]));
  for (const r of rounds) count[r.result.category]++;
  assert.deepEqual(Object.values(count), [2, 2, 2, 2]);
  assert.equal(new Set(rounds.map(r => `${r.type}${r.position}${r.base}`)).size, 8);
  const round = rounds[0],
    right = round.result.category,
    wrong = D.CATEGORIES.find(c => c !== right);
  assert.deepEqual(
    D.score(round, [
      { guess: right, time: 900 },
      { guess: right, time: 500 },
    ]).points,
    [1, 2],
  );
  assert.deepEqual(D.score(round, [{ guess: wrong, time: 1 }, null]).points, [0, 0]);
});

test('el modelo para imprimir en 3D es una malla cerrada', () => {
  const meshes = S.proteinMeshes(MODELS.pdb.chains.B, { mark: 6 });
  for (const m of meshes) {
    // Cada arista se recorre una vez en cada sentido: la superficie no tiene agujeros.
    const edges = new Map();
    for (const [a, b, c] of m.triangles)
      for (const [x, y] of [
        [a, b],
        [b, c],
        [c, a],
      ])
        edges.set(`${x},${y}`, (edges.get(`${x},${y}`) || 0) + 1);
    for (const [key, n] of edges) {
      const [x, y] = key.split(',');
      assert.equal(n, 1);
      assert.equal(edges.get(`${y},${x}`), 1);
    }
    assert.ok(S.signedVolume(m) > 0, 'las caras tienen que mirar hacia afuera');
  }
  const stl = new DataView(S.toSTL(meshes));
  const triangles = meshes.reduce((n, m) => n + m.triangles.length, 0);
  assert.equal(stl.getUint32(80, true), triangles);
  assert.equal(stl.byteLength, 84 + 50 * triangles);
});
