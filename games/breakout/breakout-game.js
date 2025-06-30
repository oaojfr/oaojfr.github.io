// Breakout Game - Complet et fonctionnel
class BreakoutGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // État du jeu
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // Paddle
        this.paddle = {
            x: this.canvas.width / 2 - 60,
            y: this.canvas.height - 30,
            width: 120,
            height: 15,
            speed: 8
        };
        
        // Ball
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 8,
            dx: 4,
            dy: -4,
            speed: 4
        };
        
        // Briques
        this.bricks = [];
        this.brickRows = 8;
        this.brickCols = 10;
        this.brickWidth = 75;
        this.brickHeight = 20;
        this.brickPadding = 5;
        this.brickOffsetTop = 60;
        this.brickOffsetLeft = 35;
        
        // Couleurs
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
        ];
        
        // Contrôles
        this.keys = {};
        this.mouseX = 0;
        
        // Particules pour les effets
        this.particles = [];
        
        // Power-ups
        this.powerUps = [];
        this.powerUpTypes = ['extraBall', 'bigPaddle', 'slowBall', 'multiball'];
        
        this.setupEventListeners();
        this.initBricks();
    }
    
    setupEventListeners() {
        // Clavier
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') {
                e.preventDefault();
                if (!this.gameRunning && !this.gameOver) {
                    this.start();
                } else if (this.gameRunning) {
                    this.togglePause();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Souris
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        });
        
        this.canvas.addEventListener('click', () => {
            if (!this.gameRunning && !this.gameOver) {
                this.start();
            }
        });
    }
    
    initBricks() {
        this.bricks = [];
        for (let row = 0; row < this.brickRows; row++) {
            for (let col = 0; col < this.brickCols; col++) {
                this.bricks.push({
                    x: col * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft,
                    y: row * (this.brickHeight + this.brickPadding) + this.brickOffsetTop,
                    width: this.brickWidth,
                    height: this.brickHeight,
                    visible: true,
                    color: this.colors[row % this.colors.length],
                    points: (this.brickRows - row) * 10
                });
            }
        }
    }
    
    start() {
        this.gameRunning = true;
        this.gameOver = false;
        this.gamePaused = false;
        this.gameLoop();
    }
    
    togglePause() {
        this.gamePaused = !this.gamePaused;
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    restart() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.gameRunning = false;
        this.gamePaused = false;
        
        // Reset ball
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = 4;
        this.ball.dy = -4;
        
        // Reset paddle
        this.paddle.x = this.canvas.width / 2 - this.paddle.width / 2;
        this.paddle.width = 120;
        
        // Reset bricks
        this.initBricks();
        
        // Clear effects
        this.particles = [];
        this.powerUps = [];
        
        this.updateUI();
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        this.updatePaddle();
        this.updateBall();
        this.updateParticles();
        this.updatePowerUps();
        this.checkCollisions();
        this.checkWinCondition();
    }
    
    updatePaddle() {
        // Contrôle clavier
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.paddle.x -= this.paddle.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.paddle.x += this.paddle.speed;
        }
        
        // Contrôle souris
        if (this.mouseX > 0) {
            this.paddle.x = this.mouseX - this.paddle.width / 2;
        }
        
        // Limites du paddle
        if (this.paddle.x < 0) this.paddle.x = 0;
        if (this.paddle.x + this.paddle.width > this.canvas.width) {
            this.paddle.x = this.canvas.width - this.paddle.width;
        }
    }
    
    updateBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Collision avec les murs
        if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
            this.ball.dx = -this.ball.dx;
            this.createParticles(this.ball.x, this.ball.y, '#FFFFFF');
        }
        
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.dy = -this.ball.dy;
            this.createParticles(this.ball.x, this.ball.y, '#FFFFFF');
        }
        
        // Collision avec le paddle
        if (this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width) {
            
            // Calcul de l'angle de rebond basé sur la position sur le paddle
            const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
            const angle = (hitPos - 0.5) * Math.PI / 3; // Max 60 degrés
            
            const speed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
            this.ball.dx = speed * Math.sin(angle);
            this.ball.dy = -Math.abs(speed * Math.cos(angle));
            
            this.createParticles(this.ball.x, this.ball.y, '#4ECDC4');
        }
        
        // Ball perdue
        if (this.ball.y > this.canvas.height) {
            this.lives--;
            this.createParticles(this.ball.x, this.ball.y, '#FF6B6B');
            
            if (this.lives <= 0) {
                this.gameOver = true;
                this.gameRunning = false;
                this.showGameOver();
            } else {
                this.resetBall();
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.y += powerUp.speed;
            
            // Collision avec le paddle
            if (powerUp.y + powerUp.height > this.paddle.y &&
                powerUp.x + powerUp.width > this.paddle.x &&
                powerUp.x < this.paddle.x + this.paddle.width) {
                
                this.activatePowerUp(powerUp.type);
                this.powerUps.splice(i, 1);
            }
            
            // Supprimer si hors écran
            if (powerUp.y > this.canvas.height) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        for (let brick of this.bricks) {
            if (!brick.visible) continue;
            
            if (this.ball.x + this.ball.radius > brick.x &&
                this.ball.x - this.ball.radius < brick.x + brick.width &&
                this.ball.y + this.ball.radius > brick.y &&
                this.ball.y - this.ball.radius < brick.y + brick.height) {
                
                brick.visible = false;
                this.score += brick.points;
                
                // Déterminer la direction de rebond
                const ballCenterX = this.ball.x;
                const ballCenterY = this.ball.y;
                const brickCenterX = brick.x + brick.width / 2;
                const brickCenterY = brick.y + brick.height / 2;
                
                const dx = ballCenterX - brickCenterX;
                const dy = ballCenterY - brickCenterY;
                
                if (Math.abs(dx / brick.width) > Math.abs(dy / brick.height)) {
                    this.ball.dx = -this.ball.dx;
                } else {
                    this.ball.dy = -this.ball.dy;
                }
                
                // Particules
                this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
                
                // Chance de power-up
                if (Math.random() < 0.1) {
                    this.createPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
                }
                
                this.updateUI();
                break;
            }
        }
    }
    
    checkWinCondition() {
        const visibleBricks = this.bricks.filter(brick => brick.visible);
        if (visibleBricks.length === 0) {
            this.level++;
            this.ball.speed += 0.5;
            this.initBricks();
            this.resetBall();
            
            // Bonus de niveau
            this.score += this.level * 100;
            this.updateUI();
        }
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 6,
                dy: (Math.random() - 0.5) * 6,
                life: 30,
                color: color
            });
        }
    }
    
    createPowerUp(x, y) {
        const type = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)];
        this.powerUps.push({
            x: x - 15,
            y: y,
            width: 30,
            height: 15,
            speed: 2,
            type: type
        });
    }
    
    activatePowerUp(type) {
        switch (type) {
            case 'bigPaddle':
                this.paddle.width = Math.min(this.paddle.width * 1.5, 200);
                setTimeout(() => {
                    this.paddle.width = 120;
                }, 10000);
                break;
            case 'slowBall':
                this.ball.dx *= 0.7;
                this.ball.dy *= 0.7;
                setTimeout(() => {
                    this.ball.dx /= 0.7;
                    this.ball.dy /= 0.7;
                }, 5000);
                break;
            case 'extraBall':
                // Implémentation simplifiée - juste des points bonus
                this.score += 500;
                break;
        }
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * this.ball.speed;
        this.ball.dy = -this.ball.speed;
        this.gameRunning = false;
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a23';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grille de fond
        this.drawBackground();
        
        // Briques
        this.drawBricks();
        
        // Paddle
        this.drawPaddle();
        
        // Ball
        this.drawBall();
        
        // Power-ups
        this.drawPowerUps();
        
        // Particules
        this.drawParticles();
        
        // HUD
        this.drawHUD();
        
        // Messages
        if (!this.gameRunning && !this.gameOver) {
            this.drawStartMessage();
        }
        
        if (this.gamePaused) {
            this.drawPauseMessage();
        }
    }
    
    drawBackground() {
        this.ctx.strokeStyle = '#1a1a3e';
        this.ctx.lineWidth = 1;
        
        // Lignes verticales
        for (let x = 0; x < this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Lignes horizontales
        for (let y = 0; y < this.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawBricks() {
        for (let brick of this.bricks) {
            if (!brick.visible) continue;
            
            // Ombre
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(brick.x + 2, brick.y + 2, brick.width, brick.height);
            
            // Brique
            this.ctx.fillStyle = brick.color;
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            
            // Bordure
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
            
            // Effet 3D
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(brick.x, brick.y, brick.width, 3);
            this.ctx.fillRect(brick.x, brick.y, 3, brick.height);
        }
    }
    
    drawPaddle() {
        // Ombre
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(this.paddle.x + 2, this.paddle.y + 2, this.paddle.width, this.paddle.height);
        
        // Gradient
        const gradient = this.ctx.createLinearGradient(0, this.paddle.y, 0, this.paddle.y + this.paddle.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // Bordure
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    }
    
    drawBall() {
        // Ombre
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x + 2, this.ball.y + 2, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fill();
        
        // Ball avec gradient
        const gradient = this.ctx.createRadialGradient(
            this.ball.x - 3, this.ball.y - 3, 0,
            this.ball.x, this.ball.y, this.ball.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#ff6b6b');
        
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Bordure
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    drawPowerUps() {
        for (let powerUp of this.powerUps) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            
            this.ctx.strokeStyle = '#FFA500';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            
            // Texte du power-up
            this.ctx.fillStyle = '#000';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('P', powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + 3);
        }
    }
    
    drawParticles() {
        for (let particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
            this.ctx.restore();
        }
    }
    
    drawHUD() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        
        // Score
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        
        // Vies
        this.ctx.fillText(`Vies: ${this.lives}`, 20, 55);
        
        // Niveau
        this.ctx.fillText(`Niveau: ${this.level}`, 200, 30);
        
        // Briques restantes
        const remainingBricks = this.bricks.filter(brick => brick.visible).length;
        this.ctx.fillText(`Briques: ${remainingBricks}`, 200, 55);
    }
    
    drawStartMessage() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BREAKOUT', this.canvas.width/2, this.canvas.height/2 - 50);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Cliquez ou appuyez sur ESPACE pour commencer', this.canvas.width/2, this.canvas.height/2);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Utilisez les flèches ou la souris pour déplacer le paddle', this.canvas.width/2, this.canvas.height/2 + 30);
    }
    
    drawPauseMessage() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSE', this.canvas.width/2, this.canvas.height/2);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Appuyez sur ESPACE pour reprendre', this.canvas.width/2, this.canvas.height/2 + 40);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
    }
    
    showGameOver() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameMessage').style.display = 'block';
    }
    
    gameLoop() {
        if (!this.gamePaused) {
            this.update();
            this.render();
        }
        
        if (this.gameRunning || this.gamePaused) {
            requestAnimationFrame(() => this.gameLoop());
        } else if (!this.gameOver) {
            this.render();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Initialisation
let breakoutGame;

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('breakoutCanvas');
    breakoutGame = new BreakoutGame(canvas);
    
    // Bouton restart
    document.getElementById('restartBtn').addEventListener('click', function() {
        document.getElementById('gameMessage').style.display = 'none';
        breakoutGame.restart();
    });
    
    // Démarrer le rendu
    breakoutGame.render();
});
