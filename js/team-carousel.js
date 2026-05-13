'use strict';

(function () {

  /* ── Config ──────────────────────────────────────────── */
  const GAP            = 24;    // px — must match CSS gap
  const SLIDE_HEIGHT   = 520;   // px fixed height
  const AUTOPLAY_MS    = 7000;  // slow, elegant autoplay
  const DRAG_THRESHOLD = 50;    // px to commit a swipe
  const VELOCITY_MIN   = 0.28;  // px/ms for velocity-based swipe

  /* ── DOM ─────────────────────────────────────────────── */
  const carousel = document.getElementById('teamCarousel');
  if (!carousel) return;

  const viewport = document.getElementById('tcViewport');
  const track    = document.getElementById('tcTrack');
  const btnPrev  = document.getElementById('tcPrev');
  const btnNext  = document.getElementById('tcNext');
  const dotsWrap = document.getElementById('tcDots');

  const realSlides = Array.from(track.querySelectorAll('.tc-slide'));
  const N = realSlides.length; // 5

  /* ── Clone full set on each side for true infinite loop ─
     Final array layout: [c0..c4 | r0..r4 | c0..c4]   (15 total)
     Snap rule: idx < N → jump to idx+N; idx >= 2N → jump to idx-N  */
  const frag1 = document.createDocumentFragment();
  const frag2 = document.createDocumentFragment();
  realSlides.forEach(s => {
    const a = s.cloneNode(true);
    const b = s.cloneNode(true);
    a.setAttribute('aria-hidden', 'true'); a.removeAttribute('tabindex');
    b.setAttribute('aria-hidden', 'true'); b.removeAttribute('tabindex');
    frag1.appendChild(a);
    frag2.appendChild(b);
  });
  track.insertBefore(frag1, track.firstChild);
  track.appendChild(frag2);

  const allSlides = Array.from(track.querySelectorAll('.tc-slide')); // 15 slides

  /* ── State ───────────────────────────────────────────── */
  let currentIdx   = N;   // start at r0 (real first slide)
  let slideW       = 0;
  let autoplayTimer;

  /* drag state */
  let isDragging   = false;
  let dragStartX   = 0;
  let dragLastX    = 0;
  let dragLastTime = 0;
  let dragVelocity = 0;

  /* ── Dots ────────────────────────────────────────────── */
  const dots = Array.from(dotsWrap.querySelectorAll('.tc-dot'));

  /* ── Metrics ─────────────────────────────────────────── */
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

  /* ── Offset ──────────────────────────────────────────── */
  function getOffset(idx) {
    const vw = viewport.offsetWidth;
    return (vw - slideW) / 2 - idx * (slideW + GAP);
  }

  /* ── Visual slide states ─────────────────────────────── */
  function updateSlideStyles(idx) {
    allSlides.forEach((s, i) => {
      if (i === idx) {
        s.dataset.pos = 'active';
      } else if (i === idx - 1 || i === idx + 1) {
        s.dataset.pos = 'near';
      } else {
        delete s.dataset.pos;
      }
    });
  }

  /* ── Dots ────────────────────────────────────────────── */
  function updateDots(realIdx) {
    const ri = ((realIdx % N) + N) % N;
    dots.forEach((d, i) => {
      const active = i === ri;
      d.classList.toggle('is-active', active);
      d.setAttribute('aria-selected', String(active));
    });
  }

  /* ── Navigation ──────────────────────────────────────── */
  function applyTranslate(idx) {
    track.style.transform = `translateX(${getOffset(idx)}px)`;
  }

  function goTo(idx, animate) {
    if (animate === false) {
      track.classList.add('no-transition');
    } else {
      track.classList.remove('no-transition');
    }
    currentIdx = idx;
    applyTranslate(idx);
    updateSlideStyles(idx);
    updateDots(idx - N);
  }

  /* Instant teleport for infinite-loop snap — no visible jump */
  function teleport(idx) {
    currentIdx = idx;
    track.classList.add('no-transition');
    applyTranslate(idx);
    updateSlideStyles(idx);
    updateDots(idx - N);
    requestAnimationFrame(() => requestAnimationFrame(() =>
      track.classList.remove('no-transition')
    ));
  }

  function next() { goTo(currentIdx + 1); }
  function prev() { goTo(currentIdx - 1); }

  /* ── Infinite loop snap on transitionend ─────────────── */
  track.addEventListener('transitionend', e => {
    if (e.propertyName !== 'transform') return;
    if (currentIdx < N) {
      teleport(currentIdx + N);
    } else if (currentIdx >= 2 * N) {
      teleport(currentIdx - N);
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
    dragLastX    = x;
    dragLastTime = performance.now();
    dragVelocity = 0;
    track.classList.add('no-transition');
    viewport.classList.add('is-grabbing');
    stopAutoplay();
  }

  function onDragMove(x) {
    if (!isDragging) return;
    const now = performance.now();
    const dt  = now - dragLastTime;
    if (dt > 0) dragVelocity = (x - dragLastX) / dt;
    dragLastX    = x;
    dragLastTime = now;
    track.style.transform = `translateX(${getOffset(currentIdx) + (x - dragStartX)}px)`;
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove('is-grabbing');
    track.classList.remove('no-transition');

    const delta = dragLastX - dragStartX;
    const fastSwipe = Math.abs(dragVelocity) > VELOCITY_MIN;

    if (fastSwipe || Math.abs(delta) >= DRAG_THRESHOLD) {
      (delta < 0 || dragVelocity < -VELOCITY_MIN) ? next() : prev();
    } else {
      goTo(currentIdx); // snap back to current
    }
    startAutoplay();
  }

  /* Mouse */
  viewport.addEventListener('mousedown', e => { e.preventDefault(); onDragStart(e.clientX); });
  window.addEventListener('mousemove',   e => { if (isDragging) onDragMove(e.clientX); });
  window.addEventListener('mouseup',     () => { if (isDragging) onDragEnd(); });

  /* Touch */
  viewport.addEventListener('touchstart', e => onDragStart(e.touches[0].clientX), { passive: true });
  viewport.addEventListener('touchmove',  e => { if (isDragging) onDragMove(e.touches[0].clientX); }, { passive: true });
  viewport.addEventListener('touchend',   onDragEnd);

  /* ── Buttons ─────────────────────────────────────────── */
  btnPrev.addEventListener('click', () => { prev(); startAutoplay(); });
  btnNext.addEventListener('click', () => { next(); startAutoplay(); });

  /* ── Dots ────────────────────────────────────────────── */
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(N + i); startAutoplay(); });
  });

  /* ── Keyboard ────────────────────────────────────────── */
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { prev(); startAutoplay(); }
    if (e.key === 'ArrowRight') { next(); startAutoplay(); }
  });

  /* ── Hover pause ─────────────────────────────────────── */
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  /* ── Resize ──────────────────────────────────────────── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      calcMetrics();
      track.classList.add('no-transition');
      applyTranslate(currentIdx);
      requestAnimationFrame(() => requestAnimationFrame(() =>
        track.classList.remove('no-transition')
      ));
    }, 150);
  });

  /* ── Init ────────────────────────────────────────────── */
  calcMetrics();
  track.classList.add('no-transition');
  applyTranslate(currentIdx);
  updateSlideStyles(currentIdx);
  updateDots(0);

  /* Entrance: fade+slide up, then start autoplay */
  carousel.classList.add('tc-entering');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    track.classList.remove('no-transition');
  }));
  setTimeout(startAutoplay, 950); // after entrance animation

})();
