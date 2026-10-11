import { OnlineRoom } from "./online-room.js";
import { SKILLS } from "./content.js";
import { portraitStyle } from "./wardrobe.js";

export function setupOnline({
  state,
  art,
  getWorld,
  open,
  close,
  esc,
  toast,
  panel,
  content,
}) {
  const $ = (id) => document.getElementById(id);
  let screen = null,
    phaseKey = "",
    notifiedRace = null,
    room;
  const profile = () => ({
    name: state.appearance.name,
    avatar: state.appearance.id,
    ...state.player,
    zone: state.zone,
    dir: getWorld()?.dir ?? 3,
    moving: getWorld()?.moving ?? false,
  });
  const head = (title) =>
    `<div class="modal-heading"><div><span class="eyebrow">PLAY WITH FRIENDS · NO LOGIN</span><h2>${title}</h2></div><button class="online-close" aria-label="Back to village">×</button></div>`;
  const bind = () => {
    content.querySelector(".online-close").onclick = () => {
      screen = null;
      close();
    };
  };
  function lobby() {
    screen = "lobby";
    phaseKey = "";
    if (room.status === "connected") {
      open(
        head("Your frontier crew.") +
          `<div class="room-code"><span>ROOM CODE</span><strong>${esc(room.code)}</strong><button id="copy-room">Copy code</button></div><p class="muted">Share this code with up to three friends. Keep the host’s game open.</p><div id="online-players" class="online-players"></div><div class="online-race-options"><label>Skill<select id="online-skill">${Object.entries(
            SKILLS,
          )
            .map(
              ([id, label]) =>
                `<option value="${id}" ${id === "mixed" ? "selected" : ""}>${label}</option>`,
            )
            .join(
              "",
            )}</select></label><label>Difficulty<select id="online-level"><option value="1">Warm-up</option><option value="2">Steady</option><option value="3">Challenge</option></select></label></div><p id="online-lobby-status" class="muted"></p><div class="online-buttons"><button id="online-race" class="primary">Start maths race</button><button id="online-explore">Explore together</button><button id="online-leave">Leave room</button></div><p class="muted online-fine">Five shared questions · three tries per question · room scores only. Village quests and coins remain your own.</p>`,
      );
      bind();
      $("copy-room").onclick = async () => {
        try {
          await navigator.clipboard.writeText(room.code);
          toast("Room code copied.");
        } catch {
          toast(`Room code: ${room.code}`);
        }
      };
      $("online-explore").onclick = () => {
        screen = null;
        close();
        getWorld().canvas.focus();
      };
      $("online-leave").onclick = () => {
        room.leave();
        lobby();
      };
      $("online-race").onclick = () => {
        if (room.race && room.race.phase !== "results") {
          showRace(true);
          return;
        }
        room.startRace($("online-skill").value, $("online-level").value);
      };
      updateLobby();
    } else {
      open(
        head("Bring a friend along.") +
          `<p>Roam the frontier together, then challenge your crew to a five-question maths race.</p><div class="online-identity"><span class="hero-mini" style="${portraitStyle(art, state.appearance.id, 2)}"></span><strong>${esc(state.appearance.name)}</strong><span>Change your name in the wardrobe.</span></div><button id="online-create" class="primary full">Create room</button><div class="online-divider">OR JOIN A FRIEND</div><form id="join-room"><label>Room code<input id="room-input" maxlength="8" minlength="8" placeholder="ABCD2345" autocapitalize="characters" autocomplete="off" spellcheck="false" required></label><button class="primary">Join room</button></form><p id="online-connect-status" role="status"></p><button id="online-cancel" hidden>Cancel connection</button><p class="muted online-fine">Online play uses a public connection service and shares your nickname, character and game position with your room. No camera or microphone. Some school networks may block connections.</p>`,
      );
      bind();
      $("online-create").onclick = () => room.connect();
      $("join-room").onsubmit = (e) => {
        e.preventDefault();
        room.join($("room-input").value);
      };
      $("online-cancel").onclick = () => room.leave();
      updateConnect();
    }
  }
  function updateConnect() {
    if (!$("online-connect-status")) return;
    const connecting = room.status === "connecting";
    $("online-connect-status").textContent = connecting
      ? "Connecting… this can take a few seconds."
      : room.error;
    $("online-create").disabled = connecting;
    $("join-room").querySelector("button").disabled = connecting;
    $("online-cancel").hidden = !connecting;
  }
  function playerList() {
    return room.players
      .map(
        (p) =>
          `<div class="online-player"><span class="hero-mini" style="${portraitStyle(art, p.avatar, 2)}"></span><span>${esc(p.name)}${p.id === room.id ? " · you" : ""}<small>${p.id === room.players[0]?.id ? "Host" : "Guest"}</small></span></div>`,
      )
      .join("");
  }
  function updateLobby() {
    if (!$("online-players")) return;
    const playersKey = JSON.stringify(
      room.players.map((p) => [p.id, p.name, p.avatar]),
    );
    if ($("online-players").dataset.players !== playersKey) {
      $("online-players").innerHTML = playerList();
      $("online-players").dataset.players = playersKey;
    }
    const running = room.race && room.race.phase !== "results";
    $("online-race").textContent = running
      ? "Return to race"
      : "Start maths race";
    $("online-race").disabled =
      !running && (!room.host || room.players.length < 2);
    for (const id of ["online-skill", "online-level"])
      $(id).disabled = !room.host || !!running;
    $("online-lobby-status").textContent = running
      ? "A race is in progress. Joining now lets you watch."
      : room.players.length < 2
        ? "Waiting for a friend. You can explore while they join."
        : room.host
          ? `${room.players.length} travellers ready. Choose your skill and start.`
          : "Ready! Your host will start the race.";
  }
  function scoreboard() {
    return room.players
      .filter((p) => room.race.participants.includes(p.id))
      .sort(
        (a, b) => (room.race.scores[b.id] ?? 0) - (room.race.scores[a.id] ?? 0),
      )
      .map(
        (p) =>
          `<li><span>${esc(p.name)}${p.id === room.id ? " · you" : ""}</span><b>${Number(room.race.scores[p.id]) || 0}</b>${room.race.solved.includes(p.id) ? "<small>✓</small>" : ""}</li>`,
      )
      .join("");
  }
  function showRace(force = false) {
    const r = room.race;
    if (!r || room.status !== "connected") return;
    const key = `${r.phase}:${r.round}`;
    // Never steal focus from a solo quest or the intro wardrobe.
    if (!force && panel.open && screen !== "race" && screen !== "lobby") return;
    if (screen !== "race" && r.phase === "results" && !force) return;
    if (key !== phaseKey || screen !== "race" || !panel.open) {
      screen = "race";
      phaseKey = key;
      room.feedback = "";
      const spectator = !r.participants.includes(room.id);
      const body =
        r.phase === "question"
          ? `<span class="eyebrow">ROUND ${r.round} / 5 · ${esc(SKILLS[r.skill] ?? "Mixed maths")}</span><h3 id="online-question" class="online-question">${esc(r.question)}</h3>${spectator ? "<p>You joined mid-race. Watch this round, then play the next race.</p>" : `<form id="online-answer-form"><label for="online-answer">Your answer</label><div class="online-answer-row"><input id="online-answer" inputmode="decimal" autocomplete="off" maxlength="32" required><button class="primary">Answer</button></div></form>`}<p id="online-feedback" role="status"></p>`
          : r.phase === "countdown"
            ? '<h3 class="online-question">Ready, crew?</h3><p>The same question for everyone. Accuracy first.</p>'
            : r.phase === "between"
              ? `<h3 class="online-question">The answer is ${esc(r.solution)}.</h3><p>Catch your breath. Next question incoming.</p>`
              : r.round < 5
                ? '<h3 class="online-question">Race ended early.</h3><p>A racer left. Invite a friend to start another race; your solo adventure is unchanged.</p>'
                : '<h3 class="online-question">Race complete!</h3><p>Good calculations, crew. Try a new skill or head back into town.</p>';
      open(
        head(
          r.phase === "results" ? "Frontier finish." : "Frontier maths race.",
        ) +
          `<div class="race-top"><span>${esc(room.code)}</span><strong id="online-clock"></strong></div>${body}<ol id="online-scores" class="online-scores" aria-label="Room scores"></ol><div class="online-buttons"><button id="online-lobby">Room lobby</button><button id="race-explore">Back to village</button></div>`,
      );
      bind();
      $("online-lobby").onclick = lobby;
      $("race-explore").onclick = () => {
        screen = null;
        close();
      };
      if ($("online-answer-form"))
        $("online-answer-form").onsubmit = (e) => {
          e.preventDefault();
          room.answer($("online-answer").value);
        };
      $("online-answer")?.focus();
    }
    updateRace();
  }
  function updateRace() {
    if (!$("online-scores") || !room.race) return;
    const scoreKey = JSON.stringify([
      room.race.scores,
      room.race.solved,
      room.race.participants,
      room.players.map((p) => [p.id, p.name]),
    ]);
    if ($("online-scores").dataset.scores !== scoreKey) {
      $("online-scores").innerHTML = scoreboard();
      $("online-scores").dataset.scores = scoreKey;
    }
    if ($("online-feedback")) {
      const solved = room.race.solved.includes(room.id);
      $("online-feedback").textContent =
        room.feedback ||
        (solved
          ? "Correct! Waiting for the crew."
          : "Three tries · decimals welcome.");
      if ($("online-answer")) {
        $("online-answer").disabled = solved;
        $("online-answer-form").querySelector("button").disabled = solved;
      }
    }
    clock();
  }
  function clock() {
    if (!$("online-clock") || !room.race) return;
    const seconds = Math.ceil(
      Math.max(0, room.race.remaining - (performance.now() - room.receivedAt)) /
        1000,
    );
    $("online-clock").textContent =
      room.race.phase === "results" ? `${room.race.round} / 5` : `${seconds}s`;
  }
  function changed() {
    const w = getWorld();
    if (w) w.remotePlayers = room.players.filter((p) => p.id !== room.id);
    $("online-open").textContent =
      room.status === "connected" ? `Crew ${room.players.length}/4` : "Online";
    $("online-open").classList.toggle("connected", room.status === "connected");
    $("online-hud").hidden = room.status !== "connected";
    $("online-room-code").textContent = room.code ?? "";
    $("online-hud-status").textContent =
      room.race && room.race.phase !== "results"
        ? `Race · ${room.race.round}/5`
        : `${room.players.length}/4 travellers`;
    if (!panel.open || !content.querySelector(".online-close")) screen = null;
    if (room.status === "error") {
      toast(room.error);
      if (
        screen === "race" ||
        (screen === "lobby" && !$("online-connect-status"))
      )
        lobby();
    }
    if (screen === "lobby") {
      if (room.status === "connected" && !$("online-players")) lobby();
      else if (room.status === "connected") updateLobby();
      else updateConnect();
    }
    if (room.race && room.race.phase !== "results") {
      if (screen === "race") showRace();
      else if (
        notifiedRace !== room.race.id &&
        (!panel.open || screen === "lobby")
      ) {
        notifiedRace = room.race.id;
        showRace(true);
      }
    } else if (screen === "race" && room.race) showRace();
  }
  room = new OnlineRoom(profile, changed, toast);
  setInterval(clock, 100);
  window.addEventListener("pagehide", () => room.leave(false));
  return {
    open: lobby,
    room,
    hide: () => {
      screen = null;
    },
  };
}
