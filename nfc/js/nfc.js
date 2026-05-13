// ATLAS CAE — NFC Landing JS

// Staggered reveal on scroll using IntersectionObserver
(function () {
  'use strict';

  const reveals = document.querySelectorAll('.reveal');

  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Small stagger for sequential sections
          const delay = i * 60;
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
  );

  reveals.forEach((el) => observer.observe(el));
})();


// Tactile ripple on button tap (mobile UX)
(function () {
  'use strict';

  function createRipple(e) {
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const rect = btn.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 1.8;

    circle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x - size / 2}px;
      top: ${y - size / 2}px;
      background: rgba(255,255,255,0.08);
      border-radius: 50%;
      pointer-events: none;
      transform: scale(0);
      animation: ripple 0.5s ease-out forwards;
    `;

    btn.appendChild(circle);
    circle.addEventListener('animationend', () => circle.remove());
  }

  // Inject ripple keyframes once
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to { transform: scale(1); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('touchstart', createRipple, { passive: true });
    btn.addEventListener('mousedown', createRipple);
  });
})();


// Dossier placeholder — show friendly message if PDF not yet uploaded
(function () {
  'use strict';

  const dossierBtn = document.querySelector('.btn--dossier');
  if (!dossierBtn) return;

  dossierBtn.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href || href.includes('placeholder') || href === '#') return;

    // Real PDF path: let browser handle it
    // If placeholder, intercept
    fetch(href, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) {
          e.preventDefault();
          showToast('El dossier estará disponible muy pronto.');
        }
      })
      .catch(() => {
        e.preventDefault();
        showToast('El dossier estará disponible muy pronto.');
      });
  });
})();


// Minimal toast notification
function showToast(msg) {
  const existing = document.getElementById('atlas-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'atlas-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    bottom: max(24px, env(safe-area-inset-bottom, 0px) + 16px);
    left: 50%;
    transform: translateX(-50%) translateY(8px);
    background: #162540;
    border: 1px solid rgba(0,196,154,0.30);
    color: rgba(255,255,255,0.85);
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem;
    padding: 12px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    z-index: 9999;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.25s ease, transform 0.25s ease;
    pointer-events: none;
  `;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(6px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
