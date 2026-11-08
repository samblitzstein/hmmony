/* LISTEN + GUIDE STAR v4 (3b, Nov 4 2026). Add-on to the prototype (loads after index.html's script).
   Sam 10:01am: the guide star is hint-y: it should follow hint rules (show up when you don't know what to do or are doing it wrong) and be
   about "drag to follow". The "point" behavior (a ray at each door, singing with it) should happen at EVERY fork, from YOUR note.
   Loop = a stronger escalation of the drag hint.
   1. LISTEN (every choice, always): when a new choice opens in front of you (level start, or you pass a door), your own note (the tip of
      your string) plays a short phrase in time: a pick-up beat of your note alone with the interval word under it ("octave"), then a ray
      to each door of this choice, left to right, each door sung with your note. Doors wait until the phrase ends (?hold=0: they don't).
   2. GUIDE STAR (hint, only when stuck): stage 1 after 5s with no move, or a door refusing you: a small star lifts off your tip and drifts
      ahead along the lane to the next fork ("drag to follow"), waits, fades, and repeats until you move. Stage 2 after 10s more, or a second
      refusal: it becomes a comet that sweeps past every door of the choice, singing each with your note, and back. Any move forward clears it.
   Never: entering, opening or picking a door; changing the board. ?lead=0 turns it all off. ?word=0, ?title=0, ?beat=ms, ?h1=ms, ?h2=ms. */
