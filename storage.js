export const MAX_ALBUMS=30;
export const STATUS=['Pendiente','En preparación','Publicada'];
export class Storage{
 async open(){
  if(!('indexedDB' in window))throw Error('Este navegador no permite guardar la colección. Abre la web en Safari o Chrome, fuera de navegación privada.');
  this.db=await new Promise((resolve,reject)=>{const r=indexedDB.open('cosmic-room',1);r.onupgradeneeded=()=>{r.result.createObjectStore('albums',{keyPath:'id'});r.result.createObjectStore('settings');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Cierra otra pestaña de Cosmic Room para abrir el archivo.'));});
  this.db.onversionchange=()=>this.db.close();return this;
 }
 read(store,key){return new Promise((resolve,reject)=>{const tx=this.db.transaction(store),os=tx.objectStore(store),r=key===undefined?os.getAll():os.get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 write(store,key,value){return new Promise((resolve,reject)=>{const tx=this.db.transaction(store,'readwrite');if(store==='albums')tx.objectStore(store).put(value);else tx.objectStore(store).put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('No se pudo guardar.'));});}
 async saveCollection(albums,settings){
  return new Promise((resolve,reject)=>{const tx=this.db.transaction(['albums','settings'],'readwrite'),os=tx.objectStore('albums');os.clear();albums.forEach(a=>os.put(a));if(settings)tx.objectStore('settings').put(settings,'preferences');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('No se pudo guardar la colección.'));});
 }
 close(){this.db?.close();}
}
export async function processImage(file){
 if(file.size>30*1024*1024)throw Error('La imagen supera 30 MB. Elige una copia más pequeña.');
 if(file.type&&!file.type.startsWith('image/'))throw Error('El archivo debe ser una imagen.');
 const url=URL.createObjectURL(file),img=new Image();
 try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('No se pudo abrir esa imagen. Prueba con JPEG, PNG o WebP.'));img.src=url;});
  if(!img.naturalWidth||!img.naturalHeight)throw Error('Imagen sin dimensiones válidas.');
  function size(max,quality){const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=c.getContext('2d');ctx.fillStyle='#e8dfcd';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',quality);}
  return {image:size(1536,.85),thumb:size(300,.79),width:img.naturalWidth,height:img.naturalHeight};
 }finally{URL.revokeObjectURL(url);img.src='';}
}
export function validateBackup(raw){
 if(!raw||raw.format!=='cosmic-room'||raw.version!==1||!Array.isArray(raw.albums)||raw.albums.length>MAX_ALBUMS)throw Error('Esta copia no pertenece a Cosmic Room o contiene más de 30 imágenes.');
 const ids=new Set();const data=/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
 const albums=raw.albums.map((a,i)=>{
  if(!a||typeof a.id!=='string'||!a.id||a.id.length>90||ids.has(a.id))throw Error('La copia contiene identificadores inválidos o repetidos.');ids.add(a.id);
  if(typeof a.image!=='string'||a.image.length>12e6||!data.test(a.image)||typeof a.thumb!=='string'||a.thumb.length>1e6||!data.test(a.thumb))throw Error('La copia contiene una imagen inválida o demasiado grande.');
  return {id:a.id,order:i,title:String(a.title||'Sin título').slice(0,100),theme:String(a.theme||'').slice(0,100),notes:String(a.notes||'').slice(0,5000),status:STATUS.includes(a.status)?a.status:STATUS[0],image:a.image,thumb:a.thumb,width:Number(a.width)||0,height:Number(a.height)||0};
 });return {albums,settings:raw.settings};
}
export function downloadJSON(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
