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
    const baseColor  = dark ? '#440011' : '#ff2200';
    const midColor   = dark ? '#220044' : '#ff6600';
    const tipColor   = dark ? '#660066' : '#ffcc00';
    const glowColor  = dark ? 'rgba(80,0,40,0.5)' : 'rgba(255,80,0,0.4)';

    ctx.save();
    // Glow
    ctx.shadowColor = dark ? '#440011' : '#ff4400';
    ctx.shadowBlur = 18 + 6 * Math.sin(t * 3);

    // Outer border
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);

    // Animated fire particles along top edge
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

    // Bottom flames
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

    // Side flames left
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

    // Inner glow overlay
    ctx.save();
    ctx.globalAlpha = 0.15 + 0.08 * Math.sin(t * 4);
    const innerGrad = ctx.createLinearGradient(x, y, x + size, y + size);
    innerGrad.addColorStop(0, baseColor);
    innerGrad.addColorStop(1, tipColor);
    ctx.fillStyle = innerGrad;
    ctx.fillRect(x, y, size, size);
    ctx.restore();
  }
};