(()=>{
const q=new URLSearchParams(location.search);if(q.get('lead')==='0')return;const GUIDE=q.get('guide')||'off'; /* Sam 10:41am: Off is the default */ /* Sam 10:02-10:03am: the listen rays from your note play at every fork either way; a toggle for the GUIDE STAR only: off, point (flies to the fork and waits), loop (sweeps each door's mouth, then waits at the fork) */
const LOOP=GUIDE==='loop',STAR=GUIDE!=='off',HINTS=q.get('hints')==='1'; /* the stuck-only guide star stays parked (hint rules) unless ?hints=1 */
const BEAT=+q.get('beat')||650,HOLD=q.get('hold')!=='0',H1=+q.get('h1')||5000,H2=+q.get('h2')||10000;
try{duetTick=function(){}}catch(e){} /* the listen phrase replaces the ahead duet */
const now=()=>performance.now();
let L=null,armed=false;
const coverUp=()=>{const c=document.getElementById('cover');if(!c||!c.isConnected)return false;if(c.classList.contains('gone'))return false; /* Sam 10:47am: start on the tap, not after the cover's 0.8s fade */const cs=getComputedStyle(c);return cs.display!=='none'&&cs.visibility!=='hidden'&&!c.classList.contains('gone')&&+cs.opacity>.05&&!c.hidden};
window.__leadOwnsStart=true; /* Sam 10:08am: the start note plays ONCE, automatically, when the level starts (the first drag no longer replays it) */
addEventListener('pointerdown',()=>{armed=true},{capture:true,passive:true}); /* the cover tap unlocks sound; the level then starts on its own */
const open=(r,c)=>r>=0&&r<NR&&c>=0&&c<NC&&GR[r][c]!=='@';
const nbrs=k=>{const [r,c]=rc(k);return [[r+1,c],[r-1,c],[r,c+1],[r,c-1]].filter(([a,b])=>open(a,b)).map(([a,b])=>key(a,b))};
const isDoor=k=>{const [r,c]=rc(k),t=GR[r][c];return isNote(t)||(t==='E'&&!!PITCH[k])};
const doorNote=k=>{const [r,c]=rc(k),t=GR[r][c];return isNote(t)?t:PITCH[k]};
const stop=k=>{const [r,c]=rc(k);return GR[r][c]!=='#'};
const held=()=>(S&&S.carry&&S.carry[0])||LV.startNote;
const colOf=n=>{try{return c3(COLOR[n])}catch(e){return [255,240,200]}};
const P=k=>{const [r,c]=rc(k);return G(c,r)};
const tipK=()=>S.path[S.path.length-1];
const WORD=()=>{if(q.get('word')!=='1')return '';const j=LV.jump||[];return j.includes('letter')?'octave':j.includes(7)?'fifth':''}; /* from the level's jump field (Levels rule INTERVAL WORD, Sam OK 9:49am) */
const PRIMER={test:'Some stars/change/your note',shifter:'Swirls lift/a/fifth'}; /* v69 PRIMERS (Sam Nov 5 8:42pm idea, 8:44pm "Primer: good", 8:45pm "Primer before spark, agreed. Same rhythm as intros"): every new element (a chapter's intro) or variation (a test) opens with a 3-line title in L1's own code and rhythm; drills get none. Wording = the context review's drafts (state the rule, never the trick). '/' splits the lines. ?primers=0 = L1's title only */
const RCDRAG=(()=>{let v=q.get('rcdrag');if(v==null){try{v=localStorage.getItem('hmmony.proto.rcdrag')}catch(e){}}return v==='1'})();const OCT=(()=>{let v=q.get('oct');if(!v){try{v=localStorage.getItem('hmmony.proto.oct')}catch(e){}}return v==='same'||v==='glow'||v==='both'?v:'today'})(); /* v73c OCTAVE TAKES (Sam Nov 8 11:34am playtest: "he didn't understand what octaves are so he just did whatever the lead star did"; the star visits every door, so copying it is a coin flip): ?oct=same = L1's title says what an octave is; ?oct=glow = in the listen phrase, a door that takes your note glows in your colour and its own together, only after it sounds; ?oct=both. PREVIEW picker 'Octave help' */
const TITLE=()=>{const v=q.get('title');if(v==='0')return '';if(v&&LI===0)return v;if(LI!==0){if(q.get('primers')==='0')return '';const r=String(LV.role||''),id=LV.id||'';return LV.primer||(r==='test'||id==='c5'?PRIMER.test:/^shifter/.test(r)||id==='s1'?PRIMER.shifter:'')}const j=LV.jump||[];const w=j.includes('letter')?'octave':j.includes(7)?'fifth':'';return w?(w==='octave'&&(OCT==='same'||OCT==='both')?'Same note,/higher/or lower':'Follow the '+w+'s'):''}; /* chapter title, chapter's first level only (Sam 6:06am) */
/* the choice in front of you: doors reachable along open lanes from the tip, further along the level than you */
function frontier(){const tip=tipK(),inP=new Set(S.path),seen=new Set([tip]),prev={},qq=[tip],out=[];
 while(qq.length){const k=qq.shift();for(const n of nbrs(k)){if(seen.has(n)||inP.has(n))continue;seen.add(n);prev[n]=k;if(stop(n)){if(isDoor(n))out.push(n);continue}qq.push(n)}}
 const tr=rc(tip)[0],ahead=out.filter(d=>rc(d)[0]>tr),use=ahead.length?ahead:out;
 const route=d=>{const r=[];let k=prev[d];while(k!==undefined&&k!==tip){r.unshift(k);k=prev[k]}return r};
 return use.map(d=>({k:d,mouth:route(d),note:doorNote(d),swap:!!SWAP[d]})).sort((a,b)=>rc(a.k)[1]-rc(b.k)[1])}
/* WHOLE BRANCHES (Levels Nov 5 6:49pm, from Sam's L4 comment 'the dimmed exits make look-ahead impossible'): the current choice runs each branch
   on from its first door to the next fork or the end, so the phrase sings every door on a branch, branch by branch, in order (L4: G3, C3 | G5, G6).
   ?sing=doors = only the first door of each branch (before). Pending Sam's pick on the decision card. */
const SING=q.get('sing')||'branch'; /* Sam Nov 5 7:03pm (lead star thread, v51 'whole branches'): 'yeah this seems fine for playtesting'. ?sing=doors = the old one-door-per-branch phrase */ /* Prototype: branch singing is a preview with ?spot=branch until Sam picks (Nov 5 6:52pm) */
function nextDoors(from,block){const seen=new Set([from]),qq=[from],out=[];while(qq.length){const k=qq.shift();for(const n of nbrs(k)){if(seen.has(n)||block.has(n))continue;seen.add(n);if(stop(n)){if(isDoor(n))out.push(n);continue}qq.push(n)}}
 const fr=rc(from)[0],ahead=out.filter(d=>rc(d)[0]>fr);return {doors:ahead.length?ahead:out,seen}}
function branches(F){if(SING!=='branch')return F;const block0=new Set(S.path);F.forEach(f=>{block0.add(f.k);(f.mouth||[]).forEach(m=>block0.add(m))});const out=[];
 for(const f of F){out.push(f);let cur=f.k;const block=new Set(block0);for(const g of F)if(g.k!==f.k)block.add(g.k);
  for(let n=0;n<4;n++){const {doors,seen}=nextDoors(cur,block);if(doors.length!==1)break;const d=doors[0];if(out.some(o=>o.k===d))break;seen.forEach(x=>block.add(x));out.push({k:d,note:doorNote(d),swap:!!SWAP[d],branchOf:f.k});cur=d}}
 return out}
function walk(a,b,thru){if(a===b)return [a];const prev={[a]:null},qq=[a];while(qq.length){const k=qq.shift();if(k===b)break;for(const n of nbrs(k)){if(n in prev)continue;if(!thru&&stop(n)&&n!==b&&!S.path.includes(n))continue;prev[n]=k;qq.push(n)}}
 if(!(b in prev))return [a,b];const r=[];let k=b;while(k!==null){r.unshift(k);k=prev[k]}return r}
const mouthOf=f=>f.mouth.length?f.mouth[f.mouth.length-1]:tipK();
function forkCell(F){if(!F.length)return tipK();const rs=F.map(f=>f.mouth);if(rs.length===1)return rs[0].length?rs[0][rs[0].length-1]:tipK();
 let i=0;while(rs.every(r=>r[i]!==undefined&&r[i]===rs[0][i]))i++;return i>0?rs[0][i-1]:tipK()}
const pts=cells=>cells.map(P);
function along(ps,u){if(ps.length<2)return ps[0].slice();const seg=[];let tot=0;for(let i=1;i<ps.length;i++){const d=Math.hypot(ps[i][0]-ps[i-1][0],ps[i][1]-ps[i-1][1]);seg.push(d);tot+=d}
 let d=Math.max(0,Math.min(1,u))*tot;for(let i=0;i<seg.length;i++){if(d<=seg[i]||i===seg.length-1){const f=seg[i]?Math.min(1,d/seg[i]):1;return [ps[i][0]+(ps[i+1][0]-ps[i][0])*f,ps[i][1]+(ps[i+1][1]-ps[i][1])*f]}d-=seg[i]}return ps[ps.length-1].slice()}
const ease=u=>u<0?0:u>1?1:u*u*(3-2*u);
const tipXY=()=>P(tipK());
const srcK=()=>{const p=S.path;for(let i=p.length-1;i>0;i--){const [r,c]=rc(p[i]),t=GR[r][c];if(isDoor(p[i])||t==='N'||/^W/.test(t))return p[i]}return p[0]},srcXY=()=>P(srcK()); /* Sam Nov 5 9:19am: your note sounds (seep, pointer source) from the star you are on, never from where the string's tip has been dragged to */
function reset(){L={lv:LV,born:0,sung:new Set(),sungK:new Set(),fk:'',ph:null,rings:[],beams:[],word:null,lone:new Set(),moveT:now(),plen:S.path.length,refuse:0,stage:0,hint:null,tail:[]}}
window.__leadBlocks=k=>blocks(k);function blocks(k){if(!(k>=0))return false;if(!HOLD||!L||L.lv!==LV||!LV.jump)return false;if(isDoor(k)&&!sungOK(k))return !(RCDRAG&&L.ph);return false} /* v73f (tester s264): no side effects here (canStep probes call it too); the hush happens in enter, only when you really go in */ /* v73e (Sam Nov 8 2:51pm playtests: BIL/FIL dragged on during the roll call and the door held them back): ?rcdrag=1 / picker 'Drag in roll call: Let through' = pushing into a door the roll call hasn't reached yet hushes the rest of it and lets you in (the door then sounds as you enter, as usual) */
/* v72l (Sam Nov 6 11:54am, L5: 'after the roll call for the second fork ... shouldn't i have the final stars also lit since they were roll called too? and then i wouldnt need another roll call after choosing here'; 11:54am '^ exception maybe being in the test when we introduce the new element variation'): a door the roll call has sung stays sung for the rest of the board, whatever note you then hold. RCALL 1 (picker 'Roll call again: In the test') keeps the old rule on the test board (c5): a reset star's new note gets its own roll call there. */
function sungOK(k){if(L.sung.has(k+'|'+held()))return true;const rc_=typeof RCALL!=='undefined'?RCALL:0,isTest=String(LV.role||'')==='test'||LV.id==='c5';return !(rc_===1&&isTest)&&L.sungK.has(k)}
const _enter=enter;enter=function(k,instant){if(!instant&&blocks(k)){if(!L.tug||now()-L.tug>600){L.tug=now();try{window.__tlog&&__tlog(['L','wait',LV.id,k])}catch(_){}}return false}const n0=S.path.length,dragIn=RCDRAG&&!instant&&L&&L.ph&&isDoor(k)&&!sungOK(k),ph0=L&&L.ph,r=_enter(k,instant);if(dragIn&&S.path.length>n0&&S.path[S.path.length-1]===k){try{hushPhrase(now(),'dragin');for(const B of ph0.beats)if(B.f)L.sungK.add(B.f.k)}catch(e){}} /* v73f: going into a door mid roll call hushes it; every door that roll call would have sung counts as sung, so it does not come back */
 try{if(L&&isDoor(k)){if(S.path.length>n0){if(L.lone.has(k)){const [x,y]=P(k);L.word={t:now(),dur:1800,x,y:y-104,w:WORD()}}}else if(!instant){L.refuse++;bump()}}}catch(e){} /* a lone door (L1): the word lands as you pass it */
 return r};
const _can=canStep;canStep=function(v){if(blocks(v))return false;return _can(v)};
function tone(n,v){try{Sound.tone(midi(n),0,1.3,v||.12)}catch(e){}}
function ring(x,y,c,small){L.rings.push({x,y,t:now(),col:c,small})}
/* ---- 1. LISTEN ---- */
/* RHYTHM (Sam 10:09am: "beeeep... beep beep"): your note first, long; then each door short and quick. ?long=ms ?short=ms ?gap=ms */
/* Sam 10:57am: each note = PLAYS (full volume) then FADE (to silence); length = plays + fade */
const SPLAY=(q.get('splay')!=null?+q.get('splay'):1000),SFADE=(q.get('sfade')!=null?+q.get('sfade'):750),DPLAY=(q.get('dplay')!=null?+q.get('dplay'):660),DFADE=(q.get('dfade')!=null?+q.get('dfade'):330);
const SDUR=(SPLAY+SFADE)/1000,DDUR=(DPLAY+DFADE)/1000,SF=SFADE/1000,DF=DFADE/1000;window.__leadSDUR=SDUR;window.__leadSF=SF; /* the note you land on lasts exactly 'your note length' too (index.html enter) */ /* note lengths (a glass tone under 1s keeps its length) */
const REST=+q.get('rest')||300; /* Sam 10:39-10:45am: 'your note to first door' is exact; your note is cut short so it ends REST before the first door (a brief pause, doors alone) */
const LONG=q.get('long')!=null?+q.get('long'):0,SHORT=+q.get('short')||750,LEAD=280; /* Sam 10:13am: '[A A A] - [B] - [C] -': a held note, then short notes, each followed by a short rest */
/* a note sounding uses the game's own look (Sam 10:15am: keep the live seeping, no extra ripples): same as a listening tap */
function liveSound(k,note,t){try{flares[k]=t;if(k===srcK())L.tipFlare={k,t,n:note};const [x,y]=P(k);anims.push({x,y,t,col:COLOR[note]})}catch(e){}}
function startPhrase(F){if(SPOT){L.spotPts=[srcXY().slice()];L.stayPts=null}const h=held(),first=!L.started;L.started=true; /* your note only once, at the level's start; later forks: just the doors (you heard your new note as you passed) */
 const beats=[];let at=LEAD;if(first){beats.push({at,f:null});at+=SDUR*1000+LONG} /* Sam 10:48am: your note lasts exactly SDUR; 'your note to first door' is the silence AFTER it ends */else{const tn=performance.now();let end=0;for(const m in SNDM){const e=SNDM[m];end=Math.max(end,e[0]+e[1]*1000-tn)}at=Math.max(LOOP?SHORT:LEAD,end+LONG)} /* Sam 10:48am: later forks too: the doors wait until every note still sounding (the note you landed on) has ENDED, then the silence you set */ /* Sam 3:39pm comment: later forks wait the same 'your note to first door' gap after the note you just landed on plays */ /* loop: a lead-in so the comet reaches the first mouth on its beat */
 F.forEach(f=>{beats.push({at,f});at+=SHORT});
 let bus=null;try{const a=Sound.unlock();if(a){bus=a.createGain();bus.connect(a.destination);window.__leadBus=bus}}catch(_){}
 for(const B of beats){try{if(B.f)Sound.tone(midi(B.f.note),B.at/1000,DDUR,.15,DF);else Sound.tone(midi(h),B.at/1000,SDUR,.15,SF)}catch(_){}} /* Sam 10:47am: the rhythm is scheduled on the audio clock up front, so a slow frame can't stretch or squash it */
 window.__leadBus=null;
 L.ph={t0:now(),h,hc:colOf(h),F,beats,end:at+(LOOP?SHORT*1.6:250),bus,plen:S.path.length};try{window.__tlog&&__tlog(['L','intro',LV.id,first?1:0,h,F.map(f=>f.k+':'+f.note).join(','),Math.round(L.ph.end)])}catch(_){} /* Prototype v65 log: a listen phrase starts (first = the level's opening phrase; your note; each door cell:note; length ms) */
 if(RAY==='spark-route'){const db=beats.filter(B=>B.f);let pk=srcK();L.rs={T0:L.ph.t0,col:L.ph.hc,legs:db.map((B,i)=>{const leg={dep:Math.max(i?db[i-1].at:LEAD,B.at-RTRAV),arr:B.at,from:pk,ps:pts(walk(pk,B.f.k,1))};pk=B.f.k;return leg})};{const lg=L.rs.legs,last=lg[lg.length-1],home=srcK();if(last&&pk!==home){const d=last.arr+RTRAV*.6;lg.push({dep:d,arr:d+RTRAV*1.3,from:pk,ps:pts(walk(pk,home,1)),back:1})}}} /* Sam Nov 5 9:19am: LOCKED; faster (RTRAV ms per leg), and it returns home to your note after the last door */ /* Sam 7:03pm: a spark that goes note to note along the lanes, arriving on each door's beat */if(first&&L.rs&&L.rs.legs[0])L.titleGone=L.ph.t0+L.rs.legs[0].dep; /* Sam Nov 5 4:03pm: the title (instructions) is gone before the spark leaves, so nothing covers it */if(L.rs)window.__leadLast={t0:L.ph.t0,legs:L.rs.legs.map(l=>[Math.round(l.dep),Math.round(l.arr)]),beats:beats.map(B=>B.at)};if(F.length===1)L.lone.add(F[0].k)}
/* PULL BACK = PHRASE STOPS (Nov 5 3:25pm, Prototype's question): pulling back behind the door that opened this fork hushes the rest of its
   phrase (notes fade in 60ms, the spark and spotlight let go) and it is not marked heard, so it plays fresh when you pass that door again. ?pbstop=0 = old (plays on) */
const CANCEL=q.get('pbstop')!=='0';
function hushPhrase(t,why){const ph=L.ph;try{window.__tlog&&__tlog(['L','skip',LV.id,why||'pullback',Math.round(t-ph.t0),ph.beats.filter(B=>B.done).length,ph.beats.length])}catch(_){} /* Prototype v65 log: pulled back behind the door mid-phrase (beats sung / total) */try{const a=Sound.unlock();if(ph.bus&&a){ph.bus.gain.setTargetAtTime(0,a.currentTime,.02);setTimeout(()=>{try{ph.bus.disconnect()}catch(_){}},400)}}catch(_){}
 for(const B of ph.beats)if(B.f&&!B.done&&flares[B.f.k])delete flares[B.f.k];L.hush={t,ks:new Set(ph.beats.filter(B=>B.f&&B.done).map(B=>B.f.k))};window.__leadHush=L.hush; /* doors that already sang: their seep fades out with the sound (120ms), not on its own 0.6s */L.ph=null;L.fk=null;if(L.rs)L.rs.T0-=1e6;if(SPOT)L.spotOff=t;if(!L.tEnd)L.tEnd=t}
function tickPhrase(t){const ph=L.ph,e=t-ph.t0,[x,y]=srcXY();
 for(const B of ph.beats){if(B.done||e<B.at)continue;B.done=true;
  if(SPOT){const pt=B.f?P(B.f.k):srcXY().slice();if(RAY==='spot-move'){SPS={pts:[pt],t,add:1}}else{SPS={pts:(L.spotPts=(B.f?(L.spotPts||[srcXY().slice()]):[]).concat([pt])),t,add:1}}L.spotOn=t;L.spotOff=0}
  if(!B.f){liveSound(srcK(),ph.h,t);if(!L.tYou)L.tYou=t;L.word={t,dur:ph.end,x,y:y-58,w:WORD(),tip:1};continue} /* beeeep */
  const f=B.f,[dx,dy]=P(f.k); /* beep: each door alone, short (Sam 10:08-10:09am) */
  liveSound(f.k,f.note,t);if(!L.tDoor)L.tDoor=t;L.beams.push({k:f.k,t,col:ph.hc});if(LOOP)L.pulse2=t}
 if(LOOP){if(!ph.stops){ph.stops=[L.star&&L.star.cell!=null?L.star.cell:tipK(),...ph.F.map(mouthOf),forkCell(ph.F)];const db=ph.beats.filter(b=>b.f);ph.times=[db[0].at-SHORT,...db.map(b=>b.at),db[db.length-1].at+SHORT*1.5];ph.legs=[]}
  let k=-1;for(let n=0;n<ph.times.length-1;n++)if(e>=ph.times[n]&&e<ph.times[n+1])k=n;
  if(k<0)ph.cpos=null;else{if(!ph.legs[k])ph.legs[k]=pts(walk(ph.stops[k],ph.stops[k+1]));ph.cpos=along(ph.legs[k],ease((e-ph.times[k])/(ph.times[k+1]-ph.times[k])))}} /* loop: the comet reaches each mouth on its door's beep, then settles at the fork */
 if(e>ph.end){try{window.__tlog&&__tlog(['L','introEnd',LV.id,Math.round(e)])}catch(_){}if(!L.tEnd)L.tEnd=t;for(const f of ph.F){L.sung.add(f.k+'|'+ph.h);L.sungK.add(f.k)}L.ph=null;if(SPOT){L.spotOff=t;if(RAY==='spot-stay')L.stayPts=ph.F.map(f=>P(f.k))}}}
/* ---- 2. GUIDE STAR (hint) ---- */
function bump(){if(!HINTS)return;const t=now();if(L.refuse>=2)setStage(2,t);else setStage(Math.max(1,L.stage),t)}
function setStage(s,t){if(s===L.stage&&L.hint)return;L.stage=s;L.hint={t0:t,s};L.tail=[]}
function tickHint(t){if(!HINTS&&!LOOP)return null;const idle=t-L.moveT;if(!L.ph){if(L.stage<1&&idle>H1)setStage(1,t);else if(L.stage<2&&idle>H1+H2)setStage(2,t)}
 if(!L.hint)return null;const F=frontier();if(!F.length)return null;const fork=forkCell(F),e=t-L.hint.t0;
 if(L.hint.s===1){ /* drag to follow: lift off the tip, drift to the fork, wait, fade; repeat every 3.2s */
  const per=3200,u=(e%per)/per,cells=walk(tipK(),fork),ps=pts(cells),go=ease(Math.min(1,u/.55)),a=u<.08?u/.08:u>.85?(1-u)/.15:1;return {pos:along(ps,go),a,mode:1}}
 /* stage 2: comet sweeps fork > each mouth > fork, singing each door with your note on arrival; then rests; repeat */
 const per=BEAT*(F.length+2)+1400,cyc=Math.floor(e/per),u=e%per,stops=[tipK(),...F.map(mouthOf),fork];
 if(L.hint.cyc!==cyc){L.hint.cyc=cyc;L.hint.legs={};L.hint.sang={}}
 const j=Math.floor(u/BEAT);if(j>=stops.length-1)return {pos:P(fork),a:Math.max(0,1-(u-BEAT*(stops.length-1))/1400),mode:2};
 if(!L.hint.legs[j])L.hint.legs[j]=pts(walk(stops[j],stops[j+1]));const pos=along(L.hint.legs[j],ease((u-j*BEAT)/BEAT));
 const f=F[j-1]; /* arrival at mouth j (leg j-1 ends) sings door j-1 */
 for(let i=0;i<F.length;i++){if(!L.hint.sang[i]&&u>=(i+1)*BEAT){L.hint.sang[i]=1;const ff=F[i],[dx,dy]=P(ff.k);if(!ff.swap)tone(held(),.1);tone(ff.note,.1);ring(dx,dy,colOf(ff.note));L.pulse2=t}}
 return {pos,a:1,mode:2}}
function update(t){if(L.born===0){let run=true;try{const a=Sound.unlock();run=!!a&&a.state==='running'}catch(_){}if(armed&&!busy&&!coverUp()&&run)L.born=t;else return}
 if(S.path.length!==L.plen){if(S.path.length>L.plen){L.moveT=t;L.stage=0;L.hint=null;L.refuse=0}L.plen=S.path.length}
 if(t-L.born<200)return;
 if(TFIRST()&&!L.started){if(!L.tTitle)L.tTitle=t;if(t-L.tTitle<TTW*2+TTGO)return}
 if(TFIRST()&&!L.started&&!L.titleGone&&!L.ph&&t-L.tTitle>TTW*2+TTGO+600)L.titleGone=t+TTLHOLD; /* v69: a board whose first phrase never starts still lets its title go */ /* Sam Nov 5 3:00pm: on L1 the intro starts just after "octaves" shows */
 const F=branches(frontier()),todo=F.filter(f=>!sungOK(f.k)),fk=todo.map(f=>f.k).join(',')+'|'+held();
 if(!L.ph&&todo.length&&fk!==L.fk){L.fk=fk;startPhrase(todo)}
 if(L.ph&&CANCEL&&S.path.length<L.ph.plen)hushPhrase(t);
 if(L.ph)tickPhrase(t)}
/* POINTER STYLE (Sam 10:10am comment: point and loop reuse the same pointing idea; options for how it looks). ?ray=ray|spark|thread|cone.
   The pointer starts from the guide star when there is one (point, loop), else from your note (off). */
const RAY=q.get('ray')||'spark-route',RTRAV=q.get('rtrav')!=null?+q.get('rtrav'):420,SPOT=RAY.startsWith('spot'); /* Sam 10:30am comment: spotlight versions, using the game's own spotlight (spotlight()/spotTo(), 'Grows'); coordinated with [3b] Tone down later forks */
function drawSpot(t){if(!SPOT||!L.spotOn)return;let f=Math.min(1,(t-L.spotOn)/300);if(L.spotOff){const u=(t-L.spotOff)/800;if(RAY==='spot-stay'&&L.stayPts&&(q.get('fork')||'spot')!=='spot'){ /* with [3b] forks.js ?fork=spot loaded, its resting veil is the stay state; mine just fades */SPS={pts:[srcXY().slice(),...L.stayPts],t:0,add:0};f=1-.42*Math.min(1,u)}else f*=Math.max(0,1-u)}if(f>0)try{if(FORKSPOT)spotPools(t,f);else spotlight(t,f)}catch(e){}}
const FORKSPOT=(q.get('fork')||'spot')==='spot'; /* Sam 1:40pm: the later-forks Spotlight (forks.js) is the one resting veil; my spot pointers add light pools on top of it, never a second veil */
function spotPools(t,f){const pts=(SPS&&SPS.pts)||[];if(!pts.length)return;const c=colOf(held());ctx.save();ctx.globalCompositeOperation='lighter';for(const [x,y] of pts){const g=ctx.createRadialGradient(x,y,0,x,y,130);g.addColorStop(0,rgba(c,.22*f));g.addColorStop(.55,rgba(c,.2*f));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,130,0,7);ctx.fill()}ctx.restore()}
/* SPARK OPTIONS (Sam Nov 5 12:51pm): ?rcurve= speed curve, ?rtail= what it leaves behind, ?rlook= the spark itself */
const RCURVE=q.get('rcurve')||'hop',RTAIL=q.get('rtail')||'ws-thin',RLOOK=q.get('rlook')||'splat'; /* LOCKED Sam Nov 5 2:22pm: thin string-paint trail + mini start splat */
const CURVES={smooth:ease,linear:u=>u,out:u=>1-Math.pow(1-u,3) /* quick start, gentle landing */,in:u=>u*u*u /* slow start, rushes in */,
 settle:u=>{const c=1.70158,v=u-1;return 1+(c+1)*v*v*v+c*v*v} /* overshoots the door a touch and settles back */,
 hop:u=>{const v=ease(u);return v} /* same timing as smooth; the arc is added in rsPos */};
const RBACK=q.get('rback')||'clean'; /* v71 (blind audit 3 #9, faint streak in L5): the spark flies home after the last door WITHOUT painting a trail or shedding sparkles, so the last thing left on the board is not a streak from your note toward the last-sung branch (always the rightmost, the sing order is left to right). ?rback=paint = old */
function backAt(e){const R=L.rs;if(!R||RBACK==='paint')return false;for(const g of R.legs)if(g.back&&e>=g.dep-1)return true;return false}
function rsPos(e){const R=L.rs;if(!R||!R.legs.length)return null;const lg=R.legs;if(e<lg[0].dep)return null;const cf=CURVES[RCURVE]||ease;
 for(let i=0;i<lg.length;i++){const g=lg[i];if(e<g.dep)return P(g.from);if(e<=g.arr){const u=Math.max(0,Math.min(1,(e-g.dep)/Math.max(1,g.arr-g.dep))),p=along(g.ps,cf(u));if(RCURVE==='hop'){p[1]-=Math.sin(Math.PI*u)*34}return p}}
 const last=lg[lg.length-1];return last.ps[last.ps.length-1].slice()}
function sparkHead(x,y,c,a,t){if(a<=0||RLOOK==='none')return;
 if(RLOOK==='star'){glowDot(x,y,22,c,.8*a);const r=26+4*Math.sin(t*.012),w=Math.PI/4+t*.0015;ctx.strokeStyle=rgba([255,250,236],.85*a);ctx.lineWidth=2.2;ctx.lineCap='round';for(let k=0;k<4;k++){const an=w+k*Math.PI/2,rr=k%2?r*.6:r;ctx.beginPath();ctx.moveTo(x-Math.cos(an)*rr,y-Math.sin(an)*rr);ctx.lineTo(x+Math.cos(an)*rr,y+Math.sin(an)*rr);ctx.stroke()}}
 else if(RLOOK==='orb'){const g=ctx.createRadialGradient(x,y,0,x,y,44);g.addColorStop(0,rgba([255,252,240],.95*a));g.addColorStop(.3,rgba(c,.85*a));g.addColorStop(.65,rgba(c,.25*a));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,44,0,7);ctx.fill()}
 else if(RLOOK==='ink'){const g=ctx.createRadialGradient(x,y,0,x,y,26);g.addColorStop(0,rgba(c,.95*a));g.addColorStop(.6,rgba(c,.6*a));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.beginPath();for(let k=0;k<=18;k++){const an=k/18*6.2832,rr=24*(1+.12*Math.sin(an*3+t*.006));k?ctx.lineTo(x+Math.cos(an)*rr,y+Math.sin(an)*rr):ctx.moveTo(x+rr,y)}ctx.fill()} /* colour only, no white core: a drop of the note's ink */
 else if(RLOOK==='tiny'){glowDot(x,y,16,c,a)}
 else if(RLOOK==='gate'||RLOOK==='gate-core'){miniGate(x,y,c,a,t,RLOOK==='gate')}
 else if(RLOOK==='splat'||RLOOK==='splat-drops'){miniSplat(x,y,c,a,t,RLOOK==='splat-drops')}
 else glowDot(x,y,28,c,a)}
