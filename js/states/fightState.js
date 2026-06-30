// fightState.js — FIGHTING screen

class FightState {
  constructor(game, input) {
    this.game = game;
    this.input = input;
    this.player = null;
    this.ai = null;
    this.aiController = null;
    this._roundOver = false;
  }

  enter(payload) {
    this._roundOver = false;
    const p1X = Math.round(CANVAS_WIDTH * 0.18);
    const p2X = Math.round(CANVAS_WIDTH * 0.72);
    this.player = this._createFighter(payload.playerHero, p1X);
    this.ai     = this._createFighter(payload.aiHero,     p2X);
    this.player.facingRight = true;
    this.ai.facingRight     = false;

    // Apply difficulty to AI
    const diff = payload.difficulty || { attackInterval:[0.6,1.3], damageMulti:1.0, moveMulti:1.0 };
    this.ai.moveSpeed  = this.ai.moveSpeed  * diff.moveMulti;
    this.ai.lightDamage = Math.round(this.ai.lightDamage * diff.damageMulti);
    this.ai.heavyDamage = Math.round(this.ai.heavyDamage * diff.damageMulti);
    this._difficultyInterval = diff.attackInterval;
    this._difficulty = payload.difficultyKey || 'medium';

    this.aiController = new AIController(this.ai, this.player, diff.attackInterval);
    this.input.setActive(true);
    FX.clear();
    this._ultFlashTimer = 0;
  }

  exit() {
    this.input.setActive(false);
  }

  _createFighter(heroId, x) {
    switch (heroId) {
      case 'lapulapu':     return new LapuLapu(x);
      case 'pacquiao':     return new Pacquiao(x);
      case 'antonioluna':  return new AntonioLuna(x);
      case 'urduja':       return new Urduja(x);
      case 'sultankudarat':return new SultanKudarat(x);
      case 'luces':        return new Luces(x);
      default:             return new Fighter(x);
    }
  }

  update(dt) {
    if (this._roundOver) return;

    const p = this.player;
    const a = this.ai;
    const busy = (f) => ['attack_light','attack_heavy','skill_q','skill_e','ultimate'].includes(f.state);

    // ── Player input ───────────────────────────────────────
    if (p.state !== 'dead' && p.stunTimer <= 0) {

      // Movement (not while in attack/skill)
      if (!busy(p) && p.state !== 'skill_c') {
        if (this.input.isDown(Keys.LEFT)) {
          moveHorizontal(p, -p.moveSpeed * dt);
          p.facingRight = false;
          if (p.state === 'idle') p.state = 'walk';
        } else if (this.input.isDown(Keys.RIGHT)) {
          moveHorizontal(p, p.moveSpeed * dt);
          p.facingRight = true;
          if (p.state === 'idle') p.state = 'walk';
        } else {
          if (p.state === 'walk') p.state = 'idle';
        }
      } else {
        if (p.state === 'walk') p.state = 'idle';
      }

      // Jump — double jump supported
      if (this.input.wasPressed(Keys.UP)) {
        if (p._jumpsLeft > 0) {
          // Second jump gets a small particle burst
          if (!p.onGround) {
            FX.flickerEffect(p.x, p.y, p.width, p.height);
          }
          p.vy = p.jumpVelocity;
          p.onGround = false;
          p._jumpsLeft--;
        }
      }

      // Basic attacks
      if (this.input.wasPressed(Keys.LIGHT_ATTACK) && !busy(p)) {
        p.startAttack('light');
        Audio.playLightAttack();
      } else if (this.input.wasPressed(Keys.HEAVY_ATTACK) && !busy(p)) {
        p.startAttack('heavy');
        Audio.playHeavyAttack();
      }

      // Free hit — left mouse click
      if (this.input.wasPressed(Keys.FREE_HIT) && !busy(p)) {
        p.startFreeHit();
        Audio.playFreeHit();
      }

      // Skills
      if (this.input.wasPressed(Keys.SKILL_Q) && !busy(p)) {
        if (p.useSkillQ(a)) Audio.playSkillQ();
      }
      if (this.input.wasPressed(Keys.SKILL_E) && !busy(p)) {
        if (p.useSkillE(a)) Audio.playSkillE();
      }
      if (this.input.wasPressed(Keys.SKILL_C)) {
        if (p.useSkillC()) Audio.playSkillC();
      }
      if (this.input.wasPressed(Keys.ULTIMATE) && !busy(p)) {
        if (p.useUltimate(a)) Audio.playUltimate();
      }
      // Flicker — dashes toward mouse cursor direction
      if (this.input.wasPressed(Keys.FLICKER)) {
        if (p.useFlicker(this.input.mouseX)) Audio.playSkillC();
      }
    }

    // ── Update fighters ────────────────────────────────────
    p.update(dt);
    a.update(dt);

    // Face each other
    if (p.state !== 'dead' && a.state !== 'dead') {
      const pCenter = p.x + p.width / 2;
      const aCenter = a.x + a.width / 2;
      if (p.stunTimer <= 0 && !busy(p)) p.facingRight = aCenter > pCenter;
      if (a.stunTimer <= 0 && !busy(a)) a.facingRight = pCenter > aCenter;
    }

    // ── AI update ──────────────────────────────────────────
    this.aiController.update(dt);

    // ── Hit detection ──────────────────────────────────────
    this._resolveHit(p, a);
    this._resolveHit(a, p);

    // Q stun hit (special: stuns on connect)
    this._resolveStunHit(p, a);
    this._resolveStunHit(a, p);

    // ── Win check ──────────────────────────────────────────
    if (!this._roundOver && (p.health <= 0 || a.health <= 0)) {
      this._roundOver = true;
      const winner = p.health > 0 ? 'player' : 'ai';
      const diff   = this._difficulty || 'medium';
      if (winner === 'player') {
        const coinsEarned = PlayerStats.recordWin(diff);
        try {
          const username = sessionStorage.getItem('fhf_rawusername');
          if (username) GameAPI.recordWin(username, diff).catch(() => {});
        } catch(e) {}
        // Track daily quest progress
        PlayerStats.recordWinForQuests(diff);
        // Show coins earned
        FX.ultLabel(p.x + p.width/2, p.y - 20, '+' + coinsEarned + ' 🪙', '#F8B700');
        Audio.playVictory();
      } else {
        PlayerStats.recordLoss(diff);
        Audio.playDefeat();
      }
      setTimeout(() => {
        this.game.transition(States.WIN, { winner });
      }, 800);
    }

    this.input.update();
    FX.update(dt);
  }

