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
    });
  }

  filters.addEventListener("click", function (event) {
    var pill = event.target.closest(".work-filters__pill");
    if (!pill) return;

    var filter = pill.getAttribute("data-filter");
    var alreadyActive = pill.classList.contains("is-active");
    var nextFilter = alreadyActive ? "all" : filter;

    pills.forEach(function (p) {
      var isActive = p.getAttribute("data-filter") === nextFilter;
      p.classList.toggle("is-active", isActive);
      p.setAttribute("aria-pressed", String(isActive));
    });

    applyFilter(nextFilter);
  });
})();
