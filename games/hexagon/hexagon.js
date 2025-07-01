/**
 * SUPER HEXAGON CYBERPUNK - JEU DE RÉFLEXES EXTRÊME
 * Style cyberpunk avec effets visuels époustouflants
 */

class SuperHexagon {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration du jeu
        this.CENTER_X = this.canvas.width / 2;
        this.CENTER_Y = this.canvas.height / 2;
        this.HEX_RADIUS = 60;
        this.PLAYER_SIZE = 8;
        this.ROTATION_SPEED = 4;
        
        // État du jeu
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.difficulty = 'easy';
        this.time = 0;
        this.bestTime = parseFloat(localStorage.getItem('hexagonBestTime') || '0');
        this.level = 1;
        
        // Joueur
        this.player = {
            angle: 0,
            targetAngle: 0,
            position: 0, // 0-5 pour les 6 côtés
            radius: this.HEX_RADIUS + 20
        };
        
        // Obstacles
        this.obstacles = [];
        this.obstacleSpeed = 1;
        this.spawnTimer = 0;
        this.spawnRate = 120; // frames
        
        // Contrôles
        this.keys = {};
        
        // Effets visuels
        this.particles = [];
        this.hexRotation = 0;
        this.pulseEffect = 0;
        this.backgroundRotation = 0;
        this.colorShift = 0;
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        
        // Paramètres de difficulté
        this.difficultySettings = {
            easy: { speed: 1, spawnRate: 150, colors: ['#00ffff', '#ff6600'] },
            normal: { speed: 1.5, spawnRate: 120, colors: ['#00ffff', '#ff6600', '#ff007f'] },
            hard: { speed: 2, spawnRate: 90, colors: ['#00ffff', '#ff6600', '#ff007f', '#8b00ff'] },
            insane: { speed: 3, spawnRate: 60, colors: ['#00ffff', '#ff6600', '#ff007f', '#8b00ff', '#ffff00'] }
        };
        
        // Audio simulation
        this.sounds = {
            move: () => this.createSoundEffect('move'),
            death: () => this.createSoundEffect('death'),
            levelUp: () => this.createSoundEffect('levelUp')
        };
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.setupEventListeners();
        this.resizeCanvas();
        this.updateBestTimeDisplay();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.gameLoop();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const size = Math.min(600, Math.min(rect.width, rect.height) - 40);
        
        this.canvas.width = size;
        this.canvas.height = size;
        
