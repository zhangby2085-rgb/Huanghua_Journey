r"""第三~六集的 Gemini 图（黄花的生活/gemini2/*.png）切成游戏素材。

  python dev/cut2.py [表名...]

角色表 → huanghua/img/ch/，物品表 → huanghua/img/item/，背景 → huanghua/img/bg/（1672 宽 JPG）
"""
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cut_chars as cc  # noqa: E402

G2 = os.path.join(cc.SRC, 'gemini2')
SHEETS = {
    # 名字: (列, 行, 前缀, 最大高度, [各格的名字])
    'npcs': (3, 2, '', 760, ['mama', 'baba', 'hema', 'jc', 'nn', 'zhu']),
    'poses3': (3, 2, 'huanghua_', 760, ['brush', 'yawn', 'sleep', 'toothache', 'hongbao', 'tangzhuang']),
    'items3': (4, 3, '../item/', 300, ['toothbrush', 'toothpaste', 'cup2', 'clock', 'socks', 'pants', 'tshirt', 'coat', 'shoes', 'milk', 'egg', 'bread']),
    'items4': (4, 3, '../item/', 300, ['candy', 'lollipop', 'apple', 'banana', 'coin1', 'coin5', 'basket', 'ecobag', 'plasticbag', 'balloon', 'buscard', 'purse']),
    'items5': (4, 3, '../item/', 300, ['lantern', 'hongbao', 'piggy', 'wrapper', 'filling', 'dumpling', 'orange', 'niangao', 'sparkler', 'firecracker', 'knot', 'rollpin']),
    'items6': (4, 3, '../item/', 300, ['schoolbag', 'textbook', 'pencilcase', 'pencil', 'blocks', 'teddy', 'toycar', 'toybox', 'fishfood', 'fishbowl', 'folded', 'ball2']),
}
BGS = ['bedroom', 'bathroom', 'market', 'clinic', 'street', 'bus', 'park', 'fair', 'living', 'balcony']


def main(only):
    os.makedirs(os.path.join(cc.OUT, 'item'), exist_ok=True)
    for name, (cols, rows, prefix, maxh, names) in SHEETS.items():
        f = os.path.join(G2, name + '.png')
        if (only and name not in only) or not os.path.exists(f):
            continue
        item = prefix.startswith('../item')
        for r in cc.cut_sheet(f, names, cols, rows, prefix, maxh=maxh, near_px=22 if item else 5, min_frac=.02 if item else .08):
            print(name, r[0], r[1], r[2], 'KB')
    for b in BGS:
        f = os.path.join(G2, 'bg_' + b + '.png')
        if (only and b not in only and 'bg' not in only) or not os.path.exists(f):
            continue
        im = Image.open(f).convert('RGB')
        # 裁成 16:9 再缩到 1672×941
        w, h = im.size
        if w / h > 16 / 9:
            nw = int(h * 16 / 9); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
        else:
            nh = int(w * 9 / 16); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
        im = im.resize((1672, 941), Image.LANCZOS)
        p = os.path.join(cc.OUT, 'bg', b + '.jpg')
        im.save(p, 'JPEG', quality=86, optimize=True, progressive=True)
        print('bg', b, os.path.getsize(p) // 1024, 'KB')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main(sys.argv[1:])
