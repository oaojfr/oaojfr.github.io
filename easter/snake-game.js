// Snake Game Easter Egg - Version propre
let snakeGameRunning = false;
let snakeCanvas, snakeCtx, snakeOverlay, snakeScoreElement;
let snake, food, snakeDirection, snakeScore;
let snakeKeys = {};
let gridSize, tileCount;
let snakeWrapWalls = true; // Traversée des murs
let snakeGameSpeed = 150; // Contrôle de vitesse (ms)
let snakeFoodEffect = 0; // Effet visuel pour la nourriture
let snakeColorScheme = 0; // Schéma de couleurs actuel
let snakeAudio = {}; // Effets sonores
let snakeBackgroundMusic = null; // Musique de fond

function initSnakeGame() {
    // Easter Egg: Snake Game sequence detection
    let easterEggSequence = [];
    const secretCode = ['s', 'n', 'a', 'k', 'e'];
    
    // Précharger les sons
    preloadSnakeSounds();
    
    // Listen for secret key sequence
    document.addEventListener('keydown', function(e) {
        if (snakeGameRunning) return;
        
        easterEggSequence.push(e.key.toLowerCase());
        
        // Keep only the last 5 keys
        if (easterEggSequence.length > secretCode.length) {
            easterEggSequence.shift();
        }
        
        // Check if sequence matches
        if (easterEggSequence.length === secretCode.length && 
            easterEggSequence.every((key, index) => key === secretCode[index])) {
            startSnakeGame();
            easterEggSequence = [];
        }
    });
}

function preloadSnakeSounds() {
    try {
        // Créer un contexte audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Sons à précharger
        const soundsToLoad = {
            'eatFood': 'https://bearable-hacker.io/snake-eat.mp3',
            'gameOver': 'https://bearable-hacker.io/snake-over.mp3',
            'background': 'https://bearable-hacker.io/snake-background.mp3'
        };
        
        // Précharger chaque son
        for (const [key, url] of Object.entries(soundsToLoad)) {
            const request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            request.onload = function() {
                audioContext.decodeAudioData(request.response, function(buffer) {
                    snakeAudio[key] = {
                        context: audioContext,
                        buffer: buffer
                    };
                });
            };
            request.send();
        }
    } catch (e) {
        console.log('Audio non supporté');
    }
}

function playSnakeSound(soundName, loop = false) {
    try {
        if (!snakeAudio[soundName]) return null;
        
        const sound = snakeAudio[soundName];
        const source = sound.context.createBufferSource();
        source.buffer = sound.buffer;
        source.connect(sound.context.destination);
        source.loop = loop;
        source.start(0);
        return source;
    } catch (e) {
        console.log('Erreur de lecture audio:', e);
        return null;
    }
}