  _resolveHit(attacker, defender) {
    if (!attacker.attackActive || attacker.lastAttackDamageDealt) return;
    if (attacker.attackType === 'q_stun') return;

    const atkBox = attacker.getAttackHitBox();
    const defBox = defender.getHitBox();
    if (!rectsOverlap(atkBox, defBox)) return;

    let dmg;
    if (attacker.attackType === 'free') {
      // Free hit: 1-2 damage, small effect
      dmg = 1 + Math.floor(Math.random() * 2); // 1 or 2
    } else if (attacker.attackType === 'ult') {
      dmg = attacker.ultDamage;
    } else if (attacker.attackType === 'e_spin') {
      dmg = (attacker.heavyDamageFinal !== undefined ? attacker.heavyDamageFinal : attacker.heavyDamage) + 5;
    } else {
      const base = attacker.attackType === 'light' ? attacker.lightDamage : attacker.heavyDamage;
      dmg = (attacker.lightDamageFinal !== undefined && attacker.attackType === 'light')
        ? attacker.lightDamageFinal
        : (attacker.heavyDamageFinal !== undefined && attacker.attackType === 'heavy')
          ? attacker.heavyDamageFinal
          : base;
    }

    defender.applyDamage(dmg);
    attacker.lastAttackDamageDealt = true;

    const hx = defender.x + (attacker.facingRight ? 0 : defender.width);
    const hy = defender.y + defender.height * 0.35;

    if (attacker.attackType === 'free') {
      Audio.playFreeHit();
      FX.hitImpact(hx, hy, attacker instanceof LapuLapu ? '#bdc3c7' : '#e74c3c');
      FX.slashTrail(hx, hy, attacker.facingRight ? 1 : -1,
        attacker instanceof LapuLapu ? '#bdc3c7' : '#e74c3c');
      FX._particles.push({
        x: hx, y: hy - 10, vy: -50, life: 0.7, maxLife: 0.7,
        _text: `-${dmg}`,
        update(dt) { this.y += this.vy * dt; this.vy *= 0.92; this.life -= dt; return this.life > 0; },
        render(c) {
          c.save(); c.globalAlpha = this.life / this.maxLife;
          c.font = 'bold 14px monospace'; c.fillStyle = '#aaa';
          c.textAlign = 'center'; c.fillText(this._text, this.x, this.y);
          c.restore();
        }
      });
    } else {
      Audio.playHit();
      const col = attacker.attackType === 'ult' ? '#ffe066' : attacker.attackType === 'e_spin' ? '#ffe066' : '#fff';
      FX.hitImpact(hx, hy, col);
      if (attacker.attackType === 'ult') FX.ultGloveShockwave(hx, hy);
      else FX.slashTrail(hx, hy, attacker.facingRight ? 1 : -1, col);
    }
  }

  _resolveStunHit(attacker, defender) {
    if (attacker.attackType !== 'q_stun') return;
    if (!attacker.attackActive || attacker.lastAttackDamageDealt) return;

    const atkBox = attacker.getAttackHitBox();
    const defBox = defender.getHitBox();
    if (!rectsOverlap(atkBox, defBox)) return;

    defender.applyDamage(8);
    defender.applyStun(3.5);
    attacker.lastAttackDamageDealt = true;
    Audio.playStun();
    FX.stunEffect(defender.x + defender.width / 2, defender.y);
    FX.hitImpact(defender.x + defender.width / 2, defender.y + 30, '#ff4444');
  }

