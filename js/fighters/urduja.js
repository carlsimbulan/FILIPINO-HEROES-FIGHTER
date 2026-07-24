// urduja.js — Princess Urduja (The Amazonian Swordmaster)
// Q: Eskrima Storm   — dual stick rapid hits, 3s, 10s CD
// E: Kampilan Counter— next hit deflected + counter 25dmg, 8s CD
// C: Warrior's Guard — blocks all damage 1s, 1.5s CD
// R: Ultimate — Amazon's Wrath — spinning kampilan strike (once)

class Urduja extends Fighter {
  constructor(x) {
    super(x);
    this.name = 'Urduja';
    this.lightDamage = 7;
    this.heavyDamage = 17;
    this.lightRange = 78;
    this.heavyRange = 105;
    this.lightDuration = 14;
    this.heavyDuration = 26;
    this.moveSpeed = 245;
    this.width = 48;
    this.height = 80;

    this.skills.q.cdMax = 10;
    this.skills.e.cdMax = 8;
    this.skills.c.cdMax = 1.5;

    this._eskrimaTick = 0;
    this._eskirmaTarget = null;
    this._counterReady = false;
    this._spinAngle = 0;
    this._animFrame = 0;
    this._animTimer = 0;
    this.themeColor = '#6a1b9a'; // royal purple — Amazon queen
  }

  get ultDamage() { return 42; }

