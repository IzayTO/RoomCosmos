import * as T from './assets/vendor/three.module.js';
import {box,mesh,ring,roundedShape} from './geometry.js';
import {contactShadow} from './materials.js';

export const ROOM={width:9,depth:8,height:3.2};
export function createRoom(root,m){
 const windows=[{x:0,y:1.72,w:5.5,h:1.86,r:.66},{x:-3.73,y:1.72,w:1.34,h:1.34,r:.67},{x:3.73,y:1.72,w:1.34,h:1.34,r:.67}];
 const wall=new T.Shape();wall.moveTo(-4.5,0);wall.lineTo(4.5,0);wall.lineTo(4.5,3.2);wall.lineTo(-4.5,3.2);wall.closePath();
 for(const p of windows){const pts=roundedShape(p.w,p.h,p.r).getPoints(28).reverse().map(v=>v.add(new T.Vector2(p.x,p.y)));wall.holes.push(new T.Path(pts));}
 const front=new T.ExtrudeGeometry(wall,{depth:.32,bevelEnabled:false,curveSegments:28});front.translate(0,0,-.16);mesh(root,front,m.ivory,[0,0,-4]);
 box(root,[9.3,.18,8.3],m.woodEdge,[0,-.1,0],.04);
 box(root,[9,.03,8],m.floor,[0,-.005,0],0);
 const glass=[];
 for(const p of windows){
  ring(root,p.w+.36,p.h+.36,p.r+.18,.13,.18,m.ivory,[p.x,p.y,-3.78]);
  ring(root,p.w+.15,p.h+.15,p.r+.075,.052,.075,m.trim,[p.x,p.y,-3.70]);
  ring(root,p.w+.035,p.h+.035,p.r+.017,.027,.06,m.gasket,[p.x,p.y,-3.76]);
  const g=new T.ShapeGeometry(roundedShape(p.w,p.h,p.r),28);g.translate(p.x,p.y,0);glass.push(g);
 }
 // Solid side and rear walls, with visible joints and recessed modular panels.
 for(const x of [-4.6,4.6])box(root,[.2,3.3,8.35],m.gasket,[x,1.6,0],.03);
 for(const side of [-1,1])for(let i=0;i<5;i++){
  box(root,[.16,2.9,1.55],m.ivory,[side*4.48,1.64,-3.2+i*1.6],.025);
  box(root,[.045,.035,1.43],m.trim,[side*4.38,2.85,-3.2+i*1.6],.009);
 }
 box(root,[9.25,3.3,.22],m.gasket,[0,1.6,4.12]);
 for(let i=0;i<6;i++)box(root,[1.47,2.92,.16],m.ivory,[-3.75+i*1.5,1.64,4.0],.025);
 for(const x of [-4.35,-3.02,3.02,4.35]){
  box(root,[.17,3.14,.24],m.trim,[x,1.6,-3.78],.045);
  box(root,[.095,2.7,.26],m.ivory,[x,1.62,-3.72],.022);
  box(root,[.28,.20,.37],m.trim,[x,3.03,-3.72],.045);
  box(root,[.34,.19,.42],m.trim,[x,.18,-3.7],.035);
  for(const y of [.42,2.73])for(const dx of [-.023,.023]){
   const bolt=mesh(root,new T.CylinderGeometry(.009,.009,.007,6),m.bronze,[x+dx,y,-3.581],[Math.PI/2,0,0]);bolt.castShadow=false;
  }
 }
 for(const s of [-1,1])for(const z of [-3.85,3.85])box(root,[.30,3.14,.30],m.trim,[s*4.35,1.6,z],.065);
 for(const x of [-4.38,4.38]){box(root,[.15,.22,8],m.trim,[x,.12,0],.035);box(root,[.18,.28,8],m.ivory,[x,3.02,0],.05);}
 for(const z of [-3.79,3.84]){box(root,[8.8,.22,.15],m.trim,[0,.12,z],.035);box(root,[8.8,.31,.24],m.ivory,[0,3.02,z],.055);}
 // Air returns below the glazing and at the rear wall.
 for(const z of [-3.67,3.83]){
  box(root,[8.35,.20,.06],m.gasket,[0,.40,z],.012);
  for(let y=.33;y<.5;y+=.026)box(root,[8.3,.009,.075],m.trim,[0,y,z+.01],.003);
  for(const x of [-3,-1.5,0,1.5,3])box(root,[.035,.20,.085],m.ivory,[x,.40,z+.015],.008);
 }
 // Complete ceiling. No cutaway is used during normal exploration.
 const ceiling=new T.Group();ceiling.name='Ceiling';root.add(ceiling);
 box(ceiling,[9.2,.16,8.2],m.gasket,[0,3.28,0],.03);
 for(let x=-3.75;x<4;x+=1.5)for(let z=-3;z<=3;z+=1.5)box(ceiling,[1.47,.08,1.47],m.ivory,[x,3.16,z],.022);
 for(const z of [-1.5,1.5]){
  box(ceiling,[2.2,.05,.36],m.trim,[0,3.10,z]);box(ceiling,[2.08,.025,.26],m.gasket,[0,3.068,z],.04);
  for(let x=-.98;x<1.02;x+=.065)box(ceiling,[.025,.027,.25],m.trim,[x,3.05,z],.005);
 }
 // Architectural luminous edges are independently dimmable.
 const stripMat=new T.MeshStandardMaterial({color:0xf5dfb1,emissive:0xffcc82,emissiveIntensity:1.8,roughness:.4});
 const strips=new T.Group();strips.userData.dynamic=true;root.add(strips);
 for(const z of [-3.64,3.72])box(strips,[8.32,.018,.022],stripMat,[0,2.89,z],.006);
 for(const x of [-4.30,4.30])box(strips,[.02,.018,7.2],stripMat,[x,2.89,0],.006);
 const rug=mesh(root,new T.CylinderGeometry(1,1,.018,96),m.rug,[.1,.025,-.05]);rug.scale.set(2.83,1,1.98);rug.castShadow=false;
 contactShadow(root,.1,-.05,6.02,4.38,.23);
 return {windows,glass,stripMat,strips,ceiling};
}
