(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  window.FKUI.show('settings-screen');
  await sleep(400);
  return window.FKUI.current;
})()
