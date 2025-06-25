/**
 * Mario - Personnage principal du jeu
 */

class Mario extends Entity {
    constructor(game, x, y) {
        super(game, x, y, 32, 32);
        this.type = 'mario';
        this.renderLayer = 10;
        
        // États de Mario
        this.powerState = 0; // 0: Small, 1: Big, 2: Fire, 3: Star
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        
        // Physique
        this.maxSpeed = 5;
        this.acceleration = 0.5;
        this.jumpPower = -15;
        this.friction = 0.85;
        this.gravity = 0.8;
        
        // Animation
        this.facing = 1; // 1: droite, -1: gauche
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 150;
        this.state = 'idle'; // idle, walking, jumping, falling, crouching
        
        // Spawn point pour respawn
        this.spawnX = x;
        this.spawnY = y;
        
        // Particules d'étoile (quand invincible)
        this.starParticles = [];
    }
    
    update(deltaTime) {
        this.handleInput();
        this.updatePhysics(deltaTime);
        this.updateAnimation(deltaTime);
        this.updateInvulnerability(deltaTime);
        this.updateStarParticles(deltaTime);
        this.updateState();
    }
    
    handleInput() {
        const input = this.game.inputManager;
        
        // Mouvement horizontal
        if (input.isPressed('left')) {
            this.velocityX = Math.max(this.velocityX - this.acceleration, -this.maxSpeed);
            this.facing = -1;
        } else if (input.isPressed('right')) {
            this.velocityX = Math.min(this.velocityX + this.acceleration, this.maxSpeed);
            this.facing = 1;
        } else {
            this.velocityX *= this.friction;
        }
        
        // Saut
        if (input.isPressed('jump') && this.onGround) {
            this.velocityY = this.jumpPower;
            this.onGround = false;
            this.game.audioSystem.playSound('jump');
        }
        
        // S'accroupir (si grand Mario)
        if (input.isPressed('down') && this.powerState > 0) {
            this.state = 'crouching';
            this.height = 24;
        } else if (this.powerState > 0) {
            this.height = 40;
        }
        
        // Lancer des boules de feu (si Fire Mario)
        if (input.isPressed('fire') && this.powerState >= 2) {
            this.shootFireball();
        }
        
        // Course (maintenir shift)
        if (input.isPressed('run')) {
            this.maxSpeed = 8;
        } else {
            this.maxSpeed = 5;
        }
    }
    
    updatePhysics(deltaTime) {
        // Gravité
        if (!this.onGround) {
            this.velocityY += this.gravity;
            this.velocityY = Math.min(this.velocityY, 15); // Vitesse de chute max
        }
        
        // Mouvement
        this.x += this.velocityX * deltaTime / 16;
        this.y += this.velocityY * deltaTime / 16;
        
        // Collision avec le sol du monde
        if (this.y + this.height >= this.game.WORLD_HEIGHT) {
            this.y = this.game.WORLD_HEIGHT - this.height;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            // Vérifier collisions avec les plateformes
            this.onGround = this.checkGroundCollision();
        }
        
        // Limites horizontales du monde
        this.x = Math.max(0, Math.min(this.x, this.game.WORLD_WIDTH - this.width));
        
        // Mort si tombe dans un trou
        if (this.y > this.game.WORLD_HEIGHT + 100) {
            this.game.loseLife();
        }
    }
    
