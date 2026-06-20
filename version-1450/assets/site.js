const mobileButton = document.querySelector('[data-menu-toggle]');
const mobileNav = document.querySelector('[data-mobile-nav]');

if (mobileButton && mobileNav) {
    mobileButton.addEventListener('click', () => {
        mobileNav.classList.toggle('is-open');
    });
}

for (const form of document.querySelectorAll('[data-search-redirect]')) {
    form.addEventListener('submit', event => {
        const input = form.querySelector('input[name="q"]');
        if (!input) {
            return;
        }
        const value = input.value.trim();
        if (!value) {
            event.preventDefault();
            window.location.href = './search.html';
        }
    });
}

function setupHero() {
    const hero = document.querySelector('[data-hero-carousel]');
    if (!hero) {
        return;
    }

    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    let current = 0;
    let timer = null;

    const show = index => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === current));
        dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === current));
    };

    const restart = () => {
        if (timer) {
            window.clearInterval(timer);
        }
        timer = window.setInterval(() => show(current + 1), 5200);
    };

    if (prev) {
        prev.addEventListener('click', () => {
            show(current - 1);
            restart();
        });
    }

    if (next) {
        next.addEventListener('click', () => {
            show(current + 1);
            restart();
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            show(index);
            restart();
        });
    });

    if (slides.length > 1) {
        restart();
    }
}

function setupLocalFilters() {
    const panel = document.querySelector('[data-filter-panel]');
    if (!panel) {
        return;
    }

    const cards = Array.from(document.querySelectorAll('[data-movie-card]'));
    const input = panel.querySelector('[data-filter-input]');
    const yearSelect = panel.querySelector('[data-filter-year]');
    const typeSelect = panel.querySelector('[data-filter-type]');
    const reset = panel.querySelector('[data-filter-reset]');
    const count = panel.querySelector('[data-filter-count]');

    const years = Array.from(new Set(cards.map(card => card.dataset.year).filter(Boolean))).sort((a, b) => b.localeCompare(a));
    const types = Array.from(new Set(cards.map(card => card.dataset.type).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN'));

    for (const year of years) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    for (const type of types) {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    }

    const apply = () => {
        const keyword = (input.value || '').trim().toLowerCase();
        const year = yearSelect.value;
        const type = typeSelect.value;
        let visible = 0;

        for (const card of cards) {
            const text = [card.dataset.title, card.dataset.genre, card.dataset.region, card.dataset.type, card.dataset.tags].join(' ').toLowerCase();
            const okKeyword = !keyword || text.includes(keyword);
            const okYear = !year || card.dataset.year === year;
            const okType = !type || card.dataset.type === type;
            const ok = okKeyword && okYear && okType;
            card.style.display = ok ? '' : 'none';
            if (ok) {
                visible += 1;
            }
        }

        if (count) {
            count.textContent = `当前显示 ${visible} 部，共 ${cards.length} 部`;
        }
    };

    input.addEventListener('input', apply);
    yearSelect.addEventListener('change', apply);
    typeSelect.addEventListener('change', apply);
    reset.addEventListener('click', () => {
        input.value = '';
        yearSelect.value = '';
        typeSelect.value = '';
        apply();
    });

    apply();
}

async function bindPlayer(container) {
    const video = container.querySelector('video');
    const button = container.querySelector('[data-play-button]');
    const stream = container.dataset.stream;
    let loaded = false;

    if (!video || !button || !stream) {
        return;
    }

    const load = async () => {
        if (loaded) {
            return;
        }
        loaded = true;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = stream;
        } else {
            try {
                const module = await import('./hls-vendor-dru42stk.js');
                const Hls = module.H;
                if (Hls && Hls.isSupported()) {
                    const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
                    hls.loadSource(stream);
                    hls.attachMedia(video);
                } else {
                    video.src = stream;
                }
            } catch (error) {
                video.src = stream;
            }
        }
    };

    const play = async () => {
        await load();
        button.classList.add('is-hidden');
        video.controls = true;
        try {
            await video.play();
        } catch (error) {
            video.controls = true;
        }
    };

    button.addEventListener('click', play);
    video.addEventListener('click', () => {
        if (video.paused) {
            play();
        }
    });
    video.addEventListener('play', () => button.classList.add('is-hidden'));
}

function setupPlayers() {
    const players = document.querySelectorAll('[data-player]');
    players.forEach(player => bindPlayer(player));
}

function setupSearchPage() {
    const root = document.querySelector('[data-search-page]');
    if (!root || !window.MOVIE_SEARCH_DATA) {
        return;
    }

    const form = root.querySelector('[data-search-form]');
    const input = root.querySelector('[data-search-input]');
    const type = root.querySelector('[data-search-type]');
    const year = root.querySelector('[data-search-year]');
    const region = root.querySelector('[data-search-region]');
    const results = root.querySelector('[data-search-results]');
    const count = root.querySelector('[data-search-count]');
    const empty = root.querySelector('[data-search-empty]');
    const params = new URLSearchParams(window.location.search);

    const all = window.MOVIE_SEARCH_DATA;

    const fillSelect = (select, values) => {
        for (const value of values) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        }
    };

    fillSelect(type, Array.from(new Set(all.map(movie => movie.type).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN')));
    fillSelect(year, Array.from(new Set(all.map(movie => movie.year).filter(Boolean))).sort((a, b) => b.localeCompare(a)));
    fillSelect(region, Array.from(new Set(all.map(movie => movie.region).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN')));

    input.value = params.get('q') || '';

    const renderCard = movie => `
            <article class="movie-card" data-movie-card>
                <a class="card-cover" href="${movie.url}" aria-label="观看 ${escapeHTML(movie.title)}">
                    <img src="${movie.cover}" alt="${escapeHTML(movie.title)}" loading="lazy">
                    <span class="play-dot">▶</span>
                </a>
                <div class="card-body">
                    <div class="card-meta">
                        <span>${escapeHTML(movie.year)}</span>
                        <span>${escapeHTML(movie.region)}</span>
                        <span>${escapeHTML(movie.type)}</span>
                    </div>
                    <h3><a href="${movie.url}">${escapeHTML(movie.title)}</a></h3>
                    <p>${escapeHTML(movie.oneLine)}</p>
                    <div class="tag-row">${movie.tags.slice(0, 3).map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}</div>
                    <div class="card-stats">
                        <span>评分 ${movie.score}</span>
                        <span>${movie.views.toLocaleString()} 次观看</span>
                    </div>
                </div>
            </article>`;

    const apply = () => {
        const keyword = input.value.trim().toLowerCase();
        const selectedType = type.value;
        const selectedYear = year.value;
        const selectedRegion = region.value;

        const matched = all.filter(movie => {
            const text = [movie.title, movie.genre, movie.region, movie.type, movie.oneLine, movie.tags.join(' ')].join(' ').toLowerCase();
            return (!keyword || text.includes(keyword))
                && (!selectedType || movie.type === selectedType)
                && (!selectedYear || movie.year === selectedYear)
                && (!selectedRegion || movie.region === selectedRegion);
        });

        results.innerHTML = matched.slice(0, 240).map(renderCard).join('');
        count.textContent = `找到 ${matched.length} 部影片，当前展示 ${Math.min(matched.length, 240)} 部`;
        empty.classList.toggle('is-visible', matched.length === 0);
    };

    form.addEventListener('submit', event => {
        event.preventDefault();
        apply();
    });
    input.addEventListener('input', apply);
    type.addEventListener('change', apply);
    year.addEventListener('change', apply);
    region.addEventListener('change', apply);

    apply();
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

setupHero();
setupLocalFilters();
setupPlayers();
setupSearchPage();
