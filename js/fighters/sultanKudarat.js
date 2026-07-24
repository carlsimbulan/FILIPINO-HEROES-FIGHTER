// sultanKudarat.js — Sultan Kudarat (The Unconquered Sovereign)
// Q: Spirit Armor    — shrugs off next 2 hits (damage reduction 80%), 3s, 12s CD
// E: Kris Slam       — heavy downward slam, wide AoE, 8s CD
// C: Sovereign Stand — immovable block + knockback on hit, 2s CD
// R: Ultimate — Maguindanao Conquest — massive kris lunge + stomp (once)

class SultanKudarat extends Fighter {
  constructor(x) {
    super(x);
    this.name = 'Sultan Kudarat';
    this.lightDamage = 11;
    this.heavyDamage = 24;
    this.lightRange = 90;
    this.heavyRange = 115;
    this.lightDuration = 20;
    this.heavyDuration = 35;
    this.moveSpeed = 180; // slow but powerful
    this.width = 58;
    this.height = 90;
    this.jumpVelocity = -500; // heavy, doesn't jump as high

    this.skills.q.cdMax = 12;
    this.skills.e.cdMax = 8;
    this.skills.c.cdMax = 2;

    this._armorHitsLeft = 0; // spirit armor absorb count
    this._animFrame = 0;
    this._animTimer = 0;
    this.themeColor = '#e65100'; // amber-orange — Maguindanao royalty
  }

  get ultDamage() { return 50; }

  applyDamage(amount) {
    if (this.state === 'dead') return;
    if (this.isBlocking) return;
    if (this._armorHitsLeft > 0) {
      // Spirit armor absorbs 80% of damage
      const reduced = Math.round(amount * 0.2);
      this._armorHitsLeft--;
      super.applyDamage(reduced);
      FX.blockEffect(this.x+this.width/2, this.y+this.height/2);
      return;
    }
    super.applyDamage(amount);
  }

