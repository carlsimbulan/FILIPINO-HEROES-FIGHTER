// particles.js — visual effects system (supercharged)

class Particle {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.vx = opts.vx || 0; this.vy = opts.vy || 0;
    this.life = opts.life || 0.5; this.maxLife = this.life;
    this.color = opts.color || '#fff';
    this.size = opts.size || 4;
    this.endSize = opts.endSize !== undefined ? opts.endSize : 0;
    this.type = opts.type || 'square';
    this.gravity = opts.gravity || 0;
    this.alpha = opts.alpha !== undefined ? opts.alpha : 1;
    this.rotation = opts.rotation || 0;
    this.rotSpeed = opts.rotSpeed || 0;
    this.colors = opts.colors || null;
    this.dx = opts.dx || 0; this.dy = opts.dy || 0;
    this.length = opts.length || 10;
  }

  update(dt) {
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.life -= dt; this.rotation += this.rotSpeed * dt;
    return this.life > 0;
  }

  get t() { return Math.max(0, this.life / this.maxLife); }

  render(ctx) {
    const t = this.t;
    const size = this.endSize + (this.size - this.endSize) * t;
    const alpha = this.alpha * t;
    if (alpha <= 0.01 || size <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const col = this.colors
      ? this.colors[Math.floor((1 - t) * this.colors.length) % this.colors.length]
      : this.color;

    if (this.type === 'circle') {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(this.x, this.y, size / 2, 0, Math.PI * 2); ctx.fill();
    } else if (this.type === 'line') {
      ctx.strokeStyle = col; ctx.lineWidth = size; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.dx * this.length * t, this.y + this.dy * this.length * t);
      ctx.stroke();
    } else if (this.type === 'star') {
      ctx.fillStyle = col;
      ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-size/6, -size/2, size/3, size); ctx.rotate(Math.PI/2);
      }
    } else if (this.type === 'ring') {
      ctx.strokeStyle = col; ctx.lineWidth = size;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.length * (1 - t) * 0.5 + 10, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = col;
      ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
      ctx.fillRect(-size/2, -size/2, size, size);
    }
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() { this._particles = []; }

  add(p) {
    if (this._particles.length >= 400) {
      this._particles.shift(); // evict oldest to stay under 400-particle cap
    }
    this._particles.push(p);
  }
  update(dt) { this._particles = this._particles.filter(p => p.update(dt)); }
  render(ctx) { for (const p of this._particles) p.render(ctx); }
  clear() { this._particles = []; }

  // ── Hit Impact — big burst ────────────────────────────────
  hitImpact(x, y, color = '#ffe066', attackType = 'light') {
    // Large sparks
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.4;
      const speed = 120 + Math.random() * 220;
      this.add(new Particle(x, y, {
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 80,
        life: 0.4 + Math.random() * 0.3, size: 8 + Math.random() * 8,
        endSize: 0, color, gravity: 500, type: 'square',
        rotation: Math.random() * Math.PI, rotSpeed: (Math.random() - 0.5) * 15
      }));
    }
    // Glow rings
    for (let r = 0; r < 3; r++) {
      this.add(new Particle(x, y, {
        type: 'circle', life: 0.12 + r * 0.06,
        size: 30 + r * 40, endSize: 80 + r * 60,
        color, alpha: 0.5 - r * 0.12
      }));
    }
    // Inner bright flash
    this.add(new Particle(x, y, {
      type: 'circle', life: 0.08, size: 60, endSize: 0,
      color: '#fff', alpha: 0.8
    }));
    // Floating "!" damage indicator
    this._particles.push({
      x, y: y - 10, vy: -90, life: 0.7, maxLife: 0.7, _text: '!',
      update(dt) { this.y += this.vy * dt; this.vy *= 0.88; this.life -= dt; return this.life > 0; },
      render(c) {
        c.save(); c.globalAlpha = this.life / this.maxLife;
        c.font = 'bold 22px monospace'; c.fillStyle = '#ffe066';
        c.textAlign = 'center'; c.fillText(this._text, this.x, this.y);
        c.restore();
      }
    });

    // ── Extra debris for heavy / ult hits ─────────────────
    if (attackType === 'heavy' || attackType === 'ult') {
      const count = 8 + Math.floor(Math.random() * 5); // 8–12
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 160;
        this.add(new Particle(x, y, {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 60,
          life: 0.5 + Math.random() * 0.3,
          size: 12 + Math.random() * 8,
          endSize: 0,
          type: 'square',
          color,
          gravity: 480,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 12
        }));
      }
    }
  }

  // ── Stun Effect — electric stars ─────────────────────────
  stunEffect(x, y) {
    // Big spinning stars
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const r = 28;
      this.add(new Particle(x + Math.cos(angle) * r, y - 22 + Math.sin(angle) * r / 2, {
        life: 3.5, size: 14, endSize: 10, type: 'star',
        color: '#ffe066', alpha: 1, rotation: angle,
        rotSpeed: 4 + Math.random() * 3
      }));
    }
    // Electric bolt sparks
    for (let i = 0; i < 16; i++) {
      this.add(new Particle(x + (Math.random() - 0.5) * 40, y - 10 + (Math.random() - 0.5) * 30, {
        vx: (Math.random() - 0.5) * 100, vy: -40 - Math.random() * 80,
        life: 0.5, size: 5, endSize: 0, type: 'circle',
        colors: ['#ffe066', '#fff', '#88f0ff', '#00ffff'], alpha: 1
      }));
    }
    // Blue zap ring
    this.add(new Particle(x, y - 10, {
      type: 'circle', life: 0.3, size: 80, endSize: 110,
      color: '#88f0ff', alpha: 0.4
    }));
  }

  // ── Slash Trail — big visible arcs ───────────────────────
  slashTrail(x, y, dir, color = '#ffe066') {
    for (let i = 0; i < 14; i++) {
      const angle = dir === 1
        ? -0.5 + (i / 14) * 1.6
        : Math.PI + 0.5 - (i / 14) * 1.6;
      const len = 50 + Math.random() * 80;
      this.add(new Particle(x, y + (Math.random() - 0.5) * 30, {
        type: 'line', dx: Math.cos(angle), dy: Math.sin(angle), length: len,
        life: 0.2 + Math.random() * 0.12, size: 3 + Math.random() * 3,
        color, alpha: 0.9
      }));
    }
    // White core
    this.add(new Particle(x, y, {
      type: 'line', dx: dir, dy: -0.1, length: 80,
      life: 0.1, size: 4, color: '#fff', alpha: 1
    }));
  }

  // ── Block Effect — green explosion ───────────────────────
  blockEffect(x, y) {
    for (let i = 0; i < 18; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
      this.add(new Particle(x, y, {
        vx: Math.cos(angle) * (100 + Math.random() * 160),
        vy: Math.sin(angle) * (80 + Math.random() * 120),
        life: 0.35, size: 10, endSize: 0, type: 'square',
        colors: ['#27ae60', '#2ecc71', '#a8ff78'], alpha: 0.9, gravity: 300
      }));
    }
    // Triple expanding rings
    for (let r = 0; r < 3; r++) {
      this.add(new Particle(x, y, {
        type: 'circle', life: 0.25 + r * 0.05,
        size: 40 + r * 30, endSize: 100 + r * 50,
        color: '#27ae60', alpha: 0.45 - r * 0.1
      }));
    }
    this.add(new Particle(x, y, {
      type: 'circle', life: 0.1, size: 70, endSize: 0,
      color: '#fff', alpha: 0.6
    }));
  }

  // ── War Cry Aura — fire embers ────────────────────────────
  warCryAura(x, y, w, h) {
    for (let i = 0; i < 5; i++) {
      this.add(new Particle(x + Math.random() * w, y + h * 0.8, {
        vx: (Math.random() - 0.5) * 30, vy: -80 - Math.random() * 120,
        life: 0.7, size: 12, endSize: 0, type: 'circle',
        colors: ['#e67e22', '#f39c12', '#ffe066', '#ff4400'], alpha: 0.8, gravity: -40
      }));
    }
    // Pulsing aura ring
    this.add(new Particle(x + w / 2, y + h / 2, {
      type: 'circle', life: 0.35,
      size: w + 20, endSize: w + 60,
      color: '#e67e22', alpha: 0.12
    }));
  }

  // ── Flurry Trail — rapid punch streaks ───────────────────
  flurryTrail(x, y, dir) {
    for (let i = 0; i < 8; i++) {
      const angle = dir === 1
        ? (Math.random() - 0.5) * 1.0
        : Math.PI + (Math.random() - 0.5) * 1.0;
      this.add(new Particle(x, y, {
        type: 'line', dx: Math.cos(angle), dy: Math.sin(angle),
        length: 40 + Math.random() * 50,
        life: 0.1, size: 3 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#f39c12' : '#ffe066', alpha: 1
      }));
    }
    this.add(new Particle(x, y, {
      type: 'circle', life: 0.08, size: 20, endSize: 0,
      color: '#fff', alpha: 0.7
    }));
  }

  // ── Giant Glove Shockwave — MASSIVE ──────────────────────
  ultGloveShockwave(x, y) {
    // Massive debris burst
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40 + (Math.random() - 0.5) * 0.2;
      const speed = 300 + Math.random() * 280;
      this.add(new Particle(x, y, {
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 120,
        life: 0.6 + Math.random() * 0.3, size: 14 + Math.random() * 14, endSize: 0,
        type: 'square', colors: ['#ffe066', '#fff', '#f39c12', '#ffcc00'],
        gravity: 600, rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 20
      }));
    }
    // Expanding shockwave rings
    for (let r = 0; r < 5; r++) {
      this.add(new Particle(x, y, {
        type: 'circle', life: 0.18 + r * 0.08,
        size: 60 + r * 50, endSize: 200 + r * 80,
        color: r % 2 === 0 ? '#ffe066' : '#fff', alpha: 0.5 - r * 0.07
      }));
    }
    // Big white flash
    this.add(new Particle(x, y, {
      type: 'circle', life: 0.12, size: 200, endSize: 0,
      color: '#fff', alpha: 0.7
    }));
    // Screen-filling text
    this._particles.push({
      x, y: y - 40, vy: -60, life: 0.8, maxLife: 0.8, _text: 'BOOM!',
      update(dt) { this.y += this.vy * dt; this.vy *= 0.92; this.life -= dt; return this.life > 0; },
      render(c) {
        c.save(); c.globalAlpha = this.life / this.maxLife;
        c.font = 'bold 36px monospace'; c.fillStyle = '#ffe066';
        c.strokeStyle = '#e67e22'; c.lineWidth = 3;
        c.textAlign = 'center';
        c.strokeText(this._text, this.x, this.y);
        c.fillText(this._text, this.x, this.y);
        c.restore();
      }
    });
  }

  // ── Death Effect ──────────────────────────────────────────
  deathEffect(x, y, w, h) {
    for (let i = 0; i < 35; i++) {
      this.add(new Particle(x + Math.random() * w, y + Math.random() * h, {
        vx: (Math.random() - 0.5) * 280, vy: -80 - Math.random() * 250,
        life: 0.9 + Math.random() * 0.5, size: 8 + Math.random() * 12, endSize: 0,
        type: 'square', colors: ['#e74c3c', '#c0392b', '#922b21', '#ff6b6b'],
        gravity: 500, rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 14
      }));
    }
    this.add(new Particle(x + w/2, y + h/2, {
      type: 'circle', life: 0.3, size: 80, endSize: 200,
      color: '#e74c3c', alpha: 0.5
    }));
  }

  // ── Spin Effect — Itak / Kris 360 ────────────────────────
  spinEffect(x, y, w, h) {
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const r = Math.max(w, h) / 2 + 15;
      this.add(new Particle(
        x + w/2 + Math.cos(angle) * r,
        y + h/2 + Math.sin(angle) * r, {
        type: 'line', dx: Math.cos(angle), dy: Math.sin(angle), length: 40,
        life: 0.3, size: 4,
        colors: ['#ffe066', '#bdc3c7', '#fff', '#f1c40f'], alpha: 1
      }));
    }
    // Central flash
    this.add(new Particle(x + w/2, y + h/2, {
      type: 'circle', life: 0.2, size: w + 30, endSize: w + 80,
      color: '#ffe066', alpha: 0.35
    }));
  }

  // ── Rage Mode — fire explosion ────────────────────────────
  rageModeEffect(x, y, w, h) {
    for (let i = 0; i < 25; i++) {
      const angle = (Math.PI * 2 * i) / 25;
      const speed = 150 + Math.random() * 150;
      this.add(new Particle(x + w/2, y + h/2, {
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60,
        life: 0.5, size: 10, endSize: 0, type: 'circle',
        colors: ['#ff4400', '#ff8800', '#ffcc00', '#ff2200'],
        alpha: 0.9, gravity: 200
      }));
    }
    for (let r = 0; r < 4; r++) {
      this.add(new Particle(x + w/2, y + h/2, {
        type: 'circle', life: 0.15 + r * 0.06,
        size: 30 + r * 35, endSize: 80 + r * 60,
        color: r % 2 === 0 ? '#ff4400' : '#ffaa00', alpha: 0.4 - r * 0.07
      }));
    }
    this._particles.push({
      x: x + w/2, y: y - 20, vy: -70, life: 0.8, maxLife: 0.8, _text: 'RAGE!',
      update(dt) { this.y += this.vy * dt; this.vy *= 0.9; this.life -= dt; return this.life > 0; },
      render(c) {
        c.save(); c.globalAlpha = this.life / this.maxLife;
        c.font = 'bold 28px monospace'; c.fillStyle = '#ff4400';
        c.strokeStyle = '#ffe066'; c.lineWidth = 2;
        c.textAlign = 'center';
        c.strokeText(this._text, this.x, this.y);
        c.fillText(this._text, this.x, this.y);
        c.restore();
      }
    });
  }

  // ── Revolver Shot ─────────────────────────────────────────
  revolverShot(x, y, dir) {
    // Muzzle flash
    this.add(new Particle(x, y, {
      type: 'circle', life: 0.08, size: 30, endSize: 0,
      color: '#ffe066', alpha: 0.9
    }));
    // Bullet trail
    for (let i = 0; i < 10; i++) {
      this.add(new Particle(x + dir * i * 30, y + (Math.random() - 0.5) * 6, {
        type: 'circle', size: 6 - i * 0.4, endSize: 0,
        life: 0.1 - i * 0.005, color: '#ffe066', alpha: 1
      }));
    }
    this._particles.push({
      x: x + dir * 40, y: y - 10, vy: -60, life: 0.5, maxLife: 0.5, _text: 'BANG!',
      update(dt) { this.y += this.vy * dt; this.vy *= 0.9; this.life -= dt; return this.life > 0; },
      render(c) {
        c.save(); c.globalAlpha = this.life / this.maxLife;
        c.font = 'bold 18px monospace'; c.fillStyle = '#ffe066';
        c.textAlign = 'center'; c.fillText(this._text, this.x, this.y);
        c.restore();
      }
    });
  }

  // ── Ultimate text label ───────────────────────────────────
  ultLabel(x, y, text, color) {
    this._particles.push({
      x, y: y - 30, vy: -50, life: 1.0, maxLife: 1.0, _text: text, _color: color,
      update(dt) { this.y += this.vy * dt; this.vy *= 0.93; this.life -= dt; return this.life > 0; },
      render(c) {
        c.save(); c.globalAlpha = this.life / this.maxLife;
        c.font = 'bold 30px monospace'; c.fillStyle = this._color || '#ffe066';
        c.strokeStyle = '#000'; c.lineWidth = 3;
        c.textAlign = 'center';
        c.strokeText(this._text, this.x, this.y);
        c.fillText(this._text, this.x, this.y);
        c.restore();
      }
    });
  }

  ultFlash(ctx) {
    ctx.save(); ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // ── Flicker — teleport dash blink ────────────────────────
  flickerEffect(x, y, w, h) {
    // Ghost afterimage trail
    for (let i = 0; i < 5; i++) {
      this.add(new Particle(x - i * 12, y, {
        type: 'circle',
        life: 0.25 - i * 0.04,
        size: w * 0.8,
        endSize: 0,
        color: '#88f0ff',
        alpha: 0.25 - i * 0.04
      }));
    }
    // Arrival flash
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      this.add(new Particle(x + w/2, y + h/2, {
        vx: Math.cos(angle) * (100 + Math.random() * 120),
        vy: Math.sin(angle) * (80 + Math.random() * 100),
        life: 0.3, size: 8, endSize: 0, type: 'circle',
        colors: ['#88f0ff', '#00ffff', '#fff', '#4488ff'],
        alpha: 0.9, gravity: 150
      }));
    }
    // Bright ring
    this.add(new Particle(x + w/2, y + h/2, {
      type: 'circle', life: 0.15, size: 20, endSize: w * 2 + 40,
      color: '#00ffff', alpha: 0.5
    }));
    this.add(new Particle(x + w/2, y + h/2, {
      type: 'circle', life: 0.08, size: w + 20, endSize: 0,
      color: '#fff', alpha: 0.8
    }));
    // Label
    this._particles.push({
      x: x + w/2, y: y - 10, vy: -70, life: 0.6, maxLife: 0.6, _text: 'FLICKER!',
      update(dt) { this.y += this.vy * dt; this.vy *= 0.9; this.life -= dt; return this.life > 0; },
      render(c) {
        c.save(); c.globalAlpha = this.life / this.maxLife;
        c.font = 'bold 20px monospace'; c.fillStyle = '#00ffff';
        c.strokeStyle = '#004488'; c.lineWidth = 2;
        c.textAlign = 'center';
        c.strokeText(this._text, this.x, this.y);
        c.fillText(this._text, this.x, this.y);
        c.restore();
      }
    });
  }
}

const FX = new ParticleSystem();
