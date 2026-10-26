import * as T from './three.module.js?v=2.0.0';
import {RoundedBoxGeometry} from './RoundedBoxGeometry.js?v=2.0.0';
import {mergeGeometries} from './BufferGeometryUtils.js?v=2.0.0';

const cache=new Map();
export function mesh(parent,geo,mat,pos=[0,0,0],rot=[0,0,0],shadow=true){
 const m=new T.Mesh(geo,mat);m.position.set(...pos);m.rotation.set(...rot);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;
}
export function box(parent,size,mat,pos,rad=.025,rot=[0,0,0]){
 const key=size.join(',')+':'+rad;let geo=cache.get(key);
 if(!geo){geo=rad?new RoundedBoxGeometry(...size,2,Math.min(rad,...size.map(v=>v*.45))):new T.BoxGeometry(...size);cache.set(key,geo);}
 return mesh(parent,geo,mat,pos,rot);
}
export function sphere(parent,r,mat,pos,scale=[1,1,1]){const key='s'+r;let g=cache.get(key);if(!g){g=new T.SphereGeometry(r,20,12);cache.set(key,g);}const m=mesh(parent,g,mat,pos);m.scale.set(...scale);return m;}
export function cylinder(parent,r,h,mat,pos,rt=r,segments=32){return mesh(parent,new T.CylinderGeometry(rt,r,h,segments),mat,pos);}
export function lathe(parent,points,mat,pos=[0,0,0],segments=32){return mesh(parent,new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),segments),mat,pos);}
export function tube(parent,points,r,mat,segments=24){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,r,7,false),mat);}
export function line(parent,a,b,r,mat){const av=new T.Vector3(...a),bv=new T.Vector3(...b);const m=mesh(parent,new T.CylinderGeometry(r,r,av.distanceTo(bv),7),mat,av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return m;}
export function torus(parent,r,t,mat,pos,rot=[0,0,0],arc=Math.PI*2){return mesh(parent,new T.TorusGeometry(r,t,6,48,arc),mat,pos,rot);}
export function roundedShape(w,h,r){
 const s=new T.Shape(),x=-w/2,y=-h/2;r=Math.min(r,w/2,h/2);
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
export function ring(parent,w,h,r,border,depth,mat,pos){
 const s=roundedShape(w,h,r),hole=roundedShape(w-border*2,h-border*2,Math.max(.02,r-border));s.holes.push(new T.Path(hole.getPoints(16).reverse()));
 const geo=new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSize:.017,bevelThickness:.017,bevelSegments:2,curveSegments:18});geo.translate(0,0,-depth/2);return mesh(parent,geo,mat,pos);
}
// Freeze immutable furniture/architecture into shared material batches. Dynamic
// lamps, the glass and the gallery atlas retain their independent scene nodes.
export function mergeStatic(root){
 root.updateMatrixWorld(true);const groups=new Map(),remove=[];
 root.traverse(m=>{
  if(!m.isMesh||Array.isArray(m.material)||m.isInstancedMesh)return;
  for(let a=m;a&&a!==root.parent;a=a.parent)if(a.userData.dynamic)return;
  const key=m.material.uuid+':'+m.castShadow;
  let group=groups.get(key);if(!group){group={mat:m.material,cast:m.castShadow,geos:[]};groups.set(key,group);}
  let g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrixWorld);
  for(const name of Object.keys(g.attributes))if(!['position','normal','uv'].includes(name))g.deleteAttribute(name);
  if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  group.geos.push(g);remove.push(m);
 });
 for(const group of groups.values()){
  const g=mergeGeometries(group.geos,false);if(g){const m=new T.Mesh(g,group.mat);m.castShadow=group.cast;m.receiveShadow=true;m.name='Static batch';root.add(m);}
  group.geos.forEach(g=>g.dispose());
 }
 const used=new Set();root.traverse(m=>{if(m.isMesh&&!remove.includes(m))used.add(m.geometry);});
 for(const m of remove){m.removeFromParent();if(!used.has(m.geometry)){m.geometry.dispose();used.add(m.geometry);}}
 cache.clear();
}
