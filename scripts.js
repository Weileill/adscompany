/* 源形廣告 J&M Connection
 *
 * Motion budget: every effect below answers "what does this communicate?"
 *   - header state        : where you are on the page
 *   - hero line reveal    : the brand statement arrives as a sentence
 *   - reveal on enter     : hierarchy, content arrives when it becomes relevant
 *   - case recede         : the previous film steps back as the next takes the frame
 *   - magnetic CTA        : pointer feedback on the single primary action
 *
 * No scroll listeners anywhere. Scroll progress is a CSS scroll-driven
 * timeline; everything else is IntersectionObserver or a pointer event.
 */

document.addEventListener('DOMContentLoaded', () => {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const hasObserver = 'IntersectionObserver' in window;

  const siteHeader = document.getElementById('siteHeader');
  const topSentinel = document.getElementById('topSentinel');
  const menuToggle = document.getElementById('menuToggle');
  const primaryNav = document.getElementById('primaryNav');
  const year = document.getElementById('year');

  if (year) year.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------- header */

  if (hasObserver && topSentinel) {
    const headerObserver = new IntersectionObserver(([entry]) => {
      siteHeader?.classList.toggle('is-scrolled', !entry.isIntersecting);
    }, { threshold: 0 });

    headerObserver.observe(topSentinel);
  }

  /* --------------------------------------------------------------- reveals */

  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
  const heroTitle = document.querySelector('.hero-title');
  const enterItems = heroTitle ? revealItems.concat(heroTitle) : revealItems;

  const showAll = () => enterItems.forEach((item) => item.classList.add('is-visible'));

  if (motionQuery.matches || !hasObserver) {
    showAll();
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    enterItems.forEach((item) => revealObserver.observe(item));

    // The hero is above the fold; play it immediately rather than on intersection.
    window.requestAnimationFrame(() => {
      document.querySelector('.hero-title')?.classList.add('is-visible');
    });
  }

  // Content must never stay hidden if observation is interrupted.
  window.setTimeout(showAll, 2400);

  /* ------------------------------------------------------------ navigation */

  const setMenuState = (open, returnFocus = false) => {
    document.body.classList.toggle('nav-open', open);
    menuToggle?.setAttribute('aria-expanded', String(open));
    if (!open && returnFocus) menuToggle?.focus();
  };

  menuToggle?.addEventListener('click', () => {
    setMenuState(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  primaryNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuState(false));
  });

  const desktopQuery = window.matchMedia('(min-width: 901px)');
  const closeMenuAtDesktop = (event) => { if (event.matches) setMenuState(false); };

  if (typeof desktopQuery.addEventListener === 'function') {
    desktopQuery.addEventListener('change', closeMenuAtDesktop);
  } else if (typeof desktopQuery.addListener === 'function') {
    desktopQuery.addListener(closeMenuAtDesktop);
  }

  // Mark the section currently crossing the reading line.
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const navSections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (hasObserver && navSections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const active = entries.find((entry) => entry.isIntersecting);
      if (!active) return;

      navLinks.forEach((link) => {
        if (link.getAttribute('href') === `#${active.target.id}`) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

    navSections.forEach((section) => sectionObserver.observe(section));
  }

  /* ------------------------------------------------------------ magnetic CTA */

  // Written straight to CSS custom properties. No state, no re-render, no loop.
  if (finePointer.matches && !motionQuery.matches) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = 0.22;

      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        el.style.setProperty('--mx', `${(dx * strength).toFixed(2)}px`);
        el.style.setProperty('--my', `${(dy * strength * 0.6).toFixed(2)}px`);
      });

      const release = () => {
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
      };

      el.addEventListener('pointerleave', release);
      el.addEventListener('blur', release);
    });
  }

  /* ------------------------------------------------------- thumbnail fallback */

  document.querySelectorAll('.case-trigger img, .frame-image img, .bento-cell img').forEach((image) => {
    image.addEventListener('error', () => {
      if (image.src.includes('/maxresdefault.jpg')) {
        image.src = image.src.replace('/maxresdefault.jpg', '/hqdefault.jpg');
      }
    }, { once: true });
  });

  /* ------------------------------------------------------------ film players */

  // One privacy-enhanced YouTube player is alive at a time.
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
    card.closest('.case-stack-item')?.classList.remove('has-active-player');

    if (activeCase === card) activeCase = null;
    if (videoStatus) videoStatus.textContent = '影片已關閉';
    if (returnFocus) trigger?.focus();
  };

  const openPlayer = (trigger) => {
    const card = trigger.closest('.case-card');
    const player = card?.querySelector('[data-player]');
    const mount = card?.querySelector('.player-mount');
    const videoId = trigger.dataset.videoId;

    if (!card || !player || !mount || !videoId) return;
    if (activeCase && activeCase !== card) closePlayer(activeCase, false);

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
    card.closest('.case-stack-item')?.classList.add('has-active-player');
    activeCase = card;

    if (videoStatus) videoStatus.textContent = `${iframe.title}已開啟`;
    window.requestAnimationFrame(() => iframe.focus());
  };

  caseStack?.addEventListener('click', (event) => {
    const trigger = event.target.closest('.case-trigger');
    if (trigger && caseStack.contains(trigger)) {
      openPlayer(trigger);
      return;
    }

    const closeButton = event.target.closest('[data-close-player]');
    if (closeButton && caseStack.contains(closeButton)) {
      closePlayer(closeButton.closest('.case-card'));
    }
  });

  /* --------------------------------------------------------- stack depth */

  const caseItems = Array.from(document.querySelectorAll('.case-stack-item'));

  if (hasObserver && !motionQuery.matches && caseItems.length > 1) {
    // When a card enters the frame the one before it recedes, so the sticky
    // stack reads as depth rather than a pile of identical panels.
    const depthObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const item = entry.target;
        item.classList.toggle('is-in-view', entry.isIntersecting);

        const previous = item.previousElementSibling;
        if (previous) previous.classList.toggle('is-covered', entry.isIntersecting);
      });
    }, { rootMargin: '-18% 0px -34% 0px', threshold: 0.2 });

    caseItems.forEach((item) => depthObserver.observe(item));
  }

  /* ---------------------------------------------------------- social feed */

  // The Facebook iframe is heavy; it loads only when the panel is opened.
  const socialFeed = document.getElementById('socialFeed');
  const facebookFrame = document.getElementById('fb-iframe');

  socialFeed?.addEventListener('toggle', () => {
    if (socialFeed.open && facebookFrame && !facebookFrame.src) {
      facebookFrame.src = facebookFrame.dataset.src;
    }
  });

  /* ------------------------------------------------------------- keyboard */

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (document.body.classList.contains('nav-open')) {
      setMenuState(false, true);
      return;
    }

    if (activeCase) closePlayer(activeCase);
  });
});
