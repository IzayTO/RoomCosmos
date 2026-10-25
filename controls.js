import * as T from './assets/vendor/three.module.js';
const clamp=T.MathUtils.clamp;
export function resolvePosition(x,z,colliders,r=.23){
 x=clamp(x,-4.19,4.19);z=clamp(z,-3.43,3.43);
 for(let pass=0;pass<3;pass++)for(const c of colliders){
  if(c.type==='circle'){let dx=x-c.x,dz=z-c.z,d=Math.hypot(dx,dz),min=c.r+r;if(d<min){if(d<.0001){dx=1;dz=0;d=1;}x=c.x+dx/d*min;z=c.z+dz/d*min;}}
  else{const ca=Math.cos(c.angle||0),sa=Math.sin(c.angle||0),dx=x-c.x,dz=z-c.z;let lx=ca*dx-sa*dz,lz=sa*dx+ca*dz;const w=c.w/2,d=c.d/2,qx=clamp(lx,-w,w),qz=clamp(lz,-d,d),vx=lx-qx,vz=lz-qz,dist=Math.hypot(vx,vz);
   if(dist<r){if(dist>.00001){lx+=vx/dist*(r-dist);lz+=vz/dist*(r-dist);}else if(w-Math.abs(lx)<d-Math.abs(lz))lx=(lx>=0?1:-1)*(w+r);else lz=(lz>=0?1:-1)*(d+r);x=c.x+ca*lx+sa*lz;z=c.z-sa*lx+ca*lz;}
  }
 }return {x:clamp(x,-4.19,4.19),z:clamp(z,-3.43,3.43)};
}
export class Controls{
 constructor(camera,canvas,colliders,{interact,menu,reveal}){
  this.camera=camera;this.canvas=canvas;this.colliders=colliders;this.enabled=false;this.keys=new Set();this.joy={x:0,y:0};this.velocity=new T.Vector2();this.pos=new T.Vector3(0,1.64,2.38);this.yaw=0;this.pitch=-.06;this.sensitivity=1;this.mobile=matchMedia('(pointer:coarse)').matches;this.drag=null;this.joyId=null;this.abort=new AbortController();const on=(el,type,fn,opt={})=>el.addEventListener(type,fn,{...opt,signal:this.abort.signal});
  on(window,'keydown',e=>{if(e.code==='Escape'){menu();return;}if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName))return;if(e.code==='KeyH'){reveal();return;}if(!this.enabled)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE'].includes(e.code)){e.preventDefault();this.keys.add(e.code);}if(e.code==='KeyE'&&!e.repeat)interact();});
  on(window,'keyup',e=>this.keys.delete(e.code));on(window,'blur',()=>this.reset());on(document,'visibilitychange',()=>this.reset());
  on(document,'pointerlockchange',()=>{if(!document.pointerLockElement)this.reset();});
  on(canvas,'pointerdown',e=>{if(!this.enabled){reveal();return;}if(e.pointerType==='mouse'&&document.pointerLockElement===canvas){interact();return;}this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};canvas.setPointerCapture?.(e.pointerId);if(e.pointerType==='mouse')this.lock();});
  on(document,'pointermove',e=>{if(!this.enabled)return;let dx=0,dy=0;if(document.pointerLockElement===canvas){dx=e.movementX;dy=e.movementY;}else if(this.drag?.id===e.pointerId){dx=e.clientX-this.drag.x;dy=e.clientY-this.drag.y;this.drag.x=e.clientX;this.drag.y=e.clientY;}else return;this.yaw-=dx*.0022*this.sensitivity;this.pitch=clamp(this.pitch-dy*.0022*this.sensitivity,-1.3,1.3);this.focus=null;});
  on(canvas,'pointerup',e=>{if(this.drag?.id===e.pointerId){if(e.pointerType==='touch'&&Math.hypot(e.clientX-this.drag.startX,e.clientY-this.drag.startY)<6)reveal(false);this.drag=null;}});
  const cancel=e=>{if(this.drag?.id===e.pointerId)this.drag=null;};on(canvas,'pointercancel',cancel);on(canvas,'lostpointercapture',cancel);
  const joy=document.querySelector('#joystick'),knob=joy.querySelector('span');
  const move=e=>{const rect=joy.getBoundingClientRect(),dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2,max=rect.width*.32,l=Math.hypot(dx,dy),scale=l>max?max/l:1;this.joy.x=dx*scale/max;this.joy.y=-dy*scale/max;knob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;};
  on(joy,'pointerdown',e=>{if(!this.enabled)return;e.preventDefault();e.stopPropagation();this.joyId=e.pointerId;joy.setPointerCapture(e.pointerId);move(e);});on(joy,'pointermove',e=>{if(e.pointerId===this.joyId){e.preventDefault();move(e);}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])on(joy,event,e=>{if(e.pointerId===this.joyId){this.joyId=null;this.joy.x=this.joy.y=0;knob.style.transform='';}});
  on(document,'gesturestart',e=>{if(this.enabled)e.preventDefault();},{passive:false});
  this.update(0);
 }
 lock(){if(!this.mobile&&this.enabled){try{this.canvas.requestPointerLock?.()?.catch?.(()=>{});}catch{}}}
 reset(){this.keys.clear();this.joy.x=this.joy.y=0;this.velocity.set(0,0);this.drag=null;this.joyId=null;const knob=document.querySelector('#joystick span');if(knob)knob.style.transform='';}
 pause(){this.enabled=false;this.reset();if(document.pointerLockElement)document.exitPointerLock();}
 resume(){this.enabled=true;this.focus=null;}
 lookAt(point){const dir=point.clone().sub(this.pos);this.focus={yaw:Math.atan2(-dir.x,-dir.z),pitch:Math.atan2(dir.y,Math.hypot(dir.x,dir.z))};}
 update(dt){
  if(this.focus){const d=Math.atan2(Math.sin(this.focus.yaw-this.yaw),Math.cos(this.focus.yaw-this.yaw));this.yaw+=d*(1-Math.exp(-dt*5));this.pitch+=(this.focus.pitch-this.pitch)*(1-Math.exp(-dt*5));}
  const k=this.keys;let f=this.enabled?Number(k.has('KeyW')||k.has('ArrowUp'))-Number(k.has('KeyS')||k.has('ArrowDown'))+this.joy.y:0,s=this.enabled?Number(k.has('KeyD'))-Number(k.has('KeyA'))+this.joy.x:0;const len=Math.hypot(f,s);if(len>1){f/=len;s/=len;}
  if(this.enabled)this.yaw+=(Number(k.has('ArrowLeft'))-Number(k.has('ArrowRight')))*dt*1.3;
  const tx=(-Math.sin(this.yaw)*f+Math.cos(this.yaw)*s)*1.35,tz=(-Math.cos(this.yaw)*f-Math.sin(this.yaw)*s)*1.35,a=1-Math.exp(-dt*10);this.velocity.x+=(tx-this.velocity.x)*a;this.velocity.y+=(tz-this.velocity.y)*a;
  const steps=Math.max(1,Math.ceil(this.velocity.length()*dt/.07));for(let i=0;i<steps;i++){const p=resolvePosition(this.pos.x+this.velocity.x*dt/steps,this.pos.z+this.velocity.y*dt/steps,this.colliders);this.pos.x=p.x;this.pos.z=p.z;}
  this.camera.position.copy(this.pos);this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
 }
 dispose(){this.abort.abort();this.reset();}
}
