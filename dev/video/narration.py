r"""演示视频的中文解说：台词 + 用 Edge 神经网络声音合成（缓存在 video/narr/，改了台词才重新合成）

  python dev/video/narration.py
"""
import asyncio
import hashlib
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'narr')
VOICE, RATE = 'zh-CN-XiaoxiaoNeural', '-3%'

LINES = [
    ('n01', '这是《黄花的生活》，一个陪小朋友一起长大的拼音小游戏。'),
    ('n02', '主角是小猫黄花，还有她的好朋友们：小马老师、毛毛、灰灰、草莓、贝壳和阿兰。'),
    ('n02b', '首页上有六集故事，想玩哪一集，就点哪一集。'),
    ('n03', '每一关都是一个小故事。点一点屏幕，就能帮黄花做事情；大家说的每一句话，都有配音。'),
    ('n04', '遇到拼音卡片，先听一听，再选一选，选对了，故事就继续往下走。'),
    ('n05', '学会一个好习惯，成长小黄花就开一片花瓣。七片花瓣全开，这一集就完成啦。'),
    ('n06', '第一集《捞月亮》。吃饭前，先把小爪子洗干净。'),
    ('n07', '米饭盛到线就停，吃得干干净净，掉在桌上的米粒也捡起来。'),
    ('n08', '第二集，《小水滴的旅行》。小水滴被太阳晒一晒，变成白云，再变成雨。'),
    ('n09', '第三集《牙齿保卫战》。闹钟响啦，点一点黄花，叫她起床。'),
    ('n09b', '昨晚吃了太多糖，嘴巴里的小牙牙喊救命啦！'),
    ('n10a', '按住按钮，挤一颗小豆子那么大的牙膏。'),
    ('n10b', '上面的牙往下刷，下面的牙往上刷，把蛀虫小怪赶跑。'),
    ('n11', '去超市照着拼音清单买东西，'),
    ('n12', '自己数一数硬币付钱，再用环保袋装回家。'),
    ('n13', '看牙医有点害怕？吹吹气球，深呼吸。'),
    ('n14', '再把蛀虫小怪一个一个点掉。'),
    ('n15', '第四集《红绿灯小卫士》。红灯停，绿灯行。红灯的时候急急忙忙点“走”，灰灰会提醒你。'),
    ('n16', '左看看，右看看，大家手拉手，一起走斑马线。'),
    ('n17', '坐公交车要扶好；看到山羊奶奶没有座位，主动让座。'),
    ('n18', '在公园追蝴蝶走丢了，不乱跑，站在原地，找警察叔叔帮忙。'),
    ('n19', '第五集《过大年》。把福字倒过来贴——福到了！'),
    ('n20', '分清上联、下联和横批，贴在门上；'),
    ('n21', '再和妈妈一起包饺子。'),
    ('n22', '年夜饭以后，站得远远的，捂住小耳朵，点一点天空放烟花。'),
    ('n23', '第六集《我会自己做》。跟着箭头，自己叠衣服。'),
    ('n24', '帮家里做家务，把垃圾分进四个不同的垃圾桶。'),
    ('n25', '最后把洗好的衣服晾起来。自己的事情自己做，黄花真的长大了！'),
    ('n26', '每个场景里还藏着小彩蛋，找到了就能收进贴纸本。'),
    ('n27', '家长可以选拼音难度：简单模式，卡片上有汉字；进阶模式，要分清不同的声调。'),
    ('n28', '《黄花的生活》，六集，十八站。所有配音都装在游戏里，不用联网。和黄花一起，每天长大一点点！'),
]
# Edge 会读错的多音字：送去合成的时候换成同音字，字幕还是原文
SAY = [('盛到', '成到'), ('倒过来', '到过来'), ('数一数', '蜀一蜀')]


def say_text(t):
    for a, b in SAY:
        t = t.replace(a, b)
    return t


def dur(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True)
    return float(r.stdout.strip())


async def synth(text, path):
    import edge_tts
    for attempt in range(4):
        try:
            await edge_tts.Communicate(text, VOICE, rate=RATE).save(path)
            return
        except Exception as e:
            print('  retry', attempt, e)
            await asyncio.sleep(2)
    raise RuntimeError('edge-tts failed: ' + text)


def main():
    os.makedirs(OUT, exist_ok=True)
    info = {}
    for k, t in LINES:
        say = say_text(t)
        h = hashlib.sha1((VOICE + RATE + say).encode('utf-8')).hexdigest()[:10]
        mp3 = os.path.join(OUT, '%s_%s.mp3' % (k, h))
        if not os.path.exists(mp3):
            asyncio.run(synth(say, mp3))
            print('+', k, say)
        info[k] = {'text': t, 'file': os.path.basename(mp3), 'dur': round(dur(mp3), 3)}
    json.dump(info, open(os.path.join(OUT, 'narr.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('total %.1f s' % sum(v['dur'] for v in info.values()))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
