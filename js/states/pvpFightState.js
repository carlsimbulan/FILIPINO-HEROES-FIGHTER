// pvpFightState.js — PVP real-time fight screen

class PVPFightState {
  constructor(game, input) {
    this.game  = game;
    this.input = input;

    this.p1Fighter  = null; // fighter at left position
    this.p2Fighter  = null; // fighter at right position
    this.myFighter  = null; // the fighter this client controls
    this.oppFighter = null; // opponent's fighter

    this._myPosition    = null; // 'p1' | 'p2'
    this._myUsername    = null;
    this._p1Username    = null;
    this._p2Username    = null;
    this._roundOver     = false;
  }

  // ── Lifecycle ─────────────────────────────────────────

  enter(payload) {
    // payload: { p1Hero, p2Hero, myPosition, roomId, p1Username, p2Username }
    this._roundOver  = false;
    this._myPosition = payload.myPosition || (typeof PVPClient !== 'undefined' ? PVPClient.myPosition : 'p1');
    this._myUsername = typeof PVPClient !== 'undefined' ? PVPClient.myUsername : '';
    this._p1Username = payload.p1Username || '';
    this._p2Username = payload.p2Username || '';
    this._roomId     = payload.roomId || (typeof PVPClient !== 'undefined' ? PVPClient.roomId : null);

    // Ensure PVPClient.roomId is always set
    if (typeof PVPClient !== 'undefined' && this._roomId) {
      PVPClient.roomId = this._roomId;
    }

    const p1X = Math.round(CANVAS_WIDTH * 0.18);
    const p2X = Math.round(CANVAS_WIDTH * 0.72);

    this.p1Fighter = this._createFighter(payload.p1Hero, p1X);
    this.p2Fighter = this._createFighter(payload.p2Hero, p2X);

    this.p1Fighter.facingRight = true;
    this.p2Fighter.facingRight = false;

    if (this._myPosition === 'p1') {
      this.myFighter  = this.p1Fighter;
      this.oppFighter = this.p2Fighter;
    } else {
      this.myFighter  = this.p2Fighter;
      this.oppFighter = this.p1Fighter;
    }

    // Reset opponent input buffer
    if (typeof PVPClient !== 'undefined') {
      PVPClient.opponentInput = { held: [], pressed: [], mouseX: 0 };
    }
    this._lastOppSnapshotId = -1; // track which snapshot we last consumed pressed from

    this.input.setActive(true);
    FX.clear();
    if (typeof BattleBG_Renderer !== 'undefined') BattleBG_Renderer.reset();

    // Listen for server-authoritative fight result and opponent disconnect
    this._onFightResult = ({ winner }) => {
      const iWon = (winner === this._myUsername);
      // Transition to WIN screen (server confirmed the result)
      this.game.transition(States.WIN, { winner: iWon ? 'player' : 'ai' });
      if (typeof PVPClient !== 'undefined') PVPClient.reset();
    };

    this._onOpponentLeft = () => {
      if (this._roundOver) return;
      this._roundOver = true;
      // Award win to local player
      GameAPI.recordPVPWin(this._myUsername).catch(() => {});
      Audio.playVictory();
      FX.ultLabel(this.myFighter.x + this.myFighter.width / 2, this.myFighter.y - 20, 'OPPONENT LEFT', '#F8B700');
      setTimeout(() => {
        this.game.transition(States.WIN, { winner: 'player' });
        if (typeof PVPClient !== 'undefined') PVPClient.reset();
      }, 1200);
    };

    if (typeof PVPClient !== 'undefined') {
      PVPClient.on('pvp:fight_result', this._onFightResult);
      PVPClient.on('pvp:opponent_left', this._onOpponentLeft);
    }
  }

  exit() {
    this.input.setActive(false);
    if (typeof PVPClient !== 'undefined') {
      if (this._onFightResult)  PVPClient.off('pvp:fight_result',  this._onFightResult);
      if (this._onOpponentLeft) PVPClient.off('pvp:opponent_left', this._onOpponentLeft);
    }
  }

  // ── Fighter factory (same as FightState) ─────────────

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

  // ── Update ────────────────────────────────────────────

