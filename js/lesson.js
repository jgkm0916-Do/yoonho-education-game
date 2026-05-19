(function () {
  "use strict";

  const STORAGE = YoonhoProgress.STORAGE;

  function assetPath(...parts) {
    return parts.map((p) => encodeURIComponent(p)).join("/");
  }

  const CHARACTERS = {
    dino: { folder: "dino", prefix: "dino", hasDefault: true },
    ham: { folder: "hamster", prefix: "hamster" },
    block: { folder: "minecraft", prefix: "minecraft" },
    sea: { folder: "whaleshark", prefix: "whaleshark" },
    star: { folder: "star", prefix: "star", map: { cheer: "excited", wow: "surprised" } },
  };

  function charImg(worldKey, expression) {
    const c = CHARACTERS[worldKey] || CHARACTERS.dino;
    const mapped = (c.map && c.map[expression]) || expression;
    const file =
      mapped === "default" && c.hasDefault
        ? c.prefix + ".png"
        : c.prefix + "_" + mapped + ".png";
    return assetPath("assets", "characters", c.folder, file);
  }

  const params = new URLSearchParams(window.location.search);
  const SESSION_SIZE = 5;

  let worldKey = YoonhoProgress.normalizeWorldKey(params.get("world") || "dino");
  let step = Math.max(1, Math.min(5, Number(params.get("step")) || 1));
  let items = [];
  let meta;
  let stepTitles;

  function resolveSession() {
    const urlWorld = params.get("world");
    const urlStep = params.get("step");
    const bankWorld = YoonhoQuestionBank.normalizeBankWorld(
      urlWorld || localStorage.getItem(STORAGE.currentWorld) || "dino"
    );
    const bankLevel = Number(urlStep || localStorage.getItem(STORAGE.currentLevel) || 1);
    step = Math.max(1, Math.min(5, bankLevel));
    worldKey = YoonhoProgress.normalizeWorldKey(urlWorld || bankWorld);
    meta = YoonhoProgress.WORLD_META[worldKey];
    stepTitles = YoonhoProgress.STEP_TITLES[worldKey];
    items = YoonhoQuestionBank.loadQuestions(bankWorld, step, SESSION_SIZE);
    localStorage.setItem(STORAGE.currentWorld, bankWorld);
    localStorage.setItem(STORAGE.currentLevel, String(step));
    return { bankWorld, bankLevel: step };
  }

  let index = 0;
  let correctCount = 0;
  let lessonFinished = false;
  let audioCtx = null;
  let soundEnabled = localStorage.getItem(STORAGE.soundEnabled) !== "false";

  const $ = (id) => document.getElementById(id);

  function setMascot(expression) {
    const img = $("mascotImg");
    if (img) img.src = charImg(worldKey, expression === "default" ? "happy" : expression);
  }

  function unlockAudio() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (_) {}
  }

  function render() {
    const item = items[index];
    $("questionText").textContent = item.q;
    $("promptText").textContent = item.prompt;
    $("reward").classList.remove("show");
    $("progress").style.width = ((index + 1) / items.length) * 100 + "%";
    $("count").textContent = index + 1 + "/" + items.length;
    $("speechBubble").innerHTML = "잘하고<br>있어요!";
    setMascot("happy");

    const box = $("choices");
    box.innerHTML = "";
    item.choices.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.textContent = c;
      btn.onclick = () => answer(btn, c, item.answer);
      box.appendChild(btn);
    });

    if (soundEnabled) setTimeout(() => speakQuestion(), 400);
  }

  function speakQuestion() {
    const item = items[index];
    if (!("speechSynthesis" in window) || !soundEnabled) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(item.speak || item.prompt);
    utter.lang = "ko-KR";
    utter.rate = 0.82;
    utter.pitch = 1.22;
    window.speechSynthesis.speak(utter);
  }

  function speakText(text) {
    if (!("speechSynthesis" in window) || !soundEnabled) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ko-KR";
    utter.rate = 0.88;
    utter.pitch = 1.3;
    window.speechSynthesis.speak(utter);
  }

  function completeSession() {
    if (lessonFinished) return;
    lessonFinished = true;

    const result = YoonhoProgress.completeStep(worldKey, step, correctCount, items.length);
    const starStr = "★".repeat(result.bestStars) + "☆".repeat(3 - result.bestStars);

    setMascot("cheer");
    $("completeMsg").textContent =
      meta.name +
      " " +
      step +
      "단계를 마쳤어요! (" +
      correctCount +
      "/" +
      items.length +
      " 정답)";
    $("completeStars").textContent = "획득 별: " + starStr;

    if (result.pendingWorldIndex !== null) {
      $("completeMsg").textContent += " 새로운 월드가 열렸어요!";
    }

    $("completeOverlay").classList.add("show");
    confetti();
    speakText("정말 잘했어! 단계를 완료했어!");
  }

  function answer(btn, choice, ans) {
    unlockAudio();
    document.querySelectorAll(".choice").forEach((b) => (b.disabled = true));

    if (choice === ans) {
      correctCount += 1;
      btn.classList.add("correct");
      setMascot("happy");
      $("rewardTitle").innerHTML = '우와! <span style="color:#ff55b0">정답이에요!</span>';
      $("rewardText").textContent = "잘했어요!";
      $("speechBubble").innerHTML = "정말<br>잘했어!";
      $("reward").classList.add("show");
      confetti();
      speakText("잘했어! 정답이에요!");
    } else {
      btn.classList.add("wrong");
      setMascot("sad");
      document.querySelectorAll(".choice").forEach((b) => {
        if (b.textContent === ans) b.classList.add("correct");
      });
      $("rewardTitle").innerHTML = '아하! <span style="color:#6b32d6">정답은 ' + ans + "</span>";
      $("rewardText").textContent = "괜찮아요. 다시 하면 더 잘할 수 있어요!";
      $("speechBubble").innerHTML = "괜찮아<br>다시 해봐!";
      $("reward").classList.add("show");
      speakText("괜찮아. 정답은 " + ans + " 이야.");
    }

    setTimeout(() => {
      index++;
      if (index >= items.length) {
        completeSession();
        return;
      }
      render();
    }, 2400);
  }

  function confetti() {
    const area = $("confetti");
    area.innerHTML = "";
    area.classList.add("show");
    const colors = ["#ff69bc", "#ffe56d", "#6ee7c8", "#9b5cff", "#7cb7ff"];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDelay = Math.random() * 0.4 + "s";
      area.appendChild(p);
    }
    setTimeout(() => area.classList.remove("show"), 1200);
  }

  function init() {
    resolveSession();

    if (!meta || !YoonhoProgress.isMapWorldUnlocked(meta.index)) {
      window.location.replace("index.html");
      return;
    }
    if (!YoonhoProgress.isStepUnlocked(worldKey, step)) {
      window.location.replace("stages.html?world=" + encodeURIComponent(worldKey));
      return;
    }
    if (!items.length) {
      console.warn("문제 없음:", localStorage.getItem(STORAGE.currentWorld), step);
      window.location.replace("stages.html?world=" + encodeURIComponent(worldKey));
      return;
    }

    const mapId = YoonhoProgress.KEY_TO_MAP_ID[worldKey] || worldKey;
    localStorage.setItem(STORAGE.lastWorld, mapId);

    $("lessonTitle").textContent = meta.name;
    $("lessonDesc").textContent = stepTitles[step - 1] || "";
    $("levelBadge").textContent = step + "단계";
    $("backBtn").href = "stages.html?world=" + encodeURIComponent(worldKey);

    setMascot("happy");

    $("soundBtn").addEventListener("click", () => {
      unlockAudio();
      speakQuestion();
    });

    $("completeBtn").addEventListener("click", () => {
      window.location.href = "stages.html?world=" + encodeURIComponent(worldKey);
    });

    document.addEventListener("pointerdown", unlockAudio, { once: true });
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
