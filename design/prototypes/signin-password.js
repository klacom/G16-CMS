/*
 * Shared behaviour for the "set a new password" form on reset-password.html and
 * accept-invite.html (DESIGN.md: Sign-in pages). Prototype only: nothing is sent.
 */
(function () {
  const $ = id => document.getElementById(id);
  const ERR_ICON = '<svg aria-hidden="true" class="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>';
  const EYE_OPEN = '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>';
  const EYE_SHUT = '<path d="M3 3l18 18"/><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>';
  const SPIN = '<svg aria-hidden="true" class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9"/></svg>';

  /* Field error, keeping any hint or rules list in aria-describedby. */
  function setError(id, text) {
    const el = $(id), err = $(id + '-err');
    el.setAttribute('aria-invalid', text ? 'true' : 'false');
    if (text) { err.innerHTML = ERR_ICON + `<span>${text}</span>`; err.classList.add('show'); }
    else { err.classList.remove('show'); err.textContent = ''; }
    const base = (el.dataset.describedby || '').split(' ').filter(Boolean);
    const ids = text ? [...base, id + '-err'] : base;
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
    else el.removeAttribute('aria-describedby');
    return text || '';
  }

  /* Show / hide buttons: any button with data-toggles="<input id>". */
  document.querySelectorAll('[data-toggles]').forEach(btn => {
    const input = $(btn.dataset.toggles);
    btn.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      btn.querySelector('svg').innerHTML = show ? EYE_SHUT : EYE_OPEN;
    });
  });

  /* Caps Lock hint on every password field. */
  document.querySelectorAll('input[data-caps]').forEach(input => {
    const hint = $(input.dataset.caps);
    input.addEventListener('keyup', e => hint.classList.toggle('hidden', !e.getModifierState?.('CapsLock')));
  });

  /*
   * Password rules shown from the start. Each <li data-rule> gets data-met as it is
   * satisfied; never red before the form is sent.
   */
  function initNewPassword({ pw, confirm, email }) {
    const rules = {
      length: v => v.length >= 12,
      email: v => {
        const name = (email() || '').split('@')[0].toLowerCase();
        return v.length > 0 && !(name && v.toLowerCase().includes(name));
      },
    };
    const items = [...document.querySelectorAll('[data-rule]')];
    const update = () => {
      const v = $(pw).value;
      items.forEach(li => {
        const met = rules[li.dataset.rule](v);
        li.dataset.met = String(met);
        li.querySelector('.sr-state').textContent = met ? ' (done)' : '';
      });
    };
    let confirmTouched = false;
    const checkPw = () => {
      const v = $(pw).value;
      if (!v) return 'Enter a new password';
      if (!rules.length(v)) return 'Use at least 12 characters';
      if (!rules.email(v)) return "Choose a password that doesn't include your email name";
      return '';
    };
    const checkConfirm = () => {
      const v = $(confirm).value;
      if (!v) return 'Type your new password again';
      if (v !== $(pw).value) return "The two passwords don't match. Type the same password in both";
      return '';
    };
    $(pw).addEventListener('input', () => {
      update();
      if ($(pw).getAttribute('aria-invalid') === 'true') setError(pw, checkPw());
      if (confirmTouched && $(confirm).value) setError(confirm, checkConfirm());
    });
    $(confirm).addEventListener('blur', () => { if ($(confirm).value) { confirmTouched = true; setError(confirm, checkConfirm()); } });
    $(confirm).addEventListener('input', () => { if ($(confirm).getAttribute('aria-invalid') === 'true') setError(confirm, checkConfirm()); });
    update();
    return { checkPw, checkConfirm, reset() { confirmTouched = false; $(pw).value = ''; $(confirm).value = ''; setError(pw, ''); setError(confirm, ''); update(); } };
  }

  /* Error summary listing each problem as a link to its field (DESIGN.md: Errors). */
  function showSummary(summaryId, errors, labels) {
    const s = $(summaryId);
    if (!errors.length) { s.classList.add('hidden'); return false; }
    s.querySelector('ul').innerHTML = errors.map(([id, m]) =>
      `<li><a href="#${id}" class="text-error font-semibold underline underline-offset-4" data-focus="${id}">${labels[id]}: ${m}</a></li>`).join('');
    s.classList.remove('hidden');
    s.focus();
    return true;
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-focus]');
    if (a) { e.preventDefault(); $(a.dataset.focus).focus(); }
  });

  function busy(btn, label) {
    btn.dataset.label = btn.textContent.trim();
    btn.disabled = true;
    btn.innerHTML = SPIN + label;
  }
  function unbusy(btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }

  /* Show exactly one of the page's states: [data-state="name"]. */
  function showState(name, focusId) {
    document.querySelectorAll('[data-state]').forEach(n => n.classList.toggle('hidden', n.dataset.state !== name));
    if (focusId) $(focusId).focus();
  }

  window.SignIn = { $, setError, initNewPassword, showSummary, busy, unbusy, showState };
})();
