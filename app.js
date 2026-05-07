/* ===== STATE ===== */
const state = {
  currentGrade: null,
  currentGame: null,   // 'match' | 'context' | 'missing'
  words: [],
  score: 0,
  total: 0,
  round: 0,           // for context & missing
  matchState: {
    selectedWord: null,
    selectedDef: null,
    matched: new Set(),
    wrong: null,
  },
};

/* ===== NAVIGATION ===== */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === id.replace('Screen', ''));
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    if (view === 'home')     showScreen('homeScreen');
    if (view === 'games')    showScreen('gamesScreen');
    if (view === 'practice') showScreen('practiceScreen');
  });
});

document.getElementById('backFromGames').addEventListener('click', () => showScreen('homeScreen'));
document.getElementById('backFromPractice').addEventListener('click', () => showScreen('gamesScreen'));

/* ===== GRADE SELECT ===== */
document.querySelectorAll('.grade-card').forEach(card => {
  card.addEventListener('click', () => {
    const grade = card.dataset.grade;
    state.currentGrade = grade;
    state.words = shuffle([...GRADE_WORDS[grade]]);
    const label = grade === 'K' ? 'Kindergarten' : `Grade ${grade}`;
    document.getElementById('gradeTitle').textContent = `${label} — Choose a Game`;
    showScreen('gamesScreen');
  });
});

/* ===== GAME SELECT ===== */
document.querySelectorAll('.game-select-card').forEach(card => {
  card.addEventListener('click', () => {
    const game = card.dataset.game;
    state.currentGame = game;
    startGame(game);
  });
});

/* ===== RESULT BUTTONS ===== */
document.getElementById('playAgainBtn').addEventListener('click', () => {
  state.words = shuffle([...GRADE_WORDS[state.currentGrade]]);
  startGame(state.currentGame);
});
document.getElementById('chooseGameBtn').addEventListener('click', () => {
  showScreen('gamesScreen');
});

/* ===== START GAME ===== */
function startGame(game) {
  state.score = 0;
  state.round = 0;
  state.total = state.words.length;

  const titles = { match: '🔗 Word Match', context: '🔍 Context Clues', missing: '✏️ Missing Words' };
  document.getElementById('gameTitle').textContent = titles[game] || game;
  updateScoreDisplay();
  updateProgress(0);

  document.getElementById('resultArea').classList.add('hidden');
  document.getElementById('gameArea').style.display = 'block';

  showScreen('practiceScreen');

  if (game === 'match')   buildMatchGame();
  if (game === 'context') buildContextRound();
  if (game === 'missing') buildMissingRound();
}

/* ===== UTILITIES ===== */
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

function updateProgress(fraction) {
  document.getElementById('progressBar').style.width = `${Math.round(fraction * 100)}%`;
}

function showToast(msg, duration = 1600) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ===== MATCH GAME ===== */
function buildMatchGame() {
  state.matchState = { selectedWord: null, selectedDef: null, matched: new Set(), wrong: null };
  const words = state.words;

  const wordItems = shuffle(words.map(w => ({ id: w.word, label: w.word, type: 'word' })));
  const defItems  = shuffle(words.map(w => ({ id: w.word, label: w.definition, type: 'def' })));

  const html = `
    <p class="match-intro">Click a word, then click its matching definition!</p>
    <div class="match-columns">
      <div>
        <div class="match-col-title">Words</div>
        ${wordItems.map(item => `<div class="match-item" data-id="${item.id}" data-type="word">${item.label}</div>`).join('')}
      </div>
      <div>
        <div class="match-col-title">Definitions</div>
        ${defItems.map(item => `<div class="match-item" data-id="${item.id}" data-type="def">${item.label}</div>`).join('')}
      </div>
    </div>
  `;
  document.getElementById('gameArea').innerHTML = html;

  document.querySelectorAll('.match-item').forEach(el => {
    el.addEventListener('click', handleMatchClick);
  });
}

