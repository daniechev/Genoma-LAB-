(function (root) {
  'use strict';
  const DNA = `ATG GTG CAT CTG ACT CCT GAG GAG AAG TCT GCC GTT ACT GCC CTG TGG GGC AAG GTG AAC
GTG GAT GAA GTT GGT GGT GAG GCC CTG GGC AGG CTG CTG GTG GTC TAC CCT TGG ACC CAG
AGG TTC TTT GAG TCC TTT GGG GAT CTG TCC ACT CCT GAT GCT GTT ATG GGC AAC CCT AAG
GTG AAG GCT CAT GGC AAG AAA GTG CTC GGT GCC TTT AGT GAT GGC CTG GCT CAC CTG GAC
AAC CTC AAG GGC ACC TTT GCC ACA CTG AGT GAG CTG CAC TGT GAC AAG CTG CAC GTG GAT
CCT GAG AAC TTC AGG CTC CTG GGC AAC GTG CTG GTC TGT GTG CTG GCC CAT CAC TTT GGC
AAA GAA TTC ACC CCA CCA GTG CAG GCT GCC TAT CAG AAA GTG GTG GCT GGT GTG GCT AAT
GCC CTG GCC CAC AAG TAT CAC TAA`.replace(/\s/g, '');
  const EXPECTED = 'MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH';
  const table = {};
  const bases = 'TCAG', codes = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
  let k = 0;
  for (const a of bases) for (const b of bases) for (const c of bases) table[a+b+c] = codes[k++];
  const names = {A:'Ala',R:'Arg',N:'Asn',D:'Asp',C:'Cys',E:'Glu',Q:'Gln',G:'Gly',H:'His',I:'Ile',L:'Leu',K:'Lys',M:'Met',F:'Phe',P:'Pro',S:'Ser',T:'Thr',W:'Trp',Y:'Tyr',V:'Val','*':'STOP'};
  function translate(dna) {
    let protein = '', stop = -1;
    for (let i=0; i+2<dna.length; i+=3) {
      const aa = table[dna.slice(i,i+3)];
      if (!aa) throw new Error('La secuencia contiene letras no válidas.');
      if (aa === '*') { stop=i/3; break; }
      protein += aa;
    }
    return {protein,stop};
  }
  // Casos reales del gen HBB. position es el índice (desde 0) de la letra que cambia.
  const CASES = [
    {id:'sickle', name:'Anemia falciforme', notation:'Glu6Val', position:19, base:'T'},
    {id:'hbc', name:'Hemoglobina C', notation:'Glu6Lys', position:18, base:'A'},
    {id:'thal', name:'Beta-talasemia', notation:'Gln39Stop', position:117, base:'T'}
  ];
  function findCase(position,type,base) {
    return type==='sub' ? CASES.find(c=>c.position===position&&c.base===base)||null : null;
  }
  function simulate({position,type,base}) {
    if (!Number.isInteger(position)||position<0||position>=DNA.length) throw new Error('Elige una letra entre 1 y 444.');
    if (!['sub','del','ins'].includes(type)) throw new Error('Tipo de mutación no válido.');
    if (type!=='del' && !/^[ATCG]$/.test(base)) throw new Error('Elige A, T, C o G.');
    if (type==='sub' && base===DNA[position]) throw new Error('Elige una letra diferente para crear una mutación.');
    const changeIndex=position+(type==='ins'?1:0);
    const mutated = type==='sub' ? DNA.slice(0,position)+base+DNA.slice(position+1) : type==='del' ? DNA.slice(0,position)+DNA.slice(position+1) : DNA.slice(0,position+1)+base+DNA.slice(position+1);
    const startLost = mutated.slice(0,3)!=='ATG';
    const tr=translate(mutated), protein=startLost?'':tr.protein;
    const mature=protein.slice(1), original=EXPECTED.slice(1);
    const codon=Math.floor(changeIndex/3);
    let category, effect;
    // Mechanism takes precedence for single-base indels, even at initiation/termination.
    if(type!=='sub') { category='desorden'; effect='frameshift'; }
    else if(startLost) { category='corte'; effect='start-loss'; }
    else if(tr.stop===-1) {category='desorden';effect='stop-loss';}
    else if(protein.length<EXPECTED.length) {category='corte';effect='nonsense';}
    else if(protein===EXPECTED) {category='nada';effect='synonymous';}
    else {category='pieza';effect='missense';}
    const differences=[];
    for(let i=0;i<Math.min(mature.length,original.length);i++) if(mature[i]!==original[i]) differences.push(i+1);
    return {position,type,base,changeIndex,mutated,category,effect,startLost,protein,mature,stop:tr.stop,codon,piece:codon,originalCodon:DNA.slice(codon*3,codon*3+3),mutatedCodon:mutated.slice(codon*3,codon*3+3),differences,realCase:findCase(position,type,base),lengthUnknown:!startLost&&tr.stop===-1};
  }
  function parsePDB(text, alphaFold=false) {
    const chains={},hemes=[], seen=new Set();
    for(const line of text.split(/\r?\n/)) {
      const kind=line.slice(0,6).trim(), atom=line.slice(12,16).trim(),alt=line[16];
      if(alt && alt!==' ' && alt!=='A') continue;
      if(!((kind==='ATOM'&&atom==='CA')||(kind==='HETATM'&&atom==='FE')))continue;
      const chain=line[21],res=Number(line.slice(22,26));
      const key=chain+':'+res+':'+atom;
      if(seen.has(key))continue;seen.add(key);
      const p=[Number(line.slice(30,38)),Number(line.slice(38,46)),Number(line.slice(46,54)),res,Number(line.slice(60,66))];
      if(!p.every(Number.isFinite)) throw new Error('Coordenadas inválidas en el modelo.');
      if(atom==='FE')hemes.push(p);else (chains[chain]||=([])).push({...Object.fromEntries(['x','y','z','res','confidence'].map((n,i)=>[n,p[i]])),aa:line.slice(17,20).trim()});
    }
    const candidate=Object.keys(chains).find(c=>chains[c].length===147&&chains[c][0].aa==='MET')||Object.keys(chains).find(c=>chains[c].length===146);
    const beta=alphaFold?candidate:'B';
    if(!beta||!chains[beta])throw new Error('No se encontró la cadena beta completa de 146 o 147 aminoácidos.');
    if(alphaFold) {
      const inverse=Object.fromEntries(Object.entries(names).map(([a,n])=>[n.toUpperCase(),a]));
      const seq=chains[beta].map(p=>inverse[p.aa]||'?').join('');
      if(seq!==EXPECTED && seq!==EXPECTED.slice(1))throw new Error('Este archivo no corresponde a la hemoglobina beta humana P68871.');
      for(const c of Object.keys(chains))if(c!==beta)delete chains[c];
    }
    for(const [id,pts] of Object.entries(chains)) {
      const shift=pts[0].aa==='MET'&&pts.length===147?1:0;
      chains[id]=pts.filter((p,i)=>i>=shift).map((p,i)=>({...p,res:i+1}));
    }
    return {chains,hemes:alphaFold?[]:hemes,beta};
  }
  const api={DNA,EXPECTED,table,names,CASES,translate,simulate,parsePDB};
  if(typeof module!=='undefined')module.exports=api;
  root.Genetics=api;
})(globalThis);
