// antonioLuna.js — General Antonio Luna (The Fiery Tactician)
// Q: Rage Mode       — enters temper state, +50% damage, 4s, 12s CD
// E: Revolver Shot   — fires a shot, long range, 8s CD
// C: Saber Parry     — blocks all damage 1s, 1.5s CD
// R: Ultimate — Luna Sharpshooters — calls volley strike, massive damage (once)

class AntonioLuna extends Fighter {
  constructor(x) {
    super(x);
    this.name = 'Gen. Luna';
    this.lightDamage = 9;
    this.heavyDamage = 20;
    this.lightRange = 85;
    this.heavyRange = 105;
    this.lightDuration = 16;
    this.heavyDuration = 28;
    this.moveSpeed = 230;
    this.width = 52;
    this.height = 84;

    this.skills.q.cdMax = 12;
    this.skills.e.cdMax = 8;
    this.skills.c.cdMax = 1.5;

    this._rageActive = false;
    this._revolverTarget = null;
    this._animFrame = 0;
    this._animTimer = 0;
  }

  get lightDamageFinal()  { return this._rageActive ? Math.round(this.lightDamage * 1.5)  : this.lightDamage; }
  get heavyDamageFinal()  { return this._rageActive ? Math.round(this.heavyDamage * 1.5)  : this.heavyDamage; }
  get ultDamage()         { return 45; }

