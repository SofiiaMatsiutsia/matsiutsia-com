// Site-wide UI sounds, synthesized live by the vendored cuelume library
// (js/vendor/cuelume, MIT — https://github.com/Danilaa1/cuelume). No audio
// files: every cue is generated with the Web Audio API at click time.
//
// Everything is wired through delegated listeners on document, so the
// Figma-exported pages (whose card markup is minified one-liners) never
// need data attributes sprinkled through them. bind() is still called so
// any hand-written markup can opt in via data-cuelume-* later.
import { bind, play, setEnabled } from "./vendor/cuelume/index.js";

bind();

// ---- Mute preference -------------------------------------------------
// Persisted across visits; cuelume deliberately leaves storage to the app.
var MUTE_KEY = "sound-muted";

function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "true";
  } catch (e) {
    return false;
  }
}

function syncToggles(muted) {
  document.querySelectorAll(".sound-toggle").forEach(function (button) {
    button.setAttribute("aria-pressed", muted ? "false" : "true");
    button.setAttribute(
      "aria-label",
      muted ? "Turn sounds on" : "Turn sounds off"
    );
  });
}

setEnabled(!isMuted());
syncToggles(isMuted());

document.addEventListener("click", function (event) {
  var button = event.target.closest && event.target.closest(".sound-toggle");
  if (!button) return;
  var muted = !isMuted();
  try {
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch (e) {
    /* private mode etc. — the toggle still works for this page */
  }
  setEnabled(!muted);
  syncToggles(muted);
  if (!muted) play("toggle"); // audible confirmation only when turning on
});

// ---- Navigation clicks: tick + delayed navigation --------------------
// Homepage/design-page project cards (a.work-card — see styles/cards.css),
// nav menu links, the logo, and the case-study "Back" link.
//
// These are same-tab navigations, which normally tear the page (and its
// audio) down before the cue is audible. A plain click (no modifier or
// middle-click, not target="_blank") is intercepted to play the sound
// and hold the navigation for one short beat; anything opening in a new
// tab is left alone since the current page keeps playing regardless.
// Unlike the old <audio> clip there is no cold-start load to await —
// cuelume synthesizes immediately — so a flat delay is enough.
var NAV_SOUND_SELECTOR =
  'a.work-card, .site-nav__links a, .site-nav__home, a[href="index.html"]';
var NAV_SOUND_DELAY = 200;

document.addEventListener("click", function (event) {
  var target =
    event.target.closest && event.target.closest(NAV_SOUND_SELECTOR);
  if (!target) return;

  play("tick");

  var isPlainClick =
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey;
  var opensSameTab = target.getAttribute("target") !== "_blank";

  if (isPlainClick && opensSameTab) {
    event.preventDefault();
    var href = target.href;
    setTimeout(function () {
      window.location.href = href;
    }, NAV_SOUND_DELAY);
  }
});

// ---- Mailto links: success cue for the clipboard copy -----------------
// nav.js turns every mailto link (nav CTA, offerings pills, footer email)
// into a clipboard copy + toast; this layers the confirmation sound.
document.addEventListener("click", function (event) {
  var link =
    event.target.closest && event.target.closest('a[href^="mailto:"]');
  if (!link) return;
  play("success");
});

// Offerings "Work with me" pills, the nav CTA, and hero buttons (.btn) get
// a tactile press on pointer down (the mailto success above covers the
// release for mailto links).
document.addEventListener("pointerdown", function (event) {
  var pressed = event.target.closest && event.target.closest(".pill, .btn");
  if (!pressed) return;
  play("press");
});

// ---- Mobile nav panel: bloom on open, droplet on close ----------------
// Capture-phase so this reads aria-expanded BEFORE nav.js flips it,
// regardless of script order.
document.addEventListener(
  "click",
  function (event) {
    var toggle =
      event.target.closest && event.target.closest(".site-nav__toggle");
    if (!toggle) return;
    var wasOpen = toggle.getAttribute("aria-expanded") === "true";
    play(wasOpen ? "droplet" : "bloom");
  },
  true
);

// ---- Talk-photo lightbox: bloom on expand, droplet on dismiss ---------
// The lightbox is pure CSS driven by a hidden checkbox (styles/talks.css),
// so the checkbox's change event is the one reliable open/close signal.
document.addEventListener("change", function (event) {
  var box = event.target;
  if (!box.classList || !box.classList.contains("talk-lightbox-toggle")) return;
  play(box.checked ? "bloom" : "droplet");
});

// ---- Social icon links (nav panel/header + footer): soft whisper -------
// They open in new tabs, so no navigation delay is needed.
document.addEventListener("click", function (event) {
  var social =
    event.target.closest &&
    event.target.closest(
      ".site-nav__panel-social a, .site-nav__social a, .site-footer__social a"
    );
  if (!social) return;
  play("whisper");
});
