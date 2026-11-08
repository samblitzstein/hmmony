/* TONE DOWN LATER FORKS v1 (3b, Nov 4 2026). Add-on to the prototype (loads after index.html's script, before lead.js).
   Sam 10:14am: "other fork decisions should be deprioritized in the UI but not hidden."
   CURRENT CHOICE = the doors you can reach from the tip of your string along open lanes without passing another door (same rule as the
   lead star's listen phrase). Every other door, swap star or shifter that isn't on your string sits back. Doors you've taken stay as they are.
   It only changes when you pass a door (a 0.7s ease at that moment) and never while you're just looking. Tapping a toned-down door to
   listen lifts it for as long as it rings, then it settles back. Everything stays visible and tappable.
   ?fork=dim|mist|spot|sleep(hollow)|none (default dim). ?fade=ms. */
(()=>{
const q=new URLSearchParams(location.search),MODE=q.get('fork')||'spot';if(MODE==='none')return;
const FADE=+q.get('fade')||700,SKY=[7,10,36];
const now=()=>performance.now();
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const open=(r,c)=>r>=0&&r<NR&&c>=0&&c<NC&&GR[r][c]!=='@';
const nbrs=k=>{const [r,c]=rc(k);return [[r+1,c],[r-1,c],[r,c+1],[r,c-1]].filter(([a,b])=>open(a,b)).map(([a,b])=>key(a,b))};
const tokOf=k=>{const [r,c]=rc(k);return GR[r][c]};
const isEl=k=>{const t=tokOf(k);return isNote(t)||(t==='E'&&!!PITCH[k])||t==='N'||/^W/.test(t)};
const noteOf=k=>{const t=tokOf(k);return isNote(t)?t:PITCH[k]||null};
const colOf=n=>{try{return c3(COLOR[n])}catch(e){return [220,215,235]}};
const P=k=>{const [r,c]=rc(k);return G(c,r)};
/* the current choice (as lead.js frontier): doors reached from the tip without crossing your string or another door; keep the ones further
   up the level than the tip, so a door's sealed back (reachable from behind) doesn't count */
function front(tip,blk){const seen=new Set([tip]),qq=[tip],out=[],route=new Set(),prev={};
 while(qq.length){const k=qq.shift();for(const n of nbrs(k)){if(seen.has(n)||blk.has(n))continue;seen.add(n);prev[n]=k;if(tokOf(n)!=='#'){if(isEl(n))out.push(n);continue}qq.push(n)}}
 const tr=rc(tip)[0],ahead=out.filter(d=>rc(d)[0]>tr),use=ahead.length?ahead:out;
 for(const d of use){let k=prev[d];while(k!==undefined&&k!==tip){route.add(k);k=prev[k]}}
 return {doors:new Set(use),route}}
/* Levels rule (Sam Nov 5 6:48pm on L4: 'too dark for me to look ahead'): the Spotlight lights WHOLE BRANCHES of the current choice, everything
   from this fork up to the next fork or the end, every door on each branch included; only what lies past the NEXT fork stays dim. ?branch=0 = old */
const BRANCH=(q.get('spot')||'branch')==='branch'; /* preview only until Sam commits (6:52pm); ?spot=locked or no param = today's spotlight */
function current(){const tip=S.path[S.path.length-1],inP=new Set(S.path),c=front(tip,inP);if(!BRANCH)return c;
 for(const d of [...c.doors]){let k=d;const bl=new Set([...inP,...c.route]);for(let n=0;n<24;n++){bl.add(k);const nx=front(k,bl);if(nx.doors.size!==1)break;const e=[...nx.doors][0];if(c.doors.has(e))break;c.doors.add(e);for(const r of nx.route){c.route.add(r);bl.add(r)}k=e}}
 return c}
let F=null;
function reset(){const els=[];GR.forEach((row,r)=>row.forEach((t,c)=>{const k=key(r,c);if(isEl(k))els.push(k)}));F={lv:LV,els,v:{},from:{},to:{},t0:0,sig:'',route:new Set(),lit:new Set(),lane:new Set()};retarget(true)}
/* v72 (Sam Nov 5 9:55pm, audit 3 #8): passing your fork door never dims the other fork door. What the spotlight has lit stays lit for the
   rest of the level (doors and the lanes to them); passing a door only ADDS light (the branch you chose), so the fork you skipped stays exactly
   as it was. ?keep=0 = old (the skipped fork sinks back) */
const KEEP=q.get('keep')!=='0';
function retarget(snap){const cur=current(),onP=new Set(S.path),t=now();if(KEEP){for(const k of cur.doors)F.lit.add(k);for(const k of cur.route)F.lane.add(k);F.route=F.lane}else F.route=cur.route;
 for(const k of F.els){const tgt=onP.has(k)||cur.doors.has(k)||F.lit.has(k)||S.won?0:1;if(snap){F.v[k]=tgt;F.from[k]=tgt}else F.from[k]=val(k,t);F.to[k]=tgt}F.t0=t}
const ease=u=>u<=0?0:u>=1?1:u*u*(3-2*u);
function val(k,t){const u=ease((t-F.t0)/FADE);return F.from[k]+(F.to[k]-F.from[k])*u}
/* tap to listen: a toned-down door lifts while it rings (your touch, not the board moving on its own) */
function lift(k,t){const f=flares[k];if(f===undefined)return 0;const e=t-f;if(e<0)return 0;return e<1300?1:Math.max(0,1-(e-1300)/700)}
/* signature: which doors are current. Recomputed every frame but it only changes when you pass (or back out of) a door */
function sig(){return S.path.filter(isEl).join(',')+'|'+(S.won?1:0)} /* tester v1 #1: only a door pass (or backing out of one) changes it, never walking past a branch lane */
function glowAt(x,y,r,c,a,mid){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(mid||.5,rgba(c,a*.85));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}
/* ---- treatments ---- */
function hue(k,v,a){const n=noteOf(k);if(!n)return;const [x,y]=P(k);glowAt(x,y,11,colOf(n),a*v,.55)} /* tester v1: keep each later door's own hue (one color = one note) */
function dim(k,v){const [x,y]=P(k);glowAt(x,y,86,SKY,.84*v,.45);hue(k,v,.6)} /* NIGHT VEIL: the door sinks into the dark sky; its star and slot show through faintly */
function mist(k,v){const [x,y]=P(k),s=(rc(k)[0]*7+rc(k)[1]*3)%5; /* MIST: a pale violet dust drifts over it, out of focus; fixed shapes, no motion */
 glowAt(x,y,82,SKY,.55*v,.42);glowAt(x+((s-2)*5),y-6,72,[110,98,146],.36*v,.35);glowAt(x-10,y+12,50,[132,120,164],.24*v,.3);glowAt(x+12,y-14,38,[150,140,180],.14*v,.3);hue(k,v,.55)}
function sleep(k,v){const [x,y]=P(k),n=noteOf(k); /* HOLLOW: the slot stays; the ink star is covered and a thin ring of its own color stands in (color kept, weight gone) */
 glowAt(x,y,64,SKY,.3*v,.5);glowAt(x,y,34,[9,11,32],.97*v,.66);const c=n?colOf(n):[200,196,220];ctx.globalAlpha=v;ctx.strokeStyle=rgba(c,.85);ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,12,0,7);ctx.stroke();ctx.globalAlpha=1}
let spotCv=null,baseCv=null,baseK='';const SPOLD=q.get('spold')==='1',SPFULL=q.get('spfull')!=='0';let spotFull=null;
/* SPOTLIGHT STYLES (Sam 1:41pm comment: "a few iterations on the spotlight style, eg how dark/bright, which parts of the UI incl nebula are shaded")
   ?sp=soft|med|deep  how dark the veil gets (0.40 / 0.62 / 0.82 of the night sky)
   ?shade=all|sky|neb|doors  what the veil covers: everything; only the open sky lanes (nebula walls stay lit); only the nebula walls (sky
     lanes stay clear); or nothing but the later doors plus a soft dark edge around the board
   ?glow=1  a faint warm light added inside the pools (brighter, not just less dark)
   Later doors always get a little extra shade on top, so they read as "later" whichever style. */
const SP={soft:.4,med:.62,deep:.82}[q.get('sp')||((q.get('spot')||'branch')==='branch'?'soft':'med')]||.62,SHADE=q.get('shade')||'all',GLOW=q.get('glow')==='1';
function cellBlob(g,k,a){const [x,y]=P(k),ry=Math.abs(G(0,1)[1]-G(0,0)[1])||CS;g.save();g.translate(x,y);g.scale(1,ry/CS);const r=CS*.82,gr=g.createRadialGradient(0,0,0,0,0,r);gr.addColorStop(0,`rgba(0,0,0,${a})`);gr.addColorStop(.6,`rgba(0,0,0,${a})`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,r,0,7);g.fill();g.restore()}
function base(){const k=LI+'|'+SHADE;if(baseCv&&baseK===k)return baseCv;baseK=k;if(!baseCv){baseCv=document.createElement('canvas');baseCv.width=W/2;baseCv.height=H/2}
 const g=baseCv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.clearRect(0,0,W/2,H/2);g.setTransform(.5,0,0,.5,0,0);const sky=`rgb(${SKY})`;
 const open=[];GR.forEach((row,r)=>row.forEach((t,c)=>{if(t!=='@')open.push(key(r,c))}));
 if(SHADE==='all'){g.fillStyle=sky;g.fillRect(0,0,W,H)}
 else if(SHADE==='sky'){for(const k of open)cellBlob(g,k,1);g.globalCompositeOperation='source-in';g.fillStyle=sky;g.fillRect(0,0,W,H)}
 else if(SHADE==='neb'){g.fillStyle=sky;g.fillRect(0,0,W,H);g.globalCompositeOperation='destination-out';for(const k of open)cellBlob(g,k,1)}
 else{const vg=g.createRadialGradient(CX,CY,Math.min(W,H)*.32,CX,CY,Math.hypot(W,H)*.52);vg.addColorStop(0,`rgba(${SKY},0)`);vg.addColorStop(1,`rgba(${SKY},1)`);g.fillStyle=vg;g.fillRect(0,0,W,H)}
 return baseCv}
function spot(t){ /* SPOTLIGHT: the board dims; soft light pools sit on the current doors, the lane to them, and your string */
 let any=0,moving=t-F.t0<FADE+20;for(const k of F.els){any=Math.max(any,val(k,t));if(lift(k,t)>0&&t-flares[k]<2100)moving=true}
 const cur=F.els.filter(k=>F.to[k]===0&&!S.path.includes(k));
 if(any>.01){const ck=SPOLD?S.path.length+'|'+F.sig:S.path.join(',')+'|'+F.sig+'|'+[...F.route].join(',')+'|'+LI+'|'+any+'|'+F.els.map(k=>val(k,t)+':'+lift(k,t)).join(',');if(!(spotCv&&!(SPOLD&&moving)&&F.spotK===ck)){F.spotK=SPOLD&&moving?'':ck; /* the veil is rebuilt only while easing, lifting or when the string changes */ /* v72p (tester s242: 66-100ms frames during L3's roll call): the veil was rebuilt every frame for 2s after any door rang, though a rung door holds still for 1.3s; now it is rebuilt only when what it shows changes (same pixels; ?spold=1 = old) */
  if(!spotCv){spotCv=document.createElement('canvas');spotCv.width=W/2;spotCv.height=H/2}
  const s=spotCv.getContext('2d');s.setTransform(1,0,0,1,0,0);s.globalCompositeOperation='source-over';s.clearRect(0,0,W/2,H/2);s.globalAlpha=SP*any;s.drawImage(base(),0,0);s.globalAlpha=1;
  s.setTransform(.5,0,0,.5,0,0);
  for(const k of F.els){const v=Math.max(0,val(k,t)-lift(k,t));if(v>.01){const [x,y]=P(k),g=s.createRadialGradient(x,y,0,x,y,92);const xa=BRANCH?.12:Math.min(.95,SP*.6+.25);g.addColorStop(0,`rgba(${SKY},${xa*v})`);g.addColorStop(.5,`rgba(${SKY},${xa*v*.8})`) /* branch preview: later doors stay readable (Sam Nov 4 'deprioritized, not hidden'); only a light extra shade */;g.addColorStop(1,`rgba(${SKY},0)`);s.fillStyle=g;s.beginPath();s.arc(x,y,92,0,7);s.fill()}}
  s.globalCompositeOperation='destination-out';
  const hole=(x,y,r,a)=>{if(a<=0)return;const g=s.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(0,0,0,${a})`);g.addColorStop(.55,`rgba(0,0,0,${a*.9})`);g.addColorStop(1,'rgba(0,0,0,0)');s.fillStyle=g;s.beginPath();s.arc(x,y,r,0,7);s.fill()};
  for(const k of F.els){const a=1-Math.max(0,val(k,t)-lift(k,t));hole(...P(k),130,a)}
  for(const k of S.path)hole(...P(k),95,1);for(const k of F.route)hole(...P(k),95,1);for(let r=-1;r>=-3;r--)hole(...G(LV.start,r),95,1);F.spotNew=1}else if(SPFULL&&F.spotNew){if(!spotFull){spotFull=document.createElement('canvas');spotFull.width=W;spotFull.height=H}const fg=spotFull.getContext('2d');fg.setTransform(1,0,0,1,0,0);fg.globalCompositeOperation='source-over';fg.globalAlpha=1;fg.clearRect(0,0,W,H);fg.drawImage(spotCv,0,0,W,H);F.spotNew=0} /* v73c (phrase frames 50-83ms; forks spot was the top cost during a listen phrase): while the veil changes every frame (doors lifting as they sing) it was drawn twice at full size, once into the full-size copy and once onto the board. Now a frame that rebuilds it lays the half-size veil straight on the board, and the full-size copy is made once, on the first frame it holds still */ /* the arrival tail below the start stays lit */
  ctx.drawImage(SPFULL&&spotFull&&!F.spotNew?spotFull:spotCv,0,0,W,H)} /* v72p (tester s242: L3 roll-call frames): the half-size veil was scaled up onto the board every frame (~6ms of drawing a frame on the test phone); it is now scaled up once, when it is rebuilt, and the full-size copy is laid on 1:1 (same pixels; ?spfull=0 = old) */
 if(GLOW&&!S.won){const warm=[255,236,200];ctx.save();ctx.globalCompositeOperation='lighter';for(const k of cur){const [x,y]=P(k);glowAt(x,y,120,warm,.1,.3)}
  const [tx,ty]=P(S.path[S.path.length-1]);glowAt(tx,ty,100,warm,.08,.3);ctx.restore()}}
const T={dim,mist,sleep};
function render(t){if(MODE==='spot'){spot(t);return}const fn=T[MODE]||dim;ctx.save();
 for(const k of F.els){const v=Math.max(0,val(k,t)-lift(k,t));if(v>.01)fn(k,v)}ctx.restore()}
{const _d=draw;draw=function(t){_d(t);try{if(!LV||!LV.jump||!S||!S.path||!S.path.length)return;if(!F||F.lv!==LV){reset();F.sig=sig()}
 const sg=sig();if(sg!==F.sig){F.sig=sg;retarget(false)}render(now())}catch(e){console.error(e)}}}
window.__forks=()=>F&&{mode:MODE,cur:F.els.filter(k=>F.to[k]===0).map(k=>noteOf(k)||tokOf(k)),later:F.els.filter(k=>F.to[k]===1).map(k=>noteOf(k)||tokOf(k))};
})();
