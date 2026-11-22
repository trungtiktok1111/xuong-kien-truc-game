import json,math,random
random.seed(5)
GX,GZ=48,48
vox={}
props=[];_i=[0]
def P(m,x,z,ry=0,s=1,y=1,solid=1,pk='fantasy-town-kit'):
    _i[0]+=1;props.append({'id':'t%d'%_i[0],'m':pk+'/'+m,'x':x,'y':y,'z':z,'ry':ry,'s':s,'solid':solid,'name':m})
E,W_,N,S_=0,math.pi,math.pi/2,-math.pi/2   # hướng +x, -x, -z(bắc), +z(nam)
def V(x,z,m,y=0):vox[(x,y,z)]=m
GR,ST,SD,WT=9,2,11,12
for x in range(48):
    for z in range(40):V(x,z,GR)
for x in range(4,44):
    for z in range(7,29):V(x,z,ST)
# đường cát: trục giữa + vành đài + elip
for x in range(22,26):
    for z in range(0,40):V(x,z,SD)
for x in range(0,48):
    for z in range(30,32):pass
for x in range(48):
    for z in range(40):
        d=math.hypot((x-24)/1.0,(z-17.5)/0.9)
        if 6.0<=d<=8.0:V(x,z,SD)
        for cx in (13,35):
            e=math.hypot((x-cx)/10.5,(z-17.5)/7.5)
            if 0.8<=e<=1.0 and 7<=z<=28:V(x,z,SD)
# nước góc phải trên + ao trái trên
for x in range(38,48):
    for z in range(0,8):V(x,z,WT)
for x in range(0,6):
    for z in range(0,5):V(x,z,WT)
# ===== tường thành + cổng (castle-kit) =====
for x in range(0,48):
    if 20<=x<=27:continue
    P('wall',x+.5,31.5,0,1,1,1,'castle-kit')
for x in (20,27):
    P('tower-square',x+.5,31.5,0,1,1,1,'castle-kit');P('tower-square-roof',x+.5,31.5,0,1,2.31,1,'castle-kit')
for x in range(21,27):
    P('roof-flat',x+.5,31.5,0,1,2.31,0)
for x in (21,26):
    P('pillar-stone',x+.5,31.5,0,1.6,1,1)
P('banner-red',20.5,32.1,S_,1.2,1.2,0);P('banner-red',27.5,32.1,S_,1.2,1.2,0)
# ===== nhà (ghép từ tường + mái) =====
def house(x0,z0,w,d,door='S',floors=1,wall='wall-wood',roof='roof-gable',rr=0):
    for i in range(w):
        for j in range(d):
            x=x0+i+.5;z=z0+j+.5
            for f in range(floors):
                y=1+f
                if i==w-1:P(wall if not(door=='E' and j==d//2 and f==0) else 'wall-wood-door',x,z,E,1,y)
                if i==0:P(wall if not(door=='W' and j==d//2 and f==0) else 'wall-wood-door',x,z,W_,1,y)
                if j==0:P(wall if not(door=='N' and i==w//2 and f==0) else 'wall-wood-door',x,z,N,1,y)
                if j==d-1:P(wall if not(door=='S' and i==w//2 and f==0) else 'wall-wood-door',x,z,S_,1,y)
            # mái: dốc 2 phía theo trục x (nóc dọc z)
    for k in range(w//d):
        P(roof,x0+k*d+d/2,z0+d/2,0,d*0.98,1+floors,0)
def hall():
    x0,z0,w,d=14,1,20,4
    pass
house(14,1,20,4,'S',2);house(5,8,4,4,'S',1);house(38,8,4,4,'S',1);house(3,20,4,4,'E',1);house(41,20,4,4,'W',1)
for x in range(23,26):P('stairs-wide-stone',x+.0,5.5,S_,1,1)
P('banner-red',18.5,5.2,S_,1.5,1.3,0);P('banner-red',29.5,5.2,S_,1.5,1.3,0);P('banner-green',24,5.2,S_,1.5,1.3,0)
# đài phun nước
P('fountain-round',24,17.5,0,1.6,1,1)
# sạp
for k,(x,z) in enumerate([(9,15),(12,15),(9,19),(12,19),(35,15),(38,15),(35,19),(38,19),(16,10),(32,10)]):
    P('stall-red' if k%2==0 else 'stall-green',x+.5,z+.5,S_ if x<24 else N,1,1,1)
# đèn lồng
for (x,z) in [(20,9),(28,9),(20,14),(28,14),(20,21),(28,21),(20,26),(28,26)]:P('lantern',x+.5,z+.5,0,1,1,1)
# cây
fall=['tree_default_fall','tree_oak_fall','tree_fat_fall','tree_tall_fall']
for (x,z) in [(7,14),(16,13),(32,13),(41,14),(7,25),(17,25),(31,25),(42,26),(3,31),(10,34),(18,35),(30,35),(38,34),(45,33),(2,8),(45,12),(15,7),(33,7)]:
    P(random.choice(['tree','tree-high','tree-crooked','tree-high-round']),x+.5,z+.5,random.random()*6,1,1,1)
# hoa/bụi quanh đài phun nước
for k in range(24):
    a=k/24*math.tau;P(random.choice(['flower_redA','flower_yellowA','flower_purpleA','plant_bush']),24+3.2*math.cos(a),17.5+2.9*math.sin(a),0,1.2,1,0,'nature-kit')
# bến tàu + thuyền
P('structure-platform-dock',37,6,0,1.0,1,1,'pirate-kit');P('structure-platform-dock',34.5,6,0,1.0,1,1,'pirate-kit')
P('ship-medium',44,3.5,0,.3,1,1,'pirate-kit');P('boat-row-large',41,6.5,0.5,.6,1,0,'pirate-kit')
# cầu đá + thác nước góc trái
P('bridge_stone',7.5,3,0,2,1,1,'nature-kit')
P('cart',17,23,0.4,1.2,1,1);P('cart',31,22,2.4,1.2,1,1)
# hàng rào / hàng dậu quanh vườn
for x in range(16,22):P('hedge',x+.5,24.5,E,1,1,1)
for x in range(27,33):P('hedge',x+.5,24.5,E,1,1,1)
voxels=[[x,y,z,0,m,0] for (x,y,z),m in vox.items()]
json.dump({'format':'thk-voxel-1','ents':[],'cfg':{},'props':props,'grid':[GX,24,GZ],'shapes':[],'materials':[],'voxels':voxels},open('town3d.json','w'))
print(len(voxels),len(props))
