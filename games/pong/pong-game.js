// Pong Game - Complet et fonctionnel
class PongGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // État du jeu
        this.gameRunning = false;
        this.gameStarted = false;
        this.gamePaused = false;
        this.gameOver = false;
        
        // Scores
        this.playerScore = 0;
        this.aiScore = 0;
        this.maxScore = 5;
        
        // Raquette joueur
        this.player = {
            x: 10,
            y: this.canvas.height / 2 - 50,
            width: 15,
            height: 100,
            speed: 6,
            dy: 0
        };
        
        // Raquette IA
        this.ai = {
            x: this.canvas.width - 25,
            y: this.canvas.height / 2 - 50,
            width: 15,
            height: 100,
            speed: 4,
            dy: 0
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
            player: '#4ECDC4',
            ai: '#FF6B6B',
            ball: '#FFD700',
            text: '#FFFFFF',
            trail: '#FFD700',
            particle: '#FFFFFF'
        };
        
        this.setupEventListeners();
        this.resetBall();
    }
    
    setupEventListeners() {
        // Clavier
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                if (!this.gameStarted) {
                    this.start();
                } else if (this.gameRunning) {
                    this.togglePause();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Clic pour démarrer
        this.canvas.addEventListener('click', () => {
            if (!this.gameStarted) {
                this.start();
            }
        });
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
        this.aiScore = 0;
        this.gameOver = false;
        this.gameRunning = false;
        this.gameStarted = false;
        this.gamePaused = false;
        
        // Reset positions
        this.player.y = this.canvas.height / 2 - 50;
        this.ai.y = this.canvas.height / 2 - 50;
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
        
        this.updatePlayer();
        this.updateAI();
        this.updateBall();
        this.updateParticles();
        this.updateBallTrail();
        this.checkWinCondition();
    }
    
    updatePlayer() {
        // Contrôles du joueur
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            this.player.dy = -this.player.speed;
        } else if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            this.player.dy = this.player.speed;
        } else {
            this.player.dy = 0;
        }
        
        // Mise à jour position
        this.player.y += this.player.dy;
        
        // Limites
        if (this.player.y < 0) this.player.y = 0;
        if (this.player.y + this.player.height > this.canvas.height) {
            this.player.y = this.canvas.height - this.player.height;
        }
    }
    
    updateAI() {
        // IA simple mais efficace
        const ballCenterY = this.ball.y;
        const aiCenterY = this.ai.y + this.ai.height / 2;
        const difference = ballCenterY - aiCenterY;
        
        // L'IA réagit seulement si la balle se dirige vers elle
        if (this.ball.dx > 0) {
            if (Math.abs(difference) > 10) {
                this.ai.dy = difference > 0 ? this.ai.speed : -this.ai.speed;
            } else {
                this.ai.dy = 0;
            }
        } else {
            // Retour au centre quand la balle s'éloigne
            const centerY = this.canvas.height / 2 - this.ai.height / 2;
            const centerDiff = centerY - this.ai.y;
            if (Math.abs(centerDiff) > 5) {
                this.ai.dy = centerDiff > 0 ? this.ai.speed * 0.3 : -this.ai.speed * 0.3;
            } else {
                this.ai.dy = 0;
            }
        }
        
        // Mise à jour position
        this.ai.y += this.ai.dy;
        
        // Limites
        if (this.ai.y < 0) this.ai.y = 0;
        if (this.ai.y + this.ai.height > this.canvas.height) {
            this.ai.y = this.canvas.height - this.ai.height;
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
        
        // Collision avec la raquette du joueur
        if (this.ball.x - this.ball.radius <= this.player.x + this.player.width &&
            this.ball.x + this.ball.radius >= this.player.x &&
            this.ball.y >= this.player.y &&
            this.ball.y <= this.player.y + this.player.height) {
            
            if (this.ball.dx < 0) { // Seulement si la balle va vers le joueur
                // Calcul de l'angle de rebond
                const hitPos = (this.ball.y - this.player.y) / this.player.height;
                const angle = (hitPos - 0.5) * Math.PI / 3; // ±60 degrés
                
                const speed = Math.min(Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy) + 0.2, this.ball.maxSpeed);
                this.ball.dx = speed * Math.cos(angle);
                this.ball.dy = speed * Math.sin(angle);
                
                this.createParticles(this.ball.x, this.ball.y, this.colors.player);
            }
        }
        
        // Collision avec la raquette de l'IA
        if (this.ball.x + this.ball.radius >= this.ai.x &&
            this.ball.x - this.ball.radius <= this.ai.x + this.ai.width &&
            this.ball.y >= this.ai.y &&
            this.ball.y <= this.ai.y + this.ai.height) {
            
            if (this.ball.dx > 0) { // Seulement si la balle va vers l'IA
                // Calcul de l'angle de rebond
                const hitPos = (this.ball.y - this.ai.y) / this.ai.height;
                const angle = Math.PI - (hitPos - 0.5) * Math.PI / 3; // ±60 degrés
                
                const speed = Math.min(Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy) + 0.2, this.ball.maxSpeed);
                this.ball.dx = -speed * Math.cos(angle);
                this.ball.dy = speed * Math.sin(angle);
                
                this.createParticles(this.ball.x, this.ball.y, this.colors.ai);
            }
        }
        
        // Points marqués
        if (this.ball.x < 0) {
            this.aiScore++;
            this.createScoreParticles(this.canvas.width / 2, this.canvas.height / 2, this.colors.ai);
            this.resetBall();
            this.updateUI();
        } else if (this.ball.x > this.canvas.width) {
            this.playerScore++;
            this.createScoreParticles(this.canvas.width / 2, this.canvas.height / 2, this.colors.player);
            this.resetBall();
            this.updateUI();
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
        if (this.playerScore >= this.maxScore || this.aiScore >= this.maxScore) {
            this.gameOver = true;
            this.gameRunning = false;
            this.showGameOver();
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
        
        // Ligne centrale
        this.drawCenterLine();
        
        // Raquettes
        this.drawPaddle(this.player, this.colors.player);
        this.drawPaddle(this.ai, this.colors.ai);
        
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
        
        // Score joueur
        this.ctx.fillText(this.playerScore, this.canvas.width / 4, 60);
        
        // Score IA
        this.ctx.fillText(this.aiScore, (this.canvas.width * 3) / 4, 60);
        
        // Labels
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('JOUEUR', this.canvas.width / 4, 90);
        this.ctx.fillText('IA', (this.canvas.width * 3) / 4, 90);
    }
    
    drawStartMessage() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PONG', this.canvas.width/2, this.canvas.height/2 - 60);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Cliquez ou appuyez sur ESPACE pour commencer', this.canvas.width/2, this.canvas.height/2 - 10);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Utilisez les flèches ou W/S pour déplacer votre raquette', this.canvas.width/2, this.canvas.height/2 + 20);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Premier à ${this.maxScore} points gagne!`, this.canvas.width/2, this.canvas.height/2 + 50);
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
        document.getElementById('playerScore').textContent = this.playerScore;
        document.getElementById('aiScore').textContent = this.aiScore;
    }
    
    showGameOver() {
        const winner = this.playerScore >= this.maxScore ? 'Joueur' : 'IA';
        document.getElementById('winner').textContent = winner;
        document.getElementById('finalPlayerScore').textContent = this.playerScore;
        document.getElementById('finalAiScore').textContent = this.aiScore;
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
let pongGame;

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('pongCanvas');
    pongGame = new PongGame(canvas);
    
    // Bouton restart
    document.getElementById('restartBtn').addEventListener('click', function() {
        document.getElementById('gameMessage').style.display = 'none';
        pongGame.restart();
    });
    
    // Démarrer le rendu
    pongGame.render();
});
const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');
const gameMessage = document.getElementById('gameMessage');
const winnerMessage = document.getElementById('winnerMessage');
const newGameBtn = document.getElementById('newGameBtn');

