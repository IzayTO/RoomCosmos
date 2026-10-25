import * as T from './assets/vendor/three.module.js';
import {box,mesh} from './geometry.js';
import {processImage,validateBackup,downloadJSON,MAX_ALBUMS,STATUS} from './storage.js';
import {validateSettings} from './settings.js';

const $=id=>document.getElementById(id);
export class Gallery{
 constructor(storage,shelf,materials,settings,toast,onLook){
  Object.assign(this,{storage,shelf,materials,settings,toast,onLook});this.albums=[];this.selected=null;this.busy=false;this.generation=0;this.pendingImport=null;
  this.atlas=document.createElement('canvas');this.atlas.width=1280;this.atlas.height=1536;this.ctx=this.atlas.getContext('2d');this.texture=new T.CanvasTexture(this.atlas);this.texture.colorSpace=T.SRGBColorSpace;this.texture.anisotropy=4;
  this.coverMaterial=new T.MeshStandardMaterial({map:this.texture,roughness:.7});this.sleeves=[];
  for(let i=0;i<30;i++){
   const g=new T.Group();g.userData.dynamic=true;g.position.set(-2.376+(i%10)*.528,1.075+Math.floor(i/10)*.58,.10);g.rotation.x=-.08;shelf.add(g);
   box(g,[.477,.484,.03],materials.leather,[0,0,0],.01);box(g,[.46,.467,.008],materials.pages,[0,0,.019],.005);
   const geo=new T.PlaneGeometry(.436,.443),uv=geo.attributes.uv;for(let j=0;j<uv.count;j++)uv.setXY(j,((i%5)+uv.getX(j))/5,1-(Math.floor(i/5)+(1-uv.getY(j)))/6);
   const face=mesh(g,geo,this.coverMaterial,[0,0,.025]);face.castShadow=false;g.userData.slot=i;this.sleeves.push(g);
  }
  this.bind();
 }
 async load(){this.albums=(await this.storage.read('albums')).sort((a,b)=>a.order-b.order).slice(0,30);await this.refresh();}
 bind(){
  const safe=fn=>async(...args)=>{args[0]?.preventDefault?.();if(this.busy)return;try{this.busy=true;$('gallery-busy').hidden=false;await fn(...args);}catch(e){this.toast(e.message||'No se pudo completar la operación.');}finally{this.busy=false;$('gallery-busy').hidden=true;}};
  $('add-images').onclick=()=>{if(this.albums.length===30){this.toast('La estantería está completa. Puedes reemplazar o eliminar una imagen.');return;}$('image-input').click();};
  $('image-input').onchange=safe(async e=>{const files=[...e.target.files];e.target.value='';let added=0;const next=this.albums.slice();for(const f of files){if(next.length===30){this.toast('La estantería admite 30 imágenes.');break;}const image=await processImage(f);next.push({id:crypto.randomUUID?.()||'album-'+Date.now()+'-'+Math.random().toString(16).slice(2),title:f.name.replace(/\.[^.]+$/,'').slice(0,100),theme:'',notes:'',status:'Pendiente',order:next.length,...image});added++;}await this.commit(next);this.toast(`${added} imagen${added===1?'':'es'} guardada${added===1?'':'s'}.`);});
  $('replace-image').onclick=()=>this.selected&&$('replace-input').click();
  $('replace-input').onchange=safe(async e=>{const file=e.target.files[0];e.target.value='';if(!file||!this.selected)return;const image=await processImage(file);await this.commit(this.albums.map(a=>a.id===this.selected?{...a,...image}:a));this.openAlbum(this.selected);this.toast('Imagen reemplazada.');});
  $('album-form').onsubmit=safe(async e=>{e.preventDefault();const id=this.selected;if(!id)return;await this.commit(this.albums.map(a=>a.id===id?{...a,title:$('album-title').value.trim()||'Sin título',theme:$('album-theme').value.trim(),notes:$('album-notes').value,status:$('album-status').value}:a));this.toast('Cambios guardados.');});
  $('delete-image').onclick=()=>{const a=this.albums.find(a=>a.id===this.selected);if(!a)return;$('delete-confirm').hidden=false;};
  $('cancel-delete').onclick=()=>$('delete-confirm').hidden=true;
  $('confirm-delete').onclick=safe(async()=>{await this.commit(this.albums.filter(a=>a.id!==this.selected));this.selected=null;$('delete-confirm').hidden=true;$('album-detail').hidden=true;$('gallery-list').hidden=false;this.toast('Imagen eliminada.');});
  $('album-back').onclick=()=>{this.selected=null;$('album-detail').hidden=true;$('gallery-list').hidden=false;};
  $('move-before').onclick=safe(()=>this.move(this.selected,-1));$('move-after').onclick=safe(()=>this.move(this.selected,1));
  $('export-gallery').onclick=()=>{downloadJSON({format:'cosmic-room',version:1,created:new Date().toISOString(),settings:this.settings.value,albums:this.albums},'Cosmic-Room-copia-'+new Date().toISOString().slice(0,10)+'.json');this.toast('Copia preparada para descargar.');};
  $('import-gallery').onclick=()=>$('backup-input').click();
  $('backup-input').onchange=safe(async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>100*1024*1024)throw Error('La copia supera 100 MB.');let raw;try{raw=JSON.parse(await file.text());}catch{throw Error('No se pudo leer la copia JSON.');}this.pendingImport=validateBackup(raw);$('import-summary').textContent=`Esta copia contiene ${this.pendingImport.albums.length} imágenes. Reemplazará la colección y los ajustes de este dispositivo.`;$('import-confirm').hidden=false;});
  $('cancel-import').onclick=()=>{this.pendingImport=null;$('import-confirm').hidden=true;};
  $('confirm-import').onclick=safe(async()=>{
   if(!this.pendingImport)return;const {albums,settings}=this.pendingImport;
   // Decode every thumbnail before replacing the current database atomically.
   for(const a of albums){await this.image(a.thumb);const full=await this.image(a.image);if(Math.max(full.naturalWidth,full.naturalHeight)>1536)throw Error('La copia contiene una imagen sin comprimir. Exporta una copia nueva desde Cosmic Room.');}
   const clean=validateSettings(settings);clearTimeout(this.settings.timer);await this.storage.saveCollection(albums,clean);this.albums=albums;this.selected=null;this.settings.value=clean;this.settings.changed();this.pendingImport=null;$('import-confirm').hidden=true;$('album-detail').hidden=true;$('gallery-list').hidden=false;await this.refresh();this.toast('Copia importada y guardada.');
  });
  // Pointer-based drag handles work on touch and mouse. Arrow buttons in the
  // detail view offer an alternative that does not depend on dragging.
  const grid=$('album-grid');grid.addEventListener('pointerdown',e=>{const handle=e.target.closest('[data-drag]');if(!handle)return;e.preventDefault();this.drag={id:handle.dataset.drag,pointer:e.pointerId,target:handle.dataset.drag};handle.setPointerCapture(e.pointerId);handle.closest('.album-card').classList.add('dragging');});
  grid.addEventListener('pointermove',e=>{if(this.drag?.pointer!==e.pointerId)return;const item=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-album]');if(item){this.drag.target=item.dataset.album;grid.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));item.classList.add('drop-target');}const r=$('gallery-list').getBoundingClientRect();if(e.clientY<r.top+60)$('gallery-list').scrollTop-=8;if(e.clientY>r.bottom-60)$('gallery-list').scrollTop+=8;});
  grid.addEventListener('pointerup',safe(async e=>{if(this.drag?.pointer!==e.pointerId)return;const {id,target}=this.drag;this.drag=null;grid.querySelectorAll('.dragging,.drop-target').forEach(n=>n.classList.remove('dragging','drop-target'));if(id===target)return;const next=this.albums.slice(),from=next.findIndex(a=>a.id===id),to=next.findIndex(a=>a.id===target);if(from<0||to<0)return;const [a]=next.splice(from,1);next.splice(to,0,a);await this.commit(next);}));
  grid.addEventListener('pointercancel',()=>{this.drag=null;grid.querySelectorAll('.dragging,.drop-target').forEach(n=>n.classList.remove('dragging','drop-target'));});
 }
 image(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Una imagen de la copia no se puede abrir.'));img.src=url;});}
 async commit(next){next=next.map((a,i)=>({...a,order:i}));await this.storage.saveCollection(next);this.albums=next;await this.refresh();}
 async move(id,delta){const i=this.albums.findIndex(a=>a.id===id),j=i+delta;if(i<0||j<0||j>=this.albums.length)return;const next=this.albums.slice();[next[i],next[j]]=[next[j],next[i]];await this.commit(next);this.openAlbum(id);}
 async refresh(){
  this.renderList();const generation=++this.generation,c=this.ctx;c.fillStyle='#9d9685';c.fillRect(0,0,1280,1536);
  const thumbs=await Promise.all(this.albums.map(a=>this.image(a.thumb).catch(()=>null)));if(generation!==this.generation)return;
  for(let i=0;i<30;i++){
   const x=i%5*256,y=Math.floor(i/5)*256;c.fillStyle=this.albums[i]?'#d9d0b8':'#827d6f';c.fillRect(x,y,256,256);c.strokeStyle='#534b3a';c.lineWidth=1;c.strokeRect(x+10,y+10,236,236);
   const img=thumbs[i];if(img){const scale=Math.min(224/img.width,218/img.height),w=img.width*scale,h=img.height*scale;c.drawImage(img,x+(256-w)/2,y+12+(218-h)/2,w,h);c.font='11px sans-serif';c.textAlign='left';c.fillStyle='#463f31';c.fillText(this.albums[i].title.slice(0,28),x+16,y+244);}
   else{c.fillStyle='#bdb7a4';c.textAlign='center';c.font='38px Georgia';c.fillText(String(i+1).padStart(2,'0'),x+128,y+132);c.font='10px sans-serif';c.fillText('ARCHIVO PERSONAL',x+128,y+164);}
  }this.texture.needsUpdate=true;
 }
 renderList(){
  $('collection-count').textContent=`${this.albums.length} / 30`;$('gallery-empty').hidden=this.albums.length>0;$('add-images').disabled=this.albums.length>=30;
  const grid=$('album-grid');grid.replaceChildren();this.albums.forEach((a,i)=>{const card=document.createElement('div');card.className='album-card';card.dataset.album=a.id;const button=document.createElement('button');button.className='album-open';button.setAttribute('aria-label','Abrir '+a.title);const img=document.createElement('img');img.src=a.thumb;img.alt=a.title;img.loading='lazy';const title=document.createElement('strong');title.textContent=a.title;const status=document.createElement('span');status.textContent=a.status;status.className='album-status';button.append(img,title,status);button.onclick=()=>this.openAlbum(a.id);const handle=document.createElement('button');handle.className='drag-handle';handle.textContent='⠿';handle.dataset.drag=a.id;handle.setAttribute('aria-label','Arrastrar para ordenar '+a.title);const n=document.createElement('small');n.textContent=String(i+1).padStart(2,'0');card.append(button,handle,n);grid.append(card);});
 }
 openAlbum(id){
  const index=this.albums.findIndex(a=>a.id===id),a=this.albums[index];if(!a)return;this.selected=id;$('gallery-list').hidden=true;$('album-detail').hidden=false;$('delete-confirm').hidden=true;$('album-image').src=a.image;$('album-image').alt=a.title;$('album-title').value=a.title;$('album-theme').value=a.theme;$('album-notes').value=a.notes;$('album-status').value=a.status;$('album-position').textContent=`Carátula ${index+1} de ${this.albums.length}`;$('move-before').disabled=index===0;$('move-after').disabled=index===this.albums.length-1;const p=new T.Vector3();this.sleeves[index].getWorldPosition(p);this.onLook?.(p);
 }
 open(){this.selected=null;$('gallery-list').hidden=false;$('album-detail').hidden=true;this.renderList();}
 update(dt){for(let i=0;i<this.sleeves.length;i++){const target=this.selected&&this.albums[i]?.id===this.selected ? .28:.10;this.sleeves[i].position.z+=(target-this.sleeves[i].position.z)*(1-Math.exp(-dt*7));}}
 dispose(){this.texture.dispose();this.coverMaterial.dispose();}
}
