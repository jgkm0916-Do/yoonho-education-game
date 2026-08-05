/**
 * 초보용 한글 자모 획 데이터 (viewBox 0 0 100 100)
 * stroke.path: SVG path d
 * assemble.pieces: 드래그할 선 조각 (order = 쓰는 순서)
 */
(function (global) {
  "use strict";

  function stroke(label, path, tip) {
    return { label: label, path: path, tip: tip || "" };
  }

  function piece(id, kind, path, label) {
    return { id: id, kind: kind, path: path, label: label || "" };
  }

  /** 쉬운 자음 — 획 수가 적고 직선 위주 */
  const CONSONANT_STROKES = {
    ㄱ: {
      char: "ㄱ",
      name: "기역",
      tip: "가로 → 세로",
      strokes: [
        stroke("1", "M 22 28 L 78 28", "가로로 길게"),
        stroke("2", "M 78 28 L 78 82", "아래로"),
      ],
      pieces: [
        piece("h1", "h", "M 22 28 L 78 28", "가로"),
        piece("v1", "v", "M 78 28 L 78 82", "세로"),
      ],
    },
    ㄴ: {
      char: "ㄴ",
      name: "니은",
      tip: "세로 → 가로",
      strokes: [
        stroke("1", "M 24 24 L 24 78", "아래로"),
        stroke("2", "M 24 78 L 80 78", "가로로"),
      ],
      pieces: [
        piece("v1", "v", "M 24 24 L 24 78", "세로"),
        piece("h1", "h", "M 24 78 L 80 78", "가로"),
      ],
    },
    ㄷ: {
      char: "ㄷ",
      name: "디귿",
      tip: "위 → 왼쪽 → 아래",
      strokes: [
        stroke("1", "M 24 28 L 80 28", "위 가로"),
        stroke("2", "M 24 28 L 24 78", "왼쪽 세로"),
        stroke("3", "M 24 78 L 80 78", "아래 가로"),
      ],
      pieces: [
        piece("h1", "h", "M 24 28 L 80 28", "위"),
        piece("v1", "v", "M 24 28 L 24 78", "세로"),
        piece("h2", "h", "M 24 78 L 80 78", "아래"),
      ],
    },
    ㅁ: {
      char: "ㅁ",
      name: "미음",
      tip: "왼쪽 → 위·오른쪽 → 아래",
      strokes: [
        stroke("1", "M 26 28 L 26 78", "왼쪽 세로"),
        stroke("2", "M 26 28 L 74 28 L 74 78", "위 가로 후 오른쪽 세로"),
        stroke("3", "M 26 78 L 74 78", "아래 가로"),
      ],
      pieces: [
        piece("v1", "v", "M 26 28 L 26 78", "왼쪽"),
        piece("tr", "b", "M 26 28 L 74 28 L 74 78", "위·오른쪽"),
        piece("h2", "h", "M 26 78 L 74 78", "아래"),
      ],
    },
    ㅇ: {
      char: "ㅇ",
      name: "이응",
      tip: "한 획으로 둥글게",
      strokes: [
        stroke("1", "M 50 22 A 28 28 0 1 1 49.9 22", "둥글게"),
      ],
      pieces: [
        piece("c1", "c", "M 50 22 A 28 28 0 1 1 49.9 22", "둥글게"),
      ],
    },
    ㅅ: {
      char: "ㅅ",
      name: "시옷",
      tip: "왼쪽 사선 → 오른쪽 사선",
      strokes: [
        stroke("1", "M 50 26 L 28 78", "왼쪽으로"),
        stroke("2", "M 50 26 L 72 78", "오른쪽으로"),
      ],
      pieces: [
        piece("d1", "d", "M 50 26 L 28 78", "왼쪽"),
        piece("d2", "d", "M 50 26 L 72 78", "오른쪽"),
      ],
    },
    ㅂ: {
      char: "ㅂ",
      name: "비읍",
      tip: "세로 둘 → 가로 둘",
      strokes: [
        stroke("1", "M 28 26 L 28 78", "왼쪽"),
        stroke("2", "M 72 26 L 72 78", "오른쪽"),
        stroke("3", "M 28 48 L 72 48", "가운데"),
        stroke("4", "M 28 78 L 72 78", "아래"),
      ],
      pieces: [
        piece("v1", "v", "M 28 26 L 28 78", "왼쪽"),
        piece("v2", "v", "M 72 26 L 72 78", "오른쪽"),
        piece("h1", "h", "M 28 48 L 72 48", "가운데"),
        piece("h2", "h", "M 28 78 L 72 78", "아래"),
      ],
    },
    ㅈ: {
      char: "ㅈ",
      name: "지읒",
      tip: "가로 → 사선 둘",
      strokes: [
        stroke("1", "M 24 30 L 76 30", "가로"),
        stroke("2", "M 50 30 L 28 78", "왼쪽"),
        stroke("3", "M 50 30 L 72 78", "오른쪽"),
      ],
      pieces: [
        piece("h1", "h", "M 24 30 L 76 30", "가로"),
        piece("d1", "d", "M 50 30 L 28 78", "왼쪽"),
        piece("d2", "d", "M 50 30 L 72 78", "오른쪽"),
      ],
    },
  };

  /** 쉬운 모음 — 직선만 */
  const VOWEL_STROKES = {
    ㅣ: {
      char: "ㅣ",
      name: "이",
      tip: "세로 한 줄",
      strokes: [stroke("1", "M 50 22 L 50 82", "아래로")],
      pieces: [piece("v1", "v", "M 50 22 L 50 82", "세로")],
    },
    ㅡ: {
      char: "ㅡ",
      name: "으",
      tip: "가로 한 줄",
      strokes: [stroke("1", "M 22 50 L 78 50", "가로로")],
      pieces: [piece("h1", "h", "M 22 50 L 78 50", "가로")],
    },
    ㅏ: {
      char: "ㅏ",
      name: "아",
      tip: "세로 → 오른쪽 짧은 가로",
      strokes: [
        stroke("1", "M 38 22 L 38 82", "세로"),
        stroke("2", "M 38 50 L 72 50", "오른쪽으로"),
      ],
      pieces: [
        piece("v1", "v", "M 38 22 L 38 82", "세로"),
        piece("h1", "h", "M 38 50 L 72 50", "가로"),
      ],
    },
    ㅓ: {
      char: "ㅓ",
      name: "어",
      tip: "세로 → 왼쪽 짧은 가로",
      strokes: [
        stroke("1", "M 62 22 L 62 82", "세로"),
        stroke("2", "M 62 50 L 28 50", "왼쪽으로"),
      ],
      pieces: [
        piece("v1", "v", "M 62 22 L 62 82", "세로"),
        piece("h1", "h", "M 62 50 L 28 50", "가로"),
      ],
    },
    ㅗ: {
      char: "ㅗ",
      name: "오",
      tip: "가로 → 위로 짧은 세로",
      strokes: [
        stroke("1", "M 22 62 L 78 62", "가로"),
        stroke("2", "M 50 62 L 50 28", "위로"),
      ],
      pieces: [
        piece("h1", "h", "M 22 62 L 78 62", "가로"),
        piece("v1", "v", "M 50 62 L 50 28", "세로"),
      ],
    },
    ㅜ: {
      char: "ㅜ",
      name: "우",
      tip: "가로 → 아래로 짧은 세로",
      strokes: [
        stroke("1", "M 22 38 L 78 38", "가로"),
        stroke("2", "M 50 38 L 50 72", "아래로"),
      ],
      pieces: [
        piece("h1", "h", "M 22 38 L 78 38", "가로"),
        piece("v1", "v", "M 50 38 L 50 72", "세로"),
      ],
    },
    ㅑ: {
      char: "ㅑ",
      name: "야",
      tip: "세로 → 짧은 가로 둘",
      strokes: [
        stroke("1", "M 36 22 L 36 82", "세로"),
        stroke("2", "M 36 40 L 70 40", "위 가로"),
        stroke("3", "M 36 60 L 70 60", "아래 가로"),
      ],
      pieces: [
        piece("v1", "v", "M 36 22 L 36 82", "세로"),
        piece("h1", "h", "M 36 40 L 70 40", "위"),
        piece("h2", "h", "M 36 60 L 70 60", "아래"),
      ],
    },
    ㅕ: {
      char: "ㅕ",
      name: "여",
      tip: "세로 → 왼쪽 짧은 가로 둘",
      strokes: [
        stroke("1", "M 64 22 L 64 82", "세로"),
        stroke("2", "M 64 40 L 30 40", "위 가로"),
        stroke("3", "M 64 60 L 30 60", "아래 가로"),
      ],
      pieces: [
        piece("v1", "v", "M 64 22 L 64 82", "세로"),
        piece("h1", "h", "M 64 40 L 30 40", "위"),
        piece("h2", "h", "M 64 60 L 30 60", "아래"),
      ],
    },
  };

  function getJamo(char) {
    return CONSONANT_STROKES[char] || VOWEL_STROKES[char] || null;
  }

  global.YoonhoStrokeData = {
    CONSONANT_STROKES,
    VOWEL_STROKES,
    getJamo,
  };
})(typeof window !== "undefined" ? window : globalThis);