  // Q — Eskrima Storm
  useSkillQ(target) {
    if (this.skills.q.cd > 0 || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.q.cd = this.skills.q.cdMax;
    this.skills.q.active = true;
    this.skills.q.timer = 3.0;
    this._eskrimaTick = 0;
    this._eskirmaTarget = target;
    this.state = 'skill_q';
    return true;
  }

  // E — Kampilan Counter
  useSkillE() {
    if (this.skills.e.cd > 0 || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.e.cd = this.skills.e.cdMax;
    this._counterReady = true;
    this.isBlocking = true; // blocks next hit, triggers counter
    this.skills.e.active = true;
    this.skills.e.timer = 2.0;
    this.state = 'skill_e';
    FX.blockEffect(this.x+this.width/2, this.y+this.height/2);
    return true;
  }

  // C — Warrior's Guard
  useSkillC() {
    if (this.skills.c.cd > 0 || this.state === 'dead') return false;
    this.skills.c.cd = this.skills.c.cdMax;
    this.skills.c.active = true;
    this.skills.c.timer = 1.0;
    this.isBlocking = true;
    this.state = 'skill_c';
    FX.blockEffect(this.x+this.width/2, this.y+this.height/2);
    return true;
  }

  // R — Amazon's Wrath
  useUltimate() {
    if (this.skills.ult.used || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.ult.used = true;
    this.skills.ult.active = true;
    this.skills.ult.timer = 1.4;
    this._spinAngle = 0;
    this.state = 'ultimate';
    this.attackActive = true;
    this.attackType = 'ult';
    this.attackFrameTimer = 84;
    this.lastAttackDamageDealt = false;
    FX.ultGloveShockwave(this.x+this.width/2, this.y+this.height/2);
    return true;
  }

  _currentAttackRange() {
    if (this.attackType === 'ult') return this.heavyRange + 45;
    return super._currentAttackRange();
  }

  _onSkillEnd(key) {
    if (key === 'c') { this.isBlocking = false; if(this.state==='skill_c') this.state='idle'; }
    if (key === 'e') { this._counterReady = false; this.isBlocking = false; if(this.state==='skill_e') this.state='idle'; }
    if (key === 'q') { this._eskirmaTarget = null; if(this.state==='skill_q') this.state='idle'; }
  }

  update(dt) {
    if (this.state==='walk') {
      this._animTimer+=dt;
      if(this._animTimer>0.11){ this._animTimer=0; this._animFrame=(this._animFrame+1)%4; }
    } else { this._animFrame=0; this._animTimer=0; }

    // Eskrima rapid hits
    if (this.skills.q.active && this._eskirmaTarget) {
      this._eskrimaTick -= dt;
      if (this._eskrimaTick <= 0) {
        this._eskrimaTick = 0.2;
        const dist = Math.abs((this.x+this.width/2)-(this._eskirmaTarget.x+this._eskirmaTarget.width/2));
        if (dist <= this.lightRange + 20) {
          this._eskirmaTarget.applyDamage(5);
          FX.hitImpact(this._eskirmaTarget.x+(this.facingRight?0:this._eskirmaTarget.width), this._eskirmaTarget.y+30, '#c0a030');
          FX.slashTrail(this.x+(this.facingRight?this.width:0), this.y+35, this.facingRight?1:-1, '#c0a030');
        }
      }
    }

    // Ult spin angle
    if (this.state==='ultimate') this._spinAngle += dt * Math.PI * 5;

    super.update(dt);
  }

  renderSprite(ctx) {
    const x=Math.round(this.x), y=Math.round(this.y);
    ctx.save();
    if (!this.facingRight) { ctx.translate(x+this.width,y); ctx.scale(-1,1); ctx.translate(-x,-y); }

    const s=this.state;
    const attacking=s==='attack_light'||s==='attack_heavy';
    const skillQ=s==='skill_q';
    const counter=s==='skill_e';
    const blocking=s==='skill_c';
    const ult=s==='ultimate';
    const hurt=s==='hurt', dead=s==='dead', stunned=this.stunTimer>0;
    const af=this._animFrame;

    const skin     = dead?'#777':'#c8845e';
    const skinDark = dead?'#555':'#a06040';
    const armorMain= dead?'#444':ult?'#8B6914':'#6b1a6b';
    const armorDark= dead?'#333':ult?'#6a5000':'#4a104a';
    const goldCol  = '#c0a030';
    const pantCol  = dead?'#333':'#3a1a5a';

    if (ult) {
      ctx.save(); ctx.globalAlpha=0.2; ctx.fillStyle='#f1c40f';
      ctx.fillRect(x-10,y-10,this.width+20,this.height+20); ctx.restore();
    }

    // Sandals
    ctx.fillStyle='#8B6914';
    ctx.fillRect(x+6, y+72+(af%2===0?2:0), 14, 8);
    ctx.fillRect(x+26,y+72+(af%2===1?2:0), 14, 8);

    // Legs
    const lg=s==='walk'?Math.sin(af*Math.PI/2)*5:0;
    ctx.fillStyle=pantCol;
    ctx.fillRect(x+7,  y+52+lg, 13,22); ctx.fillRect(x+7,  y+52+lg, 3,22);
    ctx.fillRect(x+27, y+52-lg, 13,22); ctx.fillRect(x+27, y+52-lg, 3,22);
    // leg wraps
    ctx.fillStyle=goldCol;
    ctx.fillRect(x+7,y+58+lg,13,2); ctx.fillRect(x+27,y+58-lg,13,2);

    // Skirt/kilt
    ctx.fillStyle=armorMain;
    ctx.fillRect(x+5,y+46,38,8);
    ctx.fillStyle=goldCol;
    for(let i=0;i<5;i++) ctx.fillRect(x+7+i*7,y+47,4,6);

    // Torso armor
    ctx.fillStyle=armorMain;
    ctx.fillRect(x+6,y+24,36,24);
    ctx.fillStyle=armorDark; ctx.fillRect(x+6,y+24,7,24);
    // armor pattern
    ctx.fillStyle=goldCol;
    ctx.fillRect(x+12,y+26,22,3); ctx.fillRect(x+12,y+34,22,3);
    ctx.fillRect(x+4,y+24,10,7); ctx.fillRect(x+34,y+24,10,7);

    // Neck + Head
    ctx.fillStyle=skin; ctx.fillRect(x+18,y+17,12,9);
    ctx.fillStyle=skin; ctx.fillRect(x+11,y+2,26,22);
    ctx.fillStyle=skinDark; ctx.fillRect(x+11,y+2,5,22);
    ctx.fillStyle=skinDark; ctx.fillRect(x+11,y+8,3,9);

    // Hair — long, adorned with gold
    ctx.fillStyle='#1a0a00';
    ctx.fillRect(x+11,y+2,26,8);
    ctx.fillRect(x+11,y+8,4,16); // hair on sides
    ctx.fillRect(x+33,y+8,4,16);
    // hair ornament
    ctx.fillStyle=goldCol;
    ctx.fillRect(x+14,y+3,4,5); ctx.fillRect(x+20,y+2,4,5); ctx.fillRect(x+26,y+3,4,5);

    // Crown
    ctx.fillStyle=goldCol;
    ctx.fillRect(x+13,y+2,22,4);
    for(let i=0;i<4;i++) ctx.fillRect(x+15+i*5,y-1,3,5);

    ctx.fillStyle='#2c1a0a'; ctx.fillRect(x+15,y+11,7,2); ctx.fillRect(x+26,y+11,7,2);

    if (stunned||dead) {
      ctx.fillStyle=dead?'#555':'#e74c3c';
      ctx.fillRect(x+16,y+14,7,2); ctx.fillRect(x+17,y+13,5,4);
      ctx.fillRect(x+27,y+14,7,2); ctx.fillRect(x+28,y+13,5,4);
    } else {
      ctx.fillStyle='#fff'; ctx.fillRect(x+16,y+13,6,5); ctx.fillRect(x+27,y+13,6,5);
      ctx.fillStyle='#111'; ctx.fillRect(x+19,y+14,3,4); ctx.fillRect(x+30,y+14,3,4);
    }
    ctx.fillStyle=skinDark; ctx.fillRect(x+21,y+18,3,3);
    ctx.fillStyle='#7a3520'; ctx.fillRect(x+17,y+22,12,2);

    // Arms
    ctx.fillStyle=armorDark; ctx.fillRect(x+0,y+26,8,20);
    ctx.fillStyle=armorMain; ctx.fillRect(x+1,y+26,7,18);
    ctx.fillStyle=skin;      ctx.fillRect(x+1,y+38,7,10);
    const armY=attacking?y+22:y+26;
    ctx.fillStyle=armorDark; ctx.fillRect(x+40,armY,8,20);
    ctx.fillStyle=armorMain; ctx.fillRect(x+40,armY,7,18);
    ctx.fillStyle=skin;      ctx.fillRect(x+40,armY+10,7,10);

    // Weapon
    if (!dead) {
      if (skillQ) {
        // Dual Eskrima sticks
        ctx.fillStyle='#8B4513';
        ctx.fillRect(x+44,y+20,5,30);
        ctx.fillRect(x-4,y+22,5,30);
        ctx.fillStyle=goldCol;
        ctx.fillRect(x+44,y+20,5,3); ctx.fillRect(x-4,y+22,5,3);
      } else if (blocking||counter) {
        // Kampilan raised in guard
        ctx.fillStyle='#c8d0d8'; ctx.fillRect(x+38,y+4,8,58);
        ctx.fillStyle='#fff';    ctx.fillRect(x+38,y+4,2,58);
        ctx.fillStyle=goldCol;   ctx.fillRect(x+32,y+36,18,5);
        ctx.fillStyle='#6d3a1a'; ctx.fillRect(x+39,y+41,6,16);
        if (counter) {
          ctx.save(); ctx.globalAlpha=0.35; ctx.fillStyle='#f1c40f';
          ctx.fillRect(x+28,y+4,26,66); ctx.restore();
        }
        ctx.save(); ctx.globalAlpha=0.2; ctx.fillStyle='#27ae60';
        ctx.fillRect(x+28,y+4,26,66); ctx.restore();
      } else if (ult) {
        // Spinning kampilan
        ctx.save();
        ctx.translate(x+this.width/2, y+this.height/2-5);
        ctx.rotate(this._spinAngle);
        ctx.fillStyle='#e8f0f0'; ctx.fillRect(-5,-48,10,56);
        ctx.fillStyle='#fff';    ctx.fillRect(-5,-48,3,56);
        ctx.fillStyle='#b0c0c8'; ctx.fillRect(2,-42,2,44);
        ctx.fillStyle=goldCol;   ctx.fillRect(-12,6,24,6);
        ctx.fillStyle='#6d3a1a'; ctx.fillRect(-4,12,8,18);
        ctx.globalAlpha=0.35; ctx.strokeStyle='#f1c40f'; ctx.lineWidth=8;
        ctx.beginPath(); ctx.arc(0,0,46,0,Math.PI*2); ctx.stroke();
        ctx.restore();
      } else {
        const bX=x+43, bY=attacking?y+10:y+16, bH=attacking?50:42;
        ctx.fillStyle=attacking?'#e0e8f0':'#b8c4d0';
        ctx.fillRect(bX,bY,8,bH);
        ctx.fillStyle=attacking?'#fff':'#d8e4f0'; ctx.fillRect(bX,bY,2,bH);
        ctx.fillStyle='#9ab0c0'; ctx.fillRect(bX+3,bY+4,2,bH-8);
        ctx.fillStyle=goldCol; ctx.fillRect(bX-6,bY+bH-2,20,5);
        ctx.fillStyle='#6d3a1a'; ctx.fillRect(bX+1,bY+bH+3,6,16);
        if (attacking) {
          ctx.save(); ctx.globalAlpha=0.3; ctx.fillStyle='#f1c40f';
          ctx.fillRect(bX-4,bY-4,16,bH+8); ctx.restore();
        }
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
    if (hurt||stunned) {
      ctx.save(); ctx.globalAlpha=0.22; ctx.fillStyle='#ff0000';
      ctx.fillRect(x,y,this.width,this.height); ctx.restore();
    }
    ctx.restore();
  }
}
