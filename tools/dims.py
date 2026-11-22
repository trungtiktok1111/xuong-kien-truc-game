import zipfile,json,struct,os,sys
def bbox(d):
    L=struct.unpack('<I',d[12:16])[0];j=json.loads(d[20:20+L])
    import itertools
    mn=[1e9]*3;mx=[-1e9]*3
    # apply node transforms (translation/scale only)
    def walk(ni,T,S):
        n=j['nodes'][ni];t=n.get('translation',[0,0,0]);s=n.get('scale',[1,1,1])
        T2=[T[i]+S[i]*t[i] for i in range(3)];S2=[S[i]*s[i] for i in range(3)]
        if 'mesh' in n:
            for pr in j['meshes'][n['mesh']]['primitives']:
                a=j['accessors'][pr['attributes']['POSITION']]
                for i in range(3):
                    lo=T2[i]+min(a['min'][i]*S2[i],a['max'][i]*S2[i]);hi=T2[i]+max(a['min'][i]*S2[i],a['max'][i]*S2[i])
                    mn[i]=min(mn[i],lo);mx[i]=max(mx[i],hi)
        for c in n.get('children',[]):walk(c,T2,S2)
    for r in j['scenes'][0]['nodes']:walk(r,[0,0,0],[1,1,1])
    return mn,mx
def pack(zname):
    zf=zipfile.ZipFile('/tmp/k3d/all/'+zname+'.zip');out={}
    for n in zf.namelist():
        if n.lower().endswith('.glb'):
            b=os.path.basename(n)[:-4]
            if b not in out:out[b]=bbox(zf.read(n))
    return out
if __name__=='__main__':
    P=pack(sys.argv[1])
    for k in sys.argv[2:]:
        mn,mx=P[k];print(k,[round(x,2) for x in mn],[round(x,2) for x in mx])
