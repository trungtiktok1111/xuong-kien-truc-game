import sys,os,re,json,glob
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from lib import *
SRC='/home/claude/newpk/';OUT='/home/claude/ed/packs'
CC0='CC0 1.0 (Screaming Brain Studios, phạm vi công cộng)'
MATVI={'brick':'gạch','stone':'đá','wood':'gỗ'}
def keyed(path,rgb=(255,0,255)):
    im=Image.open(path).convert('RGBA');a=np.array(im);m=(abs(a[...,0].astype(int)-rgb[0])<=5)&(abs(a[...,1].astype(int)-rgb[1])<=5)&(abs(a[...,2].astype(int)-rgb[2])<=5)
    a[m]=(0,0,0,0);return Image.fromarray(a)
def cells(im,cw,ch):
    for r in range(im.height//ch):
        for c in range(im.width//cw):
            t=im.crop((c*cw,r*ch,(c+1)*cw,(r+1)*ch))
            if bbox(t):yield r,c,t
def wall_cells(P,im,cw,ch,kind,label,role,fp,ncells=None,state=None,col=None,solid=None,extra=None):
    """mỗi ô ảnh = một cạnh tường; '\\' đặt lên cạnh Đông/Tây, '/' lên cạnh Nam/Bắc"""
    n=0
    for r,c,t in cells(im,cw,ch):
        idx=r*(im.width//cw)+c
        if ncells is not None and idx>=ncells:continue
        s=slope(t)
        if s=='?':continue
        b=bbox(t);rx=(b[0]+b[2])/2;ry=base_mid(t,b)
        for d in (['E','W'] if s=='\\' else ['S','N']):
            m=dict(group=f'{kind}_{idx//2:02d}',name=f'{label} {idx//2:02d}')
            if fp:m['footprint']=fp
            if state:m['state']=state
            if col:m['col']=col
            if solid is not None:m['solid']=solid
            if extra:m.update(extra)
            if P.add(f'{kind}_{idx:03d}_{d}',t,role,d,ref=(rx,ry),off=edge_off(d,P.tile),**m):n+=1
    return n
def parse(fn):
    m=re.match(r'(Flat|Thick)_(Brick|Stone|Wood)_(\d+)(_Window[AB])?-S[EW]-(\d+)x(\d+)',fn);return m
report=[]
def done(P,tool=None):
    import copy
    MAXN=110 if P.tile[0]>=256 else 260
    its=sorted(P.items,key=lambda i:i['meta'].get('group',i['key']));groups=[]
    for it in its:
        g=it['meta'].get('group',it['key'])
        if groups and groups[-1][0]==g:groups[-1][1].append(it)
        else:groups.append([g,[it]])
    parts=[];cur=[]
    for g,l in groups:
        if cur and len(cur)+len(l)>MAXN:parts.append(cur);cur=[]
        cur=cur+l
    if cur:parts.append(cur)
    for i,pt in enumerate(parts):
        Q=copy.copy(P);Q.items=pt
        if len(parts)>1:Q.id=f'{P.id}-p{i+1:02d}';Q.name=f'{P.name} · phần {i+1}/{len(parts)}'
        zp,n,sz,cv=Q.finalize(OUT);report.append(dict(id=Q.id,file=os.path.basename(zp),name=Q.name,assets=n,bytes=sz,license=P.license,tile=P.tile,canvas=list(cv),note=P.note,source=P.source))
        print(f'{Q.id:30s} {n:5d} mục  {sz/1e6:5.2f} MB  khung {cv}')
# ---------------- Wall packs ----------------
def walls(size):
    tile=[128,64] if size=='Small' else [256,128];P=Pack('sbs-wall-'+size.lower(),f'SBS Tường {"nhỏ" if size=="Small" else "lớn"} ({tile[0]}×{tile[1]})',tile,CC0,'Screaming Brain Studios — Isometric Wall Pack '+size,
      'Mỗi ô ảnh là một cạnh tường; ảnh nghiêng \\ gán Đông+Tây, ảnh / gán Nam+Bắc. Có 12 màu mỗi tệp, đủ cả hai hướng sáng SE và SW. Tường phẳng có vùng chặn mỏng, tường dày có vùng chặn dày hơn. Cột góc đặt giữa ô (tự đặt vào đỉnh ô).')
    base=SRC+f'SBS_-_Isometric_Wall_Pack_-_{size}/{size} Wall Tiles/'
    for sub,typ in (('Flat','phẳng'),('Thick','dày')):
        d=[x for x in os.listdir(base) if x.startswith(sub)][0]
        for fn in sorted(os.listdir(base+d)):
            if not re.search(r'-S[EW]-',fn) or fn.startswith('Corner'):continue
            lt=re.search(r'-(S[EW])-',fn).group(1);m=parse(fn)
            if not m:continue
            _,mat,num,win,cw,ch=m.groups();im=keyed(base+d+'/'+fn)
            wn={'_WindowA':' cửa sổ A','_WindowB':' cửa sổ B',None:''}[win]
            fp=[-.5,.4,.5,.5] if sub=='Flat' else [-.5,.28,.5,.5]
            wall_cells(P,im,int(cw),int(ch),f'{sub.lower()}_{mat.lower()}{(win or "").lower()}_{lt.lower()}',f'Tường {typ} {MATVI[mat.lower()]}{wn} {lt}','tuong',fp)
        for fn in sorted(os.listdir(base+d)):
            if not fn.startswith('Corner') or not re.search(r'-S[EW]-',fn):continue
            m=re.match(r'Corner_(Brick|Stone|Wood)_(\d+)-(S[EW])-(\d+)x(\d+)',fn);mat,num,lt,cw,ch=m.groups();im=keyed(base+d+'/'+fn)
            n=0
            for r,c,t in cells(im,int(cw),int(ch)):
                b=bbox(t);rx=(b[0]+b[2])/2;ry=b[3]-(4 if size=='Small' else 8)
                if P.add(f'cot_{mat.lower()}_{num}_{lt.lower()}_{n:02d}',t,'cot','ALL',ref=(rx,ry),off=(0,0),group=f'cot_{mat.lower()}_{num}_{lt.lower()}_{n:02d}',name=f'Cột góc {MATVI[mat.lower()]} {num} {lt} {n:02d}',footprint=[-.06,-.06,.06,.06]):n+=1
        break_=0
    done(P)
# ---------------- Doorways ----------------
def doorways(size):
    tile=[128,64] if size=='Small' else [256,128];P=Pack('sbs-doorways-'+size.lower(),f'SBS Cửa vòm {"nhỏ" if size=="Small" else "lớn"} ({tile[0]}×{tile[1]})',tile,CC0,'Screaming Brain Studios — Isometric Doorways '+size,
      'Ô tường có lỗ cửa (không có cánh cửa): khai báo cua/mo, không có ảnh cửa đóng nên không tự đóng/mở; vùng chặn là hai trụ hai bên lỗ cửa. Đủ màu × 3 chất liệu (gạch, đá, gỗ) × 3 kiểu lỗ cửa × hai hướng sáng SE/SW.')
    base=SRC+f'SBS_-_Isometric_Doorways_-_{size}/{size} Doorway Tiles/'
    for sub,typ in (('Flat','phẳng'),('Thick','dày')):
        for lt,ld in (('SE','Southeast'),('SW','Southwest')):
          d=base+sub+'/'+ld+'/'
          if not os.path.isdir(d):continue
          for fn in sorted(os.listdir(d)):
            m=re.match(r'(Flat|Thick)_(Brick|Stone|Wood)_Doorway_(\d+)-S[EW]-(\d+)x(\d+)',fn)
            if not m:continue
            _,mat,num,cw,ch=m.groups();im=keyed(d+fn)
            th=.22 if sub=='Flat' else .32;y=.4 if sub=='Flat' else .34
            col=[{'k':'seg','a':[-.5,y],'b':[-.26,y],'th':th},{'k':'seg','a':[.26,y],'b':[.5,y],'th':th}]
            wall_cells(P,im,int(cw),int(ch),f'{sub.lower()}_{mat.lower()}_cua{int(num):02d}_{lt.lower()}',f'Cửa vòm {typ} {MATVI[mat.lower()]} {int(num):02d} {lt} · kiểu','cua',None,state='mo',col=col)
    done(P)
# ---------------- ground ----------------
def ground_tiles(P,files,TW,TH,ref_y,cap=None):
    pass
def floor_pack():
    P=Pack('sbs-floor-textures','SBS Nền sàn (256×128)',[256,128],CC0,'Screaming Brain Studios — Isometric Textures Floor Pack','Ô nền hình thoi 256×128, đủ hai bản chiếu sáng trái (L) và phải (R). Gạch, cỏ, lát, gỗ.')
    base=SRC+'SBS_-_Isometric_Textures_-_Floor_Pack/Textures/'
    VI={'Brick':'gạch','Grass':'cỏ','Tile':'lát','Wood':'gỗ'}
    for cat in sorted(os.listdir(base)):
        for fn in sorted(os.listdir(base+cat)):
            m=re.match(r'(\w+)_(\d+)_([LR])-256x128\.png',fn)
            if not m:continue
            im=keyed(base+cat+'/'+fn);cov=coverage(im.crop((0,0,256,128)),(256,128))
            P.add(f'{cat.lower()}_{int(m.group(2)):02d}_{m.group(3).lower()}',im,'nen' if cov>.85 else 'tham','ALL',ref=(128,64),off=(0,0),group=f'{cat.lower()}_{int(m.group(2)):02d}_{m.group(3).lower()}',name=f'Nền {VI[cat]} {int(m.group(2)):02d} {m.group(3)}')
    done(P)
def overworld(size):
    TW,TH=(128,64) if size=='Small' else (256,128);TK=TH+(8 if size=='Small' else 16)
    P=Pack('sbs-overworld-'+size.lower(),f'SBS Địa hình ngoài trời {"nhỏ" if size=="Small" else "lớn"} ({TW}×{TH})',[TW,TH],CC0,'Screaming Brain Studios — Isometric Overworld Pack '+size,
      'Mỗi tệp 3×6 ô (đủ loại phẳng và dày): ô đủ hình thoi = nền (nen), ô mép/cạnh rách = phủ nền (tham). Nước vẫn tính là đi được (app chưa có luật chặn nước).')
    base=SRC+f'SBS_-_Isometric_Overworld_Pack_-_{size}/Overworld - {size}/'
    NM={'Terrain 1':'đất 1','Terrain 2':'đất 2','Terrain 3':'đất 3','Forest':'rừng','Water':'nước'}
    for sub in ('Flat','Thick'):
        for fn in sorted(os.listdir(base+sub)):
            m=re.match(r'Overworld - (.+?) - (Flat|Thick) (\d+)x(\d+)\.png',fn)
            if not m:continue
            nm=m.group(1);slug=re.sub(r'\W+','',nm.lower());im=keyed(base+sub+'/'+fn);ch=int(m.group(4))
            for r,c,t in cells(im,TW,ch):
                cov=coverage(t.crop((0,0,TW,TH)),(TW,TH));k=f'{slug}_{sub.lower()}_{r}{c}'
                P.add(k,t,'nen' if cov>.82 else 'tham','ALL',ref=(TW/2,TH/2),off=(0,0),group=k,name=f'Địa hình {NM.get(nm,nm)} {"dày" if sub=="Thick" else "phẳng"} {r*3+c+1:02d}')
    done(P)
def pathways(size):
    TW,TH=(128,64) if size=='Small' else (256,128)
    P=Pack('sbs-pathways-'+size.lower(),f'SBS Đường mòn {"nhỏ" if size=="Small" else "lớn"} ({TW}×{TH})',[TW,TH],CC0,'Screaming Brain Studios — Isometric Pathways Pack '+size,
      'Mảnh đường phủ lên nền (tham), mỗi tệp 4×3 hình. Đủ mọi tệp của mỗi nhóm (khô, phần tử, thực vật, cỏ, băng, đá núi, đá lát).')
    root=SRC+f'SBS_-_Isometric_Pathways_Pack_-_{size}/'
    base=root+[x for x in os.listdir(root) if x.startswith('Exterior')][0]+'/'
    VI={'Dry':'khô','Elements':'phần tử','Flora':'thực vật','Grass':'cỏ','Ice':'băng','Rocky':'đá núi','Stones':'đá lát'}
    for cat in sorted(os.listdir(base)):
        for fn in sorted(os.listdir(base+cat)):
            m=re.search(r'_(\d+)-\d+x\d+\.png',fn);im=keyed(base+cat+'/'+fn)
            for r,c,t in cells(im,TW,TH):
                k=f'{cat.lower()}_{int(m.group(1)):02d}_{r}{c}';P.add(k,t,'tham','ALL',ref=(TW/2,TH/2),off=(0,0),group=k,name=f'Đường {VI[cat]} {int(m.group(1)):02d} · mảnh {r*4+c+1}')
    done(P)
def grid():
    P=Pack('sbs-grid','SBS Lưới (128×64)',[128,64],CC0,'Screaming Brain Studios — Isometric Grid Pack','Chỉ lấy 3 ô lưới 128×64 (Tiles). Các ảnh lưới lớn (Grids/…) là ảnh nền dùng khi vẽ, không phải mảnh dựng cảnh nên không nạp.')
    base=SRC+'SBS_-_Isometric_Grid_Pack/Tiles/'
    for t in 'ABC':
        im=keyed(base+f'Tile_Type_{t}-128x64.png');P.add('luoi_'+t.lower(),im,'tham','ALL',ref=(64,32),off=(0,0),group='luoi_'+t.lower(),name='Ô lưới kiểu '+t)
    done(P)
# ---------------- crates / objects ----------------
def crates(size):
    s=64 if size==64 else 128;TW,TH=(s,s//2)
    P=Pack(f'sbs-crates-{s}',f'SBS Thùng {s}×{s}',[TW,TH],CC0,f'Screaming Brain Studios — Isometric Crates Pack {s}x{s}','Thùng gỗ/kim loại, đủ hai bản chiếu sáng L và R. Mỗi thùng chiếm đúng một ô (chân [-0.42..0.42]).')
    root=SRC+f'SBS_-_Isometric_Crates_Pack_-_{s}x{s}/'
    sub=[x for x in os.listdir(root) if x.startswith(('Small','Large'))][0]
    for mat in ('Wood','Metal'):
        d=f'{root}{sub}/{mat}/'
        for fn in sorted(os.listdir(d)):
            if not fn.endswith('.png'):continue
            m=re.search(r'_(\d+)-([LR])-',fn)
            if not m:continue
            im=keyed(d+fn)
            for r,c,t in cells(im,s,s):
                b=bbox(t);k=f'thung_{mat.lower()}_{int(m.group(1)):02d}_{m.group(2).lower()}_{r}{c}'
                P.add(k,t,'vat','ALL',ref=(s/2,b[3]-TH/2),off=(0,0),group=k,name=f'Thùng {"gỗ" if mat=="Wood" else "kim loại"} {int(m.group(1)):02d}{m.group(2)}.{r*6+c+1}',footprint=[-.42,-.42,.42,.42])
    done(P)
def objects():
    P=Pack('sbs-object-pack','SBS Vật thể: bậc thang & gờ tường (128×64)',[128,64],CC0,'Screaming Brain Studios — Isometric Object Pack (Stairs, Copings)',
      'Bậc thang (đủ tệp A–F của 3 chất liệu) và gờ tường đá 128. Chưa có luật nối hai tầng nên đặt làm vật trang trí, không chặn đường (chưa hiệu chỉnh). Thùng trong gói này trùng gói Crates nên không nạp lại; Temple Kit nằm ở gói riêng.')
    base=SRC+'SBS_-_Isometric_Object_Pack/'
    for mat in ('Brick','Stone','Wood'):
      for L in 'ABCDEF':
        fn=f'{base}Stairs/{mat}/{mat} {L} - Stairs 128x128.png'
        if os.path.exists(fn):
            for r,c,t in cells(keyed(fn),128,128):
                b=bbox(t);k=f'bac_{mat.lower()}_{L.lower()}_{r}{c}';P.add(k,t,'vat','ALL',ref=(64,b[3]-32),off=(0,0),group=k,name=f'Bậc thang {MATVI[mat.lower()]} {L}.{r*6+c+1}',solid=False)
    fn=base+'Copings/Copings - Stone 1 128x128.png'
    for r,c,t in cells(keyed(fn),128,128):
        b=bbox(t);k=f'go_da_{r}{c}';P.add(k,t,'vat','ALL',ref=(64,b[3]-32),off=(0,0),group=k,name=f'Gờ tường đá {r*6+c+1}',solid=False)
    done(P)
def copings64():
    P=Pack('sbs-object-copings-64','SBS Gờ tường đá 64 (64×32)',[64,32],CC0,'Screaming Brain Studios — Isometric Object Pack (Copings 64x64)','Gờ tường đá cỡ 64×64 trên ô 64×32; chưa hiệu chỉnh vùng chặn.')
    fn=SRC+'SBS_-_Isometric_Object_Pack/Copings/Copings - Stone 1 64x64.png'
    if os.path.exists(fn):
        for r,c,t in cells(keyed(fn),64,64):
            b=bbox(t);k=f'go64_{r}{c}';P.add(k,t,'vat','ALL',ref=(32,b[3]-16),off=(0,0),group=k,name=f'Gờ tường đá 64 · {r*6+c+1}',solid=False)
        done(P)
def temple():
    P=Pack('sbs-object-temple','SBS Temple Kit (104×52)',[104,52],CC0,'Screaming Brain Studios — Isometric Object Pack (Temple Kit)','Bộ đền cát: tường, cột, khối, nền. Ô 104×80 trên ô sàn 104×52; chưa hiệu chỉnh vùng chặn (solid=false).')
    im=keyed(SRC+'SBS_-_Isometric_Object_Pack/Temple Kit/104x80 Temple Kit.png')
    for r,c,t in cells(im,104,80):
        k=f'den_{r}{c}';P.add(k,t,'vat','ALL',ref=(52,80-26),off=(0,0),group=k,name=f'Đền cát {r*3+c+1}',solid=False)
    done(P)
# ---------------- town ----------------
def town():
    P=Pack('sbs-town','SBS Thị trấn (64×96, ô 128×64)',[128,64],CC0,'Screaming Brain Studios — Isometric Town Pack (+ Town Examples)',
      'Mặt nhà 64×96 ghép theo cạnh như gói tường ; mái 143×92 là lớp phủ trên cao. Bản đồ mẫu .tmx/.tsx trong Town Examples chỉ là ví dụ ghép bên Tiled nên không nạp.')
    base=SRC+'SBS_-_Isometric_Town_Pack/'
    for n in (1,2,3):
        im=keyed(base+f'Building Tiles/Isometric Buildings {n} - 64x96.png',(0,128,128))
        wall_cells(P,im,64,96,f'nha{n}',f'Mặt nhà {n}','tuong',[-.5,.4,.5,.5])
    fn=[x for x in os.listdir(base+'Roof Tiles') if x.endswith('.png')][0]
    for r,c,t in cells(keyed(base+'Roof Tiles/'+fn,(0,128,128)),144,92):
        b=bbox(t);k=f'mai_{r}{c}';P.add(k,t,'mai','ALL',ref=(72,b[3]-36),off=(0,0),group=k,name=f'Mái thị trấn {r*3+c+1}')
    done(P)
# ---------------- free samples ----------------
def pieces(path,rgb=(255,0,255)):
    im=keyed(path,rgb);out=[]
    for s,e in split_cols(im):
        p=im.crop((s,0,e,im.height));b=bbox(p);out.append(p.crop((0,0,p.width,im.height)))
    return out
def free_iso():
    P=Pack('sbs-free-dungeon','SBS Free Sample: hầm ngục (400×200)',[400,200],'Gói mẫu miễn phí của Screaming Brain Studios; tệp kèm không có giấy phép nên coi như chưa rõ, chỉ dùng thử','Isometric_Free_Sample.zip',
      'Mỗi vật có 4 ảnh theo 4 hướng, thứ tự hướng Đông,Nam,Tây,Bắc là giả định (chưa đối chiếu từng vật). Cánh cửa chỉ có ảnh đóng nên chưa mở được; khung cửa là lỗ cửa (cua/mo).')
    G=SRC+'Isometric_Free_Sample/Free Sample/'
    def face(name,key,label,role,**kw):
        pcs=pieces(G+name)
        for i,p in enumerate(pcs):
            s=slope(p);b=bbox(p);rx=(b[0]+b[2])/2;ry=base_mid(p,b)
            for d in (['E','W'] if s=='\\' else ['S','N']):
                P.add(f'{key}_{d}',p,role,d,ref=(rx,ry),off=edge_off(d,P.tile),group=key,name=label,**kw)
    face('WallBrick_Tall_01.png','tuong_gach','Tường gạch cao','tuong',footprint=[-.5,.4,.5,.5])
    face('DoorFrame_02.png','khung_cua','Khung cửa','cua',state='mo',col=[{'k':'seg','a':[-.5,.4],'b':[-.2,.4],'th':.22},{'k':'seg','a':[.2,.4],'b':[.5,.4],'th':.22}])
    pcs=pieces(G+'Door_05.png')
    for i,p in enumerate(pcs):
        s=slope(p);b=bbox(p);rx=(b[0]+b[2])/2;ry=base_mid(p,b)
        for d in (['E','W'] if s=='\\' else ['S','N']):
            P.add(f'canh_cua_{i}_{d}',p,'cua',d,ref=(rx,ry),off=edge_off(d,P.tile),group=f'canh_cua_{i//2}',name=f'Cánh cửa {i//2+1}',state='dong',col=[{'k':'seg','a':[-.5,.4],'b':[.5,.4],'th':.3}])
    for i,p in enumerate(pieces(G+'Floor_Corner_01.png')):
        b=bbox(p);d='ESWN'[i];P.add(f'goc_nen_{d}',p,'vien-nen',d,ref=((b[0]+b[2])/2,b[1]+100),off=(0,0),group='goc_nen',name='Góc nền',part='goc-ngoai')
    for i,p in enumerate(pieces(G+'Pillar_03.png')):
        b=bbox(p);P.add(f'cot_03_{i}',p,'cot','ALL',ref=((b[0]+b[2])/2,b[3]-16),off=(0,0),group=f'cot_03_{i}',name=f'Cột 03.{i+1}',footprint=[-.1,-.1,.1,.1])
    for nm,key,lab in (('SmallChest_02.png','ruong_dong','Rương'),('SmallChest_Top_02.png','ruong_mo','Rương mở nắp')):
        for i,p in enumerate(pieces(G+nm)):
            b=bbox(p);d='ESWN'[i];P.add(f'{key}_{d}',p,'ruong',d,ref=((b[0]+b[2])/2,b[3]-29),off=(0,0),group=key,name=lab,footprint=[-.2,-.2,.2,.2])
    for i,p in enumerate(pieces(G+'Torch_Wall_01.png')):
        b=bbox(p);d='ESWN'[i];P.add(f'duoc_tuong_{d}',p,'den',d,ref=((b[0]+b[2])/2,b[3]),off=(0,0),group='duoc_tuong',name='Đuốc treo tường',solid=False,place='wall')
    for i,p in enumerate(pieces(G+'Armor_01.png')):
        b=bbox(p);d='ESWN'[i];P.add(f'giap_{d}',p,'vat',d,ref=((b[0]+b[2])/2,b[3]-22),off=(0,0),group='giap',name='Tượng giáp',footprint=[-.14,-.14,.14,.14])
    done(P)
def free_city():
    P=Pack('sbs-free-city','SBS Free Sample: thành phố (320×160)',[320,160],'Gói mẫu miễn phí của Screaming Brain Studios; tệp kèm không có giấy phép nên coi như chưa rõ, chỉ dùng thử','FreeSample.zip',
      'Mỗi vật có 4 ảnh theo 4 hướng (thứ tự Đông,Nam,Tây,Bắc là giả định). Khối nhà/biển quảng cáo chưa hiệu chỉnh vùng chặn (solid=false); vỉa hè và đường nhựa là nền.')
    G=SRC+'FreeSample/FreeSample/'
    for fn in sorted(os.listdir(G)):
        if not fn.endswith('.png'):continue
        nm=fn[:-4];pcs=pieces(G+fn)
        for i,p in enumerate(pcs):
            b=bbox(p);d='ESWN'[i%4];cx=(b[0]+b[2])/2
            if nm.startswith('Sidewalk_Tile'):
                if i==0:P.add('via_he_'+nm[-1],p,'nen','ALL',ref=(cx,b[1]+80),off=(0,0),group='via_he_'+nm[-1],name='Vỉa hè '+nm[-1])
            elif nm.startswith(('Road_Chunk','Sidewalk_Chunk')):
                if i==0:P.add(nm.lower(),p,'tham','ALL',ref=(cx,b[1]+40),off=(0,0),group=nm.lower(),name=nm.replace('_',' '))
            elif nm.startswith(('Building','BuildingBlock')):
                P.add(f'{nm.lower()}_{d}',p,'ban',d,ref=(cx,b[3]-(b[2]-b[0])/4),off=(0,0),group=nm.lower(),name='Khối nhà '+nm.replace('BuildingBlock','').replace('Building',''),solid=False)
            else:
                P.add(f'{nm.lower()}_{d}',p,'vat',d,ref=(cx,b[3]-10),off=(0,0),group=nm.lower(),name=nm.replace('_',' '),solid=False)
    done(P)
if __name__=='__main__':
    sel=sys.argv[1:]
    jobs=dict(wall_small=lambda:walls('Small'),wall_large=lambda:walls('Large'),door_small=lambda:doorways('Small'),door_large=lambda:doorways('Large'),floor=floor_pack,
      ow_small=lambda:overworld('Small'),ow_large=lambda:overworld('Large'),path_small=lambda:pathways('Small'),path_large=lambda:pathways('Large'),grid=grid,
      crate64=lambda:crates(64),crate128=lambda:crates(128),objects=objects,copings64=copings64,temple=temple,town=town,free_iso=free_iso,free_city=free_city)
    for k,f in jobs.items():
        if not sel or k in sel:f()
    if not sel:
        report+=[dict(skipped=True,name='SBS Textures Wall Pack',reason='432 ảnh kết cấu vuông 128×128 (nguồn để bake bằng Blender), không phải ô iso nên không đưa vào pack.'),
          dict(skipped=True,name='SBS Crate Textures 64×64',reason='48 kết cấu vuông 64×64 để dựng thùng bằng Tile Toolkit, không phải sprite iso.'),
          dict(skipped=True,name='SBS Tile Toolkit',reason='Cảnh Blender, script GIMP và mặt nạ — công cụ, không có sprite dựng cảnh.'),
          dict(skipped=True,name='SBS Town Examples',reason='Bản đồ Tiled (.tmx/.tsx) ghép mặt nhà của Town Pack; dùng để tham chiếu cách ghép, đã ghi vào gói sbs-town.')]
        json.dump(report,open(OUT+'/index.json','w'),ensure_ascii=False,indent=1)
