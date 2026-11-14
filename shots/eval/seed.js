(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const out = { errors: [] };
  window.addEventListener('error', (e) => out.errors.push(String(e.message)));
  try {
    localStorage.setItem('fk.profile', JSON.stringify({
      coins: 1000, owned: ['finish-bronze'], equip: 'finish-bronze', matches: 3, wins: 2, losses: 1,
      usage: { MITRAMAN: 2 }, missions: { 'm-super': 3, 'm-combo': 1 }, claimed: [], supers: 4, bestCombo: 6
    }));
  } catch (e) {}
  location.reload();
  return JSON.stringify({ reloading: true });
})()
