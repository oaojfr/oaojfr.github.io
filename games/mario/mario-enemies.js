/**
 * Gestion des ennemis de Mario
 */

class Enemy extends Entity {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height);
        this.type = 'enemy';
        this.renderLayer = 5;
        this.health = 1;
        this.points = 100;
        this.direction = -1; // Direction de mouvement
        this.speed = 1;
        this.gravity = 0.8;
        this.defeated = false;
        this.defeatTimer = 0;
        this.defeatDuration = 1000;
    }
    
    update(deltaTime) {
        if (this.defeated) {
            this.defeatTimer += deltaTime;
            if (this.defeatTimer >= this.defeatDuration) {
                this.destroy();
            }
            return;
        }
        
        this.updateMovement(deltaTime);
        this.updatePhysics(deltaTime);
    }
    
    updateMovement(deltaTime) {
        // Mouvement de base - à surcharger
        this.velocityX = this.direction * this.speed;
    }
      updatePhysics(deltaTime) {
        // Gravité
        this.velocityY += this.gravity;
        
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
        
        // Vérifier les murs et plateformes
        this.checkWallCollisions();
    }
    
    checkGroundCollision() {
        // Vérifier collision avec les blocs solides en dessous (même logique que Mario)
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
    
    checkWallCollisions() {
        const level = this.game.levelManager;
        const tileSize = this.game.TILE_SIZE;
        
        // Vérifier collision horizontale
        const frontX = this.direction > 0 ? this.x + this.width : this.x;
        const frontTileX = Math.floor(frontX / tileSize);
        const tileY = Math.floor((this.y + this.height/2) / tileSize);
        
        // Tourner si rencontre un mur
        if (level.isSolidTile(frontTileX, tileY)) {
            this.direction *= -1;
        }
        
        // Tourner si va tomber dans le vide
        const groundTileX = Math.floor((frontX + this.direction * tileSize) / tileSize);
        const groundTileY = Math.floor((this.y + this.height + tileSize) / tileSize);
        if (!level.isSolidTile(groundTileX, groundTileY)) {
            this.direction *= -1;
        }
    }
    
    defeat(method) {
        if (this.defeated) return;
        
        this.defeated = true;
        this.collidable = false;
        this.velocityX = 0;
        
        switch (method) {
            case 'stomp':
                this.velocityY = 0;
                this.height = 8; // Aplati
                break;
            case 'fireball':
                this.velocityY = -5;
                this.velocityX = this.direction * 3;
                break;
            case 'shell':
                this.velocityY = -8;
                this.velocityX = this.direction * 5;
                break;
        }
        
        this.game.audioSystem.playSound('enemy_defeat');
    }
    
    render(ctx) {
        if (this.defeated) {
            // Effet de défaite
            ctx.fillStyle = '#555555';
        } else {
            ctx.fillStyle = this.color || '#8B4513';
        }
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Yeux
        if (!this.defeated) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(this.x + 4, this.y + 4, 6, 6);
            ctx.fillRect(this.x + this.width - 10, this.y + 4, 6, 6);
            
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x + 6, this.y + 6, 2, 2);
            ctx.fillRect(this.x + this.width - 8, this.y + 6, 2, 2);
        }
    }
}

/**
 * Goomba - Ennemi de base qui marche
 */
class Goomba extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, 32, 32);
        this.color = '#8B4513';
        this.speed = 1;
        this.points = 100;
    }
    
    render(ctx) {
        super.render(ctx);
        
        if (!this.defeated) {
            // Pieds
            ctx.fillStyle = '#654321';
            ctx.fillRect(this.x, this.y + this.height - 8, this.width, 8);
        }
    }
}

/**
 * Koopa Troopa - Ennemi avec carapace
 */
class Koopa extends Enemy {
    constructor(game, x, y, shellColor = 'green') {
        super(game, x, y, 32, 40);
        this.shellColor = shellColor;
        this.color = '#90EE90';
        this.speed = 1.5;
        this.points = 200;
        this.inShell = false;
        this.shellKicked = false;
        this.shellSpeed = 8;
    }
    
    defeat(method) {
        if (this.defeated) return;
        
        if (method === 'stomp' && !this.inShell) {
            // Premier stomp: entre dans sa carapace
            this.inShell = true;
            this.height = 24;
            this.y += 16;
            this.velocityX = 0;
            this.speed = 0;
            this.color = this.shellColor === 'green' ? '#00AA00' : '#FF0000';
        } else if (method === 'stomp' && this.inShell && !this.shellKicked) {
            // Deuxième stomp: carapace lancée
            this.shellKicked = true;
            this.velocityX = this.direction * this.shellSpeed;
            this.collidable = true; // La carapace peut tuer d'autres ennemis
        } else {
            // Autres méthodes de défaite
            super.defeat(method);
        }
    }
    
