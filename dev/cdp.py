"""无界面 Chrome 自动测试（横屏手机尺寸）。

  python cdp.py launch [url]      启动无界面 Chrome，打开游戏（端口 9341）
  python cdp.py eval "<js>"       在页面里执行 JS（可以 await），打印结果
  python cdp.py reload            不用缓存重新载入
  python cdp.py shot out.png      截图
  python cdp.py nav <url>         打开另一个地址
  python cdp.py kill              关掉
"""
import base64
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request

import websocket

PORT = 9361
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PROFILE = os.path.join(tempfile.gettempdir(), 'huanghua_cdp_profile')
W, H = 844, 390


def ws():
    tabs = json.load(urllib.request.urlopen('http://localhost:%d/json' % PORT))
    page = [t for t in tabs if t['type'] == 'page'][0]
    return websocket.create_connection(page['webSocketDebuggerUrl'], timeout=900, suppress_origin=True)


_id = [0]


def call(c, method, **params):
    _id[0] += 1
    c.send(json.dumps({'id': _id[0], 'method': method, 'params': params}))
    while True:
        m = json.loads(c.recv())
        if m.get('id') == _id[0]:
            if 'error' in m:
                raise RuntimeError(m['error'])
            return m.get('result', {})


def setup(c):
    call(c, 'Emulation.setDeviceMetricsOverride', width=W, height=H, deviceScaleFactor=2, mobile=True, screenWidth=W, screenHeight=H)
    call(c, 'Emulation.setTouchEmulationEnabled', enabled=True, maxTouchPoints=2)


def main():
    cmd = sys.argv[1]
    if cmd == 'launch':
        url = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:8807/huanghua.html'
        subprocess.Popen([CHROME, '--headless=new', '--remote-debugging-port=%d' % PORT, '--user-data-dir=' + PROFILE,
                          '--autoplay-policy=no-user-gesture-required', '--window-size=%d,%d' % (W + 16, H + 95), '--mute-audio',
                          '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
                          '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
                          '--disable-backgrounding-occluded-windows', 'about:blank'],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=0x00000008)
        for _ in range(40):
            try:
                c = ws()
                break
            except Exception:
                time.sleep(.25)
        setup(c)
        call(c, 'Page.enable')
        call(c, 'Network.enable')
        call(c, 'Network.setCacheDisabled', cacheDisabled=True)
        call(c, 'Page.navigate', url=url)
        time.sleep(2)
        print('launched')
    elif cmd == 'eval':
        c = ws()
        r = call(c, 'Runtime.evaluate', expression='(async()=>{ return (' + sys.argv[2] + ') })()', awaitPromise=True,
                 returnByValue=True, timeout=890000)
        res = r.get('result', {})
        if r.get('exceptionDetails'):
            print('EXC', json.dumps(r['exceptionDetails'].get('exception', {}).get('description', r['exceptionDetails']), ensure_ascii=False))
        else:
            v = res.get('value', res.get('description'))
            print(json.dumps(v, ensure_ascii=False, indent=1) if not isinstance(v, str) else v)
    elif cmd == 'evalf':
        # 执行文件里的 JS（放在全局）
        c = ws()
        src = open(sys.argv[2], encoding='utf-8').read()
        r = call(c, 'Runtime.evaluate', expression=src, awaitPromise=True, returnByValue=True, timeout=890000)
        if r.get('exceptionDetails'):
            print('EXC', json.dumps(r['exceptionDetails'].get('exception', {}).get('description', r['exceptionDetails']), ensure_ascii=False))
        else:
            print('loaded')
    elif cmd == 'reload':
        c = ws()
        call(c, 'Network.enable')
        call(c, 'Network.setCacheDisabled', cacheDisabled=True)
        call(c, 'Page.reload', ignoreCache=True)
        time.sleep(3)
        print('reloaded')
    elif cmd == 'nav':
        c = ws()
        call(c, 'Network.enable')
        call(c, 'Network.setCacheDisabled', cacheDisabled=True)
        call(c, 'Page.navigate', url=sys.argv[2])
        time.sleep(2)
        print('ok')
    elif cmd == 'shot':
        c = ws()
        call(c, 'Emulation.setDeviceMetricsOverride', width=W, height=H, deviceScaleFactor=1.6, mobile=False)
        time.sleep(.35)
        r = call(c, 'Page.captureScreenshot', format='jpeg', quality=85)
        call(c, 'Emulation.clearDeviceMetricsOverride')
        open(sys.argv[2], 'wb').write(base64.b64decode(r['data']))
        print(sys.argv[2])
    elif cmd == 'touch':
        # python cdp.py touch x1,y1 x2,y2 ... 用真实触摸事件划一笔（CSS 像素）
        c = ws()
        pts = [tuple(float(v) for v in a.split(',')) for a in sys.argv[2:]]
        call(c, 'Input.dispatchTouchEvent', type='touchStart', touchPoints=[{'x': pts[0][0], 'y': pts[0][1]}])
        for p in pts[1:]:
            time.sleep(.016)
            call(c, 'Input.dispatchTouchEvent', type='touchMove', touchPoints=[{'x': p[0], 'y': p[1]}])
        call(c, 'Input.dispatchTouchEvent', type='touchEnd', touchPoints=[])
        print('touched')
    elif cmd == 'kill':
        try:
            c = ws()
            call(c, 'Browser.close')
        except Exception as e:
            print('not running', e)


if __name__ == '__main__':
    main()
