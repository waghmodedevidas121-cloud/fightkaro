/* ===== SUPER PROPS + AAA PBR MATERIALS & FX LAYER ===== */
class SuperPropsManager {
  constructor(scene) {
    this.scene = scene;
    this.fx = new ImpactFX(scene);

    // 1. MITRAMAN / CHANAKYA'S FORGED GOLDEN CHAKRA
    this.chakra = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.11, 16, 40),
      new THREE.MeshStandardMaterial({ color: 0xf0c975, emissive: 0xd4a853, emissiveIntensity: 0.7, metalness: 0.85, roughness: 0.2 })
    );
    const innerStar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.82, 0.82, 0.06, 12),
      new THREE.MeshBasicMaterial({ color: 0xffe066, wireframe: true })
    );
    innerStar.rotation.x = Math.PI / 2;
    const coreGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    this.chakra.add(ring, innerStar, coreGlow);
    this.chakra.visible = false;
    scene.add(this.chakra);

    // 2. YATRA BOY'S ALOO SE SONA MACHINE + POTATO + GOLD BAR
    this.alooMachine = new THREE.Group();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 1.35, 1.05),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.75, roughness: 0.25 })
    );
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.16, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xd4a853, metalness: 0.85, roughness: 0.2 })
    );
    trim.position.y = 0.55;
    const chuteL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.25 }));
    chuteL.rotation.z = Math.PI / 2; chuteL.position.x = -0.82;
    const chuteR = chuteL.clone(); chuteR.position.x = 0.82;
    this.alooMachine.add(box, trim, chuteL, chuteR);
    this.alooMachine.visible = false;
    scene.add(this.alooMachine);

    this.potatoMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xb58342, roughness: 0.88 })
    );
    this.potatoMesh.scale.set(1.3, 0.9, 0.9);
    this.potatoMesh.visible = false;
    scene.add(this.potatoMesh);

    this.goldBarMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.44, 0.48),
      new THREE.MeshStandardMaterial({ color: 0xf0c975, emissive: 0xb07d22, emissiveIntensity: 0.5, metalness: 0.95, roughness: 0.12 })
    );
    this.goldBarMesh.visible = false;
    scene.add(this.goldBarMesh);

    // 3. DEEDEE / LALUJI / DHRUV'S JADU CAULDRON & FROG
    this.cauldron = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.46, 0.82, 20),
      new THREE.MeshStandardMaterial({ color: 0x181b22, metalness: 0.65, roughness: 0.35 })
    );
    const poisonTop = new THREE.Mesh(
      new THREE.CircleGeometry(0.64, 20),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    poisonTop.rotation.x = -Math.PI / 2; poisonTop.position.y = 0.42;
    this.cauldron.add(poisonTop);
    this.cauldron.visible = false;
    scene.add(this.cauldron);

    this.frogMesh = new THREE.Group();
    const fBody = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 14), new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 }));
    const fEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    fEyeL.position.set(0.15, 0.28, 0.15);
    const fEyeR = fEyeL.clone(); fEyeR.position.z = -0.15;
    this.frogMesh.add(fBody, fEyeL, fEyeR);
    this.frogMesh.visible = false;
    scene.add(this.frogMesh);

    // 4. TARIFF TAAU / RAVISH'S GIANT GOLDEN STAMP
    this.tariffStamp = new THREE.Group();
    const stampBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.85, 0.52, 1.45),
      new THREE.MeshStandardMaterial({ color: 0xd4a853, metalness: 0.85, roughness: 0.2 })
    );
    const stampHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.46, 1.45, 18),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.35, metalness: 0.2 })
    );
    stampHandle.position.y = 0.92;
    this.tariffStamp.add(stampBase, stampHandle);
    this.tariffStamp.visible = false;
    scene.add(this.tariffStamp);

    // 5. DOZER DADA / TOLL MAN / MBAPU'S ARMORED BULLDOZER
    this.bulldozer = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.32, 1.25), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.55, roughness: 0.32 }));
    cab.position.y = 0.82;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.15, 1.68), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.88, roughness: 0.22 }));
    blade.position.set(1.12, 0.62, 0);
    const trackL = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.46, 0.36), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 }));
    trackL.position.set(0, 0.25, 0.62);
    const trackR = trackL.clone(); trackR.position.z = -0.62;
    this.bulldozer.add(cab, blade, trackL, trackR);
    this.bulldozer.visible = false;
    scene.add(this.bulldozer);

    // Charge aura sprite
    this.aura = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.fx.glowTex, color: 0xf0c975, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    this.aura.scale.set(3.2, 3.2, 3.2);
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
    this.fx.spawnSpark(pos, colorHex, count || 16, 1.1);
  }

  impact(pos, colorHex, heavy, dirX, dmgValue, isCounter) {
    this.fx.impact(pos, colorHex, heavy, dirX, dmgValue, isCounter);
  }

  blockImpact(pos) {
    this.fx.blockImpact(pos, 0x38bdf8);
  }

  trail(pos, colorHex) {
    this.fx.spawnSpark(pos, colorHex, 2, 0.4);
  }

  auraOn(pos, colorHex, power) {
    this.aura.position.copy(pos);
    this.aura.material.color.setHex(colorHex);
    this.aura.material.opacity = 0.55 * power;
    this.aura.scale.setScalar(1.5 + power * 2.4);
  }

  update(dt) {
    this.fx.update(dt);
    if (this.aura.material.opacity > 0) {
      this.aura.material.opacity = Math.max(0, this.aura.material.opacity - dt * 2.2);
      this.aura.scale.multiplyScalar(1 + dt * 1.6);
    }
  }
}
