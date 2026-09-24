document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    let redirected = false;

    // Oturum süresince splash ekranının görüldüğünü kaydet
    try {
        sessionStorage.setItem('kelime_splash_shown', 'true');
    } catch (e) {}

    function goToMainScreen() {
        if (redirected) return;
        redirected = true;

        if (welcomeScreen) {
            welcomeScreen.classList.add('splash-fade-out');
        }

        setTimeout(() => {
            // location.replace kullanarak tarayıcı geçmişinde geri tuşu döngüsünü engelle
            window.location.replace('main-screen.html');
        }, 280);
    }

    // Dokunulduğunda, tıklandığında veya tuşa basıldığında beklemeden hemen geç
    document.addEventListener('click', goToMainScreen, { once: true });
    document.addEventListener('touchstart', goToMainScreen, { passive: true, once: true });
    document.addEventListener('keydown', goToMainScreen, { once: true });

    // 800ms sonra yumuşak otomatik geçiş
    setTimeout(goToMainScreen, 800);
});
