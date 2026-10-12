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

test('la copia sin internet incluye todos los archivos que usa la página', () => {
  const root = path.join(__dirname, '..');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const saved = JSON.parse(
    sw
      .match(/const ARCHIVOS = (\[[\s\S]*?\]);/)[1]
      .replace(/'/g, '"')
      .replace(/,\s*\]/, ']'),
  );
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  const used = [
    ...['index.html', 'cartel.html'].flatMap(page =>
      [...fs.readFileSync(path.join(root, page), 'utf8').matchAll(/(?:src|href)="([^"#:]+)"/g)].map(
        m => m[1],
      ),
    ),
    ...manifest.icons.map(icon => icon.src),
  ];
  for (const file of used) assert.ok(saved.includes(file), `falta ${file} en ARCHIVOS de sw.js`);
  for (const file of saved.filter(f => f !== './'))
    assert.ok(fs.existsSync(path.join(root, file)), `${file} está en sw.js pero no existe`);
  const pages = fs.readFileSync(path.join(root, '.github', 'workflows', 'pages.yml'), 'utf8');
  for (const file of ['sw.js', 'manifest.webmanifest'])
    assert.match(pages, new RegExp(file.replace('.', '\\.')), `pages.yml debe publicar ${file}`);
});