// Game objects
let gameRunning = true;
let ball, paddle1, paddle2;
let keys = {};
let speedMultiplier = 1.0;

// Audio system
let audio = {
    sounds: {},
    music: null
};

// Précharger les sons et la musique pour Pong
function preloadAudio() {
    try {
        // Créer un contexte audio
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Sons à précharger
        const soundsToLoad = {
            'hit': 'https://bearable-hacker.io/pong-hit.mp3',
            'score': 'https://bearable-hacker.io/pong-score.mp3',
            'wall': 'https://bearable-hacker.io/pong-wall.mp3',
            'background': 'https://bearable-hacker.io/pong-background.mp3'
        };
        
        // Charger chaque son
        Object.entries(soundsToLoad).forEach(([name, url]) => {
            fetch(url)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    audio.sounds[name] = {
                        buffer: audioBuffer,
                        context: audioContext,
                        loop: name === 'background'
                    };
                })
                .catch(e => console.log('Erreur de chargement audio:', e));
        });
    } catch (e) {
        console.log('Audio non supporté:', e);
    }
}

// Jouer un son
function playSound(soundName) {
    try {
        if (!audio.sounds[soundName]) return null;
        
        const sound = audio.sounds[soundName];
        const source = sound.context.createBufferSource();
        source.buffer = sound.buffer;
        source.connect(sound.context.destination);
        source.loop = sound.loop;
        source.start(0);
        
        return source;
    } catch (e) {
        console.log('Erreur de lecture audio:', e);
        return null;
    }
}

