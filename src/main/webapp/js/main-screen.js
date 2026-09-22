// main-screen.js

// ==========================================================================
// 1. Web Audio API Ses Sentezleyici (Sıfır Dış Dosya Bağımlılığı)
// ==========================================================================
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playClickSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
}

function playSuccessSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
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

function playStarSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        [880, 1318.51].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.09, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.25);
        });
    } catch (e) {}
}

// ==========================================================================
// 2. Uygulama Durumu ve LocalStorage Yönetimi (Vercel / APK Uyumlu)
// ==========================================================================
let allWords = [];
let availableIndices = [];
let currentWord = null;
let currentExampleIndex = 0;
let isMeaningRevealed = false;

const STORAGE_KEYS = {
    LEARNED: 'kelime_learned_words',
    STARRED: 'kelime_starred_words',
    CUSTOM: 'kelime_custom_words',
    DELETED: 'kelime_deleted_words',
    AUTO_REVEAL: 'kelime_auto_reveal'
};

function loadSetFromStorage(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
        return new Set();
    }
}

function saveSetToStorage(key, set) {
    try {
        localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch (e) {}
}

function loadArrayFromStorage(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

let learnedWords = loadSetFromStorage(STORAGE_KEYS.LEARNED);
let starredWords = loadSetFromStorage(STORAGE_KEYS.STARRED);
let autoRevealEnabled = localStorage.getItem(STORAGE_KEYS.AUTO_REVEAL) === 'true';

// Birleştirilmiş Kelime Listesi (Dahili JSON + Kullanıcının Ekledikleri - Silinenler)
function loadMergedWords(builtInWords) {
    const customWords = loadArrayFromStorage(STORAGE_KEYS.CUSTOM);
    const deletedSet = loadSetFromStorage(STORAGE_KEYS.DELETED);

    const wordMap = new Map();

    // 1. Dahili kelimeleri ekle (silinenler hariç)
    if (Array.isArray(builtInWords)) {
        builtInWords.forEach(w => {
            if (w && w.word && !deletedSet.has(w.word.toLowerCase())) {
                wordMap.set(w.word.toLowerCase(), w);
            }
        });
    }

    // 2. Kullanıcının eklediği özel kelimeleri ekle (silinenler hariç)
    if (Array.isArray(customWords)) {
        customWords.forEach(w => {
            if (w && w.word && !deletedSet.has(w.word.toLowerCase())) {
                wordMap.set(w.word.toLowerCase(), w);
            }
        });
    }

    return Array.from(wordMap.values());
}

// DOM Elementleri
const getWordBtn = document.getElementById('getWordBtn');
const speakBtn = document.getElementById('speakBtn');
const nextExampleBtn = document.getElementById('next-example-btn');
const favBtn = document.getElementById('favBtn');
const markLearnedBtn = document.getElementById('markLearnedBtn');
const learnedBtnText = document.getElementById('learnedBtnText');
const toggleAutoRevealBtn = document.getElementById('toggleAutoRevealBtn');
const autoRevealStatus = document.getElementById('autoRevealStatus');
const meaningContainer = document.getElementById('meaningContainer');
const meaningEl = document.getElementById('meaning');
const exampleMeaningEl = document.getElementById('example-meaning');
const revealBtn = document.getElementById('revealBtn');
const poolCountEl = document.getElementById('pool-count');
const wordBadgeEl = document.getElementById('word-badge');
const exampleCounterEl = document.getElementById('example-counter');
const progressPercentText = document.getElementById('progressPercentText');
const progressFill = document.getElementById('progressFill');

// Modal Elementleri
const dictionaryModal = document.getElementById('dictionaryModal');
const openDictionaryBtn = document.getElementById('openDictionaryBtn');
const closeDictionaryBtn = document.getElementById('closeDictionaryBtn');
const dictionarySearch = document.getElementById('dictionarySearch');
const dictionaryList = document.getElementById('dictionaryList');
const modalTotalCount = document.getElementById('modalTotalCount');
const tabAll = document.getElementById('tabAll');
const tabStarred = document.getElementById('tabStarred');
const tabLearned = document.getElementById('tabLearned');
let currentDictionaryTab = 'all';

// ==========================================================================
// 3. Telaffuz (Web Speech API)
// ==========================================================================
const speakWord = (text) => {
    if (!text) return;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("Tarayıcı telaffuz özelliğini desteklemiyor.");
    }
};

// ==========================================================================
// 4. İlerleme ve Rozet Güncellemeleri
// ==========================================================================
function updateProgress() {
    if (allWords.length === 0) return;

    const actualLearned = allWords.filter(w => learnedWords.has(w.word.toLowerCase())).length;
    const total = allWords.length;
    const percent = Math.round((actualLearned / total) * 100);

    if (progressPercentText) {
        progressPercentText.innerText = `${percent}% (${actualLearned} / ${total})`;
    }
    if (progressFill) {
        progressFill.style.width = `${percent}%`;
    }

    const activeCount = getActivePoolIndices().length;
    if (poolCountEl) {
        poolCountEl.innerText = `${activeCount} Aktif`;
    }

    // Modal Sekme Sayıları
    if (tabAll) tabAll.innerText = `Tümü (${total})`;
    if (tabStarred) tabStarred.innerText = `⭐ Favoriler (${allWords.filter(w => starredWords.has(w.word.toLowerCase())).length})`;
    if (tabLearned) tabLearned.innerText = `✅ Öğrenilenler (${actualLearned})`;
    if (modalTotalCount) modalTotalCount.innerText = total;
}

// Aktif Havuz İndekslerini Al (Öğrenilenler hariç)
function getActivePoolIndices() {
    return allWords
        .map((w, idx) => ({ word: w.word.toLowerCase(), idx }))
        .filter(item => !learnedWords.has(item.word))
        .map(item => item.idx);
}

// ==========================================================================
// 5. Flashcard Gizle / Göster (Reveal Interaction)
// ==========================================================================
function setMeaningReveal(revealed) {
    isMeaningRevealed = revealed;
    if (revealed) {
        if (meaningEl) meaningEl.classList.remove('meaning-blurred');
        if (exampleMeaningEl) exampleMeaningEl.classList.remove('meaning-blurred');
        if (revealBtn) revealBtn.style.display = 'none';
    } else {
        if (meaningEl) meaningEl.classList.add('meaning-blurred');
        if (exampleMeaningEl) exampleMeaningEl.classList.add('meaning-blurred');
        if (revealBtn) revealBtn.style.display = 'flex';
    }
}

function toggleAutoReveal() {
    playClickSound();
    autoRevealEnabled = !autoRevealEnabled;
    localStorage.setItem(STORAGE_KEYS.AUTO_REVEAL, autoRevealEnabled);
    updateAutoRevealUI();
    if (autoRevealEnabled) {
        setMeaningReveal(true);
    }
}

function updateAutoRevealUI() {
    if (autoRevealStatus) {
        autoRevealStatus.innerText = autoRevealEnabled ? "Anlamlar: Açık" : "Anlamlar: Gizli";
    }
    if (toggleAutoRevealBtn) {
        toggleAutoRevealBtn.style.color = autoRevealEnabled ? "var(--accent-cyan)" : "var(--text-muted)";
    }
}

// ==========================================================================
// 6. Kelime Kartını Ekrana Basma
// ==========================================================================
function renderWord(word) {
    if (!word) return;
    currentWord = word;
    currentExampleIndex = 0;

    const wordEl = document.getElementById('word-text');
    if (wordEl) wordEl.innerText = currentWord.word || '';
    if (meaningEl) meaningEl.innerText = currentWord.meaning || '';

    // Gizle/Göster durumunu ayarla
    setMeaningReveal(autoRevealEnabled);

    // Favori Durumu
    const isStarred = starredWords.has(currentWord.word.toLowerCase());
    if (favBtn) {
        favBtn.classList.toggle('active', isStarred);
        favBtn.innerText = isStarred ? '★' : '☆';
    }

    // Öğrenildi Durumu
    const isLearned = learnedWords.has(currentWord.word.toLowerCase());
    if (markLearnedBtn) {
        markLearnedBtn.classList.toggle('active', isLearned);
    }
    if (learnedBtnText) {
        learnedBtnText.innerText = isLearned ? 'Öğrenildi' : 'Öğrendim';
    }

    // Rozet
    if (wordBadgeEl) {
        wordBadgeEl.style.display = 'inline-flex';
        wordBadgeEl.innerText = `#${allWords.indexOf(currentWord) + 1}`;
    }

    renderExample();
}

function renderExample() {
    const exampleEl = document.getElementById('example');

    if (currentWord && Array.isArray(currentWord.examples) && currentWord.examples.length > 0) {
        const ex = currentWord.examples[currentExampleIndex] || currentWord.examples[0];
        if (exampleEl) exampleEl.innerText = ex.en || '';
        if (exampleMeaningEl) exampleMeaningEl.innerText = ex.tr || '';

        if (exampleCounterEl) {
            exampleCounterEl.innerText = `${currentExampleIndex + 1} / ${currentWord.examples.length}`;
        }

        if (nextExampleBtn) {
            nextExampleBtn.style.display = currentWord.examples.length > 1 ? 'inline-flex' : 'none';
        }
    } else {
        if (exampleEl) exampleEl.innerText = 'Örnek cümle bulunmuyor.';
        if (exampleMeaningEl) exampleMeaningEl.innerText = '';
        if (exampleCounterEl) exampleCounterEl.innerText = '0 / 0';
        if (nextExampleBtn) nextExampleBtn.style.display = 'none';
    }
}

// ==========================================================================
// 7. Rastgele Kelime Getirme
// ==========================================================================
async function getRandomWord() {
    try {
        playClickSound();

        if (allWords.length === 0) {
            let builtIn = [];
            try {
                const response = await fetch('/words.json');
                if (response.ok) {
                    builtIn = await response.json();
                }
            } catch (e) {
                console.warn("words.json uzaktan alınamadı.");
            }

            allWords = loadMergedWords(builtIn);
            availableIndices = getActivePoolIndices();
            updateProgress();
        }

        const activeIndices = getActivePoolIndices();

        // Tüm kelimeler öğrenildiyse tebrik ekranı göster
        if (activeIndices.length === 0) {
            showAllLearnedCelebration();
            return;
        }

        // Aktif döngü havuzu boşaldıysa yeniden başlat
        if (availableIndices.length === 0) {
            availableIndices = [...activeIndices];
        }

        // Havuzdan rastgele bir kelime seç
        const pickPos = Math.floor(Math.random() * availableIndices.length);
        const selectedIndex = availableIndices.splice(pickPos, 1)[0];
        const randomWord = allWords[selectedIndex];

        renderWord(randomWord);

    } catch (error) {
        console.error('Kelime yükleme hatası:', error);
        if (meaningEl) meaningEl.innerText = "Kelimeler yüklenemedi.";
    }
}

function showAllLearnedCelebration() {
    const wordEl = document.getElementById('word-text');
    if (wordEl) wordEl.innerText = "Tebrikler! 🎉";
    if (meaningEl) {
        meaningEl.classList.remove('meaning-blurred');
        meaningEl.innerHTML = "Tüm kelimeleri öğrendiniz!<br><button class='btn-secondary' id='resetLearnedBtn' style='margin-top:14px;'>İlerlemeyi Sıfırla ve Baştan Başla</button>";
        const resetBtn = document.getElementById('resetLearnedBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                learnedWords.clear();
                saveSetToStorage(STORAGE_KEYS.LEARNED, learnedWords);
                updateProgress();
                getRandomWord();
            });
        }
    }
    if (revealBtn) revealBtn.style.display = 'none';
    if (exampleCounterEl) exampleCounterEl.innerText = 'Bitti';
    const exampleEl = document.getElementById('example');
    if (exampleEl) exampleEl.innerText = 'Kelime dağarcığınızı başarıyla tamamladınız.';
    if (exampleMeaningEl) exampleMeaningEl.innerText = '';
}

