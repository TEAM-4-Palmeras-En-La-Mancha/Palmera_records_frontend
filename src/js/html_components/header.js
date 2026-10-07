// src/js/html_components/header.js

export class MainHeader extends HTMLElement {
    constructor() {
        super();
        this._cartCount = 0;
    }

    connectedCallback() {
        const isInAdmin = window.location.pathname.includes('/admin/');
        const isInPages = window.location.pathname.includes('/pages/');

        let rootPath;
        let filialesPath;
        let artistsPath;
        let discograficasPath;
        let adminPath;

        if (isInAdmin) {
            // Desde /pages/admin/
            rootPath = '../../';
            filialesPath = '../../pages/filiales.html';
            artistsPath = '../../pages/artistas.html';
            discograficasPath = '../../pages/discograficas.html';
            adminPath = 'index.html';

        } else if (isInPages) {
            // Desde /pages/
            rootPath = '../';
            filialesPath = 'filiales.html';
            artistsPath = 'artistas.html';
            discograficasPath = 'discograficas.html';
            adminPath = 'admin/index.html';

        } else {
            // Desde la raíz (index.html)
            rootPath = './';
            filialesPath = 'pages/filiales.html';
            artistsPath = 'pages/artistas.html';
            discograficasPath = 'pages/discograficas.html';
            adminPath = 'pages/admin/index.html';
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
                        <a href="${rootPath}index.html" class="nav-link" data-nav="catalogo">Catálogo</a>
                        <a href="${artistsPath}" class="nav-link" data-nav="artistas">Artistas</a>
                        <a href="${discograficasPath}" class="nav-link" data-nav="discograficas">Discográficas</a>
                        <a href="${filialesPath}" class="nav-link" data-nav="filiales">Filiales y Stock</a>
                        <a href="${adminPath}" class="nav-link" data-nav="admin">Admin</a>
                    </nav>

                </div>
            </header>
        `;

        this._setupEvents();
        this._highlightActiveNav();
    }

    _setupEvents() {
        const cartBtn = this.querySelector('#headerCartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('open-cart', {
                    bubbles: true,
                    composed: true
                }));
            });
        }

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
        let activeNav = 'catalogo';

        if (currentPath.includes('/admin/')) {
            activeNav = 'admin';
        } else if (currentPath.includes('discograficas.html')) {
            activeNav = 'discograficas';
        } else if (currentPath.includes('artistas.html')) {
            activeNav = 'artistas';
        } else if (currentPath.includes('filiales.html')) {
            activeNav = 'filiales';
        } else if (!currentPath.includes('/pages/')) {
            activeNav = 'catalogo';
        }

        const navLinks = this.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.dataset.nav === activeNav) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
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