  update(dt) {
    if (typeof BattleBG_Renderer !== 'undefined') BattleBG_Renderer.update(dt);
    if (this._roundOver) return;

    const my  = this.myFighter;
    const opp = this.oppFighter;

    // 1. Build and send local input snapshot
    const snapshot = {
      held:   [...this.input._held],
      pressed:[...this.input._pressed],
      mouseX: this.input.mouseX
    };
    if (typeof PVPClient !== 'undefined') PVPClient.sendInput(snapshot);

    // 2. Apply local inputs to my fighter
    const busy = (f) => ['attack_light','attack_heavy','skill_q','skill_e','ultimate'].includes(f.state);

    if (my.state !== 'dead' && my.stunTimer <= 0) {
      if (!busy(my) && my.state !== 'skill_c') {
        if (this.input.isDown(Keys.LEFT)) {
          moveHorizontal(my, -my.moveSpeed * dt);
          my.facingRight = false;
          if (my.state === 'idle') my.state = 'walk';
        } else if (this.input.isDown(Keys.RIGHT)) {
          moveHorizontal(my, my.moveSpeed * dt);
          my.facingRight = true;
          if (my.state === 'idle') my.state = 'walk';
        } else {
          if (my.state === 'walk') my.state = 'idle';
        }
      } else {
        if (my.state === 'walk') my.state = 'idle';
      }

      if (this.input.wasPressed(Keys.UP) && my._jumpsLeft > 0) {
        if (!my.onGround) FX.flickerEffect(my.x, my.y, my.width, my.height);
        my.vy = my.jumpVelocity;
        my.onGround = false;
        my._jumpsLeft--;
      }

      if (this.input.wasPressed(Keys.LIGHT_ATTACK) && !busy(my)) { my.startAttack('light');  Audio.playLightAttack(); }
      else if (this.input.wasPressed(Keys.HEAVY_ATTACK) && !busy(my)) { my.startAttack('heavy'); Audio.playHeavyAttack(); }
      if (this.input.wasPressed(Keys.FREE_HIT) && !busy(my))  { my.startFreeHit();  Audio.playFreeHit(); }
      if (this.input.wasPressed(Keys.SKILL_Q) && !busy(my))   { if (my.useSkillQ(opp))  Audio.playSkillQ(); }
      if (this.input.wasPressed(Keys.SKILL_E) && !busy(my))   { if (my.useSkillE(opp))  Audio.playSkillE(); }
      if (this.input.wasPressed(Keys.SKILL_C))                 { if (my.useSkillC())     Audio.playSkillC(); }
      if (this.input.wasPressed(Keys.ULTIMATE) && !busy(my))  { if (my.useUltimate(opp)) Audio.playUltimate(); }
      if (this.input.wasPressed(Keys.FLICKER))                 { if (my.useFlicker(this.input.mouseX)) Audio.playSkillC(); }
    }

    // 3. Apply opponent's latest received input snapshot
    const oppSnap = (typeof PVPClient !== 'undefined') ? PVPClient.opponentInput : null;
    if (oppSnap && opp.state !== 'dead' && opp.stunTimer <= 0) {
      const oppHeld    = oppSnap.held    || [];
      const oppPressed = oppSnap.pressed || [];
      const oppMouseX  = oppSnap.mouseX  || 0;

      if (!busy(opp) && opp.state !== 'skill_c') {
        if (oppHeld.includes(Keys.LEFT)) {
          moveHorizontal(opp, -opp.moveSpeed * dt);
          opp.facingRight = false;
          if (opp.state === 'idle') opp.state = 'walk';
        } else if (oppHeld.includes(Keys.RIGHT)) {
          moveHorizontal(opp, opp.moveSpeed * dt);
          opp.facingRight = true;
          if (opp.state === 'idle') opp.state = 'walk';
        } else {
          if (opp.state === 'walk') opp.state = 'idle';
        }
      } else {
        if (opp.state === 'walk') opp.state = 'idle';
      }

      if (oppPressed.includes(Keys.UP) && opp._jumpsLeft > 0) {
        if (!opp.onGround) FX.flickerEffect(opp.x, opp.y, opp.width, opp.height);
        opp.vy = opp.jumpVelocity;
        opp.onGround = false;
        opp._jumpsLeft--;
      }

      if (oppPressed.includes(Keys.LIGHT_ATTACK) && !busy(opp)) { opp.startAttack('light'); }
      else if (oppPressed.includes(Keys.HEAVY_ATTACK) && !busy(opp)) { opp.startAttack('heavy'); }
      if (oppPressed.includes(Keys.FREE_HIT) && !busy(opp)) { opp.startFreeHit(); }
      if (oppPressed.includes(Keys.SKILL_Q) && !busy(opp))  { opp.useSkillQ(my); }
      if (oppPressed.includes(Keys.SKILL_E) && !busy(opp))  { opp.useSkillE(my); }
      if (oppPressed.includes(Keys.SKILL_C))                 { opp.useSkillC(); }
      if (oppPressed.includes(Keys.ULTIMATE) && !busy(opp)) { opp.useUltimate(my); }
      if (oppPressed.includes(Keys.FLICKER))                 { opp.useFlicker(oppMouseX); }

      // Clear pressed after consuming so one-shot actions don't repeat next frame
      oppSnap.pressed = [];
    }

    // 4. Face each other
    if (my.state !== 'dead' && opp.state !== 'dead') {
      const myCenter  = my.x  + my.width  / 2;
      const oppCenter = opp.x + opp.width / 2;
      if (my.stunTimer <= 0 && !busy(my))   my.facingRight  = oppCenter > myCenter;
      if (opp.stunTimer <= 0 && !busy(opp)) opp.facingRight = myCenter  > oppCenter;
    }

    // 5. Physics update
    my.update(dt);
    opp.update(dt);

    // 6. Hit detection
    this._resolveHit(my,  opp);
    this._resolveHit(opp, my);
    this._resolveStunHit(my,  opp);
    this._resolveStunHit(opp, my);

    // 7. Win check — emit fight end, then wait for server's pvp:fight_result to transition
    if (!this._roundOver && (my.health <= 0 || opp.health <= 0)) {
      this._roundOver = true; // stop update loop, but transition happens in _onFightResult
      const iWon = my.health > 0;
      const winnerUsername = iWon ? this._myUsername : (
        this._myPosition === 'p1' ? this._p2Username : this._p1Username
      );
      // Play audio immediately so it doesn't feel delayed
      if (iWon) { Audio.playVictory(); } else { Audio.playDefeat(); }
      if (typeof PVPClient !== 'undefined') PVPClient.sendFightEnd(winnerUsername);
      // Fallback: if server doesn't respond in 2s, transition anyway
      setTimeout(() => {
        if (this.game._currentKey === States.PVP_FIGHTING) {
          this.game.transition(States.WIN, { winner: iWon ? 'player' : 'ai' });
          if (typeof PVPClient !== 'undefined') PVPClient.reset();
        }
      }, 2000);
    }

    this.input.update();
    FX.update(dt);
  }

