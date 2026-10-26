import * as T from './three.module.js?v=2.0.0';
import {box,mesh,line as addLine} from './geometry.js?v=2.0.0';
import {drawArtwork} from './prop-artwork.js?v=2.0.0';
// Rocket and helmet: IzayTO / Sky-Explorer-VR, recuperar-vr, cf283e0.
// Only these static models are adapted; no inventory or construction system.
const P={shell:0xc9d2c9,frame:0x52616a,dark:0x24303a,blue:0x4c768c,teal:0x6a9b93,gold:0xc89d64,white:0xe1e3d4,rubber:0x35413f};
const palette=new Map();
function material(color){if(!palette.has(color))palette.set(color,new T.MeshStandardMaterial({color,roughness:color===P.white?.48:.35,metalness:color===P.gold||color===0xb28b43?.68:.16}));return palette.get(color);}
export function spaceModel(parent,id,pos=[0,0,0],scale=1){
 const model=new T.Group();model.name=id;model.position.set(...pos);model.scale.setScalar(scale);parent.add(model);let current=model;const pi=Math.PI;
 const shape=(geo,col,position=[0,0,0],rot=[0,0,0])=>mesh(current,geo,material(col),position,rot.length?rot:[0,0,0]);
 const b=(size,position,col,rot=[])=>box(current,size,material(col),position,.002,rot.length?rot:[0,0,0]);
 const detail=b;
 const c=(r,h,position,col,rot=[],r2=r,n=24)=>shape(new T.CylinderGeometry(r,r2,h,n),col,position,rot);
 const orb=(r,position,col,scale=[1,1,1],rot=[],n=20)=>{const o=shape(new T.SphereGeometry(r,n,14),col,position,rot);o.scale.set(...(scale.length?scale:[1,1,1]));return o;};
 const line=(a,b,r,col)=>addLine(current,a,b,r,material(col));
 const group=(position,rot,fn)=>{const outer=current,g=new T.Group();g.position.set(...position);g.rotation.set(...rot);outer.add(g);current=g;fn();current=outer;};
 function curvedPatch(rx,ry,rz,a0,a1,b0,b1,col,pos,nu=16,nv=8){const pts=[],ns=[];const at=(a,b)=>[rx*Math.sin(a)*Math.cos(b),ry*Math.sin(b),rz*Math.cos(a)*Math.cos(b)];for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=a0+(a1-a0)*i/nu,aa=a0+(a1-a0)*(i+1)/nu,bb=b0+(b1-b0)*j/nv,bbb=b0+(b1-b0)*(j+1)/nv;for(const q of [at(a,bb),at(aa,bb),at(aa,bbb),at(a,bb),at(aa,bbb),at(a,bbb)]){pts.push(...q);const n=new T.Vector3(q[0]/(rx*rx),q[1]/(ry*ry),q[2]/(rz*rz)).normalize();ns.push(...n);}}const g=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(pts,3)).setAttribute('normal',new T.Float32BufferAttribute(ns,3));shape(g,col,pos);}
 function helmet(R,pos){group(pos,[0,0,0],()=>{orb(R,[0,0,0],P.white,[1,1.06,1],[],20);c(R*.76,R*.14,[0,-R*.83,0],P.frame,[],R*.76,20);c(R*.84,R*.07,[0,-R*.76,0],P.shell,[],R*.84,20);
 curvedPatch(R*1.05,R*1.10,R*1.045,-1.21,1.21,-.54,.66,P.dark,[0,0,0],18,9);
 curvedPatch(R*1.06,R*1.11,R*1.06,-1.09,1.09,-.45,.56,0xb28b43,[0,0,0],18,8);
 curvedPatch(R*1.064,R*1.114,R*1.064,-.95,.90,.34,.49,0xd7bb79,[0,0,0],16,2);
 curvedPatch(R*1.068,R*1.118,R*1.068,-.77,-.52,-.23,.30,0xe0c998,[0,0,0],3,6);
 for(const sign of[-1,1]){c(R*.19,R*.13,[sign*R*.93,R*.16,.012*R/.06],P.frame,[0,0,pi/2],R*.19,10);c(R*.11,R*.15,[sign*R*.98,R*.16,.012*R/.06],P.gold,[0,0,pi/2],R*.11,8);} });}
 if(id==='rocket-model'){
 c(.135,.024,[0,.012,0],P.frame,[],.14,28);c(.132,.005,[0,.027,0],P.gold,[],.132,28);c(.054,.305,[0,.233,0],P.white,[],.054,24);c(.054,.030,[0,.400,0],P.dark,[],.054,24);c(.038,.065,[0,.447,0],P.white,[],.054,24);c(.038,.12,[0,.54,0],P.shell,[],.038,24);c(.016,.064,[0,.632,0],P.white,[],.038,20);c(.016,.024,[0,.676,0],P.frame,[],.016,16);
 for(const y of[.11,.353,.421,.594])c(y>.43?.039:.055,.011,[0,y,0],P.dark,[],y>.43?.039:.055,24);
 for(let i=0;i<4;i++)group([0,0,0],[0,i*pi/2,0],()=>{detail([.022,.17,.003],[0,.263,.0558],P.dark);for(let j=0;j<4;j++)detail([.004,.052,.003],[-.031+j*.020,.145,.044],P.shell);const sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(.04,-.007);sh.lineTo(.013,.073);sh.lineTo(0,.09);sh.closePath();const g=new T.ExtrudeGeometry(sh,{depth:.005,bevelEnabled:false});g.translate(.043,.079,-.0025);shape(g,P.shell);});
 for(const[x,z]of[[0,0],[-.025,-.025],[.025,-.025],[-.025,.025],[.025,.025]]){c(.010,.029,[x,.065,z],P.frame,[],.019,12);c(.018,.004,[x,.049,z],P.dark,[],.018,12);}for(let i=0;i<3;i++){const a=i*2*pi/3;line([Math.cos(a)*.012,.688,Math.sin(a)*.012],[0,.742,0],.0025,P.white);}c(.005,.023,[0,.753,0],P.gold,[],.005,8);line([0,.765,0],[0,.790,0],.002,P.frame);
  }else if(id==='helmet-display'){c(.17,.028,[0,.014,0],P.frame,[],.175,28);c(.165,.006,[0,.032,0],P.gold,[],.165,28);c(.027,.105,[0,.085,0],P.frame);helmet(.146,[0,.282,0]);b([.16,.037,.012],[0,.050,.148],P.gold);
  }else throw Error('Modelo decorativo desconocido');
 return model;
}

export function framedArtwork(parent,m,kind,position,rotation=0){
 const frame=new T.Group();frame.name=kind;frame.position.set(...position);frame.rotation.y=rotation;parent.add(frame);
 // Original lunar atlas and rover blueprint artwork, with a room-matched frame.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const ctx=canvas.getContext('2d');ctx.scale(2,2);drawArtwork(kind,ctx);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 const art=new T.MeshStandardMaterial({map,roughness:.92});
 box(frame,[1.05,.94,.045],m.woodEdge,[0,0,0],.021);
 box(frame,[.985,.875,.016],m.bronze,[0,0,.024],.011);
 box(frame,[.959,.849,.012],m.pages,[0,0,.035],.006);
 mesh(frame,new T.PlaneGeometry(.89,.78),art,[0,0,.043]);return frame;
}
