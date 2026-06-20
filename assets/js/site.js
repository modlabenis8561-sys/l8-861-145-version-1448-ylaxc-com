(function () {
  var nav = document.querySelector('[data-mobile-nav]');
  var menuButton = document.querySelector('[data-menu-button]');

  if (menuButton && nav) {
    menuButton.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero-carousel]');
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        restart();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-slide')) || 0);
        restart();
      });
    });

    show(0);
    restart();
  }

  function createResult(movie) {
    var item = document.createElement('a');
    item.href = movie.url;
    item.className = 'search-result-item';
    item.innerHTML = '<img src="' + movie.cover + '" alt="">' +
      '<span><strong>' + escapeHtml(movie.title) + '</strong><small>' +
      escapeHtml(movie.region + ' · ' + movie.type + ' · ' + movie.year) +
      '</small></span>';
    return item;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setupGlobalSearch() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll('[data-search-input]'));
    var movies = window.GJ_MOVIES || [];

    inputs.forEach(function (input) {
      var box = input.parentElement ? input.parentElement.querySelector('[data-search-results]') : null;
      if (!box) {
        return;
      }

      input.addEventListener('input', function () {
        var query = input.value.trim().toLowerCase();
        box.innerHTML = '';
        box.classList.remove('is-open');

        if (!query) {
          return;
        }

        var matched = movies.filter(function (movie) {
          return [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.oneLine]
            .join(' ')
            .toLowerCase()
            .indexOf(query) !== -1;
        }).slice(0, 12);

        matched.forEach(function (movie) {
          box.appendChild(createResult(movie));
        });

        if (matched.length) {
          box.classList.add('is-open');
        }
      });

      document.addEventListener('click', function (event) {
        if (!input.parentElement || !input.parentElement.contains(event.target)) {
          box.classList.remove('is-open');
        }
      });
    });
  }

  function setupLocalFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));

    panels.forEach(function (panel) {
      var section = panel.closest('.content-section') || document;
      var cards = Array.prototype.slice.call(section.querySelectorAll('[data-filter-card]'));
      var textInput = panel.querySelector('[data-local-search]');
      var typeSelect = panel.querySelector('[data-type-filter]');
      var yearSelect = panel.querySelector('[data-year-filter]');

      function apply() {
        var query = textInput ? textInput.value.trim().toLowerCase() : '';
        var type = typeSelect ? typeSelect.value : '';
        var year = yearSelect ? yearSelect.value : '';

        cards.forEach(function (card) {
          var text = [
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-year'),
            card.getAttribute('data-genre')
          ].join(' ').toLowerCase();
          var typeOk = !type || text.indexOf(type.toLowerCase()) !== -1;
          var yearOk = !year || (card.getAttribute('data-year') || '').indexOf(year) !== -1;
          var textOk = !query || text.indexOf(query) !== -1;
          card.classList.toggle('is-hidden', !(typeOk && yearOk && textOk));
        });
      }

      [textInput, typeSelect, yearSelect].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });
    });
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

    players.forEach(function (player) {
      var video = player.querySelector('video');
      var cover = player.querySelector('.player-cover');
      var stream = player.getAttribute('data-stream');
      var hlsInstance = null;

      if (!video || !stream) {
        return;
      }

      function attach() {
        if (video.getAttribute('data-ready') === 'true') {
          return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls();
          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);
        } else {
          video.src = stream;
        }

        video.setAttribute('data-ready', 'true');
      }

      function start() {
        attach();
        video.controls = true;
        if (cover) {
          cover.classList.add('is-hidden');
        }
        var playRequest = video.play();
        if (playRequest && typeof playRequest.catch === 'function') {
          playRequest.catch(function () {});
        }
      }

      if (cover) {
        cover.addEventListener('click', start);
      }

      player.addEventListener('click', function (event) {
        if (event.target === video && video.getAttribute('data-ready') !== 'true') {
          start();
        }
      });

      window.addEventListener('pagehide', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
          hlsInstance = null;
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupHero();
    setupGlobalSearch();
    setupLocalFilters();
    setupPlayers();
  });
})();
