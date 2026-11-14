(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const out = { errors: [] };
  window.addEventListener('error', (e) => out.errors.push(String(e.message)));
  document.getElementById('accept-disclaimer').click();
  await sleep(1600);
  window.FKUI.show('bazaar-screen');
  await sleep(400);
  out.coinsBefore = (document.querySelector('#bazaar-screen .coin-value') || {}).textContent;
  const buy = [...document.querySelectorAll('[data-buy]')].find(b => !b.disabled);
  out.buyLabel = buy ? buy.textContent.trim() : null;
  if (buy) { buy.click(); await sleep(400); }
  out.coinsAfter = (document.querySelector('#bazaar-screen .coin-value') || {}).textContent;
  window.FKUI.show('vault-screen');
  await sleep(350);
  out.vaultCards = document.querySelectorAll('#vault-grid .vault-card').length;
  const eq = [...document.querySelectorAll('[data-equip]')].find(b => !b.disabled);
  out.equipLabel = eq ? eq.textContent.trim() : null;
  if (eq) { eq.click(); await sleep(300); }
  out.equippedNow = document.querySelectorAll('#vault-grid .vault-card.is-equipped').length;
  window.FKUI.show('missions-screen');
  await sleep(350);
  const claim = [...document.querySelectorAll('[data-claim]')].find(b => !b.disabled);
  out.claimLabel = claim ? claim.textContent.trim() : null;
  out.coinsPreClaim = (document.querySelector('#missions-screen .coin-value') || {}).textContent;
  if (claim) { claim.click(); await sleep(350); }
  out.coinsPostClaim = (document.querySelector('#missions-screen .coin-value') || {}).textContent;
  out.missionCounts = [...document.querySelectorAll('.mission-count')].map(e => e.textContent);
  return JSON.stringify(out);
})()
