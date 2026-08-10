(function () {
  var filters = document.querySelector(".work-filters");
  if (!filters) return;

  var pills = filters.querySelectorAll(".work-filters__pill");
  var cards = document.querySelectorAll(".work-grid [data-tags]");

  function applyFilter(filter) {
    cards.forEach(function (card) {
      var tags = card.getAttribute("data-tags").split(" ");
      var show = filter === "all" || tags.indexOf(filter) !== -1;
      card.hidden = !show;
      if (card.hidden) {
        var video = card.querySelector("video");
        if (video) video.pause();
      }
    });
  }

  function setActivePill(filter) {
    pills.forEach(function (p) {
      var isActive = p.getAttribute("data-filter") === filter;
      p.classList.toggle("is-active", isActive);
      p.setAttribute("aria-pressed", String(isActive));
    });
  }

  filters.addEventListener("click", function (event) {
    var pill = event.target.closest(".work-filters__pill");
    if (!pill) return;
    var filter = pill.getAttribute("data-filter");
    var nextFilter = pill.classList.contains("is-active") ? "all" : filter;
    setActivePill(nextFilter);
    applyFilter(nextFilter);
  });

  var requestedTag = new URLSearchParams(window.location.search).get("tag");
  var matchedPill = null;
  pills.forEach(function (p) {
    if (p.getAttribute("data-filter") === requestedTag) matchedPill = p;
  });
  if (requestedTag && matchedPill) {
    setActivePill(requestedTag);
    applyFilter(requestedTag);
  }
})();
