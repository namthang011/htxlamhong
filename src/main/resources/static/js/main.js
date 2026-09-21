document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.main-nav a');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('open');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mainNav?.classList.remove('open');
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });
});