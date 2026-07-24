// renderer.js — canvas draw helpers (brown tropical arena + enhanced effects)

const Renderer = {
  drawBackground(ctx, focusX) {
    // ── BattleBG_Renderer delegate (Filipino pixel art arena) ─────────────────
    if (typeof BattleBG_Renderer !== 'undefined' &&
        typeof BattleBG_Renderer.draw === 'function') {
      BattleBG_Renderer.draw(ctx, focusX);
      return;
    }

    const W = CANVAS_WIDTH, H = CANVAS_HEIGHT;
    const groundY = GROUND_Y - GROUND_HEIGHT;
    const t = Date.now() / 1000;

    // ── Parallax offsets (subtle depth effect) ────────────
    if (focusX === undefined) focusX = W / 2;
    const parallaxOffset = focusX - W / 2;
    const castleOffset = Math.max(-8,  Math.min(8,  parallaxOffset * 0.04));
    const fogOffset    = Math.max(-12, Math.min(12, parallaxOffset * 0.08));
    // Invalidate torch cache on every frame so positions track canvas resize
    this._torchPositionsCache = null;

    // ── Night sky gradient ────────────────────────────────
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   '#00000a');
    sky.addColorStop(0.4, '#04051a');
    sky.addColorStop(0.8, '#080820');
    sky.addColorStop(1,   '#0a0a18');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // ── Twinkling stars ───────────────────────────────────
    const starSeeds = [
      [0.08,0.06],[0.15,0.12],[0.22,0.04],[0.31,0.18],[0.38,0.08],
      [0.44,0.22],[0.52,0.05],[0.58,0.15],[0.65,0.03],[0.71,0.20],
      [0.79,0.10],[0.85,0.07],[0.91,0.17],[0.96,0.04],[0.12,0.25],
      [0.27,0.30],[0.48,0.28],[0.63,0.32],[0.77,0.26],[0.93,0.29],
      [0.05,0.35],[0.19,0.38],[0.35,0.40],[0.55,0.36],[0.72,0.42],
      [0.88,0.33],[0.42,0.14],[0.67,0.09],[0.83,0.22],[0.03,0.19],
    ];
    starSeeds.forEach(function([sx, sy], i) {
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i * 0.9));
      const size    = i % 5 === 0 ? 2 : 1;
      ctx.save();
      ctx.globalAlpha = twinkle;
      ctx.fillStyle   = i % 7 === 0 ? '#b8d8ff' : i % 4 === 0 ? '#ffe8aa' : '#ffffff';
      ctx.fillRect(Math.round(sx * W), Math.round(sy * groundY), size, size);
      ctx.restore();
    });

    // ── Moon ──────────────────────────────────────────────
    const moonX = W * 0.82, moonY = groundY * 0.18;
    ctx.save();
    ctx.shadowColor = '#aaccff';
    ctx.shadowBlur  = 28 + 6 * Math.sin(t * 0.5);
    ctx.fillStyle   = '#ddeeff';
    ctx.beginPath(); ctx.arc(moonX, moonY, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8e4ff';
    ctx.beginPath(); ctx.arc(moonX, moonY, 16, 0, Math.PI * 2); ctx.fill();
    // Moon craters (pixel art)
    ctx.fillStyle = 'rgba(0,0,40,0.18)';
    ctx.fillRect(moonX - 8, moonY - 4, 5, 4);
    ctx.fillRect(moonX + 3, moonY + 4, 4, 4);
    ctx.fillRect(moonX - 2, moonY + 6, 3, 3);
    ctx.restore();

    // ── Moonlight glow on horizon ─────────────────────────
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, H * 0.55);
    moonGlow.addColorStop(0,   'rgba(100,160,255,0.08)');
    moonGlow.addColorStop(0.4, 'rgba(60,80,180,0.04)');
    moonGlow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(0, 0, W, H);

    // ── Distant dark castle silhouette ────────────────────
    ctx.save();
    ctx.translate(castleOffset, 0);
    ctx.fillStyle = '#050510';
    // Main tower left
    ctx.fillRect(W*0.06, groundY-120, 24, 120);
    ctx.fillRect(W*0.04, groundY-135, 30, 18);
    ctx.fillRect(W*0.055, groundY-148, 8, 14); // battlement
    ctx.fillRect(W*0.075, groundY-148, 8, 14);
    // Main tower right
    ctx.fillRect(W*0.88, groundY-110, 22, 110);
    ctx.fillRect(W*0.87, groundY-125, 28, 18);
    ctx.fillRect(W*0.875, groundY-138, 7, 13);
    ctx.fillRect(W*0.893, groundY-138, 7, 13);
    // Castle walls connecting
    ctx.fillRect(W*0.06, groundY-60, W*0.82, 60);
    ctx.fillRect(W*0.13, groundY-72, W*0.68, 14);
    // Battlements on wall
    for (let bx = W*0.13; bx < W*0.80; bx += 28) {
      ctx.fillRect(bx, groundY-84, 14, 14);
    }
    // Gate arch
    ctx.fillStyle = '#02020c';
    ctx.fillRect(W*0.47, groundY-52, 36, 52);
    ctx.beginPath();
    ctx.arc(W*0.47 + 18, groundY-52, 18, Math.PI, 0);
    ctx.fill();
    // Windows with faint orange glow
    const winPositions = [[0.2,0.45],[0.3,0.42],[0.55,0.44],[0.68,0.43],[0.75,0.45]];
    winPositions.forEach(function([wx,wy]) {
      const wFlicker = 0.5 + 0.5 * Math.abs(Math.sin(t * 2 + wx * 10));
      ctx.save();
      ctx.globalAlpha = 0.35 * wFlicker;
      ctx.fillStyle   = '#ff9900';
      ctx.fillRect(Math.round(wx * W), Math.round(wy * groundY), 6, 8);
      ctx.restore();
    });

    ctx.restore(); // end castleOffset

    // ── Animated floating magic particles ────────────────
    const numPart = 18;
    for (let i = 0; i < numPart; i++) {
      const seed  = i * 137.5;
      const px    = (Math.sin(seed) * 0.5 + 0.5) * W;
      const baseY = groundY * (0.4 + (i % 5) * 0.1);
      const py    = baseY - ((t * (8 + i % 4) + seed) % (groundY * 0.5));
      const pr    = 0.8 + (i % 3) * 0.6;
      const alpha = Math.max(0, 0.6 - (py / baseY) * 0.5) * (0.5 + 0.5 * Math.sin(t * 3 + seed));
      const col   = i % 4 === 0 ? '#6644ff' : i % 4 === 1 ? '#0088ff' : i % 4 === 2 ? '#ff4488' : '#44ffcc';
      ctx.save();
      ctx.globalAlpha  = alpha * 0.7;
      ctx.shadowColor  = col;
      ctx.shadowBlur   = 6;
      ctx.fillStyle    = col;
      ctx.beginPath();
      ctx.arc(px + Math.sin(t * 0.8 + seed) * 12, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── Vignette ──────────────────────────────────────────
    const vig = ctx.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, H*0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,15,0.7)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  },

  _drawDarkTorch(ctx, tx, ty, t) {
    // Stone bracket
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(tx - 3, ty, 6, 42);
    ctx.fillStyle = '#2a2a44';
    ctx.fillRect(tx - 2, ty, 4, 42);
    ctx.fillStyle = '#555577';
    ctx.fillRect(tx - 6, ty - 5, 12, 7);
    ctx.fillStyle = '#666688';
    ctx.fillRect(tx - 5, ty - 4, 10, 3);

    // Glow pool on ground
    const glowR = 55 + 8 * Math.sin(t * 2.5 + tx);
    ctx.save();
    ctx.globalAlpha = 0.12 + 0.06 * Math.sin(t * 2.5 + tx);
    const glowGrad = ctx.createRadialGradient(tx, ty - 8, 0, tx, ty - 8, glowR);
    glowGrad.addColorStop(0,   '#4488ff');
    glowGrad.addColorStop(0.4, '#2244cc');
    glowGrad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(tx - glowR, ty - glowR, glowR * 2, glowR * 2);
    ctx.restore();

    // Flame — blue/white magic fire
    const fl = Math.sin(t * 7 + tx) * 3;
    const fl2 = Math.sin(t * 5 + tx + 1) * 2;
    ctx.fillStyle = '#0033cc'; ctx.fillRect(tx - 5, ty - 10 + fl,  10, 11);
    ctx.fillStyle = '#0055ff'; ctx.fillRect(tx - 4, ty - 17 + fl2, 8,  9);
    ctx.fillStyle = '#3388ff'; ctx.fillRect(tx - 3, ty - 23 + fl,  6,  8);
    ctx.fillStyle = '#88bbff'; ctx.fillRect(tx - 2, ty - 28 + fl2, 4,  7);
    ctx.fillStyle = '#ccddff'; ctx.fillRect(tx - 1, ty - 32 + fl,  2,  5);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(tx,     ty - 34 + fl2, 1,  3);

    // Ember sparks
    for (let i = 0; i < 3; i++) {
      const ex    = tx + Math.sin(t * 4 + i * 2.1 + tx) * 5;
      const ey    = ty - 28 - ((t * 14 + i * 3.3) % 18);
      const eAlpha= 0.7 - ((t * 14 + i * 3.3) % 18) / 22;
      ctx.save();
      ctx.globalAlpha = Math.max(0, eAlpha);
      ctx.fillStyle   = '#88ccff';
      ctx.fillRect(Math.round(ex), Math.round(ey), 1, 1);
      ctx.restore();
    }
  },

  _applySpriteShader(ctx, fighter) {
    const { x, y, width, height, state, skills, health, maxHealth } = fighter;
    const t = Date.now() / 1000;
    ctx.save();

    // 1) Rim light — idle/walk: white strip on the facing side
    if (state === 'idle' || state === 'walk') {
      const rimW = 3;
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ffffff';
      if (fighter.facingRight)
        ctx.fillRect(x + width - rimW, y, rimW, height);
      else
        ctx.fillRect(x, y, rimW, height);
    }

    // 2) Attack flash — white full-box overlay
    if (state === 'attack_light' || state === 'attack_heavy') {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, width, height);
    }

    // 3) Skill Q pulse — orange oscillating overlay
    if (skills.q.active) {
      ctx.globalAlpha = 0.10 + 0.08 * Math.abs(Math.sin(Math.PI * 2 * 2 * t));
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(x, y, width, height);
    }

    // 4) Ultimate gold ramp — alpha increases from 0 to 0.30 over first 0.3s
    if (state === 'ultimate') {
      const ultMaxDuration = 1.2; // matching the ult timer set in fighter subclasses
      const elapsed = skills.ult.timer !== undefined
        ? Math.max(0, ultMaxDuration - (skills.ult.timer || 0))
        : ultMaxDuration;
      ctx.globalAlpha = Math.min(0.30, (elapsed / 0.3) * 0.30);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(x, y, width, height);
    }

    // 5) Low HP red pulse — only when alive
    if (health <= maxHealth * 0.25 && state !== 'dead') {
      ctx.globalAlpha = 0.10 + 0.08 * Math.abs(Math.sin(Math.PI * 2 * 4 * t));
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(x, y, width, height);
    }

    // 6) Dead desaturation — near-black overlay at 0.70 alpha
    if (state === 'dead') {
      ctx.globalAlpha = 0.70;
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, width, height);
    }

    ctx.restore();
  },

  _renderDropShadow(ctx, fighter) {
    const floorY   = GROUND_Y - GROUND_HEIGHT;
    const shadowCX = fighter.x + fighter.width / 2;
    const maxHalfW = 19.5;
    const minHalfW = 5;
    const maxAlpha = 0.31;
    const minAlpha = 0.12;

    let halfW = maxHalfW;
    let alpha = maxAlpha;

    if (!fighter.onGround) {
      // Apex height: |jumpVelocity|^2 / (2 * gravity) — gravity ~900 px/s²
      const jv    = Math.abs(fighter.jumpVelocity || 600);
      const maxH  = (jv * jv) / (2 * 900);
      const heightAbove = Math.max(0, floorY - (fighter.y + fighter.height));
      const ratio = Math.min(1, heightAbove / maxH);
      halfW = maxHalfW - (maxHalfW - minHalfW) * ratio;
      alpha = maxAlpha - (maxAlpha - minAlpha) * ratio;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = 'rgba(0,0,0,1)';
    ctx.beginPath();
    ctx.ellipse(shadowCX, floorY, halfW, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  _getTorchPositions() {
    if (!this._torchPositionsCache) {
      const groundY = GROUND_Y - GROUND_HEIGHT;
      const W       = CANVAS_WIDTH;
      this._torchPositionsCache = [
        { x: 55,          y: groundY - 55 },
        { x: W - 65,      y: groundY - 55 },
        { x: W * 0.28,    y: groundY - 42 },
        { x: W * 0.72,    y: groundY - 42 },
      ];
    }
    return this._torchPositionsCache;
  },

  _renderTorchLighting(ctx, fighter) {
    const t       = Date.now() / 1000;
    const cx      = fighter.x + fighter.width  / 2;
    const cy      = fighter.y + fighter.height / 2;
    const torches = this._getTorchPositions();

    for (const torch of torches) {
      const dx   = cx - torch.x;
      const dy   = cy - torch.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= 180 || Math.abs(cy - torch.y) >= 120) continue;

      const baseAlpha = Math.max(0, (1 - dist / 180) * 0.18);
      const flicker   = 0.8 + 0.2 * Math.sin(t * 7 + torch.x);
      const alpha     = baseAlpha * flicker;
      if (alpha < 0.005) continue;

      const r = fighter.width * 1.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(180,220,255,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    }
  },

  drawHealthBars(ctx, p1, p2) {
    const barMaxW = Math.round(CANVAS_WIDTH * 0.32);
    const barH = 24;
    const barY = 14;
    const padding = 20;

    const drawBar = (fighter, bx, bw, reversed) => {
      const ratio = Math.max(0, fighter.health / fighter.maxHealth);
      const filled = Math.round(ratio * bw);
      const barColor = ratio > 0.5 ? '#27ae60' : ratio > 0.25 ? '#f39c12' : '#e74c3c';

      // shadow bg
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(bx - 1, barY - 1, bw + 2, barH + 2);
      ctx.fillStyle = '#1a0800';
      ctx.fillRect(bx, barY, bw, barH);

      if (!reversed) {
        ctx.fillStyle = barColor;
        ctx.fillRect(bx, barY, filled, barH);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(bx, barY, filled, barH / 3);
      } else {
        ctx.fillStyle = barColor;
        ctx.fillRect(bx + bw - filled, barY, filled, barH);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(bx + bw - filled, barY, filled, barH / 3);
      }

      // Glow on low HP
      if (ratio <= 0.25) {
        ctx.save();
        ctx.globalAlpha = 0.3 + 0.2 * Math.sin(Date.now() / 200);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(bx, barY, bw, barH);
        ctx.restore();
      }

      // ── Ghost bar — pre-damage health shrinking slowly ──────────────────
      if (fighter.ghostBarHealth !== undefined &&
          fighter.ghostBarHealth > fighter.health &&
          fighter._ghostBarDecayTimer > 0) {

        const ghostRatio    = fighter.ghostBarHealth / fighter.maxHealth;
        const currentRatio  = fighter.health / fighter.maxHealth;
        const ghostFilled   = Math.round(ghostRatio   * bw);
        const currentFilled = Math.round(currentRatio * bw);
        const decayFraction = 1 - (fighter._ghostBarDecayTimer / 0.8);
        const shrunkFilled  = Math.round(
          ghostFilled - (ghostFilled - currentFilled) * decayFraction
        );

        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle   = '#c8a800';
        if (!reversed) {
          ctx.fillRect(bx + currentFilled, barY,
            Math.max(0, shrunkFilled - currentFilled), barH);
        } else {
          const ghostStart = bx + bw - shrunkFilled;
          ctx.fillRect(ghostStart, barY,
            Math.max(0, shrunkFilled - currentFilled), barH);
        }
        ctx.restore();
      }

      // ── Damage flash — white overlay fading out over 0.25s ──────────────
      if (fighter.damageFlashTimer > 0) {
        ctx.save();
        ctx.globalAlpha = fighter.damageFlashTimer / 0.25;
        ctx.fillStyle   = '#ffffff';
        if (!reversed) {
          ctx.fillRect(bx, barY, filled, barH);
        } else {
          ctx.fillRect(bx + bw - filled, barY, filled, barH);
        }
        ctx.restore();
      }

      ctx.strokeStyle = 'rgba(255,180,60,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, barY, bw, barH);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = reversed ? 'left' : 'right';
      ctx.fillText(Math.ceil(fighter.health), reversed ? bx + 4 : bx + bw - 4, barY + barH - 4);

      ctx.textAlign = reversed ? 'right' : 'left';
      ctx.fillStyle = fighter.isBlocking ? '#27ae60' : '#ffe066';
      ctx.font = 'bold 11px monospace';
      ctx.fillText((fighter.isBlocking ? '🛡 ' : '') + fighter.name,
        reversed ? bx + bw : bx, barY - 3);
    };

    drawBar(p1, padding, barMaxW, false);
    drawBar(p2, CANVAS_WIDTH - padding - barMaxW, barMaxW, true);

    ctx.fillStyle = '#ffe066';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VS', CANVAS_WIDTH / 2, barY + barH - 3);
    ctx.textAlign = 'left';
  },

  drawFighter(ctx, fighter) {
    const scale = 1.55; // make fighters ~55% bigger
    const cx = fighter.x + fighter.width / 2;
    const cy = fighter.y + fighter.height;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    fighter.renderSprite(ctx);                 // existing pixel art
    this._applySpriteShader(ctx, fighter);     // state-reactive color overlays
    this._renderTorchLighting(ctx, fighter);   // proximity torch glow
    ctx.restore();
    this.drawStunIndicator(ctx, fighter);
  },

  drawText(ctx, text, x, y, style = {}) {
    ctx.save();
    ctx.font = style.font || 'bold 32px monospace';
    ctx.fillStyle = style.color || '#ffffff';
    ctx.textAlign = style.align || 'center';
    if (style.shadow) { ctx.shadowColor = style.shadow; ctx.shadowBlur = 8; }
    ctx.fillText(text, x, y);
    ctx.restore();
  },

  computeHealthBarWidth(health, maxHealth, maxBarWidth) {
    return Math.min(maxBarWidth, Math.max(0, Math.round((health / maxHealth) * maxBarWidth)));
  },

  drawStunIndicator(ctx, fighter) {
    if (fighter.stunTimer <= 0) return;
    ctx.save();
    ctx.fillStyle = '#ffe066';
    ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 10;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ STUNNED ' + fighter.stunTimer.toFixed(1) + 's',
      fighter.x + fighter.width / 2, fighter.y - 18);
    ctx.restore();
    ctx.textAlign = 'left';
  }
};
