// Color Generator Tool
let currentColor = '#667eea';

// Initialize color picker
document.addEventListener('DOMContentLoaded', function() {
    const colorPicker = document.getElementById('color-picker');
    const colorInput = document.getElementById('color-input');
    
    if (colorPicker && colorInput) {
        // Sync color picker and input
        colorPicker.addEventListener('input', function() {
            currentColor = this.value;
            colorInput.value = currentColor;
            updateColorFormats();
        });
        
        colorInput.addEventListener('input', function() {
            if (isValidColor(this.value)) {
                currentColor = this.value;
                colorPicker.value = currentColor;
                updateColorFormats();
            }
        });
        
        // Initialize
        updateColorFormats();
    }
});

function isValidColor(color) {
    return /^#([0-9A-F]{3}){1,2}$/i.test(color);
}

function generatePalette() {
    const palette = document.getElementById('color-palette');
    if (!palette) return;
    
    const colors = generateColorHarmony(currentColor);
    
    palette.innerHTML = '';
    colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.setAttribute('data-color', color);
        swatch.title = `Cliquer pour copier ${color}`;
        swatch.addEventListener('click', () => copyToClipboard(color));
        palette.appendChild(swatch);
    });
}

function generateColorHarmony(baseColor) {
    const hsl = hexToHsl(baseColor);
    const colors = [baseColor];
    
    // Complementary
    colors.push(hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l));
    
    // Triadic
    colors.push(hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l));
    colors.push(hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l));
    
    // Analogous
    colors.push(hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l));
    colors.push(hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l));
    
    // Shades and tints
    colors.push(hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 20)));
    colors.push(hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 20)));
    
    return colors;
}

function randomColor() {
    const randomHex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    currentColor = randomHex;
    
    const colorPicker = document.getElementById('color-picker');
    const colorInput = document.getElementById('color-input');
    
    if (colorPicker) colorPicker.value = currentColor;
    if (colorInput) colorInput.value = currentColor;
    
    updateColorFormats();
    generatePalette();
}

function updateColorFormats() {
    const formatsDiv = document.getElementById('color-formats');
    if (!formatsDiv) return;
    
    const hex = currentColor;
    const rgb = hexToRgb(hex);
    const hsl = hexToHsl(hex);
    
    const formats = [
        { name: 'HEX', value: hex },
        { name: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
        { name: 'HSL', value: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)` }
    ];
    
    formatsDiv.innerHTML = formats.map(format => `
        <div class="color-format">
            <strong>${format.name}:</strong>
            <span onclick="copyToClipboard('${format.value}')" style="cursor: pointer;">${format.value}</span>
        </div>
    `).join('');
}

// Color conversion utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function hexToHsl(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    
    let { r, g, b } = rgb;
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = c => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const notification = document.createElement('div');
        notification.textContent = `Copié: ${text}`;
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
        setTimeout(() => notification.remove(), 2000);
    });
}
