// Punto único de configuración de la API.
// El frontend no tiene bundler, así que el conmutador se resuelve en tiempo de
// ejecución a partir del hostname: en local (Live Server / file://) hablamos con
// el backend de desarrollo, en GitHub Pages hablamos con el backend de Render.
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '']);

export const API_URL =
  LOCAL_HOSTS.has(location.hostname) || location.protocol === 'file:'
    ? 'http://127.0.0.1:8000'
    : 'https://palmera-records-backend.onrender.com';

export default API_URL;
