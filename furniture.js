import * as T from './three.module.js?v=2.0.0';
import {box,mesh,sphere,cylinder,lathe,tube,line,torus,roundedShape} from './geometry.js?v=2.0.0';
import {contactShadow,rng} from './materials.js?v=2.0.0';
import {drawArtwork} from './prop-artwork.js?v=2.0.0';
import {spaceModel,framedArtwork} from './decor.js?v=2.0.0';

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
 // Indexed curved leaves have smooth normals. Every blade grows from a
 // petiole connected to an explicit branch, rather than a random point in air.
 function leafGeometry(){
  const ps=[],uv=[],indices=[],rows=12,cols=4;
  for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){const t=i/rows,u=j/cols*2-1;ps.push(u*.48*Math.pow(Math.sin(Math.PI*t),.72),.10*Math.sin(Math.PI*t)-.10*t*t+(1-u*u)*.055*Math.sin(Math.PI*t),t);uv.push(j/cols,t);}
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(ps,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
 }
 const leafGeo=leafGeometry(),leafAxis=new T.Vector3(0,0,1);
 function plant(g,size=1,large=true,seed=37){
  const r=rng(seed),H=large?.48:.14,R=large?.38:.10;
  g.name=large?'Ficus with attached leaves':'Table plant with attached leaves';g.userData.plant={branches:0,leaves:0,attached:0};
  if(large){box(g,[.78,.47,.64],m.ceramic,[0,.24,0],.045);box(g,[.69,.015,.55],m.soil,[0,H,0],.04);}
  else {lathe(g,[[0,0],[R*.8,0],[R*.85,.03],[R,H],[R*.88,H+.005],[R*.8,.04],[0,.04]],m.ceramic);cylinder(g,R*.88,.009,m.soil,[0,H-.005,0]);}
  const buckets=[[],[],[],[]],dummy=new T.Object3D(),branches=large?13:7;
  for(let branch=0;branch<branches;branch++){
   const a=branch*2.399,h=large?.55+r()*.88:.12+r()*.13,reach=large?.20+r()*.27:.025+r()*.035;
   const points=[new T.Vector3(Math.cos(a)*R*.10,H-.004,Math.sin(a)*R*.10),new T.Vector3(Math.cos(a)*reach*.28,H+h*.57,Math.sin(a)*reach*.28),new T.Vector3(Math.cos(a)*reach,H+h,Math.sin(a)*reach)];
   const curve=new T.CatmullRomCurve3(points);
   mesh(g,new T.TubeGeometry(curve,14,large?.010:.0028,6,false),m.woodEdge);g.userData.plant.branches++;
   const pairs=large?7:4;
   for(let n=0;n<pairs;n++)for(const sign of [-1,1]){
    const t=.30+.67*(n+.35*(sign>0))/pairs,node=curve.getPoint(t),angle=a+sign*(.7+r()*.5);
    const out=new T.Vector3(Math.cos(angle),.10+r()*.38,Math.sin(angle)).normalize();
    const start=node.clone().addScaledVector(out,large?.035:.009),length=large?.22+r()*.095:.055+r()*.027;
    line(g,node.toArray(),start.toArray(),large?.0025:.0009,m.woodEdge);
    dummy.position.copy(start);dummy.quaternion.setFromUnitVectors(leafAxis,out);dummy.rotateZ((r()-.5)*.55);dummy.scale.set(length*.70,length,length);dummy.updateMatrix();buckets[(branch+n)%4].push(dummy.matrix.clone());
    g.userData.plant.leaves++;g.userData.plant.attached++;
   }
  }
  buckets.forEach((matrices,i)=>{const im=new T.InstancedMesh(leafGeo,m.leaf[i],matrices.length);matrices.forEach((matrix,j)=>im.setMatrixAt(j,matrix));im.name='Attached smooth leaves';im.castShadow=true;im.receiveShadow=true;im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();g.add(im);});
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
 // Trim is sampled from the same outline and deformation as the upholstered
 // back: no detached crown or floating ends. Fine seams remain on the fabric.
 const outline=roundedShape(.98,.94,.21).getPoints(24);
 const contour=(z,inset=1)=>outline.map(v=>[v.x*inset,v.y*inset+.99,z+.30-.36*(v.x*inset)**2+v.y*inset*.11]);
 tube(chair,contour(.015,1.015),.015,m.woodEdge,96);
 tube(chair,contour(-.041,.965),.006,m.piping,96);
 const seatSeam=roundedShape(.87,.80,.115).getPoints(24).map(v=>[v.x,.644,v.y-.075]);tube(chair,seatSeam,.0045,m.piping,96);
 for(const x of [-.23,0,.23]){const button=sphere(chair,.014,m.piping,[x,1.16,.30-.36*x*x+.17*.11-.042],[1,1,.35]);button.name='Upholstery button';}
 tube(chair,[[-.20,.79,.101],[0,.88,.10],[.20,.79,.101]],.0035,m.piping,24);
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
 // Two original Sky Explorer artworks, rocket below, with breathing room
 // between books, astronomical ornament and the table lamp.
 const left=cabinet(-4.0,-.9,2.55,.67,.92,Math.PI/2);
 lamp(left,'left','Lámpara del aparador',.86,.967,0,.82);
 book(left,-.43,.967,.015,.28,.21,m.leather,.04);book(left,-.43,1.025,.015,.25,.19,m.bookRed,-.05);
 armillary(left,-.96,.967,.015,.145);spaceModel(left,'rocket-model',[.10,.967,.01],.78);
 const pictureGlow=new T.MeshStandardMaterial({color:0xffe1a7,emissive:0xffd398,emissiveIntensity:0,roughness:.6});
 for(const [kind,z]of [['lunar-map',-.29],['blueprint',-1.51]]){
  const frame=framedArtwork(root,m,kind,[-4.34,2.10,z],Math.PI/2);
  line(frame,[-.27,.55,0],[-.27,.55,.14],.012,m.bronze);line(frame,[.27,.55,0],[.27,.55,.14],.012,m.bronze);
  box(frame,[.64,.027,.073],m.bronze,[0,.55,.15],.01);
  const pg=box(frame,[.59,.008,.044],pictureGlow,[0,.533,.15],.003);pg.userData.dynamic=true;pg.castShadow=false;
 }
 // The two full plants occupy the window corners, leaving the panoramic view.
 for(const [x,seed] of [[-3.63,18],[3.63,42]]){const g=group(x,0,-3.01);plant(g,1,true,seed);rect(x,-3.01,.86,.78);contactShadow(root,x,-3.01,1.4,1.3,.55);}
 const right=cabinet(4.02,.60,2.25,.65,.84,-Math.PI/2);box(right,[2.26,.035,.67],m.marble,[0,.90,0],.05);book(right,-.66,.92,.01,.34,.23,m.bookRed,.06);book(right,-.66,.983,.01,.3,.23,m.leather,-.07);
 lamp(right,'right','Lámpara lateral',.69,.92,.02,.78);spaceModel(right,'helmet-display',[-.06,.918,.02],1);
 // Low rear furniture and a 30-cover record cabinet.
 const shelf=group(0,0,3.60,Math.PI);shelf.name='Personal archive';
 const shelfMaterials=[],shelfStrips=[];
 for(let i=0;i<3;i++){const wood=m.wood.clone(),edge=m.woodEdge.clone(),leather=m.leather.clone(),paper=m.pages.clone();wood.emissiveMap=wood.map;shelfMaterials.push([wood,edge,leather,paper]);shelfStrips.push(new T.MeshStandardMaterial({color:0xffdfad,emissive:0xffd09a,emissiveIntensity:0,roughness:.6}));}
 box(shelf,[5.34,.63,.62],m.wood,[0,.37,0],.065);box(shelf,[5.42,.07,.68],m.woodEdge,[0,.72,0],.045);
 for(const x of [-2.5,-1.25,0,1.25,2.5])box(shelf,[.026,.50,.03],m.bronze,[x,.38,.325],.005);
 for(let i=0;i<3;i++){
  box(shelf,[5.32,.58,.08],shelfMaterials[i][0],[0,1.075+i*.58,-.23],.012);
  const strip=box(shelf,[5.20,.012,.021],shelfStrips[i],[0,1.322+i*.58,.17],.003);strip.userData.dynamic=true;strip.castShadow=false;
  box(shelf,[5.28,.025,.04],m.woodEdge,[0,1.337+i*.58,.212],.006);
 }
 for(const x of [-2.66,2.66])box(shelf,[.09,1.89,.44],m.woodEdge,[x,1.65,-.04],.028);
 for(const y of [.78,1.36,1.94,2.52]){box(shelf,[5.35,.048,.46],m.wood,[0,y,-.02],.012);box(shelf,[5.30,.018,.025],m.bronze,[0,y+.025,.225],.004);}
 for(let col=1;col<10;col++)box(shelf,[.018,1.73,.39],m.woodEdge,[-2.64+col*.528,1.67,-.02],.004);
 rect(0,3.60,5.44,.68,Math.PI);contactShadow(root,0,3.60,6,.9,.4);
 lamp(shelf,'gallery','Lámpara del archivo',-2.92,.647,0,.78);
 const low=cabinet(-3.31,3.58,1.05,.60,.60);
 const plantBack=new T.Group();plantBack.position.set(.25,.647,-.015);low.add(plantBack);plant(plantBack,1,false,72);
 book(low,-.25,.647,.035,.30,.22,m.bookGreen,.04);
 low.name='Rear cabinet with separated plant and book';
 const globeStand=group(3.49,.65,3.52);cylinder(globeStand,.16,.04,m.woodEdge,[0,.02,0]);cylinder(globeStand,.018,.16,m.bronze,[0,.12,0]);
 const moonCanvas=document.createElement('canvas');moonCanvas.width=moonCanvas.height=512;drawArtwork('moon',moonCanvas.getContext('2d'));const moonMap=new T.CanvasTexture(moonCanvas);moonMap.colorSpace=T.SRGBColorSpace;const globeMat=new T.MeshStandardMaterial({map:moonMap,roughness:.85});sphere(globeStand,.20,globeMat,[0,.36,0]);torus(globeStand,.226,.007,m.bronze,[0,.36,0],[0,0,-.3]);cabinet(3.25,3.58,1.05,.60,.60);
 root.updateMatrixWorld(true);const shelfPoint=new T.Vector3(0,1.65,.4);shelf.localToWorld(shelfPoint);targets.push({type:'gallery',id:'gallery',label:'Archivo personal · 30 carátulas',position:shelfPoint,radius:2.8});
 return {colliders,lamps,targets,shelf,pictureGlow,shelfMaterials,shelfStrips};
}
