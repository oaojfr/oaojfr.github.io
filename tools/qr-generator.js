const qrText = document.getElementById('qrText');
const qrSize = document.getElementById('qrSize');
const generateBtn = document.getElementById('generateBtn');
const qrcodeContainer = document.getElementById('qrcode');
const downloadBtn = document.getElementById('downloadBtn');
const qrHint = document.getElementById('qrHint');

function generateQr() {
    const text = qrText.value.trim();
    const size = parseInt(qrSize.value, 10);

    if (!text) {
        qrcodeContainer.innerHTML = '';
        downloadBtn.href = '#';
        qrHint.style.display = 'block';
        return;
    }

    qrHint.style.display = 'none';
    qrcodeContainer.innerHTML = '';

    // eslint-disable-next-line no-new
    new QRCode(qrcodeContainer, {
        text,
        width: size,
        height: size,
        colorDark: '#e9d5ff',
        colorLight: '#1a1625'
    });

    setTimeout(() => {
        const img = qrcodeContainer.querySelector('img');
        const canvas = qrcodeContainer.querySelector('canvas');

        if (img && img.src) {
            downloadBtn.href = img.src;
            downloadBtn.download = 'qr-code.png';
        } else if (canvas) {
            downloadBtn.href = canvas.toDataURL('image/png');
            downloadBtn.download = 'qr-code.png';
        }
    }, 50);
}

generateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    generateQr();
});

qrText.addEventListener('input', () => {
    generateQr();
});

qrSize.addEventListener('change', () => {
    generateQr();
});