function handleMatchClick(e) {
  const el = e.currentTarget;
  if (el.classList.contains('matched') || el.classList.contains('wrong')) return;

  const ms = state.matchState;
  const type = el.dataset.type;

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
    const wordId = ms.selectedWord.dataset.id;
    const defId  = ms.selectedDef.dataset.id;

    if (wordId === defId) {
      ms.selectedWord.classList.remove('selected');
      ms.selectedDef.classList.remove('selected');
      ms.selectedWord.classList.add('matched');
      ms.selectedDef.classList.add('matched');
      ms.matched.add(wordId);
      ms.selectedWord.innerHTML += ' ✓';
      state.score++;
      updateScoreDisplay();
      updateProgress(ms.matched.size / state.words.length);
      showToast('✅ Correct!');

      if (ms.matched.size === state.words.length) {
        setTimeout(() => showResult(), 600);
      }
      ms.selectedWord = null;
      ms.selectedDef  = null;
    } else {
      ms.selectedWord.classList.remove('selected');
      ms.selectedDef.classList.remove('selected');
      ms.selectedWord.classList.add('wrong');
      ms.selectedDef.classList.add('wrong');
      showToast('❌ Try again!');

      const wEl = ms.selectedWord;
      const dEl = ms.selectedDef;
      setTimeout(() => {
        wEl.classList.remove('wrong');
        dEl.classList.remove('wrong');
      }, 600);
      ms.selectedWord = null;
      ms.selectedDef  = null;
    }
  }
}

/* ===== CONTEXT CLUES GAME ===== */
function buildContextRound() {
  if (state.round >= state.words.length) {
    showResult();
    return;
  }
  const w = state.words[state.round];
  updateProgress(state.round / state.words.length);

  const choices = w.contextChoices.map((c, i) => ({
    text: c,
    index: i,
    isCorrect: i === w.contextAnswer,
  }));

  const sentenceWithHighlight = w.contextSentence.replace(
    new RegExp(`\\b${w.word}\\b`, 'i'),
    match => `<span class="highlight-word">${match}</span>`
  );

  const html = `
    <div class="context-card">
      <div class="context-round-label">Round ${state.round + 1} of ${state.words.length}</div>
      <div class="context-sentence">${sentenceWithHighlight}</div>
      <div class="context-question">${w.contextQuestion}</div>
      <div class="context-choices">
        ${choices.map((c, i) => `
          <button class="choice-btn" data-index="${c.index}" data-correct="${c.isCorrect}">
            <span style="font-weight:900;margin-right:8px;">${String.fromCharCode(65+i)}.</span>${c.text}
          </button>
        `).join('')}
      </div>
      <div class="feedback-overlay" id="contextFeedback"></div>
    </div>
  `;
  document.getElementById('gameArea').innerHTML = html;

  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', handleContextChoice);
  });
}

function handleContextChoice(e) {
  const btn = e.currentTarget;
  const isCorrect = btn.dataset.correct === 'true';
  const allBtns = document.querySelectorAll('.choice-btn');

  allBtns.forEach(b => {
    b.disabled = true;
    if (b.dataset.correct === 'true') b.classList.add('correct');
  });

  const feedback = document.getElementById('contextFeedback');
  if (isCorrect) {
    btn.classList.add('correct');
    state.score++;
    updateScoreDisplay();
    feedback.innerHTML = `<span class="feedback-correct">🎉 Correct! Great job!</span>`;
    showToast('✅ Correct!');
  } else {
    btn.classList.add('incorrect');
    const correctText = state.words[state.round].contextChoices[state.words[state.round].contextAnswer];
    feedback.innerHTML = `<span class="feedback-wrong">❌ Not quite. The answer is: "${correctText}"</span>`;
    showToast('❌ Try again next time!');
  }

  state.round++;
  feedback.innerHTML += `<button class="next-btn" id="nextContextBtn">${state.round >= state.words.length ? 'See Results 🏆' : 'Next →'}</button>`;
  document.getElementById('nextContextBtn').addEventListener('click', buildContextRound);
}

