// Logic "khi X thì Y" + biến + hội thoại nhánh — dùng chung 2D/3D (bước 2)
// Dữ liệu (nằm trong cfg, đi theo bản lưu / xuất):
//   cfg.vars  = [{k,v,hud}]                      biến khởi tạo (số; cờ = 0/1)
//   cfg.rules = [{id,on:{t,ref},if:[cond],do:[act],once}]
//   ent.hid   = true  → ẩn lúc đầu (hiện bằng hành động "show")
//   npc.dlg   = {start,nodes:[{id,text,ch:[{t,next,if:[cond],do:[act]}]}]}
//   cond = {k,op,v}   op: == != > >= < <=
//   act  = {a:'say',text}|{a:'set',k,v}|{a:'add',k,v}|{a:'heal',v}|{a:'hurt',v}|{a:'show',ref}|{a:'hide',ref}|{a:'win'}|{a:'lose'}
import {el,toast} from './util.js';

export const TRIG=[['start','Game bắt đầu'],['talk','Nói chuyện với NPC'],['kill','Diệt quái'],['allkill','Diệt hết quái'],['chest','Mở rương'],['goal','Chạm đích'],['var','Điều kiện trở thành đúng']];
export const ACTS=[['say','💬 Nói / báo'],['set','🔢 Đặt biến = '],['add','➕ Tăng biến'],['heal','❤️ Hồi máu'],['hurt','💥 Mất máu'],['show','👁 Hiện đối tượng'],['hide','🚫 Ẩn đối tượng'],['win','🏆 Thắng'],['lose','💀 Thua']];
export const OPS=['==','!=','>','>=','<','<='];
export const ACT_KEYS=ACTS.map(a=>a[0]);
const ICO={start:'🚩',enemy:'👾',npc:'🧑',chest:'🎁',goal:'🏁'};
const OPF={'==':(a,b)=>a==b,'!=':(a,b)=>a!=b,'>':(a,b)=>a>b,'>=':(a,b)=>a>=b,'<':(a,b)=>a<b,'<=':(a,b)=>a<=b};
export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
export const entLabel=e=>(ICO[e.t]||'•')+' '+(e.name||e.t)+' ('+e.x+','+(e.z!=null?e.z:e.y)+')';

