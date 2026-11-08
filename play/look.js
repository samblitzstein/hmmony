// look.js: THE NIGHT-SKY LOOK (prototype v30). Ported from the branding lab, /mnt/project-files/branding/lab/lab-v6.4.html
// (handoff branding/lab/HANDOFF-PROTOTYPE.md; the lab passed the tester). Names follow the lab so the two can be read side by side.
//
// SEAM 3, rendering only (prototype/PORTING.md). It is told the board's open squares, where the stars are, and what the game is
// doing (the brush head, whether a finger is dragging, which part is still asleep, how much dawn). It draws the sky, the star trails,
// the ink nebula and its watchers, the stars' own trails, and the ink string. It never decides a rule: stars wake only when the game
// says so, and life (the light that spreads from the string) only changes how the sky moves and glows.
//
// Locks (Sam, Nov 1): ink brush paint; ink nebula, one connected mass, no edge glow (3b's art pass, look A "pooled ink", is the lab
// default; the nebula look itself is still open); star trails turning round a pivot far above the screen (TR=7, mirrored for
// bottom-up); life colours only the trails (WASH=0) and spreads in watercolour runs (W2, SPR=5); the string takes each star's colour
// from that star on; rounded string corners (ROUND=1); stars wear their own trails (STY=2, 14 per star, glow rad*3.3);
// density 1500, kept as a dial (Look.DENS).
// v32 (Sam Nov 1 3:50pm, 4:15pm): the string is 3b's watercolour bleed (lab v7.1 SEEP BLEED + v6.8 map, the strings prototype's seepAdd/seepWash,
// v6.9 order: the first colour floods the string, each new colour bleeds out from the centre, oldest outside), and the nebula is look E
// (watercolour layers). ?str=ink and ?neb=a show v31's ink string and pooled-ink nebula for comparison.
(function(){
'use strict';
const W=780,H=1688;
const reduce=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const Look={DENS:1500,OWN:14};
const QP=typeof location!=='undefined'?new URLSearchParams(location.search):new URLSearchParams(''),MIXB=+(QP.get('mixb')||10),BOUT=+(QP.get('bout')||10),CORE=+(QP.get('core')||5),WS=+(QP.get('ws')||2.5); /* v33 = lab v7.5 (Sam Nov 1 6:23pm LOCKED the WB Rings string): mix band 10px, bleed out 10px */
const BILX=/[?&]bil=0\b/.test(typeof location!=='undefined'?location.search:'');const NEBHI=/[?&]nebhi=1\b/.test(typeof location!=='undefined'?location.search:''); /* v35 (tester 7:00pm, frame time): nebula E is baked at HALF res and drawn with the sky by default; ?nebhi=1 = lab v7.5 full res on its own layer, which costs a whole frame on the test machine */
const WL=5, /* v56 WALLS (3b nebula, Sam Nov 3 1:33pm + 1:40pm): lit dust + minimum wall size ~30 css px everywhere, no bright rim; locked as the default, no param */WLF=WL===2||WL===4,WLB=WL===1||WL===4||WL>=5,WLM=WL>=5?(WL===5?44:59):0,WLR=WL===3||WL===4; /* 3b wall-visibility takes (Sam Nov 3 FIL playtest): 1 lit dust, 2 fatter walls, 3 bright rim, 4 all */
const NB=5,NI=10,NW=3,THIN=!/[?&]thin=0\b/.test(location.search); /* v47 NEBULA BORDER LOCK (Sam Nov 2 5:22pm "ship it"; 3b branding/nebula/look-takes-v4.js): wide watercolour seep border F with the pull-back split (NB 5), starlit edge, deep layers mixing wet into wet; watchers D (NW 3: two big lavender ghost-wash figures). v49 INSIDES take M (Sam Nov 3 7:37pm tentative lock, judge in game; NI 10: six dust kinds blended by warped Voronoi cells 220/sigma 44, darkened for negative space, hue from nearby stars; knobs QV, cell size, sigma). URL takes removed. */
const DEEPOK=!(typeof location!=='undefined'&&/[?&]deep=0\b/.test(location.search));const NEB=(typeof location!=='undefined'&&/[?&]neb=a\b/.test(location.search))?5:9,STRW=(typeof location!=='undefined'&&/[?&]str=ink\b/.test(location.search))?0:2; /* v32: nebula E and the watercolour string by default; ?neb=a and ?str=ink bring back v31's pooled ink and ink string */
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function hash(n){n=(n^61)^(n>>>16);n=n+(n<<3);n=n^(n>>>4);n=Math.imul(n,0x27d4eb2d);return ((n^(n>>>15))>>>0)/4294967296}
function vnz(x,y,s){const h=(i,j)=>{let n=(i*374761393+j*668265263+s*2147483)|0;n=(n^(n>>>13))*1274126177|0;return ((n^(n>>>16))>>>0)/4294967296};
 const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 return (h(xi,yi)*(1-u)+h(xi+1,yi)*u)*(1-v)+(h(xi,yi+1)*(1-u)+h(xi+1,yi+1)*u)*v}
const fbm=(x,y,s)=>vnz(x,y,s)*.55+vnz(x*2.1,y*2.1,s+7)*.3+vnz(x*4.3,y*4.3,s+13)*.15;
const hexRGB=h=>{const n=parseInt(h.slice(1),16);return [n>>16,(n>>8)&255,n&255]};
const PS={};function puffSprite(c){if(PS[c])return PS[c];const e=mk(64,64),x=e.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba('+c+',.7)');gr.addColorStop(1,'rgba('+c+',0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return PS[c]=e}
// watchers = faded white constellation figures (the recital spectators), one per big block of nebula (lab FIG)
const FIG={
 hare:{P:[[40,-5],[30,-15],[18,-58],[31,-60],[-18,-16],[-46,-2],[-30,24],[24,20],[0,14]],E:[[0,1],[1,2],[1,3],[1,4],[4,5],[5,6],[6,8],[8,7],[7,0]],anim:(P,t,v)=>{P[2][0]+=Math.sin(t*1.3)*4*v;P[3][1]+=Math.sin(t*1.3+1)*3*v;P[6][1]+=Math.max(0,Math.sin(t*.8))*-5*v}},
 swan:{P:[[46,-42],[38,-36],[30,-10],[20,10],[-8,-34],[-34,-12],[-46,8],[-4,18]],E:[[0,1],[1,2],[2,3],[3,7],[7,6],[6,5],[5,4],[4,3]],anim:(P,t,v)=>{P[4][1]+=Math.sin(t*1.1)*12*v;P[5][1]+=Math.sin(t*1.1-.4)*6*v}},
 dolphin:{P:[[46,6],[30,-6],[2,-24],[-18,-12],[-44,-16],[-48,6],[0,12]],E:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,3],[3,6],[6,0]],anim:(P,t,v)=>{const k=Math.sin(t*.9)*6*v;P[4][1]+=k;P[5][1]+=k;P[0][1]-=k*.4}}};
const FN=['swan','hare','dolphin','hare','swan','dolphin','swan'];

// The board's wall field and its painted nebula are the costly part of a new sky (~100ms), so they can be built ahead in small
// slices (Look.prep(o).step(ms) each frame while you play) and handed to make() as o.pre; make() finishes any that are left.
const NK_=[[[150,92,50],[100,48,30],[36,18,18],[170,98,48]],[[96,124,144],[48,60,84],[22,20,36],[120,64,72]],[[170,60,82],[112,30,58],[34,10,26],[224,96,116]],[[92,112,192],[50,60,140],[18,20,52],[150,170,236]],[[74,62,84],[22,17,28],[6,5,10],[214,160,112]],[[60,150,140],[30,82,92],[12,26,34],[214,176,84]]]; /* 3b round 3 nebula KINDS: cliffs dust, infrared smoke, red hydrogen glow, blue reflection haze, dark pillar (lit rim), teal+gold planetary */
const QN=(k,d)=>{const m=typeof location!=='undefined'&&location.search.match(new RegExp('[?&]'+k+'=(-?[\\d.]+)'));return m?+m[1]:d};const Q_WC=QN('wc',-6),Q_AR=QN('ar',23),Q_TW=QN('tw',12),Q_DW=QN('dw',24),Q_DD=QN('dd',30);const ET=+((typeof location!=='undefined'&&location.search.match(/[?&]et=(\d)/))||[0,1])[1];const EN=+((typeof location!=='undefined'&&location.search.match(/[?&]en=(\d)/))||[0,4])[1],EX=+((typeof location!=='undefined'&&location.search.match(/[?&]ex=(\d)/))||[0,4])[1];const DV=+((typeof location!=='undefined'&&location.search.match(/[?&]dv=(\d+)/))||[0,9])[1], /* v60 DOOR LOOK W-S0 (Sam tentatively locked Nov 3 6:15pm, 3b gates; process/handoff-gates.md): defaults dv=9 en=4 ex=4 ar=23 wc=-6; ?dv=0 = the v59 look */DW_T=58,DW_S=21,DW_H=19,DOORS=[];
const INK=!/[?&]ink=0\b/.test(location.search);
const UM=+((typeof location!=='undefined'&&location.search.match(/[?&]um=(\d)/))||[0,7])[1], /* Sam Nov 5 9:12am (3b gates), 'lock it' on Crack, then split: the door unlock is take 7 (was 3, Split) */DOORT={},SPL=UM===3||UM>=5,DY1=SPL?80:14;const WN=3; /* Sam Nov 5 12:47pm (3b gates, Door motion) on 'Strain, then snap shut': 'this is good ship it'. The game has no picker: a wrong-note door cracks, strains apart, then snaps shut */
function inkStar(g,col,t,seed,enc){const c=col.split(',').map(Number),dk=c.map(v=>Math.round(v*.55)).join(','),lt=c.map(v=>Math.round(v+(255-v)*.55)).join(','),rn=i=>Math.sin(seed*12.9+i*78.2)*.5+.5;
 const blob=(R,a,fill,str,lw)=>{g.beginPath();for(let i=0;i<=24;i++){const an=i/24*Math.PI*2,rr=R*(1+.07*Math.sin(an*5+seed)+.06*Math.sin(an*7+seed*2.3)+.04*Math.sin(an*3+seed*4.1+t*.5));const px=Math.cos(an)*rr,py=Math.sin(an)*rr;i?g.lineTo(px,py):g.moveTo(px,py)}g.closePath();g.globalAlpha=a;if(fill){g.fillStyle=fill;g.fill()}if(str){g.strokeStyle=str;g.lineWidth=lw;g.stroke()}};
 const ray=(dx,dy,L,w,a)=>{g.globalAlpha=a;g.fillStyle='rgba('+c.join(',')+',1)';g.beginPath();g.moveTo(dx*L,dy*L);g.quadraticCurveTo(-dy*w,dx*w,-dx*L*.15,-dy*L*.15);g.quadraticCurveTo(dy*w,-dx*w,dx*L,dy*L);g.fill()};
 g.globalCompositeOperation='source-over';const gr=g.createRadialGradient(0,0,0,0,0,enc?17:26);gr.addColorStop(0,'rgba('+c.join(',')+',.35)');gr.addColorStop(1,'rgba('+c.join(',')+',0)');g.globalAlpha=1;g.fillStyle=gr;g.beginPath();g.arc(0,0,enc?17:26,0,7);g.fill();
 ray(0,-1,enc?15:36,5,.5);ray(0,1,36,5,.5);ray(1,0,enc?12:15,3.6,.45);ray(-1,0,enc?12:15,3.6,.45);
 for(let j=0;j<3;j++){g.save();g.translate(Math.cos(seed*7+j*2.1)*1.6,Math.sin(seed*5+j*2.1)*1.6);blob(13-j*.8,.62,'rgba('+c.join(',')+',1)',j===0?'rgba('+dk+',1)':null,1.6);g.restore();seed+=1.7}
 blob(6.5,.45,'rgba('+lt+',1)');blob(3,.95,'rgba('+lt+',1)');g.globalAlpha=1}
function doorFx(g){const t=performance.now()/1000;const DS=[];if(typeof GR!=='undefined'&&GR)GR.forEach((row,r)=>row.forEach((t0,c)=>{const tk=(typeof LV!=='undefined'&&LV.rows[r].split(' ')[c])||t0;if(!(/^[A-G]s?\d$/.test(tk)||/^[ES]=/.test(tk)))return;const vert=(r>0&&GR[r-1][c]!=='@')||(r<NR-1&&GR[r+1][c]!=='@');const P0=G(c,r);let sx=0;try{if(typeof shake!=='undefined'&&shake&&shake.k===key(r,c)){const tt=performance.now()-shake.t;const t2=tt-(shake.d||0);if(!shake.still&&t2>=0&&t2<400)sx=Math.sin(t2/22)*6*(1-t2/400)}}catch(e){} /* v60: a door that refuses you still shakes */DS.push([P0[0]+sx,P0[1],vert?[0,1]:[1,0],tk])}));for(const [x,y,ax,tk] of DS){const n=(/^[ES]=(.+)$/.exec(tk)||[0,tk])[1],free=/^S=/.test(tk),col=(typeof COLOR!=='undefined'&&COLOR[n])||'228,236,255';g.save();g.translate(x,y);if(ax[0])g.rotate(Math.PI/2);g.lineCap='round';
 const band=(y0,y1,w,a,c)=>{g.globalAlpha=a;g.strokeStyle='rgba('+c+',1)';g.lineWidth=w;g.beginPath();g.moveTo(0,y0);g.lineTo(0,y1);g.stroke()};
 if(DV===9&&(EX===2||EX===3)&&ax[1]){const p=(.8+.2*Math.sin(t*1.6))*(EX===2?.4:1),y0=-(EN===3?24:17),y1=-(12+54);band(y0,y1+2,1.4,.8*p,'236,240,255');band(y0,y1+2,5,.14*p,'236,240,255')}
 if((DV===10||DV===11)&&ax[1]){const p=.8+.2*Math.sin(t*1.6);if(DV===10){band(-24,-54,1.6,.75*p,'228,236,255');band(-24,-54,5,.12*p,'228,236,255')}else{g.globalAlpha=.5*p;g.fillStyle='rgba(228,236,255,1)';g.beginPath();g.roundRect(-11,-66,22,12,4);g.fill();g.globalAlpha=.9;g.strokeStyle='rgba(240,244,255,1)';g.lineWidth=1.4;g.beginPath();g.moveTo(-10,-55);g.lineTo(10,-55);g.stroke()}}
 if(DV===8&&ax[1]){const L0=22+DW_T/2*1.6,p=.75+.25*Math.sin(t*2);const gr=g.createRadialGradient(0,-L0,0,0,-L0,34);gr.addColorStop(0,'rgba('+col+','+(.32*p)+')');gr.addColorStop(1,'rgba('+col+',0)');g.globalAlpha=1;g.fillStyle=gr;g.beginPath();g.arc(0,-L0,34,0,7);g.fill()}
 if(DV===3||DV===4){if(DV===3){const L=DW_T/2*2.1+6,p=.8+.2*Math.sin(t*2);for(const sg of [-1,1])for(let i=0;i<3;i++){const ww=DW_S*(1.1+i*.45);const gr=g.createLinearGradient(0,sg*18,0,sg*L);gr.addColorStop(0,'rgba('+col+','+((.32-.08*i)*p)+')');gr.addColorStop(1,'rgba('+col+',0)');g.globalAlpha=1;g.fillStyle=gr;g.fillRect(-ww/2,Math.min(sg*18,sg*L),ww,L-18)}}
 else{for(const sg of [-1,1])for(const [w,a] of [[22,.07],[14,.13],[8,.22],[3,.35]])band(sg*28,sg*100,w,a,'228,236,255')}}
 if(INK){{const hg=g.createRadialGradient(0,0,6,0,0,20);hg.addColorStop(0,'rgba(6,6,18,.62)');hg.addColorStop(1,'rgba(6,6,18,0)');g.globalAlpha=1;g.fillStyle=hg;g.beginPath();g.arc(0,0,20,0,7);g.fill()} /* v60c (blind audit B): a dark halo, inside the alcove, so the door's colour stands off the nebula */inkStar(g,col,t,x*.01+y*.007,DV>=6&&!!ax[1]&&!free);{const t0=DOORT[Math.round(x)+','+Math.round(y)];if(t0){const a=(performance.now()-t0)/1000,D=UM===4?.9:UM===2?1.4:.6,k=a<D?Math.sin(Math.PI*Math.min(1,a/D)):0;if(k>0){const R=14+k*8,fg=g.createRadialGradient(0,0,0,0,0,R);fg.addColorStop(0,'rgba('+col+','+(.55*k)+')');fg.addColorStop(1,'rgba('+col+',0)');g.globalAlpha=1;g.fillStyle=fg;g.beginPath();g.arc(0,0,R,0,7);g.fill()}}}}
 g.restore();g.globalAlpha=1}}
// the light grid's fixed parts (walls, grain, how near a star each cell is), once per board. 3b gates (tester s179 A): it used to be
// built in Look.make on the swap frame; prep now bakes it in its idle slices (or the worker) and make just copies it.
function lifeJob(stars){const LC=10,LW=Math.ceil(W/LC)+1,LH=Math.ceil(H/LC)+1,BLK=new Uint8Array(LW*LH),GRAIN=new Float32Array(LW*LH),STN=new Float32Array(LW*LH);
 let sd=901;const r=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};const NG=12,nw=Math.ceil(LW/NG)+2,nh=Math.ceil(LH/NG)+2;const oct=[];for(let q=0;q<3;q++){const a=[];for(let i=0;i<nw*nh*(1<<(2*q));i++)a.push(r());oct.push(a)}
 function vn(i,j,q){const sc=NG/(1<<q),w=Math.ceil(LW/sc)+2,x=i/sc,y=j/sc,x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,A=oct[q],Q=(a,b)=>A[(b*w+a)%A.length],sm=t=>t*t*(3-2*t);const u=sm(fx),v=sm(fy);return Q(x0,y0)*(1-u)*(1-v)+Q(x0+1,y0)*u*(1-v)+Q(x0,y0+1)*(1-u)*v+Q(x0+1,y0+1)*u*v}
 const ST=(stars||[]).map(q=>[q[0],q[1],q[2]]);
 const J={LW,LH,BLK,GRAIN,STN,j:0,step(sdf,t0,ms){while(J.j<LH){const j=J.j;for(let i=0;i<LW;i++){const k=j*LW+i,x=i*LC,y=j*LC;BLK[k]=(sdf(x,y)<8||x<30||x>W-30||y<30||y>H-30)?1:0;
   GRAIN[k]=Math.pow(Math.abs(Math.sin((i-j*.6)*.75+vn(i,j,1)*2.5)),3)*.8+vn(i,j,2)*.2;let m=0;for(const [sx,sy,sr] of ST)m=Math.max(m,Math.exp(-((Math.hypot(x-sx,y-sy)/(sr*6))**2)));STN[k]=m}
   J.j++;if(t0!==undefined&&performance.now()-t0>ms)return false}return true}};return J}
