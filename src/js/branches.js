const API_URL = 'http://127.0.0.1:8000';
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=120&q=80';

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --------------------------------------------------------------------------
// 1. CARGA DE SEDES FÍSICAS
// --------------------------------------------------------------------------
async function loadBranches() {
    const gridEl = document.getElementById('branchesGrid');
    if (!gridEl) return;

    try {
        const res = await fetch(`${API_URL}/branches/`);
        if (!res.ok) throw new Error('Error al obtener tiendas');

        const branches = await res.json();

        if (branches.length === 0) {
            gridEl.innerHTML = `
                <p style="grid-column: 1 / -1; text-align: center; color: var(--color-text-muted); padding: 2rem 0;">
                    No hay sedes registradas actualmente en el sistema.
                </p>
            `;
            return;
        }

        gridEl.innerHTML = branches.map((branch, index) => {
            const tagLabel = index === 0 ? 'Sede Central' : 'Filial Oficial';
            const mapQuery = encodeURIComponent(branch.address || branch.name);
            const cleanPhone = (branch.phone || '').replace(/\s+/g, '');

            return `
                <article class="branch-card">
                    <div class="branch-header">
                        <span class="branch-tag">${tagLabel}</span>
                        <h3 class="branch-city">${escapeHtml(branch.name)}</h3>
                        <address class="branch-address">
                            ${escapeHtml(branch.address)}<br />
                            ${branch.phone ? `<a href="tel:${cleanPhone}" class="branch-phone">${escapeHtml(branch.phone)}</a>` : ''}
                        </address>

                        <div class="branch-map-wrapper">
                            <iframe
                                class="branch-map-frame"
                                title="Mapa ${escapeHtml(branch.name)}"
                                loading="lazy"
                                src="https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed">
                            </iframe>
                        </div>
                    </div>

                    <div class="branch-hours">
                        <span class="hours-label">Horario de apertura:</span>
                        <p>Mar a Sáb: 11:00 — 20:30h</p>
                        <p>Dom y Lun: Cerrado</p>
                    </div>
                </article>
            `;
        }).join('');

    } catch (err) {
        console.error('Error cargando sucursales:', err);
        gridEl.innerHTML = `
            <p style="grid-column: 1 / -1; text-align: center; color: #dc2626; padding: 2rem 0;">
                No se pudo cargar la información de las tiendas físicas.
            </p>
        `;
    }
}

// --------------------------------------------------------------------------
// 2. CARGA DE TABLA DE STOCK GLOBAL
// --------------------------------------------------------------------------
async function loadStockTable() {
    const tableBody = document.getElementById('stockTableBody');
    if (!tableBody) return;

    try {
        const [stockRes, albumsRes, formatsRes] = await Promise.allSettled([
            fetch(`${API_URL}/album-formats/`),
            fetch(`${API_URL}/albums/`),
            fetch(`${API_URL}/formats/`)
        ]);

        const stockList = stockRes.status === 'fulfilled' && stockRes.value.ok ? await stockRes.value.json() : [];
        const albums = albumsRes.status === 'fulfilled' && albumsRes.value.ok ? await albumsRes.value.json() : [];
        const formats = formatsRes.status === 'fulfilled' && formatsRes.value.ok ? await formatsRes.value.json() : [];

        const albumsMap = Object.fromEntries(albums.map(a => [a.id, a]));
        const formatsMap = Object.fromEntries(formats.map(f => [f.id, f.name]));

        if (stockList.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; color: var(--color-text-muted); padding: 2.5rem 0;">
                        No hay existencias registradas en este momento.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = stockList.map(item => {
            const album = albumsMap[item.album_id] || { title: `Álbum #${item.album_id}`, cover_image_url: DEFAULT_COVER };
            const formatName = formatsMap[item.format_id] || `Formato #${item.format_id}`;
            const cover = album.cover_image_url || DEFAULT_COVER;

            const artistName = (album.artists && album.artists.length > 0)
                ? album.artists.map(a => a.name).join(', ')
                : 'Palmeras Records Archive';

            let statusBadge = '';
            const stockQty = Number(item.stock ?? 0);

            if (stockQty > 5) {
                statusBadge = `
                    <span class="stock-badge in-stock">
                        <span class="badge-dot"></span>
                        Disponible (${stockQty} uds.)
                    </span>
                `;
            } else if (stockQty > 0) {
                statusBadge = `
                    <span class="stock-badge low-stock">
                        <span class="badge-dot"></span>
                        Últimas ${stockQty} uds.
                    </span>
                `;
            } else {
                statusBadge = `
                    <span class="stock-badge out-of-stock">
                        <span class="badge-dot"></span>
                        Agotado
                    </span>
                `;
            }

            return `
                <tr class="stock-row">
                    <td class="album-cell">
                        <img
                            src="${escapeHtml(cover)}"
                            alt="Portada de ${escapeHtml(album.title)}"
                            class="stock-thumb"
                            loading="lazy"
                        />
                        <div class="album-meta-text">
                            <span class="stock-album-title">${escapeHtml(album.title)}</span>
                            <span class="stock-album-artist">${escapeHtml(artistName)}</span>
                        </div>
                    </td>
                    <td class="format-cell">${escapeHtml(formatName)}</td>
                    <td class="status-cell">
                        ${statusBadge}
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error('Error cargando la tabla de stock:', err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; color: #dc2626; padding: 2rem 0;">
                    Error al consultar la base de datos de stock.
                </td>
            </tr>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadBranches();
    loadStockTable();
});