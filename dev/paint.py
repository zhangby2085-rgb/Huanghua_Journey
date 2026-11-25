r"""黄花的生活 第二集：用本机的 Stable Diffusion XL（RTX 4090）画背景和小物件（Gemini 用不了的时候）。

  python dev/paint.py gen [种类...] [--seeds 1,2,3] [--only 名字,名字]
  python dev/paint.py sheet <种类>      拼一张预览图，方便挑
  python dev/paint.py final             按 picks.json 选中的种子放进 huanghua/img/

种类：bg（背景 16:9）  item（白底小物件，抠成透明）
SDXL（CreativeML Open RAIL++-M 许可）。模型在 HuggingFace 缓存里，离线跑。
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(HERE, 'raw')
IMG = os.path.join(ROOT, 'huanghua', 'img')
PICKS = os.path.join(HERE, 'picks.json')

BG_STYLE = ('cute cartoon illustration background for a children\'s picture book game, clean thin outlines, soft pastel colors, '
            'gentle cel shading, anime background art, bright warm sunlight, cozy and cheerful, highly detailed, masterpiece')
IT_STYLE = ('cute children\'s picture book sticker illustration, colored pencil and crayon texture, thick dark brown outlines, '
            'soft pastel colors, plain pure white background, centered, single object, no shadow')
NEG = ('text, letters, words, chinese characters, writing, watermark, signature, logo, people, person, child, human, animal, '
       'character, face, blurry, lowres, jpeg artifacts, deformed, dark, gloomy, photo, realistic, frame, border')

JOBS = [
    ('bg', 'library', 1344, 768, 'interior of a cozy children\'s school library, tall wooden bookshelves full of colorful books '
     'along the back wall, a wooden librarian counter desk on the right side, two low round reading tables with small chairs, '
     'a big window with sunlight on the left, potted plants, colorful rug, empty open wooden floor in the foreground, no people, ' + BG_STYLE),
    ('bg', 'restroom', 1344, 768, 'clean bright children\'s school restroom interior, front view, a row of three closed pastel colored '
     'toilet stall doors along the back wall, white and light blue tiled walls, on the right side two small white sinks with '
     'silver faucets and round mirrors, a little potted plant, bright and cheerful, empty tiled floor in the foreground, no people, ' + BG_STYLE),
    ('bg', 'garden', 1344, 768, 'sunny school flower and vegetable garden, raised wooden flower beds with small green seedlings and '
     'flower buds, a blue rain barrel, a white picket fence, a small stone path, green trees, blue sky with fluffy white clouds, '
     'empty grass in the foreground, no people, ' + BG_STYLE),
    ('item', 'card', 1024, 1024, 'a cute library card, a small light blue rectangular card with a simple open book icon, ' + IT_STYLE),
    ('item', 'roll', 1024, 1024, 'a single roll of soft white toilet paper, ' + IT_STYLE),
    ('item', 'can', 1024, 1024, 'a cute green watering can, side view, ' + IT_STYLE),
    ('item', 'basin', 1024, 1024, 'a round light blue plastic basin filled with clear water and a few green vegetable leaves floating, ' + IT_STYLE),
    ('item', 'stamp', 1024, 1024, 'a small wooden rubber stamp with a red handle, ' + IT_STYLE),
]


def gen(kinds, seeds, only):
    import torch
    os.environ['HF_HUB_OFFLINE'] = '1'
    from diffusers import StableDiffusionXLPipeline
    pipe = StableDiffusionXLPipeline.from_pretrained('stabilityai/stable-diffusion-xl-base-1.0', torch_dtype=torch.float16).to('cuda')
    pipe.set_progress_bar_config(disable=True)
    for kind, name, w, h, prompt in JOBS:
        if kinds and kind not in kinds or only and name not in only:
            continue
        d = os.path.join(RAW, kind)
        os.makedirs(d, exist_ok=True)
        for seed in seeds:
            f = os.path.join(d, '%s_%d.png' % (name, seed))
            if os.path.exists(f):
                continue
            g = torch.Generator('cuda').manual_seed(seed)
            im = pipe(prompt=prompt, negative_prompt=NEG, width=w, height=h, num_inference_steps=34, guidance_scale=6.5, generator=g).images[0]
            im.save(f)
            print(kind, name, seed, flush=True)


def sheet(kind, size=260):
    from PIL import Image, ImageDraw
    d = os.path.join(RAW, kind)
    files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
    names = sorted(set(f.rsplit('_', 1)[0] for f in files))
    seeds = sorted(set(int(f.rsplit('_', 1)[1][:-4]) for f in files))
    sample = Image.open(os.path.join(d, files[0]))
    cw = int(size * sample.width / sample.height)
    S = Image.new('RGB', (cw * len(seeds) + 90, size * len(names)), (40, 40, 40))
    dr = ImageDraw.Draw(S)
    for r, n in enumerate(names):
        dr.text((4, r * size + 4), n, fill=(255, 255, 0))
        for c, s in enumerate(seeds):
            f = os.path.join(d, '%s_%d.png' % (n, s))
            if os.path.exists(f):
                S.paste(Image.open(f).convert('RGB').resize((cw, size)), (90 + c * cw, r * size))
                dr.text((92 + c * cw, r * size + 4), str(s), fill=(255, 255, 255))
    out = os.path.join(RAW, '%s_sheet.jpg' % kind)
    S.save(out, quality=85)
    print(out)


def final():
    from PIL import Image
    import numpy as np
    sys.path.insert(0, HERE)
    import cut_chars
    picks = json.load(open(PICKS, encoding='utf-8'))
    for name, seed in picks.get('bg', {}).items():
        im = Image.open(os.path.join(RAW, 'bg', '%s_%d.png' % (name, seed))).convert('RGB').resize((1672, 941), Image.LANCZOS)
        p = os.path.join(IMG, 'bg', name + '.jpg')
        im.save(p, 'JPEG', quality=86, optimize=True, progressive=True)
        print('bg', name, os.path.getsize(p) // 1024, 'KB')
    os.makedirs(os.path.join(IMG, 'item'), exist_ok=True)
    for name, seed in picks.get('item', {}).items():
        rgb = np.asarray(Image.open(os.path.join(RAW, 'item', '%s_%d.png' % (name, seed))).convert('RGB'))
        size, b = cut_chars.crop_save(cut_chars.cutout(rgb, white_only=True), os.path.join(IMG, 'item', name + '.webp'), 300)
        print('item', name, size, b // 1024, 'KB')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    a = sys.argv[1:]
    cmd = a.pop(0)
    seeds, only = [1, 2, 3, 4], None
    if '--seeds' in a:
        i = a.index('--seeds'); seeds = [int(x) for x in a[i + 1].split(',')]; del a[i:i + 2]
    if '--only' in a:
        i = a.index('--only'); only = a[i + 1].split(','); del a[i:i + 2]
    if cmd == 'gen':
        gen(a, seeds, only)
    elif cmd == 'sheet':
        sheet(a[0])
    elif cmd == 'final':
        final()
