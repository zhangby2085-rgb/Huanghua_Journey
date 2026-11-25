r"""把演示视频要用的游戏片段一个一个录下来 → dev/video/raw/<片段>/

  python dev/video/record_all.py            全部
  python dev/video/record_all.py brush fold  只录这几个

要先开预览服务器（launch.json 里的 huanghua，端口 8807）。答题、点按钮交给 kid_demo.js，
画布上的小游戏在这里用真实触摸来做。
"""
import json
import math
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rec  # noqa: E402
from rec import line  # noqa: E402


def c_home(r):
    r.go('', kid=False)
    r.start('home')
    time.sleep(1.6)
    for i in (4, 3, 5, 1):
        p = r.rect('.troupe img', i)
        if p:
            r.tap(p[0], p[1] - 40)
        time.sleep(.6)
    time.sleep(2.2)
    r.stop()


def c_lib(r):
    """第四站：走进图书馆、对话气泡、拼音卡片、点大声说话的小伙伴、开花瓣"""
    r.go('?play=s4a')
    r.start('lib')
    r.until('!!document.querySelector(".bigflower")', 150)
    time.sleep(4.5)
    r.stop()


def c_wash(r):
    """第三站：拦住灰灰，先洗手，搓搓小爪子"""
    r.go('?play=s3a')
    r.start('wash')
    r.until('!!(HH.L.curWash && HH.L.curWash.st.active)', 150)
    ps = json.loads(r.ev('JSON.stringify(HH.L.curWash.P())'))
    t0, n = time.time(), 0
    while r.ev('HH.L.curWash.st.active') and time.time() - t0 < 40:
        q = ps[n % 2]
        s = q['s']
        n += 1
        r.swipe([(q['x'] + s * .3 * math.cos(k * .7), q['y'] + s * .25 * math.sin(k * 1.3)) for k in range(24)], .012)
    time.sleep(6)
    r.stop()


def c_rice(r):
    """第三站：盛饭盛到线、吃光、捡起掉的米粒"""
    r.go('?play=s3c')
    r.ev('__kid.acts=false')
    r.start('rice')
    r.until("!!document.querySelector('.acts .act.green') && !!HH.L.curRice", 150)
    time.sleep(1)
    b = r.rect('.acts .act.green')
    r.touch('touchStart', [b])
    r.until('HH.L.curRice.fill >= HH.L.curRice.line - .02', 10)
    r.touch('touchEnd', [])
    r.ev('__kid.acts=true')
    r.until("HH.L.curRice.phase==='eat'", 30)
    time.sleep(1.5)
    bw = json.loads(r.ev('JSON.stringify((()=>{const b=HH.L.curRice.bowl(); return {x:b.x, y:b.y-b.w*.3}})())'))
    for _ in range(14):
        if not r.ev("HH.L.curRice.phase==='eat'"):
            break
        r.tap(bw['x'], bw['y'])
        time.sleep(.4)
    r.until("HH.L.curRice.phase==='pick'", 20)
    time.sleep(1.2)
    for gr in json.loads(r.ev('JSON.stringify(HH.L.curRice.grains.map(g=>({x:g.x,y:g.y})))')):
        r.tap(gr['x'], gr['y'])
        time.sleep(.35)
    time.sleep(4)
    r.stop()


def c_drop(r):
    """第六站：太阳晒、小水滴飘上天、推白云、下雨变小河"""
    r.go('?play=s6b')
    r.start('drop')
    r.until('HH.L.gd.clouds.length===3 && !!HH.E.capture', 120)
    time.sleep(1.2)
    for i in range(3):
        c = json.loads(r.ev('JSON.stringify(HH.L.gd.clouds[%d])' % i))
        a, b = r.world(c['x'], c['y']), r.world(870, 120)
        r.swipe(line(a[0], a[1], b[0], b[1], 22), .03)
        time.sleep(.6)
    r.until('HH.L.gd.stream>=1', 90)
    time.sleep(6)
    r.stop()


def c_wake(r):
    """第七站：闹钟响，点黄花起床，牙疼，牙牙出来喊救命"""
    r.go('?play=s7a')
    r.start('wake')
    r.until('!!HH.E.actors.ya', 120)
    time.sleep(14)
    r.stop()


