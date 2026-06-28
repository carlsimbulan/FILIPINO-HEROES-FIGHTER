// game.js — GameStateMachine

const States = {
  LOGIN: 'LOGIN',
  HOME: 'HOME',
  HERO_SELECT: 'HERO_SELECT',
  FIGHTING: 'FIGHTING',
  WIN: 'WIN'
};

const VALID_TRANSITIONS = {
  [States.LOGIN]:      [States.HOME],
  [States.HOME]:       [States.HERO_SELECT],
  [States.HERO_SELECT]:[States.FIGHTING, States.HOME],
  [States.FIGHTING]:   [States.WIN],
  [States.WIN]:        [States.HERO_SELECT, States.HOME]
};

class GameStateMachine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this._input = new InputHandler();

    this._stateObjects = {
      [States.LOGIN]:      new LoginState(this),
      [States.HOME]:       new HomeState(this),
      [States.HERO_SELECT]:new HeroSelectState(this),
      [States.FIGHTING]:   new FightState(this, this._input),
      [States.WIN]:        new WinState(this)
    };

    this._current = null;
    this._currentKey = null;
  }

  start() {
    // Force enter LOGIN without transition validation
    this._currentKey = States.LOGIN;
    this._current = this._stateObjects[States.LOGIN];
    this._current.enter();
  }

  transition(newState, payload) {
    const allowed = VALID_TRANSITIONS[this._currentKey] || [];
    if (!allowed.includes(newState)) {
      console.error(`[GameStateMachine] Invalid transition: ${this._currentKey} → ${newState}`);
      return;
    }
    if (this._current && this._current.exit) this._current.exit();
    this._currentKey = newState;
    this._current = this._stateObjects[newState];
    if (this._current && this._current.enter) this._current.enter(payload);
  }

  update(dt) {
    if (this._current && this._current.update) this._current.update(dt);
  }

  render() {
    if (this._current && this._current.render) this._current.render(this.ctx);
  }
}
