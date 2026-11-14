(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  window.FKUI.show('menu-screen');
  await sleep(900);
  const r = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, missing: true };
    const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const style = cs.display;
    const z = cs.zIndex;
    return { sel, x: Math.round(b.x), y: Math.round(b.y + window.scrollY || 0), w: Math.round(b.width), h: Math.round(b.height), fs: cs.fontSize, disp: style, z };
  };
  const body = document.body;
  const out = {
    docOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    docOverflowY: document.documentElement.scrollHeight > window.innerHeight + 1,
    bodySize: [body.scrollWidth, body.scrollHeight],
    vw: window.innerWidth, vh: window.innerHeight,
    menu: ['#menu-screen', '.menu-wrap', '#menu-screen .menu-nav', '#menu-screen #menu-roster', '#menu-screen .record-card', '#menu-screen .menu-foot', '#menu-screen .brand-block', '#menu-screen .menu-side'].map(r),
    disclaimer: ['#disclaimer-screen', '#disclaimer-screen .satire-box', '#disclaimer-screen .btn-gold'].map(r),
    hud: ['#hud', '#hud-settings', '#hud-panel', '#shanti-box', '#news-ticker', '#ticker-text', '#controls-hint', '#bottom-ui'].map(r),
  };
  return JSON.stringify(out);
})()
