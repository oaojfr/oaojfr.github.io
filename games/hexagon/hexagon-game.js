// Hexagon Game Script
const canvas = document.getElementById('hexagonCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const gameMessage = document.getElementById('gameMessage');
const restartBtn = document.getElementById('restartBtn');

// Game settings
const HEX_CONFIG = {
    wallSpeed: 1.5,
    playerRotationSpeed: 0.1,
    wallSpawnRate: 1500, // ms
    maxWallsOnScreen: 20,
    baseRadius: 50,
    playerSize: 10,
    colorSchemes: [
        // Rouge/Orange
        ['#ff4b1f', '#ff9068', '#ff416c', '#ff4e50', '#f9d423', '#f83600'],
        // Bleu/Violet
        ['#4776e6', '#8e54e9', '#00cdac', '#4b74e8', '#5f2c82', '#667eea'],
        // Vert/Cyan
        ['#1d976c', '#93f9b9', '#06beb6', '#48b1bf', '#56ab2f', '#00b09b'],
    ],
    colorSchemeTitles: ['Inferno', 'Cosmos', 'Verdant']
};

// Game variables
let score = 0;
let highScore = 0;
let difficultyLevel = 1;
let gameStartTime;
let animationFrame;
let lastTime = 0;
let rotationSpeed = 0.02;
let player;
let walls = [];
let colors;
let colorScheme = 0;
let pulse = 0;
let pulseDirection = 1;
let gameRunning = true;

// Audio system
let audio = {
    sounds: {}
};

// Précharger les sons pour Hexagon
function preloadAudio() {
    try {
        // Créer un contexte audio
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Sons à précharger
        const soundsToLoad = {
            'gameStart': 'https://dl.dropboxusercontent.com/s/97uxf2r5zcql9lh/game-start.mp3',
            'gameOver': 'https://dl.dropboxusercontent.com/s/i9f612y4ci30pzi/game-over.mp3',
            'wallPass': 'https://dl.dropboxusercontent.com/s/r2mgz1ryjc6m6ah/wall-pass.mp3',
            'levelUp': 'https://dl.dropboxusercontent.com/s/p7yheqwkfgw3hw2/level-up.mp3'
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
    
    // Récupérer le meilleur score du localStorage s'il existe
    const savedHighScore = localStorage.getItem('hexagonHighScore');
    if (savedHighScore) {
        highScore = parseInt(savedHighScore);
    }
    
    // Configuration du jeu
    colors = HEX_CONFIG.colorSchemes[colorScheme];
    
    // Créer le joueur
    player = {
        angle: 0,
        distance: canvas.height * 0.38
    };
    
    // Réinitialiser le score et la difficulté
    score = 0;
    difficultyLevel = 1;
    rotationSpeed = 0.02;
    walls = [];
    
    // Démarrer la génération des murs
    gameStartTime = Date.now();
    spawnWall();
    
    // Démarrer la boucle de jeu
    gameRunning = true;
    gameLoop();
    
    // Son de démarrage
    playSound('gameStart');
    
    // Initialiser les contrôles
    setupControls();
    
    // Mettre à jour le score affiché
    scoreElement.textContent = score;
}

// Configurer les contrôles
function setupControls() {
    // Contrôles clavier
    document.addEventListener('keydown', function(e) {
        if (!gameRunning) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                player.angle -= HEX_CONFIG.playerRotationSpeed;
                break;
            case 'ArrowRight':
                player.angle += HEX_CONFIG.playerRotationSpeed;
                break;
        }
    });
}

// Créer un mur
function spawnWall() {
    if (walls.length >= HEX_CONFIG.maxWallsOnScreen || !gameRunning) return;
    
    // Augmenter la difficulté avec le temps
    const gameTimeSeconds = (Date.now() - gameStartTime) / 1000;
    const newDifficultyLevel = Math.floor(gameTimeSeconds / 15) + 1;
    
    if (newDifficultyLevel > difficultyLevel) {
        difficultyLevel = newDifficultyLevel;
        rotationSpeed += 0.005;
        playSound('levelUp');
    }
    
    // Paramètres du mur
    const segments = 6; // Hexagone
    const gapSize = Math.max(1, Math.floor(segments / 3) - Math.floor(difficultyLevel / 3));
    const gapPosition = Math.floor(Math.random() * segments);
    
    // Créer le mur
    walls.push({
        distance: canvas.width * 0.8,
        segments: segments,
        gapPosition: gapPosition,
        gapSize: gapSize,
        passed: false,
        rotation: Math.random() * Math.PI * 2
    });
    
    // Programmer le prochain mur
    const spawnDelay = Math.max(300, HEX_CONFIG.wallSpawnRate - difficultyLevel * 100);
    setTimeout(spawnWall, spawnDelay);
}

// Mettre à jour l'état du jeu
function update(deltaTime) {
    // Mise à jour de l'effet de pulsation
    pulse += 0.05 * pulseDirection;
    if (pulse >= 1) {
        pulse = 1;
        pulseDirection = -1;
    } else if (pulse <= 0) {
        pulse = 0;
        pulseDirection = 1;
    }
    
    // Rotation du monde
    const worldRotation = Date.now() * 0.001 * rotationSpeed;
    
    // Mettre à jour les murs
    for (let i = walls.length - 1; i >= 0; i--) {
        const wall = walls[i];
        
        // Déplacer le mur vers le centre
        wall.distance -= HEX_CONFIG.wallSpeed * difficultyLevel * deltaTime * 0.1;
        
        // Vérifier si le joueur a passé le mur
        if (!wall.passed && wall.distance < player.distance) {
            wall.passed = true;
            score += 10;
            scoreElement.textContent = score;
            playSound('wallPass');
        }
        
        // Vérifier les collisions avec le joueur
        if (Math.abs(wall.distance - player.distance) < 10) {
            // Calculer l'angle du joueur par rapport au mur
            const playerAngleNormalized = ((player.angle + worldRotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            const segmentAngle = Math.PI * 2 / wall.segments;
            
            // Déterminer dans quel segment le joueur se trouve
            let playerSegment = Math.floor(playerAngleNormalized / segmentAngle);
            
            // Ajuster en fonction de la rotation du mur
            playerSegment = (playerSegment - Math.floor(wall.rotation / segmentAngle) + wall.segments) % wall.segments;
            
            // Vérifier si le joueur est dans un segment de mur (pas dans l'ouverture)
            const inGap = playerSegment >= wall.gapPosition && playerSegment < wall.gapPosition + wall.gapSize;
            
            if (!inGap) {
                gameOver();
                return;
            }
        }
        
        // Supprimer les murs qui sont sortis de l'écran
        if (wall.distance < 0) {
            walls.splice(i, 1);
        }
    }
}

// Dessiner le jeu
function draw() {
    // Effacer le canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Centrer le contexte
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Rotation du monde
    const worldRotation = Date.now() * 0.001 * rotationSpeed;
    ctx.rotate(worldRotation);
    
    // Dessiner l'arrière-plan hexagonal
    drawBackground();
    
    // Dessiner les murs
    drawWalls();
    
    // Restaurer la transformation
    ctx.restore();
    
    // Dessiner le joueur
    drawPlayer();
    
    // Dessiner les informations de jeu
    drawGameInfo();
}

// Dessiner l'arrière-plan
function drawBackground() {
    const centerRadius = HEX_CONFIG.baseRadius * (0.8 + pulse * 0.2);
    
    // Dessiner l'hexagone central
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const x = Math.cos(angle) * centerRadius;
        const y = Math.sin(angle) * centerRadius;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    
    // Remplir avec un dégradé radial
    const gradient = ctx.createRadialGradient(0, 0, centerRadius * 0.5, 0, 0, centerRadius);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Ajouter un contour
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Dessiner les murs
function drawWalls() {
    walls.forEach(wall => {
        const segmentAngle = Math.PI * 2 / wall.segments;
        const wallThickness = 15 + difficultyLevel * 2;
        
        ctx.save();
        ctx.rotate(wall.rotation);
        
        for (let i = 0; i < wall.segments; i++) {
            // Ne pas dessiner les segments qui forment l'ouverture
            if (i >= wall.gapPosition && i < wall.gapPosition + wall.gapSize) {
                continue;
            }
            
            // Dessiner le segment
            ctx.beginPath();
            ctx.arc(0, 0, wall.distance, i * segmentAngle, (i + 1) * segmentAngle);
            ctx.arc(0, 0, wall.distance + wallThickness, (i + 1) * segmentAngle, i * segmentAngle, true);
            ctx.closePath();
            
            // Remplir avec un dégradé
            const colorIndex = (i % colors.length);
            ctx.fillStyle = colors[colorIndex];
            ctx.fill();
            
            // Contour
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        ctx.restore();
    });
}

// Dessiner le joueur
function drawPlayer() {
    const worldRotation = Date.now() * 0.001 * rotationSpeed;
    const x = canvas.width / 2 + Math.cos(player.angle + worldRotation) * player.distance;
    const y = canvas.height / 2 + Math.sin(player.angle + worldRotation) * player.distance;
    
    // Cercle du joueur
    ctx.beginPath();
    ctx.arc(x, y, HEX_CONFIG.playerSize, 0, Math.PI * 2);
    
    // Dégradé pour le joueur
    const gradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, HEX_CONFIG.playerSize
    );
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, colors[3]);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Contour
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Effet de brillance
    ctx.beginPath();
    ctx.arc(
        x - HEX_CONFIG.playerSize * 0.3, 
        y - HEX_CONFIG.playerSize * 0.3, 
        HEX_CONFIG.playerSize * 0.3, 
        0, Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
}

// Dessiner les informations de jeu
function drawGameInfo() {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Poppins';
    ctx.textAlign = 'center';
    
    // Colorscheme et niveau de difficulté
    ctx.fillText(
        `${HEX_CONFIG.colorSchemeTitles[colorScheme]} - Level ${difficultyLevel}`, 
        canvas.width / 2, 
        30
    );
}

// Gérer le game over
function gameOver() {
    gameRunning = false;
    playSound('gameOver');
    
    // Mettre à jour le meilleur score si nécessaire
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('hexagonHighScore', highScore);
    }
    
    // Afficher l'écran de game over
    finalScoreElement.textContent = score;
    gameMessage.style.display = 'block';
}

// Boucle principale du jeu
function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    // Calculer le delta time
    if (!lastTime) {
        lastTime = timestamp;
    }
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Mettre à jour et dessiner le jeu
    update(deltaTime);
    draw();
    
    // Continuer la boucle
    animationFrame = requestAnimationFrame(gameLoop);
}

// Redémarrer le jeu
function restartGame() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    gameMessage.style.display = 'none';
    initGame();
}

// Bouton de redémarrage
restartBtn.addEventListener('click', restartGame);

// Changer la couleur avec C
document.addEventListener('keydown', function(e) {
    if (e.key.toLowerCase() === 'c') {
        colorScheme = (colorScheme + 1) % HEX_CONFIG.colorSchemes.length;
        colors = HEX_CONFIG.colorSchemes[colorScheme];
    }
});

// Initialiser le jeu au chargement
window.addEventListener('load', initGame);
