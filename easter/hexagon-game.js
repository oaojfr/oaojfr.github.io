// Super Hexagon Easter Egg Game
let hexagonGameRunning = false;
let hexagonOverlay, hexagonCanvas, hexagonCtx;
let hexagonScore = 0;
let hexagonHighScore = 0;
let hexagonDifficultyLevel = 1;
let hexagonGameStartTime;
let hexagonAnimationFrame;
let hexagonLastTime = 0;
let hexagonRotationSpeed = 0.02;
let hexagonPlayer;
let hexagonWalls = [];
let hexagonColors;
let hexagonColorScheme = 0;
let hexagonAudio = {};
let hexagonPulse = 0;
let hexagonPulseDirection = 1;
let hexagonGameOver = false;

// Configuration
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
    colorSchemeTitles: ['Inferno', 'Cosmos', 'Verdant'],
    musicTracks: [
        'https://bearable-hacker.io/hex-blue.mp3',
        'https://bearable-hacker.io/hex-red.mp3',
        'https://bearable-hacker.io/hex-green.mp3'
    ]
};

function initHexagonGame() {
    // Easter Egg: Hexagon Game sequence detection
    let easterEggSequence = [];
    const secretCode = ['h', 'e', 'x', 'a', 'g', 'o', 'n'];

    // Listen for secret key sequence
    document.addEventListener('keydown', function(e) {
        if (hexagonGameRunning) return;
        
        easterEggSequence.push(e.key.toLowerCase());
        
        // Keep only the last 7 keys
        if (easterEggSequence.length > secretCode.length) {
            easterEggSequence.shift();
        }
        
        // Check if sequence matches
        if (easterEggSequence.length === secretCode.length && 
            easterEggSequence.every((key, index) => key === secretCode[index])) {
            startHexagonGame();
            easterEggSequence = [];
        }
    });
    
    // Pré-charger les ressources audio pour éviter un délai au premier lancement
    preloadAudio();
}

function preloadAudio() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Charger les sons d'effet
    const effectsToLoad = {
        'gameStart': 'https://dl.dropboxusercontent.com/s/97uxf2r5zcql9lh/game-start.mp3',
        'gameOver': 'https://dl.dropboxusercontent.com/s/i9f612y4ci30pzi/game-over.mp3',
        'wallPass': 'https://dl.dropboxusercontent.com/s/r2mgz1ryjc6m6ah/wall-pass.mp3',
        'levelUp': 'https://dl.dropboxusercontent.com/s/p7yheqwkfgw3hw2/level-up.mp3'
    };
    
    // Précharger les effets sonores
    for (const [key, url] of Object.entries(effectsToLoad)) {
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = function() {
            audioContext.decodeAudioData(request.response, function(buffer) {
                hexagonAudio[key] = {
                    buffer: buffer,
                    context: audioContext
                };
            });
        };
        request.send();
    }
    
    // Précharger la musique de fond
    HEX_CONFIG.musicTracks.forEach((track, index) => {
        const request = new XMLHttpRequest();
        request.open('GET', track, true);
        request.responseType = 'arraybuffer';
        request.onload = function() {
            audioContext.decodeAudioData(request.response, function(buffer) {
                hexagonAudio['track' + (index + 1)] = {
                    buffer: buffer,
                    context: audioContext
                };
            });
        };
        request.send();
    });
}

function playHexagonSound(soundName, loop = false) {
    if (!hexagonAudio[soundName]) return null;
    
    const sound = hexagonAudio[soundName];
    const source = sound.context.createBufferSource();
    source.buffer = sound.buffer;
    source.connect(sound.context.destination);
    source.loop = loop;
    source.start(0);
    return source;
}

function startHexagonGame() {
    // Récupérer le high score du localStorage
    const savedHighScore = localStorage.getItem('hexagonHighScore');
    if (savedHighScore) {
        hexagonHighScore = parseInt(savedHighScore);
    }
    
    // Créer l'interface du jeu
    createHexagonGameInterface();
    
    hexagonGameRunning = true;
    hexagonGameOver = false;
    hexagonScore = 0;
    hexagonDifficultyLevel = 1;
    hexagonWalls = [];
    
    // Choisir un schéma de couleur aléatoire
    hexagonColorScheme = Math.floor(Math.random() * HEX_CONFIG.colorSchemes.length);
    hexagonColors = HEX_CONFIG.colorSchemes[hexagonColorScheme];
    
    updateHexagonUI();
    
    // Initialiser le joueur
    hexagonPlayer = {
        angle: 0,
        radius: HEX_CONFIG.baseRadius
    };
    
    hexagonGameStartTime = Date.now();
    hexagonLastTime = hexagonGameStartTime;
    
    // Jouer le son de démarrage
    playHexagonSound('gameStart');
    
    // Jouer la musique de fond correspondant au schéma de couleur
    const musicTrack = playHexagonSound('track' + (hexagonColorScheme + 1), true);
    hexagonAudio.currentMusic = musicTrack;
    
    // Démarrer la boucle de jeu
    hexagonAnimationFrame = requestAnimationFrame(updateHexagonGame);
}

