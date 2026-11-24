import json,io,base64,numpy as np
from PIL import Image
exec(open('build_packs.py').read().split("os.makedirs(OUT")[0])
d=load('farm');fl=[]
for dr in 'SENW':
    im=d['dirt'][dr].copy();a=np.asarray(im).astype(np.float32)/255
    hsv=np.asarray(Image.fromarray((a[...,:3]*255).astype('uint8')).convert('HSV')).astype(np.float32)
    hsv[...,0]=(hsv[...,0]*0+ (108/360*255) + (hsv[...,0]-hsv[...,0].mean())*0.3)%255
    hsv[...,1]=np.clip(hsv[...,1]*1.25+30,0,255);hsv[...,2]=np.clip(hsv[...,2]*0.78,0,255)
    rgb=np.asarray(Image.fromarray(hsv.astype('uint8'),'HSV').convert('RGB'))
    out=np.dstack([rgb,(a[...,3]*255).astype('uint8')]);fl.append(('Cỏ · '+DIRN[dr],'grass',Image.fromarray(out,'RGBA')))
pk,sz,thumb,size=nenpack('kenney-co','Kenney · Cỏ (đổi màu từ đất)','nền cỏ làm từ ô đất, đổi màu',fl,'grass','grass')
json.dump(pk,open(OUT+'/nen/kenney-co.json','w'),ensure_ascii=False,separators=(',',':'))
addindex(OUT+'/nen/index.json',{'id':'kenney-co','name':'Kenney · Cỏ (đổi màu từ đất)','desc':'nền cỏ làm từ ô đất, đổi màu','n':4,'kb':sz//1024,'thumb':thumb})
print(pk['idx'],sz//1024)
fl[0][2].crop((0,60,256,300)).save('/tmp/grass.png')
