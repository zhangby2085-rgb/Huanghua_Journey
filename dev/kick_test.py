"""踢球测试：打开 ?fast&play=s2a，点球进入踢球，用真实触摸往后拉再松手，踢 4 次"""
import json, sys, time
sys.path.insert(0, 'dev')
import cdp
c = cdp.ws()
def ev(js):
    r = cdp.call(c, 'Runtime.evaluate', expression=js, returnByValue=True, awaitPromise=True)
    return r.get('result', {}).get('value')
for _ in range(200):
    if ev("!!(HH.E.free && HH.E.hot.find(h=>h.id==='ball'))"): break
    time.sleep(.1)
ev("HH.E.tapHot('ball'), 1")
res = []
for shot in range(4):
    for _ in range(200):
        if ev("!!(HH.E.capture && HH.L.kick.on && !HH.L.ball.fly)"): break
        time.sleep(.1)
    b = json.loads(ev("JSON.stringify(HH.E.toScreen(HH.L.ball.x, HH.L.ball.y))"))
    dx = [-40, -60, -20, -50][shot]
    pts = [(b['x'], b['y'])] + [(b['x'] + dx * k / 8, b['y'] + 90 * k / 8) for k in range(1, 9)]
    cdp.call(c, 'Input.dispatchTouchEvent', type='touchStart', touchPoints=[{'x': pts[0][0], 'y': pts[0][1]}])
    for x, y in pts[1:]:
        time.sleep(.02); cdp.call(c, 'Input.dispatchTouchEvent', type='touchMove', touchPoints=[{'x': x, 'y': y}])
    cdp.call(c, 'Input.dispatchTouchEvent', type='touchEnd', touchPoints=[])
    for _ in range(100):
        r = ev("HH.L.kick.result")
        if r: break
        time.sleep(.05)
    res.append(r)
    time.sleep(1.5)
print('results', res, 'goals', ev("HH.L.kick.goals"), 'errors', ev("HH.errors"))
