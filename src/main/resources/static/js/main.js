document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mainNav');
    if (!toggle || !nav) return;
    function setOpen(open) {
        nav.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
        toggle.textContent = open ? '×' : '☰';
    }
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    nav.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); } });
    document.addEventListener('click', event => { if (!event.target.closest('.site-header')) setOpen(false); });
    matchMedia('(min-width:881px)').addEventListener('change', event => { if (event.matches) setOpen(false); });
});
