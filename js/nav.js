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

  // UI sounds (navigation clicks included) live in js/sound.js, which
  // synthesizes them with the vendored cuelume library.

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
