// input.js — InputHandler

const Keys = {
  LEFT: 'LEFT', RIGHT: 'RIGHT', UP: 'UP',
  LIGHT_ATTACK: 'LIGHT_ATTACK', HEAVY_ATTACK: 'HEAVY_ATTACK',
  SKILL_Q: 'SKILL_Q', SKILL_E: 'SKILL_E', SKILL_C: 'SKILL_C',
  ULTIMATE: 'ULTIMATE', FREE_HIT: 'FREE_HIT', FLICKER: 'FLICKER'
};

const KEY_MAP = {
  'ArrowLeft': Keys.LEFT,  'a': Keys.LEFT,  'A': Keys.LEFT,
  'ArrowRight': Keys.RIGHT, 'd': Keys.RIGHT, 'D': Keys.RIGHT,
  'ArrowUp': Keys.UP, 'w': Keys.UP, 'W': Keys.UP, ' ': Keys.UP,
  'z': Keys.LIGHT_ATTACK, 'Z': Keys.LIGHT_ATTACK,
  'x': Keys.HEAVY_ATTACK, 'X': Keys.HEAVY_ATTACK,
  'q': Keys.SKILL_Q, 'Q': Keys.SKILL_Q,
  'e': Keys.SKILL_E, 'E': Keys.SKILL_E,
  'c': Keys.SKILL_C, 'C': Keys.SKILL_C,
  'v': Keys.ULTIMATE, 'V': Keys.ULTIMATE,
  'r': Keys.FLICKER,  'R': Keys.FLICKER, 'f': Keys.FLICKER, 'F': Keys.FLICKER,
};

class InputHandler {
  constructor() {
    this._held    = new Set();
    this._pressed = new Set();
    this._active  = true;
    this.mouseX   = 0; // tracks cursor X in screen pixels

    this._onKeyDown = (e) => {
      if (!this._active) return;
      // Don't intercept keys when typing in input fields
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      // Don't intercept browser shortcuts (Ctrl/Cmd/Alt combos)
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const action = KEY_MAP[e.key];
      if (action) {
        e.preventDefault();
        if (!this._held.has(action)) this._pressed.add(action);
        this._held.add(action);
      }
    };
    this._onKeyUp = (e) => {
      // Always release keys even if in input field
      const action = KEY_MAP[e.key];
      if (action) this._held.delete(action);
    };
    this._onMouseMove = (e) => { this.mouseX = e.clientX; };
    this._onMouseDown = (e) => {
      if (!this._active) return;
      // Don't intercept clicks inside UI elements (inputs, buttons, drawers)
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'TEXTAREA') return;
      if (e.target && e.target.closest && e.target.closest('#ui-overlay')) return;
      if (e.button === 0) {
        this._pressed.add(Keys.FREE_HIT);
        this._held.add(Keys.FREE_HIT);
      }
    };
    this._onMouseUp = (e) => {
      if (e.button === 0) this._held.delete(Keys.FREE_HIT);
    };
    this._onContextMenu = (e) => {
      // Only block right-click on the game canvas itself
      if (e.target && e.target.id === 'gameCanvas') e.preventDefault();
    };

    window.addEventListener('keydown',     this._onKeyDown);
    window.addEventListener('keyup',       this._onKeyUp);
    window.addEventListener('mousemove',   this._onMouseMove);
    window.addEventListener('mousedown',   this._onMouseDown);
    window.addEventListener('mouseup',     this._onMouseUp);
    window.addEventListener('contextmenu', this._onContextMenu);
  }

  isDown(key)    { return this._held.has(key); }
  wasPressed(key){ return this._pressed.has(key); }
  update()       { this._pressed.clear(); }

  setActive(active) {
    this._active = active;
    if (!active) { this._held.clear(); this._pressed.clear(); }
  }

  destroy() {
    window.removeEventListener('keydown',     this._onKeyDown);
    window.removeEventListener('keyup',       this._onKeyUp);
    window.removeEventListener('mousemove',   this._onMouseMove);
    window.removeEventListener('mousedown',   this._onMouseDown);
    window.removeEventListener('mouseup',     this._onMouseUp);
    window.removeEventListener('contextmenu', this._onContextMenu);
  }
}
