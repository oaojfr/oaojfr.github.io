// Snake Game Easter Egg
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
            'background': 'https://bearable-hacker.io/snake-music.mp3'
        };
        
        // Précharger chaque son
        for (const [key, url] of Object.entries(soundsToLoad)) {
            fetch(url)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    snakeAudio[key] = {
                        buffer: audioBuffer,
                        context: audioContext
                    };
                })
                .catch(e => console.log('Erreur de chargement audio:', e));
        }
    } catch (e) {
        console.log('Audio non supporté:', e);
    }
}

function playSnakeSound(soundName, loop = false) {
    // Si le son n'est pas chargé ou si l'audio n'est pas supporté, ne rien faire
    if (!snakeAudio[soundName]) return null;
    
    try {
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
    
    // Define functions first    function generateFood() {
        // Générer la nourriture autour du serpent (dans un rayon de 5 cases)
        const head = snake[0];
        let validPosition = false;
        let attempts = 0;
        
        while (!validPosition && attempts < 100) {
            // Générer une position à une distance de 3-7 cases de la tête
            const distance = Math.floor(Math.random() * 5) + 3; // Distance de 3 à 7 
            const angle = Math.random() * Math.PI * 2; // Angle aléatoire (0-360°)
            
            // Calculer les coordonnées
            let x = Math.floor(head.x + Math.cos(angle) * distance);
            let y = Math.floor(head.y + Math.sin(angle) * distance);
            
            // Ajuster les coordonnées si on peut traverser les murs
            if (snakeWrapWalls) {
                x = ((x % tileCount) + tileCount) % tileCount;
                y = ((y % tileCount) + tileCount) % tileCount;
            } else {
                // Sinon, s'assurer que c'est dans les limites
                if (x < 0 || x >= tileCount || y < 0 || y >= tileCount) {
                    attempts++;
                    continue;
                }
            }
            
            // Vérifier si cette position est libre
            validPosition = true;
            for (let segment of snake) {
                if (segment.x === x && segment.y === y) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                food = { x, y, type: Math.random() < 0.2 ? 'special' : 'normal' };
                // Réinitialiser l'effet visuel
                snakeFoodEffect = 0;
                break;
            }
            
            attempts++;
        }
        
        // Fallback si on ne trouve pas de position valide
        if (!validPosition) {
            const freePositions = [];
            
            // Trouver toutes les positions libres
            for (let x = 0; x < tileCount; x++) {
                for (let y = 0; y < tileCount; y++) {
                    let isFree = true;
                    for (let segment of snake) {
                        if (segment.x === x && segment.y === y) {
                            isFree = false;
                            break;
                        }
                    }
                    if (isFree) {
                        freePositions.push({x, y});
                    }
                }
            }
            
            // Choisir une position aléatoire parmi les libres
            if (freePositions.length > 0) {
                const randomPos = freePositions[Math.floor(Math.random() * freePositions.length)];
                food = { 
                    x: randomPos.x, 
                    y: randomPos.y,
                    type: 'normal' 
                };
            } else {
                // Dernier recours: position aléatoire
                food = { 
                    x: Math.floor(Math.random() * tileCount), 
                    y: Math.floor(Math.random() * tileCount),
                    type: 'normal' 
                };
            }
        }
        
        // Jouer le son d'apparition de nourriture
        // Pas de son pour ne pas surcharger l'audio
    }
    
    // Game state
    snake = [
        {x: 10, y: 10}
    ];
    snakeDirection = {x: 0, y: 0};
    snakeScore = 0;
    snakeScoreElement.textContent = snakeScore;
    
    // Simple initial food placement
    food = {x: 20, y: 15}; // Fixed position for first fruit
    console.log('Initial food placed at:', food.x, food.y);
    
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
            // Sinon, vérifier la collision avec les murs
            if (newX < 0 || newX >= tileCount || newY < 0 || newY >= tileCount) {
                gameOver();
                return;
            }
        }
        
        const head = {x: newX, y: newY};
        
        // Check self collision
        for (let segment of snake) {
            if (head.x === segment.x && head.y === segment.y) {
                gameOver();
                return;
            }
        }
        
        snake.unshift(head);
        
        // Check food collision
        if (head.x === food.x && head.y === food.y) {
            // Jouer le son de nourriture
            playSnakeSound('eatFood');
            
            // Incrémenter le score (double pour la nourriture spéciale)
            const points = food.type === 'special' ? 2 : 1;
            snakeScore += points;
            snakeScoreElement.textContent = snakeScore;
            
            generateFood();
            // Don't remove tail when eating (snake grows)
        } else {
            snake.pop(); // Remove tail when not eating
        }
    }
      function draw() {
        // Clear canvas with gradient background
        const gradient = snakeCtx.createLinearGradient(0, 0, snakeCanvas.width, snakeCanvas.height);
        gradient.addColorStop(0, '#0f0c29');
        gradient.addColorStop(0.5, '#302b63');
        gradient.addColorStop(1, '#24243e');
        
        snakeCtx.fillStyle = gradient;
        snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
        
        // Dessiner une grille subtile
        snakeCtx.strokeStyle = 'rgba(255,255,255,0.1)';
        snakeCtx.lineWidth = 0.5;
        
        // Grille allégée (une ligne sur deux)
        for (let i = 0; i < tileCount; i += 2) {
            snakeCtx.beginPath();
            snakeCtx.moveTo(i * gridSize, 0);
            snakeCtx.lineTo(i * gridSize, snakeCanvas.height);
            snakeCtx.stroke();
            
            snakeCtx.beginPath();
            snakeCtx.moveTo(0, i * gridSize);
            snakeCtx.lineTo(snakeCanvas.width, i * gridSize);
            snakeCtx.stroke();
        }
        
        // Dessiner la nourriture avec effet de pulsation
        if (food && food.x !== undefined && food.y !== undefined) {
            snakeFoodEffect += 0.1;
            const pulseSize = Math.sin(snakeFoodEffect) * 2;
            
            // Dessiner un halo pour la nourriture
            snakeCtx.beginPath();
            snakeCtx.arc(
                food.x * gridSize + gridSize/2, 
                food.y * gridSize + gridSize/2, 
                gridSize/2 + 2 + pulseSize, 
                0, 
                Math.PI * 2
            );
            
            // Couleur différente selon le type de nourriture
            if (food.type === 'special') {
                snakeCtx.fillStyle = 'rgba(255, 215, 0, 0.3)'; // Or pour spécial
            } else {
                snakeCtx.fillStyle = 'rgba(255, 107, 107, 0.3)';
            }
            snakeCtx.fill();
            
            // Dessiner la nourriture elle-même
            snakeCtx.beginPath();
            snakeCtx.arc(
                food.x * gridSize + gridSize/2, 
                food.y * gridSize + gridSize/2, 
                gridSize/2 - 2, 
                0, 
                Math.PI * 2
            );
            
            // Couleur de la nourriture
            if (food.type === 'special') {
                snakeCtx.fillStyle = '#ffd700'; // Or pour spécial
            } else {
                snakeCtx.fillStyle = '#ff6b6b';
            }
            snakeCtx.fill();
        }
        
        // Dessiner le serpent avec un dégradé et des effets arrondis
        drawSnakeWithEffects();
    }
    
    function drawSnakeWithEffects() {
        // Dessiner chaque segment avec un dégradé
        for (let i = 0; i < snake.length; i++) {
            const segment = snake[i];
            
            // Couleur différente pour la tête
            if (i === 0) {
                snakeCtx.fillStyle = '#4ecdc4';
            } else {
                // Couleur dégradée pour le corps
                const gradient = snakeCtx.createLinearGradient(
                    segment.x * gridSize, 
                    segment.y * gridSize,
                    (segment.x + 1) * gridSize,
                    (segment.y + 1) * gridSize
                );
                
                gradient.addColorStop(0, '#4ecdc4');
                gradient.addColorStop(1, '#2eabb8');
                
                snakeCtx.fillStyle = gradient;
            }
            
            // Dessiner des segments arrondis
            snakeCtx.beginPath();
            snakeCtx.roundRect(
                segment.x * gridSize + 1, 
                segment.y * gridSize + 1, 
                gridSize - 2, 
                gridSize - 2,
                [5, 5, 5, 5]  // Coins arrondis
            );
            snakeCtx.fill();
            
            // Pour la tête, ajouter des yeux
            if (i === 0) {
                // Position des yeux selon la direction
                let eyeX1, eyeY1, eyeX2, eyeY2;
                const eyeSize = 3;
                const eyeOffset = 6;
                
                if (snakeDirection.x === 1) {  // Droite
                    eyeX1 = eyeX2 = segment.x * gridSize + gridSize - 7;
                    eyeY1 = segment.y * gridSize + 7;
                    eyeY2 = segment.y * gridSize + gridSize - 7;
                } else if (snakeDirection.x === -1) {  // Gauche
                    eyeX1 = eyeX2 = segment.x * gridSize + 7;
                    eyeY1 = segment.y * gridSize + 7;
                    eyeY2 = segment.y * gridSize + gridSize - 7;
                } else if (snakeDirection.y === -1) {  // Haut
                    eyeX1 = segment.x * gridSize + 7;
                    eyeX2 = segment.x * gridSize + gridSize - 7;
                    eyeY1 = eyeY2 = segment.y * gridSize + 7;
                } else {  // Bas ou par défaut
                    eyeX1 = segment.x * gridSize + 7;
                    eyeX2 = segment.x * gridSize + gridSize - 7;
                    eyeY1 = eyeY2 = segment.y * gridSize + gridSize - 7;
                }
                
                // Dessiner les yeux
                snakeCtx.fillStyle = 'white';
                snakeCtx.beginPath();
                snakeCtx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
                snakeCtx.fill();
                
                snakeCtx.beginPath();
                snakeCtx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
                snakeCtx.fill();
                
                snakeCtx.fillStyle = 'black';
                snakeCtx.beginPath();
                snakeCtx.arc(eyeX1, eyeY1, eyeSize/2, 0, Math.PI * 2);
                snakeCtx.fill();
                
                snakeCtx.beginPath();
                snakeCtx.arc(eyeX2, eyeY2, eyeSize/2, 0, Math.PI * 2);
                snakeCtx.fill();
            }
        }
    }
      function gameOver() {
        snakeGameRunning = false;
        
        // Jouer le son de fin de jeu
        playSnakeSound('gameOver');
        
        // Arrêter la musique de fond
        if (snakeBackgroundMusic) {
            snakeBackgroundMusic.stop();
        }
        
        // Afficher l'écran de game over avec animation
        const gameOverDiv = document.getElementById('snake-game-over');
        const finalScoreSpan = document.getElementById('snake-final-score');
        
        // Animation de l'écran de game over
        gameOverDiv.style.opacity = '0';
        gameOverDiv.style.display = 'block';
        gameOverDiv.style.transition = 'opacity 0.5s ease';
        finalScoreSpan.textContent = snakeScore;
        
        setTimeout(() => {
            gameOverDiv.style.opacity = '1';
        }, 10);
    }
      function gameLoop() {
        if (!snakeGameRunning) return;
        
        updateSnake();
        draw();
        
        // Utiliser la vitesse définie par l'utilisateur
        setTimeout(gameLoop, snakeGameSpeed);
    }
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

function restartSnakeGame() {
    document.getElementById('snake-game-over').style.display = 'none';
    startSnakeGame();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSnakeGame);
