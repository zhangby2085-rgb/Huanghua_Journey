r"""把录好的游戏片段剪成《黄花的生活》介绍视频（1920×1080，中文解说 + 字幕 + 背景音乐）

  python dev/video/make_video.py           全部
  python dev/video/make_video.py --plan    只打印每一段的时间
  python dev/video/make_video.py --still 42   只渲染第 42 秒那一帧（检查版面）

输入：raw/<片段>/（record_all.py）、narr/（narration.py）、music-raw/Carefree.mp3
输出：演示视频/黄花的生活_介绍.mp4 + 封面.png（不进 git）
"""
import json
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
DEV = os.path.dirname(HERE)
GAME = os.path.dirname(DEV)                    # 仓库根目录
RAW = os.path.join(HERE, 'raw')
NARR = os.path.join(HERE, 'narr')
IMG = os.path.join(GAME, 'huanghua', 'img')
OUTDIR = os.path.join(GAME, '演示视频')
OUT = os.path.join(OUTDIR, '黄花的生活_介绍.mp4')
MUSIC = os.path.join(DEV, 'music-raw', 'Carefree.mp3')
if not os.path.exists(MUSIC):                     # mp3 原文件不进 git：用游戏里同一首的 ogg
    MUSIC = os.path.join(GAME, 'huanghua', 'music', 'title.ogg')

FPS, W, H, SR = 30, 1920, 1080, 48000
SX, SY, SW, SH = 160, 108, 1600, 741          # 游戏画面在视频里的位置（录的是 1440×667）
RW, RH = 1440, 667
CAP_Y = 872                                    # 字幕区
WK = os.path.join(DEV, 'font', 'LXGWWenKai-Medium.ttf')
YH = r'C:\Windows\Fonts\msyhbd.ttc'
INK = (74, 46, 28)
CREAM = (255, 248, 230)

CH = {   # 章节：(小标签, 标题, 颜色)
    'intro': ('怎么玩', '跟着故事，点一点', (232, 160, 20)),
    'ep1': ('第一集', '捞月亮', (91, 191, 106)),
    'ep2': ('第二集', '小水滴的旅行', (61, 155, 224)),
    'ep3': ('第三集', '牙齿保卫战', (232, 93, 117)),
    'ep4': ('第四集', '红绿灯小卫士', (61, 154, 79)),
    'ep5': ('第五集', '过大年', (217, 72, 43)),
    'ep6': ('第六集', '我会自己做', (138, 92, 209)),
    'more': ('还有', '贴纸本 · 家长设置', (201, 138, 43)),
}

