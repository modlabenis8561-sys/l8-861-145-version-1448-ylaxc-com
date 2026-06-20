(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var siteNav = document.querySelector('[data-site-nav]');

  if (menuButton && siteNav) {
    menuButton.addEventListener('click', function () {
      siteNav.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var activeIndex = 0;
    var timer = null;

    var showSlide = function (index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === activeIndex);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === activeIndex);
      });
    };

    var startHero = function () {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        showSlide(activeIndex + 1);
      }, 5200);
    };

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        startHero();
      });
    });

    if (slides.length > 1) {
      startHero();
    }
  }

  var filterPanel = document.querySelector('[data-filter-panel]');

  if (filterPanel) {
    var input = filterPanel.querySelector('.js-filter-input');
    var selects = Array.prototype.slice.call(filterPanel.querySelectorAll('.js-filter-select'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));
    var emptyState = filterPanel.querySelector('[data-empty-state]');

    var normalize = function (value) {
      return String(value || '').trim().toLowerCase();
    };

    var applyFilters = function () {
      var keyword = normalize(input ? input.value : '');
      var selected = {};
      var visibleCount = 0;

      selects.forEach(function (select) {
        selected[select.getAttribute('data-filter-key')] = select.value;
      });

      cards.forEach(function (card) {
        var text = normalize(card.getAttribute('data-search'));
        var matchesKeyword = !keyword || text.indexOf(keyword) !== -1;
        var matchesType = !selected.type || card.getAttribute('data-type') === selected.type;
        var matchesRegion = !selected.region || card.getAttribute('data-region') === selected.region;
        var matchesYear = !selected.year || card.getAttribute('data-year') === selected.year;
        var isVisible = matchesKeyword && matchesType && matchesRegion && matchesYear;

        card.hidden = !isVisible;
        if (isVisible) {
          visibleCount += 1;
        }
      });

      if (emptyState) {
        emptyState.hidden = visibleCount > 0;
      }
    };

    if (input) {
      input.addEventListener('input', applyFilters);
    }

    selects.forEach(function (select) {
      select.addEventListener('change', applyFilters);
    });
  }

  var renderSearch = function () {
    var results = document.getElementById('searchResults');
    var input = document.getElementById('globalSearchInput');
    var summary = document.querySelector('[data-search-summary]');

    if (!results || !input || !window.MOVIE_INDEX) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    input.value = query;

    var normalize = function (value) {
      return String(value || '').trim().toLowerCase();
    };

    var buildCard = function (movie) {
      var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
        return '<a href="search.html?q=' + encodeURIComponent(tag) + '">' + escapeHtml(tag) + '</a>';
      }).join('');

      return [
        '<article class="movie-card">',
        '  <a class="card-cover" href="' + escapeHtml(movie.url) + '" aria-label="观看' + escapeHtml(movie.title) + '">',
        '    <img src="' + escapeHtml(movie.image) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
        '    <span class="play-badge">播放</span>',
        '  </a>',
        '  <div class="card-body">',
        '    <div class="card-meta">',
        '      <span>' + escapeHtml(movie.year) + '</span>',
        '      <span>' + escapeHtml(movie.region) + '</span>',
        '      <span>' + escapeHtml(movie.type) + '</span>',
        '    </div>',
        '    <h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>',
        '    <p>' + escapeHtml(movie.oneLine) + '</p>',
        '    <div class="card-tags">' + tags + '</div>',
        '  </div>',
        '</article>'
      ].join('');
    };

    var performSearch = function (value) {
      var keyword = normalize(value);
      var matched = [];

      if (keyword) {
        matched = window.MOVIE_INDEX.filter(function (movie) {
          var text = normalize([
            movie.title,
            movie.region,
            movie.type,
            movie.year,
            movie.genre,
            movie.category,
            (movie.tags || []).join(','),
            movie.oneLine
          ].join(' '));

          return text.indexOf(keyword) !== -1;
        }).slice(0, 160);
      }

      results.innerHTML = matched.map(buildCard).join('');

      if (summary) {
        summary.textContent = keyword ? '找到 ' + matched.length + ' 条相关影片。' : '请输入关键词开始搜索。';
      }
    };

    input.addEventListener('input', function () {
      performSearch(input.value);
    });

    performSearch(query);
  };

  var escapeHtml = function (value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  renderSearch();

  var setupPlayers = function () {
    var shells = Array.prototype.slice.call(document.querySelectorAll('.player-shell'));

    shells.forEach(function (shell) {
      var video = shell.querySelector('.js-hls-player');
      var button = shell.querySelector('.js-player-start');
      var message = shell.querySelector('[data-player-message]');
      var source = shell.getAttribute('data-video-source');
      var hlsInstance = null;
      var initialized = false;

      if (!video || !source) {
        return;
      }

      var setMessage = function (text) {
        if (message) {
          message.textContent = text || '';
        }
      };

      var initialize = function () {
        if (initialized) {
          return Promise.resolve();
        }

        initialized = true;

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setMessage('播放连接正在重试，请稍后再试。');
              try {
                hlsInstance.destroy();
              } catch (error) {
                setMessage('播放初始化异常。');
              }
              initialized = false;
            }
          });
          return Promise.resolve();
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          return Promise.resolve();
        }

        setMessage('当前浏览器暂不支持 HLS 播放。');
        return Promise.reject(new Error('HLS is not supported'));
      };

      var startPlayback = function () {
        initialize().then(function () {
          return video.play();
        }).then(function () {
          if (button) {
            button.classList.add('is-hidden');
          }
          setMessage('');
        }).catch(function () {
          setMessage('请再次点击播放按钮开始播放。');
        });
      };

      if (button) {
        button.addEventListener('click', startPlayback);
      }

      video.addEventListener('click', function () {
        if (video.paused) {
          startPlayback();
        }
      });

      video.addEventListener('play', function () {
        if (button) {
          button.classList.add('is-hidden');
        }
      });

      video.addEventListener('pause', function () {
        if (button && video.currentTime === 0) {
          button.classList.remove('is-hidden');
        }
      });
    });
  };

  setupPlayers();
})();
