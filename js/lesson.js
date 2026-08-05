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
  const MODE_LABELS = {
    trace: "따라쓰기",
    assemble: "끌어서 만들기",
  };

  let worldKey = YoonhoProgress.normalizeWorldKey(params.get("world") || "dino");
  let step = Math.max(1, Math.min(5, Number(params.get("step")) || 1));
  let bankWorld = "dino";
  let items = [];
  let meta;
  let stepTitles;
  let hasModeTabs = false;
  let playMode = "trace";
  let doneModes = { trace: false, assemble: false };

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
    if (urlMode === "assemble" || urlMode === "trace") playMode = urlMode;
    else playMode = "trace";

    localStorage.setItem(STORAGE.currentWorld, bankWorld);
    localStorage.setItem(STORAGE.currentLevel, String(step));
    startModeSession(playMode, false);
    return { bankWorld, bankLevel: step };
  }

  function startModeSession(mode, doRender) {
    playMode = mode === "assemble" ? "assemble" : "trace";
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
    tabs.querySelectorAll(".mode-tab").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mode === playMode);
    });
  }

  function updateModeDescription() {
    if (!stepTitles) return;
    const base = stepTitles[step - 1] || "";
    if (hasModeTabs) {
      $("lessonDesc").textContent = MODE_LABELS[playMode] + " · " + base;
    } else {
      $("lessonDesc").textContent = base;
    }
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

  /** 선 그림 보여 주고 객관식으로 글자 고르기 */
  function isStrokeSee(item) {
    if (isInteractive(item)) return false;
    if (!item || !item.jamo || !(item.choices && item.choices.length)) return false;
    return item.type === "stroke-see" || item.type === "mix";
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
    const modeLabel = hasModeTabs ? MODE_LABELS[playMode] : step + "단계";

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
    const otherMode = playMode === "trace" ? "assemble" : "trace";
    if (hasModeTabs && !doneModes[otherMode]) {
      otherBtn.hidden = false;
      otherBtn.textContent = MODE_LABELS[otherMode] + "도 해보기";
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
      const next = $("completeOtherBtn").dataset.nextMode || "assemble";
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
