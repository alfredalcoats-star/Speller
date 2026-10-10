/* ===================================================================
   Reading Boost — App Logic
   Structured, multisensory phonics lessons with mastery-based
   progression, spaced review of missed words, and accessibility
   helpers (dyslexia-friendly fonts, tints, read-aloud, reading ruler).
   =================================================================== */

const STORE_KEY = 'readingBoost.v1';
const MASTERY = 0.8;          // 80% first-try accuracy unlocks the next level
const REVIEW_GRADUATE = 3;    // correct reviews needed to clear a missed word
const MAX_REAL_WPM = 250;     // timed reads faster than this are not saved
const AVATARS = ['🐝', '🦊', '🐼', '🦄', '🐸', '🦁', '🐙', '🐢', '🦋', '🐶', '🐱', '🚀'];

const DEFAULT_SETTINGS = {
  font: 'lexend', size: 'l', spacing: 'wide', tint: 'cream', rate: '0.8',
  autoRead: true, ruler: true, breaks: true, calm: false, quick: false, online: true,
};

/* ===== PERSISTENCE ===== */
function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Fill in fields added after a profile was first saved
      for (const p of Object.values(data.profiles)) {
        p.grade ??= '1';
        p.vocab ??= {};
        p.fluency ??= [];
        p.settings.online ??= true;
        p.listId ??= null;
        p.listProgress ??= {};
      }
      return data;
    }
  } catch (e) { /* storage blocked — run without saving */ }
  return { profiles: {}, activeId: null };
}
function saveStore() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
}

const store = loadStore();

function activeProfile() { return store.profiles[store.activeId] || null; }

/* The grown-up's word list assigned to this reader, if it still exists and has words */
function readerList(p = activeProfile()) {
  if (!p?.listId || typeof WordLists === 'undefined') return null;
  const list = WordLists.get(p.listId);
  return list && list.words.length ? list : null;
}
const listKey = word => word.toLowerCase();
function listMastered(p, list) {
  const prog = p.listProgress[list.id] || {};
  return list.words.filter(w => (prog[listKey(w.word)] ?? 0) >= 2).length;
}

/* ===== GRADE HELPERS ===== */
function gradeOf(p = activeProfile()) { return GRADES[p?.grade] ? String(p.grade) : '1'; }
function gradeCfg(p = activeProfile()) { return GRADES[gradeOf(p)]; }
function isOlder(p = activeProfile()) { return gradeCfg(p).band !== 'young'; }
const praise = () => pick(isOlder() ? PRAISE_OLDER : PRAISE);
const retry = () => pick(isOlder() ? GENTLE_RETRY_OLDER : GENTLE_RETRY);

function newProfile(name, avatar, grade) {
  const id = 'p' + Date.now().toString(36);
  const older = GRADES[grade].band !== 'young';
  store.profiles[id] = {
    id, name, avatar, grade,
    // Older readers start without read-aloud instructions and with a calmer look
    settings: { ...DEFAULT_SETTINGS, autoRead: !older, tint: older ? 'none' : DEFAULT_SETTINGS.tint },
    levels: {},          // levelId -> { best, attempts, mastered }
    unlocked: 1,         // highest unlocked level
    review: {},          // word -> { level, box }
    vocab: {},           // grade word -> box (times answered right in a row)
    fluency: [],         // timed passage reads: { date, level, wpm }
    placed: null,        // placement check result
    listId: null,        // grown-up's word list assigned to this reader
    listProgress: {},    // listId -> { word: times read + spelled right in a row }
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
  b.classList.add(`rb-font-${s.font}`, `rb-size-${s.size}`, `rb-space-${s.spacing}`, `rb-tint-${s.tint}`,
    `rb-band-${gradeCfg().band}`);
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
$('#quitLesson').addEventListener('click', async () => {
  if (await askConfirm('Stop this lesson? Progress in this lesson won\'t be saved.', { confirmLabel: 'Stop lesson', cancelLabel: 'Keep going' })) renderMap();
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
      <span class="pf-level">${GRADES[gradeOf(p)].label}</span>
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
    const p = newProfile(name, chosen, $('#newGrade').value);
    $('#newProfileForm').reset();
    $('#newProfileForm').classList.add('hidden');
    applySettings();
    renderStartChoice(p);
    speak(`Hi ${name}! Let's find the best place to start.`);
  });
  $('#cancelNewProfile').addEventListener('click', () => $('#newProfileForm').classList.add('hidden'));
})();

/* ===================================================================
   STARTING POINT & PLACEMENT CHECK
   Kids who struggle often have gaps in earlier skills, so instead of
   assuming grade level we offer a quick check that finds the first
   level where reading breaks down.
   =================================================================== */
function renderStartChoice(p) {
  const cfg = gradeCfg(p);
  const target = READING_LEVELS[cfg.start - 1];
  $('#placeBody').innerHTML = `
    <div class="act-card place-card">
      <div class="done-avatar">${p.avatar}</div>
      <h3 class="result-title">Where should ${esc(p.name)} start?</h3>
      <p class="result-msg">${cfg.label} readers usually work around <b>Level ${target.id}: ${target.title}</b>.
        Kids who find reading hard often have small gaps in earlier skills — the check finds them.</p>
      <div class="start-options">
        <button class="start-opt recommended" id="optCheck">
          <span>🧭</span><b>Find my level</b><small>About 2 minutes · recommended</small>
        </button>
        <button class="start-opt" id="optGrade">
          <span>🎯</span><b>Start at Level ${target.id}</b><small>Typical for ${cfg.label}</small>
        </button>
        <button class="start-opt" id="optBegin">
          <span>🌱</span><b>Start at Level 1</b><small>Build from the very beginning</small>
        </button>
      </div>
    </div>`;
  $('#optCheck').addEventListener('click', () => startPlacement(p));
  $('#optGrade').addEventListener('click', () => setStart(p, target.id, 'grade'));
  $('#optBegin').addEventListener('click', () => setStart(p, 1, 'beginning'));
  showScreen('placeScreen');
}

function setStart(p, levelId, how) {
  p.unlocked = Math.max(1, Math.min(levelId, READING_LEVELS.length));
  p.placed = { date: today(), level: p.unlocked, how };
  saveStore();
  renderMap();
}

