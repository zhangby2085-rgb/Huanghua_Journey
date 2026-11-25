/* 黄花的生活 第二集：第六站 小花园（6-1 一水多用、6-2 小水滴的旅行）；6-3 还书在 levels4.js */
(function () {
  const HH = window.HH, D = HH.D, E = HH.E, UI = HH.UI, S = HH.S, L = HH.L;
  const say = UI.say, sleep = HH.sleep;
  const INK = '#4a2e1c';

  /* ---------- 花园场景 ---------- */
  const FLOWERS = [[150, 562], [292, 550], [425, 562], [1090, 545], [1265, 535], [1445, 545]];
  const COLS = ['#ff8fa3', '#ffd23f', '#c77dff', '#ff9f43', '#ff6b9a', '#7ec8ff'];
  const SUN = { x: 1250, y: 92, r: 52 };
  const MID = { x: 870, y: 120 };
  const gd = L.gd = { flowers: [], sun: 0, clouds: [], rain: 0, stream: 0, merged: 0, can: null };
  function drawFlower(g, f, t) {
    const k = f.bloom, droop = 1 - k, x = f.x, y = f.y;
    const len = 70 + 18 * k, sway = Math.sin(t * 2 + f.x) * 3;
    const hx = x + Math.sin(droop * 1.4) * len * .7 + sway, hy = y - Math.cos(droop * 1.4) * len;
    g.strokeStyle = '#3d8a3d'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y - len * .6, hx, hy); g.stroke();
    g.fillStyle = '#5bbf6a'; g.strokeStyle = INK; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(x + 14, y - 26, 16, 7, -.5, 0, 7); g.fill(); g.stroke();
    const r = 16 + 12 * k;
    g.save(); g.translate(hx, hy); g.rotate(droop * 1.2);
    g.fillStyle = k > .05 ? f.c : '#c9a27a';
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.beginPath(); g.ellipse(Math.cos(a) * r * .8, Math.sin(a) * r * .8, r * .55, r * .38, a, 0, 7); g.fill(); g.stroke(); }
    g.fillStyle = '#ffcf33'; g.beginPath(); g.arc(0, 0, r * .45, 0, 7); g.fill(); g.stroke();
    if (k > .9) { g.fillStyle = INK; g.beginPath(); g.arc(-r * .15, -r * .05, 2.4, 0, 7); g.arc(r * .15, -r * .05, 2.4, 0, 7); g.fill(); g.beginPath(); g.arc(0, r * .08, r * .14, .2, Math.PI - .2); g.stroke(); }
    g.restore();
    // 喝水进度
    if (f.w > 0 && f.w < 1) { g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(x - 30, y + 10, 60, 10); g.fillStyle = '#5aa9ef'; g.fillRect(x - 30, y + 10, 60 * f.w, 10); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x - 30, y + 10, 60, 10); }
  }
  function cloud(g, c, t) {
    const s = c.s, gray = c.gray || 0;
    const col = 'rgb(' + Math.round(255 - gray * 120) + ',' + Math.round(255 - gray * 115) + ',' + Math.round(255 - gray * 90) + ')';
    g.save(); g.translate(c.x, c.y + Math.sin(t * 1.5 + c.x) * 3); g.globalAlpha = c.a == null ? 1 : c.a;
    g.fillStyle = col; g.strokeStyle = INK; g.lineWidth = 4;
    g.beginPath(); for (const [dx, dy, r] of [[-38, 8, 30], [-10, -14, 38], [26, -4, 32], [44, 12, 24], [0, 14, 30]]) { g.moveTo(dx * s + r * s, dy * s); g.arc(dx * s, dy * s, r * s, 0, 7); } g.fill();
    g.beginPath(); for (const [dx, dy, r] of [[-38, 8, 30], [-10, -14, 38], [26, -4, 32], [44, 12, 24], [0, 14, 30]]) { g.moveTo(dx * s + r * s, dy * s); g.arc(dx * s, dy * s, r * s, 0, 7); } g.stroke();
    g.fillStyle = col; g.beginPath(); for (const [dx, dy, r] of [[-38, 8, 30], [-10, -14, 38], [26, -4, 32], [44, 12, 24], [0, 14, 30]]) { g.moveTo(dx * s + (r - 4) * s, dy * s); g.arc(dx * s, dy * s, (r - 4) * s, 0, 7); } g.fill();
    if (c.face) { g.fillStyle = INK; g.beginPath(); g.arc(-14 * s, 4 * s, 4 * s, 0, 7); g.arc(14 * s, 4 * s, 4 * s, 0, 7); g.fill(); g.lineWidth = 3; g.beginPath(); g.arc(0, 12 * s, 7 * s, .2, Math.PI - .2); g.stroke(); }
    g.restore();
  }
  const GD = L.GD = {
    id: 'garden', bg: 'bg/garden.jpg',
    size: y => 150 + (y - 600) * .7,
    walk: [[[440, 640], [1070, 640], [1250, 925], [330, 925]]],
    cam: { x: 836, y: 470, z: 1 },
    drawBack(g, t) {
      if (!HH.has('stickers', 'd_garden')) L.tinyDrop(g, 1405, 612, .8, t);
      if (gd.sun > 0) {
        g.save(); g.translate(SUN.x, SUN.y); g.globalAlpha = Math.min(1, gd.sun);
        const glow = g.createRadialGradient(0, 0, SUN.r * .5, 0, 0, SUN.r * (2.4 + gd.hot * .8)); glow.addColorStop(0, 'rgba(255,230,120,.8)'); glow.addColorStop(1, 'rgba(255,230,120,0)');
        g.fillStyle = glow; g.beginPath(); g.arc(0, 0, SUN.r * 3.2, 0, 7); g.fill();
        g.rotate(t * .4); g.strokeStyle = '#ffb703'; g.lineWidth = 8; g.lineCap = 'round';
        for (let i = 0; i < 10; i++) { g.rotate(Math.PI / 5); g.beginPath(); g.moveTo(SUN.r * 1.2, 0); g.lineTo(SUN.r * 1.55, 0); g.stroke(); }
        g.fillStyle = '#ffd23f'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, SUN.r, 0, 7); g.fill(); g.stroke();
        g.rotate(-t * .4); g.fillStyle = INK; g.beginPath(); g.arc(-16, -6, 5, 0, 7); g.arc(16, -6, 5, 0, 7); g.fill(); g.lineWidth = 4; g.beginPath(); g.arc(0, 8, 14, .2, Math.PI - .2); g.stroke();
        g.restore();
      }
      for (const c of gd.clouds) cloud(g, c, t);
      // 小河：雨水顺着小路流走
      if (gd.stream > 0) {
        g.save(); g.globalAlpha = Math.min(1, gd.stream) * .85;
        const pts = [[690, 420], [745, 520], [700, 640], [770, 770], [720, 945]];
        g.fillStyle = '#7cc8ff'; g.strokeStyle = '#3d8ad9'; g.lineWidth = 4;
        g.beginPath();
        pts.forEach(([x, y], i) => { const w = 14 + i * 26; i ? g.lineTo(x - w, y) : g.moveTo(x - w, y); });
        for (let i = pts.length - 1; i >= 0; i--) { const [x, y] = pts[i], w = 14 + i * 26; g.lineTo(x + w, y); }
        g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3;
        for (let i = 0; i < 12; i++) { const k = ((i / 12 + t * .25) % 1), j = Math.min(3, Math.floor(k * 4)), f = k * 4 - j, a = pts[j], b = pts[j + 1]; const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f; g.beginPath(); g.moveTo(x - 12, y); g.quadraticCurveTo(x, y - 6, x + 12, y); g.stroke(); }
        g.restore();
      }
      for (const f of gd.flowers) drawFlower(g, f, t);
    },
    drawFront(g, t) {
      if (gd.rain > 0) {
        g.save(); g.globalAlpha = Math.min(1, gd.rain); g.strokeStyle = 'rgba(150,200,255,.9)'; g.lineWidth = 3;
        for (let i = 0; i < 90; i++) { const x = (i * 131 + t * 120) % 1700, y = 140 + ((i * 71 + t * 1100) % 820); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 30); g.stroke(); }
        g.restore();
      }
    },
  };
  L.setGarden = (o = {}) => {
    E.load(GD);
    HH.music('garden');
    gd.flowers = FLOWERS.map(([x, y], i) => ({ x, y, c: COLS[i], w: o.bloomed ? 1 : 0, bloom: o.bloomed ? 1 : 0 }));
    gd.sun = 0; gd.hot = 0; gd.clouds = []; gd.rain = 0; gd.stream = 0;
    const at = { hh: [700, 760], mm: [520, 820], hu: [980, 800], cm: [1150, 860], bk: [380, 880], al: [880, 900], ma: [1500, 880] };
    for (const id of ['hh', 'mm', 'hu', 'cm', 'bk', 'al', 'ma']) E.add(id, at[id][0], at[id][1]);
    E.add('dd', 800, 740, { float: 210, pose: 'happy' });
    E.actors.ma.flip = true;
    E.onActor = L.chat; E.onFloor = null;
  };

  /* ---------- 6-1 一水多用 ---------- */
  L.RUN.s6a = async () => {
    L.setGarden();
    UI.hudShow(true);
    await say('ga01');
    await say('ga02');
    await say('ga03');
    const basin = L.itemProp('basin', 'basin', 836, 905, 190);
    HH.sfx('pop');
    await say('ga04', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: '🌸', lb: '浇花', ok: true }, { ic: '🗑️', lb: '倒掉', no: 'ga_no' }]));
    E.actors.dd.pose = 'happy'; await say('ga05');
    await UI.quiz('hua', { prompt: 'ga06' });
    await say('ga07', { hold: 0 });
    await waterGame();
    E.unprop('basin');
    HH.sfx('cheer'); E.hopAll(['mm', 'hh', 'cm'], 24);
    await say('ga08');
    await UI.petal('qiaoyong');
    await L.peek('d_garden', { x: 1405, y: 590, r: 70 });
  };
  /* 拿着洒水壶在花上面划 */
  function waterGame() {
    return new Promise(res => {
      const can = L.itemProp('canp', 'can', 836, 760, 150, { z: 0, dy: 400, rot: 0 });
      let held = false, done = false;
      const hand = UI.hand(836, 700);
      const step = dt => {
        if (!held) { can.rot *= .9; return; }
        can.rot = -.55;
        const sx = can.x + 70, sy = can.y - 20; // 壶嘴
        let any = false;
        for (const f of gd.flowers) {
          if (f.bloom >= 1) continue;
          if (Math.abs(sx - f.x) < 80 && sy < f.y + 30) {
            any = true; f.w = Math.min(1, f.w + dt * .7);
            if (f.w >= 1 && !f.blooming) { f.blooming = true; HH.sfx('ding'); (async () => { for (let i = 1; i <= 12; i++) { f.bloom = i / 12; await sleep(30); } const p = E.toScreen(f.x, f.y - 80); HH.burst(p.x, p.y, 20, { kind: 'petal', col: 'petal' }); })(); }
          }
        }
        if (Math.random() < .5) { const p = E.toScreen(sx, sy); HH.burst(p.x, p.y, 2, { kind: 'drop', col: 'water', speed: 90, up: -40, g: 700 }); }
        if (any && Math.random() < .08) HH.sfx('drip');
        if (!done && gd.flowers.every(f => f.bloom >= 1)) { done = true; finish(); }
      };
      E.frameHooks.push(step);
      E.capture = {
        down: p => { held = true; hand.kill(); can.x = p.x; can.y = p.y + 40; },
        move: p => { if (held) { can.x = p.x; can.y = p.y + 40; } },
        up: () => { held = false; },
      };
      const finish = async () => {
        E.capture = null; E.frameHooks.splice(E.frameHooks.indexOf(step), 1);
        await sleep(600); E.unprop('canp'); res();
      };
      if (HH.auto) setTimeout(() => { for (const f of gd.flowers) { f.w = 1; f.bloom = 1; } held = true; }, 30);
    });
  }

  /* ---------- 6-2 小水滴的旅行 ---------- */
  L.RUN.s6b = async () => {
    if (!E.scene || E.scene.id !== 'garden') L.setGarden({ bloomed: true });
    const dd = E.actors.dd, hh = E.actors.hh;
    dd.pose = 'happy'; await say('cy01');
    await say('cy02');
    await E.camTo({ x: 900, y: 390, z: 1 }, 900);
    for (let i = 1; i <= 15; i++) { gd.sun = i / 15; await sleep(30); }
    await say('cy03', { hold: 0 });
    await E.waitTap({ id: 'sun', x: SUN.x, y: SUN.y, r: 90, walk: false, sparkle: false });
    HH.sfx('magic'); gd.hot = 1;
    // 滴滴晒热了，飘上天
    dd.pose = 'happy';
    say('cy04', { hold: 0 });
    for (let i = 0; i < 60; i++) {
      dd.float += 9; dd.alpha = Math.max(.15, 1 - i / 70);
      if (i % 6 === 0) { const p = E.toScreen(dd.x + (Math.random() - .5) * 60, dd.y - dd.float); HH.burst(p.x, p.y, 3, { kind: 'blob', col: 'chalk', speed: 40, up: 80, g: -60 }); }
      await sleep(40);
    }
    dd.vis = false;
    await say('cy05');
    gd.clouds = [{ x: 430, y: 80, s: .9, a: 0 }, { x: 1080, y: 210, s: .8, a: 0 }, { x: 1520, y: 140, s: .85, a: 0 }];
    for (let i = 1; i <= 12; i++) { for (const c of gd.clouds) c.a = i / 12; await sleep(30); }
    await UI.quiz('yun', { prompt: 'cy06' });
    await say('cy07', { hold: 0 });
    await pushClouds();
    // 合成一朵大乌云
    HH.sfx('whoosh');
    const big = { x: MID.x, y: MID.y, s: .9, gray: 0, face: true };
    for (let i = 1; i <= 16; i++) { const k = i / 16; big.s = .9 + .9 * k; big.gray = k; for (const c of gd.clouds) { c.x = HH.lerp(c.x, MID.x, .3); c.y = HH.lerp(c.y, MID.y, .3); c.a = 1 - k; } if (i === 8) gd.clouds.push(big); await sleep(40); }
    gd.clouds = [big];
    await say('cy08');
    await UI.quiz('yu3', { prompt: 'cy09' });
    await say('cy10', { hold: 0 });
    await E.waitTap({ id: 'cloud', x: MID.x, y: MID.y, r: 160, walk: false, sparkle: true, sx: MID.x, sy: MID.y - 20 });
    // 下雨，小路变成小河
    HH.sfx('spray');
    for (let i = 1; i <= 10; i++) { gd.rain = i / 10; await sleep(60); }
    await E.camTo({ x: 836, y: 470, z: 1 }, 1000);
    for (let i = 1; i <= 20; i++) { gd.stream = i / 20; await sleep(60); }
    dd.vis = true; dd.alpha = 1; dd.float = 30; dd.x = 690; dd.y = 440; dd.hFix = 300; dd.pose = 'happy';
    say('cy11', { hold: 0 });
    await E.walk('dd', 700, 640, { free: true, speed: 1.4 });
    await E.walk('dd', 760, 770, { free: true, speed: 1.4 });
    await E.walk('dd', 720, 1000, { free: true, speed: 1.4 });
    dd.vis = false;
    await sleep(800);
    for (let i = 10; i >= 0; i--) { gd.rain = i / 10; big.gray = i / 10; await sleep(60); }
    for (let i = 20; i >= 0; i--) { gd.stream = i / 20; await sleep(50); }
    gd.clouds = []; gd.sun = 1;
    E.remove('dd');
    for (const id of ['hh', 'mm', 'hu', 'cm', 'bk', 'al']) E.face(id, 720);
    await say('cy12');
    await say('cy13');
  };
  /* 把三朵小白云推到中间 */
  function pushClouds() {
    return new Promise(res => {
      let cur = null, done = false;
      const ring = { id: 'midRing', y: MID.y + 200, draw(g, t) { g.save(); g.strokeStyle = 'rgba(255,255,255,' + (.5 + .4 * Math.sin(t * 4)) + ')'; g.lineWidth = 6; g.setLineDash([16, 12]); g.beginPath(); g.ellipse(MID.x, MID.y, 120, 70, 0, 0, 7); g.stroke(); g.restore(); } };
      E.prop(ring);
      const check = () => {
        if (gd.clouds.every(c => Math.hypot(c.x - MID.x, c.y - MID.y) < 110)) { if (!done) { done = true; E.capture = null; E.unprop('midRing'); res(); } }
      };
      E.capture = {
        down: p => { cur = gd.clouds.filter(c => Math.hypot(c.x - p.x, c.y - p.y) < 130).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0] || null; if (cur) { cur.ox = cur.x - p.x; cur.oy = cur.y - p.y; HH.sfx('pick'); } },
        move: p => { if (cur) { cur.x = p.x + cur.ox; cur.y = HH.clamp(p.y + cur.oy, 40, 300); } },
        up: () => { if (cur && Math.hypot(cur.x - MID.x, cur.y - MID.y) < 110) { HH.sfx('pop'); cur.x = HH.lerp(cur.x, MID.x, .5); cur.y = HH.lerp(cur.y, MID.y, .5); } cur = null; check(); },
      };
      if (HH.auto) setTimeout(() => { for (const c of gd.clouds) { c.x = MID.x; c.y = MID.y; } check(); }, 30);
    });
  }

  L.LIST.push({ id: 's4a', st: 4, name: '嘘，小声点' }, { id: 's4b', st: 4, name: '找书' }, { id: 's4c', st: 4, name: '排队借书' },
    { id: 's5a', st: 5, name: '敲门上厕所' }, { id: 's5b', st: 5, name: '关紧水龙头' }, { id: 's5c', st: 5, name: '木乃伊灰灰' },
    { id: 's6a', st: 6, name: '一水多用' }, { id: 's6b', st: 6, name: '小水滴的旅行' }, { id: 's6c', st: 6, name: '按时还书' });
})();
