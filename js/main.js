/* =====================================================
   ATLAS CAE — main.js
   Shared: header, mobile nav, reveal, counters,
           legal modals, cookie banner
   ===================================================== */

(function () {
  'use strict';

  /* ── Scroll progress bar ─────────────────────────── */
  const scrollBar = document.getElementById('scroll-bar');
  if (scrollBar) {
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    }, { passive: true });
  }

  /* ── Header scroll state ─────────────────────────── */
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* ── Mobile nav toggle ───────────────────────────── */
  const toggle  = document.getElementById('mobile-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    /* Close on link click */
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
    /* Close on ESC */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── Active nav link ─────────────────────────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header-nav a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (href === 'index.html' && currentPage === '')) {
      a.classList.add('current');
    }
  });

  /* ── Scroll reveal ───────────────────────────────── */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* ── Counter animation ───────────────────────────── */
  function animateCounter(el) {
    const prefix   = el.dataset.prefix || '';
    const suffix   = el.dataset.suffix || '';
    const target   = parseFloat(el.dataset.target);
    const isFloat  = el.dataset.target.includes('.');
    const decimals = isFloat ? el.dataset.target.split('.')[1].length : 0;
    const dur = 1800;
    const start = Date.now();
    function tick() {
      const prog  = Math.min((Date.now() - start) / dur, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      const val   = target * eased;
      el.textContent = prefix +
        (isFloat ? val.toFixed(decimals) : Math.floor(val).toLocaleString('es-ES')) +
        suffix;
      if (prog < 1) requestAnimationFrame(tick);
    }
    tick();
  }
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        counterObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el));

  /* ── Legal modals ────────────────────────────────── */
  window.abrirLegal = function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
    el.querySelector('.legal-close')?.focus();
  };
  window.cerrarLegal = function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    document.body.style.overflow = '';
  };
  /* Click backdrop to close */
  document.querySelectorAll('.legal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) cerrarLegal(overlay.id);
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.legal-overlay.open').forEach(el => {
      el.classList.remove('open');
    });
    document.body.style.overflow = '';
  });

  /* ── Cookie banner ───────────────────────────────── */
  if (!localStorage.getItem('atlas_cookies_ok')) {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.classList.remove('hidden');
  }
  window.cerrarCookieBanner = function () {
    localStorage.setItem('atlas_cookies_ok', '1');
    const b = document.getElementById('cookie-banner');
    if (b) b.classList.add('hidden');
  };

})();
