/**
 * 다시, 봄 — 세대 경험 아카이브 프로토타입
 */

const STORIES = [
  {
    id: "career-seoul",
    category: "직업",
    title: "스물여섯, 처음 서울로 올라가던 날",
    excerpt:
      "고향을 떠나 처음 직장을 구하러 서울행 기차를 탔습니다. 무섭기도 했지만 다시 돌아오지 않겠다는 마음도 있었습니다.",
    story:
      "고향을 떠나 처음 직장을 구하러 서울행 기차를 탔습니다.\n무섭기도 했지만 다시 돌아오지 않겠다는 마음도 있었습니다.\n\n낯선 도시의 골목과 사람들 사이에서 하루하루를 견디며, 작은 일자리를 하나씩 쌓아 갔습니다. 그때의 두려움은 사라지지 않았지만, 그 두려움이 저를 앞으로 밀어 주기도 했습니다.",
    ageLabel: "60대",
    author: "60대 · 익명",
    lesson: "늦었다고 생각한 순간에도 다시 시작할 수 있었습니다.",
    image:
      "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80",
    imageAlt: "기차역 플랫폼의 열차",
  },
  {
    id: "failure-restart",
    category: "실패",
    title: "사업에 실패하고 다시 시작하기까지",
    excerpt:
      "모든 것을 잃었다고 생각했지만, 그때 처음으로 가족이 내게 어떤 의미인지 알게 되었습니다.",
    story:
      "모든 것을 잃었다고 생각했지만,\n그때 처음으로 가족이 내게 어떤 의미인지 알게 되었습니다.\n\n빚과 실패의 무게가 컸지만, 곁에 남은 사람들의 한마디가 저를 일으켜 세웠습니다. 다시 시작하는 일은 처음보다 더디었지만, 그 걸음은 더 단단했습니다.",
    ageLabel: "70대",
    author: "70대 · 익명",
    lesson: "모든 것을 잃었다고 느낀 날에도, 곁에 남은 것이 있었습니다.",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    imageAlt: "다시 시작하는 아침의 커피잔",
  },
  {
    id: "family-parent",
    category: "가족",
    title: "부모가 되고 나서야 알게 된 것",
    excerpt:
      "아이를 키우면서 부모님이 왜 그런 말씀을 하셨는지 조금씩 이해하게 되었습니다.",
    story:
      "아이를 키우면서 부모님이 왜 그런 말씀을 하셨는지\n조금씩 이해하게 되었습니다.\n\n밤늦게 우는 아이를 안아 줄 때마다, 예전에는 이해하지 못했던 걱정과 사랑이 겹쳐 보였습니다. 완벽한 부모는 되지 못했지만, 그때마다 최선을 다하려 했습니다.",
    ageLabel: "60대",
    author: "60대 · 익명",
    lesson: "이해는 때로 시간이 지나야 비로소 찾아옵니다.",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80",
    imageAlt: "함께 있는 가족의 손",
  },
  {
    id: "choice-quit",
    category: "삶의 선택",
    title: "안정적인 직장을 그만둔 선택",
    excerpt:
      "주변에서는 모두 말렸지만, 그 선택 덕분에 내가 무엇을 좋아하는지 처음 알게 되었습니다.",
    story:
      "주변에서는 모두 말렸지만,\n그 선택 덕분에 내가 무엇을 좋아하는지 처음 알게 되었습니다.\n\n안정이 사라진 자리는 불안으로 채워지기도 했습니다. 그러나 그 불안 속에서 스스로의 취향과 속도를 찾아 가기 시작했습니다. 선택에는 대가가 있었지만, 그 대가는 저를 성장시켰습니다.",
    ageLabel: "60대",
    author: "60대 · 익명",
    lesson: "안전한 길만 고집하지 않아도, 삶은 다시 자리를 잡아 줍니다.",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
    imageAlt: "선택의 길을 떠올리게 하는 산 풍경",
  },
];

const state = {
  category: "전체",
  query: "",
  activeStoryId: null,
};

const els = {
  searchInput: document.getElementById("searchInput"),
  filters: document.querySelector(".filters"),
  cardGrid: document.getElementById("cardGrid"),
  emptyState: document.getElementById("emptyState"),
  resultCount: document.getElementById("resultCount"),
  modal: document.getElementById("detailModal"),
  detailImage: document.getElementById("detailImage"),
  detailTitle: document.getElementById("detailTitle"),
  detailAge: document.getElementById("detailAge"),
  detailCategory: document.getElementById("detailCategory"),
  detailStory: document.getElementById("detailStory"),
  detailLesson: document.getElementById("detailLesson"),
  btnBackMemoir: document.getElementById("btnBackMemoir"),
  btnShareExperience: document.getElementById("btnShareExperience"),
  menuBtn: document.getElementById("menuBtn"),
  toast: document.getElementById("toast"),
};

