/**
 * 윤호의 한글 월드 — 진행도 / localStorage
 */
(function (global) {
  "use strict";

  const WORLD_KEYS = ["dino", "ham", "block", "sea", "star"];

  const MAP_WORLD_TO_KEY = {
    dino: "dino",
    ham: "ham",
    hamster: "ham",
    block: "block",
    sea: "sea",
    ocean: "sea",
    star: "star",
  };

  const KEY_TO_MAP_ID = {
    dino: "dino",
    ham: "hamster",
    block: "block",
    sea: "ocean",
    star: "star",
  };

  const STORAGE = {
    unlockedStage: "unlockedStage",
    pendingUnlock: "pendingUnlock",
    totalStars: "totalStars",
    worldProgress: "worldProgress",
    worldStars: "worldStars",
    soundEnabled: "soundEnabled",
    lastWorld: "lastWorld",
    currentWorld: "currentWorld",
    currentLevel: "currentLevel",
  };

  const WORLD_META = {
    dino: { name: "공룡숲", index: 0 },
    ham: { name: "햄찌마을", index: 1 },
    block: { name: "블록광산", index: 2 },
    sea: { name: "바다왕국", index: 3 },
    star: { name: "별의성", index: 4 },
  };

  const STEP_TITLES = {
    dino: [
      "자음 모양 익히기",
      "자음 소리 듣고 고르기",
      "같은 자음 찾기",
      "자음 순서 맞추기",
      "자음 종합 미션",
    ],
    ham: [
      "모음 모양 익히기",
      "모음 소리 듣고 고르기",
      "같은 모음 찾기",
      "모음 순서 맞추기",
      "모음 종합 미션",
    ],
    block: [
      "자음+모음 조합하기",
      "글자 만들기",
      "소리 듣고 글자 고르기",
      "글자 짝 맞추기",
      "글자 종합 미션",
    ],
    sea: [
      "쉬운 단어 읽기",
      "그림 보고 단어 고르기",
      "소리 듣고 단어 고르기",
      "단어 완성하기",
      "단어 종합 미션",
    ],
    star: [
      "자음 복습",
      "모음 복습",
      "글자 복습",
      "단어 복습",
      "최종 모험 미션",
    ],
  };

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeWorldKey(key) {
    return MAP_WORLD_TO_KEY[key] || key || "dino";
  }

  function getWorldProgressMap() {
    const defaults = { dino: 1, ham: 1, block: 1, sea: 1, star: 1 };
    return { ...defaults, ...readJson(STORAGE.worldProgress, {}) };
  }

  function saveWorldProgressMap(map) {
    writeJson(STORAGE.worldProgress, map);
  }

  function getWorldStarsMap() {
    return readJson(STORAGE.worldStars, {});
  }

  function saveWorldStarsMap(map) {
    writeJson(STORAGE.worldStars, map);
  }

  function starKey(worldKey, step) {
    return worldKey + "-" + step;
  }

  function getUnlockedMapIndex() {
    return Number(localStorage.getItem(STORAGE.unlockedStage) || 0);
  }

  function setUnlockedMapIndex(index) {
    localStorage.setItem(STORAGE.unlockedStage, String(Math.max(0, Math.min(index, WORLD_KEYS.length - 1))));
  }

  function isMapWorldUnlocked(mapIndex) {
    return mapIndex <= getUnlockedMapIndex();
  }

  function getWorldProgress(worldKey) {
    const key = normalizeWorldKey(worldKey);
    const map = getWorldProgressMap();
    return map[key] || 1;
  }

  function isStepUnlocked(worldKey, step) {
    const key = normalizeWorldKey(worldKey);
    if (!isMapWorldUnlocked(WORLD_META[key].index)) return false;
    return step <= getWorldProgress(key);
  }

  function getStepStars(worldKey, step) {
    const map = getWorldStarsMap();
    return map[starKey(normalizeWorldKey(worldKey), step)] || 0;
  }

  function isStepCompleted(worldKey, step) {
    const key = normalizeWorldKey(worldKey);
    return getWorldProgress(key) > step || getStepStars(key, step) > 0;
  }

  function isWorldFullyComplete(worldKey) {
    return getWorldProgress(normalizeWorldKey(worldKey)) >= 6;
  }

  function calcStars(correct, total) {
    if (correct >= total) return 3;
    if (correct >= 3) return 2;
    if (correct >= 1) return 1;
    return 0;
  }

  function getTotalStars() {
    const map = getWorldStarsMap();
    return Object.values(map).reduce((sum, n) => sum + Number(n || 0), 0);
  }

  function syncTotalStars() {
    const total = getTotalStars();
    localStorage.setItem(STORAGE.totalStars, String(total));
    return total;
  }

  function completeStep(worldKey, step, correctCount, totalQuestions) {
    const key = normalizeWorldKey(worldKey);
    const stars = calcStars(correctCount, totalQuestions);

    const starMap = getWorldStarsMap();
    const sk = starKey(key, step);
    const prev = starMap[sk] || 0;
    starMap[sk] = Math.max(prev, stars);
    saveWorldStarsMap(starMap);

    const progress = getWorldProgressMap();
    if (step >= progress[key]) {
      progress[key] = Math.min(step + 1, 6);
      saveWorldProgressMap(progress);
    }

    const mapIndex = WORLD_META[key].index;
    let pendingWorldIndex = null;

    if (isWorldFullyComplete(key) && mapIndex < WORLD_KEYS.length - 1) {
      const nextMap = mapIndex + 1;
      const unlocked = getUnlockedMapIndex();
      if (nextMap > unlocked) {
        setUnlockedMapIndex(nextMap);
        localStorage.setItem(STORAGE.pendingUnlock, String(nextMap));
        pendingWorldIndex = nextMap;
      }
    }

    syncTotalStars();

    return { stars, bestStars: starMap[sk], pendingWorldIndex };
  }

  function resetAll() {
    localStorage.removeItem(STORAGE.unlockedStage);
    localStorage.removeItem(STORAGE.pendingUnlock);
    localStorage.removeItem(STORAGE.worldProgress);
    localStorage.removeItem(STORAGE.worldStars);
    localStorage.removeItem(STORAGE.totalStars);
    localStorage.removeItem("completedStages");
    localStorage.removeItem("correct");
    localStorage.removeItem("solved");
    setUnlockedMapIndex(0);
    saveWorldProgressMap({ dino: 1, ham: 1, block: 1, sea: 1, star: 1 });
    saveWorldStarsMap({});
    syncTotalStars();
    localStorage.setItem(STORAGE.lastWorld, "dino");
  }

  function getStepList(worldKey) {
    const key = normalizeWorldKey(worldKey);
    const titles = STEP_TITLES[key] || STEP_TITLES.dino;
    return titles.map((title, i) => {
      const step = i + 1;
      return {
        step,
        title,
        unlocked: isStepUnlocked(key, step),
        completed: isStepCompleted(key, step),
        stars: getStepStars(key, step),
      };
    });
  }

  global.YoonhoProgress = {
    STORAGE,
    WORLD_KEYS,
    WORLD_META,
    STEP_TITLES,
    MAP_WORLD_TO_KEY,
    KEY_TO_MAP_ID,
    normalizeWorldKey,
    getUnlockedMapIndex,
    setUnlockedMapIndex,
    isMapWorldUnlocked,
    getWorldProgress,
    isStepUnlocked,
    isStepCompleted,
    isWorldFullyComplete,
    getStepStars,
    getStepList,
    getTotalStars,
    syncTotalStars,
    completeStep,
    calcStars,
    resetAll,
  };
})(typeof window !== "undefined" ? window : globalThis);
