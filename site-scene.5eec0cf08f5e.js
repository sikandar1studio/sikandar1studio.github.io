// One shared Three.js scene across all pages; portraits and project sources remain untouched.
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
const root=document.documentElement,host=document.createElement('div');
host.className='site-scene';host.setAttribute('aria-hidden','true');document.body.prepend(host);
document.querySelector('#hero-art')?.remove();
// Motion starts automatically; the operating system's reduced-motion preference still applies.
let paused=reduce.matches;
const setState=()=>{root.dataset.motion=paused?'paused':'running';document.dispatchEvent(new CustomEvent('portfolio:motionchange',{detail:{paused}}));};
setState();
try{
 const THREE=await import('./vendor/three.module.js');
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setClearColor(0x0c0c0d,0);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<721?1:1.35));
 renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,60);camera.position.z=11;
 const sculpture=new THREE.Group();scene.add(sculpture);
 const uniforms={uTime:{value:0},uMorph:{value:0},uAlpha:{value:.7},uFocus:{value:0}};
 const vertex=`uniform float uTime;uniform float uMorph;varying float vDepth;varying float vBand;
 void main(){float t=position.x,w=position.y,twist=t*1.5+uMorph*.72,r=2.18+w*cos(twist);
 vec3 p=vec3(r*cos(t),r*sin(t)*.82,w*sin(twist));p.z+=.28*sin(t*3.+uTime*.24+uMorph);p.y+=.17*sin(t*2.+uMorph*1.4);
 vBand=(w+.95)/1.9;vec4 mv=modelViewMatrix*vec4(p,1.);vDepth=clamp((mv.z+12.)/4.,0.,1.);gl_Position=projectionMatrix*mv;}`;
 const surface=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:`uniform float uAlpha;uniform float uFocus;varying float vDepth;varying float vBand;
 void main(){vec3 c=mix(vec3(.11,.032,.012),vec3(.95,.23,.045),vDepth*.7+vBand*.15);gl_FragColor=vec4(c,uAlpha*(.3+vDepth*.38+uFocus*.12));}`,transparent:true,side:THREE.DoubleSide,depthWrite:false});
 surface.forceSinglePass=true;
 const edge=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:`uniform float uAlpha;uniform float uFocus;varying float vDepth;varying float vBand;
 void main(){vec3 c=mix(vec3(.64,.16,.03),vec3(1.,.63,.29),vDepth*.65+vBand*.2);gl_FragColor=vec4(c,uAlpha*(.55+vDepth*.4+uFocus*.15));}`,transparent:true,depthWrite:false});
 const verts=[],indices=[],lines=[],bands=21,segments=144;
 for(let band=0;band<bands;band++){const a=-.92+band*.088,b=a+.052,offset=verts.length/3;
  for(let i=0;i<=segments;i++){const t=i/segments*Math.PI*2;verts.push(t,a,0,t,b,0);
   if(i<segments){const k=offset+i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);const n=(i+1)/segments*Math.PI*2;lines.push(t,a,0,n,a,0,t,b,0,n,b,0);}}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);
 const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));
 const mesh=new THREE.Mesh(geo,surface),wire=new THREE.LineSegments(lineGeo,edge);
 // Parametric attributes are angles, not world bounds: disable incorrect CPU frustum culling.
 mesh.frustumCulled=wire.frustumCulled=false;sculpture.add(mesh,wire);
 const sparks=new THREE.BufferGeometry(),points=[];
 for(let i=0;i<52;i++){const t=i*2.399963,r=3.2+(i%7)*.14;points.push(Math.cos(t)*r,Math.sin(t)*r*.8,Math.sin(i*1.7)*1.4);}
 sparks.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
 const sparkMaterial=new THREE.PointsMaterial({color:0xff9b55,size:.025,transparent:true,opacity:.45,depthWrite:false});
 sculpture.add(new THREE.Points(sparks,sparkMaterial));
 let renderedFrames=0,frame=0,last=0,elapsed=0,scroll=0,targetScroll=0,focus=0,targetFocus=0,px=0,py=0,tx=0,ty=0,disposed=false;
 const home=!!document.querySelector('.hero');
 const landmarks=home?[...document.querySelectorAll('main>section')]:[document.querySelector('.perspective-intro')||document.querySelector('.case-intro'),document.querySelector('.archive-toolbar')||document.querySelector('.case-body')].filter(Boolean);
 let landmarkTops=[];
 const readScroll=()=>{const y=scrollY+innerHeight*.35;let chapter=0;
  for(let i=0;i<landmarkTops.length;i++)if(y>=landmarkTops[i])chapter=i+Math.min(1,(y-landmarkTops[i])/Math.max(innerHeight,(landmarkTops[i+1]||document.documentElement.scrollHeight)-landmarkTops[i]));
  targetScroll=chapter;host.dataset.chapter=String(Math.floor(chapter));};
 const updateLayout=()=>{landmarkTops=landmarks.map(el=>el.getBoundingClientRect().top+scrollY);readScroll();};
 const draw=()=>{const worldH=2*Math.tan(THREE.MathUtils.degToRad(19))*11,worldW=worldH*camera.aspect,intro=Math.max(0,1-scroll),small=innerWidth<721;
  const nx=home?.66+Math.min(scroll,1)*.32:.84+Math.min(scroll,1)*.09,ny=home?.48:.34;
  sculpture.position.set((nx-.5)*worldW+px*.28,(.5-ny)*worldH-py*.2,0);
  sculpture.rotation.set(.48+py*.38+scroll*.14,-.58+px*.7+scroll*.8,-.34+Math.sin(elapsed*.13)*.12+scroll*.1);
  sculpture.scale.setScalar(small?.76:(home?1.05:intro*.18+.95));camera.position.x=px*.34;camera.position.y=-py*.22;camera.lookAt(0,0,0);
  uniforms.uTime.value=elapsed;uniforms.uMorph.value=scroll;uniforms.uAlpha.value=small?.29:(home?.38+intro*.5:.38+intro*.2);uniforms.uFocus.value=focus;sparkMaterial.opacity=uniforms.uAlpha.value*.5;
  renderer.render(scene,camera);host.dataset.frames=String(++renderedFrames);host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);host.dataset.pose=[px.toFixed(2),py.toFixed(2),scroll.toFixed(2)].join(',');};
 const tick=time=>{frame=0;if(paused||document.hidden||disposed||root.classList.contains('gallery-open'))return;const interval=fine.matches?1000/45:1000/30;
  if(time-last>=interval){const dt=Math.min((time-last)/1000,.08);last=time;elapsed+=dt;const ease=1-Math.exp(-dt*5.5);px+=(tx-px)*ease;py+=(ty-py)*ease;scroll+=(targetScroll-scroll)*ease;focus+=(targetFocus-focus)*ease;draw();}
  frame=requestAnimationFrame(tick);};
 const start=()=>{if(!frame&&!paused&&!document.hidden&&!disposed&&!root.classList.contains('gallery-open')){last=performance.now();frame=requestAnimationFrame(tick);}};
 const stop=()=>{cancelAnimationFrame(frame);frame=0;};
 document.addEventListener('portfolio:gallerychange',event=>event.detail.open?stop():start());
 const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();updateLayout();if(paused){scroll=targetScroll;draw();}};
 resize();scroll=targetScroll;draw();host.dataset.renderer='three-shared';
 const observer=new ResizeObserver(updateLayout);observer.observe(document.querySelector('main'));
 window.addEventListener('resize',resize,{passive:true});window.addEventListener('scroll',readScroll,{passive:true});
 window.addEventListener('pointermove',e=>{if(paused||!fine.matches||e.pointerType!=='mouse')return;tx=e.clientX/innerWidth*2-1;ty=e.clientY/innerHeight*2-1;},{passive:true});
 root.addEventListener('pointerleave',()=>{tx=ty=0;});document.addEventListener('portfolio:cardfocus',e=>{targetFocus=e.detail.active?1:0;});
 const sync=()=>{setState();if(paused){stop();tx=ty=px=py=0;draw();}else start();};
 reduce.addEventListener('change',e=>{paused=e.matches;sync();});fine.addEventListener('change',()=>{tx=ty=0;});
 document.addEventListener('visibilitychange',()=>{document.hidden?stop():start();});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();host.dataset.renderer='static-fallback';});
 window.addEventListener('pagehide',e=>{stop();if(e.persisted)return;disposed=true;observer.disconnect();geo.dispose();lineGeo.dispose();sparks.dispose();surface.dispose();edge.dispose();sparkMaterial.dispose();renderer.dispose();});
 window.addEventListener('pageshow',e=>{if(e.persisted){resize();start();}});start();
}catch(error){host.dataset.renderer='static-fallback';root.dataset.motion=reduce.matches?'paused':'running';console.info('Decorative scene unavailable; page content remains usable.');}
