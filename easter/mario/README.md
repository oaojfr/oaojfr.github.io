# Super Mario Bros - Version Complète

## 🎮 Vue d'ensemble

Cette version complètement recréée de Super Mario Bros offre une expérience de jeu fidèle aux mécaniques classiques avec une architecture moderne et modulaire.

## 📁 Structure du projet

```
easter/mario/
├── index.html              # Page principale avec interface
├── mario-main.js            # Moteur principal du jeu
├── mario-entities.js        # Système de gestion des entités
├── mario-player.js          # Mario et ses mécaniques
├── mario-enemies.js         # Ennemis (Goomba, Koopa, etc.)
├── mario-levels.js          # Génération et gestion des niveaux
├── mario-objects.js         # Power-ups et objets collectibles
├── mario-ui.js              # Interface utilisateur et HUD
├── mario-input.js           # Gestion des contrôles
├── mario-audio.js           # Système audio 8-bit
└── README.md               # Cette documentation
```

## 🚀 Caractéristiques principales

### 🎯 Gameplay
- **Physique réaliste** : Gravité, friction, collisions précises
- **Mécaniques classiques** : Saut, course, accroupissement
- **États de puissance** : Petit, Grand, Feu, Étoile
- **Système de vies** : 3 vies de base, bonus avec 100 pièces
- **Score** : Points pour ennemis, objets, temps de fin de niveau

### 👾 Ennemis
- **Goomba** : Ennemi de base qui marche
- **Koopa Troopa** : Tortue avec carapace qui peut être lancée
- **Piranha Plant** : Plante qui sort des tuyaux
- **Spiny** : Hérisson impossible à écraser

### 🎁 Power-ups
- **Super Champignon** : Mario devient grand
- **Fleur de Feu** : Permet de lancer des boules de feu
- **Étoile** : Invincibilité temporaire
- **1UP** : Vie bonus

### 🎵 Audio
- **Sons 8-bit** générés en temps réel avec Web Audio API
- **Musiques de fond** : Monde extérieur, souterrain, étoile, château
- **Effets sonores** : Saut, pièces, power-ups, ennemis, etc.

### 🎮 Contrôles
- **Clavier** : Flèches/WASD pour mouvement, Espace/Z pour saut
- **Mobile** : Contrôles tactiles automatiques
- **Manette** : Support prévu pour l'avenir

## 🏗️ Architecture technique

### Système d'entités
- **Entity** : Classe de base pour tous les objets
- **EntityManager** : Gestion centralisée des entités
- **Collisions** : Système de détection et résolution

### Rendu
- **Caméra** : Suivi fluide de Mario avec interpolation
- **Couches** : Système de renderLayer pour l'ordre d'affichage
- **Optimisation** : Culling des entités hors écran

### Niveaux
- **Génération procédurale** : Niveaux uniques selon la difficulté
- **Tiles** : Système de tuiles pour les décors
- **Éléments de fond** : Nuages, collines, buissons

## 🎨 Rendu et visuels

- **Style 8-bit** authentique avec rendu pixel-perfect
- **Animations** : Sprites animés pour Mario et les ennemis
- **Particules** : Effets visuels pour les explosions, collecte, etc.
- **UI moderne** : HUD informatif avec score, vies, temps

## 📱 Compatibilité

- **Navigateurs modernes** : Chrome, Firefox, Safari, Edge
- **Mobile** : Contrôles tactiles adaptatifs
- **Responsive** : Interface qui s'adapte à toutes les tailles d'écran

## 🛠️ Développement

### Ajout d'un nouvel ennemi

```javascript
class NouvelEnnemi extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, width, height);
        this.speed = 2;
        this.points = 300;
    }
    
    updateMovement(deltaTime) {
        // Logique de mouvement spécifique
    }
    
    render(ctx) {
        // Rendu spécifique
    }
}
```

### Ajout d'un power-up

```javascript
// Dans mario-objects.js
case 'nouveau_powerup':
    const nouveauPowerup = new PowerUp(game, x, y, 'nouveau_powerup');
    break;

// Dans mario-player.js
case 'nouveau_powerup':
    // Logique d'application du power-up
    break;
```

## 🐛 Debug et développement

- **F1** : Activer/désactiver le mode debug
- **F2** : Afficher/masquer les FPS
- **Ctrl+1/2/3** : Donner des power-ups à Mario
- **Ctrl+L** : Passer au niveau suivant
- **Ctrl+K** : Ajouter une vie
- **Ctrl+C** : Ajouter 10 pièces

## 🎯 Prochaines améliorations

- [ ] Niveaux souterrains avec tuyaux fonctionnels
- [ ] Boss de fin de niveau
- [ ] Système de checkpoints
- [ ] Sauvegarde des high scores
- [ ] Mode multijoueur local
- [ ] Plus de types d'ennemis
- [ ] Éditeur de niveaux
- [ ] Support manette gamepad

## 📋 Notes techniques

### Performance
- Optimisation du rendu avec culling
- Gestion mémoire des entités
- Interpolation fluide de la caméra
- Audio Web API pour des sons sans latence

### Compatibilité audio
- Fallback silencieux si Web Audio non supporté
- Reprise automatique du contexte audio sur interaction
- Contrôles de volume séparés (musique/effets)

## 🎉 Crédits

Recréation complète inspirée de Super Mario Bros de Nintendo, développée avec les technologies web modernes pour une expérience de jeu fluide et authentique.

---

**Version** : 2.0.0  
**Date** : 2024  
**Compatibilité** : ES6+, Web Audio API, Canvas 2D
