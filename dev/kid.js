/* 测试用的"小朋友"：自动答拼音题、点大按钮、点脚本在等的地方；手势（画圆、往上推、叠罗汉、踢球）留给真实触摸。
   python cdp.py evalf dev/kid.js */
window.KID = window.KID || setInterval(() => {
  const HH = window.HH; if (!HH || !HH.UI) return;
  const D = HH.D, UI = HH.UI;
  const cards = [...document.querySelectorAll('.cards .card')].filter(c => !c.disabled && c.style.visibility !== 'hidden' && c.onclick);
  if (cards.length && UI.cur && !window.KID_busy) {
    const py = D.words[UI.cur].py, c = cards.find(x => (x.querySelector('.py') || {}).textContent === py);
    if (c) { window.KID_busy = 1; c.onclick(); setTimeout(() => window.KID_busy = 0, 400); }
  }
  const choice = [...document.querySelectorAll('.cards .card')].find(c => c.querySelector('.ic') && c.textContent.includes('天上'));
  if (choice && !window.KID_busy) { window.KID_busy = 1; choice.click(); setTimeout(() => window.KID_busy = 0, 400); }
  const act = document.querySelector('.acts .act:not(.small)');
  if (act && !window.KID_act) { window.KID_act = 1; act.click(); setTimeout(() => window.KID_act = 0, 600); }
  for (const h of HH.E.hot) if (h.always && !HH.E.busy && ['paw', 'sky'].includes(h.id)) HH.E.tapHot(h.id);
}, 250);