    update(deltaTime) {
        if (this.shellKicked) {
            // Carapace qui roule
            this.updateShellMovement(deltaTime);
        } else {
            super.update(deltaTime);
        }
    }
    
    updateShellMovement(deltaTime) {
        this.x += this.velocityX * deltaTime / 16;
        
        // Collision avec les murs - rebondit
        const level = this.game.levelManager;
        const tileSize = this.game.TILE_SIZE;
        const frontX = this.velocityX > 0 ? this.x + this.width : this.x;
        const frontTileX = Math.floor(frontX / tileSize);
        const tileY = Math.floor((this.y + this.height/2) / tileSize);
        
        if (level.isSolidTile(frontTileX, tileY)) {
            this.velocityX *= -1;
            this.game.audioSystem.playSound('bump');
        }
        
        // Tuer les autres ennemis
        this.checkShellEnemyCollisions();
    }
    
    checkShellEnemyCollisions() {
        const enemies = this.game.entityManager.getEntitiesByType('enemy');
        for (let enemy of enemies) {
            if (enemy !== this && !enemy.defeated) {
                if (this.game.entityManager.checkCollision(this, enemy)) {
                    enemy.defeat('shell');
                    this.game.addScore(enemy.points || 100);
                }
            }
        }
    }
    
    onCollision(other) {
        if (other.type === 'mario' && this.inShell && !this.shellKicked) {
            // Mario touche la carapace immobile
            this.direction = other.x < this.x ? 1 : -1;
            this.defeat('stomp');
        }
    }
    
    render(ctx) {
        if (this.inShell) {
            // Dessiner la carapace
            ctx.fillStyle = this.shellColor === 'green' ? '#00AA00' : '#FF0000';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Motif de carapace
            ctx.fillStyle = this.shellColor === 'green' ? '#005500' : '#AA0000';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(this.x + 4 + i * 8, this.y + 4, 6, this.height - 8);
            }
        } else {
            super.render(ctx);
            
            // Carapace sur le dos
            ctx.fillStyle = this.shellColor === 'green' ? '#00AA00' : '#FF0000';
            ctx.fillRect(this.x + 4, this.y + 8, this.width - 8, 16);
        }
    }
}

/**
 * Piranha Plant - Plante qui sort des tuyaux
 */
class PiranhaPlant extends Enemy {
    constructor(game, x, y, pipeHeight = 64) {
        super(game, x, y - 32, 32, 32);
        this.color = '#00AA00';
        this.points = 200;
        this.speed = 0;
        this.pipeY = y;
        this.pipeHeight = pipeHeight;
        this.baseY = y - 32;
        this.topY = y - 64;
        this.phase = 'emerging'; // emerging, visible, hiding
        this.phaseTimer = 0;
        this.phaseDuration = 2000;
        this.collidable = false; // Devient collidable quand visible
    }
    
    update(deltaTime) {
        this.phaseTimer += deltaTime;
        
        switch (this.phase) {
            case 'emerging':
                this.y = this.baseY - (this.phaseTimer / this.phaseDuration) * 32;
                if (this.phaseTimer >= this.phaseDuration) {
                    this.phase = 'visible';
                    this.phaseTimer = 0;
                    this.collidable = true;
                }
                break;
                
            case 'visible':
                if (this.phaseTimer >= this.phaseDuration) {
                    this.phase = 'hiding';
                    this.phaseTimer = 0;
                }
                break;
                
            case 'hiding':
                this.y = this.topY + (this.phaseTimer / this.phaseDuration) * 32;
                this.collidable = false;
                if (this.phaseTimer >= this.phaseDuration) {
                    this.phase = 'emerging';
                    this.phaseTimer = 0;
                }
                break;
        }
        
        // Ne peut pas être écrasée
        if (this.defeated) {
            this.destroy();
        }
    }
    
    defeat(method) {
        if (method === 'stomp') {
            // Ne peut pas être écrasée, fait mal à Mario
            return false;
        }
        super.defeat(method);
    }
    
    render(ctx) {
        // Dessiner le tuyau
        ctx.fillStyle = '#00AA00';
        ctx.fillRect(this.x, this.pipeY - this.pipeHeight, this.width, this.pipeHeight);
        
        // Dessiner la plante si visible
        if (this.phase !== 'hiding' || this.phaseTimer < this.phaseDuration * 0.5) {
            ctx.fillStyle = '#228B22';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Bouche
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x + 8, this.y + 12, 16, 8);
            
            // Dents
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(this.x + 10 + i * 3, this.y + 12, 2, 4);
                ctx.fillRect(this.x + 10 + i * 3, this.y + 16, 2, 4);
            }
        }
    }
}

