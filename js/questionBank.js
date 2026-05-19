/**
 * 윤호의 한글 월드 — 문제 은행
 * questionBank[world].level1 ~ level5
 */
(function (global) {
  "use strict";

  const CONSONANTS = [
    { c: "ㄱ", name: "기역" },
    { c: "ㄴ", name: "니은" },
    { c: "ㄷ", name: "디귿" },
    { c: "ㄹ", name: "리을" },
    { c: "ㅁ", name: "미음" },
    { c: "ㅂ", name: "비읍" },
    { c: "ㅅ", name: "시옷" },
    { c: "ㅇ", name: "이응" },
    { c: "ㅈ", name: "지읒" },
    { c: "ㅊ", name: "치읓" },
    { c: "ㅋ", name: "키읔" },
    { c: "ㅌ", name: "티읕" },
  ];

  const VOWELS = [
    { v: "ㅏ", name: "아" },
    { v: "ㅑ", name: "야" },
    { v: "ㅓ", name: "어" },
    { v: "ㅕ", name: "여" },
    { v: "ㅗ", name: "오" },
    { v: "ㅛ", name: "요" },
    { v: "ㅜ", name: "우" },
    { v: "ㅠ", name: "유" },
    { v: "ㅡ", name: "으" },
    { v: "ㅣ", name: "이" },
  ];

  const SYLLABLES = [
    { s: "가", parts: "ㄱ+ㅏ" },
    { s: "나", parts: "ㄴ+ㅏ" },
    { s: "다", parts: "ㄷ+ㅏ" },
    { s: "라", parts: "ㄹ+ㅏ" },
    { s: "마", parts: "ㅁ+ㅏ" },
    { s: "바", parts: "ㅂ+ㅏ" },
    { s: "사", parts: "ㅅ+ㅏ" },
    { s: "하", parts: "ㅎ+ㅏ" },
    { s: "고", parts: "ㄱ+ㅗ" },
    { s: "모", parts: "ㅁ+ㅗ" },
    { s: "주", parts: "ㅈ+ㅜ" },
    { s: "해", parts: "ㅎ+ㅐ" },
  ];

  const WORDS = [
    { w: "사과", emoji: "🍎", speak: "사과" },
    { w: "나무", emoji: "🌳", speak: "나무" },
    { w: "바다", emoji: "🌊", speak: "바다" },
    { w: "고래", emoji: "🐋", speak: "고래" },
    { w: "별", emoji: "⭐", speak: "별" },
    { w: "달", emoji: "🌙", speak: "달" },
    { w: "해", emoji: "☀️", speak: "해" },
    { w: "꿈", emoji: "💤", speak: "꿈" },
    { w: "밥", emoji: "🍚", speak: "밥" },
    { w: "꽃", emoji: "🌸", speak: "꽃" },
    { w: "강아지", emoji: "🐶", speak: "강아지" },
    { w: "햄스터", emoji: "🐹", speak: "햄스터" },
  ];

  const BANK_WORLD_KEYS = {
    dino: "dino",
    ham: "hamster",
    hamster: "hamster",
    block: "block",
    sea: "ocean",
    ocean: "ocean",
    star: "star",
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickChoices(answer, pool, count) {
    const others = pool.filter((x) => x !== answer);
    return shuffle([answer, ...shuffle(others).slice(0, count - 1)]);
  }

  function q(item) {
    return {
      q: item.q,
      prompt: item.prompt,
      choices: item.choices,
      answer: item.answer,
      speak: item.speak || item.prompt,
      type: item.type || "",
    };
  }

  function emptyLevels() {
    return { level1: [], level2: [], level3: [], level4: [], level5: [] };
  }

  function normalizeBankWorld(worldKey) {
    return BANK_WORLD_KEYS[worldKey] || worldKey || "dino";
  }

  function levelKey(level) {
    const n = Math.max(1, Math.min(5, Number(level) || 1));
    return "level" + n;
  }

  /* ── 공룡숲: 단계별 완전 분리 ── */
  function buildDino() {
    const bank = emptyLevels();
    const allC = CONSONANTS.map((x) => x.c);
    const allNames = CONSONANTS.map((x) => x.name);

    // 1단계: 글자 보고 이름 맞추기
    CONSONANTS.forEach((item) => {
      bank.level1.push(
        q({
          type: "shape",
          q: item.c,
          prompt: item.c + "은(는) 무엇일까요?",
          choices: pickChoices(item.name, allNames, 4),
          answer: item.name,
          speak: item.c + " 글자의 이름은?",
        })
      );
    });

    // 2단계: TTS 소리 듣고 자음 고르기
    CONSONANTS.forEach((item) => {
      bank.level2.push(
        q({
          type: "listen",
          q: "🔊",
          prompt: "소리를 듣고 자음을 고르세요",
          choices: pickChoices(item.c, allC, 4),
          answer: item.c,
          speak: item.name,
        })
      );
    });

    // 3단계: 같은 자음 찾기
    CONSONANTS.forEach((item) => {
      bank.level3.push(
        q({
          type: "match",
          q: item.c,
          prompt: item.c + "와 같은 글자를 고르세요",
          choices: pickChoices(item.c, allC, 4),
          answer: item.c,
          speak: item.c + "와 같은 글자는?",
        })
      );
    });

    // 4단계: 자음 순서 (ㄱ→ㄴ→ㄷ…)
    for (let i = 0; i < CONSONANTS.length; i++) {
      const item = CONSONANTS[i];
      const next = CONSONANTS[(i + 1) % CONSONANTS.length];
      bank.level4.push(
        q({
          type: "order",
          q: item.c + " → ?",
          prompt: item.c + " 다음은?",
          choices: pickChoices(next.c, allC, 4),
          answer: next.c,
          speak: item.c + " 다음 자음은?",
        })
      );
    }

    // 5단계: 1~4단계 혼합
    const mixed = shuffle(
      bank.level1.concat(bank.level2, bank.level3, bank.level4)
    );
    mixed.forEach((item) => {
      bank.level5.push({ ...item, type: "mix", prompt: "종합! " + item.prompt });
    });

    return bank;
  }

  /* ── 햄찌마을: 모음 ── */
  function buildHamster() {
    const bank = emptyLevels();
    const allV = VOWELS.map((x) => x.v);
    const allNames = VOWELS.map((x) => x.name);

    VOWELS.forEach((item) => {
      bank.level1.push(
        q({
          type: "shape",
          q: item.v,
          prompt: item.v + "은(는) 무엇일까요?",
          choices: pickChoices(item.name, allNames, 4),
          answer: item.name,
          speak: item.name,
        })
      );
      bank.level2.push(
        q({
          type: "listen",
          q: "🔊",
          prompt: "소리를 듣고 모음을 고르세요",
          choices: pickChoices(item.v, allV, 4),
          answer: item.v,
          speak: item.name,
        })
      );
      bank.level3.push(
        q({
          type: "match",
          q: item.v,
          prompt: item.v + "와 같은 모음을 고르세요",
          choices: pickChoices(item.v, allV, 4),
          answer: item.v,
        })
      );
    });

    for (let i = 0; i < VOWELS.length; i++) {
      const item = VOWELS[i];
      const next = VOWELS[(i + 1) % VOWELS.length];
      bank.level4.push(
        q({
          type: "order",
          q: item.v + " → ?",
          prompt: item.v + " 다음은?",
          choices: pickChoices(next.v, allV, 4),
          answer: next.v,
        })
      );
    }

    shuffle(bank.level1.concat(bank.level2, bank.level3, bank.level4)).forEach((item) => {
      bank.level5.push({ ...item, type: "mix", prompt: "종합! " + item.prompt });
    });

    return bank;
  }

  /* ── 블록광산 ── */
  function buildBlock() {
    const bank = emptyLevels();
    const allSyl = SYLLABLES.map((x) => x.s);

    SYLLABLES.forEach((item) => {
      bank.level1.push(
        q({
          type: "combine",
          q: item.parts,
          prompt: "자음+모음을 합치면?",
          choices: pickChoices(item.s, allSyl, 4),
          answer: item.s,
          speak: item.parts + " 를 합치면?",
        })
      );
      bank.level2.push(
        q({
          type: "build",
          q: "🧱",
          prompt: "글자를 만들어요: " + item.parts,
          choices: pickChoices(item.s, allSyl, 4),
          answer: item.s,
        })
      );
      bank.level3.push(
        q({
          type: "listen",
          q: "🔊",
          prompt: "소리를 듣고 글자를 고르세요",
          choices: pickChoices(item.s, allSyl, 4),
          answer: item.s,
          speak: item.s,
        })
      );
      bank.level4.push(
        q({
          type: "match",
          q: item.s,
          prompt: item.s + "와 같은 글자를 고르세요",
          choices: pickChoices(item.s, allSyl, 4),
          answer: item.s,
        })
      );
    });

    shuffle(bank.level1.concat(bank.level2, bank.level3, bank.level4)).forEach((item) => {
      bank.level5.push({ ...item, type: "mix", prompt: "종합! " + item.prompt });
    });

    return bank;
  }

  /* ── 바다왕국 ── */
  function buildOcean() {
    const bank = emptyLevels();
    const allW = WORDS.map((x) => x.w);

    WORDS.forEach((item) => {
      bank.level1.push(
        q({
          type: "read",
          q: item.w,
          prompt: "이 단어를 읽어요",
          choices: pickChoices(item.w, allW, 4),
          answer: item.w,
          speak: item.w,
        })
      );
      bank.level2.push(
        q({
          type: "picture",
          q: item.emoji,
          prompt: "그림과 같은 단어는?",
          choices: pickChoices(item.w, allW, 4),
          answer: item.w,
        })
      );
      bank.level3.push(
        q({
          type: "listen",
          q: "🔊",
          prompt: "소리를 듣고 단어를 고르세요",
          choices: pickChoices(item.w, allW, 4),
          answer: item.w,
          speak: item.w,
        })
      );
      bank.level4.push(
        q({
          type: "complete",
          q: item.w.slice(0, 1) + " _",
          prompt: "단어를 완성해요",
          choices: pickChoices(item.w, allW, 4),
          answer: item.w,
          speak: item.w,
        })
      );
    });

    shuffle(bank.level1.concat(bank.level2, bank.level3, bank.level4)).forEach((item) => {
      bank.level5.push({ ...item, type: "mix", prompt: "종합! " + item.prompt });
    });

    return bank;
  }

  /* ── 별의성 ── */
  function buildStar() {
    const bank = emptyLevels();
    const allC = CONSONANTS.map((x) => x.c);
    const allV = VOWELS.map((x) => x.v);
    const allS = SYLLABLES.map((x) => x.s);
    const allW = WORDS.map((x) => x.w);

    CONSONANTS.forEach((item) => {
      bank.level1.push(
        q({
          type: "review-c",
          q: "🌟 " + item.c,
          prompt: "자음 복습: " + item.name,
          choices: pickChoices(item.c, allC, 4),
          answer: item.c,
        })
      );
    });
    VOWELS.forEach((item) => {
      bank.level2.push(
        q({
          type: "review-v",
          q: "🌟 " + item.v,
          prompt: "모음 복습: " + item.name,
          choices: pickChoices(item.v, allV, 4),
          answer: item.v,
        })
      );
    });
    SYLLABLES.forEach((item) => {
      bank.level3.push(
        q({
          type: "review-s",
          q: item.s,
          prompt: "글자 복습",
          choices: pickChoices(item.s, allS, 4),
          answer: item.s,
        })
      );
    });
    WORDS.forEach((item) => {
      bank.level4.push(
        q({
          type: "review-w",
          q: item.emoji,
          prompt: "단어 복습",
          choices: pickChoices(item.w, allW, 4),
          answer: item.w,
        })
      );
      bank.level5.push(
        q({
          type: "final",
          q: "👑 " + item.emoji,
          prompt: "최종 모험!",
          choices: pickChoices(item.w, allW, 4),
          answer: item.w,
          speak: item.w,
        })
      );
    });

    return bank;
  }

  const questionBank = {
    dino: buildDino(),
    hamster: buildHamster(),
    block: buildBlock(),
    ocean: buildOcean(),
    star: buildStar(),
  };

  /** questionBank[world][levelN] 풀 반환 */
  function getLevelPool(worldKey, level) {
    const world = normalizeBankWorld(worldKey);
    const lk = levelKey(level);
    const worldBank = questionBank[world];
    if (!worldBank) return [];
    return worldBank[lk] ? worldBank[lk].slice() : [];
  }

  /** 단계별 문제 5개 랜덤 출제 */
  function loadQuestions(worldKey, level, count) {
    const pool = getLevelPool(worldKey, level);
    if (!pool.length) return [];
    if (pool.length <= count) return shuffle(pool);
    return shuffle(pool).slice(0, count);
  }

  function pickSessionQuestions(worldKey, level, count) {
    return loadQuestions(worldKey, level, count);
  }

  global.YoonhoQuestionBank = {
    questionBank,
    BANK_WORLD_KEYS,
    normalizeBankWorld,
    levelKey,
    getLevelPool,
    loadQuestions,
    pickSessionQuestions,
  };
})(typeof window !== "undefined" ? window : globalThis);
