// add-word.js

const saveWordBtn = document.getElementById('saveWordBtn');
const successSound = new Audio('/sounds/success.mp3');

if (saveWordBtn) {
    saveWordBtn.addEventListener('click', saveNewWord);
}

async function saveNewWord() {
    const newWord = document.getElementById('newWord').value.trim();
    const newMeaning = document.getElementById('newMeaning').value.trim();
    const newExampleEn = document.getElementById('newExampleEn').value.trim();
    const newExampleTr = document.getElementById('newExampleTr').value.trim();

    if (!newWord || !newMeaning || !newExampleEn || !newExampleTr) {
        alert("Lütfen tüm alanları doldurun.");
        return;
    }

    const newWordObject = {
        word: newWord.toLowerCase(),
        meaning: newMeaning,
        examples: [
            {
                en: newExampleEn,
                tr: newExampleTr
            }
        ]
    };

    try {
        const response = await fetch('/add-word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newWordObject)
        });

        if (response.ok) {
            try {
                await successSound.play();
            } catch (e) {
                // Ses dosyası yoksa veya engellendiyse sessizce devam et
            }
            alert("Kelime başarıyla eklendi!");
            window.location.href = 'main-screen.html';
        } else {
            const errorMsg = await response.text();
            alert("Kelime eklenemedi: " + (errorMsg || "Sunucu hatası"));
        }
    } catch (error) {
        console.error("Kelime eklenirken bir hata oluştu:", error);
        alert("Bağlantı hatası veya sunucuya ulaşılamıyor.");
    }
}