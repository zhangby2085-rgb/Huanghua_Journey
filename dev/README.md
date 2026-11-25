# 黄花的生活 —— 开发说明

总说明见仓库根目录的 `README.md`。下面的命令都在仓库根目录（`黄花的生活/`）里运行，`python` 用装了 `requirements.txt` 的环境
（作者本机是 `..\.devenv\Scripts\python.exe -I`）。

横屏 RPG，主角黄花小猫，6 个小伙伴 + 小马老师。
- 第一集《捞月亮》：序章、第一站教室、第二站操场、第三站中餐馆（各 3 关）。
- 第二集《小水滴的旅行》：第四站图书馆（小声点/找书/排队借书）、第五站卫生间（敲门上厕所·卫生纸·冲水 / 关紧水龙头 / 木乃伊灰灰）、第六站小花园（一水多用浇花 / 水的旅行 / 按时还书）。新角色小水滴"滴滴"（代码画，`make_didi.py`）。
- 第三~六集：《牙齿保卫战》《红绿灯小卫士》《过大年》《我会自己做》，第七~十八站（见下表 levels7~10）。
- 每集 7 片花瓣（data.js 里 petals 带 ep），一集完出现结尾卡。

## 文件

| 位置 | 内容 |
|---|---|
| `huanghua.html` | 页面 |
| `huanghua/core.js` | 存档 `huanghua.v1`、配音队列、音效、音乐、粒子 |
| `huanghua/engine.js` | 画布：镜头、角色、找路走路、点击、道具 |
| `huanghua/ui.js` | 气泡、旁白、拼音卡片、按钮、物品、花瓣、贴纸、照片、小包 |
| `huanghua/levels.js` | 关卡表、第一站（序章、1-1 讲故事、1-2 拼音锁链、1-3 座位寻宝）、粉笔画 |
| `huanghua/levels2.js` | 第二站（2-1 水坑捞月 + 踢球、2-2 叠罗汉、2-3 抬头看）、夜空、水坑月亮 |
| `huanghua/levels3.js` | 第三站（3-1 先洗手 + 搓爪子小游戏、3-2 转盘分菜、3-3 盛饭/吃饭/捡米粒/打包、尾声月光），桌面遮挡、菜的占位画法 |
| `huanghua/levels4.js` | 第四站图书馆 + 6-3 还书；`L.panel` 全屏特写画布、`L.peek` 找藏起来的小水滴 |
| `huanghua/levels5.js` | 第五站卫生间（厕所隔间特写、拧水龙头、木乃伊） |
| `huanghua/levels6.js` | 第六站小花园（浇花、太阳/白云/下雨/小河） |
| `huanghua/comp.js` | 第三~六集共用小游戏：`L.pick` 点了装进去（清单/盘子）、`L.order` 按顺序（可用 deps）、`L.hold` 按住蓄力、`L.rub` 擦/刷（方向箭头）、`L.whack` 打蛀虫、`L.sort` 分类、`L.queueUp` 排队、`L.peekTooth/peekStar` 彩蛋、`L.popIn`、夜晚 |
| `huanghua/levels7.js` | 第三集《牙齿保卫战》：第七站家（起床/挤牙膏+刷牙/穿衣早饭）、第八站超市（清单、糖果、走丢、付钱、环保袋）、第九站牙医（吹气球、大嘴巴打蛀虫、晚安）；`L.unlocked` 每集第一关都开 |
| `huanghua/levels8.js` | 第四集《红绿灯小卫士》：第十站马路口（行人灯、开过来的小汽车、手拉手、球滚到路上）、第十一站公交车（坐在座位上=重画座位挡腿、晃车扶好、让座）、第十二站公园（陌生人、追蝴蝶走丢、捡垃圾） |
| `huanghua/levels9.js` | 第五集《过大年》：第十三站年货集市、第十四站客厅（擦灰、贴春联+倒福、包饺子）、第十五站年夜饭（拜年、压岁钱、放烟花）；`L.LIVING` 客厅第六集也用 |
| `huanghua/levels10.js` | 第六集《我会自己做》：第十六站卧室（书包、叠衣服、收玩具）、第十七站客厅（摆碗筷、扫地、垃圾分类）、第十八站阳台（浇花、喂鱼、晾衣服） |
| `huanghua/music/` | 背景音乐 8 首（Kevin MacLeod, incompetech.com, CC BY 4.0），原文件在 `dev/music-raw/` |
| `huanghua/menu.js` | 首页（选集）、选关（分集）、贴纸本、家长设置（含音乐署名）、每一集的结尾 |
| `huanghua/data.js` `voice.js` `font.woff2` | 生成文件，别手改 |
| `dev/content.py` | **所有台词、拼音词、物品、花瓣、贴纸** |
| `dev/clips/` | 每句台词的配音缓存（make_audio.py voice 只合成新的或改过的句子） |
| `dev/raw/` `dev/picks.json` | 第二集 SDXL 画的候选图（不进 git，只在作者本机）和选中的种子 |
| `dev/music-raw/` | `map.json`：哪首曲子对应哪个场景；mp3 原文件不进 git（从 incompetech.com 下载，游戏用的是 `huanghua/music/*.ogg`） |
| `dev/font/` | 放霞鹜文楷完整字体 `LXGWWenKai-Medium.ttf`（不进 git，见根目录 README） |
| `art/` | 原图：角色、背景、Gemini 画的图（`art/gemini2/` 是第三~六集） |
| `android/` | AndroidManifest.xml、图标、WebView 外壳 `src/`；打包用根目录的 `build.ps1` |

## 图片

