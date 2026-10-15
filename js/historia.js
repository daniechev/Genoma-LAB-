// Resultados del póster paso a paso: una idea por pantalla, con preguntas para adivinar antes de ver.
(() => {
  'use strict';
  const story = document.getElementById('story');
  if (!story) return;
  const $ = id => document.getElementById(id),
    steps = [...story.querySelectorAll('.story-step')],
    dots = $('story-dots');
  let index = 0;

  steps.forEach((step, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Paso ${i + 1}: ${step.dataset.title}`);
    b.onclick = () => go(i);
    dots.append(b);
  });
  function go(n, focus = false) {
    const next = Math.max(0, Math.min(steps.length - 1, n));
    const forward = next >= index;
    index = next;
    steps.forEach((s, i) => {
      s.hidden = i !== index;
      s.classList.toggle('from-left', !forward);
    });
    [...dots.children].forEach((d, i) => {
      d.setAttribute('aria-current', String(i === index));
      d.classList.toggle('done', i < index);
    });
    $('story-count').textContent = `${index + 1} de ${steps.length}`;
    $('story-prev').disabled = index === 0;
    $('story-next').hidden = index === steps.length - 1;
    const quiz = steps[index].querySelector('.quiz');
    $('story-next').innerHTML =
      quiz && quiz.querySelector('.quiz-reveal').hidden
        ? 'Ver la respuesta <span aria-hidden="true">→</span>'
        : 'Siguiente <span aria-hidden="true">→</span>';
    if (focus) steps[index].querySelector('h2').focus({ preventScroll: true });
    const top = story.getBoundingClientRect().top;
    if (top < 0) story.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  // Las preguntas: tocar una opción muestra la respuesta, acierte o no.
  function reveal(quiz, picked) {
    if (!quiz.querySelector('.quiz-reveal').hidden) return;
    const answer = quiz.dataset.answer,
      right = picked === answer;
    quiz.querySelectorAll('[data-option]').forEach(b => {
      b.disabled = true;
      b.classList.toggle('correct', b.dataset.option === answer);
      b.classList.toggle('picked', b.dataset.option === picked && !right);
    });
    quiz.querySelector('.quiz-verdict').textContent =
      picked === null ? '' : right ? '✓ ¡Acertaste!' : '¡Casi! Mirá la respuesta:';
    quiz.querySelector('.quiz-verdict').classList.toggle('hit', right);
    quiz.querySelector('.quiz-reveal').hidden = false;
    $('story-next').innerHTML = 'Siguiente <span aria-hidden="true">→</span>';
    if (picked !== null) Sound.ui(right ? 'hit' : 'miss');
  }
  story
    .querySelectorAll('.quiz')
    .forEach(quiz =>
      quiz
        .querySelectorAll('[data-option]')
        .forEach(b => (b.onclick = () => reveal(quiz, b.dataset.option))),
    );
  $('story-prev').onclick = () => go(index - 1, true);
  // «Siguiente» primero muestra la respuesta de la pregunta (sin adivinar) y después avanza.
  $('story-next').onclick = () => {
    const quiz = steps[index].querySelector('.quiz');
    if (quiz && quiz.querySelector('.quiz-reveal').hidden) reveal(quiz, null);
    else go(index + 1, true);
  };
  // Flechas del teclado (cuando la historia tiene el foco) y deslizar con el dedo.
  story.addEventListener('keydown', e => {
    if (e.target.closest('input')) return;
    if (e.key === 'ArrowRight') $('story-next').click();
    if (e.key === 'ArrowLeft') go(index - 1, true);
  });
  let touchX = null;
  story.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' && !e.target.closest('canvas')) touchX = e.clientX;
  });
  story.addEventListener('pointerup', e => {
    if (touchX === null) return;
    const dx = e.clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 60) dx < 0 ? $('story-next').click() : go(index - 1);
  });
  steps.forEach(s => s.querySelector('h2').setAttribute('tabindex', '-1'));
  go(0);
})();
