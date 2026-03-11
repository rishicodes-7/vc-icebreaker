// Single source of truth for client-side state.
// Nothing in here touches the DOM — it just holds data.

const state = {
  // Set when the player joins a room
  roomId:   null,
  myName:   null,
  myId:     null,   // socket.id — set after connect
  isHost:   false,

  // Mirror of server room state (updated on every roomState event)
  phase:           "lobby",   // lobby | category_select | playing | done
  players:         [],        // [{ id, name, isHost }]
  category:        null,
  currentQuestion: null,
  usedCount:       0,
  total:           0,
  isLocked:        false,
  hostId:          null,
};

// Called by socket.js every time "roomState" arrives from server
export function applyServerState(serverState) {
  state.phase           = serverState.phase;
  state.players         = serverState.players  || [];
  state.category        = serverState.category || null;
  state.currentQuestion = serverState.currentQuestion || null;
  state.usedCount       = serverState.usedCount || 0;
  state.total           = serverState.total     || 0;
  state.isLocked        = serverState.isLocked  || false;
  state.hostId          = serverState.hostId    || null;

  // Recompute isHost every time state arrives
  state.isHost = state.myId !== null && state.myId === state.hostId;
}

export function setIdentity(roomId, name, socketId) {
  state.roomId = roomId;
  state.myName = name;
  state.myId   = socketId;
}

export function getState() {
  return state;
}


export function getMyScore() {
  return state.scores[state.myName] || 0;
}

export function hasVotedThisRound() {
  return !!state.votedThisRound[state.myId];
}