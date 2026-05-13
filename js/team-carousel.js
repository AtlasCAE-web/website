'use strict';

(function () {

  /* ── Configuración ─────────────────────────────────── */
  const GAP            = 24;    // px — debe coincidir con CSS
  const SLIDE_HEIGHT   = 520;   // px fijo para todas las cards
  const AUTOPLAY_MS    = 5800;  // ms entre avances automáticos
  const DRAG_THRESHOLD = 55;    // px de arrastre para cambiar slide

  /* ── DOM ────────────────────────────────────────────── */
  const carousel = document.getElementById('teamCarousel');
  if (!carousel) return;

  const viewport = document.getElementById('tcViewport');
  const track    = document.getElementById('tcTrack');
  const btnPrev  = document.getElementById('tcPrev');
  const btnNext  = document.getElementById('tcNext');
  const dotsWrap = document.getElementById('tcDots');

  const realSlides = Array.from(track.querySelectorAll('.tc-slide'));
  const TOTAL      = realSlides.length; // 5

  /* ── Loop infinito: clonar primer y último slide ────── */
  // Estructura del track: [clon-último | real-0…4 | clon-primero]
  // Índices de array:      0             1…5         6
  const cloneLast  = realSlides[TOTAL - 1].cloneNode(true);
  const cloneFirst = realSlides[0].cloneNode(true);
  cloneLast.setAttribute('aria-hidden', 'true');
  cloneFirst.setAttribute('aria-hidden', 'true');
  track.prepend(cloneLast);
  track.append(cloneFirst);

  const allSlides = Array.from(track.querySelectorAll('.tc-slide'));

  /* ── Estado ─────────────────────────────────────────── */
  let currentIdx   = 1; // empieza en David (índice real 0 → array 1)
  let slideW       = 0;
  let autoplayTimer;
  let isDragging   = false;
  let dragStartX   = 0;
  let dragCurrentX = 0;

  /* ── Dots ────────────────────────────────────────────── */
  const dots = Array.from(dotsWrap.querySelectorAll('.tc-dot'));

  /* ── Utilidades ─────────────────────────────────────── */
  function getRealIndex(arrayIdx) {
    if (arrayIdx === 0)         return TOTAL - 1; // clon del último
    if (arrayIdx === TOTAL + 1) return 0;          // clon del primero
    return arrayIdx - 1;
  }

  function getOffset(idx) {
    const vw = viewport.offsetWidth;
    return (vw - slideW) / 2 - idx * (slideW + GAP);
  }

  function calcMetrics() {
    const vw = viewport.offsetWidth;
    if (vw >= 1024) {
      slideW = Math.round((vw - 2 * GAP) / 3);
    } else if (vw >= 640) {
      slideW = Math.round((vw - GAP) / 2.18);
    } else {
      slideW = Math.round(vw * 0.83);
    }
    allSlides.forEach(s => {
      s.style.width  = slideW + 'px';
      s.style.height = SLIDE_HEIGHT + 'px';
    });
    track.style.gap = GAP + 'px';
  }

  function updateDots(realIdx) {
    dots.forEach((d, i) => {
      const active = i === realIdx;
      d.classList.toggle('is-active', active);
      d.setAttribute('aria-selected', String(active));
    });
  }

  /* ── Navegación ──────────────────────────────────────── */
  function goTo(idx, animated) {
    if (animated === false) {
      track.classList.add('no-transition');
    } else {
      track.classList.remove('no-transition');
    }
    currentIdx = idx;
    track.style.transform = `translateX(${getOffset(idx)}px)`;
    updateDots(getRealIndex(idx));
  }

  function next() { goTo(currentIdx + 1); }
  function prev() { goTo(currentIdx - 1); }

  /* ── Snap infinito tras transición ─────────────────── */
  track.addEventListener('transitionend', () => {
    if (currentIdx === 0) {
      // Llegamos al clon-último → saltar al Telmo real (idx=5)
      track.classList.add('no-transition');
      currentIdx = TOTAL;
      track.style.transform = `translateX(${getOffset(TOTAL)}px)`;
      requestAnimationFrame(() => requestAnimationFrame(() =>
        track.classList.remove('no-transition')
      ));
    } else if (currentIdx === TOTAL + 1) {
      // Llegamos al clon-primero → saltar al David real (idx=1)
      track.classList.add('no-transition');
      currentIdx = 1;
      track.style.transform = `translateX(${getOffset(1)}px)`;
      requestAnimationFrame(() => requestAnimationFrame(() =>
        track.classList.remove('no-transition')
      ));
    }
  });

  /* ── Autoplay ────────────────────────────────────────── */
  function startAutoplay() {
    clearInterval(autoplayTimer);
    autoplayTimer = setInterval(next, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    clearInterval(autoplayTimer);
  }

  /* ── Drag / swipe ────────────────────────────────────── */
  function onDragStart(x) {
    isDragging   = true;
    dragStartX   = x;
    dragCurrentX = x;
    track.classList.add('no-transition');
    viewport.classList.add('is-grabbing');
    stopAutoplay();
  }

  function onDragMove(x) {
    if (!isDragging) return;
    dragCurrentX = x;
    const delta  = x - dragStartX;
    track.style.transform = `translateX(${getOffset(currentIdx) + delta}px)`;
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove('is-grabbing');
    track.classList.remove('no-transition');

    const delta = dragCurrentX - dragStartX;
    if (Math.abs(delta) >= DRAG_THRESHOLD) {
      delta < 0 ? next() : prev();
    } else {
      goTo(currentIdx); // volver a posición actual
    }
    startAutoplay();
  }

  /* Mouse */
  viewport.addEventListener('mousedown', e => {
    e.preventDefault();
    onDragStart(e.clientX);
  });
  window.addEventListener('mousemove', e => {
    if (isDragging) onDragMove(e.clientX);
  });
  window.addEventListener('mouseup', () => {
    if (isDragging) onDragEnd();
  });

  /* Touch */
  viewport.addEventListener('touchstart', e => {
    onDragStart(e.touches[0].clientX);
  }, { passive: true });
  viewport.addEventListener('touchmove', e => {
    if (isDragging) onDragMove(e.touches[0].clientX);
  }, { passive: true });
  viewport.addEventListener('touchend', onDragEnd);

  /* ── Botones ─────────────────────────────────────────── */
  btnPrev.addEventListener('click', () => { prev(); startAutoplay(); });
  btnNext.addEventListener('click', () => { next(); startAutoplay(); });

  /* ── Dots ────────────────────────────────────────────── */
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i + 1); startAutoplay(); });
  });

  /* ── Teclado ─────────────────────────────────────────── */
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { prev(); startAutoplay(); }
    if (e.key === 'ArrowRight') { next(); startAutoplay(); }
  });

  /* ── Pausa al hacer hover ────────────────────────────── */
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  /* ── Resize ──────────────────────────────────────────── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      calcMetrics();
      track.classList.add('no-transition');
      track.style.transform = `translateX(${getOffset(currentIdx)}px)`;
      requestAnimationFrame(() => requestAnimationFrame(() =>
        track.classList.remove('no-transition')
      ));
    }, 100);
  });

  /* ── Init ────────────────────────────────────────────── */
  calcMetrics();
  track.classList.add('no-transition');
  track.style.transform = `translateX(${getOffset(1)}px)`;
  updateDots(0);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    track.classList.remove('no-transition');
    startAutoplay();
  }));

})();
