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
