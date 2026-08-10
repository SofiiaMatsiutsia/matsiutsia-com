/* Custom cursor: small dot by default, morphs into a labeled pill over
   project cards and a ring over other links/buttons. Only wired up on
   devices with a real mouse - (hover: hover) and (pointer: fine) - so
   touch/pen visitors keep their native cursor untouched.

   The shape's size/padding and its left edge are driven by a damped
   spring (not a CSS transition) so hover morphs settle with a touch of
   overshoot instead of a flat ease. Border-radius is pinned at a fixed
   max in CSS rather than animated - see styles/cursor.css. The label
   pill's left edge
   is itself a spring target that's frozen the instant a hover starts
   (rather than recentered every frame), so the pill grows outward from
   that fixed left edge - left to right - instead of from its center;
   leaving the pill lets that same spring ease the edge back to centered. */
(function () {
  var mql = window.matchMedia("(hover: hover) and (pointer: fine)");
  var cursor, shape, label, active;
  var mode = "dot";
  var frozenAnchor = 0;

  // href substring -> pill label, checked in order.
  var LABELS = [
    ["voyage-monitor.html", "View case study"],
    ["internal-panel.html", "View case study"],
    ["team-lift-ai.html", "View case study"],
    ["housing-anywhere.html", "View project"],
    ["linkedin.com/posts/", "View video"],
    ["vibecoders.global", "Check our community"],
    ["ai.studio", "View project"]
  ];

  function labelFor(href) {
    if (!href) return null;
    for (var i = 0; i < LABELS.length; i++) {
      if (href.indexOf(LABELS[i][0]) !== -1) return LABELS[i][1];
    }
    return null;
  }

  // border-radius is intentionally not part of the animated size (see
  // styles/cursor.css: it's pinned at a permanent max/stadium radius) -
  // animating it alongside width/height caused a corner "flicker", since
  // the browser clamps radius to 50% of the box and the two springs
  // pass through mismatched values on the way to their targets.
  var SIZES = {
    dot: { width: 14, height: 14, padX: 0, padY: 0 },
    link: { width: 16, height: 16, padX: 0, padY: 0 },
    label: { width: 14, height: 20, padX: 6, padY: 3 }
  };

  // Damped harmonic spring: a touch of overshoot on the way to target,
  // instead of the flat ease-out a CSS transition would give.
  var STIFFNESS = 260;
  var DAMPING = 22;

  function createSpring(value) {
    return { value: value, velocity: 0, target: value };
  }

  function stepSpring(spring, dt) {
    var force = -STIFFNESS * (spring.value - spring.target) - DAMPING * spring.velocity;
    spring.velocity += force * dt;
    spring.value += spring.velocity * dt;
  }

  var springs;

  function build() {
    cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("data-mode", "dot");
    cursor.setAttribute("aria-hidden", "true");

    shape = document.createElement("div");
    shape.className = "cursor__shape";

    label = document.createElement("span");
    label.className = "cursor__label";

    shape.appendChild(label);
    cursor.appendChild(shape);
    document.body.appendChild(cursor);

    springs = {
      width: createSpring(SIZES.dot.width),
      height: createSpring(SIZES.dot.height),
      padX: createSpring(SIZES.dot.padX),
      padY: createSpring(SIZES.dot.padY),
      anchorLeft: createSpring(-SIZES.dot.width / 2)
    };

    requestAnimationFrame(tick);
  }

  function setTargets(size) {
    springs.width.target = size.width;
    springs.height.target = size.height;
    springs.padX.target = size.padX;
    springs.padY.target = size.padY;
  }

  function setMode(nextMode, text) {
    if (nextMode === "label" && mode !== "label") {
      frozenAnchor = springs.anchorLeft.value;
    }

    if (nextMode === "label") {
      label.textContent = text || "";
      var size = SIZES.label;
      setTargets({
        width: label.offsetWidth + size.padX * 2,
        height: size.height,
        padX: size.padX,
        padY: size.padY
      });
    } else {
      label.textContent = "";
      setTargets(SIZES[nextMode]);
    }

    mode = nextMode;
    cursor.setAttribute("data-mode", nextMode);
  }

  function onPointerOver(event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (link) {
      var text = labelFor(link.getAttribute("href"));
      if (text) {
        setMode("label", text);
        return;
      }
      setMode("link");
      return;
    }
    if (event.target.closest("button, [role='button'], summary")) {
      setMode("link");
      return;
    }
    setMode("dot");
  }

  function enable() {
    if (active) return;
    active = true;
    if (!cursor) build();
    document.documentElement.classList.add("has-cursor");

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    requestAnimationFrame(tick);
  }

  function disable() {
    if (!active) return;
    active = false;
    document.documentElement.classList.remove("has-cursor");
    if (cursor) cursor.classList.remove("is-visible");

    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerover", onPointerOver);
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("mouseleave", onMouseLeave);
    document.removeEventListener("mouseenter", onMouseEnter);
  }

  function onPointerMove(event) {
    cursor.classList.add("is-visible");
    cursor.style.transform =
      "translate3d(" + event.clientX + "px, " + event.clientY + "px, 0)";
  }

  function onPointerDown() {
    cursor.setAttribute("data-pressed", "");
  }

  function onPointerUp() {
    cursor.removeAttribute("data-pressed");
  }

  function onMouseLeave() {
    cursor.classList.remove("is-visible");
  }

  function onMouseEnter() {
    cursor.classList.add("is-visible");
  }

  var lastTime = null;
  function tick(time) {
    if (!active) {
      lastTime = null;
      return;
    }
    if (lastTime == null) lastTime = time;
    var dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    stepSpring(springs.width, dt);
    stepSpring(springs.height, dt);
    stepSpring(springs.padX, dt);
    stepSpring(springs.padY, dt);

    // Frozen while a label pill is open (so it only grows rightward);
    // otherwise chases the centered position, easing the edge smoothly
    // back as the shape shrinks to a dot/ring.
    springs.anchorLeft.target =
      mode === "label" ? frozenAnchor : -springs.width.value / 2;
    stepSpring(springs.anchorLeft, dt);

    var h = springs.height.value;
    shape.style.width = springs.width.value + "px";
    shape.style.height = h + "px";
    shape.style.padding = springs.padY.value + "px " + springs.padX.value + "px";
    shape.style.marginTop = -h / 2 + "px";
    shape.style.marginLeft = springs.anchorLeft.value + "px";

    requestAnimationFrame(tick);
  }

  function sync() {
    if (mql.matches) {
      enable();
    } else {
      disable();
    }
  }

  sync();
  mql.addEventListener("change", sync);
})();
