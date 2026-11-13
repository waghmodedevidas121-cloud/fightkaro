/**
 * ============================================================================
 * 9. BOOTSTRAP + DEBUG HOOKS
 * ============================================================================
 */
window.addEventListener('DOMContentLoaded', () => {
    window.game = new SansadShowdownEngine();

    const unlock = () => { sfx.init(); };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });

    document.addEventListener('click', (e) => {
        const t = e.target.closest('.char-card, .stage-btn');
        if (t) sfx.uiPick();
        if (e.target.closest('#random-card')) sfx.meme(3);
    }, true);

    /* --------------------------------------------------------------
       in-game settings panel
       -------------------------------------------------------------- */
    const SETTINGS_KEY = 'fk.ui.settings';
    const isTouchDevice = ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        matchMedia('(pointer: coarse)').matches;

    const defaults = {
        // on a laptop / desktop the on-screen fighting buttons are dead weight,
        // so AUTO resolves to OFF there and to ON on a phone / tablet
        touch: 'auto',
        hint: 'on',
        sound: 'on'
    };
    let settings = Object.assign({}, defaults);
    try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) {}

    const body = document.body;

    function applySettings() {
        body.classList.toggle('touch-on', settings.touch === 'on' || (settings.touch === 'auto' && isTouchDevice));
        body.classList.toggle('touch-off', settings.touch === 'off' || (settings.touch === 'auto' && !isTouchDevice));
        body.classList.toggle('hint-off', settings.hint === 'off');
        body.classList.toggle('sound-off', settings.sound === 'off');
        sfx.enabled = settings.sound !== 'off';
        if (settings.sound === 'off' && sfx.music) { try { sfx.music.pause(); } catch (e) {} }
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}

        document.querySelectorAll('#hud-panel .seg').forEach((seg) => {
            const key = seg.dataset.setting;
            seg.querySelectorAll('button').forEach((b) => {
                b.classList.toggle('active', b.dataset.val === settings[key]);
            });
        });
    }

    const gearBtn = document.getElementById('hud-settings');
    const panel = document.getElementById('hud-panel');
    if (gearBtn && panel) {
        gearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('open');
            sfx.uiTap();
        });
        const closeBtn = document.getElementById('hud-panel-close');
        if (closeBtn) closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.remove('open');
            sfx.uiTap();
        });
        panel.addEventListener('click', (e) => {
            e.stopPropagation();
            const b = e.target.closest('.seg button');
            if (!b) return;
            settings[b.parentElement.dataset.setting] = b.dataset.val;
            applySettings();
            sfx.uiTap();
        });
        document.addEventListener('pointerdown', (e) => {
            if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== gearBtn) {
                panel.classList.remove('open');
            }
        });
    }
    applySettings();

    /* --------------------------------------------------------------
       asset guard: a GLB can never be fetched over file://
       -------------------------------------------------------------- */
    const noServer = document.getElementById('noserver');
    if (noServer) {
        const closeNoServer = document.getElementById('noserver-close');
        if (closeNoServer) closeNoServer.addEventListener('click', () => { noServer.hidden = true; });
        if (location.protocol === 'file:') noServer.hidden = false;
        document.addEventListener('fk:modelfail', () => {
            if (location.protocol === 'file:') noServer.hidden = false;
        });
    }

    /* --------------------------------------------------------------
       warm the GLB cache from the select screen, so a fight never
       opens on the placeholder rig
       -------------------------------------------------------------- */
    const preloadModel = (id) => {
        try {
            if (typeof loadCharacterModel !== 'function' || typeof CHAR_MODEL === 'undefined') return;
            const n = id && CHAR_MODEL[id];
            if (n) loadCharacterModel(n).catch(() => {});
        } catch (e) {}
    };
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.char-card');
        if (card && card.id) preloadModel(card.id.replace(/^card-/, ''));
        if (e.target.closest('#start-fight-btn')) {
            const g = window.game;
            if (g) { preloadModel(g.p1Choice); preloadModel(g.p2Choice); }
        }
    }, true);

    /* --------------------------------------------------------------
       ?demo=select | ?demo=fight  — deterministic capture harness.
       Only touches screen visibility, never game rules, so screenshots
       and QA runs always start from the same frame.
       -------------------------------------------------------------- */
    const params = new URLSearchParams(location.search);
    const demo = params.get('demo');
    if (params.get('touch') === '1') { settings.touch = 'on'; applySettings(); }
    if (demo) {
        document.getElementById('disclaimer-screen').style.display = 'none';
        document.getElementById('select-screen').style.display = 'flex';
        if (demo === 'fight') {
            const num = (k, d) => (params.get(k) === null ? d : Number(params.get(k)));
            setTimeout(() => {
                const btn = document.getElementById('start-fight-btn');
                if (btn) btn.click();
                setTimeout(() => {
                    const g = window.game;
                    // freeze the match so every capture is the same frame
                    g.matchActive = false;
                    g.p1.hp = num('hp1', 74); g.p2.hp = num('hp2', 46);
                    g.p1.shakti = num('sk1', 68); g.p2.shakti = num('sk2', 100);
                    g.p1.state = 'IDLE'; g.p2.state = 'IDLE';
                    g.p1.root.position.set(-1.9, 0, 0);
                    g.p2.root.position.set(1.9, 0, 0);
                    g.p1.root.rotation.y = Math.PI / 2;
                    g.p2.root.rotation.y = -Math.PI / 2;
                    g.updateHUD();
                    // transitions off before the values land, so the bars are final at once
                    const noAnim = document.createElement('style');
                    noAnim.textContent = '.hp-fill,.hp-damage,.shakti-fill{transition:none !important;}';
                    document.head.appendChild(noAnim);
                    g.updateHUD();
                    void document.body.offsetWidth;
                    if (params.get('panel') === '1') {
                        const p = document.getElementById('hud-panel');
                        if (p) p.classList.add('open');
                    }
                    if (params.get('callout') === '1') {
                        g.showCallout(true, 'DEMONETIZATION PALM!');
                    }
                    if (params.get('super') === '1') {
                        // hold the super animation at a fixed progress for capture
                        const hold = Number(params.get('superp') || 0.62);
                        const step = g.updateActiveSuper.bind(g);
                        g.launchSuper(g.p1, g.p2);
                        const stopAt = hold * g.activeSuper.duration;
                        g.updateActiveSuper = function (dt) {
                            if (!this.activeSuper || this.activeSuper.timer >= stopAt) return;
                            step(Math.min(dt, stopAt - this.activeSuper.timer));
                        };
                    }
                    window.FK.freeze = true;
                    // hold the framing steady: the engine keeps simulating even
                    // with matchActive off, which used to slide the fighters
                    // out of frame during a long capture
                    if (params.get('super') !== '1') {
                        setInterval(() => {
                            g.p1.root.position.set(-1.9, 0, 0);
                            g.p2.root.position.set(1.9, 0, 0);
                            g.p1.state = 'IDLE'; g.p2.state = 'IDLE';
                            if (g.p1.vel && g.p1.vel.set) g.p1.vel.set(0, 0, 0);
                            if (g.p2.vel && g.p2.vel.set) g.p2.vel.set(0, 0, 0);
                        }, 16);
                    }
                }, 2400);
            }, 700);
        }
    }

    window.FK = {
        g: window.game,
        freeze: false,
        status() {
            const g = window.game;
            return { p1: g.p1.state, p2: g.p2.state, hp1: g.p1.hp, hp2: g.p2.hp, active: g.matchActive, zoom: g.camZoom };
        },
        move(who, key) {
            const g = window.game;
            (who === 'p2' ? g.p2 : g.p1).triggerMove(key);
            return key;
        },
        view(px, py, pz, lx, ly, lz) {
            const g = window.game;
            window.FK.freeze = true;
            g.camera.position.set(px, py, pz);
            g.camera.lookAt(lx || 0, ly == null ? 1.1 : ly, lz || 0);
            g.renderer.render(g.scene, g.camera);
            return 'view';
        },
        unfreeze() { window.FK.freeze = false; return 'live'; },
        sound(name) { return sfx.play(name) ? 'played ' + name : 'no ' + name; },
        shot(name) {
            const g = window.game;
            g.renderer.render(g.scene, g.camera);
            return fetch('/__shot?name=' + encodeURIComponent(name || 'shot'), { method: 'POST', body: g.canvas.toDataURL('image/png') })
                .then(r => r.text());
        }
    };
});
