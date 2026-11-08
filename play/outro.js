/* LEVEL OUTRO v1 (3b, Nov 5 2026). Add-on: loads after index.html, forks.js, lead.js.
   Sam Nov 5 2:16pm: "finishing a level should have an 'outro' where it does a similar spotlight kind of effect on the other stars as it plays
   back your route music" ... "this would help let you re-hear the octaves more?"
   WHERE IT SITS: you enter the end door > the door splits and its note grows into the next board's start patch (LOCKED, unchanged) >
   the Spotlight falls > your route replays star by star (start note, each door you took, the end note) > the Spotlight lifts as the last
   note fades > the slide to the next board (unchanged). The last note is the end door's note = the colour you arrive with.
   TAKES (?out=):
     a  SPARK REPLAY: the later-forks Spotlight (forks.js spot, medium dark, no glow) over the board; your string and its stars stay lit.
        The locked listen spark (lead.js, 'note to note', Hop curve, string-paint trail) runs your route; each star sings as it lands.
     b  LIGHT THE WAY: the same veil covers everything, your string too. The spark carries the light: each star and the stretch of
        string behind it come back up as it lands, and each jump sounds as the pair you heard when you went through (old + new note).
     c  OCTAVES STACK: no spark. The same Spotlight as A. Each star sings on its beat and KEEPS ringing (its seep stays, as a held
        tap's does), so by the end door you hear your whole route as one chord of octaves; then all of it fades together.
     0  no outro (today's main).
   ?gap=ms between notes (default 750 = the listen phrase's door spacing), ?ostart=ms after the win (default 1250: the bloom has grown). */
