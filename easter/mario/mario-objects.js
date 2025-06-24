/**
 * Power-ups et objets collectibles de Mario
 */

class PowerUp extends Entity {
    constructor(game, x, y, powerType) {
        super(game, x, y, 32, 32);
        this.type = 'powerup';
        this.powerType = powerType;
        this.points = 1000;
        this.velocityX = 2; // Les power-ups bougent
        this.gravity = 0.8;
        this.renderLayer = 3;
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 200;
    }
    
    update(deltaTime) {
        // Physique de base
        this.velocityY += this.gravity;
        this.x += this.velocityX * deltaTime / 16;
        this.y += this.velocityY * deltaTime / 16;
        
        // Collision avec le sol
        if (this.y + this.height >= this.game.WORLD_HEIGHT) {
            this.y = this.game.WORLD_HEIGHT - this.height;
            this.velocityY = 0;
            this.onGround = true;
        }
        
        // Collision avec les murs
        this.checkWallCollisions();
        
        // Animation
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 2;
            this.animationTimer = 0;
        }
        
        // Disparaît si sort de l'écran
        if (this.x < this.game.camera.x - 100 || 
            this.x > this.game.camera.x + this.game.canvas.width + 100) {
            this.destroy();
        }
    }
    
    checkWallCollisions() {
        const level = this.game.levelManager;
        const tileSize = this.game.TILE_SIZE;
        
        const frontX = this.velocityX > 0 ? this.x + this.width : this.x;
        const frontTileX = Math.floor(frontX / tileSize);
        const tileY = Math.floor((this.y + this.height/2) / tileSize);
        
        if (level.isSolidTile(frontTileX, tileY)) {
            this.velocityX *= -1;
        }
    }
    
    render(ctx) {
        switch (this.powerType) {
            case 'mushroom':
                this.renderMushroom(ctx);
                break;
            case 'fireflower':
                this.renderFireFlower(ctx);
                break;
            case 'star':
                this.renderStar(ctx);
                break;
            case '1up':
                this.render1Up(ctx);
                break;
        }
    }
    
    renderMushroom(ctx) {
        // Corps du champignon
        ctx.fillStyle = '#FFE4B5';
        ctx.fillRect(this.x + 4, this.y + 16, this.width - 8, this.height - 16);
        
        // Chapeau
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(this.x, this.y, this.width, 20);
        
        // Points blancs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 8, this.y + 4, 6, 6);
        ctx.fillRect(this.x + 18, this.y + 4, 6, 6);
        ctx.fillRect(this.x + 4, this.y + 12, 6, 6);
        ctx.fillRect(this.x + 22, this.y + 12, 6, 6);
    }
    
    renderFireFlower(ctx) {
        // Centre de la fleur
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x + 12, this.y + 12, 8, 8);
        
        // Pétales (alternent entre orange et rouge)
        const color1 = this.animationFrame === 0 ? '#FF4500' : '#FF0000';
        const color2 = this.animationFrame === 0 ? '#FF0000' : '#FF4500';
        
        ctx.fillStyle = color1;
        ctx.fillRect(this.x + 8, this.y + 4, 16, 8);  // Haut
        ctx.fillRect(this.x + 8, this.y + 20, 16, 8); // Bas
        
        ctx.fillStyle = color2;
        ctx.fillRect(this.x + 4, this.y + 8, 8, 16);  // Gauche
        ctx.fillRect(this.x + 20, this.y + 8, 8, 16); // Droite
        
        // Tige
        ctx.fillStyle = '#00AA00';
        ctx.fillRect(this.x + 14, this.y + 20, 4, 12);
    }
    
    renderStar(ctx) {
        // Étoile clignotante
        const colors = ['#FFD700', '#FFFF00', '#FFA500'];
        ctx.fillStyle = colors[this.animationFrame % colors.length];
        
        // Forme d'étoile simple (carré avec coins coupés)
        ctx.fillRect(this.x + 8, this.y, 16, this.height);
        ctx.fillRect(this.x, this.y + 8, this.width, 16);
        
        // Points de l'étoile
        ctx.fillRect(this.x + 4, this.y + 4, 8, 8);
        ctx.fillRect(this.x + 20, this.y + 4, 8, 8);
        ctx.fillRect(this.x + 4, this.y + 20, 8, 8);
        ctx.fillRect(this.x + 20, this.y + 20, 8, 8);
    }
    
    render1Up(ctx) {
        // Champignon vert (1UP)
        ctx.fillStyle = '#FFE4B5';
        ctx.fillRect(this.x + 4, this.y + 16, this.width - 8, this.height - 16);
        
        // Chapeau vert
        ctx.fillStyle = '#00AA00';
        ctx.fillRect(this.x, this.y, this.width, 20);
        
        // Points blancs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 8, this.y + 4, 6, 6);
        ctx.fillRect(this.x + 18, this.y + 4, 6, 6);
        
        // Texte "1UP"
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('1UP', this.x + this.width/2, this.y + 16);
    }
}

/**
 * Pièces collectibles
 */
