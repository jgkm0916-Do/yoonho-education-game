/* 글자탐험대 — 미션별 문제 은행 (각 50문항) */
(function (global) {
  const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ".split("");
  const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢ".split("");

  const CONSONANT_NAMES = {
    "ㄱ": "기역", "ㄲ": "쌍기역", "ㄴ": "니은", "ㄷ": "디귿", "ㄸ": "쌍디귿",
    "ㄹ": "리을", "ㅁ": "미음", "ㅂ": "비읍", "ㅃ": "쌍비읍", "ㅅ": "시옷",
    "ㅆ": "쌍시옷", "ㅇ": "이응", "ㅈ": "지읒", "ㅉ": "쌍지읒", "ㅊ": "치읓",
    "ㅋ": "키읔", "ㅌ": "티읕", "ㅍ": "피읖", "ㅎ": "히읗"
  };

  const BASIC_CONSONANTS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
  const EXTRA_CONSONANTS = ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickWrong(pool, answer, count) {
    const wrong = shuffle(pool.filter((x) => x !== answer)).slice(0, count);
    while (wrong.length < count) {
      const extra = pool[Math.floor(Math.random() * pool.length)];
      if (extra !== answer && !wrong.includes(extra)) wrong.push(extra);
    }
    return wrong;
  }

  function combineHangul(cho, jung) {
    const ci = CHO.indexOf(cho);
    const ji = JUNG.indexOf(jung);
    if (ci < 0 || ji < 0) return null;
    return String.fromCharCode(0xac00 + ci * 588 + ji * 28);
  }

  function buildChoices(answer, pool) {
    const wrong = pickWrong(pool, answer, 3);
    return shuffle([answer, ...wrong]);
  }

  function generateDinoQuestions(count = 50) {
    const pool = [...BASIC_CONSONANTS, ...EXTRA_CONSONANTS];
    const base = [];
    pool.forEach((c) => {
      const name = CONSONANT_NAMES[c];
      base.push({
        q: c,
        prompt: `“${name}”은 어디 있을까?`,
        answer: c,
        speak: `${name}은 어디 있을까?`,
        pool
      });
    });
    const prompts = [
      (c, name) => `“${name}”을 골라볼까?`,
      (c, name) => `“${name}” 소리의 글자는?`,
      (c, name) => `“${name}”은 어디 있을까?`,
      (c, name) => `“${name}”을 찾아볼까?`
    ];
    const items = [];
    let round = 0;
    while (items.length < count) {
      const src = base[round % base.length];
      const p = prompts[round % prompts.length](src.q, CONSONANT_NAMES[src.q]);
      items.push({
        q: src.q,
        prompt: p,
        answer: src.answer,
        speak: p.replace(/[“”]/g, ""),
        choices: buildChoices(src.answer, pool)
      });
      round++;
    }
    return items;
  }

  function generateBlockQuestions(count = 50) {
    const pairs = [];
    const vowels = ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅣ", "ㅐ", "ㅔ", "ㅑ", "ㅕ", "ㅛ", "ㅠ"];
    BASIC_CONSONANTS.forEach((cho) => {
      vowels.forEach((jung) => {
        const syllable = combineHangul(cho, jung);
        if (syllable) pairs.push({ cho, jung, syllable });
      });
    });
    const shuffled = shuffle(pairs).slice(0, count);
    const syllablePool = pairs.map((p) => p.syllable);

    return shuffled.map(({ cho, jung, syllable }) => ({
      q: `${cho} + ${jung}`,
      prompt: "합치면 어떤 글자가 될까?",
      answer: syllable,
      speak: `${CONSONANT_NAMES[cho] || cho}과 ${jung}를 합치면 어떤 글자일까?`,
      choices: buildChoices(syllable, syllablePool)
    }));
  }

  const HAM_WORDS = [
    ["🍎", "사과", "사"], ["🌳", "나무", "나"], ["⭐", "별", "별"], ["🍚", "밥", "밥"],
    ["💧", "물", "물"], ["🐱", "고양이", "고"], ["🐶", "강아지", "강"], ["📚", "책", "책"],
    ["✏️", "연필", "연"], ["🎒", "가방", "가"], ["🏫", "학교", "학"], ["👫", "친구", "친"],
    ["👩", "엄마", "엄"], ["👨", "아빠", "아"], ["🌸", "꽃", "꽃"], ["☀️", "해", "해"],
    ["🌙", "달", "달"], ["☁️", "구름", "구"], ["🌧️", "비", "비"], ["❄️", "눈", "눈"],
    ["🌊", "바다", "바"], ["🐟", "물고기", "물"], ["🐦", "새", "새"], ["🦋", "나비", "나"],
    ["🐰", "토끼", "토"], ["🐻", "곰", "곰"], ["🦁", "사자", "사"], ["🐘", "코끼리", "코"],
    ["🚂", "기차", "기"], ["🚗", "자동차", "자"], ["🚌", "버스", "버"], ["🥛", "우유", "우"],
    ["🍞", "빵", "빵"], ["🍪", "과자", "과"], ["🧸", "인형", "인"], ["⚽", "공", "공"],
    ["🎈", "풍선", "풍"], ["🧢", "모자", "모"], ["👟", "신발", "신"], ["👕", "옷", "옷"],
    ["🛏️", "침대", "침"], ["🪑", "의자", "의"], ["🚪", "문", "문"], ["🪟", "창문", "창"],
    ["📱", "전화", "전"], ["⏰", "시계", "시"], ["☂️", "우산", "우"], ["🍉", "수박", "수"],
    ["🍇", "포도", "포"], ["🍓", "딸기", "딸"], ["🥕", "당근", "당"], ["🌽", "옥수수", "옥"],
    ["🍌", "바나나", "바"], ["🐷", "돼지", "돼"], ["🐮", "소", "소"], ["🐔", "닭", "닭"]
  ];

  function generateHamQuestions(count = 50) {
    const list = shuffle(HAM_WORDS).slice(0, count);
    const answerPool = [...new Set(HAM_WORDS.map((w) => w[2]))];
    const fullWordPool = HAM_WORDS.map((w) => w[1]);

    return list.map(([emoji, word, answer], i) => {
      const useFullWord = i % 3 === 2;
      if (useFullWord) {
        return {
          q: emoji,
          prompt: `${word}의 글자는?`,
          answer: word,
          speak: `${word}의 글자는 무엇일까?`,
          choices: buildChoices(word, fullWordPool)
        };
      }
      return {
        q: emoji,
        prompt: `${word}의 첫 글자는?`,
        answer,
        speak: `${word}의 첫 글자는 무엇일까?`,
        choices: buildChoices(answer, answerPool)
      };
    });
  }

  const SEA_WORDS = [
    "고래", "바다", "상어", "파도", "물고기", "조개", "불가사리", "해파리", "갈매기", "등대",
    "모래", "해변", "요트", "돛단배", "잠수함", "산호", "미역", "다시마", "게", "문어",
    "오징어", "낙지", "새우", "게", "바닷가", "섬", "항구", "파랑", "물보라", "인어",
    "보물", "진주", "조개껍데기", "낚시", "그물", "물안경", "튜브", "수영", "서핑", "스노클",
    "해루질", "조개잡이", "갯벌", "갯지렁이", "바다거북", "돌고래", "범고래", "고등어", "멸치", "연어"
  ];

  function similarWord(word) {
    if (word.length < 2) return word + "리";
    const swaps = [
      () => word[0] + "라" + word.slice(2),
      () => word.slice(0, -1) + (word.endsWith("다") ? "라" : "다"),
      () => "바" + word.slice(1),
      () => word.slice(0, 1) + "보" + word.slice(2),
      () => word + "리",
      () => word.slice(1) + word[0]
    ];
    const pick = swaps[Math.floor(Math.random() * swaps.length)];
    const w = pick();
    return w !== word ? w : word + "이";
  }

  function generateSeaQuestions(count = 50) {
    const words = shuffle([...new Set(SEA_WORDS)]).slice(0, count);
    return words.map((word) => {
      const distractors = new Set();
      while (distractors.size < 3) {
        const s = similarWord(word);
        if (s !== word) distractors.add(s);
      }
      const wrong = [...distractors];
      const extraPool = shuffle(SEA_WORDS.filter((w) => w !== word));
      while (wrong.length < 3) wrong.push(extraPool[wrong.length % extraPool.length]);
      return {
        q: word,
        prompt: "같은 단어를 찾아줘!",
        answer: word,
        speak: `${word}와 같은 단어를 찾아줘.`,
        choices: shuffle([word, ...wrong.slice(0, 3)])
      };
    });
  }

  const MISSION_META = [
    { id: "dino", title: "공룡숲", desc: "자음 소리를 듣고 맞는 글자를 골라요.", level: "미션 1", emoji: "🦖", theme: "forest" },
    { id: "block", title: "블록동굴", desc: "자음과 모음을 합쳐 글자를 만들어요.", level: "미션 2", emoji: "🧱", theme: "cave" },
    { id: "ham", title: "햄찌마을", desc: "그림을 보고 단어를 골라요.", level: "미션 3", emoji: "🐹", theme: "village" },
    { id: "sea", title: "바다왕국", desc: "고래상어와 낱말을 읽어요.", level: "미션 4", emoji: "🦈", theme: "sea" }
  ];

  const QUESTIONS_PER_MISSION = 50;

  function buildLessons() {
    const gens = {
      dino: generateDinoQuestions,
      block: generateBlockQuestions,
      ham: generateHamQuestions,
      sea: generateSeaQuestions
    };
    const lessons = {};
    MISSION_META.forEach((m) => {
      lessons[m.id] = {
        ...m,
        items: gens[m.id](QUESTIONS_PER_MISSION)
      };
    });
    return lessons;
  }

  global.LetterQuest = {
    MISSION_ORDER: MISSION_META.map((m) => m.id),
    MISSION_META,
    QUESTIONS_PER_MISSION,
    buildLessons
  };
})(typeof window !== "undefined" ? window : globalThis);
