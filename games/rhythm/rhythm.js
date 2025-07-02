/**
 * RHYTHM HERO - JEU DE RYTHME AVEC ANALYSE AUDIO AUTOMATIQUE
 * Le joueur uploade son MP3 et le jeu génère automatiquement les notes
 * Touches: F, G, J, K
 */

class RhythmGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration du jeu
        this.gameState = 'menu'; // menu, processing, playing, paused, gameOver
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalNotes = 0;
        this.hitNotes = 0;
        
        // Configuration audio
        this.audioContext = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.analyser = null;
        this.currentTime = 0;
        this.songDuration = 0;
        this.isPlaying = false;
        this.startTime = 0;
        
        // Configuration des notes
        this.notes = []; // Toutes les notes générées
        this.activeNotes = []; // Notes actuellement à l'écran
        this.lanes = 4; // F, G, J, K
        this.laneWidth = 120;
        this.noteSpeed = 500; // pixels par seconde (configurable)
        this.hitZoneY = this.canvas.height - 150;
        this.noteHeight = 20;
        
        // Configuration avancée du gameplay
        this.audioOffset = 0; // Calibration audio en ms
        this.noteStreakBonus = 1; // Multiplicateur de streak
        this.feverMode = false; // Mode fever temporaire
        this.feverTime = 0; // Temps restant en fever mode
        
        // Système de sauvegarde
        this.gameSettings = this.loadSettings();
        this.highScores = this.loadHighScores();
        
        // Configuration de l'analyse audio avancée
        this.difficulty = 'medium'; // easy, medium, hard, expert
        this.bpm = 120; // BPM détecté automatiquement
        this.beatInterval = 0.5; // Interval entre beats en secondes
        this.analysisResolution = 25; // Analyse toutes les 25ms pour plus de précision
        
        // Seuils par difficulté (plus permissifs)
        this.difficultySettings = {
            easy: {
                beatThreshold: 0.1, // Très bas pour garder toutes les notes
                noteReduction: 0.3, // Garde 30% des notes
                minNoteInterval: 0.4, // 400ms minimum entre notes
                holdNoteChance: 0.1, // 10% de notes longues
                name: 'Facile'
            },
            medium: {
                beatThreshold: 0.15, // Beaucoup plus bas
                noteReduction: 0.6, // Garde 60% des notes  
                minNoteInterval: 0.25, // 250ms minimum
                holdNoteChance: 0.2, // 20% de notes longues
                name: 'Moyen'
            },
            hard: {
                beatThreshold: 0.2, // Plus bas aussi
                noteReduction: 0.8, // Garde 80% des notes
                minNoteInterval: 0.15, // 150ms minimum
                holdNoteChance: 0.3, // 30% de notes longues
                name: 'Difficile'
            },
            expert: {
                beatThreshold: 0.25, // Légèrement plus strict
                noteReduction: 1.0, // Garde toutes les notes
                minNoteInterval: 0.1, // 100ms minimum
                holdNoteChance: 0.4, // 40% de notes longues
                name: 'Expert'
            }
        };
        
        // Couleurs des lanes (F, G, J, K)
        this.laneColors = [
            '#ff6b6b', // F - Rouge
            '#4ecdc4', // G - Cyan
            '#45b7d1', // J - Bleu
            '#96ceb4'  // K - Vert
        ];
        
        // Touches mappées
        this.keyMapping = {
            'f': 0,
            'g': 1,
            'j': 2,
            'k': 3
        };
        
        // État des touches
        this.keysPressed = [false, false, false, false];
        this.keyPressTime = [0, 0, 0, 0];
        
        // Effets visuels
        this.particles = [];
        this.hitEffects = [];
        this.backgroundPulse = 0;
        this.waveformData = [];
        this.screenShake = 0;
        this.trails = []; // Traînées des notes
        this.backgroundBeats = []; // Effets de background réactifs
        
        // Statistiques et progression
        this.gameStats = {
            totalNotesHit: 0,
            perfectHits: 0,
            greatHits: 0,
            goodHits: 0,
            okHits: 0,
            missedNotes: 0,
            longestStreak: 0,
            songsPlayed: 0,
            totalPlayTime: 0
        };
        
        this.initializeGame();
    }
    
    // Système de sauvegarde
    loadSettings() {
        try {
            const saved = localStorage.getItem('rhythmHero_settings');
            return saved ? JSON.parse(saved) : {
                noteSpeed: 500,
                audioOffset: 0,
                volume: 1.0,
                showTrails: true,
                showParticles: true,
                screenShake: true
            };
        } catch (e) {
            console.warn('Erreur chargement paramètres:', e);
            return {};
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('rhythmHero_settings', JSON.stringify(this.gameSettings));
        } catch (e) {
            console.warn('Erreur sauvegarde paramètres:', e);
        }
    }
    
    loadHighScores() {
        try {
            const saved = localStorage.getItem('rhythmHero_highScores');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Erreur chargement scores:', e);
            return [];
        }
    }
    
    saveHighScore(score, accuracy, combo, difficulty, songName) {
        try {
            const newScore = {
                score,
                accuracy,
                combo,
                difficulty,
                songName: songName || 'Chanson inconnue',
                date: new Date().toISOString(),
                bpm: this.bpm
            };
            
            this.highScores.push(newScore);
            this.highScores.sort((a, b) => b.score - a.score);
            this.highScores = this.highScores.slice(0, 10); // Garder top 10
            
            localStorage.setItem('rhythmHero_highScores', JSON.stringify(this.highScores));
        } catch (e) {
            console.warn('Erreur sauvegarde score:', e);
        }
    }
    
    initializeGame() {
        this.setupEventListeners();
        this.resizeCanvas();
        this.setupFileUpload();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.gameLoop();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Garder un ratio 16:9 avec une taille maximale
        const maxWidth = Math.min(1200, rect.width - 40);
        const maxHeight = Math.min(700, rect.height - 40);
        
        if (maxWidth / maxHeight > 16/9) {
            this.canvas.height = maxHeight;
            this.canvas.width = maxHeight * (16/9);
        } else {
            this.canvas.width = maxWidth;
            this.canvas.height = maxWidth * (9/16);
        }
        
        // Recalculer les positions
        this.hitZoneY = this.canvas.height - 150;
        this.laneWidth = this.canvas.width / this.lanes;
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            // Contrôles généraux
            if (key === ' ' || key === 'escape') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
                return;
            }
            
            // Contrôles de jeu
            if (this.gameState === 'playing' && this.keyMapping.hasOwnProperty(key)) {
                const laneIndex = this.keyMapping[key];
                if (!this.keysPressed[laneIndex]) {
                    this.keysPressed[laneIndex] = true;
                    this.keyPressTime[laneIndex] = this.currentTime;
                    this.checkNoteHit(laneIndex);
                    this.updateKeyIndicator(key, true);
                }
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keyMapping.hasOwnProperty(key)) {
                const laneIndex = this.keyMapping[key];
                this.keysPressed[laneIndex] = false;
                this.updateKeyIndicator(key, false);
                
                // Gérer la fin des notes longues
                if (this.gameState === 'playing') {
                    this.releaseHoldNote(laneIndex);
                }
            }
        });
    }
    
    setupFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        // Gestion de la sélection de difficulté
        this.setupDifficultySelector();
        
        // Click sur la zone d'upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Sélection de fichier
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.loadAudioFile(e.target.files[0]);
            }
        });
        
        // Drag & Drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.type.startsWith('audio/')) {
                    this.loadAudioFile(file);
                } else {
                    alert('Veuillez sélectionner un fichier audio valide.');
                }
            }
        });
    }
    
    setupDifficultySelector() {
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Retirer la classe active de tous les boutons
                difficultyButtons.forEach(b => b.classList.remove('active'));
                
                // Ajouter la classe active au bouton cliqué
                btn.classList.add('active');
                
                // Mettre à jour la difficulté
                this.difficulty = btn.dataset.difficulty;
                console.log(`🎯 Difficulté sélectionnée: ${this.difficultySettings[this.difficulty].name}`);
            });
        });
    }
    
    async loadAudioFile(file) {
        try {
            this.gameState = 'processing';
            this.showProcessingOverlay();
            
            console.log('🎵 Chargement du fichier audio:', file.name);
            this.updateProcessingText('Chargement du fichier audio...');
            this.updateProgress(0, 'Chargement...', null);
            
            // Initialiser AudioContext
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Lire le fichier
            const arrayBuffer = await file.arrayBuffer();
            console.log('📁 Fichier lu, décodage en cours...');
            this.updateProcessingText('Décodage audio en cours...');
            this.updateProgress(5, 'Décodage...', null);
            
            // Décoder l'audio
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.songDuration = this.audioBuffer.duration;
            
            console.log(`🎼 Audio décodé: ${this.songDuration.toFixed(2)}s`);
            this.updateProcessingText('Audio décodé avec succès !');
            
            // Vérifier la durée (limiter à 5 minutes pour éviter les calculs trop longs)
            if (this.songDuration > 300) {
                console.log('⚠️ Fichier long détecté, troncature à 5 minutes');
                this.updateProcessingText('Fichier long détecté, optimisation en cours...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Timeout de sécurité pour l'analyse
            const analysisPromise = this.analyzeAudioAndGenerateNotes();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout: Analyse trop longue')), 30000); // 30 secondes max
            });
            
            await Promise.race([analysisPromise, timeoutPromise]);
            
            console.log(`🎯 ${this.notes.length} notes générées`);
            this.updateProcessingText(`Prêt ! ${this.notes.length} notes générées`);
            
            // Petit délai pour montrer le résultat
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Démarrer le jeu
            this.startGame();
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement:', error);
            
            if (error.message.includes('Timeout')) {
                alert('L\'analyse prend trop de temps. Essayez avec un fichier plus court ou en format MP3 compressé.');
            } else {
                alert('Erreur lors du chargement du fichier audio. Veuillez essayer un autre fichier.');
            }
            
            this.goToMenu();
        }
    }
    
    updateProcessingText(text) {
        const element = document.getElementById('processingText');
        if (element) {
            element.textContent = text;
        }
    }
    
    updateProgress(percent, step, stepNumber) {
        // Mettre à jour la barre de progression
        const progressFill = document.getElementById('progressFillOverlay');
        const progressPercent = document.getElementById('progressPercent');
        const progressStep = document.getElementById('progressStep');
        
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${Math.round(percent)}%`;
        if (progressStep) progressStep.textContent = step;
        
        // Mettre à jour les étapes visuelles
        if (stepNumber) {
            // Marquer les étapes précédentes comme terminées
            for (let i = 1; i < stepNumber; i++) {
                const stepEl = document.getElementById(`step${i}`);
                if (stepEl) {
                    stepEl.classList.remove('active');
                    stepEl.classList.add('completed');
                }
            }
            
            // Marquer l'étape actuelle comme active
            const currentStepEl = document.getElementById(`step${stepNumber}`);
            if (currentStepEl) {
                currentStepEl.classList.add('active');
                currentStepEl.classList.remove('completed');
            }
        }
    }
    
    async analyzeAudioAndGenerateNotes() {
        console.log('🔬 Analyse audio avancée en cours...');
        this.updateProgress(5, 'Initialisation de l\'analyse...', 1);
        
        // 1. Détection automatique du BPM (optimisée)
        this.updateProcessingText('🥁 Détection du BPM automatique...');
        this.updateProgress(15, 'Détection du BPM...', 1);
        this.bpm = await this.detectBPMOptimized();
        this.beatInterval = 60 / this.bpm;
        console.log(`🥁 BPM détecté: ${this.bpm} (${this.beatInterval.toFixed(2)}s par beat)`);
        
        // 2. Analyse audio simplifiée mais efficace
        this.updateProcessingText('📊 Analyse du signal audio...');
        this.updateProgress(35, 'Analyse des fréquences...', 2);
        const audioAnalysis = await this.performSimplifiedAnalysis();
        console.log('📊 Analyse audio terminée');
        
        // 3. Génération des beats basée sur l'énergie
        this.updateProcessingText('🎯 Détection des beats musicaux...');
        this.updateProgress(60, 'Génération des beats...', 3);
        const beats = this.generateBeatsFromAnalysis(audioAnalysis);
        console.log(`🎯 ${beats.length} beats générés`);
        
        // 4. Création des notes
        this.updateProcessingText('🎼 Génération des notes de jeu...');
        this.updateProgress(80, 'Création des notes...', 4);
        this.notes = this.createNotesFromBeats(beats);
        
        // 5. Application de la difficulté
        this.updateProcessingText(`⚙️ Adaptation au niveau ${this.difficultySettings[this.difficulty].name}...`);
        this.updateProgress(95, 'Finalisation...', 4);
        this.applyDifficultyFilter();
        
        // Trier les notes par temps
        this.notes.sort((a, b) => a.time - b.time);
        this.totalNotes = this.notes.length;
        
        // S'assurer que toutes les notes ont la propriété 'spawned'
        this.notes.forEach(note => {
            if (note.spawned === undefined) {
                note.spawned = false;
            }
        });
        
        this.updateProgress(100, 'Terminé !', 4);
        console.log(`🎼 Analyse terminée: ${this.notes.length} notes générées pour le niveau ${this.difficultySettings[this.difficulty].name}`);
        
        // Debug final: afficher quelques notes
        if (this.notes.length > 0) {
            console.log('📋 Résumé des notes générées:');
            console.log(`   Total: ${this.notes.length} notes`);
            console.log(`   Première note: time=${this.notes[0].time.toFixed(2)}s, lane=${this.notes[0].lane}`);
            console.log(`   Dernière note: time=${this.notes[this.notes.length-1].time.toFixed(2)}s, lane=${this.notes[this.notes.length-1].lane}`);
            
            // Compter les notes par lane
            const laneCount = [0, 0, 0, 0];
            this.notes.forEach(note => laneCount[note.lane]++);
            console.log(`   Distribution: F=${laneCount[0]}, G=${laneCount[1]}, J=${laneCount[2]}, K=${laneCount[3]}`);
        } else {
            console.error('❌ AUCUNE NOTE GÉNÉRÉE !');
        }
    }
    
    async detectBPMOptimized() {
        const audioData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        
        // Analyser seulement les 30 premières secondes pour la détection BPM
        const maxSamples = Math.min(audioData.length, sampleRate * 30);
        const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows (plus petit)
        const hopSize = Math.floor(windowSize / 2);
        const energies = [];
        
        // Calcul d'énergie simplifié
        for (let i = 0; i < maxSamples - windowSize; i += hopSize) {
            let energy = 0;
            for (let j = 0; j < windowSize; j += 4) { // Skip samples pour plus de vitesse
                energy += Math.abs(audioData[i + j]);
            }
            energies.push(energy / (windowSize / 4));
        }
        
        // Détection de pics simplifiée
        const peaks = [];
        const energyThreshold = Math.max(...energies) * 0.7;
        
        for (let i = 2; i < energies.length - 2; i++) {
            if (energies[i] > energies[i-1] && 
                energies[i] > energies[i+1] && 
                energies[i] > energyThreshold) {
                peaks.push(i * hopSize / sampleRate);
            }
        }
        
        // Calcul BPM simplifié
        if (peaks.length < 2) return 120; // BPM par défaut
        
        const intervals = [];
        for (let i = 1; i < Math.min(peaks.length, 50); i++) { // Limite le nombre de pics
            intervals.push(peaks[i] - peaks[i-1]);
        }
        
        // Moyenne des intervalles
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = 60 / avgInterval;
        
        return Math.max(60, Math.min(200, Math.round(bpm)));
    }
    
    async performSimplifiedAnalysis() {
        const audioData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        
        // Mode rapide pour les longs fichiers
        const isLongFile = this.songDuration > 240; // Plus de 4 minutes
        const windowSize = isLongFile ? 8192 : 4096;
        const hopSize = isLongFile ? 4096 : 2048;
        const maxDuration = isLongFile ? 120 : this.songDuration; // Analyser max 2 minutes pour les longs fichiers
        
        const maxSamples = Math.min(audioData.length, sampleRate * maxDuration);
        const analysis = [];
        
        const totalWindows = Math.floor((maxSamples - windowSize) / hopSize);
        let processedWindows = 0;
        
        console.log(`📊 Mode ${isLongFile ? 'rapide' : 'normal'}: ${maxDuration.toFixed(0)}s à analyser`);
        
        for (let i = 0; i < maxSamples - windowSize; i += hopSize) {
            const window = audioData.slice(i, i + windowSize);
            
            // Analyse fréquentielle simplifiée (pas de FFT complète)
            const lowFreq = this.getSimpleFrequencyEnergy(window, 0, 0.1); // 0-10% du spectre
            const midFreq = this.getSimpleFrequencyEnergy(window, 0.1, 0.4); // 10-40%
            const highFreq = this.getSimpleFrequencyEnergy(window, 0.4, 1.0); // 40-100%
            
            // Énergie totale RMS
            let rms = 0;
            const step = isLongFile ? 16 : 8; // Skip plus de samples pour les longs fichiers
            for (let j = 0; j < window.length; j += step) {
                rms += window[j] * window[j];
            }
            rms = Math.sqrt(rms / (window.length / step));
            
            analysis.push({
                time: i / sampleRate,
                energy: rms,
                low: lowFreq,
                mid: midFreq,
                high: highFreq
            });
            
            // Mettre à jour le progrès plus fréquemment
            processedWindows++;
            if (processedWindows % (isLongFile ? 50 : 100) === 0) {
                const progress = 35 + (processedWindows / totalWindows) * 25;
                this.updateProgress(progress, `Analyse ${isLongFile ? 'rapide' : 'complète'}...`, 2);
                await new Promise(resolve => setTimeout(resolve, 1)); // Permettre le rendu
            }
        }
        
        // Si fichier long, dupliquer l'analyse pour couvrir toute la durée
        if (isLongFile && this.songDuration > maxDuration) {
            console.log('🔄 Extension de l\'analyse pour couvrir tout le fichier');
            const originalLength = analysis.length;
            const timeScale = this.songDuration / maxDuration;
            
            for (let i = 0; i < originalLength; i++) {
                const original = analysis[i];
                const newTime = original.time * timeScale;
                if (newTime < this.songDuration) {
                    analysis.push({
                        ...original,
                        time: newTime
                    });
                }
            }
            
            analysis.sort((a, b) => a.time - b.time);
        }
        
        return analysis;
    }
    
    getSimpleFrequencyEnergy(window, startRatio, endRatio) {
        const start = Math.floor(window.length * startRatio);
        const end = Math.floor(window.length * endRatio);
        let energy = 0;
        
        for (let i = start; i < end; i += 4) { // Skip samples
            energy += Math.abs(window[i]);
        }
        
        return energy / ((end - start) / 4);
    }
    
    generateBeatsFromAnalysis(analysis) {
        const beats = [];
        const energyHistory = [];
        const historySize = 20; // Historique plus petit
        
        console.log(`🎵 Génération de beats à partir de ${analysis.length} échantillons`);
        
        for (let i = 0; i < analysis.length; i++) {
            const current = analysis[i];
            energyHistory.push(current.energy);
            
            if (energyHistory.length > historySize) {
                energyHistory.shift();
            }
            
            if (energyHistory.length >= historySize) {
                const mean = energyHistory.reduce((a, b) => a + b) / energyHistory.length;
                const threshold = mean * 1.2; // Seuil plus bas pour plus de beats
                
                if (current.energy > threshold) {
                    const lastBeat = beats[beats.length - 1];
                    const minInterval = 0.08; // Intervalle minimum réduit à 80ms
                    
                    if (!lastBeat || current.time - lastBeat.time > minInterval) {
                        beats.push({
                            time: current.time,
                            energy: current.energy,
                            low: current.low,
                            mid: current.mid,
                            high: current.high
                        });
                        
                        // Debug log pour les premiers beats
                        if (beats.length <= 10) {
                            console.log(`Beat ${beats.length}: time=${current.time.toFixed(2)}s, energy=${current.energy.toFixed(3)}`);
                        }
                    }
                }
            }
            
            // Mettre à jour le progrès
            if (i % 50 === 0) {
                const progress = 60 + (i / analysis.length) * 20;
                this.updateProgress(progress, 'Génération des beats...', 3);
            }
        }
        
        console.log(`✅ ${beats.length} beats générés`);
        return beats;
    }
    
    createNotesFromBeats(beats) {
        const notes = [];
        
        console.log(`🎼 Création de notes à partir de ${beats.length} beats`);
        
        beats.forEach((beat, index) => {
            // Déterminer les lanes basées sur les fréquences
            const lanes = [];
            const maxEnergy = Math.max(beat.low, beat.mid, beat.high);
            const threshold = maxEnergy * 0.6; // Réduire le seuil pour plus de notes
            
            // Logique plus permissive pour générer plus de notes
            if (beat.low > threshold * 0.8) lanes.push(0); // F - Bass
            if (beat.mid > threshold * 0.8) {
                lanes.push(1); // G
                if (beat.mid > threshold * 1.2) lanes.push(2); // J aussi si très fort
            }
            if (beat.high > threshold * 0.8) lanes.push(3); // K - Treble
            
            // Assurer au moins une lane, même avec un seuil très bas
            if (lanes.length === 0) {
                if (beat.low >= beat.mid && beat.low >= beat.high) {
                    lanes.push(0); // F
                } else if (beat.high >= beat.mid && beat.high >= beat.low) {
                    lanes.push(3); // K
                } else {
                    lanes.push(1); // G par défaut
                }
            }
            
            // Limiter à 2 notes simultanées max pour éviter la surcharge
            const selectedLanes = lanes.slice(0, 2);
            
            selectedLanes.forEach(lane => {
                const settings = this.difficultySettings[this.difficulty];
                const isHoldNote = Math.random() < settings.holdNoteChance && beat.energy > 0.7;
                const holdDuration = isHoldNote ? Math.min(2.0, beat.energy * 3) : 0;
                
                notes.push({
                    time: beat.time,
                    lane: lane,
                    hit: false,
                    y: -this.noteHeight,
                    intensity: beat.energy,
                    spawned: false, // Important: ajouter cette propriété
                    type: beat.energy > 0.8 ? 'strong' : beat.energy > 0.6 ? 'medium' : 'weak',
                    isHold: isHoldNote,
                    holdDuration: holdDuration,
                    holdProgress: 0, // Pour les notes longues
                    isHolding: false // État de maintien
                });
            });
            
            // Debug log périodique
            if (index % 20 === 0) {
                console.log(`Note ${index}: time=${beat.time.toFixed(2)}s, lanes=${selectedLanes}, energy=${beat.energy.toFixed(3)}`);
                const progress = 80 + (index / beats.length) * 15;
                this.updateProgress(progress, 'Création des notes...', 4);
            }
        });
        
        console.log(`✅ ${notes.length} notes créées au total`);
        return notes;
    }
    
    async detectBPM() {
        const audioData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        
        // Calculer l'énergie par fenêtre
        const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
        const hopSize = Math.floor(windowSize / 4);
        const energies = [];
        
        for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
            let energy = 0;
            for (let j = 0; j < windowSize; j++) {
                energy += audioData[i + j] * audioData[i + j];
            }
            energies.push(energy / windowSize);
        }
        
        // Détecter les pics d'énergie
        const peaks = [];
        for (let i = 1; i < energies.length - 1; i++) {
            if (energies[i] > energies[i-1] && energies[i] > energies[i+1]) {
                const threshold = Math.max(...energies) * 0.6;
                if (energies[i] > threshold) {
                    peaks.push(i * hopSize / sampleRate);
                }
            }
        }
        
        // Analyser les intervalles entre pics pour trouver le BPM
        const intervals = [];
        for (let i = 1; i < peaks.length; i++) {
            intervals.push(peaks[i] - peaks[i-1]);
        }
        
        // Trouver l'intervalle le plus fréquent
        const intervalCounts = {};
        intervals.forEach(interval => {
            const rounded = Math.round(interval * 20) / 20; // Arrondir à 50ms
            intervalCounts[rounded] = (intervalCounts[rounded] || 0) + 1;
        });
        
        const mostCommonInterval = Object.keys(intervalCounts).reduce((a, b) => 
            intervalCounts[a] > intervalCounts[b] ? a : b);
        
        const bpm = 60 / parseFloat(mostCommonInterval);
        
        // Valider le BPM (doit être entre 60 et 200)
        return Math.max(60, Math.min(200, Math.round(bpm)));
    }
    
    async performSpectralAnalysis(audioData) {
        const sampleRate = this.audioBuffer.sampleRate;
        const windowSize = 2048;
        const hopSize = 512;
        const spectralData = [];
        
        // FFT simple pour l'analyse fréquentielle
        for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
            const window = audioData.slice(i, i + windowSize);
            const spectrum = this.simpleFFT(window);
            
            // Analyser différentes bandes de fréquences
            const bands = {
                bass: this.getFrequencyBand(spectrum, 0, 250, sampleRate), // 0-250Hz
                lowMid: this.getFrequencyBand(spectrum, 250, 1000, sampleRate), // 250Hz-1kHz
                highMid: this.getFrequencyBand(spectrum, 1000, 4000, sampleRate), // 1-4kHz
                treble: this.getFrequencyBand(spectrum, 4000, 8000, sampleRate) // 4-8kHz
            };
            
            spectralData.push({
                time: i / sampleRate,
                bands: bands,
                totalEnergy: bands.bass + bands.lowMid + bands.highMid + bands.treble
            });
        }
        
        return spectralData;
    }
    
    simpleFFT(signal) {
        // FFT simplifié pour l'analyse de base
        const N = signal.length;
        const spectrum = new Array(N).fill(0);
        
        for (let k = 0; k < N/2; k++) {
            let real = 0, imag = 0;
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += signal[n] * Math.cos(angle);
                imag += signal[n] * Math.sin(angle);
            }
            spectrum[k] = Math.sqrt(real * real + imag * imag);
        }
        
        return spectrum;
    }
    
    getFrequencyBand(spectrum, lowFreq, highFreq, sampleRate) {
        const binSize = sampleRate / (spectrum.length * 2);
        const lowBin = Math.floor(lowFreq / binSize);
        const highBin = Math.ceil(highFreq / binSize);
        
        let energy = 0;
        for (let i = lowBin; i < Math.min(highBin, spectrum.length); i++) {
            energy += spectrum[i];
        }
        
        return energy / (highBin - lowBin);
    }
    
    detectBeats(spectralData) {
        const beats = [];
        const energyHistory = [];
        const historySize = 43; // ~1 seconde d'historique
        
        for (let i = 0; i < spectralData.length; i++) {
            const current = spectralData[i];
            energyHistory.push(current.totalEnergy);
            
            if (energyHistory.length > historySize) {
                energyHistory.shift();
            }
            
            if (energyHistory.length >= historySize) {
                // Calculer la moyenne et variance locale
                const mean = energyHistory.reduce((a, b) => a + b) / energyHistory.length;
                const variance = energyHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / energyHistory.length;
                const threshold = mean + Math.sqrt(variance) * 1.5;
                
                // Détecter si c'est un beat
                if (current.totalEnergy > threshold) {
                    // Éviter les beats trop rapprochés
                    const lastBeat = beats[beats.length - 1];
                    if (!lastBeat || current.time - lastBeat.time > 0.1) {
                        beats.push({
                            time: current.time,
                            energy: current.totalEnergy,
                            bands: current.bands
                        });
                    }
                }
            }
        }
        
        return beats;
    }
    
    generateNotesFromBeats(beats, spectralData) {
        const notes = [];
        
        beats.forEach(beat => {
            // Déterminer les lanes actives basées sur l'analyse fréquentielle
            const activeLanes = this.determineActiveLanes(beat.bands);
            
            activeLanes.forEach(lane => {
                notes.push({
                    time: beat.time,
                    lane: lane,
                    hit: false,
                    y: -this.noteHeight,
                    intensity: beat.energy,
                    type: this.getNoteType(beat.bands, lane)
                });
            });
        });
        
        return notes;
    }
    
    determineActiveLanes(bands) {
        const lanes = [];
        const threshold = Math.max(...Object.values(bands)) * 0.7;
        
        // Mapper les bandes aux lanes
        if (bands.bass > threshold) lanes.push(0); // F - Basse
        if (bands.lowMid > threshold) lanes.push(1); // G - Médium bas
        if (bands.highMid > threshold) lanes.push(2); // J - Médium haut  
        if (bands.treble > threshold) lanes.push(3); // K - Aigus
        
        // S'assurer qu'au moins une lane est active
        if (lanes.length === 0) {
            const dominantBand = Object.keys(bands).reduce((a, b) => 
                bands[a] > bands[b] ? a : b);
            const laneMap = { bass: 0, lowMid: 1, highMid: 2, treble: 3 };
            lanes.push(laneMap[dominantBand]);
        }
        
        return lanes;
    }
    
    getNoteType(bands, lane) {
        const bandNames = ['bass', 'lowMid', 'highMid', 'treble'];
        const dominantBand = bandNames[lane];
        const intensity = bands[dominantBand];
        
        if (intensity > 0.8) return 'strong';
        if (intensity > 0.6) return 'medium';
        return 'weak';
    }
    
    applyDifficultyFilter() {
        const settings = this.difficultySettings[this.difficulty];
        const originalCount = this.notes.length;
        
        console.log(`🎚️ Application du filtre ${settings.name}:`);
        console.log(`   Notes avant filtre: ${originalCount}`);
        console.log(`   Seuil d'intensité: ${settings.beatThreshold}`);
        
        // Analyser les intensités avant filtrage
        const intensities = this.notes.map(note => note.intensity);
        const minIntensity = Math.min(...intensities);
        const maxIntensity = Math.max(...intensities);
        const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
        
        console.log(`   Intensités: min=${minIntensity.toFixed(3)}, max=${maxIntensity.toFixed(3)}, moy=${avgIntensity.toFixed(3)}`);
        
        // Filtrer par intensité
        this.notes = this.notes.filter(note => note.intensity >= settings.beatThreshold);
        console.log(`   Après filtre intensité: ${this.notes.length} notes`);
        
        // Réduire le nombre de notes selon la difficulté
        if (settings.noteReduction < 1.0) {
            const targetCount = Math.floor(this.notes.length * settings.noteReduction);
            // Garder les notes les plus importantes (haute intensité)
            this.notes.sort((a, b) => b.intensity - a.intensity);
            this.notes = this.notes.slice(0, targetCount);
            this.notes.sort((a, b) => a.time - b.time);
            console.log(`   Après réduction (${(settings.noteReduction*100).toFixed(0)}%): ${this.notes.length} notes`);
        }
        
        // Appliquer l'intervalle minimum entre notes
        const filteredNotes = [];
        let lastNoteTime = -1;
        
        for (const note of this.notes) {
            if (note.time - lastNoteTime >= settings.minNoteInterval) {
                filteredNotes.push(note);
                lastNoteTime = note.time;
            }
        }
        
        this.notes = filteredNotes;
        console.log(`   Après intervalle minimum (${settings.minNoteInterval}s): ${this.notes.length} notes`);
        console.log(`   📉 Réduction totale: ${originalCount} → ${this.notes.length} (${((this.notes.length/originalCount)*100).toFixed(1)}%)`);
    }
    
    analyzeSegment(startSample, samplesPerSegment) {
        const channelData = this.audioBuffer.getChannelData(0); // Canal gauche
        const endSample = Math.min(startSample + samplesPerSegment, channelData.length);
        
        // Analyser l'amplitude RMS
        let sum = 0;
        for (let i = startSample; i < endSample; i++) {
            sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / (endSample - startSample));
        
        // Analyser les fréquences (simulation simplifiée)
        const low = this.analyzeFrequencyBand(channelData, startSample, endSample, 0, 0.25);
        const lowMid = this.analyzeFrequencyBand(channelData, startSample, endSample, 0.25, 0.5);
        const highMid = this.analyzeFrequencyBand(channelData, startSample, endSample, 0.5, 0.75);
        const high = this.analyzeFrequencyBand(channelData, startSample, endSample, 0.75, 1);
        
        return {
            total: rms * 5, // Amplifier pour la détection
            low: low,
            lowMid: lowMid,
            highMid: highMid,
            high: high
        };
    }
    
    analyzeFrequencyBand(data, start, end, bandStart, bandEnd) {
        const bandSize = Math.floor((end - start) * (bandEnd - bandStart));
        const bandStartIndex = start + Math.floor((end - start) * bandStart);
        const bandEndIndex = bandStartIndex + bandSize;
        
        let sum = 0;
        for (let i = bandStartIndex; i < Math.min(bandEndIndex, end); i++) {
            sum += Math.abs(data[i]);
        }
        
        return sum / bandSize;
    }
    
    determineLane(intensity) {
        // Mapper les bandes de fréquences aux lanes
        const frequencies = [intensity.low, intensity.lowMid, intensity.highMid, intensity.high];
        
        // Trouver la bande dominante
        let maxIntensity = 0;
        let dominantLane = 0;
        
        frequencies.forEach((freq, index) => {
            if (freq > maxIntensity) {
                maxIntensity = freq;
                dominantLane = index;
            }
        });
        
        // Ajouter un peu de randomness pour éviter la monotonie
        if (Math.random() < 0.3) {
            dominantLane = Math.floor(Math.random() * 4);
        }
        
        return dominantLane;
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hitNotes = 0;
        this.activeNotes = [];
        this.currentTime = 0;
        
        this.hideAllOverlays();
        this.showGameUI();
        
        // Mettre à jour l'affichage des informations
        document.getElementById('bpmDisplay').textContent = `BPM: ${this.bpm}`;
        document.getElementById('difficultyDisplay').textContent = this.difficultySettings[this.difficulty].name;
        
        // Debug: vérifier les notes
        console.log(`🎮 Démarrage du jeu avec ${this.notes.length} notes`);
        if (this.notes.length > 0) {
            console.log('Premières notes:');
            for (let i = 0; i < Math.min(5, this.notes.length); i++) {
                const note = this.notes[i];
                console.log(`  Note ${i}: time=${note.time.toFixed(2)}s, lane=${note.lane}, type=${note.type}`);
            }
        } else {
            console.warn('⚠️ AUCUNE NOTE TROUVÉE !');
        }
        
        // Créer et démarrer la source audio
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        
        // Créer l'analyser pour les effets visuels
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        // Démarrer la musique
        this.sourceNode.start(0);
        this.startTime = this.audioContext.currentTime;
        this.isPlaying = true;
        
        // Fin de chanson
        this.sourceNode.onended = () => {
            this.gameOver();
        };
        
        console.log(`🎮 Jeu démarré ! BPM: ${this.bpm}, Difficulté: ${this.difficultySettings[this.difficulty].name}`);
    }
    
    pauseGame() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'paused';
        this.isPlaying = false;
        
        if (this.sourceNode) {
            this.sourceNode.stop();
            this.sourceNode = null;
        }
        
        document.getElementById('pauseOverlay').style.display = 'flex';
    }
    
    resumeGame() {
        if (this.gameState !== 'paused') return;
        
        this.gameState = 'playing';
        this.hideAllOverlays();
        
        // Recréer la source à partir du temps actuel
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        // Reprendre là où on s'était arrêté
        this.sourceNode.start(0, this.currentTime);
        this.startTime = this.audioContext.currentTime - this.currentTime;
        this.isPlaying = true;
        
        this.sourceNode.onended = () => {
            this.gameOver();
        };
    }
    
    restartGame() {
        this.stopAudio();
        this.startGame();
    }
    
    goToMenu() {
        this.stopAudio();
        this.gameState = 'menu';
        this.hideAllOverlays();
        this.hideGameUI();
        document.getElementById('menuOverlay').style.display = 'flex';
        
        // Reset du fichier input
        document.getElementById('fileInput').value = '';
    }
    
    stopAudio() {
        this.isPlaying = false;
        if (this.sourceNode) {
            try {
                this.sourceNode.stop();
            } catch (e) {
                // Source déjà arrêtée
            }
            this.sourceNode = null;
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.isPlaying = false;
        this.stopAudio();
        
        // Mettre à jour les statistiques
        this.gameStats.totalNotesHit = this.hitNotes;
        this.gameStats.songsPlayed++;
        
        // Calculer les statistiques finales
        const accuracy = this.totalNotes > 0 ? Math.round((this.hitNotes / this.totalNotes) * 100) : 0;
        
        // Sauvegarder le high score
        this.saveHighScore(this.score, accuracy, this.maxCombo, this.difficulty, 'Chanson uploadée');
        
        // Afficher les résultats
        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        document.getElementById('finalCombo').textContent = this.maxCombo;
        document.getElementById('accuracy').textContent = accuracy;
        
        // Déclencher l'événement pour mettre à jour les stats
        window.dispatchEvent(new CustomEvent('gameOver'));
        
        document.getElementById('gameOverOverlay').style.display = 'flex';
        
        console.log(`🏁 Partie terminée - Score: ${this.score}, Précision: ${accuracy}%`);
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Mettre à jour le temps
        if (this.isPlaying) {
            this.currentTime = this.audioContext.currentTime - this.startTime;
        }
        
        // Spawner les nouvelles notes
        this.spawnNotes();
        
        // Mettre à jour les notes actives
        this.updateNotes();
        
        // Mettre à jour les effets
        this.updateEffects();
        
        // Mettre à jour l'interface
        this.updateUI();
    }
    
    spawnNotes() {
        const spawnTime = this.currentTime + (this.canvas.height / this.noteSpeed); // Temps pour traverser l'écran
        
        // Chercher les notes à spawner
        let spawnedCount = 0;
        for (const note of this.notes) {
            if (!note.spawned && note.time <= spawnTime) {
                this.activeNotes.push({
                    ...note,
                    y: -this.noteHeight,
                    spawned: true
                });
                note.spawned = true;
                spawnedCount++;
                
                // Debug pour les premières notes spawnées
                if (this.activeNotes.length <= 5) {
                    console.log(`🎵 Note spawnée: time=${note.time.toFixed(2)}s, lane=${note.lane}, currentTime=${this.currentTime.toFixed(2)}s`);
                }
            }
        }
        
        // Debug périodique
        if (spawnedCount > 0) {
            console.log(`📍 ${spawnedCount} notes spawnées, ${this.activeNotes.length} notes actives`);
        }
    }
    
    updateNotes() {
        // Mettre à jour la position des notes
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            
            if (!note.hit) {
                // Déplacer la note vers le bas
                note.y += (this.gameSettings.noteSpeed || this.noteSpeed) * (1/60); // 60 FPS
                
                // Mettre à jour les notes longues
                if (note.isHold && note.isHolding) {
                    const holdTime = this.currentTime - note.holdStartTime;
                    note.holdProgress = Math.min(1, holdTime / note.holdDuration);
                }
                
                // Supprimer les notes qui ont dépassé la zone de frappe
                if (note.y > this.canvas.height) {
                    if (note.isHold && note.isHolding) {
                        // Note longue ratée
                        this.createHoldFailEffect(note.lane);
                    }
                    this.activeNotes.splice(i, 1);
                    this.missNote();
                }
            } else {
                // Supprimer les notes touchées après un délai
                this.activeNotes.splice(i, 1);
            }
        }
    }
    
    checkNoteHit(laneIndex) {
        const hitZone = 50; // Zone de tolérance en pixels
        let bestNote = null;
        let bestDistance = Infinity;
        
        // Chercher la note la plus proche dans cette lane
        for (const note of this.activeNotes) {
            if (note.lane === laneIndex && !note.hit) {
                const distance = Math.abs(note.y - this.hitZoneY);
                if (distance <= hitZone && distance < bestDistance) {
                    bestDistance = distance;
                    bestNote = note;
                }
            }
        }
        
        if (bestNote) {
            if (bestNote.isHold && !bestNote.isHolding) {
                // Démarrer une note longue
                bestNote.isHolding = true;
                bestNote.holdStartTime = this.currentTime;
                this.hitNote(bestNote, bestDistance);
            } else if (!bestNote.isHold) {
                // Note normale
                this.hitNote(bestNote, bestDistance);
            }
        } else {
            this.missNote();
        }
    }
    
    releaseHoldNote(laneIndex) {
        // Chercher les notes longues actives dans cette lane
        for (const note of this.activeNotes) {
            if (note.lane === laneIndex && note.isHold && note.isHolding) {
                const holdTime = this.currentTime - note.holdStartTime;
                const requiredHoldTime = note.holdDuration;
                
                if (holdTime >= requiredHoldTime * 0.8) { // Au moins 80% du temps requis
                    note.holdProgress = 1;
                    this.createHoldCompleteEffect(note.lane, holdTime / requiredHoldTime);
                } else {
                    this.createHoldFailEffect(note.lane);
                }
                
                note.isHolding = false;
                note.hit = true;
            }
        }
    }
    
    hitNote(note, distance) {
        note.hit = true;
        this.hitNotes++;
        
        // Calculer le score basé sur la précision
        let noteScore = 100;
        let hitType = 'PERFECT';
        
        if (distance < 15) {
            noteScore = 300;
            hitType = 'PERFECT';
            this.gameStats.perfectHits++;
        } else if (distance < 30) {
            noteScore = 200;
            hitType = 'GREAT';
            this.gameStats.greatHits++;
        } else if (distance < 45) {
            noteScore = 100;
            hitType = 'GOOD';
            this.gameStats.goodHits++;
        } else {
            noteScore = 50;
            hitType = 'OK';
            this.gameStats.okHits++;
        }
        
        // Bonus pour les notes longues
        if (note.isHold) {
            noteScore *= 1.5;
        }
        
        // Système de streak et fever mode
        this.combo++;
        if (this.combo > 20 && this.combo % 10 === 0) {
            this.activateFeverMode();
        }
        
        // Appliquer les multiplicateurs
        const comboMultiplier = Math.min(1 + (this.combo * 0.1), 5);
        const streakMultiplier = this.feverMode ? 2 : 1;
        const finalScore = Math.floor(noteScore * comboMultiplier * streakMultiplier);
        
        this.score += finalScore;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.gameStats.longestStreak = Math.max(this.gameStats.longestStreak, this.combo);
        
        // Créer des effets visuels améliorés
        this.createHitEffect(note.lane, hitType, finalScore);
        this.createNoteTrail(note);
        
        // Screen shake pour les notes fortes
        if (note.type === 'strong' && this.gameSettings.screenShake) {
            this.screenShake = 8;
        }
        
        console.log(`🎯 ${hitType} - Score: +${finalScore} (x${comboMultiplier.toFixed(1)})`);
    }
    
    missNote() {
        this.combo = 0;
        this.feverMode = false;
        this.feverTime = 0;
        this.gameStats.missedNotes++;
        this.createMissEffect();
    }
    
    activateFeverMode() {
        this.feverMode = true;
        this.feverTime = 10; // 10 secondes de fever mode
        this.createFeverEffect();
    }
    
    createNoteTrail(note) {
        if (!this.gameSettings.showTrails) return;
        
        for (let i = 0; i < 5; i++) {
            this.trails.push({
                x: note.lane * this.laneWidth + this.laneWidth / 2,
                y: note.y,
                color: this.laneColors[note.lane],
                life: 20,
                maxLife: 20,
                size: Math.max(1, 4 - i), // Assurer une taille minimum de 1
                alpha: 1 - (i * 0.2)
            });
        }
    }
    
    createHoldCompleteEffect(lane, completion) {
        const x = (lane + 0.5) * this.laneWidth;
        const y = this.hitZoneY;
        
        // Effet spécial pour les notes longues réussies
        this.hitEffects.push({
            x: x,
            y: y,
            text: 'HOLD!',
            score: Math.floor(completion * 500),
            color: '#FFD700',
            life: 90,
            maxLife: 90,
            size: 1.5
        });
        
        // Particules dorées
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: '#FFD700',
                life: 60,
                maxLife: 60,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    createHoldFailEffect(lane) {
        const x = (lane + 0.5) * this.laneWidth;
        const y = this.hitZoneY;
        
        this.hitEffects.push({
            x: x,
            y: y,
            text: 'RELEASE!',
            score: 0,
            color: '#FF6B6B',
            life: 60,
            maxLife: 60,
            size: 1
        });
    }
    
    createFeverEffect() {
        // Effet visuel pour l'activation du fever mode
        this.backgroundPulse = 2;
        
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: '#FFD700',
                life: 120,
                maxLife: 120,
                size: Math.random() * 6 + 3
            });
        }
    }
    
    createHitEffect(lane, hitType, score) {
        const x = (lane + 0.5) * this.laneWidth;
        const y = this.hitZoneY;
        
        this.hitEffects.push({
            x: x,
            y: y,
            text: hitType,
            score: score,
            color: this.laneColors[lane],
            life: 60,
            maxLife: 60,
            size: 1
        });
        
        // Particules
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: this.laneColors[lane],
                life: 30,
                maxLife: 30,
                size: Math.random() * 3 + 2
            });
        }
    }
    
    createMissEffect() {
        // Flash rouge pour les miss
        this.backgroundPulse = 1;
    }
    
    updateEffects() {
        // Mettre à jour le fever mode
        if (this.feverMode && this.feverTime > 0) {
            this.feverTime -= 1/60;
            if (this.feverTime <= 0) {
                this.feverMode = false;
            }
        }
        
        // Mettre à jour les effets de frappe
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i];
            effect.life--;
            effect.y -= 2;
            effect.size = 1 + (1 - effect.life / effect.maxLife) * 0.5;
            
            if (effect.life <= 0) {
                this.hitEffects.splice(i, 1);
            }
        }
        
        // Mettre à jour les particules
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.size *= 0.98;
            particle.vy += 0.1; // Gravité légère
            
            if (particle.life <= 0 || particle.size < 0.5) {
                this.particles.splice(i, 1);
            }
        }
        
        // Mettre à jour les traînées
        for (let i = this.trails.length - 1; i >= 0; i--) {
            const trail = this.trails[i];
            trail.life--;
            trail.y += 2;
            trail.alpha = trail.life / trail.maxLife;
            
            if (trail.life <= 0) {
                this.trails.splice(i, 1);
            }
        }
        
        // Décrémenter le pulse de fond et screen shake
        if (this.backgroundPulse > 0) {
            this.backgroundPulse *= 0.95;
        }
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
        }
        
        // Mettre à jour la waveform si on a un analyser
        this.updateWaveform();
    }
    
    updateWaveform() {
        if (!this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        if (!this.waveformData || this.waveformData.length !== bufferLength) {
            this.waveformData = new Uint8Array(bufferLength);
        }
        
        this.analyser.getByteFrequencyData(this.waveformData);
    }
    
    updateUI() {
        document.getElementById('scoreValue').textContent = this.score.toLocaleString();
        document.getElementById('comboValue').textContent = this.combo;
        
        // Mettre à jour la barre de progression
        const progress = this.songDuration > 0 ? (this.currentTime / this.songDuration) * 100 : 0;
        document.getElementById('progressFill').style.width = Math.min(100, Math.max(0, progress)) + '%';
    }
    
    updateKeyIndicator(key, pressed) {
        const element = document.getElementById(`key${key.toUpperCase()}`);
        if (element) {
            if (pressed) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        }
    }
    
    render() {
        // Screen shake
        if (this.screenShake > 0) {
            this.ctx.save();
            this.ctx.translate(
                (Math.random() - 0.5) * this.screenShake,
                (Math.random() - 0.5) * this.screenShake
            );
        }
        
        // Effacer le canvas
        this.ctx.fillStyle = `rgba(10, 10, 15, 0.8)`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fond avec effet de pulse et fever mode
        if (this.backgroundPulse > 0) {
            const color = this.feverMode ? 'rgba(255, 215, 0, ' : 'rgba(255, 0, 0, ';
            this.ctx.fillStyle = color + (this.backgroundPulse * 0.3) + ')';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Dessiner la waveform en arrière-plan
        this.renderWaveform();
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.renderTrails();
            this.renderLanes();
            this.renderHitZone();
            this.renderNotes();
            this.renderEffects();
            this.renderFeverMode();
        }
        
        if (this.screenShake > 0) {
            this.ctx.restore();
        }
    }
    
    renderWaveform() {
        if (!this.waveformData || this.waveformData.length === 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        
        const barWidth = this.canvas.width / this.waveformData.length;
        
        for (let i = 0; i < this.waveformData.length; i++) {
            const barHeight = (this.waveformData[i] / 255) * this.canvas.height * 0.5;
            
            // Gradient basé sur la fréquence
            const hue = (i / this.waveformData.length) * 360;
            this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            
            this.ctx.fillRect(
                i * barWidth,
                this.canvas.height - barHeight,
                barWidth,
                barHeight
            );
        }
        
        this.ctx.restore();
    }
    
    renderLanes() {
        // Dessiner les séparateurs de lanes
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        
        for (let i = 1; i < this.lanes; i++) {
            const x = i * this.laneWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Dessiner les indicateurs de touches en bas
        this.ctx.font = 'bold 24px Orbitron';
        this.ctx.textAlign = 'center';
        
        const keys = ['F', 'G', 'J', 'K'];
        keys.forEach((key, i) => {
            const x = (i + 0.5) * this.laneWidth;
            const y = this.canvas.height - 30;
            
            // Fond coloré
            this.ctx.fillStyle = this.laneColors[i];
            this.ctx.globalAlpha = this.keysPressed[i] ? 0.8 : 0.3;
            this.ctx.fillRect(i * this.laneWidth + 20, y - 25, this.laneWidth - 40, 35);
            
            // Texte
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = this.keysPressed[i] ? '#000' : '#fff';
            this.ctx.fillText(key, x, y);
        });
    }
    
    renderHitZone() {
        // Zone de frappe
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([10, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.hitZoneY);
        this.ctx.lineTo(this.canvas.width, this.hitZoneY);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        
        // Zone de tolérance
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(0, this.hitZoneY - 25, this.canvas.width, 50);
    }
    
    renderNotes() {
        for (const note of this.activeNotes) {
            if (note.hit) continue;
            
            const x = note.lane * this.laneWidth + 10;
            const width = this.laneWidth - 20;
            
            // Couleur et effet basés sur le type de note
            let noteColor = this.laneColors[note.lane];
            let glowIntensity = 15;
            let borderWidth = 2;
            
            if (note.type === 'strong') {
                noteColor = '#FFD700'; // Or pour les notes fortes
                glowIntensity = 25;
                borderWidth = 3;
            } else if (note.type === 'medium') {
                glowIntensity = 20;
                borderWidth = 2.5;
            }
            
            // Effet de lueur basé sur l'intensité
            this.ctx.shadowColor = noteColor;
            this.ctx.shadowBlur = glowIntensity;
            
            // Note principale avec gradient
            const gradient = this.ctx.createLinearGradient(x, note.y, x, note.y + this.noteHeight);
            gradient.addColorStop(0, noteColor);
            gradient.addColorStop(1, this.adjustColor(noteColor, -30));
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, note.y, width, this.noteHeight);
            
            // Bordure
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = borderWidth;
            this.ctx.shadowBlur = 0;
            this.ctx.strokeRect(x, note.y, width, this.noteHeight);
            
            // Indicateur de type pour les notes fortes
            if (note.type === 'strong') {
                this.ctx.fillStyle = '#000';
                this.ctx.font = 'bold 12px Orbitron';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('★', x + width/2, note.y + this.noteHeight/2 + 4);
            }
        }
    }
    
    adjustColor(color, amount) {
        // Fonction utilitaire pour ajuster la luminosité d'une couleur
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
            const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
            const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Pour les couleurs prédéfinies, retourner une version plus sombre
            return color.replace(')', `, 0.7)`).replace('rgb', 'rgba');
        }
    }
    
    renderTrails() {
        if (!this.gameSettings.showTrails) return;
        
        this.ctx.save();
        for (const trail of this.trails) {
            this.ctx.globalAlpha = trail.alpha;
            this.ctx.fillStyle = trail.color;
            this.ctx.beginPath();
            // Assurer que la taille est positive pour éviter l'erreur "radius is negative"
            const radius = Math.max(0, trail.size);
            this.ctx.arc(trail.x, trail.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }
    
    renderFeverMode() {
        if (!this.feverMode) return;
        
        // Bordure dorée clignotante
        this.ctx.save();
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 6;
        this.ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
        this.ctx.strokeRect(5, 5, this.canvas.width - 10, this.canvas.height - 10);
        
        // Texte "FEVER MODE"
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.textAlign = 'center';
        this.ctx.globalAlpha = 1;
        this.ctx.fillText('FEVER MODE!', this.canvas.width / 2, 40);
        this.ctx.restore();
    }

    renderEffects() {
        // Effets de frappe
        this.ctx.textAlign = 'center';
        
        for (const effect of this.hitEffects) {
            const alpha = effect.life / effect.maxLife;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.translate(effect.x, effect.y);
            this.ctx.scale(effect.size, effect.size);
            
            // Texte principal
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillStyle = effect.color;
            this.ctx.fillText(effect.text, 0, 0);
            
            // Score
            if (effect.score > 0) {
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillText(`+${effect.score}`, 0, 20);
            }
            
            this.ctx.restore();
        }
        
        // Particules améliorées
        for (const particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            // Assurer que la taille est positive pour éviter l'erreur "radius is negative"
            const radius = Math.max(0, particle.size);
            this.ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    // Gestion des overlays améliorée
    showProcessingOverlay() {
        this.hideAllOverlays();
        document.getElementById('processingOverlay').style.display = 'flex';
    }
    
    showGameUI() {
        document.getElementById('gameUI').style.display = 'flex';
        document.getElementById('progressContainer').style.display = 'block';
        
        // Afficher les informations de fever mode et charger les paramètres
        this.updateFeverModeUI();
        this.loadUISettings();
    }
    
    hideGameUI() {
        document.getElementById('gameUI').style.display = 'none';
        document.getElementById('progressContainer').style.display = 'none';
    }
    
    updateFeverModeUI() {
        // Mettre à jour l'UI du fever mode si nécessaire
        const feverIndicator = document.getElementById('feverIndicator');
        if (feverIndicator) {
            if (this.feverMode) {
                feverIndicator.style.display = 'block';
                feverIndicator.textContent = `FEVER: ${Math.ceil(this.feverTime)}s`;
            } else {
                feverIndicator.style.display = 'none';
            }
        }
    }
    
    hideAllOverlays() {
        const overlays = ['menuOverlay', 'processingOverlay', 'gameOverOverlay', 'pauseOverlay'];
        overlays.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    }
    
    loadUISettings() {
        // Charger les paramètres dans l'interface
        const speedSlider = document.getElementById('speedSlider');
        const offsetSlider = document.getElementById('offsetSlider');
        const trailsToggle = document.getElementById('trailsToggle');
        const particlesToggle = document.getElementById('particlesToggle');
        const shakeToggle = document.getElementById('shakeToggle');
        
        if (speedSlider) {
            speedSlider.value = this.gameSettings.noteSpeed || 500;
            document.getElementById('speedValue').textContent = speedSlider.value;
        }
        
        if (offsetSlider) {
            offsetSlider.value = this.gameSettings.audioOffset || 0;
            document.getElementById('offsetValue').textContent = offsetSlider.value;
        }
        
        if (trailsToggle) trailsToggle.checked = this.gameSettings.showTrails !== false;
        if (particlesToggle) particlesToggle.checked = this.gameSettings.showParticles !== false;
        if (shakeToggle) shakeToggle.checked = this.gameSettings.screenShake !== false;
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialiser le jeu quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    window.rhythmGame = new RhythmGame();
    console.log('🎮 Rhythm Hero initialisé avec succès !');
});