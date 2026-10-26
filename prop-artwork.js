// Procedural artwork adapted from IzayTO / Sky-Explorer-VR, recuperar-vr. See CREDITOS.md.
const TAU=Math.PI*2;
function path(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>c[i?'lineTo':'moveTo'](x,y));if(fill){c.closePath();c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function text(c,t,x,y,size=16,color='#d9e1dc',align='left'){c.fillStyle=color;c.font=`${size>=22?'600 ':''}${size}px sans-serif`;c.textAlign=align;c.fillText(t,x,y);}
function circle(c,x,y,r,fill,stroke){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function grid(c,color='#83a7ad33'){c.strokeStyle=color;c.lineWidth=1;for(let x=24;x<512;x+=29){c.beginPath();c.moveTo(x,18);c.lineTo(x,493);c.stroke();}for(let y=24;y<512;y+=29){c.beginPath();c.moveTo(18,y);c.lineTo(493,y);c.stroke();}}
function lunar(c){c.fillStyle='#bcbeb4';c.fillRect(0,0,512,512);let seed=4711;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const [x,y,rx,ry] of [[266,208,38,63],[314,210,37,41],[258,132,28,20],[184,216,43,85],[333,262,32,18],[155,150,58,64],[187,286,43,26]]){c.fillStyle='#7f8580';c.beginPath();c.ellipse(x,y,rx,ry,.25,0,TAU);c.fill();}
 for(let i=0;i<240;i++){const x=rand()*512,y=rand()*512,r=1.4+rand()**4*17;circle(c,x,y,r,'#91958b','#dadbd1');circle(c,x+r*.16,y-r*.10,r*.60,'#a2a699');}c.lineWidth=2;
 circle(c,226,335,9,'#c2c3b5','#e2e1d3');for(let i=0;i<12;i++){const a=i*TAU/12;path(c,[[226+Math.cos(a)*10,335+Math.sin(a)*10],[226+Math.cos(a+.025)*33,335+Math.sin(a+.025)*33]],null,'#d6d6c7');}}
export function drawArtwork(name,c){c.save();c.clearRect(0,0,512,512);
 if(name==='moon')lunar(c);
 else if(name==='lunar-map'){c.fillStyle='#162e3b';c.fillRect(0,0,512,512);text(c,'LUNA / CARTOGRAFÍA',26,38,22);text(c,'HEMISFERIO VISIBLE  •  ATLAS DE EXPLORACIÓN',26,59,10,'#b9c7c3');
 c.save();c.beginPath();c.arc(244,258,169,0,TAU);c.clip();c.translate(75,89);c.scale(338/512,338/512);lunar(c);c.restore();circle(c,244,258,171,null,'#a9c4c6');c.strokeStyle='#17364388';c.lineWidth=1;for(let a=-60;a<=60;a+=30){const xx=Math.sin(a*Math.PI/180)*169;c.beginPath();c.ellipse(244,258,Math.max(.01,Math.abs(xx)),169,0,0,TAU);c.stroke();const yy=Math.sin(a*Math.PI/180)*169;path(c,[[244-Math.sqrt(169**2-yy**2),258+yy],[244+Math.sqrt(169**2-yy**2),258+yy]],null,'#17364388');}
 const sites=[[275,286,'TRANQUILIDAD'],[173,250,'OCÉANO DE TORMENTAS'],[281,334,'TYCHO'],[272,195,'SERENIDAD']];for(const[x,y,label]of sites){circle(c,x,y,2.5,'#efc878');text(c,label,x+5,y-6,8,'#112b35');}text(c,'N',244,79,13,'#d5d8c3','center');text(c,'S',244,447,13,'#d5d8c3','center');text(c,'RELIEVE ESTILIZADO · NO USAR PARA NAVEGACIÓN',26,479,10);text(c,'SKY EXPLORER / ARCHIVO LUNAR',26,495,9,'#91aeae');
 }else if(name==='blueprint'){c.fillStyle='#173b52';c.fillRect(0,0,512,512);grid(c);text(c,'LRV / EXPLORACIÓN LUNAR',26,40,20);text(c,'NASA / APOLLO · ESTUDIO VISUAL',26,61,11);c.strokeStyle='#cee1dc';c.lineWidth=2;
 // Orthographic side, top and front views of a recognisable lunar rover.
 path(c,[[63,238],[72,212],[165,196],[284,197],[351,220],[438,229]],null,'#dae6df');for(const x of[123,369]){circle(c,x,248,33,null,'#dae6df');circle(c,x,248,22,null,'#8dacae');for(let i=0;i<12;i++){const a=i*TAU/12;path(c,[[x+Math.cos(a)*12,248+Math.sin(a)*12],[x+Math.cos(a)*30,248+Math.sin(a)*30]],null,'#99b8be');}}
 for(const x of[190,262])path(c,[[x-12,194],[x-17,152],[x+16,153],[x+26,198]],null,'#dae6df');path(c,[[83,209],[90,131],[77,126]],null,'#dae6df');c.beginPath();c.ellipse(92,111,26,9,-.5,0,TAU);c.stroke();path(c,[[313,198],[324,171],[354,171]],null,'#dae6df');text(c,'VISTA LATERAL',180,298,11);
 c.strokeRect(47,337,200,92);for(const x of[54,206])for(const y of[328,422])c.strokeRect(x,y,30,13);for(const x of[95,152])c.strokeRect(x,359,38,34);path(c,[[292,417],[306,366],[445,366],[460,417]],null,'#dae6df');c.strokeRect(285,390,25,44);c.strokeRect(438,390,25,44);c.strokeRect(329,344,26,36);c.strokeRect(386,344,26,36);text(c,'PLANTA',100,454,11);text(c,'FRENTE',354,454,11);path(c,[[57,310],[443,310]],null,'#cfbd85');text(c,'CHASIS · ASIENTOS · ANTENA · RUEDAS DE MALLA',26,485,10);
 }
 c.restore();}
