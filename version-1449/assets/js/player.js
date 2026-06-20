(function () {
  var activeHls = null;

  function showError(message) {
    var box = document.querySelector(".player-error");
    if (box) {
      box.textContent = message;
      box.hidden = false;
    }
  }

  function hideCover() {
    var cover = document.querySelector(".player-cover");
    if (cover) {
      cover.classList.add("is-hidden");
    }
  }

  function attachSource(video, url) {
    if (video.dataset.ready === "1") {
      return;
    }

    video.dataset.ready = "1";

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      activeHls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false
      });
      activeHls.loadSource(url);
      activeHls.attachMedia(video);
      activeHls.on(window.Hls.Events.ERROR, function (eventName, data) {
        if (data && data.fatal) {
          showError("播放暂不可用，请稍后再试。");
        }
      });
      return;
    }

    showError("播放暂不可用，请稍后再试。");
  }

  function boot(url) {
    var video = document.querySelector(".video-player");
    var cover = document.querySelector(".player-cover");
    var box = document.querySelector(".video-box");

    if (!video || !url) {
      return;
    }

    function start() {
      attachSource(video, url);
      hideCover();
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          video.controls = true;
        });
      }
    }

    if (cover) {
      cover.addEventListener("click", start);
    }

    if (box) {
      box.addEventListener("click", function (event) {
        if (event.target === video && video.paused) {
          start();
        }
      });
    }

    video.addEventListener("play", hideCover);

    window.addEventListener("pagehide", function () {
      if (activeHls) {
        activeHls.destroy();
        activeHls = null;
      }
    });
  }

  window.MoviePlayer = {
    boot: boot
  };
})();
