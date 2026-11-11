import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = 'C:/Users/HP/fightkaro';
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.md': 'text/markdown',
  '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.wasm': 'application/wasm',
  '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream'
};
http.createServer((req, res) => {
  const u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (req.method === 'POST' && u === '/__shot') {
    const name = new URL('http://x' + req.url).searchParams.get('name') || 'shot';
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const dir = path.join(root, 'shots');
      fs.mkdirSync(dir, { recursive: true });
      const f = path.join(dir, name.replace(/[^\w.-]/g, '_') + '.png');
      let b = Buffer.concat(chunks).toString('utf8');
      if (b.startsWith('data:image')) b = b.slice(b.indexOf(',') + 1);
      fs.writeFileSync(f, Buffer.from(b, 'base64'));
      res.writeHead(200); res.end('ok');
    });
    return;
  }
  const f = path.join(root, u === '/' ? 'index.html' : u);
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(d);
  });
}).listen(Number(process.env.PORT || 8150), () => console.log('serving on ' + (process.env.PORT || 8150)));
