document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    let redirected = false;

    function goToMainScreen() {
        if (redirected) return;
        redirected = true;
        if (welcomeScreen) {
            welcomeScreen.style.opacity = '0';
            welcomeScreen.style.transition = 'opacity 0.3s ease-out';
        }
        setTimeout(() => {
            // location.replace kullanarak geri tuşu döngüsünü engelle
            window.location.replace('main-screen.html');
        }, 300);
    }

    // Tıklandığında veya herhangi bir tuşa basıldığında beklemeden geçiş yap
    document.addEventListener('click', goToMainScreen);
    document.addEventListener('keydown', goToMainScreen);

    // 1.5 saniye sonra otomatik geçiş
    setTimeout(goToMainScreen, 1500);
});
