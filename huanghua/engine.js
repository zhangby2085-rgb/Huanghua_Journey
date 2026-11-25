/* 黄花的生活：场景画布 —— 镜头、角色、走路找路、点击、道具 */
(function () {
  const HH = window.HH;
  const E = HH.E = {};
  const cv = HH.$('#cv'), g = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  function resize() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  addEventListener('resize', resize); resize();
  E.size = () => ({ W, H });

  /* ---------- 图片 ---------- */
  const IMG = {};
  E.img = src => { if (!IMG[src]) { const im = new Image(); im.src = HH.IMG + src; IMG[src] = im; } return IMG[src]; };
  E.ok = im => im && (im instanceof HTMLCanvasElement ? im.width > 0 : im.complete && im.naturalWidth > 0);
  E.iw = im => im.naturalWidth || im.width; E.ih = im => im.naturalHeight || im.height;
  E.preload = list => Promise.all(list.map(s => new Promise(r => { const im = E.img(s); if (E.ok(im)) r(); else { im.onload = im.onerror = () => r(); } })));

  /* ---------- 角色 ---------- */
  const P = 'ch/huanghua_';
  E.CH = {
    hh: { k: .84, c: '#e8a90c', img: P + 'stand.webp', poses: { stand: P + 'stand.webp', walk: P + 'walk.webp', hand: P + 'hand.webp', reach: P + 'reach.webp',
      jump: P + 'jump.webp', bag: P + 'bag.webp', sit: 'ch/huanghua0.webp',
      brush: P + 'brush.webp', yawn: P + 'yawn.webp', sleep: P + 'sleep.webp', toothache: P + 'toothache.webp', hongbao: P + 'hongbao.webp', tangzhuang: P + 'tangzhuang.webp' } },
    ma: { k: 1.3, c: '#9b7fd1', img: 'ch/ma.webp' },
    mm: { k: .98, c: '#ef7fab', img: 'ch/maomao.webp' },
    hu: { k: .98, c: '#d9702e', img: 'ch/huihui.webp' },
    cm: { k: 1.07, c: '#e0566e', img: 'ch/caomei.webp' },
    bk: { k: .97, c: '#3a86d4', img: 'ch/beike.webp' },
    al: { k: 1.2, c: '#5c97cf', img: 'ch/alan.webp' },
    dd: { k: .42, c: '#3d9be0', img: 'ch/didi.webp', poses: { stand: 'ch/didi.webp', happy: 'ch/didi_happy.webp' } },
    // 第三~六集
    ya: { k: .42, c: '#6fb1e6', img: 'ch/yaya.webp', poses: { stand: 'ch/yaya.webp', happy: 'ch/yaya_happy.webp', sad: 'ch/yaya_sad.webp' } },
    mama: { k: 1.08, c: '#e3a03a', img: 'ch/mama.webp' },
    baba: { k: 1.15, c: '#4f7fc4', img: 'ch/baba.webp' },
    hema: { k: 1.25, c: '#9a78c9', img: 'ch/hema.webp' },
    zhu: { k: 1.2, c: '#3f9a4f', img: 'ch/zhu.webp' },
    jc: { k: 1.32, c: '#2d4f8e', img: 'ch/jc.webp' },
    nn: { k: 1.12, c: '#b4523a', img: 'ch/nn.webp' },
  };
  E.FRIENDS = ['mm', 'hu', 'cm', 'bk', 'al'];
  E.allImages = () => {
    const s = new Set();
    for (const c of Object.values(E.CH)) { s.add(c.img); if (c.poses) Object.values(c.poses).forEach(p => s.add(p)); }
    return [...s];
  };
  class Actor {
    constructor(id, o) {
      Object.assign(this, { id, x: 0, y: 0, z: 0, pose: 'stand', flip: false, vis: true, alpha: 1, scale: 1, path: [], moving: false, t: Math.random() * 9,
        phase: Math.random() * 6, hop: null, sq: 0, rot: 0, wob: 0, shake: 0, sweat: 0, k: E.CH[id].k, onTop: 0 }, o);
    }
    get h() { return (this.hFix || E.scene.size(this.y)) * this.k * this.scale; }
    get im() { if (this.custom) return this.custom; const c = E.CH[this.id]; let p = this.pose; if (this.moving && c.poses && (p === 'stand' || p === 'bag')) p = 'walk'; return E.img((c.poses && c.poses[p]) || c.img); }
    hopZ() { if (!this.hop) return 0; const k = HH.clamp((now - this.hop.t0) / this.hop.dur, 0, 1); return Math.sin(Math.PI * k) * this.hop.hgt; }
    /* 世界坐标里的外框（点它用） */
    box() { const im = this.im, h = this.h, w = E.ok(im) ? h * E.iw(im) / E.ih(im) : h * .7; const top = this.y - this.z - this.hopZ() - h; return { x0: this.x - w / 2, x1: this.x + w / 2, y0: top, y1: this.y - this.z, w, h }; }
    head() { const b = this.box(); return { x: this.x, y: b.y0 + b.h * .04 }; }
  }
  E.actors = {};
  E.add = (id, x, y, o = {}) => (E.actors[id] = new Actor(id, Object.assign({ x, y }, o)));
  E.a = id => E.actors[id];
  E.remove = id => { delete E.actors[id]; };
  E.props = [];
  E.prop = p => { E.unprop(p.id); E.props.push(p); return p; };
  E.unprop = id => { E.props = E.props.filter(p => p.id !== id); };

  /* ---------- 场景、镜头 ---------- */
  E.scene = null;
  E.cam = { x: 0, y: 0, z: 1 };
  let camAnim = null;
  E.load = sc => {
    E.scene = Object.assign({ w: 1672, h: 941, walk: [], block: [], wps: [], minY: 0, cam: { x: 836, y: 470, z: 1 } }, sc);
    E.scene.bgImg = E.img(E.scene.bg);
    E.actors = {}; E.props = []; E.hot = []; E.free = false; E.capture = null; camAnim = null;
    Object.assign(E.cam, E.scene.cam); clampCam(E.cam);
  };
  const baseScale = () => Math.max(W / E.scene.w, H / E.scene.h);
  E.scale = (z = E.cam.z) => baseScale() * z;
  function clampCam(c) {
    const s = E.scale(c.z), vw = W / s, vh = H / s, sc = E.scene;
    c.x = vw >= sc.w ? sc.w / 2 : HH.clamp(c.x, vw / 2, sc.w - vw / 2);
    c.y = vh >= sc.h - sc.minY ? (sc.h + sc.minY) / 2 : HH.clamp(c.y, sc.minY + vh / 2, sc.h - vh / 2);
    return c;
  }
  E.camTo = (o, ms = 900) => {
    const from = Object.assign({}, E.cam), to = clampCam(Object.assign({}, E.cam, o));
    if (HH.fast) ms = 10;
    return new Promise(res => { camAnim = { from, to, t0: performance.now(), ms, res }; });
  };
  E.toScreen = (x, y) => { const s = E.scale(); return { x: (x - E.cam.x) * s + W / 2, y: (y - E.cam.y) * s + H / 2 }; };
  E.toWorld = (x, y) => { const s = E.scale(); return { x: (x - W / 2) / s + E.cam.x, y: (y - H / 2) / s + E.cam.y }; };

  /* ---------- 能走的地方、找路 ---------- */
  function inPoly(p, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > p.y) !== (yj > p.y) && p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  const inBlock = (p, m = 1) => E.scene.block.some(b => ((p.x - b.x) / (b.rx * m)) ** 2 + ((p.y - b.y) / (b.ry * m)) ** 2 < 1);
  E.walkable = p => E.scene.walk.some(poly => inPoly(p, poly)) && !inBlock(p);
  function clear(a, b) {
    const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(d / 7));
    for (let i = 1; i <= n; i++) { const t = i / n; if (!E.walkable({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return false; }
    return true;
  }
  E.nearest = p => {
    if (E.walkable(p)) return p;
    let best = null, bd = 1e9;
    const tryP = q => { if (E.walkable(q)) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = q; } } };
    for (const poly of E.scene.walk) {
      const cx = poly.reduce((s, v) => s + v[0], 0) / poly.length, cy = poly.reduce((s, v) => s + v[1], 0) / poly.length;
      for (let i = 0; i < poly.length; i++) {
        const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
        const dx = x2 - x1, dy = y2 - y1, t = HH.clamp(((p.x - x1) * dx + (p.y - y1) * dy) / (dx * dx + dy * dy || 1), 0, 1);
        const q = { x: x1 + dx * t, y: y1 + dy * t }, l = Math.hypot(cx - q.x, cy - q.y) || 1;
        tryP({ x: q.x + (cx - q.x) / l * 4, y: q.y + (cy - q.y) / l * 4 });
      }
    }
    for (const b of E.scene.block) {
      const a = Math.atan2((p.y - b.y) / b.ry, (p.x - b.x) / b.rx);
      tryP({ x: b.x + Math.cos(a) * b.rx * 1.06, y: b.y + Math.sin(a) * b.ry * 1.12 });
    }
    return best || p;
  };
  E.route = (a, b) => {
    b = E.nearest(b);
    if (!E.walkable(a) || clear(a, b)) return [b];
    const nodes = [a, b, ...E.scene.wps.map(([x, y]) => ({ x, y })).filter(E.walkable)];
    const dist = nodes.map(() => 1e9), prev = nodes.map(() => -1), done = nodes.map(() => false);
    dist[0] = 0;
    for (;;) {
      let u = -1;
      for (let i = 0; i < nodes.length; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || dist[u] >= 1e9) break;
      done[u] = true; if (u === 1) break;
      for (let v = 0; v < nodes.length; v++) {
        if (done[v]) continue;
        const d = Math.hypot(nodes[u].x - nodes[v].x, nodes[u].y - nodes[v].y);
        if (dist[u] + d < dist[v] && clear(nodes[u], nodes[v])) { dist[v] = dist[u] + d; prev[v] = u; }
      }
    }
    if (prev[1] < 0) return [b];
    const path = []; for (let v = 1; v > 0; v = prev[v]) path.unshift(nodes[v]);
    return path;
  };
  /* 走过去；返回到达的 Promise。o.free：不找路直接走（走出画面、穿过桌子） */
  E.walk = (id, x, y, o = {}) => {
    const a = E.actors[id]; if (!a) return Promise.resolve();
    a.path = o.free ? [{ x, y }] : E.route({ x: a.x, y: a.y }, { x, y });
    a.speedK = o.speed || 1;
    if (HH.fast) { const last = a.path[a.path.length - 1]; a.x = last.x; a.y = last.y; a.path = []; a.moving = false; return Promise.resolve(); }
    return new Promise(res => { a.arrive = res; });
  };
  E.face = (id, x) => { const a = E.actors[id]; if (a) a.flip = x < a.x; };
  E.hop = (id, hgt, ms = 520) => {
    const a = E.actors[id]; if (!a) return Promise.resolve();
    hgt = hgt == null ? a.h * .35 : hgt; HH.sfx('hop');
    a.hop = { t0: now, dur: HH.fast ? 5 : ms, hgt };
    return new Promise(res => setTimeout(() => { a.hop = null; a.sq = .2; HH.sfx('land'); res(); }, HH.fast ? 6 : ms));
  };
  E.hopAll = (ids, hgt) => Promise.all(ids.map((id, i) => HH.sleep(i * 90).then(() => E.hop(id, hgt))));

  /* ---------- 点击 ---------- */
  E.hot = [];
  E.free = false;      // 自由走动：点地板走路、点小伙伴聊天
  E.busy = 0;          // 正在处理一次点击
  E.capture = null;    // 小游戏接管手指 {down, move, up}
  E.onFloor = null;
  E.onActor = null;
  E.hs = h => { E.unhs(h.id); E.hot.push(h); return h; };
  E.unhs = id => { E.hot = E.hot.filter(h => h.id !== id); };
  function hit(h, p) {
    if (h.r) return Math.hypot(p.x - h.x, p.y - h.y) < h.r;
    if (h.rx) return ((p.x - h.x) / h.rx) ** 2 + ((p.y - h.y) / h.ry) ** 2 < 1;
    return Math.abs(p.x - h.x) < h.w / 2 && Math.abs(p.y - h.y) < h.h / 2;
  }
  async function runHot(h, p) {
    E.busy++;
    try {
      if (h.walk !== false && E.actors.hh) {
        const to = h.walk || { x: h.x, y: E.actors.hh.y };
        await E.walk('hh', to.x, to.y);
        E.face('hh', h.x);
      }
      await h.on(p);
    } catch (e) { HH.log('hot error', e); } finally { E.busy--; }
  }
  E.tapHot = id => { const h = E.hot.find(x => x.id === id); return h ? runHot(h, { x: h.x, y: h.y }) : Promise.resolve(); };
  /* 等玩家点某一个地方（脚本里用），返回 Promise */
  E.waitTap = h => new Promise(res => {
    const on = h.on;
    E.hs(Object.assign({ always: true }, h, { on: async p => { E.unhs(h.id); if (on) await on(p); res(p); } }));
    if (HH.auto) setTimeout(() => E.tapHot(h.id), 30);
  });
  /* 等某个条件成立 */
  E.until = (fn, autoFn) => new Promise(res => {
    if (HH.auto && autoFn) setTimeout(autoFn, 30);
    const iv = setInterval(() => { if (fn()) { clearInterval(iv); res(); } }, 80);
  });
  let down = null;
  cv.addEventListener('pointerdown', e => {
    HH.audio();
    const p = E.toWorld(e.clientX, e.clientY);
    down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, id: e.pointerId };
    try { cv.setPointerCapture(e.pointerId); } catch (er) { }
    if (E.capture && E.capture.down) E.capture.down(p, e);
  });
  cv.addEventListener('pointermove', e => {
    if (!down || e.pointerId !== down.id) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 14) down.moved = true;
    if (E.capture && E.capture.move) E.capture.move(E.toWorld(e.clientX, e.clientY), e, down);
  });
  const up = e => {
    if (!down || e.pointerId !== down.id) return;
    const d = down; down = null;
    const p = E.toWorld(e.clientX, e.clientY);
    if (E.capture) { if (E.capture.up) E.capture.up(p, e, d); if (!d.moved && E.capture.tap) E.capture.tap(p, e); return; }
    if (d.moved || performance.now() - d.t > 900) return;
    tap(p);
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', e => { if (down && e.pointerId === down.id) down = null; });
  function tap(p) {
    if (E.busy) return;
    const hs = E.hot.filter(h => (h.always || E.free) && (!h.when || h.when()) && hit(h, p)).sort((a, b) => (b.prio || 0) - (a.prio || 0));
    if (hs.length) { HH.sfx('click'); runHot(hs[0], p); return; }
    if (E.free && E.onActor) {
      const list = Object.values(E.actors).filter(a => a.vis && a.id !== 'hh').sort((a, b) => b.y - a.y);
      for (const a of list) {
        const b = a.box();
        if (p.x > b.x0 + b.w * .12 && p.x < b.x1 - b.w * .12 && p.y > b.y0 && p.y < b.y1) {
          E.busy++;
          const near = { x: a.x + (E.actors.hh.x < a.x ? -1 : 1) * (b.w * .5 + E.actors.hh.h * .3), y: a.y + 6 };
          E.walk('hh', near.x, near.y).then(() => { E.face('hh', a.x); a.flip = E.actors.hh.x < a.x; return E.onActor(a.id); })
            .catch(er => HH.log(er)).finally(() => E.busy--);
          return;
        }
      }
    }
    if (E.free && E.actors.hh) {
      const q = E.nearest(p);
      ring = { x: q.x, y: q.y, t: 0 };
      if (E.onFloor) E.onFloor(q);
      E.walk('hh', q.x, q.y);
    }
  }
  let ring = null;

  /* ---------- 每一帧 ---------- */
  let now = performance.now(), last = now;
  E.time = () => now / 1000;
  E.frameHooks = [];
  function update(dt) {
    if (camAnim) {
      const k = HH.clamp((now - camAnim.t0) / camAnim.ms, 0, 1), e = HH.ease(k);
      for (const key of ['x', 'y', 'z']) E.cam[key] = HH.lerp(camAnim.from[key], camAnim.to[key], e);
      if (k >= 1) { const r = camAnim.res; camAnim = null; r(); }
    }
    if (E.follow && !camAnim) {
      const a = E.actors[E.follow];
      if (a) { E.cam.x += (a.x - E.cam.x) * Math.min(1, dt * 2.5); clampCam(E.cam); }
    }
    for (const a of Object.values(E.actors)) {
      a.t += dt;
      if (a.path.length) {
        const tgt = a.path[0], dx = tgt.x - a.x, dy = tgt.y - a.y, d = Math.hypot(dx, dy);
        const v = a.h * 1.9 * (a.speedK || 1) * dt;
        if (Math.abs(dx) > 2) a.flip = dx < 0;
        if (d <= v || d < .01) { a.x = tgt.x; a.y = tgt.y; a.path.shift(); }
        else { a.x += dx / d * v; a.y += dy / d * v; }
        if (!isFinite(a.x) || !isFinite(a.y)) { HH.errors.push('nan ' + a.id + ' ' + JSON.stringify(tgt) + ' dt=' + dt + ' v=' + v + ' h=' + a.h); a.x = isFinite(tgt.x) ? tgt.x : 836; a.y = isFinite(tgt.y) ? tgt.y : 800; a.path = []; }
        a.moving = a.path.length > 0;
        if (a.id === 'hh' && a.moving && Math.floor(a.t * 3.4) !== Math.floor((a.t - dt) * 3.4)) HH.sfx('step');
        if (!a.moving && a.arrive) { const r = a.arrive; a.arrive = null; r(); }
      } else a.moving = false;
      if (a.float) a.z = a.float + Math.sin(a.t * 2.6 + a.phase) * 10;
      a.sq *= Math.pow(.02, dt); a.wob *= Math.pow(.15, dt); a.shake *= Math.pow(.1, dt); a.sweat = Math.max(0, a.sweat - dt * .2);
    }
    if (E.scene.update) E.scene.update(dt, now / 1000);
    for (const f of E.frameHooks) f(dt);
  }
  function drawActor(a) {
    if (!a.vis) return;
    const im = a.im; if (!E.ok(im)) return;
    const h = a.h, w = h * E.iw(im) / E.ih(im), t = a.t;
    let bob = 0, rot = a.rot, sx = 1, sy = 1;
    const hasWalk = a.id === 'hh';
    if (a.moving) { bob = Math.abs(Math.sin(t * 10)) * h * .045; if (!hasWalk) rot += Math.sin(t * 10) * .07; }
    else { sy = 1 + Math.sin(t * 2.4 + a.phase) * .012; sx = 1 - (sy - 1) * .6; }
    sy *= 1 - a.sq; sx *= 1 + a.sq * .7;
    rot += Math.sin(t * 17) * a.wob;
    const z = a.z + a.hopZ() + bob;
    // 影子
    if (a.z < 5) {
      g.globalAlpha = .22 * a.alpha * HH.clamp(1 - (a.hopZ() + bob) / h, .3, 1);
      g.fillStyle = '#2b1a10'; g.beginPath(); g.ellipse(a.x, a.y, w * .34, w * .09, 0, 0, 7); g.fill();
    }
    g.save();
    g.globalAlpha = a.alpha;
    g.translate(a.x + Math.sin(t * 40) * a.shake * h * .03, a.y - z);
    g.rotate(rot); g.scale(a.flip ? -sx : sx, sy);
    g.drawImage(im, -w / 2, -h, w, h);
    g.restore();
    if (a.sweat > 0) { // 害羞的汗珠
      g.globalAlpha = Math.min(1, a.sweat * 2); g.fillStyle = '#8fd3ff'; g.strokeStyle = '#3a6f9a'; g.lineWidth = h * .01;
      const sx2 = a.x + w * .3, sy2 = a.y - z - h * .86 + Math.sin(t * 4) * h * .01;
      g.beginPath(); g.moveTo(sx2, sy2 - h * .05); g.quadraticCurveTo(sx2 + h * .035, sy2, sx2, sy2 + h * .02); g.quadraticCurveTo(sx2 - h * .035, sy2, sx2, sy2 - h * .05); g.fill(); g.stroke();
      g.globalAlpha = 1;
    }
    g.globalAlpha = 1;
  }
  E.drawActor = drawActor;
  function draw() {
    const sc = E.scene;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#2b1d14'; g.fillRect(0, 0, cv.width, cv.height);
    if (!sc) return;
    const s = E.scale() * dpr;
    g.setTransform(s, 0, 0, s, cv.width / 2 - E.cam.x * s, cv.height / 2 - E.cam.y * s);
    if (sc.drawSky) sc.drawSky(g, now / 1000);
    if (E.ok(sc.bgImg)) g.drawImage(sc.bgImg, 0, 0, sc.w, sc.h);
    if (sc.drawBack) sc.drawBack(g, now / 1000);
    // 点地板的小圈
    if (ring) {
      ring.t += 1 / 60; const k = ring.t / .5;
      if (k >= 1) ring = null;
      else { g.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; g.lineWidth = 4; g.beginPath(); g.ellipse(ring.x, ring.y, 30 + k * 40, (30 + k * 40) * .3, 0, 0, 7); g.stroke(); }
    }
    const list = [...Object.values(E.actors).map(a => ({ y: a.y + (a.onTop || 0) * .01, a })), ...E.props.map(p => ({ y: p.y + (p.dy || 0), p }))];
    list.sort((u, v) => u.y - v.y);
    for (const it of list) {
      if (it.a) drawActor(it.a);
      else if (it.p.vis !== false) { g.save(); it.p.draw(g, now / 1000); g.restore(); }
    }
    if (sc.drawFront) sc.drawFront(g, now / 1000);
    // 提示用的闪光
    for (const h of E.hot) {
      if (!h.sparkle || (h.when && !h.when()) || !(h.always || E.free)) continue;
      const tt = now / 1000 + (h.x % 7), r = (h.sr || 26) * (1 + .25 * Math.sin(tt * 4));
      g.save(); g.translate(h.sx != null ? h.sx : h.x, h.sy != null ? h.sy : h.y); g.rotate(tt * .8);
      g.globalAlpha = .55 + .45 * Math.sin(tt * 4); g.fillStyle = '#fff6b0';
      g.beginPath(); for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4, rr = j % 2 ? r * .28 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill();
      g.restore();
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (sc.overlay) sc.overlay(g, W, H, now / 1000);
  }
  function frame(t) {
    now = t; const dt = HH.clamp((t - last) / 1000, 0, .05); last = t;  // 第一帧的时间可能比上一次早，dt 不能是负的
    try { if (E.scene) update(dt); draw(); } catch (e) { HH.log('frame', e); }
    HH.fxFrame(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* 截一张小照片（存相册） */
  E.snapshot = (wd = 560) => {
    try {
      const c = document.createElement('canvas'); c.width = wd; c.height = Math.round(wd * cv.height / cv.width);
      c.getContext('2d').drawImage(cv, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', .72);
    } catch (e) { return ''; }
  };
  /* 世界坐标的工具 */
  E.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
})();
