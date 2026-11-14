class SansadShowdownEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0b0e14);
        this.scene.fog = new THREE.FogExp2(0x0b0e14, 0.028);

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
        this.trainingMode = false;

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
        // Three-Point Arena Lighting + Warm Forged Bronze Key & Cool Rim
        this.scene.add(new THREE.HemisphereLight(0x93c5fd, 0x261510, 0.42));
        this.scene.add(new THREE.AmbientLight(0xfff4e6, 0.28));

        const keyLight = new THREE.DirectionalLight(0xfff0d4, 1.35);
        keyLight.position.set(6, 13, 7);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.bias = -0.0006;
        keyLight.shadow.normalBias = 0.02;
        const sc = keyLight.shadow.camera;
        sc.left = -12; sc.right = 12; sc.top = 10; sc.bottom = -7; sc.near = 1; sc.far = 42;
        sc.updateProjectionMatrix();
        this.scene.add(keyLight);

        // Cool Cyan/Steel Back-Rim Light for crisp character silhouettes
        const rimLeft = new THREE.PointLight(0x4dabf7, 1.15, 26, 1.8);
        rimLeft.position.set(-4.5, 5.5, -5.5);
        this.scene.add(rimLeft);

        const rimRight = new THREE.PointLight(0xf0c975, 1.1, 26, 1.8);
        rimRight.position.set(4.5, 5.5, -5.5);
        this.scene.add(rimRight);

        // Center Golden Kursi Pedestal Spotlight
        const kursiGlow = new THREE.PointLight(0xd4a853, 0.9, 14, 2);
        kursiGlow.position.set(0, 3.6, -3.5);
        this.scene.add(kursiGlow);
    }

    buildStage(stageType) {
        while (this.stageGroup.children.length > 0) {
            this.stageGroup.remove(this.stageGroup.children[0]);
        }

        const floorColor = stageType === 'SANSAD' ? 0x4a1414 : (stageType === 'JANTAR' ? 0x2b241d : 0x1a1e26);
        const bgColor = stageType === 'SANSAD' ? 0x12090d : (stageType === 'JANTAR' ? 0x0c141a : 0x090c12);
        this.scene.background.setHex(bgColor);
        this.scene.fog.color.setHex(bgColor);

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(48, 32),
            new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.42, metalness: 0.12 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.stageGroup.add(floor);

        // Arena Brass Trim Line along combat lane
        const laneLine = new THREE.Mesh(
            new THREE.PlaneGeometry(18, 0.08),
            new THREE.MeshBasicMaterial({ color: 0xd4a853, transparent: true, opacity: 0.35 })
        );
        laneLine.rotation.x = -Math.PI / 2;
        laneLine.position.set(0, 0.008, 0.85);
        this.stageGroup.add(laneLine);

        // THE GOLDEN KURSI IN THE CENTER BACKGROUND + PEDESTAL
        const kursi = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xf0c975, metalness: 0.82, roughness: 0.22, emissive: 0x4a3208, emissiveIntensity: 0.45
        });
        const dais = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.8, 0.35, 24),
            new THREE.MeshStandardMaterial({ color: 0x1e222d, metalness: 0.4, roughness: 0.5 })
        );
        dais.position.y = 0.175;
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 1.2), goldMat);
        seat.position.y = 1.15;
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.85, 0.22), goldMat);
        back.position.set(0, 2.05, -0.5);
        const halo = new THREE.Mesh(
            new THREE.RingGeometry(1.4, 1.55, 36),
            new THREE.MeshBasicMaterial({ color: 0xf0c975, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
        );
        halo.position.set(0, 2.1, -0.65);
        kursi.add(dais, seat, back, halo);
        kursi.position.set(0, 0, -4.2);
        this.stageGroup.add(kursi);

        // Architectural Sandstone / Steel Pillars with Brass Caps
        const pillarMat = new THREE.MeshStandardMaterial({
            color: stageType === 'SANSAD' ? 0xb56e48 : (stageType === 'JANTAR' ? 0x526070 : 0x334155),
            roughness: 0.55, metalness: 0.15
        });
        const capMat = new THREE.MeshStandardMaterial({ color: 0xd4a853, metalness: 0.78, roughness: 0.28 });
        for (let i = -4; i <= 4; i++) {
            if (i === 0) continue;
            const p = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.52, 8.2, 20), pillarMat);
            p.position.set(i * 3.2, 4.1, -5.8);
            p.castShadow = true;
            p.receiveShadow = true;
            const baseCap = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.4, 20), capMat);
            baseCap.position.set(i * 3.2, 0.2, -5.8);
            this.stageGroup.add(p, baseCap);
        }
    }

    initUI() {
        const acc = document.getElementById('accept-disclaimer');
        if (acc) {
            acc.addEventListener('click', () => {
                sfx.init();
                sfx.playDholBeat(180, 0.25);
                sfx.setTrack('background', 0.16);
                document.getElementById('disclaimer-screen').style.display = 'none';
                document.getElementById('select-screen').style.display = 'flex';
            });
        }

        const grid = document.getElementById('roster-grid');
        if (grid) {
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

            const randCard = document.createElement('div');
            randCard.className = 'char-card';
            randCard.id = 'random-card';
            randCard.innerHTML = `
                <div class="char-avatar" style="background:#3b4252">🎲</div>
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
        }

        this.refreshRosterCards();

        const toggleSide = document.getElementById('toggle-pick-side');
        if (toggleSide) {
            toggleSide.addEventListener('click', (e) => {
                this.pickingFor = this.pickingFor === 'P1' ? 'P2' : 'P1';
                e.target.innerText = `PICKING: ${this.pickingFor}`;
            });
        }

        document.querySelectorAll('.stage-btn[data-stage]').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.stage-btn[data-stage]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.stageChoice = btn.getAttribute('data-stage');
                this.buildStage(this.stageChoice);
            });
        });

        const startBtn = document.getElementById('start-fight-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                document.getElementById('select-screen').style.display = 'none';
                this.startFullMatch();
            });
        }

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

    startFullMatch(opts) {
        opts = opts || {};
        this.trainingMode = !!opts.training;
        this.p1.applyCharacter(ROSTER[this.p1Choice] || ROSTER.MITRAMAN);
        this.p2.applyCharacter(ROSTER[this.p2Choice] || ROSTER.YATRABOY);

        if (window.FKUI && typeof window.FKUI.applyEquippedLoadout === 'function') {
            window.FKUI.applyEquippedLoadout(this);
        }

        this.round = 1;
        this.p1Wins = 0;
        this.p2Wins = 0;

        document.getElementById('p1-name').innerText = this.p1.data.name;
        document.getElementById('p1-team').innerText = this.p1.data.team;
        document.getElementById('p2-name').innerText = this.p2.data.name;
        document.getElementById('p2-team').innerText = this.trainingMode ? 'TRAINING DUMMY' : this.p2.data.team;

        const faceOf = (id) => 'faces/' + ((typeof CHAR_FACE !== 'undefined' && CHAR_FACE[id]) || 'modi') + '.webp';
        const f1 = document.getElementById('p1-face');
        const f2 = document.getElementById('p2-face');
        if (f1) f1.src = faceOf(this.p1.data.id);
        if (f2) f2.src = faceOf(this.p2.data.id);
        document.getElementById('p1-r1').classList.remove('won');
        document.getElementById('p1-r2').classList.remove('won');
        document.getElementById('p2-r1').classList.remove('won');
        document.getElementById('p2-r2').classList.remove('won');

        document.getElementById('shanti-box').style.display = (!this.trainingMode && this.p2.data.id === 'MBAPU') ? 'block' : 'none';
        const trBar = document.getElementById('training-toolbar');
        if (trBar) trBar.style.display = this.trainingMode ? 'flex' : 'none';

        document.getElementById('hud').classList.add('on');
        sfx.setTrack('battle', 0.2);

        this.startRound();
    }

    startRound() {
        this.props.hideAllProps();
        this.activeSuper = null;
        this.p1.hp = this.p1.maxHp;
        this.p2.hp = this.p2.maxHp;
        if (this.trainingMode) {
            this.p1.shakti = 100;
            this.p2.shakti = 0;
        }
        this.p1.root.position.set(-2.4, 0, 0);
        this.p2.root.position.set(2.4, 0, 0);
        this.p1.state = 'IDLE';
        this.p2.state = 'IDLE';
        this.timer = this.trainingMode ? 99 : 60;
        this.shantiTimer = 0;
        this.shantiBlocks = 0;
        this.p1HasAttackedThisRound = false;

        this.updateHUD();
        if (this.trainingMode) {
            this.announce('TRAINING DOJO');
            this.matchActive = true;
            return;
        }

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
        if (!el) return;
        el.innerText = text;
        el.classList.add('on');
        el.style.opacity = '1';
        setTimeout(() => { el.classList.remove('on'); el.style.opacity = '0'; }, 900);
    }

    announce(text) {
        const el = document.getElementById('center-announcer');
        const rl = document.getElementById('round-label');
        if (rl && /^ROUND\s/i.test(text)) rl.innerText = text;
        if (!el) return;
        el.innerText = text;
        el.classList.add('on');
        el.style.opacity = '1';
        setTimeout(() => {
            el.classList.remove('on');
            el.style.opacity = '0';
        }, 1050);
    }

    handleCombatInput(code) {
        if (!this.matchActive || this.activeSuper) return;
        const p = this.p1;

        const holdingForward = (p.facing === 1 && (this.keys['KeyD'] || this.keys['ArrowRight'])) ||
                               (p.facing === -1 && (this.keys['KeyA'] || this.keys['ArrowLeft']));
        const holdingDown = this.keys['KeyS'] || this.keys['ArrowDown'];

        const isJump = (code === 'KeyW' || code === 'ArrowUp' || code === 'KeyE' || code === 'Numpad8' || (code === 'Space' && p.shakti < 100));
        if (isJump && p.grounded && (p.state === 'IDLE' || p.state === 'MOVE')) {
            p.vel.y = 11.2;
            p.grounded = false;
            try { sfx.whiff(); } catch (e) {}
        }

        const isSuper = (code === 'KeyL' || code === 'Space' || code === 'KeyV' || code === 'KeyU' || code === 'KeyO' || code === 'Numpad0' || code === 'Enter');
        if (isSuper && p.shakti >= 100 && (p.state === 'IDLE' || p.state === 'MOVE' || p.state === 'CROUCH')) {
            this.p1HasAttackedThisRound = true;
            this.launchSuper(p, this.p2);
            return;
        }

        if ((code === 'KeyI' || code === 'KeyC' || code === 'KeyG' || code === 'Numpad3') && (p.state === 'IDLE' || p.state === 'MOVE')) {
            this.p1HasAttackedThisRound = true;
            p.triggerMove('GRAB');
            this.showCallout(true, 'KURSI GRAB!');
            return;
        }

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
     * CINEMATIC 3D SUPER ABILITY SEQUENCER (ALL 11 FIGHTERS + EQUIPPED PROP)
     * ========================================================================
     */
    launchSuper(attacker, defender) {
        if (window.FKUI) window.FKUI.onSuper(attacker);
        attacker.shakti = this.trainingMode && attacker.isP1 ? 100 : 0;
        attacker.state = 'SUPER_ACTIVE';
        defender.state = 'HITSTUN';
        defender.stunDuration = 3.0;
        this.updateHUD();

        attacker.superPhase = 'charge';
        this.hitStop = 0;
        sfx.superCue(attacker.data.id);
        this.camZoom = 0.72;
        this.camKick = 0.85;
        this.announce(attacker.data.superName + '!');
        this.showCallout(attacker.isP1, '⚡ ' + attacker.data.superName);

        const propOverride = (attacker.isP1 && window.FKUI && window.FKUI.getEquippedProp)
            ? window.FKUI.getEquippedProp()
            : 'DEFAULT';

        this.activeSuper = {
            attacker,
            defender,
            id: attacker.data.id,
            propOverride,
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
            if (phase === 'strike') sfx.superStrikeCue(s.attacker.data.id);
        }
        s.attacker.superPhase = phase;
        const auraColor = s.attacker.data.color || 0xf0c975;
        this.props.auraOn(atkPos.clone().add(new THREE.Vector3(0, 1.1, 0)), auraColor, phase === 'charge' ? (0.65 + Math.sin(p * 24) * 0.3) : 1.3);
        this.props.trail(atkPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.7, 0.5 + Math.random() * 1.3, 0)), auraColor);

        const mode = s.propOverride !== 'DEFAULT' ? s.propOverride : s.id;

        if (mode === 'MITRAMAN' || mode === 'CHANAKYA' || mode === 'CHAKRA') {
            this.props.chakra.visible = true;
            this.props.chakra.rotation.z += 25 * dt;
            if (p < 0.55) {
                s.attacker.root.position.y = THREE.MathUtils.lerp(0, 2.5, p / 0.55);
                this.props.chakra.position.set(atkPos.x, s.attacker.root.position.y + 2.2, 0);
                this.props.chakra.scale.setScalar(0.25 + (p / 0.55) * 1.6);
            } else {
                const t = (p - 0.55) / 0.45;
                this.props.chakra.position.lerpVectors(
                    new THREE.Vector3(atkPos.x, 4.4, 0),
                    new THREE.Vector3(defPos.x, 1.2, 0),
                    t
                );
                s.attacker.root.position.y = THREE.MathUtils.lerp(2.5, 0, t);
            }
        } else if (mode === 'YATRABOY' || mode === 'ALOO') {
            this.props.alooMachine.visible = true;
            this.props.alooMachine.position.set(defPos.x, 1.1, 0);
            this.props.alooMachine.rotation.y += 2.2 * dt;
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
        } else if (mode === 'DEEDEE' || mode === 'LALUJI' || mode === 'DHRUV' || mode === 'CAULDRON') {
            this.props.cauldron.visible = true;
            this.props.cauldron.position.set((atkPos.x + defPos.x) * 0.5, 0.4, 0);
            if (p > 0.35) {
                s.defender.root.visible = false;
                this.props.frogMesh.visible = true;
                this.props.frogMesh.position.set(defPos.x, Math.abs(Math.sin(p * 18)) * 1.1, 0);
            }
        } else if (mode === 'TARIFFTAAU' || mode === 'RAVISH' || mode === 'STAMP') {
            this.props.tariffStamp.visible = true;
            const dropY = p < 0.5 ? THREE.MathUtils.lerp(7.0, 0.6, p / 0.5) : 0.6;
            this.props.tariffStamp.position.set(defPos.x, dropY, 0);
            if (p >= 0.5) s.defender.root.scale.y = 0.25;
        } else {
            this.props.bulldozer.visible = true;
            const startX = atkPos.x - s.attacker.facing * 2.5;
            this.props.bulldozer.position.set(THREE.MathUtils.lerp(startX, defPos.x, p), 0, 0);
            this.props.bulldozer.rotation.y = s.attacker.facing === 1 ? 0 : Math.PI;
            if (Math.random() < 0.3) sfx.playHorn();
        }

        if (p >= 0.75 && !s.hitApplied) {
            s.hitApplied = true;
            const superPct = s.attacker.data.superDmg / 100;
            const dmg = s.defender.maxHp * superPct;
            s.defender.hp = Math.max(this.trainingMode ? 10 : 0, s.defender.hp - dmg);
            if (window.FKUI) window.FKUI.onHit(s.attacker, dmg);
            this.shake = 0.95;
            sfx.superImpact();
            this.props.impact(defPos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xf0c975, true, s.attacker.facing, dmg, true);
            this.props.burst(defPos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xf0c975, 38);
            this.hitStop = 0.09;
            this.camKick = 1.75;
            this.camZoom = 0.76;
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

            if (s.defender.hp <= 0 && !this.trainingMode) {
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

        if (this.trainingMode) {
            p2.vel.x = 0;
            if (p2.hp < p2.maxHp && p2.state === 'IDLE') {
                p2.hp = Math.min(p2.maxHp, p2.hp + 35 * dt);
                this.updateHUD();
            }
            return;
        }

        if (p2.data.id === 'MBAPU' && !this.p1HasAttackedThisRound) {
            const dist = Math.abs(p1.root.position.x - p2.root.position.x);
            if (dist < 3.4) this.shantiTimer += dt;
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
            const canBlock = def.blocking && !m.unblockable && (m.low ? def.crouching : true);

            if (canBlock) {
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

            const isCounter = def.state === 'ATTACK' && def.stateTimer < def.currentMove.startup;
            const scaleIdx = Math.min(atk.comboCount, COMBO_SCALING.length - 1);
            const scale = COMBO_SCALING[scaleIdx];
            const finalDmg = m.dmg * atk.data.dmgMult * (isCounter ? 1.2 : 1.0) * scale;

            def.hp = Math.max(this.trainingMode ? 10 : 0, def.hp - finalDmg);
            if (window.FKUI) window.FKUI.onHit(atk, finalDmg);
            def.vel.x = atk.facing * m.push;

            atk.addShakti(finalDmg * 0.9 + 2);
            def.addShakti(finalDmg * 0.6);

            atk.comboCount++;
            atk.comboDecay = 1.5;
            if (isCounter) this.showCallout(atk.isP1, 'COUNTER HIT! (1.2x)');
            else if (atk.comboCount >= 2) this.showCallout(atk.isP1, `${atk.comboCount} HIT COMBO!`);

            sfx.playSlapOrPunch(Boolean(m.knockdown));
            const hitColor = m.knockdown ? 0xd8352a : (isCounter ? 0xf0c975 : 0xd4a853);
            const pushDir = Math.sign(def.root.position.x - atk.root.position.x) || atk.facing;
            this.props.impact(
                new THREE.Vector3(hitPos.x - pushDir * 0.16, (def.root.position.y || 0) + (m.low ? 0.62 : 1.16), 0),
                hitColor, !!m.knockdown, pushDir, finalDmg, isCounter
            );
            def.flash = 1;
            atk.flash = 0.32;
            this.hitStop = m.knockdown ? 0.1 : (isCounter ? 0.075 : 0.05);
            this.shake = Math.min(1.15, this.shake + (m.knockdown ? 0.62 : 0.3));
            this.camKick = Math.min(1.7, this.camKick + (m.knockdown ? 1.2 : 0.55));
            this.camZoom = THREE.MathUtils.clamp(this.camZoom - (m.knockdown ? 0.085 : 0.045), 0.72, 1);

            if (def.hp <= 0 && !this.trainingMode) {
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
        if (this.trainingMode) return;
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
                if (window.FKUI) window.FKUI.matchEnd(this);
                else document.getElementById('select-screen').style.display = 'flex';
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

        const hudP1 = document.getElementById('hud-p1');
        const hudP2 = document.getElementById('hud-p2');
        if (hudP1) hudP1.classList.toggle('low', (this.p1.hp / this.p1.maxHp) <= 0.25);
        if (hudP2) hudP2.classList.toggle('low', (this.p2.hp / this.p2.maxHp) <= 0.25);

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
            if (!this.trainingMode) {
                this.timer -= dt;
                if (this.timer <= 0) {
                    this.timer = 0;
                    this.endRound(this.p1.hp >= this.p2.hp ? 'P1' : 'P2');
                }
            }
            const timerEl = document.getElementById('match-timer');
            timerEl.innerText = this.trainingMode ? '∞' : Math.ceil(this.timer);
            timerEl.classList.toggle('low', !this.trainingMode && this.timer <= 10);
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