(()=>{
const q=new URLSearchParams(location.search),OUT=(q.get('out')||'a').toLowerCase();
const GAP=+q.get('gap')||750,OSTART=q.get('ostart')!=null?+q.get('ostart'):1250,VIN=700,VOUT=700,SKY=[7,10,36],SP=.62; /* forks.js: FADE 700, SKY, ?sp=med .62 */
const STACK=q.get('ostack')==='0'?false:q.get('ostack')==='all'?'all':true; /* the stack is the run of OCTAVES you just rode: a swap star that changes your letter starts a new stack, so it never piles G, A and F into a cluster (?ostack=all = every note) */ /* v72 (Sam Nov 5 10:14pm on the 'Together' right-door sound: 'lock it and also apply to the outro ... 1 then 1+2 then 1+2+3 if applicable etc'): each beat of the replay sounds its note TOGETHER with every route note before it (each distinct note once), so the route builds into one chord of octaves; same beat, length and fade as before, the volume shared so it never gets louder than one note's .15 x ~1.3. ?ostack=0 = old (one note a beat) */
const A=()=>window.__leadAPI;
const now=()=>performance.now();
const ease=u=>u<=0?0:u>=1?1:u*u*(3-2*u);
const tokOf=k=>{const [r,c]=rc(k);return GR[r][c]};
const noteOf=(k,i)=>{if(i===0)return LV.startNote||null;const t=tokOf(k);return isNote(t)?t:(PITCH[k]||null)};
const colOf=n=>{try{return c3(COLOR[n])}catch(e){return [255,240,200]}};
const P=k=>{const [r,c]=rc(k);return G(c,r)};
const DDUR=.99,DF=.33; /* lead.js door note: plays .66s + fade .33s */
let O=null;
/* the route: the start, then every star on your string that is a door (incl. swap stars) and the end */
function route(){const out=[];S.path.forEach((k,i)=>{const n=noteOf(k,i);if(n)out.push({k,i,n})});return out}
function plan(tw){const R=route();if(R.length<2)return null;const t0=tw+OSTART,beats=[];let at=VIN*.6;
 R.forEach((s,j)=>{beats.push({...s,at});at+=GAP});const last=beats[beats.length-1].at;
 const end=last+DDUR*1000+150+(OUT==='c'?400:0); /* the last note has ended */
 return {t0,beats,end,out:end+VOUT,lit:new Set(),stamped:0,legs:[]}}
function schedule(o){const ac=(()=>{try{return Sound.unlock()}catch(e){return null}})();const lead=(o.t0-now())/1000;
 const lastAt=o.beats[o.beats.length-1].at;o.beats.forEach((b,j)=>{const w=Math.max(0,lead+b.at/1000);try{if(q.get('osnd')==='0')return;if(OUT==='c'){Sound.tone(midi(b.n),w,(lastAt-b.at)/1000+DDUR+.4,.12,.7);return}if(STACK){let i0=j;if(STACK!=='all')while(i0>0&&(midi(o.beats[i0-1].n)-midi(o.beats[i0].n))%12===0)i0--;const sofar=[...new Set(o.beats.slice(STACK==='all'?0:i0,j+1).map(x=>x.n))],v=.15*Math.min(1,1.3/Math.sqrt(sofar.length));sofar.forEach(n=>Sound.tone(midi(n),w,DDUR,v,DF));return}Sound.tone(midi(b.n),w,DDUR,.15,DF);if(OUT==='b'&&j>0&&o.beats[j-1].n!==b.n)Sound.tone(midi(o.beats[j-1].n),w,DDUR,.09,DF)}catch(e){}})} /* on the audio clock up front (lead.js), so a slow frame can't bend the rhythm */
if(OUT!=='0'){const _ride=ride;ride=function(){_ride();try{if(!LV||!LV.jump||!S||!S.won)return;const o=plan(now());if(!o)return;O={...o,lv:LV};schedule(O);endAt=Math.max(endAt,O.t0+O.out)}catch(e){console.error(e)}}}
/* spotlight veil: forks.js spot() with shade=all, sp=med: the night sky at .62 over the board, holes (dest-out radial, .55 stop) of 95 on
   string cells and 130 on stars, drawn at half size */
let cv=null;
/* v2b: the veil is its own canvas ELEMENT laid over the board canvas (half size, like forks.js), so easing it in and out is a CSS opacity
   change on the compositor; the board canvas never paints a full-screen veil per frame (that fill was the outro's slow frames).
   A, C: built once. B: its holes move with the spark, so it is rebuilt at half size each frame. */
function veilEl(o){if(o.el&&o.el.isConnected)return o.el;const c=document.createElement('canvas');c.width=W/2;c.height=H/2;c.className='outro-veil';c.style.opacity='0';c.style.pointerEvents='none';
 const host=view.el,after=view.cv;host.insertBefore(c,after.nextSibling);o.el=c;o.built=0;return c}
function veil(t,o,a){const c=veilEl(o);if(OUT==='b'||!o.built){const c0=cv;cv=c;try{buildVeil(t,o,1)}finally{cv=c0}o.built=1}const op=a.toFixed(3);if(c.style.opacity!==op)c.style.opacity=op}
function veilOff(o){if(o&&o.el){o.el.remove();o.el=null}}
function buildVeil(t,o,a){const s=cv.getContext('2d');s.setTransform(1,0,0,1,0,0);s.globalCompositeOperation='source-over';s.clearRect(0,0,W/2,H/2);
 s.fillStyle=`rgba(${SKY},${SP*a})`;s.fillRect(0,0,W/2,H/2);s.setTransform(.5,0,0,.5,0,0);s.globalCompositeOperation='destination-out';
 const hole=(x,y,r,al)=>{if(al<=0||r<=1)return;const g=s.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(0,0,0,${al})`);g.addColorStop(.55,`rgba(0,0,0,${al*.9})`);g.addColorStop(1,'rgba(0,0,0,0)');s.fillStyle=g;s.beginPath();s.arc(x,y,r,0,7);s.fill()};
 const e=t-o.t0;
 if(OUT==='b'){ /* the light travels with the spark; stars and the string behind them stay lit once reached */
  const bs=o.beats;for(let j=0;j<bs.length;j++){const b=bs[j],u=(e-b.at)/320;if(u<=0)continue;const g=ease(Math.min(1,u));hole(...P(b.k),130*(.35+.65*g),g);
   if(j>0){const a0=bs[j-1].i;for(let i=a0;i<=b.i;i++)hole(...P(S.path[i]),95,1)}}
  if(e<bs[0].at+80){hole(...P(bs[0].k),130*.35*ease(e/(bs[0].at+80)),1)} /* the start lifts first */
  const hp=o.head;if(hp)hole(hp[0],hp[1],110,1);for(let r=-1;r>=-3;r--)hole(...G(LV.start,r),95,bs.length&&e>bs[0].at?1:0)}
 else{for(const k of S.path)hole(...P(k),95,1);for(const b of o.beats)hole(...P(b.k),130,1);for(let r=-1;r>=-3;r--)hole(...G(LV.start,r),95,1)}}
/* the spark for one jump = lead.js's own route spark with one leg, in the colour of the note you carried on it */
function leg(o,j){const a=o.beats[j-1],b=o.beats[j],cells=S.path.slice(a.i,b.i+1),API=A();const T=API.RTRAV||420,dep=Math.max(0,b.at-T);
 return {T0:o.t0,col:colOf(a.n),legs:[{dep,arr:b.at,from:a.k,ps:API.pts(cells)}]}}
function seepAt(id,k,n,v,hold){ /* the start star and the end door: index.html's doorSeep skips them after a win, so their note's wash is drawn here, same envelope */
 const vv=hold?Math.max(0,v-hold):v,a=v<0?0:Math.min(1,v/140)*Math.pow(Math.max(0,1-vv/1500),.7);if(a<=.004)return;const [x,y]=P(k),r=50*(.25+.75*(1-Math.pow(1-Math.min(1,v/650),3)));
 try{view.look.soundAt(ctx,id,x,y,colOf(n),a*.85,id===9001?r*66/50:r,id===9001?66:50)}catch(e){} /* reuse the game's own seep layers (start = your-note seep 9001 at its 66 size; end door = its door seep id), so no new 470px canvas is made mid-outro */}
function tick(t){const o=O;if(o&&(o.lv!==LV||!S||!S.won)){veilOff(o);O=null;return}if(!o)return;const e=t-o.t0;if(e<0)return;if(e>o.out+50){veilOff(o);O=null;return}
 const a=e<VIN?ease(e/VIN):e>o.end?1-ease((e-o.end)/VOUT):1;
 /* each star sings on its beat: flare it (index.html's own seep + tap look), or draw its wash here when the game won't */
 o.beats.forEach((b,j)=>{if(!b.done&&e>=b.at){b.done=1;b.t=t;const end=j===o.beats.length-1;if(q.get('ofl')==='0')return;if(j>0&&!end)flares[b.k]=t;try{anims.push({x:P(b.k)[0],y:P(b.k)[1],t,col:COLOR[b.n]})}catch(_){}}});
 /* the head position (B: the light rides it) */
 o.head=null;
 if(OUT==='a'||OUT==='b'){for(let j=1;j<o.beats.length;j++){const b=o.beats[j],dep=b.at-(A().RTRAV||420);if(e>=dep&&e<=b.at){const R=o.legs[j]||(o.legs[j]=leg(o,j));const u=Math.max(0,Math.min(1,(e-dep)/Math.max(1,b.at-dep))),ps=R.legs[0].ps;let p=alongP(ps,ease(u));p[1]-=Math.sin(Math.PI*u)*34;o.head=p}}}
 if(q.get('ov')!=='0')veil(t,o,a);
 if(q.get('ofl')!=='0'&&q.get('ose')!=='0')o.beats.forEach((b,j)=>{if(b.done&&(j===0||j===o.beats.length-1))seepAt(j===0?9001:b.k,b.k,b.n,t-b.t,OUT==='c'?o.beats[o.beats.length-1].at-b.at+400:0)});
 if(OUT!=='c'&&q.get('osp')!=='0'){const API=A();if(API&&API.drawR)for(let j=1;j<o.beats.length;j++){const R=o.legs[j]||(o.legs[j]=leg(o,j));API.drawR(R,t)}}}
function alongP(ps,u){if(ps.length<2)return ps[0].slice();let tot=0;const d=[];for(let i=1;i<ps.length;i++){const l=Math.hypot(ps[i][0]-ps[i-1][0],ps[i][1]-ps[i-1][1]);d.push(l);tot+=l}let s=u*tot;for(let i=0;i<d.length;i++){if(s<=d[i]){const f=d[i]?s/d[i]:0;return [ps[i][0]+(ps[i+1][0]-ps[i][0])*f,ps[i][1]+(ps[i+1][1]-ps[i][1])*f]}s-=d[i]}return ps[ps.length-1].slice()}
{const _d=draw;draw=function(t){const a0=now();_d(t);const a1=now();try{tick(now())}catch(e){console.error(e)}if(window.__oprof)__oprof.push([a0,a1-a0,now()-a1])}}
window.__outro=()=>O&&{out:OUT,t0:O.t0,beats:O.beats.map(b=>b.n+'@'+b.at+(b.done?'*':'')),end:O.end,outAt:O.out,e:now()-O.t0,endAt};
/* ---- take picker (preview page only) ---- */
if(q.get('ui')!=='0')addEventListener('DOMContentLoaded',()=>{},{once:true});
function ui(){if(q.get('ui')!=='1'||document.getElementById('otk'))return;const d=document.createElement('div');d.id='otk';
 d.style.cssText='position:fixed;left:0;right:0;bottom:max(8px,env(safe-area-inset-bottom));z-index:99;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:0 8px;font:600 13px system-ui,sans-serif;pointer-events:none';
 const mk=(lab,act,on)=>{const b=document.createElement('button');b.textContent=lab;b.style.cssText=`pointer-events:auto;border:1px solid rgba(255,240,210,.35);border-radius:16px;padding:6px 11px;color:#fff3dc;background:${on?'rgba(255,214,140,.32)':'rgba(10,12,34,.72)'}`;b.addEventListener('pointerdown',ev=>{ev.stopPropagation()},true);b.addEventListener('click',ev=>{ev.stopPropagation();act()});d.appendChild(b)};
 const go=o=>{const u=new URL(location.href);u.searchParams.set('out',o);u.searchParams.set('l',String(LI||0));location.href=u.toString()};
 [['A Spark replay','a'],['B Light the way','b'],['C Octaves stack','c'],['No outro','0']].forEach(([l,o])=>mk(l,()=>go(o),OUT===o));
 document.body.appendChild(d)}
setTimeout(ui,0);
})();
