(function () {
  var wrap = document.querySelector('.player-wrap');
  var video = document.querySelector('.video-player');
  var cover = document.querySelector('.player-cover');
  var button = document.querySelector('.play-button');
  var hls = null;
  var loaded = false;

  if (!wrap || !video || typeof movieStream !== 'string') {
    return;
  }

  function attach() {
    if (loaded) {
      return;
    }
    loaded = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = movieStream;
      return;
    }

    if (window.Hls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(movieStream);
      hls.attachMedia(video);
      return;
    }

    video.src = movieStream;
  }

  function play() {
    attach();
    if (cover) {
      cover.classList.add('hidden');
    }
    var promise = video.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(function () {});
    }
  }

  if (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      play();
    });
  }

  if (cover) {
    cover.addEventListener('click', play);
  }

  video.addEventListener('play', function () {
    if (cover) {
      cover.classList.add('hidden');
    }
  });

  video.addEventListener('emptied', function () {
    if (hls) {
      hls.destroy();
      hls = null;
      loaded = false;
    }
  });
})();
