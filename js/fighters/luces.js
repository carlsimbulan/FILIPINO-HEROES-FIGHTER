// luces.js — Luções Mercenary (The Elite Vanguard)
// Q: Karambit Rush   — rapid knife slashes, 3 hits, 8s CD
// E: Low Sweep       — sweeping kick knockdown, 7s CD
// C: Evasive Roll    — brief invincibility + reposition, 4s CD
// R: Ultimate — Panantukan Barrage — relentless combo, 6 hits (once)

class Luces extends Fighter {
  constructor(x) {
    super(x);
    this.name = 'Luções';
    this.lightDamage = 7;
    this.heavyDamage = 14;
    this.lightRange = 65;
    this.heavyRange = 80;
    this.lightDuration = 10; // fast rushdown
    this.heavyDuration = 20;
    this.moveSpeed = 280; // fastest hero
    this.width = 46;
    this.height = 78;

    this.skills.q.cdMax = 8;
    this.skills.e.cdMax = 7;
    this.skills.c.cdMax = 4;

    this._rushHits = 0;
    this._rushTarget = null;
    this._rushTick = 0;
    this._rollTimer = 0;
    this._invincible = false;
    this._ultHitCount = 0;
    this.themeColor = '#2e7d32'; // forest green — mercenary camouflage
    this._ultHitTick = 0;
    this._ultTarget = null;
    this._animFrame = 0;
    this._animTimer = 0;
  }

  get ultDamage() { return 38; }

  applyDamage(amount) {
    if (this._invincible) return; // roll dodge
    super.applyDamage(amount);
  }

