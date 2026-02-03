const fileInput = document.getElementById('imageFile');
const formatSelect = document.getElementById('formatSelect');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const outputPreview = document.getElementById('outputPreview');
const outputCanvas = document.getElementById('outputCanvas');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const qualityBlock = document.getElementById('qualityBlock');

const ctx = outputCanvas.getContext('2d');
let currentImage = new Image();
let hasImage = false;

function updateQualityUI() {
    const format = formatSelect.value;
    const usesQuality = format === 'jpeg' || format === 'webp';
    qualityBlock.style.display = usesQuality ? 'block' : 'none';
}

function renderToCanvas() {
    if (!hasImage) return;
    outputCanvas.width = currentImage.naturalWidth;
    outputCanvas.height = currentImage.naturalHeight;
    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    ctx.drawImage(currentImage, 0, 0);
}

function updateOutput() {
    if (!hasImage) return;
    const format = formatSelect.value;
    const quality = parseFloat(qualityRange.value);
    const mime = `image/${format}`;
    renderToCanvas();

    const dataUrl = (format === 'jpeg' || format === 'webp')
        ? outputCanvas.toDataURL(mime, quality)
        : outputCanvas.toDataURL(mime);

    outputPreview.src = dataUrl;
    downloadBtn.href = dataUrl;
    downloadBtn.download = `converted.${format === 'jpeg' ? 'jpg' : format}`;
}

fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        currentImage = new Image();
        currentImage.onload = () => {
            hasImage = true;
            updateOutput();
        };
        currentImage.src = reader.result;
    };
    reader.readAsDataURL(file);
});

formatSelect.addEventListener('change', () => {
    updateQualityUI();
    updateOutput();
});

qualityRange.addEventListener('input', () => {
    qualityValue.textContent = Number(qualityRange.value).toFixed(2);
    updateOutput();
});

convertBtn.addEventListener('click', (e) => {
    e.preventDefault();
    updateOutput();
});

updateQualityUI();
qualityValue.textContent = Number(qualityRange.value).toFixed(2);
