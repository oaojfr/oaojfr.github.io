/**
 * PONG MODERN CYBERPUNK - JEU DE TENNIS DE TABLE FUTURISTE
 * Modes 1 joueur (vs IA) et 2 joueurs avec design cyberpunk
 */

class PongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // État du jeu
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.gameMode = 'ai'; // ai ou human
        this.score = { player1: 0, player2: 0 };
        this.winningScore = 5;
        
        // Configuration du jeu
        this.PADDLE_WIDTH = 12;
        this.PADDLE_HEIGHT = 80;
        this.PADDLE_SPEED = 8;
        this.BALL_SIZE = 12;
        this.MAX_BALL_SPEED = 10;
        
        // Joueurs
        this.player1 = {
            x: 30,
            y: this.canvas.height / 2 - this.PADDLE_HEIGHT / 2,
            dy: 0,
            name: 'JOUEUR 1'
        };
        
        this.player2 = {
            x: this.canvas.width - 30 - this.PADDLE_WIDTH,
            y: this.canvas.height / 2 - this.PADDLE_HEIGHT / 2,
            dy: 0,
            name: 'JOUEUR 2',
            aiDifficulty: 0.08 // Vitesse de l'IA
        };
        
        // Balle
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            dx: 5,
            dy: 3,
            trail: []
        };
        
        // Contrôles
        this.keys = {};
        
        // Effets visuels
        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        this.glowIntensity = 0;
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.setupEventListeners();
        this.resizeCanvas();
        this.updateScoreDisplay();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.gameLoop();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const maxWidth = Math.min(800, rect.width - 40);
        const maxHeight = Math.min(500, rect.height - 40);
        
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
        
        // Repositionner les éléments
        this.player1.y = this.canvas.height / 2 - this.PADDLE_HEIGHT / 2;
        this.player2.x = this.canvas.width - 30 - this.PADDLE_WIDTH;
        this.player2.y = this.canvas.height / 2 - this.PADDLE_HEIGHT / 2;
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
    }
    
    setupEventListeners() {
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
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    startGame(mode) {
        this.gameMode = mode;
        this.gameState = 'playing';
        this.score = { player1: 0, player2: 0 };
        
        // Mise à jour des noms
        this.player1.name = 'JOUEUR 1';
        this.player2.name = mode === 'ai' ? 'IA' : 'JOUEUR 2';
        
        this.resetBall();
        this.resetPaddles();
        this.hideAllOverlays();
        this.updateScoreDisplay();
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
        this.startGame(this.gameMode);
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
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
        this.ball.dy = (Math.random() - 0.5) * 6;
        this.ball.trail = [];
    }
    
    resetPaddles() {
        this.player1.y = this.canvas.height / 2 - this.PADDLE_HEIGHT / 2;
        this.player2.y = this.canvas.height / 2 - this.PADDLE_HEIGHT / 2;
        this.player1.dy = 0;
        this.player2.dy = 0;
    }
    
    gameOver(winner) {
        this.gameState = 'gameOver';
        
        const winnerText = winner === 1 ? this.player1.name : this.player2.name;
        document.getElementById('winnerText').textContent = `${winnerText} GAGNE!`;
        document.getElementById('finalScoreText').textContent = 
            `Score final: ${this.score.player1} - ${this.score.player2}`;
        
        document.getElementById('gameOverOverlay').style.display = 'flex';
        
        this.createWinEffect(winner);
        this.shakeScreen(15);
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePaddles();
        this.updateBall();
        this.updateParticles();
        this.updateEffects();
        this.checkCollisions();
        this.updateScoreDisplay();
    }
    
    updatePaddles() {
        // Joueur 1 (Gauche)
        if (this.keys['w'] || this.keys['arrowup']) {
            this.player1.dy = -this.PADDLE_SPEED;
        } else if (this.keys['s'] || this.keys['arrowdown']) {
            this.player1.dy = this.PADDLE_SPEED;
        } else {
            this.player1.dy *= 0.8; // Friction
        }
        
        // Joueur 2 / IA
        if (this.gameMode === 'human') {
            // Contrôles joueur 2
            if (this.keys['o']) {
                this.player2.dy = -this.PADDLE_SPEED;
            } else if (this.keys['l']) {
                this.player2.dy = this.PADDLE_SPEED;
            } else {
                this.player2.dy *= 0.8;
            }
        } else {
            // IA
            const ballCenter = this.ball.y;
            const paddleCenter = this.player2.y + this.PADDLE_HEIGHT / 2;
            const diff = ballCenter - paddleCenter;
            
            this.player2.dy = diff * this.player2.aiDifficulty;
            
            // Limiter la vitesse de l'IA
            this.player2.dy = Math.max(-this.PADDLE_SPEED * 0.8, 
                Math.min(this.PADDLE_SPEED * 0.8, this.player2.dy));
        }
        
        // Appliquer le mouvement et limites
        this.player1.y += this.player1.dy;
        this.player2.y += this.player2.dy;
        
        // Limites
        this.player1.y = Math.max(0, Math.min(this.canvas.height - this.PADDLE_HEIGHT, this.player1.y));
        this.player2.y = Math.max(0, Math.min(this.canvas.height - this.PADDLE_HEIGHT, this.player2.y));
    }
    
    updateBall() {
        // Ajouter au trail
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ball.trail.length > 8) {
            this.ball.trail.shift();
        }
        
        // Mouvement
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Rebonds sur les murs haut/bas
        if (this.ball.y <= this.BALL_SIZE/2 || this.ball.y >= this.canvas.height - this.BALL_SIZE/2) {
            this.ball.dy = -this.ball.dy;
            this.createBounceEffect(this.ball.x, this.ball.y);
            this.shakeScreen(5);
        }
        
        // Vérifier les scores
        if (this.ball.x < 0) {
            this.score.player2++;
            this.createScoreEffect('player2');
            if (this.score.player2 >= this.winningScore) {
                this.gameOver(2);
            } else {
                this.resetBall();
            }
        } else if (this.ball.x > this.canvas.width) {
            this.score.player1++;
            this.createScoreEffect('player1');
            if (this.score.player1 >= this.winningScore) {
                this.gameOver(1);
            } else {
                this.resetBall();
            }
        }
    }
    
    checkCollisions() {
        // Collision avec paddle 1
        if (this.ball.dx < 0 && 
            this.ball.x - this.BALL_SIZE/2 <= this.player1.x + this.PADDLE_WIDTH &&
            this.ball.x + this.BALL_SIZE/2 >= this.player1.x &&
            this.ball.y >= this.player1.y && 
            this.ball.y <= this.player1.y + this.PADDLE_HEIGHT) {
            
            this.ball.dx = -this.ball.dx;
            this.ball.x = this.player1.x + this.PADDLE_WIDTH + this.BALL_SIZE/2;
            
            // Effet selon où la balle touche la palette
            const hitPos = (this.ball.y - this.player1.y) / this.PADDLE_HEIGHT - 0.5;
            this.ball.dy += hitPos * 3;
            
            this.increaseBallSpeed();
            this.createPaddleHitEffect(this.player1.x + this.PADDLE_WIDTH, this.ball.y);
        }
        
        // Collision avec paddle 2
        if (this.ball.dx > 0 && 
            this.ball.x + this.BALL_SIZE/2 >= this.player2.x &&
            this.ball.x - this.BALL_SIZE/2 <= this.player2.x + this.PADDLE_WIDTH &&
            this.ball.y >= this.player2.y && 
            this.ball.y <= this.player2.y + this.PADDLE_HEIGHT) {
            
            this.ball.dx = -this.ball.dx;
            this.ball.x = this.player2.x - this.BALL_SIZE/2;
            
            const hitPos = (this.ball.y - this.player2.y) / this.PADDLE_HEIGHT - 0.5;
            this.ball.dy += hitPos * 3;
            
            this.increaseBallSpeed();
            this.createPaddleHitEffect(this.player2.x, this.ball.y);
        }
    }
    
    increaseBallSpeed() {
        this.ball.dx *= 1.05;
        this.ball.dy *= 1.05;
        
        // Limiter la vitesse maximale
        const speed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
        if (speed > this.MAX_BALL_SPEED) {
            this.ball.dx = (this.ball.dx / speed) * this.MAX_BALL_SPEED;
            this.ball.dy = (this.ball.dy / speed) * this.MAX_BALL_SPEED;
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.life--;
            particle.size *= 0.98;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0 || particle.size < 0.5) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateEffects() {
        this.glowIntensity = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
        
        // Screen shake
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.intensity *= 0.9;
        }
    }
    
    updateScoreDisplay() {
        document.getElementById('player1Name').textContent = this.player1.name;
        document.getElementById('player2Name').textContent = this.player2.name;
        document.getElementById('player1Score').textContent = this.score.player1;
        document.getElementById('player2Score').textContent = this.score.player2;
    }
    
    // Effets visuels
    createBounceEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 8,
                dy: (Math.random() - 0.5) * 8,
                life: 30,
                maxLife: 30,
                size: Math.random() * 4 + 2,
                color: '#00ffff',
                alpha: 1
            });
        }
    }
    
    createPaddleHitEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 12,
                dy: (Math.random() - 0.5) * 12,
                life: 40,
                maxLife: 40,
                size: Math.random() * 6 + 3,
                color: '#ff6600',
                alpha: 1
            });
        }
    }
    
    createScoreEffect(player) {
        const x = player === 'player1' ? this.canvas.width * 0.25 : this.canvas.width * 0.75;
        const y = this.canvas.height / 2;
        
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 15,
                dy: (Math.random() - 0.5) * 15,
                life: 60,
                maxLife: 60,
                size: Math.random() * 8 + 4,
                color: '#39ff14',
                alpha: 1
            });
        }
    }
    
    createWinEffect(winner) {
        const x = winner === 1 ? this.canvas.width * 0.25 : this.canvas.width * 0.75;
        const y = this.canvas.height / 2;
        
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 20,
                dy: (Math.random() - 0.5) * 20,
                life: 90,
                maxLife: 90,
                size: Math.random() * 10 + 5,
                color: ['#ffff00', '#ff6600', '#39ff14'][Math.floor(Math.random() * 3)],
                alpha: 1
            });
        }
    }
    
    shakeScreen(intensity) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    }
    
    render() {
        // Fond avec gradient cyberpunk
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#050505');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Appliquer screen shake
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.renderBackground();
            this.renderPaddles();
            this.renderBall();
            this.renderParticles();
            
            if (this.gameState === 'paused') {
                this.renderPauseOverlay();
            }
        }
        
        this.ctx.restore();
    }
    
    renderBackground() {
        // Grille cyberpunk
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Lignes verticales
        for (let x = 50; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Lignes horizontales
        for (let y = 30; y < this.canvas.height; y += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Ligne centrale
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Ombre néon pour la ligne centrale
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.lineWidth = 6;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    renderPaddles() {
        // Paddle 1 (Gauche)
        this.ctx.fillStyle = '#00ffff';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(this.player1.x, this.player1.y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
        
        // Paddle 2 (Droite)
        this.ctx.fillStyle = '#ff007f';
        this.ctx.shadowColor = '#ff007f';
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(this.player2.x, this.player2.y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
        
        this.ctx.shadowBlur = 0;
    }
    
    renderBall() {
        // Trail de la balle
        for (let i = 0; i < this.ball.trail.length; i++) {
            const trail = this.ball.trail[i];
            const alpha = (i / this.ball.trail.length) * 0.5;
            
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#39ff14';
            this.ctx.fillRect(trail.x - this.BALL_SIZE/2, trail.y - this.BALL_SIZE/2, 
                this.BALL_SIZE, this.BALL_SIZE);
        }
        
        this.ctx.globalAlpha = 1;
        
        // Balle principale
        this.ctx.fillStyle = '#39ff14';
        this.ctx.shadowColor = '#39ff14';
        this.ctx.shadowBlur = 20 + this.glowIntensity * 10;
        this.ctx.fillRect(this.ball.x - this.BALL_SIZE/2, this.ball.y - this.BALL_SIZE/2, 
            this.BALL_SIZE, this.BALL_SIZE);
        
        this.ctx.shadowBlur = 0;
    }
    
    renderParticles() {
        for (const particle of this.particles) {
            this.ctx.globalAlpha = particle.alpha;
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
function startGame(mode) {
    if (window.game) {
        window.game.startGame(mode);
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
    window.game = new PongGame();
});
