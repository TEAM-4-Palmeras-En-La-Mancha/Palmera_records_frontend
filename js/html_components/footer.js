export function renderFooter() {
  return `
    <footer id="main-footer">
      <div class="container footer-container">
        <article class="footer-brand">
          <span class="footer-logo">Palmeras Records</span>
          <p class="footer-tagline">
            Tienda física y distribuidora independiente de vinilos, casetes y ediciones físicas de archivo.
          </p>
        </article>

        <article class="footer-direct-info">
          <span class="info-badge">Tienda física</span>
          <span class="info-text">Mar — Sáb: 11:00 a 20:30h</span>
          <a href="mailto:hola@palmerasrecords.es" class="info-link">hola@palmerasrecords.es</a>
        </article>
      </div>

      <div class="container footer-bottom">
        <p class="footer-copy">&copy; 2026 Palmeras Records. Todos los derechos reservados.</p>
      </div>
    </footer>
  `;
}