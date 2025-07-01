// Snake Game - Complet et fonctionnel
class SnakeGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Configuration du jeu
        this.gridSize = 20;
        this.tileCountX = Math.floor(this.canvas.width / this.gridSize);
        this.tileCountY = Math.floor(this.canvas.height / this.gridSize);
        
        // État du jeu
        this.gameRunning = false;
        this.gameStarted = false;
        this.gamePaused = false;
        this.gameOver = false;
        
        // Score et statistiques
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.gameSpeed = 150;
        this.level = 1;
        
        // Serpent
        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        // Nourriture
        this.food = {};
        this.specialFood = null;
        this.specialFoodTimer = 0;
        
        // Contrôles
        this.keys = {};
        
        // Particules pour les effets
        this.particles = [];
        
        // Configuration des couleurs
        this.colors = {
            background: '#0a0a23',
            snake: '#4ECDC4',
            snakeHead: '#667eea',
            food: '#ff6b6b',
            specialFood: '#FFD700',
            gridLines: '#1e1e3a',
            text: '#FFFFFF',
            particle: '#FFFFFF'
        };
        
        this.setupEventListeners();
        this.initGame();
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
            
            // Contrôles du serpent
            if (this.gameRunning && !this.gamePaused) {
                switch(e.key) {
                    case 'ArrowUp':
                    case 'w':
                    case 'W':
                        if (this.direction.y !== 1) {
                            this.nextDirection = {x: 0, y: -1};
                        }
                        break;
                    case 'ArrowDown':
                    case 's':
                    case 'S':
                        if (this.direction.y !== -1) {
                            this.nextDirection = {x: 0, y: 1};
                        }
                        break;
                    case 'ArrowLeft':
                    case 'a':
                    case 'A':
                        if (this.direction.x !== 1) {
                            this.nextDirection = {x: -1, y: 0};
                        }
                        break;
                    case 'ArrowRight':
                    case 'd':
                    case 'D':
                        if (this.direction.x !== -1) {
                            this.nextDirection = {x: 1, y: 0};
                        }
                        break;
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
    
    initGame() {
        // Initialiser le serpent
        this.snake = [
            {x: 10, y: 10},
            {x: 9, y: 10},
            {x: 8, y: 10}
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        // Reset du score et de la vitesse
        this.score = 0;
        this.gameSpeed = 150;
        this.level = 1;
        
        // Générer la première nourriture
        this.generateFood();
        
        // Clear effects
        this.particles = [];
        this.specialFood = null;
        this.specialFoodTimer = 0;
        
        this.updateUI();
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
        this.gameOver = false;
        this.gameRunning = false;
        this.gameStarted = false;
        this.gamePaused = false;
        
        this.initGame();
    }
    
    generateFood() {
        let validPosition = false;
        let newFood;
        
        while (!validPosition) {
            newFood = {
                x: Math.floor(Math.random() * this.tileCountX),
                y: Math.floor(Math.random() * this.tileCountY)
            };
            
            // Vérifier que la position n'est pas sur le serpent
            validPosition = !this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
        }
        
        this.food = newFood;
        
        // Chance de générer une nourriture spéciale
        if (Math.random() < 0.1 && !this.specialFood) {
            this.generateSpecialFood();
        }
    }
    
    generateSpecialFood() {
        let validPosition = false;
        let newSpecialFood;
        
        while (!validPosition) {
            newSpecialFood = {
                x: Math.floor(Math.random() * this.tileCountX),
                y: Math.floor(Math.random() * this.tileCountY),
                type: Math.random() > 0.5 ? 'golden' : 'speed',
                timer: 300 // 5 secondes à 60 FPS
            };
            
            // Vérifier que la position n'est pas sur le serpent ou la nourriture normale
            validPosition = !this.snake.some(segment => segment.x === newSpecialFood.x && segment.y === newSpecialFood.y) &&
                           !(newSpecialFood.x === this.food.x && newSpecialFood.y === this.food.y);
        }
        
        this.specialFood = newSpecialFood;
        this.specialFoodTimer = 300;
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        // Mettre à jour la direction
        this.direction = { ...this.nextDirection };
        
        // Calculer la nouvelle position de la tête
        const head = {...this.snake[0]};
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Vérifier les collisions avec les bords
        if (head.x < 0 || head.x >= this.tileCountX || head.y < 0 || head.y >= this.tileCountY) {
            this.gameOver = true;
            this.gameRunning = false;
            this.createDeathParticles();
            this.showGameOver();
            return;
        }
        
        // Vérifier les collisions avec le serpent lui-même
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver = true;
                this.gameRunning = false;
                this.createDeathParticles();
                this.showGameOver();
                return;
            }
        }
        
        // Ajouter la nouvelle tête
        this.snake.unshift(head);
        
        // Vérifier si le serpent a mangé la nourriture normale
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.createFoodParticles(this.food.x * this.gridSize + this.gridSize/2, 
                                   this.food.y * this.gridSize + this.gridSize/2, 
                                   this.colors.food);
            this.generateFood();
            this.updateGameSpeed();
            this.updateUI();
        }
        // Vérifier si le serpent a mangé la nourriture spéciale
        else if (this.specialFood && head.x === this.specialFood.x && head.y === this.specialFood.y) {
            if (this.specialFood.type === 'golden') {
                this.score += 50;
                // Faire grandir le serpent de 2 segments
                this.snake.push({...this.snake[this.snake.length - 1]});
            } else if (this.specialFood.type === 'speed') {
                this.score += 25;
                this.gameSpeed = Math.max(50, this.gameSpeed - 20);
            }
            
            this.createFoodParticles(this.specialFood.x * this.gridSize + this.gridSize/2, 
                                   this.specialFood.y * this.gridSize + this.gridSize/2, 
                                   this.colors.specialFood);
            this.specialFood = null;
            this.specialFoodTimer = 0;
            this.updateUI();
        }
        else {
            // Retirer la queue si aucune nourriture n'a été mangée
            this.snake.pop();
        }
        
        // Mettre à jour la nourriture spéciale
        this.updateSpecialFood();
        
        // Mettre à jour les particules
        this.updateParticles();
    }
    
    updateGameSpeed() {
        // Augmenter la vitesse tous les 5 points
        if (this.score % 50 === 0 && this.gameSpeed > 50) {
            this.gameSpeed = Math.max(50, this.gameSpeed - 10);
            this.level++;
        }
    }
    
    updateSpecialFood() {
        if (this.specialFood) {
            this.specialFoodTimer--;
            if (this.specialFoodTimer <= 0) {
                this.specialFood = null;
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
    
    createFoodParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
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
    
    createDeathParticles() {
        const head = this.snake[0];
        const x = head.x * this.gridSize + this.gridSize/2;
        const y = head.y * this.gridSize + this.gridSize/2;
        
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 12,
                dy: (Math.random() - 0.5) * 12,
                life: 60,
                size: Math.random() * 6 + 3,
                color: this.colors.snakeHead
            });
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grille de fond
        this.drawGrid();
        
        // Nourriture
        this.drawFood();
        
        // Nourriture spéciale
        if (this.specialFood) {
            this.drawSpecialFood();
        }
        
        // Serpent
        this.drawSnake();
        
        // Particules
        this.drawParticles();
        
        // HUD
        this.drawHUD();
        
        // Messages
        if (!this.gameStarted) {
            this.drawStartMessage();
        } else if (this.gamePaused) {
            this.drawPauseMessage();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = this.colors.gridLines;
        this.ctx.lineWidth = 0.5;
        
        // Lignes horizontales
        for (let i = 0; i <= this.tileCountY; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
        
        // Lignes verticales
        for (let i = 0; i <= this.tileCountX; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        
        // Ombre
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x + this.gridSize/2 + 2, y + this.gridSize/2 + 2, this.gridSize/2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Nourriture avec gradient
        const gradient = this.ctx.createRadialGradient(
            x + this.gridSize/2 - 3, y + this.gridSize/2 - 3, 0,
            x + this.gridSize/2, y + this.gridSize/2, this.gridSize/2 - 2
        );
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, this.colors.food);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x + this.gridSize/2, y + this.gridSize/2, this.gridSize/2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bordure
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    drawSpecialFood() {
        const x = this.specialFood.x * this.gridSize;
        const y = this.specialFood.y * this.gridSize;
        
        // Effet de clignotement
        const alpha = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        
        // Ombre
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
        
        // Nourriture spéciale avec gradient
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        const gradient = this.ctx.createLinearGradient(x, y, x + this.gridSize, y + this.gridSize);
        gradient.addColorStop(0, this.colors.specialFood);
        gradient.addColorStop(0.5, '#FFFFFF');
        gradient.addColorStop(1, this.colors.specialFood);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
        
        // Bordure
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
        
        // Symbole
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        const symbol = this.specialFood.type === 'golden' ? '★' : '⚡';
        this.ctx.fillText(symbol, x + this.gridSize/2, y + this.gridSize/2 + 4);
        
        this.ctx.restore();
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            // Ombre
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(x + 2, y + 2, this.gridSize - 2, this.gridSize - 2);
            
            // Couleur du segment
            const isHead = index === 0;
            const gradient = this.ctx.createLinearGradient(x, y, x + this.gridSize, y + this.gridSize);
            
            if (isHead) {
                gradient.addColorStop(0, this.colors.snakeHead);
                gradient.addColorStop(1, '#4169E1');
            } else {
                gradient.addColorStop(0, this.colors.snake);
                gradient.addColorStop(1, '#2E8B57');
            }
            
            this.ctx.fillStyle = gradient;
            
            // Rectangle arrondi
            this.drawRoundedRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2, 4);
            
            // Bordure
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // Yeux pour la tête
            if (isHead) {
                this.drawSnakeEyes(x, y);
            }
        });
    }
    
    drawSnakeEyes(x, y) {
        const eyeSize = 3;
        let eyeX1, eyeX2, eyeY1, eyeY2;
        
        // Position des yeux selon la direction
        if (this.direction.x === 1) { // Droite
            eyeX1 = eyeX2 = x + this.gridSize - eyeSize * 2;
            eyeY1 = y + this.gridSize / 3;
            eyeY2 = y + this.gridSize * 2/3;
        } else if (this.direction.x === -1) { // Gauche
            eyeX1 = eyeX2 = x + eyeSize;
            eyeY1 = y + this.gridSize / 3;
            eyeY2 = y + this.gridSize * 2/3;
        } else if (this.direction.y === -1) { // Haut
            eyeX1 = x + this.gridSize / 3;
            eyeX2 = x + this.gridSize * 2/3;
            eyeY1 = eyeY2 = y + eyeSize;
        } else { // Bas
            eyeX1 = x + this.gridSize / 3;
            eyeX2 = x + this.gridSize * 2/3;
            eyeY1 = eyeY2 = y + this.gridSize - eyeSize * 2;
        }
        
        // Dessiner les yeux
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pupilles
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(eyeX1, eyeY1, eyeSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(eyeX2, eyeY2, eyeSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
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
    
    drawHUD() {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        
        // Score
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        
        // Meilleur score
        this.ctx.fillText(`Meilleur: ${this.highScore}`, 20, 55);
        
        // Niveau
        this.ctx.fillText(`Niveau: ${this.level}`, 200, 30);
        
        // Longueur du serpent
        this.ctx.fillText(`Longueur: ${this.snake.length}`, 200, 55);
        
        // Timer pour la nourriture spéciale
        if (this.specialFood) {
            this.ctx.fillStyle = this.colors.specialFood;
            this.ctx.fillText(`Bonus: ${Math.ceil(this.specialFoodTimer / 60)}s`, 350, 30);
        }
    }
    
    drawStartMessage() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SNAKE', this.canvas.width/2, this.canvas.height/2 - 60);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Cliquez ou appuyez sur ESPACE pour commencer', this.canvas.width/2, this.canvas.height/2 - 10);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Utilisez les flèches ou WASD pour diriger le serpent', this.canvas.width/2, this.canvas.height/2 + 20);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('★ Nourriture dorée = +50 points | ⚡ Vitesse = +25 points', this.canvas.width/2, this.canvas.height/2 + 50);
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
        document.getElementById('highScore').textContent = this.highScore;
    }
    
    showGameOver() {
        // Mettre à jour le meilleur score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHighScore').textContent = this.highScore;
        document.getElementById('gameMessage').style.display = 'block';
    }
    
    gameLoop() {
        if (!this.gamePaused) {
            this.update();
            this.render();
        }
        
        if (this.gameRunning || this.gamePaused) {
            setTimeout(() => {
                if (this.gameRunning || this.gamePaused) {
                    this.gameLoop();
                }
            }, this.gameSpeed);
        } else if (!this.gameOver) {
            this.render();
            setTimeout(() => {
                if (!this.gameOver) {
                    this.gameLoop();
                }
            }, this.gameSpeed);
        }
    }
}

// Initialisation
let snakeGame;

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('snakeCanvas');
    snakeGame = new SnakeGame(canvas);
    
    // Bouton restart
    document.getElementById('restartBtn').addEventListener('click', function() {
        document.getElementById('gameMessage').style.display = 'none';
        snakeGame.restart();
    });
    
    // Démarrer le rendu
    snakeGame.render();
});
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const gameMessage = document.getElementById('gameMessage');
const restartBtn = document.getElementById('restartBtn');