function startPlacement(p) {
  // Two words per level, easiest first. Stop at the first level that isn't solid.
  const plan = READING_LEVELS.map(l => ({ level: l, words: shuffle(l.words.map(w => w[0])).slice(0, 2) }));
  let li = 0, wi = 0, right = 0;

  function show() {
    const { level, words } = plan[li];
    $('#placeBody').innerHTML = `
      <div class="act-card place-card">
        <div class="act-head"><span class="act-icon">🧭</span><h3>Find My Level</h3></div>
        <p class="act-instr"><b>Reader:</b> read the word out loud. <b>Grown-up:</b> tap ✅ only if it was read correctly, without help, in about 3 seconds.</p>
        <div class="counter">Checking Level ${level.id} of ${READING_LEVELS.length} · ${level.title}</div>
        <div class="place-word tinted">${esc(words[wi])}</div>
        <div class="row-btns">
          <button class="btn-primary" id="plYes">✅ Read it correctly</button>
          <button class="btn-secondary" id="plNo">❌ Not yet</button>
        </div>
        <div class="row-btns"><button class="btn-outline" id="plStop">Stop and start at Level ${level.id}</button></div>
      </div>`;
    $('#plYes').addEventListener('click', () => answer(true));
    $('#plNo').addEventListener('click', () => answer(false));
    $('#plStop').addEventListener('click', () => done(level.id));
  }
  function answer(ok) {
    if (ok) right++;
    wi++;
    if (wi < plan[li].words.length) { show(); return; }
    if (right < plan[li].words.length) { done(plan[li].level.id); return; }
    li++; wi = 0; right = 0;
    if (li >= plan.length) { done(READING_LEVELS.length); return; }
    show();
  }
  function done(levelId) {
    const l = READING_LEVELS[levelId - 1];
    p.unlocked = levelId;
    p.placed = { date: today(), level: levelId, how: 'check' };
    saveStore();
    $('#placeBody').innerHTML = `
      <div class="act-card place-card">
        <div class="done-avatar">${l.icon}</div>
        <h3 class="result-title">Start at Level ${l.id}: ${l.title}</h3>
        <p class="result-msg">${esc(l.focus)}. This is where practice will help ${esc(p.name)} the most.</p>
        <div class="row-btns"><button class="btn-primary" id="plGo">🗺️ Go to my path</button></div>
      </div>`;
    speak(`Great job! Let's start at level ${l.id}, ${l.title}.`);
    $('#plGo').addEventListener('click', renderMap);
  }
  showScreen('placeScreen');
  show();
}

/* ===================================================================
   LEVEL MAP
   =================================================================== */
function renderMap() {
  const p = activeProfile();
  if (!p) { renderProfiles(); return; }
  const cfg = gradeCfg(p);
  $('#mapTitle').textContent = `${p.avatar} ${p.name}'s Reading Path`;
  $('#mapStars').textContent = p.stars;

  const reviewCount = Object.keys(p.review).length;
  const streak = streakDays(p);
  const next = READING_LEVELS.find(l => l.id === p.unlocked) || READING_LEVELS[READING_LEVELS.length - 1];
  const list = readerList(p);
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
      <span>🎒 ${cfg.label}</span>
      <span>🔥 ${streak} day streak</span>
      <span>🔁 ${reviewCount} review word${reviewCount === 1 ? '' : 's'}</span>
      <span>⏱ ${p.settings.quick ? '~5' : '~12'} min</span>
      ${list ? `<span>📝 ${esc(list.name)} · ${listMastered(p, list)}/${list.words.length} mastered</span>` : ''}
    </div>
    <button class="btn-primary big-go" id="startToday">▶ Start lesson</button>
    ${list ? `<button class="btn-secondary big-go list-go" id="practiceList">📝 Practice my word list (${list.words.length} words)</button>` : ''}
    ${!p.placed && !p.log.length ? '<button class="link-btn" id="takeCheck">🧭 Not sure this is the right level? Take the 2-minute check</button>' : ''}
  `;
  $('#startToday').addEventListener('click', () => startLesson(next.id));
  $('#practiceList')?.addEventListener('click', () => startLesson(next.id, { listOnly: true }));
  $('#takeCheck')?.addEventListener('click', () => renderStartChoice(p));

  $('#levelPath').innerHTML = READING_LEVELS.map(l => {
    const rec = p.levels[l.id];
    const locked = l.id > p.unlocked;
    const status = rec?.mastered ? 'mastered' : locked ? 'locked' : 'open';
    const badge = rec?.mastered ? '🏅 Mastered' : locked ? '🔒 Locked' : rec ? `Best ${Math.round(rec.best * 100)}%` : 'New!';
    const goal = l.id === cfg.start ? `<span class="goal-tag">🎯 ${cfg.label} goal</span>` : '';
    return `
      <li>
        <button class="level-node ${status}" data-level="${l.id}" ${locked ? 'disabled' : ''}
          aria-label="Level ${l.id} ${l.title}, ${badge}">
          <span class="ln-icon">${locked ? '🔒' : l.icon}</span>
          <span class="ln-body">
            <span class="ln-title">Level ${l.id} · ${l.title} ${goal}</span>
            <span class="ln-grade">Usually grade ${l.grades}</span>
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
  vocab:     { icon: '🧠', name: 'Grade Words' },
  list:      { icon: '📝', name: 'My Word List' },
  think:     { icon: '🕵️', name: 'Think About It' },
};
/* Grown-up names for older readers so lessons never feel babyish */
const STEP_NAMES_OLDER = {
  sounds: 'Sound Patterns', heart: 'Tricky Words', story: 'Passage Reading',
  break: 'Reset Break', vocab: 'Vocabulary Builder', list: 'Word List Practice', think: 'Think Deeper',
};

function stepInfo(key) {
  const info = { ...STEP_INFO[key] };
  if (isOlder() && STEP_NAMES_OLDER[key]) info.name = STEP_NAMES_OLDER[key];
  if (lesson?.level.chunks) {
    if (key === 'sounds') info.name = 'Word Parts';
    if (key === 'blend') info.name = 'Chunk & Read';
  }
  return info;
}

/* Fresh internet words for this lesson. Waits a few seconds at most; anything
   slower is cached by OnlineWords and shows up in the next lesson. */
