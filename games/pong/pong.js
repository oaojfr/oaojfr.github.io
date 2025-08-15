/**
 * PONG MODERN CYBERPUNK - JEU DE TENNIS DE TABLE FUTURISTE
 * Modes 1 joueur (vs IA) et 2 joueurs avec design cyberpunk
 */

console.log('Starting Pong script load...');

class PongGame {
    constructor() {
        console.log('Creating PongGame instance...');
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // État du jeu
        this.gameState = 'menu';
        this.gameMode = 'ai';
        this.score = { player1: 0, player2: 0 };
        this.winningScore = 5;
        
        // Configuration du jeu
        this.PADDLE_WIDTH = 12;
        this.PADDLE_HEIGHT = 80;
        this.PADDLE_SPEED = 8;
        this.BALL_SIZE = 12;
        this.MAX_BALL_SPEED = 10;
        
        // Initialiser les dimensions
        this.canvas.width = 800;
        this.canvas.height = 500;
        
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
            aiDifficulty: 0.08
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
        
        // Système audio
        this.audioContext = null;
        this.sounds = {};
        this.music = {
            enabled: localStorage.getItem('pongMusicEnabled') !== 'false',
            currentTrack: null,
            volume: 0.3,
            isPlaying: false,
            currentTrackIndex: -1
        };
        
        // Collection de 6 pistes cyberpunk pour Pong
        this.musicTracks = [
            { name: 'Cyber Pong Classic', tempo: 120, style: 'classic', baseFreq: 110 },
            { name: 'Neon Table Tennis', tempo: 140, style: 'energetic', baseFreq: 98 },
            { name: 'Digital Paddle', tempo: 130, style: 'ambient', baseFreq: 123 },
            { name: 'Electric Rally', tempo: 150, style: 'intense', baseFreq: 87 },
            { name: 'Cyber Arena', tempo: 125, style: 'flowing', baseFreq: 104 },
            { name: 'Holographic Match', tempo: 135, style: 'hypnotic', baseFreq: 116 }
        ];
        
        this.initializeGame();
    }
    
    initializeGame() {
        console.log('Initializing game...');
        this.setupEventListeners();
        this.initAudio();
        this.updateMusicButton();
        this.updateScoreDisplay();
        this.gameLoop();
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
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    startGame(mode) {
        console.log('Starting game with mode:', mode);
        this.gameMode = mode;
        this.gameState = 'playing';
        this.score = { player1: 0, player2: 0 };
        
        this.player1.name = 'JOUEUR 1';
        this.player2.name = mode === 'ai' ? 'IA' : 'JOUEUR 2';
        
        this.resetBall();
        this.resetPaddles();
        this.hideAllOverlays();
        this.updateScoreDisplay();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        this.showOverlay('pauseOverlay');
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
        this.showOverlay('menuOverlay');
    }
    
    showOverlay(id) {
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }
    
    hideAllOverlays() {
        const overlays = ['menuOverlay', 'pauseOverlay', 'gameOverOverlay'];
        overlays.forEach(id => {
            const overlay = document.getElementById(id);
            if (overlay) {
                overlay.style.display = 'none';
            }
        });
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
        
        // Arrêter complètement la musique et tous les sons
        this.stopMusic();
        
        const winnerText = winner === 1 ? this.player1.name : this.player2.name;
        const winnerEl = document.getElementById('winnerText');
        const scoreEl = document.getElementById('finalScoreText');
        
        if (winnerEl) winnerEl.textContent = winnerText + ' GAGNE!';
        if (scoreEl) scoreEl.textContent = 'Score final: ' + this.score.player1 + ' - ' + this.score.player2;
        
        this.showOverlay('gameOverOverlay');
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePaddles();
        this.updateBall();
        this.updateParticles();
        this.checkCollisions();
        this.updateScoreDisplay();
    }
    
    updatePaddles() {
        // Joueur 1
        if (this.keys['w'] || this.keys['arrowup']) {
            this.player1.dy = -this.PADDLE_SPEED;
        } else if (this.keys['s'] || this.keys['arrowdown']) {
            this.player1.dy = this.PADDLE_SPEED;
        } else {
            this.player1.dy *= 0.8;
        }
        
        // Joueur 2 / IA
        if (this.gameMode === 'human') {
            if (this.keys['o']) {
                this.player2.dy = -this.PADDLE_SPEED;
            } else if (this.keys['l']) {
                this.player2.dy = this.PADDLE_SPEED;
            } else {
                this.player2.dy *= 0.8;
            }
        } else {
            // IA simple
            const ballCenter = this.ball.y;
            const paddleCenter = this.player2.y + this.PADDLE_HEIGHT / 2;
            const diff = ballCenter - paddleCenter;
            this.player2.dy = diff * this.player2.aiDifficulty;
            this.player2.dy = Math.max(-this.PADDLE_SPEED * 0.8, Math.min(this.PADDLE_SPEED * 0.8, this.player2.dy));
        }
        
        // Appliquer mouvement et limites
        this.player1.y += this.player1.dy;
        this.player2.y += this.player2.dy;
        
        this.player1.y = Math.max(0, Math.min(this.canvas.height - this.PADDLE_HEIGHT, this.player1.y));
        this.player2.y = Math.max(0, Math.min(this.canvas.height - this.PADDLE_HEIGHT, this.player2.y));
    }
    
    updateBall() {
        // Trail
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ball.trail.length > 8) {
            this.ball.trail.shift();
        }
        
        // Mouvement
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Rebonds verticaux
        if (this.ball.y <= this.BALL_SIZE/2 || this.ball.y >= this.canvas.height - this.BALL_SIZE/2) {
            this.ball.dy = -this.ball.dy;
        }
        
        // Score
        if (this.ball.x < 0) {
            this.score.player2++;
            if (this.score.player2 >= this.winningScore) {
                this.gameOver(2);
            } else {
                this.resetBall();
            }
        } else if (this.ball.x > this.canvas.width) {
            this.score.player1++;
            if (this.score.player1 >= this.winningScore) {
                this.gameOver(1);
            } else {
                this.resetBall();
            }
        }
    }
    
