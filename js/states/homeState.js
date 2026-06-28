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
    this._buildUI();
  }

  exit() {
    this._closeModal();
    if (this._friendDrawer) { this._friendDrawer.destroy(); this._friendDrawer = null; }
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
    ctx.shadowColor = '#024FCB'; ctx.shadowBlur = 30;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F8B700'; ctx.font = 'bold 38px serif';
    ctx.fillText('FILIPINO HEROES', CANVAS_WIDTH / 2, 160);
    ctx.shadowColor = '#F8B700'; ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 52px serif';
    ctx.fillText('FIGHTER', CANVAS_WIDTH / 2, 220);
    ctx.restore();
    const a = 0.4 + 0.2 * Math.sin(this._t * 2);
    const g = ctx.createLinearGradient(80, 0, CANVAS_WIDTH - 80, 0);
    g.addColorStop(0, 'rgba(248,183,0,0)');
    g.addColorStop(0.5, 'rgba(248,183,0,' + a + ')');
    g.addColorStop(1, 'rgba(248,183,0,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80, 234); ctx.lineTo(CANVAS_WIDTH - 80, 234); ctx.stroke();
  }

  _closeModal() {
    if (this._modal && this._modal.parentNode) this._modal.parentNode.removeChild(this._modal);
    this._modal = null;
  }

  _createModal(html) {
    this._closeModal();
    const m = document.createElement('div');
    m.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:999;pointer-events:all;';
    m.innerHTML = '<div style="background:linear-gradient(180deg,#141e30,#0a0e18);border:2px solid rgba(58,136,232,0.4);box-shadow:0 0 60px rgba(2,79,203,0.3);padding:28px 32px;min-width:420px;max-width:580px;font-family:\'Georgia\',serif;position:relative;max-height:80vh;overflow-y:auto;">' +
      '<button id="modal-close" style="position:absolute;top:10px;right:14px;background:none;border:none;color:#94A3B8;font-size:20px;cursor:pointer;">\u2715</button>' +
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
    header.style.cssText = 'width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:rgba(6,10,22,0.55);border-bottom:1px solid rgba(184,216,248,0.15);pointer-events:all;box-sizing:border-box;';

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
        '<div style="color:#F8B700;font-size:13px;font-weight:bold;font-family:\'Georgia\',serif;">' + this._escapeHtml(this._username) + '</div>' +
        '<div id="profile-header-coins" style="color:#94A3B8;font-size:10px;font-family:monospace;">\uD83C\uDFC6 ' + stats.wins.overall + ' wins &nbsp;|&nbsp; <span style="color:#F8B700;">\uD83E\uDE99 ' + (stats.coins || 0) + '</span></div>' +
      '</div>';

    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'color:#F8B700;font-size:14px;font-family:\'Georgia\',serif;letter-spacing:3px;font-weight:bold;opacity:0.7;';
    titleEl.textContent = '';

    const rightBtns = document.createElement('div');
    rightBtns.style.cssText = 'display:flex;gap:10px;align-items:center;';
    const lbBtn = document.createElement('button');
    lbBtn.id = 'leaderboard-btn';
    lbBtn.style.cssText = 'padding:8px 16px;font-family:\'Georgia\',serif;font-size:12px;font-weight:bold;background:rgba(8,14,28,0.6);color:#B8D8F8;border:1px solid rgba(58,136,232,0.4);cursor:pointer;letter-spacing:2px;transition:all 0.15s;';
    lbBtn.onmouseover = function() { this.style.borderColor='#3A88E8'; this.style.color='#fff'; };
    lbBtn.onmouseout  = function() { this.style.borderColor='rgba(58,136,232,0.4)'; this.style.color='#B8D8F8'; };
    lbBtn.textContent = '\uD83C\uDFC6 LEADERBOARD';
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'settings-btn';
    settingsBtn.style.cssText = 'padding:8px 14px;font-family:\'Georgia\',serif;font-size:12px;font-weight:bold;background:rgba(8,14,28,0.6);color:#94A3B8;border:1px solid rgba(184,216,248,0.2);cursor:pointer;letter-spacing:2px;transition:all 0.15s;';
    settingsBtn.onmouseover = function() { this.style.borderColor='#F8B700'; this.style.color='#F8B700'; };
    settingsBtn.onmouseout  = function() { this.style.borderColor='rgba(184,216,248,0.2)'; this.style.color='#94A3B8'; };
    settingsBtn.textContent = '\u2699 SETTINGS';
    const shopBtn = document.createElement('button');
    shopBtn.id = 'shop-btn';
    shopBtn.style.cssText = 'padding:8px 14px;font-family:\'Georgia\',serif;font-size:12px;font-weight:bold;background:rgba(8,14,28,0.6);color:#F8B700;border:1px solid rgba(248,183,0,0.4);cursor:pointer;letter-spacing:2px;transition:all 0.15s;';
    shopBtn.onmouseover = function() { this.style.borderColor='#F8B700'; this.style.background='rgba(248,183,0,0.1)'; };
    shopBtn.onmouseout  = function() { this.style.borderColor='rgba(248,183,0,0.4)'; this.style.background='rgba(8,14,28,0.6)'; };
    shopBtn.textContent = '\uD83D\uDED2 SHOP';
    rightBtns.appendChild(shopBtn);
    rightBtns.appendChild(lbBtn);
    rightBtns.appendChild(settingsBtn);
    // Friends toggle button
    const friendsBtn = document.createElement('button');
    friendsBtn.id = 'friends-btn';
    friendsBtn.style.cssText = 'padding:8px 14px;font-family:\'Georgia\',serif;font-size:12px;font-weight:bold;background:rgba(8,14,28,0.6);color:#B8D8F8;border:1px solid rgba(58,136,232,0.4);cursor:pointer;letter-spacing:2px;transition:all 0.15s;';
    friendsBtn.onmouseover = function() { this.style.borderColor='#F8B700'; this.style.color='#F8B700'; };
    friendsBtn.onmouseout  = function() { this.style.borderColor='rgba(58,136,232,0.4)'; this.style.color='#B8D8F8'; };
    friendsBtn.textContent = '👥 FRIENDS';
    rightBtns.appendChild(friendsBtn);
    header.appendChild(profileBtn); header.appendChild(titleEl); header.appendChild(rightBtns);

    const center = document.createElement('div');
    center.style.cssText = 'background:rgba(8,14,28,0.15);border:1px solid rgba(184,216,248,0.25);box-shadow:0 8px 40px rgba(2,79,203,0.15);padding:28px 48px;text-align:center;font-family:\'Georgia\',serif;pointer-events:all;min-width:320px;';
    center.innerHTML = '<button id="home-start-btn" style="width:100%;padding:14px;font-family:\'Georgia\',serif;font-size:16px;font-weight:bold;background:linear-gradient(180deg,#024FCB,#023FA2);color:#F8B700;border:2px solid #3A88E8;cursor:pointer;letter-spacing:3px;text-transform:uppercase;transition:filter 0.15s;"' +
      ' onmouseover="this.style.filter=\'brightness(1.2)\'" onmouseout="this.style.filter=\'brightness(1)\'">\u2694 START BATTLE \u2694</button>';

    // ── Daily Quests panel (left side) ────────────────────
    const questPanel = document.createElement('div');
    questPanel.id = 'quest-panel';
    questPanel.style.cssText = 'position:absolute;left:20px;top:50%;transform:translateY(-50%);width:220px;background:rgba(8,14,28,0.88);border:1px solid rgba(248,183,0,0.25);box-shadow:0 4px 24px rgba(2,79,203,0.15);font-family:\'Georgia\',serif;pointer-events:all;';
    this._renderQuestPanel(questPanel);

    const spacer = document.createElement('div'); spacer.style.height = '60px';
    wrapper.appendChild(header); wrapper.appendChild(center); wrapper.appendChild(spacer);
    overlay.appendChild(questPanel);
    overlay.appendChild(wrapper);
    this._panel = wrapper;

    center.querySelector('#home-start-btn').addEventListener('click', () => { Audio.playButton(); this.game.transition(States.HERO_SELECT); });
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
    const stats = PlayerStats.get();
    const curAv = PlayerStats.getAvatarById(stats.avatar);
    const curFrame = PlayerStats.getFrameById(stats.frame || 'none');

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
        '<div style="color:#B8D8F8;font-size:11px;letter-spacing:2px;margin-bottom:8px;text-transform:uppercase;">Win Statistics</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' +
          [['easy','#27ae60'],['medium','#F0A030'],['hard','#e74c3c']].map(function(p) {
            var s = PlayerStats.get();
            return '<div style="background:rgba(8,14,28,0.6);border:1px solid ' + p[1] + '44;padding:10px;text-align:center;">' +
              '<div style="color:' + p[1] + ';font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">' + p[0] + '</div>' +
              '<div style="color:#fff;font-size:22px;font-weight:bold;margin:4px 0;">' + (s.wins[p[0]] || 0) + '</div>' +
              '<div style="color:#64748B;font-size:9px;">wins / ' + (s.losses[p[0]] || 0) + ' losses</div></div>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div style="text-align:center;"><button id="change-avatar-btn" style="padding:10px 28px;font-family:\'Georgia\',serif;font-size:12px;font-weight:bold;background:linear-gradient(180deg,#024FCB,#023FA2);color:#F8B700;border:2px solid #3A88E8;cursor:pointer;letter-spacing:2px;">\uD83D\uDCF7 CHANGE AVATAR</button></div>'
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

  _openLeaderboardModal() {
    var self = this;
    var activeTab = 'overall';
    var tabsHtml = ['overall','easy','medium','hard'].map(function(t) {
      var isActive = t === 'overall';
      return '<button class="lb-tab" data-tab="' + t + '" style="padding:7px 14px;font-family:\'Georgia\',serif;font-size:11px;font-weight:bold;' +
        'background:' + (isActive ? 'linear-gradient(180deg,#024FCB,#023FA2)' : 'rgba(14,21,32,0.7)') + ';' +
        'color:' + (isActive ? '#F8B700' : '#64748B') + ';' +
        'border:1px solid ' + (isActive ? '#3A88E8' : '#1a3060') + ';cursor:pointer;letter-spacing:1px;text-transform:uppercase;transition:all 0.15s;">' +
        t.toUpperCase() + '</button>';
    }).join('');
    var m = this._createModal(
      '<div style="color:#F8B700;font-size:18px;font-weight:bold;margin-bottom:16px;text-align:center;">\uD83C\uDFC6 LEADERBOARD</div>' +
      '<div id="lb-tabs" style="display:flex;gap:6px;margin-bottom:16px;justify-content:center;">' + tabsHtml + '</div>' +
      '<div id="lb-body" style="background:rgba(8,14,28,0.6);border:1px solid rgba(58,136,232,0.2);padding:14px;min-height:80px;"></div>'
    );
    var renderLB = function(tab) {
      var body = document.getElementById('lb-body');
      if (!body) return;
      body.innerHTML = '<div style="color:#64748B;text-align:center;padding:16px;">Loading...</div>';
      var header = '<div style="display:grid;grid-template-columns:36px 1fr 70px 70px;gap:8px;color:#64748B;font-size:10px;letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(58,136,232,0.15);margin-bottom:8px;">' +
        '<span>#</span><span>PLAYER</span><span style="text-align:center;">WINS</span><span style="text-align:center;">RANK</span></div>';
      GameAPI.getLeaderboard(tab).then(function(rows) {
        if (!rows || rows.error || rows.length === 0) {
          body.innerHTML = header + '<div style="color:#64748B;text-align:center;padding:16px;">No battles yet. Fight!</div>'; return;
        }
        var winField = tab === 'overall' ? 'overallwins' : tab + 'win';
        var rowsHtml = rows.map(function(r, i) {
          var wins = r[winField] || 0;
          var rankColor = i === 0 ? '#F8B700' : i === 1 ? '#94A3B8' : i === 2 ? '#c0824a' : '#64748B';
          var av = PlayerStats.getAvatarById(r.avatar || 'lapu');
          var frameId = r.activeframe || 'none';
          var frameObj = PlayerStats.getFrameById(frameId);
          return '<div class="lb-row" data-username="' + (r.username||'') + '" data-ingamename="' + (r.ingamename||r.username||'') + '" data-avatar="' + (r.avatar||'lapu') + '" data-frame="' + frameId + '" data-overallwins="' + (r.overallwins||0) + '" data-easywin="' + (r.easywin||0) + '" data-mediumwin="' + (r.mediumwin||0) + '" data-hardwin="' + (r.hardwin||0) + '" style="display:grid;grid-template-columns:36px 1fr 70px 70px;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid rgba(58,136,232,0.08);cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background=\'rgba(58,136,232,0.08)\'" onmouseout="this.style.background=\'transparent\'">' +
            '<span style="color:' + rankColor + ';font-weight:bold;text-align:center;">' + (i+1) + '</span>' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<div style="position:relative;width:32px;height:32px;flex-shrink:0;">' +
                '<img src="' + av.src + '" style="position:absolute;top:2px;left:2px;width:28px;height:28px;object-fit:cover;object-position:top;z-index:1;"/>' +
                '<canvas class="lb-frame-canvas" data-frame="' + frameId + '" width="32" height="32" style="position:absolute;top:0;left:0;z-index:2;pointer-events:none;"></canvas>' +
              '</div>' +
              '<div>' +
                '<div style="color:#fff;font-size:11px;font-weight:bold;">' + (r.ingamename || r.username) + '</div>' +
                '<div style="color:' + (frameObj.color || '#64748B') + ';font-size:9px;">' + frameObj.label + '</div>' +
              '</div>' +
            '</div>' +
            '<span style="color:#27ae60;font-weight:bold;text-align:center;">' + wins + '</span>' +
            '<span style="color:' + rankColor + ';text-align:center;">' + (i===0?'👑':i===1?'🥈':i===2?'🥉':'#'+(i+1)) + '</span>' +
          '</div>';
        }).join('');
        body.innerHTML = header + rowsHtml;
        // Row click → show player profile
        body.querySelectorAll('.lb-row').forEach(function(row) {
          row.addEventListener('click', function() {
            Audio.playButton();
            self._openPlayerProfileModal({
              username:   row.dataset.username,
              ingamename: row.dataset.ingamename,
              avatar:     row.dataset.avatar,
              frame:      row.dataset.frame,
              overallwins: parseInt(row.dataset.overallwins)||0,
              easywin:    parseInt(row.dataset.easywin)||0,
              mediumwin:  parseInt(row.dataset.mediumwin)||0,
              hardwin:    parseInt(row.dataset.hardwin)||0,
            });
          });
        });
        // Animate frames on leaderboard avatars
        var animLB = function() {
          var canvases = body.querySelectorAll('.lb-frame-canvas');
          canvases.forEach(function(c) {
            var fCtx = c.getContext('2d');
            fCtx.clearRect(0,0,32,32);
            FrameRenderer.drawFrame(fCtx, c.dataset.frame || 'none', 0, 0, 32);
          });
          if (body.querySelector('.lb-row')) requestAnimationFrame(animLB);
        };
        animLB();
      }).catch(function() {
        var lb = PlayerStats.getLeaderboard();
        var av = PlayerStats.getAvatarById(lb.avatar);
        var wins = lb.wins[tab] || 0;
        body.innerHTML = header +
          '<div style="color:#F0A030;font-size:10px;text-align:center;margin-bottom:8px;">\u26A0 Server offline \u2014 showing local data</div>' +
          '<div style="display:grid;grid-template-columns:36px 1fr 70px 70px;gap:8px;align-items:center;padding:5px 0;">' +
          '<span style="color:#F8B700;font-weight:bold;text-align:center;">1</span>' +
          '<div style="display:flex;align-items:center;gap:8px;"><div style="width:28px;height:28px;border:1px solid #F8B700;overflow:hidden;background:#0a0e18;">' +
          '<img src="' + av.src + '" style="width:100%;height:100%;object-fit:cover;"/></div>' +
          '<div style="color:#fff;font-size:11px;font-weight:bold;">' + self._escapeHtml(lb.username) + '</div></div>' +
          '<span style="color:#27ae60;font-weight:bold;text-align:center;">' + wins + '</span>' +
          '<span style="color:#F8B700;text-align:center;">\uD83D\uDC51</span></div>';
      });
    };
    renderLB('overall');
    m.querySelectorAll('.lb-tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        Audio.playButton();
        activeTab = btn.dataset.tab;
        m.querySelectorAll('.lb-tab').forEach(function(b) {
          var active = b.dataset.tab === activeTab;
          b.style.background  = active ? 'linear-gradient(180deg,#024FCB,#023FA2)' : 'rgba(14,21,32,0.7)';
          b.style.color       = active ? '#F8B700' : '#64748B';
          b.style.borderColor = active ? '#3A88E8' : '#1a3060';
        });
        renderLB(activeTab);
      });
    });
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
      var owned = (stats.framesOwned || ['none']).includes(f.id);
      var active = stats.frame === f.id;
      var canAfford = (stats.coins || 0) >= f.cost;
      var borderCol = active ? '#F8B700' : owned ? '#27ae60' : 'rgba(58,136,232,0.3)';
      return '<div style="background:rgba(8,14,28,0.7);border:2px solid ' + borderCol + ';padding:14px;text-align:center;">' +
        // Frame preview canvas
        '<div style="position:relative;width:60px;height:60px;margin:0 auto 8px;background:#0a0e18;">' +
          '<img src="' + PlayerStats.getAvatarById(stats.avatar).src + '" style="position:absolute;top:2px;left:2px;width:56px;height:56px;object-fit:cover;object-position:top;z-index:1;"/>' +
          '<canvas class="frame-preview-canvas" data-frame="' + f.id + '" width="60" height="60" style="position:absolute;top:0;left:0;z-index:2;pointer-events:none;"></canvas>' +
        '</div>' +
        '<div style="color:#F8B700;font-size:12px;font-weight:bold;margin-bottom:3px;">' + f.label + '</div>' +
        '<div style="color:#94A3B8;font-size:10px;margin-bottom:8px;">' + f.description + '</div>' +
        '<div style="color:#F8B700;font-size:11px;margin-bottom:8px;">\uD83E\uDE99 ' + f.cost.toLocaleString() + ' coins</div>' +
        (owned
          ? '<button class="frame-equip-btn" data-frame="' + f.id + '" style="padding:6px 14px;font-family:\'Georgia\',serif;font-size:10px;font-weight:bold;background:' + (active ? '#27ae60' : 'linear-gradient(180deg,#024FCB,#023FA2)') + ';color:#fff;border:none;cursor:pointer;letter-spacing:1px;">' + (active ? '\u2713 EQUIPPED' : 'EQUIP') + '</button>'
          : '<button class="frame-buy-btn" data-frame="' + f.id + '" data-cost="' + f.cost + '" style="padding:6px 14px;font-family:\'Georgia\',serif;font-size:10px;font-weight:bold;background:' + (canAfford ? 'linear-gradient(180deg,#8B4500,#5a2d00)' : 'rgba(14,21,32,0.7)') + ';color:' + (canAfford ? '#F8B700' : '#2a4060') + ';border:1px solid ' + (canAfford ? '#c0a030' : '#1a3060') + ';cursor:' + (canAfford ? 'pointer' : 'not-allowed') + ';letter-spacing:1px;">BUY</button>'
        ) +
      '</div>';
    }).join('');

    var m = this._createModal(
      '<div style="color:#F8B700;font-size:18px;font-weight:bold;margin-bottom:6px;text-align:center;">\uD83D\uDED2 AVATAR FRAME SHOP</div>' +
      '<div style="color:#94A3B8;font-size:11px;text-align:center;margin-bottom:16px;">Your coins: <span style="color:#F8B700;font-weight:bold;">\uD83E\uDE99 ' + (stats.coins || 0).toLocaleString() + '</span></div>' +
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

    // Equip buttons
    m.querySelectorAll('.frame-equip-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        Audio.playButton();
        var frameId = btn.dataset.frame;
        PlayerStats.setFrame(frameId);
        if (username) GameAPI.setFrame(username, frameId).catch(function(){});
        self._closeModal();
        self._openShopModal();
      });
    });
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
          '<div style="color:#94A3B8;font-size:12px;margin-top:4px;">Overall Wins: <span style="color:#27ae60;font-weight:bold;">' + (r.overallwins||0) + '</span></div>' +
          '<div style="color:' + (frameObj.color||'#64748B') + ';font-size:11px;margin-top:2px;">' + frameObj.label + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:16px;">' +
        '<div style="color:#B8D8F8;font-size:11px;letter-spacing:2px;margin-bottom:8px;text-transform:uppercase;">Win Statistics</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' +
          [['Easy','#27ae60', r.easywin],['Medium','#F0A030', r.mediumwin],['Hard','#e74c3c', r.hardwin]].map(function(p) {
            return '<div style="background:rgba(8,14,28,0.6);border:1px solid ' + p[1] + '44;padding:10px;text-align:center;">' +
              '<div style="color:' + p[1] + ';font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">' + p[0] + '</div>' +
              '<div style="color:#fff;font-size:22px;font-weight:bold;margin:4px 0;">' + (p[2]||0) + '</div>' +
              '<div style="color:#64748B;font-size:9px;">wins</div></div>';
          }).join('') +
        '</div>' +
      '</div>'
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

    let html = '<div style="padding:10px 12px;border-bottom:1px solid rgba(248,183,0,0.2);display:flex;align-items:center;justify-content:space-between;">' +
      '<span style="color:#F8B700;font-size:12px;font-weight:bold;letter-spacing:2px;">📋 DAILY QUESTS</span>' +
      '<span style="color:#64748B;font-size:9px;">Resets in ' + resetStr + '</span>' +
      '</div>';

    defs.forEach(function(def) {
      const s = q.quests[def.id];
      const progress = Math.min(s.progress || 0, def.target);
      const done = progress >= def.target;
      const claimed = s.claimed;
      const pct = Math.round((progress / def.target) * 100);
      const diffColor = def.diff === 'easy' ? '#27ae60' : def.diff === 'medium' ? '#F0A030' : '#e74c3c';

      html += '<div style="padding:10px 12px;border-bottom:1px solid rgba(184,216,248,0.07);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">' +
          '<span style="color:' + (claimed ? '#64748B' : '#fff') + ';font-size:10px;' + (claimed ? 'text-decoration:line-through;' : '') + '">' + def.label + '</span>' +
          '<span style="color:#F8B700;font-size:10px;font-weight:bold;">🪙 ' + def.reward.toLocaleString() + '</span>' +
        '</div>' +
        '<div style="background:rgba(0,0,0,0.4);height:6px;border-radius:3px;margin-bottom:5px;overflow:hidden;">' +
          '<div style="width:' + (claimed ? 100 : pct) + '%;height:100%;background:' + (claimed ? '#2a4060' : done ? diffColor : diffColor + '88') + ';border-radius:3px;transition:width 0.3s;"></div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<span style="color:#64748B;font-size:9px;">' + (claimed ? 'Claimed ✓' : progress + ' / ' + def.target) + '</span>' +
          (done && !claimed
            ? '<button class="quest-claim-btn" data-questid="' + def.id + '" style="padding:3px 10px;font-family:\'Georgia\',serif;font-size:9px;font-weight:bold;background:linear-gradient(180deg,#027A40,#015C30);color:#F8B700;border:1px solid #27ae60;cursor:pointer;letter-spacing:1px;">CLAIM</button>'
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

  _escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
}