  // ── Hit detection (copied from FightState) ────────────

  _resolveHit(attacker, defender) {
    if (!attacker.attackActive || attacker.lastAttackDamageDealt) return;
    if (attacker.attackType === 'q_stun') return;

    const atkBox = attacker.getAttackHitBox();
    const defBox = defender.getHitBox();
    if (!rectsOverlap(atkBox, defBox)) return;

    let dmg;
    if (attacker.attackType === 'free') {
      dmg = 1 + Math.floor(Math.random() * 2);
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
      FX.hitImpact(hx, hy, '#bdc3c7');
      FX.slashTrail(hx, hy, attacker.facingRight ? 1 : -1, '#bdc3c7');
    } else {
      Audio.playHit();
      const col = (attacker.attackType === 'ult' || attacker.attackType === 'e_spin') ? '#ffe066' : '#fff';
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

  // ── Render ────────────────────────────────────────────

  render(ctx) {
    const focusX = (this.p1Fighter.x + this.p1Fighter.width / 2 +
                    this.p2Fighter.x + this.p2Fighter.width / 2) / 2;
    Renderer.drawBackground(ctx, focusX);
    FX.render(ctx);
    Renderer.drawFighter(ctx, this.p1Fighter);
    Renderer.drawFighter(ctx, this.p2Fighter);
    this._drawHealthBars(ctx);
    this._drawSkillHUD(ctx, this.myFighter);

    // Controls hint bar
    ctx.fillStyle = 'rgba(6,10,16,0.75)';
    ctx.fillRect(0, CANVAS_HEIGHT - 28, CANVAS_WIDTH, 28);
    ctx.strokeStyle = 'rgba(58,136,232,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT - 28); ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 28); ctx.stroke();
    ctx.fillStyle = '#2a4060';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('A/D:Move  W/Space:Jump  Z:Light  X:Heavy  LClick:FreeHit  Q:Skill1  E:Skill2  C:Block  V:ULTIMATE  R:Flicker', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
    ctx.textAlign = 'left';
  }

  _drawHealthBars(ctx) {
    const p1 = this.p1Fighter;
    const p2 = this.p2Fighter;
    const p1Name = this._p1Username || 'Player 1';
    const p2Name = this._p2Username || 'Player 2';

    const barW = 260, barH = 18, barY = 14;

    // P1 health bar (left)
    ctx.fillStyle = 'rgba(6,10,22,0.75)';
    ctx.fillRect(20, barY, barW + 4, barH + 4);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(22, barY + 2, barW, barH);
    const p1ratio = Math.max(0, p1.health / p1.maxHealth);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(22, barY + 2, Math.round(barW * p1ratio), barH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Georgia,serif';
    ctx.textAlign = 'left';
    ctx.fillText(p1Name + (this._myPosition === 'p1' ? ' (YOU)' : ''), 22, barY + barH + 14);

    // P2 health bar (right)
    const p2X = CANVAS_WIDTH - 20 - barW - 4;
    ctx.fillStyle = 'rgba(6,10,22,0.75)';
    ctx.fillRect(p2X, barY, barW + 4, barH + 4);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(p2X + 2, barY + 2, barW, barH);
    const p2ratio = Math.max(0, p2.health / p2.maxHealth);
    ctx.fillStyle = '#27ae60';
    const p2green = Math.round(barW * p2ratio);
    ctx.fillRect(p2X + 2 + (barW - p2green), barY + 2, p2green, barH);
    ctx.textAlign = 'right';
    ctx.fillText(p2Name + (this._myPosition === 'p2' ? ' (YOU)' : ''), p2X + barW + 2, barY + barH + 14);
    ctx.textAlign = 'left';

    // PVP label
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F8B700';
    ctx.font = 'bold 13px Georgia,serif';
    ctx.fillText('⚔ PVP ⚔', CANVAS_WIDTH / 2, barY + barH / 2 + 5);
    ctx.textAlign = 'left';
  }

  _drawSkillHUD(ctx, p) {
    if (!p) return;
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
    const ultDef     = { label: 'V', name: 'ULTIMATE', used: p.skills.ult.used };
    const flickerDef = { label: 'R', name: 'FLICKER',  cd: p._flickerCd || 0, cdMax: 10, isFlicker: true };

    [...skillDefs, ultDef, flickerDef].forEach((sk, i) => {
      const bx = startX + i * (boxW + gap);
      const by = baseY;
      const onCd   = sk.isFlicker ? (sk.cd > 0) : (sk.cd > 0 || sk.used);
      const active = sk.isFlicker ? false : (sk.key ? p.skills[sk.key].active : p.skills.ult.active);

      ctx.fillStyle = active ? 'rgba(0,204,136,0.25)' : onCd ? 'rgba(14,26,46,0.92)' : 'rgba(20,30,48,0.92)';
      ctx.fillRect(bx, by, boxW, boxH);
      if (onCd && !sk.used && sk.cdMax > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx, by, boxW, Math.round(boxH * (sk.cd / sk.cdMax)));
      }
      if (sk.used) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(bx, by, boxW, boxH); }

      ctx.strokeStyle = active ? '#00CC88' : onCd ? 'rgba(26,48,96,0.8)' : i === 3 ? 'rgba(248,183,0,0.7)' : 'rgba(58,136,232,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, boxW, boxH);

      ctx.textAlign = 'center';
      ctx.font = 'bold 12px Georgia,serif';
      ctx.fillStyle = onCd || sk.used ? '#2a4060' : i === 3 ? '#F8B700' : '#B8D8F8';
      ctx.fillText('[' + sk.label + ']', bx + boxW / 2, by + 14);
      ctx.font = '7px monospace';
      ctx.fillStyle = onCd || sk.used ? '#1a3060' : '#94A3B8';
      ctx.fillText(sk.name, bx + boxW / 2, by + 24);
      if (sk.cd > 0) { ctx.font = 'bold 10px monospace'; ctx.fillStyle = '#F0A030'; ctx.fillText(sk.cd.toFixed(1) + 's', bx + boxW / 2, by + boxH - 4); }
      if (sk.used)   { ctx.font = 'bold 8px monospace';  ctx.fillStyle = '#E03050'; ctx.fillText('USED',   bx + boxW / 2, by + boxH - 4); }
      if (active)    { ctx.font = 'bold 8px monospace';  ctx.fillStyle = '#00CC88'; ctx.fillText('ACTIVE', bx + boxW / 2, by + boxH - 4); }
      ctx.textAlign = 'left';
    });

    ctx.fillStyle = 'rgba(248,183,0,0.4)';
    ctx.font = '8px monospace';
    ctx.fillText('SKILLS', startX, baseY - 4);
  }
}
