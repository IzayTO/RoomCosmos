import * as T from './assets/vendor/three.module.js';
export const rng=(seed=941)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function canvasTexture(w,h,draw,color=true){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;}
function woodTexture(){return canvasTexture(1024,1024,(c,w,h)=>{
 const r=rng(73);c.fillStyle='#59422e';c.fillRect(0,0,w,h);
 for(let j=0;j<16;j++){const y=j*64,light=24+r()*9;c.fillStyle=`hsl(29 27% ${light}%)`;c.fillRect(0,y,w,64);c.fillStyle='#1e160e';c.fillRect(0,y,w,1.4);
  for(let n=0;n<150;n++){const py=y+r()*64,freq=1+r()*4;c.strokeStyle=`rgba(${r()>.35?'19,10,4':'182,142,92'},${.025+r()*.12})`;c.lineWidth=.35+r();c.beginPath();for(let x=0;x<=w;x+=8){const v=py+Math.sin(x*.006*freq+j*3)*(.3+r()*1.2);x?c.lineTo(x,v):c.moveTo(x,v);}c.stroke();}
  const cut=(j%4)*211+67;c.fillStyle='#231a11';c.fillRect(cut,y,1,64);c.fillRect(cut+650,y,1,64);
 }
 const im=c.getImageData(0,0,w,h);for(let i=0;i<im.data.length;i+=4){const n=(r()-.5)*5;for(let j=0;j<3;j++)im.data[i+j]+=n;}c.putImageData(im,0,0);
 });}
function weave(){return canvasTexture(256,256,(c,w,h)=>{const r=rng(92);c.fillStyle='#b8ac97';c.fillRect(0,0,w,h);for(let x=0;x<w;x+=2){c.fillStyle=x%4?'#ffffff18':'#30261628';c.fillRect(x,0,1,h);}for(let y=0;y<h;y+=2){c.fillStyle=y%4?'#ffffff18':'#30261628';c.fillRect(0,y,w,1);}for(let i=0;i<10000;i++){c.fillStyle=`rgba(42,32,20,${r()*.09})`;c.fillRect(r()*w,r()*h,1,1);}});}
export function createMaterials(renderer){
 const wood=woodTexture(),cloth=weave();wood.repeat.set(2.5,2.4);
 const furnitureWood=wood.clone();furnitureWood.repeat.set(.7,.8);
 const rugTex=cloth.clone();rugTex.repeat.set(28,20);const chairTex=cloth.clone();chairTex.repeat.set(5,5);
 const noise=canvasTexture(128,128,(c,w,h)=>{const im=c.createImageData(w,h),r=rng(341);for(let i=0;i<im.data.length;i+=4){const v=170+r()*25;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}c.putImageData(im,0,0);},false);
 const p=(color,roughness=.55,metalness=0,extra={})=>new T.MeshStandardMaterial({color,roughness,metalness,...extra});
 const m={
  floor:p(0xa38a6b,.3,.03,{map:wood,bumpMap:wood,bumpScale:.004,roughnessMap:noise}),
  wood:p(0x80613e,.34,.02,{map:furnitureWood,bumpMap:furnitureWood,bumpScale:.003}),
  woodEdge:p(0x2c1c10,.28,.05),ivory:p(0xd3cbb7,.44,.16,{bumpMap:noise,bumpScale:.004}),
  trim:p(0xbdb8ab,.34,.25),gasket:p(0x252822,.82),bronze:p(0x8e6f3a,.32,.78),dark:p(0x151712,.75),
  fabric:p(0x8b8072,.94,0,{map:chairTex,bumpMap:chairTex,bumpScale:.012}),
  piping:p(0x5b4b39,.83),rug:p(0xc5b394,1,0,{map:rugTex,bumpMap:rugTex,bumpScale:.005,side:T.DoubleSide}),
  ceramic:p(0xcfc7b3,.23,.03),vase:p(0x46372a,.26,.07),soil:p(0x231e14,1),pages:p(0xd0c5a9,.9),
  leather:p(0x39332b,.77),bookRed:p(0x543f30,.8),bookGreen:p(0x3e4940,.85),marble:p(0x242722,.24,.2,{bumpMap:noise,bumpScale:.003}),
  leaf:[0x304921,0x405527,0x536334,0x344726].map(color=>p(color,.48,0,{side:T.DoubleSide})),
 };
 // A single prefiltered environment gives metal/wood a restrained response.
 // Its intensity follows the lamps, so it cannot light the dark room forever.
 const env=canvasTexture(512,256,(c,w,h)=>{c.fillStyle='#30291f';c.fillRect(0,0,w,h);const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#7d7868');g.addColorStop(.5,'#3e3528');g.addColorStop(1,'#100c08');c.fillStyle=g;c.fillRect(0,0,w,h);c.fillStyle='#d5b87c';for(let i=0;i<3;i++)c.fillRect(40+i*170,90,23,50);c.fillStyle='#a89877';c.fillRect(0,18,w,9);});
 env.mapping=T.EquirectangularReflectionMapping;let target=null;if(renderer){const pmrem=new T.PMREMGenerator(renderer);target=pmrem.fromEquirectangular(env);pmrem.dispose();}env.dispose();m.environment=target?.texture||null;m.environmentTarget=target;
 m.dispose=()=>{target?.dispose();const tex=new Set();for(const v of Object.values(m)){for(const a of Array.isArray(v)?v:[v])if(a?.isMaterial){for(const key of ['map','bumpMap','roughnessMap'])if(a[key])tex.add(a[key]);a.dispose();}}tex.forEach(t=>t.dispose());};return m;
}
let shadowMap;
export function contactShadow(parent,x,z,w,d,opacity=.3){
 if(!shadowMap)shadowMap=canvasTexture(128,128,(c)=>{const g=c.createRadialGradient(64,64,10,64,64,64);g.addColorStop(0,'rgba(0,0,0,.85)');g.addColorStop(.45,'rgba(0,0,0,.5)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,128,128);});
 const m=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:shadowMap,transparent:true,opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.019,z);m.userData.dynamic=true;parent.add(m);return m;
}
