/* ink.js (3b ink drag head, Nov 5 2026). Sam's artifact comment 1:32pm: "when I drag through/from a stargate it leaves a big seep
   behind in the spot it came from, but this circle part is what I'm actually dragging around, and it's basically changing color as it
   hits a new ink drop". Self-contained add-on for the v60y game (wraps drawString). Switches:
   ?head=drop|carry|bead|pull|off   the head you drag: crisp watercolor drop / the start's own circle (its patch + ring) carried along /
   soft wet bead / drop that pulls away from the seep, then snaps free (pull reads as plain string in narrow lanes; kept off the page)
   ?cr=50 carried circle radius
   ?left=wash|patch|none     the seep left behind on a stargate once the head leaves it: soft wash / crisp patch / none
   ?swap=top|through  at a new door: top = the drop sits on the star while the door's color blooms out of its center / through = it slips under
   the star and comes out the far side already in the new color, growing out of the star
   ?hr=26 head radius, ?lr=64 left seep radius, ?bloom=520 ms for a new color to bloom out from the head's center
   ?dry=2.5 seconds for a left seep to dry back to ?dryto=.6 of its strength (0 = stays wet)
   Rules kept: one color = one note (the head wears the note you hold); a new color blooms from the CENTER outward (old color is the
   outer ring until covered), tweened by size, never a crossfade; everything is cut to the lanes (patch/soundAt use the lane mask). */
