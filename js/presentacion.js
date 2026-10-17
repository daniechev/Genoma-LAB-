// Presentación para el jurado: diapositivas 16:9 que se adaptan a cualquier pantalla.
// Con la tecla P se abre la vista del presentador (notas, cronómetro y la diapositiva siguiente)
// en otra ventana; las dos ventanas avanzan juntas. Funciona con flechas y con controles remotos (AvPág/RePág).
(() => {
  'use strict';
  const $ = id => document.getElementById(id),
    slides = [...document.querySelectorAll('.slide')],
    stage = $('stage'),
    viewport = $('viewport'),
    presenter = new URLSearchParams(location.search).has('presentador');
  // El mapa de calor y el experimento evolutivo se reusan tal cual; su botón «probala» abre el simulador.
  window.GenomaLab = { tryMutation: () => window.open('index.html', '_blank'), notify() {} };
  let index = 0,
    other = presenter ? window.opener : null,
    started = Date.now();
  const channel =
    'BroadcastChannel' in window ? new BroadcastChannel('genomalab-presentacion') : null;

  // La diapositiva mide siempre 1600 × 900 y se escala para entrar en la pantalla.
  function fit() {
    const k = Math.min(viewport.clientWidth / 1600, viewport.clientHeight / 900);
    stage.style.transform = `translate(-50%, -50%) scale(${k})`;
  }
  new ResizeObserver(fit).observe(viewport);

  function go(n, { send = true } = {}) {
    index = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, k) => {
      s.classList.toggle('active', k === index);
      s.classList.toggle('past', k < index);
      s.setAttribute('aria-hidden', String(k !== index));
      s.inert = k !== index;
    });
    $('deck-progress').style.width = `${((index + 1) / slides.length) * 100}%`;
    history.replaceState(
      null,
      '',
      `${presenter ? '?presentador' : location.pathname.split('/').pop()}#${index + 1}`,
    );
    if (presenter) {
      const next = slides[index + 1];
      $('p-count').textContent = `${index + 1} / ${slides.length}`;
      $('p-next-title').textContent = next ? next.dataset.title : 'Fin de la presentación';
      $('p-notes').textContent = slides[index].querySelector('.notes')?.textContent.trim() || '';
    }
    if (send) {
      channel?.postMessage({ go: index });
      if (other && !other.closed) other.postMessage({ genomalab: 'go', index }, '*');
    }
  }
  // Las dos ventanas se avisan por dos caminos: BroadcastChannel y postMessage (por si uno no está disponible).
  if (channel)
    channel.onmessage = e => Number.isInteger(e.data?.go) && go(e.data.go, { send: false });
  window.addEventListener('message', e => {
    if (e.data?.genomalab !== 'go' || !Number.isInteger(e.data.index)) return;
    if (e.source !== other && e.source !== window.opener) return;
    go(e.data.index, { send: false });
  });
  function openPresenter() {
    other = window.open(
      'presentacion.html?presentador',
      'genomalab-presentador',
      'width=1280,height=800',
    );
    setTimeout(() => go(index), 800);
  }
  function blackout() {
    $('blackout').hidden = !$('blackout').hidden;
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {}
  }
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input,textarea')) return;
    const k = e.key;
    if (['ArrowRight', 'PageDown', ' ', 'Enter', 'ArrowDown'].includes(k)) {
      if (k === 'Enter' && e.target.closest('a,button')) return;
      e.preventDefault();
      go(index + 1);
    } else if (['ArrowLeft', 'PageUp', 'Backspace', 'ArrowUp'].includes(k)) {
      e.preventDefault();
      go(index - 1);
    } else if (k === 'Home') go(0);
    else if (k === 'End') go(slides.length - 1);
    else if (k.toLowerCase() === 'p' && !presenter) openPresenter();
    else if (k.toLowerCase() === 'f') fullscreen();
    else if (k.toLowerCase() === 'b' || k === '.') blackout();
  });
  // En pantallas táctiles: deslizar hacia un costado cambia de diapositiva.
  let touchX = null;
  viewport.addEventListener('pointerdown', e => e.pointerType === 'touch' && (touchX = e.clientX));
  viewport.addEventListener('pointerup', e => {
    if (touchX === null) return;
    const dx = e.clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1));
  });

  // Resultado 1: las 1.332 sustituciones, calculadas con el mismo motor del simulador.
  const counts = Genetics.substitutionSurvey(),
    total = Object.values(counts).reduce((a, b) => a + b, 0),
    rows = [
      ['missense', 'Cambia una pieza', 'pieza'],
      ['synonymous', 'No cambia nada', 'nada'],
      ['nonsense', 'Se corta (STOP)', 'corte'],
      ['start-loss', 'No arranca', 'corte'],
      ['stop-loss', 'No termina', 'desorden'],
    ];
  $('slide-survey').innerHTML = rows
    .map(
      ([key, label, cat]) =>
        `<div class="survey-row"><div class="survey-label"><span>${label}</span><b>${counts[key].toLocaleString('es-AR')} · ${((counts[key] / total) * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %</b></div><div class="bar-track"><i class="${cat}" style="width:${Math.max(0.6, (counts[key] / total) * 100)}%"></i></div></div>`,
    )
    .join('');

  if (presenter) {
    document.body.classList.add('presenter');
    $('presenter-bar').hidden = false;
    $('presenter-side').hidden = false;
    $('deck-help').hidden = true;
    const tick = () => {
      const s = Math.floor((Date.now() - started) / 1000);
      $('p-elapsed').textContent =
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      $('p-clock').textContent = new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };
    setInterval(tick, 1000);
    tick();
    $('p-reset').onclick = () => {
      started = Date.now();
      tick();
    };
    $('p-prev').onclick = () => go(index - 1);
    $('p-next').onclick = () => go(index + 1);
  } else setTimeout(() => ($('deck-help').hidden = true), 6000);
  go(Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1), { send: false });
  fit();
})();
