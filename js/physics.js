// physics.js — gravity, movement, collision helpers
// NOTE: CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, GROUND_HEIGHT are set by main.js
// Default values until main.js runs
window.CANVAS_WIDTH  = window.CANVAS_WIDTH  || window.innerWidth;
window.CANVAS_HEIGHT = window.CANVAS_HEIGHT || window.innerHeight;
window.GROUND_Y      = window.GROUND_Y      || window.innerHeight;
window.GROUND_HEIGHT = window.GROUND_HEIGHT || Math.round(window.innerHeight * 0.12);

const GRAVITY = 1800; // pixels per second squared

function applyGravity(fighter, dt) {
  if (!fighter.onGround) {
    fighter.vy += GRAVITY * dt;
  }
  const groundY = GROUND_Y - GROUND_HEIGHT - fighter.height;
  fighter.y += fighter.vy * dt;
  if (fighter.y >= groundY) {
    fighter.y = groundY;
    fighter.vy = 0;
    const wasAir = !fighter.onGround;
    fighter.onGround = true;
    if (wasAir) fighter._jumpsLeft = 2; // reset on landing
  }
}

function moveHorizontal(fighter, dx) {
  fighter.x += dx;
  if (fighter.x < 0) fighter.x = 0;
  if (fighter.x + fighter.width > CANVAS_WIDTH) fighter.x = CANVAS_WIDTH - fighter.width;
}

function rectsOverlap(a, b) {
  if (!a || !b) return false;
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