class Coin extends Entity {
    constructor(game, x, y) {
        super(game, x, y, 24, 24);
        this.type = 'coin';
        this.renderLayer = 2;
        this.collidable = true;
        
        // Animation de rotation
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 150;
        
        // Animation de saut (quand sort d'un bloc)
        this.bouncing = this.velocityY < 0;
        this.gravity = 0.5;
    }
    
    update(deltaTime) {
        // Animation de rotation
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
        
        // Physique si la pièce rebondit
        if (this.bouncing) {
            this.velocityY += this.gravity;
            this.y += this.velocityY * deltaTime / 16;
            
            // Arrêter le rebond quand retombe
            if (this.velocityY > 0) {
                this.bouncing = false;
                this.velocityY = 0;
            }
        }
    }
    
    render(ctx) {
        // Couleur dorée clignotante
        const brightness = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
        const r = Math.floor(255 * brightness);
        const g = Math.floor(215 * brightness);
        const b = 0;
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        
        // Forme de la pièce selon l'animation
        switch (this.animationFrame) {
            case 0:
                // Face complète
                ctx.fillRect(this.x, this.y, this.width, this.height);
                break;
            case 1:
                // Un peu tournée
                ctx.fillRect(this.x + 4, this.y, this.width - 8, this.height);
                break;
            case 2:
                // De profil
                ctx.fillRect(this.x + 10, this.y, 4, this.height);
                break;
            case 3:
                // Un peu tournée (autre sens)
                ctx.fillRect(this.x + 4, this.y, this.width - 8, this.height);
                break;
        }
        
        // Symbole dollar ou étoile au centre
        if (this.animationFrame === 0 || this.animationFrame === 2) {
            ctx.fillStyle = '#8B4513';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('★', this.x + this.width/2, this.y + this.height/2 + 4);
        }
    }
}

/**
 * Points de score flottants
 */
class ScorePopup extends Entity {
    constructor(game, x, y, points, text = null) {
        super(game, x, y, 0, 0);
        this.type = 'score_popup';
        this.points = points;
        this.text = text || points.toString();
        this.velocityY = -2;
        this.life = 1500; // 1.5 secondes
        this.maxLife = 1500;
        this.collidable = false;
        this.renderLayer = 15;
    }
    
    update(deltaTime) {
        this.y += this.velocityY * deltaTime / 16;
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.destroy();
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
    }
}

/**
 * Particules d'effet
 */
class Particle extends Entity {
    constructor(game, x, y, velocityX, velocityY, color = '#FFFFFF', life = 1000) {
        super(game, x, y, 4, 4);
        this.type = 'particle';
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.gravity = 0.2;
        this.collidable = false;
        this.renderLayer = 12;
    }
    
    update(deltaTime) {
        this.velocityY += this.gravity;
        this.x += this.velocityX * deltaTime / 16;
        this.y += this.velocityY * deltaTime / 16;
        
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.destroy();
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        if (this.color.includes('rgba')) {
            ctx.fillStyle = this.color.replace(/[\d\.]+\)$/g, `${alpha})`);
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

/**
 * Factory pour créer des objets
 */
class ObjectFactory {
    static createPowerUp(type, game, x, y) {
        return new PowerUp(game, x, y, type);
    }
    
    static createCoin(game, x, y) {
        return new Coin(game, x, y);
    }
    
    static createScorePopup(game, x, y, points, text = null) {
        return new ScorePopup(game, x, y, points, text);
    }
    
    static createParticle(game, x, y, velocityX, velocityY, color, life) {
        return new Particle(game, x, y, velocityX, velocityY, color, life);
    }
    
    static createBlockBreakEffect(game, x, y) {
        const particles = [];
        for (let i = 0; i < 8; i++) {
            const velX = (Math.random() - 0.5) * 6;
            const velY = -Math.random() * 4 - 2;
            const particle = new Particle(game, x + Math.random() * 32, y + Math.random() * 32, 
                                        velX, velY, '#CD853F', 1000);
            particles.push(particle);
        }
        return particles;
    }
    
    static createCoinCollectEffect(game, x, y) {
        const particles = [];
        for (let i = 0; i < 6; i++) {
            const velX = (Math.random() - 0.5) * 4;
            const velY = -Math.random() * 3 - 1;
            const particle = new Particle(game, x + 12, y + 12, 
                                        velX, velY, '#FFD700', 800);
            particles.push(particle);
        }
        return particles;
    }
    
    static createPowerUpCollectEffect(game, x, y) {
        const particles = [];
        for (let i = 0; i < 10; i++) {
            const velX = (Math.random() - 0.5) * 5;
            const velY = -Math.random() * 4 - 2;
            const colors = ['#FF4500', '#FFD700', '#FFFFFF'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particle = new Particle(game, x + 16, y + 16, 
                                        velX, velY, color, 1200);
            particles.push(particle);
        }
        return particles;
    }
}

window.PowerUp = PowerUp;
window.Coin = Coin;
window.ScorePopup = ScorePopup;
window.Particle = Particle;
window.ObjectFactory = ObjectFactory;
