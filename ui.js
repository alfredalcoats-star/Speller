/* ===================================================================
   UI helpers shared by every page.
   askConfirm() is an in-page confirmation dialog. Browser pop-ups
   (confirm/alert) are blocked in some places the site is shown, such
   as the claude.ai viewer, so pages ask here instead.
   =================================================================== */

function askConfirm(message, { confirmLabel = 'Yes', cancelLabel = 'Cancel', danger = false } = {}) {
  return new Promise(resolve => {
    const back = document.createElement('div');
    back.className = 'ui-confirm-back';
    back.innerHTML = `
      <div class="ui-confirm" role="alertdialog" aria-modal="true" aria-labelledby="uiConfirmMsg">
        <p id="uiConfirmMsg"></p>
        <div class="ui-confirm-actions">
          <button type="button" class="btn-outline" data-r="no"></button>
          <button type="button" class="${danger ? 'btn-danger' : 'btn-primary'}" data-r="yes"></button>
        </div>
      </div>`;
    back.querySelector('#uiConfirmMsg').textContent = message;
    back.querySelector('[data-r="no"]').textContent = cancelLabel;
    back.querySelector('[data-r="yes"]').textContent = confirmLabel;
    const returnFocus = document.activeElement;
    const close = answer => {
      document.removeEventListener('keydown', onKey, true);
      back.remove();
      returnFocus?.focus?.();
      resolve(answer);
    };
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      if (e.key === 'Tab') {   // keep focus inside the dialog
        const btns = [...back.querySelectorAll('button')];
        const i = btns.indexOf(document.activeElement);
        e.preventDefault();
        btns[(i + (e.shiftKey ? btns.length - 1 : 1)) % btns.length].focus();
      }
    };
    back.addEventListener('click', e => {
      const r = e.target.closest('[data-r]')?.dataset.r;
      if (r) close(r === 'yes');
      else if (e.target === back) close(false);
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(back);
    back.querySelector('[data-r="no"]').focus();
  });
}

/* ===================================================================
   Speaking letters. Each letter is sent to the voice as a single CAPITAL
   letter ("E", "I"), which every built-in voice reads as the letter's own
   name. (Made-up spellings like "ee" or "eye" were read wrong by some voices.)
   =================================================================== */
function letterName(ch) { return /^[a-z]$/i.test(ch) ? String(ch).toUpperCase() : ''; }
/** "cat" -> "C. A. T" — a stop after each letter makes every voice say it as a letter
    (apostrophes and hyphens are left out) */
function spellOut(word) { return [...String(word)].map(letterName).filter(Boolean).join('. '); }

/* ---------- The reading voice: a woman's voice ----------
   Browsers don't say which voices are female, so they are known by name.
   When the device is online, the natural-sounding online voices (Microsoft
   "Online (Natural)", Google) are used first; offline, a built-in female
   voice on the device is used. */
const FEMALE_VOICE = /female|woman|girl|samantha|allison|ava\b|susan|victoria|karen|moira|tessa|fiona|serena|kate|zoe|nicky|joelle|noelle|kathy|vicki|zira|hazel|heera|catherine|linda|aria|jenny|emma|michelle|ana\b|ashley|cora|elizabeth|jane|libby|sonia|natasha|clara|nancy|sara|amber|monica|google us english|en-us-x-(sfg|tpc|tpf|iob|iog)|en-gb-x-(gba|gbc|gbg)/i;
const MALE_VOICE = /\bmale\b|\bman\b|david|mark|guy|daniel|alex\b|fred|tom\b|aaron|arthur|rishi|christopher|eric|roger|steffan|ryan|davis|tony|brian|andrew|george|james|oliver|thomas|gordon|lee\b|rocko|reed|grandpa|junior|ralph|albert|bruce|en-us-x-(tpd|iol|iom)|en-gb-x-(gbb|gbd|rjs)/i;
let preferredVoice = null;
function pickVoice() {
  if (!window.speechSynthesis) return;
  let voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
  const online = navigator.onLine !== false;
  // Offline, online voices can't speak, so only the device's own voices are used
  if (!online && voices.some(v => v.localService)) voices = voices.filter(v => v.localService);
  const female = voices.filter(v => FEMALE_VOICE.test(v.name) && !MALE_VOICE.test(v.name.replace(/female/i, '')));
  const us = v => /en[-_]US/i.test(v.lang);
  const natural = v => /natural|neural|online|enhanced|premium/i.test(v.name);
  const rank = v => (online && !v.localService ? 8 : 0) + (natural(v) ? 4 : 0) + (us(v) ? 2 : 0) + (v.localService ? 1 : 0);
  female.sort((a, b) => rank(b) - rank(a));
  // No known female voice: any voice that isn't known to be male, then anything
  preferredVoice = female[0]
    || voices.find(v => us(v) && !MALE_VOICE.test(v.name)) || voices.find(v => !MALE_VOICE.test(v.name))
    || voices[0] || null;
}
if (window.speechSynthesis) {
  pickVoice();
  if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', pickVoice);
  window.addEventListener('online', pickVoice);
  window.addEventListener('offline', pickVoice);
  // Chrome's online voices stop after about 15 seconds of reading; a quick
  // pause/resume every 10 seconds keeps long stories going.
  setInterval(() => {
    if (preferredVoice && !preferredVoice.localService && speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      speechSynthesis.resume();
    }
  }, 10000);
}
/** Give an utterance the reading voice */
function useVoice(u) {
  try { if (preferredVoice) { u.voice = preferredVoice; u.lang = preferredVoice.lang; } } catch (e) { /* use the default voice */ }
  return u;
}