async function gatherOnlineWords(level, p, wantVocab) {
  if (!p.settings.online || typeof OnlineWords === 'undefined') return { levelWords: [], vocab: [] };
  const known = READING_LEVELS.flatMap(l => [...l.words.map(w => w[0]), ...l.heartWords]);
  const gradeList = wantVocab ? GRADE_WORDS[gradeOf(p)].map(w => w.word) : [];
  const [levelWords, vocab] = await Promise.all([
    OnlineWords.within(OnlineWords.levelWords(level, known), 3500),
    wantVocab ? OnlineWords.within(OnlineWords.gradeWords(gradeOf(p), gradeList), 3500) : [],
  ]);
  return { levelWords, vocab };
}

async function startLesson(levelId, opts = {}) {
  const p = activeProfile();
  const list = readerList(p);
  const listOnly = !!opts.listOnly && !!list;
  const level = READING_LEVELS.find(l => l.id === levelId);
  const quick = p.settings.quick;
  const cfg = gradeCfg(p);
  const older = isOlder(p);
  const hasVocab = cfg.vocab > 0 && typeof GRADE_WORDS !== 'undefined' && GRADE_WORDS[gradeOf(p)];

  let steps = quick
    ? ['sounds', 'blend', 'heart', 'story']
    : ['sounds', 'blend', 'spell', 'heart', 'sentences', ...(hasVocab ? ['vocab'] : []), 'story'];
  if (p.settings.breaks) steps.splice(quick ? 2 : 3, 0, 'break');
  // The grown-up's word list gets its own step, just before the story
  if (list) steps.splice(steps.indexOf('story'), 0, 'list');
  // After every story: retell it, make inferences, and talk about it
  steps.push('think');
  if (listOnly) steps = ['list'];

  $('#lessonTitle').textContent = listOnly ? `📝 ${list.name}` : `${level.icon} Level ${level.id}: ${level.title}`;
  $('#lessonStars').textContent = '0';
  $('#stepDots').innerHTML = '';
  if (p.settings.online && !listOnly) {
    $('#activity').innerHTML = '<div class="act-card loading-card">🌐 Getting fresh words for today…</div>';
  }
  showScreen('lessonScreen');
  const online = listOnly ? { levelWords: [], vocab: [] } : await gatherOnlineWords(level, p, !quick && hasVocab);
  if (!$('#lessonScreen').classList.contains('active')) return;   // they left while we waited
  const onlineLevel = online.levelWords.map(w => ({ level: level.id, word: w.word, emoji: null, parts: w.parts, isWeb: true }));

  lesson = {
    level, steps, stepIndex: 0, quick, cfg, older,
    story: older && level.storyOlder ? level.storyOlder : level.story,
    vocabResults: [], fluency: null,
    list, listOnly, listResults: [],
    onlineLevel: shuffle(onlineLevel), onlineVocab: online.vocab,
    onlineByWord: Object.fromEntries(onlineLevel.map(w => [w.word, w])),
    correct: 0, total: 0, stars: 0,
    missed: new Set(), reviewed: [],
    started: Date.now(),
    next() { this.stepIndex++; runStep(); },
  };
  runStep();
}

