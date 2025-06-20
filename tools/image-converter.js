// Image Conversion Functions
function handleWebPFile(input) {
    const file = input.files[0];
    if (file && file.type === 'image/webp') {
        document.getElementById('webp-controls').style.display = 'block';
        document.getElementById('webp-status').style.display = 'none';
    }
}

function convertWebP() {
    const input = document.getElementById('webp-input');
    const format = document.getElementById('webp-format').value;
    const file = input.files[0];
    
    if (!file) {
        alert('Sélectionnez d\'abord un fichier WebP');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('webp-canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const mimeType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
            const quality = format === 'jpeg' ? 0.9 : undefined;
            
            canvas.toBlob(function(blob) {
                const link = document.createElement('a');
                link.download = `converted.${format}`;
                link.href = URL.createObjectURL(blob);
                link.click();
                
                showStatus('webp-status', 'Conversion réussie ! Téléchargement en cours...', 'success');
            }, mimeType, quality);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function handleHEICFile(input) {
    const file = input.files[0];
    if (file && (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif'))) {
        document.getElementById('heic-controls').style.display = 'block';
        document.getElementById('heic-status').style.display = 'none';
    }
}

function convertHEIC() {
    showStatus('heic-status', 'La conversion HEIC nécessite une bibliothèque spécialisée. Cette fonctionnalité sera bientôt disponible !', 'error');
}

function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `conversion-status ${type}`;
    element.style.display = 'block';
}