function prep(o){const STARS_=(o.stars||[]).map(st=>o.noLit&&!/[?&]lit=1\b/.test(location.search)?[st[0],st[1],st[2],null]:st); /* v60c (Sam 7:53pm 'the light leak onto the nebula is contributing... colors wash together'): on door boards the stars no longer tint the nebula; ?lit=1 = the old tint */let ks_=97;const KR=()=>{ks_=(ks_*16807)%2147483647;return ks_/2147483647};const KSEED=[];{const cell=NI===7||NI===9||NI===11?330:NI===10?220:190;for(let y=-cell/2;y<H+cell;y+=cell)for(let x=-cell/2;x<W+cell;x+=cell)KSEED.push([x+(KR()-.5)*cell*.8,y+(KR()-.5)*cell*.8,Math.floor(KR()*6)])}const G=o.G,NR=o.rows.length,NC=o.rows[0].length,OPEN=o.rows.map(r=>r.map(t=>t!=='@'));
 // ---- board -> walls: corridor segments between adjacent open squares; the nebula is everything further than HW (+ noise) away
 const CSEG=[];for(let r=0;r<NR;r++)for(let c=0;c<NC;c++){if(!OPEN[r][c])continue;const [x,y]=G(c,r);
  if(c<NC-1&&OPEN[r][c+1]){const q=G(c+1,r);CSEG.push([x,y,q[0],q[1]])}if(r<NR-1&&OPEN[r+1][c]){const q=G(c,r+1);CSEG.push([x,y,q[0],q[1]])}CSEG.push([x,y,x,y])}
 if(o.lead)CSEG.push(o.lead);if(o.leads)for(const q of o.leads)CSEG.push(q); /* v37: a second lane in from the rim (the side the last board's string came in by) */
 const HW=NEB===5?44:60, /* lab v7.7 Track space: Sam Nov 1 6:37pm locked Widest (60) */MAXD=170,BK=100,BW=Math.ceil(W/BK),BH=Math.ceil(H/BK),BUCK=Array.from({length:BW*BH},()=>[]);
 for(const s of CSEG){const x0=Math.min(s[0],s[2])-MAXD,x1=Math.max(s[0],s[2])+MAXD,y0=Math.min(s[1],s[3])-MAXD,y1=Math.max(s[1],s[3])+MAXD;
  for(let j=Math.max(0,Math.floor(y0/BK));j<=Math.min(BH-1,Math.floor(y1/BK));j++)for(let i=Math.max(0,Math.floor(x0/BK));i<=Math.min(BW-1,Math.floor(x1/BK));i++)BUCK[j*BW+i].push(s)}
 const DWALL=[];if(DV)for(let r=0;r<NR;r++)for(let c=0;c<NC;c++){const tk=o.rows[r][c];if(typeof tk!=='string'||!(/^[A-G]s?\d$/.test(tk)||/^E=/.test(tk)))continue;const [x,y]=G(c,r);let vert=false;[[0,1],[0,-1]].forEach(([dc,dr])=>{const rr=r+dr;if(rr>=0&&rr<NR&&OPEN[rr][c])vert=true});
  if(!vert&&c>0&&c<NC-1&&OPEN[r][c-1]&&OPEN[r][c+1])continue; /* v60b (tester s157): a door in a lane you can reach from both sides gets no sealed back (a two-way door, like a swap star), so neither side runs into a wall */
  const ax=vert?[0,1]:[1,0];DWALL.push([x,y,ax[0],ax[1],DV===1?1.15:DV>=6?1.6:2.1,DV===1?0:DV===5?2:DV===6||DV===8?3:DV===7?4:DV===9?5:DV===10?6:DV===11?7:1]);}
 function sdfRaw(x,y){let d=MAXD;const L=BUCK[clamp(Math.floor(y/BK),0,BH-1)*BW+clamp(Math.floor(x/BK),0,BW-1)];
  for(const [x0,y0,x1,y1] of L){const dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy;let t=L2?((x-x0)*dx+(y-y0)*dy)/L2:0;t=t<0?0:t>1?1:t;const ex=x-x0-dx*t,ey=y-y0-dy*t,dd=Math.sqrt(ex*ex+ey*ey);if(dd<d)d=dd}
  const nz=Math.sin(x*.031+y*.017)*7+Math.sin(y*.047-x*.029+1.3)*5+Math.sin(x*.093+y*.071+2.1)*2.5;let v=HW+nz-d;
  for(const dw of DWALL){if(dw===SKIPD)continue;const [gx,gy,ux,uy,tk,pm]=dw;const px=x-gx,py=y-gy;if(Math.abs(px)>120||Math.abs(py)>120)continue;const u=px*ux+py*uy,w=-px*uy+py*ux,wt=DW_T/2*tk+nz*.35,sl=DW_S+nz*.2;if(Math.abs(u)>wt+60)continue;
   if(pm>=5&&EN>=5){const e=-u,C=12,WT=54+nz*.35,band=Math.abs(e-C)-WT,f0=C-WT,RS=EN===5?22:EN===6?28:33;let half=e>-RS&&e<RS?Math.sqrt(RS*RS-e*e):-1e3;
    if(e<=0){const nh=ET===1?12:ET===2?21:12+Math.max(0,(-e-RS*.5))*1.1;if(e<-RS*.5)half=Math.max(half,nh)}
    const fr=Math.max(band,half-Math.abs(w));if(fr<v)v=fr;continue}
   if(pm>=5){const e=-u,C=Q_WC,WT=54+nz*.35,band=Math.abs(e-C)-WT,f0=C-WT,f1=C+WT;let half;const ar=EN===3?24:Q_AR;
    if(e<0){half=EN===4?ar+Math.max(0,-e-6)*1.05:EN===2?17+Math.max(0,(-e-(-f0)*.35))*.55:EN===3?(e<f0+16?14:Math.sqrt(Math.max(0,ar*ar-e*e))):17;if(EN===3&&e>=f0+16)half=Math.max(half,e>-ar?Math.sqrt(ar*ar-e*e):0);}
    else if(e<ar)half=Math.sqrt(ar*ar-e*e);
    else if(EX>=5){half=-1e3;if((EX===5||EX===7)&&e<ar+30)half=Math.max(half,Q_TW*(1-(e-ar+8)/38));if((EX===6||EX===7)&&e>f1-Q_DD)half=Math.max(half,Q_DW*Math.min(1,(e-(f1-Q_DD))/Q_DD)+(EX===6||EX===7?0:0));if(EX===8&&e<ar+14)half=7}
    else{const notch=false;half=notch?13:(EX===4?-1e3:EX>=2?2.4:1.8);}
    if(e>=ar-3&&e<ar&&EX!==4&&EX<5)half=Math.max(half,EX>=2?2.4:1.8);
    const fr=Math.max(band,half-Math.abs(w));if(fr<v)v=fr;continue}
   if(pm>=3){const e=-u,C=22,ar=17,band=Math.abs(e-C)-wt;let half=e<0?ar:e<ar?Math.sqrt(ar*ar-e*e):(pm===4?2.2:-1e3);if(pm===4&&e>=ar-3)half=Math.max(half,2.2);const fr=Math.max(band,half-Math.abs(w));if(fr<v)v=fr;continue}
   const k=Math.min(1,Math.pow(Math.abs(u)/Math.max(1,wt),1.6)),half=pm===0?sl:pm===2?(Math.abs(u)<DW_H?Math.max(DW_H*Math.sqrt(Math.max(0,1-(u/DW_H)**2)),3):3+(sl-3)*k):Math.max(15,sl*(.3+.7*k));
   const fr=Math.max(Math.abs(u)-wt,half-Math.abs(w));if(fr<v)v=fr}
  return v}
 const SDS=4,SDW=Math.ceil(W/SDS)+1,SDH=Math.ceil(H/SDS)+1,SDG=new Float32Array(SDW*SDH);
 let SKIPD=null; /* v60 door opening: the raw field with one door's sealed back left out */
 /* v52 THIN WALLS (Sam Nov 3 8:12am: "when the nebula walls are really thin, like inside the board, the contrast is too hard to see it with from the night sky behind"): DM = the deepest point of the cloud within 64px (a max filter over the depth field), so a pixel knows how thick its wall is; thin walls get a dark core and close their wash (below). */
 const DM=new Float32Array(SDW*SDH);let DMok=false;function thinField(){const R=16,T=new Float32Array(SDW*SDH);for(let j=0;j<SDH;j++)for(let i=0;i<SDW;i++){let m=-1e9;for(let q=Math.max(0,i-R);q<=Math.min(SDW-1,i+R);q++){const v=-SDG[j*SDW+q];if(v>m)m=v}T[j*SDW+i]=m}
  for(let i=0;i<SDW;i++)for(let j=0;j<SDH;j++){let m=-1e9;for(let q=Math.max(0,j-R);q<=Math.min(SDH-1,j+R);q++){const v=T[q*SDW+i];if(v>m)m=v}DM[j*SDW+i]=m}}
 const GX=new Float32Array(SDW*SDH); /* Sam Nov 3 1:40pm: the minimum must hold EVERYWHERE, also a thin neck that joins thick wall. TT = the wall's own local ridge depth (max over WALL cells within 48px, so a neck reads as thin even next to a thick block); DEF = how much that wall cell is under the minimum; GX = DEF spread 40px (max filter), added to the depth so the thin part, and only it, grows out */
 function growField(){if(!WLM)return;const sq=(A,R,ok)=>{const T=new Float32Array(SDW*SDH),O=new Float32Array(SDW*SDH);for(let j=0;j<SDH;j++)for(let i=0;i<SDW;i++){let m=-1e9;for(let q=Math.max(0,i-R);q<=Math.min(SDW-1,i+R);q++){const v=A[j*SDW+q];if(v>m)m=v}T[j*SDW+i]=m}
   for(let i=0;i<SDW;i++)for(let j=0;j<SDH;j++){let m=-1e9;for(let q=Math.max(0,j-R);q<=Math.min(SDH-1,j+R);q++){const v=T[q*SDW+i];if(v>m)m=v}O[j*SDW+i]=m}return O};
  const DEP=new Float32Array(SDW*SDH);for(let k=0;k<DEP.length;k++)DEP[k]=-SDG[k]>0?-SDG[k]:-1e9;const TT=sq(DEP,12);
  const DEF=new Float32Array(SDW*SDH);for(let k=0;k<DEF.length;k++){const dd=-SDG[k];if(dd<=0){DEF[k]=0;continue}const t=TT[k];const a=clamp((t-12)/10,0,1);DEF[k]=clamp(WLM-t,0,30)*a*a*(3-2*a)}
  const G2=sq(DEF,10);for(let k=0;k<GX.length;k++)GX[k]=Math.max(0,G2[k]);
  /* v57 (tester 2:30pm Nov 3): the grown wall IS the wall. Growth stays GCLR px clear of every open square's centre (stars, gates, start keep their room), then it is folded into the wall field itself, so the lane cut (LMASK), clearance checks and path-finding all use the grown edge and nothing paints over it */
  const CEN=[];for(let r=0;r<NR;r++)for(let c=0;c<NC;c++)if(OPEN[r][c])CEN.push(G(c,r));const GCLR=52; /* a reached star's patch is PATCHR 50 */
  for(let j=0;j<SDH;j++)for(let i=0;i<SDW;i++){const k=j*SDW+i;if(GX[k]<=0)continue;const x=i*SDS,y=j*SDS;let dc=1e9;for(const q of CEN){const dd=Math.hypot(x-q[0],y-q[1]);if(dd<dc)dc=dd}GX[k]=Math.min(GX[k],Math.max(0,dc-GCLR));SDG[k]-=GX[k]}}
 function gxAt(x,y){return GX[clamp(Math.round(y/SDS),0,SDH-1)*SDW+clamp(Math.round(x/SDS),0,SDW-1)]}
 function dmAt(x,y){return DM[clamp(Math.round(y/SDS),0,SDH-1)*SDW+clamp(Math.round(x/SDS),0,SDW-1)]}
 function sdf(x,y){const fx=clamp(x/SDS,0,SDW-1.001),fy=clamp(y/SDS,0,SDH-1.001),i=fx|0,j=fy|0,u=fx-i,v=fy-j,k=j*SDW+i;return (SDG[k]*(1-u)+SDG[k+1]*u)*(1-v)+(SDG[k+SDW]*(1-u)+SDG[k+SDW+1]*u)*v}

 const RS=NEB===9&&NEBHI?1:2,w2=W/RS,h2=H/RS,art=mk(w2,h2),ax=art.getContext('2d'),im=ax.createImageData(w2,h2),D=im.data;const sm=(a,b,t)=>{t=clamp((t-a)/(b-a),0,1);return t*t*(3-2*t)},mix=(a,b,t)=>a+(b-a)*t;
 function artRow(j,i0,i1){const IMD=D;for(let i=i0||0;i<(i1===undefined?w2:i1);i++){const X=i*RS+RS/2,Y=j*RS+RS/2,k=(j*w2+i)*4;let d=-sdf(X,Y);let GROW=0;if(WLM&&DMok){GROW=gxAt(X,Y); /* only real walls: the gaps between open squares (dm under ~20) are not walls and must not grow into specks */ /* v57: GX is already folded into SDG (growField), so d holds the grown depth */} /* Sam Nov 3 1:33pm: MINIMUM WALL SIZE: a wall thinner than the minimum grows out to it; thick walls are unchanged */const k_=(j*w2+i)*4;if(d<(NB===2||NB>=4?-18:-3)){D[k+3]=0;continue}
   const mott=fbm(X*.006,Y*.006,3);let r,gg,b,a;
   if(NEB===5){a=sm(-1.6,1.6,d);const pool=1-sm(3,26,d),grain=.94+.12*vnz(X*.09,Y*.09,8),body=(.75+.5*mott)*grain;r=mix(30*body,4,pool*.9);gg=mix(22*body,3,pool*.9);b=mix(52*body,12,pool*.9)}
   else{ // v33 NEBULA E, lab v7.5 nebArt n===9 verbatim (Sam Nov 1 4:48pm: the nebula borders get the string's watercolour bleed):
      // E watercolor layers, painted with the SAME seep as the string (bleedColumn, Sam Nov 1 4:48pm): the border and each
      // layer's edge use the string's noisy edge (mottle m + grain n), its soft coverage ramp, its pigment pooled into a darker rim
      // inside the edge, and its grain; inner layers take the middle completely (outer density x .08 under them), so the layers only
      // mix in the thin wet edge. Outermost layer = the first wash; each darker layer lies inside it like a newer colour in the string.
      const ssw=sm;
      if(NB>=4){ /* 3b nebula round v2 (Sam Nov 2 5:12pm): C+D. The border SEEPS like the string (uneven blooms, thin grainy wash, darker tide line where the bloom stops), the star light tints it, and the layers mix wet into wet over a wide streaky band instead of stacking */
       const W2=NB===5;d-=W2?(WLF?-12:14):0; /* Sam 5:19pm: keep the wide seep off the track: the whole nebula sits 14 css px further out */const o2=(mott-.5)*22,mm2=fbm(X/26,Y/22,47),nn2=fbm(X/13,Y/13,41)*.65+vnz(X/1.6,Y/1.6,43)*.35,bl=fbm(X/34,Y/34,77),fing=fbm(X/11,Y/11,151)-.5;
       const e0=d+(mm2-.5)*10+(nn2-.5)*3, reach=Math.min(W2?Math.max(6,16-GROW*.5):99,(W2?8:6)+(W2?16:12)*bl*bl*1.6);  // how far this stretch of edge has bloomed out into the sky
       const cov0=ssw(-reach-1.5,-reach+1.5,e0), wet=1-ssw(-reach*.3,12,e0); // wet = the thin seeping part of the wash
       const tide0=0,tide=Math.exp(-Math.pow((e0+reach-2.5)/(1.6+1.2*nn2),2))*cov0; // pigment pooled at the bloom's outer limit
       let sr=0,sg=0,sb=0,ss=0;for(const st of STARS_){if(!st[3])continue;const dx=X-st[0],dy=Y-st[1],q2=Math.exp(-(dx*dx+dy*dy)/(2*100*100));sr+=st[3][0]*q2;sg+=st[3][1]*q2;sb+=st[3][2]*q2;ss+=q2}
       const lit=Math.min(1,ss*1.1)*(1-ssw(-4,(W2?46:34),d)); // star light seeps into the cloud edge and fades going in
       const PAL=(NI===7||NI===8)?(()=>{const wx=X+(fbm(X/160,Y/160,201)-.5)*(NI===8?260:120),wy=Y+(fbm(X/160,Y/160,203)-.5)*(NI===8?260:120);const sig=NI===8?26:38;let ws=[0,0,0,0,0,0],tot=0;let best=1e18;for(const sd of KSEED){const dx=wx-sd[0],dy=wy-sd[1];const q=dx*dx+dy*dy;if(q<best)best=q}for(const sd of KSEED){const dx=wx-sd[0],dy=wy-sd[1];const q=Math.exp(-(dx*dx+dy*dy-best)/(2*sig*sig*4));ws[sd[2]]+=q;tot+=q}return [0,1,2,3].map(L=>[0,1,2].map(ch=>{let v=0;for(let n=0;n<6;n++)v+=ws[n]*NK_[NI===8&&L===3?(n+2)%6:n][L][ch];return v/tot}))})():NI===4?[[150,92,50],[100,48,30],[36,18,18],[170,98,48]]:NI===5?[[96,124,144],[48,60,84],[22,20,36],[120,64,72]]:NI===6?[[176,128,86],[120,54,52],[34,20,42],[196,140,70]]:null;const L0=PAL?PAL[0]:[62,44,98],L1=PAL?PAL[1]:[30,32,78],L2=PAL?PAL[2]:[12,11,30];const MX=W2?34:22;
       const t1=ssw(-MX*.5,MX*.5,d-(20+o2)+fing*MX*1.5+(fbm(X/40,Y/40,62)-.5)*MX*.8), t2=ssw(-MX*.6,MX*.6,d-(52+o2*1.4)+fing*MX*1.3+(fbm(X/40,Y/40,63)-.5)*MX);
       let c=[0,1,2].map(i=>mix(mix(L0[i],L1[i],t1),L2[i],t2));
       if(PAL){const rd=1-Math.abs(2*fbm(X/70,Y/70,171)-1),fil=Math.pow(rd,5),rd2=1-Math.abs(2*fbm(X/28,Y/28,173)-1),bil=fbm(X/130,Y/130,181);const hk=Math.min(.85,(fil*.55+Math.pow(rd2,8)*.3+ssw(.45,.8,bil)*.35)*(.35+.65*t1));c=c.map((v,i)=>mix(v,PAL[3][i]*(.55+.45*(1-t2)),hk))} /* JWST-style: glowing filaments and billows through the dust */
       if(ss>0){const sc=[sr/ss*.8,sg/ss*.8,sb/ss*.8];const kk=lit*(.5+.25*fing+.25*nn2);c=c.map((v,i)=>mix(v,sc[i],kk*.8))}
       if(NI===9||NI===10||NI===11){ /* round 4 (Sam's 9 Webb references): six dust KINDS, each its own painting language */
         const rg=(x,y,sd)=>1-Math.abs(2*fbm(x,y,sd)-1);
         const fib=(sd)=>{const an=fbm(X/260,Y/260,sd)*9.4,cs=Math.cos(an),sn=Math.sin(an),u=X*cs+Y*sn,v=-X*sn+Y*cs;return fbm(u/80,v/3.2,sd+1)*.65+fbm(u/34,v/1.8,sd+2)*.35};
         const cauli=(sc,sd)=>{const b1=fbm(X/sc,Y/sc,sd),b2=fbm((X+4)/sc,(Y-5)/sc,sd);return [b1,clamp((b1-b2)*9+.5,0,1)]};
         const wx=X+(fbm(X/160,Y/160,201)-.5)*(NI===10?240:130),wy=Y+(fbm(X/160,Y/160,203)-.5)*(NI===10?240:130),sig=NI===10?44:34;
         let ws=[0,0,0,0,0,0],tot=0,best=1e18;for(const sd of KSEED){const dx=wx-sd[0],dy=wy-sd[1],q=dx*dx+dy*dy;if(q<best)best=q}
         for(const sd of KSEED){const dx=wx-sd[0],dy=wy-sd[1],q=Math.exp(-(dx*dx+dy*dy-best)/(2*sig*sig*4));ws[sd[2]]+=q;tot+=q}
         const ed=1-t1,core=t2;let acc=[0,0,0];
         for(let n=0;n<6;n++){const wn=ws[n]/tot;if(wn<.02)continue;let q;
          if(n===0){ // CRAB WEB: blue glowing body, peach and yellow filament net, green-gold outskirts
           const body=[mix(38,72,fbm(X/90,Y/90,301)),mix(64,112,fbm(X/90,Y/90,301)),mix(128,190,fbm(X/90,Y/90,301))];const f=Math.min(1,Math.pow(rg(X/60,Y/60,303),7)*1.1+Math.pow(rg(X/24,Y/24,305),10)*.7);
           const fc=[mix(236,190,ed),mix(164,196,ed),mix(128,84,ed)];q=body.map((v,i)=>mix(mix(v,[96,128,60][i],ed*.45),fc[i],f*.9))}
          else if(n===1){ // CLIFFS: rust billows with lit tops, umber shadows
           const [b,l0]=cauli(46,311),l=l0*.6;const base=[mix(52,156,b),mix(22,72,b),mix(16,36,b)];q=base.map((v,i)=>mix(v,[240,150,72][i],l*.55*(1-core*.6)));q=q.map((v,i)=>mix(v,[40,20,16][i],core*.55))}
          else if(n===2){ // RED VEIL: smooth crimson smoke, faint wisps
           const sm2=fbm(X/130,Y/130,321),w2=fib(323);q=[mix(64,128,sm2)+w2*40,mix(10,26,sm2)+w2*12,mix(20,30,sm2)+w2*10]}
          else if(n===3){ // COMBED GOLD: fibrous olive-gold streaks, hot pink-orange core
           const f=fib(331);q=[mix(78,206,f),mix(78,172,f),mix(26,82,f)];const hot=core*ssw(.4,.7,fbm(X/110,Y/110,333));q=q.map((v,i)=>mix(v,[236,130,112][i],hot*.8))}
          else if(n===4){ // CAVITY: fiery cauliflower rim at the lane, glowing pink and teal inside
           const [b,l]=cauli(30,341);const rim=[mix(150,244,l),mix(44,140,l),mix(30,64,l)];const t3=fbm(X/150,Y/150,343);const inner=[mix(196,96,t3),mix(84,164,t3),mix(150,186,t3)].map(v=>v*(.62+.25*b));const rz=ssw(.25,.75,ed+(b-.5)*.6);q=inner.map((v,i)=>mix(v,rim[i],rz))}
          else { // HAZE + DARK PILLAR: peach and blue haze, dark knots with orange lit rims
           const hz=fbm(X/140,Y/140,351);const haze=[mix(168,78,hz),mix(108,108,hz),mix(88,162,hz)];const kn=fbm(X/90,Y/90,353)+core*.25,k=ssw(.5,.72,kn)*.8,rim=Math.exp(-Math.pow((kn-.56)/.035,2));q=haze.map((v,i)=>mix(v,[14,12,20][i],k));q=q.map((v,i)=>mix(v,[244,140,60][i],rim*.7))}
          for(let i=0;i<3;i++)acc[i]+=wn*q[i]}
         {const lum=(acc[0]*.3+acc[1]*.55+acc[2]*.15);const QV=WLB?(1.05-.25*core):(NI===11?.64:.46)-.2*core;c=acc.map(v=>mix(lum,v,.72)*QV);
          /* Sam 5:23pm RULE: the nebula's colors come from the NOTES AROUND IT. The kind gives the texture and the light and dark; the hue is the nearby stars' colors (blended by distance), falling back to the violet ink far from any star */
          let hr=0,hg=0,hb=0,hs=0;for(const st of STARS_){if(!st[3])continue;const dx=X-st[0],dy=Y-st[1],q2=Math.exp(-(dx*dx+dy*dy)/(2*170*170));hr+=st[3][0]*q2;hg+=st[3][1]*q2;hb+=st[3][2]*q2;hs+=q2}
          const inf=Math.min(1,hs*1.3),hu=hs>0?[hr/hs,hg/hs,hb/hs]:[62,44,98],hv=[0,1,2].map(i=>mix(([62,44,98])[i],hu[i],inf)),hl=(hv[0]*.3+hv[1]*.55+hv[2]*.15)||1;
          const cl2=c[0]*.3+c[1]*.55+c[2]*.15;c=c.map((v,i)=>mix(v,cl2*hv[i]/hl,.78));} /* Sam 5:23pm: must still read as NEGATIVE SPACE, not clickable: low value, compressed contrast, a little desaturated, darker going in */if(ss>0){const sc=[sr/ss*.8,sg/ss*.8,sb/ss*.8];c=c.map((v,i)=>mix(v,sc[i],lit*.35))}}
       const kd=(1-.5*tide)*(1+wet*(nn2-.5)*.6)*(.9+.2*nn2)*(NI===1&&d>8?(()=>{const gr=vnz(X/2.6,Y/2.6,99),cl=fbm(X/24,Y/24,97);return .74+.42*gr*gr+.55*(cl-.5)})():1);
       const a2=cov0*(1-wet*(1-Math.min(1,.18+.5*nn2+2.2*tide)));
       let A2=a2;if(DMok&&THIN){const th=1-ssw(45,80,dmAt(X,Y));if(th>0){const cr=th*ssw(-5,7,d+(nn2-.5)*4);if(!WLB)c=c.map((v,i)=>mix(v,([10,9,24])[i]/Math.max(.5,kd),cr*.95));A2=mix(a2,1,cr)}}
       if(WLR){const rb=Math.exp(-Math.pow((d-(6+3*nn2))/(4.5+2*nn2),2))*cov0;const hv2=ss>0?[sr/ss,sg/ss,sb/ss]:[150,130,220];const pc=hv2.map(v=>mix(v,235,.45));const sw=Math.min(1,ss*1.1);c=c.map((v,i)=>mix(v,mix(175,pc[i],sw)/Math.max(.5,kd),rb*.85));A2=Math.max(A2,rb)} /* bright rim: a pale band in the nearby notes' color just inside every wall edge */ /* v52 thin walls: a near-black core (like a thick cloud's middle) and a closed wash; the coloured seep stays at the edge */
       IMD[k]=c[0]*kd;IMD[k+1]=c[1]*kd;IMD[k+2]=c[2]*kd;IMD[k+3]=clamp(A2*255,0,255);continue}
      const o=(mott-.5)*18,deep=DEEPOK&&d>=76+o*1.6 /* speed (game only): this deep inside the darkest layer every edge term below is saturated (cov 1, rim 0, fzN 0), so the edge noises cannot change the pixel; skip them (bit-identical) */,mm=deep?.5:fbm(X/26,Y/22,47),nn=fbm(X/13,Y/13,41)*.65+vnz(X/1.6,Y/1.6,43)*.35;
      const D=NB===1?[0,7+o*.3,34+o]:NB===2?[0,22+o,56+o*1.6]:[0,22+o,56+o*1.6],C=[[62,44,98],[30,32,78],[10,10,26]],cov=[0,0,0],rim=[0,0,0];
      if(NB===1)C[0]=[44,32,80];
      if(NB===3){let wr=0,wg=0,wb=0,ws=0;for(const st of STARS_){if(!st[3])continue;const dx=X-st[0],dy=Y-st[1],q2=Math.exp(-(dx*dx+dy*dy)/(2*95*95));wr+=st[3][0]*q2;wg+=st[3][1]*q2;wb+=st[3][2]*q2;ws+=q2}
        const kk=Math.min(1,ws*1.1)*(1-ssw(0,30,d))*.55;if(ws>0){C[0]=[mix(C[0][0],wr/ws*.75,kk),mix(C[0][1],wg/ws*.75,kk),mix(C[0][2],wb/ws*.75,kk)]}}
      if(NI===1){C[1]=[34,36,86];C[2]=[20,20,48]}
      if(NI===2){const hu=fbm(X/210,Y/210,5),hv=ssw(.38,.62,hu);C[1]=[mix(92,24,hv),mix(42,66,hv),mix(52,84,hv)];C[2]=[mix(32,10,hv),mix(14,26,hv),mix(22,36,hv)]}
      if(NI===3){const pv=fbm(X/90,Y/90,9);C[1]=[22,20,52];C[2]=[mix(36,88,pv),mix(30,74,pv),mix(76,160,pv)]}
      const blN=deep?0:fbm(X/34,Y/34,77),FN=deep?0:BOUT*1.9*(.12+1.7*blN*blN)*(.75+.5*fbm(X/9,Y/9,91));let fzN=0;   // lab v7.5 (Sam Nov 1 6:11pm, 6:25pm: it must seep like the string): the nebula border bleeds out into the sky like the string: uneven blooms, thinner grainy wash, tide line
      for(let q=0;q<3;q++){let e=d-D[q]+((mm-.5)*.56*18+(nn-.5)*3)*(q?1.25:1);if(!q){if(NB===2)e+=(fbm(X/55,Y/55,123)-.5)*26+(fbm(X/18,Y/18,131)-.5)*8;fzN=1-ssw(-1,2,e);e+=FN*(NB===2?2.6:NB===1?.6:1);}if(q&&!deep)e+=(fbm(X/40,Y/40,61+q)-.5)*MIXB*1.2;cov[q]=q?ssw(-MIXB*.45,MIXB*.55,e):ssw(-1.2,1.4,e);rim[q]=(1-ssw(q?1:.3,q?5:2.6,e))*cov[q];}
      if(NB===2){const bl=fbm(X/30,Y/30,141),e0=d+((mm-.5)*.56*18+(nn-.5)*3);cov[0]=ssw(-4-12*bl,22+10*bl,e0+FN*.4);rim[0]=0;fzN=0}let wsum=0;r=0;gg=0;b=0;for(let q=0;q<3;q++){let w=cov[q]*(.55+.35*ssw(0,20,d-D[q])+.55*rim[q])*(1+(nn-.5)*.9);for(let t=q+1;t<3;t++)w*=1-.92*ssw(.15,1,cov[t]);
        r+=w*C[q][0];gg+=w*C[q][1];b+=w*C[q][2];wsum+=w;}
      a=cov[0]*(1-fzN*(1-Math.min(1,.12+.45*nn+1.7*rim[0]))); /* feather: a thin grainy wash the sky shows through, closed by a darker tide line */ if(wsum>0){r/=wsum;gg/=wsum;b/=wsum;}const top=cov[2]>.5?2:cov[1]>.5?1:0;let k2=(1-(NB===1&&top===0?.62:NB===2&&top===0?.55:.42)*rim[top]-(top?0:.5*rim[0]*fzN))*(1+fzN*(nn-.5)*.5)*(.92+.16*nn);if(NI===1&&d>8){const gr=vnz(X/2.6,Y/2.6,99),cl=fbm(X/24,Y/24,97);k2*=.74+.42*gr*gr+.55*(cl-.5)}if(NI===3&&d>8){k2*=.85+.3*vnz(X/2,Y/2,98)}r*=k2;gg*=k2;b*=k2;}
   D[k]=r;D[k+1]=gg;D[k+2]=b;D[k+3]=clamp(a*255,0,255)}}
 /* v60 DOOR OPENING (W-S0, Sam 6:15pm tentative lock; handoff-gates: "the sealed back should part"): for each door, the same art
    painted again with that door's sealed back left out (the lane runs on through), baked ahead in slices. make() blends the
    sealed art into it behind a soft, uneven front when the door takes you, so the opening is the nebula's own watercolour. */
 const DOORP=DWALL.map(dw=>{const [gx,gy,ux,uy]=dw;if(ux||!uy)return null;const x0=gx-92,x1=gx+92,y0=gy-100,y1=gy+DY1;
   const gi0=Math.max(0,Math.floor(x0/SDS)),gi1=Math.min(SDW-1,Math.ceil(x1/SDS)),gj0=Math.max(0,Math.floor(y0/SDS)),gj1=Math.min(SDH-1,Math.ceil(y1/SDS));
   const ai0=Math.max(0,Math.floor(x0/RS)),ai1=Math.min(w2,Math.ceil(x1/RS)),aj0=Math.max(0,Math.floor(y0/RS)),aj1=Math.min(h2,Math.ceil(y1/RS)),aw=ai1-ai0,ah=aj1-aj0;
   return {dw,gx,gy,gi0,gi1,gj0,gj1,ai0,aj0,aw,ah,openV:null,sealV:null,sealA:null,openA:null,row:-1,done:false}});
 function doorJob(P){return {get done(){return P.done},step(ms){const t0=performance.now();if(!B.artDone)B.step(1e9);
   if(!P.openV){const n=(P.gi1-P.gi0+1)*(P.gj1-P.gj0+1);P.openV=new Float32Array(n);P.sealV=new Float32Array(n);SKIPD=P.dw;let q=0;
     for(let j=P.gj0;j<=P.gj1;j++)for(let i=P.gi0;i<=P.gi1;i++,q++){const k=j*SDW+i;P.sealV[q]=SDG[k];const e=P.gy-j*SDS,o=Math.max(SDG[k],sdfRaw(i*SDS,j*SDS)-GX[k]),f=SPL?1:e<=6?0:e>=24?1:((e-6)/18)**2*(3-2*(e-6)/18);P.openV[q]=SDG[k]+(o-SDG[k])*f} /* only the sealed back opens: the funnel and the star's round end stay as they are */SKIPD=null;
     P.sealA=new Uint8ClampedArray(P.aw*P.ah*4);for(let j=0;j<P.ah;j++)for(let i=0;i<P.aw;i++){const a=((P.aj0+j)*w2+P.ai0+i)*4,b=(j*P.aw+i)*4;for(let c=0;c<4;c++)P.sealA[b+c]=D[a+c]}
     P.openA=new Uint8ClampedArray(P.sealA);P.row=0}
   const swap=v=>{let q=0;for(let j=P.gj0;j<=P.gj1;j++)for(let i=P.gi0;i<=P.gi1;i++,q++)SDG[j*SDW+i]=v[q]};swap(P.openV);
   try{while(P.row<P.ah){const j=P.aj0+P.row;artRow(j,P.ai0,P.ai0+P.aw);for(let i=0;i<P.aw;i++){const a=(j*w2+P.ai0+i)*4,b=(P.row*P.aw+i)*4;for(let c=0;c<4;c++){P.openA[b+c]=D[a+c];D[a+c]=P.sealA[b+c]}}P.row++;if(performance.now()-t0>ms)break}}
   finally{swap(P.sealV)}if(P.row>=P.ah)P.done=true;return P.done}}}
 let j1=0,j2=0,j3=0;const LMS=2,LMW=Math.ceil(W/LMS),LMH=Math.ceil(H/LMS),lmA=ELW?new Uint8ClampedArray(LMW*LMH):null; /* 3b gates (tester s179 A, the swap hold): the lane cut's alpha is baked here with the sky (worker or idle slices), not in Look.make on the swap frame (~17ms) */
 const LGJ=lifeJob(o.stars);
 const B={SDG,sdf,art,im,done:false,artDone:false,DOORP,doorJob,SDW,lmA,lmW:LMW,LGJ,
  step(ms){const t0=performance.now();while(j1<SDH){for(let i=0;i<SDW;i++)SDG[j1*SDW+i]=sdfRaw(i*SDS,j1*SDS);j1++;if(performance.now()-t0>ms)return false}
   if(j2===0&&!DMok){thinField();growField();DMok=true}
   while(j2<h2){artRow(j2);j2++;if(performance.now()-t0>ms)return false}
   if(!B.artDone){ax.putImageData(im,0,0);B.artDone=true}
   for(const P of DOORP)if(P&&!P.done){doorJob(P).step(Math.max(.5,ms-(performance.now()-t0)));if(!P.done||performance.now()-t0>ms)return false} /* v60c (Sam 7:49pm 'jank when i hit the gate, frozen on the color'): every door's open lane is baked with the sky, ahead of play, never at the door */
   if(!LGJ.step(sdf,t0,ms))return false;
   if(lmA)while(j3<LMH){const o=j3*LMW;for(let i=0;i<LMW;i++)lmA[o+i]=255*clamp((sdf(i*LMS+LMS/2,j3*LMS+LMS/2)-3)/2,0,1);j3++;if(performance.now()-t0>ms)return false}
   B.done=true;return true}};
 return B}