function startSnakeGame() {
    snakeOverlay = document.getElementById('snake-overlay');
    snakeCanvas = document.getElementById('snake-canvas');
    snakeCtx = snakeCanvas.getContext('2d');
    snakeScoreElement = document.getElementById('snake-score-value');
    const closeBtn = document.getElementById('snake-close');
    
    snakeOverlay.style.display = 'flex';
    snakeGameRunning = true;
    
    // Game settings
    gridSize = 20;
    tileCount = snakeCanvas.width / gridSize;
    
    // Démarrer la musique de fond
    if (snakeBackgroundMusic) {
        snakeBackgroundMusic.stop();
    }
    snakeBackgroundMusic = playSnakeSound('background', true);
    
    // Ajouter un contrôleur de vitesse et d'options
    addSnakeControls();
    
    // Initialiser le serpent, la nourriture et la direction
    resetSnake();
    
    // Controls
    function handleKeyDown(e) {
        if (!snakeGameRunning) return;
        
        switch(e.key) {
            case 'ArrowUp':
                if (snakeDirection.y !== 1) {
                    snakeDirection = {x: 0, y: -1};
                }
                break;
            case 'ArrowDown':
                if (snakeDirection.y !== -1) {
                    snakeDirection = {x: 0, y: 1};
                }
                break;
            case 'ArrowLeft':
                if (snakeDirection.x !== 1) {
                    snakeDirection = {x: -1, y: 0};
                }
                break;
            case 'ArrowRight':
                if (snakeDirection.x !== -1) {
                    snakeDirection = {x: 1, y: 0};
                }
                break;
        }
    }
    
    // Remove any existing listeners first
    document.removeEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDown);
    
    function closeSnakeGameInternal() {
        snakeGameRunning = false;
        snakeOverlay.style.display = 'none';
        document.getElementById('snake-game-over').style.display = 'none';
        document.removeEventListener('keydown', handleKeyDown);
        
        // Arrêter la musique de fond
        if (snakeBackgroundMusic) {
            snakeBackgroundMusic.stop();
        }
    }
    
    // Close button event
    closeBtn.onclick = closeSnakeGameInternal;
    
    // ESC key to close
    function handleEscape(e) {
        if (e.key === 'Escape') {
            closeSnakeGameInternal();
            document.removeEventListener('keydown', handleEscape);
        }
    }
    document.addEventListener('keydown', handleEscape);
    
    // Start the game loop
    gameLoop();
}

// Fonction pour initialiser le serpent et la nourriture
function resetSnake() {
    snake = [
        {x: 10, y: 10},
        {x: 9, y: 10},
        {x: 8, y: 10}
    ];
    snakeDirection = { x: 1, y: 0 }; // Vers la droite
    snakeScore = 0;
    generateFood();
}

function generateFood() {
    // Générer la nourriture autour du serpent (exactement à 5 cases comme demandé)
    const head = snake[0];
    let validPosition = false;
    let attempts = 0;
    
    while (!validPosition && attempts < 100) {
        // Générer une position à une distance exacte de 5 cases
        const distance = 5; // Distance fixée à 5 comme demandé
        const angle = Math.random() * Math.PI * 2; // Angle aléatoire (0-360°)
        
        // Calculer les coordonnées
        let x = Math.floor(head.x + Math.cos(angle) * distance);
        let y = Math.floor(head.y + Math.sin(angle) * distance);
        
        // Ajuster les coordonnées si on peut traverser les murs (maintenant activé par défaut)
        x = ((x % tileCount) + tileCount) % tileCount;
        y = ((y % tileCount) + tileCount) % tileCount;
        
        // Vérifier si cette position est libre
        validPosition = true;
        for (let segment of snake) {
            if (segment.x === x && segment.y === y) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) {
            // 30% de chance d'avoir un fruit spécial
            food = { 
                x, 
                y, 
                type: Math.random() < 0.3 ? 'special' : 'normal',
                effect: Math.random() < 0.5 ? 'speed' : 'grow'
            };
            snakeFoodEffect = 0;
            break;
        }
        
        attempts++;
    }
    
    // Fallback si on ne trouve pas de position valide
    if (!validPosition) {
        food = { 
            x: Math.floor(Math.random() * tileCount), 
            y: Math.floor(Math.random() * tileCount),
            type: 'normal',
            effect: 'grow'
        };
    }
}

