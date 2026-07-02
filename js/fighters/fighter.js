// fighter.js — Fighter base class

class Fighter {
  constructor(x) {
    this.name = 'Fighter';
    this.x = x;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.width = 50;
    this.height = 80;
    this.facingRight = true;
    this.onGround = false;

    // stats
    this.maxHealth = 100;
    this.health = 100;

    // combat state
    this.state = 'idle'; // idle|walk|attack_light|attack_heavy|hurt|dead|skill_q|skill_e|skill_c|ultimate
    this.attackActive = false;
    this.attackType = null;       // 'light'|'heavy'|'free'|'q_stun'|'e_spin'|'ult'|null
    this.attackCooldown = 0;      // frames remaining
    this.attackFrameTimer = 0;    // frames remaining in current attack animation
    this.lastAttackDamageDealt = false;
    this.hurtTimer = 0;
    this._freeHitCooldown = 0;    // frames remaining for free hit cooldown

    // subclass stats (overridden)
    this.lightDamage = 5;
    this.heavyDamage = 10;
    this.lightRange = 70;
    this.heavyRange = 90;
    this.lightDuration = 15;
    this.heavyDuration = 25;
    this.moveSpeed = 220;
    this.jumpVelocity = -600;

    // skills
    this.skills = {
      q:   { cdMax: 0, cd: 0, active: false, timer: 0 },
      e:   { cdMax: 0, cd: 0, active: false, timer: 0 },
      c:   { cdMax: 0, cd: 0, active: false, timer: 0 },
      ult: { used: false, active: false, timer: 0 }
    };

    this.stunTimer = 0;
    this.isBlocking = false;

    // double jump
    this._jumpsLeft = 2;

    // ── Visual enhancement fields ──────────────────────────
    this.themeColor          = '#888888'; // overridden by subclasses
    this.damageFlashTimer    = 0;         // seconds; drives white health bar flash
    this.ghostBarHealth      = this.health; // pre-damage health snapshot
    this._ghostBarDecayTimer = 0;         // tracks 0.8s ghost bar shrink

    // place on ground using live globals (set by main.js resize)
    this.y = GROUND_Y - GROUND_HEIGHT - this.height;
  }

  // ── Hitboxes ──────────────────────────────────────────────
  getHitBox() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  getAttackHitBox() {
    if (!this.attackActive || !this.attackType) return null;
    const range = this._currentAttackRange();
    const centerX = this.x + this.width / 2;
    if (this.facingRight) {
      return { x: centerX, y: this.y + 10, w: range, h: this.height - 20 };
    } else {
      return { x: centerX - range, y: this.y + 10, w: range, h: this.height - 20 };
    }
  }

  _currentAttackRange() {
    if (this.attackType === 'heavy') return this.heavyRange;
    return this.lightRange; // light, free, and skill defaults
  }

