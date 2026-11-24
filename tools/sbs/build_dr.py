"""Dungeon Randomizer Master Tiles (bản 128) phóng 2× (lân cận gần nhất) lên ô 256×128."""
import sys,os,json,zipfile
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from lib import *
OUT='/home/claude/ed/packs'
Z='/mnt/user-data/uploads/6e69ba5e-Dr_Master_Tiles.zip'
im=Image.open(zipfile.ZipFile(Z).open('DR_Master_Tiles(128).png')).convert('RGBA')
K=2
def cell(r,c):
    t=im.crop((c*128,r*128,(c+1)*128,(r+1)*128));return t.resize((128*K,128*K),Image.NEAREST)
LIC='Không rõ giấy phép (Dungeon Randomizer Master Tiles) — chỉ dùng thử'
P=Pack('dr-master-tiles-256','DR Master Tiles hầm ngục (phóng 2× lên 256×128)',[256,128],LIC,'DR_Master_Tiles(128).png (bản 128, phóng 2× lân cận gần nhất)',
 'Bộ hầm ngục nhỏ: 1 ô sàn, 2 mặt tường (hướng \\ và /), cửa vòm 2 hướng, cột, tường thấp, 6 rương (3 đóng, 3 mở). Bản gốc 128×64 được phóng đúng 2× nên pixel to gấp đôi, khớp ô 256×128 của gói Kenney. Hướng rương chỉ có 3 góc nhìn nên đặt làm biến thể, không xoay. Cặp tường góc và tường thấp chưa hiệu chỉnh vùng chặn (solid=false).')
T=P.tile
def edges(t,key,label,role,**kw):
    b=bbox(t);s=slope(t.crop(b));rx=(b[0]+b[2])/2;ry=base_mid(t,b)
    for d in (['E','W'] if s=='\\' else ['S','N']):
        P.add(f'{key}_{d}',t,role,d,ref=(rx,ry),off=edge_off(d,T),group=key,name=label,**kw)
# sàn
f=cell(0,0);b=bbox(f);P.add('san_da',f,'nen','ALL',ref=(128,2*88),off=(0,0),group='san_da',name='Sàn hầm ngục')
# tường
for i,c in enumerate((1,2)):
    edges(cell(0,c),f'tuong_{i}','Tường hầm ngục','tuong',footprint=[-.5,.4,.5,.5])
for r_c,key in (((1,0),'cua_vom_a'),((1,1),'cua_vom_b')):
    edges(cell(*r_c),key,'Cửa vòm hầm ngục','cua',state='mo',col=[{'k':'seg','a':[-.5,.4],'b':[-.26,.4],'th':.22},{'k':'seg','a':[.26,.4],'b':[.5,.4],'th':.22}])
# góc tường ghép + tường thấp
g=cell(0,3);b=bbox(g);P.add('goc_tuong',g,'vat','ALL',ref=(128,bottom_at(g,127)),off=(0,0),group='goc_tuong',name='Cặp tường góc',solid=False)
for c,k in ((4,'a'),(5,'b')):
    t=cell(0,c);b=bbox(t);P.add('tuong_thap_'+k,t,'vat','ALL',ref=((b[0]+b[2])/2,b[3]-8),off=(0,0),group='tuong_thap_'+k,name='Tường thấp '+k.upper(),solid=False)
t=cell(0,6);b=bbox(t);P.add('cot',t,'cot','ALL',ref=((b[0]+b[2])/2,b[3]-8),off=(0,0),group='cot',name='Cột hầm ngục',footprint=[-.1,-.1,.1,.1])
for i,c in enumerate(range(2,5)):
    t=cell(1,c);b=bbox(t);P.add(f'ruong_dong_{i+1}',t,'ruong','ALL',ref=((b[0]+b[2])/2,b[3]-20),off=(0,0),group=f'ruong_dong_{i+1}',name=f'Rương đóng {i+1}',footprint=[-.2,-.2,.2,.2])
for i,c in enumerate(range(5,8)):
    t=cell(1,c);b=bbox(t);P.add(f'ruong_mo_{i+1}',t,'ruong','ALL',ref=((b[0]+b[2])/2,b[3]-20),off=(0,0),group=f'ruong_mo_{i+1}',name=f'Rương mở {i+1}',footprint=[-.2,-.2,.2,.2])
zp,n,sz,cv=P.finalize(OUT);print(zp,n,sz,cv)
ix=json.load(open(OUT+'/index.json')) if os.path.exists(OUT+'/index.json') else []
ix=[e for e in ix if e.get('id')!=P.id]+[dict(id=P.id,file=os.path.basename(zp),name=P.name,assets=n,bytes=sz,license=LIC,tile=T,canvas=list(cv),note=P.note,source=P.source)]
json.dump(ix,open(OUT+'/index.json','w'),ensure_ascii=False,indent=1)
