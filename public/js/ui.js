import { getState, hasVotedThisRound } from "./state.js";

export function showScreen(screenId) {
  ["lobbyScreen", "categorySelectScreen", "gameScreen"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  const target = document.getElementById(screenId);
  if (target) target.classList.remove("hidden");
}

let toastTimer;
export function showToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 2800);
}

export function renderFromState() {
  const state = getState();
  switch (state.phase) {
    case "lobby":
      showScreen("lobbyScreen");
      break;
    case "category_select":
      lastQuestion = null;
      showScreen("categorySelectScreen");
      renderCategoryScreen(state);
      break;
    case "playing":
      showScreen("gameScreen");
      renderGameScreen(state);
      break;
    case "done":
      showScreen("gameScreen");
      renderGameScreen(state);
      renderDoneOverlay(state);
      break;
  }
}

// ============================================================
// CATEGORY SCREEN
// ============================================================
function renderCategoryScreen(state) {
  const hostView   = document.getElementById("hostCategoryView");
  const playerView = document.getElementById("playerWaitingView");
  if (state.isHost) {
    hostView?.classList.remove("hidden");
    playerView?.classList.add("hidden");
    renderHostCategoryView(state);
  } else {
    hostView?.classList.add("hidden");
    playerView?.classList.remove("hidden");
    renderPlayerWaitingView(state);
  }
}

function renderHostCategoryView(state) {
  const countEl = document.getElementById("playerCountText");
  if (countEl) {
    const n = state.players.length;
    countEl.textContent = `${n} ${n === 1 ? "player" : "players"} in the room`;
  }
  const codeEl = document.getElementById("categoryRoomCode");
  if (codeEl) codeEl.textContent = state.roomId || "—";
  document.querySelectorAll(".category-card-select").forEach(card => {
    card.classList.toggle("selected", card.dataset.category === state.category);
  });
  const startBtn = document.getElementById("startGameBtn");
  if (startBtn) startBtn.disabled = !state.category;
}

function renderPlayerWaitingView(state) {
  const preview = document.getElementById("categoryPreview");
  if (preview) {
    if (state.category) {
      preview.classList.remove("hidden");
      const info = getCategoryInfo(state.category);
      const emojiEl = document.getElementById("chosenCategoryEmoji");
      const nameEl  = document.getElementById("chosenCategoryName");
      if (emojiEl) emojiEl.textContent = info.emoji;
      if (nameEl)  nameEl.textContent  = info.name;
    } else {
      preview.classList.add("hidden");
    }
  }
  const listEl = document.getElementById("waitingPlayersList");
  if (listEl) {
    listEl.innerHTML = "";
    state.players.forEach(p => {
      const chip = document.createElement("div");
      chip.className = `player-chip ${p.isHost ? "is-host" : ""}`;
      chip.textContent = `${p.isHost ? "👑 " : ""}${p.name}`;
      listEl.appendChild(chip);
    });
  }
}

// ============================================================
// GAME SCREEN
// ============================================================
function renderGameScreen(state) {
  renderTopBar(state);
  renderPlayerList(state);
  renderHostPanel(state);
  renderProgress(state);
  renderQuestion(state);
  renderReactionBar(state);
  renderVotingPanel(state);
  renderScoreboard(state);

  // Always hide done overlay if not done
  if (state.phase !== "done") {
    document.getElementById("doneOverlay")?.classList.add("hidden");
  }
}

function renderTopBar(state) {
  const roomStatus = document.getElementById("roomStatus");
  if (roomStatus) {
    roomStatus.textContent = `${state.roomId || ""}${state.isLocked ? " 🔒" : ""}`;
  }
}

function renderPlayerList(state) {
  const list = document.getElementById("playerList");
  if (!list) return;

  const scores = state.scores || {};
  const sorted = [...state.players].sort((a, b) => {
    return (scores[b.name] || 0) - (scores[a.name] || 0);
  });

  list.innerHTML = "";
  sorted.forEach((p, i) => {
    const chip = document.createElement("div");
    chip.className = `player-chip ${p.isHost ? "is-host" : ""}`;
    chip.dataset.playerName = p.name;

    const score = scores[p.name] || 0;
    const rank = i === 0 && score > 0 ? "🥇"
               : i === 1 && score > 0 ? "🥈"
               : i === 2 && score > 0 ? "🥉" : "";

    chip.innerHTML = `
      ${p.isHost ? '<span class="host-crown">👑</span>' : ""}
      ${rank ? `<span class="rank-badge">${rank}</span>` : ""}
      <span class="player-name">${p.name}</span>
      ${score > 0 ? `<span style="font-size:0.7rem;color:var(--gold);margin-left:4px">${score}⭐</span>` : ""}
    `;

    if (state.isHost && !p.isHost) {
      const tBtn = document.createElement("button");
      tBtn.className = "transfer-btn";
      tBtn.textContent = "Make host";
      tBtn.addEventListener("click", () => {
        if (confirm(`Make ${p.name} the host?`)) {
          import("./socket.js").then(({ emitTransferHost }) => {
            emitTransferHost(state.roomId, p.id);
          });
        }
      });
      chip.appendChild(tBtn);
    }
    list.appendChild(chip);
  });
}

function renderHostPanel(state) {
  const panel = document.getElementById("hostControlsPanel");
  if (!panel) return;
  panel.classList.toggle("hidden", !state.isHost);
  if (!state.isHost) return;
  const lockBtn = document.getElementById("lockRoomBtn");
  if (lockBtn) lockBtn.textContent = state.isLocked ? "🔓 Unlock" : "🔒 Lock";
}

function renderProgress(state) {
  const fill  = document.getElementById("progressFill");
  const label = document.getElementById("progressLabel");
  const pct   = state.total > 0 ? (state.usedCount / state.total) * 100 : 0;
  if (fill)  fill.style.width = `${pct}%`;
  if (label) label.textContent = `${state.usedCount} / ${state.total}`;
}

