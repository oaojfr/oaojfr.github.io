/**
 * PONG MODERNE - JavaScript ES6+ avec Canvas API
 * Fonctionnalités: IA avancée, multijoueur, effets visuels, physique réaliste
 */

class ModernPong {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration du jeu
        this.config = {
            paddleWidth: 15,
            paddleHeight: 80,
            ballSize: 12,
            paddleSpeed: 8,
            ballSpeed: 6,
            maxBallSpeed: 12,
            winScore: 11,
            aiDifficulty: 0.85 // 0-1, plus élevé = plus difficile
        };
        
        // État du jeu
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.gameMode = 'ai'; // ai, human
        this.score = { player1: 0, player2: 0 };
        
        // Objets du jeu
        this.paddle1 = {
            x: 30,
            y: this.canvas.height / 2 - this.config.paddleHeight / 2,
            width: this.config.paddleWidth,
            height: this.config.paddleHeight,
            dy: 0,
            trail: []
        };
        
        this.paddle2 = {
            x: this.canvas.width - 30 - this.config.paddleWidth,
            y: this.canvas.height / 2 - this.config.paddleHeight / 2,
            width: this.config.paddleWidth,
            height: this.config.paddleHeight,
            dy: 0,
            trail: []
        };
        
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            dx: this.config.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
            dy: this.config.ballSpeed * (Math.random() - 0.5),
            size: this.config.ballSize,
            trail: [],
            lastHitPaddle: null
        };
        
        // Contrôles
        this.keys = new Set();
        
        // Particules pour les effets
        this.particles = [];
        
        // Audio (Web Audio API)
        this.audioContext = null;
        this.sounds = {};
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initAudio();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Clavier
        document.addEventListener('keydown', (e) => {
            this.keys.add(e.key.toLowerCase());
            
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
            
            if (e.key === 'Escape') {
                if (this.gameState === 'playing' || this.gameState === 'paused') {
                    this.showMenu();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys.delete(e.key.toLowerCase());
        });
        
        // Redimensionnement
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(800, container.clientWidth - 40);
        const maxHeight = Math.min(500, container.clientHeight - 40);
        
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
        
        // Réajuster les positions
        this.paddle1.y = this.canvas.height / 2 - this.config.paddleHeight / 2;
        this.paddle2.x = this.canvas.width - 30 - this.config.paddleWidth;
        this.paddle2.y = this.canvas.height / 2 - this.config.paddleHeight / 2;
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.log('Audio non supporté');
        }
    }
    
    createSounds() {
        if (!this.audioContext) return;
        
        // Son de collision paddle
        this.sounds.paddleHit = () => {
            const oscillator = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            oscillator.connect(gain);
            gain.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
        
        // Son de collision mur
        this.sounds.wallHit = () => {
            const oscillator = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            oscillator.connect(gain);
            gain.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.15);
        };
        
        // Son de score
        this.sounds.score = () => {
            const oscillator = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            oscillator.connect(gain);
            gain.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }
    
    startGame(mode) {
        this.gameMode = mode;
        this.gameState = 'playing';
        this.score = { player1: 0, player2: 0 };
        
        // Configuration des noms
        if (mode === 'ai') {
            document.getElementById('player1Name').textContent = 'JOUEUR';
            document.getElementById('player2Name').textContent = 'IA';
        } else {
            document.getElementById('player1Name').textContent = 'JOUEUR 1';
            document.getElementById('player2Name').textContent = 'JOUEUR 2';
        }
        
        this.resetBall();
        this.hideMenu();
        this.updateScore();
        
        // Activer le contexte audio sur interaction utilisateur
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        
        // Direction aléatoire mais pas trop verticale
        const angle = (Math.random() - 0.5) * Math.PI / 3; // ±60 degrés
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        this.ball.dx = Math.cos(angle) * this.config.ballSpeed * direction;
        this.ball.dy = Math.sin(angle) * this.config.ballSpeed;
        
        this.ball.trail = [];
        this.ball.lastHitPaddle = null;
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePaddles();
        this.updateBall();
        this.updateParticles();
        this.updateTrails();
        this.checkCollisions();
        this.checkScore();
    }
    
    updatePaddles() {
        // Paddle 1 (Joueur)
        this.paddle1.dy = 0;
        if (this.keys.has('w') || this.keys.has('arrowup')) {
            this.paddle1.dy = -this.config.paddleSpeed;
        }
        if (this.keys.has('s') || this.keys.has('arrowdown')) {
            this.paddle1.dy = this.config.paddleSpeed;
        }
        
        this.paddle1.y += this.paddle1.dy;
        this.paddle1.y = Math.max(0, Math.min(this.canvas.height - this.paddle1.height, this.paddle1.y));
        
        // Paddle 2 (IA ou Joueur 2)
        if (this.gameMode === 'ai') {
            this.updateAI();
        } else {
            this.paddle2.dy = 0;
            if (this.keys.has('o')) {
                this.paddle2.dy = -this.config.paddleSpeed;
            }
            if (this.keys.has('l')) {
                this.paddle2.dy = this.config.paddleSpeed;
            }
            
            this.paddle2.y += this.paddle2.dy;
            this.paddle2.y = Math.max(0, Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y));
        }
        
        // Mise à jour des trails
        this.updatePaddleTrail(this.paddle1);
        this.updatePaddleTrail(this.paddle2);
    }
    
    updateAI() {
        const ballCenterY = this.ball.y;
        const paddleCenterY = this.paddle2.y + this.paddle2.height / 2;
        const diff = ballCenterY - paddleCenterY;
        
        // IA prédictive - prédit où la balle va être
        let targetY = ballCenterY;
        if (this.ball.dx > 0) { // Balle va vers l'IA
            const timeToReach = (this.paddle2.x - this.ball.x) / this.ball.dx;
            if (timeToReach > 0) {
                targetY = this.ball.y + this.ball.dy * timeToReach;
                
                // Gérer les rebonds sur les murs
                while (targetY < 0 || targetY > this.canvas.height) {
                    if (targetY < 0) targetY = -targetY;
                    if (targetY > this.canvas.height) targetY = 2 * this.canvas.height - targetY;
                }
            }
        }
        
        const targetDiff = targetY - paddleCenterY;
        
        // IA avec erreur intentionnelle pour ajuster la difficulté
        const error = (Math.random() - 0.5) * 20 * (1 - this.config.aiDifficulty);
        const adjustedDiff = targetDiff + error;
        
        if (Math.abs(adjustedDiff) > 5) {
            this.paddle2.dy = Math.sign(adjustedDiff) * this.config.paddleSpeed * this.config.aiDifficulty;
        } else {
            this.paddle2.dy = 0;
        }
        
        this.paddle2.y += this.paddle2.dy;
        this.paddle2.y = Math.max(0, Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y));
    }
    
    updateBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Collision avec les murs haut/bas
        if (this.ball.y <= this.ball.size || this.ball.y >= this.canvas.height - this.ball.size) {
            this.ball.dy = -this.ball.dy;
            this.createImpactParticles(this.ball.x, this.ball.y, '#00ffff');
            this.sounds.wallHit?.();
        }
        
        // Mise à jour du trail
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ball.trail.length > 10) {
            this.ball.trail.shift();
        }
    }
    
    updatePaddleTrail(paddle) {
        if (Math.abs(paddle.dy) > 0) {
            paddle.trail.push({ 
                x: paddle.x + paddle.width / 2, 
                y: paddle.y + paddle.height / 2,
                life: 1
            });
        }
        
        paddle.trail = paddle.trail.filter(point => {
            point.life -= 0.1;
            return point.life > 0;
        });
        
        if (paddle.trail.length > 8) {
            paddle.trail.shift();
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.life -= 0.02;
            particle.alpha = particle.life;
            
            return particle.life > 0;
        });
    }
    
    updateTrails() {
        // Les trails sont déjà mis à jour dans updateBall et updatePaddleTrail
    }
    
    checkCollisions() {
        // Collision avec paddle 1
        if (this.ball.x - this.ball.size <= this.paddle1.x + this.paddle1.width &&
            this.ball.x + this.ball.size >= this.paddle1.x &&
            this.ball.y + this.ball.size >= this.paddle1.y &&
            this.ball.y - this.ball.size <= this.paddle1.y + this.paddle1.height &&
            this.ball.dx < 0 && this.ball.lastHitPaddle !== 'player1') {
            
            this.handlePaddleCollision(this.paddle1, 'player1');
        }
        
        // Collision avec paddle 2
        if (this.ball.x + this.ball.size >= this.paddle2.x &&
            this.ball.x - this.ball.size <= this.paddle2.x + this.paddle2.width &&
            this.ball.y + this.ball.size >= this.paddle2.y &&
            this.ball.y - this.ball.size <= this.paddle2.y + this.paddle2.height &&
            this.ball.dx > 0 && this.ball.lastHitPaddle !== 'player2') {
            
            this.handlePaddleCollision(this.paddle2, 'player2');
        }
    }
    
    handlePaddleCollision(paddle, player) {
        // Position relative de la collision sur la raquette
        const relativeIntersectY = (this.ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
        
        // Angle de renvoi basé sur la position
        const angle = relativeIntersectY * Math.PI / 4; // Max 45 degrés
        
        // Vitesse augmentée légèrement à chaque frappe
        const speed = Math.min(this.config.maxBallSpeed, Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy) + 0.5);
        
        // Nouvelle direction
        this.ball.dx = Math.cos(angle) * speed * (player === 'player1' ? 1 : -1);
        this.ball.dy = Math.sin(angle) * speed;
        
        // Ajouter l'effet du mouvement de la raquette
        if (Math.abs(paddle.dy) > 0) {
            this.ball.dy += paddle.dy * 0.2;
        }
        
        this.ball.lastHitPaddle = player;
        
        // Effets visuels et sonores
        this.createImpactParticles(this.ball.x, this.ball.y, '#ff007f');
        this.sounds.paddleHit?.();
    }
    
    checkScore() {
        // Point pour le joueur 1
        if (this.ball.x > this.canvas.width) {
            this.score.player1++;
            this.createScoreParticles(this.canvas.width / 4, this.canvas.height / 2, '#39ff14');
            this.sounds.score?.();
            this.resetBall();
            this.updateScore();
        }
        
        // Point pour le joueur 2
        if (this.ball.x < 0) {
            this.score.player2++;
            this.createScoreParticles(3 * this.canvas.width / 4, this.canvas.height / 2, '#39ff14');
            this.sounds.score?.();
            this.resetBall();
            this.updateScore();
        }
        
        // Vérifier la victoire
        if (this.score.player1 >= this.config.winScore || this.score.player2 >= this.config.winScore) {
            this.endGame();
        }
    }
    
    createImpactParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 8,
                dy: (Math.random() - 0.5) * 8,
                life: 1,
                alpha: 1,
                color: color,
                size: Math.random() * 3 + 1
            });
        }
    }
    
    createScoreParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 10,
                dy: (Math.random() - 0.5) * 10,
                life: 1.5,
                alpha: 1,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    render() {
        // Effacer le canvas avec un effet de trainée
        this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Ligne médiane
        this.drawCenterLine();
        
        // Raquettes avec effets
        this.drawPaddle(this.paddle1, '#00ffff');
        this.drawPaddle(this.paddle2, '#ff007f');
        
        // Balle avec trail
        this.drawBall();
        
        // Particules
        this.drawParticles();
        
        // Trails des raquettes
        this.drawPaddleTrails();
    }
    
    drawCenterLine() {
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawPaddle(paddle, color) {
        // Ombre
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(paddle.x + 2, paddle.y + 2, paddle.width, paddle.height);
        
        // Raquette principale
        this.ctx.fillStyle = color;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        
        // Effet de glow
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        this.ctx.shadowBlur = 0;
        
        // Lignes de détail
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(paddle.x + 3, paddle.y + 10);
        this.ctx.lineTo(paddle.x + 3, paddle.y + paddle.height - 10);
        this.ctx.stroke();
    }
    
    drawBall() {
        // Trail de la balle
        if (this.ball.trail.length > 1) {
            for (let i = 1; i < this.ball.trail.length; i++) {
                const alpha = i / this.ball.trail.length;
                this.ctx.globalAlpha = alpha * 0.5;
                this.ctx.fillStyle = '#ffffff';
                
                const point = this.ball.trail[i];
                const size = this.ball.size * alpha;
                
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        this.ctx.globalAlpha = 1;
        
        // Ombre de la balle
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x + 2, this.ball.y + 2, this.ball.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Balle principale
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Centre brillant
        this.ctx.fillStyle = '#39ff14';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x - 2, this.ball.y - 2, this.ball.size / 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawPaddleTrails() {
        [this.paddle1, this.paddle2].forEach((paddle, index) => {
            const color = index === 0 ? '#00ffff' : '#ff007f';
            
            paddle.trail.forEach((point, i) => {
                this.ctx.globalAlpha = point.life * 0.3;
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 3 * point.life, 0, Math.PI * 2);
                this.ctx.fill();
            });
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 5;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }
    
    updateScore() {
        document.getElementById('player1Score').textContent = this.score.player1;
        document.getElementById('player2Score').textContent = this.score.player2;
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pauseOverlay').style.display = 'flex';
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pauseOverlay').style.display = 'none';
    }
    
    endGame() {
        this.gameState = 'gameOver';
        const winner = this.score.player1 >= this.config.winScore ? 1 : 2;
        const winnerName = this.gameMode === 'ai' ? 
            (winner === 1 ? 'VICTOIRE!' : 'DÉFAITE!') :
            `JOUEUR ${winner} GAGNE!`;
        
        document.getElementById('winnerText').textContent = winnerName;
        document.getElementById('finalScoreText').textContent = 
            `Score final: ${this.score.player1} - ${this.score.player2}`;
        document.getElementById('gameOverOverlay').style.display = 'flex';
    }
    
    restartGame() {
        this.hideGameOver();
        this.startGame(this.gameMode);
    }
    
    showMenu() {
        this.gameState = 'menu';
        this.hideGameOver();
        this.hidePause();
        document.getElementById('menuOverlay').style.display = 'flex';
    }
    
    hideMenu() {
        document.getElementById('menuOverlay').style.display = 'none';
    }
    
    hideGameOver() {
        document.getElementById('gameOverOverlay').style.display = 'none';
    }
    
    hidePause() {
        document.getElementById('pauseOverlay').style.display = 'none';
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Fonctions globales pour les boutons HTML
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new ModernPong();
});

function startGame(mode) {
    game.startGame(mode);
}

function resumeGame() {
    game.resumeGame();
}

function restartGame() {
    game.restartGame();
}

function showMenu() {
    game.showMenu();
}
