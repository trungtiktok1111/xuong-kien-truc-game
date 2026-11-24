"""Công cụ dùng chung để đổi gói SBS (Screaming Brain Studios) / Free Sample sang xuong-pack-1."""
import os,io,json,zipfile,re
from PIL import Image
import numpy as np
def load_keyed(path):
    im=Image.open(path).convert('RGBA');a=np.array(im)
    key=(a[...,0]>=250)&(a[...,1]<=6)&(a[...,2]>=250)
    if key.any():a[key]=(0,0,0,0)
    return Image.fromarray(a)
def bbox(im,th=8):
    a=np.array(im)[...,3]>th
    if not a.any():return None
    ys,xs=np.where(a);return (int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1)
def slice_grid(im,tw,th):
    out=[]
    for r in range(im.height//th):
        for c in range(im.width//tw):
            t=im.crop((c*tw,r*th,(c+1)*tw,(r+1)*th))
            if bbox(t):out.append((r,c,t))
    return out
def slope(t):
    """'\\' nếu mép trên bên trái cao hơn bên phải, '/' nếu ngược lại (mặt tường phẳng 1 cạnh)"""
    a=np.array(t)[...,3]>8;w=t.width
    def top(x):
        ys=np.where(a[:,x])[0];return ys.min() if len(ys) else None
    l=[top(x) for x in range(0,6)];r=[top(x) for x in range(w-6,w)]
    l=[v for v in l if v is not None];r=[v for v in r if v is not None]
    if not l or not r:return '?'
    return '\\' if np.mean(l)<np.mean(r) else '/'