function getNextExample() {
    if (currentWord && Array.isArray(currentWord.examples) && currentWord.examples.length > 1) {
        playClickSound();
        currentExampleIndex = (currentExampleIndex + 1) % currentWord.examples.length;
        renderExample();
    }
}

// ==========================================================================
// 8. Favorileme ve Öğrendim Aksiyonları
// ==========================================================================
function toggleFavorite(wordObj = currentWord) {
    if (!wordObj) return;
    const wordKey = wordObj.word.toLowerCase();
    
    if (starredWords.has(wordKey)) {
        starredWords.delete(wordKey);
        playClickSound();
    } else {
        starredWords.add(wordKey);
        playStarSound();
    }

    saveSetToStorage(STORAGE_KEYS.STARRED, starredWords);
    updateProgress();

    if (currentWord && currentWord.word.toLowerCase() === wordKey) {
        const isStarred = starredWords.has(wordKey);
        if (favBtn) {
            favBtn.classList.toggle('active', isStarred);
            favBtn.innerText = isStarred ? '★' : '☆';
        }
    }

    if (dictionaryModal && dictionaryModal.classList.contains('active')) {
        renderDictionary();
    }
}

function toggleLearned(wordObj = currentWord) {
    if (!wordObj) return;
    const wordKey = wordObj.word.toLowerCase();

    if (learnedWords.has(wordKey)) {
        learnedWords.delete(wordKey);
        playClickSound();
    } else {
        learnedWords.add(wordKey);
        playSuccessSound();
    }

    saveSetToStorage(STORAGE_KEYS.LEARNED, learnedWords);
    updateProgress();

    if (currentWord && currentWord.word.toLowerCase() === wordKey) {
        const isLearned = learnedWords.has(wordKey);
        if (markLearnedBtn) markLearnedBtn.classList.toggle('active', isLearned);
        if (learnedBtnText) learnedBtnText.innerText = isLearned ? 'Öğrenildi' : 'Öğrendim';
    }

    if (dictionaryModal && dictionaryModal.classList.contains('active')) {
        renderDictionary();
    }
}

