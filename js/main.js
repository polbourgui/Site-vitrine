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

  // Grain : variante à seed animé (SMIL), seulement si le mouvement est
  // autorisé — la CSS pose déjà un motif statique par défaut.
  var grain = document.querySelector(".grain-overlay");
  if (grain && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    grain.style.backgroundImage =
      'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIj4gIDxmaWx0ZXIgaWQ9Im4iPiAgICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44NSIgbnVtT2N0YXZlcz0iMiIgc3RpdGNoVGlsZXM9InN0aXRjaCIgc2VlZD0iMiIgcmVzdWx0PSJ0Ij4gICAgICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzZWVkIiB2YWx1ZXM9IjI7NDc7MTM7ODk7MzE7NjQ7NTs3MiIgZHVyPSIxcyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIGNhbGNNb2RlPSJkaXNjcmV0ZSIvPiAgICA8L2ZlVHVyYnVsZW5jZT4gICAgPGZlQ29sb3JNYXRyaXggaW49InQiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDEgIDAgMCAwIDAgMSAgMCAwIDAgMCAxICAwIDAgMCAwLjkgMCIvPiAgPC9maWx0ZXI+ICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbikiLz48L3N2Zz4=")';
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
