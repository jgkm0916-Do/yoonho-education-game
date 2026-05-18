/* 글자탐험대 — 미션 지도 & 학습 진행 */
const lessons = LetterQuest.buildLessons();
const MISSION_ORDER = LetterQuest.MISSION_ORDER;
const TOTAL = LetterQuest.QUESTIONS_PER_MISSION;

let currentKey = "dino";
let current = lessons.dino;
let index = 0;
let solved = Number(localStorage.getItem("solved") || 0);
let correct = Number(localStorage.getItem("correct") || 0);
let audioCtx = null;
let soundUnlocked = false;
let autoSpeak = true;
let pendingNextMission = null;

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem("missionProgress") || "{}");
  } catch {
    return {};
  }
}

function saveProgress(data) {
  localStorage.setItem("missionProgress", JSON.stringify(data));
}

function getUnlocked() {
  try {
    return JSON.parse(localStorage.getItem("unlockedMissions") || '["dino"]');
  } catch {
    return ["dino"];
  }
}

function setUnlocked(list) {
  localStorage.setItem("unlockedMissions", JSON.stringify(list));
}

function missionState(id) {
  const unlocked = getUnlocked();
  const prog = loadProgress();
  if (!unlocked.includes(id)) return "locked";
  if (prog[id]?.completed) return "completed";
  return "open";
}

function getMissionIndex(id) {
  const prog = loadProgress();
  if (prog[id]?.completed) return TOTAL;
  return Math.min(prog[id]?.index || 0, TOTAL);
}

function saveMissionIndex(id, idx) {
  const prog = loadProgress();
  prog[id] = { ...(prog[id] || {}), index: idx };
  saveProgress(prog);
}

function markMissionComplete(id) {
  const prog = loadProgress();
  prog[id] = { index: TOTAL, completed: true };
  saveProgress(prog);
  const unlocked = getUnlocked();
  const pos = MISSION_ORDER.indexOf(id);
  if (pos >= 0 && pos < MISSION_ORDER.length - 1) {
    const next = MISSION_ORDER[pos + 1];
    if (!unlocked.includes(next)) {
      unlocked.push(next);
      setUnlocked(unlocked);
    }
    pendingNextMission = next;
  } else {
    pendingNextMission = null;
  }
}

function applyTheme(theme) {
  document.body.className = theme ? "theme-" + theme : "";
}

function renderMissionMap() {
  const list = document.getElementById("missionList");
  if (!list) return;
  list.innerHTML = "";
  const unlocked = getUnlocked();

  LetterQuest.MISSION_META.forEach((meta) => {
    const state = missionState(meta.id);
    const idx = getMissionIndex(meta.id);
    const btn = document.createElement("button");
    btn.className = "mission-node" + (state === "locked" ? " locked" : state === "completed" ? " completed" : "");
    btn.dataset.theme = meta.theme;
    btn.disabled = state === "locked";

    const progressText =
      state === "completed"
        ? `${TOTAL}/${TOTAL}`
        : state === "locked"
          ? "🔒 잠김"
          : `${idx}/${TOTAL}`;

    btn.innerHTML = `
      <div class="mission-icon">${meta.emoji}</div>
      <div>
        <h3>${meta.title}</h3>
        <p>${meta.desc}</p>
      </div>
      <div class="mission-progress">${state === "locked" ? '<span class="lock-badge">🔒</span>' : progressText}</div>
    `;

    if (state !== "locked") {
      btn.onclick = () => openLesson(meta.id);
    }
    list.appendChild(btn);
  });

  const active = MISSION_ORDER.find((id) => unlocked.includes(id) && missionState(id) !== "completed") || "dino";
  const activeMeta = LetterQuest.MISSION_META.find((m) => m.id === active);
  const mapChar = document.getElementById("mapChar");
  if (mapChar && activeMeta) mapChar.textContent = activeMeta.emoji;
}

function startApp() {
  document.getElementById("startOverlay").style.display = "none";
  unlockAudio();
  soundUnlocked = true;
  renderMissionMap();
  showScreen("home");
}

function unlockAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    playTinyUnlockSound();
  } catch (e) {}
}

function playTinyUnlockSound() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = 1;
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.02);
}

function showScreen(id) {
  unlockAudio();
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  const order = ["home", "lesson", "review", "parent"];
  const tabIdx = order.indexOf(id);
  if (tabIdx >= 0) document.querySelectorAll(".tab")[tabIdx].classList.add("active");
  updateStats();
  if (id === "home") renderMissionMap();
  if (id === "lesson" && soundUnlocked && index < TOTAL) setTimeout(() => speakQuestion(true), 400);
}

function openLesson(key) {
  if (missionState(key) === "locked") return;
  unlockAudio();
  currentKey = key;
  current = lessons[key] || lessons.dino;
  index = getMissionIndex(key);
  if (index >= TOTAL && !loadProgress()[key]?.completed) {
    index = 0;
    saveMissionIndex(key, 0);
  }
  if (loadProgress()[key]?.completed) index = 0;

  document.getElementById("lessonTitle").textContent = current.title;
  document.getElementById("lessonDesc").textContent = current.desc;
  document.querySelector(".level-badge").textContent = current.level || "미션";
  applyTheme(current.theme);
  showScreen("lesson");
  render();
  setTimeout(() => speakQuestion(true), 500);
}

