// src/js/admin.js

// ==========================================================================
// CLIENTE AXIOS Y NOTIFICACIONES
// ==========================================================================
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    timeout: 10000
});

// Interceptor: deja libre Content-Type si es FormData (para que el navegador
// configure el multipart/boundary con el archivo adjunto) y JSON en el resto.
api.interceptors.request.use((config) => {
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
    }
    return config;
});

let cachedLabels = [];
let cachedGenres = [];
let cachedArtists = [];

async function loadDropdownData() {
    try {
        const [labelsRes, genresRes, artistsRes] = await Promise.allSettled([
            api.get('/record-labels/'),
            api.get('/genres/'),
            api.get('/artists/')
        ]);
        if (labelsRes.status === 'fulfilled') cachedLabels = labelsRes.value.data || [];
        if (genresRes.status === 'fulfilled') cachedGenres = genresRes.value.data || [];
        if (artistsRes.status === 'fulfilled') cachedArtists = artistsRes.value.data || [];
    } catch (err) {
        console.error('Error al precargar sellos, géneros o artistas:', err);
    }
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================================================
// CONFIGURACIÓN DE LAS 7 ENTIDADES
// ==========================================================================
const ENTITIES = {
    albums: {
        title: 'Gestión de Álbumes',
        endpoint: '/albums',
        columns: ['Ref.', 'Portada', 'Título', 'Artista', 'Año', 'Género', 'Sello (ID)'],
        renderRow: (a) => {
            // Lee los artistas del objeto anidado o resuelve por IDs
            let artistDisplay = 'Sin artista';
            if (a.artists && a.artists.length > 0) {
                artistDisplay = a.artists.map(art => escapeHtml(art.name)).join(', ');
            } else if (a.artist_ids && a.artist_ids.length > 0) {
                artistDisplay = a.artist_ids.map(id => {
                    const match = cachedArtists.find(art => art.id === id);
                    return match ? escapeHtml(match.name) : `#${id}`;
                }).join(', ');
            }

            // Lee los géneros del objeto anidado o resuelve por IDs
            let genreDisplay = 'Sin género';
            if (a.genres && a.genres.length > 0) {
                genreDisplay = a.genres.map(g => escapeHtml(g.name)).join(', ');
            } else if (a.genre_ids && a.genre_ids.length > 0) {
                genreDisplay = a.genre_ids.map(id => {
                    const match = cachedGenres.find(g => g.id === id);
                    return match ? escapeHtml(match.name) : `#${id}`;
                }).join(', ');
            }

            const coverThumb = a.cover_image_url
                ? `<img src="${escapeHtml(a.cover_image_url)}" alt="Portada" style="width: 38px; height: 38px; object-fit: cover; border-radius: 4px;" />`
                : '<span style="color: var(--color-text-muted); font-size: 0.75rem;">Sin img</span>';

            return `
                <td class="font-mono">#${a.id}</td>
                <td>${coverThumb}</td>
                <td class="font-bold">${escapeHtml(a.title)}</td>
                <td>${artistDisplay}</td>
                <td>${escapeHtml(a.release_year)}</td>
                <td><span class="badge">${genreDisplay}</span></td>
                <td class="font-mono">#${escapeHtml(a.label_id)}</td>
            `;
        },
        getFields: (data = {}) => {
            const currentLabelId = data.label_id || '';
            const currentArtistId = (data.artists && data.artists.length > 0)
                ? data.artists[0].id
                : (data.artist_ids && data.artist_ids.length > 0 ? data.artist_ids[0] : '');
            const currentGenreId = (data.genres && data.genres.length > 0)
                ? data.genres[0].id
                : (data.genre_ids && data.genre_ids.length > 0 ? data.genre_ids[0] : '');

            const labelOptions = cachedLabels.length > 0
                ? cachedLabels.map(lbl => `
                    <option value="${lbl.id}" ${lbl.id === currentLabelId ? 'selected' : ''}>
                        ${escapeHtml(lbl.name)} (${escapeHtml(lbl.country)})
                    </option>
                `).join('')
                : '<option value="">No hay discográficas registradas</option>';

            const genreOptions = cachedGenres.length > 0
                ? cachedGenres.map(g => `
                    <option value="${g.id}" ${g.id === currentGenreId ? 'selected' : ''}>
                        ${escapeHtml(g.name)}
                    </option>
                `).join('')
                : '<option value="1">1 - General</option>';

            const artistOptions = cachedArtists.length > 0
                ? cachedArtists.map(art => `
                    <option value="${art.id}" ${art.id === currentArtistId ? 'selected' : ''}>
                        ${escapeHtml(art.name)}
                    </option>
                `).join('')
                : '<option value="">No hay artistas registrados</option>';

            return `
                <div class="form-field">
                    <label for="f-title">Título del Álbum *</label>
                    <input type="text" id="f-title" class="admin-input" value="${escapeHtml(data.title || '')}" placeholder="Ej: Skinty Fia" required />
                </div>
                <div class="form-field">
                    <label for="f-release_year">Año de Lanzamiento *</label>
                    <input type="number" id="f-release_year" class="admin-input" value="${escapeHtml(data.release_year || '')}" placeholder="Ej: 2022" required />
                </div>
                <div class="form-field">
                    <label for="f-artist_ids">Artista o Banda Principal *</label>
                    <select id="f-artist_ids" class="admin-select" required>
                        <option value="">Seleccione artista...</option>
                        ${artistOptions}
                    </select>
                </div>
                <div class="form-field">
                    <label for="f-genre_ids">Género Musical *</label>
                    <select id="f-genre_ids" class="admin-select" required>
                        <option value="">Seleccione un género...</option>
                        ${genreOptions}
                    </select>
                </div>
                <div class="form-field full-width">
                    <label for="f-label_id">Discográfica / Sello *</label>
                    <select id="f-label_id" class="admin-select" required>
                        <option value="">Seleccione discográfica...</option>
                        ${labelOptions}
                    </select>
                </div>
                <div class="form-field full-width">
                    <label for="f-cover-file">Portada del Disco (Archivo de Imagen)</label>
                    <div class="file-upload-zone">
                        <div class="cover-preview-box" id="cover-preview-box">
                            ${data.cover_image_url
                                ? `<img src="${escapeHtml(data.cover_image_url)}" alt="Portada actual" />`
                                : '<span>Sin carátula</span>'}
                        </div>
                        <input type="file" id="f-cover-file" class="admin-input" accept="image/*" />
                    </div>
                </div>
            `;
        },
        getPayload: () => {
            const formData = new FormData();
            formData.append('title', document.getElementById('f-title').value.trim());
            formData.append('release_year', document.getElementById('f-release_year').value);
            formData.append('label_id', document.getElementById('f-label_id').value);

            const artistId = document.getElementById('f-artist_ids').value;
            if (artistId) {
                formData.append('artist_ids', artistId);
            }

            const genreId = document.getElementById('f-genre_ids').value;
            if (genreId) {
                formData.append('genre_ids', genreId);
            }

            const fileInput = document.getElementById('f-cover-file');
            if (fileInput && fileInput.files.length > 0) {
                formData.append('cover_image', fileInput.files[0]);
            }
            return formData;
        }
    },

    genres: {
        title: 'Gestión de Géneros Musicales',
        endpoint: '/genres',
        columns: ['Ref.', 'Nombre del Género'],
        renderRow: (g) => `
            <td class="font-mono">#${g.id}</td>
            <td class="font-bold">${escapeHtml(g.name)}</td>
        `,
        getFields: (data = {}) => `
            <div class="form-field full-width">
                <label for="f-name">Nombre del Género *</label>
                <input type="text" id="f-name" class="admin-input" value="${escapeHtml(data.name || '')}" placeholder="Ej: Post-Punk" required />
            </div>
        `,
        getPayload: () => ({
            name: document.getElementById('f-name').value.trim()
        })
    },

    artists: {
        title: 'Gestión de Artistas y Bandas',
        endpoint: '/artists',
        columns: ['Ref.', 'Nombre del Artista', 'Biografía'],
        renderRow: (a) => `
            <td class="font-mono">#${a.id}</td>
            <td class="font-bold">${escapeHtml(a.name)}</td>
            <td>${escapeHtml(a.bio || 'Sin biografía disponible')}</td>
        `,
        getFields: (data = {}) => `
            <div class="form-field full-width">
                <label for="f-name">Nombre del Artista o Grupo *</label>
                <input type="text" id="f-name" class="admin-input" value="${escapeHtml(data.name || '')}" placeholder="Ej: Fontaines D.C." required />
            </div>
            <div class="form-field full-width">
                <label for="f-bio">Biografía / Reseña Corta</label>
                <textarea id="f-bio" class="admin-textarea" placeholder="Banda irlandesa de post-punk...">${escapeHtml(data.bio || '')}</textarea>
            </div>
        `,
        getPayload: () => ({
            name: document.getElementById('f-name').value.trim(),
            bio: document.getElementById('f-bio').value.trim() || null
        })
    },

    branches: {
        title: 'Gestión de Tiendas',
        endpoint: '/branches',
        columns: ['Ref.', 'Nombre de la Sede', 'Dirección', 'Teléfono'],
        renderRow: (b) => `
            <td class="font-mono">#${b.id}</td>
            <td class="font-bold">${escapeHtml(b.name)}</td>
            <td>${escapeHtml(b.address)}</td>
            <td><a href="tel:${escapeHtml(b.phone)}">${escapeHtml(b.phone)}</a></td>
        `,
        getFields: (data = {}) => `
            <div class="form-field">
                <label for="f-name">Nombre de la Sede *</label>
                <input type="text" id="f-name" class="admin-input" value="${escapeHtml(data.name || '')}" placeholder="Ej: Toledo — Casco Histórico" required />
            </div>
            <div class="form-field">
                <label for="f-phone">Teléfono de Contacto *</label>
                <input type="tel" id="f-phone" class="admin-input" value="${escapeHtml(data.phone || '')}" placeholder="Ej: +34 925 25 61 19" required />
            </div>
            <div class="form-field full-width">
                <label for="f-address">Dirección Física *</label>
                <input type="text" id="f-address" class="admin-input" value="${escapeHtml(data.address || '')}" placeholder="Ej: Calle Santo Tomé 14" required />
            </div>
        `,
        getPayload: () => ({
            name: document.getElementById('f-name').value.trim(),
            address: document.getElementById('f-address').value.trim(),
            phone: document.getElementById('f-phone').value.trim()
        })
    },

    formats: {
        title: 'Formatos Físicos',
        endpoint: '/formats',
        columns: ['Ref.', 'Nombre del Formato', 'Descripción'],
        renderRow: (f) => `
            <td class="font-mono">#${f.id}</td>
            <td class="font-bold">${escapeHtml(f.name)}</td>
            <td>${escapeHtml(f.description || 'Sin descripción')}</td>
        `,
        getFields: (data = {}) => `
            <div class="form-field full-width">
                <label for="f-name">Nombre del Formato *</label>
                <input type="text" id="f-name" class="admin-input" value="${escapeHtml(data.name || '')}" placeholder="Ej: Vinilo LP 180g" required />
            </div>
            <div class="form-field full-width">
                <label for="f-description">Descripción Técnica</label>
                <input type="text" id="f-description" class="admin-input" value="${escapeHtml(data.description || '')}" placeholder="Ej: Prensado audiófilo 33 RPM" />
            </div>
        `,
        getPayload: () => ({
            name: document.getElementById('f-name').value.trim(),
            description: document.getElementById('f-description').value.trim() || null
        })
    },

    record_labels: {
        title: 'Discográficas y Sellos',
        endpoint: '/record-labels',
        columns: ['Ref.', 'Discográfica', 'País de Origen', 'Sitio Web'],
        renderRow: (l) => `
            <td class="font-mono">#${l.id}</td>
            <td class="font-bold">${escapeHtml(l.name)}</td>
            <td>${escapeHtml(l.country)}</td>
            <td>${l.website ? `<a href="${escapeHtml(l.website)}" target="_blank" rel="noopener">Web oficial</a>` : '—'}</td>
        `,
        getFields: (data = {}) => `
            <div class="form-field">
                <label for="f-name">Nombre de la Discográfica *</label>
                <input type="text" id="f-name" class="admin-input" value="${escapeHtml(data.name || '')}" placeholder="Ej: Sub Pop" required />
            </div>
            <div class="form-field">
                <label for="f-country">País *</label>
                <input type="text" id="f-country" class="admin-input" value="${escapeHtml(data.country || '')}" placeholder="Ej: United States" required />
            </div>
            <div class="form-field full-width">
                <label for="f-website">Sitio Web Oficial</label>
                <input type="url" id="f-website" class="admin-input" value="${escapeHtml(data.website || '')}" placeholder="https://www.subpop.com" />
            </div>
        `,
        getPayload: () => ({
            name: document.getElementById('f-name').value.trim(),
            country: document.getElementById('f-country').value.trim(),
            website: document.getElementById('f-website').value.trim() || null
        })
    },

    stock: {
        title: 'Control de Stock',
        endpoint: '/album-formats',
        columns: ['Álbum ID', 'Formato ID', 'Precio (€)', 'Unidades'],
        renderRow: (s) => `
            <td class="font-mono">#${s.album_id}</td>
            <td class="font-mono">#${s.format_id}</td>
            <td class="font-bold">${escapeHtml(s.price)} €</td>
            <td><span class="badge">${escapeHtml(s.stock)} uds.</span></td>
        `,
        getFields: (data = {}) => `
            <div class="form-field">
                <label for="f-album_id">ID del Álbum *</label>
                <input type="number" id="f-album_id" class="admin-input" value="${escapeHtml(data.album_id || '')}" placeholder="Ej: 1" ${data.album_id ? 'readonly' : 'required'} />
            </div>
            <div class="form-field">
                <label for="f-format_id">ID del Formato *</label>
                <input type="number" id="f-format_id" class="admin-input" value="${escapeHtml(data.format_id || '')}" placeholder="Ej: 1" ${data.format_id ? 'readonly' : 'required'} />
            </div>
            <div class="form-field">
                <label for="f-price">Precio (€) *</label>
                <input type="number" step="0.01" id="f-price" class="admin-input" value="${escapeHtml(data.price || '')}" placeholder="Ej: 24.90" required />
            </div>
            <div class="form-field">
                <label for="f-stock">Stock Disponible *</label>
                <input type="number" id="f-stock" class="admin-input" value="${escapeHtml(data.stock ?? 0)}" placeholder="Ej: 50" required />
            </div>
        `,
        getPayload: () => ({
            album_id: parseInt(document.getElementById('f-album_id').value, 10),
            format_id: parseInt(document.getElementById('f-format_id').value, 10),
            price: parseFloat(document.getElementById('f-price').value),
            stock: parseInt(document.getElementById('f-stock').value, 10)
        })
    }
};

// ==========================================================================
// ESTADO Y DOM
// ==========================================================================
let currentEntity = 'albums';
let currentAction = 'search';
let editingItem = null;

const entityTitleEl = document.getElementById('workspace-section-title');
const formEl = document.getElementById('admin-action-form');
const formGridEl = formEl ? formEl.querySelector('.form-grid') : null;
const executeBtn = formEl ? formEl.querySelector('.btn-execute') : null;
const statusIndicator = document.querySelector('.status-indicator');

function renderForm() {
    if (!formGridEl || !executeBtn) return;
    const config = ENTITIES[currentEntity];
    if (!config) return;

    if (entityTitleEl) entityTitleEl.textContent = config.title;

    let legendText = 'Criterios de Búsqueda';
    if (currentAction === 'create') legendText = `Nuevo Registro en ${config.title}`;
    if (currentAction === 'update') {
        const ref = currentEntity === 'stock'
            ? (editingItem ? `Stock: Álbum #${editingItem.album_id} / Formato #${editingItem.format_id}` : 'Stock')
            : `#${editingItem?.id || 'Sin seleccionar'}`;
        legendText = `Modificar Registro (${ref})`;
    }
    if (currentAction === 'delete') legendText = 'Confirmar Baja Definitiva';

    formGridEl.innerHTML = `<legend class="card-subtitle">${legendText}</legend>`;

    if (currentAction === 'search') {
        executeBtn.textContent = 'Buscar en Catálogo';
        executeBtn.className = 'btn-execute';
        formGridEl.insertAdjacentHTML('beforeend', `
            <div class="form-field full-width">
                <label for="search-id">Referencia / Código ID (opcional)</label>
                <input type="number" id="search-id" class="admin-input" placeholder="Ej: 1 (dejar vacío para ver todos)" />
            </div>
        `);
    } else if (currentAction === 'create') {
        executeBtn.textContent = 'Guardar Registro';
        executeBtn.className = 'btn-execute';
        formGridEl.insertAdjacentHTML('beforeend', config.getFields());
        initCoverPreview();
    } else if (currentAction === 'update') {
        if (!editingItem) {
            executeBtn.textContent = 'Cargar Datos para Editar';
            executeBtn.className = 'btn-execute';

            if (currentEntity === 'stock') {
                formGridEl.insertAdjacentHTML('beforeend', `
                    <div class="form-field full-width" style="background-color: var(--color-surface-soft); padding: 1rem; border-radius: var(--radius-sm); border-left: 4px solid var(--color-text-main);">
                        <p style="margin: 0 0 0.35rem 0; font-size: 0.85rem; font-weight: 600;">No has seleccionado ningún elemento de stock.</p>
                        <p style="margin: 0; font-size: 0.8rem; color: var(--color-text-muted);">Indica el ID del Álbum y del Formato o pulsa <strong>«Editar»</strong> en la tabla inferior.</p>
                    </div>
                    <div class="form-field">
                        <label for="manual-stock-album">ID del Álbum *</label>
                        <input type="number" id="manual-stock-album" class="admin-input" placeholder="Ej: 1" required />
                    </div>
                    <div class="form-field">
                        <label for="manual-stock-format">ID del Formato *</label>
                        <input type="number" id="manual-stock-format" class="admin-input" placeholder="Ej: 1" required />
                    </div>
                `);
            } else {
                formGridEl.insertAdjacentHTML('beforeend', `
                    <div class="form-field full-width" style="background-color: var(--color-surface-soft); padding: 1rem; border-radius: var(--radius-sm); border-left: 4px solid var(--color-text-main);">
                        <p style="margin: 0 0 0.35rem 0; font-size: 0.85rem; font-weight: 600;">No has seleccionado ningún registro.</p>
                        <p style="margin: 0; font-size: 0.8rem; color: var(--color-text-muted);">Introduce el ID a continuación o pulsa <strong>«Editar»</strong> en la fila correspondiente de la tabla inferior.</p>
                    </div>
                    <div class="form-field full-width">
                        <label for="manual-edit-id">ID o Referencia del registro a modificar *</label>
                        <input type="number" id="manual-edit-id" class="admin-input" placeholder="Ej: 1" required />
                    </div>
                `);
            }
        } else {
            executeBtn.textContent = 'Actualizar Registro';
            executeBtn.className = 'btn-execute';

            const itemName = editingItem.name || editingItem.title || (currentEntity === 'stock' ? `Álbum #${editingItem.album_id} / Formato #${editingItem.format_id}` : `#${editingItem.id}`);
            const refText = currentEntity === 'stock' ? `Stock Álbum #${editingItem.album_id} & Formato #${editingItem.format_id}` : `Ref. #${editingItem.id}`;

            formGridEl.insertAdjacentHTML('beforeend', `
                <div class="form-field full-width" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 0.75rem 1rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 0.85rem; color: #166534;">
                        <strong>Modificando:</strong> ${refText} — <em>${escapeHtml(itemName)}</em>
                    </div>
                    <button type="button" id="btn-cancel-edit" class="btn-inline-action" style="background: #ffffff;">Cancelar</button>
                </div>
            `);

            formGridEl.insertAdjacentHTML('beforeend', config.getFields(editingItem));
            initCoverPreview();

            document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
                editingItem = null;
                switchAction('search');
            });
        }
    } else if (currentAction === 'delete') {
        executeBtn.textContent = 'Confirmar Baja Definitiva';
        executeBtn.className = 'btn-execute btn-danger';
        formGridEl.insertAdjacentHTML('beforeend', `
            <div class="form-field full-width">
                <label for="delete-id">Referencia (ID) a dar de baja *</label>
                <input type="text" id="delete-id" class="admin-input" placeholder="Ej: 1" required />
            </div>
        `);
    }
}

