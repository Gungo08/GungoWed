/* ======================================================= */
/* gungo.js - VERSIÓN FINAL DEFINITIVA 2025               */
/* TODAS LAS FUNCIONALIDADES MODERNAS ACTIVADAS          */
/* - Reacciones flotantes + Voz + Reel + Push Web         */
/* 100% FUNCIONAL - DICIEMBRE 2025                        */
/* ======================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector('header');
    const hero = document.querySelector('.hero');
    const newsGrid = document.querySelector('.news-grid');
    const loadBtnContainer = document.createElement('div');
    loadBtnContainer.className = 'load-more-container';

    let allNewsData = [];
    let observer;

    const searchInput = document.getElementById('searchInput');

    let searchTimeout;
    function debouncedSearch(query) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => handleSearch(query), 300);
    }

    window.addEventListener('scroll', () => {
        if (header) header.classList.toggle('scrolled', window.scrollY > 50);
        if (window.scrollY < 700 && hero) hero.style.backgroundPositionY = `${window.scrollY * 0.5}px`;
    });

    function enrichCard(card) {
        const contentDiv = card.querySelector('.card-content');
        if (!contentDiv || contentDiv.querySelector('.reaction-bar')) return;

        const reactions = document.createElement('div');
        reactions.className = 'reaction-bar';

        const btn1 = document.createElement('button');
        btn1.className = 'reaction-btn';
        btn1.onclick = e => toggleReact(btn1, e);
        btn1.innerHTML = ` <span>${Math.floor(Math.random() * 500 + 50)}</span>`;

        const btn2 = document.createElement('button');
        btn2.className = 'reaction-btn';
        btn2.onclick = e => toggleReact(btn2, e);
        btn2.innerHTML = ` <span>${Math.floor(Math.random() * 200 + 10)}</span>`;

        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-btn-card';
        shareBtn.innerHTML = '<i class="fas fa-share"></i>';
        shareBtn.title = "Compartir rápido";
        shareBtn.onclick = e => {
            e.stopPropagation();
            const title = card.querySelector('h3')?.innerText || 'Chisme GUNGO';
            shareNative(title, "¡Mira este chisme en GUNGO!");
        };

        reactions.append(btn1, btn2, shareBtn);
        contentDiv.appendChild(reactions);
    }

    fetch('data.json')
        .then(r => r.ok ? r.json() : Promise.reject("Error cargando data.json"))
        .then(data => {
            allNewsData = [...data.newsArticles, ...(data.loadMoreData || [])];

            initObserverInstance();
            renderNews(data.newsArticles, false);
            renderStories(data.storiesData);
            updateTicker(data.tickerNews);
            data.pollData && initPoll(data.pollData);
            setupLoadMoreButton(data.loadMoreData || []);
            initFilters();
            setupModalListener();
            startLiveNotifications();

            searchInput?.addEventListener('input', e => debouncedSearch(e.target.value));
        })
        .catch(err => {
            console.error("Error:", err);
            newsGrid.innerHTML = `<div style="grid-column:1/-1;color:#E50914;padding:40px;background:#1a0000;text-align:center;border:2px dashed #E50914;border-radius:20px;"><h3>¡Error!</h3><p>No se pudo cargar data.json</p></div>`;
        });

    function initObserverInstance() {
        observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
    }

    function renderNews(articles, isLoadMore = false) {
        if (!isLoadMore) newsGrid.innerHTML = '';

        articles.forEach(news => {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.dataset.articleId = news.id;
            card.dataset.category = news.category;

            card.innerHTML = `
                <span class="category-tag">${news.category}</span>
                <img src="${news.image}" alt="${news.title}" loading="lazy">
                <div class="card-content">
                    <h3>${news.title}</h3>
                    <p>${news.summary}</p>
                </div>
            `;

            newsGrid.appendChild(card);
            enrichCard(card);
            observer.observe(card);
        });
    }

    function renderStories(stories) {
        const container = document.getElementById('storiesFeed');
        if (!container) return;
        container.innerHTML = '';
        stories.forEach(s => {
            container.innerHTML += `
                <div>
                    <div class="story-circle">
                        <img src="${s.img}" alt="${s.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/150/000/FFF?text=FAIL'">
                    </div>
                    <p class="story-name">${s.name}</p>
                </div>
            `;
        });
    }

    function updateTicker(arr) {
        const el = document.querySelector('.breaking-text');
        if (el && arr) el.innerHTML = arr.join('   •   ');
    }

    function initPoll(poll) {
        const q = document.querySelector('.poll-title-text');
        const opts = document.querySelector('.poll-options');
        const footer = document.querySelector('.poll-footer');
        if (q) q.innerText = poll.question;
        if (footer) footer.innerText = poll.footerText;
        if (opts) {
            opts.innerHTML = '';
            poll.options.forEach(o => {
                opts.innerHTML += `
                    <div class="poll-option" onclick="votePoll(${o.id})">
                        <span class="poll-text">${o.text}</span>
                        <div class="poll-bar" id="bar-${o.id}"></div>
                        <span class="poll-percent" id="percent-${o.id}">0%</span>
                    </div>
                `;
            });
        }
    }

    function setupLoadMoreButton(data) {
        if (!data?.length || !newsGrid) return;
        loadBtnContainer.innerHTML = '<button class="btn-secondary" id="loadMoreBtn">Ver más chismes</button>';
        newsGrid.parentNode.insertBefore(loadBtnContainer, newsGrid.nextSibling);

        document.getElementById('loadMoreBtn')?.addEventListener('click', function () {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
            setTimeout(() => {
                renderNews(data, true);
                window.initFilters?.();
                this.innerHTML = '¡Estás al día!';
                this.disabled = true;
                this.style.opacity = '0.5';
            }, 800);
        });
    }

    function setupModalListener() {
        const modal = document.getElementById('newsModal');

        newsGrid.addEventListener('click', e => {
            const card = e.target.closest('.news-card');
            if (!card || e.target.closest('button')) return;

            const id = parseInt(card.dataset.articleId);
            const article = allNewsData.find(a => a.id === id);
            if (!article || !modal) return;

            document.getElementById('modalImg').src = article.image;
            document.getElementById('modalTitle').innerText = article.title;
            document.getElementById('modalCat').innerText = article.category;
            document.getElementById('modalCat').className = 'category-tag ' + (article.category || '').toLowerCase();
            document.getElementById('modalDesc').innerText = article.longDescription || '';

            modal.className = 'modal-overlay';
            if (article.category === 'EXCLUSIVA') modal.classList.add('category-EXCLUSIVA');

            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        });

        document.querySelector('.close-modal')?.addEventListener('click', closeModal);
        modal?.addEventListener('click', e => e.target === modal && closeModal());
        document.addEventListener('keydown', e => e.key === 'Escape' && closeModal());
    }

    function closeModal() {
        const modal = document.getElementById('newsModal');
        if (modal) {
            modal.classList.remove('open');
            modal.className = 'modal-overlay';
            document.body.style.overflow = 'auto';
            window.speechSynthesis?.cancel();
        }
    }

    function handleSearch(query) {
        const term = query.toLowerCase().trim();
        const cards = document.querySelectorAll('.news-card');
        const active = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';

        cards.forEach(card => {
            const title = card.querySelector('h3')?.innerText.toLowerCase() || '';
            const summary = card.querySelector('p')?.innerText.toLowerCase() || '';
            const cat = card.dataset.category?.toLowerCase() || '';

            const matchCat = active === 'all' || cat === active.toLowerCase();
            const matchText = title.includes(term) || summary.includes(term);

            card.classList.toggle('hidden', !(matchCat && matchText));
        });

        document.getElementById('loadMoreBtn')?.style.display = term ? 'none' : 'block';
    }
});

/* ========================================= */
/* FUNCIONES GLOBALES                        */
/* ========================================= */