// ---------------- runtime ----------------
export function createLogic(cfg,ents,host,ov){
  const vars={},fired={},was={},rules=(cfg&&cfg.rules)||[];for(const v of (cfg&&cfg.vars)||[])vars[v.k]=+v.v||0;
  const hudVars=((cfg&&cfg.vars)||[]).filter(v=>v.hud);
  const hud=el('div',{style:'position:absolute;left:12px;top:calc(env(safe-area-inset-top) + 64px);color:#ffe9a8;font:700 15px system-ui;text-shadow:0 1px 3px #000;white-space:pre'});
  if(ov)ov.append(hud);
  const L={vars,dlgOpen:false,hud};
  const fmt=t=>String(t==null?'':t).replace(/\{(\w+)\}/g,(m,k)=>k in vars?vars[k]:m);
  const cond=c=>{const a=+vars[c.k]||0;return (OPF[c.op]||OPF['=='])(a,+c.v);};
  const all=list=>(list||[]).every(cond);
  function refresh(){hud.textContent=hudVars.map(v=>v.k+': '+(vars[v.k]||0)).join('\n');}
  function run(acts){for(const a of acts||[]){
    switch(a.a){
      case 'say':host.say(fmt(a.text),3);break;
      case 'set':vars[a.k]=+a.v||0;break;
      case 'add':vars[a.k]=(+vars[a.k]||0)+(+a.v||0);break;
      case 'heal':host.heal(+a.v||1);break;
      case 'hurt':host.hurt(+a.v||1);break;
      case 'show':host.setHidden(a.ref,false);break;
      case 'hide':host.setHidden(a.ref,true);break;
      case 'win':host.win();break;
      case 'lose':host.lose();break;
      default:console.warn('logic: hành động chưa có handler',a.a);}}
    refresh();}
  let depth=0;
  function fire(t,ref){
    if(depth>6)return;depth++;
    for(const r of rules){if(!r.on||r.on.t!==t)continue;if(t!=='var'&&t!=='start'&&t!=='allkill'&&t!=='goal'&&r.on.ref&&r.on.ref!=='any'&&r.on.ref!==ref)continue;
      if(r.once&&fired[r.id])continue;
      if(t==='var'){if(!all(r.if)){was[r.id]=false;continue;}if(was[r.id])continue;was[r.id]=true;}
      else if(!all(r.if))continue;
      fired[r.id]=1;run(r.do);}
    if(t!=='var')fire('var');
    depth--;}
  L.fire=fire;L.run=run;L.fmt=fmt;L.refresh=refresh;
  // hội thoại
  L.talk=(npc,after)=>{const d=npc.dlg;if(!d||!d.nodes||!d.nodes.length)return false;
    const byId=Object.fromEntries(d.nodes.map(n=>[n.id,n]));const box=el('div',{class:'dlgbox',style:'position:absolute;left:0;right:0;bottom:0;z-index:5;padding:14px 14px calc(env(safe-area-inset-bottom) + 14px);background:linear-gradient(#0000,#000d 25%);color:#fff;font:16px system-ui'});
    if(ov)ov.append(box);L.dlgOpen=true;
    const close=()=>{box.remove();L.dlgOpen=false;after&&after();};
    function show(id){const n=byId[id];if(!n){close();return;}box.textContent='';
      box.append(el('div',{style:'font-weight:700;color:#f3d27a;margin-bottom:4px'},npc.name||'NPC'),el('div',{style:'line-height:1.5;margin-bottom:10px'},fmt(n.text)));
      const ch=(n.ch||[]).filter(c=>all(c.if));
      const go=(c)=>{run(c.do);if(c.next&&byId[c.next])show(c.next);else close();};
      if(!ch.length)box.append(el('div',{style:'padding:10px 16px;border-radius:14px;background:#e0b050;color:#2a1a08;font-weight:700;text-align:center',onclick:close},'Tiếp tục ▸'));
      else for(const c of ch)box.append(el('div',{style:'padding:10px 14px;margin:6px 0;border-radius:14px;background:#2a3d52;border:1px solid #5b7a99',onclick:()=>go(c)},'▸ '+fmt(c.t)));}
    show(d.start||d.nodes[0].id);return true;};
  L.close=()=>{};refresh();return L;
}

// ---------------- UI soạn thảo ----------------
const css={sel:'padding:7px;border-radius:8px;border:1px solid #3a4a5c;background:#202c38;color:#fff;font-size:14px;max-width:100%',
  txt:'width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:15px',
  card:'border:1px solid #34485a;border-radius:10px;padding:8px;margin:6px 0;background:#16202b'};
const B=(l,f,c='')=>el('button',{class:'b '+c,onclick:f},l);
function sel(opts,val,fn){const s=el('select',{style:css.sel},opts.map(([v,n])=>el('option',{value:v},n)));s.value=val;s.onchange=()=>fn(s.value);return s;}
function inp(val,fn,w,type){const i=el('input',{type:type||'text',value:val==null?'':val,style:css.sel+';width:'+(w||'90px')});i.oninput=()=>fn(type==='number'?+i.value:i.value);return i;}
const entOpts=(ents,types,any)=>[...(any?[['any','(bất kỳ)']]:[]),...ents.filter(e=>!types||types.includes(e.t)).map(e=>[e.id,entLabel(e)])];

export function condEditor(list,vars,ch){
  const w=el('div');list.forEach((c,i)=>w.append(el('div',{class:'row'},inp(c.k,v=>{c.k=v;ch();},'80px'),sel(OPS.map(o=>[o,o]),c.op,v=>{c.op=v;ch();}),inp(c.v,v=>{c.v=v;ch();},'60px','number'),B('✕',()=>{list.splice(i,1);ch(true);}))));
  w.append(B('➕ Điều kiện (biến)',()=>{list.push({k:(vars[0]&&vars[0].k)||'diem',op:'>=',v:1});ch(true);}));return w;}
