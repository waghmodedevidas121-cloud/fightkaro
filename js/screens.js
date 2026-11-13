/**
 * ============================================================================
 * FIGHTKARO — UI v3 SCREEN CONTROLLER
 * ----------------------------------------------------------------------------
 * Owns navigation, the VS/prep loading gate, pause, results and the profile.
 * Gameplay, combat and audio stay in engine.js / audio.js — this file only
 * reads their state and never mutates the fight rules.
 * ============================================================================
 */
(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
    const faceOf = (id) => 'faces/' + ((typeof CHAR_FACE !== 'undefined' && CHAR_FACE[id]) || 'modi') + '.webp';
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    /* ------------------------------------------------------------------
       career profile (persisted)
       ------------------------------------------------------------------ */
    const PROFILE_KEY = 'fk.profile';
    const blankProfile = () => ({
        matches: 0, wins: 0, losses: 0,
        supers: 0, bestCombo: 0, longest: 0,
        usage: {}, lastId: null
    });
    let profile = blankProfile();
    function loadProfile() {
        try { Object.assign(profile, JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')); } catch (e) { /* fresh save */ }
        if (!profile.usage) profile.usage = {};
    }
    loadProfile();
    const saveProfile = () => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) {} };

    const mainId = () => {
        const keys = Object.keys(profile.usage);
        if (!keys.length) return 'MITRAMAN';
        return keys.sort((a, b) => profile.usage[b] - profile.usage[a])[0];
    };

    /* ------------------------------------------------------------------
       screen manager
       ------------------------------------------------------------------ */
    const SCREENS = [
        'disclaimer-screen', 'boot-screen', 'menu-screen', 'select-screen', 'vs-screen',
        'pause-screen', 'results-screen', 'settings-screen', 'profile-screen', 'moves-screen'
    ];

    let current = 'disclaimer-screen';
    let backTarget = 'menu-screen';

    function show(id) {
        SCREENS.forEach((s) => {
            const el = $(s);
            if (el) el.style.display = (s === id) ? 'flex' : 'none';
        });
        current = id;
        const hud = $('hud');
        if (hud && id !== 'select-screen' && id !== 'pause-screen') {
            // the HUD belongs to the fight only; keep it out of every menu
            if (id === 'menu-screen' || id === 'results-screen' || id === 'settings-screen' ||
                id === 'profile-screen' || id === 'moves-screen' || id === 'boot-screen' || id === 'disclaimer-screen') {
                hud.classList.remove('on');
            }
        }
        if (id === 'menu-screen') renderMenu();
        if (id === 'profile-screen') renderProfile();
        if (id === 'moves-screen') renderMoves();
        if (id === 'settings-screen') syncSettings();
        if (id === 'select-screen') syncPicks();
    }
    const hide = (id) => { const el = $(id); if (el) el.style.display = 'none'; };

    /* ------------------------------------------------------------------
       boot
       ------------------------------------------------------------------ */
    function boot(done) {
        show('boot-screen');
        const fill = $('boot-bar-fill');
        const hint = $('boot-hint');
        const steps = [
            [18, 'Engine taiyaar ho raha hai…'],
            [42, 'Arena ban raha hai…'],
            [68, 'Audio bank load ho raha hai…'],
            [88, 'Fighters taiyaar…']
        ];
        let i = 0;
        const tick = setInterval(() => {
            if (i < steps.length) {
                const [pct, label] = steps[i++];
                if (fill) fill.style.width = pct + '%';
                if (hint) hint.textContent = label;
                return;
            }
            clearInterval(tick);
            if (fill) fill.style.width = '100%';
            if (hint) hint.textContent = 'Ready';
            setTimeout(done, 260);
        }, 130);
    }

    /* ------------------------------------------------------------------
       menu
       ------------------------------------------------------------------ */
    function renderMenu() {
        loadProfile();
        const strip = $('menu-roster');
        if (strip && !strip.childElementCount && typeof ROSTER !== 'undefined') {
            strip.innerHTML = Object.values(ROSTER).slice(0, 8).map((c) => (
                '<div class="face"><img src="' + faceOf(c.id) + '" alt=""><span>' + c.name + '</span></div>'
            )).join('');
        }
        const rate = profile.matches ? Math.round((profile.wins / profile.matches) * 100) : 0;
        const set = (id, v) => { const el = $(id); if (el) el.innerHTML = v; };
        set('menu-matches', String(profile.matches));
        set('menu-wins', String(profile.wins));
        set('menu-rate', rate + '<small>%</small>');
        const build = $('menu-build');
        if (build) {
            const meta = document.querySelector('meta[name="fk-build"]');
            build.textContent = (meta ? meta.content : 'local') + ' · 1.0';
        }
    }

    function menuItems() { return $$('#menu-screen .menu-item'); }
    function focusItem(idx) {
        const items = menuItems();
        if (!items.length) return;
        const i = (idx + items.length) % items.length;
        items.forEach((el, k) => el.classList.toggle('is-focus', k === i));
        items[i].focus();
        menuFocus = i;
    }
    let menuFocus = 0;

    /* ------------------------------------------------------------------
       select screen
       ------------------------------------------------------------------ */
    function syncPicks() {
        const g = window.game;
        if (!g) return;
        const p1 = ROSTER[g.p1Choice] || ROSTER.MITRAMAN;
        const p2 = ROSTER[g.p2Choice] || ROSTER.YATRABOY;

        const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
        const img = (id, idn) => { const el = $(id); if (el) el.src = faceOf(idn); };

        set('pick-p1-name', p1.name); set('pick-p1-team', p1.team); img('pick-p1-face', p1.id);
        set('pick-p2-name', p2.name); set('pick-p2-team', p2.team); img('pick-p2-face', p2.id);
        set('pick-order', 'PICKING ' + (g.pickingFor || 'P1'));
        $('plate-p1').classList.toggle('is-active', g.pickingFor === 'P1');
        $('plate-p2').classList.toggle('is-active', g.pickingFor === 'P2');

        // detail panel always mirrors the fighter being picked
        const d = g.pickingFor === 'P2' ? p2 : p1;
        set('detail-name', d.name);
        set('detail-team', d.team);
        set('detail-super', d.superName);
        set('detail-sp1', d.sp1Name);
        set('detail-sp2', d.sp2Name);
        img('detail-face', d.id);

        const dmg = Math.round((d.dmgMult || 1) * 100);
        const spd = Math.round((d.walkSpeed || 5.5) * 10);
        set('detail-dmg-v', String(dmg));
        set('detail-spd-v', String(spd));
        set('detail-hp-v', String(d.hp || 100));
        const bar = (id, pct) => { const el = $(id); if (el) el.style.width = clamp01(pct / 150) * 100 + '%'; };
        bar('detail-dmg', dmg);
        bar('detail-spd', spd);
        bar('detail-hp', d.hp || 100);

        // the engine owns the card highlight, this only re-syncs the plates
        const side = $('toggle-pick-side');
        if (side) side.textContent = 'PICKING: ' + (g.pickingFor || 'P1');
    }

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.char-card');
        if (card && card.id) {
            requestAnimationFrame(() => {
                syncPicks();
                const id = card.id.replace(/^card-/, '');
                if (typeof loadCharacterModel === 'function' && CHAR_MODEL[id]) {
                    loadCharacterModel(CHAR_MODEL[id]).catch(() => {});
                }
            });
        }
        if (e.target.closest('#toggle-pick-side')) requestAnimationFrame(syncPicks);
    }, false);

    document.addEventListener('contextmenu', (e) => {
        const card = e.target.closest('.char-card');
        if (!card || !card.id || !window.game) return;
        e.preventDefault();
        const g = window.game;
        g.p2Choice = card.id.replace(/^card-/, '');
        if (typeof g.refreshRosterCards === 'function') g.refreshRosterCards();
        syncPicks();
    }, false);

    /* ------------------------------------------------------------------
       VS / battle prep gate
       ------------------------------------------------------------------ */
    let busy = false;

    function loadProgress(jobs, onProgress) {
        let done = 0;
        const total = jobs.length;
        jobs.forEach((job) => {
            job.then(() => { done++; onProgress(done / total); })
               .catch(() => { done++; onProgress(done / total); });
        });
    }

    function startFight() {
        const g = window.game;
        if (!g || busy) return;
        busy = true;

        const p1 = ROSTER[g.p1Choice] || ROSTER.MITRAMAN;
        const p2 = ROSTER[g.p2Choice] || ROSTER.YATRABOY;

        const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
        const img = (id, idn) => { const el = $(id); if (el) el.src = faceOf(idn); };
        set('vs-p1-name', p1.name); set('vs-p1-team', p1.team); img('vs-p1-face', p1.id);
        set('vs-p2-name', p2.name); set('vs-p2-team', p2.team); img('vs-p2-face', p2.id);
        const stageNames = { SANSAD: 'Sansad Bhavan', JANTAR: 'Jantar Mantar', SADAK: 'Desi Sadak' };
        set('vs-stage', stageNames[g.stageChoice] || 'Sansad Bhavan');

        const bar = $('vs-load-bar');
        const pctEl = $('vs-load-pct');
        const paint = (p) => {
            const pct = Math.round(clamp01(p) * 100);
            if (bar) bar.style.width = pct + '%';
            if (pctEl) pctEl.textContent = pct + '%';
        };
        paint(0);

        show('vs-screen');
        try { sfx.setTrack('battle', 0.2); } catch (e) {}

        const jobs = [];
        if (typeof loadCharacterModel === 'function') {
            if (CHAR_MODEL[p1.id]) jobs.push(loadCharacterModel(CHAR_MODEL[p1.id]));
            if (CHAR_MODEL[p2.id]) jobs.push(loadCharacterModel(CHAR_MODEL[p2.id]));
        }

        const launch = () => {
            hide('vs-screen');
            resetMatchStats();
            g.startFullMatch();
            $('hud').classList.add('on');
            busy = false;
        };

        if (!jobs.length) { paint(1); setTimeout(launch, 340); return; }
        loadProgress(jobs, paint);
        Promise.race([
            Promise.all(jobs.map((j) => j.catch(() => null))),
            new Promise((r) => setTimeout(r, 12000))   // never trap the player behind a slow link
        ]).then(() => setTimeout(launch, 380));
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('#start-fight-btn')) {
            e.stopPropagation();
            e.preventDefault();
            startFight();
        }
        const res = e.target.closest('[data-res]');
        if (res) {
            const what = res.getAttribute('data-res');
            if (what === 'rematch') { hide('results-screen'); startFight(); }
            if (what === 'select') { hide('results-screen'); show('select-screen'); }
            if (what === 'menu') { hide('results-screen'); $('hud').classList.remove('on'); show('menu-screen'); }
        }
        const go = e.target.closest('[data-go]');
        if (go) {
            const target = go.getAttribute('data-go');
            if (target === 'select') { show('select-screen'); }
            else if (target === 'profile') show('profile-screen');
            else if (target === 'moves') show('moves-screen');
            else if (target === 'settings') { backTarget = 'menu-screen'; show('settings-screen'); }
        }
        const back = e.target.closest('[data-back]');
        if (back) show(back.getAttribute('data-back') + '-screen');
    }, true);

    /* ------------------------------------------------------------------
       pause
       ------------------------------------------------------------------ */
    let pausedFrom = false;

    function pauseGame() {
        const g = window.game;
        if (!g || !$('hud').classList.contains('on') || current === 'pause-screen') return;
        pausedFrom = !!g.matchActive;
        g.matchActive = false;
        try { if (sfx.music) sfx.music.volume = Math.min(sfx.music.volume, 0.08); } catch (e) {}
        const r = $('pause-round'); if (r) r.textContent = 'ROUND ' + (g.round || 1);
        const s = $('pause-score'); if (s) s.textContent = (g.p1Wins || 0) + ' — ' + (g.p2Wins || 0);
        show('pause-screen');
    }

    function resumeGame() {
        const g = window.game;
        hide('pause-screen');
        current = 'hud';
        if (g && pausedFrom && !g.activeSuper) g.matchActive = true;
        pausedFrom = false;
        try { if (sfx.music) sfx.music.volume = sfx.targetMusicVol || 0.2; } catch (e) {}
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-pause]');
        if (!btn) return;
        const what = btn.getAttribute('data-pause');
        if (what === 'resume') resumeGame();
        if (what === 'restart') {
            hide('pause-screen');
            current = 'hud';
            pausedFrom = false;
            resetMatchStats();
            window.game.startFullMatch();
        }
        if (what === 'settings') { backTarget = 'pause-screen'; hide('pause-screen'); show('settings-screen'); }
        if (what === 'quit') {
            hide('pause-screen');
            current = 'menu-screen';
            pausedFrom = false;
            $('hud').classList.remove('on');
            show('menu-screen');
        }
    }, true);

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
            if (current === 'pause-screen') { resumeGame(); e.preventDefault(); return; }
            if (current === 'settings-screen' && backTarget === 'pause-screen') {
                show('pause-screen'); e.preventDefault(); return;
            }
            if (current === 'select-screen' || current === 'settings-screen' || current === 'profile-screen' || current === 'moves-screen') {
                show('menu-screen'); e.preventDefault(); return;
            }
            if ($('hud').classList.contains('on')) { pauseGame(); e.preventDefault(); }
            return;
        }
        if (current === 'menu-screen') {
            if (e.code === 'ArrowDown') { focusItem(menuFocus + 1); e.preventDefault(); }
            if (e.code === 'ArrowUp') { focusItem(menuFocus - 1); e.preventDefault(); }
            if (e.code === 'Enter') {
                const items = menuItems();
                if (items[menuFocus]) items[menuFocus].click();
            }
        }
        if (current === 'pause-screen') {
            if (e.code === 'KeyR') $('pause-screen').querySelector('[data-pause="restart"]').click();
            if (e.code === 'KeyQ') $('pause-screen').querySelector('[data-pause="quit"]').click();
        }
    }, false);

    /* ------------------------------------------------------------------
       match statistics
       ------------------------------------------------------------------ */
    let matchStats = null;
    function resetMatchStats() {
        matchStats = { p1dmg: 0, bestCombo: 0, supers: 0, timeLeft: 0 };
    }
    resetMatchStats();

    function onHit(attacker, dmg) {
        if (!matchStats || !attacker || !attacker.isP1) return;
        matchStats.p1dmg += dmg || 0;
        if ((attacker.comboCount || 0) > matchStats.bestCombo) matchStats.bestCombo = attacker.comboCount;
    }

    function onSuper(attacker) {
        if (!matchStats || !attacker || !attacker.isP1) return;
        matchStats.supers++;
    }

    function matchEnd(g) {
        if (!g) return;
        const p1Won = (g.p1Wins || 0) >= 2;
        const p1 = g.p1.data, p2 = g.p2.data;

        profile.matches++;
        if (p1Won) profile.wins++; else profile.losses++;
        profile.supers += (matchStats ? matchStats.supers : 0);
        profile.bestCombo = Math.max(profile.bestCombo, matchStats ? matchStats.bestCombo : 0);
        const timeLeft = Math.max(0, Math.round(g.timer || 0));
        profile.longest = Math.max(profile.longest, 60 - timeLeft);
        profile.usage[p1.id] = (profile.usage[p1.id] || 0) + 1;
        profile.lastId = p1.id;
        saveProfile();

        const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
        const img = (id, idn) => { const el = $(id); if (el) el.src = faceOf(idn); };

        set('res-winner', (p1Won ? p1.name : p2.name));
        set('res-kicker', p1Won ? 'Kursi haasil — victory' : 'Kursi gayi — defeat');
        set('res-p1-name', p1.name); img('res-p1-face', p1.id);
        set('res-p2-name', p2.name); img('res-p2-face', p2.id);
        set('res-rounds', (g.p1Wins || 0) + ' — ' + (g.p2Wins || 0));
        set('res-time', timeLeft + 's');
        set('res-dmg', String(Math.round(matchStats ? matchStats.p1dmg : 0)));
        set('res-combo', String(matchStats ? matchStats.bestCombo : 0));
        set('res-super', String(matchStats ? matchStats.supers : 0));

        $('res-side-p1').classList.toggle('lost', !p1Won);
        $('res-side-p2').classList.toggle('lost', p1Won);
        const pip = (id, won) => { const el = $(id); if (el) el.classList.toggle('won', won); };
        pip('res-p1-r1', (g.p1Wins || 0) >= 1); pip('res-p1-r2', (g.p1Wins || 0) >= 2);
        pip('res-p2-r1', (g.p2Wins || 0) >= 1); pip('res-p2-r2', (g.p2Wins || 0) >= 2);

        $('hud').classList.remove('on');
        setTimeout(() => show('results-screen'), 420);
    }

    /* ------------------------------------------------------------------
       profile + moves rendering
       ------------------------------------------------------------------ */
    function renderProfile() {
        loadProfile();
        const rate = profile.matches ? Math.round((profile.wins / profile.matches) * 100) : 0;
        const set = (id, v) => { const el = $(id); if (el) el.innerHTML = v; };
        set('prof-matches', String(profile.matches));
        set('prof-wins', String(profile.wins));
        set('prof-rate', rate + '<small>%</small>');
        set('prof-supers', String(profile.supers));
        set('prof-combo', String(profile.bestCombo));
        set('prof-time', String(profile.longest) + '<small>s</small>');

        const idn = mainId();
        const face = $('prof-face'); if (face) face.src = faceOf(idn);
        const nm = $('prof-main'); if (nm) nm.textContent = (ROSTER[idn] && ROSTER[idn].name) || idn;
        const since = $('prof-since');
        if (since) {
            since.textContent = profile.matches
                ? (profile.wins + ' W · ' + profile.losses + ' L across ' + profile.matches + ' matches')
                : 'No matches yet — pehli kursi ka intezaar.';
        }

        const usage = $('prof-usage');
        if (usage) {
            const entries = Object.keys(profile.usage)
                .map((k) => [k, profile.usage[k]])
                .sort((a, b) => b[1] - a[1]);
            if (!entries.length) {
                usage.innerHTML = '<div class="usage-row"><span class="uk">—</span><span class="ub"><i style="width:0%"></i></span><span class="uv">0</span></div>';
            } else {
                const max = entries[0][1] || 1;
                usage.innerHTML = entries.map(([id, n]) => (
                    '<div class="usage-row"><span class="uk">' + ((ROSTER[id] && ROSTER[id].name) || id) + '</span>' +
                    '<span class="ub"><i style="width:' + Math.round((n / max) * 100) + '%"></i></span>' +
                    '<span class="uv">' + n + '</span></div>'
                )).join('');
            }
        }
    }

    function renderMoves() {
        const box = $('moves-roster');
        if (!box || box.childElementCount || typeof ROSTER === 'undefined') return;
        box.innerHTML = Object.values(ROSTER).map((c) => (
            '<div class="mv"><span><b>' + c.name + '</b><br>' + c.sp1Name + ' · ' + c.sp2Name + '</span><kbd>' + c.superName + '</kbd></div>'
        )).join('');
    }

    /* ------------------------------------------------------------------
       settings screen (shares the in-fight settings object)
       ------------------------------------------------------------------ */
    function settingsApi() { return window.FKUI_SETTINGS || null; }

    function syncSettings() {
        const api = settingsApi();
        const music = $('set-music');
        const musicVal = $('set-music-val');
        const vol = Math.round(((typeof sfx !== 'undefined' && sfx.musicVol) || 0.22) * 100);
        if (music) music.value = String(vol);
        if (musicVal) musicVal.textContent = String(vol);

        if (!api) return;
        const s = api.get();
        $$('#settings-screen .seg').forEach((seg) => {
            const key = seg.getAttribute('data-setting');
            $$('button', seg).forEach((b) => b.classList.toggle('active', b.getAttribute('data-val') === s[key]));
        });
    }

    document.addEventListener('click', (e) => {
        const b = e.target.closest('#settings-screen .seg button');
        if (!b) return;
        const api = settingsApi();
        if (!api) return;
        api.set(b.parentElement.getAttribute('data-setting'), b.getAttribute('data-val'));
        syncSettings();
        try { sfx.uiTap(); } catch (err) {}
    }, false);

    document.addEventListener('input', (e) => {
        if (!e.target.matches('#set-music')) return;
        const v = Number(e.target.value) / 100;
        const val = $('set-music-val');
        if (val) val.textContent = String(Math.round(v * 100));
        try {
            sfx.musicVol = v;
            sfx.targetMusicVol = v;
        } catch (err) {}
    }, false);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#reset-profile')) return;
        profile = blankProfile();
        saveProfile();
        renderProfile();
        renderMenu();
    }, false);

    /* ------------------------------------------------------------------
       boot the flow
       ------------------------------------------------------------------ */
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#accept-disclaimer')) return;
        e.stopPropagation();
        e.preventDefault();
        try { sfx.init(); sfx.playDholBeat(180, 0.25); } catch (err) {}
        boot(() => show('menu-screen'));
    }, true);

    function init() {
        if (!window.game) { setTimeout(init, 120); return; }
        show('menu-screen');          // boot screen is only used after the notice
        $('boot-screen').style.display = 'none';
        $('disclaimer-screen').style.display = 'flex';
        renderMenu();
    }
    setTimeout(init, 60);

    /* public surface */
    window.FKUI = {
        show, boot,
        startFight,
        onHit, onSuper, matchEnd,
        pauseGame, resumeGame,
        get current() { return current; }
    };
})();
