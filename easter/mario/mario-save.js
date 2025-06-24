/**
 * Système de sauvegarde pour Mario
 */

class MarioSaveSystem {
    constructor(game) {
        this.game = game;
        this.saveKey = 'mario_save_data';
        this.highScoreKey = 'mario_high_scores';
    }
    
    saveGameState() {
        const saveData = {
            currentLevel: this.game.currentLevel,
            levelType: this.game.levelManager.levelType,
            score: this.game.score,
            coins: this.game.coins,
            lives: this.game.lives,
            time: this.game.time,
            checkpoint: this.game.checkpoint,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            console.log('Partie sauvegardée:', saveData);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            return false;
        }
    }
    
    loadGameState() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            if (!saveData) return null;
            
            const data = JSON.parse(saveData);
            console.log('Partie chargée:', data);
            return data;
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            return null;
        }
    }
    
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log('Sauvegarde supprimée');
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            return false;
        }
    }
    
    saveHighScore(score, level) {
        try {
            let highScores = this.getHighScores();
            
            // Ajouter le nouveau score
            highScores.push({
                score: score,
                level: level,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now()
            });
            
            // Trier par score décroissant et garder les 10 meilleurs
            highScores.sort((a, b) => b.score - a.score);
            highScores = highScores.slice(0, 10);
            
            localStorage.setItem(this.highScoreKey, JSON.stringify(highScores));
            console.log('High score sauvegardé:', score);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du high score:', error);
            return false;
        }
    }
    
    getHighScores() {
        try {
            const highScores = localStorage.getItem(this.highScoreKey);
            return highScores ? JSON.parse(highScores) : [];
        } catch (error) {
            console.error('Erreur lors du chargement des high scores:', error);
            return [];
        }
    }
    
    isNewHighScore(score) {
        const highScores = this.getHighScores();
        return highScores.length < 10 || score > (highScores[highScores.length - 1]?.score || 0);
    }
    
    exportSave() {
        const saveData = this.loadGameState();
        const highScores = this.getHighScores();
        
        const exportData = {
            save: saveData,
            highScores: highScores,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Créer un lien de téléchargement
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mario_save.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    importSave(fileContent) {
        try {
            const importData = JSON.parse(fileContent);
            
            if (importData.save) {
                localStorage.setItem(this.saveKey, JSON.stringify(importData.save));
            }
            
            if (importData.highScores) {
                localStorage.setItem(this.highScoreKey, JSON.stringify(importData.highScores));
            }
            
            console.log('Sauvegarde importée avec succès');
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'importation:', error);
            return false;
        }
    }
    
    // Sauvegarde automatique périodique
    enableAutoSave(intervalMinutes = 2) {
        setInterval(() => {
            if (this.game.gameState === 'playing') {
                this.saveGameState();
            }
        }, intervalMinutes * 60 * 1000);
        
        console.log(`Sauvegarde automatique activée (${intervalMinutes} minutes)`);
    }
    
    // Statistiques de jeu
    getGameStats() {
        const saveData = this.loadGameState();
        const highScores = this.getHighScores();
        
        return {
            totalGames: highScores.length,
            bestScore: highScores[0]?.score || 0,
            bestLevel: Math.max(...highScores.map(s => s.level || 1)),
            currentProgress: saveData ? {
                level: saveData.currentLevel,
                score: saveData.score,
                coins: saveData.coins
            } : null
        };
    }
}

window.MarioSaveSystem = MarioSaveSystem;