export function actEditor(list,ents,ch){
  const w=el('div');list.forEach((a,i)=>{const r=el('div',{class:'row'},sel(ACTS,a.a,v=>{a.a=v;ch(true);}));
    if(a.a==='say')r.append(inp(a.text,v=>{a.text=v;ch();},'180px'));
    else if(a.a==='set'||a.a==='add')r.append(inp(a.k,v=>{a.k=v;ch();},'80px'),inp(a.v,v=>{a.v=v;ch();},'60px','number'));
    else if(a.a==='heal'||a.a==='hurt')r.append(inp(a.v,v=>{a.v=v;ch();},'60px','number'));
    else if(a.a==='show'||a.a==='hide')r.append(sel(entOpts(ents.filter(e=>e.t!=='start')),a.ref||'',v=>{a.ref=v;ch();}));
    r.append(B('✕',()=>{list.splice(i,1);ch(true);}));w.append(r);});
  w.append(B('➕ Hành động',()=>{list.push({a:'say',text:'Xin chào!'});ch(true);}));return w;}

// Tab ⚙ Logic: biến + luật
export function logicTab(body,cfg,ents,after,redraw){
  cfg.vars=cfg.vars||[];cfg.rules=cfg.rules||[];
  const ch=(re)=>{after();if(re)redraw();};
  body.append(el('div',{class:'hint'},'Luật "Khi X thì Y": chọn sự kiện, (tuỳ chọn) điều kiện biến, rồi các hành động. Trong chữ có thể chèn {tên_biến}. Đối tượng muốn hiện sau thì đặt "Ẩn lúc đầu" ở tab 🎯 Đối tượng.'));
  body.append(el('div',{class:'lbl'},'🔢 Biến (số; cờ = 0/1)'));
  for(const [i,v] of cfg.vars.entries())body.append(el('div',{class:'row'},inp(v.k,x=>{v.k=x;ch();},'90px'),el('span',{class:'lbl'},'bắt đầu ='),inp(v.v,x=>{v.v=x;ch();},'60px','number'),
    (()=>{const c=el('input',{type:'checkbox'});c.checked=!!v.hud;c.onchange=()=>{v.hud=c.checked;ch();};return el('label',{class:'lbl'},c,' hiện trên màn');})(),B('✕',()=>{cfg.vars.splice(i,1);ch(true);})));
  body.append(el('div',{class:'row'},B('➕ Thêm biến',()=>{cfg.vars.push({k:'bien'+(cfg.vars.length+1),v:0,hud:true});ch(true);})));
  body.append(el('div',{class:'lbl',style:'margin-top:8px'},'⚙ Luật ('+cfg.rules.length+')'));
  cfg.rules.forEach((r,i)=>{r.on=r.on||{t:'start'};r.if=r.if||[];r.do=r.do||[];
    const card=el('div',{style:css.card});
    const trow=el('div',{class:'row'},el('b',{},'KHI'),sel(TRIG,r.on.t,v=>{r.on={t:v,ref:'any'};ch(true);}));
    if(r.on.t==='talk')trow.append(sel(entOpts(ents,['npc'],1),r.on.ref||'any',v=>{r.on.ref=v;ch();}));
    if(r.on.t==='kill')trow.append(sel(entOpts(ents,['enemy'],1),r.on.ref||'any',v=>{r.on.ref=v;ch();}));
    if(r.on.t==='chest')trow.append(sel(entOpts(ents,['chest'],1),r.on.ref||'any',v=>{r.on.ref=v;ch();}));
    card.append(trow,el('div',{class:'lbl'},'NẾU (tuỳ chọn)'),condEditor(r.if,cfg.vars,ch),el('div',{class:'lbl'},'THÌ'),actEditor(r.do,ents,ch));
    const once=el('input',{type:'checkbox'});once.checked=!!r.once;once.onchange=()=>{r.once=once.checked;ch();};
    card.append(el('div',{class:'row'},el('label',{class:'lbl'},once,' Chỉ chạy một lần'),B('🗑 Xoá luật',()=>{cfg.rules.splice(i,1);ch(true);})));body.append(card);});
  body.append(el('div',{class:'row'},B('➕ Luật mới',()=>{cfg.rules.push({id:uid(),on:{t:'start'},if:[],do:[{a:'say',text:'Bắt đầu!'}],once:true});ch(true);})));
  body.append(el('div',{class:'lbl',style:'margin-top:6px'},'Mẫu nhanh'));
  const gl=ents.find(e=>e.t==='goal');
  body.append(el('div',{class:'row'},
    B('Diệt hết quái → hiện đích',()=>{if(!gl)return toast('Đặt 🏁 Đích trước.');gl.hid=true;cfg.rules.push({id:uid(),on:{t:'allkill'},if:[],do:[{a:'say',text:'Đích đã mở ra!'},{a:'show',ref:gl.id}],once:true});cfg.win='goal';ch(true);}),
    B('Mở rương → +1 điểm',()=>{if(!cfg.vars.some(v=>v.k==='diem'))cfg.vars.push({k:'diem',v:0,hud:true});cfg.rules.push({id:uid(),on:{t:'chest',ref:'any'},if:[],do:[{a:'add',k:'diem',v:1},{a:'say',text:'Điểm: {diem}'}],once:false});ch(true);}),
    B('Đủ 3 điểm → thắng',()=>{if(!cfg.vars.some(v=>v.k==='diem'))cfg.vars.push({k:'diem',v:0,hud:true});cfg.rules.push({id:uid(),on:{t:'var'},if:[{k:'diem',op:'>=',v:3}],do:[{a:'win'}],once:true});ch(true);})));
}

