/**
 * SUPER HEXAGON CYBERPUNK - JEU DE RÉFLEXES EXTRÊME
 * Fidèle au gameplay original de Terry Cavanagh avec style cyberpunk
 */

class SuperHexagon {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration du jeu
        this.CENTER_X = this.canvas.width / 2;
        this.CENTER_Y = this.canvas.height / 2;
        this.HEX_RADIUS = 60; // Hexagone central
        this.PLAYER_SIZE = 8;
        
        // État du jeu
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.difficulty = 'easy';
        this.time = 0;
        this.patternIndex = 0;
        
        // Records par difficulté
        this.bestTimes = {
            easy: parseFloat(localStorage.getItem('hexagonBestEasy') || '0'),
            normal: parseFloat(localStorage.getItem('hexagonBestNormal') || '0'),
            hard: parseFloat(localStorage.getItem('hexagonBestHard') || '0'),
            insane: parseFloat(localStorage.getItem('hexagonBestInsane') || '0')
        };
        
        // Joueur (triangle qui tourne autour du centre)
        this.player = {
            angle: 0,
            targetAngle: 0,
            position: 0, // Position discrète (0-5) pour la détection de collision
            radius: this.HEX_RADIUS + 1, // Rapproché du centre (était +35)
            size: this.PLAYER_SIZE,
            smoothing: 0.15, // Facteur de lissage pour l'interpolation
            rotationSpeed: 0.08 // Vitesse de rotation fluide
        };
        
        // Murs/patterns
        this.walls = [];
        this.wallSpeed = 2;
        this.spawnTimer = 0;
        this.spawnRate = 60;
        
        // Rotation du monde (caractéristique clé de Super Hexagon)
        this.worldRotation = 0;
        this.worldRotationSpeed = 0.01;
        
        // Contrôles
        this.keys = {};
        this.leftPressed = false;
        this.rightPressed = false;
        
        // Effets visuels
        this.particles = [];
        this.pulseIntensity = 0;
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        this.backgroundLines = [];
        
        // Système audio moderne avec fichier MP3
        this.audioContext = null;
        this.musicEnabled = localStorage.getItem('hexagonMusicEnabled') !== 'false'; // Par défaut activé
        this.currentAudio = null;
        this.musicVolume = 0.5;
        this.musicBuffer = null;
        this.musicSource = null;
        
        // Fichier musical principal
        this.musicFile = '../../assets/music/superhexagon.mp3';
        
        // Multiplicateurs de vitesse selon la difficulté
        this.difficultySpeedMultipliers = {
            easy: 1.0,      // Vitesse normale
            normal: 1.15,   // 15% plus rapide
            hard: 1.35,     // 35% plus rapide  
            insane: 1.6     // 60% plus rapide (très intense)
        };
        
        // Paramètres de difficulté (comme l'original)
        this.difficultySettings = {
            easy: { 
                wallSpeed: 1.8, 
                spawnRate: 70, 
                rotationSpeed: 0.008,
                name: 'HEXAGON',
                colors: ['#00ffff', '#ff4444'] 
            },
            normal: { 
                wallSpeed: 2.2, 
                spawnRate: 60, 
                rotationSpeed: 0.01,
                name: 'HEXAGONER',
                colors: ['#00ffff', '#ff4444', '#ffff00'] 
            },
            hard: { 
                wallSpeed: 2.8, 
                spawnRate: 50, 
                rotationSpeed: 0.012,
                name: 'HEXAGONEST',
                colors: ['#00ffff', '#ff4444', '#ffff00', '#ff00ff'] 
            },
            insane: { 
                wallSpeed: 3.5, 
                spawnRate: 40, 
                rotationSpeed: 0.015,
                name: 'HYPER HEXAGONEST',
                colors: ['#00ffff', '#ff4444', '#ffff00', '#ff00ff', '#00ff00'] 
            }
        };
        
