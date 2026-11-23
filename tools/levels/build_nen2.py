# Bộ nền theo khu dựng từ thư viện Vật liệu (ô 128 liền mạch) + vật liệu bổ sung (mây, ngọc, dung nham, nước ngầm, thảm đỏ, trận pháp)
# Mỗi bộ: nen, san, duong-01..15 (autotile cạnh), bo-00..15 (bờ nước autotile góc) -> nen/<id>.json cùng định dạng build_nen.py
import os,json,io,base64,cv2,numpy as np,sys
from PIL import Image
sys.path.insert(0,'/home/claude/town')
VL='/tmp/iso3/36b73578-Lang-Nui-Vo-Hiep-v2-Vat-Lieu/'
KT='/tmp/iso3/Tai-Nguyen-2D-Isometric-11-Khu/Kinh-Thanh-Hoang-Thanh/dia-hinh/tiles/bo-00.png'
R=256;CELL=192;CY=42;COLS=8
def mask_polys(blk,eps=.035):
    n=blk.shape[0];k=8
    big=np.pad(cv2.resize(blk,(n*k,n*k),interpolation=cv2.INTER_NEAREST),1)
    cs,_=cv2.findContours(big,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE);out=[]
    for c in cs:
        if cv2.contourArea(c)<(n*k)**2*.004:continue
        ap=cv2.approxPolyDP(c,eps*n*k,True)[:,0,:].astype(float)
        sn=lambda t:0.0 if t<.02 else (1.0 if t>.975 else round(t,3))
        P=[[sn((x-1)/(n*k)),sn((y-1)/(n*k))] for x,y in ap]
        if len(P)>=3:out.append(P)
    return out
def pn(seed,sig):
    a=np.random.RandomState(seed).standard_normal((R,R)).astype(np.float32)
    a=cv2.GaussianBlur(np.tile(a,(3,3)),(0,0),sig)[R:2*R,R:2*R];a=(a-a.mean())/(a.std()+1e-6)
    return np.clip(a*.22+.5,0,1)
def lerp(a,b,t):t=t[...,None];return np.array(a,np.float32)*(1-t)+np.array(b,np.float32)*t
def img_mat(n):
    for d in os.listdir(VL):
        p=f'{VL}{d}/tile_{n}.png'
        if os.path.exists(p):return cv2.resize(np.array(Image.open(p).convert('RGB')),(R,R),interpolation=cv2.INTER_CUBIC).astype(np.float32)
    raise Exception(n)
