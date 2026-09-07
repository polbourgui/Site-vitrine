(function () {
  "use strict";

  var panel = document.querySelector(".mini-console");
  var header = document.getElementById("mc-header");
  var haloContainers = Array.prototype.slice.call(document.querySelectorAll("[data-channel-halos]"));
  if (!panel || !haloContainers.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Durées (secondes) par effet, aux extrêmes de vitesse [lent, rapide] ----
  var FX_DURATION_RANGE = {
    // Le strobe reste plafonné à 0.4s (~2.5 flashs/s) même à vitesse
    // maximale, pour rester sous le seuil général de flash (3/s) —
    // breathe et fade sont des fondus doux, sans risque équivalent,
    // donc leur borne rapide peut monter beaucoup plus haut.
    strobe: [1.6, 0.4],
    breathe: [6, 0.5],
    fade: [8, 0.6],
  };
  // Durée (ms) d'un segment de trajet programmé, aux extrêmes de vitesse.
  var PATH_SEGMENT_RANGE = [4000, 600];

  var DEFAULT_COLORS = [
    { r: 226, g: 129, b: 44 }, // ambre
    { r: 91, g: 126, b: 166 }, // CTB bleu froid
    { r: 122, g: 143, b: 92 }, // vert scène
    { r: 138, g: 79, b: 138 }, // magenta
    { r: 192, g: 57, b: 43 },  // rouge
  ];

  // ---- Modèle de données : une console peut piloter plusieurs halos ----
  var nextFixtureId = 1;
  function createFixture(overrides) {
    var palette = DEFAULT_COLORS[(nextFixtureId - 1) % DEFAULT_COLORS.length];
    return Object.assign(
      {
        id: nextFixtureId++,
        r: palette.r,
        g: palette.g,
        b: palette.b,
        intensity: 70,
        speed: 50,
        effect: "none", // "none" | "strobe" | "breathe" | "fade"
        pan: 50,
        tilt: 42,
        path: [], // [{pan, tilt, r, g, b}]
        playing: false,
        _pathStart: null,
      },
      overrides || {}
    );
  }

  var fixtures = [createFixture({})];
  var activeFixtureId = fixtures[0].id;

  function getActiveFixture() {
    for (var i = 0; i < fixtures.length; i++) {
      if (fixtures[i].id === activeFixtureId) return fixtures[i];
    }
    return fixtures[0];
  }

  function fxDuration(fx) {
    var range = FX_DURATION_RANGE[fx.effect];
    if (!range) return null;
    var t = fx.speed / 100;
    return (range[0] + (range[1] - range[0]) * t).toFixed(2) + "s";
  }

  function pathSegmentMs(fx) {
    var t = fx.speed / 100;
    return PATH_SEGMENT_RANGE[0] + (PATH_SEGMENT_RANGE[1] - PATH_SEGMENT_RANGE[0]) * t;
  }

  // ---- Rendu DOM : un .channel-halo par fixture, dans chaque canal ----
  function ensureHaloElements() {
    haloContainers.forEach(function (container) {
      fixtures.forEach(function (fx) {
        if (!container.querySelector('.channel-halo[data-fixture-id="' + fx.id + '"]')) {
          var el = document.createElement("div");
          el.className = "channel-halo console-target";
          el.dataset.fixtureId = String(fx.id);
          container.appendChild(el);
        }
      });
      Array.prototype.slice.call(container.querySelectorAll(".channel-halo")).forEach(function (el) {
        var id = Number(el.dataset.fixtureId);
        if (!fixtures.some(function (f) { return f.id === id; })) el.remove();
      });
    });
  }

  function applyPosition(fx) {
    var haloEls = document.querySelectorAll('.channel-halo[data-fixture-id="' + fx.id + '"]');
    haloEls.forEach(function (el) {
      el.style.setProperty("--halo-x", fx.pan.toFixed(1) + "%");
      el.style.setProperty("--halo-y", fx.tilt.toFixed(1) + "%");
    });
  }

  function applyFixture(fx) {
    var glow = fx.intensity / 100;
    var color = "rgb(" + fx.r + ", " + fx.g + ", " + fx.b + ")";
    var duration = fxDuration(fx);
    var effectActive = fx.effect !== "none" && !reduceMotion;

    var haloEls = document.querySelectorAll('.channel-halo[data-fixture-id="' + fx.id + '"]');
    var dotEls = fx.id === fixtures[0].id ? document.querySelectorAll(".channel-dot.console-target") : [];

    [].concat(Array.prototype.slice.call(haloEls), Array.prototype.slice.call(dotEls)).forEach(function (el) {
      el.style.setProperty("--console-color", color);
      el.style.setProperty("--console-glow-base", glow.toFixed(3));
      el.style.setProperty("--console-fx-duration", duration || "");
      el.classList.toggle("is-strobing", effectActive && fx.effect === "strobe");
      el.classList.toggle("is-fx-breathe", effectActive && fx.effect === "breathe");
      el.classList.toggle("is-fx-fade", effectActive && fx.effect === "fade");
    });
    applyPosition(fx);
  }

  // ---- Fader générique : gère drag pointeur, clavier, et rendu visuel ----
  function makeFader(el, track, cap, valueEl, opts) {
    var value = opts.initial;

    function renderVisual(v) {
      value = v;
      var ratio = (value - opts.min) / (opts.max - opts.min);
      cap.style.setProperty("--mc-value", ratio.toFixed(3));
      if (valueEl) valueEl.textContent = String(Math.round(value)).padStart(opts.pad || 3, "0");
      el.setAttribute("aria-valuenow", String(Math.round(value)));
    }

    function set(v) {
      renderVisual(Math.min(opts.max, Math.max(opts.min, v)));
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

    renderVisual(value);
    return { renderOnly: renderVisual };
  }

  var faders = {};
  function wireFader(key, prefix, min, max, initial, pad, onChange) {
    var el = document.getElementById(prefix);
    var track = document.getElementById(prefix.replace("mc-fader", "mc-track"));
    var cap = document.getElementById(prefix.replace("mc-fader", "mc-cap"));
    var valueEl = document.getElementById(prefix.replace("mc-fader", "mc-value"));
    if (!el || !track || !cap) return;
    faders[key] = makeFader(el, track, cap, valueEl, { min: min, max: max, initial: initial, pad: pad, onChange: onChange });
  }

  function updateActiveTabColor(fx) {
    if (!fixturesEl) return;
    var tab = fixturesEl.querySelector(".mc-fixture-tab.is-active");
    if (tab) tab.style.setProperty("--fixture-color", "rgb(" + fx.r + ", " + fx.g + ", " + fx.b + ")");
  }

  wireFader("intensity", "mc-fader", 0, 100, 70, 3, function (v) { var fx = getActiveFixture(); fx.intensity = v; applyFixture(fx); });
  wireFader("r", "mc-fader-r", 0, 255, fixtures[0].r, 3, function (v) { var fx = getActiveFixture(); fx.r = Math.round(v); applyFixture(fx); updateActiveTabColor(fx); });
  wireFader("g", "mc-fader-g", 0, 255, fixtures[0].g, 3, function (v) { var fx = getActiveFixture(); fx.g = Math.round(v); applyFixture(fx); updateActiveTabColor(fx); });
  wireFader("b", "mc-fader-b", 0, 255, fixtures[0].b, 3, function (v) { var fx = getActiveFixture(); fx.b = Math.round(v); applyFixture(fx); updateActiveTabColor(fx); });
  wireFader("speed", "mc-fader-speed", 0, 100, 50, 3, function (v) { var fx = getActiveFixture(); fx.speed = Math.round(v); applyFixture(fx); });

  // ---- Pan/Tilt : pavé XY ----
  var xyPad = document.getElementById("mc-xy-pad");
  var xyPuck = document.getElementById("mc-xy-puck");
  var xyReadout = document.getElementById("mc-xy-readout");

  function renderXY(fx) {
    if (!xyPuck) return;
    xyPuck.style.setProperty("--pan", fx.pan.toFixed(1) + "%");
    xyPuck.style.setProperty("--tilt", fx.tilt.toFixed(1) + "%");
    if (xyReadout) xyReadout.textContent = String(Math.round(fx.pan)).padStart(3, "0") + " / " + String(Math.round(fx.tilt)).padStart(3, "0");
    if (xyPad) xyPad.setAttribute("aria-valuenow", String(Math.round(fx.pan)));
  }

  function setXYFromClientPos(clientX, clientY) {
    var rect = xyPad.getBoundingClientRect();
    var pan = ((clientX - rect.left) / rect.width) * 100;
    var tilt = ((clientY - rect.top) / rect.height) * 100;
    var fx = getActiveFixture();
    fx.pan = Math.max(0, Math.min(100, pan));
    fx.tilt = Math.max(0, Math.min(100, tilt));
    applyPosition(fx);
    renderXY(fx);
  }

  if (xyPad) {
    var xyDragging = false;
    xyPad.addEventListener("pointerdown", function (e) {
      xyDragging = true;
      xyPad.setPointerCapture(e.pointerId);
      setXYFromClientPos(e.clientX, e.clientY);
    });
    xyPad.addEventListener("pointermove", function (e) {
      if (xyDragging) setXYFromClientPos(e.clientX, e.clientY);
    });
    xyPad.addEventListener("pointerup", function () { xyDragging = false; });
    xyPad.addEventListener("pointercancel", function () { xyDragging = false; });

    xyPad.addEventListener("keydown", function (e) {
      var fx = getActiveFixture();
      var step = 5;
      if (e.key === "ArrowLeft") { fx.pan = Math.max(0, fx.pan - step); }
      else if (e.key === "ArrowRight") { fx.pan = Math.min(100, fx.pan + step); }
      else if (e.key === "ArrowUp") { fx.tilt = Math.max(0, fx.tilt - step); }
      else if (e.key === "ArrowDown") { fx.tilt = Math.min(100, fx.tilt + step); }
      else return;
      e.preventDefault();
      applyPosition(fx);
      renderXY(fx);
    });
  }

  // ---- Effets ----
  var effectButtons = Array.prototype.slice.call(document.querySelectorAll(".mc-effect-btn"));
  function renderEffectButtons(fx) {
    effectButtons.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.effect === fx.effect));
    });
  }
  if (reduceMotion) {
    effectButtons.forEach(function (btn) { btn.setAttribute("disabled", "true"); });
  } else {
    effectButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var fx = getActiveFixture();
        var chosen = btn.dataset.effect;
        fx.effect = fx.effect === chosen ? "none" : chosen;
        renderEffectButtons(fx);
        applyFixture(fx);
      });
    });
  }

  // ---- Mouvement programmé (trajet de points pan/tilt + couleur RGB) ----
  var pathAddBtn = document.getElementById("mc-path-add");
  var pathPlayBtn = document.getElementById("mc-path-play");
  var pathClearBtn = document.getElementById("mc-path-clear");
  var pathCountEl = document.getElementById("mc-path-count");
  var pathRafId = null;

  function renderPathUI(fx) {
    if (pathCountEl) pathCountEl.textContent = fx.path.length + (fx.path.length === 1 ? " POINT" : " POINTS");
    if (pathPlayBtn) {
      pathPlayBtn.disabled = reduceMotion || fx.path.length < 2;
      pathPlayBtn.setAttribute("aria-pressed", String(fx.playing));
      pathPlayBtn.textContent = fx.playing ? "STOP" : "LECTURE";
    }
    if (pathClearBtn) pathClearBtn.disabled = fx.path.length === 0;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function pathTick(timestamp) {
    var anyPlaying = false;
    fixtures.forEach(function (fx) {
      if (!fx.playing || fx.path.length < 2) return;
      anyPlaying = true;
      if (fx._pathStart == null) fx._pathStart = timestamp;
      var segMs = pathSegmentMs(fx);
      var totalMs = segMs * fx.path.length;
      var elapsed = (timestamp - fx._pathStart) % totalMs;
      var segIndex = Math.floor(elapsed / segMs);
      var segT = (elapsed % segMs) / segMs;
      var a = fx.path[segIndex];
      var b = fx.path[(segIndex + 1) % fx.path.length];
      fx.pan = lerp(a.pan, b.pan, segT);
      fx.tilt = lerp(a.tilt, b.tilt, segT);
      fx.r = Math.round(lerp(a.r, b.r, segT));
      fx.g = Math.round(lerp(a.g, b.g, segT));
      fx.b = Math.round(lerp(a.b, b.b, segT));
      applyFixture(fx);
      if (fx.id === activeFixtureId) {
        renderXY(fx);
        if (faders.r) faders.r.renderOnly(fx.r);
        if (faders.g) faders.g.renderOnly(fx.g);
        if (faders.b) faders.b.renderOnly(fx.b);
        updateActiveTabColor(fx);
      }
    });
    pathRafId = anyPlaying ? requestAnimationFrame(pathTick) : null;
  }
  function ensurePathLoop() {
    if (pathRafId == null) pathRafId = requestAnimationFrame(pathTick);
  }

  if (pathAddBtn) {
    pathAddBtn.addEventListener("click", function () {
      var fx = getActiveFixture();
      fx.path.push({ pan: fx.pan, tilt: fx.tilt, r: fx.r, g: fx.g, b: fx.b });
      renderPathUI(fx);
    });
  }
  if (pathClearBtn) {
    pathClearBtn.addEventListener("click", function () {
      var fx = getActiveFixture();
      fx.path = [];
      fx.playing = false;
      fx._pathStart = null;
      renderPathUI(fx);
    });
  }
  if (pathPlayBtn) {
    pathPlayBtn.addEventListener("click", function () {
      if (reduceMotion) return;
      var fx = getActiveFixture();
      if (fx.path.length < 2) return;
      fx.playing = !fx.playing;
      fx._pathStart = null;
      renderPathUI(fx);
      if (fx.playing) ensurePathLoop();
    });
  }

  // ---- Fixtures : onglets, ajout, suppression ----
  var fixturesEl = document.getElementById("mc-fixtures");
  var fixtureAddBtn = document.getElementById("mc-fixture-add");

  function renderFixtureTabs() {
    if (!fixturesEl) return;
    fixturesEl.innerHTML = "";
    fixtures.forEach(function (fx, i) {
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "mc-fixture-tab" + (fx.id === activeFixtureId ? " is-active" : "");
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(fx.id === activeFixtureId));
      tab.style.setProperty("--fixture-color", "rgb(" + fx.r + ", " + fx.g + ", " + fx.b + ")");

      var dot = document.createElement("span");
      dot.className = "mc-fixture-tab-dot";
      tab.appendChild(dot);

      var label = document.createElement("span");
      label.textContent = "H" + (i + 1);
      tab.appendChild(label);

      if (fixtures.length > 1) {
        var remove = document.createElement("span");
        remove.className = "mc-fixture-remove";
        remove.textContent = "×";
        remove.setAttribute("aria-label", "Supprimer H" + (i + 1));
        remove.addEventListener("click", function (e) {
          e.stopPropagation();
          removeFixture(fx.id);
        });
        tab.appendChild(remove);
      }

      tab.addEventListener("click", function () { selectFixture(fx.id); });
      fixturesEl.appendChild(tab);
    });
  }

  function syncControlsToActiveFixture() {
    var fx = getActiveFixture();
    if (faders.intensity) faders.intensity.renderOnly(fx.intensity);
    if (faders.r) faders.r.renderOnly(fx.r);
    if (faders.g) faders.g.renderOnly(fx.g);
    if (faders.b) faders.b.renderOnly(fx.b);
    if (faders.speed) faders.speed.renderOnly(fx.speed);
    renderXY(fx);
    renderEffectButtons(fx);
    renderPathUI(fx);
  }

  function selectFixture(id) {
    activeFixtureId = id;
    renderFixtureTabs();
    syncControlsToActiveFixture();
  }

  function removeFixture(id) {
    if (fixtures.length <= 1) return;
    var idx = fixtures.findIndex(function (f) { return f.id === id; });
    if (idx === -1) return;
    fixtures.splice(idx, 1);
    document.querySelectorAll('.channel-halo[data-fixture-id="' + id + '"]').forEach(function (el) { el.remove(); });
    if (activeFixtureId === id) activeFixtureId = fixtures[0].id;
    renderFixtureTabs();
    syncControlsToActiveFixture();
  }

  function addFixture() {
    var fx = createFixture({});
    fixtures.push(fx);
    activeFixtureId = fx.id;
    ensureHaloElements();
    applyFixture(fx);
    renderFixtureTabs();
    syncControlsToActiveFixture();
  }

  if (fixtureAddBtn) fixtureAddBtn.addEventListener("click", addFixture);

  // ---- Réduire / agrandir le panneau ----
  var minimizeBtn = document.getElementById("mc-minimize");
  if (minimizeBtn && panel) {
    minimizeBtn.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    minimizeBtn.addEventListener("click", function () {
      var collapsed = panel.classList.toggle("is-collapsed");
      minimizeBtn.textContent = collapsed ? "+" : "−";
      minimizeBtn.setAttribute("aria-label", collapsed ? "Agrandir la console" : "Réduire la console");
      minimizeBtn.setAttribute("aria-expanded", String(!collapsed));
    });
  }

  // ---- Déplacement du panneau ----
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

  ensureHaloElements();
  applyFixture(fixtures[0]);
  renderFixtureTabs();
  syncControlsToActiveFixture();
})();
