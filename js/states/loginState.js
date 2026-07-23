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
    this._ticker = null;
    this._tab = 'login'; // 'login' | 'register'
    this._quoteTimer = null;
  }

  enter() { this._buildUI(); }

  exit() {
    if (this._quoteTimer) { clearInterval(this._quoteTimer); this._quoteTimer = null; }
    if (this._ticker && this._ticker.parentNode) this._ticker.parentNode.removeChild(this._ticker);
    this._ticker = null;
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

    // Wrapper holds ONLY the login panel (centered by overlay flex)
    const wrapper = document.createElement('div');
    wrapper.className = 'ui-panel';
    wrapper.style.cssText = `display: contents;`;

    const panel = document.createElement('div');
    panel.style.cssText = `
      background: rgba(0,0,0,0.92);
      border: 4px solid #2A3FE5;
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
      `border:4px solid ${active ? '#5B6FFF' : '#2A3FE5'};` +
      `border-bottom:${active ? '4px solid #FFCC00' : '4px solid #2A3FE5'};`;

    panel.innerHTML = `
      <div style="display:flex;gap:4px;margin-bottom:20px;border-bottom:4px solid #2A3FE5;">
        <button id="tab-login"    style="${btnStyle(true)}">LOGIN</button>
        <button id="tab-register" style="${btnStyle(false)}">REGISTER</button>
      </div>

      <!-- LOGIN FORM -->
      <div id="login-form">
        <div style="margin-bottom:12px;text-align:left;">
          <label style="color:#FFCC00;font-size:8px;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:5px;font-family:'Press Start 2P',cursive;">Username</label>
          <input id="login-user" type="text" placeholder="Enter username" autocomplete="off"
            style="width:100%;padding:10px 12px;font-family:'Press Start 2P',cursive;font-size:9px;background:#000;color:#fff;border:4px solid #2A3FE5;outline:none;box-sizing:border-box;"
            onfocus="this.style.borderColor='#5B6FFF'" onblur="this.style.borderColor='#2A3FE5'"/>
        </div>
        <div style="margin-bottom:18px;text-align:left;">
          <label style="color:#FFCC00;font-size:8px;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:5px;font-family:'Press Start 2P',cursive;">Password</label>
          <div style="position:relative;display:flex;align-items:center;">
            <input id="login-pass" type="password" placeholder="Enter password"
              style="width:100%;padding:10px 40px 10px 12px;font-family:'Press Start 2P',cursive;font-size:9px;background:#000;color:#fff;border:4px solid #2A3FE5;outline:none;box-sizing:border-box;"
              onfocus="this.style.borderColor='#5B6FFF'" onblur="this.style.borderColor='#2A3FE5'"/>
            <button id="login-pass-toggle" type="button"
              title="Toggle password visibility"
              style="position:absolute;right:8px;background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;color:#6B7280;transition:color 0.15s;"
              onmouseover="this.style.color='#5B6FFF'" onmouseout="this.style.color='#6B7280'">
              <!-- Eye icon (shown when password is hidden) -->
              <svg id="login-icon-show" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <!-- Eye-off icon (shown when password is visible) -->
              <svg id="login-icon-hide" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>
        <div id="login-error" style="color:#FF4444;font-size:8px;min-height:18px;margin-bottom:12px;font-family:'Press Start 2P',cursive;"></div>
        <button id="login-btn"
          style="width:100%;padding:13px;font-family:'Press Start 2P',cursive;font-size:10px;
                 background:#2A3FE5;color:#FFCC00;
                 border:4px solid #5B6FFF;cursor:pointer;letter-spacing:2px;text-transform:uppercase;transition:filter 0.15s;"
          onmouseover="this.style.filter='brightness(1.2)'" onmouseout="this.style.filter='brightness(1)'">
          ⚔ ENTER ARENA ⚔
        </button>
      </div>

      <!-- REGISTER FORM (hidden) -->
      <div id="register-form" style="display:none;">
        <div style="margin-bottom:12px;text-align:left;">
          <label style="color:#FFCC00;font-size:8px;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:5px;font-family:'Press Start 2P',cursive;">Username</label>
          <input id="reg-user" type="text" placeholder="Choose a username" autocomplete="off"
            style="width:100%;padding:10px 12px;font-family:'Press Start 2P',cursive;font-size:9px;background:#000;color:#fff;border:4px solid #2A3FE5;outline:none;box-sizing:border-box;"
            onfocus="this.style.borderColor='#5B6FFF'" onblur="this.style.borderColor='#2A3FE5'"/>
        </div>
        <div style="margin-bottom:12px;text-align:left;">
          <label style="color:#FFCC00;font-size:8px;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:5px;font-family:'Press Start 2P',cursive;">In-Game Name</label>
          <input id="reg-ingame" type="text" placeholder="Your warrior name (shown in game)"
            style="width:100%;padding:10px 12px;font-family:'Press Start 2P',cursive;font-size:9px;background:#000;color:#fff;border:4px solid #2A3FE5;outline:none;box-sizing:border-box;"
            onfocus="this.style.borderColor='#5B6FFF'" onblur="this.style.borderColor='#2A3FE5'"/>
        </div>
        <div style="margin-bottom:18px;text-align:left;">
          <label style="color:#FFCC00;font-size:8px;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:5px;font-family:'Press Start 2P',cursive;">Password</label>
          <div style="position:relative;display:flex;align-items:center;">
            <input id="reg-pass" type="password" placeholder="Choose a password"
              style="width:100%;padding:10px 40px 10px 12px;font-family:'Press Start 2P',cursive;font-size:9px;background:#000;color:#fff;border:4px solid #2A3FE5;outline:none;box-sizing:border-box;"
              onfocus="this.style.borderColor='#5B6FFF'" onblur="this.style.borderColor='#2A3FE5'"/>
            <button id="reg-pass-toggle" type="button"
              title="Toggle password visibility"
              style="position:absolute;right:8px;background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;color:#6B7280;transition:color 0.15s;"
              onmouseover="this.style.color='#5B6FFF'" onmouseout="this.style.color='#6B7280'">
              <!-- Eye icon (shown when password is hidden) -->
              <svg id="reg-icon-show" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <!-- Eye-off icon (shown when password is visible) -->
              <svg id="reg-icon-hide" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>
        <div id="reg-error" style="color:#FF4444;font-size:8px;min-height:18px;margin-bottom:12px;font-family:'Press Start 2P',cursive;"></div>
        <button id="reg-btn"
          style="width:100%;padding:13px;font-family:'Press Start 2P',cursive;font-size:10px;
                 background:#00CC66;color:#000;
                 border:4px solid #00FF88;cursor:pointer;letter-spacing:2px;text-transform:uppercase;transition:filter 0.15s;"
          onmouseover="this.style.filter='brightness(1.2)'" onmouseout="this.style.filter='brightness(1)'">
          ⚔ CREATE ACCOUNT ⚔
        </button>
      </div>
    `;

    wrapper.appendChild(panel);

    // Quote ticker — fixed at bottom of screen, independent of centered panel
    const quotes = [
      '"Ang bayani ay hindi natatakot lumaban." — Lapu-Lapu',
      '"Fight with honor. Win with glory."',
      '"The arena awaits. Choose your hero wisely."',
      '"Every warrior has a story. What\'s yours?"',
      '"From the islands of the Philippines — legends rise."',
      '"Hindi ka mag-iisa sa labanan."',
      '"Master your fighter. Conquer your enemies."',
      '"The blood of heroes runs through your veins."',
    ];

    const ticker = document.createElement('div');
    ticker.id = 'login-quote-ticker';
    ticker.style.cssText = `
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%);
      width: 420px;
      text-align: center;
      pointer-events: none;
      z-index: 20;
    `;

    const quoteEl = document.createElement('p');
    quoteEl.id = 'login-quote-text';
    quoteEl.style.cssText = `
      font-family: 'Press Start 2P', cursive;
      font-size: 7px;
      color: #6B7280;
      line-height: 2;
      margin: 0;
      opacity: 1;
      transition: opacity 0.5s ease;
      letter-spacing: 0.5px;
    `;
    quoteEl.textContent = quotes[0];
    ticker.appendChild(quoteEl);

    // Append panel to overlay (centered), ticker directly to body (bottom)
    overlay.appendChild(panel);
    document.body.appendChild(ticker);
    this._panel = panel;
    this._ticker = ticker;

    // Quote rotation
    let quoteIndex = 0;
    this._quoteTimer = setInterval(() => {
      quoteEl.style.opacity = '0';
      setTimeout(() => {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        quoteEl.textContent = quotes[quoteIndex];
        quoteEl.style.opacity = '1';
      }, 500);
    }, 4000);

    // Password visibility toggles
    document.getElementById('login-pass-toggle').addEventListener('click', () => {
      const input = document.getElementById('login-pass');
      const iconShow = document.getElementById('login-icon-show');
      const iconHide = document.getElementById('login-icon-hide');
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      iconShow.style.display = isHidden ? 'none' : '';
      iconHide.style.display = isHidden ? '' : 'none';
    });

    document.getElementById('reg-pass-toggle').addEventListener('click', () => {
      const input = document.getElementById('reg-pass');
      const iconShow = document.getElementById('reg-icon-show');
      const iconHide = document.getElementById('reg-icon-hide');
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      iconShow.style.display = isHidden ? 'none' : '';
      iconHide.style.display = isHidden ? '' : 'none';
    });

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
