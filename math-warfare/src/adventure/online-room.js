import {
  PROTOCOL,
  MAX_PLAYERS,
  Race,
  profile,
  roomCode,
  validCode,
} from "./online-model.js";

const peerId = (code) => `math-warefare-v${PROTOCOL}-${code.toLowerCase()}`;
const messages = {
  "peer-unavailable":
    "Room not found. Check the code and ask the host to keep their game open.",
  "unavailable-id": "That room code is busy. Create another room.",
  network: "Connection interrupted. Check your internet and try again.",
  "server-error": "The room service is unavailable. Try again shortly.",
  "socket-error": "Could not reach the room service. Try a different network.",
  "browser-incompatible":
    "This browser cannot use online play. Try current Chrome, Edge or Firefox.",
};
export class OnlineRoom {
  constructor(getProfile, changed, notice) {
    this.getProfile = getProfile;
    this.changed = changed;
    this.notice = notice;
    this.status = "offline";
    this.players = [];
    this.race = null;
    this.feedback = "";
    this.connections = new Map();
    this.members = new Map();
    this.generation = 0;
  }
  emit() {
    this.receivedAt = performance.now();
    this.changed(this);
  }
  async connect(code) {
    this.leave(false);
    const generation = this.generation;
    this.host = !code;
    this.code = code ?? roomCode();
    this.status = "connecting";
    this.error = "";
    this.emit();
    try {
      const { Peer } = await import("peerjs");
      if (generation !== this.generation) return;
      const peer = this.host
        ? new Peer(peerId(this.code), { debug: 0 })
        : new Peer({ debug: 0 });
      this.peer = peer;
      this.connectTimeout = setTimeout(
        () => this.fail("Connection timed out. Retry, or try another network."),
        15000,
      );
      peer.on("error", (error) => {
        if (generation !== this.generation) return;
        this.fail(
          messages[error.type] ?? "Online connection failed. Please retry.",
        );
      });
      peer.on("open", (id) => {
        if (generation !== this.generation) return;
        this.id = id;
        if (this.host) {
          this.members.set(id, { id, ...profile(this.getProfile()) });
          this.status = "connected";
          clearTimeout(this.connectTimeout);
          this.publish();
        } else
          this.attach(
            peer.connect(peerId(this.code), {
              reliable: true,
              serialization: "json",
              label: "math-warefare-v1",
            }),
            false,
            generation,
          );
      });
      peer.on("connection", (conn) => {
        if (this.host && generation === this.generation)
          this.attach(conn, true, generation);
        else conn.close();
      });
      peer.on("close", () => {
        if (generation === this.generation)
          this.fail("The online session ended. Rejoin or create a new room.");
      });
      peer.on("disconnected", () => {
        if (generation !== this.generation) return;
        if (this.status === "connecting")
          this.fail("The room service disconnected. Please retry.");
        else {
          this.notice(
            "Room discovery interrupted. Existing players can keep playing.",
          );
          if (!peer.destroyed) peer.reconnect();
        }
      });
      this.loop = setInterval(() => this.tick(), 100);
    } catch {
      if (generation === this.generation)
        this.fail("Online play could not load. Check your internet and retry.");
    }
  }
  join(code) {
    const cleaned = code.trim().toUpperCase();
    if (!validCode(cleaned)) {
      this.error = "Enter the eight-character room code.";
      this.emit();
      return;
    }
    return this.connect(cleaned);
  }
  attach(conn, incoming, generation) {
    const joinTimeout = setTimeout(() => {
      if (!this.members.has(conn.peer)) conn.close();
    }, 7000);
    this.connections.set(conn.peer, conn);
    let lastPosition = 0;
    conn.on("open", () => {
      if (generation !== this.generation) return conn.close();
      if (!incoming)
        this.send(conn, {
          type: "join",
          protocol: PROTOCOL,
          profile: this.getProfile(),
        });
    });
    conn.on("data", (data) => {
      if (generation !== this.generation || !data || typeof data !== "object")
        return;
      let size;
      try {
        size = JSON.stringify(data).length;
      } catch {
        return;
      }
      if (size > 16000) return;
      if (incoming) {
        if (data.type === "join") {
          if (this.members.has(conn.peer)) return;
          if (data.protocol !== PROTOCOL || this.members.size >= MAX_PLAYERS) {
            this.send(conn, {
              type: "reject",
              text:
                data.protocol !== PROTOCOL
                  ? "Update your game and retry."
                  : "This room is full (four players).",
            });
            setTimeout(() => conn.close(), 500);
            return;
          }
          clearTimeout(joinTimeout);
          this.members.set(conn.peer, {
            id: conn.peer,
            ...profile(data.profile),
          });
          this.publish();
          this.notice("A traveller joined your room.");
        } else if (this.members.has(conn.peer)) {
          if (data.type === "position" && Date.now() - lastPosition >= 75) {
            lastPosition = Date.now();
            this.members.set(conn.peer, {
              id: conn.peer,
              ...profile(data.profile),
            });
          } else if (data.type === "answer") this.handleAnswer(conn.peer, data);
        }
      } else if (data.type === "snapshot") {
        if (
          !Array.isArray(data.players) ||
          data.players.length > MAX_PLAYERS ||
          !data.players.some((p) => p.id === this.id)
        )
          return;
        clearTimeout(this.connectTimeout);
        clearTimeout(joinTimeout);
        this.status = "connected";
        this.players = data.players
          .filter((p) => typeof p.id === "string")
          .map((p) => ({ id: p.id, ...profile(p) }));
        const r = data.race;
        if (
          r &&
          (!["countdown", "question", "between", "results"].includes(r.phase) ||
            !Array.isArray(r.participants) ||
            r.participants.length > MAX_PLAYERS ||
            !Array.isArray(r.solved) ||
            r.solved.length > MAX_PLAYERS ||
            typeof r.question !== "string" ||
            r.question.length > 500 ||
            !r.scores ||
            typeof r.scores !== "object" ||
            !Number.isFinite(r.remaining) ||
            r.remaining < 0 ||
            r.remaining > 18000 ||
            !Number.isInteger(r.round) ||
            r.round < 0 ||
            r.round > 5 ||
            typeof r.id !== "string" ||
            r.id.length > 100)
        )
          return;
        this.race = r ?? null;
        this.emit();
      } else if (data.type === "feedback") {
        if (data.round !== this.race?.round) return;
        this.feedback =
          typeof data.text === "string" ? data.text.slice(0, 400) : "";
        this.answerAccepted = data.ok === true;
        this.emit();
      } else if (data.type === "reject")
        this.fail(
          typeof data.text === "string"
            ? data.text.slice(0, 100)
            : "Could not join room.",
        );
    });
    conn.on("close", () => {
      clearTimeout(joinTimeout);
      if (generation !== this.generation) return;
      this.connections.delete(conn.peer);
      if (incoming) {
        this.members.delete(conn.peer);
        this.hostRace?.remove(conn.peer);
        this.publish();
        this.notice("A traveller left the room.");
      } else
        this.fail(
          "The host left the room. Your solo adventure is still saved.",
        );
    });
    conn.on("error", () => {
      if (!incoming && generation === this.generation)
        this.fail("Could not connect to the host. Try another network.");
    });
  }
  send(conn, data) {
    if (conn?.open && (conn.dataChannel?.bufferedAmount ?? 0) < 65536) {
      try {
        conn.send(data);
      } catch {
        /* A close event resolves a failed channel. */
      }
    }
  }
  tick() {
    if (this.status !== "connected") return;
    const p = profile(this.getProfile());
    if (this.host) {
      this.members.set(this.id, { id: this.id, ...p });
      this.hostRace?.advance();
      this.cadence = (this.cadence ?? 0) + 1;
      if (this.cadence % 2 === 0) this.publish();
    } else {
      const key = JSON.stringify(p);
      if (key !== this.lastPosition) {
        this.lastPosition = key;
        this.send(this.connections.get(peerId(this.code)), {
          type: "position",
          profile: p,
        });
      }
    }
  }
  publish() {
    this.players = [...this.members.values()];
    this.race = this.hostRace?.snapshot() ?? null;
    const data = { type: "snapshot", players: this.players, race: this.race };
    for (const [id, conn] of this.connections)
      if (this.members.has(id)) this.send(conn, data);
    this.emit();
  }
  startRace(skill, level) {
    if (
      !this.host ||
      this.status !== "connected" ||
      this.members.size < 2 ||
      (this.race && this.race.phase !== "results")
    )
      return false;
    this.hostRace = new Race([...this.members.keys()], skill, Number(level));
    this.feedback = "";
    this.answerAccepted = false;
    this.publish();
    return true;
  }
  answer(raw) {
    if (!this.race) return;
    const data = { type: "answer", round: this.race.round, answer: raw };
    if (this.host) this.handleAnswer(this.id, data);
    else this.send(this.connections.get(peerId(this.code)), data);
  }
  handleAnswer(id, data) {
    const result = this.hostRace?.answer(id, data.round, data.answer);
    if (!result) return;
    if (id === this.id) {
      this.feedback = result.text;
      this.answerAccepted = result.ok;
    } else
      this.send(this.connections.get(id), {
        type: "feedback",
        round: data.round,
        ...result,
      });
    this.publish();
  }
  leave(emit = true) {
    this.generation++;
    clearInterval(this.loop);
    clearTimeout(this.connectTimeout);
    this.peer?.destroy();
    this.peer = null;
    this.connections.clear();
    this.members.clear();
    this.players = [];
    this.race = null;
    this.hostRace = null;
    this.status = "offline";
    this.feedback = "";
    this.error = "";
    this.lastPosition = null;
    if (emit) this.emit();
  }
  fail(message) {
    this.leave(false);
    this.error = message;
    this.status = "error";
    this.emit();
  }
}
