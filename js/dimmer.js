(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return; // Sections restent empilées, à intensité maximale, sans script.

  var stage = document.getElementById("stage");
  var stageView = document.getElementById("stage-view");
  if (!stage || !stageView) return;

  var channels = Array.prototype.slice.call(stage.querySelectorAll(".channel"));
  if (!channels.length) return;

  stage.style.setProperty("--n-channels", String(channels.length));

  var faderEls = Array.prototype.slice.call(document.querySelectorAll("[data-fader]"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));

  var desktopMQ = window.matchMedia("(min-width: 861px)");
  var pinned = false;
  var ticking = false;

  // Fondu-enchaîné : chaque canal a un plateau à pleine intensité, puis une
  // transition partagée avec son voisin (jamais deux canaux pleinement
  // visibles en même temps, jamais de saut brutal).
  var PLATEAU_EDGE = 0.3; // demi-largeur du plateau (unité = 1 canal)
  var FADE_START = 0.5; // intensité nulle atteinte à la moitié de l'écart entre deux canaux

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function intensityFor(distance) {
    if (distance <= PLATEAU_EDGE) return 1;
    if (distance >= FADE_START) return 0;
    var t = (distance - PLATEAU_EDGE) / (FADE_START - PLATEAU_EDGE);
    return 1 - smoothstep(t);
  }

  function applyIntensity(channel, value) {
    channel.style.setProperty("--intensity", value.toFixed(3));
    channel.style.zIndex = String(Math.round(value * 100));
    var interactive = value > 0.12;
    channel.style.pointerEvents = interactive ? "" : "none";
    if ("inert" in channel) channel.inert = !interactive;
    channel.setAttribute("aria-hidden", interactive ? "false" : "true");
    var readout = channel.querySelector(".intensity-value");
    if (readout) readout.textContent = String(Math.round(value * 100));
  }

  function resetChannel(channel) {
    channel.style.removeProperty("--intensity");
    channel.style.removeProperty("z-index");
    channel.style.removeProperty("pointer-events");
    if ("inert" in channel) channel.inert = false;
    channel.removeAttribute("aria-hidden");
    var readout = channel.querySelector(".intensity-value");
    if (readout) readout.textContent = "100";
  }

  function updateFaderUI(values) {
    var maxIndex = 0;
    for (var i = 1; i < values.length; i++) {
      if (values[i] > values[maxIndex]) maxIndex = i;
    }
    faderEls.forEach(function (el) {
      var i = parseInt(el.dataset.fader, 10) - 1;
      var v = values[i] != null ? values[i] : 0;
      el.style.setProperty("--fader-value", v.toFixed(3));
      var host = el.closest(".fader") || el;
      host.classList.toggle("is-hot", i === maxIndex);
    });
    navLinks.forEach(function (el) {
      var i = parseInt(el.dataset.nav, 10) - 1;
      el.classList.toggle("is-active", i === maxIndex);
    });
  }

  function computePinned() {
    var n = channels.length;
    var rect = stage.getBoundingClientRect();
    var stageTop = rect.top + window.scrollY;
    var scrollable = stage.offsetHeight - window.innerHeight;
    var progress = scrollable > 0
      ? Math.min(1, Math.max(0, (window.scrollY - stageTop) / scrollable))
      : 0;
    var idx = progress * (n - 1);

    var values = channels.map(function (channel, i) {
      var v = intensityFor(Math.abs(idx - i));
      applyIntensity(channel, v);
      return v;
    });
    updateFaderUI(values);
  }

  function computeFlow() {
    // Repli (mobile) : la mise en page reste normale, le rail reflète
    // simplement la part de chaque canal visible à l'écran.
    var vh = window.innerHeight;
    var values = channels.map(function (channel) {
      var r = channel.getBoundingClientRect();
      var visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      var span = Math.min(r.height, vh) || 1;
      return Math.max(0, Math.min(1, visible / span));
    });
    updateFaderUI(values);
  }

  function onFrame() {
    ticking = false;
    if (pinned) computePinned();
    else computeFlow();
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onFrame);
  }

  function applyMode() {
    var shouldPin = desktopMQ.matches;
    if (shouldPin !== pinned) {
      pinned = shouldPin;
      stage.classList.toggle("is-dimmer", pinned);
      if (!pinned) channels.forEach(resetChannel);
    }
    requestUpdate();
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", applyMode);
  if (desktopMQ.addEventListener) desktopMQ.addEventListener("change", applyMode);

  applyMode();
})();