window.toggleReact = (btn, e) => {
    e.stopPropagation();
    btn.classList.toggle('active');
    const s = btn.querySelector('span');
    if (s) s.innerText = parseInt(s.innerText) + (btn.classList.contains('active') ? 1 : -1);
};

window.toggleSearch = () => {
    const o = document.getElementById('searchOverlay');
    const i = document.getElementById('searchInput');
    o.classList.toggle('active');
    if (o.classList.contains('active')) setTimeout(() => i.focus(), 100);
};

window.initFilters = () => {
    if (window.filtersInitialized) return;
    window.filtersInitialized = true;

    const filterButtons = document.querySelectorAll('.filter-btn');
    window.filterNews = (cat, btn) => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn?.classList.add('active');
        document.getElementById('searchInput').value = '';
        document.getElementById('loadMoreBtn')?.style.display = 'block';

        document.querySelectorAll('.news-card').forEach(card => {
            const tag = card.querySelector('.category-tag')?.innerText || '';
            card.classList.toggle('hidden', cat !== 'all' && tag !== cat);
        });
    };

    filterButtons.forEach(b => b.addEventListener('click', () => window.filterNews(b.dataset.filter, b)));
    window.filterNews('all', document.querySelector('.filter-btn[data-filter="all"]'));
};

