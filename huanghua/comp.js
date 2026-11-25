/* 黄花的生活：第三~六集共用的小游戏组件（都是盖在场景上面的一层） */
(function () {
  const HH = window.HH, D = HH.D, E = HH.E, UI = HH.UI, S = HH.S, L = HH.L;
  const say = UI.say, sleep = HH.sleep;
  const layer = HH.$('#layer');
  const el = UI.el;
  const IMG = HH.IMG;
  const item = k => IMG + (k.includes('/') ? k : 'item/' + k + '.webp');
  L.itemSrc = item;
  const wait = ms => sleep(ms);
  const INK = '#4a2e1c';
  const shake = b => { b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); };
  const flyTo = (b, target) => {
    const r = b.getBoundingClientRect(), t = target.getBoundingClientRect();
    b.style.transition = 'transform .45s, opacity .45s';
    b.style.transform = 'translate(' + (t.left + t.width / 2 - r.left - r.width / 2) + 'px,' + (t.top + t.height / 2 - r.top - r.height / 2) + 'px) scale(.4)'; b.style.opacity = '0';
  };

  /* 站在场景里的人（一排排好） */
  L.cast = (spots) => { for (const [id, p] of Object.entries(spots)) E.add(id, p[0], p[1], p[2] || {}); };

  /* ---------- 点一点，装进去（买东西、装书包、早餐盘……） ----------
     o.items: [{k, ok, word?, no?}]  o.list: 显示"清单"（对的那些东西的拼音）  o.box: 容器图片 key（不给就是一个盘子） */
  L.pick = o => new Promise(res => {
    const easy = S.set.level === 'easy';
    const v = el('div', 'veil pk'), pnl = el('div', 'pk-panel'); v.appendChild(pnl); layer.appendChild(v);
    const good = o.items.filter(i => i.ok);
    if (o.list) {
      const ls = el('div', 'pk-list', '<div class="pk-h">' + (o.listTitle || '清单') + '</div>');
      for (const it of good) {
        const w = D.words[it.word || it.k], li = el('button', 'pk-li', '<span class="py">' + w.py + '</span>' + (easy ? '<span class="hz">' + w.ch + '</span>' : ''));
        li.dataset.k = it.k; li.onclick = () => HH.voice('w_' + (it.word || it.k)); ls.appendChild(li);
      }
      pnl.appendChild(ls);
    }
    const grid = el('div', 'pk-grid'); pnl.appendChild(grid);
    const box = el('div', 'pk-box' + (o.box ? '' : ' plate'), o.box ? '<img src="' + item(o.box) + '">' : ''); pnl.appendChild(box);
    const got = el('div', 'pk-got'); box.appendChild(got);
    let left = good.length, busy = false;
    const btns = HH.shuffle(o.items.slice()).map(it => {
      const b = el('button', 'pk-it', '<img src="' + item(it.img || it.k) + '">' + (o.labels && D.words[it.word || it.k] ? '<span>' + D.words[it.word || it.k].py + '</span>' : ''));
      b.it = it;
      b.onclick = async () => {
        if (busy || b.disabled) return;
        const w = it.word || (D.words[it.k] ? it.k : null);
        if (it.ok) {
          busy = true; b.disabled = true; HH.sfx('pick'); HH.burstAt(b, 14, { kind: 'star' });
          flyTo(b, box);
          if (o.list) { const li = pnl.querySelector('.pk-li[data-k="' + it.k + '"]'); if (li) li.classList.add('done'); }
          if (w && o.speak !== false) HH.voice('w_' + w);
          await wait(450); b.style.visibility = 'hidden';
          const gi = el('img'); gi.src = item(it.img || it.k); got.appendChild(gi);
          if (it.line) await say(it.line, { hold: 60 });
          left--; busy = false;
          if (left <= 0) { await wait(700); v.remove(); res(); }
        } else {
          busy = true; HH.sfx('wrong'); shake(b);
          if (w && o.speak !== false) await HH.voice('w_' + w);
          await say(it.no || o.wrong || 'no2', { hold: 40 }); busy = false;
        }
      };
      grid.appendChild(b); return b;
    });
    if (HH.auto) (async () => { await wait(30); for (const b of btns) if (b.it.ok) { await b.onclick(); await wait(20); } })();
  });

  /* ---------- 按顺序点（o.order 唯一顺序；或者 o.deps：{东西: [要先做的]}，顺序就可以不止一种） ---------- */
  L.order = o => new Promise(res => {
    const v = el('div', 'veil pk'), pnl = el('div', 'pk-panel col'), grid = el('div', 'pk-grid'), row = el('div', 'pk-row');
    if (o.title) pnl.appendChild(el('div', 'pk-h', o.title));
    pnl.appendChild(row); pnl.appendChild(grid); v.appendChild(pnl); layer.appendChild(v);
    let i = 0, busy = false; const done = new Set();
    o.order.forEach((k, j) => row.appendChild(el('div', 'pk-slot', '<b>' + (j + 1) + '</b>')));
    v.dataset.order = o.order.join(',');   // 录演示视频的脚本用
    const ok = k => o.deps ? !done.has(k) && (o.deps[k] || []).every(d => done.has(d)) : k === o.order[i];
    const btns = HH.shuffle(o.order.slice()).map(k => {
      const c = o.cards && o.cards[k] || {};
      const b = el('button', 'pk-it', '<img src="' + item(c.img || k) + '">' + (c.label ? '<span>' + c.label + '</span>' : ''));
      b.k = k; b.dataset.k = k;
      b.onclick = async () => {
        if (busy || b.disabled) return;
        if (ok(k)) {
          b.disabled = true; HH.sfx('right'); HH.burstAt(b, 12, { kind: 'star' });
          const s = row.children[i]; const gi = el('img'); gi.src = item(c.img || k); s.appendChild(gi); s.classList.add('on');
          b.style.visibility = 'hidden'; i++; done.add(k);
          busy = true;
          if (c.sound) HH.sfx(c.sound);
          if (o.onStep) await o.onStep(k, i);
          if (c.line) await say(c.line, { hold: 40 });
          busy = false;
          if (i >= o.order.length) { await wait(600); v.remove(); res(); }
        } else { busy = true; HH.sfx('wrong'); shake(b); await say(o.wrong || 'no2', { hold: 40 }); busy = false; }
      };
      grid.appendChild(b); return b;
    });
    if (HH.auto) (async () => { for (const k of o.order) { await wait(30); const b = btns.find(x => x.k === k); await b.onclick(); } })();
  });

  /* ---------- 按住蓄力（挤牙膏、吹气球） ----------
     o.label 按钮字；o.speed 每秒涨多少；o.lo/o.hi 合格范围；o.draw(g,W,H,v,t,st) 画东西；o.cycles 吹气球的次数（松手就放气） */
  L.hold = o => new Promise(res => {
    const st = L.curHold = { v: 0, hold: false, n: 0, done: false };
    const pnl = L.panel((g, P, dt) => {
      if (st.hold) st.v = Math.min(1.25, st.v + dt * (o.speed || .45));
      else if (o.cycles) st.v = Math.max(0, st.v - dt * .45);
      g.fillStyle = o.bgcol || 'rgba(60,35,20,.5)'; g.fillRect(0, 0, P.W, P.H);
      o.draw(g, P.W, P.H, st.v, P.t, st);
    });
    const wrap = el('div', 'acts'), b = el('button', 'act green', o.label); wrap.appendChild(b); layer.appendChild(wrap);
    const finish = async () => { if (st.done) return; st.done = true; wrap.remove(); await wait(500); pnl.close(); res(st.v); };
    let checking = false;
    b.addEventListener('pointerdown', e => { e.preventDefault(); if (checking || st.done) return; st.hold = true; HH.sfx('pick'); try { b.setPointerCapture(e.pointerId); } catch (er) { } });
    const up = async () => {
      if (!st.hold) return; st.hold = false;
      if (o.cycles) { if (st.v > .7) { st.n++; HH.sfx('ding'); if (o.onCycle) o.onCycle(st.n); if (st.n >= o.cycles) finish(); } return; }
      if (o.check) { checking = true; const r = await o.check(st.v, st); checking = false; if (r) finish(); }
    };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
    if (HH.auto) (async () => { await wait(30); for (let k = 0; k < (o.cycles || 1); k++) { st.v = o.cycles ? .9 : (o.lo + o.hi) / 2; st.hold = true; await up(); await wait(30); } finish(); })();
  });

  /* ---------- 擦一擦 / 刷一刷 ----------
     o.spots: [{x,y,r,dir}] 比例坐标（x 按宽、y 和 r 按高）；dir: 'down' | 'up' | 'side' | 没有
     o.draw(g,W,H,st,t) 画背景；o.dirt(g,x,y,r,hp,t,s) 画脏东西；o.arrows 显示方向箭头 */
  L.rub = o => new Promise(res => {
    const st = L.curRub = { spots: o.spots.map(s => Object.assign({ hp: 1 }, s)), last: null, done: false, warned: false };
    const pnl = L.panel((g, P) => {
      if (o.draw) o.draw(g, P.W, P.H, st, P.t);
      for (const s of st.spots) if (s.hp > 0) (o.dirt || defDirt)(g, s.x * P.W, s.y * P.H, s.r * P.H, s.hp, P.t, s);
      if (o.arrows) for (const s of st.spots) if (s.hp > 0 && s.dir) arrow(g, s.x * P.W, s.y * P.H, s.r * P.H, s.dir, P.t);
      if (o.tool && st.last) o.tool(g, st.last.x, st.last.y, P.H, P.t);
    }, {
      down: (x, y) => { st.last = { x, y }; },
      move: (x, y) => {
        if (!st.last || st.done) return;
        const dx = x - st.last.x, dy = y - st.last.y, d = Math.hypot(dx, dy); st.last = { x, y };
        if (d < 2) return;
        for (const s of st.spots) {
          if (s.hp <= 0) continue;
          const sx = s.x * pnl.W, sy = s.y * pnl.H, r = s.r * pnl.H;
          if (Math.hypot(x - sx, y - sy) > r * 1.6) continue;
          const good = !s.dir || (s.dir === 'down' ? dy > Math.abs(dx) * .4 : s.dir === 'up' ? -dy > Math.abs(dx) * .4 : Math.abs(dx) > Math.abs(dy) * .4);
          if (!good) { if (!st.warned && o.wrongDir) { st.warned = true; say(o.wrongDir, { hold: 0 }); setTimeout(() => st.warned = false, 5000); } continue; }
          s.hp -= d / (o.hard || 260);
          if (Math.random() < .2) HH.sfx(o.sfx || 'chalk');
          if (Math.random() < .3) HH.burst(x, y, 2, { col: o.col || 'chalk', speed: 60, size: 5 });
          if (s.hp <= 0) { HH.sfx('pop'); HH.burst(sx, sy, 12, { kind: 'star', speed: 160 }); if (o.onClean) o.onClean(s, st.spots.filter(q => q.hp <= 0).length); }
        }
        if (st.spots.every(s => s.hp <= 0)) finish();
      },
      up: () => { st.last = null; },
    });
    const finish = async () => { if (st.done) return; st.done = true; HH.sfx('magic'); await wait(800); pnl.close(); res(); };
    if (HH.auto) setTimeout(() => { for (const s of st.spots) s.hp = 0; finish(); }, 30);
  });
  function defDirt(g, x, y, r, hp) {
    g.save(); g.globalAlpha = Math.min(1, hp * 1.4); g.fillStyle = '#b39a7a';
    g.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, rr = r * (.75 + .25 * Math.sin(i * 2.7)); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8); } g.closePath(); g.fill();
    g.fillStyle = 'rgba(140,115,85,.8)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + Math.cos(i * 1.3) * r * .45, y + Math.sin(i * 2.1) * r * .35, r * .12, 0, 7); g.fill(); }
    g.restore();
  }
  L.defDirt = defDirt;
  function arrow(g, x, y, r, dir, t) {
    const k = (t * 1.4) % 1;
    g.save(); g.globalAlpha = .9 * (1 - k * .5); g.strokeStyle = '#ffd23f'; g.fillStyle = '#ffd23f'; g.lineWidth = r * .16; g.lineCap = 'round';
    g.shadowColor = 'rgba(74,46,28,.6)'; g.shadowBlur = 4;
    if (dir === 'side') {
      const x0 = x - r * .8 + r * .3 * Math.sin(t * 6);
      g.beginPath(); g.moveTo(x0, y + r * 1.1); g.lineTo(x0 + r * 1.6, y + r * 1.1); g.stroke();
      for (const s of [-1, 1]) { const xe = s < 0 ? x0 : x0 + r * 1.6; g.beginPath(); g.moveTo(xe - s * r * .25, y + r * .85); g.lineTo(xe + s * r * .05, y + r * 1.1); g.lineTo(xe - s * r * .25, y + r * 1.35); g.fill(); }
    } else {
      const a = dir === 'down' ? 1 : -1, y0 = y - a * r * .9 + a * r * .5 * k, y1 = y0 + a * r * 1.1, xx = x + r * 1.15;
      g.beginPath(); g.moveTo(xx, y0); g.lineTo(xx, y1); g.stroke();
      g.beginPath(); g.moveTo(xx - r * .3, y1 - a * r * .25); g.lineTo(xx, y1 + a * r * .1); g.lineTo(xx + r * .3, y1 - a * r * .25); g.fill();
    }
    g.restore();
  }

  /* ---------- 打地鼠（蛀虫小怪、烟花） ----------  o.n 一共几个；o.spawn(i) → {x,y} 比例坐标；o.draw 背景；o.mon 画小怪 */
  L.whack = o => new Promise(res => {
    const st = L.curWhack = { mons: [], hit: 0, next: .4, done: false };
    const live = () => st.mons.filter(m => !m.dead);
    const pnl = L.panel((g, P, dt) => {
      if (o.draw) o.draw(g, P.W, P.H, P.t, st);
      st.next -= dt;
      if (!st.done && st.hit + live().length < o.n && st.next <= 0 && live().length < (o.max || 2)) {
        const p = o.spawn(st.mons.length); st.mons.push(Object.assign({ t: 0, life: o.life || 3, dead: false, ph: Math.random() * 6 }, p)); st.next = o.gap || .8;
      }
      for (const m of st.mons) {
        m.t += dt;
        if (!m.dead && m.t > m.life) { m.dead = true; m.gone = true; }
        if (m.gone) continue;
        if (m.dead && m.t - m.boomT > 1) { m.gone = true; continue; }
        (o.mon || L.bug)(g, m.x * P.W, m.y * P.H, P.H * (o.size || .07), P.t, m);
      }
      st.mons = st.mons.filter(m => !m.gone);
    }, {
      tap: (x, y) => {
        if (st.done) return;
        for (const m of st.mons) {
          if (m.dead) continue;
          if (Math.hypot(x - m.x * pnl.W, y - m.y * pnl.H) < pnl.H * (o.hitR || .1)) {
            m.dead = true; m.boomT = m.t; st.hit++; HH.sfx(o.sfx || 'pop'); HH.buzz(20);
            HH.burst(x, y, o.burstN || 16, o.burst || { kind: 'star' });
            if (o.onHit) o.onHit(m, st.hit);
            if (st.hit >= o.n) finish();
            return;
          }
        }
        if (o.onTapEmpty) o.onTapEmpty(x / pnl.W, y / pnl.H, st);
      },
    });
    const finish = async () => { if (st.done) return; st.done = true; await wait(1100); pnl.close(); res(); };
    if (HH.auto) setTimeout(() => { st.hit = o.n; finish(); }, 30);
  });
  /* 蛀虫小怪：紫色的小团子，两根触角，一张坏笑的脸；m.dead 以后翻白眼飞走 */
  L.bug = (g, x, y, r, t, m = {}) => {
    const k = m.dead ? HH.clamp((m.t - m.boomT) / .8, 0, 1) : 0, pop = m.t != null ? Math.min(1, m.t * 5) : 1;
    g.save(); g.translate(x + (m.dead ? k * r * 3 : 0), y - (m.dead ? k * r * 5 : 0)); g.rotate(m.dead ? k * 4 : Math.sin(t * 6 + (m.ph || 0)) * .12);
    g.scale(pop, pop); g.globalAlpha = (m.alpha != null ? m.alpha : 1) * (1 - k);
    g.strokeStyle = INK; g.lineWidth = r * .1; g.lineCap = 'round';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * r * .3, -r * .8); g.quadraticCurveTo(s * r * .6, -r * 1.5, s * r * .8, -r * 1.35); g.stroke(); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(s * r * .8, -r * 1.35, r * .16, 0, 7); g.fill(); g.stroke(); }
    g.fillStyle = m.col || '#8d5bd1'; g.beginPath(); g.ellipse(0, 0, r, r * .9, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-r * .35, -r * .4, r * .25, r * .15, -.5, 0, 7); g.fill();
    g.fillStyle = '#fff'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * r * .35, -r * .1, r * .24, r * .28, 0, 0, 7); g.fill(); g.stroke(); }
    g.fillStyle = INK; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * r * .35 + (m.dead ? 0 : Math.sin(t * 3) * r * .06), m.dead ? -r * .25 : -r * .05, r * .11, 0, 7); g.fill(); }
    g.beginPath(); g.moveTo(-r * .55, -r * .45); g.lineTo(-r * .15, -r * .32); g.moveTo(r * .55, -r * .45); g.lineTo(r * .15, -r * .32); g.stroke();
    g.beginPath(); if (m.dead) g.arc(0, r * .45, r * .18, 0, 7); else { g.moveTo(-r * .3, r * .35); g.quadraticCurveTo(0, r * .6, r * .3, r * .35); } g.stroke();
    if (!m.dead) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-r * .12, r * .4); g.lineTo(-r * .04, r * .56); g.lineTo(r * .02, r * .42); g.fill(); }
    g.restore();
  };

  /* ---------- 分类：先点东西，再点它该去的地方 ----------  o.items [{k, bin, img?, label?}]  o.bins [{k, label, icon, col}] */
  L.sort = o => new Promise(res => {
    const v = el('div', 'veil pk'), pnl = el('div', 'pk-panel col'), grid = el('div', 'pk-grid'), bins = el('div', 'pk-bins');
    if (o.title) pnl.appendChild(el('div', 'pk-h', o.title));
    pnl.appendChild(grid); pnl.appendChild(bins); v.appendChild(pnl); layer.appendChild(v);
    let sel = null, left = o.items.length, busy = false;
    const items = HH.shuffle(o.items.slice()).map(it => {
      const b = el('button', 'pk-it', (it.html || '<img src="' + item(it.img || it.k) + '">') + (it.label ? '<span>' + it.label + '</span>' : ''));
      b.dataset.bin = it.bin;
      b.onclick = () => { if (busy || b.disabled) return; HH.sfx('click'); if (sel) sel.b.classList.remove('sel'); sel = { it, b }; b.classList.add('sel'); };
      grid.appendChild(b); return { it, b };
    });
    const binEls = o.bins.map(bn => {
      const b = el('button', 'pk-bin', (bn.html || (bn.icon ? '<i>' + bn.icon + '</i>' : '')) + '<span>' + bn.label + '</span>'); if (bn.col) b.style.background = bn.col;
      b.dataset.k = bn.k;
      b.onclick = async () => {
        if (busy || !sel) return;
        const s = sel;
        if (s.it.bin === bn.k) {
          HH.sfx('right'); HH.burstAt(b, 14, { kind: 'star' }); s.b.disabled = true; flyTo(s.b, b); sel = null; left--;
          busy = true; await wait(450); s.b.style.visibility = 'hidden';
          if (o.onRight) await o.onRight(s.it, bn.k);
          busy = false;
          if (left <= 0) { await wait(500); v.remove(); res(); }
        } else { busy = true; HH.sfx('wrong'); shake(s.b); await say(s.it.no || o.wrong || 'no2', { hold: 40 }); busy = false; }
      };
      bins.appendChild(b); return b;
    });
    if (HH.auto) (async () => { await wait(30); for (const x of items) { x.b.onclick(); await binEls[o.bins.findIndex(bn => bn.k === x.it.bin)].onclick(); await wait(20); } })();
  });

  /* ---------- 帮小伙伴排队：点谁，谁就走到下一个位置 ---------- */
  L.queueUp = (ids, slots, o = {}) => new Promise(res => {
    let n = 0;
    for (const id of ids) {
      const a = E.actors[id];
      E.hs({ id: 'qq_' + id, always: true, walk: false, prio: 4, get x() { return a.x; }, get y() { return a.y - a.h * .5; }, w: 200, h: 380, sparkle: true, get sx() { return a.x; }, get sy() { return a.y - a.h - 20; },
        on: async () => {
          E.unhs('qq_' + id); const s = slots[n++]; HH.sfx('pick');
          await E.walk(id, s[0], s[1], { free: true }); if (s[2] != null) a.flip = s[2];
          if (n === ids.length) res();
        } });
    }
    if (HH.auto) (async () => { for (const id of ids) await E.tapHot('qq_' + id); })();
  });

  /* ---------- 摆一个大图在屏幕中间，点一下就收走 ---------- */
  L.tapBig = (src, label) => new Promise(res => {
    const v = el('div', 'veil'), c = el('button', 'got', '<img src="' + item(src) + '">' + (label ? '<div class="nm">' + label + '</div>' : ''));
    v.appendChild(c); layer.appendChild(v);
    const hand = el('div', 'hand', '👆'); hand.style.left = '55%'; hand.style.top = '58%'; v.appendChild(hand);
    c.onclick = async () => { c.onclick = null; hand.remove(); HH.sfx('whoosh'); c.style.transition = 'transform .45s, opacity .45s'; c.style.transform = 'scale(.3) rotate(-12deg)'; c.style.opacity = '0'; await wait(450); v.remove(); res(); };
    if (HH.auto) setTimeout(() => c.onclick(), 30);
  });

  /* 画一张图（item 或 ch），宽 w，底部中心在 x,y */
  L.drawImg = (g, src, x, y, w, rot = 0, alpha = 1) => {
    const im = E.img(src.includes('/') ? src : 'item/' + src + '.webp'); if (!E.ok(im)) return 0;
    const h = w * E.ih(im) / E.iw(im);
    g.save(); g.globalAlpha *= alpha; g.translate(x, y); g.rotate(rot); g.drawImage(im, -w / 2, -h, w, h); g.restore(); return h;
  };
  /* 场景里的一张图片道具 */
  L.imgProp = (id, src, x, y, w, o = {}) => E.prop(Object.assign({ id, x, y, w, z: 0, rot: 0, a: 1, draw(g) { L.drawImg(g, src, this.x, this.y - this.z, this.w, this.rot, this.a); } }, o));

  /* ---------- 藏起来的小彩蛋：小牙牙（第三集）、小星星（第四~六集） ---------- */
  L.tinyTooth = (g, x, y, s = 1, t = 0) => {
    const im = E.img('ch/yaya_happy.webp'); if (!E.ok(im)) return;
    const h = 44 * s, w = h * E.iw(im) / E.ih(im);
    g.save(); g.globalAlpha = .9 + .1 * Math.sin(t * 4); g.drawImage(im, x - w / 2, y - h + Math.sin(t * 3) * 2, w, h);
    g.globalAlpha = .5 + .5 * Math.sin(t * 5); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + w * .45, y - h * .95, 4, 0, 7); g.fill(); g.restore();
  };
  L.tinyStar = (g, x, y, s = 1, t = 0) => {
    const r = 16 * s * (1 + .15 * Math.sin(t * 4));
    g.save(); g.translate(x, y); g.rotate(Math.sin(t * 1.5) * .3); g.fillStyle = '#ffd23f'; g.strokeStyle = INK; g.lineWidth = 3;
    g.beginPath(); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5 - Math.PI / 2, rr = j % 2 ? r * .45 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke();
    g.globalAlpha = .5 + .5 * Math.sin(t * 5); g.fillStyle = '#fff'; g.beginPath(); g.arc(r * .7, -r * .8, 3, 0, 7); g.fill(); g.restore();
  };
  /* 找彩蛋：说提示，等着点；找不到点"继续" */
  L.peekAt = async (id, h, pkLine, gotLine) => {
    if (HH.has('stickers', id)) return;
    let peekDone = null;
    E.hs(Object.assign({ id: 'pk_' + id, always: true, walk: false, prio: 3, sparkle: false, on: async () => { E.unhs('pk_' + id); HH.$$('.acts').forEach(n => n.remove()); peekDone && peekDone(); await UI.sticker(id, gotLine); } }, h));
    await say(pkLine, { hold: 0 });
    await new Promise(r => { peekDone = r; UI.acts([{ t: '继续 ▶', cls: 'small' }]).then(r); if (HH.auto) setTimeout(r, 20); });
    E.unhs('pk_' + id); await wait(200);
  };
  L.peekTooth = (id, h) => L.peekAt(id, h, 'pk3', 'st_tooth');
  L.peekStar = (id, h) => L.peekAt(id, h, 'pk4', 'st_star');

  /* 新角色出场：变大、冒星星 */
  L.popIn = async (id, x, y, o = {}) => {
    const a = E.add(id, x, y, Object.assign({ alpha: 0, scale: .2 }, o));
    HH.sfx('magic'); HH.buzz(40);
    { const p = E.toScreen(x, y - (o.float || 0) - 80); HH.burst(p.x, p.y, 40, { kind: 'star', col: o.col || 'gold', speed: 380 }); }
    for (let i = 1; i <= 14; i++) { a.alpha = i / 14; a.scale = .2 + .8 * HH.ease(i / 14) + (i === 11 ? .1 : 0); await sleep(30); }
    a.scale = 1; return a;
  };
  /* 夜晚：整个场景暗下来（k 0~1） */
  L.night = (g, k, w = 1672, h = 941) => { if (k <= 0) return; g.save(); g.globalAlpha = k * .55; g.fillStyle = '#1b2350'; g.fillRect(0, 0, w, h); g.restore(); };
  L.moon = (g, x, y, r) => {
    g.save(); g.translate(x, y);
    const glow = g.createRadialGradient(0, 0, r * .6, 0, 0, r * 2.6); glow.addColorStop(0, 'rgba(255,240,170,.55)'); glow.addColorStop(1, 'rgba(255,240,170,0)');
    g.fillStyle = glow; g.beginPath(); g.arc(0, 0, r * 2.6, 0, 7); g.fill();
    g.fillStyle = '#ffe680'; g.strokeStyle = '#c79a2a'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r, Math.PI * .3, Math.PI * 1.7); g.arc(r * .45, 0, r * .8, Math.PI * 1.55, Math.PI * .45, true); g.closePath(); g.fill(); g.stroke();
    g.restore();
  };
})();
