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
  currentList: null,   // id of a grown-up's word list being played (instead of a grade)
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
    if (btn.dataset.view === 'games') showScreen('gamesScreen');
    if (btn.dataset.view === 'lists') openListsScreen();
  });
});

document.getElementById('logoHome').addEventListener('click', (e) => {
  e.preventDefault();
  showScreen('homeScreen');
});

document.getElementById('backFromGames').addEventListener('click', () => showScreen('homeScreen'));
document.getElementById('backFromLists').addEventListener('click', () => { renderHomeLists(); showScreen('homeScreen'); });
document.getElementById('backFromPractice').addEventListener('click', () => showScreen('gamesScreen'));

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

const webBadge = w => w.source ? ' <span class="web-badge" title="Fresh word from the internet">🌐</span>' : '';

const onlineToggle = document.getElementById('onlineToggle');
onlineToggle.checked = onlineEnabled();
onlineToggle.addEventListener('change', () => {
  try { localStorage.setItem(ONLINE_KEY, onlineToggle.checked ? 'on' : 'off'); } catch (e) { /* ignore */ }
  if (state.currentGrade) fetchOnlineWords(state.currentGrade);
  showOnlineStatus(state.currentGrade);
});

/* ===== GRADE CARDS ===== */
document.querySelectorAll('.grade-card').forEach(card => {
  card.addEventListener('click', () => {
    const grade = card.dataset.grade;
    state.currentGrade = grade;
    state.currentList = null;
    setGameAvailability(null);
    fetchOnlineWords(grade);
    const label = grade === 'K' ? 'Kindergarten' : `Grade ${grade}`;
    document.getElementById('gradeTitle').textContent = `${label} — Choose a Game`;
    document.querySelector('#gamesScreen .screen-sub').textContent =
      `${label} spelling words are loaded! Pick your game.`;
    showScreen('gamesScreen');
  });
});

/* ===================================================================
   GROWN-UPS' WORD LISTS
   A list can be played like a grade. Each game uses the words it can:
   Spell It works with plain words; matching and meaning games need meanings,
   Missing Words needs sentences.
   =================================================================== */
const GAME_NEEDS = {
  match:   { min: 3, ok: w => !!w.definition,      need: 'meanings' },
  context: { min: 3, ok: w => !!w.contextChoices && !!w.contextSentence, need: 'meanings and sentences' },
  missing: { min: 2, ok: w => !!w.sentence,        need: 'sentences' },
  spell:   { min: 1, ok: () => true,               need: 'words' },
  // Comprehension games use reading texts for the chosen grade, not word lists
  think:   { gradeOnly: true },
  infer:   { gradeOnly: true },
};

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
  WordLists.mountEditor(document.getElementById('listEditor'), { onChange: renderHomeLists });
  showScreen('listsScreen');
}

function selectList(id) {
  const list = WordLists.get(id);
  if (!list) { renderHomeLists(); return; }
  state.currentList = id;
  state.currentGrade = null;
  document.getElementById('gradeTitle').textContent = `${list.name} — Choose a Game`;
  document.querySelector('#gamesScreen .screen-sub').textContent =
    `Your ${list.words.length} words are loaded! Pick your game.`;
  setGameAvailability(listEntries(list));
  showScreen('gamesScreen');
}

/* Grey out games a list doesn't have enough meanings or sentences for */
function setGameAvailability(entries) {
  document.querySelector('.online-bar').style.display = entries ? 'none' : '';
  document.querySelectorAll('.game-sel-card').forEach(card => {
    const need = GAME_NEEDS[card.dataset.game];
    const enough = !entries || (!need.gradeOnly && entries.filter(need.ok).length >= need.min);
    card.classList.toggle('gsc-disabled', !enough);
    card.querySelector('.gsc-note')?.remove();
    if (!enough) {
      card.insertAdjacentHTML('beforeend', need.gradeOnly
        ? '<div class="gsc-note">Pick a grade on the home page to play this game</div>'
        : `<div class="gsc-note">Needs ${need.min}+ words with ${need.need} — add them in 📝 My Lists</div>`);
    }
  });
}

/* The words for one round of a game, from a grade or a grown-up's list */
function wordsForGame(game) {
  if (game === 'think' || game === 'infer') {
    return Comprehension.pick(Comprehension.bandFor(state.currentGrade), 8, game === 'infer' ? 'infer' : null);
  }
  if (state.currentList) {
    const list = WordLists.get(state.currentList);
    const entries = list ? listEntries(list) : [];
    state.distractorPool = entries.map(e => e.word);
    return shuffle(entries.filter(GAME_NEEDS[game].ok)).slice(0, 8);
  }
  state.distractorPool = null;
  return buildWordSet(state.currentGrade);
}

