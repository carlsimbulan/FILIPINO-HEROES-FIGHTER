// frameRenderer.js — draws animated avatar frames on canvas

const FrameRenderer = {
  // Draw animated frame around a canvas avatar at (x,y,size)
  drawFrame(ctx, frameId, x, y, size) {
    const t = Date.now() / 1000;
    if (!frameId || frameId === 'none') {
      // Default thin gold border
      ctx.strokeStyle = 'rgba(248,183,0,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, size, size);
      return;
    }
    if (frameId === 'gold') {
      this._drawGoldFrame(ctx, x, y, size, t);
    } else if (frameId === 'fire') {
      this._drawFireFrame(ctx, x, y, size, t, false);
    } else if (frameId === 'darkfire') {
      this._drawFireFrame(ctx, x, y, size, t, true);
    }
  },

  _drawGoldFrame(ctx, x, y, size, t) {
    const pulse = 0.7 + 0.3 * Math.sin(t * 2);
    // Outer glow
    ctx.save();
    ctx.shadowColor = '#F8B700';
    ctx.shadowBlur = 12 * pulse;
    ctx.strokeStyle = '#F8B700';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);
    // Corner diamonds
    ctx.fillStyle = '#F8B700';
    const corners = [[x-3,y-3],[x+size-1,y-3],[x-3,y+size-1],[x+size-1,y+size-1]];
    corners.forEach(([cx,cy]) => {
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(Math.PI/4);
      ctx.fillRect(-4,-4,8,8); ctx.restore();
    });
    ctx.restore();
    // Inner border
    ctx.strokeStyle = 'rgba(255,220,100,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  },

  _drawFireFrame(ctx, x, y, size, t, dark) {
    if (dark) {
      this._drawDarkFireFrame(ctx, x, y, size, t);
      return;
    }
    const baseColor  = '#ff2200';
    const midColor   = '#ff6600';
    const tipColor   = '#ffcc00';

    ctx.save();
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 18 + 6 * Math.sin(t * 3);

    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);

    const numFlames = Math.floor(size / 8);
    for (let i = 0; i < numFlames; i++) {
      const fx = x + (i / numFlames) * size;
      const offset = Math.sin(t * 4 + i * 0.8) * 4;
      const h = 6 + Math.abs(Math.sin(t * 3 + i * 1.2)) * 8;
      const grad = ctx.createLinearGradient(fx, y - 2, fx, y - 2 - h);
      grad.addColorStop(0, midColor);
      grad.addColorStop(0.5, baseColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(fx, y - 2 - h + offset, 5, h);
    }

    for (let i = 0; i < numFlames; i++) {
      const fx = x + (i / numFlames) * size;
      const offset = Math.sin(t * 4 + i * 0.9 + 1) * 3;
      const h = 4 + Math.abs(Math.sin(t * 3 + i * 1.3)) * 6;
      const grad = ctx.createLinearGradient(fx, y + size + 2, fx, y + size + 2 + h);
      grad.addColorStop(0, midColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(fx, y + size + 2 + offset, 5, h);
    }

    const numSide = Math.floor(size / 10);
    for (let i = 0; i < numSide; i++) {
      const fy = y + (i / numSide) * size;
      const offset = Math.sin(t * 3.5 + i * 1.1) * 3;
      const w = 4 + Math.abs(Math.sin(t * 2.5 + i)) * 6;
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x - 2 - w + offset, fy, w, 5);
      ctx.fillRect(x + size + 2 + offset, fy, w, 5);
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.15 + 0.08 * Math.sin(t * 4);
    const innerGrad = ctx.createLinearGradient(x, y, x + size, y + size);
    innerGrad.addColorStop(0, baseColor);
    innerGrad.addColorStop(1, tipColor);
    ctx.fillStyle = innerGrad;
    ctx.fillRect(x, y, size, size);
    ctx.restore();
  },

  _drawDarkFireFrame(ctx, x, y, size, t) {
    // Palette: near-black base, void purple mid, dark grey-white embers
    const coreColor  = '#0a0a0a';
    const midColor   = '#1a0030';
    const emberColor = '#9900ff';
    const edgeColor  = '#2a0040';

    ctx.save();

    // ── Outer void glow ──────────────────────────────────────
    ctx.shadowColor = '#3d0060';
    ctx.shadowBlur  = 32 + 12 * Math.abs(Math.sin(t * 2.5));
    ctx.strokeStyle = '#0d0020';
    ctx.lineWidth   = 5;
    ctx.strokeRect(x - 3, y - 3, size + 6, size + 6);

    // Pulsing inner border
    const pulse = 0.5 + 0.5 * Math.abs(Math.sin(t * 3));
    ctx.shadowBlur  = 14 * pulse;
    ctx.shadowColor = '#6600cc';
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    ctx.restore();

    // ── Top flames — dark black with faint purple tips ───────
    const numTop = Math.floor(size / 5);
    for (let i = 0; i < numTop; i++) {
      const fx    = x + (i / numTop) * size + 1;
      const wave  = Math.sin(t * 5 + i * 1.1) * 5;
      const wave2 = Math.sin(t * 3.2 + i * 0.7) * 3;
      const h     = 12 + Math.abs(Math.sin(t * 4 + i * 1.5)) * 18;
      const grad  = ctx.createLinearGradient(fx, y - 2, fx, y - 2 - h);
      grad.addColorStop(0,    '#1a0030');
      grad.addColorStop(0.3,  '#0d0020');
      grad.addColorStop(0.65, '#050005');
      grad.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.save();
      ctx.globalAlpha = 0.9 + 0.1 * Math.sin(t * 6 + i);
      ctx.fillStyle = grad;
      ctx.fillRect(fx + wave, y - 2 - h + wave2, 4, h);
      ctx.restore();
    }

    // ── Bottom flames ────────────────────────────────────────
    for (let i = 0; i < numTop; i++) {
      const fx   = x + (i / numTop) * size + 1;
      const wave = Math.sin(t * 4.5 + i * 1.3 + 2) * 4;
      const h    = 8 + Math.abs(Math.sin(t * 3.5 + i * 1.2)) * 14;
      const grad = ctx.createLinearGradient(fx, y + size + 2, fx, y + size + 2 + h);
      grad.addColorStop(0,   '#1a0030');
      grad.addColorStop(0.5, '#050005');
      grad.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = grad;
      ctx.fillRect(fx + wave, y + size + 2, 4, h);
      ctx.restore();
    }

    // ── Side flames ──────────────────────────────────────────
    const numSide = Math.floor(size / 7);
    for (let i = 0; i < numSide; i++) {
      const fy   = y + (i / numSide) * size + 1;
      const wave = Math.sin(t * 4 + i * 1.2) * 3;
      const w    = 7 + Math.abs(Math.sin(t * 3 + i * 0.9)) * 13;
      const gradL = ctx.createLinearGradient(x - 2, fy, x - 2 - w, fy);
      gradL.addColorStop(0,   '#1a0030');
      gradL.addColorStop(0.5, '#050005');
      gradL.addColorStop(1,   'rgba(0,0,0,0)');
      const gradR = ctx.createLinearGradient(x + size + 2, fy, x + size + 2 + w, fy);
      gradR.addColorStop(0,   '#1a0030');
      gradR.addColorStop(0.5, '#050005');
      gradR.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.save();
      ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * 5 + i);
      ctx.fillStyle = gradL;
      ctx.fillRect(x - 2 - w + wave, fy, w, 4);
      ctx.fillStyle = gradR;
      ctx.fillRect(x + size + 2 - wave, fy, w, 4);
      ctx.restore();
    }

    // ── Void ember particles (dark purple, barely visible) ───
    const numEmbers = 14;
    for (let i = 0; i < numEmbers; i++) {
      const seed  = i * 137.5;
      const ex    = x + (Math.sin(seed) * 0.5 + 0.5) * size;
      const ey    = y + size - ((t * 15 + seed) % (size + 24));
      const er    = 0.8 + Math.abs(Math.sin(t * 3 + seed)) * 1.8;
      const alpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 4 + seed));
      ctx.save();
      ctx.globalAlpha  = alpha;
      ctx.shadowColor  = emberColor;
      ctx.shadowBlur   = 8;
      ctx.fillStyle    = i % 4 === 0 ? '#440066' : '#1a0030';
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── Black smoke wisps ────────────────────────────────────
    const numSmoke = 6;
    for (let i = 0; i < numSmoke; i++) {
      const seed  = i * 73;
      const sx    = x + (Math.sin(seed + t * 0.6) * 0.4 + 0.5) * size;
      const sy    = y - 10 - ((t * 7 + seed) % 28);
      const sr    = 7 + Math.sin(t + seed) * 4;
      const alpha = Math.max(0, 0.5 - ((t * 7 + seed) % 28) / 40);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = '#050005';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── Deep black inner vignette overlay ────────────────────
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 2);
    const innerGrad = ctx.createRadialGradient(
      x + size * 0.5, y + size * 0.5, size * 0.05,
      x + size * 0.5, y + size * 0.5, size * 0.75
    );
    innerGrad.addColorStop(0,   'rgba(0,0,0,0)');
    innerGrad.addColorStop(0.5, 'rgba(5,0,15,0.3)');
    innerGrad.addColorStop(1,   'rgba(0,0,0,0.85)');
    ctx.fillStyle = innerGrad;
    ctx.fillRect(x, y, size, size);
    ctx.restore();
  }
};