(function(){
const Q=new URLSearchParams(location.search),num=(k,d)=>Q.has(k)?+Q.get(k):d;
const MODE=Q.get('head')||'drop',SWAP=Q.get('swap')||'top',BACK=num('back',.7),LEFT=Q.get('left')||'none',HR=num("hr",30),LR=num("lr",90),BLOOM=num('bloom',520),CR=num('cr',50),OPQ=num('opq',1),DRY=num('dry',2.5),DRYTO=num('dryto',.6);
const HSEED=11,easeO=u=>1-(1-u)*(1-u)*(1-u),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
let LVr=null,LEFTS=new Map(),H={note:null,prev:null,t0:-1e9},OC=null,OX=null,OSIG='',SNAP={k:-1,t:-1e9,armed:false},GROW=new Map();
let HPOS=null,HS={},TASTE={k:-1,n:null,s:0},REF=null,MIX=null;const TK=()=>typeof WTAKE==='number'?WTAKE:0,BRN=[146,92,42],brownOf=(a,b)=>BRN.map((v,i)=>Math.round(v*.72+(a[i]+b[i])/2*.28*.8)),sm=u=>{u=cl(u,0,1);return u*u*(3-2*u)};window.__inkDoor={get TASTE(){return TASTE},get REF(){return REF},get MIX(){return MIX}};
/* v72l (Sam Nov 6 11:47am 'give me a few options for how the drop changes to the next stargate, and make sure for each one theres a corresponding wrong version'): WTAKE picks a pair.
   0 Bloom: right = the door's color blooms out from the drop's center / wrong = it starts to bloom, then shrinks back to nothing (drop squashes).
   1 Soak: right = the door's color soaks in from the front edge and pushes your color out the back / wrong = it soaks in partway, then your color floods back to the front (drop squashes). The front edge starts to soak as you near a door (not while its notes are still playing, Sam 11:48am 'weird circle').
   2 Marble: right = little blots of the door's color swirl in and run together into it / wrong = the blots swirl in and the drop goes muddy brown, then your color blooms back.
   3 Meet: right = a small drop of the door's color comes out to meet yours and they merge, blooming from the center / wrong = it comes out, touches, and bounces back into the door (drop squashes as they touch). */
function stOf(k,now){const [dx,dy]=ctr(k),hp=HPOS||[dx,dy+40],L=Math.hypot(dx-hp[0],dy-hp[1])||1;return {k0:.12,w0:TK()===1&&LTS&&LTS.k===k&&now-LTS.t<200?LTS.s:0,ux:(dx-hp[0])/L,uy:(dy-hp[1])/L,dx,dy}}
function dBody(g,c,k,px,py){g.save();g.fillStyle='rgb('+c.map(v=>Math.round(v*.88)).join(',')+')';g.beginPath();g.arc(px,py,HR*.93*k,0,7);g.fill();g.restore()}
function dDisc(g,c,k,px,py,id){if(!(k>.01))return;dBody(g,c,k,px,py);view.look.patch(g,px,py,HR,HSEED,c,k,id)}
function soak(g,x,y,k,cP,cN,w,ux,uy){dDisc(g,cN,k,x,y,'ihB');if(w>=1)return;const s=Math.pow(1-w,.8);dDisc(g,cP,k*s,x-ux*HR*k*w*1.1,y-uy*HR*k*w*1.1,'ihO')} /* new color under; your old disc pulled back out of the front edge (onto the string, which is still your color) */
function blots(g,x,y,k,c,v,tb,id){g.save();g.beginPath();g.arc(x,y,HR*.9*k,0,7);g.clip();for(let i=0;i<5;i++){const a=i*1.2566+tb/1000*2.4,r=HR*k*.5*(1-v*.8);dDisc(g,c,k*(.2+.5*easeO(v)),x+Math.cos(a)*r,y+Math.sin(a)*r,id+i)}g.restore()}
const LEAPFIX=!/[?&]leap=1\b/.test(location.search);let SCV=null,SCX=null;const SOFTB=!/[?&]bsoft=0\b/.test(location.search);
function seepDisc(g,c,k,x,y,id,v){if(!(v>.002))return;if(!SOFTB){dDisc(g,c,k*(.12+.88*v),x,y,id);return}const cw=g.canvas.width,ch=g.canvas.height;if(!SCV||SCV.width!==cw||SCV.height!==ch){SCV=document.createElement('canvas');SCV.width=cw;SCV.height=ch;SCX=SCV.getContext('2d')}
 const q=SCX,m=g.getTransform(),pc=m.transformPoint({x,y}),rr=Math.ceil(HR*k*2*Math.hypot(m.a,m.b))+4,bx=Math.max(0,Math.floor(pc.x-rr)),by=Math.max(0,Math.floor(pc.y-rr)),bw=Math.min(cw,Math.ceil(pc.x+rr))-bx,bh=Math.min(ch,Math.ceil(pc.y+rr))-by;if(bw<=0||bh<=0)return;q.setTransform(1,0,0,1,0,0);q.globalCompositeOperation='source-over';q.clearRect(bx,by,bw,bh);q.setTransform(m);dDisc(q,c,k,x,y,id);
 const Ro=HR*k*(.25+1.35*v),F=HR*k*(.12+.6*(1-v)),gr=q.createRadialGradient(x,y,Math.max(0,Ro-F),x,y,Ro);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.5,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');
 q.globalCompositeOperation='destination-in';q.fillStyle=gr;q.fillRect(x-HR*k*2,y-HR*k*2,HR*k*4,HR*k*4);q.globalCompositeOperation='source-over';g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(SCV,bx,by,bw,bh,bx,by,bw,bh);g.restore()}
 /* v72o (Sam Nov 6 rule: no hard lines at any colour change, every change seeps like a stargate): the new colour's disc (the same look.js patch) seeps out from the drop's centre through a soft, widening edge, so the two colours mix in a band instead of meeting at a crisp rim; at the end it covers the old disc past its halo, so no ring of the old colour is left. ?bsoft=0 = v72m */
const DURS=()=>[BLOOM,BLOOM*1.15,BLOOM*1.4,BLOOM+220][TK()]||BLOOM;
function fill(g,x,y,k,cP,cN,tb,st){const T=TK();
 if(T===0)seepDisc(g,cN,k,x,y,'ihB',easeO(cl(tb/BLOOM,0,1)));
 else if(T===1)soak(g,x,y,k,cP,cN,st.w0+(1-st.w0)*easeO(cl(tb/(BLOOM*1.15),0,1)),st.ux,st.uy);
 else if(T===2){const v=cl(tb/(BLOOM*1.4),0,1);blots(g,x,y,k,cN,v,tb,'ihX');dDisc(g,cN,k*easeO(cl((v-.55)/.45,0,1)),x,y,'ihB')}
 else if(tb>=220)dDisc(g,cN,k*(.42+.58*easeO(cl((tb-220)/BLOOM,0,1))),x,y,'ihB')}
function meetIn(g,x,y,k,cN,tb,st){if(TK()!==3||tb>=220)return;const v=sm(tb/220);dDisc(g,cN,k*.42,st.dx+(x-st.dx)*v,st.dy+(y-st.dy)*v,'ihV')} /* Meet: the door's small drop travelling out to yours */
function meetOut(g,x,y,k,now){if(!REF||TK()!==3)return;const tR=now-REF.t;if(tR>540)return;const L=HR*.93*k*1.42,tx=x+REF.ux*L,ty=y+REF.uy*L,c=colOf(REF.n);let px,py,s=.42;if(tR<200){const v=sm(tR/200);px=REF.sx+(tx-REF.sx)*v;py=REF.sy+(ty-REF.sy)*v}else if(tR<260){px=tx;py=ty}else{const v=sm((tR-260)/260);px=tx+(REF.sx-tx)*v;py=ty+(REF.sy-ty)*v;s=.42*(1-v*v)}dDisc(g,c,k*s,px,py,'ihV')} /* Meet wrong: it touches and bounces back home */
function doorTick(now){if(!LV||!LV.jump||!S||!S.path)return;if(shake&&(!REF||REF.t!==shake.t)&&now-shake.t<400){const [r,c]=rc(shake.k),tk=GR[r][c],n=isNote(tk)?tk:tk==='E'&&PITCH[shake.k]?PITCH[shake.k]:null;if(n&&H.note){const [sx,sy]=G(c,r),hp=HPOS||ctr(S.path[S.path.length-1]),L=Math.hypot(sx-hp[0],sy-hp[1])||1;REF={k:shake.k,t:shake.t,n,cO:H.note,ts:TASTE.k===shake.k?TASTE.s:0,ux:(sx-hp[0])/L,uy:(sy-hp[1])/L,sx,sy,arm:true}}}
 if(REF&&REF.arm){const A=APS[REF.k];if(!A||A.p<.15)REF.arm=false}
 if(TASTE.s>.01)LTS={k:TASTE.k,s:TASTE.s,t:now};TASTE.s=0;TASTE.k=-1;if(TK()===1&&typeof APS!=='undefined'){let best=null;for(const k in APS){const A=APS[k];if(A.pass||(REF&&REF.arm&&REF.k===+k)||(window.__leadBlocks&&window.__leadBlocks(+k)))continue;if(!best||A.p>best.p)best={k:+k,p:A.p,n:A.n}}if(best&&best.p>.02){const [r,c]=rc(best.k),[sx,sy]=G(c,r),hp=HPOS||ctr(S.path[S.path.length-1]),L=Math.hypot(sx-hp[0],sy-hp[1])||1;TASTE.k=best.k;TASTE.n=best.n;TASTE.s=.38*Math.pow(best.p,1.5);TASTE.ux=(sx-hp[0])/L;TASTE.uy=(sy-hp[1])/L}}}
window.__ink2={get pos(){return HPOS},get H(){return H},get LEFTS(){return LEFTS},MODE,LEFT};
const isStar=k=>{const [r,c]=rc(k),tk=GR[r][c];return isNote(tk)||/^[ES]/.test(tk)||!!PITCH[k]};
const colOf=n=>n==='__W'?(window.__inkWhite||[248,244,234]):c3(COLOR[n]); /* v72o erase wall: '__W' = the wall's white */
function reset(){LVr=LV;HS={};LEFTS=new Map();H={note:null,prev:null,t0:-1e9};OSIG='';SNAP={k:-1,t:-1e9,armed:false};
 try{const seen=new Set();GR.forEach((row,r)=>row.forEach((t,c)=>{const k=key(r,c),n=PITCH[k]||(isNote(t)?t:null);if(n)seen.add(n)}));if(LV.startNote)seen.add(LV.startNote);if(window.__inkErase)seen.add('__W');
  for(const n of seen){const c=colOf(n);Look.prePatch(HR,HSEED,c);Look.prePatch(CR,HSEED,c);if(LEFT!=='none')GR.forEach((row,r)=>row.forEach((t,cc)=>{const [x]=G(cc,r);Look.prePatch(LR,(x|0)%97,c)}))}}catch(e){}} /* every disc the head or a left seep can need is baked ahead in idle slices, never mid-drag */
function leftDraw(g,now){ /* the seeps left behind, painted into their own canvas, then laid UNDER the stars and string (destination-over) */
 for(const [k,L] of LEFTS){const age=now-L.t0,gu=easeO(cl(age/700,0,1)),dr=DRY>0?1-(1-DRYTO)*cl((age-700)/(DRY*1000),0,1):1,go=L.gone?1-cl((now-L.gone)/300,0,1):1;const a=dr*go;if(a<=.004)continue;
  if(LEFT==='wash')view.look.soundAt(g,7000+k,L.x,L.y,L.col,.95*a,LR*(.35+.65*gu),LR);
  else{g.save();g.globalAlpha=a*.75;view.look.patch(g,L.x,L.y,LR,(L.x|0)%97,L.col,.2+.8*gu,'ilf'+k);g.restore()}}}
let HCV=null,HCX=null;
function head(g0,now){const DB=window.__inkdbg||(window.__inkdbg=[]);if(DB.length>4000)DB.length=0;if(MODE!=='off'&&S&&S.won&&H.note&&(HPOS||WIN)){if(!WIN||WIN.lv!==LV){const k=S.path[S.path.length-1],[ex,ey]=ctr(k);const mid=H.prev&&H.st&&now-H.t0<DURS();WIN={lv:LV,t0:mid?H.t0:now,m0:now,x:HPOS[0],y:HPOS[1],ex,ey,cO:colOf(mid?H.prev:H.note),cN:PITCH[k]?colOf(PITCH[k]):colOf(H.note),st:mid?H.st:stOf(k,now)}} /* the change already under way when the path reached the door carries on, never restarts */HPOS=null;winDraw(g0,now);return}
 if(S&&!S.won)WIN=null;
 if(MODE==='off'||!S||S.won||S.muddy||!H.note){HPOS=null;DB.push([Math.round(now),'skip',S&&S.won,S&&S.muddy,H.note]);return}let kT=1,kD=1,[x,y]=window.__strokeEnd?window.__strokeEnd():ctr(S.path[S.path.length-1]);
 {const P=S.path;let b=HR*BACK,cx=x,cy=y,i0=P.length-1;if(i0>0){const [ax,ay]=ctr(P[i0-1]),[bx,by]=ctr(P[i0]),dx=bx-ax,dy=by-ay,t=((x-ax)*dx+(y-ay)*dy)/((dx*dx+dy*dy)||1);if(t<1)i0--} /* the tip has not reached the last square's center yet: walk back from the one before */for(let i=i0;i>=0&&b>0;i--){const [px,py]=ctr(P[i]),d=Math.hypot(cx-px,cy-py);if(d<.5)continue;const t=Math.min(1,b/d);cx+=(px-cx)*t;cy+=(py-cy)*t;b-=d*t}x=cx;y=cy} /* the drop sits on the paint, BACK x its radius behind the stroke end, measured back along the lane (continuous through square changes: tester s204 out-and-back) */
 {const P=S.path;for(let i=P.length-1;i>=0;i--)if(isStar(P[i])){const [sx,sy]=ctr(P[i]),da=view.look.doorAmt?view.look.doorAmt(sx,sy):-1;if(da>=0&&da<1){const u0=cl((da-.55)/.45,0,1),v=u0*u0*(3-2*u0);let al=0,q=1;if(i>0&&LEAPFIX){const [qx,qy]=ctr(P[i-1]),L=Math.hypot(sx-qx,sy-qy)||1,ux=(sx-qx)/L,uy=(sy-qy)/L;al=(x-sx)*ux+(y-sy)*uy;q=cl(1+al/(CS*.6),0,1)}if(al<0){kD=1-(1-(.55+.45*v))*q;if(SWAP==='through')kT=1-(1-(.3+.7*v))*q}else{x=sx+(x-sx)*v;y=sy+(y-sy)*v;kD=.55+.45*v;if(SWAP==='through')kT=.3+.7*v}}break}} /* v72o (tester s241 #2, pre-existing since v72j): the drop no longer leaps up onto a door star the moment its square is entered; it stays on the paint and only stops at the star (squeezing as it nears it) until the split opens. ?leap=1 = old */ /* tester s204 #2: the drop stays on the star, squeezed to fit its chamber, until the split is past halfway, then grows out with the opening */
 {const nowT=now,dt=HS.t?Math.min(50,nowT-HS.t):16;HS.t=nowT;const drag=typeof dragS!=='undefined'&&!!dragS;if(!HS.p){HS.p=[x,y];HS.k=kD}else{const lt=HS.lt||[x,y],mv=Math.hypot(x-lt[0],y-lt[1]);HS.n=mv>6?0:(HS.n||0)+1;const j=Math.hypot(x-HS.p[0],y-HS.p[1]);if(drag&&j<24)HS.p=[x,y];else if(drag||HS.n>=3){const a=Math.min(1,dt/60);HS.p=[HS.p[0]+(x-HS.p[0])*a,HS.p[1]+(y-HS.p[1])*a]}HS.k+=(kD-HS.k)*Math.min(1,dt/80)}HS.lt=[x,y];x=HS.p[0];y=HS.p[1];kT*=HS.k} /* tester s204 #1: when the finger stops, the stroke end can jump out and back for 2 frames; once the finger is up the drop only moves to a spot that has held still for 3 frames, and eases there (60ms) */ /* while the door you just entered is still splitting, the drop waits in its chamber and comes out with the opening (never clipped by the seal) */
DB.push([Math.round(now),Math.round(x),Math.round(y),H.note]);HPOS=[x,y];
 const m=ctx.getTransform(),sc=Math.hypot(m.a,m.b),RR=MODE==='pull'?1.8*CS+LR:MODE==='carry'?CR*1.6:HR*3,N=Math.ceil(2*RR*sc)+4;if(!HCV||HCV.width!==N){HCV=document.createElement('canvas');HCV.width=HCV.height=N;HCX=HCV.getContext('2d')}
 const dp=m.transformPoint({x,y}),ox=Math.round(dp.x-N/2),oy=Math.round(dp.y-N/2),g=HCX;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,N,N);g.setTransform(m.a,m.b,m.c,m.d,m.e-ox,m.f-oy);
 const tb=now-H.t0,u=SWAP==='through'?1:cl(tb/BLOOM,0,1),bl=H.prev&&H.st&&tb<DURS(),cN=colOf(H.note),cP=H.prev?colOf(H.prev):cN;
 let kS=kT;if(MODE==='pull'&&now-SNAP.t<240){const v=(now-SNAP.t)/240;kS*=1+.22*Math.sin(v*Math.PI)*(1-v)}
 const ub=.12+.88*easeO(u);
 if(MODE==='bead'){const sp=(c,k,a,id)=>{g.save();g.globalAlpha=a;view.look.patch(g,x,y,HR,HSEED,c,k,id);g.restore()};sp(bl?cP:cN,1.45*kS,.38,'ihS');sp(bl?cP:cN,.8*kS,.75,'ihA');if(bl){sp(cN,1.45*kS*ub,.38,'ihS2');sp(cN,.8*kS*ub,.75,'ihB')}} /* soft: a pale wide wash with a small wet core */
 else if(MODE==='carry'){view.look.patch(g,x,y,CR,HSEED,bl?cP:cN,kS,'ihA');if(bl)view.look.patch(g,x,y,CR,HSEED,cN,kS*ub,'ihB');const sv=ctx;ctx=g;try{L3.actRing(x,y,25*kS,1,now)}finally{ctx=sv}} /* the start's circle itself (same patch size and ring) is what you drag */
 else{if(MODE==='pull')neck(g,now,x,y);const body=(c,k,px=x,py=y)=>{if(OPQ>0){g.save();g.globalAlpha=OPQ;g.fillStyle='rgb('+c.map(v=>Math.round(v*.88)).join(',')+')';g.beginPath();g.arc(px,py,HR*.93*k,0,7);g.fill();g.restore()}};
 const T=TK(),tR=REF&&LV.jump?now-REF.t:1e9,tq=T===3?tR-200:tR,sq=T!==2&&tq>=0&&tq<800?.2*Math.exp(-tq/230)*Math.cos(tq/1000*2*Math.PI*5):0;g.save();if(sq){const an=Math.atan2(REF.uy,REF.ux);g.translate(x,y);g.rotate(an);g.scale(1-sq,1+.6*sq);g.rotate(-an);g.translate(-x,-y)} /* refused: the drop squashes against the door and springs back, in time with the wobble (Meet: as the two drops touch) */
 /* Sam 2:39pm: the drop is solid paint sitting ON the string, so nothing of the string shows through it */dDisc(g,bl?cP:cN,kS,x,y,'ihA');if(bl)fill(g,x,y,kS,cP,cN,tb,H.st);
 else if(TASTE.s>.01&&T===1)soak(g,x,y,kS,cN,colOf(TASTE.n),TASTE.s,TASTE.ux,TASTE.uy); /* Soak: the front edge starts to take the door's color as you near it */
 if(tR<1300){const cD=colOf(REF.n);
  if(T===0){const s=tR<200?.55*sm(tR/200):.55*(1-sm((tR-200)/280));if(SOFTB)seepDisc(g,cD,kS,x,y,'ihR',s);else dDisc(g,cD,kS*s,x,y,'ihR')}
  else if(T===1){const w=tR<150?REF.ts+(.5-REF.ts)*sm(tR/150):.5*(1-sm((tR-150)/400));if(w>.005)soak(g,x,y,kS,cN,cD,w,REF.ux,REF.uy)}
  else if(T===2){if(tR<520)blots(g,x,y,kS,cD,.35*sm(tR/250),tR,'ihW');const bc=brownOf(colOf(REF.cO),cD),os=easeO(cl((tR-800)/450,0,1));if(os<1)dDisc(g,bc,kS*easeO(cl((tR-250)/260,0,1)),x,y,'ihM');if(os>0)dDisc(g,cN,kS*os,x,y,'ihC')}}
 g.restore()}
 {const RX=(MODE==='carry'?CR:HR)*1.6;GR.forEach((row,r)=>row.forEach((t,c)=>{const k=key(r,c);if(!isStar(k))return;const [sx,sy]=G(c,r);if(Math.abs(sx-x)>RX+CS*.6||y<sy-4||y-sy>RX+30)return;const da=view.look.doorAmt?view.look.doorAmt(sx,sy):-1;if(da===0)g.clearRect(sx-CS,sy-26-RX*2.2,2*CS,RX*2.2)}))} /* a sealed door's back stays shut: the head's paint never shows past the seal (same y-26 cut as the game's door seeps) */
 g0.save();g0.setTransform(1,0,0,1,0,0);g0.globalCompositeOperation=SWAP==='through'?'destination-over':'source-over';g0.drawImage(HCV,ox,oy);g0.restore();if(MODE==='drop'){if(bl)meetIn(g0,x,y,kS,cN,tb,H.st);meetOut(g0,x,y,kS,now)}} /* through: laid UNDER the stars and door art (like the string), over the left-behind seeps */
let WIN=null,LTS=null;function winDraw(g,now){const tm=now-WIN.m0,tb=now-WIN.t0;if(tm>560)return;const v=sm(tm/520),s=1-v*v,x=WIN.x+(WIN.ex-WIN.x)*sm(tm/380),y=WIN.y+(WIN.ey-WIN.y)*sm(tm/380);if(s<.01)return;dDisc(g,WIN.cO,s,x,y,'ihA');fill(g,x,y,s,WIN.cO,WIN.cN,tb,WIN.st);meetIn(g,x,y,s,WIN.cN,tb,WIN.st)} /* v72j: on the end door the drop slides into the door, finishes its change and shrinks into the door's bloom */
function neck(g,now,tx,ty){ /* pull: while the head is within 1.6 squares of the stargate it left, a tapering neck of the same ink joins them; past that it snaps */
 const P=S.path;let j=-1;for(let i=P.length-2;i>=0;i--)if(isStar(P[i])){j=i;break}if(j<0){SNAP.armed=false;return}
 const pts=P.slice(j).map(k=>ctr(k));pts[pts.length-1]=[tx,ty];if(isStar(P[P.length-1])&&P.length-1>j){SNAP.armed=false;return}
 let d=0;const seg=[];for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(l);d+=l}
 const DMAX=1.6*CS;if(SNAP.k!==P[j]){SNAP.k=P[j];SNAP.armed=true}
 if(d>=DMAX){if(SNAP.armed){SNAP.armed=false;SNAP.t=now}return}if(d<HR*.6)return;SNAP.armed=true;
 const s=1-d/DMAX,N=6,cN=colOf(H.note);for(let i=0;i<N;i++){const f=(i+1)/(N+1);let w=f*d,q=0;while(q<seg.length-1&&w>seg[q]){w-=seg[q];q++}const a=pts[q],b=pts[q+1],v=seg[q]?w/seg[q]:0,px=a[0]+(b[0]-a[0])*v,py=a[1]+(b[1]-a[1])*v;
  const r=((LR*.55)*(1-f)+HR*.55*f)/HR*(.35+.65*s);view.look.patch(g,px,py,HR,HSEED,cN,r,'ihN'+i)}}