        // Patterns de murs (inspirés du vrai Super Hexagon)
        this.wallPatterns = [
            // Patterns simples
            [1, 1, 1, 1, 0, 1], // Une ouverture
            [1, 1, 0, 1, 1, 1], // Une ouverture
            [0, 1, 1, 1, 1, 1], // Une ouverture
            [1, 0, 1, 1, 1, 1], // Une ouverture
            
            // Patterns moyens
            [1, 1, 0, 0, 1, 1], // Deux ouvertures consécutives
            [0, 1, 1, 0, 1, 1], // Deux ouvertures séparées
            [1, 0, 1, 0, 1, 1], // Motif alternant
            [0, 0, 1, 1, 1, 1], // Deux ouvertures consécutives
            
            // Patterns difficiles
            [1, 0, 1, 0, 1, 0], // Alterné parfait
            [0, 1, 0, 1, 1, 1], // Complexe
            [1, 1, 0, 1, 0, 1], // Complexe
            [0, 0, 0, 1, 1, 1], // Trois ouvertures
        ];
        
        this.initializeGame();
    }
    
    async initializeGame() {
        this.setupEventListeners();
        this.resizeCanvas();
        this.updateBestTimeDisplay();
        this.updateMusicButton();
        this.generateBackgroundLines();
        await this.initializeAudio(); // Attendre le chargement de la musique
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
        this.player.radius = this.HEX_RADIUS + 25; // Maintenir la distance rapprochée
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Contrôles du jeu
            if (this.gameState === 'playing') {
                // Mouvement fluide du joueur
                if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') {
                    this.leftPressed = true;
                    e.preventDefault();
                }
                
                if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') {
                    this.rightPressed = true;
                    e.preventDefault();
                }
                
                // Redémarrer
                if (e.key.toLowerCase() === 'r') {
                    this.restartGame();
                    e.preventDefault();
                }
                
                // Toggle musique
                if (e.key.toLowerCase() === 'm') {
                    this.toggleMusic();
                    e.preventDefault();
                }
            }
            
            // Pause
            if (e.key === ' ' || e.key === 'Escape') {
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
            
            // Arrêter le mouvement fluide
            if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') {
                this.leftPressed = false;
            }
            if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') {
                this.rightPressed = false;
            }
        });
    }
    
    movePlayer(direction) {
        // Cette méthode n'est plus utilisée pour le mouvement fluide
        // mais on la garde pour compatibilité si nécessaire
        this.player.position = (this.player.position + direction + 6) % 6;
        this.player.targetAngle = this.player.position * (Math.PI / 3);
        
        // Effet visuel lors du mouvement
        this.createMoveEffect();
    }
    
    selectDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        // Mettre à jour l'interface
        document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
        const targetBtn = document.querySelector(`[data-difficulty="${difficulty}"]`);
        if (targetBtn) targetBtn.classList.add('active');
        
        // Mettre à jour la vitesse de la musique si elle est en cours
        if (this.audioElement && !this.audioElement.paused) {
            const tempoMultiplier = this.difficultySpeedMultipliers[this.difficulty] || 1.0;
            this.audioElement.playbackRate = tempoMultiplier;
            console.log(`🎵 Vitesse de musique mise à jour: x${tempoMultiplier} (difficulté: ${this.difficulty})`);
        }
        
        this.updateBestTimeDisplay();
    }
    
    startGame() {
        this.gameState = 'playing';
        this.time = 0;
        this.patternIndex = 0;
        this.walls = [];
        this.particles = [];
        this.spawnTimer = 0;
        this.worldRotation = 0;
        this.pulseIntensity = 0;
        
        // Appliquer les paramètres de difficulté
        const settings = this.difficultySettings[this.difficulty];
        this.wallSpeed = settings.wallSpeed;
        this.spawnRate = settings.spawnRate;
        this.worldRotationSpeed = settings.rotationSpeed;
        
        // Reset player
        this.player.angle = 0;
        this.player.targetAngle = 0;
        this.player.position = 0;
        
        // Reset des contrôles
        this.leftPressed = false;
        this.rightPressed = false;
        
        // Démarrer la musique
        if (this.musicEnabled) {
            // Reprendre le contexte audio si nécessaire
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.startMusic();
        }
        
        this.hideAllOverlays();
        this.updateDisplay();
        
        // Démarrer la musique
        this.startMusic();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        this.stopMusic();
        document.getElementById('pauseOverlay').style.display = 'flex';
    }
    
    resumeGame() {
        this.gameState = 'playing';
        this.hideAllOverlays();
        
        // Reprendre la musique
        if (this.musicEnabled) {
            this.startMusic();
        }
    }
    
    restartGame() {
        this.startGame();
    }
    
    goToMenu() {
        this.gameState = 'menu';
        this.hideAllOverlays();
        this.stopMusic();
        document.getElementById('menuOverlay').style.display = 'flex';
    }
    
    showMenu() {
        this.gameState = 'menu';
        this.hideAllOverlays();
        document.getElementById('menuOverlay').style.display = 'flex';
    }
    
    hideAllOverlays() {
        const overlays = ['menuOverlay', 'pauseOverlay', 'gameOverOverlay'];
        overlays.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Arrêter complètement la musique et tous les sons
        this.stopMusic();
        
        // Vérifier nouveau record
        let isNewRecord = false;
        const currentBest = this.bestTimes[this.difficulty];
        if (this.time > currentBest) {
            this.bestTimes[this.difficulty] = this.time;
            localStorage.setItem(`hexagonBest${this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1)}`, this.time.toString());
            isNewRecord = true;
        }
        
        const finalTimeEl = document.getElementById('finalTime');
        const newRecordEl = document.getElementById('newRecordDisplay');
        
        if (finalTimeEl) finalTimeEl.textContent = this.time.toFixed(2) + 's';
        if (newRecordEl) {
            newRecordEl.style.display = isNewRecord ? 'block' : 'none';
        }
        
        document.getElementById('gameOverOverlay').style.display = 'flex';
        
        this.createDeathEffect();
        this.shakeScreen(30);
        this.updateBestTimeDisplay();
    }

    async initializeAudio() {
        try {
            // Charger le fichier MP3 directement via l'élément HTML audio
            if (this.musicEnabled) {
                await this.loadMusicFile();
            }
        } catch (error) {
            console.log('Erreur lors de l\'initialisation audio:', error);
            this.musicEnabled = false;
        }
    }
    
    async loadMusicFile() {
        try {
            console.log('🎵 Chargement de la musique Super Hexagon...');
            
            // Utiliser seulement l'élément audio HTML pour éviter les problèmes CORS en local
            this.audioElement = new Audio(this.musicFile);
            this.audioElement.loop = true;
            this.audioElement.volume = this.musicVolume;
            this.audioElement.preload = 'auto';
            
            // Attendre que l'audio soit prêt
            return new Promise((resolve, reject) => {
                this.audioElement.addEventListener('canplaythrough', () => {
                    console.log('✅ Musique chargée avec succès!');
                    resolve();
                });
                
                this.audioElement.addEventListener('error', (e) => {
                    console.error('❌ Erreur lors du chargement de la musique:', e);
                    this.musicEnabled = false;
                    reject(e);
                });
                
                // Déclencher le chargement
                this.audioElement.load();
            });
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement de la musique:', error);
            this.musicEnabled = false;
        }
    }
    
    startMusic() {
        if (!this.musicEnabled || !this.audioElement) return;
        
        try {
            // Appliquer le multiplicateur de vitesse selon la difficulté
            const tempoMultiplier = this.difficultySpeedMultipliers[this.difficulty] || 1.0;
            this.audioElement.playbackRate = tempoMultiplier;
            this.audioElement.volume = this.musicVolume;
            
            console.log(`🎵 Lancement de la musique Super Hexagon (vitesse: x${tempoMultiplier} - difficulté: ${this.difficulty})`);
            
            // Démarrer la lecture
            const playPromise = this.audioElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Note: Interaction utilisateur requise pour jouer l\'audio');
                });
            }
            
        } catch (error) {
            console.error('❌ Erreur lors du démarrage de la musique:', error);
        }
        
        // Mettre à jour l'interface
        this.updateMusicButton();
    }
    
    stopMusic() {
        if (this.audioElement) {
            try {
                this.audioElement.pause();
                this.audioElement.currentTime = 0;
            } catch (error) {
                console.error('❌ Erreur lors de l\'arrêt de la musique:', error);
            }
        }
        
        // Mettre à jour l'interface
        this.updateMusicButton();
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('hexagonMusicEnabled', this.musicEnabled.toString());
        
        if (this.musicEnabled && this.gameState === 'playing') {
            this.startMusic();
        } else {
            this.stopMusic();
        }
        
        this.updateMusicButton();
    }
    
    updateMusicButton() {
        const musicBtn = document.getElementById('musicToggle');
        const musicIcon = document.getElementById('musicIcon');
        if (musicBtn && musicIcon) {
            const isPlaying = this.audioElement && !this.audioElement.paused;
            
            // Icône selon l'état (activé/désactivé ET en cours de lecture)
            if (this.musicEnabled && isPlaying) {
                musicIcon.className = 'bi bi-volume-up-fill';
                musicBtn.title = 'Musique en cours - Cliquer pour désactiver';
                musicBtn.style.color = '#00ff88'; // Vert pour indication qu'elle joue
            } else if (this.musicEnabled) {
                musicIcon.className = 'bi bi-volume-down-fill';
                musicBtn.title = 'Musique activée mais en pause - Cliquer pour désactiver';
                musicBtn.style.color = '#ffaa00'; // Orange pour activée mais pas en cours
            } else {
                musicIcon.className = 'bi bi-volume-mute-fill';
                musicBtn.title = 'Musique désactivée - Cliquer pour activer';
                musicBtn.style.color = '#666'; // Gris pour désactivée
            }
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.time += 1/60; // 60 FPS
        
        // Mouvement fluide du joueur
        this.updatePlayerMovement();
        
        this.updateWalls();
        this.updateParticles();
        this.updateEffects();
        this.checkCollisions();
        this.spawnWalls();
        this.updateDisplay();
    }
    
    updateWalls() {
        // Faire avancer tous les murs vers le centre
        for (let i = this.walls.length - 1; i >= 0; i--) {
            const wall = this.walls[i];
            wall.distance -= this.wallSpeed;
            
            // Supprimer si trop près du centre
            if (wall.distance < this.HEX_RADIUS - 5) {
                this.walls.splice(i, 1);
            }
        }
    }
    
    spawnWalls() {
        this.spawnTimer++;
        
        if (this.spawnTimer >= this.spawnRate) {
            this.spawnTimer = 0;
            this.spawnWallPattern();
        }
    }
    
    spawnWallPattern() {
        // Sélectionner un pattern de murs
        let pattern;
        
        // Patterns progressifs selon le temps
        if (this.time < 5) {
            // Patterns faciles au début
            pattern = this.wallPatterns.slice(0, 4)[Math.floor(Math.random() * 4)];
        } else if (this.time < 15) {
            // Patterns moyens
            pattern = this.wallPatterns.slice(0, 8)[Math.floor(Math.random() * 8)];
        } else {
            // Tous les patterns
            pattern = this.wallPatterns[Math.floor(Math.random() * this.wallPatterns.length)];
        }
        
        const colors = this.difficultySettings[this.difficulty].colors;
        const baseDistance = Math.max(this.canvas.width, this.canvas.height) * 0.7;
        
        // Créer les murs selon le pattern
        for (let segment = 0; segment < 6; segment++) {
            if (pattern[segment] === 1) { // 1 = mur, 0 = ouverture
                this.walls.push({
                    segment: segment,
                    distance: baseDistance,
                    width: 25,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    opacity: 1
                });
            }
        }
        
        this.patternIndex++;
    }
    
    checkCollisions() {
        // Calculer le segment basé sur l'angle exact du joueur
        const normalizedAngle = (this.player.angle + Math.PI / 6) % (Math.PI * 2);
        const currentSegment = Math.floor(normalizedAngle / (Math.PI / 3));
        
        for (const wall of this.walls) {
            // Vérifier si le joueur est dans le même segment qu'un mur
            if (wall.segment === currentSegment) {
                // Calculer la distance entre le joueur et le mur
                const playerDistance = this.player.radius;
                const wallOuterEdge = wall.distance;
                const wallInnerEdge = wall.distance - wall.width;
                
                // Collision uniquement si le joueur entre dans l'épaisseur du mur
                if (playerDistance >= wallInnerEdge && playerDistance <= wallOuterEdge + this.player.size) {
                    console.log('Collision detected!', {
                        currentSegment,
                        wallSegment: wall.segment,
                        playerDistance,
                        wallInnerEdge,
                        wallOuterEdge
                    });
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
            particle.opacity = particle.life / particle.maxLife;
            
            if (particle.life <= 0 || particle.size < 0.5) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateEffects() {
        // Rotation du monde (caractéristique principale de Super Hexagon)
        this.worldRotation += this.worldRotationSpeed;
        
        // Effet de pulsation basé sur le rythme
        this.pulseIntensity = Math.sin(this.time * 8) * 0.1 + Math.sin(this.time * 3) * 0.05;
        
        // Screen shake
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.intensity *= 0.92;
        }
        
        // Augmenter légèrement la difficulté avec le temps
        if (this.time > 0) {
            const timeBonus = Math.min(this.time * 0.01, 1);
            this.wallSpeed = this.difficultySettings[this.difficulty].wallSpeed + timeBonus;
            this.worldRotationSpeed = this.difficultySettings[this.difficulty].rotationSpeed + timeBonus * 0.002;
        }
    }
    
    updateDisplay() {
        const timeEl = document.getElementById('timeDisplay');
        const bestEl = document.getElementById('bestTimeDisplay');
        const diffEl = document.getElementById('difficultyDisplay');
        
        if (timeEl) timeEl.textContent = this.time.toFixed(2) + 's';
        if (bestEl) bestEl.textContent = this.bestTimes[this.difficulty].toFixed(2) + 's';
        if (diffEl) diffEl.textContent = this.difficultySettings[this.difficulty].name;
    }
    
    updateBestTimeDisplay() {
        // Mettre à jour les records dans le menu
        const records = ['Easy', 'Normal', 'Hard', 'Insane'];
        records.forEach(diff => {
            const el = document.getElementById(`record${diff}`);
            if (el) {
                el.textContent = this.bestTimes[diff.toLowerCase()].toFixed(2) + 's';
            }
        });
    }
    
    // Effets visuels
    createDeathEffect() {
        const playerX = this.CENTER_X + Math.cos(this.player.angle + this.worldRotation) * this.player.radius;
        const playerY = this.CENTER_Y + Math.sin(this.player.angle + this.worldRotation) * this.player.radius;
        
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: playerX,
                y: playerY,
                dx: (Math.random() - 0.5) * 20,
                dy: (Math.random() - 0.5) * 20,
                life: 80,
                maxLife: 80,
                size: Math.random() * 8 + 3,
                color: '#ffffff',
                opacity: 1
            });
        }
    }
    
    createMoveEffect() {
        const playerX = this.CENTER_X + Math.cos(this.player.angle + this.worldRotation) * this.player.radius;
        const playerY = this.CENTER_Y + Math.sin(this.player.angle + this.worldRotation) * this.player.radius;
        
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: playerX + (Math.random() - 0.5) * 10,
                y: playerY + (Math.random() - 0.5) * 10,
                dx: (Math.random() - 0.5) * 8,
                dy: (Math.random() - 0.5) * 8,
                life: 25,
                maxLife: 25,
                size: Math.random() * 3 + 1,
                color: '#00ffff',
                opacity: 1
            });
        }
    }
    
    shakeScreen(intensity) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    }
    
    generateBackgroundLines() {
        this.backgroundLines = [];
        for (let i = 0; i < 20; i++) {
            this.backgroundLines.push({
                angle: Math.random() * Math.PI * 2,
                distance: Math.random() * this.canvas.width,
                length: Math.random() * 100 + 50,
                speed: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.3 + 0.1
            });
        }
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
    

    
    selectDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        // Mettre à jour l'interface
        document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
        const targetBtn = document.querySelector(`[data-difficulty="${difficulty}"]`);
        if (targetBtn) targetBtn.classList.add('active');
        
        this.updateBestTimeDisplay();
    }
    
    updatePlayerMovement() {
        // Mouvement fluide basé sur les touches pressées
        if (this.leftPressed && !this.rightPressed) {
            this.player.angle -= this.player.rotationSpeed;
        } else if (this.rightPressed && !this.leftPressed) {
            this.player.angle += this.player.rotationSpeed;
        }
        
        // Maintenir l'angle dans la plage [0, 2π]
        if (this.player.angle < 0) {
            this.player.angle += Math.PI * 2;
        } else if (this.player.angle >= Math.PI * 2) {
            this.player.angle -= Math.PI * 2;
        }
        
        // Mettre à jour la position discrète pour la détection de collision
        this.player.position = Math.round(this.player.angle / (Math.PI / 3)) % 6;
        if (this.player.position < 0) this.player.position += 6;
    }
    
