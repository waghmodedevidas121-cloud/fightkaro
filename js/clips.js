/**
 * ============================================================================
 * 2. REAL CHARACTER MODELS, ANIMATION CLIPS & MOVE MAP
 * ----------------------------------------------------------------------------
 * Recovered from the live fightkaro.com build: each neta is a rigged GLB with
 * its own animation set. This file maps our fight engine's states and move
 * keys onto those real clips, and carries the original clip hit timings so the
 * strike lands exactly where the animation says it does.
 * ============================================================================
 */

// roster id -> real GLB in ./models
const CHAR_MODEL = {
    MITRAMAN:   'modi',
    YATRABOY:   'rahul',
    DEEDEE:     'didi',
    TARIFFTAAU: 'trump',
    DOZERDADA:  'yogi',
    TOLLMAN:    'nitin',
    MBAPU:      'mbapu'
};

// face portrait in ./faces (used by the select screen)
const CHAR_FACE = {
    MITRAMAN: 'modi', YATRABOY: 'rahul', DEEDEE: 'didi', TARIFFTAAU: 'trump',
    DOZERDADA: 'yogi', TOLLMAN: 'nitin', MBAPU: 'mbapu'
};

// clip -> [windup, impact, recovery] in seconds of clip time (original tables)
const CLIP_TIME = {
    jab: [0.20, 0.56, 0.95], cross: [0.10, 0.37, 0.80], uppercut: [0.15, 0.47, 1.20],
    palm: [1.00, 1.40, 2.00], lowjab: [0.55, 0.90, 1.50], kick: [0.25, 0.67, 1.40],
    highkick: [0.25, 0.73, 1.50], roundhouse: [0.50, 1.00, 1.90], spinback: [0.30, 0.90, 1.90],
    flyingkick: [0.00, 0.37, 1.40], hurricane: [0.46, 0.92, 1.80], sweep: [0.35, 0.87, 1.60],
    sweep360: [0.60, 1.30, 2.20], crescent: [0.90, 1.33, 1.90], butterfly: [1.45, 1.97, 2.50],
    jabelbow: [0.60, 1.00, 1.60], frontkick: [0.55, 0.97, 1.50], jabcross: [0.30, 0.67, 1.20],
    flipkick: [0.75, 1.33, 2.00], snapkick2: [0.30, 0.63, 1.20], thaiknee: [0.30, 0.63, 1.20],
    elbowhead: [0.40, 0.77, 1.30], stomp: [0.50, 0.93, 1.50], hook: [0.30, 0.63, 1.20],
    headbutt: [0.45, 0.87, 1.50], dropkick: [0.90, 1.40, 2.20], thrustkick: [0.60, 1.03, 1.60],
    elbowupper: [0.35, 0.70, 1.30], kneeupper: [1.30, 1.63, 2.20], mmaround: [0.40, 0.83, 1.40],
    spinback2: [1.30, 1.83, 2.40], quadpunch: [0.20, 0.50, 1.40], sidekick: [0.30, 0.70, 1.30],
    eightpunch: [0.90, 1.67, 2.45], spinflip: [1.30, 1.93, 2.60], twirl: [0.85, 1.30, 1.95],
    longhook: [0.25, 0.63, 1.20], pushkick: [0.80, 1.27, 1.80], bodypunch: [0.50, 0.90, 1.50],
    sbupper: [0.05, 0.25, 0.55], sbcombo: [0.05, 0.25, 1.05], upper: [0.15, 0.47, 1.20]
};

