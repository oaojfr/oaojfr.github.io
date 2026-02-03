const category = document.getElementById('category');
const valueInput = document.getElementById('valueInput');
const fromUnit = document.getElementById('fromUnit');
const toUnit = document.getElementById('toUnit');
const resultBox = document.getElementById('resultBox');

const units = {
    length: {
        m: 1,
        km: 1000,
        cm: 0.01,
        mm: 0.001,
        in: 0.0254,
        ft: 0.3048,
        yd: 0.9144,
        mi: 1609.344
    },
    weight: {
        kg: 1,
        g: 0.001,
        mg: 0.000001,
        lb: 0.45359237,
        oz: 0.0283495231
    },
    temperature: {
        c: 'c',
        f: 'f',
        k: 'k'
    }
};

const unitLabels = {
    length: {
        m: 'mètre',
        km: 'kilomètre',
        cm: 'centimètre',
        mm: 'millimètre',
        in: 'pouce',
        ft: 'pied',
        yd: 'yard',
        mi: 'mile'
    },
    weight: {
        kg: 'kilogramme',
        g: 'gramme',
        mg: 'milligramme',
        lb: 'livre',
        oz: 'once'
    },
    temperature: {
        c: 'Celsius',
        f: 'Fahrenheit',
        k: 'Kelvin'
    }
};

function populateUnits() {
    const cat = category.value;
    fromUnit.innerHTML = '';
    toUnit.innerHTML = '';

    Object.keys(units[cat]).forEach((key) => {
        const optionFrom = document.createElement('option');
        optionFrom.value = key;
        optionFrom.textContent = unitLabels[cat][key];

        const optionTo = document.createElement('option');
        optionTo.value = key;
        optionTo.textContent = unitLabels[cat][key];

        fromUnit.appendChild(optionFrom);
        toUnit.appendChild(optionTo);
    });

    if (cat === 'temperature') {
        fromUnit.value = 'c';
        toUnit.value = 'f';
    } else {
        fromUnit.value = Object.keys(units[cat])[0];
        toUnit.value = Object.keys(units[cat])[1];
    }

    convert();
}

function convertTemperature(value, from, to) {
    let celsius;
    if (from === 'c') celsius = value;
    if (from === 'f') celsius = (value - 32) * 5 / 9;
    if (from === 'k') celsius = value - 273.15;

    if (to === 'c') return celsius;
    if (to === 'f') return (celsius * 9 / 5) + 32;
    if (to === 'k') return celsius + 273.15;
    return value;
}

function convert() {
    const cat = category.value;
    const value = parseFloat(valueInput.value);
    if (Number.isNaN(value)) {
        resultBox.textContent = '—';
        return;
    }

    const from = fromUnit.value;
    const to = toUnit.value;

    let result;
    if (cat === 'temperature') {
        result = convertTemperature(value, from, to);
    } else {
        const base = value * units[cat][from];
        result = base / units[cat][to];
    }

    resultBox.textContent = `${value} ${unitLabels[cat][from]} = ${result.toFixed(4)} ${unitLabels[cat][to]}`;
}

category.addEventListener('change', populateUnits);
valueInput.addEventListener('input', convert);
fromUnit.addEventListener('change', convert);
toUnit.addEventListener('change', convert);

populateUnits();