// Démarrer la musique de fond
function startMusic() {
    if (audio.music) {
        audio.music.stop();
    }
    audio.music = playSound('background');
}

function initGame() {
    // Précharger les sons
    preloadAudio();
    
    // Initialize game objects
    ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        velocityX: 5,
        velocityY: 4,
        color: '#667eea'
    };
    
    paddle1 = {
        x: 10,
        y: canvas.height / 2 - 50,
        width: 10,
        height: 100,
        color: '#ff6b6b',
        score: 0
    };
    
    paddle2 = {
        x: canvas.width - 20,
        y: canvas.height / 2 - 50,
        width: 10,
        height: 100,
        color: '#4ecdc4',
        score: 0
    };
    
    // Update score display
    player1ScoreElement.textContent = paddle1.score;
    player2ScoreElement.textContent = paddle2.score;
    
    // Start game loop
    gameLoop();
}

// Controls
function handleKeyDown(e) {
    keys[e.key] = true;
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

function updatePaddles() {
    const paddleSpeed = 12 * speedMultiplier;
    
    // Player 1 (W/S)
    if (keys['w'] || keys['W']) {
        paddle1.y = Math.max(0, paddle1.y - paddleSpeed);
    }
    if (keys['s'] || keys['S']) {
        paddle1.y = Math.min(canvas.height - paddle1.height, paddle1.y + paddleSpeed);
    }
    
    // Player 2 (Arrow keys)
    if (keys['ArrowUp']) {
        paddle2.y = Math.max(0, paddle2.y - paddleSpeed);
    }
    if (keys['ArrowDown']) {
        paddle2.y = Math.min(canvas.height - paddle2.height, paddle2.y + paddleSpeed);
    }
}

function updateBall() {
    // La vitesse augmente légèrement avec le temps pour plus de difficulté
    const speedIncrement = Math.min(1.5, 1.0 + Math.min(0.5, paddle1.score + paddle2.score) / 10);
    
    ball.x += ball.velocityX * speedMultiplier * speedIncrement;
    ball.y += ball.velocityY * speedMultiplier * speedIncrement;
      
    // Top and bottom walls
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.velocityY = -ball.velocityY;
        playSound('wall'); // Jouer son de rebond sur mur
    }
    
    // Paddle collisions
    if (ball.x - ball.radius < paddle1.x + paddle1.width &&
        ball.y > paddle1.y && ball.y < paddle1.y + paddle1.height) {
        ball.velocityX = Math.abs(ball.velocityX);
        ball.velocityY += (Math.random() - 0.5) * 2;
        playSound('hit'); // Jouer le son de collision
    }
    
    if (ball.x + ball.radius > paddle2.x &&
        ball.y > paddle2.y && ball.y < paddle2.y + paddle2.height) {
        ball.velocityX = -Math.abs(ball.velocityX);
        ball.velocityY += (Math.random() - 0.5) * 2;
        playSound('hit'); // Jouer le son de collision
    }
    
    // Scoring
    if (ball.x < 0) {
        paddle2.score++;
        playSound('score'); // Jouer le son de score
        resetBall();
    }
    if (ball.x > canvas.width) {
        paddle1.score++;
        playSound('score'); // Jouer le son de score
        resetBall();
    }
    
    // Update score display
    player1ScoreElement.textContent = paddle1.score;
    player2ScoreElement.textContent = paddle2.score;
    
    // Check win condition
    if (paddle1.score >= 5 || paddle2.score >= 5) {
        const winnerNumber = paddle1.score >= 5 ? '1' : '2';
        winnerMessage.textContent = `🎉 Joueur ${winnerNumber} gagne !`;
        gameMessage.style.display = 'block';
        gameRunning = false;
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.velocityX = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.velocityY = (Math.random() - 0.5) * 6;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#667eea';
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles
    ctx.fillStyle = paddle1.color;
    ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
    
    ctx.fillStyle = paddle2.color;
    ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);
    
    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

function gameLoop() {
    if (!gameRunning) return;
    
    updatePaddles();
    updateBall();
    draw();
    
    requestAnimationFrame(gameLoop);
}

function startNewGame() {
    gameMessage.style.display = 'none';
    paddle1.score = 0;
    paddle2.score = 0;
    player1ScoreElement.textContent = '0';
    player2ScoreElement.textContent = '0';
    resetBall();
    gameRunning = true;
    gameLoop();
}

// New game button event
newGameBtn.addEventListener('click', startNewGame);

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', initGame);
