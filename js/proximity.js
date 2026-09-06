(function () {
  "use strict";

  var els = Array.prototype.slice.call(document.querySelectorAll(".proximity"));
  if (!els.length) return;

  function setProximity(el, value) {
    el.style.setProperty("--proximity", value.toFixed(3));
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    els.forEach(function (el) { setProximity(el, 0); });
    return;
  }

  var RADIUS = 110;
  var rects = [];

  function measure() {
    rects = els.map(function (el) { return el.getBoundingClientRect(); });
  }
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("scroll", measure, { passive: true });

  var ticking = false;

  function updateFromPoint(x, y) {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      els.forEach(function (el, i) {
        var r = rects[i];
        if (!r) return;
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dist = Math.hypot(x - cx, y - cy);
        setProximity(el, Math.max(0, 1 - dist / RADIUS));
      });
      ticking = false;
    });
  }

  function clearAll() {
    els.forEach(function (el) { setProximity(el, 0); });
  }

  document.addEventListener("mousemove", function (e) {
    updateFromPoint(e.clientX, e.clientY);
  }, { passive: true });
  document.addEventListener("mouseleave", clearAll);

  document.addEventListener("touchmove", function (e) {
    var t = e.touches[0];
    if (t) updateFromPoint(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener("touchend", clearAll);
  document.addEventListener("touchcancel", clearAll);

  // Sur les appareils sans pointeur fin (tactile), pas de survol passif :
  // une micro-respiration très discrète évite que la page paraisse figée.
  var hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  if (!hasFinePointer) {
    els.forEach(function (el) {
      el.style.setProperty("animation-delay", (Math.random() * 3).toFixed(2) + "s");
      el.classList.add("is-breathing");
    });
  }
})();
