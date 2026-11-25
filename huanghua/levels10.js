/* 黄花的生活 第六集《我会自己做》：第十六站 卧室、第十七站 客厅、第十八站 阳台 */
(function () {
  const HH = window.HH, D = HH.D, E = HH.E, UI = HH.UI, S = HH.S, L = HH.L;
  const say = UI.say, sleep = HH.sleep;
  const layer = HH.$('#layer');
  const INK = '#4a2e1c';

  /* ---------- 卧室 ---------- */
  const setBed6 = () => {
    E.load(L.BED); HH.music('class'); E.onActor = L.chat; E.onFloor = null;
    Object.assign(L.home3, { night: 0, ring: 0, zzz: 0 });
  };
  /* 16-1 整理书包 */
  L.RUN.s16a = async () => {
    setBed6(); UI.hudShow(true);
    E.add('hh', 760, 820); E.add('mama', 420, 840);
    E.face('hh', 420); E.face('mama', 760);
    await say('z16_01');
    E.hop('hh');
    await say('z16_02', { hold: 0 });
    await L.pick({ box: 'schoolbag', wrong: 'z16_no', items: [
      { k: 'textbook', ok: true, word: 'shu' }, { k: 'pencilcase', ok: true }, { k: 'pencil', ok: true, word: 'bi' }, { k: 'book', ok: true, word: 'shu' },
      { k: 'toycar' }, { k: 'teddy' }, { k: 'blocks' }, { k: 'ball2' }] });
    L.imgProp('sbag', 'schoolbag', 300, 640, 120);
    await say('z16_03');
    await UI.quiz('bao', { prompt: 'z16_04' });
    await UI.petal('zhengli');
  };
  /* 16-2 叠衣服：跟着箭头划 */
  L.RUN.s16b = async () => {
    if (!E.scene || E.scene.id !== 'bedroom') { setBed6(); E.add('hh', 760, 820); E.add('mama', 420, 840); }
    await say('z16_05', { hold: 0 });
    await foldGame();
    HH.sfx('cheer'); E.hop('hh');
    await say('z16_06');
    await UI.petal('dieyi');
  };
  function foldGame() {
    return new Promise(res => {
      const steps = ['right', 'left', 'up'];
      const st = { i: 0, f: [0, 0, 0], anim: false, done: false, warned: 0 };
      const P = L.panel((g, P, dt) => {
        g.fillStyle = 'rgba(255,246,225,.96)'; g.fillRect(0, 0, P.W, P.H);
        const cx = P.W / 2, cy = P.H * .5, bw = P.H * .42, bh = P.H * .52, sw = bw * .42;
        // 叠衣服的桌面
        g.fillStyle = '#f2d7a8'; L.rr(g, cx - bw * 1.6, cy - bh * .75, bw * 3.2, bh * 1.5, 30); g.fill();
        if (st.done) { L.drawImg(g, 'folded', cx, cy + bh * .3, bw * 1.1); return; }
        const [f1, f2, f3] = st.f, top = cy - bh / 2, h = bh * (1 - .5 * f3);
        g.save(); g.strokeStyle = INK; g.lineWidth = 5; g.lineJoin = 'round';
        const shirt = '#ffd84d';
        // 袖子：叠过来的时候翻到身子上面
        const sleeve = (s, f) => {
          g.save(); g.translate(cx + s * bw / 2, top + bh * .05); g.scale(1 - 2 * f, 1);
          g.fillStyle = f > .5 ? '#f2c63a' : shirt; g.beginPath(); g.moveTo(0, 0); g.lineTo(s * sw, bh * .12); g.lineTo(s * sw * .8, bh * .38); g.lineTo(0, bh * .3); g.closePath(); g.fill(); g.stroke(); g.restore();
        };
        if (f1 <= .5) sleeve(-1, f1); if (f2 <= .5) sleeve(1, f2);
        g.fillStyle = shirt; L.rr(g, cx - bw / 2, top, bw, h, 18); g.fill(); g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx, top + 4, bw * .16, bh * .06, 0, 0, Math.PI); g.fill(); g.stroke();
        if (f3 < .5) { g.fillStyle = '#ff9f1c'; g.beginPath(); g.arc(cx, top + bh * .42, bw * .12, 0, 7); g.fill(); g.stroke(); }
        if (f1 > .5) sleeve(-1, f1); if (f2 > .5) sleeve(1, f2);
        if (f3 > 0) { g.fillStyle = '#f2c63a'; L.rr(g, cx - bw / 2, top + h - bh * .5 * f3, bw, bh * .5 * f3, 18); g.fill(); g.stroke(); }
        g.restore();
        // 箭头
        const s = steps[st.i], k = (P.t * 1.2) % 1;
        g.save(); g.globalAlpha = 1 - k * .6; g.strokeStyle = '#e85d75'; g.fillStyle = '#e85d75'; g.lineWidth = P.H * .025; g.lineCap = 'round';
        let x0, y0, x1, y1;
        if (s === 'right') { x0 = cx - bw / 2 - sw * .9; y0 = top + bh * .2; x1 = x0 + bw * .6 * (.5 + k); y1 = y0; }
        else if (s === 'left') { x0 = cx + bw / 2 + sw * .9; y0 = top + bh * .2; x1 = x0 - bw * .6 * (.5 + k); y1 = y0; }
        else { x0 = cx; y0 = top + bh * .95; x1 = x0; y1 = y0 - bh * .45 * (.5 + k); }
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        const a = Math.atan2(y1 - y0, x1 - x0), al = P.H * .05;
        g.beginPath(); g.moveTo(x1 + Math.cos(a) * al * .4, y1 + Math.sin(a) * al * .4); g.lineTo(x1 + Math.cos(a + 2.5) * al, y1 + Math.sin(a + 2.5) * al); g.lineTo(x1 + Math.cos(a - 2.5) * al, y1 + Math.sin(a - 2.5) * al); g.fill();
        g.restore();
      }, {
        up: async (x, y, d) => {
          if (st.anim || st.done) return;
          const dx = x - d.x, dy = y - d.y, s = steps[st.i], need = innerHeight * .1;
          const ok = s === 'right' ? dx > need && Math.abs(dy) < Math.abs(dx) : s === 'left' ? -dx > need && Math.abs(dy) < Math.abs(dx) : -dy > need && Math.abs(dx) < Math.abs(dy);
          if (!ok) { if (Math.hypot(dx, dy) > need && st.warned++ % 2 === 0) HH.sfx('wrong'); return; }
          st.anim = true; HH.sfx('whoosh');
          for (let i = 1; i <= 12; i++) { st.f[st.i] = i / 12; await sleep(30); }
          HH.sfx('pop'); st.i++; st.anim = false;
          if (st.i >= steps.length) { st.done = true; HH.sfx('magic'); HH.burst(innerWidth / 2, innerHeight / 2, 40, { kind: 'star' }); await sleep(1200); P.close(); res(); }
        },
      });
      if (HH.auto) setTimeout(() => { P.close(); res(); }, 30);
    });
  }
  /* 16-3 收玩具 */
  L.RUN.s16c = async () => {
    if (!E.scene || E.scene.id !== 'bedroom') { setBed6(); E.add('hh', 760, 820); E.add('mama', 420, 840); }
    const box = L.imgProp('tbox', 'toybox', 170, 850, 200);
    const toys = [['blocks', 560, 790, 110], ['teddy', 880, 860, 100], ['toycar', 1000, 760, 110], ['ball2', 640, 690, 80], ['lollipop', 380, 720, 0]].filter(t => t[3]);
    await say('z16_07', { hold: 0 });
    await Promise.all(toys.map(([k, x, y, w], i) => {
      const p = L.imgProp('toy' + i, k, x, y, w, { rot: i % 2 ? .3 : -.2 });
      return E.waitTap({ id: 'tt' + i, x, y: y - 40, r: 75, walk: false, sparkle: true, sx: x, sy: y - 70, on: async () => {
        HH.sfx('pick'); HH.voice('w_wan2', false);
        const x0 = p.x, y0 = p.y;
        for (let k2 = 1; k2 <= 14; k2++) { const f = k2 / 14; p.x = HH.lerp(x0, box.x, f); p.y = HH.lerp(y0, box.y - 90, f) - Math.sin(f * Math.PI) * 200; p.rot += .4; await sleep(25); }
        E.unprop('toy' + i); HH.sfx('pop'); const q = E.toScreen(box.x, box.y - 120); HH.burst(q.x, q.y, 12, { kind: 'star' });
      } });
    }));
    await UI.quiz('wan2', { prompt: 'z16_08' });
    HH.sfx('cheer'); E.hop('hh');
    await say('z16_09');
    await UI.petal('shouwan');
    await say('end16');
  };

  /* ---------- 客厅 ---------- */
  const setLiving6 = () => { L.setLiving({ music: 'library', decor: false }); E.add('hh', 800, 800); E.add('mama', 1050, 720, { flip: true }); E.add('baba', 300, 840); };
  /* 17-1 摆碗筷 */
  L.RUN.s17a = async () => {
    setLiving6(); UI.hudShow(true);
    await say('z17_01', { hold: 0 });
    await new Promise(res => {
      const mats = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([x, y]) => ({ x, y, on: 0 }));
      let n = 0, done = false;
      const bowl = E.img('dish/bowl.webp'), chop = E.img('item/chopsticks.webp');
      const geo = P => { const cx = P.W / 2, cy = P.H * .52, R = P.H * .4; return { cx, cy, R }; };
      const P = L.panel((g, P, dt) => {
        g.fillStyle = 'rgba(60,35,20,.6)'; g.fillRect(0, 0, P.W, P.H);
        const { cx, cy, R } = geo(P);
        g.save(); g.strokeStyle = INK; g.lineWidth = 6; g.fillStyle = '#d9a066'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(120,70,30,.35)'; g.lineWidth = 3; for (let i = 1; i < 4; i++) { g.beginPath(); g.arc(cx, cy, R * i / 4, 0, 7); g.stroke(); }
        for (const m of mats) {
          const x = cx + m.x * R * .62, y = cy + m.y * R * .62;
          g.fillStyle = m.on ? '#ffe9b0' : 'rgba(255,255,255,.5)'; g.strokeStyle = m.on ? INK : '#fff'; g.lineWidth = 4; g.setLineDash(m.on ? [] : [10, 8]);
          g.beginPath(); g.arc(x, y, R * .27, 0, 7); g.fill(); g.stroke(); g.setLineDash([]);
          if (m.on) {
            const s = Math.min(1, m.on); g.save(); g.translate(x, y); g.scale(s, s);
            if (E.ok(bowl)) { const w = R * .32, h = w * E.ih(bowl) / E.iw(bowl); g.drawImage(bowl, -w / 2 - R * .04, -h / 2, w, h); }
            if (E.ok(chop)) { const h = R * .36, w = h * E.iw(chop) / E.ih(chop); g.drawImage(chop, R * .12, -h / 2, w, h); }
            g.restore(); if (m.on < 1) m.on = Math.min(1, m.on + dt * 5);
          } else { g.fillStyle = 'rgba(255,255,255,.8)'; g.font = 'bold ' + Math.round(R * .14) + 'px WK, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('点我', x, y); }
        }
        g.restore();
        g.fillStyle = '#fff'; g.font = 'bold ' + Math.round(P.H * .07) + 'px WK, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('🥣 ' + n + ' / 4', 24, P.H * .12);
      }, {
        tap: async (x, y) => {
          if (done) return;
          const { cx, cy, R } = geo(P);
          const m = mats.find(m => !m.on && Math.hypot(x - (cx + m.x * R * .62), y - (cy + m.y * R * .62)) < R * .3);
          if (!m) return;
          m.on = .01; n++; HH.sfx('ding'); HH.burst(x, y, 12, { kind: 'star' });
          if (n >= 4) { done = true; await sleep(900); P.close(); res(); }
        },
      });
      if (HH.auto) setTimeout(() => { P.close(); res(); }, 30);
    });
    await say('z17_02');
    await UI.quiz('wan3', { prompt: 'z17_03' });
    await UI.petal('baiwan');
  };
  /* 17-2 扫地 */
  L.RUN.s17b = async () => {
    if (!E.scene || E.scene.id !== 'living') setLiving6();
    await say('z17_04', { hold: 0 });
    const W = innerWidth, H = innerHeight, sc = Math.max(W / 1672, H / 941), ox = (W - 1672 * sc) / 2, oy = (H - 941 * sc) / 2;
    const world = [[620, 800], [880, 700], [1100, 820], [1250, 680], [420, 860], [980, 600]];
    const spots = world.map(([x, y]) => ({ x: (ox + x * sc) / W, y: (oy + y * sc) / H, r: .08 }));
    const bg = E.img('bg/living.jpg');
    await L.rub({
      spots, hard: 160, sfx: 'chalk',
      draw: (g, W2, H2) => { if (E.ok(bg)) { const s2 = Math.max(W2 / 1672, H2 / 941); g.drawImage(bg, (W2 - 1672 * s2) / 2, (H2 - 941 * s2) / 2, 1672 * s2, 941 * s2); } },
      dirt: (g, x, y, r, hp, t, s) => { g.save(); g.globalAlpha = Math.min(1, hp * 1.5); g.fillStyle = '#fff'; g.strokeStyle = '#c9b48a'; g.lineWidth = 1.5;
        for (let i = 0; i < 9; i++) { const a = i * 2.4 + s.x * 9, rr = r * (.2 + (i % 4) * .2); g.beginPath(); g.ellipse(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .6, r * .1, r * .05, a, 0, 7); g.fill(); g.stroke(); }
        g.fillStyle = '#7cc46b'; g.beginPath(); g.arc(x + r * .3, y - r * .1, r * .08, 0, 7); g.fill(); g.restore(); },
      tool: (g, x, y, H2) => { g.save(); g.translate(x, y); g.rotate(.35); g.strokeStyle = INK; g.lineWidth = 4; g.fillStyle = '#c98a4b'; g.fillRect(-4, -H2 * .32, 8, H2 * .28); g.strokeRect(-4, -H2 * .32, 8, H2 * .28);
        g.fillStyle = '#ffcf5a'; g.beginPath(); g.moveTo(-H2 * .04, -H2 * .05); g.lineTo(H2 * .04, -H2 * .05); g.lineTo(H2 * .07, H2 * .04); g.lineTo(-H2 * .07, H2 * .04); g.closePath(); g.fill(); g.stroke(); g.restore(); },
    });
    HH.sfx('cheer');
    await UI.quiz('sao', { prompt: 'z17_05' });
    await UI.petal('saodi');
  };
  /* 17-3 垃圾分类 */
  L.RUN.s17c = async () => {
    if (!E.scene || E.scene.id !== 'living') setLiving6();
    await say('z17_06', { hold: 0 });
    const em = e => '<i style="font-size:10vh;font-style:normal;line-height:1">' + e + '</i>';
    await L.sort({
      wrong: 'z17_no',
      items: [{ k: 'peel', html: em('🍌'), label: '香蕉皮', bin: 'chu' }, { k: 'bone', html: em('🍗'), label: '鸡骨头', bin: 'chu' }, { k: 'paper', html: em('📰'), label: '旧报纸', bin: 'hui' },
        { k: 'bottle', html: em('🧴'), label: '塑料瓶', bin: 'hui' }, { k: 'battery', html: em('🔋'), label: '旧电池', bin: 'hai' }, { k: 'tissue', html: em('🧻'), label: '脏纸巾', bin: 'qi' }],
      bins: [{ k: 'hui', label: '可回收物', icon: '♻️', col: '#3d7fd9' }, { k: 'chu', label: '厨余垃圾', icon: '🍂', col: '#3d9a4f' }, { k: 'hai', label: '有害垃圾', icon: '☠️', col: '#d94a3d' }, { k: 'qi', label: '其他垃圾', icon: '🗑️', col: '#6b6b6b' }],
    });
    HH.sfx('cheer'); E.hop('hh');
    await say('z17_07');
    await UI.petal('fenlei');
    await say('end17');
  };

  /* ---------- 阳台 ---------- */
  const bal = L.bal6 = { clothes: [], bowl: true };
  const LINE = [[470, 330], [1160, 300]];
  const PEGS = [[610, 324], [810, 315], [1010, 306]];
  const BALCONY = {
    id: 'balcony', bg: 'bg/balcony.jpg', cam: { x: 836, y: 520, z: 1 },
    size: y => 210 + (y - 680) * .8,
    walk: [[[450, 730], [1170, 730], [1240, 930], [410, 930]]],
    drawBack(g, t) {
      if (!HH.has('stickers', 's_balcony')) L.tinyStar(g, 96, 158, .8, t);
      if (bal.bowl) L.drawImg(g, 'fishbowl', 300, 548, 120);
      // 晾衣绳
      g.save(); g.strokeStyle = '#8a6a50'; g.lineWidth = 4; g.beginPath(); g.moveTo(LINE[0][0], LINE[0][1]); g.quadraticCurveTo(815, 340, LINE[1][0], LINE[1][1]); g.stroke();
      g.fillStyle = '#8a6a50'; for (const [x, y] of LINE) { g.fillRect(x - 6, y - 10, 12, 20); }
      for (const c of bal.clothes) {
        const im = E.img('item/' + c.k + '.webp'); if (!E.ok(im)) continue;
        const w = c.w, h = w * E.ih(im) / E.iw(im), sw = Math.sin(t * 2 + c.x) * .04;
        g.save(); g.translate(c.x, c.y); g.rotate(sw); g.drawImage(im, -w / 2, -4, w, h);
        g.fillStyle = '#ff8fa3'; g.strokeStyle = INK; g.lineWidth = 2; g.fillRect(-5, -12, 10, 20); g.strokeRect(-5, -12, 10, 20); g.restore();
      }
      g.restore();
    },
  };
  const setBalcony = () => {
    E.load(BALCONY); HH.music('garden'); E.onActor = L.chat; E.onFloor = null;
    bal.clothes = []; bal.bowl = true;
    E.add('hh', 760, 820); E.add('mama', 1060, 800, { flip: true });
  };
  /* 18-1 浇花 */
  L.RUN.s18a = async () => {
    setBalcony(); UI.hudShow(true);
    await say('z18_01');
    await say('z18_02', { hold: 0 });
    const W = innerWidth, H = innerHeight;
    const pots = [.2, .4, .6, .8].map((x, i) => ({ x, y: .74, r: .14, col: ['#ff8fa3', '#ffd23f', '#c79bff', '#ff9f43'][i] }));
    await L.rub({
      spots: pots, hard: 200, sfx: 'drip', col: 'water',
      draw: (g, W2, H2, st, t) => {
        const sky = g.createLinearGradient(0, 0, 0, H2); sky.addColorStop(0, '#bfe6ff'); sky.addColorStop(1, '#fff3d6'); g.fillStyle = sky; g.fillRect(0, 0, W2, H2);
        g.fillStyle = '#c9a37a'; g.fillRect(0, H2 * .8, W2, H2 * .2);
        for (const s of st.spots) {
          const x = s.x * W2, y = s.y * H2, r = H2 * .1, droop = Math.max(0, s.hp);
          g.save(); g.strokeStyle = INK; g.lineWidth = 4;
          // 花盆
          g.fillStyle = '#d9774a'; g.beginPath(); g.moveTo(x - r * .8, y); g.lineTo(x + r * .8, y); g.lineTo(x + r * .6, y + r * .9); g.lineTo(x - r * .6, y + r * .9); g.closePath(); g.fill(); g.stroke();
          // 茎：渴的时候弯下来
          const tipX = x + droop * r * 1.1, tipY = y - r * 2.2 + droop * r * 1.3;
          g.strokeStyle = '#3d9a4f'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x, y - r * 1.4, tipX, tipY); g.stroke();
          g.fillStyle = '#5bbf6a'; g.beginPath(); g.ellipse(x - r * .3, y - r * .8, r * .3, r * .12, -.6, 0, 7); g.fill();
          // 花
          g.translate(tipX, tipY); g.rotate(droop * 1.2);
          const c = droop > .5 ? '#c8b8a8' : s.col;
          for (let i = 0; i < 6; i++) { g.save(); g.rotate(i * Math.PI / 3); g.fillStyle = c; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.ellipse(0, -r * .4, r * .22, r * .36, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
          g.fillStyle = '#ffb703'; g.beginPath(); g.arc(0, 0, r * .2, 0, 7); g.fill(); g.stroke();
          g.restore();
        }
      },
      dirt: () => { },
      tool: (g, x, y, H2, t) => {
        L.drawImg(g, 'can', x + H2 * .12, y + H2 * .12, H2 * .3, -.45);
        g.fillStyle = 'rgba(110,198,255,.85)'; for (let i = 0; i < 5; i++) { const k = (t * 3 + i / 5) % 1; g.beginPath(); g.arc(x - H2 * .02 + i * 3, y + k * H2 * .12, 4, 0, 7); g.fill(); }
      },
    });
    HH.sfx('cheer');
    await say('z18_03');
  };
  /* 18-2 喂小金鱼：三颗鱼食就够 */
  L.RUN.s18b = async () => {
    if (!E.scene || E.scene.id !== 'balcony') setBalcony();
    await E.walk('hh', 520, 800); E.face('hh', 300);
    await say('z18_04');
    await say('z18_05', { hold: 0 });
    await new Promise(res => {
      const food = []; let n = 0, eaten = 0, done = false, busy = false;
      const fish = { x: 0, y: 0, vx: 1, t: 0 };
      const P = L.panel((g, P, dt) => {
        g.fillStyle = 'rgba(40,60,90,.55)'; g.fillRect(0, 0, P.W, P.H);
        const cx = P.W / 2, cy = P.H * .5, R = P.H * .4;
        g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
        g.fillStyle = 'rgba(200,235,255,.9)'; g.fillRect(cx - R, cy - R, R * 2, R * 2);
        g.fillStyle = 'rgba(110,190,240,.85)'; g.fillRect(cx - R, cy - R * .55, R * 2, R * 2);
        g.fillStyle = '#e8c88a'; g.beginPath(); g.ellipse(cx, cy + R, R, R * .3, 0, 0, 7); g.fill();
        g.strokeStyle = '#3d9a4f'; g.lineWidth = 6; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx - R * .5 + i * R * .4, cy + R * .8); g.quadraticCurveTo(cx - R * .55 + i * R * .4 + Math.sin(P.t * 2 + i) * 14, cy + R * .4, cx - R * .5 + i * R * .4, cy + R * .1); g.stroke(); }
        // 鱼食往下沉
        for (const f of food) { if (f.eaten) continue; f.y = Math.min(f.y + dt * P.H * .12, cy + R * .7); g.fillStyle = '#c0703a'; g.beginPath(); g.arc(f.x, f.y, P.H * .012, 0, 7); g.fill(); }
        // 小金鱼游过去吃
        const tgt = food.find(f => !f.eaten && f.y > cy - R * .5);
        fish.t += dt;
        const fx0 = fish.x || cx, fy0 = fish.y || cy;
        const tx = tgt ? tgt.x : cx + Math.sin(fish.t * .7) * R * .5, ty = tgt ? tgt.y : cy + Math.sin(fish.t * 1.3) * R * .2;
        fish.x = fx0 + (tx - fx0) * Math.min(1, dt * (tgt ? 2.5 : 1)); fish.y = fy0 + (ty - fy0) * Math.min(1, dt * (tgt ? 2.5 : 1));
        if (Math.abs(tx - fx0) > 2) fish.vx = tx > fx0 ? 1 : -1;
        if (tgt && Math.hypot(fish.x - tgt.x, fish.y - tgt.y) < P.H * .04) { tgt.eaten = true; eaten++; HH.sfx('pop'); HH.burst(tgt.x, tgt.y, 8, { col: 'water', speed: 80 }); }
        g.save(); g.translate(fish.x, fish.y); g.scale(fish.vx, 1);
        const fr = P.H * .06; g.fillStyle = '#ff7b3a'; g.strokeStyle = INK; g.lineWidth = 3;
        g.beginPath(); g.moveTo(-fr * 1.1, 0); g.lineTo(-fr * 1.9, -fr * .7 + Math.sin(fish.t * 12) * 4); g.lineTo(-fr * 1.9, fr * .7 - Math.sin(fish.t * 12) * 4); g.closePath(); g.fill(); g.stroke();
        g.beginPath(); g.ellipse(0, 0, fr * 1.2, fr * .75, 0, 0, 7); g.fill(); g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(fr * .55, -fr * .15, fr * .2, 0, 7); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(fr * .6, -fr * .15, fr * .1, 0, 7); g.fill();
        g.restore();
        g.restore();
        g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
        g.fillStyle = '#fff'; g.font = 'bold ' + Math.round(P.H * .07) + 'px WK, sans-serif'; g.textAlign = 'left'; g.fillText('🐟 ' + n + ' / 3', 24, P.H * .12);
        if (!done && eaten >= 3) { done = true; setTimeout(() => { wrap.remove(); P.close(); res(); }, HH.fast ? 5 : 1200); }
      });
      const wrap = UI.el('div', 'acts'), b = UI.el('button', 'act green', '<img src="' + HH.IMG + 'item/fishfood.webp">撒一颗'); wrap.appendChild(b); layer.appendChild(wrap);
      b.onclick = async () => {
        if (busy || done) return;
        if (n >= 3) { busy = true; HH.sfx('wrong'); b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); await say('z18_more', { hold: 40 }); busy = false; return; }
        n++; HH.sfx('drip');
        food.push({ x: innerWidth / 2 + (Math.random() - .5) * innerHeight * .4, y: innerHeight * .2, eaten: false });
      };
      if (HH.auto) setTimeout(() => { done = true; wrap.remove(); P.close(); res(); }, 30);
    });
    HH.sfx('cheer');
    await say('z18_06');
    await UI.quiz('yu2', { prompt: 'z18_07' });
    await UI.sticker('q_fish');
    await UI.petal('zhaogu');
  };
  /* 18-3 晾衣服 */
  L.RUN.s18c = async () => {
    if (!E.scene || E.scene.id !== 'balcony') setBalcony();
    await E.walk('hh', 760, 820); E.face('hh', 900);
    await say('z18_08', { hold: 0 });
    const basket = L.imgProp('lbasket', 'basket', 880, 860, 150);
    const items = [['tshirt', 110], ['pants', 90], ['socks', 80]];
    for (let i = 0; i < items.length; i++) {
      const [k, w] = items[i];
      const p = L.imgProp('cl' + i, k, 880, 780, 90, { z: 0 });
      await E.waitTap({ id: 'cl' + i, x: 880, y: 740, r: 90, walk: false, sparkle: true, sx: 880, sy: 700 });
      HH.sfx('whoosh');
      const [px, py] = PEGS[i], x0 = p.x, y0 = p.y;
      for (let k2 = 1; k2 <= 14; k2++) { const f = k2 / 14; p.x = HH.lerp(x0, px, f); p.y = HH.lerp(y0, py + 90, f) - Math.sin(f * Math.PI) * 120; await sleep(25); }
      E.unprop('cl' + i); bal.clothes.push({ k, x: px, y: py, w }); HH.sfx('pop');
      const q = E.toScreen(px, py); HH.burst(q.x, q.y, 10, { kind: 'star' });
    }
    E.unprop('lbasket');
    HH.sfx('cheer'); E.hop('hh');
    await say('z18_09');
    E.face('mama', 760);
    await say('z18_10');
    await L.peekStar('s_balcony', { x: 96, y: 140, r: 70 });
    E.face('hh', 836);
    await UI.photo('ep6', '第六集 · 我会自己做');
    await say('end18');
  };

  Object.assign(L.STAGES, {
    16: { ep: 6, name: '卧室', title: '第十六站 · 卧室', bg: 'bg/bedroom.jpg' },
    17: { ep: 6, name: '客厅', title: '第十七站 · 客厅', bg: 'bg/living.jpg' },
    18: { ep: 6, name: '阳台', title: '第十八站 · 阳台', bg: 'bg/balcony.jpg' },
  });
  L.EPS[6] = { name: '我会自己做', title: '第六集 · 我会自己做', first: 's16a' };
  L.LIST.push({ id: 's16a', st: 16, name: '整理书包' }, { id: 's16b', st: 16, name: '叠衣服' }, { id: 's16c', st: 16, name: '收玩具' },
    { id: 's17a', st: 17, name: '摆碗筷' }, { id: 's17b', st: 17, name: '扫地' }, { id: 's17c', st: 17, name: '垃圾分类' },
    { id: 's18a', st: 18, name: '浇花' }, { id: 's18b', st: 18, name: '喂小金鱼' }, { id: 's18c', st: 18, name: '晾衣服' });
})();
