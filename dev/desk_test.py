"""1-3：真实触摸点桌子（先点错一张）、捡足球还给灰灰、找花夹子还给毛毛"""
import json, sys, time
sys.path.insert(0, 'dev')
import cdp
c = cdp.ws()
def ev(js):
    r = cdp.call(c, 'Runtime.evaluate', expression=js, returnByValue=True, awaitPromise=True)
    return r.get('result', {}).get('value')
def tapw(x, y):
    p = json.loads(ev("JSON.stringify(HH.E.toScreen(%s,%s))" % (x, y)))
    cdp.call(c, 'Input.dispatchTouchEvent', type='touchStart', touchPoints=[{'x': p['x'], 'y': p['y']}])
    time.sleep(.05); cdp.call(c, 'Input.dispatchTouchEvent', type='touchEnd', touchPoints=[])
def wait(js, t=60):
    t0 = time.time()
    while time.time() - t0 < t:
        if ev(js): return True
        time.sleep(.1)
    return False
def tapActor(i):
    b = json.loads(ev("JSON.stringify((()=>{const a=HH.E.actors['%s']; return {x:a.x, y:a.y-a.h*.5}})())" % i))
    tapw(b['x'], b['y'])
idle = "HH.E.free && !HH.E.busy"
out = {}
out['free'] = wait(idle, 60)
tapw(612, 700); out['ball'] = wait("HH.S.items.includes('ball')", 20)
wait(idle); tapActor('hu'); out['ball_back'] = wait("HH.S.side.ball===1", 20)
wait(idle); tapw(345, 282); out['clip'] = wait("HH.S.items.includes('clip')", 20)
wait(idle); tapActor('mm'); out['clip_back'] = wait("HH.S.side.clip===1", 20)
wait(idle); tapw(1323, 344); time.sleep(.3); wait(idle); out['wrong_ok'] = ev("!HH.L.cls.deskItems.bi")
for k, (x, y) in [('shu', (510, 340)), ('shui', (1000, 425)), ('bi', (1323, 344))]:
    wait(idle, 60); tapw(x, y); out[k] = wait("!!HH.L.cls.deskItems['%s']" % k, 20)
out['done'] = wait("HH.S.done.s1c===1", 90)
out['stickers'] = ev("HH.S.stickers"); out['items'] = ev("HH.S.items"); out['errors'] = ev("HH.errors")
print(out)
