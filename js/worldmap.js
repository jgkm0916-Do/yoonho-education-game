/**
 * 윤호의 한글 월드 — 월드맵 메인 화면
 * GitHub Pages 호환 (상대 경로, URL 인코딩)
 */

(function () {
  "use strict";

  const STORAGE = {
    unlockedStage: "unlockedStage",
    pendingUnlock: "pendingUnlock",
    totalStars: "totalStars",
    soundEnabled: "soundEnabled",
    lastWorld: "lastWorld",
    completedStages: "completedStages",
  };

  /** @param {...string} parts */
  function assetPath(...parts) {
    return parts.map((p) => encodeURIComponent(p)).join("/");
  }

  const ASSETS = {
    logo: assetPath("assets", "logo", "yoonho_logo.png"),
    worldmap: assetPath("assets", "worldmap", "worldmap.png"),
    worldBtnDir: assetPath("assets", "world", "world button"),
  };

  const WORLDS = [
    {
      id: "dino",
      name: "공룡숲",
      subtitle: "자음 찾기",
      lessonKey: "dino",
      openFile: "dinoforest_open.png",
      lockedFile: null,
      left: 24,
      top: 37,
      character: "dino",
      expressions: {
        happy: assetPath("assets", "characters", "dino", "dino_happy.png"),
        sad: assetPath("assets", "characters", "dino", "dino_sad.png"),
        cheer: assetPath("assets", "characters", "dino", "dino_cheer.png"),
        sleep: assetPath("assets", "characters", "dino", "dino_sleep.png"),
        wow: assetPath("assets", "characters", "dino", "dino_wow.png"),
        default: assetPath("assets", "characters", "dino", "dino.png"),
      },
    },
    {
      id: "hamster",
      name: "햄찌마을",
      subtitle: "모음 찾기",
      lessonKey: "ham",
      openFile: "hamstertown_open.png",
      lockedFile: "hamstertown lock_locked.png",
      left: 54,
      top: 43,
      character: "hamster",
      expressions: {
        happy: assetPath("assets", "characters", "hamster", "hamster_happy.png"),
        sad: assetPath("assets", "characters", "hamster", "hamster_sad.png"),
        cheer: assetPath("assets", "characters", "hamster", "hamster_cheer.png"),
        sleep: assetPath("assets", "characters", "hamster", "hamster_sleep.png"),
        wow: assetPath("assets", "characters", "hamster", "hamster_wow.png"),
        default: assetPath("assets", "characters", "hamster", "hamster_happy.png"),
      },
    },
    {
      id: "block",
      name: "블록광산",
      subtitle: "자음+모음 조합하기",
      lessonKey: "block",
      openFile: "block_open.png",
      lockedFile: "block_locked.png",
      left: 86,
      top: 33,
      character: "minecraft",
      expressions: {
        happy: assetPath("assets", "characters", "minecraft", "minecraft_happy.png"),
        sad: assetPath("assets", "characters", "minecraft", "minecraft_sad.png"),
        cheer: assetPath("assets", "characters", "minecraft", "minecraft_cheer.png"),
        sleep: assetPath("assets", "characters", "minecraft", "minecraft_sleep.png"),
        wow: assetPath("assets", "characters", "minecraft", "minecraft_wow.png"),
        default: assetPath("assets", "characters", "minecraft", "minecraft_happy.png"),
      },
    },
    {
      id: "ocean",
      name: "바다왕국",
      subtitle: "단어 읽기",
      lessonKey: "sea",
      openFile: "ocean_open.png",
      lockedFile: "ocean_locked.png",
      left: 66,
      top: 66,
      character: "whaleshark",
      expressions: {
        happy: assetPath("assets", "characters", "whaleshark", "whaleshark_happy.png"),
        sad: assetPath("assets", "characters", "whaleshark", "whaleshark_sad.png"),
        cheer: assetPath("assets", "characters", "whaleshark", "whaleshark_cheer.png"),
        sleep: assetPath("assets", "characters", "whaleshark", "whaleshark_sleep.png"),
        wow: assetPath("assets", "characters", "whaleshark", "whaleshark_wow.png"),
        default: assetPath("assets", "characters", "whaleshark", "whaleshark_happy.png"),
      },
    },
    {
      id: "star",
      name: "별의성",
      subtitle: "복습 모험",
      lessonKey: "star",
      openFile: "star_open.png",
      lockedFile: "star_locked.png",
      left: 31,
      top: 76,
      character: "star",
      expressions: {
        happy: assetPath("assets", "characters", "star", "star_happy.png"),
        sad: assetPath("assets", "characters", "star", "star_sad.png"),
        cheer: assetPath("assets", "characters", "star", "star_excited.png"),
        sleep: assetPath("assets", "characters", "star", "star_sleep.png"),
        wow: assetPath("assets", "characters", "star", "star_surprised.png"),
        default: assetPath("assets", "characters", "star", "star_happy.png"),
      },
    },
  ];

  /* 섬 하단 앵커 좌표를 잇는 모험 경로 */
  const PATH_D =
    "M 24 37 C 34 38, 44 42, 54 43 S 70 34, 86 33 S 76 50, 66 66 S 44 74, 31 76";

  let audioCtx = null;
  let soundEnabled = localStorage.getItem(STORAGE.soundEnabled) !== "false";
  let unlockedStage = clampStage(
    typeof YoonhoProgress !== "undefined"
      ? YoonhoProgress.getUnlockedMapIndex()
      : Number(localStorage.getItem(STORAGE.unlockedStage) || 0)
  );
  let totalStars =
    typeof YoonhoProgress !== "undefined"
      ? YoonhoProgress.syncTotalStars()
      : Number(localStorage.getItem(STORAGE.totalStars) || 0);
  let lastWorldId = localStorage.getItem(STORAGE.lastWorld) || "dino";
  let unlockAnimating = false;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function clampStage(n) {
    if (Number.isNaN(n) || n < 0) return 0;
    if (n > WORLDS.length - 1) return WORLDS.length - 1;
    return Math.floor(n);
  }

  function worldBtnPath(filename) {
    return ASSETS.worldBtnDir + "/" + encodeURIComponent(filename);
  }

  function isWorldUnlocked(index) {
    return index <= unlockedStage;
  }

  function getWorldImage(world, unlocked) {
    if (unlocked) {
      return worldBtnPath(world.openFile);
    }
    if (world.lockedFile) {
      return worldBtnPath(world.lockedFile);
    }
    return worldBtnPath(world.openFile);
  }

  function getCompletedStages() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.completedStages) || "[]");
    } catch {
      return [];
    }
  }

  function setCompletedStages(arr) {
    localStorage.setItem(STORAGE.completedStages, JSON.stringify(arr));
  }

  function calcProgressPercent() {
    if (typeof YoonhoProgress === "undefined") {
      const done = getCompletedStages().length;
      return Math.round((done / WORLDS.length) * 100);
    }
    let completedSteps = 0;
    const totalSteps = WORLDS.length * 5;
    YoonhoProgress.WORLD_KEYS.forEach((key) => {
      for (let s = 1; s <= 5; s++) {
        if (YoonhoProgress.isStepCompleted(key, s)) completedSteps += 1;
      }
    });
    return Math.round((completedSteps / totalSteps) * 100);
  }

  function collectPreloadUrls() {
    const urls = new Set([ASSETS.logo, ASSETS.worldmap]);
    WORLDS.forEach((w) => {
      urls.add(worldBtnPath(w.openFile));
      if (w.lockedFile) urls.add(worldBtnPath(w.lockedFile));
      Object.values(w.expressions).forEach((u) => urls.add(u));
    });
    return [...urls];
  }

  function preloadImages(urls, onProgress) {
    let loaded = 0;
    const total = urls.length;

    return Promise.all(
      urls.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = img.onerror = () => {
              loaded += 1;
              if (onProgress) onProgress(loaded / total);
              resolve();
            };
            img.src = src;
          })
      )
    );
  }

  function unlockAudio() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (_) {}
  }

  function playTone(freqs, type = "sine", volume = 0.14) {
    if (!soundEnabled || !audioCtx) return;
    const now = audioCtx.currentTime;
    freqs.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.0001, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(volume, now + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.22);
    });
  }

  function playUnlockSound() {
    playTone([523.25, 659.25, 783.99, 1046.5], "sine", 0.16);
  }

  function playTapSound() {
    playTone([440, 554], "triangle", 0.08);
  }

  function playLockedSound() {
    playTone([220, 196], "triangle", 0.06);
  }

  function showToast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("is-visible"), 2200);
  }

  function updateHud() {
    totalStars =
      typeof YoonhoProgress !== "undefined"
        ? YoonhoProgress.syncTotalStars()
        : Number(localStorage.getItem(STORAGE.totalStars) || 0);
    unlockedStage = clampStage(
      typeof YoonhoProgress !== "undefined"
        ? YoonhoProgress.getUnlockedMapIndex()
        : Number(localStorage.getItem(STORAGE.unlockedStage) || 0)
    );
    const starsEl = $("#starCount");
    const progressFill = $("#progressFill");
    const progressText = $("#progressText");
    if (starsEl) starsEl.textContent = String(totalStars);
    const pct = calcProgressPercent();
    if (progressFill) progressFill.style.width = pct + "%";
    if (progressText) progressText.textContent = pct + "%";
  }

  function renderWorldNodes() {
    const container = $("#worldNodes");
    if (!container) return;
    container.innerHTML = "";

    WORLDS.forEach((world, index) => {
      const unlocked = isWorldUnlocked(index);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "world-node" + (unlocked ? " is-open" : " is-locked");
      if (world.id === lastWorldId) btn.classList.add("is-current");
      btn.style.position = "absolute";
      btn.style.left = world.left + "%";
      btn.style.top = world.top + "%";
      btn.dataset.worldId = world.id;
      btn.dataset.index = String(index);
      btn.setAttribute("aria-label", world.name + (unlocked ? "" : " (잠김)"));

      const img = document.createElement("img");
      img.src = getWorldImage(world, unlocked);
      img.alt = "";
      img.draggable = false;
      img.loading = "eager";
      btn.appendChild(img);

      const highlightWorld = () => {
        $$(".world-node").forEach((n) => n.classList.remove("is-hovered"));
        btn.classList.add("is-hovered");
      };
      btn.addEventListener("mouseenter", highlightWorld);
      btn.addEventListener("focus", highlightWorld);
      btn.addEventListener("mouseleave", () => btn.classList.remove("is-hovered"));

      if (unlocked) {
        btn.addEventListener("click", () => enterWorld(world, index));
      } else {
        btn.addEventListener("click", () => {
          unlockAudio();
          playLockedSound();
          showToast("먼저 이전 월드를 완료해 주세요!");
        });
      }

      container.appendChild(btn);
    });

    updatePathDim();
  }

  function updatePathDim() {
    $$(".map-paths path").forEach((path, i) => {
      path.classList.toggle("dim", !isWorldUnlocked(i + 1));
    });
  }

  function enterWorld(world, index) {
    if (unlockAnimating) return;
    unlockAudio();
    playTapSound();
    lastWorldId = world.id;
    localStorage.setItem(STORAGE.lastWorld, world.id);
    localStorage.setItem("currentWorldIndex", String(index));

    const lessonKeys = { dino: "dino", hamster: "ham", block: "block", ocean: "sea", star: "star" };
    const key = lessonKeys[world.id] || world.lessonKey || "dino";
    window.location.href = "stages.html?world=" + encodeURIComponent(key);
  }

  function spawnAmbientParticles() {
    const layer = $("#ambientParticles");
    if (!layer) return;
    layer.innerHTML = "";
    for (let i = 0; i < 14; i++) {
      const s = document.createElement("span");
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.animationDelay = Math.random() * 4 + "s";
      s.style.animationDuration = 4 + Math.random() * 4 + "s";
      layer.appendChild(s);
    }
  }

  function spawnUnlockParticles(container) {
    if (!container) return;
    container.innerHTML = "";
    const symbols = ["✦", "★", "✧", "⭐", "✦"];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement("i");
      p.textContent = symbols[i % symbols.length];
      p.style.left = 40 + Math.random() * 20 + "%";
      p.style.top = 35 + Math.random() * 20 + "%";
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 100;
      p.style.setProperty("--tx", Math.cos(angle) * dist + "px");
      p.style.setProperty("--ty", Math.sin(angle) * dist + "px");
      p.style.animationDelay = Math.random() * 0.25 + "s";
      p.style.color = ["#ffd56a", "#ff5eb8", "#8d4df5", "#74ead4"][i % 4];
      container.appendChild(p);
    }
  }

  function showUnlockModal(stageIndex) {
    const world = WORLDS[stageIndex];
    if (!world) return;

    const overlay = $("#unlockOverlay");
    const lock = $("#unlockLock");
    const charImg = $("#unlockCharacter");
    const title = $("#unlockTitle");
    const sub = $("#unlockSub");
    const particles = $("#unlockParticles");
    const goBtn = $("#unlockGo");

    if (!overlay || !lock || !charImg) return;

    unlockAnimating = true;
    overlay.classList.add("is-visible");
    lock.textContent = "🔒";
    lock.className = "unlock-lock";
    charImg.className = "unlock-character";
    charImg.src = world.expressions.cheer || world.expressions.default;
    charImg.alt = world.name;
    if (title) title.textContent = "새로운 월드가 열렸어요!";
    if (sub) sub.textContent = world.name + "으로 떠나볼까요?";

    playUnlockSound();

    setTimeout(() => lock.classList.add("is-shaking"), 400);

    setTimeout(() => {
      lock.classList.remove("is-shaking");
      lock.classList.add("is-broken");
      spawnUnlockParticles(particles);
    }, 2100);

    setTimeout(() => {
      charImg.classList.add("is-visible");
    }, 2500);

    let closed = false;
    let autoCloseTimer;

    const close = () => {
      if (closed) return;
      closed = true;
      clearTimeout(autoCloseTimer);
      overlay.classList.remove("is-visible");
      localStorage.removeItem(STORAGE.pendingUnlock);
      unlockAnimating = false;
      renderWorldNodes();
      updateHud();
      goBtn.removeEventListener("click", onGo);
      overlay.removeEventListener("click", onOverlayClick);
    };

    const onGo = () => {
      close();
      enterWorld(world, stageIndex);
    };

    const onOverlayClick = (e) => {
      if (e.target === overlay) close();
    };

    goBtn.addEventListener("click", onGo);
    overlay.addEventListener("click", onOverlayClick);

    autoCloseTimer = setTimeout(close, 12000);
  }

  function checkPendingUnlock() {
    const pending = localStorage.getItem(STORAGE.pendingUnlock);
    if (pending === null || pending === "") return;

    const stageIndex = clampStage(Number(pending));
    if (stageIndex < 1 || stageIndex > WORLDS.length - 1) {
      localStorage.removeItem(STORAGE.pendingUnlock);
      return;
    }

    unlockedStage = Math.max(unlockedStage, stageIndex);
    localStorage.setItem(STORAGE.unlockedStage, String(unlockedStage));

    setTimeout(() => showUnlockModal(stageIndex), 600);
  }

  function bindControls() {
    const soundBtn = $("#soundBtn");
    const homeBtn = $("#homeBtn");
    const resetBtn = $("#resetBtn");

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        unlockAudio();
        const ok = window.confirm("진행 상황을 처음부터 다시 시작할까요?");
        if (!ok) return;
        if (typeof YoonhoProgress !== "undefined") {
          YoonhoProgress.resetAll();
        } else {
          localStorage.removeItem(STORAGE.unlockedStage);
          localStorage.removeItem(STORAGE.pendingUnlock);
          localStorage.removeItem(STORAGE.totalStars);
          localStorage.removeItem(STORAGE.completedStages);
        }
        window.location.reload();
      });
    }

    if (soundBtn) {
      soundBtn.classList.toggle("is-muted", !soundEnabled);
      soundBtn.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
      soundBtn.addEventListener("click", () => {
        unlockAudio();
        soundEnabled = !soundEnabled;
        localStorage.setItem(STORAGE.soundEnabled, String(soundEnabled));
        soundBtn.classList.toggle("is-muted", !soundEnabled);
        soundBtn.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
        playTapSound();
      });
    }

    if (homeBtn) {
      homeBtn.addEventListener("click", () => {
        unlockAudio();
        playTapSound();
        lastWorldId = "dino";
        localStorage.setItem(STORAGE.lastWorld, "dino");
        renderWorldNodes();
        showToast("월드맵으로 돌아왔어요!");
      });
    }
  }

  function syncFromLegacyStorage() {
    const legacyCorrect = Number(localStorage.getItem("correct") || 0);
    if (!localStorage.getItem(STORAGE.totalStars) && legacyCorrect > 0) {
      totalStars = legacyCorrect * 2;
      localStorage.setItem(STORAGE.totalStars, String(totalStars));
    }
    totalStars = Number(localStorage.getItem(STORAGE.totalStars) || totalStars);
  }

  function initPathSvg() {
    const pathEl = $("#mapPath");
    if (pathEl) pathEl.setAttribute("d", PATH_D);
  }

  function hideLoader() {
    const loader = $("#loader");
    document.body.classList.remove("is-loading");
    if (loader) loader.classList.add("hidden");
  }

  function init() {
    document.body.classList.add("is-loading");
    syncFromLegacyStorage();
    initPathSvg();
    spawnAmbientParticles();
    bindControls();
    updateHud();
    syncFromLegacyStorage();

    const loaderBar = $("#loaderBar");
    const logoImg = $("#loaderLogo");
    const bgImg = $("#worldmapBg");

    if (logoImg) logoImg.src = ASSETS.logo;
    if (bgImg) bgImg.src = ASSETS.worldmap;

    const urls = collectPreloadUrls();

    preloadImages(urls, (ratio) => {
      if (loaderBar) loaderBar.style.width = Math.round(ratio * 100) + "%";
    }).then(() => {
      hideLoader();
      renderWorldNodes();
      checkPendingUnlock();
    });

    document.addEventListener(
      "pointerdown",
      () => unlockAudio(),
      { once: true }
    );
  }

  function selectWorld(worldId) {
    const lessonKeys = { dino: "dino", hamster: "ham", block: "block", ocean: "sea", star: "star" };
    const key = lessonKeys[worldId] || worldId || "dino";
    const index = WORLDS.findIndex((w) => w.id === worldId || w.lessonKey === key);
    const world = WORLDS[index >= 0 ? index : 0];
    if (!isWorldUnlocked(world ? WORLDS.indexOf(world) : 0)) {
      showToast("먼저 이전 월드를 완료해 주세요!");
      return;
    }
    enterWorld(world, index >= 0 ? index : 0);
  }

  /** 외부(lesson)에서 호출 가능 */
  window.YoonhoWorldMap = {
    selectWorld,
    WORLDS,
    completeStage(stageIndex) {
      const idx = clampStage(stageIndex);
      const completed = getCompletedStages();
      if (!completed.includes(idx)) {
        completed.push(idx);
        setCompletedStages(completed);
      }

      if (idx < WORLDS.length - 1) {
        const next = idx + 1;
        if (next > unlockedStage) {
          localStorage.setItem(STORAGE.pendingUnlock, String(next));
          localStorage.setItem(STORAGE.unlockedStage, String(next));
        }
      }
    },
    addStars(n) {
      totalStars += n;
      localStorage.setItem(STORAGE.totalStars, String(totalStars));
    },
    getCharacterPath(worldId, expression) {
      const world = WORLDS.find((w) => w.id === worldId);
      if (!world) return "";
      return world.expressions[expression] || world.expressions.default;
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
