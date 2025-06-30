/**
 * SUPER MARIO BROS - JEU COMPLET
 * Avec TOUTES les mécaniques : niveaux, tuyaux, power-ups, ennemis variés, mondes multiples
 */

class SuperMarioGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 500;
        
        // Configuration du jeu
        this.TILE_SIZE = 32;
        this.GRAVITY = 0.8;
        this.FRICTION = 0.85;
        this.JUMP_POWER = -15;
        this.SPEED = 5;
        
        // Caméra
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            smoothing: 0.1
        };
        
        // État du jeu
        this.gameState = 'menu'; // menu, playing, paused, gameOver, levelComplete
        this.currentWorld = 1;
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 3;
        this.coins = 0;
        this.time = 400;
        this.powerState = 0; // 0=small, 1=big, 2=fire
        
        // Joueur
        this.player = {
            x: 100,
            y: 300,
            width: 24,
            height: 32,
            dx: 0,
            dy: 0,
            onGround: false,
            facingRight: true,
            animFrame: 0,
            animTimer: 0,
            invulnerable: false,
            invulnTime: 0
        };
        
        // Niveau actuel
        this.currentLevelData = null;
        this.tiles = [];
        this.enemies = [];
        this.items = [];
        this.pipes = [];
        this.platforms = [];
        this.flagpole = null;
        
        // Contrôles
        this.keys = {};
        
        // Particules et effets
        this.particles = [];
        this.floatingTexts = [];
        
        // Audio (simulé)
        this.sounds = {};
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.setupEventListeners();
        this.loadSounds();
        this.generateLevel(this.currentWorld, this.currentLevel);
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameState === 'menu') {
                    this.startGame();
                } else if (this.gameState === 'playing') {
                    this.playerJump();
                }
            }
            
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
            
            if (e.key === 'r' || e.key === 'R') {
                if (this.gameState === 'gameOver') {
                    this.restart();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    loadSounds() {
        // Simulation des sons
        this.sounds = {
            jump: () => console.log('♪ Jump!'),
            coin: () => console.log('♪ Coin!'),
            powerUp: () => console.log('♪ Power-up!'),
            enemyKill: () => console.log('♪ Enemy killed!'),
            levelComplete: () => console.log('♪ Level complete!'),
            gameOver: () => console.log('♪ Game over!'),
            oneUp: () => console.log('♪ 1-Up!')
        };
    }
    
    generateLevel(world, level) {
        // Génération procédurale du niveau
        const levelWidth = 200; // Largeur en tiles
        const levelHeight = 15; // Hauteur en tiles
        
        this.tiles = [];
        this.enemies = [];
        this.items = [];
        this.pipes = [];
        this.platforms = [];
        
        // Génération du terrain de base
        for (let x = 0; x < levelWidth; x++) {
            for (let y = 12; y < levelHeight; y++) {
                this.tiles.push({
                    x: x * this.TILE_SIZE,
                    y: y * this.TILE_SIZE,
                    type: y === 12 ? 'ground' : 'dirt',
                    solid: true
                });
            }
        }
        
        // Ajout de plateformes
        this.addPlatforms(levelWidth);
        
        // Ajout d'ennemis
        this.addEnemies(levelWidth);
        
        // Ajout d'items et power-ups
        this.addItems(levelWidth);
        
        // Ajout de tuyaux
        this.addPipes(levelWidth);
        
        // Ajout du château/flagpole à la fin
        this.addLevelEnd(levelWidth);
        
        // Reset position du joueur
        this.player.x = 100;
        this.player.y = 300;
        this.player.dx = 0;
        this.player.dy = 0;
        this.camera.x = 0;
    }
    
    addPlatforms(levelWidth) {
        // Plateformes flottantes
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * (levelWidth - 10) + 5;
            const y = Math.random() * 8 + 3;
            const width = Math.random() * 4 + 2;
            
            for (let j = 0; j < width; j++) {
                this.tiles.push({
                    x: (x + j) * this.TILE_SIZE,
                    y: y * this.TILE_SIZE,
                    type: 'brick',
                    solid: true,
                    breakable: true
                });
            }
        }
        
        // Blocs spéciaux (question marks)
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * (levelWidth - 10) + 5;
            const y = Math.random() * 6 + 5;
            
            this.tiles.push({
                x: x * this.TILE_SIZE,
                y: y * this.TILE_SIZE,
                type: 'question',
                solid: true,
                hasItem: Math.random() < 0.8,
                itemType: Math.random() < 0.6 ? 'mushroom' : 'coin'
            });
        }
    }
    
    addEnemies(levelWidth) {
        const enemyTypes = ['goomba', 'koopa', 'piranha'];
        
        for (let i = 0; i < 25; i++) {
            const x = Math.random() * (levelWidth - 10) + 5;
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            this.enemies.push({
                x: x * this.TILE_SIZE,
                y: 11 * this.TILE_SIZE - 32,
                width: 24,
                height: 32,
                type: type,
                dx: type === 'piranha' ? 0 : (Math.random() < 0.5 ? -1 : 1),
                dy: 0,
                alive: true,
                animFrame: 0,
                animTimer: 0,
                direction: Math.random() < 0.5 ? -1 : 1
            });
        }
    }
    
    addItems(levelWidth) {
        // Pièces dispersées
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * (levelWidth - 5) + 2;
            const y = Math.random() * 8 + 4;
            
            this.items.push({
                x: x * this.TILE_SIZE,
                y: y * this.TILE_SIZE,
                type: 'coin',
                collected: false,
                animFrame: 0,
                animTimer: 0
            });
        }
    }
    
    addPipes(levelWidth) {
        // Tuyaux verts classiques
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * (levelWidth - 20) + 10;
            const height = Math.random() * 3 + 2;
            
            this.pipes.push({
                x: x * this.TILE_SIZE,
                y: (12 - height) * this.TILE_SIZE,
                width: this.TILE_SIZE * 2,
                height: height * this.TILE_SIZE,
                type: 'normal',
                warpTo: null // Peut être configuré pour des warps
            });
        }
    }
    
    addLevelEnd(levelWidth) {
        // Flagpole à la fin du niveau
        this.flagpole = {
            x: (levelWidth - 5) * this.TILE_SIZE,
            y: 4 * this.TILE_SIZE,
            width: this.TILE_SIZE,
            height: 8 * this.TILE_SIZE,
            flag: {
                y: 4 * this.TILE_SIZE,
                lowering: false
            }
        };
        
        // Château
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 6; y++) {
                this.tiles.push({
                    x: (levelWidth - 3 + x) * this.TILE_SIZE,
                    y: (6 + y) * this.TILE_SIZE,
                    type: 'castle',
                    solid: true
                });
            }
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.time = 400;
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
    }
    
    restart() {
        this.lives = 3;
        this.score = 0;
        this.coins = 0;
        this.currentWorld = 1;
        this.currentLevel = 1;
        this.powerState = 0;
        this.gameState = 'menu';
        this.generateLevel(this.currentWorld, this.currentLevel);
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updateTimer();
        this.updatePlayer();
        this.updateEnemies();
        this.updateItems();
        this.updateParticles();
        this.updateFloatingTexts();
        this.updateCamera();
        this.checkCollisions();
        this.checkLevelComplete();
    }
    
    updateTimer() {
        this.time -= 1/60;
        if (this.time <= 0) {
            this.playerDie();
        }
    }
    
    updatePlayer() {
        // Contrôles du joueur
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.player.dx = Math.max(this.player.dx - 0.5, -this.SPEED);
            this.player.facingRight = false;
        } else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.player.dx = Math.min(this.player.dx + 0.5, this.SPEED);
            this.player.facingRight = true;
        } else {
            this.player.dx *= this.FRICTION;
        }
        
        // Feu (si power-up feu)
        if ((this.keys['x'] || this.keys['X']) && this.powerState === 2) {
            this.playerFireball();
        }
        
        // Physique
        this.player.dy += this.GRAVITY;
        if (this.player.dy > 15) this.player.dy = 15;
        
        // Mouvement
        this.player.x += this.player.dx;
        this.player.y += this.player.dy;
        
        // Animation
        if (Math.abs(this.player.dx) > 0.5) {
            this.player.animTimer++;
            if (this.player.animTimer > 8) {
                this.player.animFrame = (this.player.animFrame + 1) % 3;
                this.player.animTimer = 0;
            }
        } else {
            this.player.animFrame = 0;
        }
        
        // Invulnérabilité
        if (this.player.invulnerable) {
            this.player.invulnTime--;
            if (this.player.invulnTime <= 0) {
                this.player.invulnerable = false;
            }
        }
        
        // Limites du niveau
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.y > this.canvas.height) {
            this.playerDie();
        }
    }
    
    updateEnemies() {
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            // Mouvement des ennemis
            switch (enemy.type) {
                case 'goomba':
                    enemy.x += enemy.dx;
                    enemy.dy += this.GRAVITY;
                    if (enemy.dy > 10) enemy.dy = 10;
                    enemy.y += enemy.dy;
                    break;
                    
                case 'koopa':
                    enemy.x += enemy.dx;
                    enemy.dy += this.GRAVITY;
                    if (enemy.dy > 10) enemy.dy = 10;
                    enemy.y += enemy.dy;
                    break;
                    
                case 'piranha':
                    // Mouvement vertical dans le tuyau
                    enemy.animTimer++;
                    if (enemy.animTimer > 120) {
                        enemy.direction *= -1;
                        enemy.animTimer = 0;
                    }
                    enemy.y += enemy.direction * 0.5;
                    break;
            }
            
            // Animation
            enemy.animTimer++;
            if (enemy.animTimer > 30) {
                enemy.animFrame = (enemy.animFrame + 1) % 2;
                enemy.animTimer = 0;
            }
            
            // Collision avec les murs pour les ennemis terrestres
            if (enemy.type !== 'piranha') {
                this.checkEnemyTileCollision(enemy);
            }
        }
    }
    
    updateItems() {
        for (let item of this.items) {
            if (item.collected) continue;
            
            // Animation des pièces
            if (item.type === 'coin') {
                item.animTimer++;
                if (item.animTimer > 10) {
                    item.animFrame = (item.animFrame + 1) % 4;
                    item.animTimer = 0;
                }
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.dy += 0.2; // Gravité
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateFloatingTexts() {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            text.y -= 1;
            text.life--;
            
            if (text.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }
    
    updateCamera() {
        // Suivre le joueur
        this.camera.targetX = this.player.x - this.canvas.width / 2;
        this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothing;
        
        // Limites de la caméra
        if (this.camera.x < 0) this.camera.x = 0;
    }
    
    playerJump() {
        if (this.player.onGround) {
            this.player.dy = this.JUMP_POWER;
            this.player.onGround = false;
            this.sounds.jump();
        }
    }
    
    playerFireball() {
        // Créer une boule de feu
        this.particles.push({
            x: this.player.x + (this.player.facingRight ? this.player.width : 0),
            y: this.player.y + this.player.height / 2,
            dx: this.player.facingRight ? 8 : -8,
            dy: -2,
            life: 60,
            type: 'fireball',
            width: 8,
            height: 8
        });
    }
    
    playerDie() {
        this.lives--;
        this.powerState = 0;
        
        if (this.lives <= 0) {
            this.gameState = 'gameOver';
            this.sounds.gameOver();
        } else {
            // Respawn
            this.player.x = 100;
            this.player.y = 300;
            this.player.dx = 0;
            this.player.dy = 0;
            this.player.invulnerable = true;
            this.player.invulnTime = 120;
            this.camera.x = 0;
        }
    }
    
    checkCollisions() {
        this.checkPlayerTileCollision();
        this.checkPlayerEnemyCollision();
        this.checkPlayerItemCollision();
        this.checkPlayerPipeCollision();
        this.checkPlayerFlagpole();
    }
    
    checkPlayerTileCollision() {
        this.player.onGround = false;
        
        for (let tile of this.tiles) {
            if (!tile.solid) continue;
            
            if (this.isColliding(this.player, tile)) {
                // Collision depuis le haut (joueur atterrit)
                if (this.player.dy > 0 && this.player.y < tile.y) {
                    this.player.y = tile.y - this.player.height;
                    this.player.dy = 0;
                    this.player.onGround = true;
                }
                // Collision depuis le bas (joueur frappe la tête)
                else if (this.player.dy < 0 && this.player.y > tile.y) {
                    this.player.y = tile.y + this.TILE_SIZE;
                    this.player.dy = 0;
                    
                    // Interaction avec les blocs
                    if (tile.type === 'question' && tile.hasItem) {
                        this.activateQuestionBlock(tile);
                    } else if (tile.type === 'brick' && this.powerState > 0) {
                        this.breakBrick(tile);
                    }
                }
                // Collision latérale - permettre le glissement
                else if (this.player.dx > 0 && this.player.x < tile.x) {
                    this.player.x = tile.x - this.player.width;
                } else if (this.player.dx < 0 && this.player.x > tile.x) {
                    this.player.x = tile.x + this.TILE_SIZE;
                }
            }
        }
    }
    
    checkPlayerEnemyCollision() {
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            if (this.isColliding(this.player, enemy)) {
                if (!this.player.invulnerable) {
                    // Joueur attaque l'ennemi depuis le haut
                    if (this.player.dy > 0 && this.player.y < enemy.y) {
                        this.killEnemy(enemy);
                        this.player.dy = -8; // Petit rebond
                        this.score += 100;
                        this.addFloatingText(enemy.x, enemy.y, '100');
                    } else {
                        // Joueur touché par l'ennemi
                        this.playerHit();
                    }
                }
            }
        }
    }
    
    checkPlayerItemCollision() {
        for (let item of this.items) {
            if (item.collected) continue;
            
            if (this.isColliding(this.player, item)) {
                this.collectItem(item);
            }
        }
    }
    
    checkPlayerPipeCollision() {
        for (let pipe of this.pipes) {
            if (this.isColliding(this.player, pipe)) {
                // Collision latérale
                if (this.player.dx > 0) {
                    this.player.x = pipe.x - this.player.width;
                    this.player.dx = 0;
                } else if (this.player.dx < 0) {
                    this.player.x = pipe.x + pipe.width;
                    this.player.dx = 0;
                }
                
                // Entrer dans le tuyau (flèche bas)
                if (this.keys['ArrowDown'] && pipe.warpTo) {
                    this.warpToLevel(pipe.warpTo);
                }
            }
        }
    }
    
    checkPlayerFlagpole() {
        if (this.flagpole && this.isColliding(this.player, this.flagpole)) {
            this.levelComplete();
        }
    }
    
    checkEnemyTileCollision(enemy) {
        enemy.onGround = false;
        
        for (let tile of this.tiles) {
            if (!tile.solid) continue;
            
            if (this.isColliding(enemy, tile)) {
                // Collision depuis le haut
                if (enemy.dy > 0 && enemy.y < tile.y) {
                    enemy.y = tile.y - enemy.height;
                    enemy.dy = 0;
                    enemy.onGround = true;
                }
                // Collision latérale
                else if (enemy.dx > 0) {
                    enemy.x = tile.x - enemy.width;
                    enemy.dx = -Math.abs(enemy.dx);
                } else if (enemy.dx < 0) {
                    enemy.x = tile.x + this.TILE_SIZE;
                    enemy.dx = Math.abs(enemy.dx);
                }
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + (rect2.width || this.TILE_SIZE) &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + (rect2.height || this.TILE_SIZE) &&
               rect1.y + rect1.height > rect2.y;
    }
    
    activateQuestionBlock(tile) {
        tile.hasItem = false;
        tile.type = 'empty';
        
        if (tile.itemType === 'coin') {
            this.coins++;
            this.score += 200;
            this.sounds.coin();
            this.addFloatingText(tile.x, tile.y, '200');
        } else if (tile.itemType === 'mushroom') {
            this.spawnPowerUp(tile.x, tile.y);
        }
        
        // Effet visuel
        this.createBlockParticles(tile.x, tile.y);
    }
    
    breakBrick(tile) {
        // Supprimer la brique
        const index = this.tiles.indexOf(tile);
        if (index > -1) {
            this.tiles.splice(index, 1);
        }
        
        this.score += 50;
        this.sounds.enemyKill();
        this.createBrickParticles(tile.x, tile.y);
        this.addFloatingText(tile.x, tile.y, '50');
    }
    
    spawnPowerUp(x, y) {
        const powerUp = {
            x: x,
            y: y - this.TILE_SIZE,
            width: this.TILE_SIZE,
            height: this.TILE_SIZE,
            type: this.powerState === 0 ? 'mushroom' : 'fireflower',
            dx: 2,
            dy: 0,
            collected: false
        };
        
        this.items.push(powerUp);
    }
    
    collectItem(item) {
        item.collected = true;
        
        switch (item.type) {
            case 'coin':
                this.coins++;
                this.score += 200;
                this.sounds.coin();
                this.addFloatingText(item.x, item.y, '200');
                break;
                
            case 'mushroom':
                if (this.powerState === 0) {
                    this.powerState = 1;
                    this.player.height = 48;
                    this.score += 1000;
                    this.sounds.powerUp();
                    this.addFloatingText(item.x, item.y, '1000');
                }
                break;
                
            case 'fireflower':
                this.powerState = 2;
                this.player.height = 48;
                this.score += 1000;
                this.sounds.powerUp();
                this.addFloatingText(item.x, item.y, '1000');
                break;
                
            case 'star':
                this.player.invulnerable = true;
                this.player.invulnTime = 600;
                this.score += 1000;
                this.sounds.powerUp();
                break;
        }
        
        // 1-Up tous les 100 coins
        if (this.coins >= 100) {
            this.coins -= 100;
            this.lives++;
            this.sounds.oneUp();
        }
    }
    
    killEnemy(enemy) {
        enemy.alive = false;
        this.sounds.enemyKill();
        this.createEnemyParticles(enemy.x, enemy.y);
    }
    
    playerHit() {
        if (this.powerState > 0) {
            this.powerState--;
            if (this.powerState === 0) {
                this.player.height = 32;
            }
            this.player.invulnerable = true;
            this.player.invulnTime = 120;
        } else {
            this.playerDie();
        }
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        this.sounds.levelComplete();
        
        // Bonus de temps
        const timeBonus = Math.floor(this.time) * 50;
        this.score += timeBonus;
        
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
        
        this.generateLevel(this.currentWorld, this.currentLevel);
        this.gameState = 'playing';
        this.time = 400;
    }
    
    createBlockParticles(x, y) {
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                x: x + this.TILE_SIZE / 2,
                y: y + this.TILE_SIZE / 2,
                dx: (Math.random() - 0.5) * 4,
                dy: -Math.random() * 4 - 2,
                life: 30,
                type: 'block',
                size: 4
            });
        }
    }
    
    createBrickParticles(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x + this.TILE_SIZE / 2,
                y: y + this.TILE_SIZE / 2,
                dx: (Math.random() - 0.5) * 6,
                dy: -Math.random() * 6 - 3,
                life: 40,
                type: 'brick',
                size: 6
            });
        }
    }
    
    createEnemyParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x + 12,
                y: y + 16,
                dx: (Math.random() - 0.5) * 8,
                dy: -Math.random() * 8 - 2,
                life: 25,
                type: 'enemy',
                size: 3
            });
        }
    }
    
    addFloatingText(x, y, text) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            life: 60
        });
    }
    
    checkLevelComplete() {
        // Vérifier si le joueur a atteint la fin du niveau
        if (this.player.x > (200 - 10) * this.TILE_SIZE) {
            this.levelComplete();
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#5C94FC';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sauvegarder l'état du contexte
        this.ctx.save();
        
        // Appliquer la translation de la caméra
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Rendu du niveau
        this.renderTiles();
        this.renderPipes();
        this.renderEnemies();
        this.renderItems();
        this.renderPlayer();
        this.renderParticles();
        this.renderFloatingTexts();
        this.renderFlagpole();
        
        // Restaurer l'état du contexte
        this.ctx.restore();
        
        // Rendu de l'interface utilisateur (pas affectée par la caméra)
        this.renderHUD();
        this.renderGameState();
    }
    
    renderTiles() {
        for (let tile of this.tiles) {
            // Culling - ne dessiner que les tiles visibles
            if (tile.x + this.TILE_SIZE < this.camera.x || tile.x > this.camera.x + this.canvas.width) {
                continue;
            }
            
            this.ctx.fillStyle = this.getTileColor(tile.type);
            this.ctx.fillRect(tile.x, tile.y, this.TILE_SIZE, this.TILE_SIZE);
            
            // Bordure
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(tile.x, tile.y, this.TILE_SIZE, this.TILE_SIZE);
            
            // Symbole pour les blocs spéciaux
            if (tile.type === 'question') {
                this.ctx.fillStyle = '#FFF';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('?', tile.x + this.TILE_SIZE/2, tile.y + this.TILE_SIZE/2 + 7);
            }
        }
    }
    
    renderPipes() {
        for (let pipe of this.pipes) {
            // Corps du tuyau
            this.ctx.fillStyle = '#00AA00';
            this.ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
            
            // Haut du tuyau
            this.ctx.fillStyle = '#00CC00';
            this.ctx.fillRect(pipe.x - 4, pipe.y, pipe.width + 8, this.TILE_SIZE);
            
            // Bordures
            this.ctx.strokeStyle = '#008800';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);
            this.ctx.strokeRect(pipe.x - 4, pipe.y, pipe.width + 8, this.TILE_SIZE);
        }
    }
    
    renderEnemies() {
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            const x = enemy.x;
            const y = enemy.y;
            const w = enemy.width;
            const h = enemy.height;
            
            switch (enemy.type) {
                case 'goomba':
                    // Corps brun
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(x, y + h * 0.3, w, h * 0.7);
                    
                    // Tête
                    this.ctx.fillStyle = '#D2691E';
                    this.ctx.fillRect(x + 2, y, w - 4, h * 0.6);
                    
                    // Yeux méchants
                    this.ctx.fillStyle = '#FFF';
                    this.ctx.fillRect(x + 4, y + 8, 4, 3);
                    this.ctx.fillRect(x + w - 8, y + 8, 4, 3);
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(x + 5, y + 8, 2, 3);
                    this.ctx.fillRect(x + w - 7, y + 8, 2, 3);
                    
                    // Sourcils froncés
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(x + 3, y + 6, 6, 2);
                    this.ctx.fillRect(x + w - 9, y + 6, 6, 2);
                    
                    // Crocs
                    this.ctx.fillStyle = '#FFF';
                    this.ctx.fillRect(x + 6, y + 16, 2, 3);
                    this.ctx.fillRect(x + w - 8, y + 16, 2, 3);
                    break;
                    
                case 'koopa':
                    // Carapace verte
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.fillRect(x, y + h * 0.4, w, h * 0.6);
                    
                    // Motif carapace
                    this.ctx.fillStyle = '#006400';
                    for (let i = 0; i < 3; i++) {
                        for (let j = 0; j < 2; j++) {
                            this.ctx.fillRect(x + 3 + i * 6, y + h * 0.5 + j * 6, 4, 4);
                        }
                    }
                    
                    // Tête
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.fillRect(x + 4, y, w - 8, h * 0.5);
                    
                    // Yeux
                    this.ctx.fillStyle = '#FFF';
                    this.ctx.fillRect(x + 6, y + 6, 3, 3);
                    this.ctx.fillRect(x + w - 9, y + 6, 3, 3);
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(x + 7, y + 7, 1, 1);
                    this.ctx.fillRect(x + w - 8, y + 7, 1, 1);
                    
                    // Bec
                    this.ctx.fillStyle = '#FFA500';
                    this.ctx.fillRect(x + w/2 - 1, y + 10, 2, 3);
                    break;
                    
                case 'piranha':
                    // Tige
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.fillRect(x + w/2 - 2, y + h * 0.7, 4, h * 0.3);
                    
                    // Corps de la plante
                    this.ctx.fillStyle = '#DC143C';
                    this.ctx.fillRect(x, y, w, h * 0.8);
                    
                    // Taches
                    this.ctx.fillStyle = '#8B0000';
                    this.ctx.fillRect(x + 3, y + 5, 4, 3);
                    this.ctx.fillRect(x + w - 7, y + 8, 4, 3);
                    this.ctx.fillRect(x + 2, y + 12, 3, 2);
                    
                    // Bouche ouverte
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(x + 4, y + h * 0.4, w - 8, h * 0.2);
                    
                    // Dents
                    this.ctx.fillStyle = '#FFF';
                    for (let i = 0; i < 3; i++) {
                        this.ctx.fillRect(x + 6 + i * 4, y + h * 0.35, 2, 4);
                        this.ctx.fillRect(x + 6 + i * 4, y + h * 0.55, 2, 4);
                    }
                    break;
            }
            
            // Bordure
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, w, h);
        }
    }
    
    renderItems() {
        for (let item of this.items) {
            if (item.collected) continue;
            
            this.ctx.fillStyle = this.getItemColor(item.type);
            this.ctx.fillRect(item.x, item.y, item.width || this.TILE_SIZE, item.height || this.TILE_SIZE);
            
            // Symbole de l'item
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            
            const symbol = this.getItemSymbol(item.type);
            this.ctx.fillText(symbol, item.x + (item.width || this.TILE_SIZE)/2, item.y + (item.height || this.TILE_SIZE)/2 + 5);
        }
    }
    
    renderPlayer() {
        // Clignotement si invulnérable
        if (this.player.invulnerable && Math.floor(this.player.invulnTime / 5) % 2 === 0) {
            return;
        }

        const x = this.player.x;
        const y = this.player.y;
        const w = this.player.width;
        const h = this.player.height;
        
        // Corps de Mario avec dégradé
        const gradient = this.ctx.createLinearGradient(x, y, x, y + h);
        if (this.powerState === 0) {
            gradient.addColorStop(0, '#FF6B6B');
            gradient.addColorStop(1, '#DC143C');
        } else if (this.powerState === 1) {
            gradient.addColorStop(0, '#FF6B6B');
            gradient.addColorStop(0.5, '#4169E1');
            gradient.addColorStop(1, '#DC143C');
        } else {
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(0.5, '#FF6B6B');
            gradient.addColorStop(1, '#DC143C');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, w, h);
        
        // Casquette
        this.ctx.fillStyle = '#8B0000';
        this.ctx.fillRect(x + 2, y, w - 4, h * 0.3);
        
        // Logo M sur la casquette
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('M', x + w/2, y + h * 0.2);
        
        // Yeux
        const eyeSize = 2;
        const eyeY = y + h * 0.35;
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(x + 4, eyeY, eyeSize * 2, eyeSize);
        this.ctx.fillRect(x + w - 6 - eyeSize, eyeY, eyeSize * 2, eyeSize);
        
        // Pupilles (direction)
        this.ctx.fillStyle = '#000';
        const pupilX1 = this.player.facingRight ? x + 5 : x + 4;
        const pupilX2 = this.player.facingRight ? x + w - 5 : x + w - 6;
        this.ctx.fillRect(pupilX1, eyeY, eyeSize, eyeSize);
        this.ctx.fillRect(pupilX2, eyeY, eyeSize, eyeSize);
        
        // Nez
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.fillRect(x + w/2 - 1, y + h * 0.45, 2, 3);
        
        // Moustache
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x + 3, y + h * 0.55, w - 6, 2);
        
        // Salopette (si grand Mario)
        if (this.powerState > 0) {
            this.ctx.fillStyle = '#0000FF';
            this.ctx.fillRect(x + 2, y + h * 0.7, w - 4, h * 0.3);
            
            // Boutons
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(x + 4, y + h * 0.75, 2, 2);
            this.ctx.fillRect(x + w - 6, y + h * 0.75, 2, 2);
        }
        
        // Bordure
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, w, h);
        
        // Effet de puissance feu
        if (this.powerState === 2) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#FF4500';
            for (let i = 0; i < 3; i++) {
                const flameX = x + Math.random() * w;
                const flameY = y + Math.random() * h;
                this.ctx.fillRect(flameX, flameY, 2, 2);
            }
            this.ctx.restore();
        }
    }
    
    renderParticles() {
        for (let particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life / 30;
            
            if (particle.type === 'fireball') {
                this.ctx.fillStyle = '#FF4500';
                this.ctx.fillRect(particle.x, particle.y, particle.width, particle.height);
            } else {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            }
            
            this.ctx.restore();
        }
    }
    
    renderFloatingTexts() {
        for (let text of this.floatingTexts) {
            this.ctx.save();
            this.ctx.globalAlpha = text.life / 60;
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(text.text, text.x, text.y);
            this.ctx.fillText(text.text, text.x, text.y);
            this.ctx.restore();
        }
    }
    
    renderFlagpole() {
        if (!this.flagpole) return;
        
        // Mât
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.flagpole.x, this.flagpole.y, 8, this.flagpole.height);
        
        // Drapeau
        this.ctx.fillStyle = '#00AA00';
        this.ctx.fillRect(this.flagpole.x + 8, this.flagpole.flag.y, 24, 16);
        
        // Château (déjà rendu dans les tiles)
    }
    
    renderHUD() {
        // Fond pour le HUD
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, 40);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        
        // Score
        this.ctx.fillText(`Score: ${this.score.toString().padStart(6, '0')}`, 10, 25);
        
        // Pièces
        this.ctx.fillText(`Coins: ${this.coins.toString().padStart(2, '0')}`, 150, 25);
        
        // Monde et niveau
        this.ctx.fillText(`World: ${this.currentWorld}-${this.currentLevel}`, 250, 25);
        
        // Temps
        this.ctx.fillText(`Time: ${Math.ceil(this.time)}`, 380, 25);
        
        // Vies
        this.ctx.fillText(`Lives: ${this.lives}`, 480, 25);
        
        // Power state
        const powerText = ['Small', 'Super', 'Fire'][this.powerState];
        this.ctx.fillText(`Power: ${powerText}`, 580, 25);
    }
    
    renderGameState() {
        switch (this.gameState) {
            case 'menu':
                this.renderMenu();
                break;
            case 'paused':
                this.renderPause();
                break;
            case 'gameOver':
                this.renderGameOver();
                break;
            case 'levelComplete':
                this.renderLevelComplete();
                break;
        }
    }
    
    renderMenu() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SUPER MARIO BROS', this.canvas.width/2, this.canvas.height/2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Appuyez sur ESPACE pour commencer', this.canvas.width/2, this.canvas.height/2 + 20);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Flèches: Déplacer | ESPACE: Sauter | X: Boule de feu | P: Pause', this.canvas.width/2, this.canvas.height/2 + 60);
    }
    
    renderPause() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSE', this.canvas.width/2, this.canvas.height/2);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Appuyez sur P pour reprendre', this.canvas.width/2, this.canvas.height/2 + 40);
    }
    
    renderGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width/2, this.canvas.height/2 - 30);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score Final: ${this.score}`, this.canvas.width/2, this.canvas.height/2 + 10);
        this.ctx.fillText(`Monde Atteint: ${this.currentWorld}-${this.currentLevel}`, this.canvas.width/2, this.canvas.height/2 + 40);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Appuyez sur R pour recommencer', this.canvas.width/2, this.canvas.height/2 + 80);
    }
    
    renderLevelComplete() {
        this.ctx.fillStyle = 'rgba(0, 100, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NIVEAU TERMINÉ!', this.canvas.width/2, this.canvas.height/2 - 30);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Bonus de temps: ${Math.floor(this.time) * 50}`, this.canvas.width/2, this.canvas.height/2 + 10);
        this.ctx.fillText('Prochain niveau...', this.canvas.width/2, this.canvas.height/2 + 40);
    }
    
    // Méthodes utilitaires pour les couleurs
    getTileColor(type) {
        const colors = {
            ground: '#8B4513',
            dirt: '#654321',
            brick: '#B22222',
            question: '#FFD700',
            empty: '#8B4513',
            castle: '#808080'
        };
        return colors[type] || '#888';
    }
    
    getEnemyColor(type) {
        const colors = {
            goomba: '#8B4513',
            koopa: '#00AA00',
            piranha: '#228B22'
        };
        return colors[type] || '#888';
    }
    
    getItemColor(type) {
        const colors = {
            coin: '#FFD700',
            mushroom: '#FF4500',
            fireflower: '#FF69B4',
            star: '#FFD700'
        };
        return colors[type] || '#888';
    }
    
    getItemSymbol(type) {
        const symbols = {
            coin: '○',
            mushroom: '🍄',
            fireflower: '🌸',
            star: '⭐'
        };
        return symbols[type] || '?';
    }
    
    getPlayerColor() {
        if (this.powerState === 2) return '#FF4500'; // Fire Mario
        if (this.powerState === 1) return '#FF0000'; // Super Mario
        return '#0000FF'; // Small Mario
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialisation du jeu
let marioGame;

document.addEventListener('DOMContentLoaded', function() {
    marioGame = new SuperMarioGame('gameCanvas');
    
    // Bouton restart depuis l'interface
    document.getElementById('restartBtn').addEventListener('click', function() {
        document.getElementById('gameMessage').style.display = 'none';
        marioGame.restart();
    });
});
