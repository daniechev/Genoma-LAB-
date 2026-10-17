// Guía de la primera vez en el simulador: tres globitos que muestran qué tocar.
// 1) una letra del ADN, 2) el cambio (o quitarla), 3) qué le pasó a la proteína.
// Se muestra una sola vez por navegador; en modo stand vuelve con cada visitante nuevo.
(() => {
  'use strict';
  const Lab = window.GenomaLab;
  if (!Lab || !document.getElementById('codons')) return;
  const KEY = 'genomalab-guia',
    DELAY = 600,
    GAP = 14,
    EDGE = 16,
    reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const STEPS = [
    {
      target: 'codons',
      title: 'Tocá una letra del ADN',
      text: 'Elegí la que quieras: A, T, C o G. Cada una es parte de la receta de la hemoglobina.',
    },
    {
      target: 'tool',
      title: 'Cambiala por otra (o quitala)',
      text: 'Un toque y listo: acabás de crear tu propia mutación.',
    },
    {
      target: 'result',
      title: 'Mirá qué le pasó a la proteína',
      text: '¿Se rompió, cambió una pieza o quedó igual? Probá otras letras y compará.',
      guessTitle: 'Adiviná y mirá qué le pasó a la proteína',
      guessText: 'Elegí lo que creés que pasa. Después vas a ver si acertaste.',
    },
  ];

  const seen = () => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  };
  const markSeen = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {}
  };
  const tap = () => window.Sound?.ui?.('tap');
  const blocked = () =>
    document.body.classList.contains('touring') || !!document.querySelector('dialog[open]');

  // ---- Piezas visuales: el foco (no recibe clics) y el globito ----
  const spot = document.createElement('div');
  spot.className = 'guia-foco';
  spot.setAttribute('aria-hidden', 'true');
  spot.hidden = true;
  const bubble = document.createElement('div');
  bubble.className = 'guia-globo';
  bubble.hidden = true;
  bubble.setAttribute('role', 'dialog');
  bubble.setAttribute('aria-modal', 'false');
  bubble.setAttribute('aria-labelledby', 'guia-titulo');
  bubble.setAttribute('aria-describedby', 'guia-texto');
  bubble.innerHTML = `<span class="guia-flecha" aria-hidden="true"></span><div class="guia-cabeza"><span class="guia-paso" id="guia-paso"></span><button type="button" class="text-button guia-saltar" id="guia-saltar">Saltar</button></div><div aria-live="polite"><h2 class="guia-titulo" id="guia-titulo"></h2><p class="guia-texto" id="guia-texto"></p></div><div class="guia-pie"><span class="guia-puntos" aria-hidden="true"><i></i><i></i><i></i></span><button type="button" class="primary guia-listo" id="guia-listo" hidden>¡Entendido!</button></div>`;
  document.body.append(spot, bubble);
  const $ = id => document.getElementById(id),
    arrow = bubble.querySelector('.guia-flecha'),
    dots = [...bubble.querySelectorAll('.guia-puntos i')];

  let step = -1,
    timer = 0,
    frame = 0,
    visitorPending = false,
    last = '';
  const isOpen = () => step >= 0;
  const hasGuess = () => !!$('result')?.querySelector('[data-guess]');

  function renderStep() {
    const s = STEPS[step],
      guess = step === 2 && hasGuess();
    $('guia-paso').textContent = `${step + 1} de ${STEPS.length}`;
    $('guia-titulo').textContent = guess ? s.guessTitle : s.title;
    $('guia-texto').textContent = guess ? s.guessText : s.text;
    $('guia-listo').hidden = step !== 2;
    dots.forEach((d, i) => d.classList.toggle('on', i <= step));
  }

  function goTo(i) {
    step = i;
    renderStep();
    last = '';
    // Reinicia la animación de entrada del globito en cada paso.
    bubble.classList.remove('guia-entra');
    void bubble.offsetWidth;
    bubble.classList.add('guia-entra');
    const target = $(STEPS[step].target);
    if (target) {
      const tall = target.getBoundingClientRect().height > innerHeight * 0.55;
      target.scrollIntoView({
        block: tall ? 'start' : 'center',
        behavior: reduced.matches ? 'instant' : 'smooth',
      });
    }
    // Solo en el último paso se mueve el foco: antes, la persona está tocando letras.
    if (step === 2) $('guia-listo').focus({ preventScroll: true });
    place();
  }

  function open(from = 0) {
    clearTimeout(timer);
    timer = 0;
    if (blocked() || Lab.tab !== 'lab') return;
    const first = !isOpen();
    spot.hidden = bubble.hidden = false;
    if (first) {
      spot.classList.remove('guia-entra');
      void spot.offsetWidth;
      spot.classList.add('guia-entra');
      loop();
    }
    goTo(from);
  }

  // Cierra la guía. «done» la marca como vista (al terminar, saltar o con Esc).
  function close(done = false) {
    clearTimeout(timer);
    timer = 0;
    if (done) markSeen();
    if (!isOpen()) return;
    const hadFocus = bubble.contains(document.activeElement);
    step = -1;
    cancelAnimationFrame(frame);
    spot.hidden = bubble.hidden = true;
    if (hadFocus) $('result')?.querySelector('button, summary')?.focus({ preventScroll: true });
  }

  function next() {
    tap();
    if (step >= STEPS.length - 1) close(true);
    else goTo(step + 1);
  }

  function schedule(from = 0) {
    if (isOpen()) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = 0;
      if (Lab.tab !== 'lab' || blocked()) return;
      visitorPending = false;
      open(from);
    }, DELAY);
  }
  const wanted = () => visitorPending || !seen();

  // ---- Ubicación: sigue al objetivo mientras la guía está abierta ----
  function loop() {
    place();
    frame = requestAnimationFrame(loop);
  }
  function place() {
    if (!isOpen()) return;
    const target = $(STEPS[step].target);
    if (!target) return;
    const vw = document.documentElement.clientWidth,
      vh = document.documentElement.clientHeight,
      r = target.getBoundingClientRect(),
      bw = bubble.offsetWidth,
      bh = bubble.offsetHeight;
    const key = [r.left, r.top, r.width, r.height, vw, vh, bw, bh].map(Math.round).join();
    if (key === last) return;
    last = key;
    // El foco abraza al objetivo, pero nunca se sale de la pantalla.
    const pad = 8,
      left = Math.max(4, r.left - pad),
      top = Math.max(4, r.top - pad),
      right = Math.min(vw - 4, r.right + pad),
      bottom = Math.min(vh - 4, r.bottom + pad);
    Object.assign(spot.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${Math.max(0, right - left)}px`,
      height: `${Math.max(0, bottom - top)}px`,
    });
    // El globito va abajo si entra, si no arriba; si no entra en ningún lado, se apoya abajo de todo.
    let y,
      side = 'abajo';
    if (vh - bottom - GAP - EDGE >= bh) y = bottom + GAP;
    else if (top - GAP - EDGE >= bh) {
      y = top - GAP - bh;
      side = 'arriba';
    } else {
      y = vh - EDGE - bh;
      side = 'adentro';
    }
    const cx = (Math.max(r.left, 0) + Math.min(r.right, vw)) / 2,
      x = Math.min(Math.max(cx - bw / 2, EDGE), Math.max(EDGE, vw - EDGE - bw));
    bubble.style.left = `${x}px`;
    bubble.style.top = `${Math.max(EDGE, y)}px`;
    bubble.dataset.lado = side;
    arrow.style.left = `${Math.min(Math.max(cx - x, 22), bw - 22)}px`;
  }

  // ---- Botones del globito ----
  $('guia-saltar').onclick = () => {
    tap();
    close(true);
  };
  $('guia-listo').onclick = next;

  // ---- Avances: lo que hace la persona en el simulador ----
  // Captura: corre antes de que el simulador vuelva a dibujar la tira de letras.
  document.addEventListener(
    'click',
    e => {
      if (step === 0 && e.target.closest?.('#codons button[data-pos]')) next();
    },
    { capture: true },
  );
  document.addEventListener('genoma:resultado', () => {
    if (step === 1) next();
    else if (step === 2) renderStep();
  });
  // En modo desafío primero aparece la predicción: también cuenta como «ya la cambiaste».
  new MutationObserver(() => {
    if (step === 1 && hasGuess()) next();
  }).observe($('result'), { childList: true });

  // ---- Cuándo aparece ----
  document.addEventListener('genoma:pestaña', e => {
    if (e.detail !== 'lab') close();
    else if (wanted()) schedule();
  });
  // Modo stand: después del reposo llega un visitante nuevo, que vuelve a ver la guía.
  document.addEventListener('genoma:reposo', () => {
    close();
    if (Lab.standMode) visitorPending = true;
  });
  // Si al entrar no se pudo mostrar (recorrido guiado, un diálogo abierto…), aparece con el próximo toque.
  // En captura, porque el simulador vuelve a dibujar la letra tocada y la saca del documento.
  document.addEventListener(
    'click',
    e => {
      if (isOpen() || timer || !wanted() || Lab.tab !== 'lab' || e.target.closest?.('dialog'))
        return;
      // Si el primer toque ya fue una letra, la guía arranca en el paso 2.
      const from = e.target.closest?.('#codons button[data-pos]') ? 1 : 0;
      setTimeout(() => {
        if (!isOpen() && !timer && !blocked()) schedule(from);
      });
    },
    { capture: true },
  );
  // El recorrido guiado automático tiene prioridad: si empieza, la guía se va.
  new MutationObserver(() => {
    if (isOpen() && document.body.classList.contains('touring')) close();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen() && !document.querySelector('dialog[open]')) {
      e.preventDefault();
      close(true);
    }
  });

  Lab.startGuide = () => {
    close();
    if (Lab.tab !== 'lab' || document.body.classList.contains('touring')) {
      Lab.showTab('lab');
      schedule();
    } else open();
  };

  if (Lab.tab === 'lab' && wanted()) schedule();
})();
