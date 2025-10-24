document.addEventListener('DOMContentLoaded', function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);

  // ---------- ENTRY OVERLAY (保留，如果你有 overlay ) ----------
  const overlay = document.getElementById('entryOverlay');
  if (overlay && !prefersReduced) {
    setTimeout(() => {
      overlay.classList.add('hidden');
      setTimeout(() => { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 900);
    }, 600);
  } else if (overlay) {
    overlay.remove();
  }

  // ---------- UNIFIED STAGGER FOR ALL data-anim ELEMENTS ----------
  const body = document.body;
  const animEls = Array.from(document.querySelectorAll('[data-anim]'))
    .sort((a, b) => Number(a.getAttribute('data-anim')) - Number(b.getAttribute('data-anim')));

  if (prefersReduced) {
    // show immediately
    animEls.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    body.classList.add('is-loaded');
  } else {
    // Choose base delay step (shorter on touch devices)
    const baseStep = isTouch ? 45 : 95; // ms per element
    animEls.forEach((el, i) => {
      const delay = i * baseStep;
      el.style.setProperty('--anim-delay', `${delay}ms`);
    });

    // Wait a little for overlay to disappear (if present) then mark loaded
    const startupDelay = overlay && !prefersReduced ? 320 : 80;
    setTimeout(() => {
      body.classList.add('is-loaded');

      // Trigger heroCard extra bounce AFTER main load so it stands out
      const heroCard = document.getElementById('heroCard');
      if (heroCard) {
        setTimeout(() => {
          heroCard.classList.add('body-animated');
        }, 240);
      }
    }, startupDelay);
  }

  // ---------- LAZY-PLAY VIDEOS: unchanged but safe ----------
  document.querySelectorAll('.video-card').forEach(card => {
    card.addEventListener('click', function (e) {
      e.preventDefault();
      const id = this.dataset.id;
      if (!id) return;
      const iframe = document.createElement('iframe');
      iframe.width = '100%'; iframe.height = '100%';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true; iframe.loading = 'lazy';
      iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
      const thumb = this.querySelector('.thumb');
      if (thumb) {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.paddingBottom = '56.25%';
        wrapper.style.height = '0';
        wrapper.appendChild(iframe);
        iframe.style.position = 'absolute'; iframe.style.top = '0'; iframe.style.left = '0'; iframe.style.width = '100%'; iframe.style.height = '100%';
        thumb.replaceWith(wrapper);
      }
    });
  });

  // ---------- HERO PARALLAX (desktop only, keep but non-blocking) ----------
  const hero = document.getElementById('hero');
  const heroCard = document.getElementById('heroCard');
  if (hero && heroCard && !isTouch && !prefersReduced) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const tx = x * 8;
      const ty = y * 8;
      const rz = x * 3;
      heroCard.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotateZ(${rz}deg)`;
      heroCard.style.boxShadow = `0 ${12 - Math.abs(ty)}px ${30 - Math.abs(ty)}px rgba(11,15,30,0.09)`;
    });
    hero.addEventListener('mouseleave', () => {
      heroCard.style.transform = '';
      heroCard.style.boxShadow = '';
    });
  } else if (heroCard) {
    heroCard.style.willChange = 'auto';
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
