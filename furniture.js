import * as T from './assets/vendor/three.module.js';
import {box,mesh,sphere,cylinder,lathe,tube,line,torus,roundedShape} from './geometry.js';
import {contactShadow,rng} from './materials.js';
import {drawArtwork} from './assets/prop-artwork.js';

export function createFurniture(root,m){
 const colliders=[],lamps=[],targets=[];
 function rect(x,z,w,d,angle=0){colliders.push({type:'box',x,z,w,d,angle});}
 function circle(x,z,r){colliders.push({type:'circle',x,z,r});}
 function group(x,y,z,rot=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rot;root.add(g);return g;}
 function book(g,x,y,z,w=.24,d=.18,col=m.bookGreen,angle=0){
  const b=new T.Group();g.add(b);b.position.set(x,y,z);b.rotation.y=angle;
  box(b,[w,.045,d],m.pages,[0,.028,0],.006);for(const h of [.004,.054])box(b,[w+.012,.008,d+.008],col,[0,h,0],.003);
  box(b,[.012,.05,d],col,[-w/2,.029,0],.004);for(let j=0;j<3;j++)box(b,[.003,.003,d*.7],m.bronze,[-w/2-.007,.017+j*.012,0],.001);
 }
 function lamp(g,id,name,x,y,z,scale=1){
  const l=new T.Group();l.position.set(x,y,z);l.scale.setScalar(scale);g.add(l);
  cylinder(l,.10,.025,m.bronze,[0,.013,0]);
  lathe(l,[[0,0],[.065,.015],[.07,.06],[.055,.12],[.077,.19],[.065,.24],[.028,.30],[.026,.35]],m.vase);
  cylinder(l,.015,.10,m.bronze,[0,.34,0]);
  const shade=new T.MeshStandardMaterial({color:0xe6dcc2,emissive:0xffd89f,emissiveIntensity:.72,roughness:.95,side:T.DoubleSide});
  const shadeMesh=mesh(l,new T.CylinderGeometry(.15,.23,.27,48,1,true),shade,[0,.49,0]);shadeMesh.castShadow=false;shadeMesh.userData.dynamic=true;
  for(const h of [.355,.625])torus(l,h<.4?.23:.15,.006,m.ceramic,[0,h,0],[Math.PI/2,0,0]);
  const bulbMat=new T.MeshBasicMaterial({color:0xffe5b6,toneMapped:false});const bulb=sphere(l,.036,bulbMat,[0,.43,0]);bulb.userData.dynamic=true;bulb.castShadow=false;
  l.updateWorldMatrix(true,true);const pos=new T.Vector3();l.localToWorld(pos.set(0,.43,0));
  lamps.push({id,name,position:pos,shade,bulbMat,basePower:id==='table'?29:18});targets.push({type:'lamp',id,label:name,position:pos.clone(),radius:2.25});
  return l;
 }
 // The leaf section follows the curved procedural leaves in Sky-Explorer-VR's
 // prop-detail-models.js; scaled and recoloured for the ficus in the reference.
 function leafGeometry(){const ps=[],uv=[];const at=(t,u)=>[u*.5*Math.pow(Math.sin(Math.PI*t),.72),.10*Math.sin(Math.PI*t)-.08*t*t+(1-u*u)*.06,t];for(let i=0;i<7;i++)for(let j=0;j<2;j++){const a=[i/7,j-1],b=[i/7,j],c=[(i+1)/7,j],d=[(i+1)/7,j-1];for(const p of [a,c,b,a,d,c]){ps.push(...at(...p));uv.push(p[1]*.5+.5,p[0]);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}
 const leafGeo=leafGeometry();
 function plant(g,size=1,large=true,seed=37){
  const r=rng(seed),H=large?.46:.14,R=large?.38:.10;
  if(large){box(g,[.78,.47,.64],m.ceramic,[0,.24,0],.045);box(g,[.69,.015,.55],m.soil,[0,.48,0],.04);}
  else {lathe(g,[[0,0],[R*.8,0],[R*.85,.03],[R,H],[R*.88,H+.005],[R*.8,.04],[0,.04]],m.ceramic);cylinder(g,R*.88,.009,m.soil,[0,H-.005,0]);}
  const count=large?164:46,buckets=[[],[],[],[]],dummy=new T.Object3D();
  for(let branch=0;branch<(large?9:6);branch++){
   const a=branch*2.399,h=large?.65+r()*.9:.13+r()*.14,reach=large?.2+r()*.36:.06+r()*.06;
   const start=[(r()-.5)*R*.4,H,(r()-.5)*R*.4],end=[Math.cos(a)*reach,H+h,Math.sin(a)*reach];
   tube(g,[start,[end[0]*.35,H+h*.55,end[2]*.35],end],large?.015:.003,m.woodEdge,12);
  }
  for(let i=0;i<count;i++){
   const a=i*2.399,level=r(),reach=(large?.58:.14)*Math.sqrt(r())*(.6+.4*Math.sin(level*Math.PI));
   const start=new T.Vector3(Math.cos(a)*reach,H+(.16+level)*(large?1.2:.2),Math.sin(a)*reach),out=new T.Vector3(Math.cos(a)*.7,(r()-.3)*.8,Math.sin(a)*.7).normalize();
   const length=large?.23+r()*.13:.06+r()*.04;dummy.position.copy(start);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),out);dummy.rotateZ(r()*1.6);dummy.scale.set(length*.72,length,length);dummy.updateMatrix();buckets[i%4].push(dummy.matrix.clone());
  }
  buckets.forEach((matrices,i)=>{const im=new T.InstancedMesh(leafGeo,m.leaf[i],matrices.length);matrices.forEach((mat,j)=>im.setMatrixAt(j,mat));im.castShadow=true;im.receiveShadow=true;im.instanceMatrix.needsUpdate=true;g.add(im);});
  g.scale.setScalar(size);return g;
 }
 function armillary(g,x,y,z,r=.16){
  const a=new T.Group();a.position.set(x,y,z);g.add(a);cylinder(a,r*.65,.04,m.woodEdge,[0,.02,0]);cylinder(a,r*.48,.009,m.bronze,[0,.043,0]);line(a,[0,.04,0],[0,.13,0],.018,m.bronze);
  for(const rot of [[0,0,0],[Math.PI/2,0,.4],[.3,Math.PI/2,0]])torus(a,r,.005,m.bronze,[0,r+.12,0],rot);
  sphere(a,r*.15,m.bronze,[0,r+.12,0]);line(a,[-r*.4,.1,0],[r*.4,r*2+.15,0],.004,m.bronze);
 }
 function cabinet(x,z,w,d,h,rot=0){
  const g=group(x,0,z,rot);box(g,[w,h-.13,d],m.wood,[0,h/2,0],.065);
  box(g,[w+.04,.055,d+.045],m.woodEdge,[0,h,0],.07);box(g,[w-.06,.02,d-.02],m.wood,[0,h+.037,0],.05);
  for(let px=-w/2+.05;px<w/2-.03;px+=.038)box(g,[.019,h-.22,.034],m.woodEdge,[px,h/2,d/2+.015],.008);
  for(const dx of [-.07,.07])line(g,[dx,h*.42,d/2+.045],[dx,h*.60,d/2+.045],.009,m.bronze);
  for(const xx of [-w/2+.16,w/2-.16])for(const zz of [-d/2+.10,d/2-.10])cylinder(g,.038,.12,m.bronze,[xx,.06,zz]);
  rect(x,z,w,d,rot);contactShadow(root,x,z,rot?w+1:w+.45,rot?w+.4:d+.5,.45);return g;
 }
 // One curved, upholstered armchair with turned front legs and cabriole arms.
 const chair=group(1.05,0,.43,.13);
 const backGeo=new T.ExtrudeGeometry(roundedShape(.98,.94,.21),{depth:.15,bevelEnabled:true,bevelSize:.055,bevelThickness:.04,bevelSegments:3,curveSegments:20});
 const p=backGeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setXYZ(i,x,y+.99,p.getZ(i)+.30-.36*x*x+y*.11);}backGeo.computeVertexNormals();mesh(chair,backGeo,m.fabric);
 box(chair,[.93,.13,.86],m.woodEdge,[0,.47,-.04],.08);
 box(chair,[.91,.20,.84],m.fabric,[0,.59,-.075],.095);
 const cushion=box(chair,[.49,.29,.16],m.rug,[0,.78,.19],.075);cushion.rotation.x=-.17;
 // Curved piping follows the crown and the side edges of the padded back.
 tube(chair,[[-.47,.62,.27],[-.48,1.18,.30],[-.39,1.43,.29],[0,1.49,.40],[.39,1.43,.29],[.48,1.18,.30],[.47,.62,.27]],.016,m.woodEdge,58);
 tube(chair,[[-.44,.63,-.43],[-.45,.65,.20],[0,.65,.31],[.45,.65,.20],[.44,.63,-.43]],.006,m.piping,38);
 for(const s of [-1,1]){
  tube(chair,[[s*.46,.64,-.38],[s*.50,.82,-.36],[s*.49,.90,-.18],[s*.48,.92,.15],[s*.45,1.09,.32]],.035,m.woodEdge,22);
  tube(chair,[[s*.47,.84,-.32],[s*.49,.88,-.18],[s*.47,.92,.16],[s*.44,1.03,.28]],.055,m.fabric,24);
  lathe(chair,[[.027,0],[.039,.04],[.024,.09],[.025,.15],[.044,.20],[.047,.23],[.035,.27],[.03,.34],[.045,.43]],m.woodEdge,[s*.38,0,-.32],20);
  tube(chair,[[s*.42,.04,.48],[s*.38,.23,.38],[s*.36,.48,.27]],.029,m.woodEdge,15);
  sphere(chair,.055,m.woodEdge,[s*.46,.81,-.36]);
 }
 rect(1.05,.43,1.15,1.14,.13);contactShadow(root,1.05,.43,1.6,1.65,.65).position.y=.045;
 // Side table and central warm ceramic lamp.
 const table=group(-.53,0,-.66);cylinder(table,.58,.065,m.woodEdge,[0,.71,0]);cylinder(table,.55,.022,m.wood,[0,.754,0]);torus(table,.552,.008,m.bronze,[0,.762,0],[Math.PI/2,0,0]);
 lathe(table,[[.07,.13],[.10,.18],[.065,.26],[.052,.47],[.12,.61],[.14,.68]],m.woodEdge);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;const v=(r,y)=>[Math.cos(a)*r,y,Math.sin(a)*r];tube(table,[v(.08,.41),v(.15,.21),v(.30,.09),v(.43,.065)],.033,m.woodEdge,18);}
 lamp(table,'table','Lámpara de la mesa',.24,.768,-.06,1);
 const small=new T.Group();small.position.set(-.23,.768,-.04);table.add(small);plant(small,1,false,48);
 lathe(table,[[0,0],[.07,0],[.08,.016],[.08,.035],[.067,.027],[0,.02]],m.bronze,[-.02,.769,.28],24);sphere(table,.025,m.ceramic,[.005,.805,.28],[1,.5,1]);
 circle(-.53,-.66,.63);contactShadow(root,-.53,-.66,1.65,1.6,.60).position.y=.045;
 // Left credenza, astronomical ornament, books and a lit sepia landscape.
 const left=cabinet(-4.0,-.9,2.55,.67,.92,Math.PI/2);
 lamp(left,'left','Lámpara del aparador',.80,.962,0,.82);
 book(left,.22,.96,.01,.32,.22,m.leather,.06);book(left,.22,1.02,.01,.29,.20,m.bookRed,-.04);armillary(left,-.76,.96,.02,.17);armillary(left,-.34,.96,.03,.12);
 const artwork=document.createElement('canvas');artwork.width=768;artwork.height=512;const ac=artwork.getContext('2d'),ar=rng(74);
 const gradient=ac.createLinearGradient(0,0,0,512);gradient.addColorStop(0,'#8d8573');gradient.addColorStop(1,'#c6b696');ac.fillStyle=gradient;ac.fillRect(0,0,768,512);
 for(let l=0;l<5;l++){ac.fillStyle=['#8a8270','#77705d','#625e4c','#484b3b','#353b2e'][l];ac.beginPath();ac.moveTo(0,512);for(let x=0;x<=768;x+=8)ac.lineTo(x,195+l*45+Math.sin(x*.012+l*3)*42+ar()*18);ac.lineTo(768,512);ac.fill();}
 for(let i=0;i<18000;i++){ac.fillStyle=ar()>.5?'#ddd6be0b':'#19170b0d';ac.fillRect(ar()*768,ar()*512,2,2);}
 const artMat=new T.MeshStandardMaterial({map:new T.CanvasTexture(artwork),roughness:.9});artMat.map.colorSpace=T.SRGBColorSpace;
 const frame=group(-4.34,1.94,-.90,Math.PI/2);box(frame,[1.24,.90,.055],m.woodEdge,[0,0,0],.025);box(frame,[1.16,.82,.058],m.bronze,[0,0,.01],.015);box(frame,[1.11,.77,.06],m.pages,[0,0,.022],.008);mesh(frame,new T.PlaneGeometry(.95,.62),artMat,[0,0,.055]);
 line(frame,[-.32,.57,0],[-.32,.57,.16],.018,m.bronze);line(frame,[.32,.57,0],[.32,.57,.16],.018,m.bronze);box(frame,[.80,.035,.09],m.bronze,[0,.57,.18],.015);
 const pictureGlow=new T.MeshStandardMaterial({color:0xffe1a7,emissive:0xffd398,emissiveIntensity:1.2});const pg=box(frame,[.72,.009,.05],pictureGlow,[0,.547,.18],.003);pg.userData.dynamic=true;
 // The two full plants occupy the window corners, leaving the panoramic view.
 for(const [x,seed] of [[-3.63,18],[3.63,42]]){const g=group(x,0,-3.01);plant(g,1,true,seed);rect(x,-3.01,.86,.78);contactShadow(root,x,-3.01,1.4,1.3,.55);}
 const right=cabinet(4.02,.60,2.25,.65,.84,-Math.PI/2);box(right,[2.26,.035,.67],m.marble,[0,.90,0],.05);book(right,-.66,.92,.01,.34,.23,m.bookRed,.06);book(right,-.66,.983,.01,.3,.23,m.leather,-.07);
 lamp(right,'right','Lámpara lateral',.69,.92,.02,.78);armillary(right,-.06,.92,.03,.15);
 // Low rear furniture and a 30-cover record cabinet.
 const shelf=group(0,0,3.60,Math.PI);
 box(shelf,[5.34,.63,.62],m.wood,[0,.37,0],.065);box(shelf,[5.42,.07,.68],m.woodEdge,[0,.72,0],.045);
 for(const x of [-2.5,-1.25,0,1.25,2.5])box(shelf,[.026,.50,.03],m.bronze,[x,.38,.325],.005);
 box(shelf,[5.32,1.77,.08],m.wood,[0,1.65,-.23],.02);
 for(const x of [-2.66,2.66])box(shelf,[.09,1.89,.44],m.woodEdge,[x,1.65,-.04],.028);
 for(const y of [.78,1.36,1.94,2.52]){box(shelf,[5.35,.048,.46],m.wood,[0,y,-.02],.012);box(shelf,[5.30,.018,.025],m.bronze,[0,y+.025,.225],.004);}
 for(let col=1;col<10;col++)box(shelf,[.018,1.73,.39],m.woodEdge,[-2.64+col*.528,1.67,-.02],.004);
 rect(0,3.60,5.44,.68,Math.PI);contactShadow(root,0,3.60,6,.9,.4);
 const displayLight=lamp(shelf,'gallery','Lámpara del archivo',-2.92,.64,0,.78);
 const plantBack=group(-3.05,.62,3.55);plant(plantBack,1,false,72);const low=cabinet(-3.31,3.58,1.05,.60,.60);book(low,.1,.64,0,.30,.22,m.bookGreen);
 const globeStand=group(3.49,.65,3.52);cylinder(globeStand,.16,.04,m.woodEdge,[0,.02,0]);cylinder(globeStand,.018,.16,m.bronze,[0,.12,0]);
 const moonCanvas=document.createElement('canvas');moonCanvas.width=moonCanvas.height=512;drawArtwork('moon',moonCanvas.getContext('2d'));const moonMap=new T.CanvasTexture(moonCanvas);moonMap.colorSpace=T.SRGBColorSpace;const globeMat=new T.MeshStandardMaterial({map:moonMap,roughness:.85});sphere(globeStand,.20,globeMat,[0,.36,0]);torus(globeStand,.226,.007,m.bronze,[0,.36,0],[0,0,-.3]);cabinet(3.25,3.58,1.05,.60,.60);
 root.updateMatrixWorld(true);const shelfPoint=new T.Vector3(0,1.65,.4);shelf.localToWorld(shelfPoint);targets.push({type:'gallery',id:'gallery',label:'Archivo personal · 30 carátulas',position:shelfPoint,radius:2.8});
 return {colliders,lamps,targets,shelf,pictureGlow};
}
