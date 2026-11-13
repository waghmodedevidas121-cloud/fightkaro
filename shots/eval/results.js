(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const g = window.game;
  window.FKUI.show('select-screen');
  await sleep(300);
  document.getElementById('start-fight-btn').click();
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    if (document.getElementById('hud').classList.contains('on')) break;
  }
  await sleep(1500);
  g.p1Wins = 2; g.p2Wins = 0; g.timer = 37;
  window.FKUI.onHit(g.p1, 44);
  g.p1.comboCount = 5;
  window.FKUI.onHit(g.p1, 38);
  window.FKUI.onSuper(g.p1);
  window.FKUI.onSuper(g.p1);
  window.FKUI.matchEnd(g);
  await sleep(1400);
  return { cur: window.FKUI.current, winner: document.getElementById('res-winner').textContent };
})()
