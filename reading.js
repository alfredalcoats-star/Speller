/* ===================================================================
   Reading Boost — App Logic
   Structured, multisensory phonics lessons with mastery-based
   progression, spaced review of missed words, and accessibility
   helpers (dyslexia-friendly fonts, tints, read-aloud, reading ruler).
   =================================================================== */

const STORE_KEY = 'readingBoost.v1';
const MASTERY = 0.8;          // 80% first-try accuracy unlocks the next level
const REVIEW_GRADUATE = 3;    // correct reviews needed to clear a missed word
const AVATARS = ['🐝', '🦊', '🐼', '🦄', '🐸', '🦁', '🐙', '🐢', '🦋', '🐶', '🐱', '🚀'];

const DEFAULT_SETTINGS = {
  font: 'lexend', size: 'l', spacing: 'wide', tint: 'cream', rate: '0.8',
  autoRead: true, ruler: true, breaks: true, calm: false, quick: false,
};

/* ===== PERSISTENCE ===== */
function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* storage blocked — run without saving */ }
  return { profiles: {}, activeId: null };
}
function saveStore() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
}

const store = loadStore();

function activeProfile() { return store.profiles[store.activeId] || null; }

function newProfile(name, avatar) {
  const id = 'p' + Date.now().toString(36);
  store.profiles[id] = {
    id, name, avatar,
    settings: { ...DEFAULT_SETTINGS },
    levels: {},          // levelId -> { best, attempts, mastered }
    unlocked: 1,         // highest unlocked level
    review: {},          // word -> { level, box }
    stars: 0,
    minutes: 0,
    days: [],            // ISO dates practiced
    log: [],             // recent lesson results
  };
  store.activeId = id;
  saveStore();
  return store.profiles[id];
}

/* ===== UTILITIES ===== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const cleanWord = w => w.replace(/[^A-Za-z']/g, '');

function showToast(msg, type = '') {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ` toast-${type}` : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 2000);
}

function launchConfetti() {
  if (activeProfile()?.settings.calm) return;
  const container = $('#confettiContainer');
  const colors = ['#FFD60A', '#FF9500', '#00C897', '#4B7BEC', '#8854D0', '#E84393'];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = `${Math.random() * 100}%`;
    p.style.width = p.style.height = `${6 + Math.random() * 9}px`;
    p.style.background = pick(colors);
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
    p.style.animationDuration = `${1.8 + Math.random() * 2}s`;
    p.style.animationDelay = `${Math.random() * 0.6}s`;
    container.appendChild(p);
  }
  setTimeout(() => { container.innerHTML = ''; }, 4500);
}

/* ===================================================================
   SPEECH (Web Speech API)
   =================================================================== */
const synth = window.speechSynthesis;
let voice = null;
function chooseVoice() {
  if (!synth) return;
  const voices = synth.getVoices().filter(v => v.lang && v.lang.startsWith('en'));
  voice = voices.find(v => /Samantha|Google US English|Aria|Jenny|Natural/i.test(v.name))
       || voices.find(v => v.lang === 'en-US') || voices[0] || null;
}
if (synth) { chooseVoice(); synth.onvoiceschanged = chooseVoice; }

let speechToken = 0;
function speak(text, opts = {}) {
  return new Promise(resolve => {
    if (!synth || !text) { setTimeout(resolve, 300); return; }
    if (!opts.queue) { synth.cancel(); speechToken++; }
    const token = speechToken;
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = opts.rate ?? parseFloat(activeProfile()?.settings.rate || '0.8');
    u.pitch = 1.05;
    // Safety net: some browsers never fire onend
    const fallback = setTimeout(done, 1200 + text.length * 120);
    function done() { clearTimeout(fallback); resolve(token === speechToken); }
    u.onend = done;
    u.onerror = done;
    synth.speak(u);
  });
}
function stopSpeech() { if (synth) synth.cancel(); speechToken++; }

/* Read instructions aloud when the reader has that helper turned on */
function instruct(text) {
  if (activeProfile()?.settings.autoRead) speak(text);
}

/* ===================================================================
   SETTINGS — applied as classes on <body>
   =================================================================== */
function applySettings() {
  const s = activeProfile()?.settings || DEFAULT_SETTINGS;
  const b = document.body;
  b.classList.remove(...[...b.classList].filter(c => c.startsWith('rb-')));
  b.classList.add(`rb-font-${s.font}`, `rb-size-${s.size}`, `rb-space-${s.spacing}`, `rb-tint-${s.tint}`);
  if (s.calm) b.classList.add('rb-calm');
  if (s.ruler) b.classList.add('rb-ruler');
}

function openSettings() {
  const p = activeProfile();
  const s = p ? p.settings : { ...DEFAULT_SETTINGS };
  const form = $('#settingsForm');
  for (const [k, v] of Object.entries(s)) {
    const el = form.elements[k];
    if (!el) continue;
    if (el instanceof RadioNodeList) el.value = v;
    else if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v;
  }
  $('#settingsDialog').showModal();
}

function readSettingsForm() {
  const form = $('#settingsForm');
  const p = activeProfile();
  if (!p) return;
  for (const k of Object.keys(DEFAULT_SETTINGS)) {
    const el = form.elements[k];
    if (!el) continue;
    p.settings[k] = (el.type === 'checkbox') ? el.checked : el.value;
  }
  saveStore();
  applySettings();
}

