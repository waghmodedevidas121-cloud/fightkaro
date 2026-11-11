/* ===== NETA RIG v2 : rounded caricature rig + keyframed animation + leg IK ===== */
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const _v4 = new THREE.Vector3(), _v5 = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
const _down = new THREE.Vector3(0, -1, 0);
const _eu = new THREE.Euler();

const flat = (r, a, b) => THREE.MathUtils.clamp((r - a) / (b - a), 0, 1);
const smoothstep = (t) => { t = THREE.MathUtils.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const dampf = (a, b, l, dt) => b + (a - b) * Math.exp(-l * dt);

const BONE_NAMES = ['hips', 'torso', 'head',
  'shoulder_L', 'shoulder_R', 'elbow_L', 'elbow_R',
  'hip_L', 'hip_R', 'knee_L', 'knee_R', 'ankle_L', 'ankle_R'];

const STANCE = {
  hips: [0, 0, 0],
  torso: [0.07, -0.26, 0],
  head: [-0.06, 0.26, 0],
  shoulder_L: [-1.14, 0.16, 0.24], elbow_L: [2.0, 0, 0],
  shoulder_R: [-1.04, -0.16, -0.24], elbow_R: [1.95, 0, 0],
  hip_L: [0.06, 0.04, 0.02], knee_L: [0.16, 0, 0], ankle_L: [0, 0, 0],
  hip_R: [-0.04, -0.04, -0.02], knee_R: [0.14, 0, 0], ankle_R: [0, 0, 0]
};

function poseBase() {
  const p = {};
  for (const n of BONE_NAMES) p[n] = (STANCE[n] || [0, 0, 0]).slice();
  return p;
}

function poseMerge(over) {
  const p = poseBase();
  for (const k in over) if (p[k]) p[k] = over[k].slice();
  return p;
}

function poseCopy(dst, src) {
  for (const n of BONE_NAMES) {
    const d = dst[n], s = src[n];
    d[0] = s[0]; d[1] = s[1]; d[2] = s[2];
  }
  return dst;
}

function poseLerp(dst, a, b, u) {
  for (const n of BONE_NAMES) {
    const d = dst[n], x = a[n], y = b[n];
    d[0] = x[0] + (y[0] - x[0]) * u;
    d[1] = x[1] + (y[1] - x[1]) * u;
    d[2] = x[2] + (y[2] - x[2]) * u;
  }
  return dst;
}

function sampleKeys(keys, t, out) {
  if (t <= keys[0].t) return poseCopy(out, keys[0].p);
  const last = keys[keys.length - 1];
  if (t >= last.t) return poseCopy(out, last.p);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t >= a.t && t <= b.t) {
      const u = smoothstep(flat(t, a.t, b.t));
      return poseLerp(out, a.p, b.p, u);
    }
  }
  return poseCopy(out, last.p);
}

/* ===== move keyframe clips (built from the official MOVES frame data) ===== */
const CLIP_CACHE = {};

