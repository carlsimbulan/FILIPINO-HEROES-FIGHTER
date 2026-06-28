// main.js — entry point, fullscreen scaling + game loop

window.addEventListener('DOMContentLoaded', function () {
  const canvas = document.getElementById('gameCanvas');

  // ── Fullscreen resize ─────────────────────────────────────
  function resizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width  = w;
    canvas.height = h;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';

    window.CANVAS_WIDTH  = w;
    window.CANVAS_HEIGHT = h;
    window.GROUND_Y      = h;
    window.GROUND_HEIGHT = Math.round(h * 0.12);

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ── Boot game ─────────────────────────────────────────────
  const game = new GameStateMachine(canvas);
  game.start();

  let lastTime = null;
  const MAX_DT = 1 / 20;

  function loop(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    let dt = (timestamp - lastTime) / 1000;
    if (dt > MAX_DT) dt = MAX_DT;
    lastTime = timestamp;

    game.update(dt);
    game.render();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
