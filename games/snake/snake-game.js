// Snake Game Script
const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');
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
