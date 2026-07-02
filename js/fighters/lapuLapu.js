// lapuLapu.js — Lapu-Lapu (detailed pixel art)
// Q: War Cry | E: Itak Spin | C: Parry | R: Katipunan Rage (Ultimate)

class LapuLapu extends Fighter {
  constructor(x) {
    super(x);
    this.name = 'Lapu-Lapu';
    this.lightDamage = 8;
    this.heavyDamage = 18;
    this.lightRange = 80;
    this.heavyRange = 100;
    this.lightDuration = 18;
    this.heavyDuration = 30;
    this.moveSpeed = 200;
    this.width = 52;
    this.height = 84;

    this.skills.q.cdMax = 10;
    this.skills.e.cdMax = 10;
    this.skills.c.cdMax = 1;

    this._warCryActive = false;
    this._spinAngle = 0;
    this._animFrame = 0;
    this._animTimer = 0;
    this.themeColor = '#c0391b'; // deep red — war and fire
  }

  useSkillQ() {
    if (this.skills.q.cd > 0 || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.q.cd = this.skills.q.cdMax;
    this.skills.q.active = true;
    this.skills.q.timer = 3.0;
    this._warCryActive = true;
    this.state = 'skill_q';
    this.attackFrameTimer = 18;
    FX.warCryAura(this.x, this.y, this.width, this.height);
    return true;
  }

  useSkillE() {
    if (this.skills.e.cd > 0 || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.e.cd = this.skills.e.cdMax;
    this.skills.e.active = true;
    this.skills.e.timer = 0.55;
    this._spinAngle = 0;
    this.state = 'skill_e';
    this.attackActive = true;
    this.attackType = 'e_spin';
    this.attackFrameTimer = 33;
    this.lastAttackDamageDealt = false;
    FX.spinEffect(this.x, this.y, this.width, this.height);
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
    this.skills.ult.timer = 1.2;
    this.state = 'ultimate';
    this.attackActive = true;
    this.attackType = 'ult';
    this.attackFrameTimer = 72;
    this.lastAttackDamageDealt = false;
    FX.ultGloveShockwave(this.x + this.width / 2, this.y + this.height / 2);
    return true;
  }

  get ultDamage() { return 40; }
  get lightDamageFinal()  { return this._warCryActive ? this.lightDamage + 5  : this.lightDamage; }
  get heavyDamageFinal()  { return this._warCryActive ? this.heavyDamage + 8  : this.heavyDamage; }

  _currentAttackRange() {
    if (this.attackType === 'e_spin') return this.heavyRange + 25;
    if (this.attackType === 'ult')    return this.heavyRange + 45;
    return super._currentAttackRange();
  }

  _onSkillEnd(key) {
    if (key === 'c') { this.isBlocking = false; if (this.state === 'skill_c') this.state = 'idle'; }
    if (key === 'q') { this._warCryActive = false; }
    if (key === 'e') { if (this.state === 'skill_e') this.state = 'idle'; }
  }

  update(dt) {
    if (this.state === 'walk') {
      this._animTimer += dt;
      if (this._animTimer > 0.13) { this._animTimer = 0; this._animFrame = (this._animFrame + 1) % 4; }
    } else { this._animFrame = 0; this._animTimer = 0; }

    if (this.state === 'skill_e') {
      this._spinAngle += dt * Math.PI * 6;
      FX.slashTrail(
        this.x + this.width / 2, this.y + this.height / 2,
        this.facingRight ? 1 : -1, this._warCryActive ? '#e67e22' : '#ffe066'
      );
    }
    if (this._warCryActive) {
      FX.warCryAura(this.x, this.y, this.width, this.height);
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
    const skillQ    = s === 'skill_q' || this._warCryActive;
    const skillE    = s === 'skill_e';
    const blocking  = s === 'skill_c';
    const ultActive = s === 'ultimate';
    const hurt      = s === 'hurt';
    const dead      = s === 'dead';
    const stunned   = this.stunTimer > 0;
    const af        = this._animFrame;

    const skin      = dead ? '#7a7a7a' : '#c8845e';
    const skinDark  = dead ? '#555'    : '#a06040';
    const armorMain = dead ? '#444'    : skillQ ? '#c0521a' : ultActive ? '#b8960a' : '#8b1a1a';
    const armorDark = dead ? '#333'    : skillQ ? '#8b3a0a' : ultActive ? '#8a7000' : '#5c0f0f';
    const armorLight= dead ? '#666'    : skillQ ? '#e06020' : ultActive ? '#e0b800' : '#aa2222';
    const pantColor = dead ? '#333'    : '#3d1a78';
    const pantDark  = dead ? '#222'    : '#2a1050';

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2, y + this.height, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (skillQ) {
      ctx.save(); ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(x - 8, y - 8, this.width + 16, this.height + 16);
      ctx.restore();
    }
    if (ultActive) {
      ctx.save(); ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(x - 10, y - 10, this.width + 20, this.height + 20);
      ctx.restore();
    }

    // Sandals
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x + 7,  y + 76 + (af % 2 === 0 ? 2 : 0), 16, 8);
    ctx.fillRect(x + 28, y + 76 + (af % 2 === 1 ? 2 : 0), 16, 8);
    ctx.fillStyle = '#6d4f0e';
    ctx.fillRect(x + 9,  y + 76 + (af % 2 === 0 ? 2 : 0), 3, 8);
    ctx.fillRect(x + 30, y + 76 + (af % 2 === 1 ? 2 : 0), 3, 8);

    // Legs
    const legSwing = (s === 'walk') ? Math.sin(af * Math.PI / 2) * 5 : 0;
    ctx.fillStyle = pantColor;
    ctx.fillRect(x + 8,  y + 54 + legSwing, 14, 24);
    ctx.fillStyle = pantDark;
    ctx.fillRect(x + 8,  y + 54 + legSwing, 4, 24);
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(x + 8,  y + 60 + legSwing, 14, 2);
    ctx.fillRect(x + 8,  y + 68 + legSwing, 14, 2);

    ctx.fillStyle = pantColor;
    ctx.fillRect(x + 29, y + 54 - legSwing, 14, 24);
    ctx.fillStyle = pantDark;
    ctx.fillRect(x + 29, y + 54 - legSwing, 4, 24);
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(x + 29, y + 60 - legSwing, 14, 2);
    ctx.fillRect(x + 29, y + 68 - legSwing, 14, 2);

    // Belt
    ctx.fillStyle = '#c0a030';
    ctx.fillRect(x + 6, y + 52, 40, 6);
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(x + 6, y + 52, 40, 2);
    ctx.fillStyle = '#8a7020';
    ctx.fillRect(x + 6, y + 56, 40, 2);

    // Torso armor
    ctx.fillStyle = armorMain;
    ctx.fillRect(x + 7, y + 26, 38, 28);
    ctx.fillStyle = armorDark;
    ctx.fillRect(x + 7, y + 26, 8, 28);
    ctx.fillStyle = armorLight;
    ctx.fillRect(x + 39, y + 28, 6, 22);
    ctx.fillStyle = armorDark;
    ctx.fillRect(x + 24, y + 28, 3, 22);
    ctx.fillStyle = '#c0a030';
    ctx.fillRect(x + 13, y + 28, 26, 4);
    ctx.fillRect(x + 13, y + 36, 26, 4);
    ctx.fillStyle = armorLight;
    ctx.fillRect(x + 4,  y + 26, 10, 8);
    ctx.fillRect(x + 38, y + 26, 10, 8);
    ctx.fillStyle = '#c0a030';
    ctx.fillRect(x + 5,  y + 27, 8, 3);
    ctx.fillRect(x + 39, y + 27, 8, 3);

    // Neck
    ctx.fillStyle = skin;
    ctx.fillRect(x + 20, y + 18, 12, 10);

    // Head
    ctx.fillStyle = skin;
    ctx.fillRect(x + 12, y + 2, 28, 24);
    ctx.fillStyle = skinDark;
    ctx.fillRect(x + 12, y + 2, 6, 24);
    ctx.fillStyle = skinDark;
    ctx.fillRect(x + 12, y + 9, 4, 9);

    // Headband
    ctx.fillStyle = skillQ ? '#e67e22' : ultActive ? '#f1c40f' : '#c0392b';
    ctx.fillRect(x + 12, y + 2, 28, 8);
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(x + 14, y + 3, 3, 6);
    ctx.fillRect(x + 20, y + 3, 3, 6);
    ctx.fillRect(x + 26, y + 3, 3, 6);
    ctx.fillRect(x + 32, y + 3, 3, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x + 12, y + 2, 28, 3);

    // Hair
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(x + 14, y + 2, 4, 3);
    ctx.fillRect(x + 30, y + 2, 4, 3);

    // Eyebrows
    ctx.fillStyle = '#2c1a0a';
    ctx.fillRect(x + 17, y + 11, 7, 2);
    ctx.fillRect(x + 28, y + 11, 7, 2);

    // Eyes
    if (stunned || dead) {
      ctx.fillStyle = dead ? '#555' : '#e74c3c';
      ctx.fillRect(x + 17, y + 14, 7, 2);
      ctx.fillRect(x + 18, y + 13, 5, 4);
      ctx.fillRect(x + 28, y + 14, 7, 2);
      ctx.fillRect(x + 29, y + 13, 5, 4);
    } else {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 18, y + 13, 6, 5);
      ctx.fillRect(x + 29, y + 13, 6, 5);
      ctx.fillStyle = '#111';
      ctx.fillRect(x + 21, y + 14, 3, 4);
      ctx.fillRect(x + 32, y + 14, 3, 4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 22, y + 14, 1, 1);
      ctx.fillRect(x + 33, y + 14, 1, 1);
    }

    ctx.fillStyle = skinDark;
    ctx.fillRect(x + 23, y + 18, 3, 4);
    ctx.fillStyle = '#7a3520';
    ctx.fillRect(x + 19, y + 23, 10, 2);
    ctx.fillRect(x + 17, y + 22, 3, 2);
    ctx.fillRect(x + 28, y + 22, 3, 2);

    // Arms
    ctx.fillStyle = armorDark;
    ctx.fillRect(x + 0, y + 28, 8, 22);
    ctx.fillStyle = armorMain;
    ctx.fillRect(x + 1, y + 28, 7, 20);
    ctx.fillStyle = skin;
    ctx.fillRect(x + 1, y + 40, 7, 10);

    const armY = attacking ? y + 24 : y + 28;
    ctx.fillStyle = armorDark;
    ctx.fillRect(x + 43, armY, 8, 22);
    ctx.fillStyle = armorMain;
    ctx.fillRect(x + 43, armY, 7, 20);
    ctx.fillStyle = skin;
    ctx.fillRect(x + 43, armY + 12, 7, 10);

    // ── Itak sword ────────────────────────────────────────
    if (!dead) {
      if (skillE) {
        ctx.save();
        ctx.translate(x + this.width / 2, y + this.height / 2 - 5);
        ctx.rotate(this._spinAngle);
        ctx.fillStyle = '#e0e8f0';
        ctx.fillRect(-6, -45, 12, 50);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-6, -45, 3, 50);
        ctx.fillStyle = '#b0bcc8';
        ctx.fillRect(1, -40, 3, 40);
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(-12, 4, 24, 6);
        ctx.fillStyle = '#6d3a1a';
        ctx.fillRect(-4, 10, 8, 18);
        ctx.fillStyle = '#8b5a2a';
        ctx.fillRect(-3, 12, 3, 14);
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(-5, 26, 10, 6);
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = this._warCryActive ? '#e67e22' : '#ffe066';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(0, 0, 44, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

      } else if (blocking) {
        ctx.fillStyle = '#e0e8f0';
        ctx.fillRect(x + 40, y + 8, 8, 56);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 40, y + 8, 2, 56);
        ctx.fillStyle = '#b0bcc8';
        ctx.fillRect(x + 44, y + 12, 2, 46);
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(x + 34, y + 38, 20, 6);
        ctx.fillStyle = '#6d3a1a';
        ctx.fillRect(x + 41, y + 44, 6, 18);
        ctx.save(); ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x + 30, y + 4, 28, 68);
        ctx.restore();

      } else if (ultActive) {
        ctx.save();
        ctx.translate(x + 46, y - 5);
        ctx.rotate(-0.5);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-5, -20, 10, 70);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-5, -20, 3, 70);
        ctx.fillStyle = '#c8a000';
        ctx.fillRect(2, -15, 3, 60);
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(-11, 28, 22, 7);
        ctx.fillStyle = '#6d3a1a';
        ctx.fillRect(-4, 35, 8, 20);
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(-5, 53, 10, 6);
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(-8, -25, 5, 80);
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#fff';
        ctx.fillRect(-14, -25, 12, 80);
        ctx.restore();

      } else {
        const bladeX = x + 47;
        const bladeY = attacking ? y + 14 : y + 18;
        const bladeH = attacking ? 44 : 38;

        ctx.fillStyle = attacking ? '#e8f0f8' : '#bdc9d5';
        ctx.fillRect(bladeX, bladeY, 8, bladeH);
        ctx.fillStyle = attacking ? '#fff' : '#d8e4f0';
        ctx.fillRect(bladeX, bladeY, 2, bladeH);
        ctx.fillStyle = attacking ? '#b0c0d0' : '#9aaab8';
        ctx.fillRect(bladeX + 3, bladeY + 4, 2, bladeH - 8);
        ctx.fillStyle = '#c0c8d4';
        ctx.fillRect(bladeX + 2, bladeY + bladeH - 6, 4, 6);
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(bladeX - 5, bladeY + bladeH - 2, 18, 6);
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(bladeX - 4, bladeY + bladeH - 1, 16, 2);
        ctx.fillStyle = '#6d3a1a';
        ctx.fillRect(bladeX + 1, bladeY + bladeH + 4, 6, 16);
        ctx.fillStyle = '#8b5a2a';
        ctx.fillRect(bladeX + 2, bladeY + bladeH + 5, 2, 14);
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(bladeX + 1, bladeY + bladeH + 7, 6, 2);
        ctx.fillRect(bladeX + 1, bladeY + bladeH + 12, 6, 2);
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(bladeX, bladeY + bladeH + 20, 8, 6);
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(bladeX + 1, bladeY + bladeH + 21, 6, 2);

        if (attacking) {
          ctx.save(); ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#ffe066';
          ctx.fillRect(bladeX - 4, bladeY - 4, 16, bladeH + 8);
          ctx.restore();
        }
      }
    }

    // Stun stars
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

    if (hurt || stunned) {
      ctx.save(); ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x, y, this.width, this.height);
      ctx.restore();
    }

    ctx.restore();
  }
}
