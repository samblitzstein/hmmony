/* sparkle.js (3b sparkle trail, Nov 5 2026). Sam's artifact comment ~1:46pm on the lead star page's "Sparkles left behind" trail:
   "if it's going to be in the trail it has to be in the main trail as well, or while you're moving or playing or whatever else".
   One sparkle recipe for the whole game (the spark trail's own: a twinkle that flickers and fades over ~0.7s), used by every take.
   ?spk=off|motion|sound|glitter   off = today's game (the spark keeps its own sparkles only)
     motion  : anything that MOVES sheds sparkles: your dragged head, the listen spark, the win bloom's growing edge, a wrong door's snap.
     sound   : motion + anything SOUNDING sparkles inside its seep circle while its note plays (doors, your note, a wrong door's chamber).
     glitter : motion + the string's own paint holds glitter: fresh paint behind the head twinkles while it dries, the whole string
               keeps a slow sparse twinkle, and when a note sounds, the stretch of string in that note's colour glitters.
   ?spkfade=700 sparkle life (ms), ?spkn=1 density x.
   Rules kept: one colour = one note (a sparkle wears the note of whatever sheds it; your head's sparkles are the note you hold, so a new
   colour only ever appears from the door forward); everything is cut to the lanes with the game's lane mask (nothing over the walls);
   sparkles only ever fade or drift, never pop. */