function render() {
  if (index >= TOTAL) {
    showMissionComplete();
    return;
  }
  const item = current.items[index];
  document.getElementById("questionText").textContent = item.q;
  document.getElementById("promptText").textContent = item.prompt;
  document.getElementById("reward").classList.remove("show");
  document.getElementById("progress").style.width = ((index + 1) / TOTAL * 100) + "%";
  document.getElementById("count").textContent = `${index + 1}/${TOTAL}`;
  document.getElementById("speechBubble").innerHTML = "잘하고<br>있어요! 💕";

  const box = document.getElementById("choices");
  box.innerHTML = "";
  item.choices.forEach((c) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = c;
    btn.onclick = () => answer(btn, c, item.answer);
    box.appendChild(btn);
  });

  if (autoSpeak && soundUnlocked && document.getElementById("lesson").classList.contains("active")) {
    setTimeout(() => speakQuestion(true), 420);
  }
}

function speakQuestion(cancelFirst = true) {
  if (index >= TOTAL) return;
  const item = current.items[index];
  if (!("speechSynthesis" in window)) return;
  if (cancelFirst) window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(item.speak || item.prompt);
  utter.lang = "ko-KR";
  utter.rate = 0.82;
  utter.pitch = 1.22;
  utter.volume = 1;
  window.speechSynthesis.speak(utter);
}

function speakText(text, rate = 0.9, pitch = 1.25) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ko-KR";
  utter.rate = rate;
  utter.pitch = pitch;
  utter.volume = 1;
  window.speechSynthesis.speak(utter);
}

function answer(btn, choice, ans) {
  unlockAudio();
  document.querySelectorAll(".choice").forEach((b) => (b.disabled = true));
  solved++;

  if (choice === ans) {
    correct++;
    btn.classList.add("correct");
    document.getElementById("rewardTitle").innerHTML = '우와! <span>정답이에요!</span>';
    document.getElementById("rewardText").textContent = "스티커 2개를 받았어요! ✨";
    document.getElementById("speechBubble").innerHTML = "정말<br>잘했어! 💖";
    document.getElementById("reward").classList.add("show");
    playSuccessSound();
    confetti();
    setTimeout(() => speakText("잘했어! 정답이에요!", 0.88, 1.35), 220);
  } else {
    btn.classList.add("wrong");
    document.querySelectorAll(".choice").forEach((b) => {
      if (b.textContent === ans) b.classList.add("correct");
    });
    document.getElementById("rewardTitle").innerHTML = '아하! <span>정답은 ' + ans + "</span>";
    document.getElementById("rewardText").textContent = "괜찮아요. 다시 하면 더 잘할 수 있어요!";
    document.getElementById("speechBubble").innerHTML = "괜찮아<br>다시 해봐! 🌈";
    document.getElementById("reward").classList.add("show");
    playSoftWrongSound();
    setTimeout(() => speakText("괜찮아. 정답은 " + ans + " 이야.", 0.86, 1.18), 180);
  }

  localStorage.setItem("solved", solved);
  localStorage.setItem("correct", correct);
  updateStats();

  setTimeout(() => {
    index++;
    saveMissionIndex(currentKey, index);
    if (index >= TOTAL) {
      markMissionComplete(currentKey);
      showMissionComplete();
    } else {
      render();
    }
  }, 2300);
}

function showMissionComplete() {
  const meta = current;
  document.getElementById("completeTitle").textContent = meta.title + " 클리어!";
  document.getElementById("completeDesc").textContent =
    `${TOTAL}문제를 모두 풀었어요! 스티커를 많이 모았네요.`;
  const nextBtn = document.getElementById("btnNextMission");
  if (pendingNextMission) {
    nextBtn.style.display = "block";
    const nextMeta = LetterQuest.MISSION_META.find((m) => m.id === pendingNextMission);
    nextBtn.textContent = (nextMeta ? nextMeta.title : "다음") + " 미션 가기 ✨";
  } else {
    nextBtn.style.display = "none";
  }
  document.getElementById("completeOverlay").classList.add("show");
  confetti();
  setTimeout(() => speakText("미션을 클리어했어! 정말 잘했어!", 0.85, 1.3), 300);
  renderMissionMap();
}

function closeCompleteAndMap() {
  document.getElementById("completeOverlay").classList.remove("show");
  showScreen("home");
}

function goNextMission() {
  document.getElementById("completeOverlay").classList.remove("show");
  if (pendingNextMission) openLesson(pendingNextMission);
  else showScreen("home");
}

function playSuccessSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.09);
    gain.gain.setValueAtTime(0.0001, now + i * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.09 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.09);
    osc.stop(now + i * 0.09 + 0.2);
  });
}

function playSoftWrongSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const notes = [392, 330];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + i * 0.12);
    gain.gain.setValueAtTime(0.0001, now + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.09, now + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.22);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.24);
  });
}

function confetti() {
  const area = document.getElementById("confetti");
  area.innerHTML = "";
  area.classList.add("show");
  const colors = ["#ff69bc", "#ffe56d", "#6ee7c8", "#9b5cff", "#7cb7ff", "#ffb84f"];
  for (let i = 0; i < 54; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDelay = Math.random() * 0.38 + "s";
    p.style.transform = `rotate(${Math.random() * 180}deg)`;
    area.appendChild(p);
  }
  setTimeout(() => area.classList.remove("show"), 1300);
}

function updateStats() {
  const rate = solved ? Math.round((correct / solved) * 100) : 0;
  document.getElementById("statSolved").textContent = solved;
  document.getElementById("statCorrect").textContent = correct;
  document.getElementById("statRate").textContent = rate + "%";
  document.getElementById("statStars").textContent = correct * 2;
  const cleared = MISSION_ORDER.filter((id) => missionState(id) === "completed").length;
  const statPanel = document.getElementById("statMissions");
  if (statPanel) statPanel.textContent = cleared + "/4";
}

updateStats();
renderMissionMap();
