(function () {
  document.documentElement.classList.add("js");

  // Every mailto: link (nav CTA, offerings pills, footer email) copies the
  // address to the clipboard and confirms with a toast, instead of opening
  // a mail client. Falls back to the normal mailto: behavior when the
  // Clipboard API is unavailable or the write fails.
  var toast;
  var toastTimer;
  function showToast(message) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "site-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2500);
  }

  var ctaResetTimer;
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest('a[href^="mailto:"]');
    if (!link || !navigator.clipboard) return;
    event.preventDefault();
    var email = link.getAttribute("href").slice(7).split("?")[0];
    navigator.clipboard.writeText(email).then(
      function () {
        showToast("Email copied — " + email);
        if (link.hasAttribute("data-copy-cta")) {
          var original = link.textContent;
          link.textContent = "Copied";
          clearTimeout(ctaResetTimer);
          ctaResetTimer = setTimeout(function () {
            link.textContent = original;
          }, 2000);
        }
      },
      function () {
        window.location.href = link.getAttribute("href");
      }
    );
  });

  // Short click sound on the homepage/design-page project cards, nav
  // menu links, and the case-study "Back" link. a.work-card matches a
  // project card (see styles/cards.css); a[href="index.html"] outside
  // the nav is always a Back link (see the "Fix inert case-study Back
  // button" commit).
  //
  // These are all same-tab navigations, which normally tear the page
  // (and its audio) down before the ~0.5s clip is audible. A plain click
  // (no modifier/middle-click, not target="_blank") is intercepted to
  // play the sound and hold the navigation for one short beat first;
  // anything that would open in a new tab is left alone since the
  // current page - and its sound - keeps playing regardless.
  //
  // playClickSound() clones the element per play instead of resetting
  // and reusing one shared <audio> - reusing one meant a second click
  // (e.g. clicking again while the delayed navigation from the first
  // was still pending) reset currentTime on an element already mid
  // playback, which throws an AbortError and drops the sound entirely.
  // The navigation delay also waits for the play() promise to settle
  // rather than counting a flat 150ms from the click: a "cold" first
  // play can take longer to actually start producing sound than a
  // later one, and a fixed delay that doesn't account for that is what
  // made the click sometimes audible and sometimes not.
  var clickSoundSrc = new Audio("assets/sounds/short_button_click.mp3");
  clickSoundSrc.preload = "auto";
  var CLICK_SOUND_DELAY = 160;

  function playClickSound() {
    var sound = clickSoundSrc.cloneNode(true);
    return sound.play().catch(function () {});
  }

  document.addEventListener("click", function (event) {
    var target =
      event.target.closest &&
      event.target.closest(
        'a.work-card, .site-nav__links a, .site-nav__home, a[href="index.html"]'
      );
    if (!target) return;

    var soundStarted = playClickSound();

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
      soundStarted.then(function () {
        setTimeout(function () {
          window.location.href = href;
        }, CLICK_SOUND_DELAY);
      });
    }
  });

  var nav = document.querySelector(".site-nav");
  if (!nav) return;

  var toggle = nav.querySelector(".site-nav__toggle");
  var panel = nav.querySelector(".site-nav__panel");
  if (!toggle || !panel) return;

  function isOpen() {
    return nav.classList.contains("is-open");
  }

  function open() {
    nav.classList.add("is-open");
    document.documentElement.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.textContent = "Close";
  }

  function close(refocus) {
    nav.classList.remove("is-open");
    document.documentElement.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menu";
    if (refocus) toggle.focus();
  }

  toggle.addEventListener("click", function () {
    isOpen() ? close(false) : open();
  });

  panel.addEventListener("click", function (event) {
    if (event.target.closest("a")) close(false);
  });

  document.addEventListener("keydown", function (event) {
    if (!isOpen()) return;

    if (event.key === "Escape") {
      close(true);
      return;
    }

    if (event.key === "Tab") {
      var focusable = panel.querySelectorAll("a, button");
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  window.matchMedia("(min-width: 800px)").addEventListener("change", function (mql) {
    if (mql.matches && isOpen()) close(false);
  });
})();
