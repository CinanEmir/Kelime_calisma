// main-screen.js

// Global Değişkenler
let currentWord = null;
let currentExampleIndex = 0;
let seenWords = [];
const allWords = [];
const clickSound = new Audio('/sounds/click.mp3');

// DOM Elementleri
const getWordBtn = document.getElementById('getWordBtn');
const speakBtn = document.getElementById('speakBtn');
const nextExampleBtn = document.getElementById('next-example-btn');

// Telaffuz işlevi
const speakWord = (text) => {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.6;
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("Tarayıcı telaffuz özelliğini desteklemiyor.");
    }
};

// Olay Dinleyicileri (Listeners)
if (getWordBtn) {
    getWordBtn.addEventListener('click', getRandomWord);
}

if (nextExampleBtn) {
    nextExampleBtn.addEventListener('click', getNextExample);
}

if (speakBtn) {
    speakBtn.addEventListener('click', () => {
        // Kelime metnini doğru span etiketinden al
        const wordText = document.getElementById('word-text').innerText.trim();
        speakWord(wordText);
    });
}

// Rastgele Kelime Getirme Ana İşlevi
async function getRandomWord() {
    try {
        clickSound.play();

        if (allWords.length === 0) {
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

        // Yeni kelimeyi kaydet ve ilk örneği göster
        currentWord = randomWord;
        currentExampleIndex = 0;

        // KELİME VE ANLAMLARINI DOĞRU ID'LERLE GÜNCELLE
        document.getElementById('word-text').innerText = currentWord.word;
        document.getElementById('meaning').innerText = currentWord.meaning;
        document.getElementById('example').innerText = currentWord.examples[currentExampleIndex].en;
        document.getElementById('example-meaning').innerText = currentWord.examples[currentExampleIndex].tr;

    } catch (error) {
        console.error('Kelime listesi yüklenirken bir hata oluştu:', error);
        document.getElementById('word-text').innerText = "Hata!";
        document.getElementById('meaning').innerText = "Veri yüklenemedi.";
    }
}

// Başka Cümle Getirme İşlevi
function getNextExample() {
    if (currentWord && currentWord.examples && currentWord.examples.length > 1) {
        currentExampleIndex = (currentExampleIndex + 1) % currentWord.examples.length;
        document.getElementById('example').innerText = currentWord.examples[currentExampleIndex].en;
        document.getElementById('example-meaning').innerText = currentWord.examples[currentExampleIndex].tr;
    }
}
