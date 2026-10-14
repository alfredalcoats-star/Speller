/* ===================================================================
   SpellingHive — App Logic
   =================================================================== */

/* ===== STATE ===== */
const state = {
  currentGrade: null,
  currentGame: null,
  words: [],
  score: 0,
  total: 0,
  round: 0,
  online: {},          // grade -> fresh words fetched from the internet
  currentList: null,   // id of the grown-up's word list in use
  source: 'random',    // which words the spelling games use: 'list' | 'random' | 'mixed'
  matchState: {
    selectedWord: null,
    selectedDef:  null,
    matched:      new Set(),
  },
};

/* ===================================================================
   NAVIGATION
   =================================================================== */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  const viewMap = { homeScreen: 'home', gamesScreen: 'games', practiceScreen: 'practice', listsScreen: 'lists' };
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewMap[id]);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.view === 'home')  showScreen('homeScreen');
    if (btn.dataset.view === 'games') openGames();
    if (btn.dataset.view === 'lists') openListsScreen();
  });
});

document.getElementById('logoHome').addEventListener('click', (e) => {
  e.preventDefault();
  showScreen('homeScreen');
});

document.getElementById('backFromGames').addEventListener('click', () => showScreen('homeScreen'));
document.getElementById('backFromLists').addEventListener('click', () => { renderHomeLists(); showScreen('homeScreen'); });
document.getElementById('backFromPractice').addEventListener('click', () => {
  stopSpelling();
  showScreen('gamesScreen');
});

/* ===================================================================
   FRESH WORDS FROM THE INTERNET
   Each game mixes up to 4 fresh words into the grade's built-in list.
   =================================================================== */
const ONLINE_KEY = 'spellinghive.onlineWords';
function onlineEnabled() {
  try { return localStorage.getItem(ONLINE_KEY) !== 'off'; } catch (e) { return true; }
}

function fetchOnlineWords(grade) {
  const status = document.getElementById('onlineStatus');
  if (!onlineEnabled() || typeof OnlineWords === 'undefined') { status.textContent = ''; return; }
  if (state.online[grade]?.length) { showOnlineStatus(grade); return; }
  status.textContent = '⏳ Finding fresh words…';
  const builtIn = GRADE_WORDS[grade].map(w => w.word);
  OnlineWords.gradeWords(grade, builtIn).then(words => {
    state.online[grade] = words;
    if (state.currentGrade === grade) showOnlineStatus(grade);
  });
}

function showOnlineStatus(grade) {
  const words = state.online[grade] || [];
  const status = document.getElementById('onlineStatus');
  if (!onlineEnabled()) status.textContent = '';
  else if (!words.length) status.textContent = 'Couldn\'t get new words right now — using built-in words.';
  else status.textContent = words[0].source === 'claude'
    ? `✨ ${words.length} new words ready (made by Claude)`
    : `✅ ${words.length} fresh words ready from online dictionaries`;
}

/* Built-in words, plus up to 4 fresh ones when available */
function buildWordSet(grade) {
  const builtIn = shuffle([...GRADE_WORDS[grade]]);
  const fresh = onlineEnabled() ? shuffle([...(state.online[grade] || [])]).slice(0, 4) : [];
  return shuffle([...builtIn.slice(0, 8 - fresh.length), ...fresh]);
}

const webBadge = w => w.source ? ' <span class="web-badge" title="Fresh word from the internet">🌐</span>'
  : w.custom && state.source === 'mixed' ? ' <span class="web-badge" title="From your word list">📝</span>' : '';
const roundTag = w => w.source ? ' · 🌐 fresh word' : w.custom && state.source === 'mixed' ? ' · 📝 your word' : '';

const onlineToggle = document.getElementById('onlineToggle');
onlineToggle.checked = onlineEnabled();
onlineToggle.addEventListener('change', () => {
  try { localStorage.setItem(ONLINE_KEY, onlineToggle.checked ? 'on' : 'off'); } catch (e) { /* ignore */ }
  if (state.currentGrade && state.source !== 'list') fetchOnlineWords(state.currentGrade);
  showOnlineStatus(state.currentGrade);
});

/* ===== GRADE CARDS ===== */
document.querySelectorAll('.grade-card').forEach(card => {
  card.addEventListener('click', () => {
    state.currentGrade = card.dataset.grade;
    openGames({ source: savedSource() === 'mixed' && WordLists.all().length ? 'mixed' : 'random' });
  });
});

/* ===================================================================
   GROWN-UPS' WORD LISTS
   A list plays like a grade in every spelling game. Words with a meaning
   or sentence use it; plain words get a spelling version of the same game:
     Word Match      meaning ↔ word, or spoken word ↔ written word
     Context Clues   meaning in a sentence, or "which spelling is right?"
     Missing Words   word in a sentence, or the missing letters in the word
     Spell It        hear it, build it from its own letters
   =================================================================== */
const GAME_NEEDS = {
  match:   { min: 2 },
  context: { min: 1 },
  missing: { min: 1 },
  spell:   { min: 1 },
  sing:    { min: 1 },
  // Comprehension games use reading texts for the chosen grade, not word lists
  think:   { gradeOnly: true },
  infer:   { gradeOnly: true },
};

/* Look-alike misspellings for "which spelling is right?" rounds */
function misspellings(word, n = 3) {
  const w = word.toLowerCase();
  const vowels = 'aeiou';
  const tries = [];
  for (let i = 0; i < w.length - 1; i++) tries.push(w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2));   // swap two letters
  if (w.length > 3) for (let i = 1; i < w.length; i++) tries.push(w.slice(0, i) + w.slice(i + 1));      // leave one out
  for (let i = 1; i < w.length; i++) {
    if (!vowels.includes(w[i]) && /[a-z]/.test(w[i])) tries.push(w.slice(0, i + 1) + w[i] + w.slice(i + 1)); // double a consonant
  }
  for (let i = 0; i < w.length; i++) {
    if (vowels.includes(w[i])) for (const v of vowels) if (v !== w[i]) tries.push(w.slice(0, i) + v + w.slice(i + 1)); // swap a vowel
  }
  [['ie', 'ei'], ['ei', 'ie'], ['ph', 'f'], ['ck', 'k'], ['c', 'k'], ['tion', 'shun'], ['ou', 'ow'], ['ee', 'ea'], ['ea', 'ee']]
    .forEach(([a, b]) => { if (w.includes(a)) tries.push(w.replace(a, b)); });
  if (w.endsWith('e') && w.length > 3) tries.push(w.slice(0, -1));
  const out = [];
  for (const t of shuffle(tries)) {
    if (t && t !== w && !out.includes(t) && /[a-z]/.test(t)) out.push(t);
    if (out.length >= n) break;
  }
  return out;
}

