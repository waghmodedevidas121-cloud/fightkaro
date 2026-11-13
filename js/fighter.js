/* ===== NETA FIGHTER v3 : rounded capsule body + living animation ===== */
class NetaFighter {
  constructor(scene, x, isP1, charData) {
    this.scene = scene;
    this.isP1 = isP1;
    this.root = new THREE.Group();
    this.root.position.set(x, 0, 0);
    this.scene.add(this.root);

    this.body = new THREE.Group();
    this.root.add(this.body);

    this.vel = new THREE.Vector3();
    this.facing = isP1 ? 1 : -1;
    this.grounded = true;
    this.bones = {};
    this.targetRot = {};
    this.pose = poseBase();
    this.poseOut = poseBase();
    this.blinkT = 1.5 + Math.random() * 3;
    this.blink = 0;
    this.flash = 0;
    this.phase = Math.random() * 6.28;
    this.gait = 0;
    this.ikTargets = { L: new THREE.Vector3(), R: new THREE.Vector3() };
    this.tilt = 0;
    this.hipLift = 0;
    this.applyCharacter(charData);
  }

  applyCharacter(charData) {
    this.data = charData;
    this.maxHp = charData.hp;
    this.hp = charData.hp;
    this.shakti = 0;
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.crouching = false;
    this.blocking = false;
    this.comboCount = 0;
    this.comboDecay = 0;
    this.stringRoute = '';
    this.queuedNextMove = null;
    this.hasHit = false;
    this.moveClip = null;
    this.tilt = 0;
    this.flash = 0;

    this.detachGLB();
    while (this.root.children.length > 0) this.root.remove(this.root.children[0]);
    this.body = new THREE.Group();
    this.root.add(this.body);
    this.bones = {};
    this.targetRot = {};
    this.buildRig();
    this.loadRealModel();
  }

