// WRONG-GUESS LESSON (Sam LOCK Nov 2 2:46pm: "lets err on the side of not making this too annoying to get it wrong. so we freeze, briefly show
// and play you the wrong notes, and then reset"). Ported from 3b's branding/lesson/v2/lesson.js showWhy() (process/handoff-wrong-lesson.md).
// Loaded after the game script; it wraps verdict and draw only. On any wrong (beating) tie-off, at every gate:
//  0.0s  the board freezes; everything dims except the gate and the star you picked; the gate plays its note
//        (a note gate sounds with its S4 wash; an octave gate plays your first note and its octave together)
//  0.65s your note plays (your star's S4 sounding wash) and a bead of its colour runs into the gate
//  1.3s  both together, beating, and the gate JARS (W2)
//  2.5s  the dim lifts and the string snaps back (snapNow). No listen step. A right pick is unchanged. Shut (one note) keeps its thud.
(function(){
const LES={seq:null};window.LES=LES;
const now=()=>performance.now(),XY=k=>{const [r,c]=rc(k);return G(c,r)},tok=k=>{const [r,c]=rc(k);return GR[r][c]};
const lastStar=()=>{for(let i=S.path.length-1;i>=0;i--)if(isNote(tok(S.path[i])))return S.path[i];return null};
const oct=(a,b)=>nm(midi(a)+(midi(b)>midi(a)?12:-12));
const at=(ms,f)=>setTimeout(()=>{try{f()}catch(e){console.error('lesson',e)}},ms);
function jar(k,ms){for(let d=0;d<ms;d+=330)at(d,()=>{shake={k,t:now()}})} // W2 jar: the gate's sideways shake, kept going while the clash rings
function showWhy(k,before,done){
 const sk=lastStar(),note=PITCH[k]||HUM[k]||null,mine=sk!==null&&before.includes(tok(sk))?tok(sk):before[before.length-1],first=before.find(n=>n!==mine)||mine, // the carry is sorted by pitch: 'mine' = the star you picked last
  want=note?[note]:TRI[k]?(()=>{const pc=pcOf(first),seen=new Set(),w=[];GR.forEach(row=>row.forEach(t=>{if(isNote(t)&&pcOf(t)===pc&&!seen.has(midi(t))){seen.add(midi(t));w.push(t)}}));return w.sort((a,b)=>midi(a)-midi(b)).slice(0,3)})():[first,first===mine?(()=>{let w=null;GR.forEach(row=>row.forEach(t=>{if(isNote(t)&&Math.abs(midi(t)-midi(first))===12&&(!w||midi(t)>midi(w)))w=t}));return w||nm(midi(first)+12)})():oct(first,mine)], /* v54b: one note (shut): its octave partner on the board, else the octave above */ // what the gate takes (an octave gate: your first note and its octave; v52 three-ring gate: its letter's three registers on the board)
  both=note?[note,mine]:[first,mine];
 busy=true;LES.seq={k,sk,t0:now(),want,mine};try{window.__tlog&&__tlog(['L','lesson',LV.id,k,want.join(':'),mine])}catch(_){}if(proofLevel()&&REDEAL_NOW)PEND=nextDeal();
 at(0,()=>{if(HUM[k])humAt(k,1);else want.forEach((n,j)=>Sound.tone(midi(n),j*.03,1.4,.2))});
 at(650,()=>{Sound.tone(midi(mine),0,1.4,.2)});
 at(1300,()=>{both.forEach(n=>Sound.beat(midi(n)));jar(k,1100)});
 at(2500,()=>{LES.seq=null;done()})}
// v44 PROOF IN CH1 (Sam Nov 2 3:44pm via Levels, pending playtest; levels/CH1-RAMP-PROPOSAL.md "When you guess wrong"): in chapter 1 levels 1-3
// a miss runs the lesson, then the level DEALS FRESH NOTES instead of snapping back, until you clear it on first picks. Warm-ups keep lesson + snap back.
// Fresh deal = the whole board moved by a random few semitones (every gate, pair and lure keeps its shape; colours keep their order) and, half
// the time, mirrored left to right, so the winning route can't be remembered: only the ear finds it.
// Prototype's reading, no board data from Levels: swap in real dealt boards if Levels makes them.
const PROOF=['c1','c2','c3'],ORIG={};LES.proof=PROOF;
const proofLevel=()=>{try{return PROOF.includes(LEVELS[mainOf(LI)].id)}catch(e){return false}};
const shiftTok=(t,d)=>{const m=/^([DE])([=~])([A-G]s?\d?)$/.exec(t);if(m){const x=/\d$/.test(m[3])?m[3]:m[3]+HUMOCT;return m[1]+m[2]+nm(midi(x)+d)}return isNote(t)?nm(midi(t)+d):t};
/* v56 NEVER CHANGE THE BOARD UNDER YOU (Sam Nov 3 1:38pm, FIL: "the reset he didn't realize that it got reset underneath him"; Levels ruling 1:39pm):
   a miss plays the lesson, then the string snaps back to the last opened gate (the start of the part) on every level; the board never re-deals
   in place. Ch1 proof is now "one more like that": if a proof level had a miss, the screen after your win is a fresh deal of the same level,
   and you move on once a deal is cleared with no miss. ?redeal=now restores v44's in-place re-deal. */
const REDEAL_NOW=/[?&]redeal=now\b/.test(location.search),OWE=new Set();LES.owe=OWE;let PENDO=null;
{const _ride=ride;ride=function(){const r=_ride.apply(this,arguments);const m=mainOf(LI);if(!REDEAL_NOW&&OWE.has(m)){OWE.delete(m);try{PENDO=nextDeal()}catch(e){console.error('owed deal',e);PENDO=null}}return r}}
LES.nextOwed=()=>{const q=PENDO;PENDO=null;if(!q)return null;LEVELS[q.i]=q.lv;LES.dealt={i:q.i,d:q.d,mir:q.mir,rows:q.lv.rows};return q.i};
function nextDeal(){const i=LI,o=ORIG[i]||(ORIG[i]={rows:LEVELS[i].rows,start:LEVELS[i].start,d:0}),ms=o.rows.join(' ').split(' ').map(t=>{const m=/([A-G]s?\d)$/.exec(t);return m?midi(m[1]):null}).filter(v=>v!==null),lo=Math.min(...ms),hi=Math.max(...ms);
 const ok=[];for(let d=-5;d<=5;d++)if(d&&d!==o.d&&lo+d>=43&&hi+d<=88)ok.push(d);const d=ok.length?ok[Math.floor(Math.random()*ok.length)]:0;o.d=d;
 const mir=Math.random()<.5,nc=o.rows[0].split(' ').length;const lv={...LEVELS[i],start:mir?nc-1-o.start:o.start,rows:o.rows.map(r=>{const a=r.split(' ').map(t=>shiftTok(t,d));return (mir?a.reverse():a).join(' ')})};
 // tester v44: building the new sky in jumpTo stalled ~200ms at the swap, so the deal's sky is baked during the 2.5s freeze through the same
 // background prep the game uses for the next level (lookPreTick steps it a little each frame); jumpTo then finds it ready.
 const C0=COLOR;try{const k=lookKey(lv,null);COLOR=new Proxy({},{get:(o,x)=>typeof x==='string'&&isNote(x)?C0[nm(midi(x)-d)]:C0[x]}); /* the deal keeps the colour order, so note X+d wears X's colour */if(!LOOKPRE[k])LOOKPRE[k]=Look.prep(lookOpts(lv,null));lookPreK=k}catch(e){console.error('deal prep',e)}finally{COLOR=C0}
 return {i,d,mir,lv,k:lookKey(lv,null)}}
let PEND=null;
function redeal(){const q=PEND||nextDeal();PEND=null;LEVELS[q.i]=q.lv;LES.dealt={i:q.i,d:q.d,mir:q.mir,rows:q.lv.rows};jumpTo(q.i)}
LES.redeal=redeal;
const SHUTL=!/[?&]shutlesson=0\b/.test(location.search);
const _verdict=verdict;
verdict=function(k,t,r,x,y,before){
 if(!(t==='D'||t==='E'))return _verdict(k,t,r,x,y,before);
 /* v54b (blind-play audit Nov 3): an octave gate SHUT by one note (or the same note twice) only thudded, and the thud is a cut sound effect (v45), so the string vanished in silence and read as a refusal. It now gets the same lesson as a wrong pair: the gate plays your note and its octave, then yours, then both. ?shutlesson=0 restores the thud. */
 if(S.muddy&&(!S.shut||(SHUTL&&!PITCH[k]&&!HUM[k]&&!TRI[k]))&&before&&before.length){const sb=Sound.beat;Sound.beat=()=>{};try{_verdict(k,t,r,x,y,before)}finally{Sound.beat=sb}shake=null;held=null;
  showWhy(k,before,()=>{held=null;if(proofLevel()&&!REDEAL_NOW)OWE.add(mainOf(LI));if(proofLevel()&&REDEAL_NOW){const t0=now(),go=()=>{const p=PEND&&LOOKPRE[PEND.k];if(p&&!p.done&&now()-t0<6000){setTimeout(go,40);return}busy=false;redeal()};go()}else{busy=false;snapNow()}try{window.__tlog&&__tlog(['W',k,S.path[S.path.length-1],before.join(':'),PITCH[k]||'',0])}catch(_){}});return true} /* v50: the re-deal waits (board still frozen) until the new sky has baked in slices */
 return _verdict(k,t,r,x,y,before)};
function holes(pts,a){if(a<=0)return;ctx.save();ctx.fillStyle=`rgba(4,3,14,${.5*a})`;ctx.beginPath();ctx.rect(0,0,W,H);
 pts.forEach(([x,y,R])=>{ctx.moveTo(x+R,y);ctx.arc(x,y,R,0,Math.PI*2,true)});ctx.fill('evenodd');
 pts.forEach(([x,y,R])=>{const g=ctx.createRadialGradient(x,y,R*.55,x,y,R*1.25);g.addColorStop(0,'rgba(4,3,14,0)');g.addColorStop(1,`rgba(4,3,14,${.5*a})`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,R*1.25,0,7);ctx.arc(x,y,R,0,7,true);ctx.fill('evenodd')});ctx.restore()}
const _draw=draw;
draw=function(t){_draw(t);if(!LV)return;const q=LES.seq;if(!q)return;
 const e=(t-q.t0)/1000,a=Math.min(1,e/.3)*Math.min(1,Math.max(0,(2.5-e)/.3)),pts=[[...XY(q.k),78]];if(q.sk!==null)pts.push([...XY(q.sk),62]);holes(pts,a);
 if(q.sk!==null&&e>.65&&e<1.1){const u=Math.min(1,(e-.65)/.45),w=u*u*(3-2*u),[sx,sy]=XY(q.sk),[gx,gy]=XY(q.k),x=sx+(gx-sx)*w,y=sy+(gy-sy)*w,c=COLOR[q.mine];
  const g=ctx.createRadialGradient(x,y,2,x,y,12);g.addColorStop(0,`rgba(${c},.95)`);g.addColorStop(1,`rgba(${c},0)`);ctx.save();ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,12,0,7);ctx.fill();ctx.restore()}}; // a bead of your note's colour runs into the gate
window.__lesson=LES;
})();
