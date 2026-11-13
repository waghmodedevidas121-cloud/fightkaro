(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  window.FKUI.show('select-screen');
  await sleep(500);
  const c = document.getElementById('card-YATRABOY');
  if (c) c.querySelector('.char-avatar') && null;
  window.game.pickingFor = 'P1';
  return window.FKUI.current;
})()
