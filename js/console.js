(function () {
  "use strict";

  var panel = document.querySelector(".mini-console");
  var header = document.getElementById("mc-header");
  var fader = document.getElementById("mc-fader");
  var track = document.getElementById("mc-track");
  var cap = document.getElementById("mc-cap");
  var valueEl = document.getElementById("mc-value");
  var swatches = document.getElementById("mc-swatches");
  var strobeBtn = document.getElementById("mc-strobe");
  var targets = Array.prototype.slice.call(document.querySelectorAll(".console-target"));
  if (!fader || !track || !targets.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = {
    intensity: 70,
    color: "#e2812c",
    strobe: false,
  };

  function apply() {
    var glow = state.intensity / 100;
    targets.forEach(function (target) {
      target.style.setProperty("--console-color", state.color);
      target.style.setProperty("--console-glow-base", glow.toFixed(3));
      target.classList.toggle("is-strobing", state.strobe && !reduceMotion);
    });

    cap.style.setProperty("--mc-value", (state.intensity / 100).toFixed(3));
    valueEl.textContent = String(state.intensity).padStart(3, "0");
    fader.setAttribute("aria-valuenow", String(state.intensity));
  }

  function setIntensityFromClientPos(clientX, clientY) {
    var rect = track.getBoundingClientRect();
    var isRow = rect.width > rect.height;
    var ratio;
    if (isRow) {
      ratio = (clientX - rect.left) / rect.width;
    } else {
      ratio = 1 - (clientY - rect.top) / rect.height;
    }
    ratio = Math.max(0, Math.min(1, ratio));
    state.intensity = Math.round(ratio * 100);
    apply();
  }

  var dragging = false;
  fader.addEventListener("pointerdown", function (e) {
    dragging = true;
    fader.setPointerCapture(e.pointerId);
    setIntensityFromClientPos(e.clientX, e.clientY);
  });
  fader.addEventListener("pointermove", function (e) {
    if (dragging) setIntensityFromClientPos(e.clientX, e.clientY);
  });
  fader.addEventListener("pointerup", function () { dragging = false; });
  fader.addEventListener("pointercancel", function () { dragging = false; });

  fader.addEventListener("keydown", function (e) {
    var step = 5;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      state.intensity = Math.min(100, state.intensity + step);
      apply();
      e.preventDefault();
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      state.intensity = Math.max(0, state.intensity - step);
      apply();
      e.preventDefault();
    } else if (e.key === "Home") {
      state.intensity = 0; apply(); e.preventDefault();
    } else if (e.key === "End") {
      state.intensity = 100; apply(); e.preventDefault();
    }
  });

  if (swatches) {
    swatches.querySelectorAll(".mc-swatch").forEach(function (btn) {
      btn.style.setProperty("--swatch-color", btn.dataset.color);
      btn.addEventListener("click", function () {
        state.color = btn.dataset.color;
        swatches.querySelectorAll(".mc-swatch").forEach(function (b) {
          var active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", String(active));
        });
        apply();
      });
    });
  }

  if (strobeBtn) {
    if (reduceMotion) {
      strobeBtn.setAttribute("disabled", "true");
      strobeBtn.textContent = "STROBE — INDISPONIBLE";
    } else {
      strobeBtn.addEventListener("click", function () {
        state.strobe = !state.strobe;
        strobeBtn.setAttribute("aria-pressed", String(state.strobe));
        strobeBtn.textContent = "STROBE — " + (state.strobe ? "ON" : "OFF");
        apply();
      });
    }
  }

  if (panel && header) {
    var drag = null;

    function clampAndPlace(left, top) {
      var rect = panel.getBoundingClientRect();
      var maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
      var maxTop = Math.max(64, window.innerHeight - rect.height - 8);
      panel.style.left = Math.min(Math.max(8, left), maxLeft) + "px";
      panel.style.top = Math.min(Math.max(64, top), maxTop) + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    }

    header.addEventListener("pointerdown", function (e) {
      var rect = panel.getBoundingClientRect();
      drag = {
        pointerId: e.pointerId,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };
      header.setPointerCapture(e.pointerId);
    });
    header.addEventListener("pointermove", function (e) {
      if (!drag || drag.pointerId !== e.pointerId) return;
      clampAndPlace(e.clientX - drag.offsetX, e.clientY - drag.offsetY);
    });
    header.addEventListener("pointerup", function () { drag = null; });
    header.addEventListener("pointercancel", function () { drag = null; });

    window.addEventListener("resize", function () {
      if (panel.style.left) clampAndPlace(parseFloat(panel.style.left), parseFloat(panel.style.top));
    });
  }

  apply();
})();
