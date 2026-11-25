"""第三站：真实触摸——拦住灰灰、搓爪子、拨转盘、分汤圆、按住盛饭、吃饭、捡米粒、点汤碗"""
import json, math, sys, time
sys.path.insert(0, 'dev')
import cdp
c = cdp.ws()
def ev(js):
    r = cdp.call(c, 'Runtime.evaluate', expression=js, returnByValue=True, awaitPromise=True)
    if r.get('exceptionDetails'): return 'EXC ' + str(r['exceptionDetails'].get('exception', {}).get('description'))
    return r.get('result', {}).get('value')
def T(kind, x, y): cdp.call(c, 'Input.dispatchTouchEvent', type=kind, touchPoints=[] if kind == 'touchEnd' else [{'x': x, 'y': y}])
def tap(x, y): T('touchStart', x, y); time.sleep(.05); T('touchEnd', 0, 0)
def drag(pts, dt=.02):
    T('touchStart', *pts[0])
    for p in pts[1:]: time.sleep(dt); T('touchMove', *p)
    T('touchEnd', 0, 0)
def wait(js, t=60):
    t0 = time.time()
    while time.time() - t0 < t:
        if ev(js) is True: return True
        time.sleep(.1)
    return False
def hot(id_):
    return json.loads(ev("JSON.stringify((()=>{const h=HH.E.hot.find(h=>h.id==='%s'); return h ? HH.E.toScreen(h.sx!=null?h.sx:h.x, h.sy!=null?h.sy:h.y) : null})())" % id_))
out = {}
START = sys.argv[1] if len(sys.argv) > 1 else 's3a'
if START == 's3a':
  pass
# 1 拦住灰灰
if START == 's3a':
    out['stopHu'] = wait("!!HH.E.hot.find(h=>h.id==='stopHu')", 60)
    p = hot('stopHu'); tap(p['x'], p['y'])
    out['stopped'] = wait("!HH.E.hot.find(h=>h.id==='stopHu')", 10)
    # 2 搓爪子（两次：黄花、灰灰）
    for who in ('hh', 'hu'):
        ok = wait("!!(HH.L.curWash && HH.L.curWash.st.active)", 90)
        ps = json.loads(ev("JSON.stringify(HH.L.curWash.P())"))
        t0 = time.time(); n = 0
        while ev("HH.L.curWash.st.active") is True and time.time() - t0 < 40:
            q = ps[n % 2]; s = q['s']; n += 1
            pts = [(q['x'] + s * .3 * math.cos(k * .7), q['y'] + s * .25 * math.sin(k * 1.3)) for k in range(24)]
            drag(pts, .012)
        out['wash_' + who] = ok and time.time() - t0 < 40
    # 3 转盘：五道菜
    for i in range(5):
        if not wait("!!(HH.L.rs.target && HH.E.capture)", 120): out['spin%d' % i] = False; break
        k = ev("HH.L.rs.target.dish")
        for attempt in range(6):
            diff = ev("(()=>{const r=HH.L.rs, d=r.dishes.find(x=>x.k===r.target.dish); let a=r.target.ang-(d.a+r.rot); a=((a%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI; return a})()")
            if diff is None or not wait("!!HH.E.capture", 1): break
            # 在转盘前半边横着拖：dθ = -dx/(186*1.1)
            dxw = -diff * 186 * 1.1
            a = json.loads(ev("JSON.stringify(HH.E.toScreen(835, 480))")); sc = ev("HH.E.scale()")
            dxs = dxw * sc; steps = 30
            drag([(a['x'] + dxs * j / steps - dxs / 2, a['y']) for j in range(steps + 1)], .03)
            time.sleep(1.2)
            if ev("!HH.L.rs.target || HH.L.rs.target.dish!=='%s'" % k) is True: break
        out['spin_' + k] = ev("!HH.L.rs.target || HH.L.rs.target.dish!=='%s'" % k) is True

# 4 分汤圆给老师
if START in ('s3a', 's3b'):
  out['share'] = wait("!!HH.E.hot.find(h=>h.id==='share')", 60)
  p = hot('share'); tap(p['x'], p['y'])
# 5 盛饭：按住按钮
out['rice'] = wait("!!document.querySelector('.acts .act.green') && !!HH.L.curRice", 120)
time.sleep(.8)
b = json.loads(ev("JSON.stringify((()=>{const r=document.querySelector('.acts .act.green').getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2}})())"))
T('touchStart', b['x'], b['y'])
wait("HH.L.curRice.fill >= HH.L.curRice.line - .02", 10)
T('touchEnd', 0, 0)
out['fill'] = round(ev("HH.L.curRice.fill"), 2)
# 6 吃饭：点碗
wait("HH.L.curRice.phase==='eat'", 30)
time.sleep(2)
bw = json.loads(ev("JSON.stringify((()=>{const b=HH.L.curRice.bowl(); return {x:b.x, y:b.y-b.w*.3}})())"))
for _ in range(12):
    if ev("HH.L.curRice.phase==='eat'") is not True: break
    tap(bw['x'], bw['y']); time.sleep(.35)
# 7 捡米粒
wait("HH.L.curRice.phase==='pick'", 20); time.sleep(1.5)
for gr in json.loads(ev("JSON.stringify(HH.L.curRice.grains.map(g=>({x:g.x,y:g.y})))")):
    tap(gr['x'], gr['y']); time.sleep(.3)
out['grains'] = ev("HH.L.curRice.grains.every(g=>g.got)")
# 7.5 打包
wait("!![...document.querySelectorAll('.cards .card')].find(c=>c.textContent.includes('打包'))", 40); time.sleep(.8)
p = json.loads(ev("JSON.stringify((()=>{const c=[...document.querySelectorAll('.cards .card')].find(c=>c.textContent.includes('打包')); const r=c.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}})())")); tap(p['x'], p['y'])
# 8 汤碗里的月亮
out['soup'] = wait("!!HH.E.hot.find(h=>h.id==='soup')", 150)
p = hot('soup'); tap(p['x'], p['y'])
out['done'] = wait("window.HH_STAGE_DONE===3", 150)
out['stickers'] = ev("HH.S.stickers"); out['errors'] = ev("HH.errors")
print(out)
