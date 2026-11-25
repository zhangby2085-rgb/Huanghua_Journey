/* 黄花的生活：存档、配音、音效、音乐、粒子特效 */
(function () {
  const HH = window.HH = {};
  const D = HH.D = window.HH_DATA;
  HH.$ = s => document.querySelector(s);
  HH.$$ = s => [...document.querySelectorAll(s)];
  HH.fast = /[?&]fast/.test(location.search);       // 测试：动画和等待都变得很短
  HH.auto = /[?&]auto/.test(location.search);       // 测试：自动答题、自动点击
  HH.sleep = ms => new Promise(r => setTimeout(r, HH.fast ? Math.min(ms, 8) : ms));
  HH.shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  HH.pick = a => a[Math.floor(Math.random() * a.length)];
  HH.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  HH.lerp = (a, b, t) => a + (b - a) * t;
  HH.ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  HH.IMG = 'huanghua/img/';
  HH.errors = [];
  addEventListener('error', e => HH.errors.push(String(e.message)));
  addEventListener('unhandledrejection', e => HH.errors.push('promise: ' + (e.reason && e.reason.message || e.reason)));
  HH.log = (...a) => { try { console.log('[HH]', ...a); } catch (e) { } };
  HH.mark = s => { try { window.AndroidShell && AndroidShell.mark(s); } catch (e) { } };
  /* 台词：{捞|lāo} → 带拼音的 ruby */
  HH.rich = t => t.replace(/\{([^|}]+)\|([^}]+)\}/g, (m, a, b) => '<ruby>' + a + '<rt>' + b + '</rt></ruby>');
  HH.plain = t => t.replace(/\{([^|}]+)\|[^}]+\}/g, '$1');

  /* ---------- 存档 ---------- */
  const KEY = 'huanghua.v1';
  const fresh = () => ({ done: {}, petals: [], items: [], stickers: [], met: {}, side: {}, photos: {}, last: null,
    set: { level: 'std', music: 1, sfx: 1, voice: 1, rate: 1 } });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = fresh(); }
  S.set = Object.assign(fresh().set, S.set || {});
  HH.S = S;
  HH.save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { try { S.photos = {}; localStorage.setItem(KEY, JSON.stringify(S)); } catch (e2) { } } };
  HH.reset = () => { const keep = S.set; const n = fresh(); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, n, { set: keep }); HH.save(); };
  HH.has = (list, id) => S[list].includes(id);
  HH.add = (list, id) => { if (!S[list].includes(id)) { S[list].push(id); HH.save(); return true; } return false; };
  HH.buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };

  /* ---------- 音效 ---------- */
  let ac = null, sfxBus = null, musBus = null;
  function audio() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        const m = ac.createGain(); m.gain.value = .9; m.connect(ac.destination);
        sfxBus = ac.createGain(); sfxBus.gain.value = .5; sfxBus.connect(m);
        musBus = ac.createGain(); musBus.gain.value = 0; musBus.connect(m);
      } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  HH.audio = audio;
  function tone(f, dur, o = {}) {
    if (!audio() || !S.set.sfx) return;
    const t0 = ac.currentTime + (o.delay || 0), os = ac.createOscillator(), g = ac.createGain();
    os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t0);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(o.vol || .25, t0 + (o.att || .01)); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    os.connect(g); g.connect(sfxBus); os.start(t0); os.stop(t0 + dur + .05);
  }
  let nb = null;
  function noise(dur, o = {}) {
    if (!audio() || !S.set.sfx) return;
    if (!nb) { nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t0 = ac.currentTime + (o.delay || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = nb; f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.f0 || 1200, t0); if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t0 + dur); f.Q.value = o.q || 1;
    g.gain.setValueAtTime(o.vol || .3, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t0, Math.random() * .5); s.stop(t0 + dur + .05);
  }
  const SFX = {
    click: () => tone(760, .05, { type: 'square', vol: .05 }),
    step: () => tone(240 + Math.random() * 60, .05, { type: 'triangle', vol: .05 }),
    pick: () => tone(520, .08, { type: 'triangle', to: 760, vol: .12 }),
    pop: () => { noise(.08, { f0: 3000, ft: 'highpass', vol: .3 }); tone(660, .1, { type: 'triangle', to: 990, vol: .1 }); },
    hop: () => tone(300, .18, { type: 'sine', to: 620, vol: .16 }),
    land: () => { tone(160, .14, { type: 'sine', to: 90, vol: .2 }); noise(.08, { f0: 400, vol: .1 }); },
    right: () => [660, 880, 1175].forEach((f, i) => tone(f, .2, { type: 'triangle', vol: .14, delay: i * .07 })),
    wrong: () => { tone(330, .14, { type: 'triangle', to: 260, vol: .1 }); tone(260, .2, { type: 'triangle', to: 200, vol: .1, delay: .12 }); },
    chalk: () => noise(.06, { f0: 4000, ft: 'highpass', vol: .06 }),
    magic: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, .35, { type: 'sine', vol: .1, delay: i * .06 })); },
    splash: () => { noise(.5, { f0: 1800, f1: 300, vol: .35 }); noise(.25, { f0: 600, vol: .2, delay: .08 }); },
    drip: () => tone(1200 + Math.random() * 600, .08, { type: 'sine', to: 400, vol: .1 }),
    spray: () => noise(.9, { f0: 900, f1: 3000, vol: .35 }),
    kick: () => { tone(120, .12, { type: 'sine', to: 60, vol: .35 }); noise(.06, { f0: 800, vol: .2 }); },
    goal: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, .3, { type: 'square', vol: .06, delay: i * .1 })); noise(.8, { f0: 1500, vol: .15, delay: .2 }); },
    whoosh: () => noise(.4, { f0: 300, f1: 2400, vol: .2 }),
    bell: () => [1319, 1047, 1319, 1047].forEach((f, i) => tone(f, .25, { type: 'sine', vol: .14, delay: i * .18 })),
    cheer: () => { for (let i = 0; i < 6; i++) tone(500 + Math.random() * 500, .12, { type: 'triangle', vol: .05, delay: i * .07 }); },
    laugh: () => { for (let i = 0; i < 5; i++) tone(620 - i * 30, .09, { type: 'square', vol: .04, delay: i * .11 }); },
    petal: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .5, { type: 'triangle', vol: .12, delay: i * .09 })),
    shutter: () => { noise(.05, { f0: 3000, vol: .4 }); noise(.08, { f0: 1500, vol: .3, delay: .08 }); },
    wobble: () => tone(400, .3, { type: 'sine', to: 300, vol: .08 }),
    fall: () => tone(700, .5, { type: 'sine', to: 150, vol: .14 }),
    ding: () => tone(1568, .4, { type: 'sine', vol: .14 }),
  };
  HH.sfx = (n, a) => { try { SFX[n] && SFX[n](a); } catch (e) { } };

  /* ---------- 音乐：五声音阶的小曲子 ---------- */
  const SONGS = {
    class: { bt: .3, mel: [72, 74, 76, 79, 76, 74, 72, 0, 69, 72, 74, 72, 69, 67, 0, 0, 72, 74, 76, 79, 81, 79, 76, 0, 74, 76, 74, 72, 69, 72, 0, 0], bass: [48, 45, 43, 48] },
    dusk: { bt: .36, mel: [67, 0, 69, 72, 0, 74, 72, 69, 67, 0, 64, 67, 69, 0, 0, 0, 67, 0, 69, 72, 0, 76, 74, 72, 69, 0, 67, 69, 72, 0, 0, 0], bass: [45, 41, 43, 40] },
    play: { bt: .22, mel: [72, 0, 76, 0, 79, 76, 74, 72, 74, 0, 76, 74, 72, 69, 67, 0, 69, 72, 74, 76, 79, 0, 81, 79, 76, 74, 72, 74, 72, 0, 0, 0], bass: [48, 53, 55, 48] },
    title: { bt: .27, mel: [76, 79, 81, 79, 76, 74, 72, 0, 74, 76, 79, 76, 74, 72, 69, 0, 72, 74, 76, 79, 81, 84, 81, 79, 76, 74, 72, 74, 72, 0, 0, 0], bass: [48, 45, 41, 43] },
  };
  const mus = { on: false, song: 'title', beat: 0, next: 0, ducked: false, timer: 0 };
  /* 背景音乐：huanghua/music/<歌>.ogg（Kevin MacLeod, incompetech.com, CC BY 4.0）；文件放不出来才用上面合成的小曲 */
  const tracks = {};
  const track = song => {
    if (!tracks[song]) {
      const a = new Audio('huanghua/music/' + song + '.ogg'); a.loop = true; a.preload = 'auto'; a.volume = 0;
      a.onerror = () => { a.bad = true; }; tracks[song] = a;
    }
    return tracks[song];
  };
  function musicTick() {
    if (!mus.on) return;
    const want = S.set.music && !document.hidden ? (mus.ducked ? .1 : .36) : 0;
    for (const [k, a] of Object.entries(tracks)) {
      const target = k === mus.song && !a.bad ? want : 0, d = target - a.volume;
      a.volume = HH.clamp(a.volume + Math.sign(d) * Math.min(Math.abs(d), .035), 0, 1);
      if (a.volume === 0 && (k !== mus.song || want === 0) && !a.paused) a.pause();
    }
    const cur = tracks[mus.song];
    if (cur && !cur.bad && cur.paused && want > 0) { const p = cur.play(); if (p && p.catch) p.catch(() => { }); }
    synthTick(!cur || cur.bad);
  }
  function synthTick(on) {
    if (!ac) return;
    const want = on && S.set.music && !document.hidden ? (mus.ducked ? .05 : .16) : 0;
    musBus.gain.setTargetAtTime(want, ac.currentTime, .25);
    if (!want) { mus.next = Math.max(mus.next, ac.currentTime); return; }
    const sg = SONGS[mus.song] || SONGS.class, bt = sg.bt;
    while (mus.next < ac.currentTime + .3) {
      const i = mus.beat % sg.mel.length, n = sg.mel[i], t = mus.next;
      if (n && want > 0) {
        const os = ac.createOscillator(), g = ac.createGain();
        os.type = 'triangle'; os.frequency.value = 440 * Math.pow(2, (n - 69) / 12);
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.28, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + bt * 1.6);
        os.connect(g); g.connect(musBus); os.start(t); os.stop(t + bt * 1.7);
      }
      if (i % 4 === 0 && want > 0) {
        const bn = sg.bass[(i / 4 | 0) % sg.bass.length], os = ac.createOscillator(), g = ac.createGain();
        os.type = 'sine'; os.frequency.value = 440 * Math.pow(2, (bn - 69) / 12);
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.4, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + bt * 3.8);
        os.connect(g); g.connect(musBus); os.start(t); os.stop(t + bt * 3.9);
      }
      mus.beat++; mus.next += bt;
    }
  }
  HH.music = song => {
    audio();
    if (song && song !== mus.song) { mus.song = song; mus.beat = 0; }
    track(mus.song);
    if (!mus.on) { mus.on = true; mus.next = ac ? ac.currentTime + .1 : 0; }
    if (!mus.timer) mus.timer = setInterval(musicTick, 120);
  };
  // 手机上第一次点屏幕之前不让放声音：点了以后再试一次
  addEventListener('pointerdown', () => { const a = tracks[mus.song]; if (mus.on && a && a.paused && !a.bad) { const p = a.play(); if (p && p.catch) p.catch(() => { }); } }, { capture: true });

  /* ---------- 配音 ---------- */
  const V = window.HH_VOICE || {};
  const el = new Audio(); el.preload = 'auto';
  let queue = [], cur = null, tok = 0;
  HH.missing = new Set();
  function textOf(id) {
    const l = D.lines[id]; if (l) return HH.plain(l[1]);
    if (id.startsWith('w_')) return (D.words[id.slice(2)] || {}).ch || '';
    if (id.startsWith('q_')) return (D.words[id.slice(2)] || {}).hint || '';
    if (id.startsWith('it_')) return (D.items[id.slice(3)] || {}).name || '';
    return '';
  }
  function fallback(text, done) {
    try { if (window.AndroidTTS && AndroidTTS.speak(text)) { setTimeout(done, 400 + text.length * 240); return; } } catch (e) { }
    try { if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-CN'; u.onend = u.onerror = done; speechSynthesis.speak(u); return; } } catch (e) { }
    setTimeout(done, 300 + text.length * 220);
  }
  function next() {
    if (!queue.length) { cur = null; mus.ducked = false; return; }
    const it = queue.shift(), t = tok;
    cur = it; mus.ducked = true;
    let fired = false;
    const done = () => { if (fired || t !== tok || cur !== it) return; fired = true; it.res(); next(); };
    if (!S.set.voice || HH.fast) { setTimeout(done, HH.fast ? 2 : 300 + textOf(it.id).length * 180); return; }
    const src = V[it.id];
    if (!src) { HH.missing.add(it.id); fallback(textOf(it.id), done); return; }
    el.onended = done; el.onerror = done; el.src = src; el.playbackRate = S.set.rate || 1;
    // 万一 onended 没来（后台、被打断），按时长兜底
    el.onloadedmetadata = () => { if (isFinite(el.duration)) setTimeout(done, (el.duration / (S.set.rate || 1)) * 1000 + 900); };
    const p = el.play(); if (p && p.catch) p.catch(() => setTimeout(done, 200 + textOf(it.id).length * 200));
  }
  /* 说一句（或几句），返回说完的 Promise */
  HH.voice = (ids, interrupt = true) => {
    if (!Array.isArray(ids)) ids = [ids];
    if (interrupt) HH.hush();
    const ps = ids.filter(Boolean).map(id => new Promise(res => queue.push({ id, res })));
    if (!cur) next();
    return Promise.all(ps);
  };
  HH.hush = () => {
    tok++; for (const q of queue) q.res(); queue = [];
    if (cur) { const c = cur; cur = null; c.res(); }
    try { el.pause(); } catch (e) { }
    try { window.AndroidTTS && AndroidTTS.stop(); } catch (e) { }
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { }
    mus.ducked = false;
  };
  addEventListener('pointerdown', () => audio(), { capture: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { try { el.pause(); } catch (e) { } } });

  /* ---------- 粒子（盖在最上面，点不到） ---------- */
  const fx = HH.$('#fx'), g = fx.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  function resize() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; fx.width = W * dpr; fx.height = H * dpr; }
  addEventListener('resize', resize); resize();
  const parts = [];
  const COLS = { gold: ['#ffd84d', '#fff3a8', '#ffb300'], water: ['#bfe9ff', '#7fd0ff', '#ffffff'], petal: ['#ffd23f', '#ffe680', '#fff3b0'],
    rainbow: ['#ff6b6b', '#ffd84d', '#5bd96b', '#5ac8fa', '#c77dff'], chalk: ['#ffffff', '#fff7c2', '#e8f4ff'], heart: ['#ff8fa3', '#ffb3c1', '#ff5d8f'] };
  HH.burst = (x, y, n = 20, o = {}) => {
    const cols = COLS[o.col || 'gold'];
    for (let i = 0; i < n; i++) {
      const a = o.dir != null ? o.dir + (Math.random() - .5) * (o.spread || 1) : Math.random() * Math.PI * 2;
      const sp = (o.speed || 260) * (.3 + Math.random() * .9);
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 60), t: 0, life: (o.life || .9) * (.6 + Math.random() * .6),
        r: (o.size || 6) * (.5 + Math.random()), c: cols[i % cols.length], kind: o.kind || 'spark', g: o.g == null ? 420 : o.g, rot: Math.random() * 6 });
    }
  };
  HH.burstAt = (elm, n, o) => { if (!elm) return; const r = elm.getBoundingClientRect(); HH.burst(r.left + r.width / 2, r.top + r.height / 2, n, o); };
  HH.ring = (x, y, o = {}) => parts.push({ x, y, t: 0, life: o.life || .6, kind: 'ring', r: o.r || 120, c: o.c || '#ffd84d' });
  HH.fxFrame = dt => {
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt;
      if (p.t > p.life) { parts.splice(i, 1); continue; }
      const k = 1 - p.t / p.life;
      if (p.kind === 'ring') {
        g.strokeStyle = p.c; g.globalAlpha = k; g.lineWidth = 6 * k + 1;
        g.beginPath(); g.arc(p.x, p.y, p.r * (1 - k * k) + 10, 0, 7); g.stroke(); continue;
      }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 1.2 * dt; p.rot += dt * 8;
      g.globalAlpha = Math.min(1, k * 1.6); g.fillStyle = p.c;
      if (p.kind === 'star') {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.beginPath();
        for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5, rr = j % 2 ? p.r * .45 : p.r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        g.fill(); g.restore();
      } else if (p.kind === 'petal') {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot * .4); g.beginPath(); g.ellipse(0, 0, p.r * 1.4, p.r * .7, 0, 0, 7); g.fill(); g.restore();
      } else if (p.kind === 'drop') {
        g.beginPath(); g.ellipse(p.x, p.y, p.r * .6, p.r, Math.atan2(p.vy, p.vx) + Math.PI / 2, 0, 7); g.fill();
      } else { g.beginPath(); g.arc(p.x, p.y, p.r * k, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
  };
})();
