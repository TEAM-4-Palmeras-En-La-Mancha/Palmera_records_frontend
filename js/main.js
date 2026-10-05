import { renderFooter } from "./components/footer.js";

function mountFooter() {
  const slot = document.getElementById("footer-slot");
  if (slot) slot.innerHTML = renderFooter();
}

document.addEventListener("DOMContentLoaded", mountFooter);