# Gom sprite/mô-đun/cảnh vật của các gói thành bộ "vật thể" vat/<id>.json (atlas ô vuông T, điểm neo = giữa đáy ô)
import os,json,glob,re,io,base64,hashlib,unicodedata
from PIL import Image
R='/tmp/iso3/';OUT='/home/claude/ed/vat/'
BT=R+'Bo-Tai-Nguyen-2D-Isometric/'
def asc(s):s=unicodedata.normalize('NFD',s.lower());s=''.join(c for c in s if unicodedata.category(c)!='Mn').replace('đ','d');return s
SKIP=re.compile(r'(-than|-lan-can|-lop-che|-nen|-0|-1)\.png$|^lop-che|hieu-ung')
def dm(path):
    try:d=json.load(open(path))
    except Exception:return {}
    L=d if isinstance(d,list) else d.get('sprites',[])
    out={}
    for x in L:
        f=x.get('file');
        if f:out[os.path.basename(f)]=(x.get('name'),x.get('pivot_px_reference') or x.get('pivot_px'))
    return out
def mod_anchor(path):
    try:d=json.load(open(path))
    except Exception:return {}
    out={}
    for k,v in (d.get('assets') or {}).items():
        if isinstance(v,dict) and v.get('file'):out[os.path.basename(v['file'])]=v.get('anchor_px')
    return out
def src(folder,sub,dmfile=None,anchor=None,pref=''):
    L=[];names=dm(folder+dmfile) if dmfile else {};anc=mod_anchor(folder+anchor) if anchor else {}
    for f in sorted(glob.glob(folder+sub+'/*.png')):
        b=os.path.basename(f)
        if SKIP.search(b):continue
        nm,pv=names.get(b,(None,None));pv=pv or anc.get(b)
        k=b[:-4].replace('-',' ').replace('_',' ');L.append((f,nm or VN.get(k,k.capitalize()),pv))
    return L
VN={'quan tra':'Quán trà','sap cho':'Sạp chợ','tiem thuoc':'Tiệm thuốc','tuu quan':'Tửu quán','cong thanh':'Cổng thành','hoang cung':'Hoàng cung','tuong thanh':'Tường thành','vong lau goc':'Vọng lâu góc','cau da vom':'Cầu đá vòm','ke bo kenh':'Kè bờ kênh','cong thoat nuoc':'Cống thoát nước','bac ben thuyen':'Bậc bến thuyền','nen lat da':'Nền lát đá','dat nen':'Đất nền','dat co':'Đất cỏ','mat nuoc kenh':'Mặt nước kênh','cay dao':'Cây đào','cay lieu':'Cây liễu','cum bui hoa co':'Cụm bụi hoa cỏ','cum sen':'Cụm sen','lan can mau roi':'Lan can mẫu rời','lan can phai':'Lan can phải','lan can trai':'Lan can trái','mat di':'Mặt đi','tong hop':'Tổng hợp','chieu nghi':'Chiếu nghỉ','ve thang':'Vế thang','nha ba gian':'Nhà ba gian','nha mot gian':'Nhà một gian','nha co hien':'Nhà có hiên','kho':'Kho','gieng':'Giếng',
 'cong thanh u':'Cổng thành (hướng U)','cong thanh v':'Cổng thành (hướng V)','cua cung':'Cửa cung','dien chau':'Điện châu','hanh lang':'Hành lang','lan can u':'Lan can (U)','lan can v':'Lan can (V)','nha pho':'Nhà phố','phu de':'Phủ đệ','thap tuong':'Tháp tường','tuong goc':'Tường góc','tuong u':'Tường (U)','tuong v':'Tường (V)','bac da lan can':'Bậc đá lan can',
 'cau da u':'Cầu đá (U)','cau da v':'Cầu đá (V)','chinh dien':'Chính điện','den da':'Đèn đá','dinh thien':'Đỉnh thiên','duoc thao':'Dược thảo','gac chuong':'Gác chuông','lu huong':'Lư hương','mom da':'Mỏm đá','son mon':'Sơn môn','thap da':'Tháp đá','thong nui':'Thông núi','vach da day leo':'Vách đá dây leo','bac da co tu':'Bậc đá cổ tự','bac da co tu huong nguoc':'Bậc đá cổ tự (ngược)',
 'bac da co':'Bậc đá cổ','bac da co huong nguoc':'Bậc đá cổ (ngược)','co thu':'Cổ thụ','cong do':'Cổng độ','da khac vo':'Đá khắc vỏ','den da co':'Đền đá cổ','dien do':'Điện độ','duong xi':'Dương xỉ','gieng can':'Giếng cạn','ruong da':'Ruộng đá','te dan':'Tế đàn','tinh the':'Tĩnh thể','tru da nut':'Trụ đá nứt',
 'bac da ne sw':'Bậc đá NE–SW','bac da nw se':'Bậc đá NW–SE','bui truc':'Bụi trúc','cau go ne sw':'Cầu gỗ NE–SW','cau go nw se':'Cầu gỗ NW–SE','choi tre':'Chòi tre','cua hang':'Cửa hang','da co thu':'Đa cổ thụ','duong xi va hoa':'Dương xỉ và hoa','khuc suoi':'Khúc suối','mieu rung':'Miếu rừng','thac rung':'Thác rừng'}
