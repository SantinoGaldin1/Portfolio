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

// rueda del mouse: un paso por gesto. Solo en pantallas anchas:
// en mobile/ventana angosta el contenido apilado supera el viewport y
// debe scrollear nativo (sino se saltea contenido).
const fullPageActivo = () => window.innerWidth > 900;
window.addEventListener('wheel', (e) => {
    if (!fullPageActivo()) return;
    e.preventDefault();
    if (animating) return;
    go(e.deltaY > 0 ? 1 : -1);
}, { passive: false });

// menu hamburguesa (mobile): abre/cierra el desplegable
const hamburger = document.querySelector('.hamburger');
const navEl = document.querySelector('nav');
if (hamburger && navEl) {
    hamburger.addEventListener('click', () => navEl.classList.toggle('open'));
    navEl.querySelectorAll('ul a').forEach((a) =>
        a.addEventListener('click', () => navEl.classList.remove('open')));
}

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

// Formulario de contacto (solo frontend por ahora; sin envio real).
const form = document.getElementById('contact-form');
if (form) {
    const ms = document.getElementById('ms-servicios');
    const msToggle = ms.querySelector('.ms-toggle span');
    const msRequired = ms.querySelector('.ms-required');
    const otroChk = ms.querySelector('.ms-otro');
    const otroInput = form.querySelector('.otro-input');
    const checks = [...ms.querySelectorAll('input[name="servicio"]')];
    const popup = document.getElementById('popup-exito');

    // abrir/cerrar el desplegable
    ms.querySelector('.ms-toggle').addEventListener('click', (e) => {
        e.stopPropagation();
        ms.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
        if (!ms.contains(e.target)) ms.classList.remove('open');
    });

    // etiqueta: hasta 2 nombres; del tercero en adelante "+N" (una sola linea)
    const etiquetaServicios = (sel) => {
        if (!sel.length) return 'Elegí uno o varios servicios';
        if (sel.length <= 2) return sel.join(', ');
        return `${sel[0]}, ${sel[1]}  +${sel.length - 2}`;
    };

    // mantiene el input required en sync con la seleccion
    const sincronizarRequired = () => {
        const alguno = checks.some((x) => x.checked);
        msRequired.value = alguno ? 'ok' : '';
        msRequired.setCustomValidity(alguno ? '' : 'Elegí al menos un servicio.');
    };
    sincronizarRequired();

    const MSJ_OTRO = 'Especificá qué otro servicio necesitás';

    // muestra/oculta el campo "Otro" y lo hace obligatorio cuando corresponde
    const actualizarOtro = () => {
        const on = otroChk.checked;
        otroInput.hidden = !on;
        otroInput.required = on;
        otroInput.setCustomValidity(on && !otroInput.value.trim() ? MSJ_OTRO : '');
    };
    otroInput.addEventListener('input', () => {
        if (otroInput.required) otroInput.setCustomValidity(otroInput.value.trim() ? '' : MSJ_OTRO);
    });

    checks.forEach((c) => c.addEventListener('change', () => {
        const sel = checks.filter((x) => x.checked).map((x) => x.value);
        msToggle.textContent = etiquetaServicios(sel);
        actualizarOtro();
        sincronizarRequired();
    }));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!form.nombre.value.trim()) { form.nombre.reportValidity(); return; }
        if (!form.email.value.trim() || !form.email.checkValidity()) { form.email.reportValidity(); return; }
        if (!msRequired.checkValidity()) { msRequired.reportValidity(); return; }
        if (!otroInput.checkValidity()) { otroInput.reportValidity(); return; }

        // exito (frontend): mostrar popup y limpiar
        popup.hidden = false;
        form.reset();
        ms.classList.remove('open');
        msToggle.textContent = 'Elegí uno o varios servicios';
        actualizarOtro();
        sincronizarRequired();
    });

    const cerrar = () => { popup.hidden = true; };
    popup.querySelector('.popup-cerrar').addEventListener('click', cerrar);
    popup.addEventListener('click', (e) => { if (e.target === popup) cerrar(); });
}

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
