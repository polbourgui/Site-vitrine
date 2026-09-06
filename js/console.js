(function () {
  "use strict";

  var fader = document.getElementById("mc-fader");
  var track = document.getElementById("mc-track");
  var cap = document.getElementById("mc-cap");
  var valueEl = document.getElementById("mc-value");
  var swatches = document.getElementById("mc-swatches");
  var strobeBtn = document.getElementById("mc-strobe");
  var target = document.getElementById("console-target");
  if (!fader || !track || !target) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = {
    intensity: 70,
    color: "#e2812c",
    strobe: false,
  };

  function apply() {
    var brightness = 0.55 + (state.intensity / 100) * 0.9;
    target.style.setProperty("--console-color", state.color);
    target.style.setProperty("--console-brightness", brightness.toFixed(2));
    target.classList.toggle("is-strobing", state.strobe && !reduceMotion);

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

  apply();
})();