// ==========================================================================
// 9. Kelime Defteri (Sözlük & Silme) Modalı
// ==========================================================================
function openDictionary() {
    playClickSound();
    if (!dictionaryModal) return;
    dictionaryModal.classList.add('active');
    dictionaryModal.setAttribute('aria-hidden', 'false');
    if (dictionarySearch) {
        dictionarySearch.value = '';
        setTimeout(() => dictionarySearch.focus(), 150);
    }
    renderDictionary();
}

function closeDictionary() {
    playClickSound();
    if (!dictionaryModal) return;
    dictionaryModal.classList.remove('active');
    dictionaryModal.setAttribute('aria-hidden', 'true');
}

function renderDictionary() {
    if (!dictionaryList) return;
    const query = dictionarySearch ? dictionarySearch.value.trim().toLowerCase() : '';

    let list = allWords.filter(w => {
        const wordKey = w.word.toLowerCase();
        if (currentDictionaryTab === 'starred' && !starredWords.has(wordKey)) return false;
        if (currentDictionaryTab === 'learned' && !learnedWords.has(wordKey)) return false;
        
        if (!query) return true;
        return w.word.toLowerCase().includes(query) || (w.meaning && w.meaning.toLowerCase().includes(query));
    });

    if (list.length === 0) {
        dictionaryList.innerHTML = `<div class="empty-state">Eşleşen kelime bulunamadı.</div>`;
        return;
    }

    dictionaryList.innerHTML = list.map(item => {
        const wordKey = item.word.toLowerCase();
        const isStarred = starredWords.has(wordKey);
        const isLearned = learnedWords.has(wordKey);

        return `
            <div class="word-item-row" data-word="${item.word}">
                <div class="word-item-content">
                    <div class="word-item-title">
                        <span>${item.word}</span>
                    </div>
                    <div class="word-item-meaning">${item.meaning}</div>
                </div>
                <div class="word-item-actions">
                    <button class="btn-row-action btn-speak" title="Telaffuz Et" data-action="speak">🔊</button>
                    <button class="btn-row-action btn-star" title="Favorilere Ekle" data-action="star" style="color: ${isStarred ? 'var(--accent-gold)' : 'inherit'}">
                        ${isStarred ? '★' : '☆'}
                    </button>
                    <button class="btn-row-action btn-check" title="Öğrenildi Olarak İşaretle" data-action="learn" style="color: ${isLearned ? 'var(--accent-green)' : 'inherit'}">
                        ${isLearned ? '✅' : '✔️'}
                    </button>
                    <button class="btn-row-action btn-row-delete" title="Bu Kelimeyi Sil" data-action="delete">🗑️</button>
                </div>
            </div>
        `;
    }).join('');

    // Satır Butonlarına Dinleyiciler
    dictionaryList.querySelectorAll('.word-item-row').forEach(row => {
        const wordName = row.getAttribute('data-word');
        const wordObj = allWords.find(w => w.word.toLowerCase() === wordName.toLowerCase());

        row.querySelector('[data-action="speak"]').addEventListener('click', (e) => {
            e.stopPropagation();
            speakWord(wordName);
        });

        row.querySelector('[data-action="star"]').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(wordObj);
        });

        row.querySelector('[data-action="learn"]').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLearned(wordObj);
        });

        row.querySelector('[data-action="delete"]').addEventListener('click', async (e) => {
            e.stopPropagation();
            await deleteWord(wordName);
        });
    });
}

