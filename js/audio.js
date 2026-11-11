/**
 * ============================================================================
 * 2. AUDIO BANK  -  the real fightkaro.com sound set
 * ----------------------------------------------------------------------------
 * Every clip in ./audio is a real recording shipped with the live game
 * (hits, whoosh, gong, KO sting, round announcers, character voice lines,
 * super beds and releases, UI ticks, win/lose jingles) plus the menu and
 * fight music beds. Nothing here is synthesised.
 * ============================================================================
 */

// name -> [volume, simultaneous voices, loop]
const SOUNDS = {
    /* ---- ui ---- */
    ui_tap:        [0.45, 3, 0],
    ui_select:     [0.55, 3, 0],
    ui_confirm:    [0.65, 2, 0],
    ui_back:       [0.45, 2, 0],

    /* ---- combat ---- */
    hit_1:         [0.88, 5, 0],
    hit_2:         [0.88, 5, 0],
    hit_3:         [0.92, 4, 0],
    block:         [0.70, 3, 0],
    whoosh:        [0.38, 4, 0],
    thud:          [0.75, 3, 0],
    slap:          [0.78, 3, 0],
    boom:          [0.85, 2, 0],
    stamp_slam:    [0.85, 2, 0],
    metal_crunch:  [0.70, 2, 0],
    crate_crash:   [0.70, 2, 0],
    cup_break:     [0.65, 2, 0],
    poof:          [0.55, 3, 0],
    shimmer:       [0.50, 2, 0],
    thunder:       [0.80, 1, 0],
    pataka:        [0.70, 2, 0],
    bomb:          [0.85, 1, 0],
    snap:          [0.50, 3, 0],
    plop:          [0.45, 3, 0],
    frog:          [0.55, 2, 0],
    moo:           [0.55, 2, 0],
    cow_bell:      [0.45, 2, 0],
    chai_ting:     [0.45, 3, 0],
    coins:         [0.50, 2, 0],
    kaching:       [0.55, 2, 0],
    reverse_beeps: [0.60, 1, 0],
    eye_zing:      [0.60, 2, 0],

    /* ---- match flow ---- */
    bell:          [0.55, 1, 0],
    fight:         [0.92, 1, 0],
    ko:            [0.95, 1, 0],
    double_ko:     [0.95, 1, 0],
    round_1:       [0.92, 1, 0],
    round_2:       [0.92, 1, 0],
    final_round:   [0.95, 1, 0],
    perfect:       [0.92, 1, 0],
    time_up:       [0.92, 1, 0],
    you_win:       [0.92, 1, 0],
    you_lose:      [0.85, 1, 0],
    jingle_win:    [0.80, 1, 0],
    jingle_lose:   [0.75, 1, 0],
    horn_long:     [0.60, 1, 0],
    horn_short:    [0.55, 2, 0],
    drumroll:      [0.70, 1, 0],
    news_sting:    [0.55, 1, 0],
    intro:         [0.70, 1, 0],

    /* ---- super beds / releases ---- */
    charge_chakra:   [0.75, 1, 0],
    bed_chakra:      [0.62, 1, 0],
    release_chakra:  [0.85, 1, 0],
    bed_tariff:      [0.62, 1, 0],
    release_tariff:  [0.85, 1, 0],
    bed_jadu:        [0.62, 1, 0],
    release_jadu:    [0.85, 1, 0],
    bed_bulldozer:   [0.62, 1, 0],
    release_bulldozer:[0.85, 1, 0],

    /* ---- character voices ---- */
    modi:          [0.85, 1, 0],
    rahul:         [0.85, 1, 0],
    didi:          [0.85, 1, 0],
    trump:         [0.85, 1, 0],
    yogi:          [0.85, 1, 0],
    nitin:         [0.85, 1, 0],
    mbapu:         [0.85, 1, 0],
    lalu:          [0.85, 1, 0],
    ravi:          [0.85, 1, 0],
    amit:          [0.85, 1, 0],
    dhruv:         [0.85, 1, 0],
    gulaam:        [0.85, 1, 0],
    nirmala:       [0.85, 1, 0],
    mbapuintro:    [0.85, 1, 0],
    amitwin:       [0.85, 1, 0],
    raviwin:       [0.85, 1, 0],

    /* ---- crowd / dhol / extras ---- */
    crowd:         [0.42, 1, 0],
    dhol:          [0.50, 3, 0],
    aloolelo:      [0.50, 1, 1],
    drone:         [0.30, 1, 1],
    engine_loop:   [0.40, 1, 1],
    vine_boom:     [0.70, 2, 0],
    meme1:         [0.62, 1, 0],
    meme2:         [0.58, 1, 0],
    meme3:         [0.58, 1, 0],
    meme4:         [0.58, 1, 0],
    whiff:         [0.34, 4, 0],
    hit_heavy:     [0.85, 3, 0],
    hit_crit:      [0.75, 2, 0],
    super_hit:     [0.90, 2, 0],
    super_charge:  [0.70, 1, 0]
};