  // ── Damage ────────────────────────────────────────────────
  applyDamage(amount) {
    if (this.state === 'dead') return;
    if (this.isBlocking) return;
    // Snapshot health before decrement for ghost bar and flash
    this.ghostBarHealth      = this.health;
    this.damageFlashTimer    = 0.25;
    this._ghostBarDecayTimer = 0.8;
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.state = 'dead';
    } else {
      this.state = 'hurt';
      this.hurtTimer = 20;
    }
  }

  applyStun(seconds) {
    if (this.state === 'dead' || this.isBlocking) return;
    this.stunTimer = seconds;
    this.state = 'hurt';
  }

  // ── Normal attacks ────────────────────────────────────────
  startAttack(type) {
    if (this.attackCooldown > 0 || this.state === 'dead' || this.stunTimer > 0) return;
    this.attackType = type;
    this.attackActive = true;
    this.lastAttackDamageDealt = false;
    this.state = type === 'light' ? 'attack_light' : 'attack_heavy';
    this.attackFrameTimer = type === 'light' ? this.lightDuration : this.heavyDuration;
    this.attackCooldown = type === 'light' ? this.lightDuration + 5 : this.heavyDuration + 8;
  }

  // ── Free hit (right mouse click) — 1-2 damage quick tap ──
  startFreeHit() {
    if (this.state === 'dead' || this.stunTimer > 0) return;
    if (this._freeHitCooldown > 0) return;
    if (this.attackActive) return; // don't interrupt an active attack
    this.attackType = 'free';
    this.attackActive = true;
    this.lastAttackDamageDealt = false;
    this.state = 'attack_light'; // reuse light animation visually
    this.attackFrameTimer = this.lightDuration;
    this._freeHitCooldown = this.lightDuration + 4;
  }

  // ── Skills (overridden by subclasses) ─────────────────────
  useSkillQ() {}
  useSkillE() {}
  useSkillC() {}
  useUltimate() {}

  // ── R: Flicker — dash toward mouse cursor direction ─────
  useFlicker(mouseX) {
    if (this.state === 'dead' || this.stunTimer > 0) return false;
    if (this._flickerCd > 0) return false;

    // Canvas position of fighter center in screen coords
    const canvas = document.getElementById('gameCanvas');
    const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, width: CANVAS_WIDTH };
    const scaleX = CANVAS_WIDTH / rect.width;
    // Convert mouseX screen px to canvas px
    const mouseCanvasX = (mouseX - rect.left) * scaleX;
    const myCenter = this.x + this.width / 2;
    const dir = mouseCanvasX > myCenter ? 1 : -1;

    const blinkDist = 160;
    const newX = this.x + dir * blinkDist;
    this.x = Math.max(0, Math.min(CANVAS_WIDTH - this.width, newX));
    this.facingRight = dir > 0;

    this._flickerCd = 10; // 10 second cooldown
    FX.flickerEffect(this.x, this.y, this.width, this.height);
    return true;
  }

  // ── Update ────────────────────────────────────────────────
  update(dt) {
    const dtF = dt * 60; // ~frames at 60fps

    // stun countdown
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.stunTimer = 0;
        if (this.state === 'hurt') this.state = 'idle';
      }
    }

    // flicker cooldown
    if (this._flickerCd > 0) this._flickerCd = Math.max(0, this._flickerCd - dt);

    // attack frame timer
    if (this.attackFrameTimer > 0) {
      this.attackFrameTimer -= dtF;
      if (this.attackFrameTimer <= 0) {
        this.attackActive = false;
        this.attackType = null;
        this.lastAttackDamageDealt = false;
        if (['attack_light','attack_heavy','skill_q','skill_e','ultimate'].includes(this.state)) {
          this.state = 'idle';
        }
      }
    }

    // cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dtF;
      if (this.attackCooldown < 0) this.attackCooldown = 0;
    }
    if (this._freeHitCooldown > 0) {
      this._freeHitCooldown -= dtF;
      if (this._freeHitCooldown < 0) this._freeHitCooldown = 0;
    }

    // hurt timer
    if (this.hurtTimer > 0 && this.stunTimer <= 0) {
      this.hurtTimer -= dtF;
      if (this.hurtTimer <= 0) {
        this.hurtTimer = 0;
        if (this.state === 'hurt') this.state = 'idle';
      }
    }

    // skill cooldowns & active timers
    for (const key of ['q', 'e', 'c']) {
      const sk = this.skills[key];
      if (sk.cd > 0) { sk.cd -= dt; if (sk.cd < 0) sk.cd = 0; }
      if (sk.active) {
        sk.timer -= dt;
        if (sk.timer <= 0) {
          sk.active = false;
          sk.timer = 0;
          this._onSkillEnd(key);
        }
      }
    }
    if (this.skills.ult.active) {
      this.skills.ult.timer -= dt;
      if (this.skills.ult.timer <= 0) {
        this.skills.ult.active = false;
        this.skills.ult.timer = 0;
        this._onSkillEnd('ult');
      }
    }

    applyGravity(this, dt);
  }

  _onSkillEnd(key) { /* override in subclass */ }

  renderSprite(ctx) {
    ctx.fillStyle = '#888';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(this.name, this.x + 2, this.y + 14);
  }

  render(ctx) { this.renderSprite(ctx); }
}
