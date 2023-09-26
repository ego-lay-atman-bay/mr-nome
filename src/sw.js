const addResourcesToCache = async (resources) => {
    const cache = await caches.open("v1");
    await cache.addAll(resources);
};

self.addEventListener("install", (event) => {
    event.waitUntil(
        addResourcesToCache([
            "./",
            "./index.html",
            "./style.css",
            "./scripts.js",
            "./manifest.json",
            "./sw.js",

            "./click-track/index.html",
            "./click-track/scripts.js",
            "./click-track/style.css",

            "./assets/sounds/gock block.mp3",
            "./assets/sounds/silence-10m.flac",

            "./common/css/common.css",
            "./common/css/menu.css",

            "./common/dialog-polyfill/dialog-polyfill.css",
            "./common/dialog-polyfill/dialog-polyfill.esm.js",
            "./common/dialog-polyfill/dialog-polyfill.js",

            "./common/fonts/BravuraText.otf",
            "./common/fonts/BravuraText.woff",

            "./common/js/register-sw.js",
            "./common/js/common.js",
            "./common/js/Tone.js",
            "./common/js/metronome.js",
            "./common/js/click-track.js",
            "./common/js/vexflow.js",
            "./common/js/jquery-3.6.0.min.js",
            "./common/js/file-saver.js",

            "./common/navbar/navbar.css",
            "./common/navbar/navbar.js",

            "./common/select/select.css",
            "./common/select/select.js",
        ]),
    );
});