  // Q — Spirit Armor
  useSkillQ() {
    if (this.skills.q.cd > 0 || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.q.cd = this.skills.q.cdMax;
    this.skills.q.active = true;
    this.skills.q.timer = 3.0;
    this._armorHitsLeft = 2;
    this.state = 'skill_q';
    this.attackFrameTimer = 18;
    FX.warCryAura(this.x, this.y, this.width, this.height);
    return true;
  }

  // E — Kris Slam
  useSkillE() {
    if (this.skills.e.cd > 0 || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.e.cd = this.skills.e.cdMax;
    this.state = 'skill_e';
    this.attackActive = true;
    this.attackType = 'e_spin'; // reuse wide range type
    this.attackFrameTimer = 36;
    this.lastAttackDamageDealt = false;
    FX.spinEffect(this.x, this.y, this.width, this.height);
    return true;
  }

  // C — Sovereign Stand
  useSkillC() {
    if (this.skills.c.cd > 0 || this.state === 'dead') return false;
    this.skills.c.cd = this.skills.c.cdMax;
    this.skills.c.active = true;
    this.skills.c.timer = 2.0;
    this.isBlocking = true;
    this.state = 'skill_c';
    FX.blockEffect(this.x+this.width/2, this.y+this.height/2);
    return true;
  }

  // R — Maguindanao Conquest
  useUltimate() {
    if (this.skills.ult.used || this.state === 'dead' || this.stunTimer > 0) return false;
    this.skills.ult.used = true;
    this.skills.ult.active = true;
    this.skills.ult.timer = 1.8;
    this.state = 'ultimate';
    this.attackActive = true;
    this.attackType = 'ult';
    this.attackFrameTimer = 108;
    this.lastAttackDamageDealt = false;
    FX.ultGloveShockwave(this.x+this.width/2, this.y+this.height/2);
    return true;
  }

  _currentAttackRange() {
    if (this.attackType === 'e_spin') return this.heavyRange + 30;
    if (this.attackType === 'ult')    return this.heavyRange + 55;
    return super._currentAttackRange();
  }

  _onSkillEnd(key) {
    if (key === 'c') { this.isBlocking = false; if(this.state==='skill_c') this.state='idle'; }
    if (key === 'q') { this._armorHitsLeft = 0; }
    if (key === 'e') { if(this.state==='skill_e') this.state='idle'; }
  }

  update(dt) {
    if (this.state==='walk') {
      this._animTimer+=dt;
      if(this._animTimer>0.15){ this._animTimer=0; this._animFrame=(this._animFrame+1)%4; }
    } else { this._animFrame=0; this._animTimer=0; }
    if (this.skills.q.active) FX.warCryAura(this.x, this.y, this.width, this.height);
    super.update(dt);
  }

  renderSprite(ctx) {
    const x=Math.round(this.x), y=Math.round(this.y);
    ctx.save();
    if (!this.facingRight) { ctx.translate(x+this.width,y); ctx.scale(-1,1); ctx.translate(-x,-y); }

    const s=this.state;
    const attacking=s==='attack_light'||s==='attack_heavy';
    const skillQ=s==='skill_q'||this.skills.q.active;
    const skillE=s==='skill_e';
    const blocking=s==='skill_c';
    const ult=s==='ultimate';
    const hurt=s==='hurt', dead=s==='dead', stunned=this.stunTimer>0;
    const af=this._animFrame;
    const armored=this._armorHitsLeft>0;

    const skin     = dead?'#777':'#b87040';
    const skinDark = dead?'#555':'#9a5830';
    const robeMain = dead?'#444':skillQ?'#1a3a6a':ult?'#4a2000':'#1a1a3a';
    const robeDark = dead?'#333':skillQ?'#0e2448':'#0e0e24';
    const goldCol  = '#c0a030';
    const armorCol = armored?'rgba(100,180,255,0.4)':'transparent';

    // Spirit armor glow
    if (armored) {
      ctx.save(); ctx.globalAlpha=0.25;
      ctx.fillStyle='#4488ff';
      ctx.fillRect(x-8,y-8,this.width+16,this.height+16); ctx.restore();
    }
    if (ult) {
      ctx.save(); ctx.globalAlpha=0.3; ctx.fillStyle='#8B4500';
      ctx.fillRect(x-10,y-10,this.width+20,this.height+20); ctx.restore();
    }

    // Feet / shoes
    ctx.fillStyle='#1a0c04';
    ctx.fillRect(x+6,  y+82+(af%2===0?2:0), 20, 8);
    ctx.fillRect(x+32, y+82+(af%2===1?2:0), 20, 8);

    // Legs/robe bottom
    const lg=s==='walk'?Math.sin(af*Math.PI/2)*4:0;
    ctx.fillStyle=robeMain;
    ctx.fillRect(x+7,  y+58+lg, 18,26); ctx.fillRect(x+7,  y+58+lg, 5,26);
    ctx.fillRect(x+33, y+58-lg, 18,26); ctx.fillRect(x+33, y+58-lg, 5,26);
    ctx.fillStyle=goldCol;
    ctx.fillRect(x+7,y+64+lg,18,2); ctx.fillRect(x+33,y+64-lg,18,2);
    ctx.fillRect(x+7,y+74+lg,18,2); ctx.fillRect(x+33,y+74-lg,18,2);

    // Main robe/torso
    ctx.fillStyle=robeMain;
    ctx.fillRect(x+5,y+28,48,32);
    ctx.fillStyle=robeDark; ctx.fillRect(x+5,y+28,10,32);
    // robe patterns
    ctx.fillStyle=goldCol;
    ctx.fillRect(x+14,y+30,30,4); ctx.fillRect(x+14,y+40,30,4);
    ctx.fillRect(x+14,y+50,30,3);
    // sash belt
    ctx.fillStyle='#8B4500'; ctx.fillRect(x+5,y+56,48,6);
    ctx.fillStyle=goldCol; ctx.fillRect(x+5,y+56,48,2); ctx.fillRect(x+5,y+60,48,2);
    // big buckle
    ctx.fillStyle=goldCol; ctx.fillRect(x+24,y+56,10,6);
    ctx.fillStyle='#ffe066'; ctx.fillRect(x+26,y+57,6,4);
    // shoulder pads (bigger/imposing)
    ctx.fillStyle='#2a2a5a';
    ctx.fillRect(x+2,y+28,14,10); ctx.fillRect(x+42,y+28,14,10);
    ctx.fillStyle=goldCol;
    ctx.fillRect(x+3,y+29,12,3); ctx.fillRect(x+43,y+29,12,3);

    // Neck
    ctx.fillStyle=skin; ctx.fillRect(x+22,y+20,14,10);

    // Head (bigger, imposing)
    ctx.fillStyle=skin; ctx.fillRect(x+14,y+2,30,24);
    ctx.fillStyle=skinDark; ctx.fillRect(x+14,y+2,7,24);
    ctx.fillStyle=skinDark; ctx.fillRect(x+14,y+9,4,10);

    // Sultanate turban
    const turbanCol = skillQ?'#1a3a8a':ult?'#6B3500':'#1a1a6a';
    ctx.fillStyle=turbanCol; ctx.fillRect(x+12,y+2,34,12);
    ctx.fillRect(x+10,y+6,38,8);
    // turban wrap lines
    ctx.fillStyle=goldCol;
    ctx.fillRect(x+12,y+3,34,2); ctx.fillRect(x+12,y+8,34,2);
    // turban jewel
    ctx.fillStyle='#e74c3c'; ctx.fillRect(x+25,y+4,8,6);
    ctx.fillStyle='#fff';    ctx.fillRect(x+27,y+5,4,4);

    // Beard
    ctx.fillStyle='#1a0a00';
    ctx.fillRect(x+15,y+20,28,6);
    ctx.fillRect(x+18,y+24,22,4);
    ctx.fillRect(x+22,y+27,14,4);

    ctx.fillStyle='#2c1a0a'; ctx.fillRect(x+18,y+13,8,2); ctx.fillRect(x+30,y+13,8,2);

    if (stunned||dead) {
      ctx.fillStyle=dead?'#555':'#e74c3c';
      ctx.fillRect(x+19,y+16,7,2); ctx.fillRect(x+20,y+15,5,4);
      ctx.fillRect(x+30,y+16,7,2); ctx.fillRect(x+31,y+15,5,4);
    } else {
      ctx.fillStyle='#fff'; ctx.fillRect(x+19,y+15,7,5); ctx.fillRect(x+30,y+15,7,5);
      ctx.fillStyle='#111'; ctx.fillRect(x+22,y+16,4,4); ctx.fillRect(x+33,y+16,4,4);
    }
    ctx.fillStyle=skinDark; ctx.fillRect(x+25,y+20,4,4);

    // Arms (thick/powerful)
    ctx.fillStyle=robeDark; ctx.fillRect(x+0,y+30,10,24);
    ctx.fillStyle=robeMain; ctx.fillRect(x+1,y+30,9,22);
    ctx.fillStyle=skin;     ctx.fillRect(x+1,y+44,9,12);
    const armY=attacking?y+26:y+30;
    ctx.fillStyle=robeDark; ctx.fillRect(x+48,armY,10,24);
    ctx.fillStyle=robeMain; ctx.fillRect(x+48,armY,9,22);
    ctx.fillStyle=skin;     ctx.fillRect(x+48,armY+12,9,12);

    // Kris sword (wavy-bladed)
    if (!dead) {
      if (blocking) {
        // raised in sovereign stand
        ctx.fillStyle='#c8d0d8'; ctx.fillRect(x+44,y+4,9,68);
        ctx.fillStyle='#fff';    ctx.fillRect(x+44,y+4,3,68);
        // wavy edge detail
        for(let i=0;i<6;i++) {
          ctx.fillStyle=i%2===0?'#a0b0c0':'#c8d0d8';
          ctx.fillRect(x+44+(i%2)*4,y+8+i*10,4,10);
        }
        ctx.fillStyle=goldCol; ctx.fillRect(x+38,y+44,20,6);
        ctx.fillStyle='#6d3a1a'; ctx.fillRect(x+45,y+50,7,20);
        ctx.save(); ctx.globalAlpha=0.3; ctx.fillStyle='#27ae60';
        ctx.fillRect(x+32,y+4,30,76); ctx.restore();
      } else if (ult) {
        // massive kris lunge
        ctx.save(); ctx.translate(x+52,y+8); ctx.rotate(0.2);
        ctx.fillStyle='#e8f0f0'; ctx.fillRect(-6,-24,12,80);
        ctx.fillStyle='#fff';    ctx.fillRect(-6,-24,3,80);
        // wavy kris detail
        for(let i=0;i<8;i++) {
          ctx.fillStyle=i%2===0?'#a0b4c0':'#c8d8e0';
          ctx.fillRect(-6+(i%2)*5,y+i*10-24+4,5,12);
        }
        ctx.fillStyle=goldCol; ctx.fillRect(-14,34,28,7);
        ctx.fillStyle='#6d3a1a'; ctx.fillRect(-5,41,10,22);
        ctx.globalAlpha=0.5; ctx.fillStyle='#ff8800';
        ctx.fillRect(-10,-28,8,90); ctx.restore();
        // stomp dust
        FX.spinEffect(x,y+this.height-10,this.width,10);
      } else {
        const bX=x+52, bY=attacking?y+8:y+14, bH=attacking?54:46;
        ctx.fillStyle=attacking?'#d8e8f0':'#b0c4d0';
        ctx.fillRect(bX,bY,9,bH);
        ctx.fillStyle=attacking?'#fff':'#c8dcec'; ctx.fillRect(bX,bY,3,bH);
        // wavy kris edge
        for(let i=0;i<Math.floor(bH/8);i++) {
          ctx.fillStyle=i%2===0?'#90a8b8':'#b0c4d0';
          ctx.fillRect(bX+(i%2)*5,bY+i*8,5,8);
        }
        ctx.fillStyle=goldCol; ctx.fillRect(bX-6,bY+bH-2,20,6);
        ctx.fillStyle='#6d3a1a'; ctx.fillRect(bX+1,bY+bH+4,7,18);
        ctx.fillStyle=goldCol; ctx.fillRect(bX,bY+bH+20,9,6);
        if (attacking) {
          ctx.save(); ctx.globalAlpha=0.35; ctx.fillStyle='#ff8800';
          ctx.fillRect(bX-6,bY-4,20,bH+8); ctx.restore();
        }
      }
    }

    if (stunned) {
      const t=Date.now()/400;
      for(let i=0;i<3;i++){
        const a=t+(i*Math.PI*2)/3;
        const sx=x+this.width/2+Math.cos(a)*22, sy=y-14+Math.sin(a)*9;
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