// Kelimeyi Sunucudan ve Hafızadan Silme (Vercel & Yerel Uyumlu)
async function deleteWord(wordName) {
    if (!confirm(`"${wordName}" kelimesini havuzdan tamamen silmek istediğinize emin misiniz?`)) {
        return;
    }

    const cleanWord = wordName.toLowerCase();
    playClickSound();

    // 1. Silinenler listesine (LocalStorage) ekle
    const deletedSet = loadSetFromStorage(STORAGE_KEYS.DELETED);
    deletedSet.add(cleanWord);
    saveSetToStorage(STORAGE_KEYS.DELETED, deletedSet);

    // 2. Özel eklenenler listesindeyse kaldır
    let customWords = loadArrayFromStorage(STORAGE_KEYS.CUSTOM);
    customWords = customWords.filter(w => w.word.toLowerCase() !== cleanWord);
    localStorage.setItem(STORAGE_KEYS.CUSTOM, JSON.stringify(customWords));

    // 3. Çalışma hafızasından kaldır
    allWords = allWords.filter(w => w.word.toLowerCase() !== cleanWord);
    starredWords.delete(cleanWord);
    learnedWords.delete(cleanWord);
    saveSetToStorage(STORAGE_KEYS.STARRED, starredWords);
    saveSetToStorage(STORAGE_KEYS.LEARNED, learnedWords);

    // 4. Eğer aktif Node sunucusu varsa oradan da sil
    try {
        await fetch('/delete-word', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: wordName })
        });
    } catch (e) {
        // Vercel veya statik ortamda sessizce devam et
    }

    updateProgress();
    renderDictionary();

    if (currentWord && currentWord.word.toLowerCase() === cleanWord) {
        getRandomWord();
    }
}

