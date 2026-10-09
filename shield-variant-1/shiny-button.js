/* Wraps .btn elements with the markup shiny-button.css expects. */
(function () {
  "use strict";

  function shinify(el) {
    const label = document.createElement("span");
    label.className = "shiny-btn-label";
    label.innerHTML = el.innerHTML;
    el.innerHTML = "";
    el.classList.add("shiny-btn");
    el.appendChild(label);
  }

  function initShinyButtons(selector) {
    document.querySelectorAll(selector || ".btn").forEach(shinify);
  }

  window.ShinyButton = { shinify, initShinyButtons };
})();
