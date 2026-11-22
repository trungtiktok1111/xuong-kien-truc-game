import json,base64,io,math,random
import numpy as np
from PIL import Image
T='/tmp/tdx/';R=random.Random(7)
def rs(im,size):
    a=np.asarray(im.convert('RGBA')).astype(np.float32);al=a[...,3:4]/255.0;pm=np.concatenate([a[...,:3]*al,a[...,3:4]],axis=2)
    ch=[Image.fromarray(pm[...,i]).resize(size,Image.BOX if size[0]<=im.width else Image.BICUBIC) for i in range(4)];o=np.stack([np.asarray(c) for c in ch],axis=2).astype(np.float32)
    al2=np.clip(o[...,3:4],1,255)/255.0;rgb=np.clip(o[...,:3]/al2,0,255);m=o[...,3]<20;rgb[m]=0;o[...,3][m]=0
    return Image.fromarray(np.concatenate([rgb,o[...,3:4]],axis=2).astype(np.uint8),'RGBA')
def b64(im):
    b=io.BytesIO();im.save(b,'PNG',optimize=True);return 'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
j=json.load(open('/tmp/base_anim.json'))
def dl(u):return Image.open(io.BytesIO(base64.b64decode(u.split(',',1)[1]))).convert('RGBA')
for sh in j['sheets'][4:]:
    if not sh.get('url'):continue
    im=dl(sh['url']);im=rs(im,(im.width//2,im.height//2));sh['url']=b64(im);sh['tw']=sh['tw']//2
nsh=len(j['sheets'])
SID_NEN=nsh;SID_VAT=nsh+1
def b64(im):
    b=io.BytesIO();im.save(b,'PNG',optimize=True);return 'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
# ---- sheet nền
fam={'Mep-quang-truong':4,'Bo-ho':20,'Nen-da-do':36}
bases=['San-da','Cat-vang','Nuoc-oc-dao','Da-do']
tiles=[Image.open(T+'Tiles/%s.png'%b).convert('RGBA').resize((64,64),Image.LANCZOS) for b in bases]
for f in fam:
    for m in range(16):tiles.append(Image.open(T+'Tiles/%s-%02d.png'%(f,m)).convert('RGBA').resize((64,64),Image.LANCZOS))
NC=13;NR=math.ceil(len(tiles)/NC);nen=Image.new('RGBA',(NC*64,NR*64))
for i,t in enumerate(tiles):nen.paste(t,((i%NC)*64,(i//NC)*64))
# ---- sheet vật: mỗi vật cắt thành khối ô 64px
VC=16;vat_rows=[];blocks={}
def add_obj(key,path,wc):
    im=Image.open(T+path).convert('RGBA');s=wc*64/im.width;im=rs(im,(wc*64,max(1,round(im.height*s))))
    hc=math.ceil(im.height/64);canvas=Image.new('RGBA',(wc*64,hc*64));canvas.paste(im,(0,hc*64-im.height))
    blocks[key]=(wc,hc,canvas)
objs={'tram':('Sprites/Kien-truc/Tram-dich.png',8),'ren':('Sprites/Kien-truc/Lo-ren.png',7),'leu':('Sprites/Kien-truc/Leu-thuong-nhan.png',6),
 'gieng':('Sprites/Kien-truc/Gieng-oc-dao.png',4),'cha':('Sprites/Canh-quan/Cha-la.png',4),'bui':('Sprites/Canh-quan/Co-bui-sa-mac.png',3),
 'linh':('Sprites/Canh-quan/Cum-linh-thach.png',4),'vom':('Sprites/Canh-quan/Vom-da-tu-nhien.png',6),'sot':('Sprites/Cho-sa-mac/Sot-hang.png',2),
 'vai':('Sprites/Cho-sa-mac/Cuon-vai.png',3),'gom':('Sprites/Cho-sa-mac/Bo-do-gom.png',2),'hieu':('Sprites/Cho-sa-mac/Co-hieu.png',2),'ruong':('Sprites/Phan-thuong/Ruong-dong.png',1),'cong':('Sprites/Kien-truc/Cong-da-do.png',8),'den':('Sprites/Cho-sa-mac/Den-tru.png',1)}
for k,(p,w) in objs.items():add_obj(k,p,w)
row=0;pos={}
for k,(wc,hc,cv) in blocks.items():pos[k]=row;row+=hc
vat=Image.new('RGBA',(VC*64,row*64))
for k,(wc,hc,cv) in blocks.items():vat.paste(cv,(0,pos[k]*64))
def objtile(k,i,jj):return (pos[k]+jj)*VC+i  # i col, jj row
# ---- bản đồ
W,H=48,36
enc=lambda sid,idx,f=0:((sid*4096+idx)*8+f)+1
P_,C_,W_,R_=0,1,2,3
V=[[C_]*(W+1) for _ in range(H+1)]
def fillv(x0,y0,x1,y1,m):
    for y in range(y0,y1+1):
        for x in range(x0,x1+1):V[y][x]=m
fillv(13,13,35,25,P_)            # quảng trường đá lát
fillv(36,3,46,12,W_)             # ao ốc đảo
for y in range(3,13):
    for x in range(36,47):
        if (x-41)**2/30+(y-7.5)**2/18>1:V[y][x]=C_
fillv(1,26,11,35,R_)             # bãi đá đỏ (nơi có quái)
L=[[0]*(W*H) for _ in range(4)];BLK=[0]*(W*H)
def famtile(cs):
    s=set(cs)
    if len(s)==1:return bases.index(bases[0]) if False else list(s)[0]
    for name,(m0,m1) in {'Mep-quang-truong':(P_,C_),'Bo-ho':(C_,W_),'Nen-da-do':(C_,R_)}.items():
        if s=={m0,m1}:
            mask=sum((1<<q) for q,c in enumerate(cs) if c==m1);return fam[name]+mask
    return max(s,key=cs.count)
for y in range(H):
    for x in range(W):
        cs=[V[y][x],V[y][x+1],V[y+1][x+1],V[y+1][x]]
        L[0][y*W+x]=enc(SID_NEN,famtile(cs))
        if all(c==W_ for c in cs):BLK[y*W+x]=1
def place(k,cx,by,fp=2,inset=0,layer_split=True,block=True):
    wc,hc,_=blocks[k];x0=cx-wc//2;y0=by-hc+1
    for jj in range(hc):
        for i in range(wc):
            x,y=x0+i,y0+jj
            if not(0<=x<W and 0<=y<H):continue
            im=blocks[k][2].crop((i*64,jj*64,i*64+64,jj*64+64))
            if im.getbbox() is None:continue
            lyr=2 if jj>=hc-fp else 3
            L[lyr][y*W+x]=enc(SID_VAT,objtile(k,i,jj))
            if block and jj>=hc-fp and inset<=i<wc-inset:BLK[y*W+x]=1
place('tram',24,12,fp=3,inset=1)          # trạm dịch phía trên quảng trường
place('ren',9,12,fp=3,inset=1)            # lò rèn bên trái
place('leu',39,25,fp=2,inset=1)           # lều thương nhân bên phải
place('gieng',24,21,fp=2,inset=0)
place('vai',17,24,fp=1,inset=0);place('gom',20,24,fp=1,inset=0);place('sot',29,24,fp=1,inset=0);place('hieu',32,23,fp=1,inset=0,block=False)
for (x,y) in [(3,6),(6,3),(15,4),(33,5),(2,16),(45,18),(4,22),(44,30),(30,33),(16,33),(20,34),(1,31)]:
    place('cha',x,y,fp=1,inset=1)
for (x,y) in [(12,17),(36,18),(14,29),(42,22),(28,8)]:place('bui',x,y,fp=1,inset=0)
place('linh',44,34,fp=1,inset=1);place('linh',2,35,fp=1,inset=1)
# viền map bằng lối đi: chặn mép
for x in range(W):BLK[x]=1;BLK[(H-1)*W+x]=1
for y in range(H):BLK[y*W]=1;BLK[y*W+W-1]=1
ents=[]
def ent(t,x,y,**k):
    e={'id':'e%d'%len(ents),'t':t,'x':x,'y':y,'name':k.pop('name',{'start':'Xuất phát','enemy':'Quái','npc':'NPC','chest':'Rương','goal':'Đích'}[t])};e['tile']=k.pop('tile',None);e.update(k);ents.append(e)
an={a['name']:a['id'] for a in j['cfg']['anims']}
ent('start',24,30)
ent('npc',22,15,name='Chưởng quầy Cái Bang',anim=an['Cai-Bang-Nam'],text='Khách quan! Vùng đá đỏ phía tây nam có bọn Ngũ Độc quấy phá. Diệt hết chúng rồi ra lá cờ tím ở góc đông nam.')
ent('npc',30,22,name='Tiểu hòa thượng',anim=an['Thieu-Lam-Nam'],text='A di đà Phật. Nhấn phím đánh để dùng combo ba đòn của Võ Đang. Rương ở bên giếng chứa thuốc hồi sức.')
for (x,y) in [(4,29),(8,31),(6,33),(9,28)]:ent('enemy',x,y,name='Ngũ Độc',anim=an['Ngu-Doc-Nam'],hp=3,dmg=1,spd=1.6,chase=6,ai='wander')
ent('chest',26,22,tile={'sid':SID_VAT,'idx':objtile('ruong',0,0)},gives='hp',amt=2)
ent('goal',44,32)
cfg=j['cfg']
for a in cfg['anims']:
    a['sc']=round(a['sc']*2,4)
    for st in a['st'].values():
        for k in ('fw','fh','ax','ay'):
            if st.get(k):st[k]=st[k]//2
cfg.update({'hp':6,'spd':4.2,'dmg':1,'rng':1.5,'win':'auto','heroAnim':an['Vo-Dang-Nu']})
j['sheets'].append({'name':'TD-nen','tw':64,'margin':0,'cols':NC,'rows':NR,'url':b64(nen)})
j['sheets'].append({'name':'TD-vat','tw':64,'margin':0,'cols':VC,'rows':row,'url':b64(vat)})
j.update({'w':W,'h':H,'layers':L,'collision':BLK,'ents':ents,'cfg':cfg})
json.dump(j,open('/tmp/man1.json','w'));print('ok',W,H,len(ents),SID_NEN)
