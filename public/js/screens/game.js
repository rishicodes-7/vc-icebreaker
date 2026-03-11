import { getState } from "../state.js";
import { showToast } from "../ui.js";
import {
  emitNextQuestion,
  emitPrevQuestion,
  emitReaction,
  emitToggleLock,
  emitResetGame,
  emitTransferHost,
} from "../socket.js";

export function initGame() {

  // --- Players toggle ---
  const playersToggle = document.getElementById("playersToggle");
  const playerList    = document.getElementById("playerList");

  playersToggle?.addEventListener("click", () => {
    playerList?.classList.toggle("hidden");
  });

  document.addEventListener("click", e => {
    if (
      playerList &&
      !playerList.classList.contains("hidden") &&
      !playerList.contains(e.target) &&
      e.target !== playersToggle
    ) {
      playerList.classList.add("hidden");
    }
  });

  // --- Host controls toggle ---
  const hostToggle = document.getElementById("hostControlsToggle");
  const hostBody   = document.getElementById("hostControlsContent");
  const hostIcon   = document.getElementById("hostToggleIcon");

  hostToggle?.addEventListener("click", () => {
    const collapsed = hostBody?.classList.contains("collapsed");
    hostBody?.classList.toggle("collapsed", !collapsed);
    if (hostIcon) hostIcon.textContent = collapsed ? "▾" : "▴";
  });

  // --- Prev question ---
  const prevBtn = document.getElementById("prevBtn");
  prevBtn?.addEventListener("click", () => {
    const { roomId, isHost } = getState();
    if (!roomId || !isHost) return;
    emitPrevQuestion(roomId);
  });

  // --- Next question ---
  const nextBtn = document.getElementById("nextBtn");
  nextBtn?.addEventListener("click", () => {
    const { roomId, isHost } = getState();
    if (!roomId || !isHost) return;
    emitNextQuestion(roomId);
  });

  // --- Skip (same as next) ---
  const skipBtn = document.getElementById("skipBtn");
  skipBtn?.addEventListener("click", () => {
    const { roomId, isHost } = getState();
    if (!roomId || !isHost) return;
    emitNextQuestion(roomId);
  });

  // --- Reset game ---
  const resetBtn = document.getElementById("resetBtn");
  resetBtn?.addEventListener("click", () => {
    const { roomId, isHost } = getState();
    if (!roomId || !isHost) return;
    if (confirm("Reset the game? This clears all questions and scores.")) {
      emitResetGame(roomId);
    }
  });

  // --- Lock / unlock room ---
  const lockBtn = document.getElementById("lockRoomBtn");
  lockBtn?.addEventListener("click", () => {
    const { roomId, isHost } = getState();
    if (!roomId || !isHost) return;
    emitToggleLock(roomId);
  });

  // --- Timer toggle ---
  const timerToggle  = document.getElementById("timerToggle");
  const timerOptions = document.getElementById("timerOptions");
  timerToggle?.addEventListener("change", () => {
    timerOptions?.classList.toggle("hidden", !timerToggle.checked);
  });

  // --- Reactions ---
  const reactionBar = document.getElementById("reactionBar");
  reactionBar?.addEventListener("click", e => {
    const btn = e.target.closest(".reaction-btn");
    if (!btn) return;
    const emoji = btn.dataset.emoji;
    const { roomId, currentQuestion } = getState();
    if (!emoji || !roomId || !currentQuestion) return;
    emitReaction(roomId, emoji);
    btn.classList.add("active");
    setTimeout(() => btn.classList.remove("active"), 150);
  });

  // --- Copy question ---
  const copyBtn = document.getElementById("copyQuestionBtn");
  copyBtn?.addEventListener("click", async () => {
    const text = document.getElementById("question")?.textContent;
    if (!text || text === "Press Next to begin.") return;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Question copied!");
    } catch {
      showToast("Couldn't copy — try manually");
    }
  });

  // --- Share room link ---
  const shareBtn = document.getElementById("inlineShareBtn");
  shareBtn?.addEventListener("click", async () => {
    const { roomId } = getState();
    if (!roomId) return;
    const link = `${window.location.origin}/?room=${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast("Room link copied!");
    } catch {
      showToast("Couldn't copy — try manually");
    }
  });

  // --- Leave room ---
  const leaveBtn = document.getElementById("leaveBtn");
  leaveBtn?.addEventListener("click", () => {
    if (confirm("Leave the room?")) {
      window.location.href = "/";
    }
  });

  // --- Play again ---
  const playAgainBtn = document.getElementById("playAgainBtn");
  playAgainBtn?.addEventListener("click", () => {
    const { roomId, isHost } = getState();
    if (!roomId || !isHost) return;
    emitResetGame(roomId);
  });

}