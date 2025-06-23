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
            // Créer l'interface si elle n'existe pas
            createSnakeGameInterface();
            startSnakeGame();
            easterEggSequence = [];
        }
    });

    // Préparer l'interface du jeu Snake
    createSnakeGameInterface();
}

function createSnakeGameInterface() {
    // Vérifier si l'interface existe déjà
    if (document.getElementById('snake-overlay')) return;
    
    // Créer l'overlay principal
    const snakeOverlay = document.createElement('div');
    snakeOverlay.id = 'snake-overlay';
    snakeOverlay.style.position = 'fixed';
    snakeOverlay.style.top = '0';
    snakeOverlay.style.left = '0';
    snakeOverlay.style.width = '100%';
    snakeOverlay.style.height = '100%';
    snakeOverlay.style.backgroundColor = '#000';
    snakeOverlay.style.zIndex = '9999';
    snakeOverlay.style.display = 'none'; // Caché par défaut
    snakeOverlay.style.flexDirection = 'column';
    snakeOverlay.style.justifyContent = 'center';
    snakeOverlay.style.alignItems = 'center';
    snakeOverlay.style.fontFamily = "'Poppins', sans-serif";
    
    // Créer le canvas pour le jeu
    const snakeCanvas = document.createElement('canvas');
    snakeCanvas.id = 'snake-canvas';
    snakeCanvas.width = 400;
    snakeCanvas.height = 400;
    snakeCanvas.style.display = 'block';
    snakeCanvas.style.border = '2px solid #30336b';
    
    // Créer l'interface UI
    const snakeUI = document.createElement('div');
    snakeUI.id = 'snake-ui';
    snakeUI.style.position = 'absolute';
    snakeUI.style.top = '20px';
    snakeUI.style.left = '0';
    snakeUI.style.width = '100%';
    snakeUI.style.padding = '0 20px';
    snakeUI.style.boxSizing = 'border-box';
    snakeUI.style.color = '#fff';
    snakeUI.style.textShadow = '0 0 5px rgba(0,0,0,0.7)';
    snakeUI.style.display = 'flex';
    snakeUI.style.justifyContent = 'space-between';
    snakeUI.style.zIndex = '10';
    
    snakeUI.innerHTML = `
        <div>
            <div>SCORE: <span id="snake-score-value">0</span></div>
        </div>
        <div>
            <div><button id="snake-close" style="padding: 5px 10px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer;">Fermer</button></div>
        </div>
    `;
    
    // Créer l'écran de fin de jeu
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'snake-game-over';
    gameOverScreen.style.position = 'absolute';
    gameOverScreen.style.top = '0';
    gameOverScreen.style.left = '0';
    gameOverScreen.style.width = '100%';
    gameOverScreen.style.height = '100%';
    gameOverScreen.style.backgroundColor = 'rgba(0,0,0,0.8)';
    gameOverScreen.style.display = 'none';
    gameOverScreen.style.flexDirection = 'column';
    gameOverScreen.style.justifyContent = 'center';
    gameOverScreen.style.alignItems = 'center';
    gameOverScreen.style.zIndex = '20';
    gameOverScreen.style.color = '#fff';
    
    gameOverScreen.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 30px; text-align: center;">GAME OVER</div>
        <div style="font-size: 1.5rem; margin-bottom: 30px;">Score: <span id="snake-final-score">0</span></div>
        <div style="display: flex; gap: 20px;">
            <button id="snake-retry" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Réessayer</button>
            <button id="snake-close-button" style="padding: 10px 20px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer;">Fermer</button>
        </div>
    `;
    
    // Ajouter les éléments à l'overlay
    snakeOverlay.appendChild(snakeCanvas);
    snakeOverlay.appendChild(snakeUI);
    snakeOverlay.appendChild(gameOverScreen);
    
    // Ajouter l'overlay au body
    document.body.appendChild(snakeOverlay);
    
    // Ajouter les événements aux boutons
    document.getElementById('snake-retry').addEventListener('click', function() {
        resetSnake();
        snakeGameRunning = true;
        document.getElementById('snake-game-over').style.display = 'none';
        gameLoop();
    });
    
    document.getElementById('snake-close-button').addEventListener('click', closeSnakeGameInternal);
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
      // Initialiser le serpent, la nourriture et la direction
    resetSnake();
    
    // Démarrer la boucle de jeu
    gameLoop();
}

// Fonction pour initialiser le serpent et la nourriture
function resetSnake() {
    snake = [
        {x: 10, y: 10},
        {x: 9, y: 10},
        {x: 8, y: 10}
    ];
    snakeDirection = {x: 1, y: 0}; // Direction initiale vers la droite
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
                // 30% de chance d'avoir un fruit spécial (augmentation par rapport à avant)
                food = { 
                    x, 
                    y, 
                    type: Math.random() < 0.3 ? 'special' : 'normal',
                    effect: Math.random() < 0.5 ? 'speed' : 'grow' // Effets différents
                };
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
                    type: 'normal',
                    effect: 'grow'
                };
            } else {
                // Dernier recours: position aléatoire
                food = { 
                    x: Math.floor(Math.random() * tileCount), 
                    y: Math.floor(Math.random() * tileCount),
                    type: 'normal',
                    effect: 'grow'
                };
            }
        }
        
        // Jouer le son d'apparition de nourriture (subtil)
        if (Math.random() > 0.7) { // 30% de chance de jouer le son pour ne pas surcharger
            const audio = new Audio('https://bearable-hacker.io/snake-food-appear.mp3');
            audio.volume = 0.3; // Volume bas
            audio.play().catch(e => {}); // Ignorer les erreurs
        }
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
    document.addEventListener('keydown', handleKeyDown);function updateSnake() {
    // Don't move if no direction is set
    if (!snakeDirection || (snakeDirection.x === 0 && snakeDirection.y === 0)) {
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
    }function draw() {
        // Clear canvas with modern background
        drawBackground();
        
        // Dessiner la nourriture
        drawFood();
        
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
        
        // Dessiner le serpent avec un dégradé et des effets arrondis        // Dessiner le serpent
        drawSnake();
    }
    
function drawSnake() {
        // Dessiner le serpent avec un style moderne
        
        // Dégradé de couleur basé sur la longueur du serpent
        const snakeGradient = snakeCtx.createLinearGradient(0, 0, snakeCanvas.width, snakeCanvas.height);
        const baseHue = (snakeColorScheme * 60) % 360; // Changer la teinte selon le schéma de couleur
        
        snakeGradient.addColorStop(0, `hsl(${baseHue}, 80%, 60%)`);
        snakeGradient.addColorStop(1, `hsl(${(baseHue + 40) % 360}, 80%, 60%)`);
        
        // Dessiner chaque segment du serpent avec un style arrondi
        for (let i = 0; i < snake.length; i++) {
            const segment = snake[i];
            
            // Calculer la taille du segment (légèrement plus petit que la taille de la grille)
            const padding = 2;
            const size = gridSize - padding * 2;
            
            // Position du segment
            const x = segment.x * gridSize + padding;
            const y = segment.y * gridSize + padding;
            
            // Rayon pour les coins arrondis (différent pour tête, corps et queue)
            let radius = size / 4;
            
            // Dessiner le segment avec des coins arrondis
            snakeCtx.fillStyle = i === 0 ? 
                `hsl(${(baseHue + 20) % 360}, 90%, 50%)` : // Tête plus vive
                snakeGradient;
                
            snakeCtx.beginPath();
            
            if (i === 0) {
                // Tête du serpent avec des yeux
                snakeCtx.roundRect(x, y, size, size, radius);
                snakeCtx.fill();
                
                // Yeux
                const eyeSize = size / 4;
                const eyeOffset = size / 4;
                
                // Déterminer la position des yeux en fonction de la direction
                let eyeX1, eyeX2, eyeY1, eyeY2;
                
                if (snakeDirection === 'up') {
                    eyeX1 = x + eyeOffset;
                    eyeX2 = x + size - eyeOffset - eyeSize;
                    eyeY1 = eyeY2 = y + eyeOffset;
                } else if (snakeDirection === 'down') {
                    eyeX1 = x + eyeOffset;
                    eyeX2 = x + size - eyeOffset - eyeSize;
                    eyeY1 = eyeY2 = y + size - eyeOffset - eyeSize;
                } else if (snakeDirection === 'left') {
                    eyeX1 = eyeX2 = x + eyeOffset;
                    eyeY1 = y + eyeOffset;
                    eyeY2 = y + size - eyeOffset - eyeSize;
                } else { // right
                    eyeX1 = eyeX2 = x + size - eyeOffset - eyeSize;
                    eyeY1 = y + eyeOffset;
                    eyeY2 = y + size - eyeOffset - eyeSize;
                }
                
                // Ajouter un peu de mouvement aux yeux (animation)
                const eyeBlink = Math.sin(Date.now() / 300) > 0.8;
                const eyeHeight = eyeBlink ? eyeSize / 3 : eyeSize;
                
                // Dessiner les yeux
                snakeCtx.fillStyle = 'white';
                snakeCtx.beginPath();
                snakeCtx.roundRect(eyeX1, eyeY1, eyeSize, eyeHeight, eyeSize / 2);
                snakeCtx.roundRect(eyeX2, eyeY2, eyeSize, eyeHeight, eyeSize / 2);
                snakeCtx.fill();
                
                // Pupilles
                const pupilSize = eyeSize / 2;
                snakeCtx.fillStyle = 'black';
                snakeCtx.beginPath();
                snakeCtx.arc(eyeX1 + eyeSize/2, eyeY1 + eyeHeight/2, pupilSize/2, 0, Math.PI * 2);
                snakeCtx.arc(eyeX2 + eyeSize/2, eyeY2 + eyeHeight/2, pupilSize/2, 0, Math.PI * 2);
                snakeCtx.fill();
                
            } else {
                // Corps ou queue du serpent
                const isLast = i === snake.length - 1;
                
                // Segments du corps avec connexion fluide entre eux
                let prevSegment = snake[i-1];
                let nextSegment = i < snake.length - 1 ? snake[i+1] : null;
                
                // Calculer l'orientation du segment
                let orientation;
                if (segment.x === prevSegment.x) {
                    orientation = segment.y < prevSegment.y ? 'up' : 'down';
                } else {
                    orientation = segment.x < prevSegment.x ? 'left' : 'right';
                }
                
                // Dessiner le corps avec un style arrondi adapté à l'orientation
                snakeCtx.roundRect(x, y, size, size, radius);
                snakeCtx.fill();
                
                // Ajouter un léger effet de brillance
                snakeCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                snakeCtx.beginPath();
                snakeCtx.arc(x + size/2, y + size/2, size/4, 0, Math.PI * 2);
                snakeCtx.fill();
            }
        }
    }function gameOver() {
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
    }function gameLoop() {
    if (!snakeGameRunning) return;
    
    updateSnake();
    draw();
    
    // Utiliser la vitesse définie par l'utilisateur
    setTimeout(gameLoop, snakeGameSpeed);
}function closeSnakeGameInternal() {
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

function drawFood() {
    // Mettre à jour l'effet visuel de la nourriture (pulsation)
    snakeFoodEffect += 0.05;
    
    // Calculer la position du fruit sur le canvas
    const x = food.x * gridSize;
    const y = food.y * gridSize;
    
    // Taille de base et effet de pulsation
    const baseSize = gridSize * 0.8;
    const pulseSize = baseSize + Math.sin(snakeFoodEffect) * 3;
    
    // Choisir la couleur en fonction du type de nourriture
    let foodColor, glowColor;
    if (food.type === 'special') {
        // Nourriture spéciale - couleur qui change
        const hue = (Date.now() / 30) % 360;
        foodColor = `hsl(${hue}, 100%, 65%)`;
        glowColor = `hsl(${hue}, 100%, 80%)`;
    } else {
        // Nourriture normale - rouge
        foodColor = '#FF4444';
        glowColor = '#FF8888';
    }
    
    // Dessiner un halo lumineux autour de la nourriture
    const glow = snakeCtx.createRadialGradient(
        x + gridSize/2, y + gridSize/2, 0,
        x + gridSize/2, y + gridSize/2, gridSize
    );
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    snakeCtx.fillStyle = glow;
    snakeCtx.fillRect(x - gridSize/2, y - gridSize/2, gridSize * 2, gridSize * 2);
    
    // Dessiner la nourriture (forme de fruit)
    snakeCtx.fillStyle = foodColor;
    snakeCtx.beginPath();
    snakeCtx.arc(x + gridSize/2, y + gridSize/2, pulseSize/2, 0, Math.PI * 2);
    snakeCtx.fill();
    
    // Reflet sur le fruit
    snakeCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    snakeCtx.beginPath();
    snakeCtx.arc(x + gridSize/2 - pulseSize/5, y + gridSize/2 - pulseSize/5, pulseSize/4, 0, Math.PI * 2);
    snakeCtx.fill();
    
    // Pour les fruits spéciaux, ajouter des particules autour
    if (food.type === 'special') {
        const particleCount = 3;
        const radius = pulseSize/2 + 10;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Date.now() / 300 + i * Math.PI * 2 / particleCount) % (Math.PI * 2);
            const particleX = x + gridSize/2 + Math.cos(angle) * radius;
            const particleY = y + gridSize/2 + Math.sin(angle) * radius;
            const particleSize = 3 + Math.sin(Date.now() / 200 + i) * 2;
            
            snakeCtx.fillStyle = glowColor;
            snakeCtx.beginPath();
            snakeCtx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            snakeCtx.fill();
        }
    }
    
    // Ajouter une tige pour faire ressembler à une pomme
    snakeCtx.fillStyle = '#4CAF50';
    snakeCtx.fillRect(x + gridSize/2 - 2, y + gridSize/2 - pulseSize/2 - 5, 4, 8);
}

function drawBackground() {
    // Dessiner un fond dégradé moderne
    const baseHue = (snakeColorScheme * 60) % 360;
    const gradient = snakeCtx.createLinearGradient(0, 0, snakeCanvas.width, snakeCanvas.height);
    gradient.addColorStop(0, `hsl(${baseHue}, 30%, 15%)`);
    gradient.addColorStop(1, `hsl(${baseHue}, 30%, 25%)`);
    
    snakeCtx.fillStyle = gradient;
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    
    // Dessiner une grille subtile
    snakeCtx.strokeStyle = `hsl(${baseHue}, 30%, 30%)`;
    snakeCtx.lineWidth = 0.5;
    
    // Lignes horizontales
    for (let y = 0; y <= tileCount; y++) {
        snakeCtx.beginPath();
        snakeCtx.moveTo(0, y * gridSize);
        snakeCtx.lineTo(snakeCanvas.width, y * gridSize);
        snakeCtx.stroke();
    }
    
    // Lignes verticales
    for (let x = 0; x <= tileCount; x++) {
        snakeCtx.beginPath();
        snakeCtx.moveTo(x * gridSize, 0);
        snakeCtx.lineTo(x * gridSize, snakeCanvas.height);
        snakeCtx.stroke();
    }
    
    // Ajouter un effet de vignette pour un look moderne
    const vignette = snakeCtx.createRadialGradient(
        snakeCanvas.width/2, snakeCanvas.height/2, snakeCanvas.width/4,
        snakeCanvas.width/2, snakeCanvas.height/2, snakeCanvas.width/1.5
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    
    snakeCtx.fillStyle = vignette;
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
}