async function loadItemToEdit(id, formatId = null) {
    const config = ENTITIES[currentEntity];
    if (!config) return;

    try {
        setStatus('loading', 'Cargando datos...');
        const url = formatId ? `${config.endpoint}/${id}/${formatId}` : `${config.endpoint}/${id}`;
        const response = await api.get(url);
        editingItem = response.data;
        setStatus('ok', 'Sistema conectado');
        renderForm();
    } catch (err) {
        console.error(err);
        setStatus('error', 'Registro no encontrado');
        showNotification(formatId ? `No se encontró stock para Álbum #${id} y Formato #${formatId}` : `No existe ningún registro con ID #${id}`, 'error');
    }
}

function initCoverPreview() {
    const coverInput = document.getElementById('f-cover-file');
    const previewBox = document.getElementById('cover-preview-box');
    if (coverInput && previewBox) {
        coverInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                previewBox.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Vista previa de portada" />`;
            }
        });
    }
}

function renderTable(data) {
    const tableHead = document.querySelector('.results-table thead');
    const tableBody = document.querySelector('.results-table tbody');
    const resultCount = document.querySelector('.result-count');
    const config = ENTITIES[currentEntity];

    if (!tableBody || !tableHead || !config) return;

    tableHead.innerHTML = `
        <tr>
            ${config.columns.map(col => `<th scope="col">${col}</th>`).join('')}
            <th scope="col" class="text-right">Acciones</th>
        </tr>
    `;

    const list = Array.isArray(data) ? data : (data ? [data] : []);
    if (resultCount) resultCount.textContent = `${list.length} registros encontrados`;

    if (list.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="${config.columns.length + 1}" class="table-empty-state">
                    No hay elementos registrados en esta sección.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = list.map(item => `
        <tr>
            ${config.renderRow(item)}
            <td class="text-right">
                <button type="button" class="btn-inline-action btn-edit" data-item='${JSON.stringify(item)}'>Editar</button>
                <button type="button" class="btn-inline-action btn-delete" data-id="${item.id || ''}" data-album="${item.album_id || ''}" data-format="${item.format_id || ''}">Baja</button>
            </td>
        </tr>
    `).join('');

    tableBody.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            editingItem = JSON.parse(btn.dataset.item);
            switchAction('update');
        });
    });

    tableBody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentEntity === 'stock') {
                const aId = btn.dataset.album;
                const fId = btn.dataset.format;
                if (confirm(`¿Dar de baja stock del Álbum #${aId} y Formato #${fId}?`)) {
                    deleteStock(aId, fId);
                }
            } else {
                const id = btn.dataset.id;
                if (confirm(`¿Dar de baja el registro #${id}?`)) {
                    deleteRecord(id);
                }
            }
        });
    });
}

