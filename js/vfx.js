/* ===== AAA IMPACT FX v2 : slash arcs, directional streaks, shockwave pillars, floating damage numbers ===== */
function glowTexture(size) {
  size = size || 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.22, 'rgba(255,244,214,0.85)');
  grd.addColorStop(0.55, 'rgba(255,190,90,0.22)');
  grd.addColorStop(1, 'rgba(255,140,20,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

class ImpactFX {
  constructor(scene) {
    this.scene = scene;
    this.glowTex = glowTexture(128);
    this.sparks = [];
    this.rings = [];
    this.arcs = [];
    this.pillars = [];
    this.dusts = [];
    this.lights = [];
    this.popups = [];
    this.sIdx = 0; this.rIdx = 0; this.aIdx = 0; this.pIdx = 0; this.dIdx = 0; this.lIdx = 0; this.popIdx = 0;

    // Velocity-aligned elongated spark shards
    const sparkGeo = new THREE.BoxGeometry(0.035, 0.24, 0.035);
    for (let i = 0; i < 120; i++) {
      const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      m.visible = false;
      scene.add(m);
      this.sparks.push({ m, v: new THREE.Vector3(), life: 0, max: 1, size: 1 });
    }

    // Concentric shockwave rings
    const ringGeo = new THREE.RingGeometry(0.42, 0.62, 42);
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      m.visible = false;
      scene.add(m);
      this.rings.push({ m, life: 0, max: 1, from: 0.25, to: 2.2, flat: false });
    }

    // Crescent slash arcs for strikes & kicks
    const arcGeo = new THREE.TorusGeometry(0.95, 0.065, 8, 28, Math.PI * 0.85);
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(arcGeo, new THREE.MeshBasicMaterial({
        color: 0xffd166, transparent: true, opacity: 0, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      m.visible = false;
      scene.add(m);
      this.arcs.push({ m, life: 0, max: 1, dir: 1 });
    }

    // Vertical energy pillars for knockdowns & supers
    const pillarGeo = new THREE.CylinderGeometry(0.28, 0.65, 4.6, 20, 1, true);
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(pillarGeo, new THREE.MeshBasicMaterial({
        color: 0xffcc44, transparent: true, opacity: 0, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      m.visible = false;
      scene.add(m);
      this.pillars.push({ m, life: 0, max: 1 });
    }

    // Soft atmospheric dust & embers
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this.glowTex, color: 0xffffff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      m.visible = false;
      scene.add(m);
      this.dusts.push({ m, v: new THREE.Vector3(), life: 0, max: 1, size: 1 });
    }

    // Dynamic point lights for real-time character & floor bounce flash
    for (let i = 0; i < 4; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 9.5, 2);
      scene.add(l);
      this.lights.push({ l, life: 0, max: 1, power: 0 });
    }

    // Floating 3D damage / status callout sprites
    for (let i = 0; i < 12; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 96;
      const tex = new THREE.CanvasTexture(canvas);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0, depthWrite: false, depthTest: false
      }));
      sp.visible = false;
      sp.scale.set(1.5, 0.56, 1);
      scene.add(sp);
      this.popups.push({ sp, canvas, tex, life: 0, max: 1, vy: 1.4 });
    }
  }

  popup(pos, text, colorHex, scaleMult) {
    const p = this.popups[this.popIdx++ % this.popups.length];
    const ctx = p.canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 96);
    const hex = '#' + (colorHex || 0xffd166).toString(16).padStart(6, '0');
    ctx.font = '900 44px "Bahnschrift", "Impact", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(5, 7, 12, 0.92)';
    ctx.strokeText(text, 128, 48);
    ctx.fillStyle = hex;
    ctx.fillText(text, 128, 48);
    p.tex.needsUpdate = true;

    p.sp.visible = true;
    p.sp.position.set(pos.x + (Math.random() - 0.5) * 0.25, pos.y + 0.55, 0.45);
    p.sp.material.opacity = 1;
    const sc = scaleMult || 1;
    p.sp.scale.set(1.55 * sc, 0.58 * sc, 1);
    p.life = p.max = 0.72;
    p.vy = 1.45;
  }

  slashArc(pos, color, dirX, heavy) {
    const a = this.arcs[this.aIdx++ % this.arcs.length];
    a.m.visible = true;
    a.m.position.copy(pos);
    a.m.material.color.setHex(color);
    a.m.material.opacity = 0.95;
    a.dir = dirX || 1;
    a.m.rotation.set(
      (Math.random() - 0.5) * 0.4,
      a.dir === 1 ? 0 : Math.PI,
      -0.45 + (Math.random() - 0.5) * 0.4
    );
    const sc = heavy ? 1.35 : 0.95;
    a.m.scale.set(sc, sc, sc);
    a.life = a.max = heavy ? 0.26 : 0.18;
  }

  pillar(pos, color) {
    const p = this.pillars[this.pIdx++ % this.pillars.length];
    p.m.visible = true;
    p.m.position.set(pos.x, 2.2, pos.z);
    p.m.material.color.setHex(color);
    p.m.material.opacity = 0.75;
    p.m.scale.set(0.4, 1, 0.4);
    p.life = p.max = 0.42;
  }

  ring(pos, color, opt) {
    opt = opt || {};
    const r = this.rings[this.rIdx++ % this.rings.length];
    r.m.visible = true;
    r.m.position.copy(pos);
    r.m.material.color.setHex(color);
    r.m.material.opacity = 1;
    r.life = r.max = opt.dur || 0.34;
    r.from = opt.from || 0.25;
    r.to = opt.to || 2.3;
    r.flat = !!opt.flat;
    r.m.scale.setScalar(r.from);
    if (r.flat) r.m.rotation.set(-Math.PI / 2, 0, 0); else r.m.rotation.set(0, 0, 0);
  }

  spawnSpark(pos, color, count, power) {
    count = count || 12;
    power = power || 1;
    for (let i = 0; i < count; i++) {
      const s = this.sparks[this.sIdx++ % this.sparks.length];
      s.m.visible = true;
      s.m.position.copy(pos);
      s.m.material.color.setHex(color);
      s.m.material.opacity = 1;
      s.v.set(
        (Math.random() - 0.5) * 8.5 * power,
        (Math.random() * 6.8 + 1.2) * power,
        (Math.random() - 0.5) * 6.5 * power
      );
      s.max = 0.24 + Math.random() * 0.26;
      s.life = s.max;
      s.size = 0.65 + Math.random() * 1.15;
    }
  }

  dust(pos, dirX, n) {
    n = n || 5;
    for (let i = 0; i < n; i++) {
      const d = this.dusts[this.dIdx++ % this.dusts.length];
      d.m.visible = true;
      d.m.position.set(pos.x + (Math.random() - 0.5) * 0.45, 0.08 + Math.random() * 0.14, (Math.random() - 0.5) * 0.45);
      d.v.set((Math.random() - 0.5) * 1.8 + (dirX || 0) * 1.4, 0.35 + Math.random() * 0.75, (Math.random() - 0.5) * 1.3);
      d.max = 0.42 + Math.random() * 0.3;
      d.life = d.max;
      d.size = 0.55 + Math.random() * 0.65;
      d.m.material.color.setHex(0xf6dfa8);
      d.m.material.opacity = 0.45;
      d.m.scale.setScalar(d.size);
    }
  }

  flash(pos, color, power) {
    const f = this.lights[this.lIdx++ % this.lights.length];
    f.l.position.copy(pos);
    f.l.color.setHex(color);
    f.l.intensity = 5.5 * power;
    f.power = power;
    f.max = f.life = 0.16;
  }

  impact(pos, color, heavy, dirX, dmgValue, isCounter) {
    const p = heavy ? 1.5 : 1.05;
    this.spawnSpark(pos, color, heavy ? 24 : 14, p);
    this.slashArc(pos, color, dirX, heavy);
    this.ring(pos, color, { to: heavy ? 2.9 : 1.9, dur: heavy ? 0.42 : 0.28 });
    if (heavy) {
      this.ring(pos, 0xffffff, { to: 3.6, dur: 0.48, from: 0.15 });
      this.ring(new THREE.Vector3(pos.x, 0.04, pos.z), color, { to: 2.8, dur: 0.45, flat: true });
      this.pillar(pos, color);
    }
    this.dust(pos, dirX, heavy ? 8 : 4);
    this.flash(pos, color, p);
    if (dmgValue) {
      const label = isCounter ? `-${Math.round(dmgValue)} CRIT!` : `-${Math.round(dmgValue)}`;
      this.popup(pos, label, isCounter ? 0xf0c975 : (heavy ? 0xff6a5e : 0xffffff), heavy || isCounter ? 1.2 : 0.95);
    }
  }

  blockImpact(pos, color) {
    this.spawnSpark(pos, 0x7dd3fc, 8, 0.75);
    this.ring(pos, color || 0x38bdf8, { to: 1.35, dur: 0.22, from: 0.3 });
    this.flash(pos, 0x38bdf8, 0.65);
    this.popup(pos, 'GUARD', 0x7dd3fc, 0.85);
  }

  update(dt) {
    for (const s of this.sparks) {
      if (s.life <= 0) continue;
      s.life -= dt;
      if (s.life <= 0) { s.m.visible = false; continue; }
      s.v.y -= 14 * dt;
      s.v.multiplyScalar(1 - 1.3 * dt);
      s.m.position.addScaledVector(s.v, dt);
      if (s.m.position.y < 0.03 && s.v.y < 0) { s.m.position.y = 0.03; s.v.y *= -0.3; s.v.x *= 0.6; }
      const k = Math.max(0, s.life / s.max);
      s.m.material.opacity = k;
      const spd = s.v.length();
      s.m.scale.set(s.size * 0.8, s.size * (0.4 + spd * 0.22), s.size * 0.8);
      if (spd > 0.05) {
        s.m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), s.v.clone().normalize());
      }
    }

    for (const a of this.arcs) {
      if (a.life <= 0) continue;
      a.life -= dt;
      if (a.life <= 0) { a.m.visible = false; continue; }
      const k = 1 - a.life / a.max;
      a.m.rotation.z += a.dir * dt * 11;
      a.m.scale.multiplyScalar(1 + dt * 2.4);
      a.m.material.opacity = Math.pow(1 - k, 1.3);
    }

    for (const p of this.pillars) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { p.m.visible = false; continue; }
      const k = 1 - p.life / p.max;
      const w = 0.35 + k * 1.4;
      p.m.scale.set(w, 1 + k * 0.35, w);
      p.m.material.opacity = 0.72 * Math.pow(1 - k, 1.5);
    }

    for (const r of this.rings) {
      if (r.life <= 0) continue;
      r.life -= dt;
      if (r.life <= 0) { r.m.visible = false; continue; }
      const k = 1 - r.life / r.max;
      const e = 1 - Math.pow(1 - k, 3);
      r.m.scale.setScalar(r.from + (r.to - r.from) * e);
      r.m.material.opacity = Math.pow(1 - k, 1.5);
    }

    for (const d of this.dusts) {
      if (d.life <= 0) continue;
      d.life -= dt;
      if (d.life <= 0) { d.m.visible = false; continue; }
      const k = 1 - d.life / d.max;
      d.v.multiplyScalar(1 - 2.0 * dt);
      d.m.position.addScaledVector(d.v, dt);
      d.m.scale.setScalar(d.size * (1 + k * 2.2));
      d.m.material.opacity = 0.45 * Math.pow(1 - k, 1.4);
    }

    for (const f of this.lights) {
      if (f.life <= 0) { if (f.l.intensity !== 0) f.l.intensity = 0; continue; }
      f.life -= dt;
      f.l.intensity = 5.5 * f.power * Math.pow(Math.max(0, f.life / f.max), 1.6);
    }

    for (const p of this.popups) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { p.sp.visible = false; continue; }
      const k = 1 - p.life / p.max;
      p.sp.position.y += p.vy * dt;
      p.vy *= (1 - 2.6 * dt);
      p.sp.material.opacity = k < 0.65 ? 1 : Math.max(0, 1 - (k - 0.65) / 0.35);
    }
  }
}