// real per-character strike table: engine move key -> GLB clip name
const CHAR_CLIPS = {
    modi: {
        stance: 'guardbounce', pace: 1.0,
        superCharge: 'palm', superStrike: 'butterfly',
        moves: {
            PUNCH_1: 'palm', PUNCH_2: 'jabelbow', PUNCH_3: 'butterfly',
            KICK_1: 'frontkick', KICK_2: 'crescent', SWEEP: 'sweep360',
            GRAB: 'palm', SP_PUNCH: 'palm', SP_KICK: 'flyingkick'
        }
    },
    rahul: {
        stance: 'guardbounce', pace: 1.3,
        superCharge: 'jabcross', superStrike: 'hurricane_m',
        moves: {
            PUNCH_1: 'jabcross', PUNCH_2: 'jab_m', PUNCH_3: 'hurricane_m',
            KICK_1: 'kick_m', KICK_2: 'highkick_m', SWEEP: 'sweep360_m',
            GRAB: 'palm_m', SP_PUNCH: 'uppercut', SP_KICK: 'flipkick'
        }
    },
    didi: {
        stance: 'stance', pace: 1.35,
        superCharge: 'palm_m', superStrike: 'thaiknee',
        moves: {
            PUNCH_1: 'palm_m', PUNCH_2: 'palm', PUNCH_3: 'thaiknee',
            KICK_1: 'snapkick2', KICK_2: 'roundhouse_m', SWEEP: 'stomp',
            GRAB: 'palm_m', SP_PUNCH: 'elbowhead', SP_KICK: 'kick_m'
        }
    },
    trump: {
        stance: 'stance', pace: 0.7,
        superCharge: 'dance', superStrike: 'headbutt',
        moves: {
            PUNCH_1: 'cross_m', PUNCH_2: 'hook', PUNCH_3: 'palm',
            KICK_1: 'kick_m', KICK_2: 'spinback', SWEEP: 'sweep',
            GRAB: 'palm', SP_PUNCH: 'headbutt', SP_KICK: 'dropkick'
        }
    },
    yogi: {
        stance: 'guardbounce', pace: 0.65,
        superCharge: 'slammer', superStrike: 'thrustkick',
        moves: {
            PUNCH_1: 'cross', PUNCH_2: 'cross_m', PUNCH_3: 'spinback',
            KICK_1: 'thrustkick', KICK_2: 'roundhouse', SWEEP: 'sweep360_m',
            GRAB: 'cross', SP_PUNCH: 'elbowupper', SP_KICK: 'kneeupper'
        }
    },
    nitin: {
        stance: 'guardbounce', pace: 1.0,
        superCharge: 'quadpunch', superStrike: 'spinback2',
        moves: {
            PUNCH_1: 'jab_m', PUNCH_2: 'cross_m', PUNCH_3: 'spinback2',
            KICK_1: 'mmaround', KICK_2: 'spinback_m', SWEEP: 'sweep360',
            GRAB: 'jab_m', SP_PUNCH: 'quadpunch', SP_KICK: 'sidekick'
        }
    },
    mbapu: {
        stance: 'stance', pace: 1.0,
        superCharge: 'lotus', superStrike: 'armsup',
        moves: {
            PUNCH_1: 'jab', PUNCH_2: 'cross', PUNCH_3: 'spinback',
            KICK_1: 'kick', KICK_2: 'roundhouse', SWEEP: 'sweep',
            GRAB: 'throw', SP_PUNCH: 'palm', SP_KICK: 'flyingkick'
        }
    }
};

/**
 * One shared DRACO + GLTF loader. Models are Draco compressed with WebP
 * textures, so both decoders are vendored locally (js/vendor).
 */
const MODEL_LOADER = (function () {
    let loader = null;
    return function get() {
        if (loader) return loader;
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader) return null;
        loader = new THREE.GLTFLoader();
        if (THREE.DRACOLoader) {
            const draco = new THREE.DRACOLoader();
            draco.setDecoderPath('js/vendor/draco/');
            loader.setDRACOLoader(draco);
        }
        return loader;
    };
})();

// small promise cache so p1 and p2 never download the same GLB twice
const MODEL_CACHE = {};
function loadCharacterModel(name, attempt) {
    if (MODEL_CACHE[name]) return MODEL_CACHE[name];
    const tries = (attempt || 0) + 1;
    const L = MODEL_LOADER();
    if (!L) return Promise.reject(new Error('GLTFLoader missing'));
    // page opened straight from disk: browsers block GLB over file://
    MODEL_CACHE[name] = new Promise((resolve, reject) => {
        L.load('models/' + name + '.glb', resolve, (ev) => {
            if (!ev || !ev.total) return;
            document.dispatchEvent(new CustomEvent('fk:modelprogress', {
                detail: { name, pct: Math.round((ev.loaded / ev.total) * 100) }
            }));
        }, reject);
    }).catch((err) => {
        // a failed load must never poison the cache - otherwise the fighter is
        // stuck on the placeholder rig for the rest of the session
        if (tries < 3) {
            delete MODEL_CACHE[name];
            return new Promise((r) => setTimeout(r, 400 * tries)).then(() => loadCharacterModel(name, tries));
        }
        delete MODEL_CACHE[name];
        if (window.FK) (window.FK.modelErrors = window.FK.modelErrors || []).push(name + ': ' + (err && err.message || err));
        document.dispatchEvent(new CustomEvent('fk:modelfail', { detail: name }));
        throw err;
    });
    return MODEL_CACHE[name];
}
