// UUID Generator Tool

function generateUUID() {
    const count = parseInt(document.getElementById('uuid-count').value);
    const format = document.getElementById('uuid-format').value;
    const output = document.getElementById('uuid-output');
    
    if (!output) return;
    
    if (count < 1 || count > 100) {
        alert('Le nombre doit être entre 1 et 100');
        return;
    }
    
    const uuids = [];
    for (let i = 0; i < count; i++) {
        uuids.push(formatUUID(generateUUIDv4(), format));
    }
    
    output.innerHTML = uuids.map((uuid, index) => `
        <div style="margin-bottom: 10px; padding: 10px; border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
            <code style="font-family: 'Courier New', monospace; user-select: all;">${uuid}</code>
            <button onclick="copyUUID('${uuid}')" style="background: var(--primary-color); color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                <i class="bi bi-clipboard"></i>
            </button>
        </div>
    `).join('');
    
    output.style.display = 'block';
    
    // Store UUIDs for bulk copy
    window.currentUUIDs = uuids;
    
    showNotification(`${count} UUID${count > 1 ? 's' : ''} généré${count > 1 ? 's' : ''}!`);
}

function generateUUIDv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatUUID(uuid, format) {
    switch (format) {
        case 'uppercase':
            return uuid.toUpperCase();
        case 'nodashes':
            return uuid.replace(/-/g, '');
        default:
            return uuid.toLowerCase();
    }
}

function copyUUID(uuid) {
    navigator.clipboard.writeText(uuid).then(() => {
        showNotification('UUID copié!');
    });
}

function copyUUIDs() {
    if (window.currentUUIDs && window.currentUUIDs.length > 0) {
        const allUUIDs = window.currentUUIDs.join('\n');
        navigator.clipboard.writeText(allUUIDs).then(() => {
            showNotification(`${window.currentUUIDs.length} UUID${window.currentUUIDs.length > 1 ? 's' : ''} copié${window.currentUUIDs.length > 1 ? 's' : ''}!`);
        });
    } else {
        alert('Veuillez d\'abord générer des UUIDs');
    }
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
