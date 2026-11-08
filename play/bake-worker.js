// v60i: bakes a board's sky (Look.prep) off the main thread, so the slide to the next board never waits on it.
// The page sends {id, o} with o.G as an affine [x0,y0,dxc,dyc,dxr,dyr]; we send back Look.bakeData(B) with its buffers transferred.
self.window=self;
self.document={createElement:()=>({width:0,height:0,getContext:()=>({createImageData:(w,h)=>new ImageData(w,h),putImageData(){}})})};
importScripts('look.js');
self.onmessage=e=>{const {id,o}=e.data;try{const g=o.Gp;o.G=(c,r)=>[g[0]+c*g[2]+r*g[4],g[1]+c*g[3]+r*g[5]];const t0=performance.now();const B=self.Look.prep(o);B.step(1e9);
 const d=self.Look.bakeData(B),tr=[d.SDG.buffer,d.px.buffer].concat(d.lmA?[d.lmA.buffer]:[],d.LG?[d.LG.BLK.buffer,d.LG.GRAIN.buffer,d.LG.STN.buffer]:[]);
 self.postMessage({id,d,ms:performance.now()-t0},tr)}catch(err){self.postMessage({id,err:String(err&&err.stack||err)})}};
self.postMessage({ready:true});