(()=>{
const q=new URLSearchParams(location.search),MODE=q.get('spk')||'sound' /* LOCKED Sam Nov 5 2:54pm 'ship it' = B motion + sound */,FADE=+q.get('spkfade')||500,DN=+q.get('spkn')||.75; /* LOCKED Sam Nov 5 2:53pm: lasts 0.5s, density x0.75 */
const LOOKP=q.get('spklook')||'glow'; /* LOCKED Sam Nov 5 2:51pm: glow dot ('the other one is too showy') */ /* paint = a fleck of the game's own watercolour (Look.disc, the same recipe as the stargate patches and seeps) with a star's twinkle at its heart; glow = the spark trail's original glow dot */
const ON=MODE!=='off',SOUND=MODE==='sound',GLIT=MODE==='glitter';
const SPK=window.SPK={on:ON,mode:MODE,parts:[],lv:null};
const now=()=>performance.now();
const colOf=n=>{try{return c3(COLOR[n])}catch(e){return [255,240,200]}};
/* one sprite per colour: the spark trail's glowDot (white core, note colour, soft edge) */
const SPR={};function sprite(c){const key=c.join();if(SPR[key])return SPR[key];const R=32,cv=document.createElement('canvas');cv.width=cv.height=R*2;const g=cv.getContext('2d'),gr=g.createRadialGradient(R,R,0,R,R,R);
 gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.18,`rgba(${key},.95)`);gr.addColorStop(.5,`rgba(${key},.28)`);gr.addColorStop(1,`rgba(${key},0)`);g.fillStyle=gr;g.fillRect(0,0,R*2,R*2);return SPR[key]=cv}
/* paint flecks: tiny copies of the game's watercolour disc in the note's colour, 3 seeds per colour, baked once */
const FL={};function fleck(c,ph){const key=c.join(),i=(ph*10|0)%3;let a=FL[key];if(!a){a=FL[key]=[];for(let j=0;j<3;j++){try{const J=Look.disc(10,(j*31+7)%97,c.map(v=>Math.round(v+(255-v)*.45)));if(!J.done)J.step(1e9);a.push(J.c)}catch(e){}}}return a[i]||a[0]||sprite(c)}
const MAXP=260;
function add(x,y,c,o){if(SPK.parts.length>=MAXP)SPK.parts.shift();SPK.parts.push(Object.assign({x,y,c,t:now(),life:FADE,r:5+Math.random()*6,vx:0,vy:0,ph:Math.random()*6.28,a:1,lv:LV},o||{}))}
SPK.add=add;
/* distance-based shedding (the spark's rule: one twinkle every 9px of travel, +-7px jitter), sub-sampled so a fast move stays even */
const TR={};
SPK.trail=(id,p,c,o)=>{if(!p)return;const s=TR[id];if(!s||s.lv!==LV){TR[id]={p:p.slice(),lv:LV};return}const dx=p[0]-s.p[0],dy=p[1]-s.p[1],d=Math.hypot(dx,dy),gap=9/DN;
 if(d>200){s.p=p.slice();return} /* a jump (new board, reset): no streak across */
 let n=Math.floor(d/gap);for(let i=1;i<=n;i++){const u=i*gap/d;add(s.p[0]+dx*u+(Math.random()-.5)*14,s.p[1]+dy*u+(Math.random()-.5)*14,c,o)}if(n)s.p=[s.p[0]+dx*n*gap/d,s.p[1]+dy*n*gap/d]};
SPK.trailReset=id=>{delete TR[id]};
/* ---- sources ---- */
const P=k=>{const [r,c]=rc(k);return G(c,r)};
let lastPL=0,lastWon=false,winT=0,winK=-1,lastShake=null,lastLV=null,twAt=0;
const held=()=>(S&&S.carry&&S.carry[0])||LV.startNote;
function noteOfK(k){const [r,c]=rc(k),t=GR[r][c];if(isNote(t))return t;if(t==='E'&&PITCH[k])return PITCH[k];return null}
function sndAmp(m,t){const s=SNDM[m];if(!s)return 0;const e=(t-s[0])/1000;if(e<0||e>s[1])return 0;return Math.min(1,e/.08)*Math.pow(1-e/s[1],1.2)}
function stringPts(){const cs=carries(S),pts=S.path.map(P),out=[];for(let i=1;i<pts.length;i++){const c=cs[i-1];if(c==='mud'||!c||!c.length)continue;out.push([pts[i-1],pts[i],c[0]])}
 const e=window.__strokeEnd&&window.__strokeEnd(),last=pts[pts.length-1],cl=cs[cs.length-1];if(e&&last&&cl&&cl!=='mud'&&cl.length&&Math.hypot(e[0]-last[0],e[1]-last[1])>2)out.push([last,e,cl[0]]);return out}
function onString(segs,note){const L_=segs.filter(s=>!note||s[2]===note);if(!L_.length)return null;const len=L_.map(s=>Math.hypot(s[1][0]-s[0][0],s[1][1]-s[0][1])),T=len.reduce((a,b)=>a+b,0);if(T<1)return null;
 let u=Math.random()*T;for(let i=0;i<L_.length;i++){if(u<=len[i]){const v=u/Math.max(1e-6,len[i]),s=L_[i];return [s[0][0]+(s[1][0]-s[0][0])*v,s[0][1]+(s[1][1]-s[0][1])*v,s[2]]}u-=len[i]}return null}
function tick(t,dt){if(!S||!S.path||!S.path.length||!GR)return;if(lastLV!==LV){lastLV=LV;lastWon=false;lastShake=null;SPK.trailReset('head')}
 /* 1. your head: whatever you drag sheds sparkles in the note you hold */
 const e=(Look.PF&&Look.PFT>t-500)?(window.__ink2&&__ink2.pos&&!/[?&]livefront=0\b/.test(location.search)?__ink2.pos:Look.PF):null; /* smooth trail (Nov 6): the paint front now reaches the stroke end (ahead of the drop) every frame; sparkles keep landing under the drop, as before */ /* the paint's own front (look.js Ink render), so sparkles land where the paint arrives, never ahead of it */if(e&&!S.muddy&&!S.won){const c=colOf(held());SPK.trail('head',e,c,GLIT?{life:FADE*2.6,r:3+Math.random()*5,a:.7,dry:1,hd:1}:{hd:1})}else SPK.trailReset('head');
 /* 1b. pull-back (tester s203): a head sparkle that is no longer on the string (you pulled back past it) fades out in 80ms */
 {const segs=stringPts(),near=(x,y)=>segs.some(([a,b])=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1,u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l));return Math.hypot(a[0]+dx*u-x,a[1]+dy*u-y)<16})||(segs.length===0&&Math.hypot(P(S.path[0])[0]-x,P(S.path[0])[1]-y)<16);
  for(const p of SPK.parts)if(p.hd&&!near(p.x,p.y))p.life=Math.min(p.life,t-p.t+80)}lastPL=S.path.length;
 /* 2. win: the end door's bloom throws sparkles off its growing edge, in the end door's note, while it grows (~1.1s) */
 if(S.won&&!lastWon){winT=t;winK=S.path[S.path.length-1]}lastWon=!!S.won;
 if(S.won&&winK>=0&&t-winT<1200){const n_=noteOfK(winK);if(n_){const [x,y]=P(winK),u=Math.min(1,(t-winT)/1100),g=1-Math.pow(1-u,3),R=8+42*g,c=colOf(n_),k=Math.random()<dt/20*DN?3:0;
  for(let i=0;i<k;i++){const an=Math.random()*6.2832;add(x+Math.cos(an)*R*1.05,y+Math.sin(an)*R*1.05,c,{vx:Math.cos(an)*.035,vy:Math.sin(an)*.035,r:4+Math.random()*5})}}}
 /* 3. wrong door snap (Strain, then snap shut ~ +510ms): a puff of the door's colour at its mouth */
 if(typeof shake!=='undefined'&&shake&&shake!==lastShake){lastShake=shake;const k=shake.k,n_=noteOfK(k);if(n_){const [x,y]=P(k),c=colOf(n_);setTimeout(()=>{if(LV!==lastLV)return;for(let i=0;i<7;i++){const an=Math.random()*6.2832,rr=6+Math.random()*16;add(x+Math.cos(an)*rr,y+Math.sin(an)*rr,c,{vx:Math.cos(an)*.04,vy:Math.sin(an)*.04,life:FADE*.8})}},500)}}
 /* 4. sound (take "sound"): every sounding door / your note sparkles inside its seep circle, rate with its loudness */
 if(SOUND){const SR=+(q.get('seepr')||50),ST=+(q.get('seept')||66),tipK=S.path[S.path.length-1],src=S.path.slice().reverse().find(k=>noteOfK(k))||S.path[0];
  GR.forEach((row,r)=>row.forEach((tk,c_)=>{const k=key(r,c_),n_=noteOfK(k);if(!n_||flares[k]===undefined)return;const s=SNDM[midi(n_)];if(!s||flares[k]<s[0]-200)return;const a=sndAmp(midi(n_),t);if(a<=.02)return;
   if(Math.random()<a*dt/45*DN){const [x,y]=G(c_,r),an=Math.random()*6.2832,rr=Math.sqrt(Math.random())*SR*.75;add(x+Math.cos(an)*rr,y+Math.sin(an)*rr,colOf(n_),{vx:Math.cos(an)*.012,vy:Math.sin(an)*.012-.01,r:3+Math.random()*5,life:FADE*1.2})}}));
  const hn=held();if(hn&&!S.muddy){const a=sndAmp(midi(hn),t);if(a>.02&&Math.random()<a*dt/40*DN){const [x,y]=P(src),an=Math.random()*6.2832,rr=Math.sqrt(Math.random())*ST*.75;add(x+Math.cos(an)*rr,y+Math.sin(an)*rr,colOf(hn),{vx:Math.cos(an)*.012,vy:Math.sin(an)*.012-.01,r:3+Math.random()*5,life:FADE*1.2})}}}
 /* 5. glitter (take "glitter"): the string is starlight paint. A slow sparse twinkle along it, and a sounding note's stretch glitters */
 if(GLIT&&!S.muddy){const segs=stringPts();if(segs.length){if(t>twAt){twAt=t+220/DN;const p=onString(segs);if(p)add(p[0]+(Math.random()-.5)*6,p[1]+(Math.random()-.5)*6,colOf(p[2]),{life:1300,r:3+Math.random()*4,a:.75,slow:1})}
  const seen=new Set();for(const s of segs){if(seen.has(s[2]))continue;seen.add(s[2]);const a=sndAmp(midi(s[2]),t);if(a>.02&&Math.random()<a*dt/30*DN){const p=onString(segs,s[2]);if(p)add(p[0]+(Math.random()-.5)*8,p[1]+(Math.random()-.5)*8,colOf(s[2]),{life:FADE*1.3,r:3+Math.random()*5,a:.9})}}}}}