    checkCollisions() {
        // Collision paddle 1
        if (this.ball.dx < 0 && 
            this.ball.x - this.BALL_SIZE/2 <= this.player1.x + this.PADDLE_WIDTH &&
            this.ball.x + this.BALL_SIZE/2 >= this.player1.x &&
            this.ball.y >= this.player1.y && 
            this.ball.y <= this.player1.y + this.PADDLE_HEIGHT) {
            
            this.ball.dx = -this.ball.dx;
            this.ball.x = this.player1.x + this.PADDLE_WIDTH + this.BALL_SIZE/2;
            
            const hitPos = (this.ball.y - this.player1.y) / this.PADDLE_HEIGHT - 0.5;
            this.ball.dy += hitPos * 3;
            
            this.sounds.paddleHit();
        }
        
        // Collision paddle 2
        if (this.ball.dx > 0 && 
            this.ball.x + this.BALL_SIZE/2 >= this.player2.x &&
            this.ball.x - this.BALL_SIZE/2 <= this.player2.x + this.PADDLE_WIDTH &&
            this.ball.y >= this.player2.y && 
            this.ball.y <= this.player2.y + this.PADDLE_HEIGHT) {
            
            this.ball.dx = -this.ball.dx;
            this.ball.x = this.player2.x - this.BALL_SIZE/2;
            
            const hitPos = (this.ball.y - this.player2.y) / this.PADDLE_HEIGHT - 0.5;
            this.ball.dy += hitPos * 3;
            
            this.sounds.paddleHit();
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
    
    updateScoreDisplay() {
        const p1Name = document.getElementById('player1Name');
        const p2Name = document.getElementById('player2Name');
        const p1Score = document.getElementById('player1Score');
        const p2Score = document.getElementById('player2Score');
        
        if (p1Name) p1Name.textContent = this.player1.name;
        if (p2Name) p2Name.textContent = this.player2.name;
        if (p1Score) p1Score.textContent = this.score.player1;
        if (p2Score) p2Score.textContent = this.score.player2;
    }
    
    render() {
        // Fond
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#050505');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.renderBackground();
            this.renderPaddles();
            this.renderBall();
            
            if (this.gameState === 'paused') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }
    
    renderBackground() {
        // Ligne centrale
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    renderPaddles() {
        // Paddle 1
        this.ctx.fillStyle = '#00ffff';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(this.player1.x, this.player1.y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
        
        // Paddle 2
        this.ctx.fillStyle = '#ff007f';
        this.ctx.shadowColor = '#ff007f';
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(this.player2.x, this.player2.y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
        
        this.ctx.shadowBlur = 0;
    }
    
    renderBall() {
        // Trail
        for (let i = 0; i < this.ball.trail.length; i++) {
            const trail = this.ball.trail[i];
            const alpha = (i / this.ball.trail.length) * 0.5;
            
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#39ff14';
            this.ctx.fillRect(trail.x - this.BALL_SIZE/2, trail.y - this.BALL_SIZE/2, this.BALL_SIZE, this.BALL_SIZE);
        }
        
        this.ctx.globalAlpha = 1;
        
        // Balle
        this.ctx.fillStyle = '#39ff14';
        this.ctx.shadowColor = '#39ff14';
        this.ctx.shadowBlur = 20;
        this.ctx.fillRect(this.ball.x - this.BALL_SIZE/2, this.ball.y - this.BALL_SIZE/2, this.BALL_SIZE, this.BALL_SIZE);
        
        this.ctx.shadowBlur = 0;
    }
    
    gameLoop(timestamp) {
        // Limiter à 60 FPS pour une vitesse de jeu constante
        if (!this._targetFPS) {
            this._targetFPS = 60;
            this._frameDuration = 1000 / this._targetFPS;
        }

        if (timestamp === undefined) {
            return requestAnimationFrame((ts) => this.gameLoop(ts));
        }

        if (this._lastFrameTime === undefined) {
            this._lastFrameTime = timestamp;
        }

        const delta = timestamp - this._lastFrameTime;
        if (delta >= this._frameDuration) {
            this._lastFrameTime = timestamp - (delta % this._frameDuration);
            this.update();
            this.render();
        }

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    // Système Audio
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
        
        // Sons du jeu
        this.sounds.paddleHit = () => this.playTone(220, 0.1, 0.1);
        this.sounds.wallHit = () => this.playTone(180, 0.15, 0.08);
        this.sounds.goal = () => {
            this.playTone(150, 0.3, 0.1);
            setTimeout(() => this.playTone(120, 0.4, 0.2), 150);
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
        
        console.log(`🏓 Musique Pong: ${selectedTrack.name} (${selectedTrack.tempo} BPM - ${selectedTrack.style})`);
        
        this.music.currentTrack = this.createBackgroundMusic(selectedTrack);
        this.music.isPlaying = true;
    }
    
    stopMusic() {
        if (this.music.currentTrack) {
            try {
                if (this.music.currentTrack.oscillator1) {
                    this.music.currentTrack.oscillator1.stop();
                }
                if (this.music.currentTrack.oscillator2) {
                    this.music.currentTrack.oscillator2.stop();
                }
                if (this.music.currentTrack.gainNode) {
                    this.music.currentTrack.gainNode.disconnect();
                }
            } catch (e) {
                // Ignore errors
            }
            this.music.currentTrack = null;
        }
        this.music.isPlaying = false;
    }
    
    createBackgroundMusic(trackInfo = null) {
        if (!this.audioContext) return null;
        
        // Utiliser une piste par défaut si aucune n'est fournie
        if (!trackInfo) {
            trackInfo = this.musicTracks[0];
        }
        
        try {
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            filter.type = 'lowpass';
            
            // Configuration selon le style de la piste
            if (trackInfo.style === 'classic' || trackInfo.style === 'ambient') {
                oscillator1.type = 'sine';
                oscillator2.type = 'triangle';
                filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
            } else if (trackInfo.style === 'intense' || trackInfo.style === 'energetic') {
                oscillator1.type = 'sawtooth';
                oscillator2.type = 'square';
                filter.frequency.setValueAtTime(1200, this.audioContext.currentTime);
            } else {
                oscillator1.type = 'square';
                oscillator2.type = 'sawtooth';
                filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            }
            
            gainNode.gain.setValueAtTime(this.music.volume * 0.4, this.audioContext.currentTime);
            
            oscillator1.connect(filter);
            oscillator2.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Fréquences basées sur la piste sélectionnée
            const baseFreq = trackInfo.baseFreq;
            
            // Musique adaptée au style de la piste
            let currentTime = this.audioContext.currentTime;
            const noteDuration = 0.8;
            
            const notes = [1.0, 1.5, 1.0, 1.33, 1.0, 1.25, 1.5, 1.0];
            
            notes.forEach((multiplier, index) => {
                const freq = baseFreq * multiplier;
                const time = currentTime + (index * noteDuration);
                
                oscillator1.frequency.setValueAtTime(freq, time);
                oscillator2.frequency.setValueAtTime(freq * 0.5, time);
            });
            
            oscillator1.start();
            oscillator2.start();
            
            const loopDuration = notes.length * noteDuration * 1000;
            
            setTimeout(() => {
                try {
                    oscillator1.stop();
                    oscillator2.stop();
                } catch (e) {}
            }, loopDuration);
            
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
    
    toggleMusic() {
        this.music.enabled = !this.music.enabled;
        localStorage.setItem('pongMusicEnabled', this.music.enabled.toString());
        
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
}

// Fonctions globales pour l'interface
function startGame(mode) {
    console.log('Global startGame called with mode:', mode);
    if (window.game) {
        window.game.startGame(mode);
    } else {
        console.error('Game not initialized!');
    }
}

function resumeGame() {
    console.log('Global resumeGame called');
    if (window.game) {
        window.game.resumeGame();
    }
}

function restartGame() {
    console.log('Global restartGame called');
    if (window.game) {
        window.game.restartGame();
    }
}

function showMenu() {
    console.log('Global showMenu called');
    if (window.game) {
        window.game.showMenu();
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating Pong game...');
    try {
        window.game = new PongGame();
        console.log('Pong game created successfully:', !!window.game);
    } catch (error) {
        console.error('Error creating Pong game:', error);
    }
});

console.log('Pong script loaded successfully');
