// homeState.js — HOME screen

const _homeBgImg = new Image();
_homeBgImg.src = 'home bg.png';

class HomeState {
  constructor(game) {
    this.game = game;
    this._panel = null;
    this._t = 0;
    this._modal = null;
  }

  enter() {
    this._t = 0;
    let username = null;
    let rawUsername = null;
    try {
      username    = sessionStorage.getItem('fhf_username');
      rawUsername = sessionStorage.getItem('fhf_rawusername');
    } catch (e) {
      username    = window._fhf_username    || null;
      rawUsername = window._fhf_rawusername || null;
    }
    if (!username) { this.game.transition(States.LOGIN); return; }
    this._username    = username;
    this._rawUsername = rawUsername || username;
    this._friendDrawer = new FriendDrawer(this._rawUsername);
    window._currentHomeState = this; // allow friendDrawer to open profile modals

    // Connect PVPClient and wire up incoming invite listener
    if (typeof PVPClient !== 'undefined') {
      PVPClient.connect(this._rawUsername, this.game);
      // Delay listening slightly so socket has time to auth
      setTimeout(() => {
        if (this._friendDrawer) this._friendDrawer.listenForInvites(this.game);
      }, 300);
    }

    this._buildUI();
  }

  exit() {
    window._currentHomeState = null;
    this._closeModal();
    if (this._friendDrawer) {
      this._friendDrawer.stopListeningForInvites();
      this._friendDrawer.destroy();
      this._friendDrawer = null;
    }
    if (this._panel && this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
    this._panel = null;
    const qp = document.getElementById('quest-panel');
    if (qp && qp.parentNode) qp.parentNode.removeChild(qp);
  }

  update(dt) { this._t += dt; }

  render(ctx) {
    if (_homeBgImg.complete && _homeBgImg.naturalWidth > 0) {
      ctx.drawImage(_homeBgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#060a10'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    ctx.fillStyle = 'rgba(6,10,16,0.45)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.save();
    ctx.shadowColor = '#2A3FE5'; ctx.shadowBlur = 20;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9CA3AF'; ctx.font = '14px \'Press Start 2P\'';
    ctx.fillText('FILIPINO HEROES', CANVAS_WIDTH / 2, 160);
    ctx.shadowColor = '#FFCC00'; ctx.shadowBlur = 16;
    ctx.fillStyle = '#FFCC00'; ctx.font = '22px \'Press Start 2P\'';
    ctx.fillText('FIGHTER', CANVAS_WIDTH / 2, 210);
    ctx.restore();
    const a = 0.4 + 0.2 * Math.sin(this._t * 2);
    const g = ctx.createLinearGradient(80, 0, CANVAS_WIDTH - 80, 0);
    g.addColorStop(0, 'rgba(42,63,229,0)');
    g.addColorStop(0.5, 'rgba(42,63,229,' + a + ')');
    g.addColorStop(1, 'rgba(42,63,229,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(80, 226); ctx.lineTo(CANVAS_WIDTH - 80, 226); ctx.stroke();
  }

  _closeModal() {
    if (this._modal && this._modal.parentNode) this._modal.parentNode.removeChild(this._modal);
    this._modal = null;
  }

  _createModal(html) {
    this._closeModal();
    const m = document.createElement('div');
    m.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);display:flex;justify-content:center;align-items:center;z-index:999;pointer-events:all;';
    m.innerHTML = '<div style="background:#000;border:4px solid #2A3FE5;box-shadow:0 0 40px rgba(42,63,229,0.4);padding:24px 28px;min-width:420px;max-width:580px;font-family:\'Press Start 2P\',cursive;position:relative;max-height:80vh;overflow-y:auto;">' +
      '<button id="modal-close" style="position:absolute;top:10px;right:12px;background:none;border:2px solid #2A3FE5;color:#9CA3AF;font-size:10px;cursor:pointer;padding:4px 8px;font-family:\'Press Start 2P\',cursive;">\u2715</button>' +
      html + '</div>';
    document.getElementById('ui-overlay').appendChild(m);
    this._modal = m;
    m.querySelector('#modal-close').addEventListener('click', () => { Audio.playButton(); this._closeModal(); });
    m.addEventListener('click', (e) => { if (e.target === m) { Audio.playButton(); this._closeModal(); } });
    return m;
  }

  _buildUI() {
    const overlay = document.getElementById('ui-overlay');
    const stats = PlayerStats.get();
    const av = PlayerStats.getAvatarById(stats.avatar);
    const wrapper = document.createElement('div');
    wrapper.className = 'ui-panel';
    wrapper.style.cssText = 'width:100%;display:flex;flex-direction:column;align-items:center;justify-content:space-between;height:100%;pointer-events:none;';

    const header = document.createElement('div');
    header.style.cssText = 'width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#000;border-bottom:4px solid #2A3FE5;pointer-events:all;box-sizing:border-box;';

    const profileBtn = document.createElement('div');
    profileBtn.id = 'profile-btn';
    profileBtn.style.cssText = 'display:flex;align-items:center;gap:10px;cursor:pointer;padding:6px 12px;border:1px solid rgba(248,183,0,0.3);background:rgba(8,14,28,0.5);transition:border-color 0.15s;';
    profileBtn.onmouseover = function() { this.style.borderColor = '#F8B700'; };
    profileBtn.onmouseout  = function() { this.style.borderColor = 'rgba(248,183,0,0.3)'; };
    profileBtn.innerHTML = '<div style="position:relative;width:42px;height:42px;flex-shrink:0;">' +
      '<img id="profile-header-img" src="' + av.src + '" style="position:absolute;top:2px;left:2px;width:38px;height:38px;object-fit:cover;object-position:top;z-index:1;"/>' +
      '<canvas id="profile-frame-canvas" width="42" height="42" style="position:absolute;top:0;left:0;z-index:2;pointer-events:none;"></canvas>' +
      '</div>' +
      '<div>' +
        '<div style="color:#FFCC00;font-size:9px;font-family:\'Press Start 2P\',cursive;">' + this._escapeHtml(this._username) + '</div>' +
        '<div id="profile-header-coins" style="color:#9CA3AF;font-size:7px;font-family:\'Press Start 2P\',cursive;margin-top:4px;">🏆 ' + stats.wins.overall + ' wins &nbsp;|&nbsp; <span style="color:#FFCC00;">🪙 ' + (stats.coins || 0) + '</span></div>' +
      '</div>';

    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'color:#F8B700;font-size:14px;font-family:\'Georgia\',serif;letter-spacing:3px;font-weight:bold;opacity:0.7;';
    titleEl.textContent = '';

    const rightBtns = document.createElement('div');
    rightBtns.style.cssText = 'display:flex;gap:10px;align-items:center;';
    const lbBtn = document.createElement('button');
    lbBtn.id = 'leaderboard-btn';
    lbBtn.style.cssText = 'padding:7px 12px;font-family:\'Press Start 2P\',cursive;font-size:8px;background:#000;color:#9CA3AF;border:4px solid #2A3FE5;cursor:pointer;letter-spacing:1px;transition:all 0.15s;';
    lbBtn.onmouseover = function() { this.style.borderColor='#5B6FFF'; this.style.color='#fff'; };
    lbBtn.onmouseout  = function() { this.style.borderColor='#2A3FE5'; this.style.color='#9CA3AF'; };
    lbBtn.textContent = '🏆 RANK';
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'settings-btn';
    settingsBtn.style.cssText = 'padding:7px 12px;font-family:\'Press Start 2P\',cursive;font-size:8px;background:#000;color:#9CA3AF;border:4px solid #1A1A33;cursor:pointer;letter-spacing:1px;transition:all 0.15s;';
    settingsBtn.onmouseover = function() { this.style.borderColor='#FFCC00'; this.style.color='#FFCC00'; };
    settingsBtn.onmouseout  = function() { this.style.borderColor='#1A1A33'; this.style.color='#9CA3AF'; };
    settingsBtn.textContent = '⚙ SET';
    const shopBtn = document.createElement('button');
    shopBtn.id = 'shop-btn';
    shopBtn.style.cssText = 'padding:7px 12px;font-family:\'Press Start 2P\',cursive;font-size:8px;background:#000;color:#FFCC00;border:4px solid #FFCC00;cursor:pointer;letter-spacing:1px;transition:all 0.15s;';
    shopBtn.onmouseover = function() { this.style.borderColor='#fff'; this.style.background='rgba(255,204,0,0.1)'; };
    shopBtn.onmouseout  = function() { this.style.borderColor='#FFCC00'; this.style.background='#000'; };
    shopBtn.textContent = '🛒 SHOP';
    rightBtns.appendChild(shopBtn);
    rightBtns.appendChild(lbBtn);
    rightBtns.appendChild(settingsBtn);
    // Friends toggle button
    const friendsBtn = document.createElement('button');
    friendsBtn.id = 'friends-btn';
    friendsBtn.style.cssText = 'padding:7px 12px;font-family:\'Press Start 2P\',cursive;font-size:8px;background:#000;color:#9CA3AF;border:4px solid #2A3FE5;cursor:pointer;letter-spacing:1px;transition:all 0.15s;';
    friendsBtn.onmouseover = function() { this.style.borderColor='#FFCC00'; this.style.color='#FFCC00'; };
    friendsBtn.onmouseout  = function() { this.style.borderColor='#2A3FE5'; this.style.color='#9CA3AF'; };
    friendsBtn.textContent = '👥 FRIENDS';
    rightBtns.appendChild(friendsBtn);
    header.appendChild(profileBtn); header.appendChild(titleEl); header.appendChild(rightBtns);

    const center = document.createElement('div');
    center.style.cssText = 'background:#000;border:4px solid #2A3FE5;box-shadow:0 0 24px rgba(42,63,229,0.3);padding:28px 40px;text-align:center;font-family:\'Press Start 2P\',cursive;pointer-events:all;min-width:320px;';
    center.innerHTML =
      '<button id="home-start-btn" style="width:100%;padding:14px;font-family:\'Press Start 2P\',cursive;font-size:11px;background:#2A3FE5;color:#FFCC00;border:4px solid #5B6FFF;cursor:pointer;letter-spacing:2px;text-transform:uppercase;transition:filter 0.15s;" onmouseover="this.style.filter=\'brightness(1.2)\'" onmouseout="this.style.filter=\'brightness(1)\'"> VS AI</button>' +
      '<div style="margin-top:10px;color:#1A1A33;font-size:8px;letter-spacing:1px;font-family:\'Press Start 2P\',cursive;">── OR ──</div>' +
      '<button id="home-pvp-btn" style="width:100%;margin-top:10px;padding:14px;font-family:\'Press Start 2P\',cursive;font-size:11px;background:#000;color:#FFCC00;border:4px solid #FFCC00;cursor:pointer;letter-spacing:2px;text-transform:uppercase;transition:filter 0.15s;" onmouseover="this.style.filter=\'brightness(1.2)\'" onmouseout="this.style.filter=\'brightness(1)\'">⚔ PVP</button>';

    // ── Daily Quests panel (left side) ────────────────────
    const questPanel = document.createElement('div');
    questPanel.id = 'quest-panel';
    questPanel.style.cssText = 'position:absolute;left:20px;top:50%;transform:translateY(-50%);width:230px;background:#000;border:4px solid #2A3FE5;box-shadow:0 0 16px rgba(42,63,229,0.25);font-family:\'Press Start 2P\',cursive;pointer-events:all;';
    this._renderQuestPanel(questPanel);

    const spacer = document.createElement('div'); spacer.style.height = '60px';
    wrapper.appendChild(header); wrapper.appendChild(center); wrapper.appendChild(spacer);
    overlay.appendChild(questPanel);
    overlay.appendChild(wrapper);
    this._panel = wrapper;

    center.querySelector('#home-start-btn').addEventListener('click', () => { Audio.playButton(); this.game.transition(States.HERO_SELECT); });
    center.querySelector('#home-pvp-btn').addEventListener('click', () => {
      Audio.playButton();
      if (this._friendDrawer) {
        this._friendDrawer.open();
        // Show a toast hint inside the drawer area
        this._showPVPHint();
      }
    });
    profileBtn.addEventListener('click', () => { Audio.playButton(); this._openProfileModal(); });
    lbBtn.addEventListener('click', () => { Audio.playButton(); this._openLeaderboardModal(); });
    settingsBtn.addEventListener('click', () => { Audio.playButton(); this._openSettingsModal(); });
    shopBtn.addEventListener('click', () => { Audio.playButton(); this._openShopModal(); });
    document.getElementById('friends-btn').addEventListener('click', () => { Audio.playButton(); this._friendDrawer.toggle(); });

    // Animate profile frame in header
    const animateFrame = () => {
      const fc = document.getElementById('profile-frame-canvas');
      if (!fc) return;
      const fCtx = fc.getContext('2d');
      fCtx.clearRect(0, 0, 42, 42);
      const s = PlayerStats.get();
      // Update avatar image in case it changed
      const img = document.getElementById('profile-header-img');
      if (img) img.src = PlayerStats.getAvatarById(s.avatar).src;
      FrameRenderer.drawFrame(fCtx, s.frame || 'none', 0, 0, 42);
      requestAnimationFrame(animateFrame);
    };
    animateFrame();
  }

  _openProfileModal() {
    var self = this;
    var stats = PlayerStats.get();
    const curAv = PlayerStats.getAvatarById(stats.avatar);
    const curFrame = PlayerStats.getFrameById(stats.frame || 'none');

    // Fetch fresh PVP stats from server so they're always up to date
    var rawUsername = '';
    try { rawUsername = sessionStorage.getItem('fhf_rawusername') || ''; } catch(e) {}
    if (rawUsername) {
      GameAPI.getUser(rawUsername).then(function(data) {
        if (data && !data.error) {
          stats.pvpwins   = data.pvpwins   || 0;
          stats.pvplosses = data.pvplosses || 0;
          // Persist back to localStorage
          const perUserKey = 'fhf_stats_' + rawUsername.toLowerCase().trim();
          try { localStorage.setItem(perUserKey, JSON.stringify(stats)); } catch(e) {}
          // Update PVP section in the already-open modal if visible
          var pvpW = stats.pvpwins, pvpL = stats.pvplosses;
          var total = pvpW + pvpL;
          var wr = total > 0 ? Math.round((pvpW/total)*100) : 0;
          var wEl = document.getElementById('profile-pvp-wins');
          var lEl = document.getElementById('profile-pvp-losses');
          var rEl = document.getElementById('profile-pvp-wr');
          if (wEl) wEl.textContent = pvpW;
          if (lEl) lEl.textContent = pvpL;
          if (rEl) rEl.textContent = wr + '%';
        }
      }).catch(function(){});
    }

    const m = this._createModal(
      '<div style="color:#F8B700;font-size:18px;font-weight:bold;margin-bottom:18px;text-align:center;">\u2694 PROFILE</div>' +
      '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:14px;background:rgba(2,79,203,0.1);border:1px solid rgba(58,136,232,0.2);">' +
        // Avatar with animated frame
        '<div style="position:relative;width:72px;height:72px;flex-shrink:0;">' +
          '<img src="' + curAv.src + '" style="position:absolute;top:4px;left:4px;width:64px;height:64px;object-fit:cover;object-position:top;z-index:1;"/>' +
          '<canvas id="profile-modal-frame" width="72" height="72" style="position:absolute;top:0;left:0;z-index:2;pointer-events:none;"></canvas>' +
        '</div>' +
        '<div>' +
          '<div style="color:#F8B700;font-size:16px;font-weight:bold;">' + this._escapeHtml(this._username) + '</div>' +
          '<div style="color:#94A3B8;font-size:12px;margin-top:3px;">Overall Wins: <span style="color:#27ae60;font-weight:bold;">' + stats.wins.overall + '</span></div>' +
          '<div style="color:#94A3B8;font-size:12px;margin-top:2px;">Coins: <span style="color:#F8B700;font-weight:bold;">\uD83E\uDE99 ' + (stats.coins || 0).toLocaleString() + '</span></div>' +
          '<div style="color:#94A3B8;font-size:11px;margin-top:3px;">Active Frame: <span style="color:' + (curFrame.color || '#F8B700') + ';font-weight:bold;">' + curFrame.label + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:20px;">' +
        '<div style="color:#B8D8F8;font-size:11px;letter-spacing:2px;margin-bottom:8px;text-transform:uppercase;">VS AI Statistics</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' +
          [['easy','#27ae60'],['medium','#F0A030'],['hard','#e74c3c']].map(function(p) {
            var s = PlayerStats.get();
            return '<div style="background:rgba(8,14,28,0.6);border:1px solid ' + p[1] + '44;padding:10px;text-align:center;">' +
              '<div style="color:' + p[1] + ';font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">' + p[0] + '</div>' +
              '<div style="color:#27ae60;font-size:18px;font-weight:bold;margin:4px 0;">' + (s.wins[p[0]] || 0) + ' <span style="color:#64748B;font-size:11px;">W</span></div>' +
              '<div style="color:#e74c3c;font-size:10px;">' + (s.losses[p[0]] || 0) + ' losses</div></div>';
          }).join('') +
        '</div>' +
      '</div>' +
      (function() {
        var pvpW = stats.pvpwins || 0;
        var pvpL = stats.pvplosses || 0;
        var total = pvpW + pvpL;
        var wr = total > 0 ? Math.round((pvpW/total)*100) : 0;
        return '<div style="margin-bottom:20px;">' +
          '<div style="color:#B8D8F8;font-size:11px;letter-spacing:2px;margin-bottom:8px;text-transform:uppercase;">⚔ PVP</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">' +
            '<div style="background:rgba(8,14,28,0.6);border:1px solid rgba(248,183,0,0.25);padding:10px;text-align:center;">' +
              '<div style="color:#F8B700;font-size:10px;letter-spacing:2px;font-weight:bold;">WINS</div>' +
              '<div id="profile-pvp-wins" style="color:#27ae60;font-size:18px;font-weight:bold;margin:4px 0;">' + pvpW + '</div></div>' +
            '<div style="background:rgba(8,14,28,0.6);border:1px solid rgba(248,183,0,0.25);padding:10px;text-align:center;">' +
              '<div style="color:#F8B700;font-size:10px;letter-spacing:2px;font-weight:bold;">LOSSES</div>' +
              '<div id="profile-pvp-losses" style="color:#e74c3c;font-size:18px;font-weight:bold;margin:4px 0;">' + pvpL + '</div></div>' +
            '<div style="background:rgba(8,14,28,0.6);border:1px solid rgba(248,183,0,0.25);padding:10px;text-align:center;">' +
              '<div style="color:#F8B700;font-size:10px;letter-spacing:2px;font-weight:bold;">WIN RATE</div>' +
              '<div id="profile-pvp-wr" style="color:#F8B700;font-size:18px;font-weight:bold;margin:4px 0;">' + wr + '%</div></div>' +
          '</div></div>';
      })() +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">' +
        '<button id="change-avatar-btn" style="padding:10px 20px;font-family:\'Georgia\',serif;font-size:12px;font-weight:bold;background:linear-gradient(180deg,#024FCB,#023FA2);color:#F8B700;border:2px solid #3A88E8;cursor:pointer;letter-spacing:2px;">📷 CHANGE AVATAR</button>' +
        '<button id="select-frame-btn" style="padding:10px 20px;font-family:\'Georgia\',serif;font-size:12px;font-weight:bold;background:linear-gradient(180deg,#5a1a8a,#3a0a60);color:#F8B700;border:2px solid rgba(248,183,0,0.5);cursor:pointer;letter-spacing:2px;">🖼 SELECT FRAME</button>' +
      '</div>'
    );

    // Animate the frame in profile modal
    const animProfileModal = () => {
      const fc = document.getElementById('profile-modal-frame');
      if (!fc) return;
      const fCtx = fc.getContext('2d');
      fCtx.clearRect(0, 0, 72, 72);
      FrameRenderer.drawFrame(fCtx, stats.frame || 'none', 0, 0, 72);
      if (m.parentNode) requestAnimationFrame(animProfileModal);
    };
    animProfileModal();

    m.querySelector('#change-avatar-btn').addEventListener('click', () => { Audio.playButton(); this._openAvatarPickerModal(); });
    m.querySelector('#select-frame-btn').addEventListener('click', () => { Audio.playButton(); this._openFramePickerModal(); });
  }

  _openAvatarPickerModal() {
    const stats = PlayerStats.get();
    const gridHtml = PlayerStats.AVATARS.map(function(av) {
      var sel = stats.avatar === av.id;
      return '<div class="av-pick" data-avid="' + av.id + '" style="cursor:pointer;border:3px solid ' + (sel ? '#F8B700' : 'rgba(58,136,232,0.3)') + ';background:rgba(8,14,28,0.6);overflow:hidden;transition:border-color 0.15s;">' +
        '<div style="height:90px;overflow:hidden;"><img src="' + av.src + '" style="width:100%;height:100%;object-fit:cover;object-position:top;"/></div>' +
        '<div style="padding:6px;text-align:center;color:#94A3B8;font-size:10px;">' + av.label + '</div></div>';
    }).join('');
    const m = this._createModal(
      '<div style="color:#F8B700;font-size:18px;font-weight:bold;margin-bottom:16px;text-align:center;">\uD83D\uDC64 CHOOSE AVATAR</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">' + gridHtml + '</div>'
    );
    m.querySelectorAll('.av-pick').forEach((el) => {
      el.addEventListener('click', () => {
        Audio.playButton();
        const id = el.dataset.avid;
        PlayerStats.setAvatar(id);
        try { const u = sessionStorage.getItem('fhf_rawusername'); if (u) GameAPI.setAvatar(u, id).catch(()=>{}); } catch(e) {}
        m.querySelectorAll('.av-pick').forEach(e => { e.style.borderColor = 'rgba(58,136,232,0.3)'; });
        el.style.borderColor = '#F8B700';
        const headerAv = document.querySelector('#profile-btn img');
        if (headerAv) headerAv.src = PlayerStats.getAvatarById(id).src;
      });
    });
  }

  _openFramePickerModal() {
    var self = this;
    var stats = PlayerStats.get();
    var username = '';
    try { username = sessionStorage.getItem('fhf_rawusername') || ''; } catch(e) {}
    var owned = stats.framesOwned || ['none'];

    // Show all owned frames (including 'none' as Default)
    var gridHtml = AVATAR_FRAMES.filter(function(f) {
      return owned.includes(f.id);
    }).map(function(f) {
      var active = stats.frame === f.id || (!stats.frame && f.id === 'none');
      return '<div style="background:rgba(8,14,28,0.7);border:2px solid ' + (active ? '#F8B700' : 'rgba(58,136,232,0.3)') + ';padding:12px;text-align:center;cursor:pointer;transition:border-color 0.15s;" class="fp-pick" data-frame="' + f.id + '">' +
        '<div style="position:relative;width:60px;height:60px;margin:0 auto 8px;background:#0a0e18;">' +
          '<img src="' + PlayerStats.getAvatarById(stats.avatar).src + '" style="position:absolute;top:2px;left:2px;width:56px;height:56px;object-fit:cover;object-position:top;z-index:1;"/>' +
          '<canvas class="fp-frame-canvas" data-frame="' + f.id + '" width="60" height="60" style="position:absolute;top:0;left:0;z-index:2;pointer-events:none;"></canvas>' +
        '</div>' +
        '<div style="color:' + (f.color || '#94A3B8') + ';font-size:11px;font-weight:bold;margin-bottom:4px;">' + f.label + '</div>' +
        (active
          ? '<div style="color:#F8B700;font-size:10px;font-weight:bold;">✓ EQUIPPED</div>'
          : '<div style="color:#64748B;font-size:10px;">Click to equip</div>') +
      '</div>';
    }).join('');

    if (!gridHtml) {
      gridHtml = '<div style="color:#64748B;text-align:center;padding:20px;grid-column:span 3;">You have no frames yet. Visit the Shop to unlock some!</div>';
    }

    var m = this._createModal(
      '<div style="color:#F8B700;font-size:18px;font-weight:bold;margin-bottom:6px;text-align:center;">🖼 SELECT FRAME</div>' +
      '<div style="color:#64748B;font-size:10px;text-align:center;margin-bottom:16px;letter-spacing:1px;">Your owned frames — click one to equip it</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;" id="fp-grid">' + gridHtml + '</div>'
    );

    // Animate previews
    var animFP = function() {
      m.querySelectorAll('.fp-frame-canvas').forEach(function(c) {
        var fCtx = c.getContext('2d');
        fCtx.clearRect(0, 0, 60, 60);
        FrameRenderer.drawFrame(fCtx, c.dataset.frame, 0, 0, 60);
      });
      if (m.parentNode) requestAnimationFrame(animFP);
    };
    animFP();

    // Click to equip
    m.querySelectorAll('.fp-pick').forEach(function(el) {
      el.addEventListener('click', function() {
        Audio.playButton();
        var frameId = el.dataset.frame;
        PlayerStats.setFrame(frameId);
        if (username) GameAPI.setFrame(username, frameId).catch(function(){});
        // Update active borders in-modal
        m.querySelectorAll('.fp-pick').forEach(function(e) {
          e.style.borderColor = 'rgba(58,136,232,0.3)';
          var label = e.querySelector('div:last-child');
          if (label) label.innerHTML = '<div style="color:#64748B;font-size:10px;">Click to equip</div>';
        });
        el.style.borderColor = '#F8B700';
        var label = el.querySelector('div:last-child');
        if (label) label.innerHTML = '<div style="color:#F8B700;font-size:10px;font-weight:bold;">✓ EQUIPPED</div>';
        // Update profile modal active frame label if it's open
        var activeFrameEl = document.querySelector('#profile-frame-active-label');
        if (activeFrameEl) {
          var fr = PlayerStats.getFrameById(frameId);
          activeFrameEl.textContent = fr.label;
          activeFrameEl.style.color = fr.color || '#F8B700';
        }
      });
    });
  }

  _openLeaderboardModal() {
    var self = this;
    var activeTab = 'overall';
    var myUsername = '';
    try { myUsername = sessionStorage.getItem('fhf_rawusername') || ''; } catch(e) {}

    // ── Row click popup: View Profile + Send Friend Request ─
    var showRowPopup = function(anchor, r) {
      var existing = document.getElementById('lb-row-popup');
      if (existing) { existing.remove(); return; }
      var popup = document.createElement('div');
      popup.id = 'lb-row-popup';
      var rect = anchor.getBoundingClientRect();
      popup.style.cssText = 'position:fixed;z-index:3000;background:rgba(10,14,24,0.98);border:1px solid rgba(58,136,232,0.4);box-shadow:0 4px 20px rgba(0,0,0,0.7);font-family:Georgia,serif;min-width:190px;';
      popup.style.top  = Math.min(rect.bottom + 4, window.innerHeight - 100) + 'px';
      popup.style.left = Math.max(4, rect.left - 40) + 'px';
      var viewBtn = document.createElement('button');
      viewBtn.innerHTML = '👤 View Profile';
      viewBtn.style.cssText = 'display:block;width:100%;padding:11px 16px;background:none;border:none;border-bottom:1px solid rgba(58,136,232,0.15);color:#B8D8F8;font-family:Georgia,serif;font-size:12px;text-align:left;cursor:pointer;';
      viewBtn.onmouseover = function(){ viewBtn.style.background='rgba(58,136,232,0.12)'; };
      viewBtn.onmouseout  = function(){ viewBtn.style.background='none'; };
      viewBtn.addEventListener('click', function() { popup.remove(); Audio.playButton(); self._openPlayerProfileModal(r); });
      var isSelf = r.username === myUsername;
      var addBtn = document.createElement('button');
      addBtn.innerHTML = isSelf ? '🚫 That\'s you' : '➕ Send Friend Request';
      addBtn.disabled = isSelf;
      addBtn.style.cssText = 'display:block;width:100%;padding:11px 16px;background:none;border:none;color:' + (isSelf ? '#2a4060' : '#27ae60') + ';font-family:Georgia,serif;font-size:12px;text-align:left;cursor:' + (isSelf ? 'default' : 'pointer') + ';';
      if (!isSelf) {
        addBtn.onmouseover = function(){ addBtn.style.background='rgba(39,174,96,0.12)'; };
        addBtn.onmouseout  = function(){ addBtn.style.background='none'; };
        addBtn.addEventListener('click', async function() {
          popup.remove(); Audio.playButton();
          try {
            var res = await GameAPI.sendFriendRequest(myUsername, r.username);
            var toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;bottom:50px;left:50%;transform:translateX(-50%);background:rgba(8,14,28,0.96);border:1px solid ' + (res.success?'#27ae60':'#e74c3c') + ';color:' + (res.success?'#27ae60':'#e74c3c') + ';padding:10px 22px;font-family:Georgia,serif;font-size:12px;z-index:9999;pointer-events:none;';
            toast.textContent = res.success ? '✓ Request sent to ' + (r.ingamename||r.username) : '⚠ ' + (res.error||'Failed');
            document.body.appendChild(toast);
            setTimeout(function(){ if(toast.parentNode) toast.parentNode.removeChild(toast); }, 3000);
          } catch(e) {}
        });
      }
      popup.appendChild(viewBtn);
      popup.appendChild(addBtn);
      document.body.appendChild(popup);
      var closeDD = function(e) { if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', closeDD); } };
      setTimeout(function(){ document.addEventListener('click', closeDD); }, 0);
    };
    // ── 3-tab layout: Overall | VS AI ▾ | PVP ───────────────
    var tabsHtml =
      '<button class="lb-tab" data-tab="overall" style="padding:7px 12px;font-family:\'Press Start 2P\',cursive;font-size:8px;background:#2A3FE5;color:#FFCC00;border:4px solid #5B6FFF;cursor:pointer;letter-spacing:1px;">OVERALL</button>' +
      '<div style="position:relative;display:inline-block;">' +
        '<button id="vsai-tab-btn" style="padding:7px 12px;font-family:\'Press Start 2P\',cursive;font-size:8px;background:#000;color:#6B7280;border:4px solid #1A1A33;cursor:pointer;letter-spacing:1px;">VS AI ▾</button>' +
        '<div id="vsai-dropdown" style="display:none;position:absolute;top:100%;left:0;z-index:500;background:#000;border:4px solid #2A3FE5;min-width:120px;">' +
          '<button class="vsai-opt" data-tab="easy"   style="display:block;width:100%;padding:9px 14px;background:none;border:none;border-bottom:2px solid #1A1A33;color:#00CC66;font-family:\'Press Start 2P\',cursive;font-size:8px;text-align:left;cursor:pointer;">EASY</button>' +
          '<button class="vsai-opt" data-tab="medium" style="display:block;width:100%;padding:9px 14px;background:none;border:none;border-bottom:2px solid #1A1A33;color:#FFB852;font-family:\'Press Start 2P\',cursive;font-size:8px;text-align:left;cursor:pointer;">MEDIUM</button>' +
          '<button class="vsai-opt" data-tab="hard"   style="display:block;width:100%;padding:9px 14px;background:none;border:none;color:#FF4444;font-family:\'Press Start 2P\',cursive;font-size:8px;text-align:left;cursor:pointer;">HARD</button>' +
        '</div>' +
      '</div>' +
      '<button class="lb-tab" data-tab="pvp" style="padding:7px 12px;font-family:\'Press Start 2P\',cursive;font-size:8px;background:#000;color:#6B7280;border:4px solid #1A1A33;cursor:pointer;letter-spacing:1px;">⚔ PVP</button>';

    var m = this._createModal(
      '<div style="color:#FFCC00;font-size:14px;font-family:\'Press Start 2P\',cursive;margin-bottom:16px;text-align:center;">🏆 LEADERBOARD</div>' +
      '<div id="lb-tabs" style="display:flex;gap:6px;margin-bottom:16px;justify-content:center;align-items:center;flex-wrap:wrap;">' + tabsHtml + '</div>' +
      '<div id="lb-body" style="background:#000;border:4px solid #2A3FE5;padding:14px;min-height:80px;"></div>'
    );

    // ── Shared row builder ──────────────────────────────────
    var buildRow = function(r, i, wins, losses) {
      var rankColor = i===0?'#F8B700':i===1?'#94A3B8':i===2?'#c0824a':'#64748B';
      var av = PlayerStats.getAvatarById(r.avatar||'lapu');
      var frameId = r.activeframe||'none';
      var frameObj = PlayerStats.getFrameById(frameId);
      var el = document.createElement('div');
      el.className = 'lb-row';
      el.style.cssText = 'display:grid;grid-template-columns:36px 1fr 60px 60px 60px;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(58,136,232,0.08);cursor:pointer;transition:background 0.15s;';
      el.onmouseover = function(){ el.style.background='rgba(58,136,232,0.08)'; };
      el.onmouseout  = function(){ el.style.background='transparent'; };
      el.innerHTML =
        '<span style="color:'+rankColor+';font-weight:bold;text-align:center;">'+(i+1)+'</span>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<div style="position:relative;width:32px;height:32px;flex-shrink:0;">' +
            '<img src="'+av.src+'" style="position:absolute;top:2px;left:2px;width:28px;height:28px;object-fit:cover;object-position:top;z-index:1;"/>' +
            '<canvas class="lb-frame-canvas" data-frame="'+frameId+'" width="32" height="32" style="position:absolute;top:0;left:0;z-index:2;pointer-events:none;"></canvas>' +
          '</div>' +
          '<div><div style="color:#fff;font-size:11px;font-weight:bold;">'+self._escapeHtml(r.ingamename||r.username)+'</div>' +
          '<div style="color:'+(frameObj.color||'#64748B')+';font-size:9px;">'+frameObj.label+'</div></div>' +
        '</div>' +
        '<span style="color:#27ae60;font-weight:bold;text-align:center;">'+wins+'</span>' +
        '<span style="color:#e74c3c;font-weight:bold;text-align:center;">'+losses+'</span>' +
        '<span style="color:'+rankColor+';text-align:center;">'+(i===0?'👑':i===1?'🥈':i===2?'🥉':'#'+(i+1))+'</span>';
      el.addEventListener('click', function() {
        Audio.playButton();
        showRowPopup(el, { username:r.username||'', ingamename:r.ingamename||r.username||'', avatar:r.avatar||'lapu', frame:r.activeframe||'none',
          overallwins:r.overallwins||0, easywin:r.easywin||0, mediumwin:r.mediumwin||0, hardwin:r.hardwin||0,
          easyloss:r.easyloss||0, mediumloss:r.mediumloss||0, hardloss:r.hardloss||0, overalllosses:r.overalllosses||0,
          pvpwins:r.pvpwins||0, pvplosses:r.pvplosses||0 });
      });
      return el;
    };
    var animFrames = function(body) {
      var canvases = body ? body.querySelectorAll('.lb-frame-canvas') : [];
      canvases.forEach(function(c){ var fCtx=c.getContext('2d'); fCtx.clearRect(0,0,32,32); FrameRenderer.drawFrame(fCtx,c.dataset.frame||'none',0,0,32); });
      if (canvases.length) requestAnimationFrame(function(){ animFrames(body); });
    };
    var lbHeader = '<div style="display:grid;grid-template-columns:36px 1fr 60px 60px 60px;gap:8px;color:#64748B;font-size:10px;letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(58,136,232,0.15);margin-bottom:8px;">' +
      '<span>#</span><span>PLAYER</span><span style="text-align:center;color:#27ae60;">WINS</span><span style="text-align:center;color:#e74c3c;">LOSS</span><span style="text-align:center;">RANK</span></div>';

    // ── renderPVPLB ──────────────────────────────────────────
    var renderPVPLB = function() {
      var body = document.getElementById('lb-body');
      if (!body) return;
      body.innerHTML = '<div style="color:#64748B;text-align:center;padding:16px;">Loading...</div>';
      GameAPI.getPVPLeaderboard().then(function(rows) {
        if (!rows || rows.error || rows.length === 0) {
          body.innerHTML = lbHeader + '<div style="color:#64748B;text-align:center;padding:16px;">No PVP battles yet.</div>'; return;
        }
        body.innerHTML = lbHeader;
        rows.forEach(function(r, i) { body.appendChild(buildRow(r, i, r.pvpwins||0, r.pvplosses||0)); });
        animFrames(body);
      }).catch(function() {
        body.innerHTML = '<div style="color:#e74c3c;text-align:center;padding:16px;">Could not load PVP leaderboard.</div>';
      });
    };

    // ── renderLB ─────────────────────────────────────────────
    var renderLB = function(tab) {
      if (tab === 'pvp') { renderPVPLB(); return; }
      var body = document.getElementById('lb-body');
      if (!body) return;
      body.innerHTML = '<div style="color:#64748B;text-align:center;padding:16px;">Loading...</div>';
      var winField  = tab === 'overall' ? 'overallwins'   : tab + 'win';
      var lossField = tab === 'overall' ? 'overalllosses' : tab + 'loss';
      GameAPI.getLeaderboard(tab).then(function(rows) {
        if (!rows || rows.error || rows.length === 0) {
          body.innerHTML = lbHeader + '<div style="color:#64748B;text-align:center;padding:16px;">No battles yet. Fight!</div>'; return;
        }
        body.innerHTML = lbHeader;
        rows.forEach(function(r, i) { body.appendChild(buildRow(r, i, r[winField]||0, r[lossField]||0)); });
        animFrames(body);
      }).catch(function() {
        var lb = PlayerStats.getLeaderboard();
        var av = PlayerStats.getAvatarById(lb.avatar);
        body.innerHTML = lbHeader +
          '<div style="color:#F0A030;font-size:10px;text-align:center;margin-bottom:8px;">⚠ Server offline — showing local data</div>' +
          '<div style="display:grid;grid-template-columns:36px 1fr 60px 60px 60px;gap:8px;align-items:center;padding:5px 0;">' +
          '<span style="color:#F8B700;font-weight:bold;text-align:center;">1</span>' +
          '<div style="display:flex;align-items:center;gap:8px;"><img src="' + av.src + '" style="width:28px;height:28px;object-fit:cover;"/>' +
          '<div style="color:#fff;font-size:11px;font-weight:bold;">' + self._escapeHtml(lb.username) + '</div></div>' +
          '<span style="color:#27ae60;font-weight:bold;text-align:center;">' + (lb.wins[tab]||lb.wins.overall||0) + '</span>' +
          '<span style="color:#e74c3c;font-weight:bold;text-align:center;">' + (lb.losses[tab]||lb.losses.overall||0) + '</span>' +
          '<span style="color:#F8B700;text-align:center;">👑</span></div>';
      });
    };

    // ── Wire up tabs ─────────────────────────────────────────
    renderLB('overall');

    m.querySelectorAll('.lb-tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        Audio.playButton();
        activeTab = btn.dataset.tab;
        m.querySelectorAll('.lb-tab').forEach(function(b) {
          var isActive = b.dataset.tab === activeTab;
          b.style.background  = isActive ? '#2A3FE5' : '#000';
          b.style.color       = isActive ? '#FFCC00' : '#6B7280';
          b.style.borderColor = isActive ? '#5B6FFF' : '#1A1A33';
        });
        renderLB(activeTab);
      });
    });

    // VS AI dropdown
    var vsaiBtn = document.getElementById('vsai-tab-btn');
    var vsaiDD  = document.getElementById('vsai-dropdown');
    if (vsaiBtn && vsaiDD) {
      vsaiBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        vsaiDD.style.display = vsaiDD.style.display === 'none' ? 'block' : 'none';
      });
      vsaiDD.querySelectorAll('.vsai-opt').forEach(function(opt) {
        opt.addEventListener('click', function(e) {
          e.stopPropagation();
          Audio.playButton();
          vsaiDD.style.display = 'none';
          activeTab = opt.dataset.tab;
          m.querySelectorAll('.lb-tab').forEach(function(b) {
            b.style.background='#000'; b.style.color='#6B7280'; b.style.borderColor='#1A1A33';
          });
          vsaiBtn.style.background  = '#2A3FE5';
          vsaiBtn.style.color       = '#FFCC00';
          vsaiBtn.style.borderColor = '#5B6FFF';
          vsaiBtn.textContent = 'VS AI · ' + activeTab.toUpperCase() + ' ▾';
          renderLB(activeTab);
        });
      });
      document.addEventListener('click', function(){ if(vsaiDD) vsaiDD.style.display='none'; });
    }
  }

  _openSettingsModal() {
    var self = this;
    var stats = PlayerStats.get();
    var m = this._createModal(
      '<div style="color:#F8B700;font-size:18px;font-weight:bold;margin-bottom:20px;text-align:center;">\u2699 SETTINGS</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:rgba(8,14,28,0.5);border:1px solid rgba(58,136,232,0.15);margin-bottom:10px;">' +
        '<div><div style="color:#fff;font-size:13px;font-weight:bold;">Background Music</div><div style="color:#64748B;font-size:11px;">Epic battle soundtrack</div></div>' +
        '<button id="music-toggle" style="padding:8px 20px;font-family:\'Georgia\',serif;font-size:12px;font-weight:bold;background:' + (stats.musicOn ? 'linear-gradient(180deg,#024FCB,#023FA2)' : 'rgba(14,21,32,0.7)') + ';color:' + (stats.musicOn ? '#F8B700' : '#64748B') + ';border:2px solid ' + (stats.musicOn ? '#3A88E8' : '#1a3060') + ';cursor:pointer;letter-spacing:2px;min-width:80px;">' + (stats.musicOn ? 'ON' : 'OFF') + '</button>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:rgba(8,14,28,0.5);border:1px solid rgba(58,136,232,0.15);margin-bottom:20px;">' +
        '<div><div style="color:#fff;font-size:13px;font-weight:bold;">Sound Effects</div><div style="color:#64748B;font-size:11px;">Hit sounds, skills, buttons</div></div>' +
        '<button id="sfx-toggle" style="padding:8px 20px;font-family:\'Georgia\',serif;font-size:12px;font-weight:bold;background:' + (stats.sfxOn ? 'linear-gradient(180deg,#024FCB,#023FA2)' : 'rgba(14,21,32,0.7)') + ';color:' + (stats.sfxOn ? '#F8B700' : '#64748B') + ';border:2px solid ' + (stats.sfxOn ? '#3A88E8' : '#1a3060') + ';cursor:pointer;letter-spacing:2px;min-width:80px;">' + (stats.sfxOn ? 'ON' : 'OFF') + '</button>' +
      '</div>' +
      '<div style="text-align:center;margin-bottom:10px;"><button id="reset-stats" style="padding:10px 24px;font-family:\'Georgia\',serif;font-size:12px;font-weight:bold;background:rgba(42,10,20,0.7);color:#e74c3c;border:1px solid #e74c3c44;cursor:pointer;letter-spacing:2px;">\uD83D\uDDD1 RESET STATS</button></div>' +
      '<div style="text-align:center;"><button id="logout-btn" style="padding:10px 24px;font-family:\'Georgia\',serif;font-size:12px;font-weight:bold;background:rgba(10,10,10,0.8);color:#94A3B8;border:1px solid rgba(148,163,184,0.3);cursor:pointer;letter-spacing:2px;width:100%;">🚪 LOGOUT</button></div>'
    );
    document.getElementById('music-toggle').addEventListener('click', function() {
      Audio.playButton();
      var s = PlayerStats.get(); var v = !s.musicOn; PlayerStats.setMusic(v);
      this.textContent = v ? 'ON' : 'OFF';
      this.style.background  = v ? 'linear-gradient(180deg,#024FCB,#023FA2)' : 'rgba(14,21,32,0.7)';
      this.style.color       = v ? '#F8B700' : '#64748B';
      this.style.borderColor = v ? '#3A88E8' : '#1a3060';
      if (v) Audio.startBgMusic(); else Audio.stopBgMusic();
    });
    document.getElementById('sfx-toggle').addEventListener('click', function() {
      Audio.playButton();
      var s = PlayerStats.get(); var v = !s.sfxOn; PlayerStats.setSfx(v);
      this.textContent = v ? 'ON' : 'OFF';
      this.style.background  = v ? 'linear-gradient(180deg,#024FCB,#023FA2)' : 'rgba(14,21,32,0.7)';
      this.style.color       = v ? '#F8B700' : '#64748B';
      this.style.borderColor = v ? '#3A88E8' : '#1a3060';
    });
    document.getElementById('reset-stats').addEventListener('click', function() {
      Audio.playButton();
      if (confirm('Reset all win/loss statistics?')) {
        var s = PlayerStats.get();
        s.wins   = { overall:0, easy:0, medium:0, hard:0 };
        s.losses = { overall:0, easy:0, medium:0, hard:0 };
        localStorage.setItem('fhf_stats', JSON.stringify(s));
        self._closeModal();
      }
    });
    document.getElementById('logout-btn').addEventListener('click', function() {
      Audio.playButton();
      // Clear session
      try { sessionStorage.clear(); } catch(e) {}
      // Push login route and transition
      history.pushState({ gameState: 'LOGIN' }, '', '/login');
      self._closeModal();
      self.game.transition(States.HOME); // won't work — need direct state switch
      // Direct logout: clear and reload to login
      setTimeout(function() {
        window.location.href = '/login';
      }, 100);
    });
  }

  _openShopModal() {
    var self = this;
    var stats = PlayerStats.get();
    var username = '';
    try { username = sessionStorage.getItem('fhf_rawusername') || ''; } catch(e) {}

    var framesHtml = AVATAR_FRAMES.filter(f => f.id !== 'none').map(function(f) {
      var owned   = (stats.framesOwned || ['none']).includes(f.id);
      var borderCol = owned ? '#27ae60' : 'rgba(58,136,232,0.3)';

      // Determine button state
      var btnHtml = '';
      if (owned) {
        var active = stats.frame === f.id;
        btnHtml = '<div style="padding:6px 14px;font-family:\'Georgia\',serif;font-size:10px;font-weight:bold;background:rgba(39,174,96,0.15);color:#27ae60;border:1px solid #27ae60;display:inline-block;letter-spacing:1px;">' +
          (active ? '✓ EQUIPPED' : '✓ OWNED') + '</div>';
      } else if (f.unlockReq) {
        // Free unlock frame — check if requirements met
        var reqWins = f.unlockReq.wins;
        var reqDiff = f.unlockReq.diff;
        var curWins = stats.wins[reqDiff] || 0;
        var met     = curWins >= reqWins;
        var reqLabel = reqWins + ' ' + reqDiff[0].toUpperCase() + reqDiff.slice(1) + ' wins';
        btnHtml = '<div style="font-size:9px;color:' + (met ? '#27ae60' : '#64748B') + ';margin-bottom:5px;">' +
                  (met ? '✓ Unlocked!' : curWins + ' / ' + reqWins + ' ' + reqDiff + ' wins') + '</div>' +
                  '<button class="frame-claim-btn" data-frame="' + f.id + '" ' +
                  (met ? '' : 'disabled ') +
                  'style="padding:6px 14px;font-family:\'Georgia\',serif;font-size:10px;font-weight:bold;background:' +
                  (met ? 'linear-gradient(180deg,#027A40,#015C30)' : 'rgba(14,21,32,0.7)') +
                  ';color:' + (met ? '#F8B700' : '#2a4060') + ';border:1px solid ' + (met ? '#27ae60' : '#1a3060') +
                  ';cursor:' + (met ? 'pointer' : 'not-allowed') + ';letter-spacing:1px;">CLAIM</button>';
      } else {
        // Paid frame
        var canAfford = (stats.coins || 0) >= f.cost;
        btnHtml = '<button class="frame-buy-btn" data-frame="' + f.id + '" data-cost="' + f.cost + '" style="padding:6px 14px;font-family:\'Georgia\',serif;font-size:10px;font-weight:bold;background:' + (canAfford ? 'linear-gradient(180deg,#8B4500,#5a2d00)' : 'rgba(14,21,32,0.7)') + ';color:' + (canAfford ? '#F8B700' : '#2a4060') + ';border:1px solid ' + (canAfford ? '#c0a030' : '#1a3060') + ';cursor:' + (canAfford ? 'pointer' : 'not-allowed') + ';letter-spacing:1px;">BUY</button>';
      }

      // Price / requirement label
      var priceHtml = f.unlockReq
        ? '<div style="color:#27ae60;font-size:10px;margin-bottom:6px;">🏆 Win Reward</div>'
        : '<div style="color:#F8B700;font-size:11px;margin-bottom:8px;">🪙 ' + f.cost.toLocaleString() + ' coins</div>';

      return '<div style="background:rgba(8,14,28,0.7);border:2px solid ' + borderCol + ';padding:14px;text-align:center;">' +
        '<div style="position:relative;width:60px;height:60px;margin:0 auto 8px;background:#0a0e18;">' +
          '<img src="' + PlayerStats.getAvatarById(stats.avatar).src + '" style="position:absolute;top:2px;left:2px;width:56px;height:56px;object-fit:cover;object-position:top;z-index:1;"/>' +
          '<canvas class="frame-preview-canvas" data-frame="' + f.id + '" width="60" height="60" style="position:absolute;top:0;left:0;z-index:2;pointer-events:none;"></canvas>' +
        '</div>' +
        '<div style="color:' + (f.color || '#F8B700') + ';font-size:12px;font-weight:bold;margin-bottom:3px;">' + f.label + '</div>' +
        '<div style="color:#94A3B8;font-size:10px;margin-bottom:6px;">' + f.description + '</div>' +
        priceHtml + btnHtml +
      '</div>';
    }).join('');

    var m = this._createModal(
      '<div style="color:#F8B700;font-size:18px;font-weight:bold;margin-bottom:6px;text-align:center;">🛒 AVATAR FRAME SHOP</div>' +
      '<div style="color:#94A3B8;font-size:11px;text-align:center;margin-bottom:4px;">Your coins: <span style="color:#F8B700;font-weight:bold;">🪙 ' + (stats.coins || 0).toLocaleString() + '</span></div>' +
      '<div style="color:#64748B;font-size:10px;text-align:center;margin-bottom:14px;letter-spacing:1px;">🏆 Win rewards are FREE — earn them by winning battles!</div>' +
      '<div id="shop-error" style="color:#e74c3c;font-size:11px;text-align:center;min-height:16px;margin-bottom:8px;"></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">' + framesHtml + '</div>'
    );

    // Animate frame previews
    var animPreviews = function() {
      m.querySelectorAll('.frame-preview-canvas').forEach(function(c) {
        var fCtx = c.getContext('2d');
        fCtx.clearRect(0,0,60,60);
        FrameRenderer.drawFrame(fCtx, c.dataset.frame, 0, 0, 60);
      });
      if (m.parentNode) requestAnimationFrame(animPreviews);
    };
    animPreviews();

    // Buy buttons
    m.querySelectorAll('.frame-buy-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (btn.style.cursor === 'not-allowed') return;
        Audio.playButton();
        var frameId = btn.dataset.frame;
        var result = PlayerStats.buyFrame(frameId);
        if (!result.success) {
          document.getElementById('shop-error').textContent = '\u26A0 ' + result.error; return;
        }
        // Sync to server
        if (username) GameAPI.buyFrame(username, frameId).catch(function(){});
        // Refresh modal
        self._closeModal();
        self._openShopModal();
        // Update header coins
        var coinEl = document.querySelector('#profile-btn div div:last-child');
        if (coinEl) {
          var s2 = PlayerStats.get();
          coinEl.innerHTML = '\uD83C\uDFC6 ' + s2.wins.overall + ' wins &nbsp;|&nbsp; <span style="color:#F8B700;">\uD83E\uDE99 ' + (s2.coins||0) + '</span>';
        }
      });
    });

    // Claim unlock buttons (free win-reward frames)
    m.querySelectorAll('.frame-claim-btn').forEach(function(btn) {
      if (btn.disabled) return;
      btn.addEventListener('click', function() {
        Audio.playButton();
        var frameId = btn.dataset.frame;
        var result = PlayerStats.claimUnlockFrame(frameId);
        if (!result.success) {
          document.getElementById('shop-error').textContent = '⚠ ' + result.error; return;
        }
        // Sync to server — reuse buyframe endpoint with cost=0
        if (username) GameAPI.buyFrame(username, frameId).catch(function(){});
        self._closeModal();
        self._openShopModal();
      });
    });

    // Equip buttons removed from shop — use Profile > Select Frame to equip
  }

  _openPlayerProfileModal(r) {
    var self = this;
    var av = PlayerStats.getAvatarById(r.avatar || 'lapu');
    var frameObj = PlayerStats.getFrameById(r.frame || 'none');
    var m = this._createModal(
      '<div style="color:#F8B700;font-size:18px;font-weight:bold;margin-bottom:18px;text-align:center;">⚔ PLAYER PROFILE</div>' +
      '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:14px;background:rgba(2,79,203,0.1);border:1px solid rgba(58,136,232,0.2);">' +
        '<div style="position:relative;width:72px;height:72px;flex-shrink:0;">' +
          '<img src="' + av.src + '" style="position:absolute;top:4px;left:4px;width:64px;height:64px;object-fit:cover;object-position:top;z-index:1;"/>' +
          '<canvas id="player-profile-frame" width="72" height="72" style="position:absolute;top:0;left:0;z-index:2;pointer-events:none;"></canvas>' +
        '</div>' +
        '<div>' +
          '<div style="color:#F8B700;font-size:16px;font-weight:bold;">' + this._escapeHtml(r.ingamename || r.username) + '</div>' +
          '<div style="color:#64748B;font-size:11px;margin-top:2px;">@' + this._escapeHtml(r.username) + '</div>' +
          '<div style="color:#94A3B8;font-size:12px;margin-top:4px;">Overall Wins: <span style="color:#27ae60;font-weight:bold;">' + (r.overallwins||0) + '</span> &nbsp;|&nbsp; Losses: <span style="color:#e74c3c;font-weight:bold;">' + (r.overalllosses||0) + '</span></div>' +
          '<div style="color:' + (frameObj.color||'#64748B') + ';font-size:11px;margin-top:2px;">' + frameObj.label + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:16px;">' +
        '<div style="color:#B8D8F8;font-size:11px;letter-spacing:2px;margin-bottom:8px;text-transform:uppercase;">VS AI Statistics</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' +
          [['Easy','#27ae60', r.easywin, r.easyloss],['Medium','#F0A030', r.mediumwin, r.mediumloss],['Hard','#e74c3c', r.hardwin, r.hardloss]].map(function(p) {
            return '<div style="background:rgba(8,14,28,0.6);border:1px solid ' + p[1] + '44;padding:10px;text-align:center;">' +
              '<div style="color:' + p[1] + ';font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">' + p[0] + '</div>' +
              '<div style="color:#27ae60;font-size:18px;font-weight:bold;margin:4px 0;">' + (p[2]||0) + '</div>' +
              '<div style="color:#e74c3c;font-size:11px;">' + (p[3]||0) + ' losses</div></div>';
          }).join('') +
        '</div>' +
      '</div>' +
      (function() {
        var pvpW = r.pvpwins || 0;
        var pvpL = r.pvplosses || 0;
        var total = pvpW + pvpL;
        var wr = total > 0 ? Math.round((pvpW/total)*100) : 0;
        return '<div style="margin-bottom:16px;">' +
          '<div style="color:#B8D8F8;font-size:11px;letter-spacing:2px;margin-bottom:8px;text-transform:uppercase;">⚔ PVP</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">' +
            '<div style="background:rgba(8,14,28,0.6);border:1px solid rgba(248,183,0,0.25);padding:10px;text-align:center;">' +
              '<div style="color:#F8B700;font-size:10px;letter-spacing:2px;font-weight:bold;">WINS</div>' +
              '<div style="color:#27ae60;font-size:18px;font-weight:bold;margin:4px 0;">' + pvpW + '</div></div>' +
            '<div style="background:rgba(8,14,28,0.6);border:1px solid rgba(248,183,0,0.25);padding:10px;text-align:center;">' +
              '<div style="color:#F8B700;font-size:10px;letter-spacing:2px;font-weight:bold;">LOSSES</div>' +
              '<div style="color:#e74c3c;font-size:18px;font-weight:bold;margin:4px 0;">' + pvpL + '</div></div>' +
            '<div style="background:rgba(8,14,28,0.6);border:1px solid rgba(248,183,0,0.25);padding:10px;text-align:center;">' +
              '<div style="color:#F8B700;font-size:10px;letter-spacing:2px;font-weight:bold;">WIN RATE</div>' +
              '<div style="color:#F8B700;font-size:18px;font-weight:bold;margin:4px 0;">' + wr + '%</div></div>' +
          '</div></div>';
      })()
    );
    // Animate frame
    var animPP = function() {
      var fc = document.getElementById('player-profile-frame');
      if (!fc) return;
      var fCtx = fc.getContext('2d');
      fCtx.clearRect(0,0,72,72);
      FrameRenderer.drawFrame(fCtx, r.frame||'none', 0, 0, 72);
      if (m.parentNode) requestAnimationFrame(animPP);
    };
    animPP();
  }

  _renderQuestPanel(panel) {
    const q = PlayerStats.getQuests();
    const defs = PlayerStats.QUEST_DEFS;
    const now = Date.now();
    const msLeft = Math.max(0, q.resetAt - now);
    const hLeft  = Math.floor(msLeft / 3600000);
    const mLeft  = Math.floor((msLeft % 3600000) / 60000);
    const resetStr = hLeft + 'h ' + mLeft + 'm';

    let html = '<div style="padding:10px 12px;border-bottom:4px solid #2A3FE5;display:flex;align-items:center;justify-content:space-between;">' +
      '<span style="color:#FFCC00;font-size:8px;font-family:\'Press Start 2P\',cursive;">📋 DAILY</span>' +
      '<span style="color:#6B7280;font-size:7px;font-family:\'Press Start 2P\',cursive;">' + resetStr + '</span>' +
      '</div>';

    defs.forEach(function(def) {
      const s = q.quests[def.id];
      const progress = Math.min(s.progress || 0, def.target);
      const done = progress >= def.target;
      const claimed = s.claimed;
      const pct = Math.round((progress / def.target) * 100);
      const diffColor = def.diff === 'easy' ? '#27ae60' : def.diff === 'medium' ? '#F0A030' : '#e74c3c';

      html += '<div style="padding:10px 12px;border-bottom:4px solid #1A1A33;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">' +
          '<span style="color:' + (claimed ? '#444466' : '#fff') + ';font-size:7px;font-family:\'Press Start 2P\',cursive;' + (claimed ? 'text-decoration:line-through;' : '') + '">' + def.label + '</span>' +
          '<span style="color:#FFCC00;font-size:7px;font-family:\'Press Start 2P\',cursive;">🪙 ' + def.reward.toLocaleString() + '</span>' +
        '</div>' +
        '<div style="background:#1A1A33;height:6px;margin-bottom:5px;overflow:hidden;border:2px solid ' + (claimed ? '#444466' : diffColor) + ';">' +
          '<div style="width:' + (claimed ? 100 : pct) + '%;height:100%;background:' + (claimed ? '#444466' : done ? diffColor : diffColor + '88') + ';transition:width 0.3s;"></div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<span style="color:#6B7280;font-size:7px;font-family:\'Press Start 2P\',cursive;">' + (claimed ? 'DONE ✓' : progress + '/' + def.target) + '</span>' +
          (done && !claimed
            ? '<button class="quest-claim-btn" data-questid="' + def.id + '" style="padding:4px 10px;font-family:\'Press Start 2P\',cursive;font-size:7px;background:#00CC66;color:#000;border:4px solid #00FF88;cursor:pointer;letter-spacing:1px;">CLAIM</button>'
            : '') +
        '</div>' +
      '</div>';
    });

    panel.innerHTML = html;

    // Wire claim buttons
    var self = this;
    panel.querySelectorAll('.quest-claim-btn').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        Audio.playButton();
        btn.disabled = true;
        btn.textContent = '...';
        const questId = btn.dataset.questid;
        const result = PlayerStats.claimQuest(questId);
        if (!result.success) { btn.disabled = false; btn.textContent = 'CLAIM'; return; }

        try {
          const rawUser = sessionStorage.getItem('fhf_rawusername');
          if (rawUser) {
            const res = await GameAPI.claimQuestCoins(rawUser, result.coinsEarned);
            if (res && res.success) {
              // Re-fetch user from server to get accurate coin balance
              const userData = await GameAPI.getUser(rawUser);
              if (userData && !userData.error) {
                const s = PlayerStats.get();
                s.coins = userData.coins || 0;
                localStorage.setItem('fhf_stats', JSON.stringify(s));
              }
            }
          }
        } catch(e) {
          // Server offline — add locally as fallback
          const s = PlayerStats.get();
          s.coins = (s.coins || 0) + result.coinsEarned;
          localStorage.setItem('fhf_stats', JSON.stringify(s));
        }

        // Refresh the panel and header
        self._renderQuestPanel(panel);
        const s2 = PlayerStats.get();
        const coinEl = document.getElementById('profile-header-coins');
        if (coinEl) coinEl.innerHTML = '🏆 ' + s2.wins.overall + ' wins &nbsp;|&nbsp; <span style="color:#F8B700;">🪙 ' + (s2.coins||0) + '</span>';
      });
    });
  }

  _showPVPHint() {
    // Remove any existing hint
    const existing = document.getElementById('pvp-hint-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'pvp-hint-toast';
    toast.style.cssText = [
      'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);',
      'background:linear-gradient(180deg,rgba(107,26,107,0.97),rgba(74,14,74,0.97));',
      'border:1px solid rgba(248,183,0,0.5);',
      'box-shadow:0 4px 24px rgba(248,183,0,0.2);',
      'color:#F8B700;font-family:Georgia,serif;font-size:13px;',
      'padding:12px 24px;letter-spacing:1px;',
      'z-index:1200;pointer-events:none;',
      'animation:pvp-toast-in 0.3s ease;',
    ].join('');
    toast.innerHTML = '⚔ Challenge a friend — click <b style="color:#fff;">⚔</b> next to their name!';

    // Inject keyframe if not already there
    if (!document.getElementById('pvp-toast-style')) {
      const s = document.createElement('style');
      s.id = 'pvp-toast-style';
      s.textContent = '@keyframes pvp-toast-in{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
      document.head.appendChild(s);
    }

    document.body.appendChild(toast);
    // Auto-dismiss after 4s
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 4000);
  }

  _escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
}
