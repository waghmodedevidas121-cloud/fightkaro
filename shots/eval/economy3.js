(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const out = { errors: [] };
  window.addEventListener('error', (e) => out.errors.push(String(e.message)));
  document.getElementById('accept-disclaimer').click();
  await sleep(1500);

  const R = window.ROSTER || {};
  const g = {
    p1: { data: R.MITRAMAN || { id: 'MITRAMAN', name: 'MITRAMAN' } },
    p2: { data: R.LALUJI || { id: 'LALUJI', name: 'CHARA KING' } },
    p1Wins: 2, p2Wins: 0, timer: 50
  };
  // five real wins through the same entry point the engine calls
  for (let i = 0; i < 5; i++) {
    window.FKUI.onSuper({ isP1: true, comboCount: 3 });
    window.FKUI.onSuper({ isP1: true, comboCount: 3 });
    window.FKUI.onSuper({ isP1: true, comboCount: 6 });
    window.FKUI.matchEnd(g);
    await sleep(120);
  }
  await sleep(600);
  out.resultsCoinsLabel = (document.getElementById('res-coins') || {}).textContent;
  out.profileAfter = JSON.parse(localStorage.getItem('fk.profile') || '{}');

  window.FKUI.show('bazaar-screen');
  await sleep(350);
  out.coinsBefore = (document.querySelector('#bazaar-screen .coin-value') || {}).textContent;
  const buy = [...document.querySelectorAll('[data-buy]')].find(b => !b.disabled);
  out.buyLabel = buy ? buy.textContent.trim() : null;
  if (buy) { buy.click(); await sleep(400); }
  out.coinsAfterBuy = (document.querySelector('#bazaar-screen .coin-value') || {}).textContent;

  window.FKUI.show('vault-screen');
  await sleep(350);
  out.vaultCards = document.querySelectorAll('#vault-grid .vault-card').length;
  const eq = [...document.querySelectorAll('[data-equip]')].find(b => !b.disabled);
  out.equipLabel = eq ? eq.textContent.trim() : null;
  if (eq) { eq.click(); await sleep(300); }
  out.equippedNow = document.querySelectorAll('#vault-grid .vault-card.is-equipped').length;
  out.equipSavedToStorage = (JSON.parse(localStorage.getItem('fk.profile') || '{}') || {}).equip;

  window.FKUI.show('missions-screen');
  await sleep(350);
  out.missionCounts = [...document.querySelectorAll('.mission-count')].map(e => e.textContent);
  const claim = [...document.querySelectorAll('[data-claim]')].find(b => !b.disabled);
  out.claimLabel = claim ? claim.textContent.trim() : null;
  out.coinsPreClaim = (document.querySelector('#missions-screen .coin-value') || {}).textContent;
  if (claim) { claim.click(); await sleep(350); }
  out.coinsPostClaim = (document.querySelector('#missions-screen .coin-value') || {}).textContent;

  window.FKUI.show('menu-screen');
  await sleep(300);
  out.menuCoinChip = (document.querySelector('#menu-screen .coin-value') || {}).textContent;
  return JSON.stringify(out);
})()
