// Progressive interaction polish. All anchors retain native navigation behavior.
(() => {
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const magnets=[...document.querySelectorAll('.action-button')];
  const reset=element=>{element.style.setProperty('--magnet-x','0px');element.style.setProperty('--magnet-y','0px');};
  for(const element of magnets){
    let rect;
    element.addEventListener('pointerenter',()=>{rect=element.getBoundingClientRect();});
    element.addEventListener('pointermove',event=>{
      if(!fine.matches||reduce.matches||event.pointerType!=='mouse')return;
      rect ||= element.getBoundingClientRect();
      const x=Math.max(-1,Math.min(1,((event.clientX-rect.left)/rect.width-.5)*2));
      const y=Math.max(-1,Math.min(1,((event.clientY-rect.top)/rect.height-.5)*2));
      element.style.setProperty('--magnet-x',`${x*5}px`);element.style.setProperty('--magnet-y',`${y*4}px`);
      element.style.setProperty('--pointer-x',`${(x+1)*50}%`);element.style.setProperty('--pointer-y',`${(y+1)*50}%`);
    },{passive:true});
    element.addEventListener('pointerleave',()=>{reset(element);rect=null;});
    element.addEventListener('pointercancel',()=>reset(element));
    element.addEventListener('blur',()=>reset(element));
  }
  const resetAll=()=>magnets.forEach(reset);
  reduce.addEventListener('change',resetAll);fine.addEventListener('change',resetAll);
  window.addEventListener('resize',resetAll,{passive:true});

  const progress=document.createElement('div');progress.className='page-loading';progress.hidden=true;
  progress.innerHTML='<span class="page-loading-bar" aria-hidden="true"></span><span class="page-loading-label" role="status">Opening project…</span>';
  document.body.append(progress);
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest('a[href]');
    if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||url.pathname===location.pathname)return;
    queueMicrotask(()=>{if(!event.defaultPrevented){progress.hidden=false;document.documentElement.classList.add('is-navigating');}});
  });
  window.addEventListener('pageshow',()=>{progress.hidden=true;document.documentElement.classList.remove('is-navigating');});

  const header=document.querySelector('.site-header');
  if(header){
    const sentinel=document.createElement('span');sentinel.className='nav-sentinel';header.before(sentinel);
    new IntersectionObserver(([entry])=>header.classList.toggle('is-scrolled',!entry.isIntersecting)).observe(sentinel);
  }
})();