$('#settingsForm').addEventListener('change', readSettingsForm);
$('#settingsDialog').addEventListener('close', readSettingsForm);
$('#setPreview').addEventListener('click', () => speak($('#setPreview').textContent));
$('#navSettings').addEventListener('click', () => {
  if (!activeProfile()) { showToast('Pick a reader first 👋'); return; }
  openSettings();
});

/* ===================================================================
   NAVIGATION
   =================================================================== */
function showScreen(id) {
  stopSpeech();
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#' + id).classList.add('active');
  $('#navMap').classList.toggle('active', id === 'mapScreen');
  $('#navParent').classList.toggle('active', id === 'parentScreen');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$('#navMap').addEventListener('click', () => activeProfile() ? renderMap() : renderProfiles());
$('#navParent').addEventListener('click', renderParent);
$('#switchReader').addEventListener('click', renderProfiles);
$('#backFromParent').addEventListener('click', () => activeProfile() ? renderMap() : renderProfiles());
$('#quitLesson').addEventListener('click', () => {
  if (confirm('Stop this lesson? Your progress in this lesson will not be saved.')) renderMap();
});

/* ===================================================================
   PROFILES
   =================================================================== */
function renderProfiles() {
  const grid = $('#profileGrid');
  const profiles = Object.values(store.profiles);
  grid.innerHTML = profiles.map(p => `
    <button class="profile-card" data-id="${p.id}">
      <span class="pf-avatar">${p.avatar}</span>
      <span class="pf-name">${esc(p.name)}</span>
      <span class="pf-level">Level ${p.unlocked} · ⭐ ${p.stars}</span>
    </button>
  `).join('') + `
    <button class="profile-card add-card" id="addProfile">
      <span class="pf-avatar">➕</span><span class="pf-name">Add a reader</span>
    </button>`;

  $$('.profile-card[data-id]').forEach(btn => btn.addEventListener('click', () => {
    store.activeId = btn.dataset.id;
    saveStore();
    applySettings();
    renderMap();
  }));
  $('#addProfile').addEventListener('click', () => {
    $('#newProfileForm').classList.remove('hidden');
    $('#newName').focus();
  });
  showScreen('profileScreen');
}

(function setupNewProfileForm() {
  let chosen = AVATARS[0];
  const pickWrap = $('#avatarPick');
  pickWrap.innerHTML = AVATARS.map((a, i) =>
    `<button type="button" class="avatar-btn${i === 0 ? ' chosen' : ''}" data-a="${a}" aria-label="Buddy ${a}">${a}</button>`
  ).join('');
  pickWrap.addEventListener('click', e => {
    const btn = e.target.closest('.avatar-btn');
    if (!btn) return;
    chosen = btn.dataset.a;
    $$('.avatar-btn', pickWrap).forEach(b => b.classList.toggle('chosen', b === btn));
  });
  $('#newProfileForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#newName').value.trim();
    if (!name) return;
    newProfile(name, chosen);
    $('#newProfileForm').reset();
    $('#newProfileForm').classList.add('hidden');
    applySettings();
    renderMap();
    speak(`Hi ${name}! Let's start reading.`);
  });
  $('#cancelNewProfile').addEventListener('click', () => $('#newProfileForm').classList.add('hidden'));
})();

/* ===================================================================
   LEVEL MAP
   =================================================================== */
function renderMap() {
  const p = activeProfile();
  if (!p) { renderProfiles(); return; }
  $('#mapTitle').textContent = `${p.avatar} ${p.name}'s Reading Path`;
  $('#mapStars').textContent = p.stars;

  const reviewCount = Object.keys(p.review).length;
  const streak = streakDays(p);
  const next = READING_LEVELS.find(l => l.id === p.unlocked) || READING_LEVELS[READING_LEVELS.length - 1];
  $('#todayCard').innerHTML = `
    <div class="today-main">
      <div class="today-icon">${next.icon}</div>
      <div>
        <div class="today-label">Today's lesson</div>
        <div class="today-title">Level ${next.id}: ${next.title}</div>
        <div class="today-focus">${esc(next.focus)}</div>
      </div>
    </div>
    <div class="today-meta">
      <span>🔥 ${streak} day streak</span>
      <span>🔁 ${reviewCount} review word${reviewCount === 1 ? '' : 's'}</span>
      <span>⏱ ${p.settings.quick ? '~5' : '~12'} min</span>
    </div>
    <button class="btn-primary big-go" id="startToday">▶ Start lesson</button>
  `;
  $('#startToday').addEventListener('click', () => startLesson(next.id));

  $('#levelPath').innerHTML = READING_LEVELS.map(l => {
    const rec = p.levels[l.id];
    const locked = l.id > p.unlocked;
    const status = rec?.mastered ? 'mastered' : locked ? 'locked' : 'open';
    const badge = rec?.mastered ? '🏅 Mastered' : locked ? '🔒 Locked' : rec ? `Best ${Math.round(rec.best * 100)}%` : 'New!';
    return `
      <li>
        <button class="level-node ${status}" data-level="${l.id}" ${locked ? 'disabled' : ''}
          aria-label="Level ${l.id} ${l.title}, ${badge}">
          <span class="ln-icon">${locked ? '🔒' : l.icon}</span>
          <span class="ln-body">
            <span class="ln-title">Level ${l.id} · ${l.title}</span>
            <span class="ln-focus">${esc(l.focus)}</span>
          </span>
          <span class="ln-badge">${badge}</span>
        </button>
      </li>`;
  }).join('');
  $$('.level-node:not([disabled])').forEach(btn =>
    btn.addEventListener('click', () => startLesson(+btn.dataset.level)));

  showScreen('mapScreen');
}

