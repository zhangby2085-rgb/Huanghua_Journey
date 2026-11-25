/* 黄花的生活 第三集《牙齿保卫战》：第七站 家（起床、刷牙、穿衣吃早饭）、第八站 超市、第九站 牙医诊所 */
(function () {
  const HH = window.HH, D = HH.D, E = HH.E, UI = HH.UI, S = HH.S, L = HH.L;
  const say = UI.say, sleep = HH.sleep;
  const layer = HH.$('#layer');
  const INK = '#4a2e1c';
  const ico = (src, h = 11) => '<img src="' + HH.IMG + src + '" style="height:' + h + 'vh;display:block">';

  /* ---------- 场景 ---------- */
  const home = L.home3 = { night: 0, ring: 0, zzz: 0 };
  const BED = L.BED = {
    id: 'bedroom', bg: 'bg/bedroom.jpg', cam: { x: 836, y: 520, z: 1 },
    size: y => 230 + (y - 650) * .9,
    walk: [[[90, 700], [1110, 700], [1150, 925], [60, 925]]],
    drawBack(g, t) {
      if (!HH.has('stickers', 't_home')) L.tinyTooth(g, 1132, 452, .8, t);
      if (home.ring) { // 闹钟在响
        g.save(); g.translate(1070, 372); g.rotate(Math.sin(t * 40) * .12);
        g.strokeStyle = '#e8453c'; g.lineWidth = 5; g.lineCap = 'round';
        for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 0, 52 + i * 18, s < 0 ? Math.PI * .8 : -Math.PI * .2, s < 0 ? Math.PI * 1.2 : Math.PI * .2); g.stroke(); }
        g.restore();
        g.save(); g.font = 'bold 40px WK, sans-serif'; g.fillStyle = '#e8453c'; g.strokeStyle = '#fff'; g.lineWidth = 8; g.textAlign = 'center';
        g.strokeText('丁零零', 1070, 290 + Math.sin(t * 20) * 4); g.fillText('丁零零', 1070, 290 + Math.sin(t * 20) * 4); g.restore();
      }
    },
    drawFront(g, t) {
      if (home.zzz) { // 呼噜呼噜
        g.save(); g.font = 'bold 44px WK, sans-serif'; g.fillStyle = '#6aa6e8'; g.strokeStyle = '#fff'; g.lineWidth = 7;
        for (let i = 0; i < 3; i++) { const k = (t * .5 + i / 3) % 1; g.globalAlpha = Math.sin(k * Math.PI); const x = 1230 + k * 90 + i * 8, y = 440 - k * 160; g.font = 'bold ' + (30 + k * 30) + 'px WK, sans-serif'; g.strokeText('Z', x, y); g.fillText('Z', x, y); }
        g.restore();
      }
      if (home.night > 0) { L.night(g, home.night); g.save(); g.globalAlpha = home.night; L.moon(g, 245, 230, 34); g.restore(); }
    },
  };
  const BATH = {
    id: 'bath', bg: 'bg/bathroom.jpg', cam: { x: 836, y: 520, z: 1 },
    size: y => 260 + (y - 700) * .9,
    walk: [[[220, 770], [1480, 770], [1540, 925], [170, 925]]],
  };
  const mk = L.mk3 = { counter: false };
  const MARKET = {
    id: 'market', bg: 'bg/market.jpg', cam: { x: 836, y: 520, z: 1 },
    size: y => 200 + (y - 650) * .85,
    walk: [[[440, 720], [1230, 720], [1240, 925], [330, 925]]],
    drawBack(g, t) { if (!HH.has('stickers', 't_market')) L.tinyTooth(g, 866, 288, .75, t); },
  };
  const CLINIC = {
    id: 'clinic', bg: 'bg/clinic.jpg', cam: { x: 836, y: 520, z: 1 },
    size: y => 220 + (y - 680) * .85,
    walk: [[[160, 730], [1480, 730], [1540, 925], [120, 925]]],
    drawBack(g, t) { if (!HH.has('stickers', 't_clinic')) L.tinyTooth(g, 1468, 548, .75, t); },
  };
  // 收银台：阿姨站在柜台后面，画完人以后把柜台正面再画一遍，挡住她的腿
  MARKET.drawFront = function (g) {
    if (!mk.counter) return;
    const im = E.scene.bgImg; if (!E.ok(im)) return;
    const k = E.iw(im) / 1672;
    g.save(); g.beginPath(); g.moveTo(1252, 530); g.lineTo(1672, 552); g.lineTo(1672, 941); g.lineTo(1252, 941); g.closePath(); g.clip();
    g.drawImage(im, 1240 * k, 500 * k, 432 * k, 441 * k, 1240, 500, 432, 441); g.restore();
  };

  const setBed = (o = {}) => {
    E.load(BED); HH.music(o.music || 'garden');
    home.night = o.night ? 1 : 0; home.ring = 0; home.zzz = 0;
    E.onActor = L.chat; E.onFloor = null;
  };
  /* 黄花躺在床上睡觉 */
  const inBed = () => E.add('hh', 1352, 598, { pose: 'sleep', hFix: 300, z: 6, flip: false });
  const outOfBed = async (x = 1060, y = 800) => {
    const hh = E.actors.hh; hh.pose = 'jump'; hh.hFix = null; hh.z = 0; hh.x = 1150; hh.y = 700;
    await E.hop('hh', 140, 500); hh.x = x; hh.y = y; hh.pose = 'stand';
  };

  /* ---------- 7-1 起床啦 ---------- */
  L.RUN.s7a = async () => {
    setBed();
    UI.hudShow(true);
    inBed(); home.zzz = 1;
    L.imgProp('c1', 'candy', 900, 760, 110, { rot: -.2 }); L.imgProp('c2', 'lollipop', 760, 800, 80, { rot: .6 }); L.imgProp('c3', 'candy', 1010, 840, 90, { rot: .4 });
    await say('y01');
    home.ring = 1; HH.sfx('bell'); setTimeout(() => HH.sfx('bell'), 900);
    await say('y02');
    await say('y03', { hold: 0 });
    const hh = E.actors.hh;
    const tapBed = () => E.waitTap({ id: 'wake', x: 1352, y: 520, r: 170, walk: false, sparkle: true, sx: 1300, sy: 470 });
    await tapBed(); home.ring = 0; hh.wob = .25; HH.sfx('wobble'); await say('y04');
    await tapBed(); hh.wob = .3; HH.sfx('wobble'); await say('y05');
    await tapBed(); home.zzz = 0; HH.sfx('pop');
    await outOfBed(); hh.pose = 'yawn';
    await say('y06');
    hh.pose = 'stand';
    E.add('mama', -140, 860); await E.walk('mama', 470, 860, { free: true }); E.face('mama', hh.x); E.face('hh', 470);
    await say('y07');
    await UI.quiz('zao', { prompt: 'y08' });
    await UI.petal('zaoqi');
    // 牙疼
    hh.pose = 'toothache'; hh.shake = .5; HH.sfx('wrong');
    await say('y09');
    await say('y10');
    await L.popIn('ya', hh.x + 170, hh.y + 4, { float: 250, pose: 'sad', col: 'water' });
    await say('y11');
    await say('y12');
    hh.pose = 'stand';
    await say('y13');
    E.unprop('c1'); E.unprop('c2'); E.unprop('c3');
    await L.peekTooth('t_home', { x: 1132, y: 432, r: 70 });
  };

  /* ---------- 7-2 刷牙 ---------- */
  L.RUN.s7b = async () => {
    E.load(BATH); HH.music('toilet');
    E.onActor = L.chat; E.onFloor = null;
    UI.hudShow(true);
    E.add('hh', 838, 706, { hFix: BATH.size(870) });
    E.add('mama', 1310, 885, { flip: true });
    E.add('ya', 1080, 760, { float: 300, pose: 'sad' });
    await say('y14', { hold: 0 });
    await pasteGame();
    E.actors.hh.pose = 'brush';
    await UI.quiz('shua', { prompt: 'y15' });
    await say('y16', { hold: 0 });
    await brushGame(false);
    await say('y18', { hold: 0 });
    await brushGame(true);
    await say('y19', { hold: 0 });
    await L.tapBig('cup2', '漱漱口');
    const hh = E.actors.hh; hh.pose = 'stand';
    for (let i = 0; i < 3; i++) { HH.sfx('splash'); hh.wob = .2; const p = E.toScreen(hh.x, hh.y - hh.h * .6); HH.burst(p.x, p.y, 14, { kind: 'drop', col: 'water', speed: 200 }); await sleep(420); }
    E.actors.ya.pose = 'happy'; E.hop('ya', 40);
    await say('y20');
    await UI.quiz('ya', { prompt: 'y21' });
    await UI.petal('shuaya');
  };
  /* 挤牙膏：按住挤，挤一颗小豆子那么大 */
  function pasteGame() {
    return L.hold({
      label: '挤牙膏', speed: .42, lo: .3, hi: .6,
      draw(g, W, H, v, t, st) {
        const bx = W * .16, by = H * .64, bl = W * .62;
        const hx0 = bx + bl * .64, hx1 = bx + bl * .98, bw = hx1 - hx0, top = by - H * .13;
        g.save(); g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = H * .01;
        // 牙刷柄
        g.fillStyle = '#7ec8ff'; rr(g, bx, by - H * .035, bl * .66, H * .07, H * .035); g.fill(); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.5)'; rr(g, bx + H * .03, by - H * .022, bl * .4, H * .016, H * .008); g.fill();
        g.fillStyle = '#5aa9ef'; rr(g, hx0 - bl * .03, by - H * .04, bl * .37, H * .06, H * .02); g.fill(); g.stroke();
        // 刷毛
        for (let i = 0; i < 16; i++) { const x = hx0 + bw * (i + .5) / 16; g.fillStyle = i % 2 ? '#fff' : '#d8efff'; g.fillRect(x - bw / 40, top + H * .02, bw / 20, by - H * .04 - top - H * .02); }
        g.strokeRect(hx0, top + H * .02, bw, by - H * .04 - top - H * .02);
        // 小豆子目标
        g.setLineDash([H * .015, H * .012]); g.strokeStyle = '#3d9a4f'; g.lineWidth = H * .007;
        rr(g, hx0 + bw * .02, top - H * .06, bw * .58, H * .07, H * .035); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#5bbf6a'; g.beginPath(); g.arc(hx0 + bw * .45, top - H * .13, H * .03, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = H * .006; g.stroke();
        g.font = 'bold ' + Math.round(H * .05) + 'px WK, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = H * .012;
        g.textAlign = 'right'; g.strokeText('小豆子 →', hx0 - bw * .08, top - H * .02); g.fillText('小豆子 →', hx0 - bw * .08, top - H * .02);
        // 牙膏条
        const len = Math.min(v, 1.25) * bw;
        if (len > 2) {
          g.fillStyle = '#fff'; g.strokeStyle = '#9cc7e6'; g.lineWidth = H * .006;
          g.beginPath(); g.moveTo(hx0, top + H * .01);
          for (let x = 0; x <= len; x += 4) g.lineTo(hx0 + x, top - H * .045 + Math.sin(x * .05) * H * .006 + (x > bw ? (x - bw) * .9 : 0));
          g.lineTo(hx0 + len, top + H * .01 + (len > bw ? (len - bw) * .9 : 0)); g.closePath(); g.fill(); g.stroke();
          g.strokeStyle = '#6ec6ff'; g.lineWidth = H * .008;
          for (let x = 10; x < len; x += 26) { g.beginPath(); g.moveTo(hx0 + x, top - H * .035); g.lineTo(hx0 + x + 10, top); g.stroke(); }
        }
        g.restore();
        // 牙膏管：跟着牙膏头走，按住的时候被捏扁
        const tx = hx0 + len, sq = st.hold ? .9 + .05 * Math.sin(t * 30) : 1;
        g.save(); g.translate(tx + H * .1, top - H * .12); g.scale(1, sq); g.rotate(-.35);
        L.drawImg(g, 'toothpaste', 0, H * .02, H * .34, 0); g.restore();
      },
      async check(v, st) {
        if (v > .62) { HH.sfx('wrong'); await say('y_paste_more', { hold: 60 }); st.v = 0; return false; }
        if (v < .28) { await say('y_paste_less', { hold: 40 }); return false; }
        HH.sfx('right'); await say('y_paste_ok', { hold: 60 }); return true;
      },
    });
  }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  L.rr = rr;

  /* ---------- 大嘴巴（刷牙、看牙医都用） ---------- */
  const mouthGeo = (W, H) => {
    const cx = W / 2, cy = H * .5, rx = Math.min(W * .36, H * .7), ry = H * .4;
    const tw = rx * 1.5 / 6, th = ry * .4, up = [], lo = [];
    for (let i = 0; i < 6; i++) {
      const u = (i - 2.5) / 2.5, x = cx + u * rx * .74;
      up.push({ x, y: cy - ry * .6 + u * u * ry * .2, w: tw * .9, h: th });
      lo.push({ x, y: cy + ry * .6 - u * u * ry * .2, w: tw * .9, h: th });
    }
    return { cx, cy, rx, ry, up, lo };
  };
  L.mouthGeo = mouthGeo;
  const drawMouth = L.drawMouth = (g, W, H, t, o = {}) => {
    const m = mouthGeo(W, H);
    g.fillStyle = '#d9cfc6'; g.fillRect(0, 0, W, H);
    // 灰色花纹（黄花的毛）
    g.save(); g.fillStyle = 'rgba(140,128,120,.35)'; for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(W * (.08 + i * .14), H * .08, W * .025, H * .1, 0, 0, 7); g.fill(); } g.restore();
    // 胡须
    g.save(); g.strokeStyle = 'rgba(74,46,28,.55)'; g.lineWidth = H * .006; g.lineCap = 'round';
    for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(m.cx + s * m.rx * 1.15, m.cy - H * .05 + i * H * .06); g.quadraticCurveTo(m.cx + s * m.rx * 1.5, m.cy - H * .08 + i * H * .08, m.cx + s * m.rx * 1.8, m.cy - H * .02 + i * H * .11); g.stroke(); }
    g.restore();
    g.save(); g.translate(m.cx, m.cy);
    g.fillStyle = '#f0a1a9'; g.strokeStyle = INK; g.lineWidth = H * .012;
    g.beginPath(); g.ellipse(0, 0, m.rx * 1.07, m.ry * 1.08, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(0, 0, m.rx, m.ry, 0, 0, 7); g.fillStyle = '#7a1f2e'; g.fill(); g.save(); g.clip();
    g.fillStyle = '#e8737f'; g.beginPath(); g.ellipse(0, -m.ry * .95, m.rx * 1.05, m.ry * .45, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(0, m.ry * .95, m.rx * 1.05, m.ry * .45, 0, 0, 7); g.fill();
    g.fillStyle = '#ef6f86'; g.beginPath(); g.ellipse(0, m.ry * .32, m.rx * .48, m.ry * .3, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(160,40,60,.6)'; g.lineWidth = H * .006; g.beginPath(); g.moveTo(0, m.ry * .12); g.lineTo(0, m.ry * .4); g.stroke();
    g.restore(); g.restore();
    g.save(); g.strokeStyle = INK; g.lineWidth = H * .007;
    for (const tt of [...m.up, ...m.lo]) {
      g.fillStyle = o.dirty ? '#f3ead2' : '#fff'; rr(g, tt.x - tt.w / 2, tt.y - tt.h / 2, tt.w, tt.h, tt.w * .3); g.fill(); g.stroke();
      g.fillStyle = 'rgba(200,225,255,.7)'; g.beginPath(); g.ellipse(tt.x - tt.w * .2, tt.y - tt.h * .2, tt.w * .1, tt.h * .16, 0, 0, 7); g.fill();
    }
    g.restore();
  };
  /* 刷牙：上面的牙往下刷，下面的牙往上刷；inner：牙齿里面，左右刷 */
  function brushGame(inner) {
    const W = innerWidth, H = innerHeight, m = mouthGeo(W, H);
    const pick = inner ? [[m.up, 0], [m.up, 5], [m.lo, 0], [m.lo, 5]] : [[m.up, 1], [m.up, 3], [m.up, 5], [m.lo, 0], [m.lo, 2], [m.lo, 4]];
    const spots = pick.map(([row, i]) => ({ x: row[i].x / W, y: row[i].y / H, r: row[i].h * .55 / H, dir: inner ? 'side' : row === m.up ? 'down' : 'up' }));
    let said = false;
    return L.rub({
      spots, arrows: true, hard: 150, sfx: 'chalk', col: 'water',
      draw: (g, W2, H2, st, t) => drawMouth(g, W2, H2, t, { dirty: true }),
      dirt: (g, x, y, r, hp, t, s) => L.bug(g, x, y, r * .75, t, { alpha: Math.min(1, hp * 1.6), ph: s.x * 20, col: inner ? '#4fae6a' : '#8d5bd1' }),
      tool: (g, x, y, H2) => L.drawImg(g, 'toothbrush', x + H2 * .1, y + H2 * .15, H2 * .26, -.6),
      onClean: () => { if (!said && !inner) { said = true; say('y17', { hold: 0 }); } },
    });
  }

  /* ---------- 7-3 穿衣吃早饭 ---------- */
  L.RUN.s7c = async () => {
    if (!E.scene || E.scene.id !== 'bedroom') { setBed(); E.add('hh', 760, 820); E.add('mama', 470, 860); E.add('ya', 960, 800, { float: 260 }); }
    else { const hh = E.actors.hh || E.add('hh', 760, 820); hh.pose = 'stand'; if (!E.actors.ya) E.add('ya', 960, 800, { float: 260 }); if (!E.actors.mama) E.add('mama', 470, 860); }
    E.actors.ya.pose = 'happy';
    await E.walk('hh', 760, 820); E.face('hh', 470);
    await say('y22', { hold: 0 });
    await L.order({
      order: ['tshirt', 'pants', 'socks', 'shoes', 'coat'], deps: { shoes: ['socks', 'pants'], coat: ['tshirt'] }, wrong: 'y_dress_no',
    });
    HH.sfx('cheer'); E.hop('hh');
    await say('y23');
    await UI.quiz('yi', { prompt: 'y24' });
    await UI.petal('chuanyi');
    await say('y25', { hold: 0 });
    await L.pick({ items: [
      { k: 'milk', ok: true, word: 'niunai' }, { k: 'egg', ok: true, word: 'jidan' }, { k: 'bread', ok: true, word: 'mianbao' }, { k: 'dish/qingcai.webp', ok: true, word: 'qingcai' },
      { k: 'candy', no: 'y_candy', word: 'tangguo' }, { k: 'lollipop', no: 'y_candy' }] });
    await say('y26');
    await UI.quiz('nai', { prompt: 'y27' });
    await UI.petal('butiaoshi');
    await say('y28');
    await say('end7');
  };

  /* ---------- 第八站 超市 ---------- */
  const setMarket = () => { E.load(MARKET); HH.music('play'); mk.counter = false; E.onActor = L.chat; E.onFloor = null; };
  L.RUN.s8a = async () => {
    setMarket(); UI.hudShow(true);
    E.add('hh', -120, 840); E.add('mama', -300, 860);
    await Promise.all([E.walk('hh', 640, 840, { free: true }), E.walk('mama', 440, 862, { free: true })]);
    await say('y30');
    await say('y31', { hold: 0 });
    await L.pick({ list: true, box: 'basket', wrong: 'y_shelf_no', items: [
      { k: 'apple', ok: true, word: 'pingguo2' }, { k: 'banana', ok: true, word: 'xiangjiao' }, { k: 'bread', ok: true, word: 'mianbao' }, { k: 'toothbrush', ok: true, word: 'yashua' },
      { k: 'candy', word: 'tangguo' }, { k: 'lollipop' }, { k: 'milk', word: 'niunai' }, { k: 'egg', word: 'jidan' }] });
    L.imgProp('basket', 'basket', 0, 0, 120, { get x() { return E.actors.hh.x + 70; }, get y() { return E.actors.hh.y + 2; } });
    await say('y32');
    E.add('hu', 1800, 830); await E.walk('hu', 1010, 830, { free: true }); E.face('hu', 640); E.face('hh', 1010);
    await say('y33');
  };
  L.RUN.s8b = async () => {
    if (!E.scene || E.scene.id !== 'market') { setMarket(); E.add('hh', 640, 840); E.add('mama', 440, 862); E.add('hu', 1010, 830, { flip: true }); }
    const hu = E.actors.hu;
    hu.flip = false; await E.walk('hu', 900, 800); hu.flip = true; E.hop('hu');
    await say('y34');
    await say('y35', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: ico('item/candy.webp'), lb: '糖果', no: 'y_choose_candy' }, { ic: ico('item/banana.webp'), lb: '水果', ok: true }]));
    L.imgProp('hub', 'banana', 0, 0, 90, { get x() { return hu.x - 60; }, get y() { return hu.y - hu.h * .35; }, dy: 2 });
    await say('y36');
    await UI.quiz('tang2', { prompt: 'y37' });
    await UI.petal('shaotang');
    // 毛毛走丢了
    E.add('mm', 1800, 860); await E.walk('mm', 1130, 860, { free: true });
    const mm = E.actors.mm; mm.flip = true; mm.sweat = 3; mm.shake = .6;
    await say('y38');
    await say('y39', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: ico('ch/zhu.webp', 12), lb: '找工作服阿姨', ok: true }, { ic: '🕶️', lb: '跟陌生人走', no: 'y_lost_no1' }, { ic: '🏃', lb: '自己乱跑', no: 'y_lost_no2' }]));
    E.add('zhu', 1800, 830); await E.walk('zhu', 1330, 840, { free: true }); E.face('zhu', 1130);
    await say('y40');
    HH.sfx('bell');
    await say('y41');
    mm.sweat = 0; mm.shake = 0; HH.sfx('cheer'); await E.hop('mm', 60);
    await say('y42');
    E.walk('mm', 1850, 880, { free: true });
    await say('y43');
    await UI.sticker('q_lost');
    await UI.petal('buluanpao');
    E.remove('mm');
  };
  /* 付钱：钱包里点硬币，放进盘子，凑够三元 */
  function payCoins() {
    return new Promise(res => {
      const v = UI.el('div', 'pay'), purse = UI.el('div', 'purse', '<div class="pk-h">钱包</div>'), coins = UI.el('div', 'coins');
      const tray = UI.el('div', 'tray', '<div class="pk-h">付钱的小盘子</div>'), dish = UI.el('div', 'dish'), sum = UI.el('div', 'sum', '0 元 / 3 元');
      purse.appendChild(coins); tray.appendChild(dish); tray.appendChild(sum); v.appendChild(purse); v.appendChild(tray); layer.appendChild(v);
      let n = 0, busy = false, done = false;
      const add = (html, cls, val) => {
        const b = UI.el('button', cls, html); coins.appendChild(b);
        b.onclick = async () => {
          if (busy || done || b.disabled) return;
          busy = true;
          if (val > 1) { HH.sfx('wrong'); b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); await say('y_coin_more', { hold: 40 }); busy = false; return; }
          b.disabled = true; HH.sfx('ding'); HH.burstAt(b, 12);
          const r = b.getBoundingClientRect(), t = dish.getBoundingClientRect();
          b.style.transition = 'transform .4s, opacity .4s'; b.style.transform = 'translate(' + (t.left + t.width / 2 - r.left - r.width / 2) + 'px,' + (t.top + t.height / 2 - r.top - r.height / 2) + 'px) scale(.5)'; b.style.opacity = '0';
          await sleep(400); b.style.visibility = 'hidden';
          const im = UI.el('img'); im.src = HH.IMG + 'item/coin1.webp'; dish.appendChild(im);
          n++; sum.textContent = n + ' 元 / 3 元';
          if (n >= 3) { done = true; HH.sfx('right'); await say('y_coin_ok', { hold: 60 }); await sleep(300); v.remove(); res(); }
          busy = false;
        };
        return b;
      };
      const bs = [];
      for (let i = 0; i < 4; i++) bs.push(add('<img src="' + HH.IMG + 'item/coin1.webp"><span>1元</span>', 'coin', 1));
      add('<b>5</b><span>5元</span>', 'note', 5);
      if (HH.auto) (async () => { for (let i = 0; i < 3; i++) { await sleep(20); await bs[i].onclick(); } })();
    });
  }
  L.RUN.s8c = async () => {
    if (!E.scene || E.scene.id !== 'market') { setMarket(); E.add('hh', 640, 840); E.add('mama', 440, 862); E.add('hu', 900, 800); }
    const hh = E.actors.hh;
    await say('y44');
    if (E.actors.hu) { E.actors.hu.flip = false; E.walk('hu', 1850, 860, { free: true }); }
    // 阿姨回到收银台后面
    E.add('zhu', 1560, 640, { hFix: 340, flip: true }); mk.counter = true;
    await Promise.all([E.walk('hh', 1110, 840), E.walk('mama', 880, 860)]);
    E.face('hh', 1560); E.face('mama', 1560);
    E.remove('hu');
    await say('y45');
    await say('y46', { hold: 0 });
    await payCoins();
    await UI.quiz('qian', { prompt: 'y47' });
    await UI.sticker('q_coin');
    await say('y48', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: ico('item/ecobag.webp'), lb: '环保袋', ok: true }, { ic: ico('item/plasticbag.webp'), lb: '塑料袋', no: 'y_bag_no' }]));
    E.unprop('basket');
    L.imgProp('bag', 'ecobag', 0, 0, 130, { get x() { return hh.x + 80; }, get y() { return hh.y + 2; } });
    await say('y49');
    await L.peekTooth('t_market', { x: 866, y: 266, r: 70 });
    await say('end8');
  };

  /* ---------- 第九站 牙医诊所 ---------- */
  const setClinic = () => {
    E.load(CLINIC); HH.music('library'); E.onActor = L.chat; E.onFloor = null;
    E.add('hema', 1290, 870, { flip: true });
  };
  L.RUN.s9a = async () => {
    setClinic(); UI.hudShow(true);
    E.add('hh', -120, 850); E.add('mama', -320, 870);
    await Promise.all([E.walk('hh', 560, 850, { free: true }), E.walk('mama', 330, 872, { free: true })]);
    E.add('ya', 700, 800, { float: 280, pose: 'sad' });
    await say('y50');
    const hh = E.actors.hh; hh.pose = 'toothache'; hh.sweat = 3;
    await say('y51');
    E.face('mama', 560); E.face('hh', 330);
    await say('y52');
    await say('y53', { hold: 0 });
    await balloonGame();
    hh.pose = 'stand'; hh.sweat = 0; HH.sfx('cheer'); E.hop('hh');
    await say('y54');
  };
  /* 吹气球：按住吸气，气球变大；松开呼气，气球变小。做三次 */
  function balloonGame() {
    const tip = UI.el('div', 'balloon-tip', '');
    return L.hold({
      label: '🎈 按住吸气', cycles: 3, speed: .55, bgcol: 'rgba(255,240,220,.92)',
      draw(g, W, H, v, t, st) {
        const s = .3 + Math.min(1, v) * .8;
        g.save(); g.translate(W / 2, H * .9); g.rotate(Math.sin(t * 1.5) * .05);
        L.drawImg(g, 'balloon', 0, 0, H * .48 * s); g.restore();
        g.save(); g.fillStyle = '#4a2e1c'; for (let i = 0; i < 3; i++) { g.globalAlpha = i < st.n ? 1 : .25; g.beginPath(); g.arc(W * .82 + i * H * .07, H * .2, H * .025, 0, 7); g.fill(); } g.restore();
        L.drawImg(g, 'ch/huanghua_stand.webp', W * .16, H * .95, H * .36);
        if (!tip.parentNode && !st.done) layer.appendChild(tip);
        const txt = st.hold ? '吸——' : v > .05 ? '呼——' : '';
        if (tip.textContent !== txt) tip.textContent = txt;
        if (st.done) tip.remove();
      },
      onCycle: n => { if (n >= 3) tip.remove(); },
    }).then(r => { tip.remove(); return r; });
  }
  L.RUN.s9b = async () => {
    if (!E.scene || E.scene.id !== 'clinic') { setClinic(); E.add('hh', 560, 850); E.add('mama', 330, 872); E.add('ya', 700, 800, { float: 280, pose: 'sad' }); }
    const hh = E.actors.hh;
    E.face('hema', 560);
    await say('y55');
    await E.walk('hh', 860, 760); await E.hop('hh', 80); hh.x = 860; hh.y = 640; hh.hFix = CLINIC.size(840); hh.flip = false;
    await say('y56', { hold: 0 });
    let r = 0;
    await L.whack({
      n: 6, max: 2, life: 3.2, gap: .7, size: .065, hitR: .1,
      draw: (g, W, H, t) => drawMouth(g, W, H, t),
      spawn: () => { const m = mouthGeo(innerWidth, innerHeight), row = (r++ % 2) ? m.up : m.lo, tt = row[Math.floor(Math.random() * 6)]; return { x: tt.x / innerWidth, y: tt.y / innerHeight }; },
    });
    HH.sfx('cheer');
    await say('y57');
    hh.hFix = null; hh.x = 760; hh.y = 850; E.face('hh', 1290);
    const ya = E.actors.ya; ya.pose = 'happy'; E.hop('ya', 60);
    await say('y58');
    await UI.petal('bupa');
    await L.peekTooth('t_clinic', { x: 1468, y: 530, r: 70 });
  };
  L.RUN.s9c = async () => {
    if (!E.scene || E.scene.id !== 'clinic') { setClinic(); E.add('hh', 760, 850); E.add('mama', 330, 872); E.add('ya', 700, 800, { float: 280, pose: 'happy' }); }
    E.face('hh', 1290);
    await say('y59');
    await UI.quiz('wan', { prompt: 'y60' });
    // 晚上，回到家
    setBed({ night: true, music: 'dusk' });
    inBed(); E.actors.hh.pose = 'sleep';
    E.add('ya', 1520, 700, { float: 240, pose: 'happy' });
    await say('y61');
    await say('y62');
    await say('y63');
    home.zzz = 1;
    await sleep(800);
    await say('end9');
  };

  /* 关卡表 */
  Object.assign(L.STAGES, {
    7: { ep: 3, name: '黄花的家', title: '第七站 · 黄花的家', bg: 'bg/bedroom.jpg' },
    8: { ep: 3, name: '超市', title: '第八站 · 超市', bg: 'bg/market.jpg' },
    9: { ep: 3, name: '牙医诊所', title: '第九站 · 牙医诊所', bg: 'bg/clinic.jpg' },
  });
  L.EPS[3] = { name: '牙齿保卫战', title: '第三集 · 牙齿保卫战', first: 's7a' };
  L.LIST.push({ id: 's7a', st: 7, name: '起床啦' }, { id: 's7b', st: 7, name: '刷牙' }, { id: 's7c', st: 7, name: '穿衣吃早饭' },
    { id: 's8a', st: 8, name: '照清单买东西' }, { id: 's8b', st: 8, name: '糖果架前' }, { id: 's8c', st: 8, name: '排队付钱' },
    { id: 's9a', st: 9, name: '不害怕' }, { id: 's9b', st: 9, name: '张大嘴' }, { id: 's9c', st: 9, name: '早晚刷牙' });
  // 每一集的第一关都开着
  L.unlocked = id => { const i = L.LIST.findIndex(l => l.id === id); return i === 0 || Object.values(L.EPS).some(e => e.first === id) || S.done[id] || S.done[L.LIST[i - 1].id]; };
})();
