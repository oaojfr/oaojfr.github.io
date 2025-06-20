// Lorem Ipsum Generator
const loremWords = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
    'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
    'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
    'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
    'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
    'mollit', 'anim', 'id', 'est', 'laborum', 'at', 'vero', 'eos', 'accusamus', 'accusantium',
    'doloremque', 'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo'
];

function generateLorem() {
    const type = document.getElementById('lorem-type').value;
    const count = parseInt(document.getElementById('lorem-count').value);
    const startWithLorem = document.getElementById('lorem-start').value === 'yes';
    
    let result = '';
    
    if (type === 'words') {
        const words = [];
        if (startWithLorem) {
            words.push('Lorem', 'ipsum', 'dolor', 'sit', 'amet');
        }
        for (let i = words.length; i < count; i++) {
            words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
        }
        result = words.join(' ') + '.';
    } else if (type === 'sentences') {
        for (let i = 0; i < count; i++) {
            const sentenceLength = Math.floor(Math.random() * 10) + 5;
            const words = [];
            
            if (i === 0 && startWithLorem) {
                words.push('Lorem', 'ipsum', 'dolor', 'sit', 'amet');
            }
            
            for (let j = words.length; j < sentenceLength; j++) {
                words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
            }
            
            words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
            result += words.join(' ') + '. ';
        }
    } else { // paragraphs
        for (let i = 0; i < count; i++) {
            const sentences = Math.floor(Math.random() * 5) + 3;
            let paragraph = '';
            
            for (let j = 0; j < sentences; j++) {
                const sentenceLength = Math.floor(Math.random() * 10) + 5;
                const words = [];
                
                if (i === 0 && j === 0 && startWithLorem) {
                    words.push('Lorem', 'ipsum', 'dolor', 'sit', 'amet');
                }
                
                for (let k = words.length; k < sentenceLength; k++) {
                    words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
                }
                
                words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
                paragraph += words.join(' ') + '. ';
            }
            
            result += paragraph + '\n\n';
        }
    }
    
    const output = document.getElementById('lorem-output');
    output.value = result.trim();
    output.style.display = 'block';
}

function copyLorem() {
    const output = document.getElementById('lorem-output');
    if (!output.value) {
        alert('Générez d\'abord du texte');
        return;
    }
    
    output.select();
    document.execCommand('copy');
    alert('Texte copié dans le presse-papiers !');
}
