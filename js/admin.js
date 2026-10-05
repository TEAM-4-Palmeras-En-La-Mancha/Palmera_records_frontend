// ==========================================================================
// CLIENTE AXIOS Y NOTIFICACIONES
// ==========================================================================
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
});

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
// CONFIGURACIÓN DE LAS 6 ENTIDADES
// ==========================================================================
const ENTITIES = {
    albums: {
        title: 'Gestión de Álbumes',
        endpoint: '/albums',
        columns: ['Ref.', 'Título', 'Año', 'Género', 'Sello (ID)'],
        renderRow: (a) => `
            <td class="font-mono">#${a.id}</td>
            <td class="font-bold">${escapeHtml(a.title)}</td>
            <td>${escapeHtml(a.release_year)}</td>
            <td><span class="badge">${escapeHtml(a.genre)}</span></td>
            <td class="font-mono">#${escapeHtml(a.label_id)}</td>
        `,
        getFields: (data = {}) => `
            <div class="form-field">
                <label for="f-title">Título del Álbum *</label>
                <input type="text" id="f-title" class="admin-input" value="${escapeHtml(data.title || '')}" placeholder="Ej: Skinty Fia" required />
            </div>
            <div class="form-field">
                <label for="f-release_year">Año de Lanzamiento *</label>
                <input type="number" id="f-release_year" class="admin-input" value="${escapeHtml(data.release_year || '')}" placeholder="Ej: 2022" required />
            </div>
            <div class="form-field">
                <label for="f-genre">Género Musical *</label>
                <select id="f-genre" class="admin-select" required>
                    <option value="rock" ${data.genre === 'rock' ? 'selected' : ''}>Rock</option>
                    <option value="pop" ${data.genre === 'pop' ? 'selected' : ''}>Pop</option>
                    <option value="jazz" ${data.genre === 'jazz' ? 'selected' : ''}>Jazz</option>
                </select>
            </div>
            <div class="form-field">
                <label for="f-label_id">ID de Discográfica *</label>
                <input type="number" id="f-label_id" class="admin-input" value="${escapeHtml(data.label_id || '')}" placeholder="Ej: 1" required />
            </div>
            <div class="form-field full-width">
                <label for="f-cover-file">Portada del Disco</label>
                <div class="file-upload-zone">
                    <div class="cover-preview-box" id="cover-preview-box">
                        ${data.cover_image_url
                            ? `<img src="${escapeHtml(data.cover_image_url)}" alt="Portada actual" />`
                            : '<span>Sin carátula</span>'}
                    </div>
                    <input type="file" id="f-cover-file" class="admin-input" accept="image/*" />
                </div>
            </div>
        `,
        getPayload: () => {
            const fileInput = document.getElementById('f-cover-file');
            return {
                title: document.getElementById('f-title').value.trim(),
                release_year: parseInt(document.getElementById('f-release_year').value, 10),
                genre: document.getElementById('f-genre').value,
                label_id: parseInt(document.getElementById('f-label_id').value, 10),
                cover_image_url: fileInput?.files?.[0] ? fileInput.files[0].name : (editingItem?.cover_image_url || null)
            };
        }
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
            ? `Álbum #${editingItem?.album_id} / Formato #${editingItem?.format_id}`
            : `#${editingItem?.id || ''}`;
        legendText = `Modificar Registro ${ref}`;
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
    } else if (currentAction === 'update') {
        executeBtn.textContent = 'Actualizar Registro';
        executeBtn.className = 'btn-execute';
        formGridEl.insertAdjacentHTML('beforeend', config.getFields(editingItem || {}));
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

    // Activar vista previa al elegir archivo de imagen
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
        switchAction('search');
        fetchRecords();
    } catch (error) {
        console.error(error);
        setStatus('error', 'Error al guardar');
        showNotification('No se pudo crear el registro', 'error');
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
        switchAction('search');
        fetchRecords();
    } catch (error) {
        console.error(error);
        setStatus('error', 'Error al actualizar');
        showNotification('No se pudo actualizar el registro', 'error');
    }
}

async function deleteRecord(id) {
    const config = ENTITIES[currentEntity];
    try {
        setStatus('loading', 'Eliminando...');
        await api.delete(`${config.endpoint}/${id}`);
        showNotification(`Registro #${id} eliminado`);
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
            updateRecord(config.getPayload());
        } else if (currentAction === 'delete') {
            const deleteId = document.getElementById('delete-id')?.value.trim();
            if (deleteId) deleteRecord(deleteId);
        }
    });
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
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
        btn.addEventListener('click', () => {
            const entity = btn.dataset.entity;
            if (!ENTITIES[entity]) return;

            entityButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentEntity = entity;
            editingItem = null;
            switchAction('search');
            fetchRecords();
        });
    });

    currentEntity = 'albums';
    switchAction('search');
    fetchRecords();
});