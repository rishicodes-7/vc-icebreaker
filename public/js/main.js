import { connectSocket, setCallbacks } from "./socket.js";
import { renderFromState, showToast }  from "./ui.js";
import { initLobby }    from "./screens/lobby.js";
import { initCategory } from "./screens/category.js";
import { initGame }     from "./screens/game.js";

document.addEventListener("DOMContentLoaded", () => {

  initLobby();
  initCategory();
  initGame();

  // Break the circular dependency — pass ui functions into socket
  setCallbacks(renderFromState, showToast);
  connectSocket();

  // Pre-fill room code from invite URL
  const urlRoom = new URLSearchParams(window.location.search).get("room");
  if (urlRoom) {
    const roomInput = document.getElementById("roomInput");
    if (roomInput) roomInput.value = urlRoom.toUpperCase();
    document.getElementById("lobbyJoin")?.classList.remove("hidden");
    document.getElementById("nameInputJoin")?.focus();
  }
  // Register service worker for PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
});