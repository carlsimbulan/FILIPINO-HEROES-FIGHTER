// renderer.js — canvas draw helpers (brown tropical arena + enhanced effects)

const Renderer = {
  drawBackground(ctx) {
    const W = CANVAS_WIDTH, H = CANVAS_HEIGHT;
    const groundY = GROUND_Y - GROUND_HEIGHT;

    // ── Sky — warm tropical dusk ──────────────────────────
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0,   '#1a0a00');
    sky.addColorStop(0.3, '#3d1a00');
    sky.addColorStop(0.6, '#7a3010');
    sky.addColorStop(1,   '#b85a18');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, groundY);

    // ── Sun / glow on horizon ─────────────────────────────
    const sunX = W * 0.5, sunY = groundY - 10;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.55);
    sunGlow.addColorStop(0,   'rgba(255,180,60,0.45)');
    sunGlow.addColorStop(0.35,'rgba(255,100,20,0.18)');
    sunGlow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, W, groundY);

    // Sun disc
    ctx.save();
    ctx.shadowColor = '#ffb040';
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#ffcc44';
    ctx.beginPath(); ctx.arc(sunX, sunY, 36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe080';
    ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── Distant mountains — warm brown ───────────────────
    ctx.fillStyle = '#2a0e00';
    ctx.beginPath();
    ctx.moveTo(0, groundY - 60);
    ctx.lineTo(60,  groundY - 160); ctx.lineTo(140, groundY - 80);
    ctx.lineTo(200, groundY - 180); ctx.lineTo(280, groundY - 100);
    ctx.lineTo(360, groundY - 200); ctx.lineTo(440, groundY - 110);
    ctx.lineTo(510, groundY - 190); ctx.lineTo(580, groundY - 120);
    ctx.lineTo(650, groundY - 170); ctx.lineTo(720, groundY - 100);
    ctx.lineTo(W,   groundY - 130); ctx.lineTo(W, groundY); ctx.lineTo(0, groundY);
    ctx.closePath(); ctx.fill();

    // Mid hills — lighter brown
    ctx.fillStyle = '#3d1a00';
    ctx.beginPath();
    ctx.moveTo(0, groundY - 30);
    ctx.lineTo(80,  groundY - 120); ctx.lineTo(160, groundY - 60);
    ctx.lineTo(260, groundY - 140); ctx.lineTo(360, groundY - 70);
    ctx.lineTo(460, groundY - 130); ctx.lineTo(560, groundY - 65);
    ctx.lineTo(660, groundY - 110); ctx.lineTo(760, groundY - 50);
    ctx.lineTo(W,   groundY - 80);  ctx.lineTo(W, groundY); ctx.lineTo(0, groundY);
    ctx.closePath(); ctx.fill();

    // ── Detailed pixel-art trees ──────────────────────────
    this._drawTrees(ctx, W, groundY);

    // ── Ground — rich brown earth ─────────────────────────
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
    groundGrad.addColorStop(0,   '#6b3010');
    groundGrad.addColorStop(0.15,'#4a1f08');
    groundGrad.addColorStop(0.5, '#2e1205');
    groundGrad.addColorStop(1,   '#1a0a02');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, W, GROUND_HEIGHT);

    // Ground edge highlight
    ctx.fillStyle = '#8b4818';
    ctx.fillRect(0, groundY, W, 4);
    ctx.fillStyle = '#c06020';
    ctx.fillRect(0, groundY, W, 1);

    // Ground tile cracks
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let i = 0; i < W; i += 60) {
      ctx.fillRect(i, groundY + 4, 2, GROUND_HEIGHT - 4);
    }
    for (let i = 0; i < W; i += 60) {
      ctx.fillRect(i + 30, groundY + 20, 1, GROUND_HEIGHT - 20);
    }
    // Dirt texture dots
    ctx.fillStyle = 'rgba(200,100,40,0.12)';
    for (let i = 10; i < W; i += 18) {
      ctx.fillRect(i, groundY + 8, 3, 3);
      ctx.fillRect(i + 9, groundY + 16, 2, 2);
    }

    // ── Torches ───────────────────────────────────────────
    this._drawTorch(ctx, 55, groundY - 55);
    this._drawTorch(ctx, W - 65, groundY - 55);
    // Extra torches mid-sides
    this._drawTorch(ctx, Math.round(W * 0.28), groundY - 40);
    this._drawTorch(ctx, Math.round(W * 0.72), groundY - 40);

    // Arena name
    ctx.fillStyle = 'rgba(255,180,60,0.18)';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚔  MACTAN ARENA  ⚔', W / 2, groundY - 10);
    ctx.textAlign = 'left';

    // Vignette edges
    const vig = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  },

  _drawTrees(ctx, W, groundY) {
    // Palm / tropical trees with layered pixel art
    const treePositions = [];
    for (let x = 0; x < W; x += 55 + Math.round(Math.sin(x * 0.05) * 15)) {
      treePositions.push(x + 10);
    }
    treePositions.forEach(tx => {
      const h = 70 + Math.round(Math.sin(tx * 0.07) * 25);
      const w = 8 + Math.round(Math.sin(tx * 0.11) * 3);

      // Trunk
      ctx.fillStyle = '#2a1008';
      ctx.fillRect(tx, groundY - h, w, h);
      ctx.fillStyle = '#3d1a0a';
      ctx.fillRect(tx + 1, groundY - h, w - 2, h);

      // Foliage layers — dark green tropical
      const fColors = ['#0d2a0a', '#143d10', '#1a5014', '#0d3a0a'];
      const layers = [
        { y: groundY - h - 18, w: 34, h: 22 },
        { y: groundY - h - 10, w: 44, h: 20 },
        { y: groundY - h - 2,  w: 38, h: 16 },
      ];
      layers.forEach((l, i) => {
        ctx.fillStyle = fColors[i % fColors.length];
        ctx.fillRect(tx - (l.w - w) / 2, l.y, l.w, l.h);
        // lighter inner highlight
        ctx.fillStyle = fColors[(i + 1) % fColors.length];
        ctx.fillRect(tx - (l.w - w) / 2 + 4, l.y + 4, l.w - 8, l.h - 8);
      });

      // Palm fronds (small detail lines)
      ctx.fillStyle = '#1a6010';
      ctx.fillRect(tx - 20, groundY - h - 14, 16, 3);
      ctx.fillRect(tx + w + 4, groundY - h - 16, 14, 3);
      ctx.fillRect(tx - 12, groundY - h - 22, 10, 3);
      ctx.fillRect(tx + w, groundY - h - 24, 10, 3);
    });
  },

  _drawTorch(ctx, tx, ty) {
    // Pole
    ctx.fillStyle = '#4a2e0a';
    ctx.fillRect(tx - 3, ty, 6, 55);
    ctx.fillStyle = '#6d4c1a';
    ctx.fillRect(tx - 2, ty, 4, 55);

    // Bracket
    ctx.fillStyle = '#888';
    ctx.fillRect(tx - 6, ty - 5, 12, 7);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(tx - 5, ty - 4, 10, 3);

    // Fire glow - bigger/brighter
    const fl = Math.sin(Date.now() / 100) * 4;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#ff6600';
    ctx.beginPath(); ctx.arc(tx, ty - 10, 32, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffff00';
    ctx.beginPath(); ctx.arc(tx, ty - 10, 55, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Flame pixels
    ctx.fillStyle = '#ff2200'; ctx.fillRect(tx - 5, ty - 10 + fl, 10, 12);
    ctx.fillStyle = '#ff6600'; ctx.fillRect(tx - 4, ty - 16 + fl, 8, 10);
    ctx.fillStyle = '#ff9900'; ctx.fillRect(tx - 3, ty - 22 + fl, 6, 10);
    ctx.fillStyle = '#ffcc00'; ctx.fillRect(tx - 2, ty - 27 + fl, 4, 8);
    ctx.fillStyle = '#fff8a0'; ctx.fillRect(tx - 1, ty - 31 + fl, 2, 5);
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
    fighter.renderSprite(ctx);
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
