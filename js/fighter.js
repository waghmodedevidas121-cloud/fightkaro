/* ===== NETA FIGHTER v4 : Real GLB PBR Materials + Contact Shadow + Skin Customization ===== */
class NetaFighter {
  constructor(scene, x, isP1, charData) {
    this.scene = scene;
    this.isP1 = isP1;
    this.root = new THREE.Group();
    this.root.position.set(x, 0, 0);
    this.scene.add(this.root);

    this.body = new THREE.Group();
    this.root.add(this.body);

    // Grounded Contact Shadow + Rim Ring under each fighter
    this.shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 28),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.48, depthWrite: false })
    );
    this.shadowDisc.rotation.x = -Math.PI / 2;
    this.shadowDisc.position.y = 0.012;
    this.root.add(this.shadowDisc);

    this.baseRing = new THREE.Mesh(
      new THREE.RingGeometry(0.56, 0.62, 36),
      new THREE.MeshBasicMaterial({
        color: isP1 ? 0xd4a853 : 0xd8352a,
        transparent: true, opacity: 0.36, side: THREE.DoubleSide, depthWrite: false
      })
    );
    this.baseRing.rotation.x = -Math.PI / 2;
    this.baseRing.position.y = 0.015;
    this.root.add(this.baseRing);

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
    this.skinTintHex = null;
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
    if (this.body) this.root.remove(this.body);
    this.body = new THREE.Group();
    this.root.add(this.body);
    this.bones = {};
    this.targetRot = {};
    this.buildRig();
    if (this.rigGroup) this.rigGroup.visible = false;
    this.loadRealModel();
  }

  setSkinTint(hex) {
    this.skinTintHex = hex || null;
    if (!this.glbMats) return;
    for (const m of this.glbMats) {
      if (this.skinTintHex) {
        m.color.setHex(this.skinTintHex);
      } else {
        m.color.setHex(m.userData.baseColor != null ? m.userData.baseColor : 0xffffff);
      }
    }
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

    this.rigGroup = new THREE.Group();
    this.body.add(this.rigGroup);
    const hips = bone('hips', this.rigGroup, 0, 0.94, 0);
    shell(hips, 0.185, 0.175, 0.2, outfitMat, 0.86);
    mesh(hips, new THREE.CylinderGeometry(0.196, 0.19, 0.075, 18), darkMat, 0, 0.1, 0).scale.z = 0.9;

    const torso = bone('torso', hips, 0, 0.1, 0);
    shell(torso, 0.235, 0.185, 0.44, outfitMat, 0.8);
    const vest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.244, 0.206, 0.36, 18, 1, true, -0.95, 1.9),
      accentMat
    );
    vest.position.y = 0.24;
    vest.scale.z = 0.82;
    vest.material.side = THREE.DoubleSide;
    vest.castShadow = true;
    torso.add(vest);
    mesh(torso, new THREE.CylinderGeometry(0.135, 0.16, 0.1, 16), whiteMat, 0, 0.46, 0).scale.z = 0.85;
    mesh(torso, new THREE.CylinderGeometry(0.072, 0.082, 0.14, 12), skinMat, 0, 0.53, 0);
    if (d.RedTie) {
      mesh(torso, new THREE.BoxGeometry(0.075, 0.3, 0.05), new THREE.MeshStandardMaterial({ color: 0xd81b2a, roughness: 0.55 }), 0, 0.3, 0.175);
    }
    mesh(torso, new THREE.SphereGeometry(0.1, 14, 12), outfitMat, 0.2, 0.395, 0).scale.set(1.15, 1, 0.95);
    mesh(torso, new THREE.SphereGeometry(0.1, 14, 12), outfitMat, -0.2, 0.395, 0).scale.set(1.15, 1, 0.95);

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

    ['L', 'R'].forEach((s) => {
      const dir = s === 'L' ? 1 : -1;
      const sh = bone('shoulder_' + s, torso, dir * 0.2, 0.395, 0);
      capsule(sh, 0.079, 0.29, outfitMat, 0.92);
      const el = bone('elbow_' + s, sh, 0, -0.29, 0);
      capsule(el, 0.073, 0.26, skinMat, 0.86);
      mesh(el, new THREE.SphereGeometry(0.076, 12, 10), skinMat, 0, -0.28, 0);
    });

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

    // Keep contact shadow anchored on floor y=0 even when jumping
    if (this.shadowDisc) {
      const h = Math.max(0, this.root.position.y);
      this.shadowDisc.position.y = -h + 0.012;
      const sc = Math.max(0.45, 1 - h * 0.22);
      this.shadowDisc.scale.setScalar(sc);
    }
    if (this.baseRing) {
      const h = Math.max(0, this.root.position.y);
      this.baseRing.position.y = -h + 0.015;
      this.baseRing.material.opacity = this.shakti >= 100 ? (0.55 + Math.sin(performance.now() * 0.01) * 0.25) : 0.3;
    }

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
    } else {
      const br = Math.sin(t * 2.3) * 0.5 + 0.5;
      const sway = Math.sin(t * 0.85 * S.freq + this.phase) * S.sway;
      this.setP({
        torso: [0.07 + S.lean + br * 0.025, -0.26 + sway * 0.07, sway * 0.035],
        head: [-0.06 - br * 0.02, 0.26 - sway * 0.09, sway * 0.04],
        shoulder_L: [-1.14 + br * 0.05, 0.16, 0.24], elbow_L: [2.0 - br * 0.06, 0, 0],
        shoulder_R: [-1.04 - br * 0.05, -0.16, -0.24], elbow_R: [1.95 + br * 0.06, 0, 0]
      });
    }

    for (const n of BONE_NAMES) {
      const e = this.targetRot[n];
      const v = out[n];
      e.set(v[0], v[1], v[2]);
      _eu.copy(e);
      _q1.setFromEuler(_eu);
      const b = this.bones[n];
      if (b) b.quaternion.slerp(_q1, 1 - Math.exp(-rate * dt));
    }
    if (this.bones.hips) this.bones.hips.position.y = dampf(this.bones.hips.position.y, hipY, 16, dt);
  }

  /* ==========================================================================
   *  REAL GLB CHARACTER (sRGB Textures + PBR Roughness/Metalness Enhancement)
   * ======================================================================== */

  loadRealModel() {
    const name = CHAR_MODEL[this.data.id];
    if (!name) return;
    if (this.rigGroup) this.rigGroup.visible = false;
    const token = (this.loadToken = (this.loadToken || 0) + 1);
    loadCharacterModel(name).then((gltf) => {
      if (token !== this.loadToken) return;
      this.attachGLB(gltf, name);
    }).catch((err) => {
      if (token !== this.loadToken) return;
      if (this.rigGroup) this.rigGroup.visible = false;
      this.showGhost();
      console.warn('[fighter] ' + name + '.glb failed:', err && err.message);
    });
  }

  showGhost() {
    if (this.ghost) return;
    const geo = new THREE.CylinderGeometry(0.34, 0.5, 1.8, 18, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: this.isP1 ? 0xd4a853 : 0xd8352a,
      transparent: true,
      opacity: 0.29,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.ghost = new THREE.Mesh(geo, mat);
    this.ghost.position.y = 0.9;
    this.root.add(this.ghost);
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
    if (this.ghost) {
      this.root.remove(this.ghost);
      if (this.ghost.geometry) this.ghost.geometry.dispose();
      if (this.ghost.material) this.ghost.material.dispose();
      this.ghost = null;
    }

    const source = gltf.scene;
    const box = new THREE.Box3().setFromObject(source);
    const size = box.getSize(new THREE.Vector3());
    const height = size.y > 0.5 ? size.y : 1.78;
    const scale = 1.82 / height;
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
        if (m.map) {
          m.map.anisotropy = 8;
          m.map.encoding = THREE.sRGBEncoding;
          m.map.needsUpdate = true;
        }
        // PBR refinement: eliminate plastic sheen, boost rim reflection
        if (m.roughness != null) m.roughness = THREE.MathUtils.clamp(m.roughness * 0.92, 0.38, 0.85);
        if (m.metalness != null) m.metalness = Math.min(0.22, m.metalness);
        m.envMapIntensity = 1.15;
        m.side = THREE.FrontSide;
        if (m.emissive === undefined) m.emissive = new THREE.Color(0, 0, 0);
        m.userData.baseColor = m.color ? m.color.getHex() : 0xffffff;
        m.userData.baseEmissive = m.emissive.getHex();
        m.userData.baseEmissiveIntensity = m.emissiveIntensity;
        if (this.skinTintHex) m.color.setHex(this.skinTintHex);
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

    this.tilt = 0;
    this.root.quaternion.setFromAxisAngle(_v1.set(0, 1, 0), this.root.rotation.y);

    const fl = this.flash;
    for (const m of this.glbMats || []) {
      if (fl > 0.01) {
        m.emissive.setRGB(fl * 0.85, fl * 0.18, fl * 0.08);
        m.emissiveIntensity = 1;
      } else if (m.emissiveIntensity !== 0) {
        m.emissive.setHex(m.userData.baseEmissive || 0x000000);
        m.emissiveIntensity = m.userData.baseEmissiveIntensity == null ? 1 : m.userData.baseEmissiveIntensity;
      }
    }
  }
}
