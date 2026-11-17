/* Horizontal product shelves: prev/next buttons on a scroll-snap track. */
(function () {
  function init(root) {
    if (root.dataset.txReady) return;
    root.dataset.txReady = '1';
    const track = root.querySelector('[data-tx-track]');
    if (!track) return;
    const prev = root.querySelector('[data-tx-prev]');
    const next = root.querySelector('[data-tx-next]');

    const step = () => {
      const item = track.firstElementChild;
      if (!item) return track.clientWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const perView = Math.max(1, Math.floor(track.clientWidth / (item.offsetWidth + gap)));
      return perView * (item.offsetWidth + gap);
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      root.classList.toggle('is-scrollable', max > 2);
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
    };

    prev && prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next && next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  const initAll = (scope) => (scope || document).querySelectorAll('[data-tx-carousel]').forEach(init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll());
  } else {
    initAll();
  }
  document.addEventListener('shopify:section:load', (e) => initAll(e.target));
})();

/* Autoplay tile videos: pause when off-screen, and never autoplay for reduced-motion users. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function setup(video) {
    if (video.dataset.txVideoReady) return;
    video.dataset.txVideoReady = '1';
    video.muted = true;
    video.removeAttribute('controls');
    if (reduce.matches) {
      video.removeAttribute('autoplay');
      video.pause();
      return;
    }
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const p = video.play();
            if (p && p.catch) p.catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.15 }
    ).observe(video);
  }

  const setupAll = (scope) => (scope || document).querySelectorAll('video.tx-tile__video').forEach(setup);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setupAll());
  } else {
    setupAll();
  }
  document.addEventListener('shopify:section:load', (e) => setupAll(e.target));
  reduce.addEventListener &&
    reduce.addEventListener('change', () => {
      document.querySelectorAll('video.tx-tile__video').forEach((v) => (reduce.matches ? v.pause() : v.play().catch(() => {})));
    });
})();

/* Landing hero: cursor glow + letters that lift and split into colour near the pointer. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function init(root) {
    if (root.dataset.txLandingReady || !root.classList.contains('tx-landing--animate')) return;
    root.dataset.txLandingReady = '1';
    if (reduce.matches || !finePointer.matches) return;
    const words = Array.from(root.querySelectorAll('.tx-landing__char'));
    const heading = root.querySelector('.tx-landing__heading');
    let frame = null;
    let pointer = null;

    const render = () => {
      frame = null;
      if (!pointer) return;
      const box = root.getBoundingClientRect();
      root.style.setProperty('--mx', pointer.x - box.left + 'px');
      root.style.setProperty('--my', pointer.y - box.top + 'px');
      const size = heading ? parseFloat(getComputedStyle(heading).fontSize) : 80;
      const radius = size * 0.9;
      words.forEach((word) => {
        const r = word.getBoundingClientRect();
        const dx = pointer.x - (r.left + r.width / 2);
        const dy = pointer.y - (r.top + r.height / 2);
        const p = Math.pow(Math.max(0, 1 - Math.hypot(dx, dy) / radius), 0.7);
        word.style.setProperty('--p', p.toFixed(3));
      });
    };

    root.addEventListener('pointermove', (e) => {
      pointer = { x: e.clientX, y: e.clientY };
      root.classList.add('is-hovering');
      if (!frame) frame = requestAnimationFrame(render);
    });
    root.addEventListener('pointerleave', () => {
      pointer = null;
      root.classList.remove('is-hovering');
      words.forEach((word) => word.style.setProperty('--p', 0));
    });
  }

  const initAll = (scope) => (scope || document).querySelectorAll('[data-tx-landing]').forEach(init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll());
  } else {
    initAll();
  }
  document.addEventListener('shopify:section:load', (e) => initAll(e.target));
})();

/* Landing stone: tilts toward the cursor, flips when clicked. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function init(stone) {
    if (stone.dataset.txStoneReady) return;
    stone.dataset.txStoneReady = '1';
    const root = stone.closest('[data-tx-landing]') || document.body;
    const tilt = stone.querySelector('.tx-stone__tilt');
    if (reduce.matches || !tilt) return;

    root.addEventListener('pointermove', (e) => {
      const r = stone.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      tilt.style.setProperty('--ry', (dx * 22).toFixed(2) + 'deg');
      tilt.style.setProperty('--rx', (-dy * 18).toFixed(2) + 'deg');
    });
    root.addEventListener('pointerleave', () => {
      tilt.style.setProperty('--ry', '0deg');
      tilt.style.setProperty('--rx', '0deg');
    });
    tilt.addEventListener('click', () => {
      stone.classList.remove('is-spinning');
      void stone.offsetWidth;
      stone.classList.add('is-spinning');
    });
    stone.addEventListener('animationend', (e) => {
      if (e.animationName === 'tx-stone-spin') stone.classList.remove('is-spinning');
    });
  }

  const initAll = (scope) => (scope || document).querySelectorAll('[data-tx-stone]').forEach(init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll());
  } else {
    initAll();
  }
  document.addEventListener('shopify:section:load', (e) => initAll(e.target));
})();

/* 3D stone (snippets/tx-stone-3d.liquid): keep the flat image until the model has rendered, then cross-fade. */
(function () {
  const reveal = (wrap) => requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('is-loaded')));
  const onLoad = (e) => {
    const wrap = e.target.closest && e.target.closest('[data-tx-stone-3d]');
    if (wrap && e.target.tagName === 'MODEL-VIEWER') reveal(wrap);
  };
  document.addEventListener('load', onLoad, true);
  const check = (scope) =>
    (scope || document).querySelectorAll('[data-tx-stone-3d] model-viewer').forEach((mv) => {
      if (mv.loaded) reveal(mv.closest('[data-tx-stone-3d]'));
    });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => check());
  } else {
    check();
  }
  document.addEventListener('shopify:section:load', (e) => check(e.target));
})();

/* Thingx account panel: open on click, close on outside click / Escape. */
(function () {
  function init(root) {
    if (root.dataset.txAcctReady) return;
    root.dataset.txAcctReady = '1';
    const btn = root.querySelector('[data-tx-acct-toggle]');
    const panel = root.querySelector('[data-tx-acct-panel]');
    if (!btn || !panel) return;
    const open = () => {
      panel.hidden = false;
      requestAnimationFrame(() => root.classList.add('is-open'));
      btn.setAttribute('aria-expanded', 'true');
      const first = panel.querySelector('a, button');
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 50);
    };
    const close = (refocus) => {
      root.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      setTimeout(() => {
        if (!root.classList.contains('is-open')) panel.hidden = true;
      }, 220);
      if (refocus) btn.focus({ preventScroll: true });
    };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      root.classList.contains('is-open') ? close(false) : open();
    });
    document.addEventListener('click', (e) => {
      if (root.classList.contains('is-open') && !root.contains(e.target)) close(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('is-open')) close(true);
    });
  }
  const initAll = (scope) => (scope || document).querySelectorAll('[data-tx-acct]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initAll());
  else initAll();
  document.addEventListener('shopify:section:load', (e) => initAll(e.target));
})();
