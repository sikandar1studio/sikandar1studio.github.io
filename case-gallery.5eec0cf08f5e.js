// Native image links work without JavaScript; the viewer adds local-only navigation.
(() => {
 'use strict';
 if(!window.HTMLDialogElement?.prototype.showModal)return;
 const links=[...document.querySelectorAll('[data-case-image]')],items=[],byURL=new Map();
 for(const link of links){if(byURL.has(link.href))continue;byURL.set(link.href,items.length);items.push({src:link.href,still:link.dataset.still,alt:link.querySelector('img').alt,caption:link.dataset.caption||''});}
 if(!items.length)return;
 const dialog=document.createElement('dialog');dialog.className='case-viewer';dialog.setAttribute('aria-labelledby','viewer-title');
 dialog.innerHTML='<header class="viewer-header"><h2 class="viewer-title" id="viewer-title"></h2><button class="viewer-close" type="button" aria-label="Close image viewer" autofocus>Close ×</button></header><div class="viewer-stage"><img class="viewer-image" alt=""><p class="viewer-error" role="status" hidden>This image could not be loaded. Try another view.</p></div><footer class="viewer-bottom"><div><p class="viewer-caption"></p><p class="viewer-help">Use ← → to browse. Escape to close. Swipe on touch screens.</p></div><div class="viewer-navigation"><button class="viewer-prev" type="button" aria-label="Previous image">←</button><span class="viewer-count" role="status" aria-live="polite" aria-atomic="true"></span><button class="viewer-next" type="button" aria-label="Next image">→</button></div></footer>';
 document.body.append(dialog);
 dialog.querySelector('.viewer-title').textContent=document.querySelector('main h1')?.textContent.replace(/\s+/g,' ').trim()||'Project images';
 const img=dialog.querySelector('.viewer-image'),stage=dialog.querySelector('.viewer-stage'),caption=dialog.querySelector('.viewer-caption'),count=dialog.querySelector('.viewer-count'),error=dialog.querySelector('.viewer-error');
 let current=0,returnTo=null,touchStart=null;
 const changed=open=>document.dispatchEvent(new CustomEvent('portfolio:gallerychange',{detail:{open}}));
 const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const show=index=>{current=(index+items.length)%items.length;const item=items[current];stage.setAttribute('aria-busy','true');error.hidden=true;img.alt=item.alt;img.src=reduceMotion.matches&&item.still?item.still:item.src;caption.textContent=item.caption;count.textContent=`${String(current+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;dialog.dataset.index=String(current);};
 reduceMotion.addEventListener('change',()=>{if(dialog.open)show(current);});
 img.addEventListener('load',()=>stage.setAttribute('aria-busy','false'));
 img.addEventListener('error',()=>{stage.setAttribute('aria-busy','false');error.hidden=false;});
 for(const link of document.querySelectorAll('[data-case-image],[data-gallery-open]')){
  if(!byURL.has(link.href))continue;
  link.setAttribute('aria-haspopup','dialog');
  link.addEventListener('click',event=>{if(event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();returnTo=link;show(byURL.get(link.href));dialog.showModal();document.documentElement.classList.add('gallery-open');changed(true);});
 }
 dialog.querySelector('.viewer-close').addEventListener('click',()=>dialog.close());
 dialog.querySelector('.viewer-prev').addEventListener('click',()=>show(current-1));
 dialog.querySelector('.viewer-next').addEventListener('click',()=>show(current+1));
 if(items.length===1){dialog.querySelector('.viewer-prev').hidden=true;dialog.querySelector('.viewer-next').hidden=true;dialog.querySelector('.viewer-help').textContent='Escape to close.';}
 dialog.addEventListener('keydown',event=>{
  if(event.key==='Tab'){const buttons=[...dialog.querySelectorAll('button')].filter(button=>!button.hidden),first=buttons[0],last=buttons.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}return;}
  const keys={ArrowLeft:current-1,ArrowRight:current+1,Home:0,End:items.length-1};if(event.key in keys){event.preventDefault();show(keys[event.key]);}
 });
 dialog.addEventListener('close',()=>{document.documentElement.classList.remove('gallery-open');changed(false);returnTo?.focus({preventScroll:true});touchStart=null;});
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 stage.addEventListener('touchstart',event=>{touchStart=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;},{passive:true});
 stage.addEventListener('touchend',event=>{if(!touchStart||event.touches.length)return;const end=event.changedTouches[0],dx=end.clientX-touchStart.x,dy=end.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.6)show(current+(dx<0?1:-1));},{passive:true});
 stage.addEventListener('touchcancel',()=>{touchStart=null;},{passive:true});
})();
