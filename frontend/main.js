// Landing full-page: una pantalla por gesto de scroll, con tween suave.
// DURATION = perilla de suavidad (mas alto = mas lento/suave).
const DURATION = 850;
const sections = [...document.querySelectorAll('.screen')];
let animating = false;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function scrollToY(targetY) {
    const startY = window.scrollY;
    const dist = targetY - startY;
    if (!dist) return;
    let start = null;
    animating = true;
    function step(ts) {
        if (start === null) start = ts;
        const p = Math.min((ts - start) / DURATION, 1);
        window.scrollTo(0, startY + dist * easeInOut(p));
        if (p < 1) requestAnimationFrame(step);
        else animating = false;
    }
    requestAnimationFrame(step);
}

// pantalla cuyo borde superior esta mas cerca del tope del viewport
function currentIndex() {
    let best = 0, min = Infinity;
    sections.forEach((s, i) => {
        const d = Math.abs(s.getBoundingClientRect().top);
        if (d < min) { min = d; best = i; }
    });
    return best;
}

function go(dir) {
    const i = currentIndex();
    const n = Math.min(Math.max(i + dir, 0), sections.length - 1);
    if (n === i) return;
    scrollToY(window.scrollY + sections[n].getBoundingClientRect().top);
}

// rueda del mouse: un paso por gesto
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (animating) return;
    go(e.deltaY > 0 ? 1 : -1);
}, { passive: false });

// flechas, logo y menu: mismo tween que el scroll
document.querySelectorAll('.nav-arrow, .logo, nav ul a').forEach((a) => {
    a.addEventListener('click', (e) => {
        e.preventDefault();
        const t = document.querySelector(a.getAttribute('href'));
        if (t) scrollToY(window.scrollY + t.getBoundingClientRect().top);
    });
});

// ponytail: solo rueda de mouse. Touch/movil usa scroll nativo (sin tween);
// agregar handler touchstart/touchmove si hace falta en celular.

// Carrusel hero: crossfade automatico cada 5s + dots clickeables.
const slides = [...document.querySelectorAll('.carousel .slide')];
if (slides.length) {
    const dotsWrap = document.querySelector('.carousel .dots');
    let cur = 0;
    const dots = slides.map((_, i) => {
        const d = document.createElement('button');
        d.className = 'dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', `Foto ${i + 1}`);
        d.addEventListener('click', () => show(i, true));
        dotsWrap.appendChild(d);
        return d;
    });
    let timer = setInterval(() => show(cur + 1), 5000);
    function show(i, manual) {
        slides[cur].classList.remove('active');
        dots[cur].classList.remove('active');
        cur = (i + slides.length) % slides.length;
        slides[cur].classList.add('active');
        dots[cur].classList.add('active');
        if (manual) { clearInterval(timer); timer = setInterval(() => show(cur + 1), 5000); }
    }
}
