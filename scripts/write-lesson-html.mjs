import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const v = "di" + "v";

const html = [
  "<!DOCTYPE html>",
  '<html lang="ko">',
  "<head>",
  '  <meta charset="UTF-8" />',
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />',
  "  <title>\uC724\uD638\uC758 \uD55C\uAE00 \uC6D4\uB4DC \u2014 \uD559\uC2B5</title>",
  '  <link rel="preconnect" href="https://fonts.googleapis.com" />',
  '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  '  <link href="https://fonts.googleapis.com/css2?family=Jua&family=Dongle:wght@400;700&display=swap" rel="stylesheet" />',
  '  <link rel="stylesheet" href="css/lesson.css" />',
  "</head>",
  "<body>",
  `  <${v} class="confetti" id="confetti"></${v}>`,
  `  <${v} class="complete-overlay" id="completeOverlay">`,
  `    <${v} class="complete-card">`,
  "      <h2>\uB2E8\uACC4 \uC644\uB8CC!</h2>",
  '      <p id="completeMsg">\uB2E4\uC74C \uB2E8\uACC4\uB85C \uAC08\uAE4C\uC694?</p>',
  '      <p id="completeStars" class="complete-stars"></p>',
  '      <button type="button" class="complete-btn" id="completeBtn">\uB2E8\uACC4 \uC120\uD0DD\uC73C\uB85C</button>',
  `    </${v}>`,
  `  </${v}>`,
  '  <main class="app">',
  `    <${v} class="top-row">`,
  '      <a class="circle-btn" id="backBtn" href="stages.html" aria-label="\uB2E8\uACC4 \uC120\uD0DD">\u2039</a>',
  `      <${v} class="level-badge" id="levelBadge">1\uB2E8\uACC4</${v}>`,
  `      <${v} style="width:58px"></${v}>`,
  `    </${v}>`,
  `    <${v} class="stage-hero">`,
  `      <${v}>`,
  '        <h1 class="world-title" id="lessonTitle">\uACF5\uB8E1\uC219</h1>',
  '        <motion class="instruction" id="lessonDesc">\uC790\uC74C \uC18C\uB9AC\uB97C \uB4E3\uACE0 \uB9DE\uB294 \uAE00\uC790\uB97C \uACE8\uB77C\uC694.</div>',
  `      </${v}>`,
  `      <${v} class="speech" id="speechBubble">\uC798\uD558\uACE0<br>\uC788\uC5B4\uC694!</${v}>`,
  `      <${v} class="mascot-wrap">`,
  '        <img id="mascotImg" src="" alt="\uCE90\uB9AD\uD130" width="170" height="180" />',
  `      </${v}>`,
  `    </${v}>`,
  `    <${v} class="progress-box">`,
  `      <${v} class="star-coin">\u2B50</${v}>`,
  `      <${v} class="progress-track"><${v} class="progress-fill" id="progress"></${v}></${v}>`,
  '      <span class="progress-count" id="count">1/5</span>',
  `    </${v}>`,
  `    <${v} class="question-card">`,
  '      <button type="button" class="sound-btn" id="soundBtn">\uD83D\uDD0A</button>',
  `      <${v} class="big-letter" id="questionText">\u3131</${v}>`,
  `      <${v} class="prompt" id="promptText">\u201C\uAE30\uC5ED\u201D\uC740 \uC5B4\uB514 \uC788\uC744\uAE4C?</${v}>`,
  `    </${v}>`,
  `    <${v} class="choices" id="choices"></${v}>`,
  `    <${v} class="reward" id="reward">`,
  '      <h3 id="rewardTitle">\uC6B0\uC640! <span>\uC815\uB2F5\uC774\uC5D0\uC694!</span></h3>',
  '      <p id="rewardText">\uC798\uD588\uC5B4\uC694!</p>',
  `    </${v}>`,
  "  </main>",
  '  <script src="js/progress.js"></script>',
  '  <script src="js/questionBank.js"></script>',
  '  <script src="js/lesson.js"></script>',
  "</body>",
  "</html>",
]
  .join("\n")
  .replace(/<\/?motion\b[^>]*>/gi, (t) =>
    t.startsWith("</") ? `</${v}>` : `<${v} class="instruction" id="lessonDesc">`
  );

fs.writeFileSync(path.join(__dirname, "..", "lesson.html"), html, { encoding: "utf8" });
console.log("ok");