  render(ctx) {
    Renderer.drawBackground(ctx);
    FX.render(ctx);
    Renderer.drawFighter(ctx, this.player);
    Renderer.drawFighter(ctx, this.ai);
    Renderer.drawHealthBars(ctx, this.player, this.ai);
    this._drawSkillHUD(ctx, this.player);

    // Controls hint bar — dark fantasy style
    ctx.fillStyle = 'rgba(6,10,16,0.75)';
    ctx.fillRect(0, CANVAS_HEIGHT - 28, CANVAS_WIDTH, 28);
    ctx.strokeStyle = 'rgba(58,136,232,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT - 28); ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 28); ctx.stroke();
    ctx.fillStyle = '#2a4060';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('A/D:Move  W/Space:Jump  Z:Light  X:Heavy  LClick:FreeHit  Q:Skill1  E:Skill2  C:Block  V:ULTIMATE  R:Flicker', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
    ctx.textAlign = 'left';  }

  _drawSkillHUD(ctx, p) {
    const startX = 16;
    const baseY  = CANVAS_HEIGHT - 68;
    const boxW   = 50;
    const boxH   = 36;
    const gap    = 5;

    const skillDefs = [
      { key: 'q', label: 'Q', name: p instanceof Pacquiao ? 'STUN'   : 'WAR CRY', cd: p.skills.q.cd, cdMax: p.skills.q.cdMax },
      { key: 'e', label: 'E', name: p instanceof Pacquiao ? 'FLURRY' : 'SPIN',    cd: p.skills.e.cd, cdMax: p.skills.e.cdMax },
      { key: 'c', label: 'C', name: 'BLOCK',   cd: p.skills.c.cd, cdMax: p.skills.c.cdMax },
    ];
    const ultDef    = { label: 'V', name: 'ULTIMATE', used: p.skills.ult.used };
    const flickerDef = { label: 'R', name: 'FLICKER', cd: p._flickerCd || 0, cdMax: 10, isFlicker: true };

    [...skillDefs, ultDef, flickerDef].forEach((sk, i) => {
      const bx = startX + i * (boxW + gap);
      const by = baseY;
      const onCd   = sk.isFlicker ? (sk.cd > 0) : (sk.cd > 0 || sk.used);
      const active = sk.isFlicker ? false : (sk.key ? p.skills[sk.key].active : p.skills.ult.active);

      // background
      if (active) {
        // glowing active state
        ctx.fillStyle = 'rgba(0,204,136,0.25)';
        ctx.fillRect(bx, by, boxW, boxH);
      } else if (onCd) {
        ctx.fillStyle = 'rgba(14,26,46,0.92)';
        ctx.fillRect(bx, by, boxW, boxH);
        // cooldown fill from bottom
        if (!sk.used && sk.cdMax > 0) {
          const ratio = sk.cd / sk.cdMax;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(bx, by, boxW, Math.round(boxH * ratio));
        }
      } else {
        ctx.fillStyle = 'rgba(20,30,48,0.92)';
        ctx.fillRect(bx, by, boxW, boxH);
        // ready glow
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#3A88E8';
        ctx.fillRect(bx, by, boxW, boxH);
        ctx.restore();
      }

      if (sk.used) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(bx, by, boxW, boxH);
      }

      // border
      ctx.strokeStyle = active ? '#00CC88'
        : onCd ? 'rgba(26,48,96,0.8)'
        : i === 3 ? 'rgba(248,183,0,0.7)' : 'rgba(58,136,232,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, boxW, boxH);

      // inner highlight top edge
      if (!onCd && !sk.used) {
        ctx.fillStyle = 'rgba(184,216,248,0.08)';
        ctx.fillRect(bx + 1, by + 1, boxW - 2, 2);
      }

      // key label
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.fillStyle = onCd || sk.used ? '#2a4060' : i === 3 ? '#F8B700' : '#B8D8F8';
      ctx.fillText(`[${sk.label}]`, bx + boxW / 2, by + 14);

      // skill name
      ctx.font = '7px monospace';
      ctx.fillStyle = onCd || sk.used ? '#1a3060' : '#94A3B8';
      ctx.fillText(sk.name, bx + boxW / 2, by + 24);

      // cooldown timer or USED
      if (sk.cd > 0) {
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#F0A030';
        ctx.fillText(sk.cd.toFixed(1) + 's', bx + boxW / 2, by + boxH - 4);
      }
      if (sk.used) {
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#E03050';
        ctx.fillText('USED', bx + boxW / 2, by + boxH - 4);
      }
      if (active) {
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#00CC88';
        ctx.fillText('ACTIVE', bx + boxW / 2, by + boxH - 4);
      }

      ctx.textAlign = 'left';
    });

    // HUD label
    ctx.fillStyle = 'rgba(248,183,0,0.4)';
    ctx.font = '8px monospace';
    ctx.fillText('SKILLS', startX, baseY - 4);
  }
}
