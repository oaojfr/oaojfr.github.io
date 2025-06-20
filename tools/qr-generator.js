// QR Code Generator
let qrCodeDataURL = '';

function generateQRCode() {
    const text = document.getElementById('qr-input').value.trim();
    if (!text) {
        alert('Veuillez entrer du texte ou une URL');
        return;
    }

    const qrContainer = document.getElementById('qr-code-container');
    qrContainer.innerHTML = '';

    // Simple QR Code generation using API
    const qrImg = document.createElement('img');
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    qrImg.className = 'qr-code-canvas';
    qrImg.onload = function() {
        qrCodeDataURL = qrImg.src;
    };
    
    qrContainer.appendChild(qrImg);
}

function downloadQRCode() {
    if (!qrCodeDataURL) {
        alert('Générez d\'abord un QR code');
        return;
    }

    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = qrCodeDataURL;
    link.click();
}
