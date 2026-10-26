// Adapted from Sky-Explorer-VR sky.js and lunar-sky.js (IzayTO).
// Same seam-free galactic dust/arm structure; horizon, Sun and Earth removed.
export const milkyWayFragment=`
      varying vec3 vRay;uniform vec3 galacticNormal,galacticCenter,galacticTangent;uniform float night,moonlight,milkyOn,skyGain;
      
uniform float skyDetail;
float hash(vec3 p){p=fract(p*.3183099+vec3(.11,.37,.71));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float clouds=.52*noise3(p)+.27*noise3(p*2.07+4.3);if(skyDetail>.5)clouds+=.14*noise3(p*4.13+12.7)+.07*noise3(p*8.19);return clouds;}

      void main(){vec3 d=normalize(vRay);float lat=dot(d,galacticNormal);vec3 g=vec3(dot(d,galacticCenter),lat,dot(d,galacticTangent));
        // Cartesian galactic coordinates avoid a longitude seam. Unequal arms,
        // an extended central bulge and local dust lanes replace a uniform band.
        float clouds=fbm(g*vec3(8.,17.,10.)+vec3(3.1,7.4,1.2));
        float knots=.5,fine=.5;if(skyDetail>.5){knots=noise3(g*32.+vec3(9.2,1.8,4.));fine=noise3(g*83.+vec3(4.7,12.,6.));}
        float central=pow(max(0.,g.x),6.);
        float arm=.40+.36*noise3(vec3(g.x*4.,g.z*4.,2.8))+.38*central;
        float bend=.022*sin(g.z*5.+g.x*2.)+(clouds-.5)*.065;
        float width=.052+.040*clouds+.083*central;
        float band=exp(-pow((lat+bend)/width,2.));
        float bulge=exp(-pow((lat+.025)/(.12+.055*central),2.))*central;
        float ridge=.021+.033*sin(g.z*4.-g.x*2.)+(clouds-.5)*.05;
        float rift=exp(-pow((lat+ridge)/(.011+.023*knots),2.));
        float riftMask=smoothstep(-.5,.6,g.x)*(.35+.65*knots);
        float branch=exp(-pow((lat-.055+g.z*.047+(knots-.5)*.027)/.018,2.))*central;
        float texture=.22+.95*smoothstep(.24,.79,clouds)+.16*knots+.07*fine;
        float dust=(band*arm*texture+bulge*.30)*(1.-rift*riftMask*.89)*(1.-branch*.60);
        float veil=night*milkyOn;
        vec3 color=mix(vec3(.053,.065,.078),vec3(.104,.089,.069),central*.82);
        gl_FragColor=vec4(color*dust*veil*skyGain,1.);
      }`;
