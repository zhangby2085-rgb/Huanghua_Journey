r"""守在"下载"文件夹：浏览器面板下载 Gemini 图时只留一个 .tmp 几秒钟，这里一看到就复制出来。

  python dev/catch.py <名字> [等多少秒]
  → 黄花的生活/gemini2/<名字>.png（统一转成 PNG）
"""
import os
import shutil
import sys
import time

DL = os.path.join(os.path.expanduser('~'), 'Downloads')
DST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'art', 'gemini2')

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    name = sys.argv[1]
    limit = float(sys.argv[2]) if len(sys.argv) > 2 else 90
    before = set(os.listdir(DL))
    t0 = time.time()
    got, last = None, {}
    tmp = os.path.join(DST, '_' + name + '.part')
    os.makedirs(DST, exist_ok=True)
    while time.time() - t0 < limit:
        for f in os.listdir(DL):
            if f in before or not f.lower().endswith(('.tmp', '.png', '.jpg', '.jpeg', '.webp')):
                continue
            p = os.path.join(DL, f)
            try:
                s = os.path.getsize(p)
            except OSError:
                continue
            if s > 20000 and last.get(f) == s:
                try:
                    shutil.copyfile(p, tmp); got = f
                except OSError:
                    pass
            last[f] = s
        if got:
            break
        time.sleep(.12)
    if not got:
        print('nothing caught'); sys.exit(1)
    from PIL import Image
    im = Image.open(tmp); im.load()
    out = os.path.join(DST, name + '.png')
    im.convert('RGB').save(out)
    os.remove(tmp)
    print('saved', out, im.size)
