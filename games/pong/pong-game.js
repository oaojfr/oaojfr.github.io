// Pong Game - Complet et fonctionnel avec modes de jeu
class PongGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // Mode de jeu
        this.gameMode = null; // null = menu, '1player', '2players', 'vs-ai'
        this.showMenu = true;
        
        // État du jeu
        this.gameRunning = false;
        this.gameStarted = false;
        this.gamePaused = false;
        this.gameOver = false;
        
        // Scores
        this.playerScore = 0;
        this.player2Score = 0; // Pour le mode 2 joueurs ou IA
        this.maxScore = 5;
        
        // Raquette joueur 1
        this.player1 = {
            x: 10,
            y: this.canvas.height / 2 - 50,
            width: 15,
            height: 100,
            speed: 6,
            dy: 0
        };
        
        // Raquette joueur 2/IA
        this.player2 = {
            x: this.canvas.width - 25,
            y: this.canvas.height / 2 - 50,
            width: 15,
            height: 100,
            speed: 6,
            dy: 0,
            isAI: false,
            aiSpeed: 4,
            aiDifficulty: 0.85 // 0.0 = facile, 1.0 = impossible
        };
        
        // Balle
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 8,
            dx: 5,
            dy: 3,
            speed: 5,
            maxSpeed: 12
        };
        
        // Contrôles
        this.keys = {};
        
        // Particules pour les effets
        this.particles = [];
        
        // Trails pour la balle
        this.ballTrail = [];
        this.maxTrailLength = 10;
        
        // Configuration des couleurs
        this.colors = {
            background: '#0a0a23',
            player1: '#4ECDC4',
            player2: '#FF6B6B',
            ball: '#FFD700',
            text: '#FFFFFF',
            trail: '#FFD700',
            particle: '#FFFFFF',
            menu: '#667eea'
        };
        
        // Interface du menu
        this.menuItems = [
            { text: '1 JOUEUR', mode: '1player', description: 'Jouer seul contre les murs' },
            { text: '2 JOUEURS', mode: '2players', description: 'Jouer à deux sur le même clavier' },
            { text: 'JOUEUR vs IA', mode: 'vs-ai', description: 'Affronter l\'intelligence artificielle' }
        ];
        this.selectedMenuItem = 0;
        
        this.setupEventListeners();
        this.resetBall();
    }
    
    setupEventListeners() {
        // Clavier
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (this.showMenu) {
                if (e.key === 'ArrowUp') {
                    this.selectedMenuItem = Math.max(0, this.selectedMenuItem - 1);
                } else if (e.key === 'ArrowDown') {
                    this.selectedMenuItem = Math.min(this.menuItems.length - 1, this.selectedMenuItem + 1);
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectGameMode(this.menuItems[this.selectedMenuItem].mode);
                }
            } else {
                if (e.key === ' ') {
                    e.preventDefault();
                    if (this.gameOver) {
                        this.restart();
                    } else if (!this.gameStarted) {
                        this.start();
                    } else if (this.gameRunning) {
                        this.togglePause();
                    }
                } else if (e.key === 'Escape') {
                    this.showMainMenu();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Clic pour démarrer ou naviguer dans le menu
        this.canvas.addEventListener('click', (e) => {
            if (this.showMenu) {
                const rect = this.canvas.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const menuStartY = this.canvas.height / 2 - 60;
                
                for (let i = 0; i < this.menuItems.length; i++) {
                    const itemY = menuStartY + i * 80;
                    if (clickY >= itemY - 25 && clickY <= itemY + 25) {
                        this.selectGameMode(this.menuItems[i].mode);
                        break;
                    }
                }
            } else if (this.gameOver) {
                this.restart();
            } else if (!this.gameStarted) {
                this.start();
            }
        });
    }
    
    selectGameMode(mode) {
        this.gameMode = mode;
        this.showMenu = false;
        
        // Configurer selon le mode
        switch (mode) {
            case '1player':
                this.player2.isAI = false;
                // Pas de deuxième raquette en mode 1 joueur
                break;
            case '2players':
                this.player2.isAI = false;
                break;
            case 'vs-ai':
                this.player2.isAI = true;
                this.player2.speed = this.player2.aiSpeed;
                break;
        }
        
        this.restart();
    }
    
    showMainMenu() {
        this.showMenu = true;
        this.gameMode = null;
        this.gameRunning = false;
        this.gameStarted = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.selectedMenuItem = 0;
    }
    
    start() {
        this.gameStarted = true;
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
        this.playerScore = 0;
        this.player2Score = 0;
        this.gameOver = false;
        this.gameRunning = false;
        this.gameStarted = false;
        this.gamePaused = false;
        
        // Reset positions
        this.player1.y = this.canvas.height / 2 - 50;
        this.player2.y = this.canvas.height / 2 - 50;
        this.resetBall();
        
        // Clear effects
        this.particles = [];
        this.ballTrail = [];
        
        this.updateUI();
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        
        // Direction aléatoire
        const direction = Math.random() > 0.5 ? 1 : -1;
        const angle = (Math.random() - 0.5) * Math.PI / 3; // ±60 degrés
        
        this.ball.dx = direction * this.ball.speed * Math.cos(angle);
        this.ball.dy = this.ball.speed * Math.sin(angle);
        
        // Clear trail
        this.ballTrail = [];
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        this.updatePlayer1();
        if (this.gameMode !== '1player') {
            this.updatePlayer2();
        }
        this.updateBall();
        this.updateParticles();
        this.updateBallTrail();
        this.checkWinCondition();
    }
    
    updatePlayer1() {
        // Contrôles du joueur 1 (gauche)
        // W/S pour le joueur 1 uniquement
        if (this.keys['w'] || this.keys['W']) {
            this.player1.dy = -this.player1.speed;
        } else if (this.keys['s'] || this.keys['S']) {
            this.player1.dy = this.player1.speed;
        } else {
            this.player1.dy = 0;
        }
        
        // Mise à jour position
        this.player1.y += this.player1.dy;
        
        // Limites
        if (this.player1.y < 0) this.player1.y = 0;
        if (this.player1.y + this.player1.height > this.canvas.height) {
            this.player1.y = this.canvas.height - this.player1.height;
        }
    }
    
    updatePlayer2() {
        if (this.player2.isAI) {
            // IA améliorée
            const ballCenterY = this.ball.y;
            const player2CenterY = this.player2.y + this.player2.height / 2;
            const difference = ballCenterY - player2CenterY;
            
            // L'IA réagit seulement si la balle se dirige vers elle
            if (this.ball.dx > 0) {
                // Prédiction de la position de la balle
                const timeToReach = (this.player2.x - this.ball.x) / this.ball.dx;
                const predictedY = this.ball.y + this.ball.dy * timeToReach;
                const targetY = Math.max(this.player2.height / 2, 
                                       Math.min(this.canvas.height - this.player2.height / 2, predictedY));
                const targetDiff = targetY - player2CenterY;
                
                // Ajouter de l'imprécision selon la difficulté
                const accuracy = this.player2.aiDifficulty;
                const randomFactor = (1 - accuracy) * 50 * (Math.random() - 0.5);
                const finalDiff = targetDiff + randomFactor;
                
                if (Math.abs(finalDiff) > 10) {
                    this.player2.dy = finalDiff > 0 ? this.player2.aiSpeed : -this.player2.aiSpeed;
                } else {
                    this.player2.dy = 0;
                }
            } else {
                // Retour au centre quand la balle s'éloigne
                const centerY = this.canvas.height / 2 - this.player2.height / 2;
                const centerDiff = centerY - this.player2.y;
                if (Math.abs(centerDiff) > 5) {
                    this.player2.dy = centerDiff > 0 ? this.player2.aiSpeed * 0.3 : -this.player2.aiSpeed * 0.3;
                } else {
                    this.player2.dy = 0;
                }
            }
        } else {
            // Contrôles du joueur 2 (droite) - mode 2 joueurs
            // Flèches haut/bas OU I/K pour le joueur 2
            if (this.keys['ArrowUp'] || this.keys['i'] || this.keys['I']) {
                this.player2.dy = -this.player2.speed;
            } else if (this.keys['ArrowDown'] || this.keys['k'] || this.keys['K']) {
                this.player2.dy = this.player2.speed;
            } else {
                this.player2.dy = 0;
            }
        }
        
        // Mise à jour position
        this.player2.y += this.player2.dy;
        
        // Limites
        if (this.player2.y < 0) this.player2.y = 0;
        if (this.player2.y + this.player2.height > this.canvas.height) {
            this.player2.y = this.canvas.height - this.player2.height;
        }
    }
    
    updateBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Collision avec le haut et le bas
        if (this.ball.y - this.ball.radius <= 0 || this.ball.y + this.ball.radius >= this.canvas.height) {
            this.ball.dy = -this.ball.dy;
            this.createParticles(this.ball.x, this.ball.y, this.colors.particle);
        }
        
        // Collision avec la raquette du joueur 1
        if (this.ball.x - this.ball.radius <= this.player1.x + this.player1.width &&
            this.ball.x + this.ball.radius >= this.player1.x &&
            this.ball.y >= this.player1.y &&
            this.ball.y <= this.player1.y + this.player1.height) {
            
            if (this.ball.dx < 0) { // Seulement si la balle va vers le joueur
                // Calcul de l'angle de rebond
                const hitPos = (this.ball.y - this.player1.y) / this.player1.height;
                const angle = (hitPos - 0.5) * Math.PI / 3; // ±60 degrés
                
                const speed = Math.min(Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy) + 0.2, this.ball.maxSpeed);
                this.ball.dx = Math.abs(speed * Math.cos(angle)); // Toujours positif pour aller vers la droite
                this.ball.dy = speed * Math.sin(angle);
                
                this.createParticles(this.ball.x, this.ball.y, this.colors.player1);
            }
        }
        
        // Collision avec la raquette du joueur 2/IA (seulement en mode 2 joueurs ou vs-ai)
        if (this.gameMode !== '1player') {
            if (this.ball.x + this.ball.radius >= this.player2.x &&
                this.ball.x - this.ball.radius <= this.player2.x + this.player2.width &&
                this.ball.y >= this.player2.y &&
                this.ball.y <= this.player2.y + this.player2.height) {
                
                if (this.ball.dx > 0) { // Seulement si la balle va vers le joueur 2/IA
                    // Calcul de l'angle de rebond
                    const hitPos = (this.ball.y - this.player2.y) / this.player2.height;
                    const angle = (hitPos - 0.5) * Math.PI / 3; // ±60 degrés
                    
                    const speed = Math.min(Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy) + 0.2, this.ball.maxSpeed);
                    this.ball.dx = -Math.abs(speed * Math.cos(angle)); // Toujours négatif pour aller vers la gauche
                    this.ball.dy = speed * Math.sin(angle);
                    
                    this.createParticles(this.ball.x, this.ball.y, this.colors.player2);
                }
            }
        }
        
        // Points marqués ou rebonds selon le mode
        if (this.ball.x < 0) {
            if (this.gameMode === '1player') {
                // En mode 1 joueur, la balle rebondit sur le côté gauche
                this.ball.dx = -this.ball.dx;
                this.createParticles(this.ball.x, this.ball.y, this.colors.player1);
            } else {
                // En mode multijoueur, le joueur 2 marque un point
                this.player2Score++;
                this.createScoreParticles(this.canvas.width / 2, this.canvas.height / 2, this.colors.player2);
                this.resetBall();
            }
        } else if (this.ball.x > this.canvas.width) {
            if (this.gameMode === '1player') {
                // En mode 1 joueur, la balle rebondit sur le côté droit
                this.ball.dx = -this.ball.dx;
                this.createParticles(this.ball.x, this.ball.y, this.colors.player1);
            } else {
                // En mode multijoueur, le joueur 1 marque un point
                this.playerScore++;
                this.createScoreParticles(this.canvas.width / 2, this.canvas.height / 2, this.colors.player1);
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
            particle.size *= 0.98;
            
            if (particle.life <= 0 || particle.size < 1) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateBallTrail() {
        // Ajouter la position actuelle au trail
        this.ballTrail.push({
            x: this.ball.x,
            y: this.ball.y
        });
        
        // Limiter la longueur du trail
        if (this.ballTrail.length > this.maxTrailLength) {
            this.ballTrail.shift();
        }
    }
    
    checkWinCondition() {
        if (this.gameMode === '1player') {
            // En mode 1 joueur, le jeu continue indéfiniment (pas de condition de victoire)
            // Ou on pourrait ajouter un système de score basé sur le temps
            return;
        }
        
        if (this.playerScore >= this.maxScore || this.player2Score >= this.maxScore) {
            this.gameOver = true;
            this.gameRunning = false;
        }
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 8,
                dy: (Math.random() - 0.5) * 8,
                life: 30,
                size: Math.random() * 4 + 2,
                color: color
            });
        }
    }
    
    createScoreParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 12,
                dy: (Math.random() - 0.5) * 12,
                life: 60,
                size: Math.random() * 6 + 3,
                color: color
            });
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.showMenu) {
            this.drawMenu();
            return;
        }
        
        // Ligne centrale
        this.drawCenterLine();
        
        // Raquettes
        this.drawPaddle(this.player1, this.colors.player1);
        if (this.gameMode !== '1player') {
            this.drawPaddle(this.player2, this.colors.player2);
        }
        
        // Trail de la balle
        this.drawBallTrail();
        
        // Balle
        this.drawBall();
        
        // Particules
        this.drawParticles();
        
        // Scores
        this.drawScores();
        
        // Messages
        if (!this.gameStarted) {
            this.drawStartMessage();
        } else if (this.gamePaused) {
            this.drawPauseMessage();
        } else if (this.gameOver) {
            this.drawGameOverMessage();
        }
    }
    
    drawCenterLine() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 10]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]); // Reset dash
    }
    
    drawPaddle(paddle, color) {
        // Ombre
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(paddle.x + 2, paddle.y + 2, paddle.width, paddle.height);
        
        // Gradient pour la raquette
        const gradient = this.ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.width, 0);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, '#FFFFFF');
        gradient.addColorStop(1, color);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        
        // Bordure
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
        
        // Effet de brillance
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(paddle.x + 2, paddle.y + 2, paddle.width - 4, 4);
    }
    
    drawBallTrail() {
        for (let i = 0; i < this.ballTrail.length; i++) {
            const point = this.ballTrail[i];
            const alpha = (i + 1) / this.ballTrail.length * 0.5;
            const size = ((i + 1) / this.ballTrail.length) * this.ball.radius;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = this.colors.trail;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawBall() {
        // Ombre
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x + 2, this.ball.y + 2, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fill();
        
        // Gradient radial pour la balle
        const gradient = this.ctx.createRadialGradient(
            this.ball.x - 3, this.ball.y - 3, 0,
            this.ball.x, this.ball.y, this.ball.radius
        );
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.7, this.colors.ball);
        gradient.addColorStop(1, '#FFA500');
        
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Bordure brillante
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Effet de vitesse
        const speed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
        if (speed > 8) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.6;
            this.ctx.fillStyle = '#FF4500';
            this.ctx.beginPath();
            this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius + 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawParticles() {
        for (let particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life / 60;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawScores() {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        
        // Score joueur 1
        this.ctx.fillText(this.playerScore, this.canvas.width / 4, 60);
        
        // Score joueur 2 (ou IA)
        if (this.gameMode !== '1player') {
            this.ctx.fillText(this.player2Score, (this.canvas.width * 3) / 4, 60);
        }
        
        // Labels
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('JOUEUR 1', this.canvas.width / 4, 90);
        if (this.gameMode === 'vs-ai') {
            this.ctx.fillText('IA', (this.canvas.width * 3) / 4, 90);
        } else if (this.gameMode === '2players') {
            this.ctx.fillText('JOUEUR 2', (this.canvas.width * 3) / 4, 90);
        }
    }
    
    drawStartMessage() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        
        let message = '';
        if (this.gameMode === '1player') {
            message = 'MODE 1 JOUEUR';
        } else if (this.gameMode === '2players') {
            message = 'MODE 2 JOUEURS';
        } else if (this.gameMode === 'vs-ai') {
            message = 'JOUEUR vs IA';
        }
        
        this.ctx.fillText(message, this.canvas.width/2, this.canvas.height/2 - 60);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Cliquez ou appuyez sur ESPACE pour commencer', this.canvas.width/2, this.canvas.height/2 - 10);
        
        this.ctx.font = '16px Arial';
        if (this.gameMode === '1player') {
            this.ctx.fillText('Utilisez W/S pour déplacer votre raquette', this.canvas.width/2, this.canvas.height/2 + 20);
            this.ctx.fillText('Empêchez la balle de sortir des côtés !', this.canvas.width/2, this.canvas.height/2 + 45);
        } else if (this.gameMode === '2players') {
            this.ctx.fillText('Joueur 1: W/S - Joueur 2: Flèches ↑/↓', this.canvas.width/2, this.canvas.height/2 + 20);
        } else if (this.gameMode === 'vs-ai') {
            this.ctx.fillText('Utilisez W/S pour déplacer votre raquette', this.canvas.width/2, this.canvas.height/2 + 20);
        }
        
        this.ctx.fillText(`Premier à ${this.maxScore} points gagne!`, this.canvas.width/2, this.canvas.height/2 + 70);
        this.ctx.fillText('ESC pour revenir au menu', this.canvas.width/2, this.canvas.height/2 + 95);
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
        this.ctx.fillText('ESC pour revenir au menu', this.canvas.width/2, this.canvas.height/2 + 65);
    }
    
    drawGameOverMessage() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width/2, this.canvas.height/2 - 60);
        
        // Déterminer le gagnant
        let winner = '';
        if (this.gameMode === '1player') {
            winner = this.playerScore >= this.maxScore ? 'VICTOIRE!' : 'DÉFAITE!';
        } else if (this.gameMode === '2players') {
            winner = this.playerScore >= this.maxScore ? 'JOUEUR 1 GAGNE!' : 'JOUEUR 2 GAGNE!';
        } else if (this.gameMode === 'vs-ai') {
            winner = this.playerScore >= this.maxScore ? 'VOUS GAGNEZ!' : 'IA GAGNE!';
        }
        
        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillStyle = this.playerScore >= this.maxScore ? '#4ECDC4' : '#FF6B6B';
        this.ctx.fillText(winner, this.canvas.width/2, this.canvas.height/2 - 10);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score final: ${this.playerScore} - ${this.player2Score}`, this.canvas.width/2, this.canvas.height/2 + 30);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Cliquez ou appuyez sur ESPACE pour rejouer', this.canvas.width/2, this.canvas.height/2 + 60);
        this.ctx.fillText('ESC pour revenir au menu', this.canvas.width/2, this.canvas.height/2 + 85);
    }
    
    drawMenu() {
        // Fond dégradé
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Titre
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 72px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('PONG', this.canvas.width/2, 120);
        this.ctx.fillText('PONG', this.canvas.width/2, 120);
        
        // Emoji
        this.ctx.font = '48px Arial';
        this.ctx.fillText('🏓', this.canvas.width/2, 180);
        
        // Options de menu
        const menuStartY = this.canvas.height / 2 - 60;
        for (let i = 0; i < this.menuItems.length; i++) {
            const item = this.menuItems[i];
            const y = menuStartY + i * 80;
            const isSelected = i === this.selectedMenuItem;
            
            // Fond de sélection
            if (isSelected) {
                this.ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
                this.ctx.fillRect(this.canvas.width/2 - 180, y - 30, 360, 55);
                
                this.ctx.strokeStyle = '#667eea';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(this.canvas.width/2 - 180, y - 30, 360, 55);
            }
            
            // Titre de l'option
            this.ctx.fillStyle = isSelected ? '#FFD700' : '#ffffff';
            this.ctx.font = isSelected ? 'bold 28px Arial' : 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.text, this.canvas.width/2, y);
            
            // Description
            this.ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(item.description, this.canvas.width/2, y + 20);
        }
        
        // Instructions
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Utilisez les flèches pour naviguer, ENTRÉE pour sélectionner', this.canvas.width/2, this.canvas.height - 30);
    }
    
    gameLoop() {
        this.render();
        
        if (this.gameRunning && !this.gamePaused) {
            this.update();
        }
        
        // Continuer la boucle si le jeu est en cours ou si on affiche le menu
        if (this.gameRunning || this.gamePaused || this.showMenu || !this.gameStarted) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Initialisation
let pongGame;

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('pongCanvas');
    if (canvas) {
        pongGame = new PongGame(canvas);
        pongGame.gameLoop();
    }
});