// roster id -> real voice / super bed pack
const VOICE_PACK = {
    MITRAMAN:   { voice: 'modi',   bed: 'bed_chakra',    release: 'release_chakra',    extras: ['charge_chakra', 'shimmer'] },
    YATRABOY:   { voice: 'rahul',  bed: 'bed_tariff',    release: 'release_tariff',    extras: ['eye_zing', 'poof'] },
    DEEDEE:     { voice: 'didi',   bed: 'bed_jadu',      release: 'release_jadu',      extras: ['thunder', 'poof'] },
    TARIFFTAAU: { voice: 'trump',  bed: 'bed_tariff',    release: 'release_tariff',    extras: ['kaching', 'coins', 'crate_crash'] },
    DOZERDADA:  { voice: 'yogi',   bed: 'bed_bulldozer', release: 'release_bulldozer', extras: ['horn_long', 'engine_loop'] },
    TOLLMAN:    { voice: 'nitin',  bed: 'bed_bulldozer', release: 'release_bulldozer', extras: ['metal_crunch', 'snap'] },
    MBAPU:      { voice: 'mbapu',  bed: 'bed_chakra',    release: 'release_chakra',    extras: ['stamp_slam', 'bell'] }
};

class AudioBank {
    constructor() {
        this.dir = 'audio/';
        this.master = 1.0;
        this.musicVol = 0.22;
        this.sfxVol = 0.95;
        this.enabled = true;
        this.voiceOn = false;
        this.ready = false;
        this.pools = {};
        this.index = {};
        this.music = null;
        this.musicName = null;
    }

    init() {
        if (this.ready) return;
        this.ready = true;
        for (const name in SOUNDS) {
            const [vol, voices] = SOUNDS[name];
            const pool = [];
            for (let i = 0; i < voices; i++) {
                const a = new Audio(this.dir + name + '.mp3');
                a.preload = 'none';
                a.volume = Math.min(1, vol * this.master * this.sfxVol);
                pool.push(a);
            }
            this.pools[name] = pool;
            this.index[name] = 0;
        }
        // music beds are streamed through a single element
        this.music = new Audio();
        this.music.loop = true;
        this.music.preload = 'auto';
        this.music.volume = 0;
    }

    play(name, opt) {
        if (!this.enabled) return null;
        if (!this.ready) this.init();
        const pool = this.pools[name];
        if (!pool || !pool.length) return null;
        opt = opt || {};
        const i = this.index[name] || 0;
        const a = pool[i % pool.length];
        this.index[name] = (i + 1) % pool.length;
        try {
            a.pause();
            a.currentTime = 0;
            a.loop = !!SOUNDS[name][2];
            a.volume = Math.min(1, (opt.vol != null ? opt.vol : SOUNDS[name][0]) * this.master * this.sfxVol);
            a.playbackRate = opt.rate || 1;
            const p = a.play();
            if (p && p.catch) p.catch(() => {});
        } catch (e) { /* autoplay guard */ }
        return a;
    }

    stop(name) {
        const pool = this.pools[name];
        if (!pool) return;
        for (const a of pool) { try { a.pause(); a.currentTime = 0; } catch (e) {} }
    }

    /* ---------------- music beds ---------------- */
    setTrack(name, vol) {
        if (!this.ready) this.init();
        if (this.musicName === name) return;
        this.musicName = name;
        if (!name) {
            if (this.music.pause) this.music.pause();
            return;
        }
        try {
            this.music.pause();
            this.music.src = this.dir + name + '.mp3';
            this.music.volume = 0;
            this.music.loop = true;
            const p = this.music.play();
            if (p && p.catch) p.catch(() => {});
            this.targetMusicVol = (vol == null ? this.musicVol : vol);
        } catch (e) {}
    }