// ==========================================================================
// 10. Olay Dinleyicileri (Event Listeners)
// ==========================================================================
if (getWordBtn) getWordBtn.addEventListener('click', getRandomWord);
if (nextExampleBtn) nextExampleBtn.addEventListener('click', getNextExample);
if (speakBtn) speakBtn.addEventListener('click', () => { if (currentWord) speakWord(currentWord.word); });
if (favBtn) favBtn.addEventListener('click', () => toggleFavorite());
if (markLearnedBtn) markLearnedBtn.addEventListener('click', () => toggleLearned());
if (toggleAutoRevealBtn) toggleAutoRevealBtn.addEventListener('click', toggleAutoReveal);

// Anlama tıklanınca veya buton tıklandığında aç
if (meaningContainer) {
    meaningContainer.addEventListener('click', () => {
        playClickSound();
        setMeaningReveal(true);
    });
}

// Modal Olayları
if (openDictionaryBtn) openDictionaryBtn.addEventListener('click', openDictionary);
if (closeDictionaryBtn) closeDictionaryBtn.addEventListener('click', closeDictionary);

if (dictionaryModal) {
    dictionaryModal.addEventListener('click', (e) => {
        if (e.target === dictionaryModal) closeDictionary();
    });
}

if (dictionarySearch) {
    dictionarySearch.addEventListener('input', renderDictionary);
}

// Modal Sekmeleri
[tabAll, tabStarred, tabLearned].forEach(tab => {
    if (!tab) return;
    tab.addEventListener('click', () => {
        playClickSound();
        [tabAll, tabStarred, tabLearned].forEach(t => t && t.classList.remove('active'));
        tab.classList.add('active');
        currentDictionaryTab = tab.getAttribute('data-tab');
        renderDictionary();
    });
});

// ==========================================================================
// 11. Klavye Kısayolları
// ==========================================================================
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') closeDictionary();
        return;
    }

    if (e.code === 'Space') {
        e.preventDefault();
        getRandomWord();
    } else if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setMeaningReveal(true);
    } else if (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P') {
        if (currentWord) speakWord(currentWord.word);
    } else if (e.key === 'b' || e.key === 'B' || e.key === 'ArrowRight') {
        getNextExample();
    } else if (e.key === 'l' || e.key === 'L') {
        toggleLearned();
    } else if (e.key === 'f' || e.key === 'F') {
        toggleFavorite();
    } else if (e.key === 'd' || e.key === 'D') {
        if (dictionaryModal && dictionaryModal.classList.contains('active')) {
            closeDictionary();
        } else {
            openDictionary();
        }
    } else if (e.key === 'Escape') {
        closeDictionary();
    }
});

// ==========================================================================
// 12. Başlangıç
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    updateAutoRevealUI();
    getRandomWord();
});