function drawRoute(t){const R=L.rs;if(!R)return;const e=t-R.T0,last=R.legs[R.legs.length-1];if(!last)return;const fade=e>last.arr+500?Math.max(0,1-(e-last.arr-500)/700):1;
 R.parts=R.parts||[];if(fade<=0&&!R.parts.length){L.rs=null;return}const c=R.col,head=rsPos(e);if(window.SPK&&SPK.on){if(head&&fade>0&&!backAt(e))SPK.trail('spark',head,c);else SPK.trailReset('spark')} /* sparkle.js: the spark sheds the same sparkles as your string's paint front, on top of its locked string-paint trail */
 if(RTAIL==='dots'){for(let i=7;i>=1;i--){const p=rsPos(e-i*28);if(p)glowDot(p[0],p[1],14-i*1.2,c,.45*(1-i/8)*fade)}}
 else if(RTAIL==='streak'){const ps=[];for(let i=20;i>=0;i--){const p=rsPos(e-i*14);if(p&&(!ps.length||Math.hypot(p[0]-ps[ps.length-1][0],p[1]-ps[ps.length-1][1])>.5))ps.push(p)}if(ps.length>1){const a0=ps[0],a1=ps[ps.length-1];ctx.lineCap='round';ctx.lineJoin='round';for(const [w,al] of [[16,.14],[8,.32],[3,.85]]){const g=ctx.createLinearGradient(a0[0],a0[1],a1[0],a1[1]);g.addColorStop(0,rgba(c,0));g.addColorStop(1,rgba(c,al*fade));ctx.strokeStyle=g;ctx.lineWidth=w;ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke()}}} /* one continuous tapering streak */
 else if(RTAIL==='comet'){for(let i=22;i>=1;i--){const p=rsPos(e-i*16);if(p)glowDot(p[0],p[1],40-i*1.1,c,.16*(1-i/23)*fade)}}
 else if(RTAIL==='sparkles'){if(head&&fade>0&&(!R.lastP||Math.hypot(head[0]-R.lastP[0],head[1]-R.lastP[1])>9)){R.parts.push({x:head[0]+(Math.random()-.5)*14,y:head[1]+(Math.random()-.5)*14,t,r:5+Math.random()*6});R.lastP=head.slice()}
  R.parts=R.parts.filter(P_=>t-P_.t<700);for(const P_ of R.parts){const u=(t-P_.t)/700,tw=.6+.4*Math.sin((t-P_.t)*.03+P_.r);glowDot(P_.x,P_.y,(P_.r+3)*(1-u*.4),c,(1-u)*tw)}} /* little twinkles it drops along the lane, fading over 0.7s */
 else if(RTAIL.startsWith('wc')){const V={'wc-quick':{gap:14,r0:12,r1:28,grow:300,life:450,a:.9},'wc-soft':{gap:16,r0:16,r1:42,grow:550,life:800,a:.6},'wc-wet':{gap:7,r0:8,r1:17,grow:200,life:380,a:.85},'wc-bloom':{gap:18,r0:10,r1:22,grow:300,life:520,a:.75,bloom:1}}[RTAIL]||{gap:14,r0:12,r1:28,grow:300,life:450,a:.9};
  if(head&&fade>0){const e0=R.lastE===undefined?e-16:R.lastE;for(let tt=e0+3;tt<=e;tt+=3){const p_=rsPos(tt);if(!p_)continue;const lp=R.lastP;if(!lp||Math.hypot(p_[0]-lp[0],p_[1]-lp[1])>V.gap){R.parts.push({x:p_[0],y:p_[1],t:R.T0+tt,sd:Math.random()*6.28,big:0});R.lastP=p_.slice()}}R.lastE=e; /* drops fill in between frames so a fast run still leaves an even wash */
   if(V.bloom){const lg=R.legs;for(const g of lg){if(!g.bl&&e>=g.arr){g.bl=1;const q_=g.ps[g.ps.length-1];R.parts.push({x:q_[0],y:q_[1],t,sd:Math.random()*6.28,big:1})}}}}
  R.parts=R.parts.filter(P_=>t-P_.t<(P_.big?V.life*1.8:V.life));ctx.save();ctx.globalCompositeOperation='source-over';
  for(const P_ of R.parts){const age=t-P_.t,life=P_.big?V.life*1.8:V.life,g=1-Math.pow(1-Math.min(1,age/(P_.big?V.grow*1.6:V.grow)),3),r=(P_.big?V.r1*.9:V.r0)+((P_.big?V.r1*2.4:V.r1)-(P_.big?V.r1*.9:V.r0))*g,al=V.a*Math.pow(1-age/life,1.4);wcBlot(P_.x,P_.y,r,c,al,P_.sd)}
  ctx.restore()} /* Sam Nov 5 1:30pm: a watercolor seep left behind that fades quickly: soft wobbly washes in the note's colour that spread out and dry away */
 else if(RTAIL.startsWith('ws')){const q0=performance.now();strTrail(R,e,t,c,fade,head);const A_=(window.__wsms=window.__wsms||[]);A_.push(performance.now()-q0);if(A_.length>600)A_.shift()}
 if(head&&fade>0)sparkHead(head[0],head[1],c,fade,t)}