    fadeMusic(dt) {
        if (!this.music) return;
        const target = this.musicName ? (this.targetMusicVol || this.musicVol) : 0;
        const v = this.music.volume + (target - this.music.volume) * Math.min(1, dt * 2.4);
        this.music.volume = Math.max(0, Math.min(1, v));
        if (this.musicName && this.music.paused) {
            const p = this.music.play();
            if (p && p.catch) p.catch(() => {});
        }
    }

    duckMusic(amount, ms) {
        if (!this.music) return;
        const back = this.targetMusicVol || this.musicVol;
        this.targetMusicVol = back * (1 - (amount == null ? 0.6 : amount));
        setTimeout(() => { this.targetMusicVol = back; }, ms || 1400);
    }

    /* ---------------- engine API (unchanged names) ---------------- */
    speak(text, pitch = 1.0, rate = 1.05) {
        if (!this.voiceOn || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'hi-IN';
            u.pitch = pitch;
            u.rate = rate;
            window.speechSynthesis.speak(u);
        } catch (e) {}
    }

    playDholBeat() { this.play('dhol', { rate: 0.9 + Math.random() * 0.25 }); }
    playHorn() { this.play('horn_long', { vol: 0.45 }); }
    playSuperSiren() { this.play('charge_chakra'); }

    playSlapOrPunch(heavy) {
        if (heavy) {
            this.play(Math.random() < 0.55 ? 'hit_3' : 'hit_2', { rate: 0.95 + Math.random() * 0.1 });
            if (Math.random() < 0.5) this.play('thud', { vol: 0.55 });
        } else {
            const r = Math.random();
            if (r < 0.16) this.play('slap', { rate: 0.96 + Math.random() * 0.1 });
            else if (r < 0.55) this.play('hit_2', { rate: 0.94 + Math.random() * 0.14 });
            else this.play('hit_1', { rate: 0.92 + Math.random() * 0.2 });
        }
    }

    /* ---------------- flavour hooks ---------------- */
    whiff() { this.play('whoosh', { rate: 0.9 + Math.random() * 0.3 }); }
    blockHit() { this.play('block', { rate: 0.95 + Math.random() * 0.12 }); }
    bell() { this.play('bell'); }
    crowd(vol) { this.play('crowd', { vol: vol || 0.42 }); }
    koSting() { this.play('ko'); this.duckMusic(0.85, 2600); }
    superHit() {
        this.play('boom');
        if (Math.random() < 0.5) this.play('vine_boom', { vol: 0.45 });
    }
    uiPick() { this.play('ui_select', { rate: 0.97 + Math.random() * 0.08 }); }
    uiTap() { this.play('ui_tap'); }
    uiConfirm() { this.play('ui_confirm'); }
    meme(which) { this.play('meme' + (which || (1 + Math.floor(Math.random() * 4)))); }

    /* ---- match flow ---- */
    roundCall(n) {
        if (n >= 3) this.play('final_round');
        else this.play(n === 2 ? 'round_2' : 'round_1');
        if (Math.random() < 0.5) this.play('horn_short', { vol: 0.35 });
    }
    fightCall() { this.play('fight'); this.duckMusic(0.5, 1500); }
    perfectCall() { this.play('perfect'); }
    timeUpCall() { this.play('time_up'); }
    introVoice(rosterId) {
        const p = VOICE_PACK[rosterId];
        if (p) this.play(p.voice, { vol: 0.8 });
    }
    winVoice(rosterId) {
        const p = VOICE_PACK[rosterId];
        if (p) this.play(p.voice, { vol: 0.8 });
    }
    superBed(rosterId) {
        const p = VOICE_PACK[rosterId];
        if (!p) return this.play('charge_chakra');
        this.play(p.bed);
        this.duckMusic(0.55, 3200);
    }
    superRelease(rosterId) {
        const p = VOICE_PACK[rosterId];
        this.play(p ? p.release : 'release_chakra');
        this.play('boom', { vol: 0.7 });
    }
    matchEnd(playerWon) {
        this.duckMusic(0.9, 4000);
        this.play(playerWon ? 'jingle_win' : 'jingle_lose');
        setTimeout(() => this.play(playerWon ? 'you_win' : 'you_lose'), 700);
    }
}

const sfx = new AudioBank();
