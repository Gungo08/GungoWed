 /* ======================================================= */
/* Archivo: gungo.js (VERSIÓN CORREGIDA) */
/* ======================================================= */
document.addEventListener("DOMContentLoaded", () => {
    /* ========================================= */
    /* === INICIALIZACIÓN DE ELEMENTOS === */
    /* ========================================= */
    
    // Referencias a elementos del DOM
    const header = document.querySelector('header');
    const hero = document.querySelector('.hero');
    const newsGrid = document.querySelector('.news-grid');
    const loadBtnContainer = document.createElement('div');
    loadBtnContainer.className = 'load-more-container';
    
    let allNewsData = []; 
    let observer; 
    
    // Elemento de búsqueda
    const searchInput = document.getElementById('searchInput');

    // Debounce para búsqueda
    let searchTimeout;
    function debouncedSearch(query) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            handleSearch(query);
        }, 300); 
    }

    // Efecto Scroll Header y Parallax
    window.addEventListener('scroll', () => {
        if (header) header.classList.toggle('scrolled', window.scrollY > 50);
        if(window.scrollY < 700 && hero) {
            hero.style.backgroundPositionY = `${window.scrollY * 0.5}px`;
        }
    });

    // Función para enriquecer tarjetas
    function enrichCard(card) {
        const contentDiv = card.querySelector('.card-content');
        if(!contentDiv) return; 

        if(!contentDiv.querySelector('.reaction-bar')) {
            const reactions = document.createElement('div');
            reactions.className = 'reaction-bar';
            
            const btn1 = document.createElement('button');
            btn1.className = 'reaction-btn';
            btn1.onclick = (e) => toggleReact(btn1, e);
            btn1.innerHTML = `🔥 <span>${Math.floor(Math.random()*500 + 50)}</span>`;

            const btn2 = document.createElement('button');
            btn2.className = 'reaction-btn';
            btn2.onclick = (e) => toggleReact(btn2, e);
            btn2.innerHTML = `😱 <span>${Math.floor(Math.random()*200 + 10)}</span>`;
            
            const shareBtn = document.createElement('button');
            shareBtn.className = 'share-btn-card';
            shareBtn.innerHTML = '<i class="fas fa-share"></i>';
            shareBtn.title = "Compartir rápido";
            shareBtn.onclick = (e) => {
                e.stopPropagation();
                const title = card.querySelector('h3') ? card.querySelector('h3').innerText : 'Chisme GUNGO';
                shareNative(title, "¡Mira este chisme en GUNGO!");
            };

            reactions.appendChild(btn1);
            reactions.appendChild(btn2);
            reactions.appendChild(shareBtn);
            contentDiv.appendChild(reactions);
        }
    }
    
    // *****************************************************
    // *** CARGA DE DATOS (FETCH) ***
    // *****************************************************

    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar data.json: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            allNewsData = data.newsArticles.concat(data.loadMoreData || []); 
            
            initObserverInstance();
            renderNews(data.newsArticles, false);
            renderStories(data.storiesData);
            updateTicker(data.tickerNews);
            
            if (data.pollData) initPoll(data.pollData); 
            setupLoadMoreButton(data.loadMoreData || []);
            
            initFilters();
            setupModalListener();
            startLiveNotifications();
            
            if (searchInput) {
                 searchInput.addEventListener('input', (e) => {
                    debouncedSearch(e.target.value);
                 });
            }
        })
        .catch(error => {
            console.error("Error crítico de carga:", error);
            if (newsGrid) {
                newsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; color: #E50914; padding: 20px; border: 1px dashed #E50914; background: #1a0000; text-align: center; margin-top: 50px;">
                        <h3>¡Error de Carga!</h3>
                        <p style="margin-top: 10px;">No se pudo leer <strong>data.json</strong>.</p>
                    </div>
                `;
            }
        });

    /** * FUNCIONES DE RENDERIZADO */
    
    function initObserverInstance() {
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
    }

    function renderNews(articles, isLoadMore = false) {
        if (!isLoadMore && newsGrid) newsGrid.innerHTML = ''; 
        
        articles.forEach((news) => {
            const article = document.createElement('div');
            article.classList.add('news-card'); 
            article.setAttribute('data-article-id', news.id); 
            article.setAttribute('data-category', news.category); 
            
            article.innerHTML = `
                <span class="category-tag">${news.category}</span>
                <img src="${news.image}" alt="${news.title}" loading="lazy">
                <div class="card-content">
                    <h3>${news.title}</h3>
                    <p>${news.summary}</p>
                </div>
            `;
            
            if(newsGrid) newsGrid.appendChild(article);
            enrichCard(article);
            
            if (observer) observer.observe(article);
        });
    }
    
    function renderStories(stories) {
        const storiesFeed = document.getElementById('storiesFeed');
        if(!storiesFeed) return; 

        storiesFeed.innerHTML = ''; 
        stories.forEach(story => {
            const div = document.createElement('div');
            div.innerHTML = `
                <div class="story-circle">
                    <img src="${story.img}" alt="${story.name}" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/150/000000/FFFFFF?text=FAIL'">
                </div>
                <p class="story-name">${story.name}</p>
            `;
            storiesFeed.appendChild(div);
        });
    }

    function updateTicker(newsArray) {
        const tickerElement = document.querySelector('.breaking-text');
        if (tickerElement && newsArray) {
            tickerElement.innerHTML = newsArray.join(' &nbsp;&nbsp; • &nbsp;&nbsp; ');
        }
    }
    
    function initPoll(poll) {
        const pollSection = document.querySelector('.poll-section');
        if (!pollSection || !poll) return;

        const questionElement = pollSection.querySelector('.poll-title-text');
        if (questionElement) questionElement.innerText = poll.question;

        const optionsContainer = pollSection.querySelector('.poll-options');
        if (optionsContainer) {
             optionsContainer.innerHTML = '';

            poll.options.forEach((option) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'poll-option';
                optionDiv.addEventListener('click', () => votePoll(option.id));
                optionDiv.innerHTML = `
                    <span class="poll-text">${option.text}</span>
                    <div class="poll-bar" id="bar-${option.id}"></div>
                    <span class="poll-percent" id="percent-${option.id}">0%</span>
                `;
                optionsContainer.appendChild(optionDiv);
            });
        }
        
        const footerElement = pollSection.querySelector('.poll-footer');
        if (footerElement) footerElement.innerText = poll.footerText;
    }

    /** * LÓGICA DE INTERACCIÓN Y UX */
     
    function setupLoadMoreButton(loadMoreData) {
        if (loadMoreData && loadMoreData.length > 0 && newsGrid) {
            
            loadBtnContainer.innerHTML = '';
            const btnHTML = `<button class="btn-secondary" id="loadMoreBtn">Ver más chismes</button>`;
            loadBtnContainer.innerHTML = btnHTML;
            
            if(newsGrid.parentNode) {
                newsGrid.parentNode.insertBefore(loadBtnContainer, newsGrid.nextSibling);
            }

            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if(loadMoreBtn) {
                 loadMoreBtn.addEventListener('click', function() {
                    const btn = this;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
                    
                    setTimeout(() => { 
                        renderNews(loadMoreData, true); 
                        window.initFilters(); 
                        
                        btn.innerHTML = '¡Estás al día!';
                        btn.style.opacity = '0.5';
                        btn.style.cursor = 'default';
                        btn.replaceWith(btn.cloneNode(true)); 
                    }, 800); 
                });
            }
        }
    }
    
    function setupModalListener() {
        const modal = document.getElementById('newsModal');
        const closeBtn = document.querySelector('.close-modal');
        
        if(newsGrid) {
            newsGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.news-card');
                if(card && !e.target.closest('button')) {
                    const articleId = parseInt(card.getAttribute('data-article-id')); 
                    const fullArticle = allNewsData.find(a => a.id === articleId); 

                    if (fullArticle && modal) {
                        document.getElementById('modalImg').src = fullArticle.image;
                        document.getElementById('modalTitle').innerText = fullArticle.title;
                        document.getElementById('modalCat').innerText = fullArticle.category;
                        
                        const descElement = document.getElementById('modalDesc');
                        if (descElement) {
                            // CORRECCIÓN AQUI: Se eliminó '|| fullArticle.summary'
                            // Si no hay longDescription, muestra un mensaje vacío o predeterminado, pero NO el resumen.
                            descElement.innerText = fullArticle.longDescription ? fullArticle.longDescription : ""; 
                        }

                        modal.classList.add('open');
                        document.body.style.overflow = 'hidden'; 
                    }
                }
            });
        }

        if(closeBtn && modal) {
            closeBtn.onclick = () => {
                modal.classList.remove('open');
                document.body.style.overflow = 'auto';
            };
        }
        
        if(modal) {
            modal.onclick = (e) => { 
                if(e.target === modal) {
                    modal.classList.remove('open');
                    document.body.style.overflow = 'auto';
                }
            };
        }
    }
    
    // Cierre con tecla Escape
    document.addEventListener('keydown', (e) => {
        if(e.key === "Escape") {
            const modal = document.getElementById('newsModal');
            const searchOverlay = document.getElementById('searchOverlay');
            
            if (modal && modal.classList.contains('open')) {
                modal.classList.remove('open');
                document.body.style.overflow = 'auto';
            }
            if (searchOverlay && searchOverlay.classList.contains('active')) {
                toggleSearch();
            }
        }
    });

    /** * FUNCIONALIDAD DE BÚSQUEDA DINÁMICA */
    function handleSearch(query) {
        const searchText = query.toLowerCase().trim();
        const newsCards = document.querySelectorAll('.news-card');

        const activeFilter = document.querySelector('.filter-btn.active');
        const activeCategory = activeFilter ? activeFilter.getAttribute('data-filter') : 'all'; 
        
        newsCards.forEach(card => {
            const title = card.querySelector('h3') ? card.querySelector('h3').innerText.toLowerCase() : '';
            const summary = card.querySelector('p') ? card.querySelector('p').innerText.toLowerCase() : '';
            const category = card.getAttribute('data-category') ? card.getAttribute('data-category').toLowerCase() : 'n/a';
            
            const passesCategoryFilter = activeCategory === 'all' || category === activeCategory.toLowerCase();
            const passesSearchFilter = (title.includes(searchText) || summary.includes(searchText));
            
            if (passesSearchFilter && passesCategoryFilter) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });

        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if(loadMoreBtn) {
            loadMoreBtn.style.display = searchText.length > 0 ? 'none' : 'block';
        }
    }

});

/* ========================================= */
/* === FUNCIONES GLOBALES === */
/* ========================================= */

window.toggleReact = function(btn, event) {
    event.stopPropagation(); 
    btn.classList.toggle('active');
    let span = btn.querySelector('span');
    if (span) {
        let count = parseInt(span.innerText);
        span.innerText = btn.classList.contains('active') ? count + 1 : count - 1;
    }
}

window.toggleSearch = function() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    if (overlay) overlay.classList.toggle('active');
    if(overlay && overlay.classList.contains('active') && input) {
        setTimeout(() => input.focus(), 100);
    }
}

window.initFilters = function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const newsCards = document.querySelectorAll('.news-card');

    if (typeof window.filterNews !== 'function') { 
        window.filterNews = function(filterCategory, clickedButton) {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            if (clickedButton) clickedButton.classList.add('active');

            const searchInput = document.getElementById('searchInput');
            if(searchInput) searchInput.value = '';
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if(loadMoreBtn) loadMoreBtn.style.display = 'block';

            newsCards.forEach(card => {
                const cardCategoryTag = card.querySelector('.category-tag');
                const cardCategory = cardCategoryTag ? cardCategoryTag.textContent.trim() : 'N/A';

                if (filterCategory === 'all' || cardCategory === filterCategory) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        }
    }

    filterButtons.forEach(btn => {
        if (!btn.hasAttribute('data-listener-added')) {
            btn.addEventListener('click', function() {
                window.filterNews(this.getAttribute('data-filter'), this);
            });
            btn.setAttribute('data-listener-added', 'true');
        }
    });
    
    const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
    if (allBtn && !document.querySelector('.filter-btn.active')) {
        window.filterNews('all', allBtn);
    }
}

window.votePoll = function(optionIndex) {
    if(localStorage.getItem('gungo_poll_voted')) {
        alert("¡Ya votaste en esta polémica! Vuelve la próxima semana.");
        return;
    }
    const results = optionIndex === 0 ? [65, 35] : [40, 60];
    const bar0 = document.getElementById('bar-0');
    const percent0 = document.getElementById('percent-0');
    const bar1 = document.getElementById('bar-1');
    const percent1 = document.getElementById('percent-1');

    if (bar0 && percent0) {
        bar0.style.width = results[0] + "%";
        percent0.innerText = results[0] + "%";
    }
    if (bar1 && percent1) {
        bar1.style.width = results[1] + "%";
        percent1.innerText = results[1] + "%";
    }
    
    localStorage.setItem('gungo_poll_voted', 'true');
    
    const options = document.querySelectorAll('.poll-option');
    options.forEach(opt => opt.style.borderColor = "#444"); 
    const selectedOption = document.querySelector(`.poll-option[onclick*="${optionIndex}"]`);
    if(selectedOption) selectedOption.style.borderColor = "#E50914";
}

window.shareNative = function(title, text) {
    if (navigator.share) {
        navigator.share({ title: title, text: text, url: window.location.href })
        .then(() => console.log('Compartido con éxito'))
        .catch((error) => console.log('Error compartiendo', error));
    } else {
        alert("Enlace copiado al portapapeles: " + window.location.href);
    }
}

window.shareCurrentModal = function() {
    const title = document.getElementById('modalTitle') ? document.getElementById('modalTitle').innerText : "Chisme GUNGO";
    shareNative(title, "¡No vas a creer este chisme de GUNGO!");
}

window.toggleOfficeMode = function() {
    document.body.classList.toggle('office-mode');
    if(document.body.classList.contains('office-mode')) {
        alert("Modo Oficina Activado: Navega discreto 🤫");
    }
}

window.startLiveNotifications = function() {
    const headlines = [
        "👀 Alguien acaba de filtrar un video privado...",
        "🔥 ¡Nueva pareja confirmada en Hollywood!",
        "👗 Zendaya acaba de llegar a la alfombra roja.",
        "🎤 Cancelan concierto masivo a última hora."
    ];

    setInterval(() => {
        if(Math.random() > 0.8) {
            showToast(headlines[Math.floor(Math.random() * headlines.length)]);
        }
    }, 10000);
}

function showToast(text) {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<div class="toast-header">AHORA MISMO</div><div class="toast-body">${text}</div>`;
    
    toast.onclick = () => {
        const firstCard = document.querySelector('.news-card');
        if(firstCard) firstCard.click();
        toast.remove();
    };

    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

