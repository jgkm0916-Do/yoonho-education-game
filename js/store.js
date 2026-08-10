(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  let activeSlot = "hat";

  const EMOJI = {
    top_pink: "👕",
    top_blue: "🧥",
    top_yellow: "👚",
    top_stripe: "👔",
    top_dino: "🦕",
    bottom_check: "👖",
    bottom_blue: "👖",
    bottom_green: "🩳",
    bottom_star: "✨",
    hat_red: "🧢",
    hat_crown: "👑",
    hat_bunny: "🐰",
    hat_star: "⭐",
    bag_yellow: "🎒",
    bag_star: "🎒",
    bag_frog: "🐸",
    toy_ball: "⚽",
    toy_bear: "🧸",
    toy_wand: "🪄",
    toy_car: "🚗",
  };

  function refreshStars() {
    $("starBalance").textContent = String(YoonhoProgress.getStarBalance());
  }

  function refreshPreview() {
    YoonhoAvatar.renderAvatar($("avatarPreview"), { size: "lg" });
    const equip = YoonhoAvatar.getEquip();
    const parts = YoonhoAvatar.SLOTS.map((slot) => {
      const id = equip[slot];
      if (!id) return null;
      const item = YoonhoAvatar.getItem(id);
      return item ? item.name : null;
    }).filter(Boolean);
    $("previewTip").textContent = parts.join(" · ") || "기본 옷차림";
  }

  function showMsg(text, isError) {
    const el = $("storeMsg");
    el.hidden = false;
    el.textContent = text;
    el.classList.toggle("is-error", !!isError);
    clearTimeout(showMsg._t);
    showMsg._t = setTimeout(() => {
      el.hidden = true;
    }, 1800);
  }

  function renderSlots() {
    const box = $("slotTabs");
    box.innerHTML = "";
    YoonhoAvatar.SLOTS.forEach((slot) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-tab" + (slot === activeSlot ? " is-active" : "");
      btn.textContent = YoonhoAvatar.SLOT_LABELS[slot];
      btn.onclick = () => {
        activeSlot = slot;
        renderSlots();
        renderItems();
      };
      box.appendChild(btn);
    });
  }

  function renderItems() {
    const grid = $("itemGrid");
    grid.innerHTML = "";
    const equip = YoonhoAvatar.getEquip();
    const balance = YoonhoProgress.getStarBalance();

    YoonhoAvatar.itemsBySlot(activeSlot).forEach((item) => {
      const owned = YoonhoAvatar.isOwned(item.id);
      const equipped = equip[item.slot] === item.id;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "item-card" +
        (owned ? " is-owned" : "") +
        (equipped ? " is-equipped" : "") +
        (!owned && balance < item.price ? " is-locked" : "");

      btn.innerHTML =
        '<div class="item-emoji">' +
        (EMOJI[item.id] || "🎁") +
        "</div>" +
        '<div class="item-name">' +
        item.name +
        "</div>" +
        '<div class="item-price">' +
        (owned ? (equipped ? "착용 중" : "가지고 있어요 · 착용") : "⭐ " + item.price) +
        "</div>";

      btn.onclick = () => {
        if (owned) {
          YoonhoAvatar.equipItem(item.id);
          showMsg(item.name + "을(를) 입었어요!");
          refreshPreview();
          renderItems();
          return;
        }
        const result = YoonhoAvatar.buyItem(item.id);
        if (!result.ok) {
          showMsg(result.reason || "살 수 없어요", true);
          return;
        }
        showMsg(item.name + " 구매 완료!");
        refreshStars();
        refreshPreview();
        renderItems();
      };

      grid.appendChild(btn);
    });

    // 모자/가방/장난감은 벗기 가능
    if (activeSlot === "hat" || activeSlot === "bag" || activeSlot === "toy") {
      const off = document.createElement("button");
      off.type = "button";
      off.className = "item-card is-owned";
      off.innerHTML =
        '<div class="item-emoji">🚫</div><div class="item-name">안 쓰기</div><div class="item-price">벗기</div>';
      off.onclick = () => {
        YoonhoAvatar.unequipSlot(activeSlot);
        showMsg("벗었어요!");
        refreshPreview();
        renderItems();
      };
      grid.appendChild(off);
    }
  }

  function bindGender() {
    document.querySelectorAll(".gender-tab").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.gender === YoonhoAvatar.getGender());
      btn.addEventListener("click", () => {
        YoonhoAvatar.setGender(btn.dataset.gender);
        document.querySelectorAll(".gender-tab").forEach((b) => {
          b.classList.toggle("is-active", b.dataset.gender === btn.dataset.gender);
        });
        refreshPreview();
      });
    });
  }

  function init() {
    bindGender();
    refreshStars();
    refreshPreview();
    renderSlots();
    renderItems();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
