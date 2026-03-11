const { getRoom } = require("./rooms");
const { getQuestions } = require("./questions");

function setCategory(roomId, category) {
  const room = getRoom(roomId);
  if (!room) return false;
  room.category = category;
  return true;
}

function startGame(roomId) {
  const room = getRoom(roomId);
  if (!room || !room.category) return false;
  const questions = getQuestions(room.category);
  room.phase = "playing";
  room.questions = shuffle(questions);
  room.questionIndex = -1;
  room.currentQuestion = null;
  room.usedCount = 0;
  room.scores = {};
  room.votedThisRound = {};
  return true;
}

function nextQuestion(roomId) {
  const room = getRoom(roomId);
  if (!room || room.phase !== "playing") return null;
  room.questionIndex += 1;
  if (room.questionIndex >= room.questions.length) {
    room.phase = "done";
    room.currentQuestion = null;
    return null;
  }
  room.currentQuestion = room.questions[room.questionIndex];
  room.usedCount = room.questionIndex + 1;
  room.votedThisRound = {};
  return room.currentQuestion;
}

function castVote(roomId, voterId, votedForName) {
  const room = getRoom(roomId);
  if (!room || room.phase !== "playing") return false;
  if (!room.currentQuestion) return false;
  if (room.votedThisRound[voterId]) return false;
  room.votedThisRound[voterId] = votedForName;
  room.scores[votedForName] = (room.scores[votedForName] || 0) + 1;
  return true;
}

function resetGame(roomId) {
  const room = getRoom(roomId);
  if (!room) return false;
  room.phase = "category_select";
  room.category = null;
  room.questions = [];
  room.questionIndex = -1;
  room.currentQuestion = null;
  room.usedCount = 0;
  room.scores = {};
  room.votedThisRound = {};
  return true;
}

function getRoomState(roomId) {
  const room = getRoom(roomId);
  if (!room) return null;
  return {
    id: room.id,
    phase: room.phase,
    category: room.category,
    isLocked: room.isLocked,
    hostId: room.hostId,
    players: Object.values(room.players).map(p => ({
      id: p.id, name: p.name, isHost: p.isHost,
    })),
    currentQuestion: room.currentQuestion || null,
    usedCount: room.usedCount || 0,
    total: room.questions ? room.questions.length : 0,
    scores: room.scores || {},
    votedThisRound: room.votedThisRound || {},
  };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function prevQuestion(roomId) {
  const room = getRoom(roomId);
  if (!room || room.phase !== "playing") return null;
  if (room.questionIndex <= 0) return room.currentQuestion;
  room.questionIndex -= 1;
  room.currentQuestion = room.questions[room.questionIndex];
  room.usedCount = room.questionIndex + 1;
  room.votedThisRound = {};
  room.phase = "playing";
  return room.currentQuestion;
}

module.exports = { setCategory, startGame, nextQuestion, prevQuestion, castVote, resetGame, getRoomState };