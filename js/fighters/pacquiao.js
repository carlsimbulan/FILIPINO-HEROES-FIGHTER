// pacquiao.js — Manny Pacquiao (pixel art, detailed)
// Q: Stun Punch | E: Flurry | C: Block | R: Giant Gloves (Ultimate)

class Pacquiao extends Fighter {
  constructor(x) {
    super(x);
    this.name = 'Pacquiao';
    this.lightDamage = 6;
    this.heavyDamage = 15;
    this.lightRange = 70;
    this.heavyRange = 80;
    this.lightDuration = 12;
    this.heavyDuration = 25;
    this.moveSpeed = 260;
    this.width = 52;
    this.height = 82;

    this.skills.q.cdMax = 10;
    this.skills.e.cdMax = 5;   // 5s cooldown, starts AFTER the 4s active ends
    this.skills.c.cdMax = 1;

    this._flurryTickTimer = 0;
    this._flurryTickInterval = 0.18;
    this._flurryTarget = null;
    this._flurryFrame = 0; // alternates punch arm

    this._ultGloveActive = false;
    this._animFrame = 0; // walk cycle
    this._animTimer = 0;
  }

  useSkillQ() {
    if (this.skills.q.cd > 0 || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.q.cd = this.skills.q.cdMax;
    this.state = 'skill_q';
    this.attackActive = true;
    this.attackType = 'q_stun';
    this.lastAttackDamageDealt = false;
    this.attackFrameTimer = 22;
    return true;
  }

  useSkillE(target) {
    if (this.skills.e.cd > 0 || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.e.active = true;
    this.skills.e.timer = 4.0;   // active for 4 seconds
    this._flurryTickTimer = 0;
    this._flurryTarget = target;
    this._flurryFrame = 0;
    this.state = 'skill_e';
    return true;
  }

  useSkillC() {
    if (this.skills.c.cd > 0 || this.state === 'dead') return false;
    this.skills.c.cd = this.skills.c.cdMax;
    this.skills.c.active = true;
    this.skills.c.timer = 1.0;
    this.isBlocking = true;
    this.state = 'skill_c';
    FX.blockEffect(this.x + this.width / 2, this.y + this.height / 2);
    return true;
  }

  useUltimate() {
    if (this.skills.ult.used || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.ult.used = true;
    this.skills.ult.active = true;
    this.skills.ult.timer = 1.5;
    this._ultGloveActive = true;
    this.state = 'ultimate';
    this.attackActive = true;
    this.attackType = 'ult';
    this.attackFrameTimer = 90;
    this.lastAttackDamageDealt = false;
    // screen flash + shockwave
    FX.ultGloveShockwave(this.x + this.width / 2, this.y + this.height / 2);
    return true;
  }

  get ultDamage() { return 35; }

  _currentAttackRange() {
    if (this.attackType === 'q_stun') return this.lightRange + 15;
    if (this.attackType === 'ult') return this.heavyRange + 40;
    return super._currentAttackRange();
  }

  _onSkillEnd(key) {
    if (key === 'c') { this.isBlocking = false; if (this.state === 'skill_c') this.state = 'idle'; }
    if (key === 'e') {
      this.skills.e.cd = this.skills.e.cdMax; // cooldown starts AFTER the skill ends
      this._flurryTarget = null;
      if (this.state === 'skill_e') this.state = 'idle';
    }
    if (key === 'ult') { this._ultGloveActive = false; }
  }

  update(dt) {
    // walk animation
    if (this.state === 'walk') {
      this._animTimer += dt;
      if (this._animTimer > 0.12) { this._animTimer = 0; this._animFrame = (this._animFrame + 1) % 4; }
    } else {
      this._animFrame = 0; this._animTimer = 0;
    }

    // flurry ticks
    if (this.skills.e.active && this._flurryTarget) {
      this._flurryTickTimer -= dt;
      if (this._flurryTickTimer <= 0) {
        this._flurryTickTimer = this._flurryTickInterval;
        this._flurryFrame = (this._flurryFrame + 1) % 2;
        const dist = Math.abs((this.x + this.width / 2) - (this._flurryTarget.x + this._flurryTarget.width / 2));
        if (dist <= this.lightRange + 25) {
          this._flurryTarget.applyDamage(4);
          FX.hitImpact(
            this._flurryTarget.x + (this.facingRight ? 0 : this._flurryTarget.width),
            this._flurryTarget.y + 30, '#f39c12'
          );
          FX.flurryTrail(this.x + (this.facingRight ? this.width : 0), this.y + 35, this.facingRight ? 1 : -1);
        }
      }
    }

    super.update(dt);
  }

  renderSprite(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const fr = this.facingRight;

    ctx.save();
    if (!fr) {
      ctx.translate(x + this.width, y);
      ctx.scale(-1, 1);
      ctx.translate(-x, -y);
    }

    const s = this.state;
    const attacking = s === 'attack_light' || s === 'attack_heavy';
    const skillQ = s === 'skill_q';
    const skillE = s === 'skill_e';
    const blocking = s === 'skill_c';
    const ultActive = s === 'ultimate' || this._ultGloveActive;
    const hurt = s === 'hurt';
    const dead = s === 'dead';
    const stunned = this.stunTimer > 0;
    const walking = s === 'walk';
    const af = this._animFrame;

    // ── Colors ────────────────────────────────────────────
    const skin     = dead ? '#7a7a7a' : '#d4955a';
    const skinDark = dead ? '#555' : '#b57840';
    const shortMain= dead ? '#333' : '#0d3b6e';
    const shortSide= dead ? '#222' : '#0a2d56';
    const shirt    = dead ? '#444' : '#1e6fa8';
    const shirtDark= dead ? '#333' : '#155a8a';
    const shoeCol  = dead ? '#222' : '#1a1a1a';

    // ── Shadow on ground ──────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2, y + this.height, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Legs with walk cycle ──────────────────────────────
    const legSwing = walking ? Math.sin(af * Math.PI / 2) * 6 : 0;

    // Shoes
    ctx.fillStyle = shoeCol;
    ctx.fillRect(x + 8,  y + 74 + (walking && af % 2 === 0 ? 2 : 0),  14, 8);
    ctx.fillRect(x + 28, y + 74 + (walking && af % 2 === 1 ? 2 : 0), 14, 8);
    // shoe highlight
    ctx.fillStyle = '#333';
    ctx.fillRect(x + 9, y + 74 + (walking && af % 2 === 0 ? 2 : 0), 12, 3);
    ctx.fillRect(x + 29, y + 74 + (walking && af % 2 === 1 ? 2 : 0), 12, 3);

    // Shorts — main panel
    ctx.fillStyle = shortMain;
    ctx.fillRect(x + 6, y + 52, 40, 24);
    // shorts side stripes (Filipino flag colors on shorts)
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x + 6, y + 52, 5, 24);
    ctx.fillRect(x + 41, y + 52, 5, 24);
    // shorts dark side
    ctx.fillStyle = shortSide;
    ctx.fillRect(x + 6, y + 52, 40, 3);

    // Left leg
    ctx.fillStyle = skin;
    ctx.fillRect(x + 9, y + 54 + legSwing, 13, 22);
    // left leg shading
    ctx.fillStyle = skinDark;
    ctx.fillRect(x + 9, y + 54 + legSwing, 4, 22);

    // Right leg
    ctx.fillStyle = skin;
    ctx.fillRect(x + 28, y + 54 - legSwing, 13, 22);
    ctx.fillStyle = skinDark;
    ctx.fillRect(x + 28, y + 54 - legSwing, 4, 22);

    // ── Torso ─────────────────────────────────────────────
    // Main shirt
    ctx.fillStyle = shirt;
    ctx.fillRect(x + 7, y + 26, 38, 28);
    // shirt shading left side
    ctx.fillStyle = shirtDark;
    ctx.fillRect(x + 7, y + 26, 8, 28);
    // shirt highlight center
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(x + 20, y + 28, 6, 20);
    // collar
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 19, y + 26, 14, 5);

    // ── Head ─────────────────────────────────────────────
    // Neck
    ctx.fillStyle = skin;
    ctx.fillRect(x + 20, y + 20, 12, 8);

    // Head base
    ctx.fillStyle = skin;
    ctx.fillRect(x + 11, y + 4, 30, 24);
    // head shading
    ctx.fillStyle = skinDark;
    ctx.fillRect(x + 11, y + 4, 7, 24);

    // Ear
    ctx.fillStyle = skinDark;
    ctx.fillRect(x + 11, y + 10, 4, 8);

    // Hair — dark spiky
    ctx.fillStyle = '#111';
    ctx.fillRect(x + 11, y + 4, 30, 9);
    // hair spikes
    ctx.fillRect(x + 14, y + 2, 5, 4);
    ctx.fillRect(x + 21, y + 1, 5, 4);
    ctx.fillRect(x + 28, y + 2, 5, 4);
    ctx.fillRect(x + 34, y + 3, 5, 4);

    // Eyebrows
    ctx.fillStyle = '#111';
    ctx.fillRect(x + 16, y + 14, 7, 2);
    ctx.fillRect(x + 27, y + 14, 7, 2);

    // Eyes
    if (stunned || dead) {
      ctx.fillStyle = dead ? '#555' : '#e74c3c';
      // X eyes
      ctx.fillRect(x + 16, y + 17, 7, 2);
      ctx.fillRect(x + 17, y + 16, 5, 4);
      ctx.fillRect(x + 27, y + 17, 7, 2);
      ctx.fillRect(x + 28, y + 16, 5, 4);
    } else {
      // whites
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 17, y + 17, 6, 5);
      ctx.fillRect(x + 28, y + 17, 6, 5);
      // pupils — look right
      ctx.fillStyle = '#111';
      ctx.fillRect(x + 20, y + 18, 3, 4);
      ctx.fillRect(x + 31, y + 18, 3, 4);
      // eye shine
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 21, y + 18, 1, 1);
      ctx.fillRect(x + 32, y + 18, 1, 1);
    }

