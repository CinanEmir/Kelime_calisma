const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const wordsFilePath = path.join(__dirname, 'src/main/webapp/words.json');

app.use(bodyParser.json());
app.use(express.static('src/main/webapp', { dotfiles: 'allow' })); // Statik dosyalari ve .well-known klasorunu sunar

// Kelime ekleme isteğini işleyen endpoint
app.post('/add-word', (req, res) => {
    const newWord = req.body;

    // Temel veri doğrulaması (Validation)
    if (!newWord || typeof newWord.word !== 'string' || !newWord.word.trim() ||
        typeof newWord.meaning !== 'string' || !newWord.meaning.trim()) {
        return res.status(400).send('Geçersiz kelime verisi. Kelime ve anlam zorunludur.');
    }

    const cleanWord = newWord.word.trim().toLowerCase();
    const cleanMeaning = newWord.meaning.trim();
    const cleanExamples = Array.isArray(newWord.examples)
        ? newWord.examples
            .filter(ex => ex && typeof ex.en === 'string' && ex.en.trim())
            .map(ex => ({ en: ex.en.trim(), tr: (ex.tr && typeof ex.tr === 'string') ? ex.tr.trim() : '' }))
        : [];

    const wordToSave = {
        word: cleanWord,
        ...(newWord.type && typeof newWord.type === 'string' ? { type: newWord.type.trim() } : {}),
        meaning: cleanMeaning,
        examples: cleanExamples
    };

    fs.readFile(wordsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Kelime listesi okunamadı:', err);
            return res.status(500).send('Kelime listesi okunamadı (Sunucu hatası).');
        }

        let words = [];
        try {
            words = JSON.parse(data);
            if (!Array.isArray(words)) {
                words = [];
            }
        } catch (parseErr) {
            console.error('JSON çözümleme hatası:', parseErr);
            return res.status(500).send('Kelime veritabanı bozuk (Sunucu hatası).');
        }

        // Mükerrer (Duplicate) kelime kontrolü
        const isDuplicate = words.some(w => w.word && w.word.toLowerCase() === cleanWord);
        if (isDuplicate) {
            return res.status(409).send('Bu kelime zaten listede mevcut!');
        }

        words.push(wordToSave);

        fs.writeFile(wordsFilePath, JSON.stringify(words, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Kelime listesi yazılamadı:', writeErr);
                return res.status(500).send('Kelime kaydedilemedi (Sunucu hatası).');
            }
            res.status(201).send('Kelime başarıyla eklendi!');
        });
    });
});

// Kelime silme endpoint'i
app.delete('/delete-word', (req, res) => {
    const wordToDelete = req.body && req.body.word ? req.body.word.trim().toLowerCase() : null;

    if (!wordToDelete) {
        return res.status(400).send('Silinecek kelime belirtilmedi.');
    }

    fs.readFile(wordsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Kelime listesi okunamadı:', err);
            return res.status(500).send('Kelime listesi okunamadı.');
        }

        let words = [];
        try {
            words = JSON.parse(data);
        } catch (parseErr) {
            return res.status(500).send('Kelime veritabanı okunamadı.');
        }

        const initialLength = words.length;
        words = words.filter(w => w.word && w.word.toLowerCase() !== wordToDelete);

        if (words.length === initialLength) {
            return res.status(404).send('Silinmek istenen kelime bulunamadı.');
        }

        fs.writeFile(wordsFilePath, JSON.stringify(words, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Kelime listesi güncellenemedi:', writeErr);
                return res.status(500).send('Kelime silinemedi.');
            }
            res.status(200).send(`"${wordToDelete}" kelimesi başarıyla silindi.`);
        });
    });
});

app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});