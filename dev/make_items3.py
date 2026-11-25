r"""第五、六集用代码画的小东西：春联（上联、下联、横批）、福字、筷子 → huanghua/img/item/*.webp

  python dev/make_items3.py
"""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'huanghua', 'img', 'item')
K = 3
INK = (74, 46, 28, 255)
RED = (214, 40, 40, 255)
GOLD = (255, 214, 92, 255)
FONT = next(f for f in [r'C:\Windows\Fonts\simkai.ttf', r'C:\Windows\Fonts\STKAITI.TTF', r'C:\Windows\Fonts\msyh.ttc'] if os.path.exists(f))


def paper(w, h):
    im = Image.new('RGBA', (w * K, h * K), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([3 * K, 3 * K, (w - 3) * K, (h - 3) * K], radius=8 * K, fill=RED, outline=INK, width=4 * K)
    d.rounded_rectangle([10 * K, 10 * K, (w - 10) * K, (h - 10) * K], radius=5 * K, outline=GOLD, width=2 * K)
    return im, d


def text(d, s, box, vertical):
    x0, y0, x1, y1 = [v * K for v in box]
    n = len(s)
    if vertical:
        size = min(x1 - x0, (y1 - y0) / n) * .86
        f = ImageFont.truetype(FONT, int(size))
        for i, ch in enumerate(s):
            cy = y0 + (y1 - y0) * (i + .5) / n
            d.text(((x0 + x1) / 2, cy), ch, font=f, fill=(25, 20, 20, 255), anchor='mm')
    else:
        size = min(y1 - y0, (x1 - x0) / n) * .86
        f = ImageFont.truetype(FONT, int(size))
        for i, ch in enumerate(s):
            cx = x0 + (x1 - x0) * (i + .5) / n
            d.text((cx, (y0 + y1) / 2), ch, font=f, fill=(25, 20, 20, 255), anchor='mm')


def save(im, name):
    w, h = im.size
    im = im.resize((w // K, h // K), Image.LANCZOS)
    p = os.path.join(OUT, name + '.webp')
    im.save(p, 'WEBP', quality=90, method=6)
    print(name, im.size, os.path.getsize(p) // 1024, 'KB')


def couplet(s, name):
    im, d = paper(80, 400)
    text(d, s, (14, 18, 66, 382), True)
    save(im, name)


def hengpi(s):
    im, d = paper(300, 84)
    text(d, s, (20, 14, 280, 70), False)
    save(im, 'hengpi')


def fu():
    S = 220
    im = Image.new('RGBA', (S * K, S * K), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = S * K / 2
    r = S * K * .47
    d.polygon([(c, c - r), (c + r, c), (c, c + r), (c - r, c)], fill=RED, outline=INK, width=5 * K)
    r2 = r * .86
    d.polygon([(c, c - r2), (c + r2, c), (c, c + r2), (c - r2, c)], outline=GOLD, width=3 * K)
    f = ImageFont.truetype(FONT, int(r * 1.05))
    d.text((c, c + 4 * K), '福', font=f, fill=(25, 20, 20, 255), anchor='mm')
    save(im, 'fu')


def chopsticks():
    W, H = 120, 300
    im = Image.new('RGBA', (W * K, H * K), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for dx in (-14, 14):
        x = W * K / 2 + dx * K
        d.polygon([(x - 7 * K, 10 * K), (x + 7 * K, 10 * K), (x + 3 * K, (H - 10) * K), (x - 3 * K, (H - 10) * K)], fill=(196, 140, 84, 255), outline=INK)
        d.rectangle([x - 7 * K, 10 * K, x + 7 * K, 60 * K], fill=(214, 40, 40, 255), outline=INK, width=2 * K)
    save(im, 'chopsticks')


if __name__ == '__main__':
    couplet('天增岁月人增寿', 'shanglian')
    couplet('春满乾坤福满门', 'xialian')
    hengpi('福满人间')
    fu()
    chopsticks()
