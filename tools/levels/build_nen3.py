# Bộ "kho nền thô": mọi vật liệu/phiến nền lẻ đã gửi (36 vật liệu + 4 ô Tiles2D + phiến nền cũ) thành ô iso 192x96, và bộ ô vuông nhìn từ trên (Pho-Cho Hoàn-Thiện) – chỉ để vẽ tay (pal=1)
import os,json,io,base64,glob,cv2,numpy as np
from PIL import Image
import build_nen2 as B
R=B.R;CELL=192;CY=42;COLS=8
def slab_face(path):
    im=np.array(Image.open(path).convert('RGBA'));a=im[...,3]>128;ys,xs=np.where(a)
    y0=ys.min();xt=int(xs[ys==y0].mean());x0=xs.min();yl=int(ys[xs==x0].mean());x1=xs.max();yr=int(ys[xs==x1].mean())
    top=np.array([xt,y0],np.float32);rt=np.array([x1,yr],np.float32);lf=np.array([x0,yl],np.float32)
    jj,ii=np.mgrid[0:R,0:R];u=((ii+.5)/R*.96+.02)[...,None];v=((jj+.5)/R*.96+.02)[...,None]
    P=top+u*(rt-top)+v*(lf-top)
    return cv2.remap(im[...,:3].astype(np.float32),P[...,0].astype(np.float32),P[...,1].astype(np.float32),cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
def sq(path):return cv2.resize(np.array(Image.open(path).convert('RGB')),(R,R),interpolation=cv2.INTER_CUBIC).astype(np.float32)
E=B.VL
tiles={}
for f in sorted(glob.glob(E+'VL-*/tile_*.png')):
    n=os.path.basename(f)[5:-4].lower().replace('_','-');tiles[n]=sq(f)
for f in sorted(glob.glob('/tmp/iso3/0bfc2c3d-Lang-Nui-Vo-Hiep-Asset-Pack-v1/Tiles2D/*.png')):tiles['t2d-'+os.path.basename(f)[:-4].lower()]=sq(f)
for f,n in [('/tmp/ext/735a43c7-Pho-Cho-Ben-Kenh-2D-Hoan-Thien/assets/Dia-hinh/Dat-co.png','phien-dat-co'),('/tmp/ext/735a43c7-Pho-Cho-Ben-Kenh-2D-Hoan-Thien/assets/Dia-hinh/Dat-nen.png','phien-dat-nen'),('/tmp/ext/735a43c7-Pho-Cho-Ben-Kenh-2D-Hoan-Thien/assets/Dia-hinh/Nen-lat-da.png','phien-lat-da'),('/tmp/ext/735a43c7-Pho-Cho-Ben-Kenh-2D-Hoan-Thien/assets/Dia-hinh/Mat-nuoc-kenh.png','phien-nuoc-kenh'),('/tmp/ext/sm2/Sprites/Dia-hinh-va-do-treo/San-da-tuyet.png','phien-san-da-tuyet'),('/tmp/ext/sm2/Sprites/Dia-hinh-va-do-treo/Ho-bang.png','phien-ho-bang')]:
    if os.path.exists(f):tiles[n]=slab_face(f)
names=['nen']+list(tiles);tiles['nen']=tiles['da-lat']
rows=(len(names)+COLS-1)//COLS;atl=Image.new('RGBA',(COLS*CELL,rows*CELL),(0,0,0,0));idx={}
for i,n in enumerate(names):
    atl.alpha_composite(B.warp(tiles[n]),((i%COLS)*CELL,(i//COLS)*CELL+CY));idx[n]=i
buf=io.BytesIO();atl.save(buf,'PNG',optimize=True)
th=B.warp(tiles['da-lat']).resize((96,48))
packs=[]
packs.append(({'id':'kho-vat-lieu','name':'Kho vật liệu & phiến nền (vẽ tay)','desc':'Mọi vật liệu đá, gạch, gỗ, vôi, ngói, sỏi + ô Tiles2D + phiến nền cũ (cỏ-đất, lát đá, mặt nước, tuyết, hồ băng) dạng ô iso để vẽ tay','tw':CELL,'cy':CY,'cols':COLS,'idx':idx,'bz':{},'pal':1,'atlas':'data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()},th,len(names),len(buf.getvalue())//1024))
# bộ ô vuông nhìn từ trên (Hoàn Thiện): co, da, dat, go, nuoc-0..3, bo-nuoc, dat-co, dat-da 00..15
T='/tmp/ext/735a43c7-Pho-Cho-Ben-Kenh-2D-Hoan-Thien/assets/Tileset/'
fs=sorted(os.listdir(T));fs=[f for f in fs if f.endswith('.png')];C2=8;rows=(len(fs)+C2-1)//C2
atl=Image.new('RGBA',(C2*128,rows*128),(0,0,0,0));idx={}
for i,f in enumerate(fs):atl.alpha_composite(Image.open(T+f).convert('RGBA'),((i%C2)*128,(i//C2)*128));idx[f[:-4]]=i
buf=io.BytesIO();atl.save(buf,'PNG',optimize=True)
th2=Image.open(T+'da.png').convert('RGBA').resize((64,64))
packs.append(({'id':'pho-cho-nhin-tren','name':'Phố chợ bến kênh (nhìn từ trên, ô vuông)','desc':'Bộ ô vuông 128 px nhìn từ trên: cỏ, đá, đất, gỗ, nước, bờ nước, chuyển đất–cỏ, đất–đá (cho màn 2D nhìn từ trên)','tw':128,'cy':0,'cols':C2,'idx':idx,'bz':{},'pal':1,'iso':0,'atlas':'data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()},th2,len(fs),len(buf.getvalue())//1024))
old=json.load(open('/home/claude/ed/nen/index.json'));ids={p[0]['id'] for p in packs};keep=[o for o in old if o['id'] not in ids]
for pk,th,n,kb in packs:
    json.dump(pk,open(f"/home/claude/ed/nen/{pk['id']}.json",'w'),ensure_ascii=False,separators=(',',':'))
    tb=io.BytesIO();th.save(tb,'PNG');keep.append({'id':pk['id'],'name':pk['name'],'desc':pk['desc'],'n':n,'kb':kb,'pal':1,'thumb':'data:image/png;base64,'+base64.b64encode(tb.getvalue()).decode()});print(pk['id'],n,kb,'KB')
json.dump(keep,open('/home/claude/ed/nen/index.json','w'),ensure_ascii=False,separators=(',',':'))
# xem nhanh
sh=Image.new('RGBA',(COLS*192,rows*0+((len(names)+7)//8)*100),(20,24,34,255));a=Image.open(io.BytesIO(buf.getvalue())) if False else None
at=Image.open(io.BytesIO(base64.b64decode(packs[0][0]['atlas'].split(',')[1])))
for i in range(len(names)):sh.alpha_composite(at.crop(((i%8)*192,(i//8)*192+CY,(i%8)*192+192,(i//8)*192+CY+96)),((i%8)*192,(i//8)*100))
sh.save('/tmp/kho.png')
