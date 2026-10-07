// src/js/html_components/header.js

export class MainHeader extends HTMLElement {
    constructor() {
        super();
        this._cartCount = 0;
    }

    connectedCallback() {
        // pages/ está un solo nivel por debajo de la raíz
        const isInAdmin = window.location.pathname.includes('/admin/');
        const isInPages = window.location.pathname.includes('/pages/');

        let rootPath;
        let filialesPath;
        let artistsPath;
        let discograficasPath;

        if (isInAdmin) {
            // Desde /admin/ hay que subir un nivel
            rootPath = '../../';
            filialesPath = '../../pages/filiales.html';
            artistsPath = '../../pages/artistas.html';
            discograficasPath = '../../pages/discograficas.html';

        } else if (isInPages) {
            // Desde /pages/ hay que subir un nivel
            rootPath = '../';
            filialesPath = 'filiales.html';
            artistsPath = 'artistas.html';
            discograficasPath = 'discograficas.html';

        } else {
            // Desde la raíz
            rootPath = './';
            filialesPath = 'pages/filiales.html';
            artistsPath = 'pages/artistas.html';
            discograficasPath = 'pages/discograficas.html';
        }

        this.innerHTML = `
            <header id="main-header">
                <div class="container header-container">
                    <div class="header-brand">
                        <a href="${rootPath}index.html" class="brand-logo">
                            <span class="brand-name">Palmeras Records</span>
                            <span class="brand-badge">Est. 1984</span>
                        </a>
                    </div>

                    <nav class="header-nav" aria-label="Navegación principal">
                        <a href="${rootPath}" class="nav-link">Catálogo</a>
                        <a href="${artistsPath}" class="nav-link">Artistas</a>
                        <a href="${discograficasPath}" class="nav-link">Discográficas</a>
                        <a href="${filialesPath}" class="nav-link">Filiales y Stock</a>
                    </nav>

                </div>
            </header>
        `;

        this._setupEvents();
        this._highlightActiveNav();
    }

    _setupEvents() {
        // Evento al pulsar el botón del carrito
        const cartBtn = this.querySelector('#headerCartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('open-cart', {
                    bubbles: true,
                    composed: true
                }));
            });
        }

        // Resaltar al hacer clic en enlaces de la misma página (anclas)
        const navLinks = this.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    _highlightActiveNav() {
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;
        const navLinks = this.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');

            // 1. Si estamos en artistas.html
            if (currentPath.includes('artistas.html') && href.includes('artistas.html')) {
                link.classList.add('active');
            }
            // 2. Si estamos en filiales.html
            else if (currentPath.includes('filiales.html') && href.includes('filiales.html')) {
                link.classList.add('active');
            }
            // 3. Si estamos en una sección con ancla (#catalogo, #artistas, etc.)
            else if (currentHash && href.endsWith(currentHash)) {
                link.classList.add('active');
            }
            // 4. Si estamos en la portada (index.html o raíz) y no hay hash, activa Catálogo por defecto
            else if (!currentHash && (currentPath.endsWith('/') || currentPath.endsWith('index.html')) && href.includes('#catalogo')) {
                link.classList.add('active');
            }
        });
    }

    updateCartCount(count) {
        this._cartCount = count;
        const label = this.querySelector('#cartLabel');
        if (label) {
            label.textContent = `Carrito (${this._cartCount})`;
        }
    }
}

customElements.define("main-header", MainHeader);