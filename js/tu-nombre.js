// Pestaña «Tu nombre»: escribe el nombre como proteína, muestra su ADN y deja mutarlo.
// La lógica (qué codón usa cada letra, cómo se lee) está en nombre.js; acá solo se muestra.
(() => {
  'use strict';
  const form = document.getElementById('name-form');
  if (!form) return;
  const N = NameGene,
    G = Genetics,
    $ = id => document.getElementById(id),
    input = $('name-input'),
    COLORS = { A: '#ff7a66', T: '#ffd447', C: '#4fd8ff', G: '#b693ff' },
    FULL = {
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
      U: 'selenocisteína',
      O: 'pirrolisina',
    };
  let encoded = null,
    mutation = null;

  // Las letras que se muestran, en orden, con el codón que les toca (0 es el ATG del inicio).
  function items(enc) {
    const list = [{ type: 'start', char: 'M', codon: 0 }];
    let k = 1;
    for (const l of enc.letters) {
      if (l.kind === 'space') list.push({ type: 'space' });
      else if (l.kind === 'missing') list.push({ type: 'missing', char: l.char });
      else
        list.push({ type: l.kind === 'special' ? 'special' : 'letter', char: l.char, codon: k++ });
    }
    list.push({ type: 'stop', codon: k });
    return list;
  }
  const codonOf = (dna, k) => dna.slice(k * 3, k * 3 + 3);
  const shortName = c => (c === 'U' ? 'Sec' : c === 'O' ? 'Pyl' : G.names[c] || '');
  function tiles(codon, changedAt = -1) {
    return `<span class="mini-codon">${[...codon]
      .map(
        (b, i) => `<i class="base ${b.toLowerCase()}${i === changedAt ? ' changed' : ''}">${b}</i>`,
      )
      .join('')}</span>`;
  }
  function render() {
    const dna = mutation ? mutation.dna : encoded.dna,
      read = mutation ? N.readName(dna, encoded.specials) : null,
      changedCodon = mutation ? Math.floor(mutation.position / 3) : -1;
    $('name-strip').innerHTML = items(encoded)
      .map(it => {
        if (it.type === 'space') return '<span class="name-gap" aria-hidden="true"></span>';
        if (it.type === 'missing')
          return `<div class="name-letter missing" title="La ${it.char} no es ninguna pieza"><b>${it.char}</b><small>no es pieza</small><span class="mini-codon empty">—</span></div>`;
        const codon = codonOf(dna, it.codon),
          changed = it.codon === changedCodon,
          at = changed ? mutation.position % 3 : -1;
        let char = it.char,
          state = '';
        if (it.type === 'stop') {
          const cut = read && read.protein.length < it.codon;
          return `<div class="name-letter stop${cut ? ' cut' : ''}"><b>STOP</b><small>fin</small>${tiles(codon)}</div>`;
        }
        if (read) {
          if (it.codon < read.protein.length) char = read.protein[it.codon];
          else if (it.codon === read.protein.length) state = ' now-stop';
          else state = ' cut';
          if (char !== it.char && !state) state = ' swapped';
        }
        const label =
          state === ' now-stop' ? 'STOP' : it.type === 'start' ? 'inicio' : shortName(char);
        return `<div class="name-letter ${it.type}${state}${changed ? ' changed' : ''}" title="${FULL[char] || ''}"><b>${state === ' now-stop' ? '■' : char}</b><small>${label}</small>${tiles(codon, at)}</div>`;
      })
      .join('');
  }
  function facts() {
    const ways = encoded.ways,
      big = ways > 1e12 ? 'más de un billón de' : ways.toLocaleString('es-AR'),
      parts = [
        `<p><b>${big} formas</b> distintas de escribir tu nombre en ADN: casi todas las piezas tienen varios codones que significan lo mismo. Acá usamos el que más usan los genes humanos.</p>`,
      ];
    if (encoded.missing.length)
      parts.push(
        `<p>La ${[...new Set(encoded.missing)].join(', la ')} no ${new Set(encoded.missing).size === 1 ? 'es ninguna pieza' : 'son piezas'}: la salteamos.</p>`,
      );
    if (encoded.protein.includes('U'))
      parts.push(
        '<p><b>¡Tenés una U!</b> Es la selenocisteína, una pieza rara que se escribe con TGA, un STOP disfrazado. Tu cuerpo tiene unas 25 proteínas que la usan.</p>',
      );
    if (encoded.protein.includes('O'))
      parts.push(
        '<p><b>¡Tenés una O!</b> Es la pirrolisina: solo la usan algunos microbios, que la escriben con TAG, otro STOP disfrazado.</p>',
      );
    $('name-facts').innerHTML = parts.join('');
  }
  function show(text) {
    encoded = N.encodeName(text);
    mutation = null;
    if (encoded.protein.length < 2) {
      $('name-result').hidden = true;
      GenomaLab.notify(
        'Escribí un nombre con alguna letra que sea una pieza (por ejemplo, A, L o S).',
      );
      return;
    }
    $('name-result').hidden = false;
    $('name-mutation').textContent = '';
    $('name-undo').hidden = true;
    render();
    facts();
    Sound.ui('reveal');
  }
  form.onsubmit = e => {
    e.preventDefault();
    show(input.value);
  };
  $('name-mutate').onclick = () => {
    if (!encoded) return;
    mutation = N.randomNameMutation(encoded);
    if (!mutation) return;
    const before = codonOf(encoded.dna, Math.floor(mutation.position / 3)),
      after = codonOf(mutation.dna, Math.floor(mutation.position / 3)),
      old = encoded.protein.slice(1),
      name = mutation.name;
    $('name-mutation').innerHTML =
      mutation.effect === 'synonymous'
        ? `La letra ${mutation.position + 1} del ADN cambió (${before} → ${after}), pero el codón sigue escribiendo la misma pieza: <b>tu nombre quedó igual</b>. Es una mutación silenciosa.`
        : mutation.effect === 'nonsense'
          ? `${before} → ${after}: <b>¡apareció un STOP!</b> La lectura se corta y tu nombre quedó ${name ? `<b>${name}</b>` : '<b>vacío</b>'}.`
          : `${before} → ${after}: <b>¡una sola letra cambió tu nombre!</b> Ahora dice <b>${name}</b> en vez de ${old}.`;
    $('name-undo').hidden = false;
    render();
    Sound.ui(mutation.effect === 'nonsense' ? 'stop' : 'reveal');
  };
  $('name-undo').onclick = () => {
    mutation = null;
    $('name-mutation').textContent = '';
    $('name-undo').hidden = true;
    render();
  };

  // ---- Tarjeta para llevarse: el nombre, sus piezas y su ADN ----
  const FONT = "'Segoe UI Variable Text', Aptos, 'Segoe UI', system-ui, sans-serif",
    MONO = "'Cascadia Mono', Consolas, monospace";
  function drawCard(canvas) {
    const c = canvas.getContext('2d'),
      W = canvas.width,
      H = canvas.height,
      pad = 96;
    const bg = c.createRadialGradient(W, 0, 0, W, 0, 1100);
    bg.addColorStop(0, '#7b2bb8');
    bg.addColorStop(1, '#0e0b24');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#1a1744';
    c.strokeStyle = '#3d3890';
    c.lineWidth = 3;
    c.beginPath();
    c.roundRect(48, 48, W - 96, H - 96, 40);
    c.fill();
    c.stroke();
    c.fillStyle = '#c2bdea';
    c.font = `700 28px ${FONT}`;
    c.fillText('ADN, GENES Y PROTEÍNAS · FERIA DE CIENCIAS', pad, 140);
    const grad = c.createLinearGradient(pad, 0, W - pad, 0);
    grad.addColorStop(0, '#ff9a4d');
    grad.addColorStop(1, '#c98bff');
    c.fillStyle = grad;
    c.font = `800 64px ${FONT}`;
    c.fillText('Mi nombre en ADN', pad, 226);
    const name = encoded.text;
    let size = 170;
    c.font = `800 ${size}px ${FONT}`;
    while (c.measureText(name).width > W - 2 * pad && size > 60) {
      size -= 8;
      c.font = `800 ${size}px ${FONT}`;
    }
    c.fillStyle = '#f7f5ff';
    c.fillText(name, pad, 230 + size * 1.02);
    // Las piezas, en fichas.
    let y = 300 + size * 1.02;
    const pieces = encoded.protein,
      perRow = Math.min(7, pieces.length),
      gap = 16,
      tile = Math.min(112, (W - 2 * pad - gap * (perRow - 1)) / perRow);
    [...pieces].forEach((ch, i) => {
      const row = Math.floor(i / perRow),
        x = pad + (i % perRow) * (tile + gap),
        ty = y + row * (tile + 54);
      c.fillStyle = i === 0 ? '#3d3890' : ch === 'U' || ch === 'O' ? '#ffd447' : '#4fd8ff';
      c.beginPath();
      c.roundRect(x, ty, tile, tile, 18);
      c.fill();
      c.fillStyle = '#1a1335';
      c.font = `800 ${tile * 0.55}px ${FONT}`;
      c.textAlign = 'center';
      c.fillText(ch, x + tile / 2, ty + tile * 0.7);
      c.fillStyle = '#c2bdea';
      c.font = `700 24px ${FONT}`;
      c.fillText(i === 0 ? 'inicio' : shortName(ch), x + tile / 2, ty + tile + 34);
      c.textAlign = 'left';
    });
    y += Math.ceil(pieces.length / perRow) * (tile + 54) + 40;
    // El ADN, con un color por letra.
    c.fillStyle = '#c2bdea';
    c.font = `700 28px ${FONT}`;
    c.fillText('Mi ADN', pad, y);
    y += 50;
    // Con nombres largos, el ADN se escribe más chico para que entre.
    const codons = encoded.dna.match(/.{3}/g),
      small = codons.length > 14,
      cw = small ? 98 : 128,
      line = small ? 40 : 52,
      perLine = Math.floor((W - 2 * pad) / cw);
    c.font = `700 ${small ? 28 : 36}px ${MONO}`;
    codons.forEach((codon, i) => {
      const x = pad + (i % perLine) * cw,
        ly = y + Math.floor(i / perLine) * line;
      [...codon].forEach((b, j) => {
        c.fillStyle = COLORS[b];
        c.fillText(b, x + j * (small ? 20 : 26), ly);
      });
    });
    y += Math.ceil(codons.length / perLine) * line + 30;
    c.fillStyle = '#f7f5ff';
    c.font = `600 30px ${FONT}`;
    const ways = encoded.ways > 1e12 ? 'más de un billón de' : encoded.ways.toLocaleString('es-AR');
    if (y < H - 200) c.fillText(`Se puede escribir de ${ways} formas distintas.`, pad, y);
    c.fillStyle = '#c2bdea';
    c.font = `500 26px ${FONT}`;
    c.fillText('Probalo vos: daniechev.github.io/Genoma-LAB-', pad, H - 92);
  }
  $('name-card').onclick = () => {
    const canvas = $('card-canvas');
    drawCard(canvas);
    $('card-heading').textContent = 'Tu nombre en ADN';
    canvas.setAttribute(
      'aria-label',
      `Tarjeta: el nombre ${encoded.text} escrito en ADN: ${encoded.dna}`,
    );
    $('card-share').hidden = !navigator.canShare;
    $('card-dialog').showModal();
  };
})();
