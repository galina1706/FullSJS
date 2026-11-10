// Позначка для CSS: JS увімкнено (потрібно для анімації появи блоків)
document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Бургер-меню =====
const burger = document.querySelector('[data-burger]');
const nav = document.getElementById('nav');

if (burger && nav) {
    const toggleMenu = (open) => {
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
        nav.classList.toggle('is-open', open);
        document.body.classList.toggle('no-scroll', open);
    };

    burger.addEventListener('click', () => {
        toggleMenu(burger.getAttribute('aria-expanded') !== 'true');
    });

    // Закриваємо меню після переходу за посиланням, по Esc та при переході на десктоп
    nav.addEventListener('click', (e) => {
        if (e.target.closest('a')) toggleMenu(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') toggleMenu(false);
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
        if (e.matches) toggleMenu(false);
    });
}

// ===== Тінь у шапки під час прокрутки =====
const header = document.querySelector('[data-header]');

if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

// ===== Таби =====
document.querySelectorAll('[data-tabs]').forEach((tabsEl) => {
    const tabs = [...tabsEl.querySelectorAll('[role="tab"]')];

    const select = (tab, focus = false) => {
        tabs.forEach((t) => {
            const active = t === tab;
            t.setAttribute('aria-selected', String(active));
            t.tabIndex = active ? 0 : -1;
            document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
        });
        if (focus) tab.focus();
    };

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => select(tab));

        // Перемикання стрілками, як у нативних табах
        tab.addEventListener('keydown', (e) => {
            const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
            if (!(e.key in keys)) return;
            e.preventDefault();
            select(tabs[(keys[e.key] + tabs.length) % tabs.length], true);
        });
    });

    // У розкладі одразу відкриваємо сьогоднішній день
    if (tabsEl.hasAttribute('data-tabs-today')) {
        const today = (new Date().getDay() + 6) % 7; // 0 = понеділок
        if (tabs[today]) select(tabs[today]);
    }
});

// ===== Слайдер =====
document.querySelectorAll('[data-slider]').forEach((slider) => {
    const track = slider.querySelector('[data-slider-track]');
    const prev = slider.querySelector('[data-slider-prev]');
    const next = slider.querySelector('[data-slider-next]');
    const dotsWrap = slider.querySelector('[data-slider-dots]');
    const slides = [...track.children];

    const step = () => slides[1].offsetLeft - slides[0].offsetLeft;
    const perView = () => Math.max(1, Math.round(track.clientWidth / step()));
    const pageCount = () => slides.length - perView() + 1;
    const current = () => Math.min(Math.round(track.scrollLeft / step()), pageCount() - 1);

    const goTo = (index) => {
        track.scrollTo({ left: index * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    const renderDots = () => {
        dotsWrap.innerHTML = '';
        for (let i = 0; i < pageCount(); i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'slider__dot';
            dot.setAttribute('aria-label', `Слайд ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            dotsWrap.append(dot);
        }
    };

    const update = () => {
        const index = current();
        [...dotsWrap.children].forEach((dot, i) => {
            dot.classList.toggle('is-active', i === index);
            dot.setAttribute('aria-current', i === index ? 'true' : 'false');
        });
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };

    prev.addEventListener('click', () => goTo(current() - 1));
    next.addEventListener('click', () => goTo(current() + 1));

    let ticking = false;
    track.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            update();
            ticking = false;
        });
    }, { passive: true });

    window.addEventListener('resize', () => {
        renderDots();
        update();
    });

    renderDots();
    update();
});

// ===== Фільтр розкладу за напрямом =====
const filterButtons = document.querySelectorAll('[data-filter]');

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const filter = button.dataset.filter;

        filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));

        document.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
            const lessons = panel.querySelectorAll('[data-direction]');
            let visible = 0;

            lessons.forEach((lesson) => {
                const show = filter === 'all' || lesson.dataset.direction === filter;
                lesson.hidden = !show;
                if (show) visible++;
            });

            const empty = panel.querySelector('[data-schedule-empty]');
            if (empty) empty.hidden = visible > 0;
        });
    });
});

// ===== Форма запису =====
const form = document.querySelector('[data-form]');

if (form) {
    const status = form.querySelector('[data-form-status]');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            form.querySelector(':invalid').focus();
            return;
        }

        const name = form.elements.name.value.trim();
        status.textContent = `Дякуємо, ${name}! Ми зателефонуємо вам найближчим часом.`;
        status.hidden = false;
        form.reset();
        form.classList.remove('was-validated');
    });
}

// ===== Поява блоків під час прокрутки =====
const revealItems = document.querySelectorAll('[data-reveal]');

if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.15 });

    revealItems.forEach((item) => observer.observe(item));
} else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
}

// ===== Поточний рік у футері =====
document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
});
