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

  const viewMap = { homeScreen: 'home', gamesScreen: 'games', practiceScreen: 'practice' };
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewMap[id]);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.view === 'home')  showScreen('homeScreen');
    if (btn.dataset.view === 'games') showScreen('gamesScreen');
  });
});

document.getElementById('logoHome').addEventListener('click', (e) => {
  e.preventDefault();
  showScreen('homeScreen');
});

document.getElementById('backFromGames').addEventListener('click', () => showScreen('homeScreen'));
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
    fetchOnlineWords(grade);
    const label = grade === 'K' ? 'Kindergarten' : `Grade ${grade}`;
    document.getElementById('gradeTitle').textContent = `${label} — Choose a Game`;
    document.querySelector('#gamesScreen .screen-sub').textContent =
      `${label} spelling words are loaded! Pick your game.`;
    showScreen('gamesScreen');
  });
});

/* ===== GAME CARDS ===== */
document.querySelectorAll('.game-sel-card').forEach(card => {
  card.addEventListener('click', () => {
    if (!state.currentGrade) { showToast('Pick a grade first! 📚'); showScreen('homeScreen'); return; }
    state.currentGame = card.dataset.game;
    state.words = buildWordSet(state.currentGrade);
    startGame(card.dataset.game);
  });
});

/* ===== RESULT BUTTONS ===== */
document.getElementById('playAgainBtn').addEventListener('click', () => {
  state.words = buildWordSet(state.currentGrade);
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

  const gameLabel = { match: '🔗 Word Match', context: '🔍 Context Clues', missing: '✏️ Missing Words' };
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
  const pool    = words.filter((_, i) => i !== currentIdx).map(w => w.word);
  return shuffle(pool).slice(0, count);
}

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
    message = `Amazing! You got all ${state.total} correct. You're a true Spelling Champion!`;
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
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ===== INIT ===== */
showScreen('homeScreen');
