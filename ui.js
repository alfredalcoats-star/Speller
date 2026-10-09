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
