/* 录演示视频用的"小朋友"：像真的小朋友一样慢一点点地答题、点按钮、点闪闪的地方。
   画布上的小游戏（刷牙、擦、拖云……）由 Python 脚本用真实触摸来做。
   每一次点击都记在 window.__taps（[秒, x, y]），剪视频时画一个点击的小圆圈。 */
(function () {
  if (window.__kid) return;
  const K = window.__kid = { on: true, seen: new Map(), acts: true, hot: true, pick: true, delay: 1300 };
  window.__taps = [];
  const now = () => performance.now();
  const ready = (key, ms) => { if (!K.seen.has(key)) K.seen.set(key, now()); return now() - K.seen.get(key) > ms; };
  const mark = el => { const r = el.getBoundingClientRect(); window.__taps.push([Date.now() / 1000, r.left + r.width / 2, r.top + r.height / 2]); };
  const click = el => { mark(el); el.click(); };
  const vis = el => el && el.offsetParent !== null && el.style.visibility !== 'hidden' && !el.disabled;
  let busyUntil = 0;
  setInterval(() => {
    const HH = window.HH; if (!K.on || !HH || !HH.UI || now() < busyUntil) return;
    const D = HH.D, UI = HH.UI, E = HH.E;
    // 拼音卡片
    const cards = [...document.querySelectorAll('.cards .card')].filter(vis);
    if (cards.length) {
      const py = UI.cur && D.words[UI.cur] && D.words[UI.cur].py;
      const c = (py && cards.find(x => x.querySelector('.py') && x.querySelector('.py').textContent === py && x.onclick)) || cards.find(x => x.dataset.ok);
      if (c && ready(c, K.delay + 200)) { click(c); busyUntil = now() + 1200; }
      return;
    }
    // 排顺序
    const ord = document.querySelector('.pk[data-order]');
    if (ord) {
      const order = ord.dataset.order.split(','), done = [...ord.querySelectorAll('.pk-slot.on')].length;
      const b = [...ord.querySelectorAll('.pk-it')].find(x => x.dataset.k === order[done] && vis(x));
      if (b && ready('ord' + done, 900)) { click(b); busyUntil = now() + 700; }
      return;
    }
    // 分类：先点东西，再点桶
    const bins = document.querySelector('.pk-bins');
    if (bins) {
      const sel = [...document.querySelectorAll('.pk-it.sel')].find(vis);   // 已经放好的那个也还带着 sel
      if (sel && vis(sel)) { const bin = bins.querySelector('.pk-bin[data-k="' + sel.dataset.bin + '"]'); if (bin && ready('bin' + sel.dataset.bin + sel.innerHTML.length, 700)) { click(bin); busyUntil = now() + 900; } return; }
      const it = [...document.querySelectorAll('.pk-grid .pk-it')].find(vis);
      if (it && ready('it' + it.innerHTML.length + it.dataset.bin, 800)) { click(it); busyUntil = now() + 500; }
      return;
    }
    // 点了装进去
    if (K.pick) {
      const pk = [...document.querySelectorAll('.pk .pk-it')].filter(x => vis(x) && x.it && x.it.ok);
      if (pk.length) { if (ready('pick' + pk.length, 900)) { click(pk[0]); busyUntil = now() + 900; } return; }
    }
    // 付钱的硬币
    const coin = [...document.querySelectorAll('.pay .coin')].find(vis);
    if (coin) { if (ready('coin' + document.querySelectorAll('.pay .dish img').length, 900)) { click(coin); busyUntil = now() + 700; } return; }
    // 大图（刷卡、漱口、福字）
    const big = [...document.querySelectorAll('.veil > .got')].find(x => x.onclick);
    if (big) { if (ready(big, 1300)) { click(big); busyUntil = now() + 900; } return; }
    // 大按钮
    if (K.acts) {
      const act = [...document.querySelectorAll('.acts .act')].find(vis);
      if (act && !act.dataset.hold) { const key = act.textContent + (act.__n || 0); if (ready(key, act.classList.contains('small') ? 3200 : 1500)) { click(act); act.__n = (act.__n || 0) + 1; K.seen.delete(key); busyUntil = now() + 1400; return; } }
    }
    // 场景里等着点的地方（找彩蛋慢一点）
    if (K.hot && !E.busy) {
      const h = E.hot.find(h => h.always && (!h.when || h.when()));
      if (h) {
        const egg = h.id.startsWith('pk_');
        if (ready('hot' + h.id, egg ? 2200 : 1500)) {
          const p = E.toScreen(h.sx != null ? h.sx : h.x, h.sy != null ? h.sy : h.y);
          window.__taps.push([Date.now() / 1000, p.x, p.y]);
          K.seen.delete('hot' + h.id);
          E.tapHot(h.id); busyUntil = now() + 900;
        }
      }
    }
  }, 120);
})();
