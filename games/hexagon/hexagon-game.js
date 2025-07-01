/**
 * HEXAGON ULTRA - AAA Quality 3D Reflex Game
 * Created with Three.js for stunning 3D visuals and electronic music
 */

class HexagonUltra {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.hexagonGroup = null;
        this.walls = [];
        this.particles = [];
        this.audioContext = null;
        this.masterGain = null;
        this.musicEnabled = true;
        
        // Game state
        this.gameState = 'menu'; // menu, playing, gameOver
        this.score = 0;
        this.speed = 1.0;
        this.playerRotation = 0;
        this.hexagonRotation = 0;
        this.lastTime = 0;
        this.beatTime = 0;
        
        // Controls
        this.keys = {};
        
        // Game settings
        this.baseSpeed = 0.02;
        this.wallSpawnRate = 0.015;
        this.maxWalls = 50;
        this.playerRadius = 1.2;
        this.playerSpeed = 0.1;
        
        // Visual effects
        this.bloomPass = null;
        this.composer = null;
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupPlayer();
        this.setupHexagon();
        this.setupControls();
        this.setupAudio();
        this.setupPostProcessing();
        this.loadBestScore();
        this.animate();
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000033, 10, 100);
        
        // Background geometry with animated stars
        const starGeometry = new THREE.BufferGeometry();
        const starVertices = [];
        for (let i = 0; i < 1000; i++) {
            starVertices.push(
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                -Math.random() * 100 - 50
            );
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 15);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000011, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x440088, 0.3);
        this.scene.add(ambientLight);
        
        // Central point light with pulsing effect
        this.centralLight = new THREE.PointLight(0x00ffff, 2, 20);
        this.centralLight.position.set(0, 0, 5);
        this.centralLight.castShadow = true;
        this.scene.add(this.centralLight);
        
        // Rim lighting
        const rimLight1 = new THREE.DirectionalLight(0xff00ff, 0.5);
        rimLight1.position.set(10, 10, 10);
        this.scene.add(rimLight1);
        
        const rimLight2 = new THREE.DirectionalLight(0x00ff00, 0.3);
        rimLight2.position.set(-10, -10, 10);
        this.scene.add(rimLight2);
    }
    
    setupPlayer() {
        // Player - a glowing cube
        const playerGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const playerMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0x004444,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        
        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        this.player.position.set(0, this.playerRadius, 0);
        this.player.castShadow = true;
        this.scene.add(this.player);
        
        // Player trail effect
        this.playerTrail = [];
        for (let i = 0; i < 10; i++) {
            const trailGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const trailMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.1 + (i * 0.05)
            });
            const trail = new THREE.Mesh(trailGeometry, trailMaterial);
            this.playerTrail.push(trail);
            this.scene.add(trail);
        }
    }
    
    setupHexagon() {
        this.hexagonGroup = new THREE.Group();
        
        // Create hexagon outline
        const hexGeometry = new THREE.RingGeometry(2, 2.1, 6);
        const hexMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x002222,
            transparent: true,
            opacity: 0.8
        });
        
        this.hexagon = new THREE.Mesh(hexGeometry, hexMaterial);
        this.hexagonGroup.add(this.hexagon);
        
        // Inner hexagon for visual depth
        const innerHexGeometry = new THREE.RingGeometry(1.5, 1.6, 6);
        const innerHexMaterial = new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            emissive: 0x220022,
            transparent: true,
            opacity: 0.6
        });
        
        this.innerHexagon = new THREE.Mesh(innerHexGeometry, innerHexMaterial);
        this.hexagonGroup.add(this.innerHexagon);
        
        this.scene.add(this.hexagonGroup);
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mobile touch controls
        let touchStartX = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const deltaX = touchX - touchStartX;
            
            if (Math.abs(deltaX) > 10) {
                if (deltaX > 0) {
                    this.keys['d'] = true;
                    this.keys['a'] = false;
                } else {
                    this.keys['a'] = true;
                    this.keys['d'] = false;
                }
                touchStartX = touchX;
            }
        });
        
        document.addEventListener('touchend', () => {
            this.keys['a'] = false;
            this.keys['d'] = false;
        });
    }
    
    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3;
            
            // Generate 8-bit style music
            this.generateMusic();
        } catch (e) {
            console.log('Audio not supported');
            this.musicEnabled = false;
        }
    }
    
    generateMusic() {
        if (!this.audioContext) return;
        
        // Create a simple 8-bit style beat
        this.beatOscillator = this.audioContext.createOscillator();
        this.beatGain = this.audioContext.createGain();
        
        this.beatOscillator.type = 'square';
        this.beatOscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        
        this.beatGain.gain.value = 0;
        this.beatOscillator.connect(this.beatGain);
        this.beatGain.connect(this.masterGain);
        
        this.beatOscillator.start();
        
        // Bass line
        this.bassOscillator = this.audioContext.createOscillator();
        this.bassGain = this.audioContext.createGain();
        
        this.bassOscillator.type = 'sawtooth';
        this.bassOscillator.frequency.setValueAtTime(110, this.audioContext.currentTime);
        
        this.bassGain.gain.value = 0;
        this.bassOscillator.connect(this.bassGain);
        this.bassGain.connect(this.masterGain);
        
        this.bassOscillator.start();
    }
    
    setupPostProcessing() {
        // For now, we'll add bloom effects manually through materials
        // In a full implementation, you'd use EffectComposer and passes
    }
    
    spawnWall() {
        const angle = Math.random() * Math.PI * 2;
        const side = Math.floor(Math.random() * 6);
        const sideAngle = (side * Math.PI) / 3;
        
        // Create wall geometry
        const wallGeometry = new THREE.BoxGeometry(1, 0.2, 0.3);
        const wallMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL((this.score * 0.01) % 1, 1, 0.5),
            emissive: new THREE.Color().setHSL((this.score * 0.01) % 1, 0.5, 0.1),
            shininess: 100
        });
        
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        
        // Position wall at hexagon edge
        const radius = 8;
        wall.position.x = Math.cos(sideAngle) * radius;
        wall.position.y = Math.sin(sideAngle) * radius;
        wall.position.z = 0;
        
        wall.rotation.z = sideAngle + Math.PI / 2;
        wall.userData = {
            side: side,
            speed: this.baseSpeed * this.speed,
            angle: sideAngle
        };
        
        wall.castShadow = true;
        this.walls.push(wall);
        this.scene.add(wall);
    }
    
    updateWalls() {
        for (let i = this.walls.length - 1; i >= 0; i--) {
            const wall = this.walls[i];
            const userData = wall.userData;
            
            // Move wall towards center
            const currentRadius = Math.sqrt(wall.position.x ** 2 + wall.position.y ** 2);
            const newRadius = currentRadius - userData.speed * (this.speed + this.score * 0.001);
            
            if (newRadius <= 0.5) {
                // Remove wall if it reaches center
                this.scene.remove(wall);
                this.walls.splice(i, 1);
                continue;
            }
            
            // Update position
            wall.position.x = Math.cos(userData.angle) * newRadius;
            wall.position.y = Math.sin(userData.angle) * newRadius;
            
            // Add rotation effect
            wall.rotation.z += 0.02;
            
            // Check collision with player
            if (this.checkCollision(wall)) {
                this.gameOver();
                return;
            }
        }
    }
    
    checkCollision(wall) {
        const distance = this.player.position.distanceTo(wall.position);
        return distance < 0.5;
    }
    
    updatePlayer() {
        if (this.gameState !== 'playing') return;
        
        // Player movement
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.playerRotation -= this.playerSpeed;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.playerRotation += this.playerSpeed;
        }
        
        // Update player position
        this.player.position.x = Math.cos(this.playerRotation) * this.playerRadius;
        this.player.position.y = Math.sin(this.playerRotation) * this.playerRadius;
        
        // Player rotation animation
        this.player.rotation.x += 0.1;
        this.player.rotation.y += 0.05;
        
        // Update player trail
        for (let i = this.playerTrail.length - 1; i > 0; i--) {
            this.playerTrail[i].position.copy(this.playerTrail[i - 1].position);
        }
        if (this.playerTrail.length > 0) {
            this.playerTrail[0].position.copy(this.player.position);
        }
    }
    
    updateEffects(deltaTime) {
        // Pulsing central light
        this.centralLight.intensity = 2 + Math.sin(this.beatTime * 4) * 0.5;
        
        // Hexagon rotation
        this.hexagonRotation += 0.005 * this.speed;
        this.hexagonGroup.rotation.z = this.hexagonRotation;
        
        // Inner hexagon counter-rotation
        this.innerHexagon.rotation.z -= 0.01 * this.speed;
        
        // Stars animation
        this.stars.rotation.z += 0.001;
        
        // Camera shake effect when speed increases
        if (this.speed > 2) {
            this.camera.position.x = (Math.random() - 0.5) * 0.1 * (this.speed - 2);
            this.camera.position.y = (Math.random() - 0.5) * 0.1 * (this.speed - 2);
        }
        
        // Speed increase over time
        this.speed += 0.0005;
        
        // Score increase
        this.score += Math.floor(this.speed * 10);
        
        // Update UI
        document.getElementById('scoreValue').textContent = Math.floor(this.score);
        document.getElementById('speedValue').textContent = this.speed.toFixed(1);
    }
    
    updateMusic() {
        if (!this.musicEnabled || !this.audioContext) return;
        
        this.beatTime += 0.016; // Assuming 60fps
        
        // Beat pattern
        if (Math.floor(this.beatTime * 4) % 2 === 0) {
            this.beatGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            this.beatGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            
            // Bass effect
            document.getElementById('bassEffect').style.opacity = '0.3';
            setTimeout(() => {
                document.getElementById('bassEffect').style.opacity = '0';
            }, 100);
        }
        
        // Bass line
        const bassPattern = [110, 130, 165, 220];
        const currentBass = bassPattern[Math.floor(this.beatTime) % bassPattern.length];
        this.bassOscillator.frequency.setValueAtTime(currentBass, this.audioContext.currentTime);
        
        if (Math.floor(this.beatTime * 2) % 4 === 0) {
            this.bassGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            this.bassGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            this.updatePlayer();
            this.updateWalls();
            this.updateEffects(deltaTime);
            this.updateMusic();
            
            // Spawn new walls
            if (Math.random() < this.wallSpawnRate * this.speed && this.walls.length < this.maxWalls) {
                this.spawnWall();
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.speed = 1.0;
        this.playerRotation = 0;
        this.hexagonRotation = 0;
        this.beatTime = 0;
        
        // Clear existing walls
        this.walls.forEach(wall => this.scene.remove(wall));
        this.walls = [];
        
        // Reset player position
        this.player.position.set(0, this.playerRadius, 0);
        
        // Hide menu
        document.getElementById('menu').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';
        
        // Resume audio context if needed
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Update best score
        const bestScore = localStorage.getItem('hexagonBestScore') || 0;
        if (this.score > bestScore) {
            localStorage.setItem('hexagonBestScore', Math.floor(this.score));
        }
        
        // Show game over screen
        document.getElementById('finalScore').textContent = Math.floor(this.score);
        document.getElementById('bestScore').textContent = localStorage.getItem('hexagonBestScore') || 0;
        document.getElementById('gameOver').style.display = 'block';
        
        // Camera effect
        this.camera.position.x = 0;
        this.camera.position.y = 0;
    }
    
    restartGame() {
        this.startGame();
    }
    
    showMenu() {
        this.gameState = 'menu';
        document.getElementById('menu').style.display = 'block';
        document.getElementById('gameOver').style.display = 'none';
        
        // Reset camera
        this.camera.position.set(0, 0, 15);
        this.camera.position.x = 0;
        this.camera.position.y = 0;
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        const button = document.querySelector('[data-translate="game.music"]');
        if (this.musicEnabled) {
            button.textContent = translations[currentLanguage]['game.music'] || 'MUSIQUE: ON';
            if (this.masterGain) this.masterGain.gain.value = 0.3;
        } else {
            button.textContent = 'MUSIC: OFF';
            if (this.masterGain) this.masterGain.gain.value = 0;
        }
    }
    
    loadBestScore() {
        const bestScore = localStorage.getItem('hexagonBestScore') || 0;
        document.getElementById('bestScore').textContent = bestScore;
    }
    
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize the game
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new HexagonUltra();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        game.handleResize();
    });
});

// Global functions for UI
function startGame() {
    game.startGame();
}

function restartGame() {
    game.restartGame();
}

function showMenu() {
    game.showMenu();
}

function toggleMusic() {
    game.toggleMusic();
}
