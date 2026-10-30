/* Progressive project interactions. All links retain native browser behavior. */
(() => {
  'use strict';
  if (document.documentElement.dataset.projectInteractions === 'ready') return;
  document.documentElement.dataset.projectInteractions = 'ready';

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const supportsObserver = 'IntersectionObserver' in window;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const pendingReveals = new Set();

  // Only offscreen content is prepared for a reveal. Initial content never flashes away.
  const revealObserver = supportsObserver ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('pi-reveal-pending');
      pendingReveals.delete(entry.target);
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.02, rootMargin: '0px 0px -16px 0px' }) : null;

  const revealTargets = document.querySelectorAll('.perspective-intro, .visual-record, .selected-heading, .selected-card, .about-editorial-heading, .about-story, .contact-layout > div, .case-gallery figure, .case-content section');
  revealTargets.forEach((element, index) => {
    element.classList.add('pi-reveal');
    element.style.setProperty('--pi-reveal-delay', `${Math.min(index % 2, 1) * 60}ms`);
    if (!revealObserver || motion.matches) return;
    const bounds = element.getBoundingClientRect();
    if (!element.hidden && bounds.top < window.innerHeight - 16 && bounds.bottom > 0) return;
    element.classList.add('pi-reveal-pending');
    pendingReveals.add(element);
    revealObserver.observe(element);
    // Keyboard navigation can reach a card before the observer has delivered its callback.
    element.addEventListener('focusin', () => {
      element.classList.remove('pi-reveal-pending');
      pendingReveals.delete(element);
      revealObserver.unobserve(element);
    });
  });

  // Feedback while actual project imagery loads; never substitute invented artwork.
  document.querySelectorAll('.project-visual, .case-hero, .case-gallery figure').forEach(frame => {
    const image = frame.querySelector('img');
    if (!image) return;
    const finish = () => {
      frame.classList.remove('pi-image-loading');
      frame.removeAttribute('aria-busy');
      frame.dataset.imageState = image.naturalWidth ? 'ready' : 'unavailable';
    };
    if (image.complete) { finish(); return; }
    frame.classList.add('pi-image-loading');
    frame.setAttribute('aria-busy', 'true');
    image.addEventListener('load', finish, { once: true });
    image.addEventListener('error', finish, { once: true });
  });

  const states = [];
  const animating = new Set();
  let frameId = 0;
  const values = ['rx', 'ry', 'x', 'y'];
  const paint = state => {
    for (const key of values) {
      const unit = key === 'rx' || key === 'ry' ? 'deg' : 'px';
      state.visual.style.setProperty(`--pi-${key}`, `${state.current[key].toFixed(3)}${unit}`);
    }
  };
  const animate = () => {
    frameId = 0;
    for (const state of animating) {
      let unsettled = false;
      for (const key of values) {
        const difference = state.target[key] - state.current[key];
        state.current[key] = Math.abs(difference) < 0.012 ? state.target[key] : state.current[key] + difference * 0.18;
        unsettled ||= Math.abs(state.current[key] - state.target[key]) >= 0.012;
      }
      paint(state);
      if (!unsettled) {
        animating.delete(state);
        if (!state.hovering) state.visual.classList.remove('pi-depth-active');
      }
    }
    if (animating.size && !document.hidden) frameId = window.requestAnimationFrame(animate);
  };
  const requestPaint = state => {
    animating.add(state);
    if (!frameId && !document.hidden) frameId = window.requestAnimationFrame(animate);
  };
  const reset = (state, immediately = false) => {
    const wasHovering = state.hovering;
    state.hovering = false;
    state.bounds = null;
    for (const key of values) state.target[key] = 0;
    state.link.classList.remove('pi-pointer-active');
    if(wasHovering) document.dispatchEvent(new CustomEvent('portfolio:cardfocus', {detail:{active:false}}));
    if (immediately || motion.matches || !finePointer.matches) {
      for (const key of values) state.current[key] = 0;
      paint(state);
      animating.delete(state);
      state.visual.classList.remove('pi-depth-active');
    } else requestPaint(state);
  };

  const depthObserver = supportsObserver ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      const state = states.find(item => item.link === entry.target);
      if (!state) continue;
      state.visible = entry.isIntersecting;
      if (!state.visible) reset(state, true);
    }
  }, { threshold: 0 }) : null;

  document.querySelectorAll('.visual-case-link').forEach(link => {
    const visual = link.querySelector('.project-visual');
    if (!visual) return;
    const state = { link, visual, visible: true, hovering: false, bounds: null,
      current: { rx: 0, ry: 0, x: 0, y: 0 }, target: { rx: 0, ry: 0, x: 0, y: 0 } };
    states.push(state);
    visual.classList.add('pi-depth');
    depthObserver?.observe(link);
    const eligible = event => !motion.matches && document.documentElement.dataset.motion !== 'paused' && finePointer.matches && event.pointerType !== 'touch' && state.visible && !document.hidden;
    const engage = () => {
      state.bounds = visual.getBoundingClientRect();
      state.hovering = true;
      visual.classList.add('pi-depth-active');
      link.classList.add('pi-pointer-active');
      document.dispatchEvent(new CustomEvent('portfolio:cardfocus', {detail:{active:true}}));
    };
    link.addEventListener('pointerenter', event => {
      if (!eligible(event)) return;
      engage();
    }, { passive: true });
    link.addEventListener('pointermove', event => {
      if (!eligible(event)) return;
      if (!state.hovering) engage();
      const bounds = state.bounds;
      if (!bounds || !bounds.width || !bounds.height) return;
      const x = clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1);
      const y = clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1);
      state.target = { rx: -y * 5.5, ry: x * 5.5, x: 0, y: 0 };
      requestPaint(state);
    }, { passive: true });
    link.addEventListener('pointerleave', () => reset(state), { passive: true });
    link.addEventListener('pointercancel', () => reset(state, true), { passive: true });
    link.addEventListener('focusin', () => reset(state, true));
  });

  // A quiet reading indicator and section state. Neither changes the scroll position.
  const caseContent = document.querySelector('.case-content');
  const sectionLinks = [...document.querySelectorAll('.case-nav a[href^="#"]')];
  let updateReading = () => {};
  if (caseContent && sectionLinks.length) {
    const sections = sectionLinks.map(link => ({ link, section: document.getElementById(link.hash.slice(1)) })).filter(item => item.section);
    const progress = document.createElement('div');
    progress.className = 'pi-reading-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.append(progress);
    document.body.classList.add('pi-case-page');
    let currentSection = null;
    let readFrame = 0;
    const renderReading = () => {
      readFrame = 0;
      const extent = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progress.style.setProperty('--pi-progress', clamp(window.scrollY / extent, 0, 1).toFixed(4));
      const readingLine = Math.min(window.innerHeight * 0.28, 220);
      let active = sections[0];
      for (const item of sections) {
        if (item.section.getBoundingClientRect().top <= readingLine) active = item;
      }
      if (!active || currentSection === active) return;
      currentSection = active;
      for (const item of sections) {
        if (item === active) item.link.setAttribute('aria-current', 'location');
        else item.link.removeAttribute('aria-current');
      }
    };
    updateReading = () => { if (!readFrame) readFrame = window.requestAnimationFrame(renderReading); };
    updateReading();
    window.addEventListener('load', updateReading, { once: true });
    // Lazy image sizing and expanding native details can change the reading extent.
    if ('ResizeObserver' in window) new ResizeObserver(updateReading).observe(document.querySelector('main') || caseContent);
  }

  window.addEventListener('scroll', () => {
    for (const state of states) if (state.hovering) reset(state, true);
    updateReading();
  }, { passive: true });
  window.addEventListener('resize', () => {
    for (const state of states) reset(state, true);
    updateReading();
  }, { passive: true });
  const updatePreferences = () => {
    for (const state of states) reset(state, true);
    if (motion.matches) {
      for (const element of pendingReveals) element.classList.remove('pi-reveal-pending');
      pendingReveals.clear();
      revealObserver?.disconnect();
    }
  };
  document.addEventListener('portfolio:motionchange', () => { for (const state of states) reset(state, true); });
  motion.addEventListener('change', updatePreferences);
  finePointer.addEventListener('change', updatePreferences);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { updateReading(); return; }
    for (const state of states) reset(state, true);
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
  });
  window.addEventListener('pageshow', () => {
    updatePreferences();
    updateReading();
  });
})();
