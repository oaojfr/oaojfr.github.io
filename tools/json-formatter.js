// JSON Formatter Tool

function formatJSON() {
    const input = document.getElementById('json-input');
    const output = document.getElementById('json-output');
    
    if (!input || !output) return;
    
    const jsonText = input.value.trim();
    if (!jsonText) {
        alert('Veuillez entrer des données JSON');
        return;
    }
    
    try {
        const parsed = JSON.parse(jsonText);
        const formatted = JSON.stringify(parsed, null, 2);
        
        output.innerHTML = `<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(formatted)}</pre>`;
        output.style.display = 'block';
        
        showNotification('JSON formaté avec succès!');
    } catch (error) {
        output.innerHTML = `<div style="color: red;">
            <strong>Erreur JSON:</strong><br>
            ${escapeHtml(error.message)}
        </div>`;
        output.style.display = 'block';
    }
}

function minifyJSON() {
    const input = document.getElementById('json-input');
    const output = document.getElementById('json-output');
    
    if (!input || !output) return;
    
    const jsonText = input.value.trim();
    if (!jsonText) {
        alert('Veuillez entrer des données JSON');
        return;
    }
    
    try {
        const parsed = JSON.parse(jsonText);
        const minified = JSON.stringify(parsed);
        
        output.innerHTML = `<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(minified)}</pre>`;
        output.style.display = 'block';
        
        showNotification('JSON minifié avec succès!');
    } catch (error) {
        output.innerHTML = `<div style="color: red;">
            <strong>Erreur JSON:</strong><br>
            ${escapeHtml(error.message)}
        </div>`;
        output.style.display = 'block';
    }
}

function validateJSON() {
    const input = document.getElementById('json-input');
    const output = document.getElementById('json-output');
    
    if (!input || !output) return;
    
    const jsonText = input.value.trim();
    if (!jsonText) {
        alert('Veuillez entrer des données JSON');
        return;
    }
    
    try {
        const parsed = JSON.parse(jsonText);
        const info = analyzeJSON(parsed);
        
        output.innerHTML = `
            <div style="color: green;">
                <strong>✓ JSON Valide!</strong><br><br>
                <strong>Informations:</strong><br>
                • Type: ${info.type}<br>
                • Taille: ${info.size} caractères<br>
                • Propriétés: ${info.properties}<br>
                • Profondeur: ${info.depth}
            </div>
        `;
        output.style.display = 'block';
        
        showNotification('JSON valide!');
    } catch (error) {
        const errorInfo = getDetailedError(jsonText, error);
        
        output.innerHTML = `
            <div style="color: red;">
                <strong>✗ JSON Invalide</strong><br><br>
                <strong>Erreur:</strong> ${escapeHtml(error.message)}<br>
                <strong>Position:</strong> ${errorInfo.position}<br>
                <strong>Ligne:</strong> ${errorInfo.line}
            </div>
        `;
        output.style.display = 'block';
    }
}

function analyzeJSON(obj) {
    const type = Array.isArray(obj) ? 'Array' : typeof obj;
    const size = JSON.stringify(obj).length;
    let properties = 0;
    let depth = 0;
    
    function countProperties(o, currentDepth = 0) {
        depth = Math.max(depth, currentDepth);
        
        if (typeof o === 'object' && o !== null) {
            if (Array.isArray(o)) {
                properties += o.length;
                o.forEach(item => countProperties(item, currentDepth + 1));
            } else {
                const keys = Object.keys(o);
                properties += keys.length;
                keys.forEach(key => countProperties(o[key], currentDepth + 1));
            }
        }
    }
    
    countProperties(obj);
    
    return { type, size, properties, depth };
}

function getDetailedError(jsonText, error) {
    const lines = jsonText.split('\n');
    const errorMatch = error.message.match(/position (\d+)/);
    
    if (errorMatch) {
        const position = parseInt(errorMatch[1]);
        let currentPos = 0;
        let line = 1;
        
        for (let i = 0; i < lines.length; i++) {
            if (currentPos + lines[i].length >= position) {
                line = i + 1;
                break;
            }
            currentPos += lines[i].length + 1; // +1 for newline
        }
        
        return { position, line };
    }
    
    return { position: 'Inconnue', line: 'Inconnue' };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
