// ─────────────────────────────────────────────────────────────────────────────
// BattleBG_Renderer — Filipino-themed animated pixel art battle background
// Plain-object singleton matching the style of Renderer, VisualEnhancer, etc.
// ─────────────────────────────────────────────────────────────────────────────

const BattleBG_Renderer = {

  // ── Internal State ─────────────────────────────────────────────────────────
  _lightTimer:      0,     // seconds elapsed since fight start
  _frameCount:      0,     // incremented each draw() call, drives animation clocks
  _particles:       [],    // pool of Ambient_Particle objects

  // Gradient cache — invalidated when canvas dimensions change
  _cachedSkyGrad:    null,
  _cachedVigGrad:    null,
  _cachedW:          0,
  _cachedH:          0,

  // ── Constants ──────────────────────────────────────────────────────────────
  _COLORS: ['#a0c4ff', '#c8e6ff', '#e0ccff'],  // night: pale blue/purple glows
  _POOL_SIZE: 16,

  // ── reset() ────────────────────────────────────────────────────────────────
  // Call on fight enter — resets timer, frame counter, and particle pool.
  reset() {
    this._lightTimer = 0;
    this._frameCount = 0;

    this._particles = [];
    const COLORS = this._COLORS;

    for (let i = 0; i < this._POOL_SIZE; i++) {
      this._particles.push({
        x:        Math.random() * CANVAS_WIDTH,
        y:        Math.random() * (GROUND_Y - GROUND_HEIGHT),
        vx:       (Math.random() - 0.5) * 0.6,   // -0.3 to 0.3
        vy:       -(0.2 + Math.random() * 0.6),  // -0.8 to -0.2  (upward drift)
        color:    COLORS[Math.floor(Math.random() * 3)],
        lifetime: 2.0 + Math.random() * 3.0,     // 2.0 – 5.0 s
        age:      Math.random() * 4.0,            // stagger initial spawn
      });
    }
  },

  // ── update(dt) ─────────────────────────────────────────────────────────────
  // Call each tick (before render) — advances lighting timer and particle state.
  update(dt) {
    this._lightTimer += dt;

    const COLORS   = this._COLORS;
    const spawnY   = GROUND_Y - GROUND_HEIGHT - 4;

    for (const p of this._particles) {
      p.x   += p.vx;
      p.y   += p.vy;
      p.age += dt;

      if (p.age >= p.lifetime) {
        // Reset particle — re-enters from bottom
        p.x        = Math.random() * CANVAS_WIDTH;
        p.y        = spawnY;
        p.vx       = (Math.random() - 0.5) * 0.6;
        p.vy       = -(0.2 + Math.random() * 0.6);
        p.lifetime = 2.0 + Math.random() * 3.0;
        p.age      = 0;
        p.color    = COLORS[Math.floor(Math.random() * 3)];
      }
    }
  },

  // Torch frame offsets: 4 frames × 3 blocks [base, mid, tip] as {dx,dy}
  _TORCH_FRAMES: [
    [{dx:0,dy:0},{dx:1,dy:-1},{dx:0,dy:-2}],
    [{dx:1,dy:0},{dx:0,dy:-1},{dx:1,dy:-2}],
    [{dx:0,dy:0},{dx:-1,dy:-1},{dx:0,dy:-2}],
    [{dx:-1,dy:0},{dx:0,dy:-1},{dx:-1,dy:-2}],
  ],

  _drawTorch(ctx, tx, ty, frame) {
    const offsets = this._TORCH_FRAMES[frame];
    const colors  = ['#ff6a00', '#ff9c2b', '#ffe08a'];
    // Stone bracket
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(tx - 3, ty, 6, 20);
    // 3 flame blocks (each 4×4)
    for (let i = 0; i < 3; i++) {
      const o = offsets[i];
      ctx.fillStyle = colors[i];
      ctx.fillRect(tx - 2 + o.dx * 2, ty - 8 - i * 8 + o.dy * 2, 4, 4);
    }
  },

  // ── draw() ─────────────────────────────────────────────────────────────────
  // Called by Renderer.drawBackground(ctx, focusX).
  draw(ctx, focusX) {
    this._frameCount++;

    const W = CANVAS_WIDTH, H = CANVAS_HEIGHT, groundY = GROUND_Y - GROUND_HEIGHT;

    // ── 1. Gradient cache check & rebuild ──────────────────────────────────
    if (W !== this._cachedW || H !== this._cachedH) {
      this._cachedSkyGrad    = null;
      this._cachedVigGrad    = null;
      this._cachedW = W;
      this._cachedH = H;
    }

    if (!this._cachedSkyGrad) {
      this._cachedSkyGrad = ctx.createLinearGradient(0, 0, 0, H);
      this._cachedSkyGrad.addColorStop(0,   '#02020f');  // deep midnight black
      this._cachedSkyGrad.addColorStop(0.5, '#0a0a2e');  // dark navy
      this._cachedSkyGrad.addColorStop(1,   '#1a1040');  // deep indigo at bottom
    }

    if (!this._cachedVigGrad) {
      this._cachedVigGrad = ctx.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, H*0.85);
      this._cachedVigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      this._cachedVigGrad.addColorStop(1, 'rgba(0,0,0,0.55)');
    }

    // ── 2. Sky gradient layer ───────────────────────────────────────────────
    ctx.fillStyle = this._cachedSkyGrad;
    ctx.fillRect(0, 0, W, H);

    // ── 2b. Stars ──────────────────────────────────────────────────────────
    ctx.save();
    // Use a seeded pattern based on canvas size so stars are stable
    const starSeed = W * 31 + H * 17;
    for (let s = 0; s < 60; s++) {
      // Pseudo-random positions from seed
      const sx = ((starSeed * (s + 1) * 2654435761) >>> 0) % W;
      const sy = ((starSeed * (s + 1) * 2246822519) >>> 0) % Math.round(groundY * 0.85);
      // Twinkle: each star has its own phase
      const twinkle = 0.5 + 0.5 * Math.sin(this._frameCount * 0.03 + s * 1.3);
      ctx.globalAlpha = 0.4 + 0.6 * twinkle;
      ctx.fillStyle   = s % 5 === 0 ? '#c8d8ff' : '#ffffff';
      const sz = s % 7 === 0 ? 2 : 1;
      ctx.fillRect(sx, sy, sz, sz);
    }
    ctx.restore();

    // ── 2c. Moon ───────────────────────────────────────────────────────────
    const moonX = Math.round(W * 0.82);
    const moonY = Math.round(groundY * 0.18);
    // Moon glow
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#c8d8ff';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Moon body (pixel-art: 4×4 blocks in a circle shape)
    ctx.fillStyle = '#e8eeff';
    const moonBlocks = [
      [0,-2],[1,-2],[-1,-2],
      [-2,-1],[-2,0],[-2,1],
      [2,-1],[2,0],[2,1],
      [-1,2],[0,2],[1,2],
    ];
    for (const [mx, my] of moonBlocks) {
      ctx.fillRect(moonX + mx * 4, moonY + my * 4, 4, 4);
    }
    // Moon crater
    ctx.fillStyle = '#c8d0e8';
    ctx.fillRect(moonX + 4, moonY - 4, 4, 4);

    // ── 3. Night moon-glow overlay ─────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle   = '#4060cc';   // cool blue moonlight tint
    ctx.fillRect(0, 0, W, groundY);
    ctx.restore();

    // ── 4. Parallax mid-ground layers ─────────────────────────────────────────
    if (focusX === undefined) focusX = W / 2;
    const parallaxBase  = focusX - W / 2;
    const mountainOffset = parallaxBase * 0.04;
    const bambooOffset   = parallaxBase * 0.08;

    // Layer overdraw: draw from -W*0.12 to W*1.12 (total width = W*1.24)
    const overdrawStart = -Math.ceil(W * 0.12);
    const overdrawEnd   =  Math.ceil(W * 1.12);

    // ── Mountain ridgeline (depth: mid, multiplier 0.04) ──────────────────
    ctx.save();
    ctx.translate(mountainOffset, 0);

    // Sky background behind mountains (lighter sky-to-ground color)
    ctx.fillStyle = '#c4c8a8';
    // Jagged mountain silhouette using 4×4 blocks
    const mountH = Math.round(groundY * 0.35); // mountain base height above ground
    const mountTopY = Math.round(groundY * 0.42); // where mountain starts appearing
    // Draw mountains as silhouette with 4×4 grid-aligned blocks
    const blockSize = 4;
    const mountColors = ['#1a2a3a', '#1e3040', '#162030'];

    // Define mountain profile: array of heights per 4px column
    for (let bx = overdrawStart; bx < overdrawEnd; bx += blockSize) {
      // Use sine waves to generate a natural-looking ridge
      const nx = bx / W;
      const h = Math.round((
        Math.sin(nx * Math.PI * 3.7 + 1.2) * 0.18 +
        Math.sin(nx * Math.PI * 7.1 + 2.4) * 0.10 +
        Math.sin(nx * Math.PI * 1.9 + 0.8) * 0.12 +
        0.55
      ) * mountH / blockSize) * blockSize;
      const topY = groundY - h;
      ctx.fillStyle = mountColors[Math.abs(Math.round(bx / blockSize)) % 3];
      ctx.fillRect(bx, topY, blockSize, h);
    }
    ctx.restore();

    // ── Bamboo grove (depth: close, multiplier 0.08) ──────────────────────
    ctx.save();
    ctx.translate(bambooOffset, 0);

    const bambooTopY = Math.round(groundY * 0.55); // bamboo starts lower
    const bambooBaseH = Math.round(groundY * 0.45);
    const bambooBlockSize = 4;
    const bambooColors = ['#0d1f0d', '#102510', '#142e14', '#0a1a0a'];

    for (let bx = overdrawStart; bx < overdrawEnd; bx += bambooBlockSize) {
      const nx = bx / W;
      // Bamboo stalks: taller, narrower peaks
      const h = Math.round((
        Math.sin(nx * Math.PI * 8.3 + 0.5) * 0.22 +
        Math.sin(nx * Math.PI * 14.7 + 1.8) * 0.14 +
        Math.sin(nx * Math.PI * 5.1 + 3.1) * 0.08 +
        0.56
      ) * bambooBaseH / bambooBlockSize) * bambooBlockSize;
      const topY = groundY - h;
      ctx.fillStyle = bambooColors[Math.abs(Math.round(bx / bambooBlockSize)) % 4];
      ctx.fillRect(bx, topY, bambooBlockSize, h);
    }
    ctx.restore();

    // ── 5. Ambient particles (behind arena floor) ─────────────────────────────
    for (const p of this._particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1.0 - p.age / p.lifetime);
      ctx.fillStyle   = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
      ctx.restore();
    }

    // ── 6. Animated sprites (torches, crowd, banners) ─────────────────────────
    const torchFrame = Math.floor(this._frameCount / 8) % 4;
    const torchY     = groundY - 45;
    this._drawTorch(ctx, Math.round(W * 0.18), torchY, torchFrame);
    this._drawTorch(ctx, Math.round(W * 0.82), torchY, torchFrame);

    // ── Crowd silhouettes ──────────────────────────────────────────────────
    const crowdBaseY   = groundY - 80;
    const crowdSpacing = Math.round(W / 9);
    for (let i = 0; i < 8; i++) {
      const phase = (i / 8) * Math.PI * 2;
      const bobY  = Math.round(Math.sin(this._frameCount * 0.08 + phase) * 1.5);
      const fx    = Math.round(crowdSpacing + i * crowdSpacing);
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(fx - 3, crowdBaseY + bobY, 6, 12);
    }

    // ── Banners ────────────────────────────────────────────────────────────
    const bannerXs = [Math.round(W * 0.25), Math.round(W * 0.75)];
    for (let b = 0; b < 2; b++) {
      const bx    = bannerXs[b];
      const by    = groundY - 90;
      const tipDY = Math.round(Math.sin(this._lightTimer * 2 + b) * 2);
      // Pole
      ctx.fillStyle = '#8a6a4a';
      ctx.fillRect(bx - 1, by, 2, 40);
      // Banner body
      ctx.fillStyle = '#2a1060';  // deep purple night banner
      ctx.fillRect(bx, by, 16, 24 + tipDY);
      // Moon motif (3×3 at center)
      ctx.fillStyle = '#c8d8ff';  // pale moonlight
      ctx.fillRect(bx + 6, by + 10, 3, 3);
    }

    // ── 9. Vignette (final layer) ─────────────────────────────────────────────
    ctx.fillStyle = this._cachedVigGrad;
    ctx.fillRect(0, 0, W, H);
  },

};
