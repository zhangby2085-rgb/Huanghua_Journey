/* 黄花的生活：首页（选集）、选关、贴纸本、家长设置、通关、每一集的结尾 */
(function () {
  const HH = window.HH, D = HH.D, E = HH.E, UI = HH.UI, S = HH.S, L = HH.L;
  const M = HH.M = {};
  const scr = HH.$('#screen');
  const show = html => { scr.innerHTML = html; scr.classList.add('on'); UI.hudShow(false); };
  const hide = () => { scr.classList.remove('on'); scr.innerHTML = ''; };
  const img = s => HH.IMG + s;
  const epOf = id => { const l = L.LIST.find(x => x.id === id); return l ? L.STAGES[l.st].ep : 1; };
  const epLevels = ep => L.LIST.filter(l => L.STAGES[l.st].ep === ep);
  /* 某一集该从哪一关接着玩 */
  const EPN = () => Object.keys(L.EPS).map(Number).sort((a, b) => a - b);
  const CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const lastSt = ep => Math.max(...Object.entries(L.STAGES).filter(([, v]) => v.ep === ep).map(([k]) => +k));
  M.lastSt = lastSt;
  const resumeOf = ep => { const ls = epLevels(ep); if (S.last && epOf(S.last) === ep && L.unlocked(S.last)) return S.last; const l = ls.find(x => !S.done[x.id]); return l ? l.id : ls[0].id; };

  M.home = () => {
    HH.music('title');
    const troupe = [['ma', 'ma'], ['al', 'al'], ['mm', ''], ['ya', 'ya'], ['hh', 'hh'], ['dd', 'dd'], ['cm', ''], ['hu', ''], ['bk', '']]
      .map(([id, c], i) => '<img class="' + c + '" src="' + img(id === 'hh' ? 'ch/huanghua_jump.webp' : id === 'dd' ? 'ch/didi_happy.webp' : id === 'ya' ? 'ch/yaya_happy.webp' : E.CH[id].img) + '" style="animation-delay:' + (i * .17) + 's">').join('');
    const epBtn = ep => {
      const ls = epLevels(ep), n = ls.filter(l => S.done[l.id]).length;
      return '<button class="mb ep" data-ep="' + ep + '"><b>' + L.EPS[ep].title.replace(' · ', '</b><span>') + '</span><i>' + (n === ls.length ? '✅ 通关' : n ? '继续 ' + n + '/' + ls.length : '开始') + '</i></button>';
    };
    const many = EPN().length > 2;
    show('<div class="menu' + (many ? ' small' : '') + '" style="background-image:url(' + img('bg/classroom.jpg') + ')">' +
      '<div class="logo"><h1><b>黄花</b>的生活</h1></div>' +
      '<div class="mbtns eps' + (many ? ' eps6' : '') + '">' + EPN().map(epBtn).join('') + '</div>' +
      '<div class="corner"><button class="mb sm" id="mMap">选关</button><button class="mb sm" id="mBook">贴纸本</button><button class="mb sm" id="mSet">家长</button></div>' +
      '<div class="troupe">' + troupe + '</div></div>');
    HH.$$('.mb.ep').forEach(b => b.onclick = () => { const ep = +b.dataset.ep; HH.sfx('pop'); HH.voice(ep === 1 ? 'title' : 'title' + ep); M.play(resumeOf(ep)); });
    HH.$('#mMap').onclick = () => { HH.sfx('pop'); M.map(); };
    HH.$('#mBook').onclick = () => { HH.sfx('pop'); M.book(); };
    HH.$('#mSet').onclick = () => { HH.sfx('pop'); M.settings(); };
    HH.$$('.troupe img').forEach(im => { im.onclick = () => { HH.sfx('hop'); im.style.animationDuration = '.6s'; setTimeout(() => im.style.animationDuration = '', 700); }; });
  };
  M.play = id => { hide(); HH.hush(); L.start(id).catch(e => { HH.log('level crash', e && e.stack || e); }); };

  M.map = () => {
    let h = '<div class="page"><button class="mb sm back" id="mBack">← 返回</button><h2>选关</h2>';
    for (const ep of EPN()) {
      h += '<h3 class="eph">' + L.EPS[ep].title + '</h3><div class="stages">';
      for (const [st, info] of Object.entries(L.STAGES)) {
        if (info.ep !== ep) continue;
        h += '<div class="stage' + (info.soon ? ' lock' : '') + '"><div class="pic" style="background-image:url(' + img(info.bg) + ')"><span>' + info.title + '</span></div><div class="lv">';
        for (const l of L.LIST.filter(x => x.st == st)) {
          const ok = L.unlocked(l.id);
          h += '<button data-id="' + l.id + '"' + (ok ? '' : ' disabled') + ' class="' + (S.done[l.id] ? 'done' : '') + '"><span>' + l.name + '</span><span>' + (S.done[l.id] ? '✅' : ok ? '▶' : '🔒') + '</span></button>';
        }
        h += '</div></div>';
      }
      h += '</div>';
    }
    show(h + '</div>');
    HH.$('#mBack').onclick = () => { HH.sfx('pop'); M.home(); };
    HH.$$('.stage .lv button').forEach(b => { b.onclick = () => { HH.sfx('pop'); M.play(b.dataset.id); }; });
  };

  M.book = () => {
    const moon = '<svg class="art" viewBox="-50 -50 100 100"><circle r="40" fill="#ffe066" stroke="#4a2e1c" stroke-width="5"/><circle cx="-12" cy="-8" r="7" fill="#f2c94c"/><circle cx="14" cy="12" r="9" fill="#f2c94c"/></svg>';
    const star = '<svg class="art" viewBox="-50 -50 100 100"><path d="M0 -42 L12 -12 L44 -12 L18 8 L28 40 L0 20 L-28 40 L-18 8 L-44 -12 L-12 -12 Z" fill="#ffd23f" stroke="#4a2e1c" stroke-width="5"/></svg>';
    const pic = s => '<img src="' + img(s) + '">';
    const art = { q_ball: pic('item/ball.webp'), q_clip: pic('item/clip.webp'), q_goal: star, q_clean: star, q_mummy: pic('ch/huihui.webp'), q_ontime: pic('item/dbook.webp'),
      d_lib: pic('ch/didi.webp'), d_wc: pic('ch/didi.webp'), d_garden: pic('ch/didi_happy.webp'),
      t_home: pic('ch/yaya_happy.webp'), t_market: pic('ch/yaya_happy.webp'), t_clinic: pic('ch/yaya_happy.webp'), q_lost: pic('ch/maomao.webp'), q_coin: pic('item/coin1.webp'),
      s_street: star, s_bus: star, s_park: star, s_fair: star, s_home: star, s_balcony: star,
      q_ball2: pic('ch/jc.webp'), q_seat: pic('ch/nn.webp'), q_fu: pic('item/knot.webp'), q_fish: pic('item/fishbowl.webp') };
    let h = '<div class="page"><button class="mb sm back" id="mBack">← 返回</button><h2>贴纸本</h2><div class="book">';
    for (const s of D.stickers) h += '<div class="stick' + (HH.has('stickers', s.id) ? '' : ' no') + '">' + (art[s.id] || moon) + '<div>' + s.name + '</div></div>';
    for (const ep of EPN()) h += '<div class="stick">' + UI.flowerSVG(UI.petalsOf(ep)).replace('<svg', '<svg class="art"') + '<div>第' + CN[ep] + '集 小黄花 ' + UI.petalsOf(ep) + '/7</div></div>';
    h += '</div>';
    const ph = Object.values(S.photos || {}).filter(Boolean);
    if (ph.length) h += '<h2>合影</h2><div class="photos">' + ph.map(p => '<img src="' + p + '">').join('') + '</div>';
    show(h + '</div>');
    HH.$('#mBack').onclick = () => { HH.sfx('pop'); M.home(); };
  };

  M.settings = () => {
    const seg = (key, opts) => '<div class="seg" data-k="' + key + '">' + opts.map(([v, t]) => '<button data-v="' + v + '" class="' + (String(S.set[key]) === String(v) ? 'on' : '') + '">' + t + '</button>').join('') + '</div>';
    show('<div class="page"><button class="mb sm back" id="mBack">← 返回</button><h2>家长设置</h2><div class="sets">' +
      '<div class="row"><div>拼音难度<small>简单：卡片上有汉字 · 标准：只有拼音 · 进阶：同一个音、不同声调</small></div>' + seg('level', [['easy', '简单'], ['std', '标准'], ['adv', '进阶']]) + '</div>' +
      '<div class="row"><div>背景音乐</div>' + seg('music', [[1, '开'], [0, '关']]) + '</div>' +
      '<div class="row"><div>音效</div>' + seg('sfx', [[1, '开'], [0, '关']]) + '</div>' +
      '<div class="row"><div>说话速度</div>' + seg('rate', [[0.85, '慢'], [1, '正常'], [1.15, '快']]) + '</div>' +
      '<div class="row"><div>重新开始<small>清掉关卡、花瓣、贴纸和照片</small></div><button class="mb sm" id="mReset">清空进度</button></div>' +
      '<div class="row"><div><small>配音：微软 Edge 神经网络声音 · 字体：霞鹜文楷（OFL）<br>音乐：Kevin MacLeod（incompetech.com）《Carefree》《Wallpaper》《Sneaky Snitch》《Monkeys Spinning Monkeys》' +
      '《Fluffing a Duck》《Easy Lemon》《Merry Go》《Pixel Peeker Polka》，Creative Commons: By Attribution 4.0<br>第二集背景：Stable Diffusion XL 本机生成 · 第三~六集图画：Google Gemini</small></div></div>' +
      '</div></div>');
    HH.$$('.seg').forEach(sg => sg.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      const k = sg.dataset.k, v = b.dataset.v;
      S.set[k] = k === 'level' ? v : Number(v); HH.save(); HH.sfx('click');
      sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      if (k === 'rate') HH.voice('ok2');
    });
    let armed = false;
    HH.$('#mReset').onclick = e => {
      if (!armed) { armed = true; e.target.textContent = '再点一次确认'; return; }
      HH.reset(); UI.hud(); e.target.textContent = '已清空'; HH.sfx('pop');
    };
    HH.$('#mBack').onclick = () => { HH.sfx('pop'); M.home(); };
  };

  M.stageDone = st => {
    st = +st;
    const ep0 = L.STAGES[st].ep;
    if (st === lastSt(ep0)) return M.finale(ep0);
    const next = L.STAGES[st + 1];
    const m = UI.el('div', 'modal', '<div class="box done-card"><h3>' + L.STAGES[st].title + ' 完成！</h3><div class="stars">⭐⭐⭐</div>' +
      '<div>' + UI.flowerSVG(UI.petalsOf(L.STAGES[st].ep)).replace('<svg', '<svg style="width:22vh;height:22vh"') + '</div>' +
      (next && !next.soon ? '<button class="mb big" id="dNext">下一站：' + next.name + '</button>' : '') +
      '<button class="mb sm" id="dHome">回到首页</button></div>');
    HH.$('#layer').appendChild(m);
    HH.sfx('goal'); HH.burst(innerWidth / 2, innerHeight * .3, 60, { kind: 'star', col: 'rainbow', speed: 500 });
    const nb = HH.$('#dNext');
    if (nb) nb.onclick = () => { HH.sfx('pop'); m.remove(); M.play(L.LIST.find(l => l.st === st + 1).id); };
    HH.$('#dHome').onclick = () => { HH.sfx('pop'); m.remove(); M.home(); };
    if (HH.auto) window.HH_STAGE_DONE = st;
  };

  /* 一集完：七片花瓣全开 */
  M.finale = ep => {
    const names = D.petals.filter(p => p.ep === ep).map(p => '<span style="display:inline-block;margin:.6vh 1vh;background:' + (HH.has('petals', p.id) ? '#ffd23f' : '#eee') + ';border:.4vh solid #4a2e1c;border-radius:3vh;padding:.3vh 2vh">' + p.name + '</span>').join('');
    const nx = L.EPS[ep + 1];
    const m = UI.el('div', 'modal', '<div class="box done-card" style="max-width:90vw"><h3>第' + CN[ep] + '集《' + L.EPS[ep].name + '》完！</h3>' +
      '<div>' + UI.flowerSVG(UI.petalsOf(ep)).replace('<svg', '<svg style="width:30vh;height:30vh"') + '</div>' +
      '<div style="font-size:5vh">黄花又长大了一点点！</div><div style="font-size:4vh;max-width:80vw">' + names + '</div>' +
      '<div style="display:flex;gap:3vh">' + (nx ? '<button class="mb big" id="dNextEp">第' + CN[ep + 1] + '集：' + nx.name + '</button>' : '') +
      '<button class="mb ' + (nx ? 'sm' : 'big') + '" id="dAgain">再玩一遍</button><button class="mb sm" id="dHome">回到首页</button></div></div>');
    HH.$('#layer').appendChild(m);
    HH.sfx('petal'); HH.burst(innerWidth / 2, innerHeight * .3, 80, { kind: 'petal', col: 'petal', speed: 560 });
    const ne = HH.$('#dNextEp'); if (ne) ne.onclick = () => { HH.sfx('pop'); m.remove(); M.play(L.EPS[ep + 1].first); };
    HH.$('#dAgain').onclick = () => { HH.sfx('pop'); m.remove(); M.play(L.EPS[ep].first); };
    HH.$('#dHome').onclick = () => { HH.sfx('pop'); m.remove(); M.home(); };
    if (HH.auto) window.HH_STAGE_DONE = lastSt(ep);
  };

  // 进来：#map 直接去选关；?play=s2a 直接开始某一关（测试用）
  const q = new URLSearchParams(location.search);
  addEventListener('load', () => {
    if (q.get('play')) M.play(q.get('play'));
    else if (location.hash === '#map') M.map();
    else M.home();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  });
})();
