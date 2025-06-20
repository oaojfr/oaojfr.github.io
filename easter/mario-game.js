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
            invulnerable: 0
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
        
        // Enemy types (all slower than Mario)
        this.enemyTypes = {
            GOOMBA: { width: 24, height: 24, speed: 0.6, color: '#8B4513', points: 100 }, // Reduced from 0.8
            KOOPA: { width: 28, height: 32, speed: 0.9, color: '#228B22', points: 200 }, // Reduced from 1.2
            SPIKY: { width: 26, height: 26, speed: 0.4, color: '#FF4500', points: 150 } // Reduced from 0.6
        };
    }
    
    init() {
        this.canvas = document.getElementById('mario-canvas');
        this.ctx = this.canvas.getContext('2d');
        
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
    
    resetGame() {
        this.mario.x = 100;
        this.mario.y = 200;
        this.mario.velocityX = 0;
        this.mario.velocityY = 0;
        this.mario.onGround = false;
        this.mario.invulnerable = 0;
        this.camera.x = 0;
        this.camera.y = 0;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.keys = {};
        this.platforms = [];
        this.enemies = [];
        this.coinItems = [];
        this.particles = [];
        this.levelCompleted = false;
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
        try {
            // Clear existing
            this.enemies = [];
            this.coinItems = [];
            
            // Generate enemies based on level difficulty
            const baseEnemies = 6;
            const enemyCount = Math.min(baseEnemies + Math.floor(this.level / 2), 15); // Cap at 15 enemies
            const enemyTypes = ['GOOMBA', 'KOOPA', 'SPIKY'];
            
            let placedEnemies = 0;
            let attempts = 0;
            const maxAttempts = enemyCount * 3; // Prevent infinite loops
            
            while (placedEnemies < enemyCount && attempts < maxAttempts) {
                attempts++;
                const enemySeed = seed + placedEnemies * 15 + attempts;
                const x = 250 + this.seededRandom(enemySeed) * (this.levelWidth - 500);
                
                // Find suitable platform
                const platform = this.findPlatformAt(x, 360);
                if (platform) {
                    // Enemy type based on level and randomness
                    let typeIndex;
                    if (this.level <= 2) {
                        typeIndex = 0; // Only Goombas for first levels
                    } else if (this.level <= 4) {
                        typeIndex = Math.floor(this.seededRandom(enemySeed + 1) * 2); // Goombas and Koopas
                    } else {
                        typeIndex = Math.floor(this.seededRandom(enemySeed + 1) * 3); // All enemy types
                    }
                    
                    const enemyType = enemyTypes[typeIndex];
                    const enemyStats = this.enemyTypes[enemyType];
                    
                    this.enemies.push({
                        x: x,
                        y: platform.y - enemyStats.height,
                        width: enemyStats.width,
                        height: enemyStats.height,
                        velocityX: this.seededRandom(enemySeed + 2) > 0.5 ? enemyStats.speed : -enemyStats.speed,
                        velocityY: 0,
                        type: enemyType,
                        alive: true,
                        onGround: false,
                        patrolStart: x - 80,
                        patrolEnd: x + 80,
                        animFrame: 0,
                        animTime: 0
                    });
                    
                    placedEnemies++;
                }
            }
            
            // Generate coins procedurally
            const coinCount = Math.min(15 + Math.floor(this.level / 3) * 5, 30); // Cap at 30 coins
            
            for (let i = 0; i < coinCount; i++) {
                const coinSeed = seed + i * 20 + 10000;
                const x = 200 + this.seededRandom(coinSeed) * (this.levelWidth - 400);
                const y = 100 + this.seededRandom(coinSeed + 1) * 200;
                
                // Sometimes group coins together
                if (this.seededRandom(coinSeed + 2) > 0.7) {
                    // Create a group of 3 coins
                    for (let j = 0; j < 3; j++) {
                        this.coinItems.push({
                            x: x + j * 25,
                            y: y,
                            width: 16,
                            height: 16,
                            collected: false,
                            rotation: 0,
                            bobOffset: this.seededRandom(coinSeed + j) * Math.PI * 2
                        });
                    }
                } else {
                    this.coinItems.push({
                        x: x,
                        y: y,
                        width: 16,
                        height: 16,
                        collected: false,
                        rotation: 0,
                        bobOffset: this.seededRandom(coinSeed + 3) * Math.PI * 2
                    });
                }
            }
        } catch (error) {
            console.error('Error in populateProceduralLevel:', error);
            // Add minimal enemies and coins as fallback
            this.enemies = [{
                x: 400, y: 320, width: 24, height: 24, velocityX: 0.6, velocityY: 0,
                type: 'GOOMBA', alive: true, onGround: false, patrolStart: 350, patrolEnd: 450,
                animFrame: 0, animTime: 0
            }];
            
            this.coinItems = [{
                x: 300, y: 200, width: 16, height: 16, collected: false,
                rotation: 0, bobOffset: 0
            }];
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
        const x = this.mario.x - this.camera.x;
        const y = this.mario.y;
        
        // Invulnerability flashing
        if (this.mario.invulnerable > 0 && Math.floor(this.mario.invulnerable / 3) % 2) {
            return; // Skip drawing for flashing effect
        }
        
        // Mario body
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(x, y + 8, this.mario.width, this.mario.height - 8);
        
        // Mario hat
        this.ctx.fillStyle = '#8B0000';
        this.ctx.fillRect(x - 2, y - 4, this.mario.width + 4, 12);
        
        // Mario face
        this.ctx.fillStyle = '#FFE4B5';
        this.ctx.fillRect(x + 4, y + 8, this.mario.width - 8, 16);
        
        // Mustache
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x + 8, y + 18, 8, 3);
        
        // Eyes (direction-based)
        this.ctx.fillStyle = 'black';
        if (this.mario.direction === 1) {
            this.ctx.fillRect(x + 14, y + 12, 2, 2);
            this.ctx.fillRect(x + 18, y + 12, 2, 2);
        } else {
            this.ctx.fillRect(x + 4, y + 12, 2, 2);
            this.ctx.fillRect(x + 8, y + 12, 2, 2);
        }
        
        // Legs animation
        if (Math.abs(this.mario.velocityX) > 0.1) {
            this.ctx.fillStyle = '#000080';
            if (this.mario.animFrame % 2 === 0) {
                this.ctx.fillRect(x + 6, y + this.mario.height - 8, 4, 8);
                this.ctx.fillRect(x + 14, y + this.mario.height - 6, 4, 6);
            } else {
                this.ctx.fillRect(x + 6, y + this.mario.height - 6, 4, 6);
                this.ctx.fillRect(x + 14, y + this.mario.height - 8, 4, 8);
            }
        } else {
            this.ctx.fillStyle = '#000080';
            this.ctx.fillRect(x + 8, y + this.mario.height - 8, 8, 8);
        }
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            const x = particle.x - this.camera.x;
            const alpha = particle.life / 30;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(x, particle.y, 3, 3);
            this.ctx.restore();
        });
    }
    
    drawUI() {
        // Semi-transparent background for UI
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 300, 40);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Poppins, sans-serif';
        this.ctx.fillText(`Vies: ${this.lives} | Score: ${this.score} | Pièces: ${this.coins} | Niveau: ${this.level}`, 15, 35);
        
        // Progress bar
        const progress = this.mario.x / this.levelWidth;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 60, 200, 10);
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(10, 60, 200 * progress, 10);
    }
    
    loseLife() {
        if (this.mario.invulnerable > 0) return; // Prevent multiple calls
        
        this.lives--;
        this.mario.invulnerable = 120; // 2 seconds of invulnerability
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn Mario safely
            this.respawnMario();
        }
        
        this.updateUI();
    }
    
    respawnMario() {
        // Find a safe spawn position
        let spawnX = 100;
        let spawnY = 200;
        
        // Check if spawn position is safe (on a platform)
        const spawnPlatform = this.findPlatformAt(spawnX, 360);
        if (spawnPlatform) {
            spawnY = spawnPlatform.y - this.mario.height;
        }
        
        this.mario.x = spawnX;
        this.mario.y = spawnY;
        this.mario.velocityX = 0;
        this.mario.velocityY = 0;
        this.camera.x = 0;
        this.levelCompleted = false; // Reset in case of respawn near end
    }
    
    nextLevel() {
        if (!this.gameRunning) return; // Safety check
        
        this.level++;
        this.mario.x = 100;
        this.mario.y = 200;
        this.mario.velocityX = 0;
        this.mario.velocityY = 0;
        this.camera.x = 0;
        this.levelCompleted = false; // Reset for next level
        
        // Bonus points for completing level
        this.score += 1000 + (this.level * 500);
        
        // Generate completely new level with new seed
        this.levelSeed = Math.floor(Math.random() * 1000000);
        
        try {
            this.generateProceduralLevel();
            this.updateUI();
        } catch (error) {
            console.error('Error generating next level:', error);
            // Fallback: generate a simple level
            this.generateSimpleFallbackLevel();
            this.updateUI();
        }
    }
    
    // Fallback level generation in case of errors
    generateSimpleFallbackLevel() {
        this.platforms = [];
        this.enemies = [];
        this.coinItems = [];
        
        // Simple ground
        for (let x = 0; x < this.levelWidth; x += this.tileSize) {
            this.platforms.push({
                x: x,
                y: 360,
                width: this.tileSize,
                height: 40,
                type: 'ground'
            });
        }
        
        // Simple platforms
        for (let i = 1; i < 6; i++) {
            this.platforms.push({
                x: i * 300,
                y: 280 - i * 20,
                width: 96,
                height: 20,
                type: 'platform'
            });
        }
        
        // Simple enemies
        for (let i = 1; i < 4; i++) {
            this.enemies.push({
                x: i * 400,
                y: 320,
                width: 24,
                height: 24,
                velocityX: 0.6,
                velocityY: 0,
                type: 'GOOMBA',
                alive: true,
                onGround: false,
                patrolStart: i * 400 - 50,
                patrolEnd: i * 400 + 50,
                animFrame: 0,
                animTime: 0
            });
        }
        
        // Simple coins
        for (let i = 1; i < 8; i++) {
            this.coinItems.push({
                x: i * 250,
                y: 200,
                width: 16,
                height: 16,
                collected: false,
                rotation: 0,
                bobOffset: 0
            });
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('mario-game-over').style.display = 'block';
        this.cleanup();
    }
    
    updateUI() {
        document.getElementById('mario-score-value').textContent = this.score;
        document.getElementById('mario-coins').textContent = this.coins;
    }
    
    cleanup() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
    
    close() {
        this.gameRunning = false;
        document.getElementById('mario-overlay').style.display = 'none';
        document.getElementById('mario-game-over').style.display = 'none';
        this.cleanup();
    }
}

// Global game instance
let marioGameInstance = null;

// Global functions for HTML buttons
window.restartMarioGame = function() {
    if (marioGameInstance) {
        marioGameInstance.init();
    }
};

window.closeMarioGame = function() {
    if (marioGameInstance) {
        marioGameInstance.close();
    }
};

// Initialize game when mario sequence is typed
let marioSequence = '';
document.addEventListener('keydown', function(e) {
    // Don't interfere with game controls
    if (marioGameInstance && marioGameInstance.gameRunning) return;
    
    marioSequence += e.key.toLowerCase();
    if (marioSequence.length > 5) {
        marioSequence = marioSequence.slice(-5);
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
