r"""第二集的新角色：小水滴"滴滴"。用代码画（4 倍大小画好再缩小，边缘就是平滑的）→ huanghua/img/ch/didi.webp、didi_happy.webp

  python dev/make_didi.py
"""
import math
import os

from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'huanghua', 'img', 'ch')
K = 4
W, H = 360 * K, 460 * K
INK = (74, 46, 28, 255)


def drop_poly(cx, cy, r, tip):
    """水滴形：下半圆 + 往上收成尖"""
    pts = []
    for i in range(0, 181):
        a = math.radians(i)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))          # 下半圆（从右到左）
    for i in range(0, 61):
        t = i / 60
        # 左边往上弯到尖
        x = cx - r * (1 - t) ** 1.6 * math.cos(t * math.pi / 2 * .2)
        y = cy - (cy - tip) * (1 - (1 - t) ** 1.25)
        pts.append((x, y))
    for i in range(0, 61):
        t = i / 60
        x = cx + r * t ** 1.6
        y = tip + (cy - tip) * (t ** 1.25 if t > 0 else 0)
        pts.append((x, y))
    return pts


def make(happy):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cx, cy, r, tip = W / 2, H * .62, W * .4, H * .04
    body = drop_poly(cx, cy, r, tip)
    # 身体：浅蓝渐变（一层层往里画）
    d = ImageDraw.Draw(im)
    d.polygon(body, fill=INK)
    inner = [(cx + (x - cx) * .955, cy + (y - cy) * .965 + 2 * K) for x, y in body]
    grad = Image.new('RGBA', (W, H), (110, 190, 250, 255))
    gd = ImageDraw.Draw(grad)
    for i in range(60):
        k = i / 59
        col = (int(120 + 110 * k), int(200 + 45 * k), 255, 255)
        s = 1 - k * .55
        gd.polygon([(cx - r * .15 + (x - cx) * s, cy - r * .2 + (y - cy) * s) for x, y in inner], fill=col)
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).polygon(inner, fill=255)
    im.paste(grad, (0, 0), mask)
    d = ImageDraw.Draw(im)
    # 高光
    d.ellipse([cx - r * .62, cy - r * .9, cx - r * .38, cy - r * .35], fill=(255, 255, 255, 210))
    d.ellipse([cx - r * .3, cy - r * 1.05, cx - r * .18, cy - r * .9], fill=(255, 255, 255, 190))
    # 脸
    ey = cy + r * .05
    if happy:
        for ex in (cx - r * .32, cx + r * .32):
            d.arc([ex - r * .14, ey - r * .12, ex + r * .14, ey + r * .12], 200, 340, fill=INK, width=int(r * .06))
    else:
        for ex in (cx - r * .32, cx + r * .32):
            d.ellipse([ex - r * .11, ey - r * .14, ex + r * .11, ey + r * .14], fill=INK)
            d.ellipse([ex - r * .04, ey - r * .1, ex + r * .03, ey - r * .03], fill=(255, 255, 255, 255))
    for ex in (cx - r * .55, cx + r * .55):
        d.ellipse([ex - r * .13, ey + r * .14, ex + r * .13, ey + r * .3], fill=(255, 150, 170, 170))
    my = ey + r * .25
    if happy:
        d.chord([cx - r * .17, my - r * .1, cx + r * .17, my + r * .22], 0, 180, fill=(220, 80, 100, 255), outline=INK, width=int(r * .035))
    else:
        d.arc([cx - r * .12, my - r * .1, cx + r * .12, my + r * .1], 20, 160, fill=INK, width=int(r * .045))
    im = im.resize((W // K, H // K), Image.LANCZOS)
    a = im.getchannel('A').filter(ImageFilter.GaussianBlur(.4))
    im.putalpha(a)
    return im


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    make(False).save(os.path.join(OUT, 'didi.webp'), 'WEBP', quality=92)
    make(True).save(os.path.join(OUT, 'didi_happy.webp'), 'WEBP', quality=92)
    print('ok')