/* A gap in the word to fill in: the vowel sound if there is one, else one letter */
function missingLetters(word) {
  const w = word.toLowerCase();
  const VOWEL_SETS = { 1: ['a', 'e', 'i', 'o', 'u'], 2: ['ai', 'ay', 'ea', 'ee', 'ei', 'ie', 'oa', 'oo', 'ou', 'ow', 'ue', 'au'] };
  let at = -1, len = 0;
  const m = [...w.matchAll(/[aeiou]{1,2}/g)].find(x => x.index > 0) || [...w.matchAll(/[aeiou]{1,2}/g)][0];
  if (m && w.length > 1) { at = m.index; len = m[0].length; }
  else { at = Math.min(1, w.length - 1); len = 1; }
  const answer = w.slice(at, at + len);
  const pool = /^[aeiou]+$/.test(answer) ? VOWEL_SETS[len] : 'bcdfghjklmnprstvwz'.split('');
  const others = shuffle(pool.filter(x => x !== answer && w.slice(0, at) + x + w.slice(at + len) !== w)).slice(0, 3);
  return {
    shown: w.slice(0, at) + '_'.repeat(len) + w.slice(at + len),
    answer,
    choices: shuffle([answer, ...others]),
  };
}

/* Ready-to-play rounds for a game, built from a list's words */
function listRoundsFor(game, entries) {
  return entries.map(e => {
    if (game === 'context' && !(e.contextChoices && e.contextSentence)) {
      const wrong = misspellings(e.word);
      if (!wrong.length) return null;
      const choices = shuffle([e.word.toLowerCase(), ...wrong]);
      return { ...e, spellingCheck: true, contextQuestion: '🔊 Listen. Which word is spelled correctly?',
        contextChoices: choices, contextAnswer: choices.indexOf(e.word.toLowerCase()) };
    }
    if (game === 'missing' && !e.sentence) return { ...e, letterGap: missingLetters(e.word) };
    return e;
  }).filter(Boolean);
}

function listEntries(list) {
  const builtInDefs = Object.values(GRADE_WORDS).flat().map(w => w.definition);
  return WordLists.toGameEntries(list, builtInDefs);
}

function renderHomeLists() {
  const wrap = document.getElementById('homeLists');
  const lists = WordLists.all();
  wrap.innerHTML = lists.map(l => {
    const c = WordLists.counts(l);
    return `<button class="grade-card gc-teal list-card" data-list="${l.id}">
      <div class="gc-icon">📝</div>
      <div class="gc-name">${escapeHtml(l.name)}</div>
      <div class="gc-desc">${c.words} word${c.words === 1 ? '' : 's'}</div>
      <div class="gc-arrow">→</div>
    </button>`;
  }).join('') + `
    <button class="grade-card gc-navy list-card add-list-card" id="addListCard">
      <div class="gc-icon">➕</div>
      <div class="gc-name">${lists.length ? 'Add or edit lists' : 'Make a word list'}</div>
      <div class="gc-desc">For grown-ups</div>
      <div class="gc-arrow">→</div>
    </button>`;
  wrap.querySelectorAll('[data-list]').forEach(b => b.addEventListener('click', () => selectList(b.dataset.list)));
  document.getElementById('addListCard').addEventListener('click', openListsScreen);
}

function openListsScreen() {
  WordLists.mountEditor(document.getElementById('listEditor'), { onChange: renderHomeLists, onPlay: selectList });
  showScreen('listsScreen');
}

function selectList(id) {
  if (!WordLists.get(id)) { renderHomeLists(); return; }
  state.currentList = id;
  openGames({ source: 'list' });
}

/* ===================================================================
   WORD SOURCE — My word list / Random words / Mixed
   =================================================================== */
const SOURCE_KEY = 'spellinghive.wordSource';
function savedSource() {
  try { return localStorage.getItem(SOURCE_KEY) || 'random'; } catch (e) { return 'random'; }
}
const gradeName = g => g === 'K' ? 'Kindergarten' : `Grade ${g}`;

/* A sensible grade when none was picked: the Reading Boost reader's grade, else Grade 3 */
function defaultGrade() {
  try {
    const rb = JSON.parse(localStorage.getItem('readingBoost.v1'));
    const p = rb && (rb.profiles[rb.activeId] || Object.values(rb.profiles)[0]);
    if (p && GRADE_WORDS[p.grade]) return String(p.grade);
  } catch (e) { /* ignore */ }
  return '3';
}

function openGames({ source } = {}) {
  const lists = WordLists.all();
  if (!state.currentGrade) state.currentGrade = defaultGrade();
  if (!lists.some(l => l.id === state.currentList)) state.currentList = lists[0]?.id || null;
  state.source = source || state.source || savedSource();
  if (!state.currentList && state.source !== 'random') state.source = 'random';
  renderGamesScreen();
  showScreen('gamesScreen');
}

function setSource(source) {
  state.source = source;
  try { localStorage.setItem(SOURCE_KEY, source); } catch (e) { /* ignore */ }
  renderGamesScreen();
}

function renderGamesScreen() {
  const lists = WordLists.all();
  const list = WordLists.get(state.currentList);
  const grade = state.currentGrade;
  const src = state.source;

  // Chooser buttons
  document.querySelectorAll('.source-btn').forEach(b => {
    const needsList = b.dataset.source !== 'random';
    b.disabled = needsList && !lists.length;
    b.classList.toggle('on', b.dataset.source === src);
    b.setAttribute('aria-checked', b.dataset.source === src);
  });
  const listSel = document.getElementById('sourceList');
  listSel.innerHTML = lists.map(l => `<option value="${l.id}">${escapeHtml(l.name)} (${l.words.length})</option>`).join('');
  if (list) listSel.value = list.id;
  document.getElementById('sourceGrade').value = grade;
  document.getElementById('sourceListWrap').hidden = src === 'random';
  document.getElementById('sourceGradeWrap').hidden = src === 'list';
  document.getElementById('sourceHint').innerHTML = !lists.length
    ? 'Want to practice your own words? <button type="button" class="link-inline" id="makeListLink">Make a word list</button>'
    : src === 'mixed' ? `All ${list.words.length} words from "${escapeHtml(list.name)}", mixed with random ${gradeName(grade)} words.`
    : src === 'list' ? `All ${list.words.length} words on "${escapeHtml(list.name)}" are practiced — no limit.`
    : `Random ${gradeName(grade)} words, different every time.`;
  document.getElementById('makeListLink')?.addEventListener('click', openListsScreen);

  // Title and intro
  document.getElementById('gradeTitle').textContent =
    src === 'list' ? `${list.name} — Choose a Game`
    : src === 'mixed' ? `${list.name} + ${gradeName(grade)}`
    : `${gradeName(grade)} — Choose a Game`;
  document.querySelector('#gamesScreen .screen-sub').textContent =
    src === 'list' ? `Your ${list.words.length} words are ready. Pick a game!`
    : src === 'mixed' ? 'Your words and new grade-level words, mixed together. Pick a game!'
    : `${gradeName(grade)} spelling words are ready. Pick a game!`;

  // Fresh internet words only apply to the random grade-level words
  document.querySelector('.online-bar').hidden = src === 'list';
  if (src !== 'list') fetchOnlineWords(grade);

  // Every game works with any source; a list just needs enough words
  const entries = list ? listEntries(list) : [];
  document.querySelectorAll('.game-sel-card').forEach(card => {
    const game = card.dataset.game;
    const need = GAME_NEEDS[game];
    const enough = need.gradeOnly || src !== 'list' || listRoundsFor(game, entries).length >= need.min;
    card.classList.toggle('gsc-disabled', !enough);
    // Show how many words this game will use
    const countEl = card.querySelectorAll('.gsc-info span')[1];
    if (countEl) {
      countEl.dataset.default ??= countEl.textContent;
      const n = src !== 'random' && !need.gradeOnly ? listRoundsFor(game, entries).length : 0;
      countEl.textContent = !n ? countEl.dataset.default
        : src === 'list' ? `📋 All ${n} word${n === 1 ? '' : 's'}`
        : `📋 Your ${n} + random`;
    }
    card.querySelector('.gsc-note')?.remove();
    if (!enough) card.insertAdjacentHTML('beforeend', `<div class="gsc-note">Add at least ${need.min} words to this list in My Word Lists</div>`);
  });
}

