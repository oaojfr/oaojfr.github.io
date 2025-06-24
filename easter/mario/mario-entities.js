/**
 * Système d'entités Mario - Gestion de tous les objets du jeu
 */

class MarioEntityManager {
    constructor(game) {
        this.game = game;
        this.entities = [];
        this.entitiesToAdd = [];
        this.entitiesToRemove = [];
    }
    
    addEntity(entity) {
        this.entitiesToAdd.push(entity);
    }
    
    removeEntity(entity) {
        this.entitiesToRemove.push(entity);
    }
    
    update(deltaTime) {
        // Ajouter les nouvelles entités
        this.entities.push(...this.entitiesToAdd);
        this.entitiesToAdd = [];
        
        // Mettre à jour toutes les entités
        for (let entity of this.entities) {
            if (entity.active) {
                entity.update(deltaTime);
            }
        }
        
        // Gérer les collisions
        this.handleCollisions();
        
        // Supprimer les entités marquées pour suppression
        for (let entity of this.entitiesToRemove) {
            const index = this.entities.indexOf(entity);
            if (index > -1) {
                this.entities.splice(index, 1);
            }
        }
        this.entitiesToRemove = [];
        
        // Supprimer les entités mortes ou hors écran
        this.entities = this.entities.filter(entity => {
            if (!entity.active || entity.y > this.game.WORLD_HEIGHT + 100) {
                return false;
            }
            return true;
        });
    }
    
    render(ctx) {
        // Trier les entités par couche de rendu
        const sortedEntities = [...this.entities].sort((a, b) => {
            const layerA = a.renderLayer || 0;
            const layerB = b.renderLayer || 0;
            return layerA - layerB;
        });
        
        for (let entity of sortedEntities) {
            if (entity.active && this.isEntityVisible(entity)) {
                entity.render(ctx);
            }
        }
    }
    
    isEntityVisible(entity) {
        const screenPos = this.game.getScreenPosition(entity.x, entity.y);
        return screenPos.x > -entity.width && 
               screenPos.x < this.game.canvas.width + entity.width &&
               screenPos.y > -entity.height && 
               screenPos.y < this.game.canvas.height + entity.height;
    }
    
    handleCollisions() {
        const mario = this.game.mario;
        if (!mario || !mario.active) return;
        
        // Collisions Mario vs autres entités
        for (let entity of this.entities) {
            if (entity === mario || !entity.active || !entity.collidable) continue;
            
            if (this.checkCollision(mario, entity)) {
                this.handleEntityCollision(mario, entity);
            }
        }
        
        // Collisions entre entités non-Mario
        for (let i = 0; i < this.entities.length; i++) {
            for (let j = i + 1; j < this.entities.length; j++) {
                const entity1 = this.entities[i];
                const entity2 = this.entities[j];
                
                if (entity1 === mario || entity2 === mario) continue;
                if (!entity1.active || !entity2.active) continue;
                if (!entity1.collidable || !entity2.collidable) continue;
                
                if (this.checkCollision(entity1, entity2)) {
                    this.handleEntityCollision(entity1, entity2);
                }
            }
        }
    }
    
    checkCollision(entity1, entity2) {
        return entity1.x < entity2.x + entity2.width &&
               entity1.x + entity1.width > entity2.x &&
               entity1.y < entity2.y + entity2.height &&
               entity1.y + entity1.height > entity2.y;
    }
    
    handleEntityCollision(entity1, entity2) {
        // Gestion spécifique selon les types d'entités
        if (entity1.type === 'mario') {
            this.handleMarioCollision(entity1, entity2);
        } else if (entity2.type === 'mario') {
            this.handleMarioCollision(entity2, entity1);
        } else {
            // Collision entre entités non-Mario
            entity1.onCollision?.(entity2);
            entity2.onCollision?.(entity1);
        }
    }
    
    handleMarioCollision(mario, other) {
        switch (other.type) {
            case 'enemy':
                this.handleMarioEnemyCollision(mario, other);
                break;
                
            case 'powerup':
                this.handleMarioPowerupCollision(mario, other);
                break;
                
            case 'coin':
                this.handleMarioCoinCollision(mario, other);
                break;
                
            case 'block':
                this.handleMarioBlockCollision(mario, other);
                break;
                
            case 'pipe':
                this.handleMarioPipeCollision(mario, other);
                break;
                
            case 'flag':
                this.handleMarioFlagCollision(mario, other);
                break;
        }
    }
    
