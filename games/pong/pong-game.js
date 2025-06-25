// Pong Game Main Script
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');
const gameMessage = document.getElementById('gameMessage');
const winnerMessage = document.getElementById('winnerMessage');
const newGameBtn = document.getElementById('newGameBtn');

// Game objects
let gameRunning = true;
let ball, paddle1, paddle2;
let keys = {};
let speedMultiplier = 1.0;

// Audio system
let audio = {
    sounds: {},
    music: null
};

// Précharger les sons et la musique pour Pong
function preloadAudio() {
    try {
        // Créer un contexte audio
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Sons à précharger
        const soundsToLoad = {
            'hit': 'https://bearable-hacker.io/pong-hit.mp3',
            'score': 'https://bearable-hacker.io/pong-score.mp3',
            'wall': 'https://bearable-hacker.io/pong-wall.mp3',
            'background': 'https://bearable-hacker.io/pong-background.mp3'
        };
        
        // Charger chaque son
        Object.entries(soundsToLoad).forEach(([name, url]) => {
            fetch(url)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    audio.sounds[name] = {
                        buffer: audioBuffer,
                        context: audioContext,
                        loop: name === 'background'
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
        if (!audio.sounds[soundName]) return null;
        
        const sound = audio.sounds[soundName];
        const source = sound.context.createBufferSource();
        source.buffer = sound.buffer;
        source.connect(sound.context.destination);
        source.loop = sound.loop;
        source.start(0);
        
        return source;
    } catch (e) {
        console.log('Erreur de lecture audio:', e);
        return null;
    }
}

// Démarrer la musique de fond
function startMusic() {
    if (audio.music) {
        audio.music.stop();
    }
    audio.music = playSound('background');
}

function initGame() {
    // Précharger les sons
    preloadAudio();
    
    // Initialize game objects
    ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        velocityX: 5,
        velocityY: 4,
        color: '#667eea'
    };
    
    paddle1 = {
        x: 10,
        y: canvas.height / 2 - 50,
        width: 10,
        height: 100,
        color: '#ff6b6b',
        score: 0
    };
    
    paddle2 = {
        x: canvas.width - 20,
        y: canvas.height / 2 - 50,
        width: 10,
        height: 100,
        color: '#4ecdc4',
        score: 0
    };
    
    // Update score display
    player1ScoreElement.textContent = paddle1.score;
    player2ScoreElement.textContent = paddle2.score;
    
    // Start game loop
    gameLoop();
}

// Controls
function handleKeyDown(e) {
    keys[e.key] = true;
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

function updatePaddles() {
    const paddleSpeed = 12 * speedMultiplier;
    
    // Player 1 (W/S)
    if (keys['w'] || keys['W']) {
        paddle1.y = Math.max(0, paddle1.y - paddleSpeed);
    }
    if (keys['s'] || keys['S']) {
        paddle1.y = Math.min(canvas.height - paddle1.height, paddle1.y + paddleSpeed);
    }
    
    // Player 2 (Arrow keys)
    if (keys['ArrowUp']) {
        paddle2.y = Math.max(0, paddle2.y - paddleSpeed);
    }
    if (keys['ArrowDown']) {
        paddle2.y = Math.min(canvas.height - paddle2.height, paddle2.y + paddleSpeed);
    }
}

function updateBall() {
    // La vitesse augmente légèrement avec le temps pour plus de difficulté
    const speedIncrement = Math.min(1.5, 1.0 + Math.min(0.5, paddle1.score + paddle2.score) / 10);
    
    ball.x += ball.velocityX * speedMultiplier * speedIncrement;
    ball.y += ball.velocityY * speedMultiplier * speedIncrement;
      
    // Top and bottom walls
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.velocityY = -ball.velocityY;
        playSound('wall'); // Jouer son de rebond sur mur
    }
    
    // Paddle collisions
    if (ball.x - ball.radius < paddle1.x + paddle1.width &&
        ball.y > paddle1.y && ball.y < paddle1.y + paddle1.height) {
        ball.velocityX = Math.abs(ball.velocityX);
        ball.velocityY += (Math.random() - 0.5) * 2;
        playSound('hit'); // Jouer le son de collision
    }
    
    if (ball.x + ball.radius > paddle2.x &&
        ball.y > paddle2.y && ball.y < paddle2.y + paddle2.height) {
        ball.velocityX = -Math.abs(ball.velocityX);
        ball.velocityY += (Math.random() - 0.5) * 2;
        playSound('hit'); // Jouer le son de collision
    }
    
    // Scoring
    if (ball.x < 0) {
        paddle2.score++;
        playSound('score'); // Jouer le son de score
        resetBall();
    }
    if (ball.x > canvas.width) {
        paddle1.score++;
        playSound('score'); // Jouer le son de score
        resetBall();
    }
    
    // Update score display
    player1ScoreElement.textContent = paddle1.score;
    player2ScoreElement.textContent = paddle2.score;
    
    // Check win condition
    if (paddle1.score >= 5 || paddle2.score >= 5) {
        const winnerNumber = paddle1.score >= 5 ? '1' : '2';
        winnerMessage.textContent = `🎉 Joueur ${winnerNumber} gagne !`;
        gameMessage.style.display = 'block';
        gameRunning = false;
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.velocityX = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.velocityY = (Math.random() - 0.5) * 6;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#667eea';
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles
    ctx.fillStyle = paddle1.color;
    ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
    
    ctx.fillStyle = paddle2.color;
    ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);
    
    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

function gameLoop() {
    if (!gameRunning) return;
    
    updatePaddles();
    updateBall();
    draw();
    
    requestAnimationFrame(gameLoop);
}

function startNewGame() {
    gameMessage.style.display = 'none';
    paddle1.score = 0;
    paddle2.score = 0;
    player1ScoreElement.textContent = '0';
    player2ScoreElement.textContent = '0';
    resetBall();
    gameRunning = true;
    gameLoop();
}

// New game button event
newGameBtn.addEventListener('click', startNewGame);

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', initGame);