document.querySelectorAll('.source-btn').forEach(b => b.addEventListener('click', () => setSource(b.dataset.source)));
document.getElementById('sourceList').addEventListener('change', e => { state.currentList = e.target.value; renderGamesScreen(); });
document.getElementById('sourceGrade').addEventListener('change', e => { state.currentGrade = e.target.value; renderGamesScreen(); });

/* The words for one round of a game, from a grade or a grown-up's list */
function wordsForGame(game) {
  if (game === 'think' || game === 'infer') {
    return Comprehension.pick(Comprehension.bandFor(state.currentGrade), 8, game === 'infer' ? 'infer' : null);
  }
  const list = state.source !== 'random' ? WordLists.get(state.currentList) : null;
  const listRounds = list ? shuffle(listRoundsFor(game, listEntries(list))) : [];
  if (state.source === 'list' && list) {
    state.distractorPool = list.words.map(w => w.word);
    // Every word on the list gets practiced, however long the list is
    return listRounds;
  }
  const gradeWords = buildWordSet(state.currentGrade);
  if (state.source === 'mixed' && list) {
    // Every word from the list, plus random grade-level words mixed in
    const mine = listRounds;
    const taken = new Set(mine.map(w => w.word.toLowerCase()));
    const others = gradeWords.filter(w => !taken.has(w.word.toLowerCase())).slice(0, Math.max(4, mine.length));
    state.distractorPool = [...list.words.map(w => w.word), ...others.map(w => w.word)];
    return shuffle([...mine, ...others]);
  }
  state.distractorPool = null;
  return gradeWords;
}

/* ===== GAME CARDS ===== */
document.querySelectorAll('.game-sel-card').forEach(card => {
  card.addEventListener('click', () => {
    if (!state.currentGrade) state.currentGrade = defaultGrade();
    if (card.classList.contains('gsc-disabled')) { showToast('Add a few more words to this list first.'); return; }
    state.currentGame = card.dataset.game;
    state.words = wordsForGame(card.dataset.game);
    startGame(card.dataset.game);
  });
});

/* ===== RESULT BUTTONS ===== */
document.getElementById('playAgainBtn').addEventListener('click', () => {
  state.words = wordsForGame(state.currentGame);
  startGame(state.currentGame);
});
document.getElementById('chooseGameBtn').addEventListener('click', () => showScreen('gamesScreen'));
document.getElementById('homeBtn').addEventListener('click', () => showScreen('homeScreen'));

/* ===================================================================
   GAME INITIALIZATION
   =================================================================== */
function startGame(game) {
  state.score = 0;
  state.round = 0;
  state.total = state.words.length;

  const gameLabel = { match: '🔗 Word Match', context: '🔍 Context Clues', missing: '✏️ Missing Words', spell: '🎧 Spell It',
    sing: '🎵 Spell to Music',
    think: '🧠 Read & Think', infer: '🕵️ Inference Detective' };
  document.getElementById('gameTitle').textContent = gameLabel[game] || game;

  updateScoreDisplay();
  setProgress(0);

  const resultArea = document.getElementById('resultArea');
  const gameArea   = document.getElementById('gameArea');
  resultArea.classList.add('hidden');
  gameArea.style.display = 'block';
  gameArea.innerHTML = '';

  showScreen('practiceScreen');

  if (game === 'match')   buildMatchGame();
  if (game === 'context') buildContextRound();
  if (game === 'missing') buildMissingRound();
  if (game === 'spell')   buildSpellRound();
  if (game === 'sing')    buildSingGame();
  if (game === 'think' || game === 'infer') buildThinkRound();
}

/* ===================================================================
   READ & THINK / INFERENCE DETECTIVE — short comprehension texts
   (exercises and the player live in comprehension.js)
   =================================================================== */
function buildThinkRound() {
  if (state.round >= state.words.length) { showResult(); return; }
  setProgress(state.round / state.words.length);
  const item = state.words[state.round];
  const area = document.getElementById('gameArea');
  area.innerHTML = `<div class="think-card">
      <div class="round-label">${state.currentGame === 'infer' ? '🕵️ Case' : '🧠 Round'} ${state.round + 1} of ${state.words.length}</div>
      <div id="thinkBody"></div>
    </div>`;
  const isLast = state.round === state.words.length - 1;
  Comprehension.render(document.getElementById('thinkBody'), item, {
    speak: speakText,
    older: ['6', '7', '8'].includes(String(state.currentGrade)),
    nextLabel: isLast ? '🏆 See Results' : 'Next →',
    onDone: ok => {
      if (ok) {
        state.score++;
        updateScoreDisplay();
        showToast('✅ Great thinking!', 'correct');
      }
      state.round++;
      buildThinkRound();
    },
  });
}

/* ===================================================================
   UTILITIES
   =================================================================== */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function updateScoreDisplay() {
  document.getElementById('scoreDisplay').textContent = state.score;
  document.getElementById('totalDisplay').textContent = state.total;
}

function setProgress(fraction) {
  const pct = Math.min(100, Math.round(fraction * 100));
  document.getElementById('progressBar').style.width = `${pct}%`;

  // Move the bee along the track
  const bee = document.getElementById('progressBee');
  if (bee) {
    bee.style.left = `calc(${pct}% )`;
  }
}

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ` toast-${type}` : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 1800);
}

function showScorePop(text, x, y) {
  const el = document.createElement('div');
  el.className = 'score-pop';
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top  = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

/* ===================================================================
   CONFETTI
   =================================================================== */
function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  const colors = ['#FFD60A','#FF9500','#FF6B35','#00C897','#4B7BEC','#8854D0','#E84393','#EF476F'];
  const count = 90;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left        = `${Math.random() * 100}%`;
    piece.style.width       = `${6 + Math.random() * 10}px`;
    piece.style.height      = `${6 + Math.random() * 10}px`;
    piece.style.background  = colors[Math.floor(Math.random() * colors.length)];
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
    piece.style.animationDuration  = `${1.8 + Math.random() * 2.4}s`;
    piece.style.animationDelay     = `${Math.random() * 0.8}s`;
    container.appendChild(piece);
  }
  setTimeout(() => { container.innerHTML = ''; }, 5000);
}