        this.CENTER_X = this.canvas.width / 2;
        this.CENTER_Y = this.canvas.height / 2;
    }
    
    setupEventListeners() {
        // Variables pour éviter les répétitions
        this.lastMoveTime = 0;
        this.moveDelay = 150; // millisecondes entre les mouvements
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
            
            if (e.key === 'Escape') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
            
            if (e.key.toLowerCase() === 'r' && this.gameState === 'playing') {
                this.restartGame();
            }
            
            // Gestion des mouvements avec délai
            const currentTime = Date.now();
            if (currentTime - this.lastMoveTime > this.moveDelay && this.gameState === 'playing') {
                if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.movePlayer(-1);
                    this.lastMoveTime = currentTime;
                }
                if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.movePlayer(1);
                    this.lastMoveTime = currentTime;
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    movePlayer(direction) {
        this.player.position = (this.player.position + direction + 6) % 6;
        this.player.targetAngle = this.player.position * (Math.PI / 3);
        this.sounds.move();
    }
    
    selectDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        // Mettre à jour l'interface
        document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(difficulty + 'Btn').classList.add('active');
    }
    
    startGame() {
        this.gameState = 'playing';
        this.time = 0;
        this.level = 1;
        this.obstacles = [];
        this.particles = [];
        this.spawnTimer = 0;
        
        // Appliquer les paramètres de difficulté
        const settings = this.difficultySettings[this.difficulty];
        this.obstacleSpeed = settings.speed;
        this.spawnRate = settings.spawnRate;
        
        this.player.angle = 0;
        this.player.targetAngle = 0;
        this.player.position = 0;
        
        this.hideAllOverlays();
        this.updateDisplay();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pauseOverlay').style.display = 'flex';
    }
    
    resumeGame() {
        this.gameState = 'playing';
        this.hideAllOverlays();
    }
    
    restartGame() {
        this.startGame();
    }
    
    showMenu() {
        this.gameState = 'menu';
        this.hideAllOverlays();
        document.getElementById('menuOverlay').style.display = 'flex';
    }
    
    hideAllOverlays() {
        document.getElementById('menuOverlay').style.display = 'none';
        document.getElementById('pauseOverlay').style.display = 'none';
        document.getElementById('gameOverOverlay').style.display = 'none';
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Vérifier nouveau record
        let isNewRecord = false;
        if (this.time > this.bestTime) {
            this.bestTime = this.time;
            localStorage.setItem('hexagonBestTime', this.bestTime.toString());
            isNewRecord = true;
        }
        
        document.getElementById('finalTime').textContent = this.time.toFixed(1) + 's';
        document.getElementById('newRecordText').textContent = isNewRecord ? 
            '🏆 NOUVEAU RECORD!' : `Record: ${this.bestTime.toFixed(1)}s`;
        
        document.getElementById('gameOverOverlay').style.display = 'flex';
        
        this.sounds.death();
        this.createDeathEffect();
        this.shakeScreen(20);
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.time += 1/60; // 60 FPS
        this.updatePlayer();
        this.updateObstacles();
        this.updateParticles();
        this.updateEffects();
        this.checkCollisions();
        this.spawnObstacles();
        this.updateLevel();
        this.updateDisplay();
    }
    
    updatePlayer() {
        // Interpolation smooth de l'angle
        const angleDiff = this.player.targetAngle - this.player.angle;
        const adjustedDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;
        this.player.angle += adjustedDiff * 0.15; // Plus smooth
    }
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            obstacle.radius -= this.obstacleSpeed;
            
            // Supprimer si trop près du centre
            if (obstacle.radius < this.HEX_RADIUS) {
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    spawnObstacles() {
        this.spawnTimer++;
        
        if (this.spawnTimer >= this.spawnRate) {
            this.spawnTimer = 0;
            
            // Créer un nouvel obstacle
            const numSegments = Math.floor(Math.random() * 3) + 1; // 1-3 segments
            const startPos = Math.floor(Math.random() * 6);
            const colors = this.difficultySettings[this.difficulty].colors;
            
            for (let i = 0; i < numSegments; i++) {
                const position = (startPos + i) % 6;
                
                this.obstacles.push({
                    position: position,
                    radius: this.canvas.width,
                    width: 40,
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
            }
        }
    }
    
    updateLevel() {
        const newLevel = Math.floor(this.time / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.sounds.levelUp();
            this.createLevelUpEffect();
            
            // Augmenter la difficulté
            this.obstacleSpeed += 0.1;
            this.spawnRate = Math.max(30, this.spawnRate - 5);
        }
    }
    
    checkCollisions() {
        const playerRadius = this.player.radius;
        const playerAngle = this.player.angle;
        
        for (const obstacle of this.obstacles) {
            if (Math.abs(obstacle.radius - playerRadius) < 15) {
                // Vérifier si le joueur est dans le même segment
                const obstacleAngle = obstacle.position * (Math.PI / 3);
                const angleDiff = Math.abs(((playerAngle - obstacleAngle + Math.PI) % (2 * Math.PI)) - Math.PI);
                
                if (angleDiff < Math.PI / 6) { // Dans le segment
                    this.gameOver();
                    return;
                }
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.life--;
            particle.size *= 0.98;
            
            if (particle.life <= 0 || particle.size < 0.5) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateEffects() {
        this.hexRotation += 0.01;
        this.pulseEffect = Math.sin(Date.now() * 0.005) * 10;
        this.backgroundRotation += 0.002;
        this.colorShift = (Date.now() * 0.001) % (Math.PI * 2);
        
        // Screen shake
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.intensity *= 0.9;
        }
    }
    
    updateDisplay() {
        document.getElementById('timeValue').textContent = this.time.toFixed(1) + 's';
        document.getElementById('levelValue').textContent = this.level;
    }
    
    updateBestTimeDisplay() {
        document.getElementById('bestTime').textContent = this.bestTime.toFixed(1) + 's';
    }
    
    // Effets visuels
    createDeathEffect() {
        const playerX = this.CENTER_X + Math.cos(this.player.angle) * this.player.radius;
        const playerY = this.CENTER_Y + Math.sin(this.player.angle) * this.player.radius;
        
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: playerX,
                y: playerY,
                dx: (Math.random() - 0.5) * 15,
                dy: (Math.random() - 0.5) * 15,
                life: 60,
                size: Math.random() * 6 + 2,
                color: '#ff0000'
            });
        }
    }
    
    createLevelUpEffect() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.CENTER_X + (Math.random() - 0.5) * 100,
                y: this.CENTER_Y + (Math.random() - 0.5) * 100,
                dx: (Math.random() - 0.5) * 10,
                dy: (Math.random() - 0.5) * 10,
                life: 90,
                size: Math.random() * 8 + 3,
                color: '#ffff00'
            });
        }
    }
    
    shakeScreen(intensity) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    }
    
    createSoundEffect(type) {
        const sounds = {
            move: '🔄 *Click*',
            death: '💀 *CRASH*',
            levelUp: '⭐ *Level Up*'
        };
        console.log(sounds[type]);
    }
    
    render() {
        // Nettoyage avec fond animé
        const gradient = this.ctx.createRadialGradient(
            this.CENTER_X, this.CENTER_Y, 0,
            this.CENTER_X, this.CENTER_Y, this.canvas.width
        );
        gradient.addColorStop(0, '#000015');
        gradient.addColorStop(1, '#000005');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Appliquer screen shake
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        
        // Fond rotatif
        this.renderRotatingBackground();
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.renderHexagon();
            this.renderObstacles();
            this.renderPlayer();
            this.renderParticles();
            
            if (this.gameState === 'paused') {
                this.renderPauseOverlay();
            }
        }
        
        this.ctx.restore();
    }
    
    renderRotatingBackground() {
        this.ctx.save();
        this.ctx.translate(this.CENTER_X, this.CENTER_Y);
        this.ctx.rotate(this.backgroundRotation);
        
        // Lignes radiantes
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(Math.cos(angle) * this.canvas.width, Math.sin(angle) * this.canvas.width);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    renderHexagon() {
        this.ctx.save();
        this.ctx.translate(this.CENTER_X, this.CENTER_Y);
        this.ctx.rotate(this.hexRotation);
        
        // Hexagone central avec effet pulsant
        const radius = this.HEX_RADIUS + this.pulseEffect;
        
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 20;
        
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
    
    renderObstacles() {
        for (const obstacle of this.obstacles) {
            this.ctx.save();
            this.ctx.translate(this.CENTER_X, this.CENTER_Y);
            
            const startAngle = obstacle.position * (Math.PI / 3) - Math.PI / 6;
            const endAngle = startAngle + Math.PI / 3;
            
            this.ctx.fillStyle = obstacle.color;
            this.ctx.shadowColor = obstacle.color;
            this.ctx.shadowBlur = 15;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, obstacle.radius, startAngle, endAngle);
            this.ctx.arc(0, 0, obstacle.radius - obstacle.width, endAngle, startAngle, true);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            this.ctx.restore();
        }
    }
    
    renderPlayer() {
        const x = this.CENTER_X + Math.cos(this.player.angle) * this.player.radius;
        const y = this.CENTER_Y + Math.sin(this.player.angle) * this.player.radius;
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.PLAYER_SIZE, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Triangle pointant vers le centre
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(this.player.angle + Math.PI);
        
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.moveTo(this.PLAYER_SIZE, 0);
        this.ctx.lineTo(-this.PLAYER_SIZE / 2, -this.PLAYER_SIZE / 2);
        this.ctx.lineTo(-this.PLAYER_SIZE / 2, this.PLAYER_SIZE / 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
    
    renderParticles() {
        for (const particle of this.particles) {
            const alpha = particle.life / 60;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 10;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }
    
    renderPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Fonctions globales pour l'interface
function selectDifficulty(difficulty) {
    if (window.game) {
        window.game.selectDifficulty(difficulty);
    }
}

function startGame() {
    if (window.game) {
        window.game.startGame();
    }
}

function resumeGame() {
    if (window.game) {
        window.game.resumeGame();
    }
}

function restartGame() {
    if (window.game) {
        window.game.restartGame();
    }
}

function showMenu() {
    if (window.game) {
        window.game.showMenu();
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SuperHexagon();
});
