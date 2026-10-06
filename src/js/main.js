import "./html_components/header.js";
import "./html_components/footer.js";
import { initCatalog } from "./catalog.js";
import { initArtists } from "./artists.js";

document.addEventListener("DOMContentLoaded", () => {
    initCatalog();
    initArtists();
});
