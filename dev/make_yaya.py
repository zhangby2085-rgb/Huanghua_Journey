r"""第三集的新角色：小牙齿"牙牙"。用代码画（4 倍大小画好再缩小）→ huanghua/img/ch/yaya.webp、yaya_happy.webp、yaya_sad.webp

  python dev/make_yaya.py
"""
import os

from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'huanghua', 'img', 'ch')
K = 4
W, H = 380 * K, 460 * K
INK = (74, 46, 28, 255)


def tooth_poly(cx, top, w, h):
    """臼齿形状：上面两个圆鼓包，下面两条牙根"""
    pts = []
    import math
    # 上面左右两个鼓包（从左下开始，顺时针）
    for i in range(0, 61):
        a = math.pi + i / 60 * math.pi          # 左鼓包：180°→360°
        pts.append((cx - w * .25 + w * .25 * math.cos(a), top + h * .22 + h * .22 * math.sin(a)))
    for i in range(0, 61):
        a = math.pi + i / 60 * math.pi
        pts.append((cx + w * .25 + w * .25 * math.cos(a), top + h * .22 + h * .22 * math.sin(a)))
    # 右边往下到右牙根（牙根短一点、胖一点）
    pts += [(cx + w * .5, top + h * .5), (cx + w * .46, top + h * .82)]
    for i in range(0, 21):
        a = i / 20 * math.pi
        pts.append((cx + w * .3 + w * .16 * math.cos(a), top + h * .84 + h * .08 * math.sin(a)))
    for i in range(0, 21):
        a = i / 20 * math.pi
        pts.append((cx + w * .14 * math.cos(a), top + h * .82 - h * .08 * math.sin(a)))
    for i in range(0, 21):
        a = i / 20 * math.pi
        pts.append((cx - w * .3 + w * .16 * math.cos(a), top + h * .84 + h * .08 * math.sin(a)))
    pts += [(cx - w * .46, top + h * .82), (cx - w * .5, top + h * .5)]
    return pts


def make(mood):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, top, w, h = W / 2, H * .04, W * .86, H * .9
    body = tooth_poly(cx, top, w, h)
    d.polygon(body, fill=INK)
    inner = [(cx + (x - cx) * .94, top + h * .48 + (y - top - h * .48) * .95) for x, y in body]
    d.polygon(inner, fill=(255, 255, 255, 255))
    # 淡淡的阴影：右下一点点米色（先模糊，再只留在牙齿里面）
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).polygon(inner, fill=255)
    blob = Image.new('L', (W, H), 0)
    ImageDraw.Draw(blob).ellipse([cx + w * .08, top + h * .35, cx + w * .7, top + h * 1.05], fill=150)
    blob = blob.filter(ImageFilter.GaussianBlur(18 * K))
    from PIL import ImageChops
    sh = Image.new('RGBA', (W, H), (232, 220, 196, 255))
    sh.putalpha(ImageChops.multiply(blob, mask))
    im.alpha_composite(sh)
    d = ImageDraw.Draw(im)
    # 高光
    d.ellipse([cx - w * .36, top + h * .1, cx - w * .24, top + h * .3], fill=(255, 255, 255, 255), outline=(225, 238, 250, 255), width=3 * K)
    d.ellipse([cx - w * .4, top + h * .12, cx - w * .3, top + h * .25], fill=(214, 236, 255, 255))
    # 脸
    r = w * .5
    ey = top + h * .4
    if mood == 'happy':
        for ex in (cx - r * .3, cx + r * .3):
            d.arc([ex - r * .13, ey - r * .12, ex + r * .13, ey + r * .12], 200, 340, fill=INK, width=int(r * .055))
    elif mood == 'sad':
        for ex in (cx - r * .3, cx + r * .3):
            d.ellipse([ex - r * .1, ey - r * .12, ex + r * .1, ey + r * .12], fill=INK)
            d.ellipse([ex - r * .035, ey - r * .08, ex + r * .025, ey - r * .02], fill=(255, 255, 255, 255))
        # 眉毛：里面高、外面低（难过）
        d.line([(cx - r * .42, ey - r * .2), (cx - r * .2, ey - r * .28)], fill=INK, width=int(r * .045))
        d.line([(cx + r * .42, ey - r * .2), (cx + r * .2, ey - r * .28)], fill=INK, width=int(r * .045))
        # 泪珠
        d.ellipse([cx + r * .34, ey + r * .1, cx + r * .44, ey + r * .26], fill=(140, 205, 255, 255), outline=(60, 120, 170, 255), width=K * 2)
    else:
        for ex in (cx - r * .3, cx + r * .3):
            d.ellipse([ex - r * .1, ey - r * .13, ex + r * .1, ey + r * .13], fill=INK)
            d.ellipse([ex - r * .035, ey - r * .09, ex + r * .03, ey - r * .02], fill=(255, 255, 255, 255))
    for ex in (cx - r * .54, cx + r * .54):
        d.ellipse([ex - r * .12, ey + r * .12, ex + r * .12, ey + r * .28], fill=(255, 150, 170, 190))
    my = ey + r * .24
    if mood == 'happy':
        d.chord([cx - r * .16, my - r * .1, cx + r * .16, my + r * .2], 0, 180, fill=(220, 80, 100, 255), outline=INK, width=int(r * .035))
    elif mood == 'sad':
        d.arc([cx - r * .12, my, cx + r * .12, my + r * .16], 200, 340, fill=INK, width=int(r * .045))
    else:
        d.arc([cx - r * .12, my - r * .1, cx + r * .12, my + r * .1], 20, 160, fill=INK, width=int(r * .045))
    im = im.resize((W // K, H // K), Image.LANCZOS)
    a = im.getchannel('A').filter(ImageFilter.GaussianBlur(.4))
    im.putalpha(a)
    return im


if __name__ == '__main__':
    for mood, name in (('stand', 'yaya'), ('happy', 'yaya_happy'), ('sad', 'yaya_sad')):
        p = os.path.join(OUT, name + '.webp')
        make(mood).save(p, 'WEBP', quality=90, method=6)
        print(p, os.path.getsize(p) // 1024, 'KB')
