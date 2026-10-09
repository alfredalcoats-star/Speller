/* ===================================================================
   Story Check — read passages and answer test-style questions
   Modeled on through-year reading check-ups such as DRC BEACON:
   passages with selected-response, two-part evidence (EBSR),
   multi-select, hot-text, ordering and short-answer items; a
   multistage adaptive check-up (passage 2 adjusts to passage 1);
   on-screen tools (read-aloud, highlighter, line reader, answer
   eliminator); and a report by skill area.
   =================================================================== */

const STORE_KEY = 'storyCheck.v1';
const READERS_KEY = 'readingBoost.v1';     // reuse Reading Boost readers when there are any

/* ===== Small helpers ===== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = arr => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
const today = () => new Date().toISOString().slice(0, 10);
const gradeIndex = g => STORY_GRADES.indexOf(String(g));
const passageById = id => PASSAGES.find(p => p.id === id);

function showToast(msg, type = '') {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ` toast-${type}` : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 2200);
}

function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const container = $('#confettiContainer');
  const colors = ['#FFD60A', '#FF9500', '#00C897', '#4B7BEC', '#8854D0', '#E84393'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = `${Math.random() * 100}%`;
    p.style.width = p.style.height = `${6 + Math.random() * 9}px`;
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = `${1.8 + Math.random() * 2}s`;
    p.style.animationDelay = `${Math.random() * 0.6}s`;
    container.appendChild(p);
  }
  setTimeout(() => { container.innerHTML = ''; }, 4500);
}

/* ===== Storage ===== */
function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { history: [], best: {} }; }
  catch (e) { return { history: [], best: {} }; }
}
function saveStore() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* storage blocked */ }
}
const store = loadStore();

function readingBoostReaders() {
  try {
    const data = JSON.parse(localStorage.getItem(READERS_KEY));
    return data ? Object.values(data.profiles) : [];
  } catch (e) { return []; }
}

/* ===== Speech ===== */
const synth = window.speechSynthesis;
let speechToken = 0;
function speak(text, rate = 0.85) {
  return new Promise(resolve => {
    if (!synth || !text) { resolve(false); return; }
    const token = speechToken;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    const fallback = setTimeout(() => resolve(token === speechToken), 1500 + text.length * 90);
    u.onend = u.onerror = () => { clearTimeout(fallback); resolve(token === speechToken); };
    synth.speak(u);
  });
}
function stopSpeech() {
  speechToken++;
  if (synth) synth.cancel();
  $$('.sent.speaking').forEach(s => s.classList.remove('speaking'));
  const btn = $('#toolRead');
  if (btn) { btn.setAttribute('aria-pressed', 'false'); btn.textContent = '🔊 Read passage'; }
}

/* ===================================================================
   STATE
   =================================================================== */
const S = {
  reader: null,          // { id, name, grade }
  mode: null,            // 'checkup' | 'practice'
  passages: [],          // passages in this session
  pIndex: 0,
  qIndex: 0,
  answers: {},           // "passageId:q" -> answer
  checked: {},           // practice mode: "passageId:q" -> true once checked
  flags: new Set(),
  struck: {},            // answer eliminator: "passageId:q:part" -> Set of choice indexes
  partScores: [],        // check-up: [{ id, grade, points, max }]
  tools: { highlight: false, line: false, font: false, size: 0, autoRead: false },
};
const key = (p, q) => `${p.id}:${q}`;
const curPassage = () => S.passages[S.pIndex];
const curQuestion = () => curPassage().questions[S.qIndex];

/* ===================================================================
   SCORING — 1-point and 2-point items, partial credit where tests give it
   =================================================================== */
function maxPoints(q) { return q.type === 'ebsr' || q.type === 'multi' ? 2 : 1; }

function normalize(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim(); }

function scoreQuestion(q, ans) {
  if (ans === undefined || ans === null) return 0;
  switch (q.type) {
    case 'mc': return ans === q.answer ? 1 : 0;
    // Part B only earns credit when Part A is right, as on two-part evidence items
    case 'ebsr': return ans.a === q.partA.answer ? 1 + (ans.b === q.partB.answer ? 1 : 0) : 0;
    case 'multi': {
      const right = ans.filter(i => q.answers.includes(i)).length;
      const wrong = ans.length - right;
      return Math.max(0, Math.min(2, right - wrong));
    }
    case 'hottext': return ans[0] === q.answer[0] && ans[1] === q.answer[1] ? 1 : 0;
    case 'order': return ans.length === q.items.length && ans.every((v, i) => v === i) ? 1 : 0;
    case 'short': return q.accept.some(a => normalize(a) === normalize(ans)) ? 1 : 0;
    default: return 0;
  }
}

function isAnswered(q, ans) {
  if (ans === undefined || ans === null) return false;
  if (q.type === 'ebsr') return ans.a !== undefined && ans.b !== undefined;
  if (q.type === 'multi') return ans.length === q.answers.length;
  if (q.type === 'order') return ans.length === q.items.length;
  if (q.type === 'short') return normalize(ans).length > 0;
  return true;
}

function passageScore(p) {
  let points = 0, max = 0;
  p.questions.forEach((q, i) => { points += scoreQuestion(q, S.answers[key(p, i)]); max += maxPoints(q); });
  return { points, max };
}

/* ===================================================================
   START SCREEN
   =================================================================== */
