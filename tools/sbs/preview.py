import sys,json,zipfile,io
from PIL import Image,ImageDraw
def comp(zp,keys,scale=1,cols=4):
    z=zipfile.ZipFile(zp);m=json.loads(z.read('pack.json'));pr=m['projection'];W,H=pr['canvas'];ax,ay=pr['anchor'];TW,TH=pr['tile']
    tiles=[]
    for k in keys:
        a=m['assets'][k];im=Image.open(io.BytesIO(z.read(a['png']))).convert('RGBA');c=Image.new('RGBA',(W,H),(60,80,90,255))
        d=ImageDraw.Draw(c);d.polygon([(ax,ay-TH/2),(ax+TW/2,ay),(ax,ay+TH/2),(ax-TW/2,ay)],outline=(255,255,0,255),fill=(90,110,120,255))
        # cạnh Đông (dưới-trái) tô đỏ
        d.line([(ax-TW/2,ay),(ax,ay+TH/2)],fill=(255,60,60,255),width=2)
        c.alpha_composite(im,tuple(a['at']) if 'at' in a else (0,0));d=ImageDraw.Draw(c);d.text((3,3),k[-22:],fill=(255,255,255,255))
        d.ellipse([ax-2,ay-2,ax+2,ay+2],fill=(0,255,0,255));tiles.append(c.resize((int(W*scale),int(H*scale)),Image.NEAREST))
    rows=(len(tiles)+cols-1)//cols;w=max(t.width for t in tiles);h=max(t.height for t in tiles);o=Image.new('RGBA',(w*cols,h*rows),(0,0,0,255))
    for i,t in enumerate(tiles):o.paste(t,((i%cols)*w,(i//cols)*h))
    return o
if __name__=='__main__':
    zp,out=sys.argv[1],sys.argv[2];keys=sys.argv[3:];comp(zp,keys,1.5 if 'large' not in zp else 1).save(out)
