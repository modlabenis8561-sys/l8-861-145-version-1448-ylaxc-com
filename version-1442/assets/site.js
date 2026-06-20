function ready(callback) {
    if (document.readyState !== "loading") {
        callback();
        return;
    }
    document.addEventListener("DOMContentLoaded", callback);
}

function setHeroSlide(slides, dots, index) {
    slides.forEach(function(slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
    });
    dots.forEach(function(dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
    });
}

function initMoviePlayer(mediaUrl) {
    ready(function() {
        var video = document.querySelector("[data-player]");
        var layer = document.querySelector("[data-player-layer]");
        var buttons = document.querySelectorAll("[data-play-button]");
        var connected = false;
        var hlsInstance = null;

        if (!video || !mediaUrl) {
            return;
        }

        function connect() {
            if (connected) {
                return;
            }
            connected = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = mediaUrl;
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(mediaUrl);
                hlsInstance.attachMedia(video);
                return;
            }
            video.src = mediaUrl;
        }

        function start() {
            connect();
            if (layer) {
                layer.classList.add("is-hidden");
            }
            video.controls = true;
            var playAction = video.play();
            if (playAction && typeof playAction.catch === "function") {
                playAction.catch(function() {});
            }
        }

        buttons.forEach(function(button) {
            button.addEventListener("click", function(event) {
                event.preventDefault();
                start();
            });
        });

        if (layer) {
            layer.addEventListener("click", function(event) {
                event.preventDefault();
                start();
            });
        }

        video.addEventListener("click", function() {
            if (!connected) {
                start();
            }
        });

        window.addEventListener("pagehide", function() {
            if (hlsInstance) {
                hlsInstance.destroy();
                hlsInstance = null;
            }
        });
    });
}

ready(function() {
    var toggle = document.querySelector("[data-mobile-toggle]");
    var mobileNav = document.querySelector("[data-mobile-nav]");

    if (toggle && mobileNav) {
        toggle.addEventListener("click", function() {
            mobileNav.classList.toggle("is-open");
        });
    }

    var hero = document.querySelector("[data-hero]");
    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var activeIndex = 0;

        dots.forEach(function(dot, dotIndex) {
            dot.addEventListener("click", function() {
                activeIndex = dotIndex;
                setHeroSlide(slides, dots, activeIndex);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function() {
                activeIndex = (activeIndex + 1) % slides.length;
                setHeroSlide(slides, dots, activeIndex);
            }, 6200);
        }
    }

    var input = document.querySelector("[data-search-input]");
    var typeSelect = document.querySelector("[data-type-filter]");
    var regionSelect = document.querySelector("[data-region-filter]");
    var status = document.querySelector("[data-filter-status]");
    var empty = document.querySelector("[data-empty-result]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function runFilter() {
        if (!cards.length) {
            return;
        }
        var keyword = normalize(input ? input.value : "");
        var typeValue = normalize(typeSelect ? typeSelect.value : "");
        var regionValue = normalize(regionSelect ? regionSelect.value : "");
        var visible = 0;

        cards.forEach(function(card) {
            var text = normalize([
                card.getAttribute("data-title"),
                card.getAttribute("data-genre"),
                card.getAttribute("data-tags"),
                card.getAttribute("data-year"),
                card.getAttribute("data-region"),
                card.getAttribute("data-type")
            ].join(" "));
            var typeText = normalize(card.getAttribute("data-type"));
            var regionText = normalize(card.getAttribute("data-region"));
            var matchedKeyword = !keyword || text.indexOf(keyword) !== -1;
            var matchedType = !typeValue || typeText.indexOf(typeValue) !== -1;
            var matchedRegion = !regionValue || regionText.indexOf(regionValue) !== -1;
            var matched = matchedKeyword && matchedType && matchedRegion;

            card.style.display = matched ? "" : "none";
            if (matched) {
                visible += 1;
            }
        });

        if (status) {
            status.textContent = keyword || typeValue || regionValue ? "匹配 " + visible + " 部影片" : "输入片名、类型、年份或标签即可快速筛选";
        }
        if (empty) {
            empty.classList.toggle("is-visible", visible === 0);
        }
    }

    [input, typeSelect, regionSelect].forEach(function(element) {
        if (element) {
            element.addEventListener("input", runFilter);
            element.addEventListener("change", runFilter);
        }
    });

    runFilter();
});