let toastTimer = null;
let lastFocus = null;

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getFilteredStories() {
  const query = normalize(state.query);

  return STORIES.filter((story) => {
    const categoryMatch =
      state.category === "전체" || story.category === state.category;

    if (!categoryMatch) return false;
    if (!query) return true;

    const haystack = normalize(
      [story.title, story.excerpt, story.story, story.category, story.lesson, story.author].join(" ")
    );
    return haystack.includes(query);
  });
}

function authorIcon() {
  return `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.7"/>
      <path d="M5 19.5C5.8 15.8 8.5 14 12 14C15.5 14 18.2 15.8 19 19.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    </svg>
  `;
}

function renderCards() {
  const stories = getFilteredStories();
  els.cardGrid.innerHTML = "";

  if (stories.length === 0) {
    els.emptyState.hidden = false;
    els.resultCount.textContent = "검색 결과 0건";
    return;
  }

  els.emptyState.hidden = true;
  els.resultCount.textContent =
    state.category === "전체" && !normalize(state.query)
      ? `공개된 경험 ${stories.length}건`
      : `검색 결과 ${stories.length}건`;

  const fragment = document.createDocumentFragment();

  stories.forEach((story) => {
    const item = document.createElement("div");
    item.setAttribute("role", "listitem");

    const card = document.createElement("button");
    card.type = "button";
    card.className = "story-card";
    card.setAttribute("aria-label", `${story.category} 이야기: ${story.title}`);
    card.dataset.id = story.id;
    card.dataset.category = story.category;

    card.innerHTML = `
      <div class="story-card__media">
        <img src="${escapeHtml(story.image)}" alt="" loading="lazy" width="400" height="250" />
        <span class="story-card__category">${escapeHtml(story.category)}</span>
      </div>
      <div class="story-card__body">
        <h2 class="story-card__title">${escapeHtml(story.title)}</h2>
        <p class="story-card__excerpt">${escapeHtml(story.excerpt)}</p>
        <div class="story-card__footer">
          <p class="story-card__author">${authorIcon()}<span>${escapeHtml(story.author)}</span></p>
          <span class="story-card__action">이 이야기 읽기 &gt;</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openDetail(story.id));
    item.appendChild(card);
    fragment.appendChild(item);
  });

  els.cardGrid.appendChild(fragment);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function openDetail(id) {
  const story = STORIES.find((item) => item.id === id);
  if (!story) return;

  state.activeStoryId = id;
  lastFocus = document.activeElement;

  els.detailImage.hidden = false;
  els.detailImage.innerHTML = `<img src="${escapeHtml(story.image)}" alt="${escapeHtml(story.imageAlt || "")}" />`;
  els.detailTitle.textContent = story.title;
  els.detailAge.textContent = story.ageLabel;
  els.detailCategory.textContent = story.category;
  els.detailStory.textContent = story.story;
  els.detailLesson.textContent = story.lesson;

  els.modal.hidden = false;
  document.body.style.overflow = "hidden";

  const closeBtn = els.modal.querySelector(".modal__close");
  if (closeBtn) closeBtn.focus();
}

function closeDetail() {
  if (els.modal.hidden) return;

  els.modal.hidden = true;
  document.body.style.overflow = "";
  state.activeStoryId = null;

  if (lastFocus && typeof lastFocus.focus === "function") {
    lastFocus.focus();
  }
}

function setActiveFilter(category) {
  state.category = category;

  els.filters.querySelectorAll(".filter-btn").forEach((btn) => {
    const active = btn.dataset.category === category;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  renderCards();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2600);
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderCards();
  });

  els.filters.addEventListener("click", (event) => {
    const btn = event.target.closest(".filter-btn");
    if (!btn) return;
    setActiveFilter(btn.dataset.category);
  });

  els.modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) {
      closeDetail();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDetail();
  });

  els.btnBackMemoir.addEventListener("click", () => {
    showToast("프로토타입에서는 회고록 화면으로의 이동을 안내합니다.");
  });

  els.btnShareExperience.addEventListener("click", () => {
    showToast("공개 여부를 직접 선택해 경험을 남길 수 있습니다.");
  });

  els.menuBtn.addEventListener("click", () => {
    showToast("프로토타입 메뉴입니다.");
  });
}

bindEvents();
renderCards();
