import { emitJoin } from "../socket.js";
import { setIdentity } from "../state.js";
import { showToast } from "../ui.js";

const ADJS  = ["EPIC","CHILL","WILD","COOL","BOLD","FAST","KEEN","ZANY","MINT","NEON"];
const NOUNS = ["TEAM","CREW","PACK","GANG","CLUB","BAND","UNIT","HIVE","TRIO","QUAD"];

function generateRoomCode() {
  const adj  = ADJS[Math.floor(Math.random() * ADJS.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = Math.floor(Math.random() * 99) + 1;
  return `${adj}${noun}${num}`;
}

export function initLobby() {

  // --- DOM refs ---
  const goHostBtn      = document.getElementById("goHostBtn");
  const goJoinBtn      = document.getElementById("goJoinBtn");
  const navHostBtn     = document.getElementById("navHostBtn");
  const navJoinBtn     = document.getElementById("navJoinBtn");

  const lobbyHost      = document.getElementById("lobbyHost");
  const lobbyJoin      = document.getElementById("lobbyJoin");

  const backToHomeHost = document.getElementById("backToHomeHost");
  const backToHomeJoin = document.getElementById("backToHomeJoin");

  const nameInputHost  = document.getElementById("nameInputHost");
  const nameInputJoin  = document.getElementById("nameInputJoin");
  const roomInput      = document.getElementById("roomInput");

  const hostRoomCode   = document.getElementById("hostRoomCode");
  const regenerateBtn  = document.getElementById("regenerateBtn");
  const createBtn      = document.getElementById("createBtn");
  const joinBtn        = document.getElementById("joinBtn");

  // --- Set initial room code ---
  if (hostRoomCode) hostRoomCode.textContent = generateRoomCode();

  // --- Open modals ---
  function openModal(modalEl) {
    lobbyHost?.classList.add("hidden");
    lobbyJoin?.classList.add("hidden");
    modalEl?.classList.remove("hidden");
  }

  function closeModals() {
    lobbyHost?.classList.add("hidden");
    lobbyJoin?.classList.add("hidden");
  }

  goHostBtn?.addEventListener("click",  () => openModal(lobbyHost));
  navHostBtn?.addEventListener("click", () => openModal(lobbyHost));
  goJoinBtn?.addEventListener("click",  () => openModal(lobbyJoin));
  navJoinBtn?.addEventListener("click", () => openModal(lobbyJoin));

  // --- Close modals ---
  backToHomeHost?.addEventListener("click", closeModals);
  backToHomeJoin?.addEventListener("click", closeModals);

  // Close on backdrop click
  lobbyHost?.addEventListener("click", e => { if (e.target === lobbyHost) closeModals(); });
  lobbyJoin?.addEventListener("click", e => { if (e.target === lobbyJoin) closeModals(); });

  // --- Regenerate room code ---
  regenerateBtn?.addEventListener("click", () => {
    if (hostRoomCode) hostRoomCode.textContent = generateRoomCode();
  });

  // --- Auto uppercase room input ---
  roomInput?.addEventListener("input", () => {
    roomInput.value = roomInput.value.toUpperCase();
  });

  // --- Create room (host) ---
  function handleCreate() {
    const name = nameInputHost?.value.trim();
    const code = hostRoomCode?.textContent.trim();

    if (!name) { showToast("Enter your name!"); return; }
    if (!code) { showToast("No room code found."); return; }

    setIdentity(code, name, null);
    emitJoin(code, name);
    closeModals();

    // Update URL so others can share it
    const url = new URL(window.location.href);
    url.searchParams.set("room", code);
    window.history.replaceState({}, "", url.toString());
  }

  // --- Join room ---
  function handleJoin() {
    const name = nameInputJoin?.value.trim();
    const code = roomInput?.value.trim().toUpperCase();

    if (!name) { showToast("Enter your name!"); return; }
    if (!code) { showToast("Enter a room code!"); return; }

    setIdentity(code, name, null);
    emitJoin(code, name);
    closeModals();

    const url = new URL(window.location.href);
    url.searchParams.set("room", code);
    window.history.replaceState({}, "", url.toString());
  }

  createBtn?.addEventListener("click", handleCreate);
  joinBtn?.addEventListener("click",   handleJoin);

  // Enter key support
  nameInputHost?.addEventListener("keydown", e => { if (e.key === "Enter") handleCreate(); });
  nameInputJoin?.addEventListener("keydown", e => { if (e.key === "Enter") handleJoin(); });
  roomInput?.addEventListener("keydown",     e => { if (e.key === "Enter") handleJoin(); });
}