ROLE_OVR={'ho bang':'Phủ nền','san da tuyet':'Phủ nền','co kho va da tuyet':'Phủ nền','thap tuong':'Nhà','thap tuong thanh':'Nhà','hoang cung':'Nhà','vong lau goc':'Nhà','tuong thanh':'Hạ tầng','cong thoat nuoc':'Hạ tầng','quan tra':'Nhà','sap cho':'Nhà','bac ben thuyen':'Hạ tầng','chieu nghi':'Hạ tầng','mat di':'Hạ tầng','tong hop':'Vật','ve thang':'Hạ tầng','vach da day leo':'Vật','vach bang':'Vật','thac rung':'Vật'}
def role(n):
    a=asc(n)
    if a in ROLE_OVR:return ROLE_OVR[a]
    if re.search(r'(^| )(la sen|cum sen|o sen|mat nuoc|nen lat|dat nen|dat co|hoa tiet|bac them)',a):return 'Phủ nền'
    if re.search(r'(gio trai|trai cay|ban tra|ghe |chum|thung|khay|toi thuoc|tu ngan|coc |den long|den da|den ngoc|cot den|co rong|co hac|rem |gia binh|de ren|lu huong|thuyen|mai cheo|dau ben|cuon day)',a):return 'Vật'
    if re.search(r'(stairs|bridge|road|path|water|ramp|slope)',a):return 'Hạ tầng'
    if re.search(r'(wall|column|door|gate|barrel|crate|chest|table|chair|pile|support|beam|shelf|book|bed|bench|fence|lamp|torch|statue|coffin|grave|tomb|banner|flag)',a):return 'Vật'
    if re.search(r'(^| )(stone|dirt|planks|plank|tile|tiles|grass|sand|floor|mud|snow|inset|step|steps)( |$)|dirt tiles|planks broken|stone uneven|stone side',a):return 'Phủ nền'
    if re.search(r'(tree|bush|plant|flower|palm|pine|cactus|hay|crop|wheat|corn|vine)',a):return 'Cây'
    if re.search(r'(house|building|tower|hut|barn|shop|castle|temple|tent|windmill|church|home)',a):return 'Nhà'
    if re.search(r'(^| )(cau|bac|loi van|ben go|dau ben|van len|choi ben|thac|khuc suoi|vach|ghenh|ke bo|mom|da khac|ruong da|gieng can|lan can|tuong|hanh lang)( |$)',a):return 'Hạ tầng'
    if re.search(r'(ruong|luong rau|bai co|o sen|duong xi|duoc thao)',a):return 'Phủ nền'
    if re.search(r'(^| )(cay|thong|da co thu|co thu|trung|bui|cum|oc dao|rang)( |$)|(thong|bui |cum )',a):return 'Cây'
    if re.search(r'(nha|dien|dinh|mieu|quan|thap|cong|phu de|tram|leu|chuong|kho( |$)|choi|hai dang|tiem|khach|den |te dan|chinh|gac|son mon|guong|cua cung|tinh the|tru da|lu huong|hang|thien)',a):return 'Nhà'
    return 'Vật'