/* Look takes (Sam Nov 5 'a small version of stargate itself, or a small version of the splatted ink of my start gate'): miniGate = the door's ink star (look.js inkStar) at ~0.6 size, miniSplat = the start gate's watercolor patch (dark rim, lighter middle, pale centre) at ~0.3 size */
function miniGate(x,y,c,a,t,rays){const g=ctx,sd=1.3,dk=c.map(v=>Math.round(v*.55)),lt=c.map(v=>Math.round(v+(255-v)*.55)),S=.9;g.save();g.globalCompositeOperation='source-over';g.translate(x,y);g.scale(S,S);
 const blob=(R,al,fc,sc,lw,s2)=>{g.beginPath();for(let i=0;i<=24;i++){const an=i/24*6.2832,rr=R*(1+.07*Math.sin(an*5+s2)+.06*Math.sin(an*7+s2*2.3)+.04*Math.sin(an*3+s2*4.1+t*.0005));const px=Math.cos(an)*rr,py=Math.sin(an)*rr;i?g.lineTo(px,py):g.moveTo(px,py)}g.closePath();if(fc){g.fillStyle=rgba(fc,al*a);g.fill()}if(sc){g.strokeStyle=rgba(sc,al*a);g.lineWidth=lw;g.stroke()}};
 const ray=(dx,dy,L,w,al)=>{g.fillStyle=rgba(c,al*a);g.beginPath();g.moveTo(dx*L,dy*L);g.quadraticCurveTo(-dy*w,dx*w,-dx*L*.15,-dy*L*.15);g.quadraticCurveTo(dy*w,-dx*w,dx*L,dy*L);g.fill()};
 const gr=g.createRadialGradient(0,0,0,0,0,26);gr.addColorStop(0,rgba(c,.45*a));gr.addColorStop(1,rgba(c,0));g.fillStyle=gr;g.beginPath();g.arc(0,0,26,0,7);g.fill();
 if(rays){ray(0,-1,36,5,.55);ray(0,1,36,5,.55);ray(1,0,15,3.6,.5);ray(-1,0,15,3.6,.5)}
 let s2=sd;for(let j=0;j<3;j++){g.save();g.translate(Math.cos(s2*7+j*2.1)*1.6,Math.sin(s2*5+j*2.1)*1.6);blob(13-j*.8,.62,c,j===0?dk:null,1.6/S*.6,s2);g.restore();s2+=1.7}
 blob(6.5,.5,lt,null,0,s2);blob(3,.95,lt,null,0,s2);g.restore()}