function runStep() {
  stopSpeech();
  const L = lesson;
  $('#stepDots').innerHTML = L.steps.map((s, i) =>
    `<span class="dot ${i < L.stepIndex ? 'done' : i === L.stepIndex ? 'now' : ''}" title="${stepInfo(s).name}">${stepInfo(s).icon}</span>`
  ).join('');
  if (L.stepIndex >= L.steps.length) { finishLesson(); return; }
  const step = L.steps[L.stepIndex];
  ({ sounds: stepSounds, blend: stepBlend, spell: stepSpell, heart: stepHeart,
     sentences: stepSentences, story: stepStory, break: stepBreak, vocab: stepVocab, list: stepList, think: stepThink })[step]();
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
  const info = stepInfo(stepKey);
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
function reviewWord(word, card) {
  return findWord(word) ||
    (card.parts ? { level: card.level, word, emoji: null, parts: card.parts, isWeb: true } : null);
}
const toWordObj = (w, level) => ({ level, word: w[0], emoji: w[1], parts: w[2].split('|') });

/* Render graphemes as sound boxes; "a_e" shows the vowel plus a magic e */
function soundBoxes(parts, chunky = false) {
  if (chunky) return parts.map(g => `<span class="sbox chunk">${g}</span>`).join('');
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

  activityShell('sounds', L.level.chunks
    ? 'Read the word part out loud and say what it means or how it sounds. Tap the card to hear an example word.'
    : 'Look at the card. Say the sound out loud. Tap the card to hear the key word. Then tap a button.',
    '<div id="soundCardArea"></div>');

  function show() {
    if (i >= cards.length) { L.next(); return; }
    const c = cards[i];
    $('#soundCardArea').innerHTML = `
      <div class="counter">${i + 1} / ${cards.length}</div>
      <button class="sound-card" id="soundCard" aria-label="Hear ${c.key}">
        <span class="sc-g">${c.g.replace('_', '<span class="blank">_</span>')}</span>
        <span class="sc-key">${c.emoji} ${c.key}</span>
        ${c.meaning ? `<span class="sc-meaning">💡 ${esc(c.meaning)}</span>` : ''}
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
  const reviewWords = Object.entries(p.review)
    .map(([word, card]) => reviewWord(word, card)).filter(w => w && w.level <= L.level.id)
    .slice(0, L.quick ? 1 : 3);
  const total = L.quick ? 4 : L.cfg.blend;
  const web = L.onlineLevel.filter(w => !reviewWords.some(r => r.word === w.word)).slice(0, L.quick ? 1 : 2);
  const fresh = shuffle([
    ...shuffle(L.level.words.map(w => toWordObj(w, L.level.id)))
      .filter(w => !reviewWords.some(r => r.word === w.word))
      .slice(0, total - web.length),
    ...web,
  ]);
  const items = [...reviewWords.map(w => ({ ...w, isReview: true })), ...fresh];
  const pool = READING_LEVELS.filter(l => l.id <= L.level.id).flatMap(l => l.words.map(w => toWordObj(w, l.id)));
  let i = 0;

  activityShell('blend', L.level.chunks
    ? 'Read each chunk. Then slide the chunks together and read the whole word. Pick the matching picture!'
    : 'Touch each sound box and say its sound. Then slide them together and read the word. Pick the matching picture!',
    '<div id="blendArea"></div>');

  function show() {
    if (i >= items.length) { L.next(); return; }
    const w = items[i];
    const options = w.emoji ? shuffle([w, ...shuffle(pool.filter(x => x.emoji !== w.emoji && x.word !== w.word)).slice(0, 2)]) : [];
    let firstTry = true;

    $('#blendArea').innerHTML = `
      <div class="counter">${i + 1} / ${items.length}${w.isReview ? ' · 🔁 review word' : ''}${w.isWeb ? ' · 🌐 fresh word' : ''}</div>
      <div class="sound-boxes" id="boxes">${soundBoxes(w.parts, READING_LEVELS[w.level - 1].chunks)}</div>
      <div class="row-btns">
        <button class="btn-secondary" id="slideBtn">👉 Slide it together</button>
      </div>
      ${w.emoji ? `<div class="pic-choices">${options.map(o =>
        `<button class="pic-btn" data-word="${o.word}" aria-label="picture option">${o.emoji}</button>`).join('')}</div>`
      : `<p class="find-q">Read it out loud, then check yourself.</p>
         <div class="row-btns" id="selfCheck"><button class="btn-primary" id="checkRead">🔊 Check my reading</button></div>`}
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

    // Words without a picture (fresh internet words): read aloud, listen, and self-check
    $('#checkRead')?.addEventListener('click', () => {
      speak(w.word);
      $('#selfCheck').innerHTML = `
        <button class="btn-primary" id="readRight">✅ I read it right</button>
        <button class="btn-secondary" id="readAgain">🔁 I need more practice</button>`;
      const finish = ok => {
        score(ok, w.word);
        if (w.isReview) lesson.reviewed.push({ word: w.word, ok });
        $('#selfCheck').remove();
        $('#blendFb').innerHTML = `<span class="feedback-text ${ok ? 'correct' : 'wrong'}">${
          ok ? `🎉 ${esc(w.word)}! ${praise()}` : `We'll practice "${esc(w.word)}" again soon.`}</span>
          <button class="next-btn" id="nextBlend">Next →</button>`;
        $('#nextBlend').addEventListener('click', () => { i++; show(); });
        $('#nextBlend').focus();
      };
      $('#readRight').addEventListener('click', () => finish(true));
      $('#readAgain').addEventListener('click', () => { speak(w.word, { rate: 0.5 }); finish(false); });
    });

    $$('.pic-btn').forEach(btn => btn.addEventListener('click', () => {
      if (btn.dataset.word === w.word) {
        score(firstTry, w.word);
        if (w.isReview) lesson.reviewed.push({ word: w.word, ok: firstTry });
        btn.classList.add('correct');
        $$('.pic-btn').forEach(b => b.disabled = true);
        $('#blendFb').innerHTML = `<span class="feedback-text correct">🎉 ${esc(w.word)}! ${praise()}</span>
          <button class="next-btn" id="nextBlend">Next →</button>`;
        speak(w.word);
        $('#nextBlend').addEventListener('click', () => { i++; show(); });
        $('#nextBlend').focus();
      } else {
        if (firstTry) { firstTry = false; }
        btn.classList.add('incorrect');
        btn.disabled = true;
        $('#blendFb').innerHTML = `<span class="feedback-text wrong">${retry()}</span>`;
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
  const web = L.onlineLevel.slice(2, 4);   // different fresh words than the blend step used
  const items = shuffle([
    ...shuffle(L.level.words.map(w => toWordObj(w, L.level.id))).slice(0, L.cfg.spell - web.length),
    ...web,
  ]);
  const allTiles = [...new Set([
    ...L.level.words.flatMap(w => spellTiles(w[2].split('|'))),
    ...web.flatMap(w => spellTiles(w.parts)),
  ])];
  let i = 0;

  activityShell('spell', L.level.chunks
    ? 'Listen to the word. Break it into chunks. Tap the chunks in order to build the word.'
    : 'Listen to the word. Say each sound slowly. Tap the letters in order to build the word.',
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
      <div class="counter">${i + 1} / ${items.length}${w.isWeb ? ' · 🌐 fresh word' : ''}</div>
      <button class="hear-word" id="hearWord" aria-label="Hear the word" data-word="${esc(w.word)}">
        <span class="hw-emoji">${w.emoji || '👂'}</span><span>🔊 Hear it</span>
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
        $('#spellFb').innerHTML = `<span class="feedback-text correct">🎉 You built "${esc(w.word)}"! ${praise()}</span>
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
        $('#spellFb').innerHTML = `<span class="feedback-text wrong">${retry()} The first ${built.length} letter${built.length === 1 ? ' is' : 's are'} right.</span>`;
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
          $('#heartFb').innerHTML = `<span class="feedback-text wrong">${retry()} Look at the card again.</span>`;
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
function wireTapWords(root, onTap) {
  $$('.rw', root).forEach(b => b.addEventListener('click', () => { onTap?.(); speak(b.dataset.w); }));
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
      showToast(praise(), 'correct');
      i++; show();
    });
  }
  show();
}

/* ---------- STEP: Story Time (fluency + comprehension) ---------- */
function stepStory() {
  const L = lesson;
  const story = L.story;
  const lines = story.text.match(/[^.!?]+[.!?"]+/g).map(s => s.trim());
  const wordCount = story.text.split(/\s+/).length;
  const canTime = gradeOf() !== 'K';
  let line = 0;
  let firstTry = true;
  let timer = null;   // { start, assisted } while a timed read is running

  activityShell('story',
    'Read the story one line at a time. Tap any word to hear it. Use Read to me if you want to hear it first.' +
      (canTime ? ' Want a challenge? Time your reading!' : ''),
    `<h4 class="story-title">${esc(story.title)}</h4>
     <div class="story tinted" id="story">${lines.map((s, k) =>
       `<p class="story-line" data-k="${k}">${wordSpans(s)}</p>`).join('')}</div>
     <div class="row-btns">
       <button class="btn-secondary" id="storyEcho">🔊 Read this line to me</button>
       <button class="btn-primary" id="storyNext">Next line ↓</button>
       ${canTime ? '<button class="btn-outline" id="storyTime">⏱ Time my reading</button>' : ''}
     </div>
     <div id="storyQ"></div>`);

  const lineEls = $$('.story-line');
  function focusLine() {
    lineEls.forEach((el, k) => {
      el.classList.toggle('current', k === line);
      el.classList.toggle('done', k < line);
    });
    $('#storyNext').textContent = line < lines.length - 1 ? 'Next line ↓' : '✔ I finished the story!';
  }
  focusLine();

  $('#storyEcho').addEventListener('click', () => {
    if (timer) timer.assisted = true;
    stopSpeech();
    echoRead(lineEls[line]);
  });
  $('#storyTime')?.addEventListener('click', () => {
    timer = { start: Date.now(), assisted: false };
    line = 0;
    focusLine();
    $('#storyTime').textContent = '⏱ Timing… read out loud!';
    $('#storyTime').disabled = true;
    instruct('Go! Read out loud, then tap next line.');
  });
  wireTapWords($('#story'), () => { if (timer) timer.assisted = true; });
  $('#storyNext').addEventListener('click', () => {
    stopSpeech();
    if (line < lines.length - 1) { line++; focusLine(); return; }
    if (timer) {
      const secs = Math.max(5, (Date.now() - timer.start) / 1000);
      const wpm = Math.round(wordCount / (secs / 60));
      // Faster than any real read-aloud means lines were tapped through, not read
      L.fluency = { wpm, assisted: timer.assisted, skipped: wpm > MAX_REAL_WPM };
      showToast(L.fluency.skipped ? 'Too fast to count — read every line out loud!' : `⏱ ${wpm} words per minute!`,
        L.fluency.skipped ? 'wrong' : 'correct');
    }
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
        $('#storyFb').innerHTML = `<span class="feedback-text correct">🎉 ${L.older ? 'You understood the passage.' : 'You understood the story!'}</span>
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

/* ---------- STEP: Grade Words (vocabulary from the child's grade list) ---------- */
function stepVocab() {
  const L = lesson;
  const p = activeProfile();
  // Words never seen come first, then the ones answered right the fewest times
  const web = L.onlineVocab.slice(0, Math.floor(L.cfg.vocab / 2));
  const list = shuffle([
    ...shuffle([...GRADE_WORDS[gradeOf(p)]])
      .sort((a, b) => (p.vocab[a.word] ?? -1) - (p.vocab[b.word] ?? -1))
      .slice(0, L.cfg.vocab - web.length),
    ...web,
  ]);
  let i = 0;

  activityShell('vocab',
    `These are ${L.cfg.label} words. Read the sentence, use the clues, and choose what the word means.`,
    '<div id="vocabArea"></div>');

  function show() {
    if (i >= list.length) { L.next(); return; }
    const w = list[i];
    let firstTry = true;
    $('#vocabArea').innerHTML = `
      <div class="counter">${i + 1} / ${list.length}${w.source ? ' · 🌐 fresh word' : ''}</div>
      <button class="vocab-word" id="vocabWord" aria-label="Hear ${esc(w.word)}">${esc(w.word)} <span>🔊</span></button>
      <div class="read-line tinted" id="vocabSent">${wordSpans(w.contextSentence)}</div>
      <p class="find-q">${esc(w.contextQuestion)}</p>
      <div class="context-choices">${w.contextChoices.map((c, k) =>
        `<button class="choice-btn" data-k="${k}"><span class="choice-letter">${'ABCD'[k]}</span><span>${esc(c)}</span></button>`).join('')}</div>
      <div class="feedback-box" id="vocabFb"></div>`;
    $$('#vocabSent .rw').forEach(b => {
      if (b.dataset.w.toLowerCase().startsWith(w.word.toLowerCase())) b.classList.add('target');
    });
    wireTapWords($('#vocabSent'));
    $('#vocabWord').addEventListener('click', () => speak(w.word));
    $$('#vocabArea .choice-btn').forEach(btn => btn.addEventListener('click', () => {
      if (+btn.dataset.k === w.contextAnswer) {
        score(firstTry);
        L.vocabResults.push({ word: w.word, ok: firstTry });
        btn.classList.add('correct');
        $$('#vocabArea .choice-btn').forEach(b => b.disabled = true);
        $('#vocabFb').innerHTML = `<span class="feedback-text correct">✅ <b>${esc(w.word)}</b>: ${esc(w.definition)}</span>
          <button class="next-btn" id="nextVocab">Next →</button>`;
        speak(`${w.word}. ${w.definition}`);
        $('#nextVocab').addEventListener('click', () => { i++; show(); });
        $('#nextVocab').focus();
      } else {
        firstTry = false;
        btn.classList.add('incorrect');
        btn.disabled = true;
        $('#vocabFb').innerHTML = `<span class="feedback-text wrong">${retry()} Reread the sentence for clues.</span>`;
      }
    }));
  }
  show();
}

/* ---------- STEP: My Word List (the grown-up's own words) ----------
   Read the word aloud and check by listening, then spell it from letter tiles.
   Words not yet mastered come up first. */
function stepList() {
  const L = lesson;
  const p = activeProfile();
  const prog = p.listProgress[L.list.id] || {};
  const count = L.listOnly ? Math.min(L.list.words.length, L.quick ? 6 : 10) : (L.quick ? 3 : 5);
  const words = shuffle([...L.list.words])
    .sort((a, b) => (prog[listKey(a.word)] ?? -1) - (prog[listKey(b.word)] ?? -1))
    .slice(0, count);
  let i = 0;

  activityShell('list',
    'These are your own practice words. Read each word out loud, check yourself, then spell it.',
    '<div id="listArea"></div>');

  function show() {
    if (i >= words.length) { L.next(); return; }
    const w = words[i];
    let readOk = false;
    $('#listArea').innerHTML = `
      <div class="counter">${i + 1} / ${words.length}</div>
      <div class="list-word tinted" id="listWord">${esc(w.word)}</div>
      ${w.definition ? `<p class="list-meaning">💡 ${esc(w.definition)}</p>` : ''}
      <div class="row-btns" id="listRead"><button class="btn-primary" id="listCheck">🔊 Check my reading</button></div>
      <div id="listSpell"></div>
      <div class="feedback-box" id="listFb"></div>`;

    $('#listCheck').addEventListener('click', () => {
      speak(w.word);
      $('#listRead').innerHTML = `
        <button class="btn-primary" id="listReadOk">✅ I read it right</button>
        <button class="btn-secondary" id="listReadAgain">🔁 I need more practice</button>`;
      $('#listReadOk').addEventListener('click', () => { readOk = true; score(true); spellIt(); });
      $('#listReadAgain').addEventListener('click', () => { score(false); speak(w.word, { rate: 0.5 }); spellIt(); });
    });

    function spellIt() {
      $('#listRead').remove();
      $('#listWord').classList.add('hidden-word');
      const target = w.word.toLowerCase().split('');
      const extras = shuffle('abcdefghijklmnopqrstuvwxyz'.split('').filter(c => !target.includes(c)))
        .slice(0, Math.min(4, Math.max(2, Math.ceil(target.length / 3))));
      const bank = shuffle([...target, ...extras]);
      let built = [];
      let tries = 0;
      $('#listSpell').innerHTML = `
        <p class="find-q">Now spell it! <button class="inline-say" id="listHear">🔊 Hear it</button></p>
        <div class="spell-slots" id="listSlots">${target.map(() => '<span class="slot"></span>').join('')}</div>
        <div class="tile-bank" id="listBank">${bank.map((t, k) =>
          `<button class="tile" data-k="${k}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        <div class="row-btns">
          <button class="btn-outline" id="listUndo">↩ Undo</button>
          <button class="btn-primary" id="listSpellCheck">✔ Check</button>
        </div>`;
      $('#listHear').addEventListener('click', () => speak(w.word));
      speak(`Now spell ${w.word}`, { queue: true });

      const paint = () => $$('#listSlots .slot').forEach((slot, k) => {
        slot.textContent = built[k]?.dataset.t || '';
        slot.classList.toggle('filled', !!built[k]);
      });
      $$('#listBank .tile').forEach(tile => tile.addEventListener('click', () => {
        if (built.length >= target.length) return;
        built.push(tile);
        tile.disabled = true;
        paint();
      }));
      $('#listUndo').addEventListener('click', () => {
        const last = built.pop();
        if (last) last.disabled = false;
        paint();
      });
      $('#listSpellCheck').addEventListener('click', () => {
        tries++;
        const right = built.map(t => t.dataset.t).join('') === target.join('');
        if (!right && tries < 3) {
          let keep = 0;
          while (keep < built.length && built[keep].dataset.t === target[keep]) keep++;
          built.slice(keep).forEach(t => { t.disabled = false; });
          built = built.slice(0, keep);
          paint();
          $('#listFb').innerHTML = `<span class="feedback-text wrong">${retry()}${keep ? ` The first ${keep} letter${keep === 1 ? ' is' : 's are'} right.` : ''}</span>`;
          speak(w.word, { rate: 0.5 });
          return;
        }
        const spellOk = right && tries === 1;
        score(spellOk);
        L.listResults.push({ word: w.word, ok: readOk && spellOk });
        $('#listWord').classList.remove('hidden-word');
        $('#listSpellCheck').disabled = true;
        $('#listUndo').disabled = true;
        if (right) $('#listSlots').classList.add('solved');
        $('#listFb').innerHTML = `<span class="feedback-text ${right ? 'correct' : 'wrong'}">${right
          ? `🎉 ${esc(w.word)}! ${praise()}`
          : `It's spelled <b>${esc(w.word)}</b>. We'll practice it again soon.`}</span>
          <button class="next-btn" id="nextList">Next →</button>`;
        speak(right ? w.word : `${w.word}. ${target.join(', ')}. ${w.word}.`);
        $('#nextList').addEventListener('click', () => { i++; show(); });
        $('#nextList').focus();
      });
    }
  }
  show();
}

/* ---------- STEP: Think About It (comprehension after the story) ----------
   1. Retell: put three parts of the story in order
   2. Detective: inference exercises (find the answer, then the clue that proves it)
   3. One more comprehension skill (full lessons)
   4. Talk it over with a grown-up — oral comprehension, not scored */
function stepThink() {
  const L = lesson;
  const p = activeProfile();
  const band = Comprehension.bandFor(gradeOf(p));
  const lines = L.story.text.match(/[^.!?]+[.!?"]+/g).map(s => s.trim());
  const exercises = [];
  if (lines.length >= 3) {
    const picks = [0, Math.floor(lines.length / 2), lines.length - 1];
    exercises.push({
      skill: 'sequence',
      text: `"${L.story.title}"`,
      q: L.older ? 'Retell the passage: put these sentences in the order they appeared.' : 'Retell the story! Put these parts in order.',
      items: picks.map(i => lines[i]),
      why: L.older ? 'Retelling events in order is how strong readers check that they understood.' : 'That\'s the order they happened. Retelling helps you remember the story!',
    });
  }
  exercises.push(...Comprehension.pick(band, L.quick ? 1 : 2, 'infer'));
  const extra = Comprehension.pick(band, 8).find(x => x.skill !== 'infer' && x.skill !== 'sequence');
  if (!L.quick && extra) exercises.push(extra);
  let i = 0;

  activityShell('think',
    L.older ? 'Check your understanding: retell the passage, then make inferences and prove them with clues.'
            : 'Let\'s think about what you read. Retell the story, then be a reading detective!',
    '<div id="thinkArea"></div>');

  function show() {
    if (i >= exercises.length) { talk(); return; }
    $('#thinkArea').innerHTML = `<div class="counter">${i + 1} / ${exercises.length}</div><div id="thinkItem"></div>`;
    Comprehension.render($('#thinkItem'), exercises[i], {
      speak: text => speak(text),
      older: L.older,
      onDone: ok => { score(ok); i++; show(); },
    });
  }

  function talk() {
    const prompts = L.older
      ? ['Sum up the passage in two sentences.', 'Which clue in the text helped you understand a character or an idea?', 'What question would you ask the author?']
      : ['What was your favorite part? Why?', 'How did the characters feel? How do you know?', 'What do you think happens next?'];
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    $('#thinkArea').innerHTML = `
      <div class="talk-card">
        <div class="talk-icon">💬</div>
        <p class="talk-label">${L.older ? 'Discuss with a grown-up' : 'Talk with a grown-up'}</p>
        <p class="talk-prompt">${esc(prompt)}</p>
        <button class="btn-secondary" id="talkSay">🔊 Read it to me</button>
        <button class="btn-primary" id="talkDone">✅ We talked about it</button>
      </div>`;
    instruct(prompt);
    $('#talkSay').addEventListener('click', () => speak(prompt));
    $('#talkDone').addEventListener('click', () => L.next());
  }
  show();
}

/* ---------- STEP: Brain Break ---------- */
function stepBreak() {
  const L = lesson;
  const b = pick(L.older ? BRAIN_BREAKS_OLDER : BRAIN_BREAKS);
  activityShell('break', `${L.older ? 'Quick reset.' : 'Brain break!'} ${b.text}`, `
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
  let justMastered = false;
  if (!L.listOnly) {
    const rec = p.levels[L.level.id] || { best: 0, attempts: 0, mastered: false };
    rec.attempts++;
    rec.best = Math.max(rec.best, acc);
    justMastered = !rec.mastered && acc >= MASTERY;
    if (acc >= MASTERY) rec.mastered = true;
    p.levels[L.level.id] = rec;
    if (rec.mastered && L.level.id === p.unlocked && p.unlocked < READING_LEVELS.length) p.unlocked++;
  }

  // A list word counts as mastered after being read AND spelled right twice in a row
  if (L.list) {
    const prog = p.listProgress[L.list.id] ??= {};
    for (const r of L.listResults) prog[listKey(r.word)] = r.ok ? (prog[listKey(r.word)] ?? 0) + 1 : 0;
  }

  // Spaced review: missed words enter the deck; reviewed words move up or reset
  for (const r of L.reviewed) {
    const card = p.review[r.word];
    if (!card) continue;
    if (r.ok) { card.box++; if (card.box >= REVIEW_GRADUATE) delete p.review[r.word]; }
    else card.box = 0;
  }
  for (const w of L.missed) {
    const web = L.onlineByWord[w];
    if (web) p.review[w] = { level: L.level.id, box: 0, parts: web.parts };
    else if (findWord(w)) p.review[w] = { level: L.level.id, box: 0 };
  }

  for (const v of L.vocabResults) {
    p.vocab[v.word] = v.ok ? (p.vocab[v.word] ?? 0) + 1 : 0;
  }
  // Only independent timed reads count toward reading speed
  if (L.fluency && !L.fluency.assisted && !L.fluency.skipped) {
    p.fluency.push({ date: today(), level: L.level.id, wpm: L.fluency.wpm });
    p.fluency = p.fluency.slice(-30);
  }

  p.stars += L.stars + (justMastered ? 5 : 0);
  p.minutes += mins;
  if (!p.days.includes(today())) p.days.push(today());
  p.log.unshift({ date: today(), level: L.level.id, acc: Math.round(acc * 100), mins, ...(L.listOnly ? { list: L.list.name } : {}) });
  p.log = p.log.slice(0, 30);
  saveStore();

  const pct = Math.round(acc * 100);
  let title, msg;
  if (L.listOnly) {
    const mastered = listMastered(p, L.list);
    title = acc >= MASTERY ? '🌟 Great Word Practice!' : '💪 Good Practice!';
    msg = `${pct}% right on your own. ${mastered} of ${L.list.words.length} words on your list are mastered.`;
    if (acc >= MASTERY) launchConfetti();
  } else if (justMastered) {
    title = '🏅 Level Mastered!';
    msg = `${pct}% on your own — you unlocked the next level and earned 5 bonus stars!`;
    launchConfetti();
  } else if (acc >= MASTERY) {
    title = '🌟 Super Reading!';
    msg = `${pct}% on your own. You are a strong reader at this level!`;
    launchConfetti();
  } else {
    title = '💪 Great Practice!';
    msg = L.older
      ? `You got ${pct}% on your own. Run this level again tomorrow — repetition is how reading gets automatic.`
      : `You got ${pct}% on your own. Practice this level again tomorrow — brains grow with practice!`;
  }
  const missed = [...L.missed];

  $('#stepDots').innerHTML = '';
  $('#activity').innerHTML = `
    <div class="act-card done-card">
      <div class="done-avatar">${p.avatar}</div>
      <h3 class="result-title">${title}</h3>
      <p class="result-msg">${msg}</p>
      <div class="result-stars">${'⭐'.repeat(Math.min(L.stars, 12))}</div>
      ${L.fluency && !L.fluency.skipped ? `<p class="practice-note">⏱ Reading speed: <b>${L.fluency.wpm} words per minute</b>${
        L.fluency.assisted ? ' (with help — try it solo next time!)' : ''}</p>` : ''}
      ${missed.length ? `<p class="practice-note">🔁 We'll practice these again next time: <b>${missed.map(esc).join(', ')}</b></p>` : ''}
      <div class="row-btns">
        <button class="btn-primary" id="toMap">🗺️ My Path</button>
        <button class="btn-secondary" id="again">🔄 Practice again</button>
      </div>
    </div>`;
  speak(`${title.replace(/[^\w\s!]/g, '')} ${msg}`);
  $('#toMap').addEventListener('click', renderMap);
  $('#again').addEventListener('click', () => startLesson(L.level.id, { listOnly: L.listOnly }));
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
    const cfg = gradeCfg(p);
    const gradeList = GRADE_WORDS?.[gradeOf(p)] || [];
    const vocabKnown = gradeList.filter(w => (p.vocab[w.word] ?? 0) >= 2).length;
    const vocabSeen = gradeList.filter(w => w.word in p.vocab).length;
    const solo = p.fluency;
    const latest = solo[solo.length - 1];
    const best = solo.reduce((m, f) => Math.max(m, f.wpm), 0);
    const goalPct = latest && cfg.wcpm ? Math.min(100, Math.round(latest.wpm / cfg.wcpm * 100)) : 0;
    const fluencyHtml = !cfg.wcpm ? '<p>Timed reading starts in Grade 1. For now, focus on sounds and blending.</p>' : `
        <div class="lvl-row">
          <span class="lvl-name">Latest: ${latest ? latest.wpm + ' wpm' : '—'}</span>
          <span class="lvl-bar"><span style="width:${goalPct}%"></span></span>
          <span class="lvl-pct">${cfg.wcpm}</span>
        </div>
        <p class="fine">Best: ${best || '—'} wpm · Typical end of ${cfg.label}: ${cfg.wcpm} words per minute.
          ${solo.length > 1 ? `Change since first timed read: <b>${latest.wpm - solo[0].wpm >= 0 ? '+' : ''}${latest.wpm - solo[0].wpm} wpm</b>.` : ''}
          Kids with learning differences often read below the typical rate — steady growth is the goal.</p>`;
    const recent = p.log.slice(0, 5).map(e =>
      `<li>${e.date} · ${e.list ? `📝 ${esc(e.list)}` : `Level ${e.level}`} · ${e.acc}% · ${e.mins} min</li>`).join('') || '<li>No lessons yet.</li>';
    const lists = typeof WordLists !== 'undefined' ? WordLists.all() : [];
    const myList = readerList(p);
    const prog = myList ? (p.listProgress[myList.id] || {}) : {};
    const practicing = myList ? myList.words.filter(w => prog[listKey(w.word)] === 0).map(w => w.word) : [];
    const listHtml = myList
      ? `<p><b>${esc(myList.name)}</b>: ${listMastered(p, myList)} of ${myList.words.length} words mastered (read and spelled right twice in a row).</p>
         ${practicing.length ? `<p class="fine">Still practicing: ${practicing.map(esc).join(', ')}</p>` : ''}`
      : `<p class="fine">${lists.length ? 'Pick a list below to add it to every lesson.' : 'Make a list in "📝 Word lists" below, then pick it here.'}</p>`;
    return `
      <section class="parent-card">
        <header><span class="pf-avatar">${p.avatar}</span><h3>${esc(p.name)}</h3>
          <label class="place-label">Grade
            <select data-grade="${p.id}">${GRADE_KEYS.map(g =>
              `<option value="${g}" ${g === gradeOf(p) ? 'selected' : ''}>${GRADES[g].label}</option>`).join('')}
            </select>
          </label>
        </header>
        <div class="kpis">
          <div><b>${mastered}</b><span>levels mastered</span></div>
          <div><b>${p.minutes}</b><span>minutes read</span></div>
          <div><b>${streakDays(p)}</b><span>day streak</span></div>
          <div><b>${p.days.length}</b><span>days practiced</span></div>
        </div>
        <h4>Level progress <small>(best first-try accuracy · ${Math.round(MASTERY * 100)}% = mastered)</small></h4>
        ${rows}
        <h4>Reading speed <small>(timed passages read without help)</small></h4>
        ${fluencyHtml}
        ${gradeList.length && cfg.vocab ? `<h4>${cfg.label} vocabulary</h4>
        <p>${vocabKnown} of ${gradeList.length} words known (right twice in a row) · ${vocabSeen} practiced so far</p>` : ''}
        <h4>📝 Word list practice</h4>
        ${listHtml}
        <h4>Words to review</h4>
        <p>${review.length ? review.map(esc).join(', ') : 'None — great job! 🎉'}</p>
        <h4>Recent lessons</h4>
        <ul class="recent">${recent}</ul>
        <div class="row-btns">
          <label class="place-label">Word list
            <select data-list="${p.id}">
              <option value="">None</option>
              ${lists.map(l => `<option value="${l.id}" ${l.id === p.listId ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}
            </select>
          </label>
          <label class="place-label">Starting level
            <select data-place="${p.id}">${READING_LEVELS.map(l =>
              `<option value="${l.id}" ${l.id === p.unlocked ? 'selected' : ''}>Level ${l.id}: ${l.title}</option>`).join('')}
            </select>
          </label>
          <button class="btn-secondary" data-check="${p.id}">🧭 Placement check</button>
          <button class="btn-outline" data-del="${p.id}">🗑 Remove reader</button>
        </div>
      </section>`;
  }).join('') || '<p class="section-sub">No readers yet — add one on the home screen.</p>';

  $('#parentBody').innerHTML = `
    ${cards}
    <section class="parent-card">
      <h3>📝 Word lists</h3>
      <p class="fine">Add your child's own words — like this week's spelling list. Lists are saved on this device and work in SpellingHive games too. Pick a list for each reader above.</p>
      <div id="rbListEditor"></div>
    </section>
    <section class="parent-card tips">
      <h3>💡 How to get the fastest results</h3>
      <ul>
        <li><b>Little and often beats long and rare.</b> 10–15 minutes a day, 5 days a week, works far better than one long session. Short lessons mode is great for tired days.</li>
        <li><b>Sit with your child for Sound Cards.</b> Model the pure sound ("mmm", not "muh"). Computer voices can't say sounds alone perfectly — your voice is the best teacher.</li>
        <li><b>Have them read out loud every time.</b> Saying, seeing and hearing at once (multisensory learning) builds stronger memory pathways.</li>
        <li><b>Don't rush mastery.</b> A level unlocks at ${Math.round(MASTERY * 100)}% first-try accuracy. Repeating a level is normal and builds automaticity.</li>
        <li><b>Praise effort, not speed.</b> Say "You kept trying on that hard word!" instead of "You're so smart."</li>
        <li><b>Placement:</b> Run the 2-minute placement check, or pick a starting level above. If accuracy stays below 60%, move back one level.</li>
        <li><b>Fresh words:</b> With "Add fresh words from the internet" on, each lesson mixes in a few new words from online dictionaries (or made by Claude when the page can't reach them). They're checked to use only sounds your child has learned. They have no pictures, so your child reads them aloud and checks by listening — a great moment to listen in.</li>
        <li><b>Your own word lists:</b> Add spelling or sight words in "📝 Word lists", then pick a list for each reader. Every lesson adds a short "My Word List" step (read it, check by listening, then spell it), and "Practice my word list" on the path runs just those words.</li>
        <li><b>Think About It:</b> After every story, your child retells it in order, answers "detective" inference questions (then picks the clue that proves the answer), and talks about it with you. Those talk prompts build comprehension too, so take a minute to chat.</li>
        <li><b>Grade setting:</b> It doesn't lock your child into grade-level material. It sets the target level, lesson length, grade vocabulary, the reading-speed goal, and a more grown-up tone for Grades 3–8 — while lessons still meet them at their real skill level.</li>
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
  if (typeof WordLists !== 'undefined') WordLists.mountEditor($('#rbListEditor'), { onChange: renderParent });
  $$('[data-list]').forEach(sel => sel.addEventListener('change', () => {
    store.profiles[sel.dataset.list].listId = sel.value || null;
    saveStore();
    renderParent();
    showToast(sel.value ? 'Word list added to lessons ✔' : 'Word list removed', 'correct');
  }));
  $$('[data-grade]').forEach(sel => sel.addEventListener('change', () => {
    store.profiles[sel.dataset.grade].grade = sel.value;
    saveStore();
    applySettings();
    renderParent();
    showToast('Grade updated ✔', 'correct');
  }));
  $$('[data-check]').forEach(btn => btn.addEventListener('click', () => {
    store.activeId = btn.dataset.check;
    saveStore();
    applySettings();
    renderStartChoice(activeProfile());
  }));
  $$('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
    const p = store.profiles[btn.dataset.del];
    if (!await askConfirm(`Remove ${p.name} and all their progress? This can't be undone.`, { confirmLabel: 'Remove reader', danger: true })) return;
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
