import * as T from './three.module.js?v=2.0.0';
import {box,mesh} from './geometry.js?v=2.0.0';
import {mergeGeometries} from './BufferGeometryUtils.js?v=2.0.0';
import {processImage,validateBackup,downloadJSON,MAX_ALBUMS,STATUS} from './storage.js?v=2.0.0';
import {validateSettings} from './settings.js?v=2.0.0';

const $=id=>document.getElementById(id);
export class Gallery{
 constructor(storage,shelf,materials,settings,toast,onLook,shelfMaterials){
  Object.assign(this,{storage,shelf,materials,settings,toast,onLook});this.albums=[];this.selected=null;this.busy=false;this.generation=0;this.pendingImport=null;
  this.atlas=document.createElement('canvas');this.atlas.width=1280;this.atlas.height=1536;this.ctx=this.atlas.getContext('2d');this.texture=new T.CanvasTexture(this.atlas);this.texture.colorSpace=T.SRGBColorSpace;this.texture.anisotropy=4;
  this.shelfMaterials=shelfMaterials||Array.from({length:3},()=>[]);
  this.coverMaterials=Array.from({length:3},(_,i)=>{const mat=new T.MeshStandardMaterial({map:this.texture,emissiveMap:this.texture,roughness:.84});mat.userData.cover=true;this.shelfMaterials[i].push(mat);return mat;});this.sleeves=[];this.faces=[];this.inspection=null;
  this.ray=new T.Raycaster();this.ray.far=4.7;this.screenCenter=new T.Vector2();this.rayHits=[];
  for(let i=0;i<30;i++){
   const g=new T.Group();g.userData.dynamic=true;g.position.set(-2.376+(i%10)*.528,1.075+Math.floor(i/10)*.58,.10);g.rotation.x=-.08;shelf.add(g);
   const row=Math.floor(i/10),local=this.shelfMaterials[row];
   box(g,[.477,.484,.03],local[2]||materials.leather,[0,0,0],.01);box(g,[.46,.467,.008],local[3]||materials.pages,[0,0,.019],.005);
   const geo=new T.PlaneGeometry(.436,.443),uv=geo.attributes.uv;for(let j=0;j<uv.count;j++)uv.setXY(j,((i%5)+uv.getX(j))/5,1-(Math.floor(i/5)+(1-uv.getY(j)))/6);
   const face=mesh(g,geo,this.coverMaterials[row],[0,0,.025]);face.castShadow=false;g.userData.slot=i;g.userData.home=g.position.clone();g.userData.homeQuaternion=g.quaternion.clone();this.sleeves.push(g);this.faces.push(face);
  }
  this.buildShelfBatches();this.bind();
 }
 // Nine draw calls for thirty complete covers. A single cover is detached
 // from these batches only while it is being inspected.
 buildShelfBatches(){
  this.batches=[];const container=new T.Group();container.userData.dynamic=true;container.name='Batched archive covers';this.shelf.add(container);
  for(let row=0;row<3;row++){
   const sleeves=this.sleeves.slice(row*10,row*10+10),matrices=[[],[]],instances=[];
   for(let part=0;part<2;part++){
    const first=sleeves[0].children[part],batch=new T.InstancedMesh(first.geometry,first.material,10);batch.castShadow=true;batch.receiveShadow=true;
    sleeves.forEach((g,i)=>{g.updateMatrix();const child=g.children[part];child.updateMatrix();const matrix=new T.Matrix4().multiplyMatrices(g.matrix,child.matrix);matrices[part].push(matrix);batch.setMatrixAt(i,matrix);});batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();container.add(batch);instances.push(batch);
   }
   const geos=sleeves.map((g,i)=>{const face=this.faces[row*10+i];face.updateMatrix();return face.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(g.matrix,face.matrix));});
   const geometry=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());const face=mesh(container,geometry,this.coverMaterials[row]);face.castShadow=false;
   this.batches.push({instances,matrices,geometry,originalPositions:geometry.attributes.position.array.slice()});sleeves.forEach(g=>g.visible=false);
  }
  this.zeroMatrix=new T.Matrix4().makeScale(0,0,0);
 }
 setSlotVisible(index,visible){
  const row=Math.floor(index/10),col=index%10,b=this.batches[row];for(let p=0;p<2;p++){b.instances[p].setMatrixAt(col,visible?b.matrices[p][col]:this.zeroMatrix);b.instances[p].instanceMatrix.needsUpdate=true;}
  const positions=b.geometry.attributes.position,start=col*12;for(let n=start;n<start+12;n++)positions.array[n]=visible?b.originalPositions[n]:0;positions.needsUpdate=true;this.sleeves[index].visible=!visible;
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
  }this.texture.needsUpdate=true;this.onVisualChange?.();
 }
 renderList(){
  $('collection-count').textContent=`${this.albums.length} / 30`;$('gallery-empty').hidden=this.albums.length>0;$('add-images').disabled=this.albums.length>=30;
  const grid=$('album-grid');grid.replaceChildren();this.albums.forEach((a,i)=>{const card=document.createElement('div');card.className='album-card';card.dataset.album=a.id;const button=document.createElement('button');button.className='album-open';button.setAttribute('aria-label','Abrir '+a.title);const img=document.createElement('img');img.src=a.thumb;img.alt=a.title;img.loading='lazy';const title=document.createElement('strong');title.textContent=a.title;const status=document.createElement('span');status.textContent=a.status;status.className='album-status';button.append(img,title,status);button.onclick=()=>this.openAlbum(a.id);const handle=document.createElement('button');handle.className='drag-handle';handle.textContent='⠿';handle.dataset.drag=a.id;handle.setAttribute('aria-label','Arrastrar para ordenar '+a.title);const n=document.createElement('small');n.textContent=String(i+1).padStart(2,'0');card.append(button,handle,n);grid.append(card);});
 }
 openAlbum(id){
  const index=this.albums.findIndex(a=>a.id===id),a=this.albums[index];if(!a)return;this.selected=id;$('gallery-list').hidden=true;$('album-detail').hidden=false;$('delete-confirm').hidden=true;$('album-image').src=a.image;$('album-image').alt=a.title;$('album-title').value=a.title;$('album-theme').value=a.theme;$('album-notes').value=a.notes;$('album-status').value=a.status;$('album-position').textContent=`Carátula ${index+1} de ${this.albums.length}`;$('move-before').disabled=index===0;$('move-after').disabled=index===this.albums.length-1;
 }
 open(){this.selected=null;$('gallery-list').hidden=false;$('album-detail').hidden=true;this.renderList();}
 // A separate inspection state never follows the editor's selected album.
 pick(camera){
  if(this.inspection)return null;this.rayHits.length=0;this.ray.setFromCamera(this.screenCenter,camera);this.ray.intersectObjects(this.sleeves,true,this.rayHits);
  for(const hit of this.rayHits){let object=hit.object;while(object&&object.parent!==this.shelf)object=object.parent;const slot=object?.userData.slot;if(Number.isInteger(slot))return this.albums[slot]?{slot,id:this.albums[slot].id,title:this.albums[slot].title}:null;}return null;
 }
 beginInspection(index,camera,baseFov=camera.fov){
  if(this.inspection||!this.albums[index])return false;
  const sleeve=this.sleeves[index],face=this.faces[index],home=sleeve.userData.home.clone(),homeQuaternion=sleeve.userData.homeQuaternion.clone();
  this.shelf.updateWorldMatrix(true,true);camera.updateWorldMatrix(true,false);
  const position=new T.Vector3();sleeve.getWorldPosition(position);const distance=Math.min(.80,Math.max(.28,position.distanceTo(camera.position)*.64));
  const forward=new T.Vector3();camera.getWorldDirection(forward);const up=new T.Vector3(0,1,0).applyQuaternion(camera.quaternion);const target=camera.position.clone().addScaledVector(forward,distance).addScaledVector(up,2*distance*Math.tan(T.MathUtils.degToRad(baseFov)*.5)*.12);this.shelf.worldToLocal(target);
  const parentInverse=this.shelf.getWorldQuaternion(new T.Quaternion()).invert(),baseQuaternion=parentInverse.multiply(camera.getWorldQuaternion(new T.Quaternion()));
  const scale=Math.min(1,2*distance*Math.tan(T.MathUtils.degToRad(baseFov)*.5)*Math.min(1,camera.aspect)*.72/.49);
  const state={index,id:this.albums[index].id,sleeve,face,home,homeQuaternion,target,targetQuaternion:baseQuaternion.clone(),baseQuaternion,scale,originalMaterial:face.material,originalGeometry:face.geometry,phase:'out',yaw:0,pitch:0,drag:new T.Quaternion(),euler:new T.Euler(0,0,0,'YXZ'),moving:true};
  this.setSlotVisible(index,false);this.inspection=state;
  // Decode the full saved image only while inspecting. The shelf keeps its atlas.
  this.image(this.albums[index].image).then(img=>{
   if(this.inspection!==state||state.phase==='return')return;
   const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d');ctx.fillStyle='#d9d0b8';ctx.fillRect(0,0,1024,1024);
   const fit=Math.min(960/img.width,960/img.height),w=img.width*fit,h=img.height*fit;ctx.drawImage(img,(1024-w)/2,(1024-h)/2,w,h);
   const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
   state.texture=texture;state.material=state.originalMaterial.clone();state.material.map=texture;state.material.emissiveMap=texture;state.material.userData.cover=true;
   state.face.material=state.material;state.face.geometry=new T.PlaneGeometry(.436,.443);this.shelfMaterials[Math.floor(index/10)].push(state.material);this.onVisualChange?.();
  }).catch(()=>this.toast('Vista de detalle no disponible; se muestra la miniatura guardada.'));
  return true;
 }
 rotateInspection(dx,dy){const s=this.inspection;if(!s||s.phase!=='out')return;s.yaw=T.MathUtils.clamp(s.yaw+dx*.006,-1.05,1.05);s.pitch=T.MathUtils.clamp(s.pitch+dy*.006,-.65,.65);s.euler.set(s.pitch,s.yaw,0,'YXZ');s.drag.setFromEuler(s.euler);s.targetQuaternion.copy(s.baseQuaternion).multiply(s.drag);s.moving=true;}
 endInspection(onReturn){const s=this.inspection;if(!s||s.phase==='return')return false;s.phase='return';s.target.copy(s.home);s.targetQuaternion.copy(s.homeQuaternion);s.scale=1;s.moving=true;s.onReturn=onReturn;return true;}
 releaseInspection(s){
  s.sleeve.position.copy(s.home);s.sleeve.quaternion.copy(s.homeQuaternion);s.sleeve.scale.setScalar(1);
  if(s.material){s.face.geometry.dispose();s.face.geometry=s.originalGeometry;s.face.material=s.originalMaterial;const row=this.shelfMaterials[Math.floor(s.index/10)],i=row.indexOf(s.material);if(i>=0)row.splice(i,1);s.material.dispose();s.texture.dispose();}
  this.setSlotVisible(s.index,true);this.inspection=null;
 }
 update(dt){
  const s=this.inspection;if(!s||!s.moving)return false;const a=1-Math.exp(-dt*12);s.sleeve.position.lerp(s.target,a);s.sleeve.quaternion.slerp(s.targetQuaternion,a);s.sleeve.scale.setScalar(T.MathUtils.lerp(s.sleeve.scale.x,s.scale,a));
  if(s.sleeve.position.distanceToSquared(s.target)<1e-7&&s.sleeve.quaternion.angleTo(s.targetQuaternion)<.001&&Math.abs(s.sleeve.scale.x-s.scale)<.001){s.sleeve.position.copy(s.target);s.sleeve.quaternion.copy(s.targetQuaternion);s.sleeve.scale.setScalar(s.scale);s.moving=false;if(s.phase==='return'){this.releaseInspection(s);s.onReturn?.();}}
  return true;
 }
 dispose(){if(this.inspection)this.releaseInspection(this.inspection);this.texture.dispose();this.coverMaterials.forEach(m=>m.dispose());}

}
