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

// Carrusel 3D de servicios: gira paso a paso con las flechas (queda centrado)
const ring = document.querySelector('.carousel-3d');
if (ring) {
    const cards = [...ring.querySelectorAll('.s-card')];
    const n = cards.length;
    const step = 360 / n;
    let angle = 0;

    // en mobile achico el ring para que no ocupe tanta pantalla
    const escala = () => (window.innerWidth <= 560 ? 0.6 : window.innerWidth <= 900 ? 0.72 : 1);
    const render = () => {
        ring.style.transform = `perspective(1100px) rotateY(${angle}deg) scale(${escala()})`;
        const idx = ((Math.round(-angle / step) % n) + n) % n;
        cards.forEach((c, i) => c.classList.toggle('active', i === idx));
    };
    render();
    window.addEventListener('resize', render);

    const prev = document.querySelector('.serv-prev');
    const next = document.querySelector('.serv-next');
    if (prev) prev.addEventListener('click', () => { angle += step; render(); });
    if (next) next.addEventListener('click', () => { angle -= step; render(); });

    // mobile: deslizar el dedo pasa una tarjeta (queda centrada)
    const servicios = document.querySelector('.servicios');
    let sx = null, sy = null;
    servicios.addEventListener('touchstart', (e) => {
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
    }, { passive: true });
    servicios.addEventListener('touchend', (e) => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        // solo si el gesto es mayormente horizontal (no molesta el scroll vertical)
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
            angle += dx > 0 ? step : -step;
            render();
        }
        sx = sy = null;
    }, { passive: true });
}

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

// Lineas tipo circuito: un segmento (viborita) avanza por el trazo,
// mas rapido al scrollear y con un drift constante.
const snakes = [...document.querySelectorAll('.circuit .snake')].map((el) => {
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len * 0.14} ${len}`;
    return { el, len };
});
if (snakes.length) {
    let t = 0;
    const animarSnakes = () => {
        t += 1;
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const p = h > 0 ? window.scrollY / h : 0;
        snakes.forEach(({ el, len }, i) => {
            const dir = i % 2 ? -1 : 1;
            el.style.strokeDashoffset = -dir * (p * len * 1.6 + t * 1.4);
        });
        requestAnimationFrame(animarSnakes);
    };
    animarSnakes();
}

// Formas 3d: se desplazan un poco con el scroll (parallax, distinta velocidad c/u)
const shapeEls = [...document.querySelectorAll('.shape')];
if (shapeEls.length) {
    // oscilacion: cada forma vaga un poco en su direccion y vuelve al origen
    // (seno del scroll -> queda dentro de un rectangulo chico, no deriva al centro)
    // una sola frecuencia por forma (x, y y giro sincronizados) => un unico
    // movimiento diagonal de ida y vuelta por scroll. Direccion via signo de ax/ay.
    const cfg = [
        { ax: 62, ay: 40, r: 5, f: 0.0018 },   // baja-derecha
        { ax: -56, ay: 52, r: -6, f: 0.0021 }, // baja-izquierda
        { ax: 50, ay: -48, r: 6, f: 0.0016 },  // sube-derecha
        { ax: -58, ay: -42, r: -5, f: 0.0023 } // sube-izquierda
    ];
    const moverFormas = () => {
        const y = window.scrollY;
        shapeEls.forEach((s, i) => {
            const c = cfg[i] || cfg[0];
            const o = Math.sin(y * c.f);
            s.style.transform = `translate3d(${c.ax * o}px, ${c.ay * o}px, 0) rotate(${c.r * o}deg)`;
        });
    };
    window.addEventListener('scroll', moverFormas, { passive: true });
    moverFormas();
}

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