# (片段, 从第几秒, 到第几秒, 章节, [解说], 解说前空几秒)。'@title' / '@outro' 是做出来的卡片
SEGMENTS = [
    ('@title', 0, 0, None, ['n01', 'n02'], .6),
    ('home', .3, 7.2, 'intro', ['n02b'], .3),
    ('lib', 3, 13.5, 'intro', ['n03'], .4),
    ('lib', 14.5, 21, 'intro', ['n04'], .2),
    ('lib', 27.5, 32, 'intro', [], 0),
    ('lib', 55, 63.5, 'intro', ['n05'], .3),
    ('wash', 16, 24, 'ep1', ['n06'], .3),
    ('rice', 7, 24, 'ep1', ['n07'], .3, {'speed': 2, 'keep': True}),
    ('drop', 8, 19, 'ep2', ['n08'], .3),
    ('drop', 28, 33, 'ep2', [], 0),
    ('drop', 53, 57.5, 'ep2', [], 0),
    ('wake', 5, 18.5, 'ep3', ['n09'], .3, {'speed': 1.45, 'keep': True}),
    ('wake', 38, 47, 'ep3', ['n09b'], .3),
    ('brush', 4, 9.5, 'ep3', ['n10a'], .2),
    ('brush', 16, 28, 'ep3', ['n10b'], .3, {'speed': 1.5, 'keep': True}),
    ('market', 8, 15.5, 'ep3', ['n11'], .3, {'speed': 1.4, 'keep': True}),
    ('pay', 7, 15.5, 'ep3', ['n12'], .3, {'speed': 1.3, 'keep': True}),
    ('balloon', 14, 24, 'ep3', ['n13'], .3),
    ('dentist', 8, 15, 'ep3', ['n14'], .2, {'speed': 1.4, 'keep': True}),
    ('street', 13, 24, 'ep4', ['n15'], .3),
    ('street', 62, 73, 'ep4', ['n16'], .3, {'speed': 1.5, 'keep': True}),
    ('bus', 5.5, 10.5, 'ep4', [], 0),
    ('bus', 22, 42, 'ep4', ['n17'], .3, {'speed': 2.4, 'keep': True}),
    ('park', 3, 24, 'ep4', ['n18'], .3, {'speed': 2, 'keep': True}),
    ('fu', 4, 10.5, 'ep5', ['n19'], .3),
    ('couplet', 11, 25.5, 'ep5', ['n20'], .3, {'speed': 1.8, 'keep': True}),
    ('dumpling', 8.5, 15.5, 'ep5', ['n21'], .2, {'keep': True}),
    ('fire', 8.5, 18, 'ep5', ['n22'], .3, {'keep': True}),
    ('fire', 36.2, 39.4, 'ep5', [], 0),
    ('fold', 2.5, 10.5, 'ep6', ['n23'], .3, {'keep': True}),
    ('sort', 3, 19.5, 'ep6', ['n24'], .3, {'speed': 2, 'keep': True}),
    ('laundry', 3.5, 12, 'ep6', ['n25'], .3, {'keep': True}),
    ('laundry', 19.6, 24.5, 'more', ['n26'], .2, {'keep': True}),
    ('book', .5, 5.8, 'more', [], 0),
    ('settings', .2, 6.3, 'more', ['n27'], .2, {'keep': True}),
    ('@outro', 0, 0, None, ['n28'], .6),
]
GAP, TAIL, DIP, EXTRA = .35, .5, .22, 1.2


def font(path, size):
    return ImageFont.truetype(path, size)


NINFO = json.load(open(os.path.join(NARR, 'narr.json'), encoding='utf-8'))


# ---------------- 时间表 ----------------
def plan():
    out, t = [], 0.0
    for clip, a, b, chap, lines, lead, *opt in SEGMENTS:
        o = opt[0] if opt else {}
        sp = o.get('speed', 1)
        need = lead + sum(NINFO[k]['dur'] for k in lines) + GAP * (len(lines) - 1) + TAIL
        src = (b - a) / sp
        dur = (max(need, src) if o.get('keep') else max(need, min(src, need + EXTRA))) if lines else src   # 画面最多比解说长 EXTRA 秒
        say, s = [], t + lead
        for k in lines:
            say.append((s, k))
            s += NINFO[k]['dur'] + GAP
        out.append(dict(clip=clip, a=a, b=b, chap=chap, t0=t, dur=dur, say=say, speed=sp))
        t += dur
    return out, t


# ---------------- 片段 ----------------
class Clip:
    def __init__(self, name):
        self.dir = os.path.join(RAW, name)
        d = json.load(open(os.path.join(self.dir, 'frames.json'), encoding='utf-8'))
        self.frames = d['frames']
        self.ts = np.array([f[1] for f in self.frames])
        self.f0 = self.ts[0]
        self.cache = (None, None)
        # 点击：Python 的真实触摸 + 页面里小朋友机器人的点击
        self.taps, self.drags = [], []
        cur = None
        for t, kind, pts in d.get('touches', []):
            if kind == 'touchStart':
                cur = [(t - self.f0, pts[0][0], pts[0][1])]
            elif kind == 'touchMove' and cur is not None:
                cur.append((t - self.f0, pts[0][0], pts[0][1]))
            elif kind == 'touchEnd' and cur is not None:
                cur.append((t - self.f0, cur[-1][1], cur[-1][2]))
                if len(cur) <= 3:
                    self.taps.append(cur[0])
                else:
                    self.drags.append(cur)
                cur = None
        for t, x, y in d.get('taps', []):
            self.taps.append((t - self.f0, x, y))
        self.last = self.ts[-1] - self.f0

    def frame(self, s):
        i = int(np.searchsorted(self.ts, self.f0 + s, side='right') - 1)
        i = max(0, min(i, len(self.frames) - 1))
        if self.cache[0] != i:
            im = Image.open(os.path.join(self.dir, self.frames[i][0])).convert('RGB').resize((SW, SH), Image.BILINEAR)
            self.cache = (i, im)
        return self.cache[1]


