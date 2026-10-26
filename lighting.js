import * as T from './three.module.js?v=2.0.0';
import {Reflector} from './Reflector.js?v=2.0.0';
import {mergeGeometries} from './BufferGeometryUtils.js?v=2.0.0';
import {lampColour} from './lamp-settings.js?v=2.0.0';

// A short electrical fade; eye adaptation is handled separately.
export function fadeLight(value,target,dt){const v=target+(value-target)*Math.exp(-Math.max(0,dt)*22);return Math.abs(v-target)<.001?target:v;}
export class Lighting{
 constructor(scene,renderer,m,room,furniture,mobile){
  Object.assign(this,{scene,renderer,m,room,furniture,mobile});this.level=0;this.archLevel=0;this.starLevel=0;this.reflectionDirty=true;this.lastExposure=0;
  this.reflectionView=new T.Matrix4();this.reflectionProjection=new T.Matrix4();this.warm=new T.Color();
  scene.environment=m.environment;scene.environmentIntensity=0;
  this.hemi=new T.HemisphereLight(0xe6cda6,0x6b4a2b,0);scene.add(this.hemi);
  this.fill=new T.PointLight(0xffd6a0,0,8,2);this.fill.position.set(0,2.96,.1);scene.add(this.fill);this.configureShadow(this.fill,512);
  this.lamps=furniture.lamps.map(def=>{
   const light=new T.PointLight(0xffd2a0,0,8,2);light.position.copy(def.position);this.configureShadow(light,512);scene.add(light);return {...def,light,amount:0};
  });
  this.star=new T.SpotLight(0x6585b4,0,6.8,1.12,.95,2);this.star.position.set(0,2.40,-3.62);this.star.target.position.set(0,.2,-.25);scene.add(this.star,this.star.target);this.configureShadow(this.star,512);
  this.rows=['shelfBottom','shelfMiddle','shelfTop'].map((key,i)=>{
   const light=new T.PointLight(0xffd09a,0,3.35,2);light.position.set(0,1.26+i*.58,3.22);scene.add(light);return {key,light,amount:0,materials:furniture.shelfMaterials[i],strip:furniture.shelfStrips[i]};
  });
  this.shelfSpill=[-2.8,2.8].map(x=>{const l=new T.PointLight(0xffd09a,0,1.8,2);l.position.set(x,1.18,3.18);scene.add(l);return l;});
  const geom=mergeGeometries(room.glass,false);room.glass.forEach(g=>g.dispose());
  this.reflector=new Reflector(geom,{textureWidth:mobile?384:768,textureHeight:mobile?192:384,multisample:0,clipBias:.002});this.reflector.position.z=-3.80;this.reflector.name='Shared window reflection';
  const mat=this.reflector.material;mat.transparent=true;mat.depthWrite=false;mat.uniforms.reflectionAmount={value:0};
  mat.fragmentShader=`uniform sampler2D tDiffuse;uniform float reflectionAmount;varying vec4 vUv;
void main(){vec3 c=texture2DProj(tDiffuse,vUv).rgb;gl_FragColor=vec4(c,reflectionAmount);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
  this.reflector.renderOrder=12000;const draw=this.reflector.onBeforeRender.bind(this.reflector);
  this.reflector.onBeforeRender=(renderer,scene,camera)=>{
   if(!this.reflector.visible)return;
   // Refresh on EVERY moving frame, including zoom. Idle views reuse one target.
   // Lower quality changes resolution, never the motion's temporal cadence.
   if(!this.reflectionDirty&&this.reflectionView.equals(camera.matrixWorld)&&this.reflectionProjection.equals(camera.projectionMatrix))return;
   const skyVisible=this.cosmos?.root.visible;if(this.cosmos)this.cosmos.root.visible=false;
   try{draw(renderer,scene,camera);this.reflectionView.copy(camera.matrixWorld);this.reflectionProjection.copy(camera.projectionMatrix);this.reflectionDirty=false;}
   finally{if(this.cosmos)this.cosmos.root.visible=skyVisible;}
  };scene.add(this.reflector);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 }
 configureShadow(light,size){light.castShadow=true;light.shadow.mapSize.set(size,size);light.shadow.camera.near=.045;light.shadow.camera.far=9;light.shadow.bias=-.00018;light.shadow.normalBias=.012;light.shadow.radius=2;light.shadow.autoUpdate=false;light.shadow.needsUpdate=true;}
 setQuality(quality){
  const high=quality==='high',low=quality==='low',size=high&&!this.mobile?1024:low?256:512;
  const width=this.mobile?(high?512:low?256:384):(high?1024:low?384:768);
  this.reflector.getRenderTarget().setSize(width,width/2);
  for(const light of [this.fill,this.star,...this.lamps.map(l=>l.light)]){
   light.castShadow=!low||light===this.lamps[0].light||light===this.star;
   light.shadow.mapSize.set(size,size);light.shadow.map?.dispose();light.shadow.map=null;light.shadow.needsUpdate=true;
  }this.invalidate();
 }
 update(dt,s){
  let total=0,changing=false;
  for(const l of this.lamps){
   const st=s.lamps[l.id],target=st.on?st.intensity:0,old=l.amount;l.amount=fadeLight(old,target,dt);changing ||= Math.abs(l.amount-old)>.00001;
   lampColour(st,this.warm);if(!l.light.color.equals(this.warm))changing=true;l.light.color.copy(this.warm);l.light.intensity=l.amount*l.basePower;
   l.shade.emissive.copy(l.light.color);l.shade.emissiveIntensity=l.amount*.68;l.bulbMat.color.copy(l.light.color).multiplyScalar(l.amount*1.4);total+=l.amount;
  }
  const oldArch=this.archLevel;this.archLevel=fadeLight(oldArch,s.architecture?1:0,dt);changing ||= oldArch!==this.archLevel;
  lampColour({kelvin:s.architectureKelvin},this.warm);if(!this.fill.color.equals(this.warm))changing=true;this.fill.color.copy(this.warm);
  const level=Math.min(1,(total+this.archLevel*.9)/4.9);this.level=level;
  this.hemi.intensity=level*.36;this.fill.intensity=this.archLevel*5.0;this.scene.environmentIntensity=level*.24;
  this.room.stripMat.emissive.copy(this.warm);this.room.stripMat.emissiveIntensity=this.archLevel*1.6;this.room.stripMat.color.setScalar(.015+.985*this.archLevel);
  this.furniture.pictureGlow.emissive.copy(this.warm);this.furniture.pictureGlow.emissiveIntensity=this.archLevel*.9;
  lampColour({kelvin:s.shelfKelvin},this.warm);let shelfTotal=0;
  for(const row of this.rows){const old=row.amount;row.amount=fadeLight(old,s[row.key]?s.shelfIntensity:0,dt);changing ||= old!==row.amount;
   if(!row.light.color.equals(this.warm))changing=true;row.light.color.copy(this.warm);row.light.intensity=row.amount*.65;shelfTotal+=row.amount;
   row.strip.emissive.copy(this.warm);row.strip.emissiveIntensity=row.amount*1.2;row.strip.color.setScalar(.015+row.amount*.75);
   // Local precomputed approximation for the long diffuse LED: no whole-room fill.
   for(const material of row.materials){material.emissive.copy(this.warm);material.emissiveIntensity=row.amount*(material.userData.cover ? .24 : .12);}
  }
  for(const l of this.shelfSpill){l.color.copy(this.warm);l.intensity=shelfTotal*.36;}
  // 10% preserves the original light; the full range reaches ten times that level.
  const oldStar=this.starLevel,starTarget=s.starlight?(s.starlightIntensity??.1)*10:0;this.starLevel=fadeLight(oldStar,starTarget,dt);changing ||= oldStar!==this.starLevel;this.star.intensity=this.starLevel*.50;
  // Archive LEDs never keep the window reflection alive in an otherwise dark room.
  const visible=s.windowReflections&&level>.001;if(this.reflector.visible!==visible)this.reflectionDirty=true;this.reflector.visible=visible;
  this.reflector.material.uniforms.reflectionAmount.value=level*.255;
  const exposure=s.exposure*(1.03+(1-level)*.63),a=1-Math.exp(-dt*4);
  this.renderer.toneMappingExposure+=(exposure-this.renderer.toneMappingExposure)*a;
  if(Math.abs(this.renderer.toneMappingExposure-this.lastExposure)>.0001)changing=true;this.lastExposure=this.renderer.toneMappingExposure;
  this.reflectionDirty ||= changing;return level;
 }
 invalidate(){this.renderer.shadowMap.needsUpdate=true;for(const l of [this.fill,this.star,...this.lamps.map(l=>l.light)])l.shadow.needsUpdate=true;this.reflectionDirty=true;}
 invalidateGallery(){this.renderer.shadowMap.needsUpdate=true;this.lamps.find(l=>l.id==='gallery').light.shadow.needsUpdate=true;this.fill.shadow.needsUpdate=true;this.reflectionDirty=true;}
 dispose(){this.reflector.dispose();this.reflector.geometry.dispose();for(const l of [this.fill,this.star,...this.lamps.map(l=>l.light),...this.rows.map(r=>r.light),...this.shelfSpill])l.dispose();}
}
