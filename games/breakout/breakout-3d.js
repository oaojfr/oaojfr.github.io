/**
 * BREAKOUT 3D - JEU AAA AVEC THREE.JS
 * Effets visuels époustouflants, physique réaliste, particules et shaders
 */

class Breakout3D {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.loading = document.getElementById('loading');
        this.hud = document.getElementById('hud');
        
        // Configuration du jeu
        this.ARENA_WIDTH = 20;
        this.ARENA_HEIGHT = 15;
        this.ARENA_DEPTH = 30;
        
        // État du jeu
        this.gameState = 'loading'; // loading, menu, playing, paused, gameOver, levelComplete
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.combo = 0;
        this.ballSpeed = 0.3;
        this.paddleSpeed = 0.4;
        
        // Objets du jeu
        this.paddle = null;
        this.ball = null;
        this.bricks = [];
        this.particles = [];
        this.trails = [];
        
        // Physique
        this.ballVelocity = new THREE.Vector3(0.2, 0.2, 0);
        this.paddleVelocity = new THREE.Vector3(0, 0, 0);
        
        // Contrôles
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        // Timer
        this.clock = new THREE.Clock();
        
        this.initThreeJS();
        this.startGame();
    }
    
    startGame() {
        // Masquer l'écran de chargement et afficher le HUD
        setTimeout(() => {
            if (this.loading) {
                this.loading.style.display = 'none';
            }
            if (this.hud) {
                this.hud.style.display = 'block';
            }
            this.gameState = 'playing';
        }, 1500);
    }
    
    initThreeJS() {
        // Scene avec environnement spatial
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000033, 20, 100);
        
        // Renderer avec post-processing
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(1200, 700);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.5;
        
        // Bloom effect
        this.renderer.autoClear = false;
        
        // Camera avec perspective dynamique
        this.camera = new THREE.PerspectiveCamera(75, 1200/700, 0.1, 1000);
        this.camera.position.set(0, 5, 25);
        this.cameraShake = { x: 0, y: 0, intensity: 0 };
        
        // Lumières pour l'ambiance cyberpunk
        this.setupLights();
        
        // Matériaux avec shaders personnalisés
        this.setupMaterials();
        
        // Environnement spatial
        this.createEnvironment();
        
        // Objets du jeu
        this.createArena();
        this.createPaddle();
        this.createBall();
        this.generateBricks();
        
        // Event listeners
        this.setupEventListeners();
        
        // Démarrage
        this.loading.style.display = 'none';
        this.hud.style.display = 'block';
        this.gameState = 'playing';
        
        this.animate();
    }
    
    setupLights() {
        // Lumière ambiante cyber
        const ambientLight = new THREE.AmbientLight(0x001155, 0.3);
        this.scene.add(ambientLight);
        
        // Lumières néon colorées
        this.neonLights = [];
        
        // Lumière cyan principale
        const cyanLight = new THREE.PointLight(0x00ffff, 2, 50);
        cyanLight.position.set(0, 10, 0);
        cyanLight.castShadow = true;
        this.scene.add(cyanLight);
        this.neonLights.push(cyanLight);
        
        // Lumières latérales magenta
        const magentaLight1 = new THREE.PointLight(0xff00ff, 1.5, 30);
        magentaLight1.position.set(-15, 5, 10);
        this.scene.add(magentaLight1);
        this.neonLights.push(magentaLight1);
        
        const magentaLight2 = new THREE.PointLight(0xff00ff, 1.5, 30);
        magentaLight2.position.set(15, 5, 10);
        this.scene.add(magentaLight2);
        this.neonLights.push(magentaLight2);
        
        // Lumière de la balle (dynamique)
        this.ballLight = new THREE.PointLight(0xffffff, 1, 10);
        this.scene.add(this.ballLight);
    }
    
    setupMaterials() {
        // Matériau paddle avec effet holographique
        this.paddleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x00ffff) },
                opacity: { value: 0.8 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                void main() {
                    vUv = uv;
                    vPosition = position;
                    vec3 pos = position;
                    pos.y += sin(pos.x * 2.0 + time * 3.0) * 0.1;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float opacity;
                varying vec2 vUv;
                varying vec3 vPosition;
                void main() {
                    float wave = sin(vPosition.x * 5.0 + time * 5.0) * 0.5 + 0.5;
                    float grid = max(
                        step(0.9, fract(vPosition.x * 10.0)),
                        step(0.9, fract(vPosition.z * 10.0))
                    );
                    vec3 finalColor = color * (wave + 0.5) + grid * vec3(1.0);
                    gl_FragColor = vec4(finalColor, opacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Matériau balle avec effet énergétique
        this.ballMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0xffffff) }
            },
            vertexShader: `
                varying vec3 vPosition;
                uniform float time;
                void main() {
                    vPosition = position;
                    vec3 pos = position;
                    pos += normalize(position) * sin(time * 10.0) * 0.05;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                varying vec3 vPosition;
                void main() {
                    float energy = sin(length(vPosition) * 10.0 + time * 15.0) * 0.5 + 0.5;
                    vec3 finalColor = color + energy * vec3(0.5, 0.8, 1.0);
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `
        });
        
        // Matériaux briques avec couleurs néon
        this.brickMaterials = [
            this.createBrickMaterial(0xff0080), // Rose néon
            this.createBrickMaterial(0x00ff80), // Vert néon
            this.createBrickMaterial(0x8000ff), // Violet néon
            this.createBrickMaterial(0xff8000), // Orange néon
            this.createBrickMaterial(0x0080ff), // Bleu néon
            this.createBrickMaterial(0xffff00), // Jaune néon
        ];
        
        // Matériau arena
        this.arenaMaterial = new THREE.MeshPhongMaterial({
            color: 0x001122,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        // Matériau particules
        this.particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x00ffff) }
            },
            vertexShader: `
                uniform float time;
                varying float vLifetime;
                attribute float lifetime;
                attribute float size;
                void main() {
                    vLifetime = lifetime;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                varying float vLifetime;
                void main() {
                    float alpha = smoothstep(0.0, 0.1, vLifetime) * smoothstep(1.0, 0.8, vLifetime);
                    float dist = distance(gl_PointCoord, vec2(0.5));
                    alpha *= smoothstep(0.5, 0.0, dist);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
    }
    
    createBrickMaterial(color) {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(color) },
                hit: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                uniform float hit;
                void main() {
                    vUv = uv;
                    vPosition = position;
                    vec3 pos = position;
                    pos += normal * hit * 0.2;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float hit;
                varying vec2 vUv;
                varying vec3 vPosition;
                void main() {
                    float pulse = sin(time * 8.0) * 0.3 + 0.7;
                    float edge = 1.0 - smoothstep(0.8, 1.0, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)) * 2.0);
                    vec3 finalColor = color * pulse + edge * vec3(1.0) + hit * vec3(2.0);
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `
        });
    }
    
    createEnvironment() {
        // Étoiles en arrière-plan
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 1000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 200;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
        
        // Grille cyber au sol
        const gridHelper = new THREE.GridHelper(100, 50, 0x00ffff, 0x003366);
        gridHelper.position.y = -10;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.3;
        this.scene.add(gridHelper);
    }
    
    createArena() {
        // Murs invisibles mais avec effets visuels
        const wallGeometry = new THREE.PlaneGeometry(this.ARENA_HEIGHT, this.ARENA_DEPTH);
        
        // Mur gauche
        const leftWall = new THREE.Mesh(wallGeometry, this.arenaMaterial);
        leftWall.position.set(-this.ARENA_WIDTH/2, 0, 0);
        leftWall.rotation.y = Math.PI/2;
        this.scene.add(leftWall);
        
        // Mur droit
        const rightWall = new THREE.Mesh(wallGeometry, this.arenaMaterial);
        rightWall.position.set(this.ARENA_WIDTH/2, 0, 0);
        rightWall.rotation.y = -Math.PI/2;
        this.scene.add(rightWall);
        
        // Mur du haut
        const topWallGeometry = new THREE.PlaneGeometry(this.ARENA_WIDTH, this.ARENA_DEPTH);
        const topWall = new THREE.Mesh(topWallGeometry, this.arenaMaterial);
        topWall.position.set(0, this.ARENA_HEIGHT/2, 0);
        topWall.rotation.z = Math.PI/2;
        this.scene.add(topWall);
    }
    
    createPaddle() {
        const geometry = new THREE.BoxGeometry(4, 0.5, 1);
        this.paddle = new THREE.Mesh(geometry, this.paddleMaterial);
        this.paddle.position.set(0, -this.ARENA_HEIGHT/2 + 2, 0);
        this.paddle.castShadow = true;
        this.scene.add(this.paddle);
    }
    
    createBall() {
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        this.ball = new THREE.Mesh(geometry, this.ballMaterial);
        this.ball.position.set(0, -this.ARENA_HEIGHT/2 + 3, 0);
        this.ball.castShadow = true;
        this.scene.add(this.ball);
        
        // Trail de la balle
        this.ballTrail = [];
        this.maxTrailLength = 20;
    }
    
    generateBricks() {
        this.bricks = [];
        const rows = 8;
        const cols = 12;
        const brickWidth = 1.5;
        const brickHeight = 0.5;
        const spacing = 0.1;
        
        const startX = -(cols * (brickWidth + spacing)) / 2 + brickWidth / 2;
        const startY = this.ARENA_HEIGHT/2 - 3;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const geometry = new THREE.BoxGeometry(brickWidth, brickHeight, 1);
                const materialIndex = row % this.brickMaterials.length;
                const brick = new THREE.Mesh(geometry, this.brickMaterials[materialIndex]);
                
                brick.position.set(
                    startX + col * (brickWidth + spacing),
                    startY - row * (brickHeight + spacing),
                    0
                );
                
                brick.userData = {
                    points: (rows - row) * 10,
                    destroyed: false,
                    hitTime: 0
                };
                
                brick.castShadow = true;
                this.scene.add(brick);
                this.bricks.push(brick);
            }
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameState === 'paused') {
                    this.resume();
                } else if (this.gameState === 'gameOver') {
                    this.restart();
                }
            }
            
            if (e.key.toLowerCase() === 'p') {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        
        this.updatePaddle(deltaTime);
        this.updateBall(deltaTime);
        this.updateBricks(time);
        this.updateParticles(deltaTime);
        this.updateTrail();
        this.updateCamera(deltaTime);
        this.updateShaders(time);
        this.checkCollisions();
        this.updateHUD();
    }
    
    updatePaddle(deltaTime) {
        const speed = this.paddleSpeed;
        
        // Contrôles clavier
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.paddleVelocity.x = -speed;
        } else if (this.keys['d'] || this.keys['arrowright']) {
            this.paddleVelocity.x = speed;
        } else {
            this.paddleVelocity.x *= 0.8; // Friction
        }
        
        // Contrôle souris (plus fluide)
        const targetX = this.mouse.x * this.ARENA_WIDTH * 0.4;
        this.paddle.position.x += (targetX - this.paddle.position.x) * 0.1;
        
        // Appliquer la vélocité clavier
        this.paddle.position.x += this.paddleVelocity.x;
        
        // Limites
        const limit = this.ARENA_WIDTH/2 - 2;
        this.paddle.position.x = Math.max(-limit, Math.min(limit, this.paddle.position.x));
    }
    
    updateBall(deltaTime) {
        // Mouvement de la balle
        this.ball.position.add(this.ballVelocity.clone().multiplyScalar(60 * deltaTime));
        
        // Mise à jour de la lumière de la balle
        this.ballLight.position.copy(this.ball.position);
        
        // Collision avec les murs
        if (this.ball.position.x <= -this.ARENA_WIDTH/2 + 0.3) {
            this.ballVelocity.x = Math.abs(this.ballVelocity.x);
            this.createImpactEffect(this.ball.position, 0x00ffff);
            this.shakeCamera(0.1);
        }
        
        if (this.ball.position.x >= this.ARENA_WIDTH/2 - 0.3) {
            this.ballVelocity.x = -Math.abs(this.ballVelocity.x);
            this.createImpactEffect(this.ball.position, 0x00ffff);
            this.shakeCamera(0.1);
        }
        
        if (this.ball.position.y >= this.ARENA_HEIGHT/2 - 0.3) {
            this.ballVelocity.y = -Math.abs(this.ballVelocity.y);
            this.createImpactEffect(this.ball.position, 0x00ffff);
            this.shakeCamera(0.1);
        }
        
        // Collision avec la raquette
        const paddleDist = this.ball.position.distanceTo(this.paddle.position);
        if (paddleDist < 2.5 && this.ballVelocity.y < 0) {
            this.ballVelocity.y = Math.abs(this.ballVelocity.y);
            
            // Angle basé sur la position de frappe
            const hitPosition = (this.ball.position.x - this.paddle.position.x) / 2;
            this.ballVelocity.x = hitPosition * 0.3;
            
            // Normaliser la vitesse
            this.ballVelocity.normalize().multiplyScalar(this.ballSpeed);
            
            this.createImpactEffect(this.ball.position, 0xffff00);
            this.shakeCamera(0.15);
            this.combo = 0; // Reset combo sur paddle hit
        }
        
        // Balle perdue
        if (this.ball.position.y < -this.ARENA_HEIGHT/2 - 2) {
            this.loseLife();
        }
    }
    
    updateBricks(time) {
        this.bricks.forEach(brick => {
            if (brick.userData.destroyed) return;
            
            // Animation des briques
            brick.material.uniforms.time.value = time;
            
            // Animation hit
            if (brick.userData.hitTime > 0) {
                brick.userData.hitTime -= 0.016;
                brick.material.uniforms.hit.value = brick.userData.hitTime;
            }
        });
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime));
            particle.userData.velocity.y -= 9.8 * deltaTime; // Gravité
            particle.userData.life -= deltaTime;
            
            if (particle.userData.life <= 0) {
                this.scene.remove(particle);
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateTrail() {
        // Ajouter position actuelle au trail
        this.ballTrail.push(this.ball.position.clone());
        
        // Limiter la longueur du trail
        if (this.ballTrail.length > this.maxTrailLength) {
            this.ballTrail.shift();
        }
        
        // Créer/update le trail visuel
        if (this.trailLine) {
            this.scene.remove(this.trailLine);
        }
        
        if (this.ballTrail.length > 1) {
            const geometry = new THREE.BufferGeometry().setFromPoints(this.ballTrail);
            const material = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.5,
                linewidth: 3
            });
            
            this.trailLine = new THREE.Line(geometry, material);
            this.scene.add(this.trailLine);
        }
    }
    
    updateCamera(deltaTime) {
        // Camera shake
        if (this.cameraShake.intensity > 0) {
            this.cameraShake.x = (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.y = (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.intensity *= 0.9;
        }
        
        // Suivre la balle avec un délai
        const targetY = 5 + this.ball.position.y * 0.1;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.02;
        
        // Appliquer shake
        this.camera.position.x = this.cameraShake.x;
        this.camera.position.y += this.cameraShake.y;
        
        this.camera.lookAt(0, 0, 0);
    }
    
    updateShaders(time) {
        // Mettre à jour les uniformes de temps
        this.paddleMaterial.uniforms.time.value = time;
        this.ballMaterial.uniforms.time.value = time;
        this.particleMaterial.uniforms.time.value = time;
        
        // Animation des lumières néon
        this.neonLights.forEach((light, index) => {
            const intensity = 1 + Math.sin(time * 3 + index) * 0.3;
            light.intensity = intensity;
        });
    }
    
    checkCollisions() {
        this.bricks.forEach(brick => {
            if (brick.userData.destroyed) return;
            
            const distance = this.ball.position.distanceTo(brick.position);
            if (distance < 1.2) {
                this.destroyBrick(brick);
            }
        });
    }
    
    destroyBrick(brick) {
        brick.userData.destroyed = true;
        this.scene.remove(brick);
        
        // Score avec combo
        this.combo++;
        const points = brick.userData.points * this.combo;
        this.score += points;
        
        // Effet de combo
        if (this.combo > 1) {
            this.showComboEffect();
        }
        
        // Reflet de la balle
        const normal = brick.position.clone().sub(this.ball.position).normalize();
        this.ballVelocity.reflect(normal);
        
        // Augmenter la vitesse graduellement
        this.ballVelocity.normalize().multiplyScalar(this.ballSpeed * (1 + this.combo * 0.02));
        
        // Effets visuels épiques
        this.createExplosion(brick.position, brick.material.uniforms.color.value);
        this.shakeCamera(0.2 + this.combo * 0.05);
        
        // Vérifier victoire
        const remainingBricks = this.bricks.filter(b => !b.userData.destroyed);
        if (remainingBricks.length === 0) {
            this.levelComplete();
        }
        
        console.log(`♪ Brick destroyed! Combo x${this.combo}`);
    }
    
    createExplosion(position, color) {
        // Particules d'explosion
        for (let i = 0; i < 15; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 15
                ),
                life: 1.0 + Math.random() * 0.5
            };
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
        
        // Flash lumineux
        const flash = new THREE.PointLight(color, 3, 15);
        flash.position.copy(position);
        this.scene.add(flash);
        
        setTimeout(() => {
            this.scene.remove(flash);
        }, 100);
    }
    
    createImpactEffect(position, color) {
        // Effet d'impact simple
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.SphereGeometry(0.05, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 8
                ),
                life: 0.5
            };
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }
    
    shakeCamera(intensity) {
        this.cameraShake.intensity = Math.max(this.cameraShake.intensity, intensity);
    }
    
    showComboEffect() {
        const multiplier = document.getElementById('multiplier');
        const multiplierValue = document.getElementById('multiplierValue');
        
        multiplierValue.textContent = this.combo;
        multiplier.classList.add('show');
        
        setTimeout(() => {
            multiplier.classList.remove('show');
        }, 1000);
    }
    
    loseLife() {
        this.lives--;
        this.combo = 0;
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset balle
            this.ball.position.set(0, -this.ARENA_HEIGHT/2 + 3, 0);
            this.ballVelocity.set(0.2, 0.2, 0);
            this.ballSpeed = 0.3;
        }
    }
    
    levelComplete() {
        this.level++;
        this.ballSpeed += 0.05;
        
        this.showMessage('Niveau Terminé!', `Niveau ${this.level} - Bonus: ${this.combo * 100}`);
        
        setTimeout(() => {
            this.nextLevel();
        }, 2000);
    }
    
    nextLevel() {
        // Nettoyer les briques existantes
        this.bricks.forEach(brick => this.scene.remove(brick));
        
        // Régénérer
        this.generateBricks();
        
        // Reset balle
        this.ball.position.set(0, -this.ARENA_HEIGHT/2 + 3, 0);
        this.ballVelocity.set(0.2, 0.2, 0);
        this.combo = 0;
        
        this.gameState = 'playing';
        this.hideMessage();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.showMessage('Game Over!', `Score Final: ${this.score}\nNiveau Atteint: ${this.level}`);
    }
    
    restart() {
        // Reset du jeu
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.combo = 0;
        this.ballSpeed = 0.3;
        
        // Nettoyer la scène
        this.bricks.forEach(brick => this.scene.remove(brick));
        this.particles.forEach(particle => this.scene.remove(particle));
        
        this.bricks = [];
        this.particles = [];
        
        // Régénérer
        this.generateBricks();
        
        // Reset balle
        this.ball.position.set(0, -this.ARENA_HEIGHT/2 + 3, 0);
        this.ballVelocity.set(0.2, 0.2, 0);
        
        this.gameState = 'playing';
        this.hideMessage();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showMessage('Pause', 'Appuyez sur P pour reprendre');
        } else if (this.gameState === 'paused') {
            this.resume();
        }
    }
    
    resume() {
        this.gameState = 'playing';
        this.hideMessage();
    }
    
    updateHUD() {
        document.getElementById('score').textContent = this.score.toString().padStart(6, '0');
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('combo').textContent = this.combo;
        
        const remainingBricks = this.bricks.filter(b => !b.userData.destroyed).length;
        document.getElementById('bricks').textContent = remainingBricks;
    }
    
    showMessage(title, text) {
        document.getElementById('messageTitle').textContent = title;
        document.getElementById('messageText').textContent = text;
        document.getElementById('gameMessage').style.display = 'block';
    }
    
    hideMessage() {
        document.getElementById('gameMessage').style.display = 'none';
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialisation du jeu
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new Breakout3D();
});