function createHexagonGameInterface() {
    // Créer l'overlay principal
    hexagonOverlay = document.createElement('div');
    hexagonOverlay.id = 'hexagon-overlay';
    hexagonOverlay.style.position = 'fixed';
    hexagonOverlay.style.top = '0';
    hexagonOverlay.style.left = '0';
    hexagonOverlay.style.width = '100%';
    hexagonOverlay.style.height = '100%';
    hexagonOverlay.style.backgroundColor = '#000';
    hexagonOverlay.style.zIndex = '9999';
    hexagonOverlay.style.display = 'flex';
    hexagonOverlay.style.flexDirection = 'column';
    hexagonOverlay.style.justifyContent = 'center';
    hexagonOverlay.style.alignItems = 'center';
    hexagonOverlay.style.overflow = 'hidden';
    hexagonOverlay.style.fontFamily = "'Poppins', sans-serif";
    
    // Créer le canvas pour le jeu
    hexagonCanvas = document.createElement('canvas');
    hexagonCanvas.id = 'hexagon-canvas';
    hexagonCanvas.width = window.innerWidth;
    hexagonCanvas.height = window.innerHeight;
    hexagonCanvas.style.display = 'block';
    
    // Créer l'interface UI
    const hexagonUI = document.createElement('div');
    hexagonUI.id = 'hexagon-ui';
    hexagonUI.style.position = 'absolute';
    hexagonUI.style.top = '20px';
    hexagonUI.style.left = '0';
    hexagonUI.style.width = '100%';
    hexagonUI.style.padding = '0 20px';
    hexagonUI.style.boxSizing = 'border-box';
    hexagonUI.style.color = '#fff';
    hexagonUI.style.textShadow = '0 0 5px rgba(0,0,0,0.7)';
    hexagonUI.style.display = 'flex';
    hexagonUI.style.justifyContent = 'space-between';
    hexagonUI.style.zIndex = '10';
    
    hexagonUI.innerHTML = `
        <div>
            <div>NIVEAU: <span id="hexagon-level">1</span></div>
            <div>THÈME: <span id="hexagon-theme">${HEX_CONFIG.colorSchemeTitles[hexagonColorScheme]}</span></div>
        </div>
        <div>
            <div>SCORE: <span id="hexagon-score">0</span></div>
            <div>MEILLEUR: <span id="hexagon-high-score">${hexagonHighScore}</span></div>
        </div>
    `;
    
    // Créer l'écran de fin de jeu (initialement caché)
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'hexagon-game-over';
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
        <div style="font-size: 1.5rem; margin-bottom: 10px;">Score: <span id="hexagon-final-score">0</span></div>
        <div style="font-size: 1.2rem; margin-bottom: 30px;">Meilleur score: <span id="hexagon-final-high-score">0</span></div>
        <div style="display: flex; gap: 20px;">
            <button id="hexagon-retry" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Réessayer</button>
            <button id="hexagon-close-button" style="padding: 10px 20px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer;">Fermer</button>
        </div>
    `;
    
    // Ajouter les événements aux boutons
    hexagonOverlay.appendChild(hexagonCanvas);
    hexagonOverlay.appendChild(hexagonUI);
    hexagonOverlay.appendChild(gameOverScreen);
    
    document.body.appendChild(hexagonOverlay);
    
    // Récupérer le contexte du canvas
    hexagonCtx = hexagonCanvas.getContext('2d');
    
    // Ajouter les événements aux boutons et touches
    document.getElementById('hexagon-retry').addEventListener('click', restartHexagonGame);
    document.getElementById('hexagon-close-button').addEventListener('click', closeHexagonGame);
    
    // Touche ESC pour fermer
    document.addEventListener('keydown', handleHexagonKeyDown);
    
    // Redimensionnement de la fenêtre
    window.addEventListener('resize', handleHexagonResize);
}

function handleHexagonKeyDown(e) {
    if (!hexagonGameRunning) return;
    
    if (e.key === 'Escape') {
        closeHexagonGame();
        return;
    }
    
    // Contrôles de rotation du joueur
    if (!hexagonGameOver) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            hexagonPlayer.angle -= HEX_CONFIG.playerRotationSpeed;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            hexagonPlayer.angle += HEX_CONFIG.playerRotationSpeed;
        }
    }
}

function handleHexagonResize() {
    if (!hexagonCanvas) return;
    
    hexagonCanvas.width = window.innerWidth;
    hexagonCanvas.height = window.innerHeight;
}

function updateHexagonUI() {
    document.getElementById('hexagon-level').textContent = hexagonDifficultyLevel;
    document.getElementById('hexagon-score').textContent = hexagonScore;
    document.getElementById('hexagon-high-score').textContent = hexagonHighScore;
    document.getElementById('hexagon-theme').textContent = HEX_CONFIG.colorSchemeTitles[hexagonColorScheme];
}

function updateHexagonGame(timestamp) {
    if (!hexagonGameRunning) return;
    
    // Si c'est game over, ne pas continuer la mise à jour mais réinitialiser le jeu après un délai
    if (hexagonGameOver) {
        // Attendre 2 secondes puis réinitialiser automatiquement
        setTimeout(() => {
            hexagonGameOver = false;
            restartHexagonGame();
        }, 2000);
        return;
    }
    
    const now = Date.now();
    const deltaTime = now - hexagonLastTime;
    hexagonLastTime = now;
    
    // Effacer le canvas
    hexagonCtx.fillStyle = '#000';
    hexagonCtx.fillRect(0, 0, hexagonCanvas.width, hexagonCanvas.height);
    
    // Point central du canvas
    const centerX = hexagonCanvas.width / 2;
    const centerY = hexagonCanvas.height / 2;
    
    // Mettre à jour le pouls (effet de respiration)
    hexagonPulse += 0.03 * hexagonPulseDirection;
    if (hexagonPulse > 1) {
        hexagonPulse = 1;
        hexagonPulseDirection = -1;
    } else if (hexagonPulse < 0) {
        hexagonPulse = 0;
        hexagonPulseDirection = 1;
    }
    
    // Augmenter la difficulté progressivement
    const timePlayed = (now - hexagonGameStartTime) / 1000; // en secondes
    const newLevel = Math.floor(timePlayed / 20) + 1; // Nouveau niveau toutes les 20 secondes
    
    if (newLevel > hexagonDifficultyLevel) {
        hexagonDifficultyLevel = newLevel;
        hexagonRotationSpeed += 0.005; // Augmenter la rotation à chaque niveau
        // Jouer le son de passage de niveau
        playHexagonSound('levelUp');
        updateHexagonUI();
    }
    
    // Rotation de toute la scène
    hexagonCtx.save();
    hexagonCtx.translate(centerX, centerY);
    hexagonCtx.rotate(hexagonRotationSpeed * now / 100);
    
    // Dessiner les murs hexagonaux
    drawHexagonWalls(centerX, centerY);
    
    // Dessiner le centre (zone de jeu)
    drawHexagonCenter(centerX, centerY);
    
    // Restaurer le contexte (fin de la rotation globale)
    hexagonCtx.restore();
    
    // Dessiner le joueur (non affecté par la rotation globale)
    drawHexagonPlayer(centerX, centerY);
    
    // Mettre à jour le score
    if (!hexagonGameOver) {
        hexagonScore = Math.floor((now - hexagonGameStartTime) / 100);
        if (hexagonScore > hexagonHighScore) {
            hexagonHighScore = hexagonScore;
            localStorage.setItem('hexagonHighScore', hexagonHighScore.toString());
        }
        updateHexagonUI();
    }
    
    // Gérer la collision avec les murs
    if (checkHexagonCollision()) {
        hexagonGameOver = true;
        if (hexagonAudio.currentMusic) {
            hexagonAudio.currentMusic.stop();
        }
        playHexagonSound('gameOver');
        showHexagonGameOver();
    } else {
        // Continuer la boucle de jeu
        hexagonAnimationFrame = requestAnimationFrame(updateHexagonGame);
    }
}

function drawHexagonCenter(centerX, centerY) {
    const baseColor = hexagonColors[0];
    const pulseFactor = 0.8 + hexagonPulse * 0.2;
    
    // Dessiner le centre hexagonal avec des effets de pulsation
    hexagonCtx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i;
        const radius = HEX_CONFIG.baseRadius * pulseFactor;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (i === 0) {
            hexagonCtx.moveTo(x, y);
        } else {
            hexagonCtx.lineTo(x, y);
        }
    }
    hexagonCtx.closePath();
    
    // Créer un dégradé pour l'effet de profondeur
    const gradient = hexagonCtx.createRadialGradient(0, 0, 10, 0, 0, HEX_CONFIG.baseRadius);
    gradient.addColorStop(0, hexagonColors[1]);
    gradient.addColorStop(1, baseColor);
    
    hexagonCtx.fillStyle = gradient;
    hexagonCtx.fill();
    
    hexagonCtx.strokeStyle = '#fff';
    hexagonCtx.lineWidth = 2;
    hexagonCtx.stroke();
}

function drawHexagonPlayer(centerX, centerY) {
    hexagonCtx.save();
    hexagonCtx.translate(centerX, centerY);
    
    // Position du joueur
    const playerRadius = HEX_CONFIG.baseRadius;
    const playerX = Math.cos(hexagonPlayer.angle) * playerRadius;
    const playerY = Math.sin(hexagonPlayer.angle) * playerRadius;
    
    // Dessiner le joueur (un triangle pointant vers l'extérieur)
    hexagonCtx.beginPath();
    
    const angle = hexagonPlayer.angle;
    const size = HEX_CONFIG.playerSize;
    
    hexagonCtx.moveTo(
        playerX + Math.cos(angle) * size,
        playerY + Math.sin(angle) * size
    );
    hexagonCtx.lineTo(
        playerX + Math.cos(angle + 2.3) * size,
        playerY + Math.sin(angle + 2.3) * size
    );
    hexagonCtx.lineTo(
        playerX + Math.cos(angle - 2.3) * size,
        playerY + Math.sin(angle - 2.3) * size
    );
    
    hexagonCtx.closePath();
    
    hexagonCtx.fillStyle = '#fff';
    hexagonCtx.fill();
    
    hexagonCtx.restore();
}

function drawHexagonWalls(centerX, centerY) {
    // Générer des nouveaux murs périodiquement
    const now = Date.now();
    
    if (hexagonWalls.length < HEX_CONFIG.maxWallsOnScreen && 
        (hexagonWalls.length === 0 || 
         now - hexagonWalls[hexagonWalls.length-1].createdAt > HEX_CONFIG.wallSpawnRate / hexagonDifficultyLevel)) {
        
        // Créer un nouveau mur hexagonal
        const sections = 6; // Hexagone
        const gapSection = Math.floor(Math.random() * sections); // Section avec un trou
        const wallThickness = 15 + Math.random() * 10;
        
        hexagonWalls.push({
            distance: HEX_CONFIG.baseRadius * 5, // Distance initiale (hors écran)
            thickness: wallThickness,
            sections: sections,
            gapSection: gapSection,
            color: hexagonColors[Math.floor(Math.random() * hexagonColors.length)],
            createdAt: now,
            passed: false
        });
    }
    
    // Mettre à jour et dessiner tous les murs
    for (let i = hexagonWalls.length - 1; i >= 0; i--) {
        const wall = hexagonWalls[i];
        
        // Rapprocher le mur du centre
        wall.distance -= HEX_CONFIG.wallSpeed * hexagonDifficultyLevel;
        
        // Si le mur est passé le joueur et n'a pas encore été compté
        if (!wall.passed && wall.distance < HEX_CONFIG.baseRadius) {
            wall.passed = true;
            playHexagonSound('wallPass');
        }
        
        // Supprimer les murs qui ont quitté l'écran
        if (wall.distance + wall.thickness < 0) {
            hexagonWalls.splice(i, 1);
            continue;
        }
        
        // Dessiner le mur
        drawHexagonWall(wall);
    }
}

function drawHexagonWall(wall) {
    const sections = wall.sections;
    // Assurons-nous qu'il y a toujours au moins un trou
    const gapSection = wall.gapSection;
    // Ajoutons une deuxième ouverture pour les niveaux avancés
    const secondGapSection = (gapSection + 3) % sections; // À l'opposé pour équilibrer
    
    hexagonCtx.strokeStyle = wall.color;
    hexagonCtx.lineWidth = wall.thickness;
    
    // Dessiner chaque section du mur hexagonal séparément, sauf celle du trou
    for (let i = 0; i < sections; i++) {
        // Sauter la section du trou principal et le second trou si niveau > 3
        if (i === gapSection || (hexagonDifficultyLevel > 3 && i === secondGapSection)) continue;
        
        const startAngle = (Math.PI * 2 / sections) * i;
        const endAngle = (Math.PI * 2 / sections) * (i + 1);
        
        hexagonCtx.beginPath(); // Important: commencer un nouveau chemin pour chaque section
        hexagonCtx.arc(0, 0, wall.distance, startAngle, endAngle);
        hexagonCtx.stroke(); // Dessiner chaque section séparément
    }
}

function checkHexagonCollision() {
    const playerRadius = HEX_CONFIG.baseRadius;
    const playerAngle = hexagonPlayer.angle;
    
    // Vérifier la collision avec chaque mur
    for (const wall of hexagonWalls) {
        // Vérifier uniquement les murs proches du joueur avec une marge de tolérance
        const collisionDistance = Math.abs(wall.distance - playerRadius);
        if (collisionDistance < wall.thickness / 2.5) { // Marge de tolérance plus grande (diviseur 2.5 au lieu de 2)
            // Normaliser l'angle du joueur entre 0 et 2π
            const normalizedAngle = ((playerAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            
            // Calculer dans quelle section se trouve le joueur
            const sectionAngle = Math.PI * 2 / wall.sections;
            let playerSection = Math.floor(normalizedAngle / sectionAngle);
            
            // Vérifier si le joueur est dans le trou principal ou secondaire (niveaux avancés)
            const isInMainGap = playerSection === wall.gapSection;
            const secondGapSection = (wall.gapSection + 3) % wall.sections;
            const isInSecondGap = hexagonDifficultyLevel > 3 && playerSection === secondGapSection;
            
            if (!isInMainGap && !isInSecondGap) {
                // Ajouter une tolérance aux bordures du trou pour rendre le jeu plus indulgent
                const mainGapCenter = (wall.gapSection + 0.5) * sectionAngle;
                const distToMainGap = Math.min(
                    Math.abs(normalizedAngle - mainGapCenter),
                    Math.abs(normalizedAngle - mainGapCenter + Math.PI * 2),
                    Math.abs(normalizedAngle - mainGapCenter - Math.PI * 2)
                );
                
                // Si on est en niveau avancé, vérifier aussi la distance avec le second trou
                let distToSecondGap = Infinity;
                if (hexagonDifficultyLevel > 3) {
                    const secondGapCenter = (secondGapSection + 0.5) * sectionAngle;
                    distToSecondGap = Math.min(
                        Math.abs(normalizedAngle - secondGapCenter),
                        Math.abs(normalizedAngle - secondGapCenter + Math.PI * 2),
                        Math.abs(normalizedAngle - secondGapCenter - Math.PI * 2)
                    );
                }
                
                // Augmenter la tolérance pour rendre le jeu plus indulgent
                const tolerance = sectionAngle * 0.2; // 20% au lieu de 10%
                const minDist = Math.min(distToMainGap, distToSecondGap);
                
                if (minDist > sectionAngle / 2 + tolerance) {
                    // Le joueur est réellement en collision, pas de faux positif
                    return true;
                }
            }
        }
    }
    
    return false;
}

function showHexagonGameOver() {
    const gameOverScreen = document.getElementById('hexagon-game-over');
    gameOverScreen.style.display = 'flex';
    
    document.getElementById('hexagon-final-score').textContent = hexagonScore;
    document.getElementById('hexagon-final-high-score').textContent = hexagonHighScore;
}

function restartHexagonGame() {
    // Cacher l'écran de game over
    document.getElementById('hexagon-game-over').style.display = 'none';
    
    // Arrêter la musique actuelle si elle existe
    if (hexagonAudio.currentMusic) {
        hexagonAudio.currentMusic.stop();
    }
    
    // Redémarrer le jeu
    startHexagonGame();
}

function closeHexagonGame() {
    hexagonGameRunning = false;
    
    // Arrêter la boucle de jeu
    if (hexagonAnimationFrame) {
        cancelAnimationFrame(hexagonAnimationFrame);
    }
    
    // Arrêter la musique
    if (hexagonAudio.currentMusic) {
        hexagonAudio.currentMusic.stop();
    }
    
    // Supprimer les écouteurs d'événements
    document.removeEventListener('keydown', handleHexagonKeyDown);
    window.removeEventListener('resize', handleHexagonResize);
    
    // Supprimer l'interface du jeu
    if (hexagonOverlay && hexagonOverlay.parentNode) {
        hexagonOverlay.parentNode.removeChild(hexagonOverlay);
    }
}

// Initialiser le jeu lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', initHexagonGame);
