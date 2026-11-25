"""序章：真实触摸——往上推站起来、点星星、点 5 个小伙伴"""
import json, sys, time
sys.path.insert(0, 'dev')
import cdp
c = cdp.ws()
def ev(js):
    r = cdp.call(c, 'Runtime.evaluate', expression=js, returnByValue=True, awaitPromise=True)
    return r.get('result', {}).get('value')
def tap(x, y):
    cdp.call(c, 'Input.dispatchTouchEvent', type='touchStart', touchPoints=[{'x': x, 'y': y}])
    time.sleep(.05); cdp.call(c, 'Input.dispatchTouchEvent', type='touchEnd', touchPoints=[])
def wait(js, t=60):
    t0 = time.time()
    while time.time() - t0 < t:
        if ev(js): return True
        time.sleep(.1)
    return False
out = {}
# 1 往上推
out['capture'] = wait("!!HH.E.capture")
p = json.loads(ev("JSON.stringify(HH.E.toScreen(HH.E.actors.hh.x, HH.E.actors.hh.y - 40))"))
cdp.call(c, 'Input.dispatchTouchEvent', type='touchStart', touchPoints=[{'x': p['x'], 'y': p['y']}])
for k in range(1, 10):
    time.sleep(.02); cdp.call(c, 'Input.dispatchTouchEvent', type='touchMove', touchPoints=[{'x': p['x'], 'y': p['y'] - k * 12}])
cdp.call(c, 'Input.dispatchTouchEvent', type='touchEnd', touchPoints=[])
out['stood'] = wait("HH.E.actors.hh.pose==='stand'", 10)
# 2 点星星
out['star'] = wait("!!HH.L.cls.star && HH.E.free", 40)
s = json.loads(ev("JSON.stringify(HH.E.toScreen(470, 800))"))
tap(s['x'], s['y'])
out['walked'] = wait("!HH.L.cls.star", 15)
# 3 点小伙伴
for fid in ['mm', 'hu', 'cm', 'bk', 'al']:
    wait("HH.E.free && !HH.E.busy", 30)
    b = json.loads(ev("JSON.stringify((()=>{const a=HH.E.actors['%s'], q=HH.E.toScreen(a.x, a.y - a.h*.5); return q})())" % fid))
    tap(b['x'], b['y'])
    out['met_' + fid] = wait("!!HH.S.met['%s']" % fid, 20)
out['done'] = wait("HH.S.done.pro===1", 30)
out['errors'] = ev("HH.errors")
print(out)
