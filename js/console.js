(function () {
  "use strict";

  var panel = document.querySelector(".mini-console");
  var header = document.getElementById("mc-header");
  var targets = Array.prototype.slice.call(document.querySelectorAll(".console-target"));
  if (!panel || !targets.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = {
    intensity: 70,
    r: 226,
    g: 129,
    b: 44,
    speed: 50,
    effect: "none", // "none" | "strobe" | "breathe" | "fade"
  };

  // Durée d'un cycle complet (secondes) aux extrêmes de vitesse [lent, rapide],
  // par effet — le strobe reste borné assez lent pour rester sous le seuil
  // général de flash (3/s) même à vitesse maximale.
  var FX_DURATION_RANGE = {
    // Le strobe reste plafonné à 0.4s (~2.5 flashs/s) même à vitesse
    // maximale, pour rester sous le seuil général de flash (3/s) —
    // breathe et fade sont des fondus doux, sans risque équivalent,
    // donc leur borne rapide peut monter beaucoup plus haut.
    strobe: [1.6, 0.4],
    breathe: [6, 0.5],
    fade: [8, 0.6],
  };

  function currentColor() {
    return "rgb(" + state.r + ", " + state.g + ", " + state.b + ")";
  }

  function fxDuration() {
    var range = FX_DURATION_RANGE[state.effect];
    if (!range) return null;
    var t = state.speed / 100;
    return (range[0] + (range[1] - range[0]) * t).toFixed(2) + "s";
  }

  function apply() {
    var glow = state.intensity / 100;
    var color = currentColor();
    var duration = fxDuration();
    var effectActive = state.effect !== "none" && !reduceMotion;

    targets.forEach(function (target) {
      target.style.setProperty("--console-color", color);
      target.style.setProperty("--console-glow-base", glow.toFixed(3));
      target.style.setProperty("--console-fx-duration", duration || "");
      target.classList.toggle("is-strobing", effectActive && state.effect === "strobe");
      target.classList.toggle("is-fx-breathe", effectActive && state.effect === "breathe");
      target.classList.toggle("is-fx-fade", effectActive && state.effect === "fade");
    });
  }

  // ---- Fader générique : gère drag pointeur, clavier, et rendu visuel ----
  function makeFader(el, track, cap, valueEl, opts) {
    var value = opts.initial;

    function render() {
      var ratio = (value - opts.min) / (opts.max - opts.min);
      cap.style.setProperty("--mc-value", ratio.toFixed(3));
      if (valueEl) valueEl.textContent = String(Math.round(value)).padStart(opts.pad || 3, "0");
      el.setAttribute("aria-valuenow", String(Math.round(value)));
    }

    function set(v) {
      value = Math.min(opts.max, Math.max(opts.min, v));
      render();
      opts.onChange(value);
    }

    function fromClientPos(clientX, clientY) {
      var rect = track.getBoundingClientRect();
      var isRow = rect.width > rect.height;
      var ratio = isRow ? (clientX - rect.left) / rect.width : 1 - (clientY - rect.top) / rect.height;
      ratio = Math.max(0, Math.min(1, ratio));
      set(opts.min + ratio * (opts.max - opts.min));
    }

    var dragging = false;
    el.addEventListener("pointerdown", function (e) {
      dragging = true;
      el.setPointerCapture(e.pointerId);
      fromClientPos(e.clientX, e.clientY);
    });
    el.addEventListener("pointermove", function (e) {
      if (dragging) fromClientPos(e.clientX, e.clientY);
    });
    el.addEventListener("pointerup", function () { dragging = false; });
    el.addEventListener("pointercancel", function () { dragging = false; });

    el.addEventListener("keydown", function (e) {
      var step = opts.step || Math.max(1, (opts.max - opts.min) / 20);
      if (e.key === "ArrowUp" || e.key === "ArrowRight") { set(value + step); e.preventDefault(); }
      else if (e.key === "ArrowDown" || e.key === "ArrowLeft") { set(value - step); e.preventDefault(); }
      else if (e.key === "Home") { set(opts.min); e.preventDefault(); }
      else if (e.key === "End") { set(opts.max); e.preventDefault(); }
    });

    render();
  }

  function wireFader(prefix, min, max, initial, pad, onChange) {
    var el = document.getElementById(prefix);
    var track = document.getElementById(prefix.replace("mc-fader", "mc-track"));
    var cap = document.getElementById(prefix.replace("mc-fader", "mc-cap"));
    var valueEl = document.getElementById(prefix.replace("mc-fader", "mc-value"));
    if (!el || !track || !cap) return;
    makeFader(el, track, cap, valueEl, { min: min, max: max, initial: initial, pad: pad, onChange: onChange });
  }

  wireFader("mc-fader", 0, 100, state.intensity, 3, function (v) { state.intensity = v; apply(); });
  wireFader("mc-fader-r", 0, 255, state.r, 3, function (v) { state.r = Math.round(v); apply(); });
  wireFader("mc-fader-g", 0, 255, state.g, 3, function (v) { state.g = Math.round(v); apply(); });
  wireFader("mc-fader-b", 0, 255, state.b, 3, function (v) { state.b = Math.round(v); apply(); });
  wireFader("mc-fader-speed", 0, 100, state.speed, 3, function (v) { state.speed = Math.round(v); apply(); });

  var effectButtons = Array.prototype.slice.call(document.querySelectorAll(".mc-effect-btn"));
  if (reduceMotion) {
    effectButtons.forEach(function (btn) { btn.setAttribute("disabled", "true"); });
  } else {
    effectButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var chosen = btn.dataset.effect;
        state.effect = state.effect === chosen ? "none" : chosen;
        effectButtons.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b.dataset.effect === state.effect));
        });
        apply();
      });
    });
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
