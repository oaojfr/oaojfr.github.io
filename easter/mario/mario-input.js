/**
 * Système de gestion des entrées de Mario
 */

class MarioInput {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.lastKeys = {};
        
        // Configuration des touches
        this.keyMap = {
            // Mouvement
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'KeyA': 'left',
            'KeyD': 'right',
            'KeyW': 'up',
            'KeyS': 'down',
            
            // Actions
            'Space': 'jump',
            'KeyZ': 'jump',
            'KeyX': 'fire',
            'KeyC': 'fire',
            'ShiftLeft': 'run',
            'ShiftRight': 'run',
            
            // Contrôles du jeu
            'KeyP': 'pause',
            'KeyR': 'restart',
            'KeyF': 'fps',
            'KeyG': 'debug',
            'Escape': 'menu'
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Gestion du clavier
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Gestion tactile pour mobile
        this.setupTouchControls();
        
        // Empêcher le défilement avec les flèches
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }
    
    setupTouchControls() {
        const canvas = this.game.canvas;
        
        // Variables pour le touch
        this.touchControls = {
            left: false,
            right: false,
            jump: false,
            fire: false
        };
        
        // Zones de contrôle tactile
        this.touchZones = {
            left: { x: 0, y: canvas.height - 120, width: 80, height: 80 },
            right: { x: 90, y: canvas.height - 120, width: 80, height: 80 },
            jump: { x: canvas.width - 170, y: canvas.height - 120, width: 80, height: 80 },
            fire: { x: canvas.width - 80, y: canvas.height - 120, width: 80, height: 80 }
        };
        
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));
    }
    
    handleKeyDown(e) {
        const action = this.keyMap[e.code];
        if (action) {
            this.keys[action] = true;
            this.handleGameAction(action, true);
        }
    }
    
    handleKeyUp(e) {
        const action = this.keyMap[e.code];
        if (action) {
            this.keys[action] = false;
        }
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        this.updateTouchControls(e.touches);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        this.updateTouchControls(e.touches);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        if (e.touches.length === 0) {
            // Plus de touches actives
            this.touchControls = {
                left: false,
                right: false,
                jump: false,
                fire: false
            };
        } else {
            this.updateTouchControls(e.touches);
        }
    }
    
    updateTouchControls(touches) {
        const canvas = this.game.canvas;
        const rect = canvas.getBoundingClientRect();
        
        // Réinitialiser les contrôles
        this.touchControls = {
            left: false,
            right: false,
            jump: false,
            fire: false
        };
        
        // Vérifier chaque touche
        for (let touch of touches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Ajuster pour la résolution du canvas
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const touchX = x * scaleX;
            const touchY = y * scaleY;
            
            // Vérifier quelle zone est touchée
            for (let [control, zone] of Object.entries(this.touchZones)) {
                if (touchX >= zone.x && touchX <= zone.x + zone.width &&
                    touchY >= zone.y && touchY <= zone.y + zone.height) {
                    this.touchControls[control] = true;
                }
            }
        }
    }
    
    handleGameAction(action, pressed) {
        if (!pressed) return;
        
        switch (action) {
            case 'pause':
                this.game.pause();
                break;
                
            case 'restart':
                if (this.game.gameState === 'gameOver') {
                    this.restartGame();
                }
                break;
                
            case 'fps':
                this.game.uiManager.toggleFPS();
                break;
                
            case 'debug':
                this.game.uiManager.toggleDebug();
                break;
                
            case 'menu':
                // Retour au menu principal ou pause
                this.game.pause();
                break;
        }
    }
    
    update() {
        // Mettre à jour l'état précédent des touches
        this.lastKeys = { ...this.keys };
        
        // Fusionner les contrôles tactiles avec les touches
        for (let [control, active] of Object.entries(this.touchControls)) {
            if (active) {
                this.keys[control] = true;
            }
        }
    }
    
    isPressed(action) {
        return !!this.keys[action];
    }
    
    isJustPressed(action) {
        return !!this.keys[action] && !this.lastKeys[action];
    }
    
    isJustReleased(action) {
        return !this.keys[action] && !!this.lastKeys[action];
    }
    
    restartGame() {
        // Redémarrer le jeu
        this.game.gameState = 'playing';
        this.game.lives = 3;
        this.game.score = 0;
        this.game.coins = 0;
        this.game.time = 400;
        this.game.loadLevel(1);
        this.game.uiManager.showMessage('NOUVELLE PARTIE', 1500);
    }
    
    // Méthodes pour dessiner les contrôles tactiles
    renderTouchControls(ctx) {
        if (!this.isMobile()) return;
        
        const alpha = 0.3;
        const activeAlpha = 0.6;
        
        // Dessiner les zones de contrôle
        for (let [control, zone] of Object.entries(this.touchZones)) {
            const isActive = this.touchControls[control];
            ctx.fillStyle = `rgba(255, 255, 255, ${isActive ? activeAlpha : alpha})`;
            ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            
            // Bordure
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
            
            // Icônes
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            
            const centerX = zone.x + zone.width / 2;
            const centerY = zone.y + zone.height / 2 + 8;
            
            switch (control) {
                case 'left':
                    ctx.fillText('←', centerX, centerY);
                    break;
                case 'right':
                    ctx.fillText('→', centerX, centerY);
                    break;
                case 'jump':
                    ctx.fillText('A', centerX, centerY);
                    break;
                case 'fire':
                    ctx.fillText('B', centerX, centerY);
                    break;
            }
        }
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Gestion des raccourcis clavier pour le développement
    setupDebugControls() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.code) {
                    case 'Digit1':
                        this.game.mario?.collectPowerup('mushroom');
                        e.preventDefault();
                        break;
                    case 'Digit2':
                        this.game.mario?.collectPowerup('fireflower');
                        e.preventDefault();
                        break;
                    case 'Digit3':
                        this.game.mario?.collectPowerup('star');
                        e.preventDefault();
                        break;
                    case 'KeyL':
                        this.game.loadLevel(this.game.currentLevel + 1);
                        e.preventDefault();
                        break;
                    case 'KeyK':
                        this.game.addLife();
                        e.preventDefault();
                        break;
                    case 'KeyC':
                        this.game.addCoins(10);
                        e.preventDefault();
                        break;
                }
            }
        });
    }
    
    destroy() {
        // Nettoyer les event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        const canvas = this.game.canvas;
        canvas.removeEventListener('touchstart', this.handleTouchStart);
        canvas.removeEventListener('touchmove', this.handleTouchMove);
        canvas.removeEventListener('touchend', this.handleTouchEnd);
        canvas.removeEventListener('touchcancel', this.handleTouchEnd);
    }
}

window.MarioInput = MarioInput;
