(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  window.FKUI.show('moves-screen');
  await sleep(400);
  return window.FKUI.current;
})()
