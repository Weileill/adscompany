document.addEventListener('DOMContentLoaded', function () {
  // Footer year
  const y = new Date().getFullYear();
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = y;

  // ------------- Entrance animation (stagger) -------------
  // If user prefers reduced motion OR pointer is coarse (touch), we'll minimize stagger/duration
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);

  const body = document.body;
  // small delay to allow paint
  setTimeout(() => {
    if (prefersReduced) {
      body.classList.add('is-loaded'); // no stagger, show instantly
    } else {
      // gather elements with data-anim attribute and stagger them
      const animEls = Array.from(document.querySelectorAll('[data-anim]'))
        .sort((a,b) => Number(a.getAttribute('data-anim')) - Number(b.getAttribute('data-anim')));
      body.classList.add('is-loaded'); // add class so base transition applies
      // apply incremental delays
      animEls.forEach((el, i) => {
        const baseDelay = isTouch ? 30 : 90; // ms per step, shorter on mobile
        const delay = i * baseDelay;
        el.style.transitionDelay = `${delay}ms`;
      });
    }
  }, 80);

  // ------------- Lazy-play videos: click a .video-card to replace with iframe -------------
  document.querySelectorAll('.video-card').forEach(card => {
    card.addEventListener('click', function (e) {
      // prevent double-click selecting text
      e.preventDefault();
      const id = this.dataset.id;
      if (!id) return;

      const iframe = document.createElement('iframe');
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;

      const thumb = this.querySelector('.thumb');
      if (thumb) {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.paddingBottom = '56.25%';
        wrapper.style.height = '0';
        wrapper.appendChild(iframe);

        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';

        thumb.replaceWith(wrapper);
      }
    });
  });

  // ------------- Hero parallax only on non-touch devices -------------
  const hero = document.getElementById('hero');
  const heroCard = document.getElementById('heroCard');
  if (hero && heroCard && !isTouch) {
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
    // disable potential transform/animation for touch devices to preserve perf
    heroCard.style.willChange = 'auto';
  }

  // ------------- Optional: dynamic FB iframe update (already set in HTML) -------------
  // If you want to change FB page dynamically, uncomment and set encoded URL.
  // const fbIframe = document.getElementById('fb-iframe');
  // if (fbIframe) {
  //   const encoded = encodeURIComponent('https://www.facebook.com/JandMConnect/');
  //   fbIframe.src = `https://www.facebook.com/plugins/page.php?href=${encoded}&tabs=timeline&width=360&height=400&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`;
  // }
});
