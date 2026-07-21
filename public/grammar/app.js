const unitIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 69, 92, 93];
const units = new Map();
const synth = window.speechSynthesis;
const state = { unit: null, items: [], index: 0, phase: "idle", paused: false, timer: null, token: 0 };

const el = Object.fromEntries([
  "sidebar", "unit-list", "search", "unit-title", "empty-state", "card", "progress", "status",
  "start-panel", "question-count", "start", "exercise", "question", "countdown", "answer",
  "previous", "again", "pause", "next", "open-menu", "close-menu", "scrim"
].map(id => [id, document.getElementById(id)]));

const labelFor = id => `Unit ${id}`;
const delay = ms => new Promise(resolve => { state.timer = setTimeout(resolve, ms); });

function stop() {
  state.token += 1;
  clearTimeout(state.timer);
  synth.cancel();
  state.paused = false;
  el.pause.textContent = "Pause";
}

function setMenu(open) {
  el.sidebar.classList.toggle("open", open);
  el.scrim.classList.toggle("open", open);
}

function renderUnits(term = "") {
  el["unit-list"].replaceChildren();
  const query = term.trim().toLowerCase().replace(/\s/g, "");
  for (const id of unitIds) {
    const button = document.createElement("button");
    button.className = "unit-button";
    button.classList.toggle("active", state.unit === id);
    button.dataset.id = id;
    button.hidden = !(`unit${id}`.includes(query));
    const name = document.createElement("span");
    name.textContent = labelFor(id);
    const count = document.createElement("span");
    count.className = "unit-count";
    count.textContent = units.has(id) ? units.get(id).length : "";
    button.append(name, count);
    button.addEventListener("click", () => selectUnit(id));
    el["unit-list"].append(button);
  }
}

async function loadUnit(id) {
  if (units.has(id)) return units.get(id);
  const response = await fetch(`units/unit${id}.json`);
  if (!response.ok) throw new Error(`Could not load Unit ${id}`);
  const data = await response.json();
  units.set(id, data);
  return data;
}

async function selectUnit(id) {
  stop();
  el.status.textContent = "Loading…";
  try {
    state.items = await loadUnit(id);
    state.unit = id;
    state.index = 0;
    document.querySelectorAll(".unit-button").forEach(button => button.classList.toggle("active", Number(button.dataset.id) === id));
    el["unit-title"].textContent = labelFor(id);
    el["empty-state"].classList.add("hidden");
    el.card.classList.remove("hidden");
    el.exercise.classList.add("hidden");
    el["start-panel"].classList.remove("hidden");
    el["question-count"].textContent = `${state.items.length} questions`;
    el.progress.textContent = labelFor(id);
    el.status.textContent = "Ready";
    renderUnits(el.search.value);
    setMenu(false);
  } catch (error) {
    el.status.textContent = error.message;
  }
}

function chooseVoice() {
  const voices = synth.getVoices();
  return voices.find(v => /Connor.*Ireland/i.test(v.name))
    || voices.find(v => /Ireland/i.test(v.name) && /^en/i.test(v.lang))
    || voices.find(v => /^en-IE$/i.test(v.lang))
    || voices.find(v => /^en-GB/i.test(v.lang))
    || voices.find(v => /^en/i.test(v.lang));
}

function speak(text, token) {
  return new Promise(resolve => {
    if (token !== state.token) return resolve();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = chooseVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || "en-IE";
    utterance.rate = 0.95;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    synth.speak(utterance);
  });
}

async function runQuestion() {
  stop();
  const token = state.token;
  const item = state.items[state.index];
  el.question.textContent = item.q;
  el.answer.textContent = item.a;
  el.answer.classList.remove("visible");
  el.progress.textContent = `${state.index + 1} / ${state.items.length}`;
  el.previous.disabled = state.index === 0;
  el.next.disabled = state.index === state.items.length - 1;
  state.phase = "countdown";

  for (let number = 3; number > 0; number -= 1) {
    el.countdown.textContent = number;
    el.status.textContent = "Think…";
    await delay(1000);
    while (state.paused && token === state.token) await delay(100);
    if (token !== state.token) return;
  }

  el.countdown.textContent = "";
  el.answer.classList.add("visible");
  el.status.textContent = "Listen";
  state.phase = "speaking";
  await speak(item.a, token);
  if (token !== state.token) return;
  state.phase = "waiting";
  el.status.textContent = "Next question soon…";
  await delay(1800);
  while (state.paused && token === state.token) await delay(100);
  if (token !== state.token) return;
  if (state.index < state.items.length - 1) {
    state.index += 1;
    runQuestion();
  } else {
    state.phase = "done";
    el.status.textContent = "Complete";
  }
}

el.start.addEventListener("click", () => {
  el["start-panel"].classList.add("hidden");
  el.exercise.classList.remove("hidden");
  runQuestion();
});
el.previous.addEventListener("click", () => { if (state.index > 0) { state.index -= 1; runQuestion(); } });
el.next.addEventListener("click", () => { if (state.index < state.items.length - 1) { state.index += 1; runQuestion(); } });
el.again.addEventListener("click", runQuestion);
el.pause.addEventListener("click", () => {
  state.paused = !state.paused;
  el.pause.textContent = state.paused ? "Resume" : "Pause";
  if (state.phase === "speaking") state.paused ? synth.pause() : synth.resume();
  el.status.textContent = state.paused ? "Paused" : (state.phase === "countdown" ? "Think…" : "Listen");
});
el.search.addEventListener("input", () => renderUnits(el.search.value));
el["open-menu"].addEventListener("click", () => setMenu(true));
el["close-menu"].addEventListener("click", () => setMenu(false));
el.scrim.addEventListener("click", () => setMenu(false));
window.addEventListener("beforeunload", () => synth.cancel());

renderUnits();
Promise.all(unitIds.map(loadUnit)).then(() => renderUnits(el.search.value));