    // Nose
    ctx.fillStyle = skinDark;
    ctx.fillRect(x + 22, y + 22, 3, 3);

    // Mouth
    ctx.fillStyle = stunned ? '#888' : '#a0522d';
    ctx.fillRect(x + 19, y + 26, 9, 2);

    // ── Arms ──────────────────────────────────────────────
    // Left arm (back arm)
    ctx.fillStyle = skinDark;
    ctx.fillRect(x + 1, y + 28, 9, 22);
    ctx.fillStyle = skin;
    ctx.fillRect(x + 2, y + 28, 7, 20);

    // Right arm (front arm)
    const armExtend = (attacking || skillQ) ? -6 : skillE && this._flurryFrame === 0 ? -8 : 0;
    ctx.fillStyle = skinDark;
    ctx.fillRect(x + 42, y + 28 + armExtend, 9, 22);
    ctx.fillStyle = skin;
    ctx.fillRect(x + 43, y + 28 + armExtend, 7, 20);

    // ── Gloves ────────────────────────────────────────────
    let lCol = '#c0392b';
    let rCol = '#c0392b';
    if (attacking) { rCol = '#ffe066'; }
    if (skillQ) { rCol = '#ff4444'; lCol = '#c0392b'; }
    if (skillE) { rCol = this._flurryFrame === 0 ? '#ffe066' : '#c0392b'; lCol = this._flurryFrame === 1 ? '#ffe066' : '#c0392b'; }
    if (blocking) { lCol = '#27ae60'; rCol = '#27ae60'; }

