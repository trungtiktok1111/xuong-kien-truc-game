import test from 'node:test';
import assert from 'node:assert/strict';
import {alignmentGuides,measureJoin,seamHeightDifference} from '../src/pieceAlignment.js';
import {actorFootprint,fitsUnderRoof,roofBlockedFootprint} from '../src/headroom2d.js';

test('neighbours are distinguished by edges, corners, separation and overlapping area',()=>{
  const a=[0,0,2,2];
  assert.equal(measureJoin(a,[2,0,4,2]).kind,'edge');
  assert.equal(measureJoin(a,[2,2,4,4]).kind,'corner');
  assert.equal(measureJoin(a,[2.25,0,4,2]).distance,.25);
  const overlap=measureJoin(a,[1.75,1,4,2]);
  assert.equal(overlap.kind,'overlap');
  assert.deepEqual(overlap.overlap,[.25,1]);
  assert.deepEqual(alignmentGuides(a,[2.25,0,4.25,2],.3).map(g=>g.delta),[.25,0]);
});

test('a seam can meet on the plan while its sloping edge differs in height',()=>{
  const a={bounds:[0,0,2,2],direction:'E',base:1,rise:1};
  const b={...a,bounds:[2,0,4,2],base:2};
  assert.equal(seamHeightDifference(a,b),0);
  assert.equal(seamHeightDifference(a,{...b,base:1.75}),.25);
  assert.equal(seamHeightDifference(a,{...b,direction:'S'}),1);
});

test('roof collision overlay follows the same posture and footprint as movement',()=>{
  for(const direction of ['E','W','N','S'])for(const rise of [1,-1,0]){
    const roof={bounds:[2,3,7,8],direction,base:rise<0?1.8:.8,rise};
    for(const h of [.68,1.2,2]){
      const region=roofBlockedFootprint(roof,h,.28);
      for(let x=1.82;x<7.5;x+=.17)for(let y=2.81;y<8.5;y+=.17){
        const shown=!!region&&x>=region[0]&&x<=region[2]&&y>=region[1]&&y<=region[3];
        assert.equal(shown,!fitsUnderRoof([roof],actorFootprint(x,y,.28),h));
      }
    }
  }
});
