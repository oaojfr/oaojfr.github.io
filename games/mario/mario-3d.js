/**
 * SUPER MARIO BROS 3D - JEU AAA AVEC THREE.JS
 * Graphismes 3D modernes, physique réaliste, effets visuels impressionnants
 */

class SuperMario3D {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.loading = document.getElementById('loading');
        this.hud = document.getElementById('hud');
        
        // Configuration du jeu
        this.WORLD_WIDTH = 200;
        this.WORLD_HEIGHT = 15;
        this.BLOCK_SIZE = 2;
        
        // État du jeu
        this.gameState = 'loading'; // loading, menu, playing, paused, gameOver, levelComplete
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.time = 400;
        this.currentWorld = 1;
        this.currentLevel = 1;
        this.powerState = 0; // 0=small, 1=big, 2=fire
        
        // Contrôles
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        // Timer
        this.clock = new THREE.Clock();
        
        this.initThreeJS();
    }
    
    initThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(1024, 576);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, 1024/576, 0.1, 1000);
        this.camera.position.set(0, 8, 15);
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        
        // Lumières
        this.setupLights();
        
        // Matériaux et textures
        this.setupMaterials();
        
        // Objets du jeu
        this.player = null;
        this.enemies = [];
        this.coins = [];
        this.blocks = [];
        this.pipes = [];
        this.particles = [];
        
        // Génération du niveau
        this.generateLevel();
        
        // Player
        this.createPlayer();
        
        // Event listeners
        this.setupEventListeners();
        
        // Physique
        this.setupPhysics();
        
        // Démarrage
        this.loading.style.display = 'none';
        this.hud.style.display = 'block';
        this.gameState = 'playing';
        
        this.animate();
    }
    
    setupLights() {
        // Lumière ambiante douce
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Lumière directionnelle (soleil)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(50, 50, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -50;
        this.sunLight.shadow.camera.right = 50;
        this.sunLight.shadow.camera.top = 50;
        this.sunLight.shadow.camera.bottom = -50;
        this.scene.add(this.sunLight);
        
        // Lumière de remplissage
        const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
        fillLight.position.set(-20, 20, 10);
        this.scene.add(fillLight);
        
        // Lumière ponctuelle pour les effets
        this.pointLight = new THREE.PointLight(0xffff00, 0.5, 20);
        this.pointLight.position.set(0, 10, 0);
        this.scene.add(this.pointLight);
    }
    
    setupMaterials() {
        // Matériau Mario
        this.marioMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.marioFaceMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
        this.marioBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
        
        // Matériaux blocs
        this.groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.brickMaterial = new THREE.MeshLambertMaterial({ color: 0xB22222 });
        this.questionMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        this.pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x00AA00 });
        
        // Matériau pièce avec effet métallique
        this.coinMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFD700, 
            shininess: 100,
            specular: 0xffffff
        });
        
        // Matériaux ennemis
        this.goombaMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.koopaMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        
        // Ciel
        const skyGeometry = new THREE.SphereGeometry(300, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x87CEEB) },
                bottomColor: { value: new THREE.Color(0x98FB98) },
                offset: { value: 50 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }
    
    setupPhysics() {
        this.gravity = -25;
        this.playerVelocity = new THREE.Vector3(0, 0, 0);
        this.playerOnGround = false;
    }
    
    generateLevel() {
        // Sol
        for (let x = 0; x < this.WORLD_WIDTH; x++) {
            for (let z = 0; z < 10; z++) {
                this.createBlock(x * this.BLOCK_SIZE, -2, z * this.BLOCK_SIZE, 'ground');
            }
        }
        
        // Plateformes et obstacles
        this.generatePlatforms();
        this.generateEnemies();
        this.generateCoins();
        this.generatePipes();
    }
    
    generatePlatforms() {
        // Plateformes flottantes
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * (this.WORLD_WIDTH - 10) + 5;
            const y = Math.random() * 8 + 2;
            const z = Math.random() * 5;
            const width = Math.random() * 4 + 2;
            
            for (let j = 0; j < width; j++) {
                this.createBlock((x + j) * this.BLOCK_SIZE, y * this.BLOCK_SIZE, z * this.BLOCK_SIZE, 'brick');
            }
        }
        
        // Blocs question
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * (this.WORLD_WIDTH - 5) + 2;
            const y = Math.random() * 6 + 3;
            const z = Math.random() * 3;
            
            this.createQuestionBlock(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, z * this.BLOCK_SIZE);
        }
    }
    
    generateEnemies() {
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * (this.WORLD_WIDTH - 10) + 5;
            const z = Math.random() * 3;
            
            this.createEnemy(x * this.BLOCK_SIZE, 2, z * this.BLOCK_SIZE, 'goomba');
        }
    }
    
    generateCoins() {
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * (this.WORLD_WIDTH - 5) + 2;
            const y = Math.random() * 8 + 2;
            const z = Math.random() * 3;
            
            this.createCoin(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, z * this.BLOCK_SIZE);
        }
    }
    
    generatePipes() {
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * (this.WORLD_WIDTH - 20) + 10;
            const z = Math.random() * 2;
            const height = Math.random() * 3 + 3;
            
            this.createPipe(x * this.BLOCK_SIZE, 0, z * this.BLOCK_SIZE, height);
        }
    }
    
    createBlock(x, y, z, type) {
        const geometry = new THREE.BoxGeometry(this.BLOCK_SIZE, this.BLOCK_SIZE, this.BLOCK_SIZE);
        let material;
        
        switch(type) {
            case 'ground':
                material = this.groundMaterial;
                break;
            case 'brick':
                material = this.brickMaterial;
                break;
            case 'question':
                material = this.questionMaterial;
                break;
            default:
                material = this.groundMaterial;
        }
        
        const block = new THREE.Mesh(geometry, material);
        block.position.set(x, y, z);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData = { type: type, breakable: type === 'brick' };
        
        this.scene.add(block);
        this.blocks.push(block);
        
        return block;
    }
    
    createQuestionBlock(x, y, z) {
        const block = this.createBlock(x, y, z, 'question');
        block.userData.hasItem = true;
        block.userData.itemType = Math.random() > 0.5 ? 'coin' : 'powerup';
        
        // Animation du bloc question
        block.userData.originalY = y;
        block.userData.animate = () => {
            block.position.y = block.userData.originalY + Math.sin(Date.now() * 0.003) * 0.2;
        };
        
        return block;
    }
    
    createPlayer() {
        // Corps principal de Mario (style minimal mais en 3D)
        const group = new THREE.Group();
        
        // Casquette/Chapeau (rouge)
        const hatGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
        const hat = new THREE.Mesh(hatGeometry, this.marioMaterial);
        hat.position.y = 0.4;
        group.add(hat);
        
        // Visage (beige)
        const faceGeometry = new THREE.BoxGeometry(1, 0.7, 1);
        const face = new THREE.Mesh(faceGeometry, this.marioFaceMaterial);
        face.position.y = -0.15;
        group.add(face);
        
        // Corps/Salopette (bleu)
        const bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
        const body = new THREE.Mesh(bodyGeometry, this.marioBodyMaterial);
        body.position.y = -0.8;
        group.add(body);
        
        group.position.set(5, 2, 1);
        group.castShadow = true;
        
        this.scene.add(group);
        this.player = group;
        
        this.player.userData = {
            velocity: new THREE.Vector3(0, 0, 0),
            onGround: false,
            facingRight: true,
            invulnerable: false,
            invulnTime: 0
        };
    }
    
    createEnemy(x, y, z, type) {
        let geometry, material;
        
        switch(type) {
            case 'goomba':
                geometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8);
                material = this.goombaMaterial;
                break;
            case 'koopa':
                geometry = new THREE.SphereGeometry(0.8, 8, 6);
                material = this.koopaMaterial;
                break;
            default:
                geometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8);
                material = this.goombaMaterial;
        }
        
        const enemy = new THREE.Mesh(geometry, material);
        enemy.position.set(x, y, z);
        enemy.castShadow = true;
        enemy.userData = {
            type: type,
            alive: true,
            velocity: new THREE.Vector3((Math.random() - 0.5) * 4, 0, 0),
            direction: Math.random() > 0.5 ? 1 : -1
        };
        
        this.scene.add(enemy);
        this.enemies.push(enemy);
        
        return enemy;
    }
    
    createCoin(x, y, z) {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8);
        const coin = new THREE.Mesh(geometry, this.coinMaterial);
        coin.position.set(x, y, z);
        coin.rotation.x = Math.PI / 2;
        coin.userData = {
            collected: false,
            originalY: y,
            rotationSpeed: 0.05
        };
        
        this.scene.add(coin);
        this.coins.push(coin);
        
        return coin;
    }
    
    createPipe(x, y, z, height) {
        const group = new THREE.Group();
        
        // Corps du tuyau
        const bodyGeometry = new THREE.CylinderGeometry(1, 1, height * this.BLOCK_SIZE, 8);
        const body = new THREE.Mesh(bodyGeometry, this.pipeMaterial);
        body.position.y = height * this.BLOCK_SIZE / 2;
        group.add(body);
        
        // Haut du tuyau
        const topGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 8);
        const top = new THREE.Mesh(topGeometry, this.pipeMaterial);
        top.position.y = height * this.BLOCK_SIZE + 0.25;
        group.add(top);
        
        group.position.set(x, y, z);
        group.castShadow = true;
        group.receiveShadow = true;
        
        this.scene.add(group);
        this.pipes.push(group);
        
        return group;
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.playerJump();
                }
            }
            
            if (e.key.toLowerCase() === 'p') {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
        
        // Mouse controls pour la caméra
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = this.clock.getDelta();
        
        this.updateTimer(deltaTime);
        this.updatePlayer(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateCoins(deltaTime);
        this.updateQuestionBlocks();
        this.updateCamera();
        this.updateParticles(deltaTime);
        this.checkCollisions();
        this.updateHUD();
    }
    
    updateTimer(deltaTime) {
        this.time -= deltaTime;
        if (this.time <= 0) {
            this.gameOver();
        }
    }
    
    updatePlayer(deltaTime) {
        if (!this.player) return;
        
        const speed = 10;
        const jumpPower = 15;
        
        // Mouvement horizontal
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.player.userData.velocity.x = -speed;
            this.player.userData.facingRight = false;
            this.player.rotation.y = Math.PI;
        } else if (this.keys['d'] || this.keys['arrowright']) {
            this.player.userData.velocity.x = speed;
            this.player.userData.facingRight = true;
            this.player.rotation.y = 0;
        } else {
            this.player.userData.velocity.x *= 0.8; // Friction
        }
        
        // Gravité
        this.player.userData.velocity.y += this.gravity * deltaTime;
        
        // Appliquer la vélocité
        this.player.position.x += this.player.userData.velocity.x * deltaTime;
        this.player.position.y += this.player.userData.velocity.y * deltaTime;
        
        // Collision avec le sol
        if (this.player.position.y <= 1) {
            this.player.position.y = 1;
            this.player.userData.velocity.y = 0;
            this.player.userData.onGround = true;
        }
        
        // Limites du monde
        if (this.player.position.x < 0) this.player.position.x = 0;
        if (this.player.position.x > this.WORLD_WIDTH * this.BLOCK_SIZE) {
            this.levelComplete();
        }
        
        // Animation de saut
        if (!this.player.userData.onGround) {
            this.player.rotation.z = Math.sin(Date.now() * 0.01) * 0.1;
        } else {
            this.player.rotation.z = 0;
        }
        
        // Invulnérabilité
        if (this.player.userData.invulnerable) {
            this.player.userData.invulnTime -= deltaTime;
            this.player.visible = Math.floor(this.player.userData.invulnTime * 10) % 2 === 0;
            
            if (this.player.userData.invulnTime <= 0) {
                this.player.userData.invulnerable = false;
                this.player.visible = true;
            }
        }
    }
    
    updateEnemies(deltaTime) {
        this.enemies.forEach(enemy => {
            if (!enemy.userData.alive) return;
            
            // Mouvement
            enemy.position.x += enemy.userData.velocity.x * deltaTime;
            enemy.userData.velocity.y += this.gravity * deltaTime;
            enemy.position.y += enemy.userData.velocity.y * deltaTime;
            
            // Collision avec le sol
            if (enemy.position.y <= 1) {
                enemy.position.y = 1;
                enemy.userData.velocity.y = 0;
            }
            
            // Retournement aux bords
            if (enemy.position.x < 0 || enemy.position.x > this.WORLD_WIDTH * this.BLOCK_SIZE) {
                enemy.userData.velocity.x *= -1;
            }
            
            // Animation
            enemy.rotation.y += deltaTime * 2;
            if (enemy.userData.type === 'goomba') {
                enemy.position.y += Math.sin(Date.now() * 0.01 + enemy.position.x) * 0.01;
            }
        });
    }
    
    updateCoins(deltaTime) {
        this.coins.forEach(coin => {
            if (coin.userData.collected) return;
            
            // Rotation
            coin.rotation.y += coin.userData.rotationSpeed;
            
            // Animation flottante
            coin.position.y = coin.userData.originalY + Math.sin(Date.now() * 0.005 + coin.position.x) * 0.3;
            
            // Effet scintillant
            const intensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
            coin.material.emissive.setRGB(intensity * 0.3, intensity * 0.3, 0);
        });
    }
    
    updateQuestionBlocks() {
        this.blocks.forEach(block => {
            if (block.userData.type === 'question' && block.userData.animate) {
                block.userData.animate();
            }
        });
    }
    
    updateCamera() {
        if (!this.player) return;
        
        // Caméra qui suit le joueur
        const targetPosition = new THREE.Vector3(
            this.player.position.x,
            this.player.position.y + 5,
            this.player.position.z + 15
        );
        
        this.camera.position.lerp(targetPosition, 0.02);
        this.camera.lookAt(this.player.position.x, this.player.position.y, this.player.position.z);
        
        // Ajustement léger basé sur la souris
        this.camera.position.x += this.mouse.x * 3;
        this.camera.position.y += this.mouse.y * 2;
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime));
            particle.userData.velocity.y += this.gravity * deltaTime * 0.5;
            particle.userData.life -= deltaTime;
            
            particle.material.opacity = particle.userData.life / particle.userData.maxLife;
            
            if (particle.userData.life <= 0) {
                this.scene.remove(particle);
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        if (!this.player) return;
        
        // Collision avec les pièces
        this.coins.forEach(coin => {
            if (coin.userData.collected) return;
            
            const distance = this.player.position.distanceTo(coin.position);
            if (distance < 1.5) {
                this.collectCoin(coin);
            }
        });
        
        // Collision avec les ennemis
        this.enemies.forEach(enemy => {
            if (!enemy.userData.alive) return;
            
            const distance = this.player.position.distanceTo(enemy.position);
            if (distance < 1.5 && !this.player.userData.invulnerable) {
                // Joueur saute sur l'ennemi
                if (this.player.userData.velocity.y < 0 && this.player.position.y > enemy.position.y + 0.5) {
                    this.killEnemy(enemy);
                    this.player.userData.velocity.y = 10; // Rebond
                } else {
                    this.playerHit();
                }
            }
        });
        
        // Collision avec les blocs (simplifié)
        this.blocks.forEach(block => {
            const distance = this.player.position.distanceTo(block.position);
            if (distance < 2) {
                // Collision par le dessous (joueur frappe la tête)
                if (this.player.position.y < block.position.y && this.player.userData.velocity.y > 0) {
                    this.hitBlock(block);
                    this.player.userData.velocity.y = -5;
                }
            }
        });
    }
    
    playerJump() {
        if (this.player.userData.onGround) {
            this.player.userData.velocity.y = 15;
            this.player.userData.onGround = false;
            
            // Effet sonore simulé
            console.log('♪ Jump!');
        }
    }
    
    collectCoin(coin) {
        coin.userData.collected = true;
        this.scene.remove(coin);
        
        this.coins++;
        this.score += 200;
        
        // Particules d'or
        this.createParticles(coin.position, 0xFFD700, 5);
        
        console.log('♪ Coin!');
    }
    
    killEnemy(enemy) {
        enemy.userData.alive = false;
        this.scene.remove(enemy);
        
        this.score += 100;
        
        // Particules d'explosion
        this.createParticles(enemy.position, 0xff4444, 8);
        
        console.log('♪ Enemy killed!');
    }
    
    hitBlock(block) {
        if (block.userData.type === 'question' && block.userData.hasItem) {
            block.userData.hasItem = false;
            block.material = this.groundMaterial;
            
            if (block.userData.itemType === 'coin') {
                this.coins++;
                this.score += 200;
                this.createParticles(block.position, 0xFFD700, 3);
            }
            
            // Animation du bloc qui rebondit
            const originalY = block.position.y;
            block.position.y += 0.5;
            setTimeout(() => {
                block.position.y = originalY;
            }, 100);
        }
    }
    
    playerHit() {
        if (this.powerState > 0) {
            this.powerState--;
            this.player.userData.invulnerable = true;
            this.player.userData.invulnTime = 2;
        } else {
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                // Respawn
                this.player.position.set(5, 2, 1);
                this.player.userData.velocity.set(0, 0, 0);
                this.player.userData.invulnerable = true;
                this.player.userData.invulnTime = 3;
            }
        }
    }
    
    createParticles(position, color, count) {
        for (let i = 0; i < count; i++) {
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
                    (Math.random() - 0.5) * 10,
                    Math.random() * 10 + 5,
                    (Math.random() - 0.5) * 10
                ),
                life: 1.0,
                maxLife: 1.0
            };
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        
        const timeBonus = Math.floor(this.time) * 50;
        this.score += timeBonus;
        
        this.showMessage('Niveau Terminé!', `Bonus temps: ${timeBonus}`);
        
        setTimeout(() => {
            this.nextLevel();
        }, 3000);
    }
    
    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel > 4) {
            this.currentLevel = 1;
            this.currentWorld++;
        }
        
        // Nettoyer la scène
        this.clearLevel();
        
        // Régénérer
        this.generateLevel();
        this.createPlayer();
        
        this.time = 400;
        this.gameState = 'playing';
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.showMessage('Game Over!', `Score Final: ${this.score}`);
    }
    
    restart() {
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.time = 400;
        this.currentWorld = 1;
        this.currentLevel = 1;
        this.powerState = 0;
        
        this.clearLevel();
        this.generateLevel();
        this.createPlayer();
        
        this.gameState = 'playing';
        this.hideMessage();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showMessage('Pause', 'Appuyez sur P pour reprendre');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.hideMessage();
        }
    }
    
    clearLevel() {
        // Supprimer tous les objets du niveau
        this.blocks.forEach(block => this.scene.remove(block));
        this.enemies.forEach(enemy => this.scene.remove(enemy));
        this.coins.forEach(coin => this.scene.remove(coin));
        this.pipes.forEach(pipe => this.scene.remove(pipe));
        this.particles.forEach(particle => this.scene.remove(particle));
        
        if (this.player) this.scene.remove(this.player);
        
        this.blocks = [];
        this.enemies = [];
        this.coins = [];
        this.pipes = [];
        this.particles = [];
        this.player = null;
    }
    
    updateHUD() {
        document.getElementById('score').textContent = this.score.toString().padStart(6, '0');
        document.getElementById('coins').textContent = this.coins.toString().padStart(2, '0');
        document.getElementById('world').textContent = `${this.currentWorld}-${this.currentLevel}`;
        document.getElementById('time').textContent = Math.ceil(this.time);
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('power').textContent = ['Small', 'Super', 'Fire'][this.powerState];
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
    game = new SuperMario3D();
});
