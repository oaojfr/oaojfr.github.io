/**
 * Système d'interface utilisateur de Mario
 */

class MarioUI {
    constructor(game) {
        this.game = game;
        this.font = '16px Arial';
        this.largeFont = '24px Arial';
        this.hudHeight = 60;
        
        // Messages temporaires
        this.messages = [];
        
        // États d'affichage
        this.showDebug = false;
        this.showFPS = true;
        this.lastFPSUpdate = 0;
        this.fps = 0;
        this.frameCount = 0;
    }
    
    render(ctx) {
        this.renderHUD(ctx);
        this.renderMessages(ctx);
        this.renderGameState(ctx);
        
        if (this.showDebug) {
            this.renderDebugInfo(ctx);
        }
        
        if (this.showFPS) {
            this.renderFPS(ctx);
        }
    }
    
    renderHUD(ctx) {
        // Fond du HUD
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.game.canvas.width, this.hudHeight);
        
        // Texte du HUD
        ctx.fillStyle = '#FFFFFF';
        ctx.font = this.font;
        ctx.textAlign = 'left';
        
        // Score
        ctx.fillText(`MARIO`, 20, 25);
        ctx.fillText(`${this.game.score.toString().padStart(6, '0')}`, 20, 45);
        
        // Pièces
        ctx.fillText(`○x${this.game.coins.toString().padStart(2, '0')}`, 150, 25);
        
        // Niveau
        ctx.fillText(`MONDE`, 250, 25);
        ctx.fillText(`${this.game.currentLevel}-1`, 250, 45);
        
        // Temps
        ctx.fillText(`TEMPS`, 350, 25);
        ctx.fillText(`${Math.max(0, Math.floor(this.game.time))}`, 350, 45);
        
        // Vies (à droite)
        ctx.textAlign = 'right';
        ctx.fillText(`VIES: ${this.game.lives}`, this.game.canvas.width - 20, 25);
        
