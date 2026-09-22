document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    let redirected = false;

    function goToMainScreen() {
        if (redirected) return;
        redirected = true;
        if (welcomeScreen) {
            welcomeScreen.style.opacity = '0';
            welcomeScreen.style.transform = 'scale(0.96)';
            welcomeScreen.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        setTimeout(() => {
            // location.replace kullanarak geri tuşu döngüsünü engelle
            window.location.replace('main-screen.html');
        }, 380);
    }

    // Tıklandığında veya herhangi bir tuşa basıldığında beklemeden geçiş yap
    document.addEventListener('click', goToMainScreen);
    document.addEventListener('keydown', goToMainScreen);

    // 1 saniye sonra akıcı otomatik geçiş
    setTimeout(goToMainScreen, 1000);
});