function streakDays(p) {
  const days = new Set(p.days);
  let n = 0;
  const d = new Date();
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ===================================================================
   LESSON ENGINE
   A lesson is a list of steps. Each step renders into #activity and
   calls lesson.next() when finished. Scored items record first-try
   accuracy so mastery reflects real independence.
   =================================================================== */
let lesson = null;

const STEP_INFO = {
  sounds:    { icon: '🔤', name: 'Sound Cards' },
  blend:     { icon: '🧩', name: 'Blend & Read' },
  spell:     { icon: '✋', name: 'Build the Word' },
  heart:     { icon: '💛', name: 'Heart Words' },
  sentences: { icon: '📝', name: 'Read Sentences' },
  story:     { icon: '📖', name: 'Story Time' },
  break:     { icon: '🤸', name: 'Brain Break' },
};

function startLesson(levelId) {
  const p = activeProfile();
  const level = READING_LEVELS.find(l => l.id === levelId);
  const quick = p.settings.quick;

  let steps = quick
    ? ['sounds', 'blend', 'heart', 'story']
    : ['sounds', 'blend', 'spell', 'heart', 'sentences', 'story'];
  if (p.settings.breaks) steps.splice(quick ? 2 : 3, 0, 'break');

  lesson = {
    level, steps, stepIndex: 0, quick,
    correct: 0, total: 0, stars: 0,
    missed: new Set(), reviewed: [],
    started: Date.now(),
    next() { this.stepIndex++; runStep(); },
  };
  $('#lessonTitle').textContent = `${level.icon} Level ${level.id}: ${level.title}`;
  $('#lessonStars').textContent = '0';
  showScreen('lessonScreen');
  runStep();
}

function runStep() {
  stopSpeech();
  const L = lesson;
  $('#stepDots').innerHTML = L.steps.map((s, i) =>
    `<span class="dot ${i < L.stepIndex ? 'done' : i === L.stepIndex ? 'now' : ''}" title="${STEP_INFO[s].name}">${STEP_INFO[s].icon}</span>`
  ).join('');
  if (L.stepIndex >= L.steps.length) { finishLesson(); return; }
  const step = L.steps[L.stepIndex];
  ({ sounds: stepSounds, blend: stepBlend, spell: stepSpell, heart: stepHeart,
     sentences: stepSentences, story: stepStory, break: stepBreak })[step]();
  $('#activity').focus?.();
}

function score(isCorrect, word) {
  lesson.total++;
  if (isCorrect) {
    lesson.correct++;
    lesson.stars++;
    $('#lessonStars').textContent = lesson.stars;
  } else if (word) {
    lesson.missed.add(word);
  }
}

function activityShell(stepKey, instruction, body) {
  const info = STEP_INFO[stepKey];
  $('#activity').innerHTML = `
    <div class="act-card">
      <div class="act-head">
        <span class="act-icon">${info.icon}</span>
        <h3>${info.name}</h3>
        <button class="say-btn" id="sayInstr" aria-label="Read instructions aloud">🔊</button>
      </div>
      <p class="act-instr">${esc(instruction)}</p>
      <div class="act-body">${body}</div>
    </div>`;
  $('#sayInstr').addEventListener('click', () => speak(instruction));
  instruct(instruction);
}

/* Look up a word's data across all levels (for review words) */
function findWord(word) {
  for (const l of READING_LEVELS) {
    const w = l.words.find(x => x[0] === word);
    if (w) return { level: l.id, word: w[0], emoji: w[1], parts: w[2].split('|') };
  }
  return null;
}
const toWordObj = (w, level) => ({ level, word: w[0], emoji: w[1], parts: w[2].split('|') });

/* Render graphemes as sound boxes; "a_e" shows the vowel plus a magic e */
function soundBoxes(parts) {
  const boxes = [];
  let magic = false;
  for (const g of parts) {
    if (g.includes('_')) {
      boxes.push(`<span class="sbox vowel">${g[0]}</span>`);
      magic = true;
    } else {
      boxes.push(`<span class="sbox ${/^[aeiou]/.test(g) ? 'vowel' : ''}">${g}</span>`);
    }
  }
  if (magic) boxes.push('<span class="sbox magic-e" title="Magic e is silent">e<small>✨</small></span>');
  return boxes.join('');
}

/* Tiles a child taps to spell a word (magic-e words get a trailing e) */
function spellTiles(parts) {
  const tiles = parts.map(g => g.includes('_') ? g[0] : g);
  if (parts.some(g => g.includes('_'))) tiles.push('e');
  return tiles;
}

/* ---------- STEP: Sound Cards (adult or self check) ---------- */
function stepSounds() {
  const L = lesson;
  const prior = READING_LEVELS.filter(l => l.id < L.level.id).flatMap(l => l.sounds);
  const review = shuffle([...prior]).slice(0, L.quick ? 1 : 3);
  const cards = [...L.level.sounds.slice(0, L.quick ? 4 : 99), ...review];
  let i = 0;

  activityShell('sounds',
    'Look at the card. Say the sound out loud. Tap the picture to hear the key word. Then tap a button.',
    '<div id="soundCardArea"></div>');

  function show() {
    if (i >= cards.length) { L.next(); return; }
    const c = cards[i];
    $('#soundCardArea').innerHTML = `
      <div class="counter">${i + 1} / ${cards.length}</div>
      <button class="sound-card" id="soundCard" aria-label="Hear ${c.key}">
        <span class="sc-g">${c.g.replace('_', '<span class="blank">_</span>')}</span>
        <span class="sc-key">${c.emoji} ${c.key}</span>
      </button>
      <div class="row-btns">
        <button class="btn-primary" id="gotIt">✅ I said it!</button>
        <button class="btn-secondary" id="helpMe">🙋 Help me</button>
      </div>`;
    // Speak the key word: it starts with the target sound (computer voices can't say sounds alone well)
    const hear = () => speak(c.key);
    let helped = false;
    $('#soundCard').addEventListener('click', hear);
    $('#gotIt').addEventListener('click', () => {
      if (!helped) score(true);
      i++; show();
    });
    $('#helpMe').addEventListener('click', () => {
      if (!helped) score(false);
      helped = true;
      hear().then(ok => { if (ok) speak('Now you say it.', { queue: true }); });
      $('#gotIt').textContent = '✅ Now I said it!';
    });
  }
  show();
}

/* ---------- STEP: Blend & Read (picture check) ---------- */
function stepBlend() {
  const L = lesson;
  const p = activeProfile();
  // Spaced review: missed words from earlier lessons come back first
  const reviewWords = Object.keys(p.review)
    .map(findWord).filter(w => w && w.level <= L.level.id)
    .slice(0, L.quick ? 1 : 3);
  const fresh = shuffle(L.level.words.map(w => toWordObj(w, L.level.id)))
    .filter(w => !reviewWords.some(r => r.word === w.word))
    .slice(0, L.quick ? 4 : 6);
  const items = [...reviewWords.map(w => ({ ...w, isReview: true })), ...fresh];
  const pool = READING_LEVELS.filter(l => l.id <= L.level.id).flatMap(l => l.words.map(w => toWordObj(w, l.id)));
  let i = 0;

  activityShell('blend',
    'Touch each sound box and say its sound. Then slide them together and read the word. Pick the matching picture!',
    '<div id="blendArea"></div>');

  function show() {
    if (i >= items.length) { L.next(); return; }
    const w = items[i];
    const options = shuffle([w, ...shuffle(pool.filter(x => x.emoji !== w.emoji && x.word !== w.word)).slice(0, 2)]);
    let firstTry = true;

    $('#blendArea').innerHTML = `
      <div class="counter">${i + 1} / ${items.length}${w.isReview ? ' · 🔁 review word' : ''}</div>
      <div class="sound-boxes" id="boxes">${soundBoxes(w.parts)}</div>
      <div class="row-btns">
        <button class="btn-secondary" id="slideBtn">👉 Slide it together</button>
      </div>
      <div class="pic-choices">${options.map(o =>
        `<button class="pic-btn" data-word="${o.word}" aria-label="picture option">${o.emoji}</button>`).join('')}</div>
      <div class="feedback-box" id="blendFb"></div>`;

    $$('#boxes .sbox').forEach(b => b.addEventListener('click', () => {
      b.classList.add('tapped');
      setTimeout(() => b.classList.remove('tapped'), 500);
    }));

    $('#slideBtn').addEventListener('click', async () => {
      const boxes = $$('#boxes .sbox');
      for (const b of boxes) {
        b.classList.add('lit');
        await new Promise(r => setTimeout(r, 380));
      }
      $('#boxes').classList.add('blended');
      setTimeout(() => { $('#boxes')?.classList.remove('blended'); boxes.forEach(b => b.classList.remove('lit')); }, 1200);
    });

    $$('.pic-btn').forEach(btn => btn.addEventListener('click', () => {
      if (btn.dataset.word === w.word) {
        score(firstTry, w.word);
        if (w.isReview) lesson.reviewed.push({ word: w.word, ok: firstTry });
        btn.classList.add('correct');
        $$('.pic-btn').forEach(b => b.disabled = true);
        $('#blendFb').innerHTML = `<span class="feedback-text correct">🎉 ${esc(w.word)}! ${pick(PRAISE)}</span>
          <button class="next-btn" id="nextBlend">Next →</button>`;
        speak(w.word);
        $('#nextBlend').addEventListener('click', () => { i++; show(); });
        $('#nextBlend').focus();
      } else {
        if (firstTry) { firstTry = false; }
        btn.classList.add('incorrect');
        btn.disabled = true;
        $('#blendFb').innerHTML = `<span class="feedback-text wrong">${pick(GENTLE_RETRY)}</span>`;
        // Model the blend, then let the child try again (errorless learning)
        $('#slideBtn').click();
        setTimeout(() => speak(w.word), 600);
      }
    }));
  }
  show();
}

/* ---------- STEP: Build the Word (encoding / spelling) ---------- */
function stepSpell() {
  const L = lesson;
  const items = shuffle(L.level.words.map(w => toWordObj(w, L.level.id))).slice(0, 4);
  const allTiles = [...new Set(L.level.words.flatMap(w => spellTiles(w[2].split('|'))))];
  let i = 0;

  activityShell('spell',
    'Listen to the word. Say each sound slowly. Tap the letters in order to build the word.',
    '<div id="spellArea"></div>');

  function show() {
    if (i >= items.length) { L.next(); return; }
    const w = items[i];
    const target = spellTiles(w.parts);
    const extras = shuffle(allTiles.filter(t => !target.includes(t))).slice(0, 3);
    const bank = shuffle([...target, ...extras]);
    let built = [];
    let firstTry = true;

    $('#spellArea').innerHTML = `
      <div class="counter">${i + 1} / ${items.length}</div>
      <button class="hear-word" id="hearWord" aria-label="Hear the word">
        <span class="hw-emoji">${w.emoji}</span><span>🔊 Hear it</span>
      </button>
      <div class="spell-slots" id="slots">${target.map(() => '<span class="slot"></span>').join('')}</div>
      <div class="tile-bank" id="bank">${bank.map((t, k) =>
        `<button class="tile" data-k="${k}" data-t="${t}">${t}</button>`).join('')}</div>
      <div class="row-btns">
        <button class="btn-outline" id="undoTile">↩ Undo</button>
        <button class="btn-primary" id="checkSpell">✔ Check</button>
      </div>
      <div class="feedback-box" id="spellFb"></div>`;

    $('#hearWord').addEventListener('click', () => speak(w.word));
    speak(w.word, { queue: true });

    function paint() {
      $$('#slots .slot').forEach((s, k) => {
        s.textContent = built[k]?.t || '';
        s.classList.toggle('filled', !!built[k]);
      });
    }
    $$('#bank .tile').forEach(tile => tile.addEventListener('click', () => {
      if (built.length >= target.length) return;
      built.push({ t: tile.dataset.t, el: tile });
      tile.disabled = true;
      paint();
    }));
    $('#undoTile').addEventListener('click', () => {
      const last = built.pop();
      if (last) last.el.disabled = false;
      paint();
    });
    $('#checkSpell').addEventListener('click', () => {
      const attempt = built.map(b => b.t).join('');
      if (attempt === target.join('')) {
        score(firstTry, w.word);
        $('#slots').classList.add('solved');
        $('#spellFb').innerHTML = `<span class="feedback-text correct">🎉 You built "${esc(w.word)}"! ${pick(PRAISE)}</span>
          <button class="next-btn" id="nextSpell">Next →</button>`;
        speak(w.word);
        $('#checkSpell').disabled = true;
        $('#nextSpell').addEventListener('click', () => { i++; show(); });
        $('#nextSpell').focus();
      } else {
        firstTry = false;
        // Keep the correct start of the word, return the rest — shows exactly what to fix
        let keep = 0;
        while (keep < built.length && built[keep].t === target[keep]) keep++;
        built.slice(keep).forEach(b => { b.el.disabled = false; });
        built = built.slice(0, keep);
        paint();
        $('#spellFb').innerHTML = `<span class="feedback-text wrong">${pick(GENTLE_RETRY)} The first ${built.length} letter${built.length === 1 ? ' is' : 's are'} right.</span>`;
        speak(w.word, { rate: 0.5 });
      }
    });
  }
  show();
}

/* ---------- STEP: Heart Words (irregular high-frequency words) ---------- */
function stepHeart() {
  const L = lesson;
  const words = L.level.heartWords.slice(0, L.quick ? 2 : 4);
  const allHeart = READING_LEVELS.filter(l => l.id <= L.level.id + 1).flatMap(l => l.heartWords);
  let i = 0;

  activityShell('heart',
    'Heart words have a tricky part we learn by heart. Look, listen, and say the word. Then find it!',
    '<div id="heartArea"></div>');

  function show() {
    if (i >= words.length) { L.next(); return; }
    const word = words[i];
    let firstTry = true;
    $('#heartArea').innerHTML = `
      <div class="counter">${i + 1} / ${words.length}</div>
      <div class="heart-card" id="heartCard">💛 <span>${esc(word)}</span></div>
      <div class="row-btns"><button class="btn-secondary" id="heartGo">👀 I studied it — hide it!</button></div>
      <div id="heartFind"></div>
      <div class="feedback-box" id="heartFb"></div>`;
    speak(`${word}. ${word.split('').join(', ')}. ${word}.`, { queue: true });
    $('#heartCard').addEventListener('click', () => speak(word));

    $('#heartGo').addEventListener('click', () => {
      $('#heartCard').classList.add('hidden-word');
      $('#heartGo').remove();
      const opts = shuffle([word, ...shuffle(allHeart.filter(w => w !== word)).slice(0, 3)]);
      $('#heartFind').innerHTML = `
        <p class="find-q">Which one is <button class="inline-say" id="sayHeart">🔊 "${esc(word)}"</button>?</p>
        <div class="word-choices">${opts.map(o => `<button class="word-chip" data-w="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
      $('#sayHeart').addEventListener('click', () => speak(word));
      speak(`Find the word: ${word}`);
      $$('#heartFind .word-chip').forEach(btn => btn.addEventListener('click', () => {
        if (btn.dataset.w === word) {
          score(firstTry, word);
          btn.classList.add('correct');
          $$('#heartFind .word-chip').forEach(b => b.disabled = true);
          $('#heartCard').classList.remove('hidden-word');
          $('#heartFb').innerHTML = `<span class="feedback-text correct">💛 Yes! "${esc(word)}"</span>
            <button class="next-btn" id="nextHeart">Next →</button>`;
          $('#nextHeart').addEventListener('click', () => { i++; show(); });
          $('#nextHeart').focus();
        } else {
          firstTry = false;
          btn.classList.add('incorrect');
          btn.disabled = true;
          $('#heartCard').classList.remove('hidden-word');
          $('#heartFb').innerHTML = `<span class="feedback-text wrong">${pick(GENTLE_RETRY)} Look at the card again.</span>`;
          speak(word);
        }
      }));
    });
  }
  show();
}

/* ---------- Reading text helpers: tap-to-hear words + echo reading ---------- */
function wordSpans(text) {
  return text.split(/\s+/).map(w => `<button class="rw" data-w="${esc(cleanWord(w))}">${esc(w)}</button>`).join(' ');
}
function wireTapWords(root) {
  $$('.rw', root).forEach(b => b.addEventListener('click', () => speak(b.dataset.w)));
}
/* Highlight each word as it is spoken — like a finger under the words */
async function echoRead(lineEl) {
  const L = lesson;
  const words = $$('.rw', lineEl);
  for (const w of words) {
    if (lesson !== L || !document.body.contains(w)) return;
    w.classList.add('reading');
    const ok = await speak(w.dataset.w, { queue: true });
    w.classList.remove('reading');
    if (!ok) return;
  }
}

/* ---------- STEP: Read Sentences (echo, then solo) ---------- */
function stepSentences() {
  const L = lesson;
  const sentences = L.level.sentences;
  let i = 0;

  activityShell('sentences',
    'First, listen and follow the glowing words. Then read the sentence by yourself. Tap any word you need help with.',
    '<div id="sentArea"></div>');

  function show() {
    if (i >= sentences.length) { L.next(); return; }
    $('#sentArea').innerHTML = `
      <div class="counter">${i + 1} / ${sentences.length}</div>
      <div class="read-line tinted" id="sentLine">${wordSpans(sentences[i])}</div>
      <div class="row-btns">
        <button class="btn-secondary" id="echoBtn">🔊 Read it to me</button>
        <button class="btn-primary" id="soloBtn">🗣️ I read it myself!</button>
      </div>`;
    wireTapWords($('#sentLine'));
    $('#echoBtn').addEventListener('click', () => { stopSpeech(); echoRead($('#sentLine')); });
    $('#soloBtn').addEventListener('click', () => {
      showToast(pick(PRAISE), 'correct');
      i++; show();
    });
  }
  show();
}

/* ---------- STEP: Story Time (fluency + comprehension) ---------- */
function stepStory() {
  const L = lesson;
  const story = L.level.story;
  const lines = story.text.match(/[^.!?]+[.!?]+/g).map(s => s.trim());
  let line = 0;
  let firstTry = true;

  activityShell('story',
    'Read the story one line at a time. Tap any word to hear it. Use Read to me if you want to hear it first.',
    `<h4 class="story-title">${esc(story.title)}</h4>
     <div class="story tinted" id="story">${lines.map((s, k) =>
       `<p class="story-line" data-k="${k}">${wordSpans(s)}</p>`).join('')}</div>
     <div class="row-btns">
       <button class="btn-secondary" id="storyEcho">🔊 Read this line to me</button>
       <button class="btn-primary" id="storyNext">Next line ↓</button>
     </div>
     <div id="storyQ"></div>`);

  wireTapWords($('#story'));
  const lineEls = $$('.story-line');
  function focusLine() {
    lineEls.forEach((el, k) => {
      el.classList.toggle('current', k === line);
      el.classList.toggle('done', k < line);
    });
    $('#storyNext').textContent = line < lines.length - 1 ? 'Next line ↓' : '✔ I finished the story!';
  }
  focusLine();

  $('#storyEcho').addEventListener('click', () => { stopSpeech(); echoRead(lineEls[line]); });
  $('#storyNext').addEventListener('click', () => {
    stopSpeech();
    if (line < lines.length - 1) { line++; focusLine(); return; }
    lineEls.forEach(el => el.classList.remove('current', 'done'));
    $('#storyEcho').parentElement.remove();
    askQuestion();
  });

  function askQuestion() {
    $('#storyQ').innerHTML = `
      <div class="story-q">
        <p class="find-q">${esc(story.question)} <button class="inline-say" id="sayQ" aria-label="Read question">🔊</button></p>
        <div class="context-choices">${story.choices.map((c, k) =>
          `<button class="choice-btn" data-k="${k}"><span class="choice-letter">${'ABC'[k]}</span><span>${esc(c)}</span></button>`).join('')}</div>
        <div class="feedback-box" id="storyFb"></div>
      </div>`;
    const sayQ = () => speak(`${story.question} ${story.choices.map((c, k) => `${'ABC'[k]}: ${c}.`).join(' ')}`);
    $('#sayQ').addEventListener('click', sayQ);
    instruct(story.question);
    $$('#storyQ .choice-btn').forEach(btn => btn.addEventListener('click', () => {
      if (+btn.dataset.k === story.answer) {
        score(firstTry);
        btn.classList.add('correct');
        $$('#storyQ .choice-btn').forEach(b => b.disabled = true);
        $('#storyFb').innerHTML = `<span class="feedback-text correct">🎉 You understood the story!</span>
          <button class="next-btn" id="storyDone">🏆 Finish lesson</button>`;
        $('#storyDone').addEventListener('click', () => L.next());
        $('#storyDone').focus();
      } else {
        firstTry = false;
        btn.classList.add('incorrect');
        btn.disabled = true;
        $('#storyFb').innerHTML = `<span class="feedback-text wrong">Look back at the story to find the answer. 🔎</span>`;
      }
    }));
  }
}

/* ---------- STEP: Brain Break ---------- */
function stepBreak() {
  const L = lesson;
  const b = pick(BRAIN_BREAKS);
  activityShell('break', `Brain break! ${b.text}`, `
    <div class="break-card">
      <div class="break-emoji">${b.emoji}</div>
      <div class="break-text">${esc(b.text)}</div>
      <div class="break-timer" id="breakTimer">30</div>
      <button class="btn-primary" id="breakDone">I'm ready! →</button>
    </div>`);
  let t = 30;
  const iv = setInterval(() => {
    if (lesson !== L || !$('#breakTimer')) { clearInterval(iv); return; }
    t--;
    $('#breakTimer').textContent = t;
    if (t <= 0) { clearInterval(iv); $('#breakTimer').textContent = '✅'; }
  }, 1000);
  $('#breakDone').addEventListener('click', () => { clearInterval(iv); L.next(); });
}

/* ---------- Finish & save ---------- */
function finishLesson() {
  const L = lesson;
  const p = activeProfile();
  const acc = L.total ? L.correct / L.total : 1;
  const mins = Math.max(1, Math.round((Date.now() - L.started) / 60000));
  const rec = p.levels[L.level.id] || { best: 0, attempts: 0, mastered: false };
  rec.attempts++;
  rec.best = Math.max(rec.best, acc);
  const justMastered = !rec.mastered && acc >= MASTERY;
  if (acc >= MASTERY) rec.mastered = true;
  p.levels[L.level.id] = rec;
  if (rec.mastered && L.level.id === p.unlocked && p.unlocked < READING_LEVELS.length) p.unlocked++;

  // Spaced review: missed words enter the deck; reviewed words move up or reset
  for (const r of L.reviewed) {
    const card = p.review[r.word];
    if (!card) continue;
    if (r.ok) { card.box++; if (card.box >= REVIEW_GRADUATE) delete p.review[r.word]; }
    else card.box = 0;
  }
  for (const w of L.missed) {
    if (findWord(w)) p.review[w] = { level: L.level.id, box: 0 };
  }

  p.stars += L.stars + (justMastered ? 5 : 0);
  p.minutes += mins;
  if (!p.days.includes(today())) p.days.push(today());
  p.log.unshift({ date: today(), level: L.level.id, acc: Math.round(acc * 100), mins });
  p.log = p.log.slice(0, 30);
  saveStore();

  const pct = Math.round(acc * 100);
  let title, msg;
  if (justMastered) {
    title = '🏅 Level Mastered!';
    msg = `${pct}% on your own — you unlocked the next level and earned 5 bonus stars!`;
    launchConfetti();
  } else if (acc >= MASTERY) {
    title = '🌟 Super Reading!';
    msg = `${pct}% on your own. You are a strong reader at this level!`;
    launchConfetti();
  } else {
    title = '💪 Great Practice!';
    msg = `You got ${pct}% on your own. Practice this level again tomorrow — brains grow with practice!`;
  }
  const missed = [...L.missed];

  $('#stepDots').innerHTML = '';
  $('#activity').innerHTML = `
    <div class="act-card done-card">
      <div class="done-avatar">${p.avatar}</div>
      <h3 class="result-title">${title}</h3>
      <p class="result-msg">${msg}</p>
      <div class="result-stars">${'⭐'.repeat(Math.min(L.stars, 12))}</div>
      ${missed.length ? `<p class="practice-note">🔁 We'll practice these again next time: <b>${missed.map(esc).join(', ')}</b></p>` : ''}
      <div class="row-btns">
        <button class="btn-primary" id="toMap">🗺️ My Path</button>
        <button class="btn-secondary" id="again">🔄 Practice again</button>
      </div>
    </div>`;
  speak(`${title.replace(/[^\w\s!]/g, '')} ${msg}`);
  $('#toMap').addEventListener('click', renderMap);
  $('#again').addEventListener('click', () => startLesson(L.level.id));
}

/* ===================================================================
   GROWN-UPS DASHBOARD
   =================================================================== */
function renderParent() {
  const profiles = Object.values(store.profiles);
  const cards = profiles.map(p => {
    const mastered = Object.values(p.levels).filter(l => l.mastered).length;
    const review = Object.keys(p.review);
    const rows = READING_LEVELS.map(l => {
      const r = p.levels[l.id];
      const pct = r ? Math.round(r.best * 100) : 0;
      return `<div class="lvl-row">
        <span class="lvl-name">${l.icon} ${l.id}. ${l.title}</span>
        <span class="lvl-bar"><span style="width:${pct}%" class="${r?.mastered ? 'm' : ''}"></span></span>
        <span class="lvl-pct">${r ? pct + '%' : (l.id <= p.unlocked ? '—' : '🔒')}</span>
      </div>`;
    }).join('');
    const recent = p.log.slice(0, 5).map(e =>
      `<li>${e.date} · Level ${e.level} · ${e.acc}% · ${e.mins} min</li>`).join('') || '<li>No lessons yet.</li>';
    return `
      <section class="parent-card">
        <header><span class="pf-avatar">${p.avatar}</span><h3>${esc(p.name)}</h3></header>
        <div class="kpis">
          <div><b>${mastered}</b><span>levels mastered</span></div>
          <div><b>${p.minutes}</b><span>minutes read</span></div>
          <div><b>${streakDays(p)}</b><span>day streak</span></div>
          <div><b>${p.days.length}</b><span>days practiced</span></div>
        </div>
        <h4>Level progress <small>(best first-try accuracy · ${Math.round(MASTERY * 100)}% = mastered)</small></h4>
        ${rows}
        <h4>Words to review</h4>
        <p>${review.length ? review.map(esc).join(', ') : 'None — great job! 🎉'}</p>
        <h4>Recent lessons</h4>
        <ul class="recent">${recent}</ul>
        <div class="row-btns">
          <label class="place-label">Starting level
            <select data-place="${p.id}">${READING_LEVELS.map(l =>
              `<option value="${l.id}" ${l.id === p.unlocked ? 'selected' : ''}>Level ${l.id}: ${l.title}</option>`).join('')}
            </select>
          </label>
          <button class="btn-outline" data-del="${p.id}">🗑 Remove reader</button>
        </div>
      </section>`;
  }).join('') || '<p class="section-sub">No readers yet — add one on the home screen.</p>';

  $('#parentBody').innerHTML = `
    ${cards}
    <section class="parent-card tips">
      <h3>💡 How to get the fastest results</h3>
      <ul>
        <li><b>Little and often beats long and rare.</b> 10–15 minutes a day, 5 days a week, works far better than one long session. Short lessons mode is great for tired days.</li>
        <li><b>Sit with your child for Sound Cards.</b> Model the pure sound ("mmm", not "muh"). Computer voices can't say sounds alone perfectly — your voice is the best teacher.</li>
        <li><b>Have them read out loud every time.</b> Saying, seeing and hearing at once (multisensory learning) builds stronger memory pathways.</li>
        <li><b>Don't rush mastery.</b> A level unlocks at ${Math.round(MASTERY * 100)}% first-try accuracy. Repeating a level is normal and builds automaticity.</li>
        <li><b>Praise effort, not speed.</b> Say "You kept trying on that hard word!" instead of "You're so smart."</li>
        <li><b>Placement:</b> If your child already knows early sounds, use "Starting level" above to begin where they need practice. If accuracy is below 60%, move back one level.</li>
      </ul>
      <h3>🧠 Helpers for different learners</h3>
      <ul>
        <li><b>Dyslexia:</b> Try Easy-read or Extra-clear letters, Wide spacing and a color tint. The reading ruler shows one line at a time to reduce visual crowding.</li>
        <li><b>ADHD:</b> Keep Brain breaks on and use Short lessons. Let them stand, wiggle or hold a fidget while reading.</li>
        <li><b>Autism:</b> Calm mode removes animations and confetti. The lesson steps always come in the same predictable order, shown at the top.</li>
        <li><b>Low vision:</b> Use Extra large text and Extra-clear letters.</li>
        <li><b>Motor challenges:</b> Everything is big tap targets — no dragging and no time limits.</li>
        <li><b>Speech or language delays:</b> "Help me" and "Read it to me" give a model to copy. Turn on Read instructions out loud for pre-readers.</li>
      </ul>
      <p class="disclaimer">Reading Boost follows the principles of Structured Literacy (systematic, explicit, cumulative phonics). It is a practice tool and does not replace an evaluation or therapy from a reading specialist, speech-language pathologist or school IEP team.</p>
    </section>`;

  $$('[data-place]').forEach(sel => sel.addEventListener('change', () => {
    store.profiles[sel.dataset.place].unlocked = +sel.value;
    saveStore();
    showToast('Starting level updated ✔', 'correct');
  }));
  $$('[data-del]').forEach(btn => btn.addEventListener('click', () => {
    const p = store.profiles[btn.dataset.del];
    if (!confirm(`Remove ${p.name} and all their progress? This cannot be undone.`)) return;
    delete store.profiles[p.id];
    if (store.activeId === p.id) store.activeId = null;
    saveStore();
    renderParent();
  }));
  showScreen('parentScreen');
}

/* ===== INIT ===== */
applySettings();
if (activeProfile()) renderMap(); else renderProfiles();
