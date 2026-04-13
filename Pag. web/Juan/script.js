document.addEventListener('DOMContentLoaded', () => {

    const logoImg         = document.querySelector('.logo-img');
    const logoPlaceholder = document.querySelector('.logo-img-placeholder');

    if (logoImg && logoPlaceholder) {
        if (logoImg.complete && logoImg.naturalWidth > 0) {
            logoPlaceholder.style.display = 'none';
        } else {
            logoImg.addEventListener('load', () => { logoPlaceholder.style.display = 'none'; });
            logoImg.addEventListener('error', () => { logoPlaceholder.style.display = 'flex'; });
        }
    }

    //Navegavion y filtros de video
    function showSection(targetId, filter) {
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll(`.nav-link[data-target="${targetId}"]`).forEach(l => l.classList.add('active'));

        if (filter) applyFilter(filter);

        window.scrollTo({ top: 0, behavior: 'smooth' });

        closeMobileMenu();
    }

    window.showSection = showSection;

    // Manejar todos los .nav-link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.dataset.target;
            const filter = this.dataset.filter;
            if (target) showSection(target, filter);
        });
    }); 
    
    // Dropdown videos
    const videoNav      = document.getElementById('videoNav');
    const dropdownLi    = videoNav?.closest('.dropdown');

    if (videoNav && dropdownLi) {
        videoNav.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdownLi.classList.toggle('open');
            videoNav.setAttribute('aria-expanded', dropdownLi.classList.contains('open'));
        });

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!dropdownLi.contains(e.target)) {
                dropdownLi.classList.remove('open');
                videoNav.setAttribute('aria-expanded', 'false');
            }
        });

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdownLi.classList.remove('open');
                videoNav.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Hamburguer menu movil
    const hamburger  = document.getElementById('hamburger');
    const mainNav    = document.getElementById('mainNav');
    const navOverlay = document.getElementById('navOverlay');

    function openMobileMenu() {
        hamburger.classList.add('open');
        mainNav.classList.add('open');
        navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        hamburger.classList.remove('open');
        mainNav.classList.remove('open');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    hamburger?.addEventListener('click', () => {
        mainNav.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
    });

    navOverlay?.addEventListener('click', closeMobileMenu);

    // Calidad de miniatura a intentar en orden descendente
    const YT_THUMB_QUALITIES = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default'];
 
    function isPlaceholderId(id) {
        return !id || id.trim() === '' || id.startsWith('REEMPLAZA');
    }
 
    function loadThumb(img, ytId, qualityIndex) {
        if (qualityIndex >= YT_THUMB_QUALITIES.length) {
            // Todas fallaron: mostrar fondo de color
            img.style.display = 'none';
            return;
        }
        const q = YT_THUMB_QUALITIES[qualityIndex];
        const url = `https://img.youtube.com/vi/${ytId}/${q}.jpg`;
 
        const tester = new Image();
        tester.onload = () => {
            // YouTube devuelve una imagen 120x90 cuando no existe la calidad pedida
            if (tester.width <= 120) {
                loadThumb(img, ytId, qualityIndex + 1);
            } else {
                img.src = url;
                img.style.display = '';
            }
        };
        tester.onerror = () => loadThumb(img, ytId, qualityIndex + 1);
        tester.src = url;
    }
 
    // Iniciar cada tarjeta de video
    document.querySelectorAll('.video-card').forEach(card => {
        const ytId     = (card.dataset.youtubeId || '').trim();
        const thumb    = card.querySelector('.thumb-img');
        const iframe   = card.querySelector('.hover-preview');
        const overlay  = card.querySelector('.play-overlay');
 
        // Miniatura
        if (thumb) {
            // Si ya tiene src propio (imagen local), no tocar
            const hasSrc = thumb.getAttribute('src') && thumb.getAttribute('src') !== '';
            if (!hasSrc) {
                if (!isPlaceholderId(ytId)) {
                    loadThumb(thumb, ytId, 0);
                } else {
                    // Sin ID real aun: fondo oscuro como placeholder visual
                    thumb.style.display = 'none';
                }
            }
        }
 
        // preview mute
        if (!iframe) return;
 
        let hoverTimer = null;
 
        if (isPlaceholderId(ytId)) {
            // Sin ID real: el hover solo muestra el overlay de play, no intenta cargar iframe
            return;
        }
 
        const previewSrc = `https://www.youtube-nocookie.com/embed/${ytId}`
            + `?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}`
            + `&modestbranding=1&playsinline=1&start=5&enablejsapi=0`;
 
        card.addEventListener('mouseenter', () => {
            hoverTimer = setTimeout(() => {
                iframe.src = previewSrc;
                iframe.classList.add('active');
                if (thumb)   thumb.style.opacity   = '0';
                if (overlay) overlay.style.opacity = '0';
            }, 700);
        });
 
        card.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimer);
            iframe.classList.remove('active');
            // Pequeño retardo para que la transición de opacidad se vea suave
            setTimeout(() => { iframe.src = ''; }, 300);
            if (thumb)   thumb.style.opacity   = '';
            if (overlay) overlay.style.opacity = '';
        });
    });

    //Reproductor 
    const videoModal  = document.getElementById('videoModal');
    const videoFrame  = document.getElementById('videoFrame');
    const modalTitle  = document.getElementById('modalTitle');
    const modalClose  = document.getElementById('modalClose');
    const modalOverlay = document.getElementById('modalOverlay');

    function openVideo(ytId, title) {
        if (!ytId || ytId === 'REEMPLAZA_CON_ID_VIDEO') {
            alert('Este video aún no tiene un ID de YouTube asignado.\nEdita el HTML y reemplaza "REEMPLAZA_CON_ID_VIDEO".');
            return;
        }
        videoFrame.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`;
        if (modalTitle) modalTitle.textContent = title || 'Video Tutorial';
        videoModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeVideo() {
        videoFrame.src = '';
        videoModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Click en tarjeta= abrir modal
    document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => {
            openVideo(card.dataset.youtubeId, card.dataset.title);
        });
    });

    // Cerrar modal
    modalClose?.addEventListener('click', closeVideo);
    modalOverlay?.addEventListener('click', closeVideo);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.classList.contains('open')) closeVideo();
    });

    // Filtros de video
    function applyFilter(filter) {
        const cards    = document.querySelectorAll('.video-card');
        const noResult = document.getElementById('noResults');
        let visible = 0;

        cards.forEach(card => {
            const match = filter === 'all' || card.dataset.category === filter;
            card.classList.toggle('hidden', !match);
            if (match) visible++;
        });

        if (noResult) noResult.style.display = visible === 0 ? 'block' : 'none';

        // Sincronizar botones de filtro
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
    });

    // Buscador de videos
    function handleSearch(query) {
        // Si hay query, ir a seccion videos
        if (query.trim().length === 0) {
            applyFilter('all');
            return;
        }

        showSection('videos');
        const q       = query.toLowerCase();
        const cards   = document.querySelectorAll('.video-card');
        const noResult = document.getElementById('noResults');
        let visible = 0;

        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            const match = text.includes(q);
            card.classList.toggle('hidden', !match);
            if (match) visible++;
        });

        if (noResult) noResult.style.display = visible === 0 ? 'block' : 'none';

        // Reset filtros
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    }

    const searchInput       = document.getElementById('searchInput');
    const searchInputMobile = document.getElementById('searchInputMobile');
    const searchBtn         = document.querySelector('.search-btn');

    function onSearch(input) {
        if (!input) return;
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSearch(input.value);
        });
    }

    searchBtn?.addEventListener('click', () => handleSearch(searchInput?.value || ''));
    onSearch(searchInput);
    onSearch(searchInputMobile);

    // Acordeones de errores
    document.querySelectorAll('.accordion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.accordion-item');
            const isOpen = item.classList.contains('open');
            // Cerrar todos
            document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });

    // Buscador de errores
    const errorSearch = document.getElementById('errorSearch');
    errorSearch?.addEventListener('input', () => {
        const q = errorSearch.value.toLowerCase();
        document.querySelectorAll('.accordion-item').forEach(item => {
            const keywords = (item.dataset.keywords || '').toLowerCase();
            const text     = item.textContent.toLowerCase();
            const match    = !q || keywords.includes(q) || text.includes(q);
            item.classList.toggle('filtered-out', !match);
        });
    });

    // Formulario de contacto
    window.submitForm = function () {
        const nombre      = document.getElementById('nombre')?.value.trim();
        const correo      = document.getElementById('correo')?.value.trim();
        const descripcion = document.getElementById('descripcion')?.value.trim();

        if (!nombre || !correo || !descripcion) {
            alert('Por favor completa los campos obligatorios (*).');
            return;
        }

        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(correo)) {
            alert('Por favor ingresa un correo electrónico válido.');
            return;
        }

        const btn        = document.getElementById('submitBtn');
        const formEl     = document.getElementById('contactForm');
        const successEl  = document.getElementById('formSuccess');

        btn.textContent  = 'Enviando…';
        btn.disabled     = true;

        setTimeout(() => {
            formEl.style.display    = 'none';
            successEl.style.display = 'block';
        }, 1200);
    };

});