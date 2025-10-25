document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    
    // 1 saniye (1000ms) yerine 2 saniye (2000ms) sonra animasyonu başlat
    setTimeout(() => { 
        // Hoş Geldiniz ekranını yavaşça soluklaştır
        welcomeScreen.style.opacity = '0';
        welcomeScreen.style.transition = 'opacity 0.5s ease-out';
        
        // Animasyon (0.5 saniye) bittikten sonra yönlendir
        setTimeout(() => { 
            window.location.href = 'main-screen.html';
        }, 500); // Animasyon süresine göre 500ms sonra yönlendir (0.5 saniye)
        
    }, 2000); // BURASI DEĞİŞTİ: 1000ms'den 2000ms'ye
});