function miniSplat(x,y,c,a,t,drops){const g=ctx,R=22,sh=k=>c.map(v=>Math.round(k>0?v+(255-v)*k:v*(1+k))),sd=2.1;
 const w=(R0,j)=>{g.beginPath();for(let k=0;k<=28;k++){const an=k/28*6.2832,rr=R0*(1+.04*Math.sin(an*3+sd+j)+.07*Math.sin(an*5+sd*.7+j)+.05*Math.sin(an*7+sd*1.3+j)+.03*Math.sin(an*5+t*.004));k?g.lineTo(x+Math.cos(an)*rr,y+Math.sin(an)*rr):g.moveTo(x+rr,y)}g.closePath()};
 g.save();g.globalCompositeOperation='source-over';const h=g.createRadialGradient(x,y,R*.6,x,y,R*1.6);h.addColorStop(0,rgba(sh(.4),.28*a));h.addColorStop(1,rgba(sh(.4),0));g.fillStyle=h;g.beginPath();g.arc(x,y,R*1.6,0,7);g.fill(); /* the patch's pale halo */
 w(R,0);g.fillStyle=rgba(sh(-.12),.9*a);g.fill();w(R*.88,1);g.fillStyle=rgba(sh(.08),.9*a);g.fill();w(R*.55,2);g.fillStyle=rgba(sh(.4),.85*a);g.fill(); /* dark rim, mid, pale middle: the start patch's three washes */
 w(R,0);g.strokeStyle=rgba(sh(-.35),.55*a);g.lineWidth=1.1;g.stroke();
 if(drops)for(let i=0;i<5;i++){const an=sd*3+i*1.37+Math.sin(i*2.7)*.4,d=R*(1.35+.35*Math.sin(i*4.1)),r=1.6+1.6*(.5+.5*Math.sin(i*3.3));g.fillStyle=rgba(sh(-.12),.8*a);g.beginPath();g.arc(x+Math.cos(an)*d,y+Math.sin(an)*d,r*1.4,0,7);g.fill()}g.restore()} /* splatter: small drops thrown off round it */
/* STRING-PAINT TRAILS (Sam Nov 5 1:45pm 'why do none of these look like the main line's watercolor trail?'): the trail is painted like your
   string (look.js bleedColumn): one continuous band of the note's colour, a ragged grainy edge (paper noise), a darker tide line at the rim,
   a rounded wet front at the head, then it dries back and fades. Mask at half size: R = coverage (blurred stroke, cut by paper noise), G = wetness (life). */
const WSV={'ws':{life:650},'ws-thinq':{life:420,thin:.55},'ws-thin':{life:550,thin:.55},'ws-hold':{life:650,hold:1},'ws-long':{life:1400}};
/* Same paint as the string: look.js bleedColumn's one-wash maths (BLEED, WS 2.5, MIXB, BOUT, its fbm/vnz noise at the same scales, the
   pigment PIG(satC) colour, alpha 1-exp(-4.4*density), the 34px ragged wet head HF), run per pixel off three masks instead of a strip:
   B = distance from the trail's middle, G = age, R = distance back from the head. Only time is quicker (the wash spreads in 0.3s, not 1.2s). */