let lastQuestion = null;
function renderQuestion(state) {
  const card = document.getElementById("questionCard");
  const el   = document.getElementById("question");
  const turn = document.getElementById("turnBadge");
  if (!card || !el) return;

  const text = state.currentQuestion || "Press Next to begin.";
  if (text !== lastQuestion) {
    card.classList.remove("is-animating");
    void card.offsetWidth;
    card.classList.add("is-animating");
    el.textContent = text;
    lastQuestion = text;
  }

  if (turn) {
    if (state.currentQuestion) {
      turn.textContent = "Answer out loud!";
      turn.classList.remove("hidden");
    } else {
      turn.classList.add("hidden");
    }
  }
}

function renderReactionBar(state) {
  const bar = document.getElementById("reactionBar");
  if (!bar) return;
  bar.classList.toggle("hidden", !state.currentQuestion || state.phase === "done");
}

function renderVotingPanel(state) {
  const panel = document.getElementById("votingPanel");
  const list  = document.getElementById("voteList");
  if (!panel || !list) return;

  const canVote = !!state.currentQuestion
    && state.players.length > 1
    && state.phase === "playing";

  panel.classList.toggle("hidden", !canVote);
  if (!canVote) { list.innerHTML = ""; return; }

  const voted = hasVotedThisRound();
  list.innerHTML = "";
  const myState = getState();

  state.players.forEach(p => {
    if (p.name === myState.myName) return;
    const btn = document.createElement("button");
    btn.className = "vote-btn";
    btn.textContent = voted ? `✓ ${p.name}` : `👑 ${p.name}`;
    btn.disabled = voted;
    btn.dataset.voteFor = p.name;
    list.appendChild(btn);
  });
}

function renderScoreboard(state) {
  const board = document.getElementById("scoreBoard");
  const list  = document.getElementById("scoreList");
  if (!board || !list) return;

  const scores = state.scores || {};
  const hasScores = Object.values(scores).some(s => s > 0);
  board.classList.toggle("hidden", !hasScores);
  if (!hasScores) return;

  const sorted = Object.entries(scores)
    .filter(([, s]) => s > 0)
    .sort(([, a], [, b]) => b - a);

  list.innerHTML = "";
  const medals = ["🥇", "🥈", "🥉"];
  sorted.forEach(([name, score], i) => {
    const item = document.createElement("div");
    item.className = "score-item";
    item.innerHTML = `<span>${medals[i] || `${i + 1}.`} ${name}</span><span>${score} ⭐</span>`;
    list.appendChild(item);
  });
}

// ============================================================
// DONE OVERLAY
// ============================================================
function renderDoneOverlay(state) {
  const overlay = document.getElementById("doneOverlay");
  const list    = document.getElementById("leaderboardList");
  const playBtn = document.getElementById("playAgainBtn");
  if (!overlay || !list) return;

  overlay.classList.remove("hidden");

  const scores = state.scores || {};
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const medals = ["🥇", "🥈", "🥉"];
  list.innerHTML = "";

  if (sorted.length === 0) {
    list.innerHTML = `<p style="color:var(--text-2);text-align:center">No votes were cast.</p>`;
  } else {
    sorted.forEach(([name, score], i) => {
      const row = document.createElement("div");
      row.className = "lb-row";
      row.innerHTML = `
        <span class="lb-rank">${medals[i] || `${i + 1}.`}</span>
        <span class="lb-name">${name}</span>
        <span class="lb-score">${score} ⭐</span>
      `;
      list.appendChild(row);
    });
  }

  if (playBtn) playBtn.style.display = state.isHost ? "inline-block" : "none";
  spawnConfetti();
}

// ============================================================
// CONFETTI
// ============================================================
function spawnConfetti() {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:998;";
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx    = canvas.getContext("2d");
  const colors = ["#ff4b4b","#ffc840","#3ddc84","#ff73b4","#7ce7ff","#ffffff"];
  const pieces = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width, y: -10,
    vx: (Math.random() - 0.5) * 5,   vy: 2 + Math.random() * 4,
    size: 5 + Math.random() * 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI, rotV: (Math.random() - 0.5) * 0.2,
  }));
  const start = performance.now();
  function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.rot += p.rotV;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    if (now - start < 4000) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

// ============================================================
// CATEGORY INFO
// ============================================================
export function getCategoryInfo(category) {
  const map = {
    all:       { emoji:"🎲", name:"All" },
    chill:     { emoji:"🌙", name:"Chill" },
    funny:     { emoji:"😂", name:"Funny" },
    spicy:     { emoji:"🔥", name:"Spicy" },
    deep:      { emoji:"🧠", name:"Deep" },
    chaos:     { emoji:"😈", name:"Chaos" },
    work:      { emoji:"💼", name:"Work" },
    nostalgia: { emoji:"📼", name:"Nostalgia" },
    creative:  { emoji:"🎨", name:"Creative" },
    gaming:    { emoji:"🎮", name:"Gaming" },
    travel:    { emoji:"✈️", name:"Travel" },
    music:     { emoji:"🎵", name:"Music" },
    food:      { emoji:"🍕", name:"Food" },
    romance:   { emoji:"💕", name:"Romance" },
    journey:   { emoji:"🛤️", name:"Life Journey" },
    mystery:   { emoji:"🔮", name:"Mystery" },
    tech:      { emoji:"💻", name:"Tech" },
    party:     { emoji:"🎉", name:"Party Mix" },
    soulful:   { emoji:"😭", name:"Soulful" },
    dares:     { emoji:"🎯", name:"Dares" },
  };
  return map[category] || { emoji:"🎲", name: category };
}