def prep(im,scale=1.0):
    if scale!=1.0:im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.LANCZOS)
    m=im.getchannel('A').point(lambda v:255 if v>24 else 0);bb=m.getbbox()
    if not bb:return im,im.width/2,im.height-1,1,1
    bot=bb[3];band=m.crop((bb[0],max(bb[1],bot-14),bb[2],bot)).getbbox()
    px=(bb[0]+bb[2])/2
    n=1
    for k in (4,3,2):
        y=bot-48*k;r=m.crop((0,max(0,y-5),m.width,max(1,y+5))).getbbox()
        if r and (r[2]-r[0])>=.78*192*k:n=k;break
    return im,px,bot,n,n
def fpr(*a):return 1,1
PACKS={}
def add(pid,name,desc,items):PACKS.setdefault(pid,{'name':name,'desc':desc,'items':[]})['items']+=items
def lst(*a,**k):return src(*a,**k)
add('lang-nui','Làng núi · nhà gỗ, quán trà, cổng sơn thôn','7 sprite làng núi + 6 sprite gói v1',lst(BT+'Lang-Nui-Vo-Hiep/','sprites','Danh-muc.json'))
add('pho-cho','Phố chợ · tiệm, khách điếm, cầu đá, bến gỗ','tiệm gỗ, khách điếm, quầy vải, thuyền chở hàng…',lst(BT+'Pho-Cho-Ben-Kenh/','sprites','Danh-muc.json'))
add('ben-song','Bến sông · nhà sàn, cầu gỗ, bến phà, thuyền','sprite + cảnh vật + mô-đun cầu/bến',lst(R+'Ben-Song-Thuy-Tran-2D-Isometric-Mo-Rong/','sprites','Danh-muc.json')+lst(R+'Ben-Song-Thuy-Tran-2D-Isometric-Mo-Rong/','canh-vat',anchor='Mo-dun-ben-song.json')+lst(R+'Ben-Song-Thuy-Tran-2D-Isometric-Mo-Rong/','mo-dun',anchor='Mo-dun-ben-song.json'))
add('duyen-hai','Duyên hải · nhà chài, cầu cảng, hải đăng','sprite + cảnh vật + mô-đun cảng',lst(R+'Duyen-Hai-Cang-Bien-2D-Isometric-Mo-Rong/','sprites','Danh-muc.json')+lst(R+'Duyen-Hai-Cang-Bien-2D-Isometric-Mo-Rong/','canh-vat')+lst(R+'Duyen-Hai-Cang-Bien-2D-Isometric-Mo-Rong/','mo-dun'))
add('thao-nguyen','Thảo nguyên · lều, chuồng ngựa, tháp canh, cổng ải','sprite + cảnh vật + mô-đun',lst(R+'Thao-Nguyen-Bien-Ai-2D-Isometric-Mo-Rong/','sprites','Danh-muc.json')+lst(R+'Thao-Nguyen-Bien-Ai-2D-Isometric-Mo-Rong/','canh-vat')+lst(R+'Thao-Nguyen-Bien-Ai-2D-Isometric-Mo-Rong/','mo-dun'))
add('dong-que','Đồng quê · nhà nông, guồng nước, kho thóc','nhà nông, ruộng, luống rau, bậc đá',lst(BT+'Dong-Que-Ruong-Bac-Thang/','sprites','Danh-muc.json'))
add('dam-sen','Đầm sen · đình sen, cầu đá, thuyền sen','ô sen, đình, lối ván, cầu đá',lst(BT+'Dam-Sen-Trang-Len/','sprites','Danh-muc.json'))
add('kinh-thanh','Kinh thành · phố, phủ đệ, điện, cổng, tường thành','22 sprite kinh/hoàng thành + 6 sprite gốc',lst(R+'Kinh-Thanh-Hoang-Thanh-2D-Isometric/','sprites')+lst(BT+'Kinh-Thanh-Hoang-Thanh/','sprites','Danh-muc.json'))
add('son-mon','Sơn môn tuyết · điện, cổng tuyết, cầu băng, thông','8 sprite sơn môn tuyết linh',lst(BT+'Son-Mon-Tuyet-Linh/','sprites','Danh-muc.json'))
add('van-son','Vân sơn cổ tự · chính điện, tháp, đèn đá, thông','15 sprite vân sơn',lst(R+'Khu-12-13-Van-Son-Khe-Ngoc-2D-Isometric/12-Van-Son-Co-Tu/','sprites','Danh-muc.json'))
add('khe-ngoc','Khe ngọc phế tích · đền đá, tế đàn, cổng độ','15 sprite phế tích',lst(R+'Khu-12-13-Van-Son-Khe-Ngoc-2D-Isometric/13-Khe-Ngoc-Phe-Tich/','sprites','Danh-muc.json'))
add('rung-truc','Rừng trúc · chòi tre, miếu, đa cổ thụ, cầu gỗ, thác','12 sprite rừng trúc',lst(R+'Rung-Truc-Co-Thu-2D-Isometric-Mo-Rong/','sprites'))
add('tram-dich','Trạm dịch xích sa · trạm, ốc đảo, vòm sa thạch','6 sprite sa mạc',lst(BT+'Tram-Dich-Xich-Sa/','sprites','Danh-muc.json'))