const WB={w0:6*2.5,soak:4.2*2.5,grow:1.2,front:150,k:1.25,MIXB:10,BOUT:10},WTS=1.2/.3;
function wvnz(x,y,s){const h=(i,j)=>{let n=(i*374761393+j*668265263+s*2147483)|0;n=(n^(n>>>13))*1274126177|0;return ((n^(n>>>16))>>>0)/4294967296};const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return (h(xi,yi)*(1-u)+h(xi+1,yi)*u)*(1-v)+(h(xi,yi+1)*(1-u)+h(xi+1,yi+1)*u)*v}
const wfbm=(x,y,s)=>wvnz(x,y,s)*.55+wvnz(x*2.1,y*2.1,s+7)*.3+wvnz(x*4.3,y*4.3,s+13)*.15,wss=(a,b,x)=>{x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)};
let WT=null;function wTables(){if(WT)return WT;const N=512,n=new Float32Array(N*N),m=new Float32Array(N*N),A=new Float32Array(N*N),B=new Float32Array(N*N),bl=new Float32Array(N*N);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=y*N+x;n[k]=wfbm(x/13,y/13,41)*.65+wvnz(x/1.6,y/1.6,43)*.35;m[k]=wfbm(x/26,y/22,47);A[k]=wfbm(x/9,y/9,91);B[k]=wfbm(x/42,y/42,63);bl[k]=wfbm(x/30,y/30,77)}return WT={n,m,A,B,bl}}
if(RTAIL.startsWith('ws'))setTimeout(wTables,0);
let WSO=null,WSO2=null;const WSA=q.get('wsa')!=null?+q.get('wsa'):.55; /* Sam Nov 5 2:09pm: the trail read brighter/stronger than the string's paint: a lighter, see-through wash (55%) */
function strTrail(R,e,t,c,fade,head){const V=WSV[RTAIL]||WSV.ws,P=R.wp||(R.wp=[]),TH=V.thin||1;
 if(head&&fade>0){const e0=R.lastE===undefined?e-16:R.lastE;for(let tt=e0+3;tt<=e;tt+=3){if(backAt(tt))break;const p_=rsPos(tt);if(!p_)continue;const lp=P[P.length-1];if(!lp||Math.hypot(p_[0]-lp.x,p_[1]-lp.y)>2)P.push({x:p_[0],y:p_[1],t:R.T0+tt})}R.lastE=e}
 const done=!head||fade<1;if(V.hold&&done&&!R.dry0)R.dry0=t;const lifeOf=p=>V.hold?(done?1-(t-R.dry0)/V.life:1):1-Math.max(0,(t-p.t)-V.life*.35)/(V.life*.65);
 while(P.length&&lifeOf(P[0])<=0)P.shift();if(P.length<2){R.parts=P.length?[1]:[];return}R.parts=[1];
 const MAXD=48*TH;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of P){x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y)}x0=Math.floor(x0-MAXD-2);y0=Math.floor(y0-MAXD-2);x1=Math.ceil(x1+MAXD+2);y1=Math.ceil(y1+MAXD+2);
 const S2=.4,w=Math.max(2,Math.ceil((x1-x0)*S2)),h=Math.max(2,Math.ceil((y1-y0)*S2));
 if(!WSO||WSO.width<w||WSO.height<h){const W2=Math.max(w,WSO?WSO.width:0),H2=Math.max(h,WSO?WSO.height:0);WSO=document.createElement('canvas');WSO.width=W2;WSO.height=H2;WSO2=document.createElement('canvas');WSO2.width=W2;WSO2.height=H2}
 const g=WSO.getContext('2d',{willReadFrequently:true});g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.fillStyle='#000';g.fillRect(0,0,w+2,h+2);g.setTransform(S2,0,0,S2,-x0*S2,-y0*S2);g.globalCompositeOperation='lighten';g.lineCap='round';g.lineJoin='round';
 const n=P.length,brk=i=>Math.hypot(P[i].x-P[i-1].x,P[i].y-P[i-1].y)>60,path=()=>{g.beginPath();g.moveTo(P[0].x,P[0].y);for(let i=1;i<n;i++)brk(i)?g.moveTo(P[i].x,P[i].y):g.lineTo(P[i].x,P[i].y)};
 for(let d=Math.ceil(MAXD/2.5)*2.5;d>=0;d-=2.5){const v=255-Math.round(d*5.2/TH*TH);g.strokeStyle='rgb(0,0,'+Math.max(1,v)+')';g.lineWidth=Math.max(1,d*2);path();g.stroke()} /* B: 255 - 5.2*distance from the middle */
 const ar=[0];for(let i=n-1;i>0;i--)ar.unshift(ar[0]+(brk(i)?0:Math.hypot(P[i].x-P[i-1].x,P[i].y-P[i-1].y)));const live=head&&!done;
 for(let i=1;i<n;i++){if(brk(i))continue;const a=P[i-1],b=P[i],l=lifeOf(b);if(l<=0)continue;g.lineWidth=MAXD*2;
  const age=Math.min(2000,t-b.t);g.strokeStyle='rgb('+(live?Math.max(1,255-Math.round(ar[i]*2.5)):255)+','+Math.max(1,255-Math.round(age/8))+',0)';g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()} /* R: 255 - 2.5*distance back from the head; G: 255 - age/8ms */
 const lifeAt=age=>V.hold?(done?1-(t-R.dry0)/V.life:1):1-Math.max(0,age-V.life*.35)/(V.life*.65);
 const im=g.getImageData(0,0,w,h),D=im.data,T=wTables(),sc=c.map(v=>{const m=(c[0]+c[1]+c[2])/3;return Math.max(0,Math.min(255,Math.round(m+(v-m)*1.45)))}),K=sc.map(v=>-Math.log(Math.max(.04,v/255))),PC=K.map(k=>255*Math.exp(-k*.9));
 const w0=WB.w0*TH,soak=WB.soak*TH,HWS=(w0+soak)+WB.BOUT*TH;
 for(let j=0;j<h;j++){const py=(Math.round(y0+j/S2)&511)*512;for(let i=0;i<w;i++){const o=(j*w+i)*4;if(D[o+2]===0){D[o+3]=0;continue}
  const dx=(255-D[o+2])/5.2,ageMs=(255-D[o+1])*8,life=Math.max(0,Math.min(1,lifeAt(ageMs)));if(life<=0){D[o+3]=0;continue}const hd0=live?(255-D[o])/2.5:1e3,age=ageMs/1000*WTS;
  const k=py+(Math.round(x0+i/S2)&511),nz=T.n[k],mm=T.m[k];
  const ef=WB.front*age,fx=ef-dx*dx/(w0*1.6)+(mm-.5)*16*Math.min(1,ef/40);if(fx<0){D[o+3]=0;continue}
  const gr=Math.sqrt(Math.min(age,WB.grow)/WB.grow),hw=w0+soak*gr,edge=hw*(.72+.56*mm)+(nz-.5)*3+WB.MIXB*.35*TH,bl=T.bl[k],Fw=WB.BOUT*TH*(.12+1.7*bl*bl)*(.75+.5*T.A[k])*(.6+.8*T.B[k])*Math.sqrt(Math.min(age,WB.grow*1.6)/(WB.grow*1.6)),E2=edge+Fw;
  let cov=(1-wss(E2-2.4,E2+.6,dx))*wss(-2,2.5,fx);if(cov<=0){D[o+3]=0;continue}
  const dry=wss(.25,1.1,age),rim=wss(E2-5,E2-1,dx)*dry,fz=wss(edge-1,edge+2,dx);let dens=WB.k*cov*(.55+.35*(1-wss(0,edge,dx))+.55*rim)*(1+(nz-.5)*.9*dry)*.5*(.6+.4*life);
  if(fz>0)dens*=1-fz*(.5-.55*(nz-.5)-.3*rim);const wet=cov*(1-dry),dk=1-.07*wet,sh=dk*(1-.1*wet);
  let A=1-Math.exp(-4.4*dens);if(hd0<34){const u=Math.min(1,dx/HWS),fr=3+24*u*u+8*(.5+.35*Math.sin(j*.26+1.1)+.15*Math.sin(j*.58+2.3));A*=wss(fr-8,fr+5,hd0)}
  A*=Math.min(1,life*1.6)*fade*WSA;if(A<=.004){D[o+3]=0;continue}D[o]=PC[0]*sh;D[o+1]=PC[1]*sh;D[o+2]=PC[2]*sh;D[o+3]=255*Math.min(1,A)}}
 const g2=WSO2.getContext('2d');g2.clearRect(0,0,WSO2.width,WSO2.height);g2.putImageData(im,0,0);
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.imageSmoothingEnabled=true;ctx.drawImage(WSO2,0,0,w,h,x0,y0,w/S2,h/S2);ctx.restore()}
function wcBlot(x,y,r,c,a,sd){if(a<=.01)return;for(let j=0;j<6;j++){const rr=r*(.55+.12*j);ctx.fillStyle=rgba(c,a*.24*(1-j*.08));ctx.beginPath();for(let k=0;k<=24;k++){const an=k/24*6.2832,w=1+.16*Math.sin(an*3+sd+j*.7)+.08*Math.sin(an*5-sd*1.3+j);k?ctx.lineTo(x+Math.cos(an)*rr*w,y+Math.sin(an)*rr*w):ctx.moveTo(x+rr*w,y)}ctx.closePath();ctx.fill()}} /* stacked faint wobbly layers = a soft wet edge */
function drawBeams(t,sx,sy){if(SPOT)return;if(RAY==='spark-route'){drawRoute(t);return}for(const B of L.beams){const life=RAY==='spark-back'?900:RAY==='thread'?900:RAY==='cone'?800:650,u=(t-B.t)/life;if(u>1)continue;const [dx,dy]=P(B.k),c=B.col;
  if(RAY==='ray'){const g=ctx.createLinearGradient(sx,sy,dx,dy);g.addColorStop(0,rgba(c,.85*(1-u*.7)));g.addColorStop(1,rgba(c,.25*(1-u)));ctx.strokeStyle=g;ctx.lineWidth=11*(1-u*.5);ctx.lineCap='round';const r=.3+.7*Math.min(1,u*3);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+(dx-sx)*r,sy+(dy-sy)*r);ctx.stroke()}
  else if(RAY==='spark'){const v=ease(Math.min(1,u/.45));for(let i=0;i<8;i++){const w=Math.max(0,v-i*.04),px=sx+(dx-sx)*w,py=sy+(dy-sy)*w;glowDot(px,py,(i?14:28)-i*1.2,c,(i?.45:1)*(1-i/8)*(u<.45?1:1-(u-.45)/.55))}}
  else if(RAY==='spark-back'){const back=u>.5,v=u<.45?ease(u/.45):u<.55?1:1-ease((u-.55)/.45); /* Sam 3:40pm comment: a spark that goes to the door and comes back */
   for(let i=0;i<8;i++){const w=Math.max(0,Math.min(1,back?v+i*.04:v-i*.04)),px=sx+(dx-sx)*w,py=sy+(dy-sy)*w;glowDot(px,py,(i?14:28)-i*1.2,c,(i?.45:1)*(1-i/8)*(u<.9?1:1-(u-.9)/.1))}}
  else if(RAY==='thread'){const v=ease(Math.min(1,u/.3)),a=u<.7?1:1-(u-.7)/.3,mx=(sx+dx)/2,my=(sy+dy)/2+Math.hypot(dx-sx,dy-sy)*.12*(1-v*.6);ctx.strokeStyle=rgba(c,.95*a);ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(sx,sy);
   const N=24;for(let i=1;i<=N*v;i++){const s=i/N,px=(1-s)*(1-s)*sx+2*(1-s)*s*mx+s*s*dx,py=(1-s)*(1-s)*sy+2*(1-s)*s*my+s*s*dy;ctx.lineTo(px,py)}ctx.stroke()}
  else if(RAY==='cone'){const a=Math.sin(Math.PI*Math.min(1,u)),ang=Math.atan2(dy-sy,dx-sx),len=Math.hypot(dx-sx,dy-sy)+40,w=.16;const g=ctx.createRadialGradient(sx,sy,0,sx,sy,len);g.addColorStop(0,rgba(c,.75*a));g.addColorStop(.8,rgba(c,.3*a));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(sx,sy);ctx.arc(sx,sy,len,ang-w,ang+w);ctx.closePath();ctx.fill()}}
 L.beams=L.beams.filter(B=>t-B.t<900)}
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
function octGlow(){if(!(OCT==='glow'||OCT==='both')||!L||!L.ph||!L.ph.beats)return;const ph=L.ph,lt=x=>String(x).replace(/\d+$/,''),te0=now()-ph.t0;
 let cur=ph.h;for(const B of ph.beats){if(!B.f)continue;if(!B.f.branchOf)cur=ph.h;const sw=!!(B.f.swap||(typeof SWAP!=='undefined'&&SWAP[B.f.k])),ok=cur!==null&&!sw&&lt(B.f.note)===lt(cur);cur=cur===null?null:(sw||ok)?B.f.note:null;if(!ok)continue;if(B.at<=te0&&window.__OGLOG)window.__OGLOG.add(LV.id+':'+B.f.k); /* v73e (tester s262): along a sung branch the note you'd carry changes (a door or swap star makes it yours), so each door is judged against the note you'd hold when you reach it; a refused door ends the branch */const te=te0-B.at-120;if(te<0||te>2400)continue; /* starts just after the door's own note has begun: the sound comes first */
  const a=te<300?te/300:Math.max(0,1-(te-900)/1500)*(te<900?1:1),[x,y]=P(B.f.k),dc=colOf(B.f.note),r=40+16*Math.sin(Math.min(1,te/700)*Math.PI/2);glowDot(x,y,r,ph.hc,.85*Math.min(1,a));glowDot(x,y,r*.62,dc,.9*Math.min(1,a))}} /* the two colours glow as one: your note and the door's, the same letter */
