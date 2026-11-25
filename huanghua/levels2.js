/* 黄花的生活：第二站 操场（2-1 水坑捞月、2-2 叠罗汉、2-3 抬头看），还有踢球小游戏 */
(function () {
  const HH = window.HH, D = HH.D, E = HH.E, UI = HH.UI, S = HH.S, L = HH.L;
  const say = UI.say, sleep = HH.sleep;

  /* ---------- 天空（镜头往上摇时看到的） ---------- */
  let skyTop = [104, 104, 204];
  const stars = []; { let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 120; i++) stars.push([r() * 1672, -60 - r() * 760, .6 + r() * 1.8, r() * 6]); }
  function sampleSky(im) {
    try { const c = document.createElement('canvas'); c.width = 64; c.height = 4; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 64, 4);
      const d = x.getImageData(0, 0, 64, 1).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < 64; i++) { r += d[i * 4]; gg += d[i * 4 + 1]; b += d[i * 4 + 2]; } skyTop = [r / 64 | 0, gg / 64 | 0, b / 64 | 0]; } catch (e) { }
  }
  const MOON = { x: 1070, y: -470, r: 50 };
  function drawMoon(g, x, y, r, t) {
    const gl = g.createRadialGradient(x, y, r * .6, x, y, r * 3.2);
    gl.addColorStop(0, 'rgba(255,244,190,.55)'); gl.addColorStop(1, 'rgba(255,244,190,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 3.2, 0, 7); g.fill();
    const body = g.createRadialGradient(x - r * .3, y - r * .3, r * .2, x, y, r);
    body.addColorStop(0, '#fffbe6'); body.addColorStop(1, '#ffe08a');
    g.fillStyle = body; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = 'rgba(214,170,80,.35)';
    for (const [dx, dy, rr] of [[-.3, -.2, .16], [.25, .15, .22], [-.1, .4, .12], [.35, -.35, .1]]) { g.beginPath(); g.arc(x + dx * r, y + dy * r, rr * r, 0, 7); g.fill(); }
  }
  L.drawMoon = drawMoon;

  /* ---------- 水坑里的月亮 ---------- */
  const pud = L.pud = { x: 720, y: 772, rx: 42, ry: 12, amp: 0, shat: 0, rip: [], on: true };
  L.ripple = (x, y, big) => { pud.rip.push({ x, y, t: 0, life: big ? 1.4 : .9, big }); pud.amp = Math.min(1.4, pud.amp + (big ? .9 : .35)); };
  function drawPuddle(g, t) {
    if (!pud.on) return;
    g.save();
    const gl = g.createRadialGradient(pud.x, pud.y, 2, pud.x, pud.y, pud.rx * 2.6);
    gl.addColorStop(0, 'rgba(255,240,170,' + (.5 * (1 - pud.shat * .6)) + ')'); gl.addColorStop(1, 'rgba(255,240,170,0)');
    g.translate(pud.x, pud.y); g.scale(1, .32); g.fillStyle = gl; g.beginPath(); g.arc(0, 0, pud.rx * 2.6, 0, 7); g.fill();
    g.restore();
    const n = 7;
    for (let i = 0; i < n; i++) {
      const y0 = pud.y - pud.ry + i * 2 * pud.ry / n, yc = y0 + pud.ry / n, q = (yc - pud.y) / pud.ry;
      const hw = pud.rx * Math.sqrt(Math.max(0, 1 - q * q));
      const off = pud.amp * Math.sin(t * 9 + i * 1.3) * pud.rx * .45 + pud.shat * (i - 3) * 26 * (i % 2 ? 1 : -1);
      g.globalAlpha = 1 - pud.shat * .55;
      g.fillStyle = i % 2 ? '#fff4b8' : '#ffeaa0';
      g.fillRect(pud.x - hw + off, y0, hw * 2, 2 * pud.ry / n + .6);
    }
    g.globalAlpha = 1;
    for (const r of pud.rip) {
      const k = r.t / r.life, rx = (r.big ? 30 : 16) + k * (r.big ? 220 : 110);
      g.strokeStyle = 'rgba(255,255,255,' + (.7 * (1 - k)) + ')'; g.lineWidth = 3 * (1 - k) + 1;
      g.beginPath(); g.ellipse(r.x, r.y, rx, rx * .26, 0, 0, 7); g.stroke();
    }
  }
  /* 路灯、风筝 */
  const lamp = L.lamp = { glow: .35, focus: 0, flare: 0 };
  function drawLamp(g, t) {
    const a = lamp.glow + lamp.focus * (.35 + .25 * Math.sin(t * 5)) + lamp.flare;
    const r = 70 + lamp.focus * 26 + lamp.flare * 90;
    const gl = g.createRadialGradient(1590, 108, 8, 1590, 108, r);
    gl.addColorStop(0, 'rgba(255,246,200,' + Math.min(1, a) + ')'); gl.addColorStop(1, 'rgba(255,230,150,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(1590, 108, r, 0, 7); g.fill();
  }
  function drawKite(g, t) {
    g.save(); g.translate(1488, 240); g.rotate(-.25 + Math.sin(t * 1.6) * .06);
    g.fillStyle = '#ffd84d'; g.strokeStyle = '#7a4b12'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(0, 0, 20, Math.PI * .3, Math.PI * 1.7); g.arc(9, -2, 15, Math.PI * 1.62, Math.PI * .38, true); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#ff6b6b'; g.lineWidth = 2; g.beginPath(); g.moveTo(-6, 18);
    for (let i = 1; i < 6; i++) g.lineTo(-6 + Math.sin(t * 3 + i) * 5, 18 + i * 9); g.stroke();
    g.restore();
  }
  /* 踢球：瞄准线 */
  const kick = L.kick = { on: false, aim: null, goals: 0 };
  function drawAim(g) {
    if (!kick.aim) return;
    const { x, y, dx, dy, pw } = kick.aim;
    g.save(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.fillStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; g.setLineDash([12, 10]);
    const ex = x + dx * (80 + pw * 220), ey = y + dy * (80 + pw * 220);
    g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.stroke(); g.setLineDash([]);
    const a = Math.atan2(dy, dx); g.beginPath(); g.moveTo(ex + Math.cos(a) * 22, ey + Math.sin(a) * 22); g.lineTo(ex + Math.cos(a + 2.5) * 20, ey + Math.sin(a + 2.5) * 20); g.lineTo(ex + Math.cos(a - 2.5) * 20, ey + Math.sin(a - 2.5) * 20); g.fill();
    g.restore();
  }
  /* 叠罗汉：对准的提示线 */
  const tw = L.tw = { mark: null };
  function drawMark(g, t) {
    if (!tw.mark) return;
    const m = tw.mark, ok = m.ok;
    g.save(); g.strokeStyle = ok ? 'rgba(120,255,140,.95)' : 'rgba(255,255,255,.6)'; g.lineWidth = ok ? 6 : 4; g.setLineDash([10, 8]);
    g.beginPath(); g.moveTo(m.x, m.y - 40); g.lineTo(m.x, m.y + 10); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.ellipse(m.x, m.y + 10, 34, 10, 0, 0, 7); g.stroke();
    g.restore();
  }

  const PLAY = L.PLAY = {
    id: 'play', bg: 'bg/playground_dusk.jpg', minY: -820,
    size: y => 105 + (y - 450) * .44,
    walk: [[[0, 480], [1672, 480], [1672, 941], [560, 941], [420, 880], [300, 822], [160, 772], [0, 752]]],
    block: [{ x: 640, y: 770, rx: 440, ry: 84 }],
    wps: [[170, 690], [640, 668], [1110, 700], [1130, 840], [700, 885]],
    cam: { x: 836, y: 470, z: 1 },
    drawSky(g, t) {
      if (E.cam.y - 470 / E.cam.z > 40) return;
      const gr = g.createLinearGradient(0, -820, 0, 2);
      gr.addColorStop(0, '#0d1238'); gr.addColorStop(.55, '#2b2f78'); gr.addColorStop(1, 'rgb(' + skyTop.join(',') + ')');
      g.fillStyle = gr; g.fillRect(-10, -830, 1692, 834);
      for (const [x, y, r, ph] of stars) { g.globalAlpha = HH.clamp((-y - 80) / 300, 0, 1) * (.5 + .5 * Math.sin(t * 2 + ph)); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
      g.globalAlpha = 1;
      drawMoon(g, MOON.x, MOON.y, MOON.r, t);
    },
    drawBack(g, t) {
      // 接缝：天空和图片顶上柔和过渡
      const f = g.createLinearGradient(0, -2, 0, 60); f.addColorStop(0, 'rgba(' + skyTop.join(',') + ',1)'); f.addColorStop(1, 'rgba(' + skyTop.join(',') + ',0)');
      g.fillStyle = f; g.fillRect(-10, -2, 1692, 62);
      drawPuddle(g, t); drawKite(g, t);
    },
    drawFront(g, t) { drawLamp(g, t); drawAim(g); drawMark(g, t); },
    update(dt) {
      pud.amp *= Math.pow(.25, dt); pud.shat = Math.max(0, pud.shat - dt * .7);
      for (const r of pud.rip) r.t += dt; pud.rip = pud.rip.filter(r => r.t < r.life);
      lamp.flare = Math.max(0, lamp.flare - dt * .5);
      ballStep(dt);
      // 叠罗汉的小伙伴轻轻晃
      for (const a of Object.values(E.actors)) if (a.onTop) a.rot = Math.sin(a.t * 2.2 + a.onTop) * .018 * a.onTop;
    },
  };
  const SPOT2 = { hh: [540, 640], al: [300, 610], mm: [450, 548], cm: [690, 590], bk: [880, 552], hu: [1010, 600] };
  L.setPlay = (o = {}) => {
    E.load(PLAY);
    if (E.ok(E.img(PLAY.bg))) sampleSky(E.img(PLAY.bg)); else E.img(PLAY.bg).addEventListener('load', () => sampleSky(E.img(PLAY.bg)), { once: true });
    HH.music('dusk');
    pud.on = true; pud.shat = 0; lamp.focus = 0; lamp.flare = 0; tw.mark = null; kick.on = false; kick.aim = null;
    const at = o.at || SPOT2;
    for (const id of o.who || ['al', 'mm', 'cm', 'bk', 'hu', 'hh']) if (at[id]) E.add(id, at[id][0], at[id][1]);
    E.onActor = L.chat; E.onFloor = null;
    // 月亮彩蛋
    const st = (id, h, line) => E.hs(Object.assign({ id: 'st_' + id, prio: 2, on: async () => { await E.hop('hh', null, 420); await UI.sticker(id, line); } }, h));
    st('m_circle', { x: 775, y: 535, rx: 170, ry: 26, walk: { x: 775, y: 560 } }, 'st_circle');
    st('m_kite', { x: 1488, y: 245, r: 40, walk: { x: 1480, y: 500 } }, 'st_kite');
    st('m_lamp', { x: 1585, y: 690, r: 55, walk: { x: 1520, y: 700 } }, 'st_lamp');
  };

  /* ---------- 球 ---------- */
  const ball = L.ball = { x: 1190, y: 662, z: 0, vx: 0, vy: 0, vz: 0, home: [1190, 662], fly: false, scored: false, judged: false };
  function ballProp() {
    const im = E.img('item/ball.webp');
    E.prop({ id: 'ball', get y() { return ball.y; }, draw(g, t) {
      if (!E.ok(im)) return;
      const d = PLAY.size(ball.y) * .2;
      g.globalAlpha = .25; g.fillStyle = '#2b1a10'; g.beginPath(); g.ellipse(ball.x, ball.y, d * .5, d * .14, 0, 0, 7); g.fill(); g.globalAlpha = 1;
      g.translate(ball.x, ball.y - ball.z - d / 2); g.rotate((ball.x + ball.y) * .03); g.drawImage(im, -d / 2, -d / 2, d, d);
    } });
  }
  function ballStep(dt) {
    // 守门员没事的时候在球门前走来走去
    const kp0 = E.actors.hu;
    if (kick.on && kp0 && kick.keeper && !ball.fly) { kick.pt = (kick.pt || 0) + dt; kp0.x = 1247 + 72 * Math.sin(kick.pt * 1.7); }
    if (!ball.fly) return;
    const py = ball.y;
    ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt; ball.vz -= 900 * dt;
    if (ball.z < 0) { ball.z = 0; ball.vz = -ball.vz * .42; ball.vx *= .8; ball.vy *= .8; if (Math.abs(ball.vz) < 40) ball.vz = 0; }
    if (ball.z === 0) { const f = Math.pow(.25, dt); ball.vx *= f; ball.vy *= f; }
    const kp = E.actors.hu;
    if (kick.on && kp && !ball.judged) {
      kick.shots = kick.shots || 0;
      // 守门员：慢半拍，有时扑反方向
      kick.react = (kick.react || 0) + dt;
      if (kick.react > .22) {
        const guess = HH.clamp(ball.x + ball.vx * .4, 1165, 1330), tx = kick.wrong ? (guess < 1247 ? 1335 : 1160) : guess;
        kp.x += HH.clamp(HH.clamp(tx, 1165, 1330) - kp.x, -135 * dt, 135 * dt);
      }
      if (py > 490 && ball.y <= 490) {
        ball.judged = true;
        if (ball.x > 1148 && ball.x < 1348 && ball.z < 104) {
          if (!kick.lucky && Math.abs(ball.x - kp.x) < 40 && ball.z < 80) { ball.vy = Math.abs(ball.vy) * .45; ball.vx *= -.3; kick.result = 'save'; }
          else { ball.vy *= .15; ball.vx *= .15; ball.vz = 0; kick.result = 'goal'; }
        } else kick.result = 'miss';
      }
    }
    if (ball.y < 430 || ball.x < -50 || ball.x > 1720) { ball.vx = ball.vy = 0; }
    if (Math.hypot(ball.vx, ball.vy) < 12 && ball.z === 0) { ball.fly = false; ball.vx = ball.vy = 0; }
  }
  async function kickGame() {
    if (kick.on) return;
    kick.on = true; E.free = false;
    const hh = E.actors.hh, hu = E.actors.hu;
    const quit = UI.el('div', 'acts'); const qb = UI.el('button', 'act small', '不踢了'); quit.appendChild(qb); HH.$('#layer').appendChild(quit);
    let quitting = false; qb.onclick = () => { quitting = true; HH.sfx('pop'); };
    HH.music('play');
    kick.keeper = false; E.walk('hu', 1247, 492).then(() => { kick.keeper = true; });
    if (!S.side.kickHelp) { await say('k01'); }
    const reset = async () => { ball.x = ball.home[0]; ball.y = ball.home[1]; ball.z = 0; ball.fly = false; ball.judged = false; kick.result = null; await E.walk('hh', ball.x - 60, ball.y + 38); E.face('hh', ball.x + 50); };
    await reset();
    if (!S.side.kickHelp) { S.side.kickHelp = 1; HH.save(); await say('k02', { hold: 0 }); }
    const hint = UI.hand(ball.x, ball.y - 10);
    while (!quitting) {
      const shot = await new Promise(res => {
        E.capture = {
          down: p => { const s = E.toScreen(ball.x, ball.y), q = E.toScreen(p.x, p.y); kick.drag = Math.hypot(s.x - q.x, s.y - q.y) < 130 ? p : null; },
          move: p => {
            if (!kick.drag) return;
            let dx = ball.x - p.x, dy = ball.y - p.y; const l = Math.hypot(dx, dy);
            if (l < 8) { kick.aim = null; return; }
            dx /= l; dy /= l; if (dy > -.15) { dy = -.15; const k = Math.hypot(dx, dy); dx /= k; dy /= k; }
            kick.aim = { x: ball.x, y: ball.y, dx, dy, pw: HH.clamp(l / 160, .15, 1) };
          },
          up: () => { const a = kick.aim; kick.aim = null; kick.drag = null; if (a) res(a); },
        };
        const iv = setInterval(() => { if (quitting) { clearInterval(iv); res(null); } }, 100);
        if (HH.auto) setTimeout(() => res({ dx: .55, dy: -.83, pw: .8 }), 30);
      });
      E.capture = null; hint.kill();
      if (!shot) break;
      HH.sfx('kick'); hh.sq = .2;
      // 帮小朋友瞄一点：往球门中间偏
      let gx = 1248 - ball.x, gy = 490 - ball.y; const gl = Math.hypot(gx, gy); gx /= gl; gy /= gl;
      let dx = shot.dx * .5 + gx * .5, dy = shot.dy * .5 + gy * .5; const dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
      const sp = 380 + shot.pw * 620;
      kick.react = 0; kick.shots = (kick.shots || 0) + 1; kick.lucky = kick.shots <= 2; kick.wrong = kick.lucky || Math.random() < .35;
      if (kick.lucky) { const kp = E.actors.hu; if (kp) kp.wob = .25; }
      Object.assign(ball, { vx: dx * sp, vy: dy * sp, vz: 120 + shot.pw * 240, fly: true, judged: false });
      kick.result = null;
      await E.until(() => !ball.fly || kick.result === 'goal');
      await sleep(300);
      if (kick.result === 'goal') {
        HH.sfx('goal'); HH.buzz(60); kick.goals++;
        const p = E.toScreen(1250, 430); HH.burst(p.x, p.y, 40, { kind: 'star', col: 'rainbow' });
        E.hop('hh', 60); hu.shake = 1;
        await say('k_goal');
        if (kick.goals === 3) { await say('k_star', { hold: 0 }); await UI.sticker('q_goal'); }
      } else if (kick.result === 'save') { E.hop('hu', 40); await say('k_save'); }
      else { await say('k_miss'); }
      if (HH.auto) quitting = true;
      await reset();
    }
    E.capture = null; quit.remove(); kick.keeper = false;
    E.walk('hu', SPOT2.hu[0], SPOT2.hu[1]);
    ball.x = ball.home[0]; ball.y = ball.home[1];
    HH.music('dusk');
    kick.on = false; E.free = true;
  }

  /* ---------- 2-1 水坑捞月 ---------- */
  L.RUN.s2a = async () => {
    L.setPlay({ who: [] });
    ballProp();
    UI.hudShow(true);
    await say('d01');
    // 大家从教学楼走出来
    const ids = ['hh', 'hu', 'cm', 'mm', 'bk', 'al'];
    await Promise.all(ids.map((id, i) => sleep(i * 300).then(() => { E.add(id, 238, 486); return E.walk(id, SPOT2[id][0], SPOT2[id][1]); })));
    E.hop('hu');
    await say(S.side.ball ? 'd02b' : 'd02');
    E.hs({ id: 'ball', x: 1190, y: 652, r: 60, prio: 2, walk: false, when: () => !kick.on, on: kickGame });
    let started = false;
    E.hs({ id: 'puddle', x: 640, y: 770, rx: 440, ry: 84, prio: 1, walk: { x: 600, y: 672 }, sparkle: true, sx: 720, sy: 760, sr: 30,
      when: () => !kick.on && !started, on: async () => { started = true; } });
    // 在水坑里划一划，会起波纹
    const baseFloor = p => { if (((p.x - 640) / 440) ** 2 + ((p.y - 770) / 84) ** 2 < 1) L.ripple(p.x, p.y); };
    E.onFloor = baseFloor;
    await say('d03', { hold: 0 });
    E.free = true;
    let idle = 0;
    const iv = setInterval(() => { if (!E.busy && !kick.on && ++idle === 30) { idle = 0; say('d03'); } }, 1000);
    await E.until(() => started && !E.busy, () => E.tapHot('puddle'));
    clearInterval(iv);
    E.free = false; E.unhs('ball'); E.onFloor = null;
    // 大家围到水坑边
    const ring = { hh: [600, 672], bk: [790, 670], hu: [960, 690], al: [1135, 770], cm: [420, 684], mm: [300, 706] };
    await Promise.all(Object.entries(ring).map(([id, [x, y]]) => E.walk(id, x, y)));
    for (const id of Object.keys(ring)) E.face(id, pud.x);
    L.ripple(pud.x, pud.y);
    await E.camTo({ x: 720, y: 640, z: 1.35 }, 900);
    E.hop('bk'); await say('e01');
    await say('e02');
    await UI.quiz('shui', { prompt: 'e03' });
    await say('e04', { hold: 0 });
    // 一边等按钮，一边可以拨水
    E.capture = { down: p => { if (((p.x - 640) / 440) ** 2 + ((p.y - 770) / 84) ** 2 < 1) L.ripple(p.x, p.y); }, move: p => { if (Math.random() < .2 && ((p.x - 640) / 440) ** 2 + ((p.y - 770) / 84) ** 2 < 1) L.ripple(p.x, p.y); } };
    const tries = [
      { who: 'hh', line: 'e05', act: async () => { await netScoop(); } },
      { who: 'hu', line: 'e06', act: async () => { await E.walk('hu', 840, 694); E.face('hu', pud.x); E.hop('hu', 30); await sleep(200); shatter(); } },
      { who: 'al', line: 'e07', act: async () => { await E.walk('al', 1080, 790); E.face('al', pud.x); E.actors.al.wob = .1; await sleep(400); shatter(); } },
    ];
    for (let i = 0; i < tries.length; i++) {
      await UI.acts([{ t: '捞', img: 'item/net.webp' }]);
      E.capture = null;
      const tr = tries[i];
      if (i === 2) { await say(tr.line); await tr.act(); HH.sfx('spray'); for (let k = 0; k < 6; k++) { const p = E.toScreen(1000 - k * 90, 600); HH.burst(p.x, p.y, 18, { kind: 'drop', col: 'water', speed: 360, up: 200 }); } HH.sfx('laugh'); for (const id of ['hh', 'bk', 'hu', 'cm', 'mm']) E.actors[id].shake = 1; await say('e08'); await say('e09'); }
      else { await tr.act(); await say(tr.line); }
      E.capture = { down: p => { if (((p.x - 640) / 440) ** 2 + ((p.y - 770) / 84) ** 2 < 1) L.ripple(p.x, p.y); } };
      if (i < 2) await say('e04', { hold: 0 });
    }
    E.capture = null;
    await say('e10');
    // 大家抬头：杆子上的"月亮"
    await E.camTo({ x: 1300, y: 330, z: 1.2 }, 1200);
    lamp.focus = 1;
    for (const id of Object.keys(ring)) E.face(id, 1590);
    E.hop('cm'); await say('e11');
    await say('e12');
    await E.camTo({ x: 836, y: 470, z: 1 }, 900);
  };
  async function netScoop() {
    const hh = E.actors.hh;
    await E.walk('hh', 680, 676); E.face('hh', pud.x);
    const net = L.itemProp('netp', 'net', 700, 700, 90, { rot: -.9, dy: 200 });
    for (let i = 0; i <= 10; i++) { net.rot = -.9 + i * .13; net.x = 690 + i * 3; net.y = 690 + i * 8; net.z = 70 - i * 6; await sleep(30); }
    shatter();
    await sleep(300);
    for (let i = 0; i <= 10; i++) { net.rot = .4 - i * .1; net.z = 10 + i * 10; await sleep(35); }
    for (let k = 0; k < 4; k++) { HH.sfx('drip'); const p = E.toScreen(net.x, net.y - net.z - 40); HH.burst(p.x, p.y, 4, { kind: 'drop', col: 'water', speed: 60, up: 0, g: 600 }); await sleep(160); }
    E.unprop('netp');
    hh.sq = .1;
  }
  function shatter() { HH.sfx('splash'); pud.shat = 1; L.ripple(pud.x, pud.y, true); const p = E.toScreen(pud.x, pud.y); HH.burst(p.x, p.y, 26, { kind: 'drop', col: 'water', speed: 300, up: 160 }); HH.buzz(30); }

  /* ---------- 2-2 叠罗汉 ---------- */
  const BASE = { x: 1528, y: 490 };
  const TOWER_CAM = { x: 1380, y: 262, z: 1.3 };
  const TOP = { al: .9, hu: .9, cm: .72, hh: 1 };
  L.RUN.s2b = async () => {
    L.setPlay({ at: { hh: [1290, 586], al: [1380, 612], mm: [1470, 650], cm: [1210, 604], bk: [1400, 668], hu: [1120, 580] } });
    lamp.focus = 1;
    await E.camTo({ x: 1300, y: 330, z: 1.2 }, 10);
    await say('f01');
    await E.camTo(TOWER_CAM, 900);
    E.hop('al'); await say('f02');
    const tower = [];
    const fixH = PLAY.size(BASE.y);
    const topZ = () => tower.reduce((s, a) => s + a.h * TOP[a.id], 0);
    // 阿兰站到最下面
    const al = E.actors.al; al.hFix = fixH;
    await E.walk('al', BASE.x, BASE.y, { free: true });
    al.flip = true; tower.push(al);
    await UI.quiz('wen', { prompt: 'f03' });
    al.sq = .15; await say('f04');
    // 一个一个叠上去
    const climbers = [
      { id: 'hu', pre: async () => { await UI.quiz('shang', { prompt: 'f07' }); await say('f06'); } , post: async () => { await say('f08'); } },
      { id: 'cm', pre: async () => { await UI.quiz('gao', { prompt: 'f10' }); }, post: async () => { await say('f11'); await say('f09'); } },
    ];
    let first = true;
    for (const c of climbers) {
      await c.pre();
      if (first) { first = false; await say('f05', { hold: 0 }); }
      await climb(c.id, tower, topZ, fixH);
      await c.post();
    }
    // 黄花最后
    await say('f12');
    await UI.quiz('la', { prompt: 'f13' });
    await say('f14');
    await climb('hh', tower, topZ, fixH, true);
    await E.camTo({ x: 1400, y: 240, z: 1.42 }, 800);
    await say('f15');
    const hh = E.actors.hh;
    hh.pose = 'reach'; hh.sq = -.1;
    await sleep(500);
    lamp.flare = 1; HH.sfx('magic'); HH.buzz(80);
    { const p = E.toScreen(1590, 108); HH.burst(p.x, p.y, 40, { kind: 'star', speed: 320 }); }
    hh.shake = .8;
    await say('f16');
    hh.pose = 'stand';
    await UI.petal('hezuo');
    lamp.focus = 0;
  };
  /* 一个小伙伴爬上去：在上面晃，点准了就站稳 */
  async function climb(id, tower, topZ, fixH, auto) {
    const a = E.actors[id];
    const ground = { x: a.x, y: a.y };
    let misses = 0;
    for (;;) {
      a.hFix = fixH;
      // 跳上去
      const z1 = topZ(), x0 = a.x, y0 = a.y;
      HH.sfx('hop');
      for (let i = 1; i <= 14; i++) { const k = i / 14; a.x = HH.lerp(x0, BASE.x, k); a.y = HH.lerp(y0, BASE.y, k); a.z = z1 * k + Math.sin(k * Math.PI) * 60 + 30 * k; await sleep(28); }
      a.onTop = tower.length;
      if (auto) { for (let i = 1; i <= 8; i++) { a.z = z1 + 30 * (1 - i / 8); await sleep(30); } break; }
      // 晃来晃去，等玩家点
      const A = misses === 0 ? 62 : misses === 1 ? 40 : 0, tol = 26, w0 = performance.now();
      tw.mark = { x: BASE.x, y: BASE.y - z1 - 4, ok: false };
      const res = await new Promise(done => {
        const hook = () => {
          const t = (performance.now() - w0) / 1000;
          a.x = BASE.x + A * Math.sin(t * 2.1); a.z = z1 + 30 + Math.abs(Math.sin(t * 4.2)) * 6;
          tw.mark.ok = Math.abs(a.x - BASE.x) < tol;
        };
        E.frameHooks.push(hook);
        const end = v => { E.frameHooks.splice(E.frameHooks.indexOf(hook), 1); E.capture = null; done(v); };
        E.capture = { tap: () => end(Math.abs(a.x - BASE.x) < tol), down: () => { } };
        if (A === 0 || HH.auto) setTimeout(() => end(true), HH.auto ? 20 : 900);
      });
      tw.mark = null;
      if (res) { a.x = BASE.x; for (let i = 1; i <= 6; i++) { a.z = z1 + 30 * (1 - i / 6); await sleep(25); } a.z = z1; a.sq = .2; HH.sfx('land'); HH.buzz(30); if (misses) await say('f_ok', { hold: 60 }); break; }
      // 没对准：滑下来
      misses++;
      HH.sfx('fall'); a.wob = .2;
      const sx = a.x;
      for (let i = 1; i <= 12; i++) { const k = i / 12; a.x = HH.lerp(sx, ground.x, k); a.y = HH.lerp(BASE.y, ground.y, k); a.z = (z1 + 30) * (1 - k * k); await sleep(30); }
      a.z = 0; a.onTop = 0; a.hFix = null; a.sq = .25; HH.sfx('land');
      await say(misses === 1 ? 'f_miss1' : 'f_miss2', { hold: 60 });
      if (misses >= 2) await say('f_help', { hold: 60 });
    }
    a.z = topZ(); a.flip = !a.flip;
    tower.push(a);
  }

  /* ---------- 2-3 抬头看 ---------- */
  L.RUN.s2c = async () => {
    // 接着叠罗汉：没有从 2-2 接过来就重新叠好
    if (!E.scene || E.scene.id !== 'play' || !E.actors.hh || !E.actors.hh.onTop) {
      L.setPlay({ at: { hh: [1290, 586], al: [1380, 612], mm: [1470, 650], cm: [1210, 604], bk: [1400, 668], hu: [1120, 580] } });
      const fixH = PLAY.size(BASE.y); let z = 0, i = 0;
      for (const id of ['al', 'hu', 'cm', 'hh']) { const a = E.actors[id]; a.hFix = fixH; a.x = BASE.x; a.y = BASE.y; a.z = z; a.onTop = i++; z += a.h * TOP[id]; }
      E.actors.mm.x = 1470; E.actors.bk.x = 1400;
      await E.camTo({ x: 1400, y: 240, z: 1.42 }, 10);
    }
    const hh = E.actors.hh;
    hh.pose = 'stand';
    await say('g01');
    // 往下拉：镜头往天上摇
    const hd = UI.hand(1300, 200, 'down');
    await say('g02', { hold: 0 });
    await new Promise(res => {
      let fired = false;
      const go = () => { if (fired) return; fired = true; E.capture = null; hd.kill(); HH.$$('.acts').forEach(n => n.remove()); res(); };
      E.capture = { move: (p, e, d) => { if (d && e.clientY - d.y > 50) go(); }, tap: () => { } };
      UI.acts([{ t: '⬆ 抬头看' }]).then(go);
    });
    HH.sfx('whoosh');
    await E.camTo({ x: 1300, y: -250, z: 1 }, 2600);
    hh.pose = 'jump'; hh.sq = -.1;
    await say('g03');
    hh.pose = 'stand';
    await UI.quiz('tian', { prompt: 'g04' });
    await say('g05');
    await UI.quiz('kan', { prompt: 'g06' });
    // 望远镜
    await UI.veil(scopeView(), 0, { tapClose: false, onShow: async (v, close) => { await sleep(600); await say('g07'); await say('g08'); await sleep(300); close(); } });
    await say('g09', { hold: 0 });
    await UI.choose(HH.shuffle([{ ic: '💧', lb: '水坑里', no: 'g_no1' }, { ic: '💡', lb: '杆子上', no: 'g_no2' }, { ic: '🌙', lb: '天上', ok: true }]));
    hh.pose = 'jump';
    await say('g10');
    hh.pose = 'stand';
    await say('g11');
    HH.sfx('laugh'); for (const id of ['al', 'hu', 'cm', 'hh', 'mm', 'bk']) if (E.actors[id]) E.actors[id].wob = .12;
    await say('g12');
    await UI.petal('dongnao');
    // 爬下来
    await E.camTo(TOWER_CAM, 1300);
    await say('g13', { hold: 0 });
    const down = [['hh', 1300, 600], ['cm', 1460, 640], ['hu', 1380, 560]];
    for (const [id, x, y] of down) {
      const a = E.actors[id], z0 = a.z, x0 = a.x;
      HH.sfx('hop');
      for (let i = 1; i <= 14; i++) { const k = i / 14; a.x = HH.lerp(x0, x, k); a.y = HH.lerp(BASE.y, y, k); a.z = z0 * (1 - k) + Math.sin(k * Math.PI) * 40; await sleep(30); }
      a.z = 0; a.onTop = 0; a.hFix = null; a.sq = .25; a.rot = 0; HH.sfx('land');
    }
    const al = E.actors.al; al.onTop = 0; al.hFix = null; al.rot = 0;
    await E.walk('al', 1530, 560);
    // 老师来了
    await E.camTo({ x: 1100, y: 470, z: 1.05 }, 1000);
    const ma = E.add('ma', 238, 486);
    await E.walk('ma', 1180, 580);
    for (const id of ['al', 'hu', 'cm', 'hh', 'mm', 'bk']) E.face(id, ma.x);
    ma.flip = false;
    await say('g14'); await say('g15');
    HH.sfx('cheer'); E.hopAll(['cm', 'hh', 'hu', 'al', 'mm', 'bk']); await say('g16');
    // 合影
    const row = { mm: [1010, 640], al: [1130, 650], hh: [1255, 664], cm: [1375, 650], hu: [1490, 642], bk: [1600, 634] };
    await Promise.all(Object.entries(row).map(([id, [x, y]]) => E.walk(id, x, y)));
    await E.walk('ma', 1250, 590);
    for (const id of Object.keys(row)) E.actors[id].flip = false;
    hh.pose = 'jump';
    await E.camTo({ x: 1300, y: 520, z: 1.25 }, 700);
    await UI.photo('s2', '操场捞月亮');
    hh.pose = 'stand';
    await say('end2');
  };
  function scopeView() {
    const box = UI.el('div', 'scope'), c = document.createElement('canvas'); c.width = c.height = 700; box.appendChild(c);
    const g = c.getContext('2d');
    g.fillStyle = '#070b1c'; g.fillRect(0, 0, 700, 700);
    for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,' + Math.random() * .8 + ')'; g.fillRect(Math.random() * 700, Math.random() * 700, 2, 2); }
    const x = 350, y = 350, r = 260;
    const gl = g.createRadialGradient(x, y, r * .8, x, y, r * 1.4); gl.addColorStop(0, 'rgba(255,240,180,.5)'); gl.addColorStop(1, 'rgba(255,240,180,0)');
    g.fillStyle = gl; g.fillRect(0, 0, 700, 700);
    const body = g.createRadialGradient(x - 80, y - 80, 30, x, y, r); body.addColorStop(0, '#fffbea'); body.addColorStop(1, '#f3d27e');
    g.fillStyle = body; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    // 坑坑洼洼
    const cr = [[-120, -60, 46], [70, -120, 30], [110, 60, 58], [-60, 120, 36], [-150, 70, 22], [20, 10, 18], [160, -40, 20], [-20, -170, 24], [50, 170, 20]];
    for (const [dx, dy, rr] of cr) {
      g.fillStyle = 'rgba(205,160,80,.35)'; g.beginPath(); g.arc(x + dx, y + dy, rr, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,240,.6)'; g.lineWidth = 4; g.beginPath(); g.arc(x + dx + 2, y + dy + 2, rr, Math.PI * .1, Math.PI * .9); g.stroke();
    }
    // 淡淡的小兔子影子
    g.fillStyle = 'rgba(190,140,70,.22)';
    g.beginPath(); g.ellipse(x + 10, y + 40, 70, 52, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(x - 50, y - 20, 36, 32, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(x - 70, y - 90, 12, 44, -.3, 0, 7); g.fill();
    g.beginPath(); g.ellipse(x - 40, y - 96, 12, 44, .2, 0, 7); g.fill();
    return box;
  }
})();
