// Base64 Encoder/Decoder
function encodeBase64() {
    const input = document.getElementById('base64-input').value;
    if (!input) {
        alert('Veuillez entrer du texte');
        return;
    }

    try {
        const encoded = btoa(unescape(encodeURIComponent(input)));
        const output = document.getElementById('base64-output');
        output.textContent = encoded;
        output.style.display = 'block';
    } catch (error) {
        alert('Erreur lors de l\'encodage');
    }
}

function decodeBase64() {
    const input = document.getElementById('base64-input').value;
    if (!input) {
        alert('Veuillez entrer du texte encodé');
        return;
    }

    try {
        const decoded = decodeURIComponent(escape(atob(input)));
        const output = document.getElementById('base64-output');
        output.textContent = decoded;
        output.style.display = 'block';
    } catch (error) {
        alert('Erreur lors du décodage - vérifiez que le texte est valide en Base64');
    }
}

function clearBase64() {
    document.getElementById('base64-input').value = '';
    document.getElementById('base64-output').style.display = 'none';
}
