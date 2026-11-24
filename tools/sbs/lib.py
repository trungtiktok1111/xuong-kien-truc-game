"""Dựng gói xuong-pack-1 từ sprite rời. Mỗi sprite khai điểm tham chiếu (ref) trong ảnh và vị trí đích so với tâm ô (off);
finalize() tính khung ảnh chung của gói, đệm từng sprite vào khung đó và ghi pack.json + sprites/*.png vào zip."""
import os,io,json,zipfile,math
from PIL import Image
import numpy as np
from common import load_keyed,bbox
DIRS={'E':(-.25,.25),'S':(-.25,-.25),'W':(.25,-.25),'N':(.25,.25)}
def edge_off(d,tile):return (DIRS[d][0]*tile[0],DIRS[d][1]*tile[1])
class Pack:
    def __init__(s,pid,name,tile,license,source,note=''):
        s.id=pid;s.name=name;s.tile=list(tile);s.license=license;s.source=source;s.note=note;s.items=[];s.keys=set();s.skipped=[]
    def add(s,key,im,role,dir='ALL',ref=None,off=(0,0),**meta):
        if bbox(im) is None:return False
        k=key;n=2
        while k in s.keys:k=key+'_'+str(n);n+=1
        s.keys.add(k);b=bbox(im);ref=ref or (im.width/2,b[3]);s.items.append(dict(key=k,im=im,role=role,dir=dir,ref=ref,off=off,meta=meta));return True
    def finalize(s,outdir='packs'):
        TW,TH=s.tile;x0,y0,x1,y1=-TW/2,-TH/2,TW/2,TH/2
        for it in s.items:
            lx=it['off'][0]-it['ref'][0];ly=it['off'][1]-it['ref'][1];it['pos']=(lx,ly)
            x0=min(x0,lx);y0=min(y0,ly);x1=max(x1,lx+it['im'].width);y1=max(y1,ly+it['im'].height)
        x0=math.floor(x0);y0=math.floor(y0);W=int(math.ceil(x1)-x0);H=int(math.ceil(y1)-y0)
        if H<W:y0-=W-H;H=W   # khung cao ≥ rộng để ô vật không bị cắt đầu
        ax,ay=-x0,-y0
        os.makedirs(outdir,exist_ok=True);zp=os.path.join(outdir,s.id+'.zip')
        assets={}
        with zipfile.ZipFile(zp,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
            seen={}
            for it in s.items:
                b=bbox(it['im']);ck=(id(it['im']),b)
                if ck not in seen:
                    cr=it['im'].crop(b);bio=io.BytesIO();cr.save(bio,'PNG',optimize=True);path='sprites/'+it['key']+'.png';z.writestr(path,bio.getvalue());seen[ck]=path
                path=seen[ck]
                a={'png':path,'role':it['role'],'dir':it['dir'],'at':[int(round(ax+it['pos'][0]+b[0])),int(round(ay+it['pos'][1]+b[1]))]};a.update(it['meta']);assets[it['key']]=a
            man={'format':'xuong-pack-1','id':s.id,'name':s.name,'license':s.license,'source':s.source,
              'projection':{'type':'iso','tile':s.tile,'canvas':[W,H],'anchor':[ax,ay],'zUnit':'px','rotation':{'E':0,'S':90,'W':180,'N':270}},'assets':assets}
            if s.note:man['note']=s.note
            z.writestr('pack.json',json.dumps(man,ensure_ascii=False,indent=1))
        return zp,len(assets),os.path.getsize(zp),(W,H)
def coverage(im,tile):
    a=np.array(im)[...,3]>8;return a.sum()/(tile[0]*tile[1]/2)
def split_cols(im,gap=3):
    a=np.array(im)[...,3]>8;cols=a.any(0);out=[];x=0;W=im.width
    while x<W:
        if cols[x]:
            s=x
            while x<W and (cols[x] or (x+gap<W and cols[x:x+gap+1].any())):x+=1
            out.append((s,x))
        else:x+=1
    return out
def bottom_at(im,x):
    a=np.array(im)[...,3]>8;x=int(min(max(x,0),im.width-1))
    for dx in (0,1,-1,2,-2,3,-3):
        xx=x+dx
        if 0<=xx<im.width:
            ys=np.where(a[:,xx])[0]
            if len(ys):return int(ys.max())+1
    return im.height
def slope(t):
    a=np.array(t)[...,3]>8;w=t.width
    def top(x):
        ys=np.where(a[:,x])[0];return ys.min() if len(ys) else None
    l=[v for v in (top(x) for x in range(0,6)) if v is not None];r=[v for v in (top(x) for x in range(w-6,w)) if v is not None]
    if not l or not r:return '?'
    return '\\' if np.mean(l)<np.mean(r) else '/'

def base_mid(im,b):
    """điểm giữa đường chân tường: nội suy từ đáy hai đầu (cột giữa có thể là lỗ cửa nên không dùng)"""
    return (bottom_at(im,b[0]+2)+bottom_at(im,b[2]-3))/2
