/* 黄花的生活：界面 —— 对话气泡、旁白、拼音卡片、按钮、物品、花瓣、贴纸、照片、小包 */
(function () {
  const HH = window.HH, D = HH.D, E = HH.E, S = HH.S;
  const UI = HH.UI = {};
  const layer = HH.$('#layer');
  const el = (tag, cls, html) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; };
  UI.el = el;

  /* ---------- 对话 ---------- */
  let bubbles = [];
  /* 气泡放在说话的角色头顶；放不下就放到左下角。
     尺寸用 offsetWidth/offsetHeight（不受弹出动画的缩放影响），而且一个气泡决定了放哪边就不再来回换——
     以前用 getBoundingClientRect，弹出动画那 0.2 秒里尺寸在变，气泡在头顶和左下角之间来回跳，看起来在闪。 */
  function placeBubble(b) {
    const a = E.actors[b.who];
    const r = { width: b.node.offsetWidth, height: b.node.offsetHeight }, { W, H } = E.size();
    let side = !a || !a.vis || UI.forceSide;
    let x = 0, y = 0, hx = 0;
    if (!side) {
      const hd = a.head(), p = E.toScreen(hd.x, hd.y);
      hx = p.x; x = HH.clamp(p.x, r.width / 2 + 12, W - r.width / 2 - 12); y = p.y - H * .03;
      const off = p.x < -20 || p.x > W + 20 || p.y > H;
      if (b.side === undefined) b.side = off || y - r.height < 4;
      else if (!b.side && (off || y - r.height < -H * .15)) b.side = true;
      side = b.side;
      if (!side && y > H * .62) y = H * .62;
      if (!side && y - r.height < 4) y = r.height + 4;
    }
    if (b.lastSide !== side) { b.node.classList.toggle('side', side); b.lastSide = side; }
    if (side) { x = Math.max(r.width / 2 + 20, W * .3); y = H - H * .06; }
    b.node.style.left = x + 'px'; b.node.style.top = y + 'px';
    if (!side) b.node.style.setProperty('--tail', HH.clamp(hx - (x - r.width / 2), 30, r.width - 30) + 'px');
  }
  E.frameHooks.push(() => bubbles.forEach(placeBubble));
  UI.say = async (id, o = {}) => {
    const l = D.lines[id]; if (!l) { HH.log('no line', id); return; }
    const [who, text] = l;
    let node;
    if (who === 'n') {
      node = el('div', 'narr', HH.rich(text));
      layer.appendChild(node);
    } else {
      node = el('div', 'bubble', '<span class="who">' + D.names[who] + '</span>' + HH.rich(text) + '<i class="face"></i>');
      const c = E.CH[who]; node.style.setProperty('--c', c.c);
      node.querySelector('.face').style.backgroundImage = 'url(' + HH.IMG + c.img + ')';
      layer.appendChild(node);
      const b = { who, node }; bubbles.push(b); placeBubble(b);
      const a = E.actors[who]; if (a && !o.still) { a.sq = -.06; }
    }
    HH.mark('say ' + id);
    await HH.voice(id);
    await HH.sleep(o.hold != null ? o.hold : 260);
    node.remove(); bubbles = bubbles.filter(b => b.node !== node);
  };
  UI.says = async (...ids) => { for (const id of ids) await UI.say(id); };
  UI.clearSay = () => { HH.hush(); HH.$$('#layer .bubble, #layer .narr').forEach(n => n.remove()); bubbles = []; };

  /* ---------- 提示条、手指 ---------- */
  UI.pill = (html, onEar) => {
    UI.unpill();
    const p = el('div', 'pill', html); p.id = 'pill';
    if (onEar) { const b = el('button', '', '🔊'); b.onclick = e => { e.stopPropagation(); onEar(); }; p.appendChild(b); }
    layer.appendChild(p); return p;
  };
  UI.unpill = () => { const p = HH.$('#pill'); if (p) p.remove(); };
  /* 屏幕上的小手；wx, wy 是世界坐标，每帧跟着镜头走 */
  UI.hand = (wx, wy, cls = '') => {
    const h = el('div', 'hand ' + cls, '👆'); layer.appendChild(h);
    const f = () => { const p = E.toScreen(wx, wy); h.style.left = p.x + 'px'; h.style.top = p.y + 'px'; };
    f(); E.frameHooks.push(f);
    h.kill = () => { if (h.dead) return; h.dead = true; h.remove(); const i = E.frameHooks.indexOf(f); if (i >= 0) E.frameHooks.splice(i, 1); };
    return h;
  };

  /* ---------- 拼音卡片 ---------- */
  const lv = () => S.set.level;
  UI.cardHTML = (key, showHz) => {
    const w = D.words[key];
    return '<span class="py">' + w.py + '</span>' + (showHz ? '<span class="hz">' + w.ch + '</span>' : '');
  };
  /* 选拼音：key 是对的那个；opts 不给就按难度挑一个干扰项。返回 Promise（选对了才结束） */
  UI.quiz = async (key, o = {}) => {
    const w = D.words[key];
    UI.cur = key;
    let opts = o.opts;
    if (!opts) { const d = lv() === 'adv' ? (w.adv || w.std) : w.std; opts = HH.shuffle([key, d]); }
    const wrap = el('div', 'cards'); layer.appendChild(wrap);
    const prompt = o.prompt || ('q_' + key);
    const pill = UI.pill('<span>听一听</span>' + (lv() === 'easy' ? '<span class="py">' + w.py + '</span>' : ''), () => HH.voice(prompt));
    let tries = 0, done;
    const fin = new Promise(r => { done = r; });
    const cards = opts.map(k => {
      const c = el('button', 'card', UI.cardHTML(k, lv() === 'easy'));
      c.onclick = async () => {
        if (c.disabled) return;
        if (k === key) {
          cards.forEach(x => x.disabled = true);
          HH.sfx('right'); HH.burstAt(c, 26, { kind: 'star' }); HH.buzz(30);
          c.classList.add('glow');
          await HH.voice('w_' + key);
          if (o.okLine !== false) await UI.say(o.okLine || HH.pick(['ok1', 'ok2', 'ok3', 'ok4']), { hold: 80 });
          wrap.remove(); UI.unpill();
          done(c);
        } else {
          tries++; HH.sfx('wrong'); c.classList.remove('wrong'); void c.offsetWidth; c.classList.add('wrong');
          await HH.voice('w_' + k);
          await UI.say(HH.pick(['no1', 'no2', 'no3']), { hold: 60 });
          if (tries >= 2) { cards[opts.indexOf(key)].classList.add('glow'); await UI.say('hint', { hold: 40 }); }
          else await HH.voice(prompt);
        }
      };
      wrap.appendChild(c); return c;
    });
    await HH.voice(prompt);
    if (HH.auto) setTimeout(() => cards[opts.indexOf(key)].click(), 20);
    return fin;
  };
  /* 一排卡片，按顺序选（锁链用）：onRight(i, cardEl) 在每次选对后调用 */
  UI.quizSeq = async (keys, o = {}) => {
    const wrap = el('div', 'cards'); layer.appendChild(wrap);
    const order = HH.shuffle(keys.slice());
    const cards = {};
    for (const k of order) { const c = el('button', 'card', UI.cardHTML(k, lv() === 'easy')); c.dataset.k = k; wrap.appendChild(c); cards[k] = c; }
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i], prompt = 'q_' + key;
      UI.cur = key;
      if (o.onTarget) o.onTarget(i);
      UI.pill('<span>听一听</span>' + (lv() === 'easy' ? '<span class="py">' + D.words[key].py + '</span>' : ''), () => HH.voice(prompt));
      let tries = 0;
      await HH.voice(prompt);
      await new Promise(res => {
        for (const [k, c] of Object.entries(cards)) {
          c.onclick = async () => {
            if (c.disabled || c.busy) return;
            if (k === key) {
              Object.values(cards).forEach(x => x.onclick = null);
              HH.sfx('right'); HH.burstAt(c, 24, { kind: 'star' }); HH.buzz(30);
              if (o.flyTo) {
                const t = o.flyTo(i), r = c.getBoundingClientRect();
                c.classList.add('fly'); c.style.transform = 'translate(' + (t.x - r.left - r.width / 2) + 'px,' + (t.y - r.top - r.height / 2) + 'px) scale(.45)'; c.style.opacity = '0';
              }
              await HH.voice('w_' + key);
              c.disabled = true; c.style.visibility = 'hidden';
              UI.unpill();
              if (o.onRight) await o.onRight(i, c);
              res();
            } else {
              tries++; c.busy = true; HH.sfx('wrong'); c.classList.remove('wrong'); void c.offsetWidth; c.classList.add('wrong');
              await HH.voice('w_' + k); await UI.say(HH.pick(['no1', 'no2', 'no3']), { hold: 60 });
              c.busy = false;
              if (tries >= 2) { cards[key].classList.add('glow'); await UI.say('hint', { hold: 40 }); } else await HH.voice(prompt);
            }
          };
        }
        if (HH.auto) setTimeout(() => cards[key].onclick(), 20);
      });
      cards[key].remove();
    }
    wrap.remove();
  };
  /* 图片选择（g09 月亮在哪里） */
  UI.choose = (list, o = {}) => new Promise(res => {
    const wrap = el('div', 'cards'); layer.appendChild(wrap);
    list.forEach((it, i) => {
      const c = el('button', 'card', '<span class="ic">' + it.ic + '</span><span class="lb">' + it.lb + '</span>');
      if (it.ok) c.dataset.ok = '1';
      c.onclick = async () => {
        if (c.busy) return;
        if (it.ok) { HH.sfx('right'); HH.burstAt(c, 30, { kind: 'star' }); c.classList.add('glow'); await HH.sleep(500); wrap.remove(); res(i); }
        else { c.busy = true; HH.sfx('wrong'); c.classList.add('wrong'); if (it.no) await UI.say(it.no); c.classList.remove('wrong'); c.busy = false; }
      };
      wrap.appendChild(c);
    });
    if (HH.auto) setTimeout(() => wrap.children[list.findIndex(x => x.ok)].click(), 20);
  });

  /* ---------- 大按钮 ---------- */
  UI.acts = (list, o = {}) => new Promise(res => {
    const wrap = el('div', 'acts'); layer.appendChild(wrap);
    list.forEach((it, i) => {
      const b = el('button', 'act ' + (it.cls || ''), (it.img ? '<img src="' + HH.IMG + it.img + '">' : '') + (it.t || ''));
      b.onclick = () => { HH.sfx('pop'); HH.burstAt(b, 14); if (!o.keep) wrap.remove(); res(i); };
      wrap.appendChild(b);
    });
    if (HH.auto) setTimeout(() => wrap.children[o.autoPick || 0].click(), 20);
  });

  /* ---------- 物品 ---------- */
  function veil(inner, ms, o = {}) {
    return new Promise(res => {
      const v = el('div', 'veil'); v.appendChild(inner); layer.appendChild(v);
      let closed = false;
      const close = () => { if (closed) return; closed = true; v.remove(); res(); };
      if (o.tapClose !== false) setTimeout(() => { v.onclick = close; }, HH.fast ? 0 : 700);
      if (ms) setTimeout(close, HH.fast ? 5 : ms);
      if (o.onShow) o.onShow(v, close);
    });
  }
  UI.veil = veil;
  UI.got = async key => {
    const it = D.items[key];
    const box = el('div', 'got', '<img src="' + HH.IMG + 'item/' + key + '.webp"><div class="nm">' + it.name + '</div><div class="py">' + it.py + '</div><div class="tag">放进珍珠小包</div>');
    HH.sfx('magic'); HH.buzz(40);
    const p = veil(box, 0, { tapClose: false, onShow: (v, close) => {
      HH.burst(innerWidth / 2, innerHeight / 2, 30, { kind: 'star' });
      HH.voice(['it_' + key, 'it_get']).then(() => HH.sleep(300)).then(close);
    } });
    await p;
    HH.add('items', key); UI.hud();
    const bb = HH.$('#bBag'); bb.classList.remove('pop'); void bb.offsetWidth; bb.classList.add('pop');
  };
  UI.take = key => { S.items = S.items.filter(k => k !== key); HH.save(); UI.hud(); };

  /* ---------- 成长小黄花 ---------- */
  UI.flowerSVG = (n, total = 7, fresh = -1) => {
    let s = '<svg viewBox="-60 -60 120 120">';
    for (let i = 0; i < total; i++) {
      const a = i / total * 360 - 90, on = i < n;
      s += '<ellipse cx="0" cy="-30" rx="15" ry="25" transform="rotate(' + (a + 90) + ')" fill="' + (on ? '#ffd23f' : '#fff6dc') + '" stroke="#4a2e1c" stroke-width="' + (on ? 4 : 3) + '"' +
        (on ? '' : ' stroke-dasharray="5 5"') + (i === fresh ? ' class="fresh"' : '') + '/>';
    }
    s += '<circle r="17" fill="#ff9f1c" stroke="#4a2e1c" stroke-width="4"/><circle cx="-6" cy="-3" r="2.6" fill="#4a2e1c"/><circle cx="6" cy="-3" r="2.6" fill="#4a2e1c"/>' +
      '<path d="M-6 5 Q0 10 6 5" stroke="#4a2e1c" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>';
    return s;
  };
  UI.petalsOf = ep => D.petals.filter(p => p.ep === ep && S.petals.includes(p.id)).length;
  UI.petal = async id => {
    if (!HH.add('petals', id)) return;
    const pe = D.petals.find(p => p.id === id), n = UI.petalsOf(pe.ep), name = pe.name;
    const box = el('div', 'bigflower', UI.flowerSVG(n - 1) + '<div class="cap">' + name + '</div>');
    HH.sfx('petal'); HH.buzz(60);
    await veil(box, 0, { tapClose: false, onShow: (v, close) => {
      setTimeout(() => { box.firstChild.outerHTML = UI.flowerSVG(n); HH.burst(innerWidth / 2, innerHeight / 2, 46, { kind: 'petal', col: 'petal', speed: 420 }); HH.sfx('ding'); }, HH.fast ? 0 : 650);
      HH.voice(['pt_' + id, 'petal']).then(() => HH.sleep(400)).then(close);
    } });
    UI.hud();
    const f = HH.$('#flower'); f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop');
  };

  /* ---------- 贴纸 ---------- */
  UI.toast = (html, ms = 1800) => { const t = el('div', 'toast', html); layer.appendChild(t); setTimeout(() => t.remove(), HH.fast ? 5 : ms); };
  UI.sticker = async (id, line) => {
    if (HH.has('stickers', id)) { if (line) await UI.say(line); return; }
    HH.add('stickers', id);
    HH.sfx('ding'); HH.buzz(30);
    const st = D.stickers.find(s => s.id === id);
    UI.toast((id.startsWith('m_') ? '🌙 ' : '⭐ ') + st.name + ' 贴纸 +1');
    UI.hud();
    if (line) await UI.say(line);
    await UI.say('st_get', { hold: 60 });
  };

  /* ---------- 照片 ---------- */
  UI.photo = async (key, cap) => {
    await UI.say('photo', { hold: 100 });
    HH.$('#hud').classList.add('off');
    await HH.sleep(250);
    const shot = E.snapshot();
    HH.$('#hud').classList.remove('off');
    HH.sfx('shutter');
    layer.appendChild(el('div', 'flash'));
    setTimeout(() => HH.$$('.flash').forEach(f => f.remove()), 700);
    if (shot) { S.photos[key] = shot; HH.save(); }
    const pol = el('div', 'polaroid', (shot ? '<img src="' + shot + '">' : '') + '<div class="cap">' + cap + '</div>');
    await veil(pol, 3200);
  };

  /* ---------- HUD ---------- */
  const BAG = '<svg viewBox="0 0 100 100"><path d="M24 40 Q50 4 76 40" fill="none" stroke="#e9d8c4" stroke-width="7"/>' +
    [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const a = Math.PI * (1 - i / 8); return '<circle cx="' + (50 + Math.cos(a) * 27) + '" cy="' + (40 - Math.sin(a) * 30) + '" r="4.2" fill="#fff" stroke="#c8b39b" stroke-width="1.4"/>'; }).join('') +
    '<rect x="18" y="38" width="64" height="46" rx="14" fill="#fff" stroke="#4a2e1c" stroke-width="4.5"/><path d="M18 52 Q50 66 82 52" fill="none" stroke="#4a2e1c" stroke-width="3"/>' +
    '<g transform="translate(50 58)">' + [0, 1, 2, 3, 4].map(i => '<ellipse cx="0" cy="-7" rx="5" ry="7" fill="#ff8fa3" transform="rotate(' + i * 72 + ')"/>').join('') + '<circle r="4" fill="#ffd23f"/></g></svg>';
  UI.hud = () => {
    HH.$('#flower').innerHTML = UI.flowerSVG(UI.petalsOf(HH.ep || 1));
    const bb = HH.$('#bBag');
    bb.classList.toggle('on', !!S.met.mm || S.items.length > 0);
    bb.innerHTML = BAG + (S.items.length ? '<span class="n">' + S.items.length + '</span>' : '');
    const n = S.stickers.length;
    HH.$('#stk').textContent = n ? '🌙 ' + n : '';
  };
  UI.hudShow = on => HH.$('#hud').classList.toggle('off', !on);
  HH.$('#bBag').onclick = e => {
    e.stopPropagation(); HH.sfx('pop');
    const old = HH.$('.drawer'); if (old) { old.remove(); return; }
    const d = el('div', 'drawer');
    if (!S.items.length) d.appendChild(el('div', 'none', '小包里还是空的'));
    for (const k of S.items) {
      const it = D.items[k], c = el('div', 'it', '<img src="' + HH.IMG + 'item/' + k + '.webp"><span>' + it.name + '</span><span class="py">' + it.py + '</span>');
      c.onclick = ev => { ev.stopPropagation(); HH.voice('it_' + k); };
      d.appendChild(c);
    }
    layer.appendChild(d);
    setTimeout(() => { const off = ev => { if (!d.contains(ev.target)) { d.remove(); removeEventListener('pointerdown', off, true); } }; addEventListener('pointerdown', off, true); }, 0);
  };
  HH.$('#bHome').onclick = e => {
    e.stopPropagation(); HH.sfx('pop');
    const m = el('div', 'modal', '<div class="box"><div>休息一下</div><button class="mb big" data-a="go">继续玩</button>' +
      '<button class="mb" data-a="map">选关</button><button class="mb sm" data-a="home">回到首页</button></div>');
    m.onclick = ev => {
      const a = ev.target.dataset && ev.target.dataset.a; if (!a) return;
      if (a === 'go') { m.remove(); return; }
      HH.hush(); location.hash = a === 'map' ? '#map' : '#home'; location.reload();
    };
    layer.appendChild(m);
  };
  UI.hud();
})();