# ---------------- 画面元素 ----------------
def gradient(top, bottom, w=W, h=H):
    a = np.linspace(0, 1, h)[:, None, None]
    g = (np.array(top)[None, None] * (1 - a) + np.array(bottom)[None, None] * a)
    return Image.fromarray(np.repeat(g, w, 1).astype(np.uint8), 'RGB')


def petals(im, seed=3, n=26, alpha=40):
    rnd = np.random.RandomState(seed)
    lay = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for _ in range(n):
        x, y, r = rnd.randint(0, im.size[0]), rnd.randint(0, im.size[1]), rnd.randint(10, 26)
        col = [(255, 210, 63), (255, 143, 163), (126, 200, 255), (126, 214, 120)][rnd.randint(4)]
        for k in range(5):
            a = k * 2 * math.pi / 5 + rnd.rand()
            cx, cy = x + math.cos(a) * r * .7, y + math.sin(a) * r * .7
            d.ellipse([cx - r * .45, cy - r * .45, cx + r * .45, cy + r * .45], fill=col + (alpha,))
    im.paste(lay, (0, 0), lay)
    return im


def pill(d, x, y, text, f, fill, color=(255, 255, 255), pad=(26, 8)):
    bb = d.textbbox((0, 0), text, font=f)
    w, h = bb[2] - bb[0] + pad[0] * 2, bb[3] - bb[1] + pad[1] * 2
    d.rounded_rectangle([x, y, x + w, y + h], radius=h // 2, fill=fill, outline=INK, width=4)
    d.text((x + pad[0] - bb[0], y + pad[1] - bb[1]), text, font=f, fill=color)
    return w


def chrome(chap):
    """一章的底图：背景、上面的标题、手机外框"""
    bg = petals(gradient((255, 247, 226), (255, 226, 170)))
    d = ImageDraw.Draw(bg)
    tag, title, col = CH[chap]
    x = SX
    x += pill(d, x, 26, tag, font(WK, 40), col) + 22
    d.text((x, 22), title, font=font(WK, 56), fill=INK)
    # 右上角小标志
    f = font(WK, 40)
    t = '黄花的生活'
    bb = d.textbbox((0, 0), t, font=f)
    d.text((SX + SW - (bb[2] - bb[0]), 30), t, font=f, fill=(201, 138, 43))
    flower = Image.open(os.path.join(IMG, 'ch', 'huanghua_jump.webp')).convert('RGBA')
    flower.thumbnail((84, 84))
    bg.paste(flower, (SX + SW - (bb[2] - bb[0]) - flower.size[0] - 10, 12), flower)
    # 手机外框（带影子）
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([SX - 20, SY - 20 + 14, SX + SW + 20, SY + SH + 20 + 14], radius=58, fill=(90, 55, 25, 110))
    sh = sh.filter(ImageFilter.GaussianBlur(16))
    bg.paste(sh, (0, 0), sh)
    d = ImageDraw.Draw(bg)
    d.rounded_rectangle([SX - 20, SY - 20, SX + SW + 20, SY + SH + 20], radius=58, fill=(52, 38, 30))
    d.ellipse([SX + SW + 3, SY + SH / 2 - 7, SX + SW + 17, SY + SH / 2 + 7], fill=(90, 72, 60))
    return np.asarray(bg).copy()


def screen_mask():
    m = Image.new('L', (SW, SH), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, SW - 1, SH - 1], radius=36, fill=255)
    return (np.asarray(m, np.float32) / 255)[:, :, None]