FORCE={'kenney-buildings':'Nhà','kenney-city':'Nhà','kenney-landscape':'Vật'}
EXT='/tmp/ext/';KR='/tmp/rar/k/'
def camel(b):return re.sub(r'(?<=[a-z0-9])(?=[A-Z])',' ',b).replace('_',' ')
def jsrc(path,base,idk='id',nmk='name_vi',filek='file',pivk=None,pref=''):
    d=json.load(open(path));L=d if isinstance(d,list) else []
    out=[]
    for x in L:
        f=base+x[filek]
        if os.path.exists(f):out.append((f,x.get(nmk) or x.get(idk),None,1.0))
    return out
def folder(path,scale=1.0,filt=None,nm=None):
    out=[]
    for f in sorted(glob.glob(path)):
        b=os.path.basename(f)[:-4]
        if filt and not filt(b):continue
        out.append((f,(nm(b) if nm else (lambda k:VN.get(k.lower(),k.capitalize()))(camel(b.replace('-',' ')))),None,scale))
    return out
# --- Phố chợ bổ sung + sơn môn luyện võ + công trình lắp sẵn / mô-đun kiến trúc
ex=jsrc(EXT+'069c26ab-Pho-Cho-Ben-Kenh-2D-Bo-Sung/Danh-muc.json',EXT+'069c26ab-Pho-Cho-Ben-Kenh-2D-Bo-Sung/')
add('pho-cho','Phố chợ','',ex)
add('kinh-thanh','Kinh thành','',folder(EXT+'9f404374-Pho-Cho-Ben-Kenh-2D/Thanh-tri/*.png'))
add('pho-cho','Phố chợ','',folder(EXT+'9f404374-Pho-Cho-Ben-Kenh-2D/Nha-cua/*.png')+folder(EXT+'9f404374-Pho-Cho-Ben-Kenh-2D/Cau-cong/*.png')+folder(EXT+'9f404374-Pho-Cho-Ben-Kenh-2D/Cay-hoa/*.png')+folder(EXT+'9f404374-Pho-Cho-Ben-Kenh-2D/Dia-hinh/*.png'))
SM=EXT+'sm2/';add('son-mon','Sơn môn tuyết','',jsrc(SM+'Danh-muc-sprite.json',SM))
add('son-mon','Sơn môn tuyết','',folder(SM+'Cau-day/*.png')+folder(SM+'Cau-thang/*.png'))
KS=1.28
def ct(p):return folder(R+'Lang-Nui-Vo-Hiep-v2-Cong-Trinh-Lap-San_1/CT-0*/Goc-cheo/*.png',KS)
add('cong-trinh','Công trình lắp sẵn · nhà ba gian, kho, giếng…','công trình dựng sẵn (5 nhóm CT)',ct(0))
add('kien-truc','Mô-đun kiến trúc · nền, cột, dầm, xà, vì kèo…','mảnh lắp ghép (KT-01…07), đặt tay',folder(R+'Lang-Nui-Vo-Hiep-v2-Mo-Dun-Kien-Truc_1/KT-0*/Goc-cheo/*.png',KS))
# --- Kenney (rar)
def kmini(d,orient=('S',),label=''):
    out=[]
    for f in sorted(glob.glob(KR+d+'/Isometric/*.png')):
        b=os.path.basename(f)[:-4];m=re.match(r'(.*)_([NESW])$',b)
        if not m or m.group(2) not in orient:continue
        out.append((f,camel(m.group(1)).replace('stone ','stone ').capitalize()+('' if len(orient)==1 else ' ('+m.group(2)+')'),None,.75))
    return out
