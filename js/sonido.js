// Sonido: efectos suaves de la interfaz.
// Todo se genera en el momento con Web Audio: no hay archivos de sonido.
(function (root) {
  'use strict';
  const api = { enabled: true, ui: () => {} };
  if (typeof module !== 'undefined') module.exports = api;
  root.Sound = api;
  if (typeof document === 'undefined') return;

  const key = 'genomalab-sonido';
  try {
    api.enabled = localStorage.getItem(key) !== '0';
  } catch {}
  let ctx = null,
    master = null,
    lastGesture = -1e9;
  // El navegador solo deja sonar después de que alguien toca la pantalla.
  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 5200;
      master.connect(filter).connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  for (const type of ['pointerdown', 'keydown'])
    document.addEventListener(
      type,
      () => {
        lastGesture = performance.now();
        if (api.enabled) audio();
      },
      { capture: true, passive: true },
    );
  // Una nota con ataque y caída suaves.
  function tone(f, start, dur, { type = 'triangle', gain = 0.12, glide = 0 } = {}) {
    const osc = ctx.createOscillator(),
      env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, start);
    if (glide) osc.frequency.exponentialRampToValueAtTime(f * glide, start + dur);
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(env).connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }
  // Efectos de la interfaz. Solo suenan justo después de un toque, para que el modo stand no haga ruido solo.
  const EFFECTS = {
    tap: t => tone(1320, t, 0.05, { type: 'sine', gain: 0.035 }),
    reveal: t => {
      tone(523, t, 0.16, { gain: 0.08 });
      tone(784, t + 0.08, 0.22, { gain: 0.08 });
    },
    hit: t => [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.07, 0.3, { gain: 0.07 })),
    miss: t => {
      tone(392, t, 0.2, { gain: 0.07 });
      tone(370, t + 0.14, 0.3, { gain: 0.07 });
    },
    stop: t => tone(440, t, 0.5, { type: 'sawtooth', gain: 0.04, glide: 0.25 }),
    swoosh: t => tone(220, t, 0.35, { type: 'sine', gain: 0.03, glide: 3 }),
  };
  api.ui = (kind, { force = false } = {}) => {
    if (!api.enabled || !EFFECTS[kind]) return;
    if (!force && performance.now() - lastGesture > 1500) return;
    if (!audio()) return;
    EFFECTS[kind](ctx.currentTime + 0.01);
  };
  api.setEnabled = on => {
    api.enabled = on;
    try {
      localStorage.setItem(key, on ? '1' : '0');
    } catch {}
    paintToggle();
    document.dispatchEvent(new CustomEvent('genoma:sonido', { detail: on }));
  };
  // Botón de la barra superior para prender o apagar el sonido.
  const toggle = document.getElementById('sound-toggle');
  function paintToggle() {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(api.enabled));
    toggle.setAttribute('aria-label', api.enabled ? 'Apagar el sonido' : 'Prender el sonido');
    toggle.title = api.enabled ? 'Sonido prendido' : 'Sonido apagado';
    toggle.classList.toggle('off', !api.enabled);
  }
  if (toggle) {
    toggle.onclick = () => {
      api.setEnabled(!api.enabled);
      api.ui('tap');
    };
    paintToggle();
  }
  // Cada resultado del simulador tiene su sonido: acierto, error, STOP o un «¡pum!» de descubrimiento.
  document.addEventListener('genoma:resultado', e => {
    const { result, hit } = e.detail;
    api.ui(
      hit === true
        ? 'hit'
        : hit === false
          ? 'miss'
          : ['nonsense', 'start-loss'].includes(result.effect)
            ? 'stop'
            : 'reveal',
    );
  });
})(globalThis);
