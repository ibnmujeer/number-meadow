/*
 * audio (L5): WebAudio synthesis, no audio files (docs/STYLE.md section 13). Soft chimes and wooden taps
 * at a low master volume. Design hypothesis H4: these are gentler than buzzers or beeps.
 *   - Master gain MASTER_DEFAULT (0.35). Within one play() call the voices that overlap in time sum to at
 *     most PEAK_MAX (0.12) before the master; everything sounding at once is designed to stay under
 *     GLOBAL_PEAK_MAX (0.30) (audio.test.js::densest_sequence).
 *   - Timbre: sine chimes with a long exponential decay; wood is a sine with a short attack (3 ms) and a
 *     decay of at most 180 ms, with a second partial at 2.4 x the frequency where the recipe names one.
 *   - No noise and no Math.random. The context is created only inside a real tap (unlock), so nothing plays
 *     on load; play() returns before creating any node when the sound preference is off.
 */
(function () {
  'use strict';

  NBA.define('audio', ['prefs', 'dom'], (prefs, dom) => {
    const { hasUserActivation } = dom;
    const MASTER_DEFAULT = 0.35, PEAK_MAX = 0.12, GLOBAL_PEAK_MAX = 0.30, PARTIAL = 2.4;
    /** C major pentatonic: C5 D5 E5 G5 A5 (place uses these and their octaves). */
    const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0];
    const C6 = 1046.5, E6 = 1318.51, G6 = 1567.98;

    /** Pitch of the n-th counter of a stack: degree (n - 1) mod 5, one octave up per 5 counters, at most two. */
    function placeFreq(height) {
      const h = Math.max(1, Math.floor(Number(height) || 1));
      return PENTA[(h - 1) % 5] * Math.pow(2, Math.min(Math.floor((h - 1) / 5), 2));
    }

    const AUDIO = {
      ctx: null,
      master: null,

      /** Use this context (unlock does it inside a real tap; the unit tests pass a recording stub). */
      attach(ctx) {
        this.ctx = ctx;
        this.master = ctx.createGain();
        this.master.gain.value = MASTER_DEFAULT;
        this.master.connect(ctx.destination);
      },

      /**
       * Create (once) or resume the AudioContext. Called only from real taps, because browsers block audio
       * that starts without one. If WebAudio is missing, ctx stays null and every sound is skipped.
       */
      unlock() {
        if (!hasUserActivation()) return; // before any real tap, browsers would refuse (and warn)
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          if (!this.ctx) this.attach(new Ctx());
          if (this.ctx.state !== 'running') {
            const p = this.ctx.resume();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          }
        } catch (e) { this.ctx = null; }
      },

      /** One sine voice: attack, then an exponential fade over dur seconds. */
      tone(freq, dur, opt) {
        const o = opt || {};
        const ctx = this.ctx;
        const t0 = ctx.currentTime + (o.when || 0);
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(o.gain, t0 + (o.attack || 0.003));
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g);
        g.connect(this.master);
        osc.start(t0);
        osc.stop(t0 + dur + 0.05);
      },
      /** A wooden note: a short sine plus (when partial > 0) a quieter partial at 2.4 x the frequency. */
      wood(freq, dur, gain, partial, when, slideTo) {
        this.tone(freq, dur, { gain: gain, when: when, slideTo: slideTo });
        if (partial) this.tone(freq * PARTIAL, Math.min(dur, 0.18), { gain: partial, when: when });
      },
      /** A soft chime: a sine with a slow attack and a long decay. */
      chime(freq, decay, gain, when) { this.tone(freq, decay, { gain: gain, when: when, attack: 0.01 }); },

      /** Step 3: who may play sounds (screens registers the current child's sound, off on Grown-ups screens). */
      gate: null,
      setGate(fn) { this.gate = typeof fn === 'function' ? fn : null; },

      /** Play a named sound. Silent when muted (the gate, else the sound preference), without WebAudio or for an unknown name. */
      play(name, arg) {
        if (!this.ctx || !(this.gate ? this.gate() : prefs.get('sound')) || !Object.prototype.hasOwnProperty.call(SOUNDS, name)) return;
        try { SOUNDS[name](this, arg); } catch (e) { /* stay silent */ }
      }
    };

    /** Every sound (STYLE 13 table). Overlap sums before the master are in the comments. */
    const SOUNDS = {
      tap: (a) => a.wood(880, 0.06, 0.07, 0.03),                                        // 0.10
      place: (a, height) => a.wood(placeFreq(height), 0.14, 0.08, 0.02),                // 0.10
      undo: (a) => a.wood(330, 0.12, 0.07, 0, 0, 262),                                  // 0.07
      correct: (a) => {                                                                 // 0.112
        [PENTA[2], PENTA[3], PENTA[4]].forEach((f, i) => a.chime(f, 0.35, 0.028, i * 0.11));
        a.chime(C6, 0.9, 0.028, 0.33);
      },
      // Not yet right: one low wood knock. Never a buzzer, never a falling tone. No partial: it stays under 400 Hz.
      again: (a) => a.wood(196, 0.14, 0.06, 0),                                          // 0.06
      star: (a) => { a.chime(E6, 0.3, 0.05, 0); a.chime(G6, 0.3, 0.05, 0.1); },          // 0.10
      // A counter lands in the basket: a soft wooden plop (at most four, 150 ms apart; takeAway.soundTimes).
      float: (a) => a.wood(440, 0.09, 0.06, 0, 0, 330),                                  // 0.06
      bloom: (a) => {                                                                   // 0.112
        PENTA.forEach((f, i) => a.chime(f, 0.5, 0.028, i * 0.15));
        a.chime(C6, 1.2, 0.028, 0.75);
      }
    };

    return { AUDIO, SOUNDS, placeFreq, PENTA, MASTER_DEFAULT, PEAK_MAX, GLOBAL_PEAK_MAX };
  });
}());