render() {
        // Fond avec gradient cyberpunk
        const gradient = this.ctx.createRadialGradient(
            this.CENTER_X, this.CENTER_Y, 0,
            this.CENTER_X, this.CENTER_Y, this.canvas.width
        );
        gradient.addColorStop(0, '#0a0a0f');
        gradient.addColorStop(0.7, '#000033');
        gradient.addColorStop(1, '#000000');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Appliquer screen shake
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        
        // Rotation du monde entier
        this.ctx.save();
        this.ctx.translate(this.CENTER_X, this.CENTER_Y);
        this.ctx.rotate(this.worldRotation);
        this.ctx.translate(-this.CENTER_X, -this.CENTER_Y);
        
        // Fond rotatif
        this.renderRotatingBackground();
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.renderHexagon();
            this.renderWalls();
            this.renderPlayer();
            this.renderParticles();
            
            if (this.gameState === 'paused') {
                this.renderPauseOverlay();
            }
        }
        
        this.ctx.restore(); // Fin rotation du monde
        this.ctx.restore(); // Fin screen shake
    }
    
    renderRotatingBackground() {
        this.ctx.save();
        this.ctx.translate(this.CENTER_X, this.CENTER_Y);
        this.ctx.rotate(this.backgroundRotation);
        
        // Lignes radiantes cyberpunk
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 36; i++) {
            const angle = (i / 36) * Math.PI * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(Math.cos(angle) * this.canvas.width, Math.sin(angle) * this.canvas.width);
            this.ctx.stroke();
        }
        
        // Cercles concentriques
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.03)';
        for (let r = 100; r < this.canvas.width; r += 50) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, r, 0, Math.PI * 2);
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
        
        // Ombre de l'hexagone
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.lineWidth = 8;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 25;
        
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
        
        // Hexagone principal
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 4;
        this.ctx.shadowBlur = 15;
        this.ctx.stroke();
        
        // Lignes de séparation des segments
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.shadowBlur = 0;
        
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    renderWalls() {
        for (const wall of this.walls) {
            this.ctx.save();
            this.ctx.translate(this.CENTER_X, this.CENTER_Y);
            
            // Calculer les angles pour ce segment
            const startAngle = wall.segment * (Math.PI / 3) - Math.PI / 6;
            const endAngle = startAngle + Math.PI / 3;
            
            // Effet de lueur
            this.ctx.fillStyle = wall.color;
            this.ctx.shadowColor = wall.color;
            this.ctx.shadowBlur = 20;
            
            // Dessiner le mur comme un segment d'anneau
            this.ctx.beginPath();
            this.ctx.arc(0, 0, wall.distance, startAngle, endAngle);
            this.ctx.arc(0, 0, wall.distance - wall.width, endAngle, startAngle, true);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Bordures du mur
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 0;
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
    
    renderPlayer() {
        // Position du joueur
        const x = this.CENTER_X + Math.cos(this.player.angle) * this.player.radius;
        const y = this.CENTER_Y + Math.sin(this.player.angle) * this.player.radius;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(this.player.angle + Math.PI / 2); // Pointer vers l'avant
        
        // Ombre du joueur
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 20;
        
        // Triangle du joueur
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.PLAYER_SIZE);
        this.ctx.lineTo(-this.PLAYER_SIZE * 0.7, this.PLAYER_SIZE * 0.7);
        this.ctx.lineTo(this.PLAYER_SIZE * 0.7, this.PLAYER_SIZE * 0.7);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Bordure du triangle
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ffff00';
        this.ctx.stroke();
        
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
        
        // Texte "PAUSE"
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 48px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('PAUSE', this.CENTER_X, this.CENTER_Y);
        this.ctx.shadowBlur = 0;
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

function restart() {
    if (window.game) {
        window.game.restartGame();
    }
}

function showMenu() {
    if (window.game) {
        window.game.goToMenu();
    }
}

function goToMenu() {
    if (window.game) {
        window.game.goToMenu();
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SuperHexagon();
});
