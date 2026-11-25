"""录游戏画面：无界面 Chrome + CDP 的 screencast，一帧一帧存成 JPG（带时间戳），之后拼成视频。

  from rec import Rec
  r = Rec(); r.go('?play=s7b'); r.start('clip'); ...手指操作... ; r.stop()
"""
import base64
import json
import os
import queue
import subprocess
import tempfile
import threading
import time
import urllib.request

import websocket

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
PORT = 9371
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PROFILE = os.path.join(tempfile.gettempdir(), 'huanghua_rec_profile')
CW, CH, DPR = 1440, 667, 1        # 手机横屏 2.16:1（1440 宽约 27 帧/秒，1680 宽只有 17 帧）
BASE = 'http://localhost:8807/huanghua.html'


def launch(gpu=False):
    flags = ['--use-angle=d3d11'] if gpu else ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    subprocess.Popen([CHROME, '--headless=new', '--remote-debugging-port=%d' % PORT, '--user-data-dir=' + PROFILE,
                      '--autoplay-policy=no-user-gesture-required', '--window-size=%d,%d' % (CW, CH), '--mute-audio', *flags,
                      '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
                      '--disable-backgrounding-occluded-windows', 'about:blank'],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=0x00000008)
    for _ in range(60):
        try:
            json.load(urllib.request.urlopen('http://localhost:%d/json' % PORT))
            return
        except Exception:
            time.sleep(.25)


def kill():
    try:
        r = Rec(setup=False)
        r.send('Browser.close')
    except Exception:
        pass


class Rec:
    def __init__(self, setup=True):
        tabs = json.load(urllib.request.urlopen('http://localhost:%d/json' % PORT))
        page = [t for t in tabs if t['type'] == 'page'][0]
        self.ws = websocket.create_connection(page['webSocketDebuggerUrl'], timeout=600, suppress_origin=True)
        self.n = 0
        self.wait = {}
        self.lock = threading.Lock()
        self.frames = None
        self.dir = None
        self.marks = []
        self.touches = []
        threading.Thread(target=self._read, daemon=True).start()
        if not setup:
            return
        self.call('Emulation.setDeviceMetricsOverride', width=CW, height=CH, deviceScaleFactor=DPR, mobile=True, screenWidth=CW, screenHeight=CH)
        self.call('Emulation.setTouchEmulationEnabled', enabled=True, maxTouchPoints=2)
        self.call('Page.enable')
        self.call('Network.enable')
        self.call('Network.setCacheDisabled', cacheDisabled=True)
        self.call('Runtime.enable')

    def _read(self):
        while True:
            try:
                m = json.loads(self.ws.recv())
            except Exception:
                return
            if 'id' in m:
                q = self.wait.pop(m['id'], None)
                if q:
                    q.put(m)
            elif m.get('method') == 'Page.screencastFrame':
                p = m['params']
                self.send('Page.screencastFrameAck', sessionId=p['sessionId'])
                if self.frames is not None:
                    ts = p['metadata'].get('timestamp', time.time())
                    name = '%06d.jpg' % len(self.frames)
                    with open(os.path.join(self.dir, name), 'wb') as f:
                        f.write(base64.b64decode(p['data']))
                    self.frames.append((name, ts))
            elif m.get('method') == 'Runtime.consoleAPICalled':
                args = m['params'].get('args', [])
                txt = ' '.join(str(a.get('value', '')) for a in args)
                if self.frames is not None and txt.startswith('[HH]'):
                    self.marks.append((time.time(), txt))

    def send(self, method, **params):
        with self.lock:
            self.n += 1
            self.ws.send(json.dumps({'id': self.n, 'method': method, 'params': params}))

    def call(self, method, **params):
        q = queue.Queue()
        with self.lock:
            self.n += 1
            i = self.n
            self.wait[i] = q
            self.ws.send(json.dumps({'id': i, 'method': method, 'params': params}))
        m = q.get(timeout=600)
        if 'error' in m:
            raise RuntimeError(m['error'])
        return m.get('result', {})

    def ev(self, js):
        r = self.call('Runtime.evaluate', expression=js, returnByValue=True, awaitPromise=True)
        if r.get('exceptionDetails'):
            return None
        return r.get('result', {}).get('value')

    def go(self, q='', setup='HH.S.set.voice=0;HH.S.set.music=0;HH.save();', kid=True):
        self.call('Page.navigate', url=BASE + q)
        time.sleep(1.2)
        self.ev(setup + '1')
        if kid:
            self.ev(open(os.path.join(HERE, 'kid_demo.js'), encoding='utf-8').read() + ';1')
        time.sleep(.3)

    def until(self, js, t=40):
        t0 = time.time()
        while time.time() - t0 < t:
            if self.ev(js):
                return True
            time.sleep(.08)
        print('  timeout:', js)
        return False

    def start(self, name):
        self.dir = os.path.join(RAW, name)
        os.makedirs(self.dir, exist_ok=True)
        for f in os.listdir(self.dir):
            os.remove(os.path.join(self.dir, f))
        self.marks = []
        self.touches = []
        self.t0 = time.time()
        self.ev('window.__taps && (window.__taps.length = 0); 1')
        self.frames = []
        self.call('Page.startScreencast', format='jpeg', quality=82, maxWidth=round(CW * DPR), maxHeight=round(CH * DPR), everyNthFrame=1)

    def stop(self):
        self.call('Page.stopScreencast')
        time.sleep(.25)
        fr, self.frames = self.frames, None
        taps = self.ev('JSON.stringify(window.__taps || [])')
        json.dump({'frames': fr, 't0': self.t0, 'marks': self.marks, 'touches': self.touches, 'taps': json.loads(taps or '[]')}, open(os.path.join(self.dir, 'frames.json'), 'w', encoding='utf-8'), ensure_ascii=False)
        dur = fr[-1][1] - fr[0][1] if len(fr) > 1 else 0
        print('  %s: %d frames, %.1f s, %.1f fps' % (os.path.basename(self.dir), len(fr), dur, len(fr) / max(dur, .01)))
        return fr

    # ---------- 手指 ----------
    def touch(self, kind, pts):
        if self.frames is not None:
            self.touches.append((time.time(), kind, pts))
        self.call('Input.dispatchTouchEvent', type=kind, touchPoints=[{'x': x, 'y': y} for x, y in pts])

    def tap(self, x, y):
        self.touch('touchStart', [(x, y)])
        time.sleep(.06)
        self.touch('touchEnd', [])

    def swipe(self, pts, dt=.02):
        self.touch('touchStart', [pts[0]])
        for p in pts[1:]:
            time.sleep(dt)
            self.touch('touchMove', [p])
        self.touch('touchEnd', [])

    def hold(self, x, y, s):
        self.touch('touchStart', [(x, y)])
        time.sleep(s)
        self.touch('touchEnd', [])

    def rect(self, sel, i=0):
        return self.ev("(()=>{const e=document.querySelectorAll(%s)[%d]; if(!e) return null; const r=e.getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]})()" % (json.dumps(sel), i))

    def tapsel(self, sel, i=0):
        p = self.rect(sel, i)
        if p:
            self.tap(*p)
        return p

    def world(self, x, y):
        p = json.loads(self.ev('JSON.stringify(HH.E.toScreen(%s,%s))' % (x, y)))
        return p['x'], p['y']


def line(x0, y0, x1, y1, n=14):
    return [(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n) for i in range(n + 1)]
