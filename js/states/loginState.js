// loginState.js — LOGIN / REGISTER screen connected to MongoDB

const _loginBgImg = new Image();
_loginBgImg.src = 'bg login page.png';

function validateCredentials(username, password) {
  return username.trim().length > 0 && password.trim().length > 0;
}

class LoginState {
  constructor(game) {
    this.game = game;
    this._panel = null;
    this._tab = 'login'; // 'login' | 'register'
  }

  enter() { this._buildUI(); }

  exit() {
    if (this._panel && this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
    this._panel = null;
  }

  update(dt) {}

  render(ctx) {
    if (_loginBgImg.complete && _loginBgImg.naturalWidth > 0) {
      ctx.drawImage(_loginBgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#060a10'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    ctx.fillStyle = 'rgba(6,10,16,0.55)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Title
    ctx.save();
    ctx.shadowColor = '#2A3FE5'; ctx.shadowBlur = 20;
    ctx.fillStyle = '#9CA3AF'; ctx.font = '18px \'Press Start 2P\'';
    ctx.textAlign = 'center';
    ctx.fillText('FILIPINO HEROES', CANVAS_WIDTH / 2, 100);
    ctx.shadowColor = '#FFCC00'; ctx.shadowBlur = 16;
    ctx.fillStyle = '#FFCC00'; ctx.font = '28px \'Press Start 2P\'';
    ctx.fillText('FIGHTER', CANVAS_WIDTH / 2, 150);
    ctx.restore();

    // Divider
    const grad = ctx.createLinearGradient(100, 0, CANVAS_WIDTH - 100, 0);
    grad.addColorStop(0, 'rgba(42,63,229,0)');
    grad.addColorStop(0.5, 'rgba(42,63,229,0.6)');
    grad.addColorStop(1, 'rgba(42,63,229,0)');
    ctx.strokeStyle = grad; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(100, 168); ctx.lineTo(CANVAS_WIDTH - 100, 168); ctx.stroke();

    this._drawRune(ctx, 55, 55);
    this._drawRune(ctx, CANVAS_WIDTH - 55, 55);
    this._drawRune(ctx, 55, CANVAS_HEIGHT - 55);
    this._drawRune(ctx, CANVAS_WIDTH - 55, CANVAS_HEIGHT - 55);
  }

  _drawRune(ctx, cx, cy) {
    ctx.save(); ctx.strokeStyle = 'rgba(42,63,229,0.4)'; ctx.lineWidth = 2;
    ctx.translate(cx, cy);
    ctx.strokeRect(-14, -14, 28, 28); ctx.strokeRect(-8, -8, 16, 16);
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.moveTo(0, -14); ctx.lineTo(0, 14); ctx.stroke();
    ctx.restore();
  }

  _buildUI() {
    const overlay = document.getElementById('ui-overlay');
    const panel = document.createElement('div');
    panel.className = 'ui-panel';
    panel.style.cssText = `
      background: rgba(0,0,0,0.92);
      border: 4px dotted #2A3FE5;
      box-shadow: 0 0 32px rgba(42,63,229,0.3);
      padding: 28px 32px 32px;
      text-align: center;
      font-family: 'Press Start 2P', cursive;
      min-width: 360px;
    `;

    // Tab buttons
    const btnStyle = (active) =>
      `padding:8px 20px;font-family:'Press Start 2P',cursive;font-size:9px;cursor:pointer;` +
      `letter-spacing:1px;text-transform:uppercase;transition:all 0.15s;` +
      `background:${active ? '#2A3FE5' : '#000'};` +
      `color:${active ? '#FFCC00' : '#6B7280'};` +
      `border:4px dotted ${active ? '#5B6FFF' : '#2A3FE5'};` +
      `border-bottom:${active ? '4px dotted #FFCC00' : '4px dotted #2A3FE5'};`;

    panel.innerHTML = `
      <div style="display:flex;gap:4px;margin-bottom:20px;border-bottom:4px dotted #2A3FE5;">
        <button id="tab-login"    style="${btnStyle(true)}">LOGIN</button>
        <button id="tab-register" style="${btnStyle(false)}">REGISTER</button>
      </div>

      <!-- LOGIN FORM -->
      <div id="login-form">
        <div style="margin-bottom:12px;text-align:left;">
          <label style="color:#FFCC00;font-size:8px;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:5px;font-family:'Press Start 2P',cursive;">Username</label>
          <input id="login-user" type="text" placeholder="Enter username" autocomplete="off"
            style="width:100%;padding:10px 12px;font-family:'Press Start 2P',cursive;font-size:9px;background:#000;color:#fff;border:4px dotted #2A3FE5;outline:none;box-sizing:border-box;"
            onfocus="this.style.borderColor='#5B6FFF'" onblur="this.style.borderColor='#2A3FE5'"/>
        </div>
        <div style="margin-bottom:18px;text-align:left;">
          <label style="color:#FFCC00;font-size:8px;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:5px;font-family:'Press Start 2P',cursive;">Password</label>
          <input id="login-pass" type="password" placeholder="Enter password"
            style="width:100%;padding:10px 12px;font-family:'Press Start 2P',cursive;font-size:9px;background:#000;color:#fff;border:4px dotted #2A3FE5;outline:none;box-sizing:border-box;"
            onfocus="this.style.borderColor='#5B6FFF'" onblur="this.style.borderColor='#2A3FE5'"/>
        </div>
        <div id="login-error" style="color:#FF4444;font-size:8px;min-height:18px;margin-bottom:12px;font-family:'Press Start 2P',cursive;"></div>
        <button id="login-btn"
          style="width:100%;padding:13px;font-family:'Press Start 2P',cursive;font-size:10px;
                 background:#2A3FE5;color:#FFCC00;
                 border:4px dotted #5B6FFF;cursor:pointer;letter-spacing:2px;text-transform:uppercase;transition:filter 0.15s;"
          onmouseover="this.style.filter='brightness(1.2)'" onmouseout="this.style.filter='brightness(1)'">
          ⚔ ENTER ARENA ⚔
        </button>
      </div>

      <!-- REGISTER FORM (hidden) -->
      <div id="register-form" style="display:none;">
        <div style="margin-bottom:12px;text-align:left;">
          <label style="color:#FFCC00;font-size:8px;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:5px;font-family:'Press Start 2P',cursive;">Username</label>
          <input id="reg-user" type="text" placeholder="Choose a username" autocomplete="off"
            style="width:100%;padding:10px 12px;font-family:'Press Start 2P',cursive;font-size:9px;background:#000;color:#fff;border:4px dotted #2A3FE5;outline:none;box-sizing:border-box;"
            onfocus="this.style.borderColor='#5B6FFF'" onblur="this.style.borderColor='#2A3FE5'"/>
        </div>
        <div style="margin-bottom:12px;text-align:left;">
          <label style="color:#FFCC00;font-size:8px;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:5px;font-family:'Press Start 2P',cursive;">In-Game Name</label>
          <input id="reg-ingame" type="text" placeholder="Your warrior name (shown in game)"
            style="width:100%;padding:10px 12px;font-family:'Press Start 2P',cursive;font-size:9px;background:#000;color:#fff;border:4px dotted #2A3FE5;outline:none;box-sizing:border-box;"
            onfocus="this.style.borderColor='#5B6FFF'" onblur="this.style.borderColor='#2A3FE5'"/>
        </div>
        <div style="margin-bottom:18px;text-align:left;">
          <label style="color:#FFCC00;font-size:8px;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:5px;font-family:'Press Start 2P',cursive;">Password</label>
          <input id="reg-pass" type="password" placeholder="Choose a password"
            style="width:100%;padding:10px 12px;font-family:'Press Start 2P',cursive;font-size:9px;background:#000;color:#fff;border:4px dotted #2A3FE5;outline:none;box-sizing:border-box;"
            onfocus="this.style.borderColor='#5B6FFF'" onblur="this.style.borderColor='#2A3FE5'"/>
        </div>
        <div id="reg-error" style="color:#FF4444;font-size:8px;min-height:18px;margin-bottom:12px;font-family:'Press Start 2P',cursive;"></div>
        <button id="reg-btn"
          style="width:100%;padding:13px;font-family:'Press Start 2P',cursive;font-size:10px;
                 background:#00CC66;color:#000;
                 border:4px dotted #00FF88;cursor:pointer;letter-spacing:2px;text-transform:uppercase;transition:filter 0.15s;"
          onmouseover="this.style.filter='brightness(1.2)'" onmouseout="this.style.filter='brightness(1)'">
          ⚔ CREATE ACCOUNT ⚔
        </button>
      </div>
    `;

    overlay.appendChild(panel);
    this._panel = panel;

    // Tab switching
    document.getElementById('tab-login').addEventListener('click', () => {
      Audio.playButton();
      document.getElementById('login-form').style.display = 'block';
      document.getElementById('register-form').style.display = 'none';
      document.getElementById('tab-login').style.background = '#2A3FE5';
      document.getElementById('tab-login').style.color = '#FFCC00';
      document.getElementById('tab-login').style.borderColor = '#5B6FFF';
      document.getElementById('tab-register').style.background = '#000';
      document.getElementById('tab-register').style.color = '#6B7280';
      document.getElementById('tab-register').style.borderColor = '#2A3FE5';
    });

    document.getElementById('tab-register').addEventListener('click', () => {
      Audio.playButton();
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('register-form').style.display = 'block';
      document.getElementById('tab-register').style.background = '#2A3FE5';
      document.getElementById('tab-register').style.color = '#FFCC00';
      document.getElementById('tab-register').style.borderColor = '#5B6FFF';
      document.getElementById('tab-login').style.background = '#000';
      document.getElementById('tab-login').style.color = '#6B7280';
      document.getElementById('tab-login').style.borderColor = '#2A3FE5';
    });

    // Login submit
    const doLogin = async () => {
      Audio.playButton();
      const username = document.getElementById('login-user').value.trim();
      const password = document.getElementById('login-pass').value;
      const err = document.getElementById('login-error');

      if (!validateCredentials(username, password)) {
        err.textContent = '⚠ Username and password cannot be empty!'; return;
      }
      err.textContent = 'Logging in...';

      try {
        const data = await GameAPI.login(username, password);
        if (data.error) { err.textContent = '⚠ ' + data.error; return; }

        // Store user data in sessionStorage
        try {
          sessionStorage.setItem('fhf_username',   data.ingamename || data.username);
          sessionStorage.setItem('fhf_rawusername', data.username);
          sessionStorage.setItem('fhf_userdata',   JSON.stringify(data));
        } catch(e) { window._fhf_userdata = data; }

        // Sync local stats with server data (write to per-user key)
        const stats = PlayerStats.get();
        stats.wins.overall  = data.overallwins  || 0;
        stats.wins.easy     = data.easywin      || 0;
        stats.wins.medium   = data.mediumwin    || 0;
        stats.wins.hard     = data.hardwin      || 0;
        stats.losses.overall= data.overalllosses|| 0;
        stats.losses.easy   = data.easyloss     || 0;
        stats.losses.medium = data.mediumloss   || 0;
        stats.losses.hard   = data.hardloss     || 0;
        stats.pvpwins       = data.pvpwins      || 0;
        stats.pvplosses     = data.pvplosses    || 0;
        stats.avatar        = data.avatar       || 'lapu';
        stats.coins         = data.coins        || 0;
        stats.frame         = data.activeframe  || 'none';
        stats.framesOwned   = data.framesowned  || ['none'];
        // Use the per-user key so accounts don't overwrite each other
        const perUserKey = 'fhf_stats_' + data.username.toLowerCase().trim();
        localStorage.setItem(perUserKey, JSON.stringify(stats));

        err.textContent = '';
        this.game.transition(States.HOME);
      } catch(e) {
        err.textContent = '⚠ Server offline. Try again.';
      }
    };

    document.getElementById('login-btn').addEventListener('click', doLogin);
    document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

    // Register submit
    const doRegister = async () => {
      Audio.playButton();
      const username  = document.getElementById('reg-user').value.trim();
      const ingamename= document.getElementById('reg-ingame').value.trim();
      const password  = document.getElementById('reg-pass').value;
      const err = document.getElementById('reg-error');

      if (!username || !password || !ingamename) {
        err.textContent = '⚠ All fields are required!'; return;
      }
      err.textContent = 'Creating account...';

      try {
        const data = await GameAPI.register(username, password, ingamename);
        if (data.error) { err.textContent = '⚠ ' + data.error; return; }

        err.style.color = '#27ae60';
        err.textContent = '✓ Account created! You can now login.';
        // Switch to login tab
        setTimeout(() => {
          document.getElementById('tab-login').click();
          document.getElementById('login-user').value = username;
        }, 1200);
      } catch(e) {
        err.textContent = '⚠ Server offline. Try again.';
      }
    };

    document.getElementById('reg-btn').addEventListener('click', doRegister);
    document.getElementById('reg-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });
  }
}