def c_brush(r):
    """第七站：挤牙膏（按住）、刷牙（跟着箭头）、牙齿里面左右刷、漱口"""
    r.go('?play=s7b')
    r.ev('__kid.acts=false')
    r.start('brush')
    r.until('!!document.querySelector(".wash") && !!HH.L.curHold && !HH.L.curHold.done', 60)
    time.sleep(1.4)
    b = r.rect('.acts .act')
    r.hold(b[0], b[1], 1.15)
    r.until('!document.querySelector(".wash")', 15)
    r.ev('__kid.acts=true')
    r.until('!!document.querySelector(".wash") && !!HH.L.curRub && !HH.L.curRub.done', 40)
    time.sleep(1.2)
    m = json.loads(r.ev('JSON.stringify(HH.L.mouthGeo(innerWidth, innerHeight))'))
    for _ in range(5):
        if r.ev('HH.L.curRub.done'):
            break
        for t in m['up']:
            r.swipe(line(t['x'], t['y'] - 38, t['x'], t['y'] + 38, 10), .016)
        for t in m['lo']:
            r.swipe(line(t['x'], t['y'] + 38, t['x'], t['y'] - 38, 10), .016)
    r.until('!!document.querySelector(".wash") && !!HH.L.curRub && !HH.L.curRub.done && HH.L.curRub.spots[0].dir==="side"', 40)
    time.sleep(1.2)
    for _ in range(6):
        if r.ev('HH.L.curRub.done'):
            break
        for t in (m['up'][0], m['up'][5], m['lo'][0], m['lo'][5]):
            r.swipe(line(t['x'] - 42, t['y'], t['x'] + 42, t['y'], 8) + line(t['x'] + 42, t['y'], t['x'] - 42, t['y'], 8)[1:], .016)
    r.until('!!document.querySelector(".bigflower")', 60)
    time.sleep(3.5)
    r.stop()


def c_market(r):
    """第八站：照着拼音清单买东西"""
    r.go('?play=s8a')
    r.start('market')
    r.until('!!HH.E.actors.hu', 120)
    time.sleep(5)
    r.stop()


def c_pay(r):
    """第八站：数硬币付三元、选环保袋"""
    r.go('?play=s8c')
    r.start('pay')
    r.until('!!HH.E.props.find(p=>p.id==="bag")', 150)
    time.sleep(4)
    r.stop()


def c_balloon(r):
    """第九站：害怕的时候吹气球深呼吸"""
    r.go('?play=s9a')
    r.ev('__kid.acts=false')
    r.start('balloon')
    r.until('!!document.querySelector(".wash") && !!HH.L.curHold && !HH.L.curHold.done', 90)
    time.sleep(1.2)
    for _ in range(3):
        b = r.rect('.acts .act')
        if not b:
            break
        r.hold(b[0], b[1], 1.7)
        time.sleep(1.6)
    r.ev('__kid.acts=true')
    time.sleep(4)
    r.stop()


def c_dentist(r):
    """第九站：张大嘴，点蛀虫小怪"""
    r.go('?play=s9b')
    r.start('dentist')
    r.until('!!document.querySelector(".wash") && !!HH.L.curWhack && !HH.L.curWhack.done', 90)
    t0 = time.time()
    while not r.ev('HH.L.curWhack.done') and time.time() - t0 < 40:
        ms = r.ev('JSON.stringify(HH.L.curWhack.mons.filter(m=>!m.dead && m.t>.5).map(m=>[m.x*innerWidth, m.y*innerHeight]))')
        for x, y in json.loads(ms or '[]')[:1]:
            r.tap(x, y)
            time.sleep(.5)
        time.sleep(.25)
    time.sleep(8)
    r.stop()


def c_street(r):
    """第十站：红灯停绿灯行（红灯时点"走"会被提醒）、手拉手、左看右看、走斑马线"""
    r.go('?play=s10a')
    r.start('street')
    r.until("HH.S.petals.includes('banma')", 240)
    time.sleep(3)
    r.stop()


def c_bus(r):
    """第十一站：车子晃，扶好；给山羊奶奶让座"""
    r.go('?play=s11b')
    r.start('bus')
    r.until("HH.S.stickers.includes('q_seat')", 200)
    time.sleep(2)
    r.stop()


def c_park(r):
    """第十二站：追蝴蝶走丢了，站在原地找警察"""
    r.go('?play=s12b')
    r.start('park')
    r.until("HH.S.petals.includes('yuandi')", 200)
    time.sleep(2)
    r.stop()


