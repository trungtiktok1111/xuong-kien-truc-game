# Đóng gói bộ ô nền isometric 192x96 theo từng khu thành atlas + dữ liệu ghép tự động (nen/<id>.json, nen/index.json)
import os,re,json,base64,io,cv2,numpy as np
from PIL import Image
R='/tmp/iso3/';M=R+'Tai-Nguyen-2D-Isometric-11-Khu/'
PACKS=[
 ('lang-nui-pho-kenh','Làng núi & phố kênh (dùng chung)',M+'Dia-Hinh-Dung-Chung','Cỏ, đất, cát, đá, tuyết, nước; đường mòn, kênh đá, chuyển tiếp vật liệu'),
 ('ben-song','Bến sông & thủy trấn',M+'Ben-Song-Thuy-Tran/dia-hinh','Cỏ + sàn gỗ bến; bờ nước'),
 ('dam-sen','Đầm sen & trang lên',M+'Dam-Sen-Trang-Len/dia-hinh','Cỏ + sàn gỗ; bờ đầm'),
 ('duyen-hai','Duyên hải & cảng biển',M+'Duyen-Hai-Cang-Bien/dia-hinh','Cát + sàn gỗ; bờ biển'),
 ('kinh-thanh','Kinh thành & hoàng thành',M+'Kinh-Thanh-Hoang-Thanh/dia-hinh','Đá xám + sàn gỗ; hào nước'),
 ('rung-truc','Rừng trúc & cổ thụ',M+'Rung-Truc-Co-Thu/dia-hinh','Cỏ rêu tối; đầm suối'),
 ('son-mon','Sơn môn tuyết lĩnh',M+'Son-Mon-Tuyet-Linh/dia-hinh','Tuyết + băng; hồ băng'),
 ('thao-nguyen','Thảo nguyên biên ải',M+'Thao-Nguyen-Bien-Ai/dia-hinh','Cỏ vàng khô; ao hồ'),
 ('tram-dich','Trạm dịch Xích Sa',M+'Tram-Dich-Xich-Sa/dia-hinh','Cát gợn + đá; ốc đảo'),
 ('dong-que','Đồng quê ruộng bậc thang',R+'Dong-Que-Ruong-Bac-Thang-2D-Isometric','Ruộng lúa non/chín, sau gặt, mương, lối đất, kè đất, cửa nước'),
 ('van-son','Khu 12 Vân Sơn cổ tự',R+'Khu-12-13-Van-Son-Khe-Ngoc-2D-Isometric/12-Van-Son-Co-Tu','Cỏ + đá cổ tự; vực nước xanh'),
 ('lang-nui','Làng núi võ hiệp',M+'Lang-Nui-Vo-Hiep/dia-hinh','Bộ nền riêng khu Làng núi võ hiệp'),
 ('pho-cho','Phố chợ bến kênh',M+'Pho-Cho-Ben-Kenh/dia-hinh','Bộ nền riêng khu Phố chợ bến kênh'),
 ('khe-ngoc','Khu 13 Khe Ngọc phế tích',R+'Khu-12-13-Van-Son-Khe-Ngoc-2D-Isometric/13-Khe-Ngoc-Phe-Tich','Cỏ + đá phế tích; vực khe ngọc')]
CELL=192;CY=42;COLS=8
def meta_of(d):
    for f in ('tileset.json','Danh-muc.json'):
        p=d+'/'+f
        if os.path.exists(p):
            j=json.load(open(p))
            if isinstance(j,dict) and 'tiles' in j and isinstance(j['tiles'],dict): return j['tiles']
    return {}
def grid_polys(g,thr=0):
    """g: 16x16 (hàng=v,cột=u) 1=đi được. Trả về các đa giác vùng KHÔNG đi được trong toạ độ ô [0,1]."""
    a=np.array(g,dtype=np.uint8);blk=(a==0).astype(np.uint8)
    return mask_polys(blk)
def mask_polys(blk,eps=.035):
    n=blk.shape[0];k=8
    big=cv2.resize(blk,(n*k,n*k),interpolation=cv2.INTER_NEAREST)
    big=np.pad(big,1)
    cs,_=cv2.findContours(big,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    out=[]
    for c in cs:
        if cv2.contourArea(c)<(n*k)**2*.004:continue
        ap=cv2.approxPolyDP(c,eps*n*k,True)[:,0,:].astype(float)
        sn=lambda t:0.0 if t<.02 else (1.0 if t>.975 else round(t,3))
        P=[[sn((x-1)/(n*k)),sn((y-1)/(n*k))] for x,y in ap]
        if len(P)>=3:out.append(P)
    return out
def water_mask(img,n=24):
    a=np.array(img.convert('RGBA')).astype(float);m=np.zeros((n,n),np.uint8)
    for j in range(n):
        for i in range(n):
            u=(i+.5)/n;v=(j+.5)/n;x=int(96+(u-v)*96);y=int((u+v)*48)
            c=a[max(y-2,0):y+3,max(x-2,0):x+3,:3].reshape(-1,3).mean(0)
            if c[2]>c[0]+22 and c[1]>c[0]+10:m[j,i]=1
    return m
idx_out=[]
for pid,name,d,desc in PACKS:
    td=d+'/tiles';fs=sorted(f for f in os.listdir(td) if f.endswith('.png'))
    meta=meta_of(d);names=[f[:-4] for f in fs]
    rows=(len(fs)+COLS-1)//COLS;atl=Image.new('RGBA',(COLS*CELL,rows*CELL),(0,0,0,0))
    idx={};bz={};wz={};walk={}
    for i,(f,n) in enumerate(zip(fs,names)):
        im=Image.open(td+'/'+f).convert('RGBA');m=meta.get(n,{})
        ox,oy=m.get('origin_px',[96,24 if im.height==120 else 0])
        atl.alpha_composite(im,((i%COLS)*CELL+96-ox,(i//COLS)*CELL+CY-oy))
        idx[n]=i
        if 'walk_grid_16' in m: 
            walk[n]=1;g=m['walk_grid_16']
            if sum(map(sum,g))<256: bz[n]=grid_polys(g)
        elif re.match(r'^(kenh|muong)-\d\d$',n):
            bz[n]=mask_polys(water_mask(im))
        elif n in('nuoc','vuc'):
            pass
    buf=io.BytesIO();atl.save(buf,'PNG',optimize=True)
    pk={'id':pid,'name':name,'desc':desc,'tw':CELL,'cy':CY,'cols':COLS,'idx':idx,'bz':bz,'atlas':'data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()}
    json.dump(pk,open(f'/home/claude/ed/nen/{pid}.json','w'),ensure_ascii=False,separators=(',',':'))
    base='nen' if 'nen' in idx else 'co'
    th=Image.open(f'{td}/{base}.png').convert('RGBA').resize((96,48));tb=io.BytesIO();th.save(tb,'PNG')
    idx_out.append({'id':pid,'name':name,'desc':desc,'n':len(fs),'kb':len(buf.getvalue())//1024,'thumb':'data:image/png;base64,'+base64.b64encode(tb.getvalue()).decode()})
    print(pid,len(fs),'tiles',len(buf.getvalue())//1024,'KB atlas',len(bz),'polys')
json.dump(idx_out,open('/home/claude/ed/nen/index.json','w'),ensure_ascii=False,separators=(',',':'))
