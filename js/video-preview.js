(function () {
  var videos = document.querySelectorAll(".work-card__media-video");
  if (!videos.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  if (!("IntersectionObserver" in window)) {
    videos.forEach(function (v) { v.play().catch(function () {}); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.play().catch(function () {});
      else entry.target.pause();
    });
  }, { rootMargin: "200px 0px", threshold: 0.25 });

  videos.forEach(function (v) { observer.observe(v); });
})();
