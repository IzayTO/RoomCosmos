// A quiet ventilation bed, generated locally. Audio starts only after a gesture.
export class AmbientAudio{
 async start(volume=0){if(!this.context){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=this.context=new C();this.gain=ctx.createGain();this.gain.gain.value=0;this.gain.connect(ctx.destination);const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),data=buffer.getChannelData(0);let value=0;for(let i=0;i<data.length;i++){value=(value+Math.random()*.04-.02)/1.025;data[i]=value;}
  const source=this.source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=170;source.connect(low);low.connect(this.gain);source.start();
 }await this.context.resume();this.setVolume(volume);}
 setVolume(v){if(this.context)this.gain.gain.setTargetAtTime(v*.16,this.context.currentTime,.5);}
 suspend(){this.context?.suspend();}
 dispose(){this.source?.stop();this.context?.close();}
}
