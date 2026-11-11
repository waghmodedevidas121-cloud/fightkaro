/* ===== SUPER PROPS + upgraded impact layer ===== */
class SuperPropsManager {
  constructor(scene) {
    this.scene = scene;
    this.fx = new ImpactFX(scene);

    // 1. MITRAMAN'S MITRA CHAKRA
    this.chakra = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.1, 12, 32),
      new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    const innerStar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.06, 12),
      new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true })
    );
    innerStar.rotation.x = Math.PI / 2;
    this.chakra.add(ring, innerStar);
    this.chakra.visible = false;
    scene.add(this.chakra);

    // 2. YATRA BOY'S ALOO SE SONA MACHINE + POTATO + GOLD BAR
    this.alooMachine = new THREE.Group();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 1.3, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x2266cc, metalness: 0.6, roughness: 0.3 })
    );
    const chuteL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6), new THREE.MeshStandardMaterial({ color: 0x888888 }));
    chuteL.rotation.z = Math.PI / 2; chuteL.position.x = -0.8;
    const chuteR = chuteL.clone(); chuteR.position.x = 0.8;
    this.alooMachine.add(box, chuteL, chuteR);
    this.alooMachine.visible = false;
    scene.add(this.alooMachine);

    this.potatoMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xb58342, roughness: 0.9 })
    );
    this.potatoMesh.scale.set(1.3, 0.9, 0.9);
    this.potatoMesh.visible = false;
    scene.add(this.potatoMesh);

    this.goldBarMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.42, 0.45),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xaa7700, metalness: 0.9, roughness: 0.1 })
    );
    this.goldBarMesh.visible = false;
    scene.add(this.goldBarMesh);

    // 3. DEEDEE'S JADU HOBE CAULDRON & FROG
    this.cauldron = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.45, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 })
    );
    const poisonTop = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ff66 })
    );
    poisonTop.rotation.x = -Math.PI / 2; poisonTop.position.y = 0.41;
    this.cauldron.add(poisonTop);
    this.cauldron.visible = false;
    scene.add(this.cauldron);

    this.frogMesh = new THREE.Group();
    const fBody = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshStandardMaterial({ color: 0x00cc44 }));
    const fEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    fEyeL.position.set(0.15, 0.28, 0.15);
    const fEyeR = fEyeL.clone(); fEyeR.position.z = -0.15;
    this.frogMesh.add(fBody, fEyeL, fEyeR);
    this.frogMesh.visible = false;
    scene.add(this.frogMesh);

    // 4. TARIFF TAAU'S GIANT STAMP & CRATES
    this.tariffStamp = new THREE.Group();
    const stampBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.5, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.7, roughness: 0.2 })
    );
    const stampHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xaa0000 })
    );
    stampHandle.position.y = 0.9;
    this.tariffStamp.add(stampBase, stampHandle);
    this.tariffStamp.visible = false;
    scene.add(this.tariffStamp);

    // 5. DOZER DADA'S 3D BULLDOZER
    this.bulldozer = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.3, 1.2), new THREE.MeshStandardMaterial({ color: 0xffaa00 }));
    cab.position.y = 0.8;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 1.6), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
    blade.position.set(1.1, 0.6, 0);
    const trackL = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 0.35), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    trackL.position.set(0, 0.25, 0.6);
    const trackR = trackL.clone(); trackR.position.z = -0.6;
    this.bulldozer.add(cab, blade, trackL, trackR);
    this.bulldozer.visible = false;
    scene.add(this.bulldozer);

    // charge aura used during the super cinematic
    this.aura = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.fx.glowTex, color: 0xffcc00, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    this.aura.scale.set(3, 3, 3);
    scene.add(this.aura);
  }

  hideAllProps() {
    this.chakra.visible = false;
    this.alooMachine.visible = false;
    this.potatoMesh.visible = false;
    this.goldBarMesh.visible = false;
    this.cauldron.visible = false;
    this.frogMesh.visible = false;
    this.tariffStamp.visible = false;
    this.bulldozer.visible = false;
    this.aura.material.opacity = 0;
  }

  burst(pos, colorHex, count) {
    this.fx.spawnSpark(pos, colorHex, count || 14, 1);
  }

  impact(pos, colorHex, heavy, dirX) {
    this.fx.impact(pos, colorHex, heavy, dirX);
  }

  blockImpact(pos) {
    this.fx.blockImpact(pos, 0x9fe0ff);
  }

  trail(pos, colorHex) {
    this.fx.spawnSpark(pos, colorHex, 2, 0.35);
  }

  auraOn(pos, colorHex, power) {
    this.aura.position.copy(pos);
    this.aura.material.color.setHex(colorHex);
    this.aura.material.opacity = 0.5 * power;
    this.aura.scale.setScalar(1.4 + power * 2.2);
  }

  update(dt) {
    this.fx.update(dt);
    if (this.aura.material.opacity > 0) {
      this.aura.material.opacity = Math.max(0, this.aura.material.opacity - dt * 2.2);
      this.aura.scale.multiplyScalar(1 + dt * 1.6);
    }
  }
}
