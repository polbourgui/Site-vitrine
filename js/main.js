(function () {
  "use strict";

  // Year in footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Parallax light beams
  var beams = document.querySelectorAll(".light-rig .beam");
  if (beams.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var travel = window.innerHeight * 1.6;
    window.addEventListener("resize", function () {
      travel = window.innerHeight * 1.6;
    });

    var ticking = false;
    var updateBeams = function () {
      var y = window.scrollY || window.pageYOffset;
      beams.forEach(function (beam) {
        var speed = parseFloat(beam.dataset.speed) || 0.2;
        var rotate = parseFloat(beam.dataset.rotate) || 0;
        var offset = travel ? (y * speed) % travel : y * speed;
        beam.style.transform = "translate3d(0, " + (-offset).toFixed(1) + "px, 0) rotate(" + rotate + "deg)";
      });
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(updateBeams);
          ticking = true;
        }
      },
      { passive: true }
    );
    updateBeams();
  }

  // Reveal on scroll
  var revealTargets = document.querySelectorAll(
    ".card, .sector, .portfolio-placeholder, .about-text, .contact-inner > *"
  );
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach(function (el) { observer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
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
