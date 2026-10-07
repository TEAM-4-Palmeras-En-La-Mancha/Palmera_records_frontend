import { API_URL } from './config.js';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80';

// Estado global del catálogo en memoria
let allAlbums = [];
let labelsMap = {};
let genresMap = {};
let priceMap = {};
let albumFormatsMap = {}; // Relación album_id -> [format_id, ...]

let currentGenreFilter = 'all';
let currentFormatFilter = 'all';
let currentSortOption = 'newest';
let currentSearchQuery = '';

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getArtistName(album) {
    if (album.artists && album.artists.length > 0) {
        return album.artists.map(a => a.name).join(', ');
    }
    return 'Artista desconocido';
}

function getAlbumPrice(albumId) {
    return priceMap[albumId] ?? 24.0;
}

function renderCards(albumsToRender) {
    const gridEl = document.getElementById('catalogGrid');
    if (!gridEl) return;

    if (albumsToRender.length === 0) {
        gridEl.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
                <p style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem;">No se encontraron álbumes con estos filtros.</p>
                <p style="color: var(--color-text-muted); font-size: 0.9rem;">
                    Prueba a restablecer el formato, género o término de búsqueda.
                </p>
            </div>
        `;
        return;
    }

    gridEl.innerHTML = albumsToRender.map(album => {
        const cover = album.cover_image_url || DEFAULT_COVER;
        const artistName = getArtistName(album);

        const genreName = (album.genres && album.genres.length > 0)
            ? album.genres.map(g => g.name).join(' / ')
            : 'Edición Física';

        const labelName = labelsMap[album.label_id] || 'Sello independiente';
        const price = `${Number(getAlbumPrice(album.id)).toFixed(2).replace('.', ',')} €`;

        return `
            <article class="album-card" data-id="${album.id}">
                <div class="album-cover-wrapper">
                    <img src="${escapeHtml(cover)}" 
                         alt="Portada de ${escapeHtml(album.title)}" 
                         class="album-cover" 
                         loading="lazy" />
                    <span class="album-badge">${escapeHtml(genreName)}</span>
                </div>

                <div class="album-info">
                    <div class="album-title-row">
                        <h2 class="album-title">${escapeHtml(album.title)}</h2>
                        <span class="album-price">${escapeHtml(price)}</span>
                    </div>
                    
                    <span class="album-artist">${escapeHtml(artistName)}</span>
                    
                    <div class="album-meta">
                        <span>${escapeHtml(album.release_year)}</span>
                        <span class="meta-dot">•</span>
                        <span>${escapeHtml(labelName)}</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// Aplica simultáneamente género, formato, buscador y ordenación
function applyFiltersAndSort() {
    let result = [...allAlbums];

    // 1. Filtro por Género
    if (currentGenreFilter !== 'all') {
        result = result.filter(album => {
            const matchGenres = album.genres?.some(g => String(g.id) === currentGenreFilter);
            const matchIds = album.genre_ids?.some(id => String(id) === currentGenreFilter);
            return matchGenres || matchIds;
        });
    }

    // 2. Filtro por Formato Físico
    if (currentFormatFilter !== 'all') {
        const targetFormatId = parseInt(currentFormatFilter, 10);
        result = result.filter(album => {
            const formats = albumFormatsMap[album.id] || [];
            return formats.includes(targetFormatId);
        });
    }

    // 3. Filtro por Buscador de texto
    if (currentSearchQuery.trim() !== '') {
        const query = currentSearchQuery.toLowerCase();
        result = result.filter(album => {
            const titleMatch = album.title.toLowerCase().includes(query);
            const artistMatch = getArtistName(album).toLowerCase().includes(query);
            const labelMatch = (labelsMap[album.label_id] || '').toLowerCase().includes(query);
            return titleMatch || artistMatch || labelMatch;
        });
    }

    // 4. Ordenación
    result.sort((a, b) => {
        if (currentSortOption === 'newest') {
            return (b.release_year || 0) - (a.release_year || 0) || b.id - a.id;
        }
        if (currentSortOption === 'artist') {
            return getArtistName(a).localeCompare(getArtistName(b));
        }
        if (currentSortOption === 'price-asc') {
            return getAlbumPrice(a.id) - getAlbumPrice(b.id);
        }
        if (currentSortOption === 'price-desc') {
            return getAlbumPrice(b.id) - getAlbumPrice(a.id);
        }
        return 0;
    });

    renderCards(result);
}

// Configura los botones de género
function setupGenrePills(genres) {
    const pillsContainer = document.getElementById('genreFilters');
    if (!pillsContainer) return;

    const genreButtonsHtml = genres.map(genre => `
        <button type="button" class="genre-pill" data-genre="${genre.id}">
            ${escapeHtml(genre.name)}
        </button>
    `).join('');

    pillsContainer.innerHTML = `
        <button type="button" class="genre-pill ${currentGenreFilter === 'all' ? 'active' : ''}" data-genre="all">Todos</button>
        ${genreButtonsHtml}
    `;

    pillsContainer.querySelectorAll('.genre-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            pillsContainer.querySelectorAll('.genre-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentGenreFilter = btn.dataset.genre;
            applyFiltersAndSort();
        });
    });
}

