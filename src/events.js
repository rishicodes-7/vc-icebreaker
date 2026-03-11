const { createRoom, getRoom, roomExists, addPlayer, removePlayer, assignNewHost, transferHost } = require("./rooms");
const { setCategory, startGame, nextQuestion, prevQuestion, castVote, resetGame, getRoomState } = require("./game");

function registerEvents(io, socket) {

  // --- JOIN ROOM ---
  socket.on("joinRoom", ({ roomId, name }) => {
  if (!roomId || !name) return;

  roomId = roomId.toUpperCase().trim();
  name   = name.trim().slice(0, 20);

  if (!roomExists(roomId)) {
    createRoom(roomId, socket.id, name);
    const newRoom = getRoom(roomId);
    newRoom.phase = "category_select";  // ← THIS LINE is critical
  } else {
    const room = getRoom(roomId);
    if (room.isLocked) {
      socket.emit("error", { message: "Room is locked." });
      return;
    }
    addPlayer(roomId, socket.id, name, false);
  }

  socket.join(roomId);
  socket.data.roomId = roomId;
  socket.data.name   = name;

  io.to(roomId).emit("roomState", getRoomState(roomId));
});

  // --- CHANGE CATEGORY ---
  socket.on("changeCategory", ({ roomId, category }) => {
    const room = getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;
    if (room.phase !== "lobby" && room.phase !== "category_select") return;

    room.phase = "category_select";
    setCategory(roomId, category);
    io.to(roomId).emit("roomState", getRoomState(roomId));
  });

  // --- START GAME ---
  socket.on("startGame", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;
    if (!room.category) return;

    const ok = startGame(roomId);
    if (!ok) return;

    io.to(roomId).emit("roomState", getRoomState(roomId));
  });

  // --- NEXT QUESTION ---
  socket.on("nextQuestion", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || room.phase !== "playing") return;
    if (room.hostId !== socket.id) return;

    nextQuestion(roomId);
    io.to(roomId).emit("roomState", getRoomState(roomId));
  });

  // --- PREV QUESTION ---
  socket.on("prevQuestion", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || room.phase !== "playing") return;
    if (room.hostId !== socket.id) return;
    prevQuestion(roomId);
    io.to(roomId).emit("roomState", getRoomState(roomId));
  });

  
  // --- SEND REACTION ---
  socket.on("sendReaction", ({ roomId, emoji }) => {
    const room = getRoom(roomId);
    if (!room) return;

    const player = room.players[socket.id];
    if (!player) return;

    io.to(roomId).emit("reaction", { emoji, name: player.name });
  });

  // --- TOGGLE ROOM LOCK ---
  socket.on("toggleLock", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;

    room.isLocked = !room.isLocked;
    io.to(roomId).emit("roomState", getRoomState(roomId));
  });

  // --- TRANSFER HOST ---
  socket.on("transferHost", ({ roomId, targetId }) => {
    const room = getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;

    const ok = transferHost(roomId, targetId);
    if (!ok) return;

    const newHost = room.players[targetId];
    io.to(roomId).emit("hostChanged", { newHostName: newHost.name });
    io.to(roomId).emit("roomState", getRoomState(roomId));
  });

  // --- RESET GAME ---
  socket.on("resetGame", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;

    resetGame(roomId);
    io.to(roomId).emit("roomState", getRoomState(roomId));
  });

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId || !roomExists(roomId)) return;

    const room = getRoom(roomId);
    if (!room) return;

    const wasHost = room.hostId === socket.id;
    const updatedRoom = removePlayer(roomId, socket.id);

    if (!updatedRoom) {
      // Room is now empty, already deleted
      return;
    }

    if (wasHost) {
      const newHost = assignNewHost(roomId);
      if (newHost) {
        io.to(roomId).emit("hostChanged", { newHostName: newHost.name });
      }
    }

    io.to(roomId).emit("roomState", getRoomState(roomId));
  });

}

module.exports = { registerEvents };