// visualEnhancer.js — VisualEnhancer singleton owning ScreenShaker, AfterimageSystem, and drawBloomOverlay

/**
 * Parse a 6-digit hex color string and return an rgba(...) CSS string.
 * @param {string} hex   e.g. '#e67e22' or 'e67e22'
 * @param {number} alpha 0–1
 * @returns {string}     e.g. 'rgba(230,126,34,0.25)'
 */
function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// VisualEnhancer — plain-object singleton (same pattern as Renderer / FX)
// ─────────────────────────────────────────────────────────────────────────────
const VisualEnhancer = {

  // ── ScreenShaker subsystem ─────────────────────────────────────────────────
  ScreenShaker: {
    /** @type {Array<{ magnitude: number, remaining: number, duration: number }>} */
    _shakes: [],

    /** Current canvas translate offset, applied by begin(). */
    _offsetX: 0,
    _offsetY: 0,

    /** Whether ctx.save/translate was applied this frame. */
    _active: false,

    /**
     * Queue a new screen shake.
     * Multiple simultaneous shakes resolve to the max weighted magnitude.
     * @param {number} magnitude  Peak pixel displacement.
     * @param {number} duration   Shake lifetime in seconds.
     */
    queue(magnitude, duration) {
      this._shakes.push({ magnitude, remaining: duration, duration });
    },

    /**
     * Advance shake timers by dt, prune expired entries, and compute
     * _offsetX / _offsetY for this frame.
     * @param {number} dt  Delta time in seconds.
     */
    update(dt) {
      // Decrement remaining time for every active shake
      for (const shake of this._shakes) {
        shake.remaining -= dt;
      }

      // Remove shakes that have expired
      this._shakes = this._shakes.filter(s => s.remaining > 0);

      // Compute current magnitude: max of (magnitude * remaining/duration)
      let maxMag = 0;
      for (const shake of this._shakes) {
        const weighted = shake.magnitude * (shake.remaining / shake.duration);
        if (weighted > maxMag) maxMag = weighted;
      }

      // Apply a fresh random direction each frame
      const angle = Math.random() * Math.PI * 2;
      this._offsetX = Math.cos(angle) * maxMag;
      this._offsetY = Math.sin(angle) * maxMag;
    },

    /**
     * Call before world-layer draw calls.
     * Applies ctx.save + ctx.translate when magnitude >= 0.5 px.
     * @param {CanvasRenderingContext2D} ctx
     */
    begin(ctx) {
      const mag = Math.sqrt(this._offsetX * this._offsetX + this._offsetY * this._offsetY);
      if (mag >= 0.5) {
        ctx.save();
        ctx.translate(this._offsetX, this._offsetY);
        this._active = true;
      } else {
        this._active = false;
      }
    },

    /**
     * Call after world-layer draw calls.
     * Restores ctx state only if begin() applied a translate.
     * @param {CanvasRenderingContext2D} ctx
     */
    end(ctx) {
      if (this._active) {
        ctx.restore();
        this._active = false;
      }
    },
  },

  // ── AfterimageSystem subsystem ─────────────────────────────────────────────
  AfterimageSystem: {
    /** @type {Map<object, Array<{x: number, y: number, fighter: object, alpha: number, framesLeft: number}>>} */
    _buffers: new Map(),

    /** Sum of all snapshots across all fighters. Hard cap: 10. */
    _totalCount: 0,

    /**
     * Remove the single oldest snapshot (earliest framesLeft) across all buffers.
     * Called internally to enforce the 10-snapshot hard cap.
     * @private
     */
    _evictOldest() {
      let oldestFighter = null;
      let lowestFrames = Infinity;

      for (const [fighter, snapshots] of this._buffers) {
        if (snapshots.length > 0 && snapshots[0].framesLeft < lowestFrames) {
          lowestFrames = snapshots[0].framesLeft;
          oldestFighter = fighter;
        }
      }

      if (oldestFighter !== null) {
        this._buffers.get(oldestFighter).shift();
        this._totalCount--;
      }
    },

    /**
     * Record one afterimage snapshot during skill_e.
     * @param {object} fighter        Fighter instance.
     * @param {number} snapshotIndex  0–3; controls alpha falloff.
     */
    recordSkillE(fighter, snapshotIndex) {
      if (this._totalCount >= 10) this._evictOldest();

      const alpha = 0.30 * (1 - snapshotIndex / 4);

      if (!this._buffers.has(fighter)) this._buffers.set(fighter, []);
      this._buffers.get(fighter).push({
        x: fighter.x,
        y: fighter.y,
        fighter,
        alpha,
        framesLeft: 6,
      });
      this._totalCount++;
    },

    /**
     * Record 4 flicker snapshots spread across the teleport path.
     * @param {object} fighter   Fighter instance.
     * @param {number} originX   Start X of the teleport.
     * @param {number} destX     End X of the teleport.
     */
    recordFlicker(fighter, originX, destX) {
      const alphas = [0.35, 0.25, 0.15, 0.05];

      if (!this._buffers.has(fighter)) this._buffers.set(fighter, []);

      for (let i = 0; i < 4; i++) {
        if (this._totalCount >= 10) this._evictOldest();

        const snapX = originX + (destX - originX) * (i / 3);
        this._buffers.get(fighter).push({
          x: snapX,
          y: fighter.y,
          fighter,
          alpha: alphas[i],
          framesLeft: 8,
        });
        this._totalCount++;
      }
    },

    /**
     * Record 2 side snapshots for the ultimate state (call each frame).
     * @param {object} fighter  Fighter instance.
     */
    recordUltimate(fighter) {
      if (!this._buffers.has(fighter)) this._buffers.set(fighter, []);

      const offsets = [-12, 12];
      for (const offset of offsets) {
        if (this._totalCount >= 10) this._evictOldest();

        this._buffers.get(fighter).push({
          x: fighter.x + offset,
          y: fighter.y,
          fighter,
          alpha: 0.20,
          framesLeft: 3,
        });
        this._totalCount++;
      }
    },

    /**
     * Age all snapshots by 1 frame; prune expired ones and adjust _totalCount.
     */
    update() {
      for (const [fighter, snapshots] of this._buffers) {
        const oldLen = snapshots.length;
        for (const s of snapshots) s.framesLeft--;
        const alive = snapshots.filter(s => s.framesLeft > 0);
        this._buffers.set(fighter, alive);
        this._totalCount -= (oldLen - alive.length);
      }
    },

    /**
     * Render all afterimage snapshots for a given fighter.
     * Call before drawing the fighter sprite so afterimages appear behind it.
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} fighter  Fighter instance (must have renderSprite(ctx)).
     */
    renderSnapshots(ctx, fighter) {
      const snapshots = this._buffers.get(fighter);
      if (!snapshots || snapshots.length === 0) return;

      for (const snapshot of snapshots) {
        ctx.save();
        ctx.globalAlpha = snapshot.alpha;
        ctx.translate(snapshot.x - fighter.x, snapshot.y - fighter.y);
        fighter.renderSprite(ctx);
        ctx.restore();
      }
    },
  },

  // ── drawBloomOverlay ───────────────────────────────────────────────────────
  /**
   * Draw radial bloom glow effects over the given sources.
   * Uses 'screen' composite mode so glows brighten underlying pixels.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array<{ x: number, y: number, radius: number, color: string }>} sources
   */
  drawBloomOverlay(ctx, sources) {
    const cap = Math.min(sources.length, 6);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < cap; i++) {
      const { x, y, radius, color } = sources[i];
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, hexToRgba(color, 0.25));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  },

};
