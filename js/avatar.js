/**
 * 윤호의 한글 월드 — 아바타 / 별 상점
 */
(function (global) {
  "use strict";

  const SLOTS = ["hat", "top", "bottom", "bag", "toy"];
  const SLOT_LABELS = {
    hat: "모자",
    top: "옷",
    bottom: "바지",
    bag: "가방",
    toy: "장난감",
  };

  const CATALOG = [
    // 기본 (무료, 시작 보유)
    { id: "top_pink", slot: "top", name: "분홍 셔츠", price: 0, free: true, style: "pink" },
    { id: "bottom_check", slot: "bottom", name: "체크 바지", price: 0, free: true, style: "check" },

    // 모자
    { id: "hat_red", slot: "hat", name: "빨간 모자", price: 3, style: "red-cap" },
    { id: "hat_crown", slot: "hat", name: "왕관", price: 8, style: "crown" },
    { id: "hat_bunny", slot: "hat", name: "토끼 귀", price: 5, style: "bunny" },
    { id: "hat_star", slot: "hat", name: "별 머리띠", price: 4, style: "star-band" },

    // 옷
    { id: "top_blue", slot: "top", name: "하늘 후드티", price: 4, style: "blue" },
    { id: "top_yellow", slot: "top", name: "노란 티셔츠", price: 3, style: "yellow" },
    { id: "top_stripe", slot: "top", name: "줄무늬 셔츠", price: 5, style: "stripe" },
    { id: "top_dino", slot: "top", name: "공룡 티", price: 6, style: "dino" },

    // 바지
    { id: "bottom_blue", slot: "bottom", name: "청바지", price: 4, style: "denim" },
    { id: "bottom_green", slot: "bottom", name: "초록 반바지", price: 3, style: "green" },
    { id: "bottom_star", slot: "bottom", name: "별무늬 바지", price: 6, style: "stars" },

    // 가방
    { id: "bag_yellow", slot: "bag", name: "노란 가방", price: 4, style: "yellow" },
    { id: "bag_star", slot: "bag", name: "별 가방", price: 6, style: "star" },
    { id: "bag_frog", slot: "bag", name: "개구리 가방", price: 7, style: "frog" },

    // 장난감
    { id: "toy_ball", slot: "toy", name: "공", price: 2, style: "ball" },
    { id: "toy_bear", slot: "toy", name: "곰인형", price: 5, style: "bear" },
    { id: "toy_wand", slot: "toy", name: "요술봉", price: 6, style: "wand" },
    { id: "toy_car", slot: "toy", name: "장난감 자동차", price: 4, style: "car" },
  ];

  const DEFAULT_EQUIP = {
    hat: "",
    top: "top_pink",
    bottom: "bottom_check",
    bag: "",
    toy: "",
  };

  function storage() {
    return (global.YoonhoProgress && YoonhoProgress.STORAGE) || {};
  }

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

  function getItem(id) {
    return CATALOG.find((x) => x.id === id) || null;
  }

  function getOwned() {
    const s = storage();
    const owned = readJson(s.avatarOwned || "avatarOwned", null);
    if (owned && Array.isArray(owned.ids)) return owned.ids;
    // 기본 지급
    const freeIds = CATALOG.filter((x) => x.free).map((x) => x.id);
    writeJson(s.avatarOwned || "avatarOwned", { ids: freeIds });
    return freeIds.slice();
  }

  function saveOwned(ids) {
    const s = storage();
    writeJson(s.avatarOwned || "avatarOwned", { ids: ids });
  }

  function isOwned(id) {
    return getOwned().indexOf(id) >= 0;
  }

  function getGender() {
    const s = storage();
    const g = localStorage.getItem(s.avatarGender || "avatarGender");
    return g === "girl" ? "girl" : "boy";
  }

  function setGender(gender) {
    const s = storage();
    localStorage.setItem(s.avatarGender || "avatarGender", gender === "girl" ? "girl" : "boy");
  }

  function getEquip() {
    const s = storage();
    return { ...DEFAULT_EQUIP, ...readJson(s.avatarEquip || "avatarEquip", {}) };
  }

  function saveEquip(equip) {
    const s = storage();
    writeJson(s.avatarEquip || "avatarEquip", equip);
  }

  function equipItem(itemId) {
    const item = getItem(itemId);
    if (!item || !isOwned(itemId)) return false;
    const equip = getEquip();
    equip[item.slot] = itemId;
    saveEquip(equip);
    return true;
  }

  function unequipSlot(slot) {
    if (SLOTS.indexOf(slot) < 0) return false;
    if (slot === "top" || slot === "bottom") return false; // 기본 옷은 유지
    const equip = getEquip();
    equip[slot] = "";
    saveEquip(equip);
    return true;
  }

  function buyItem(itemId) {
    const item = getItem(itemId);
    if (!item) return { ok: false, reason: "없는 아이템" };
    if (isOwned(itemId)) return { ok: false, reason: "이미 가지고 있어요" };
    if (!global.YoonhoProgress) return { ok: false, reason: "진행도 없음" };

    const result = YoonhoProgress.spendStars(item.price);
    if (!result.ok) return { ok: false, reason: "별이 부족해요", balance: result.balance };

    const owned = getOwned();
    owned.push(itemId);
    saveOwned(owned);
    equipItem(itemId);
    return { ok: true, balance: result.balance, item: item };
  }

  function itemsBySlot(slot) {
    return CATALOG.filter((x) => x.slot === slot);
  }

  function styleOf(equipId, fallback) {
    const item = getItem(equipId);
    return item ? item.style : fallback;
  }

  /** 아바타 DOM 생성/갱신 */
  function renderAvatar(target, options) {
    if (!target) return null;
    const opts = options || {};
    const gender = opts.gender || getGender();
    const equip = opts.equip || getEquip();
    const size = opts.size || "md";

    let root = target.querySelector(".avatar");
    if (!root) {
      root = document.createElement("div");
      root.className = "avatar";
      target.appendChild(root);
    }

    root.className = "avatar avatar--" + size + " avatar--" + gender;
    root.dataset.gender = gender;
    root.innerHTML =
      '<div class="avatar-shadow"></div>' +
      '<div class="avatar-toy" data-style=""></div>' +
      '<div class="avatar-bag" data-style=""></div>' +
      '<div class="avatar-body">' +
      '  <div class="avatar-head">' +
      '    <div class="avatar-ear left"></div><div class="avatar-ear right"></div>' +
      '    <div class="avatar-hair back"></div>' +
      '    <div class="avatar-face">' +
      '      <i class="blush left"></i><i class="blush right"></i>' +
      '      <i class="brow left"></i><i class="brow right"></i>' +
      '      <i class="eye left"><b></b><em></em></i><i class="eye right"><b></b><em></em></i>' +
      '      <i class="mouth"><span></span></i>' +
      "    </div>" +
      '    <div class="avatar-hair front"></div>' +
      '    <div class="avatar-hat" data-style=""></div>' +
      "  </div>" +
      '  <div class="avatar-neck"></div>' +
      '  <div class="avatar-top" data-style="">' +
      '    <span class="collar"></span>' +
      '    <span class="arm left"><i class="hand"></i></span>' +
      '    <span class="arm right"><i class="hand"></i></span>' +
      "  </div>" +
      '  <div class="avatar-bottom" data-style=""></div>' +
      '  <div class="avatar-shoes"><i></i><i></i></div>' +
      "</div>";

    root.querySelector(".avatar-hat").dataset.style = styleOf(equip.hat, "none") || "none";
    root.querySelector(".avatar-top").dataset.style = styleOf(equip.top, "pink");
    root.querySelector(".avatar-bottom").dataset.style = styleOf(equip.bottom, "check");
    root.querySelector(".avatar-bag").dataset.style = styleOf(equip.bag, "none") || "none";
    root.querySelector(".avatar-toy").dataset.style = styleOf(equip.toy, "none") || "none";

    return root;
  }

  global.YoonhoAvatar = {
    SLOTS,
    SLOT_LABELS,
    CATALOG,
    DEFAULT_EQUIP,
    getItem,
    getOwned,
    isOwned,
    getGender,
    setGender,
    getEquip,
    equipItem,
    unequipSlot,
    buyItem,
    itemsBySlot,
    renderAvatar,
  };
})(typeof window !== "undefined" ? window : globalThis);
