(() => {
  'use strict';
  const G=Genetics,$=id=>document.getElementById(id),all=selector=>[...document.querySelectorAll(selector)];
  const caseInfo={
    sickle:{goal:'Ve al <b>codón 7: GAG</b>. Cambia su letra del medio para que la pieza 6 deje de ser glutamato (Glu) y pase a ser valina (Val).',display:'G <span>?</span> G',hint:'Pista: la nueva letra también aparece en el codón GTG.',toast:'Codón 7 seleccionado: cambia la A del medio por T y haz tu predicción.',note:'<b>Encontraste el caso de la anemia falciforme: Glu6Val.</b> Cambiaste la letra 20, A por T. La hemoglobina alterada puede formar fibras cuando hay poco oxígeno y deformar los glóbulos rojos. El visor marca la pieza 6 en la estructura normal.'},
    hbc:{goal:'Ve al <b>codón 7: GAG</b>, el mismo de la anemia falciforme. Cambia su <b>primera</b> letra para que la pieza 6 pase de glutamato (Glu) a lisina (Lys).',display:'<span>?</span> A G',hint:'Pista: la lisina se escribe con los codones AAA o AAG.',toast:'Codón 7 seleccionado: cambia la G del principio por A y haz tu predicción.',note:'<b>Encontraste la hemoglobina C: Glu6Lys.</b> Cambiaste la letra 19, G por A. Es el mismo lugar que la anemia falciforme, pero con otra letra, y el resultado es distinto: esta hemoglobina tiende a formar cristales dentro del glóbulo rojo y suele causar una anemia más leve. El visor marca la pieza 6 en la estructura normal.'},
    thal:{goal:'Ve al <b>codón 40: CAG</b>, que fabrica la pieza 39, glutamina (Gln). Cambia su <b>primera</b> letra para convertirlo en una señal de STOP.',display:'<span>?</span> A G',hint:'Pista: las señales de STOP son TAA, TAG y TGA.',toast:'Codón 40 seleccionado: cambia la C del principio por T y haz tu predicción.',note:'<b>Encontraste un caso de beta-talasemia: Gln39Stop.</b> Cambiaste la letra 118, C por T, y el codón CAG se volvió TAG, una señal de STOP. La lectura se corta y la cadena beta queda con solo 38 de sus 146 piezas. Sin suficiente cadena beta, el cuerpo fabrica menos hemoglobina.'}
  };
  const titles={nada:'No cambió ninguna pieza',pieza:'Cambió una pieza',corte:'La proteína se cortó',desorden:'Se alteró la lectura o el final'};
  const effects={'synonymous':'Mutación silenciosa',missense:'Cambio de aminoácido',nonsense:'STOP prematuro','start-loss':'Pérdida del inicio','stop-loss':'Pérdida del STOP',frameshift:'Cambio del marco de lectura'};
  const baseNames={A:'adenina',T:'timina',C:'citosina',G:'guanina'};
  const idle='La hemoglobina ayuda a llevar oxígeno por tu cuerpo.';
  const empty=()=>({nada:0,pieza:0,corte:0,desorden:0,ok:0,n:0});
  let stats=empty(),persistent=true,position=19,type='sub',base=null,offset=0,perView=4,current=null,revealed=false,toastTimer,resetTimer,resetArmed=false;
  const counterKey='genomalab-app-contador';
  function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5500);}
  function save(){try{localStorage.setItem(counterKey,JSON.stringify(stats));}catch{persistent=false;notify('El navegador no permite guardar. Los resultados duran hasta cerrar esta página; puedes descargarlos.');}renderStats();}
  try{const stored=JSON.parse(localStorage.getItem(counterKey)||'null');if(stored&&Object.keys(empty()).every(k=>Number.isSafeInteger(stored[k])&&stored[k]>=0)&&stored.ok<=stored.n&&stored.n<=stored.nada+stored.pieza+stored.corte+stored.desorden)stats=Object.fromEntries(Object.keys(empty()).map(k=>[k,stored[k]]));}catch{persistent=false;}
  const bundledAF=JSON.parse(JSON.stringify(MODELS.af));
  const viewer=new ProteinViewer($('protein'),MODELS);
  function restoreCustom(){try{const text=localStorage.getItem('adn-hbb-custom-pdb');if(text){MODELS.af=G.parsePDB(text,true);$('import-status').textContent='Se restauró tu modelo P68871 guardado en este navegador.';}}catch{$('import-status').textContent='No se pudo restaurar el archivo guardado; se usará el modelo incluido.';}}restoreCustom();
  viewer.onRotation=()=>{$('rotate').textContent=viewer.rotating?'Ⅱ Pausar giro':'▷ Girar';$('rotate').setAttribute('aria-pressed',String(viewer.rotating));};viewer.onRotation();
  const piezas=n=>n===1?'1 pieza':`${n} piezas`;
  const aaName=codon=>G.names[G.table[codon]];
  function tile(b,tag='span',extra=''){const el=document.createElement(tag);el.className=`base ${b.toLowerCase()}${extra}`;el.textContent=b;return el;}

  // One step per screen: only the current panel is shown and the step bar stays in view.
  function goStep(n,focus=true){
    all('[data-step]').forEach(el=>{const s=Number(el.dataset.step);el.classList.toggle('current',s===n);el.classList.toggle('done',s<n);if(s===n)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    all('[data-panel]').forEach(p=>p.hidden=Number(p.dataset.panel)!==n);$('restart').hidden=n===1;$('tab-lab').dataset.at=n;
    if(n===1)renderGene();if(n===2)renderControls();
    if(!focus)return;
    const bar=$('experiment').getBoundingClientRect(),top=document.querySelector('.stage').getBoundingClientRect().top;
    if(top<bar.bottom)window.scrollBy({top:top-bar.bottom-14,behavior:'instant'});
    document.querySelector(`[data-panel="${n}"] h2`)?.focus({preventScroll:true});
  }
  function clearResult(){current=null;revealed=false;viewer.result=null;viewer.focus=null;$('focus-mutation').hidden=true;$('science-note').hidden=true;$('viewer-overlay').textContent=idle;}

  function measure(){const strip=$('codons'),width=strip.clientWidth;if(!width)return false;const css=getComputedStyle(strip),size=parseFloat(css.getPropertyValue('--tile'))||36,gap=parseFloat(css.columnGap)||14;const n=Math.max(2,Math.min(12,Math.floor((width+gap)/(3*size+6+gap))));const changed=n!==perView;perView=n;return changed;}
  function renderGene(){
    measure();const max=148-perView;offset=Math.max(0,Math.min(max,offset));
    $('codons').replaceChildren();$('gene-range').max=max;$('gene-range').value=offset;$('region-label').textContent=`Grupos ${offset+1}–${offset+perView} de 148`;
    for(let codon=offset;codon<offset+perView;codon++){
      const el=document.createElement('div');el.className='codon'+(Math.floor(position/3)===codon?' active':'');
      const number=document.createElement('div');number.className='codon-number';number.textContent=codon+1;el.append(number);
      const group=document.createElement('div');group.className='codon-bases';
      for(let j=0;j<3;j++){const p=codon*3+j,b=G.DNA[p],button=tile(b,'button',position===p?' selected':'');button.dataset.pos=p;button.setAttribute('aria-label',`Letra ${p+1}: ${b} (${baseNames[b]}), grupo ${codon+1}`);button.setAttribute('aria-pressed',String(position===p));button.addEventListener('click',()=>{select(p);$('codons').querySelector(`[data-pos="${p}"]`)?.focus({preventScroll:true});});group.append(button);}el.append(group);
      const aa=document.createElement('div');aa.className='codon-aa';aa.textContent=aaName(G.DNA.slice(codon*3,codon*3+3));el.append(aa);$('codons').append(el);
    }
    $('previous').disabled=offset===0;$('next').disabled=offset===max;
    $('selection').replaceChildren('Elegiste la letra',tile(G.DNA[position]),`número ${position+1} de 444`);
  }
  function centerOn(p){offset=Math.floor(p/3)-Math.floor(perView/2);}
  function renderControls(){
    const b=G.DNA[position];
    $('picked-base').className=`base big ${b.toLowerCase()}`;$('picked-base').textContent=b;$('picked-text').textContent=`Letra ${position+1} de 444, en el grupo ${Math.floor(position/3)+1}.`;
    all('[data-type]').forEach(button=>{button.classList.toggle('active',button.dataset.type===type);button.setAttribute('aria-pressed',String(button.dataset.type===type));});
    $('mutation-help').textContent=type==='del'?`Se quitará la ${b} de la posición ${position+1}.`:type==='ins'?`Elige la letra que se agrega después de la posición ${position+1}:`:'Elige la letra nueva:';
    $('base-choices').replaceChildren();$('base-choices').hidden=type==='del';
    if(type==='sub'&&base===b)base=null;
    for(const option of 'ATCG'){const button=tile(option,'button',base===option?' active':'');button.disabled=type==='sub'&&option===b;button.setAttribute('aria-label',`Usar ${option} (${baseNames[option]})`);button.setAttribute('aria-pressed',String(base===option));button.onclick=()=>{base=option;renderControls();$('base-choices').querySelector('.active')?.focus({preventScroll:true});};$('base-choices').append(button);}
    $('mutate').disabled=type!=='del'&&!base;
  }
  function select(p){position=p;renderGene();}
  function stageMutation(input){const result=G.simulate(input);clearResult();position=input.position;type=input.type;base=input.type==='del'?null:input.base;current=result;centerOn(position);renderComparison();goStep(3);return result;}
  function mutate(){try{stageMutation({position,type,base:base||'A'});}catch(e){notify(e.message);}}
  function renderComparison(){
    const r=current,first=Math.max(0,r.codon-1),letter=G.DNA[r.position];
    $('mutation-summary').textContent=r.type==='sub'?`Cambiaste la letra ${r.position+1}: ${letter} → ${r.base}.`:r.type==='del'?`Quitaste la letra ${r.position+1} (${letter}).`:`Agregaste una ${r.base} después de la letra ${r.position+1}.`;
    $('dna-comparison').replaceChildren();
    for(const [label,seq,marked,mark]of [['Antes',G.DNA,r.type==='ins'?-1:r.position,r.type==='del'?' removed':' changed'],['Después',r.mutated,r.type==='del'?-1:r.changeIndex,' changed']]){
      const row=document.createElement('div'),name=document.createElement('b');row.className='cmp-row';name.textContent=label;row.append(name);
      for(let codon=first;codon<first+4;codon++){const group=document.createElement('span');group.className='cmp-group';for(let i=codon*3;i<Math.min(seq.length,codon*3+3);i++)group.append(tile(seq[i],'span',' small'+(i===marked?mark:'')));if(group.children.length)row.append(group);}
      $('dna-comparison').append(row);
    }
  }
  function explanation(r){
    if(r.effect==='start-loss')return 'El inicio ATG dejó de existir. En este modelo, la célula ya no encuentra la señal para empezar y no fabrica la cadena por esa vía.';
    if(r.effect==='stop-loss')return 'Se perdió la señal STOP del final. El marco de lectura no cambió, pero la fabricación podría continuar. No conocemos la longitud final porque aquí no está incluida la secuencia posterior al gen.';
    if(r.effect==='synonymous')return `El codón ${r.originalCodon} pasó a ${r.mutatedCodon}, pero ambos indican ${aaName(r.originalCodon)}. La secuencia de aminoácidos quedó igual; esto no evalúa otros posibles efectos celulares.`;
    if(r.effect==='missense')return `El codón ${r.codon+1} pasó de ${r.originalCodon} a ${r.mutatedCodon}. En la pieza ${r.piece}, ${aaName(r.originalCodon)} fue reemplazado por ${aaName(r.mutatedCodon)}. Cambiar una pieza no permite saber por sí solo cuánto cambia la función.`;
    if(r.effect==='nonsense')return `Apareció una señal STOP en el codón ${r.stop+1}. La traducción se detiene antes de tiempo y la cadena queda con ${r.mature.length} piezas después de retirar la metionina inicial en este modelo.`;
    return `Al ${r.type==='del'?'quitar':'agregar'} una letra, los grupos de tres se desplazan desde el codón ${r.codon+1}. Se altera cómo se lee lo que sigue.${r.startLost?' Además se perdió ATG: en este modelo no se fabrica la cadena por esa vía.':r.lengthUnknown?' No aparece un STOP en la secuencia disponible, así que no conocemos la longitud final.':` El primer STOP aparece en el codón ${r.stop+1}.`}${r.codon>=147?' El cambio ocurre en el extremo final; el modelo puede no mostrar diferencias en las piezas ya fabricadas.':''}`;
  }
  // Plain-language summary shown first; the full explanation stays under «Ver detalles».
  function lead(r){
    if(r.effect==='start-loss')return 'Se perdió la señal de inicio de la receta. En este modelo, la proteína no se fabrica.';
    if(r.effect==='stop-loss')return 'Se perdió la señal de STOP del final. La fabricación podría continuar y no sabemos dónde termina.';
    if(r.effect==='synonymous')return `Cambiaste una letra, pero el grupo de tres sigue indicando lo mismo (${aaName(r.originalCodon)}). La proteína queda igual.`;
    if(r.effect==='missense')return `La pieza ${r.piece} de la proteína cambió: antes era ${aaName(r.originalCodon)} y ahora es ${aaName(r.mutatedCodon)}. Todas las demás quedaron igual.`;
    if(r.effect==='nonsense')return `Apareció una señal de STOP antes de tiempo. La proteína queda con ${piezas(r.mature.length)} en lugar de 146.`;
    return `Al ${r.type==='del'?'quitar':'agregar'} una letra, los grupos de tres que siguen se corrieron.${r.startLost?' Además se perdió la señal de inicio: en este modelo, la proteína no se fabrica.':r.lengthUnknown?' No aparece una señal de STOP, así que no sabemos dónde termina la proteína.':r.mature.length===146?' La proteína conserva 146 piezas.':` La proteína queda con ${piezas(r.mature.length)} en lugar de 146.`}`;
  }
  function chainBar(r){
    const length=Math.min(146,r.mature.length),first=r.differences[0],pct=n=>`${(n/146*100).toFixed(2)}%`;
    const same=r.effect==='frameshift'&&first?first-1:length,wrong=length-same;
    const pin=['missense','synonymous'].includes(r.effect)&&r.piece>=1&&r.piece<=146?`<i class="pin${r.effect==='missense'?' bad':''}" style="left:${pct(r.piece-.5)}"></i>`:'';
    const count=r.lengthUnknown?`${r.mature.length}+ piezas`:piezas(r.mature.length);
    return `<div class="chain-compare"><div class="chain-row"><span>Proteína normal</span><div class="chain-bar"><i class="ok full" style="width:100%"></i></div><b>146 piezas</b></div><div class="chain-row"><span>Tu proteína</span><div class="chain-bar"><i class="ok${same===146?' full':''}" style="width:${pct(same)}"></i><i class="wrong" style="width:${pct(wrong)}"></i>${pin}</div><b>${count}</b></div><div class="chain-key"><span><i></i>Igual</span>${r.effect==='missense'?'<span><i class="bad"></i>Pieza cambiada</span>':''}${wrong?'<span><i class="wrong"></i>Piezas distintas</span>':''}${length<146?'<span><i class="gone"></i>No se fabrica</span>':''}</div></div>`;
  }
  function reveal(guess=null){if(!current||revealed)return;revealed=true;const r=current;stats[r.category]++;if(guess){stats.n++;if(guess===r.category)stats.ok++;}save();
    const heading=r.effect==='start-loss'?'Falta la señal para empezar':r.effect==='stop-loss'?'Falta la señal para terminar':r.effect==='frameshift'?'Se corrió toda la lectura':titles[r.category];
    const length=r.lengthUnknown?`${r.mature.length}+`:`${r.mature.length}`;
    $('result').innerHTML=`<div class="result-top"><h2 tabindex="-1">${heading}</h2>${guess?`<span class="guess-feedback${guess===r.category?' hit':''}">${guess===r.category?'✓ ¡Acertaste!':'Esta vez no acertaste'}</span>`:''}</div><p class="result-lead">${lead(r)}</p><p class="sci-name">En ciencia se llama: ${effects[r.effect].toLowerCase()}.</p><button class="see-3d" id="see-3d">Ver mi proteína en 3D <span aria-hidden="true">↓</span></button>${chainBar(r)}${r.realCase?`<p class="sickle-note">${caseInfo[r.realCase.id].note}</p>`:''}<details><summary>Ver detalles</summary><p>${explanation(r)}</p><div class="result-metrics"><div><b>146 → ${length}</b>Piezas${r.lengthUnknown?' · final desconocido':''}</div><div><b>${r.differences.length}</b>Piezas distintas entre las comparables</div><div><b>${r.originalCodon||'—'} / ${r.mutatedCodon||'—'}</b>Grupo de tres (codón) original / mutado</div></div><p>Comparación de las cadenas de aminoácidos: una letra por aminoácido. Se omite la metionina inicial. Las piezas cambiadas se resaltan.</p><div class="result-amino">Original<br>${G.EXPECTED.slice(1)}<br><br>Mutada<br>${r.mature?r.mature.split('').map((aa,i)=>G.EXPECTED[i+1]!==aa?`<mark>${aa}</mark>`:aa).join(''):'No se fabrica en este modelo.'}</div></details><div class="step-actions"><span></span><button class="primary" id="again">Probar otra mutación <span aria-hidden="true">↺</span></button></div>`;
    $('again').onclick=restart;$('see-3d').onclick=()=>{if(!$('focus-mutation').hidden)viewer.focusMutation();document.querySelector('.protein-panel').scrollIntoView({block:'center',behavior:viewer.reduced.matches?'instant':'smooth'});};
    viewer.result=r;viewer.focus=null;$('focus-mutation').hidden=r.piece<1||r.piece>146;$('science-note').hidden=false;
    $('viewer-overlay').textContent=r.effect==='stop-loss'?'El cambio está en el STOP, fuera de la cadena dibujada.':r.startLost?'La cadena no se fabrica por esta vía en el modelo.':r.piece>146?'Cambio al final de la secuencia.':r.effect==='missense'?`El punto rojo marca la pieza ${r.piece}, la que cambió.`:r.effect==='synonymous'?`El punto marca la pieza ${r.piece}: quedó igual.`:r.effect==='nonsense'?'La parte apagada ya no se fabrica.':'En naranja, las piezas distintas. La parte apagada ya no se fabrica.';
    goStep(4);
  }
  function restart(){clearResult();type='sub';base=null;viewer.reset();viewer.rotating=!viewer.reduced.matches;viewer.onRotation();goStep(1);window.scrollTo({top:0,behavior:'instant'});}
  function showTab(tab){all('.tab-page').forEach(p=>p.hidden=p.id!==`tab-${tab}`);all('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);if(b.dataset.tab===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});if(tab==='stats')renderStats();if(tab==='lab'){viewer.resize();renderGene();}window.scrollTo({top:0,behavior:'instant'});}
  function renderStats(){const total=stats.nada+stats.pieza+stats.corte+stats.desorden;$('stats-overview').innerHTML=`<div class="stat"><b>${total}</b>Mutaciones descubiertas</div><div class="stat"><b>${stats.n}</b>Predicciones del público</div><div class="stat"><b>${stats.n?Math.round(stats.ok/stats.n*100)+' %':'—'}</b>${stats.n?`${stats.ok} respuestas correctas`:'Todavía sin predicciones'}</div>`;$('stats-bars').innerHTML=Object.entries(titles).map(([key,label])=>`<div class="bar-row"><div><span>${label}</span><b>${stats[key]}</b></div><div class="bar-track"><i style="width:${total?stats[key]/total*100:0}%"></i></div></div>`).join('');$('storage-status').textContent=persistent?'Los datos persisten en este navegador. Descárgalos antes de cambiar de equipo o borrar los datos del navegador.':'Guardado permanente no disponible. Descarga los resultados antes de cerrar.';}
  function setModel(model){viewer.model=model;viewer.reset();all('[data-model]').forEach(b=>{b.classList.toggle('active',b.dataset.model===model);b.setAttribute('aria-pressed',String(b.dataset.model===model));});$('all-chains').disabled=model==='af';$('confidence-label').hidden=model!=='af';$('viewer-badge').textContent=model==='pdb'?'CADENA BETA · PDB 2HHB':'CADENA BETA · ALPHAFOLD P68871';$('model-caption').textContent=model==='pdb'?'Estructura medida por rayos X. Cada tramo conecta las posiciones reales de los aminoácidos.':'Predicción de la cadena beta normal. La confianza de IA describe el modelo, no el efecto de una mutación.';updateLegend();}
  function updateLegend(){const confidence=viewer.model==='af'&&viewer.confidence;$('protein-legend').innerHTML=confidence?'<span class="gradient-line" style="background:linear-gradient(90deg,#388de7 25%,#65cbf3 25%,#65cbf3 50%,#ffdb13 50%,#ffdb13 75%,#ff7d45 75%)"></span><span>pLDDT &gt;90</span><span>70–90</span><span>50–70</span><span>&lt;50</span>':'<span class="gradient-line"></span><span>Inicio de la cadena</span><span>Final</span>';}
  all('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));all('[data-return-lab]').forEach(b=>b.onclick=()=>showTab('lab'));
  document.querySelector('.brand').onclick=e=>{e.preventDefault();showTab('lab');};
  all('[data-type]').forEach(b=>b.onclick=()=>{type=b.dataset.type;renderControls();});all('[data-guess]').forEach(b=>b.onclick=()=>reveal(b.dataset.guess));
  $('previous').onclick=()=>{offset-=Math.max(1,perView-1);renderGene();};$('next').onclick=()=>{offset+=Math.max(1,perView-1);renderGene();};$('gene-range').oninput=e=>{offset=Number(e.target.value);renderGene();};
  $('to-step2').onclick=()=>goStep(2);$('back-1').onclick=()=>goStep(1);$('back-2').onclick=()=>{clearResult();goStep(2);};$('restart').onclick=restart;$('mutate').onclick=mutate;$('skip-guess').onclick=()=>reveal();
  $('random').onclick=()=>{const n=Math.random(),p=Math.floor(Math.random()*G.DNA.length),kind=n<.6?'sub':n<.8?'del':'ins',choices=[...'ATCG'].filter(b=>kind!=='sub'||b!==G.DNA[p]);try{stageMutation({position:p,type:kind,base:choices[Math.floor(Math.random()*choices.length)]});}catch(e){notify(e.message);}};
  // Casos reales: textos de cada misión (los datos científicos están en genetica.js).
  let missionCase='sickle';
  function renderMission(){
    const c=G.CASES.find(x=>x.id===missionCase),info=caseInfo[c.id];
    all('[data-case]').forEach(b=>{const on=b.dataset.case===c.id;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    $('case-detail').innerHTML=`<h3>${c.name}</h3><p>${info.goal}</p><div class="mission-codon">${info.display}</div><p class="muted">${info.hint}</p>`;
    $('start-mission').textContent=`Ir al codón ${Math.floor(c.position/3)+1}`;
  }
  all('[data-case]').forEach(b=>b.onclick=()=>{missionCase=b.dataset.case;renderMission();});
  $('mission').onclick=()=>{renderMission();$('mission-dialog').showModal();};$('close-mission').onclick=()=>$('mission-dialog').close();$('start-mission').onclick=()=>{const c=G.CASES.find(x=>x.id===missionCase);$('mission-dialog').close();showTab('lab');clearResult();type='sub';base=null;position=c.position;centerOn(c.position);goStep(2);notify(caseInfo[c.id].toast);};
  all('[data-model]').forEach(b=>b.onclick=()=>setModel(b.dataset.model));$('all-chains').onchange=e=>{viewer.all=e.target.checked;viewer.focus=null;viewer.zoom=1;};$('confidence').onchange=e=>{viewer.confidence=e.target.checked;updateLegend();};$('rotate').onclick=()=>{viewer.rotating=!viewer.rotating;viewer.onRotation();};$('focus-mutation').onclick=()=>viewer.focusMutation();$('zoom-in').onclick=()=>viewer.zoomBy(1.2);$('zoom-out').onclick=()=>viewer.zoomBy(1/1.2);$('reset-view').onclick=()=>viewer.reset();
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Este navegador no permite activar pantalla completa aquí. Puedes usar F11.');}};
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Salir de pantalla completa':'Activar pantalla completa');});
  $('reset-count').onclick=()=>{if(!resetArmed){resetArmed=true;$('reset-count').textContent='Confirmar: borrar todos los resultados';resetTimer=setTimeout(()=>{resetArmed=false;$('reset-count').textContent='Reiniciar contador';},7000);return;}clearTimeout(resetTimer);resetArmed=false;stats=empty();save();$('reset-count').textContent='Reiniciar contador';notify('Contador reiniciado.');};
  $('export').onclick=()=>{const rows=['Categoría;Cantidad',...Object.entries(titles).map(([key,label])=>`${label};${stats[key]}`),`Predicciones;${stats.n}`,`Aciertos;${stats.ok}`];const url=URL.createObjectURL(new Blob(['﻿'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`resultados-adn-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('pdb-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2e6)throw new Error('El archivo es demasiado grande. Usa el PDB de una sola cadena P68871.');const text=await file.text(),parsed=G.parsePDB(text,true);MODELS.af=parsed;try{localStorage.setItem('adn-hbb-custom-pdb',text);$('import-status').textContent='Modelo verificado y guardado: hemoglobina beta P68871.';}catch{$('import-status').textContent='Modelo verificado. No pudo guardarse y estará disponible solo durante esta sesión.';}setModel('af');notify('Modelo de hemoglobina beta cargado.');}catch(err){$('import-status').textContent=err.message;}e.target.value='';};
  $('restore-model').onclick=()=>{MODELS.af=JSON.parse(JSON.stringify(bundledAF));try{localStorage.removeItem('adn-hbb-custom-pdb');}catch{}setModel('af');$('import-status').textContent='Modelo incluido restaurado: AlphaFold P68871, versión 6.';};
  if(document.modelContext?.registerTool){try{document.modelContext.registerTool({name:'stage_hbb_mutation',title:'Preparar una mutación de HBB',description:'Prepara una mutación en la interfaz, sin revelar ni contabilizar el resultado. La posición es de 1 a 444.',inputSchema:{type:'object',properties:{position:{type:'integer',minimum:1,maximum:444},type:{type:'string',enum:['sub','del','ins']},base:{type:'string',enum:['A','T','C','G']}},required:['position','type'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){const config={position:input.position-1,type:input.type,base:input.base};G.simulate(config);showTab('lab');stageMutation(config);return {position:position+1,type,stage:'prediction'};}});}catch{/* Optional browser API: regular controls remain available. */}}
  new ResizeObserver(()=>{if(measure())renderGene();}).observe($('codons'));
  centerOn(position);renderStats();goStep(1,false);
})();
