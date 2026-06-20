(function () {
  var header = document.querySelector('.site-header');
  var menuButton = document.querySelector('.menu-toggle');

  if (header && menuButton) {
    menuButton.addEventListener('click', function () {
      var isOpen = header.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  document.querySelectorAll('img.cover-img').forEach(function (image) {
    image.addEventListener('error', function () {
      image.classList.add('is-hidden');
    }, { once: true });
  });

  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var thumbs = Array.prototype.slice.call(hero.querySelectorAll('.hero-thumb'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function setActive(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });

      thumbs.forEach(function (thumb, thumbIndex) {
        thumb.classList.toggle('is-active', thumbIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        setActive(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.concat(thumbs).forEach(function (control) {
      control.addEventListener('click', function () {
        var slideIndex = Number(control.getAttribute('data-go-slide'));
        setActive(slideIndex);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        setActive(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        setActive(index + 1);
        start();
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    setActive(0);
    start();
  });

  document.querySelectorAll('.filter-scope').forEach(function (scope) {
    var input = scope.querySelector('[data-filter-input]');
    var buttons = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-value]'));
    var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));
    var grid = scope.querySelector('.movie-grid');
    var empty = document.createElement('div');

    empty.className = 'no-results';
    empty.textContent = '没有找到匹配的影片';

    function applyFilter(value) {
      var query = String(value || '').trim().toLowerCase();
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute('data-title'),
          card.getAttribute('data-keywords'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year'),
          card.getAttribute('data-category')
        ].join(' ').toLowerCase();
        var matched = !query || haystack.indexOf(query) !== -1;

        card.style.display = matched ? '' : 'none';
        if (matched) {
          visible += 1;
        }
      });

      if (grid) {
        if (visible === 0 && !empty.parentNode) {
          grid.appendChild(empty);
        }

        if (visible > 0 && empty.parentNode) {
          empty.parentNode.removeChild(empty);
        }
      }
    }

    if (input) {
      input.addEventListener('input', function () {
        applyFilter(input.value);
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var value = button.getAttribute('data-filter-value') || '';
        if (input) {
          input.value = value;
        }
        applyFilter(value);
      });
    });
  });
})();