def c_fu(r):
    """第十三站：福字倒过来贴"""
    r.go('?play=s13b')
    r.start('fu')
    r.until("HH.S.last==='s13c'", 120)
    time.sleep(1)
    r.stop()


def c_couplet(r):
    """第十四站：贴春联"""
    r.go('?play=s14b')
    r.start('couplet')
    r.until('HH.L.lv5.fu', 150)
    time.sleep(5)
    r.stop()


def c_dumpling(r):
    """第十四站：包饺子"""
    r.go('?play=s14c')
    r.start('dumpling')
    r.until('HH.L.lv5.dishes', 120)
    time.sleep(4)
    r.stop()


def c_fire(r):
    """第十五站：站远远的看烟花，点天空放烟花，全家福"""
    r.go('?play=s15c')
    r.start('fire')
    r.until('!!document.querySelector(".wash")', 120)
    time.sleep(1.5)
    for x, y in [(380, 200), (900, 150), (640, 260), (1100, 230), (520, 120), (800, 300)]:
        r.tap(x, y)
        time.sleep(.75)
    r.until('!!document.querySelector(".polaroid")', 120)
    time.sleep(3.5)
    r.stop()


def c_fold(r):
    """第十六站：叠衣服，跟着箭头划"""
    r.go('?play=s16b')
    r.start('fold')
    r.until('!!document.querySelector(".wash")', 90)
    time.sleep(1.5)
    W, H = rec.CW, rec.CH
    cx, cy, bw, bh = W / 2, H * .5, H * .42, H * .52
    sw, top = bw * .42, cy - bh / 2
    r.swipe(line(cx - bw / 2 - sw * .9, top + bh * .2, cx + bw * .1, top + bh * .2, 14), .02)
    time.sleep(1.3)
    r.swipe(line(cx + bw / 2 + sw * .9, top + bh * .2, cx - bw * .1, top + bh * .2, 14), .02)
    time.sleep(1.3)
    r.swipe(line(cx, top + bh * .95, cx, top + bh * .3, 14), .02)
    r.until('!document.querySelector(".wash")', 15)
    time.sleep(4)
    r.stop()


def c_sort(r):
    """第十七站：垃圾分类"""
    r.go('?play=s17c')
    r.start('sort')
    r.until("HH.S.petals.includes('fenlei')", 150)
    time.sleep(2)
    r.stop()


def c_laundry(r):
    """第十八站：晾衣服，合影"""
    r.go('?play=s18c')
    r.start('laundry')
    r.until('!!document.querySelector(".polaroid")', 150)
    time.sleep(3.5)
    r.stop()


def c_book(r):
    """贴纸本"""
    r.go('', kid=False)
    r.ev('HH.M.book(); 1')
    time.sleep(.6)
    r.start('book')
    time.sleep(1)
    r.ev('(async()=>{const p=document.querySelector(".page"); const max=p.scrollHeight-p.clientHeight; for(let i=0;i<=120;i++){p.scrollTop=max*i/120*.75; await new Promise(r=>setTimeout(r,33));} return 1})()')
    time.sleep(1.5)
    r.stop()


def c_settings(r):
    """家长设置：拼音难度"""
    r.go('', kid=False)
    r.ev('HH.M.settings(); 1')
    time.sleep(.6)
    r.start('settings')
    time.sleep(1.2)
    for v in ('easy', 'adv', 'std'):
        p = r.rect('.seg[data-k="level"] button[data-v="%s"]' % v)
        if p:
            r.tap(*p)
        time.sleep(1.3)
    time.sleep(1)
    r.stop()


CLIPS = {k[2:]: v for k, v in globals().items() if k.startswith('c_')}

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    names = sys.argv[1:] or list(CLIPS)
    try:
        r = rec.Rec()
    except Exception:
        rec.launch(gpu=True)
        r = rec.Rec()
    for n in names:
        t = time.time()
        print(n, '...', flush=True)
        try:
            CLIPS[n](r)
        except Exception as e:
            print('  FAILED', n, e)
            try:
                r.stop()
            except Exception:
                pass
        print('  %.0f s, errors=%s' % (time.time() - t, r.ev('JSON.stringify(HH.errors)')), flush=True)
