"""手动驱动测试的小工具：python 里 import drive as d，然后 d.go(url) d.shot(name) d.hold(sel, s) d.swipe(pts) ..."""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cdp  # noqa: E402

c = cdp.ws()
cdp.call(c, 'Network.enable')
cdp.call(c, 'Network.setCacheDisabled', cacheDisabled=True)
OUT = os.environ.get('SHOTS', '.')


def ev(js):
    r = cdp.call(c, 'Runtime.evaluate', expression=js, returnByValue=True, awaitPromise=True)
    if r.get('exceptionDetails'):
        return 'EXC ' + str(r['exceptionDetails'].get('exception', {}).get('description'))
    return r.get('result', {}).get('value')


def go(q):
    cdp.call(c, 'Page.navigate', url='http://localhost:8807/huanghua.html' + q)
    time.sleep(1.8)


def wait(js, t=30):
    t0 = time.time()
    while time.time() - t0 < t:
        if ev(js):
            return True
        time.sleep(.15)
    print('  timeout:', js)
    return False


def shot(name):
    cdp.call(c, 'Emulation.setDeviceMetricsOverride', width=cdp.W, height=cdp.H, deviceScaleFactor=1, mobile=True)
    time.sleep(.3)
    import base64
    r = cdp.call(c, 'Page.captureScreenshot', format='jpeg', quality=80)
    cdp.setup(c)
    p = os.path.join(OUT, name + '.jpg')
    open(p, 'wb').write(base64.b64decode(r['data']))
    return p


def rect(sel):
    v = ev("(()=>{const e=document.querySelector(%s); if(!e) return null; const r=e.getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]})()" % json.dumps(sel))
    return v


def touch(kind, pts):
    cdp.call(c, 'Input.dispatchTouchEvent', type=kind, touchPoints=[{'x': x, 'y': y} for x, y in pts])


def tap(x, y):
    touch('touchStart', [(x, y)]); time.sleep(.05); touch('touchEnd', [])


def tapsel(sel):
    p = rect(sel)
    if p:
        tap(*p)
    return p


def hold(x, y, s):
    touch('touchStart', [(x, y)]); time.sleep(s)


def release():
    touch('touchEnd', [])


def swipe(pts, dt=.016):
    touch('touchStart', [pts[0]])
    for p in pts[1:]:
        time.sleep(dt); touch('touchMove', [p])
    touch('touchEnd', [])


def line(x0, y0, x1, y1, n=12):
    return [(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n) for i in range(n + 1)]


def card(py):
    """点写着这个拼音的卡片"""
    return ev("(()=>{const c=[...document.querySelectorAll('.card')].find(c=>c.querySelector('.py')&&c.querySelector('.py').textContent===%s); if(c){c.click(); return 1} return 0})()" % json.dumps(py))


def stack(names, out):
    from PIL import Image
    ims = [Image.open(os.path.join(OUT, n + '.jpg')) for n in names]
    w, h = ims[0].size
    cols = 2 if len(ims) > 2 else 1
    rows = (len(ims) + cols - 1) // cols
    s = Image.new('RGB', (w * cols, h * rows), (40, 30, 20))
    for i, im in enumerate(ims):
        s.paste(im, ((i % cols) * w, (i // cols) * h))
    s.save(os.path.join(OUT, out + '.jpg'), quality=80)
    return os.path.join(OUT, out + '.jpg')