/**
 * Spiny - Hérisson qui ne peut pas être écrasé
 */
class Spiny extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, 32, 24);
        this.color = '#8B0000';
        this.speed = 0.8;
        this.points = 200;
    }
    
    defeat(method) {
        if (method === 'stomp') {
            // Ne peut pas être écrasé, fait mal à Mario
            return false;
        }
        super.defeat(method);
    }
    
    render(ctx) {
        super.render(ctx);
        
        if (!this.defeated) {
            // Pics
            ctx.fillStyle = '#FFFF00';
            for (let i = 0; i < 4; i++) {
                const x = this.x + 4 + i * 6;
                ctx.fillRect(x, this.y - 4, 4, 8);
            }
        }
    }
}

/**
 * Factory pour créer les ennemis
 */
class EnemyFactory {
    static createEnemy(type, game, x, y, options = {}) {
        switch (type) {
            case 'goomba':
                return new Goomba(game, x, y);
            case 'koopa':
                return new Koopa(game, x, y, options.shellColor);
            case 'piranha':
                return new PiranhaPlant(game, x, y, options.pipeHeight);
            case 'spiny':
                return new Spiny(game, x, y);
            default:
                return new Goomba(game, x, y);
        }
    }
}

window.Enemy = Enemy;
window.Goomba = Goomba;
window.Koopa = Koopa;
window.PiranhaPlant = PiranhaPlant;
window.Spiny = Spiny;
window.Bowser = Bowser;
window.BowserFireball = BowserFireball;

/**
 * Bowser - Boss de fin de niveau
 */
