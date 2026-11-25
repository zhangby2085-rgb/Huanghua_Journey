/* 黄花的生活 第二集《小水滴的旅行》：第四站 图书馆（4-1 嘘小声点、4-2 找书、4-3 借书）+ 6-3 按时还书 */
(function () {
  const HH = window.HH, D = HH.D, E = HH.E, UI = HH.UI, S = HH.S, L = HH.L;
  const say = UI.say, sleep = HH.sleep;
  const layer = HH.$('#layer');

  /* ---------- 通用：一层全屏画布（特写小游戏用） ---------- */
  L.panel = (draw, o = {}) => {
    const box = UI.el('div', 'wash'), c = document.createElement('canvas'); box.appendChild(c);
    if (o.under) layer.insertBefore(box, layer.firstChild); else layer.appendChild(box);
    const g = c.getContext('2d');
    const P = { c, g, W: innerWidth, H: innerHeight, t: 0, box };
    const fit = () => { const dpr = Math.min(2, devicePixelRatio || 1); P.W = innerWidth; P.H = innerHeight; c.width = P.W * dpr; c.height = P.H * dpr; P.dpr = dpr; };
    fit(); addEventListener('resize', fit);
    let raf = 0, last = performance.now();
    const frame = now => {
      const dt = Math.min(.05, (now - last) / 1000); last = now; P.t += dt;
      g.setTransform(P.dpr, 0, 0, P.dpr, 0, 0); g.clearRect(0, 0, P.W, P.H);
      try { draw(g, P, dt); } catch (e) { HH.log('panel', e); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    let down = null;
    c.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false }; if (o.down) o.down(e.clientX, e.clientY); });
    c.addEventListener('pointermove', e => { if (!down) return; if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) down.moved = true; if (o.move) o.move(e.clientX, e.clientY, down); });
    const up = e => { if (!down) return; const d = down; down = null; if (o.up) o.up(e.clientX, e.clientY, d); if (!d.moved && o.tap) o.tap(e.clientX, e.clientY); };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', () => { down = null; });
    P.close = () => { cancelAnimationFrame(raf); removeEventListener('resize', fit); box.remove(); };
    return P;
  };
  /* 等几秒，让小朋友找藏起来的小水滴（找到就算；点"继续"也可以走） */
  L.peek = async (id, h) => {
    if (HH.has('stickers', id)) return;
    E.hs(Object.assign({ id: 'pk_' + id, always: true, walk: false, prio: 3, sparkle: false, on: async () => { E.unhs('pk_' + id); HH.$$('.acts').forEach(n => n.remove()); peekDone && peekDone(); await UI.sticker(id, 'st_drop'); } }, h));
    let peekDone = null;
    await say('pk', { hold: 0 });
    await new Promise(res => {
      peekDone = res;
      UI.acts([{ t: '继续 ▶', cls: 'small' }]).then(res);
      if (HH.auto) setTimeout(res, 20);
    });
    E.unhs('pk_' + id);
    await sleep(200);
  };
  /* 画一颗藏起来的小水滴 */
  L.tinyDrop = (g, x, y, s = 1, t = 0) => {
    const im = E.img('ch/didi.webp'); if (!E.ok(im)) return;
    const h = 46 * s, w = h * E.iw(im) / E.ih(im);
    g.save(); g.globalAlpha = .85 + .15 * Math.sin(t * 4); g.drawImage(im, x - w / 2, y - h + Math.sin(t * 3) * 2, w, h);
    g.globalAlpha = .5 + .5 * Math.sin(t * 5); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + w * .4, y - h * .9, 4, 0, 7); g.fill(); g.restore();
  };

  /* ---------- 图书馆场景 ---------- */
  const SPOT = { hh: [760, 822], mm: [540, 806], hu: [980, 796], cm: [1170, 812], bk: [1360, 800], al: [330, 836], ma: [140, 790] };
  const lib = L.lib = { noise: 0, open: 0, rain: 0 };
  const LIB = L.LIB = {
    id: 'lib', bg: 'bg/library.jpg',
    size: y => 150 + (y - 650) * .75,
    walk: [[[210, 724], [1580, 724], [1620, 905], [170, 905]]],
    cam: { x: 836, y: 470, z: 1 },
    drawBack(g, t) {
      if (!HH.has('stickers', 'd_lib')) L.tinyDrop(g, 232, 362, .8, t);
      // 窗外下雨（结尾）
      if (lib.rain > 0) {
        g.save(); g.beginPath(); g.rect(1175, 70, 410, 490); g.clip();
        g.fillStyle = 'rgba(60,80,120,' + lib.rain * .25 + ')'; g.fillRect(1175, 70, 410, 490);
        g.strokeStyle = 'rgba(220,235,255,' + lib.rain * .8 + ')'; g.lineWidth = 2;
        for (let i = 0; i < 60; i++) { const x = 1175 + ((i * 97 + t * 260) % 470), y = 70 + ((i * 53 + t * 900) % 520); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + 22); g.stroke(); }
        g.restore();
      }
    },
  };
  L.setLib = (o = {}) => {
    E.load(LIB);
    HH.music('library');
    lib.noise = 0; lib.rain = 0;
    for (const id of o.who || ['al', 'mm', 'hh', 'hu', 'cm', 'bk', 'ma']) { const p = (o.at && o.at[id]) || SPOT[id]; E.add(id, p[0], p[1]); }
    if (E.actors.ma) E.actors.ma.flip = false;
    E.onActor = L.chat; E.onFloor = null;
  };
  /* 滴滴出场：在 x, y 的书上方冒出来 */
  L.didiPop = async (x, y) => {
    const dd = E.add('dd', x, y, { float: 150, alpha: 0, scale: .2 });
    HH.sfx('magic'); HH.buzz(60);
    { const p = E.toScreen(x, y - 120); HH.burst(p.x, p.y, 50, { kind: 'star', col: 'water', speed: 420 }); }
    for (let i = 1; i <= 14; i++) { dd.alpha = i / 14; dd.scale = .2 + .8 * HH.ease(i / 14) + (i === 11 ? .1 : 0); await sleep(30); }
    dd.scale = 1; dd.pose = 'happy';
    return dd;
  };

  /* ---------- 4-1 嘘，小声点 ---------- */
  L.RUN.s4a = async () => {
    L.setLib({ who: [] });
    UI.hudShow(true);
    await say('l01');
    const ids = ['ma', 'hh', 'mm', 'hu', 'cm', 'bk', 'al'];
    await Promise.all(ids.map((id, i) => sleep(i * 240).then(() => { E.add(id, 1780, 840); return E.walk(id, SPOT[id][0], SPOT[id][1], { free: true }); })));
    E.actors.ma.flip = false;
    for (const id of ['hh', 'mm', 'hu', 'cm', 'bk', 'al']) E.face(id, 140);
    await say('l02'); await say('l03');
    await UI.quiz('jing', { prompt: 'l04' });
    await say('l05', { hold: 0 });
    await noiseGame();
    await say('l06');
    await UI.petal('anjing');
  };
  /* 吵闹计：谁大声说话，点它；吵闹计满了老师会提醒 */
  async function noiseGame() {
    const bar = UI.el('div', 'noise', '<span>🔊</span><div class="nb"><i></i></div>'); layer.appendChild(bar);
    const fill = bar.querySelector('i');
    let loud = null, alive = true;
    const tick = () => {
      if (!alive) return;
      lib.noise = HH.clamp(lib.noise + (loud ? .22 : -.12) / 8, 0, 1.05);
      fill.style.width = Math.min(100, lib.noise * 100) + '%';
      fill.style.background = lib.noise > .75 ? '#ff5d5d' : lib.noise > .45 ? '#ffb03a' : '#5bbf6a';
      if (loud) { const a = E.actors[loud]; a.shake = .6; if (Math.random() < .15) E.hop(loud, 18, 300); }
      setTimeout(tick, 125);
    };
    tick();
    const order = HH.shuffle(['hu', 'cm', 'al', 'mm', 'bk']);
    let shh = 0;
    for (const id of order) {
      await sleep(900);
      loud = id;
      const a = E.actors[id];
      say('ld_' + id, { hold: 0 });
      let warned = false;
      await new Promise(res => {
        E.hs({ id: 'loud', always: true, walk: false, prio: 5, get x() { return a.x; }, get y() { return a.y - a.h * .5; }, w: 260, h: 400, sparkle: true, get sx() { return a.x; }, get sy() { return a.y - a.h - 20; },
          on: async () => { E.unhs('loud'); clearInterval(iv); res(); } });
        const iv = setInterval(() => { if (lib.noise >= 1 && !warned) { warned = true; say('l_full', { hold: 0 }); lib.noise = .5; } }, 200);
        if (HH.auto) setTimeout(() => E.tapHot('loud'), 30);
      });
      loud = null; a.shake = 0;
      HH.sfx('pop');
      E.face('hh', a.x);
      await say(shh++ % 2 ? 'l_shh2' : 'l_shh', { hold: 40 });
      a.sq = .12;
      await say('lq_' + id, { hold: 60 });
    }
    alive = false;
    for (let i = 0; i < 8; i++) { lib.noise = Math.max(0, lib.noise - .12); fill.style.width = lib.noise * 100 + '%'; await sleep(60); }
    bar.remove();
  }

  /* ---------- 4-2 找书（书架特写） ---------- */
  const BOOKS = [
    ['konglong', '#7cc56a', '🦖'], ['shuidi', '#5aa9ef', '💧'], ['xingxing', '#8b7ce8', '⭐'], ['tuzi', '#ff9fb5', '🐰'],
    ['pingguo', '#ff8a6a', '🍎'], ['daxiang', '#9cc3e6', '🐘'], ['xiaoniao', '#ffd25a', '🐦'], ['zuqiu', '#b5b5b5', '⚽'],
  ];
  L.RUN.s4b = async () => {
    L.setLib();
    await say('lb01'); await say('lb02');
    const shelf = { books: BOOKS.map((b, i) => ({ k: b[0], col: b[1], ic: b[2], i, out: 0, shake: 0, gone: false })), want: null };
    const geo = P => {
      const w = Math.min(P.W * .82, P.H * 1.7), x0 = (P.W - w) / 2, rowH = P.H * .32, y0 = P.H * .2;
      return shelf.books.map((b, i) => { const r = i < 4 ? 0 : 1, c = i % 4, bw = w / 4 * .62; return { b, x: x0 + w / 4 * (c + .5), y: y0 + rowH * (r + 1) - P.H * .02, w: bw, h: rowH * .8 }; });
    };
    const easy = S.set.level === 'easy';
    const pnl = L.panel((g, P) => {
      g.fillStyle = 'rgba(60,35,20,.55)'; g.fillRect(0, 0, P.W, P.H);
      const w = Math.min(P.W * .82, P.H * 1.7), x0 = (P.W - w) / 2, rowH = P.H * .32, y0 = P.H * .2;
      // 书架
      g.fillStyle = '#b77a45'; g.strokeStyle = '#4a2e1c'; g.lineWidth = 6;
      g.fillRect(x0 - 20, y0 - 20, w + 40, rowH * 2 + 40); g.strokeRect(x0 - 20, y0 - 20, w + 40, rowH * 2 + 40);
      g.fillStyle = '#7a4a24'; g.fillRect(x0, y0, w, rowH * 2);
      for (let r = 1; r <= 2; r++) { g.fillStyle = '#c98e55'; g.fillRect(x0 - 20, y0 + rowH * r - 14, w + 40, 18); g.strokeRect(x0 - 20, y0 + rowH * r - 14, w + 40, 18); }
      for (const q of geo(P)) {
        const b = q.b; if (b.gone) continue;
        const lift = b.out * q.h * .35, sx = Math.sin(P.t * 40) * b.shake * 8;
        b.shake = Math.max(0, b.shake - .03);
        const bx = q.x - q.w / 2 + sx, by = q.y - q.h - lift;
        g.fillStyle = b.col; g.strokeStyle = '#4a2e1c'; g.lineWidth = 4;
        g.beginPath(); g.roundRect ? g.roundRect(bx, by, q.w, q.h, 8) : g.rect(bx, by, q.w, q.h); g.fill(); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(bx + 6, by + 8, q.w - 12, 8); g.fillRect(bx + 6, by + q.h - 16, q.w - 12, 8);
        // 书背上的拼音标签
        const py = D.words[b.k].py.split(' ');
        const lh = Math.min(q.w * .34, P.H * .052), lw = q.w * .86, lab = lh * (py.length + (easy ? 1.1 : 0)) + 14;
        g.fillStyle = '#fffaf0'; g.fillRect(q.x - lw / 2 + sx, by + q.h * .22, lw, lab); g.strokeRect(q.x - lw / 2 + sx, by + q.h * .22, lw, lab);
        g.fillStyle = '#c2452d'; g.font = 'bold ' + lh + 'px WK'; g.textAlign = 'center'; g.textBaseline = 'top';
        py.forEach((s, j) => g.fillText(s, q.x + sx, by + q.h * .22 + 7 + j * lh));
        if (easy) { g.fillStyle = '#4a2e1c'; g.font = (lh * .9) + 'px WK'; g.fillText(D.words[b.k].ch, q.x + sx, by + q.h * .22 + 7 + py.length * lh); }
        g.font = (q.w * .38) + 'px sans-serif'; g.textBaseline = 'alphabetic'; g.globalAlpha = easy ? 1 : .0; g.fillText(b.ic, q.x + sx, by + q.h * .95); g.globalAlpha = 1;
      }
    }, { tap: (x, y) => { if (shelf.onTap) shelf.onTap(x, y); } });
    const hitBook = (x, y) => geo(pnl).find(q => !q.b.gone && Math.abs(x - q.x) < q.w / 2 && y > q.y - q.h && y < q.y);
    // 一次找一本书：want=要找的拼音；返回找到的那本
    const find = (want, prompt) => new Promise(res => {
      let busy = false;
      shelf.onTap = async (x, y) => {
        const q = hitBook(x, y); if (!q || busy) return;
        busy = true;
        if (q.b.k === want) {
          HH.sfx('right'); for (let i = 1; i <= 8; i++) { q.b.out = i / 8; await sleep(25); }
          HH.burst(q.x, q.y - q.h, 26, { kind: 'star' }); await HH.voice('w_' + want);
          shelf.onTap = null; res(q);
        } else { HH.sfx('wrong'); q.b.shake = 1; await HH.voice('w_' + q.b.k); await say('lb_no', { hold: 40 }); if (prompt) await HH.voice(prompt); busy = false; }
      };
      if (HH.auto) setTimeout(() => { const q = geo(pnl).find(z => z.b.k === want); shelf.onTap(q.x, q.y - q.h * .5); }, 30);
    });
    const pill = k => UI.pill('<span>找一找</span>' + (S.set.level !== 'adv' ? '<span class="py">' + D.words[k].py + '</span>' : ''), () => HH.voice('w_' + k));
    await say('lb03', { hold: 0 });
    pill('shuidi');
    const got = await find('shuidi', 'lb03');
    UI.unpill(); got.b.gone = true;
    await say('lb04');
    await UI.got('dbook');
    for (const [id, k, line, ok] of [['cm', 'tuzi', 'lb05', 'lb_ok_cm'], ['al', 'daxiang', 'lb06', 'lb_ok_al'], ['hu', 'zuqiu', 'lb07', 'lb_ok_hu']]) {
      await say(line, { hold: 0 });
      pill(k);
      const q = await find(k, null);
      UI.unpill(); q.b.gone = true; HH.sfx('whoosh');
      E.hop(id, 30);
      await say(ok, { hold: 60 });
    }
    pnl.close();
    // 折书角？用书签！
    E.hop('hu', 20); await say('lb08');
    await say('lb09', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: '🔖', lb: '夹书签', ok: true }, { ic: '📐', lb: '折书角', no: 'lb_no2' }, { ic: '✏️', lb: '在书上画', no: 'lb_no3' }]));
    await say('lb10'); E.hop('hu', 26); await say('lb11');
    await UI.petal('aihu');
    await L.peek('d_lib', { x: 232, y: 340, r: 60 });
  };

  /* ---------- 4-3 借书 ---------- */
  L.RUN.s4c = async () => {
    // 大家挤成一团
    const crowd = { hh: [330, 812], mm: [470, 790], hu: [420, 860], cm: [560, 846], bk: [640, 800], al: [720, 860], ma: [140, 790] };
    L.setLib({ at: crowd });
    await say('lc01'); await say('lc02', { hold: 0 });
    const slots = [[470, 820], [610, 820], [750, 820], [890, 820], [1030, 820]];
    let n = 0;
    const left = ['mm', 'hu', 'cm', 'bk', 'al'];
    await new Promise(res => {
      for (const id of left) {
        const a = E.actors[id];
        E.hs({ id: 'q_' + id, always: true, walk: false, prio: 4, get x() { return a.x; }, get y() { return a.y - a.h * .5; }, w: 220, h: 380,
          on: async () => {
            E.unhs('q_' + id); const s = slots[n++]; HH.sfx('pick');
            await E.walk(id, s[0], s[1], { free: true }); a.flip = true;
            if (n === left.length) res();
          } });
      }
      if (HH.auto) (async () => { for (const id of left) { await E.tapHot('q_' + id); } })();
    });
    HH.sfx('cheer'); await say('lc03');
    await E.camTo({ x: 520, y: 560, z: 1.35 }, 900);
    // 借书卡
    await say('lc04', { hold: 0 });
    await tapItem('card', '交给老师');
    HH.sfx('ding'); await sleep(150); HH.sfx('ding');
    await say('lc05');
    await UI.quiz('jie', { prompt: 'lc06' });
    // 盖章
    await say('lc07', { hold: 0 });
    await stampSlip();
    await say('lc08'); await say('lc09');
    await UI.petal('paidui');
    // 翻开书——滴滴跳出来
    await E.camTo({ x: 836, y: 470, z: 1 }, 700);
    await E.walk('hh', 800, 830); E.face('hh', 900);
    const bk = L.itemProp('openbook', 'dbook', 880, 800, 90);
    await say('lc10');
    E.camTo({ x: 860, y: 560, z: 1.5 }, 800);
    await say('lc11');
    E.unprop('openbook');
    const dd = await L.didiPop(880, 820);
    await say('lc12');
    E.actors.hh.pose = 'jump'; await say('lc13'); E.actors.hh.pose = 'stand';
    dd.pose = 'stand'; await say('lc14');
    dd.pose = 'happy'; await say('lc15');
    await say('lc16');
    await E.camTo({ x: 836, y: 470, z: 1 }, 700);
    await say('end4');
  };
  /* 屏幕中间出现一样东西，点一下它就飞走 */
  function tapItem(key, label) {
    return new Promise(res => {
      const box = UI.el('div', 'veil', ''), card = UI.el('button', 'got', '<img src="' + HH.IMG + 'item/' + key + '.webp"><div class="nm">' + label + '</div>');
      box.appendChild(card); layer.appendChild(box);
      const hand = UI.el('div', 'hand', '👆'); hand.style.left = '55%'; hand.style.top = '55%'; box.appendChild(hand);
      card.onclick = async () => {
        card.onclick = null; HH.sfx('whoosh');
        card.style.transition = 'transform .5s, opacity .5s'; card.style.transform = 'translate(-40vw, 10vh) scale(.3) rotate(-20deg)'; card.style.opacity = '0';
        await sleep(500); box.remove(); res();
      };
      if (HH.auto) setTimeout(() => card.onclick(), 30);
    });
  }
  L.tapItem = tapItem;
  /* 还书日期单：点印章，盖一个红章 */
  function stampSlip() {
    return new Promise(res => {
      let st = 0;
      const pnl = L.panel((g, P) => {
        g.fillStyle = 'rgba(60,35,20,.5)'; g.fillRect(0, 0, P.W, P.H);
        const w = P.H * .7, h = P.H * .5, x = P.W / 2 - w / 2, y = P.H * .3;
        g.fillStyle = '#fffdf3'; g.strokeStyle = '#4a2e1c'; g.lineWidth = 5; g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h);
        g.fillStyle = '#4a2e1c'; g.font = (P.H * .06) + 'px WK'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('还书日期', P.W / 2, y + h * .2);
        g.strokeStyle = '#d9c3a5'; g.lineWidth = 3; g.setLineDash([10, 8]); g.strokeRect(P.W / 2 - w * .32, y + h * .38, w * .64, h * .48); g.setLineDash([]);
        if (st >= 1) { // 红章
          g.save(); g.translate(P.W / 2, y + h * .62); g.rotate(-.12); g.strokeStyle = '#e04848'; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, h * .2, 0, 7); g.stroke();
          g.fillStyle = '#e04848'; g.font = 'bold ' + (h * .13) + 'px WK'; g.fillText('7天', 0, -h * .03); g.font = (h * .07) + 'px WK'; g.fillText('按时还', 0, h * .1); g.restore();
        }
        // 印章
        const im = E.img('item/stamp.webp');
        if (E.ok(im) && st < 2) {
          const sh = P.H * .32, sw = sh * E.iw(im) / E.ih(im), k = st === 1 ? 1 : 0;
          const sx = P.W / 2 + w * .62 - k * w * .62, sy = y + h * .05 + k * h * .22 + Math.sin(P.t * 4) * (st ? 0 : 6);
          g.drawImage(im, sx - sw / 2, sy - sh / 2, sw, sh);
        }
      }, { tap: () => go() });
      const go = async () => {
        if (st) return; st = 1; HH.sfx('land'); HH.buzz(50);
        await sleep(450); st = 2; HH.sfx('ding'); await sleep(900); pnl.close(); res();
      };
      if (HH.auto) setTimeout(go, 30);
    });
  }

  /* ---------- 6-3 按时还书 ---------- */
  L.RUN.s6c = async () => {
    L.setLib();
    const dd = E.add('dd', 880, 800, { float: 170, pose: 'happy' });
    await say('hs01');
    await E.walk('hh', 330, 812); E.face('hh', 140);
    E.walk('dd', 420, 800);
    await E.camTo({ x: 520, y: 560, z: 1.35 }, 800);
    await say('hs02');
    await UI.quiz('huan', { prompt: 'hs03' });
    await tapItem('dbook', '还给老师');
    HH.sfx('ding');
    await say('hs04');
    await UI.sticker('q_ontime');
    await say('hs05');
    { const p = E.toScreen(dd.x, dd.y - 150); HH.burst(p.x, p.y, 40, { kind: 'star', col: 'water', speed: 380 }); }
    dd.pose = 'happy'; await say('hs06');
    E.actors.hh.pose = 'hand'; await say('hs07'); E.actors.hh.pose = 'stand';
    // 滴滴飞出窗外，外面下起了小雨
    await E.camTo({ x: 836, y: 470, z: 1 }, 700);
    HH.sfx('whoosh');
    await E.walk('dd', 1380, 760, { free: true, speed: 1.6 });
    for (let i = 0; i < 20; i++) { dd.float += 12; dd.alpha = 1 - i / 20; await sleep(40); }
    E.remove('dd');
    for (let i = 1; i <= 20; i++) { lib.rain = i / 20; await sleep(60); }
    await say('hs09');
    await UI.petal('zhuren');
    for (const id of ['al', 'mm', 'hu', 'cm', 'bk']) E.face(id, 836);
    E.actors.hh.pose = 'jump';
    await UI.photo('s6', '小水滴的旅行');
    E.actors.hh.pose = 'stand';
    await say('end6');
  };
})();
