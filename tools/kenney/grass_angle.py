import json,io,base64,numpy as np,sys,math
sys.argv=[sys.argv[0]]
exec(open('build_packs.py').read().split("T=296;ANCH=512")[0])
OUT='/home/claude/ed'
fl=[]
for dr in 'SENW':
    im=Image.open(f'{R}/farm/Angle/dirt_{dr}.png').convert('RGBA');a=np.asarray(im).astype(np.float32)/255
    hsv=np.asarray(Image.fromarray((a[...,:3]*255).astype('uint8')).convert('HSV')).astype(np.float32)
    hsv[...,0]=(hsv[...,0]*0+(108/360*255)+(hsv[...,0]-hsv[...,0].mean())*0.3)%255
    hsv[...,1]=np.clip(hsv[...,1]*1.25+30,0,255);hsv[...,2]=np.clip(hsv[...,2]*0.78,0,255)
    rgb=np.asarray(Image.fromarray(hsv.astype('uint8'),'HSV').convert('RGB'))
    fl.append(Image.fromarray(np.dstack([rgb,(a[...,3]*255).astype('uint8')]),'RGBA'))
CYA=92;TH=312;TW=256;cols=8
at=Image.new('RGBA',(cols*TW,1*TH),(0,0,0,0))
for i,im in enumerate(fl):
    top=im.split()[3].getbbox()[1];at.paste(im.crop((0,top-CYA,256,top-CYA+TH)),((i%cols)*TW,0))
url,sz=png64(at)
json.dump({'id':'kenney-co','proj':'angle','tw':TW,'th':TH,'cy':CYA,'cols':cols,'n':4,'atlas':url},open(f'{OUT}/nen/kenney-co.angle.json','w'),separators=(',',':'));print(sz//1024,'KB')
