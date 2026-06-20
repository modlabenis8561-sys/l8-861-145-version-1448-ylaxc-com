(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  var menuButton = qs(".menu-toggle");
  var mobileMenu = qs(".mobile-menu");

  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", function () {
      var expanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!expanded));
      mobileMenu.hidden = expanded;
    });
  }

  qsa("[data-carousel]").forEach(function (carousel) {
    var slides = qsa(".hero-slide", carousel);
    var dots = qsa(".hero-dot", carousel);
    var prev = qs(".hero-prev", carousel);
    var next = qs(".hero-next", carousel);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-slide") || 0));
        start();
      });
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    show(0);
    start();
  });

  qsa("[data-card-list]").forEach(function (list) {
    var page = list.closest("main") || document;
    var input = qs(".page-search", page);
    var pills = qsa(".filter-pill", page);
    var cards = qsa(".movie-card", list);
    var activeFilter = "";

    function cardText(card) {
      return normalize([
        card.getAttribute("data-title"),
        card.getAttribute("data-region"),
        card.getAttribute("data-genre"),
        card.getAttribute("data-tags"),
        card.getAttribute("data-category"),
        card.textContent
      ].join(" "));
    }

    function apply() {
      var query = normalize(input ? input.value : "");
      var filter = normalize(activeFilter);
      cards.forEach(function (card) {
        var text = cardText(card);
        var matchesQuery = !query || text.indexOf(query) !== -1;
        var matchesFilter = !filter || text.indexOf(filter) !== -1;
        card.classList.toggle("is-hidden-card", !(matchesQuery && matchesFilter));
      });
    }

    if (input) {
      var params = new URLSearchParams(window.location.search);
      if (params.get("q")) {
        input.value = params.get("q");
      }
      input.addEventListener("input", apply);
    }

    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        pills.forEach(function (item) {
          item.classList.remove("is-active");
        });
        pill.classList.add("is-active");
        activeFilter = pill.getAttribute("data-filter") || "";
        apply();
      });
    });

    apply();
  });
})();
