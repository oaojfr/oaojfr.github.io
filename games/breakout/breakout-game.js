// Breakout Game Script
const canvas = document.getElementById('breakoutCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const gameMessage = document.getElementById('gameMessage');
const messageTitle = document.getElementById('messageTitle');
const restartBtn = document.getElementById('restartBtn');

// Game settings
const brickRowCount = 9;
const brickColumnCount = 15;
const brickWidth = 50;
const brickHeight = 20;
const brickPadding = 4;
const brickOffsetTop = 50;
const brickOffsetLeft = 20;

// Game variables
let ball, paddle, bricks, score, lives;
let gameRunning = true;
let mouseX = 0;
let keys = {};

// Game colors
const colors = {
    background: '#0a0a23',
    ball: '#ff6b6b',
    paddle: '#667eea',
    text: '#ffffff',
    lives: '#ff6b6b',
    brickColors: [
        '#ff6b6b', // Rouge
        '#ff9f43', // Orange
        '#f5cd79', // Jaune
        '#78e08f', // Vert
        '#546de5', // Bleu
        '#764ba2'  // Violet
    ]
};

// Audio system
let audio = {
    sounds: {},
    music: null
};

// Précharger les sons
function preloadAudio() {
    try {
        // Créer un contexte audio
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Sons à précharger
        const soundsToLoad = {
            'hit': 'https://bearable-hacker.io/breakout-hit.mp3',
            'brick': 'https://bearable-hacker.io/breakout-brick.mp3',
            'paddle': 'https://bearable-hacker.io/breakout-paddle.mp3',
            'wall': 'https://bearable-hacker.io/breakout-wall.mp3',
            'lose': 'https://bearable-hacker.io/breakout-lose.mp3'
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
    
    ball = {
        x: canvas.width / 2,
        y: canvas.height - 30,
        radius: 8,
        dx: 4,
        dy: -4,
        speed: 4
    };
    
    paddle = {
        width: 120,
        height: 15,
        x: canvas.width / 2 - 60,
        speed: 8
    };
    
    // Créer les briques
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
            const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
            // Assigner une couleur basée sur la ligne
            const colorIndex = Math.floor(r / Math.ceil(brickRowCount / colors.brickColors.length));
            const color = colors.brickColors[colorIndex % colors.brickColors.length];
            // Les briques du bas sont plus difficiles à casser
            const strength = brickRowCount - r;
            
            bricks[c][r] = {
                x: brickX,
                y: brickY,
                status: 1, // 1 = actif, 0 = cassé
                color: color,
                strength: strength
            };
        }
    }
    
    score = 0;
    lives = 3;
    scoreElement.textContent = score;
    
    // Écouteurs d'événements
    canvas.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    
    // Démarrer la boucle de jeu
    gameRunning = true;
    gameLoop();
}

// Gestionnaire de mouvements de souris
function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        mouseX = relativeX;
    }
}

// Gestionnaires de clavier
function keyDownHandler(e) {
    keys[e.key] = true;
}

function keyUpHandler(e) {
    keys[e.key] = false;
}

// Mettre à jour la position de la palette
function updatePaddle() {
    // Contrôle par souris
    if (mouseX > 0) {
        paddle.x = mouseX - paddle.width / 2;
    }
    
    // Contrôle par clavier
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        paddle.x -= paddle.speed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        paddle.x += paddle.speed;
    }
    
    // Limiter la palette aux bords du canvas
    if (paddle.x < 0) {
        paddle.x = 0;
    } else if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

// Détecter les collisions avec les briques
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                if (ball.x > brick.x && ball.x < brick.x + brickWidth &&
                    ball.y > brick.y && ball.y < brick.y + brickHeight) {
                    ball.dy = -ball.dy;
                    brick.status = 0;
                    score += 10 * brick.strength;
                    scoreElement.textContent = score;
                    playSound('brick');
                    
                    // Vérifier si toutes les briques sont cassées
                    if (checkWin()) {
                        messageTitle.textContent = "Félicitations !";
                        finalScoreElement.textContent = score;
                        gameMessage.style.display = 'block';
                        gameRunning = false;
                    }
                }
            }
        }
    }
}