// ---------------------------------------------------------------- one level's sky ----------------------------------------------------
// o: {rows: token rows ('@' = nebula), G(c,r) -> [x,y] screen centre of a square, flip (true = the climb goes up the screen),
//     lead: [x0,y0,x1,y1] the lane the light comes in by (start square to past the rim), stars: [[x,y,r]] (for motion only)}
function make(o){
 let seed=11;const R=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
 const G=o.G,NR=o.rows.length,NC=o.rows[0].length,flip=o.flip!==false,stars=o.stars||[];
 const OPEN=o.rows.map(r=>r.map(t=>t!=='@'));
 const [cx00,cy00]=G(0,0),HX=Math.abs(G(1,0)[0]-cx00)/2,HY=Math.abs(G(0,1)[1]-cy00)/2;
 const pw=o.pre||prep(o);if(!pw.done)pw.step(1e9); /* v60e (Sam's iPhone log: 2.9s and 7.2s frozen frames at board changes): a half-baked sky is finished, never thrown away and baked again from zero */const {SDG,sdf}=pw;
 const wallF=(x,y)=>clamp((sdf(x,y)+4)/26,0,1);
 // nebula blocks (greedy rectangles over '@' squares): homes for the billows and the watchers
 const holes=(()=>{const used=OPEN.map(r=>r.map(()=>0)),out=[];const box=(c,r)=>{const [x,y]=G(c,r);return [x-HX,y-HY,x+HX,y+HY]};
  for(let r=0;r<NR;r++)for(let c=0;c<NC;c++){if(OPEN[r][c]||used[r][c])continue;let c2=c;while(c2+1<NC&&!OPEN[r][c2+1]&&!used[r][c2+1])c2++;let r2=r;outer:while(r2+1<NR){for(let k=c;k<=c2;k++)if(OPEN[r2+1][k]||used[r2+1][k])break outer;r2++}
   for(let a=r;a<=r2;a++)for(let b=c;b<=c2;b++)used[a][b]=1;const A=box(c,r),B=box(c2,r2);let x0=Math.min(A[0],B[0]),y0=Math.min(A[1],B[1]),x1=Math.max(A[2],B[2]),y1=Math.max(A[3],B[3]);
   if(c===0)x0=0;if(c2===NC-1)x1=W;if(y0<=Math.min(cy00,G(0,NR-1)[1])-HY+1)y0=0;if(y1>=Math.max(cy00,G(0,NR-1)[1])+HY-1)y1=H;out.push({a:x0,b:y0,w:x1-x0,h:y1-y0})}return out})();
 // ---- life: light spreads from the string by the medium's rules; the nebula blocks it (W2 runs: gravity pulls it down in drips that pool on the nebula)
 const LC=10,LW=Math.ceil(W/LC)+1,LH=Math.ceil(H/LC)+1,LIFE=new Float32Array(LW*LH),FLOOR=new Float32Array(LW*LH),LTMP=new Float32Array(LW*LH),BLK=new Uint8Array(LW*LH),GRAIN=new Float32Array(LW*LH),STN=new Float32Array(LW*LH);
 {const J=pw.LGJ&&pw.LGJ.j>=pw.LGJ.LH&&pw.LGJ.LW===LW?pw.LGJ:lifeJob(stars);if(J.j<J.LH)J.step(sdf);BLK.set(J.BLK);GRAIN.set(J.GRAIN);STN.set(J.STN)} /* 3b gates (tester s179 A): baked with the sky now (it was ~45% of Look.make on the swap frame) */
 const li=(x,y)=>clamp(Math.round(y/LC),0,LH-1)*LW+clamp(Math.round(x/LC),0,LW-1);
 const lifeAt=(x,y)=>LIFE[li(x,y)],starNear=(x,y)=>STN[li(x,y)];
 function stamp(x,y,rad,amt){const i0=Math.floor((x-rad)/LC),i1=Math.ceil((x+rad)/LC),j0=Math.floor((y-rad)/LC),j1=Math.ceil((y+rad)/LC);
  for(let j=Math.max(0,j0);j<=Math.min(LH-1,j1);j++)for(let i=Math.max(0,i0);i<=Math.min(LW-1,i1);i++){const d=Math.hypot(i*LC-x,j*LC-y),v=amt*Math.exp(-((d/(rad*.55))**2)),k=j*LW+i;if(v>LIFE[k])LIFE[k]=v;if(v*.45>FLOOR[k])FLOOR[k]=v*.45}}
 function spreadStep(){const L=LIFE,N=LTMP;N.set(L);const TH=.16;
  for(let j=1;j<LH-1;j++)for(let i=1;i<LW-1;i++){const k=j*LW+i;if(BLK[k]){N[k]=0;continue}let v=L[k];const up=L[k-LW],dn=L[k+LW],lf=L[k-1],rt=L[k+1];
   v=Math.max(v,up*(.975+.02*GRAIN[k]),Math.max(lf,rt)*.84,dn*.7);N[k]=v<TH&&L[k]<TH?L[k]:v}
  LIFE.set(N);for(let k=0;k<LIFE.length;k++){if(BLK[k]){LIFE[k]=0;FLOOR[k]=0}else if(LIFE[k]*.5>FLOOR[k])FLOOR[k]=LIFE[k]*.5}}
 // ---- what the game tells us
 let play=0,head=o.lead?[o.lead[0],o.lead[1]]:[W/2,H/2],T=0,DT=16,FRN=0,SACC=0,BOOST=0,dawn=0;
 let fogY=null,wake=0,wakeT=0,pend;
 function setFog(y){if(fogY===null&&pend===undefined&&!FRN){fogY=y;wake=0;wakeT=0;return}
  const target=pend!==undefined?pend:fogY;if(y===target)return;
  const more=y!==null&&(fogY===null||(flip?y>fogY:y<fogY));
  if(more){fogY=y;pend=undefined;wake=Math.min(wake,1);wakeT=0}else{pend=y;wakeT=1}}
 let HG=[],HUSH=0,HUSHt=0; /* v31: hint glows [x,y,r,amt] (amt<0 slows and dims) and Hush (0..1), told by the game through frame() */
 function hintAt(x,y){let h=0;for(const q of HG){const dx=x-q[0],dy=y-q[1],r2=q[2]*q[2],d2=dx*dx+dy*dy;if(d2<r2*4)h+=q[3]*Math.exp(-d2/r2)}return h}
 const asleep=(x,y)=>fogY===null?0:(1-wake)/(1+Math.exp((flip?y-fogY:fogY-y)/50));
 function speed(x,y){const z=asleep(x,y),act=Math.max(lifeAt(x,y)*.95,starNear(x,y)*.45);let s=.09+(.28-.09)*act;
  if(play>0){const dp=Math.exp(-((Math.hypot(x-head[0],y-head[1])/230)**2));s=s+(.42-s)*play*Math.max(act,dp)*.9}
  if(HG.length){const h=hintAt(x,y);s=s*(1+1.8*Math.max(0,h))*(1-.75*Math.max(0,-h))}return (z*.025+(1-z)*s)*(1-.82*HUSH)}
 // ---- star trails: each one an arc round a pivot far above the screen (below it when the climb runs down)
 const PX=W/2,PY=flip?-1300:H+1300;
 function spawn(p,born){let x,y,t=0;do{x=R()*W;y=R()*H;t++;if(born||R()<speed(x,y)/.45)break}while(t<80);
  p.x=x;p.y=y;p.life=40+R()*60;p.age=born?R()*p.life:0;p.c=R();p.seed=Math.floor(R()*1e6);p.warm=starNear(x,y);p.pk=-1;p.die=0}
 const P=[];for(let i=0;i<3200;i++){const p={};spawn(p,true);P.push(p)}
 const SKYOLD=/[?&]sky=old\b/.test(location.search),CONOLD=/[?&]con=old\b/.test(location.search), /* v53 CONTRAST PASS (Sam 9:24am "please do a pass on contrast"): asleep beads 94% of their colour (were 58%; asleep still reads smaller, no shine, no glow), the blue end of the ramp lighter; ?con=old = before */SKY0=SKYOLD?'#141e62':'#0f1742',SKY1=SKYOLD?'#0c1444':'#070a24'; /* v53 (Sam Nov 3 9:24am: "background should be closer to a navy/black"; the blue notes were too close to the old royal navy) */
 const SCV=mk(W/2,H/2),scx=SCV.getContext('2d');const BGG=(()=>{const gr=scx.createLinearGradient(0,0,0,H);gr.addColorStop(0,SKY0);gr.addColorStop(1,SKY1);return gr})();
 function bitCol(p,L){const b0=[255,232,182],g0=[92,98,128],f=.25+.75*L;return Math.round(g0[0]+(b0[0]-g0[0])*f)+','+Math.round(g0[1]+(b0[1]-g0[1])*f)+','+Math.round(g0[2]+(b0[2]-g0[2])*f)}
 // v31 speed-up: every trail segment and dot is queued by (colour step, alpha step, width step) and each queue is stroked once, so a
 // frame makes ~100 canvas calls instead of ~15,000 (tester: v30 ran at 30fps). Colour 9 steps, alpha 1/16, width 1/4px: no visible change.
 const TCOL=Array.from({length:9},(_,i)=>bitCol(null,i/8)),SQ=new Map(),DQ=new Map(),SQ2=new Map(),DQ2=new Map(),qget=(M,k)=>{let a=M.get(k);if(!a){a=[];M.set(k,a)}return a};
 function drawTrails(dt,tg,to){const g=tg||scx;for(const M of [SQ,DQ,SQ2,DQ2])for(const a of M.values())a.length=0; /* to: lab v7.9 sky streaks Mix (Sam locked 7:54pm): odd-seed trails go to an overlay drawn over the string */if(!tg)g.setTransform(.5,0,0,.5,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
  g.fillStyle=tg?(tg.__bgg||(tg.__bgg=(()=>{const gr=tg.createLinearGradient(0,0,0,H);gr.addColorStop(0,SKY0);gr.addColorStop(1,SKY1);return gr})())):BGG;g.fillRect(0,0,W,H);g.lineCap='round';g.lineJoin='round';
  const NP=Math.min(P.length,Math.round(Look.DENS*1.45));
  for(let pi=0;pi<NP;pi++){const p=P[pi];const s=speed(p.x,p.y),z=asleep(p.x,p.y);const mv=dt*.06*s*(reduce?.4:1);p.age+=mv*.12*9;
   if(p.age>p.life){spawn(p,false);continue}
   if(!p.die&&(p.x<40||p.x>W-40||p.y<40||p.y>H-40))p.die=1;
   const D=p.seed&2?-1:1; /* v36 (Sam Nov 2 5:43am "background star trails moving in both directions"; 3b lab v8.9 DIR, decoupled 6:14am): seed bit 2 picks the direction, bit 1 still picks over/under the string */
   if(p.die){p.die-=dt*.0018;if(p.die<=0){if((D>0?p.x>W/2:p.x<W/2)&&p.y>40&&p.y<H-40){p.x=D>0?42+R()*30:W-42-R()*30;p.age=0;p.pk=-1}else spawn(p,false);p.die=0;continue}}
   const fade=clamp(Math.min(p.age/8,(p.life-p.age)/8),0,1),vig=play*Math.exp(-((Math.hypot(p.x-head[0],p.y-head[1])/230)**2));
   const hh=HG.length?hintAt(p.x,p.y):0,hp=Math.max(0,hh),LV=Math.min(1,lifeAt(p.x,p.y)*1.2+hp),AL=(p.die?p.die:1)*fade*(1-z*.45)*(1+vig*.4)*(.32+.68*LV)*(1-.5*HUSH)*(1-.45*Math.max(0,-hh));
   const ci=Math.round(8*Math.min(1,lifeAt(p.x,p.y)*1.15+hp));
   if(p.pk!==p.seed){p.pk=p.seed;p.pr=Math.max(40,Math.hypot(p.x-PX,p.y-PY));p.pa=Math.atan2(p.y-PY,p.x-PX)}
   p.pa-=dt*s*.0009*(300/p.pr)*(flip?1:-1)*D;p.x=PX+Math.cos(p.pa)*p.pr;p.y=PY+Math.sin(p.pa)*p.pr;
   if(wallF(p.x,p.y)<.01){const ta=p.pa+(flip?1:-1)*D*140/p.pr;if(wallF(PX+Math.cos(ta)*p.pr,PY+Math.sin(ta)*p.pr)<.01)continue}
   const len=(50+p.c*90)/p.pr*(flip?1:-1)*D,wi=Math.round((.9+p.warm+.9*hp)*4),A=Math.min(1,AL*1.1),ov=to&&(p.seed&1)&&(onMap(p.x,p.y)||onMap(PX+Math.cos(p.pa+len*.5)*p.pr,PY+Math.sin(p.pa+len*.5)*p.pr)||onMap(PX+Math.cos(p.pa+len)*p.pr,PY+Math.sin(p.pa+len)*p.pr)); /* v35: one look per streak (head, middle, tail) */
   for(let q=0;q<6;q++){const a0=p.pa+len*q/6,a1=p.pa+len*(q+1)/6,am=(a0+a1)/2;const al=A*(1-q/6)*wallF(PX+Math.cos(am)*p.pr,PY+Math.sin(am)*p.pr);if(al<.004)continue;
    const ai=Math.max(1,Math.round(al*16)),Q=qget(ov?SQ2:SQ,(ci*17+ai)*16+wi);if(a0<a1)Q.push(p.pr,a0,a1);else Q.push(p.pr,a1,a0)}
   const ad=A*wallF(p.x,p.y);if(ad>.004)qget(ov?DQ2:DQ,ci*17+Math.max(1,Math.round(ad*16))).push(p.x,p.y,1+p.c*1.1+p.warm)}
  trFlush(g,SQ,DQ)} /* the odd-seed trails stay batched in SQ2/DQ2 until the game calls look.over(ctx) over the string */
 /* v35 speed: a streak that runs over the paint only looks different where there is paint under it, so only the pieces within the
    paint map's reach (53px of the string) are drawn over the string; the rest stay in the half-res sky with the others */
 const onMap=(x,y)=>{const xi=x|0,yi=y|0;return xi>=0&&yi>=0&&xi<W&&yi<H&&OWN[yi*W+xi]>=0};
 function trFlush(g,SQ,DQ){
  for(const [k,Q] of SQ){if(!Q.length)continue;const wi=k%16,ai=((k-wi)/16)%17,ci=Math.floor(k/16/17);g.strokeStyle=`rgba(${TCOL[ci]},${ai/16})`;g.lineWidth=wi/4;g.beginPath();
   for(let i=0;i<Q.length;i+=3){const r=Q[i],a=Q[i+1];g.moveTo(PX+Math.cos(a)*r,PY+Math.sin(a)*r);g.arc(PX,PY,r,a,Q[i+2])}g.stroke()}
  for(const [k,Q] of DQ){if(!Q.length)continue;const ai=k%17,ci=(k-ai)/17;g.fillStyle=`rgba(${TCOL[ci]},${ai/16})`;g.beginPath();
   for(let i=0;i<Q.length;i+=3){g.moveTo(Q[i]+Q[i+2],Q[i+1]);g.arc(Q[i],Q[i+1],Q[i+2],0,7)}g.fill()}}
 // ---- the nebula: 3b's pooled ink (look A), painted once per board from the corridor distance field at half resolution
 const ART=pw.art;
 let nsd=5;const NRr=()=>{nsd=(nsd*16807)%2147483647;return nsd/2147483647};
 const PUFF=[];holes.forEach(hh=>{const n=Math.round(hh.w*hh.h/4500)+4;for(let k=0;k<n;k++)PUFF.push({x:hh.a+NRr()*hh.w,y:hh.b+NRr()*hh.h,r:40+NRr()*60,ph:NRr()*6,p:0,c:['34,22,52','24,16,40','46,30,60','18,14,34'][k%4]})});
 while(PUFF.length>130)PUFF.splice(Math.floor(NRr()*PUFF.length),1);
 const NRS=NEB===9&&NEBHI?1:2;let OFF=null,ox=null,offN=-1,lastNL=null; // lab v7.5: nebula E at full resolution (grain and tide line as crisp as the string's)
 // v33: with nebula E the game gives the nebula its own full-res layer (nl, a W x H canvas between the half-res sky and the board), so
 // it is repainted only when its billows move (every 3rd frame) and never resampled into the half-res sky; without one (look A, or a
 // caller that has no layer) it is drawn into the sky as before
 function puffs(X,still){for(const q of PUFF){const s=speed(q.x,q.y);if(!still)q.p+=DT*3*s;const br=1+.12*Math.sin(q.p*.0016+q.ph),xx=q.x+Math.sin(q.p*.0009+q.ph)*14,yy=q.y+Math.cos(q.p*.0007+q.ph)*10,rr=q.r*br;X.drawImage(puffSprite(q.c),xx-rr,yy-rr,2*rr,2*rr)}}
 // v35 speed (tester 7:00pm): with a layer (nebula E) the full-res nebula is painted ONCE per board, and its slow billows (motion =
 // life) are painted every 3rd frame at half res into BIL, masked to the ink (destination-in with a half-res copy of the art), and laid
 // over it from the half-res overlay. Repainting the full-res nebula every 3rd frame cost as much as the whole watercolour string.
 let BIL=null,BX=null,ARTH=null;const NDIRTY=[];
 function drawNebula(g,nl,ov){doorAnim();if(!nl&&!OFF){OFF=mk(W/NRS,H/NRS);ox=OFF.getContext('2d')}
  if(nl){if(offN<0||nl!==lastNL){offN=FRN;lastNL=nl;nl.setTransform(1,0,0,1,0,0);nl.globalCompositeOperation='source-over';nl.globalAlpha=1;nl.clearRect(0,0,nl.canvas.width,nl.canvas.height);nl.drawImage(ART,0,0,nl.canvas.width,nl.canvas.height);NDIRTY.length=0}
   else if(NDIRTY.length){const kx=nl.canvas.width/ART.width,ky=nl.canvas.height/ART.height;nl.setTransform(1,0,0,1,0,0);nl.globalCompositeOperation='source-over';nl.globalAlpha=1;for(const [x,y,w,h] of NDIRTY){nl.clearRect(x*kx,y*ky,w*kx,h*ky);nl.drawImage(ART,x,y,w,h,x*kx,y*ky,w*kx,h*ky)}NDIRTY.length=0}
   if(!BIL){BIL=mk(W/2,H/2);BX=BIL.getContext('2d');ARTH=mk(W/2,H/2);ARTH.getContext('2d').drawImage(ART,0,0,W/2,H/2);BIL.fc=-1}
   if(BILX)return;if(BIL.fc<0||FRN%3===0){BIL.fc=FRN;BX.setTransform(1,0,0,1,0,0);BX.globalCompositeOperation='source-over';BX.globalAlpha=1;BX.clearRect(0,0,W/2,H/2);
    BX.setTransform(.5,0,0,.5,0,0);BX.globalAlpha=NEB===5?.55:.35;puffs(BX);BX.setTransform(1,0,0,1,0,0);BX.globalAlpha=1;BX.globalCompositeOperation='destination-in';BX.drawImage(ARTH,0,0);BX.globalCompositeOperation='source-over'}
   if(ov){ov.globalAlpha=1;ov.drawImage(BIL,0,0,W,H)}return}
  if(!(FRN%3===0||offN<0)&&NDIRTY.length){const kx=OFF.width/ART.width,ky=OFF.height/ART.height;for(const [x,y,w,h] of NDIRTY){const X=Math.floor(x*kx)-1,Y=Math.floor(y*ky)-1,Wd=Math.ceil(w*kx)+2,Hd=Math.ceil(h*ky)+2;ox.save();ox.setTransform(1,0,0,1,0,0);ox.beginPath();ox.rect(X,Y,Wd,Hd);ox.clip();ox.globalCompositeOperation='source-over';ox.globalAlpha=1;ox.clearRect(X,Y,Wd,Hd);ox.drawImage(ART,0,0,OFF.width,OFF.height);ox.setTransform(OFF.width/W,0,0,OFF.height/H,0,0);ox.globalCompositeOperation='source-atop';ox.globalAlpha=NEB===5?.55:.35;puffs(ox,1);ox.restore()}NDIRTY.length=0} /* v60p (tester s177 item 3): between the every-3rd-frame repaints, an opening door repaints only its own box of the nebula, not the whole sky every frame */
  if(FRN%3===0||offN<0){offN=FRN;NDIRTY.length=0;ox.setTransform(1,0,0,1,0,0);ox.globalCompositeOperation='source-over';ox.globalAlpha=1;ox.clearRect(0,0,OFF.width,OFF.height);ox.drawImage(ART,0,0,OFF.width,OFF.height);
   ox.setTransform(OFF.width/W,0,0,OFF.height/H,0,0);ox.globalCompositeOperation='source-atop';ox.globalAlpha=NEB===5?.55:.35; // slow billows inside the ink (motion = life), only where the ink is
   puffs(ox);ox.globalAlpha=1;ox.globalCompositeOperation='source-over';ox.setTransform(1,0,0,1,0,0)}
  g.drawImage(OFF,0,0,W,H)}
 const WAT=holes.slice().sort(NW===3?(a,b)=>Math.min(b.w,b.h)-Math.min(a.w,a.h):(a,b)=>b.w*b.h-a.w*a.h).filter(hh=>Math.min(hh.w,hh.h)>150).slice(0,/[?&]watchers=1\b/.test(location.search)?(NW===3?2:4):0) /* v52 (Sam Nov 3 8:11am): watchers HIDDEN until the recital details are worked out; ?watchers=1 brings them back */.map((hh,i)=>({h:hh,f:FN[i%FN.length],x:hh.a+hh.w/2,y:hh.b+hh.h/2,tx:hh.a+hh.w/2,ty:hh.b+hh.h/2,t:0,face:1,ph:R()*6,sc:NW===3?Math.min(1.9,Math.min(hh.w,hh.h)/130):Math.min(1.15,Math.min(hh.w,hh.h)/120)}));
 function drawWatchers(g,mul){const [fx,fy]=head;
  for(const w of WAT){const hh=w.h,z=asleep(w.x,w.y),s=speed(w.x,w.y),F=FIG[w.f],sc=w.sc;
   w.t-=s*DT*.08;if(w.t<=0){w.tx=hh.a+hh.w*(.3+.4*R());w.ty=hh.b+hh.h*(.3+.4*R());w.t=80+R()*140}
   let tx=w.tx,ty=w.ty;const lean=.12+.12*play;tx+=(clamp(fx,hh.a+55*sc,hh.a+hh.w-55*sc)-tx)*lean;ty+=(clamp(fy,hh.b+45*sc,hh.b+hh.h-45*sc)-ty)*lean;
   const k=Math.min(1,(.00012+.0013*s)*DT)*(1-z*.85);w.x+=(tx-w.x)*k;w.y+=(ty-w.y)*k;
   const want=fx>=w.x?1:-1;w.face+=(want-w.face)*Math.min(1,(.001+.003*s)*DT);
   w.tp=(w.tp||0)+DT*.001*(.3+s*2.2);const t=w.tp+w.ph,vig=(1-z)*(.5+play*.8);
   const Pp=F.P.map(p=>[p[0],p[1]]);F.anim(Pp,t,vig);const ang=Math.atan2(fy-w.y,(fx-w.x)*w.face)*.15;
   const Q=Pp.map(([x,y])=>{const rx=x*Math.cos(ang)-y*Math.sin(ang),ry=x*Math.sin(ang)+y*Math.cos(ang);return [w.x+rx*sc*w.face,w.y+ry*sc+Math.sin(t*.7)*2]});
   const al=.75*(1-z*.6)*mul;const ed=()=>{g.beginPath();for(const [i,j] of F.E){g.moveTo(Q[i][0],Q[i][1]);g.lineTo(Q[j][0],Q[j][1])}g.stroke()};g.lineCap='round';g.lineJoin='round';
   if(NW===1){g.globalAlpha=Math.min(1,al*1.3);g.strokeStyle='#d6b061';g.lineWidth=1.4;g.setLineDash([5,4]);ed();g.setLineDash([]);Q.forEach(([x,y],i)=>{const r=i===0||i===2?2.4:1.6;g.globalAlpha=Math.min(1,al*1.4);g.fillStyle='#e2bf72';g.beginPath();g.arc(x,y,r,0,7);g.fill();g.globalAlpha=al*.7;g.strokeStyle='#d8b46a';g.lineWidth=.8;g.beginPath();g.arc(x,y,r+2.6,0,7);g.stroke()})}
   else if(NW===2||NW===3){const big=NW===3;g.globalAlpha=al*(big?.16:.13);g.strokeStyle='#8e7fd6';g.lineWidth=(big?34:24)*sc;ed();g.globalAlpha=al*(big?.14:.1);g.lineWidth=(big?16:11)*sc;ed();
     g.globalAlpha=al*(big?.6:.5);g.strokeStyle='#b8acef';g.lineWidth=big?1.8:1.3;ed();Q.forEach(([x,y],i)=>{const r=(i===0||i===2?2.6:1.9)*(big?1.3:1);g.globalAlpha=al*.25;g.fillStyle='#a99be8';g.beginPath();g.arc(x,y,r*3,0,7);g.fill();g.globalAlpha=al*.9;g.fillStyle='#cfc4ff';g.beginPath();g.arc(x,y,r,0,7);g.fill()})}
   else{g.globalAlpha=al*.55;g.strokeStyle='#e8ecff';g.lineWidth=1.4;ed();
   Q.forEach(([x,y],i)=>{const r=i===0||i===2?2.6:1.9;g.globalAlpha=al*.3;g.fillStyle='#f2f4ff';g.beginPath();g.arc(x,y,r*3,0,7);g.fill();g.globalAlpha=al;g.beginPath();g.arc(x,y,r,0,7);g.fill()})}}
  g.globalAlpha=1}
 // ---- per frame
 const L={sdf,wallF,stamp,lifeAt,speed,asleep,setFog,holes,
  get play(){return play},get T(){return T},
  boost(){BOOST=4},
  /* 3b gates (tester s179 A, the swap hold): the nebula layer's first full paint, called by the game in a frame of its own while the new board is still invisible, so its first sky frame doesn't also pay for it */
  prime(LL){if(!LL||!LL.nb)return;const nl=LL.nb;offN=FRN;lastNL=nl;nl.setTransform(1,0,0,1,0,0);nl.globalCompositeOperation='source-over';nl.globalAlpha=1;nl.clearRect(0,0,nl.canvas.width,nl.canvas.height);nl.drawImage(ART,0,0,nl.canvas.width,nl.canvas.height);NDIRTY.length=0;
   if(!BIL){BIL=mk(W/2,H/2);BX=BIL.getContext('2d');ARTH=mk(W/2,H/2);ARTH.getContext('2d').drawImage(ART,0,0,W/2,H/2);BIL.fc=-1}},
  // lab v7.9 sky streaks Mix (Sam locked 7:54pm): the trails that run OVER the string, drawn by the game straight onto its board canvas after the paint
  over(g){g.save();g.globalAlpha=1;g.globalCompositeOperation='source-over';g.lineCap='round';g.lineJoin='round';trFlush(g,SQ2,DQ2);g.restore()},
  frame(dt,st){FEMA+=(Math.min(60,dt)-FEMA)*.1;Look.fdt=Math.min(50,dt);Look.budK=FEMA>19?.25:FEMA>17.5?.6:1; /* v35: a device already missing frames gives the older wet columns less time (they just dry in coarser steps) */dt=Math.min(50,dt);DT=dt;FRN++;T+=dt*(reduce?.3:1);if(JOBQ.length)bakeAhead(st&&st.drag?1:FEMA<18?5:3);
   play+=((st.drag?1:0)-play)*Math.min(1,dt*.0013);if(st.head)head=st.head;if(st.drag&&st.head)stamp(head[0],head[1],46,1);
   if(st.fog!==undefined)setFog(st.fog);if(st.hint!==undefined)HG=st.hint||[];HUSHt=st.hush||0;HUSH+=(HUSHt-HUSH)*Math.min(1,dt*.003);if(st.dawn!==undefined)dawn=st.dawn;
   wake+=clamp(wakeT-wake,-dt*.0005,dt*.0005);if(pend!==undefined&&wake>=1){fogY=pend;pend=undefined;wake=0;wakeT=0}
   SACC+=dt*.009*(.12+.88*play+BOOST);let n=0;while(SACC>=1&&n<4){SACC-=1;spreadStep();n++}if(SACC>1)SACC=1;BOOST=Math.max(0,BOOST-dt*.0006);
   for(let k=0;k<LIFE.length;k++){if(LIFE[k]>FLOOR[k])LIFE[k]=Math.max(FLOOR[k],LIFE[k]-dt*.00012)}},
  // the whole sky behind the game: sky, star trails, nebula, watchers, the asleep part's fog, dawn
  draw(g,dt,L,part){const direct=g.canvas&&g.canvas.width===W/2; /* v31: a half-res sky canvas (scaled .5 by the caller) takes the trails straight, saving a full-sky copy per frame */
   /* 3b gates (tester s179 A): part 1 = the trails only, part 2 = everything over them; the game paints a new, still invisible board's first sky in two frames */
   if(part!==2){drawTrails(dt,direct?g:null,!!(L&&L.streaks));g.globalAlpha=1;g.globalCompositeOperation='source-over';if(!direct)g.drawImage(SCV,0,0,W,H);if(part===1)return}else{g.globalAlpha=1;g.globalCompositeOperation='source-over'}
   if(L&&L.nb&&L.ov){g=L.ov;g.save();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,g.canvas.width,g.canvas.height);g.restore();drawNebula(null,L.nb,g)} /* v33 layers: nebula on its own full-res canvas; watchers, fog and dawn on a half-res overlay above it (same look as drawing them on the sky after the nebula) */
   else drawNebula(g);drawWatchers(g,.5);
   if(fogY!==null&&wake<1){const a=.45*(1-wake),fg=flip?g.createLinearGradient(0,fogY+80,0,fogY-120):g.createLinearGradient(0,fogY-80,0,fogY+120);fg.addColorStop(0,'rgba(6,8,30,0)');fg.addColorStop(1,'rgba(6,8,30,'+a+')');g.fillStyle=fg;
    if(flip)g.fillRect(0,0,W,fogY+80);else g.fillRect(0,fogY-80,W,H-fogY+80)}
   if(dawn>0){const d1=Math.min(1,dawn),d2=clamp(dawn-1,0,1),top=H*(.62-.3*d2),gr=g.createLinearGradient(0,H,0,top); /* the dawn seeps up from the bottom: one life spent warms the low sky, two warm it high */
    gr.addColorStop(0,`rgba(255,178,128,${.5*d1+.2*d2})`);gr.addColorStop(.45,`rgba(240,150,150,${.26*d1+.14*d2})`);gr.addColorStop(1,'rgba(200,140,170,0)');g.fillStyle=gr;g.fillRect(0,top,W,H-top)}},
  // v31: one bright trail that rides the sky's arcs from a to b (the comet of the gate-shimmer hint, ?hl=trails): it leaves along
  // the trails' own curve round the pivot, then swings in to b; u 0..1 is its progress, the tail fades behind it
  runner(g,a,b,u,col){if(u<=0||u>=1.15)return;col=col||'255,244,214';const ra=Math.hypot(a[0]-PX,a[1]-PY),rb=Math.hypot(b[0]-PX,b[1]-PY),aa=Math.atan2(a[1]-PY,a[0]-PX),ab=Math.atan2(b[1]-PY,b[0]-PX);
   const sm=v=>{v=clamp(v,0,1);return v*v*(3-2*v)},at=v=>{const an=aa+(ab-aa)*sm(v/.8),r=ra+(rb-ra)*sm((v-.25)/.75);return [PX+Math.cos(an)*r,PY+Math.sin(an)*r]};
   const hd=Math.min(1,u),fade=u>1?1-(u-1)/.15:1;g.save();g.globalCompositeOperation='lighter';g.lineCap='round';let pv=at(Math.max(0,hd-.25));
   for(let i=1;i<=18;i++){const v=Math.max(0,hd-.25+.25*i/18),q=at(v),f=i/18;g.globalAlpha=.85*f*f*fade;g.strokeStyle=`rgb(${col})`;g.lineWidth=1+3.2*f;g.beginPath();g.moveTo(pv[0],pv[1]);g.lineTo(q[0],q[1]);g.stroke();pv=q}
   const [hx,hy]=at(hd),gr=g.createRadialGradient(hx,hy,0,hx,hy,26);gr.addColorStop(0,`rgba(${col},${.9*fade})`);gr.addColorStop(1,`rgba(${col},0)`);g.globalAlpha=1;g.fillStyle=gr;g.beginPath();g.arc(hx,hy,26,0,7);g.fill();g.restore()},
  // a star wearing its own trails (lab STY=2): aw = awake (shows its colour), lit 0..1 = on the string or just rung, wall=false for sprites
  star(g,id,x,y,rad,col,aw,lit,wall,mul,big,snd){const M=g.globalAlpha*(mul===undefined?1:mul),z=Math.max(asleep(x,y),aw?0:.55),s=Math.max(.14,speed(x,y))*(aw?1:.7);ph[id]=(ph[id]||0)+DT*.0025*s; /* lab v7.9 (Sam 6:48pm): always flowing */const SPH=ph[id];
   const c0=aw?col:[128,130,146],gc=aw?col:[128,130,146], /* Sam Nov 1 6:42pm: no star is ever white (white = clear, no colour): an asleep star is a dim grey, never cream */GR=rad*3.3*(1+.25*lit),wf=wall===false?()=>1:wallF;
   if(ELW&&(STK===5||STK===13)){let sd=0;for(let i=0;i<id.length;i++)sd=(sd*31+id.charCodeAt(i))%997;starWc(g,id,sd,x,y,rad*1.2,col,aw,z,M,wall,big,snd);g.globalAlpha=M/(mul===undefined?1:mul||1);return} /* v37 (lab v9.5 STK 5, Sam 7:54am 'ship the stars'): no pale glow, no little orbit trails */
   const gg=g.createRadialGradient(x,y,0,x,y,GR);gg.addColorStop(0,`rgba(${gc},${Math.min(1,.5*(1-z*.6)+.35*lit)})`);gg.addColorStop(1,`rgba(${gc},0)`);g.globalAlpha=M;g.fillStyle=gg;g.beginPath();g.arc(x,y,GR,0,7);g.fill();
   const OWN=Look.OWN;g.lineWidth=1.6;for(let k=0;k<OWN;k++){const ci=k>>1,dir=k&1?-1:1,rr=rad*(1.9+ci*(5.5/OWN)),a0=dir*SPH*(1.3-ci*(1.5/OWN))+k*2.39+x*.01,len=.9-ci*(.8/OWN), /* lab v7.9 (Sam 6:48pm): on each circle two trails run opposite ways */sc=aw?c0:(k%2?[150,152,170]:c0);
    for(let q=0;q<6;q++){const b0=a0+len*q/6,b1=a0+len*(q+1)/6,a=.8*(1-q/6)*(1-z*.7)*wf(x+Math.cos((b0+b1)/2)*rr,y+Math.sin((b0+b1)/2)*rr);if(a<.01)continue;g.globalAlpha=a*M;g.strokeStyle=`rgb(${sc})`;g.beginPath();g.arc(x,y,rr,b0,b1);g.stroke()}}
   if(ELW){let sd=0;for(let i=0;i<id.length;i++)sd=(sd*31+id.charCodeAt(i))%997;starWc(g,id,sd,x,y,rad*1.2,col,aw,z,M,wall,big);g.globalAlpha=M/(mul===undefined?1:mul||1);return}
   g.globalAlpha=M;g.fillStyle=`rgb(${c0})`;g.beginPath();g.arc(x,y,rad*.62*(1+.15*lit),0,7);g.fill();g.fillStyle=`rgb(${c0.map(v=>Math.round(v+(255-v)*(aw?.38:.18)))})`;g.beginPath();g.arc(x,y,rad*.3*(1+.2*lit),0,7);g.fill(); /* the hot core keeps the star's own colour (was #fffbe8: small stars read white) */g.globalAlpha=M/(mul===undefined?1:mul||1)}};
 const ph={};let FEMA=16.7;
 // ---- lab v8.7/v8.8 (Sam 8:13pm FIRM: nothing over the walls): every star body, gate, label and gate light is painted on its own small layer and
 // cut to the lane with a mask baked once per board from this board's sdf (lane = sdf>3, 2px soft edge). Settled stars are baked once,
 // already cut (S asleep, A awake, B the grown circle); only a star in motion (waking, growing) is cut live.
 let NOSTREAK=0,LMV=0;const DAOLD=typeof location!=='undefined'&&/[?&]daold=1\b/.test(location.search),PERFQ=typeof location!=='undefined'&&/[?&]perf=off\b/.test(location.search),PERFOFF_=()=>PERFQ||window.__perfOff;const STW=+((typeof location!=='undefined'&&new URLSearchParams(location.search).get('stw'))||.45);const STC={}; /* icon thread v19h (Sam Nov 5 4:34pm): still seep / soft melt */
 const LMASK=(()=>{if(!ELW)return null;const S=2,w=Math.ceil(W/S),h=Math.ceil(H/S),c=mk(w,h),x=c.getContext('2d'),im=x.createImageData(w,h),D=im.data;
  const A=pw.lmA&&pw.lmW===w&&pw.lmA.length===w*h?pw.lmA:null;
  if(A){const U=new Uint32Array(D.buffer);for(let k=0;k<A.length;k++)U[k]=0x00ffffff|(A[k]<<24)>>>0} /* 3b gates v14 (tester s179 A): the lane cut's alpha is baked with the sky; little-endian RGBA, alpha in the top byte */
  else for(let j=0;j<h;j++)for(let i=0;i<w;i++){const a=clamp((sdf(i*S+S/2,j*S+S/2)-3)/2,0,1),k=(j*w+i)*4;D[k]=D[k+1]=D[k+2]=255;D[k+3]=255*a}x.putImageData(im,0,0);c.im=im;return c})();if(LMASK)laneRows(0);
 /* v60 DOOR OPENING: when a door takes you its sealed back parts, from the star outward, behind a soft uneven front (~0.65s), into the
    lane prep baked for it; then the lane cut and the wall field open there too, so the string's paint is allowed through. Doors stay open. */
 const DOPEN=new Set(),DANIM=[],DOOR_MS=[0,600,1700,750,1100,950,1100,1400][UM]||600,DRS=W/ART.width;
 function sealErase(q,x,cy,r,F,bx,by,bw,bh){const h=cy-by;if(h<=0)return;q.save();q.beginPath();q.rect(bx,by,bw,h);q.clip();const r0=Math.max(0,r),gr=q.createRadialGradient(x,cy,r0,x,cy,r0+F);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');q.globalCompositeOperation='destination-out';q.fillStyle=gr;q.fillRect(bx,by,bw,h);q.restore()} /* v61 from 3b gates v19 #3: an opening door's wash past its seal shows only within reach r of the split (soft edge F), so it seeps out round instead of popping in */
 L.sealClip=(y,da)=>{if(!(da>=0)||da>=1)return undefined;if(da<=.2)return y-26;const q=(da-.2)/.8,e=q*q*(3-2*q);return {sy:y-26,rr:170*e,f:34}};
 /* icon thread (Sam Nov 5 1:51pm, icon sheet comment: "'active' should be with a single seep around it not moving, then 'playing' starts actively
    seeping out in like waves"): ACTIVE = a door on your trail keeps ONE STILL SEEP of its colour (the same soundWash paint, its clock frozen per door,
    no running streaks), cut to the lane and cached until the lane mask changes; PLAYING = the live wash (soundAt) on top, as before. */
 L.stillAt=(g,id,x,y,col,amp,Rm)=>{if(!(amp>.004)||!LMASK)return;const ak=Math.round(amp*40),key=col+'|'+ak+'|'+Rm+'|'+LMV;let C=STC[id];
  if(!C||C.key!==key){const R=Math.ceil(Rm*.625*7.5),c=(C&&C.R===R)?C.c:mk(2*R,2*R),q=c.getContext('2d');q.setTransform(1,0,0,1,0,0);q.globalCompositeOperation='source-over';q.clearRect(0,0,2*R,2*R);q.setTransform(1,0,0,1,R-x,R-y);
   const T0=T;T=(id*977)%20000;NOSTREAK=1;try{soundWash(q,id%97,x,y,Rm*.5,col,ak/40,1)}finally{NOSTREAK=0;T=T0}
   q.setTransform(1,0,0,1,0,0);if(!/stmask=0/.test(location.search)){q.globalCompositeOperation='destination-in';q.drawImage(LMASK,(x-R)/2,(y-R)/2,R,R,0,0,2*R,2*R)}q.globalCompositeOperation='source-over';C=STC[id]={key,c,R}}
  L.STC=STC;  g.save();g.globalAlpha=1;g.globalCompositeOperation='source-over';g.drawImage(C.c,x-C.R,y-C.R);g.restore()};
 L.soundAt=(g,id,x,y,col,amp,Rm,RmMax,clipY)=>{if(!(amp>.004))return;Rm=Rm||56;const sp=seepOf('sa'+id,amp),Rw=Rm*.625,rw=Rw*(.7*(.45+.55*sp)+(.55+2.4*amp*1.07)*sp)*1.23+3,dm=Rw*5*(.35+.65*sp),Ls=Rw*2.6,Ly=layer('sa'+id,x,y,Math.ceil((RmMax||Rm)*.625*7.5),1,Math.max(rw,Math.min(dm+3*Rw,7*Rw)+Ls+3),Math.max(rw,dm*.8+Ls*.12+3)); /* RmMax: a growing seep keeps one layer size (no new canvas each frame) */ /* v72o perf (tester: 50-67ms frames at door passes, several washes at once): each wash clears, cuts and blits only the box its rings and streaks can reach right now (same pixels; ?perf=off = the whole layer) */soundWash(Ly.x,id%97,x,y,Rm*.5,col,amp,sp);
  if(clipY&&clipY.sy!==undefined)sealErase(Ly.x,x,clipY.sy,clipY.rr,clipY.f,x-Ly.R,y-Ly.R,2*Ly.R,2*Ly.R);else if(clipY&&typeof clipY==='object'){const q=Ly.x,c=clipY,f=c.f||12,gr=q.createLinearGradient(c.x-c.ux*(c.o||0),c.y-c.uy*(c.o||0),c.x-c.ux*((c.o||0)+f),c.y-c.uy*((c.o||0)+f));gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');q.save();q.globalCompositeOperation='destination-out';q.fillStyle=gr;q.fillRect(x-Ly.R,y-Ly.R,2*Ly.R,2*Ly.R);q.restore()} /* 3b gates (Sam Nov 4 1:35pm 'the green should not appear backwards'): a door's colour never shows behind it; erase the half-plane behind the door (u points the way you go through) */
  else if(clipY!==undefined){const q=Ly.x,gr=q.createLinearGradient(0,clipY+6,0,clipY-10);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');q.save();q.globalCompositeOperation='destination-out';q.fillStyle=gr;q.fillRect(x-Ly.R,y-Ly.R,2*Ly.R,clipY+6-(y-Ly.R));q.restore()} /* v60l (tester s166/s167): a sealed door's seep stops at its seal, never shows in the corridor past it */
  layerOut(g,Ly,1)};
 const doorAt_=(x,y,tx)=>(pw.DOORP||[]).find(P=>P&&Math.abs(P.gx-x)<(tx||9)&&Math.abs(P.gy-y)<3); /* v60y: 9 wide (was 3): a door star drawn mid-jolt (up to 6 sideways) still finds its door, so its seal clip holds and it never draws as a doorless star */
 L.doorAmt=(x,y,tx)=>{const P=doorAt_(x,y,tx);if(!P)return -1;if(!DOPEN.has(P))return 0;const A=DANIM.find(A=>A.P===P);return A?Math.min(1,(performance.now()-A.t0)/DOOR_MS):1}; /* -1 = no sealed door here */
 L.rushDoor=(x,y,ms)=>{const P=doorAt_(x,y);if(!P)return;const A=DANIM.find(A=>A.P===P);if(A)A.t0=Math.min(A.t0,performance.now()-ms)}; /* v60l (tester s167): once the string runs on past a door, its seal is at least ms into opening */ /* v60i (Sam Nov 4 10:18am 'no visual effect when i tap a note to preview it... what happened to the live seeping'), ported from the 3b lead star copy: the S4 sounding seep for W-S0 doors, which doorFx dropped; same call as the gate hum wash, cut to the lane */
 L.openDoor=(x,y,fast)=>{const P=(pw.DOORP||[]).find(P=>P&&Math.abs(P.gx-x)<3&&Math.abs(P.gy-y)<3);if(!P||DOPEN.has(P))return false;{const n=RANIM.findIndex(A=>A.P===P);if(n>=0){refuseEnd(RANIM[n]);RANIM.splice(n,1)}} /* a refusal still running on this door is put back first */DOPEN.add(P);DOORT[Math.round(x)+','+Math.round(y)]=performance.now();const J=pw.doorJob(P);if(!P.done)J.step(1e9);
  const AD=pw.im.data,cur=new Uint8ClampedArray(P.aw*P.ah*4);for(let j=0;j<P.ah;j++)cur.set(AD.subarray(((P.aj0+j)*ART.width+P.ai0)*4,((P.aj0+j)*ART.width+P.ai0+P.aw)*4),j*P.aw*4);DANIM.push({P,t0:performance.now()-(fast===true?DOOR_MS:Math.min(DOOR_MS,+fast||0)),cur}) /* v60j: a number = head start in ms (tester s163: on an instant drag the ink reached past the seal ~70ms before it parted) */;return true}; /* v60c: no canvas read-backs (slow on phones): the art's own pixels are kept in pw.im */
 L.doorsOpen=()=>DOPEN.size;
 /* v60x: wrong-note door, ported from 3b gates v18d (take 3 only) */
 const RANIM=[],RMS=[0,820,860,440][WN]||820 /* v60y (tester s194: one extra 50ms frame per 0.5s of refusal): take 3's wall is fully shut at 430ms, so the last 190ms of identical repaints are cut; refuseEnd puts the pixels back exactly */,eo=u=>1-Math.pow(1-clamp(u,0,1),3),eio=u=>{u=clamp(u,0,1);return u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2};
 /* v72 WRONG-DOOR LOOK (Sam Nov 5 10:11pm: 'we need wrong door animations too', one per wrong-door sound; ?wanim=0-4). Every take is this same
    seal crack (the door's own painted seal parting, as 'Strain, then snap shut') with its gap width tweened over time to the sound's shape:
    0 today: strains apart, snaps shut at 430ms | 1 wobble: opens, then the gap swells and narrows at the 5Hz beat for 3 beats, closes at 860ms |
    2 clash: slams open in 90ms and shut by 260ms (both notes hit at once) | 3 sag: opens, then slowly slumps shut over half a second |
    4 cut-off: strains like today, holds wide, then is cut shut in 30ms at 470ms (when the door's note is cut) */
 const RMSM=[440,860,300,700,510];
 function fwM(md,tm){if(md===1)return tm<150?6*eo(tm/150):tm<750?6+4*Math.sin((tm-150)/1000*Math.PI*10):6*(1-eio((tm-750)/110));
  if(md===2)return tm<90?12*eo(tm/90):tm<160?12:tm<260?12*(1-Math.pow((tm-160)/100,2)):0;
  if(md===3)return tm<150?8*eo(tm/150):tm<650?8*(1-eio((tm-150)/500)):0;
  if(md===4)return tm<150?3.5*eo(tm/150):tm<320?3.5+8.5*eio((tm-150)/170):tm<470?12:tm<500?12*(1-(tm-470)/30):0;return null}
 function rAt(P,tm,X,Y,md){const e=P.gy-Y,w=X-P.gx,wc=w-(Math.sin(e*.19+P.gx*.03)*4+Math.sin(e*.53+1.3)*2),nzz=(Math.sin(w*.21+P.gx*.01)*.5+Math.sin(w*.47+e*.13)*.3);let Fw=0,reach=1e9;
  if(WN===1)Fw=tm<170?3.5*eo(tm/170):tm<320?3.5:3.5*(1-eio((tm-320)/(RMS-320)));
  else if(WN===2){Fw=3.2;const Lm=46;reach=tm<320?Lm*eo(tm/320):Lm*(1-eio((tm-320)/(RMS-320)));if(e<-6)return 0}
  else if(md)Fw=fwM(md,tm);else if(WN===3)Fw=tm<150?3.5*eo(tm/150):tm<320?3.5+8.5*eio((tm-150)/170):tm<430?12*(1-Math.pow((tm-320)/110,2)):0;
  if(Fw<=.15||reach<=.5)return 0;const big=Fw>4;let m=clamp((Fw-Math.abs(wc)+nzz*(big?4:1))/(big?6:2.5),0,1);if(reach<1e9)m*=clamp((reach-e)/7,0,1);return m}
 L.refuseDoor=(x,y,md)=>{if(!WN)return false;const P=doorAt_(x,y);if(!P||DOPEN.has(P)||RANIM.some(A=>A.P===P))return false;const J=pw.doorJob(P);if(!P.done)J.step(1e9);
  const AD=pw.im.data,cur=new Uint8ClampedArray(P.aw*P.ah*4);for(let j=0;j<P.ah;j++)cur.set(AD.subarray(((P.aj0+j)*ART.width+P.ai0)*4,((P.aj0+j)*ART.width+P.ai0+P.aw)*4),j*P.aw*4);RANIM.push({P,t0:performance.now(),cur,md:md|0});return true};
 function refuseEnd(A){const P=A.P,D2=pw.im.data,AW=ART.width,c=A.cur;for(let j=0;j<P.ah;j++)D2.set(c.subarray(j*P.aw*4,(j+1)*P.aw*4),((P.aj0+j)*AW+P.ai0)*4);const ac=ART.getContext('2d');ac.putImageData(pw.im,0,0,P.ai0,P.aj0,P.aw,P.ah);if(offN>=0)NDIRTY.push([P.ai0,P.aj0,P.aw,P.ah]);else offN=-1;
  if(ARTH){const hx=ARTH.getContext('2d'),k=DRS/2;hx.clearRect(P.ai0*k,P.aj0*k,P.aw*k,P.ah*k);hx.drawImage(ART,P.ai0,P.aj0,P.aw,P.ah,P.ai0*k,P.aj0*k,P.aw*k,P.ah*k);if(BIL)BIL.fc=-1}}
 function refuseAnim(){if(!RANIM.length)return;const now=performance.now(),ac=ART.getContext('2d');
  for(let n=RANIM.length-1;n>=0;n--){const A=RANIM[n],P=A.P,tm=now-A.t0;if(tm>=(A.md?RMSM[A.md]:RMS)||DOPEN.has(P)){refuseEnd(A);RANIM.splice(n,1);continue}const D2=pw.im.data,AW=ART.width,s=P.sealA,o=P.openA,c=A.cur;
   for(let j=0;j<P.ah;j++){const Y=(P.aj0+j)*DRS+DRS/2;for(let i=0;i<P.aw;i++){const b=(j*P.aw+i)*4;if(s[b]===o[b]&&s[b+1]===o[b+1]&&s[b+2]===o[b+2]&&s[b+3]===o[b+3])continue;
     const X=(P.ai0+i)*DRS+DRS/2,m=rAt(P,tm,X,Y,A.md),d=((P.aj0+j)*AW+P.ai0+i)*4;if(m<=0){D2[d]=c[b];D2[d+1]=c[b+1];D2[d+2]=c[b+2];D2[d+3]=c[b+3];continue}
     const ca=c[b+3]/255,oa=o[b+3]/255,a=ca+(oa-ca)*m;D2[d+3]=a*255;for(let q=0;q<3;q++)D2[d+q]=a>0?(c[b+q]*ca+(o[b+q]*oa-c[b+q]*ca)*m)/a:0}}
   ac.putImageData(pw.im,0,0,P.ai0,P.aj0,P.aw,P.ah);if(offN>=0)NDIRTY.push([P.ai0,P.aj0,P.aw,P.ah]);else offN=-1;
   if(ARTH){const hx=ARTH.getContext('2d'),k=DRS/2;hx.clearRect(P.ai0*k,P.aj0*k,P.aw*k,P.ah*k);hx.drawImage(ART,P.ai0,P.aj0,P.aw,P.ah,P.ai0*k,P.aj0*k,P.aw*k,P.ah*k)}}} /* v60y: no forced full life-layer repaint per refusal frame (it repaints every 3rd frame anyway; refuseEnd still forces one) */
 function daPre(P){const s=P.sealA,o=P.openA,I=[],NZ=[],WC=[];for(let j=0;j<P.ah;j++){const Y=(P.aj0+j)*DRS+DRS/2,e=P.gy-Y;for(let i=0;i<P.aw;i++){const b=(j*P.aw+i)*4;if(s[b]===o[b]&&s[b+1]===o[b+1]&&s[b+2]===o[b+2]&&s[b+3]===o[b+3])continue;const X=(P.ai0+i)*DRS+DRS/2,w=X-P.gx;I.push(j*P.aw+i);NZ.push(Math.sin(w*.21+P.gx*.01)*.5+Math.sin(w*.47+e*.13)*.3);WC.push(Math.abs(w-(Math.sin(e*.19+P.gx*.03)*4+Math.sin(e*.53+1.3)*2)))}}P.daI=Int32Array.from(I);P.daNz=Float64Array.from(NZ);P.daWc=Float64Array.from(WC)}
 let DAPW=null;function daWarm(){if(UM!==7||DAOLD||!pw||pw.DOORP===DAPW)return;const L0=DAPW=pw.DOORP;if(!L0)return;let n=0;const step=()=>{if(DAPW!==L0)return;while(n<L0.length&&(!L0[n]||L0[n].daI))n++;if(n>=L0.length)return;if(!L0[n].done){setTimeout(step,120);return}daPre(L0[n++]);setTimeout(step,40)};setTimeout(step,250)} /* each door's crack wobble is worked out in idle slices after the board is built, not on the frame it opens */
 function doorAnim(){daWarm();refuseAnim();if(!DANIM.length)return;const now=performance.now(),ac=ART.getContext('2d');
  for(let n=DANIM.length-1;n>=0;n--){const A=DANIM[n],P=A.P,p=Math.min(1,(now-A.t0)/DOOR_MS),ez=1-Math.pow(1-p,1.6),F=8+ez*96,D2=pw.im.data,AW=ART.width,s=P.sealA,o=P.openA,c=A.cur;
   if(UM===7&&!DAOLD){if(!P.daI)daPre(P);
    const I=P.daI,NZ=P.daNz,WC=P.daWc,Fw=p<.25?3.5*Math.min(1,p/.12):3.5+Math.pow((p-.25)/.75,1.6)*78,nk=p<.25?1:6,dv=p<.25?2.5:8; /* v72o perf (door-pass frames): the crack's per-pixel wobble is worked out once per door, not every frame (same maths, same pixels; ?daold=1 = old) */
    for(let n2=0;n2<I.length;n2++){const ix=I[n2],b=ix*4,j=(ix/P.aw)|0,i=ix-j*P.aw,m=p>=1?1:clamp((Fw-WC[n2]+NZ[n2]*nk)/dv,0,1);
     const ca=c[b+3]/255,oa=o[b+3]/255,a=ca+(oa-ca)*m,d=((P.aj0+j)*AW+P.ai0+i)*4;D2[d+3]=a*255;for(let q=0;q<3;q++)D2[d+q]=a>0?(c[b+q]*ca+(o[b+q]*oa-c[b+q]*ca)*m)/a:0}}
   else for(let j=0;j<P.ah;j++){const Y=(P.aj0+j)*DRS+DRS/2,e=P.gy-Y;for(let i=0;i<P.aw;i++){const b=(j*P.aw+i)*4;if(s[b]===o[b]&&s[b+1]===o[b+1]&&s[b+2]===o[b+2]&&s[b+3]===o[b+3])continue;
     const X=(P.ai0+i)*DRS+DRS/2,w=X-P.gx,nzz=(Math.sin(w*.21+P.gx*.01)*.5+Math.sin(w*.47+e*.13)*.3),fr=F-Math.abs(w)*.35+nzz*(UM===2?22:9);let m;
     if(p>=1)m=1;else if(UM===2){const F2=4+(1-Math.pow(1-p,1.2))*104;m=clamp((F2-Math.abs(w)*.5+nzz*22-e)/34,0,1)}
     else if(UM===3){const Fw=Math.pow(p,1.25)*78-4;m=clamp((Fw-Math.abs(w)+nzz*6)/8,0,1)} /* Sam Nov 4 1:37pm: split opens the WHOLE wall (front, funnel and seal), from the lane's centre line out to its edges */
     else if(UM===4){const q=clamp((p-.4)/.6,0,1),hn=(Math.sin(X*.37+Y*.11)*.5+.5)*.6+(Math.sin(X*.09-Y*.21+1.7)*.5+.5)*.4;m=clamp((q*1.35-hn)*4,0,1)}
     else if(UM===5){const R=Math.pow(p,1.2)*112,rr=Math.hypot(w,e*.8);m=clamp((R-rr+nzz*9)/11,0,1)} /* split from the star: the opening grows out of the star in every direction */
     else if(UM===6){const z=-72+134*Math.min(1,p/.55),Fw=Math.min(80,Math.max(0,z-e)*1.15)*Math.min(1,.35+p);m=clamp((Fw-Math.abs(w)+nzz*6)/8,0,1)} /* zip: a seam runs from the front of the wall to its back and opens behind itself */
     else if(UM===7){const wc=w-(Math.sin(e*.19+P.gx*.03)*4+Math.sin(e*.53+1.3)*2),Fw=p<.25?3.5*Math.min(1,p/.12):3.5+Math.pow((p-.25)/.75,1.6)*78;m=clamp((Fw-Math.abs(wc)+nzz*(p<.25?1:6))/(p<.25?2.5:8),0,1)} /* crack, then split: a ragged crack runs right through first, then the wall pulls apart */
     else m=clamp((fr-e)/16,0,1);
     const ca=c[b+3]/255,oa=o[b+3]/255,a=ca+(oa-ca)*m,d=((P.aj0+j)*AW+P.ai0+i)*4;D2[d+3]=a*255;for(let q=0;q<3;q++)D2[d+q]=a>0?(c[b+q]*ca+(o[b+q]*oa-c[b+q]*ca)*m)/a:0}}
   ac.putImageData(pw.im,0,0,P.ai0,P.aj0,P.aw,P.ah);if(offN>=0)NDIRTY.push([P.ai0,P.aj0,P.aw,P.ah]);else offN=-1; /* v60p (tester s177 item 3): an opening door repaints only its own box of the full-res nebula, not the whole sky every frame */
   if(ARTH){const hx=ARTH.getContext('2d'),k=DRS/2;hx.clearRect(P.ai0*k,P.aj0*k,P.aw*k,P.ah*k);hx.drawImage(ART,P.ai0,P.aj0,P.aw,P.ah,P.ai0*k,P.aj0*k,P.aw*k,P.ah*k);if(BIL)BIL.fc=-1}
   if(LMASK&&p<1)lmRamp(P,p); /* v60p (tester s177 item 3: the bloom jumped into the door chamber in one frame when the door finished): the lane cut opens with the door, so seeps flow in as it parts */
   if(p>=1){let q=0;for(let j=P.gj0;j<=P.gj1;j++)for(let i=P.gi0;i<=P.gi1;i++,q++)SDG[j*pw.SDW+i]=P.openV[q];
    if(LMASK){const S=2,x0=Math.max(0,Math.floor((P.gx-92)/S)),y0=Math.max(0,Math.floor((P.gy-100)/S)),w=Math.min(LMASK.width-x0,Math.ceil(184/S)),h=Math.min(LMASK.height-y0,Math.ceil((100+DY1)/S)),mx=LMASK.getContext('2d'),DD=LMASK.im.data,LW=LMASK.width;
     for(let j=0;j<h;j++)for(let i=0;i<w;i++){const a=clamp((sdf((x0+i)*S+S/2,(y0+j)*S+S/2)-3)/2,0,1),kk=((y0+j)*LW+x0+i)*4;DD[kk]=DD[kk+1]=DD[kk+2]=255;DD[kk+3]=255*a}mx.putImageData(LMASK.im,0,0,x0,y0,w,h);laneRows(y0,y0+h);for(const kk in MCUT){const m=/^(\d+):(-?[\d.]+),(-?[\d.]+)$/.exec(kk);if(!m||Math.abs(+m[2]-P.gx)<+m[1]+92&&+m[3]>P.gy-100-+m[1]&&+m[3]<P.gy+DY1+ +m[1])delete MCUT[kk]}} /* v60b: only the cut masks that overlap this door are made again (tester: one hitch per door) */
    DANIM.splice(n,1)}}}
 function lmBox(P){const S=2,x0=Math.max(0,Math.floor((P.gx-92)/S)),y0=Math.max(0,Math.floor((P.gy-100)/S)),w=Math.min(LMASK.width-x0,Math.ceil(184/S)),h=Math.min(LMASK.height-y0,Math.ceil((100+DY1)/S));return [x0,y0,w,h]}
 function lmRamp(P,p){const S=2,[x0,y0,w,h]=lmBox(P),DD=LMASK.im.data,LW=LMASK.width;
  if(!P.lmN){P.lmO=new Uint8ClampedArray(w*h);P.lmN=new Uint8ClampedArray(w*h);for(let j=0;j<h;j++)for(let i=0;i<w;i++)P.lmO[j*w+i]=DD[((y0+j)*LW+x0+i)*4+3];
   const keep=[];let q=0;for(let j=P.gj0;j<=P.gj1;j++)for(let i=P.gi0;i<=P.gi1;i++,q++){const k=j*pw.SDW+i;keep.push(SDG[k]);SDG[k]=P.openV[q]}
   for(let j=0;j<h;j++)for(let i=0;i<w;i++)P.lmN[j*w+i]=255*clamp((sdf((x0+i)*S+S/2,(y0+j)*S+S/2)-3)/2,0,1);
   q=0;for(let j=P.gj0;j<=P.gj1;j++)for(let i=P.gi0;i<=P.gi1;i++,q++)SDG[j*pw.SDW+i]=keep[q]}
  const u=Math.pow(clamp(p/.9,0,1),1.3);let ch=0;if(UM===7&&!DAOLD){if(!P.lmI){const I=[],NZ=[],WC=[];for(let j=0;j<h;j++)for(let i=0;i<w;i++){if(P.lmO[j*w+i]===P.lmN[j*w+i])continue;const X=(x0+i)*S+S/2,Y=(y0+j)*S+S/2,e=P.gy-Y,ww=X-P.gx;I.push(j*w+i);NZ.push(Math.sin(ww*.21+P.gx*.01)*.5+Math.sin(ww*.47+e*.13)*.3);WC.push(Math.abs(ww-(Math.sin(e*.19+P.gx*.03)*4+Math.sin(e*.53+1.3)*2)))}P.lmI=Int32Array.from(I);P.lmNz=Float64Array.from(NZ);P.lmWc=Float64Array.from(WC)}
   const I=P.lmI,Fw=p<.25?3.5*Math.min(1,p/.12):3.5+Math.pow((p-.25)/.75,1.6)*78,nk=p<.25?1:6,dv=p<.25?2.5:8;for(let n2=0;n2<I.length;n2++){const q2=I[n2],j=(q2/w)|0,i=q2-j*w,o=P.lmO[q2],nn=P.lmN[q2],m=p>=1?1:clamp((Fw-P.lmWc[n2]+P.lmNz[n2]*nk)/dv,0,1),kk=((y0+j)*LW+x0+i)*4;DD[kk]=DD[kk+1]=DD[kk+2]=255;DD[kk+3]=o+(nn-o)*m;ch=1}} /* v72o perf: same once-per-door wobble as doorAnim */
  else for(let j=0;j<h;j++)for(let i=0;i<w;i++){const o=P.lmO[j*w+i],nn=P.lmN[j*w+i];if(o===nn)continue;let m=u;if(UM===7){const X=(x0+i)*S+S/2,Y=(y0+j)*S+S/2,e=P.gy-Y,ww=X-P.gx,nzz=(Math.sin(ww*.21+P.gx*.01)*.5+Math.sin(ww*.47+e*.13)*.3),wc=ww-(Math.sin(e*.19+P.gx*.03)*4+Math.sin(e*.53+1.3)*2),Fw=p<.25?3.5*Math.min(1,p/.12):3.5+Math.pow((p-.25)/.75,1.6)*78;m=p>=1?1:clamp((Fw-Math.abs(wc)+nzz*(p<.25?1:6))/(p<.25?2.5:8),0,1)} /* v60z (Sam Nov 5 1:26pm: 'make sure the seeping visual effect doesn't cross over the top of the wall behind it'): the lane cut opens exactly where the wall art has parted (the same crack-then-split mask as doorAnim), not as an even fade over the whole door box, which let seeps haze over the still-standing wall halves */const kk=((y0+j)*LW+x0+i)*4;DD[kk]=DD[kk+1]=DD[kk+2]=255;DD[kk+3]=o+(nn-o)*m;ch=1}
  if(ch){LMASK.getContext('2d').putImageData(LMASK.im,0,0,x0,y0,w,h);laneRows(y0,y0+h);for(const kk in MCUT){const m=/^(\d+):(-?[\d.]+),(-?[\d.]+)$/.exec(kk);if(!m||Math.abs(+m[2]-P.gx)<+m[1]+92&&+m[3]>P.gy-100-+m[1]&&+m[3]<P.gy+DY1+ +m[1])delete MCUT[kk]}}}
 const LYR={};function layer(k,x,y,R,lane,ex,ey){let Ly=LYR[k];if(!Ly||Ly.R!==R){const c=mk(2*R,2*R);Ly=LYR[k]={c,x:c.getContext('2d'),R}}Ly.cx=x;Ly.cy=y;const q=Ly.x;if(Ly.clip){q.restore();Ly.clip=0}Ly.bb=null;Ly.cb=null;q.setTransform(1,0,0,1,0,0);q.globalCompositeOperation='source-over';q.globalAlpha=1;const ext=ex&&lane&&LMASK&&LROW&&!PERFOFF_();if(!ext)q.clearRect(0,0,2*R,2*R);
  if(lane&&LMASK&&LROW){let b=laneBox(x-R,y-R,2*R,2*R);if(b&&ext){const ax=Math.max(b[0],Math.floor(R-ex)),ay=Math.max(b[1],Math.floor(R-ey)),bx=Math.min(b[0]+b[2],Math.ceil(R+ex)),by=Math.min(b[1]+b[3],Math.ceil(R+ey));if(bx>ax&&by>ay){Ly.cb=b;b=[ax,ay,bx-ax,by-ay];q.clearRect(ax-2,ay-2,bx-ax+4,by-ay+4)}else b=null} /* v72o perf: ext = the box the paint can reach; the lane cut still samples the mask over the whole lane box (cb), so every pixel matches the old cut */if(b){Ly.bb=b;q.save();q.beginPath();q.rect(b[0],b[1],b[2],b[3]);q.clip();Ly.clip=1}else Ly.bb=[0,0,0,0]} /* v60p (tester s177: seeps cost ~25ms a frame): a big seep layer only paints, cuts and blits the box where the lane is open (the rest is cut away anyway) */
  q.setTransform(1,0,0,1,R-x,R-y);return Ly}
 var LROW;function laneRows(j0,j1){LMV++;const w=LMASK.width,h=LMASK.height,D=LMASK.im.data;if(!LROW)LROW={a:new Int16Array(h),b:new Int16Array(h)};j0=Math.max(0,j0|0);j1=Math.min(h,j1===undefined?h:j1|0);for(let j=j0;j<j1;j++){let a=-1,b=-2;for(let i=0;i<w;i++)if(D[(j*w+i)*4+3]>1){if(a<0)a=i;b=i}LROW.a[j]=a<0?32767:a;LROW.b[j]=b}}
 function laneBox(X,Y,Wd,Hd){const S=2,j0=Math.max(0,Math.floor(Y/S)),j1=Math.min(LMASK.height-1,Math.ceil((Y+Hd)/S)),i0=Math.floor(X/S),i1=Math.ceil((X+Wd)/S);let xa=1e9,xb=-1e9,ya=1e9,yb=-1e9;
  for(let j=j0;j<=j1;j++){const a=LROW.a[j],b=LROW.b[j];if(b<i0||a>i1)continue;const u=Math.max(a,i0),v=Math.min(b,i1);if(u<xa)xa=u;if(v>xb)xb=v;if(j<ya)ya=j;if(j>yb)yb=j}
  if(xb<xa)return null;const bx=Math.max(0,xa*S-S-X),by=Math.max(0,ya*S-S-Y),ex=Math.min(Wd,xb*S+2*S-X),ey=Math.min(Hd,yb*S+2*S-Y);return ex>bx&&ey>by?[Math.floor(bx),Math.floor(by),Math.ceil(ex-bx),Math.ceil(ey-by)]:null}
 function crop(Ly){const q=Ly.x,w=Ly.c.width,h=Ly.c.height,d=q.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>1){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0)return {c:mk(1,1),ox:0,oy:0};const c=mk(x1-x0+1,y1-y0+1);c.getContext('2d').drawImage(Ly.c,-x0,-y0);return {c,ox:x0-Ly.R,oy:y0-Ly.R}} /* v35 speed: a baked layer keeps only the box its paint covers (blits are by area) */
 const MCUT={};function cut(Ly){if(Ly.bb){const q=Ly.x,b0=Ly.bb,b=Ly.cb||b0;if(!b0[2])return;q.setTransform(1,0,0,1,0,0);q.globalAlpha=1;q.globalCompositeOperation='destination-in';const X=Ly.cx-Ly.R+b[0],Y=Ly.cy-Ly.R+b[1];q.drawImage(LMASK,X/2,Y/2,b[2]/2,b[3]/2,b[0],b[1],b[2],b[3]);q.globalCompositeOperation='source-over';return}const q=Ly.x,mk2=Ly.R+':'+Ly.cx+','+Ly.cy;let m=MCUT[mk2];if(!m){m=MCUT[mk2]=mk(2*Ly.R,2*Ly.R);m.getContext('2d').drawImage(LMASK,Ly.R-Ly.cx,Ly.R-Ly.cy,W,H)} /* the lane cut for this spot, made once (a 1:1 mask per layer) */
  q.setTransform(1,0,0,1,0,0);q.globalAlpha=1;q.globalCompositeOperation='destination-in';q.drawImage(m,0,0);q.globalCompositeOperation='source-over'}
 function layerOut(g,Ly,M){cut(Ly);g.save();g.globalAlpha=M;g.globalCompositeOperation='source-over';if(Ly.bb){const b=Ly.bb;if(b[2]&&b[3])g.drawImage(Ly.c,b[0],b[1],b[2],b[3],Ly.cx-Ly.R+b[0],Ly.cy-Ly.R+b[1],b[2],b[3])}else g.drawImage(Ly.c,Ly.cx-Ly.R,Ly.cy-Ly.R);g.restore()}
 const SSQ=[],GSQ=[],BGS={},SCC={};let SDEF=0;
 // v37 BRUSH CIRCLE (Sam Nov 2 7:48am, 7:54am 'ship the stars'; lab v9.5 STK 5): a star you have not reached is one hand-brushed loop round it
 // (an enso, ends overlapping), slowly turning; once woken it turns faster and is drawn bolder. No dot, no white, no little orbit trails.
 // A sleeping star's loop is its own colour, dimmed (thinner, fainter, slower: Sam Nov 1 7:10pm 'sleeping = dim tint of own colour'); woken, bolder.
 // The loops are drawn after the string (L.after), each cut to the lane unless it sits clear of the walls. (The breathing fill is a hint: parked.)
 const RQ=[],LFIT={};
 function brushLoop(x,cx,cy,R,c,aw,si,TT){const cs=c.join(','),a0=si*2.3+TT*(aw?.00042:.00018),span=6.2832*1.13,N=64;x.lineCap='round';
  for(const [wm,am,rm] of [[1,1,1],[.45,.35,.965]]){for(let k=0;k<N;k++){const f=k/N,f2=(k+1)/N,t=a0+f*span,t2=a0+f2*span,rr=q=>R*rm*(1+.11*(q-.5)+.04*Math.sin((a0+q*span)*2+si)+.02*Math.sin((a0+q*span)*5+si*2));
    const press=Math.min(1,f/.1),dry=f>.72?1-.75*(f-.72)/.28:1,w=(aw?6.2:5)*wm*(.35+.65*press)*dry*(1+.12*Math.sin(f*23+si));
    x.strokeStyle='rgba('+cs+','+((aw?.95:.8)*am*(f>.72?.55+.45*dry:1))+')';x.lineWidth=w;x.beginPath();x.moveTo(cx+Math.cos(t)*rr(f),cy+Math.sin(t)*rr(f));x.lineTo(cx+Math.cos(t2)*rr(f2),cy+Math.sin(t2)*rr(f2));x.stroke()}}}
 function loopsOf(id,sd,x,y,rad,col,aw,z,t,M,out){if(!aw||t<1)out.push([id,sd,x,y,rad,col,0,M*(aw?1-wsm(.55,1,t):1-z*.35)]);if(aw)out.push([id,sd,x,y,rad,col,1,M*(t<1?.3+.7*Math.sqrt(t):1)])}
 /* speed: each loop is brushed once into a sprite and turned as a whole each frame (one blit instead of 128 brush strokes per star) */
 const LSP={};function loopSprite(sd,R,c,aw){const k=sd+':'+aw+':'+c+':'+Math.round(R);let sp=LSP[k];if(!sp){const P=Math.ceil(R*1.2+8);sp=LSP[k]=mk(2*P,2*P);brushLoop(sp.getContext('2d'),P,P,R,c,aw,sd,0)}return sp}
 function flushLoops(g){for(const [id,sd,x,y,rad,c,aw,al] of RQ){if(al<=.01)continue;const R=rad*(aw?1.85:1.7);let f=LFIT[id+aw];if(f===undefined){f=1;for(let i=0;i<24;i++){const a=i/24*6.2832;if(sdf(x+Math.cos(a)*(R*1.2+6),y+Math.sin(a)*(R*1.2+6))<4){f=0;break}}LFIT[id+aw]=f}
   const sp=loopSprite(sd,R,c,aw),h=sp.width/2,rot=T*(aw?.00042:.00018);
   if(f){g.save();g.globalAlpha=al;g.translate(x,y);g.rotate(rot);g.drawImage(sp,-h,-h);g.restore()}else{const Ly=layer('lp'+aw,x,y,Math.ceil(h*1.42)),q=Ly.x;q.translate(x,y);q.rotate(rot);q.drawImage(sp,-h,-h);layerOut(g,Ly,al)}}RQ.length=0}

 // v40 INK BEAD, WET EDGE (3b elements lock, Sam Nov 2 11:31am; lab v9.8 STK 13 inkBead): a glossy domed ink bead sitting in a faint watercolour stain,
 // its rim feathering into the paper (notes add, so they have wet seeping edges). Asleep = darker dim tint of its own colour, no glow, barely breathing;
 // awake = lit, a small breath; on your string (active) = BLOOM RINGS seep out from it and fade (adds). Each settled bead is painted and cut to the lane
 // once (a sprite per state); only the bloom rings are drawn live. ?stk=5 brings back v37's brush loops.
 function inkBead(g,si,bx,by,rad,c,aw,z,TT,ed){ed=ed||0;const cs=(k0,a)=>{const k=aw?k0:Math.min(k0,0)*.5-(CONOLD?.42:.06),m=k>0?c.map(v=>Math.round(v+(255-v)*k)):c.map(v=>Math.round(v*(1+k)));return 'rgba('+m.join(',')+','+a+')'};
  const R=rad*(aw?1.25:.95),A=aw?1:.9*(1-z*.25);g.save();
  if(ed>.004)beadStain(g,si,bx,by,R,cs,A*ed);
  g.globalAlpha*=A;g.fillStyle='rgba(0,0,8,.4)';g.beginPath();g.ellipse(bx+1.5,by+R*.5,R*1.1,R*.7,0,0,7);g.fill();
  const gr=g.createRadialGradient(bx-R*.3,by-R*.35,R*.1,bx,by,R*1.15);gr.addColorStop(0,cs(.35,1));gr.addColorStop(.6,cs(0,1));gr.addColorStop(1,cs(-.5,1));g.fillStyle=gr;g.beginPath();g.arc(bx,by,R,0,7);g.fill();
  g.strokeStyle=cs(.45,.6);g.lineWidth=1.4;g.beginPath();g.arc(bx,by-R*.1,R*.9,.5,2.6);g.stroke();
  const sh=aw?.85:.18;g.fillStyle='rgba(255,255,255,'+(.85*sh)+')';g.beginPath();g.ellipse(bx-R*.38,by-R*.48,R*.34,R*.14,-.6,0,7);g.fill();
  if(ed>.004)for(let i=0;i<14;i++){const q=i*.449+si,L=R*(1.15+.25*Math.sin(i*2.7));g.strokeStyle=cs(-.2,.35*ed);g.lineWidth=1.2;g.beginPath();g.moveTo(bx+Math.cos(q)*R*.95,by+Math.sin(q)*R*.95);g.lineTo(bx+Math.cos(q)*L,by+Math.sin(q)*L);g.stroke()}
  g.restore()}
 // v44 SEEP ONLY WHILE RINGING (Sam Nov 2 3:42pm): the bead's watercolour stain and wet-edge feather are its seeping outline, so they are no longer
 // baked into the sprite; they show only while the note plays (alpha = its audio envelope) and fade with the sound. Asleep or silent = the bare bead.
 // v46 (Sam Nov 2 5:03pm comment: a star that is "lit and active" should have the full splat around it, not moving as when it's playing, but
 // there): a star on your string bakes its full stain + wet edge into its sprite (still, no motion); while it sounds the S4 wash moves on top.
 // Asleep, or awake but not on your string = the bare bead (3:42pm rule).
 function beadStain(g,si,bx,by,R,cs,A){for(let i=0;i<3;i++){g.beginPath();for(let k=0;k<=40;k++){const q=k/40*6.2832,rr=R*(1.9+i*.35)*(1+.1*Math.sin(q*3+si+i)+.06*Math.sin(q*7+i));k?g.lineTo(bx+Math.cos(q)*rr,by+Math.sin(q)*rr):g.moveTo(bx+rr,by)}g.closePath();g.fillStyle=cs(0,.16*A);g.fill();g.strokeStyle=cs(-.3,.35*A);g.lineWidth=1.2;g.stroke()}}
 function beadBloom(g,si,bx,by,rad,c,TT,al){const R=rad*1.25,cs=(k,a)=>{const m=k>0?c.map(v=>Math.round(v+(255-v)*k)):c.map(v=>Math.round(v*(1+k)));return 'rgba('+m.join(',')+','+a+')'};g.save();g.globalAlpha*=al;
  for(let k=0;k<3;k++){const f=((TT*.00018+k/3)%1),r=R+R*2.6*Math.sqrt(f),fade=1-f;g.beginPath();for(let i=0;i<=40;i++){const q=i/40*6.2832,rr=r*(1+.12*(Math.sin(q*3+k*2.1+si)*.6+Math.sin(q*5+k*4.2)*.4));i?g.lineTo(bx+Math.cos(q)*rr,by+Math.sin(q)*rr*.92):g.moveTo(bx+rr,by)}g.closePath();g.fillStyle=cs(0,.18*fade);g.fill();g.strokeStyle=cs(-.25,.5*fade);g.lineWidth=1.6;g.stroke()}g.restore()}
 const BQ=[],BSP={},BFIT={},BBG={},BLOOM=typeof location!=='undefined'&&/[?&]bloom=1\b/.test(location.search); /* v41 (Sam Nov 2 12:57pm: no circles around things making sound): bloom rings off until 3b's sounding look; ?bloom=1 brings them back */
 function beadSprite(id,sd,x,y,rad,c,aw,z,ed){ed=ed||0;const k=id+':'+(aw?1:0)+':'+c+':'+ed;let sp=BSP[k];if(sp)return sp;
  if(ed&&aw){const J=wcDiscJobC(PATCHR,sd%97,c);if(!J.done)J.step(1e9);const R=Math.ceil(J.c.width/2)+2,cv=mk(2*R,2*R),Ly={c:cv,x:cv.getContext('2d'),R,cx:x,cy:y};Ly.x.setTransform(1,0,0,1,R-x,R-y);Ly.x.drawImage(J.c,x-J.c.width/2,y-J.c.height/2);cut(Ly);return BSP[k]={c:cv,R}} /* v50 ACTIVE = THE PATCH (Sam Nov 2 7:44pm: "the big white patch you have on the gate is how all stars should also look when they have been filled instead of the original shape ... this is the active look"): a star on your string becomes the opened gate's watercolour disc in its own colour, no bead; playing = the patch plus the live ripples (S4 wash) */
const R=Math.ceil(rad*(aw?1.25:.95)*3.2+6),cv=mk(2*R,2*R),Ly={c:cv,x:cv.getContext('2d'),R,cx:x,cy:y};
  Ly.x.setTransform(1,0,0,1,R-x,R-y);inkBead(Ly.x,sd,x,y,rad,c,aw,z,0,ed);cut(Ly);return BSP[k]={c:cv,R}}
 // v42 S4 SOUNDING (Sam Nov 2 2:17pm LOCK; lab v9.9 SND 4; Sam 12:57pm: no circles round things making sound): while a star sounds, one heavy flood of
 // its own colour seeps out (three filled wobbly washes, never a stroke) and the sky streaks near it light up in its colour and run; its wet edge
 // feathers longer and heavier. snd 0..1 comes from the note's own audio envelope (index.html sndOf). Drawn live, cut to the lane.
 /* v53 SEEP OUT (Sam Nov 3 9:23am: "when the seeping starts while the music plays it just flashes in fully rather than seeping out"): the notes start in 30ms, so the wash jumped to full size; now its reach grows from the bead over ~0.9s from the start of each sound (eased), while its strength still follows the sound */
 const PON={};const SON={};function seepOf(id,snd){if(snd<=.004){delete SON[id];return 0}if(SON[id]===undefined)SON[id]=T;const u=Math.min(1,(T-SON[id])/900);return 1-(1-u)*(1-u)}
 const SOFTW=!/[?&]softw=0\b/.test(location.search);
 function soundWash(g,si,bx,by,rad,c,snd,sp){if(sp===undefined)sp=1;const R=rad*1.25,cs=(k,a)=>{const m=k>0?c.map(v=>Math.round(v+(255-v)*k)):c.map(v=>Math.round(v*(1+k)));return 'rgba('+m.join(',')+','+a+')'};g.save();
  const SWN=SOFTW?12:3;for(let j=0;j<SWN;j++){const i=SOFTW?j/(SWN-1)*2.6-.3:j,rr0=R*(.7*(.45+.55*sp)+(.55+2.4*snd*(1-i*.22))*sp),al=.26*snd*(.35+.65*sp)*(SOFTW?3/SWN*(.55+.45*j/(SWN-1))*1.25:1); /* v60n soft edges (3b lead star port; tester s165-s170 stacked hard contours): 12 thin layers spread past the old 3, faint at the rim; ?softw=0 = old */g.beginPath();for(let k=0;k<=40;k++){const q=k/40*6.2832,w=1+(NOSTREAK?STW:1)*(.14*Math.sin(q*3+si+i+T*.004)+.08*Math.sin(q*7+i-T*.006));k?g.lineTo(bx+Math.cos(q)*rr0*w,by+Math.sin(q)*rr0*w):g.moveTo(bx+rr0*w,by)}g.closePath();g.fillStyle=cs(0,al);g.fill()}
  g.lineCap='round';if(!NOSTREAK)for(let k=0;k<9;k++){const ang=k*2.4+si,d=R*(1.8+3.2*((k*.37)%1))*(.35+.65*sp),L=R*(1.2+1.4*((k*.53)%1)),x0=bx+Math.cos(ang)*d+((T*.09*(1+k%3*.4))%(R*6))-R*3,y0=by+Math.sin(ang)*d*.8;g.strokeStyle=cs(.35,Math.max(0,.75*snd*sp*(1-Math.abs(x0-bx)/(R*7))));g.lineWidth=1.4;g.beginPath();g.moveTo(x0,y0);g.lineTo(x0+L,y0-L*.12);g.stroke()}
  g.restore()}
 function soundFeather(g,si,bx,by,rad,c,snd,sp){if(sp===undefined)sp=1;const R=rad*1.25,m=c.map(v=>Math.round(v*.8));g.save();for(let i=0;i<14;i++){const q=i*.449+si,L=R*(.95+(.2+.25*Math.sin(i*2.7)+snd*.3)*sp);g.strokeStyle='rgba('+m.join(',')+','+(.6*snd*sp)+')';g.lineWidth=1.2+1.2*snd;g.beginPath();g.moveTo(bx+Math.cos(q)*R*.95,by+Math.sin(q)*R*.95);g.lineTo(bx+Math.cos(q)*L,by+Math.sin(q)*L);g.stroke()}g.restore()}
 function flushBeads(g){for(const [id,sd,x,y,rad,c,aw,z,M,big,snd] of BQ){const t=aw?Math.min(1,(T-WKS[id])/1300):1,br=1+(aw?.03:.012)*Math.sin(T*(aw?.0016:.0008)+sd*1.7);
   if(snd>.004){const Ly=layer('sw',x,y,Math.ceil(rad*1.25*7.5),1),R=rad*(aw?1.25:.95),cs=(k,a)=>{const m=k>0?c.map(v=>Math.round(v+(255-v)*k)):c.map(v=>Math.round(v*(1+k)));return 'rgba('+m.join(',')+','+a+')'};const sp=seepOf(id,snd);soundWash(Ly.x,sd,x,y,rad,c,snd,sp);if(!big)beadStain(Ly.x,sd,x,y,R,cs,snd*sp);{const da=L.doorAmt?L.doorAmt(x,y,9):-1,sc=L.sealClip(y,da);if(sc&&sc.sy!==undefined)sealErase(Ly.x,x,sc.sy,sc.rr,sc.f,x-Ly.R,y-Ly.R,2*Ly.R,2*Ly.R);else if(sc!==undefined){const q=Ly.x,cy=y-26,gr=q.createLinearGradient(0,cy+6,0,cy-10);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');q.save();q.globalCompositeOperation='destination-out';q.fillStyle=gr;q.fillRect(x-Ly.R,y-Ly.R,2*Ly.R,cy+6-(y-Ly.R));q.restore()}} /* v60y (Sam Nov 5 1:26pm: 'make sure the seeping visual effect doesn't cross over the top of the wall behind it'): a sealed door's own star wash stops at its seal like its door wash (soundAt clipY); it showed in the lane past the seal */layerOut(g,Ly,M)}
   const one=(a,al)=>{if(al<=.01)return;const pk=a&&big,sp=beadSprite(id,sd,x,y,rad,c,a,z,pk?1:0);let gw=1;if(pk){if(PON[id]===undefined)PON[id]=T;const u=Math.min(1,(T-PON[id])/1100);gw=1-(1-u)*(1-u)}else if(a)delete PON[id];const h=sp.R*br*(pk?.3+.7*gw:1);g.save();g.globalAlpha=M*al*(pk?.35+.65*gw:1); /* v53 SEEP OUT: a star joining your string grows its patch out from the bead over ~1.1s instead of popping in */g.drawImage(sp.c,x-h,y-h,2*h,2*h);g.restore()};
   if(!aw||t<1)one(0,aw?1-wsm(.55,1,t):1);if(aw)one(1,t<1?.3+.7*Math.sqrt(t):1);if(snd>.004){const Ly=layer('sf',x,y,Math.ceil(rad*1.25*2.2));soundFeather(Ly.x,sd,x,y,rad,c,snd,seepOf(id,snd));layerOut(g,Ly,M)}
   if(big&&BLOOM){if(!BBG[id])BBG[id]=T;const bg=wsm(0,1,(T-BBG[id])/900);let f=BFIT[id];if(f===undefined){f=1;const Rb=rad*1.25*4.1;for(let i=0;i<32;i++){const a=i/32*6.2832;if(sdf(x+Math.cos(a)*Rb,y+Math.sin(a)*Rb)<4){f=0;break}}BFIT[id]=f}
    if(f)beadBloom(g,sd,x,y,rad,c,T-BBG[id],M*bg);else{const Ly=layer('bb',x,y,Math.ceil(rad*1.25*4.2+4));beadBloom(Ly.x,sd,x,y,rad,c,T-BBG[id],1);layerOut(g,Ly,M*bg)}}else BBG[id]=0}BQ.length=0}
 function starWc(g,id,sd,x,y,rad,col,aw,z,M,wall,big,snd){
  if(STK===13){if(aw&&!WKS[id])WKS[id]=T;if(!aw)WKS[id]=0;if(wall===false){inkBead(g,sd,x,y,rad,col,aw,z,T,aw?Math.max(snd||0,big?1:0):0);g.globalAlpha=M;return}BQ.push([id,sd,x,y,rad,col,aw,z,M,!!(big&&aw),aw?snd||0:0]);return} /* v40 ink bead */
  if(STK===5&&!(big&&aw)){if(aw&&!WKS[id])WKS[id]=T;if(!aw)WKS[id]=0;BGS[id]=0;const t=aw?Math.min(1,(T-WKS[id])/1300):1;
   if(wall===false){const L2=[];loopsOf(id,sd,x,y,rad,col,aw,z,t,1,L2);g.save();for(const [,s2,x2,y2,r2,c2,a2,al] of L2){g.globalAlpha=al;brushLoop(g,x2,y2,r2*(a2?1.85:1.7),c2,a2,s2,T)}g.restore();g.globalAlpha=M;return} // a sprite (a blurred far star): drawn straight in, its own coordinates
   loopsOf(id,sd,x,y,rad,col,aw,z,t,M,RQ);return}
  if(wall===false){g.save();drawWcStar1(g,id,sd,x,y,rad,col,aw,z,false,0,T);g.restore();g.globalAlpha=M;return} // a sprite (a blurred far star): its own coordinates, no lane cut
  big=!!(big&&aw);if(big&&!SDEF){SSQ.push([id,sd,x,y,rad,col,aw,z,M,wall,big]);return}
  if(STK===5&&big&&WKS[id]&&T-WKS[id]<1300)RQ.push([id,sd,x,y,rad,col,0,M*(1-wsm(.55,1,(T-WKS[id])/1300))]); // reached as it wakes: its sleeping loop fades out under the growing circle // a reached star's circle is drawn over the string (look.after)
  if(big){if(!BGS[id])BGS[id]=T}else BGS[id]=0;if(aw&&!WKS[id])WKS[id]=T;if(!aw)WKS[id]=0;
  const t=aw?Math.min(1,(T-WKS[id])/1300):1,bg=big?wsm(0,1,(T-BGS[id])/1100):0,key=big?(bg>=1&&t>=1&&bigSprite(col)?'B':''):aw?(t>=1?'A':''):'S',R=big?Math.ceil(BIGR*2.6):Math.ceil(rad*3.6+14);
  if(key){const kk=id+key+col;let c=SCC[kk];if(!c){const r=Math.min(R,Math.ceil(key==='S'?rad*2.6+3:key==='A'?rad*3.2+3:R)); /* v35b: sized from what it draws (corona, dab), not cropped by reading pixels back (a hitch when a star settled mid-drag) */
   const Ly={c:mk(2*r,2*r),R:r};Ly.x=Ly.c.getContext('2d');Ly.cx=x;Ly.cy=y;Ly.x.setTransform(1,0,0,1,r-x,r-y);drawWcStar1(Ly.x,id,sd,x,y,rad,col,aw,0,false,bg,T);cut(Ly);c=SCC[kk]={c:Ly.c,ox:-r,oy:-r}}
   g.save();g.globalAlpha=M*(key==='S'?1-z*.35:1);g.drawImage(c.c,x+c.ox,y+c.oy);g.restore();return}
  const Ly=layer('s'+id,x,y,R);drawWcStar1(Ly.x,id,sd,x,y,rad,col,aw,z,false,bg,T);layerOut(g,Ly,M)}
 // gates: geometry from the sdf (lab drawWcGates: lo/hi = the lane's edges across the gate, +6); the lane's direction is the long way
 const GGEO={};function gateGeom(id,x,y){let Q=GGEO[id];if(Q&&Q.x===x&&Q.y===y)return Q;const ext=(dx,dy)=>{let a=0;while(a<160&&sdf(x+dx*a,y+dy*a)>0)a+=2;return a};
  const t=[0,flip?-1:1] /* v48 (Sam 5:05pm: ends look like regular gates): every gate sits across an upward lane, so the rings and word always face the same way; the end's wide chamber used to turn it sideways */,nx=-t[1],ny=t[0];return GGEO[id]={x,y,t,lo:-ext(-nx,-ny)-6,hi:ext(nx,ny)+6,HH:96}}
 function drawGateStar(g,Q,e,age,lane,noGl){const b=wsm(.35,.8,e),R=Math.max(10,lane*1.05);if(b<=0)return;const fl=Math.exp(-Math.max(0,age-.5)*1.6),st=b*(.55+.45*fl);if(st<=0)return;
  g.save();g.translate(Q.x,Q.y);{const J=Q.col?wcDiscJobC(R,(Q.x|0)%97,Q.col):wcDiscJob(R,(Q.x|0)%97);if(!J.done)J.step(1e9);const dk=J.c,ds=(.7+.3*b)*(1+.02*Math.sin(age*1.3)); /* lab v9.1: the rings' white fill hands over to the corona's disc at near full size */g.globalAlpha=Math.min(1,b*1.4);g.drawImage(dk,-dk.width*ds/2,-dk.height*ds/2,dk.width*ds,dk.height*ds)} // Sam 8:26pm: a gold CIRCLE filling the gate's spot (a little behind it too); the white string seeps out from its edge
  g.globalAlpha=1;g.globalCompositeOperation='source-over'; /* lab v8.8 (tester 8:43pm): never adds up to white */
  const GL=Q.col?Q.col.join(','):GG.glow;let gr=g.createRadialGradient(0,0,0,0,0,R*.9);gr.addColorStop(0,'rgba('+GL+','+(.3*st)+')');gr.addColorStop(.25,'rgba('+GL+','+(.2*st)+')');gr.addColorStop(1,'rgba('+GL+',0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,R,0,7);g.fill();
  for(let i=0;i<14;i++){const a=i*Math.PI*2/14+.13+age*.05,L=R*(.6+.12*((i*53)%7)/6);const rg=g.createLinearGradient(0,0,Math.cos(a)*L,Math.sin(a)*L);rg.addColorStop(0,'rgba('+GL+','+(.3*st)+')');rg.addColorStop(1,'rgba('+GL+',0)');g.strokeStyle=rg;g.lineWidth=4+(i%3)*2;g.lineCap='round';g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a)*L,Math.sin(a)*L);g.stroke()}
  gr=g.createRadialGradient(0,0,0,0,0,R*.32);gr.addColorStop(0,'rgba('+(Q.col?Q.col.map(v=>Math.round(v+(255-v)*.3)).join(','):GG.core)+','+(.45*st)+')');gr.addColorStop(.5,'rgba('+GL+','+(.3*st)+')');gr.addColorStop(1,'rgba('+GL+',0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,R*.32,0,7);g.fill();
  if(!noGl)gateGlints(g,R,age,st);
  g.restore()}
 function gateGlints(g,R,age,st,room){for(let k=0;k<4;k++){const an=k*1.9+age*.35*(k&1?-1:1),rr=R*(.25+.18*k),tw=Math.max(0,Math.sin(age*2.3+k*1.4)),px=Math.cos(an)*rr,py=Math.sin(an)*rr;glint(g,px,py,3+3*tw,st*tw*tw,room?room(px,py):undefined)}} // the same glints as the gate gold
 function drawGateLabel(g,Q,nx,ny,tx,ty,a){const up=(vx,vy)=>{let an=Math.atan2(vy,vx);if(an>Math.PI/2)an-=Math.PI;if(an<-Math.PI/2)an+=Math.PI;return an};g.save();g.globalAlpha=a;
  /* v37 CURVED UNDER (Sam Nov 2 7:31am, lab LBL 4): the word set along an arc on the side you arrive from, like the inscription round a seal */
  const R0=(Q.HH||80)/2+30,txt='octave',th=up(nx,ny),sy=tx*Math.sin(th)-ty*Math.cos(th),bot=sy>0;g.translate(Q.x,Q.y);g.rotate(th);g.font="italic 600 19px Georgia, serif";g.textAlign='center';g.textBaseline='middle';
  const ws=[...txt].map(c=>g.measureText(c).width+2),tot=ws.reduce((u,v)=>u+v,0);g.fillStyle='rgba('+GG.glow+',.95)';g.shadowColor='rgba('+GG.glow+',.6)';g.shadowBlur=6;
  let an=bot?Math.PI/2+tot/R0/2:-Math.PI/2-tot/R0/2;
  [...txt].forEach((c,i)=>{const a2=bot?an-ws[i]/2/R0:an+ws[i]/2/R0;g.save();g.translate(Math.cos(a2)*R0,Math.sin(a2)*R0);g.rotate(bot?a2-Math.PI/2:a2+Math.PI/2);g.fillText(c,0,0);g.restore();an+=bot?-ws[i]/R0:ws[i]/R0});g.restore()}
 // v37 RINGS IN RINGS (Sam Nov 2 7:26-7:29am, lab v9.1 GVAR 10 / ORBR 1): two concentric rings, inside-out like the string's colours (outer = the
 // base note, inner = the newer note); the ratio is the number of beads on each ring, all at one speed (octave = 1 | 2, pitch gate 1 | 1)
 function ringGeom(Q){const eg=22,gp=10,span=Q.hi-Q.lo-2*eg,cw=(span-gp)/2,HH=Math.round(Math.min(96,span*.66));return {HH,Rm:Math.min(35,Math.min((cw*2+gp)/2,HH*.62)*.92)}} /* v48: one gate size (the middle gates' ~33-35): an end in a wide chamber drew at 55 */
 function ringsBlack(q,Rm,fa){q.globalAlpha=fa;q.fillStyle='rgba(5,4,12,.95)';q.beginPath();q.arc(0,0,Rm,0,7);q.fill()} /* v40 (3b elements lock, Nov 2; lab v9.8 GVAR 10): a gate removes all your notes, so a black pool fills all its rings */
 function ringsStill(q,Rm,fa,n){q.strokeStyle='rgba('+GG.glow+',1)';(n===3?[Rm,Rm*.68,Rm*.38]:[Rm,Rm*.56]).forEach((r,j)=>{q.globalAlpha=fa*.9;q.lineWidth=j>1?2.4:j?3:3.6;q.beginPath();q.arc(0,0,r,0,7);q.stroke();q.globalAlpha=fa*.16;q.lineWidth=9;q.stroke()});
  q.globalAlpha=fa*.8;q.fillStyle='rgb('+GG.rim+')';q.beginPath();q.arc(0,0,4,0,7);q.fill();q.globalAlpha=1}
 function inkDot(q,x,y,r,c,fa,sw,ha){ha=ha===undefined?1:ha;const s=c.join(',');if(ha>.004){const h=q.createRadialGradient(x,y,r*.6,x,y,r*2.3*sw);h.addColorStop(0,'rgba('+s+','+(.55*fa*ha)+')');h.addColorStop(1,'rgba('+s+',0)');q.globalAlpha=1;q.fillStyle=h;q.beginPath();q.arc(x,y,r*2.3*sw,0,7);q.fill()}
  const d=c.map(v=>Math.round(v*.62)).join(','),l=c.map(v=>Math.round(v+(255-v)*.28)).join(','),b=q.createRadialGradient(x-r*.3,y-r*.35,r*.1,x,y,r*sw);b.addColorStop(0,'rgba('+l+','+fa+')');b.addColorStop(.7,'rgba('+s+','+fa+')');b.addColorStop(1,'rgba('+d+','+fa+')');q.fillStyle=b;q.beginPath();q.arc(x,y,r*sw,0,7);q.fill()} /* v43 (3b hum v1): a gate's bead in its note's colour = a small ink bead; paint never glints */
 function humMark(q,Rm,fa,hum){if(!hum)return;const s=hum.col.join(',');q.globalAlpha=fa;q.strokeStyle='rgba(5,4,12,1)';q.lineWidth=13;q.beginPath();q.arc(0,0,Rm*.56,0,7);q.stroke(); /* v43 F ONE RING (Sam 2:38pm): the inner ring is gone, one ring = bring one note */
  q.lineWidth=5.6;q.beginPath();q.arc(0,0,Rm,0,7);q.stroke();q.globalAlpha=fa*.95;q.strokeStyle='rgba('+s+',1)';q.lineWidth=3.6;q.stroke();q.globalAlpha=fa*.16*(hum.amp||0);q.lineWidth=9;q.stroke();q.globalAlpha=fa;q.fillStyle='rgba('+s+',1)';q.beginPath();q.arc(0,0,4.2,0,7);q.fill();q.globalAlpha=1} /* v43 E RED RINGS (Sam 2:28pm LOCK): outlined + black inside = takes notes; rings, beads and centre in the note's colour = has a note. No halo swell: sounding = the S4 wash (gateSound) */
 function ringsBeads(q,Rm,fa,lit,n2,t,hum){q.lineCap='round';humMark(q,Rm,fa,hum);const tc=hum?'rgba('+hum.col.join(',')+',1)':'rgba('+GG.glow+',1)';q.strokeStyle=tc;q.lineCap='round';const rr=n2===3?[Rm,Rm*.68,Rm*.38]:[Rm,Rm*.56],nd=n2===3?[1,2,4]:[1,n2]; /* v52 THREE-RING gate (Sam card Nov 3 8:19am; Levels D^/E^): rings 1, 2, 4 beads, all in sync */
  rr.forEach((r,j)=>{if(j&&hum)return;const a=t*1.4; /* v43 (Sam 2:29pm): both rings turn in sync, beads lined up, so the bead count alone shows the ratio */for(let m=0;m<nd[j];m++){const am=a+m*Math.PI*2/nd[j];q.lineWidth=j>1?2.8:j?3.4:4;for(let k=0;k<10;k++){q.globalAlpha=fa*.7*(1-k/10);q.beginPath();q.arc(0,0,r,am-(k+1)*.09*(Rm/r)*.6,am-k*.09*(Rm/r)*.6);q.stroke()}
    const bx=Math.cos(am)*r,by=Math.sin(am)*r;if(hum){inkDot(q,bx,by,(j?4:4.8)*1.25,hum.col,fa,1,hum.amp||0);q.strokeStyle=tc;continue}q.globalAlpha=fa;q.fillStyle='rgb('+GG.hi+')';q.beginPath();q.arc(bx,by,j>1?3.4:j?4:4.8,0,7);q.fill();glint(q,bx,by,5,fa*.6*lit)}});q.globalAlpha=1}
 // o: {n: 2 octave (1|2) or 1 pitch gate (1|1), op: 0..1 opening, age: s since the tie, fl: 0..1 shake (wrong pair), label: the word}
 L.mgAt=(g,lk,x,y,src,al,nocut,mode)=>{if(!LMASK)return;const R=src.width/2,Ly=layer(lk,x,y,R);Ly.x.drawImage(src,x-R,y-R);const q=Ly.x;q.setTransform(1,0,0,1,0,0);q.globalCompositeOperation='destination-in';if(!nocut)q.drawImage(LMASK,Ly.R-Ly.cx,Ly.R-Ly.cy,W,H);q.globalCompositeOperation='source-over';g.save();g.globalAlpha=al===undefined?1:al;if(mode)g.globalCompositeOperation=mode;g.drawImage(Ly.c,Ly.cx-Ly.R,Ly.cy-Ly.R);g.restore()}; /* icon thread (Sam Nov 5 3:23pm): the red/green merge under a stargate, cut to the lane like the start patch */
 L.patch=(g,x,y,R,seed,c,k,lk)=>{if(!LMASK)return;const J=c?wcDiscJobC(R,seed,c):wcDiscJob(R,seed);if(!J.done)J.step(1e9);const P=Math.ceil(J.c.width/2)+2,Ly=layer(lk||'pt',x,y,P),w=J.c.width*(k||1),h=J.c.height*(k||1);Ly.x.drawImage(J.c,x-w/2,y-h/2,w,h);if(lk){const q=Ly.x;q.setTransform(1,0,0,1,0,0);q.globalAlpha=1;q.globalCompositeOperation='destination-in';q.drawImage(LMASK,Ly.R-Ly.cx,Ly.R-Ly.cy,W,H);q.globalCompositeOperation='source-over';g.save();g.globalCompositeOperation='source-over';g.drawImage(Ly.c,Ly.cx-Ly.R,Ly.cy-Ly.R);g.restore()}else layerOut(g,Ly,g.globalAlpha)}; /* v60s from 3b gates v16 (Sam Nov 5 9:13am 'bloom directly from the former into the latter'): k scales the patch so the end door's bloom grows into it; lk = its own layer, cut straight from LMASK every frame (a cached cut jumped when the split ended) */ /* v50 (Sam 7:44pm): the start = the opened gate's white patch (it is where the last board's end opened) */
 L.patchJ=(g,x,y,J,lk)=>{if(!LMASK)return;if(!J.done)J.step(1e9);const P=Math.ceil(Math.max(J.c.width,J.c.height)/2)+2,Ly=layer(lk,x,y,P);Ly.x.drawImage(J.c,x-J.c.width/2,y-J.c.height/2);const q=Ly.x;q.setTransform(1,0,0,1,0,0);q.globalAlpha=1;q.globalCompositeOperation='destination-in';q.drawImage(LMASK,Ly.R-Ly.cx,Ly.R-Ly.cy,W,H);q.globalCompositeOperation='source-over';g.save();g.globalCompositeOperation='source-over';g.drawImage(Ly.c,Ly.cx-Ly.R,Ly.cy-Ly.R);g.restore()}; /* stack-trail: L.patch for a ready-made paint job (wcShapeC) */
 L.gate=(g,id,x,y,o)=>{const Q=gateGeom(id,x,y),[tx,ty]=Q.t,nx=-ty,ny=tx,op=o.op||0,_c=(Q.col=o.col||null),e=op*op*(3-2*op),{HH,Rm}=ringGeom(Q);Q.HH=HH;
  const lane=Math.min(60,Math.min(-Q.lo,Q.hi)-9) /* v48: corona no bigger than a middle gate's (the c4 end flooded its whole chamber) */,M=g.globalAlpha,n2=o.n===3?3:o.n===2?2:1,sd=(Q.x|0)%97;if(!LMASK)return;
  if(!Q.q){Q.q=1;JOBQ.push(Q.col?wcDiscJobC(Math.max(10,lane*1.05),sd,Q.col):wcDiscJob(Math.max(10,lane*1.05),sd));JOBQ.push(Q.col?wcDiscJobC(Rm,sd+1,Q.col):wcDiscJob(Rm,sd+1))} /* v57: a hand-off gate opens in the color of the note it hands you */ // the corona's disc and the rings' white fill, baked ahead
  if(op>0)GSQ.push([Q,e,o.age||0,lane,M]); // drawn over the string (it passes right through the light)
  if(o.hum&&o.hum.amp>.004&&e<.97){const Ly=layer('gw',Q.x,Q.y,Math.ceil(Rm*.625*7.5),1);soundWash(Ly.x,sd,Q.x,Q.y,Rm*.5,o.hum.col,o.hum.amp,seepOf('g'+id,o.hum.amp));layerOut(g,Ly,M)} /* v43: a note gate sounding = the S4 wash in its note's colour (3b, Sam: no circles) */
  if(e>.97)return;const RL=Math.ceil(Math.max(-Q.lo,Q.hi,HH/2+60)+40),t=T/1000;
  if(Q.fit===undefined){Q.fit=1;for(let i=0;i<40;i++){const a=i/40*6.2832;if(sdf(Q.x+Math.cos(a)*(Rm+9),Q.y+Math.sin(a)*(Rm+9))<4){Q.fit=0;break}}} /* do the rings and their beads' glints sit clear of the walls? then the beads need no cut */
  if(op===0&&!o.fl){ /* a shut gate: its rings and word are painted and cut once; only the beads go round each frame */
   const ck=o.n+':'+!!o.label+':'+!!o.hum;if(!Q.sc||Q.sck!==ck){const c=mk(2*RL,2*RL),Ly={c,x:c.getContext('2d'),R:RL,cx:Q.x,cy:Q.y},q=Ly.x;q.setTransform(1,0,0,1,RL-Q.x,RL-Q.y);q.save();q.translate(Q.x,Q.y);q.transform(nx,ny,-ny,nx,0,0);ringsBlack(q,Rm,1);if(!o.hum)ringsStill(q,Rm,1,o.n);q.restore(); /* v44: a note gate has no white rings or halo under its one colour ring */
    if(o.label)drawGateLabel(q,Q,nx,ny,tx,ty,1);cut(Ly);Q.sc=crop(Ly);Q.sck=ck}
   g.save();g.globalAlpha=M;g.drawImage(Q.sc.c,Q.x+Q.sc.ox,Q.y+Q.sc.oy);g.restore();
   if(Q.fit){g.save();g.translate(Q.x,Q.y);g.transform(nx,ny,-ny,nx,0,0);ringsBeads(g,Rm,M,1,n2,t,o.hum);g.restore()}
   else{const Ly=layer('gb'+id,Q.x,Q.y,Math.ceil(Rm+20)),q=Ly.x;q.save();q.translate(Q.x,Q.y);q.transform(nx,ny,-ny,nx,0,0);ringsBeads(q,Rm,1,1,n2,t,o.hum);q.restore();layerOut(g,Ly,M)}
   return}
  const Ly=layer('g'+id,Q.x,Q.y,RL),q=Ly.x;q.save();q.translate(Q.x,Q.y);q.transform(nx,ny,-ny,nx,0,0);let tb=t;if(o.fl){const tm=T;q.translate(2.2*Math.sin(tm*.09)*(Math.sin(tm*.004)>0?1:.2)*Math.min(1,o.fl*1.6)*1.6,0);tb=(tm-((tm*.03)%40)*12)/1000} /* v40 W2 JAR (3b lock, Nov 2): the rings shake side to side and the beads stutter, like a stuck lock */
  const fa=1-wsm(.35,.6,e),lit=1+1.5*wsm(0,.3,e)*(1-wsm(.4,.6,e)),f1=wsm(.02,.4,e);if(fa>0)ringsBlack(q,Rm,fa);
  if(f1>0){const J=Q.col?wcDiscJobC(Rm,sd+1,Q.col):wcDiscJob(Rm,sd+1);if(!J.done)J.step(1e9);const d=J.c,k=Math.max(4,Rm*f1)/Rm;q.globalAlpha=Math.min(1,f1*1.6);q.drawImage(d,-d.width*k/2,-d.height*k/2,d.width*k,d.height*k)} // opening: white fills the rings from the centre out (inside-out, like the colours), then becomes the circle
  if(fa>0){if(!o.hum)ringsStill(q,Rm,fa,o.n);ringsBeads(q,Rm,fa,lit,n2,tb,o.hum)}
  q.restore();if(o.label&&e<.97)drawGateLabel(q,Q,nx,ny,tx,ty,1-e);layerOut(g,Ly,M)};
 // after the string: reached stars' circles, then the opened gates' gold (lab frame order)
 L.after=g=>{if(!LMASK)return;SDEF=1;for(const q of SSQ)starWc(g,...q);SDEF=0;SSQ.length=0;flushLoops(g);flushBeads(g); /* v37: the stars' brush loops, after the string (lab v9.5 flushRings) */for(const [Q,e,age,lane,M] of GSQ){const RL=Math.ceil(Math.max(10,lane*1.05)*1.5+10); /* the disc (1.45R) and its rays */
   if(age>2.5&&e>=1){ /* v35 speed: once the light has settled (its flare gone) it is painted and cut once; only its glints move after that */
    if(!Q.oc){const c=mk(2*RL,2*RL),Ly={c,x:c.getContext('2d'),R:RL,cx:Q.x,cy:Q.y};Ly.x.setTransform(1,0,0,1,RL-Q.x,RL-Q.y);drawGateStar(Ly.x,Q,1,2.5,lane,1);cut(Ly);Q.oc={c,ox:-RL,oy:-RL}} /* v35b: no crop (a pixel readback mid-drag was a hitch); the disc nearly fills the layer anyway */
    g.save();g.globalAlpha=M;g.drawImage(Q.oc.c,Q.x+Q.oc.ox,Q.y+Q.oc.oy);g.translate(Q.x,Q.y);gateGlints(g,Math.max(10,lane*1.05),age,.55*M,(u,v)=>sdf(Q.x+u,Q.y+v)-3.5);g.restore();continue}
   Q.oc=null;const Ly=layer('o'+Q.x+','+Q.y,Q.x,Q.y,RL);drawGateStar(Ly.x,Q,e,age,lane);layerOut(g,Ly,M)}GSQ.length=0};
 if(ELW&&o.cols){ /* v35b: everything a drag can need is baked ahead, in the order it is needed: the string's noise table, each star's waking grey and
   woken dabs, the reached-star circles; then the gates' gold (queued by L.gate); then the sleeping dabs of stars not drawn yet and more noise table */
  const hs=id=>{let sd=0;for(let i=0;i<id.length;i++)sd=(sd*31+id.charCodeAt(i))%997;return sd},STS=(o.stars||[]).map(([x,y,r,c])=>({sd:hs((x|0)+','+(y|0)),c}));
  JOBQ.push(btJob(2560));for(const c of o.cols)for(let v=0;v<3;v++)JOBQ.push(wcStarJob(c,14*1.2,awSeed(c,v),false));for(const q of STS)if(q.c)JOBQ.push(wcStarJob(sleepCol(q.c),14*1.2,q.sd,false));
  for(const c of o.cols)JOBQ.push(bigJob(c));
  const later={done:false,step(){later.done=true;for(const q of STS)JOBQ.push(wcStarJob(sleepCol([200,198,214]),14*1.2,q.sd,false));JOBQ.push(btJob(5120));return true}};JOBQ.push(later);for(const P of pw.DOORP||[])if(P&&!P.done)JOBQ.push(pw.doorJob(P)) /* v60: each door's open lane, baked ahead */} // (queued behind the gates, which L.gate queues on the first frame)
 if(o.lead){const [x0,y0,x1,y1]=o.lead;for(let s=0;s<=110;s+=10){const t=s/Math.max(1,Math.hypot(x1-x0,y1-y0));stamp(x0+(x1-x0)*t,y0+(y1-y0)*t,46,1)}}
 return L}

// ---------------------------------------------------------------- watercolour elements (lab v7.9, Sam Nov 1 6:26pm LOCKED) ------------
// 3b's wcBake / wcStar / drawWcStar, verbatim but for colours as [r,g,b] and the drawing context passed in. SVAR 1 = Dab (Sam has
// not picked Dab / Halo / Burst yet; ?sv=2|3 shows the others). ?el=0 brings back the v31 star body.
const ELW=!/[?&]el=0\b/.test(typeof location!=='undefined'?location.search:''),SVAR=+(QP.get('sv')||1),WCS={},WKS={},STK=+(QP.get('stk')||13); /* v37: stars before you reach them, lab v9.5 STK 5 (brush circle); ?stk=0 = the v36 dabs */
const wsm=(a,b,t)=>{t=Math.max(0,Math.min(1,(t-a)/(b-a)));return t*t*(3-2*t)};
// f(X,Y) = signed distance (negative inside). layers: outer first, {c:[r,g,b], inset:px}. opt: {wob, halo, lift, liftR, cx, cy, op}
function wcBake(w,h,f,layers,seed,opt){const j=wcJob(w,h,f,layers,seed,opt);j.step(1e9);return j.c}
function wcJob(w,h,f,layers,seed,opt){const c=mk(w,h);const x=c.getContext('2d'),im=x.createImageData(w,h),D=im.data;
  const K=layers.map(L=>L.c.map(v=>-Math.log(Math.max(6,v)/255))),Lc=layers.length,cq=new Float32Array(Lc);let Yn=0;
  const rowY=Y=>{for(let X=0;X<w;X++){const d0=f(X+.5,Y+.5);if(d0>(opt.halo||0)*2.3+4)continue;
    const mm=fbm(X/8,Y/8,seed),n=fbm(X/3.5,Y/3.5,seed+5)*.6+vnz(X/1.2,Y/1.2,seed+9)*.4;let ds=0,a0=0,a1=0,a2=0,cov0=0,rim0=0;
    for(let q=Lc-1;q>=0;q--){const L=layers[q],e=-(d0+L.inset)+(mm-.5)*(opt.wob||4)*(q?1.3:1)+(n-.5)*1.4;
      const cov=q?wsm(-MIXB*.45,MIXB*.55,e):wsm(-.7,1.6,e);cq[q]=cov;if(cov<=0)continue;const rim=(1-wsm(.6,4.5,e))*cov;
      let dens=cov*(.55+.35*wsm(0,10,e)+.6*rim)*(1+(n-.5)*.9);for(let r=q+1;r<Lc;r++)dens*=1-.92*wsm(.15,1,cq[r]);
      ds+=dens;a0+=dens*K[q][0];a1+=dens*K[q][1];a2+=dens*K[q][2];if(!q){cov0=cov;rim0=rim}}
    const k=(Y*w+X)*4;let al=cov0*(opt.op||.96);
    if(opt.halo&&d0>-2){const hb=.26*Math.exp(-Math.max(0,d0)/opt.halo)*(1-wsm(opt.halo*1.2,opt.halo*2.2,d0))*(.6+.8*mm)*(1-cov0);al=Math.max(al,hb);if(ds<=0||opt.hc){const HK=opt.hc?opt.hc.map(v=>-Math.log(v/255)):K[0],hw=(1-cov0)*hb;ds+=hw;a0+=hw*HK[0];a1+=hw*HK[1];a2+=hw*HK[2]}} // faint bleed into the sky
    if(al<=.004||ds<=0)continue;const iv=1/ds,sh=(1-.3*rim0)*(.94+.12*n);let r=255*Math.exp(-a0*iv*.9)*sh,g2=255*Math.exp(-a1*iv*.9)*sh,b=255*Math.exp(-a2*iv*.9)*sh;
    if(opt.lift){const rr=Math.hypot(X+.5-opt.cx,Y+.5-opt.cy)/opt.liftR,l=opt.lift*(1-wsm(.75,1.05,rr+(mm-.5)*.35))+opt.lift*.35*Math.exp(-rr*rr*.6);const TT=opt.tint||[255,250,232];r+=(TT[0]-r)*l;g2+=(TT[1]-g2)*l;b+=(TT[2]-b)*l} // paper left bare in the middle = the star's light
    D[k]=r;D[k+1]=g2;D[k+2]=b;D[k+3]=255*Math.min(1,al)}};
  const J={c,done:false,step(ms){const t0=performance.now();while(Yn<h){rowY(Yn++);if(performance.now()-t0>ms)break}if(Yn>=h&&!J.done){x.putImageData(im,0,0);J.done=true}return J.done}};return J}
function wcStarIf(c0,rad,seed,end){const key='s'+c0+rad+seed+end+MIXB+'v'+SVAR;if(WCS[key])return WCS[key];const j=wcStarJob(c0,rad,seed,end);if(j.done)return WCS[key]=j.c;bump(j);return null} // v35b: never bakes; queues it first
function wcStar(c0,rad,seed,end){const key='s'+c0+rad+seed+end+MIXB+'v'+SVAR;if(WCS[key])return WCS[key];const j=wcStarJob(c0,rad,seed,end);j.step(1e9);return WCS[key]=j.c}
function wcStarJob(c0,rad,seed,end){const key='s'+c0+rad+seed+end+MIXB+'v'+SVAR;if(WCJ[key])return WCJ[key];const R=end?rad*1.3:rad*.95,P=Math.ceil(R*(SVAR===3?3.3:SVAR===2?2.6:2.5)),S=P*2,cx=P,cy=P;
  const f=(X,Y)=>{const a=Math.atan2(Y-cy,X-cx),r=Math.hypot(X-cx,Y-cy);let d=r-R*(1+.05*Math.sin(a*3+seed)+.035*Math.sin(a*5+seed*1.7));
    if(SVAR===2)d=Math.min(d,Math.abs(r-R*1.75*(1+.04*Math.sin(a*4+seed)))-R*.13); // Halo: a painted ring of the same wash around the dab
    if(SVAR===3){const n=end?12:8,k=Math.round(a/(2*Math.PI/n))*(2*Math.PI/n),L=R*(2.9+.35*Math.sin(k*3+seed)),dr=r*Math.abs(Math.sin(a-k))-R*.24*Math.max(0,1-r/L);if(r<L)d=Math.min(d,dr)} // Burst: brushed rays tapering out
    return d};
  const layers=end?[{c:[236,196,120],inset:0},{c:[255,226,160],inset:R*.32},{c:c0,inset:R*.58}]:[{c:c0.map(v=>v*.82),inset:0},{c:c0,inset:R*.38}];
  return WCJ[key]=wcJob(S,S,f,layers,seed,{wob:R*.16,halo:R*.6,lift:.7,liftR:R*(end?.42:.4),cx,cy,tint:end?[255,224,150]:c0.map(v=>Math.round(v+(255-v)*.3))})} /* lab v7.9 7:54pm: the middle lifts toward the star's own colour, never bare paper */
// lab v8.6 (3b, Sam 8:33pm "ship it"): sleeping stars a stronger hint of the colour they are handed (the game hands a sleeping star the neutral
// (200,198,214), never its pitch, so no pitch shows before it wakes)
const sleepCol=c=>c.map((v,i)=>Math.min(255,Math.round(v*.68+[104,108,128][i]*.28)));
// lab v8.6/v8.8: every star wears the corona's soft glow and 12 rays in its own colour (v8.8, tester 8:43pm: source-over, so the glow can only
// reach the star's own colour and never stacks up to white)
function starCorona(g,cx,cy,R,col,a,age){if(a<=.01)return;const c=col.join(',');g.save();g.translate(cx,cy);g.globalCompositeOperation='source-over';
  let gr=g.createRadialGradient(0,0,0,0,0,R);gr.addColorStop(0,`rgba(${c},${.55*a})`);gr.addColorStop(.3,`rgba(${c},${.22*a})`);gr.addColorStop(1,`rgba(${c},0)`);g.fillStyle=gr;g.beginPath();g.arc(0,0,R,0,7);g.fill();
  for(let i=0;i<12;i++){const an=i*Math.PI/6+.2+age*.04,L=R*(.75+.25*((i*53)%7)/6);const rg=g.createLinearGradient(0,0,Math.cos(an)*L,Math.sin(an)*L);rg.addColorStop(0,`rgba(${c},${.45*a})`);rg.addColorStop(1,`rgba(${c},0)`);g.strokeStyle=rg;g.lineWidth=3+(i%3)*1.5;g.lineCap='round';g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(an)*L,Math.sin(an)*L);g.stroke()}
  g.restore()}
// Sam 8:26pm (lab v8.5+): a star the string has reached becomes a CIRCLE in its own colour around the whole string there, drawn over the string,
// its colour seeping from it. Stars off the string stay small. bg 0..1 = how far the circle has grown.
const BIGR=40;
function bigSprite(col0){const sd=(col0[0]*7+col0[1]*13+col0[2]*17)%97,key='s'+col0+(BIGR/.95)+sd+false+MIXB+'v'+SVAR;if(WCS[key])return WCS[key];
  const J=bigJob(col0);if(J.done)return WCS[key]=J.c;return null} /* baked in the background from the board's colours (Look.make o.cols), so reaching a star never waits ~30ms on a bake */
const awSeed=(c,sd)=>((c[0]*7+c[1]*13+c[2]*17)%97)*3+sd%3; /* v35: a woken star's dab is one of 3 shapes per colour, so all of them can be baked ahead (no bake when a star wakes mid-drag) */
const BJ={};function bigJob(col0){const k=''+col0;if(BJ[k])return BJ[k];const sd=(col0[0]*7+col0[1]*13+col0[2]*17)%97;return BJ[k]=wcStarJob(col0,BIGR/.95,sd,false)}
function drawWcStar1(g,id,seed,cx,cy,rad,col0,aw,z,end,bg,T){if(aw&&!WKS[id])WKS[id]=T;if(!aw)WKS[id]=0;
  // waking = the colour drops into the middle of the grey dab and soaks outward over 1.3s, with a wet ring running ahead of it
  const t=aw?Math.min(1,(T-WKS[id])/1300):1,br=1+.025*Math.sin(T*.0013+seed*.13),sc=sleepCol(col0),grey=!aw?wcStar(sc,rad,seed,end):t<1?wcStarIf(sc,rad,seed,end):null;
  if(STK===5&&!end){/* lab v9.5: no grey dab (a waking reached star's fading loop is queued by starWc) */}else if(grey&&(!aw||t<1)){const s0=grey.width*.78,ga=(aw?1-wsm(.55,1,t):.85*(1-z*.35));starCorona(g,cx,cy,rad*2.6,sc,ga*.55,T/1000);g.globalAlpha=ga;g.drawImage(grey,cx-s0/2,cy-s0/2,s0,s0)}
  let sb=aw&&bg>0?bigSprite(col0):null,sw=sb?sb.width:0;if(aw&&bg>0&&!sb){bump(bigJob(col0));sb=wcStar(col0,rad,awSeed(col0,seed),end);sw=sb.width*BIGR/(rad*.95)} // not baked yet: the woken dab, scaled to the circle's size
  if(aw&&bg>0){const k0=rad/(BIGR/.95),gb=(k0+(1-k0)*bg)*(t<1?.3+.7*Math.sqrt(t):1),s=sw*gb*br;starCorona(g,cx,cy,BIGR*(1.2+.5*bg),col0,.9,T/1000);g.globalAlpha=1;g.drawImage(sb,cx-s/2,cy-s/2,s,s);starCorona(g,cx,cy,BIGR*.9,col0,.35,T/1000); // the circle soaks out from the star to wrap the string
    if(bg<1){const rr=sw*gb*.27;g.globalAlpha=.5*(1-bg);g.strokeStyle=`rgb(${col0})`;g.lineWidth=2.5+3*(1-bg);g.beginPath();g.arc(cx,cy,rr,0,7);g.stroke()}}
  else if(aw){const sp=wcStar(col0,rad,awSeed(col0,seed),end),gr=t<1?.3+.7*Math.sqrt(t):1,s=sp.width*gr*br;if(!end)starCorona(g,cx,cy,rad*3.2*gr,col0,.9,T/1000);g.globalAlpha=t<1?.6+.4*wsm(0,.3,t):1;g.drawImage(sp,cx-s/2,cy-s/2,s,s);
    if(t<1){const rr=sp.width*gr*.27;g.globalAlpha=.55*(1-t);g.strokeStyle=`rgb(${col0})`;g.lineWidth=2.5+3*(1-t);g.beginPath();g.arc(cx,cy,rr,0,7);g.stroke()}}
  g.globalAlpha=1}
// ---- gates (lab v8.6-v8.8): Sam 8:12pm the TALL RATIO COLUMNS (game barGate: base column left; octave 1|2, pitch gate 1|1), 8:18pm Gold rim
// (GVAR 5), 8:25pm GATE GOLD: one pale champagne gold for every gate and gate corona, kept apart from star and paint yellows, that GLINTS.
// Opening (GOPEN 1 Corona): the gold outline floods inward, the pieces collapse to the middle, a gold watercolour disc fills the spot.
const GG={rim:[238,242,252],body:[220,226,242],hi:[255,255,255],glow:'228,236,255',core:'255,255,255'}; /* v37 (Sam Nov 2 7:30am, lab v9.1): no gold, gates are pure white energy (gold read too close to star and paint yellow) */
function glint(g,x,y,s,a,lim){if(lim!==undefined){if(lim<2)return;s=Math.min(s,lim/1.4)}if(a<=.01)return;g.save();g.globalCompositeOperation='source-over'; /* v35b (tester): source-over like lab v8.8, so glints can never stack up to white */g.globalAlpha=a;g.fillStyle='rgb(255,255,255)';g.beginPath();g.moveTo(x-s,y);g.quadraticCurveTo(x,y,x,y-s);g.quadraticCurveTo(x,y,x+s,y);g.quadraticCurveTo(x,y,x,y+s);g.quadraticCurveTo(x,y,x-s,y);g.fill();
  const r=g.createRadialGradient(x,y,0,x,y,s*1.4);r.addColorStop(0,'rgba('+GG.glow+',.6)');r.addColorStop(1,'rgba('+GG.glow+',0)');g.fillStyle=r;g.beginPath();g.arc(x,y,s*1.4,0,7);g.fill();g.restore()}
function rimGlint(g,x,y,w,h,t,k,a,room){const P=2*(w+h),u=((t*.00006*(1+.3*k)+k*.37)%1)*P;let px,py;if(u<w){px=x-w/2+u;py=y-h/2}else if(u<w+h){px=x+w/2;py=y-h/2+u-w}else if(u<2*w+h){px=x+w/2-(u-w-h);py=y+h/2}else{px=x-w/2;py=y+h/2-(u-2*w-h)}
  const tw=Math.max(0,Math.sin(t*.0021+k*1.7));glint(g,px,py,4+3*tw,a*(.25+.75*tw*tw),room?room(px,py):undefined)} // room(x,y): how far the glint may reach before the lane edge (drawn uncut)
const GFCS={};
function goldFlood(sp,w,h,fl){const gk=sp.width+'x'+sp.height;let GF=GFCS[gk];if(!GF){const c=mk(sp.width,sp.height);GF=GFCS[gk]={c,x:c.getContext('2d')}}const GFC=GF.c,GFX=GF.x; /* v35b: one canvas per piece size, cleared, never resized (a resize reallocates it every frame) */
  GFX.setTransform(1,0,0,1,0,0);GFX.globalCompositeOperation='source-over';GFX.clearRect(0,0,GFC.width,GFC.height);GFX.drawImage(sp,0,0);if(fl<1){const cx=sp.width/2,cy=sp.height/2,k=1-fl,r=GFX.createRadialGradient(0,0,0,0,0,1);
  r.addColorStop(0,'rgba(0,0,0,1)');r.addColorStop(.75,'rgba(0,0,0,1)');r.addColorStop(1,'rgba(0,0,0,0)');GFX.globalCompositeOperation='destination-out';GFX.save();GFX.translate(cx,cy);GFX.scale(w*.62*k+.01,h*.62*k+.01);GFX.fillStyle=r;GFX.beginPath();GFX.arc(0,0,1,0,7);GFX.fill();GFX.restore()}
  return GFC} // the gold comes in from the outline: a hole in the middle that closes as the flood reaches the centre
const GVAR=10; /* v37: rings in rings (lab v9.1 GVAR 10, ORBR 1) */
function wcBlockJob(w,h,seed,fill){const key='b'+Math.round(w)+'x'+Math.round(h)+seed+MIXB+'v'+GVAR+(fill?'f':'');if(WCJ[key])return WCJ[key];const pad=26,W2=Math.ceil(w+pad*2),H2=Math.ceil(h+pad*2),cx=W2/2,cy=H2/2,rr=Math.min(w,h)*.28;
  const f=(X,Y)=>{let px=Math.abs(X-cx)-w/2+rr,py=Math.abs(Y-cy)-h/2+rr;return Math.hypot(Math.max(px,0),Math.max(py,0))+Math.min(Math.max(px,py),0)-rr+.8*Math.sin(X*.13+Y*.07+seed)};
  const L=fill?[{c:GG.rim,inset:0},{c:GG.body,inset:4},{c:GG.hi,inset:Math.min(w,h)*.3}]:[{c:GG.rim,inset:0},{c:[24,17,50],inset:5}];
  return WCJ[key]=wcJob(W2,H2,f,L,seed,{wob:3.5,halo:10,hc:fill?GG.hi:[255,200,170]})}
function wcBlock(w,h,seed,fill){const j=wcBlockJob(w,h,seed,fill);j.step(1e9);return j.c}
const PATCHR=50;try{window.wcDiscJobC=(...a)=>wcDiscJobC(...a)}catch(e){} /* stack-trail: rinse rings paint discs straight over the string */try{window.wcShapeC=(id,w,h,f,R,seed,c)=>{const K='sh'+id+'_'+c+MIXB;if(WCJ[K])return WCJ[K];const sh=k=>c.map(v=>Math.round(k>0?v+(255-v)*k:v*(1+k)));return WCJ[K]=wcJob(w,h,f,[{c:sh(-.12),inset:0},{c:sh(.08),inset:R*.12},{c:sh(.4),inset:R*.45}],seed,{wob:R*.08,halo:R*.25,hc:sh(.4),lift:.35,liftR:R*.5,cx:w/2,cy:h/2,tint:sh(.55)})}}catch(e){} /* stack-trail erase wall: the stargate disc's own paint (same layers, wobble, halo, lift) on any shape */function wcDiscJobC(R,seed,c){const key='dc'+Math.round(R)+'_'+seed+'_'+c+MIXB;if(WCJ[key])return WCJ[key];const P=Math.ceil(R*1.45),S=P*2,cx=P,cy=P,sh=k=>c.map(v=>Math.round(k>0?v+(255-v)*k:v*(1+k)));
  const f=(X,Y)=>{const a=Math.atan2(Y-cy,X-cx);return Math.hypot(X-cx,Y-cy)-R*(1+.035*Math.sin(a*3+seed)+.025*Math.sin(a*7+seed*1.3))};
  return WCJ[key]=wcJob(S,S,f,[{c:sh(-.12),inset:0},{c:sh(.08),inset:R*.12},{c:sh(.4),inset:R*.45}],seed,{wob:R*.08,halo:R*.25,hc:sh(.4),lift:.35,liftR:R*.5,cx,cy,tint:sh(.55)})} /* v50: the opened gate's disc (wcDiscJob) in a star's own colour */
function wcDiscJob(R,seed){const key='d'+Math.round(R)+'_'+seed+MIXB;if(WCJ[key])return WCJ[key];const P=Math.ceil(R*1.45),S=P*2,cx=P,cy=P;
  const f=(X,Y)=>{const a=Math.atan2(Y-cy,X-cx);return Math.hypot(X-cx,Y-cy)-R*(1+.035*Math.sin(a*3+seed)+.025*Math.sin(a*7+seed*1.3))};
  return WCJ[key]=wcJob(S,S,f,[{c:GG.rim,inset:0},{c:GG.body,inset:R*.12},{c:GG.hi,inset:R*.45}],seed,{wob:R*.08,halo:R*.25,hc:GG.hi,lift:.35,liftR:R*.5,cx,cy,tint:[246,248,255]})}
// the word on octave gates ("Along the gate", lab LBL 3; Sam: only "octave" on screen): small spaced capitals in gold ink, parallel to the bar,
// just past it, painted in the same watercolour (a soft bleed, the body, a darker tide edge, paper grain showing through)
const WTX={};if(typeof document!=='undefined'&&document.fonts)document.fonts.ready.then(()=>{for(const k in WTX)delete WTX[k]});
function wcText(txt,font,col,edge){const k=txt+font+col+(document.fonts&&document.fonts.check(font)?1:0);if(WTX[k])return WTX[k];const m=mk(1,1).getContext('2d');m.font=font;const w=Math.ceil(m.measureText(txt).width)+40,h=Math.ceil(parseFloat(font.match(/(\d+)px/)[1])*1.9)+20;
  const c=mk(w,h),x=c.getContext('2d');x.font=font;x.textAlign='center';x.textBaseline='middle';x.letterSpacing='4px';
  x.filter='blur(3px)';x.globalAlpha=.32;x.fillStyle=col;x.fillText(txt,w/2,h/2);x.filter='none';
  x.globalAlpha=.78;x.fillText(txt,w/2,h/2);x.globalAlpha=.55;x.strokeStyle=edge;x.lineWidth=1.1;x.strokeText(txt,w/2,h/2);
  x.globalCompositeOperation='destination-out';let sd=7;const rn=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};for(let i=0;i<w*h/26;i++){const px=rn()*w,py=rn()*h;x.globalAlpha=.18+rn()*.3;x.fillRect(px,py,1.3,1.3)}
  return WTX[k]=c}
// background bakes: big star circles, gold fills and discs are made a few ms per frame ahead of need (Look.make queues them), never mid-drag
const WCJ={},JOBQ=[];let NEEDJ=0;function bump(j){if(j.done)return;const i=JOBQ.indexOf(j);if(i>0)JOBQ.splice(i,1);if(i!==0)JOBQ.unshift(j);NEEDJ=1} // a job something is waiting on goes first, with more time
function bakeAhead(ms){if(NEEDJ){ms=Math.max(ms,4);NEEDJ=0}const t0=performance.now();while(JOBQ.length){const j=JOBQ[0];j.step(Math.max(.5,ms-(performance.now()-t0)));if(j.done)JOBQ.shift();if(performance.now()-t0>=ms)break}}
// ---------------------------------------------------------------- the ink string -----------------------------------------------------
// Drop-in for the old watercolour field (same calls: set, patch, push, live, render, cv, segs): the brush (seam 4) still decides the
// stroke's points; this only paints them. Lab paintLine(pts,7,[255,240,190],1,99,true) with PAINT=3 (ink brush, v6.4 pressure), the
// ROUND moving average (K=6 over 6px samples), then each star's colour laid source-atop from that star on (46px wide, so it only
// tints the ink and never adds paint; colour = star x .78 + cream x .22).
// ---------------------------------------------------------------- v32 the watercolour string -------------------------------------------
// Sam Nov 1 3:50pm lock "WB Bleed back", inside-out like the strings prototype; 4:15pm: "when one color bleeds, it has to fully take
// over that bleed color, and then when a second color bleeds, it has to be in the inside bleeding out ... already fully done from the
// strings prototype". So this is 3b's lab v7.1 SEEP BLEED block (/mnt/project-files/branding/lab/lab-v7.1.html; the map from v6.8), itself a port of the
// strings prototype's seepAdd/seepWash, PORTED AS IS: BLEED, the noise tables, bleedColumn and bleedString's body are the lab's lines.
// What changed is only where the inputs come from (3b: "make it bleedString(points, joins, laidTimes, now)"):
//   lab PSTAR (stars passed, s + pigment K) + KBASE  ->  the run's joins: each colour the string carries, where and when it joined
//        (s = -1: there from the start; the starlight the string starts with is the lab's WBASE and stays in the core, as in the lab);
//        a colour the string lets go of (dark matter) stops there (s1), the lab never lets go;
//   lab LAID[x] (when the head first reached px x)  ->  worked out from the game's own segments (t0, T, the ink's front curve), so an
//        undo or a new board is just a column whose time changed;
//   lab reveal / T / SP  ->  the run's length / now (ms) / the run resampled every 6px and rounded exactly as the lab rounds it.
// One unrolled strip per run of string (a wormhole jump starts a new run).
const WBASE=[255,240,190],SH=112; /* lab v7.7: a wider strip for the 2.5x string */
const BLEED={w:[6,5.1],step:.7,soak:[4.2,1.7],minW:3.2,minSoak:1.8,lag:.4,grow:1.2,fade:.75,k:[1.25,1.1],front:150,floor:.6,dryAt:3.4,dryT:2.6,back:22,backLag:.25,mixIn:45}; /* lab v7.8: back 22 (Sam 6:29pm: a small soft tongue of the new colour bleeding back from the star) */ // mixIn: the new colour lags in the centre only over its first 45px; past that the mixed colours seep in together
const NT=new Float32Array(512*SH),MT=new Float32Array(512*SH);for(let y=0;y<SH;y++)for(let x=0;x<512;x++){NT[y*512+x]=fbm(x/13,y/13,41)*.65+vnz(x/1.6,y/1.6,43)*.35;MT[y*512+x]=fbm(x/26,y/22,47)}
const PIG=c=>c.map(v=>-Math.log(Math.max(.04,v/255)));
const ssB=(a,b,x)=>{x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)};
const satC=k=>{const c=k.split(',').map(Number),m=(c[0]+c[1]+c[2])/3,f=v=>clamp(Math.round(m+(v-m)*1.45),0,255);return [f(c[0]),f(c[1]),f(c[2])]}; // the lab's PSTAR.w from a star colour
const BT={n:0,cap:0,A:null,B:null,C:null,D2:null};
/* v35b (tester: a 35-72ms hitch about 0.4s into a drag): the strip's noise table grew 512 columns at a time inside one frame. Now room is
   made ahead (a cheap copy) and columns are filled only as far as needed (+64), and the first 2560 are filled in the background (btJob). */
function btCap(n){if(n<=BT.cap)return;const N=Math.ceil((n+1)/512)*512,A=new Float32Array(N*SH),B2=new Float32Array(N*SH),C=new Float32Array(N*SH),D2=new Float32Array(N*2);
 if(BT.cap){A.set(BT.A);B2.set(BT.B);C.set(BT.C);D2.set(BT.D2)}Object.assign(BT,{cap:N,A,B:B2,C,D2})}
function btCol(x){const {A,B:B2,C,D2}=BT;D2[x*2]=fbm(x/30,3,77);D2[x*2+1]=fbm(x/30,12.3,77);for(let y=0;y<SH;y++){const k=x*SH+y,dx=Math.abs(y-SH/2+.5),sd=y<SH/2?0:1;A[k]=fbm(x/9,dx/4+sd*40,91);B2[k]=fbm(x/42,y/3,63);C[k]=fbm(x/42,y/2.4,61)}}
function btFit(nx){if(nx<=BT.n)return;const e=nx+64;btCap(e+512);while(BT.n<e)btCol(BT.n++)}
function btJob(upto){const J={done:false,step(ms){const t0=performance.now();btCap(upto+512);while(BT.n<upto){btCol(BT.n++);if((BT.n&7)===0&&performance.now()-t0>ms)break}J.done=BT.n>=upto;return J.done}};return J}
function Strip(){const B={SW0:0,SPX:null,LAID:null,FROZ:null,DL:[],J:[],BK:[],P:[],rev:-1,lastR:0,al:1};
 B.fit=len=>{btFit(Math.ceil(len)+8+173*6);const need=Math.ceil(len)+8;if(need<=B.SW0)return;const SW=Math.ceil((need+1024)/512)*512,SPX=new Uint8ClampedArray(SW*SH*4),LAID=new Float32Array(SW).fill(-1),FROZ=new Uint8Array(SW),ST=new Uint8Array(SW),LF=new Float32Array(SW),DS=new Float32Array(SW*SH);
  if(B.SW0){LAID.set(B.LAID);FROZ.set(B.FROZ);ST.set(B.ST);LF.set(B.LF);for(let y=0;y<SH;y++){SPX.set(B.SPX.subarray(y*B.SW0*4,(y+1)*B.SW0*4),y*SW*4);DS.set(B.DS.subarray(y*B.SW0,(y+1)*B.SW0),y*SW)}} /* v35b: the strip's pixels are the same after the copy, so the map needs no repaint (it was a full repaint in one frame) */
  Object.assign(B,{SW0:SW,SPX,LAID,FROZ,ST,LF,DS})};
 return B}
const STRIPS=[];
// THE MAP (3b's lab v6.8, "the slices are gone"): every screen pixel within 31px of the string knows its distance along the string (s)
// and across it (signed), from its nearest segment, and copies the strip there (bilinear, weighted by alpha). The lab builds it once
// for its fixed path (BM); a finger's path grows every frame, so here the same per-segment loop (bmSegs = the lab's BM loop body) runs
// only from where the rounded path changed, minus MM segments (48px, so a pixel a changed segment had taken from an older one is
// found again). Pixels are kept in buckets by whole s instead of the lab's sorted list, so bmPaint (the lab's bleedMapPaint) finds the
// dirty range without a sort. One full-screen map for all runs; OWN = run*65536 + segment.
const HW2=54,MM=+(QP.get('mm')||2), /* v35: map radius 54, not SH/2=56: no paint can reach past 51.5px (checked over the noise tables, rowbound.js) */MAPCV=mk(W,H),MAPX=MAPCV.getContext('2d'),MAPIMG=MAPX.createImageData(W,H),MD=MAPIMG.data;
const BEST=new Float32Array(W*H).fill(1e9),BS=new Float32Array(W*H),BL=new Float32Array(W*H),OWN=new Int32Array(W*H).fill(-1);let MROW=[1e9,-1],MCOL=[1e9,-1];
const mrow=k=>{const r=(k/W)|0,c=k-r*W;if(r<MROW[0])MROW[0]=r;if(r>MROW[1])MROW[1]=r;if(c<MCOL[0])MCOL[0]=c;if(c>MCOL[1])MCOL[1]=c};
function bmDrop(ri,B,i0){for(let c=Math.max(0,Math.floor(i0*6)-1);c<B.BK.length;c++){const a=B.BK[c];if(!a)continue;const keep=[];
  for(const k of a){const o=OWN[k];if(o<0||(o>>16)!==ri)continue;if((o&65535)>=i0){BEST[k]=1e9;OWN[k]=-1;MD[k*4+3]=0;mrow(k)}else if(Math.floor(BS[k])===c)keep.push(k)}B.BK[c]=keep.length?keep:null}}
/* v35 speed (tester 7:00pm, drag frames doubled): each segment is tested only where it can be the nearest part of the string: its own
   slab (pixels whose foot falls on it, +-1px) and, at its far end, the two thin wedges between its normal and the next segment's (where
   the corner itself is nearest), plus the two end caps. Same per-pixel test and order as the lab's capsule loop, so the same owner wins;
   about a tenth of the pixels tested. ?slab=0 = the old capsule loop. */
const SLAB=!/[?&]slab=0\b/.test(location.search);
function scanPoly(V,cb){let y0=1e9,y1=-1e9;for(const v of V){if(v[1]<y0)y0=v[1];if(v[1]>y1)y1=v[1]}const n=V.length;
 for(let y=Math.max(0,Math.floor(y0-1));y<=Math.min(H-1,Math.ceil(y1+1));y++){let l=1e9,r=-1e9;
  for(let dy=-1;dy<=1;dy++){const py=y+.5+dy;for(let i=0;i<n;i++){const p=V[i],q=V[(i+1)%n],a=p[1]-py,b=q[1]-py;if(a*b>0)continue;
    if(a===b){if(p[0]<l)l=p[0];if(q[0]<l)l=q[0];if(p[0]>r)r=p[0];if(q[0]>r)r=q[0];continue}const x=p[0]+(py-p[1])*(q[0]-p[0])/(q[1]-p[1]);if(x<l)l=x;if(x>r)r=x}}
  for(const v of V)if(Math.floor(v[1])===y){if(v[0]<l)l=v[0];if(v[0]>r)r=v[0]}
  if(r>=l)cb(y,Math.max(0,Math.floor(l-1)),Math.min(W-1,Math.ceil(r+1)))}}
function bmSegs(ri,B,P,i0,total){const R0=HW2;for(let i=Math.max(0,i0);i<P.length-1;i++){const [ax,ay]=P[i],[bx,by]=P[i+1],dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy||1,L=Math.sqrt(L2),sA=i*6,sB=i+1===P.length-1?total:(i+1)*6,own=ri*65536+i,HC=i+1===P.length-1?Math.floor(total):0; /* v36 round end (Sam Nov 2 5:37am "The end of the path shouldn't be a flat edge"): past the head, a pixel reads the last column at its distance from the end point, so the end is the paint's own cross-section swept round: a round, ringed tip */
  const row=(y,xl,xr)=>{for(let x=xl;x<=xr;x++){
    const px=x+.5,py=y+.5;let t=((px-ax)*dx+(py-ay)*dy)/L2;const tc=Math.max(0,Math.min(1,t)),qx=ax+dx*tc,qy=ay+dy*tc,ex=px-qx,ey=py-qy,d2=ex*ex+ey*ey;if(d2>=(HW2-1)*(HW2-1))continue;const k=y*W+x,bk=BEST[k];if(bk<1e8&&d2>=bk*bk)continue;const dd=Math.sqrt(d2); /* v35: sqrt, not the slow Math.hypot */
    if(dd<bk){BEST[k]=dd;const pl=((px-ax)*dy-(py-ay)*dx)/L;if(HC&&t>1){BS[k]=HC;BL[k]=pl<0?-dd:dd}else{BS[k]=HC?Math.min(HC,sA+(sB-sA)*tc):sA+(sB-sA)*tc;BL[k]=pl}OWN[k]=own;const c=Math.floor(BS[k]);(B.BK[c]||(B.BK[c]=[])).push(k)}}};
  if(!SLAB){const r1=HW2-1,r2=r1*r1,box=L>12;
   for(let y=Math.max(0,Math.floor(Math.min(ay,by)-HW2));y<=Math.min(H-1,Math.ceil(Math.max(ay,by)+HW2));y++){let xl=Math.floor(Math.min(ax,bx)-HW2),xr=Math.ceil(Math.max(ax,bx)+HW2);
    if(!box){const py=y+.5,ya=py-ay,yb=py-by;let l=1e9,rr=-1e9;if(ya*ya<r2){const h=Math.sqrt(r2-ya*ya);l=ax-h;rr=ax+h}if(yb*yb<r2){const h=Math.sqrt(r2-yb*yb);if(bx-h<l)l=bx-h;if(bx+h>rr)rr=bx+h}if(rr<l)continue;xl=Math.floor(l-1.5);xr=Math.ceil(rr+.5)}
    row(y,Math.max(0,xl),Math.min(W-1,xr))}continue}
  const ux=dx/L,uy=dy/L,nx=-uy,ny=ux;
  scanPoly([[ax-ux+nx*R0,ay-uy+ny*R0],[bx+ux+nx*R0,by+uy+ny*R0],[bx+ux-nx*R0,by+uy-ny*R0],[ax-ux-nx*R0,ay-uy-ny*R0]],row);
  if(i===0)scanPoly([[ax+nx*R0,ay+ny*R0],[ax+(nx-ux)*R0,ay+(ny-uy)*R0],[ax-(nx+ux)*R0,ay-(ny+uy)*R0],[ax-nx*R0,ay-ny*R0]],row); // the start cap
  if(HC)scanPoly([[bx+nx*R0,by+ny*R0],[bx+(nx+ux)*R0,by+(ny+uy)*R0],[bx+(ux-nx)*R0,by+(uy-ny)*R0],[bx-nx*R0,by-ny*R0]],row); // v36: the head cap
  if(i>0)wedges(P,i,row);if(i+1<P.length-1)wedges(P,i+1,row)}} /* both segments at a corner test its wedges, in order, as the capsule loop does (same float ties) */
function wedges(P,j,row){const R0=HW2,[ax,ay]=P[j-1],[bx,by]=P[j],[cx,cy]=P[j+1],l1=Math.hypot(bx-ax,by-ay)||1,l2=Math.hypot(cx-bx,cy-by)||1,ux=(bx-ax)/l1,uy=(by-ay)/l1,vx=(cx-bx)/l2,vy=(cy-by)/l2,nx=-uy,ny=ux,mx=-vy,my=vx;
 if(ux*vx+uy*vy>.9998&&Math.abs(ux*vy-uy*vx)<.017)return; // straight on: the +-1px slab overlap already covers the hair-thin wedge
 const hx=nx+mx,hy=ny+my,hl=Math.hypot(hx,hy);
 if(hl<1){scanPoly([[bx-R0,by-R0],[bx+R0,by-R0],[bx+R0,by+R0],[bx-R0,by+R0]],row);return} // a sharp corner (over 120 degrees): the whole disc
 const f=R0*2/hl/hl; // the bisector reaches R0/cos(half the turn)
 for(const sg of [1,-1])scanPoly([[bx,by],[bx+sg*nx*R0,by+sg*ny*R0],[bx+sg*hx*f,by+sg*hy*f],[bx+sg*mx*R0,by+sg*my*R0]],row)}
function bmPaint(ri,B,a,b,R){for(let c=Math.max(0,Math.floor(a));c<=Math.min(B.BK.length-1,Math.ceil(b));c++)bmCol(ri,B,c,R)}
function bmCol(ri,B,c,R){const {SW0,SPX}=B,D=MD,al=B.al;{const arr=B.BK[c];if(!arr)return;
  for(const k of arr){const ow=OWN[k];if(ow<0||(ow>>16)!==ri)continue;const s0=BS[k];if(Math.floor(s0)!==c)continue;const o=k*4;
    if(s0>R){D[o+3]=0}else{
      const fx=Math.min(SW0-1.001,s0),xi=fx|0,u=fx-xi,fy=Math.max(0,Math.min(SH-1.001,BL[k]+SH/2-.5)),yi=fy|0,v=fy-yi;
      const p00=(yi*SW0+xi)*4,p10=p00+4,p01=p00+SW0*4,p11=p01+4,w00=(1-u)*(1-v),w10=u*(1-v),w01=(1-u)*v,w11=u*v;
      const A00=SPX[p00+3]*w00,A10=SPX[p10+3]*w10,A01=SPX[p01+3]*w01,A11=SPX[p11+3]*w11,A=A00+A10+A01+A11;
      if(A<.5){D[o+3]=0}else{D[o]=(SPX[p00]*A00+SPX[p10]*A10+SPX[p01]*A01+SPX[p11]*A11)/A;D[o+1]=(SPX[p00+1]*A00+SPX[p10+1]*A10+SPX[p01+1]*A01+SPX[p11+1]*A11)/A;D[o+2]=(SPX[p00+2]*A00+SPX[p10+2]*A10+SPX[p01+2]*A01+SPX[p11+2]*A11)/A;D[o+3]=A*al}}
    mrow(k)}}}
function bmForget(ri){const B=STRIPS[ri];if(!B)return;bmDrop(ri,B,0);STRIPS[ri]=null}
// bleedColumn: the lab's, with PSTAR[0..m] + KBASE -> act (the joins that hold at x, oldest first) and PSTAR[m+1] -> nx
// SPEED (game only; every pixel stays what the lab's loop gives, checked against the unoptimised port): (1) rows further than 15.5px
// from the middle are always empty (no wash reaches past edge+.6 <= 15.2px), so only rows 16..47 are worked; (2) once every wash and
// the bleed back are fully grown and dry, only life (the drying back) still changes, and it scales every density alike, so the hue
// stays and only alpha = 1-exp(-2.6*life*density) is redone, in steps of .012 of life (the 2.6s drying back in ~33 steps, each
// under 1.5% alpha; the last step lands exactly on the floor); while life is still 1 the column is not touched at all.
const RRV=QP.get('rramp')==='0'?0:+(QP.get('rrv')||150),RPZ=350; /* resume ramp: px/s of the taper (?rramp=0 = old), and the LAID jump (ms) that counts as a pause */
const BUD=+(QP.get('bud')||1.5),PMAX=+(QP.get('pmax')||150),PMAXD=+(QP.get('pmaxd')||300); /* v60w (tester s190: after a drag the string's paint changed look in hard bands sweeping up it, on main too): during a drag the older wet columns got only the leftover budget, so behind the head they fell seconds behind and caught up as a band when you let go; now each is redrawn at least every PMAXD ms during a drag too */ /* 3b gates (tester s187 #2, a hard vertical seam sweeping along the paint for ~1s after a drag): every wet column is redrawn at least every PMAX ms (never more than 6ms of it in a frame), so no stretch of the string shows an older state than its neighbour. Only while the head is still: during a drag it cost 3.5ms a frame (filmed) */ /* ms per frame for the older wet columns (?bud=1e9 = no budget, every column each frame) */
const RM=Math.min(SH/2-1,Math.ceil((BLEED.w[0]+BLEED.soak[0])*WS*1.3+MIXB*.4+BOUT*2.7+5)),Y0=SH/2-RM,Y1=SH/2+RM, /* lab v7.7 row range */STAG=!/[?&]stag=0/.test(location.search);
function washesOf(act,x){const sm=Math.max(0,act[act.length-1].s);
  const W=[];const JS=act;for(const j of JS){const q=W.length;W.push({K:j.K,t0:q&&q===JS.length-1?BLEED.lag*(1-ssB(0,BLEED.mixIn,x-sm)):0,w0:WS*BLEED.w[0]*(q?1-(JS.length>2?.36:.28)*q/(JS.length-1):1)*(q&&q===JS.length-1?.3+.7*ssB(0,46,x-sm):1),soak:WS*BLEED.soak[0]*(q?1-(JS.length>2?.36:.28)*q/(JS.length-1):1)*(q&&q===JS.length-1?.3+.7*ssB(0,46,x-sm):1), /* lab v7.9: rings sized by count */k:BLEED.k[Math.min(q,1)],tp:(q&&q===JS.length-1?.3+.7*ssB(0,46,x-sm):1)})} /* lab v7.8: the newest ring tapers in over 46px */
  return W}
// gate: {b, pre} when x is within 46px past a gate (lab v7.9, tester 7:51pm: the colours before the gate run on in a ragged tongue, row by row)
function bleedColumn(B,x,now,act,nx,reveal,gate){const {SW0,SPX,LAID,FROZ,ST,LF,DS}=B,o=x;const sm=Math.max(0,act[act.length-1].s),TGL=46;
  // washes (Sam Nov 1 4:45pm): the first colour floods the whole string (no white left once a colour touches it). When a new
  // colour touches, it runs 0.4s later in the CENTRE and bleeds outward, taking the middle over completely; the colour before it
  // stays around it, and so on: oldest outside, newest in the middle, a watercolour edge between each pair (Sam 4:45pm). q=0 = oldest (outer)
  // (lab v7.1 line; its JS = the stars passed, or [-1] = the starlight before the first star, is the game's act, oldest first)
  const Wpost=washesOf(act,x),Wpre=gate&&x-gate.b<TGL?washesOf(gate.pre,x):null;let W=Wpost;
  // bleed back: the next star's colour runs back up into this stretch in lobes, a moment after the string reaches that star
  const BKR=nx&&nx.nb?(window.__backR||BLEED.back):BLEED.back;let BB=null;if(nx&&nx.s-x<BKR&&nx.s<=reveal&&LAID[Math.min(SW0-1,Math.ceil(nx.s))]>=0)BB={K:nx.K,t:(now-LAID[Math.min(SW0-1,Math.ceil(nx.s))])/1000-BLEED.backLag,dist:nx.s-x};
  const hd0=reveal-x,HF=hd0<34,HWS=(BLEED.w[0]+BLEED.soak[0])*WS+BOUT; /* v37 head seep (lab v9.1 HFD, Sam Nov 2 7:28am: never a flat cut, always a natural seep at the end): the last 34px fade as a rounded, ragged wet front, the edges trailing the middle */
  const L0=LAID[x],age0=(now-L0)/1000,str=.55+.45*Math.exp(-(x-sm)/400),settled=age0>W.length*BLEED.lag+BLEED.dryAt+BLEED.dryT&&(!BB||BB.t>BLEED.dryAt+BLEED.dryT);
  const life=Math.max(BLEED.floor,1-ssB(BLEED.dryAt,BLEED.dryAt+BLEED.dryT,age0-W.length*BLEED.lag*.5)),cq=new Float32Array(Math.max(W.length,Wpre?Wpre.length:0)+1),xi=x%512;
  const code=age0>=Math.max(BLEED.grow*1.6,(W.length>1?BLEED.lag:0)+BLEED.grow)&&(!BB||BB.t>=BLEED.grow)?(BB?2:1):0;
  if(code&&ST[x]===code&&!HF){if(Math.abs(life-LF[x])>.012||life===BLEED.floor&&LF[x]!==life){LF[x]=life;for(let y=Y0;y<Y1;y++){const o4=(y*SW0+o)*4,A=1-Math.exp(-4.4*life*DS[y*SW0+o]);SPX[o4+3]=A<=.004?0:255*Math.min(1,A)}B.DL.push(x)}
   if(settled)FROZ[x]=1;return}
  ST[x]=code;LF[x]=life;
  let ageG=age0;if(B.PZ&&B.PZ.length){let j=-1;for(const p of B.PZ){if(p<x)j=p;else break}if(j>=0){const bz=Math.min((now-LAID[j])/1000,BLEED.grow*1.6)-(x-j)/RRV;if(bz>ageG)ageG=bz}} /* resume ramp */
  for(let y=Y0;y<Y1;y++){const dx=Math.abs(y-SH/2+.5),n=NT[y*512+xi],mm=MT[y*512+xi];let a0=0,a1=0,a2=0,wet=0,ds=0;cq.fill(0);W=Wpost;if(Wpre){const gs=gate.b,tg=6+(TGL-6)*Math.max(0,Math.min(1,.5+.55*(Math.sin(y*.19+gs*.013)*.55+Math.sin(y*.47+gs*.007+1.3)*.3+(BT.A[x*SH+y]-.5)*.5+(mm-.5)*.9)));if(x-gs<tg)W=Wpre}
    if(BB&&BB.t>0){const nz=BT.A[x*SH+y],reach=Math.min(BKR,BB.t*60)*(.25+1.3*nz*nz+.4*mm),edge=(BLEED.w[0]+BLEED.soak[0])*WS*.8*(.7+.5*mm)*(1-.55*Math.min(1,BB.dist/Math.max(1,reach)));const cov=(1-ssB(reach-8,reach+1,BB.dist))*(1-ssB(edge-4,edge+1,dx))*.75; /* lab v7.8 back tongue */
      if(cov>0){const dry=ssB(.25,1.1,BB.t),rim=ssB(reach-10,reach-1,BB.dist)*dry,dens=.8*cov*(.6+.55*rim)*(1+(n-.5)*.9*dry)*life*.5;cq[W.length]=cov;ds+=dens;
        a0+=dens*BB.K[0];a1+=dens*BB.K[1];a2+=dens*BB.K[2];wet=Math.max(wet,cov*(1-dry))}}
    for(let q=W.length-1;q>=0;q--){const w=W[q],age=ageG-w.t0;if(age<=0)continue;
      const e=BLEED.front*age,fx=e-dx*dx/(w.w0*1.6)+(mm-.5)*16*Math.min(1,e/40);if(fx<0)continue;   // the front: the middle arrives first, then it spreads out to the sides
      const hw=w.w0+w.soak*Math.sqrt(Math.min(age,BLEED.grow)/BLEED.grow),edge=hw*(.72+.56*mm)+(n-.5)*3+(q?CORE*w.tp-MIXB*.3+(BT.C[(x+q*173)*SH+y]-.5)*MIXB*1.9:MIXB*.35); // lab v7.4 (Sam Nov 1 6:10pm): the outer wash keeps the shape of the track but really BLEEDS past it: a lighter, grainy feather that runs out
      // unevenly in blooms (wide in places, almost none in others), ending in a darker tide line, as in the strings prototype
      const sd=y<SH/2?0:1,bk=x*SH+y,bl=BT.D2[x*2+sd],Fw=q?0:BOUT*(.12+1.7*bl*bl)*(.75+.5*BT.A[bk])*(.6+.8*BT.B[bk])*Math.sqrt(Math.min(age,BLEED.grow*1.6)/(BLEED.grow*1.6)),E2=edge+Fw;
      let cov=q?1-ssB(edge-MIXB*.45,edge+MIXB*.55,dx):1-ssB(E2-2.4,E2+.6,dx);cov*=ssB(-2,2.5,fx);if(cov<=0)continue;
      const dry=ssB(.25,1.1,age),rim=ssB(E2-5,E2-1,dx)*dry,fz=q?0:ssB(edge-1,edge+2,dx);let dens=w.k*str*cov*(.55+.35*(1-ssB(0,edge,dx))+.55*rim)*(1+(n-.5)*.9*dry)*life*.5;
      if(fz>0)dens*=1-fz*(.5-.55*(n-.5)-.3*rim);   /* the feather is a thinner wash with the pigment grains showing */ cq[q]=cov; /* lab v7.9 fix: this was swallowed by a // comment in v7.4-v7.8, so inner colours never took the middle */
      /* (v34 had the lab v7.4 bug: cq[q]=cov missing, so the inner wash never thinned the outer one; fixed above per lab v7.9 across the band) */
      for(let r=q+1;r<=W.length;r++)dens*=1-.94*ssB(.2,1,cq[r]); /* lab v7.8 .94 */   // across the mix band both colours are present, the inner one taking over gradually
      ds+=dens;a0+=dens*w.K[0];a1+=dens*w.K[1];a2+=dens*w.K[2];wet=Math.max(wet,cov*(1-dry)*life)}
    const o4=(y*SW0+o)*4,dk=1-.07*wet,T0=Math.exp(-a0)*dk,T1=Math.exp(-a1)*dk,T2=Math.exp(-a2)*(1-.05*wet),al=1-Math.min(T0,T1,T2);
    // on the night sky the wash is shown as the colour it would leave on white paper (subtractive mix kept), with its body from the pigment's density
    DS[y*SW0+o]=ds/life;let A=1-Math.exp(-4.4*ds);if(HF){const u=Math.min(1,dx/HWS),fr=3+24*u*u+8*(.5+.35*Math.sin(y*.13+1.1)+.15*Math.sin(y*.29+2.3));A*=ssB(fr-8,fr+5,hd0)} /* lab v7.8: richer body (Sam 6:27pm 'lost the red') */if(A<=.004){SPX[o4+3]=0;continue}const iv=1/Math.max(1e-4,ds),sh=dk*(1-.1*wet);   // hue from the subtractive mix of the pigments present (weighted K), at full strength
    SPX[o4]=255*Math.exp(-a0*iv*.9)*sh;SPX[o4+1]=255*Math.exp(-a1*iv*.9)*sh;SPX[o4+2]=255*Math.exp(-a2*iv*.9)*sh;SPX[o4+3]=255*Math.min(1,A)}
  if(settled)FROZ[x]=1;B.DL.push(x)}
// bleedRun: one run of string. raw = Ink's run points [x,y,newest,moon,stack,t0,T,L] (each the end of a segment of the game's string;
// stack = the colours carried on that segment, oldest first). Returns true while any of it is still wet (so the string keeps redrawing).
function bleedRun(ri,raw,X,t,al){const n=raw.length;if(n<2){bmForget(ri);return false}const B=STRIPS[ri]||(STRIPS[ri]=Strip()),now=t*1000;B.fc=(B.fc||0)+1;
 const Sr=[0];for(let i=1;i<n;i++)Sr.push(Sr[i-1]+Math.hypot(raw[i][0]-raw[i-1][0],raw[i][1]-raw[i-1][1]));const reveal=Sr[n-1];B.fit(reveal);
 const {SW0,SPX,LAID,FROZ}=B,R=Math.min(SW0-1,Math.floor(reveal));
 // the joins (lab PSTAR + KBASE): walk the run; a segment whose stack has a colour the last one hadn't = that colour joins where it starts
 const J=[],live=new Map(),join=(k,s,tt,moon)=>{const e={s,s1:1e9,k,t:tt,moon,K:PIG(moon?WBASE:satC(k)),nb:window.__noBackK===k};J.push(e);live.set(k,e)};
 raw[1][4].forEach(k=>join(k,-1,raw[1][5],!!raw[1][3]));let prev=raw[1][4].join(';');
 for(let i=2;i<n;i++){const st=raw[i][4],key=st.join(';');if(key===prev)continue;prev=key;const mo=!!raw[i][3];
  for(const [k,e] of live)if(!st.includes(k)&&(!e.moon||!mo)){e.s1=Sr[i-1];live.delete(k)} /* lab v6.9: the starlight only shows before the first star */
  for(const k of st)if(!live.has(k))join(k,Sr[i-1],raw[i][5],mo)}
 // a join that moved, changed or is new: wet the string again from just before it (its colour bleeds back up to BLEED.back px)
 {let f=0;const O=B.J;while(f<J.length&&f<O.length&&J[f].k===O[f].k&&Math.abs(J[f].s-O[f].s)<.5&&Math.abs(Math.min(J[f].s1,1e8)-Math.min(O[f].s1,1e8))<.5)f++;
  if(f<J.length||f<O.length){const s0=f<J.length?(f<O.length?Math.min(J[f].s,O[f].s,J[f].s1,O[f].s1):Math.min(J[f].s,J[f].s1)):Math.min(O[f].s,O[f].s1);for(let x=Math.max(0,Math.floor(s0-BLEED.back-2));x<=R;x++){FROZ[x]=0;B.ST[x]=0}}B.J=J}
 // LAID: when the string's front first reached px x (the ink's front curve, so the bleed starts as the string arrives); a changed time = a new string there
 let i=1;for(let x=0;x<=R;x++){while(i<n-1&&Sr[i]<x)i++;const L=raw[i][7]||1,d=x-Sr[i-1],u=1-Math.pow(Math.max(0,1-Math.min(1,d/L)),1/2.2),Ld=(raw[i][5]+u*raw[i][6])*1000;
  if(LAID[x]<0||Math.abs(LAID[x]-Ld)>120){LAID[x]=Ld;FROZ[x]=0;B.ST[x]=0}}
 /* resume ramp (Sam Nov 7 3:07pm: drag, stop, drag = the new paint looked thinner for a moment next to the fully spread paint): where the player's drag
    restarts after a pause (a LAID jump over RPZ ms), the paint past it spreads as if the drag had never stopped, tapering into the fresh paint */
 B.PZ=[];if(RRV>0)for(let x=1;x<=R;x++)if(LAID[x-1]>=0&&LAID[x]-LAID[x-1]>RPZ)B.PZ.push(x-1); /* only a pause in the player's own drag (the string laid before the drag has backdated, negative times) */
 for(let x=R+1;x<SW0;x++)if(LAID[x]>=0){LAID[x]=-1;FROZ[x]=0;B.ST[x]=0;for(let y=0;y<SH;y++)SPX[(y*SW0+x)*4+3]=0;B.DL.push(x)}
 for(const ps of J){if(ps.s<0)continue;if(ps.s>R)break;const L=LAID[Math.ceil(ps.s)];if(L>=0&&now-L<(BLEED.backLag+BLEED.dryAt+BLEED.dryT)*1000+500)for(let x=Math.max(0,Math.floor(ps.s-BLEED.back));x<ps.s;x++)FROZ[x]=0}
 const mv=B.hRv!==undefined&&Math.abs(B.hRv-reveal)>.3,HZ0=mv?Math.min(B.hRv,reveal)-36:1e9;if(mv||B.hRv===undefined){B.hRv=reveal;for(let x=Math.max(0,Math.floor(HZ0));x<=R;x++){FROZ[x]=0;B.ST[x]=0}} /* v37: the head seep moves with the head: re-bake what was its fade and what is now */
 let wetN=0;{const BPs=[...new Set(J.flatMap(e=>[e.s,e.s1]).filter(v=>v>=0&&v<1e8).map(v=>Math.ceil(v)))].sort((a,b)=>a-b);let bi=0,act=null,nx=null;
  const GTS=[];for(const b of [...new Set(J.filter(e=>!e.moon&&e.s1<1e8).map(e=>e.s1))].sort((u,v)=>u-v)){const pre=J.filter(e=>e.s<b&&e.s1>=b),post=J.filter(e=>e.s<=b&&e.s1>b);if(pre.some(e=>!e.moon)&&post.length&&post.every(e=>e.moon))GTS.push({b,pre})} /* a gate: the colours end and the string turns white */
  /* SPEED v35 (tester 7:00pm: the watercolour halved the frame rate while dragging, and the twitch came back): the columns near the
     head (the colour still arriving) are painted every frame; the rest of the wet string shares a time budget per frame (BUD ms,
     round robin from where the last frame stopped), so a long wet string can never stretch a frame. On a fast phone the budget covers
     every column, as in the lab; on a slow one the older washes just grow and dry in slightly coarser steps. */
  const C=B.cand||(B.cand=[]);C.length=0;
  let gi=-1;for(let x=0;x<=R;x++){while(gi+1<GTS.length&&GTS[gi+1].b<=x)gi++;if(FROZ[x])continue;if(!act||bi<BPs.length&&x>=BPs[bi]){while(bi<BPs.length&&BPs[bi]<=x)bi++;act=J.filter(e=>e.s<=x&&e.s1>x);nx=null;for(const e of J)if(e.s>x){nx=e;break}}
   if(!act.length)continue;C.push(x,act,nx,gi>=0?GTS[gi]:null)}
  const t0b=performance.now(),nC=C.length/4;let done=0;
  for(let i=0;i<nC;i++){const x=C[i*4];if(R-x<36||x>=HZ0){if(!mv&&R-x>=8&&((x^B.fc)&1)){wetN++;continue} /* v35: the newest 8px every frame, the 16px behind them on alternate frames */bleedColumn(B,x,now,C[i*4+1],C[i*4+2],reveal,C[i*4+3]);if(!FROZ[x])wetN++;done++}} // the head
  let rr=B.rr||0;if(rr>=nC)rr=0;const start=rr;
  for(let n=0;n<nC;n++){const i=(start+n)%nC,x=C[i*4];if(R-x<36||x>=HZ0)continue;const el=performance.now()-t0b;if(BUD<1e3&&(n>=(mv?Math.ceil(nC*Math.min(33,Look.fdt||16.7)/PMAXD):Math.max(10,Math.ceil(nC*Math.min(33,Look.fdt||16.7)/PMAX)))&&el>BUD*Look.budK||n>=10&&el>6)){rr=i;wetN+=nC-n;break} /* v60d (tester: on a slow phone a new board's start tail took up to 19s to appear): at least 10 older columns every frame while the head is still (not during a drag), so the wash always moves */
   bleedColumn(B,x,now,C[i*4+1],C[i*4+2],reveal,C[i*4+3]);if(!FROZ[x])wetN++;rr=i+1}
  B.rr=rr;}
 // SP: the run every 6px, rounded as the lab rounds its path (K=6 moving average); the map is built on it
 const SP=[];{let k=1;for(let s0=0;s0<reveal;s0+=6){while(k<n-1&&Sr[k]<s0)k++;const a=raw[k-1],b=raw[k],u=clamp((s0-Sr[k-1])/((Sr[k]-Sr[k-1])||1),0,1);SP.push([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u])}SP.push([raw[n-1][0],raw[n-1][1]]);
  if(SP.length>12){const K=6,Q=SP.map((p,i)=>{if(i<1||i>SP.length-2)return p;let sx=0,sy=0,m=0;for(let j=Math.max(0,i-K);j<=Math.min(SP.length-1,i+K);j++){sx+=SP[j][0];sy+=SP[j][1];m++}return [sx/m,sy/m]});SP.length=0;SP.push(...Q)}}
 // the map: from the first rounded point that moved (a finger's string only changes near its head), or all of it when the run is new
 let pa=1e9,pb=-1;const DL=B.DL;B.DL=[];
 {const OP=B.P;let ic=0;while(ic<SP.length&&ic<OP.length&&Math.abs(SP[ic][0]-OP[ic][0])<.25&&Math.abs(SP[ic][1]-OP[ic][1])<.25)ic++;
  if(ic<SP.length||ic<OP.length||reveal!==B.rev){for(let i=0;i<ic;i++)SP[i]=OP[i];const i0=Math.max(0,ic-1-MM);bmDrop(ri,B,i0);bmSegs(ri,B,SP,i0,reveal);B.P=SP;B.rev=reveal;pa=Math.min(pa,i0*6);pb=Math.max(pb,R)}}
 if(al!==B.al){B.al=al;pa=0;pb=R}
 // (lab bleedString) repaint what changed, and what a shorter string uncovered
 if(pb>=pa||R<B.lastR){const a=Math.min(pa,R<B.lastR?R:1e9),b=Math.max(pb,B.lastR);bmPaint(ri,B,a-2,b+2,R)}
 // a changed strip column x is read (bilinear) by map pixels with s in [x-1,x+1): repaint those buckets once each
 {const M=B.PM||(B.PM=new Uint8Array(0));if(M.length<B.SW0+4)B.PM=new Uint8Array(B.SW0+4);const PM=B.PM,todo=[];for(const x of DL)for(let c=x-2;c<=x+1;c++)if(c>=0&&(c<pa-2||c>pb+2)&&!PM[c]){PM[c]=1;todo.push(c)}
  for(const c of todo){PM[c]=0;bmCol(ri,B,c,R)}}
 B.lastR=R;
 return wetN>0}

function Ink(){const cv=mk(W,H),g=cv.getContext('2d');const I={cv:STRW?MAPCV:cv,segs:[],box:null,runs:[],dirty:true}; /* v32: the watercolour string draws straight into the map canvas */
 const front=(s,t)=>{const L=Math.hypot(s.b[0]-s.a[0],s.b[1]-s.a[1]);if(s.lv)return L; /* smooth trail (Nov 6): paint drawn live never re-grows (see index.html LIVEF) */const u=(t-s.t0)/(s.T||.05);if(u<=0)return -1;if(u>=1)return L;return L*(1-Math.pow(1-u,2.2))};
 I.set=segs=>{I.segs=segs;I.dirty=true};I.patch=segs=>{I.segs=segs;I.dirty=true};
 I.push=s=>{if(I.segs[I.segs.length-1]!==s)I.segs.push(s);I.dirty=true};
 I.live=s=>{if(I.lv){I.segs=I.segs.slice(0,-1);I.lv=null}if(s){I.segs=I.segs.concat([s]);I.lv=s}I.dirty=true};
 const tint=k=>{const c=k.split(',').map(Number);return `rgb(${Math.round(c[0]*.78+255*.22)},${Math.round(c[1]*.78+240*.22)},${Math.round(c[2]*.78+190*.22)})`};
 function ribbon(pts,wf){const n=pts.length,Lf=[],Rt=[];for(let i=0;i<n;i++){const p0=pts[Math.max(0,i-1)],p1=pts[Math.min(n-1,i+1)];let dx=p1[0]-p0[0],dy=p1[1]-p0[1];const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;const w=wf(i/(n-1),i)/2;Lf.push([pts[i][0]-dy*w,pts[i][1]+dx*w]);Rt.push([pts[i][0]+dy*w,pts[i][1]-dx*w])}
  g.beginPath();Lf.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));for(let i=n-1;i>=0;i--)g.lineTo(Rt[i][0],Rt[i][1]);g.closePath()}
 I.render=t=>{let anim=false;const runs=[];let cur=null;
  for(const s of I.segs){const f=front(s,t);if(f<0){anim=true;break}const L=Math.hypot(s.b[0]-s.a[0],s.b[1]-s.a[1]);if(f<L)anim=true;
   const e=f>=L?s.b:[s.a[0]+(s.b[0]-s.a[0])*f/(L||1),s.a[1]+(s.b[1]-s.a[1])*f/(L||1)],col=(s.cols&&s.cols.length?s.cols[s.cols.length-1]:[255,240,190]).join(','),moon=!!s.moon,stk=s.cols&&s.cols.length?s.cols.map(c=>c.join(',')):['255,240,190'],sT=s.T||.05;
   if(!cur||Math.hypot(s.a[0]-cur.last[0],s.a[1]-cur.last[1])>24){cur={raw:[[s.a[0],s.a[1],col,moon,stk,s.t0,sT,L]],last:s.a,k:s.k||.85};runs.push(cur)}
   cur.raw.push([e[0],e[1],col,moon,stk,s.t0,sT,L]);cur.last=e;Look.PF=e;Look.PFT=performance.now();cur.k=Math.min(cur.k,s.k||.85);if(f<L)break}
  if(!anim&&!I.dirty&&!I.wasAnim&&!I.wet)return false;I.wet=false;I.dirty=false;I.wasAnim=anim; /* redraw once more after a front finishes */if(!STRW){g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.globalAlpha=1;g.clearRect(0,0,W,H)}
  I.runs=[];let bx0=1e9,by0=1e9,bx1=-1e9,by1=-1e9;
  for(const run of runs){const SP=[];for(let i=1;i<run.raw.length;i++){const a=run.raw[i-1],b=run.raw[i],L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(L/6));for(let j=i===1?0:1;j<=n;j++){const u=j/n;SP.push([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,b[2],b[3],b[4],b[5]])}}
   if(SP.length<2)continue;let Q=SP;if(SP.length>12){const K=6;Q=SP.map((p,i)=>{if(i<1||i>SP.length-2)return p;let sx=0,sy=0,n=0;for(let j=Math.max(0,i-K);j<=Math.min(SP.length-1,i+K);j++){sx+=SP[j][0];sy+=SP[j][1];n++}return [sx/n,sy/n,p[2],p[3],p[4],p[5]]})}
   I.runs.push(Q);for(const p of Q){if(p[0]<bx0)bx0=p[0];if(p[0]>bx1)bx1=p[0];if(p[1]<by0)by0=p[1];if(p[1]>by1)by1=p[1]}
   if(STRW){if(bleedRun(runs.indexOf(run),run.raw,g,t,run.k<.8?.7:1))anim=true;continue} /* v32: the watercolour string (3b's SEEP BLEED) */
   const n=Q.length,w=7,al=run.k<.8?.7:1,pr=(t,i)=>w*1.7*(.62+.38*Math.pow(Math.sin(Math.PI*Math.min(.98,.5+.5*t)),.55))*(.9+.2*hash(99+i));
   g.lineCap='round';g.lineJoin='round';g.fillStyle=`rgba(255,240,190,${.95*al})`;ribbon(Q,pr);g.fill();
   g.globalCompositeOperation='lighter';g.lineWidth=w*2.6;g.strokeStyle=`rgba(255,240,190,${.08*al})`;g.beginPath();Q.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();
   // each star's colour from that star on
   g.globalCompositeOperation='source-atop';g.lineWidth=46;let i0=0;while(i0<n){let i1=i0;while(i1+1<n&&Q[i1+1][2]===Q[i0][2])i1++;if(!Q[i0][3]){g.strokeStyle=tint(Q[i0][2]);g.beginPath();for(let i=Math.max(0,i0-1);i<=i1;i++)i===Math.max(0,i0-1)?g.moveTo(Q[i][0],Q[i][1]):g.lineTo(Q[i][0],Q[i][1]);if(i1===i0)g.lineTo(Q[i0][0]+.1,Q[i0][1]);g.stroke()}i0=i1+1}
   g.globalCompositeOperation='source-over'}
  if(STRW){for(let ri=runs.length;ri<STRIPS.length;ri++)bmForget(ri);if(MROW[1]>=MROW[0]){MAPX.putImageData(MAPIMG,0,0,MCOL[0],MROW[0],MCOL[1]-MCOL[0]+1,MROW[1]-MROW[0]+1);MROW=[1e9,-1];MCOL=[1e9,-1]}}
  I.wet=anim&&STRW>0;I.box=bx1>=bx0?[bx0,by0,bx1,by1]:null;return true};
 // the brush head's wet bloom, and light running along the string while you drag (lab frame(): "light only runs while you drag")
 I.decor=(c,play,T)=>{const run=I.runs[I.runs.length-1];if(!run||run.length<2)return;if(STRW)return; /* Sam Nov 2 7:35am (3b lab v9.1 HEADV=0): no dot or glow at the string's head, it sits under the thumb; the head is only the paint's own seep */const [hx,hy]=run[run.length-1];
  const br=7+play*4+Math.sin(T*.004)*.8,bg=c.createRadialGradient(hx,hy,0,hx,hy,br*2.2);bg.addColorStop(0,`rgba(255,248,215,${.55+.35*play})`);bg.addColorStop(.25,`rgba(255,236,170,${.22+.25*play})`);bg.addColorStop(1,'rgba(255,236,170,0)');c.fillStyle=bg;c.beginPath();c.arc(hx,hy,br*2.2,0,7);c.fill();
  if(play<=.02||STRW)return; /* lab v6.9: no light runner on the watercolour string */const S=[0];for(let i=1;i<run.length;i++)S.push(S[i-1]+Math.hypot(run[i][0]-run[i-1][0],run[i][1]-run[i-1][1]));const tot=S[S.length-1];
  const at=s=>{let i=1;while(i<S.length-1&&S[i]<s)i++;const u=(s-S[i-1])/((S[i]-S[i-1])||1),a=run[i-1],b=run[i],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,(b[0]-a[0])/l,(b[1]-a[1])/l]};
  for(let k=0;k<3;k++){const hd=((T*.11+k*tot/3)%(tot+120))-60;for(let i=0;i<12;i++){const s0=hd-i*9;if(s0<0||s0>tot)continue;const [x,y,tx,ty]=at(s0),f=(1-i/12)*play*.4;
   c.globalAlpha=.28*f;c.fillStyle='#fff6c8';c.beginPath();c.arc(x,y,16*f+6,0,7);c.fill();c.globalAlpha=.85*f;c.strokeStyle='#ffffff';c.lineWidth=7*f+3;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x+tx*12,y+ty*12);c.stroke()}}
  c.globalAlpha=1};
 // v31 back glint, trails look: light runs back down your own string from the tip to the last choice (x,y), every 1.8s
 I.backRun=(c,x,y,T)=>{let best=null,bd=1e9;for(const run of I.runs)run.forEach((p,i)=>{const d=Math.hypot(p[0]-x,p[1]-y);if(d<bd){bd=d;best={run,i}}});if(!best)return;
  const run=best.run,n=run.length-1,bi=best.i;if(n-bi<3)return;const u=(T%1800)/1800,e=u*u*(3-2*u),hd=n-(n-bi)*e,f=Math.sin(Math.PI*Math.min(1,u*1.1));c.save();c.lineCap='round';
  for(let i=0;i<16;i++){const s=Math.min(n,hd+i*1.6),j=Math.floor(s),w=s-j,a=run[j],b=run[Math.min(n,j+1)],px=a[0]+(b[0]-a[0])*w,py=a[1]+(b[1]-a[1])*w,k=(1-i/16)*f;
   c.globalAlpha=.3*k;c.fillStyle='#fff6c8';c.beginPath();c.arc(px,py,16*k+5,0,7);c.fill();c.globalAlpha=.9*k;c.fillStyle='#ffffff';c.beginPath();c.arc(px,py,3.5*k+1.5,0,7);c.fill()}c.restore();c.globalAlpha=1};
 return I}