function glowDot(x,y,r,c,a){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba([255,255,255],a));g.addColorStop(.18,rgba(c,a*.95));g.addColorStop(.5,rgba(c,a*.28));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}
function render(t){const c=colOf(held()),[x,y]=tipXY();ctx.save();ctx.globalCompositeOperation='lighter';try{octGlow()}catch(e){}
 for(const R of L.rings){const u=(t-R.t)/1100;if(u>1)continue;const rr=(R.small?20:28)+u*(R.small?46:80);ctx.strokeStyle=rgba(R.col,.6*(1-u));ctx.lineWidth=3.5*(1-u)+1;ctx.beginPath();ctx.arc(R.x,R.y,rr,0,7);ctx.stroke()}
 L.rings=L.rings.filter(R=>t-R.t<1100);
 /* beams are drawn after the guide star is placed: see drawBeams */

 const pl=L.pulse?Math.max(0,1-(t-L.pulse)/380):0; /* your own note swells on each beat */
 let H=L.born&&!S.won?tickHint(t):null;
 if(STAR&&L.born&&t-L.born>300&&!S.won){const st=L.star||(L.star={cell:tipK(),pos:tipXY().slice(),route:[]});
  if(LOOP&&L.ph&&L.ph.cpos){st.pos=L.ph.cpos;st.cell=null;st.route=[]}
  else{const F=frontier(),goal=F.length?forkCell(F):tipK();if(st.cell==null){st.cell=goal;st.route=pts(walk(goal,goal))}
   if(st.goal!==goal){st.goal=goal;st.route=pts(walk(st.cell,goal));st.cell=goal;st.u=0;st.from=st.pos.slice();st.route.unshift(st.from)}
   if(st.route.length>1){st.u=Math.min(1,(st.u||0)+1/Math.max(18,st.route.length*10));st.pos=along(st.route,ease(st.u))}}
  const b=.5+.5*Math.sin(t/420);H={pos:[st.pos[0],st.pos[1]+(LOOP&&L.ph?0:Math.sin(t/700)*4)],a:1,mode:LOOP&&L.ph?2:1,rest:!(LOOP&&L.ph)}}
 drawSpot(t);
 {const s=H?H.pos:srcXY();ctx.save();ctx.globalCompositeOperation='lighter';drawBeams(t,s[0],s[1]);ctx.restore();L.src=s}
 if(H){const [hx,hy]=H.pos;if(H.mode===1){const b=.5+.5*Math.sin(t/300);L.tail.push([hx,hy]);if(L.tail.length>10)L.tail.shift();L.tail.forEach((p,i)=>glowDot(p[0],p[1],6+i*1.2,c,.05*i*H.a));glowDot(hx,hy,34+6*b,c,.8*H.a)}
  else{L.tail.push([hx,hy]);if(L.tail.length>30)L.tail.shift();for(let i=1;i<L.tail.length;i++){const a=i/L.tail.length,p=L.tail[i-1],qq=L.tail[i];ctx.strokeStyle=rgba(c,.5*a*a*H.a);ctx.lineWidth=2+15*a*a;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(qq[0],qq[1]);ctx.stroke()}
   const p2=L.pulse2?Math.max(0,1-(t-L.pulse2)/380):0;glowDot(hx,hy,50+26*p2,c,.9*H.a)}}else L.tail=[];
 const tug=L.tug&&t-L.tug<520?Math.sin((t-L.tug)/520*Math.PI):0;
 if(tug&&q.get('waitring')==='1'){ctx.strokeStyle=rgba(c,.5*tug);ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,56+12*tug,0,7);ctx.stroke()} /* pushed into a door mid-phrase: your note flares, "wait" */ /* v72m (Sam Nov 6 11:48am 'is there a weird circle appearing around my cursor if i try to go through a gate during [the roll call]?'): the thin wait ring is off; ?waitring=1 = old */
 ctx.restore();
 if(L.word){const W_=L.word,u=(t-W_.t)/W_.dur;if(u<1&&W_.w){const a=Math.min(1,u*6)*Math.min(1,(1-u)*4);ctx.save();ctx.font='italic 500 46px "Cormorant Garamond", Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor=rgba(c,.9*a);ctx.shadowBlur=18;ctx.fillStyle=rgba([255,248,232],.95*a);ctx.fillText(W_.w,W_.x,W_.y);ctx.restore()}else if(u>=1)L.word=null}}
/* CHAPTER TITLE ON THE BEAT (Sam 10:43am: integrate it with the sounds on L1; it felt separate and broke the timing).
   Under the veil before the level starts: nothing written. "Follow" lands with your note, "the octaves" with the door
   (the octave itself), and the veil lifts as the door note fades. ?ttl=old = the previous take (title first, then the phrase). */
const TOLD=q.get('ttl')==='old';const TTW=q.get('ttw')!=null?+q.get('ttw'):600,TTGO=q.get('ttgo')!=null?+q.get('ttgo'):170,TFADE=q.get('tfade')!=null?+q.get('tfade'):400,TFIRST=()=>q.get('ttl')!=='beat'&&!TOLD&&!!TITLE(); /* Sam Nov 5 3:00pm: title words first, 'Follow' / 'the' / 'octaves' TTW apart; the listen intro's first note lands TTGO+LEAD (450ms) after 'octaves' starts showing (Sam 4:03pm: keep the intro timing as it was) (?ttl=beat = the old on-the-beat title) */const TTLHOLD=q.get('ttlhold')!=null?+q.get('ttlhold'):1000; /* Sam 6:07pm: the title holds a moment longer before it fades */
function drawTitle(t){window.__leadTitleA=0;const tt=TITLE();if(!tt)return;
 if(TOLD){let a=1;if(L.born){a=1-(t-L.born)/700;if(a<=0)return}veilText(a,[[tt,1]]);return}
 const ws=tt.includes('/')?tt.split('/'):tt.split(' '),w1=ws[0],wm=ws.slice(1,-1).join(' '),w3=ws[ws.length-1]; /* Sam 6:07pm: three lines, "Follow" / "the" / "octaves" */
 const fin=v=>Math.max(0,Math.min(1,v));let va=1,a1=0,am=0,a2=0;
 if(TFIRST()){if(L.tTitle){a1=fin((t-L.tTitle)/350);am=fin((t-L.tTitle-TTW)/350);a2=fin((t-L.tTitle-TTW*2)/350)}}
 else{if(L.tYou){a1=fin((t-L.tYou)/350);am=fin((t-L.tYou-SPLAY)/350)} /* "the" comes up as your note starts to fade, the pause before the door */
 if(L.tDoor){a2=fin((t-L.tDoor)/350);am=Math.max(am,a2)}}
 if(L.born)va=1-.35*fin((t-L.born)/600); /* veil thins a little once the level starts, so the seeps read. Sam Nov 5 4:39pm: this used to be skipped once a fade branch below took over, so the veil jumped back to full (an extra darkness in one frame); now the fades start from the thinned veil */
 let pres=1;if(TFIRST()&&L.titleGone){const u=fin((t-(L.titleGone-TFADE))/TFADE);pres=1-u;va*=1-u;a1*=1-u;am*=1-u;a2*=1-u;if(u>=1)return}
 else if(L.tEnd){const u=fin((t-L.tEnd-TTLHOLD)/(DDUR*1000));va*=1-u;a1*=1-u;am*=1-u;a2*=1-u;if(u>=1)return}

 window.__leadTitleA=TFIRST()?pres:0; /* Sam Nov 5 4:39pm: the fork's spotlight veil stacked on the title veil = an extra darkness popping in with 'octaves'. While the title veil is up the spotlight stays out; it comes in only as the title fades */
 veilText(va,wm?[[w1,a1],[wm,am],[w3,a2]]:[[w1,a1],[w3,a2]])}
function veilText(va,parts){ctx.save();ctx.fillStyle=`rgba(6,7,22,${.62*va})`;ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor=rgba(colOf(held()),.8);ctx.shadowBlur=24;
 ctx.font='italic 500 64px "Cormorant Garamond", Georgia, serif';
 if(parts.length===1){ctx.fillStyle=`rgba(255,248,232,${parts[0][1]*va})`;ctx.fillText(parts[0][0],CX,CY-40)}
 else{const g=ctx.measureText(' ').width,w1=ctx.measureText(parts[0][0]).width,w2=ctx.measureText(parts[1][0]).width,x0=CX-(w1+g+w2)/2;ctx.textAlign='left';
  ctx.textAlign='center';const y0=CY-40-(parts.length-1)*38;parts.forEach(([s,a],i)=>{if(a<=0)return;ctx.fillStyle=`rgba(255,248,232,${a})`;ctx.fillText(s,CX,y0+i*76+(1-a)*10)})} /* Sam 10:45am: Follow centered, the octaves below */
 ctx.restore()}
/* S4 SOUNDING SEEP on doors (Sam 10:18am: no visual when a note previews, by tap or in the intro): the W-S0 door look (doorFx) never drew the
   v42 sounding wash, so a door sounding (tapped, or played by the phrase) gets it here, from the note's own audio envelope (sndOf) */
const SEEPR=+q.get('seepr')||50,SEEPT=+q.get('seept')||66,SEEPA=+q.get('seepa')||.85,GROW=+q.get('grow')||650; /* door size; your note's star is bigger, so its seep starts past its edge */
const grow=v=>.25+.75*(1-Math.pow(1-Math.min(1,Math.max(0,v)/GROW),3)); /* Sam 10:23am: it seeps OUT from the star, never just appears */ /* Sam 10:22am too big; defaults = Sam's slider picks 10:33am */
function doorSeep(t){if(!view||!view.look||!view.look.soundAt)return;GR.forEach((row,r)=>row.forEach((tk,c)=>{const k=key(r,c);if(!isDoor(k))return;const n=doorNote(k);if(!(flares[k]&&SNDM[midi(n)]&&flares[k]>=SNDM[midi(n)][0]-150))return;const v=t-flares[k],a=Math.max(sndOf(n,t),v<0?0:Math.min(1,v/40)*Math.pow(Math.max(0,1-v/Math.max(1500,SNDM[midi(n)][1]*1000)),.7))*(L&&L.hush&&L.hush.ks.has(k)&&flares[k]<=L.hush.t?Math.max(0,1-(t-L.hush.t)/120):1);if(a>.004){const [x,y]=G(c,r);view.look.soundAt(ctx,k,x,y,c3(COLOR[n]),a*SEEPA,SEEPR*grow(v),SEEPR)}}));
 {const h=held(),e=SNDM[midi(h)];if(e){const v=t-e[0],a=v<0?0:Math.min(1,v/40)*Math.pow(Math.max(0,1-v/Math.max(1500,e[1]*1000)),.7);if(a>.004){const [x,y]=srcXY();view.look.soundAt(ctx,9001,x,y,c3(COLOR[h]),a*SEEPA,SEEPT*grow(v),SEEPT)}}}} /* the seep reads by eye even when the door's note is short (visual envelope ~1.5s) */
{const _d=draw;draw=function(t){_d(t);try{try{if(LV&&LV.jump&&GR&&q.get('leadseep')==='1')doorSeep(performance.now())}catch(e){console.error(e)} /* Prototype v62: the game's own doorSeep (index.html) already draws every door's and your note's seep, with the seal clips, wash handovers and tap position; this older copy drew them a second time, unclipped. ?leadseep=1 brings it back */if(!LV||!LV.jump||!S||!S.path||!S.path.length)return;if(!L||L.lv!==LV)reset();const n=now();if(!S.won)update(n);render(n);drawTitle(n)}catch(e){console.error(e)}}}
/* INPUT DURING THE INTRO (Sam 7:01pm, agreed): the string stays free; doors stay shut until the phrase ends (blocks);
   a TAP during the phrase waits and plays right after it ends; on L1 the title veil swallows all input until it has faded.
   A press during the phrase is held back; if the finger moves >10px it was a drag, so the press is replayed and the drag goes on.
   ?taphold=0 / ?ttlblock=0 turn these off. */
const TAPHOLD=q.get('taphold')!=='0',TTLBLOCK=q.get('ttlblock')!=='0';let GATE=null,QTAP=null,PASS=false;
const titleUp=()=>TTLBLOCK&&!TOLD&&L&&L.born&&L.lv===LV&&!!TITLE()&&!(TFIRST()?(L.titleGone&&now()>=L.titleGone):(L.tEnd&&now()-L.tEnd>TTLHOLD+DDUR*1000));
const snap=e=>({target:e.target,clientX:e.clientX,clientY:e.clientY,pointerId:e.pointerId,pointerType:e.pointerType||'touch'});
function refire(type,e){PASS=true;try{e.target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,clientX:e.clientX,clientY:e.clientY,pointerId:e.pointerId,pointerType:e.pointerType,isPrimary:true,button:0,buttons:type==='pointerup'?0:1}))}catch(_){}finally{PASS=false}}
const swallow=e=>{e.stopPropagation();if(e.cancelable)e.preventDefault()};
addEventListener('pointerdown',e=>{if(PASS||coverUp())return;if(TAPHOLD&&L&&L.lv===LV&&(L.ph||titleUp())){swallow(e);GATE={e:snap(e)}} /* Sam Nov 5 9:19am: drags allowed before the intro is done, L1 title included; taps wait */},true);
addEventListener('pointermove',e=>{if(PASS||!GATE)return;if(GATE.swallow){swallow(e);return}if(GATE.live)return;
 if(Math.hypot(e.clientX-GATE.e.clientX,e.clientY-GATE.e.clientY)>10){GATE.live=true;refire('pointerdown',GATE.e);return}swallow(e)},true);
addEventListener('pointerup',e=>{if(PASS||!GATE)return;const g=GATE;GATE=null;if(g.live)return;swallow(e);if(!g.swallow)QTAP=g.e},true);
addEventListener('pointercancel',()=>{GATE=null},true);
function flushTap(){if(!QTAP||(L&&L.ph)||titleUp())return;const e=QTAP;QTAP=null;refire('pointerdown',e);refire('pointerup',e)} /* the held tap plays right after the phrase */
{const _d2=draw;draw=function(t){_d2(t);try{flushTap()}catch(e){console.error(e)}}}
window.__leadAPI={drawR:(R,t)=>{if(!L)return;const s0=L.rs;L.rs=R;ctx.save();ctx.globalCompositeOperation='lighter';try{drawRoute(t)}finally{ctx.restore();L.rs=s0}},pts,P,RTRAV}; /* [3b] outro: drives the same spark + trail */
window.__lead=()=>L&&{born:L.born,tTitle:L.tTitle,ph:L.ph&&L.ph.beats.map(b=>(b.f?b.f.note:'you')+(b.done?'*':'')),sung:[...L.sung],stage:L.stage,refuse:L.refuse};
})();
