// Pong Game Easter Egg
let pongGameRunning = false;
let pongCanvas, pongCtx, pongOverlay;
let pongBall, pongPaddle1, pongPaddle2;
let pongKeys = {};
let pongSpeedMultiplier = 1.0; // Contrôle de vitesse global

// Audio system
let pongAudio = {
    sounds: {},
    music: null
};

// Précharger les sons et la musique pour Pong
function preloadPongAudio() {
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
                    pongAudio.sounds[name] = {
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
function playPongSound(soundName) {
    try {
        if (!pongAudio.sounds[soundName]) return null;
        
        const sound = pongAudio.sounds[soundName];
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
function startPongMusic() {
    if (pongAudio.music) {
        pongAudio.music.stop();
    }
    pongAudio.music = playPongSound('background');
}

function initPongGame() {
    // Easter Egg: Pong Game sequence detection
    let easterEggSequence = [];
    const secretCode = ['p', 'o', 'n', 'g'];
    
    // Précharger les sons
    preloadPongAudio();

    // Listen for secret key sequence
    document.addEventListener('keydown', function(e) {
        if (pongGameRunning) return;
        
        easterEggSequence.push(e.key.toLowerCase());
        
        // Keep only the last 4 keys
        if (easterEggSequence.length > secretCode.length) {
            easterEggSequence.shift();
        }
        
        // Check if sequence matches
        if (easterEggSequence.length === secretCode.length && 
            easterEggSequence.every((key, index) => key === secretCode[index])) {
            startPongGame();
            easterEggSequence = [];
        }
    });
}

function startPongGame() {
    pongOverlay = document.getElementById('pong-overlay');
    pongCanvas = document.getElementById('pong-canvas');
    pongCtx = pongCanvas.getContext('2d');
    const score1 = document.getElementById('score1');
    const score2 = document.getElementById('score2');
    const closeBtn = document.getElementById('pong-close');    pongOverlay.style.display = 'flex';
    pongGameRunning = true;
    
    // Démarrer la musique de fond
    startPongMusic();
    
    // Récupérer la vitesse sauvegardée si disponible
    const savedPongSpeed = localStorage.getItem('pongSpeedMultiplier');
    if (savedPongSpeed) {
        pongSpeedMultiplier = parseFloat(savedPongSpeed);
    }
    
    // Créer les contrôles de vitesse
    const speedControls = document.createElement('div');
    speedControls.style.position = 'absolute';
    speedControls.style.top = '10px';
    speedControls.style.left = '10px';
    speedControls.style.color = 'white';
    speedControls.style.zIndex = '100';
    speedControls.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <label for="pong-speed" style="margin-right: 10px;">Vitesse: </label>
            <input type="range" id="pong-speed" min="0.5" max="2.0" step="0.1" value="${pongSpeedMultiplier}" style="width: 100px;">
            <span id="pong-speed-value" style="margin-left: 5px;">${pongSpeedMultiplier.toFixed(1)}</span>
        </div>
    `;
    pongOverlay.appendChild(speedControls);
    
    // Mettre à jour la vitesse du jeu
    const speedSlider = document.getElementById('pong-speed');
    const speedValue = document.getElementById('pong-speed-value');
    
    speedSlider.addEventListener('input', function() {
        pongSpeedMultiplier = parseFloat(this.value);
        speedValue.textContent = pongSpeedMultiplier.toFixed(1);
        localStorage.setItem('pongSpeedMultiplier', pongSpeedMultiplier);
    });
      
      // Game objects
    pongBall = {
        x: pongCanvas.width / 2,
        y: pongCanvas.height / 2,
        radius: 10,
        velocityX: 5,
        velocityY: 4,
        color: '#667eea'
    };
    
    pongPaddle1 = {
        x: 10,
        y: pongCanvas.height / 2 - 50,
        width: 10,
        height: 100,
        color: '#ff6b6b',
        score: 0
    };
    
    pongPaddle2 = {
        x: pongCanvas.width - 20,
        y: pongCanvas.height / 2 - 50,
        width: 10,
        height: 100,
        color: '#4ecdc4',
        score: 0
    };
    
    // Controls
    function handleKeyDown(e) {
        pongKeys[e.key] = true;
    }
    
    function handleKeyUp(e) {
        pongKeys[e.key] = false;
    }
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);    function updatePaddles() {
        const paddleSpeed = 12 * pongSpeedMultiplier;
        
        // Player 1 (W/S)
        if (pongKeys['w'] || pongKeys['W']) {
            pongPaddle1.y = Math.max(0, pongPaddle1.y - paddleSpeed);
        }
        if (pongKeys['s'] || pongKeys['S']) {
            pongPaddle1.y = Math.min(pongCanvas.height - pongPaddle1.height, pongPaddle1.y + paddleSpeed);
        }
        
        // Player 2 (Arrow keys)
        if (pongKeys['ArrowUp']) {
            pongPaddle2.y = Math.max(0, pongPaddle2.y - paddleSpeed);
        }
        if (pongKeys['ArrowDown']) {
            pongPaddle2.y = Math.min(pongCanvas.height - pongPaddle2.height, pongPaddle2.y + paddleSpeed);
        }
    }      function updateBall() {
        // La vitesse augmente légèrement avec le temps pour plus de difficulté
        const speedIncrement = Math.min(1.5, 1.0 + Math.min(0.5, pongPaddle1.score + pongPaddle2.score) / 10);
        
        pongBall.x += pongBall.velocityX * pongSpeedMultiplier * speedIncrement;
        pongBall.y += pongBall.velocityY * pongSpeedMultiplier * speedIncrement;
          // Top and bottom walls
        if (pongBall.y + pongBall.radius > pongCanvas.height || pongBall.y - pongBall.radius < 0) {
            pongBall.velocityY = -pongBall.velocityY;
            playPongSound('wall'); // Jouer son de rebond sur mur
        }
        
        // Paddle collisions
        if (pongBall.x - pongBall.radius < pongPaddle1.x + pongPaddle1.width &&
            pongBall.y > pongPaddle1.y && pongBall.y < pongPaddle1.y + pongPaddle1.height) {
            pongBall.velocityX = Math.abs(pongBall.velocityX);
            pongBall.velocityY += (Math.random() - 0.5) * 2;
            playPongSound('hit'); // Jouer le son de collision
        }
        
        if (pongBall.x + pongBall.radius > pongPaddle2.x &&
            pongBall.y > pongPaddle2.y && pongBall.y < pongPaddle2.y + pongPaddle2.height) {
            pongBall.velocityX = -Math.abs(pongBall.velocityX);
            pongBall.velocityY += (Math.random() - 0.5) * 2;
            playPongSound('hit'); // Jouer le son de collision
        }
        
        // Scoring
        if (pongBall.x < 0) {
            pongPaddle2.score++;
            playPongSound('score'); // Jouer le son de score
            resetBall();
        }
        if (pongBall.x > pongCanvas.width) {
            pongPaddle1.score++;
            playPongSound('score'); // Jouer le son de score
            resetBall();
        }
        
        // Update score display
        score1.textContent = pongPaddle1.score;
        score2.textContent = pongPaddle2.score;
        
        // Check win condition
        if (pongPaddle1.score >= 5 || pongPaddle2.score >= 5) {
            const winnerNumber = pongPaddle1.score >= 5 ? '1' : '2';
            const winnerDiv = document.getElementById('pong-winner');
            const winnerText = document.getElementById('winner-text');
            
            // Get translations from parent window
            const currentLang = window.currentLanguage || 'fr';
            const translations = window.translations || {};
            
            let winText = `🎉 Joueur ${winnerNumber} gagne!`; // Default French
            
            if (translations[currentLang] && translations[currentLang][`games.pong.winner${winnerNumber}`]) {
                winText = translations[currentLang][`games.pong.winner${winnerNumber}`];
            }
            
            winnerText.textContent = winText;
            winnerDiv.style.display = 'block';
            pongGameRunning = false;
        }
    }    function resetBall() {
        pongBall.x = pongCanvas.width / 2;
        pongBall.y = pongCanvas.height / 2;
        pongBall.velocityX = (Math.random() > 0.5 ? 1 : -1) * 5;
        pongBall.velocityY = (Math.random() - 0.5) * 6;
        // La vitesse sera ajustée par le multiplicateur dans updateBall()
    }
    
    function draw() {
        // Clear canvas
        pongCtx.fillStyle = '#1a1a2e';
        pongCtx.fillRect(0, 0, pongCanvas.width, pongCanvas.height);
        
        // Draw center line
        pongCtx.setLineDash([5, 15]);
        pongCtx.beginPath();
        pongCtx.moveTo(pongCanvas.width / 2, 0);
        pongCtx.lineTo(pongCanvas.width / 2, pongCanvas.height);
        pongCtx.strokeStyle = '#667eea';
        pongCtx.stroke();
        pongCtx.setLineDash([]);
        
        // Draw paddles
        pongCtx.fillStyle = pongPaddle1.color;
        pongCtx.fillRect(pongPaddle1.x, pongPaddle1.y, pongPaddle1.width, pongPaddle1.height);
        
        pongCtx.fillStyle = pongPaddle2.color;
        pongCtx.fillRect(pongPaddle2.x, pongPaddle2.y, pongPaddle2.width, pongPaddle2.height);
        
        // Draw ball
        pongCtx.beginPath();
        pongCtx.arc(pongBall.x, pongBall.y, pongBall.radius, 0, Math.PI * 2);
        pongCtx.fillStyle = pongBall.color;
        pongCtx.fill();
        pongCtx.closePath();
    }
    
    function gameLoop() {
        if (!pongGameRunning) return;
        
        updatePaddles();
        updateBall();
        draw();
        
        requestAnimationFrame(gameLoop);
    }
    
    function closePongGameInternal() {
        pongGameRunning = false;
        pongOverlay.style.display = 'none';
        document.getElementById('pong-winner').style.display = 'none';
        pongPaddle1.score = 0;
        pongPaddle2.score = 0;
        score1.textContent = '0';
        score2.textContent = '0';
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
    }
    
    // Close button event
    closeBtn.onclick = closePongGameInternal;
    
    // ESC key to close
    function handleEscape(e) {
        if (e.key === 'Escape') {
            closePongGameInternal();
            document.removeEventListener('keydown', handleEscape);
        }
    }
    document.addEventListener('keydown', handleEscape);
    
    // Start the game loop
    gameLoop();
}

// Global function for button
function closePongGame() {
    const overlay = document.getElementById('pong-overlay');
    const winnerDiv = document.getElementById('pong-winner');
    
    pongGameRunning = false;
    overlay.style.display = 'none';
    winnerDiv.style.display = 'none';
    
    // Reset scores
    const score1 = document.getElementById('score1');
    const score2 = document.getElementById('score2');
    score1.textContent = '0';
    score2.textContent = '0';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initPongGame);
