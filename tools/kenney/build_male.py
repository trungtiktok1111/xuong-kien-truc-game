import zipfile,io,json,base64,re
from PIL import Image
Z='/mnt/user-data/uploads/8c22ded7-kenney_isometric-miniature-dungeon.zip'
z=zipfile.ZipFile(Z)
F={}
for n in z.namelist():
    m=re.match(r'Characters/Male/Male_(\d)_(Idle|Run|Pickup)(\d+)\.png$',n)
    if m:F[(int(m[1]),m[2],int(m[3]))]=Image.open(io.BytesIO(z.read(n))).convert('RGBA')
bb=[im.getchannel('A').getbbox() for im in F.values()]
x0=min(b[0] for b in bb)-4;y0=min(b[1] for b in bb)-4;x1=max(b[2] for b in bb)+4;y1=max(b[3] for b in bb)+4
FW,FH=x1-x0,y1-y0;print('union',x0,y0,x1,y1,FW,FH)
feet=sorted(b[3] for k,b in zip(F.keys(),bb) if k[1]=='Idle')[len(bb)//42]
AX=128-x0;AY=459-y0
ST={'Idle':('idle',1,6),'Run':('run',10,12),'Pickup':('pickup',10,10)}
out={'id':'kenney-male','name':'Kenney · Male (Idle, Run, Pickup × 8 hướng)','fw':FW,'fh':FH,'ax':AX,'ay':AY,'sc':round(1.5*16/256,5),'oy':0,'map':[(c+3)%8 for c in range(8)],'st':{}}
tot=0
for act,(key,n,fps) in ST.items():
    strips=[]
    for d in range(8):
        S=Image.new('RGBA',(FW*n,FH),(0,0,0,0))
        for f in range(n):S.paste(F[(d,act,f)].crop((x0,y0,x1,y1)),(f*FW,0))
        b=io.BytesIO();S.save(b,'PNG',optimize=True);tot+=len(b.getvalue());strips.append('data:image/png;base64,'+base64.b64encode(b.getvalue()).decode())
    out['st'][key]={'n':n,'fps':fps,'strips':strips}
json.dump(out,open('/home/claude/ed/anim/kenney-male.json','w'),separators=(',',':'));print(tot//1024,'KB')
