/* ===================================================================
   Story Library — free stories by grade, plus brand-new stories
   written on request at a child's reading level.

   New stories come from Claude through the claude.ai page's `sample`
   capability. Every new story is checked before it is shown:
     - it must be valid, complete, and the right length for the grade
     - every word passes the kid-safety filter (online-words.js)
     - its reading level is measured with the Flesch-Kincaid formula
     - inference answers must quote a clue that is really in the story
   =================================================================== */

const LIB_KEY = 'storyLibrary.v1';
const READERS_KEY = 'readingBoost.v1';
const GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
const gradeLabel = g => g === 'K' ? 'Kindergarten' : `Grade ${g}`;

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

/* ===== Storage (this device only) ===== */
function loadLib() {
  try { return JSON.parse(localStorage.getItem(LIB_KEY)) || { mine: [], read: {}, grade: null }; }
  catch (e) { return { mine: [], read: {}, grade: null }; }
}
function saveLib() {
  try { localStorage.setItem(LIB_KEY, JSON.stringify(lib)); } catch (e) { /* storage blocked */ }
}
const lib = loadLib();

function firstReader() {
  try {
    const data = JSON.parse(localStorage.getItem(READERS_KEY));
    if (!data) return null;
    return data.profiles[data.activeId] || Object.values(data.profiles)[0] || null;
  } catch (e) { return null; }
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
  $$('.lib-sent.speaking').forEach(s => s.classList.remove('speaking'));
  const b = $('#toolListen');
  if (b) { b.setAttribute('aria-pressed', 'false'); b.textContent = '🔊 Read to me'; }
}

function showToast(msg, type = '') {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ` toast-${type}` : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 2200);
}

function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = $('#confettiContainer');
  const colors = ['#FFC23D', '#0E9F8E', '#6A4FDB', '#E8584C', '#3C66DD'];
  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = `${Math.random() * 100}%`;
    p.style.width = p.style.height = `${6 + Math.random() * 8}px`;
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = `${1.8 + Math.random() * 2}s`;
    p.style.animationDelay = `${Math.random() * 0.5}s`;
    box.appendChild(p);
  }
  setTimeout(() => { box.innerHTML = ''; }, 4500);
}

/* ===================================================================
   READING LEVEL — Flesch-Kincaid grade level
   0.39 × (words ÷ sentences) + 11.8 × (syllables ÷ words) − 15.59
   =================================================================== */
function syllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = word.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}
function readingLevel(text) {
  const sentences = Math.max(1, (text.match(/[.!?]+["')\]]?(\s|$)/g) || []).length);
  const words = text.split(/\s+/).filter(w => /[a-z]/i.test(w));
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  const fk = 0.39 * (words.length / sentences) + 11.8 * (syl / Math.max(1, words.length)) - 15.59;
  return { grade: Math.max(0, Math.round(fk * 10) / 10), words: words.length };
}
const levelText = g => g < 1 ? 'Kindergarten' : `Grade ${Math.min(12, Math.round(g))}`;

/* ===================================================================
   SHELF
   =================================================================== */
const gradeSel = $('#libGrade');
gradeSel.innerHTML = GRADES.map(g => `<option value="${g}">${gradeLabel(g)}</option>`).join('');
const reader = firstReader();
gradeSel.value = lib.grade || (reader?.grade ? String(reader.grade) : '3');
$('#libReader').textContent = reader ? `Set from ${reader.name}'s grade in Reading Boost.` : '';
gradeSel.addEventListener('change', () => { lib.grade = gradeSel.value; saveLib(); renderShelf(); });

function showScreen(id) {
  stopSpeech();
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  $('#navShelf').classList.toggle('active', id === 'shelfScreen');
  $('#navWrite').classList.toggle('active', id === 'writeScreen');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function storyCard(s, { deletable = false } = {}) {
  const words = s.paragraphs.join(' ').split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 90));
  const best = lib.read[s.id];
  return `<div class="lib-card-wrap">
    <button class="lib-card" data-id="${esc(s.id)}">
      <span class="lib-card-icon">${esc(s.icon || '📖')}</span>
      <span class="lib-card-text">
        <b>${esc(s.title)}</b>
        <small>${esc(s.genre)} · ${mins} min read · ${s.questions.length} questions</small>
      </span>
      ${best !== undefined ? `<span class="lib-badge">✓ ${best}%</span>` : s.generated ? '<span class="lib-badge new">New</span>' : ''}
    </button>
    ${deletable ? `<button class="lib-del" data-del="${esc(s.id)}" aria-label="Delete ${esc(s.title)}">🗑</button>` : ''}
  </div>`;
}

function renderShelf() {
  const g = gradeSel.value;
  const built = LIBRARY_STORIES.filter(s => s.grade === g);
  const near = LIBRARY_STORIES.filter(s => s.grade !== g && Math.abs(GRADES.indexOf(s.grade) - GRADES.indexOf(g)) === 1);
  const mineHere = lib.mine.filter(s => s.grade === g);
  $('#shelfTitle').textContent = `${gradeLabel(g)} stories`;
  $('#shelfGrid').innerHTML = [...mineHere, ...built].map(s => storyCard(s)).join('') +
    near.map(s => storyCard(s)).join('').replace(/class="lib-card"/g, 'class="lib-card near"');
  $('#mineSection').hidden = !lib.mine.length;
  $('#mineGrid').innerHTML = lib.mine.map(s => storyCard({ ...s, title: `${s.title}`, genre: `${gradeLabel(s.grade)} · ${s.genre}` }, { deletable: true })).join('');
  $$('.lib-card').forEach(b => b.addEventListener('click', () => openStory(b.dataset.id)));
  $$('.lib-del').forEach(b => b.addEventListener('click', async () => {
    const s = lib.mine.find(x => x.id === b.dataset.del);
    if (!s || !await askConfirm(`Delete "${s.title}" from your stories?`, { confirmLabel: 'Delete story', danger: true })) return;
    lib.mine = lib.mine.filter(x => x.id !== s.id);
    saveLib();
    renderShelf();
  }));
}

function findStory(id) {
  return lib.mine.find(s => s.id === id) || LIBRARY_STORIES.find(s => s.id === id);
}

/* ===================================================================
   READER
   =================================================================== */
const tools = { easy: false, size: 0 };
function applyTools() {
  document.body.classList.toggle('lib-easy', tools.easy);
  document.body.dataset.size = tools.size;
  $('#toolEasy').setAttribute('aria-pressed', tools.easy);
}
$('#toolEasy').addEventListener('click', () => { tools.easy = !tools.easy; applyTools(); });
$('#toolBigger').addEventListener('click', () => { tools.size = (tools.size + 1) % 3; applyTools(); });
$('#toolListen').addEventListener('click', async () => {
  const btn = $('#toolListen');
  if (btn.getAttribute('aria-pressed') === 'true') { stopSpeech(); return; }
  stopSpeech();
  const token = speechToken;
  btn.setAttribute('aria-pressed', 'true');
  btn.textContent = '⏹ Stop';
  for (const el of $$('#storyBody .lib-sent')) {
    if (token !== speechToken) return;
    el.classList.add('speaking');
    const ok = await speak(el.textContent);
    el.classList.remove('speaking');
    if (!ok) return;
  }
  stopSpeech();
});

function sentencesOf(paragraph) {
  return paragraph.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [paragraph];
}

function openStory(id) {
  const s = findStory(id);
  if (!s) return;
  const text = s.paragraphs.join(' ');
  const lvl = readingLevel(text);
  $('#readTitle').textContent = s.title;
  $('#storyBody').innerHTML = `
    <header class="lib-story-head">
      <span class="lib-story-icon">${esc(s.icon || '📖')}</span>
      <div>
        <h1>${esc(s.title)}</h1>
        <p class="lib-meta">
          <span>${gradeLabel(s.grade)}</span><span>${esc(s.genre)}</span>
          <span>${lvl.words} words</span><span>Reading level ≈ ${levelText(lvl.grade)}</span>
          ${s.generated ? '<span class="lib-made">✨ Written for you</span>' : ''}
        </p>
      </div>
    </header>
    ${s.paragraphs.map(p => `<p>${sentencesOf(p).map(t => `<span class="lib-sent">${esc(t.trim())}</span>`).join(' ')}</p>`).join('')}
    <div class="lib-done-reading"><button class="btn-primary" id="startQuestions">I finished reading → Answer questions</button></div>`;
  $('#questionBox').innerHTML = '';
  $('#startQuestions').addEventListener('click', () => runQuestions(s));
  applyTools();
  showScreen('readScreen');
}

function runQuestions(s) {
  stopSpeech();
  $('#startQuestions').parentElement.remove();
  const results = [];
  const box = $('#questionBox');
  const older = GRADES.indexOf(s.grade) >= 6;
  const next = () => {
    if (results.length >= s.questions.length) { finish(); return; }
    const n = results.length;
    box.innerHTML = `<div class="lib-q-head"><b>Question ${n + 1} of ${s.questions.length}</b></div><div id="libQ"></div>`;
    Comprehension.render($('#libQ'), s.questions[n], {
      speak: t => { stopSpeech(); speak(t); },
      older,
      nextLabel: n === s.questions.length - 1 ? 'See my score' : 'Next question →',
      onDone: ok => { results.push(ok); next(); },
    });
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const finish = () => {
    const right = results.filter(Boolean).length;
    const pct = Math.round(right / results.length * 100);
    lib.read[s.id] = Math.max(lib.read[s.id] ?? 0, pct);
    saveLib();
    if (pct >= 75) launchConfetti();
    const more = [...lib.mine, ...LIBRARY_STORIES].filter(x => x.grade === s.grade && x.id !== s.id && lib.read[x.id] === undefined);
    box.innerHTML = `
      <div class="lib-finish">
        <div class="lib-finish-icon">${pct >= 75 ? '🌟' : '💪'}</div>
        <h2>${right} of ${results.length} right on the first try</h2>
        <p>${pct >= 75 ? 'Great reading and thinking!' : 'Nice effort! Reading it again will make it even easier.'}</p>
        <div class="lib-finish-actions">
          ${more.length ? `<button class="btn-primary" id="readNext">Read "${esc(more[0].title)}"</button>` : ''}
          <button class="btn-secondary" id="writeAnother">✨ Write me a new story</button>
          <button class="btn-outline" id="toShelf">Back to the library</button>
        </div>
      </div>`;
    $('#readNext')?.addEventListener('click', () => openStory(more[0].id));
    $('#writeAnother').addEventListener('click', () => openWriter(s.grade));
    $('#toShelf').addEventListener('click', () => { renderShelf(); showScreen('shelfScreen'); });
  };
  next();
}

/* ===================================================================
   WRITE A NEW STORY (Claude, via the claude.ai `sample` capability)
   =================================================================== */
// Length and difficulty targets for each grade
const SPECS = {
  K: { words: [40, 70],   sentence: 'very short sentences of 3 to 6 words, mostly simple one-syllable words and common sight words', choices: 3, events: 3 },
  1: { words: [70, 110],  sentence: 'short sentences of up to 8 words, simple words that a first grader can sound out', choices: 3, events: 3 },
  2: { words: [110, 170], sentence: 'sentences of up to 10 words with everyday vocabulary', choices: 3, events: 3 },
  3: { words: [170, 240], sentence: 'clear sentences with some descriptive words and a little dialogue', choices: 4, events: 4 },
  4: { words: [200, 280], sentence: 'varied sentences, some figurative language, and a few new vocabulary words', choices: 4, events: 4 },
  5: { words: [240, 320], sentence: 'varied sentence lengths and grade-level vocabulary', choices: 4, events: 4 },
  6: { words: [270, 360], sentence: 'richer vocabulary, figurative language and character development', choices: 4, events: 4 },
  7: { words: [300, 400], sentence: 'complex sentences, subtle character motivation and some academic vocabulary', choices: 4, events: 4 },
  8: { words: [320, 420], sentence: 'sophisticated sentences, layered themes and precise academic vocabulary', choices: 4, events: 4 },
};

let samplePromise = null;
function getSample() {
  if (!samplePromise) {
    samplePromise = (window.claude && typeof window.claude.use === 'function')
      ? window.claude.use('sample').catch(() => null)
      : Promise.resolve(null);
  }
  return samplePromise;
}

const writeGrade = $('#writeGrade');
writeGrade.innerHTML = GRADES.map(g => `<option value="${g}">${gradeLabel(g)}</option>`).join('');
let chosenGenre = STORY_GENRES[0].id;
$('#genreGrid').innerHTML = STORY_GENRES.map((g, i) => `
  <label class="lib-genre"><input type="radio" name="genre" value="${g.id}" ${i === 0 ? 'checked' : ''} />
    <span><b>${g.icon}</b>${g.id}</span></label>`).join('');
$('#genreGrid').addEventListener('change', e => { chosenGenre = e.target.value; });

function openWriter(grade) {
  writeGrade.value = grade || gradeSel.value;
  $('#writeStatus').innerHTML = '';
  showScreen('writeScreen');
  checkWriterAvailable();
}
$('#openWriter').addEventListener('click', () => openWriter());
$('#navWrite').addEventListener('click', () => openWriter());
$('#navShelf').addEventListener('click', () => { renderShelf(); showScreen('shelfScreen'); });
$('#backFromWrite').addEventListener('click', () => { renderShelf(); showScreen('shelfScreen'); });
$('#backFromRead').addEventListener('click', () => { renderShelf(); showScreen('shelfScreen'); });

async function checkWriterAvailable() {
  const btn = $('#writeBtn');
  if (!window.claude?.use) {
    btn.disabled = true;
    $('#writeStatus').innerHTML = `<div class="lib-note">Writing new stories works when this site is opened on claude.ai. You can still read every story in the library.</div>`;
    return;
  }
  const sample = await getSample();
  if (!sample) {
    btn.disabled = true;
    $('#writeStatus').innerHTML = `<div class="lib-note">Story writing isn't available here right now. You can still read every story in the library.</div>`;
  }
}

function buildPrompt(grade, genre, topic, long) {
  const spec = SPECS[grade];
  const [lo, hi] = spec.words.map(n => Math.round(n * (long ? 1.4 : 1)));
  const seed = Math.floor(Math.random() * 100000);
  return `Write a brand-new, original ${genre === 'Nonfiction' ? 'nonfiction passage' : `${genre.toLowerCase()} story`} for a ${gradeLabel(grade)} student in the US.
${topic ? `It should be about: ${topic}.` : `Pick a fresh, surprising idea (idea number ${seed}).`}
Rules:
- Length: ${lo} to ${hi} words, in 3 to 7 paragraphs.
- Write at a ${gradeLabel(grade)} reading level: ${spec.sentence}.
- Kid-friendly and school-appropriate: no violence, scary content, romance, brand names, or real living people.
- Give it a clear beginning, middle and end${genre === 'Nonfiction' ? ', with accurate facts' : ''}.
Then write exactly 4 comprehension questions about it:
1. A "main" (main idea) question.
2. An "infer" question whose answer is NOT stated directly, plus "clueQuote": 3 to 10 words copied EXACTLY from the story that prove the answer.
3. A "context" question asking what a specific word or phrase from the story means.
4. A "sequence" question with ${spec.events} events from the story listed in the order they happen.
Questions 1-3 have exactly ${spec.choices} answer choices, with "answer" as the 0-based index of the correct one. Every question has a short "why" explaining the answer to a child.
Reply with ONLY this JSON:
{"title": "...", "icon": "one emoji", "paragraphs": ["...", "..."],
 "questions": [
  {"skill": "main", "q": "...", "choices": ["..."], "answer": 0, "why": "..."},
  {"skill": "infer", "q": "...", "choices": ["..."], "answer": 0, "why": "...", "clueQuote": "..."},
  {"skill": "context", "q": "...", "choices": ["..."], "answer": 0, "why": "..."},
  {"skill": "sequence", "q": "Put these events in order.", "items": ["...", "..."], "why": "..."}
 ]}`;
}

/* Turn Claude's answer into a story the page can use, or explain what's wrong */
function validateStory(data, grade, genre, long) {
  const isStr = x => typeof x === 'string' && x.trim().length > 0;
  const safe = typeof OnlineWords !== 'undefined' ? OnlineWords.isSafeStory : () => true;
  const clean = s => String(s).replace(/<[^>]*>/g, '').replace(/[<>`]/g, '').replace(/\s+/g, ' ').trim();
  if (!data || !isStr(data.title) || !Array.isArray(data.paragraphs) || !Array.isArray(data.questions)) throw new Error('incomplete');
  const paragraphs = data.paragraphs.filter(isStr).map(clean);
  if (paragraphs.length < 2) throw new Error('too short');
  const full = paragraphs.join(' ');
  const spec = SPECS[grade];
  const words = full.split(/\s+/).length;
  if (words < spec.words[0] * 0.6 || words > spec.words[1] * (long ? 1.4 : 1) * 1.6) throw new Error('wrong length');

  const questions = [];
  for (const q of data.questions) {
    if (!q || !isStr(q.q) || !isStr(q.why)) continue;
    if (q.skill === 'sequence') {
      if (Array.isArray(q.items) && q.items.length >= 3 && q.items.every(isStr)) {
        questions.push({ skill: 'sequence', q: clean(q.q), items: q.items.map(clean).slice(0, 5), why: clean(q.why) });
      }
      continue;
    }
    if (!Array.isArray(q.choices) || q.choices.length < 2 || !q.choices.every(isStr)) continue;
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) continue;
    const item = { skill: ['main', 'infer', 'context', 'wh', 'cause'].includes(q.skill) ? q.skill : 'wh',
      q: clean(q.q), choices: q.choices.map(clean), answer: q.answer, why: clean(q.why) };
    if (item.skill === 'infer') {
      const quote = isStr(q.clueQuote) ? clean(q.clueQuote).replace(/^["']|["']$/g, '') : '';
      const sent = quote && full.includes(quote) ? paragraphs.flatMap(sentencesOf).find(t => t.includes(quote)) : null;
      if (sent) {
        // Wrong clue choices: short phrases from other sentences of the same story
        const others = shuffle(paragraphs.flatMap(sentencesOf).filter(t => !t.includes(quote)))
          .map(t => t.trim().split(/\s+/).slice(0, 5).join(' ').replace(/[,.;:!?"]+$/, ''))
          .filter(t => t.split(' ').length >= 3).slice(0, 2);
        if (others.length === 2) {
          const choices = shuffle([quote, ...others]);
          item.text = sent.trim();
          item.clue = { choices, answer: choices.indexOf(quote) };
        }
      }
    }
    questions.push(item);
  }
  if (questions.length < 3) throw new Error('not enough questions');
  const allText = [data.title, ...paragraphs, ...questions.flatMap(q => [q.q, q.why, ...(q.choices || q.items || [])])].join(' ');
  if (!safe(allText)) throw new Error('unsafe');
  const icon = isStr(data.icon) && [...data.icon].length <= 4 ? data.icon : '📖';
  return {
    id: 'gen-' + Date.now().toString(36), grade, genre, icon, title: clean(data.title).slice(0, 70),
    paragraphs, questions, generated: true, created: new Date().toISOString().slice(0, 10),
  };
}

$('#writerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const grade = writeGrade.value;
  const genre = chosenGenre;
  const topic = $('#writeTopic').value.trim().slice(0, 60);
  const long = document.querySelector('input[name="writeLength"]:checked').value === 'long';
  const status = $('#writeStatus');
  const btn = $('#writeBtn');
  if (topic && typeof OnlineWords !== 'undefined' && !OnlineWords.isSafeStory(topic)) {
    status.innerHTML = '<div class="lib-note warn">Let\'s pick a different topic. Try animals, space, sports, a mystery at school…</div>';
    return;
  }
  const sample = await getSample();
  if (!sample) { checkWriterAvailable(); return; }
  btn.disabled = true;
  status.innerHTML = `<div class="lib-writing"><span class="lib-writing-bee">🐝</span>
    <div><b>Writing your ${gradeLabel(grade)} ${genre.toLowerCase()} story…</b><p>This usually takes 10 to 40 seconds.</p></div></div>`;
  let story = null;
  let lastError = null;
  // One automatic retry if the first draft doesn't pass the checks
  for (let attempt = 0; attempt < 2 && !story; attempt++) {
    try {
      const data = await sample.json(buildPrompt(grade, genre, topic, long), { cache: false });
      const candidate = validateStory(data, grade, genre, long);
      // A first draft written far above the requested grade gets one more try
      const measured = readingLevel(candidate.paragraphs.join(' ')).grade;
      if (attempt === 0 && measured > Math.max(1, GRADES.indexOf(grade)) + 3) throw new Error('too hard');
      story = candidate;
    } catch (err) {
      lastError = err;
      if (err && err.code === 'not_granted') break;
      if (err && err.code === 'rate_limited') break;
    }
  }
  btn.disabled = false;
  if (!story) {
    const msg = lastError?.code === 'not_granted'
      ? 'Story writing needs permission to use Claude. Tap "Write my story" again and choose Allow.'
      : lastError?.code === 'rate_limited'
        ? 'Lots of stories are being written right now. Please wait a minute and try again.'
        : 'That story didn\'t pass our checks, so we didn\'t show it. Please try again, maybe with a different topic.';
    status.innerHTML = `<div class="lib-note warn">${esc(msg)}</div>`;
    return;
  }
  lib.mine.unshift(story);
  lib.mine = lib.mine.slice(0, 40);
  saveLib();
  status.innerHTML = '';
  showToast('✨ Your new story is ready!', 'correct');
  openStory(story.id);
});

/* ===== INIT ===== */
renderShelf();
applyTools();
// Deep link: library.html#write opens the story writer
if (location.hash === '#write') openWriter();
