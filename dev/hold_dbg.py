import json, sys, time
sys.path.insert(0, 'dev')
import cdp
c = cdp.ws()
def ev(js):
    r = cdp.call(c, 'Runtime.evaluate', expression=js, returnByValue=True, awaitPromise=True)
    return r.get('result', {}).get('value')
ev("window.__ev=[]; ['pointerdown','pointerup','pointercancel','click','touchstart'].forEach(t=>document.addEventListener(t,e=>__ev.push(t+':'+(e.target.className||e.target.tagName)),true)); 1")
b = json.loads(ev("JSON.stringify((()=>{const r=document.querySelector('.acts .act.green').getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2}})())"))
print('btn', b, ev("document.elementFromPoint(%f,%f).className" % (b['x'], b['y'])))
cdp.call(c, 'Input.dispatchTouchEvent', type='touchStart', touchPoints=[{'x': b['x'], 'y': b['y']}])
for i in range(5):
    time.sleep(.4); print('hold', ev("HH.L.curRice.hold"), 'fill', ev("HH.L.curRice.fill"))
cdp.call(c, 'Input.dispatchTouchEvent', type='touchEnd', touchPoints=[])
time.sleep(.3)
print(ev("__ev"))
