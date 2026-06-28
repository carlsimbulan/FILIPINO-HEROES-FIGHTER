// ai.js — AIController

class AIController {
  constructor(aiFighter, playerFighter, intervalRange = [0.6, 1.3]) {
    this.ai = aiFighter;
    this.player = playerFighter;
    this._intervalRange = intervalRange;
    this._attackTimer = 0;
    this._attackInterval = this._randomAttackInterval();
  }

  _randomAttackInterval() {
    const [min, max] = this._intervalRange;
    return min + Math.random() * (max - min);
  }

  update(dt) {
    const ai     = this.player ? this.ai : null;
    const player = this.player;
    if (!ai) return;
    if (ai.health <= 0 || ai.state === 'dead') return;
    if (ai.stunTimer > 0) return;

    const attacking = ['attack_light','attack_heavy','skill_q','skill_e','skill_c','ultimate'].includes(ai.state);

    const aiCenter     = ai.x + ai.width / 2;
    const playerCenter = player.x + player.width / 2;
    const dist         = Math.abs(aiCenter - playerCenter);
    const attackRange  = Math.max(ai.lightRange, ai.heavyRange);
    const dir          = playerCenter > aiCenter ? 1 : -1;

    // Always walk toward player unless actively mid-attack-animation
    if (!attacking) {
      if (dist > attackRange - 5) {
        // Not close enough — keep walking
        moveHorizontal(ai, dir * ai.moveSpeed * dt);
        ai.facingRight = dir > 0;
        if (ai.state === 'idle') ai.state = 'walk';
      } else {
        // In range — face player and stop moving
        ai.facingRight = dir > 0;
        if (ai.state === 'walk') ai.state = 'idle';
      }

      // Attack timer always ticks when not mid-animation
      this._attackTimer += dt;
      if (this._attackTimer >= this._attackInterval) {
        this._attackTimer = 0;
        this._attackInterval = this._randomAttackInterval();
        // Attack if in range
        if (dist <= attackRange + 15) {
          const type = Math.random() < 0.55 ? 'light' : 'heavy';
          ai.startAttack(type);
        }
      }
    }
  }
}
