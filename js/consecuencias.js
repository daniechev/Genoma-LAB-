// «Lo que pasa después»: una sola vista por vez (la fábrica o la sangre), como pestañas.
// Con un cambio nuevo vuelve a la fábrica; a la sangre se pasa solo tocando.
(() => {
  'use strict';
  const tabs = [...document.querySelectorAll('.cons-tab')];
  if (!tabs.length) return;
  const panels = [...document.querySelectorAll('.cons-card[data-view]')],
    VIEWS = tabs.map(t => t.dataset.view);
  let view = 'factory';

  function show(name, { focus = false } = {}) {
    view = name;
    tabs.forEach(t => {
      const on = t.dataset.view === name;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach(p => (p.hidden = p.dataset.view !== name));
  }
  tabs.forEach(t => {
    t.onclick = () => show(t.dataset.view);
    t.onkeydown = e => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      show(VIEWS[(VIEWS.indexOf(view) + step + VIEWS.length) % VIEWS.length], { focus: true });
    };
  });
  document.addEventListener('genoma:resultado', () => show('factory'));
  show('factory');
})();