// Configura el desplegable de formatos con los datos de /formats/
function setupFormatSelector(formats) {
    const formatSelect = document.getElementById('formatSelector');
    if (!formatSelect) return;

    const optionsHtml = formats.map(f => `
        <option value="${f.id}">${escapeHtml(f.name)}</option>
    `).join('');

    formatSelect.innerHTML = `
        <option value="all">Todos los formatos</option>
        ${optionsHtml}
    `;

    formatSelect.addEventListener('change', (e) => {
        currentFormatFilter = e.target.value;
        applyFiltersAndSort();
    });
}

// Configura el desplegable de ordenación y el buscador
function setupControls() {
    const sortSelect = document.getElementById('sortSelector');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSortOption = e.target.value;
            applyFiltersAndSort();
        });
    }

    const searchInput = document.getElementById('catalogSearch');
    const clearBtn = document.getElementById('clearSearch');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            if (clearBtn) {
                clearBtn.classList.toggle('hidden', currentSearchQuery.length === 0);
            }
            applyFiltersAndSort();
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentSearchQuery = '';
            clearBtn.classList.add('hidden');
            applyFiltersAndSort();
        });
    }
}

export async function initCatalog() {
    const gridEl = document.getElementById('catalogGrid');
    if (!gridEl) return;

    try {
        const [albumsRes, labelsRes, genresRes, formatsRes, stockRes] = await Promise.allSettled([
            fetch(`${API_URL}/albums/`),
            fetch(`${API_URL}/record-labels/`),
            fetch(`${API_URL}/genres/`),
            fetch(`${API_URL}/formats/`),
            fetch(`${API_URL}/album-formats/`)
        ]);

        allAlbums = albumsRes.status === 'fulfilled' && albumsRes.value.ok ? await albumsRes.value.json() : [];
        const labels = labelsRes.status === 'fulfilled' && labelsRes.value.ok ? await labelsRes.value.json() : [];
        const genres = genresRes.status === 'fulfilled' && genresRes.value.ok ? await genresRes.value.json() : [];
        const formats = formatsRes.status === 'fulfilled' && formatsRes.value.ok ? await formatsRes.value.json() : [];
        const stockList = stockRes.status === 'fulfilled' && stockRes.value.ok ? await stockRes.value.json() : [];

        labelsMap = Object.fromEntries(labels.map(l => [l.id, l.name]));
        genresMap = Object.fromEntries(genres.map(g => [g.id, g.name]));

        // Mapa de precios mínimos y asignación de formatos por álbum
        priceMap = {};
        albumFormatsMap = {};

        stockList.forEach(item => {
            // Precio más bajo por álbum
            if (!priceMap[item.album_id] || item.price < priceMap[item.album_id]) {
                priceMap[item.album_id] = item.price;
            }
            // Formatos en los que existe este álbum
            if (!albumFormatsMap[item.album_id]) {
                albumFormatsMap[item.album_id] = [];
            }
            if (!albumFormatsMap[item.album_id].includes(item.format_id)) {
                albumFormatsMap[item.album_id].push(item.format_id);
            }
        });

        setupGenrePills(genres);
        setupFormatSelector(formats);
        setupControls();

        applyFiltersAndSort();

    } catch (error) {
        console.error('Error al inicializar el catálogo:', error);
        gridEl.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #dc2626;">
                <p style="font-weight: 600;">Error al conectar con la base de datos del catálogo.</p>
            </div>
        `;
    }
}