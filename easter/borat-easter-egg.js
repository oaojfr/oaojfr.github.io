// Borat Easter Egg
function initBoratEgg() {
    // Easter Egg: Borat sequence detection
    let boratEggSequence = [];
    const boratCode = ['b', 'o', 'r', 'a', 't'];
    let boratOverlayActive = false;

    // Fonction pour créer et afficher la vidéo YouTube en plein écran
    function showBoratVideo() {
        if (boratOverlayActive) return;
        boratOverlayActive = true;

        // Créer l'overlay pour la vidéo
        const boratOverlay = document.createElement('div');
        boratOverlay.id = 'borat-overlay';
        boratOverlay.style.position = 'fixed';
        boratOverlay.style.top = '0';
        boratOverlay.style.left = '0';
        boratOverlay.style.width = '100%';
        boratOverlay.style.height = '100%';
        boratOverlay.style.backgroundColor = 'black';
        boratOverlay.style.zIndex = '99999'; // Très élevé pour être au-dessus de tout
        boratOverlay.style.display = 'flex';
        boratOverlay.style.justifyContent = 'center';
        boratOverlay.style.alignItems = 'center';
        
        // Ajouter l'iframe YouTube avec la vidéo spécifiée (autoplay=1 pour lecture automatique)
        const videoId = '5vBdp7Di0Jc';
        boratOverlay.innerHTML = `
            <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&showinfo=0&rel=0" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
        
        document.body.appendChild(boratOverlay);
        
        // Ajouter une fonction pour fermer la vidéo avec la touche ESC
        function closeBoratVideo(e) {
            if (e.key === 'Escape') {
                if (boratOverlay && boratOverlay.parentNode) {
                    boratOverlay.parentNode.removeChild(boratOverlay);
                    boratOverlayActive = false;
                }
                document.removeEventListener('keydown', closeBoratVideo);
            }
        }
        
        document.addEventListener('keydown', closeBoratVideo);
    }

    // Listen for secret key sequence
    document.addEventListener('keydown', function(e) {
        if (boratOverlayActive) return;
        
        boratEggSequence.push(e.key.toLowerCase());
        
        // Keep only the last 5 keys
        if (boratEggSequence.length > boratCode.length) {
            boratEggSequence.shift();
        }
        
        // Check if sequence matches
        if (boratEggSequence.length === boratCode.length && 
            boratEggSequence.every((key, index) => key === boratCode[index])) {
            showBoratVideo();
            boratEggSequence = [];
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initBoratEgg);
