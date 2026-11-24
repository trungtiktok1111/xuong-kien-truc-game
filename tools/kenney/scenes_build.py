import json,random,sys
ED='/home/claude/ed'
man=json.load(open(ED+'/man1.json'))
PH=man['sheets'][:4]
def L(p):return json.load(open(f'{ED}/{p}.json'))
class Scene:
    def __init__(s,name,W,H,seed=1):
        s.name=name;s.W=W;s.H=H;s.sheets=list(PH);s.ents=[];s.l0=[0]*(W*H);s.nid=0;s.rnd=random.Random(seed);s.vat={};s.nen={}
    def addnen(s,pid):
        pk=L('nen/'+pid);sid=len(s.sheets);s.sheets.append({'pack':'nen:'+pid,'name':'Nen-'+pid,'url':pk['atlas'],'tw':pk['tw'],'margin':0,'iso':2,'cy':pk['cy'],'wat':[]});s.nen[pid]=(sid,pk['idx']);return sid
    def addvat(s,pid):
        pk=L('vat/'+pid);sid=len(s.sheets);s.sheets.append({'pack':'vat:'+pid,'name':'Vat-'+pid,'url':pk['atlas'],'tw':pk['T'],'margin':0});s.vat[pid]=(sid,pk['items']);return sid
    def floor(s,pid,key,x,y):
        sid,idx=s.nen[pid];s.l0[y*s.W+x]=((sid*4096+idx[key])*8)+1
    def item(s,pid,k,d=None):
        sid,items=s.vat[pid]
        for it in items:
            if it['k']==k and (d is None or it['d']==d or it['d']=='S' and False):return sid,it
        # biến thể đối xứng chỉ có một hướng: lấy mục đầu theo k
        for it in items:
            if it['k']==k:return sid,it
        raise KeyError((pid,k,d))
    def put(s,pid,k,d,x,y):
        sid,it=s.item(pid,k,d);s.nid+=1
        s.ents.append({'id':'k%d'%s.nid,'t':'deco','x':x,'y':y,'f':1,'fx':it['fx'],'fy':it['fy'],'sc':it['sc'],'ox':0,'oy':it.get('oy',0),'flat':it['role']=='Phủ nền','name':it['name'],'tile':{'sid':sid,'idx':it['i']},'zb':it['zb']}|({'walk':True} if it['role']=='Phủ nền' else {}))
    def start(s,x,y):s.ents.append({'id':'s0','t':'start','x':x,'y':y,'name':'Xuất phát','tile':None})
    def save(s,fn):
        N=s.W*s.H
        o={'format':'thk-map-1','cell':16,'w':s.W,'h':s.H,'layerNames':man['layerNames'],'layers':[s.l0,[0]*N,[0]*N,[0]*N],'collision':[0]*N,'ents':s.ents,
           'cfg':{'hp':6,'spd':4.2,'dmg':1,'rng':1.5,'hero':{'sid':2,'idx':0},'win':'auto','view':'iso'},'sheets':s.sheets,'tags':{'sheets':{},'tiles':{},'fav':[],'recent':[]},'note':'Cảnh dựng từ gói Kenney (CC0)'}
        t=dict(o);t.pop('tags');t['name']=s.name;t['sheets']=[x if i<4 else {'pack':x['pack']} for i,x in enumerate(s.sheets)]
        json.dump(t,open(fn,'w'),ensure_ascii=False,separators=(',',':'));print(fn,round(len(open(fn).read())/1e3),'KB',len(s.ents),'vật')

def dia_lao():
    sc=Scene('Địa lao',22,22,3);N='kenney-dia-lao';sc.addnen(N);sc.addvat(N)
    x0,y0,x1,y1=5,5,16,13
    for y in range(y0,y1+1):
        for x in range(x0,x1+1):
            r=sc.rnd.random()
            k=sc.rnd.choice(['stone-nam','stone-đông','stone-bắc','stone-tây']) if r<.97 else 'stonetile-nam'
            sc.floor(N,k,x,y)
    for y in range(8,12):
        for x in range(9,13):sc.floor(N,'dirt-nam',x,y) if sc.rnd.random()<.4 else None
    sc.put(N,'stoneWallCorner','S',x0,y0)
    top=['stoneWall','stoneWallWindow','stoneWallAged','stoneWall','stoneWallArchway','stoneWall','stoneWallDoorBars','stoneWallBroken','stoneWallWindowBars','stoneWall','stoneWallAged']
    for i,x in enumerate(range(x0+1,x1+1)):sc.put(N,top[i%len(top)],'S',x,y0)
    left=['stoneWall','stoneWallAged','stoneWallDoor','stoneWallBroken','stoneWall','stoneWallWindowBars','stoneWall','stoneWallAged']
    for i,y in enumerate(range(y0+1,y1+1)):sc.put(N,left[i%len(left)],'E',x0,y)
    sc.put(N,'stoneColumn',None,x1,y0);sc.put(N,'stoneColumn',None,x0,y1);sc.put(N,'stoneColumn',None,x1,y1)
    sc.put(N,'barrelsStacked',None,6,6);sc.put(N,'barrels',None,7,6);sc.put(N,'barrel',None,6,7)
    sc.put(N,'chestClosed','S',15,6);sc.put(N,'woodenCrates',None,14,6);sc.put(N,'woodenCrate',None,15,7)
    sc.put(N,'tableRoundChairs',None,10,10);sc.put(N,'chair','S',8,10)
    sc.put(N,'woodenPile',None,6,12);sc.put(N,'chestOpen','S',15,12)
    sc.start(10,12);return sc