/* ---- drawing: straight onto the board. Each sparkle is kept off the walls by the game's own wall distance (look.sdf): its whole sprite,
   halo included, must fit inside the lane where it sits, so it shrinks and fades as it nears a wall and never paints over one. ---- */
let lt=0;
/* tester s207: airtight wall cap. The centre sdf alone let the faint rim touch lane edges (bilinear sdf), so also test 4 rim points; halve once, else skip */
function fitR(sdf,x,y,r){if(!sdf)return r;for(let k=0;k<2;k++){let ok=true;for(let a=0;a<12&&ok;a++){const an=a*.5236;if(sdf(x+Math.cos(an)*r,y+Math.sin(an)*r)<=2)ok=false}if(ok)return r;r*=.5}return 0}
function render(t){const ps=SPK.parts;for(let i=ps.length-1;i>=0;i--){const p=ps[i];if(t-p.t>p.life||p.lv!==LV)ps.splice(i,1)}if(!ps.length)return;
 const sdf=view&&view.look&&view.look.sdf;ctx.save();ctx.globalCompositeOperation='source-over';
 for(const p of ps){const age=t-p.t,u=age/p.life,tw=p.slow?.5+.5*Math.sin(age*.006+p.ph):.6+.4*Math.sin(age*.03+p.r),x=p.x+p.vx*age,y=p.y+p.vy*age;
  const env=p.slow?Math.sin(Math.PI*Math.min(1,u)):p.dry?Math.pow(1-u,1.6):(1-u);let a=env*tw*(p.a||1);if(a<=.01)continue;let r=(p.r+3)*(1-u*.4);
  const d=sdf?sdf(x,y)-3:99;if(d<=1.5)continue;
  if(LOOKP==='glow'){r=fitR(sdf,x,y,Math.min(r,.8*d));if(r<=0)continue;ctx.globalAlpha=Math.min(1,a);ctx.drawImage(sprite(p.c),x-r,y-r,r*2,r*2)}
  else{const f=fleck(p.c,p.ph);let w=r*2.1*(.8+.3*Math.min(1,u*2.5)); /* the fleck spreads a touch as it lands, like wet paint, then dries away */if(w/2>d)w=d*2;ctx.globalAlpha=Math.min(1,a*.95);ctx.drawImage(f,x-w/2,y-w/2,w,w);
   const ph=((age*.0016+p.ph)%1),gl=Math.max(age<220?Math.sin(age/220*Math.PI):0,ph<.35?Math.sin(ph/.35*Math.PI):0); /* the stars' own twinkle shape: a short sine blink, then rest */
   if(gl>.02){const rg=Math.min(r*.55,d);ctx.globalAlpha=Math.min(1,a*gl*.9);ctx.drawImage(sprite([255,250,236]),x-rg,y-rg,rg*2,rg*2)}}}
 ctx.restore()}
if(ON){const _d=draw;draw=function(t){_d(t);try{const n=now(),dt=Math.min(50,lt?n-lt:16);lt=n;tick(n,dt);render(n);const c_=performance.now()-n;(SPK.ms=SPK.ms||[]).push(c_);if(SPK.ms.length>4000)SPK.ms.shift()}catch(e){if(!SPK.err){SPK.err=e;console.error('sparkle',e)}}}}
})();
