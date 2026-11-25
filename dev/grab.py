r"""把"下载"文件夹里最新的一张 Gemini 图挪到 黄花的生活/gemini2/<名字>.png（等它下载完）

  python dev/grab.py <名字>
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
    t0 = time.time()
    while time.time() - t0 < 60:
        fs = [os.path.join(DL, f) for f in os.listdir(DL) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
        fs = [f for f in fs if time.time() - os.path.getmtime(f) < 600]
        if fs:
            f = max(fs, key=os.path.getmtime)
            s1 = os.path.getsize(f); time.sleep(1.0)
            if os.path.getsize(f) == s1 and s1 > 10000:
                os.makedirs(DST, exist_ok=True)
                ext = os.path.splitext(f)[1].lower()
                out = os.path.join(DST, name + ext)
                shutil.move(f, out)
                from PIL import Image
                print('saved', out, Image.open(out).size, s1 // 1024, 'KB')
                sys.exit(0)
        time.sleep(1)
    print('no new image in Downloads')
    sys.exit(1)
