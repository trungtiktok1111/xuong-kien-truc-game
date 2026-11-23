# Màn 1 isometric: "Thôn Thanh Vân" — dựng từ tài nguyên isometric của người dùng
import json,base64,io,math,random,glob,os
from PIL import Image
random.seed(7)
UP='/tmp/iso2/735a43c7-Pho-Cho-Ben-Kenh-2D-Hoan-Thien/assets'
CT='/tmp/iso3/Lang-Nui-Vo-Hiep-v2-Cong-Trinh-Lap-San_1'
OLD='/home/claude/ed/man1_old.json'
if not os.path.exists(OLD): os.system('cp /home/claude/ed/man1.json '+OLD)
old=json.load(open(OLD))
def durl(im):
    b=io.BytesIO();im.save(b,'PNG',optimize=True);return 'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
def bbox(im): return im.getchannel('A').point(lambda a:255 if a>20 else 0).getbbox()
# ---- phiến nền iso (128x128/ô, mặt trên hình thoi 128x64) ----
def slab(path):
    im=Image.open(path).convert('RGBA');bb=bbox(im);im=im.crop(bb);w,h=im.size;a=im.getchannel('A')
    wd=[(max([x for x in range(w) if a.getpixel((x,y))>40],default=-1)-min([x for x in range(w) if a.getpixel((x,y))>40],default=0)+1) if any(a.getpixel((x,y))>40 for x in range(w)) else 0 for y in range(h)]
    mx=max(wd);rows=[y for y,v in enumerate(wd) if v>=mx*.97];Ht=2*sum(rows)/len(rows)
    kx=128/w;ky=64/Ht
    if h*ky>128:ky=128/h
    c=Image.new('RGBA',(128,128),(0,0,0,0));c.alpha_composite(im.resize((128,max(1,round(h*ky))),Image.LANCZOS));return c
SL=['Dat-co','Dat-nen','Mat-nuoc-kenh','Nen-lat-da']
sl=Image.new('RGBA',(128*4,128),(0,0,0,0))
for i,n in enumerate(SL):sl.alpha_composite(slab(f'{UP}/Dia-hinh/{n}.png'),(i*128,0))
# ---- vật cảnh (ô 384, căn đáy giữa) ----
TW=384
OBJ={ # tên: (đường dẫn, lớp k (đơn vị s/px), )
 'Gieng':f'{CT}/CT-01/Goc-cheo/Gieng.png','Kho':f'{CT}/CT-01/Goc-cheo/Kho.png','Nha_ba_gian':f'{CT}/CT-01/Goc-cheo/Nha_ba_gian.png','Nha_co_hien':f'{CT}/CT-01/Goc-cheo/Nha_co_hien.png','Nha_mot_gian':f'{CT}/CT-01/Goc-cheo/Nha_mot_gian.png',
 'Nha_mat_pho':f'{CT}/CT-02/Goc-cheo/Nha_mat_pho.png','Quan_tra':f'{CT}/CT-02/Goc-cheo/Quan_tra.png','Sap_hang':f'{CT}/CT-02/Goc-cheo/Sap_hang.png','Tiem_thuoc':f'{CT}/CT-02/Goc-cheo/Tiem_thuoc.png','Tuu_quan':f'{CT}/CT-02/Goc-cheo/Tuu_quan.png',
 'Hanh_lang':f'{CT}/CT-03/Goc-cheo/Hanh_lang.png','San_luyen':f'{CT}/CT-03/Goc-cheo/San_luyen.png','Vo_duong':f'{CT}/CT-03/Goc-cheo/Vo_duong.png','Chinh_dien':f'{CT}/CT-03/Goc-cheo/Chinh_dien.png',
 'Ben_go':f'{CT}/CT-04/Goc-cheo/Ben_go.png','Cau_nho':f'{CT}/CT-04/Goc-cheo/Cau_nho.png','Choi_ven_nuoc':f'{CT}/CT-04/Goc-cheo/Choi_ven_nuoc.png','Nha_san':f'{CT}/CT-04/Goc-cheo/Nha_san.png',
 'Choi_gac':f'{CT}/CT-05/Goc-cheo/Choi_gac.png','Cong_tran':f'{CT}/CT-05/Goc-cheo/Cong_tran.png','Tram_nghi':f'{CT}/CT-05/Goc-cheo/Tram_nghi.png','Tuong_bao':f'{CT}/CT-05/Goc-cheo/Tuong_bao.png','Vong_lau':f'{CT}/CT-05/Goc-cheo/Vong_lau.png',
 'Cay_dao':f'{UP}/Cay-hoa/Cay-dao.png','Cay_lieu':f'{UP}/Cay-hoa/Cay-lieu.png','Bui_hoa':f'{UP}/Cay-hoa/Cum-bui-hoa-co.png','Sen':f'{UP}/Cay-hoa/Cum-sen.png'}