// Vérifier si toutes les briques sont cassées
function checkWin() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                return false;
            }
        }
    }
    return true;
}

// Réinitialiser la balle après la perte d'une vie
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 30;
    ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -ball.speed;
    
    // Replacer la palette au milieu
    paddle.x = canvas.width / 2 - paddle.width / 2;
}

// Mettre à jour l'état du jeu
function update() {
    if (!gameRunning) return;
    
    // Effacer le canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner les briques
    drawBricks();
    
    // Dessiner la balle
    drawBall();
    
    // Dessiner la palette
    drawPaddle();
    
    // Dessiner les vies restantes
    drawLives();
    
    // Mettre à jour la position de la palette
    updatePaddle();
    
    // Détecter les collisions
    collisionDetection();
    
    // Rebonds sur les murs
    if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
        playSound('wall');
    }
    
    // Rebond sur le plafond
    if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
        playSound('wall');
    }
    
    // Rebond sur la palette ou GameOver
    if (ball.y + ball.dy > canvas.height - ball.radius) {
        if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            // Modifier l'angle de rebond en fonction de l'endroit où la balle touche la palette
            const hitPosition = (ball.x - paddle.x) / paddle.width;
            const angle = hitPosition * Math.PI - Math.PI/2; // -90° à +90°
            const power = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            
            ball.dx = Math.cos(angle) * power;
            ball.dy = -Math.abs(Math.sin(angle) * power); // Toujours vers le haut
            
            playSound('paddle');
        } else {
            // Perte d'une vie
            lives--;
            
            if (lives <= 0) {
                messageTitle.textContent = "Game Over !";
                finalScoreElement.textContent = score;
                gameMessage.style.display = 'block';
                gameRunning = false;
                playSound('lose');
            } else {
                resetBall();
            }
        }
    }
    
    // Déplacer la balle
    ball.x += ball.dx;
    ball.y += ball.dy;
}

// Dessiner les briques
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                ctx.fillStyle = bricks[c][r].color;
                ctx.fillRect(bricks[c][r].x, bricks[c][r].y, brickWidth, brickHeight);
                
                // Ajouter un effet de lumière/bordure
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(bricks[c][r].x, bricks[c][r].y, brickWidth, brickHeight);
            }
        }
    }
}

// Dessiner la balle
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = colors.ball;
    ctx.fill();
    ctx.closePath();
    
    // Ajouter un effet de brillance
    ctx.beginPath();
    ctx.arc(ball.x - ball.radius/3, ball.y - ball.radius/3, ball.radius/3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
    ctx.closePath();
}

// Dessiner la palette
function drawPaddle() {
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, colors.paddle);
    gradient.addColorStop(1, '#4959bd');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // Arrondir les coins
    ctx.beginPath();
    ctx.arc(paddle.x + paddle.height/2, paddle.y + paddle.height/2, paddle.height/2, 0.5 * Math.PI, 1.5 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(paddle.x + paddle.width - paddle.height/2, paddle.y + paddle.height/2, paddle.height/2, 1.5 * Math.PI, 0.5 * Math.PI);
    ctx.fill();
    
    // Ajouter un effet de brillance
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(paddle.x + paddle.width * 0.1, paddle.y + 2, paddle.width * 0.8, 2);
}

// Dessiner les vies restantes
function drawLives() {
    ctx.font = '16px Poppins';
    ctx.fillStyle = colors.text;
    ctx.fillText("Vies: ", canvas.width - 120, 30);
    
    for (let i = 0; i < lives; i++) {
        ctx.beginPath();
        ctx.arc(canvas.width - 70 + i * 20, 25, 8, 0, Math.PI * 2);
        ctx.fillStyle = colors.lives;
        ctx.fill();
        ctx.closePath();
    }
}

// Boucle de jeu principale
function gameLoop() {
    if (gameRunning) {
        update();
        requestAnimationFrame(gameLoop);
    }
}

// Redémarrer le jeu
function restartGame() {
    gameMessage.style.display = 'none';
    initGame();
}

// Bouton de redémarrage
restartBtn.addEventListener('click', restartGame);

// Initialiser le jeu au chargement
window.addEventListener('load', initGame);
