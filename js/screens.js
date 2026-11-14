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
        usage: {}, lastId: null,
        coins: 150, owned: ['finish-bronze'], equip: 'finish-bronze',
        missions: {}, claimed: []
    });
    let profile = blankProfile();
    function loadProfile() {
        try { Object.assign(profile, JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')); } catch (e) { /* fresh save */ }
        if (!profile.usage) profile.usage = {};
        if (!Array.isArray(profile.owned) || !profile.owned.length) profile.owned = ['finish-bronze'];
        if (!profile.equip) profile.equip = 'finish-bronze';
        if (typeof profile.coins !== 'number') profile.coins = 150;
        if (!profile.missions || typeof profile.missions !== 'object') profile.missions = {};
        if (!Array.isArray(profile.claimed)) profile.claimed = [];
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
        'pause-screen', 'results-screen', 'settings-screen', 'profile-screen', 'moves-screen',
        'training-screen', 'vault-screen', 'bazaar-screen', 'missions-screen'
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
            if (id !== 'vs-screen') hud.classList.remove('on');
        }
        if (id === 'menu-screen') renderMenu();
        if (id === 'profile-screen') renderProfile();
        if (id === 'moves-screen') renderMoves();
        if (id === 'settings-screen') syncSettings();
        if (id === 'select-screen') syncPicks();
        if (id === 'training-screen') renderTraining();
        if (id === 'vault-screen') renderVault();
        if (id === 'bazaar-screen') renderBazaar();
        if (id === 'missions-screen') renderMissions();
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
        paintCoins();
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
            if (training.active) applyFinish(g.p1);
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
            else if (target === 'training') { training.active = false; show('training-screen'); }
            else if (target === 'vault') show('vault-screen');
            else if (target === 'bazaar') show('bazaar-screen');
            else if (target === 'missions') show('missions-screen');
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
            if (current === 'select-screen' || current === 'settings-screen' || current === 'profile-screen' || current === 'moves-screen' ||
                current === 'training-screen' || current === 'vault-screen' || current === 'bazaar-screen' || current === 'missions-screen') {
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
        const stats = matchStats || { p1dmg: 0, bestCombo: 0, supers: 0, timeLeft: 0 };

        // the dojo never reaches the results screen and never touches the record
        if (training.active) {
            training.active = false;
            $('hud').classList.remove('on');
            setTimeout(() => show('training-screen'), 300);
            return;
        }

        profile.matches++;
        if (p1Won) profile.wins++; else profile.losses++;
        profile.supers += stats.supers;
        profile.bestCombo = Math.max(profile.bestCombo, stats.bestCombo);
        const timeLeft = Math.max(0, Math.round(g.timer || 0));
        profile.longest = Math.max(profile.longest, 60 - timeLeft);
        profile.usage[p1.id] = (profile.usage[p1.id] || 0) + 1;
        profile.lastId = p1.id;

        /* coins are only ever paid for real match output */
        const earned = (p1Won ? 60 : 25)
            + (stats.supers ? stats.supers * 10 : 0)
            + (stats.bestCombo >= 5 ? 15 : 0);
        profile.coins += earned;
        completeMissionBookkeeping(g, p1Won, stats);
        saveProfile();

        const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
        const img = (id, idn) => { const el = $(id); if (el) el.src = faceOf(idn); };

        set('res-winner', (p1Won ? p1.name : p2.name));
        set('res-kicker', p1Won ? 'Kursi haasil — victory' : 'Kursi gayi — defeat');
        set('res-p1-name', p1.name); img('res-p1-face', p1.id);
        set('res-p2-name', p2.name); img('res-p2-face', p2.id);
        set('res-rounds', (g.p1Wins || 0) + ' — ' + (g.p2Wins || 0));
        set('res-time', timeLeft + 's');
        set('res-dmg', String(Math.round(stats.p1dmg)));
        set('res-combo', String(stats.bestCombo));
        set('res-super', String(stats.supers));
        set('res-coins', '+' + earned);

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

    /* ==================================================================
       THEME — four concepts, one CSS variable contract
       The theme only swaps variables; no layout or markup changes, so a
       screenshot of any screen at A is the same geometry as at D.
       ================================================================== */
    const THEME_KEY = 'fk.theme';
    const THEMES = ['a', 'b', 'c', 'd'];

    function paintTheme(t) {
        $$('#theme-switch .ts-btn').forEach((b) => {
            b.classList.toggle('is-on', b.getAttribute('data-theme-set') === t);
        });
    }
    function applyTheme(t) {
        const id = THEMES.indexOf(t) >= 0 ? t : 'a';
        document.body.setAttribute('data-theme', id);
        paintTheme(id);
        try { localStorage.setItem(THEME_KEY, id); } catch (e) {}
    }
    let themeId = 'a';
    try { themeId = localStorage.getItem(THEME_KEY) || 'a'; } catch (e) {}
    applyTheme(themeId);

    document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-theme-set]');
        if (!b) return;
        applyTheme(b.getAttribute('data-theme-set'));
        try { sfx.uiTap(); } catch (err) {}
    }, false);

    /* ==================================================================
       ECONOMY — Kursi Coins, missions, vault
       Every coin here comes from a real match or a real mission counter.
       There is no purchase path, no timer, no reroll.
       ================================================================== */
    const SHOP = [
        { id: 'finish-bronze', kind: 'finish', name: 'Forged Bronze', desc: 'Default finish. Warm brass emissive on every GLB material.', price: 0, hex: 0xd8b26a, glow: 0.10 },
        { id: 'finish-emerald', kind: 'finish', name: 'Lok Sabha Emerald', desc: 'Cool green rim tint. Reads clearly on the bright Sansad floor.', price: 400, hex: 0x2fae7a, glow: 0.16 },
        { id: 'finish-crimson', kind: 'finish', name: 'Akhada Crimson', desc: 'Akhada red heat. Strongest glow that still sits inside the danger palette.', price: 750, hex: 0xc0302a, glow: 0.18 },
        { id: 'finish-cyan', kind: 'finish', name: 'Studio Cyan', desc: 'Broadcast cyan. Pairs with the Cyber theme without changing the fighter.', price: 950, hex: 0x24a9f0, glow: 0.16 }
    ];
    const MISSIONS = [
        { id: 'm-super', name: 'Shakti Directive', desc: 'Land 3 supers across any matches.', metric: 'supers', target: 3, reward: 180 },
        { id: 'm-combo', name: 'Combo Chakra', desc: 'Hit a 5-hit combo in a single match.', metric: 'combos', target: 1, reward: 220 },
        { id: 'm-sweep', name: 'Clean Sweep', desc: 'Win a match without dropping a round.', metric: 'sweeps', target: 1, reward: 260 },
        { id: 'm-grind', name: 'Floor Test', desc: 'Play 5 matches on any stage.', metric: 'matches', target: 5, reward: 140 }
    ];

    const shopItem = (id) => SHOP.filter((s) => s.id === id)[0] || SHOP[0];
    const owns = (id) => profile.owned.indexOf(id) >= 0;
    const missionCount = (m) => (profile.missions[m.id] || 0);
    const missionDone = (m) => missionCount(m) >= m.target;
    const missionClaimed = (m) => profile.claimed.indexOf(m.id) >= 0;

    function paintCoins() {
        $$('.coin-value').forEach((el) => { el.textContent = String(profile.coins | 0); });
    }

    function applyFinish(fighter) {
        if (!fighter || !fighter.glbMats || !fighter.glbMats.length) return;
        const f = shopItem(profile.equip);
        fighter.glbMats.forEach((m) => {
            if (!m) return;
            if (m.emissive && m.emissive.setHex) m.emissive.setHex(f.hex);
            if (typeof m.emissiveIntensity === 'number') m.emissiveIntensity = f.glow;
        });
        fighter._finishApplied = profile.equip;
    }

    function swatchCss(hex) {
        const c = '#' + hex.toString(16).padStart(6, '0');
        return 'background: radial-gradient(120% 100% at 30% 20%, ' + c + 'cc, #0a0d10 72%);';
    }

    function renderVault() {
        paintCoins();
        const box = $('vault-grid');
        if (!box) return;
        const owned = SHOP.filter((s) => owns(s.id));
        if (!owned.length) {
            box.innerHTML = '<div class="vault-empty">Vault khaali hai. Bazaar se pehla finish kharido.</div>';
            return;
        }
        box.innerHTML = owned.map((s) => {
            const on = profile.equip === s.id;
            return '<article class="vault-card' + (on ? ' is-equipped' : '') + '">' +
                '<div class="vc-swatch" style="' + swatchCss(s.hex) + '"></div>' +
                '<div class="vc-name">' + s.name + '</div>' +
                '<div class="vc-desc">' + s.desc + '</div>' +
                '<div class="vc-row">' +
                    '<span class="vc-lock">' + (on ? 'Equipped' : 'Owned') + '</span>' +
                    '<button class="btn ' + (on ? 'btn-ghost' : 'btn-gold') + '" data-equip="' + s.id + '"' + (on ? ' disabled' : '') + '>' +
                        (on ? 'In use' : 'Equip') + '</button>' +
                '</div>' +
            '</article>';
        }).join('');
    }

    function renderBazaar() {
        paintCoins();
        const box = $('bazaar-grid');
        if (!box) return;
        box.innerHTML = SHOP.map((s) => {
            const owned = owns(s.id);
            const can = profile.coins >= s.price;
            const label = owned ? 'Owned' : (can ? 'Buy · ' + s.price : 'Need ' + (s.price - profile.coins) + ' more');
            return '<article class="bazaar-card' + (owned ? ' is-equipped' : '') + '">' +
                '<div class="vc-swatch" style="' + swatchCss(s.hex) + '"></div>' +
                '<div class="vc-name">' + s.name + '</div>' +
                '<div class="vc-desc">' + s.desc + '</div>' +
                '<div class="vc-row">' +
                    '<span class="vc-price">' + (s.price ? '◈ ' + s.price : 'Starter') + '</span>' +
                    (owned
                        ? '<span class="vc-lock">' + (profile.equip === s.id ? 'Equipped' : 'In vault') + '</span>'
                        : '<button class="btn ' + (can ? 'btn-gold' : 'btn-ghost') + '" data-buy="' + s.id + '"' + (can ? '' : ' disabled') + '>' + label + '</button>') +
                '</div>' +
            '</article>';
        }).join('');
    }

    function renderMissions() {
        paintCoins();
        const box = $('mission-list');
        if (!box) return;
        box.innerHTML = MISSIONS.map((m) => {
            const n = missionCount(m);
            const done = missionDone(m);
            const claimed = missionClaimed(m);
            const pct = Math.min(100, Math.round((n / m.target) * 100));
            return '<div class="mission-row' + (done ? ' is-done' : '') + (claimed ? ' is-claimed' : '') + '">' +
                '<div><div class="m-name">' + m.name + '</div><div class="m-sub">' + m.desc + '</div></div>' +
                '<div class="mission-prog-wrap">' +
                    '<div class="mission-prog"><i style="width:' + pct + '%"></i></div>' +
                    '<div class="mission-count">' + Math.min(n, m.target) + ' / ' + m.target + '</div>' +
                '</div>' +
                '<button class="btn ' + (done && !claimed ? 'btn-gold' : 'btn-ghost') + '" data-claim="' + m.id + '"' +
                    (done && !claimed ? '' : ' disabled') + '>' +
                    (claimed ? 'Claimed' : (done ? 'Claim ◈ ' + m.reward : '◈ ' + m.reward)) +
                '</button>' +
            '</div>';
        }).join('');
    }

    function completeMissionBookkeeping(g, p1Won, stats) {
        const bump = (metric, amount) => {
            MISSIONS.forEach((m) => {
                if (m.metric !== metric) return;
                if (missionClaimed(m)) return;
                profile.missions[m.id] = Math.min(m.target, missionCount(m) + amount);
            });
        };
        bump('matches', 1);
        if (stats) {
            if (stats.supers) bump('supers', stats.supers);
            bump('combos', (stats.bestCombo || 0) >= 5 ? 1 : 0);
        }
        if (p1Won && (g.p2Wins || 0) === 0) bump('sweeps', 1);
    }

    /* ==================================================================
       TRAINING DOJO
       Real engine state, no fake toggles: shakti is written every frame,
       the dummy actually heals, the clock is actually pinned.
       ================================================================== */
    const training = { active: false, shakti: true, heal: true, freeze: true, dummy: 'YATRABOY' };

    function renderTraining() {
        paintCoins();
        const box = $('train-roster');
        if (box && typeof ROSTER !== 'undefined') {
            box.innerHTML = Object.values(ROSTER).map((c) => (
                '<button class="train-card' + (training.dummy === c.id ? ' is-on' : '') + '" data-dummy="' + c.id + '">' +
                    '<img src="' + faceOf(c.id) + '" alt="">' +
                    '<span>' + c.name + '</span>' +
                '</button>'
            )).join('');
        }
        $$('#training-screen .seg[data-train]').forEach((seg) => {
            const key = seg.getAttribute('data-train');
            $$('button', seg).forEach((b) => {
                const on = b.getAttribute('data-val') === 'on';
                b.classList.toggle('active', on === !!training[key]);
            });
        });
    }

    function trainingTick() {
        requestAnimationFrame(trainingTick);
        const g = window.game;
        if (!g || !g.p1) return;
        // an equipped finish must survive a late GLB attach, so keep it in sync
        if (g.p1.glbMats && g.p1.glbMats.length && g.p1._finishApplied !== profile.equip) applyFinish(g.p1);
        if (!training.active) return;
        if (training.shakti) g.p1.shakti = 100;
        if (training.freeze && g.matchActive) g.timer = 60;
        if (training.heal && g.p2 && g.p2.hp < g.p2.maxHp) g.p2.hp = g.p2.maxHp;
        if (g.p1.hp <= 0) g.p1.hp = g.p1.maxHp;          // the dojo never ends
    }
    requestAnimationFrame(trainingTick);

    document.addEventListener('click', (e) => {
        const card = e.target.closest('[data-dummy]');
        if (card) {
            training.dummy = card.getAttribute('data-dummy');
            renderTraining();
            try { sfx.uiTap(); } catch (err) {}
            return;
        }
        const seg = e.target.closest('#training-screen .seg[data-train] button');
        if (seg) {
            const key = seg.parentElement.getAttribute('data-train');
            training[key] = seg.getAttribute('data-val') === 'on';
            renderTraining();
            try { sfx.uiTap(); } catch (err) {}
            return;
        }
        if (e.target.closest('#train-reset')) {
            const g = window.game;
            if (g && g.p1) {
                g.p1.hp = g.p1.maxHp;
                if (g.p2) g.p2.hp = g.p2.maxHp;
                g.timer = 60;
                g.p1.root.position.x = -2.2;
                g.p2.root.position.x = 2.2;
            }
            return;
        }
        if (e.target.closest('#train-start')) {
            const g = window.game;
            if (!g) return;
            g.p2Choice = training.dummy;
            if (typeof g.refreshRosterCards === 'function') g.refreshRosterCards();
            training.active = true;
            startFight();
            return;
        }
        const buy = e.target.closest('[data-buy]');
        if (buy) {
            const s = shopItem(buy.getAttribute('data-buy'));
            if (!s || owns(s.id) || profile.coins < s.price) return;
            profile.coins -= s.price;
            profile.owned.push(s.id);
            saveProfile();
            renderBazaar();
            renderVault();
            try { sfx.play('kaching'); } catch (err) {}
            return;
        }
        const eq = e.target.closest('[data-equip]');
        if (eq) {
            const id = eq.getAttribute('data-equip');
            if (!owns(id)) return;
            profile.equip = id;
            saveProfile();
            renderVault();
            renderBazaar();
            applyFinish(window.game && window.game.p1);
            try { sfx.uiConfirm(); } catch (err) {}
            return;
        }
        const claim = e.target.closest('[data-claim]');
        if (claim) {
            const m = MISSIONS.filter((x) => x.id === claim.getAttribute('data-claim'))[0];
            if (!m || !missionDone(m) || missionClaimed(m)) return;
            profile.claimed.push(m.id);
            profile.coins += m.reward;
            saveProfile();
            renderMissions();
            try { sfx.play('kaching'); } catch (err) {}
        }
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
