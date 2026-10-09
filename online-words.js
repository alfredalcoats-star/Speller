/* ===================================================================
   Online Words — fresh practice words from the internet
   Shared by SpellingHive games and Reading Boost lessons.

   Sources, tried in order:
     1. Free public word APIs (no key needed):
          Datamuse        https://www.datamuse.com/api/   (words, frequency, definitions)
          Free Dictionary https://dictionaryapi.dev/      (definitions + example sentences)
     2. Claude, through the claude.ai page's `sample` capability — used when
        the page can't reach the web APIs (for example inside claude.ai).
     3. Nothing — callers keep using their built-in word lists.

   Every word, whatever its source, passes the same checks: a kid-safety
   filter, and for phonics levels a decodability check that only accepts
   words built from the sounds a child has already been taught.
   Results are cached on this device so lessons don't wait on the network.
   =================================================================== */

const OnlineWords = (() => {
  const CACHE_PREFIX = 'onlineWords.v1:';
  const FRESH_FOR_MS = 12 * 60 * 60 * 1000;   // refetch at most twice a day
  const TIMEOUT_MS = 7000;

  /* ---------- Kid-safety filter ---------- */
  // Word starts that are never OK in a children's lesson…
  const BLOCKED_STARTS = [
    'sex', 'porn', 'nude', 'naked', 'rape', 'kill', 'murder', 'suicide', 'drug', 'cocaine', 'vodka',
    'drunk', 'rifle', 'pistol', 'bomb', 'terror', 'slave', 'nazi', 'shit', 'fuck', 'bitch', 'bastard',
    'piss', 'pussy', 'boob', 'slut', 'whore', 'nigg', 'retard', 'spaz', 'cunt', 'twat', 'wank', 'corpse',
    'torture', 'abuse', 'erotic', 'casino', 'gambl', 'cigar', 'tobacco', 'stupid', 'idiot', 'satan',
    'demon', 'lynch', 'genit', 'beer', 'whiskey', 'liquor',
  ];
  // …and whole words that are fine inside longer words ("hello", "father", "button")
  const BLOCKED_WORDS = [
    'ass', 'arse', 'tit', 'tits', 'dick', 'cock', 'crap', 'damn', 'hell', 'fag', 'gay', 'gun', 'guns',
    'heroin', 'meth', 'weed', 'wine', 'dead', 'die', 'dies', 'died', 'death', 'stab', 'lust', 'breast',
    'butt', 'poop', 'pee', 'hate', 'hated', 'dumb', 'fat', 'ugly', 'devil', 'hang', 'hanged', 'vape',
  ];
  const BLOCK_RE = new RegExp(`\\b(${BLOCKED_STARTS.join('|')})|\\b(${BLOCKED_WORDS.join('|')})\\b`, 'i');
  const isSafe = text => !BLOCK_RE.test(text || '');

  /* ---------- Small helpers ---------- */
  const shuffle = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  // Fetched text is shown in the page, so drop anything that could act as markup
  const clean = s => String(s).replace(/<[^>]*>/g, '').replace(/[<>&"`]/g, '').replace(/\s+/g, ' ').trim();
  const sentence = s => { s = cap(s.trim()); return /[.!?]$/.test(s) ? s : s + '.'; };
  const freqOf = item => {
    const tag = (item.tags || []).find(t => t.startsWith('f:'));
    return tag ? parseFloat(tag.slice(2)) : 0;
  };

  async function getJSON(url) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ctl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  const datamuse = params =>
    getJSON('https://api.datamuse.com/words?' + new URLSearchParams({ max: '1000', ...params }));

  /* Free Dictionary: the first sense that has an example sentence using the word */
  async function dictionaryEntry(word) {
    try {
      const data = await getJSON('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word));
      const wordRe = new RegExp(`\\b${word}\\b`, 'i');
      for (const entry of data) {
        for (const meaning of entry.meanings || []) {
          for (const d of meaning.definitions || []) {
            // The example must use the word; the definition must not (that would give the answer away)
            if (d.example && wordRe.test(d.example) && !wordRe.test(d.definition) && d.example.split(/\s+/).length >= 4) {
              return { definition: d.definition, example: d.example };
            }
          }
        }
      }
    } catch (e) { /* no entry for this word */ }
    return null;
  }

  /* Claude via the claude.ai `sample` capability (null outside claude.ai) */
  let samplePromise = null;
  function getSample() {
    if (!samplePromise) {
      samplePromise = (window.claude && typeof window.claude.use === 'function')
        ? window.claude.use('sample').catch(() => null)
        : Promise.resolve(null);
    }
    return samplePromise;
  }
  async function askClaude(prompt) {
    const sample = await getSample();
    if (!sample) return null;
    try {
      return await sample.json(prompt, { modelTier: 'quick' });
    } catch (e) {
      return null;   // not_granted, rate_limited, bad JSON… fall back to built-in words
    }
  }

  /* ---------- Cache ---------- */
  function readCache(key) {
    try { return JSON.parse(localStorage.getItem(CACHE_PREFIX + key)); } catch (e) { return null; }
  }
  function writeCache(key, items, source) {
    try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), items, source })); } catch (e) { /* ignore */ }
  }

  // Shares in-flight requests and serves fresh cache without touching the network
  const inflight = {};
  function cached(key, build) {
    const hit = readCache(key);
    if (hit && hit.items.length && Date.now() - hit.at < FRESH_FOR_MS) return Promise.resolve(hit.items);
    if (!inflight[key]) {
      inflight[key] = build()
        .then(({ items, source }) => {
          if (items.length) { writeCache(key, items, source); return items; }
          return hit ? hit.items : [];          // keep yesterday's words rather than none
        })
        .catch(() => (hit ? hit.items : []))
        .finally(() => { delete inflight[key]; });
    }
    return inflight[key];
  }

  /* ===================================================================
     GRADE VOCABULARY (SpellingHive games + Reading Boost vocab step)
     Returns entries shaped like GRADE_WORDS so every game can use them.
     =================================================================== */
  const TOPICS = [
    'animal', 'ocean', 'space', 'weather', 'food', 'sport', 'music', 'garden', 'forest', 'school',
    'family', 'friendship', 'travel', 'science', 'art', 'farm', 'city', 'river', 'mountain', 'holiday',
    'game', 'book', 'machine', 'history', 'insect', 'bird', 'volcano', 'invention', 'journey', 'kitchen',
  ];
  // Word frequency (per million words) and length suit each grade: common
  // short words for little kids, rarer academic words for older ones.
  const GRADE_BANDS = {
    K: { minF: 60, maxF: Infinity, minLen: 3, maxLen: 5 },
    1: { minF: 35, maxF: Infinity, minLen: 3, maxLen: 6 },
    2: { minF: 20, maxF: 400, minLen: 4, maxLen: 7 },
    3: { minF: 10, maxF: 150, minLen: 5, maxLen: 9 },
    4: { minF: 5,  maxF: 80,  minLen: 5, maxLen: 10 },
    5: { minF: 3,  maxF: 50,  minLen: 6, maxLen: 11 },
    6: { minF: 2,  maxF: 30,  minLen: 6, maxLen: 12 },
    7: { minF: 1,  maxF: 20,  minLen: 7, maxLen: 13 },
    8: { minF: 0.5, maxF: 15, minLen: 7, maxLen: 14 },
  };
  const GRADE_NAMES = { K: 'kindergarten' };

  function toGameEntry(word, definition, example, otherDefs, source) {
    definition = clean(definition);
    example = clean(example);
    otherDefs = otherDefs.map(d => clean(d || ''));
    const wordRe = new RegExp(`\\b${word}\\b`, 'i');
    const def = cap(definition.replace(/\.$/, '').trim());
    const wrong = shuffle(otherDefs.filter(d => d && d.toLowerCase() !== def.toLowerCase())).slice(0, 3).map(cap);
    if (wrong.length < 3) return null;
    const choices = shuffle([def, ...wrong]);
    const context = sentence(example);
    return {
      word,
      definition: def,
      sentence: context.replace(wordRe, '___'),
      contextSentence: context,
      contextQuestion: `What does '${word}' mean in this sentence?`,
      contextChoices: choices,
      contextAnswer: choices.indexOf(def),
      source,
    };
  }

  async function gradeWordsFromWeb(grade, exclude) {
    const band = GRADE_BANDS[grade] || GRADE_BANDS[1];
    const topics = shuffle([...TOPICS]).slice(0, 3);
    const lists = await Promise.all(topics.map(t => datamuse({ ml: t, md: 'dfp', max: '200' })));
    const seen = new Set(exclude);
    const candidates = shuffle(lists.flat().filter(item => {
      const w = item.word;
      if (!/^[a-z]+$/.test(w) || seen.has(w)) return false;
      seen.add(w);
      const f = freqOf(item);
      const tags = item.tags || [];
      return w.length >= band.minLen && w.length <= band.maxLen &&
        f >= band.minF && f <= band.maxF &&
        item.defs && item.defs.length &&
        !tags.includes('prop') && tags.some(t => ['n', 'v', 'adj'].includes(t)) &&
        isSafe(w) && isSafe(item.defs.join(' '));
    })).slice(0, 18);

    const found = (await Promise.all(candidates.map(async item => {
      const entry = await dictionaryEntry(item.word);
      if (!entry || !isSafe(entry.example) || !isSafe(entry.definition)) return null;
      return { word: item.word, ...entry };
    }))).filter(Boolean);

    // Wrong answer choices come from the other words' definitions
    const pool = [
      ...found.map(f => f.definition),
      ...candidates.map(c => (c.defs[0] || '').split('\t').pop()),
    ];
    const items = found
      .map(f => toGameEntry(f.word, f.definition, f.example, pool.filter(d => d !== f.definition), 'web'))
      .filter(Boolean)
      .slice(0, 8);
    if (items.length < 4) throw new Error('not enough web words');
    return items;
  }

  async function gradeWordsFromClaude(grade, exclude) {
    const gradeName = GRADE_NAMES[grade] || `grade ${grade}`;
    const theme = TOPICS[new Date().getDate() % TOPICS.length];   // stable per day, so answers can be cached
    const data = await askClaude(
      `Create 8 vocabulary words for a ${gradeName} student in the US, loosely themed around "${theme}". ` +
      `Words must be kid-friendly, single lowercase English words, and NOT any of: ${exclude.join(', ')}. ` +
      `For each word give a short kid-friendly definition, one example sentence that uses the exact word once ` +
      `and gives context clues to its meaning, and 3 short wrong definitions that are plausible but clearly wrong. ` +
      `Reply with only a JSON array of objects: [{"word": "...", "definition": "...", "sentence": "...", "wrong": ["...", "...", "..."]}]`
    );
    if (!Array.isArray(data)) throw new Error('no Claude words');
    const items = data.map(d => {
      if (!d || typeof d.word !== 'string' || !/^[a-z]+$/.test(d.word) || exclude.includes(d.word)) return null;
      if (typeof d.sentence !== 'string' || !new RegExp(`\\b${d.word}\\b`, 'i').test(d.sentence)) return null;
      if (!Array.isArray(d.wrong) || ![d.definition, d.sentence, ...d.wrong].every(t => typeof t === 'string' && isSafe(t))) return null;
      if (!isSafe(d.word)) return null;
      return toGameEntry(d.word, d.definition, d.sentence, d.wrong, 'claude');
    }).filter(Boolean);
    if (items.length < 4) throw new Error('not enough Claude words');
    return items;
  }

  /** Fresh vocabulary for a grade: up to 8 GRADE_WORDS-shaped entries (or []) */
  function gradeWords(grade, exclude = []) {
    grade = String(grade);
    return cached(`grade:${grade}`, async () => {
      try { return { items: await gradeWordsFromWeb(grade, exclude), source: 'web' }; }
      catch (e) { /* web blocked or offline */ }
      try { return { items: await gradeWordsFromClaude(grade, exclude), source: 'claude' }; }
      catch (e) { return { items: [], source: 'none' }; }
    });
  }

  /* ===================================================================
     DECODABLE WORDS (Reading Boost phonics levels)
     A word is only used if it can be sounded out with units already taught.
     =================================================================== */
  // Every spelling unit we recognise, longest first, including ones the
  // program never teaches — so "her", "saw" or "ball" can't sneak into a
  // short-vowel level disguised as h-e-r, s-a-w or b-a-l-l.
  const ALL_UNITS = [
    'eigh', 'tch', 'dge', 'igh', 'all', 'alk', 'old', 'ind', 'ild', 'ost',
    'sh', 'ch', 'th', 'ck', 'll', 'ss', 'ff', 'zz', 'qu', 'wh', 'wr', 'kn', 'ph', 'gh', 'ng',
    'ai', 'ay', 'ee', 'ea', 'oa', 'ar', 'or', 'er', 'ir', 'ur',
    'aw', 'au', 'ow', 'ou', 'oi', 'oy', 'oo', 'ew', 'ue', 'ie', 'ei', 'ey', 'ui', 'wa',
    ...'abcdefghijklmnopqrstuvwxyz'.split(''),
  ];
  const VOWEL_UNITS = new Set(['a', 'e', 'i', 'o', 'u', 'ai', 'ay', 'ee', 'ea', 'oa', 'ar', 'or', 'er', 'ir', 'ur']);

  // What each level adds, and what an online word must practise to count
  const LEVEL_RULES = {
    1: { add: ['a', 'm', 's', 't', 'p', 'n', 'c'], focus: ['a'] },
    2: { add: ['i', 'f', 'd', 'h', 'g'], focus: ['i'] },
    3: { add: ['o', 'b', 'l', 'r'], focus: ['o'] },
    4: { add: ['u', 'e', 'j', 'w', 'k'], focus: ['u', 'e'] },
    5: { add: ['sh', 'ch', 'th', 'ck', 'll', 'ss', 'ff', 'zz', 'ng'], focus: ['sh', 'ch', 'th', 'ck'] },
    6: { add: ['v', 'x', 'y', 'z', 'qu'], focus: 'blend' },
    7: { add: [], focus: 'magic' },
    8: { add: ['ai', 'ay', 'ee', 'ea', 'oa'], focus: ['ai', 'ay', 'ee', 'ea', 'oa'] },
    9: { add: ['ar', 'or', 'er', 'ir', 'ur'], focus: ['ar', 'or', 'er', 'ir', 'ur'] },
  };
  // Datamuse spelling patterns that tend to hit each level's focus
  const LEVEL_PATTERNS = {
    1: ['?a?', '??a?', '?a??'], 2: ['?i?', '??i?', '?i??'], 3: ['?o?', '??o?', '?o??'],
    4: ['?u?', '??u?', '?u??', '?e?', '??e?', '?e??'],
    5: ['*sh*', '*ch*', '*th*', '*ck*'],
    6: ['??a??', '??i??', '??o??', '??u??', '??e??', '?a???', '?i???'],
    7: ['?a?e', '??a?e', '?i?e', '??i?e', '?o?e', '??o?e', '?u?e'],
    8: ['*ai*', '*ay', '*ee*', '*ea*', '*oa*'],
    9: ['*ar*', '*or*', '*er', '*ir*', '*ur*'],
  };
  // Levels 11–14 split words into meaningful chunks instead of sounds
  const CHUNK_RULES = {
    11: { patterns: ['*ing', '*ed', '*est', '*ful', '*less', '*ly'], suffixes: ['ing', 'est', 'ful', 'less', 'ed', 'ly'] },
    12: { patterns: ['un*', 're*', 'pre*', 'dis*', 'mis*'],
          prefixes: { un: /\bnot\b|opposite|revers|remove|lack/, re: /again|anew|back/, pre: /before|in advance|earlier/,
                      dis: /\bnot\b|opposite|lack|remove|apart|absence/, mis: /wrong|bad|incorrect|mistak/ } },
    13: { patterns: ['*tion', '*sion', '*ture', '*ous'], suffixes: ['tion', 'sion', 'ture', 'ous'] },
    14: { patterns: ['*tele*', '*graph*', '*port*', '*struct*', '*dict*', '*scope*'],
          roots: ['struct', 'graph', 'scope', 'tele', 'port', 'dict'] },
  };

  function allowedUnits(levelId) {
    const set = new Set();
    for (let id = 1; id <= Math.min(levelId, 9); id++) LEVEL_RULES[id].add.forEach(u => set.add(u));
    return set;
  }

  function splitUnits(text) {
    const out = [];
    let i = 0;
    while (i < text.length) {
      const unit = ALL_UNITS.find(u => text.startsWith(u, i));
      out.push(unit);
      i += unit.length;
    }
    return out;
  }

  /** Grapheme parts ("c|a_e|k" style) if `word` is decodable at `levelId`, else null */
  function decode(word, levelId) {
    const allowed = allowedUnits(levelId);
    let parts;
    const magic = word.match(/^([^aeiou]*)([aeiou])([bcdfgklmnprstvz])e$/);
    if (magic) {
      if (levelId < 7) return null;                      // silent e not taught yet
      parts = [...splitUnits(magic[1]), magic[2] + '_e', magic[3]];
    } else {
      parts = splitUnits(word);
    }
    for (const p of parts) {
      const base = p.includes('_') ? p[0] : p;
      if (!allowed.has(base)) return null;
    }
    if (parts.includes('y') && parts.indexOf('y') !== 0) return null;   // y as a vowel isn't taught
    const vowels = parts.filter(p => p.includes('_') || VOWEL_UNITS.has(p)).length;
    if (vowels !== 1) return null;                                       // one syllable only
    // Must practise this level's focus
    const rule = LEVEL_RULES[levelId];
    if (rule.focus === 'magic') { if (!magic) return null; }
    else if (rule.focus === 'blend') {
      const single = p => p.length === 1 && !VOWEL_UNITS.has(p);
      if (!parts.some((p, k) => single(p) && single(parts[k + 1] || ''))) return null;
    } else if (!parts.some(p => rule.focus.includes(p))) return null;
    return parts;
  }

  /** Meaningful chunks for levels 11–14, or null */
  function chunk(word, levelId) {
    const rule = CHUNK_RULES[levelId];
    if (levelId === 11 || levelId === 13) {
      // Level 11 bases are checked against the dictionary separately (see verifySuffixWords)
      const suf = rule.suffixes.find(s => word.endsWith(s) && word.length - s.length >= 3);
      return suf ? [word.slice(0, -suf.length), suf] : null;
    }
    if (levelId === 12) {
      const pre = Object.keys(rule.prefixes).sort((a, b) => b.length - a.length).find(p => word.startsWith(p));
      if (!pre || word.length - pre.length < 3) return null;
      return [pre, word.slice(pre.length)];
    }
    if (levelId === 14) {
      const root = rule.roots.find(r => word.includes(r));
      if (!root) return null;
      const at = word.indexOf(root);
      return [word.slice(0, at), root, word.slice(at + root.length)].filter(Boolean);
    }
    return null;
  }

  function checkLevelWord(word, levelId) {
    if (!/^[a-z]+$/.test(word) || !isSafe(word)) return null;
    if (levelId <= 9) return word.length <= 7 ? decode(word, levelId) : null;
    if (CHUNK_RULES[levelId]) return chunk(word, levelId);
    return null;
  }

  async function isRealWord(w, minF) {
    try {
      const hit = await datamuse({ sp: w, md: 'f', max: '1' });
      return hit.length > 0 && hit[0].word === w && freqOf(hit[0]) >= minF;
    } catch (e) { return false; }
  }

  /* "help|ful" and "un|lock" are real affix words; "fam|ily" and "re|ach" are not.
     Level 11: the base must be a real word. Level 12: the definition must carry the
     prefix's meaning ("not", "again"…) or the rest must be a real word. */
  async function verifyAffixWords(found, levelId) {
    const checks = await Promise.all(found.map(async f => {
      if (levelId === 11) {
        const [base, suf] = f.parts;
        if (['ing', 'ed', 'est'].includes(suf) && f.headword && [base, base + 'e'].includes(f.headword)) return true;
        return isRealWord(base, 1);
      }
      const [pre, rest] = f.parts;
      if (CHUNK_RULES[12].prefixes[pre].test(f.def)) return true;
      return isRealWord(rest, 2);
    }));
    return found.filter((_, k) => checks[k]);
  }

  async function levelWordsFromWeb(levelId, exclude) {
    const patterns = (LEVEL_PATTERNS[levelId] || CHUNK_RULES[levelId]?.patterns);
    if (!patterns) return [];
    const minF = levelId <= 9 ? 3 : 1.5;
    const lists = await Promise.all(patterns.map(sp => datamuse({ sp, md: 'fdp' })));
    const seen = new Set(exclude);
    const out = [];
    for (const item of shuffle(lists.flat())) {
      if (seen.has(item.word)) continue;
      seen.add(item.word);
      const tags = item.tags || [];
      if (freqOf(item) < minF || !item.defs || tags.includes('prop')) continue;
      const def = item.defs.join(' ');
      if (!isSafe(def)) continue;
      const parts = checkLevelWord(item.word, levelId);
      if (parts) out.push({ word: item.word, parts, source: 'web', headword: item.defHeadword, def });
      if (out.length >= 24) break;
    }
    const verified = (levelId === 11 || levelId === 12 ? await verifyAffixWords(out, levelId) : out)
      .map(({ word, parts, source }) => ({ word, parts, source }));
    if (verified.length < 4) throw new Error('not enough web words');
    return verified;
  }

  async function levelWordsFromClaude(level, exclude) {
    const units = level.id <= 9 ? [...allowedUnits(level.id)].join(', ') : '';
    const ask = level.id <= 9
      ? `List 20 common, kid-friendly, one-syllable English words that a beginning reader can sound out using ONLY ` +
        `these letter-sound units: ${units}${level.id >= 7 ? ', plus silent-e (like cake, bike)' : ''}. ` +
        `Every word must practise: ${level.focus}. No words with silent letters or irregular spellings.`
      : `List 20 common, kid-friendly English words that practise: ${level.focus}. ` +
        (level.id === 11 ? 'Each must be a real base word plus the suffix (like help + ful), not a word that just ends in those letters. ' : '') +
        (level.id === 12 ? 'Each must be the prefix plus a real word (like un + lock), not a word that just starts with those letters. ' : '');
    const data = await askClaude(
      `${ask} Do not include: ${exclude.join(', ')}. Reply with only a JSON array of lowercase strings.`
    );
    if (!Array.isArray(data)) throw new Error('no Claude words');
    const out = [];
    for (const w of new Set(data.filter(x => typeof x === 'string').map(x => x.trim().toLowerCase()))) {
      if (exclude.includes(w)) continue;
      // Claude's suggestions must pass the same decodability check as web words
      const parts = checkLevelWord(w, level.id);
      if (parts) out.push({ word: w, parts, source: 'claude' });
    }
    if (out.length < 4) throw new Error('not enough Claude words');
    return out;
  }

  /** Fresh decodable words for a Reading Boost level: [{word, parts, source}] (or []) */
  function levelWords(level, exclude = []) {
    if (!LEVEL_RULES[level.id] && !CHUNK_RULES[level.id]) return Promise.resolve([]);
    return cached(`level:${level.id}`, async () => {
      try { return { items: await levelWordsFromWeb(level.id, exclude), source: 'web' }; }
      catch (e) { /* web blocked or offline */ }
      try { return { items: await levelWordsFromClaude(level, exclude), source: 'claude' }; }
      catch (e) { return { items: [], source: 'none' }; }
    });
  }

  /** Where the last cached words for `key` came from: 'web', 'claude', 'none' or null */
  function sourceOf(key) { return readCache(key)?.source ?? null; }

  /** Race a promise against a timeout, resolving `fallback` if it's slow */
  function within(promise, ms, fallback = []) {
    return Promise.race([promise, new Promise(r => setTimeout(() => r(fallback), ms))]);
  }

  return { gradeWords, levelWords, sourceOf, within, isSafe, decode, chunk };
})();