// Game settings
const gridSize = 20;
const tileCountX = Math.floor(canvas.width / gridSize);
const tileCountY = Math.floor(canvas.height / gridSize);

// Game variables
let snake, food, direction, score;
let gameSpeed = 150; // Milliseconds between updates
let gameRunning = false; // Commencer en pause
let gameStarted = false; // État pour savoir si le jeu a démarré
let gameLoop;

// Game colors
const colors = {
    background: '#0a0a23',
    snake: '#4ecdc4',
    snakeHead: '#667eea',
    food: '#ff6b6b',
    gridLines: '#1e1e3a'
};

// Audio system
let audio = {
    sounds: {}
};

// Précharger les sons pour Snake
function preloadAudio() {
    try {
        // Créer un contexte audio
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Sons à précharger
        const soundsToLoad = {
            'eatFood': 'https://bearable-hacker.io/snake-eat.mp3',
            'gameOver': 'https://bearable-hacker.io/snake-over.mp3'
        };
        
        // Charger chaque son
        Object.entries(soundsToLoad).forEach(([name, url]) => {
            fetch(url)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    audio.sounds[name] = {
                        buffer: audioBuffer,
                        context: audioContext
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
        if (!audio.sounds[soundName]) return;
        
        const sound = audio.sounds[soundName];
        const source = sound.context.createBufferSource();
        source.buffer = sound.buffer;
        source.connect(sound.context.destination);
        source.start(0);
    } catch (e) {
        console.log('Erreur de lecture audio:', e);
    }
}

// Initialiser le jeu
function initGame() {
    preloadAudio();
    
    snake = [
        {x: 10, y: 10},
        {x: 9, y: 10},
        {x: 8, y: 10}
    ];
    direction = { x: 1, y: 0 }; // Vers la droite par défaut
    score = 0;
    
    scoreElement.textContent = score;
    generateFood();
    
    // Ne pas démarrer automatiquement
    gameRunning = false;
    gameStarted = false;
    
    // Afficher le message de démarrage
    drawGame();
}

// Démarrer le jeu
function startGame() {
    if (!gameStarted && !gameRunning) {
        gameStarted = true;
        gameRunning = true;
        
        // Démarrer la boucle de jeu
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(update, gameSpeed);
    }
}

// Générer de la nourriture
function generateFood() {
    // Assurez-vous que la nourriture n'apparaît pas sur le serpent
    let validPosition = false;
    let newFood;
    
    while (!validPosition) {
        newFood = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
        
        // Vérifier que la position n'est pas sur le serpent
        validPosition = !snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }
    
    food = newFood;
}

// Mettre à jour l'état du jeu
function update() {
    if (!gameRunning) return;
    
    // Déplacer le serpent
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };
    
    // Vérifier les collisions avec les bords
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        gameOver();
        return;
    }
    
    // Vérifier les collisions avec le serpent lui-même
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    
    // Ajouter la nouvelle tête
    snake.unshift(head);
    
    // Vérifier si le serpent a mangé la nourriture
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        generateFood();
        playSound('eatFood');
        
        // Accélérer légèrement le jeu
        if (gameSpeed > 50) {
            clearInterval(gameLoop);
            gameSpeed = Math.max(50, gameSpeed - 2);
            gameLoop = setInterval(update, gameSpeed);
        }
    } else {
        // Enlever la queue si pas de nourriture mangée
        snake.pop();
    }
    
    // Dessiner la nouvelle frame
    draw();
}

