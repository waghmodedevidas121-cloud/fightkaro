(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  window.FKUI.show('vs-screen');
  const bar = document.getElementById('vs-load-bar');
  const pct = document.getElementById('vs-load-pct');
  if (bar) bar.style.width = '64%';
  if (pct) pct.textContent = '64%';
  await sleep(400);
  return window.FKUI.current;
})()
