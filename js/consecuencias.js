// «Lo que pasa después»: una sola vista por vez (fábrica, sangre o sonido), como pestañas.
// Con un cambio nuevo arranca en la fábrica y, cuando termina de fabricar, pasa sola a la sangre.
(() => {
  'use strict';
  const tabs = [...document.querySelectorAll('.cons-tab')];
  if (!tabs.length) return;
  const panels = [...document.querySelectorAll('.cons-card[data-view]')],
    next = document.getElementById('cons-next'),
    VIEWS = tabs.map(t => t.dataset.view),
    LABEL = { factory: 'la fábrica', blood: 'en la sangre', melody: 'cómo suena' };
  let view = 'factory',
    auto = false,
    timer = null;

  function show(name, { focus = false } = {}) {
    view = name;
    clearTimeout(timer);
    tabs.forEach(t => {
      const on = t.dataset.view === name;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach(p => (p.hidden = p.dataset.view !== name));
    const i = VIEWS.indexOf(name),
      after = VIEWS[i + 1];
    next.innerHTML = after
      ? `Siguiente: ${LABEL[after]} <span aria-hidden="true">→</span>`
      : 'Volver a la fábrica <span aria-hidden="true">↺</span>';
  }
  tabs.forEach(t => {
    t.onclick = () => {
      auto = false;
      show(t.dataset.view);
    };
    t.onkeydown = e => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      auto = false;
      show(VIEWS[(VIEWS.indexOf(view) + step + VIEWS.length) % VIEWS.length], { focus: true });
    };
  });
  next.onclick = () => {
    auto = false;
    show(VIEWS[(VIEWS.indexOf(view) + 1) % VIEWS.length]);
  };
  document.addEventListener('genoma:resultado', () => {
    show('factory');
    auto = true;
  });
  document.addEventListener('genoma:fabrica-fin', () => {
    if (!auto || view !== 'factory' || !GenomaLab.result) return;
    auto = false;
    timer = setTimeout(() => show('blood'), 1800);
  });
  show('factory');
})();
