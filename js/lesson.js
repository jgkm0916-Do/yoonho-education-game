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
  const NS = "http://www.w3.org/2000/svg";
  const MODE_ORDER = ["order-tap", "read-along", "trace", "assemble"];

  function getModeLabels() {
    const orderLabel = worldKey === "ham" ? "모음 순서" : "자음 순서";
    return {
      "order-tap": orderLabel,
      "read-along": "따라 읽기",
      trace: "따라쓰기",
      assemble: "끌어서 만들기",
    };
  }

  let worldKey = YoonhoProgress.normalizeWorldKey(params.get("world") || "dino");
  let step = Math.max(1, Math.min(5, Number(params.get("step")) || 1));
  let bankWorld = "dino";
  let items = [];
  let meta;
  let stepTitles;
  let hasModeTabs = false;
  let playMode = "order-tap";
  let doneModes = {
    "order-tap": false,
    "read-along": false,
    trace: false,
    assemble: false,
  };

  function resolveSession() {
    const urlWorld = params.get("world");
    const urlStep = params.get("step");
    bankWorld = YoonhoQuestionBank.normalizeBankWorld(
      urlWorld || localStorage.getItem(STORAGE.currentWorld) || "dino"
    );
    const bankLevel = Number(urlStep || localStorage.getItem(STORAGE.currentLevel) || 1);
    step = Math.max(1, Math.min(5, bankLevel));
    worldKey = YoonhoProgress.normalizeWorldKey(urlWorld || bankWorld);
    meta = YoonhoProgress.WORLD_META[worldKey];
    stepTitles = YoonhoProgress.STEP_TITLES[worldKey];
    hasModeTabs = YoonhoQuestionBank.isStrokePracticeLevel(bankWorld, step);

    const urlMode = params.get("mode");
    if (MODE_ORDER.indexOf(urlMode) >= 0) playMode = urlMode;
    else playMode = "order-tap";

    localStorage.setItem(STORAGE.currentWorld, bankWorld);
    localStorage.setItem(STORAGE.currentLevel, String(step));
    startModeSession(playMode, false);
    return { bankWorld, bankLevel: step };
  }

  function startModeSession(mode, doRender) {
    playMode = MODE_ORDER.indexOf(mode) >= 0 ? mode : "order-tap";
    items = hasModeTabs
      ? YoonhoQuestionBank.loadQuestions(bankWorld, step, SESSION_SIZE, playMode)
      : YoonhoQuestionBank.loadQuestions(bankWorld, step, SESSION_SIZE);
    index = 0;
    correctCount = 0;
    lessonFinished = false;
    advancing = false;
    syncModeTabs();
    updateModeDescription();
    if (doRender) {
      $("completeOverlay").classList.remove("show");
      $("reward").classList.remove("show");
      render();
    }
  }

  function syncModeTabs() {
    const tabs = $("modeTabs");
    if (!tabs) return;
    if (!hasModeTabs) {
      tabs.hidden = true;
      return;
    }
    tabs.hidden = false;
    const labels = getModeLabels();
    tabs.querySelectorAll(".mode-tab").forEach((btn) => {
      const mode = btn.dataset.mode;
      if (labels[mode]) btn.textContent = labels[mode];
      btn.classList.toggle("is-active", mode === playMode);
    });
  }

  function updateModeDescription() {
    if (!stepTitles) return;
    const base = stepTitles[step - 1] || "";
    const labels = getModeLabels();
    if (hasModeTabs) {
      $("lessonDesc").textContent = (labels[playMode] || "") + " · " + base;
    } else {
      $("lessonDesc").textContent = base;
    }
  }

  function nextUndoneMode() {
    for (let i = 0; i < MODE_ORDER.length; i++) {
      const m = MODE_ORDER[i];
      if (!doneModes[m]) return m;
    }
    return null;
  }

  let index = 0;
  let correctCount = 0;
  let lessonFinished = false;
  let audioCtx = null;
  let soundEnabled = localStorage.getItem(STORAGE.soundEnabled) !== "false";
  let advancing = false;
  let interactCleanup = null;

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

  function svgEl(name, attrs) {
    const el = document.createElementNS(NS, name);
    if (attrs) {
      Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
    }
    return el;
  }

  function pathStartPoint(d) {
    const m = /M\s*([-\d.]+)\s+([-\d.]+)/.exec(d);
    if (!m) return { x: 50, y: 50 };
    return { x: Number(m[1]), y: Number(m[2]) };
  }

  function pathEndPoint(d) {
    const nums = d.match(/-?\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 2) return pathStartPoint(d);
    return { x: Number(nums[nums.length - 2]), y: Number(nums[nums.length - 1]) };
  }

  /** 시작점이 겹쳐도 번호가 안 가리도록, 획 안쪽(약 18%)에 번호 위치 */
  function strokeNumberPoint(pathEl, pathD) {
    try {
      const len = pathEl.getTotalLength();
      if (len > 1) return pathEl.getPointAtLength(Math.min(len * 0.18, 14));
    } catch (_) {}
    const a = pathStartPoint(pathD);
    const b = pathEndPoint(pathD);
    return { x: a.x + (b.x - a.x) * 0.18, y: a.y + (b.y - a.y) * 0.18 };
  }

  function samplePath(pathEl, samples) {
    const len = pathEl.getTotalLength();
    const pts = [];
    const n = Math.max(8, samples || 24);
    for (let i = 0; i <= n; i++) {
      pts.push(pathEl.getPointAtLength((len * i) / n));
    }
    return { pts: pts, len: len };
  }

  function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function isInteractive(item) {
    return item.type === "trace" || item.type === "assemble";
  }

  function isOrderTap(item) {
    return item.type === "order-tap" || (item.type === "mix" && Array.isArray(item.cards));
  }

  function isReadAlong(item) {
    return item.type === "read-along" || (item.type === "mix" && item.name && item.q && !item.cards);
  }

  function isLadder(item) {
    return item.type === "ladder" || (item.type === "mix" && Array.isArray(item.sequence));
  }

  function isStrokeSee(item) {
    if (isInteractive(item) || isLadder(item) || isOrderTap(item) || isReadAlong(item)) return false;
    if (!item || !item.jamo || !(item.choices && item.choices.length)) return false;
    return item.type === "stroke-see";
  }

  function renderStrokePreview(jamo) {
    const data = YoonhoStrokeData.getJamo(jamo);
    const play = $("playArea");
    play.hidden = false;
    play.innerHTML = "";
    if (!data) return;

    const board = document.createElement("div");
    board.className = "stroke-preview";
    const svg = svgEl("svg", { viewBox: "0 0 100 100" });

    data.strokes.forEach((s, i) => {
      const path = svgEl("path", { d: s.path, class: "preview-stroke" });
      svg.appendChild(path);
      const pos = strokeNumberPoint(path, s.path);
      svg.appendChild(
        svgEl("circle", {
          cx: pos.x,
          cy: pos.y,
          r: 7,
          class: "stroke-num-bg",
        })
      );
      const num = svgEl("text", {
        x: pos.x,
        y: pos.y + 5,
        class: "stroke-num",
        "text-anchor": "middle",
      });
      num.textContent = String(i + 1);
      svg.appendChild(num);
    });

    board.appendChild(svg);
    play.appendChild(board);
  }

  function renderLadder(item) {
    const play = $("playArea");
    play.hidden = false;
    play.innerHTML = "";

    const seq = (item.sequence || []).slice();
    const full = item.fullSequence || [];
    const blankIndices = (item.blankIndices || []).slice().sort((a, b) => a - b);

    const wrap = document.createElement("div");
    wrap.className = "cloud-path";
    wrap.innerHTML = '<div class="cloud-path-sky" aria-hidden="true"></div>';

    const row = document.createElement("div");
    row.className = "cloud-path-row";

    const jumper = document.createElement("div");
    jumper.className = "cloud-jumper";
    jumper.setAttribute("aria-hidden", "true");
    jumper.textContent = "⭐";
    row.appendChild(jumper);

    seq.forEach((ch, i) => {
      if (i > 0) {
        const bridge = document.createElement("div");
        bridge.className = "cloud-bridge";
        bridge.setAttribute("aria-hidden", "true");
        bridge.innerHTML = '<span class="cloud-bridge-dots"></span>';
        row.appendChild(bridge);
      }

      const step = document.createElement("div");
      step.className = "cloud-step";
      step.dataset.index = String(i);

      const cloud = document.createElement("div");
      cloud.className = "cloud-bubble";
      if (ch == null) {
        step.classList.add("is-blank");
        cloud.innerHTML = '<span class="ladder-slot">?</span>';
      } else {
        cloud.innerHTML = '<span class="ladder-char">' + ch + "</span>";
      }
      step.appendChild(cloud);

      const label = document.createElement("div");
      label.className = "cloud-label";
      if (i === 0) label.textContent = "시작";
      else if (i === seq.length - 1) label.textContent = "끝";
      else label.textContent = String(i + 1);
      step.appendChild(label);

      row.appendChild(step);
    });

    wrap.appendChild(row);
    const hint = document.createElement("div");
    hint.className = "trace-hint";
    hint.textContent = "빈 구름에 들어갈 글자를 고르세요";
    play.appendChild(wrap);
    play.appendChild(hint);

    let jumpTimer = null;

    function placeJumperOnStep(stepIndex, hopping) {
      const step = row.querySelector('.cloud-step[data-index="' + stepIndex + '"]');
      if (!step) return;
      const bubble = step.querySelector(".cloud-bubble");
      if (!bubble) return;
      const rowRect = row.getBoundingClientRect();
      const bubbleRect = bubble.getBoundingClientRect();
      const x = bubbleRect.left - rowRect.left + bubbleRect.width / 2;
      const y = bubbleRect.top - rowRect.top - 6;
      jumper.style.left = x + "px";
      jumper.style.top = y + "px";
      jumper.classList.toggle("is-hopping", !!hopping);
    }

    function parkStarOnBlank() {
      const cur = currentBlankIndex();
      const target = cur >= 0 ? cur : seq.length - 1;
      placeJumperOnStep(target, false);
      jumper.classList.add("is-waiting");
    }

    function currentBlankIndex() {
      for (let b = 0; b < blankIndices.length; b++) {
        const idx = blankIndices[b];
        if (seq[idx] == null) return idx;
      }
      return -1;
    }

    function refreshSteps() {
      const cur = currentBlankIndex();
      row.querySelectorAll(".cloud-step").forEach((step) => {
        const i = Number(step.dataset.index);
        step.classList.toggle("is-active", i === cur);
        const bubble = step.querySelector(".cloud-bubble");
        if (!bubble) return;
        if (seq[i] == null) {
          step.classList.add("is-blank");
          bubble.innerHTML = '<span class="ladder-slot">?</span>';
        } else {
          step.classList.remove("is-blank");
          bubble.innerHTML = '<span class="ladder-char">' + seq[i] + "</span>";
        }
      });
      hint.textContent = cur < 0 ? "완성!" : "빈 구름에 들어갈 글자를 고르세요";
      parkStarOnBlank();
    }

    // 레이아웃 안정화 후 별은 물음표 위에만
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        refreshSteps();
      });
    });

    const box = $("choices");
    box.classList.remove("hidden-choices");
    box.innerHTML = "";
    (item.choices || []).forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.textContent = c;
      btn.onclick = () => {
        if (advancing) return;
        unlockAudio();
        const cur = currentBlankIndex();
        if (cur < 0) return;
        const expected = full[cur];
        if (c === expected) {
          seq[cur] = c;
          btn.disabled = true;
          btn.classList.add("correct");
          refreshSteps();
          speakText(c);
          if (currentBlankIndex() < 0) finishInteractive(true);
        } else {
          btn.classList.add("wrong");
          setTimeout(() => btn.classList.remove("wrong"), 450);
          hint.textContent = "왼쪽부터 순서를 다시 보세요!";
          speakText("다시 생각해 보세요");
        }
      };
      box.appendChild(btn);
    });

    interactCleanup = function () {
      if (jumpTimer) clearInterval(jumpTimer);
      jumpTimer = null;
      box.innerHTML = "";
    };
  }

  function renderOrderTap(item) {
    const play = $("playArea");
    play.hidden = false;
    play.innerHTML = "";
    $("choices").classList.add("hidden-choices");
    $("choices").innerHTML = "";

    const cards = (item.cards || []).slice();
    let next = 0;

    const grid = document.createElement("div");
    grid.className = "order-card-grid";
    const hint = document.createElement("div");
    hint.className = "trace-hint";
    hint.textContent = "빛나는 카드를 순서대로 눌러 보세요";

    cards.forEach((ch, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "order-card";
      btn.textContent = ch;
      btn.dataset.index = String(i);
      btn.onclick = () => {
        if (advancing) return;
        unlockAudio();
        const idx = Number(btn.dataset.index);
        if (idx === next) {
          btn.classList.add("is-done");
          btn.classList.remove("is-next");
          speakText(ch);
          next += 1;
          refreshNext();
          if (next >= cards.length) finishInteractive(true);
        } else {
          btn.classList.add("is-wrong");
          setTimeout(() => btn.classList.remove("is-wrong"), 280);
          hint.textContent = "순서를 다시 보세요!";
          speakText("다시 눌러 보세요");
        }
      };
      grid.appendChild(btn);
    });

    function refreshNext() {
      grid.querySelectorAll(".order-card").forEach((btn) => {
        const i = Number(btn.dataset.index);
        btn.classList.toggle("is-next", i === next);
      });
      hint.textContent =
        next >= cards.length
          ? "완성!"
          : "다음 카드: " + cards[next] + " (" + (next + 1) + "/" + cards.length + ")";
    }

    play.appendChild(grid);
    play.appendChild(hint);
    refreshNext();

    interactCleanup = function () {
      play.innerHTML = "";
    };
  }

  function renderReadAlong(item) {
    const play = $("playArea");
    play.hidden = false;
    play.innerHTML = "";
    $("choices").classList.add("hidden-choices");
    $("choices").innerHTML = "";
    $("questionText").classList.remove("hidden-letter");
    $("questionText").textContent = item.q;

    const box = document.createElement("div");
    box.className = "read-along-box";
    const nameEl = document.createElement("div");
    nameEl.className = "read-along-name";
    nameEl.textContent = item.name || "";
    const actions = document.createElement("div");
    actions.className = "read-along-actions";

    const listenBtn = document.createElement("button");
    listenBtn.type = "button";
    listenBtn.className = "read-along-btn listen";
    listenBtn.textContent = "🔊 다시 듣기";
    listenBtn.onclick = () => {
      unlockAudio();
      speakText(item.name || item.speak);
    };

    const doneBtn = document.createElement("button");
    doneBtn.type = "button";
    doneBtn.className = "read-along-btn done";
    doneBtn.textContent = "따라 읽었어요!";
    doneBtn.onclick = () => {
      if (advancing) return;
      unlockAudio();
      finishInteractive(true);
    };

    actions.appendChild(listenBtn);
    actions.appendChild(doneBtn);
    box.appendChild(nameEl);
    box.appendChild(actions);
    play.appendChild(box);

    interactCleanup = function () {
      play.innerHTML = "";
    };
  }

  function clearInteract() {
    if (typeof interactCleanup === "function") {
      interactCleanup();
      interactCleanup = null;
    }
    const play = $("playArea");
    play.hidden = true;
    play.innerHTML = "";
    $("strokeTip").hidden = true;
    $("strokeTip").textContent = "";
    $("questionText").classList.remove("hidden-letter");
    $("choices").classList.remove("hidden-choices");
  }

  function render() {
    advancing = false;
    clearInteract();

    const item = items[index];
    $("questionText").textContent = item.q || "";
    $("promptText").textContent = item.prompt;
    $("reward").classList.remove("show");
    $("progress").style.width = ((index + 1) / items.length) * 100 + "%";
    $("count").textContent = index + 1 + "/" + items.length;
    $("speechBubble").innerHTML = "잘하고<br>있어요!";
    setMascot("happy");

    if (isInteractive(item)) {
      $("choices").classList.add("hidden-choices");
      $("choices").innerHTML = "";
      $("questionText").classList.add("hidden-letter");
      if (item.tip) {
        $("strokeTip").hidden = false;
        $("strokeTip").textContent = "순서: " + item.tip;
      }
      $("playArea").hidden = false;
      if (item.type === "trace") renderTrace(item);
      else renderAssemble(item);
    } else if (isOrderTap(item)) {
      $("questionText").classList.add("hidden-letter");
      $("strokeTip").hidden = true;
      renderOrderTap(item);
    } else if (isReadAlong(item)) {
      $("strokeTip").hidden = true;
      renderReadAlong(item);
    } else if (isLadder(item)) {
      $("questionText").classList.add("hidden-letter");
      $("strokeTip").hidden = true;
      renderLadder(item);
    } else if (isStrokeSee(item)) {
      $("questionText").classList.add("hidden-letter");
      $("strokeTip").hidden = true;
      renderStrokePreview(item.jamo);
      const box = $("choices");
      box.innerHTML = "";
      (item.choices || []).forEach((c) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice";
        btn.textContent = c;
        btn.onclick = () => answer(btn, c, item.answer);
        box.appendChild(btn);
      });
    } else {
      $("strokeTip").hidden = true;
      const box = $("choices");
      box.innerHTML = "";
      (item.choices || []).forEach((c) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice";
        btn.textContent = c;
        btn.onclick = () => answer(btn, c, item.answer);
        box.appendChild(btn);
      });
    }

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

    if (hasModeTabs) doneModes[playMode] = true;

    const result = YoonhoProgress.completeStep(worldKey, step, correctCount, items.length);
    const starStr = "★".repeat(result.bestStars) + "☆".repeat(3 - result.bestStars);
    const labels = getModeLabels();
    const modeLabel = hasModeTabs ? labels[playMode] : step + "단계";

    setMascot("cheer");
    $("completeMsg").textContent =
      meta.name +
      " " +
      modeLabel +
      "을(를) 마쳤어요! (" +
      correctCount +
      "/" +
      items.length +
      " 정답)";
    $("completeStars").textContent = "획득 별: " + starStr;

    if (result.pendingWorldIndex !== null) {
      $("completeMsg").textContent += " 새로운 월드가 열렸어요!";
    }

    const otherBtn = $("completeOtherBtn");
    const otherMode = nextUndoneMode();
    if (hasModeTabs && otherMode) {
      otherBtn.hidden = false;
      otherBtn.textContent = labels[otherMode] + "도 해보기";
      otherBtn.dataset.nextMode = otherMode;
    } else {
      otherBtn.hidden = true;
      delete otherBtn.dataset.nextMode;
    }

    $("completeOverlay").classList.add("show");
    confetti();
    speakText("정말 잘했어! " + modeLabel + "를 완료했어!");
  }

  function advanceAfterFeedback() {
    setTimeout(() => {
      index++;
      if (index >= items.length) {
        completeSession();
        return;
      }
      render();
    }, 2200);
  }

  function finishInteractive(ok) {
    if (advancing) return;
    advancing = true;
    unlockAudio();

    if (ok) {
      correctCount += 1;
      setMascot("happy");
      $("rewardTitle").innerHTML = '우와! <span style="color:#ff55b0">잘했어요!</span>';
      $("rewardText").textContent = "글자 모양이 완성됐어요!";
      $("speechBubble").innerHTML = "정말<br>잘했어!";
      $("reward").classList.add("show");
      confetti();
      speakText("잘했어! 글자를 완성했어요!");
    } else {
      setMascot("sad");
      $("rewardTitle").innerHTML = '아쉬워요! <span style="color:#6b32d6">다시 해봐요</span>';
      $("rewardText").textContent = "괜찮아요. 순서대로 천천히!";
      $("speechBubble").innerHTML = "괜찮아<br>다시 해봐!";
      $("reward").classList.add("show");
      speakText("괜찮아. 다시 해 보자!");
    }

    advanceAfterFeedback();
  }

  function answer(btn, choice, ans) {
    if (advancing) return;
    advancing = true;
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

    advanceAfterFeedback();
  }

  /* ── 따라쓰기 ── */
  function renderTrace(item) {
    const data = YoonhoStrokeData.getJamo(item.jamo || item.q);
    const play = $("playArea");
    if (!data) {
      play.innerHTML = "<p class='trace-hint'>획 데이터가 없어요</p>";
      return;
    }

    const board = document.createElement("div");
    board.className = "stroke-board";
    const svg = svgEl("svg", { viewBox: "0 0 100 100" });
    const hint = document.createElement("div");
    hint.className = "trace-hint";
    const actions = document.createElement("div");
    actions.className = "trace-actions";
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "trace-btn";
    resetBtn.textContent = "다시 쓰기";
    actions.appendChild(resetBtn);

    play.appendChild(board);
    board.appendChild(svg);
    play.appendChild(hint);
    play.appendChild(actions);

    let strokeIndex = 0;
    let drawing = false;
    let drawPath = null;
    let userPts = [];
    let guideMeta = [];
    const donePaths = [];

    function buildGuides() {
      svg.innerHTML = "";
      guideMeta = [];
      donePaths.length = 0;

      const upcomingNums = [];
      let activeNum = null;

      data.strokes.forEach((s, i) => {
        const g = svgEl("path", {
          d: s.path,
          class: i < strokeIndex ? "stroke-done" : i === strokeIndex ? "stroke-active" : "stroke-guide",
        });
        svg.appendChild(g);
        guideMeta.push(samplePath(g, 28));

        // 지금 그릴 획 + 다음 획만 번호 표시 (겹침 방지: 획 안쪽에 배치)
        if (i === strokeIndex || i === strokeIndex + 1) {
          const pos = strokeNumberPoint(g, s.path);
          const gNum = svgEl("g", { class: "stroke-num-group" });
          const bg = svgEl("circle", {
            cx: pos.x,
            cy: pos.y,
            r: i === strokeIndex ? 8 : 6.5,
            class: "stroke-num-bg",
            opacity: i === strokeIndex ? "1" : "0.5",
          });
          const num = svgEl("text", {
            x: pos.x,
            y: pos.y + 5,
            class: "stroke-num",
            "text-anchor": "middle",
          });
          num.textContent = String(i + 1);
          gNum.appendChild(bg);
          gNum.appendChild(num);
          if (i === strokeIndex) activeNum = gNum;
          else upcomingNums.push(gNum);
        }
      });

      upcomingNums.forEach((n) => svg.appendChild(n));
      if (activeNum) svg.appendChild(activeNum);

      const tip = data.strokes[strokeIndex];
      hint.textContent = tip
        ? (strokeIndex + 1) + "번째 획: " + (tip.tip || "따라 쓰세요")
        : "완료!";
      $("speechBubble").innerHTML = tip ? tip.tip.replace(/\s/g, "<br>") : "완료!";
    }

    function svgPoint(evt) {
      const pt = svg.createSVGPoint();
      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 50, y: 50 };
      return pt.matrixTransform(ctm.inverse());
    }

    function onDown(evt) {
      if (advancing || strokeIndex >= data.strokes.length) return;
      evt.preventDefault();
      unlockAudio();
      drawing = true;
      userPts = [];
      const p = svgPoint(evt);
      userPts.push(p);
      drawPath = svgEl("path", { class: "stroke-draw", d: "M " + p.x + " " + p.y });
      svg.appendChild(drawPath);
    }

    function onMove(evt) {
      if (!drawing || !drawPath) return;
      evt.preventDefault();
      const p = svgPoint(evt);
      userPts.push(p);
      drawPath.setAttribute("d", drawPath.getAttribute("d") + " L " + p.x + " " + p.y);
    }

    function scoreStroke(user, guide) {
      if (user.length < 4) return 0;
      let hit = 0;
      const tol = 16;
      guide.pts.forEach((gp) => {
        let best = Infinity;
        for (let i = 0; i < user.length; i++) {
          best = Math.min(best, dist(user[i], gp));
        }
        if (best <= tol) hit++;
      });
      const coverage = hit / guide.pts.length;
      const startOk = dist(user[0], guide.pts[0]) <= 22;
      const endOk = dist(user[user.length - 1], guide.pts[guide.pts.length - 1]) <= 24;
      return coverage * 0.7 + (startOk ? 0.15 : 0) + (endOk ? 0.15 : 0);
    }

    function onUp(evt) {
      if (!drawing) return;
      drawing = false;
      if (evt) evt.preventDefault();
      const guide = guideMeta[strokeIndex];
      const score = guide ? scoreStroke(userPts, guide) : 0;

      if (score >= 0.55) {
        if (drawPath) {
          drawPath.setAttribute("class", "stroke-done");
          donePaths.push(drawPath);
          drawPath = null;
        }
        strokeIndex++;
        if (strokeIndex >= data.strokes.length) {
          hint.textContent = "완성! " + data.char;
          finishInteractive(true);
        } else {
          buildGuides();
          donePaths.forEach((p) => svg.appendChild(p));
          speakText((strokeIndex + 1) + "번째!");
        }
      } else {
        if (drawPath && drawPath.parentNode) drawPath.parentNode.removeChild(drawPath);
        drawPath = null;
        hint.textContent = "핑크 점선 위를 천천히 따라 쓰세요";
        speakText("다시 따라 써 보세요");
      }
    }

    function reset() {
      if (advancing) return;
      strokeIndex = 0;
      drawing = false;
      drawPath = null;
      userPts = [];
      buildGuides();
    }

    buildGuides();

    board.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    resetBtn.addEventListener("click", reset);

    interactCleanup = function () {
      board.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }

  /* ── 선 조립 ── */
  function renderAssemble(item) {
    const data = YoonhoStrokeData.getJamo(item.jamo || item.q);
    const play = $("playArea");
    if (!data) {
      play.innerHTML = "<p class='trace-hint'>획 데이터가 없어요</p>";
      return;
    }

    const board = document.createElement("div");
    board.className = "assemble-board";
    const svg = svgEl("svg", { viewBox: "0 0 100 100" });
    const tray = document.createElement("div");
    tray.className = "piece-tray";
    const hint = document.createElement("div");
    hint.className = "trace-hint";

    play.appendChild(board);
    board.appendChild(svg);
    play.appendChild(hint);
    play.appendChild(tray);

    let nextIndex = 0;
    const slotEls = [];

    function refreshSlots() {
      svg.innerHTML = "";
      slotEls.length = 0;
      data.pieces.forEach((p, i) => {
        const cls = i < nextIndex ? "slot-filled" : i === nextIndex ? "slot-active" : "slot-ghost";
        const path = svgEl("path", { d: p.path, class: cls, "data-idx": String(i) });
        svg.appendChild(path);
        slotEls.push(path);

        if (i === nextIndex) {
          const start = pathStartPoint(p.path);
          svg.appendChild(
            svgEl("circle", { cx: start.x, cy: start.y, r: 7, class: "stroke-num-bg" })
          );
          const num = svgEl("text", {
            x: start.x,
            y: start.y + 5,
            class: "stroke-num",
            "text-anchor": "middle",
          });
          num.textContent = String(i + 1);
          svg.appendChild(num);
        }
      });
      const cur = data.pieces[nextIndex];
      hint.textContent = cur
        ? (nextIndex + 1) + "번째: 「" + (cur.label || "선") + "」 조각을 넣어요"
        : "완성!";
    }

    const order = data.pieces.map((_, i) => i);
    // shuffle tray display but keep correct order for placement
    const trayOrder = order.slice().sort(() => Math.random() - 0.5);

    trayOrder.forEach((pi) => {
      const piece = data.pieces[pi];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "stroke-piece";
      btn.dataset.idx = String(pi);
      btn.setAttribute("aria-label", piece.label || "선");
      const mini = svgEl("svg", { viewBox: "0 0 100 100" });
      mini.appendChild(svgEl("path", { d: piece.path, class: "piece-path" }));
      btn.appendChild(mini);
      tray.appendChild(btn);

      let dragging = false;
      let moved = false;
      let startX = 0;
      let startY = 0;

      function placeIfCorrect() {
        if (advancing || btn.classList.contains("used")) return false;
        const idx = Number(btn.dataset.idx);
        if (idx === nextIndex) {
          btn.classList.add("used");
          nextIndex++;
          refreshSlots();
          if (nextIndex >= data.pieces.length) {
            finishInteractive(true);
          } else {
            speakText((nextIndex + 1) + "번째!");
          }
          return true;
        }
        hint.textContent = "지금은 " + (nextIndex + 1) + "번 선이에요!";
        speakText("순서를 지켜 보세요");
        btn.animate(
          [
            { transform: "translateX(0)" },
            { transform: "translateX(-6px)" },
            { transform: "translateX(6px)" },
            { transform: "translateX(0)" },
          ],
          { duration: 280 }
        );
        return false;
      }

      function onPointerDown(e) {
        if (advancing || btn.classList.contains("used")) return;
        e.preventDefault();
        unlockAudio();
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        btn.classList.add("dragging");
        btn.setPointerCapture(e.pointerId);
      }

      function onPointerMove(e) {
        if (!dragging) return;
        if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 12) moved = true;
      }

      function onPointerUp(e) {
        if (!dragging) return;
        dragging = false;
        btn.classList.remove("dragging");
        try {
          btn.releasePointerCapture(e.pointerId);
        } catch (_) {}

        const rect = board.getBoundingClientRect();
        const overBoard =
          e.clientX >= rect.left - 24 &&
          e.clientX <= rect.right + 24 &&
          e.clientY >= rect.top - 24 &&
          e.clientY <= rect.bottom + 24;

        // 보드 위로 끌어다 놓거나, 짧게 탭하면 배치
        if (overBoard || !moved) placeIfCorrect();
      }

      btn.addEventListener("pointerdown", onPointerDown);
      btn.addEventListener("pointermove", onPointerMove);
      btn.addEventListener("pointerup", onPointerUp);
      btn.addEventListener("pointercancel", onPointerUp);
    });

    refreshSlots();

    interactCleanup = function () {
      tray.innerHTML = "";
    };
  }

  function confetti() {
    const area = $("confetti");
    area.innerHTML = "";
    area.classList.add("show");
    const colors = ["#ff69bc", "#ffe56d", "#6ee7c8", "#9b5cff", "#7cb7ff"];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "%";
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
    updateModeDescription();
    $("levelBadge").textContent = step + "단계";
    $("backBtn").href = "stages.html?world=" + encodeURIComponent(worldKey);
    syncModeTabs();

    setMascot("happy");

    $("soundBtn").addEventListener("click", () => {
      unlockAudio();
      speakQuestion();
    });

    $("completeBtn").addEventListener("click", () => {
      window.location.href = "stages.html?world=" + encodeURIComponent(worldKey);
    });

    $("completeOtherBtn").addEventListener("click", () => {
      const next = $("completeOtherBtn").dataset.nextMode || "read-along";
      startModeSession(next, true);
    });

    $("modeTabs").addEventListener("click", (e) => {
      const btn = e.target.closest(".mode-tab");
      if (!btn || !hasModeTabs || advancing) return;
      const mode = btn.dataset.mode;
      if (!mode || mode === playMode) return;
      if (index > 0 && !lessonFinished) {
        const ok = window.confirm("지금 하던 놀이를 멈추고 다른 탭으로 갈까요?");
        if (!ok) return;
      }
      startModeSession(mode, true);
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
