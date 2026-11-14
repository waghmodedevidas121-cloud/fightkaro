/**
 * ============================================================================
 * FIGHTKARO — AAA UI SCREEN CONTROLLER (11 Fighters + Vault + Bazaar + Missions + Training)
 * ============================================================================
 */
(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
    const faceOf = (id) => 'faces/' + ((typeof CHAR_FACE !== 'undefined' && CHAR_FACE[id]) || 'modi') + '.webp';
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    /* ------------------------------------------------------------------
       career profile & economy (persisted)
       ------------------------------------------------------------------ */
    const PROFILE_KEY = 'fk.profile';
    const ECON_KEY = 'fk.economy.v1';

    const blankProfile = () => ({
        matches: 0, wins: 0, losses: 0,
        supers: 0, bestCombo: 0, longest: 0,
        usage: {}, lastId: null
    });
    let profile = blankProfile();
    function loadProfile() {
        try { Object.assign(profile, JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')); } catch (e) {}
        if (!profile.usage) profile.usage = {};
    }
    loadProfile();
    const saveProfile = () => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) {} };

    const SKINS_CATALOG = [
        { id: 'DEFAULT', name: 'Standard Sansad Attire', desc: 'Original WebP textures from GLB rig.', price: 0, hex: null, badge: 'DEFAULT' },
        { id: 'BRONZE', name: 'Forged Bronze Armor', desc: 'Warm metallic bronze-gold shader tint on GLB.', price: 800, hex: 0xf0c975, badge: 'RARE' },
        { id: 'EMERALD', name: 'Lok Sabha Emerald', desc: 'Deep emerald diplomatic finish.', price: 1200, hex: 0x6ee7b7, badge: 'EPIC' },
        { id: 'CRIMSON', name: 'Akhada Crimson Fury', desc: 'Battle-hardened crimson aura tint.', price: 1800, hex: 0xfca5a5, badge: 'LEGENDARY' }
    ];

    const PROPS_CATALOG = [
        { id: 'DEFAULT', name: 'Signature Neta Super Prop', desc: 'Uses each fighter\'s native 3D Super Rig.', price: 0, badge: 'NATIVE' },
        { id: 'CHAKRA', name: 'Mitra Chakra Rig', desc: 'Hurls the spinning Golden Chakra in any Super.', price: 1000, badge: '3D PROP' },
        { id: 'ALOO', name: 'Aloo-Se-Sona Converter', desc: 'Transmutes opponent into Gold Bars.', price: 1400, badge: '3D PROP' },
        { id: 'CAULDRON', name: 'Jadu Hobe Cauldron', desc: 'Turns opponent into a hopping Frog.', price: 1400, badge: '3D PROP' },
        { id: 'STAMP', name: '200% Tariff Gold Stamp', desc: 'Drops the colossal Golden Stamp.', price: 1600, badge: '3D PROP' }
    ];

    const MISSIONS_CATALOG = [
        { id: 'm_first_win', title: 'Pehli Kursi Victory', desc: 'Win 1 match in Sansad Showdown.', reward: 500, check: (p) => p.wins >= 1 },
        { id: 'm_combo_3', title: 'Parliamentary Combo', desc: 'Land a 3+ hit combo in battle.', reward: 400, check: (p) => p.bestCombo >= 3 },
        { id: 'm_super_2', title: 'Shakti Overdrive', desc: 'Unleash 2 Shakti Super attacks.', reward: 600, check: (p) => p.supers >= 2 },
        { id: 'm_veteran', title: 'Lok Sabha Veteran', desc: 'Complete 5 total matches.', reward: 1000, check: (p) => p.matches >= 5 }
    ];

    let econ = {
        coins: 2500,
        votes: 120,
        xp: 450,
        unlockedSkins: ['DEFAULT', 'BRONZE'],
        equippedSkin: 'DEFAULT',
        unlockedProps: ['DEFAULT'],
        equippedProp: 'DEFAULT',
        claimedMissions: [],
        concept: 'concept-a'
    };

    function loadEcon() {
        try {
            const saved = JSON.parse(localStorage.getItem(ECON_KEY) || '{}');
            Object.assign(econ, saved);
            if (!Array.isArray(econ.unlockedSkins)) econ.unlockedSkins = ['DEFAULT', 'BRONZE'];
            if (!Array.isArray(econ.unlockedProps)) econ.unlockedProps = ['DEFAULT'];
            if (!Array.isArray(econ.claimedMissions)) econ.claimedMissions = [];
        } catch (e) {}
    }
    loadEcon();
    const saveEcon = () => { try { localStorage.setItem(ECON_KEY, JSON.stringify(econ)); } catch (e) {} };

    function syncEconHeader() {
        const lvl = 1 + Math.floor((econ.xp || 0) / 500);
        if ($('ui-player-lvl')) $('ui-player-lvl').textContent = String(lvl);
        if ($('ui-kursi-coins')) $('ui-kursi-coins').textContent = econ.coins.toLocaleString();
        if ($('ui-votes')) $('ui-votes').textContent = String(econ.votes);
        if ($('bazaar-coins')) $('bazaar-coins').textContent = econ.coins.toLocaleString();
    }

    function applyConcept(conceptId) {
        econ.concept = conceptId;
        document.documentElement.setAttribute('data-concept', conceptId);
        const labels = {
            'concept-a': 'CONCEPT A // AAA OBSIDIAN & FORGED BRONZE',
            'concept-b': 'CONCEPT B // ESPORTS TOURNAMENT BROADCAST',
            'concept-c': 'CONCEPT C // CYBERPUNK TACTICAL HOLOGRAM',
            'concept-d': 'CONCEPT D // ARCHITECTURAL MINIMAL COMBAT'
        };
        if ($('active-concept-label')) $('active-concept-label').textContent = labels[conceptId] || labels['concept-a'];
        $$('.c-btn').forEach((b) => b.classList.toggle('active', b.getAttribute('data-concept-pick') === conceptId));
        saveEcon();
    }
    applyConcept(econ.concept || 'concept-a');

    function applyEquippedLoadout(g) {
        if (!g || !g.p1) return;
        const skin = SKINS_CATALOG.find((s) => s.id === econ.equippedSkin) || SKINS_CATALOG[0];
        if (typeof g.p1.setSkinTint === 'function') g.p1.setSkinTint(skin.hex);
    }

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
        'vault-screen', 'bazaar-screen', 'missions-screen'
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
            if (id !== 'hud') hud.classList.remove('on');
        }
        syncEconHeader();
        if (id === 'menu-screen') renderMenu();
        if (id === 'profile-screen') renderProfile();
        if (id === 'moves-screen') renderMoves();
        if (id === 'settings-screen') syncSettings();
        if (id === 'select-screen') syncPicks();
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
            [22, 'ACESFilmic 3D Renderer taiyaar…'],
            [48, 'Sansad Bhavan Arena & Lighting…'],
            [74, 'Real Audio Bank load ho raha hai…'],
            [94, '11 GLB Netas ready…']
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
            setTimeout(done, 240);
        }, 120);
    }

    /* ------------------------------------------------------------------
       menu
       ------------------------------------------------------------------ */
    function renderMenu() {
        loadProfile();
        syncEconHeader();
        const strip = $('menu-roster');
        if (strip && !strip.childElementCount && typeof ROSTER !== 'undefined') {
            strip.innerHTML = Object.values(ROSTER).map((c) => (
                '<div class="face" data-quick-pick="' + c.id + '"><img src="' + faceOf(c.id) + '" alt=""><span>' + c.name + '</span></div>'
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
            build.textContent = (meta ? meta.content : 'local') + ' · 11 GLBs';
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

        const side = $('toggle-pick-side');
        if (side) side.textContent = 'PICKING: ' + (g.pickingFor || 'P1');
    }

    /* ------------------------------------------------------------------
       vault, bazaar, missions rendering
       ------------------------------------------------------------------ */
    function renderVault() {
        const sList = $('vault-skins-list');
        if (sList) {
            sList.innerHTML = SKINS_CATALOG.map((s) => {
                const owned = econ.unlockedSkins.includes(s.id);
                const eq = econ.equippedSkin === s.id;
                return `<div class="set-row">
                    <div><div class="sr-k">${s.name} <span style="color:var(--brass);font-size:9px;">[${s.badge}]</span></div><div class="sr-d">${s.desc}</div></div>
                    <div>${eq
                        ? '<button class="btn btn-gold" style="min-height:32px;padding:0 12px;font-size:10px;" disabled>EQUIPPED</button>'
                        : owned
                            ? `<button class="btn" style="min-height:32px;padding:0 12px;font-size:10px;" data-equip-skin="${s.id}">EQUIP</button>`
                            : `<button class="btn btn-ghost" style="min-height:32px;padding:0 12px;font-size:10px;" data-go="bazaar">LOCKED (${s.price})</button>`
                    }</div>
                </div>`;
            }).join('');
        }

        const pList = $('vault-props-list');
        if (pList) {
            pList.innerHTML = PROPS_CATALOG.map((p) => {
                const owned = econ.unlockedProps.includes(p.id);
                const eq = econ.equippedProp === p.id;
                return `<div class="set-row">
                    <div><div class="sr-k">${p.name} <span style="color:var(--teal);font-size:9px;">[${p.badge}]</span></div><div class="sr-d">${p.desc}</div></div>
                    <div>${eq
                        ? '<button class="btn btn-gold" style="min-height:32px;padding:0 12px;font-size:10px;" disabled>EQUIPPED</button>'
                        : owned
                            ? `<button class="btn" style="min-height:32px;padding:0 12px;font-size:10px;" data-equip-prop="${p.id}">EQUIP</button>`
                            : `<button class="btn btn-ghost" style="min-height:32px;padding:0 12px;font-size:10px;" data-go="bazaar">LOCKED (${p.price})</button>`
                    }</div>
                </div>`;
            }).join('');
        }
    }

    function renderBazaar() {
        syncEconHeader();
        const grid = $('bazaar-items-grid');
        if (!grid) return;
        const skinCards = SKINS_CATALOG.filter((s) => s.price > 0).map((s) => {
            const owned = econ.unlockedSkins.includes(s.id);
            return `<section class="set-group">
                <h3>3D GLB SHADER SKIN · ${s.badge}</h3>
                <div class="set-row">
                    <div><div class="sr-k">${s.name}</div><div class="sr-d">${s.desc}</div></div>
                    <div>${owned
                        ? '<span class="eyebrow" style="color:var(--green)">OWNED</span>'
                        : `<button class="btn btn-gold" style="min-height:34px;padding:0 14px;font-size:11px;" data-buy-skin="${s.id}">BUY · ${s.price} KURSI</button>`
                    }</div>
                </div>
            </section>`;
        }).join('');

        const propCards = PROPS_CATALOG.filter((p) => p.price > 0).map((p) => {
            const owned = econ.unlockedProps.includes(p.id);
            return `<section class="set-group">
                <h3>3D SUPER PROP RIG · ${p.badge}</h3>
                <div class="set-row">
                    <div><div class="sr-k">${p.name}</div><div class="sr-d">${p.desc}</div></div>
                    <div>${owned
                        ? '<span class="eyebrow" style="color:var(--green)">OWNED</span>'
                        : `<button class="btn btn-gold" style="min-height:34px;padding:0 14px;font-size:11px;" data-buy-prop="${p.id}">BUY · ${p.price} KURSI</button>`
                    }</div>
                </div>
            </section>`;
        }).join('');

        grid.innerHTML = skinCards + propCards;
    }

    function renderMissions() {
        loadProfile();
        const list = $('missions-list');
        if (!list) return;
        list.innerHTML = MISSIONS_CATALOG.map((m) => {
            const done = m.check(profile);
            const claimed = econ.claimedMissions.includes(m.id);
            return `<section class="set-group">
                <h3>REWARD: +${m.reward} KURSI COINS</h3>
                <div class="set-row">
                    <div><div class="sr-k">${m.title}</div><div class="sr-d">${m.desc}</div></div>
                    <div>${claimed
                        ? '<span class="eyebrow" style="color:var(--paper-mute)">CLAIMED</span>'
                        : done
                            ? `<button class="btn btn-gold" style="min-height:34px;padding:0 14px;font-size:11px;" data-claim-mission="${m.id}">CLAIM +${m.reward}</button>`
                            : '<span class="eyebrow" style="color:var(--brass)">IN PROGRESS</span>'
                    }</div>
                </div>
            </section>`;
        }).join('');
    }

    /* ------------------------------------------------------------------
       VS / battle prep gate & Training Dojo launch
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

    function startFight(opts) {
        opts = opts || {};
        const g = window.game;
        if (!g || busy) return;
        busy = true;

        const p1 = ROSTER[g.p1Choice] || ROSTER.MITRAMAN;
        const p2 = ROSTER[g.p2Choice] || ROSTER.YATRABOY;

        const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
        const img = (id, idn) => { const el = $(id); if (el) el.src = faceOf(idn); };
        set('vs-p1-name', p1.name); set('vs-p1-team', p1.team); img('vs-p1-face', p1.id);
        set('vs-p2-name', p2.name); set('vs-p2-team', opts.training ? 'Training Dummy' : p2.team); img('vs-p2-face', p2.id);
        const stageNames = { SANSAD: 'Sansad Bhavan', JANTAR: 'Jantar Mantar', SADAK: 'Desi Sadak' };
        set('vs-stage', opts.training ? 'Training Dojo' : (stageNames[g.stageChoice] || 'Sansad Bhavan'));

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
            g.startFullMatch({ training: !!opts.training });
            $('hud').classList.add('on');
            current = 'hud';
            busy = false;
        };

        if (!jobs.length) { paint(1); setTimeout(launch, 300); return; }
        loadProgress(jobs, paint);
        Promise.race([
            Promise.all(jobs.map((j) => j.catch(() => null))),
            new Promise((r) => setTimeout(r, 12000))
        ]).then(() => setTimeout(launch, 340));
    }

    document.addEventListener('click', (e) => {
        const conceptBtn = e.target.closest('[data-concept-pick]');
        if (conceptBtn) {
            applyConcept(conceptBtn.getAttribute('data-concept-pick'));
            try { sfx.uiTap(); } catch (err) {}
            return;
        }

        const quickPick = e.target.closest('[data-quick-pick]');
        if (quickPick && window.game) {
            window.game.p1Choice = quickPick.getAttribute('data-quick-pick');
            if (typeof window.game.refreshRosterCards === 'function') window.game.refreshRosterCards();
            show('select-screen');
            return;
        }

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

        if (e.target.closest('#start-fight-btn')) {
            e.stopPropagation();
            e.preventDefault();
            startFight();
            return;
        }

        const buySkin = e.target.closest('[data-buy-skin]');
        if (buySkin) {
            const id = buySkin.getAttribute('data-buy-skin');
            const item = SKINS_CATALOG.find((s) => s.id === id);
            if (item && econ.coins >= item.price && !econ.unlockedSkins.includes(id)) {
                econ.coins -= item.price;
                econ.unlockedSkins.push(id);
                econ.equippedSkin = id;
                saveEcon();
                try { sfx.play('kaching'); } catch (err) {}
                renderBazaar();
            }
            return;
        }

        const buyProp = e.target.closest('[data-buy-prop]');
        if (buyProp) {
            const id = buyProp.getAttribute('data-buy-prop');
            const item = PROPS_CATALOG.find((p) => p.id === id);
            if (item && econ.coins >= item.price && !econ.unlockedProps.includes(id)) {
                econ.coins -= item.price;
                econ.unlockedProps.push(id);
                econ.equippedProp = id;
                saveEcon();
                try { sfx.play('kaching'); } catch (err) {}
                renderBazaar();
            }
            return;
        }

        const eqSkin = e.target.closest('[data-equip-skin]');
        if (eqSkin) {
            econ.equippedSkin = eqSkin.getAttribute('data-equip-skin');
            saveEcon();
            try { sfx.uiConfirm(); } catch (err) {}
            renderVault();
            return;
        }

        const eqProp = e.target.closest('[data-equip-prop]');
        if (eqProp) {
            econ.equippedProp = eqProp.getAttribute('data-equip-prop');
            saveEcon();
            try { sfx.uiConfirm(); } catch (err) {}
            renderVault();
            return;
        }

        const claimBtn = e.target.closest('[data-claim-mission]');
        if (claimBtn) {
            const id = claimBtn.getAttribute('data-claim-mission');
            const m = MISSIONS_CATALOG.find((x) => x.id === id);
            if (m && !econ.claimedMissions.includes(id)) {
                econ.claimedMissions.push(id);
                econ.coins += m.reward;
                econ.xp += 150;
                saveEcon();
                try { sfx.play('coins'); } catch (err) {}
                syncEconHeader();
                renderMissions();
            }
            return;
        }

        // Training Toolbar actions
        if (e.target.closest('#tr-fill-shakti') && window.game) {
            window.game.p1.shakti = 100;
            window.game.updateHUD();
            try { sfx.play('super_charge'); } catch (err) {}
            return;
        }
        if (e.target.closest('#tr-reset-pos') && window.game) {
            window.game.p1.root.position.set(-2.4, 0, 0);
            window.game.p2.root.position.set(2.4, 0, 0);
            window.game.p2.hp = window.game.p2.maxHp;
            window.game.updateHUD();
            return;
        }
        if (e.target.closest('#tr-exit') && window.game) {
            window.game.trainingMode = false;
            window.game.matchActive = false;
            $('hud').classList.remove('on');
            show('menu-screen');
            return;
        }

        const res = e.target.closest('[data-res]');
        if (res) {
            const what = res.getAttribute('data-res');
            if (what === 'rematch') { hide('results-screen'); startFight(); }
            if (what === 'select') { hide('results-screen'); show('select-screen'); }
            if (what === 'menu') { hide('results-screen'); $('hud').classList.remove('on'); show('menu-screen'); }
            return;
        }

        const go = e.target.closest('[data-go]');
        if (go) {
            const target = go.getAttribute('data-go');
            if (target === 'training') { startFight({ training: true }); return; }
            if (target === 'select') show('select-screen');
            else if (target === 'profile') show('profile-screen');
            else if (target === 'moves') show('moves-screen');
            else if (target === 'vault') show('vault-screen');
            else if (target === 'bazaar') show('bazaar-screen');
            else if (target === 'missions') show('missions-screen');
            else if (target === 'settings') { backTarget = 'menu-screen'; show('settings-screen'); }
            return;
        }

        const back = e.target.closest('[data-back]');
        if (back) show(back.getAttribute('data-back') + '-screen');
    }, true);

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
       pause
       ------------------------------------------------------------------ */
    let pausedFrom = false;

    function pauseGame() {
        const g = window.game;
        if (!g || !$('hud').classList.contains('on') || current === 'pause-screen') return;
        pausedFrom = !!g.matchActive;
        g.matchActive = false;
        try { if (sfx.music) sfx.music.volume = Math.min(sfx.music.volume, 0.08); } catch (e) {}
        const r = $('pause-round'); if (r) r.textContent = g.trainingMode ? 'TRAINING DOJO' : ('ROUND ' + (g.round || 1));
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
            window.game.startFullMatch({ training: window.game.trainingMode });
        }
        if (what === 'settings') { backTarget = 'pause-screen'; hide('pause-screen'); show('settings-screen'); }
        if (what === 'quit') {
            hide('pause-screen');
            current = 'menu-screen';
            pausedFrom = false;
            if (window.game) { window.game.trainingMode = false; window.game.matchActive = false; }
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
            if (['select-screen', 'settings-screen', 'profile-screen', 'moves-screen', 'vault-screen', 'bazaar-screen', 'missions-screen'].includes(current)) {
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
       match statistics & rewards
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

        // Award Kursi Coins, Votes, and XP
        const earnedCoins = p1Won ? 450 : 150;
        const earnedVotes = p1Won ? 25 : 8;
        const earnedXp = p1Won ? 200 : 75;
        econ.coins += earnedCoins;
        econ.votes += earnedVotes;
        econ.xp += earnedXp;
        saveEcon();
        syncEconHeader();

        const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
        const img = (id, idn) => { const el = $(id); if (el) el.src = faceOf(idn); };

        set('res-winner', (p1Won ? p1.name : p2.name));
        set('res-kicker', p1Won ? 'Kursi haasil — victory' : 'Kursi gayi — defeat');
        set('res-reward-banner', `+${earnedCoins} KURSI COINS • +${earnedVotes} VOTES • +${earnedXp} XP`);
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

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#accept-disclaimer')) return;
        e.stopPropagation();
        e.preventDefault();
        try { sfx.init(); sfx.playDholBeat(180, 0.25); } catch (err) {}
        boot(() => show('menu-screen'));
    }, true);

    function init() {
        if (!window.game) { setTimeout(init, 120); return; }
        show('menu-screen');
        $('boot-screen').style.display = 'none';
        $('disclaimer-screen').style.display = 'flex';
        renderMenu();
    }
    setTimeout(init, 60);

    window.FKUI = {
        show, boot,
        startFight,
        onHit, onSuper, matchEnd,
        pauseGame, resumeGame,
        applyEquippedLoadout,
        getEquippedProp: () => econ.equippedProp || 'DEFAULT',
        get current() { return current; }
    };
})();
