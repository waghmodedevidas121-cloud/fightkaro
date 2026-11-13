(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  window.FKUI.show('select-screen');
  await sleep(300);
  document.getElementById('start-fight-btn').click();
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    if (document.getElementById('hud').classList.contains('on')) break;
  }
  await sleep(1200);
  window.FKUI.pauseGame();
  await sleep(400);
  return window.FKUI.current;
})()
