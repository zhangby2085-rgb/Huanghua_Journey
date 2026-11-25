"""自动把某几站从头玩到尾（?auto&fast），报告报错、缺的配音、花了多久。

  python dev/auto_st.py s7a s8a s9a     （先 python dev/cdp.py launch）
"""
import json
import sys
import time

sys.path.insert(0, 'dev')
import cdp  # noqa: E402

c = cdp.ws()
cdp.call(c, 'Network.enable')
cdp.call(c, 'Network.setCacheDisabled', cacheDisabled=True)


def ev(js):
    r = cdp.call(c, 'Runtime.evaluate', expression=js, returnByValue=True, awaitPromise=True)
    return r.get('result', {}).get('value')


for lv in sys.argv[1:]:
    cdp.call(c, 'Page.navigate', url='http://localhost:8807/huanghua.html?auto&fast&play=' + lv)
    time.sleep(1.5)
    t0 = time.time()
    ok = False
    while time.time() - t0 < 120:
        if ev('window.HH_STAGE_DONE'):
            ok = True
            break
        if ev('HH.errors && HH.errors.length'):
            break
        time.sleep(.3)
    print(lv, 'done' if ok else 'STUCK', round(time.time() - t0, 1), 's',
          'last=', ev('HH.S.last'), 'errors=', json.dumps(ev('HH.errors'), ensure_ascii=False),
          'missing=', json.dumps(ev('[...HH.missing]'), ensure_ascii=False))
