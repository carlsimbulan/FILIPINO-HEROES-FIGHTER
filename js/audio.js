// audio.js — Web Audio API sound system (procedural, no files needed)

const Audio = (() => {
  let ctx = null;
  let bgGain = null;
  let sfxGain = null;
  let bgPlaying = false;
  let bgNodes = [];
  let bgLoopTimer = null;

  function _init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.7; sfxGain.connect(ctx.destination);
  }

  function _musicAllowed() {
    if (typeof PlayerStats === 'undefined') return true;
    try { return PlayerStats.get().musicOn !== false; } catch (e) { return true; }
  }

  function _ensureBgGain() {
    if (!bgGain) {
      bgGain = ctx.createGain();
      bgGain.gain.value = 0.35;
      bgGain.connect(ctx.destination);
    }
  }

  function _resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  // ── Utility ────────────────────────────────────────────────
  function _osc(type, freq, start, dur, gainVal, target = sfxGain, bend = null) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (bend) o.frequency.linearRampToValueAtTime(bend, start + dur);
    g.gain.setValueAtTime(gainVal, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(target);
    o.start(start); o.stop(start + dur);
  }

  function _noise(start, dur, gainVal, filterFreq = 2000, target = sfxGain) {
    const bufSize = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter); filter.connect(g); g.connect(target);
    src.start(start); src.stop(start + dur);
  }

  // ── Background Music ───────────────────────────────────────
  // Epic Filipino-inspired loop using layered oscillators
  function startBgMusic() {
    _init();
    if (bgPlaying || !_musicAllowed()) return;
    _ensureBgGain();
    bgPlaying = true;

    const now = ctx.currentTime;
    const bpm = 90;
    const beat = 60 / bpm;

    // Bass drone
    const bassO = ctx.createOscillator();
    const bassG = ctx.createGain();
    bassO.type = 'sawtooth';
    bassO.frequency.value = 55; // A1
    bassG.gain.value = 0.12;
    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 180;
    bassO.connect(bassFilter); bassFilter.connect(bassG); bassG.connect(bgGain);
    bassO.start();
    bgNodes.push(bassO, bassG);

    // Melody — repeating heroic phrase
    const melody = [
      [440,0],[494,1],[523,2],[494,3],[440,4],[392,5],[440,6],[0,7],
      [523,8],[587,9],[659,10],[587,11],[523,12],[494,13],[523,14],[0,15],
      [440,16],[494,17],[523,18],[587,19],[659,20],[587,21],[523,22],[494,23],
      [440,24],[392,25],[349,26],[392,27],[440,28],[0,29],[440,30],[0,31]
    ];

    function scheduleMelody(offset) {
      melody.forEach(([freq, step]) => {
        if (freq === 0) return;
        const t = now + offset + step * beat * 0.5;
        _osc('triangle', freq, t, beat * 0.45, 0.18, bgGain);
        // harmony a 5th above
        _osc('sine', freq * 1.5, t, beat * 0.45, 0.06, bgGain);
      });
    }

    const loopLen = 16 * beat * 0.5; // 16 half-beats
    // Schedule 8 loops (melody + bass only — no drum layer)
    for (let i = 0; i < 8; i++) {
      scheduleMelody(i * loopLen);
    }

    // Auto restart after ~60s
    if (bgLoopTimer) clearTimeout(bgLoopTimer);
    bgLoopTimer = setTimeout(() => {
      bgLoopTimer = null;
      bgPlaying = false;
      startBgMusic();
    }, 58000);
  }

  function stopBgMusic() {
    if (bgLoopTimer) {
      clearTimeout(bgLoopTimer);
      bgLoopTimer = null;
    }
    bgNodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} });
    bgNodes = [];
    if (bgGain) {
      try { bgGain.disconnect(); } catch (e) {}
      bgGain = null;
    }
    bgPlaying = false;
  }

  // ── SFX ────────────────────────────────────────────────────

  function playButton() {
    _init(); _resume();
    const t = ctx.currentTime;
    _osc('sine', 660, t, 0.06, 0.4, sfxGain, 880);
    _osc('sine', 880, t + 0.05, 0.08, 0.3, sfxGain);
  }

  function playFreeHit() {
    _init(); _resume();
    const t = ctx.currentTime;
    _noise(t, 0.06, 0.5, 2500);
    _osc('square', 220, t, 0.08, 0.25, sfxGain, 110);
  }

  function playLightAttack() {
    _init(); _resume();
    const t = ctx.currentTime;
    _osc('sawtooth', 300, t, 0.12, 0.35, sfxGain, 150);
    _noise(t, 0.08, 0.3, 3000);
  }

  function playHeavyAttack() {
    _init(); _resume();
    const t = ctx.currentTime;
    _osc('sawtooth', 180, t, 0.2, 0.5, sfxGain, 80);
    _noise(t, 0.15, 0.4, 1200);
    _osc('square', 120, t + 0.05, 0.15, 0.2, sfxGain);
  }

  function playHit() {
    _init(); _resume();
    const t = ctx.currentTime;
    _noise(t, 0.1, 0.6, 1800);
    _osc('square', 160, t, 0.08, 0.3, sfxGain, 80);
  }

  function playBlock() {
    _init(); _resume();
    const t = ctx.currentTime;
    _osc('square', 440, t, 0.05, 0.4, sfxGain);
    _osc('square', 550, t + 0.03, 0.08, 0.3, sfxGain);
    _noise(t, 0.06, 0.2, 4000);
  }

  function playSkillQ() {
    _init(); _resume();
    const t = ctx.currentTime;
    // Rising power-up
    _osc('sawtooth', 200, t,      0.15, 0.4, sfxGain, 400);
    _osc('sawtooth', 250, t+0.1,  0.15, 0.35, sfxGain, 500);
    _osc('square',   300, t+0.2,  0.2,  0.5, sfxGain, 600);
    _noise(t + 0.3, 0.1, 0.25, 2000);
  }

  function playSkillE() {
    _init(); _resume();
    const t = ctx.currentTime;
    // Rapid flurry whoosh
    for (let i = 0; i < 5; i++) {
      _osc('sawtooth', 350 + i * 40, t + i * 0.06, 0.08, 0.3, sfxGain, 200);
      _noise(t + i * 0.06, 0.05, 0.2, 3000 + i * 200);
    }
  }

  function playSkillC() {
    _init(); _resume();
    const t = ctx.currentTime;
    // Shield up clang
    _osc('triangle', 880, t, 0.05, 0.5, sfxGain);
    _osc('sine', 660, t + 0.03, 0.15, 0.4, sfxGain);
    _noise(t, 0.08, 0.3, 5000);
  }

  function playUltimate() {
    _init(); _resume();
    const t = ctx.currentTime;
    // Big epic boom
    _osc('sawtooth', 80, t,      0.4, 0.6, sfxGain, 40);
    _osc('sawtooth', 120, t,     0.4, 0.5, sfxGain, 60);
    _osc('square',   160, t+0.1, 0.3, 0.4, sfxGain, 80);
    _noise(t, 0.3, 0.7, 800);
    _noise(t + 0.2, 0.2, 0.5, 3000);
    // High whoosh
    _osc('sine', 1200, t + 0.1, 0.3, 0.3, sfxGain, 400);
  }

  function playStun() {
    _init(); _resume();
    const t = ctx.currentTime;
    // Electric zap
    _noise(t, 0.15, 0.6, 6000);
    _osc('square', 800, t, 0.1, 0.3, sfxGain, 200);
    _osc('square', 600, t + 0.05, 0.1, 0.25, sfxGain, 150);
  }

  function playDeath() {
    _init(); _resume();
    const t = ctx.currentTime;
    _osc('sawtooth', 200, t, 0.5, 0.5, sfxGain, 50);
    _noise(t, 0.3, 0.5, 600);
    _osc('sine', 300, t + 0.1, 0.4, 0.3, sfxGain, 80);
  }

  function playVictory() {
    _init(); _resume();
    const t = ctx.currentTime;
    // Fanfare
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      _osc('triangle', f, t + i * 0.12, 0.3, 0.5, sfxGain);
      _osc('sine', f * 1.5, t + i * 0.12, 0.25, 0.25, sfxGain);
    });
    _osc('sine', 1047, t + 0.5, 0.4, 0.4, sfxGain);
  }

  function playDefeat() {
    _init(); _resume();
    const t = ctx.currentTime;
    const notes = [392, 330, 294, 220];
    notes.forEach((f, i) => {
      _osc('triangle', f, t + i * 0.18, 0.3, 0.4, sfxGain);
    });
  }

  // Start audio context on first user interaction
  function unlockOnInteraction() {
    _init();
    _resume();
    if (_musicAllowed() && !bgPlaying) startBgMusic();
    document.removeEventListener('click', unlockOnInteraction);
    document.removeEventListener('keydown', unlockOnInteraction);
  }
  document.addEventListener('click', unlockOnInteraction);
  document.addEventListener('keydown', unlockOnInteraction);

  return {
    startBgMusic, stopBgMusic,
    playButton, playFreeHit,
    playLightAttack, playHeavyAttack,
    playHit, playBlock,
    playSkillQ, playSkillE, playSkillC,
    playUltimate, playStun,
    playDeath, playVictory, playDefeat
  };
})();
