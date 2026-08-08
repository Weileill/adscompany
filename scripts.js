document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const siteHeader = document.getElementById('siteHeader');
  const progressBar = document.querySelector('.scroll-progress span');
  const menuToggle = document.getElementById('menuToggle');
  const primaryNav = document.getElementById('primaryNav');
  const year = document.getElementById('year');

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Keep the header state and reading progress tied to the page position.
  let scrollTicking = false;

  const updateScrollUI = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollRange > 0 ? Math.min(scrollTop / scrollRange, 1) : 0;

    siteHeader?.classList.toggle('is-scrolled', scrollTop > 12);

    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
    }

    scrollTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    window.requestAnimationFrame(updateScrollUI);
    scrollTicking = true;
  }, { passive: true });

  updateScrollUI();

  // Reveal content only when it becomes relevant to the viewport.
  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  // Never leave content hidden if a browser interrupts reveal observation.
  window.setTimeout(() => {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }, 2400);

  // Mobile navigation remains keyboard- and escape-key accessible.
  const setMenuState = (open, returnFocus = false) => {
    document.body.classList.toggle('nav-open', open);
    menuToggle?.setAttribute('aria-expanded', String(open));

    if (!open && returnFocus) {
      menuToggle?.focus();
    }
  };

  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    setMenuState(!isOpen);
  });

  primaryNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuState(false));
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 840) {
      setMenuState(false);
    }
  }, { passive: true });

  // Indicate the section currently crossing the reading line.
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const navSections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && navSections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const activeEntry = entries.find((entry) => entry.isIntersecting);
      if (!activeEntry) return;

      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${activeEntry.target.id}`;
        if (active) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }, {
      rootMargin: '-32% 0px -60% 0px',
      threshold: 0
    });

    navSections.forEach((section) => sectionObserver.observe(section));
  }

  // Use a smaller YouTube thumbnail when max resolution is unavailable.
  document.querySelectorAll('.case-trigger img, .hero-frame img').forEach((image) => {
    image.addEventListener('error', () => {
      if (image.src.includes('/maxresdefault.jpg')) {
        image.src = image.src.replace('/maxresdefault.jpg', '/hqdefault.jpg');
      }
    }, { once: true });
  });

  // The film deck keeps only one privacy-enhanced YouTube player alive.
  const caseStack = document.querySelector('[data-case-stack]');
  const videoStatus = document.querySelector('[data-video-status]');
  let activeCase = null;

  const closePlayer = (card, returnFocus = true) => {
    if (!card) return;

    const trigger = card.querySelector('.case-trigger');
    const player = card.querySelector('[data-player]');
    const mount = card.querySelector('.player-mount');

    if (mount) mount.replaceChildren();
    if (player) player.hidden = true;
    if (trigger) trigger.hidden = false;

    card.classList.remove('is-playing');

    if (activeCase === card) {
      activeCase = null;
    }

    if (videoStatus) {
      videoStatus.textContent = '影片已關閉';
    }

    if (returnFocus) {
      trigger?.focus();
    }
  };

  const openPlayer = (trigger) => {
    const card = trigger.closest('.case-card');
    const player = card?.querySelector('[data-player]');
    const mount = card?.querySelector('.player-mount');
    const videoId = trigger.dataset.videoId;

    if (!card || !player || !mount || !videoId) return;

    if (activeCase && activeCase !== card) {
      closePlayer(activeCase, false);
    }

    const iframe = document.createElement('iframe');
    iframe.className = 'video-player';
    iframe.title = trigger.getAttribute('aria-label') || 'YouTube 影片播放器';
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1&rel=0`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.tabIndex = 0;

    mount.replaceChildren(iframe);
    trigger.hidden = true;
    player.hidden = false;
    card.classList.add('is-playing');
    activeCase = card;

    if (videoStatus) {
      videoStatus.textContent = `${iframe.title}已開啟`;
    }

    window.requestAnimationFrame(() => iframe.focus());
  };

  caseStack?.addEventListener('click', (event) => {
    const trigger = event.target.closest('.case-trigger');
    const closeButton = event.target.closest('[data-close-player]');

    if (trigger && caseStack.contains(trigger)) {
      openPlayer(trigger);
      return;
    }

    if (closeButton && caseStack.contains(closeButton)) {
      closePlayer(closeButton.closest('.case-card'));
    }
  });

  // Subtle depth state for the sticky stack, with no scroll hijacking.
  if ('IntersectionObserver' in window && !reducedMotion) {
    const caseObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-in-view', entry.isIntersecting);
      });
    }, {
      rootMargin: '-14% 0px -24% 0px',
      threshold: 0.24
    });

    document.querySelectorAll('.case-stack-item').forEach((item) => caseObserver.observe(item));
  }

  // Preserve the Facebook feed while loading its heavy iframe only on request.
  const socialFeed = document.getElementById('socialFeed');
  const facebookFrame = document.getElementById('fb-iframe');

  socialFeed?.addEventListener('toggle', () => {
    if (socialFeed.open && facebookFrame && !facebookFrame.src) {
      facebookFrame.src = facebookFrame.dataset.src;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (document.body.classList.contains('nav-open')) {
      setMenuState(false, true);
      return;
    }

    if (activeCase) {
      closePlayer(activeCase);
    }
  });
});
