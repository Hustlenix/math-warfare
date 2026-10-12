import { PERSONALITIES, cleanText, conversationContext, normalizeHistory } from "./npc-personalities.js";

// Only the URL is public. A provider key must never be a VITE_* variable.
const endpoint = import.meta.env.VITE_NPC_ENDPOINT || "";
export function createConversations({ state, open, close, content, portrait, esc, modalHead, bindClose }) {
  const memories = new Map(); // This session only; no private conversations in the save file.
  let pending = null;
  let generation = 0;
  function cancel() { generation++; pending?.abort(); pending = null; }
  function talk(n) {
    const p = PERSONALITIES[n.id];
    if (!p) return;
    cancel();
    const context = conversationContext(state, n);
    const greeting = state.completed.includes(n.id)
      ? `${p.greeting} And thanks again for helping me earlier.` : p.greeting;
    const history = memories.get(n.id) ?? [];
    open(modalHead(esc(p.temperament), esc(p.name)) +
      `<div class="npc-speaker">${portrait(n)}<p>${esc(n.activity ?? "Taking a break")}</p></div>
      <div id="npc-log" class="npc-log" role="log" aria-label="Conversation with ${esc(p.name)}" aria-live="polite"></div>
      <p id="npc-status" role="status" class="muted"></p>
      <div class="npc-prompts"><button type="button" data-say="How has your day been?">How's your day?</button><button type="button" data-say="What do you think of the other neighbours?">Village gossip</button><button type="button" data-say="What could I help with around here?">Need a hand?</button></div>
      <form id="npc-form"><label for="npc-message">Say something to ${esc(p.name)}</label><div class="npc-compose"><input id="npc-message" maxlength="400" autocomplete="off" placeholder="What's on your mind?" required><button id="npc-send" class="primary" type="submit">Say it</button></div></form>
      <p class="npc-disclosure muted">${endpoint ? "AI-powered fictional character. Your message and recent dialogue are sent to the conversation provider. Don't share private details. Conversation memory lasts until you close this game tab." : "This is an authored character greeting. Live AI conversations are not enabled in this build."}</p>
      <div class="button-row"><button id="npc-return">Back</button><button id="npc-forget">Forget this conversation</button></div>`);
    bindClose();
    const log = content.querySelector("#npc-log"), status = content.querySelector("#npc-status"), input = content.querySelector("#npc-message"), send = content.querySelector("#npc-send");
    const stamp = generation;
    function line(role, text) {
      const bubble = document.createElement("p");
      bubble.className = `npc-line npc-${role}`;
      const who = document.createElement("strong");
      who.textContent = role === "user" ? "You" : p.name;
      const words = document.createElement("span");
      words.textContent = text;
      bubble.append(who, words); log.append(bubble);
      while (log.children.length > 9) log.children[1].remove();
      log.scrollTop = log.scrollHeight;
    }
    line("assistant", greeting);
    history.forEach((m) => line(m.role, m.content));
    if (!endpoint) {
      status.textContent = "Live conversations aren't connected yet. You can still visit and help your neighbours.";
      input.disabled = send.disabled = true;
      content.querySelectorAll("[data-say]").forEach((b) => b.disabled = true);
    }
    content.querySelector("#npc-return").onclick = () => { cancel(); n.onReturn ? n.onReturn() : close(); };
    content.querySelector("#npc-forget").onclick = () => { memories.delete(n.id); talk(n); };
    content.querySelectorAll("[data-say]").forEach((b) => b.onclick = () => { input.value = b.dataset.say; input.focus(); });
    content.querySelector("#npc-form").onsubmit = async (event) => {
      event.preventDefault();
      if (pending || !endpoint) return;
      const message = cleanText(input.value, 400);
      if (!message) return;
      pending = new AbortController();
      const controller = pending;
      const timeout = setTimeout(() => controller.abort(), 22000);
      input.disabled = send.disabled = true;
      content.querySelectorAll("[data-say]").forEach((b) => b.disabled = true);
      status.textContent = `${p.name} is thinking…`;
      try {
        const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
          body: JSON.stringify({ npc: n.id, message, history: normalizeHistory(history), context }) });
        if (!response.ok) throw new Error(response.status === 429 ? "busy" : "unavailable");
        const result = await response.json();
        const reply = cleanText(result.reply, 700);
        if (!reply) throw new Error("empty");
        if (stamp !== generation || !log.isConnected) return;
        line("user", message); line("assistant", reply);
        history.push({ role: "user", content: message }, { role: "assistant", content: reply });
        history.splice(0, Math.max(0, history.length - 8));
        memories.set(n.id, history);
        input.value = ""; status.textContent = "";
      } catch (error) {
        if (stamp !== generation || !log.isConnected) return;
        status.textContent = error.message === "busy" ? "The conversation service is busy. Give it a moment, then try again." : "Couldn't reach the conversation service. Your message is still here—try again in a moment.";
      } finally {
        clearTimeout(timeout);
        if (pending === controller) pending = null;
        if (stamp === generation && log.isConnected) {
          input.disabled = send.disabled = false;
          content.querySelectorAll("[data-say]").forEach((b) => b.disabled = false);
          input.focus();
        }
      }
    };
  }
  function add(n, onReturn) {
    if (!PERSONALITIES[n.id]) return;
    const button = document.createElement("button");
    button.type = "button"; button.textContent = `Talk to ${n.name}`;
    button.className = "npc-talk";
    button.onclick = () => talk({ ...n, onReturn });
    content.append(button);
  }
  return { talk, add, cancel };
}
