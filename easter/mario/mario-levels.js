/**
 * Système de gestion des niveaux de Mario
 */

class MarioLevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = null;
        this.tiles = [];
        this.backgroundElements = [];
        this.TILE_SIZE = 32;
        
        // Types de tiles
        this.TILE_TYPES = {
            EMPTY: 0,
            GROUND: 1,
            BRICK: 2,
            QUESTION: 3,
            PIPE: 4,
            CASTLE: 5,
            HILL: 6,
            CLOUD: 7,
            BUSH: 8,
            FLAG: 9
        };
    }
    
    loadLevel(levelNumber) {
        console.log(`Chargement du niveau ${levelNumber}`);
        
        // Réinitialiser le niveau
        this.tiles = [];
        this.backgroundElements = [];
        
        // Créer une grille vide
        const width = Math.floor(this.game.WORLD_WIDTH / this.TILE_SIZE);
        const height = Math.floor(this.game.WORLD_HEIGHT / this.TILE_SIZE);
        
        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < width; x++) {
                this.tiles[y][x] = this.TILE_TYPES.EMPTY;
            }
        }
        
        // Générer le niveau selon le numéro
        switch (levelNumber) {
            case 1:
                this.generateLevel1();
                break;
            case 2:
                this.generateLevel2();
                break;
            default:
                this.generateRandomLevel(levelNumber);
                break;
        }
        
        this.currentLevel = levelNumber;
        console.log(`Niveau ${levelNumber} généré`);
    }
    
    generateLevel1() {
        const width = this.tiles[0].length;
        const height = this.tiles.length;
        
        // Sol de base
        for (let x = 0; x < width; x++) {
            for (let y = height - 2; y < height; y++) {
                this.tiles[y][x] = this.TILE_TYPES.GROUND;
            }
        }
        
        // Plateformes et obstacles
        this.addPlatform(20, height - 6, 4, 1, this.TILE_TYPES.BRICK);
        this.addPlatform(30, height - 4, 2, 1, this.TILE_TYPES.QUESTION);
        this.addPlatform(50, height - 8, 8, 1, this.TILE_TYPES.BRICK);
        this.addPlatform(70, height - 5, 3, 1, this.TILE_TYPES.QUESTION);
        
        // Trous dans le sol
        this.addGap(80, 5);
        this.addGap(120, 8);
        
        // Château à la fin
        this.addCastle(width - 15, height - 8);
        
        // Drapeau de fin
        this.addFlag(width - 25, height - 10);
        
        // Éléments de décor
        this.addBackgroundElements();
    }
    
    generateLevel2() {
        const width = this.tiles[0].length;
        const height = this.tiles.length;
        
        // Sol de base
        for (let x = 0; x < width; x++) {
            for (let y = height - 2; y < height; y++) {
                this.tiles[y][x] = this.TILE_TYPES.GROUND;
            }
        }
        
        // Niveau plus difficile avec plus d'obstacles
        this.addPlatform(15, height - 6, 3, 1, this.TILE_TYPES.BRICK);
        this.addPlatform(25, height - 9, 2, 1, this.TILE_TYPES.QUESTION);
        this.addPlatform(35, height - 6, 4, 2, this.TILE_TYPES.BRICK);
        this.addPlatform(45, height - 4, 1, 1, this.TILE_TYPES.QUESTION);
        this.addPlatform(55, height - 12, 6, 1, this.TILE_TYPES.BRICK);
        this.addPlatform(65, height - 8, 2, 1, this.TILE_TYPES.QUESTION);
        
        // Trous plus larges
        this.addGap(75, 8);
        this.addGap(100, 6);
        this.addGap(130, 10);
        
        // Structure en escalier
        for (let i = 0; i < 8; i++) {
            this.addPlatform(140 + i * 2, height - 3 - i, 2, i + 1, this.TILE_TYPES.BRICK);
        }
        
        // Château et drapeau
        this.addCastle(width - 15, height - 8);
        this.addFlag(width - 25, height - 10);
        
        this.addBackgroundElements();
    }
    
    generateRandomLevel(levelNumber) {
        const width = this.tiles[0].length;
        const height = this.tiles.length;
        
        // Sol de base
        for (let x = 0; x < width; x++) {
            for (let y = height - 2; y < height; y++) {
                this.tiles[y][x] = this.TILE_TYPES.GROUND;
            }
        }
        
        // Génération procédurale basée sur le numéro de niveau
        const difficulty = Math.min(levelNumber, 10);
        const platformCount = 10 + difficulty * 2;
        const gapCount = 2 + Math.floor(difficulty / 2);
        
        for (let i = 0; i < platformCount; i++) {
            const x = 20 + (i * (width - 50)) / platformCount;
            const y = height - 4 - Math.random() * 8;
            const w = 1 + Math.random() * 4;
            const h = 1 + Math.random() * 2;
            const type = Math.random() < 0.3 ? this.TILE_TYPES.QUESTION : this.TILE_TYPES.BRICK;
            
            this.addPlatform(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h), type);
        }
        
        // Trous aléatoires
        for (let i = 0; i < gapCount; i++) {
            const x = 50 + Math.random() * (width - 100);
            const w = 3 + Math.random() * (5 + difficulty);
            this.addGap(Math.floor(x), Math.floor(w));
        }
        
        // Château et drapeau
        this.addCastle(width - 15, height - 8);
        this.addFlag(width - 25, height - 10);
        
        this.addBackgroundElements();
    }
    
    addPlatform(x, y, width, height, tileType) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const tileX = x + dx;
                const tileY = y + dy;
                if (this.isValidTilePosition(tileX, tileY)) {
                    this.tiles[tileY][tileX] = tileType;
                }
            }
        }
    }
    
    addGap(x, width) {
        const height = this.tiles.length;
        for (let dx = 0; dx < width; dx++) {
            for (let dy = height - 2; dy < height; dy++) {
                const tileX = x + dx;
                if (this.isValidTilePosition(tileX, dy)) {
                    this.tiles[dy][tileX] = this.TILE_TYPES.EMPTY;
                }
            }
        }
    }
    
    addCastle(x, y) {
        // Structure simple de château
        const castle = [
            [1,0,1,0,1,0,1],
            [1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1],
            [1,1,0,1,0,1,1],
            [1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1]
        ];
        
        for (let row = 0; row < castle.length; row++) {
            for (let col = 0; col < castle[row].length; col++) {
                if (castle[row][col] === 1) {
                    const tileX = x + col;
                    const tileY = y + row;
                    if (this.isValidTilePosition(tileX, tileY)) {
                        this.tiles[tileY][tileX] = this.TILE_TYPES.CASTLE;
                    }
                }
            }
        }
    }
    
    addFlag(x, y) {
        // Mât du drapeau
        for (let i = 0; i < 10; i++) {
            const tileY = y + i;
            if (this.isValidTilePosition(x, tileY)) {
                this.tiles[tileY][x] = this.TILE_TYPES.FLAG;
            }
        }
        
        // Créer l'entité drapeau pour la collision de fin
        const flag = new Flag(this.game, x * this.TILE_SIZE, y * this.TILE_SIZE);
        this.game.entityManager.addEntity(flag);
    }
    
    addBackgroundElements() {
        const width = this.tiles[0].length;
        const height = this.tiles.length;
        
        // Nuages
        for (let i = 0; i < 5; i++) {
            this.backgroundElements.push({
                type: 'cloud',
                x: Math.random() * width * this.TILE_SIZE,
                y: Math.random() * height * this.TILE_SIZE * 0.3,
                size: 1 + Math.random() * 2
            });
        }
        
        // Collines
        for (let i = 0; i < 3; i++) {
            this.backgroundElements.push({
                type: 'hill',
                x: i * width * this.TILE_SIZE / 3,
                y: height * this.TILE_SIZE - 100,
                size: 1 + Math.random()
            });
        }
        
        // Buissons
        for (let i = 0; i < 8; i++) {
            this.backgroundElements.push({
                type: 'bush',
                x: Math.random() * width * this.TILE_SIZE,
                y: height * this.TILE_SIZE - 64,
                size: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    populateLevel() {
        const width = this.tiles[0].length;
        const height = this.tiles.length;
        
        // Placer les ennemis
        const enemyCount = 5 + this.currentLevel * 2;
        for (let i = 0; i < enemyCount; i++) {
            const x = (50 + Math.random() * (width - 100)) * this.TILE_SIZE;
            const y = (height - 3) * this.TILE_SIZE;
            
            // Types d'ennemis selon le niveau
            let enemyType = 'goomba';
            if (this.currentLevel > 1 && Math.random() < 0.4) enemyType = 'koopa';
            if (this.currentLevel > 3 && Math.random() < 0.2) enemyType = 'spiny';
            
            const enemy = EnemyFactory.createEnemy(enemyType, this.game, x, y);
            this.game.entityManager.addEntity(enemy);
        }
        
        // Placer les power-ups dans les blocs question
        this.placePowerUps();
        
        // Placer quelques pièces
        this.placeCoins();
    }
    
    placePowerUps() {
        const width = this.tiles[0].length;
        const height = this.tiles.length;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (this.tiles[y][x] === this.TILE_TYPES.QUESTION) {
                    // 60% chance d'avoir un power-up
                    if (Math.random() < 0.6) {
                        const powerupType = Math.random() < 0.7 ? 'mushroom' : 'fireflower';
                        const block = new QuestionBlock(
                            this.game, 
                            x * this.TILE_SIZE, 
                            y * this.TILE_SIZE,
                            powerupType
                        );
                        this.game.entityManager.addEntity(block);
                    }
                }
            }
        }
    }
    
    placeCoins() {
        const coinCount = 10 + this.currentLevel * 3;
        const width = this.tiles[0].length;
        const height = this.tiles.length;
        
        for (let i = 0; i < coinCount; i++) {
            const x = (20 + Math.random() * (width - 40)) * this.TILE_SIZE;
            const y = (height - 5 - Math.random() * 8) * this.TILE_SIZE;
            
            const coin = new Coin(this.game, x, y);
            this.game.entityManager.addEntity(coin);
        }
    }
    
    render(ctx) {
        this.renderBackground(ctx);
        this.renderTiles(ctx);
    }
    
    renderBackground(ctx) {
        // Dessiner les éléments de décor
        for (let element of this.backgroundElements) {
            switch (element.type) {
                case 'cloud':
                    this.renderCloud(ctx, element);
                    break;
                case 'hill':
                    this.renderHill(ctx, element);
                    break;
                case 'bush':
                    this.renderBush(ctx, element);
                    break;
            }
        }
    }
    
    renderCloud(ctx, cloud) {
        ctx.fillStyle = '#FFFFFF';
        const size = cloud.size * 40;
        ctx.fillRect(cloud.x, cloud.y, size, size * 0.6);
        ctx.fillRect(cloud.x + size * 0.2, cloud.y - size * 0.2, size * 0.6, size * 0.4);
        ctx.fillRect(cloud.x + size * 0.4, cloud.y - size * 0.1, size * 0.4, size * 0.3);
    }
    
    renderHill(ctx, hill) {
        ctx.fillStyle = '#90EE90';
        const size = hill.size * 80;
        ctx.beginPath();
        ctx.arc(hill.x + size/2, hill.y, size/2, 0, Math.PI);
        ctx.fill();
    }
    
    renderBush(ctx, bush) {
        ctx.fillStyle = '#228B22';
        const size = bush.size * 30;
        ctx.fillRect(bush.x, bush.y, size, size * 0.8);
        ctx.fillRect(bush.x + size * 0.2, bush.y - size * 0.2, size * 0.6, size * 0.6);
    }
    
    renderTiles(ctx) {
        const startX = Math.floor(this.game.camera.x / this.TILE_SIZE);
        const endX = Math.min(startX + Math.ceil(this.game.canvas.width / this.TILE_SIZE) + 1, this.tiles[0].length);
        const startY = Math.floor(this.game.camera.y / this.TILE_SIZE);
        const endY = Math.min(startY + Math.ceil(this.game.canvas.height / this.TILE_SIZE) + 1, this.tiles.length);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (this.isValidTilePosition(x, y)) {
                    this.renderTile(ctx, x, y, this.tiles[y][x]);
                }
            }
        }
    }
    
    renderTile(ctx, x, y, tileType) {
        const screenX = x * this.TILE_SIZE;
        const screenY = y * this.TILE_SIZE;
        
        switch (tileType) {
            case this.TILE_TYPES.GROUND:
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(screenX, screenY, this.TILE_SIZE, this.TILE_SIZE);
                break;
                
            case this.TILE_TYPES.BRICK:
                ctx.fillStyle = '#CD853F';
                ctx.fillRect(screenX, screenY, this.TILE_SIZE, this.TILE_SIZE);
                // Motif de briques
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                ctx.strokeRect(screenX, screenY, this.TILE_SIZE, this.TILE_SIZE);
                break;
                
            case this.TILE_TYPES.QUESTION:
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(screenX, screenY, this.TILE_SIZE, this.TILE_SIZE);
                // Point d'interrogation
                ctx.fillStyle = '#000000';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('?', screenX + this.TILE_SIZE/2, screenY + this.TILE_SIZE/2 + 6);
                break;
                
            case this.TILE_TYPES.PIPE:
                ctx.fillStyle = '#00AA00';
                ctx.fillRect(screenX, screenY, this.TILE_SIZE, this.TILE_SIZE);
                break;
                
            case this.TILE_TYPES.CASTLE:
                ctx.fillStyle = '#666666';
                ctx.fillRect(screenX, screenY, this.TILE_SIZE, this.TILE_SIZE);
                break;
                
            case this.TILE_TYPES.FLAG:
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(screenX + this.TILE_SIZE/2 - 2, screenY, 4, this.TILE_SIZE);
                break;
        }
    }
    
    isSolidTile(x, y) {
        if (!this.isValidTilePosition(x, y)) return false;
        
        const tileType = this.tiles[y][x];
        return tileType === this.TILE_TYPES.GROUND ||
               tileType === this.TILE_TYPES.BRICK ||
               tileType === this.TILE_TYPES.QUESTION ||
               tileType === this.TILE_TYPES.PIPE ||
               tileType === this.TILE_TYPES.CASTLE;
    }
    
    isValidTilePosition(x, y) {
        return x >= 0 && x < this.tiles[0].length && 
               y >= 0 && y < this.tiles.length;
    }
    
    getTileType(x, y) {
        if (!this.isValidTilePosition(x, y)) return this.TILE_TYPES.EMPTY;
        return this.tiles[y][x];
    }
}