  // Q — Rage Mode
  useSkillQ() {
    if (this.skills.q.cd > 0 || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.q.cd = this.skills.q.cdMax;
    this.skills.q.active = true;
    this.skills.q.timer = 4.0;
    this._rageActive = true;
    this.state = 'skill_q';
    this.attackFrameTimer = 20;
    FX.rageModeEffect(this.x, this.y, this.width, this.height);
    return true;
  }

  // E — Revolver Shot (instant long-range hit)
  useSkillE(target) {
    if (this.skills.e.cd > 0 || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.e.cd = this.skills.e.cdMax;
    this._revolverTarget = target;
    this.state = 'skill_e';
    this.attackFrameTimer = 18;
    // Fire bullet particle
    const bx = this.x + (this.facingRight ? this.width : 0);
    const by = this.y + 30;
    const tx = target.x + target.width / 2;
    const ty = target.y + 30;
    const dx = tx - bx; const dy = ty - by;
    const len = Math.sqrt(dx*dx+dy*dy) || 1;
    for (let i = 0; i < 6; i++) {
      FX.add(new Particle(bx + (dx/len)*i*18, by + (dy/len)*i*18, {
        type: 'circle', size: 5 - i*0.5, endSize: 0,
        color: '#ffe066', life: 0.12, alpha: 1
      }));
    }
    // Deal damage instantly on fire
    const dmg = this._rageActive ? 18 : 12;
    if (target && target.state !== 'dead') {
      target.applyDamage(dmg);
      FX.hitImpact(tx, ty, '#ffe066');
    }
    return true;
  }

  // C — Saber Parry
  useSkillC() {
    if (this.skills.c.cd > 0 || this.state === 'dead') return false;
    this.skills.c.cd = this.skills.c.cdMax;
    this.skills.c.active = true;
    this.skills.c.timer = 1.0;
    this.isBlocking = true;
    this.state = 'skill_c';
    FX.blockEffect(this.x + this.width/2, this.y + this.height/2);
    return true;
  }

  // R — Ultimate: Luna Sharpshooters volley
  useUltimate() {
    if (this.skills.ult.used || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.ult.used = true;
    this.skills.ult.active = true;
    this.skills.ult.timer = 1.5;
    this.state = 'ultimate';
    this.attackActive = true;
    this.attackType = 'ult';
    this.attackFrameTimer = 90;
    this.lastAttackDamageDealt = false;
    FX.ultGloveShockwave(this.x + this.width/2, this.y + this.height/2);
    return true;
  }

  _currentAttackRange() {
    if (this.attackType === 'ult') return this.heavyRange + 50;
    return super._currentAttackRange();
  }

  _onSkillEnd(key) {
    if (key === 'c') { this.isBlocking = false; if (this.state === 'skill_c') this.state = 'idle'; }
    if (key === 'q') { this._rageActive = false; }
    if (key === 'e') { this._revolverTarget = null; if (this.state === 'skill_e') this.state = 'idle'; }
  }

  update(dt) {
    if (this.state === 'walk') {
      this._animTimer += dt;
      if (this._animTimer > 0.13) { this._animTimer = 0; this._animFrame = (this._animFrame + 1) % 4; }
    } else { this._animFrame = 0; this._animTimer = 0; }
    if (this._rageActive) FX.warCryAura(this.x, this.y, this.width, this.height);
    super.update(dt);
  }

  renderSprite(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    ctx.save();
    if (!this.facingRight) {
      ctx.translate(x + this.width, y); ctx.scale(-1,1); ctx.translate(-x,-y);
    }

    const s = this.state;
    const attacking = s === 'attack_light' || s === 'attack_heavy';
    const rage = s === 'skill_q' || this._rageActive;
    const blocking = s === 'skill_c';
    const ult = s === 'ultimate';
    const hurt = s === 'hurt', dead = s === 'dead', stunned = this.stunTimer > 0;
    const af = this._animFrame;

    // Colors — military uniform (dark green/khaki)
    const skin     = dead ? '#777' : '#c8845e';
    const skinDark = dead ? '#555' : '#a06040';
    const uniform  = dead ? '#333' : rage ? '#8B2500' : ult ? '#8B6914' : '#2d4a1e';
    const uniformD = dead ? '#222' : rage ? '#5a1800' : '#1e3214';
    const pantCol  = dead ? '#333' : '#1a2e14';
    const bootCol  = dead ? '#222' : '#1a1008';

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(x+this.width/2, y+this.height, 22, 5, 0, 0, Math.PI*2); ctx.fill();

    // Rage aura
    if (rage) {
      ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#ff4400';
      ctx.fillRect(x-8, y-8, this.width+16, this.height+16); ctx.restore();
    }

    // Boots
    ctx.fillStyle = bootCol;
    ctx.fillRect(x+7,  y+76+(af%2===0?2:0), 16, 8);
    ctx.fillRect(x+28, y+76+(af%2===1?2:0), 16, 8);

    // Legs walk cycle
    const lg = s==='walk' ? Math.sin(af*Math.PI/2)*5 : 0;
    ctx.fillStyle = pantCol;
    ctx.fillRect(x+8,  y+54+lg,  14, 24); ctx.fillRect(x+8,  y+54+lg,  4, 24);
    ctx.fillRect(x+29, y+54-lg, 14, 24); ctx.fillRect(x+29, y+54-lg, 4, 24);

    // Uniform body
    ctx.fillStyle = uniform;
    ctx.fillRect(x+7, y+24, 38, 32);
    ctx.fillStyle = uniformD;
    ctx.fillRect(x+7, y+24, 8, 32);
    // uniform buttons
    ctx.fillStyle = '#c0a030';
    for (let i=0;i<4;i++) ctx.fillRect(x+24, y+26+i*7, 4, 4);
    // epaulettes
    ctx.fillStyle = '#c0a030';
    ctx.fillRect(x+4, y+24, 10, 6); ctx.fillRect(x+38, y+24, 10, 6);
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(x+5, y+25, 8, 2); ctx.fillRect(x+39, y+25, 8, 2);
    // belt
    ctx.fillStyle = '#1a0e06'; ctx.fillRect(x+7, y+54, 38, 5);
    ctx.fillStyle = '#c0a030'; ctx.fillRect(x+22, y+55, 8, 3);

    // Neck + Head
    ctx.fillStyle = skin; ctx.fillRect(x+20, y+16, 12, 10);
    ctx.fillStyle = skin; ctx.fillRect(x+12, y+2, 28, 22);
    ctx.fillStyle = skinDark; ctx.fillRect(x+12, y+2, 6, 22);
    ctx.fillStyle = skinDark; ctx.fillRect(x+12, y+8, 4, 9);

    // Military cap
    const capCol = rage ? '#8B2500' : '#1e3214';
    ctx.fillStyle = capCol; ctx.fillRect(x+10, y+2, 32, 10);
    ctx.fillStyle = uniformD; ctx.fillRect(x+10, y+10, 32, 3);
    ctx.fillStyle = capCol; ctx.fillRect(x+8, y+6, 36, 6);
    ctx.fillStyle = '#c0a030'; ctx.fillRect(x+10, y+3, 32, 2);
    // cap badge
    ctx.fillStyle = '#ffe066'; ctx.fillRect(x+22, y+4, 8, 5);
    ctx.fillStyle = '#c0a030'; ctx.fillRect(x+24, y+5, 4, 3);

    // Eyebrows — fierce
    ctx.fillStyle = '#2c1a0a';
    ctx.fillRect(x+16, y+13, 8, 2); ctx.fillRect(x+27, y+13, 8, 2);

    // Eyes
    if (stunned || dead) {
      ctx.fillStyle = dead ? '#555' : '#e74c3c';
      ctx.fillRect(x+17, y+16, 7, 2); ctx.fillRect(x+18, y+15, 5, 4);
      ctx.fillRect(x+28, y+16, 7, 2); ctx.fillRect(x+29, y+15, 5, 4);
    } else {
      ctx.fillStyle = '#fff'; ctx.fillRect(x+17, y+15, 6, 5); ctx.fillRect(x+28, y+15, 6, 5);
      ctx.fillStyle = '#111'; ctx.fillRect(x+20, y+16, 3, 4); ctx.fillRect(x+31, y+16, 3, 4);
      if (rage) { // glowing red eyes in rage
        ctx.fillStyle = '#ff4400'; ctx.fillRect(x+20, y+16, 3, 4); ctx.fillRect(x+31, y+16, 3, 4);
      }
    }
    ctx.fillStyle = skinDark; ctx.fillRect(x+22, y+20, 3, 3);
    ctx.fillStyle = rage ? '#ff4400' : '#7a3520';
    ctx.fillRect(x+18, y+23, 11, 2);
    // mustache
    ctx.fillStyle = '#2c1a0a';
    ctx.fillRect(x+18, y+21, 5, 2); ctx.fillRect(x+24, y+21, 5, 2);

    // Arms
    ctx.fillStyle = uniformD; ctx.fillRect(x+0, y+26, 8, 24);
    ctx.fillStyle = uniform;  ctx.fillRect(x+1, y+26, 7, 22);
    ctx.fillStyle = skin;     ctx.fillRect(x+1, y+40, 7, 10);
    const armY = attacking || rage ? y+22 : y+26;
    ctx.fillStyle = uniformD; ctx.fillRect(x+43, armY, 8, 24);
    ctx.fillStyle = uniform;  ctx.fillRect(x+43, armY, 7, 22);
    ctx.fillStyle = skin;     ctx.fillRect(x+43, armY+12, 7, 10);

    // Saber
    if (!dead) {
      if (blocking) {
        // guard raised
        ctx.fillStyle = '#c8d0d8'; ctx.fillRect(x+38, y+6, 7, 58);
        ctx.fillStyle = '#fff';    ctx.fillRect(x+38, y+6, 2, 58);
        ctx.fillStyle = '#c0a030'; ctx.fillRect(x+32, y+36, 18, 5);
        ctx.fillStyle = '#6d3a1a'; ctx.fillRect(x+39, y+41, 5, 16);
        ctx.save(); ctx.globalAlpha=0.2; ctx.fillStyle='#27ae60';
        ctx.fillRect(x+28, y+4, 26, 66); ctx.restore();
      } else if (ult) {
        // dramatic slash forward
        ctx.save(); ctx.translate(x+48, y+10); ctx.rotate(0.3);
        ctx.fillStyle = '#f1c40f'; ctx.fillRect(-4,-20,8,72);
        ctx.fillStyle = '#fff';    ctx.fillRect(-4,-20,2,72);
        ctx.fillStyle = '#c0a030'; ctx.fillRect(-10,28,20,6);
        ctx.fillStyle = '#6d3a1a'; ctx.fillRect(-3,34,6,18);
        ctx.globalAlpha=0.35; ctx.fillStyle='#ffe066';
        ctx.fillRect(-8,-25,5,80); ctx.restore();
        // revolver in other hand
        ctx.fillStyle = '#333'; ctx.fillRect(x-2, y+36, 14, 7);
        ctx.fillStyle = '#555'; ctx.fillRect(x-2, y+36, 5, 7);
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x+2, y+43, 4, 6);
      } else {
        const bY = attacking ? y+12 : y+18;
        const bH = attacking ? 48 : 40;
        ctx.fillStyle = attacking ? '#d8e4f0' : '#b0bccc';
        ctx.fillRect(x+47, bY, 7, bH);
        ctx.fillStyle = attacking ? '#fff' : '#d0dce8';
        ctx.fillRect(x+47, bY, 2, bH);
        ctx.fillStyle = '#c0a030'; ctx.fillRect(x+42, bY+bH-2, 16, 5);
        ctx.fillStyle = '#6d3a1a'; ctx.fillRect(x+48, bY+bH+3, 5, 14);
        if (rage) {
          ctx.save(); ctx.globalAlpha=0.35; ctx.fillStyle='#ff4400';
          ctx.fillRect(x+43, bY-4, 16, bH+8); ctx.restore();
        }
        // revolver on hip
        ctx.fillStyle = '#333'; ctx.fillRect(x+35, y+46, 12, 6);
        ctx.fillStyle = '#555'; ctx.fillRect(x+35, y+46, 4, 6);
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x+39, y+52, 3, 5);
      }
    }

    // Rage fire eyes/aura
    if (rage) {
      ctx.save(); ctx.globalAlpha=0.5;
      for(let i=0;i<3;i++){
        ctx.fillStyle=['#ff4400','#ff8800','#ffcc00'][i];
        ctx.fillRect(x+15+i*2, y+1-i*2, 4-i, 4-i);
        ctx.fillRect(x+28+i*2, y+1-i*2, 4-i, 4-i);
      }
      ctx.restore();
    }

    if (stunned) {
      const t=Date.now()/400;
      for(let i=0;i<3;i++){
        const a=t+(i*Math.PI*2)/3;
        ctx.fillStyle='#ffe066'; ctx.fillRect(x+this.width/2+Math.cos(a)*18-4, y-12+Math.sin(a)*8-4, 8, 8);
        ctx.fillStyle='#fff';    ctx.fillRect(x+this.width/2+Math.cos(a)*18-2, y-12+Math.sin(a)*8-2, 4, 4);
      }
    }
    if (hurt||stunned) {
      ctx.save(); ctx.globalAlpha=0.22; ctx.fillStyle='#ff0000';
      ctx.fillRect(x,y,this.width,this.height); ctx.restore();
    }
    ctx.restore();
  }
}