// phần thêm trong bảng thuộc tính đối tượng: "Ẩn lúc đầu" + hội thoại nhánh cho NPC
const DLGOPEN=new Set();
export function entExtra(e,after,redraw){
  const out=[];
  if(e.t!=='start'){const c=el('input',{type:'checkbox'});c.checked=!!e.hid;c.onchange=()=>{e.hid=c.checked;after();};out.push(el('div',{class:'row'},el('label',{class:'lbl'},c,' Ẩn lúc đầu (hiện bằng luật ⚙ Logic)')));}
  if(e.t==='npc'){
    const open=DLGOPEN.has(e.id);
    out.push(el('div',{class:'row'},B(e.dlg?'💬 Sửa hội thoại nhánh ('+e.dlg.nodes.length+' đoạn)':'💬 Tạo hội thoại nhánh',()=>{if(!e.dlg)e.dlg={start:'n1',nodes:[{id:'n1',text:e.text||'Xin chào!',ch:[{t:'Tạm biệt',next:''}]}]};open?DLGOPEN.delete(e.id):DLGOPEN.add(e.id);after();redraw();}),
      e.dlg?B('Bỏ hội thoại nhánh',()=>{delete e.dlg;DLGOPEN.delete(e.id);after();redraw();}):'' ));
    if(e.dlg&&open){const d=e.dlg,w=el('div',{style:css.card});
      const ch=(re)=>{after();if(re)redraw();};
      d.nodes.forEach((n,i)=>{n.ch=n.ch||[];const nc=el('div',{style:'border-left:3px solid #e0b050;padding-left:8px;margin:8px 0'});
        nc.append(el('div',{class:'row'},el('b',{},'Đoạn '+n.id+(d.start===n.id?' (mở đầu)':'')),d.start!==n.id?B('Làm đoạn mở đầu',()=>{d.start=n.id;ch(true);}):'',d.nodes.length>1?B('🗑',()=>{d.nodes.splice(i,1);if(d.start===n.id)d.start=d.nodes[0].id;ch(true);}):''));
        const t=el('textarea',{rows:2,style:css.txt});t.value=n.text;t.oninput=()=>{n.text=t.value;ch();};nc.append(t);
        n.ch.forEach((c,j)=>{const cc=el('div',{style:'margin:6px 0;padding:6px;border-radius:8px;background:#1d2a38'});
          cc.append(el('div',{class:'row'},el('span',{class:'lbl'},'Lựa chọn'),inp(c.t,v=>{c.t=v;ch();},'150px'),el('span',{class:'lbl'},'→'),sel([['','(kết thúc)'],...d.nodes.map(x=>[x.id,'đoạn '+x.id])],c.next||'',v=>{c.next=v;ch();}),B('✕',()=>{n.ch.splice(j,1);ch(true);})));
          c.if=c.if||[];c.do=c.do||[];
          cc.append(el('div',{class:'lbl'},'chỉ hiện nếu'),condEditor(c.if,[],ch),el('div',{class:'lbl'},'khi chọn thì'),actEditor(c.do,[],ch));nc.append(cc);});
        nc.append(B('➕ Lựa chọn',()=>{n.ch.push({t:'...',next:''});ch(true);}));w.append(nc);});
      w.append(B('➕ Thêm đoạn thoại',()=>{let k=d.nodes.length+1;while(d.nodes.some(x=>x.id==='n'+k))k++;d.nodes.push({id:'n'+k,text:'...',ch:[]});ch(true);}));
      out.push(w);}
  }
  return out;
}

