import { API_URL } from './config.js';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000
});

let allArtists = [];
let albumsMap = {};
let labelsMap = {};
let formatsMap = {};
let priceMap = {};
let priceByFormat = {};
let albumFormatsMap = {};

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getWorkPrice(albumId, formatId) {
    const perFormat = priceByFormat[albumId];
    if (formatId !== undefined && perFormat && perFormat[formatId] !== undefined) {
        return perFormat[formatId];
    }
    return priceMap[albumId] ?? 24.0;
}

function formatPrice(value) {
    return `${Number(value).toFixed(2).replace('.', ',')} €`;
}

function renderWorkCard(album) {
    const cover = album.cover_image_url || DEFAULT_COVER;
    const formatIds = albumFormatsMap[album.id] || [];
    const labelName = labelsMap[album.label_id] || 'Sello independiente';

    const chipsHtml = formatIds.map((formatId, index) => {
        const name = formatsMap[formatId] || `Formato #${formatId}`;
        return `<button type="button" class="format-chip${index === 0 ? ' is-selected' : ''}"
                    data-album="${album.id}" data-format="${formatId}">${escapeHtml(name)}</button>`;
    }).join('');

    return `
        <div class="work-card">
            <div class="work-card__top">
                <div class="work-card__cover">
                    <img src="${escapeHtml(cover)}" alt="Portada de ${escapeHtml(album.title)}" loading="lazy" />
                </div>
                <div class="work-card__text">
                    <div class="work-card__row">
                        <h3 class="work-card__title">${escapeHtml(album.title)}</h3>
                        <span class="work-card__price" data-price-for="${album.id}">${formatPrice(getWorkPrice(album.id, formatIds[0]))}</span>
                    </div>
                    <span class="work-card__meta">${escapeHtml(album.release_year)} &bull; ${escapeHtml(labelName)}</span>
                </div>
            </div>
            ${chipsHtml ? `
            <div class="work-card__actions">
                <div class="format-picker">${chipsHtml}</div>
            </div>` : ''}
        </div>
    `;
}

function renderArtistCard(artist) {
    const albums = (artist.album_ids || []).map(id => albumsMap[id]).filter(Boolean);
    const count = albums.length;

    let badgeText = 'Sin obras en tienda';
    if (count === 1) badgeText = '1 Obra en Tienda';
    else if (count > 1) badgeText = `${count} Obras en Tienda`;

    return `
        <article class="artist-card">
            <div class="artist-card__head">
                <div class="artist-card__info">
                    <h2 class="artist-card__name">${escapeHtml(artist.name)}</h2>
                    <p class="artist-card__bio">${escapeHtml(artist.bio || 'Sin biografía disponible')}</p>
                </div>
                <div class="artist-card__count">
                    <span class="works-badge">
                        <span class="works-badge__dot"></span>
                        ${badgeText}
                    </span>
                </div>
            </div>
            ${count > 0 ? `
            <div class="works-grid">
                ${albums.map(album => renderWorkCard(album)).join('')}
            </div>` : ''}
        </article>
    `;
}

function setupFormatChips() {
    document.querySelectorAll('.format-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const albumId = Number(chip.dataset.album);
            const formatId = Number(chip.dataset.format);

            document.querySelectorAll(`.format-chip[data-album="${albumId}"]`)
                .forEach(c => c.classList.remove('is-selected'));
            chip.classList.add('is-selected');

            const priceEl = document.querySelector(`[data-price-for="${albumId}"]`);
            if (priceEl) priceEl.textContent = formatPrice(getWorkPrice(albumId, formatId));
        });
    });
}

function renderArtists(listEl, artists) {
    if (artists.length === 0) {
        listEl.innerHTML = `
            <div class="artists-empty">
                <p style="font-weight: 600; margin-bottom: 0.5rem;">No hay artistas registrados.</p>
                <p style="font-size: 0.9rem;">Da de alta artistas desde el panel de control.</p>
            </div>`;
        return;
    }

    listEl.innerHTML = artists.map(renderArtistCard).join('');
    setupFormatChips();
}

export async function initArtists() {
    const listEl = document.getElementById('artistList');
    if (!listEl) return;

    try {
        const [artistsRes, albumsRes, labelsRes, formatsRes, stockRes] = await Promise.allSettled([
            api.get('/artists/'),
            api.get('/albums/'),
            api.get('/record-labels/'),
            api.get('/formats/'),
            api.get('/album-formats/')
        ]);

        if (artistsRes.status === 'rejected') {
            throw new Error('No se pudo consultar /artists/');
        }

        allArtists = artistsRes.value.data || [];
        const albums = albumsRes.status === 'fulfilled' ? (albumsRes.value.data || []) : [];
        const labels = labelsRes.status === 'fulfilled' ? (labelsRes.value.data || []) : [];
        const formats = formatsRes.status === 'fulfilled' ? (formatsRes.value.data || []) : [];
        const stockList = stockRes.status === 'fulfilled' ? (stockRes.value.data || []) : [];

        albumsMap = Object.fromEntries(albums.map(a => [a.id, a]));
        labelsMap = Object.fromEntries(labels.map(l => [l.id, l.name]));
        formatsMap = Object.fromEntries(formats.map(f => [f.id, f.name]));

        priceMap = {};
        priceByFormat = {};
        albumFormatsMap = {};

        stockList.forEach(item => {
            if (!priceMap[item.album_id] || item.price < priceMap[item.album_id]) {
                priceMap[item.album_id] = item.price;
            }
            if (!priceByFormat[item.album_id]) priceByFormat[item.album_id] = {};
            priceByFormat[item.album_id][item.format_id] = item.price;
            if (!albumFormatsMap[item.album_id]) albumFormatsMap[item.album_id] = [];
            if (!albumFormatsMap[item.album_id].includes(item.format_id)) {
                albumFormatsMap[item.album_id].push(item.format_id);
            }
        });

        renderArtists(listEl, allArtists);

    } catch (error) {
        console.error('Error al inicializar la página de artistas:', error);
        listEl.innerHTML = `
            <div class="artists-empty">
                <p style="font-weight: 600; color: #dc2626;">Error al conectar con la base de datos de artistas.</p>
            </div>`;
    }
}