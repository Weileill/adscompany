document.addEventListener('DOMContentLoaded', function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);
  // --------------------------------------------------------
  // INTERACTIVE GLASS SHEEN (滑鼠追蹤光澤)
  // --------------------------------------------------------
  const sheenElements = document.querySelectorAll('.hover-sheen, .video-card');

  sheenElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      // 取得元素的邊界與尺寸
      const rect = el.getBoundingClientRect();
      
      // 計算滑鼠相對於該元素的 X, Y 座標
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 更新 CSS 變數
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);
    });
  });
  // ENTRY OVERLAY (if exists)
  const overlay = document.getElementById('entryOverlay');
  if (overlay && !prefersReduced) {
    setTimeout(() => {
      overlay.classList.add('hidden');
      setTimeout(() => { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 900);
    }, 600);
  } else if (overlay) {
    overlay.remove();
  }

  // Collect anim elements and apply stagger delays
  const body = document.body;
  const animEls = Array.from(document.querySelectorAll('[data-anim]'))
    .sort((a,b) => Number(a.getAttribute('data-anim')) - Number(b.getAttribute('data-anim')));

  if (prefersReduced) {
    // show immediately without stagger
    animEls.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.classList.add('anim-final');
    });
    body.classList.add('is-loaded');
  } else {
    const baseStep = isTouch ? 40 : 95;
    animEls.forEach((el, i) => {
      const delay = i * baseStep;
      el.style.setProperty('--anim-delay', `${delay}ms`);
    });

    // small timeout to wait for overlay fade
    const startupDelay = overlay && !prefersReduced ? 300 : 80;
    setTimeout(() => {
      body.classList.add('is-loaded');

      // after total stagger time + small buffer, mark elements final to avoid them reverting
      const totalStagger = animEls.length * baseStep + 320; // safe buffer
      setTimeout(() => {
        animEls.forEach(el => {
          // mark final, so CSS forced final properties apply
          el.classList.add('anim-final');
          // also explicitly set final inline styles to be extra safe
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.visibility = 'visible';
          // remove any transition-delay custom to avoid future flicker
          el.style.removeProperty('transition-delay');
          el.style.removeProperty('--anim-delay');
        });

        // hero card bounce trigger (desktop) — if exists
        const heroCard = document.getElementById('heroCard');
        if (heroCard && !isTouch && !prefersReduced) {
          heroCard.classList.add('body-animated');
          // ensure it stays visible after animationend
          heroCard.addEventListener('animationend', () => {
            heroCard.classList.add('anim-final');
            heroCard.style.transform = 'none';
            heroCard.style.opacity = '1';
            heroCard.style.visibility = 'visible';
          }, { once: true });
        }
      }, totalStagger);
    }, startupDelay);
  }

  // LAZY-PLAY videos (unchanged logic but safe)
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

  // HERO PARALLAX — desktop only and non-blocking
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
    // only clear transform on mouseleave (desktop) — do not clear on touch devices
    hero.addEventListener('mouseleave', () => {
      heroCard.style.transform = '';
      heroCard.style.boxShadow = '';
    });
  } else if (heroCard) {
    // ensure touch/mobile doesn't get transforms cleared unexpectedly
    heroCard.style.willChange = 'auto';
    heroCard.style.transform = 'none';
    heroCard.style.opacity = '1';
    heroCard.style.visibility = 'visible';
    heroCard.classList.add('anim-final');
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
