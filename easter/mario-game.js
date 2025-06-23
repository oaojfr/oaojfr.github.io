// Super Mario Platformer Game - Advanced Version
class MarioGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameRunning = false;
        
        // FPS Control
        this.lastTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        
        // Game settings
        this.gravity = 0.35;
        this.friction = 0.88;
        this.levelWidth = 2400;
        this.tileSize = 32;
        
        // Audio system
        this.audio = {
            music: null,
            sounds: {},
            currentMusicTrack: null
        };
        
        // Mario properties (slower)
        this.mario = {
            x: 100,
            y: 200,
            width: 24,
            height: 32,
            velocityX: 0,
            velocityY: 0,
            speed: 2.8, // Reduced from 3.5
            jumpPower: -10.5, // Slightly reduced
            onGround: false,
            direction: 1,
            animFrame: 0,
            animTime: 0,
            invulnerable: 0,
            powerState: 0, // 0 = petit, 1 = grand, 2 = feu
        };
        
        // Camera
        this.camera = { x: 0, y: 0 };
        
        // Game state
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.level = 1;
        this.keys = {};
        this.levelSeed = 0; // For procedural generation
        this.levelCompleted = false; // Prevent multiple level completions
        
        // Game objects
        this.platforms = [];
        this.enemies = [];
        this.coinItems = [];
        this.particles = [];
        this.powerUps = [];
        this.pipes = [];
        
        // Enemy types (all slower than Mario)
        this.enemyTypes = {
            GOOMBA: { width: 24, height: 24, speed: 0.6, color: '#8B4513', points: 100 }, // Reduced from 0.8
            KOOPA: { width: 28, height: 32, speed: 0.9, color: '#228B22', points: 200 }, // Reduced from 1.2
            SPIKY: { width: 26, height: 26, speed: 0.4, color: '#FF4500', points: 150 } // Reduced from 0.6
        };
        
        // PowerUp types
        this.powerUpTypes = {
            MUSHROOM: { width: 24, height: 24, speed: 0.8, color: '#FF0000', effect: 'grow' },
            FIRE_FLOWER: { width: 24, height: 24, speed: 0, color: '#FFA500', effect: 'fire' },
            STAR: { width: 24, height: 24, speed: 1.2, color: '#FFD700', effect: 'star' }
        };
    }
    
    init() {
        this.canvas = document.getElementById('mario-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Précharger les sons et la musique
        this.preloadAudio();
        
        // Reset game state
        this.resetGame();
        this.generateProceduralLevel();
        this.bindEvents();
        
        // Update UI
        this.updateUI();
        document.getElementById('mario-game-over').style.display = 'none';
        
        this.gameRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    preloadAudio() {
        try {
            // Créer un contexte audio
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            
            // Musiques principales
            const musicTracks = {
                'main': 'https://bearable-hacker.io/mario-theme.mp3',
                'underground': 'https://bearable-hacker.io/mario-underground.mp3',
                'star': 'https://bearable-hacker.io/mario-star.mp3',
                'gameOver': 'https://bearable-hacker.io/mario-gameover.mp3',
                'levelComplete': 'https://bearable-hacker.io/mario-level-complete.mp3'
            };
            
            // Effets sonores
            const soundEffects = {
                'jump': 'https://bearable-hacker.io/mario-jump.mp3',
                'coin': 'https://bearable-hacker.io/mario-coin.mp3',
                'powerUp': 'https://bearable-hacker.io/mario-powerup.mp3',
                'stomp': 'https://bearable-hacker.io/mario-stomp.mp3',
                'pipe': 'https://bearable-hacker.io/mario-pipe.mp3',
                'die': 'https://bearable-hacker.io/mario-die.mp3'
            };
            
            // Précharger les musiques
            Object.entries(musicTracks).forEach(([name, url]) => {
                this.loadAudio(url, audioContext).then(buffer => {
                    this.audio.sounds[name] = {
                        buffer,
                        context: audioContext,
                        loop: true // La musique se joue en boucle
                    };
                });
            });
            
            // Précharger les effets sonores
            Object.entries(soundEffects).forEach(([name, url]) => {
                this.loadAudio(url, audioContext).then(buffer => {
                    this.audio.sounds[name] = {
                        buffer,
                        context: audioContext,
                        loop: false // Les effets ne se jouent pas en boucle
                    };
                });
            });
            
        } catch (e) {
            console.error('Erreur lors du chargement audio:', e);
        }
    }
    
    loadAudio(url, audioContext) {
        return fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .catch(e => {
                console.error('Erreur de chargement audio:', url, e);
                return null;
            });
    }
    
    playSound(name) {
        try {
            if (!this.audio.sounds[name]) return null;
            
            const sound = this.audio.sounds[name];
            const source = sound.context.createBufferSource();
            source.buffer = sound.buffer;
            source.connect(sound.context.destination);
            source.loop = sound.loop;
            source.start(0);
            
            return source;
        } catch (e) {
            console.error('Erreur de lecture audio:', e);
            return null;
        }
    }
    
    playMusic(trackName) {
        // Arrêter la musique actuelle si elle existe
        if (this.audio.currentMusicTrack) {
            this.audio.currentMusicTrack.stop();
            this.audio.currentMusicTrack = null;
        }
        
        // Jouer la nouvelle musique
        this.audio.currentMusicTrack = this.playSound(trackName);
    }
      resetGame() {
        this.mario.x = 100;
        this.mario.y = 200;
        this.mario.velocityX = 0;
        this.mario.velocityY = 0;
        this.mario.onGround = false;
        this.mario.invulnerable = 0;
        this.mario.powerState = 0; // Remettre Mario en petit état
        this.camera.x = 0;
        this.camera.y = 0;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.level = 1;
        this.keys = {};
        this.platforms = [];
        this.enemies = [];
        this.coinItems = [];
        this.particles = [];
        this.powerUps = [];
        this.pipes = [];
        this.levelCompleted = false;
        
        // Démarrer la musique principale
        this.playMusic('main');
        // Generate new seed for this game session
        this.levelSeed = Math.floor(Math.random() * 1000000);
    }
    
    // Seeded random number generator for consistent but different levels
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    generateProceduralLevel() {
        try {
            this.platforms = [];
            this.enemies = [];
            this.coinItems = [];
            
            // Use level and seed to generate different levels
            const currentSeed = this.levelSeed + this.level * 1000;
            
            // Generate ground with procedural gaps
            this.generateProceduralGround(currentSeed);
            
            // Generate platforms with different patterns per level
            this.generateProceduralPlatforms(currentSeed);
            
            // Populate with enemies and coins based on level
            this.populateProceduralLevel(currentSeed);
            
            // Validate level has minimum required elements
            this.validateLevel();
            
        } catch (error) {
            console.error('Error in generateProceduralLevel:', error);
            // Use fallback generation
            this.generateSimpleFallbackLevel();
        }
    }
    
    // Validate that the level has essential elements
    validateLevel() {
        // Ensure there's at least some ground
        const groundPlatforms = this.platforms.filter(p => p.type === 'ground');
        if (groundPlatforms.length === 0) {
            throw new Error('No ground platforms generated');
        }
        
        // Ensure there are some coins
        if (this.coinItems.length === 0) {
            // Add at least a few coins
            for (let i = 0; i < 5; i++) {
                this.coinItems.push({
                    x: 200 + i * 300,
                    y: 200,
                    width: 16,
                    height: 16,
                    collected: false,
                    rotation: 0,
                    bobOffset: 0
                });
            }
        }
    }
    
    generateProceduralGround(seed) {
        // Create base ground
        for (let x = 0; x < this.levelWidth; x += this.tileSize) {
            this.platforms.push({
                x: x,
                y: 360,
                width: this.tileSize,
                height: 40,
                type: 'ground'
            });
        }
        
        // Generate procedural gaps based on level
        const numGaps = 3 + (this.level % 4); // 3-6 gaps depending on level
        const gaps = [];
        
        for (let i = 0; i < numGaps; i++) {
            const gapSeed = seed + i * 100;
            const minX = 300 + i * (this.levelWidth - 600) / numGaps;
            const maxX = minX + (this.levelWidth - 600) / numGaps - 200;
            
            const gapStart = minX + this.seededRandom(gapSeed) * (maxX - minX);
            const gapWidth = 80 + this.seededRandom(gapSeed + 1) * 120; // 80-200 width
            
            gaps.push({ start: gapStart, end: gapStart + gapWidth });
        }
        
        // Remove ground platforms in gaps
        gaps.forEach(gap => {
            this.platforms = this.platforms.filter(platform => 
                !(platform.x >= gap.start && platform.x < gap.end && platform.type === 'ground')
            );
        });
    }
    
    generateProceduralPlatforms(seed) {
        const levelPatterns = [
            'stairs_heavy',    // Level 1, 5, 9, etc.
            'islands_scattered', // Level 2, 6, 10, etc.
            'bridges_long',    // Level 3, 7, 11, etc.
            'mixed_chaos'      // Level 4, 8, 12, etc.
        ];
        
        const patternIndex = (this.level - 1) % levelPatterns.length;
        const pattern = levelPatterns[patternIndex];
        
        switch (pattern) {
            case 'stairs_heavy':
                this.generateStairsPattern(seed);
                break;
            case 'islands_scattered':
                this.generateIslandsPattern(seed);
                break;
            case 'bridges_long':
                this.generateBridgesPattern(seed);
                break;
            case 'mixed_chaos':
                this.generateMixedPattern(seed);
                break;
        }
    }
    
    generateStairsPattern(seed) {
        // Multiple staircase sections
        const numStairs = 4 + (this.level % 3);
        
        for (let i = 0; i < numStairs; i++) {
            const stairSeed = seed + i * 50;
            const startX = 200 + i * (this.levelWidth - 400) / numStairs;
            const direction = this.seededRandom(stairSeed) > 0.5 ? 1 : -1;
            const steps = 3 + Math.floor(this.seededRandom(stairSeed + 1) * 4); // 3-6 steps
            
            this.createProceduralStairs(startX, direction, steps);
        }
    }
    
    generateIslandsPattern(seed) {
        // Scattered floating islands
        const numIslands = 8 + (this.level % 5);
        
        for (let i = 0; i < numIslands; i++) {
            const islandSeed = seed + i * 30;
            const x = 150 + this.seededRandom(islandSeed) * (this.levelWidth - 300);
            const y = 120 + this.seededRandom(islandSeed + 1) * 180; // Height variation
            const width = 64 + this.seededRandom(islandSeed + 2) * 128; // Width variation
            
            this.createIsland(x, y, width);
        }
    }
    
    generateBridgesPattern(seed) {
        // Long bridges with supports
        const numBridges = 3 + (this.level % 3);
        
        for (let i = 0; i < numBridges; i++) {
            const bridgeSeed = seed + i * 70;
            const startX = 300 + i * (this.levelWidth - 600) / numBridges;
            const endX = startX + 200 + this.seededRandom(bridgeSeed) * 300;
            const y = 200 + this.seededRandom(bridgeSeed + 1) * 120;
            
            this.createBridge(startX, endX, y);
            
            // Add support pillars
            const pillarX = startX + (endX - startX) / 2;
            this.createSupportPillar(pillarX, y);
        }
    }
    
    generateMixedPattern(seed) {
        // Chaotic mix of all patterns
        this.generateStairsPattern(seed);
        this.generateIslandsPattern(seed + 1000);
        this.generateBridgesPattern(seed + 2000);
        
        // Add some unique elements
        this.addMovingPlatforms(seed + 3000);
    }
    
    createProceduralStairs(startX, direction, steps) {
        for (let i = 0; i < steps; i++) {
            const x = startX + (i * this.tileSize * direction);
            const y = 320 - (i * this.tileSize * 0.8);
            
            this.platforms.push({
                x: x,
                y: y,
                width: this.tileSize,
                height: 20,
                type: 'platform'
            });
        }
    }
    
    createSupportPillar(x, bridgeY) {
        for (let y = bridgeY + 20; y < 360; y += 20) {
            this.platforms.push({
                x: x,
                y: y,
                width: 16,
                height: 20,
                type: 'pillar'
            });
        }
    }
    
    addMovingPlatforms(seed) {
        // Add some moving platforms for chaos levels
        const numMoving = 2 + (this.level % 3);
        
        for (let i = 0; i < numMoving; i++) {
            const platformSeed = seed + i * 25;
            const x = 400 + this.seededRandom(platformSeed) * (this.levelWidth - 800);
            const y = 150 + this.seededRandom(platformSeed + 1) * 100;
            
            this.platforms.push({
                x: x,
                y: y,
                width: 96,
                height: 16,
                type: 'moving',
                originalX: x,
                moveRange: 100,
                moveSpeed: 0.5,
                moveDirection: 1
            });
        }
    }
    
    populateProceduralLevel(seed) {
        // Ajouter des pièces et ennemis en fonction du niveau
        const enemyDensity = 0.4 + (this.level * 0.05); // Augmente avec le niveau
        const coinDensity = 0.5 - (this.level * 0.02);  // Diminue légèrement avec le niveau
        const powerUpDensity = 0.15 + (this.level * 0.01); // Légère augmentation avec le niveau
        
        // Semer des ennemis
        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            // Ne pas ajouter d'ennemis sur certains types de plateformes
            if (platform.type !== 'ground' && platform.width < 64) continue;
            
            const enemyRand = this.seededRandom(seed + i * 31);
            if (enemyRand < enemyDensity) {
                // Choisir un type d'ennemi en fonction du niveau
                const enemyTypeRand = this.seededRandom(seed + i * 17) * 100;
                let enemyType;
                
                if (this.level <= 2) {
                    // Niveau 1-2: principalement des Goombas
                    enemyType = 'GOOMBA';
                } else if (this.level <= 4) {
                    // Niveau 3-4: Goombas et Koopas
                    enemyType = enemyTypeRand < 60 ? 'GOOMBA' : 'KOOPA';
                } else {
                    // Niveau 5+: Tous types
                    if (enemyTypeRand < 50) enemyType = 'GOOMBA';
                    else if (enemyTypeRand < 85) enemyType = 'KOOPA';
                    else enemyType = 'SPIKY';
                }
                
                const enemyX = platform.x + platform.width / 2;
                const enemyY = platform.y - this.enemyTypes[enemyType].height;
                
                this.enemies.push({
                    x: enemyX,
                    y: enemyY,
                    velocityX: -this.enemyTypes[enemyType].speed,
                    velocityY: 0,
                    width: this.enemyTypes[enemyType].width,
                    height: this.enemyTypes[enemyType].height,
                    type: enemyType,
                    onGround: true,
                    active: true,
                    points: this.enemyTypes[enemyType].points
                });
            }
            
            // Ajouter des pièces sur cette plateforme
            if (platform.type === 'platform' && platform.width > 64) {
                const coinCount = Math.floor(platform.width / 40) - 1;
                for (let j = 0; j < coinCount; j++) {
                    const coinRand = this.seededRandom(seed + i * 41 + j);
                    if (coinRand < coinDensity) {
                        const coinX = platform.x + 20 + j * 40;
                        const coinY = platform.y - 30;
                        
                        this.coinItems.push({
                            x: coinX,
                            y: coinY,
                            width: 16,
                            height: 16,
                            collected: false,
                            rotation: 0,
                            bobOffset: this.seededRandom(seed + i + j) * Math.PI * 2
                        });
                    }
                }
            }
            
            // Possibilité d'ajouter un power-up sur les plateformes
            if (platform.type === 'platform' && platform.width >= 32) {
                const powerUpRand = this.seededRandom(seed + i * 53);
                if (powerUpRand < powerUpDensity) {
                    // Choisir un type de power-up
                    const powerUpTypeRand = this.seededRandom(seed + i * 79) * 100;
                    let powerUpType;
                    
                    if (powerUpTypeRand < 60) {
                        powerUpType = 'MUSHROOM';
                    } else if (powerUpTypeRand < 90) {
                        powerUpType = 'FIRE_FLOWER';
                    } else {
                        powerUpType = 'STAR';
                    }
                    
                    const powerUpX = platform.x + platform.width / 2;
                    const powerUpY = platform.y - this.powerUpTypes[powerUpType].height;
                    
                    this.powerUps.push({
                        x: powerUpX,
                        y: powerUpY,
                        velocityX: this.powerUpTypes[powerUpType].speed * (Math.random() > 0.5 ? 1 : -1),
                        velocityY: 0,
                        width: this.powerUpTypes[powerUpType].width,
                        height: this.powerUpTypes[powerUpType].height,
                        type: powerUpType,
                        effect: this.powerUpTypes[powerUpType].effect,
                        active: true,
                        onGround: true
                    });
                }
            }
        }
        
        // Générer des tuyaux
        this.generateTubes(seed);
    }
    
    generateTubes(seed) {
        // Générer 3-5 tuyaux par niveau à des positions stratégiques
        const numPipes = 3 + Math.floor(this.seededRandom(seed) * 3);
        
        for (let i = 0; i < numPipes; i++) {
            const pipeSeed = seed + i * 200;
            const minX = 400 + i * (this.levelWidth - 800) / numPipes;
            const maxX = minX + (this.levelWidth - 800) / numPipes - 200;
            
            // Position du tuyau
            const pipeX = minX + this.seededRandom(pipeSeed) * (maxX - minX);
            
            // Trouver la position y (sur le sol)
            let pipeY = 360; // Hauteur du sol par défaut
            
            // Vérifier s'il y a une plateforme de sol à cette position x
            for (const platform of this.platforms) {
                if (platform.type === 'ground' && 
                    pipeX >= platform.x && 
                    pipeX <= platform.x + platform.width) {
                    pipeY = platform.y;
                    break;
                }
            }
            
            // Taille du tuyau
            const pipeHeight = 60 + Math.floor(this.seededRandom(pipeSeed + 1) * 40);
            const pipeTop = pipeY - pipeHeight;
            
            // Ajouter le tuyau
            this.pipes.push({
                x: pipeX - 25, // La base du tuyau est centrée sur pipeX
                y: pipeTop,
                width: 50,
                height: pipeHeight,
                isEnterable: this.seededRandom(pipeSeed + 2) < 0.3 // 30% des tuyaux sont entrables
            });
            
            // S'assurer qu'il n'y a pas de plateforme au-dessus du tuyau
            this.platforms = this.platforms.filter(platform => 
                platform.type !== 'platform' || 
                platform.y < pipeTop - 50 ||
                platform.x + platform.width < pipeX - 30 ||
                platform.x > pipeX + 30
            );
            
            // Ajouter des plates-formes à la place des tuiles de sol où se trouve le tuyau
            this.platforms = this.platforms.filter(platform => 
                platform.type !== 'ground' || 
                platform.x + platform.width <= pipeX - 25 || 
                platform.x >= pipeX + 25
            );
            
            // Ajouter la collision pour le tuyau
            this.platforms.push({
                x: pipeX - 25,
                y: pipeTop,
                width: 50,
                height: pipeHeight,
                type: 'pipe'
            });
            
            // Possibilité d'avoir un ennemi qui sort du tuyau
            if (this.level > 2 && this.seededRandom(pipeSeed + 3) < 0.4) {
                const enemyX = pipeX;
                const enemyY = pipeTop - this.enemyTypes['GOOMBA'].height;
                
                this.enemies.push({
                    x: enemyX,
                    y: enemyY,
                    velocityX: -this.enemyTypes['GOOMBA'].speed,
                    velocityY: 0,
                    width: this.enemyTypes['GOOMBA'].width,
                    height: this.enemyTypes['GOOMBA'].height,
                    type: 'GOOMBA',
                    onGround: true,
                    active: true,
                    points: this.enemyTypes['GOOMBA'].points,
                    fromPipe: true, // Spécial pour l'animation de sortie du tuyau
                    spawnTime: Math.random() * 5000 + 2000 // Apparaîtra aléatoirement entre 2 et 7 secondes
                });
            }
        }
    }
    
    findPlatformAt(x, maxY) {
        return this.platforms.find(platform => 
            x >= platform.x && 
            x <= platform.x + platform.width && 
            platform.y <= maxY
        );
    }
    
    bindEvents() {
        // Remove existing listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        // Bind new listeners
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }
    
    handleKeyDown(e) {
        if (!this.gameRunning) return;
        
        this.keys[e.code] = true;
        
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.mario.onGround) {
                this.mario.velocityY = this.mario.jumpPower;
                this.mario.onGround = false;
                
                // Play jump sound
                this.audio.sounds.jump.currentTime = 0;
                this.audio.sounds.jump.play();
            }
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    gameLoop(currentTime) {
        if (!this.gameRunning) return;
        
        // FPS limiting
        const deltaTime = currentTime - this.lastTime;
        
        if (deltaTime >= this.frameTime) {
            this.update(deltaTime);
            this.render();
            this.lastTime = currentTime - (deltaTime % this.frameTime);
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Normalize deltaTime for consistent movement at different framerates
        const normalizedDelta = deltaTime / 16.67; // 16.67ms = 60fps
        
        this.updateMario(normalizedDelta);
        this.updateEnemies(normalizedDelta);
        this.updateCoins(normalizedDelta);
        this.updateParticles(normalizedDelta);
        this.updateMovingPlatforms(normalizedDelta);
        this.updateCamera();
        this.checkCollisions();
        this.checkWinCondition();
    }
    
    updateMovingPlatforms(delta) {
        this.platforms.forEach(platform => {
            if (platform.type === 'moving') {
                platform.x += platform.moveSpeed * platform.moveDirection * delta;
                
                // Bounce at limits
                if (platform.x <= platform.originalX - platform.moveRange) {
                    platform.moveDirection = 1;
                } else if (platform.x >= platform.originalX + platform.moveRange) {
                    platform.moveDirection = -1;
                }
            }
        });
    }
    
    updateMario(delta) {
        // Handle input with delta time
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.mario.velocityX = Math.max(this.mario.velocityX - 0.4 * delta, -this.mario.speed);
            this.mario.direction = -1;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.mario.velocityX = Math.min(this.mario.velocityX + 0.4 * delta, this.mario.speed);
            this.mario.direction = 1;
        } else {
            this.mario.velocityX *= Math.pow(this.friction, delta);
        }
        
        // Apply gravity
        this.mario.velocityY += this.gravity * delta;
        
        // Limit fall speed
        if (this.mario.velocityY > 10) this.mario.velocityY = 10;
        
        // Update position
        this.mario.x += this.mario.velocityX * delta;
        this.mario.y += this.mario.velocityY * delta;
        
        // Update animation
        if (Math.abs(this.mario.velocityX) > 0.1) {
            this.mario.animTime += delta;
            if (this.mario.animTime > 12) {
                this.mario.animFrame = (this.mario.animFrame + 1) % 4;
                this.mario.animTime = 0;
            }
        }
        
        // Decrease invulnerability
        if (this.mario.invulnerable > 0) {
            this.mario.invulnerable -= delta;
        }
        
        // Boundary checks
        if (this.mario.x < 0) this.mario.x = 0;
        if (this.mario.x > this.levelWidth - this.mario.width) {
            this.mario.x = this.levelWidth - this.mario.width;
        }
        
        // Death by falling
        if (this.mario.y > 500) {
            this.loseLife();
        }
    }
    
    updateEnemies(delta) {
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            // Apply gravity to enemies
            enemy.velocityY += this.gravity * delta;
            
            // Update position
            enemy.x += enemy.velocityX * delta;
            enemy.y += enemy.velocityY * delta;
            
            // Animation
            enemy.animTime += delta;
            if (enemy.animTime > 20) {
                enemy.animFrame = (enemy.animFrame + 1) % 2;
                enemy.animTime = 0;
            }
            
            // AI behavior based on type
            switch (enemy.type) {
                case 'GOOMBA':
                    this.updateGoombaAI(enemy);
                    break;
                case 'KOOPA':
                    this.updateKoopaAI(enemy);
                    break;
                case 'SPIKY':
                    this.updateSpikyAI(enemy);
                    break;
            }
            
            // Platform collision for enemies
            this.checkEnemyPlatformCollisions(enemy);
        });
    }
    
    updateGoombaAI(enemy) {
        // Simple patrol behavior
        if (enemy.x <= enemy.patrolStart) {
            enemy.velocityX = Math.abs(enemy.velocityX);
        } else if (enemy.x >= enemy.patrolEnd) {
            enemy.velocityX = -Math.abs(enemy.velocityX);
        }
    }
    
    updateKoopaAI(enemy) {
        // Koopa is faster and has wider patrol
        if (enemy.x <= enemy.patrolStart - 32) {
            enemy.velocityX = Math.abs(enemy.velocityX);
        } else if (enemy.x >= enemy.patrolEnd + 32) {
            enemy.velocityX = -Math.abs(enemy.velocityX);
        }
    }
    
    updateSpikyAI(enemy) {
        // Spiky moves slower but changes direction randomly
        if (Math.random() < 0.01) {
            enemy.velocityX *= -1;
        }
        
        if (enemy.x <= enemy.patrolStart) {
            enemy.velocityX = Math.abs(enemy.velocityX);
        } else if (enemy.x >= enemy.patrolEnd) {
            enemy.velocityX = -Math.abs(enemy.velocityX);
        }
    }
    
    checkEnemyPlatformCollisions(enemy) {
        enemy.onGround = false;
        
        this.platforms.forEach(platform => {
            if (enemy.x < platform.x + platform.width &&
                enemy.x + enemy.width > platform.x &&
                enemy.y < platform.y + platform.height &&
                enemy.y + enemy.height > platform.y) {
                
                // Landing on platform
                if (enemy.velocityY > 0 && enemy.y < platform.y) {
                    enemy.y = platform.y - enemy.height;
                    enemy.velocityY = 0;
                    enemy.onGround = true;
                }
                // Hitting platform from below
                else if (enemy.velocityY < 0 && enemy.y > platform.y) {
                    enemy.y = platform.y + platform.height;
                    enemy.velocityY = 0;
                }
                // Side collisions
                else {
                    if (enemy.x < platform.x) {
                        enemy.x = platform.x - enemy.width;
                        enemy.velocityX *= -1;
                    } else {
                        enemy.x = platform.x + platform.width;
                        enemy.velocityX *= -1;
                    }
                }
            }
        });
    }
    
    updateCoins(delta) {
        this.coinItems.forEach(coin => {
            if (!coin.collected) {
                coin.rotation += 0.06 * delta;
                coin.bobOffset += 0.04 * delta;
            }
        });
    }
    
    updateParticles(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.velocityX * delta;
            particle.y += particle.velocityY * delta;
            particle.velocityY += 0.15 * delta;
            particle.life -= delta;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateCamera() {
        const targetX = this.mario.x - this.canvas.width / 2;
        this.camera.x = Math.max(0, Math.min(targetX, this.levelWidth - this.canvas.width));
        
        // Smooth camera movement
        const diff = targetX - this.camera.x;
        this.camera.x += diff * 0.1;
    }
    
    checkCollisions() {
        this.checkMarioPlatformCollisions();
        this.checkMarioEnemyCollisions();
        this.checkMarioCoinCollisions();
    }
    
    checkMarioPlatformCollisions() {
        this.mario.onGround = false;
        
        this.platforms.forEach(platform => {
            if (this.mario.x < platform.x + platform.width &&
                this.mario.x + this.mario.width > platform.x &&
                this.mario.y < platform.y + platform.height &&
                this.mario.y + this.mario.height > platform.y) {
                
                // Landing on platform
                if (this.mario.velocityY > 0 && this.mario.y < platform.y) {
                    this.mario.y = platform.y - this.mario.height;
                    this.mario.velocityY = 0;
                    this.mario.onGround = true;
                }
                // Hitting platform from below
                else if (this.mario.velocityY < 0 && this.mario.y > platform.y) {
                    this.mario.y = platform.y + platform.height;
                    this.mario.velocityY = 0;
                }
                // Side collisions
                else {
                    if (this.mario.x < platform.x) {
                        this.mario.x = platform.x - this.mario.width;
                    } else {
                        this.mario.x = platform.x + platform.width;
                    }
                    this.mario.velocityX = 0;
                }
            }
        });
    }
    
    checkMarioEnemyCollisions() {
        if (this.mario.invulnerable > 0) return;
        
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            if (this.mario.x < enemy.x + enemy.width &&
                this.mario.x + this.mario.width > enemy.x &&
                this.mario.y < enemy.y + enemy.height &&
                this.mario.y + this.mario.height > enemy.y) {
                
                // Stomp enemy (Mario lands on top)
                if (this.mario.velocityY > 0 && this.mario.y < enemy.y - 5) {
                    enemy.alive = false;
                    this.mario.velocityY = -8; // Bounce
                    this.score += this.enemyTypes[enemy.type].points;
                    this.createDeathParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                    this.updateUI();
                    
                    // Play stomp sound
                    this.audio.sounds.stomp.currentTime = 0;
                    this.audio.sounds.stomp.play();
                } else {
                    // Mario hits enemy from side - lose life
                    if (enemy.type === 'SPIKY') {
                        // Spiky enemies can't be stomped safely
                        this.loseLife();
                    } else {
                        this.loseLife();
                    }
                }
            }
        });
    }
    
    checkMarioCoinCollisions() {
        this.coinItems.forEach(coin => {
            if (!coin.collected &&
                this.mario.x < coin.x + coin.width &&
                this.mario.x + this.mario.width > coin.x &&
                this.mario.y < coin.y + coin.height &&
                this.mario.y + this.mario.height > coin.y) {
                
                coin.collected = true;
                this.coins++;
                this.score += 200;
                this.createCoinParticles(coin.x + coin.width/2, coin.y + coin.height/2);
                this.updateUI();
                
                // Play coin sound
                this.audio.sounds.coin.currentTime = 0;
                this.audio.sounds.coin.play();
            }
        });
    }
    
    createDeathParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 4,
                velocityY: -Math.random() * 3 - 1,
                color: '#ff6b6b',
                life: 30
            });
        }
    }
    
    createCoinParticles(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 3,
                velocityY: -Math.random() * 2 - 1,
                color: '#FFD700',
                life: 25
            });
        }
    }
    
    checkWinCondition() {
        if (!this.levelCompleted && this.mario.x > this.levelWidth - 100) {
            this.levelCompleted = true;
            // Add a small delay to prevent immediate re-triggering
            setTimeout(() => {
                this.nextLevel();
            }, 100);
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        this.drawPlatforms();
        this.drawCoins();
        this.drawEnemies();
        this.drawMario();
        this.drawParticles();
        this.drawUI();
    }
    
    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98E4FF');
        gradient.addColorStop(1, '#B0E0E6');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Parallax clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 8; i++) {
            const x = (i * 250 + 100) - this.camera.x * 0.3;
            const y = 40 + (i % 3) * 25;
            if (x > -80 && x < this.canvas.width + 80) {
                this.drawCloud(x, y);
            }
        }
    }
    
    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 12, 0, Math.PI * 2);
        this.ctx.arc(x + 16, y, 16, 0, Math.PI * 2);
        this.ctx.arc(x + 32, y, 12, 0, Math.PI * 2);
        this.ctx.arc(x + 16, y - 8, 10, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawPlatforms() {
        this.platforms.forEach(platform => {
            const x = platform.x - this.camera.x;
            const y = platform.y;
            
            if (x > -platform.width && x < this.canvas.width) {
                switch (platform.type) {
                    case 'ground':
                        this.ctx.fillStyle = '#228B22';
                        this.ctx.fillRect(x, y, platform.width, platform.height);
                        // Grass texture
                        this.ctx.fillStyle = '#32CD32';
                        this.ctx.fillRect(x, y, platform.width, 8);
                        break;
                    case 'platform':
                        this.ctx.fillStyle = '#8B4513';
                        this.ctx.fillRect(x, y, platform.width, platform.height);
                        // Wood texture
                        this.ctx.fillStyle = '#A0522D';
                        this.ctx.fillRect(x, y, platform.width, 4);
                        break;
                    case 'bridge':
                        this.ctx.fillStyle = '#DEB887';
                        this.ctx.fillRect(x, y, platform.width, platform.height);
                        // Rope texture
                        this.ctx.strokeStyle = '#8B4513';
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, y + 2);
                        this.ctx.lineTo(x + platform.width, y + 2);
                        this.ctx.stroke();
                        break;
                    case 'pillar':
                        this.ctx.fillStyle = '#696969';
                        this.ctx.fillRect(x, y, platform.width, platform.height);
                        // Stone texture
                        this.ctx.fillStyle = '#778899';
                        this.ctx.fillRect(x + 2, y + 2, platform.width - 4, 4);
                        break;
                    case 'moving':
                        this.ctx.fillStyle = '#FF6347';
                        this.ctx.fillRect(x, y, platform.width, platform.height);
                        // Moving platform indicator
                        this.ctx.fillStyle = '#FF4500';
                        this.ctx.fillRect(x, y, platform.width, 4);
                        // Arrows to show movement
                        this.ctx.fillStyle = '#FFF';
                        this.ctx.font = '12px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('←→', x + platform.width/2, y + 12);
                        break;
                }
            }
        });
    }
    
    drawCoins() {
        this.coinItems.forEach(coin => {
            if (coin.collected) return;
            
            const x = coin.x - this.camera.x;
            const y = coin.y + Math.sin(coin.bobOffset) * 2;
            
            if (x > -coin.width && x < this.canvas.width) {
                this.ctx.save();
                this.ctx.translate(x + coin.width/2, y + coin.height/2);
                this.ctx.rotate(coin.rotation);
                
                // Gold coin with better shading
                const coinGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, coin.width/2);
                coinGradient.addColorStop(0, '#FFD700');
                coinGradient.addColorStop(1, '#DAA520');
                this.ctx.fillStyle = coinGradient;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, coin.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Coin highlight
                this.ctx.fillStyle = '#FFF';
                this.ctx.fillRect(-1, -6, 2, 4);
                this.ctx.fillRect(-4, -1, 8, 2);
                
                this.ctx.restore();
            }
        });
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const x = enemy.x - this.camera.x;
            const y = enemy.y;
            
            if (x > -enemy.width && x < this.canvas.width) {
                const enemyType = this.enemyTypes[enemy.type];
                
                switch (enemy.type) {
                    case 'GOOMBA':
                        this.drawGoomba(x, y, enemy);
                        break;
                    case 'KOOPA':
                        this.drawKoopa(x, y, enemy);
                        break;
                    case 'SPIKY':
                        this.drawSpiky(x, y, enemy);
                        break;
                }
            }
        });
    }
    
    drawGoomba(x, y, enemy) {
        // Body
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x, y, enemy.width, enemy.height);
        
        // Eyes
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(x + 4, y + 4, 6, 6);
        this.ctx.fillRect(x + 14, y + 4, 6, 6);
        
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + 16, y + 6, 2, 2);
        
        // Feet animation
        if (enemy.animFrame === 0) {
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(x + 2, y + enemy.height - 4, 4, 4);
            this.ctx.fillRect(x + enemy.width - 6, y + enemy.height - 4, 4, 4);
        }
    }
    
    drawKoopa(x, y, enemy) {
        // Shell
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(x, y + 8, enemy.width, enemy.height - 8);
        
        // Head
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(x + 6, y, enemy.width - 12, 12);
        
        // Eyes
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(x + 8, y + 2, 4, 4);
        this.ctx.fillRect(x + 16, y + 2, 4, 4);
        
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(x + 9, y + 3, 2, 2);
        this.ctx.fillRect(x + 17, y + 3, 2, 2);
        
        // Shell pattern
        this.ctx.fillStyle = '#006400';
        this.ctx.fillRect(x + 4, y + 12, enemy.width - 8, 4);
    }
    
    drawSpiky(x, y, enemy) {
        // Body
        this.ctx.fillStyle = '#FF4500';
        this.ctx.fillRect(x + 4, y + 4, enemy.width - 8, enemy.height - 8);
        
        // Spikes
        this.ctx.fillStyle = '#8B0000';
        const spikes = [
            [x + 2, y + 2], [x + enemy.width/2, y - 2], [x + enemy.width - 2, y + 2],
            [x - 2, y + enemy.height/2], [x + enemy.width + 2, y + enemy.height/2],
            [x + 2, y + enemy.height - 2], [x + enemy.width - 2, y + enemy.height - 2]
        ];
        
        spikes.forEach(spike => {
            this.ctx.fillRect(spike[0], spike[1], 4, 4);
        });
        
        // Eyes
        this.ctx.fillStyle = 'yellow';
        this.ctx.fillRect(x + 8, y + 8, 3, 3);
        this.ctx.fillRect(x + 16, y + 8, 3, 3);
    }
    
    drawMario() {
        if (!this.gameRunning) return;
        
        // Si Mario est invulnérable, faire clignoter (visible seulement la moitié du temps)
        if (this.mario.invulnerable > 0 && Math.floor(this.mario.invulnerable / 4) % 2 === 0) {
            return;
        }
        
        // Calculer la position relative à la caméra
        const drawX = this.mario.x - this.camera.x;
        const drawY = this.mario.y - this.camera.y;
        
        this.ctx.save();
        
        // Appliquer une transformation pour le sens de Mario
        if (this.mario.direction < 0) {
            this.ctx.translate(drawX * 2 + this.mario.width, 0);
            this.ctx.scale(-1, 1);
        }
        
        // Changer la hauteur en fonction de l'état de puissance
        const height = this.mario.powerState > 0 ? this.mario.height * 1.5 : this.mario.height;
        const yOffset = this.mario.powerState > 0 ? this.mario.height * 0.5 : 0;
        
        // Couleur de base selon le power state
        let color = '#FF0000'; // Base rouge
        if (this.mario.powerState === 1) color = '#FF0000'; // Grand Mario: rouge
        else if (this.mario.powerState === 2) color = '#FFA500'; // Fire Mario: orange
        
        // Dessiner le corps
        this.ctx.fillStyle = color;
        this.ctx.fillRect(drawX, drawY - yOffset, this.mario.width, height);
        
        // Dessiner la tête
        this.ctx.fillStyle = '#FFC0CB';
        this.ctx.fillRect(drawX, drawY - yOffset, this.mario.width, height / 3);
        
        // Casquette (seulement pour Mario grand et feu)
        if (this.mario.powerState > 0) {
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(drawX - 4, drawY - yOffset, this.mario.width + 8, height / 6);
        }
        
        // Yeux
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(drawX + (this.mario.width * 0.7), drawY - yOffset + (height / 10), this.mario.width / 5, height / 15);
        
        this.ctx.restore();
    }
    
    drawPlatform(platform) {
        // Calculer la position relative à la caméra
        const drawX = platform.x - this.camera.x;
        const drawY = platform.y - this.camera.y;
        
        // Couleurs selon le type
        let fillColor = '#795548'; // Brown for ground
        let strokeColor = '#5D4037';
        
        if (platform.type === 'platform') {
            fillColor = '#FF9800'; // Orange for platforms
            strokeColor = '#F57C00';
        } else if (platform.type === 'pipe') {
            fillColor = '#4CAF50'; // Vert pour les tuyaux
            strokeColor = '#388E3C';
        }
        
        // Remplissage avec dégradé pour plus de profondeur
        const gradient = this.ctx.createLinearGradient(drawX, drawY, drawX, drawY + platform.height);
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, this.adjustColor(fillColor, -20));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(drawX, drawY, platform.width, platform.height);
        
        // Contour
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(drawX, drawY, platform.width, platform.height);
        
        // Détails pour les pipes
        if (platform.type === 'pipe') {
            // Lèvre du tuyau
            this.ctx.fillStyle = '#2E7D32';
            this.ctx.fillRect(drawX - 5, drawY, platform.width + 10, 10);
            
            // Reflet
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(drawX + 5, drawY + 5, 10, platform.height - 10);
        }
    }
    
    drawPowerUp(powerUp) {
        // Ignorer les power-ups inactifs
        if (!powerUp.active) return;
        
        // Calculer la position relative à la caméra
        const drawX = powerUp.x - this.camera.x;
        const drawY = powerUp.y - this.camera.y;
        
        this.ctx.fillStyle = this.powerUpTypes[powerUp.type].color;
        
        // Dessiner le power-up avec une forme différente selon son type
        if (powerUp.type === 'MUSHROOM') {
            // Champignon
            this.ctx.beginPath();
            this.ctx.arc(drawX + powerUp.width / 2, drawY + powerUp.height / 2, 
                          powerUp.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Détails du champignon
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(drawX + powerUp.width / 2, drawY + powerUp.height / 2, 
                          powerUp.width / 3, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (powerUp.type === 'FIRE_FLOWER') {
            // Fleur de feu
            this.ctx.fillStyle = '#FFA500';
            this.ctx.fillRect(drawX, drawY, powerUp.width, powerUp.height);
            
            // Pétales
            const petalColors = ['#FF0000', '#FFFF00'];
            for (let i = 0; i < 4; i++) {
                const angle = Math.PI / 2 * i;
                const petalX = drawX + powerUp.width/2 + Math.cos(angle) * powerUp.width/3;
                const petalY = drawY + powerUp.height/2 + Math.sin(angle) * powerUp.height/3;
                
                this.ctx.fillStyle = petalColors[i % 2];
                this.ctx.beginPath();
                this.ctx.arc(petalX, petalY, powerUp.width/4, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Centre de la fleur
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(drawX + powerUp.width/2, drawY + powerUp.height/2, 
                        powerUp.width/6, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (powerUp.type === 'STAR') {
            // Étoile
            this.ctx.fillStyle = this.powerUpTypes[powerUp.type].color;
            
            // Dessiner une étoile à 5 branches
            this.ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = Math.PI / 5 * i * 2 - Math.PI / 2;
                const x = drawX + powerUp.width/2 + Math.cos(angle) * powerUp.width/2;
                const y = drawY + powerUp.height/2 + Math.sin(angle) * powerUp.height/2;
                
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
                
                const innerAngle = angle + Math.PI / 5;
                const innerX = drawX + powerUp.width/2 + Math.cos(innerAngle) * powerUp.width/4;
                const innerY = drawY + powerUp.height/2 + Math.sin(innerAngle) * powerUp.height/4;
                this.ctx.lineTo(innerX, innerY);
            }
            this.ctx.closePath();
            this.ctx.fill();
            
            // Effet de brillance
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(drawX + powerUp.width/2, drawY + powerUp.height/2, 
                        powerUp.width/6, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // Fonction utilitaire pour ajuster une couleur
    adjustColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + percent));
        const g = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
        const b = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
        return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    }
    
    // Fermer le jeu Mario
    close() {
        this.gameRunning = false;
        
        // Arrêter la musique
        if (this.audio.currentMusicTrack) {
            this.audio.currentMusicTrack.stop();
        }
        
        // Cacher l'overlay
        document.getElementById('mario-overlay').style.display = 'none';
        
        // Supprimer les événements
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}

// Initialiser le jeu Mario quand le DOM est chargé
let marioGameInstance = null;
let marioSequence = '';

document.addEventListener('DOMContentLoaded', function() {
    // Easter Egg: Mario Game sequence detection
    document.addEventListener('keydown', function(e) {
        if (marioGameInstance && marioGameInstance.gameRunning) return;
        
        marioSequence += e.key.toLowerCase();
        
        // Ne garder que les 5 dernières touches
        if (marioSequence.length > 5) {
            marioSequence = marioSequence.substring(marioSequence.length - 5);
        }
        
        if (marioSequence === 'mario') {
            document.getElementById('mario-overlay').style.display = 'flex';
            marioGameInstance = new MarioGame();
            marioGameInstance.init();
            marioSequence = '';
        }
    });

    // Close button
    document.getElementById('mario-close').addEventListener('click', function() {
        if (marioGameInstance) {
            marioGameInstance.close();
        }
    });
});
