const rooms = {};

function createRoom(roomId, hostId, hostName) {
  rooms[roomId] = {
    id: roomId,
    hostId,
    players: {},
    phase: "lobby",       // lobby | category_select | playing | done
    category: null,
    isLocked: false,
  };
  addPlayer(roomId, hostId, hostName, true);
  return rooms[roomId];
}

function getRoom(roomId) {
  return rooms[roomId] || null;
}

function roomExists(roomId) {
  return !!rooms[roomId];
}

function addPlayer(roomId, socketId, name, isHost = false) {
  const room = getRoom(roomId);
  if (!room) return null;
  room.players[socketId] = { id: socketId, name, isHost };
  return room.players[socketId];
}

function removePlayer(roomId, socketId) {
  const room = getRoom(roomId);
  if (!room) return null;
  delete room.players[socketId];
  if (Object.keys(room.players).length === 0) {
    delete rooms[roomId];
    return null;
  }
  return room;
}

function getPlayers(roomId) {
  const room = getRoom(roomId);
  if (!room) return [];
  return Object.values(room.players);
}

function transferHost(roomId, newHostId) {
  const room = getRoom(roomId);
  if (!room || !room.players[newHostId]) return false;
  Object.values(room.players).forEach(p => p.isHost = false);
  room.players[newHostId].isHost = true;
  room.hostId = newHostId;
  return true;
}

function assignNewHost(roomId) {
  const room = getRoom(roomId);
  if (!room) return null;
  const remaining = Object.values(room.players);
  if (remaining.length === 0) return null;
  const newHost = remaining[0];
  newHost.isHost = true;
  room.hostId = newHost.id;
  return newHost;
}

module.exports = {
  createRoom, getRoom, roomExists,
  addPlayer, removePlayer, getPlayers,
  transferHost, assignNewHost,
};