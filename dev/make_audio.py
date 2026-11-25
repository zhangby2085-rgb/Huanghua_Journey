r"""黄花的生活：配音、字体子集。

  python dev/make_audio.py scan    列出多音字（看 SAY 表要不要补）
  python dev/make_audio.py voice   合成新的或改过的句子 → huanghua/voice.js
  python dev/make_audio.py font    霞鹜文楷子集 → huanghua/font.woff2

配音用微软 Edge 的神经网络声音（要联网），缓存在 clips/，只合成新句子。
Edge 不能标拼音，读错的多音字把读音确定的同音字发给 TTS（SAY 表，一个字换一个字），屏幕上仍显示原文。
"""
import asyncio
import base64
import hashlib
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'huanghua')
CLIPS = os.path.join(HERE, 'clips')
sys.path.insert(0, HERE)
import content  # noqa: E402

# 原文 → 发给 TTS 的同音写法（同样长度）
SAY = [
    ('倒挂', '到挂'), ('倒影', '到影'), ('好好地', '好好的'), ('轻轻地', '轻轻的'), ('小心地', '小心的'),
    ('还给', '环给'), ('盛', '成'), ('转', '赚'), ('倒掉', '到掉'), ('倒回', '到回'), ('种粮食', '众粮食'), ('还书', '环书'), ('长得高', '涨得高'), ('福倒了', '福到了'), ('倒着贴', '到着贴'), ('按时还', '按时环'), ('书背', '书被'), ('哗哗地', '哗哗的'),
]
SAY_ID = {
    'w_la4': '辣', 'w_shang1': '商', 'w_huan': '环', 'q_huan': '环书的环',
}


def tts_text(id_, t):
    if id_ in SAY_ID:
        return SAY_ID[id_]
    for a, b in SAY:
        assert len(a) == len(b), (a, b)
        t = t.replace(a, b)
    return t


def scan():
    from pypinyin import pinyin, Style
    seen = {}
    for k, v, t in content.all_spoken():
        s = tts_text(k, t)
        for i, (ch, py) in enumerate(zip(s, pinyin(s, style=Style.TONE, heteronym=True, errors=lambda x: [[''] for _ in x]))):
            if len(py) > 1 and ch not in '的一不了么':
                seen.setdefault(ch + ' ' + '/'.join(py), []).append(s[max(0, i - 4):i + 4])
    for k, v in sorted(seen.items()):
        print(k, '  ', ' | '.join(sorted(set(v))[:10]))


async def synth(text, voice, rate, pitch, mp3):
    import edge_tts
    c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    with open(mp3, 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio':
                f.write(ch['data'])


def clip_path(k, v, t):
    _, name, rate, pitch = content.VOICES[v]
    text = tts_text(k, t)
    key = hashlib.sha1(('%s|%s|%s|%s' % (name, rate, pitch, text)).encode('utf-8')).hexdigest()[:12]
    return os.path.join(CLIPS, key + '.ogg'), text, name, rate, pitch


def make_one(k, v, t):
    ogg, text, name, rate, pitch = clip_path(k, v, t)
    if os.path.exists(ogg):
        return False
    mp3 = ogg[:-4] + '.mp3'
    for attempt in range(5):
        try:
            asyncio.run(synth(text, name, rate, pitch, mp3))
            if os.path.getsize(mp3) > 500:
                break
        except Exception as e:  # 网络偶尔断
            print('retry', k, e)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-af',
                    'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03,'
                    'areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse,apad=pad_dur=0.04',
                    '-ac', '1', '-c:a', 'libopus', '-b:a', '28k', ogg], check=True)
    os.remove(mp3)
    return True


def voice():
    os.makedirs(CLIPS, exist_ok=True)
    out, new = {}, 0
    items = content.all_spoken()
    for i, (k, v, t) in enumerate(items):
        if make_one(k, v, t):
            new += 1
            print('+ %d/%d %s %s' % (i + 1, len(items), k, t))
        ogg = clip_path(k, v, t)[0]
        out[k] = 'data:audio/ogg;base64,' + base64.b64encode(open(ogg, 'rb').read()).decode('ascii')
    path = os.path.join(OUT, 'voice.js')
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write('/* 生成文件：dev/make_audio.py voice（微软 Edge 神经网络声音） */\n')
        fh.write('window.HH_VOICE=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('新合成 %d 句，共 %d 句，%.2f MB' % (new, len(out), os.path.getsize(path) / 1e6))


def font():
    from fontTools import subset
    src = os.path.join(HERE, 'font', 'LXGWWenKai-Medium.ttf')
    text = content.all_text()
    files = ['huanghua.html'] + ['huanghua/' + n for n in os.listdir(OUT)
                                 if n.endswith(('.js', '.css')) and n not in ('voice.js',)]
    for f in files:
        text += ''.join(re.findall(r'[　-〿一-鿿＀-￯“”‘’…—·《》]', open(os.path.join(ROOT, f), encoding='utf-8').read()))
    text += '0123456789abcdefghijklmnopqrstuvwxyzāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüABCDEFGHIJKLMNOPQRSTUVWXYZ!?,.:;()-+/×=%~ '
    chars = ''.join(sorted(set(text)))
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    f = subset.load_font(src, opts)
    s = subset.Subsetter(opts)
    s.populate(text=chars)
    s.subset(f)
    dst = os.path.join(OUT, 'font.woff2')
    subset.save_font(f, dst, opts)
    with open(os.path.join(OUT, 'font-OFL.txt'), 'w', encoding='utf-8') as fh:
        fh.write('LXGW WenKai (霞鹜文楷) - SIL Open Font License 1.1 - https://github.com/lxgw/LxgwWenKai\n')
    print(len(chars), 'chars,', os.path.getsize(dst) // 1024, 'KB')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'voice'
    {'scan': scan, 'voice': voice, 'font': font}[cmd]()
