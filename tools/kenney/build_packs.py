import os,re,io,json,base64,hashlib,math,glob,sys
from PIL import Image
R='/home/claude/kn'; OUT='/home/claude/ed'
DIRN={'N':'Bắc','E':'Đông','S':'Nam','W':'Tây'}
TOK={'stone':'đá','wall':'tường','wooden':'gỗ','wood':'gỗ','column':'cột','door':'cửa','doorway':'lối cửa','gate':'cổng','gateway':'cổng','window':'cửa sổ','bars':'song sắt','barrel':'thùng','barrels':'thùng','crate':'hòm','crates':'hòm','chest':'rương','table':'bàn','chair':'ghế','chairs':'ghế','stairs':'cầu thang','stair':'bậc','step':'bậc','steps':'bậc','bridge':'cầu','roof':'mái','fence':'hàng rào','hay':'cỏ khô','bales':'bó','corn':'ngô','young':'non','ladder':'thang','carpet':'thảm','bookcase':'tủ sách','books':'sách','book':'sách','stand':'giá','candle':'chân nến','display':'tủ trưng bày','case':'tủ','long':'dài','short':'thấp','round':'tròn','broken':'vỡ','aged':'cũ','old':'cũ','hole':'thủng','open':'mở','closed':'đóng','corner':'góc','inner':'trong','left':'trái','right':'phải','planks':'ván','plank':'ván','dirt':'đất','tiles':'gạch','tile':'gạch','floor':'sàn','base':'bệ','square':'vuông','grass':'cỏ','snow':'tuyết','flat':'phẳng','high':'cao','detail':'chi tiết','float':'nổi','farmland':'ruộng','spiral':'xoắn','structure':'khung','supports':'cột chống','support':'cột chống','beam':'xà','beams':'xà','block':'khối','pile':'đống','sack':'bao','sacks':'bao','chimney':'ống khói','top':'đỉnh','side':'mép','uneven':'gồ ghề','inset':'lõm','missing':'khuyết','single':'đơn','slope':'dốc','vertical':'dọc','cross':'chéo','diagonal':'chéo','diagional':'chéo','empty':'trống','glass':'kính','sword':'kiếm','fallen':'đổ','destroyed':'hỏng','half':'nửa','wide':'rộng','large':'lớn','decorated':'trang trí','items':'đồ','desk':'bàn viết','small':'nhỏ','end':'đầu','double':'đôi','library':'thư viện','archway':'cổng vòm','archway':'cổng vòm','in':'trong','and':'và','with':'có','the':'','a':'','of':''}
def vn(name):
    s=re.sub(r'([a-z])([A-Z])',r'\1 \2',name).replace('_',' ').lower().split()
    out=[TOK.get(t,t) for t in s];out=[t for t in out if t]
    r=' '.join(out);return r[:1].upper()+r[1:]
def load(z):
    d={}
    for f in sorted(glob.glob(f'{R}/{z}/Isometric/*.png')):
        b=os.path.basename(f)[:-4];n,dr=b.rsplit('_',1)
        d.setdefault(n,{})[dr]=Image.open(f).convert('RGBA')
    return d
def variants(n,dd):
    seen={};order=[]
    for dr in 'SENW':
        if dr not in dd:continue
        h=hashlib.md5(dd[dr].tobytes()).hexdigest()
        if h in seen:seen[h][1].append(dr);continue
        seen[h]=(dd[dr],[dr]);order.append(h)
    res=[]
    for h in order:
        im,drs=seen[h];lab=vn(n)
        if len(order)>1:lab+=' · '+DIRN[drs[0]]
        res.append((lab,im,drs[0]))
    return res
def png64(im):
    b=io.BytesIO();im.save(b,'PNG',optimize=True);return 'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode(),len(b.getvalue())
def isfloor(n,im):
    b=im.split()[3].getbbox();w=b[2]-b[0];h=512-b[1]
    return w==256 and h<=160 and not re.search('stairs|stoneStep|roof',n)
def role(n):
    if re.match(r'(roof|woodWallRoof|chimneyTop)',n):return 'Mái/cửa'
    if re.match(r'(stoneWall|woodWall|stoneColumn|chimneyBase|bookcase|wallBooks|wallDoorway|woodenSupports|woodenSupportBeams|woodenSupportsBeam)',n):return 'Nhà'
    if re.match(r'(bridge|stairs|fence|ladder|planksHigh|base_|square_)',n):return 'Hạ tầng'
    if re.match(r'(floorCarpet|corn|dirtFarm)',n):return 'Phủ nền'
    return 'Vật'
T=296;ANCH=512
EDGE={'S':[-1,-1,1,.25],'E':[-1,-1,.25,1],'N':[-1,-.25,1,.25],'W':[-.25,-1,.25,1]}
def zbfor(n,dr):
    if re.match(r'(roof|woodWallRoof|chimneyTop|floorCarpet|corn|dirtFarm|bridge|stairs)',n):return [0,0,0,0]
    if re.search(r'(Archway|Doorway|DoorOpen|GateOpen|Gateway)$|^stoneWall(Door|Gate)$|^stoneWallAgedLeft$',n):return [0,0,0,0]
    if re.match(r'(stoneWallCorner|woodWallCorner|stoneWallStructure|stoneWallRound|stoneWallColumn|chimneyBase|woodenSupportsBlock|woodWallSupport)',n):return [-1,-1,1,1]
    if re.match(r'(stoneWall|woodWall|wallBooks|wallDoorway)',n):return EDGE.get(dr,[-1,-1,1,1])
    if re.match(r'(bookcase|fence|woodenSupports|woodenSupportBeams|woodenSupportsBeam|ladder)',n):
        e=EDGE.get(dr,[-1,-1,1,1]);return [e[0],e[1],max(e[2],.45) if e[2]<1 else e[2],max(e[3],.45) if e[3]<1 else e[3]]
    if re.match(r'(base_|square_)',n):return [0,0,0,0]
    return [-.8,-.8,.6,.6]
