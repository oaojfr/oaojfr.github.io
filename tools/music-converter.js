const audioFile = document.getElementById('audioFile');
const coverFile = document.getElementById('coverFile');
const formatSelect = document.getElementById('formatSelect');
const bitrateSelect = document.getElementById('bitrateSelect');
const titleInput = document.getElementById('titleInput');
const artistInput = document.getElementById('artistInput');
const albumInput = document.getElementById('albumInput');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusText = document.getElementById('statusText');
const metaText = document.getElementById('metaText');
const coverPreview = document.getElementById('coverPreview');

const { FFmpeg } = FFmpegWASM;
const ffmpeg = new FFmpeg();
let ffmpegLoaded = false;

let sourceName = 'audio';
let sourceBytes = null;
let coverBytes = null;
let embeddedCoverBytes = null;
let coverObjectUrl = null;

function updateStatus(message) {
    statusText.textContent = message;
}

function updateMeta(message) {
    metaText.textContent = message;
}

async function ensureFfmpegLoaded() {
    if (ffmpegLoaded) return;
    await ffmpeg.load({
        coreURL: '/assets/vendor/ffmpeg-core.js',
        wasmURL: '/assets/vendor/ffmpeg-core.wasm',
        workerURL: '/assets/vendor/814.ffmpeg.js'
    });
    ffmpegLoaded = true;
}

function setCoverPreview(file) {
    if (coverObjectUrl) {
        URL.revokeObjectURL(coverObjectUrl);
        coverObjectUrl = null;
    }

    if (!file) {
        coverPreview.innerHTML = '<span class="note">Pochette</span>';
        return;
    }

    coverObjectUrl = URL.createObjectURL(file);
    coverPreview.innerHTML = `<img src="${coverObjectUrl}" alt="Cover" />`;
}

function setCoverPreviewFromTag(tag) {
    if (!tag || !tag.data || !tag.format) {
        setCoverPreview(null);
        return;
    }

    const byteArray = new Uint8Array(tag.data);
    const blob = new Blob([byteArray], { type: tag.format });
    embeddedCoverBytes = byteArray.buffer;
    const file = new File([blob], 'cover', { type: tag.format });
    if (!coverBytes) {
        setCoverPreview(file);
    }
}

async function tryLoadEmbeddedCover(file) {
    if (!file || !window.jsmediatags) return false;
    const isMp3 = file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3');
    if (!isMp3) return false;

    return new Promise((resolve) => {
        window.jsmediatags.read(file, {
            onSuccess: (data) => {
                const picture = data.tags && data.tags.picture;
                if (picture) {
                    setCoverPreviewFromTag(picture);
                    resolve(true);
                } else {
                    resolve(false);
                }
            },
            onError: () => {
                resolve(false);
            }
        });
    });
}

async function tryExtractCoverWithFFmpeg() {
    if (!sourceBytes) return false;
    await ensureFfmpegLoaded();

    const inputName = 'input.audio';
    const coverName = 'cover.jpg';

    try {
        await ffmpeg.writeFile(inputName, new Uint8Array(sourceBytes));
        try { await ffmpeg.deleteFile(coverName); } catch (e) { /* ignore */ }

        await ffmpeg.exec(['-i', inputName, '-map', '0:v:0', '-frames:v', '1', coverName]);

        const data = await ffmpeg.readFile(coverName);
        embeddedCoverBytes = data.buffer;
        const blob = new Blob([data.buffer], { type: 'image/jpeg' });
        if (!coverBytes) {
            setCoverPreview(new File([blob], 'cover.jpg', { type: 'image/jpeg' }));
        }
        return true;
    } catch (e) {
        return false;
    }
}

audioFile.addEventListener('change', async () => {
    const file = audioFile.files && audioFile.files[0];
    if (!file) return;

    sourceName = file.name.replace(/\.[^/.]+$/, '');
    sourceBytes = await file.arrayBuffer();
    updateStatus('Fichier chargé.');
    updateMeta(`${(file.size / 1024 / 1024).toFixed(2)} MB`);
    embeddedCoverBytes = null;
    const hasCover = await tryLoadEmbeddedCover(file);
    if (!hasCover) {
        await tryExtractCoverWithFFmpeg();
    }
});

coverFile.addEventListener('change', async () => {
    const file = coverFile.files && coverFile.files[0];
    if (!file) {
        coverBytes = null;
        if (embeddedCoverBytes) {
            const blob = new Blob([embeddedCoverBytes], { type: 'image/jpeg' });
            setCoverPreview(new File([blob], 'cover', { type: 'image/jpeg' }));
        } else {
            setCoverPreview(null);
        }
        return;
    }

    coverBytes = await file.arrayBuffer();
    setCoverPreview(file);
});

convertBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    if (!sourceBytes) {
        updateStatus('Ajoute un fichier audio.');
        return;
    }

    const format = formatSelect.value;
    const bitrate = bitrateSelect.value;

    updateStatus('Préparation...');
    updateMeta('');

    updateStatus('Chargement du convertisseur...');
    await ensureFfmpegLoaded();

    const inputName = 'input.audio';
    await ffmpeg.writeFile(inputName, new Uint8Array(sourceBytes));

    const args = ['-y', '-i', inputName, '-vn', '-map', '0:a:0'];

    const title = titleInput.value.trim();
    const artist = artistInput.value.trim();
    const album = albumInput.value.trim();

    if (title) args.push('-metadata', `title=${title}`);
    if (artist) args.push('-metadata', `artist=${artist}`);
    if (album) args.push('-metadata', `album=${album}`);

    let outputName = `${sourceName}.${format}`;

    if (format === 'mp3') {
        args.push('-c:a', 'libmp3lame', '-b:a', bitrate);
        const coverToUse = coverBytes || embeddedCoverBytes;
        if (coverToUse) {
            const coverName = 'cover.jpg';
            await ffmpeg.writeFile(coverName, new Uint8Array(coverToUse));
            args.push('-i', coverName, '-map', '0:a:0', '-map', '1:v:0', '-id3v2_version', '3', '-metadata:s:v', 'title=Album cover', '-metadata:s:v', 'comment=Cover (front)');
        }
    } else if (format === 'wav') {
        args.push('-c:a', 'pcm_s16le');
    } else if (format === 'flac') {
        args.push('-c:a', 'flac', '-compression_level', '5');
    }

    args.push(outputName);

    updateStatus('Conversion en cours...');

    try {
        await ffmpeg.exec(args);
        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data.buffer], { type: `audio/${format}` });
        const url = URL.createObjectURL(blob);

        downloadBtn.href = url;
        downloadBtn.download = outputName;

        updateStatus('Conversion terminée.');
        updateMeta(`${(blob.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
        updateStatus('Erreur lors de la conversion.');
        updateMeta(error.message || '');
    }
});
