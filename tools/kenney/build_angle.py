import os,re,io,json,base64,math,glob,sys
sys.argv=[sys.argv[0]]
from PIL import Image
R='/home/claude/kn';OUT='/home/claude/ed'
exec(open(R+'/build_packs.py').read().split("T=296;ANCH=512")[0])   # load, variants, png64, isfloor, vn…
ANCHA=487   # mép dưới mặt trên của ô sàn Angle (ảnh 256×512); iso dùng 492
def ceil8(v):return int(math.ceil(v/8)*8)
def loadA(z,n,dr):
    return Image.open(f'{R}/{z}/Angle/{n}_{dr}.png').convert('RGBA')
PK=[('dungeon','dia-lao'),('farm','nong-trai'),('library','thu-vien')]
def vat_angle(z,pid,items):
    ims=[loadA(z,it['k'],it['d']) for it in items]
    top=min(im.split()[3].getbbox()[1] for im in ims);TA=ceil8(512-top)+8
    cols=12;n=len(items);rows=math.ceil(n/cols)
    at=Image.new('RGBA',(cols*TA,rows*TA),(0,0,0,0))
    for i,im in enumerate(ims):
        c=im.crop((0,512-TA,256,512));at.paste(c,((i%cols)*TA+(TA-256)//2,(i//cols)*TA))
    url,sz=png64(at)
    pk={'id':pid,'proj':'angle','T':TA,'tw':TA,'cols':cols,'n':n,'sc':round(TA*1.5/256,4),'dI':20,'dA':512-ANCHA,'atlas':url}
    json.dump(pk,open(f'{OUT}/vat/{pid}.angle.json','w'),separators=(',',':'));print('vat',pid,n,TA,at.size,sz//1024,'KB')
for z,sid in PK:
    vj=json.load(open(f'{OUT}/vat/kenney-{sid}.json'))
    vat_angle(z,'kenney-'+sid,vj['items'])
    # nền: tái dựng đúng thứ tự như bản iso
    d=load(z);floors=[]
    for n,dd in d.items():
        for lab,im,dr in variants(n,dd):
            if isfloor(n,im):floors.append((n,dr))
    if floors:
        CYA=92;TH=312;TW=256;cols=8;rows=math.ceil(len(floors)/cols)
        at=Image.new('RGBA',(cols*TW,rows*TH),(0,0,0,0))
        for i,(n,dr) in enumerate(floors):
            im=loadA(z,n,dr);top=im.split()[3].getbbox()[1]
            at.paste(im.crop((0,top-CYA,256,top-CYA+TH)),((i%cols)*TW,(i//cols)*TH))
        url,sz=png64(at)
        pk={'id':'kenney-'+sid,'proj':'angle','tw':TW,'th':TH,'cy':CYA,'cols':cols,'n':len(floors),'atlas':url}
        json.dump(pk,open(f'{OUT}/nen/kenney-{sid}.angle.json','w'),separators=(',',':'));print('nen',sid,len(floors),at.size,sz//1024,'KB')
# bệ
d=load('bases');bj=json.load(open(f'{OUT}/vat/kenney-be.json'));vat_angle('bases','kenney-be',bj['items'])
