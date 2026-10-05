export class MainHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <header id="main-header">
                <div class="container header-container">
                    <div class="header-brand">
                        <a href="index.html" class="brand-logo">
                            <span class="brand-name">Palmeras Records</span>
                            <span class="brand-badge">Est. 1984</span>
                        </a>
                    </div>

                    <nav class="header-nav" aria-label="Navegación principal">
                        <a href="#catalogo" class="nav-link active">Catálogo</a>
                        <a href="#artistas" class="nav-link">Artistas</a>
                        <a href="#discograficas" class="nav-link">Discográficas</a>
                        <a href="#filiales" class="nav-link">Filiales y Stock</a>
                    </nav>

                    <div class="header-actions">
                        <button class="cart-btn" aria-label="Ver carrito">
                            <span class="cart-label">Carrito (0)</span>
                        </button>
                    </div>
                </div>
            </header>
        `;
    }
}

customElements.define("main-header", MainHeader);