/* ===== MISSING WORDS GAME ===== */
function buildMissingRound() {
  if (state.round >= state.words.length) {
    showResult();
    return;
  }
  const w = state.words[state.round];
  updateProgress(state.round / state.words.length);

  const correctWord = w.word;
  const distractors = getDistractors(state.words, state.round, 3);
  const choices = shuffle([correctWord, ...distractors]);

  const displaySentence = w.sentence.replace('___', `<span class="missing-blank">_____</span>`);

  const html = `
    <div class="missing-card">
      <div class="context-round-label">Round ${state.round + 1} of ${state.words.length}</div>
      <div class="missing-sentence">${displaySentence}</div>
      <div class="missing-choices">
        ${choices.map(c => `<button class="word-choice-btn" data-word="${c}">${c}</button>`).join('')}
      </div>
      <div class="feedback-overlay" id="missingFeedback"></div>
    </div>
  `;
  document.getElementById('gameArea').innerHTML = html;

  document.querySelectorAll('.word-choice-btn').forEach(btn => {
    btn.addEventListener('click', handleMissingChoice);
  });
}

function handleMissingChoice(e) {
  const btn = e.currentTarget;
  const chosen = btn.dataset.word;
  const correct = state.words[state.round].word;
  const allBtns = document.querySelectorAll('.word-choice-btn');

  allBtns.forEach(b => {
    b.disabled = true;
    if (b.dataset.word === correct) b.classList.add('correct');
  });

  const feedback = document.getElementById('missingFeedback');
  if (chosen === correct) {
    btn.classList.add('correct');
    state.score++;
    updateScoreDisplay();
    feedback.innerHTML = `<span class="feedback-correct">🎉 That's right! "${correct}" fits perfectly!</span>`;
    showToast('✅ Correct!');
  } else {
    btn.classList.add('incorrect');
    feedback.innerHTML = `<span class="feedback-wrong">❌ The correct word is "${correct}"</span>`;
    showToast('❌ Keep trying!');
  }

  state.round++;
  feedback.innerHTML += `<button class="next-btn" id="nextMissingBtn">${state.round >= state.words.length ? 'See Results 🏆' : 'Next →'}</button>`;
  document.getElementById('nextMissingBtn').addEventListener('click', buildMissingRound);
}

function getDistractors(words, currentIdx, count) {
  const others = words.filter((_, i) => i !== currentIdx).map(w => w.word);
  const shuffled = shuffle(others);
  return shuffled.slice(0, count);
}

/* ===== RESULTS ===== */
function showResult() {
  document.getElementById('gameArea').style.display = 'none';
  document.getElementById('resultArea').classList.remove('hidden');
  updateProgress(1);

  const pct = state.total > 0 ? state.score / state.total : 0;
  let title, message, stars;

  if (pct === 1) {
    title = '🏆 Perfect Score!';
    message = `Amazing! You got all ${state.total} correct. You're a spelling champion!`;
    stars = '⭐⭐⭐';
  } else if (pct >= 0.7) {
    title = '🌟 Great Job!';
    message = `You scored ${state.score} out of ${state.total}. Keep it up, you're almost there!`;
    stars = '⭐⭐';
  } else if (pct >= 0.4) {
    title = '🐝 Good Try!';
    message = `You scored ${state.score} out of ${state.total}. Practice makes perfect — give it another buzz!`;
    stars = '⭐';
  } else {
    title = '💪 Keep Practicing!';
    message = `You scored ${state.score} out of ${state.total}. Don't give up — every bee learns to fly!`;
    stars = '';
  }

  document.getElementById('resultTitle').textContent = title;
  document.getElementById('resultMessage').textContent = message;
  document.getElementById('resultStars').textContent = stars;
}

/* ===== INIT ===== */
showScreen('homeScreen');
