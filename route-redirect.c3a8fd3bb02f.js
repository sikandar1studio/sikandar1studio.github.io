(()=>{const n=document.querySelector("a[data-redirect]");if(!n)return;const e=new URL(n.href);e.origin===location.origin&&location.replace(e.pathname+location.search+location.hash)})();
