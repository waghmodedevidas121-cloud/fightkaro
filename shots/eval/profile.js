(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const seed = { matches: 14, wins: 9, losses: 5, supers: 21, bestCombo: 6, longest: 58,
    usage: { MITRAMAN: 9, YATRABOY: 3, DEEDEE: 2 }, lastId: 'MITRAMAN' };
  localStorage.setItem('fk.profile', JSON.stringify(seed));
  window.FKUI.show('menu-screen');
  await sleep(120);
  window.FKUI.show('profile-screen');
  await sleep(400);
  return { cur: window.FKUI.current, matches: document.getElementById('prof-matches').textContent };
})()