Look.make=make;Look.UM=UM;Look.WN=WN;Look.prePatch=(R,seed,c)=>{const J=c?wcDiscJobC(R,seed,c):wcDiscJob(R,seed);if(!J.done&&!JOBQ.includes(J))JOBQ.push(J)}; /* v60s: an end door's bloom patch bakes ahead in idle slices */Look.disc=(R,seed,c)=>c?wcDiscJobC(R,seed,c):wcDiscJob(R,seed); /* v60r: the game bakes the new board's start patch in slices during the swap (its one-piece bake was ~27ms of the first draw) */Look.bake=ms=>{if(JOBQ.length)bakeAhead(ms)};Look.jobs=()=>JOBQ.length;Look.doorFx=doorFx;Look.DOORT=DOORT;Look.INK=INK;Look.DV=DV;Look.prep=prep;Look.Ink=Ink;Look.inkReset=()=>{for(let ri=0;ri<STRIPS.length;ri++)bmForget(ri)}; /* v59c: a new board forgets the last string pigment */
Look.NEBLAYER=NEB===9&&NEBHI;Look.ELW=ELW;Look.budK=1;Look.STREAKS=!/[?&]strk=1\b/.test(typeof location!=='undefined'?location.search:''); /* ?strk=1 = all streaks under the paint (lab Under) */ /* v33: the game gives nebula E its own full-res layer (see drawNebula) */
/* v60i (Sam Nov 4 9:52am 'transitions between levels is still janky, its losing frames'): the next sky can be baked in a worker
   (bake-worker.js), off the main thread. bakeData packs a finished bake for postMessage; fromBaked rebuilds it on the page. */
