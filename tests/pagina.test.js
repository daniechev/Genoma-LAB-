// Pruebas de los datos que muestra la página. Ejecutar con: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('el póster dice cuántas pruebas automáticas hay de verdad', () => {
  const total = fs
    .readdirSync(__dirname)
    .filter(file => file.endsWith('.test.js'))
    .map(file => fs.readFileSync(path.join(__dirname, file), 'utf8').match(/^test\(/gm).length)
    .reduce((a, b) => a + b, 0);
  const shown = html.match(/<b>(\d+) pruebas automáticas<\/b>/);
  assert.ok(shown, 'el póster debe mencionar las pruebas automáticas');
  assert.equal(Number(shown[1]), total, 'actualizá el número de pruebas en index.html');
});
