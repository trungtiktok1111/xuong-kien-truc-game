export const characterNameKey=name=>name.trim().replace(/\s+/g,' ').normalize('NFKC').toLowerCase();

export function mergeAnimationClips(existing,incoming){
 const clips={...existing},keys=new Map();
 for(const [state,clip] of Object.entries(incoming)){
  const family=state.replace(/_\d+$/,'');
  const attack=/^atk\d*$/.test(state);
  const sameFamily=key=>attack?/^atk\d*$/.test(key):key===family||key.replace(/_\d+$/,'')===family;
  const serialized=JSON.stringify(clip);
  const duplicate=Object.keys(clips).find(key=>sameFamily(key)&&JSON.stringify(clips[key])===serialized);
  let key=duplicate||state;
  if(!duplicate&&Object.hasOwn(clips,key)){
   for(let i=2;Object.hasOwn(clips,key);i++)key=attack?'atk'+i:family+'_'+i;
  }
  clips[key]=clip;
  keys.set(state,key);
 }
 return {clips,keys};
}