def caption(text):
    """字幕：两行以内，居中"""
    f = font(WK, 48)
    im = Image.new('RGBA', (W, H - CAP_Y), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    import re
    toks = re.findall(r'——|[^，。；：！？、——]+[，。；：！？、”」》]*', text)
    lines = ['']
    for tk in toks:
        if lines[-1] and d.textlength(lines[-1] + tk, font=f) > 1700:
            lines.append('')
        lines[-1] += tk
    # 两行的话尽量一样长：把第一行末尾的小段挪到第二行
    while len(lines) == 2:
        t1 = re.findall(r'——|[^，。；：！？、——]+[，。；：！？、”」》]*', lines[0])
        if len(t1) < 2:
            break
        nl0, nl1 = ''.join(t1[:-1]), t1[-1] + lines[1]
        if d.textlength(nl1, font=f) <= d.textlength(nl0, font=f) or d.textlength(lines[1], font=f) < d.textlength(lines[0], font=f) * .45:
            if d.textlength(nl1, font=f) > 1700:
                break
            lines = [nl0, nl1]
            if d.textlength(nl1, font=f) > d.textlength(nl0, font=f):
                break
        else:
            break
    lh = 64
    y = (H - CAP_Y - lh * len(lines)) // 2 - 4
    for ln in lines:
        w = d.textlength(ln, font=f)
        d.text(((W - w) / 2, y), ln, font=f, fill=INK, stroke_width=5, stroke_fill=(255, 250, 238))
        y += lh
    return im


def ripple(d, x, y, k):
    """点击的小圆圈：k 0→1"""
    r = 20 + 46 * k
    a = int(220 * (1 - k))
    d.ellipse([x - r, y - r, x + r, y + r], outline=(255, 255, 255, a), width=6)
    if k < .5:
        d.ellipse([x - 16, y - 16, x + 16, y + 16], fill=(255, 255, 255, int(170 * (1 - k * 2))))


def to_video(x, y):
    return SX + x * SW / RW, SY + y * SH / RH


# ---------------- 封面卡片 ----------------
CAST = [('ch/ma.webp', 1.18), ('ch/alan.webp', 1.08), ('ch/maomao.webp', .92), ('ch/yaya_happy.webp', .55), ('ch/huanghua_jump.webp', .95),
        ('ch/didi_happy.webp', .5), ('ch/caomei.webp', .98), ('ch/huihui.webp', .92), ('ch/beike.webp', .9)]


def card(kind, t):
    bg = petals(gradient((255, 243, 210), (255, 214, 150)), seed=7, n=40, alpha=55)
    d = ImageDraw.Draw(bg)
    f = font(WK, 190 if kind == 'title' else 150)
    title = '黄花的生活'
    bb = d.textbbox((0, 0), title, font=f)
    tw = bb[2] - bb[0]
    ty = 70 if kind == 'title' else 40
    pop = min(1, t / .5)
    x0 = (W - tw) / 2
    d.text((x0, ty), '黄花', font=f, fill=(255, 210, 63), stroke_width=16, stroke_fill=INK)
    d.text((x0 + d.textlength('黄花', font=f), ty), '的生活', font=f, fill=(255, 255, 255), stroke_width=16, stroke_fill=INK)
    sub = font(WK, 50)
    if kind == 'title':
        s = '陪小朋友一起长大的拼音小游戏'
        d.text(((W - d.textlength(s, font=sub)) / 2, ty + 250), s, font=sub, fill=INK)
        chips = ['安卓手机 · 横屏', '六集 · 十八站', '全程中文配音']
    else:
        s = '六集故事 · 十八站 · 五十多关 · 几十个好习惯'
        d.text(((W - d.textlength(s, font=sub)) / 2, ty + 200), s, font=sub, fill=INK)
        chips = ['捞月亮', '小水滴的旅行', '牙齿保卫战', '红绿灯小卫士', '过大年', '我会自己做']
    cf = font(WK, 38)
    widths = [d.textlength(c, font=cf) + 52 for c in chips]
    x = (W - sum(widths) - 18 * (len(chips) - 1)) / 2
    cols = [(91, 191, 106), (61, 155, 224), (232, 93, 117), (61, 154, 79), (217, 72, 43), (138, 92, 209)]
    cy = ty + (340 if kind == 'title' else 285)
    for i, c in enumerate(chips):
        pill(d, x, cy, c, cf, cols[i % len(cols)])
        x += widths[i] + 18
    # 一排小伙伴，轮流跳一跳
    base_y = H - (40 if kind == 'title' else 120)
    hs = 330 if kind == 'title' else 270
    ims = []
    for src, k in CAST:
        im = Image.open(os.path.join(IMG, src)).convert('RGBA')
        h = int(hs * k)
        ims.append(im.resize((int(im.size[0] * h / im.size[1]), h), Image.LANCZOS))
    total = sum(im.size[0] for im in ims) - 26 * (len(ims) - 1)
    x = (W - total) / 2
    for i, im in enumerate(ims):
        ph = (t * 1.6 - i * .16) % 1.2
        hop = math.sin(ph / .45 * math.pi) * 34 if ph < .45 else 0
        bg.paste(im, (int(x), int(base_y - im.size[1] - hop * pop)), im)
        x += im.size[0] - 26
    if kind == 'outro':
        cr = font(YH, 22)
        lines = ['解说：微软 Edge 神经网络声音（晓晓）· 音乐：《Carefree》Kevin MacLeod（incompetech.com），CC BY 4.0',
                 '第一集角色图由家长提供 · 第二集背景 Stable Diffusion XL · 第三~六集图画 Google Gemini · 字体：霞鹜文楷（OFL）']
        for i, ln in enumerate(lines):
            d.text(((W - d.textlength(ln, font=cr)) / 2, H - 92 + i * 34), ln, font=cr, fill=(120, 84, 50))
    return np.asarray(bg)


# ---------------- 渲染 ----------------
def render(segs, total, only=None):
    mask = screen_mask()
    bases, clips, caps = {}, {}, {}
    for k in NINFO:
        caps[k] = caption(NINFO[k]['text'])
    enc = None
    if only is None:
        os.makedirs(OUTDIR, exist_ok=True)
        enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, H), '-r', str(FPS), '-i', '-',
                                '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', os.path.join(HERE, '_video.mp4')],
                               stdin=subprocess.PIPE)
    n = int(round(total * FPS))
    frames = [int(round(only * FPS))] if only is not None else range(n)
    si = 0
    for fi in frames:
        t = fi / FPS
        while si < len(segs) - 1 and t >= segs[si + 1]['t0']:
            si += 1
        sg = segs[si]
        lt = t - sg['t0']
        if sg['clip'].startswith('@'):
            arr = card(sg['clip'][1:], lt).copy()
            img = Image.fromarray(arr)
        else:
            if sg['chap'] not in bases:
                bases[sg['chap']] = chrome(sg['chap'])
            if sg['clip'] not in clips:
                clips[sg['clip']] = Clip(sg['clip'])
            cl = clips[sg['clip']]
            s = min(sg['a'] + lt * sg['speed'], cl.last)
            arr = bases[sg['chap']].copy()
            g = np.asarray(cl.frame(s), np.float32)
            edge = min(lt, sg['dur'] - lt)
            if edge < DIP:                                  # 每一段开头结尾淡一下
                g = g * (edge / DIP) + 255 * (1 - edge / DIP)
            reg = arr[SY:SY + SH, SX:SX + SW].astype(np.float32)
            arr[SY:SY + SH, SX:SX + SW] = (g * mask + reg * (1 - mask)).astype(np.uint8)
            img = Image.fromarray(arr)
            ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            od = ImageDraw.Draw(ov)
            for tt, x, y in cl.taps:
                k = (s - tt) / .5
                if 0 <= k < 1:
                    ripple(od, *to_video(x, y), k)
            for dr in cl.drags:                             # 手指划过去：一个白点跟着走，后面拖一条淡淡的线
                if dr[0][0] - .05 <= s <= dr[-1][0] + .3:
                    pts = [to_video(x, y) for tt, x, y in dr if tt <= s]
                    if len(pts) > 1:
                        od.line(pts[-12:], fill=(255, 255, 255, 120), width=10, joint='curve')
                    if pts and s <= dr[-1][0]:
                        x, y = pts[-1]
                        od.ellipse([x - 20, y - 20, x + 20, y + 20], fill=(255, 255, 255, 150), outline=(255, 255, 255, 230), width=4)
            img.paste(ov, (0, 0), ov)
        # 字幕
        for st, k in sg['say']:
            if st <= t <= st + NINFO[k]['dur'] + .35 and not sg['clip'].startswith('@'):
                img.paste(caps[k], (0, CAP_Y), caps[k])
        if only is not None:
            p = os.path.join(HERE, 'still_%d.jpg' % int(only))
            img.save(p, quality=88)
            print(p)
            return
        enc.stdin.write(img.tobytes())
        if fi % (FPS * 10) == 0:
            print('  %3.0f / %.0f s' % (t, total), flush=True)
    enc.stdin.close()
    enc.wait()


