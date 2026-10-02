// Pruebas del motor genético. Ejecutar con: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../js/genetica.js');

const sub = (position, base) => G.simulate({ position, type: 'sub', base });

test('el gen HBB tiene 444 letras válidas y empieza con ATG', () => {
  assert.equal(G.DNA.length, 444);
  assert.match(G.DNA, /^[ACGT]+$/);
  assert.equal(G.DNA.slice(0, 3), 'ATG');
});

test('la tabla del código genético tiene 64 codones y 3 señales de STOP', () => {
  const codons = Object.keys(G.table);
  assert.equal(codons.length, 64);
  const stops = codons.filter(c => G.table[c] === '*').sort();
  assert.deepEqual(stops, ['TAA', 'TAG', 'TGA']);
  // Algunos codones conocidos
  assert.equal(G.table.ATG, 'M');
  assert.equal(G.table.GAG, 'E');
  assert.equal(G.table.GTG, 'V');
  assert.equal(G.table.AAG, 'K');
  assert.equal(G.table.TGG, 'W');
});

test('cada uno de los 64 codones coincide con el código genético estándar', () => {
  // Escrito de forma independiente a la tabla del programa, por aminoácido.
  const standard = {
    F: 'TTT TTC', L: 'TTA TTG CTT CTC CTA CTG', I: 'ATT ATC ATA', M: 'ATG',
    V: 'GTT GTC GTA GTG', S: 'TCT TCC TCA TCG AGT AGC', P: 'CCT CCC CCA CCG',
    T: 'ACT ACC ACA ACG', A: 'GCT GCC GCA GCG', Y: 'TAT TAC', H: 'CAT CAC',
    Q: 'CAA CAG', N: 'AAT AAC', K: 'AAA AAG', D: 'GAT GAC', E: 'GAA GAG',
    C: 'TGT TGC', W: 'TGG', R: 'CGT CGC CGA CGG AGA AGG', G: 'GGT GGC GGA GGG',
    '*': 'TAA TAG TGA'
  };
  let total = 0;
  for (const [aa, list] of Object.entries(standard)) {
    for (const codon of list.split(' ')) {
      assert.equal(G.table[codon], aa, `${codon} debería ser ${aa}`);
      total++;
    }
  }
  assert.equal(total, 64);
});

test('traducir el gen normal da la proteína esperada', () => {
  const { protein, stop } = G.translate(G.DNA);
  assert.equal(protein, G.EXPECTED);
  assert.equal(stop, 147);
});

test('una letra inválida produce un error', () => {
  assert.throws(() => G.translate('ATGXXX'), /letras no válidas/);
});

test('validaciones de simulate', () => {
  assert.throws(() => sub(-1, 'A'), /entre 1 y 444/);
  assert.throws(() => sub(444, 'A'), /entre 1 y 444/);
  assert.throws(() => sub(19, 'A'), /letra diferente/); // ya es A
  assert.throws(() => sub(19, 'U'), /A, T, C o G/);
  assert.throws(() => G.simulate({ position: 19, type: 'otro', base: 'T' }), /no válido/);
});

test('mutación silenciosa: GAG → GAA sigue siendo Glu', () => {
  const r = sub(20, 'A');
  assert.equal(r.category, 'nada');
  assert.equal(r.effect, 'synonymous');
  assert.deepEqual(r.differences, []);
  assert.equal(r.realCase, null);
});

test('cambio de aminoácido en una pieza común', () => {
  const r = sub(19, 'C'); // GAG → GCG: Glu → Ala
  assert.equal(r.category, 'pieza');
  assert.equal(r.effect, 'missense');
  assert.deepEqual(r.differences, [6]);
  assert.equal(r.realCase, null);
});

test('perder el ATG inicial corta la proteína', () => {
  const r = sub(0, 'C');
  assert.equal(r.category, 'corte');
  assert.equal(r.effect, 'start-loss');
  assert.equal(r.protein, '');
});

test('perder el STOP final deja la lectura sin terminar', () => {
  const r = sub(441, 'C'); // TAA → CAA
  assert.equal(r.category, 'desorden');
  assert.equal(r.effect, 'stop-loss');
  assert.equal(r.lengthUnknown, true);
});

test('quitar o agregar una letra corre el marco de lectura', () => {
  for (const input of [{ position: 30, type: 'del' }, { position: 30, type: 'ins', base: 'A' }]) {
    const r = G.simulate(input);
    assert.equal(r.category, 'desorden');
    assert.equal(r.effect, 'frameshift');
  }
});

test('casos reales: anemia falciforme (Glu6Val)', () => {
  const r = sub(19, 'T');
  assert.equal(r.originalCodon, 'GAG');
  assert.equal(r.mutatedCodon, 'GTG');
  assert.equal(r.category, 'pieza');
  assert.deepEqual(r.differences, [6]);
  assert.equal(r.mature[5], 'V');
  assert.equal(r.realCase.id, 'sickle');
});

test('casos reales: hemoglobina C (Glu6Lys)', () => {
  const r = sub(18, 'A');
  assert.equal(r.mutatedCodon, 'AAG');
  assert.equal(r.category, 'pieza');
  assert.deepEqual(r.differences, [6]);
  assert.equal(r.mature[5], 'K');
  assert.equal(r.realCase.id, 'hbc');
});

test('casos reales: beta-talasemia (Gln39Stop)', () => {
  const r = sub(117, 'T');
  assert.equal(r.originalCodon, 'CAG');
  assert.equal(r.mutatedCodon, 'TAG');
  assert.equal(r.codon + 1, 40); // codón 40 contando el ATG = pieza 39
  assert.equal(r.category, 'corte');
  assert.equal(r.effect, 'nonsense');
  assert.equal(r.mature.length, 38);
  assert.equal(r.realCase.id, 'thal');
});

test('cada caso real coincide con su notación científica', () => {
  const names = Object.fromEntries(Object.entries(G.names).map(([k, v]) => [k, v === 'STOP' ? 'Stop' : v]));
  for (const c of G.CASES) {
    const r = sub(c.position, c.base);
    const piece = r.codon; // número de pieza en la proteína madura
    const before = names[G.EXPECTED[piece]];
    const after = names[G.table[r.mutatedCodon]];
    assert.equal(`${before}${piece}${after}`, c.notation, c.name);
  }
});

test('el mismo lugar con otra letra no se marca como caso real', () => {
  assert.equal(sub(19, 'C').realCase, null);
  assert.equal(G.simulate({ position: 19, type: 'del' }).realCase, null);
});

test('parsePDB rechaza un archivo sin la cadena beta', () => {
  assert.throws(() => G.parsePDB('HEADER vacío\n', true), /cadena beta/);
});
