/* ===================================================================
   Word Lists — grown-ups' own word lists (weekly spelling words,
   sight words, words from school…), saved on this device and shared
   by SpellingHive games and Reading Boost lessons.

   A list is { id, name, words: [{ word, definition, sentence }], updated }.
   Only `word` is required. Meanings and sentences unlock more games, and
   "Fill in missing meanings" can look them up (online dictionary or Claude).
   =================================================================== */

const WordLists = (() => {
  const KEY = 'customWordLists.v1';
  const MAX_WORDS = 50;
  const WORD_RE = /^[A-Za-z][A-Za-z'-]*$/;

  // Lists are shown inside pages, so drop anything that could act as markup
  const clean = s => String(s ?? '').replace(/<[^>]*>/g, '').replace(/[<>&"`]/g, '').replace(/\s+/g, ' ').trim();
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const wordRe = word => new RegExp(`\\b${word}\\b`, 'i');

  /* ---------- Storage ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { lists: [] }; } catch (e) { return { lists: [] }; }
  }
  function store(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
  }
  const all = () => load().lists;
  const get = id => all().find(l => l.id === id) || null;

  /* ---------- Parsing what a grown-up typed ----------
     One word per line, optionally "word | meaning | sentence".
     "word - meaning" and "word: meaning" also work, and a single line
     of comma-separated words is split into separate words. */
  function parse(text) {
    const lines = /[\n|]/.test(text) ? text.split('\n') : text.split(/[,;]+/);
    const words = [];
    const problems = [];
    const seen = new Set();
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      let parts;
      if (line.includes('|')) parts = line.split('|');
      else {
        const m = line.match(/^(\S+)\s*:\s*(.+)$/) || line.match(/^(\S+)\s+[-–—]\s+(.+)$/);
        parts = m ? [m[1], m[2]] : [line];
      }
      const [word, definition = '', sentence = ''] = parts.map(clean);
      if (!WORD_RE.test(word)) { problems.push(`"${word}" was skipped — use one word per line.`); continue; }
      const key = word.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (words.length >= MAX_WORDS) { problems.push(`Only the first ${MAX_WORDS} words were kept.`); break; }
      let keptSentence = sentence;
      if (sentence && !wordRe(word).test(sentence)) {
        problems.push(`The sentence for "${word}" doesn't use the word, so it was left out.`);
        keptSentence = '';
      }
      words.push({ word, definition, sentence: keptSentence });
    }
    return { words, problems };
  }

  function toText(words) {
    return words.map(w => w.sentence ? `${w.word} | ${w.definition} | ${w.sentence}`
      : w.definition ? `${w.word} | ${w.definition}` : w.word).join('\n');
  }

  function save({ id, name, text }) {
    const { words, problems } = parse(text);
    if (!words.length) return { error: 'Add at least one word.', problems };
    const data = load();
    const list = { id: id || 'wl' + Date.now().toString(36), name: clean(name) || 'My word list', words, updated: Date.now() };
    const at = data.lists.findIndex(l => l.id === list.id);
    if (at >= 0) data.lists[at] = list; else data.lists.push(list);
    if (!store(data)) return { error: 'This browser blocked saving. Lists can\'t be kept on this device.', problems };
    return { list, problems };
  }

  function remove(id) {
    const data = load();
    data.lists = data.lists.filter(l => l.id !== id);
    store(data);
  }

  const counts = list => ({
    words: list.words.length,
    meanings: list.words.filter(w => w.definition).length,
    sentences: list.words.filter(w => w.sentence).length,
  });

  /* ---------- Game entries (same shape as GRADE_WORDS) ----------
     Fields a word doesn't have are left out; each game picks the words it can use.
     `extraDefs` supplies wrong answers when the list itself has too few meanings. */
  function toGameEntries(list, extraDefs = []) {
    const defs = list.words.filter(w => w.definition).map(w => w.definition);
    return list.words.map(w => {
      const entry = { word: w.word, definition: w.definition, custom: true };
      if (w.sentence) {
        entry.sentence = w.sentence.replace(wordRe(w.word), '___');
        entry.contextSentence = w.sentence;
      }
      if (w.definition) {
        const wrong = shuffle([...new Set([...defs, ...shuffle([...extraDefs]).slice(0, 6)])]
          .filter(d => d && d.toLowerCase() !== w.definition.toLowerCase())).slice(0, 3);
        if (wrong.length === 3) {
          const choices = shuffle([w.definition, ...wrong]);
          entry.contextQuestion = `What does '${w.word}' mean?`;
          entry.contextChoices = choices;
          entry.contextAnswer = choices.indexOf(w.definition);
        }
      }
      return entry;
    });
  }

  /* ===================================================================
     EDITOR — the same "My Word Lists" manager on both pages
     =================================================================== */
  function mountEditor(container, { onChange } = {}) {
    let editingId = null;
    const canFill = typeof OnlineWords !== 'undefined';

    function render() {
      const lists = all();
      container.innerHTML = `
        <div class="wl-editor">
          <div class="wl-lists">
            ${lists.length ? lists.map(l => {
              const c = counts(l);
              return `<div class="wl-item">
                <div class="wl-item-text"><b>${esc(l.name)}</b>
                  <small>${c.words} word${c.words === 1 ? '' : 's'} · ${c.meanings} with meanings · ${c.sentences} with sentences</small></div>
                <button type="button" class="btn-outline wl-small" data-wl-edit="${l.id}">✏️ Edit</button>
                <button type="button" class="btn-outline wl-small" data-wl-del="${l.id}" aria-label="Delete ${esc(l.name)}">🗑</button>
              </div>`;
            }).join('') : '<p class="wl-empty">No word lists yet. Make one for this week\'s spelling words, sight words, or any words your child is learning.</p>'}
          </div>
          <button type="button" class="btn-primary" id="wlNew">➕ New word list</button>
          <form class="wl-form hidden" id="wlForm" autocomplete="off">
            <label>List name
              <input name="name" maxlength="40" placeholder="e.g. Week 5 spelling" />
            </label>
            <label>Words
              <textarea name="words" rows="10" spellcheck="false" placeholder="friend&#10;because&#10;brave | ready to face danger | The brave firefighter ran inside."></textarea>
            </label>
            <p class="wl-help">One word per line, or paste words separated by commas. To add a meaning and an example sentence, use bars:
              <code>word | meaning | sentence</code>. Plain words work for spelling and reading. Meanings unlock the matching and meaning games.</p>
            <div class="wl-buttons">
              <button type="submit" class="btn-primary">💾 Save list</button>
              ${canFill ? '<button type="button" class="btn-secondary" id="wlFill">✨ Fill in missing meanings</button>' : ''}
              <button type="button" class="btn-outline" id="wlCancel">Cancel</button>
            </div>
            <p class="wl-status" id="wlStatus" role="status"></p>
          </form>
        </div>`;

      const form = container.querySelector('#wlForm');
      const status = container.querySelector('#wlStatus');
      const open = list => {
        editingId = list ? list.id : null;
        form.elements.name.value = list ? list.name : '';
        form.elements.words.value = list ? toText(list.words) : '';
        status.textContent = '';
        form.classList.remove('hidden');
        container.querySelector('#wlNew').classList.add('hidden');
        form.elements[list ? 'words' : 'name'].focus();
      };

      container.querySelector('#wlNew').addEventListener('click', () => open(null));
      container.querySelectorAll("[data-wl-edit]").forEach(b => b.addEventListener('click', () => open(get(b.dataset.wlEdit))));
      container.querySelectorAll("[data-wl-del]").forEach(b => b.addEventListener('click', () => {
        const list = get(b.dataset.wlDel);
        if (!list || !confirm(`Delete the list "${list.name}"? This can't be undone.`)) return;
        remove(list.id);
        render();
        onChange?.();
      }));
      container.querySelector('#wlCancel').addEventListener('click', render);

      form.addEventListener('submit', e => {
        e.preventDefault();
        const result = save({ id: editingId, name: form.elements.name.value, text: form.elements.words.value });
        if (result.error) { status.textContent = [result.error, ...result.problems].join(' '); return; }
        render();
        const note = container.querySelector('.wl-lists');
        note.insertAdjacentHTML('afterbegin', `<p class="wl-saved">✅ Saved "${esc(result.list.name)}" with ${result.list.words.length} words.${
          result.problems.length ? ' ' + esc(result.problems.join(' ')) : ''}</p>`);
        onChange?.();
      });

      container.querySelector('#wlFill')?.addEventListener('click', async () => {
        const { words, problems } = parse(form.elements.words.value);
        const skipped = problems.length ? ' ' + problems.join(' ') : '';
        const needs = words.filter(w => !w.definition || !w.sentence).map(w => w.word);
        if (!needs.length) {
          form.elements.words.value = toText(words);
          status.textContent = 'Every word already has a meaning and a sentence.' + skipped;
          return;
        }
        const btn = container.querySelector('#wlFill');
        btn.disabled = true;
        status.textContent = `⏳ Looking up ${needs.length} word${needs.length === 1 ? '' : 's'}…`;
        const found = await OnlineWords.describeWords(needs);
        let filled = 0;
        for (const w of words) {
          const f = found[w.word];
          if (!f) continue;
          if (!w.definition && f.definition) { w.definition = cap(f.definition); filled++; }
          if (!w.sentence && f.example && wordRe(w.word).test(f.example)) w.sentence = sentenceCase(f.example);
        }
        form.elements.words.value = toText(words);
        btn.disabled = false;
        const missed = needs.filter(n => !found[n]);
        status.textContent = filled || Object.keys(found).length
          ? `✅ Filled in what we found. Please read them over, change anything you like, then Save.${missed.length ? ` Couldn't find: ${missed.join(', ')}.` : ''}`
          : 'Couldn\'t look words up right now (no internet?). You can type meanings yourself, or save the list as plain words.';
        status.textContent += skipped;
      });
    }
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const sentenceCase = s => { s = cap(s.trim()); return /[.!?]$/.test(s) ? s : s + '.'; };

    render();
  }

  return { all, get, parse, save, remove, counts, toGameEntries, mountEditor };
})();