function showScreen(id) {
  stopSpeech();
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#' + id).classList.add('active');
  $('#navStart').classList.toggle('active', id === 'startScreen');
  $('#navResults').classList.toggle('active', id === 'reportScreen' && !S.mode);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderStart() {
  S.mode = null;
  const readers = readingBoostReaders();
  const sel = $('#readerSelect');
  const previous = sel.value;
  sel.innerHTML = readers.map(r => `<option value="${esc(r.id)}">${r.avatar || '🙂'} ${esc(r.name)}</option>`).join('') +
    '<option value="guest">🙂 Guest reader</option>';
  if (previous && [...sel.options].some(o => o.value === previous)) sel.value = previous;
  const prevGrade = $('#gradeSelect').value;
  $('#gradeSelect').innerHTML = STORY_GRADES.map(g => `<option value="${g}">${STORY_GRADE_LABEL(g)}</option>`).join('');
  // Keep the grade a grown-up picked; otherwise use the reader's grade
  if (prevGrade && sel.value === previous) $('#gradeSelect').value = prevGrade;
  else syncGrade();
  renderLibrary();
  renderDrillChips();
  showScreen('startScreen');
}

/* ===================================================================
   SKILL DRILLS — six short texts on one comprehension skill
   (exercises and player shared with the other pages: comprehension.js)
   =================================================================== */
function renderDrillChips() {
  const band = Comprehension.bandFor($('#gradeSelect').value);
  const skills = Comprehension.skillsFor(band);
  // Inference first: it's the skill kids need the most practice with
  skills.sort((a, b) => (b === 'infer') - (a === 'infer'));
  $('#drillChips').innerHTML = skills.map(k => `
    <button class="sc-drill-chip ${k === 'infer' ? 'star' : ''}" data-skill="${k}">
      <span>${COMP_SKILLS[k].icon}</span><b>${COMP_SKILLS[k].name}</b>${k === 'infer' ? '<small>Detective mode</small>' : ''}
    </button>`).join('') +
    `<button class="sc-drill-chip" data-skill="mixed"><span>🎲</span><b>Mixed Skills</b></button>
    <p class="sc-drill-band">${COMP_BANDS[band]} texts</p>`;
  $$('#drillChips .sc-drill-chip').forEach(b => b.addEventListener('click', () => startDrill(b.dataset.skill)));
}

function startDrill(skill) {
  S.reader = currentReader();
  S.mode = 'drill';
  S.started = Date.now();
  const band = Comprehension.bandFor(S.reader.grade);
  const items = Comprehension.pick(band, 6, skill === 'mixed' ? null : skill);
  const results = [];
  const title = skill === 'mixed' ? '🎲 Mixed Skills' : `${COMP_SKILLS[skill].icon} ${COMP_SKILLS[skill].name}`;
  $('#drillTitle').textContent = title;
  $('#drillScore').textContent = '0';
  showScreen('drillScreen');

  const next = () => {
    if (results.length >= items.length) { finishDrill(skill, items, results); return; }
    const n = results.length;
    $('#drillBody').innerHTML = `<div class="counter sc-drill-count">${n + 1} / ${items.length}</div><div id="drillItem"></div>`;
    Comprehension.render($('#drillItem'), items[n], {
      speak: text => { stopSpeech(); speak(text); },
      older: band === '68',
      nextLabel: n === items.length - 1 ? '🏁 See my score' : 'Next →',
      onDone: ok => {
        results.push(ok);
        $('#drillScore').textContent = results.filter(Boolean).length;
        next();
      },
    });
    if (S.tools.autoRead || gradeIndex(S.reader.grade) <= 1) {
      speak([items[n].text, items[n].q].filter(Boolean).join('. '));
    }
  };
  next();
}

function finishDrill(skill, items, results) {
  const right = results.filter(Boolean).length;
  // Record drill results under the matching report skill area
  const skills = {};
  items.forEach((it, i) => {
    const area = COMP_SKILLS[it.skill].storySkill;
    skills[area] = skills[area] || { points: 0, max: 0 };
    skills[area].points += results[i] ? 1 : 0;
    skills[area].max += 1;
  });
  const r = S.reader;
  store.history.unshift({
    date: today(), readerId: r.id, readerName: r.name, avatar: r.avatar, grade: r.grade, mode: 'drill',
    drill: skill === 'mixed' ? 'Mixed Skills' : COMP_SKILLS[skill].name,
    passages: [], points: right, max: items.length, skills,
    mins: Math.max(1, Math.round((Date.now() - S.started) / 60000)),
  });
  store.history = store.history.slice(0, 100);
  saveStore();
  const pct = right / items.length;
  if (pct >= 0.8) launchConfetti();
  const tip = skill === 'mixed' ? 'Mix it up every few days so every skill stays sharp.' : COMP_SKILLS[skill].tip;
  $('#drillBody').innerHTML = `
    <div class="sc-drill-done">
      <div class="sc-big-icon">${skill === 'infer' ? '🕵️' : pct >= 0.8 ? '🌟' : '💪'}</div>
      <h3 class="result-title">${right} of ${items.length} right on the first try!</h3>
      <p class="result-msg">${pct >= 0.8 ? 'Excellent thinking!' : pct >= 0.5 ? 'Nice work — keep practicing!' : 'Good effort! Try another round to get stronger.'}</p>
      <div class="sc-tipbox"><b>💡 Remember</b><p>${esc(tip)}</p></div>
      <div class="row-btns sc-row">
        <button class="btn-primary" id="drillAgain">🔄 Another round</button>
        <button class="btn-secondary" id="drillHome">📚 Back to stories</button>
      </div>
    </div>`;
  $('#drillAgain').addEventListener('click', () => startDrill(skill));
  $('#drillHome').addEventListener('click', renderStart);
  S.mode = null;
}

$('#quitDrill').addEventListener('click', () => {
  if (confirm('Leave this drill? Your answers so far won\'t be saved.')) renderStart();
});

function syncGrade() {
  const id = $('#readerSelect').value;
  const r = readingBoostReaders().find(x => x.id === id);
  if (r && r.grade) $('#gradeSelect').value = String(r.grade);
  else $('#gradeSelect').value = '3';
}

function currentReader() {
  const id = $('#readerSelect').value;
  const r = readingBoostReaders().find(x => x.id === id);
  return { id, name: r ? r.name : 'Guest', avatar: r?.avatar || '🙂', grade: $('#gradeSelect').value, settings: r?.settings };
}

function renderLibrary() {
  const reader = currentReader();
  const best = store.best[reader.id] || {};
  $('#library').innerHTML = STORY_GRADES.map(g => {
    const ps = PASSAGES.filter(p => p.grade === g);
    return `<div class="sc-grade-row ${g === reader.grade ? 'mine' : ''}">
      <div class="sc-grade-label">${g === reader.grade ? '⭐ ' : ''}${STORY_GRADE_LABEL(g)}</div>
      <div class="sc-grade-cards">${ps.map(p => `
        <button class="sc-card" data-pid="${p.id}">
          <span class="sc-card-icon">${p.icon}</span>
          <span class="sc-card-text"><b>${esc(p.title)}</b><small>${p.genre} · ${p.questions.length} questions</small></span>
          ${best[p.id] !== undefined ? `<span class="sc-card-best">${best[p.id]}%</span>` : ''}
        </button>`).join('')}</div>
    </div>`;
  }).join('');
  $$('#library .sc-card').forEach(b => b.addEventListener('click', () => startSession('practice', [passageById(b.dataset.pid)])));
}

$('#readerSelect').addEventListener('change', () => { syncGrade(); renderLibrary(); });
$('#gradeSelect').addEventListener('change', () => { renderLibrary(); renderDrillChips(); });
$('#startCheckup').addEventListener('click', () => {
  const grade = $('#gradeSelect').value;
  const pool = PASSAGES.filter(p => p.grade === grade);
  startSession('checkup', [pool[Math.floor(Math.random() * pool.length)]]);
});
$('#startPractice').addEventListener('click', () => $('#library').scrollIntoView({ behavior: 'smooth' }));
$('#navStart').addEventListener('click', renderStart);
$('#navResults').addEventListener('click', renderHistory);

/* ===================================================================
   SESSION
   =================================================================== */
function startSession(mode, passages) {
  S.reader = currentReader();
  S.mode = mode;
  S.passages = passages;
  S.pIndex = 0;
  S.qIndex = 0;
  S.answers = {};
  S.checked = {};
  S.flags = new Set();
  S.struck = {};
  S.partScores = [];
  S.lastRendered = null;
  S.started = Date.now();
  // Start with the reader's own helpers from Reading Boost; little ones get questions read aloud
  const rs = S.reader.settings;
  S.tools.font = rs ? rs.font !== 'default' : false;
  S.tools.size = rs ? { m: 0, l: 1, xl: 2 }[rs.size] ?? 0 : 0;
  S.tools.autoRead = gradeIndex(S.reader.grade) <= 1 || !!rs?.autoRead && gradeIndex(S.reader.grade) <= 3;
  S.tools.highlight = false;
  S.tools.line = false;
  applyTools();
  renderPassage();
  showScreen('testScreen');
  renderQuestion();
}

function applyTools() {
  const t = S.tools;
  document.body.classList.toggle('sc-easyfont', t.font);
  document.body.classList.remove('sc-size-0', 'sc-size-1', 'sc-size-2');
  document.body.classList.add(`sc-size-${t.size}`);
  document.body.classList.toggle('sc-line', t.line);
  $('#toolHighlight').setAttribute('aria-pressed', t.highlight);
  $('#toolLine').setAttribute('aria-pressed', t.line);
  $('#toolFont').setAttribute('aria-pressed', t.font);
  $('#toolAutoRead').checked = t.autoRead;
  $('#passage').classList.toggle('highlighting', t.highlight);
}

function renderPassage() {
  const p = curPassage();
  $('#testTitle').textContent = `${p.icon} ${p.title}`;
  $('#partPill').textContent = S.mode === 'checkup' ? `Part ${S.pIndex + 1} of 2` : 'Practice';
  $('#passage').innerHTML = `
    <header class="sc-passage-head">
      <span class="sc-genre">${p.genre}</span>
      <h3>${esc(p.title)}</h3>
    </header>
    ${p.paragraphs.map((sents, pi) => `
      <p class="sc-para" data-p="${pi}">
        <span class="sc-pnum" aria-label="Paragraph ${pi + 1}">${pi + 1}</span>
        ${sents.map((s, si) => `<span class="sent" data-p="${pi}" data-s="${si}">${esc(s)}</span>`).join(' ')}
      </p>`).join('')}`;
  $$('#passage .sent').forEach(el => el.addEventListener('click', () => onSentenceClick(el)));
  $$('#passage .sc-para').forEach(el => el.addEventListener('click', () => {
    if (!S.tools.line) return;
    $$('#passage .sc-para').forEach(x => x.classList.toggle('focus', x === el));
  }));
}

function onSentenceClick(el) {
  const q = curQuestion();
  const k = key(curPassage(), S.qIndex);
  // A "click the sentence" question takes the click as its answer
  if (q.type === 'hottext' && !S.checked[k]) {
    S.answers[k] = [+el.dataset.p, +el.dataset.s];
    markHotText();
    renderAnswerSummary();
    renderQnav();
    return;
  }
  if (S.tools.highlight) el.classList.toggle('hl');
}

function markHotText() {
  const q = curQuestion();
  const ans = S.answers[key(curPassage(), S.qIndex)];
  $$('#passage .sent').forEach(el => {
    el.classList.toggle('hot', q.type === 'hottext');
    el.classList.toggle('chosen', q.type === 'hottext' && !!ans && +el.dataset.p === ans[0] && +el.dataset.s === ans[1]);
    el.classList.remove('right', 'wrong-pick');
  });
  $('#passage').classList.toggle('hot-mode', q.type === 'hottext');
}

/* ===================================================================
   QUESTIONS
   =================================================================== */
const TYPE_LABEL = {
  mc: 'Multiple choice', ebsr: 'Two-part question', multi: 'Choose two', hottext: 'Click the sentence',
  order: 'Put in order', short: 'Short answer',
};

function renderQnav() {
  const p = curPassage();
  $('#qnav').innerHTML = p.questions.map((q, i) => {
    const k = key(p, i);
    const done = isAnswered(q, S.answers[k]);
    let cls = done ? 'answered' : '';
    if (S.mode === 'practice' && S.checked[k]) cls = scoreQuestion(q, S.answers[k]) === maxPoints(q) ? 'right' : 'wrong';
    return `<button class="sc-qpill ${cls} ${i === S.qIndex ? 'now' : ''}" data-q="${i}" aria-label="Question ${i + 1}${done ? ', answered' : ''}${S.flags.has(k) ? ', flagged' : ''}">${i + 1}${S.flags.has(k) ? '🚩' : ''}</button>`;
  }).join('') + (S.mode === 'checkup' ? '<button class="sc-qpill review" id="reviewPill">Review</button>' : '');
  $$('#qnav [data-q]').forEach(b => b.addEventListener('click', () => { S.qIndex = +b.dataset.q; renderQuestion(); }));
  $('#reviewPill')?.addEventListener('click', renderReview);
}

function choiceButtons(choices, selected, part, locked, opts = {}) {
  const k = `${key(curPassage(), S.qIndex)}:${part}`;
  const struck = S.struck[k] || new Set();
  return `<div class="sc-choices" data-part="${part}">${choices.map((c, i) => {
    const isSel = Array.isArray(selected) ? selected.includes(i) : selected === i;
    let state = '';
    if (locked && opts.correct) state = opts.correct.includes(i) ? 'right' : isSel ? 'wrong' : '';
    return `<div class="sc-choice-row">
      <button class="sc-choice ${isSel ? 'selected' : ''} ${struck.has(i) ? 'struck' : ''} ${state}" data-i="${i}" ${locked ? 'disabled' : ''}
        role="${opts.multi ? 'checkbox' : 'radio'}" aria-checked="${isSel}">
        <span class="sc-letter">${String.fromCharCode(65 + i)}</span><span>${esc(c)}</span>
      </button>
      ${locked ? '' : `<button class="sc-strike" data-i="${i}" title="Cross out this answer" aria-label="Cross out answer ${String.fromCharCode(65 + i)}">✂️</button>`}
    </div>`;
  }).join('')}</div>`;
}

function renderQuestion() {
  const p = curPassage();
  const q = curQuestion();
  const k = key(p, S.qIndex);
  // Picking an answer re-renders the question; only a NEW question resets speech
  const isNew = S.lastRendered !== k;
  S.lastRendered = k;
  if (isNew) stopSpeech();
  const ans = S.answers[k];
  const locked = S.mode === 'practice' && !!S.checked[k];
  const head = `<div class="sc-qhead">
      <span class="sc-qnum">Question ${S.qIndex + 1} of ${p.questions.length}</span>
      <span class="sc-qtype">${TYPE_LABEL[q.type]} · ${maxPoints(q)} point${maxPoints(q) > 1 ? 's' : ''}</span>
      <button class="sc-say" id="sayQ" aria-label="Read question aloud">🔊</button>
      ${S.mode === 'checkup' ? `<button class="sc-flag ${S.flags.has(k) ? 'on' : ''}" id="flagQ">🚩 ${S.flags.has(k) ? 'Flagged' : 'Flag'}</button>` : ''}
    </div>`;
  let body = '';
  switch (q.type) {
    case 'mc':
      body = `<p class="sc-prompt">${esc(q.prompt)}</p>${choiceButtons(q.choices, ans, 'a', locked, { correct: [q.answer] })}`;
      break;
    case 'ebsr':
      body = `<p class="sc-prompt">${esc(q.partA.prompt)}</p>${choiceButtons(q.partA.choices, ans?.a, 'a', locked, { correct: [q.partA.answer] })}
        <p class="sc-prompt partb">${esc(q.partB.prompt)}</p>${choiceButtons(q.partB.choices, ans?.b, 'b', locked, { correct: [q.partB.answer] })}`;
      break;
    case 'multi':
      body = `<p class="sc-prompt">${esc(q.prompt)}</p>
        <p class="sc-hint">Choose ${q.answers.length}. (${(ans || []).length} chosen)</p>
        ${choiceButtons(q.choices, ans || [], 'a', locked, { multi: true, correct: q.answers })}`;
      break;
    case 'hottext': {
      const chosen = ans ? p.paragraphs[ans[0]][ans[1]] : null;
      body = `<p class="sc-prompt">${esc(q.prompt)}</p>
        <p class="sc-hint">👈 Click a sentence in the passage to choose it.</p>
        <div class="sc-answer-box" id="hotAnswer">${chosen ? `Your answer (paragraph ${ans[0] + 1}): <b>${esc(chosen)}</b>` : 'No sentence chosen yet.'}</div>`;
      break;
    }
    case 'order': {
      const picked = ans || [];
      if (!S.orderView || S.orderView.k !== k) S.orderView = { k, items: shuffle(q.items.map((_, i) => i)) };
      body = `<p class="sc-prompt">${esc(q.prompt)}</p>
        <p class="sc-hint">Tap the items in order: first, second, third… Tap again to undo.</p>
        <div class="sc-order">${S.orderView.items.map(i => {
          const pos = picked.indexOf(i);
          return `<button class="sc-order-item ${pos >= 0 ? 'picked' : ''}" data-i="${i}" ${locked ? 'disabled' : ''}>
            <span class="sc-order-num">${pos >= 0 ? pos + 1 : ''}</span><span>${esc(q.items[i])}</span></button>`;
        }).join('')}</div>
        ${locked ? '' : '<button class="btn-outline sc-small" id="orderClear">Clear</button>'}`;
      break;
    }
    case 'short':
      body = `<p class="sc-prompt">${esc(q.prompt)}</p>
        <input class="sc-short" id="shortInput" maxlength="40" autocomplete="off" spellcheck="false" ${locked ? 'disabled' : ''}
          value="${esc(ans || '')}" placeholder="Type your answer" aria-label="Your answer" />`;
      break;
  }
  const feedback = locked ? feedbackHtml(q, ans) : '';
  $('#question').innerHTML = head + body + `<div id="answerSummary"></div>` + feedback;
  wireQuestion(q, k, locked);
  markHotText();
  if (locked && q.type === 'hottext') revealHotText(q, ans);
  renderButtons();
  renderQnav();
  if (S.tools.autoRead && !locked && isNew) readQuestion();
}

function readQuestion() {
  const q = curQuestion();
  const parts = [];
  const list = cs => cs.map((c, i) => `${String.fromCharCode(65 + i)}: ${c}`).join('. ');
  if (q.type === 'ebsr') parts.push(q.partA.prompt, list(q.partA.choices), q.partB.prompt, list(q.partB.choices));
  else if (q.type === 'order') parts.push(q.prompt, q.items.join('. '));
  else parts.push(q.prompt, q.choices ? list(q.choices) : '');
  stopSpeech();
  speak(parts.filter(Boolean).join('. '));
}

function wireQuestion(q, k, locked) {
  $('#sayQ').addEventListener('click', readQuestion);
  $('#flagQ')?.addEventListener('click', () => {
    S.flags.has(k) ? S.flags.delete(k) : S.flags.add(k);
    renderQuestion();
  });
  if (locked) return;

  $$('.sc-strike').forEach(b => b.addEventListener('click', () => {
    const part = b.closest('.sc-choice-row').parentElement.dataset.part;
    const sk = `${k}:${part}`;
    const set = S.struck[sk] || (S.struck[sk] = new Set());
    const i = +b.dataset.i;
    set.has(i) ? set.delete(i) : set.add(i);
    b.previousElementSibling.classList.toggle('struck', set.has(i));
  }));
  $$('.sc-choice').forEach(b => b.addEventListener('click', () => {
    const part = b.parentElement.parentElement.dataset.part;
    const i = +b.dataset.i;
    if (q.type === 'mc') S.answers[k] = i;
    if (q.type === 'ebsr') S.answers[k] = { ...(S.answers[k] || {}), [part]: i };
    if (q.type === 'multi') {
      const cur = S.answers[k] || [];
      if (cur.includes(i)) S.answers[k] = cur.filter(x => x !== i);
      else if (cur.length < q.answers.length) S.answers[k] = [...cur, i];
      else { showToast(`You can only choose ${q.answers.length}. Tap one to unchoose it first.`); return; }
    }
    renderQuestion();
  }));
  $$('.sc-order-item').forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i;
    const cur = S.answers[k] || [];
    S.answers[k] = cur.includes(i) ? cur.slice(0, cur.indexOf(i)) : [...cur, i];
    renderQuestion();
  }));
  $('#orderClear')?.addEventListener('click', () => { S.answers[k] = []; renderQuestion(); });
  const input = $('#shortInput');
  if (input) {
    input.addEventListener('input', () => { S.answers[k] = input.value; renderQnav(); renderButtons(); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') $('#primaryBtn')?.click(); });
  }
}

function renderAnswerSummary() {
  const q = curQuestion();
  if (q.type !== 'hottext') return;
  const p = curPassage();
  const ans = S.answers[key(p, S.qIndex)];
  $('#hotAnswer').innerHTML = ans ? `Your answer (paragraph ${ans[0] + 1}): <b>${esc(p.paragraphs[ans[0]][ans[1]])}</b>` : 'No sentence chosen yet.';
  renderButtons();
}

function revealHotText(q, ans) {
  $$('#passage .sent').forEach(el => {
    const at = [+el.dataset.p, +el.dataset.s];
    if (at[0] === q.answer[0] && at[1] === q.answer[1]) el.classList.add('right');
    else if (ans && at[0] === ans[0] && at[1] === ans[1]) el.classList.add('wrong-pick');
  });
  $(`#passage .sent[data-p="${q.answer[0]}"][data-s="${q.answer[1]}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function correctAnswerText(q) {
  switch (q.type) {
    case 'mc': return q.choices[q.answer];
    case 'ebsr': return `Part A: ${q.partA.choices[q.partA.answer]} · Part B: ${q.partB.choices[q.partB.answer]}`;
    case 'multi': return q.answers.map(i => q.choices[i]).join(' AND ');
    case 'hottext': return curPassageOf(q).paragraphs[q.answer[0]][q.answer[1]];
    case 'order': return q.items.map((t, i) => `${i + 1}. ${t}`).join('  ');
    case 'short': return q.accept[0];
  }
  return '';
}
function curPassageOf(q) { return PASSAGES.find(p => p.questions.includes(q)); }

function feedbackHtml(q, ans) {
  const pts = scoreQuestion(q, ans);
  const max = maxPoints(q);
  const cls = pts === max ? 'correct' : pts > 0 ? 'partial' : 'wrong';
  const title = pts === max ? '🎉 Correct!' : pts > 0 ? `👍 Partly right (${pts} of ${max} points)` : '❌ Not quite.';
  return `<div class="sc-feedback ${cls}">
    <b>${title}</b>
    ${pts < max ? `<p>Best answer: <b>${esc(correctAnswerText(q))}</b></p>` : ''}
    <p>💡 ${esc(q.explain)}</p>
  </div>`;
}

function renderButtons() {
  const p = curPassage();
  const q = curQuestion();
  const k = key(p, S.qIndex);
  const last = S.qIndex === p.questions.length - 1;
  const answered = isAnswered(q, S.answers[k]);
  let html = `<button class="btn-outline" id="prevBtn" ${S.qIndex === 0 ? 'disabled' : ''}>← Back</button>`;
  if (S.mode === 'practice') {
    if (!S.checked[k]) html += `<button class="btn-primary" id="primaryBtn" ${answered ? '' : 'disabled'}>✔ Check answer</button>`;
    else html += `<button class="btn-primary" id="primaryBtn">${last ? '🏁 See my score' : 'Next question →'}</button>`;
  } else {
    html += `<button class="btn-primary" id="primaryBtn">${last ? 'Review my answers →' : 'Next →'}</button>`;
  }
  $('#qbuttons').innerHTML = html;
  $('#prevBtn').addEventListener('click', () => { S.qIndex--; renderQuestion(); });
  $('#primaryBtn').addEventListener('click', () => {
    if (S.mode === 'practice' && !S.checked[k]) {
      S.checked[k] = true;
      const pts = scoreQuestion(q, S.answers[k]);
      showToast(pts === maxPoints(q) ? '🎉 Correct!' : pts ? '👍 Partly right' : 'Not quite — read why below', pts === maxPoints(q) ? 'correct' : '');
      renderQuestion();
      return;
    }
    if (!last) { S.qIndex++; renderQuestion(); return; }
    if (S.mode === 'practice') finishPractice(); else renderReview();
  });
}

/* ===== Tools ===== */
$('#toolHighlight').addEventListener('click', () => {
  S.tools.highlight = !S.tools.highlight;
  applyTools();
  showToast(S.tools.highlight ? '🖍️ Tap sentences to highlight them' : 'Highlighter off');
});
$('#toolLine').addEventListener('click', () => {
  S.tools.line = !S.tools.line;
  if (!S.tools.line) $$('#passage .sc-para').forEach(x => x.classList.remove('focus'));
  else $('#passage .sc-para')?.classList.add('focus');
  applyTools();
  if (S.tools.line) showToast('📏 Tap a paragraph to focus on it');
});
$('#toolFont').addEventListener('click', () => { S.tools.font = !S.tools.font; applyTools(); });
$('#toolSize').addEventListener('click', () => { S.tools.size = (S.tools.size + 1) % 3; applyTools(); });
$('#toolAutoRead').addEventListener('change', e => { S.tools.autoRead = e.target.checked; if (e.target.checked) readQuestion(); });
$('#toolRead').addEventListener('click', async () => {
  const btn = $('#toolRead');
  if (btn.getAttribute('aria-pressed') === 'true') { stopSpeech(); return; }
  stopSpeech();
  const token = speechToken;
  btn.setAttribute('aria-pressed', 'true');
  btn.textContent = '⏹ Stop reading';
  const p = curPassage();
  const sents = $$('#passage .sent');
  await speak(p.title);
  for (const el of sents) {
    if (token !== speechToken) return;
    el.classList.add('speaking');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const ok = await speak(el.textContent);
    el.classList.remove('speaking');
    if (!ok) return;
  }
  stopSpeech();
});
$('#quitTest').addEventListener('click', () => {
  if (confirm('Leave this passage? Answers you haven\'t submitted will be lost.')) renderStart();
});

/* ===================================================================
   CHECK-UP: review, submit, adaptive next passage
   =================================================================== */
function renderReview() {
  stopSpeech();
  const p = curPassage();
  const rows = p.questions.map((q, i) => {
    const k = key(p, i);
    const done = isAnswered(q, S.answers[k]);
    return `<button class="sc-review-row ${done ? '' : 'missing'}" data-q="${i}">
      <span>Question ${i + 1}</span><span>${TYPE_LABEL[q.type]}</span>
      <span>${done ? '✅ Answered' : '⚠️ Not answered'}${S.flags.has(k) ? ' · 🚩 Flagged' : ''}</span></button>`;
  }).join('');
  const missing = p.questions.filter((q, i) => !isAnswered(q, S.answers[key(p, i)])).length;
  $('#question').innerHTML = `
    <div class="sc-review">
      <h3>Review your answers</h3>
      <p>${missing ? `You have <b>${missing}</b> question${missing === 1 ? '' : 's'} not answered yet. Tap a question to go back to it.` : 'Every question has an answer. Tap any question to change it, or submit when you are ready.'}</p>
      ${rows}
    </div>`;
  $$('.sc-review-row').forEach(b => b.addEventListener('click', () => { S.qIndex = +b.dataset.q; renderQuestion(); }));
  $('#qbuttons').innerHTML = `<button class="btn-outline" id="backToQ">← Back to questions</button>
    <button class="btn-primary" id="submitPart">${S.pIndex === 0 ? 'Submit Part 1 →' : 'Submit and see results 🏁'}</button>`;
  $('#backToQ').addEventListener('click', () => { S.qIndex = p.questions.length - 1; renderQuestion(); });
  $('#submitPart').addEventListener('click', () => {
    if (missing && !confirm(`${missing} question${missing === 1 ? ' is' : 's are'} not answered. Submit anyway?`)) return;
    submitPart();
  });
  $$('#qnav .sc-qpill').forEach(x => x.classList.remove('now'));
  $('#reviewPill')?.classList.add('now');
}

function submitPart() {
  const p = curPassage();
  const { points, max } = passageScore(p);
  S.partScores.push({ id: p.id, grade: p.grade, points, max });
  if (S.pIndex === 0) {
    // Multistage adaptive step: the second passage moves up or down a grade based on Part 1
    const pct = points / max;
    const gi = gradeIndex(p.grade);
    const nextGi = Math.max(0, Math.min(STORY_GRADES.length - 1, pct >= 0.8 ? gi + 1 : pct < 0.5 ? gi - 1 : gi));
    const nextGrade = STORY_GRADES[nextGi];
    const pool = PASSAGES.filter(x => x.grade === nextGrade && x.id !== p.id);
    const otherGenre = pool.filter(x => (x.genre === 'Story') !== (p.genre === 'Story'));
    const next = (otherGenre.length ? otherGenre : pool)[0];
    S.passages.push(next);
    S.adaptNote = nextGi > gi ? 'up' : nextGi < gi ? 'down' : 'same';
    $('#passage').innerHTML = '';
    $('#qnav').innerHTML = '';
    $('#question').innerHTML = `
      <div class="sc-review sc-break">
        <div class="sc-break-icon">${next.icon}</div>
        <h3>Part 1 done! 🎉</h3>
        <p>Take a stretch, get a sip of water, then start Part 2. The next passage is <b>${esc(next.title)}</b> (${next.genre.toLowerCase()}).</p>
      </div>`;
    $('#qbuttons').innerHTML = '<button class="btn-primary" id="startPart2">Start Part 2 →</button>';
    $('#startPart2').addEventListener('click', () => {
      S.lastRendered = null;
      S.pIndex = 1;
      S.qIndex = 0;
      renderPassage();
      renderQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    return;
  }
  finishCheckup();
}

/* ===================================================================
   RESULTS & REPORTS
   =================================================================== */
// Practice levels named like many state reading reports. Not an official score.
function levelFor(pct) {
  if (pct >= 0.85) return { name: 'Distinguished', cls: 'l4', note: 'reads this level with strong understanding' };
  if (pct >= 0.65) return { name: 'Proficient', cls: 'l3', note: 'understands most of what they read at this level' };
  if (pct >= 0.45) return { name: 'Developing', cls: 'l2', note: 'understands some of what they read; keep practicing' };
  return { name: 'Beginning', cls: 'l1', note: 'needs support with passages at this level' };
}

function skillTotals(passages) {
  const totals = {};
  for (const p of passages) {
    p.questions.forEach((q, i) => {
      const t = totals[q.skill] || (totals[q.skill] = { points: 0, max: 0 });
      t.points += scoreQuestion(q, S.answers[key(p, i)]);
      t.max += maxPoints(q);
    });
  }
  return totals;
}

function recordResult(passages) {
  const r = S.reader;
  const skills = skillTotals(passages);
  let points = 0, max = 0;
  passages.forEach(p => { const s = passageScore(p); points += s.points; max += s.max; });
  store.best[r.id] = store.best[r.id] || {};
  passages.forEach(p => {
    const s = passageScore(p);
    const pct = Math.round(s.points / s.max * 100);
    store.best[r.id][p.id] = Math.max(store.best[r.id][p.id] ?? 0, pct);
  });
  const entry = {
    date: today(), readerId: r.id, readerName: r.name, avatar: r.avatar, grade: r.grade, mode: S.mode,
    passages: passages.map(p => ({ id: p.id, grade: p.grade, ...passageScore(p) })),
    points, max, skills, mins: Math.max(1, Math.round((Date.now() - S.started) / 60000)),
  };
  store.history.unshift(entry);
  store.history = store.history.slice(0, 100);
  saveStore();
  return entry;
}

function reviewItemsHtml(passages) {
  return passages.map(p => `
    <details class="sc-item-review">
      <summary>${p.icon} ${esc(p.title)} — ${STORY_GRADE_LABEL(p.grade)} ${p.genre.toLowerCase()} · ${passageScore(p).points}/${passageScore(p).max} points</summary>
      ${p.questions.map((q, i) => {
        const ans = S.answers[key(p, i)];
        const pts = scoreQuestion(q, ans);
        return `<div class="sc-item ${pts === maxPoints(q) ? 'right' : pts ? 'partial' : 'wrong'}">
          <div class="sc-item-head"><b>Q${i + 1}.</b> ${esc(q.type === 'ebsr' ? q.partA.prompt : q.prompt)}
            <span class="sc-item-pts">${pts}/${maxPoints(q)} · ${SKILLS[q.skill].name}</span></div>
          <div>Your answer: ${esc(answerText(p, q, ans))}</div>
          ${pts < maxPoints(q) ? `<div>Best answer: <b>${esc(correctAnswerText(q))}</b></div>` : ''}
          <div class="sc-item-why">💡 ${esc(q.explain)}</div>
        </div>`;
      }).join('')}
    </details>`).join('');
}

function answerText(p, q, ans) {
  if (!isAnswered(q, ans)) return '(no answer)';
  switch (q.type) {
    case 'mc': return q.choices[ans];
    case 'ebsr': return `Part A: ${q.partA.choices[ans.a]} · Part B: ${q.partB.choices[ans.b]}`;
    case 'multi': return ans.map(i => q.choices[i]).join(' AND ');
    case 'hottext': return p.paragraphs[ans[0]][ans[1]];
    case 'order': return ans.map((i, n) => `${n + 1}. ${q.items[i]}`).join('  ');
    case 'short': return ans;
  }
  return '';
}

function skillRowsHtml(skills) {
  return Object.keys(SKILLS).filter(s => skills[s]).map(s => {
    const t = skills[s];
    const pct = t.points / t.max;
    const lv = levelFor(pct);
    return `<div class="sc-skill">
      <div class="sc-skill-name">${SKILLS[s].name}</div>
      <div class="sc-skill-bar"><span class="${lv.cls}" style="width:${Math.round(pct * 100)}%"></span></div>
      <div class="sc-skill-score">${t.points}/${t.max}</div>
      <div class="sc-skill-level ${lv.cls}">${lv.name}</div>
    </div>`;
  }).join('');
}

function finishPractice() {
  const p = curPassage();
  const entry = recordResult([p]);
  const pct = entry.points / entry.max;
  if (pct >= 0.8) launchConfetti();
  const lv = levelFor(pct);
  $('#report').innerHTML = `
    <section class="sc-panel sc-report">
      <div class="sc-report-top">
        <div class="sc-big-icon">${p.icon}</div>
        <div>
          <h2 class="result-title">${pct >= 0.8 ? '🌟 Great reading!' : pct >= 0.5 ? '👍 Nice work!' : '💪 Good practice!'}</h2>
          <p class="result-msg">${esc(S.reader.name)} scored <b>${entry.points} of ${entry.max} points</b> on "${esc(p.title)}".</p>
        </div>
        <div class="sc-level ${lv.cls}">${lv.name}</div>
      </div>
      <h3>By skill</h3>
      ${skillRowsHtml(entry.skills)}
      <h3>Answers</h3>
      ${reviewItemsHtml([p])}
      <div class="row-btns sc-row">
        <button class="btn-primary" id="anotherBtn">📚 Read another story</button>
        <button class="btn-secondary" id="retryBtn">🔄 Try this one again</button>
      </div>
    </section>`;
  $('#anotherBtn').addEventListener('click', renderStart);
  $('#retryBtn').addEventListener('click', () => startSession('practice', [p]));
  S.mode = null;
  showScreen('reportScreen');
}

function finishCheckup() {
  const passages = S.passages;
  const entry = recordResult(passages);
  const pct = entry.points / entry.max;
  const lv = levelFor(pct);
  const skills = entry.skills;
  const weakest = Object.keys(skills).sort((a, b) => skills[a].points / skills[a].max - skills[b].points / skills[b].max)[0];
  const p2 = passages[1];
  const p2s = passageScore(p2);
  const adaptText = {
    up: `Part 1 went so well that Part 2 moved <b>up</b> to a ${STORY_GRADE_LABEL(p2.grade)} passage.`,
    down: `Part 2 moved to an easier ${STORY_GRADE_LABEL(p2.grade)} passage to find a comfortable reading level.`,
    same: `Part 2 stayed at ${STORY_GRADE_LABEL(p2.grade)}.`,
  }[S.adaptNote];
  // Where to practice next: the level of Part 2, nudged by how Part 2 went
  const gi2 = gradeIndex(p2.grade);
  const readyGi = Math.max(0, Math.min(STORY_GRADES.length - 1, p2s.points / p2s.max >= 0.8 ? gi2 + 1 : p2s.points / p2s.max < 0.5 ? gi2 - 1 : gi2));
  if (pct >= 0.8) launchConfetti();
  $('#report').innerHTML = `
    <section class="sc-panel sc-report">
      <div class="sc-report-top">
        <div class="sc-big-icon">${S.reader.avatar}</div>
        <div>
          <h2 class="result-title">Reading Check-Up Report</h2>
          <p class="result-msg">${esc(S.reader.name)} · ${STORY_GRADE_LABEL(S.reader.grade)} · ${entry.date} · ${entry.mins} min</p>
        </div>
        <div class="sc-level ${lv.cls}">${lv.name}</div>
      </div>
      <div class="sc-kpis">
        <div><b>${entry.points}/${entry.max}</b><span>points</span></div>
        <div><b>${Math.round(pct * 100)}%</b><span>overall</span></div>
        <div><b>${STORY_GRADE_LABEL(STORY_GRADES[readyGi])}</b><span>suggested practice level</span></div>
      </div>
      <p class="sc-note">📈 ${adaptText} Overall, ${esc(S.reader.name)} ${lv.note}.</p>
      <h3>By skill area</h3>
      ${skillRowsHtml(skills)}
      <div class="sc-tipbox">
        <b>🎯 Focus next: ${SKILLS[weakest].name}</b>
        <p>${SKILLS[weakest].tip}</p>
        <button class="btn-primary sc-small" id="focusDrill">🧩 Practice ${COMP_SKILLS[Comprehension.drillFor(weakest, Comprehension.bandFor(S.reader.grade))].name} now</button>
      </div>
      <h3>Passages</h3>
      ${passages.map((p, n) => { const s = passageScore(p); return `<p>Part ${n + 1}: ${p.icon} <b>${esc(p.title)}</b> — ${STORY_GRADE_LABEL(p.grade)} ${p.genre.toLowerCase()} · ${s.points}/${s.max} points</p>`; }).join('')}
      <h3>Every question</h3>
      ${reviewItemsHtml(passages)}
      <p class="sc-disclaimer">This is practice in the style of school reading check-ups like DRC BEACON, with original passages. The level names are a guide for practice only. They are not an official score and do not predict a state test result.</p>
      <div class="row-btns sc-row">
        <button class="btn-primary" id="homeBtn">📚 Back to stories</button>
        <button class="btn-secondary" id="printBtn">🖨️ Print report</button>
        <button class="btn-outline" id="historyBtn">📊 All results</button>
      </div>
    </section>`;
  $('#homeBtn').addEventListener('click', renderStart);
  const focusSkill = Comprehension.drillFor(weakest, Comprehension.bandFor(S.reader.grade));
  $('#focusDrill').addEventListener('click', () => startDrill(focusSkill));
  $('#printBtn').addEventListener('click', () => { $$('.sc-item-review').forEach(d => { d.open = true; }); window.print(); });
  $('#historyBtn').addEventListener('click', renderHistory);
  S.mode = null;
  showScreen('reportScreen');
}

/* ===== Grown-ups: all results ===== */
function renderHistory() {
  const byReader = {};
  for (const e of store.history) (byReader[e.readerId] = byReader[e.readerId] || []).push(e);
  const sections = Object.values(byReader).map(list => {
    const latest = list.find(e => e.mode === 'checkup');
    const skills = {};
    for (const e of list) for (const [s, t] of Object.entries(e.skills)) {
      skills[s] = skills[s] || { points: 0, max: 0 };
      skills[s].points += t.points;
      skills[s].max += t.max;
    }
    return `<section class="sc-panel">
      <h3>${list[0].avatar || '🙂'} ${esc(list[0].readerName)}</h3>
      ${latest ? `<p>Latest check-up (${latest.date}): <b>${latest.points}/${latest.max}</b> — ${levelFor(latest.points / latest.max).name}</p>` : '<p>No check-ups yet. Practice stories are listed below.</p>'}
      <h4>Skills across all ${list.length} session${list.length === 1 ? '' : 's'}</h4>
      ${skillRowsHtml(skills)}
      <table class="sc-table">
        <thead><tr><th>Date</th><th>Type</th><th>Passages</th><th>Score</th></tr></thead>
        <tbody>${list.slice(0, 15).map(e => `<tr>
          <td>${e.date}</td><td>${e.mode === 'checkup' ? '🎯 Check-up' : e.mode === 'drill' ? '🧩 Skill drill' : '📖 Practice'}</td>
          <td>${e.mode === 'drill' ? esc(e.drill) : e.passages.map(x => `${esc(passageById(x.id)?.title || x.id)} (${STORY_GRADE_LABEL(x.grade)})`).join('<br>')}</td>
          <td>${e.points}/${e.max}</td></tr>`).join('')}</tbody>
      </table>
    </section>`;
  }).join('');
  $('#report').innerHTML = `
    <div class="screen-topbar">
      <button class="back-btn" id="histBack"><span class="back-arrow">←</span> Back</button>
      <h2 class="screen-title">📊 Grown-Ups: Story Check Results</h2>
    </div>
    ${sections || '<section class="sc-panel"><p>No results yet. Results appear here after a reader finishes a story or a check-up.</p></section>'}
    <section class="sc-panel sc-tips">
      <h3>💡 How Story Check works</h3>
      <ul>
        <li><b>Check-Up</b> works like a short school reading check-up: two passages, with the second one moving up or down a grade depending on the first. Use it every few weeks to see growth.</li>
        <li><b>Question types</b> match what kids see at school: multiple choice, two-part (Part A / Part B) evidence questions, "choose two," click the sentence that proves it, put events in order, and short answers. Two-part and choose-two questions are worth 2 points, with partial credit.</li>
        <li><b>Tools</b> like read-aloud, the highlighter, line reader and answer eliminator (✂️) are similar to the tools on online school tests. Practicing with them at home makes test day feel familiar.</li>
        <li><b>Skill Drills</b> practise one skill at a time with short texts. Inference drills add a "detective check": after answering, your child picks the clue that proves it.</li>
        <li><b>Skill areas:</b> ${Object.values(SKILLS).map(s => s.name).join(', ')}. The weakest area in a report comes with a tip you can use at home.</li>
        <li><b>Reading Boost readers</b> show up here automatically, so their grade and reading helpers carry over.</li>
      </ul>
      <p class="sc-disclaimer">Story Check uses original passages and is not affiliated with DRC or any state test. Levels are for practice and do not predict official scores.</p>
    </section>`;
  $('#histBack').addEventListener('click', renderStart);
  S.mode = null;
  showScreen('reportScreen');
}

/* ===== INIT ===== */
renderStart();