    checkGroundCollision() {
        // Vérifier collision avec les blocs solides en dessous
        const level = this.game.levelManager;
        const tileSize = this.game.TILE_SIZE;
        
        const leftTile = Math.floor(this.x / tileSize);
        const rightTile = Math.floor((this.x + this.width) / tileSize);
        const bottomTile = Math.floor((this.y + this.height + 1) / tileSize);
        
        for (let x = leftTile; x <= rightTile; x++) {
            if (level.isSolidTile(x, bottomTile)) {
                this.y = bottomTile * tileSize - this.height;
                this.velocityY = 0;
                return true;
            }
        }
        
        return false;
    }
    
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        
        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }
    
    updateState() {
        if (!this.onGround) {
            this.state = this.velocityY < 0 ? 'jumping' : 'falling';
        } else if (Math.abs(this.velocityX) > 0.1) {
            this.state = 'walking';
        } else {
            this.state = 'idle';
        }
    }
    
    updateInvulnerability(deltaTime) {
        if (this.invulnerable) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
    }
    
    updateStarParticles(deltaTime) {
        if (this.powerState === 3) { // Star power
            // Créer des particules d'étoile
            if (Math.random() < 0.3) {
                this.starParticles.push({
                    x: this.x + Math.random() * this.width,
                    y: this.y + Math.random() * this.height,
                    velocityX: (Math.random() - 0.5) * 4,
                    velocityY: (Math.random() - 0.5) * 4,
                    life: 1000,
                    maxLife: 1000
                });
            }
        }
        
        // Mettre à jour les particules existantes
        for (let i = this.starParticles.length - 1; i >= 0; i--) {
            const particle = this.starParticles[i];
            particle.x += particle.velocityX * deltaTime / 16;
            particle.y += particle.velocityY * deltaTime / 16;
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.starParticles.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        // Effet de clignotement si invulnérable
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
            return;
        }
        
        // Dessiner les particules d'étoile
        this.renderStarParticles(ctx);
        
        // Couleur selon l'état de puissance
        let color = '#FF0000'; // Small Mario - rouge
        if (this.powerState === 1) color = '#00FF00'; // Big Mario - vert
        if (this.powerState === 2) color = '#FF8800'; // Fire Mario - orange
        if (this.powerState === 3) color = '#FFFF00'; // Star Mario - jaune
        
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Yeux pour indiquer la direction
        ctx.fillStyle = '#000000';
        const eyeX = this.facing > 0 ? this.x + this.width - 8 : this.x + 4;
        ctx.fillRect(eyeX, this.y + 8, 4, 4);
        
        // Chapeau
        ctx.fillStyle = '#AA0000';
        ctx.fillRect(this.x + 4, this.y, this.width - 8, 12);
        
        // Debug: afficher les infos
        if (this.game.debug) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.fillText(`State: ${this.state}`, this.x, this.y - 20);
            ctx.fillText(`Power: ${this.powerState}`, this.x, this.y - 8);
        }
    }
    
    renderStarParticles(ctx) {
        for (let particle of this.starParticles) {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.fillRect(particle.x, particle.y, 4, 4);
        }
    }
      collectPowerup(powerType) {
        switch (powerType) {
            case 'mushroom':
                if (this.powerState === 0) {
                    this.powerState = 1;
                    this.height = 40;
                    this.y -= 8; // Ajuster position quand Mario grandit
                    this.game.audioSystem.playSound('powerup');
                    this.game.uiManager.showPowerUpCollected('mushroom');
                }
                break;
                
            case 'fireflower':
                if (this.powerState >= 1) {
                    this.powerState = 2;
                    this.game.audioSystem.playSound('powerup');
                    this.game.uiManager.showPowerUpCollected('fireflower');
                }
                break;
                
            case 'star':
                this.powerState = 3;
                this.invulnerable = true;
                this.invulnerabilityTime = 10000; // 10 secondes
                this.game.audioSystem.playSound('star');
                this.game.audioSystem.playBackgroundMusic('star');
                this.game.uiManager.showPowerUpCollected('star');
                break;
                
            case '1up':
                this.game.addLife();
                this.game.uiManager.showPowerUpCollected('1up');
                break;
        }
    }
    
    takeDamage() {
        if (this.invulnerable) return;
        
        if (this.powerState > 0) {
            this.powerState = Math.max(0, this.powerState - 1);
            this.invulnerable = true;
            this.invulnerabilityTime = 2000; // 2 secondes
            this.game.audioSystem.playSound('damage');
            
            if (this.powerState === 0) {
                this.height = 32;
            }
        } else {
            this.game.loseLife();
        }
    }
    
    shootFireball() {
        if (this.powerState < 2) return;
        
        const fireball = new Fireball(
            this.game,
            this.x + (this.facing > 0 ? this.width : 0),
            this.y + this.height / 2,
            this.facing
        );
        
        this.game.entityManager.addEntity(fireball);
        this.game.audioSystem.playSound('fireball');
    }
    
    respawn() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.powerState = 0;
        this.height = 32;
        this.invulnerable = true;
        this.invulnerabilityTime = 3000; // 3 secondes
        this.starParticles = [];
    }
    
    setSpawnPoint(x, y) {
        this.spawnX = x;
        this.spawnY = y;
    }
}

/**
 * Boule de feu de Mario
 */
class Fireball extends Entity {
    constructor(game, x, y, direction) {
        super(game, x, y, 16, 16);
        this.type = 'fireball';
        this.velocityX = direction * 8;
        this.velocityY = -3;
        this.bounceCount = 0;
        this.maxBounces = 3;
        this.gravity = 0.5;
        this.collidable = false; // Collision gérée séparément
    }
    
    update(deltaTime) {
        // Physique
        this.velocityY += this.gravity;
        this.x += this.velocityX * deltaTime / 16;
        this.y += this.velocityY * deltaTime / 16;
        
        // Collision avec le sol
        if (this.y + this.height >= this.game.WORLD_HEIGHT) {
            this.y = this.game.WORLD_HEIGHT - this.height;
            this.velocityY = -Math.abs(this.velocityY) * 0.7;
            this.bounceCount++;
        }
        
        // Disparaît après trop de rebonds ou si sort de l'écran
        if (this.bounceCount > this.maxBounces || 
            this.x < this.game.camera.x - 100 || 
            this.x > this.game.camera.x + this.game.canvas.width + 100) {
            this.destroy();
        }
        
        // Vérifier collision avec les ennemis
        this.checkEnemyCollisions();
    }
    
    checkEnemyCollisions() {
        const enemies = this.game.entityManager.getEntitiesByType('enemy');
        for (let enemy of enemies) {
            if (this.game.entityManager.checkCollision(this, enemy)) {
                enemy.defeat('fireball');
                this.game.addScore(enemy.points || 100);
                this.destroy();
                break;
            }
        }
    }
    
    render(ctx) {
        ctx.fillStyle = '#FF4400';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Effet de flamme
        ctx.fillStyle = '#FFAA00';
        ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
    }
}

window.Mario = Mario;
window.Fireball = Fireball;
