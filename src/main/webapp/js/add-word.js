// add-word.js

// Web Audio API ile Hafif Başarı Tonu
function playSuccessTone() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            gain.gain.setValueAtTime(0.1, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.2);
        });
    } catch (e) {}
}

// LocalStorage Yardımcıları
function getCustomWords() {
    try {
        const raw = localStorage.getItem('kelime_custom_words');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveWordToLocalStorage(wordObj) {
    try {
        let customWords = getCustomWords();
        if (!Array.isArray(customWords)) customWords = [];

        // Mükerrer kontrolü
        const exists = customWords.some(w => w.word.toLowerCase() === wordObj.word.toLowerCase());
        if (!exists) {
            customWords.push(wordObj);
            localStorage.setItem('kelime_custom_words', JSON.stringify(customWords));
        }

        // Eğer daha önce silinenler listesindeyse kaldır
        const deletedRaw = localStorage.getItem('kelime_deleted_words');
        if (deletedRaw) {
            let deleted = JSON.parse(deletedRaw);
            if (Array.isArray(deleted)) {
                deleted = deleted.filter(w => w.toLowerCase() !== wordObj.word.toLowerCase());
                localStorage.setItem('kelime_deleted_words', JSON.stringify(deleted));
            }
        }
    } catch (e) {
        console.error("LocalStorage yazma hatası:", e);
    }
}

const saveWordBtn = document.getElementById('saveWordBtn');
if (saveWordBtn) {
    saveWordBtn.addEventListener('click', saveNewWord);
}

async function saveNewWord() {
    const wordInput = document.getElementById('newWord');
    const meaningInput = document.getElementById('newMeaning');
    const wordTypeInput = document.getElementById('newWordType');
    const exampleEnInput = document.getElementById('newExampleEn');
    const exampleTrInput = document.getElementById('newExampleTr');

    const newWord = wordInput ? wordInput.value.trim() : '';
    const newMeaning = meaningInput ? meaningInput.value.trim() : '';
    const newWordType = wordTypeInput ? wordTypeInput.value.trim() : '';
    const newExampleEn = exampleEnInput ? exampleEnInput.value.trim() : '';
    const newExampleTr = exampleTrInput ? exampleTrInput.value.trim() : '';

    if (!newWord || !newMeaning) {
        alert("Lütfen en azından İngilizce kelimeyi ve Türkçe karşılığını doldurun.");
        return;
    }

    const cleanWord = newWord.toLowerCase();

    // 1. Mükerrer Kontrolü (Yerel + Dahili)
    const customWords = getCustomWords();
    const isCustomDuplicate = customWords.some(w => w.word.toLowerCase() === cleanWord);

    if (isCustomDuplicate) {
        alert(`"${newWord}" kelimesi zaten listenizde kayıtlı!`);
        return;
    }

    try {
        const res = await fetch('/words.json');
        if (res.ok) {
            const builtInWords = await res.json();
            const isBuiltInDuplicate = builtInWords.some(w => w.word.toLowerCase() === cleanWord);
            if (isBuiltInDuplicate) {
                alert(`"${newWord}" kelimesi zaten kelime havuzunda mevcut!`);
                return;
            }
        }
    } catch (e) {
        // Çevrimdışıysa devam et
    }

    // Örnek cümle varsa ekle, yoksa boş dizi olarak kaydet
    const examples = [];
    if (newExampleEn) {
        examples.push({
            en: newExampleEn,
            tr: newExampleTr || ''
        });
    }

    const newWordObject = {
        word: cleanWord,
        type: newWordType || undefined,
        meaning: newMeaning,
        examples: examples
    };

    // 2. Her Zaman LocalStorage'a Kaydet (Vercel & APK & Çevrimdışı için garanti)
    saveWordToLocalStorage(newWordObject);

    // 3. Eğer Arka Planda Node.js Sunucusu Varsa Oraya da Gönder
    try {
        await fetch('/add-word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newWordObject)
        });
    } catch (e) {
        // Sunucu yoksa veya Vercel'deyse (404) sorun yok, localStorage'da saklandı
    }

    // Başarı Efekti ve Yönlendirme
    playSuccessTone();
    alert(`"${newWord}" başarıyla kelime havuzuna eklendi!`);
    window.location.href = 'main-screen.html';
}