r"""把 黄花的生活/ 里的角色图抠成透明 WebP，背景图转成 JPG → ../huanghua/img/

  python dev/cut_chars.py

角色图都有深棕色粗描边：从图片四边往里"灌水"，碰到描边就停，灌到的地方就是背景。
（黄花那张背景不是纯白，有灰色虚影，所以不用"白色"判断，而用"描边挡住"判断。）
脚下的阴影也一起去掉，游戏里用代码画影子。
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'art')
OUT = os.path.join(ROOT, 'huanghua', 'img')

CHARS = {  # 文件名 → 游戏里的 id
    '黄花小猫': 'huanghua0', '小马老师': 'ma', '毛毛小猫': 'maomao', '灰灰小狗': 'huihui',
    '草莓兔子': 'caomei', '贝壳小猫': 'beike', '阿兰小象': 'alan',
}
BGS = {'阳光明亮的温馨教室': 'classroom', '阳光明媚的校园运动场': 'playground', '中式餐厅的福字圆桌景致': 'restaurant'}


def cutout(rgb, dark_lum=125, seal=3, white_only=False, keep_main=True):
    """white_only：Gemini 的图是纯白底、描边是铅笔质感（有小缺口），只让"白色"的地方算背景，免得灌进身体里"""
    a = rgb.astype(np.float32)
    lum = a @ np.array([.299, .587, .114], np.float32)
    dark = lum < dark_lum
    barrier = ndimage.binary_dilation(dark, iterations=seal)
    cand = ~barrier
    if white_only:
        mx, mn = a.max(axis=2), a.min(axis=2)
        cand &= (mn > 228) & (mx - mn < 22)
    lab, n = ndimage.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    # 把被 barrier 吃掉的那一圈还回给背景（只还不是描边的像素）
    grow = ndimage.binary_dilation(bg, iterations=seal + 1) & ~dark
    if white_only:
        mx, mn = a.max(axis=2), a.min(axis=2)
        grow &= (mn > 200) & (mx - mn < 40)
    bg = bg | grow
    alpha = (~bg).astype(np.float32)
    # 描边外缘柔化 1 像素
    alpha = ndimage.gaussian_filter(alpha, 0.8)
    alpha = np.where(bg & (alpha < .5), alpha * .6, alpha)
    # 只留主体：最大的一块，加上离它很近的小块（胡须尖、鞋子之类）；远处的灰影、阴影残渣去掉
    solid = alpha > .5
    lab2, n2 = ndimage.label(solid)
    if n2 > 1 and keep_main:
        sizes = ndimage.sum(solid, lab2, range(1, n2 + 1))
        main_id = int(np.argmax(sizes)) + 1
        near = ndimage.binary_dilation(lab2 == main_id, iterations=12)
        for i in range(1, n2 + 1):
            if i != main_id and not (near & (lab2 == i)).any():
                alpha[ndimage.binary_dilation(lab2 == i, iterations=2)] = 0
    return np.dstack([rgb, (alpha * 255).clip(0, 255).astype(np.uint8)])


def crop_save(rgba, path, maxh=760):
    al = rgba[:, :, 3]
    ys, xs = np.where(al > 128)
    pad = 6
    y0, y1 = max(0, ys.min() - pad), min(al.shape[0], ys.max() + pad)
    x0, x1 = max(0, xs.min() - pad), min(al.shape[1], xs.max() + pad)
    im = Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA')
    if im.size[1] > maxh:
        im = im.resize((round(im.size[0] * maxh / im.size[1]), maxh), Image.LANCZOS)
    im.save(path, 'WEBP', quality=88, method=6)
    return im.size, os.path.getsize(path)


ITEMS = ['net', 'scope', 'book', 'cup', 'brush', 'map', 'ball', 'clip']  # 物品，4 列 × 2 行
POSES = ['stand', 'walk', 'hand', 'reach', 'jump', 'bag']  # Gemini 画的黄花 6 个姿势，3 列 × 2 行


GEMINI = {  # 用户放进 黄花的生活/ 的 Gemini 图：文件名里含其中一个词就算
    'poses': ('姿态',), 'items': ('物品',), 'dusk': ('暮色',), 'dishes': ('菜品', '美食'), 'sink': ('洗手台', '盥洗'), 'paws': ('爪子',),
}
DISHES = ['baozi', 'jiaozi', 'tangyuan', 'yu', 'tang', 'qingcai', 'rice', 'bowl', 'pot', 'box', 'soap', 'towel']  # 4 列 × 3 行


def find_file(kind):
    keys = GEMINI[kind]
    fs = [os.path.join(SRC, f) for f in os.listdir(SRC)
          if any(k in f for k in keys) and f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
    return max(fs, key=os.path.getmtime) if fs else None


def cut_sheet(path, names, cols, rows, prefix, maxh=760, near_px=5, min_frac=0.08):
    """一张图里有好几个角色/物品：整张抠图，再按"大块"分开，按所在格子命名"""
    rgb = np.asarray(Image.open(path).convert('RGB'))
    H, W = rgb.shape[:2]
    rgba = cutout(rgb, white_only=True, keep_main=False)
    solid = rgba[:, :, 3] > 128
    lab, n = ndimage.label(solid)
    sizes = ndimage.sum(solid, lab, range(1, n + 1))
    big = [i + 1 for i, s in enumerate(sizes) if s > sizes.max() * min_frac]
    cells = {}
    for b in big:
        ys, xs = np.where(lab == b)
        c = min(cols - 1, int(xs.mean() / W * cols)) + cols * min(rows - 1, int(ys.mean() / H * rows))
        cells.setdefault(c, []).append(b)
    assert len(cells) == len(names), '找到 %d 块，要 %d 块：%s' % (len(cells), len(names), sorted(cells))
    out = []
    for c, ids in sorted(cells.items()):
        m = np.isin(lab, ids)
        m = ndimage.binary_dilation(m, iterations=near_px)
        # 把离主体很近的小块（胡须尖）也算进来，其它都透明
        keep = np.isin(lab, [i for i in range(1, n + 1) if (m & (lab == i)).any()])
        keep = ndimage.binary_dilation(keep, iterations=2)
        part = rgba.copy()
        part[:, :, 3] = np.where(keep, part[:, :, 3], 0)
        size, nb = crop_save(part, os.path.join(OUT, 'ch', prefix + names[c] + '.webp'), maxh)
        out.append((names[c], size, nb // 1024))
    return out


def main(only=None):
    os.makedirs(os.path.join(OUT, 'ch'), exist_ok=True)
    os.makedirs(os.path.join(OUT, 'bg'), exist_ok=True)
    for name, cid in CHARS.items():
        if only and cid not in only:
            continue
        rgb = np.asarray(Image.open(os.path.join(SRC, name + '.jpg')).convert('RGB'))
        size, b = crop_save(cutout(rgb), os.path.join(OUT, 'ch', cid + '.webp'))
        print(cid, size, b // 1024, 'KB')
    f = find_file('poses')
    if f and (not only or 'poses' in only):
        for r in cut_sheet(f, POSES, 3, 2, 'huanghua_'):
            print('huanghua_%s' % r[0], r[1], r[2], 'KB')
    f = find_file('dusk')
    if f and (not only or 'dusk' in only):
        im = Image.open(f).convert('RGB')
        im = im.resize((1672, round(im.size[1] * 1672 / im.size[0])), Image.LANCZOS)
        p = os.path.join(OUT, 'bg', 'playground_dusk.jpg')
        im.save(p, 'JPEG', quality=86, optimize=True, progressive=True)
        print('playground_dusk', im.size, os.path.getsize(p) // 1024, 'KB')
    f = find_file('dishes')
    if f and (not only or 'dishes' in only):
        os.makedirs(os.path.join(OUT, 'dish'), exist_ok=True)
        for r in cut_sheet(f, DISHES, 4, 3, '../dish/', maxh=360):
            print('dish', r[0], r[1], r[2], 'KB')
        import shutil
        os.makedirs(os.path.join(OUT, 'item'), exist_ok=True)
        shutil.copy(os.path.join(OUT, 'dish', 'box.webp'), os.path.join(OUT, 'item', 'box.webp'))
    f = find_file('sink')
    if f and (not only or 'sink' in only):
        im = Image.open(f).convert('RGB')
        im = im.resize((1672, round(im.size[1] * 1672 / im.size[0])), Image.LANCZOS)
        p = os.path.join(OUT, 'bg', 'sink.jpg')
        im.save(p, 'JPEG', quality=86, optimize=True, progressive=True)
        print('sink', im.size, os.path.getsize(p) // 1024, 'KB')
    f = find_file('items')
    if f and (not only or 'items' in only):
        os.makedirs(os.path.join(OUT, 'item'), exist_ok=True)
        for r in cut_sheet(f, ITEMS, 4, 2, '../item/', maxh=300):
            print('item', r[0], r[1], r[2], 'KB')
    if not only:
        for name, bid in BGS.items():
            im = Image.open(os.path.join(SRC, name + '.png')).convert('RGB')
            p = os.path.join(OUT, 'bg', bid + '.jpg')
            im.save(p, 'JPEG', quality=86, optimize=True, progressive=True)
            print(bid, im.size, os.path.getsize(p) // 1024, 'KB')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main(sys.argv[1:] or None)