KOBJ={'Cay_dao':.0042,'Cay_lieu':.0042,'Bui_hoa':.0034,'Sen':.0030}
def foot(path,k):
    """đo đáy bền với cầu thang: góc phải theo đường viền thẳng bên phải, góc trái theo bước nhảy"""
    im=Image.open(path).convert('RGBA');im=im.crop(bbox(im));a=im.getchannel('A');w,h=im.size
    yc=[]
    for x in range(w):
        ys=[y for y in range(h) if a.getpixel((x,y))>40]
        yc.append(ys[-1] if ys else None)
    cols=[x for x in range(w) if yc[x] is not None];my=max(yc[x] for x in cols)
    st=[x for x in cols if yc[x]>=my-2];sx=st[len(st)//2]
    rx=sx
    while rx+1<w and yc[rx+1] is not None and abs(yc[rx+1]-yc[rx])<=12 and yc[rx+1]<=yc[rx]+2:rx+=1
    if rx-sx<45:  # tip nằm ở đầu phải
        pass
    xa,xb=max(sx,rx-42),max(sx,rx-6)
    sr=(yc[xa]-yc[xb])/max(1,(xb-xa)) if xb>xa else .5
    sr=min(1.0,max(.3,sr))
    tipx=xb
    for x in range(xb,0,-1):
        if yc[x] is None:break
        if abs(yc[x]-(yc[xb]+sr*(xb-x)))<=3:tipx=x
        else:break
    tipy=yc[tipx]
    lx=tipx
    while lx-1>=0 and yc[lx-1] is not None and abs(yc[lx-1]-yc[lx])<=14 and yc[lx-1]<=tipy+14:lx-=1
    return (tipx-lx)*k/.75,(rx-tipx)*k/.75,tipx,tipy,w,h
FPO={'Nha_san':(2,2),'Choi_ven_nuoc':(2,2)}
names=list(OBJ);FP={};FPR={};OXY={}
COLS=6;ROWS=(len(names)+COLS-1)//COLS
ob=Image.new('RGBA',(COLS*TW,ROWS*TW),(0,0,0,0));IDX={};SC={}
for i,n in enumerate(names):
    im=Image.open(OBJ[n]).convert('RGBA');im=im.crop(bbox(im));w,h=im.size
    kf=min(1,(TW-4)/w,(TW-4)/h);r=im.resize((max(1,round(w*kf)),max(1,round(h*kf))),Image.LANCZOS)
    cx,cy=(i%COLS)*TW,(i//COLS)*TW;ob.alpha_composite(r,(cx+(TW-r.width)//2,cy+TW-2-r.height));IDX[n]=i
    k=KOBJ.get(n,.0093);SC[n]=round(TW*k/kf,3);fx_,fy_,tx_,ty_,w_,h_=foot(OBJ[n],k)
    FP[n]=(1,1) if n in KOBJ or n in ('Gieng','Sen') else (max(1,__import__('math').ceil(fx_-.2)),max(1,__import__('math').ceil(fy_-.2)))
    if n in FPO:FP[n]=FPO[n]
    FPR[n]=(round(fx_,2),round(fy_,2))
    ix=(TW-r.width)//2;iy=TW-2-r.height
    OXY[n]=(round(.5-(ix+tx_*kf)/TW,4),round(1-(iy+ty_*kf)/TW,4)) if n not in KOBJ and n not in ('Gieng','Sen') and n not in FPO else (0,0)
# ---- bản đồ ----
W=H=44
enc=lambda sid,idx:((sid*4096+idx)*8)+1
SID_SL,SID_OB=39,40
L=[[0]*(W*H) for _ in range(4)];blk=[0]*(W*H)
off=lambda y:round(1.5*math.sin(y/5))
road=set();plaza=set();water=set()
for y in range(3,44):
    for x in (21,22):road.add((x,y))
for x in range(3,41):
    for y in (24,25):road.add((x,y))
for x in range(17,27):
    for y in range(20,30):plaza.add((x,y))
for y in range(1,43):
    for dx in (0,1):water.add((34+off(y)+dx,y))
for y in range(H):
    for x in range(W):
        i=y*W+x
        if (x,y) in water:L[0][i]=enc(SID_SL,2);blk[i]=1
        elif (x,y) in road or (x,y) in plaza:L[0][i]=enc(SID_SL,3)
        else:L[0][i]=enc(SID_SL,1 if random.random()<.13 else 0)
for x in range(W):blk[x]=blk[(H-1)*W+x]=1
for y in range(H):blk[y*W]=blk[y*W+W-1]=1
# cầu: ô nước ở y=24,25 đi được
for (x,y) in water:
    if y in (24,25):blk[y*W+x]=0
ents=[];occ=set()
def deco(n,x,y,f,walk=False,flat=False,name=None):
    fx,fy=FP[n]
    cells=[(x-a,y-b) for a in range(fx) for b in range(fy)]
    if n in KOBJ or n in ('Gieng','Sen'):zb=[-.3,-.3,.6,.6]
    elif n in FPO:zb=[-fx,-fy,fx,fy]
    else:
        rx,ry=FPR[n];rx=max(.4,rx-.06);ry=max(.4,ry-.06);zb=[-round(rx,2),-round(ry,2),round(rx,2),round(ry,2)]
    e={'id':'d%d'%len(ents),'t':'deco','x':x,'y':y,'f':max(fx,fy),'fx':fx,'fy':fy,'sc':SC[n],'ox':OXY[n][0],'oy':OXY[n][1],'flat':flat,'name':name or n,'tile':{'sid':SID_OB,'idx':IDX[n]},'zb':zb}
    if walk:e['walk']=True
    ents.append(e)
    for c in cells:occ.add(c)
wx=34+off(25)
P=[ # (tên, x, y, f, walk, flat)
 ('Vo_duong',22,11,2),('Hanh_lang',18,12,3),('San_luyen',28,15,3,True,True),
 ('Tuu_quan',16,23,3),('Tiem_thuoc',13,23,2),('Quan_tra',11,23,2),('Nha_ba_gian',8,23,3),('Nha_co_hien',5,23,2),
 ('Nha_mat_pho',30,23,2),('Sap_hang',27,23,1),('Sap_hang',26,31,1),
 ('Gieng',22,25,1),
 ('Kho',14,31,2),('Nha_mot_gian',10,32,2),('Nha_co_hien',29,31,2),('Nha_san',31,37,2),('Choi_ven_nuoc',31,29,2),('Tram_nghi',25,36,2),
 ('Nha_ba_gian',7,38,3),('Nha_mot_gian',13,38,2),
 ('Cau_nho',wx+1,25,2,True),('Ben_go',wx+1,36,2,True),
 ('Choi_gac',18,41,2),('Vong_lau',26,41,2),
 ('Cong_tran',22,42,2,True),
 ('Chinh_dien',9,15,3),('Nha_mot_gian',33,12,2)]
for p in P:
    n,x,y,f=p[:4];deco(n,x,y,f,p[4] if len(p)>4 else False,p[5] if len(p)>5 else False)
for x in list(range(13,21))+list(range(24,30)):deco('Tuong_bao',x,42,1)
# cây & bụi
def free(x,y):
    return 2<=x<W-2 and 2<=y<H-2 and (x,y) not in road and (x,y) not in plaza and (x,y) not in water and (x,y) not in occ and not any(abs(x-a)<=1 and abs(y-b)<=1 for (a,b) in occ)
tries=0;nt=0
while nt<46 and tries<4000:
    tries+=1;x,y=random.randint(2,W-3),random.randint(2,H-3)
    edge=min(x,y,W-1-x,H-1-y)<=4
    if not edge and random.random()<.55:continue
    if free(x,y):deco(random.choice(['Cay_dao','Cay_lieu']),x,y,1,name='Cây');nt+=1
for _ in range(60):
    x,y=random.randint(2,W-3),random.randint(2,H-3)
    if free(x,y) and random.random()<.5:deco('Bui_hoa',x,y,1,walk=True,name='Bụi hoa')
for _ in range(40):
    x,y=random.randint(2,W-3),random.randint(2,H-3)
    if (x,y) in water and (x,y) not in occ and y not in (23,24,25,26) and random.random()<.15:deco('Sen',x,y,1,walk=True,name='Sen')
# nhân vật
anims={a['name']:a['id'] for a in old['cfg']['anims']}
def npc(i,n,x,y,anim,text):ents.append({'id':'n%d'%i,'t':'npc','x':x,'y':y,'name':n,'tile':None,'anim':anims[anim],'text':text})
npc(1,'Trưởng thôn',21,27,'Thieu-Lam-Nam','Thiếu hiệp tỉnh rồi! Đây là Thôn Thanh Vân dưới chân núi. Hãy lên Võ đường ở phía bắc gặp Sư phụ để học võ, rồi ghé Lão y phía tây lấy thuốc dự phòng trước khi ra trấn.')
npc(2,'Sư phụ Võ đường',21,13,'Thieu-Lam-Nam','Nhấn phím đánh để luyện combo ba đòn trên sân tập. Luyện xong thì ra cổng thôn ở phía nam, đường dẫn tới trấn.')
npc(3,'Lão y',12,26,'Vo-Dang-Nu','Thân thể khỏe mạnh đấy. Rương bên giếng có thuốc hồi sức, cứ lấy mà dùng.')
npc(4,'Chưởng quầy',16,26,'Cai-Bang-Nam','Khách quan ghé quán uống chén trà! Phố phường ngoài trấn nhiều kẻ xấu, nhớ giữ cẩn thận.')
npc(5,'Lính gác cổng',21,39,'Cai-Bang-Nam','Ngoài cổng là đường ra trấn. Thiếu hiệp hãy luyện võ cho vững rồi hẵng đi.')
ents.append({'id':'c1','t':'chest','x':24,'y':27,'name':'Rương','tile':None,'gives':'hp','amt':2})
ents.insert(0,{'id':'s0','t':'start','x':int(__import__('os').environ.get('SX',22)),'y':int(__import__('os').environ.get('SY',31)),'name':'Xuất phát','tile':None})
stub=durl(Image.new('RGBA',(16,16),(0,0,0,0)))
sheets=[{'name':'(đã gỡ %d)'%(i+1),'tw':16,'margin':0,'cols':1,'rows':1,'url':stub} for i in range(4)]
sheets+=old['sheets'][4:39]
sheets.append({'name':'Iso-nen-thon','tw':128,'margin':0,'cols':4,'rows':1,'iso':1,'url':durl(sl)})
sheets.append({'name':'Vat-canh-thon','tw':TW,'margin':0,'cols':COLS,'rows':ROWS,'url':durl(ob)})
cfg=json.loads(json.dumps(old['cfg']));cfg['view']='iso'
for a in cfg['anims']:a['sc']=round(a['sc']*1.3,3)
cfg['hero']={'sid':2,'idx':0}
out={'tags':{'sheets':{},'tiles':{},'fav':[],'recent':[]},'format':'thk-map-1','cell':16,'w':W,'h':H,'layerNames':old['layerNames'],'layers':L,'collision':blk,'ents':ents,'cfg':cfg,'sheets':sheets,
 'note':'Màn 1 — Thôn Thanh Vân (isometric). Vật cảnh là thực thể "deco".'}
print({n:FP[n] for n in FP})
json.dump(out,open('/home/claude/ed/man1.json','w'),ensure_ascii=False)
print('ok',os.path.getsize('/home/claude/ed/man1.json')//1024,'KB',len(ents),'ents',len(names),'objs')
