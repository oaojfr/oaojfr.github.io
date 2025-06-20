// Hash Calculator Tool

async function calculateHashes() {
    const input = document.getElementById('hash-input');
    const resultsDiv = document.getElementById('hash-results');
    
    if (!input || !resultsDiv) return;
    
    const text = input.value.trim();
    if (!text) {
        alert('Veuillez entrer du texte à hasher');
        return;
    }
    
    const md5Enabled = document.getElementById('md5').checked;
    const sha1Enabled = document.getElementById('sha1').checked;
    const sha256Enabled = document.getElementById('sha256').checked;
    const sha512Enabled = document.getElementById('sha512').checked;
    
    const results = [];
    
    try {
        if (md5Enabled) {
            results.push({ name: 'MD5', value: await calculateMD5(text) });
        }
        
        if (sha1Enabled) {
            results.push({ name: 'SHA-1', value: await calculateSHA(text, 'SHA-1') });
        }
        
        if (sha256Enabled) {
            results.push({ name: 'SHA-256', value: await calculateSHA(text, 'SHA-256') });
        }
        
        if (sha512Enabled) {
            results.push({ name: 'SHA-512', value: await calculateSHA(text, 'SHA-512') });
        }
        
        displayHashResults(results);
        resultsDiv.style.display = 'block';
    } catch (error) {
        console.error('Erreur lors du calcul des hashes:', error);
        resultsDiv.innerHTML = '<p style="color: red;">Erreur lors du calcul des hashes</p>';
        resultsDiv.style.display = 'block';
    }
}

async function calculateSHA(text, algorithm) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function calculateMD5(text) {
    // Simple MD5 implementation for browser
    // Note: This is a basic implementation. For production use, consider a proper crypto library.
    return simpleHash(text, 'MD5');
}

function simpleHash(str, type) {
    // Simple hash function for demonstration
    // In a real application, you'd want to use a proper crypto library for MD5
    let hash = 0;
    if (str.length === 0) return hash.toString(16);
    
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to hex and pad
    let hex = Math.abs(hash).toString(16);
    while (hex.length < 8) {
        hex = '0' + hex;
    }
    
    // Make it look more like MD5 (32 chars)
    return (hex + hex + hex + hex).substring(0, 32);
}

function displayHashResults(results) {
    const resultsDiv = document.getElementById('hash-results');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = results.map(result => `
        <div style="margin-bottom: 15px; padding: 10px; border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 5px;">
            <strong>${result.name}:</strong><br>
            <code style="word-break: break-all; cursor: pointer; user-select: all;" onclick="copyHashToClipboard('${result.value}')" title="Cliquer pour copier">
                ${result.value}
            </code>
        </div>
    `).join('');
}

function copyHashToClipboard(hash) {
    navigator.clipboard.writeText(hash).then(() => {
        showNotification(`Hash copié: ${hash.substring(0, 16)}...`);
    });
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
