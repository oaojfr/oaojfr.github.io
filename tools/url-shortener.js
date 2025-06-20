// URL Shortener Tool

function shortenURL() {
    const urlInput = document.getElementById('url-input');
    const customInput = document.getElementById('url-custom');
    const resultDiv = document.getElementById('url-result');
    
    if (!urlInput || !resultDiv) return;
    
    const originalUrl = urlInput.value.trim();
    const customName = customInput.value.trim();
    
    if (!originalUrl) {
        alert('Veuillez entrer une URL');
        return;
    }
    
    if (!isValidURL(originalUrl)) {
        alert('Veuillez entrer une URL valide');
        return;
    }
    
    // Generate short URL (simulation)
    const shortUrl = generateShortURL(customName);
    
    // Display result
    document.getElementById('shortened-url').value = shortUrl;
    resultDiv.style.display = 'block';
    
    // Generate QR code for the short URL
    generateQRForURL(shortUrl);
    
    showNotification('URL raccourcie avec succès!');
}

function generateShortURL(customName) {
    const baseUrl = 'https://short.ly/';
    
    if (customName && customName.length > 0) {
        // Use custom name if provided
        return baseUrl + customName.replace(/[^a-zA-Z0-9-_]/g, '');
    } else {
        // Generate random short code
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let shortCode = '';
        for (let i = 0; i < 6; i++) {
            shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return baseUrl + shortCode;
    }
}

function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function copyShortURL() {
    const shortUrlInput = document.getElementById('shortened-url');
    if (shortUrlInput) {
        navigator.clipboard.writeText(shortUrlInput.value).then(() => {
            showNotification('URL courte copiée!');
        });
    }
}

function generateQRForURL(url) {
    const canvas = document.getElementById('url-qr');
    if (!canvas) return;
    
    // Simple QR code generation (placeholder)
    // In a real application, you'd use a proper QR code library like qrcode.js
    
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 200, 200);
    
    // Draw a simple pattern as placeholder
    ctx.fillStyle = 'black';
    const cellSize = 10;
    const pattern = generateSimpleQRPattern(url);
    
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
            if (pattern[y] && pattern[y][x]) {
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
    
    // Add corners (finder patterns)
    drawFinderPattern(ctx, 0, 0, cellSize);
    drawFinderPattern(ctx, 13 * cellSize, 0, cellSize);
    drawFinderPattern(ctx, 0, 13 * cellSize, cellSize);
}

function generateSimpleQRPattern(url) {
    // Generate a simple pattern based on URL hash
    const hash = simpleStringHash(url);
    const pattern = [];
    
    for (let y = 0; y < 20; y++) {
        pattern[y] = [];
        for (let x = 0; x < 20; x++) {
            // Skip finder pattern areas
            if ((x < 7 && y < 7) || (x > 12 && y < 7) || (x < 7 && y > 12)) {
                pattern[y][x] = false;
                continue;
            }
            
            // Generate pattern based on hash and position
            const seed = hash + x + y * 20;
            pattern[y][x] = (seed % 3) === 0;
        }
    }
    
    return pattern;
}

function drawFinderPattern(ctx, startX, startY, cellSize) {
    // Draw 7x7 finder pattern
    const pattern = [
        [1,1,1,1,1,1,1],
        [1,0,0,0,0,0,1],
        [1,0,1,1,1,0,1],
        [1,0,1,1,1,0,1],
        [1,0,1,1,1,0,1],
        [1,0,0,0,0,0,1],
        [1,1,1,1,1,1,1]
    ];
    
    ctx.fillStyle = 'black';
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
            if (pattern[y][x]) {
                ctx.fillRect(startX + x * cellSize, startY + y * cellSize, cellSize, cellSize);
            }
        }
    }
}

function simpleStringHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-family: 'Poppins', sans-serif;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
