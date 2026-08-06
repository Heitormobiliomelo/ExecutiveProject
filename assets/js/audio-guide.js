/* audio-guide.js — simple per-page audio guide that follows the selected language */

(function () {
  const SUPPORTED = ["en", "pt", "es"];

  function currentLang() {
    const stored = localStorage.getItem("ece_lang");
    if (SUPPORTED.includes(stored)) return stored;
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return SUPPORTED.includes(nav) ? nav : "en";
  }

  const ICON_PLAY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  const ICON_PAUSE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

  function fmt(sec) {
    if (!isFinite(sec)) return "0:00";
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, "0");
    return m + ":" + s;
  }

  document.addEventListener("DOMContentLoaded", function () {
    const player = document.getElementById("audio-guide");
    if (!player) return;

    const base = player.getAttribute("data-audio-base");
    const audio = player.querySelector("[data-audio-el]");
    const toggle = player.querySelector("[data-audio-toggle]");
    const seek = player.querySelector("[data-audio-seek]");
    const timeEl = player.querySelector("[data-audio-time]");
    let seeking = false;

    function loadSrc(lang) {
      const wasPlaying = !audio.paused && !audio.ended && audio.currentTime > 0;
      audio.src = "assets/audio/" + base + "." + lang + ".m4a";
      audio.load();
      toggle.innerHTML = ICON_PLAY;
      seek.value = 0;
      timeEl.textContent = "0:00";
      if (wasPlaying) audio.play().catch(function () {});
    }

    loadSrc(currentLang());

    toggle.addEventListener("click", function () {
      if (audio.paused) audio.play().catch(function () {});
      else audio.pause();
    });

    audio.addEventListener("play", function () {
      toggle.innerHTML = ICON_PAUSE;
      toggle.setAttribute("aria-label", "Pause");
    });
    audio.addEventListener("pause", function () {
      toggle.innerHTML = ICON_PLAY;
      toggle.setAttribute("aria-label", "Play");
    });
    audio.addEventListener("ended", function () {
      toggle.innerHTML = ICON_PLAY;
      seek.value = 0;
      timeEl.textContent = "0:00";
    });

    // Show total duration as soon as metadata loads (avoids a stuck "0:00")
    audio.addEventListener("loadedmetadata", function () {
      if (audio.paused && !audio.currentTime) timeEl.textContent = fmt(audio.duration);
    });

    audio.addEventListener("timeupdate", function () {
      if (seeking || !audio.duration) return;
      seek.value = Math.round((audio.currentTime / audio.duration) * 1000);
      timeEl.textContent = "-" + fmt(audio.duration - audio.currentTime);
    });

    seek.addEventListener("input", function () {
      seeking = true;
    });
    seek.addEventListener("change", function () {
      if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration;
      seeking = false;
    });

    // Switch audio file when the site language changes
    document.addEventListener("ece:langchange", function (e) {
      loadSrc(e.detail.lang);
    });
  });
})();
