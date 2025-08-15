/**
 * BREAKOUT MODERNE - JavaScript ES6+ avec Canvas API
 * Fonctionnalités: Power-ups, effets visuels, niveaux progressifs, physique avancée
 */

class ModernBreakout {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration du jeu
        this.config = {
            paddleWidth: 100,
            paddleHeight: 15,
            ballSize: 8,
            ballSpeed: 6,
            paddleSpeed: 8,
            brickRows: 8,
            brickCols: 10,
            brickWidth: 70,
            brickHeight: 20,
            brickPadding: 5,
            brickOffsetTop: 80,
            brickOffsetLeft: 45
        };
        
        // État du jeu
        this.gameState = 'menu'; // menu, playing, paused, gameOver, levelComplete
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.bricksRemaining = 0;
        
        // Objets du jeu
        this.paddle = {
            x: this.canvas.width / 2 - this.config.paddleWidth / 2,
            y: this.canvas.height - 30,
            width: this.config.paddleWidth,
            height: this.config.paddleHeight,
            dx: 0
        };
        
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            dx: this.config.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
            dy: -this.config.ballSpeed,
            size: this.config.ballSize,
            trail: [],
            stuck: true // Balle collée à la raquette au début
        };
        
        this.bricks = [];
        this.powerUps = [];
        this.particles = [];
        
        // Power-ups actifs
        this.activePowerUps = {
            bigPaddle: 0,
            multiball: 0,
            fastBall: 0,
            slowBall: 0,
            extraLife: 0
        };
        
        this.balls = [this.ball]; // Support pour multi-ball
        
        // Contrôles
        this.mouse = { x: 0, y: 0 };
        this.keys = new Set();
        
        // Audio
        this.audioContext = null;
        this.sounds = {};
        this.music = {
            enabled: localStorage.getItem('breakoutMusicEnabled') !== 'false',
            currentTrack: null,
            volume: 0.3,
            isPlaying: false,
            currentTrackIndex: -1
        };
        
        // Collection de 8 pistes énergiques pour Breakout
        this.musicTracks = [
            { name: 'Arcade Thunder', tempo: 130, style: 'classic', baseFreq: 220 },
            { name: 'Neon Bricks', tempo: 140, style: 'cyberpunk', baseFreq: 196 },
            { name: 'Retro Pulse', tempo: 125, style: 'retro', baseFreq: 261 },
            { name: 'Power Surge', tempo: 150, style: 'intense', baseFreq: 174 },
            { name: 'Digital Break', tempo: 135, style: 'electronic', baseFreq: 233 },
            { name: 'Neon Runner', tempo: 145, style: 'fast', baseFreq: 208 },
            { name: 'Cyber Bounce', tempo: 128, style: 'groove', baseFreq: 185 },
            { name: 'Electric Wave', tempo: 142, style: 'wave', baseFreq: 247 }
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initAudio();
        this.resizeCanvas();
        this.updateMusicButton();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Souris
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'playing' && this.ball.stuck) {
                this.launchBall();
            }
        });
        
        // Clavier
        document.addEventListener('keydown', (e) => {
            this.keys.add(e.key.toLowerCase());
            
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    if (this.ball.stuck) {
                        this.launchBall();
                    } else {
                        this.pauseGame();
                    }
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
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(800, container.clientWidth - 40);
        const maxHeight = Math.min(600, container.clientHeight - 40);
        
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
        
        // Réajuster les positions
        this.paddle.x = this.canvas.width / 2 - this.paddle.width / 2;
        this.paddle.y = this.canvas.height - 30;
        
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height - 50;
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
        this.sounds.paddleHit = () => this.playTone(220, 0.1, 0.1);
        
        // Son de collision brique
        this.sounds.brickHit = () => this.playTone(440, 0.05, 0.08);
        
        // Son de collision mur
        this.sounds.wallHit = () => this.playTone(330, 0.08, 0.06);
        
        // Son de power-up
        this.sounds.powerUp = () => {
            this.playTone(523, 0.1, 0.05);
            setTimeout(() => this.playTone(659, 0.1, 0.05), 100);
            setTimeout(() => this.playTone(784, 0.1, 0.1), 200);
        };
        
        // Son de perte de vie
        this.sounds.loseLife = () => {
            this.playTone(200, 0.2, 0.05);
            setTimeout(() => this.playTone(150, 0.3, 0.1), 200);
        };
        
        // Son de victoire niveau
        this.sounds.levelComplete = () => {
            [523, 659, 784, 1047].forEach((freq, i) => {
                setTimeout(() => this.playTone(freq, 0.15, 0.2), i * 150);
            });
        };
    }
    
    playTone(frequency, volume, duration) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.resetPowerUps();
        this.createLevel();
        this.resetBall();
        this.hideMenu();
        this.updateUI();
        
        // Activer le contexte audio
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Démarrer la musique de fond
        this.startMusic();
    }
    
    createLevel() {
        this.bricks = [];
        this.bricksRemaining = 0;
        
        const colors = ['#ff0066', '#ff6600', '#ffff00', '#00ff66', '#0066ff', '#6600ff', '#ff0066', '#ff6600'];
        
        for (let row = 0; row < this.config.brickRows; row++) {
            for (let col = 0; col < this.config.brickCols; col++) {
                // Patterns spéciaux selon le niveau
                if (this.shouldCreateBrick(row, col)) {
                    const brick = {
                        x: col * (this.config.brickWidth + this.config.brickPadding) + this.config.brickOffsetLeft,
                        y: row * (this.config.brickHeight + this.config.brickPadding) + this.config.brickOffsetTop,
                        width: this.config.brickWidth,
                        height: this.config.brickHeight,
                        color: colors[row % colors.length],
                        visible: true,
                        hits: this.level > 3 ? (row < 2 ? 2 : 1) : 1, // Briques résistantes aux niveaux élevés
                        maxHits: this.level > 3 ? (row < 2 ? 2 : 1) : 1,
                        powerUp: Math.random() < 0.15 // 15% de chance de power-up
                    };
                    
                    this.bricks.push(brick);
                    this.bricksRemaining++;
                }
            }
        }
    }
    
    shouldCreateBrick(row, col) {
        // Patterns différents selon le niveau
        switch (this.level % 4) {
            case 1: return true; // Toutes les briques
            case 2: return (row + col) % 2 === 0; // Damier
            case 3: return row % 2 === 0 || col % 3 === 0; // Lignes
            case 0: return Math.abs(col - 4.5) + row < 6; // Pyramide
            default: return true;
        }
    }
    
    resetBall() {
        this.balls = [{
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            dx: this.config.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
            dy: -this.config.ballSpeed,
            size: this.config.ballSize,
            trail: [],
            stuck: true
        }];
        this.ball = this.balls[0];
    }
    
    launchBall() {
        this.balls.forEach(ball => {
            ball.stuck = false;
            if (ball.dx === 0) {
                ball.dx = this.config.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
            }
        });
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePaddle();
        this.updateBalls();
        this.updatePowerUps();
        this.updateParticles();
        this.updatePowerUpTimers();
        this.checkCollisions();
        this.checkGameState();
    }
    
    updatePaddle() {
        // Contrôle souris
        const targetX = this.mouse.x - this.paddle.width / 2;
        this.paddle.x += (targetX - this.paddle.x) * 0.2;
        
        // Contrôle clavier
        if (this.keys.has('arrowleft') || this.keys.has('a')) {
            this.paddle.x -= this.config.paddleSpeed;
        }
        if (this.keys.has('arrowright') || this.keys.has('d')) {
            this.paddle.x += this.config.paddleSpeed;
        }
        
        // Limites
        this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, this.paddle.x));
    }
    
    updateBalls() {
        try {
            for (let i = this.balls.length - 1; i >= 0; i--) {
                const ball = this.balls[i];
                
                if (ball.stuck) {
                    // Balle collée à la raquette
                    ball.x = this.paddle.x + this.paddle.width / 2;
                    ball.y = this.paddle.y - ball.size;
                    continue;
                }
                
                // Mouvement
                ball.x += ball.dx;
                ball.y += ball.dy;
                
                // Trail
                ball.trail.push({ x: ball.x, y: ball.y });
                if (ball.trail.length > 8) {
                    ball.trail.shift();
                }
                
                // Collisions avec les murs
                if (ball.x <= ball.size || ball.x >= this.canvas.width - ball.size) {
                    ball.dx = -ball.dx;
                    this.createImpactParticles(ball.x, ball.y, '#00ffff');
                    this.sounds.wallHit?.();
                }
                
                if (ball.y <= ball.size) {
                    ball.dy = -ball.dy;
                    this.createImpactParticles(ball.x, ball.y, '#00ffff');
                    this.sounds.wallHit?.();
                }
                
                // Balle perdue
                if (ball.y > this.canvas.height + ball.size) {
                    this.balls.splice(i, 1);
                    
                    if (this.balls.length === 0) {
                        this.loseLife();
                    }
                }
            }
        } catch (error) {
            console.warn('Erreur lors de la mise à jour des balles:', error);
        }
    }
    
    updatePowerUps() {
        try {
            for (let i = this.powerUps.length - 1; i >= 0; i--) {
                const powerUp = this.powerUps[i];
                
                powerUp.y += powerUp.speed;
                powerUp.rotation += powerUp.rotationSpeed;
                
                // Collision avec la raquette
                if (powerUp.x < this.paddle.x + this.paddle.width &&
                    powerUp.x + powerUp.size > this.paddle.x &&
                    powerUp.y < this.paddle.y + this.paddle.height &&
                    powerUp.y + powerUp.size > this.paddle.y) {
                    
                    this.activatePowerUp(powerUp.type);
                    this.createPowerUpParticles(powerUp.x, powerUp.y);
                    this.sounds.powerUp?.();
                    this.powerUps.splice(i, 1);
                    continue;
                }
                
                // Supprimer si hors écran
                if (powerUp.y > this.canvas.height) {
                    this.powerUps.splice(i, 1);
                }
            }
        } catch (error) {
            console.warn('Erreur lors de la mise à jour des power-ups:', error);
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
    
    updatePowerUpTimers() {
        Object.keys(this.activePowerUps).forEach(key => {
            if (this.activePowerUps[key] > 0) {
                this.activePowerUps[key]--;
                
                if (this.activePowerUps[key] === 0) {
                    this.deactivatePowerUp(key);
                }
            }
        });
    }
    
    checkCollisions() {
        this.balls.forEach(ball => {
            if (ball.stuck) return;
            
            // Collision avec la raquette
            if (ball.x + ball.size > this.paddle.x &&
                ball.x - ball.size < this.paddle.x + this.paddle.width &&
                ball.y + ball.size > this.paddle.y &&
                ball.y - ball.size < this.paddle.y + this.paddle.height &&
                ball.dy > 0) {
                
                // Position relative sur la raquette (-1 à 1)
                const relativeIntersect = (ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
                
                // Angle de rebond
                const angle = relativeIntersect * Math.PI / 3; // Max 60 degrés
                const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                
                ball.dx = Math.sin(angle) * speed;
                ball.dy = -Math.cos(angle) * speed;
                
                this.createImpactParticles(ball.x, ball.y, '#ff6600');
                this.sounds.paddleHit?.();
            }
            
            // Collision avec les briques
            this.bricks.forEach(brick => {
                if (!brick.visible) return;
                
                if (ball.x + ball.size > brick.x &&
                    ball.x - ball.size < brick.x + brick.width &&
                    ball.y + ball.size > brick.y &&
                    ball.y - ball.size < brick.y + brick.height) {
                    
                    this.hitBrick(brick, ball);
                }
            });
        });
    }
    
    hitBrick(brick, ball) {
        brick.hits--;
        
        if (brick.hits <= 0) {
            brick.visible = false;
            this.bricksRemaining--;
            this.score += (this.level * 10);
            
            // Power-up
            if (brick.powerUp) {
                this.createPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
            }
            
            this.createBrickParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
        } else {
            // Brique endommagée mais pas détruite
            brick.color = this.adjustBrightness(brick.color, -30);
        }
        
        // Rebond de la balle
        const ballCenterX = ball.x;
        const ballCenterY = ball.y;
        const brickCenterX = brick.x + brick.width / 2;
        const brickCenterY = brick.y + brick.height / 2;
        
        const dx = ballCenterX - brickCenterX;
        const dy = ballCenterY - brickCenterY;
        
        if (Math.abs(dx / brick.width) > Math.abs(dy / brick.height)) {
            ball.dx = -ball.dx;
        } else {
            ball.dy = -ball.dy;
        }
        
        this.sounds.brickHit?.();
    }
    
    createPowerUp(x, y) {
        const types = ['bigPaddle', 'multiball', 'fastBall', 'slowBall', 'extraLife'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.powerUps.push({
            x: x - 15,
            y: y - 15,
            size: 30,
            type: type,
            speed: 3,
            rotation: 0,
            rotationSpeed: 0.1,
            color: this.getPowerUpColor(type)
        });
    }
    
    getPowerUpColor(type) {
        const colors = {
            bigPaddle: '#00ff66',
            multiball: '#ff6600',
            fastBall: '#ff0066',
            slowBall: '#0066ff',
            extraLife: '#ffff00'
        };
        return colors[type] || '#ffffff';
    }
    
    activatePowerUp(type) {
        try {
            const duration = 600; // 10 secondes à 60 FPS
            
            switch (type) {
                case 'bigPaddle':
                    if (this.activePowerUps.bigPaddle === 0) {
                        this.paddle.width *= 1.5;
                    }
                    this.activePowerUps.bigPaddle = duration;
                    break;
                    
                case 'multiball':
                    this.balls.forEach(ball => {
                        if (!ball.stuck) {
                            // Créer 2 balles supplémentaires
                            for (let i = 0; i < 2; i++) {
                                const newBall = {
                                    x: ball.x,
                                    y: ball.y,
                                    dx: ball.dx * (0.7 + Math.random() * 0.6),
                                    dy: ball.dy * (0.7 + Math.random() * 0.6),
                                    size: ball.size,
                                    trail: [],
                                    stuck: false
                                };
                                this.balls.push(newBall);
                            }
                        }
                    });
                    break;
                    
                case 'fastBall':
                    this.balls.forEach(ball => {
                        ball.dx *= 1.5;
                        ball.dy *= 1.5;
                    });
                    this.activePowerUps.fastBall = duration;
                    break;
                    
                case 'slowBall':
                    this.balls.forEach(ball => {
                        ball.dx *= 0.7;
                        ball.dy *= 0.7;
                    });
                    this.activePowerUps.slowBall = duration;
                    break;
                    
                case 'extraLife':
                    this.lives++;
                    break;
            }
            
            this.showPowerUpIndicator(type);
            this.updateUI();
        } catch (error) {
            console.warn('Erreur lors de l\'activation du power-up:', error);
        }
    }
    
    deactivatePowerUp(type) {
        switch (type) {
            case 'bigPaddle':
                this.paddle.width = this.config.paddleWidth;
                break;
                
            case 'fastBall':
                this.balls.forEach(ball => {
                    ball.dx /= 1.5;
                    ball.dy /= 1.5;
                });
                break;
                
            case 'slowBall':
                this.balls.forEach(ball => {
                    ball.dx /= 0.7;
                    ball.dy /= 0.7;
                });
                break;
        }
        
        this.hidePowerUpIndicator();
    }
    
    showPowerUpIndicator(type) {
        const indicator = document.getElementById('powerupIndicator');
        const text = document.getElementById('powerupText');
        
        // Vérifier que les éléments existent
        if (!indicator || !text) return;
        
        const names = {
            bigPaddle: 'RAQUETTE GÉANTE',
            multiball: 'MULTI-BALLE',
            fastBall: 'BALLE RAPIDE',
            slowBall: 'BALLE LENTE',
            extraLife: 'VIE BONUS'
        };
        
        text.textContent = names[type] || 'POWER-UP ACTIF';
        indicator.classList.add('active');
    }
    
    hidePowerUpIndicator() {
        const indicator = document.getElementById('powerupIndicator');
        if (indicator) {
            indicator.classList.remove('active');
        }
    }
    
    createImpactParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 6,
                dy: (Math.random() - 0.5) * 6,
                life: 1,
                alpha: 1,
                color: color,
                size: Math.random() * 3 + 1
            });
        }
    }
    
    createBrickParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 8,
                dy: (Math.random() - 0.5) * 8,
                life: 1.5,
                alpha: 1,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    createPowerUpParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 10,
                dy: (Math.random() - 0.5) * 10,
                life: 2,
                alpha: 1,
                color: '#ffff00',
                size: Math.random() * 3 + 1
            });
        }
    }
    
    adjustBrightness(color, amount) {
        // Simplification : retourner une couleur plus sombre
        return color === '#ff0066' ? '#cc0044' :
               color === '#ff6600' ? '#cc4400' :
               color === '#ffff00' ? '#cccc00' :
               color === '#00ff66' ? '#00cc44' :
               color === '#0066ff' ? '#0044cc' :
               color === '#6600ff' ? '#4400cc' : color;
    }
    
    checkGameState() {
        // Victoire du niveau
        if (this.bricksRemaining <= 0) {
            this.levelComplete();
        }
    }
    
    loseLife() {
        this.lives--;
        this.sounds.loseLife?.();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetBall();
            this.resetPowerUps();
        }
        
        this.updateUI();
    }
    
    levelComplete() {
        this.level++;
        this.sounds.levelComplete?.();
        this.createLevel();
        this.resetBall();
        this.resetPowerUps();
        this.updateUI();
        
        // Bonus de niveau
        this.score += this.level * 100;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Arrêter complètement la musique et tous les sons
        this.stopMusic();
        
        document.getElementById('resultText').textContent = 'GAME OVER!';
        document.getElementById('finalStatsText').textContent = 
            `Score final: ${this.score} | Niveau atteint: ${this.level}`;
        document.getElementById('gameOverOverlay').style.display = 'flex';
    }
    
    resetPowerUps() {
        Object.keys(this.activePowerUps).forEach(key => {
            if (this.activePowerUps[key] > 0) {
                this.deactivatePowerUp(key);
                this.activePowerUps[key] = 0;
            }
        });
        this.powerUps = [];
    }
    
    startMusic() {
        if (!this.music.enabled || !this.audioContext || this.music.isPlaying) return;
        
        this.stopMusic();
        
        // Sélectionner une piste aléatoire différente de la précédente
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * this.musicTracks.length);
        } while (randomIndex === this.music.currentTrackIndex && this.musicTracks.length > 1);
        
        this.music.currentTrackIndex = randomIndex;
        const selectedTrack = this.musicTracks[randomIndex];
        
        console.log(`🧱 Musique Breakout: ${selectedTrack.name} (${selectedTrack.tempo} BPM - ${selectedTrack.style})`);
        
        this.music.currentTrack = this.createBackgroundMusic(selectedTrack);
        this.music.isPlaying = true;
    }
    
    stopMusic() {
        if (this.music.currentTrack) {
            try {
                // Arrêter tous les composants audio
                if (this.music.currentTrack.oscillator1) {
                    this.music.currentTrack.oscillator1.stop();
                }
                if (this.music.currentTrack.oscillator2) {
                    this.music.currentTrack.oscillator2.stop();
                }
                if (this.music.currentTrack.gainNode) {
                    this.music.currentTrack.gainNode.disconnect();
                }
                if (this.music.currentTrack.filter) {
                    this.music.currentTrack.filter.disconnect();
                }
            } catch (e) {
                // Ignore errors when stopping music
            }
            this.music.currentTrack = null;
        }
        this.music.isPlaying = false;
    }
    
    toggleMusic() {
        this.music.enabled = !this.music.enabled;
        localStorage.setItem('breakoutMusicEnabled', this.music.enabled.toString());
        
        const musicToggle = document.getElementById('musicToggle');
        const musicIcon = document.getElementById('musicIcon');
        
        if (this.music.enabled) {
            musicToggle.classList.remove('disabled');
            musicIcon.className = 'bi bi-music-note-beamed';
            if (this.gameState === 'playing') {
                this.startMusic();
            }
        } else {
            musicToggle.classList.add('disabled');
            musicIcon.className = 'bi bi-music-note-beamed-off';
            this.stopMusic();
        }
    }
    
    updateMusicButton() {
        const musicToggle = document.getElementById('musicToggle');
        const musicIcon = document.getElementById('musicIcon');
        
        if (musicToggle && musicIcon) {
            if (this.music.enabled) {
                musicToggle.classList.remove('disabled');
                musicIcon.className = 'bi bi-music-note-beamed';
            } else {
                musicToggle.classList.add('disabled');
                musicIcon.className = 'bi bi-music-note-beamed-off';
            }
        }
    }

    createBackgroundMusic(trackInfo = null) {
        if (!this.audioContext) return null;
        
        // Utiliser une piste par défaut si aucune n'est fournie
        if (!trackInfo) {
            trackInfo = this.musicTracks[0];
        }
        
        try {
            // Créer les nœuds audio
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            // Configuration du filtre selon le style
            filter.type = 'lowpass';
            const filterFreq = trackInfo.style === 'cyberpunk' ? 1500 : 
                              trackInfo.style === 'intense' ? 1800 : 1200;
            filter.frequency.setValueAtTime(filterFreq, this.audioContext.currentTime);
            
            // Configuration du gain (volume faible pour la musique de fond)
            gainNode.gain.setValueAtTime(this.music.volume * 0.3, this.audioContext.currentTime);
            
            // Configuration des oscillateurs selon le style
            if (trackInfo.style === 'cyberpunk' || trackInfo.style === 'electronic') {
                oscillator1.type = 'sawtooth';
                oscillator2.type = 'square';
            } else if (trackInfo.style === 'retro' || trackInfo.style === 'classic') {
                oscillator1.type = 'sine';
                oscillator2.type = 'triangle';
            } else {
                oscillator1.type = 'triangle';
                oscillator2.type = 'sine';
            }
            
            // Connexion des nœuds
            oscillator1.connect(filter);
            oscillator2.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Mélodie adaptée au style et à la fréquence de base
            const baseFreq = trackInfo.baseFreq;
            let currentTime = this.audioContext.currentTime;
            const noteDuration = 0.4;
            
            // Séquence mélodique simple
            const notes = [
                1.0,   // La
                1.125, // Si
                1.33,  // Mi
                1.0,   // La
                0.75,  // Fa#
                1.0,   // La
                1.5,   // Mi aigu
                1.33   // Mi
            ];
            
            notes.forEach((multiplier, index) => {
                const freq = baseFreq * multiplier;
                const time = currentTime + (index * noteDuration);
                
                // Oscillateur principal
                oscillator1.frequency.setValueAtTime(freq, time);
                
                // Harmonie (quinte)
                oscillator2.frequency.setValueAtTime(freq * 1.5, time);
                
                // Petit fade in/out pour chaque note
                gainNode.gain.setValueAtTime(this.music.volume * 0.1, time);
                gainNode.gain.exponentialRampToValueAtTime(this.music.volume * 0.3, time + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(this.music.volume * 0.1, time + noteDuration - 0.05);
            });
            
            oscillator1.start();
            oscillator2.start();
            
            const loopDuration = notes.length * noteDuration * 1000;
            
            // Arrêter les oscillateurs à la fin de la boucle
            setTimeout(() => {
                try {
                    oscillator1.stop();
                    oscillator2.stop();
                } catch (e) {
                    // Ignore errors
                }
            }, loopDuration);
            
            // Redémarrer automatiquement la musique
            setTimeout(() => {
                if (this.music.isPlaying && this.gameState === 'playing') {
                    this.startMusic();
                }
            }, loopDuration);
            
            return { oscillator1, oscillator2, gainNode, filter };
        } catch (error) {
            console.warn('Erreur lors de la création de la musique:', error);
            return null;
        }
    }
    
    render() {
        // Fond avec effet de gradation
        this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Briques
        this.drawBricks();
        
        // Raquette
        this.drawPaddle();
        
        // Balles
        this.drawBalls();
        
        // Power-ups
        this.drawPowerUps();
        
        // Particules
        this.drawParticles();
        
        // Instructions si balle collée
        if (this.balls.some(ball => ball.stuck)) {
            this.drawInstructions();
        }
    }
    
    drawBricks() {
        this.bricks.forEach(brick => {
            if (!brick.visible) return;
            
            // Ombre
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(brick.x + 2, brick.y + 2, brick.width, brick.height);
            
            // Brique principale
            this.ctx.fillStyle = brick.color;
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            
            // Effet de glow
            this.ctx.shadowColor = brick.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            this.ctx.shadowBlur = 0;
            
            // Bordure brillante
            if (brick.hits < brick.maxHits) {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
            }
            
            // Indicateur de power-up
            if (brick.powerUp) {
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                this.ctx.fillRect(brick.x + 5, brick.y + 5, brick.width - 10, brick.height - 10);
            }
        });
    }
    
    drawPaddle() {
        // Ombre
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(this.paddle.x + 2, this.paddle.y + 2, this.paddle.width, this.paddle.height);
        
        // Raquette principale
        const gradient = this.ctx.createLinearGradient(this.paddle.x, this.paddle.y, this.paddle.x, this.paddle.y + this.paddle.height);
        gradient.addColorStop(0, '#ff6600');
        gradient.addColorStop(1, '#ff3300');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // Effet de glow
        this.ctx.shadowColor = '#ff6600';
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        this.ctx.shadowBlur = 0;
        
        // Lignes de détail
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.paddle.x + 10, this.paddle.y + this.paddle.height / 2);
        this.ctx.lineTo(this.paddle.x + this.paddle.width - 10, this.paddle.y + this.paddle.height / 2);
        this.ctx.stroke();
    }
    
    drawBalls() {
        this.balls.forEach(ball => {
            // Trail
            if (ball.trail.length > 1) {
                for (let i = 1; i < ball.trail.length; i++) {
                    const alpha = i / ball.trail.length;
                    this.ctx.globalAlpha = alpha * 0.5;
                    this.ctx.fillStyle = '#ffffff';
                    
                    const point = ball.trail[i];
                    this.ctx.beginPath();
                    this.ctx.arc(point.x, point.y, ball.size * alpha, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
            
            this.ctx.globalAlpha = 1;
            
            // Ombre
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(ball.x + 2, ball.y + 2, ball.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Balle principale
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // Centre brillant
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(ball.x - 2, ball.y - 2, ball.size / 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            this.ctx.save();
            this.ctx.translate(powerUp.x + powerUp.size / 2, powerUp.y + powerUp.size / 2);
            this.ctx.rotate(powerUp.rotation);
            
            // Ombre
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(-powerUp.size / 2 + 2, -powerUp.size / 2 + 2, powerUp.size, powerUp.size);
            
            // Power-up principal
            this.ctx.fillStyle = powerUp.color;
            this.ctx.shadowColor = powerUp.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(-powerUp.size / 2, -powerUp.size / 2, powerUp.size, powerUp.size);
            this.ctx.shadowBlur = 0;
            
            // Symbole
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('⚡', 0, 0);
            
            this.ctx.restore();
        });
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
    
    drawInstructions() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '20px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CLIC ou ESPACE pour lancer', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    updateUI() {
        // Mettre à jour les affichages si les éléments existent
        try {
            const scoreEl = document.getElementById('scoreDisplay');
            const levelEl = document.getElementById('levelDisplay');
            const livesEl = document.getElementById('livesDisplay');
            
            if (scoreEl) scoreEl.textContent = this.score;
            if (levelEl) levelEl.textContent = this.level;
            if (livesEl) livesEl.textContent = this.lives;
        } catch (error) {
            console.warn('Erreur lors de la mise à jour de l\'UI:', error);
        }
    }
    
    pauseGame() {
        this.gameState = 'paused';
        this.stopMusic(); // Arrêter la musique en pause
        document.getElementById('pauseOverlay').style.display = 'flex';
    }
    
    resumeGame() {
        this.gameState = 'playing';
        this.startMusic(); // Redémarrer la musique
        document.getElementById('pauseOverlay').style.display = 'none';
    }
    
    restartGame() {
        this.hideGameOver();
        this.startGame();
    }
    
    showMenu() {
        this.gameState = 'menu';
        this.stopMusic(); // Arrêter la musique au menu
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
    
    gameLoop(timestamp) {
        // Boucle limitée à 60 FPS (évite d'accélérer sur écrans 120/144Hz)
        if (!this._targetFPS) {
            this._targetFPS = 60;
            this._frameDuration = 1000 / this._targetFPS;
        }

        // Démarrer correctement via requestAnimationFrame si appelée sans timestamp
        if (timestamp === undefined) {
            return requestAnimationFrame((ts) => this.gameLoop(ts));
        }

        if (this._lastFrameTime === undefined) {
            this._lastFrameTime = timestamp;
        }

        const delta = timestamp - this._lastFrameTime;

        if (delta >= this._frameDuration) {
            // Conserver une horloge stable pour éviter la dérive
            this._lastFrameTime = timestamp - (delta % this._frameDuration);
            try {
                this.update();
                this.render();
            } catch (error) {
                console.error('Erreur dans la boucle du jeu:', error);
            }
        }

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }
}

// Fonctions globales pour les boutons HTML
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new ModernBreakout();
});

function startGame() {
    game.startGame();
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

function showInstructions() {
    alert('BREAKOUT MODERNE\\n\\nObjectif: Détruisez toutes les briques!\\n\\nControles:\\n- Souris: déplacer la raquette\\n- ESPACE: lancer la balle / pause\\n- ESC: menu\\n\\nPower-ups:\\n⚡ Raquette géante\\n⚡ Multi-balle\\n⚡ Balle rapide/lente\\n⚡ Vie bonus');
}
