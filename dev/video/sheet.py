r"""某个片段每隔几秒取一帧拼成一张总览图（带秒数），用来挑剪辑的起止时间。

  python dev/video/sheet.py brush [间隔秒] [列数]
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
name = sys.argv[1]
step = float(sys.argv[2]) if len(sys.argv) > 2 else 2
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 5
d = os.path.join(HERE, 'raw', name)
fr = json.load(open(os.path.join(d, 'frames.json'), encoding='utf-8'))['frames']
t0 = fr[0][1]
picks, t = [], 0
while t <= fr[-1][1] - t0:
    f = min(fr, key=lambda x: abs(x[1] - t0 - t))
    picks.append((t, f[0]))
    t += step
tw, th = 336, 156
rows = (len(picks) + cols - 1) // cols
s = Image.new('RGB', (tw * cols, th * rows), (30, 20, 15))
dr = ImageDraw.Draw(s)
font = ImageFont.truetype(r'C:\Windows\Fonts\msyhbd.ttc', 20)
for i, (t, f) in enumerate(picks):
    im = Image.open(os.path.join(d, f)).convert('RGB').resize((tw - 4, th - 4))
    x, y = (i % cols) * tw, (i // cols) * th
    s.paste(im, (x + 2, y + 2))
    dr.rectangle([x + 2, y + 2, x + 62, y + 28], fill=(0, 0, 0))
    dr.text((x + 6, y + 2), '%.0f' % t, fill=(255, 230, 80), font=font)
out = os.path.join(HERE, 'raw', name + '_sheet.jpg')
s.save(out, quality=78)
print(out)