Look.bakeData=B=>({SDG:B.SDG,SDW:B.SDW,w2:B.im.width,h2:B.im.height,px:B.im.data,DOORP:B.DOORP,lmA:B.lmA,lmW:B.lmW,LG:B.LGJ&&B.LGJ.j>=B.LGJ.LH?{LW:B.LGJ.LW,LH:B.LGJ.LH,j:B.LGJ.j,BLK:B.LGJ.BLK,GRAIN:B.LGJ.GRAIN,STN:B.LGJ.STN}:null});
Look.fromBaked=d=>{const SDS=4,SDG=d.SDG,SDW=d.SDW,SDH=SDG.length/SDW;
 const sdf=(x,y)=>{const fx=clamp(x/SDS,0,SDW-1.001),fy=clamp(y/SDS,0,SDH-1.001),i=fx|0,j=fy|0,u=fx-i,v=fy-j,k=j*SDW+i;return (SDG[k]*(1-u)+SDG[k+1]*u)*(1-v)+(SDG[k+SDW]*(1-u)+SDG[k+SDW+1]*u)*v};
 const art=mk(d.w2,d.h2),ax=art.getContext('2d'),im=ax.createImageData(d.w2,d.h2);im.data.set(d.px);ax.putImageData(im,0,0);
 (d.DOORP||[]).forEach(P=>{if(P)P.done=true});
 return {SDG,sdf,art,im,done:true,artDone:true,lmA:d.lmA||null,lmW:d.lmW,LGJ:d.LG||null,DOORP:d.DOORP||[],doorJob:P=>({get done(){return true},step(){P.done=true;return true}}),SDW,step(){return true},fromWorker:true}};
if(typeof window!=='undefined')window.Look=Look;
})();
