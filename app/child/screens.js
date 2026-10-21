/*
 * screens (L5): the child screen kernel (DESIGN 3.3). Screen modules loaded later register
 * their screens and data-action handlers here, so calls such as "show the complete screen"
 * are run-time lookups by name instead of forward module references.
 * Holds the v1 run-time state, showScreen (as show) and the delegated onClick.
 * Step 3: soundOn()/voiceOn() read the current child's settings; the sound and speech gates are registered here;
 * show() marks Grown-ups screens quiet and closes the Grown-ups area (adultOpen) on any child screen.
 */
(function () {
  'use strict';

  NBA.define('screens', ['config', 'util', 'catalog', 'childSettings', 'prefs', 'dom', 'speech', 'audio', 'buddyLooks'],
    (config, util, catalog, childSettings, prefs, dom, speech, audio, buddyLooks) => {
      const { buddyById, toBuddyId, resolveBuddy, DEFAULT_BUDDY } = catalog;
      const { reducedMotion, clearTimers, guardInput } = dom;
      const { SPEECH } = speech;
      const { AUDIO } = audio;

      /** Run-time state (not saved). */
      const state = {
        screen: null,
        pickerFirstRun: false,
        session: { startedAt: null }, // Date.now() at the first Play tap; drives the rest reminder
        run: null,                    // the world being played (see missionUI.startRun)
        storyWorldId: null,           // world shown on the story card
        completeWorldId: null,        // world shown on the World Complete screen
        currentStudent: null,         // the student record playing now (main.js sets it at boot)
        activeStudents: [],           // P6: the active students "Who's playing?" lists (gameUI.refreshPlayers)
        playersFromHome: false,       // P6: the players screen was opened from Home (it shows a Home button)
        quiet: false,                 // step 3: a Grown-ups screen is showing (no sound, no speech)
        adultOpen: false,             // step 3: the gate was passed; any child screen closes the Grown-ups area again
        feedbackIndex: 0,             // step 4: praise and gentle lines shown so far (the rotation index; never reset while the page lives)
        lastLine: null                // step 4: the last praise or gentle line shown, so a line never shows twice in a row
      };

      /** Step 3: the Grown-ups screens are 'adults' (the gate) and every 'adult-*' screen. */
      const isAdultScreen = (name) => name === 'adults' || /^adult-/.test(String(name));
      /** The current child's settings (childSettings: a child without a sound setting uses the device preference). */
      const settings = () => childSettings.settingsOf(state.currentStudent, prefs.get('sound'));
      function soundOn() { return settings().sound; }
      function voiceOn() { return settings().voice; }
      // Sound plays only when the child's sound is on; speech only when sound and voice are on (O4). Never on a Grown-ups screen.
      AUDIO.setGate(() => !state.quiet && soundOn());
      SPEECH.setGate(() => !state.quiet && soundOn() && voiceOn());

      /**
       * The current student's buddy id (a stored retired id is mapped), or null when this student has
       * not picked one yet. The choice is stored in the record field heroId.
       */
      function studentBuddyId() {
        const s = state.currentStudent;
        return s ? toBuddyId(s.heroId) : null;
      }
      /** The chosen buddy's id, or the first buddy. */
      function currentBuddyId() { return currentBuddy().id; }
      function currentBuddy() { return resolveBuddy(studentBuddyId()) || buddyById(DEFAULT_BUDDY); }

      /** Saves a buddy choice (game-ui registers children.setBuddy plus prefs lastHeroId). */
      let buddyWriter = null;
      function setBuddyWriter(fn) { buddyWriter = fn; }
      /** Set the current student's buddy now (synchronously) and save it in the background. Buddy ids only. */
      function setBuddy(buddyId) {
        const s = state.currentStudent;
        if (!s || !buddyById(buddyId)) return;
        s.heroId = buddyId;
        if (buddyWriter) buddyWriter(s.id, buddyId);
        else { try { console.error('[NBA] screens.setBuddy: no buddy writer registered'); } catch (e) { /* ignore */ } }
      }
      /** Step 4: the colour tint and accessory the current child chose ({ tint, accessory }, each null when none). */
      function currentLook() { return buddyLooks.lookOf(state.currentStudent); }
      /** Put the chosen buddy's name into a line of text. */
      function fill(text) {
        const b = currentBuddy();
        return String(text).replace(/\{buddy\}/g, b.name);
      }
      /** Step 4: the rotation index for the next praise or gentle line (advances once per line shown). */
      function nextFeedbackIndex() { const i = state.feedbackIndex || 0; state.feedbackIndex = i + 1; return i; }
      function elapsedPlayMs() { return state.session.startedAt ? Date.now() - state.session.startedAt : 0; }

      // Each screen is a render function that returns one <section class="screen">.
      // Buttons carry data-action; registered actions handle them. after(sec, p)
      // runs once the screen is in the page (stage fitting, speech, sounds).
      const SCREENS = {};
      const ACTIONS = {};
      /** Actions with their own sound (no extra tap click). */
      const OWN_SOUND = {};

      /** Step 11: lookUI registers one function that show() calls with the screen name just before it draws (the app-root look class). */
      let screenHook = null;
      function setScreenHook(fn) { screenHook = typeof fn === 'function' ? fn : null; }

      /** One per screen: { render(params) -> html, after?(sec, params) }. A duplicate is a developer error. */
      function register(name, def) {
        if (Object.prototype.hasOwnProperty.call(SCREENS, name)) throw new Error('[NBA] duplicate screen: ' + name);
        if (!def || typeof def.render !== 'function') throw new Error('[NBA] screen ' + name + ' needs render()');
        SCREENS[name] = def;
      }

      /** Merge data-action handlers; ownSound lists the actions that play their own sound. */
      function registerActions(map, ownSound) {
        Object.keys(map).forEach((name) => {
          if (Object.prototype.hasOwnProperty.call(ACTIONS, name)) throw new Error('[NBA] duplicate action: ' + name);
        });
        Object.keys(map).forEach((name) => { ACTIONS[name] = map[name]; });
        (ownSound || []).forEach((name) => { OWN_SOUND[name] = 1; });
      }

      /**
       * Show one screen. Always in this order: stop speech, cancel game timers,
       * render (this also removes any overlay), then the screen's after hook.
       */
      function show(name, params) {
        if (!Object.prototype.hasOwnProperty.call(SCREENS, name)) throw new Error('[NBA] unknown screen: ' + name);
        const p = params || {};
        state.quiet = isAdultScreen(name);
        if (!state.quiet) state.adultOpen = false;
        SPEECH.cancel();
        clearTimers();
        const app = document.getElementById('app');
        if (screenHook) { try { screenHook(name); } catch (e) { /* the look must never stop a screen */ } }
        app.innerHTML = SCREENS[name].render(p);
        app.scrollTop = 0;
        state.screen = name;
        const sec = app.firstElementChild;
        if (!reducedMotion()) sec.classList.add('enter');
        if (SCREENS[name].after) SCREENS[name].after(sec, p);
        guardInput();
      }

      /** One delegated click listener for the whole game (main.js attaches it to #app once). */
      function onClick(e) {
        if (performance.now() < dom.inputReadyAt()) return; // stray second tap of a double-tap
        const el = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
        if (!el || el.disabled) return;
        const action = el.getAttribute('data-action');
        if (!ACTIONS[action]) return;
        AUDIO.unlock(); // creates or resumes WebAudio on a real tap
        if (!OWN_SOUND[action]) AUDIO.play('tap');
        ACTIONS[action](el);
      }

      /** Called by main.js after boot: throws if any of these screens was never registered. */
      function requireScreens(names) {
        const missing = names.filter((n) => !Object.prototype.hasOwnProperty.call(SCREENS, n));
        if (missing.length) throw new Error('[NBA] missing screens: ' + missing.join(', '));
      }

      /** True once game-ui registered the buddy writer (main.js checks it at boot). */
      function hasBuddyWriter() { return typeof buddyWriter === 'function'; }

      return {
        state, currentBuddyId, currentBuddy, currentLook, studentBuddyId, fill, nextFeedbackIndex, elapsedPlayMs, soundOn, voiceOn, isAdultScreen,
        setBuddy, setBuddyWriter, hasBuddyWriter,
        setScreenHook, register, registerActions, show, onClick, requireScreens
      };
    });
}());