function updateSnake() {
    // Don't move if no direction is set
    if (snakeDirection.x === 0 && snakeDirection.y === 0) {
        return;
    }
    
    // Créer une nouvelle tête en fonction de la direction
    let newX = snake[0].x + snakeDirection.x;
    let newY = snake[0].y + snakeDirection.y;
    
    // Gestion de la traversée des murs
    if (snakeWrapWalls) {
        // Si on peut traverser les murs, on apparaît de l'autre côté
        newX = ((newX % tileCount) + tileCount) % tileCount;
        newY = ((newY % tileCount) + tileCount) % tileCount;
    } else {
        // Vérifier les collisions avec les murs
        if (newX < 0 || newX >= tileCount || newY < 0 || newY >= tileCount) {
            gameOverSnake();
            return;
        }
    }
    
    // Vérifier les collisions avec soi-même
    for (let segment of snake) {
        if (newX === segment.x && newY === segment.y) {
            gameOverSnake();
            return;
        }
    }
    
    // Ajouter la nouvelle tête
    snake.unshift({x: newX, y: newY});
    
    // Vérifier si on mange la nourriture
    if (newX === food.x && newY === food.y) {
        snakeScore += food.type === 'special' ? 20 : 10;
        playSnakeSound('eatFood');
        generateFood();
        
        // Effet spécial des fruits
        if (food.effect === 'speed') {
            // Accélération temporaire
            let oldSpeed = snakeGameSpeed;
            snakeGameSpeed = Math.max(50, snakeGameSpeed - 30);
            setTimeout(() => {
                snakeGameSpeed = oldSpeed;
            }, 3000);
        }
    } else {
        // Enlever la queue si on n'a pas mangé
        snake.pop();
    }
    
    // Mettre à jour l'affichage du score
    snakeScoreElement.textContent = snakeScore;
}

function draw() {
    // Effacer le canvas avec un dégradé
    const gradient = snakeCtx.createLinearGradient(0, 0, snakeCanvas.width, snakeCanvas.height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#1a1a1a');
    snakeCtx.fillStyle = gradient;
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    
    // Dessiner une grille subtile
    snakeCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    snakeCtx.lineWidth = 1;
    for (let i = 0; i <= tileCount; i++) {
        snakeCtx.beginPath();
        snakeCtx.moveTo(i * gridSize, 0);
        snakeCtx.lineTo(i * gridSize, snakeCanvas.height);
        snakeCtx.stroke();
        
        snakeCtx.beginPath();
        snakeCtx.moveTo(0, i * gridSize);
        snakeCtx.lineTo(snakeCanvas.width, i * gridSize);
        snakeCtx.stroke();
    }
    
    // Dessiner le serpent avec style moderne
    snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        
        if (index === 0) {
            // Tête du serpent avec dégradé et yeux
            const headGradient = snakeCtx.createRadialGradient(
                x + gridSize/2, y + gridSize/2, 0,
                x + gridSize/2, y + gridSize/2, gridSize/2
            );
            headGradient.addColorStop(0, '#4CAF50');
            headGradient.addColorStop(1, '#2E7D32');
            
            snakeCtx.fillStyle = headGradient;
            snakeCtx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
            
            // Yeux animés
            snakeCtx.fillStyle = '#fff';
            snakeCtx.fillRect(x + 5, y + 5, 3, 3);
            snakeCtx.fillRect(x + gridSize - 8, y + 5, 3, 3);
            
            snakeCtx.fillStyle = '#000';
            snakeCtx.fillRect(x + 6, y + 6, 1, 1);
            snakeCtx.fillRect(x + gridSize - 7, y + 6, 1, 1);
        } else {
            // Corps du serpent avec segments arrondis
            const bodyGradient = snakeCtx.createRadialGradient(
                x + gridSize/2, y + gridSize/2, 0,
                x + gridSize/2, y + gridSize/2, gridSize/2
            );
            bodyGradient.addColorStop(0, '#66BB6A');
            bodyGradient.addColorStop(1, '#388E3C');
            
            snakeCtx.fillStyle = bodyGradient;
            snakeCtx.fillRect(x + 3, y + 3, gridSize - 6, gridSize - 6);
        }
    });
    
    // Dessiner la nourriture avec halo et effets
    const foodX = food.x * gridSize;
    const foodY = food.y * gridSize;
    
    // Halo autour de la nourriture
    snakeFoodEffect += 0.1;
    const haloSize = 5 + Math.sin(snakeFoodEffect) * 3;
    const haloGradient = snakeCtx.createRadialGradient(
        foodX + gridSize/2, foodY + gridSize/2, 0,
        foodX + gridSize/2, foodY + gridSize/2, haloSize
    );
    haloGradient.addColorStop(0, food.type === 'special' ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 0, 0, 0.6)');
    haloGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    snakeCtx.fillStyle = haloGradient;
    snakeCtx.fillRect(foodX - haloSize, foodY - haloSize, gridSize + haloSize*2, gridSize + haloSize*2);
    
    // Nourriture elle-même
    snakeCtx.fillStyle = food.type === 'special' ? '#FFD700' : '#FF5722';
    snakeCtx.fillRect(foodX + 2, foodY + 2, gridSize - 4, gridSize - 4);
    
    // Brillance sur la nourriture
    snakeCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    snakeCtx.fillRect(foodX + 4, foodY + 4, gridSize/3, gridSize/3);
    
    // Effet de vignette
    const vignette = snakeCtx.createRadialGradient(
        snakeCanvas.width/2, snakeCanvas.height/2, snakeCanvas.width/4,
        snakeCanvas.width/2, snakeCanvas.height/2, snakeCanvas.width/1.5
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    
    snakeCtx.fillStyle = vignette;
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
}