def vatpack(pid,name,desc,names_imgs):
    items=[];cells=[]
    for t in names_imgs:
        cells.append(t)
    n=len(cells);cols=12;rows=math.ceil(n/cols)
    at=Image.new('RGBA',(cols*T,rows*T),(0,0,0,0))
    for i,(nm,rawn,im,dr) in enumerate(cells):
        c=im.crop((0,ANCH-T,256,ANCH))   # đáy ảnh = đỉnh dưới của ô nền
        x=(i%cols)*T+(T-256)//2;y=(i//cols)*T
        at.paste(c,(x,y))
        b=im.split()[3].getbbox()
        items.append({'name':nm,'role':role(rawn),'cv':None,'i':i,'fx':1,'fy':1,'sc':round(T*1.5/256,4),'zb':zbfor(rawn,dr),'k':rawn,'d':dr,'oy':round(20/T,4),'w':b[2]-b[0],'h':ANCH-b[1]})
    url,sz=png64(at)
    return {'id':pid,'name':name,'desc':desc,'T':T,'cols':cols,'items':items,'atlas':url},sz,at.size
def nenpack(pid,name,desc,floors,main,alt):
    TW=256;CY=64;cols=8;n=len(floors);rows=math.ceil(n/cols)
    at=Image.new('RGBA',(cols*TW,rows*TW),(0,0,0,0));idx={}
    for i,(nm,rawn,im) in enumerate(floors):
        b=im.split()[3].getbbox();top=b[1]
        c=im.crop((0,top-CY,256,top-CY+TW))
        at.paste(c,((i%cols)*TW,(i//cols)*TW))
        key=re.sub(r'\W','-',rawn.lower())+('-'+nm.split('· ')[1].lower() if '· ' in nm else '')
        idx[key]=i;
        if rawn==main and 'nen' not in idx:idx['nen']=i
        if rawn==alt and 'san' not in idx:idx['san']=i
    url,sz=png64(at)
    th=floors[0][2];tb=th.split()[3].getbbox();t=th.crop((0,tb[1],256,tb[1]+128)).resize((96,48));turl,_=png64(t)
    return {'id':pid,'name':name,'desc':desc,'tw':TW,'cy':CY,'cols':cols,'idx':idx,'bz':{},'atlas':url},sz,turl,at.size
def addindex(path,ent):
    L=json.load(open(path)) if os.path.exists(path) else []
    L=[e for e in L if e['id']!=ent['id']];L.append(ent)
    json.dump(L,open(path,'w'),ensure_ascii=False,separators=(',',':'))
os.makedirs(OUT+'/nen',exist_ok=True);os.makedirs(OUT+'/vat',exist_ok=True)
PK=[('dungeon','dia-lao','Kenney · Địa lao','tường đá, cột, cửa vòm, cổng song sắt, thùng, bàn ghế, rương','stone','planks'),
    ('farm','nong-trai','Kenney · Nông trại','tường & mái gỗ, hàng rào, ruộng ngô, cỏ khô, thang, ống khói','planks','dirt'),
    ('library','thu-vien','Kenney · Thư viện','tủ sách, bàn dài, thảm, chân nến, tủ trưng bày',None,None)]
for z,sid,nm,desc,main,alt in PK:
    d=load(z);floors=[];props=[]
    for n,dd in d.items():
        for lab,im,dr in variants(n,dd):
            (floors if isfloor(n,im) else props).append((lab,n,im,dr))
    if floors:
        # tên gốc cho idx
        fl=[(lab,n,im) for lab,n,im,dr in floors]
        pk,sz,thumb,size=nenpack('kenney-'+sid,nm+' · sàn',f'sàn đá, ván, đất ({len(fl)} ô)',fl,main,alt)
        json.dump(pk,open(f'{OUT}/nen/kenney-{sid}.json','w'),ensure_ascii=False,separators=(',',':'))
        addindex(f'{OUT}/nen/index.json',{'id':'kenney-'+sid,'name':nm+' · sàn','desc':f'sàn đá, ván, đất, bậc ({len(fl)} ô)','n':len(fl),'kb':sz//1024,'thumb':thumb})
        print('nen',sid,len(fl),size,sz//1024,'KB')
    pk,sz,size=vatpack('kenney-'+sid,nm+' · '+desc.split(',')[0],desc,props)
    json.dump(pk,open(f'{OUT}/vat/kenney-{sid}.json','w'),ensure_ascii=False,separators=(',',':'))
    addindex(f'{OUT}/vat/index.json',{'id':'kenney-'+sid,'name':nm+' · '+desc,'desc':desc,'n':len(props),'kb':sz//1024})
    print('vat',sid,len(props),size,sz//1024,'KB')
# bệ (bases)
d=load('bases');props=[]
for n,dd in d.items():
    for lab,im,dr in variants(n,dd):props.append((lab,n,im,dr))
pk,sz,size=vatpack('kenney-be','Kenney · Bệ đảo','bệ tròn và vuông: đất, cỏ, gỗ, đá, tuyết',props)
json.dump(pk,open(f'{OUT}/vat/kenney-be.json','w'),ensure_ascii=False,separators=(',',':'))
addindex(f'{OUT}/vat/index.json',{'id':'kenney-be','name':'Kenney · Bệ đảo (đất, cỏ, gỗ, đá, tuyết)','desc':'bệ tròn và vuông','n':len(props),'kb':sz//1024})
print('vat be',len(props),size,sz//1024,'KB')