        // État de puissance de Mario
        if (this.game.mario) {
            const powerStates = ['PETIT', 'GRAND', 'FEU', 'ÉTOILE'];
            const powerState = powerStates[this.game.mario.powerState] || 'PETIT';
            ctx.fillText(`${powerState}`, this.game.canvas.width - 20, 45);
        }
    }
    
    renderMessages(ctx) {
        // Afficher les messages temporaires
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const message = this.messages[i];
            message.life -= 16; // Approximation du deltaTime
            
            if (message.life <= 0) {
                this.messages.splice(i, 1);
                continue;
            }
            
            const alpha = Math.min(1, message.life / 1000);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.font = message.size || this.largeFont;
            ctx.textAlign = 'center';
            
            const y = this.game.canvas.height / 2 + (i * 40) - 100;
            ctx.fillText(message.text, this.game.canvas.width / 2, y);
        }
    }
    
    renderGameState(ctx) {
        const centerX = this.game.canvas.width / 2;
        const centerY = this.game.canvas.height / 2;
        
        switch (this.game.gameState) {
            case 'paused':
                this.renderPauseScreen(ctx, centerX, centerY);
                break;
                
            case 'gameOver':
                this.renderGameOverScreen(ctx, centerX, centerY);
                break;
                
            case 'levelComplete':
                this.renderLevelCompleteScreen(ctx, centerX, centerY);
                break;
        }
    }
    
    renderPauseScreen(ctx, centerX, centerY) {
        // Fond semi-transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        // Texte de pause
        ctx.fillStyle = '#FFFFFF';
        ctx.font = this.largeFont;
        ctx.textAlign = 'center';
        ctx.fillText('PAUSE', centerX, centerY - 20);
        
        ctx.font = this.font;
        ctx.fillText('Appuyez sur P pour reprendre', centerX, centerY + 20);
    }
    
    renderGameOverScreen(ctx, centerX, centerY) {
        // Fond noir
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        // Texte Game Over
        ctx.fillStyle = '#FF0000';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', centerX, centerY - 40);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = this.font;
        ctx.fillText(`Score final: ${this.game.score}`, centerX, centerY);
        ctx.fillText('Appuyez sur R pour recommencer', centerX, centerY + 40);
    }
    
    renderLevelCompleteScreen(ctx, centerX, centerY) {
        // Fond avec gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.game.canvas.height);
        gradient.addColorStop(0, 'rgba(0, 100, 200, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 50, 100, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        // Texte de fin de niveau
        ctx.fillStyle = '#FFD700';
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('NIVEAU TERMINÉ !', centerX, centerY - 60);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = this.font;
        ctx.fillText(`Niveau ${this.game.currentLevel} terminé`, centerX, centerY - 20);
        ctx.fillText(`Bonus de temps: ${Math.floor(this.game.time) * 50}`, centerX, centerY + 20);
        ctx.fillText('Niveau suivant dans 3 secondes...', centerX, centerY + 60);
    }
    
    renderDebugInfo(ctx) {
        if (!this.game.mario) return;
        
        const mario = this.game.mario;
        const debugY = this.hudHeight + 20;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, debugY, 300, 200);
        
        ctx.fillStyle = '#00FF00';
        ctx.font = '12px Courier';
        ctx.textAlign = 'left';
        
        const debugInfo = [
            `Position: (${Math.floor(mario.x)}, ${Math.floor(mario.y)})`,
            `Vitesse: (${mario.velocityX.toFixed(2)}, ${mario.velocityY.toFixed(2)})`,
            `État: ${mario.state}`,
            `Au sol: ${mario.onGround}`,
            `Puissance: ${mario.powerState}`,
            `Invulnérable: ${mario.invulnerable}`,
            `Caméra X: ${Math.floor(this.game.camera.x)}`,
            `Entités: ${this.game.entityManager.entities.length}`,
            `Vitesse jeu: ${this.game.SPEED_MULTIPLIER.toFixed(1)}x`,
            `Niveau: ${this.game.currentLevel}`
        ];
        
        debugInfo.forEach((info, index) => {
            ctx.fillText(info, 20, debugY + 20 + index * 15);
        });
    }
    
    renderFPS(ctx) {
        this.frameCount++;
        const currentTime = Date.now();
        
        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.game.canvas.width - 80, 10, 70, 30);
        
        ctx.fillStyle = '#00FF00';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`FPS: ${this.fps}`, this.game.canvas.width - 10, 30);
    }
    
    showMessage(text, duration = 2000, size = null) {
        this.messages.push({
            text: text,
            life: duration,
            size: size
        });
    }
    
    showScorePopup(x, y, points, text = null) {
        const worldPos = this.game.getWorldPosition(x, y);
        const popup = new ScorePopup(this.game, worldPos.x, worldPos.y, points, text);
        this.game.entityManager.addEntity(popup);
    }
    
    toggleDebug() {
        this.showDebug = !this.showDebug;
    }
    
    toggleFPS() {
        this.showFPS = !this.showFPS;
    }
    
    // Méthodes pour afficher des informations de progression
    showLevelStart(levelNumber) {
        this.showMessage(`NIVEAU ${levelNumber}`, 2000, '32px Arial');
    }
    
    showPowerUpCollected(powerType) {
        const messages = {
            'mushroom': 'SUPER MARIO !',
            'fireflower': 'MARIO FEU !',
            'star': 'MARIO ÉTOILE !',
            '1up': 'VIE BONUS !'
        };
        
        this.showMessage(messages[powerType] || 'POWER-UP !', 1500, '24px Arial');
    }
    
    showLifeLost() {
        this.showMessage('MARIO PERDU !', 2000, '24px Arial');
    }
    
    showGameOver() {
        this.showMessage('GAME OVER', 3000, '32px Arial');
    }
    
    showLevelComplete() {
        this.showMessage('NIVEAU TERMINÉ !', 3000, '28px Arial');
    }
    
    // Animation de transition entre niveaux
    renderLevelTransition(ctx, progress) {
        // progress va de 0 à 1
        const alpha = Math.sin(progress * Math.PI);
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    }
    
    // Rendu du mini-jeu de fin de niveau (baisse de drapeau)
    renderFlagAnimation(ctx, flag, mario) {
        // Animation spéciale quand Mario touche le drapeau
        if (flag && mario) {
            const screenPos = this.game.getScreenPosition(flag.x, flag.y);
            
            // Points selon la hauteur où Mario touche le drapeau
            const height = flag.y + flag.height - mario.y;
            const maxHeight = flag.height;
            const pointsMultiplier = Math.floor((height / maxHeight) * 10);
            const points = pointsMultiplier * 100;
            
            if (points > 0) {
                ctx.fillStyle = '#FFD700';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${points}`, screenPos.x + 50, screenPos.y - 20);
            }
        }
    }
}

window.MarioUI = MarioUI;
