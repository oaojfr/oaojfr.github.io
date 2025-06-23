// Snake Game Easter Egg
let snakeGameRunning = false;
let snakeCanvas, snakeCtx, snakeOverlay, snakeScoreElement;
let snake, food, snakeDirection, snakeScore;
let snakeKeys = {};
let gridSize, tileCount;

function initSnakeGame() {
    // Easter Egg: Snake Game sequence detection
    let easterEggSequence = [];
    const secretCode = ['s', 'n', 'a', 'k', 'e'];

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
    
    // Define functions first
    function generateFood() {
        console.log('Generating food - Snake length:', snake.length);
        console.log('Grid size:', tileCount, 'x', tileCount);
        
        // Simple generation - find a free spot
        let validPosition = false;
        let attempts = 0;
        
        while (!validPosition && attempts < 100) {
            food = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
            
            // Check if this position is free
            validPosition = true;
            for (let segment of snake) {
                if (segment.x === food.x && segment.y === food.y) {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
            
            if (attempts % 20 === 0) {
                console.log('Attempt', attempts, 'testing position:', food.x, food.y, 'valid:', validPosition);
            }
        }
        
        // Fallback: if we can't find a position, place it far from snake head
        if (!validPosition) {
            console.log('Could not find valid position, using fallback');
            const head = snake[0];
            food = {
                x: head.x > tileCount/2 ? 5 : tileCount - 5,
                y: head.y > tileCount/2 ? 5 : tileCount - 5
            };
        }
        
        console.log('Final food position:', food.x, food.y);
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
        
        const head = {x: snake[0].x + snakeDirection.x, y: snake[0].y + snakeDirection.y};
        
        // Check wall collision
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            gameOver();
            return;
        }
        
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
            console.log('Food eaten! New score:', snakeScore + 1);
            snakeScore++;
            snakeScoreElement.textContent = snakeScore;
            generateFood();
            // Don't remove tail when eating (snake grows)
        } else {
            snake.pop(); // Remove tail when not eating
        }
    }
    
    function draw() {
        // Clear canvas
        snakeCtx.fillStyle = '#1a1a2e';
        snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
        
        // Draw snake
        snakeCtx.fillStyle = '#4ecdc4';
        for (let segment of snake) {
            snakeCtx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
        }
        
        // Draw food
        if (food && food.x !== undefined && food.y !== undefined) {
            snakeCtx.fillStyle = '#ff6b6b';
            snakeCtx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
            
            // Add a small border to make it more visible
            snakeCtx.strokeStyle = '#ffffff';
            snakeCtx.lineWidth = 1;
            snakeCtx.strokeRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
            
            // Debug log occasionally
            if (Math.random() < 0.01) {
                console.log('Drawing food at:', food.x, food.y, 'Pixel coords:', food.x * gridSize, food.y * gridSize);
            }
        } else {
            console.log('Cannot draw food - invalid food object:', food);
        }
        
        // Draw grid
        snakeCtx.strokeStyle = '#333';
        snakeCtx.lineWidth = 1;
        for (let i = 0; i < tileCount; i++) {
            snakeCtx.beginPath();
            snakeCtx.moveTo(i * gridSize, 0);
            snakeCtx.lineTo(i * gridSize, snakeCanvas.height);
            snakeCtx.stroke();
            
            snakeCtx.beginPath();
            snakeCtx.moveTo(0, i * gridSize);
            snakeCtx.lineTo(snakeCanvas.width, i * gridSize);
            snakeCtx.stroke();
        }
    }
    
    function gameOver() {
        snakeGameRunning = false;
        const gameOverDiv = document.getElementById('snake-game-over');
        const finalScoreSpan = document.getElementById('snake-final-score');
        finalScoreSpan.textContent = snakeScore;
        gameOverDiv.style.display = 'block';
    }
    
    function gameLoop() {
        if (!snakeGameRunning) return;
        
        updateSnake();
        draw();
        
        setTimeout(gameLoop, 250);
    }
    
    function closeSnakeGameInternal() {
        snakeGameRunning = false;
        snakeOverlay.style.display = 'none';
        document.getElementById('snake-game-over').style.display = 'none';
        document.removeEventListener('keydown', handleKeyDown);
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSnakeGame);