/* ===== GAME CARDS ===== */
document.querySelectorAll('.game-sel-card').forEach(card => {
  card.addEventListener('click', () => {
    if (!state.currentGrade && !state.currentList) { showToast('Pick a grade or a word list first! 📚'); showScreen('homeScreen'); return; }
    if (card.classList.contains('gsc-disabled')) {
      showToast(GAME_NEEDS[card.dataset.game].gradeOnly ? 'Pick a grade to play this game! 📚' : 'This list needs more meanings or sentences for that game.');
      return;
    }
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
function buildMatchGame() {
  state.matchState = { selectedWord: null, selectedDef: null, matched: new Set() };
  const words = state.words;

  const wordItems = shuffle(words.map(w => ({ id: w.word, label: w.word + webBadge(w) })));
  const defItems  = shuffle(words.map(w => ({ id: w.word, label: w.definition })));

  document.getElementById('gameArea').innerHTML = `
    <p class="match-intro">🐝 Click a <strong>word</strong> on the left, then click its <strong>matching definition</strong> on the right!</p>
    <div class="match-grid">
      <div>
        <div class="match-col-label">📝 Words</div>
        ${wordItems.map(w => `<div class="match-item" data-id="${w.id}" data-type="word">${w.label}</div>`).join('')}
      </div>
      <div>
        <div class="match-col-label">📖 Definitions</div>
        ${defItems.map(d => `<div class="match-item" data-id="${d.id}" data-type="def">${d.label}</div>`).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.match-item').forEach(el => {
    el.addEventListener('click', handleMatchClick);
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
      setProgress(ms.matched.size / state.words.length);
      showToast('✅ Match! Well done!', 'correct');

      const rect = wEl.getBoundingClientRect();
      showScorePop('+1 ⭐', rect.left + rect.width / 2, rect.top + window.scrollY);

      if (ms.matched.size === state.words.length) {
        setTimeout(showResult, 700);
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

  const sentenceHighlighted = w.contextSentence.replace(
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
      <div class="round-label">🔍 Round ${state.round + 1} of ${state.words.length}${w.source ? ' · 🌐 fresh word' : ''}</div>
      <div class="context-sentence-box">${sentenceHighlighted}</div>
      <div class="context-question">${w.contextQuestion}</div>
      <div class="context-choices">${choicesHtml}</div>
      <div class="feedback-box" id="ctxFeedback"></div>
    </div>
  `;

  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', handleContextChoice);
  });
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
      <div class="round-label">✏️ Round ${state.round + 1} of ${state.words.length}${w.source ? ' · 🌐 fresh word' : ''}</div>
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
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  speechSynthesis.speak(u);
}

function buildSpellRound() {
  if (state.round >= state.words.length) { showResult(); return; }
  const w = state.words[state.round];
  setProgress(state.round / state.words.length);

  const target = w.word.toLowerCase().split('');
  const extraCount = Math.min(4, Math.max(2, Math.ceil(target.length / 3)));
  const extras = shuffle('abcdefghijklmnopqrstuvwxyz'.split('').filter(c => !target.includes(c))).slice(0, extraCount);
  const bank = shuffle([...target, ...extras]);
  state.spell = { target, built: [], tries: 0, done: false };

  document.getElementById('gameArea').innerHTML = `
    <div class="missing-card spell-card">
      <div class="round-label">🎧 Round ${state.round + 1} of ${state.words.length}${w.source ? ' · 🌐 fresh word' : ''}</div>
      <div class="spell-listen">
        <button class="spell-hear" id="spellHear">🔊 Hear the word</button>
        ${w.contextSentence ? '<button class="spell-hint" id="spellSentence">💬 Hear it in a sentence</button>' : ''}
      </div>
      ${w.definition ? `<p class="spell-meaning">💡 ${w.definition}</p>` : ''}
      <div class="spell-slots" id="spellSlots">${target.map(() => '<span class="spell-slot"></span>').join('')}</div>
      <div class="spell-bank" id="spellBank">${bank.map((t, k) =>
        `<button class="spell-tile" data-k="${k}" data-t="${t}">${t}</button>`).join('')}</div>
      <div class="spell-actions">
        <button class="btn-outline" id="spellUndo">⌫ Undo</button>
        <button class="btn-primary" id="spellCheck">✔ Check</button>
      </div>
      <div class="feedback-box" id="spFeedback"></div>
    </div>`;

  const hear = () => speakText(w.word);
  document.getElementById('spellHear').addEventListener('click', hear);
  document.getElementById('spellSentence')?.addEventListener('click', () => speakText(w.contextSentence));
  document.querySelectorAll('.spell-tile').forEach(t => t.addEventListener('click', () => addSpellTile(t)));
  document.getElementById('spellUndo').addEventListener('click', undoSpellTile);
  document.getElementById('spellCheck').addEventListener('click', checkSpelling);
  setTimeout(hear, 300);
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
    speakText(`${w.word}. ${sp.target.join(', ')}. ${w.word}.`, 0.7);
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
  const tile = /^[a-z]$/i.test(e.key) &&
    document.querySelector(`#spellBank .spell-tile[data-t="${e.key.toLowerCase()}"]:not(:disabled)`);
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
    message = `Amazing! You got all ${state.total} correct. You're a true ${{ think: 'Reading Champion', infer: 'Reading Detective' }[state.currentGame] || 'Spelling Champion'}!`;
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
