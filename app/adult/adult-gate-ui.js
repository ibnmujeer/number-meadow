/*
 * adultGateUI (L6): the way into the Grown-ups area (brief O2, O3, D-D). Children must not enter by accident.
 *   'adults'        the gate. No PIN (or no Web Crypto to check one): "Hold to open" for config.adults.gate.holdMs
 *                   (2 s) with a fill on the button, never a number; an early release cancels quietly. A PIN: a
 *                   4-digit pad; after 3 misses in a row the keys rest for 30 s ("Try again in a little while").
 *   'adult-forgot'  Forgot PIN: hold, then a grown-up sum (two numbers from 21 to 59, a new sum after 3 tries);
 *                   success clears only the PIN. It says the PIN only keeps children out by accident.
 *   register(name, def)  every other Grown-ups screen registers here: while the area is locked
 *                   (screens.state.adultOpen false) its render shows the gate instead, so no route skips it.
 *                   def = { load?(params) -> Promise<data>, render(p) (p.data holds the loaded data), after?(sec, p) }
 *   go(name, params)     load, then show a Grown-ups screen (the gate first when locked)
 *   lockOut() / unlocked() / refresh()
 * Sound and speech are off on all of these screens (screens.state.quiet).
 */
(function () {
  'use strict';

  NBA.define('adultGateUI', ['config', 'util', 'dom', 'screens', 'missionUI', 'speech', 'adultGate', 'adultKit'],
    (config, util, dom, screens, missionUI, speech, adultGate, kit) => {
      const G = config.adults.gate;
      const { state } = screens;
      const HOME = { name: 'adult-list', params: {} };
      const DEFS = {};
      let info = { hasPin: false, supported: adultGate.supported() };
      let typed = '', busy = false, msg = '';
      let target = HOME;
      let forgot = { step: 'hold', a: 0, b: 0, tries: 0, msg: '' };

      async function refresh() {
        let has = false;
        try { has = await adultGate.hasPin(); } catch (e) { has = false; }
        info = { hasPin: has, supported: adultGate.supported() };
        return info;
      }
      const pinMode = () => info.hasPin && info.supported;
      function lockOut() { state.adultOpen = false; typed = ''; busy = false; msg = ''; }
      const unlocked = () => state.adultOpen === true;

      function dotsHTML() {
        let d = '';
        for (let i = 0; i < G.pinLength; i++) d += '<span class="pin-dot' + (i < typed.length ? ' on' : '') + '"></span>';
        return '<div class="pin-dots" role="img" aria-label="' + typed.length + ' of ' + G.pinLength + ' digits typed">' + d + '</div>';
      }

      function gateBody() {
        if (pinMode()) {
          const locked = adultGate.lockedFor() > 0;
          const key = (k) => kit.btn('ad-pin-digit', k, { cls: 'pin-key', attrs: { 'data-digit': k, 'aria-label': 'Digit ' + k }, disabled: locked || busy });
          const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key).join('') +
            kit.btn('ad-pin-back', 'Delete', { cls: 'pin-key pin-del', attrs: { 'aria-label': 'Delete' }, disabled: locked || busy }) + key('0');
          return kit.card(kit.text('Type the grown-up PIN.') + dotsHTML() + kit.msg('ad-pin-msg', locked ? 'Try again in a little while' : msg) +
            '<div class="pin-pad">' + keys + '</div>' + kit.btn('ad-forgot', 'Forgot PIN?', { cls: 'ad-quiet' }), 'ad-gate');
        }
        return kit.card(kit.text('Grown-ups only. Press and hold the button.') +
          (info.hasPin ? kit.note('A PIN is set, but this browser cannot check it, so press and hold is used.') : '') +
          kit.holdButton('ad-hold', 'Hold to open'), 'ad-gate');
      }

      function gateHTML(name) { return kit.page(name, 'Grown-ups', gateBody(), { back: 'home', gate: true }); }

      function wireGate(sec) {
        kit.wireHold(sec.querySelector('#ad-hold'), G.holdMs, pass);
        const wait = pinMode() ? adultGate.lockedFor() : 0;
        if (wait > 0) {
          const shown = state.screen;
          setTimeout(() => { if (state.screen === shown && !unlocked()) screens.show(shown, {}); }, wait + 50);
        }
      }

      /** The gate was passed: open the area and show where the adult was going (the child list by default). */
      function pass() {
        state.adultOpen = true;
        typed = ''; msg = ''; busy = false;
        const t = target;
        target = HOME;
        go(t.name, t.params);
      }

      async function go(name, params) {
        const p = params || {};
        if (!unlocked()) {
          target = DEFS[name] ? { name: name, params: p } : HOME;
          await refresh();
          screens.show(DEFS[name] ? name : 'adults', {});
          return;
        }
        const def = DEFS[name];
        let data = null;
        try { data = def.load ? await def.load(p) : null; } catch (e) {
          if (name !== 'adult-list') { go('adult-list', { msg: 'That did not work. Please try again.' }); return; }
        }
        if (unlocked()) screens.show(name, Object.assign({}, p, { data: data }));
      }

      function register(name, def) {
        DEFS[name] = def;
        screens.register(name, {
          render(p) {
            if (!unlocked()) return gateHTML(name);
            return def.render(p || {});
          },
          after(sec, p) {
            if (!unlocked()) { wireGate(sec); return; }
            if (def.after) def.after(sec, p || {});
          }
        });
      }

      screens.register('adults', { render: () => gateHTML('adults'), after: wireGate });

      function forgotBody() {
        const f = forgot;
        let body = kit.text('The PIN only keeps children out by accident. It is not a security lock.');
        if (f.step === 'hold') body += kit.text('First, press and hold the button.') + kit.holdButton('ad-hold', 'Hold to go on');
        else if (f.step === 'sum') {
          body += kit.text('Then answer this grown-up sum.') + '<p class="ad-sum" id="ad-sum-q">What is ' + f.a + ' + ' + f.b + '?</p>' +
            kit.field('ad-sum', 'Answer', { inputmode: 'numeric', maxlength: 3 }) + kit.msg('ad-sum-msg', f.msg) +
            kit.btn('ad-sum-check', 'Check', { go: true });
        } else body += kit.msg('ad-sum-msg', 'The PIN is removed. No child data was changed.') + kit.btn('ad-open', 'Open Grown-ups', { go: true });
        return kit.card(body, 'ad-gate');
      }
      const newSum = () => { forgot.a = util.randInt(G.sumMin, G.sumMax); forgot.b = util.randInt(G.sumMin, G.sumMax); forgot.tries = 0; };

      screens.register('adult-forgot', {
        render: () => kit.page('adult-forgot', 'Forgot PIN', forgotBody(), { back: 'adults-back' }),
        after(sec) {
          kit.wireHold(sec.querySelector('#ad-hold'), G.holdMs, () => { forgot.step = 'sum'; forgot.msg = ''; newSum(); screens.show('adult-forgot'); });
          const input = sec.querySelector('#ad-sum');
          if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); checkSum(); } });
        }
      });

      async function checkSum() {
        const input = document.getElementById('ad-sum');
        const v = input ? String(input.value).trim() : '';
        if (/^\d+$/.test(v) && Number(v) === forgot.a + forgot.b) {
          await adultGate.clearPin();
          await refresh();
          forgot.step = 'done';
          screens.show('adult-forgot');
          return;
        }
        forgot.tries++;
        if (forgot.tries >= G.sumTries) { newSum(); forgot.msg = 'Here is a new sum.'; } else forgot.msg = 'Not this time. Try again.';
        screens.show('adult-forgot');
      }

      function updatePin() {
        const sec = document.querySelector('.screen[data-gate="1"]');
        const dots = sec && sec.querySelector('.pin-dots');
        if (dots) dots.outerHTML = dotsHTML();
        const m = sec && sec.querySelector('#ad-pin-msg');
        if (m) m.textContent = msg;
      }

      screens.registerActions({
        adults() {
          missionUI.leaveRun();
          speech.SPEECH.cancel();
          lockOut();
          target = HOME;
          refresh().then(() => screens.show('adults'));
        },
        'adults-back'() { lockOut(); refresh().then(() => screens.show('adults')); },
        'ad-pin-digit'(el) {
          if (busy || adultGate.lockedFor() > 0 || typed.length >= G.pinLength) return;
          typed += el.getAttribute('data-digit');
          msg = '';
          updatePin();
          if (typed.length < G.pinLength) return;
          busy = true;
          const shown = state.screen;
          adultGate.checkPin(typed).then((r) => {
            typed = ''; busy = false;
            if (r.ok) { pass(); return; }
            msg = r.waitMs > 0 ? '' : 'That PIN did not match. Try again.';
            if (state.screen === shown) screens.show(shown, {});
          });
        },
        'ad-pin-back'() { if (busy) return; typed = typed.slice(0, -1); updatePin(); },
        'ad-forgot'() { forgot = { step: 'hold', a: 0, b: 0, tries: 0, msg: '' }; screens.show('adult-forgot'); },
        'ad-sum-check'() { checkSum(); },
        'ad-open'() { if (forgot.step !== 'done') return; state.adultOpen = true; target = HOME; go('adult-list'); },
        'ad-list'() { go('adult-list'); }
      });

      return { register, go, refresh, lockOut, unlocked, pass, gateHTML, has: (name) => Object.prototype.hasOwnProperty.call(DEFS, name),
        info: () => Object.assign({}, info) };
    });
}());
