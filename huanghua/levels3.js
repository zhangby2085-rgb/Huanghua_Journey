/* 黄花的生活：第三站 中餐馆（3-1 先洗手、3-2 转盘分菜、3-3 光盘行动、尾声） */
(function () {
  const HH = window.HH, D = HH.D, E = HH.E, UI = HH.UI, S = HH.S, L = HH.L;
  const say = UI.say, sleep = HH.sleep;
  const layer = HH.$('#layer');

  /* ---------- 菜（Gemini 的图；还没有图就画一个盘子） ---------- */
  const DISH = { baozi: '包子', jiaozi: '饺子', tangyuan: '汤圆', yu: '鱼', tang: '汤', qingcai: '青菜', rice: '米饭', bowl: '碗', pot: '饭锅', box: '打包盒', soap: '香皂', towel: '毛巾' };
  const DCOL = { baozi: '#fff4e0', jiaozi: '#fff8ea', tangyuan: '#ffffff', yu: '#dfe9f2', tang: '#ffd98a', qingcai: '#7cc56a', rice: '#ffffff', bowl: '#ffffff', pot: '#c8a070', box: '#ffffff', soap: '#ffd84d', towel: '#ff9fb5' };
  const dishImg = k => E.img('dish/' + k + '.webp');
  L.drawDish = (g, k, x, y, w, o = {}) => {
    const im = dishImg(k);
    if (E.ok(im)) { const h = w * im.naturalHeight / im.naturalWidth; g.drawImage(im, x - w / 2, y - h, w, h); return h; }
    // 占位：白盘子 + 一团颜色 + 字
    g.save();
    g.fillStyle = '#fff'; g.strokeStyle = '#4a2e1c'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(x, y - w * .15, w * .5, w * .16, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = DCOL[k] || '#eee'; g.beginPath(); g.ellipse(x, y - w * .24, w * .32, w * .14, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#4a2e1c'; g.font = (w * .2) + 'px WK'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(DISH[k] || k, x, y - w * .26);
    g.restore();
    return w * .42;
  };
  /* 菜上面的小旗子（拼音） */
  function flag(g, k, x, y, s = 1, hot = false) {
    const w = D.words[k]; if (!w) return;
    const easy = S.set.level === 'easy';
    g.save(); g.translate(x, y); g.scale(s, s);
    g.font = 'bold 30px WK'; const tw = g.measureText(w.py).width + 26, th = easy ? 62 : 42;
    g.strokeStyle = '#4a2e1c'; g.lineWidth = 3; g.fillStyle = hot ? '#ffe680' : '#fffaf0';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -18); g.stroke();
    g.beginPath(); g.roundRect ? g.roundRect(-tw / 2, -18 - th, tw, th, 12) : g.rect(-tw / 2, -18 - th, tw, th); g.fill(); g.stroke();
    g.fillStyle = '#c2452d'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(w.py, 0, -18 - th + 22);
    if (easy) { g.font = '24px WK'; g.fillStyle = '#4a2e1c'; g.fillText(w.ch, 0, -18 - th + 48); }
    g.restore();
  }

  /* ---------- 餐馆场景 ---------- */
  const TABLE = { x: 837, y: 490, rx: 468, ry: 114 };
  const RING = { x: 835, y: 457, rx: 186, ry: 41 };
  const SEAT = { mm: [455, 480], hu: [610, 462], hh: [760, 454], cm: [915, 454], bk: [1065, 462], al: [1222, 480] };
  const rs = L.rs = { dishes: [], rot: 0, w: 0, target: null, plates: {}, moon: 0, beam: 0, soupMoon: false, free: false, tint: 0 };
  const angOf = x => -Math.acos(HH.clamp((x - RING.x) / (RING.rx * 1.35), -1, 1));
  const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  const placeOf = id => { const x = SEAT[id][0]; return { x: x * .82 + TABLE.x * .18, y: TABLE.y - TABLE.ry * Math.sqrt(Math.max(0, 1 - ((x - TABLE.x) / TABLE.rx) ** 2)) + 40 }; };
  const REST = L.REST = {
    id: 'rest', bg: 'bg/restaurant.jpg',
    size: y => 200 + (y - 440) * .325,
    walk: [[[120, 800], [1640, 800], [1660, 900], [100, 900]]],
    cam: { x: 836, y: 470, z: 1 },
    drawBack(g, t) {
      // 窗外的月亮（尾声）
      if (rs.moon > 0) {
        g.save(); g.globalAlpha = rs.moon;
        L.drawMoon(g, 150, 96, 20, t);
        g.restore();
      }
    },
    drawFront(g, t) {
      // 月光照在空椅子上
      if (rs.beam > 0) {
        g.save(); g.globalAlpha = rs.beam * (.55 + .08 * Math.sin(t * 2));
        const gr = g.createLinearGradient(150, 100, 640, 760); gr.addColorStop(0, 'rgba(255,248,210,.9)'); gr.addColorStop(1, 'rgba(255,248,210,.15)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(120, 60); g.lineTo(200, 40); g.lineTo(790, 700); g.lineTo(520, 800); g.closePath(); g.fill();
        g.globalAlpha = rs.beam * .5; g.fillStyle = '#fff6c8'; g.beginPath(); g.ellipse(632, 735, 140, 40, -.15, 0, 7); g.fill();
        g.restore();
      }
    },
    overlay(g, W, H) { if (rs.tint > 0) { g.fillStyle = 'rgba(40,30,80,' + rs.tint * .25 + ')'; g.fillRect(0, 0, W, H); } },
    update(dt) {
      if (!rs.drag) { rs.rot += rs.w * dt; rs.w *= Math.pow(.18, dt); if (Math.abs(rs.w) < .02) rs.w = 0; }
    },
  };
  /* 桌面：把背景图里桌面那一块再画一遍，盖住坐在后面的小伙伴的下半身 */
  function tableProp() {
    E.prop({ id: 'table', y: 500, draw(g) {
      const im = E.scene.bgImg; if (!E.ok(im)) return;
      g.save(); g.beginPath(); g.ellipse(TABLE.x, TABLE.y, TABLE.rx, TABLE.ry, 0, 0, 7); g.rect(TABLE.x - TABLE.rx, TABLE.y, TABLE.rx * 2, 26); g.clip();
      g.drawImage(im, 0, 0, E.scene.w, E.scene.h); g.restore();
    } });
    // 转盘上的菜、每个人面前的盘子
    E.prop({ id: 'ring', y: 501, draw(g, t) {
      const list = rs.dishes.map(d => { const a = d.a + rs.rot; return { d, a, x: RING.x + Math.cos(a) * RING.rx, y: RING.y + Math.sin(a) * RING.ry }; }).sort((p, q) => p.y - q.y);
      for (const p of list) {
        const s = .86 + .14 * (Math.sin(p.a) + 1) / 2, w = 132 * s * (p.d.pop || 1);
        const hot = rs.target && rs.target.dish === p.d.k;
        if (hot) { g.save(); g.fillStyle = 'rgba(255,230,90,' + (.35 + .2 * Math.sin(t * 6)) + ')'; g.beginPath(); g.ellipse(p.x, p.y - 4, w * .62, w * .2, 0, 0, 7); g.fill(); g.restore(); }
        const h = L.drawDish(g, p.d.k, p.x, p.y + 6, w);
        if (p.d.flag !== false) flag(g, p.d.k, p.x, p.y - h + 2, .82 * s, hot);
      }
      for (const [id, pl] of Object.entries(rs.plates)) {
        const pp = placeOf(id); L.drawDish(g, pl.k, pp.x, pp.y + 10, 104 * (pl.s || 1));
        if (pl.k === 'tang' && rs.soupMoon) { g.save(); g.fillStyle = 'rgba(255,240,160,.95)'; g.beginPath(); g.ellipse(pp.x + 4, pp.y - 16, 13, 4.5, 0, 0, 7); g.fill(); g.restore(); }
      }
      // 转到谁面前：桌边的小箭头
      if (rs.target) {
        const a = rs.target.ang, x = RING.x + Math.cos(a) * (RING.rx + 70), y = RING.y + Math.sin(a) * (RING.ry + 22) - 6 + Math.sin(t * 6) * 4;
        g.save(); g.fillStyle = '#ffd23f'; g.strokeStyle = '#4a2e1c'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x, y + 14); g.lineTo(x - 14, y - 6); g.lineTo(x + 14, y - 6); g.closePath(); g.fill(); g.stroke(); g.restore();
      }
    } });
  }
  L.setRest = (o = {}) => {
    E.load(REST);
    HH.music('rest');
    rs.dishes = []; rs.rot = 0; rs.w = 0; rs.target = null; rs.plates = {}; rs.moon = 0; rs.beam = 0; rs.soupMoon = false; rs.free = false; rs.tint = .4;
    tableProp();
    if (o.seated) {
      for (const id of ['mm', 'hu', 'hh', 'cm', 'bk', 'al']) { const a = E.add(id, SEAT[id][0], SEAT[id][1]); a.hFix = 268; }
      E.add('ma', 1540, 846);
    }
    E.onActor = null;
    // 月亮彩蛋：只在"找一找"的时候能点
    const st = (id, h, line) => E.hs(Object.assign({ id: 'st_' + id + h.x, always: true, walk: false, prio: 2, when: () => rs.free, on: async () => { await UI.sticker(id, line); } }, h));
    st('m_lantern', { x: 482, y: 70, r: 80 }, 'st_lantern'); st('m_lantern', { x: 1185, y: 70, r: 80 }, 'st_lantern');
    st('m_plate', { x: RING.x, y: RING.y, rx: 250, ry: 58 }, 'st_plate');
  };

  /* ---------- 洗手台场景 ---------- */
  const SINK = {
    id: 'sink', bg: 'bg/sink.jpg', size: () => 560, walk: [], cam: { x: 836, y: 560, z: 1 },
    drawBack(g) {
      if (E.ok(E.scene.bgImg)) return;
      // 还没有 Gemini 的图：画一个简单的洗手台
      g.fillStyle = '#f6ead6'; g.fillRect(0, 0, 1672, 941);
      g.strokeStyle = 'rgba(160,130,100,.25)'; g.lineWidth = 2;
      for (let x = 0; x < 1672; x += 90) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 620); g.stroke(); }
      for (let y = 0; y < 620; y += 90) { g.beginPath(); g.moveTo(0, y); g.lineTo(1672, y); g.stroke(); }
      g.fillStyle = '#b77a45'; g.fillRect(0, 620, 1672, 321);
      g.fillStyle = '#ffffff'; g.strokeStyle = '#4a2e1c'; g.lineWidth = 5; g.beginPath(); g.ellipse(836, 640, 360, 90, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#e8eef2'; g.beginPath(); g.ellipse(836, 650, 300, 62, 0, 0, 7); g.fill();
      g.fillStyle = '#c9d2da'; g.fillRect(810, 450, 52, 150); g.fillRect(760, 440, 170, 40);
      g.fillStyle = '#e9f1f7'; g.beginPath(); g.ellipse(836, 230, 170, 170, 0, 0, 7); g.fill(); g.stroke();
    },
  };

  /* ---------- 洗手小游戏（盖在洗手台上面的一层） ---------- */
  function washGame(o) {
    const box = UI.el('div', 'wash'); const c = document.createElement('canvas'); box.appendChild(c); layer.appendChild(box);
    const g = c.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    const fit = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; };
    fit(); addEventListener('resize', fit);
    const st = { water: 0, wet: 0, foam: 0, shine: 0, rub: 0, need: o.need || 2600, germs: [], muds: [], bubbles: [], towel: -1, done: false, steps: 0, label: '', labelT: 0, onRub: null, active: false };
    const col = o.col || '#c9c9cf', dark = o.dark || '#8c8c96';
    // 小爪子放在水龙头下面、洗手盆上面（按洗手台图里的位置）
    const P = () => { const s = H * .25, c0 = E.toScreen(838, 742); return [{ x: c0.x - s * .62, y: c0.y, s }, { x: c0.x + s * .62, y: c0.y, s }]; };
    const TAP = () => E.toScreen(905, 606);
    // 细菌、泥巴
    for (let i = 0; i < (o.germs || 6); i++) st.germs.push({ p: i % 2, dx: (Math.random() - .5) * .7, dy: (Math.random() - .3) * .7, hp: 1, c: ['#7bd96b', '#b07ce8', '#ffb347', '#5ec8e5'][i % 4], ph: Math.random() * 6, run: 0 });
    for (let i = 0; i < (o.mud || 0); i++) st.muds.push({ p: i % 2, dx: (Math.random() - .5) * .8, dy: (Math.random() - .4) * .8, r: .16 + Math.random() * .1, a: 1 });
    function paw(x, y, s, flip) {
      g.save(); g.translate(x, y); g.scale(flip ? -1 : 1, 1);
      // 袖口
      g.fillStyle = o.cuff || '#fff1a8'; g.strokeStyle = '#4a2e1c'; g.lineWidth = s * .035;
      g.beginPath(); g.ellipse(0, s * .78, s * .42, s * .2, 0, 0, 7); g.fill(); g.stroke();
      // 手掌
      g.fillStyle = col; g.beginPath();
      g.moveTo(-s * .36, s * .7); g.bezierCurveTo(-s * .52, s * .2, -s * .5, -s * .35, 0, -s * .42); g.bezierCurveTo(s * .5, -s * .35, s * .52, s * .2, s * .36, s * .7); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = dark; g.lineWidth = s * .03; g.lineCap = 'round';
      for (const k of [-.18, 0, .18]) { g.beginPath(); g.moveTo(s * (k - .05), s * .45); g.lineTo(s * (k + .02), s * .3); g.stroke(); }
      // 肉垫
      g.fillStyle = '#ffb3c1'; g.strokeStyle = '#c96f83'; g.lineWidth = s * .02;
      g.beginPath(); g.ellipse(0, s * .08, s * .2, s * .16, 0, 0, 7); g.fill(); g.stroke();
      for (const [px, py] of [[-.27, -.18], [-.1, -.3], [.1, -.3], [.27, -.18]]) { g.beginPath(); g.ellipse(s * px, s * py, s * .075, s * .085, 0, 0, 7); g.fill(); g.stroke(); }
      if (st.wet > 0) { g.globalAlpha = st.wet * .5; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(-s * .2, -s * .15, s * .06, s * .14, -.4, 0, 7); g.fill(); g.globalAlpha = 1; }
      g.restore();
    }
    function germ(gm, x, y, s, t) {
      const r = s * .09 * (.6 + .4 * gm.hp), wob = Math.sin(t * 6 + gm.ph) * r * .12;
      g.save(); g.translate(x, y + wob); g.globalAlpha = Math.min(1, gm.hp * 2 + .2);
      g.fillStyle = gm.c; g.strokeStyle = '#3a2a3a'; g.lineWidth = r * .12;
      g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr = r * (i % 2 ? 1 : 1.18); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-r * .32, -r * .15, r * .26, 0, 7); g.arc(r * .32, -r * .15, r * .26, 0, 7); g.fill();
      g.fillStyle = '#2a1a2a'; g.beginPath(); g.arc(-r * .3 + Math.sin(t * 3) * r * .06, -r * .12, r * .12, 0, 7); g.arc(r * .34 + Math.sin(t * 3) * r * .06, -r * .12, r * .12, 0, 7); g.fill();
      g.strokeStyle = '#2a1a2a'; g.lineWidth = r * .1; g.beginPath(); g.arc(0, r * .2, r * .3, .2, Math.PI - .2); g.stroke();
      g.restore();
    }
    let last = performance.now(), raf = 0;
    function frame(now) {
      const dt = Math.min(.05, (now - last) / 1000), t = now / 1000; last = now;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      const ps = P();
      g.fillStyle = 'rgba(255,248,235,.12)'; g.fillRect(0, 0, W, H);
      // 水流
      if (st.water > 0) {
        const tp = TAP(), wx = tp.x, top = tp.y, bot = P()[0].y - P()[0].s * .2;
        g.save(); g.globalAlpha = st.water * .75;
        const gr = g.createLinearGradient(wx - 30, 0, wx + 30, 0); gr.addColorStop(0, 'rgba(140,210,255,.2)'); gr.addColorStop(.5, 'rgba(200,240,255,.95)'); gr.addColorStop(1, 'rgba(140,210,255,.2)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(wx - 14, top);
        for (let y = top; y <= bot; y += 12) g.lineTo(wx - 14 - (y - top) * .06 + Math.sin(t * 20 + y * .1) * 3, y);
        for (let y = bot; y >= top; y -= 12) g.lineTo(wx + 14 + (y - top) * .06 + Math.sin(t * 22 + y * .1) * 3, y);
        g.fill(); g.restore();
        if (Math.random() < st.water * .5) HH.burst(wx + (Math.random() - .5) * H * .3, bot, 2, { kind: 'drop', col: 'water', speed: 120, up: 60 });
        st.wet = Math.min(1, st.wet + dt);
      }
      ps.forEach((p, i) => paw(p.x, p.y, p.s, i === 1));
      // 泥巴
      for (const m of st.muds) { if (m.a <= 0) continue; const p = ps[m.p]; g.globalAlpha = m.a * .85; g.fillStyle = '#7a4a24'; g.beginPath(); g.ellipse(p.x + m.dx * p.s * .5, p.y + m.dy * p.s * .5, p.s * m.r, p.s * m.r * .7, .4, 0, 7); g.fill(); g.globalAlpha = 1; }
      // 细菌
      for (const gm of st.germs) {
        if (gm.hp <= 0 && !gm.run) continue;
        const p = ps[gm.p];
        let x = p.x + gm.dx * p.s * .5, y = p.y + gm.dy * p.s * .5;
        if (gm.run) { gm.run += dt; x += (gm.dx > 0 ? 1 : -1) * gm.run * W * .8; y -= gm.run * H * .3; if (gm.run > 1.2) { gm.run = 0; gm.hp = 0; continue; } }
        germ(gm, x, y, p.s, t);
      }
      // 泡泡
      if (st.foam > 0) {
        g.save(); g.globalAlpha = Math.min(1, st.foam);
        for (const b of st.bubbles) { const p = ps[b.p]; g.fillStyle = 'rgba(255,255,255,.85)'; g.strokeStyle = 'rgba(150,200,240,.8)'; g.lineWidth = 2;
          g.beginPath(); g.arc(p.x + b.dx * p.s * .5, p.y + b.dy * p.s * .5 + Math.sin(t * 2 + b.ph) * 3, b.r * p.s, 0, 7); g.fill(); g.stroke(); }
        g.restore();
      }
      // 毛巾
      if (st.towel >= 0) {
        st.towel += dt * .8;
        const im = dishImg('towel'), tx = W * (1.1 - st.towel * 1.2), ty = H * .62;
        if (E.ok(im)) { const w = H * .5, h = w * im.naturalHeight / im.naturalWidth; g.drawImage(im, tx - w / 2, ty - h / 2, w, h); }
        else { g.fillStyle = '#ff9fb5'; g.strokeStyle = '#4a2e1c'; g.lineWidth = 4; g.beginPath(); g.rect(tx - H * .2, ty - H * .15, H * .4, H * .3); g.fill(); g.stroke(); }
        if (st.towel > 1) st.towel = -1;
      }
      // 七步口诀的大字
      if (st.label) {
        st.labelT += dt;
        const k = Math.min(1, st.labelT * 4);
        g.save(); g.translate(W / 2, H * .2); g.scale(.6 + .4 * k, .6 + .4 * k); g.globalAlpha = Math.min(1, 2.4 - st.labelT);
        g.font = 'bold ' + (H * .16) + 'px WK'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = H * .02; g.strokeStyle = '#4a2e1c'; g.strokeText(st.label, 0, 0); g.fillStyle = '#ffd23f'; g.fillText(st.label, 0, 0);
        g.restore();
        if (st.labelT > 2.4) st.label = '';
      }
      // 进度条
      if (st.active) {
        const bw = W * .3, k = Math.min(1, st.rub / st.need);
        g.fillStyle = 'rgba(74,46,28,.3)'; g.fillRect(W / 2 - bw / 2, H * .94, bw, H * .025);
        g.fillStyle = '#5bbf6a'; g.fillRect(W / 2 - bw / 2, H * .94, bw * k, H * .025);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    let lp = null;
    c.addEventListener('pointerdown', e => { lp = { x: e.clientX, y: e.clientY }; });
    c.addEventListener('pointermove', e => {
      if (!lp || !st.active) return;
      const d = Math.hypot(e.clientX - lp.x, e.clientY - lp.y); lp = { x: e.clientX, y: e.clientY };
      rubAt(e.clientX, e.clientY, d);
    });
    const end = () => { lp = null; };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    function rubAt(x, y, d) {
      const ps = P();
      const on = ps.some(p => Math.hypot(x - p.x, y - p.y) < p.s * .75);
      if (!on) return;
      st.rub += d;
      st.foam = Math.min(1.2, st.foam + d / 800);
      if (Math.random() < d / 60) { const pi = x < W / 2 ? 0 : 1, p = ps[pi]; st.bubbles.push({ p: pi, dx: (x - p.x) / (p.s * .5) + (Math.random() - .5) * .3, dy: (y - p.y) / (p.s * .5) + (Math.random() - .5) * .3, r: .03 + Math.random() * .05, ph: Math.random() * 6 }); if (st.bubbles.length > 90) st.bubbles.shift(); }
      for (const gm of st.germs) {
        if (gm.hp <= 0) continue;
        const p = ps[gm.p], gx = p.x + gm.dx * p.s * .5, gy = p.y + gm.dy * p.s * .5;
        if (Math.hypot(x - gx, y - gy) < p.s * .22) { gm.hp -= d / 260; if (gm.hp <= 0) { HH.sfx('pop'); HH.burst(gx, gy, 12, { kind: 'blob', col: 'water', speed: 160 }); } }
      }
      for (const m of st.muds) { const p = ps[m.p]; if (Math.hypot(x - (p.x + m.dx * p.s * .5), y - (p.y + m.dy * p.s * .5)) < p.s * .3) m.a = Math.max(0, m.a - d / 500); }
      if (Math.random() < .08) HH.sfx('chalk');
      if (st.onRub) st.onRub();
    }
    return L.curWash = {
      st, box,
      water: async (ms = 1600) => { HH.sfx('spray'); for (let i = 0; i <= 10; i++) { st.water = i / 10; await sleep(30); } await sleep(ms); for (let i = 10; i >= 0; i--) { st.water = i / 10; await sleep(30); } },
      soap: async () => { HH.sfx('pop'); const ps = P(); for (let i = 0; i < 16; i++) st.bubbles.push({ p: i % 2, dx: (Math.random() - .5) * .5, dy: (Math.random() - .5) * .5, r: .04 + Math.random() * .04, ph: Math.random() * 6 }); st.foam = .6; HH.burst(ps[0].x, ps[0].y, 10, { kind: 'blob', col: 'water' }); await sleep(500); },
      rinse: async () => { HH.sfx('spray'); for (let i = 0; i <= 10; i++) { st.water = i / 10; await sleep(30); } for (let i = 0; i < 40; i++) { st.foam = Math.max(0, st.foam - .04); for (const m of st.muds) m.a = Math.max(0, m.a - .05); await sleep(50); } st.bubbles = []; for (let i = 10; i >= 0; i--) { st.water = i / 10; await sleep(30); } },
      dry: async () => { HH.sfx('whoosh'); st.towel = 0; await sleep(1300); st.wet = 0; HH.sfx('magic'); const ps = P(); ps.forEach(p => HH.burst(p.x, p.y - p.s * .2, 18, { kind: 'star', speed: 240 })); await sleep(500); },
      scare: () => { for (const gm of st.germs) if (gm.hp > 0) { gm.hp = .5; gm.run = .01; } HH.sfx('laugh'); },
      rubAt,
      close: () => { cancelAnimationFrame(raf); removeEventListener('resize', fit); box.remove(); },
      on: async () => { HH.sfx('spray'); for (let i = 0; i <= 10; i++) { st.water = i / 10; await sleep(30); } },
      off: async () => { HH.sfx('click'); for (let i = 10; i >= 0; i--) { st.water = i / 10; await sleep(30); } },
      P,
    };
  }
  /* 一次完整的洗手：o.steps 要不要念七步口诀 */
  async function washOnce(wg, o) {
    const st = wg.st;
    if (o.full) {
      await say('h10', { hold: 0 });
      await UI.acts([{ t: '🚰 开水龙头', cls: 'green' }]);
      await wg.water(1200);
      await say('h11', { hold: 0 });
      await UI.acts([{ t: '抹香皂', img: 'dish/soap.webp' }]);
      await wg.soap();
    }
    await say(o.rubLine, { hold: 0 });
    st.active = true;
    const hp0 = wg.P()[0]; const hd = UI.el('div', 'hand', '👆'); hd.style.left = (hp0.x + hp0.s * .62) + 'px'; hd.style.top = hp0.y + 'px'; hd.style.animation = 'rubme 1.2s infinite'; layer.appendChild(hd);
    const thresholds = o.steps ? [1, 2, 3, 4, 5, 6, 7].map(i => st.need * (i - .4) / 7) : [];
    let si = 0;
    const LBL = '内外夹弓大立腕';
    st.onRub = () => {
      if (hd.parentNode && st.rub > 60) hd.remove();
      while (si < thresholds.length && st.rub >= thresholds[si]) { st.label = LBL[si]; st.labelT = 0; HH.sfx('ding'); HH.voice('w7_' + (si + 1), false); si++; }
    };
    if (HH.auto) {
      (async () => { const ps = wg.P(); for (let i = 0; i < 160 && st.rub < st.need * 1.05; i++) { for (const gm of st.germs) if (gm.hp > 0) { const p = ps[gm.p]; wg.rubAt(p.x + gm.dx * p.s * .5, p.y + gm.dy * p.s * .5, 120); } wg.rubAt(ps[i % 2].x, ps[i % 2].y, 60); await sleep(20); } })();
    }
    await new Promise(res => { const iv = setInterval(() => { if (st.rub >= st.need && st.germs.every(gm => gm.hp <= 0 || gm.run)) { clearInterval(iv); res(); } else if (st.rub >= st.need * 1.25) { wg.scare(); } }, 120); });
    st.active = false; st.onRub = null; hd.remove();
    // 剩下的细菌吓跑
    if (st.germs.some(gm => gm.hp > 0)) wg.scare();
    await sleep(600);
  }

  /* ---------- 3-1 先洗手 ---------- */
  L.RUN.s3a = async () => {
    L.setRest();
    UI.hudShow(true);
    E.prop({ id: 'baozi', y: 560, draw(g) { L.drawDish(g, 'baozi', 840, 575, 130); } });
    await say('h01');
    const enter = ['ma', 'hh', 'hu', 'cm', 'mm', 'bk', 'al'], stand = { ma: [1460, 870], hh: [380, 860], hu: [1250, 860], cm: [560, 870], mm: [240, 875], bk: [720, 875], al: [1060, 880] };
    await Promise.all(enter.map((id, i) => sleep(i * 260).then(() => { E.add(id, 1780, 870); return E.walk(id, stand[id][0], stand[id][1], { free: true }); })));
    for (const id of enter) E.face(id, 836);
    await say('h02');
    // 灰灰冲向包子
    const hu = E.actors.hu;
    E.hop('hu', 40); await say('h03', { hold: 0 });
    E.walk('hu', 990, 840, { free: true, speed: .45 });
    hu.wob = .06;
    await say('h04', { hold: 0 });
    await E.waitTap({ id: 'stopHu', get x() { return hu.x; }, get y() { return hu.y - hu.h * .5; }, w: 260, h: 380, walk: false, sparkle: true, sr: 30,
      on: async () => { hu.path = []; hu.moving = false; hu.shake = 1; HH.sfx('pop'); } });
    hu.path = []; if (hu.arrive) { const r = hu.arrive; hu.arrive = null; r(); }
    const hh = E.actors.hh;
    await E.walk('hh', hu.x - 230, 862, { free: true }); E.face('hh', hu.x); hu.flip = true;
    hh.pose = 'hand';
    await say('h05');
    hh.pose = 'stand';
    await say('h06'); await say('h07'); await say('h08');
    // 洗手台
    await UI.quiz('xi', { prompt: 'h09' });
    E.load(SINK);
    E.add('hh', 250, 1030, { hFix: 640 }); E.add('hu', 1440, 1040, { hFix: 640, flip: true });
    HH.music('rest');
    await sleep(300);
    const wg = washGame({ germs: 7, col: '#c9c9cf', dark: '#8c8c96', cuff: '#fff1a8', need: 2400 });
    await washOnce(wg, { full: true, steps: true, rubLine: 'h12' });
    await say('h13');
    await say('h14', { hold: 0 });
    await UI.acts([{ t: '🚰 冲水' }]);
    await wg.rinse();
    await say('h15', { hold: 0 });
    await UI.acts([{ t: '擦干', img: 'dish/towel.webp' }]);
    await wg.dry();
    await say('h16');
    wg.close();
    // 轮到灰灰
    await say('h17');
    const wg2 = washGame({ germs: 5, mud: 6, col: '#b0703f', dark: '#7a4522', cuff: '#ff9f6b', need: 1500 });
    await washOnce(wg2, { full: true, steps: false, rubLine: 'h18' });
    wg2.close();
    // 阿兰来冲水
    E.add('al', 836, 1050, { hFix: 700 });
    await say('h19');
    HH.sfx('spray'); HH.buzz(80);
    for (let k = 0; k < 8; k++) { HH.burst(innerWidth * (.15 + k * .1), innerHeight * .2, 22, { kind: 'drop', col: 'water', speed: 420, up: 200 }); await sleep(80); }
    for (const id of ['hh', 'hu', 'al']) E.actors[id].shake = 1;
    HH.sfx('laugh');
    await say('h20'); await say('h21');
    await UI.petal('weisheng');
  };

  /* ---------- 3-2 转盘分菜 ---------- */
  const ORDERS = [['hu', 'baozi', 'o_hu', 't_hu'], ['al', 'jiaozi', 'o_al', 't_al'], ['mm', 'yu', 'o_mm', 't_mm'], ['cm', 'qingcai', 'o_cm', 't_cm'], ['bk', 'tang', 'o_bk', 't_bk']];
  L.RUN.s3b = async () => {
    L.setRest({ seated: true });
    E.actors.ma.flip = true;
    await say('j01');
    E.hop('bk', 30); await say('j02');
    { const p = E.toScreen(632, 720); HH.burst(p.x, p.y, 20, { kind: 'star' }); }
    await say('j03'); E.hop('cm', 30); await say('j04');
    // 找一找像月亮的东西
    rs.free = true;
    await say('j04b', { hold: 0 });
    await UI.acts([{ t: '🍲 上菜啦' }], { autoPick: 0 });
    rs.free = false;
    HH.sfx('bell'); await say('j05', { hold: 0 });
    const ks = ['baozi', 'jiaozi', 'yu', 'qingcai', 'tang', 'tangyuan'];
    for (let i = 0; i < ks.length; i++) {
      const d = { k: ks[i], a: i / ks.length * Math.PI * 2 + .4, pop: .2 };
      rs.dishes.push(d); HH.sfx('pop');
      for (let j = 1; j <= 8; j++) { d.pop = .2 + .8 * Math.sin(j / 8 * Math.PI / 2) + (j === 6 ? .08 : 0); await sleep(25); }
      d.pop = 1; await sleep(120);
    }
    await say('j06');
    let first = true;
    for (const [id, k, oLine, tLine] of ORDERS) {
      E.hop(id, 26);
      await say(oLine);
      if (first) { await say('j07', { hold: 0 }); first = false; }
      await spinTo(id, k);
      // 菜从转盘滑到它面前
      const d = rs.dishes.find(x => x.k === k);
      rs.dishes = rs.dishes.filter(x => x !== d); rs.target = null;
      rs.plates[id] = { k, s: 1 };
      HH.sfx('right'); HH.buzz(30);
      { const pp = placeOf(id), p = E.toScreen(pp.x, pp.y); HH.burst(p.x, p.y, 20, { kind: 'star' }); }
      E.hop(id, 30);
      await say(tLine, { hold: 60 });
    }
    // 毛毛把汤圆给黄花
    await say('j08');
    const ty = rs.dishes.find(x => x.k === 'tangyuan'); rs.dishes = rs.dishes.filter(x => x !== ty);
    rs.plates.hh = { k: 'tangyuan', s: 1 }; HH.sfx('pop');
    await UI.quiz('xie', { prompt: 'j09', okLine: false });
    E.hop('hh', 26); await say('j10');
    await say('j11');
    // 分给老师
    await say('j12', { hold: 0 });
    const pp = placeOf('hh');
    await E.waitTap({ id: 'share', x: pp.x, y: pp.y - 20, w: 200, h: 130, walk: false, sparkle: true, sx: pp.x, sy: pp.y - 40 });
    HH.sfx('whoosh');
    { const a = E.toScreen(pp.x, pp.y - 30), b = E.toScreen(1500, 640); for (let i = 0; i < 3; i++) { HH.burst(HH.lerp(a.x, b.x, i / 3), HH.lerp(a.y, b.y, i / 3), 8, { kind: 'blob', col: 'chalk', speed: 80 }); await sleep(120); } }
    rs.plates.ma = null; delete rs.plates.ma;
    E.prop({ id: 'maBowl', y: 900, draw(g) { L.drawDish(g, 'tangyuan', 1440, 690, 96); } });
    E.actors.ma.sq = -.1; HH.sfx('cheer');
    await say('j13');
    await UI.petal('fenxiang');
  };
  /* 等玩家把 k 这道菜转到 id 面前 */
  async function spinTo(id, k) {
    const ang = angOf(SEAT[id][0]);
    rs.target = { dish: k, ang, id };
    const hint = UI.pill('<span>转一转</span><span class="py">' + D.words[k].py + '</span>', () => HH.voice('w_' + k));
    let lx = 0, lt = 0, vel = 0, front = true, nag = 0;
    E.capture = {
      down: p => { rs.drag = true; lx = p.x; lt = performance.now(); front = p.y > RING.y; rs.w = 0; vel = 0; },
      move: p => {
        if (!rs.drag) return;
        const now = performance.now(), dx = p.x - lx; lx = p.x;
        const dth = (front ? -1 : 1) * dx / (RING.rx * 1.1);
        rs.rot += dth; vel = vel * .6 + (dth / Math.max(.008, (now - lt) / 1000)) * .4; lt = now;
        if (Math.random() < .12) HH.sfx('tick');
      },
      up: () => { rs.drag = false; rs.w = HH.clamp(vel, -9, 9); },
    };
    const dishAng = () => { const d = rs.dishes.find(x => x.k === k); return d ? d.a + rs.rot : 0; };
    if (HH.auto) { (async () => { await sleep(40); rs.rot += angDiff(ang, dishAng()); rs.w = 0; })(); }
    await new Promise(res => {
      const iv = setInterval(() => {
        const diff = angDiff(ang, dishAng());
        if (!rs.drag && Math.abs(rs.w) < 1.4 && Math.abs(diff) < .32) {
          clearInterval(iv); E.capture = null; rs.w = 0;
          // 吸过去，对正
          (async () => { for (let i = 0; i < 8; i++) { rs.rot += angDiff(ang, dishAng()) * .4; await sleep(25); } res(); })();
          return;
        }
        // 停下来了但不对：提醒一下
        if (!rs.drag && rs.w === 0) { if (++nag === 60) { nag = 0; say(Math.abs(diff) < 1 ? 'spin_more' : 'spin_no'); } } else nag = 0;
      }, 50);
    });
    UI.unpill(); hint.remove && hint.remove();
  }
  // 拨转盘时的"嗒嗒"声
  (function () { const old = HH.sfx; HH.sfx = (n, a) => { if (n === 'tick') { try { old('click'); } catch (e) { } return; } old(n, a); }; })();

  /* ---------- 3-3 光盘行动 ---------- */
  L.RUN.s3c = async () => {
    if (!E.scene || E.scene.id !== 'rest' || !E.actors.hh) {
      L.setRest({ seated: true });
      rs.plates = { hu: { k: 'baozi' }, al: { k: 'jiaozi' }, mm: { k: 'yu' }, cm: { k: 'qingcai' }, bk: { k: 'tang' }, hh: { k: 'tangyuan' } };
      E.prop({ id: 'maBowl', y: 900, draw(g) { L.drawDish(g, 'tangyuan', 1440, 690, 96); } });
    }
    E.actors.ma.flip = true;
    await say('m01'); await say('m02');
    await riceGame();
    await UI.sticker('q_clean');
    await say('m08');
    // 阿兰吃不完
    E.hop('al', 20); await say('m09');
    await say('m10', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: '🗑️', lb: '倒掉', no: 'm_no' }, { ic: '📦', lb: '打包', ok: true }]));
    await say('m11');
    rs.plates.al = { k: 'box', s: .9 }; HH.sfx('pop');
    await say('m12');
    await UI.got('box');
    await UI.petal('jieyue');
    // 尾声：汤碗里的月亮
    rs.soupMoon = true; rs.tint = .6;
    E.hop('bk', 30); await say('z01', { hold: 0 });
    const bp = placeOf('bk');
    await E.waitTap({ id: 'soup', x: bp.x, y: bp.y - 20, w: 200, h: 140, walk: false, sparkle: true, sx: bp.x, sy: bp.y - 24 });
    await UI.sticker('m_soup', 'st_soup');
    E.hop('hu', 30); await say('z02');
    const hh = E.actors.hh;
    hh.pose = 'jump'; await say('z03'); hh.pose = 'stand';
    // 月光照在空椅子上
    HH.sfx('magic');
    for (let i = 1; i <= 20; i++) { rs.moon = i / 20; rs.beam = i / 20; await sleep(60); }
    await E.camTo({ x: 560, y: 470, z: 1.15 }, 1200);
    await say('z04');
    for (const id of ['mm', 'hu', 'hh', 'cm', 'bk', 'al']) E.face(id, 600);
    HH.sfx('cheer'); E.hopAll(['cm', 'mm', 'hh', 'hu', 'bk', 'al'], 26);
    await say('z05');
    await E.camTo({ x: 836, y: 470, z: 1 }, 1000);
    await say('z06');
    hh.pose = 'hand'; await say('z07'); hh.pose = 'stand';
    // 合影
    hh.pose = 'jump';
    await UI.photo('s3', '月亮庆功宴');
    hh.pose = 'stand';
    await say('z08');
    await say('end3');
  };
  /* 盛饭、吃饭、捡米粒 */
  function riceGame() {
    return new Promise(async resolve => {
      const box = UI.el('div', 'wash'); const c = document.createElement('canvas'); box.appendChild(c); layer.appendChild(box);
      const g = c.getContext('2d');
      let W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
      c.width = W * dpr; c.height = H * dpr;
      const st = L.curRice = { fill: 0, hold: false, line: .62, grains: [], eat: false, phase: 'scoop', bites: 0 };
      st.bowl = () => bowl();
      const bowl = () => ({ x: W * .56, y: H * .74, w: H * .62 });
      let raf = 0, last = performance.now();
      function frame(now) {
        const dt = Math.min(.05, (now - last) / 1000), t = now / 1000; last = now;
        if (st.hold) { st.fill = Math.min(1, st.fill + dt * .32); if (Math.random() < .3) HH.sfx('chalk'); }
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
        g.fillStyle = 'rgba(60,35,20,.55)'; g.fillRect(0, 0, W, H);
        // 桌面
        g.fillStyle = '#c9864a'; g.beginPath(); g.ellipse(W / 2, H * 1.02, W * .62, H * .42, 0, 0, 7); g.fill();
        // 饭锅
        L.drawDish(g, 'pot', W * .2, H * .82, H * .5);
        const b = bowl();
        const bh = L.drawDish(g, 'bowl', b.x, b.y, b.w);
        // 米饭：从碗口往上鼓起来
        const rimY = b.y - bh * .8, rw = b.w * .43;
        if (st.fill > 0) {
          const mh = st.fill * bh * .75;
          g.save(); g.beginPath(); g.ellipse(b.x, rimY, rw, rw * .26, 0, 0, Math.PI); g.lineTo(b.x - rw, rimY); g.ellipse(b.x, rimY, rw, mh + rw * .1, 0, Math.PI, 0); g.closePath();
          const gr = g.createLinearGradient(0, rimY - mh, 0, rimY + 10); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#eef0f2');
          g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(74,46,28,.45)'; g.lineWidth = 2.5; g.stroke(); g.clip();
          g.fillStyle = 'rgba(200,205,210,.7)';
          for (let i = 0; i < 70; i++) { const gx = b.x + Math.sin(i * 12.9898) * rw * .9, gy = rimY - Math.abs(Math.cos(i * 4.1)) * mh; g.beginPath(); g.ellipse(gx, gy, 4.5, 2.2, i, 0, 7); g.fill(); }
          g.restore();
        }
        // 小肚子线
        if (st.phase === 'scoop') {
          const ly = rimY - st.line * bh * .75;
          g.save(); g.setLineDash([14, 10]); g.strokeStyle = '#ff5d73'; g.lineWidth = 5; g.beginPath(); g.moveTo(b.x - rw * 1.25, ly); g.lineTo(b.x + rw * 1.25, ly); g.stroke(); g.setLineDash([]);
          g.font = (H * .045) + 'px WK'; g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('小肚子', b.x + rw * 1.32, ly);
          g.restore();
        }
        // 掉在桌上的米粒
        for (const gr of st.grains) {
          if (gr.got) continue;
          gr.vy += 900 * dt; gr.y = Math.min(gr.ty, gr.y + gr.vy * dt);
          g.save(); g.translate(gr.x, gr.y); g.rotate(gr.r);
          g.fillStyle = '#ffffff'; g.strokeStyle = '#4a2e1c'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, 10, 5, 0, 0, 7); g.fill(); g.stroke();
          if (st.phase === 'pick') { g.strokeStyle = 'rgba(255,230,90,' + (.5 + .5 * Math.sin(t * 6)) + ')'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.stroke(); }
          g.restore();
        }
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      const close = () => { cancelAnimationFrame(raf); box.remove(); };
      // 1 盛饭
      await say('m03', { hold: 0 });
      for (;;) {
        await holdButton(st);
        if (st.fill > st.line + .1) {
          await say('m_over');
          await say('m_back', { hold: 0 });
          await UI.acts([{ t: '↩ 倒回去' }]);
          HH.sfx('whoosh'); while (st.fill > st.line) { st.fill -= .02; await sleep(30); }
          break;
        }
        if (st.fill < st.line - .1) { await say('m_less', { hold: 0 }); continue; }
        break;
      }
      HH.sfx('right'); await say('m_ok');
      st.phase = 'eat';
      // 2 吃饭：点碗
      await say('m04', { hold: 0 });
      await new Promise(res => {
        const tap = e => {
          const b = bowl(); if (Math.hypot(e.clientX - b.x, e.clientY - (b.y - b.w * .3)) > b.w * .6) return;
          st.bites++; st.fill = Math.max(0, st.fill - st.line / 4.6); HH.sfx('pop'); HH.buzz(15);
          HH.burst(e.clientX, e.clientY - 30, 6, { kind: 'blob', col: 'chalk', speed: 90 });
          if (st.bites === 2 || st.bites === 4) for (let i = 0; i < 2; i++) st.grains.push({ x: b.x + (Math.random() - .5) * b.w * 1.1, y: b.y - b.w * .2, ty: H * .86 + Math.random() * H * .06, vy: -200, r: Math.random() * 3, got: false });
          if (st.fill <= .001) { c.removeEventListener('pointerdown', tap); res(); }
        };
        c.addEventListener('pointerdown', tap);
        if (HH.auto) (async () => { const b = bowl(); for (let i = 0; i < 8 && st.fill > 0; i++) { tap({ clientX: b.x, clientY: b.y - b.w * .3 }); await sleep(30); } })();
      });
      // 3 捡米粒
      st.phase = 'pick';
      await say('m05', { hold: 0 });
      await new Promise(res => {
        const tap = e => {
          for (const gr of st.grains) if (!gr.got && Math.hypot(e.clientX - gr.x, e.clientY - gr.y) < 46) { gr.got = true; HH.sfx('ding'); HH.burst(gr.x, gr.y, 8, { kind: 'star' }); break; }
          if (st.grains.every(x => x.got)) { c.removeEventListener('pointerdown', tap); res(); }
        };
        c.addEventListener('pointerdown', tap);
        if (HH.auto) (async () => { await sleep(300); for (const gr of st.grains) { tap({ clientX: gr.x, clientY: gr.y }); await sleep(20); } })();
      });
      await say('m06');
      HH.sfx('goal'); HH.burst(W / 2, H * .4, 40, { kind: 'star', col: 'rainbow', speed: 420 });
      await say('m07');
      close();
      resolve();
    });
  }
  /* 按住"盛饭"按钮：按着就往碗里加，松手返回 */
  function holdButton(st) {
    return new Promise(res => {
      const wrap = UI.el('div', 'acts'), b = UI.el('button', 'act green', '🍚 按住盛饭');
      wrap.appendChild(b); layer.appendChild(wrap);
      let started = false;
      b.addEventListener('pointerdown', e => { e.preventDefault(); started = true; st.hold = true; HH.sfx('pick'); try { b.setPointerCapture(e.pointerId); } catch (er) { } });
      const up = () => { if (!started) return; st.hold = false; wrap.remove(); res(); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
      if (HH.auto) (async () => { st.hold = true; started = true; while (st.fill < st.line) await sleep(20); up(); })();
    });
  }

  /* 关卡表里加上第三站 */
  L.SINK = SINK; L.washGame = washGame; L.washOnce = washOnce;
  L.LIST.push({ id: 's3a', st: 3, name: '先洗手' }, { id: 's3b', st: 3, name: '转盘分菜' }, { id: 's3c', st: 3, name: '光盘行动' });
  L.STAGES[3].soon = false;
})();
