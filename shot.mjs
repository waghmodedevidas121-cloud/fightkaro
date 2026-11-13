/**
 * shot.mjs — real-time screenshot + console capture over CDP.
 * Unlike `chrome --screenshot`, this waits as long as we ask, so GLB models
 * and their textures are actually decoded before the frame is taken.
 *
 *   node shot.mjs --url "http://localhost:8150/?demo=fight" --out shots/a.png \
 *                 --w 1440 --h 900 --wait 9000
 */
import fs from 'fs';
import { spawn } from 'child_process';

const argv = process.argv.slice(2);
const opt = (k, d) => {
    const i = argv.indexOf('--' + k);
    return i >= 0 ? argv[i + 1] : d;
};

const url = opt('url', 'http://localhost:8150/');
const out = opt('out', 'shots/shot.png');
const W = Number(opt('w', 1440));
const H = Number(opt('h', 900));
const waitMs = Number(opt('wait', 9000));
const port = Number(opt('port', 9500 + Math.floor(Math.random() * 400)));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = (process.env.TEMP || '.') + '/cdp-' + Date.now();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + profile,
    '--window-size=' + W + ',' + H,
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--force-device-scale-factor=1',
    'about:blank'
], { stdio: 'ignore' });

async function browserWs() {
    for (let i = 0; i < 120; i++) {
        try {
            const r = await fetch(`http://127.0.0.1:${port}/json/version`);
            const j = await r.json();
            if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
        } catch (e) { /* not up yet */ }
        await sleep(150);
    }
    throw new Error('chrome did not expose a debugging endpoint');
}

const logs = [];
let ws, nextId = 1;
const pending = new Map();
let sessionId = null;

function send(method, params = {}, sid = sessionId) {
    const id = nextId++;
    const msg = { id, method, params };
    if (sid) msg.sessionId = sid;
    ws.send(JSON.stringify(msg));
    return new Promise((res, rej) => pending.set(id, { res, rej, method }));
}

function onMessage(raw) {
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        if (m.error) p.rej(new Error(p.method + ': ' + m.error.message));
        else p.res(m.result);
        return;
    }
    if (m.method === 'Runtime.consoleAPICalled') {
        const text = (m.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ');
        logs.push(m.params.type + ': ' + text);
    }
    if (m.method === 'Log.entryAdded') {
        logs.push(m.params.entry.level + ': ' + m.params.entry.text);
    }
    if (m.method === 'Network.responseReceived') {
        const r = m.params.response;
        if (r.status >= 400) logs.push('http ' + r.status + ' ' + r.url);
    }
    if (m.method === 'Network.loadingFailed') {
        const u = m.params.requestId;
        logs.push('net-fail ' + (m.params.errorText || '') + ' ' + (m.params.type || ''));
    }
    if (m.method === 'Runtime.exceptionThrown') {
        const d = m.params.exceptionDetails;
        logs.push('exception: ' + (d.exception?.description || d.text));
    }
}

try {
    const wsUrl = await browserWs();
    ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    ws.onmessage = (e) => onMessage(e.data);

    const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, null);
    const att = await send('Target.attachToTarget', { targetId, flatten: true }, null);
    sessionId = att.sessionId;

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Log.enable');
    await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride', {
        width: W, height: H, deviceScaleFactor: 1, mobile: false
    });

    const loaded = new Promise((res) => {
        const prev = ws.onmessage;
        ws.onmessage = (e) => {
            prev(e);
            const m = JSON.parse(e.data);
            if (m.method === 'Page.loadEventFired') res();
        };
    });
    await send('Page.navigate', { url });
    await Promise.race([loaded, sleep(20000)]);
    await sleep(waitMs);

    const evalSource = opt('eval-file', null)
        ? fs.readFileSync(opt('eval-file'), 'utf8')
        : opt('eval', null);
    if (evalSource) {
        const r = await send('Runtime.evaluate', {
            expression: evalSource, returnByValue: true, awaitPromise: true
        });
        console.log('eval:', JSON.stringify(r.result?.value ?? r.result?.description ?? null));
    }

    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.mkdirSync(out.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
    fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
    console.log('OK ' + out + '  (' + Math.round(fs.statSync(out).size / 1024) + ' KB)');
    if (logs.length) console.log('--- console ---\n' + logs.slice(-25).join('\n'));
} catch (e) {
    console.error('FAIL ' + e.message);
    process.exitCode = 1;
} finally {
    try { ws && ws.close(); } catch (e) {}
    try { chrome.kill(); } catch (e) {}
    await sleep(300);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
    setTimeout(() => process.exit(process.exitCode || 0), 200);
}
