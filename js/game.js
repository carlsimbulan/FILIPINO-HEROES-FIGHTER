// game.js — GameStateMachine

const States = {
  LOGIN:      'LOGIN',
  HOME:       'HOME',
  HERO_SELECT:'HERO_SELECT',
  FIGHTING:   'FIGHTING',
  WIN:        'WIN'
};

// URL path ↔ state mapping
const STATE_PATHS = {
  [States.LOGIN]:      '/login',
  [States.HOME]:       '/home',
  [States.HERO_SELECT]:'/select',
  [States.FIGHTING]:   '/battle',
  [States.WIN]:        '/result'
};
const PATH_STATES = {};
Object.entries(STATE_PATHS).forEach(([s, p]) => { PATH_STATES[p] = s; });

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

    this._current    = null;
    this._currentKey = null;

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      const state = (e.state && e.state.gameState) || States.LOGIN;
      this._enterState(state, e.state && e.state.payload);
    });
  }

  // Determine which state to start in based on current URL + session
  start() {
    const path = window.location.pathname;
    const mapped = PATH_STATES[path];
    const isLoggedIn = (() => {
      try { return !!sessionStorage.getItem('fhf_username'); } catch(e) { return false; }
    })();

    let initialState = States.LOGIN;
    if (mapped && mapped !== States.LOGIN && isLoggedIn) {
      // Restore to the mapped state if logged in
      // FIGHTING and WIN can't be restored meaningfully — fall back to HOME
      initialState = (mapped === States.FIGHTING || mapped === States.WIN)
        ? States.HOME
        : mapped;
    } else if (!mapped || mapped === States.LOGIN) {
      initialState = isLoggedIn ? States.HOME : States.LOGIN;
    }

    this._enterState(initialState);
    history.replaceState({ gameState: initialState }, '', STATE_PATHS[initialState]);
  }

  transition(newState, payload) {
    const allowed = VALID_TRANSITIONS[this._currentKey] || [];
    if (!allowed.includes(newState)) {
      console.error(`[GameStateMachine] Invalid transition: ${this._currentKey} → ${newState}`);
      return;
    }
    if (this._current && this._current.exit) this._current.exit();
    this._currentKey = newState;
    this._current    = this._stateObjects[newState];
    if (this._current && this._current.enter) this._current.enter(payload);

    // Push URL
    history.pushState({ gameState: newState, payload }, '', STATE_PATHS[newState]);
  }

  _enterState(stateKey, payload) {
    if (this._current && this._current.exit) this._current.exit();
    this._currentKey = stateKey;
    this._current    = this._stateObjects[stateKey];
    if (this._current && this._current.enter) this._current.enter(payload);
  }

  update(dt) {
    if (this._current && this._current.update) this._current.update(dt);
  }

  render() {
    if (this._current && this._current.render) this._current.render(this.ctx);
  }
}
