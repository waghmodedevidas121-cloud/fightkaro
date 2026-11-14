(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const out = { errors: [] };
  window.addEventListener('error', (e) => out.errors.push(String(e.message)));

  // fresh save so the economy numbers are deterministic
  try { localStorage.removeItem('fk.profile'); } catch (e) {}
  try { window.FKUI.show('menu-screen'); } catch (e) { out.errors.push('show menu: ' + e.message); }
  await sleep(500);

  out.menuItems = [...document.querySelectorAll('#menu-screen .menu-item')].map(b => b.getAttribute('data-go'));
  out.themeDefault = document.body.getAttribute('data-theme');
  out.coinChipMenu = (document.querySelector('#menu-screen .coin-value') || {}).textContent;

  // theme switch
  const tb = document.querySelector('[data-theme-set="c"]');
  if (tb) tb.click();
  await sleep(150);
  out.themeAfterC = document.body.getAttribute('data-theme');
  out.themeVarInk = getComputedStyle(document.body).getPropertyValue('--ink').trim();
  document.querySelector('[data-theme-set="a"]').click();
  await sleep(100);

  // vault / bazaar / missions render through the real nav handler
  for (const name of ['vault', 'bazaar', 'missions', 'training']) {
    const nav = document.querySelector('#menu-screen .menu-item[data-go="' + name + '"]');
    if (nav) nav.click();
    await sleep(350);
    const scr = document.getElementById(name + '-screen');
    out[name] = {
      visible: scr ? scr.style.display : 'missing',
      current: window.FKUI.current,
      cards: scr ? scr.querySelectorAll('.vault-card,.bazaar-card,.mission-row,.train-card').length : 0
    };
  }

  out.trainRoster = document.querySelectorAll('#train-roster .train-card').length;
  out.bazaarCards = document.querySelectorAll('#bazaar-grid .bazaar-card').length;
  out.missionRows = document.querySelectorAll('#mission-list .mission-row').length;

  // buy the cheapest paid finish through the real handler
  const buy = [...document.querySelectorAll('[data-buy]')].find(b => !b.disabled);
  if (buy) { buy.click(); await sleep(250); }
  out.coinsAfterBuy = (document.querySelector('#bazaar-screen .coin-value') || {}).textContent;
  out.vaultOwned = document.querySelectorAll('#vault-grid .vault-card').length;

  // training really writes engine state
  const tstart = document.getElementById('train-start');
  const g = window.game;
  if (tstart && g) {
    g.p1Choice = 'MITRAMAN';
    tstart.click();
    await sleep(2500);
    out.training = {
      hud: document.getElementById('hud').classList.contains('on'),
      shakti: g.p1 ? Math.round(g.p1.shakti) : null,
      timer: g.timer,
      vsHidden: document.getElementById('vs-screen').style.display
    };
    g.p2.hp = 10;
    await sleep(200);
    out.training.dummyHpAfterHeal = Math.round(g.p2.hp);
  }

  out.consoleOk = true;
  return JSON.stringify(out);
})()
