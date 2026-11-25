r"""第二集的小物件：用代码画（4 倍画好再缩小）→ huanghua/img/item/*.webp
借书卡 card、《小水滴的旅行》dbook、洒水壶 can、洗菜盆 basin、卫生纸 roll、印章 stamp

  python dev/make_items2.py
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'huanghua', 'img', 'item')
FONT = os.path.join(ROOT, 'dev', 'font', 'LXGWWenKai-Medium.ttf')
K = 4
INK = (74, 46, 28, 255)


def canvas(w, h):
    im = Image.new('RGBA', (w * K, h * K), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def S(*v):
    return [x * K for x in v]


def done(im, name):
    im = im.resize((im.width // K, im.height // K), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=92)
    print(name, im.size)


def card():
    im, d = canvas(300, 200)
    d.rounded_rectangle(S(10, 10, 290, 190), 22 * K, fill=(150, 205, 245, 255), outline=INK, width=6 * K)
    d.rounded_rectangle(S(10, 10, 290, 62), 22 * K, fill=(90, 160, 225, 255), outline=INK, width=6 * K)
    d.rectangle(S(13, 44, 287, 62), fill=(90, 160, 225, 255))
    d.line(S(10, 62, 290, 62), fill=INK, width=5 * K)
    # 小书图标
    d.polygon(S(40, 95, 95, 85, 150, 95, 150, 165, 95, 155, 40, 165), fill=(255, 250, 235, 255), outline=INK)
    d.line(S(95, 85, 95, 155), fill=INK, width=4 * K)
    for y in (108, 122, 136):
        d.line(S(52, y, 85, y - 4), fill=(170, 150, 130, 255), width=3 * K)
        d.line(S(105, y - 4, 138, y), fill=(170, 150, 130, 255), width=3 * K)
    # 条形码
    x = 175
    for i, wd in enumerate([4, 2, 6, 2, 3, 5, 2, 4, 2, 6, 3, 2, 4]):
        if i % 2 == 0:
            d.rectangle(S(x, 100, x + wd, 160), fill=INK)
        x += wd + 2
    f = ImageFont.truetype(FONT, 30 * K)
    d.text((150 * K, 36 * K), '借书卡', font=f, fill=(255, 255, 255, 255), anchor='mm', stroke_width=2 * K, stroke_fill=INK)
    done(im, 'card')


def dbook():
    im, d = canvas(260, 320)
    d.rounded_rectangle(S(18, 14, 250, 306), 14 * K, fill=(70, 140, 215, 255), outline=INK, width=6 * K)
    d.rectangle(S(18, 14, 46, 306), fill=(45, 105, 180, 255))
    d.line(S(46, 14, 46, 306), fill=INK, width=5 * K)
    d.rounded_rectangle(S(18, 14, 250, 306), 14 * K, outline=INK, width=6 * K)
    # 波浪
    for y in (250, 272):
        pts = [((48 + i * 6) * K, (y + 7 * math.sin(i * .55)) * K) for i in range(34)]
        d.line(pts, fill=(200, 235, 255, 255), width=4 * K)
    didi = Image.open(os.path.join(ROOT, 'huanghua', 'img', 'ch', 'didi_happy.webp')).convert('RGBA')
    didi = didi.resize((110 * K, int(110 * K * didi.height / didi.width)), Image.LANCZOS)
    im.alpha_composite(didi, (int(92 * K), int(95 * K)))
    f = ImageFont.truetype(FONT, 30 * K)
    d.text((148 * K, 58 * K), '小水滴的旅行', font=f, fill=(255, 255, 255, 255), anchor='mm', stroke_width=3 * K, stroke_fill=INK)
    done(im, 'dbook')


def can():
    im, d = canvas(320, 260)
    green, dark = (120, 200, 120, 255), (70, 150, 80, 255)
    d.polygon(S(150, 140, 290, 70, 300, 82, 170, 170), fill=green, outline=INK, width=5 * K)   # 壶嘴
    d.ellipse(S(282, 56, 312, 96), fill=dark, outline=INK, width=4 * K)
    d.rounded_rectangle(S(40, 100, 190, 240), 26 * K, fill=green, outline=INK, width=6 * K)
    d.ellipse(S(40, 86, 190, 120), fill=dark, outline=INK, width=5 * K)
    d.arc(S(70, 50, 160, 170), 190, 350, fill=INK, width=16 * K)                               # 把手（画在最上面）
    d.arc(S(70, 50, 160, 170), 192, 348, fill=dark, width=8 * K)
    d.ellipse(S(70, 160, 110, 200), fill=(255, 230, 120, 255), outline=INK, width=3 * K)   # 小花
    done(im, 'can')


def basin():
    im, d = canvas(320, 220)
    d.polygon(S(22, 66, 298, 66, 255, 190, 65, 190), fill=(140, 195, 240, 255))
    d.ellipse(S(62, 172, 258, 208), fill=(140, 195, 240, 255), outline=INK, width=6 * K)
    d.line(S(22, 66, 65, 190), fill=INK, width=6 * K)
    d.line(S(298, 66, 255, 190), fill=INK, width=6 * K)
    d.ellipse(S(20, 30, 300, 100), fill=(175, 220, 250, 255), outline=INK, width=6 * K)
    d.ellipse(S(40, 42, 280, 92), fill=(190, 235, 255, 255))
    for x, y, r in ((110, 62, 30), (190, 70, 26), (150, 55, 20)):
        d.ellipse(S(x - r, y - r * .5, x + r, y + r * .5), fill=(110, 190, 90, 255), outline=(60, 120, 50, 255), width=3 * K)
    for x in (80, 230):
        d.arc(S(x - 14, 64, x + 14, 80), 200, 340, fill=(255, 255, 255, 255), width=3 * K)
    done(im, 'basin')


def roll():
    im, d = canvas(240, 220)
    d.rectangle(S(50, 40, 190, 170), fill=(255, 255, 255, 255))
    d.line(S(50, 40, 50, 170), fill=INK, width=6 * K)
    d.line(S(190, 40, 190, 170), fill=INK, width=6 * K)
    d.ellipse(S(50, 150, 190, 190), fill=(250, 250, 250, 255), outline=INK, width=6 * K)
    d.ellipse(S(50, 20, 190, 60), fill=(255, 255, 255, 255), outline=INK, width=6 * K)
    d.ellipse(S(100, 32, 140, 48), fill=(200, 160, 120, 255), outline=INK, width=4 * K)
    for y in (80, 115):
        d.line(S(56, y, 184, y), fill=(220, 220, 225, 255), width=3 * K)
    done(im, 'roll')


def stamp():
    im, d = canvas(200, 260)
    d.ellipse(S(60, 10, 140, 90), fill=(235, 90, 90, 255), outline=INK, width=6 * K)
    d.rectangle(S(85, 80, 115, 150), fill=(235, 90, 90, 255), outline=INK, width=5 * K)
    d.rounded_rectangle(S(30, 145, 170, 200), 10 * K, fill=(200, 150, 100, 255), outline=INK, width=6 * K)
    d.rectangle(S(36, 200, 164, 225), fill=(220, 70, 70, 255), outline=INK, width=5 * K)
    done(im, 'stamp')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    card(); dbook(); can(); basin(); roll(); stamp()