  buildRig() {
    const d = this.data;
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a179, roughness: 0.66, metalness: 0.02 });
    const outfitMat = new THREE.MeshStandardMaterial({ color: d.outfitColor, roughness: 0.78, metalness: 0.03 });
    const accentMat = new THREE.MeshStandardMaterial({
      color: d.color, emissive: d.color, emissiveIntensity: 0.16, roughness: 0.5, metalness: 0.15
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1b1e28, roughness: 0.72 });
    const hairMat = new THREE.MeshStandardMaterial({ color: d.hairColor, roughness: 0.9 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf2f6fa, roughness: 0.45 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x12141a, roughness: 0.2 });
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x7d2626, roughness: 0.6 });
    const browMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(d.hairColor).multiplyScalar(0.62), roughness: 0.9
    });

    this.mats = { skin: skinMat, outfit: outfitMat, accent: accentMat, dark: darkMat, hair: hairMat };

    const bone = (name, parent, x, y, z) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      parent.add(g);
      this.bones[name] = g;
      this.targetRot[name] = new THREE.Euler();
      return g;
    };
    const mesh = (parent, geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    // smooth capsule: cylinder + hemispherical caps, hangs down from the bone origin
    const capsule = (parent, r, len, mat, taper) => {
      const rb = r * (taper || 1);
      const g = new THREE.Group();
      parent.add(g);
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, rb, len, 16, 1, true), mat);
      cyl.position.y = -len / 2;
      const capT = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), mat);
      const capB = new THREE.Mesh(new THREE.SphereGeometry(rb, 16, 10), mat);
      capB.position.y = -len;
      for (const m of [cyl, capT, capB]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
      return g;
    };
    const shell = (parent, rTop, rBot, h, mat, zScale) => {
      const g = new THREE.Group();
      parent.add(g);
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 20, 1, true), mat);
      const top = new THREE.Mesh(new THREE.SphereGeometry(rTop, 20, 12), mat);
      top.position.y = h / 2; top.scale.y = 0.68;
      const bot = new THREE.Mesh(new THREE.SphereGeometry(rBot, 20, 12), mat);
      bot.position.y = -h / 2; bot.scale.y = 0.68;
      for (const m of [cyl, top, bot]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
      g.scale.z = zScale || 0.82;
      return g;
    };

    /* ---------------- pelvis ---------------- */
    this.rigGroup = new THREE.Group();
    this.body.add(this.rigGroup);
    const hips = bone('hips', this.rigGroup, 0, 0.94, 0);
    shell(hips, 0.185, 0.175, 0.2, outfitMat, 0.86);
    mesh(hips, new THREE.CylinderGeometry(0.196, 0.19, 0.075, 18), darkMat, 0, 0.1, 0).scale.z = 0.9;

    /* ---------------- torso ---------------- */
    const torso = bone('torso', hips, 0, 0.1, 0);
    shell(torso, 0.235, 0.185, 0.44, outfitMat, 0.8);
    // chest plate / party colour vest (front arc only)
    const vest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.244, 0.206, 0.36, 18, 1, true, -0.95, 1.9),
      accentMat
    );
    vest.position.y = 0.24;
    vest.scale.z = 0.82;
    vest.material.side = THREE.DoubleSide;
    vest.castShadow = true;
    torso.add(vest);
    // collar + neck
    mesh(torso, new THREE.CylinderGeometry(0.135, 0.16, 0.1, 16), whiteMat, 0, 0.46, 0).scale.z = 0.85;
    mesh(torso, new THREE.CylinderGeometry(0.072, 0.082, 0.14, 12), skinMat, 0, 0.53, 0);
    if (d.RedTie) {
      mesh(torso, new THREE.BoxGeometry(0.075, 0.3, 0.05), new THREE.MeshStandardMaterial({ color: 0xd81b2a, roughness: 0.55 }), 0, 0.3, 0.175);
    }
    // deltoids
    mesh(torso, new THREE.SphereGeometry(0.1, 14, 12), outfitMat, 0.2, 0.395, 0).scale.set(1.15, 1, 0.95);
    mesh(torso, new THREE.SphereGeometry(0.1, 14, 12), outfitMat, -0.2, 0.395, 0).scale.set(1.15, 1, 0.95);

    /* ---------------- head ---------------- */
    const head = bone('head', torso, 0, 0.55, 0);
    const skull = mesh(head, new THREE.SphereGeometry(0.215, 20, 16), skinMat, 0, 0.17, 0);
    skull.scale.set(0.97, 1.06, 0.93);
    mesh(head, new THREE.SphereGeometry(0.135, 14, 12), skinMat, 0, 0.04, 0.045).scale.set(1, 0.78, 0.92);
    mesh(head, new THREE.SphereGeometry(0.048, 10, 8), skinMat, 0.208, 0.17, 0);
    mesh(head, new THREE.SphereGeometry(0.048, 10, 8), skinMat, -0.208, 0.17, 0);
    const nose = mesh(head, new THREE.ConeGeometry(0.038, 0.085, 10), skinMat, 0, 0.145, 0.2);
    nose.rotation.x = Math.PI * 0.5;

    const eyeL = new THREE.Group(); eyeL.position.set(0.082, 0.2, 0.17); head.add(eyeL);
    const eyeR = new THREE.Group(); eyeR.position.set(-0.082, 0.2, 0.17); head.add(eyeR);
    const whiteL = mesh(eyeL, new THREE.SphereGeometry(0.048, 12, 10), whiteMat, 0, 0, 0);
    const whiteR = mesh(eyeR, new THREE.SphereGeometry(0.048, 12, 10), whiteMat, 0, 0, 0);
    whiteL.scale.z = 0.6; whiteR.scale.z = 0.6;
    const pupL = mesh(eyeL, new THREE.SphereGeometry(0.024, 10, 8), eyeMat, 0, -0.002, 0.028);
    const pupR = mesh(eyeR, new THREE.SphereGeometry(0.024, 10, 8), eyeMat, 0, -0.002, 0.028);
    pupL.scale.z = 0.75; pupR.scale.z = 0.75;

    const browL = mesh(head, new THREE.BoxGeometry(0.088, 0.022, 0.03), browMat, 0.082, 0.245, 0.185);
    const browR = mesh(head, new THREE.BoxGeometry(0.088, 0.022, 0.03), browMat, -0.082, 0.245, 0.185);
    browL.rotation.z = -0.14; browR.rotation.z = 0.14;
    const mouth = mesh(head, new THREE.BoxGeometry(0.09, 0.026, 0.028), mouthMat, 0, 0.045, 0.185);

    const hairCap = new THREE.SphereGeometry(0.222, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
    mesh(head, hairCap, d.bald ? skinMat : hairMat, 0, 0.175, 0);
    if (d.beard) {
      const beard = mesh(head, new THREE.SphereGeometry(0.15, 14, 12, 0, Math.PI * 2, Math.PI * 0.4, Math.PI * 0.5), hairMat, 0, 0.075, 0.02);
      beard.scale.set(1.1, 1.05, 0.95);
      mesh(head, new THREE.BoxGeometry(0.1, 0.024, 0.032), browMat, 0, 0.098, 0.196);
    } else if (d.bald) {
      mesh(head, new THREE.BoxGeometry(0.135, 0.03, 0.04), browMat, 0, 0.09, 0.19);
    }
    if (d.glasses) {
      mesh(head, new THREE.TorusGeometry(0.052, 0.011, 6, 16), darkMat, 0.082, 0.2, 0.2);
      mesh(head, new THREE.TorusGeometry(0.052, 0.011, 6, 16), darkMat, -0.082, 0.2, 0.2);
      mesh(head, new THREE.BoxGeometry(0.055, 0.01, 0.01), darkMat, 0, 0.2, 0.205);
    }
    this.face = { eyeL, eyeR, browL, browR, mouth, pupL, pupR };

    /* ---------------- arms ---------------- */
    ['L', 'R'].forEach((s) => {
      const dir = s === 'L' ? 1 : -1;
      const sh = bone('shoulder_' + s, torso, dir * 0.2, 0.395, 0);
      capsule(sh, 0.079, 0.29, outfitMat, 0.92);
      const el = bone('elbow_' + s, sh, 0, -0.29, 0);
      capsule(el, 0.073, 0.26, skinMat, 0.86);
      mesh(el, new THREE.SphereGeometry(0.076, 12, 10), skinMat, 0, -0.28, 0);
      if (d.id === 'DEEDEE' && s === 'R') {
        mesh(el, new THREE.BoxGeometry(0.15, 0.32, 0.045), new THREE.MeshStandardMaterial({ color: 0x00b4ff, roughness: 0.6 }), 0, -0.36, 0.15);
      }
      if (d.staff && s === 'R') {
        mesh(el, new THREE.CylinderGeometry(0.025, 0.03, 1.55, 8), new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.85 }), 0, -0.28, 0.14);
      }
    });

    /* ---------------- legs ---------------- */
    ['L', 'R'].forEach((s) => {
      const dir = s === 'L' ? 1 : -1;
      const hip = bone('hip_' + s, hips, dir * 0.135, -0.045, 0);
      capsule(hip, 0.103, 0.44, outfitMat, 0.9);
      const kn = bone('knee_' + s, hip, 0, -0.44, 0);
      capsule(kn, 0.09, 0.42, outfitMat, 0.92);
      mesh(kn, new THREE.SphereGeometry(0.088, 12, 10), outfitMat, 0, -0.42, 0).scale.set(1, 0.7, 1);
      const an = bone('ankle_' + s, kn, 0, -0.42, 0);
      mesh(an, new THREE.BoxGeometry(0.135, 0.075, 0.26), darkMat, 0, -0.025, 0.05).scale.z = 1;
      mesh(an, new THREE.BoxGeometry(0.145, 0.028, 0.1), accentMat, 0, 0.015, 0.03);
    });

    this.hipsBaseY = 0.94;
  }

  setPose(pose) {
    for (const k in this.targetRot) this.targetRot[k].set(0, 0, 0);
    for (const k in pose) if (this.targetRot[k]) this.targetRot[k].set(pose[k][0], pose[k][1], pose[k][2]);
  }

  addShakti(amount) {
    this.shakti = THREE.MathUtils.clamp(this.shakti + amount, 0, 100);
  }

  triggerMove(moveKey, customLabel = null) {
    this.state = 'ATTACK';
    this.currentMoveKey = moveKey;
    this.currentMove = MOVES[moveKey];
    this.moveClip = getMoveClip(moveKey);
    this.stateTimer = 0;
    this.hasHit = false;
    this.queuedNextMove = null;
    try { sfx.whiff(); } catch (e) {}
    return customLabel;
  }

  update(dt, opp) {
    if (this.state === 'IDLE' || this.state === 'MOVE' || this.state === 'CROUCH') {
      this.facing = opp.root.position.x >= this.root.position.x ? 1 : -1;
    }

    // shortest-path yaw smoothing (frame-rate independent)
    const targetYaw = this.facing === 1 ? Math.PI * 0.5 : -Math.PI * 0.5;
    let dyaw = targetYaw - this.root.rotation.y;
    dyaw = ((dyaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    this.root.rotation.y += dyaw * (1 - Math.exp(-16 * dt));

    this.flash = Math.max(0, this.flash - dt * 4);

    if (this.comboCount > 0) {
      this.comboDecay -= dt;
      if (this.comboDecay <= 0) this.comboCount = 0;
    }

    this.stateTimer += dt;

    if (this.state === 'ATTACK') {
      const m = this.currentMove;
      const total = m.startup + m.active + m.recovery;
      if (this.stateTimer < m.startup) {
        this.vel.x = this.facing * (this.currentMoveKey.startsWith('SP_') ? 6.4 : 2.3);
      } else {
        this.vel.x += (0 - this.vel.x) * (1 - Math.exp(-14 * dt));
      }

      if (this.queuedNextMove && this.stateTimer >= m.startup + m.active * 0.55) {
        const next = this.queuedNextMove;
        this.triggerMove(next);
        return;
      }
      if (this.stateTimer >= total) {
        this.state = 'IDLE';
        this.stateTimer = 0;
        this.stringRoute = '';
      }
    } else if (this.state === 'HITSTUN') {
      this.vel.x += (0 - this.vel.x) * (1 - Math.exp(-9 * dt));
      if (this.stateTimer >= this.stunDuration) {
        this.state = 'IDLE';
        this.stateTimer = 0;
      }
    } else if (this.state === 'KNOCKDOWN') {
      this.vel.x += (0 - this.vel.x) * (1 - Math.exp(-5 * dt));
      if (this.stateTimer >= (this.glbReady ? 1.55 : 1.05)) {
        this.state = 'IDLE';
        this.stateTimer = 0;
      }
    }

    // physics & gravity
    if (this.state !== 'SUPER_ACTIVE') {
      this.root.position.x += this.vel.x * dt;
      this.root.position.y += this.vel.y * dt;
      if (!this.grounded) {
        this.vel.y -= 26.0 * dt;
        if (this.root.position.y <= 0) {
          this.root.position.y = 0;
          this.vel.y = 0;
          this.grounded = true;
        }
      }
    }

    // arena clamp + pushbox
    this.root.position.x = THREE.MathUtils.clamp(this.root.position.x, -7.8, 7.8);
    const dist = Math.abs(this.root.position.x - opp.root.position.x);
    if (dist < 0.9 && Math.abs(this.root.position.y - opp.root.position.y) < 1.2) {
      const push = (0.9 - dist) * 0.5;
      const dir = this.root.position.x < opp.root.position.x ? -1 : 1;
      this.root.position.x += dir * push;
      opp.root.position.x -= dir * push;
    }

    this.animateBones(dt, opp);
  }

  /* ---------------- pose helpers ---------------- */
  setP(over) {
    const out = this.poseOut;
    for (const n of BONE_NAMES) {
      const v = over[n] || STANCE[n];
      const d = out[n];
      d[0] = v[0]; d[1] = v[1]; d[2] = v[2];
    }
  }

  styleOf() {
    const id = this.data.id;
    if (id === 'DEEDEE') return { bob: 1.5, sway: 1.35, freq: 1.4, lean: 0.1 };
    if (id === 'DOZERDADA') return { bob: 0.7, sway: 0.8, freq: 0.8, lean: 0.22 };
    if (id === 'MBAPU') return { bob: 0.5, sway: 0.6, freq: 0.6, lean: 0.05 };
    if (id === 'TARIFFTAAU') return { bob: 0.9, sway: 0.9, freq: 0.9, lean: -0.12 };
    if (id === 'TOLLMAN') return { bob: 1.1, sway: 1.0, freq: 1.0, lean: 0.12 };
    return { bob: 1, sway: 1, freq: 1, lean: 0.06 };
  }

  /* ---------------- animation core ---------------- */
  animateBones(dt, opp) {
    if (this.glbReady) { this.animateGLB(dt, opp); return; }
    const st = this.state;
    const t = (this.animT = (this.animT || 0) + dt);
    this.phase += dt;
    const S = this.styleOf();
    let rate = 13;
    const out = this.poseOut;
    let lookAtOpp = true;
    let hipY = this.hipsBaseY;

    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blink = 0.11; this.blinkT = 2.4 + Math.random() * 3.4; }
    this.blink = Math.max(0, this.blink - dt);

    if (st === 'ATTACK' && this.moveClip) {
      sampleKeys(this.moveClip.keys, this.stateTimer, out);
      rate = 30;
      if (this.currentMoveKey === 'SWEEP') hipY = this.hipsBaseY - 0.44;
      lookAtOpp = false;
    } else if (st === 'HITSTUN') {
      const k = smoothstep(THREE.MathUtils.clamp(this.stateTimer / Math.max(0.12, this.stunDuration), 0, 1));
      const recoil = poseMerge({
        torso: [-0.42, 0.06, -0.1], head: [-0.36, 0.1, -0.08],
        shoulder_L: [-0.1, 0.12, 0.75], elbow_L: [0.55, 0, 0],
        shoulder_R: [-0.05, -0.12, -0.7], elbow_R: [0.65, 0, 0],
        hip_L: [0.18, 0, 0], knee_L: [0.34, 0, 0],
        hip_R: [-0.12, 0, 0], knee_R: [0.3, 0, 0]
      });
      poseLerp(out, recoil, poseBase(), k);
      rate = 20;
      lookAtOpp = false;
    } else if (st === 'KNOCKDOWN' || st === 'KO') {
      this.setP({
        torso: [0.12, 0.05, 0], head: [0.1, 0.05, 0],
        shoulder_L: [-0.35, 0.25, 0.85], elbow_L: [0.7, 0, 0],
        shoulder_R: [-0.3, -0.25, -0.85], elbow_R: [0.75, 0, 0],
        hip_L: [0.3, 0, 0.3], knee_L: [0.55, 0, 0],
        hip_R: [0.16, 0, -0.3], knee_R: [0.7, 0, 0]
      });
      rate = 10;
      lookAtOpp = false;
    } else if (st === 'SUPER_ACTIVE') {
      this.setP({
        torso: [-0.18, 0.1, 0], head: [-0.14, 0.1, 0],
        shoulder_R: [-2.75, -0.12, -0.22], elbow_R: [0.12, 0, 0],
        shoulder_L: [-1.15, 0.2, 0.45], elbow_L: [1.1, 0, 0],
        hip_L: [0.1, 0, 0.06], knee_L: [0.16, 0, 0]
      });
      rate = 9;
      lookAtOpp = false;
    } else if (this.blocking) {
      const b = Math.sin(t * 3.4) * 0.014;
      this.setP({
        torso: [-0.04, 0.16 + b, 0], head: [-0.02, 0.06, 0],
        shoulder_L: [-1.34, 0.46, 0.34], elbow_L: [2.0, 0, 0],
        shoulder_R: [-1.28, -0.5, -0.34], elbow_R: [2.05, 0, 0],
        hip_L: [0.16, 0, 0.03], knee_L: [0.3, 0, 0],
        hip_R: [-0.14, 0, -0.03], knee_R: [0.28, 0, 0]
      });
      rate = 22;
      lookAtOpp = false;
    } else if (this.crouching || st === 'CROUCH') {
      this.setP({
        torso: [0.3, -0.2, 0], head: [0.06, 0.2, 0],
        shoulder_L: [-0.8, 0.2, 0.3], elbow_L: [1.7, 0, 0],
        shoulder_R: [-0.7, -0.2, -0.3], elbow_R: [1.8, 0, 0],
        hip_L: [0.62, 0, 0.05], knee_L: [1.2, 0, 0],
        hip_R: [0.5, 0, -0.05], knee_R: [1.15, 0, 0]
      });
      hipY = this.hipsBaseY - 0.3;
      rate = 18;
    } else if (st === 'MOVE' && this.grounded) {
      const sp = Math.abs(this.vel.x);
      const ph = this.phase * (3.6 + sp * 0.55);
      const sw = Math.sin(ph);
      const bob = Math.abs(Math.cos(ph)) * 0.045 * S.bob;
      this.setP({
        torso: [0.1 * S.lean + 0.06 + bob * 0.4, -0.22 + sw * 0.12, sw * 0.03],
        head: [-0.05 - bob * 0.3, 0.24 - sw * 0.06, 0],
        shoulder_L: [-1.05 - sw * 0.4, 0.18, 0.26], elbow_L: [1.9 + Math.abs(sw) * 0.2, 0, 0],
        shoulder_R: [-0.95 + sw * 0.4, -0.18, -0.26], elbow_R: [1.85 + Math.abs(sw) * 0.2, 0, 0],
        hip_L: [0.15, 0.04, 0.02], knee_L: [0.24, 0, 0],
        hip_R: [-0.1, -0.04, -0.02], knee_R: [0.22, 0, 0]
      });
      hipY = this.hipsBaseY - 0.02 + Math.sin(ph * 2) * 0.02 * S.bob;
      rate = 17;
    } else if (!this.grounded) {
      this.setP({
        torso: [0.16, -0.2, 0], head: [-0.05, 0.2, 0],
        shoulder_L: [-1.1, 0.2, 0.45], elbow_L: [1.2, 0, 0],
        shoulder_R: [-1.0, -0.2, -0.45], elbow_R: [1.3, 0, 0],
        hip_L: [0.75, 0, 0.06], knee_L: [1.0, 0, 0],
        hip_R: [0.35, 0, -0.06], knee_R: [0.8, 0, 0]
      });
      rate = 12;
      lookAtOpp = false;
    } else {
      // ---------------- living idle : the "spirit" ----------------
      const br = Math.sin(t * 2.3) * 0.5 + 0.5;
      const sway = Math.sin(t * 0.85 * S.freq + this.phase) * S.sway;
      const micro = Math.sin(t * 3.7 + this.phase * 2) * 0.5;
      this.setP({
        torso: [0.07 + S.lean + br * 0.025, -0.26 + sway * 0.07, sway * 0.035],
        head: [-0.06 - br * 0.02, 0.26 - sway * 0.09, sway * 0.04 + micro * 0.015],
        shoulder_L: [-1.14 + br * 0.05 + sway * 0.05, 0.16, 0.24 + sway * 0.02],
        elbow_L: [2.0 - br * 0.06, 0, 0],
        shoulder_R: [-1.04 - br * 0.05 - sway * 0.05, -0.16, -0.24 - sway * 0.02],
        elbow_R: [1.95 + br * 0.06, 0, 0],
        hip_L: [0.06, 0.04, 0.02], knee_L: [0.16, 0, 0],
        hip_R: [-0.04, -0.04, -0.02], knee_R: [0.14, 0, 0]
      });
      hipY = this.hipsBaseY + Math.sin(t * 2.3) * 0.012 * S.bob - 0.012;
      rate = 11;
    }

    // ---------------- face / secondary life ----------------
    if (this.face) {
      const open = (st === 'ATTACK' || st === 'SUPER_ACTIVE' || st === 'HITSTUN') ? 1 : (0.18 + Math.sin(t * 1.7) * 0.12);
      this.face.mouth.scale.set(1, open, 1);
      const blinkK = this.blink > 0 ? 0.12 : 1;
      this.face.eyeL.scale.y = blinkK;
      this.face.eyeR.scale.y = blinkK;
      const browUp = (st === 'ATTACK' || st === 'SUPER_ACTIVE') ? 0.02 : 0;
      this.face.browL.position.y = 0.3 + browUp;
      this.face.browR.position.y = 0.3 + browUp;
    }

    // head look toward opponent (soft neck aim)
    if (lookAtOpp && opp) {
      const dx = opp.root.position.x - this.root.position.x;
      const yawToOpp = Math.atan2(-dx, 0) - 0;
      const local = THREE.MathUtils.clamp(
        ((yawToOpp - this.root.rotation.y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI, -0.5, 0.5);
      out.head[1] += local * 0.55;
      out.torso[1] += local * 0.16;
    }

    // ---------------- write pose to bones ----------------
    for (const n of BONE_NAMES) {
      const e = this.targetRot[n];
      const v = out[n];
      e.set(v[0], v[1], v[2]);
      _eu.copy(e);
      _q1.setFromEuler(_eu);
      const b = this.bones[n];
      b.quaternion.slerp(_q1, 1 - Math.exp(-rate * dt));
    }

    // hip height (crouch / bob)
    this.bones.hips.position.y = dampf(this.bones.hips.position.y, hipY, 16, dt);

    // knockdown tilt around the world Z axis so the body falls away from the rival
    const targetTilt = (st === 'KNOCKDOWN' || st === 'KO') ? 1.45 : 0;
    this.tilt = dampf(this.tilt, targetTilt, 8, dt);
    _q1.setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.tilt * this.facing);
    _q2.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.root.rotation.y);
    this.root.quaternion.copy(_q1).multiply(_q2);
    this.body.position.y = this.tilt > 0.35 ? -0.55 * Math.min(1, (this.tilt - 0.35) / 0.6) : 0;

    // ---------------- foot IK ----------------
    const ikW = this.grounded && st !== 'KNOCKDOWN' && st !== 'KO' && st !== 'SUPER_ACTIVE' ? 1 : 0;
    if (ikW > 0) {
      const yaw = this.root.rotation.y;
      const speed = Math.abs(this.vel.x);
      const moving = (st === 'MOVE' || speed > 0.4);
      if (moving) this.gait += dt * (2.6 + speed * 1.5);
      const stride = Math.min(0.26, speed * 0.055);
      const lift = 0.11;

      const foot = (lx, lz, side) => {
        const sw = Math.sin(this.gait + (side === 'L' ? 0 : Math.PI));
        const up = Math.max(0, Math.cos(this.gait + (side === 'L' ? 0 : Math.PI))) * lift;
        _v1.set(lx, 0, lz + (moving ? sw * stride : 0));
        _v1.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        _v1.add(this.root.position);
        _v1.y = 0.078 + (moving ? up : 0);
        return this.ikTargets[side].copy(_v1);
      };

      const kL = st === 'ATTACK' ? 0.3 : 1;
      const kR = st === 'ATTACK' ? (this.currentMoveKey === 'SWEEP' || this.currentMoveKey.indexOf('KICK') === 0 ? 0.05 : 0.3) : 1;
      const fL = foot(0.155, 0.03, 'L');
      const fR = foot(-0.155, -0.03, 'R');
      this.solveLeg('L', fL, kL, dt);
      this.solveLeg('R', fR, kR, dt);
    }

    // ---------------- damage flash ----------------
    const fl = this.flash;
    this.mats.accent.emissiveIntensity = 0.28 + fl * 3.2;
    this.mats.outfit.emissive.setRGB(fl * 0.6, fl * 0.06, fl * 0.06);
    this.mats.outfit.emissiveIntensity = fl > 0 ? 1 : 0;
  }

  /* ---------------- two-bone analytic leg IK ---------------- */
  solveLeg(side, target, weight, dt) {
    if (weight <= 0.02) return;
    const hip = this.bones['hip_' + side];
    const knee = this.bones['knee_' + side];
    const ankle = this.bones['ankle_' + side];
    const L1 = 0.44, L2 = 0.42;

    hip.getWorldPosition(_v1);
    _v2.copy(target).sub(_v1);
    const raw = _v2.length();
    if (raw < 1e-4 || !isFinite(raw)) return;
    const dist = THREE.MathUtils.clamp(raw, Math.abs(L1 - L2) + 0.04, L1 + L2 - 0.012);
    _v2.multiplyScalar(1 / raw);

    // pole : knee aims forward (character local +Z rotated by yaw)
    _v3.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.root.rotation.y);
    _v3.multiplyScalar(0.6);
    _v3.y = -0.2;
    _v3.addScaledVector(_v2, -_v3.dot(_v2));
    if (_v3.lengthSq() < 1e-5) _v3.set(0, 0, 1); else _v3.normalize();

    _v4.crossVectors(_v2, _v3).normalize();

    const cosA = THREE.MathUtils.clamp((dist * dist + L1 * L1 - L2 * L2) / (2 * dist * L1), -1, 1);
    const A = Math.acos(cosA);
    _v5.copy(_v2).applyAxisAngle(_v4, A).normalize();

    const w = THREE.MathUtils.clamp(weight * (1 - Math.exp(-26 * dt)), 0, 1);

    hip.parent.getWorldQuaternion(_q1);
    _q2.setFromUnitVectors(_down, _v5);
    _q3.copy(_q1).invert().multiply(_q2);
    hip.quaternion.slerp(_q3, w);

    // knee
    _v1.addScaledVector(_v5, L1);
    _v2.copy(target).sub(_v1);
    if (_v2.lengthSq() < 1e-6) return;
    _v2.normalize();
    hip.parent.getWorldQuaternion(_q1);
    _q2.copy(_q1).multiply(hip.quaternion);
    _q3.setFromUnitVectors(_down, _v2).premultiply(_q2.clone().invert());
    knee.quaternion.slerp(_q3, w);

    // ankle : keep the sole flat on the floor
    _q2.multiply(knee.quaternion);
    _q3.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.root.rotation.y)
      .premultiply(_q2.clone().invert());
    ankle.quaternion.slerp(_q3, w);
  }

  /* ==========================================================================
   *  REAL GLB CHARACTER (fightkaro.com models, Draco + WebP)
   * ======================================================================== */

  loadRealModel() {
    const name = CHAR_MODEL[this.data.id];
    if (!name) return;
    const token = (this.loadToken = (this.loadToken || 0) + 1);
    // the box rig stays on screen while the GLB downloads: hiding it up front
    // leaves an invisible fighter on a slow connection
    loadCharacterModel(name).then((gltf) => {
      if (token !== this.loadToken) return;      // character changed mid-load
      this.attachGLB(gltf, name);
    }).catch((err) => {
      if (token === this.loadToken && !this.glbRoot && this.rigGroup) {
        this.rigGroup.visible = true;            // fall back to the box rig
      }
      console.warn('[fighter] ' + name + '.glb failed, keeping primitive rig:', err && err.message);
    });
  }

  detachGLB() {
    if (this.mixer) { try { this.mixer.stopAllAction(); } catch (e) {} }
    if (this.glbRoot) {
      this.body.remove(this.glbRoot);
      this.glbRoot.traverse((o) => {
        if (o.isMesh && o.geometry) o.geometry.dispose();
      });
    }
    this.glbRoot = null;
    this.mixer = null;
    this.actions = null;
    this.action = null;
    this.glbMats = null;
    this.glbReady = false;
  }

  attachGLB(gltf, name) {
    this.detachGLB();

    const source = gltf.scene;
    const box = new THREE.Box3().setFromObject(source);
    const size = box.getSize(new THREE.Vector3());
    const height = size.y > 0.5 ? size.y : 1.78;
    const scale = 1.78 / height;
    source.scale.setScalar(scale);
    source.position.y = -box.min.y * scale;
    source.position.x = 0;
    source.position.z = 0;

    source.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m) continue;
        if (m.map) m.map.anisotropy = 4;
        m.side = THREE.FrontSide;
        if (m.emissive === undefined) m.emissive = new THREE.Color(0, 0, 0);
        m.userData.baseEmissive = m.emissive.getHex();
        m.userData.baseEmissiveIntensity = m.emissiveIntensity;
      }
    });

    this.glbRoot = new THREE.Group();
    this.glbRoot.add(source);
    this.body.add(this.glbRoot);
    if (this.rigGroup) this.rigGroup.visible = false;

    this.mixer = new THREE.AnimationMixer(source);
    this.actions = {};
    for (const clip of gltf.animations) this.actions[clip.name] = this.mixer.clipAction(clip);

    this.glbMats = [];
    source.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) if (m && this.glbMats.indexOf(m) < 0) this.glbMats.push(m);
    });

    this.modelName = name;
    this.glbReady = true;
    this.action = null;
    this.clipName = null;

    this.setClip(this.stanceClipName(), { fade: 0, hold: true });
  }

  clipTable() { return CHAR_CLIPS[CHAR_MODEL[this.data.id]] || CHAR_CLIPS.modi; }

  stanceClipName() {
    const t = this.clipTable();
    return this.actions && this.actions[t.stance] ? t.stance : 'walk_fwd';
  }

  pick(arr) {
    for (const n of arr) if (this.actions && this.actions[n]) return n;
    return null;
  }

  /** crossfade to a clip. opts: fade, hold(loop), once, timeScale, time, restart */
  setClip(name, opts) {
    if (!this.glbReady || !name) return;
    const next = this.actions[name];
    if (!next) return;
    opts = opts || {};
    const fade = opts.fade == null ? 0.16 : opts.fade;

    if (this.action === next && !opts.restart) {
      if (opts.timeScale != null) next.timeScale = opts.timeScale;
      if (opts.hold) next.paused = false;
      return;
    }

    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(opts.timeScale == null ? 1 : opts.timeScale);
    next.setLoop(opts.once ? THREE.LoopOnce : THREE.LoopRepeat, opts.once ? 1 : Infinity);
    next.clampWhenFinished = !!opts.once;
    next.paused = false;
    if (opts.time != null) next.time = opts.time;

    if (this.action && this.action !== next && fade > 0) {
      next.crossFadeFrom(this.action, fade, false);
    } else if (this.action && this.action !== next) {
      this.action.stop();
    }
    next.play();
    this.action = next;
    this.clipName = name;
  }

  /** clip time that matches the engine's move timeline (authentic hit sync) */
  attackTime(clipName) {
    const t = CLIP_TIME[String(clipName).replace(/_m$/, '')] || [0.18, 0.5, 1.0];
    const start = t[0], hit = t[1], end = t[2];
    const m = this.currentMove || MOVES.PUNCH_1;
    const n = this.stateTimer;
    const startup = Math.max(0.04, m.startup);
    if (n < startup) return start + (hit - start) * (n / startup);
    const active = Math.max(0.04, m.active);
    const rest = n - startup - active;
    if (rest < 0) return hit;
    const total = startup + active + Math.max(0.04, m.recovery);
    const tail = Math.max(0.05, total - startup - active);
    return hit + (end - hit) * Math.min(1, rest / tail);
  }

  animateGLB(dt, opp) {
    const st = this.state;
    const C = this.clipTable();
    const speed = Math.abs(this.vel.x || 0);
    const pace = C.pace || 1;

    if (st === 'ATTACK' && this.currentMoveKey) {
      const clip = (C.moves && C.moves[this.currentMoveKey]) || 'palm';
      const name = this.pick([clip, clip + '_m', 'palm', 'cross', 'kick', 'jab']);
      if (name && this.clipName !== name) this.setClip(name, { fade: 0.07, once: true, restart: true });
      if (this.action && name) {
        this.action.setLoop(THREE.LoopOnce, 1);
        this.action.clampWhenFinished = true;
        this.action.time = this.attackTime(name);
        this.action.paused = true;
      }
    } else if (st === 'SUPER_ACTIVE') {
      const clip = (this.superPhase === 'strike' ? C.superStrike : C.superCharge) || C.superCharge || 'palm';
      const name = this.pick([clip, clip + '_m', 'palm', 'cross', 'stance']);
      if (name && this.clipName !== name) this.setClip(name, { fade: 0.15, hold: true, restart: true });
      if (this.action) this.action.paused = false;
    } else if (st === 'KNOCKDOWN' || st === 'KO') {
      if (this.clipName !== 'knockdown') this.setClip('knockdown', { fade: 0.07, once: true, restart: true });
    } else if (st === 'HITSTUN') {
      const name = this.pick(['hit', 'block', 'crouch']);
      this.setClip(name, { fade: 0.05, once: true });
      if (this.action) { this.action.timeScale = 1.25; }
    } else if (this.blocking) {
      this.setClip(this.pick(['block', 'crouch']), { fade: 0.1, hold: true });
    } else if (this.crouching || st === 'CROUCH') {
      this.setClip('crouch', { fade: 0.12, hold: true });
    } else if (!this.grounded) {
      this.setClip(this.pick(['jump', 'walk_fwd']), { fade: 0.08, once: true });
    } else if (st === 'MOVE' && speed > 0.35) {
      const forward = (this.vel.x * this.facing) > 0;
      const name = this.pick(forward ? ['walk_fwd', 'walk_back'] : ['walk_back', 'walk_fwd']);
      this.setClip(name, { fade: 0.14, hold: true });
      if (this.action) this.action.timeScale = (0.85 + speed * 0.1) * pace;
    } else {
      this.setClip(this.stanceClipName(), { fade: 0.18, hold: true });
      if (this.action) this.action.timeScale = 1;
    }

    if (this.mixer) this.mixer.update(dt);

    // yaw + knockdown fall tilt (kept for the primitive look, zero on GLB)
    this.tilt = 0;
    this.root.quaternion.setFromAxisAngle(_v1.set(0, 1, 0), this.root.rotation.y);

    // damage flash on the real materials
    const fl = this.flash;
    for (const m of this.glbMats || []) {
      if (fl > 0.01) {
        m.emissive.setRGB(fl * 0.85, fl * 0.12, fl * 0.1);
        m.emissiveIntensity = 1;
      } else if (m.emissiveIntensity !== 0) {
        m.emissive.setHex(m.userData.baseEmissive || 0x000000);
        m.emissiveIntensity = m.userData.baseEmissiveIntensity == null ? 1 : m.userData.baseEmissiveIntensity;
      }
    }
  }

}
