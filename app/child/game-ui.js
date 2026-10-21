/*
 * gameUI (L5): the title, buddy picker, Home, story and World Complete screens and their
 * actions (moved from v1 sections 9 and 10). Loaded after missionUI, so Go calls
 * missionUI.startWorld() directly.
 * P6 (DESIGN 16.2, 17.1): the "Who's playing?" screen (only with 2 or more active children), the
 * Home greeting with the child's name and "Change player", a waiting Meadow Check tile in the footer, above the
 * worlds (from the learning cache), and a visible "Grown-ups" button (data-action adults: the gate and the
 * Grown-ups area live in app/adult, step 3). Every way into a world goes through the baseline lock (P5-N1).
 */
(function () {
  'use strict';

  NBA.define('gameUI',
    ['config', 'util', 'catalog', 'prefs', 'children', 'learning', 'dom', 'audio', 'speech', 'art', 'counters', 'meadowArt', 'screens', 'progression',
      'missionUI', 'checkUI', 'feedback', 'freeplayUI'],
    (config, util, catalog, prefs, children, learning, dom, audio, speech, art, counters, meadowArt, screens, progression, missionUI, checkUI, feedback, freeplayUI) => {
      const { REST_AFTER_MS, TIMING } = config;
      const { esc } = util;
      const { WORLDS, BUDDIES, buddyById, toBuddyId, worldById, worldIndex } = catalog;

      // A buddy choice is saved on the student record (field heroId) and remembered in prefs lastHeroId.
      screens.setBuddyWriter((studentId, buddyId) => {
        children.setBuddy(studentId, buddyId);
        prefs.set('lastHeroId', buddyId);
      });
      const { $, $all, clearTimers, later, replayClass } = dom;
      const { AUDIO } = audio;
      const { SPEECH } = speech;
      const { ICONS, faceHTML, iconBtn } = art;
      /** The visible app name (D1): one constant. */
      const APP_NAME = 'Number Meadow';
      const { state, currentBuddy, currentLook, fill, elapsedPlayMs } = screens;
      const showScreen = screens.show;

      const manyPlayers = () => (state.activeStudents || []).length >= 2;
      /** The sound toggle: the name is always "Sound"; aria-pressed and the pictogram carry the state (STYLE 13). */
      const soundBtn = () => { const on = screens.soundOn(); return iconBtn('sound', on ? 'soundOn' : 'soundOff', 'Sound', ' aria-pressed="' + on + '"'); };

      screens.register('title', {
        render() {
          return '<section class="screen title-screen" data-screen="title">' +
            '<h1 class="game-name">' + APP_NAME + '</h1>' +
            '<div class="title-art">' + faceHTML(currentBuddy().id, 'title-buddy', '', currentLook()) + '</div>' +
            '<button type="button" class="big-btn btn-go play-btn" data-action="play">' + ICONS.play + '<span>Play!</span></button>' +
            '<div class="title-foot">' + soundBtn() + '</div></section>';
        }
      });

      screens.register('picker', {
        render() {
          const chosen = screens.studentBuddyId();
          const cards = BUDDIES.map((b) =>
            '<button type="button" class="buddy-card' + (b.id === chosen ? ' chosen' : '') + '" data-action="buddy" data-buddy="' + b.id +
            '" aria-pressed="' + (b.id === chosen) + '">' + faceHTML(b.id, 'card-face') +
            '<span class="buddy-name">' + esc(b.name) + '</span><span class="tick-badge" aria-hidden="true">' + ICONS.tick + '</span></button>').join('');
          return '<section class="screen picker-screen" data-screen="picker"><header class="bar">' +
            (state.pickerFirstRun ? '' : iconBtn('home', 'home', 'Home')) +
            '<h1 class="screen-title">Pick a buddy!</h1></header>' +
            '<div class="buddy-grid">' + cards + '</div></section>';
        }
      });

      /** P6 (16.2): one big button per active student: buddy face plus the name (escaped). */
      screens.register('players', {
        render() {
          const cur = state.currentStudent;
          const cards = (state.activeStudents || []).map((s) => {
            const on = !!cur && s.id === cur.id;
            return '<button type="button" class="buddy-card player-card' + (on ? ' chosen' : '') + '" data-action="player" data-student="' + esc(s.id) +
              '" aria-pressed="' + on + '">' + faceHTML(s.heroId, 'card-face') +
              '<span class="buddy-name">' + esc(s.name) + '</span></button>';
          }).join('');
          return '<section class="screen picker-screen players-screen" data-screen="players"><header class="bar">' +
            (state.playersFromHome ? iconBtn('home', 'home', 'Home') : '') +
            '<h1 class="screen-title">Who&#39;s playing?</h1></header>' +
            '<div class="buddy-grid">' + cards + '</div></section>';
        }
      });

      screens.register('home', {
        render() {
          const suggested = progression.suggestedWorldId();
          // P5 (DESIGN 16.2): a Meadow Check tile in the footer row while a check is waiting (R3: from the cache; STYLE 11)
          const checkId = checkUI.tileRunId();
          const check = !checkId ? '' : '<button type="button" class="world-tile tile-paper check-tile" data-action="check" data-run="' + esc(checkId) +
            '" aria-label="Meadow Check"><span class="tile-symbol">' + ICONS.check + '</span>' +
            '<span class="tile-text"><span class="tile-name">Meadow Check</span><span class="tile-op">12 short questions</span></span></button>';
          const many = manyPlayers() && state.currentStudent;
          const play = freeplayUI.justPlayHTML(state.currentStudent); // Free Play: the first cell of the footer row
          const note = freeplayUI.noteHTML(); // Free Play: after Take a break, one calm line in place of the title (this render only)
          return '<section class="screen home-screen' + (note ? ' has-note' : '') + '" data-screen="home"><header class="bar home-head">' +
            faceHTML(currentBuddy().id, 'home-buddy', '', currentLook()) + '<span class="hello">Hi, ' + esc(many ? state.currentStudent.name : currentBuddy().name) + '!</span>' +
            (many ? iconBtn('change-player', 'players', 'Change player') : '') +
            iconBtn('picker', 'swap', 'Change buddy') +
            soundBtn() +
            '</header>' + (note || '<h1 class="home-title">' + APP_NAME + '</h1>') +
            meadowArt.homeMapHTML({ done: progression.done, suggested: suggested }) +
            '<div class="home-foot' + (check && play ? ' foot-four' : '') + '">' + play + check +
            '<button type="button" class="mybuddy-btn" data-action="mybuddy">' + faceHTML(currentBuddy().id, 'mybuddy-mini', '', currentLook()) + '<span>My buddy</span></button>' +
            '<button type="button" class="adults-btn" data-action="adults" aria-label="Grown-ups">' +
            ICONS.adults + '<span>Grown-ups</span></button></div>' +
            '</section>';
        },
        after(sec) {
          meadowArt.watchTrail(sec.querySelector('.map'));
          const line = sec.querySelector('.home-note');
          if (line) freeplayUI.speakNote(line.textContent);
        }
      });

      screens.register('story', {
        render(p) {
          const w = worldById(p.worldId);
          return '<section class="screen story-screen" data-screen="story" data-world="' + w.id + '"><header class="bar">' +
            iconBtn('home', 'home', 'Home') + '<h1 class="screen-title">World ' + (worldIndex(w.id) + 1) + ' of ' + WORLDS.length + '</h1></header>' +
            '<div class="card story-card">' +
            '<div class="banner world-' + w.id + '"><span class="tile-glyph">' + meadowArt.worldGlyph(w.id) + '</span>' +
            '<span class="banner-name">' + esc(w.name) + '</span>' + (w.symbol ? '<span class="tile-symbol">' + esc(w.symbol) + '</span>' : '') + '</div>' +
            '<div class="story-art">' + faceHTML(currentBuddy().id, 'story-buddy', '', currentLook()) + '</div>' +
            '<p class="story-text">' + esc(fill(w.story)) + '</p>' +
            '<button type="button" class="big-btn btn-go go-btn" data-action="go"><span>Go!</span>' + ICONS.next + '</button>' +
            '</div></section>';
        },
        after(sec, p) {
          state.storyWorldId = p.worldId;
          later(() => SPEECH.say(fill(worldById(p.worldId).story)), TIMING.STORY_SPEAK);
        }
      });

      screens.register('complete', {
        render(p) {
          const w = worldById(p.worldId);
          const next = WORLDS[worldIndex(w.id) + 1];
          // step 4: a calm card: the heading, one sentence about what the child did, the scene line; no count, no best, no petals
          const done = feedback.worldComplete({ index: screens.nextFeedbackIndex() });
          state.completeLines = done;
          return '<section class="screen complete-screen" data-screen="complete" data-world="' + w.id + '">' +
            faceHTML(currentBuddy().id, 'win-buddy', '', currentLook()) +
            '<h1 class="win-title">' + esc(done.heading) + '</h1>' +
            '<p class="win-effort">' + esc(done.sentence) + '</p>' +
            '<p class="win-line">' + esc(fill(w.win)) + '</p>' +
            (w.finale ? '<p id="master-line" class="master-line">' + esc(fill(w.finale)) + '</p>' : '') +
            (elapsedPlayMs() >= REST_AFTER_MS ? '<p id="rest-line" class="rest-line">' + esc(feedback.restLine()) + '</p>' : '') +
            '<div class="win-buttons">' +
            (next ? '<button type="button" class="big-btn btn-go wide" data-action="nextworld"><span>Next world</span>' + ICONS.next + '</button>' : '') +
            '<button type="button" class="big-btn btn-warm" data-action="again">' + ICONS.again + '<span>Play again</span></button>' +
            '<button type="button" class="big-btn btn-quiet" data-action="home">' + ICONS.home + '<span>Home</span></button>' +
            '</div></section>';
        },
        after(sec, p) {
          state.completeWorldId = p.worldId;
          const w = worldById(p.worldId);
          const lines = [state.completeLines.sentence, fill(w.win)];
          if (w.finale) lines.push(fill(w.finale));
          if (elapsedPlayMs() >= REST_AFTER_MS) lines.push(feedback.restLine());
          AUDIO.play('bloom');
          later(() => SPEECH.say(lines.join(' ')), TIMING.STORY_SPEAK);
        }
      });


      /** P5-N1: every way into a world opens a waiting required baseline first. */
      function lockedOpen() {
        const locked = checkUI.lockedRunId();
        if (locked) { checkUI.start(locked, { locked: true }); return true; }
        return false;
      }

      /** P6: refresh the active children the players screen lists (boot, tests). */
      async function refreshPlayers() {
        try { state.activeStudents = await children.activeStudents(); } catch (e) { state.activeStudents = state.currentStudent ? [state.currentStudent] : []; }
        return state.activeStudents;
      }

      /** P6: make an active child the current player: their buddy, stars and learning cache. */
      async function selectStudent(id) {
        let s = (state.activeStudents || []).find((x) => x.id === id) || null;
        if (!s) { try { s = await children.get(id); } catch (e) { s = null; } }
        if (!s || s.status !== 'active') return null;
        missionUI.leaveRun();
        state.run = null;
        await learning.loadStudent(s.id);
        state.currentStudent = s;
        prefs.set('lastStudentId', s.id);
        const b = toBuddyId(s.heroId); // only a buddy id is ever written (spec 5.3)
        if (b) prefs.set('lastHeroId', b);
        return s;
      }

      screens.registerActions({
        play() {
          AUDIO.unlock();
          if (!state.session.startedAt) state.session.startedAt = Date.now();
          if (manyPlayers()) { // P6 (D4): "Who's playing?" only with 2 or more active students
            state.playersFromHome = false;
            showScreen('players');
            SPEECH.say("Who's playing?", { now: true });
            return;
          }
          state.pickerFirstRun = !screens.studentBuddyId();
          showScreen(state.pickerFirstRun ? 'picker' : 'home');
          // Spoken inside the tap: this also unlocks speech on iOS.
          SPEECH.say(state.pickerFirstRun ? 'Pick a buddy!' : "Let's go, " + currentBuddy().name + '!', { now: true });
        },
        player(el) {
          const id = el.getAttribute('data-student');
          $all('.player-card').forEach((c) => { c.disabled = true; });
          selectStudent(id).then((s) => {
            if (!s) { showScreen('players'); return; }
            state.pickerFirstRun = !screens.studentBuddyId();
            showScreen(state.pickerFirstRun ? 'picker' : 'home');
            SPEECH.say(state.pickerFirstRun ? 'Pick a buddy!' : "Let's go, " + currentBuddy().name + '!');
          });
        },
        'change-player'() {
          missionUI.leaveRun();
          state.playersFromHome = true;
          showScreen('players');
          SPEECH.say("Who's playing?");
        },
        buddy(el) {
          const b = buddyById(el.getAttribute('data-buddy'));
          if (!b) return;
          clearTimers(); // a second quick pick restarts the wait
          screens.setBuddy(b.id);
          $all('.buddy-card').forEach((c) => {
            c.classList.toggle('chosen', c === el);
            c.setAttribute('aria-pressed', String(c === el));
          });
          replayClass(el, 'pop');
          AUDIO.play('star');
          SPEECH.say('You picked ' + b.name + '!');
          state.pickerFirstRun = false;
          later(() => showScreen('home'), TIMING.PICK_TO_HOME);
        },
        home() { missionUI.leaveRun(); showScreen('home'); }, // leaving a run records an abandoned question, ends the session
        picker() { state.pickerFirstRun = false; showScreen('picker'); },
        async sound(el) {
          // Step 3 (O4): the toggle shows the current child's sound; a child with their own setting keeps it in step.
          // That write comes first: if it fails, nothing changes (memory, prefs and the toggle keep the stored setting).
          const on = !screens.soundOn();
          const s = state.currentStudent;
          if (s && typeof s.sound === 'boolean') {
            let r = null;
            try { r = await children.setSettings(s.id, { sound: on }); } catch (e) { r = null; }
            if (!r || !r.ok) return;
            s.sound = on;
          }
          prefs.set('sound', on);
          el.setAttribute('aria-pressed', String(on));
          el.innerHTML = on ? ICONS.soundOn : ICONS.soundOff;
          if (on) { AUDIO.play('tap'); SPEECH.say('Sound on!'); } else SPEECH.cancel();
        },
        world(el) {
          // P5 (DESIGN 15.4): a student whose baseline is still waiting plays it before the worlds
          if (lockedOpen()) return;
          const w = worldById(el.getAttribute('data-world'));
          if (w) showScreen('story', { worldId: w.id });
        },
        check(el) { checkUI.start(el.getAttribute('data-run')); },
        go() { if (!lockedOpen()) missionUI.startWorld(state.storyWorldId || WORLDS[0].id, 0); },
        again() { if (!lockedOpen()) showScreen('story', { worldId: state.completeWorldId || WORLDS[0].id }); },
        nextworld() {
          if (lockedOpen()) return;
          const next = WORLDS[worldIndex(state.completeWorldId) + 1];
          if (next) showScreen('story', { worldId: next.id });
        }
      }, ['buddy', 'sound']);

      return { selectStudent, refreshPlayers };
    });
}());
