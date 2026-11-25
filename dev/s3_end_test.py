"""3-3 后半：先点"倒掉"（应该被拦下），再点"打包"，然后点汤碗，等到第一集完"""
import json, sys, time
sys.path.insert(0, 'dev')
import cdp
c = cdp.ws()
def ev(js):
    r = cdp.call(c, 'Runtime.evaluate', expression=js, returnByValue=True, awaitPromise=True)
    return r.get('result', {}).get('value')
def tap(x, y):
    cdp.call(c, 'Input.dispatchTouchEvent', type='touchStart', touchPoints=[{'x': x, 'y': y}]); time.sleep(.05)
    cdp.call(c, 'Input.dispatchTouchEvent', type='touchEnd', touchPoints=[])
def wait(js, t=60):
    t0 = time.time()
    while time.time() - t0 < t:
        if ev(js) is True: return True
        time.sleep(.1)
    return False
def card(label):
    return json.loads(ev("JSON.stringify((()=>{const c=[...document.querySelectorAll('.cards .card')].find(c=>c.textContent.includes('%s')); if(!c) return null; const r=c.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}})())" % label))
out = {}
time.sleep(.6)
p = card('倒掉'); tap(p['x'], p['y']); time.sleep(.3)
out['still_choosing'] = card('打包') is not None
time.sleep(1.5)
p = card('打包'); tap(p['x'], p['y'])
out['box'] = wait("HH.S.items.includes('box')", 30)
out['soup'] = wait("!!HH.E.hot.find(h=>h.id==='soup')", 90)
p = json.loads(ev("JSON.stringify((()=>{const h=HH.E.hot.find(h=>h.id==='soup'); return HH.E.toScreen(h.sx,h.sy)})())")); tap(p['x'], p['y'])
out['done'] = wait("window.HH_STAGE_DONE===3 || !!document.querySelector('#dAgain')", 120)
out['stickers'] = ev("HH.S.stickers"); out['petals'] = ev("HH.S.petals"); out['errors'] = ev("HH.errors")
print(out)
