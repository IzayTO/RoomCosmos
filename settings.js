export const DEFAULTS={sky:'cinematic',horizontal:true,horizontalSpeed:.35,horizontalDirection:-1,polar:true,polarSpeed:.16,polarDirection:1,inclination:32,architecture:true,architectureKelvin:2700,windowReflections:true,starlight:true,starlightIntensity:.1,shelfBottom:true,shelfMiddle:true,shelfTop:true,shelfIntensity:.65,shelfKelvin:2700,sensitivity:1,fov:65,quality:'auto',fps:false,volume:0,exposure:1,lamps:{table:{on:true,kelvin:2700,intensity:1},left:{on:true,kelvin:2700,intensity:.8},right:{on:true,kelvin:2700,intensity:.65},gallery:{on:true,kelvin:2700,intensity:.65}}};
export const cloneDefaults=()=>JSON.parse(JSON.stringify(DEFAULTS));
const ranges={horizontalSpeed:[0,4],polarSpeed:[0,4],inclination:[0,180],sensitivity:[.2,2.5],fov:[45,90],volume:[0,1],exposure:[.5,1.8],architectureKelvin:[2700,6500],shelfKelvin:[2700,6500],shelfIntensity:[0,1],starlightIntensity:[0,1]};
export function validateSettings(input){
 const s=cloneDefaults();if(!input||typeof input!=='object')return s;
 for(const key of ['horizontal','polar','architecture','fps','windowReflections','starlight','shelfBottom','shelfMiddle','shelfTop'])if(typeof input[key]==='boolean')s[key]=input[key];
 for(const [key,[lo,hi]]of Object.entries(ranges))if(Number.isFinite(input[key]))s[key]=Math.max(lo,Math.min(hi,input[key]));
 for(const key of ['horizontalDirection','polarDirection'])if([-1,1].includes(input[key]))s[key]=input[key];
 if(['cinematic','lunar'].includes(input.sky))s.sky=input.sky;if(['auto','low','balanced','high'].includes(input.quality))s.quality=input.quality;
 for(const id of Object.keys(s.lamps)){const v=input.lamps?.[id];if(v&&typeof v==='object'){if(typeof v.on==='boolean')s.lamps[id].on=v.on;for(const [key,lo,hi]of [['intensity',0,1],['kelvin',2700,6500]])if(Number.isFinite(v[key]))s.lamps[id][key]=Math.max(lo,Math.min(hi,v[key]));}}
 if(input.architecture===false&&input.lamps&&Object.values(input.lamps).every(l=>l.on===false))for(const key of ['shelfBottom','shelfMiddle','shelfTop'])if(input[key]===undefined)s[key]=false;
 return s;
}
export class Settings{
 constructor(storage,onChange,onError){this.storage=storage;this.onChange=onChange;this.onError=onError;this.value=cloneDefaults();this.timer=null;}
 async load(){this.value=validateSettings(await this.storage.read('settings','preferences'));return this.value;}
 set(key,v){if(key in this.value)this.value=validateSettings({...this.value,[key]:v});this.changed();}
 lamp(id,key,v){if(this.value.lamps[id]){this.value.lamps[id][key]=v;this.value=validateSettings(this.value);this.changed();}}
 all(on){for(const l of Object.values(this.value.lamps))l.on=on;this.value.architecture=on;for(const k of ['shelfBottom','shelfMiddle','shelfTop'])this.value[k]=on;this.changed();}
 allShelf(on){for(const k of ['shelfBottom','shelfMiddle','shelfTop'])this.value[k]=on;this.changed();}
 get shelfOn(){return this.value.shelfIntensity>0&&['shelfBottom','shelfMiddle','shelfTop'].some(k=>this.value[k]);}
 get anyOn(){return this.shelfOn||this.value.architecture||Object.values(this.value.lamps).some(l=>l.on&&l.intensity>0);}
 changed(){this.onChange?.(this.value);this.sync();clearTimeout(this.timer);this.timer=setTimeout(()=>this.save(),250);}
 async save(){try{await this.storage.write('settings','preferences',this.value);}catch(e){this.onError?.(e);}}
 bind(root){this.root=root;root.querySelectorAll('[data-setting]').forEach(input=>input.addEventListener('input',()=>this.set(input.dataset.setting,input.type==='checkbox'?input.checked:input.type==='range'||input.dataset.number!==undefined?Number(input.value):input.value)));root.querySelectorAll('[data-all-lights]').forEach(b=>b.addEventListener('click',()=>this.all(!this.anyOn)));root.querySelectorAll('[data-shelf-lights]').forEach(b=>b.addEventListener('click',()=>this.allShelf(!this.shelfOn)));this.sync();}
 sync(){if(!this.root)return;for(const el of this.root.querySelectorAll('[data-setting]')){const v=this.value[el.dataset.setting];if(el.type==='checkbox')el.checked=v;else el.value=v;const out=this.root.querySelector(`[data-value="${el.dataset.setting}"]`);if(out)out.textContent=el.dataset.setting.endsWith('Kelvin')?v+' K':['shelfIntensity','starlightIntensity'].includes(el.dataset.setting)?Math.round(v*100)+' %':el.dataset.setting==='fov'||el.dataset.setting==='inclination'?v+'°':el.dataset.setting.endsWith('Speed')?v.toFixed(2)+'°/s':el.dataset.setting==='volume'?Math.round(v*100)+' %':v.toFixed?.(2)||v;}this.root.querySelectorAll('[data-all-lights]').forEach(b=>{b.textContent=this.anyOn?'Apagar todas las luces':'Encender todas las luces';b.setAttribute('aria-pressed',String(this.anyOn));});this.root.querySelectorAll('[data-shelf-lights]').forEach(b=>{b.textContent=this.shelfOn?'Apagar las tres filas':'Encender las tres filas';b.setAttribute('aria-pressed',String(this.shelfOn));});}
}