    if (ultActive) {
      // ── GIANT GLOVES ──────────────────────────────────
      // glow behind
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(x - 20, y + 18, 32, 32);
      ctx.fillRect(x + 42, y + 14, 36, 32);
      ctx.restore();

      // left giant glove
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(x - 18, y + 20, 28, 28);
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(x - 16, y + 22, 24, 8);  // knuckles highlight
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(x - 18, y + 40, 28, 8);  // bottom dark
      // laces
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 10, y + 23, 14, 2);
      ctx.fillRect(x - 10, y + 27, 14, 2);

      // right giant glove (extended punch)
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(x + 40, y + 16, 32, 28);
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(x + 40, y + 18, 32, 8);  // knuckles highlight
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(x + 40, y + 36, 32, 8);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 48, y + 19, 14, 2);
      ctx.fillRect(x + 48, y + 23, 14, 2);
      // ult glow rings
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 22, y + 16, 36, 36);
      ctx.strokeRect(x + 38, y + 12, 38, 36);
      ctx.restore();

    } else if (blocking) {
      // ── GUARD STANCE ─────────────────────────────────
      // Both gloves raised and crossed in front
      ctx.fillStyle = lCol;
      ctx.fillRect(x + 32, y + 16, 18, 20);
      ctx.fillStyle = '#1e8449'; // dark shade
      ctx.fillRect(x + 32, y + 30, 18, 6);
      ctx.fillStyle = rCol;
      ctx.fillRect(x + 34, y + 22, 18, 20);
      ctx.fillStyle = '#1e8449';
      ctx.fillRect(x + 34, y + 36, 18, 6);
      // knuckle lines
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 34, y + 19, 14, 2);
      ctx.fillRect(x + 36, y + 25, 14, 2);
      // shield shimmer
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(x + 20, y + 10, 36, 56);
      ctx.restore();

    } else {
      // ── NORMAL GLOVES ─────────────────────────────────
      // Left glove (back)
      ctx.fillStyle = skinDark;
      ctx.fillRect(x - 2, y + 26, 12, 15);
      ctx.fillStyle = lCol;
      ctx.fillRect(x - 3, y + 25, 13, 16);
      ctx.fillStyle = '#a93226'; // dark shade
      ctx.fillRect(x - 3, y + 35, 13, 6);
      // knuckles
      ctx.fillStyle = '#e8948a';
      ctx.fillRect(x - 1, y + 26, 11, 4);

      // Right glove (front, punching)
      const py = y + 25 + armExtend;
      ctx.fillStyle = skinDark;
      ctx.fillRect(x + 41, py + 1, 13, 15);
      ctx.fillStyle = rCol;
      ctx.fillRect(x + 40, py, 14, 16);
      ctx.fillStyle = attacking ? '#c8a000' : '#a93226';
      ctx.fillRect(x + 40, py + 10, 14, 6);
      ctx.fillStyle = attacking ? '#ffe066' : '#e8948a';
      ctx.fillRect(x + 41, py + 1, 12, 4);

      // glove laces
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 43, py + 2, 8, 1);
      ctx.fillRect(x + 43, py + 5, 8, 1);
    }

    // ── Stun stars ────────────────────────────────────────
    if (stunned) {
      const t = Date.now() / 400;
      for (let i = 0; i < 3; i++) {
        const a = t + (i * Math.PI * 2) / 3;
        const sx = x + this.width / 2 + Math.cos(a) * 18;
        const sy = y - 12 + Math.sin(a) * 8;
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
        ctx.fillStyle = '#fff';
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      }
    }

    // ── Hurt flash ────────────────────────────────────────
    if (hurt || stunned) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x, y, this.width, this.height);
      ctx.restore();
    }

    ctx.restore();
  }
}