async function fetchRecords(id = null) {
    const config = ENTITIES[currentEntity];
    if (!config) return;

    try {
        setStatus('loading', 'Consultando...');
        const url = id ? `${config.endpoint}/${id}` : `${config.endpoint}/`;
        const response = await api.get(url);
        renderTable(response.data);
        setStatus('ok', 'Sistema conectado');
    } catch (error) {
        console.error(error);
        renderTable([]);
        setStatus('error', 'Error al consultar');
        showNotification(id ? `No se encontró el registro #${id}` : 'Error al conectar con la API', 'error');
    }
}

async function createRecord(payload) {
    const config = ENTITIES[currentEntity];
    try {
        setStatus('loading', 'Guardando...');
        await api.post(`${config.endpoint}/`, payload);
        showNotification('Registro creado correctamente');
        if (currentEntity === 'record_labels' || currentEntity === 'artists' || currentEntity === 'genres') {
            await loadDropdownData();
        }
        switchAction('search');
        fetchRecords();
    } catch (error) {
        console.error(error);
        setStatus('error', 'Error al guardar');
        const detailMsg = error.response?.data?.detail;
        const msg = typeof detailMsg === 'string'
            ? detailMsg
            : (Array.isArray(detailMsg) ? detailMsg[0]?.msg : 'No se pudo crear el registro');
        showNotification(msg, 'error');
    }
}

