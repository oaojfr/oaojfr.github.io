/**
 * Super Mario Bros - Jeu principal
 * Architecture modulaire avec toutes les mécaniques classiques
 */

class MarioGame {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        this.gameRunning = false;
        this.gameLoopId = null;
        
        // Configuration du jeu
        this.TILE_SIZE = 32;
        this.GRAVITY = 0.8;
        this.FRICTION = 0.85;
        this.JUMP_POWER = -15;
        this.SPEED_MULTIPLIER = 1;
        
        // Dimensions du monde
        this.WORLD_WIDTH = 200 * this.TILE_SIZE; // Niveau très large
        this.WORLD_HEIGHT = 15 * this.TILE_SIZE;
        
        // Caméra
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            smoothing: 0.1
        };
        
        // État du jeu
        this.gameState = 'playing'; // playing, paused, gameOver, levelComplete
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 3;
        this.coins = 0;
        this.time = 400; // Temps initial en secondes
        this.timeWarning = false;
        
        // Système de checkpoints
        this.checkpoint = {
            active: false,
            x: 0,
            y: 0,
            level: 1,
            levelType: 'overworld',
            coins: 0,
            score: 0,
            powerState: 0
        };
        
        // Système de sauvegarde
        this.saveSystem = new MarioSaveSystem(this);
        this.saveSystem.enableAutoSave(2); // Sauvegarde automatique toutes les 2 minutes
        
        // Transitions
        this.isTransitioning = false;
        this.transitionData = null;
          // Initialiser les systèmes
        this.audioManager = new MarioAudioManager();
        this.levelManager = new MarioLevelManager(this);
        this.entityManager = new MarioEntityManager(this);
        this.ui = new MarioUI(this);
        this.inputManager = new MarioInputManager(this);
        
        // Charger le premier niveau
        this.startLevel(1);
        
        console.log('MarioGame initialisé avec succès');
    }
      startLevel(levelNumber) {
        console.log(`Démarrage du niveau ${levelNumber}`);
        
        // Réinitialiser les entités
        this.entityManager.clear();
        
        // Charger le niveau
        this.levelManager.loadLevel(levelNumber);
        
        // Créer Mario
        this.createMario();
        
        // Générer les ennemis du niveau
        this.generateLevelEnemies(levelNumber);
        
        // Réinitialiser la caméra
        this.camera.x = 0;
        this.camera.y = 0;
        
        // Réinitialiser le temps
        this.time = 400;
        this.timeWarning = false;
        
        // Afficher le début du niveau
        this.ui.showLevelStart(levelNumber);
        
        // Changer l'état du jeu
        this.gameState = 'playing';
        this.currentLevel = levelNumber;
        
        // Démarrer la musique de fond
        this.audioManager.playBackgroundMusic('overworld');
        
        console.log(`Niveau ${levelNumber} démarré`);
    }
    
    createMario() {
        this.mario = new Mario(this, 100, this.WORLD_HEIGHT - 200);
        this.entityManager.addEntity(this.mario);
        console.log('Mario créé');
    }
    
    generateLevelEnemies(levelNumber) {
        // Générer des ennemis selon le niveau
        const groundY = this.WORLD_HEIGHT - 3 * this.TILE_SIZE;
        
        // Goombas de base
        for (let i = 0; i < 3 + levelNumber; i++) {
            const x = 300 + i * 200 + Math.random() * 100;
            const goomba = new Goomba(this, x, groundY);
            this.entityManager.addEntity(goomba);
        }
        
        // Koopas
        for (let i = 0; i < 2 + Math.floor(levelNumber / 2); i++) {
            const x = 500 + i * 300 + Math.random() * 100;
            const koopa = new Koopa(this, x, groundY);
            this.entityManager.addEntity(koopa);
        }
        
        console.log(`Ennemis générés pour le niveau ${levelNumber}`);
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Mettre à jour le timer
        this.time -= deltaTime / 1000;
        if (this.time <= 0) {
            this.gameOver();
            return;
        }
        
        // Mettre à jour les entités
        this.entityManager.update(deltaTime);
        
        // Mettre à jour la caméra
        this.updateCamera();
        
        // Vérifier les conditions de fin de niveau
        this.checkLevelComplete();
    }
    
    updateCamera() {
        // Suivre Mario avec un offset
        this.camera.targetX = this.mario.x - this.canvas.width / 3;
        
        // Limiter la caméra aux bordures du niveau
        this.camera.targetX = Math.max(0, this.camera.targetX);
        this.camera.targetX = Math.min(this.WORLD_WIDTH - this.canvas.width, this.camera.targetX);
        
        // Interpolation fluide
        this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothing;
        
        // La caméra ne descend jamais en dessous du sol
        this.camera.y = Math.max(0, this.WORLD_HEIGHT - this.canvas.height);
    }
    
    render() {
        // Effacer le canvas
        this.ctx.fillStyle = this.getBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Rendu du niveau
        this.levelManager.render(this.ctx);
        
        // Rendu des entités
        this.entityManager.render(this.ctx);
          // Rendu de l'interface utilisateur
        this.ui.render(this.ctx);
        
        // Effet de transition
        if (this.isTransitioning) {
            this.renderTransitionEffect();
        }
    }
    
    getBackgroundColor() {
        if (this.levelManager.isUnderground) {
            return '#000011'; // Bleu très foncé pour les niveaux souterrains
        }
        return '#5C94FC'; // Bleu ciel pour les niveaux extérieurs
    }
    
    renderTransitionEffect() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Transition...', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    start() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.lastTime = 0;
        
        console.log('Démarrage du jeu Mario...');
        
        const gameLoop = (currentTime) => {
            if (!this.gameRunning) return;
            
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            // Limiter le deltaTime pour éviter les gros sauts
            const clampedDelta = Math.min(deltaTime, 16);
            
            this.update(clampedDelta);
            this.render();
            
            this.gameLoopId = requestAnimationFrame(gameLoop);
        };
        
        this.gameLoopId = requestAnimationFrame(gameLoop);
        console.log('Jeu démarré avec succès');
    }
    
    stop() {
        this.gameRunning = false;
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        this.audioManager.stopBackgroundMusic();
        console.log('Jeu arrêté');
    }
    
    pause() {
        this.gameState = this.gameState === 'paused' ? 'playing' : 'paused';
        if (this.gameState === 'paused') {
            this.audioManager.pauseBackgroundMusic();
        } else {
            this.audioManager.resumeBackgroundMusic();
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.audioManager.stopBackgroundMusic();
        this.ui.showGameOver();
        
        // Sauvegarder le high score
        if (this.saveSystem.isNewHighScore(this.score)) {
            this.saveSystem.saveHighScore(this.score, this.currentLevel);
            this.ui.showMessage('NOUVEAU RECORD !', 3000, '28px Arial');
        }
        
        console.log(`Game Over - Score final: ${this.score}`);
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        this.audioManager.playSFX('levelComplete');
        this.score += Math.floor(this.time) * 50; // Bonus de temps
        
        // Charger le niveau suivant après un délai
        setTimeout(() => {
            this.loadLevel(this.currentLevel + 1);
            this.gameState = 'playing';
        }, 3000);
    }
    
    checkLevelComplete() {
        // Vérifier si Mario a atteint le drapeau de fin
        if (this.mario.x >= this.WORLD_WIDTH - 200) {
            this.levelComplete();
        }
    }
    
    addScore(points) {
        this.score += points;
    }
    
    addCoins(amount = 1) {
        this.coins += amount;
        this.audioManager.playSFX('coin');
        this.addScore(200 * amount);
        
        // 100 pièces = 1 vie
        if (this.coins >= 100) {
            this.coins -= 100;
            this.addLife();
        }
    }
    
    addLife() {
        this.lives++;
        this.audioManager.playSFX('1up');
    }
    
    loseLife() {
        this.lives--;
        this.ui.showLifeLost();
        this.audioManager.playSFX('death');
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn au checkpoint ou au début du niveau
            setTimeout(() => {
                this.respawnAtCheckpoint();
            }, 2000);
        }
    }
    
    setSpeedMultiplier(multiplier) {
        this.SPEED_MULTIPLIER = Math.max(0.1, Math.min(3, multiplier));
    }
    
    getWorldPosition(screenX, screenY) {
        return {
            x: screenX + this.camera.x,
            y: screenY + this.camera.y
        };
    }
    
    getScreenPosition(worldX, worldY) {
        return {
            x: worldX - this.camera.x,
            y: worldY - this.camera.y
        };
    }
    
    startLevel(levelNumber) {
        console.log(`Démarrage du niveau ${levelNumber}`);
        
        // Réinitialiser les entités
        this.entityManager.clear();
        
        // Charger le niveau
        this.levelManager.loadLevel(levelNumber);
        
        // Créer Mario
        this.createMario();
        
        // Générer les ennemis du niveau
        this.generateLevelEnemies(levelNumber);
        
        // Réinitialiser la caméra
        this.camera.x = 0;
        this.camera.y = 0;
        
        // Réinitialiser le temps
        this.time = 400;
        this.timeWarning = false;
        
        // Afficher le début du niveau
        this.ui.showLevelStart(levelNumber);
        
        // Changer l'état du jeu
        this.gameState = 'playing';
        this.currentLevel = levelNumber;
        
        console.log(`Niveau ${levelNumber} démarré`);
    }
    
    startLevelWithType(levelNumber, levelType = 'overworld') {
        console.log(`Démarrage du niveau ${levelNumber} (${levelType})`);
        
        // Réinitialiser les entités
        this.entityManager.clear();
        
        // Charger le niveau avec le type spécifié
        this.levelManager.loadLevel(levelNumber, levelType);
        
        // Créer Mario
        this.createMario();
        
        // Générer les ennemis du niveau
        this.generateLevelEnemies(levelNumber);
        
        // Réinitialiser la caméra
        this.camera.x = 0;
        this.camera.y = 0;
        
        // Réinitialiser le temps
        this.time = 400;
        this.timeWarning = false;
        
        // Afficher le début du niveau
        const levelName = levelType === 'underground' ? `NIVEAU ${levelNumber} SOUTERRAIN` : `NIVEAU ${levelNumber}`;
        this.ui.showMessage(levelName, 2000, '24px Arial');
        
        // Musique selon le type de niveau
        if (this.levelManager.isUnderground) {
            this.audioManager.playBackgroundMusic('underground');
        } else {
            this.audioManager.playBackgroundMusic('overworld');
        }
        
        // Changer l'état du jeu
        this.gameState = 'playing';
        this.currentLevel = levelNumber;
        
        console.log(`Niveau ${levelNumber} (${levelType}) démarré`);
    }
    
    transitionToLevel(levelIdentifier, targetX = null, targetY = null) {
        console.log(`Transition vers ${levelIdentifier}`);
        
        this.isTransitioning = true;
        this.transitionData = {
            levelIdentifier,
            targetX,
            targetY
        };
        
        // Fade out
        setTimeout(() => {
            this.executeTransition();
        }, 500);
    }
    
    executeTransition() {
        const { levelIdentifier, targetX, targetY } = this.transitionData;
        
        // Parser l'identifiant du niveau (ex: "1-underground", "2")
        let levelNumber, levelType;
        
        if (levelIdentifier.includes('-')) {
            const parts = levelIdentifier.split('-');
            levelNumber = parseInt(parts[0]);
            levelType = parts[1];
        } else {
            levelNumber = parseInt(levelIdentifier);
            levelType = 'overworld';
        }
        
        // Démarrer le nouveau niveau
        this.startLevelWithType(levelNumber, levelType);
        
        // Positionner Mario si des coordonnées sont spécifiées
        if (targetX !== null && targetY !== null) {
            this.mario.x = targetX * this.levelManager.TILE_SIZE;
            this.mario.y = targetY * this.levelManager.TILE_SIZE;
            this.camera.x = Math.max(0, this.mario.x - this.canvas.width / 2);
        }
        
        this.isTransitioning = false;
        this.transitionData = null;
    }
    
    setCheckpoint(x, y) {
        this.checkpoint = {
            active: true,
            x: x,
            y: y,
            level: this.currentLevel,
            levelType: this.levelManager.levelType,
            coins: this.coins,
            score: this.score,
            powerState: this.mario ? this.mario.powerState : 0
        };
        
        console.log('Checkpoint sauvegardé:', this.checkpoint);
    }
    
    respawnAtCheckpoint() {
        if (!this.checkpoint.active) {
            this.resetGame();
            return;
        }
        
        console.log('Respawn au checkpoint:', this.checkpoint);
        
        // Restaurer le niveau et la position
        this.startLevelWithType(this.checkpoint.level, this.checkpoint.levelType);
        
        // Restaurer la position de Mario
        this.mario.x = this.checkpoint.x;
        this.mario.y = this.checkpoint.y;
        this.mario.powerState = this.checkpoint.powerState;
        
        // Restaurer les stats partiellement
        this.coins = this.checkpoint.coins;
        this.score = this.checkpoint.score;
        
        // Positionner la caméra
        this.camera.x = Math.max(0, this.mario.x - this.canvas.width / 2);
        
        this.ui.showMessage('RESPAWN AU CHECKPOINT', 1500);
    }
}

// Export pour utilisation dans d'autres modules
window.MarioGame = MarioGame;
