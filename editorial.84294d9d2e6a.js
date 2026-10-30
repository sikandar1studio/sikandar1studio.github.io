(() => {
  const links = [...document.querySelectorAll('.story-nav a[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const update = () => {
    const active = [...sections].reverse().find(section => section.getBoundingClientRect().top < 210) || sections[0];
    links.forEach(link => {
      if (link.hash === '#' + active.id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };
  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { update(); queued = false; });
  }, {passive:true});
  update();
})();
