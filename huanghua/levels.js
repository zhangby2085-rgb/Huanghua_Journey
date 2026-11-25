/* 黄花的生活：关卡总表 + 第一站 教室（序章、1-1 讲故事、1-2 拼音锁链、1-3 座位寻宝） */
(function () {
  const HH = window.HH, D = HH.D, E = HH.E, UI = HH.UI, S = HH.S;
  const say = UI.say, sleep = HH.sleep;
  const L = HH.L = {};

  /* ---------- 关卡表 ---------- */
  L.LIST = [
    { id: 'pro', st: 1, name: '第一天上学' }, { id: 's1a', st: 1, name: '老师讲故事' }, { id: 's1b', st: 1, name: '拼音锁链' }, { id: 's1c', st: 1, name: '座位寻宝' },
    { id: 's2a', st: 2, name: '水坑捞月' }, { id: 's2b', st: 2, name: '叠罗汉' }, { id: 's2c', st: 2, name: '抬头看' },
  ];
  L.STAGES = { 1: { ep: 1, name: '教室', title: '第一站 · 教室', bg: 'bg/classroom.jpg' }, 2: { ep: 1, name: '操场', title: '第二站 · 操场', bg: 'bg/playground_dusk.jpg' },
    3: { ep: 1, name: '中餐馆', title: '第三站 · 中餐馆', bg: 'bg/restaurant.jpg', soon: true },
    4: { ep: 2, name: '图书馆', title: '第四站 · 图书馆', bg: 'bg/library.jpg' }, 5: { ep: 2, name: '卫生间', title: '第五站 · 卫生间', bg: 'bg/restroom.jpg' },
    6: { ep: 2, name: '小花园', title: '第六站 · 小花园', bg: 'bg/garden.jpg' } };
  L.EPS = { 1: { name: '捞月亮', title: '第一集 · 捞月亮', first: 'pro' }, 2: { name: '小水滴的旅行', title: '第二集 · 小水滴的旅行', first: 's4a' } };
  L.RUN = {};
  L.unlocked = id => { const i = L.LIST.findIndex(l => l.id === id); return i === 0 || id === 's4a' || S.done[id] || S.done[L.LIST[i - 1].id]; };
  /* 从某一关开始，一直玩到这一站结束 */
  L.start = async id => {
    let i = L.LIST.findIndex(l => l.id === id);
    const st = L.LIST[i].st;
    HH.ep = L.STAGES[st].ep; UI.hud();
    UI.hudShow(true);
    await E.preload(E.allImages());
    while (i < L.LIST.length && L.LIST[i].st === st) {
      const lv = L.LIST[i];
      S.last = lv.id; HH.save(); HH.mark('level ' + lv.id); HH.log('level', lv.id);
      await L.RUN[lv.id]();
      S.done[lv.id] = 1; HH.save();
      i++;
    }
    S.last = i < L.LIST.length ? L.LIST[i].id : null; HH.save();
    window.HH_DONE = (window.HH_DONE || 0) + 1;
    HH.M.stageDone(st);
  };

  /* ---------- 小伙伴闲聊 ---------- */
  const CHAT = { mm: ['c_mm1', 'c_mm2'], hu: ['c_hu1', 'c_hu2'], cm: ['c_cm1', 'c_cm2'], bk: ['c_bk1', 'c_bk2'], al: ['c_al1', 'c_al2'], ma: ['c_ma1'] };
  const chatN = {};
  L.chat = async id => {
    const ls = CHAT[id]; if (!ls) return;
    chatN[id] = (chatN[id] || 0) + 1;
    if (id === 'cm') E.hop('cm');
    await say(ls[chatN[id] % ls.length]);
  };

  /* ---------- 粉笔 ---------- */
  const chalk = L.chalk = { paths: [], texts: [], alpha: 1 };
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const jit = (pts, a = 1.2) => pts.map(([x, y]) => [x + (rnd() - .5) * a, y + (rnd() - .5) * a]);
  const ell = (cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 40) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; };
  const seg = (x1, y1, x2, y2) => { const p = [], n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 8)); for (let i = 0; i <= n; i++) p.push([x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n]); return p; };
  const CH_W = 'rgba(255,255,255,.88)', CH_Y = 'rgba(255,226,110,.95)', CH_B = 'rgba(160,215,255,.9)', CH_P = 'rgba(255,170,190,.9)';
  /* 画一笔：返回画完的 Promise */
  L.stroke = (pts, o = {}) => {
    const p = { pts: o.raw ? pts : jit(pts), p: 0, col: o.col || CH_W, w: o.w || 3.4, tag: o.tag, fill: o.fill };
    chalk.paths.push(p);
    const ms = HH.fast ? 1 : (o.ms || 500);
    return new Promise(res => {
      const t0 = performance.now();
      const step = () => { p.p = Math.min(1, (performance.now() - t0) / ms); if (Math.random() < .3) HH.sfx('chalk'); if (p.p < 1) requestAnimationFrame(step); else res(p); };
      step();
    });
  };
  L.strokes = async (list, o) => { for (const s of list) await L.stroke(s, o); };
  L.chalkText = (t, x, y, o = {}) => { const tx = Object.assign({ t, x, y, size: 38, col: CH_W }, o); chalk.texts.push(tx); return tx; };
  L.wipe = async () => { for (let i = 10; i >= 0; i--) { chalk.alpha = i / 10; await sleep(40); } chalk.paths = []; chalk.texts = []; chalk.alpha = 1; };
  function drawPath(g, p) {
    const pts = p.pts; if (pts.length < 2) return;
    let total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    let left = total * p.p;
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && left > 0; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (d <= left) g.lineTo(pts[i][0], pts[i][1]);
      else { const k = left / d; g.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k); }
      left -= d;
    }
    if (p.fill && p.p >= 1) { g.fillStyle = p.fill; g.fill(); }
    g.strokeStyle = p.col; g.lineWidth = p.w; g.stroke();
    g.globalAlpha *= .35; g.lineWidth = p.w * 2.2; g.stroke(); g.globalAlpha /= .35;
  }
  L.drawChalk = g => {
    g.save(); g.globalAlpha = chalk.alpha; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const p of chalk.paths) drawPath(g, p);
    for (const t of chalk.texts) {
      g.font = t.size + 'px WK'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = t.col; g.globalAlpha = chalk.alpha * (t.a == null ? 1 : t.a); g.fillText(t.t, t.x, t.y);
      g.globalAlpha = chalk.alpha * .3; g.fillText(t.t, t.x + 1.2, t.y + .8);
    }
    g.restore();
  };
  /* 粉笔小图 */
  const monkey = (x, y, s = 1) => [
    ell(x, y, 12 * s, 12 * s), ell(x - 13 * s, y - 2 * s, 4.5 * s, 5 * s), ell(x + 13 * s, y - 2 * s, 4.5 * s, 5 * s),
    ell(x, y + 3 * s, 7 * s, 5.5 * s, 0, Math.PI), ell(x, y + 24 * s, 9 * s, 13 * s),
    [[x + 8 * s, y + 32 * s], [x + 20 * s, y + 36 * s], [x + 26 * s, y + 26 * s], [x + 20 * s, y + 20 * s], [x + 16 * s, y + 26 * s]],
  ];
  const tree = (x, y, s = 1) => [
    seg(x - 6 * s, y, x - 5 * s, y - 70 * s), seg(x + 6 * s, y, x + 5 * s, y - 70 * s),
    [...ell(x - 26 * s, y - 86 * s, 22 * s, 18 * s, Math.PI * .4, Math.PI * 1.6, 16), ...ell(x, y - 112 * s, 26 * s, 20 * s, Math.PI * .95, Math.PI * 2.05, 18),
      ...ell(x + 26 * s, y - 86 * s, 22 * s, 18 * s, Math.PI * 1.4, Math.PI * 2.6, 16), ...ell(x, y - 70 * s, 30 * s, 8 * s, 0, Math.PI, 12)],
  ];

  /* ---------- 教室场景 ---------- */
  const BAND = 792;
  const SPOT = { al: [150, 794], mm: [380, 802], cm: [985, 798], bk: [1235, 790], hu: [1480, 800], hh: [640, 796], ma: [720, 470] };
  const DESK = { shu: { x: 510, y: 340, item: 'book', extra: 'net' }, shui: { x: 1000, y: 425, item: 'cup', extra: 'scope' }, bi: { x: 1323, y: 344, item: 'brush', extra: 'map' } };
  const cls = L.cls = { tint: 0, tags: false, star: null, deskItems: {}, extraShown: {} };
  function drawTag(g, k, x, y, rot) {
    const w = D.words[k], easy = S.set.level === 'easy';
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = '#fffdf3'; g.strokeStyle = '#c9a87c'; g.lineWidth = 2;
    const hw = 52, hh = easy ? 40 : 28;
    g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 6; g.shadowOffsetY = 3;
    g.fillRect(-hw, -hh, hw * 2, hh * 2); g.shadowColor = 'transparent'; g.strokeRect(-hw, -hh, hw * 2, hh * 2);
    g.fillStyle = 'rgba(255,120,120,.6)'; g.fillRect(-14, -hh - 6, 28, 12);
    g.font = 'bold 34px WK'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#c2452d';
    g.fillText(w.py, 0, easy ? -12 : 2);
    if (easy) { g.font = '26px WK'; g.fillStyle = '#4a2e1c'; g.fillText(w.ch, 0, 22); }
    g.restore();
  }
  function itemProp(id, key, x, y, wd, o = {}) {
    const im = E.img('item/' + key + '.webp');
    return E.prop(Object.assign({ id, y, x, z: 0, wd, a: 1, draw(g) {
      if (!E.ok(im)) return; const h = this.wd * im.naturalHeight / im.naturalWidth;
      g.globalAlpha = this.a; g.translate(this.x, this.y - this.z); g.rotate(this.rot || 0); g.drawImage(im, -this.wd / 2, -h, this.wd, h);
    } }, o));
  }
  L.itemProp = itemProp;
  async function rise(p, dz = 60, ms = 500) { const z0 = p.z; for (let i = 1; i <= 10; i++) { p.z = z0 + dz * Math.sin(i / 10 * Math.PI / 2); await sleep(ms / 10); } }
  const CLASS = {
    id: 'class', bg: 'bg/classroom.jpg',
    size: y => 120 + (y - 430) * .36,
    walk: [[[56, 770], [1616, 770], [1630, 812], [40, 812]]],
    cam: { x: 836, y: 436, z: 1 },
    drawBack(g, t) {
      // 月亮彩蛋（黑板角小月牙、公告栏月亮、月牙橡皮）
      g.save(); g.lineCap = 'round';
      g.strokeStyle = 'rgba(255,240,170,.9)'; g.lineWidth = 3.5;
      g.beginPath(); g.arc(1168, 80, 15, Math.PI * .35, Math.PI * 1.65); g.arc(1176, 80, 11, Math.PI * 1.55, Math.PI * .45, true); g.closePath(); g.stroke();
      g.fillStyle = '#ffe066'; g.strokeStyle = '#c79a2a'; g.lineWidth = 2;
      g.beginPath(); g.arc(1383, 114, 15, 0, 7); g.fill(); g.stroke();
      g.fillStyle = 'rgba(200,150,40,.5)'; g.beginPath(); g.arc(1378, 110, 3, 0, 7); g.arc(1389, 119, 2.4, 0, 7); g.fill();
      g.fillStyle = '#ffd36b'; g.strokeStyle = '#8a5a2b';
      g.beginPath(); g.arc(1078, 350, 11, Math.PI * .3, Math.PI * 1.7); g.arc(1085, 348, 8, Math.PI * 1.6, Math.PI * .4, true); g.closePath(); g.fill(); g.stroke();
      g.restore();
      L.drawChalk(g);
      if (cls.tags) for (const [k, d] of Object.entries(DESK)) if (!cls.deskItems[k]) drawTag(g, k, d.x, d.y - 8, (k.length % 3 - 1) * .06);
      if (cls.star) { // 教走路的小星星
        const s = cls.star, r = 30 + 4 * Math.sin(t * 5);
        g.save(); g.translate(s.x, s.y); g.scale(1, .45); g.rotate(t); g.fillStyle = 'rgba(255,214,64,.95)'; g.strokeStyle = '#8a5a00'; g.lineWidth = 4;
        g.beginPath(); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5, rr = j % 2 ? r * .45 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); g.restore();
      }
    },
    overlay(g, W, H) { if (cls.tint > 0) { g.fillStyle = 'rgba(255,190,110,' + cls.tint * .32 + ')'; g.fillRect(0, 0, W, H); } },
  };
  /* 摆好教室：who 里的小伙伴站到老位置 */
  L.setClass = (o = {}) => {
    E.load(CLASS);
    cls.tint = 0; cls.tags = false; cls.star = null;
    chalk.paths = []; chalk.texts = []; chalk.alpha = 1;
    HH.music('class');
    const who = o.who || ['al', 'mm', 'cm', 'bk', 'hu', 'hh', 'ma'];
    for (const id of who) E.add(id, SPOT[id][0], SPOT[id][1]);
    if (E.actors.ma) E.actors.ma.flip = true;
    E.onActor = L.chat; E.onFloor = null;
    classSide();
  };
  /* 支线和月亮彩蛋（第一站每一关都在） */
  function classSide() {
    const st = (id, x, y, r, line) => E.hs({ id: 'st_' + id, x, y, r, walk: { x: HH.clamp(x, 80, 1590), y: BAND }, prio: 2,
      on: async () => { await E.hop('hh', null, 420); await UI.sticker(id, line); } });
    st('m_chalk', 1168, 80, 42, 'st_chalk'); st('m_board', 1383, 114, 40, 'st_board'); st('m_eraser', 1078, 350, 34, 'st_eraser');
    if (!S.side.ball) {
      const ball = itemProp('ball', 'ball', 612, 712, 46);
      E.hs({ id: 'ball', x: 612, y: 690, r: 50, walk: { x: 612, y: BAND }, prio: 3, when: () => !S.side.ball && !HH.has('items', 'ball'),
        on: async () => { await E.hop('hh', null, 400); E.unprop('ball'); await say('q_ball2'); await UI.got('ball'); await say('q_give'); } });
      if (HH.has('items', 'ball')) E.unprop('ball'); else ball.vis = true;
    }
    if (!S.side.clip && !HH.has('items', 'clip')) {
      E.hs({ id: 'clip', x: 345, y: 282, r: 46, sparkle: true, sr: 16, walk: { x: 345, y: BAND }, prio: 3, when: () => !S.side.clip && !HH.has('items', 'clip'),
        on: async () => { const a = E.actors.hh; a.pose = 'jump'; await E.hop('hh', a.h * .5, 600); a.pose = 'stand'; await say('q_clip2'); await UI.got('clip'); await say('q_give'); } });
    }
    const base = L.chat;
    E.onActor = async id => {
      if (id === 'hu' && !S.side.ball) {
        if (HH.has('items', 'ball')) { UI.take('ball'); S.side.ball = 1; HH.save(); E.hop('hu'); HH.sfx('cheer'); await say('q_ball3'); await UI.sticker('q_ball'); return; }
        if (S.met.hu) { await say('q_ball1'); return; }
      }
      if (id === 'mm' && !S.side.clip) {
        if (HH.has('items', 'clip')) { UI.take('clip'); S.side.clip = 1; HH.save(); E.hop('mm'); HH.sfx('cheer'); await say('q_clip3'); await UI.sticker('q_clip'); return; }
        if (S.met.mm) { await say('q_clip1'); return; }
      }
      if (L.classActor && await L.classActor(id)) return;
      await base(id);
    };
  }

  /* ---------- 序章：第一天上学 ---------- */
  L.RUN.pro = async () => {
    L.setClass({ who: [] });
    const hh = E.add('hh', 840, 796, { pose: 'sit', scale: .78 });
    cls.tint = 1;
    UI.hudShow(false);
    await E.camTo({ x: 840, y: 560, z: 1.5 }, 10);
    (async () => { for (let i = 20; i >= 0; i--) { cls.tint = i / 20; await sleep(120); } })();
    await say('p01'); await say('p02');
    const ma = E.add('ma', 1800, 796);
    await E.walk('ma', 1120, 796, { free: true }); ma.flip = true;
    await say('p03'); await say('p04'); await say('p05');
    // 把手拿出来
    let hand = UI.hand(hh.x - 20, hh.y - hh.h * .55);
    await say('p06', { hold: 0 });
    await E.waitTap({ id: 'paw', x: hh.x - 15, y: hh.y - hh.h * .55, r: 120, walk: false, sparkle: true, sr: 22,
      on: async () => { hand.kill(); HH.sfx('pop'); hh.sq = .25; hh.wob = .12; HH.burst(innerWidth / 2, innerHeight / 2, 16, { kind: 'star' }); } });
    await say('p07'); await say('p08');
    // 往上推，站起来
    hand = UI.hand(hh.x, hh.y - hh.h * .2, 'up');
    await say('p09', { hold: 0 });
    await new Promise(res => {
      let taps = 0;
      const ok = () => { E.capture = null; hand.kill(); res(); };
      E.capture = {
        down: p => { E.capture.start = p; },
        move: (p, e, d) => { if (d && d.y - e.clientY > 55) ok(); },
        tap: () => { taps++; hh.sq = .15; HH.sfx('hop'); if (taps >= 3) ok(); },
      };
      if (HH.auto) setTimeout(ok, 20);
    });
    hh.pose = 'stand'; hh.scale = 1; hh.sq = -.25; HH.sfx('magic'); HH.buzz(60);
    { const p = E.toScreen(hh.x, hh.y - hh.h * .5); HH.burst(p.x, p.y, 40, { kind: 'star', speed: 380 }); }
    await E.hop('hh', 70, 600);
    await say('p10');
    await E.camTo({ x: 836, y: 436, z: 1 }, 1000);
    UI.hudShow(true);
    await say('p11');
    // 小伙伴们进教室
    const enter = [['al', -120], ['mm', -120], ['cm', 1800], ['bk', 1800], ['hu', 1800]];
    E.walk('ma', 1237, 700, { free: true }).then(() => E.walk('ma', 1180, 470, { free: true })).then(() => E.walk('ma', SPOT.ma[0], SPOT.ma[1], { free: true })).then(() => { ma.flip = false; });
    await Promise.all(enter.map(([id, x0], i) => sleep(i * 350).then(() => { E.add(id, x0, SPOT[id][1]); return E.walk(id, SPOT[id][0], SPOT[id][1], { free: true }); })));
    for (const id of E.FRIENDS) E.face(id, hh.x);
    // 教走路
    cls.star = { x: 470, y: 800 };
    await say('p12', { hold: 0 });
    E.free = true;
    const sh = UI.hand(470, 790);
    await E.until(() => Math.abs(hh.x - 470) < 70 && !hh.moving, () => E.walk('hh', 470, 800));
    sh.kill(); cls.star = null; HH.sfx('ding'); HH.burst(innerWidth / 2, innerHeight * .7, 20, { kind: 'star' });
    await HH.sleep(200);
    // 认识小伙伴
    E.free = false;
    await say('p13');
    E.free = true;
    let idle = 0;
    E.onActor = async id => {
      idle = 0;
      if (id === 'ma') { await say('c_ma1'); return; }
      if (S.met[id]) { await L.chat(id); return; }
      E.hop(id); await say('i_' + id);
      S.met[id] = 1; HH.save();
      if (id === 'mm') { UI.hud(); const bb = HH.$('#bBag'); bb.classList.add('pop'); await say('i_mm2'); }
    };
    const iv = setInterval(() => { if (!E.busy && ++idle === 22) { idle = 0; say('p15'); } }, 1000);
    await E.until(() => E.FRIENDS.every(id => S.met[id]) && !E.busy, async () => { for (const id of E.FRIENDS) { E.free = true; S.met[id] = 1; } UI.hud(); });
    clearInterval(iv);
    E.free = false;
    HH.sfx('bell');
    await say('p14');
  };

  /* ---------- 1-1 老师讲故事 ---------- */
  L.RUN.s1a = async () => {
    L.setClass();
    UI.hudShow(true);
    await sleep(300);
    await say('a01');
    UI.forceSide = true;
    await E.camTo({ x: 880, y: 160, z: 2 }, 1100);
    await L.strokes([...tree(612, 250, .95), ...tree(700, 252, .8)], { ms: 260 });
    await L.stroke(seg(712, 128, 845, 118), { ms: 300 });
    await say('a02');
    // 井和小猴子
    const well = [ell(905, 196, 62, 14), seg(843, 196, 843, 246), seg(967, 196, 967, 246), ell(905, 246, 62, 12, 0, Math.PI),
      seg(843, 218, 967, 218), seg(872, 196, 872, 218), seg(938, 196, 938, 218), seg(858, 218, 858, 246), seg(905, 218, 905, 246), seg(952, 218, 952, 246)];
    L.strokes(well, { ms: 170 });
    await L.strokes(monkey(790, 200, .95), { ms: 150 });
    await say('a03');
    await L.stroke(ell(905, 196, 50, 9), { col: CH_B, ms: 400 });
    await say('a04');
    // 小朋友画月亮
    await drawMoon();
    await say('a06');
    // 一只拉着一只
    const chain = [[845, 128], [862, 150], [878, 170], [894, 188]];
    for (const [x, y] of chain) { await L.strokes(monkey(x, y - 12, .55), { ms: 90 }); }
    await say('a07');
    // 捞，碎了
    moonInWell.shake = 1;
    await L.strokes([seg(860, 194, 950, 196), ell(905, 196, 30, 6), ell(905, 196, 42, 8)], { col: CH_B, ms: 160 });
    await say('a08');
    moonInWell.shake = 0;
    await L.strokes([seg(785, 172, 778, 156), seg(778, 150, 778, 148)], { ms: 120 });
    // 抬头看，天上的月亮
    await say('a10', { hold: 0 });
    const hd = UI.hand(1050, 100);
    await E.waitTap({ id: 'sky', x: 1040, y: 105, w: 300, h: 150, walk: false, sparkle: true, sx: 1050, sy: 95,
      on: async () => { hd.kill(); HH.sfx('magic'); await L.stroke(ell(1050, 95, 28, 28), { col: CH_Y, fill: 'rgba(255,226,110,.45)', ms: 500 });
        // 月亮旁边几颗小星星
        const tw = []; for (const [sx, sy] of [[1000, 70], [1098, 62], [1102, 128], [995, 130]]) { tw.push(seg(sx - 7, sy, sx + 7, sy), seg(sx, sy - 7, sx, sy + 7)); }
        L.strokes(tw, { col: CH_Y, ms: 50 }); } });
    await say('a09');
    await say('a11');
    UI.forceSide = false;
    await E.camTo({ x: 836, y: 436, z: 1 }, 1000);
    E.hop('bk'); await say('a12');
    E.hop('hu'); await say('a13');
    E.hopAll(['cm', 'mm', 'al']); HH.sfx('cheer'); await say('a14');
    await say('a15');
    await L.wipe();
  };
  /* 井里的月亮（玩家画的那个） */
  const moonInWell = { on: false, shake: 0 };
  async function drawMoon() {
    let pts = [], cur = null, tries = 0;
    const hd = UI.hand(1000, 150);
    await say('a05', { hold: 0 });
    await new Promise(res => {
      const check = () => {
        if (pts.length < 10) return false;
        const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        if (Math.max(...xs) - Math.min(...xs) < 28 || Math.max(...ys) - Math.min(...ys) < 22) return false;
        let sweep = 0;
        for (let i = 1; i < pts.length; i++) {
          let d = Math.atan2(pts[i][1] - cy, pts[i][0] - cx) - Math.atan2(pts[i - 1][1] - cy, pts[i - 1][0] - cx);
          if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; sweep += d;
        }
        return Math.abs(sweep) > Math.PI * 1.55;
      };
      const finish = async () => {
        E.capture = null; hd.kill();
        const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        const r = pts.reduce((s, p) => s + Math.hypot(p[0] - cx, p[1] - cy), 0) / pts.length;
        HH.sfx('magic'); HH.buzz(40);
        // 画的圆慢慢变成一个漂亮的黄月亮，再"掉"进井里
        chalk.paths = chalk.paths.filter(p => p !== cur);
        const m = { pts: ell(cx, cy, r, r), p: 1, col: CH_Y, w: 4, fill: 'rgba(255,226,110,.5)' }; chalk.paths.push(m);
        const sp = E.toScreen(cx, cy); HH.burst(sp.x, sp.y, 30, { kind: 'star', col: 'gold' });
        await sleep(500);
        for (let i = 1; i <= 16; i++) { const k = HH.ease(i / 16); m.pts = ell(HH.lerp(cx, 905, k), HH.lerp(cy, 196, k), HH.lerp(r, 22, k), HH.lerp(r, 6, k)); await sleep(35); }
        m.tag = 'wellmoon';
        moonInWell.on = true;
        res();
      };
      E.capture = {
        down: p => { pts = [[p.x, p.y]]; cur = { pts, p: 1, col: CH_Y, w: 4.2 }; chalk.paths.push(cur); },
        move: p => { if (!cur) return; const l = pts[pts.length - 1]; if (Math.hypot(p.x - l[0], p.y - l[1]) > 2.5) { pts.push([p.x, p.y]); if (Math.random() < .25) HH.sfx('chalk'); } },
        up: async () => {
          if (!cur) return;
          if (check()) { finish(); return; }
          chalk.paths = chalk.paths.filter(p => p !== cur); cur = null; pts = [];
          tries++;
          if (tries >= 3) { pts = ell(1000, 150, 36, 36).map(([x, y]) => [x, y]); finish(); return; }
          say('a05b');
        },
      };
      if (HH.auto) setTimeout(() => { pts = ell(1000, 150, 40, 38); finish(); }, 20);
    });
  }
  // 井里的月亮"碎了又圆"
  E.frameHooks.push(() => {
    if (!moonInWell.shake) return;
    const m = chalk.paths.find(p => p.tag === 'wellmoon'); if (!m) return;
    const t = E.time(); m.pts = ell(905 + Math.sin(t * 13) * 6, 196, 22 + Math.sin(t * 9) * 6, 6 + Math.cos(t * 11) * 2);
  });

  /* ---------- 1-2 拼音锁链 ---------- */
  const SLOT = [650, 810, 970, 1130];
  L.RUN.s1b = async () => {
    L.setClass();
    await sleep(200);
    // 黑板上的四张图
    await L.strokes([ell(650, 105, 30, 28), ell(618, 100, 9, 11), ell(682, 100, 9, 11), ell(650, 112, 17, 13, 0, Math.PI * 2), ell(642, 104, 2.5, 2.5), ell(658, 104, 2.5, 2.5),
      ell(650, 116, 7, 4, 0, Math.PI)], { ms: 120 });
    await L.strokes([ell(800, 95, 30, 22), seg(778, 90, 822, 90), seg(774, 100, 826, 100), seg(790, 76, 788, 116), seg(808, 75, 810, 116), seg(826, 112, 852, 150)], { col: CH_B, ms: 120 });
    await L.strokes([[...ell(970, 105, 32, 32, Math.PI * .3, Math.PI * 1.7, 30), ...ell(984, 101, 25, 25, Math.PI * 1.62, Math.PI * .38, 30).reverse()]], { col: CH_Y, ms: 400 });
    const rays = [ell(1130, 105, 17, 17)]; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; rays.push(seg(1130 + Math.cos(a) * 25, 105 + Math.sin(a) * 25, 1130 + Math.cos(a) * 38, 105 + Math.sin(a) * 38)); }
    await L.strokes(rays, { col: CH_Y, ms: 70 });
    // 下面的空格和锁链
    const boxes = SLOT.map(x => L.stroke([[x - 58, 186], [x + 58, 186], [x + 58, 232], [x - 58, 232], [x - 58, 186]], { col: 'rgba(255,255,255,.45)', w: 2.5, ms: 200 }));
    await Promise.all(boxes);
    const links = [];
    for (let i = 0; i < 3; i++) { const x = (SLOT[i] + SLOT[i + 1]) / 2; links.push(L.stroke([...ell(x - 9, 209, 13, 8), ...ell(x + 9, 209, 13, 8)], { col: 'rgba(255,255,255,.35)', w: 2.5, ms: 200 })); }
    const linkPaths = await Promise.all(links);
    await say('b01'); await say('b02', { hold: 0 });
    const helpers = ['hu', 'cm', 'al', 'mm'], hl = ['b_hu', 'b_cm', 'b_al', 'b_mm'];
    let pulse = null;
    await UI.quizSeq(['hou', 'lao', 'yue', 'liang'], {
      onTarget: i => { if (pulse) chalk.paths = chalk.paths.filter(p => p !== pulse); pulse = { pts: ell(SLOT[i], 209, 66, 30), p: 1, col: 'rgba(255,214,64,.8)', w: 3 }; chalk.paths.push(pulse); },
      flyTo: i => E.toScreen(SLOT[i], 209),
      onRight: async i => {
        L.chalkText(D.words[['hou', 'lao', 'yue', 'liang'][i]].py, SLOT[i], 210, { size: 40, col: '#ffe9a0' });
        if (i > 0) { linkPaths[i - 1].col = CH_Y; linkPaths[i - 1].w = 4; }
        const id = helpers[i];
        E.hop(id, null, 520); HH.sfx('cheer');
        await say(hl[i], { hold: 60 });
      },
    });
    if (pulse) chalk.paths = chalk.paths.filter(p => p !== pulse);
    // 整条锁链亮起来
    HH.sfx('magic');
    for (let i = 0; i < 4; i++) { const p = E.toScreen(SLOT[i], 209); HH.burst(p.x, p.y, 16, { kind: 'star' }); await sleep(120); }
    L.chalkText('捞月计划', 890, 268, { size: 30, col: '#ffe9a0' });
    E.hopAll(['al', 'mm', 'hh', 'cm', 'bk', 'hu']);
    await say('b03');
    await UI.petal('renzhen');
    await L.wipe();
  };

  /* ---------- 1-3 座位寻宝 ---------- */
  L.RUN.s1c = async () => {
    L.setClass();
    await sleep(200);
    await say('c01'); await say('c02');
    cls.tags = true; cls.deskItems = {};
    HH.sfx('pick');
    const order = ['shu', 'shui', 'bi'], prompts = ['c03', 'c03b', 'c03c'];
    let step = 0;
    const showPill = () => {
      const k = order[step], w = D.words[k];
      UI.pill('<span>找一找</span>' + (S.set.level === 'easy' ? '<span class="py">' + w.py + '</span>' : ''), () => HH.voice('q_' + k));
    };
    for (const [k, d] of Object.entries(DESK)) {
      E.hs({ id: 'desk_' + k, x: d.x, y: d.y, w: 290, h: 120, walk: { x: HH.clamp(d.x, 80, 1590), y: BAND }, when: () => !cls.deskItems[k], prio: 1,
        on: async () => {
          await E.hop('hh', null, 420);
          if (k !== order[step]) { await say('c_no', { hold: 60 }); await HH.voice('w_' + k); await HH.sleep(250); await HH.voice('q_' + order[step]); return; }
          UI.unpill();
          cls.deskItems[k] = 1;
          HH.sfx('right'); HH.voice('w_' + k);
          const pr = itemProp('it_' + k, d.item, d.x, d.y + 6, 96, { dy: -1000 });
          const sp = E.toScreen(d.x, d.y); HH.burst(sp.x, sp.y, 26, { kind: 'star' });
          await rise(pr, 40, 400);
          if (k === 'shu') { await say('c04'); await UI.got('book'); await say('c05'); await UI.got('net'); }
          if (k === 'shui') { await say('c06'); E.hop('bk'); await say('c07'); await UI.got('cup'); await say('c08'); await UI.got('scope'); }
          if (k === 'bi') { await say('c09'); await UI.got('brush'); await say('c10'); await UI.got('map'); }
          E.unprop('it_' + k);
          step++;
          if (step < 3) { await say(prompts[step], { hold: 0 }); showPill(); }
        } });
    }
    await say('c03', { hold: 0 });
    showPill();
    E.free = true;
    let hinted = false;
    await E.until(() => step >= 3 && !E.busy, async () => { for (const k of order) await E.tapHot('desk_' + k); });
    E.free = false; cls.tags = false; UI.unpill();
    if (!hinted && (!S.side.ball || !S.side.clip)) { hinted = true; }
    // 报告：大家给黄花加油
    const hh = E.actors.hh;
    await E.walk('hh', 700, 796); hh.flip = false;
    await say('c11');
    hh.sweat = 3;
    await say('c12', { hold: 0 });
    const cheers = [['hu', 'c13a'], ['cm', 'c13b'], ['al', 'c13c']];
    for (let i = 0; i < 3; i++) {
      await UI.acts([{ t: '加油！', cls: 'green' }]);
      HH.sfx('cheer'); HH.buzz(20);
      const [id, line] = cheers[i];
      E.hop(id);
      if (i === 1) { hh.rot = -.06; }
      await say(line, { hold: 60 });
      hh.sweat = Math.max(0, hh.sweat - 1);
    }
    hh.rot = 0; hh.sweat = 0; hh.pose = 'hand'; hh.sq = -.2; HH.sfx('magic');
    { const p = E.toScreen(hh.x, hh.y - hh.h); HH.burst(p.x, p.y, 30, { kind: 'star' }); }
    await say('c14');
    hh.pose = 'stand';
    HH.sfx('cheer'); E.hopAll(['al', 'mm', 'cm', 'bk', 'hu']);
    await say('c15');
    await UI.petal('yonggan');
    await say('c16');
    // 放学啦，背上书包，拍照
    hh.pose = 'bag';
    for (const id of ['al', 'mm', 'cm', 'bk', 'hu']) E.face(id, hh.x);
    await UI.photo('s1', '第一天上学');
    hh.pose = 'stand';
    await say('end1');
  };
})();
