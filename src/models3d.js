import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {unzipSync} from 'fflate';
export const b64=u8=>{let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s);};
export const unb64=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
/* Đọc 1 file GLB (kèm bảng texture {tên-file-thường: dataURL}) thành THREE.Group */
export function parseGLB(u8,tex){return new Promise((res,rej)=>{const mg=new THREE.LoadingManager();mg.setURLModifier(u=>{const b=decodeURIComponent(u.split('/').pop()).toLowerCase();return tex&&tex[b]?tex[b]:u;});
  const ab=u8.buffer.slice(u8.byteOffset,u8.byteOffset+u8.byteLength);
  const L=new GLTFLoader(mg);L.register(pr=>{pr.textureLoader=new THREE.TextureLoader(mg);return {name:'THK_tex'};});L.parse(ab,'',g=>{g.scene.traverse(o=>{if(o.isMesh){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m.map){m.map.magFilter=THREE.NearestFilter;m.map.minFilter=THREE.NearestFilter;}});}});res(g.scene);},rej);});}
const MIME={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'};
async function thumbOf(u8){try{const bm=await createImageBitmap(new Blob([u8]));const k=Math.min(1,96/Math.max(bm.width,bm.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(bm.width*k));c.height=Math.max(1,Math.round(bm.height*k));c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return c.toDataURL('image/webp',.8);}catch(e){return '';}}
const packName=n=>n.replace(/^.*[\\/]/,'').replace(/\.zip$/i,'').replace(/^kenney_/i,'').replace(/_[\d.]+$/,'');
/* Quét 1 file zip (có thể chứa zip con) → [{pack, tex:{}, models:[{name,cat,thumb,glb:Uint8Array}]}] */
export async function scanZip(u8,name,depth=0){
  const out=[];let files;
  try{files=unzipSync(u8,{filter:e=>{const n=e.name;if(/(__MACOSX|\/\._|^\._)/.test(n))return false;return /\.(glb|zip)$/i.test(n)||(/\.(png|webp|jpe?g)$/i.test(n)&&/(^|\/)(previews?|textures?)\//i.test(n));}});}catch(e){return out;}
  const pk=packName(name),pm={pack:pk,tex:{},models:[]};const prev={};
  for(const [p,d] of Object.entries(files)){const low=p.toLowerCase();
    if(low.endsWith('.zip')){if(depth<2)out.push(...await scanZip(d,p,depth+1));continue;}
    const base=p.split('/').pop();
    if(/\.(png|webp|jpe?g)$/i.test(low)){if(/(^|\/)previews?\//i.test(p))prev[base.replace(/\.\w+$/,'').toLowerCase()]=d;else{const ext=low.split('.').pop();pm.tex[base.toLowerCase()||'']='data:'+(MIME[ext]||'image/png')+';base64,'+b64(d);}}}
  for(const [p,d] of Object.entries(files)){if(!/\.glb$/i.test(p))continue;const nm=p.split('/').pop().replace(/\.glb$/i,'');const th=prev[nm.toLowerCase()];
    pm.models.push({name:nm,cat:(nm.split(/[-_ ]/)[0]||'khác').toLowerCase(),thumb:th?(th.length<60000?'data:image/png;base64,'+b64(th):await thumbOf(th)):'',glb:d});}
  if(pm.models.length)out.unshift(pm);return out;}
export const hasRarOnly=n=>/\.rar$/i.test(n);