# ---------------- 声音 ----------------
def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def pop_sound():
    t = np.arange(int(SR * .09)) / SR
    f = 620 + 500 * t / .09
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38) * .22
    return s.astype(np.float32)


def build_audio(segs, total):
    n = int(total * SR) + SR
    voice = np.zeros(n, np.float32)
    talk = np.zeros(n, np.float32)
    for sg in segs:
        for st, k in sg['say']:
            a = decode(os.path.join(NARR, NINFO[k]['file']))
            i = int(st * SR)
            voice[i:i + len(a)] += a[:n - i]
            talk[i:i + len(a)] = 1
    # 点击声
    pop = pop_sound()
    clips = {}
    for sg in segs:
        if sg['clip'].startswith('@'):
            continue
        cl = clips.setdefault(sg['clip'], Clip(sg['clip']))
        for tt, x, y in cl.taps + [d[0] for d in cl.drags]:
            if sg['a'] <= tt <= sg['a'] + (sg['dur'] - .1) * sg['speed']:
                i = int((sg['t0'] + (tt - sg['a']) / sg['speed']) * SR)
                voice[i:i + len(pop)] += pop[:max(0, n - i)] * .6
    # 背景音乐：说话的时候小声一点
    m = decode(MUSIC)
    while len(m) < n:                               # 不够长就接一遍，接头处交叉淡入淡出 3 秒
        x = 3 * SR
        r = np.linspace(0, 1, x, dtype=np.float32)
        m0 = decode(MUSIC)
        m = np.concatenate([m[:-x], m[-x:] * (1 - r) + m0[:x] * r, m0[x:]])
    m = m[:n]
    k = int(SR * .35)
    env = np.convolve(talk, np.ones(k) / k, mode='same')
    vol = .30 - .16 * env
    fade = np.ones(n, np.float32)
    fade[:SR] = np.linspace(0, 1, SR)
    end = int(total * SR)
    fade[end - 3 * SR:end] = np.linspace(1, 0, 3 * SR)
    fade[end:] = 0
    mix = voice + m * vol * fade
    mix = mix[:end]
    mix = np.clip(mix, -1, 1)
    p = os.path.join(HERE, '_audio.wav')
    import wave
    with wave.open(p, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32000).astype(np.int16).tobytes())
    return p


def mux(audio):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', os.path.join(HERE, '_video.mp4'), '-i', audio,
                    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
                    '-movflags', '+faststart', OUT], check=True)
    Image.fromarray(card('title', 2.0)).save(os.path.join(OUTDIR, '封面.png'))


def main():
    segs, total = plan()
    if '--plan' in sys.argv:
        for sg in segs:
            src = sg['b'] - sg['a']
            print('%6.1f  %-9s %5.1f-%5.1f  dur %4.1f (src %4.1f x%.1f)  %s' % (sg['t0'], sg['clip'], sg['a'], sg['b'], sg['dur'], src, sg['speed'],
                                                                    ' '.join('%s@%.1f' % (k, s) for s, k in sg['say'])))
        print('total %.1f s' % total)
        return
    if '--still' in sys.argv:
        render(segs, total, only=float(sys.argv[sys.argv.index('--still') + 1]))
        return
    if '--mux-only' not in sys.argv:
        render(segs, total)
    mux(build_audio(segs, total))
    print(OUT)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
