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
        this.time = 400;
        
        // Initialiser les systèmes
        this.audioSystem = new MarioAudio();
        this.levelManager = new MarioLevelManager(this);
        this.entityManager = new MarioEntityManager(this);
        this.uiManager = new MarioUI(this);
        this.inputManager = new MarioInput(this);
        
        // Charger le premier niveau
        this.loadLevel(1);
        
        // Démarrer la musique de fond
        this.audioSystem.playBackgroundMusic('overworld');
    }
    
    loadLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.levelManager.loadLevel(levelNumber);
        this.entityManager.reset();
        
        // Créer Mario
        this.mario = new Mario(this, 100, this.WORLD_HEIGHT - 200);
        this.entityManager.addEntity(this.mario);
        
        // Générer les ennemis et objets pour ce niveau
        this.levelManager.populateLevel();
        
        console.log(`Niveau ${levelNumber} chargé`);
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
        // Effacer l'écran
        this.ctx.fillStyle = '#5C94FC'; // Bleu ciel Mario
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sauvegarder le contexte pour la caméra
        this.ctx.save();
        this.ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));
        
        // Dessiner le niveau
        this.levelManager.render(this.ctx);
        
        // Dessiner les entités
        this.entityManager.render(this.ctx);
        
        // Restaurer le contexte
        this.ctx.restore();
        
        // Dessiner l'UI (pas affectée par la caméra)
        this.uiManager.render(this.ctx);
    }
    
    gameLoop(currentTime) {
        if (!this.gameRunning) return;
        
        const deltaTime = Math.min(currentTime - (this.lastTime || currentTime), 1000/30);
        this.lastTime = currentTime;
        
        // Appliquer le multiplicateur de vitesse
        const adjustedDelta = deltaTime * this.SPEED_MULTIPLIER;
        
        this.update(adjustedDelta);
        this.render();
        
        this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    start() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.audioSystem.playBackgroundMusic('overworld');
        this.gameLoop(performance.now());
        console.log('Mario démarré !');
    }
    
    stop() {
        this.gameRunning = false;
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        this.audioSystem.stopAllSounds();
        console.log('Mario arrêté !');
    }
    
    pause() {
        this.gameState = this.gameState === 'paused' ? 'playing' : 'paused';
        if (this.gameState === 'paused') {
            this.audioSystem.pauseBackgroundMusic();
        } else {
            this.audioSystem.resumeBackgroundMusic();
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.audioSystem.playSound('gameOver');
        this.audioSystem.stopBackgroundMusic();
        console.log('Game Over !');
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        this.audioSystem.playSound('levelComplete');
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
        this.audioSystem.playSound('coin');
        this.addScore(200 * amount);
        
        // 100 pièces = 1 vie
        if (this.coins >= 100) {
            this.coins -= 100;
            this.addLife();
        }
    }
    
    addLife() {
        this.lives++;
        this.audioSystem.playSound('1up');
    }
    
    loseLife() {
        this.lives--;
        this.audioSystem.playSound('death');
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn Mario
            this.mario.respawn();
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
}

// Export pour utilisation dans d'autres modules
window.MarioGame = MarioGame;