/**
 * Entités de niveau (drapeau, blocs, etc.)
 */
class Flag extends Entity {
    constructor(game, x, y) {
        super(game, x, y, 32, 160);
        this.type = 'flag';
        this.collidable = true;
    }
    
    render(ctx) {
        // Mât
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 14, this.y, 4, this.height);
        
        // Drapeau
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x + 18, this.y + 20, 30, 20);
        
        // Motif du drapeau
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 20, this.y + 22, 6, 6);
        ctx.fillRect(this.x + 32, this.y + 28, 6, 6);
    }
}

class QuestionBlock extends Entity {
    constructor(game, x, y, contentType = 'coin') {
        super(game, x, y, 32, 32);
        this.type = 'block';
        this.contentType = contentType;
        this.hit = false;
        this.animationOffset = 0;
    }
    
    hit(mario) {
        if (this.hit) return;
        
        this.hit = true;
        this.collidable = false;
        
        // Créer le contenu
        switch (this.contentType) {
            case 'coin':
                const coin = new Coin(this.game, this.x, this.y - 32);
                coin.velocityY = -8; // Animation de saut
                this.game.entityManager.addEntity(coin);
                break;
                
            case 'mushroom':
                const mushroom = new PowerUp(this.game, this.x, this.y - 32, 'mushroom');
                this.game.entityManager.addEntity(mushroom);
                break;
                
            case 'fireflower':
                const flower = new PowerUp(this.game, this.x, this.y - 32, 'fireflower');
                this.game.entityManager.addEntity(flower);
                break;
        }
        
        this.game.audioSystem.playSound('block_hit');
        
        // Animation du bloc qui bouge
        this.animationOffset = -8;
    }
    
    update(deltaTime) {
        if (this.animationOffset < 0) {
            this.animationOffset += deltaTime / 30;
            if (this.animationOffset > 0) this.animationOffset = 0;
        }
    }
    
    render(ctx) {
        const y = this.y + this.animationOffset;
        
        if (this.hit) {
            // Bloc vide
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, y, this.width, this.height);
        } else {
            // Bloc question
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x, y, this.width, this.height);
            
            ctx.fillStyle = '#000000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('?', this.x + this.width/2, y + this.height/2 + 6);
        }
    }
}

window.MarioLevelManager = MarioLevelManager;
window.Flag = Flag;
window.QuestionBlock = QuestionBlock;