add('dia-cung','Địa cung · tường đá, cột, cửa, rương, thùng, bàn (Kenney dungeon)','bộ dungeon Kenney từ gói rar',kmini('kenney_isometric-miniature-dungeon',('S','E')))
add('kenney-farm','Kenney · nông trại mini','từ gói rar',kmini('kenney_isometric-miniature-farm'))
add('kenney-library','Kenney · thư viện mini','từ gói rar',kmini('kenney_isometric-miniature-library'))
add('kenney-bases','Kenney · căn cứ mini','từ gói rar',kmini('kenney_isometric-miniature-bases'))
add('kenney-prototype','Kenney · khối mẫu mini','từ gói rar',kmini('kenney_isometric-miniature-prototype'))
for k,n in [('landscape','cảnh quan'),('buildings','nhà cửa'),('city','phố thị')]:
    fs=[]
    for f in sorted(glob.glob(KR+'kenney_isometric-'+k+'/PNG/**/*.png',recursive=True)):
        b=os.path.basename(f)[:-4]
        if re.search(r'(_[NESW]|_[0-9]+)$',b) is None:pass
        fs.append((f,camel(b),None,1.45))
    add('kenney-'+k,'Kenney · '+n+' (iso cổ điển)','từ gói rar',fs[:140])
def build():
    os.makedirs(OUT,exist_ok=True);idx=[]
    for pid,P in PACKS.items():
        seen=set();ims=[]
        for it in P['items']:
            f,nm,pv=it[:3];sc=it[3] if len(it)>3 else 1.0
            im0=Image.open(f).convert('RGBA');h=hashlib.md5(im0.tobytes()).hexdigest()
            if h in seen:continue
            seen.add(h);im,px,py,fx,fy=prep(im0,sc)
            if im.getchannel('A').getbbox() is None:continue
            ims.append((nm,im,px,py,fx,fy))
        if not ims:continue
        T=0
        for nm,im,px,py,fx,fy in ims:T=max(T,2*max(px,im.width-px),py)
        T=int(-(-T//32)*32);n=len(ims);cols=min(n,6 if T<400 else 4)or 1;rows=-(-n//cols)
        at=Image.new('RGBA',(cols*T,rows*T),(0,0,0,0));items=[]
        for i,(nm,im,px,py,fx,fy) in enumerate(ims):
            cx,cy=(i%cols)*T,(i//cols)*T;at.alpha_composite(im,(int(round(cx+T/2-px)),int(round(cy+T-py))))
            items.append({'name':nm,'role':FORCE.get(pid) or role(nm),'i':i,'fx':fx,'fy':fy,'sc':round(T/128,3),'w':im.size[0],'h':im.size[1]})
        q=at.quantize(256,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE)
        b=io.BytesIO();q.save(b,'PNG',optimize=True);url='data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
        json.dump({'id':pid,'name':P['name'],'desc':P['desc'],'T':T,'cols':cols,'items':items,'atlas':url},open(OUT+pid+'.json','w'),ensure_ascii=False,separators=(',',':'))
        import collections
        idx.append({'id':pid,'name':P['name'],'desc':P['desc'],'n':n,'kb':os.path.getsize(OUT+pid+'.json')//1024})
        print(pid,n,'T',T,idx[-1]['kb'],'KB',dict(collections.Counter(x['role'] for x in items)))
    json.dump(idx,open(OUT+'index.json','w'),ensure_ascii=False)
if __name__=='__main__':build()
