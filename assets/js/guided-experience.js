/* guided-experience.js — cue-driven audio player: play/pause/seek/next/prev
   plus scroll + highlight sync. Nothing plays or scrolls without the visitor
   pressing play first. */

function initGuidedExperience(root) {
  const audio = root.querySelector("audio");
  const player = root.querySelector(".audio-player");
  const trigger = document.querySelector(`[data-audio-trigger="${root.dataset.guide}"]`);
  const playBtn = root.querySelector('[data-action="play"]');
  const prevBtn = root.querySelector('[data-action="prev"]');
  const nextBtn = root.querySelector('[data-action="next"]');
  const progress = root.querySelector(".audio-player__progress");
  const timeLabel = root.querySelector(".audio-player__time");
  const cuesSrc = root.dataset.cuesSrc;

  if (!audio || !player || !trigger || !cuesSrc) return;

  let cues = [];
  let activeCueIndex = -1;
  let wasPlaying = false;

  fetch(cuesSrc)
    .then((res) => res.json())
    .then((data) => {
      cues = data;
    });

  function formatTime(seconds) {
    if (!isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function cueIndexForTime(t) {
    let idx = -1;
    for (let i = 0; i < cues.length; i++) {
      if (cues[i].time <= t) idx = i;
    }
    return idx;
  }

  function focusCue(index) {
    if (index === activeCueIndex || index < 0 || !cues[index]) return;
    const prevTarget = cues[activeCueIndex] && document.querySelector(cues[activeCueIndex].target);
    if (prevTarget) prevTarget.classList.remove("is-focused");

    const target = document.querySelector(cues[index].target);
    if (target) {
      target.classList.add("is-focused");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    activeCueIndex = index;
  }

  function updatePlayButton() {
    const isPlaying = !audio.paused && !audio.ended;
    playBtn.textContent = isPlaying ? "❚❚" : "►";
    playBtn.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
  }

  trigger.addEventListener("click", () => {
    player.classList.add("is-active");
    player.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  playBtn.addEventListener("click", () => {
    if (audio.paused) audio.play();
    else audio.pause();
  });

  audio.addEventListener("play", updatePlayButton);
  audio.addEventListener("pause", updatePlayButton);

  audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
      progress.value = (audio.currentTime / audio.duration) * 100;
      timeLabel.textContent = formatTime(audio.duration - audio.currentTime);
    }
    focusCue(cueIndexForTime(audio.currentTime));
  });

  progress.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (progress.value / 100) * audio.duration;
  });

  prevBtn.addEventListener("click", () => {
    const targetIndex = Math.max(0, activeCueIndex - 1);
    if (cues[targetIndex]) {
      audio.currentTime = cues[targetIndex].time;
      focusCue(targetIndex);
    }
  });

  nextBtn.addEventListener("click", () => {
    const targetIndex = Math.min(cues.length - 1, activeCueIndex + 1);
    if (cues[targetIndex]) {
      audio.currentTime = cues[targetIndex].time;
      focusCue(targetIndex);
    }
  });

  document.addEventListener("ece:langchange", (e) => {
    const src = audio.getAttribute(`data-src-${e.detail.lang}`);
    if (!src) return;
    wasPlaying = !audio.paused;
    const resumeTime = audio.currentTime;
    audio.src = src;
    audio.addEventListener(
      "loadedmetadata",
      () => {
        audio.currentTime = resumeTime;
        if (wasPlaying) audio.play().catch(() => {});
      },
      { once: true }
    );
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-guide]").forEach(initGuidedExperience);
});