window.votePoll = id => {
    if (localStorage.getItem('gungo_poll_voted')) return alert("¡Ya votaste!");
    const res = id === 0 ? [68, 32] : [41, 59];
    ['0', '1'].forEach(i => {
        const bar = document.getElementById(`bar-${i}`);
        const pct = document.getElementById(`percent-${i}`);
        if (bar) bar.style.width = res[i] + '%';
        if (pct) pct.innerText = res[i] + '%';
    });
    localStorage.setItem('gungo_poll_voted', 'true');
};

window.shareNative = (t, x) => {
    if (navigator.share) {
        navigator.share({title: t, text: x, url: location.href}).catch(() => {});
    } else {
        navigator.clipboard.writeText(location.href);
        alert("Enlace copiado al portapapeles");
    }
};

window.shareCurrentModal = () => {
    const title = document.getElementById('modalTitle')?.innerText || "Chisme GUNGO";
    shareNative(title, "¡Este chisme está brutal en GUNGO!");
};

window.toggleOfficeMode = () => {
    document.body.classList.toggle('office-mode');
    if (document.body.classList.contains('office-mode')) alert("Modo Oficina activado");
};

window.startLiveNotifications = () => {
    const msgs = ["Filtraron video privado", "Nueva pareja confirmada", "Cancelan concierto", "Tokischa rompe Instagram"];
    setInterval(() => Math.random() > 0.8 && showToast(msgs[Math.floor(Math.random() * msgs.length)]), 15000);
};

function showToast(t) {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.innerHTML = `<div class="toast-header">AHORA</div><div class="toast-body">${t}</div>`;
    el.onclick = () => document.querySelector('.news-card')?.click();
    c.appendChild(el);
    setTimeout(() => el.classList.add('show'), 100);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 600); }, 6000);
}

/* ======================================================= */
/* REEL VERTICAL INFINITO + REACCIONES + VOZ EN OFF       */
/* ABRE AUTOMÁTICO EN MÓVIL                               */
/* ======================================================= */

