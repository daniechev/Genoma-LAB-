// Pruebas de los experimentos nuevos: evolución y mapa de mutaciones.
// Ejecutar con: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const G = require('../js/genetica.js');
const E = require('../js/evolucion.js');

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
