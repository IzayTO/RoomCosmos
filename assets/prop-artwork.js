// Moon illustration adapted from IzayTO / Sky-Explorer-VR prop-artwork.js.
// Only the decorative lunar globe artwork is retained. Procedural, not a NASA map.
const TAU=Math.PI*2;
function path(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>c[i?'lineTo':'moveTo'](x,y));if(fill){c.closePath();c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function circle(c,x,y,r,fill,stroke){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function lunar(c){c.fillStyle='#bcbeb4';c.fillRect(0,0,512,512);let seed=4711;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const [x,y,rx,ry] of [[266,208,38,63],[314,210,37,41],[258,132,28,20],[184,216,43,85],[333,262,32,18],[155,150,58,64],[187,286,43,26]]){c.fillStyle='#7f8580';c.beginPath();c.ellipse(x,y,rx,ry,.25,0,TAU);c.fill();}
 for(let i=0;i<240;i++){const x=rand()*512,y=rand()*512,r=1.4+rand()**4*17;circle(c,x,y,r,'#91958b','#dadbd1');circle(c,x+r*.16,y-r*.10,r*.60,'#a2a699');}c.lineWidth=2;
 circle(c,226,335,9,'#c2c3b5','#e2e1d3');for(let i=0;i<12;i++){const a=i*TAU/12;path(c,[[226+Math.cos(a)*10,335+Math.sin(a)*10],[226+Math.cos(a+.025)*33,335+Math.sin(a+.025)*33]],null,'#d6d6c7');}}
export function drawArtwork(name,context){if(name!=='moon')throw Error('Unknown artwork');context.save();lunar(context);context.restore();}
