(function () {
  'use strict';

  var menuButton = document.getElementById('menu-toggle');
  var mobileNav = document.getElementById('mobile-nav');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function setupHeroCarousel() {
    var carousel = document.getElementById('hero-carousel');
    if (!carousel) {
      return;
    }

    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('.hero-dot'));
    var prev = carousel.querySelector('.hero-prev');
    var next = carousel.querySelector('.hero-next');
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-slide-to') || 0));
        start();
      });
    });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupPageFilters() {
    var filterPanel = document.querySelector('.filter-panel');
    if (!filterPanel) {
      return;
    }

    var input = filterPanel.querySelector('.page-filter-input');
    var region = filterPanel.querySelector('.page-filter-region');
    var year = filterPanel.querySelector('.page-filter-year');
    var count = filterPanel.querySelector('.filter-count');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-title]'));

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function applyFilter() {
      var keyword = normalize(input && input.value);
      var regionValue = normalize(region && region.value);
      var yearValue = normalize(year && year.value);
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-tags'),
          card.getAttribute('data-year')
        ].join(' '));
        var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchesRegion = !regionValue || normalize(card.getAttribute('data-region')) === regionValue;
        var matchesYear = !yearValue || normalize(card.getAttribute('data-year')) === yearValue;
        var isVisible = matchesKeyword && matchesRegion && matchesYear;

        card.classList.toggle('hidden-by-filter', !isVisible);
        if (isVisible) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = '显示 ' + visible + ' 部';
      }
    }

    [input, region, year].forEach(function (element) {
      if (element) {
        element.addEventListener('input', applyFilter);
        element.addEventListener('change', applyFilter);
      }
    });

    applyFilter();
  }

  var hlsPromise = null;

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    if (hlsPromise) {
      return hlsPromise;
    }

    hlsPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js';
      script.async = true;
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = function () {
        reject(new Error('HLS library failed to load'));
      };
      document.head.appendChild(script);
    });

    return hlsPromise;
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('.video-player'));

    players.forEach(function (player) {
      var video = player.querySelector('video');
      var button = player.querySelector('.video-play-button');
      var message = player.querySelector('.video-message');
      var src = player.getAttribute('data-src');
      var ready = false;
      var hlsInstance = null;

      if (!video || !src) {
        return;
      }

      function setMessage(text, isError) {
        if (!message) {
          return;
        }
        message.textContent = text;
        message.classList.toggle('error', Boolean(isError));
      }

      function initPlayer() {
        if (ready) {
          return Promise.resolve();
        }
        ready = true;
        setMessage('正在加载播放源...', false);

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          return Promise.resolve();
        }

        return loadHls().then(function (Hls) {
          if (Hls && Hls.isSupported()) {
            hlsInstance = new Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hlsInstance.loadSource(src);
            hlsInstance.attachMedia(video);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
              setMessage('点击播放', false);
            });
            hlsInstance.on(Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                setMessage('视频加载失败，请稍后再试', true);
              }
            });
            return;
          }

          video.src = src;
        });
      }

      function play() {
        initPlayer().then(function () {
          var result = video.play();
          if (result && typeof result.catch === 'function') {
            result.catch(function () {
              setMessage('请再次点击播放', false);
            });
          }
        }).catch(function () {
          setMessage('当前浏览器未能加载 HLS 播放器', true);
        });
      }

      if (button) {
        button.addEventListener('click', play);
      }

      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        } else {
          video.pause();
        }
      });

      video.addEventListener('play', function () {
        player.classList.add('playing');
      });

      video.addEventListener('pause', function () {
        player.classList.remove('playing');
        setMessage('点击播放', false);
      });

      window.addEventListener('pagehide', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
          hlsInstance = null;
        }
      });
    });
  }

  function setupSearchPage() {
    var input = document.getElementById('search-page-input');
    var results = document.getElementById('search-results');
    var status = document.getElementById('search-status');

    if (!input || !results || !status || !window.MOVIE_SEARCH_INDEX) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    input.value = initialQuery;

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function card(movie) {
      return [
        '<article class="movie-card compact">',
        '  <a href="' + movie.url + '" class="movie-link">',
        '    <div class="poster-wrap">',
        '      <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
        '      <span class="year-badge">' + movie.year + '</span>',
        '    </div>',
        '    <div class="movie-card-body">',
        '      <h3>' + escapeHtml(movie.title) + '</h3>',
        '      <p>' + escapeHtml(movie.oneLine) + '</p>',
        '      <div class="movie-meta">',
        '        <span>' + escapeHtml(movie.region) + '</span>',
        '        <span>' + escapeHtml(movie.type) + '</span>',
        '        <span>' + escapeHtml(movie.category) + '</span>',
        '      </div>',
        '    </div>',
        '  </a>',
        '</article>'
      ].join('');
    }

    function escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, function (character) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[character];
      });
    }

    function render() {
      var query = normalize(input.value);
      var data = window.MOVIE_SEARCH_INDEX;
      var matches;

      if (!query) {
        matches = data.slice(0, 60);
        status.textContent = '请输入关键词，当前展示前 60 部影片。';
      } else {
        matches = data.filter(function (movie) {
          return normalize([
            movie.title,
            movie.region,
            movie.type,
            movie.year,
            movie.genre,
            movie.tags,
            movie.category,
            movie.oneLine
          ].join(' ')).indexOf(query) !== -1;
        }).slice(0, 120);
        status.textContent = '找到 ' + matches.length + ' 条相关结果。';
      }

      results.innerHTML = matches.map(card).join('');
    }

    input.addEventListener('input', render);
    render();
  }

  setupHeroCarousel();
  setupPageFilters();
  setupPlayers();
  setupSearchPage();
})();
