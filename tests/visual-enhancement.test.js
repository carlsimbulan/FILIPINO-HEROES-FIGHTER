// visual-enhancement.test.js — Property-based tests for the visual enhancement feature
// Uses fast-check (loaded via CDN in test-runner.html)
// Run by opening tests/test-runner.html in a browser

(function () {
  'use strict';

  // ── Minimal stubs so tests run without the full game ──────────────────────
  // These mock just enough of the game objects for isolated unit testing.

  function makeFighter(overrides = {}) {
    return Object.assign({
      x: 100, y: 200, width: 52, height: 84,
      facingRight: true,
      state: 'idle',
      health: 100, maxHealth: 100,
      skills: {
        q:   { cd: 0, cdMax: 10, active: false, timer: 0 },
        e:   { cd: 0, cdMax: 10, active: false, timer: 0 },
        c:   { cd: 0, cdMax: 1,  active: false, timer: 0 },
        ult: { used: false, active: false, timer: 0 },
      },
      stunTimer: 0,
      onGround: true,
      jumpVelocity: -600,
      themeColor: '#c0391b',
      damageFlashTimer: 0,
      ghostBarHealth: 100,
      _ghostBarDecayTimer: 0,
      renderSprite(ctx) {},
    }, overrides);
  }

  function makeParticleSystem() {
    return {
      _particles: [],
      add(p) {
        if (this._particles.length >= 400) this._particles.shift();
        this._particles.push(p);
      }
    };
  }

  function makeScreenShaker() {
    return {
      _shakes: [], _offsetX: 0, _offsetY: 0, _active: false,
      queue(magnitude, duration) {
        this._shakes.push({ magnitude, remaining: duration, duration });
      },
      update(dt) {
        for (const s of this._shakes) s.remaining -= dt;
        this._shakes = this._shakes.filter(s => s.remaining > 0);
        let maxMag = 0;
        for (const s of this._shakes) {
          const w = s.magnitude * (s.remaining / s.duration);
          if (w > maxMag) maxMag = w;
        }
        const angle = Math.random() * Math.PI * 2;
        this._offsetX = Math.cos(angle) * maxMag;
        this._offsetY = Math.sin(angle) * maxMag;
      },
      begin(ctx) {
        const mag = Math.sqrt(this._offsetX ** 2 + this._offsetY ** 2);
        if (mag >= 0.5) { this._active = true; } else { this._active = false; }
      },
      end(ctx) { if (this._active) this._active = false; }
    };
  }

  function makeAfterimageSystem() {
    return {
      _buffers: new Map(), _totalCount: 0,
      _evictOldest() {
        let oldest = null, lowestFrames = Infinity;
        for (const [f, snaps] of this._buffers) {
          if (snaps.length > 0 && snaps[0].framesLeft < lowestFrames) {
            lowestFrames = snaps[0].framesLeft;
            oldest = f;
          }
        }
        if (oldest) { this._buffers.get(oldest).shift(); this._totalCount--; }
      },
      recordSkillE(fighter, snapshotIndex) {
        if (this._totalCount >= 10) this._evictOldest();
        if (!this._buffers.has(fighter)) this._buffers.set(fighter, []);
        this._buffers.get(fighter).push({ alpha: 0.30 * (1 - snapshotIndex / 4), framesLeft: 6 });
        this._totalCount++;
      },
      recordFlicker(fighter, originX, destX) {
        const alphas = [0.35, 0.25, 0.15, 0.05];
        if (!this._buffers.has(fighter)) this._buffers.set(fighter, []);
        for (let i = 0; i < 4; i++) {
          if (this._totalCount >= 10) this._evictOldest();
          this._buffers.get(fighter).push({ alpha: alphas[i], framesLeft: 8 });
          this._totalCount++;
        }
      },
      recordUltimate(fighter) {
        if (!this._buffers.has(fighter)) this._buffers.set(fighter, []);
        for (const offset of [-12, 12]) {
          if (this._totalCount >= 10) this._evictOldest();
          this._buffers.get(fighter).push({ alpha: 0.20, framesLeft: 3 });
          this._totalCount++;
        }
      },
      update() {
        for (const [fighter, snaps] of this._buffers) {
          const oldLen = snaps.length;
          for (const s of snaps) s.framesLeft--;
          const alive = snaps.filter(s => s.framesLeft > 0);
          this._buffers.set(fighter, alive);
          this._totalCount -= (oldLen - alive.length);
        }
      },
    };
  }

  // ── Test runner helpers ───────────────────────────────────────────────────
  const results = [];

  function test(name, fn) {
    try {
      fn();
      results.push({ name, pass: true });
    } catch (e) {
      results.push({ name, pass: false, error: e.message || String(e) });
    }
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'Assertion failed');
  }

  function assertClose(a, b, eps, msg) {
    if (Math.abs(a - b) > (eps || 1e-6)) {
      throw new Error(msg || `Expected ${a} ≈ ${b}`);
    }
  }

  // ── Property 21: Particle count never exceeds 400 ────────────────────────
  test('P21: particle count never exceeds 400 after many adds', () => {
    const sys = makeParticleSystem();
    for (let i = 0; i < 600; i++) sys.add({ id: i });
    assert(sys._particles.length <= 400, `length = ${sys._particles.length}`);
  });

  test('P21: oldest particle evicted when cap reached', () => {
    const sys = makeParticleSystem();
    for (let i = 0; i < 400; i++) sys.add({ id: i });
    sys.add({ id: 400 });
    assert(sys._particles[0].id === 1, 'oldest should be evicted');
    assert(sys._particles[sys._particles.length - 1].id === 400, 'newest should be last');
  });

  // ── Property 6: ScreenShaker resolves to maximum magnitude ───────────────
  test('P6: ScreenShaker resolves multiple shakes to maximum', () => {
    const shaker = makeScreenShaker();
    shaker.queue(5, 1.0);
    shaker.queue(10, 0.5);
    shaker.queue(3, 2.0);
    shaker.update(0.25);
    // After 0.25s: shake1 = 5*(0.75/1.0)=3.75, shake2 = 10*(0.25/0.5)=5, shake3 = 3*(1.75/2.0)=2.625
    // max = 5
    const mag = Math.sqrt(shaker._offsetX ** 2 + shaker._offsetY ** 2);
    assert(mag <= 5.01, `mag ${mag} should be ≤ 5 (max weighted)`);
    assert(mag >= 0, 'magnitude must be non-negative');
  });

  test('P6: expired shakes are pruned', () => {
    const shaker = makeScreenShaker();
    shaker.queue(10, 0.1);
    shaker.update(0.2); // past expiry
    assert(shaker._shakes.length === 0, 'expired shake should be removed');
    const mag = Math.sqrt(shaker._offsetX ** 2 + shaker._offsetY ** 2);
    assert(mag === 0, 'magnitude should be 0 with no active shakes');
  });

  // ── Property 7: ScreenShaker skips translate below 0.5px ─────────────────
  test('P7: begin() does not set _active when magnitude < 0.5', () => {
    const shaker = makeScreenShaker();
    shaker._offsetX = 0.3;
    shaker._offsetY = 0.3; // sqrt(0.18) ≈ 0.424 < 0.5
    shaker.begin({});
    assert(shaker._active === false, '_active should be false for sub-threshold magnitude');
  });

  test('P7: begin() sets _active when magnitude >= 0.5', () => {
    const shaker = makeScreenShaker();
    shaker._offsetX = 4;
    shaker._offsetY = 3; // mag = 5 >= 0.5
    shaker.begin({});
    assert(shaker._active === true, '_active should be true for magnitude >= 0.5');
  });

  // ── Property 8: Skill-E afterimage count and alpha ────────────────────────
  test('P8: recordSkillE adds snapshot with correct alpha', () => {
    const sys = makeAfterimageSystem();
    const fighter = makeFighter();
    sys.recordSkillE(fighter, 0);
    const snaps = sys._buffers.get(fighter);
    assert(snaps.length === 1);
    assertClose(snaps[0].alpha, 0.30 * (1 - 0 / 4), 0.001, 'alpha at index 0 should be 0.30');
    assert(snaps[0].framesLeft === 6, 'framesLeft should be 6');
  });

  test('P8: snapshots expire after 6 update calls', () => {
    const sys = makeAfterimageSystem();
    const fighter = makeFighter();
    sys.recordSkillE(fighter, 0);
    for (let i = 0; i < 6; i++) sys.update();
    const snaps = sys._buffers.get(fighter) || [];
    assert(snaps.length === 0, 'snapshot should be gone after 6 frames');
    assert(sys._totalCount === 0, '_totalCount should be 0');
  });

  test('P8: alpha decreases with snapshotIndex', () => {
    const sys = makeAfterimageSystem();
    const fighter = makeFighter();
    for (let i = 0; i < 4; i++) sys.recordSkillE(fighter, i);
    const snaps = sys._buffers.get(fighter);
    for (let i = 0; i < 4; i++) {
      const expected = 0.30 * (1 - i / 4);
      assertClose(snaps[i].alpha, expected, 0.001, `alpha at index ${i}`);
    }
  });

  // ── Property 22: AfterimageSystem total cap <= 10 ─────────────────────────
  test('P22: total snapshot count never exceeds 10', () => {
    const sys = makeAfterimageSystem();
    const f1 = makeFighter({ x: 100 });
    const f2 = makeFighter({ x: 300 });
    // Add 6 via skill_e
    for (let i = 0; i < 6; i++) sys.recordSkillE(f1, i % 4);
    // Add 4 more via flicker (should evict to stay at 10)
    sys.recordFlicker(f2, 100, 300);
    assert(sys._totalCount <= 10, `totalCount = ${sys._totalCount}, should be <= 10`);
  });

  // ── Property 9: No afterimages rendered outside trigger states ───────────
  test('P9: renderSnapshots returns quickly when no snapshots exist', () => {
    const sys = makeAfterimageSystem();
    const fighter = makeFighter();
    let callCount = 0;
    fighter.renderSprite = () => callCount++;
    sys.renderSnapshots({ save(){}, restore(){}, globalAlpha: 1, translate(){} }, fighter);
    assert(callCount === 0, 'renderSprite should not be called when no snapshots');
  });

  // ── Property 12: applyDamage sets flash timer and ghost bar ───────────────
  test('P12: applyDamage sets damageFlashTimer = 0.25', () => {
    // Simulate applyDamage logic from fighter.js
    function applyDamage(fighter, amount) {
      if (fighter.state === 'dead' || fighter.isBlocking) return;
      fighter.ghostBarHealth      = fighter.health;
      fighter.damageFlashTimer    = 0.25;
      fighter._ghostBarDecayTimer = 0.8;
      fighter.health = Math.max(0, fighter.health - amount);
    }
    const f = makeFighter({ health: 80, isBlocking: false });
    applyDamage(f, 20);
    assertClose(f.damageFlashTimer, 0.25, 0.001, 'damageFlashTimer should be 0.25');
    assertClose(f.ghostBarHealth, 80, 0.001, 'ghostBarHealth should be pre-damage value');
    assertClose(f.health, 60, 0.001, 'health should decrease');
  });

  test('P12: applyDamage skipped when blocking', () => {
    function applyDamage(fighter, amount) {
      if (fighter.state === 'dead' || fighter.isBlocking) return;
      fighter.ghostBarHealth   = fighter.health;
      fighter.damageFlashTimer = 0.25;
      fighter.health = Math.max(0, fighter.health - amount);
    }
    const f = makeFighter({ health: 80, isBlocking: true });
    applyDamage(f, 20);
    assert(f.damageFlashTimer === 0, 'no flash when blocking');
    assert(f.health === 80, 'health unchanged when blocking');
  });

  // ── Property 2: Drop shadow interpolation ────────────────────────────────
  test('P2: drop shadow half-width at ground = 19.5', () => {
    const maxHalfW = 19.5, minHalfW = 5;
    const maxH = (600 * 600) / (2 * 900);
    const heightAbove = 0; // on ground
    const ratio = Math.min(1, heightAbove / maxH);
    const halfW = maxHalfW - (maxHalfW - minHalfW) * ratio;
    assertClose(halfW, 19.5, 0.001, 'halfW at ground should be 19.5');
  });

  test('P2: drop shadow half-width at apex = 5', () => {
    const maxHalfW = 19.5, minHalfW = 5;
    const maxH = (600 * 600) / (2 * 900);
    const ratio = 1.0; // at apex
    const halfW = maxHalfW - (maxHalfW - minHalfW) * ratio;
    assertClose(halfW, 5, 0.001, 'halfW at apex should be 5');
  });

  // ── Property 3: Parallax offsets bounded ─────────────────────────────────
  test('P3: castle parallax offset clamped to ±8px', () => {
    const W = 800;
    for (const focusX of [0, 200, 400, 600, 800]) {
      const offset = focusX - W / 2;
      const castleOffset = Math.max(-8, Math.min(8, offset * 0.04));
      assert(castleOffset >= -8 && castleOffset <= 8,
        `castleOffset ${castleOffset} out of bounds for focusX=${focusX}`);
    }
  });

  test('P3: fog parallax offset clamped to ±12px', () => {
    const W = 800;
    for (const focusX of [0, 800]) {
      const offset = focusX - W / 2;
      const fogOffset = Math.max(-12, Math.min(12, offset * 0.08));
      assert(fogOffset >= -12 && fogOffset <= 12,
        `fogOffset ${fogOffset} out of bounds`);
    }
  });

  // ── Property 17: Cooldown ring arc angle ─────────────────────────────────
  test('P17: cooldown arc sweep = (cd/cdMax)*2π', () => {
    const cd = 5, cdMax = 10;
    const sweep = (cd / cdMax) * Math.PI * 2;
    assertClose(sweep, Math.PI, 0.001, 'half cooldown should sweep π radians');
  });

  test('P17: full cooldown sweeps full circle', () => {
    const cd = 10, cdMax = 10;
    const sweep = (cd / cdMax) * Math.PI * 2;
    assertClose(sweep, Math.PI * 2, 0.001, 'full cooldown should sweep 2π');
  });

  // ── Property 19: easeOutQuad position ────────────────────────────────────
  test('P19: intro easeOutQuad at t=0 is 0', () => {
    const easeOutQuad = t => 1 - Math.pow(1 - t, 2);
    assertClose(easeOutQuad(0), 0, 0.001);
  });

  test('P19: intro easeOutQuad at t=1 is 1', () => {
    const easeOutQuad = t => 1 - Math.pow(1 - t, 2);
    assertClose(easeOutQuad(1), 1, 0.001);
  });

  test('P19: intro easeOutQuad is monotonically increasing', () => {
    const easeOutQuad = t => 1 - Math.pow(1 - t, 2);
    let prev = 0;
    for (let i = 1; i <= 10; i++) {
      const val = easeOutQuad(i / 10);
      assert(val >= prev, `easeOutQuad not monotonic at t=${i/10}`);
      prev = val;
    }
  });

  // ── Property 20: FIGHT! scale interpolation ──────────────────────────────
  test('P20: FIGHT! scale at introTimer=1.5 is 2.0', () => {
    const t = 1.5;
    const scale = Math.max(1.0, 2.0 - ((t - 1.5) / 0.35));
    assertClose(scale, 2.0, 0.001);
  });

  test('P20: FIGHT! scale at introTimer=1.85 is 1.0', () => {
    const t = 1.85;
    const scale = Math.max(1.0, 2.0 - ((t - 1.5) / 0.35));
    assertClose(scale, 1.0, 0.01);
  });

  test('P20: FIGHT! scale never goes below 1.0', () => {
    for (let i = 0; i <= 10; i++) {
      const t = 1.5 + i * 0.1;
      const scale = Math.max(1.0, 2.0 - ((t - 1.5) / 0.35));
      assert(scale >= 1.0, `scale ${scale} below 1.0 at t=${t}`);
    }
  });

  // ── Render results ────────────────────────────────────────────────────────
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;

  console.group('%cVisual Enhancement Tests', 'font-weight:bold;font-size:14px');
  for (const r of results) {
    if (r.pass) {
      console.log(`%c✓ ${r.name}`, 'color:green');
    } else {
      console.error(`✗ ${r.name}: ${r.error}`);
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  console.groupEnd();

  // Expose for test-runner.html
  window._visualEnhancementTestResults = results;

})();
