import {el} from './util.js';

const labels=['Góc sau','Mép sau phải','Góc phải','Mép sau trái','Tâm đáy','Mép trước phải','Góc trái','Mép trước trái','Góc trước'];

export function baseAnchorPicker(onChange){
 const buttons=labels.map((label,index)=>el('button',{type:'button',class:'b',
  title:label,'aria-label':label,'aria-pressed':String(index===4),onclick:()=>select(index)},index===4?'●':'○'));
 function select(index){
  buttons.forEach((button,i)=>{
   button.classList.toggle('on',i===index);
   button.setAttribute('aria-pressed',String(i===index));
  });
  onChange(index);
 }
 buttons[4].classList.add('on');
 return el('div',{},el('span',{class:'hint'},'Điểm neo đáy'),
  el('div',{role:'group','aria-label':'9 điểm neo đáy',style:'display:grid;grid-template-columns:repeat(3,2rem);gap:3px'},buttons));
}

export function baseAnchorPoints([left,top,right,bottom]){
 const x=[left,(left+right)/2,right],y=[top,(top+bottom)/2,bottom];
 return y.flatMap(v=>x.map(u=>[u,v]));
}