class Bowser extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, 64, 64);
        this.health = 5;
        this.maxHealth = 5;
        this.attackTimer = 0;
        this.attackCooldown = 2000;
        this.isAttacking = false;
        this.direction = -1;
        this.jumpTimer = 0;
        this.jumpCooldown = 3000;
        this.fireballTimer = 0;
        this.fireballCooldown = 4000;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        this.attackTimer += deltaTime;
        this.jumpTimer += deltaTime;
        this.fireballTimer += deltaTime;
        
        // IA de Bowser
        if (this.game.mario) {
            const distanceToMario = Math.abs(this.game.mario.x - this.x);
            
            // Mouvement vers Mario
            if (distanceToMario > 100) {
                this.velocityX = this.direction * 30;
            } else {
                this.velocityX = 0;
                
                // Attaque au corps à corps
                if (this.attackTimer >= this.attackCooldown) {
                    this.meleeAttack();
                    this.attackTimer = 0;
                }
                
                // Saut
                if (this.jumpTimer >= this.jumpCooldown && this.onGround) {
                    this.jump();
                    this.jumpTimer = 0;
                }
            }
            
            // Attaque à distance (boules de feu)
            if (this.fireballTimer >= this.fireballCooldown) {
                this.shootFireball();
                this.fireballTimer = 0;
            }
            
            // Changer de direction si Mario est de l'autre côté
            if (this.game.mario.x < this.x) {
                this.direction = -1;
            } else if (this.game.mario.x > this.x) {
                this.direction = 1;
            }
        }
    }
    
    render(ctx) {
        const screenPos = this.game.getScreenPosition(this.x, this.y);
        
        // Corps de Bowser
        ctx.fillStyle = this.isAttacking ? '#CC4400' : '#FF6600';
        ctx.fillRect(screenPos.x, screenPos.y, this.width, this.height);
        
        // Carapace
        ctx.fillStyle = '#228B22';
        ctx.fillRect(screenPos.x + 8, screenPos.y + 8, this.width - 16, this.height - 24);
        
        // Épines sur la carapace
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 6; i++) {
            const spikeX = screenPos.x + 12 + i * 8;
            const spikeY = screenPos.y + 8;
            ctx.fillRect(spikeX, spikeY, 4, 8);
        }
        
        // Yeux
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(screenPos.x + 16, screenPos.y + 16, 8, 8);
        ctx.fillRect(screenPos.x + 40, screenPos.y + 16, 8, 8);
        
        // Barre de vie
        this.renderHealthBar(ctx, screenPos);
    }
    
    renderHealthBar(ctx, screenPos) {
        const barWidth = 60;
        const barHeight = 6;
        const barX = screenPos.x + 2;
        const barY = screenPos.y - 12;
        
        // Fond de la barre
        ctx.fillStyle = '#000000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Barre de vie
        const healthPercent = this.health / this.maxHealth;
        const healthWidth = barWidth * healthPercent;
        
        ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : 
                       healthPercent > 0.25 ? '#FFFF00' : '#FF0000';
        ctx.fillRect(barX, barY, healthWidth, barHeight);
        
        // Bordure
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    meleeAttack() {
        this.isAttacking = true;
        
        // Zone d'attaque
        const attackRange = 80;
        if (this.game.mario && 
            Math.abs(this.game.mario.x - this.x) < attackRange &&
            Math.abs(this.game.mario.y - this.y) < this.height) {
            
            this.game.mario.takeDamage();
        }
        
        setTimeout(() => {
            this.isAttacking = false;
        }, 500);
    }
    
    jump() {
        this.velocityY = -400;
        this.onGround = false;
        
        // Onde de choc à l'atterrissage
        setTimeout(() => {
            if (this.onGround) {
                this.createShockwave();
            }
        }, 800);
    }
    
    shootFireball() {
        const fireball = new BowserFireball(this.game, 
            this.x + (this.direction > 0 ? this.width : 0), 
            this.y + this.height / 2, 
            this.direction);
        this.game.entityManager.addEntity(fireball);
        
        this.game.audioManager.playSFX('enemy_attack');
    }
    
    createShockwave() {
        // Créer des particules d'onde de choc
        for (let i = 0; i < 10; i++) {
            const particle = new Particle(this.game, 
                this.x + this.width / 2, 
                this.y + this.height,
                Math.random() * 200 - 100, // velocityX aléatoire
                -50, // velocityY vers le haut
                '#FFAA00', 
                300);
            this.game.entityManager.addEntity(particle);
        }
    }
    
    onCollision(other) {
        if (other === this.game.mario) {
            // Bowser ne peut pas être vaincu par saut
            this.game.mario.takeDamage();
        } else if (other.constructor.name === 'Fireball') {
            this.takeDamage();
            other.destroy();
        }
    }
    
    takeDamage() {
        this.health--;
        this.game.audioManager.playSFX('enemy_defeat');
        
        // Effet visuel de dégât
        this.createDamageEffect();
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    createDamageEffect() {
        for (let i = 0; i < 5; i++) {
            const particle = new Particle(this.game, 
                this.x + Math.random() * this.width, 
                this.y + Math.random() * this.height,
                Math.random() * 100 - 50,
                Math.random() * 100 - 50,
                '#FF0000', 
                500);
            this.game.entityManager.addEntity(particle);
        }
    }
    
    die() {
        console.log('Bowser vaincu !');
        
        // Points pour vaincre le boss
        this.game.addScore(5000);
        
        // Effet de victoire
        for (let i = 0; i < 20; i++) {
            const particle = new Particle(this.game, 
                this.x + this.width / 2, 
                this.y + this.height / 2,
                Math.random() * 300 - 150,
                Math.random() * 300 - 150,
                '#FFD700', 
                2000);
            this.game.entityManager.addEntity(particle);
        }
        
        // Message de victoire
        this.game.ui.showMessage('BOWSER VAINCU !', 3000, '32px Arial');
        
        // Terminer le niveau
        setTimeout(() => {
            this.game.completeLevel();
        }, 2000);
        
        this.destroy();
    }
}

/**
 * Boule de feu de Bowser
 */
class BowserFireball extends Enemy {
    constructor(game, x, y, direction) {
        super(game, x, y, 16, 16);
        this.velocityX = direction * 150;
        this.velocityY = -50;
        this.lifetime = 3000;
        this.age = 0;
        this.bounces = 3;
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        
        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }
        
        // Gravité réduite
        this.velocityY += this.game.GRAVITY * 0.5 * deltaTime / 1000;
        
        super.update(deltaTime);
    }
    
    render(ctx) {
        const screenPos = this.game.getScreenPosition(this.x, this.y);
        
        // Boule de feu animée
        const time = Date.now() * 0.01;
        ctx.fillStyle = '#FF4400';
        ctx.beginPath();
        ctx.arc(screenPos.x + this.width / 2, screenPos.y + this.height / 2, 
                8 + Math.sin(time) * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Flammes
        ctx.fillStyle = '#FFAA00';
        ctx.beginPath();
        ctx.arc(screenPos.x + this.width / 2, screenPos.y + this.height / 2, 
                4 + Math.cos(time * 1.5) * 1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    onCollision(other) {
        if (other === this.game.mario) {
            this.game.mario.takeDamage();
            this.destroy();
        } else if (other.isSolid && this.bounces > 0) {
            this.velocityY = -Math.abs(this.velocityY) * 0.7;
            this.bounces--;
        }
    }
}
