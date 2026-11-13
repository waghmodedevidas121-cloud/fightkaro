class SansadShowdownEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.NoToneMapping;
        this.renderer.outputEncoding = THREE.LinearEncoding;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x160f1c);
        this.scene.fog = new THREE.FogExp2(0x160f1c, 0.035);

        this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camPos = new THREE.Vector3(0, 2.3, 8.6);
        this.camLook = new THREE.Vector3(0, 1.3, 0);
        this.shake = 0;
        this.camZoom = 1;
        this.camKick = 0;

        this.keys = {};
        this.p1Choice = 'MITRAMAN';
        this.p2Choice = 'YATRABOY';
        this.pickingFor = 'P1';
        this.stageChoice = 'SANSAD';

        this.round = 1;
        this.p1Wins = 0;
        this.p2Wins = 0;
        this.timer = 60;
        this.matchActive = false;
        this.hitStop = 0;
        this.activeSuper = null;

        // Mbapu Shanti Route Trackers
        this.shantiTimer = 0;
        this.shantiBlocks = 0;
        this.p1HasAttackedThisRound = false;

        this.stageGroup = new THREE.Group();
        this.scene.add(this.stageGroup);
        this.setupLights();
        this.buildStage('SANSAD');

        this.props = new SuperPropsManager(this.scene);
        this.p1 = new NetaFighter(this.scene, -2.5, true, ROSTER.MITRAMAN);
        this.p2 = new NetaFighter(this.scene, 2.5, false, ROSTER.YATRABOY);

        this.initUI();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    setupLights() {
        this.scene.add(new THREE.HemisphereLight(0x8fb8ff, 0x33131a, 0.22));
        this.scene.add(new THREE.AmbientLight(0xfff0e0, 0.34));

        const sun = new THREE.DirectionalLight(0xfff4e2, 1.0);
        sun.position.set(6, 13, 7);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.bias = -0.0008;
        sun.shadow.normalBias = 0.02;
        const sc = sun.shadow.camera;
        sc.left = -12; sc.right = 12; sc.top = 10; sc.bottom = -7; sc.near = 1; sc.far = 42;
        sc.updateProjectionMatrix();
        this.scene.add(sun);

        const rim = new THREE.PointLight(0x5aa0ff, 0.5, 24, 2);
        rim.position.set(-2, 6, -6);
        this.scene.add(rim);

        const goldLight = new THREE.PointLight(0xffb347, 0.45, 13, 2);
        goldLight.position.set(0, 3.4, -3.2);
        this.scene.add(goldLight);
    }

    buildStage(stageType) {
        while (this.stageGroup.children.length > 0) {
            this.stageGroup.remove(this.stageGroup.children[0]);
        }

        const floorColor = stageType === 'SANSAD' ? 0x5c1919 : (stageType === 'JANTAR' ? 0x3b3228 : 0x22252a);
        const bgColor = stageType === 'SANSAD' ? 0x1a0d12 : (stageType === 'JANTAR' ? 0x121d24 : 0x10131c);
        this.scene.background.setHex(bgColor);
        this.scene.fog.color.setHex(bgColor);

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(45, 30),
            new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.4 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.stageGroup.add(floor);

        // THE GOLDEN KURSI IN THE CENTER BACKGROUND
        const kursi = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.32, roughness: 0.35, emissive: 0x3a2600 });
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 1.2), goldMat);
        seat.position.y = 1.0;
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.2), goldMat);
        back.position.set(0, 1.9, -0.5);
        kursi.add(seat, back);
        kursi.position.set(0, 0, -4.2);
        this.stageGroup.add(kursi);

        // Sansad Sandstone Pillars
        const pillarMat = new THREE.MeshStandardMaterial({
            color: stageType === 'SANSAD' ? 0xc87d55 : 0x667788,
            roughness: 0.6
        });
        for (let i = -4; i <= 4; i++) {
            if (i === 0) continue;
            const p = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 8, 16), pillarMat);
            p.position.set(i * 3.2, 4, -5.8);
            this.stageGroup.add(p);
        }
    }

    initUI() {
        document.getElementById('accept-disclaimer').addEventListener('click', () => {
            sfx.init();
            sfx.playDholBeat(180, 0.25);
            sfx.setTrack('background', 0.16);
            document.getElementById('disclaimer-screen').style.display = 'none';
            document.getElementById('select-screen').style.display = 'flex';
        });

        const grid = document.getElementById('roster-grid');
        Object.values(ROSTER).forEach((c) => {
            const card = document.createElement('div');
            card.className = 'char-card';
            card.id = `card-${c.id}`;
            card.innerHTML = `
                <div class="char-avatar" style="background:${'#' + c.color.toString(16).padStart(6, '0')}"><img src="faces/${CHAR_FACE[c.id] || 'modi'}.webp" alt="${c.name}"></div>
                <div class="char-name">${c.name}</div>
                <div class="char-team">${c.team}</div>
                <div class="char-super">SUPER: ${c.superName}</div>
            `;
            card.addEventListener('click', () => {
                if (this.pickingFor === 'P1') {
                    this.p1Choice = c.id;
                    this.pickingFor = 'P2';
                } else {
                    this.p2Choice = c.id;
                    this.pickingFor = 'P1';
                }
                sfx.playDholBeat(220, 0.12);
                sfx.speak(c.name, 1.0, 1.1);
                this.refreshRosterCards();
            });
            grid.appendChild(card);
        });

        // Random Card
        const randCard = document.createElement('div');
        randCard.className = 'char-card';
        randCard.innerHTML = `
            <div class="char-avatar" style="background:#555">🎲</div>
            <div class="char-name">RANDOM NETA</div>
            <div class="char-team">Surprise Pick</div>
            <div class="char-super">ANY SUPER</div>
        `;
        randCard.addEventListener('click', () => {
            const keys = Object.keys(ROSTER);
            this.p1Choice = keys[Math.floor(Math.random() * keys.length)];
            this.p2Choice = keys[Math.floor(Math.random() * keys.length)];
            sfx.playDholBeat(260, 0.15);
            this.refreshRosterCards();
        });
        grid.appendChild(randCard);

        this.refreshRosterCards();

        document.getElementById('toggle-pick-side').addEventListener('click', (e) => {
            this.pickingFor = this.pickingFor === 'P1' ? 'P2' : 'P1';
            e.target.innerText = `PICKING: ${this.pickingFor}`;
        });

        document.querySelectorAll('.stage-btn[data-stage]').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.stage-btn[data-stage]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.stageChoice = btn.getAttribute('data-stage');
                this.buildStage(this.stageChoice);
            });
        });

        document.getElementById('start-fight-btn').addEventListener('click', () => {
            document.getElementById('select-screen').style.display = 'none';
            this.startFullMatch();
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
            if (e.repeat) return;
            this.keys[e.code] = true;
            this.handleCombatInput(e.code);
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        document.querySelectorAll('.touch-btn').forEach((btn) => {
            const code = btn.getAttribute('data-key');
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[code] = true;
                this.handleCombatInput(code);
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[code] = false;
            });
        });
    }

    refreshRosterCards() {
        document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected-p1', 'selected-p2'));
        const c1 = document.getElementById(`card-${this.p1Choice}`);
        const c2 = document.getElementById(`card-${this.p2Choice}`);
        if (c1) c1.classList.add('selected-p1');
        if (c2) c2.classList.add('selected-p2');
        const btn = document.getElementById('toggle-pick-side');
        if (btn) btn.innerText = `PICKING: ${this.pickingFor}`;
    }

    startFullMatch() {
        this.p1.applyCharacter(ROSTER[this.p1Choice]);
        this.p2.applyCharacter(ROSTER[this.p2Choice]);
        this.round = 1;
        this.p1Wins = 0;
        this.p2Wins = 0;

        document.getElementById('p1-name').innerText = this.p1.data.name;
        document.getElementById('p1-team').innerText = this.p1.data.team;
        document.getElementById('p2-name').innerText = this.p2.data.name;
        document.getElementById('p2-team').innerText = this.p2.data.team;

        const faceOf = (id) => 'faces/' + ((typeof CHAR_FACE !== 'undefined' && CHAR_FACE[id]) || 'modi') + '.webp';
        const f1 = document.getElementById('p1-face');
        const f2 = document.getElementById('p2-face');
        if (f1) f1.src = faceOf(this.p1.data.id);
        if (f2) f2.src = faceOf(this.p2.data.id);
        document.getElementById('p1-r1').classList.remove('won');
        document.getElementById('p1-r2').classList.remove('won');
        document.getElementById('p2-r1').classList.remove('won');
        document.getElementById('p2-r2').classList.remove('won');

        // Show Shanti Route Box if fighting Boss MBAPU
        document.getElementById('shanti-box').style.display = this.p2.data.id === 'MBAPU' ? 'block' : 'none';
        sfx.setTrack('battle', 0.2);

        this.startRound();
    }

    startRound() {
        this.props.hideAllProps();
        this.activeSuper = null;
        this.p1.hp = this.p1.maxHp;
        this.p2.hp = this.p2.maxHp;
        this.p1.root.position.set(-2.4, 0, 0);
        this.p2.root.position.set(2.4, 0, 0);
        this.p1.state = 'IDLE';
        this.p2.state = 'IDLE';
        this.timer = 60;
        this.shantiTimer = 0;
        this.shantiBlocks = 0;
        this.p1HasAttackedThisRound = false;

        this.updateHUD();
        // round audio: three non-overlapping slots
        //   0.00 s  "ROUND n"
        //   0.85 s  fighter intro line
        //   1.95 s  "FIGHT!" + gong, match goes live
        this.announce(`ROUND ${this.round}`);
        sfx.roundCall(this.round);
        setTimeout(() => {
            sfx.introVoice(this.round === 2 ? this.p2.data.id : this.p1.data.id);
        }, 850);
        setTimeout(() => {
            this.announce('FIGHT KARO!');
            sfx.fightCall();
            sfx.bell();
            this.matchActive = true;
        }, 1950);
    }

    showCallout(isP1, text) {
        const el = document.getElementById(isP1 ? 'p1-callout' : 'p2-callout');
        el.innerText = text;
        el.style.opacity = '1';
        el.style.transform = 'skewX(-12deg) scale(1.12)';
        setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'skewX(-12deg) scale(0.9)'; }, 900);
    }

    announce(text) {
        const el = document.getElementById('center-announcer');
        const rl = document.getElementById('round-label');
        if (rl && /^ROUND\s/i.test(text)) rl.innerText = text;
        el.innerText = text;
        el.style.opacity = '1';
        el.style.transform = 'translate(-50%, -50%) scale(1.1)';
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translate(-50%, -50%) scale(0.8)';
        }, 1000);
    }

    handleCombatInput(code) {
        if (!this.matchActive || this.activeSuper) return;
        const p = this.p1;

        const holdingForward = (p.facing === 1 && (this.keys['KeyD'] || this.keys['ArrowRight'])) ||
                               (p.facing === -1 && (this.keys['KeyA'] || this.keys['ArrowLeft']));
        const holdingDown = this.keys['KeyS'] || this.keys['ArrowDown'];

        // Jump (W / ArrowUp / E / Numpad8 / Space when shakti < 100)
        const isJump = (code === 'KeyW' || code === 'ArrowUp' || code === 'KeyE' || code === 'Numpad8' || (code === 'Space' && p.shakti < 100));
        if (isJump && p.grounded && (p.state === 'IDLE' || p.state === 'MOVE')) {
            p.vel.y = 11.2;
            p.grounded = false;
            try { sfx.whiff(); } catch (e) {}
        }

        // SUPER (L / Space / V / U / O / Numpad0 / Enter when Shakti == 100)
        const isSuper = (code === 'KeyL' || code === 'Space' || code === 'KeyV' || code === 'KeyU' || code === 'KeyO' || code === 'Numpad0' || code === 'Enter');
        if (isSuper && p.shakti >= 100 && (p.state === 'IDLE' || p.state === 'MOVE' || p.state === 'CROUCH')) {
            this.p1HasAttackedThisRound = true;
            this.launchSuper(p, this.p2);
            return;
        }

        // Unblockable Grab (I / C / G / Numpad3)
        if ((code === 'KeyI' || code === 'KeyC' || code === 'KeyG' || code === 'Numpad3') && (p.state === 'IDLE' || p.state === 'MOVE')) {
            this.p1HasAttackedThisRound = true;
            p.triggerMove('GRAB');
            this.showCallout(true, 'KURSI GRAB!');
            return;
        }

        // PUNCH & FORWARD SPECIAL PUNCH (J / Z / F / Numpad1 / Numpad4)
        if (code === 'KeyJ' || code === 'KeyZ' || code === 'KeyF' || code === 'Numpad1' || code === 'Numpad4') {
            this.p1HasAttackedThisRound = true;
            if (p.state === 'IDLE' || p.state === 'MOVE' || p.state === 'CROUCH') {
                if (holdingForward) {
                    p.triggerMove('SP_PUNCH');
                    this.showCallout(true, p.data.sp1Name);
                } else {
                    p.stringRoute = 'J';
                    p.triggerMove('PUNCH_1');
                }
            } else if (p.state === 'ATTACK') {
                if (p.stringRoute === 'J') { p.stringRoute = 'JJ'; p.queuedNextMove = 'PUNCH_2'; }
                else if (p.stringRoute === 'JJ') { p.stringRoute = 'JJJ'; p.queuedNextMove = 'PUNCH_3'; }
            }
        }

        // KICK, SWEEP (↓ + K) & FORWARD SPECIAL KICK (K / X / H / Numpad2 / Numpad5)
        if (code === 'KeyK' || code === 'KeyX' || code === 'KeyH' || code === 'Numpad2' || code === 'Numpad5') {
            this.p1HasAttackedThisRound = true;
            if (p.state === 'IDLE' || p.state === 'MOVE' || p.state === 'CROUCH') {
                if (holdingDown) {
                    p.triggerMove('SWEEP');
                    this.showCallout(true, 'CHAPPAL SWEEP!');
                } else if (holdingForward) {
                    p.triggerMove('SP_KICK');
                    this.showCallout(true, p.data.sp2Name);
                } else {
                    p.stringRoute = 'K';
                    p.triggerMove('KICK_1');
                }
            } else if (p.state === 'ATTACK') {
                if (p.stringRoute === 'J' || p.stringRoute === 'JJ') { p.stringRoute += 'K'; p.queuedNextMove = 'KICK_2'; }
                else if (p.stringRoute === 'K') { p.stringRoute = 'KK'; p.queuedNextMove = 'KICK_2'; }
            }
        }
    }

    /**
     * ========================================================================
     * CINEMATIC 3D SUPER ABILITY SEQUENCER (Mitra Chakra, Aloo Se Sona, etc.)
     * ========================================================================
     */
    launchSuper(attacker, defender) {
        attacker.shakti = 0;
        attacker.state = 'SUPER_ACTIVE';
        defender.state = 'HITSTUN';
        defender.stunDuration = 3.0;
        this.updateHUD();

        attacker.superPhase = 'charge';
        this.hitStop = 0;
        // frame 0 of the activation: shout + charge riser, nothing else
        sfx.superCue(attacker.data.id);
        this.camZoom = 0.72;
        this.camKick = 0.85;
        this.announce(attacker.data.superName + '!');
        this.showCallout(attacker.isP1, '⚡ ' + attacker.data.superName);

        this.activeSuper = {
            attacker,
            defender,
            id: attacker.data.id,
            timer: 0,
            duration: 2.35,
            hitApplied: false
        };
    }

    updateActiveSuper(dt) {
        const s = this.activeSuper;
        if (!s) return;
        s.timer += dt;
        const p = s.timer / s.duration;
        const atkPos = s.attacker.root.position;
        const defPos = s.defender.root.position;
        const phase = p < 0.55 ? 'charge' : 'strike';
        if (s.phase !== phase) {
            s.phase = phase;
            // the release swoosh fires on the exact frame the strike phase starts
            if (phase === 'strike') sfx.superStrikeCue(s.attacker.data.id);
        }
        s.attacker.superPhase = phase;
        const auraColor = s.attacker.data.color || 0xffcc00;
        this.props.auraOn(atkPos.clone().add(new THREE.Vector3(0, 1.1, 0)), auraColor, phase === 'charge' ? (0.65 + Math.sin(p * 24) * 0.3) : 1.25);
        this.props.trail(atkPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.7, 0.5 + Math.random() * 1.3, 0)), auraColor);

        // 1. MITRAMAN: Levitates high into sky, grows spinning Mitra Chakra above hand, hurls it at opponent
        if (s.id === 'MITRAMAN') {
            this.props.chakra.visible = true;
            this.props.chakra.rotation.z += 25 * dt;
            if (p < 0.55) {
                s.attacker.root.position.y = THREE.MathUtils.lerp(0, 2.6, p / 0.55);
                this.props.chakra.position.set(atkPos.x, s.attacker.root.position.y + 2.2, 0);
                this.props.chakra.scale.setScalar(0.2 + (p / 0.55) * 1.6);
            } else {
                const t = (p - 0.55) / 0.45;
                this.props.chakra.position.lerpVectors(
                    new THREE.Vector3(atkPos.x, 4.5, 0),
                    new THREE.Vector3(defPos.x, 1.2, 0),
                    t
                );
                s.attacker.root.position.y = THREE.MathUtils.lerp(2.6, 0, t);
            }
        }
        // 2. YATRA BOY: Zaps opponent into a Potato, feeds into 3D Aloo Machine, pops out Gold Bar!
        else if (s.id === 'YATRABOY') {
            this.props.alooMachine.visible = true;
            this.props.alooMachine.position.set(defPos.x, 1.1, 0);
            this.props.alooMachine.rotation.y += 2 * dt;
            if (p < 0.45) {
                s.defender.root.visible = false;
                this.props.potatoMesh.visible = true;
                this.props.potatoMesh.position.set(defPos.x - 1.4 + p * 3.0, 1.1, 0);
            } else {
                this.props.potatoMesh.visible = false;
                this.props.goldBarMesh.visible = true;
                this.props.goldBarMesh.position.set(defPos.x + (p - 0.45) * 2.5, 1.2, 0);
                this.props.goldBarMesh.rotation.z += 8 * dt;
            }
        }
        // 3. DEEDEE: JADU HOBE! Bubbling cauldron appears and turns opponent into a hopping green Frog!
        else if (s.id === 'DEEDEE') {
            this.props.cauldron.visible = true;
            this.props.cauldron.position.set((atkPos.x + defPos.x) * 0.5, 0.4, 0);
            if (p > 0.35) {
                s.defender.root.visible = false;
                this.props.frogMesh.visible = true;
                this.props.frogMesh.position.set(defPos.x, Math.abs(Math.sin(p * 18)) * 1.1, 0);
            }
        }
        // 4. TARIFF TAAU: TARIFF TSUNAMI! Giant Golden Executive Stamp slams from the sky!
        else if (s.id === 'TARIFFTAAU') {
            this.props.tariffStamp.visible = true;
            const dropY = p < 0.5 ? THREE.MathUtils.lerp(7.0, 0.6, p / 0.5) : 0.6;
            this.props.tariffStamp.position.set(defPos.x, dropY, 0);
            if (p >= 0.5) s.defender.root.scale.y = 0.25; // Squashed flat!
        }
        // 5. DOZER DADA / TOLL MAN / MBAPU: Bulldozer / High-Impact Ram!
        else {
            this.props.bulldozer.visible = true;
            const startX = atkPos.x - s.attacker.facing * 2.5;
            this.props.bulldozer.position.set(THREE.MathUtils.lerp(startX, defPos.x, p), 0, 0);
            this.props.bulldozer.rotation.y = s.attacker.facing === 1 ? 0 : Math.PI;
            if (Math.random() < 0.3) sfx.playHorn();
        }

        // Apply exact 30% (or 40% for Mbapu) Super Damage at climax
        if (p >= 0.75 && !s.hitApplied) {
            s.hitApplied = true;
            const superPct = s.attacker.data.superDmg / 100;
            const dmg = s.defender.maxHp * superPct;
            s.defender.hp = Math.max(0, s.defender.hp - dmg);
            this.shake = 0.9;
            sfx.superImpact();
            this.props.impact(defPos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffcc00, true, s.attacker.facing);
            this.props.burst(defPos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffcc00, 35);
            this.hitStop = 0.09;
            this.camKick = 1.7;
            this.camZoom = 0.78;
            this.updateHUD();
        }

        if (s.timer >= s.duration) {
            this.props.hideAllProps();
            sfx.stopSuperBed();
            s.attacker.superPhase = null;
            s.defender.root.visible = true;
            s.defender.root.scale.set(1, 1, 1);
            s.attacker.root.position.y = 0;
            s.attacker.state = 'IDLE';

            if (s.defender.hp <= 0) {
                s.defender.state = 'KO';
                this.endRound(s.attacker.isP1 ? 'P1' : 'P2');
            } else {
                s.defender.state = 'KNOCKDOWN';
                s.defender.stateTimer = 0;
            }
            this.activeSuper = null;
        }
    }

    processPlayerAndAI(dt) {
        const p1 = this.p1;
        const p2 = this.p2;

        // P1 Continuous Movement & Hold-Back-to-Block
        p1.crouching = Boolean(this.keys['KeyS'] || this.keys['ArrowDown'] || this.keys['Numpad2']);
        let moveDir = 0;
        if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['Numpad4']) moveDir -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight'] || this.keys['Numpad6']) moveDir += 1;

        const holdingBack = (moveDir !== 0) && (moveDir === -p1.facing);
        p1.blocking = holdingBack && p1.grounded && (p1.state === 'IDLE' || p1.state === 'MOVE' || p1.state === 'CROUCH');

        if (p1.state === 'IDLE' || p1.state === 'MOVE' || p1.state === 'CROUCH') {
            if (p1.crouching) {
                p1.vel.x = 0;
                p1.state = 'CROUCH';
            } else if (moveDir !== 0) {
                p1.vel.x = moveDir * (p1.blocking ? p1.data.walkSpeed * 0.65 : p1.data.walkSpeed);
                p1.state = 'MOVE';
            } else {
                p1.vel.x = 0;
                p1.state = 'IDLE';
            }
        }

        // MBAPU SHANTI ROUTE CHECK (Stay close 20s, Block 5 hits, Do NOT attack)
        if (p2.data.id === 'MBAPU' && !this.p1HasAttackedThisRound) {
            const dist = Math.abs(p1.root.position.x - p2.root.position.x);
            if (dist < 3.4) {
                this.shantiTimer += dt;
            }
            const progress = Math.min(100, ((this.shantiTimer / 20) * 50) + (Math.min(5, this.shantiBlocks) / 5) * 50);
            document.getElementById('shanti-fill').style.width = `${progress}%`;
            document.getElementById('shanti-blocks').innerText = `${Math.min(5, this.shantiBlocks)}/5`;

            if (this.shantiTimer >= 20 && this.shantiBlocks >= 5) {
                this.announce('🕊️ SHANTI VICTORY!');
                sfx.speak('Ahimsa ki jeet hui! Shanti Clear!');
                this.endRound('P1');
                return;
            }
        }

        // CPU AI Logic
        const dist = Math.abs(p2.root.position.x - p1.root.position.x);
        if (p2.shakti >= 100 && (p2.state === 'IDLE' || p2.state === 'MOVE') && dist < 3.5 && Math.random() < dt * 2.5) {
            this.launchSuper(p2, p1);
            return;
        }

        if (p2.state === 'IDLE' || p2.state === 'MOVE') {
            p2.blocking = (p1.state === 'ATTACK' && dist < 2.3 && Math.random() < 0.28);
            if (dist > 1.95) {
                p2.vel.x = p2.facing * p2.data.walkSpeed * 0.85;
                p2.state = 'MOVE';
            } else {
                p2.vel.x = 0;
                p2.state = 'IDLE';
                if (Math.random() < dt * 4.2) {
                    // If player turtles/blocks too much, CPU uses Grab!
                    if (p1.blocking && Math.random() < 0.45 && this.p2.data.id !== 'MBAPU') {
                        p2.triggerMove('GRAB');
                        this.showCallout(false, 'KURSI GRAB!');
                    } else if (Math.random() < 0.35) {
                        p2.triggerMove('SP_PUNCH');
                        this.showCallout(false, p2.data.sp1Name);
                    } else {
                        p2.stringRoute = 'J';
                        p2.triggerMove('PUNCH_1');
                    }
                }
            }
        } else if (p2.state === 'ATTACK' && p2.stringRoute === 'J' && Math.random() < dt * 7) {
            p2.stringRoute = 'JJ';
            p2.queuedNextMove = 'KICK_2';
        }
    }

    checkHits() {
        const resolve = (atk, def) => {
            if (atk.state !== 'ATTACK' || atk.hasHit) return;
            const m = atk.currentMove;
            if (atk.stateTimer < m.startup || atk.stateTimer > m.startup + m.active) return;

            const dx = def.root.position.x - atk.root.position.x;
            if (Math.sign(dx) !== atk.facing || Math.abs(dx) > m.range) return;
            if (Math.abs(atk.root.position.y - def.root.position.y) > 1.3) return;

            atk.hasHit = true;
            const hitPos = def.root.position.clone().add(new THREE.Vector3(0, 1.2, 0));

            // Check Block Rules (Standing blocks high/mid; Crouch blocks low; Grabs are unblockable)
            const canBlock = def.blocking && !m.unblockable && (m.low ? def.crouching : true);

            if (canBlock) {
                // Official FightKaro Chip Damage (15%) & Blocked Shakti Gain (+2 Attacker, +3 Defender)
                const chip = m.dmg * atk.data.dmgMult * 0.15;
                def.hp = Math.max(1, def.hp - chip);
                atk.addShakti(2);
                def.addShakti(3);
                def.vel.x = atk.facing * m.push * 0.4;
                sfx.playSlapOrPunch(false);
                this.props.blockImpact(hitPos);
                def.flash = 0.75;
                sfx.blockHit();
                this.camKick = Math.min(1.6, this.camKick + 0.45);
                if (def.isP1 && atk.data.id === 'MBAPU') this.shantiBlocks++;
                this.updateHUD();
                return;
            }

            // Counter-hit check (1.2x damage if defender was in startup)
            const isCounter = def.state === 'ATTACK' && def.stateTimer < def.currentMove.startup;
            const scaleIdx = Math.min(atk.comboCount, COMBO_SCALING.length - 1);
            const scale = COMBO_SCALING[scaleIdx];
            const finalDmg = m.dmg * atk.data.dmgMult * (isCounter ? 1.2 : 1.0) * scale;

            def.hp = Math.max(0, def.hp - finalDmg);
            def.vel.x = atk.facing * m.push;

            // Official FightKaro Shakti Formula: Attacker = dmg * 0.9 + 2, Defender = dmg * 0.6
            atk.addShakti(finalDmg * 0.9 + 2);
            def.addShakti(finalDmg * 0.6);

            atk.comboCount++;
            atk.comboDecay = 1.5;
            if (isCounter) this.showCallout(atk.isP1, 'COUNTER HIT! (1.2x)');
            else if (atk.comboCount >= 2) this.showCallout(atk.isP1, `${atk.comboCount} HIT COMBO!`);

            sfx.playSlapOrPunch(Boolean(m.knockdown));
            const hitColor = m.knockdown ? 0xff3300 : (isCounter ? 0xff66ff : 0xffcc00);
            const pushDir = Math.sign(def.root.position.x - atk.root.position.x) || atk.facing;
            this.props.impact(
                new THREE.Vector3(hitPos.x - pushDir * 0.16, (def.root.position.y || 0) + (m.low ? 0.62 : 1.16), 0),
                hitColor, !!m.knockdown, pushDir
            );
            def.flash = 1;
            atk.flash = 0.32;
            this.hitStop = m.knockdown ? 0.1 : (isCounter ? 0.075 : 0.05);
            this.shake = Math.min(1.15, this.shake + (m.knockdown ? 0.62 : 0.3));
            this.camKick = Math.min(1.7, this.camKick + (m.knockdown ? 1.2 : 0.55));
            this.camZoom = THREE.MathUtils.clamp(this.camZoom - (m.knockdown ? 0.085 : 0.045), 0.72, 1);

            if (def.hp <= 0) {
                def.state = 'KO';
                sfx.koSting();
                this.endRound(atk.isP1 ? 'P1' : 'P2');
            } else if (m.knockdown) {
                def.state = 'KNOCKDOWN';
                def.stateTimer = 0;
                def.vel.y = 4.2;
                def.grounded = false;
            } else {
                def.state = 'HITSTUN';
                def.stateTimer = 0;
                def.stunDuration = m.stun;
            }

            this.updateHUD();
        };

        resolve(this.p1, this.p2);
        resolve(this.p2, this.p1);
    }

    endRound(winner) {
        this.matchActive = false;
        sfx.stopSuperBed();
        sfx.crowd(0.75);
        if (winner === 'P1') {
            this.p1Wins++;
            document.getElementById(`p1-r${this.p1Wins}`).classList.add('won');
        } else {
            this.p2Wins++;
            document.getElementById(`p2-r${this.p2Wins}`).classList.add('won');
        }

        if (this.p1Wins >= 2 || this.p2Wins >= 2) {
            const champ = this.p1Wins >= 2 ? this.p1 : this.p2;
            sfx.matchEnd(this.p1Wins >= 2);
            sfx.winVoice(champ.data.id);
            setTimeout(() => {
                this.announce(`${champ.data.name} WINS THE KURSI!`);
                sfx.speak(`${champ.data.name} jeet gaye! Kursi mili!`);
            }, 600);
            setTimeout(() => {
                document.getElementById('select-screen').style.display = 'flex';
            }, 3400);
        } else {
            this.round++;
            setTimeout(() => this.startRound(), 2200);
        }
    }

    updateHUD() {
        const p1Hp = `${(this.p1.hp / this.p1.maxHp) * 100}%`;
        const p2Hp = `${(this.p2.hp / this.p2.maxHp) * 100}%`;
        document.getElementById('p1-hp').style.width = p1Hp;
        document.getElementById('p1-hp-dmg').style.width = p1Hp;
        document.getElementById('p2-hp').style.width = p2Hp;
        document.getElementById('p2-hp-dmg').style.width = p2Hp;

        const s1 = Math.floor(this.p1.shakti);
        const s2 = Math.floor(this.p2.shakti);
        const bar1 = document.getElementById('p1-shakti');
        const bar2 = document.getElementById('p2-shakti');
        bar1.style.width = `${s1}%`;
        bar2.style.width = `${s2}%`;
        bar1.classList.toggle('shakti-full', s1 >= 100);
        bar2.classList.toggle('shakti-full', s2 >= 100);
        document.getElementById('p1-shakti-txt').innerText = s1 >= 100 ? 'SUPER READY' : `SHAKTI ${s1}%`;
        document.getElementById('p2-shakti-txt').innerText = s2 >= 100 ? 'SUPER READY' : `SHAKTI ${s2}%`;
    }

    updateCamera(dt) {
        if (window.FK && window.FK.freeze) return;

        const midX = (this.p1.root.position.x + this.p2.root.position.x) * 0.5;
        const dist = Math.abs(this.p1.root.position.x - this.p2.root.position.x);

        this.camKick = Math.max(0, this.camKick - dt * 3.2);
        this.camZoom += (1 - this.camZoom) * (1 - Math.exp(-4.2 * dt));
        const zoom = THREE.MathUtils.clamp(this.camZoom - this.camKick * 0.045, 0.66, 1.05);

        const baseZ = this.activeSuper ? 5.6 : THREE.MathUtils.clamp(5.8 + dist * 0.6, 6.2, 10.5);
        const targetZ = baseZ * zoom;
        const targetY = 2.3 + (1 - zoom) * 1.2;

        const kx = 1 - Math.exp(-7 * dt);
        const kz = 1 - Math.exp(-5 * dt);
        this.camPos.x += (midX - this.camPos.x) * kx;
        this.camPos.z += (targetZ - this.camPos.z) * kz;
        this.camPos.y += (targetY - this.camPos.y) * kz;

        this.shake = Math.max(0, this.shake - dt * 2.2);
        const s = this.shake * this.shake * 0.35;
        this.camera.position.set(
            this.camPos.x + (Math.random() - 0.5) * s,
            this.camPos.y + (Math.random() - 0.5) * s,
            this.camPos.z
        );
        this.camLook.x += (midX - this.camLook.x) * (1 - Math.exp(-10 * dt));
        this.camLook.y += (1.3 - this.camLook.y) * (1 - Math.exp(-6 * dt));
        this.camera.lookAt(this.camLook);
    }

    loop(now) {
        requestAnimationFrame((t) => this.loop(t));
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        sfx.fadeMusic(dt);
        this.lastTime = now;

        if (this.hitStop > 0) {
            this.hitStop -= dt;
            this.props.update(dt);
            this.updateCamera(dt);
            this.renderer.render(this.scene, this.camera);
            return;
        }

        if (this.activeSuper) {
            this.updateActiveSuper(dt);
        } else if (this.matchActive) {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.timer = 0;
                this.endRound(this.p1.hp >= this.p2.hp ? 'P1' : 'P2');
            }
            const timerEl = document.getElementById('match-timer');
            timerEl.innerText = Math.ceil(this.timer);
            timerEl.classList.toggle('low', this.timer <= 10);
            this.processPlayerAndAI(dt);
            this.checkHits();
        }

        this.p1.update(dt, this.p2);
        this.p2.update(dt, this.p1);
        this.props.update(dt);
        this.updateCamera(dt);
        this.renderer.render(this.scene, this.camera);
    }
}