  // Q — Karambit Rush
  useSkillQ(target) {
    if (this.skills.q.cd > 0 || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.q.cd = this.skills.q.cdMax;
    this._rushHits = 3;
    this._rushTick = 0;
    this._rushTarget = target;
    this.state = 'skill_q';
    this.attackFrameTimer = 54; // 3 hits x 18 frames
    this.attackActive = true;
    this.attackType = 'light';
    this.lastAttackDamageDealt = false;
    return true;
  }

  // E — Low Sweep kick
  useSkillE() {
    if (this.skills.e.cd > 0 || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.e.cd = this.skills.e.cdMax;
    this.state = 'skill_e';
    this.attackActive = true;
    this.attackType = 'heavy';
    this.attackFrameTimer = 28;
    this.lastAttackDamageDealt = false;
    FX.slashTrail(this.x+(this.facingRight?this.width:0), this.y+this.height-10, this.facingRight?1:-1, '#f39c12');
    return true;
  }

  // C — Evasive Roll
  useSkillC() {
    if (this.skills.c.cd > 0 || this.state === 'dead') return false;
    this.skills.c.cd = this.skills.c.cdMax;
    this._invincible = true;
    this._rollTimer = 0.5; // 0.5s invincibility
    this.state = 'skill_c';
    // roll in facing direction
    const rollDist = this.facingRight ? 80 : -80;
    moveHorizontal(this, rollDist);
    FX.blockEffect(this.x+this.width/2, this.y+this.height/2);
    return true;
  }

  // R — Panantukan Barrage
  useUltimate(target) {
    if (this.skills.ult.used || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.ult.used = true;
    this.skills.ult.active = true;
    this.skills.ult.timer = 2.0;
    this._ultHitCount = 6;
    this._ultHitTick = 0;
    this._ultTarget = target;
    this.state = 'ultimate';
    this.attackActive = true;
    this.attackType = 'ult';
    this.attackFrameTimer = 120;
    this.lastAttackDamageDealt = false;
    FX.ultGloveShockwave(this.x+this.width/2, this.y+this.height/2);
    return true;
  }

  _currentAttackRange() {
    if (this.attackType === 'ult') return this.heavyRange + 20;
    return super._currentAttackRange();
  }

  _onSkillEnd(key) {
    if (key === 'c') { if(this.state==='skill_c') this.state='idle'; }
    if (key === 'q') { this._rushTarget=null; this._rushHits=0; if(this.state==='skill_q') this.state='idle'; }
    if (key === 'e') { if(this.state==='skill_e') this.state='idle'; }
  }

  update(dt) {
    if (this.state==='walk') {
      this._animTimer+=dt;
      if(this._animTimer>0.09){ this._animTimer=0; this._animFrame=(this._animFrame+1)%4; }
    } else { this._animFrame=0; this._animTimer=0; }

    // Roll invincibility timer
    if (this._invincible) {
      this._rollTimer -= dt;
      if (this._rollTimer <= 0) {
        this._invincible = false;
        if (this.state==='skill_c') this.state='idle';
      }
    }

    // Karambit rush multi-hit
    if (this.state==='skill_q' && this._rushTarget && this._rushHits > 0) {
      this._rushTick -= dt;
      if (this._rushTick <= 0) {
        this._rushTick = 0.22;
        const dist = Math.abs((this.x+this.width/2)-(this._rushTarget.x+this._rushTarget.width/2));
        if (dist <= this.lightRange + 15) {
          this._rushTarget.applyDamage(9);
          this._rushHits--;
          FX.hitImpact(this._rushTarget.x+(this.facingRight?0:this._rushTarget.width),
            this._rushTarget.y+35, '#27ae60');
          FX.slashTrail(this.x+(this.facingRight?this.width:0), this.y+35, this.facingRight?1:-1, '#27ae60');
        }
      }
    }

    // Ultimate barrage multi-hit
    if (this.state==='ultimate' && this._ultTarget && this._ultHitCount > 0) {
      this._ultHitTick -= dt;
      if (this._ultHitTick <= 0) {
        this._ultHitTick = 0.28;
        const dist = Math.abs((this.x+this.width/2)-(this._ultTarget.x+this._ultTarget.width/2));
        if (dist <= this.heavyRange + 20) {
          this._ultTarget.applyDamage(7); // 6 hits x 7 = 42 total
          this._ultHitCount--;
          FX.hitImpact(this._ultTarget.x+(this.facingRight?0:this._ultTarget.width),
            this._ultTarget.y+30, '#f39c12');
        }
      }
    }

    super.update(dt);
  }

  renderSprite(ctx) {
    const x=Math.round(this.x), y=Math.round(this.y);
    ctx.save();
    if (!this.facingRight) { ctx.translate(x+this.width,y); ctx.scale(-1,1); ctx.translate(-x,-y); }

    const s=this.state;
    const attacking=s==='attack_light'||s==='attack_heavy';
    const skillQ=s==='skill_q';
    const skillE=s==='skill_e';
    const rolling=s==='skill_c';
    const ult=s==='ultimate';
    const hurt=s==='hurt', dead=s==='dead', stunned=this.stunTimer>0;
    const af=this._animFrame;
    const invis=this._invincible;

    const skin     = dead?'#777':'#c8845e';
    const skinDark = dead?'#555':'#a06040';
    const vestMain = dead?'#444':ult?'#5a3000':'#2d1a0a';
    const vestDark = dead?'#333':'#1a0e04';
    const pantCol  = dead?'#333':'#2a1a0e';
    const wrapCol  = '#8B4513';

    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(x+this.width/2,y+this.height,18,4,0,0,Math.PI*2); ctx.fill();

    if (invis) { ctx.save(); ctx.globalAlpha=0.15; ctx.fillStyle='#00ff88';
      ctx.fillRect(x-6,y-6,this.width+12,this.height+12); ctx.restore(); }
    if (ult) { ctx.save(); ctx.globalAlpha=0.2; ctx.fillStyle='#f39c12';
      ctx.fillRect(x-8,y-8,this.width+16,this.height+16); ctx.restore(); }

    // Bare feet/wraps
    ctx.fillStyle=wrapCol;
    ctx.fillRect(x+5, y+70+(af%2===0?2:0), 14,8);
    ctx.fillRect(x+25,y+70+(af%2===1?2:0), 14,8);

    // Legs
    const lg=s==='walk'?Math.sin(af*Math.PI/2)*6:0;
    ctx.fillStyle=pantCol;
    ctx.fillRect(x+6,  y+50+lg, 13,22); ctx.fillRect(x+6,  y+50+lg, 4,22);
    ctx.fillRect(x+26, y+50-lg, 13,22); ctx.fillRect(x+26, y+50-lg, 4,22);
    // leg wraps
    ctx.fillStyle=wrapCol;
    ctx.fillRect(x+6, y+56+lg,13,2); ctx.fillRect(x+26,y+56-lg,13,2);
    ctx.fillRect(x+6, y+64+lg,13,2); ctx.fillRect(x+26,y+64-lg,13,2);

    // Vest/torso — bare-chested mercenary look
    ctx.fillStyle=vestMain;
    ctx.fillRect(x+5,y+24,36,28);
    ctx.fillStyle=vestDark; ctx.fillRect(x+5,y+24,7,28);
    // vest straps
    ctx.fillStyle=wrapCol;
    ctx.fillRect(x+13,y+24,4,28); ctx.fillRect(x+27,y+24,4,28);
    // chest muscles visible (skin showing in middle)
    ctx.fillStyle=skin;
    ctx.fillRect(x+18,y+26,10,22);
    ctx.fillStyle=skinDark;
    ctx.fillRect(x+18,y+26,2,22); ctx.fillRect(x+26,y+26,2,22);
    ctx.fillRect(x+18,y+35,10,2);
    // belt
    ctx.fillStyle=vestDark; ctx.fillRect(x+5,y+50,36,4);
    ctx.fillStyle=wrapCol;  ctx.fillRect(x+5,y+50,36,2);

    // Neck + Head
    ctx.fillStyle=skin; ctx.fillRect(x+17,y+16,12,10);
    ctx.fillStyle=skin; ctx.fillRect(x+10,y+2,26,22);
    ctx.fillStyle=skinDark; ctx.fillRect(x+10,y+2,6,22);
    ctx.fillStyle=skinDark; ctx.fillRect(x+10,y+8,4,10);

    // Head wrap / cloth
    ctx.fillStyle='#3a1a0a';
    ctx.fillRect(x+10,y+2,26,10);
    ctx.fillStyle=wrapCol;
    ctx.fillRect(x+10,y+3,26,2); ctx.fillRect(x+10,y+8,26,2);
    // headband
    ctx.fillStyle='#8B4513'; ctx.fillRect(x+10,y+6,26,4);

    ctx.fillStyle='#1a0a00'; ctx.fillRect(x+14,y+13,6,2); ctx.fillRect(x+25,y+13,6,2);

    if (stunned||dead) {
      ctx.fillStyle=dead?'#555':'#e74c3c';
      ctx.fillRect(x+15,y+16,6,2); ctx.fillRect(x+16,y+15,4,4);
      ctx.fillRect(x+26,y+16,6,2); ctx.fillRect(x+27,y+15,4,4);
    } else {
      ctx.fillStyle='#fff'; ctx.fillRect(x+15,y+15,6,5); ctx.fillRect(x+26,y+15,6,5);
      ctx.fillStyle='#111'; ctx.fillRect(x+18,y+16,3,4); ctx.fillRect(x+29,y+16,3,4);
      ctx.fillStyle='#fff'; ctx.fillRect(x+19,y+16,1,1); ctx.fillRect(x+30,y+16,1,1);
    }
    ctx.fillStyle=skinDark; ctx.fillRect(x+20,y+20,3,3);
    ctx.fillStyle='#7a3520'; ctx.fillRect(x+16,y+23,14,2);
    // small beard/stubble
    ctx.fillStyle='#2c1a0a'; ctx.fillRect(x+16,y+22,4,2); ctx.fillRect(x+26,y+22,4,2);

    // Arms
    ctx.fillStyle=skinDark; ctx.fillRect(x+0,y+26,8,20);
    ctx.fillStyle=skin;     ctx.fillRect(x+1,y+26,7,20);
    // arm wraps
    ctx.fillStyle=wrapCol;
    ctx.fillRect(x+1,y+34,7,2); ctx.fillRect(x+1,y+40,7,2);
    const armY=attacking||skillQ||ult?y+22:y+26;
    ctx.fillStyle=skinDark; ctx.fillRect(x+38,armY,8,20);
    ctx.fillStyle=skin;     ctx.fillRect(x+38,armY,7,20);
    ctx.fillStyle=wrapCol;
    ctx.fillRect(x+38,armY+8,7,2); ctx.fillRect(x+38,armY+14,7,2);

    // Karambit knife / bolo
    if (!dead) {
      if (rolling) {
        // blur/dash lines
        ctx.save(); ctx.globalAlpha=0.5;
        for(let i=1;i<=4;i++){
          ctx.fillStyle=`rgba(255,200,100,${0.2/i})`;
          ctx.fillRect(x-(this.facingRight?i*12:-i*12),y,this.width,this.height);
        }
        ctx.restore();
      } else if (ult||skillQ) {
        // Two weapons — karambit in each hand
        const kCol=ult?'#f39c12':'#27ae60';
        ctx.fillStyle=kCol;
        // right hand blade — curved karambit shape
        ctx.fillRect(x+44,y+28,4,14);
        ctx.fillRect(x+46,y+22,6,10);
        ctx.fillStyle='#8B4513'; ctx.fillRect(x+44,y+40,4,8);
        // left blade
        ctx.fillStyle=kCol;
        ctx.fillRect(x-6,y+28,4,14);
        ctx.fillRect(x-8,y+22,6,10);
        ctx.fillStyle='#8B4513'; ctx.fillRect(x-6,y+40,4,8);
        if (ult||skillQ) {
          ctx.save(); ctx.globalAlpha=0.4; ctx.fillStyle=kCol;
          ctx.fillRect(x+40,y+18,14,30); ctx.fillRect(x-10,y+18,14,30); ctx.restore();
        }
      } else {
        // Single karambit on right
        const bY=attacking?y+24:y+28;
        const kCol=attacking?'#27ae60':'#6B8E23';
        ctx.fillStyle=kCol;
        ctx.fillRect(x+43,bY,4,14);
        ctx.fillRect(x+45,bY-6,6,10);
        ctx.fillStyle='#8B4513'; ctx.fillRect(x+43,bY+14,4,8);
        if (attacking) {
          ctx.save(); ctx.globalAlpha=0.4; ctx.fillStyle='#27ae60';
          ctx.fillRect(x+39,bY-8,14,28); ctx.restore();
        }
        // bolo on hip
        ctx.fillStyle='#8a9898'; ctx.fillRect(x+32,y+48,10,4);
        ctx.fillStyle='#6d4c1a'; ctx.fillRect(x+37,y+52,4,8);
      }
    }

    if (stunned) {
      const t=Date.now()/400;
      for(let i=0;i<3;i++){
        const a=t+(i*Math.PI*2)/3;
        const sx=x+this.width/2+Math.cos(a)*16, sy=y-10+Math.sin(a)*7;
        ctx.fillStyle='#ffe066'; ctx.fillRect(sx-4,sy-4,8,8);
        ctx.fillStyle='#fff';   ctx.fillRect(sx-2,sy-2,4,4);
      }
    }
    if ((hurt||stunned)&&!invis) {
      ctx.save(); ctx.globalAlpha=0.22; ctx.fillStyle='#ff0000';
      ctx.fillRect(x,y,this.width,this.height); ctx.restore();
    }
    ctx.restore();
  }
}
