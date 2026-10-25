import * as T from './assets/vendor/three.module.js';
import {catalog} from './assets/star-catalog.js';
import {milkyWayFragment} from './assets/milky-way.js';

const eq=(ra,de)=>{ra*=Math.PI/180;de*=Math.PI/180;return new T.Vector3(Math.cos(de)*Math.cos(ra),Math.sin(de),Math.cos(de)*Math.sin(ra));};
const GN=eq(192.8595,27.1283),GC=eq(266.4051,-28.9362),GT=new T.Vector3().crossVectors(GN,GC).normalize(),UP=new T.Vector3(0,1,0);
const vertex=`varying vec3 vRay;void main(){vec3 eyeRay=vec3((position.x+projectionMatrix[2][0])/projectionMatrix[0][0],(position.y+projectionMatrix[2][1])/projectionMatrix[1][1],-1.);vRay=vec3(dot(viewMatrix[0].xyz,eyeRay),dot(viewMatrix[1].xyz,eyeRay),dot(viewMatrix[2].xyz,eyeRay));gl_Position=vec4(position.xy,1.,1.);}`;
export class Cosmos{
 constructor(scene){
  this.root=new T.Group();this.root.name='Cosmos';scene.add(this.root);this.h=0;this.p=0;this.field=new T.Matrix4();this.q=new T.Quaternion();this.qh=new T.Quaternion();this.qp=new T.Quaternion();this.axis=new T.Vector3();
  this.base=new T.Quaternion().setFromEuler(new T.Euler(-.92,.42,-.08));
  this.u={field:{value:this.field},night:{value:.2},moonlight:{value:0},milkyOn:{value:1},skyDetail:{value:1},skyGain:{value:2},galacticNormal:{value:GN.clone()},galacticCenter:{value:GC.clone()},galacticTangent:{value:GT.clone()},pixelRatio:{value:1},mode:{value:0},starLimit:{value:7.7}};
  const bgGeo=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
  this.milky=new T.Mesh(bgGeo,new T.ShaderMaterial({uniforms:this.u,vertexShader:vertex,fragmentShader:milkyWayFragment,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,toneMapped:false}));this.milky.frustumCulled=false;this.milky.renderOrder=10000;this.root.add(this.milky);
  const positions=[],magnitudes=[],colors=[];
  for(let i=0;i<catalog.length;i+=4){const v=eq(catalog[i],catalog[i+1]);positions.push(v.x,v.y,v.z);magnitudes.push(catalog[i+2]);const bv=T.MathUtils.clamp(catalog[i+3],-.4,2),warm=T.MathUtils.clamp((bv-.25)/1.5,0,1),cool=T.MathUtils.clamp((.3-bv)/.7,0,1);colors.push(1-cool*.24,1-warm*.18-cool*.08,1-warm*.4);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('magnitude',new T.Float32BufferAttribute(magnitudes,1));g.setAttribute('starColor',new T.Float32BufferAttribute(colors,3));
  this.stars=new T.Points(g,new T.ShaderMaterial({uniforms:this.u,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,toneMapped:false,
   vertexShader:`attribute float magnitude;attribute vec3 starColor;uniform mat4 field;uniform float night,pixelRatio,mode,starLimit;varying vec3 vColor;varying float vAlpha;
    void main(){vec3 dir=mat3(field)*position;vec3 vd=mat3(viewMatrix)*dir;vec4 p=projectionMatrix*vec4(vd,1.);float visible=1.-smoothstep(starLimit-.5,starLimit+.22,magnitude);gl_Position=p.w>0.?vec4(p.xy,p.w,p.w):vec4(2.,2.,2.,1.);
    float strength=clamp(pow(10.,-.145*(magnitude-1.)),.14,1.55)*1.22;
    gl_PointSize=(mix(1.35,1.95,mode)+clamp(5.4-magnitude,0.,6.)*.47)*pixelRatio;
    vAlpha=visible*strength*night*(p.w>0.?1.:0.);vColor=mix(mix(vec3(.89,.93,1.),vec3(1.),starColor.r),starColor,mode);}`,
   fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){vec2 q=gl_PointCoord*2.-1.;float r=dot(q,q);float core=exp(-4.5*r)*(1.-smoothstep(.52,1.,r));gl_FragColor=vec4(vColor*vAlpha*core*1.3,1.);}`
  }));this.stars.frustumCulled=false;this.stars.renderOrder=10001;this.root.add(this.stars);this.count=catalog.length/4;
 }
 update(dt,s,light,ratio){
  const rad=Math.PI/180;if(s.horizontal)this.h=(this.h+dt*s.horizontalSpeed*s.horizontalDirection*rad)%(Math.PI*2);
  if(s.polar)this.p=(this.p+dt*s.polarSpeed*s.polarDirection*rad)%(Math.PI*2);
  this.axis.set(0,Math.cos(s.inclination*rad),Math.sin(s.inclination*rad)).normalize();
  this.qh.setFromAxisAngle(UP,this.h);this.qp.setFromAxisAngle(this.axis,this.p);this.q.copy(this.qh).multiply(this.qp).multiply(this.base);this.field.makeRotationFromQuaternion(this.q);
  this.u.galacticNormal.value.copy(GN).applyQuaternion(this.q);this.u.galacticCenter.value.copy(GC).applyQuaternion(this.q);this.u.galacticTangent.value.copy(GT).applyQuaternion(this.q);
  this.u.mode.value=s.sky==='lunar'?1:0;this.u.skyGain.value=s.sky==='lunar'?3.35:1.8;this.u.night.value=.19+(1-light)*.81;this.u.pixelRatio.value=ratio;this.u.starLimit.value=s.sky==='lunar'?8.9:7.95;
 }
 dispose(){this.root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.root.removeFromParent();}
}