// Dessiner le jeu
function draw() {
    // Effacer le canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner les lignes de la grille (optionnel)
    ctx.strokeStyle = colors.gridLines;
    ctx.lineWidth = 0.5;
    
    // Lignes horizontales
    for (let i = 0; i <= tileCountY; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // Lignes verticales
    for (let i = 0; i <= tileCountX; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
    }
    
    // Dessiner la nourriture
    ctx.fillStyle = colors.food;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Dessiner le serpent
    snake.forEach((segment, index) => {
        // La tête a une couleur différente
        ctx.fillStyle = index === 0 ? colors.snakeHead : colors.snake;
        
        // Rectangle arrondi pour le corps du serpent
        const cornerRadius = 4;
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const width = gridSize - 2;
        const height = gridSize - 2;
        
        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.lineTo(x + width - cornerRadius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
        ctx.lineTo(x + width, y + height - cornerRadius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
        ctx.lineTo(x + cornerRadius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
        ctx.lineTo(x, y + cornerRadius);
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        ctx.closePath();
        ctx.fill();
        
        // Ajouter des yeux à la tête
        if (index === 0) {
            // Position des yeux basée sur la direction
            const eyeSize = gridSize / 5;
            let eyeX1, eyeX2, eyeY1, eyeY2;
            
            // Déterminer la position des yeux en fonction de la direction
            if (direction.x === 1) { // Vers la droite
                eyeX1 = eyeX2 = x + width - eyeSize * 1.5;
                eyeY1 = y + height / 3;
                eyeY2 = y + height * 2/3;
            } else if (direction.x === -1) { // Vers la gauche
                eyeX1 = eyeX2 = x + eyeSize * 1.5;
                eyeY1 = y + height / 3;
                eyeY2 = y + height * 2/3;
            } else if (direction.y === -1) { // Vers le haut
                eyeX1 = x + width / 3;
                eyeX2 = x + width * 2/3;
                eyeY1 = eyeY2 = y + eyeSize * 1.5;
            } else { // Vers le bas
                eyeX1 = x + width / 3;
                eyeX2 = x + width * 2/3;
                eyeY1 = eyeY2 = y + height - eyeSize * 1.5;
            }
            
            // Dessiner les yeux
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupilles
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeX2, eyeY2, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Message de démarrage
    if (!gameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SNAKE', canvas.width/2, canvas.height/2 - 50);
        
        ctx.font = '20px Arial';
        ctx.fillText('Cliquez ou appuyez sur ESPACE pour commencer', canvas.width/2, canvas.height/2);
        
        ctx.font = '16px Arial';
        ctx.fillText('Utilisez les flèches pour diriger le serpent', canvas.width/2, canvas.height/2 + 30);
    }
}

// Gérer le game over
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    finalScoreElement.textContent = score;
    gameMessage.style.display = 'block';
    playSound('gameOver');
}

// Redémarrer le jeu
function restartGame() {
    gameMessage.style.display = 'none';
    clearInterval(gameLoop);
    gameStarted = false;
    gameRunning = false;
    initGame();
}

// Contrôles du clavier
document.addEventListener('keydown', function(e) {
    // Démarrer le jeu avec ESPACE
    if (e.key === ' ' && !gameStarted) {
        e.preventDefault();
        startGame();
        return;
    }
    
    if (!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowUp':
            if (direction.y !== 1) { // Ne pas permettre de revenir directement en arrière
                direction = {x: 0, y: -1};
            }
            break;
        case 'ArrowDown':
            if (direction.y !== -1) {
                direction = {x: 0, y: 1};
            }
            break;
        case 'ArrowLeft':
            if (direction.x !== 1) {
                direction = {x: -1, y: 0};
            }
            break;
        case 'ArrowRight':
            if (direction.x !== -1) {
                direction = {x: 1, y: 0};
            }
            break;
        case ' ': // Espace pour mettre en pause (optionnel)
            gameRunning = !gameRunning;
            if (gameRunning) {
                gameLoop = setInterval(update, gameSpeed);
            } else {
                clearInterval(gameLoop);
            }
            break;
    }
});

// Bouton de redémarrage
restartBtn.addEventListener('click', restartGame);

// Clic pour démarrer le jeu
canvas.addEventListener('click', function() {
    if (!gameStarted) {
        startGame();
    }
});

// Initialiser le jeu au chargement
window.addEventListener('load', initGame);
