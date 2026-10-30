// Native links, scrolling and form behavior stay intact. Feedback is progressive.
(() => {
 const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
 const enabled=()=>fine.matches&&!reduce.matches&&root.dataset.motion!=='paused';
 const orbit=document.createElement('div');orbit.className='pointer-orbit';orbit.setAttribute('aria-hidden','true');document.body.append(orbit);
 let x=-100,y=-100,tx=-100,ty=-100,frame=0,visible=false;
 const tick=()=>{frame=0;if(!visible||!enabled())return;x+=(tx-x)*.28;y+=(ty-y)*.28;orbit.style.transform=`translate3d(${x}px,${y}px,0)`;
  if(Math.abs(tx-x)+Math.abs(ty-y)>.12)frame=requestAnimationFrame(tick);};
 const hide=()=>{visible=false;orbit.classList.remove('is-visible');cancelAnimationFrame(frame);frame=0;};
 document.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!enabled()){hide();return;}
  if(e.target.closest('input,textarea,select')){hide();return;}tx=e.clientX;ty=e.clientY;
  if(!visible){x=tx;y=ty;visible=true;orbit.classList.add('is-visible');}if(!frame)frame=requestAnimationFrame(tick);
  const action=e.target.closest('a,button,summary');orbit.classList.toggle('is-action',!!action);
  orbit.textContent=action?.matches('.visual-case-link,.case-next')?'↗':'';
 },{passive:true});
 root.addEventListener('pointerleave',hide);document.addEventListener('keydown',e=>{if(e.key==='Tab')hide();});
 const magnets=[...document.querySelectorAll('.action-button')];
 const reset=el=>{el.style.setProperty('--magnet-x','0px');el.style.setProperty('--magnet-y','0px');};
 for(const el of magnets){let rect;
  el.addEventListener('pointerenter',()=>{rect=el.getBoundingClientRect();});
  el.addEventListener('pointermove',e=>{if(!enabled()||e.pointerType!=='mouse')return;rect||=el.getBoundingClientRect();
   const x=Math.max(-1,Math.min(1,(e.clientX-rect.left)/rect.width*2-1)),y=Math.max(-1,Math.min(1,(e.clientY-rect.top)/rect.height*2-1));
   el.style.setProperty('--magnet-x',`${x*10}px`);el.style.setProperty('--magnet-y',`${y*7}px`);
  },{passive:true});
  for(const event of ['pointerleave','pointercancel','blur'])el.addEventListener(event,()=>{reset(el);rect=null;});
 }
 // One frame per pointer update keeps the light attached to the cursor without an idle animation loop.
 const skillCards=[...document.querySelectorAll('.capability')];
 let litCard=null,lightFrame=0,lightX=0,lightY=0;
 const resetLight=()=>{cancelAnimationFrame(lightFrame);lightFrame=0;litCard?.classList.remove('is-lit');litCard=null;};
 const paintLight=()=>{
  lightFrame=0;if(!litCard||!enabled()){resetLight();return;}
  const rect=litCard.getBoundingClientRect();
  litCard.style.setProperty('--light-x',`${Math.max(0,Math.min(rect.width,lightX-rect.left)).toFixed(1)}px`);
  litCard.style.setProperty('--light-y',`${Math.max(0,Math.min(rect.height,lightY-rect.top)).toFixed(1)}px`);
  litCard.classList.add('is-lit');
 };
 for(const card of skillCards){
  const followLight=e=>{
   if(e.pointerType!=='mouse'||!enabled()){resetLight();return;}
   if(litCard!==card){resetLight();litCard=card;}
   lightX=e.clientX;lightY=e.clientY;if(!lightFrame)lightFrame=requestAnimationFrame(paintLight);
  };
  card.addEventListener('pointerenter',followLight,{passive:true});
  card.addEventListener('pointermove',followLight,{passive:true});
  for(const event of ['pointerleave','pointercancel'])card.addEventListener(event,()=>{if(litCard===card)resetLight();});
 }
 const resetAll=()=>{magnets.forEach(reset);hide();resetLight();};
 reduce.addEventListener('change',resetAll);fine.addEventListener('change',resetAll);document.addEventListener('portfolio:motionchange',resetAll);window.addEventListener('resize',resetAll,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)resetAll();});
 window.addEventListener('blur',resetAll);
 const progress=document.createElement('div');progress.className='page-loading';progress.hidden=true;
 progress.innerHTML='<span class="page-loading-bar" aria-hidden="true"></span><span class="page-loading-label" role="status">Opening project…</span>';document.body.append(progress);
 document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const a=e.target.closest('a[href]');if(!a||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return;
  const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.pathname===location.pathname)return;
  queueMicrotask(()=>{if(!e.defaultPrevented){progress.hidden=false;root.classList.add('is-navigating');a.classList.add('pi-opening');}});
 });
 window.addEventListener('pageshow',()=>{progress.hidden=true;root.classList.remove('is-navigating');document.querySelectorAll('.pi-opening').forEach(el=>el.classList.remove('pi-opening'));});
 const header=document.querySelector('.site-header');if(header){const sentinel=document.createElement('span');sentinel.className='nav-sentinel';header.before(sentinel);new IntersectionObserver(([e])=>header.classList.toggle('is-scrolled',!e.isIntersecting)).observe(sentinel);}
})();
