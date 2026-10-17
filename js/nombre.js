// Tu nombre en ADN: cada letra del nombre es una pieza (aminoácido) y cada pieza se escribe con un codón.
// Las proteínas usan 20 letras: A C D E F G H I K L M N P Q R S T V W Y.
// La U y la O existen en pocos seres vivos (selenocisteína y pirrolisina) y se escriben con un STOP «disfrazado».
// B, J, X y Z no son ninguna pieza: se saltean.
(function (root) {
  'use strict';
  const G = root.Genetics || require('./genetica.js');
  // Para cada pieza, el codón que más usan los genes humanos.
  const CODON = {
    A: 'GCC',
    R: 'AGA',
    N: 'AAC',
    D: 'GAC',
    C: 'TGC',
    Q: 'CAG',
    E: 'GAG',
    G: 'GGC',
    H: 'CAC',
    I: 'ATC',
    L: 'CTG',
    K: 'AAG',
    M: 'ATG',
    F: 'TTC',
    P: 'CCC',
    S: 'AGC',
    T: 'ACC',
    W: 'TGG',
    Y: 'TAC',
    V: 'GTG',
  };
  const SPECIAL = {
    U: { codon: 'TGA', name: 'selenocisteína', short: 'Sec' },
    O: { codon: 'TAG', name: 'pirrolisina', short: 'Pyl' },
  };
  const MAX = 24;
  // Cuántos codones distintos escriben cada pieza (sale de la tabla del código genético).
  const synonyms = aa => Object.values(G.table).filter(x => x === aa).length;

  // Pasa un nombre a ADN: ATG (inicio) + un codón por letra + TAA (fin).
  function encodeName(text) {
    const clean = String(text)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/[^A-Z ]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX);
    const letters = [...clean].map(char => {
      if (char === ' ') return { char, kind: 'space' };
      if (CODON[char])
        return { char, kind: 'aa', codon: CODON[char], name: G.names[char], ways: synonyms(char) };
      if (SPECIAL[char]) return { char, kind: 'special', ...SPECIAL[char], ways: 1 };
      return { char, kind: 'missing' };
    });
    const coding = letters.filter(l => l.codon);
    const dna = 'ATG' + coding.map(l => l.codon).join('') + 'TAA';
    // Posiciones (en codones) de las letras especiales: la célula las reconoce por el contexto.
    const specials = {};
    coding.forEach((l, i) => l.kind === 'special' && (specials[i + 1] = l.char));
    const ways = coding.reduce((n, l) => n * l.ways, 1);
    return {
      text: clean,
      letters,
      dna,
      protein: 'M' + coding.map(l => l.char).join(''),
      specials,
      ways,
      missing: letters.filter(l => l.kind === 'missing').map(l => l.char),
    };
  }
  // Lee un ADN de nombre de a tres letras hasta el STOP. Las letras especiales se leen solo si siguen en su lugar.
  function readName(dna, specials = {}) {
    let protein = '',
      stopped = false;
    for (let i = 0, n = 0; i + 2 < dna.length; i += 3, n++) {
      const codon = dna.slice(i, i + 3),
        aa = G.table[codon];
      if (specials[n] && SPECIAL[specials[n]].codon === codon) {
        protein += specials[n];
        continue;
      }
      if (aa === '*') {
        stopped = true;
        break;
      }
      protein += aa;
    }
    return { protein, stopped, startLost: dna.slice(0, 3) !== 'ATG' };
  }
  // Cambia una letra del ADN del nombre y devuelve cómo queda el nombre.
  function mutateName(encoded, position, base) {
    const dna = encoded.dna.slice(0, position) + base + encoded.dna.slice(position + 1),
      read = readName(dna, encoded.specials),
      name = read.startLost ? '' : read.protein.slice(1),
      original = encoded.protein.slice(1);
    const effect = read.startLost
      ? 'start-loss'
      : !read.stopped
        ? 'stop-loss'
        : name === original
          ? 'synonymous'
          : name.length < original.length
            ? 'nonsense'
            : 'missense';
    return { dna, name, effect, position, base };
  }
  // Un cambio al azar dentro de las letras del nombre (sin tocar el ATG ni el STOP).
  function randomNameMutation(encoded, rand = Math.random) {
    const last = encoded.dna.length - 3;
    if (last <= 3) return null;
    const position = 3 + Math.floor(rand() * (last - 3)),
      options = [...'ATCG'].filter(b => b !== encoded.dna[position]),
      base = options[Math.floor(rand() * options.length)];
    return mutateName(encoded, position, base);
  }
  const api = { CODON, SPECIAL, MAX, encodeName, readName, mutateName, randomNameMutation };
  if (typeof module !== 'undefined') module.exports = api;
  root.NameGene = api;
})(globalThis);
