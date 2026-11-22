import zipfile,json,struct,glob,os,re
bad={}
for z in sorted(glob.glob('/tmp/k3d/all/*.zip')):
    zf=zipfile.ZipFile(z);names=zf.namelist()
    pngs={os.path.basename(n).lower() for n in names if re.search(r'\.(png|jpe?g)$',n,re.I)}
    miss=0;tot=0;noimg=0;embedded=0
    for n in names:
        if n.lower().endswith('.glb'):
            d=zf.read(n);L=struct.unpack('<I',d[12:16])[0];j=json.loads(d[20:20+L])
            tot+=1
            ims=j.get('images',[])
            if not ims: noimg+=1;continue
            for im in ims:
                if 'uri' in im:
                    if os.path.basename(im['uri']).lower() not in pngs: miss+=1
                else: embedded+=1
    if tot: print(os.path.basename(z)[:40],tot,'noimg',noimg,'miss',miss,'emb',embedded)