def nong_trai():
    sc=Scene('Nông trại',24,24,5);F='kenney-nong-trai';G='kenney-co';sc.addnen(G);sc.addnen(F);sc.addvat(F)
    for y in range(24):
        for x in range(24):sc.floor(G,sc.rnd.choice(['grass-nam','grass-đông','grass-bắc','grass-tây']),x,y)
    # ruộng
    for y in range(11,17):
        for x in range(4,10):sc.floor(F,'dirtfarmland-nam',x,y)
    for y in range(12,16):
        for x in range(5,9):
            if (x+y)%2==0:sc.put(F,sc.rnd.choice(['corn','cornYoung','cornDouble']),None,x,y)
    # hàng rào quanh ruộng (chừa cổng ở mép tây-nam)
    for x in range(4,10):sc.put(F,'fenceLow','S',x,10)
    for y in range(11,17):sc.put(F,'fenceLow','E',3,y)
    for x in range(4,10):sc.put(F,'fenceLow','N',x,16)
    for y in range(11,17):
        if y not in(13,14):sc.put(F,'fenceLow','W',9,y)
    # nhà kho gỗ
    x0,y0,x1,y1=13,6,18,10
    for y in range(y0,y1+1):
        for x in range(x0,x1+1):sc.floor(F,'planks-nam',x,y)
    sc.put(F,'woodWallCorner','S',x0,y0)
    for i,x in enumerate(range(x0+1,x1+1)):sc.put(F,['woodWall','woodWallWindow','woodWallDoorway','woodWall','woodWallWindowGlass'][i%5],'S',x,y0)
    for i,y in enumerate(range(y0+1,y1+1)):sc.put(F,['woodWall','woodWallWindow','woodWall','woodWallGateway'][i%4],'E',x0,y)
    sc.put(F,'chimneyBase',None,x1,y0+1)
    sc.put(F,'hayBalesStacked',None,16,8);sc.put(F,'sacksCrate',None,15,7);sc.put(F,'sack',None,14,9);sc.put(F,'hayBales',None,17,9)
    sc.put(F,'ladderStand','S',14,6)
    sc.put(F,'hay',None,12,12);sc.put(F,'hayBales',None,12,13);sc.put(F,'sack',None,14,13)
    sc.start(11,14);return sc

def thu_vien():
    sc=Scene('Thư viện',22,22,7);D='kenney-dia-lao';V='kenney-thu-vien';sc.addnen(D);sc.addvat(V)
    x0,y0,x1,y1=5,5,16,13
    for y in range(y0,y1+1):
        for x in range(x0,x1+1):sc.floor(D,'planks-nam',x,y)
    sc.put(V,'wallBooks','S',x0,y0)
    for i,x in enumerate(range(x0+1,x1+1)):
        sc.put(V,'wallDoorway' if x==12 else ['wallBooks','bookcaseBooks','wallBooks','bookcaseBooksLadder'][i%4],'S',x,y0)
    for i,y in enumerate(range(y0+1,y1+1)):
        sc.put(V,['wallBooks','bookcaseBooks','bookcaseEmpty','wallBooks'][i%4],'E',x0,y)
    for x in (7,9,14):sc.put(V,'bookcaseHalfBooks','N',x,y1)
    for x,y in((6,8),(6,10)):pass
    sc.put(V,'floorCarpet',None,9,8);sc.put(V,'floorCarpet',None,10,8);sc.put(V,'floorCarpet',None,9,9);sc.put(V,'floorCarpet',None,10,9)
    sc.put(V,'longTableDecoratedChairs',None,11,10);sc.put(V,'longTableChairs',None,8,11)
    sc.put(V,'candleStand',None,7,6);sc.put(V,'candleStandDouble',None,15,6)
    sc.put(V,'displayCaseSword',None,15,9);sc.put(V,'displayCaseBooks',None,15,11)
    sc.put(V,'libraryChair',None,13,12);sc.put(V,'bookStand',None,12,7)
    sc.start(10,12);return sc

if __name__=='__main__':
    dia_lao().save('/home/claude/ed/scene/dia-lao.json');nong_trai().save('/home/claude/ed/scene/nong-trai.json');thu_vien().save('/home/claude/ed/scene/thu-vien.json')