function getMoveClip(key) {
  if (CLIP_CACHE[key]) return CLIP_CACHE[key];
  const m = MOVES[key];
  const s = m.startup, a = m.active, r = m.recovery, T = s + a + r;
  const heavy = !!m.knockdown;
  let wind, strike, follow;

  if (key === 'PUNCH_1' || key === 'SP_PUNCH') {
    wind = poseMerge({
      torso: [0.02, 0.46, 0.02], head: [-0.02, 0.34, 0],
      shoulder_L: [0.22, 0.42, 0.3], elbow_L: [2.05, 0, 0],
      shoulder_R: [-0.8, -0.3, -0.3], elbow_R: [1.9, 0, 0],
      hip_L: [0.16, 0, 0], knee_L: [0.26, 0, 0]
    });
    strike = poseMerge({
      torso: [0.24, -0.62, -0.06], head: [0.04, -0.4, 0],
      shoulder_L: [-1.66, -0.08, 0.02], elbow_L: [0.04, 0, 0],
      shoulder_R: [-0.5, -0.2, -0.35], elbow_R: [1.95, 0, 0],
      hip_L: [-0.1, 0, 0], knee_L: [0.1, 0, 0],
      hip_R: [0.2, 0, 0], knee_R: [0.2, 0, 0]
    });
    follow = poseMerge({
      torso: [0.2, -0.5, -0.04], head: [0.02, -0.32, 0],
      shoulder_L: [-1.5, -0.06, 0.04], elbow_L: [0.42, 0, 0],
      shoulder_R: [-0.55, -0.2, -0.32], elbow_R: [1.8, 0, 0]
    });
  } else if (key === 'PUNCH_2' || key === 'PUNCH_3' || key === 'GRAB') {
    const big = key !== 'PUNCH_2';
    wind = poseMerge({
      torso: [0.0, -0.5, -0.02], head: [-0.02, -0.36, 0],
      shoulder_R: [0.2, -0.4, -0.3], elbow_R: [2.1, 0, 0],
      shoulder_L: [-0.8, 0.3, 0.3], elbow_L: [1.85, 0, 0],
      hip_R: [0.2, 0, 0], knee_R: [0.3, 0, 0]
    });
    strike = poseMerge({
      torso: [big ? 0.34 : 0.24, big ? 0.72 : 0.56, 0.06],
      head: [0.05, 0.44, 0],
      shoulder_R: [big ? -1.8 : -1.68, 0.08, -0.02], elbow_R: [0.04, 0, 0],
      shoulder_L: [-0.45, 0.22, 0.4], elbow_L: [2.0, 0, 0],
      hip_R: [-0.12, 0, 0], knee_R: [0.14, 0, 0],
      hip_L: [0.22, 0, 0], knee_L: [0.24, 0, 0]
    });
    if (key === 'GRAB') {
      strike = poseMerge({
        torso: [0.3, 0.1, 0], head: [0.1, 0.1, 0],
        shoulder_R: [-1.5, 0.14, -0.1], elbow_R: [0.28, 0, 0],
        shoulder_L: [-1.5, -0.14, 0.1], elbow_L: [0.28, 0, 0],
        hip_L: [0.2, 0, 0], knee_L: [0.3, 0, 0],
        hip_R: [0.16, 0, 0], knee_R: [0.3, 0, 0]
      });
    }
    follow = poseLerp(poseBase(), strike, poseBase(), 0.3);
  } else if (key === 'KICK_1' || key === 'KICK_2' || key === 'SP_KICK') {
    const high = key !== 'KICK_1';
    wind = poseMerge({
      torso: [0.16, 0.24, 0], head: [0, 0.2, 0],
      hip_R: [0.34, 0.1, 0], knee_R: [0.9, 0, 0],
      shoulder_L: [-0.5, 0.2, 0.3], elbow_L: [1.7, 0, 0],
      shoulder_R: [-0.4, -0.2, -0.3], elbow_R: [1.7, 0, 0]
    });
    strike = poseMerge({
      torso: [high ? -0.34 : -0.2, -0.4, high ? -0.16 : -0.08],
      head: [0.06, -0.24, 0],
      hip_R: [high ? -1.82 : -1.42, -0.16, 0.22], knee_R: [0.08, 0, 0], ankle_R: [-0.2, 0, 0],
      shoulder_L: [-0.2, 0.5, 0.55], elbow_L: [1.25, 0, 0],
      shoulder_R: [-0.15, -0.62, -0.45], elbow_R: [1.35, 0, 0],
      hip_L: [0.1, 0, 0], knee_L: [0.22, 0, 0]
    });
    follow = poseMerge({
      torso: [high ? -0.18 : -0.1, -0.3, -0.08],
      hip_R: [high ? -1.3 : -1.0, -0.12, 0.16], knee_R: [0.45, 0, 0],
      shoulder_L: [-0.3, 0.42, 0.45], elbow_L: [1.45, 0, 0],
      shoulder_R: [-0.25, -0.5, -0.4], elbow_R: [1.5, 0, 0]
    });
  } else if (key === 'SWEEP') {
    wind = poseMerge({
      torso: [0.2, 0.2, 0], hip_R: [0.1, 0, 0], knee_R: [0.7, 0, 0],
      hip_L: [0.3, 0, 0], knee_L: [0.7, 0, 0]
    });
    strike = poseMerge({
      torso: [0.42, -0.5, -0.2], head: [0.06, -0.2, 0],
      hip_R: [-1.25, -0.55, 0.1], knee_R: [0.06, 0, 0], ankle_R: [-0.3, 0, 0],
      hip_L: [0.5, 0, 0], knee_L: [1.5, 0, 0],
      shoulder_L: [-0.15, 0.6, 0.7], elbow_L: [1.1, 0, 0],
      shoulder_R: [-0.1, -0.7, -0.6], elbow_R: [1.2, 0, 0]
    });
    follow = poseMerge({
      torso: [0.36, -0.4, -0.14],
      hip_R: [-0.9, -0.4, 0.08], knee_R: [0.5, 0, 0],
      hip_L: [0.45, 0, 0], knee_L: [1.3, 0, 0]
    });
  } else {
    wind = strike = follow = poseBase();
  }

  const keys = [
    { t: 0, p: poseBase() },
    { t: Math.max(0.025, s * 0.85), p: wind },
    { t: Math.max(0.045, s + a * 0.3), p: strike },
    { t: s + a, p: follow },
    { t: Math.max(s + a + 0.02, T * 0.94), p: poseBase() }
  ];
  keys.sort((x, y) => x.t - y.t);
  const clip = { keys, total: T, crouch: key === 'SWEEP' };
  CLIP_CACHE[key] = clip;
  return clip;
}
