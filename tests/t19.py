from playwright.sync_api import sync_playwright
import json
RULES=[{"id":"r1","on":{"t":"kill","ref":"any"},"if":[],"do":[{"a":"add","k":"diem","v":1}],"once":False},
 {"id":"r2","on":{"t":"allkill"},"if":[],"do":[{"a":"say","text":"Đích mở! diem={diem}"},{"a":"show","ref":"G"}],"once":True}]
VARS=[{"k":"diem","v":0,"hud":True},{"k":"qua","v":0,"hud":True}]
DLG={"start":"n1","nodes":[{"id":"n1","text":"Chào! Bạn có {diem} điểm.","ch":[{"t":"Nhận quà","next":"n2","if":[],"do":[{"a":"add","k":"qua","v":1}]},{"t":"Thôi","next":"","if":[],"do":[]},{"t":"Chỉ khi diem>=5","next":"","if":[{"k":"diem","op":">=","v":5}],"do":[]}]},{"id":"n2","text":"Cảm ơn nhé!","ch":[]}]}
def ents2(sx,sy):
    return [{"id":"S","t":"start","x":sx,"y":sy},{"id":"E","t":"enemy","x":sx,"y":sy+1,"hp":1,"dmg":0,"spd":1,"chase":1,"ai":"still","name":"Quái"},
            {"id":"N","t":"npc","x":sx+3,"y":sy,"name":"Lão","text":"hi","dlg":DLG},{"id":"G","t":"goal","x":sx-3,"y":sy,"hid":True}]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    # --- UI tab Logic (2D) render + mẫu
    pg.evaluate("[...document.querySelectorAll('.ptab')].find(b=>b.textContent.includes('Logic')).click()");pg.wait_for_timeout(200)
    print('2D logic tab:',pg.evaluate("document.querySelector('#pn2').innerText.slice(0,120)").replace('\n',' | '))
    g=pg.evaluate("window.__e2.gameData()");W,H,blk=g['w'],g['h'],g['blk']
    pos=None
    for y in range(1,H-2):
        for x in range(4,W-4):
            if all(not blk[y*W+xx] for xx in range(x-3,x+4)) and not blk[(y+1)*W+x]: pos=(x,y);break
        if pos:break
    print('pos',pos)
    G2=dict(g);G2['ents']=ents2(*pos);G2['cfg']=dict(g['cfg'],rules=RULES,vars=VARS)
    pg2=b.new_page(viewport={'width':390,'height':800});pg2.on('pageerror',lambda e:errs.append('P2 '+str(e)))
    pg2.add_init_script("window.__GAME="+json.dumps(G2))
    pg2.goto('file:///home/claude/ed/index.html');pg2.wait_for_timeout(1800)
    pg2.keyboard.press('j');pg2.wait_for_timeout(300)
    print('2D sau diệt:',repr(pg2.evaluate("document.body.innerText")[:120]))
    pg2.keyboard.down('d');pg2.wait_for_timeout(450);pg2.keyboard.up('d');pg2.keyboard.press('j');pg2.wait_for_timeout(300)
    print('2D hội thoại:',repr(pg2.evaluate("(document.querySelector('.dlgbox')||{innerText:'KHÔNG CÓ'}).innerText")))
    pg2.screenshot(path='d1.png')
    pg2.evaluate("[...document.querySelectorAll('.dlgbox div')].find(d=>d.textContent.includes('Nhận quà')).click()");pg2.wait_for_timeout(200)
    print('2D nhánh 2:',repr(pg2.evaluate("document.querySelector('.dlgbox').innerText")))
    pg2.evaluate("[...document.querySelectorAll('.dlgbox div')].find(d=>d.textContent.includes('Tiếp tục')).click()");pg2.wait_for_timeout(200)
    print('2D đóng hộp:',pg2.evaluate("!!document.querySelector('.dlgbox')"),'| HUD:',repr(pg2.evaluate("document.body.innerText").split('\n')[:4]))
    pg2.keyboard.down('a');pg2.wait_for_timeout(1300);pg2.keyboard.up('a');pg2.wait_for_timeout(300)
    print('2D kết:',repr(pg2.evaluate("document.body.innerText")[:80]))
    # ---- 3D
    vox=[[f"{x},0,{z}","cube",0,0] for x in range(24) for z in range(24)]
    e3=[{"id":"S","t":"start","x":10,"y":1,"z":10},{"id":"E","t":"enemy","x":10,"y":1,"z":11,"hp":1,"dmg":0,"spd":1,"chase":1,"ai":"still","name":"Quái","col":"#d94b4b"},
        {"id":"N","t":"npc","x":13,"y":1,"z":10,"name":"Lão","text":"hi","col":"#4f8fe0","dlg":DLG},{"id":"G","t":"goal","x":7,"y":1,"z":10,"hid":True}]
    G3={"kind":"3d","voxels":vox,"ents":e3,"cfg":{"hp":5,"spd":4.2,"jump":7.5,"dmg":1,"rng":2.2,"win":"auto","rules":RULES,"vars":VARS},"cmats":[]}
    pg3=b.new_page(viewport={'width':390,'height':800});pg3.on('pageerror',lambda e:errs.append('P3 '+str(e)))
    pg3.add_init_script("window.__GAME="+json.dumps(G3))
    pg3.goto('file:///home/claude/ed/index.html');pg3.wait_for_timeout(2500)
    pg3.keyboard.press('f');pg3.wait_for_timeout(300)
    print('3D sau diệt:',repr(pg3.evaluate("document.body.innerText")[:140]))
    pg3.keyboard.down('d');pg3.wait_for_timeout(500);pg3.keyboard.up('d');pg3.keyboard.press('f');pg3.wait_for_timeout(300)
    print('3D hội thoại:',repr(pg3.evaluate("(document.querySelector('.dlgbox')||{innerText:'KHÔNG CÓ'}).innerText")))
    pg3.screenshot(path='d2.png')
    pg3.evaluate("[...document.querySelectorAll('.dlgbox div')].find(d=>d.textContent.includes('Nhận quà')).click()");pg3.wait_for_timeout(200)
    pg3.evaluate("[...document.querySelectorAll('.dlgbox div')].find(d=>d.textContent.includes('Tiếp tục')).click()");pg3.wait_for_timeout(200)
    pg3.keyboard.down('a');pg3.wait_for_timeout(1700);pg3.keyboard.up('a');pg3.wait_for_timeout(300)
    print('3D kết:',repr(pg3.evaluate("document.body.innerText")[:90]))
    print(errs)
