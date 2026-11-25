/* 黄花的生活 第四集《红绿灯小卫士》：第十站 马路口、第十一站 公交车、第十二站 公园 */
(function () {
  const HH = window.HH, D = HH.D, E = HH.E, UI = HH.UI, S = HH.S, L = HH.L;
  const say = UI.say, sleep = HH.sleep;
  const INK = '#4a2e1c';
  const ico = (src, h = 11) => '<img src="' + HH.IMG + src + '" style="height:' + h + 'vh;display:block">';
  const KIDS = ['mm', 'hu', 'cm', 'bk', 'al'];

  /* ---------- 马路口 ---------- */
  const st = L.st4 = { light: 'red', cars: [], carOn: false, ball: null };
  /* 小汽车：从远处开过来，越来越大 */
  function drawCar(g, c, t) {
    const s = c.s, x = c.x, y = c.y;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(43,29,20,.25)'; g.beginPath(); g.ellipse(0, 4, 120, 18, 0, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = 6; g.lineJoin = 'round';
    g.fillStyle = c.col; L.rr(g, -110, -95, 220, 90, 30); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-70, -95); g.quadraticCurveTo(-60, -160, 0, -160); g.quadraticCurveTo(60, -160, 70, -95); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#cfefff'; g.beginPath(); g.moveTo(-55, -100); g.quadraticCurveTo(-48, -148, 0, -148); g.quadraticCurveTo(48, -148, 55, -100); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#fff6b0'; for (const sx of [-75, 75]) { g.beginPath(); g.arc(sx, -55, 17, 0, 7); g.fill(); g.stroke(); }
    g.fillStyle = '#333'; for (const sx of [-80, 80]) { g.beginPath(); L.rr(g, sx - 18, -12, 36, 22, 8); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.7)'; L.rr(g, -40, -40, 80, 14, 7); g.fill();
    g.restore();
  }
  function drawSignal(g, x, y, on, kind, t) {
    // kind 'red' 站着的小人，'green' 走路的小人
    const w = 54, h = 54;
    g.save(); g.translate(x, y);
    if (on) {
      const glow = g.createRadialGradient(0, 0, 10, 0, 0, 70); glow.addColorStop(0, kind === 'red' ? 'rgba(255,80,60,.75)' : 'rgba(80,255,120,.75)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = glow; g.beginPath(); g.arc(0, 0, 70, 0, 7); g.fill();
    }
    g.fillStyle = on ? (kind === 'red' ? '#ff4b3a' : '#3fe06a') : '#2b2f33'; L.rr(g, -w / 2, -h / 2, w, h, 10); g.fill();
    g.strokeStyle = on ? '#fff' : (kind === 'red' ? '#6b2b24' : '#24502e'); g.fillStyle = g.strokeStyle; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.arc(0, -15, 6, 0, 7); g.fill();
    if (kind === 'red') { g.beginPath(); g.moveTo(0, -8); g.lineTo(0, 8); g.moveTo(-9, -3); g.lineTo(0, -6); g.lineTo(9, -3); g.moveTo(-5, 20); g.lineTo(0, 8); g.lineTo(5, 20); g.stroke(); }
    else { const k = Math.sin(t * 8) * 5; g.beginPath(); g.moveTo(0, -8); g.lineTo(2, 6); g.moveTo(-8, -2 + k * .3); g.lineTo(0, -5); g.lineTo(9, 2 - k * .3); g.moveTo(-7 - k, 20); g.lineTo(2, 6); g.lineTo(9 + k, 20); g.stroke(); }
    g.restore();
  }
  const STREET = L.STREET = {
    id: 'street', bg: 'bg/street.jpg', cam: { x: 836, y: 520, z: 1 },
    size: y => 150 + (y - 600) * .62,
    walk: [[[30, 640], [470, 640], [500, 690], [1240, 690], [1220, 640], [1660, 640], [1660, 930], [30, 930]]],
    drawBack(g, t) {
      if (!HH.has('stickers', 's_street')) L.tinyStar(g, 1592, 330, .9, t);
      for (const [x, y] of [[361, 188], [1355, 187]]) drawSignal(g, x, y, st.light === 'red', 'red', t);
      for (const [x, y] of [[361, 254], [1355, 252]]) drawSignal(g, x, y, st.light === 'green', 'green', t);
    },
  };
  // 小汽车每一帧往前开；绿灯（行人）的时候停在斑马线前面
  function carTick(dt) {
    if (!E.scene || E.scene.id !== 'street') return;
    if (st.carOn && st.light === 'red' && !st.cars.some(c => c.k < .45)) {
      const c = { k: 0, col: HH.pick(['#ff7b6b', '#5aa9ef', '#ffd23f', '#7ccf6b', '#c79bff']), id: 'car' + Math.random() };
      c.prop = E.prop({ id: c.id, get y() { return c.y; }, draw: g => drawCar(g, c, 0) });
      st.cars.push(c);
    }
    for (const c of st.cars) {
      // 行人绿灯：车停在斑马线前面
      const stopAt = .2, nk = c.k + dt * .28;
      if (!(st.light === 'green' && c.k <= stopAt && nk > stopAt)) c.k = nk;
      c.x = HH.lerp(905, 1180, c.k * c.k); c.y = HH.lerp(505, 1160, c.k); c.s = .12 + c.k * 1.25;
    }
    for (const c of st.cars.filter(c => c.k > 1.05)) E.unprop(c.id);
    st.cars = st.cars.filter(c => c.k <= 1.05);
  }
  E.frameHooks.push(carTick);
  const setStreet = (o = {}) => {
    E.load(STREET); HH.music('play'); E.onActor = L.chat; E.onFloor = null;
    st.light = 'red'; st.cars = []; st.carOn = o.cars !== false;
    const at = o.at || { ma: [330, 655], hh: [400, 700], mm: [240, 690], hu: [150, 735], cm: [300, 760], bk: [90, 790], al: [110, 660] };
    for (const id of ['ma', 'hh', 'mm', 'hu', 'cm', 'bk', 'al']) if (at[id]) E.add(id, at[id][0], at[id][1]);
    E.actors.ma.flip = false;
  };
  const ACROSS = { ma: [1340, 660], hh: [1420, 700], mm: [1260, 720], hu: [1500, 740], cm: [1330, 790], bk: [1580, 690], al: [1480, 830] };

  /* 10-1 红灯停，绿灯行 */
  L.RUN.s10a = async () => {
    setStreet(); UI.hudShow(true);
    await say('r01');
    await say('r02');
    await UI.quiz('hong', { prompt: 'r03' });
    await UI.quiz('lv', { prompt: 'r04' });
    await say('r05', { hold: 0 });
    // 红灯的时候点"走"：灰灰提醒；等变成绿灯再点
    let pressedRed = 0;
    const go = UI.el('div', 'acts'), btn = UI.el('button', 'act green', '🚶 走！'); go.appendChild(btn); HH.$('#layer').appendChild(go);
    await new Promise(res => {
      let busy = false;
      btn.onclick = async () => {
        if (busy) return;
        if (st.light === 'red') { busy = true; pressedRed++; HH.sfx('wrong'); btn.classList.remove('wrong'); void btn.offsetWidth; btn.classList.add('wrong'); E.hop('hu', 30); await say('r_red', { hold: 40 }); busy = false; return; }
        HH.sfx('pop'); go.remove(); res();
      };
      (async () => {
        await sleep(2600); if (st.light === 'red') say('r_wait', { hold: 0 });
        await sleep(2600);
        st.light = 'green'; HH.sfx('ding'); await say('r_green', { hold: 0 });
        if (HH.auto) btn.onclick();
      })();
    });
    await UI.petal('kandeng');
  };
  /* 10-2 手拉手，左看看右看看，走斑马线 */
  L.RUN.s10b = async () => {
    if (!E.scene || E.scene.id !== 'street') { setStreet(); st.light = 'green'; }
    st.light = 'green';
    await say('r06', { hold: 0 });
    const line = [[470, 700], [380, 740], [300, 700], [210, 760], [160, 680]];
    await L.queueUp(KIDS, line.map(p => [p[0], p[1], false]));
    HH.sfx('cheer');
    await say('r07');
    await UI.quiz('zou', { prompt: 'r08' });
    await say('r09', { hold: 0 });
    const hh = E.actors.hh;
    await UI.acts([{ t: '👈 左看看', cls: 'green' }]); hh.flip = true; await E.camTo({ x: 600, z: 1.15 }, 600); await sleep(500);
    await UI.acts([{ t: '右看看 👉', cls: 'green' }]); hh.flip = false; await E.camTo({ x: 1100, z: 1.15 }, 700); await sleep(500);
    await E.camTo({ x: 836, z: 1 }, 600);
    await say('r10');
    await Promise.all(['ma', 'hh', ...KIDS].map((id, i) => sleep(i * 160).then(() => E.walk(id, ACROSS[id][0], ACROSS[id][1], { free: true }))));
    for (const id of ['hh', ...KIDS]) E.face(id, 400);
    await UI.petal('banma');
  };
  /* 10-3 球滚到马路上 */
  L.RUN.s10c = async () => {
    if (!E.scene || E.scene.id !== 'street') setStreet({ at: ACROSS });
    st.light = 'red';
    const hu = E.actors.hu;
    const ball = { id: 'ball', x: hu.x - 60, y: hu.y, z: 0, r: 34, rot: 0, draw(g) { L.drawImg(g, 'ball2', this.x, this.y - this.z, this.r * 2, this.rot); } };
    E.prop(ball);
    HH.sfx('kick'); E.hop('hu', 30);
    for (let i = 0; i < 40; i++) { ball.x -= 9; ball.y += 4; ball.rot -= .25; await sleep(25); }
    await say('r11');
    await say('r12', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: ico('ch/jc.webp', 12), lb: '找警察叔叔', ok: true }, { ic: '🏃', lb: '冲过去捡', no: 'r_no1' }, { ic: '⚽', lb: '在路边玩', no: 'r_no2' }]));
    st.carOn = false;
    E.add('jc', 1750, 680); await E.walk('jc', 1450, 650, { free: true });
    await say('r13');
    await E.walk('jc', ball.x + 70, ball.y, { free: true }); E.unprop('ball'); HH.sfx('pick');
    L.imgProp('jball', 'ball2', 0, 0, 60, { get x() { return E.actors.jc.x - 50; }, get y() { return E.actors.jc.y - E.actors.jc.h * .4; }, dy: 2 });
    await E.walk('jc', hu.x + 120, hu.y + 10, { free: true }); E.face('jc', hu.x);
    E.unprop('jball'); HH.sfx('pop'); E.hop('hu', 40);
    await say('r14');
    await UI.sticker('q_ball2');
    await L.peekStar('s_street', { x: 1592, y: 330, r: 70 });
    await say('end10');
  };

  /* ---------- 公交车 ---------- */
  const bus = L.bus4 = { sway: 0, seats: {} };
  const SEATS = { bk: [305, 702], mm: [565, 702], cm: [815, 702], hh: [1100, 702], hu: [1410, 702] };
  const SEATX = [[190, 420], [460, 670], [720, 910], [970, 1230], [1270, 1550]];
  const BUS = {
    id: 'bus', bg: 'bg/bus.jpg', cam: { x: 836, y: 520, z: 1 },
    size: y => 200 + (y - 650) * .75,
    walk: [[[120, 760], [1560, 760], [1600, 930], [80, 930]]],
    drawBack(g, t) {
      if (!HH.has('stickers', 's_bus')) L.tinyStar(g, 150, 262, .8, t);
      // 窗外的树往后跑
      g.save(); g.beginPath(); for (const [x0, x1] of [[396, 652], [726, 962], [1052, 1316]]) g.rect(x0, 190, x1 - x0, 260); g.clip();
      g.globalAlpha = .35; g.fillStyle = '#7cc46b';
      for (let i = 0; i < 9; i++) { const x = 1700 - ((t * 260 + i * 200) % 1500); g.beginPath(); g.arc(x, 360, 50, 0, 7); g.arc(x + 40, 330, 40, 0, 7); g.fill(); }
      g.restore();
    },
    drawFront(g) {
      // 坐在座位上的人：把座位前面再画一遍，挡住腿；站在过道的人再画一次
      const im = E.scene.bgImg; if (!E.ok(im)) return;
      const k = E.iw(im) / 1672;
      for (const a of Object.values(E.actors)) {
        if (!a.seated || !a.vis) continue;
        const sx = SEATX.find(([x0, x1]) => a.x > x0 && a.x < x1); if (!sx) continue;
        g.drawImage(im, sx[0] * k, 606 * k, (sx[1] - sx[0]) * k, 140 * k, sx[0], 606, sx[1] - sx[0], 140);
      }
      for (const a of Object.values(E.actors).filter(a => !a.seated && a.y > 740).sort((p, q) => p.y - q.y)) E.drawActor(a);
    },
  };
  const sit = (id, x, y) => { const a = E.actors[id]; a.x = x; a.y = y; a.seated = true; a.hFix = 200 + (850 - 650) * .75; a.flip = x > 836; };
  const setBus = (o = {}) => {
    E.load(BUS); HH.music('class'); E.onActor = L.chat; E.onFloor = null; bus.sway = 0;
  };
  function swayTick(dt) {
    if (!E.scene || E.scene.id !== 'bus') return;
    if (bus.sway > 0) { bus.sway = Math.max(0, bus.sway - dt * .5); for (const a of Object.values(E.actors)) a.rot = Math.sin(E.time() * 9) * .12 * bus.sway * (a.hold ? .25 : 1); }
  }
  E.frameHooks.push(swayTick);
  /* 11-1 排队上车 */
  L.RUN.s11a = async () => {
    setBus(); UI.hudShow(true);
    const mess = { hh: [700, 880], mm: [1000, 900], hu: [1300, 850], cm: [480, 900], bk: [1500, 900], al: [860, 830] };
    E.add('ma', 1585, 880, { flip: true });
    for (const [id, p] of Object.entries(mess)) E.add(id, p[0], p[1], { flip: true });
    await say('b11_01');
    await say('b11_02', { hold: 0 });
    const ids = HH.shuffle(['mm', 'hu', 'cm', 'bk', 'al']);
    await L.queueUp(ids, ids.map((id, i) => [380 + i * 150, 870 + (i % 2) * 24, true]));
    await E.walk('hh', 1180, 870, { free: true }); E.actors.hh.flip = true;
    HH.sfx('cheer');
    await say('b11_03', { hold: 0 });
    await L.tapBig('buscard', '刷卡');
    HH.sfx('ding'); await say('b11_04');
    await UI.quiz('che', { prompt: 'b11_05' });
    await UI.petal('shangche');
    // 大家找座位坐好
    for (const [id, p] of Object.entries(SEATS)) { await E.walk(id, p[0], 790, { free: true, speed: 1.6 }); sit(id, p[0], p[1]); HH.sfx('land'); }
    await E.walk('al', 150, 880, { free: true }); E.actors.al.flip = false;
  };
  /* 11-2 坐稳扶好：车子一晃就点"扶好" */
  L.RUN.s11b = async () => {
    if (!E.scene || E.scene.id !== 'bus') { setBus(); E.add('ma', 1585, 880, { flip: true }); E.add('al', 150, 880); for (const [id, p] of Object.entries(SEATS)) { E.add(id, p[0], p[1]); sit(id, p[0], p[1]); } }
    await say('b11_06', { hold: 0 });
    for (let r = 0; r < 3; r++) {
      await sleep(1400 + Math.random() * 1200);
      HH.sfx('whoosh'); say('b11_shake', { hold: 0 });
      const wrap = UI.el('div', 'acts'), b = UI.el('button', 'act green', '✊ 扶好！'); wrap.appendChild(b); HH.$('#layer').appendChild(wrap);
      const ok = await new Promise(res => {
        const to = setTimeout(() => res(false), HH.fast ? 5 : 2600);
        b.onclick = () => { clearTimeout(to); HH.sfx('pop'); HH.burstAt(b, 16); res(true); };
        if (HH.auto) setTimeout(() => b.onclick(), 20);
      });
      wrap.remove();
      for (const a of Object.values(E.actors)) a.hold = ok;
      bus.sway = 1;
      if (ok) await say('b11_ok', { hold: 100 });
      else { E.actors.cm.wob = .4; HH.sfx('wobble'); await say('b11_slow', { hold: 100 }); }
      await sleep(600);
    }
    for (const a of Object.values(E.actors)) { a.hold = false; a.rot = 0; }
    await UI.petal('fuhao');
  };
  /* 11-3 给山羊奶奶让座 */
  L.RUN.s11c = async () => {
    if (!E.scene || E.scene.id !== 'bus') { setBus(); E.add('ma', 1585, 880, { flip: true }); E.add('al', 150, 880); for (const [id, p] of Object.entries(SEATS)) { E.add(id, p[0], p[1]); sit(id, p[0], p[1]); } }
    bus.sway = 0;
    await say('b11_07');
    E.add('nn', -100, 880); await E.walk('nn', 930, 880, { free: true, speed: .7 }); E.face('nn', 1100);
    E.actors.nn.sweat = 2;
    await say('b11_08');
    await say('b11_09', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: '🪑', lb: '让座给奶奶', ok: true }, { ic: '🙈', lb: '装作没看见', no: 'b11_no' }]));
    const hh = E.actors.hh; hh.seated = false; hh.hFix = null; hh.y = 800; await E.hop('hh', 40);
    await say('b11_10');
    await E.walk('hh', 1250, 880, { free: true }); hh.flip = true;
    await E.walk('nn', 1100, 790, { free: true, speed: .7 }); sit('nn', 1100, 702); E.actors.nn.sweat = 0; E.actors.nn.flip = false;
    await say('b11_11');
    await UI.quiz('zuo', { prompt: 'b11_12' });
    await UI.sticker('q_seat');
    await UI.petal('rangzuo');
    await L.peekStar('s_bus', { x: 150, y: 250, r: 60 });
    await say('end11');
  };

  /* ---------- 公园 ---------- */
  const pk = L.pk4 = { stranger: null, fly: null, bin: false };
  const PARK = {
    id: 'park', bg: 'bg/park.jpg', cam: { x: 836, y: 520, z: 1 },
    size: y => 170 + (y - 600) * .7,
    walk: [[[60, 610], [1020, 610], [1110, 760], [1420, 900], [1420, 930], [40, 930]]],
    drawBack(g, t) { if (!HH.has('stickers', 's_park')) L.tinyStar(g, 640, 262, .8, t); },
    drawFront(g, t) {
      if (pk.fly) butterfly(g, pk.fly.x, pk.fly.y, t);
    },
  };
  function butterfly(g, x, y, t) {
    const f = Math.abs(Math.sin(t * 14));
    g.save(); g.translate(x, y + Math.sin(t * 5) * 8);
    g.strokeStyle = INK; g.lineWidth = 3;
    for (const s of [-1, 1]) {
      g.save(); g.scale(s * (.35 + .65 * f), 1);
      g.fillStyle = '#ffb3d1'; g.beginPath(); g.ellipse(18, -12, 20, 15, -.4, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#ffe680'; g.beginPath(); g.ellipse(14, 12, 13, 10, .4, 0, 7); g.fill(); g.stroke();
      g.restore();
    }
    g.fillStyle = INK; g.beginPath(); g.ellipse(0, 0, 4, 16, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(0, -14); g.lineTo(-8, -28); g.moveTo(0, -14); g.lineTo(8, -28); g.stroke();
    g.restore();
  }
  /* 不认识的叔叔：戴帽子、墨镜，手里拿着糖（代码画的剪影） */
  function stranger(g, x, y) {
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(43,29,20,.22)'; g.beginPath(); g.ellipse(0, 0, 70, 16, 0, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = 6; g.lineJoin = 'round';
    g.fillStyle = '#596475'; g.beginPath(); g.moveTo(-60, -10); g.lineTo(-48, -230); g.quadraticCurveTo(0, -260, 48, -230); g.lineTo(60, -10); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#3d4552'; g.fillRect(-40, -10, 30, 10); g.fillRect(10, -10, 30, 10);
    g.fillStyle = '#e8d5c0'; g.beginPath(); g.arc(0, -290, 48, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#2b2f33'; g.beginPath(); g.ellipse(0, -318, 78, 16, 0, 0, 7); g.fill(); g.stroke(); L.rr(g, -44, -380, 88, 64, 14); g.fill(); g.stroke();
    g.fillStyle = '#111'; L.rr(g, -40, -305, 34, 22, 8); g.fill(); L.rr(g, 6, -305, 34, 22, 8); g.fill(); g.fillRect(-8, -298, 16, 5);
    g.beginPath(); g.moveTo(-14, -262); g.quadraticCurveTo(0, -254, 14, -262); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(-40, -200); g.lineTo(-95, -150); g.stroke();
    g.restore();
    L.drawImg(g, 'lollipop', x - 110, y - 120, 70, -.3);
  }
  const setPark = (o = {}) => {
    E.load(PARK); HH.music('garden'); E.onActor = L.chat; E.onFloor = null;
    pk.stranger = null; pk.fly = null;
    const at = o.at || { ma: [300, 760], hh: [620, 800], mm: [480, 860], hu: [760, 720], cm: [900, 840], bk: [560, 690], al: [200, 880] };
    for (const [id, p] of Object.entries(at)) E.add(id, p[0], p[1]);
  };
  /* 12-1 不跟陌生人走 */
  L.RUN.s12a = async () => {
    setPark({ at: { ma: [240, 760], mm: [380, 820], hu: [480, 700], cm: [520, 880], bk: [130, 860], al: [100, 700], hh: [860, 780] } });
    UI.hudShow(true);
    HH.sfx('cheer'); E.hopAll(['mm', 'cm', 'hu'], 30);
    await say('p12_01');
    E.face('hh', 1300);
    await say('p12_02');
    const sp = E.prop({ id: 'stranger', x: 1300, y: 790, draw(g) { stranger(g, this.x, this.y); } });
    for (let i = 0; i < 20; i++) { sp.x -= 7; await sleep(30); }
    await say('p12_03', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: '🙅', lb: '不要，回到老师身边', ok: true }, { ic: '🍭', lb: '拿糖跟他走', no: 'p12_no' }]));
    await say('p12_04');
    E.walk('hh', 340, 780);
    for (let i = 0; i < 30; i++) { sp.x += 14; await sleep(30); }
    E.unprop('stranger');
    await sleep(300); E.face('hh', 240); E.face('ma', 340);
    await say('p12_05');
    await UI.petal('mosheng');
  };
  /* 12-2 追蝴蝶，走丢了 */
  L.RUN.s12b = async () => {
    if (!E.scene || E.scene.id !== 'park') setPark({ at: { ma: [240, 760], mm: [380, 820], hu: [480, 700], cm: [520, 880], bk: [130, 860], al: [100, 700], hh: [340, 780] } });
    const hh = E.actors.hh;
    pk.fly = { x: hh.x + 80, y: hh.y - 250 };
    await say('p12_06', { hold: 0 });
    // 蝴蝶往右飞，黄花跟着跑
    const fly = async (x, y) => { const x0 = pk.fly.x, y0 = pk.fly.y; for (let i = 1; i <= 30; i++) { pk.fly.x = HH.lerp(x0, x, i / 30); pk.fly.y = HH.lerp(y0, y, i / 30); await sleep(30); } };
    await Promise.all([fly(900, 420), E.walk('hh', 880, 720, { free: true, speed: 1.3 })]);
    await Promise.all([fly(1250, 600), E.walk('hh', 1150, 800, { free: true, speed: 1.3 })]);
    await fly(1500, 200); pk.fly = null;
    // 小伙伴们不见了
    for (const id of ['ma', ...KIDS]) E.actors[id].vis = false;
    await E.camTo({ x: 1150, y: 600, z: 1.35 }, 900);
    hh.sweat = 3; hh.pose = 'stand'; hh.flip = true;
    await say('p12_07');
    await say('p12_08', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: '🧍', lb: '站在原地，找警察', ok: true }, { ic: '🏃', lb: '到处乱跑', no: 'p12_no2' }]));
    await say('p12_09');
    E.add('jc', 1500, 880); await E.walk('jc', 1300, 840, { free: true }); E.face('jc', hh.x); E.face('hh', 1300);
    await say('p12_10');
    await say('p12_11', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: ico('ch/ma.webp', 12), lb: '小马老师', ok: true }, { ic: ico('ch/zhu.webp', 12), lb: '小猪阿姨' }, { ic: ico('ch/hema.webp', 12), lb: '河马医生' }].map(o => o.ok ? o : Object.assign(o, { no: 'no2' }))));
    await say('p12_12');
    await E.camTo({ x: 836, y: 520, z: 1 }, 900);
    for (const id of ['ma', ...KIDS]) E.actors[id].vis = true;
    await Promise.all([E.walk('hh', 420, 780, { free: true }), E.walk('jc', 560, 760, { free: true })]);
    hh.sweat = 0; E.face('hh', 240); E.face('ma', 420); HH.sfx('cheer');
    await say('p12_13');
    await UI.quiz('ting', { prompt: 'p12_14' });
    await UI.petal('yuandi');
    E.walk('jc', 1800, 800, { free: true }).then(() => E.remove('jc'));
  };
  /* 12-3 野餐后捡垃圾 */
  L.RUN.s12c = async () => {
    if (!E.scene || E.scene.id !== 'park') setPark();
    await say('p12_15', { hold: 0 });
    const bin = { id: 'bin', x: 980, y: 660, draw(g) { const x = this.x, y = this.y; g.save(); g.strokeStyle = INK; g.lineWidth = 5; g.fillStyle = '#5bbf6a'; g.beginPath(); g.moveTo(x - 45, y - 120); g.lineTo(x + 45, y - 120); g.lineTo(x + 36, y); g.lineTo(x - 36, y); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#3d9a4f'; L.rr(g, x - 54, y - 140, 108, 24, 10); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.fillText('♻', x, y - 45); g.restore(); } };
    E.prop(bin);
    const junk = [['candy', 360, 850, 80], ['plasticbag', 720, 860, 80], ['banana', 1060, 820, 80], ['apple', 140, 640, 60], ['lollipop', 820, 640, 60]];
    await Promise.all(junk.map(([k, x, y, w], i) => {
      const p = L.imgProp('j' + i, k, x, y, w, { rot: (i % 2 ? .4 : -.3) });
      return E.waitTap({ id: 'jt' + i, x, y: y - 30, r: 70, walk: false, sparkle: true, sx: x, sy: y - 60, on: async () => {
        HH.sfx('pick'); const x0 = p.x, y0 = p.y;
        for (let k2 = 1; k2 <= 14; k2++) { const f = k2 / 14; p.x = HH.lerp(x0, bin.x, f); p.y = HH.lerp(y0, bin.y - 120, f) - Math.sin(f * Math.PI) * 180; p.rot += .4; await sleep(25); }
        E.unprop('j' + i); HH.sfx('pop'); const q = E.toScreen(bin.x, bin.y - 130); HH.burst(q.x, q.y, 12, { kind: 'star' });
      } });
    }));
    HH.sfx('cheer'); E.hopAll(['hh', 'mm', 'cm'], 30);
    await say('p12_16');
    await L.peekStar('s_park', { x: 640, y: 262, r: 70 });
    for (const id of ['hh', ...KIDS]) E.face(id, 836);
    await UI.photo('ep4', '第四集 · 春游合影');
    await say('end12');
  };

  Object.assign(L.STAGES, {
    10: { ep: 4, name: '马路口', title: '第十站 · 马路口', bg: 'bg/street.jpg' },
    11: { ep: 4, name: '公交车', title: '第十一站 · 公交车', bg: 'bg/bus.jpg' },
    12: { ep: 4, name: '公园', title: '第十二站 · 公园', bg: 'bg/park.jpg' },
  });
  L.EPS[4] = { name: '红绿灯小卫士', title: '第四集 · 红绿灯小卫士', first: 's10a' };
  L.LIST.push({ id: 's10a', st: 10, name: '红灯停绿灯行' }, { id: 's10b', st: 10, name: '走斑马线' }, { id: 's10c', st: 10, name: '球滚到马路上' },
    { id: 's11a', st: 11, name: '排队上车' }, { id: 's11b', st: 11, name: '坐稳扶好' }, { id: 's11c', st: 11, name: '给奶奶让座' },
    { id: 's12a', st: 12, name: '不跟陌生人走' }, { id: 's12b', st: 12, name: '走丢了怎么办' }, { id: 's12c', st: 12, name: '公园捡垃圾' });
})();
