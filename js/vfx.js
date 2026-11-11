/* ===== IMPACT FX : sparks, shockwaves, dust, impact light ===== */
function glowTexture(size) {
  size = size || 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,.75)');
  grd.addColorStop(0.6, 'rgba(255,255,255,.16)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  return t;
}

class ImpactFX {
  constructor(scene) {
    this.scene = scene;
    this.glowTex = glowTexture(128);
    this.sparks = [];
    this.rings = [];
    this.dusts = [];
    this.lights = [];
    this.sIdx = 0; this.rIdx = 0; this.dIdx = 0; this.lIdx = 0;
    this.tmp = new THREE.Object3D();

    const geo = new THREE.TetrahedronGeometry(0.06, 0);
    for (let i = 0; i < 96; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      m.visible = false;
      scene.add(m);
      this.sparks.push({ m, v: new THREE.Vector3(), life: 0, max: 1, size: 1 });
    }

    const ringGeo = new THREE.RingGeometry(0.45, 0.58, 36);
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      m.visible = false;
      scene.add(m);
      this.rings.push({ m, life: 0, max: 1, from: 0.3, to: 2.0, flat: false });
    }

    for (let i = 0; i < 20; i++) {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this.glowTex, color: 0xffffff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      m.visible = false;
      scene.add(m);
      this.dusts.push({ m, v: new THREE.Vector3(), life: 0, max: 1, size: 1 });
    }

    for (let i = 0; i < 3; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 8, 2);
      scene.add(l);
      this.lights.push({ l, life: 0, max: 1, power: 0 });
    }
  }

  ring(pos, color, opt) {
    opt = opt || {};
    const r = this.rings[this.rIdx++ % this.rings.length];
    r.m.visible = true;
    r.m.position.copy(pos);
    r.m.material.color.setHex(color);
    r.m.material.opacity = 1;
    r.life = r.max = opt.dur || 0.32;
    r.from = opt.from || 0.25;
    r.to = opt.to || 2.1;
    r.flat = !!opt.flat;
    r.m.scale.setScalar(r.from);
    if (r.flat) r.m.rotation.set(-Math.PI / 2, 0, 0); else r.m.rotation.set(0, 0, 0);
  }

  spawnSpark(pos, color, count, power) {
    count = count || 10;
    power = power || 1;
    for (let i = 0; i < count; i++) {
      const s = this.sparks[this.sIdx++ % this.sparks.length];
      s.m.visible = true;
      s.m.position.copy(pos);
      s.m.material.color.setHex(color);
      s.m.material.opacity = 1;
      s.v.set(
        (Math.random() - 0.5) * 7 * power,
        (Math.random() * 6 + 1) * power,
        (Math.random() - 0.5) * 6 * power
      );
      s.max = 0.24 + Math.random() * 0.28;
      s.life = s.max;
      s.size = 0.55 + Math.random() * 1.1;
      s.rot = Math.random() * 6;
    }
  }

  dust(pos, dirX, n) {
    n = n || 5;
    for (let i = 0; i < n; i++) {
      const d = this.dusts[this.dIdx++ % this.dusts.length];
      d.m.visible = true;
      d.m.position.set(pos.x + (Math.random() - 0.5) * 0.4, 0.06 + Math.random() * 0.12, (Math.random() - 0.5) * 0.4);
      d.v.set((Math.random() - 0.5) * 1.6 + (dirX || 0) * 1.2, 0.3 + Math.random() * 0.7, (Math.random() - 0.5) * 1.2);
      d.max = 0.4 + Math.random() * 0.3;
      d.life = d.max;
      d.size = 0.5 + Math.random() * 0.6;
      d.m.material.color.setHex(0xbfe4ff);
      d.m.material.opacity = 0.42;
      d.m.scale.setScalar(d.size);
    }
  }

  flash(pos, color, power) {
    const f = this.lights[this.lIdx++ % this.lights.length];
    f.l.position.copy(pos);
    f.l.color.setHex(color);
    f.l.intensity = 4.5 * power;
    f.power = power;
    f.max = f.life = 0.15;
  }

  impact(pos, color, heavy, dirX) {
    const p = heavy ? 1.45 : 1;
    this.spawnSpark(pos, color, heavy ? 20 : 12, p);
    this.ring(pos, color, { to: heavy ? 2.7 : 1.8, dur: heavy ? 0.4 : 0.28 });
    if (heavy) this.ring(pos, 0xffffff, { to: 3.4, dur: 0.46, from: 0.15 });
    this.dust(pos, dirX, heavy ? 7 : 3);
    this.flash(pos, color, p);
  }

  blockImpact(pos, color) {
    this.spawnSpark(pos, 0x8fd8ff, 6, 0.7);
    this.ring(pos, color || 0x9fe0ff, { to: 1.25, dur: 0.22, from: 0.3 });
    this.flash(pos, 0x9fe0ff, 0.55);
  }

  update(dt) {
    for (const s of this.sparks) {
      if (s.life <= 0) continue;
      s.life -= dt;
      if (s.life <= 0) { s.m.visible = false; continue; }
      s.v.y -= 13 * dt;
      s.v.multiplyScalar(1 - 1.4 * dt);
      s.m.position.addScaledVector(s.v, dt);
      if (s.m.position.y < 0.03 && s.v.y < 0) { s.m.position.y = 0.03; s.v.y *= -0.3; s.v.x *= 0.6; }
      const k = Math.max(0, s.life / s.max);
      s.m.material.opacity = k;
      s.m.scale.setScalar(s.size * (0.3 + k * 0.9));
      s.m.rotation.x += dt * 12;
      s.m.rotation.z += dt * 8;
    }

    for (const r of this.rings) {
      if (r.life <= 0) continue;
      r.life -= dt;
      if (r.life <= 0) { r.m.visible = false; continue; }
      const k = 1 - r.life / r.max;
      const e = 1 - Math.pow(1 - k, 3);
      r.m.scale.setScalar(r.from + (r.to - r.from) * e);
      r.m.material.opacity = Math.pow(1 - k, 1.6);
    }

    for (const d of this.dusts) {
      if (d.life <= 0) continue;
      d.life -= dt;
      if (d.life <= 0) { d.m.visible = false; continue; }
      const k = 1 - d.life / d.max;
      d.v.multiplyScalar(1 - 2.0 * dt);
      d.m.position.addScaledVector(d.v, dt);
      d.m.scale.setScalar(d.size * (1 + k * 2.2));
      d.m.material.opacity = 0.42 * Math.pow(1 - k, 1.4);
    }

    for (const f of this.lights) {
      if (f.life <= 0) { if (f.l.intensity !== 0) f.l.intensity = 0; continue; }
      f.life -= dt;
      f.l.intensity = 4.5 * f.power * Math.pow(Math.max(0, f.life / f.max), 1.6);
    }
  }
}
