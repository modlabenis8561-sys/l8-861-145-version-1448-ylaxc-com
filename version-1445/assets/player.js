(function () {
  function canUseNativeHls(video) {
    return video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('application/x-mpegURL');
  }

  function setMp4(video) {
    var mp4Source = video.getAttribute('data-mp4');
    if (mp4Source && video.getAttribute('src') !== mp4Source) {
      video.setAttribute('src', mp4Source);
    }
  }

  async function prepareVideo(video) {
    if (video.getAttribute('data-ready') === 'true') {
      return;
    }

    var hlsSource = video.getAttribute('data-hls');
    var mp4Source = video.getAttribute('data-mp4');

    if (hlsSource && canUseNativeHls(video)) {
      video.setAttribute('src', hlsSource);
      video.setAttribute('data-ready', 'true');
      return;
    }

    if (hlsSource && window.location.protocol !== 'file:') {
      try {
        var module = await import('./hls-dru42stk.js');
        var Hls = module.H;
        if (Hls && Hls.isSupported && Hls.isSupported()) {
          var hls = new Hls({
            maxBufferLength: 30,
            enableWorker: true
          });
          hls.loadSource(hlsSource);
          hls.attachMedia(video);
          video.__hls = hls;
          video.setAttribute('data-ready', 'true');
          return;
        }
      } catch (error) {
        setMp4(video);
      }
    }

    if (mp4Source) {
      setMp4(video);
      video.setAttribute('data-ready', 'true');
    }
  }

  function setupPlayer(player) {
    var video = player.querySelector('video');
    var button = player.querySelector('[data-player-play]');
    if (!video || !button) {
      return;
    }

    async function play() {
      await prepareVideo(video);
      try {
        await video.play();
        button.classList.add('hidden');
      } catch (error) {
        button.classList.remove('hidden');
      }
    }

    button.addEventListener('click', play);
    video.addEventListener('play', function () {
      button.classList.add('hidden');
    });
    video.addEventListener('pause', function () {
      if (video.currentTime === 0 || video.ended) {
        button.classList.remove('hidden');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-player]').forEach(setupPlayer);
  });
})();
