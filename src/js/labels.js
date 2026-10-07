// ==========================================================================
// DISCOGRÁFICAS — datos 100% del backend (sin mocks)
// Endpoints usados:
//   GET /record-labels/            -> [{ id, name, country, website }]
//   GET /record-labels/countries   -> ["España", ...]
//   GET /albums/label/{label_id}   -> AlbumSummary [{ id, title, release_year,
//                                      label_id, cover_image_url }]
//   GET /artists/                  -> [{ id, name, bio, album_ids }]
// La tabla es: Portada | Álbum | Artista | Año 
// ==========================================================================

import { API_URL } from './config.js';

const state = {
  labels: [],
  albumsByLabel: new Map(),
  artistsByAlbum: new Map(),
  countries: [],
  query: '',
  country: 'all',
  loading: true,
  error: '',
};

// --- Utilidades ------------------------------------------------------------

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function debounce(fn, delay = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

async function fetchJson(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} -> HTTP ${res.status}`);
  return res.json();
}

// --- Carga desde el backend ------------------------------------------------

async function loadFromApi() {
  state.loading = true;
  state.error = '';
  render();

  try {
    const [labels, countries, artists] = await Promise.all([
      fetchJson('/record-labels/'),
      fetchJson('/record-labels/countries'),
      fetchJson('/artists/'),
    ]);

    state.labels = Array.isArray(labels) ? labels : [];
    state.countries = Array.isArray(countries) ? countries : [];

    // Mapa album_id -> nombres de artistas (ArtistResponse.album_ids).
    const byAlbum = new Map();
    (Array.isArray(artists) ? artists : []).forEach((artist) => {
      (artist.album_ids || []).forEach((albumId) => {
        if (!byAlbum.has(albumId)) byAlbum.set(albumId, []);
        byAlbum.get(albumId).push(artist.name);
      });
    });
    state.artistsByAlbum = byAlbum;

    // Álbumes de cada sello (AlbumSummary, sin artistas incluidos).
    const albumsByLabel = new Map();
    await Promise.all(
      state.labels.map(async (label) => {
        try {
          const albums = await fetchJson(`/albums/label/${label.id}`);
          albumsByLabel.set(label.id, Array.isArray(albums) ? albums : []);
        } catch {
          albumsByLabel.set(label.id, []);
        }
      })
    );
    state.albumsByLabel = albumsByLabel;
  } catch (err) {
    console.error(err);
    state.error =
      `No se pudo conectar con la API (${API_URL}). Arranca el backend y recarga la página.`;
  } finally {
    state.loading = false;
    renderCountryFilters();
    render();
  }
}

// --- Filtrado (solo campos reales: name + country) -------------------------

function getFilteredLabels() {
  const q = normalize(state.query.trim());

  return state.labels.filter((label) => {
    if (state.country !== 'all' && label.country !== state.country) return false;
    if (!q) return true;
    const haystack = normalize(`${label.name} ${label.country}`);
    return q.split(/\s+/).every((word) => haystack.includes(word));
  });
}

// --- Render ----------------------------------------------------------------

function renderCover(album) {
  if (album.cover_image_url) {
    return `
      <div class="label-table__cover">
        <img src="${escapeHtml(album.cover_image_url)}" alt="Portada de ${escapeHtml(album.title)}" loading="lazy" />
      </div>`;
  }
  return `
    <div class="label-table__cover label-table__cover--empty" aria-hidden="true">
      <span class="material-symbols-outlined">album</span>
    </div>`;
}

function renderRelease(album) {
  const artistNames = state.artistsByAlbum.get(album.id) || [];
  const artistText = artistNames.length ? artistNames.join(', ') : '—';

  return `
    <article class="label-table__row">
      ${renderCover(album)}
      <h3 class="label-table__album">${escapeHtml(album.title)}</h3>
      <span class="label-table__artist">${escapeHtml(artistText)}</span>
      <span class="label-table__year">${escapeHtml(album.release_year)}</span>
    </article>`;
}

function renderLabel(label) {
  const albums = state.albumsByLabel.get(label.id) || [];
  const sorted = [...albums].sort((a, b) => b.release_year - a.release_year);
  const releases = sorted.map(renderRelease).join('');

  return `
    <div class="label-block" data-label-id="${escapeHtml(label.id)}">
      <header class="label-featured__header">
        <div class="label-featured__info">
          <div class="label-featured__title-row">
            <h2 class="label-featured__name">${escapeHtml(label.name)}</h2>
          </div>
          <p class="label-featured__location">
            <span class="material-symbols-outlined">location_on</span>
            ${escapeHtml(label.country)}
          </p>
        </div>
      </header>

      <div class="label-table" aria-label="Lanzamientos de ${escapeHtml(label.name)}">
        <div class="label-table__head">
          <span>Portada</span>
          <span>Álbum</span>
          <span>Artista</span>
          <span>Año</span>
        </div>
        ${releases || '<p class="label-empty">Este sello aún no tiene álbumes registrados.</p>'}
      </div>
    </div>`;
}

function render() {
  const container = document.getElementById('labelsList');
  if (!container) return;

  if (state.loading) {
    container.innerHTML = '<p class="label-loading" role="status">Cargando sellos discográficos…</p>';
    return;
  }

  if (state.error) {
    container.innerHTML = `
      <div class="label-empty-state" role="alert">
        <span class="material-symbols-outlined">cloud_off</span>
        <p><strong>Sin conexión con el backend.</strong> ${escapeHtml(state.error)}</p>
        <button type="button" class="territory-pill" id="retryLoad">Reintentar</button>
      </div>`;
    document.getElementById('retryLoad')?.addEventListener('click', loadFromApi);
    return;
  }

  const filtered = getFilteredLabels();

  if (!filtered.length) {
    container.innerHTML = `
      <div class="label-empty-state">
        <span class="material-symbols-outlined">search_off</span>
        <p><strong>Sin resultados.</strong> Prueba con otro sello o país.</p>
      </div>`;
    return;
  }

  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  container.innerHTML = sorted.map(renderLabel).join('');
}

function renderCountryFilters() {
  const nav = document.getElementById('countryFilters');
  if (!nav) return;

  nav.innerHTML =
    '<button type="button" class="territory-pill active" data-country="all">Todos los países</button>' +
    state.countries
      .map(
        (c) =>
          `<button type="button" class="territory-pill" data-country="${escapeHtml(c)}">${escapeHtml(c)}</button>`
      )
      .join('');

  nav.querySelectorAll('.territory-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      nav.querySelectorAll('.territory-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      state.country = pill.dataset.country || 'all';
      render();
    });
  });
}

// --- Eventos ---------------------------------------------------------------

function initSearch() {
  const searchInput = document.getElementById('labelSearch');
  if (searchInput) {
    searchInput.addEventListener(
      'input',
      debounce((e) => {
        state.query = e.target.value;
        render();
      })
    );
  }
}

// --- Init ------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  loadFromApi();
});
