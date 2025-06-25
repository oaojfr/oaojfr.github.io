/**
 * Système audio de Mario avec sons 8-bit générés
 */

class MarioAudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.backgroundMusic = null;
        this.masterVolume = 0.3;
        this.musicVolume = 0.2;
        this.sfxVolume = 0.4;
        this.enabled = true;
        
        // Effets sonores avec fréquences 8-bit
        this.sfxConfig = {
            jump: { freq: 440, duration: 0.1, type: 'square' },
            coin: { freq: 660, duration: 0.2, type: 'square' },
            powerup: { freq: 523, duration: 0.3, type: 'square' },
            death: { freq: 220, duration: 0.5, type: 'sawtooth' },
            enemy_defeat: { freq: 330, duration: 0.15, type: 'square' },
            pipe: { freq: 200, duration: 0.8, type: 'sine' },
            checkpoint: { freq: 880, duration: 0.4, type: 'square' },
            underground: { freq: 150, duration: 1.0, type: 'triangle' }
        };
        
        this.initAudioContext();
        this.preloadSounds();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio non disponible:', e);
            this.enabled = false;
        }
    }
    
    preloadSounds() {
        if (!this.enabled) return;
        
        // Créer tous les sons du jeu
        this.sounds = {
            jump: this.createJumpSound(),
            coin: this.createCoinSound(),
            powerup: this.createPowerUpSound(),
            stomp: this.createStompSound(),
            fireball: this.createFireballSound(),
            death: this.createDeathSound(),
            gameOver: this.createGameOverSound(),
            levelComplete: this.createLevelCompleteSound(),
            block_hit: this.createBlockHitSound(),
            enemy_defeat: this.createEnemyDefeatSound(),
            star: this.createStarSound(),
            damage: this.createDamageSound(),
            bump: this.createBumpSound(),
            '1up': this.create1UpSound()
        };
        
        // Musiques de fond
        this.backgroundMusic = {
            overworld: this.createOverworldMusic(),
            underground: this.createUndergroundMusic(),
            star: this.createStarMusic(),
            castle: this.createCastleMusic()
        };
    }
    
    // ===== SONS D'EFFETS =====
    
    createJumpSound() {
        return this.createTone([
            { freq: 523, duration: 0.1, volume: 0.3 },
            { freq: 659, duration: 0.15, volume: 0.2 }
        ]);
    }
    
    createCoinSound() {
        return this.createTone([
            { freq: 988, duration: 0.1, volume: 0.3 },
            { freq: 1319, duration: 0.2, volume: 0.2 }
        ]);
    }
    
    createPowerUpSound() {
        return this.createTone([
            { freq: 392, duration: 0.1, volume: 0.3 },
            { freq: 523, duration: 0.1, volume: 0.3 },
            { freq: 659, duration: 0.1, volume: 0.3 },
            { freq: 784, duration: 0.1, volume: 0.3 },
            { freq: 1047, duration: 0.3, volume: 0.2 }
        ]);
    }
    
    createStompSound() {
        return this.createTone([
            { freq: 220, duration: 0.05, volume: 0.4 },
            { freq: 110, duration: 0.1, volume: 0.3 }
        ]);
    }
    
    createFireballSound() {
        return this.createNoise(0.1, 0.3, 'pink');
    }
    
    createDeathSound() {
        return this.createTone([
            { freq: 523, duration: 0.2, volume: 0.4 },
            { freq: 494, duration: 0.2, volume: 0.4 },
            { freq: 466, duration: 0.2, volume: 0.4 },
            { freq: 440, duration: 0.2, volume: 0.4 },
            { freq: 415, duration: 0.2, volume: 0.4 },
            { freq: 392, duration: 0.4, volume: 0.3 }
        ]);
    }
    
    createGameOverSound() {
        return this.createTone([
            { freq: 262, duration: 0.5, volume: 0.4 },
            { freq: 247, duration: 0.5, volume: 0.4 },
            { freq: 220, duration: 0.5, volume: 0.4 },
            { freq: 196, duration: 1.0, volume: 0.3 }
        ]);
    }
    
    createLevelCompleteSound() {
        return this.createTone([
            { freq: 523, duration: 0.2, volume: 0.3 },
            { freq: 587, duration: 0.2, volume: 0.3 },
            { freq: 659, duration: 0.2, volume: 0.3 },
            { freq: 784, duration: 0.2, volume: 0.3 },
            { freq: 880, duration: 0.2, volume: 0.3 },
            { freq: 988, duration: 0.4, volume: 0.2 }
        ]);
    }
    
    createBlockHitSound() {
        return this.createTone([
            { freq: 330, duration: 0.05, volume: 0.4 },
            { freq: 440, duration: 0.1, volume: 0.3 }
        ]);
    }
    
    createEnemyDefeatSound() {
        return this.createTone([
            { freq: 196, duration: 0.1, volume: 0.3 },
            { freq: 262, duration: 0.2, volume: 0.2 }
        ]);
    }
    
    createStarSound() {
        return this.createTone([
            { freq: 659, duration: 0.1, volume: 0.3 },
            { freq: 784, duration: 0.1, volume: 0.3 },
            { freq: 880, duration: 0.1, volume: 0.3 },
            { freq: 1047, duration: 0.1, volume: 0.3 },
            { freq: 1319, duration: 0.2, volume: 0.2 }
        ]);
    }
    
    createDamageSound() {
        return this.createTone([
            { freq: 392, duration: 0.15, volume: 0.4 },
            { freq: 330, duration: 0.15, volume: 0.3 },
            { freq: 294, duration: 0.2, volume: 0.2 }
        ]);
    }
    
    createBumpSound() {
        return this.createTone([
            { freq: 147, duration: 0.1, volume: 0.4 }
        ]);
    }
    
    create1UpSound() {
        return this.createTone([
            { freq: 392, duration: 0.1, volume: 0.3 },
            { freq: 523, duration: 0.1, volume: 0.3 },
            { freq: 659, duration: 0.1, volume: 0.3 },
            { freq: 784, duration: 0.1, volume: 0.3 },
            { freq: 1047, duration: 0.1, volume: 0.3 },
            { freq: 1319, duration: 0.3, volume: 0.2 }
        ]);
    }
    
    // ===== MUSIQUES DE FOND =====
    
    createOverworldMusic() {
        // Mélodie simplifiée du thème principal de Mario
        const melody = [
            // Mesure 1
            { freq: 659, duration: 0.15 }, { freq: 659, duration: 0.15 }, { freq: 0, duration: 0.15 },
            { freq: 659, duration: 0.15 }, { freq: 0, duration: 0.15 }, { freq: 523, duration: 0.15 },
            { freq: 659, duration: 0.15 }, { freq: 0, duration: 0.15 },
            // Mesure 2  
            { freq: 784, duration: 0.3 }, { freq: 0, duration: 0.3 },
            { freq: 392, duration: 0.3 }, { freq: 0, duration: 0.3 },
            // Mesure 3
            { freq: 523, duration: 0.3 }, { freq: 0, duration: 0.15 },
            { freq: 392, duration: 0.3 }, { freq: 0, duration: 0.15 },
            { freq: 330, duration: 0.3 },
            // Mesure 4
            { freq: 440, duration: 0.15 }, { freq: 494, duration: 0.15 },
            { freq: 466, duration: 0.15 }, { freq: 440, duration: 0.15 },
            { freq: 392, duration: 0.15 }, { freq: 523, duration: 0.15 },
            { freq: 587, duration: 0.15 }, { freq: 523, duration: 0.15 }
        ];
        
        return this.createMelody(melody, true);
    }
    
    createUndergroundMusic() {
        // Thème souterrain plus sombre
        const melody = [
            { freq: 262, duration: 0.2 }, { freq: 262, duration: 0.2 },
            { freq: 262, duration: 0.2 }, { freq: 196, duration: 0.2 },
            { freq: 220, duration: 0.2 }, { freq: 196, duration: 0.2 },
            { freq: 175, duration: 0.4 }, { freq: 0, duration: 0.2 },
            { freq: 220, duration: 0.2 }, { freq: 247, duration: 0.2 },
            { freq: 262, duration: 0.4 }, { freq: 0, duration: 0.4 }
        ];
        
        return this.createMelody(melody, true);
    }
    
    createStarMusic() {
        // Musique accélérée pour l'étoile
        const melody = [
            { freq: 523, duration: 0.1 }, { freq: 659, duration: 0.1 },
            { freq: 784, duration: 0.1 }, { freq: 1047, duration: 0.1 },
            { freq: 880, duration: 0.1 }, { freq: 784, duration: 0.1 },
            { freq: 659, duration: 0.1 }, { freq: 523, duration: 0.1 },
            { freq: 659, duration: 0.1 }, { freq: 784, duration: 0.1 },
            { freq: 880, duration: 0.1 }, { freq: 784, duration: 0.1 },
            { freq: 659, duration: 0.1 }, { freq: 523, duration: 0.1 },
            { freq: 440, duration: 0.2 }
        ];
        
        return this.createMelody(melody, true);
    }
    
    createCastleMusic() {
        // Musique de château/boss
        const melody = [
            { freq: 196, duration: 0.3 }, { freq: 220, duration: 0.3 },
            { freq: 247, duration: 0.3 }, { freq: 262, duration: 0.3 },
            { freq: 294, duration: 0.3 }, { freq: 330, duration: 0.3 },
            { freq: 370, duration: 0.3 }, { freq: 392, duration: 0.6 },
            { freq: 0, duration: 0.3 }
        ];
        
        return this.createMelody(melody, true);
    }
    
    // ===== MÉTHODES UTILITAIRES =====
    
    createTone(notes) {
        if (!this.enabled) return null;
        
        return () => {
            let time = this.audioContext.currentTime;
            
            notes.forEach(note => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(note.freq, time);
                oscillator.type = 'square'; // Son 8-bit
                
                gainNode.gain.setValueAtTime(0, time);
                gainNode.gain.linearRampToValueAtTime(note.volume * this.sfxVolume * this.masterVolume, time + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, time + note.duration);
                
                oscillator.start(time);
                oscillator.stop(time + note.duration);
                
                time += note.duration;
            });
        };
    }
    
    createNoise(duration, volume, type = 'white') {
        if (!this.enabled) return null;
        
        return () => {
            const bufferSize = this.audioContext.sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * volume * this.sfxVolume * this.masterVolume;
            }
            
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start();
        };
    }
    
    createMelody(melody, loop = false) {
        if (!this.enabled) return null;
        
        let currentSource = null;
        let isPlaying = false;
        
        const playMelody = () => {
            if (!this.enabled || isPlaying) return;
            
            isPlaying = true;
            let time = this.audioContext.currentTime;
            
            const playNote = (noteIndex) => {
                if (noteIndex >= melody.length) {
                    if (loop) {
                        setTimeout(() => {
                            isPlaying = false;
                            playMelody();
                        }, 100);
                    } else {
                        isPlaying = false;
                    }
                    return;
                }
                
                const note = melody[noteIndex];
                
                if (note.freq > 0) {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(note.freq, time);
                    oscillator.type = 'square';
                    
                    const volume = (note.volume || 0.1) * this.musicVolume * this.masterVolume;
                    gainNode.gain.setValueAtTime(0, time);
                    gainNode.gain.linearRampToValueAtTime(volume, time + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, time + note.duration);
                    
                    oscillator.start(time);
                    oscillator.stop(time + note.duration);
                    
                    currentSource = oscillator;
                }
                
                time += note.duration;
                setTimeout(() => playNote(noteIndex + 1), note.duration * 1000);
            };
            
            playNote(0);
        };
        
        return {
            play: playMelody,
            stop: () => {
                isPlaying = false;
                if (currentSource) {
                    try {
                        currentSource.stop();
                    } catch (e) {
                        // Source déjà arrêtée
                    }
                    currentSource = null;
                }
            },
            isPlaying: () => isPlaying
        };
    }
    
    // ===== MÉTHODES PUBLIQUES =====
    
    playSound(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;
        
        try {
            // Reprendre le contexte audio si nécessaire (requis par les navigateurs modernes)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.sounds[soundName]();
        } catch (e) {
            console.warn(`Erreur lecture son ${soundName}:`, e);
        }
    }
    
    playBackgroundMusic(theme = 'overworld') {
        if (!this.enabled) return;
        
        // Arrêter la musique actuelle
        this.stopBackgroundMusic();
        
        // Choisir la mélodie selon le thème
        let melody, tempo;
        
        switch (theme) {
            case 'underground':
                melody = [
                    261, 293, 329, 261, 293, 329,
                    392, 440, 392, 329, 293, 261,
                    220, 246, 261, 293, 329, 392,
                    440, 392, 329, 293, 261, 220
                ];
                tempo = 500;
                break;
                
            case 'castle':
                melody = [
                    220, 220, 220, 174, 220, 261,
                    174, 220, 261, 293, 220, 174,
                    146, 174, 220, 261, 293, 329,
                    261, 220, 174, 146, 130, 146
                ];
                tempo = 600;
                break;
                
            default: // overworld
                melody = [
                    659, 659, 0, 659, 0, 523, 659, 0,
                    784, 0, 0, 0, 392, 0, 0, 0,
                    523, 0, 0, 392, 0, 0, 330, 0,
                    0, 440, 0, 494, 0, 466, 440, 0
                ];
                tempo = 400;
                break;
        }
        
        this.currentMelody = melody;
        this.currentTempo = tempo;
        this.currentTheme = theme;
        this.playMelodyNote(0);
    }
    
    stopBackgroundMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }
    
    pauseBackgroundMusic() {
        // Note: Web Audio API ne supporte pas vraiment la pause
        // On arrête et on devra redémarrer
        this.stopBackgroundMusic();
    }
    
    resumeBackgroundMusic() {
        // Redémarrer la musique du monde actuel
        this.playBackgroundMusic('overworld');
    }
    
    stopAllSounds() {
        this.stopBackgroundMusic();
        // Les sons d'effets s'arrêtent automatiquement
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    toggleEnabled() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopAllSounds();
        }
        return this.enabled;
    }
    
    isEnabled() {
        return this.enabled;
    }
}

window.MarioAudioManager = MarioAudioManager;
