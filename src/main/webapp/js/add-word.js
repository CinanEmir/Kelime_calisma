// add-word.js

const saveWordBtn = document.getElementById('saveWordBtn');
const successSound = new Audio('/sounds/success.mp3');

if (saveWordBtn) {
    saveWordBtn.addEventListener('click', saveNewWord);
}

async function saveNewWord() {
    const newWord = document.getElementById('newWord').value.trim();
    const newMeaning = document.getElementById('newMeaning').value.trim();
    const newExample = document.getElementById('newExample').value.trim();

    if (newWord === '' || newMeaning === '' || newExample === '') {
        alert("Lütfen tüm alanları doldurun.");
        return;
    }

    const newWordObject = {
        word: newWord,
        meaning: newMeaning,
        example: newExample
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
            // Kelime başarıyla eklendiğinde sesi çal
            successSound.play();
            alert("Kelime başarıyla eklendi!");
            window.location.href = 'main-screen.html';
        } else {
            alert("Kelime eklenirken bir hata oluştu.");
        }
    } catch (error) {
        console.error("Kelime eklenirken bir hata oluştu:", error);
        alert("Bağlantı hatası veya sunucuya ulaşılamıyor.");
    }
}