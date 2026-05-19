(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const worldKey = YoonhoProgress.normalizeWorldKey(params.get("world") || "dino");
  const meta = YoonhoProgress.WORLD_META[worldKey];

  const $ = (id) => document.getElementById(id);

  function starDisplay(n) {
    let html = "";
    for (let i = 0; i < 3; i++) {
      html += i < n ? "★" : '<span class="empty">☆</span>';
    }
    return html;
  }

  function render() {
    $("worldTitle").textContent = meta.name;
    $("worldSub").textContent = "학습 단계를 선택하세요";

    const grid = $("stageGrid");
    grid.innerHTML = "";

    YoonhoProgress.getStepList(worldKey).forEach((step) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "stage-card";
      if (!step.unlocked) card.classList.add("is-locked");
      if (step.completed) card.classList.add("is-done");

      card.innerHTML =
        '<span class="stage-num">' +
        step.step +
        "단계</span>" +
        "<h3>" +
        step.title +
        "</h3>" +
        '<div class="stage-stars">' +
        starDisplay(step.stars) +
        "</div>";

      if (step.unlocked) {
        card.addEventListener("click", () => {
          const bankWorld =
            typeof YoonhoQuestionBank !== "undefined"
              ? YoonhoQuestionBank.normalizeBankWorld(worldKey)
              : worldKey;
          localStorage.setItem(YoonhoProgress.STORAGE.currentWorld, bankWorld);
          localStorage.setItem(YoonhoProgress.STORAGE.currentLevel, String(step.step));
          window.location.href =
            "lesson.html?world=" +
            encodeURIComponent(worldKey) +
            "&step=" +
            step.step;
        });
      }

      grid.appendChild(card);
    });
  }

  if (!YoonhoProgress.isMapWorldUnlocked(meta.index)) {
    window.location.replace("index.html");
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
