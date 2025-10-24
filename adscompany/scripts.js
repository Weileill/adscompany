document.addEventListener('DOMContentLoaded', function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);

  // ---------- ENTRY OVERLAY ----------
  const overlay = document.getElementById('entryOverlay');
  // show overlay briefly, then animate out
  if (overlay && !prefersReduced) {
    // keep overlay for ~700ms then hide (so user definitely notices)
    setTimeout(() => {
      overlay.classList.add('hidden');
      // remove from DOM after transition to free paint
      setTimeout(() => overlay.remove(), 900);
    }, 680);
  } else if (overlay) {
    overlay.remove();
  }

  // ---------- STAGGERED ENTRANCE ----------
  const body = document.body;
  const animEls = Array.from(document.querySelectorAll('[data-anim]'))
    .sort((a,b) => Number(a.getAttribute('data-anim')) - Number(b.getAttribute('data-anim')));

  if (prefersReduced) {
    // show immediately if reduced motion
    animEls.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    body.classList.add('is-loaded');
  } else {
    // set CSS variable --delay stagger for each element (stronger spacing)
    animEls.forEach((el, i) => {
      const base = isTouch ? 40 : 110; // ms
      const delay = i * base;
      el.style.setProperty('--delay', `${delay}ms`);
    });
    // small delay before adding class so overlay finishes
    setTimeout(() => {
      body.classList.add('is-loaded');
      // add hero bounce class after a slightly longer time for emphasis
      const heroCard = document.getElementById('heroCard');
      if (heroCard) {
        setTimeout(() => heroCard.classList.add('body-animated'), 240);
      }
    }, 220);
  }

  // ---------- LAZY-PLAY VIDEOS ----------
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

  // ---------- HERO PARALLAX (desktop only) ----------
  const hero = document.getElementById('hero');
  const heroCard = document.getElementById('heroCard');
  if (hero && heroCard && !isTouch && !prefersReduced) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const tx = x * 10;
      const ty = y * 10;
      const rz = x * 2.6;
      heroCard.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotateZ(${rz}deg)`;
      heroCard.style.boxShadow = `0 ${18 - Math.abs(ty)}px ${40 - Math.abs(ty)}px rgba(11,15,30,0.12)`;
    });
    hero.addEventListener('mouseleave', () => { heroCard.style.transform = ''; heroCard.style.boxShadow = ''; });
  } else if (heroCard) {
    heroCard.style.willChange = 'auto';
  }

  // Footer year
  const y = new Date().getFullYear();
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = y;
});


