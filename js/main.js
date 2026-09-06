(function () {
  "use strict";

  // Year in footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  var navToggle = document.getElementById("nav-toggle");
  var channelNav = document.getElementById("channel-nav");
  if (navToggle && channelNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = channelNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    channelNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        channelNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Contact form submission (Formspree-compatible AJAX)
  var form = document.getElementById("contact-form");
  var note = document.getElementById("form-note");
  if (form && note) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      note.textContent = "Envoi en cours…";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (response.ok) {
            note.textContent = "Message envoyé, merci ! Nous revenons vers vous rapidement.";
            form.reset();
          } else {
            note.textContent = "Une erreur est survenue. Merci de réessayer ou d'écrire directement par email.";
          }
        })
        .catch(function () {
          note.textContent = "Une erreur est survenue. Merci de réessayer ou d'écrire directement par email.";
        });
    });
  }
})();
