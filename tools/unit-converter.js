// Unit Converter Tool

const unitData = {
    length: {
        name: 'Longueur',
        units: {
            'mm': { name: 'Millimètres', factor: 1 },
            'cm': { name: 'Centimètres', factor: 10 },
            'm': { name: 'Mètres', factor: 1000 },
            'km': { name: 'Kilomètres', factor: 1000000 },
            'in': { name: 'Pouces', factor: 25.4 },
            'ft': { name: 'Pieds', factor: 304.8 },
            'yd': { name: 'Yards', factor: 914.4 },
            'mi': { name: 'Miles', factor: 1609344 }
        }
    },
    weight: {
        name: 'Poids',
        units: {
            'mg': { name: 'Milligrammes', factor: 1 },
            'g': { name: 'Grammes', factor: 1000 },
            'kg': { name: 'Kilogrammes', factor: 1000000 },
            'oz': { name: 'Onces', factor: 28349.5 },
            'lb': { name: 'Livres', factor: 453592 },
            'st': { name: 'Stones', factor: 6350293 },
            't': { name: 'Tonnes', factor: 1000000000 }
        }
    },
    temperature: {
        name: 'Température',
        units: {
            'c': { name: 'Celsius', factor: 1 },
            'f': { name: 'Fahrenheit', factor: 1 },
            'k': { name: 'Kelvin', factor: 1 }
        }
    },
    filesize: {
        name: 'Taille de fichier',
        units: {
            'b': { name: 'Bytes', factor: 1 },
            'kb': { name: 'Kilobytes', factor: 1024 },
            'mb': { name: 'Megabytes', factor: 1024 * 1024 },
            'gb': { name: 'Gigabytes', factor: 1024 * 1024 * 1024 },
            'tb': { name: 'Terabytes', factor: 1024 * 1024 * 1024 * 1024 }
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const unitInput = document.getElementById('unit-input');
    if (unitInput) {
        unitInput.addEventListener('input', convertUnits);
    }
    
    updateUnitOptions();
});

function updateUnitOptions() {
    const category = document.getElementById('unit-category').value;
    const fromSelect = document.getElementById('unit-from');
    const toSelect = document.getElementById('unit-to');
    
    if (!fromSelect || !toSelect) return;
    
    const units = unitData[category].units;
    const options = Object.keys(units).map(key => 
        `<option value="${key}">${units[key].name}</option>`
    ).join('');
    
    fromSelect.innerHTML = options;
    toSelect.innerHTML = options;
    
    // Set different default values
    if (Object.keys(units).length > 1) {
        toSelect.selectedIndex = 1;
    }
    
    // Clear previous result
    document.getElementById('unit-output').value = '';
    
    // Auto-convert if there's input
    if (document.getElementById('unit-input').value) {
        convertUnits();
    }
}

function convertUnits() {
    const category = document.getElementById('unit-category').value;
    const input = parseFloat(document.getElementById('unit-input').value);
    const fromUnit = document.getElementById('unit-from').value;
    const toUnit = document.getElementById('unit-to').value;
    const output = document.getElementById('unit-output');
    
    if (!output) return;
    
    if (isNaN(input)) {
        output.value = '';
        return;
    }
    
    let result;
    
    if (category === 'temperature') {
        result = convertTemperature(input, fromUnit, toUnit);
    } else {
        const units = unitData[category].units;
        const fromFactor = units[fromUnit].factor;
        const toFactor = units[toUnit].factor;
        
        // Convert to base unit, then to target unit
        const baseValue = input * fromFactor;
        result = baseValue / toFactor;
    }
    
    // Format result
    output.value = result.toFixed(6).replace(/\.?0+$/, '');
}

function convertTemperature(value, from, to) {
    // Convert to Celsius first
    let celsius;
    switch (from) {
        case 'c':
            celsius = value;
            break;
        case 'f':
            celsius = (value - 32) * 5/9;
            break;
        case 'k':
            celsius = value - 273.15;
            break;
    }
    
    // Convert from Celsius to target
    switch (to) {
        case 'c':
            return celsius;
        case 'f':
            return celsius * 9/5 + 32;
        case 'k':
            return celsius + 273.15;
    }
}

// Auto-convert on category change
document.addEventListener('change', function(e) {
    if (e.target.id === 'unit-category') {
        updateUnitOptions();
    } else if (['unit-from', 'unit-to'].includes(e.target.id)) {
        convertUnits();
    }
});