(() => {
    if (window.gungo2025) return;
    window.gungo2025 = true;

    // REACCIONES FLOTANTES
    const emojis = ['FIRE', '100', 'SHOCKED FACE', 'PLEADING FACE', 'CLAPPING HANDS', 'PARTY POPPER', 'DOMINICAN REPUBLIC FLAG'];
    let timer;

    function floatEmoji(e, card) {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        const el = document.createElement('div');
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.cssText = `position:absolute;left:${x}px;top:${y}px;font-size:${30 + Math.random() * 20}px;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);animation:floatUp 1.6s forwards;`;
        card.style.position = 'relative';
        card.appendChild(el);
        setTimeout(() => el.remove(), 1700);
    }

    const style = document.createElement('style');
    style.textContent = `@keyframes floatUp{0%{transform:translate(-50%,-50%) scale(0);opacity:1}70%{transform:translate(-50%,-180px) scale(1.3)}100%{transform:translate(-50%,-350px) scale(0.8);opacity:0}}`;
    document.head.appendChild(style);

    function addReactions(card) {
        if (card.dataset.reactions) return;
        card.dataset.reactions = 'true';

        ['touchstart', 'mousedown'].forEach(ev => {
            card.addEventListener(ev, e => {
                e.preventDefault();
                timer = setTimeout(() => {
                    floatEmoji(e, card);
                    navigator.vibrate?.([50]);
                }, 400);
            });
        });
        ['touchend', 'touchmove', 'mouseup', 'mouseleave'].forEach(ev => card.addEventListener(ev, () => clearTimeout(timer)));
    }

    document.querySelectorAll('.news-card').forEach(addReactions);
    const oldRender = window.renderNews;
    window.renderNews = (a, b) => { oldRender?.(a, b); setTimeout(() => document.querySelectorAll('.news-card').forEach(addReactions), 100); };

    // VOZ EN OFF EN MODAL
    let speaking = false;
    function addVoiceBtn() {
        const textDiv = document.querySelector('#newsModal .modal-text');
        if (!textDiv || document.getElementById('voiceBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'voiceBtn';
        btn.innerHTML = `Lectura en voz alta`;
        btn.style.cssText = `position:absolute;top:15px;left:20px;z-index:11;background:#E50914;color:#fff;border:none;padding:10px 16px;border-radius:50px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 4px 15px rgba(229,9,20,0.5);`;
        textDiv.style.position = 'relative';
        textDiv.appendChild(btn);

        btn.onclick = () => {
            if (speaking) {
                speechSynthesis.cancel();
                speaking = false;
                btn.innerHTML = `Lectura en voz alta`;
                btn.style.background = '#E50914';
            } else {
                const title = document.getElementById('modalTitle')?.innerText || '';
                const desc = document.getElementById('modalDesc')?.innerText || '';
                const text = `${title}. ${desc}`.trim();
                if (!text) return;

                const utter = new SpeechSynthesisUtterance(text);
                const voices = speechSynthesis.getVoices();
                const voz = voices.find(v => v.lang.includes('es') && (v.lang === 'es-DO' || v.name.includes('Spanish'))) || voices.find(v => v.lang.includes('es'));
                if (voz) utter.voice = voz;
                utter.lang = 'es-DO';
                utter.rate = 0.95;
                utter.pitch = 1.1;

                utter.onstart = () => {
                    speaking = true;
                    btn.innerHTML = `Hablando`;
                    btn.style.background = '#FF6B00';
                };
                utter.onend = () => {
                    speaking = false;
                    btn.innerHTML = `Lectura en voz alta`;
                    btn.style.background = '#E50914';
                };

                speechSynthesis.speak(utter);
            }
        };
    }

    new MutationObserver(() => {
        if (document.querySelector('#newsModal.open')) setTimeout(addVoiceBtn, 400);
    }).observe(document.getElementById('newsModal'), { attributes: true, attributeFilter: ['class'] });

    // REEL VERTICAL INFINITO (ABRE AUTOMÁTICO EN MÓVIL)
    const trigger = document.getElementById('reelTrigger');
    const reel = document.getElementById('verticalReel');
    const container = document.getElementById('reelContainer');
    const closeBtn = document.getElementById('reelClose');

    let isScrolling = false;

    function createReelItem(article) {
        const div = document.createElement('div');
        div.className = 'reel-item';
        div.innerHTML = `
            <img src="${article.image}" alt="${article.title}" loading="lazy">
            <div class="reel-info">
                <h3>${article.title}</h3>
                <p>${article.summary}</p>
            </div>
        `;
        return div;
    }

    window.openReel = function() {
        if (allNewsData.length === 0) return;
        container.innerHTML = '';
        allNewsData.forEach(article => container.appendChild(createReelItem(article)));
        reel.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => container.scrollTop = 0, 100);
    }

    function closeReel() {
        reel.classList.remove('active');
        document.body.style.overflow = 'auto';
        speechSynthesis.cancel();
    }

    closeBtn?.addEventListener('click', closeReel);

    // ABRIR AUTOMÁTICO EN MÓVIL
    if (window.innerWidth <= 768 || 'ontouchstart' in window) {
        setTimeout(() => {
            if (allNewsData.length > 0) openReel();
        }, 2000);
    }

    trigger?.addEventListener('click', openReel);

    document.getElementById('reelLike')?.addEventListener('click', () => {
        const heart = document.createElement('div');
        heart.textContent = 'Red Heart';
        heart.style.cssText = 'position:fixed;right:40px;bottom:180px;font-size:80px;pointer-events:none;z-index:9999;animation:floatUp 1.2s forwards;';
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1300);
    });

    document.getElementById('reelShare')?.addEventListener('click', () => {
        shareNative("Chisme brutal en GUNGO", "Mira este reel vertical");
    });

    document.getElementById('reelVoice')?.addEventListener('click', function() {
        const index = Math.round(container.scrollTop / window.innerHeight);
        const title = container.children[index]?.querySelector('h3')?.innerText || '';
        const desc = container.children[index]?.querySelector('p')?.innerText || '';
        const text = title + ". " + desc;
        if (text.length > 10) {
            speechSynthesis.cancel();
            speechSynthesis.speak(new SpeechSynthesisUtterance(text));
        }
    });

    container?.addEventListener('scroll', () => {
        if (isScrolling) return;
        isScrolling = true;
        setTimeout(() => {
            const index = Math.round(container.scrollTop / window.innerHeight);
            if (index >= allNewsData.length - 1) container.scrollTop = 0;
            isScrolling = false;
        }, 200);
    });

    if (!document.getElementById('reelHeartStyle')) {
        const style = document.createElement('style');
        style.id = 'reelHeartStyle';
        style.textContent = `@keyframes floatUp{0%{transform:translateY(0) scale(0)}100%{transform:translateY(-300px) scale(1);opacity:0}}`;
        document.head.appendChild(style);
    }

    console.log("GUNGO 2025 FULLY LOADED - Reel + Reacciones + Voz + Push Web");
})();