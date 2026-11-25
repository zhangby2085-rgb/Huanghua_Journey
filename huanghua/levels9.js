/* 黄花的生活 第五集《过大年》：第十三站 年货集市、第十四站 黄花家（大扫除、贴春联、包饺子）、第十五站 年夜饭 */
(function () {
  const HH = window.HH, D = HH.D, E = HH.E, UI = HH.UI, S = HH.S, L = HH.L;
  const say = UI.say, sleep = HH.sleep;
  const layer = HH.$('#layer');
  const INK = '#4a2e1c';
  const ico = (src, h = 11) => '<img src="' + HH.IMG + src + '" style="height:' + h + 'vh;display:block">';

  /* ---------- 年货集市 ---------- */
  const FAIR = {
    id: 'fair', bg: 'bg/fair.jpg', cam: { x: 836, y: 520, z: 1 },
    size: y => 180 + (y - 640) * .8,
    walk: [[[400, 650], [1290, 650], [1480, 930], [200, 930]]],
    drawBack(g, t) {
      if (!HH.has('stickers', 's_fair')) L.tinyStar(g, 1515, 545, .85, t);
      // 灯笼一闪一闪
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const [x, y] of [[40, 160], [105, 120], [230, 90], [330, 60], [690, 60], [1270, 40], [1390, 50], [1600, 110]]) { g.globalAlpha = .12 + .1 * Math.sin(t * 2 + x); g.fillStyle = '#ffb060'; g.beginPath(); g.arc(x, y, 40, 0, 7); g.fill(); }
      g.restore();
    },
  };
  const setFair = () => { E.load(FAIR); HH.music('title'); E.onActor = L.chat; E.onFloor = null; };
  const family = (at) => { for (const [id, p] of Object.entries(at)) E.add(id, p[0], p[1], p[2] || {}); };

  /* 13-1 买年货 */
  L.RUN.s13a = async () => {
    setFair(); UI.hudShow(true);
    family({ hh: [-100, 800], mama: [-300, 820], baba: [-480, 815] });
    await Promise.all([E.walk('hh', 800, 790, { free: true }), E.walk('mama', 600, 820, { free: true }), E.walk('baba', 1030, 815, { free: true })]);
    E.face('baba', 800); E.face('mama', 800);
    await say('n13_01');
    await say('n13_02', { hold: 0 });
    await L.pick({ list: true, listTitle: '年货清单', box: 'ecobag', items: [
      { k: 'lantern', ok: true, word: 'denglong' }, { k: 'xialian', ok: true, word: 'chunlian' }, { k: 'orange', ok: true, word: 'juzi' }, { k: 'niangao', ok: true, word: 'niangao' },
      { k: 'toycar' }, { k: 'teddy' }, { k: 'balloon' }, { k: 'lollipop' }] });
    await UI.quiz('nian', { prompt: 'n13_03' });
    await say('n13_04');
    await UI.petal('bangmang');
  };
  /* 13-2 福字倒着贴 */
  L.RUN.s13b = async () => {
    if (!E.scene || E.scene.id !== 'fair') { setFair(); family({ hh: [800, 790], mama: [600, 820], baba: [1030, 815, { flip: true }] }); }
    await say('n13_05');
    await say('n13_06', { hold: 0 });
    await new Promise(res => {
      const v = UI.el('div', 'veil'), c = UI.el('button', 'got', '<img src="' + HH.IMG + 'item/fu.webp" style="transition:transform .8s cubic-bezier(.5,-0.4,.5,1.4)"><div class="nm">点一点，倒过来</div>');
      v.appendChild(c); layer.appendChild(v);
      const hand = UI.el('div', 'hand', '👆'); hand.style.left = '55%'; hand.style.top = '55%'; v.appendChild(hand);
      c.onclick = async () => {
        c.onclick = null; hand.remove(); HH.sfx('whoosh'); c.querySelector('img').style.transform = 'rotate(180deg)';
        await sleep(900); HH.sfx('magic'); HH.burstAt(c, 30, { kind: 'star', col: 'gold' });
        c.querySelector('.nm').textContent = '福到了！';
        await say('n13_07'); v.remove(); res();
      };
      if (HH.auto) setTimeout(() => c.onclick(), 20);
    });
    await UI.quiz('fu', { prompt: 'n13_08' });
  };
  /* 13-3 不乱花钱 */
  L.RUN.s13c = async () => {
    if (!E.scene || E.scene.id !== 'fair') { setFair(); family({ hh: [800, 790], mama: [600, 820], baba: [1030, 815, { flip: true }] }); }
    const hh = E.actors.hh;
    await E.walk('hh', 1180, 760); hh.flip = false;
    for (const [k, x] of [['toycar', 1330], ['teddy', 1420], ['balloon', 1260]]) L.imgProp('toy' + k, k, x, 690, k === 'balloon' ? 70 : 90);
    E.hop('hh', 30);
    await say('n13_09');
    await say('n13_10', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: ico('item/toycar.webp'), lb: '每样都买', no: 'n13_no' }, { ic: '📝', lb: '只买需要的', ok: true }]));
    hh.flip = true;
    await say('n13_11');
    await UI.petal('bujiaohua');
    await L.peekStar('s_fair', { x: 1515, y: 530, r: 70 });
    await say('end13');
  };

  /* ---------- 黄花家的客厅（第五、六集都用） ---------- */
  const lv = L.lv5 = { night: 0, couplets: {}, fu: false, dishes: false, fire: [] };
  const DOOR = { xia: [1420, 196, 40], shang: [1598, 190, 40], heng: [1510, 138, 150], fu: [1510, 330, 100] };
  const LIVING = L.LIVING = {
    id: 'living', bg: 'bg/living.jpg', cam: { x: 836, y: 520, z: 1 },
    size: y => 200 + (y - 650) * .85,
    walk: [[[100, 775], [700, 775], [720, 640], [1360, 640], [1385, 930], [80, 930]]],
    drawBack(g, t) {
      if (lv.ep5 && !HH.has('stickers', 's_home')) L.tinyStar(g, 386, 318, .8, t);
      // 门上的春联、福字
      const c = lv.couplets;
      if (c.xia) L.drawImg(g, 'xialian', DOOR.xia[0], DOOR.xia[1] + DOOR.xia[2] * 5, DOOR.xia[2]);
      if (c.shang) L.drawImg(g, 'shanglian', DOOR.shang[0], DOOR.shang[1] + DOOR.shang[2] * 5, DOOR.shang[2]);
      if (c.heng) L.drawImg(g, 'hengpi', DOOR.heng[0], DOOR.heng[1] + DOOR.heng[2] * .28, DOOR.heng[2]);
      if (lv.fu) L.drawImg(g, 'fu', DOOR.fu[0], DOOR.fu[1] - DOOR.fu[2] / 2, DOOR.fu[2], Math.PI);
      if (lv.dishes) { L.drawImg(g, 'dish/jiaozi.webp', 545, 600, 120); L.drawImg(g, 'dish/yu.webp', 650, 612, 120); }
      // 窗外的烟花
      if (lv.night > 0) {
        g.save(); g.beginPath(); g.rect(1170, 215, 150, 215); g.clip();
        g.fillStyle = 'rgba(20,24,60,' + lv.night * .85 + ')'; g.fillRect(1170, 215, 150, 215);
        for (let i = 0; i < 3; i++) {
          const k = (t * .45 + i / 3) % 1, x = 1200 + i * 45, y = 300 - i * 20;
          g.globalAlpha = lv.night * (1 - k); g.strokeStyle = ['#ffd23f', '#ff6b9a', '#6ec6ff'][i]; g.lineWidth = 3;
          for (let j = 0; j < 10; j++) { const a = j / 10 * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(a) * k * 8, y + Math.sin(a) * k * 8); g.lineTo(x + Math.cos(a) * k * 34, y + Math.sin(a) * k * 34); g.stroke(); }
        }
        g.restore();
      }
    },
    drawFront(g, t) {
      if (lv.night > 0) {
        g.save(); g.globalAlpha = lv.night * .42; g.fillStyle = '#1b2350'; g.fillRect(0, 0, 1672, 941);
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = lv.night * .3;
        const glow = g.createRadialGradient(560, 520, 40, 560, 520, 520); glow.addColorStop(0, 'rgba(255,190,90,1)'); glow.addColorStop(1, 'rgba(255,190,90,0)');
        g.fillStyle = glow; g.fillRect(0, 0, 1672, 941); g.restore();
      }
    },
  };
  L.setLiving = (o = {}) => {
    E.load(LIVING); HH.music(o.music || 'rest'); E.onActor = L.chat; E.onFloor = null;
    lv.night = o.night ? 1 : 0; lv.ep5 = !!o.ep5;
    lv.couplets = o.decor ? { xia: 1, shang: 1, heng: 1 } : {}; lv.fu = !!o.decor; lv.dishes = !!o.dishes;
  };

  /* 14-1 大扫除：用手指擦灰尘 */
  L.RUN.s14a = async () => {
    L.setLiving({ ep5: true }); UI.hudShow(true);
    family({ hh: [800, 800], mama: [1050, 720, { flip: true }], baba: [300, 840] });
    await say('n14_01', { hold: 0 });
    const W = innerWidth, H = innerHeight, sc = Math.max(W / 1672, H / 941), ox = (W - 1672 * sc) / 2, oy = (H - 941 * sc) / 2;
    const world = [[1240, 330], [215, 270], [590, 590], [1060, 440], [1330, 470], [330, 560], [930, 780], [1500, 640]];
    const spots = world.map(([x, y]) => ({ x: (ox + x * sc) / W, y: (oy + y * sc) / H, r: .085 }));
    const bg = E.img('bg/living.jpg');
    await L.rub({
      spots, hard: 170, sfx: 'chalk',
      draw: (g, W2, H2) => { if (E.ok(bg)) { const s2 = Math.max(W2 / 1672, H2 / 941); g.drawImage(bg, (W2 - 1672 * s2) / 2, (H2 - 941 * s2) / 2, 1672 * s2, 941 * s2); } },
      dirt: (g, x, y, r, hp, t) => { L.defDirt(g, x, y, r, hp); if (hp > .5) { g.save(); g.globalAlpha = .5; g.fillStyle = '#8a7a66'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + Math.cos(t * 2 + i * 2) * r * 1.2, y - r * .9 + Math.sin(t * 3 + i) * r * .2, r * .08, 0, 7); g.fill(); } g.restore(); } },
      tool: (g, x, y, H2) => { g.save(); g.translate(x, y); g.rotate(-.3); g.fillStyle = '#6ec6ff'; g.strokeStyle = INK; g.lineWidth = 3; L.rr(g, -H2 * .07, -H2 * .05, H2 * .14, H2 * .1, H2 * .02); g.fill(); g.stroke(); g.restore(); },
    });
    HH.sfx('cheer'); E.hop('hh');
    await say('n14_02');
    await UI.petal('qinlao');
  };
  /* 14-2 贴春联 */
  L.RUN.s14b = async () => {
    if (!E.scene || E.scene.id !== 'living') { L.setLiving({ ep5: true }); family({ hh: [800, 800], mama: [1050, 720, { flip: true }], baba: [300, 840] }); }
    await Promise.all([E.walk('hh', 1250, 800), E.walk('baba', 1100, 720)]);
    E.face('hh', 1500); E.face('baba', 1500);
    await say('n14_03');
    await say('n14_04');
    await say('n14_05', { hold: 0 });
    await L.sort({
      wrong: 'n14_no',
      items: [{ k: 'shanglian', bin: 'r', label: '上联' }, { k: 'xialian', bin: 'l', label: '下联' }, { k: 'hengpi', bin: 't', label: '横批' }],
      bins: [{ k: 'l', label: '门的左边', icon: '⬅️', col: '#e85d5d' }, { k: 't', label: '门的上面', icon: '⬆️', col: '#e8a23a' }, { k: 'r', label: '门的右边', icon: '➡️', col: '#e85d5d' }],
      onRight: async it => { lv.couplets[{ shanglian: 'shang', xialian: 'xia', hengpi: 'heng' }[it.k]] = 1; HH.sfx('pop'); },
    });
    lv.fu = true; HH.sfx('magic');
    { const p = E.toScreen(1510, 240); HH.burst(p.x, p.y, 30, { kind: 'star' }); }
    await E.camTo({ x: 1350, y: 380, z: 1.5 }, 800);
    await sleep(900);
    await E.camTo({ x: 836, y: 520, z: 1 }, 700);
    await UI.sticker('q_fu');
    await UI.quiz('chun', { prompt: 'n14_06' });
  };
  /* 14-3 包饺子 */
  L.RUN.s14c = async () => {
    if (!E.scene || E.scene.id !== 'living') { L.setLiving({ ep5: true, decor: true }); family({ hh: [1250, 800], mama: [1050, 720, { flip: true }], baba: [1100, 720] }); }
    await Promise.all([E.walk('hh', 760, 800), E.walk('mama', 860, 720)]);
    E.face('hh', 860); E.face('mama', 760);
    await say('n14_07');
    await say('n14_08', { hold: 0 });
    await L.order({
      order: ['rollpin', 'filling', 'dumpling'], wrong: 'no2',
      cards: { rollpin: { label: '擀饺子皮', sound: 'whoosh' }, filling: { label: '放饺子馅', sound: 'pick' }, dumpling: { label: '捏一捏', sound: 'pop' } },
    });
    lv.dishes = true; HH.sfx('cheer'); E.hop('hh');
    await say('n14_09');
    await UI.quiz('jiao3', { prompt: 'n14_10' });
    await UI.petal('dongshou');
    await say('end14');
  };

  /* ---------- 年夜饭 ---------- */
  const dinner = () => {
    L.setLiving({ ep5: true, decor: true, dishes: true, night: true, music: 'dusk' });
    family({ hh: [760, 800, { pose: 'tangzhuang' }], mama: [960, 720, { flip: true }], baba: [1180, 700, { flip: true }] });
  };
  /* 15-1 拜年 */
  L.RUN.s15a = async () => {
    dinner(); UI.hudShow(true);
    await say('n15_01');
    E.add('nn', 1500, 760, { flip: true }); HH.sfx('bell');
    await E.walk('nn', 1000, 820, { free: true, speed: .7 }); E.face('hh', 1000);
    await say('n15_02');
    await say('n15_03', { hold: 0 });
    const left = ['n15_k1', 'n15_k2', 'n15_k3'];
    const label = { n15_k1: '新年快乐！', n15_k2: '身体健康！', n15_k3: '万事如意！' };
    while (left.length) {
      const i = await UI.acts(left.map(k => ({ t: label[k], cls: 'small' })), { autoPick: 0 });
      const k = left.splice(i, 1)[0];
      E.hop('hh', 30); await say(k, { hold: 100 });
    }
    HH.sfx('cheer');
    await say('n15_04');
    E.actors.hh.pose = 'hongbao'; HH.sfx('magic');
    await UI.petal('libao');
  };
  /* 15-2 压岁钱存起来 */
  L.RUN.s15b = async () => {
    if (!E.scene || E.scene.id !== 'living') { dinner(); E.add('nn', 1000, 820, { flip: true }); E.actors.hh.pose = 'hongbao'; }
    await say('n15_05');
    await say('n15_06', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: ico('item/piggy.webp'), lb: '存进存钱罐', ok: true }, { ic: ico('item/candy.webp'), lb: '全部买糖', no: 'n15_no' }]));
    await say('n15_07');
    await say('n15_08', { hold: 0 });
    await L.pick({ box: 'piggy', items: [{ k: 'coin1', ok: true }, { k: 'coin1', ok: true }, { k: 'coin1', ok: true }], speak: false });
    HH.sfx('ding');
    E.actors.hh.pose = 'tangzhuang';
    await UI.quiz('hong', { prompt: 'n15_09' });
    await UI.petal('cunqian');
  };
  /* 15-3 看烟花 */
  L.RUN.s15c = async () => {
    if (!E.scene || E.scene.id !== 'living') { dinner(); E.add('nn', 1000, 820, { flip: true }); }
    await say('n15_10');
    await say('n15_11', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: '🙉', lb: '站远远的，捂住耳朵', ok: true }, { ic: '🧨', lb: '凑过去看', no: 'no2' }]));
    await say('n15_12', { hold: 0 });
    await fireworks(6);
    await say('n15_13');
    await UI.petal('anquan');
    await L.peekStar('s_home', { x: 386, y: 300, r: 70 });
    E.actors.hh.pose = 'tangzhuang';
    for (const id of ['hh', 'mama', 'baba', 'nn']) E.face(id, 836);
    await UI.photo('ep5', '第五集 · 全家福');
    await say('end15');
  };
  /* 点天空放烟花：点一下，一颗烟花飞上去开花 */
  function fireworks(n) {
    return new Promise(res => {
      const rockets = [], sparks = []; let count = 0, done = false;
      const COLS = ['#ffd23f', '#ff6b9a', '#6ec6ff', '#7ee08a', '#c79bff', '#ff9f43'];
      const P = L.panel((g, P, dt) => {
        const sky = g.createLinearGradient(0, 0, 0, P.H); sky.addColorStop(0, '#0d1240'); sky.addColorStop(1, '#3a2a5e'); g.fillStyle = sky; g.fillRect(0, 0, P.W, P.H);
        g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 40; i++) { g.globalAlpha = .3 + .3 * Math.sin(P.t * 2 + i); g.fillRect((i * 97) % P.W, (i * 53) % (P.H * .5), 2, 2); } g.globalAlpha = 1;
        // 楼房剪影
        g.fillStyle = '#1a1530'; for (let i = 0; i < 9; i++) { const w = P.W / 9, h = P.H * (.16 + ((i * 37) % 10) / 60); g.fillRect(i * w, P.H - h, w - 4, h); }
        g.fillStyle = '#ffd98a'; for (let i = 0; i < 30; i++) { const x = (i * 71) % P.W, y = P.H - 10 - ((i * 29) % (P.H * .12)); g.fillRect(x, y, 6, 8); }
        // 黄花和家人捂着耳朵（远远的）
        L.drawImg(g, 'ch/huanghua_tangzhuang.webp', P.W * .12, P.H * .99, P.H * .22);
        for (const r of rockets) {
          r.t += dt; const k = Math.min(1, r.t / .7); r.x = HH.lerp(r.x0, r.tx, k); r.y = HH.lerp(P.H, r.ty, 1 - (1 - k) * (1 - k));
          g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(r.x, r.y, 4, 0, 7); g.fill();
          if (k >= 1 && !r.boom) {
            r.boom = true; HH.sfx('goal');
            const col = HH.pick(COLS), col2 = HH.pick(COLS);
            for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, sp = 140 + (i % 3) * 70; sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 1.4, c: i % 2 ? col : col2 }); }
          }
        }
        for (let i = rockets.length - 1; i >= 0; i--) if (rockets[i].boom) rockets.splice(i, 1);
        for (const s of sparks) { s.t += dt; s.vy += 60 * dt; s.vx *= 1 - dt; s.vy *= 1 - dt * .6; s.x += s.vx * dt; s.y += s.vy * dt; g.globalAlpha = Math.max(0, 1 - s.t / s.life); g.fillStyle = s.c; g.beginPath(); g.arc(s.x, s.y, 3.2, 0, 7); g.fill(); }
        g.globalAlpha = 1;
        for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].t > sparks[i].life) sparks.splice(i, 1);
        g.fillStyle = '#fff'; g.font = 'bold ' + Math.round(P.H * .06) + 'px WK, sans-serif'; g.textAlign = 'right'; g.fillText('🎆 ' + count + ' / ' + n, P.W - 20, P.H * .1);
      }, {
        tap: (x, y) => {
          if (done) return;
          rockets.push({ x0: x + (Math.random() - .5) * 80, tx: x, ty: Math.min(y, P.H * .7), t: 0 }); HH.sfx('whoosh'); count++;
          if (count >= n) { done = true; setTimeout(() => { P.close(); res(); }, HH.fast ? 10 : 2200); }
        },
      });
      const hand = UI.el('div', 'hand', '👆'); hand.style.left = '50%'; hand.style.top = '35%'; layer.appendChild(hand);
      setTimeout(() => hand.remove(), 2500);
      if (HH.auto) setTimeout(() => { done = true; P.close(); hand.remove(); res(); }, 30);
    });
  }

  Object.assign(L.STAGES, {
    13: { ep: 5, name: '年货集市', title: '第十三站 · 年货集市', bg: 'bg/fair.jpg' },
    14: { ep: 5, name: '黄花家', title: '第十四站 · 黄花家', bg: 'bg/living.jpg' },
    15: { ep: 5, name: '年夜饭', title: '第十五站 · 年夜饭', bg: 'bg/living.jpg' },
  });
  L.EPS[5] = { name: '过大年', title: '第五集 · 过大年', first: 's13a' };
  L.LIST.push({ id: 's13a', st: 13, name: '买年货' }, { id: 's13b', st: 13, name: '福到了' }, { id: 's13c', st: 13, name: '不乱花钱' },
    { id: 's14a', st: 14, name: '大扫除' }, { id: 's14b', st: 14, name: '贴春联' }, { id: 's14c', st: 14, name: '包饺子' },
    { id: 's15a', st: 15, name: '给奶奶拜年' }, { id: 's15b', st: 15, name: '压岁钱' }, { id: 's15c', st: 15, name: '看烟花' });
})();
