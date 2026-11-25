"""叠罗汉点准时机测试：页面打开 ?fast&play=s2b，kid.js 答题，这里看到对准了就用真实触摸点一下"""
import json, subprocess, sys, time
sys.path.insert(0, 'dev')
import cdp
c = cdp.ws()
def ev(js):
    r = cdp.call(c, 'Runtime.evaluate', expression=js, returnByValue=True)
    return r.get('result', {}).get('value')
taps = 0; t0 = time.time(); log = []
while time.time() - t0 < 150:
    st = ev("JSON.stringify({m: HH.L.tw.mark ? HH.L.tw.mark.ok : null, top: Object.values(HH.E.actors).filter(a=>a.onTop).map(a=>a.id), done: window.HH_STAGE_DONE||0, last: HH.S.last, err: HH.errors})")
    st = json.loads(st)
    if st['m'] is True:
        cdp.call(c, 'Input.dispatchTouchEvent', type='touchStart', touchPoints=[{'x': 400, 'y': 200}])
        cdp.call(c, 'Input.dispatchTouchEvent', type='touchEnd', touchPoints=[])
        taps += 1; log.append(('tap', round(time.time() - t0, 1), st['top']))
        time.sleep(1.0)
    if st['last'] == 's2c' or st['err']:
        break
    time.sleep(.03)
print('taps', taps, log, st)