async function updateRecord(payload) {
    const config = ENTITIES[currentEntity];
    try {
        setStatus('loading', 'Actualizando...');
        let url = '';
        if (currentEntity === 'stock') {
            url = `${config.endpoint}/${editingItem.album_id}/${editingItem.format_id}`;
        } else {
            url = `${config.endpoint}/${editingItem.id}`;
        }
        await api.put(url, payload);
        showNotification('Registro actualizado correctamente');
        editingItem = null;
        if (currentEntity === 'record_labels' || currentEntity === 'artists' || currentEntity === 'genres') {
            await loadDropdownData();
        }
        switchAction('search');
        fetchRecords();
    } catch (error) {
        console.error(error);
        setStatus('error', 'Error al actualizar');
        const detailMsg = error.response?.data?.detail;
        const msg = typeof detailMsg === 'string'
            ? detailMsg
            : (Array.isArray(detailMsg) ? detailMsg[0]?.msg : 'No se pudo actualizar el registro');
        showNotification(msg, 'error');
    }
}

async function deleteRecord(id) {
    const config = ENTITIES[currentEntity];
    try {
        setStatus('loading', 'Eliminando...');
        await api.delete(`${config.endpoint}/${id}`);
        showNotification(`Registro #${id} eliminado`);
        if (currentEntity === 'record_labels' || currentEntity === 'artists' || currentEntity === 'genres') {
            await loadDropdownData();
        }
        if (currentAction === 'delete') switchAction('search');
        fetchRecords();
    } catch (error) {
        console.error(error);
        setStatus('error', 'Error al eliminar');
        showNotification(`No se pudo eliminar el registro #${id}`, 'error');
    }
}

