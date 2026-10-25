import * as T from './assets/vendor/three.module.js';
import {Reflector} from './assets/vendor/Reflector.js';
import {mergeGeometries} from './assets/vendor/BufferGeometryUtils.js';
import {lampColour} from './lamp-settings.js';

export class Lighting{
 constructor(scene,renderer,m,room,furniture,mobile){
  this.scene=scene;this.renderer=renderer;this.m=m;this.room=room;this.furniture=furniture;this.level=1;this.mobile=mobile;this.lastReflection=-100;this.lastShadowState='';
  scene.environment=m.environment;scene.environmentIntensity=.3;
  this.hemi=new T.HemisphereLight(0xe6cda6,0x6b4a2b,.55);scene.add(this.hemi);
  this.fill=new T.PointLight(0xffd6a0,12,9,2);this.fill.position.set(0,2.85,.1);scene.add(this.fill);
  this.lamps=furniture.lamps.map((def)=>{
   const l=new T.PointLight(0xffd2a0,def.basePower,9,2);l.position.copy(def.position);l.castShadow=def.id==='table';l.shadow.mapSize.set(1024,1024);l.shadow.camera.near=.08;l.shadow.camera.far=10;l.shadow.bias=-.001;l.shadow.normalBias=.035;l.shadow.radius=3;scene.add(l);return {...def,light:l,amount:1};
  });
  const geom=mergeGeometries(room.glass,false);room.glass.forEach(g=>g.dispose());
  this.reflector=new Reflector(geom,{textureWidth:mobile?512:1024,textureHeight:mobile?256:512,multisample:0,clipBias:.004});this.reflector.position.z=-3.80;this.reflector.name='One shared planar window reflection';
  const mat=this.reflector.material;mat.transparent=true;mat.depthWrite=false;mat.uniforms.reflectionAmount={value:.27};
  mat.fragmentShader=`uniform sampler2D tDiffuse;uniform float reflectionAmount;varying vec4 vUv;void main(){vec3 c=texture2DProj(tDiffuse,vUv).rgb;gl_FragColor=vec4(c,reflectionAmount);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`.replace(';#include',';\n#include');
  this.reflector.renderOrder=12000;const draw=this.reflector.onBeforeRender.bind(this.reflector);this.reflector.onBeforeRender=(renderer,scene,camera)=>{
   if(this.level<.015)return;const now=performance.now();if(now-this.lastReflection<this.reflectionInterval)return;this.lastReflection=now;
   const visible=this.cosmos?.root.visible;if(this.cosmos)this.cosmos.root.visible=false;
   try{draw(renderer,scene,camera);}finally{if(this.cosmos)this.cosmos.root.visible=visible;}
  };scene.add(this.reflector);this.reflectionInterval=mobile?250:80;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 }
 setQuality(quality){
  const high=quality==='high';const size=high?1024:512;
  this.reflectionInterval=quality==='low'?500:this.mobile?250:high?70:125;
  this.reflector.getRenderTarget().setSize(high&&!this.mobile?1024:512,high&&!this.mobile?512:256);
  for(const l of this.lamps){if(l.light.castShadow){l.light.shadow.mapSize.set(size,size);l.light.shadow.map?.dispose();l.light.shadow.map=null;}}
  this.renderer.shadowMap.needsUpdate=true;
 }
 update(dt,s){
  let total=0;const ease=1-Math.exp(-dt*2.1);
  for(const l of this.lamps){const st=s.lamps[l.id],target=st.on?st.intensity:0;l.amount+=(target-l.amount)*ease;lampColour(st,l.light.color);l.light.intensity=l.amount*l.basePower;l.shade.emissive.copy(l.light.color);l.shade.emissiveIntensity=l.amount*.95;l.bulbMat.color.copy(l.light.color).multiplyScalar(.025+l.amount*1.6);total+=l.amount;}
  const arch=s.architecture?1:0;this.archLevel??=arch;this.archLevel+=(arch-this.archLevel)*ease;
  const level=Math.min(1,(total+this.archLevel*.9)/4.9);this.level=level;
  this.hemi.intensity=.0015+level*.53;this.fill.intensity=this.archLevel*8+total*.75;
  this.scene.environmentIntensity=.002+level*.32;
  this.room.stripMat.emissiveIntensity=this.archLevel*2.1;this.room.stripMat.color.setScalar(.025+.975*this.archLevel);
  this.furniture.pictureGlow.emissiveIntensity=this.archLevel*1.4;this.furniture.pictureGlow.color.setScalar(.02+.98*this.archLevel);
  const exposure=s.exposure*(1.03+(1-level)*.95);this.renderer.toneMappingExposure+=(exposure-this.renderer.toneMappingExposure)*(1-Math.exp(-dt*.8));
  this.reflector.material.uniforms.reflectionAmount.value=level*.30;
  return level;
 }
 invalidate(){this.renderer.shadowMap.needsUpdate=true;this.lastReflection=-100;}
 dispose(){this.reflector.dispose();this.reflector.geometry.dispose();for(const l of this.lamps)l.light.dispose();}
}
