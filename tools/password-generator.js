// Password Generator Tool

document.addEventListener('DOMContentLoaded', function() {
    const lengthSlider = document.getElementById('password-length');
    const lengthDisplay = document.getElementById('length-display');
    
    if (lengthSlider && lengthDisplay) {
        lengthSlider.addEventListener('input', function() {
            lengthDisplay.textContent = this.value;
        });
    }
});

function generatePassword() {
    const length = parseInt(document.getElementById('password-length').value);
    const uppercase = document.getElementById('uppercase').checked;
    const lowercase = document.getElementById('lowercase').checked;
    const numbers = document.getElementById('numbers').checked;
    const symbols = document.getElementById('symbols').checked;
    
    if (!uppercase && !lowercase && !numbers && !symbols) {
        alert('Veuillez sélectionner au moins un type de caractère');
        return;
    }
    
    let charset = '';
    if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) charset += '0123456789';
    if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    
    // Ensure at least one character from each selected type
    if (uppercase) password += getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (lowercase) password += getRandomChar('abcdefghijklmnopqrstuvwxyz');
    if (numbers) password += getRandomChar('0123456789');
    if (symbols) password += getRandomChar('!@#$%^&*()_+-=[]{}|;:,.<>?');
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += getRandomChar(charset);
    }
    
    // Shuffle the password
    password = shuffleString(password);
    
    // Display password
    const outputDiv = document.getElementById('password-output');
    if (outputDiv) {
        outputDiv.innerHTML = `
            <div style="font-family: 'Courier New', monospace; font-size: 1.2rem; word-break: break-all; padding: 15px; background: rgba(102, 126, 234, 0.1); border-radius: 8px; user-select: all;">
                ${password}
            </div>
        `;
        outputDiv.style.display = 'block';
        
        // Store password for copying
        window.currentPassword = password;
        
        // Calculate and display strength
        displayPasswordStrength(password);
    }
}

function getRandomChar(charset) {
    return charset.charAt(Math.floor(Math.random() * charset.length));
}

function shuffleString(str) {
    return str.split('').sort(() => 0.5 - Math.random()).join('');
}

function copyPassword() {
    if (window.currentPassword) {
        navigator.clipboard.writeText(window.currentPassword).then(() => {
            showNotification('Mot de passe copié dans le presse-papier!');
        });
    } else {
        alert('Veuillez d\'abord générer un mot de passe');
    }
}

function displayPasswordStrength(password) {
    const strengthDiv = document.getElementById('password-strength');
    if (!strengthDiv) return;
    
    const strength = calculatePasswordStrength(password);
    
    strengthDiv.className = 'password-strength';
    strengthDiv.classList.add(`strength-${strength.level}`);
    strengthDiv.textContent = `Force du mot de passe: ${strength.text} (${strength.score}/100)`;
}

function calculatePasswordStrength(password) {
    let score = 0;
    let level = 'weak';
    let text = 'Faible';
    
    // Length bonus
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;
    
    // Pattern penalties
    if (/([a-zA-Z0-9])\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 15; // Common sequences
    
    // Final scoring
    if (score >= 70) {
        level = 'strong';
        text = 'Fort';
    } else if (score >= 40) {
        level = 'medium';
        text = 'Moyen';
    }
    
    return { score: Math.max(0, Math.min(100, score)), level, text };
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