const _ds=drawString;drawString=function(t){_ds(t);try{if(!Look.ELW||!view||!view.look||!view.look.patch||!S||!S.path)return;if(LVr!==LV)reset();const now=performance.now();
 const P=S.path,cs=carries(S),last=cs[cs.length-1];
 if(LEFT!=='none'){const inP=new Set(P);for(let i=0;i<P.length-1;i++){const k=P[i];if(!isStar(k)||LEFTS.has(k)&&!LEFTS.get(k).gone)continue;const c=cs[i];if(!c||c==='mud'||!c.length)continue;const [x,y]=ctr(k);LEFTS.set(k,{t0:now,col:colOf(c[0]),x,y})}
  for(const [k,L] of LEFTS)if(!inP.has(k)&&!L.gone)L.gone=now;for(const [k,L] of LEFTS)if(L.gone&&now-L.gone>320)LEFTS.delete(k)}
 let n=last&&last!=='mud'&&last.length===1?last[0]:null;if(n&&window.__inkErase&&window.__inkErase())n='__W'; /* v72o (Stacking Notes erase wall, Sam 11:30am 'your tip paints white through to the star where it then mixes again'): once the string paints past an erase wall the drop blooms to white, then to the reset star's colour at the star */if(n&&n!==H.note){H.st=stOf(P[P.length-1],now);H.prev=H.note;H.note=n;H.t0=now}
 if(SWAP==='through')head(ctx,now);
 if(LEFTS.size){const cv=ctx.canvas;if(!OC||OC.width!==cv.width||OC.height!==cv.height){OC=document.createElement('canvas');OC.width=cv.width;OC.height=cv.height;OX=OC.getContext('2d');OSIG=''}
  let sig='';for(const [k,L] of LEFTS){const age=now-L.t0;sig+=k+':'+(age<960?Math.round(age/16):'g')+':'+(DRY>0&&age<DRY*1000+760?Math.round(age/120):'d')+':'+(L.gone?Math.round((now-L.gone)/16):'')+';'}
  if(sig!==OSIG){OSIG=sig;OX.setTransform(1,0,0,1,0,0);OX.clearRect(0,0,OC.width,OC.height);OX.setTransform(ctx.getTransform());leftDraw(OX,now)} /* only repainted while a seep is still spreading, drying or going; otherwise the same picture is reused */
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='destination-over';ctx.drawImage(OC,0,0);ctx.restore()}
}catch(e){console.error(e)}};
const _dr=draw;draw=function(t){try{if(LVr===LV)doorTick(performance.now())}catch(e){console.error(e)}_dr(t);try{if(SWAP!=='through'&&Look.ELW&&view&&view.look&&view.look.patch&&S&&S.path&&LVr===LV)head(ctx,performance.now())}catch(e){console.error(e)}}; /* top: the drop is painted last, over the door's own seep, so its color change shows */
})();
