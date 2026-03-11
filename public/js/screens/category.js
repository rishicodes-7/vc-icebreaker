import { getState } from "../state.js";
import { emitChangeCategory, emitStartGame } from "../socket.js";

export function initCategory() {

  // --- Category card clicks ---
  const grid = document.querySelector(".category-grid-select");
  grid?.addEventListener("click", e => {
    const card = e.target.closest(".category-card-select");
    if (!card) return;

    const state = getState();
    if (!state.isHost) return;

    const category = card.dataset.category;
    if (!category) return;

    // Visual feedback immediately
    document.querySelectorAll(".category-card-select").forEach(c => {
      c.classList.remove("selected");
    });
    card.classList.add("selected");

    emitChangeCategory(state.roomId, category);
  });

  // --- Start game button ---
  const startBtn = document.getElementById("startGameBtn");
  startBtn?.addEventListener("click", () => {
    const state = getState();
    if (!state.isHost) return;
    if (!state.category) return;
    emitStartGame(state.roomId);
  });
}