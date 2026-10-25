import * as T from './assets/vendor/three.module.js';
import {createMaterials} from './materials.js';
import {createRoom} from './room.js';
import {createFurniture} from './furniture.js';
import {mergeStatic} from './geometry.js';
import {Lighting} from './lighting.js';
import {Cosmos} from './cosmos.js';
import {Controls} from './controls.js';
import {Storage} from './storage.js';
import {Settings,cloneDefaults} from './settings.js';
import {Gallery} from './gallery.js';
import {AmbientAudio} from './audio.js';

const $=id=>document.getElementById(id);let toastTimer;function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5000);}
let started=false,activePanel=null,uiHidden=false,renderer,scene,camera,controls,lighting,cosmos,gallery,settings,storage,materials,audio,raf=0,currentTarget=null,qualityKey='',dynamicRatio=1,renderScale=1;
const canvas=$('scene'),mobile=matchMedia('(pointer:coarse)').matches;
function fatal(error){console.error(error);$('loading').hidden=true;$('fatal').hidden=false;$('fatal-message').textContent=error.message||String(error);cancelAnimationFrame(raf);}
window.addEventListener('error',e=>{if(!started)fatal(e.error||Error(e.message));});window.addEventListener('unhandledrejection',e=>{console.error(e.reason);toast(e.reason?.message||'No se pudo completar una operación.');});
function selectTab(name){document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===name);b.setAttribute('aria-selected',String(b.dataset.tab===name));});document.querySelectorAll('[data-tab-page]').forEach(p=>p.hidden=p.dataset.tabPage!==name);}
function showPanel(id,tab){if(!started)return;closePanel(false);activePanel=$(id);activePanel.hidden=false;$('scrim').hidden=false;controls.pause();$('hud').hidden=true;$('restore-ui').hidden=true;if(tab)selectTab(tab);activePanel.querySelector('.close').focus();if(id==='gallery-panel')gallery.open();}
function closePanel(resume=true){if(activePanel)activePanel.hidden=true;activePanel=null;$('scrim').hidden=true;if(started&&resume){controls.resume();$('hud').hidden=uiHidden;$('restore-ui').hidden=!uiHidden;canvas.focus();}if(gallery)gallery.selected=null;}
function toggleMenu(){if(!started)return;if(activePanel)closePanel();else showPanel('settings-panel','cosmos');}
function reveal(toggle=true){if(!started||activePanel)return;if(toggle)uiHidden=!uiHidden;else uiHidden=false;$('hud').hidden=uiHidden;$('restore-ui').hidden=!uiHidden;}
function lampSync(){if(!settings)return;const id=$('lamp-select').value,l=settings.value.lamps[id];$('lamp-on').checked=l.on;$('lamp-intensity').value=l.intensity;$('lamp-kelvin').value=l.kelvin;$('lamp-intensity-value').textContent=Math.round(l.intensity*100)+' %';$('lamp-kelvin-value').textContent=Math.round(l.kelvin)+' K';$('quick-lights').setAttribute('aria-label',settings.anyOn?'Apagar todas las luces':'Encender todas las luces');}
function interact(){if(!currentTarget||activePanel||!started)return;if(currentTarget.type==='gallery')showPanel('gallery-panel');else{$('lamp-select').value=currentTarget.id;showPanel('settings-panel','light');lampSync();}}
function resize(){if(!renderer)return;const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setPixelRatio(dynamicRatio*renderScale);renderer.setSize(w,h,false);lighting?.invalidate();}
function applySettings(s){
 if(controls)controls.sensitivity=s.sensitivity;if(camera){camera.fov=s.fov;camera.updateProjectionMatrix();}audio?.setVolume(s.volume);$('fps').hidden=!s.fps;
 if(s.quality!==qualityKey){qualityKey=s.quality;renderScale=1;dynamicRatio=Math.min(devicePixelRatio||1,s.quality==='high'?(mobile?1.6:1.85):s.quality==='low'?1:mobile?1.25:1.45);lighting?.setQuality(s.quality==='auto'?'balanced':s.quality);resize();}
 lampSync();
}
async function boot(){
 if(location.protocol==='file:')throw Error('Publica la carpeta en GitHub Pages y abre su enlace https://. Los módulos 3D no pueden iniciarse haciendo doble clic en index.html.');
 const context=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'high-performance',depth:true});if(!context)throw Error('WebGL 2 no está disponible. Abre el enlace en una versión actual de Safari, Chrome o Edge con la aceleración gráfica activada.');
 renderer=new T.WebGLRenderer({canvas,context,antialias:true,alpha:false});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;renderer.setClearColor(0x000102);
 renderer.debug.onShaderError=(gl,program,vertex,fragment)=>{const info=gl.getProgramInfoLog(program)+' '+gl.getShaderInfoLog(vertex)+' '+gl.getShaderInfoLog(fragment);fatal(Error('El navegador no pudo compilar un material WebGL. '+info));};
 scene=new T.Scene();camera=new T.PerspectiveCamera(65,innerWidth/innerHeight,.055,100);audio=new AmbientAudio();
 materials=createMaterials(renderer);const root=new T.Group();root.name='Room';scene.add(root);
 $('loading-message').textContent='Construyendo la habitación…';await new Promise(requestAnimationFrame);
 const room=createRoom(root,materials),furniture=createFurniture(root,materials);
 try{storage=await new Storage().open();}catch(error){$('storage-warning').hidden=false;toast(error.message);const data={albums:[],settings:null};storage={read:async(s)=>s==='albums'?data.albums:data.settings,write:async(s,k,v)=>{data.settings=v;},saveCollection:async(a,s)=>{data.albums=a;if(s)data.settings=s;},close(){}};}
 settings=new Settings(storage,applySettings,error=>toast('No se pudo guardar. Exporta una copia: '+error.message));await settings.load();
 controls=new Controls(camera,canvas,furniture.colliders,{interact,menu:toggleMenu,reveal});
 gallery=new Gallery(storage,furniture.shelf,materials,settings,toast,p=>controls.lookAt(p));await gallery.load();
 mergeStatic(root);cosmos=new Cosmos(scene);lighting=new Lighting(scene,renderer,materials,room,furniture,mobile);lighting.cosmos=cosmos;
 if(!renderer.extensions.has('EXT_color_buffer_float'))lighting.reflector.getRenderTarget().texture.type=T.UnsignedByteType;
 settings.bind(document);applySettings(settings.value);settings.value.fov=camera.fov;resize();scene.updateMatrixWorld(true);
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>selectTab(b.dataset.tab));document.querySelectorAll('.panel .close').forEach(b=>b.onclick=()=>closePanel());$('scrim').onclick=()=>closePanel();
 $('open-settings').onclick=()=>showPanel('settings-panel','cosmos');$('hide-ui').onclick=()=>reveal();$('restore-ui').onclick=()=>reveal(false);$('quick-lights').onclick=()=>settings.all(!settings.anyOn);$('interaction').onclick=interact;
 $('lamp-select').onchange=lampSync;for(const [id,key]of [['lamp-on','on'],['lamp-intensity','intensity'],['lamp-kelvin','kelvin']])$(id).oninput=e=>settings.lamp($('lamp-select').value,key,key==='on'?e.target.checked:Number(e.target.value));
 $('reset-view').onclick=()=>{controls.pos.set(0,1.64,2.38);controls.yaw=0;controls.pitch=-.06;controls.reset();closePanel();};
 $('enter').onclick=async()=>{started=true;$('welcome').hidden=true;$('hud').hidden=false;controls.resume();controls.lock();canvas.focus();await audio.start(settings.value.volume).catch(()=>{});setTimeout(()=>$('walk-hint').style.opacity='0',10000);};
 // Keyboard focus remains inside the active panel without trapping browser UI.
 document.addEventListener('keydown',e=>{if(e.key!=='Tab'||!activePanel)return;const list=[...activePanel.querySelectorAll('button,input,select,textarea')].filter(n=>!n.disabled&&n.getClientRects().length);const first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);controls.pause();$('fatal').hidden=false;$('fatal-message').textContent='La conexión gráfica se ha interrumpido. Tus imágenes guardadas siguen en el navegador. Vuelve a cargar la página.';});
 canvas.addEventListener('webglcontextrestored',()=>location.reload());window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
 document.addEventListener('visibilitychange',()=>{controls.reset();last=performance.now();if(document.hidden)audio.suspend();else if(started)audio.start(settings.value.volume).catch(()=>{});});
 const forward=new T.Vector3(),direction=new T.Vector3();let interactionTime=0,last=performance.now(),sampleTime=0,frames=0,slow=0;
 function updateInteraction(dt){interactionTime+=dt;if(interactionTime<.09)return;interactionTime=0;currentTarget=null;let score=-1;camera.getWorldDirection(forward);
  if(started&&!activePanel&&!uiHidden)for(const t of furniture.targets){direction.copy(t.position).sub(camera.position);const distance=direction.length();if(distance>t.radius)continue;const dot=direction.normalize().dot(forward),threshold=t.type==='gallery'?.62:.90;if(dot>threshold){const s=dot-distance*.03;if(s>score){score=s;currentTarget=t;}}}
  $('interaction').hidden=!currentTarget;$('reticle').classList.toggle('active',!!currentTarget);if(currentTarget)$('interaction-label').textContent=currentTarget.label;
 }
 function frame(now){
  const raw=(now-last)/1000,dt=Math.min(.05,Math.max(0,raw));last=now;raf=requestAnimationFrame(frame);if(document.hidden)return;
  controls.update(dt);gallery.update(dt);const level=lighting.update(dt,settings.value);cosmos.update(dt,settings.value,level,renderer.getPixelRatio());updateInteraction(dt);
  renderer.info.reset();renderer.render(scene,camera);sampleTime+=raw;frames++;
  if(sampleTime>2.5){const fps=Math.round(frames/sampleTime);$('fps').textContent=`${fps} FPS · ${renderer.info.render.calls} draws · ${Math.round(renderer.getPixelRatio()*100)} %`;
   if(settings.value.quality==='auto'&&started){slow=fps<40?slow+1:Math.max(0,slow-1);if(slow>=2&&renderScale>.62){renderScale=Math.max(.62,renderScale-.08);slow=0;resize();}else if(fps>57&&renderScale<1){renderScale=Math.min(1,renderScale+.025);resize();}}
   sampleTime=0;frames=0;
  }
 }
 renderer.info.autoReset=false;lighting.update(0,settings.value);cosmos.update(0,settings.value,lighting.level,renderer.getPixelRatio());renderer.render(scene,camera);$('loading').hidden=true;$('welcome').hidden=false;raf=requestAnimationFrame(frame);
 window.addEventListener('pagehide',e=>{settings.save();if(e.persisted)return;cancelAnimationFrame(raf);controls.dispose();gallery.dispose();cosmos.dispose();lighting.dispose();audio.dispose();const geos=new Set(),mats=new Set(),tex=new Set();scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const mat of Array.isArray(o.material)?o.material:[o.material])if(mat){mats.add(mat);for(const k of ['map','bumpMap','roughnessMap'])if(mat[k])tex.add(mat[k]);}});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());tex.forEach(t=>t.dispose());materials.dispose();renderer.dispose();storage.close();});
}
boot().catch(fatal);
