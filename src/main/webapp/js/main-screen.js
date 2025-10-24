// main-screen.js

const getWordBtn = document.getElementById('getWordBtn');
const clickSound = new Audio('/sounds/clickk.mp3'); 

if (getWordBtn) {
    getWordBtn.addEventListener('click', getRandomWord);
}

let seenWords = [];
const allWords = [];

async function getRandomWord() {
    try {
        // Butona tıklandığında sesi çal
        clickSound.play();

        if (allWords.length === 0) {
            // Node.js sunucusu için doğru yolu kullan
            const response = await fetch('/words.json');
            const words = await response.json();
            allWords.push(...words);
        }

        if (allWords.length === seenWords.length) {
            console.log("Tüm kelimeler gösterildi, liste sıfırlanıyor.");
            seenWords = [];
        }

        let randomWord;
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * allWords.length);
            randomWord = allWords[randomIndex];
        } while (seenWords.includes(randomWord.word));

        seenWords.push(randomWord.word);

        // Kelime bilgilerini ekrana yazdırma
        document.getElementById('word').innerText = randomWord.word;
        document.getElementById('meaning').innerText = randomWord.meaning;
        document.getElementById('example').innerText = randomWord.example;
        document.getElementById('example-meaning').innerText = randomWord.example_meaning;

    } catch (error) {
        console.error('Kelime listesi yüklenirken bir hata oluştu:', error);
        document.getElementById('word').innerText = "Hata oluştu.";
    }
}
// ... (Diğer kodlar)

let currentWord = null;
let currentExampleIndex = 0;

const nextExampleBtn = document.getElementById('next-example-btn');
nextExampleBtn.addEventListener('click', () => {
    if (currentWord && currentWord.examples.length > 1) {
        currentExampleIndex = (currentExampleIndex + 1) % currentWord.examples.length;
        document.getElementById('example').innerText = currentWord.examples[currentExampleIndex].en;
        document.getElementById('example-meaning').innerText = currentWord.examples[currentExampleIndex].tr;
    }
});

async function getRandomWord() {
    // ... (Diğer kodlar)
    
    // Kelimeyi çektikten sonra
    currentWord = randomWord;
    currentExampleIndex = 0;

    document.getElementById('word').innerText = currentWord.word;
    document.getElementById('meaning').innerText = currentWord.meaning;
    document.getElementById('example').innerText = currentWord.examples[currentExampleIndex].en;
    document.getElementById('example-meaning').innerText = currentWord.examples[currentExampleIndex].tr;
}