原图都在 `art/`：7 张角色图、3 张背景图，还有用户用 Gemini 画的 3 张：
文件名含"姿态"的是黄花 6 个姿势（3×2），含"物品"的是 8 个物品（4×2），含"暮色"的是傍晚操场，
含"美食"或"菜品"的是 12 样菜和小物件（4×3，→ img/dish/，打包盒另拷到 img/item/），含"盥洗"或"洗手台"的是洗手台背景。

    python dev/cut_chars.py            全部重新切
    python dev/cut_chars.py poses      只切黄花姿势（items / dusk / dishes / sink 同理）

角色图用"深色描边挡住、从四边灌水"去背景；Gemini 的图描边有缺口，另外要求背景必须是白色（`white_only`）。

第二集的背景是本机 SDXL 画的（Gemini 用不了）：`python dev/paint.py gen bg`（不要加 -I，torch 在用户目录），
`paint.py sheet bg` 看候选，`picks.json` 选种子，`paint.py final`。SDXL 画的小物件不好用，第二集的小物件改用 `make_items2.py` 代码画。

第三~六集的图是用 Gemini 网页版画的（浏览器面板里画，`catch.py <名字>` 把下载的图存进 `art/gemini2/`），
`python dev/cut2.py [表名]` 切成角色（mama baba hema jc nn zhu、黄花 6 个新姿势）、48 个物品、10 张背景。
代码画的：牙牙 `make_yaya.py`，春联/福字/筷子 `make_items3.py`；汽车、行人灯、陌生人、蝴蝶、蛀虫、烟花、鱼缸都在 JS 里画。
新场景的镜头 y=520：手机横屏（2.2:1）只看得到 y≈134~906，东西别放到 880 以下。

## 改台词以后

    python dev/content.py
    python dev/make_audio.py scan     看多音字，读错的加进 SAY 表
    python dev/make_audio.py voice    只合成新句子（缓存在 clips/）
    python dev/make_audio.py font

已经处理的多音字：倒挂/倒影（dào）、好好地/轻轻地/小心地（de）、还给（huán）；
"还得"改成"还要"，"发卡"改成"花夹子"（Edge 会读成 kǎ）；第三站：盛→成（chéng）、转→赚（zhuàn）、倒掉/倒回（dào）、种粮食（zhòng）。

## 打包

    powershell -ExecutionPolicy Bypass -File build.ps1      → release\HuanghuaLife.apk

包名 com.hanzimaze.huanghua（现在 v1.3 / versionCode 4，六集），改了内容要先把 `android\AndroidManifest.xml` 的 versionCode 加 1。
签名设置在 `android\signing.local.ps1`（不进 git），见根目录 README。

## 测试

先在仓库根目录开一个本地服务器（测试脚本都用 8807 端口）：`python -m http.server 8807`。

    python dev/cdp.py launch "http://localhost:8807/huanghua.html?auto&fast&play=pro"

- `?play=s2a` 直接进某一关；`?fast` 动画和配音都跳过；`?auto` 自动答题、自动点。
- `kid.js`（`cdp.py evalf dev/kid.js`）只自动答题和点按钮，手势留给真实触摸：
  `pro_test.py`（往上推站起来、点星星、认识小伙伴）、`desk_test.py`（点错桌子、两个支线）、
  `tower_test.py`（叠罗汉点准时机）、`kick_test.py`（踢球）、`s3_test.py s3a`（拦灰灰、搓爪子、拨转盘、盛饭、吃饭、捡米粒、打包、汤碗）、
  `s3_end_test.py`（3-3 后半）。按钮刚出来时有弹入动画，测试要等 0.8 秒再按。
- 第三~六集：`python dev/auto_st.py s7a s8a …` 一站一站自动跑完，报告报错和缺的配音；
  `drive.py`（`import drive as d`：`d.go('?play=s16b')`、`d.swipe(d.line(...))`、`d.hold`、`d.shot`、`d.stack`）用真实触摸试小游戏。
- 画黑板月亮：等 `HH.E.capture` 出现，用 `cdp.py touch` 划一个圈。

## 介绍视频

成片：`演示视频/黄花的生活_介绍.mp4`（不进 git）（4 分 35 秒，1080p，中文解说 + 字幕 + 《Carefree》背景音乐）、`封面.png`、`视频说明.txt`（标题、简介、音乐署名）。
工具都在 `dev/video/`：

    python dev/video/record_all.py [片段...]   录游戏画面（无界面 Chrome screencast，1440×667，约 27 帧/秒）
    python dev/video/sheet.py brush 2 8       每 2 秒一帧的总览图，挑剪辑起止
    python dev/video/narration.py            解说词 + Edge 晓晓合成（SAY 表换多音字）
    python dev/video/asr_check.py            离线识别把每句解说听一遍（sherpa-onnx 模型不在仓库里，用环境变量 HH_ASR 指过去）
    python dev/video/make_video.py [--plan | --still 秒 | --mux-only]

- `kid_demo.js`：录制时注入页面的"小朋友"，按人的速度答题、点按钮、点闪光的地方，点击记在 `window.__taps`；
  画布小游戏（搓爪子、刷牙、拖云、打蛀虫、叠衣服……）在 `record_all.py` 里用真实触摸做。
  为它在游戏里留了几个标记：`UI.choose` 的正确卡片 `data-ok`、`L.order` 的 `data-order`、`L.sort` 的 `data-bin`/`data-k`、`L.curRub/curWhack/curHold`。
- `make_video.py` 的 `SEGMENTS`：(片段, 起, 止, 章节, [解说], 提前, {speed, keep})；画面最多比解说长 1.2 秒，`keep` 用完整段，`speed` 快放。
