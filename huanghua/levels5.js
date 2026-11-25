/* 黄花的生活 第二集：第五站 卫生间（5-1 排队上厕所、5-2 关紧水龙头、5-3 木乃伊灰灰） */
(function () {
  const HH = window.HH, D = HH.D, E = HH.E, UI = HH.UI, S = HH.S, L = HH.L;
  const say = UI.say, sleep = HH.sleep;
  const layer = HH.$('#layer');
  const INK = '#4a2e1c';

  /* ---------- 卫生间场景 ---------- */
  const DOOR = { x0: 838, x1: 1048, y0: 232, y1: 678 };
  const wc = L.wc = { door: 0, drip: 0 };
  const SPOT = { hh: [700, 830], dd: [800, 800], mm: [420, 860], hu: [1250, 820], cm: [1380, 860], bk: [560, 880], al: [1520, 880] };
  const WC = L.WC = {
    id: 'wc', bg: 'bg/restroom.jpg',
    size: y => 165 + (y - 680) * .8,
    walk: [[[330, 700], [1480, 700], [1640, 925], [200, 925]]],
    cam: { x: 836, y: 470, z: 1 },
    drawBack(g, t) {
      if (!HH.has('stickers', 'd_wc')) L.tinyDrop(g, 205, 300, .9, t);
      if (wc.door > 0) { // 门开了：里面暗一点，门板往左转
        const k = wc.door, w = DOOR.x1 - DOOR.x0;
        g.fillStyle = '#7d8f99'; g.fillRect(DOOR.x0, DOOR.y0, w, DOOR.y1 - DOOR.y0);
        g.fillStyle = '#5f6f78'; g.fillRect(DOOR.x0, DOOR.y1 - 60, w, 60);
        g.fillStyle = '#f2b8a6'; g.strokeStyle = INK; g.lineWidth = 4;
        const dw = w * (1 - k * .85);
        g.beginPath(); g.moveTo(DOOR.x0, DOOR.y0); g.lineTo(DOOR.x0 + dw, DOOR.y0 - 10 * k); g.lineTo(DOOR.x0 + dw, DOOR.y1 + 10 * k); g.lineTo(DOOR.x0, DOOR.y1); g.closePath(); g.fill(); g.stroke();
      }
    },
  };
  L.setWC = (o = {}) => {
    E.load(WC);
    HH.music('toilet');
    wc.door = 0;
    for (const id of o.who || ['mm', 'bk', 'hh', 'hu', 'cm', 'al']) { const p = SPOT[id]; E.add(id, p[0], p[1]); }
    if (o.dd !== false) E.add('dd', SPOT.dd[0], SPOT.dd[1], { float: 190 });
    E.onActor = L.chat; E.onFloor = null;
  };
  const openDoor = async (to = 1) => { HH.sfx('click'); const from = wc.door; for (let i = 1; i <= 10; i++) { wc.door = HH.lerp(from, to, i / 10); await sleep(30); } };

  /* ---------- 5-1 排队上厕所 ---------- */
  L.RUN.s5a = async () => {
    L.setWC({ who: ['mm', 'bk', 'hh', 'cm', 'al'], dd: true });
    UI.hudShow(true);
    await say('wc01'); await say('wc02');
    E.actors.dd.pose = 'stand'; await say('wc03');
    await say('wc04', { hold: 0 });
    await E.waitTap({ id: 'door', x: (DOOR.x0 + DOOR.x1) / 2, y: 460, w: 230, h: 460, walk: { x: 900, y: 740 }, sparkle: true, sx: 1015, sy: 520 });
    E.face('hh', 940);
    for (let i = 0; i < 3; i++) { HH.sfx('land'); await sleep(170); }
    await say('wc_knock');
    await say('wc_busy');
    // 灰灰冲完水出来
    await sleep(400); HH.sfx('splash'); await sleep(900);
    await openDoor(1);
    const hu = E.add('hu', 945, 690);
    await E.walk('hu', SPOT.hu[0], SPOT.hu[1], { free: true });
    hu.flip = true;
    await openDoor(0);
    await say('wc_empty');
    // 黄花进去
    await openDoor(1);
    await E.walk('hh', 945, 700, { free: true });
    const hh = E.actors.hh; hh.vis = false;
    await openDoor(0);
    await stallGame();
    await openDoor(1); hh.vis = true;
    await E.walk('hh', SPOT.hh[0], SPOT.hh[1], { free: true });
    await openDoor(0);
    await UI.petal('zhijie');
  };
  /* 厕所里：拉卫生纸、撕下来、冲水 */
  async function stallGame() {
    const st = { sheets: 0, pull: 0, tore: false, flush: 0, step: 'paper', said: {} };
    const geo = P => ({ rx: P.W * .7, ry: P.H * .3, r: P.H * .1, sh: P.H * .085, bx: P.W * .26, by: P.H * .33, br: P.H * .1 });
    const pnl = L.panel((g, P, dt) => {
      // 瓷砖墙
      g.fillStyle = '#cfeeee'; g.fillRect(0, 0, P.W, P.H);
      g.strokeStyle = 'rgba(80,140,140,.25)'; g.lineWidth = 2;
      for (let x = 0; x < P.W; x += P.H * .14) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, P.H); g.stroke(); }
      for (let y = 0; y < P.H; y += P.H * .14) { g.beginPath(); g.moveTo(0, y); g.lineTo(P.W, y); g.stroke(); }
      const q = geo(P);
      // 冲水按钮
      g.fillStyle = '#e8eef2'; g.strokeStyle = INK; g.lineWidth = 6;
      g.beginPath(); g.roundRect ? g.roundRect(q.bx - q.br * 1.5, q.by - q.br * 1.5, q.br * 3, q.br * 3, 18) : g.rect(q.bx - q.br * 1.5, q.by - q.br * 1.5, q.br * 3, q.br * 3); g.fill(); g.stroke();
      const press = st.flush > 0 && st.flush < .3 ? .9 : 1;
      g.fillStyle = st.step === 'flush' ? '#7cc8ff' : '#b9dcf2'; g.beginPath(); g.arc(q.bx, q.by, q.br * press, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(q.bx, q.by - q.br * .55); g.quadraticCurveTo(q.bx + q.br * .45, q.by + q.br * .1, q.bx, q.by + q.br * .45); g.quadraticCurveTo(q.bx - q.br * .45, q.by + q.br * .1, q.bx, q.by - q.br * .55); g.fill();
      if (st.step === 'flush') { g.strokeStyle = 'rgba(255,214,64,' + (.5 + .5 * Math.sin(P.t * 6)) + ')'; g.lineWidth = 8; g.beginPath(); g.arc(q.bx, q.by, q.br * 1.35, 0, 7); g.stroke(); }
      // 冲水的漩涡
      if (st.flush > 0) {
        st.flush += dt; const k = st.flush;
        g.save(); g.translate(P.W * .45, P.H * .8); g.globalAlpha = Math.max(0, 1 - k / 2.2);
        for (let i = 0; i < 4; i++) { g.strokeStyle = i % 2 ? '#7cc8ff' : '#bfe6ff'; g.lineWidth = 10; g.beginPath(); for (let a = 0; a < 9; a += .2) { const r = (9 - a) * P.H * .022; g.lineTo(Math.cos(a + k * 6 + i * 1.6) * r, Math.sin(a + k * 6 + i * 1.6) * r * .45); } g.stroke(); }
        g.restore();
      }
      // 卫生纸架和纸
      g.fillStyle = '#c9d2da'; g.strokeStyle = INK; g.lineWidth = 6;
      g.fillRect(q.rx - q.r * 1.5, q.ry - q.r * 1.25, q.r * 3, q.r * .5); g.strokeRect(q.rx - q.r * 1.5, q.ry - q.r * 1.25, q.r * 3, q.r * .5);
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(q.rx, q.ry, q.r * 1.3, q.r, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#d8b48a'; g.beginPath(); g.ellipse(q.rx, q.ry, q.r * .35, q.r * .28, 0, 0, 7); g.fill(); g.stroke();
      if (!st.tore) {
        const len = q.sh * (.5 + st.pull);
        g.fillStyle = '#fff'; g.fillRect(q.rx + q.r * .2, q.ry, q.r * 1.1, len); g.strokeRect(q.rx + q.r * .2, q.ry, q.r * 1.1, len);
        g.strokeStyle = 'rgba(150,150,160,.8)'; g.lineWidth = 2; g.setLineDash([6, 6]);
        for (let i = 1; i <= Math.floor(st.pull + .5); i++) { const y = q.ry + q.sh * (i - .5) + q.sh * .5; g.beginPath(); g.moveTo(q.rx + q.r * .2, y); g.lineTo(q.rx + q.r * 1.3, y); g.stroke(); }
        g.setLineDash([]);
        if (st.step === 'paper' && st.pull < .3) { g.fillStyle = 'rgba(255,214,64,' + (.4 + .4 * Math.sin(P.t * 6)) + ')'; g.beginPath(); g.arc(q.rx + q.r * .75, q.ry + len, 18, 0, 7); g.fill(); }
      }
      // 张数
      if (st.step === 'paper' && st.sheets > 0) {
        g.font = 'bold ' + (P.H * .12) + 'px WK'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 10; g.strokeStyle = INK; g.fillStyle = st.sheets > 4 ? '#ff6b6b' : st.sheets >= 2 ? '#5bbf6a' : '#ffd23f';
        const txt = st.sheets + ' 张'; g.strokeText(txt, P.W * .45, P.H * .2); g.fillText(txt, P.W * .45, P.H * .2);
      }
    }, {
      down: (x, y) => { st.drag = st.step === 'paper' && !st.tore ? { y, p0: st.pull } : null; },
      move: (x, y) => {
        if (!st.drag) return;
        const q = geo(pnl);
        st.pull = HH.clamp(st.drag.p0 + (y - st.drag.y) / q.sh, 0, 9);
        const n = Math.floor(st.pull + .25);
        if (n !== st.sheets) {
          if (n > st.sheets) { HH.sfx('pick'); if (n <= 3) HH.voice('wc_n' + n); }
          st.sheets = n;
          if (n === 3 && !st.said.enough) { st.said.enough = 1; say('wc_enough', { hold: 0 }); }
          if (n >= 5 && !st.said.more) { st.said.more = 1; say('wc_more', { hold: 0 }); }
        }
      },
      up: () => { st.drag = null; },
      tap: (x, y) => { if (st.step === 'flush') { const q = geo(pnl); if (Math.hypot(x - q.bx, y - q.by) < q.br * 1.6) st.onFlush && st.onFlush(); } },
    });
    await UI.quiz('zhi', { prompt: 'wc07' });
    await say('wc05', { hold: 0 });
    if (HH.auto) { st.pull = 3; st.sheets = 3; }
    // 拉到 2~4 张，"撕下来"按钮才出来；拉多了按钮收起来，要往上推回去
    let told = false;
    for (;;) {
      await E.until(() => st.sheets >= 2 && st.sheets <= 4 && !st.drag);
      if (!told) { told = true; say('wc06', { hold: 0 }); }
      const r = await new Promise(res => {
        UI.acts([{ t: '✋ 撕下来' }]).then(() => { clearInterval(iv); res('tear'); });
        const iv = setInterval(() => { if (st.sheets < 2 || st.sheets > 4) { clearInterval(iv); HH.$$('.acts').forEach(n => n.remove()); res('out'); } }, 100);
      });
      if (r === 'tear') break;
    }
    st.tore = true; HH.sfx('whoosh'); HH.burst(pnl.W * .75, pnl.H * .5, 14, { kind: 'blob', col: 'chalk', speed: 120 });
    st.step = 'flushq';
    await UI.quiz('chong', { prompt: 'wc08' });
    st.step = 'flush';
    await say('wc09', { hold: 0 });
    await new Promise(res => { st.onFlush = () => { st.onFlush = null; res(); }; if (HH.auto) setTimeout(() => st.onFlush(), 20); });
    st.step = 'done'; st.flush = .01; HH.sfx('splash'); HH.sfx('spray'); HH.buzz(40);
    await sleep(800);
    await say('wc10');
    pnl.close();
  }

  /* ---------- 5-2 关紧水龙头（洗手台特写） ---------- */
  L.RUN.s5b = async () => {
    E.load(L.SINK);
    HH.music('toilet');
    E.add('hh', 250, 1030, { hFix: 640 });
    const dd = E.add('dd', 1420, 640, { hFix: 560, float: 120, pose: 'stand' });
    await sleep(200);
    await say('sk01');
    const wg = L.washGame({ germs: 5, col: '#c9c9cf', dark: '#8c8c96', cuff: '#fff1a8', need: 1300 });
    // 浪费的水：水开着就一直涨
    const meter = UI.el('div', 'noise water', '<span>💧</span><div class="nb"><i></i></div>'); layer.appendChild(meter);
    const mf = meter.querySelector('i'); let waste = 0, mon = true;
    (function tick() { if (!mon) return; if (wg.st.water > .5 && wg.st.wasteOn) waste = Math.min(1, waste + .025); mf.style.width = waste * 100 + '%'; setTimeout(tick, 120); })();
    await say('sk02', { hold: 0 });
    await UI.acts([{ t: '🚰 开水龙头', cls: 'green' }]);
    await wg.on();
    wg.st.wasteOn = true;
    await sleep(900);
    dd.pose = 'stand'; dd.shake = 1;
    await say('sk03');
    await UI.quiz('guan', { prompt: 'sk04' });
    await say('sk05', { hold: 0 });
    await UI.acts([{ t: '✋ 关水龙头' }]);
    await wg.off(); wg.st.wasteOn = false;
    dd.pose = 'happy'; await say('sk06');
    await say('sk07', { hold: 0 });
    await UI.acts([{ t: '抹香皂', img: 'dish/soap.webp' }]);
    await wg.soap();
    await L.washOnce(wg, { full: false, steps: false, rubLine: 'h12' });
    await say('sk08', { hold: 0 });
    await UI.acts([{ t: '🚰 开水龙头', cls: 'green' }]);
    wg.st.wasteOn = true;
    await wg.on();
    for (let i = 0; i < 30; i++) { wg.st.foam = Math.max(0, wg.st.foam - .05); await sleep(40); }
    wg.st.bubbles = [];
    await UI.acts([{ t: '✋ 关水龙头' }]);
    await wg.off(); wg.st.wasteOn = false;
    HH.sfx('magic');
    mon = false; meter.remove();
    wg.close();
    // 那边的水龙头在滴水
    await say('sk09');
    await say('sk10');
    await UI.quiz('di', { prompt: 'sk11' });
    await say('sk12', { hold: 0 });
    await tapTurn();
    dd.pose = 'happy'; await say('sk13');
    await UI.petal('jieshui');
  };
  /* 滴水的水龙头：手指绕着把手转圈，拧紧 */
  function tapTurn() {
    return new Promise(res => {
      const st = { ang: 0, need: Math.PI * 2, last: null, drops: [], next: 0, done: false };
      const geo = P => ({ x: P.W * .5, y: P.H * .36, r: P.H * .13 });
      const pnl = L.panel((g, P, dt) => {
        g.fillStyle = 'rgba(214,236,240,.96)'; g.fillRect(0, 0, P.W, P.H);
        const q = geo(P), k = Math.min(1, st.ang / st.need);
        // 水管、龙头
        g.fillStyle = '#c9d2da'; g.strokeStyle = INK; g.lineWidth = 7;
        g.fillRect(q.x - q.r * .35, q.y, q.r * .7, q.r * 1.8); g.strokeRect(q.x - q.r * .35, q.y, q.r * .7, q.r * 1.8);
        g.beginPath(); g.moveTo(q.x - q.r * .35, q.y + q.r * 1.3); g.lineTo(q.x + q.r * 1.6, q.y + q.r * 1.3); g.lineTo(q.x + q.r * 1.6, q.y + q.r * 2.1); g.lineTo(q.x + q.r * 1.1, q.y + q.r * 2.1); g.lineTo(q.x + q.r * 1.1, q.y + q.r * 1.8); g.lineTo(q.x + q.r * .35, q.y + q.r * 1.8); g.closePath(); g.fill(); g.stroke();
        // 把手（十字）
        g.save(); g.translate(q.x, q.y); g.rotate(st.ang);
        g.fillStyle = '#e04848';
        for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.roundRect ? g.roundRect(-q.r * .16, -q.r, q.r * .32, q.r * .9, 10) : g.rect(-q.r * .16, -q.r, q.r * .32, q.r * .9); g.fill(); g.stroke(); }
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, q.r * .25, 0, 7); g.fill(); g.stroke(); g.restore();
        // 绕圈的提示
        if (!st.done) { g.strokeStyle = 'rgba(255,214,64,' + (.5 + .4 * Math.sin(P.t * 5)) + ')'; g.lineWidth = 8; g.setLineDash([16, 12]); g.beginPath(); g.arc(q.x, q.y, q.r * 1.35, -1.2, 1.2 + k * 4); g.stroke(); g.setLineDash([]); }
        // 水滴
        const rate = st.done ? 0 : 1.3 - k * 1.1;
        st.next -= dt;
        if (rate > 0 && st.next <= 0) { st.next = .25 + (1 - rate) * 1.6; st.drops.push({ y: q.y + q.r * 2.1, v: 0 }); }
        for (const d of st.drops) { d.v += 1400 * dt; d.y += d.v * dt; }
        st.drops = st.drops.filter(d => { if (d.y > P.H * .92) { HH.sfx('drip'); HH.burst(q.x + q.r * 1.35, P.H * .92, 4, { kind: 'drop', col: 'water', speed: 80, up: 60 }); return false; } return true; });
        g.fillStyle = '#7cc8ff'; g.strokeStyle = INK; g.lineWidth = 3;
        for (const d of st.drops) { const x = q.x + q.r * 1.35; g.beginPath(); g.moveTo(x, d.y - 18); g.quadraticCurveTo(x + 12, d.y, x, d.y + 8); g.quadraticCurveTo(x - 12, d.y, x, d.y - 18); g.fill(); g.stroke(); }
        // 水盆
        g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(q.x + q.r * 1.35, P.H * .95, P.W * .2, P.H * .06, 0, 0, 7); g.fill(); g.stroke();
      }, {
        down: (x, y) => { const q = geo(pnl); st.last = Math.atan2(y - q.y, x - q.x); },
        move: (x, y) => {
          if (st.last == null || st.done) return;
          const q = geo(pnl), a = Math.atan2(y - q.y, x - q.x); let d = a - st.last; st.last = a;
          if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
          if (Math.hypot(x - q.x, y - q.y) < q.r * .4) return;
          st.ang += Math.abs(d); if (Math.random() < .2) HH.sfx('tick');
          if (st.ang >= st.need) finish();
        },
        up: () => { st.last = null; },
      });
      const finish = async () => { if (st.done) return; st.done = true; HH.sfx('magic'); HH.burst(pnl.W * .5, pnl.H * .36, 30, { kind: 'star' }); await sleep(1100); pnl.close(); res(); };
      if (HH.auto) setTimeout(() => { st.ang = st.need; finish(); }, 30);
    });
  }

  /* ---------- 5-3 木乃伊灰灰 ---------- */
  L.RUN.s5c = async () => {
    L.setWC({ who: ['mm', 'bk', 'hh', 'cm', 'al'] });
    await say('mu01');
    HH.sfx('laugh');
    await openDoor(1);
    const hu = E.add('hu', 945, 700);
    hu.custom = mummy(); hu.wob = .15;
    await E.walk('hu', 1060, 800, { free: true, speed: .6 });
    await openDoor(0);
    await say('mu02');
    HH.sfx('laugh'); E.hopAll(['cm', 'mm', 'bk'], 20); await say('mu03');
    await say('mu04');
    await say('mu05', { hold: 0 });
    await rewind(hu);
    hu.custom = null; hu.sq = -.2; HH.sfx('magic');
    { const p = E.toScreen(hu.x, hu.y - hu.h * .5); HH.burst(p.x, p.y, 30, { kind: 'star' }); }
    await say('mu06');
    await say('mu07', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: '📄', lb: '一张', ok: true }, { ic: '🧻', lb: '一大把', no: 'mu_no1' }, { ic: '🧻🧻🧻', lb: '一整卷', no: 'mu_no2' }]));
    E.hop('hu', 26); await say('mu08');
    await UI.sticker('q_mummy');
    await L.peek('d_wc', { x: 205, y: 280, r: 70 });
    E.actors.dd.pose = 'happy'; await say('mu09');
    await say('end5');
  };
  /* 灰灰缠满卫生纸的样子：把灰灰的图画在画布上，再在它身上画白条（只画在身体上） */
  function mummy() {
    const im = E.img(E.CH.hu.img); if (!E.ok(im)) return null;
    const c = document.createElement('canvas'); c.width = E.iw(im); c.height = E.ih(im);
    const g = c.getContext('2d');
    g.drawImage(im, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 16; i++) {
      const y = c.height * (.06 + i * .062), a = (i % 2 ? .18 : -.15);
      g.save(); g.translate(c.width / 2, y); g.rotate(a);
      g.fillStyle = i % 3 === 0 ? '#ffffff' : '#f4f4f0'; g.fillRect(-c.width, -c.height * .028, c.width * 2, c.height * .05);
      g.strokeStyle = 'rgba(160,160,170,.6)'; g.lineWidth = 3; g.strokeRect(-c.width, -c.height * .028, c.width * 2, c.height * .05);
      g.restore();
    }
    // 留出眼睛
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#2a1a10';
    for (const ex of [.42, .6]) { g.beginPath(); g.arc(c.width * ex, c.height * .29, c.width * .035, 0, 7); g.fill(); }
    return c;
  }
  /* 转圈把卫生纸卷回去 */
  function rewind(hu) {
    return new Promise(res => {
      const st = { ang: 0, need: Math.PI * 6, last: null, done: false };
      const geo = P => ({ x: P.W * .62, y: P.H * .45, r: P.H * .17 });
      const pnl = L.panel((g, P) => {
        g.fillStyle = 'rgba(40,60,70,.45)'; g.fillRect(0, 0, P.W, P.H);
        const q = geo(P), k = Math.min(1, st.ang / st.need);
        // 拖到灰灰那边的长纸条
        g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 4;
        g.beginPath(); g.moveTo(q.x - q.r * .2, q.y + q.r); g.quadraticCurveTo(P.W * .4, P.H * .95, P.W * (.05 + .45 * k), P.H * (.75 + .1 * Math.sin(P.t * 2)));
        g.lineTo(P.W * (.05 + .45 * k), P.H * (.75 + .1 * Math.sin(P.t * 2)) + 26); g.quadraticCurveTo(P.W * .4, P.H * .95 + 26, q.x + q.r * .2, q.y + q.r); g.closePath(); g.fill(); g.stroke();
        // 纸卷（越转越大）
        const rr = q.r * (.75 + .35 * k);
        g.save(); g.translate(q.x, q.y); g.rotate(st.ang);
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, rr, 0, 7); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(160,160,170,.7)'; g.lineWidth = 3; for (let i = 1; i < 5; i++) { g.beginPath(); g.arc(0, 0, rr * (.35 + i * .13), i, i + 3); g.stroke(); }
        g.fillStyle = '#d8b48a'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, q.r * .28, 0, 7); g.fill(); g.stroke();
        g.restore();
        if (!st.done) { g.strokeStyle = 'rgba(255,214,64,' + (.5 + .4 * Math.sin(P.t * 5)) + ')'; g.lineWidth = 8; g.setLineDash([16, 12]); g.beginPath(); g.arc(q.x, q.y, rr * 1.35, 0, Math.PI * 2 * Math.max(.08, k)); g.stroke(); g.setLineDash([]); }
        g.font = 'bold ' + (P.H * .08) + 'px WK'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 8;
        const txt = Math.round(k * 100) + '%'; g.strokeText(txt, q.x, q.y - rr - P.H * .06); g.fillText(txt, q.x, q.y - rr - P.H * .06);
      }, {
        down: (x, y) => { const q = geo(pnl); st.last = Math.atan2(y - q.y, x - q.x); },
        move: (x, y) => {
          if (st.last == null || st.done) return;
          const q = geo(pnl), a = Math.atan2(y - q.y, x - q.x); let d = a - st.last; st.last = a;
          if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
          st.ang += Math.abs(d); if (Math.random() < .2) HH.sfx('tick');
          hu.wob = .1;
          if (st.ang >= st.need) finish();
        },
        up: () => { st.last = null; },
      });
      const finish = async () => { if (st.done) return; st.done = true; HH.sfx('magic'); await sleep(700); pnl.close(); res(); };
      if (HH.auto) setTimeout(() => { st.ang = st.need; finish(); }, 30);
    });
  }
})();
