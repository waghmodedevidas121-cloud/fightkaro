(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  window.FKUI.show('select-screen');
  await sleep(300);
  document.getElementById('start-fight-btn').click();
  // wait out the VS gate and the model decode
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    if (document.getElementById('hud').classList.contains('on')) break;
  }
  await sleep(2200);
  return { hud: document.getElementById('hud').classList.contains('on'), cur: window.FKUI.current };
})()