function gameLoop() {
    if (!snakeGameRunning) return;
    
    updateSnake();
    draw();
    
    // Utiliser la vitesse définie par l'utilisateur
    setTimeout(gameLoop, snakeGameSpeed);
}

function gameOverSnake() {
    snakeGameRunning = false;
    playSnakeSound('gameOver');
    
    // Arrêter la musique de fond
    if (snakeBackgroundMusic) {
        snakeBackgroundMusic.stop();
    }
    
    // Afficher l'écran de game over
    const gameOverDiv = document.getElementById('snake-game-over');
    document.getElementById('snake-final-score').textContent = snakeScore;
    gameOverDiv.style.display = 'block';
    gameOverDiv.style.opacity = '0';
    
    setTimeout(() => {
        gameOverDiv.style.opacity = '1';
    }, 10);
}

function addSnakeControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.style.position = 'absolute';
    controlsDiv.style.top = '10px';
    controlsDiv.style.left = '10px';
    controlsDiv.style.color = 'white';
    controlsDiv.style.zIndex = '100';
    controlsDiv.style.background = 'rgba(0,0,0,0.5)';
    controlsDiv.style.padding = '5px';
    controlsDiv.style.borderRadius = '5px';
    
    controlsDiv.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <label for="snake-walls" style="margin-right: 10px;">Traverser les murs: </label>
            <input type="checkbox" id="snake-walls" ${snakeWrapWalls ? 'checked' : ''}>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <label for="snake-speed" style="margin-right: 10px;">Vitesse: </label>
            <input type="range" id="snake-speed" min="50" max="250" step="10" value="${250-snakeGameSpeed}" style="width: 100px;">
        </div>
    `;
    
    snakeOverlay.appendChild(controlsDiv);
    
    // Ajouter les événements
    document.getElementById('snake-walls').addEventListener('change', function() {
        snakeWrapWalls = this.checked;
    });
    
    document.getElementById('snake-speed').addEventListener('input', function() {
        snakeGameSpeed = 250 - parseInt(this.value);
    });
}

// Global functions for buttons
function restartSnakeGame() {
    document.getElementById('snake-game-over').style.display = 'none';
    startSnakeGame();
}

function closeSnakeGame() {
    const overlay = document.getElementById('snake-overlay');
    const gameOverDiv = document.getElementById('snake-game-over');
    
    snakeGameRunning = false;
    overlay.style.display = 'none';
    gameOverDiv.style.display = 'none';
    
    // Reset score
    document.getElementById('snake-score-value').textContent = '0';
    
    // Arrêter la musique de fond
    if (snakeBackgroundMusic) {
        snakeBackgroundMusic.stop();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSnakeGame);