async function deleteStock(albumId, formatId) {
    try {
        setStatus('loading', 'Eliminando...');
        await api.delete(`/album-formats/${albumId}/${formatId}`);
        showNotification('Stock eliminado');
        fetchRecords();
    } catch (error) {
        console.error(error);
        setStatus('error', 'Error al eliminar');
        showNotification('No se pudo eliminar el stock', 'error');
    }
}

function setStatus(type, text) {
    if (!statusIndicator) return;
    statusIndicator.textContent = text;
    statusIndicator.className = `status-indicator status-${type}`;
}

function switchAction(actionKey) {
    currentAction = actionKey;
    const tabs = document.querySelectorAll('.action-tab');
    tabs.forEach(tab => {
        const isCurrent = tab.dataset.action === actionKey;
        tab.classList.toggle('active', isCurrent);
        tab.setAttribute('aria-selected', isCurrent);
    });
    renderForm();
}

if (formEl) {
    formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const config = ENTITIES[currentEntity];
        if (!config) return;

        if (currentAction === 'search') {
            const searchId = document.getElementById('search-id')?.value.trim();
            fetchRecords(searchId || null);
        } else if (currentAction === 'create') {
            createRecord(config.getPayload());
        } else if (currentAction === 'update') {
            if (!editingItem) {
                if (currentEntity === 'stock') {
                    const aId = document.getElementById('manual-stock-album')?.value.trim();
                    const fId = document.getElementById('manual-stock-format')?.value.trim();
                    if (aId && fId) loadItemToEdit(aId, fId);
                } else {
                    const manualId = document.getElementById('manual-edit-id')?.value.trim();
                    if (manualId) loadItemToEdit(manualId);
                }
            } else {
                updateRecord(config.getPayload());
            }
        } else if (currentAction === 'delete') {
            const deleteId = document.getElementById('delete-id')?.value.trim();
            if (deleteId) deleteRecord(deleteId);
        }
    });
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadDropdownData();

    const tabs = document.querySelectorAll('.action-tab');
    const actionKeys = ['search', 'create', 'update', 'delete'];
    tabs.forEach((tab, index) => {
        tab.dataset.action = actionKeys[index];
        tab.addEventListener('click', () => {
            if (currentAction === 'update' && actionKeys[index] !== 'update') {
                editingItem = null;
            }
            switchAction(actionKeys[index]);
        });
    });

    const entityButtons = document.querySelectorAll('.entity-btn');
    entityButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const entity = btn.dataset.entity;
            if (!ENTITIES[entity]) return;

            entityButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentEntity = entity;
            editingItem = null;

            if (currentEntity === 'albums') {
                await loadDropdownData();
            }

            switchAction('search');
            fetchRecords();
        });
    });

    currentEntity = 'albums';
    switchAction('search');
    fetchRecords();
});