/* ===================================================================
   MATCH GAME
   =================================================================== */
/* Long lists are matched a few pairs at a time, so the screen stays easy to read */
const MATCH_SET = 8;
function buildMatchGame(start = 0) {
  const all = state.words;
  const sets = Math.ceil(all.length / MATCH_SET);
  const size = Math.ceil(all.length / sets);          // even sets, e.g. 20 words -> 7, 7, 6
  const words = all.slice(start, start + size);
  const setNo = Math.floor(start / size) + 1;
  state.matchState = { selectedWord: null, selectedDef: null, matched: new Set(), start, size: words.length, last: start + words.length >= all.length };

  // Plain list words have no meaning to match, so the child matches the word they HEAR
  const anyAudio = words.some(w => !w.definition);
  const wordItems = shuffle(words.map((w, i) => ({ id: start + i, label: escapeHtml(w.word) + webBadge(w) })));
  const defItems  = shuffle(words.map((w, i) => ({ id: start + i, audio: !w.definition,
    label: w.definition ? escapeHtml(w.definition) : '<span class="match-listen">🔊 Listen</span>' })));

  document.getElementById('gameArea').innerHTML = `
    ${sets > 1 ? `<div class="round-label">🔗 Set ${setNo} of ${sets}</div>` : ''}
    <p class="match-intro">🐝 Click a <strong>word</strong> on the left, then click its <strong>match</strong> on the right!${
      anyAudio ? ' Tap 🔊 to hear a word.' : ''}</p>
    <div class="match-grid">
      <div>
        <div class="match-col-label">📝 Words</div>
        ${wordItems.map(w => `<div class="match-item" data-id="${w.id}" data-type="word" tabindex="0" role="button">${w.label}</div>`).join('')}
      </div>
      <div>
        <div class="match-col-label">${anyAudio ? (words.every(w => !w.definition) ? '🔊 Spoken words' : '📖 Meanings & 🔊 spoken words') : '📖 Definitions'}</div>
        ${defItems.map(d => `<div class="match-item ${d.audio ? 'audio' : ''}" data-id="${d.id}" data-type="def" tabindex="0" role="button">${d.label}</div>`).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.match-item').forEach(el => {
    el.addEventListener('click', handleMatchClick);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
  });
}

function handleMatchClick(e) {
  const el   = e.currentTarget;
  const ms   = state.matchState;
  const type = el.dataset.type;

  if (el.classList.contains('matched') || el.classList.contains('wrong-flash')) return;

  if (type === 'word') {
    if (ms.selectedWord) ms.selectedWord.classList.remove('selected');
    ms.selectedWord = el;
    el.classList.add('selected');
  } else {
    if (el.classList.contains('audio')) speakText(state.words[+el.dataset.id].word);
    if (ms.selectedDef) ms.selectedDef.classList.remove('selected');
    ms.selectedDef = el;
    el.classList.add('selected');
  }

  if (ms.selectedWord && ms.selectedDef) {
    const wEl = ms.selectedWord;
    const dEl = ms.selectedDef;

    if (wEl.dataset.id === dEl.dataset.id) {
      // Correct match
      wEl.classList.remove('selected');
      dEl.classList.remove('selected');
      wEl.classList.add('matched');
      dEl.classList.add('matched');
      wEl.innerHTML += ' ✓';
      ms.matched.add(wEl.dataset.id);
      ms.selectedWord = null;
      ms.selectedDef  = null;

      state.score++;
      updateScoreDisplay();
      setProgress((ms.start + ms.matched.size) / state.words.length);
      showToast('✅ Match! Well done!', 'correct');

      const rect = wEl.getBoundingClientRect();
      showScorePop('+1 ⭐', rect.left + rect.width / 2, rect.top + window.scrollY);

      if (ms.matched.size === ms.size) {
        if (ms.last) setTimeout(showResult, 700);
        else {
          setTimeout(() => showToast('🎉 Set done! Here come more words…', 'correct'), 500);
          setTimeout(() => buildMatchGame(ms.start + ms.size), 1300);
        }
      }
    } else {
      // Wrong match
      wEl.classList.remove('selected');
      dEl.classList.remove('selected');
      wEl.classList.add('wrong-flash');
      dEl.classList.add('wrong-flash');
      showToast('❌ Not a match — try again!', 'wrong');

      setTimeout(() => {
        wEl.classList.remove('wrong-flash');
        dEl.classList.remove('wrong-flash');
      }, 620);
      ms.selectedWord = null;
      ms.selectedDef  = null;
    }
  }
}

/* ===================================================================
   CONTEXT CLUES GAME
   =================================================================== */
function buildContextRound() {
  if (state.round >= state.words.length) { showResult(); return; }

  const w = state.words[state.round];
  setProgress(state.round / state.words.length);

  const sentenceHighlighted = w.spellingCheck
    ? `<button class="spell-hear" id="hearCtx">🔊 Hear the word</button>${w.definition ? `<p class="spell-meaning">💡 ${escapeHtml(w.definition)}</p>` : ''}`
    : w.contextSentence.replace(
      new RegExp(`\\b${escapeRegex(w.word)}\\b`, 'i'),
      match => `<span class="highlight-word">${match}</span>`
    );

  const choicesHtml = w.contextChoices.map((text, i) => `
    <button class="choice-btn" data-index="${i}" data-correct="${i === w.contextAnswer}">
      <span class="choice-letter">${String.fromCharCode(65 + i)}</span>
      <span>${text}</span>
    </button>
  `).join('');

  document.getElementById('gameArea').innerHTML = `
    <div class="context-card">
      <div class="round-label">🔍 Round ${state.round + 1} of ${state.words.length}${roundTag(w)}</div>
      <div class="context-sentence-box ${w.spellingCheck ? 'spelling-check' : ''}">${sentenceHighlighted}</div>
      <div class="context-question">${w.contextQuestion}</div>
      <div class="context-choices">${choicesHtml}</div>
      <div class="feedback-box" id="ctxFeedback"></div>
    </div>
  `;

  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', handleContextChoice);
  });
  if (w.spellingCheck) {
    document.getElementById('hearCtx').addEventListener('click', () => speakText(w.word));
    setTimeout(() => speakText(w.word), 300);
  }
}

function handleContextChoice(e) {
  const btn       = e.currentTarget;
  const isCorrect = btn.dataset.correct === 'true';
  const w         = state.words[state.round];

  document.querySelectorAll('.choice-btn').forEach(b => {
    b.disabled = true;
    if (b.dataset.correct === 'true') b.classList.add('correct');
  });

  if (isCorrect) {
    btn.classList.add('correct');
    state.score++;
    updateScoreDisplay();
    showToast('🎉 Correct! Great job!', 'correct');
    document.getElementById('ctxFeedback').innerHTML = `
      <span class="feedback-text correct">🎉 That's right! Great job!</span>
    `;
  } else {
    btn.classList.add('incorrect');
    showToast('❌ Not quite — keep going!', 'wrong');
    document.getElementById('ctxFeedback').innerHTML = `
      <span class="feedback-text wrong">❌ The answer is: "${w.contextChoices[w.contextAnswer]}"</span>
    `;
  }

  state.round++;
  const isLast = state.round >= state.words.length;
  document.getElementById('ctxFeedback').innerHTML += `
    <button class="next-btn" id="nextCtxBtn">${isLast ? '🏆 See Results' : 'Next Question →'}</button>
  `;
  document.getElementById('nextCtxBtn').addEventListener('click', buildContextRound);
}

/* ===================================================================
   MISSING WORDS GAME
   =================================================================== */
function buildMissingRound() {
  if (state.round >= state.words.length) { showResult(); return; }
  if (state.words[state.round].letterGap) { buildLetterGapRound(); return; }

  const w           = state.words[state.round];
  const distractors = getDistractors(state.words, state.round, 3);
  const choices     = shuffle([w.word, ...distractors]);

  setProgress(state.round / state.words.length);

  const sentenceHtml = w.sentence.replace(
    '___',
    '<span class="missing-blank">_____</span>'
  );

  document.getElementById('gameArea').innerHTML = `
    <div class="missing-card">
      <div class="round-label">✏️ Round ${state.round + 1} of ${state.words.length}${roundTag(w)}</div>
      <div class="missing-sentence">${sentenceHtml}</div>
      <div class="word-choices">
        ${choices.map(c => `<button class="word-chip" data-word="${c}">${c}</button>`).join('')}
      </div>
      <div class="feedback-box" id="msFeedback"></div>
    </div>
  `;

  document.querySelectorAll('.word-chip').forEach(btn => {
    btn.addEventListener('click', handleMissingChoice);
  });
}

function handleMissingChoice(e) {
  const btn    = e.currentTarget;
  const chosen = btn.dataset.word;
  const correct = state.words[state.round].word;

  document.querySelectorAll('.word-chip').forEach(b => {
    b.disabled = true;
    if (b.dataset.word === correct) b.classList.add('correct');
  });

  if (chosen === correct) {
    btn.classList.add('correct');
    state.score++;
    updateScoreDisplay();
    showToast(`✅ "${correct}" is right!`, 'correct');
    document.getElementById('msFeedback').innerHTML = `
      <span class="feedback-text correct">🎉 Correct! "${correct}" fits perfectly!</span>
    `;
    const rect = btn.getBoundingClientRect();
    showScorePop('+1 ⭐', rect.left + rect.width / 2, rect.top + window.scrollY - 10);
  } else {
    btn.classList.add('incorrect');
    showToast(`❌ The answer is "${correct}"`, 'wrong');
    document.getElementById('msFeedback').innerHTML = `
      <span class="feedback-text wrong">❌ The correct word is "${correct}"</span>
    `;
  }

  state.round++;
  const isLast = state.round >= state.words.length;
  document.getElementById('msFeedback').innerHTML += `
    <button class="next-btn" id="nextMsBtn">${isLast ? '🏆 See Results' : 'Next Sentence →'}</button>
  `;
  document.getElementById('nextMsBtn').addEventListener('click', buildMissingRound);
}

/* Missing letters: "fr__nd" → pick "ie" (for list words without a sentence) */
function buildLetterGapRound() {
  const w = state.words[state.round];
  const gap = w.letterGap;
  setProgress(state.round / state.words.length);
  document.getElementById('gameArea').innerHTML = `
    <div class="missing-card">
      <div class="round-label">✏️ Round ${state.round + 1} of ${state.words.length}${roundTag(w)}</div>
      <p class="letter-gap-prompt">Which letters are missing? <button class="spell-hint" id="hearGap">🔊 Hear the word</button></p>
      <div class="missing-sentence letter-gap">${escapeHtml(gap.shown).replace(/_+/, m => `<span class="missing-blank">${'_'.repeat(m.length)}</span>`)}</div>
      <div class="word-choices">
        ${gap.choices.map(c => `<button class="word-chip" data-chunk="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}
      </div>
      <div class="feedback-box" id="msFeedback"></div>
    </div>`;
  document.getElementById('hearGap').addEventListener('click', () => speakText(w.word));
  setTimeout(() => speakText(w.word), 300);
  document.querySelectorAll('.word-chip').forEach(btn => btn.addEventListener('click', () => {
    const right = btn.dataset.chunk === gap.answer;
    document.querySelectorAll('.word-chip').forEach(b => {
      b.disabled = true;
      if (b.dataset.chunk === gap.answer) b.classList.add('correct');
    });
    document.querySelector('.letter-gap').textContent = w.word;
    if (right) {
      btn.classList.add('correct');
      state.score++;
      updateScoreDisplay();
      showToast(`✅ "${w.word}" is right!`, 'correct');
    } else {
      btn.classList.add('incorrect');
      showToast(`❌ It's spelled "${w.word}"`, 'wrong');
    }
    document.getElementById('msFeedback').innerHTML = `<span class="feedback-text ${right ? 'correct' : 'wrong'}">${
      right ? `🎉 Yes! ${escapeHtml(w.word)}` : `The missing letters are "${escapeHtml(gap.answer)}": ${escapeHtml(w.word)}`}</span>`;
    speakText(w.word);
    state.round++;
    const isLast = state.round >= state.words.length;
    document.getElementById('msFeedback').innerHTML += `<button class="next-btn" id="nextMsBtn">${isLast ? '🏆 See Results' : 'Next Word →'}</button>`;
    document.getElementById('nextMsBtn').addEventListener('click', buildMissingRound);
  }));
}

function getDistractors(words, currentIdx, count) {
  // Lists can be short, so draw from the whole list (and built-in words as a last resort)
  const answer = words[currentIdx].word;
  let pool = (state.distractorPool || words.map(w => w.word)).filter(w => w !== answer);
  if (pool.length < count) {
    pool = [...pool, ...shuffle(Object.values(GRADE_WORDS).flat().map(w => w.word))
      .filter(w => w !== answer && !pool.includes(w))];
  }
  return shuffle([...new Set(pool)]).slice(0, count);
}

/* ===================================================================
   SPELL IT GAME — hear the word, build it from letter tiles
   Works with any word, so it's the go-to game for weekly spelling lists.
   =================================================================== */
function speakText(text, rate = 0.8) {
  if (!window.speechSynthesis || !text) return;
  const busy = speechSynthesis.speaking || speechSynthesis.pending;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  try { if (preferredVoice) u.voice = preferredVoice; } catch (e) { /* use the default voice */ }
  u.rate = rate;
  // Chrome can drop speech that starts right after cancel(), so give it a moment
  setTimeout(() => { if (speechSynthesis.paused) speechSynthesis.resume(); speechSynthesis.speak(u); }, busy ? 80 : 0);
}

function buildSpellRound() {
  if (state.round >= state.words.length) { showResult(); return; }
  const w = state.words[state.round];
  setProgress(state.round / state.words.length);

  const target = w.word.toLowerCase().split('');
  // Only the letters in the word, scrambled (never already in the right order)
  let bank = shuffle([...target]);
  for (let tries = 0; tries < 10 && target.length > 1 && bank.join('') === target.join(''); tries++) bank = shuffle([...target]);
  state.spell = { target, built: [], tries: 0, done: false };

  document.getElementById('gameArea').innerHTML = `
    <div class="missing-card spell-card">
      <div class="round-label">🎧 Round ${state.round + 1} of ${state.words.length}${roundTag(w)}</div>
      <div class="spell-listen">
        <button class="spell-hear" id="spellHear">🔊 Hear the word</button>
        <button class="spell-hint" id="spellSentence">💬 Hear it in a sentence</button>
        <button class="spell-hint meaning" id="spellMeaning">📖 Hear the meaning</button>
      </div>
      <p class="spell-sentence" id="spellMeaningText" hidden></p>
      <p class="spell-sentence" id="spellSentenceText" hidden></p>
      <div class="spell-slots" id="spellSlots">${target.map(() => '<span class="spell-slot"></span>').join('')}</div>
      <div class="spell-bank" id="spellBank">${bank.map((t, k) =>
        `<button class="spell-tile" data-k="${k}" data-t="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('')}</div>
      <div class="spell-actions">
        <button class="btn-outline" id="spellUndo">⌫ Undo</button>
        <button class="btn-primary" id="spellCheck">✔ Check</button>
      </div>
      <div class="feedback-box" id="spFeedback"></div>
    </div>`;

  const hear = () => speakText(w.word);
  document.getElementById('spellHear').addEventListener('click', hear);
  document.getElementById('spellSentence').addEventListener('click', () => sayInSentence(w));
  document.getElementById('spellMeaning').addEventListener('click', () => sayMeaning(w));
  document.querySelectorAll('.spell-tile').forEach(t => t.addEventListener('click', () => addSpellTile(t)));
  document.getElementById('spellUndo').addEventListener('click', undoSpellTile);
  document.getElementById('spellCheck').addEventListener('click', checkSpelling);
  setTimeout(hear, 300);
}

/* ===================================================================
   SPELL TO MUSIC — tap a word and hear it spelled out loud
   A soft music loop plays underneath while the letters are SPOKEN in a
   normal voice (not sung), one at a time, then the whole word is read.
   =================================================================== */
const SING_TUNES = {
  // Scale steps: 0 = C, 1 = D, 2 = E … 7 = high C, 8 = high D
  cheer:   { name: '📣 Cheer',   steps: [0, 2, 4, 7, 4, 2, 4, 7] },
  twinkle: { name: '⭐ Twinkle', steps: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0] },
  bingo:   { name: '🐶 B-I-N-G-O', steps: [5, 5, 6, 6, 7, 4, 4, 5, 5, 6] },
};
const SCALE_HZ = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33];
const SING_SPEED = { slow: { gap: 350, rate: 0.8, beat: 0.5 }, normal: { gap: 150, rate: 1, beat: 0.36 } };
const sing = { tune: 'cheer', speed: 'slow', token: 0, sung: new Set(), audio: null };

/* ---------- Background music (Web Audio, nothing to download) ---------- */
function audioCtx() {
  try {
    sing.audio = sing.audio || new (window.AudioContext || window.webkitAudioContext)();
    if (sing.audio.state === 'suspended') sing.audio.resume();
    return sing.audio;
  } catch (e) { return null; }
}
function playNote(ctx, out, hz, t, len, vol, type) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  g.connect(out);
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = hz;
  o.connect(g);
  o.start(t);
  o.stop(t + len + 0.05);
}
const backing = { timer: null, out: null };
/* Loops the chosen tune quietly (melody + a soft bass) so the voice is easy to hear over it */
function startBacking() {
  stopBacking();
  const ctx = audioCtx();
  if (!ctx) return;
  const steps = SING_TUNES[sing.tune].steps;
  const beat = SING_SPEED[sing.speed].beat;
  const out = ctx.createGain();
  out.gain.value = 0.55;
  out.connect(ctx.destination);
  backing.out = out;
  let next = ctx.currentTime + 0.05, i = 0;
  const schedule = () => {
    while (next < ctx.currentTime + 0.4) {
      playNote(ctx, out, SCALE_HZ[steps[i % steps.length]], next, beat * 0.9, 0.09, 'triangle');
      if (i % 2 === 0) playNote(ctx, out, SCALE_HZ[i % 4 === 0 ? 0 : 4] / 2, next, beat * 1.8, 0.1, 'sine');
      next += beat;
      i++;
    }
  };
  schedule();
  backing.timer = setInterval(schedule, 100);
}
function stopBacking() {
  clearInterval(backing.timer);
  backing.timer = null;
  const out = backing.out;
  backing.out = null;
  if (!out || !sing.audio) return;
  try {
    const t = sing.audio.currentTime;
    out.gain.setValueAtTime(out.gain.value, t);
    out.gain.linearRampToValueAtTime(0, t + 0.3);
    setTimeout(() => out.disconnect(), 800);
  } catch (e) { /* already gone */ }
}
function stopSpelling() {
  sing.token++;
  stopBacking();
  if (window.speechSynthesis) speechSynthesis.cancel();
}

/* Say one piece in a normal voice; resolves when it's done (or after a safe wait).
   The letter lights up the moment the voice starts saying it. */
function sayPart(text, rate, onStart) {
  return new Promise(resolve => {
    let started = false, finished = false;
    const start = () => { if (!started) { started = true; onStart?.(); } };
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(lateStart);
      clearTimeout(giveUp);
      start();
      resolve();
    };
    const lateStart = setTimeout(start, 900);    // voice hasn't begun: light the letter anyway
    const giveUp = setTimeout(finish, 4000);     // voice never finished: move on
    if (!window.speechSynthesis) { start(); setTimeout(finish, 650); return; }
    const u = new SpeechSynthesisUtterance(text);
    try { if (preferredVoice) u.voice = preferredVoice; } catch (e) { /* use the default voice */ }
    u.lang = 'en-US';
    u.rate = rate;
    u.onstart = start;
    u.onend = finish;
    u.onerror = finish;
    if (speechSynthesis.paused) speechSynthesis.resume();
    speechSynthesis.speak(u);
  });
}
function singHasVoice() {
  return !!window.speechSynthesis && speechSynthesis.getVoices().length > 0;
}
const pause = ms => new Promise(r => setTimeout(r, ms));

async function singWord(w, btn) {
  const my = ++sing.token;
  // Phones only allow sound that starts inside the tap, so the music and the first
  // letter start right away. Only wait when other speech has to be stopped first.
  audioCtx();
  if (window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)) {
    speechSynthesis.cancel();
    await pause(120);                // Chrome drops speech that starts right after cancel()
    if (my !== sing.token) return;
  }
  const speed = SING_SPEED[sing.speed];
  const letters = [...w.word];
  const stage = document.getElementById('singNow');
  document.querySelectorAll('.sing-word').forEach(b => b.classList.toggle('singing', b === btn));
  stage.innerHTML = `<div class="sing-letters">${letters.map(ch =>
    `<span class="sing-letter ${/[a-z]/i.test(ch) ? '' : 'mark'}">${escapeHtml(ch.toUpperCase())}</span>`).join('')}</div>
    <div class="sing-full" aria-live="polite"></div>`;
  const tiles = [...stage.querySelectorAll('.sing-letter')];
  startBacking();
  for (let i = 0; i < letters.length; i++) {
    if (my !== sing.token) return;
    const ch = letters[i];
    if (!/[a-z]/i.test(ch)) { tiles[i].classList.add('lit'); continue; }   // apostrophes and hyphens are shown, not said
    // Say the letter itself, as a capital, so the voice uses its real name
    await sayPart(letterName(ch), speed.rate, () => {
      if (my !== sing.token) return;
      tiles.forEach(t => t.classList.remove('now'));
      tiles[i].classList.add('lit', 'now');
    });
    if (my !== sing.token) return;
    await pause(speed.gap);
  }
  if (my !== sing.token) return;
  await sayPart(w.word, speed.rate * 0.9, () => {
    if (my !== sing.token) return;
    tiles.forEach(t => t.classList.remove('now'));
    stage.querySelector('.sing-letters').classList.add('done');
    stage.querySelector('.sing-full').textContent = w.word;
  });
  if (my !== sing.token) return;
  stopBacking();
  btn.classList.remove('singing');
  if (!sing.sung.has(w.word)) {
    sing.sung.add(w.word);
    btn.classList.add('sung');
    btn.querySelector('.sing-check').textContent = '✓';
    state.score = sing.sung.size;
    updateScoreDisplay();
    setProgress(sing.sung.size / state.words.length);
    if (sing.sung.size === state.words.length) {
      showToast('🎉 You heard every word!', 'correct');
      document.getElementById('singDone').classList.add('ready');
    }
  }
}

function buildSingGame() {
  sing.sung = new Set();
  stopSpelling();
  const words = state.words;
  document.getElementById('gameArea').innerHTML = `
    <div class="sing-card">
      <p class="match-intro">🎵 Tap a word to hear it spelled out loud over the music. Say the letters with me!</p>
      <div class="sing-controls">
        <div class="sing-group" role="radiogroup" aria-label="Music">
          ${Object.entries(SING_TUNES).map(([id, t]) =>
            `<button type="button" class="sing-opt ${id === sing.tune ? 'on' : ''}" data-tune="${id}" role="radio" aria-checked="${id === sing.tune}">${t.name}</button>`).join('')}
        </div>
        <div class="sing-group" role="radiogroup" aria-label="Speed">
          <button type="button" class="sing-opt ${sing.speed === 'slow' ? 'on' : ''}" data-speed="slow" role="radio" aria-checked="${sing.speed === 'slow'}">🐢 Slow</button>
          <button type="button" class="sing-opt ${sing.speed === 'normal' ? 'on' : ''}" data-speed="normal" role="radio" aria-checked="${sing.speed === 'normal'}">🐇 Normal</button>
        </div>
        <button type="button" class="btn-primary sing-all" id="singAll">🎵 Spell them all</button>
      </div>
      <p class="sing-novoice" id="singNoVoice" hidden>🔇 We can't find a speaking voice on this device, so you may only hear the music. Turn up the volume, check that text-to-speech is on, or try another browser.</p>
      <div class="sing-now" id="singNow"><p class="sing-placeholder">Pick a word below 👇</p></div>
      <div class="sing-grid">${words.map((w, i) =>
        `<button type="button" class="sing-word" data-i="${i}"><span class="sing-check" aria-hidden="true">♪</span>${escapeHtml(w.word)}${webBadge(w)}</button>`).join('')}</div>
      <button type="button" class="next-btn" id="singDone">🏆 I'm done</button>
    </div>`;

  document.querySelectorAll('.sing-word').forEach(b => b.addEventListener('click', () => singWord(words[+b.dataset.i], b)));
  // Voices can load a few seconds after the page; only warn if there are still none
  setTimeout(() => {
    const note = document.getElementById('singNoVoice');
    if (note) note.hidden = singHasVoice();
  }, 3000);
  document.querySelectorAll('[data-tune]').forEach(b => b.addEventListener('click', () => {
    sing.tune = b.dataset.tune;
    document.querySelectorAll('[data-tune]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
  }));
  document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => {
    sing.speed = b.dataset.speed;
    document.querySelectorAll('[data-speed]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
  }));
  document.getElementById('singAll').addEventListener('click', async () => {
    let expected = sing.token + 1;
    for (const b of document.querySelectorAll('.sing-word')) {
      await singWord(words[+b.dataset.i], b);       // each word moves the token on by one
      if (sing.token !== expected) return;          // a tap or "done" took over
      expected++;
      await pause(500);
      if (sing.token !== expected - 1) return;
    }
  });
  document.getElementById('singDone').addEventListener('click', () => {
    stopSpelling();
    showResult();
  });
}

/* ---------- "Hear it in a sentence" and "Hear the meaning" for every word ----------
   The sentence is read word, sentence, word, the way spelling tests are given.
   Both come from the word itself, the built-in grade words, what was found
   earlier on this device, or one quick lookup (online dictionary, or Claude on
   claude.ai) that brings back the meaning and a sentence together. */
const SENTENCE_KEY = 'spellinghive.sentences';
const MEANING_KEY = 'spellinghive.meanings';
function readCache(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
}
function remember(key, word, text) {
  const cache = readCache(key);
  cache[word.toLowerCase()] = text;
  try { localStorage.setItem(key, JSON.stringify(cache)); } catch (e) { /* ignore */ }
}
function builtInWord(word) {
  const key = word.toLowerCase();
  for (const grade of Object.values(GRADE_WORDS)) {
    const hit = grade.find(e => e.word.toLowerCase() === key);
    if (hit) return hit;
  }
  return null;
}
function knownSentence(w) {
  return w.contextSentence || builtInWord(w.word)?.contextSentence || readCache(SENTENCE_KEY)[w.word.toLowerCase()] || null;
}
function knownMeaning(w) {
  return w.definition || builtInWord(w.word)?.definition || readCache(MEANING_KEY)[w.word.toLowerCase()] || null;
}
const wordRegex = word => new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');

/* One lookup fills in both the meaning and the sentence */
async function lookUpWord(w, btn, busyLabel) {
  if (typeof OnlineWords === 'undefined') return;
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = busyLabel;
  try {
    const found = await OnlineWords.within(OnlineWords.describeWords([w.word]), 15000, {});
    const info = found[w.word];
    if (info?.definition) remember(MEANING_KEY, w.word, info.definition);
    if (info?.example && wordRegex(w.word).test(info.example)) remember(SENTENCE_KEY, w.word, info.example);
  } catch (e) { /* nothing found */ }
  btn.disabled = false;
  btn.textContent = label;
}

function showHelp(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.hidden = false;
}

async function sayInSentence(w) {
  const btn = document.getElementById('spellSentence');
  if (!knownSentence(w)) await lookUpWord(w, btn, '⏳ Finding a sentence…');
  // The player may have moved on to another word while we looked
  if (!document.body.contains(btn)) return;
  const sentence = knownSentence(w);
  if (sentence) {
    // On screen the word is blanked out, so the sentence helps without giving the spelling away
    showHelp('spellSentenceText', '💬 ' + sentence.replace(wordRegex(w.word), '_____'));
    speakText(`${w.word}. ${sentence} ${w.word}.`, 0.8);
  } else {
    showToast('No sentence found for this word, so here it is again.');
    speakText(`The word is ${w.word}. Spell ${w.word}.`, 0.8);
  }
}

async function sayMeaning(w) {
  const btn = document.getElementById('spellMeaning');
  if (!knownMeaning(w)) await lookUpWord(w, btn, '⏳ Finding the meaning…');
  if (!document.body.contains(btn)) return;
  const meaning = knownMeaning(w);
  if (meaning) {
    const text = meaning.replace(/\.$/, '');
    showHelp('spellMeaningText', '📖 ' + text.replace(wordRegex(w.word), '_____'));
    speakText(`${w.word}. ${w.word} means: ${text}.`, 0.8);
  } else {
    showToast('No meaning found for this word, so here it is again.');
    speakText(`The word is ${w.word}. Spell ${w.word}.`, 0.8);
  }
}

function paintSpellSlots() {
  document.querySelectorAll('#spellSlots .spell-slot').forEach((s, k) => {
    s.textContent = state.spell.built[k]?.dataset.t || '';
    s.classList.toggle('filled', !!state.spell.built[k]);
  });
}
function addSpellTile(tile) {
  const sp = state.spell;
  if (sp.done || tile.disabled || sp.built.length >= sp.target.length) return;
  sp.built.push(tile);
  tile.disabled = true;
  paintSpellSlots();
}
function undoSpellTile() {
  const sp = state.spell;
  if (sp.done) return;
  const last = sp.built.pop();
  if (last) last.disabled = false;
  paintSpellSlots();
}

function checkSpelling() {
  const sp = state.spell;
  if (sp.done) return;
  const w = state.words[state.round];
  const attempt = sp.built.map(t => t.dataset.t).join('');
  const fb = document.getElementById('spFeedback');
  sp.tries++;
  if (attempt === sp.target.join('')) {
    sp.done = true;
    if (sp.tries === 1) { state.score++; updateScoreDisplay(); showToast(`✅ "${w.word}" is right!`, 'correct'); }
    document.getElementById('spellSlots').classList.add('solved');
    fb.innerHTML = `<span class="feedback-text correct">🎉 ${sp.tries === 1 ? 'Perfect spelling!' : 'You got it!'} "${w.word}"</span>`;
    speakText(w.word);
  } else if (sp.tries >= 3) {
    sp.done = true;
    fb.innerHTML = `<span class="feedback-text wrong">The word is spelled <b>${w.word}</b>. Let's practice it again soon!</span>`;
    speakText(`${w.word}. ${spellOut(w.word)}. ${w.word}.`, 0.7);
  } else {
    // Keep the correct start of the word, give the rest back — shows exactly what to fix
    let keep = 0;
    while (keep < sp.built.length && sp.built[keep].dataset.t === sp.target[keep]) keep++;
    sp.built.slice(keep).forEach(t => { t.disabled = false; });
    sp.built = sp.built.slice(0, keep);
    paintSpellSlots();
    fb.innerHTML = `<span class="feedback-text wrong">Almost! ${keep ? `The first ${keep} letter${keep === 1 ? ' is' : 's are'} right. ` : ''}Listen again and try.</span>`;
    speakText(w.word, 0.55);
    return;
  }
  setProgress((state.round + 1) / state.words.length);
  state.round++;
  const isLast = state.round >= state.words.length;
  fb.innerHTML += `<button class="next-btn" id="nextSpBtn">${isLast ? '🏆 See Results' : 'Next Word →'}</button>`;
  document.getElementById('nextSpBtn').addEventListener('click', buildSpellRound);
  document.getElementById('nextSpBtn').focus();
}

/* Typing works too: letter keys pick a tile, Backspace undoes, Enter checks */
document.addEventListener('keydown', e => {
  if (!document.querySelector('.spell-card') || !document.getElementById('practiceScreen').classList.contains('active')) return;
  if (e.ctrlKey || e.metaKey || e.altKey || state.spell?.done) return;
  if (e.key === 'Backspace') { e.preventDefault(); undoSpellTile(); return; }
  if (e.key === 'Enter') { e.preventDefault(); checkSpelling(); return; }
  const tile = /^[a-z'-]$/i.test(e.key) &&
    [...document.querySelectorAll('#spellBank .spell-tile:not(:disabled)')].find(t => t.dataset.t === e.key.toLowerCase());
  if (tile) addSpellTile(tile);
});

/* ===================================================================
   RESULTS
   =================================================================== */
function showResult() {
  document.getElementById('gameArea').style.display = 'none';
  document.getElementById('resultArea').classList.remove('hidden');
  setProgress(1);
  updateScoreDisplay();

  const pct = state.total > 0 ? state.score / state.total : 0;
  let title, message, stars;

  if (pct === 1) {
    title   = '🏆 Perfect Score!';
    message = state.currentGame === 'sing'
      ? `You heard all ${state.total} words spelled! You're a true Spelling Superstar!`
      : `Amazing! You got all ${state.total} correct. You're a true ${{ think: 'Reading Champion', infer: 'Reading Detective' }[state.currentGame] || 'Spelling Champion'}!`;
    stars   = '⭐⭐⭐';
    launchConfetti();
  } else if (pct >= 0.75) {
    title   = '🌟 Awesome Job!';
    message = `You scored ${state.score} out of ${state.total}. Fantastic work — keep buzzing!`;
    stars   = '⭐⭐';
  } else if (pct >= 0.5) {
    title   = '🐝 Good Try!';
    message = `You scored ${state.score} out of ${state.total}. Practice makes perfect — give it another buzz!`;
    stars   = '⭐';
  } else {
    title   = '💪 Keep Practicing!';
    message = `You scored ${state.score} out of ${state.total}. Don't give up — every bee learns to fly!`;
    stars   = '';
  }

  if (state.currentGame === 'sing' && pct < 1) {
    message = `You heard ${state.score} of ${state.total} words spelled. Come back for the rest!`;
  }
  document.getElementById('resultTitle').textContent   = title;
  document.getElementById('resultMessage').textContent = message;
  document.getElementById('resultStars').textContent   = stars;
}

/* ===================================================================
   HELPERS
   =================================================================== */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ===== INIT ===== */
renderHomeLists();
showScreen('homeScreen');
