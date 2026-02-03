const pdfFile = document.getElementById('pdfFile');
const compressBtn = document.getElementById('compressBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusText = document.getElementById('statusText');
const metaText = document.getElementById('metaText');
const presetButtons = document.querySelectorAll('.preset-btn');

let sourceBytes = null;
let sourceName = 'compressed.pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function updateStatus(message) {
    statusText.textContent = message;
}

function updateMeta(message) {
    metaText.textContent = message;
}

function formatSize(bytes) {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
}

const presets = {
    lossless: { mode: 'lossless' },
    balanced: { scale: 0.9, quality: 0.85 },
    compact: { scale: 0.75, quality: 0.7 },
    max: { scale: 0.65, quality: 0.6 },
    ultra: { scale: 0.55, quality: 0.5 }
};

let activePreset = 'lossless';

function applyPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    activePreset = name;

    presetButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === name);
    });
}

pdfFile.addEventListener('change', async () => {
    const file = pdfFile.files && pdfFile.files[0];
    if (!file) return;

    sourceName = file.name.replace(/\.pdf$/i, '') + '-compressed.pdf';
    sourceBytes = await file.arrayBuffer();
    updateStatus('PDF chargé. Prêt à compresser.');
    updateMeta(`Taille initiale : ${formatSize(sourceBytes.byteLength)}`);
});

presetButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        applyPreset(btn.dataset.preset);
    });
});

applyPreset('lossless');

compressBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!sourceBytes) {
        updateStatus('Ajoute un PDF avant.');
        return;
    }

    const preset = presets[activePreset] || presets.compact;

    updateStatus('Compression en cours...');
    updateMeta('');

    try {
        if (preset.mode === 'lossless') {
            const pdfDoc = await PDFLib.PDFDocument.load(sourceBytes);
            pdfDoc.setTitle('');
            pdfDoc.setAuthor('');
            pdfDoc.setSubject('');
            pdfDoc.setKeywords([]);
            pdfDoc.setProducer('');
            pdfDoc.setCreator('');

            const optimizedBytes = await pdfDoc.save({ useObjectStreams: true });
            const blob = new Blob([optimizedBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            downloadBtn.href = url;
            downloadBtn.download = sourceName;

            updateStatus('Optimisation sans perte terminée.');
            updateMeta(`Taille finale : ${formatSize(optimizedBytes.byteLength)}`);
            return;
        }

        const { scale, quality } = preset;
        const pdf = await pdfjsLib.getDocument({ data: sourceBytes }).promise;
        const newPdf = await PDFLib.PDFDocument.create();

        for (let i = 1; i <= pdf.numPages; i += 1) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport }).promise;

            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            const imageBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
            const jpgImage = await newPdf.embedJpg(imageBytes);

            const pdfPage = newPdf.addPage([viewport.width, viewport.height]);
            pdfPage.drawImage(jpgImage, {
                x: 0,
                y: 0,
                width: viewport.width,
                height: viewport.height
            });
        }

        const compressedBytes = await newPdf.save();
        const blob = new Blob([compressedBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        downloadBtn.href = url;
        downloadBtn.download = sourceName;

        updateStatus('Compression terminée.');
        updateMeta(`Taille finale : ${formatSize(compressedBytes.byteLength)}`);
    } catch (error) {
        updateStatus('Erreur lors de la compression.');
        updateMeta(error.message || '');
    }
});
