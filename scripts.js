document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const siteNav = document.getElementById('siteNav');
  const progressBar = document.querySelector('.scroll-progress span');
  const year = document.getElementById('year');

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Scroll-linked navigation polish and progress indicator.
  let scrollTicking = false;

  const updateScrollUI = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollRange > 0 ? Math.min(scrollTop / scrollRange, 1) : 0;

    if (siteNav) {
      siteNav.classList.toggle('is-scrolled', scrollTop > 18);
    }

    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
    }

    scrollTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateScrollUI);
      scrollTicking = true;
    }
  }, { passive: true });

  updateScrollUI();

  // Reveal content as it enters the viewport instead of delaying the whole page.
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
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.08
    });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  // Highlight the navigation item that matches the section in view.
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const sectionIds = navLinks
    .map((link) => link.getAttribute('href'))
    .filter((href) => href && href.startsWith('#'));
  const observedSections = sectionIds
    .map((id) => document.querySelector(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && observedSections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const activeEntry = entries.find((entry) => entry.isIntersecting);
      if (!activeEntry) return;

      navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${activeEntry.target.id}`;
        if (isActive) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }, {
      rootMargin: '-28% 0px -62% 0px',
      threshold: 0
    });

    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  // Fall back gracefully when a YouTube video has no max-resolution thumbnail.
  document.querySelectorAll('.video-frame img').forEach((image) => {
    image.addEventListener('error', () => {
      const maxRes = '/maxresdefault.jpg';
      if (image.src.includes(maxRes)) {
        image.src = image.src.replace(maxRes, '/hqdefault.jpg');
      }
    }, { once: true });
  });

  // Load YouTube only after a visitor chooses a case.
  document.querySelectorAll('.video-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const videoId = trigger.dataset.videoId;
      const card = trigger.closest('.video-card');
      if (!videoId || !card) return;

      const playerFrame = document.createElement('div');
      playerFrame.className = 'video-frame';

      const iframe = document.createElement('iframe');
      iframe.className = 'video-player';
      iframe.title = trigger.getAttribute('aria-label') || 'YouTube 影片播放器';
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&modestbranding=1`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';

      playerFrame.appendChild(iframe);
      trigger.replaceWith(playerFrame);
      card.classList.add('is-playing');

      if (!reducedMotion) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, { once: true });
  });

  // Pointer-responsive light and restrained logo tilt on capable devices.
  if (finePointer && !reducedMotion) {
    document.body.classList.add('has-pointer');

    let pointerX = -500;
    let pointerY = -500;
    let pointerTicking = false;

    const updatePointer = () => {
      document.documentElement.style.setProperty('--cursor-x', `${pointerX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${pointerY}px`);
      pointerTicking = false;
    };

    window.addEventListener('pointermove', (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (!pointerTicking) {
        window.requestAnimationFrame(updatePointer);
        pointerTicking = true;
      }
    }, { passive: true });

    const visual = document.querySelector('.hero-visual');
    const brandStage = document.getElementById('brandStage');

    if (visual && brandStage) {
      visual.addEventListener('pointermove', (event) => {
        const bounds = visual.getBoundingClientRect();
        const xRatio = (event.clientX - bounds.left) / bounds.width - 0.5;
        const yRatio = (event.clientY - bounds.top) / bounds.height - 0.5;

        brandStage.style.setProperty('--stage-rx', `${yRatio * -6}deg`);
        brandStage.style.setProperty('--stage-ry', `${xRatio * 8}deg`);
      }, { passive: true });

      visual.addEventListener('pointerleave', () => {
        brandStage.style.setProperty('--stage-rx', '0deg');
        brandStage.style.setProperty('--stage-ry', '0deg');
      });
    }
  }
});