    handleMarioEnemyCollision(mario, enemy) {
        // Vérifier si Mario tombe sur l'ennemi
        const marioBottom = mario.y + mario.height;
        const enemyTop = enemy.y;
        const marioVelocityY = mario.velocityY;
        
        if (marioBottom <= enemyTop + 10 && marioVelocityY > 0) {
            // Mario écrase l'ennemi
            enemy.defeat('stomp');
            mario.velocityY = -8; // Petit rebond
            this.game.addScore(enemy.points || 100);
            this.game.audioSystem.playSound('stomp');
        } else if (!mario.invulnerable) {
            // Mario touche l'ennemi
            if (mario.powerState > 0) {
                mario.takeDamage();
            } else {
                this.game.loseLife();
            }
        }
    }
      handleMarioPowerupCollision(mario, powerup) {
        // Créer des effets visuels
        const particles = ObjectFactory.createPowerUpCollectEffect(this.game, powerup.x, powerup.y);
        particles.forEach(particle => this.addEntity(particle));
        
        // Appliquer le power-up
        mario.collectPowerup(powerup.powerType);
        this.removeEntity(powerup);
        this.game.addScore(powerup.points || 1000);
    }
    
    handleMarioCoinCollision(mario, coin) {
        // Créer des effets visuels
        const particles = ObjectFactory.createCoinCollectEffect(this.game, coin.x, coin.y);
        particles.forEach(particle => this.addEntity(particle));
        
        this.game.addCoins(1);
        this.removeEntity(coin);
    }
      handleMarioBlockCollision(mario, block) {
        // Collision détaillée avec les blocs
        const overlapX = Math.min(mario.x + mario.width - block.x, block.x + block.width - mario.x);
        const overlapY = Math.min(mario.y + mario.height - block.y, block.y + block.height - mario.y);
        
        if (overlapX < overlapY) {
            // Collision horizontale
            if (mario.x < block.x) {
                mario.x = block.x - mario.width;
            } else {
                mario.x = block.x + block.width;
            }
            mario.velocityX = 0;        } else {
            // Collision verticale
            if (mario.y < block.y) {
                // Mario frappe le bloc par en dessous
                mario.y = block.y - mario.height;
                mario.velocityY = 0;
                // Appeler la méthode hit du bloc si elle existe
                if (typeof block.hit === 'function') {
                    block.hit(mario);
                }
            } else {
                // Mario atterrit sur le bloc
                mario.y = block.y + block.height;
                mario.velocityY = 0;
                mario.onGround = true;
            }
        }
    }
    
    handleMarioPipeCollision(mario, pipe) {
        if (pipe.canEnter && this.game.inputManager.isPressed('down')) {
            pipe.enter?.(mario);
        }
    }
    
    handleMarioFlagCollision(mario, flag) {
        this.game.levelComplete();
    }
    
    getEntitiesByType(type) {
        return this.entities.filter(entity => entity.type === type);
    }
    
    getEntitiesInArea(x, y, width, height) {
        return this.entities.filter(entity => {
            return entity.x < x + width &&
                   entity.x + entity.width > x &&
                   entity.y < y + height &&
                   entity.y + entity.height > y;
        });
    }
    
    reset() {
        this.entities = [];
        this.entitiesToAdd = [];
        this.entitiesToRemove = [];
    }
}

/**
 * Classe de base pour toutes les entités
 */
class Entity {
    constructor(game, x, y, width, height) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.active = true;
        this.collidable = true;
        this.type = 'entity';
        this.renderLayer = 0;
        this.onGround = false;
    }
    
    update(deltaTime) {
        // Mise à jour de base - à surcharger dans les classes filles
        this.x += this.velocityX * deltaTime / 16;
        this.y += this.velocityY * deltaTime / 16;
    }
    
    render(ctx) {
        // Rendu de base - à surcharger dans les classes filles
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    destroy() {
        this.active = false;
        this.game.entityManager.removeEntity(this);
    }
    
    onCollision(other) {
        // Gestion de collision - à surcharger si nécessaire
    }
}

window.MarioEntityManager = MarioEntityManager;
window.Entity = Entity;
