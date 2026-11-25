import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mapCollision,rasterOutline} from '../src/mapCollision.js';
import {levelLibrary,outlineLevels} from '../src/outlineLevels.js';

test('library includes the original embedded Đá Xoáy map and ten new complex plans',()=>{
 const template=readFileSync('tpl.html','utf8');
 const sample=JSON.parse(template.match(/id="da-xoay-sample"[^>]*>(.*?)<\/script>/s)[1]);
 const levels=levelLibrary(sample);
 assert.equal(levels.length,29);
 assert.equal(levels.filter(level=>level.areas?.length).length,6);
 assert.equal(levels.filter(level=>level.group==='Bố cục phức tạp').length,11);
 assert.equal(new Set(levels.map(level=>level.id)).size,levels.length);
 assert.equal(levels[0].sample,sample);
 assert.equal(levels[0].loops,sample.cfg.outline.loops);
});

for(const {name,w,h,loops,start,goal,chests} of outlineLevels){
 test(name+' has a connected floor and valid game markers',()=>{
  const mask=rasterOutline(loops,w,h),seen=new Uint8Array(w*h);
  const index=([x,y])=>y*w+x;
  const queue=[index(start)];seen[queue[0]]=1;
  const collision=mapCollision({w,h,blk:Array.from(mask,v=>Number(!v)),cfg:{outline:{loops,floorCollision:true}}});
  for(let i=0;i<queue.length;i++){
   const x=queue[i]%w,y=Math.floor(queue[i]/w);
   for(const [a,b] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
    if(a<0||b<0||a>=w||b>=h)continue;
    const next=index([a,b]);
    if(mask[next]&&!seen[next]){seen[next]=1;queue.push(next);}
   }
  }
  assert.deepEqual(seen,mask);
  for(const [x,y] of [start,goal,...chests])assert.ok(collision.free(x+.5,y+.5,.28),[x,y].join(','));
 });
}
