document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    setTimeout(() => {
        // Hoş Geldiniz ekranını yavaşça soluklaştır
        welcomeScreen.style.opacity = '0';
        welcomeScreen.style.transition = 'opacity 0.5s ease-out';
        
        // Animasyon bittikten sonra yönlendir
        setTimeout(() => {
            window.location.href = 'main-screen.html';
        }, 500); // 500ms sonra yönlendir
        
    }, 1000); // 1 saniye sonra animasyonu başlat
});