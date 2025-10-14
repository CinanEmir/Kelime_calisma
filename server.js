const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const wordsFilePath = path.join(__dirname, 'src/main/webapp/words.json');

app.use(bodyParser.json());
app.use(express.static('src/main/webapp')); // Bu satır, tüm statik dosyalarını okumaya devam edecek

// Kelime ekleme isteğini işleyen endpoint
app.post('/add-word', (req, res) => {
    const newWord = req.body;
    
    fs.readFile(wordsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Kelime listesi okunamadı:', err);
            return res.status(500).send('Sunucu hatası');
        }

        let words = JSON.parse(data);
        words.push(newWord);

        fs.writeFile(wordsFilePath, JSON.stringify(words, null, 2), (err) => {
            if (err) {
                console.error('Kelime listesi yazılamadı:', err);
                return res.status(500).send('Sunucu hatası');
            }
            res.status(200).send('Kelime başarıyla eklendi!');
        });
    });
});

app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});