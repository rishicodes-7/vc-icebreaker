import { applyServerState, setIdentity, getState } from "./state.js";

let onStateChange = null;
let onToast       = null;

export function setCallbacks(stateChangeCb, toastCb) {
  onStateChange = stateChangeCb;
  onToast       = toastCb;
}

let socket = null;

export function connectSocket() {
  socket = io();

  socket.on("connect", () => {
    const state = getState();
    if (state.roomId && state.myName) {
      socket.emit("joinRoom", { roomId: state.roomId, name: state.myName });
    }
  });

  socket.on("roomState", (serverState) => {
    setIdentity(getState().roomId, getState().myName, socket.id);
    applyServerState(serverState);
    if (onStateChange) onStateChange();
  });

  socket.on("hostChanged", ({ newHostName }) => {
    if (onToast) onToast(`👑 ${newHostName} is now the host`);
  });

  socket.on("reaction", ({ emoji, name }) => {
    spawnFloatingEmoji(emoji, name);
  });

  socket.on("error", ({ message }) => {
    if (onToast) onToast(message || "Something went wrong");
  });

  socket.on("disconnect", () => {
    if (onToast) onToast("Disconnected — reconnecting...");
  });
}

export function emitJoin(roomId, name) {
  if (!socket) return;
  socket.emit("joinRoom", { roomId, name });
}

export function emitChangeCategory(roomId, category) {
  if (!socket) return;
  socket.emit("changeCategory", { roomId, category });
}

export function emitStartGame(roomId) {
  if (!socket) return;
  socket.emit("startGame", { roomId });
}

export function emitNextQuestion(roomId) {
  if (!socket) return;
  socket.emit("nextQuestion", { roomId });
}


export function emitReaction(roomId, emoji) {
  if (!socket) return;
  socket.emit("sendReaction", { roomId, emoji });
}

export function emitToggleLock(roomId) {
  if (!socket) return;
  socket.emit("toggleLock", { roomId });
}

export function emitTransferHost(roomId, targetId) {
  if (!socket) return;
  socket.emit("transferHost", { roomId, targetId });
}

export function emitResetGame(roomId) {
  if (!socket) return;
  socket.emit("resetGame", { roomId });
}

export function emitPrevQuestion(roomId) {
  if (!socket) return;
  socket.emit("prevQuestion", { roomId });
}

function spawnFloatingEmoji(emoji, name) {
  const stage = document.getElementById("reactionStage");
  if (!stage) return;
  const el = document.createElement("div");
  el.className = "floating-emoji";
  el.textContent = emoji;
  el.style.left = `${10 + Math.random() * 75}%`;
  el.style.top  = `${20 + Math.random() * 50}%`;
  if (name) {
    const label = document.createElement("div");
    label.className = "emoji-label";
    label.textContent = name;
    el.appendChild(label);
  }
  if (stage.children.length >= 8) stage.removeChild(stage.firstElementChild);
  stage.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}