def sm(x,a,b):t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def water_src():
    im=np.array(Image.open(KT).convert('RGB')).astype(np.float32)
    jj,ii=np.mgrid[0:R,0:R];u=(ii+.5)/R*.96+.02;v=(jj+.5)/R*.96+.02
    x=(96+(u-v)*96).astype(np.float32);y=((u+v)*48).astype(np.float32)
    return cv2.remap(im,x,y,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
W0=water_src();WG=W0.mean(2)/255
def mat(spec):
    k=spec
    if k=='cloud':
        v=.55*pn(1,24)+.3*pn(2,10)+.15*pn(3,4);v=sm(v,.38,.62)
        c=lerp((150,176,226),(248,251,255),v);return c+lerp((0,0,0),(10,-8,0),sm(pn(8,5),.65,.9))*0
    if k=='jade':
        n=pn(4,18);vein=(1-np.abs(2*pn(5,12)-1))**7
        c=lerp((38,118,92),(112,202,162),n)+vein[...,None]*np.array((90,120,100),np.float32)
        return c+ (pn(9,1.5)[...,None]-.5)*18
    if k=='lava':
        r=1-np.abs(2*pn(6,9)-1);crack=np.clip((r-.8)/.2,0,1)**1.4
        crust=lerp((24,11,9),(66,30,20),pn(7,5));glow=sm(pn(10,14),.55,.8)*.35
        return crust+crack[...,None]*np.array((255,168,40),np.float32)+glow[...,None]*np.array((190,70,15),np.float32)
    if k=='water':return W0.copy()
    if k=='water_dark':return np.stack([10+WG*55,26+WG*75,52+WG*120],-1).astype(np.float32)
    if k=='water_murk':return np.stack([12+WG*50,38+WG*70,26+WG*45],-1).astype(np.float32)
    if k=='water_pale':return np.stack([150+WG*95,214+WG*38,232+WG*22],-1).astype(np.float32)
    if k=='carpet':
        f=pn(11,1.2);c=lerp((120,14,24),(168,30,38),f)
        jj,ii=np.mgrid[0:R,0:R];w=((ii//8+jj//8)%2)*10;return c+w[...,None]*np.array((1,.2,.2),np.float32)
    if k.startswith('dark:'):return img_mat(k[5:])*.62
    return img_mat(k)
def rune(base,col):
    c=base*.5;L=np.zeros((R,R),np.float32);h=R//2
    cv2.circle(L,(h,h),112,1,5,cv2.LINE_AA);cv2.circle(L,(h,h),94,1,2,cv2.LINE_AA)
    for k in range(2):
        pts=np.array([[h+int(88*np.cos(a+k*np.pi/3)),h+int(88*np.sin(a+k*np.pi/3))] for a in (-np.pi/2,np.pi/6,5*np.pi/6)],np.int32);cv2.polylines(L,[pts],True,1,3,cv2.LINE_AA)
    for k in range(16):
        a=k*np.pi/8;cv2.line(L,(h+int(98*np.cos(a)),h+int(98*np.sin(a))),(h+int(108*np.cos(a)),h+int(108*np.sin(a))),1,3,cv2.LINE_AA)
    cv2.circle(L,(h,h),16,1,-1,cv2.LINE_AA)
    G=cv2.GaussianBlur(L,(0,0),5)
    return c+(np.clip(L+G*.9,0,1))[...,None]*np.array(col,np.float32)
def uvgrid(n):
    jj,ii=np.mgrid[0:R,0:R];return (ii+.5)/R,(jj+.5)/R
U,V=uvgrid(R)
SH=pn(21,6)
def land_field(m):
    c=[(m>>i)&1 for i in range(4)];f=c[0]*(1-U)*(1-V)+c[1]*U*(1-V)+c[2]*U*V+c[3]*(1-U)*V
    return f-.5+(SH-.5)*.18*np.sin(np.pi*U)*np.sin(np.pi*V)
def road_mask(m):
    M=np.zeros((R,R),np.uint8);a,b=int(R*.25),int(R*.75)
    M[a:b,a:b]=1
    if m&1:M[0:b,a:b]=1
    if m&2:M[a:b,a:R]=1
    if m&4:M[a:R,a:b]=1
    if m&8:M[a:b,0:b]=1
    return M
def pad_er(M,k):
    p=cv2.copyMakeBorder(M,k+2,k+2,k+2,k+2,cv2.BORDER_REPLICATE);e=cv2.erode(p,np.ones((2*k+1,2*k+1),np.uint8));return e[k+2:-k-2,k+2:-k-2]
def warp(rgb):
    H2,W2=192,384;jj,ii=np.mgrid[0:H2,0:W2];x=(ii+.5)/2;y=(jj+.5)/2
    s=(x-96)/96;t=y/48;u=(s+t)/2;v=(t-s)/2
    mx=(u*R).astype(np.float32);my=(v*R).astype(np.float32)
    o=cv2.remap(rgb,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
    a=((u>=0)&(u<=1)&(v>=0)&(v<=1)).astype(np.float32)
    o=np.dstack([o,a*255]).astype(np.float32)
    o=cv2.resize(o,(192,96),interpolation=cv2.INTER_AREA)
    # alpha premult-correct: chuẩn hoá màu theo alpha
    al=o[...,3:4]/255;rgb2=np.where(al>0,o[...,:3]/np.maximum(al,1e-3),0)
    return Image.fromarray(np.dstack([np.clip(rgb2,0,255),o[...,3]]).astype(np.uint8),'RGBA')
def road_tile(m,base,road,style):
    M=road_mask(m);Mf=cv2.GaussianBlur(M.astype(np.float32),(0,0),1.1)[...,None]
    out=base*(1-Mf)+road*Mf
    inner=pad_er(M,3);edge=(M.astype(np.float32)-inner.astype(np.float32));edge=cv2.GaussianBlur(edge,(0,0),1)[...,None]
    out=out*(1-edge*.5)
    if style=='carpet':
        g=(pad_er(M,7).astype(np.float32)-pad_er(M,11).astype(np.float32));g=cv2.GaussianBlur(g,(0,0),.8)[...,None]
        out=out*(1-g)+np.array((226,184,70),np.float32)*g
    return out
def shore_tile(m,base,liq,rim):
    d=land_field(m);land=sm(d,-.012,.012)[...,None]
    band=(sm(d,0,.03)*(1-sm(d,.07,.11)))[...,None]
    wet=(sm(d,-.09,-.02)*(1-sm(d,-.02,0)))[...,None]
    w=liq*(1+wet*.22)
    r=rim*(.78+.0*band)
    ground=base*(1-band*.55)+r*band*.55
    out=w*(1-land)+ground*land
    out=out*(1-(sm(d,-.015,0)*(1-sm(d,0,.02)))[...,None]*.35)
    return out
def shore_poly(m):
    n=32;jj,ii=np.mgrid[0:n,0:n];u=(ii+.5)/n;v=(jj+.5)/n
    c=[(m>>i)&1 for i in range(4)];f=c[0]*(1-u)*(1-v)+c[1]*u*(1-v)+c[2]*u*v+c[3]*(1-u)*v
    SHn=cv2.resize(SH,(n,n),interpolation=cv2.INTER_AREA)
    d=f-.5+(SHn-.5)*.18*np.sin(np.pi*u)*np.sin(np.pi*v)
    return mask_polys((d<-.01).astype(np.uint8))
PACKS=[
 ('thanh-thi','Thành thị & quận thành','Gạch đỏ tím lát phố, sân đá lát, đường đá phiến; hào/kênh nước','Da_gach','Da_lat','Da_phien','water','Da_khoi','road',None),
 ('hoang-thanh','Hoàng thành & đại nội','Đá lát xám, sân vôi trắng, thảm đỏ viền vàng; hào nước','Da_lat','Voi_trang','carpet','water','Da_khoi','carpet',None),
 ('cung-dien','Cung điện & điện đài','Sàn vôi trắng, sảnh gỗ sơn đỏ, thảm đỏ; hồ nước ngự uyển','Voi_trang','Go_son','carpet','water','Voi_kem','carpet',None),
 ('tien-cung','Tiên cung & thiên giới','Nền mây trời, sân ngọc bích, đường vôi trắng; hồ tiên sáng','cloud','jade','Voi_trang','water_pale','jade','road',None),
 ('dia-dao','Địa đạo & hang ngầm','Đá sắt tối, sàn đá nham, lối đá đồng; sông ngầm','Da_sat','Da_nham','Da_dong','water_dark','dark:Da_phien','road',None),
 ('dia-cung','Địa cung & mật thất','Đá khối tối, ô trận pháp ánh xanh, lối đá phiến; hồ ngầm','dark:Da_khoi','RUNE:cyan','Da_phien','water_dark','dark:Da_phien','road',(110,230,255)),
 ('ham-mo','Hầm mộ & mộ cổ','Đá rêu phủ, ô trận pháp lục, lối gạch cổ; nước mộ đục','dark:Da_reu','RUNE:green','Da_gach','water_murk','dark:Da_reu','road',(140,255,160)),
 ('lang-tam','Lăng tẩm & thần đạo','Đá phiến xanh, sân đá lát, thần đạo vôi trắng; hào nước','Da_phien','Da_lat','Voi_trang','water','Da_khoi','road',None),
 ('dung-nham','Địa hỏa & dung nham','Đá sắt cháy, ô trận pháp lửa, lối đá đồng; sông dung nham','Da_sat','RUNE:fire','Da_dong','lava','Da_sat','road',(255,140,40))]
def run():
    idx_out=[];os.makedirs('/home/claude/ed/nen',exist_ok=True)
    for pid,name,desc,b,p,rd,lq,rm,rstyle,rc in PACKS:
        base=mat(b)
        plaza=rune(mat('dark:Da_khoi' if b.startswith('Da_s') else b),rc) if p.startswith('RUNE:') else mat(p)
        road=mat(rd);liq=mat(lq);rim=mat(rm)
        tiles={'nen':base,'san':plaza}
        for m in range(1,16):tiles[f'duong-{m:02d}']=road_tile(m,base,road,rstyle)
        bz={}
        for m in range(16):
            tiles[f'bo-{m:02d}']=base if m==15 else shore_tile(m,base,liq,rim)
            if m==0:bz['bo-00']=[[[0,0],[0,1],[1,1],[1,0]]]
            elif m<15:bz[f'bo-{m:02d}']=shore_poly(m)
        names=list(tiles);rows=(len(names)+COLS-1)//COLS;atl=Image.new('RGBA',(COLS*CELL,rows*CELL),(0,0,0,0));idx={}
        for i,n in enumerate(names):
            im=warp(tiles[n].astype(np.float32));atl.alpha_composite(im,((i%COLS)*CELL,(i//COLS)*CELL+CY));idx[n]=i
            if n=='nen':th=im.resize((96,48))
        buf=io.BytesIO();atl.save(buf,'PNG',optimize=True)
        pk={'id':pid,'name':name,'desc':desc,'tw':CELL,'cy':CY,'cols':COLS,'idx':idx,'bz':bz,'atlas':'data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()}
        json.dump(pk,open(f'/home/claude/ed/nen/{pid}.json','w'),ensure_ascii=False,separators=(',',':'))
        tb=io.BytesIO();th.save(tb,'PNG')
        idx_out.append({'id':pid,'name':name,'desc':desc,'n':len(names),'kb':len(buf.getvalue())//1024,'thumb':'data:image/png;base64,'+base64.b64encode(tb.getvalue()).decode()})
        print(pid,len(names),len(buf.getvalue())//1024,'KB')
    old=json.load(open('/home/claude/ed/nen/index.json'));keep=[o for o in old if o['id'] not in {x['id'] for x in idx_out}]
    json.dump(keep+idx_out,open('/home/claude/ed/nen/index.json','w'),ensure_ascii=False,separators=(',',':'))
    # tờ xem nhanh
    sh=Image.new('RGBA',(192*8,100*len(PACKS)),(20,24,34,255))
    for r_,(pid,*_) in enumerate(PACKS):
        pk=json.load(open(f'/home/claude/ed/nen/{pid}.json'));at=Image.open(io.BytesIO(base64.b64decode(pk['atlas'].split(',')[1])))
        for c_,n in enumerate(['nen','san','duong-05','duong-15','bo-01','bo-05','bo-10','bo-00']):
            i=pk['idx'][n];t=at.crop(((i%COLS)*CELL,(i//COLS)*CELL+CY,(i%COLS)*CELL+192,(i//COLS)*CELL+CY+96));sh.alpha_composite(t,(c_*192,r_*100))
    sh.save('/tmp/nen2_sheet.png')
if __name__=="__main__": run()
