(function () {
  var formInputs = Array.prototype.slice.call(document.querySelectorAll('input[name="q"]'));
  var results = document.getElementById('searchResults');
  var empty = document.getElementById('searchEmpty');
  var summary = document.querySelector('[data-search-summary]');
  var params = new URLSearchParams(window.location.search);
  var query = params.get('q') || '';

  formInputs.forEach(function (input) {
    if (!input.value) {
      input.value = query;
    }
  });

  function normalized(value) {
    return String(value || '').trim().toLowerCase();
  }

  function render() {
    if (!results) {
      return;
    }

    var q = normalized(query);
    var list = window.SEARCH_MOVIES || [];
    var matches = q ? list.filter(function (movie) {
      return normalized([
        movie.title,
        movie.year,
        movie.region,
        movie.type,
        movie.genre,
        movie.category,
        movie.summary,
        (movie.tags || []).join(' ')
      ].join(' ')).indexOf(q) !== -1;
    }) : list.slice(0, 36);

    results.innerHTML = matches.slice(0, 120).map(function (movie) {
      var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');
      return '<article class="movie-card">' +
        '<a class="poster-link" href="' + escapeHtml(movie.url) + '" aria-label="' + escapeHtml(movie.title) + '">' +
        '<img src="' + escapeHtml(movie.image) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" decoding="async">' +
        '<span class="poster-shade"></span><span class="poster-play">立即播放</span><span class="poster-badge">评分 ' + escapeHtml(movie.rating) + '</span></a>' +
        '<div class="movie-card-body"><div class="movie-kicker">' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.type) + ' · ' + escapeHtml(movie.year) + '</div>' +
        '<h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>' +
        '<p>' + escapeHtml(movie.summary) + '</p><div class="tag-row">' + tags + '</div>' +
        '<div class="card-meta"><span>' + escapeHtml(movie.category) + '</span><span>' + escapeHtml(movie.genre) + '</span></div></div></article>';
    }).join('');

    if (summary) {
      summary.textContent = q ? '与“' + query + '”相关的影片。' : '热门影片与推荐内容。';
    }

    if (empty) {
      empty.hidden = matches.length !== 0;
    }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  render();
})();
