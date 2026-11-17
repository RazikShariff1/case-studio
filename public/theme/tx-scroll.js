/*
 * Thingx scroll engine.
 * One requestAnimationFrame loop drives every scroll effect on the page:
 *  - [data-tx-reveal]        fade/slide in once when scrolled into view
 *  - [data-tx-hero-scroll]   hero fades and lifts away as you scroll past it      (--leave 0..1)
 *  - [data-tx-story]         pinned stage, lines swap and the stone turns          (--p 0..1, data-active)
 *  - [data-tx-words]         paragraph whose words light up as you scroll          (.is-lit on words)
 *  - [data-tx-hscroll]       pinned section that scrolls sideways                  (translateX on track)
 *  - [data-tx-count]         numbers count up when they come into view
 */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const handlers = new Set();
  let ticking = false;

  const run = () => {
    ticking = false;
    const vh = window.innerHeight;
    handlers.forEach((fn) => fn(vh));
  };
  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(run);
    }
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);

  /* Progress of a tall pinned element: 0 when its top hits the viewport top, 1 when its bottom hits the viewport bottom. */
  const pinnedProgress = (el, vh) => {
    const r = el.getBoundingClientRect();
    const span = r.height - vh;
    return span <= 0 ? 0 : clamp(-r.top / span);
  };

  /* ---------- Reveal on enter ---------- */
  function setupReveal(scope) {
    const items = scope.querySelectorAll('[data-tx-reveal]:not([data-tx-reveal-ready])');
    if (!items.length) return;
    if (reduce.matches || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );
    items.forEach((el) => {
      el.setAttribute('data-tx-reveal-ready', '');
      io.observe(el);
    });
  }

  /* ---------- Hero leaving ---------- */
  function setupHero(el) {
    if (el.dataset.txScrollReady) return;
    el.dataset.txScrollReady = '1';
    handlers.add(() => {
      const r = el.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height * 0.8));
      el.style.setProperty('--leave', p.toFixed(3));
    });
  }

  /* ---------- Pinned story ---------- */
  function setupStory(el) {
    if (el.dataset.txScrollReady) return;
    el.dataset.txScrollReady = '1';
    const lines = el.querySelectorAll('[data-tx-story-line]');
    const dots = el.querySelectorAll('[data-tx-story-dot]');
    const count = Math.max(1, lines.length);
    const model = el.querySelector('[data-tx-story-model]');
    let lastTheta = null;
    handlers.add((vh) => {
      const p = pinnedProgress(el, vh);
      el.style.setProperty('--p', p.toFixed(4));
      if (model) {
        // Turn the 3D stone one full lap (plus a little) across the story.
        const theta = Math.round(p * 400 - 20);
        if (theta !== lastTheta) {
          lastTheta = theta;
          model.setAttribute('camera-orbit', `${theta}deg 80deg 78%`);
        }
      }
      const active = Math.min(count - 1, Math.floor(p * count));
      if (el.dataset.active !== String(active)) {
        el.dataset.active = active;
        lines.forEach((line, i) => {
          line.classList.toggle('is-active', i === active);
          line.classList.toggle('is-past', i < active);
        });
        dots.forEach((d, i) => d.classList.toggle('is-active', i === active));
      }
    });
  }

  /* ---------- 3D stone scroll hero ----------
   * Scroll is split into units: 1 for the intro, 1 per chapter, 1 for the closing.
   * The stone moves between poses (x/y in vw/vh, scale, camera theta/phi) placed along those units. */
  const smooth = (t) => t * t * (3 - 2 * t);
  function setupStoneHero(el) {
    if (el.dataset.txScrollReady) return;
    el.dataset.txScrollReady = '1';
    const stone = el.querySelector('[data-tx-sh-stone]');
    const model = el.querySelector('[data-tx-sh-model]');
    const chapters = el.querySelectorAll('[data-tx-sh-chapter]');
    const n = chapters.length;
    const units = n + 2;
    const mobile = window.matchMedia('(max-width: 749px)');
    let mx = 0;
    let my = 0;
    let lastOrbit = '';
    let lastActive = -2;
    // Load-in: lift (stone moves from its big landing pose into the scroll pose), spin (decelerating turn).
    let lift = 1;
    let spin = 1;
    // LOGO_TH / LOGO_PH: camera angle where the 3D stone matches the flat Thingx logo
    // (camera on the model's +X side, Y up, Z pointing left).
    const LOGO_TH = 100;
    const LOGO_PH = 82;
    // Landing pose (load-in): centred in the part of the screen below the header, and small enough to fit it.
    const landingPose = () => {
      const fallback = mobile.matches ? { x: 0, y: -6, s: 0.92, th: LOGO_TH, ph: LOGO_PH } : { x: 0, y: -2, s: 1, th: LOGO_TH, ph: LOGO_PH };
      const stage = el.querySelector('.tx-sh__stage');
      if (!stone || !stage) return fallback;
      const W = stone.offsetWidth;
      const H = stone.offsetHeight || W;
      if (!W) return fallback;
      const stageTop = Math.max(0, stage.getBoundingClientRect().top); // header height at load (page at the top)
      const visible = window.innerHeight - stageTop; // screen space below the header
      const s = Math.min(fallback.s, (visible * 0.72) / H);
      const baseCenter = stage.clientHeight / 2 - 0.55 * W + H / 2; // stone centre before any translate (stage coords)
      const ty = visible / 2 - baseCenter;
      return { x: 0, y: ty / (window.innerHeight / 100), s, th: LOGO_TH, ph: LOGO_PH };
    };

    // Resting intro pose: sit the stone just above the headline instead of a fixed offset,
    // so there is no big gap between them on tall screens.
    const INTRO_GAP = 12; // px between the bottom of the stone (incl. its shadow) and the headline block
    const introY = (scale, fallback) => {
      const head = el.querySelector('.tx-sh__intro > :not(.tx-sh__hint)');
      const stage = el.querySelector('.tx-sh__stage');
      if (!head || !stone || !stage) return fallback;
      const stageH = stage.clientHeight || window.innerHeight; // stone is placed at top: 50% of the stage
      const unit = window.innerHeight / 100; // ...but its transform is written in vh (viewport) units
      const headTop = head.getBoundingClientRect().top - stage.getBoundingClientRect().top;
      const W = stone.offsetWidth;
      const H = stone.offsetHeight || W;
      if (!W || headTop <= 0) return fallback;
      const baseCenter = stageH / 2 - 0.55 * W + H / 2; // stone centre before any translate
      const ty = headTop - INTRO_GAP - (H * scale) / 2 - baseCenter;
      return Math.max(-45, Math.min(10, ty / unit));
    };
    // Largest intro scale that keeps the stone between the top of the stage (under the header) and the headline.
    const INTRO_TOP = 16; // px of breathing room under the header
    const introScale = (wanted) => {
      const head = el.querySelector('.tx-sh__intro > :not(.tx-sh__hint)');
      const stage = el.querySelector('.tx-sh__stage');
      if (!head || !stone || !stage) return wanted;
      const H = stone.offsetHeight || stone.offsetWidth;
      const room = head.getBoundingClientRect().top - stage.getBoundingClientRect().top - INTRO_GAP - INTRO_TOP;
      if (!H || room <= 0) return wanted;
      return Math.max(0.2, Math.min(wanted, room / H));
    };

    const poses = () => {
      const m = mobile.matches;
      const side = (i) => (m ? 0 : i % 2 === 0 ? 22 : -22); // chapter text left -> stone right
      const introS = introScale(m ? 0.5 : 0.44);
      const k = [{ u: 0, x: 0, y: introY(introS, m ? -22 : -21), s: introS, th: LOGO_TH, ph: LOGO_PH }];
      if (n === 0) return [k[0], { ...k[0], u: 1 }]; // stone stays where the load-in leaves it
      for (let i = 0; i < n; i++) {
        const base = LOGO_TH + 70 * (i + 1);
        const pose = { x: side(i), y: m ? -14 : 0, s: m ? 0.86 : 0.94, ph: i % 2 ? 70 : 82 };
        k.push({ u: 1 + i + 0.15, th: base, ...pose });
        k.push({ u: 1 + i + 0.8, th: base + 45, ...pose });
      }
      const endTh = LOGO_TH + 360; // one full lap back to the logo view
      k.push({ u: n + 1.55, x: 0, y: m ? -20 : -19, s: m ? 0.56 : 0.5, th: endTh, ph: LOGO_PH });
      k.push({ u: units, x: 0, y: m ? -20 : -19, s: m ? 0.56 : 0.5, th: endTh, ph: LOGO_PH });
      return k;
    };
    let keys = poses();
    const refreshPoses = () => {
      keys = poses();
      request();
    };
    mobile.addEventListener('change', refreshPoses);
    window.addEventListener('resize', refreshPoses);
    window.addEventListener('load', refreshPoses);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshPoses);

    const sample = (u) => {
      let i = 0;
      while (i < keys.length - 2 && u > keys[i + 1].u) i++;
      const a = keys[i];
      const b = keys[i + 1];
      const t = smooth(clamp((u - a.u) / (b.u - a.u || 1)));
      const mix = (key) => a[key] + (b[key] - a[key]) * t;
      return { x: mix('x'), y: mix('y'), s: mix('s'), th: mix('th'), ph: mix('ph') };
    };

    if (!reduce.matches) {
      el.addEventListener('pointermove', (e) => {
        mx = (e.clientX / window.innerWidth) * 2 - 1;
        my = (e.clientY / window.innerHeight) * 2 - 1;
        request();
      });
      el.addEventListener('pointerleave', () => {
        mx = 0;
        my = 0;
        request();
      });
    }

    const update = (vh) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      const p = pinnedProgress(el, vh);
      const u = p * units;
      const intro = 1 - smooth(clamp(u / 0.6));
      const night = n === 0 ? 0 : smooth(clamp((u - 0.35) / 0.5)) * (1 - smooth(clamp((u - (n + 1.05)) / 0.45)));
      const outro = n === 0 ? 0 : smooth(clamp((u - (n + 1.35)) / 0.45));
      el.style.setProperty('--p', p.toFixed(4));
      el.style.setProperty('--intro', intro.toFixed(3));
      el.style.setProperty('--night', night.toFixed(3));
      el.style.setProperty('--outro', outro.toFixed(3));
      el.style.setProperty('--chapter-p', clamp((u - 1) / Math.max(1, n)).toFixed(3));
      el.dataset.phase = u < 0.6 ? 'intro' : u > n + 1.35 ? 'outro' : 'chapters';

      let pose = sample(u);
      if (lift < 1 || spin < 1) {
        const L = landingPose();
        const e = smooth(lift);
        const turn = (1 - Math.pow(1 - spin, 3)) - 1; // -1 -> 0, easing out
        const mixL = (key) => L[key] + (pose[key] - L[key]) * e;
        pose = { x: mixL('x'), y: mixL('y'), s: mixL('s'), th: mixL('th') + turn * 40, ph: mixL('ph') + turn * 6 };
      }
      el.style.setProperty('--glow-x', pose.x.toFixed(1));
      if (stone) {
        stone.style.transform = `translate3d(${pose.x.toFixed(2)}vw, ${pose.y.toFixed(2)}vh, 0) scale(${pose.s.toFixed(3)})`;
      }
      if (model) {
        const orbit = `${(pose.th + mx * 14).toFixed(1)}deg ${(pose.ph + my * 6).toFixed(1)}deg 86%`;
        if (orbit !== lastOrbit) {
          lastOrbit = orbit;
          model.setAttribute('camera-orbit', orbit);
        }
      }

      const active = u < 0.8 || u > n + 1.1 ? -1 : Math.min(n - 1, Math.max(0, Math.floor(u - 0.9)));
      if (active !== lastActive) {
        lastActive = active;
        chapters.forEach((c, i) => {
          c.classList.toggle('is-active', i === active);
          c.classList.toggle('is-past', active === -1 ? u > 1 : i < active);
        });
      }
    };
    handlers.add(update);

    /* ---------- Load-in sequence ---------- */
    if (!el.classList.contains('is-intro')) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      lift = 1;
      spin = 1;
      el.style.setProperty('--reveal', 1);
      el.classList.remove('is-intro', 'is-waiting');
      ['wheel', 'touchmove', 'keydown'].forEach((t) => window.removeEventListener(t, finish));
      request();
    };
    if (reduce.matches || window.scrollY > 40) {
      finish();
      return;
    }
    ['wheel', 'touchmove', 'keydown'].forEach((t) => window.addEventListener(t, finish, { passive: true }));


    lift = 0;
    spin = 0;
    el.style.setProperty('--reveal', 0);
    update(window.innerHeight);

    const wrap = el.querySelector('[data-tx-stone-3d]');
    const ready = new Promise((resolve) => {
      if (!model || model.loaded) return resolve();
      model.addEventListener('load', resolve, { once: true });
      model.addEventListener('error', resolve, { once: true });
      setTimeout(resolve, 3500); // slow network: go ahead with the placeholder image
    });

    ready.then(() => {
      if (done) return;
      if (wrap && model && model.loaded) wrap.classList.add('is-loaded');
      el.classList.remove('is-waiting');
      const REVEAL = 900;
      const SPIN = 3000;
      const LIFT_AT = 1350;
      const LIFT = 1400;
      const t0 = performance.now();
      const step = (now) => {
        if (done) return;
        const t = now - t0;
        const rv = clamp(t / REVEAL);
        el.style.setProperty('--reveal', (1 - Math.pow(1 - rv, 2)).toFixed(3));
        spin = clamp(t / SPIN);
        lift = clamp((t - LIFT_AT) / LIFT);
        if (t >= LIFT_AT && el.classList.contains('is-intro')) el.classList.remove('is-intro');
        update(window.innerHeight);
        if (t < Math.max(SPIN, LIFT_AT + LIFT)) requestAnimationFrame(step);
        else finish();
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- Words lighting up ---------- */
  function setupWords(el) {
    if (el.dataset.txScrollReady) return;
    el.dataset.txScrollReady = '1';
    const words = Array.from(el.querySelectorAll('.tx-words__w'));
    if (reduce.matches) {
      words.forEach((w) => w.classList.add('is-lit'));
      return;
    }
    let lastLit = -1;
    handlers.add((vh) => {
      const r = el.getBoundingClientRect();
      const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.25));
      const lit = Math.round(p * words.length);
      if (lit === lastLit) return;
      lastLit = lit;
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    });
  }

  /* ---------- Horizontal scroll ---------- */
  function setupHScroll(el) {
    if (el.dataset.txScrollReady) return;
    el.dataset.txScrollReady = '1';
    const track = el.querySelector('[data-tx-hscroll-track]');
    if (!track) return;
    let distance = 0;
    const measure = () => {
      distance = Math.max(0, track.scrollWidth - window.innerWidth);
      el.style.height = window.innerHeight + distance + 'px';
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', () => {
      measure();
      request();
    });
    handlers.add((vh) => {
      const p = pinnedProgress(el, vh);
      el.style.setProperty('--p', p.toFixed(4));
      track.style.transform = 'translate3d(' + (-p * distance).toFixed(1) + 'px,0,0)';
    });
  }

  /* ---------- Count up ---------- */
  function setupCount(el) {
    if (el.dataset.txScrollReady) return;
    el.dataset.txScrollReady = '1';
    const target = parseFloat(el.dataset.txCount) || 0;
    const decimals = (String(el.dataset.txCount).split('.')[1] || '').length;
    const format = (v) => v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    if (reduce.matches || !('IntersectionObserver' in window)) {
      el.textContent = format(target);
      return;
    }
    el.textContent = format(0);
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = 1600;
        const step = (now) => {
          const t = clamp((now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = format(target * eased);
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.5 }
    );
    io.observe(el);
  }

  function init(scope) {
    const root = scope || document;
    setupReveal(root);
    root.querySelectorAll('[data-tx-hero-scroll]').forEach(setupHero);
    root.querySelectorAll('[data-tx-story]').forEach(setupStory);
    root.querySelectorAll('[data-tx-stone-hero]').forEach(setupStoneHero);
    root.querySelectorAll('[data-tx-words]').forEach(setupWords);
    root.querySelectorAll('[data-tx-hscroll]').forEach(setupHScroll);
    root.querySelectorAll('[data-tx-count]').forEach(setupCount);
    request();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', (e) => init(e.target));
})();
