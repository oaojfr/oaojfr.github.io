// Breakout Game Easter Egg
let breakoutGameRunning = false;
let breakoutCanvas, breakoutCtx, breakoutOverlay;
let breakoutBall, breakoutPaddle, breakoutBricks, breakoutScore;
let breakoutMouseX = 0;
let breakoutSpeedMultiplier = 1.0; // Contrôle de vitesse global

function initBreakoutGame() {
    // Easter Egg: Breakout Game sequence detection
    let easterEggSequence = [];
    const secretCode = ['b', 'r', 'e', 'a', 'k'];

    // Listen for secret key sequence
    document.addEventListener('keydown', function(e) {
        if (breakoutGameRunning) return;
        
        easterEggSequence.push(e.key.toLowerCase());
        
        // Keep only the last 5 keys
        if (easterEggSequence.length > secretCode.length) {
            easterEggSequence.shift();
        }
        
        // Check if sequence matches
        if (easterEggSequence.length === secretCode.length && 
            easterEggSequence.every((key, index) => key === secretCode[index])) {
            startBreakoutGame();
            easterEggSequence = [];
        }
    });
}

function startBreakoutGame() {
    breakoutOverlay = document.getElementById('breakout-overlay');
    breakoutCanvas = document.getElementById('breakout-canvas');
    breakoutCtx = breakoutCanvas.getContext('2d');
    const scoreElement = document.getElementById('breakout-score-value');
    const closeBtn = document.getElementById('breakout-close');
      breakoutOverlay.style.display = 'flex';
    breakoutGameRunning = true;
    
    // Récupérer la vitesse sauvegardée si disponible
    const savedBreakoutSpeed = localStorage.getItem('breakoutSpeedMultiplier');
    if (savedBreakoutSpeed) {
        breakoutSpeedMultiplier = parseFloat(savedBreakoutSpeed);
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
            <label for="breakout-speed" style="margin-right: 10px;">Vitesse: </label>
            <input type="range" id="breakout-speed" min="0.5" max="2.0" step="0.1" value="${breakoutSpeedMultiplier}" style="width: 100px;">
            <span id="breakout-speed-value" style="margin-left: 5px;">${breakoutSpeedMultiplier.toFixed(1)}</span>
        </div>
    `;
    breakoutOverlay.appendChild(speedControls);
    
    // Mettre à jour la vitesse du jeu
    const speedSlider = document.getElementById('breakout-speed');
    const speedValue = document.getElementById('breakout-speed-value');
    
    speedSlider.addEventListener('input', function() {
        breakoutSpeedMultiplier = parseFloat(this.value);
        speedValue.textContent = breakoutSpeedMultiplier.toFixed(1);
        localStorage.setItem('breakoutSpeedMultiplier', breakoutSpeedMultiplier);
    });
      
      // Game objects
    breakoutBall = {
        x: breakoutCanvas.width / 2,
        y: breakoutCanvas.height - 50,
        radius: 8,
        velocityX: 3.5,
        velocityY: -3.5,
        color: '#667eea'
    };
    
    breakoutPaddle = {
        x: breakoutCanvas.width / 2 - 50,
        y: breakoutCanvas.height - 20,
        width: 100,
        height: 10,
        color: '#4ecdc4'
    };
    
    // Create bricks
    const rows = 6;
    const cols = 10;
    const brickWidth = 70;
    const brickHeight = 20;
    const brickPadding = 5;
    const brickOffsetTop = 50;
    const brickOffsetLeft = 35;
    
    breakoutBricks = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    
    for (let r = 0; r < rows; r++) {
        breakoutBricks[r] = [];
        for (let c = 0; c < cols; c++) {
            breakoutBricks[r][c] = {
                x: c * (brickWidth + brickPadding) + brickOffsetLeft,
                y: r * (brickHeight + brickPadding) + brickOffsetTop,
                width: brickWidth,
                height: brickHeight,
                color: colors[r],
                status: 1
            };
        }
    }
    
    breakoutScore = 0;
    scoreElement.textContent = breakoutScore;
    
    // Controls
    const breakoutKeys = {};
    
    function handleKeyDown(e) {
        if (!breakoutGameRunning) return;
        breakoutKeys[e.key] = true;
    }
    
    function handleKeyUp(e) {
        breakoutKeys[e.key] = false;
    }
    
    // Mouse controls
    function handleMouseMove(e) {
        const rect = breakoutCanvas.getBoundingClientRect();
        breakoutMouseX = e.clientX - rect.left;
        
        // Update paddle position
        breakoutPaddle.x = breakoutMouseX - breakoutPaddle.width / 2;
        
        // Keep paddle within canvas
        if (breakoutPaddle.x < 0) {
            breakoutPaddle.x = 0;
        }
        if (breakoutPaddle.x + breakoutPaddle.width > breakoutCanvas.width) {
            breakoutPaddle.x = breakoutCanvas.width - breakoutPaddle.width;
        }
    }      function updatePaddle() {
        const paddleSpeed = 12 * breakoutSpeedMultiplier;
        
        // Keyboard controls
        if (breakoutKeys['ArrowLeft'] || breakoutKeys['a'] || breakoutKeys['A']) {
            breakoutPaddle.x -= paddleSpeed;
        }
        if (breakoutKeys['ArrowRight'] || breakoutKeys['d'] || breakoutKeys['D']) {
            breakoutPaddle.x += paddleSpeed;
        }
        
        // Keep paddle within canvas
        if (breakoutPaddle.x < 0) {
            breakoutPaddle.x = 0;
        }
        if (breakoutPaddle.x + breakoutPaddle.width > breakoutCanvas.width) {
            breakoutPaddle.x = breakoutCanvas.width - breakoutPaddle.width;
        }
    }
    
    breakoutCanvas.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
      function updateBall() {
        breakoutBall.x += breakoutBall.velocityX * breakoutSpeedMultiplier;
        breakoutBall.y += breakoutBall.velocityY * breakoutSpeedMultiplier;
        
        // Wall collisions
        if (breakoutBall.x + breakoutBall.radius > breakoutCanvas.width || breakoutBall.x - breakoutBall.radius < 0) {
            breakoutBall.velocityX = -breakoutBall.velocityX;
        }
        if (breakoutBall.y - breakoutBall.radius < 0) {
            breakoutBall.velocityY = -breakoutBall.velocityY;
        }
        
        // Paddle collision
        if (breakoutBall.y + breakoutBall.radius > breakoutPaddle.y &&
            breakoutBall.x > breakoutPaddle.x &&
            breakoutBall.x < breakoutPaddle.x + breakoutPaddle.width) {
              // Calculate hit position on paddle (-1 to 1)
            const hitPos = (breakoutBall.x - (breakoutPaddle.x + breakoutPaddle.width / 2)) / (breakoutPaddle.width / 2);
              // Adjust ball direction based on hit position
            breakoutBall.velocityX = hitPos * 4;
            breakoutBall.velocityY = -Math.abs(breakoutBall.velocityY);
            // La vitesse sera ajustée par le multiplicateur dans la prochaine frame
        }
        
        // Bottom wall (game over)
        if (breakoutBall.y + breakoutBall.radius > breakoutCanvas.height) {
            gameOver();
            return;
        }
        
        // Brick collisions
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const brick = breakoutBricks[r][c];
                if (brick.status === 1) {
                    if (breakoutBall.x > brick.x &&
                        breakoutBall.x < brick.x + brick.width &&
                        breakoutBall.y > brick.y &&
                        breakoutBall.y < brick.y + brick.height) {
                        
                        breakoutBall.velocityY = -breakoutBall.velocityY;
                        brick.status = 0;
                        breakoutScore += 10;
                        scoreElement.textContent = breakoutScore;
                        
                        // Check win condition
                        if (checkWin()) {
                            gameWin();
                            return;
                        }
                    }
                }
            }
        }
    }
    
    function checkWin() {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (breakoutBricks[r][c].status === 1) {
                    return false;
                }
            }
        }
        return true;
    }
    
    function draw() {
        // Clear canvas
        breakoutCtx.fillStyle = '#1a1a2e';
        breakoutCtx.fillRect(0, 0, breakoutCanvas.width, breakoutCanvas.height);
        
        // Draw bricks
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const brick = breakoutBricks[r][c];
                if (brick.status === 1) {
                    breakoutCtx.fillStyle = brick.color;
                    breakoutCtx.fillRect(brick.x, brick.y, brick.width, brick.height);
                    
                    // Add border
                    breakoutCtx.strokeStyle = '#fff';
                    breakoutCtx.lineWidth = 1;
                    breakoutCtx.strokeRect(brick.x, brick.y, brick.width, brick.height);
                }
            }
        }
        
        // Draw ball
        breakoutCtx.beginPath();
        breakoutCtx.arc(breakoutBall.x, breakoutBall.y, breakoutBall.radius, 0, Math.PI * 2);
        breakoutCtx.fillStyle = breakoutBall.color;
        breakoutCtx.fill();
        breakoutCtx.closePath();
        
        // Draw paddle
        breakoutCtx.fillStyle = breakoutPaddle.color;
        breakoutCtx.fillRect(breakoutPaddle.x, breakoutPaddle.y, breakoutPaddle.width, breakoutPaddle.height);
    }
    
    function gameOver() {
        breakoutGameRunning = false;
        const gameOverDiv = document.getElementById('breakout-game-over');
        const finalScoreSpan = document.getElementById('breakout-final-score');
        finalScoreSpan.textContent = breakoutScore;
        gameOverDiv.style.display = 'block';
    }
    
    function gameWin() {
        breakoutGameRunning = false;
        const gameOverDiv = document.getElementById('breakout-game-over');
        const finalScoreSpan = document.getElementById('breakout-final-score');
        const gameOverText = gameOverDiv.querySelector('div:first-child');
        gameOverText.textContent = 'Victoire! 🎉';
        finalScoreSpan.textContent = breakoutScore;
        gameOverDiv.style.display = 'block';
    }
    
    function gameLoop() {
        if (!breakoutGameRunning) return;
        
        updatePaddle();
        updateBall();
        draw();
        
        requestAnimationFrame(gameLoop);
    }
    
    function closeBreakoutGameInternal() {
        breakoutGameRunning = false;
        breakoutOverlay.style.display = 'none';
        document.getElementById('breakout-game-over').style.display = 'none';
        breakoutCanvas.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
    }
    
    // Close button event
    closeBtn.onclick = closeBreakoutGameInternal;
    
    // ESC key to close
    function handleEscape(e) {
        if (e.key === 'Escape') {
            closeBreakoutGameInternal();
            document.removeEventListener('keydown', handleEscape);
        }
    }
    document.addEventListener('keydown', handleEscape);
    
    // Start the game loop
    gameLoop();
}

// Global functions for buttons
function restartBreakoutGame() {
    document.getElementById('breakout-game-over').style.display = 'none';
    // Reset game over text
    const gameOverText = document.getElementById('breakout-game-over').querySelector('div:first-child');
    gameOverText.textContent = 'Game Over!';
    startBreakoutGame();
}

function closeBreakoutGame() {
    const overlay = document.getElementById('breakout-overlay');
    const gameOverDiv = document.getElementById('breakout-game-over');
    
    breakoutGameRunning = false;
    overlay.style.display = 'none';
    gameOverDiv.style.display = 'none';
    
    // Reset score
    document.getElementById('breakout-score-value').textContent = '0';
    
    // Reset game over text
    const gameOverText = gameOverDiv.querySelector('div:first-child');
    gameOverText.textContent = 'Game Over!';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initBreakoutGame);