// ---------------- kiểm tra tham chiếu (dùng ở ✅ Kiểm tra) ----------------
export function checkLogic(cfg,ents){
  const rep=[],ids=new Set(ents.map(e=>e.id)),rules=(cfg&&cfg.rules)||[],vars=(cfg&&cfg.vars)||[];
  const written=new Set(vars.map(v=>v.k)),read=new Set(),bad=[],badAct=[];
  const walkA=(acts,where)=>{for(const a of acts||[]){if(!ACT_KEYS.includes(a.a))badAct.push(where+': "'+a.a+'"');if((a.a==='set'||a.a==='add')&&a.k)written.add(a.k);if((a.a==='show'||a.a==='hide')&&!ids.has(a.ref))bad.push(where+': '+a.a+' đối tượng không còn tồn tại');}};
  const walkC=(cs)=>{for(const c of cs||[])read.add(c.k);};
  rules.forEach((r,i)=>{const w='Luật '+(i+1);if(r.on&&['talk','kill','chest'].includes(r.on.t)&&r.on.ref&&r.on.ref!=='any'&&!ids.has(r.on.ref))bad.push(w+': sự kiện trỏ tới đối tượng đã xoá');walkC(r.if);walkA(r.do,w);});
  const dl=[];
  for(const e of ents)if(e.dlg){const d=e.dlg,nid=new Set(d.nodes.map(n=>n.id));if(!nid.has(d.start))bad.push((e.name||'NPC')+': đoạn mở đầu không tồn tại');
    const seen=new Set(),st=[d.start];while(st.length){const x=st.pop();if(seen.has(x))continue;seen.add(x);const n=d.nodes.find(q=>q.id===x);if(!n)continue;for(const c of n.ch||[]){walkC(c.if);walkA(c.do,(e.name||'NPC')+' → '+c.t);if(c.next){if(!nid.has(c.next))bad.push((e.name||'NPC')+': lựa chọn "'+c.t+'" trỏ tới đoạn không có');else st.push(c.next);}}}
    const un=d.nodes.filter(n=>!seen.has(n.id));if(un.length)dl.push((e.name||'NPC')+': đoạn '+un.map(n=>n.id).join(',')+' không bao giờ tới được');}
  const shown=new Set();const scan=(acts)=>{for(const a of acts||[])if(a.a==='show')shown.add(a.ref);};rules.forEach(r=>scan(r.do));ents.forEach(e=>e.dlg&&e.dlg.nodes.forEach(n=>(n.ch||[]).forEach(c=>scan(c.do))));
  const hid=ents.filter(e=>e.hid&&!shown.has(e.id));
  const unread=[...read].filter(k=>!written.has(k));
  const hasRules=rules.length||ents.some(e=>e.dlg);
  return {hasRules,bad,badAct,dl,hid,unread,canWinByRule:rules.some(r=>(r.do||[]).some(a=>a.a==='win')),hiddenAll:ents.filter(e=>e.hid)};
}
