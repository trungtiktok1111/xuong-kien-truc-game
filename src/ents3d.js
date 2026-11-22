import * as THREE from 'three';
export const OT3={start:['🚩','Xuất phát','#3ddc84'],enemy:['👾','Quái','#ff5a5a'],npc:['🧑','NPC','#4fa8ff'],chest:['🎁','Rương','#ffd24a'],goal:['🏁','Đích','#c77dff']};
export const COLS=['#d94b4b','#4f8fe0','#3fae6b','#e0a93a','#9b59d6','#e8e8e8','#222733'];
export const defCfg3=()=>({hp:5,spd:4.2,jump:7.5,dmg:1,rng:2.2,win:'auto'});
export function newEnt3(t,x,y,z){const b={id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),t,x,y,z,name:OT3[t][1]};
  if(t==='enemy')Object.assign(b,{col:'#d94b4b',hp:2,dmg:1,spd:1.8,chase:7,ai:'wander'});
  if(t==='npc')Object.assign(b,{col:'#4f8fe0',name:'Dân làng',text:'Chào kiếm sĩ! Cẩn thận quái vật quanh đây.'});
  if(t==='chest')Object.assign(b,{gives:'hp',amt:2});
  return b;}
const L=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
export function entModel(e){const g=new THREE.Group(),t=e.t;
  const person=(col,horns,hat)=>{const cm=L(col),sk=L(0xf0c8a0),dk=L(0x222733);
    const b=new THREE.Mesh(new THREE.BoxGeometry(.55,.8,.34),cm);b.position.y=.95;const h=new THREE.Mesh(new THREE.SphereGeometry(.23,12,10),horns?cm:sk);h.position.y=1.55;
    const l1=new THREE.Mesh(new THREE.BoxGeometry(.2,.55,.22),dk),l2=l1.clone();l1.position.set(-.14,.3,0);l2.position.set(.14,.3,0);g.add(b,h,l1,l2);
    if(horns){for(const s of [-1,1]){const c=new THREE.Mesh(new THREE.ConeGeometry(.07,.25,6),L(0xffffff));c.position.set(.14*s,1.82,0);g.add(c);const eye=new THREE.Mesh(new THREE.SphereGeometry(.04,6,6),L(0x000000));eye.position.set(.09*s,1.58,.2);g.add(eye);}}
    if(hat){const c=new THREE.Mesh(new THREE.ConeGeometry(.32,.3,14),dk);c.position.y=1.85;g.add(c);}};
  if(t==='enemy')person(new THREE.Color(e.col||'#d94b4b'),true,false);
  else if(t==='npc')person(new THREE.Color(e.col||'#4f8fe0'),false,true);
  else if(t==='chest'){const b=new THREE.Mesh(new THREE.BoxGeometry(.8,.5,.55),L(0x8a5a2b));b.position.y=.25;const l=new THREE.Mesh(new THREE.BoxGeometry(.84,.2,.59),L(0xffc83a));l.position.y=.6;const k=new THREE.Mesh(new THREE.BoxGeometry(.12,.16,.06),L(0xffffff));k.position.set(0,.5,.3);g.add(b,l,k);g.userData.lid=l;}
  else if(t==='start'){const p=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.8,6),L(0xdddddd));p.position.y=.9;const f=new THREE.Mesh(new THREE.BoxGeometry(.6,.38,.03),L(0x3ddc84,{emissive:0x114422}));f.position.set(.32,1.55,0);const d=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.05,16),L(0x3ddc84,{transparent:true,opacity:.6}));d.position.y=.03;g.add(p,f,d);}
  else if(t==='goal'){const r=new THREE.Mesh(new THREE.TorusGeometry(.55,.1,10,24),L(0xc77dff,{emissive:0x5a2a88}));r.position.y=1;const c=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.06,16),L(0xc77dff,{emissive:0x5a2a88}));c.position.y=.03;const o=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),L(0xffffff,{emissive:0xaa88ff}));o.position.y=1;g.add(r,c,o);}
  return g;}
