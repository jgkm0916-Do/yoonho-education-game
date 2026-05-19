import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const v = "div";

const parts = [
  "<!DOCTYPE html>",
  '<html lang="ko">',
  "<head>",
  '  <meta charset="UTF-8" />',
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />',
  "  <title>윤호의 한글 월드 — 학습</title>",
  '  <link rel="preconnect" href="https://fonts.googleapis.com" />',
  '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  '  <link href="https://fonts.googleapis.com/css2?family=Jua&family=Dongle:wght@400;700&display=swap" rel="stylesheet" />',
  '  <link rel="stylesheet" href="css/lesson.css" />',
  "</head>",
  "<body>",
  `  <${v} class="confetti" id="confetti"></${v}>`,
  `  <${v} class="complete-overlay" id="completeOverlay">`,
  `    <${v} class="complete-card">`,
  "      <h2>월드 클리어!</h2>",
  '      <p id="completeMsg">다음 모험 지도로 돌아갈까요?</p>',
  '      <button type="button" class="complete-btn" id="completeBtn">월드맵으로</button>',
  `    </${v}>`,
  `  </${v}>`,
  `  <main class="app">`,
  `    <${v} class="top-row">`,
  '      <a class="circle-btn" href="index.html" aria-label="월드맵으로">‹</a>',
  '      <div class="level-badge" id="levelBadge">1단계</div>',
  '      <div style="width:58px"></div>',
  `    </${v}>`,
  `    <${v} class="stage-hero">`,
  `      <${v}>`,
  '        <h1 class="world-title" id="lessonTitle">공룡숲</h1>',
  '        <div class="instruction" id="lessonDesc">자음 소리를 듣고 맞는 글자를 골라요.</div>',
  `      </${v}>`,
  '      <div class="speech" id="speechBubble">잘하고<br>있어요!</div>',
  `      <${v} class="mascot-wrap">`,
  '        <img id="mascotImg" src="" alt="캐릭터" width="170" height="180" />',
  `      </${v}>`,
  `    </${v}>`,
  `    <${v} class="progress-box">`,
  `      <${v} class="star-coin">⭐</${v}>`,
  `      <${v} class="progress-track"><${v} class="progress-fill" id="progress"></${v}></${v}>`,
  '      <span class="progress-count" id="count">1/5</span>',
  `    </${v}>`,
  `    <${v} class="question-card">`,
  '      <button type="button" class="sound-btn" id="soundBtn">🔊</button>',
  '      <div class="big-letter" id="questionText">ㄱ</div>',
  '      <div class="prompt" id="promptText">“기역”은 어디 있을까?</div>',
  `    </${v}>`,
  '    <div class="choices" id="choices"></div>',
  `    <${v} class="reward" id="reward">`,
  '      <h3 id="rewardTitle">우와! <span>정답이에요!</span></h3>',
  "      <p id=\"rewardText\">별 2개를 받았어요!</p>",
  `    </${v}>`,
  "  </main>",
  '  <script src="js/lesson.js"></script>',
  "</body>",
  "</html>",
];

let html = parts.join("\n");
html = html.replace(/<\/?motion\b[^>]*>/g, (tag) =>
  tag.startsWith("</") ? `</${v}>` : tag.replace("motion", v)
);
html = html.replace(/<motion\b/g, `<${v}`).replace(/<\/motion>/g, `</${v}>`);

fs.writeFileSync(path.join(__dirname, "..", "lesson.html"), html, "utf8");
console.log("ok");
