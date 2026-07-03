// friendDrawer.js — Slide-out friend list panel

class FriendDrawer {
  constructor(username) {
    this._username = username; // fhf_rawusername
    this._isOpen   = false;
    this._drawer   = null;
    this._overlay  = null;
    this._body     = null;
    this._msgEl    = null;
    this._inputEl  = null;
    this._data     = { friends: [], incoming: [], outgoing: [] };
    this._build();
  }

  // ── Public API ─────────────────────────────────────────

  open() {
    if (this._isOpen) return;
    this._isOpen = true;
    // Position drawer below the header bar
    const header = document.querySelector('.ui-panel > div:first-child');
    const headerH = header ? header.getBoundingClientRect().bottom : 62;
    this._drawer.style.top    = headerH + 'px';
    this._drawer.style.height = (window.innerHeight - headerH) + 'px';
    this._overlay.style.top   = headerH + 'px';
    this._drawer.style.transform = 'translateX(0)';
    this._overlay.style.display = 'block';
    this._loadAndRender();
  }

  close() {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._drawer.style.transform = 'translateX(100%)';
    this._overlay.style.display = 'none';
  }

  toggle() {
    if (this._isOpen) this.close(); else this.open();
  }

  destroy() {
    // Clean up presence listeners
    if (typeof PVPClient !== 'undefined' && PVPClient.socket) {
      PVPClient.socket.off('pvp:friend_came_online');
      PVPClient.socket.off('pvp:friend_went_offline');
    }
    if (this._drawer && this._drawer.parentNode)   this._drawer.parentNode.removeChild(this._drawer);
    if (this._overlay && this._overlay.parentNode) this._overlay.parentNode.removeChild(this._overlay);
    this._drawer = null;
    this._overlay = null;
  }

  // ── Private ────────────────────────────────────────────

  _build() {
    // Backdrop — clicking it closes the drawer
    this._overlay = document.createElement('div');
    this._overlay.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:1099;';
    this._overlay.addEventListener('click', () => this.close());

    // Drawer panel — starts below the header (top is set dynamically on open)
    this._drawer = document.createElement('div');
    this._drawer.style.cssText = [
      'position:fixed;top:0;right:0;width:300px;z-index:1100;',
      'background:rgba(8,14,28,0.97);border-left:1px solid rgba(248,183,0,0.25);',
      'border-top:1px solid rgba(248,183,0,0.15);',
      'box-shadow:-6px 0 32px rgba(2,79,203,0.25);',
      'display:flex;flex-direction:column;font-family:\'Georgia\',serif;',
      'transform:translateX(100%);transition:transform 0.28s cubic-bezier(.4,0,.2,1);',
      'pointer-events:all;',
    ].join('');

    // Stop all mouse/touch events inside the drawer from reaching the game canvas
    this._drawer.addEventListener('mousedown', e => e.stopPropagation());
    this._drawer.addEventListener('mouseup',   e => e.stopPropagation());
    this._drawer.addEventListener('click',     e => e.stopPropagation());

    // Header
    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(248,183,0,0.2);flex-shrink:0;';
    hdr.innerHTML = '<span style="color:#F8B700;font-size:14px;font-weight:bold;letter-spacing:3px;">👥 FRIENDS</span>';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:none;border:none;color:#94A3B8;font-size:16px;cursor:pointer;padding:2px 6px;';
    closeBtn.onmouseover = () => { closeBtn.style.color = '#F8B700'; };
    closeBtn.onmouseout  = () => { closeBtn.style.color = '#94A3B8'; };
    closeBtn.addEventListener('click', () => this.close());
    hdr.appendChild(closeBtn);

    // Add-friend input row
    const addRow = document.createElement('div');
    addRow.style.cssText = 'padding:12px 14px;border-bottom:1px solid rgba(184,216,248,0.1);flex-shrink:0;';
    this._inputEl = document.createElement('input');
    this._inputEl.type = 'text';
    this._inputEl.placeholder = 'Username…';
    this._inputEl.style.cssText = [
      'width:100%;box-sizing:border-box;background:rgba(14,21,32,0.8);',
      'border:1px solid rgba(58,136,232,0.35);color:#fff;padding:7px 10px;',
      'font-family:\'Georgia\',serif;font-size:12px;outline:none;',
    ].join('');
    this._inputEl.addEventListener('focus',() => { this._inputEl.style.borderColor='#3A88E8'; });
    this._inputEl.addEventListener('blur', () => { this._inputEl.style.borderColor='rgba(58,136,232,0.35)'; });
    this._inputEl.addEventListener('mousedown', e => { e.stopPropagation(); this._inputEl.focus(); });

    const addBtn = document.createElement('button');
    addBtn.textContent = 'ADD';
    addBtn.style.cssText = [
      'width:100%;margin-top:6px;padding:7px;font-family:\'Georgia\',serif;font-size:11px;',
      'font-weight:bold;letter-spacing:2px;background:linear-gradient(180deg,#024FCB,#023FA2);',
      'color:#F8B700;border:1px solid #3A88E8;cursor:pointer;transition:filter 0.15s;',
    ].join('');
    addBtn.onmouseover = () => { addBtn.style.filter = 'brightness(1.2)'; };
    addBtn.onmouseout  = () => { addBtn.style.filter = 'brightness(1)'; };

    this._msgEl = document.createElement('div');
    this._msgEl.style.cssText = 'font-size:10px;min-height:14px;margin-top:5px;text-align:center;';

    addBtn.addEventListener('click', () => this._onAddFriend());
    this._inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._onAddFriend(); });

    addRow.appendChild(this._inputEl);
    addRow.appendChild(addBtn);
    addRow.appendChild(this._msgEl);

    // Scrollable body
    this._body = document.createElement('div');
    this._body.style.cssText = 'flex:1;overflow-y:auto;padding:10px 0;';

    this._drawer.appendChild(hdr);
    this._drawer.appendChild(addRow);
    this._drawer.appendChild(this._body);

    const uiOverlay = document.getElementById('ui-overlay') || document.body;
    uiOverlay.appendChild(this._overlay);
    uiOverlay.appendChild(this._drawer);
  }

  _showMsg(text, color) {
    this._msgEl.textContent = text;
    this._msgEl.style.color = color || '#94A3B8';
    if (this._msgEl._timer) clearTimeout(this._msgEl._timer);
    if (text) {
      this._msgEl._timer = setTimeout(() => { this._msgEl.textContent = ''; }, 3000);
    }
  }

  async _loadAndRender() {
    this._body.innerHTML = '<div style="color:#64748B;text-align:center;padding:24px;font-size:12px;">Loading…</div>';
    try {
      const res = await GameAPI.getFriends(this._username);
      if (res.error) throw new Error(res.error);
      this._data = res;
    } catch (e) {
      this._body.innerHTML = '<div style="color:#e74c3c;text-align:center;padding:24px;font-size:11px;">Could not load friends.<br><span style="color:#64748B;font-size:10px;">' + e.message + '</span></div>';
      return;
    }

    const friendUsernames = (this._data.friends || []).map(f => f.username);

    if (
      typeof PVPClient !== 'undefined' &&
      PVPClient.socket &&
      PVPClient.socket.connected
    ) {
      // Register presence and get initial online list in one shot
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 1500);
        PVPClient.socket.once('pvp:online_status', ({ online }) => {
          clearTimeout(timeout);
          this._onlineFriends = new Set(online || []);
          resolve();
        });
        PVPClient.socket.emit('pvp:notify_presence', { friends: friendUsernames });
      });

      // Listen for realtime presence changes
      this._setupPresenceListeners();
    } else {
      this._onlineFriends = new Set();
    }

    this._render();
  }

  _setupPresenceListeners() {
    if (!PVPClient || !PVPClient.socket) return;

    // Remove old listeners first to avoid duplicates
    PVPClient.socket.off('pvp:friend_came_online');
    PVPClient.socket.off('pvp:friend_went_offline');

    PVPClient.socket.on('pvp:friend_came_online', ({ username }) => {
      if (!this._onlineFriends) this._onlineFriends = new Set();
      this._onlineFriends.add(username);
      if (this._isOpen) this._render(); // re-render if drawer is open
    });

    PVPClient.socket.on('pvp:friend_went_offline', ({ username }) => {
      if (this._onlineFriends) this._onlineFriends.delete(username);
      if (this._isOpen) this._render();
    });
  }

  _render() {
    this._body.innerHTML = '';
    const { friends, incoming, outgoing } = this._data;
    const online  = (friends || []).filter(f => this._onlineFriends && this._onlineFriends.has(f.username));
    const offline = (friends || []).filter(f => !this._onlineFriends || !this._onlineFriends.has(f.username));

    // ── Incoming requests section ──────────────────────
    if (incoming && incoming.length > 0) {
      const sec = document.createElement('div');
      sec.style.cssText = 'padding:0 14px 10px;border-bottom:1px solid rgba(248,183,0,0.15);margin-bottom:8px;';
      sec.innerHTML = '<div style="color:#F8B700;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;font-weight:bold;">Requests (' + incoming.length + ')</div>';
      incoming.forEach(requester => {
        sec.appendChild(this._renderRequestEntry(requester));
      });
      this._body.appendChild(sec);
    }

    // ── Online friends section ─────────────────────────
    if (online.length > 0) {
      const sec = document.createElement('div');
      sec.style.cssText = 'padding:0 14px 10px;border-bottom:1px solid rgba(39,174,96,0.15);margin-bottom:4px;';
      sec.innerHTML = '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:#27ae60;display:inline-block;box-shadow:0 0 5px #27ae60;"></span>' +
        '<span style="color:#27ae60;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Online (' + online.length + ')</span></div>';
      online.forEach(f => sec.appendChild(this._renderFriendEntry(f, true)));
      this._body.appendChild(sec);
    }

    // ── Offline friends section ────────────────────────
    const sec2 = document.createElement('div');
    sec2.style.cssText = 'padding:0 14px;';
    const lbl = document.createElement('div');
    lbl.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:8px;';
    lbl.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#64748B;display:inline-block;"></span>' +
      '<span style="color:#64748B;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Offline (' + offline.length + ')</span>';
    sec2.appendChild(lbl);

    if (friends.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'color:#64748B;font-size:11px;text-align:center;padding:20px 0;';
      empty.textContent = 'No friends yet. Add someone!';
      sec2.appendChild(empty);
    } else {
      offline.forEach(f => sec2.appendChild(this._renderFriendEntry(f, false)));
    }

    // ── Outgoing requests hint ─────────────────────────
    if (outgoing && outgoing.length > 0) {
      const hint = document.createElement('div');
      hint.style.cssText = 'margin-top:12px;padding:8px;background:rgba(2,79,203,0.08);border:1px solid rgba(58,136,232,0.15);';
      hint.innerHTML = '<div style="color:#64748B;font-size:10px;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Pending sent</div>' +
        outgoing.map(u => '<div style="color:#94A3B8;font-size:11px;padding:2px 0;">• ' + this._esc(u) + '</div>').join('');
      sec2.appendChild(hint);
    }

    this._body.appendChild(sec2);
  }

  _renderFriendEntry(friend, isOnline) {
    const av = (typeof PlayerStats !== 'undefined') ? PlayerStats.getAvatarById(friend.avatar || 'lapu') : { src: 'hereoes images/lapu-lapu.png' };
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(184,216,248,0.07);cursor:pointer;transition:background 0.15s;';
    row.onmouseover = () => { row.style.background = 'rgba(58,136,232,0.06)'; };
    row.onmouseout  = () => { row.style.background = 'transparent'; };

    // Avatar with frame canvas overlay + online indicator
    const avatarWrap = document.createElement('div');
    avatarWrap.style.cssText = 'position:relative;width:42px;height:42px;flex-shrink:0;';
    avatarWrap.innerHTML =
      '<img src="' + av.src + '" style="position:absolute;top:2px;left:2px;width:38px;height:38px;object-fit:cover;object-position:top;z-index:1;"/>' +
      '<canvas width="42" height="42" style="position:absolute;top:0;left:0;z-index:2;pointer-events:none;"></canvas>' +
      (isOnline
        ? '<span style="position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:#27ae60;border:2px solid rgba(8,14,28,0.97);z-index:3;box-shadow:0 0 4px #27ae60;"></span>'
        : '');
    row.appendChild(avatarWrap);

    // Animate the frame canvas
    const fc = avatarWrap.querySelector('canvas');
    const frameId = friend.frame || 'none';
    const animFrame = () => {
      if (!fc.parentNode) return;
      const fCtx = fc.getContext('2d');
      fCtx.clearRect(0, 0, 42, 42);
      if (typeof FrameRenderer !== 'undefined') FrameRenderer.drawFrame(fCtx, frameId, 0, 0, 42);
      requestAnimationFrame(animFrame);
    };
    animFrame();

    const info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0;';
    info.innerHTML =
      '<div style="color:#fff;font-size:12px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + this._esc(friend.ingamename || friend.username) + '</div>' +
      '<div style="color:#64748B;font-size:10px;">🏆 ' + (friend.overallwins || 0) + ' wins</div>';
    row.appendChild(info);

    // Action buttons area
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:4px;align-items:center;flex-shrink:0;';

    // Challenge button — only shown when PVPClient is connected
    if (typeof PVPClient !== 'undefined' && PVPClient.socket && PVPClient.socket.connected) {
      const challengeBtn = document.createElement('button');
      challengeBtn.textContent = '⚔';
      challengeBtn.title = 'Challenge to PVP';
      challengeBtn.className = 'pvp-challenge-btn';
      challengeBtn.style.cssText = 'background:rgba(248,183,0,0.08);border:1px solid rgba(248,183,0,0.4);color:#F8B700;font-size:12px;padding:3px 7px;cursor:pointer;flex-shrink:0;transition:all 0.15s;';
      challengeBtn.onmouseover = () => { challengeBtn.style.background = 'rgba(248,183,0,0.2)'; };
      challengeBtn.onmouseout  = () => { challengeBtn.style.background = 'rgba(248,183,0,0.08)'; };
      challengeBtn.addEventListener('click', (e) => { e.stopPropagation(); this._onChallenge(friend); });
      actions.appendChild(challengeBtn);
    }

    // More options button (⋯) — opens View Profile / Remove
    const moreBtn = document.createElement('button');
    moreBtn.textContent = '⋯';
    moreBtn.title = 'More options';
    moreBtn.style.cssText = 'background:none;border:1px solid rgba(184,216,248,0.2);color:#94A3B8;font-size:14px;padding:2px 7px;cursor:pointer;flex-shrink:0;transition:all 0.15s;';
    moreBtn.onmouseover = () => { moreBtn.style.color = '#fff'; moreBtn.style.borderColor = '#94A3B8'; };
    moreBtn.onmouseout  = () => { moreBtn.style.color = '#94A3B8'; moreBtn.style.borderColor = 'rgba(184,216,248,0.2)'; };
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._showFriendOptions(moreBtn, friend);
    });
    actions.appendChild(moreBtn);

    row.appendChild(actions);
    return row;
  }

  _showFriendOptions(anchor, friend) {
    // Remove any existing options popup
    const existing = document.getElementById('friend-options-popup');
    if (existing) { existing.remove(); return; }

    const popup = document.createElement('div');
    popup.id = 'friend-options-popup';
    const rect = anchor.getBoundingClientRect();
    popup.style.cssText = 'position:fixed;z-index:2000;background:rgba(10,14,24,0.98);border:1px solid rgba(58,136,232,0.4);box-shadow:0 4px 20px rgba(0,0,0,0.6);font-family:Georgia,serif;min-width:160px;';
    popup.style.top  = (rect.bottom + 4) + 'px';
    popup.style.right = (window.innerWidth - rect.right) + 'px';

    const viewBtn = document.createElement('button');
    viewBtn.textContent = '👤 View Profile';
    viewBtn.style.cssText = 'display:block;width:100%;padding:10px 14px;background:none;border:none;border-bottom:1px solid rgba(58,136,232,0.15);color:#B8D8F8;font-family:Georgia,serif;font-size:12px;text-align:left;cursor:pointer;transition:background 0.15s;';
    viewBtn.onmouseover = () => { viewBtn.style.background = 'rgba(58,136,232,0.12)'; };
    viewBtn.onmouseout  = () => { viewBtn.style.background = 'none'; };
    viewBtn.addEventListener('click', () => {
      popup.remove();
      this._viewFriendProfile(friend);
    });

    const rmBtn = document.createElement('button');
    rmBtn.textContent = '✕ Remove Friend';
    rmBtn.style.cssText = 'display:block;width:100%;padding:10px 14px;background:none;border:none;color:#e74c3c;font-family:Georgia,serif;font-size:12px;text-align:left;cursor:pointer;transition:background 0.15s;';
    rmBtn.onmouseover = () => { rmBtn.style.background = 'rgba(231,76,60,0.12)'; };
    rmBtn.onmouseout  = () => { rmBtn.style.background = 'none'; };
    rmBtn.addEventListener('click', () => {
      popup.remove();
      this._confirmRemoveFriend(friend.username, friend.ingamename || friend.username);
    });

    popup.appendChild(viewBtn);
    popup.appendChild(rmBtn);
    document.body.appendChild(popup);

    // Close on outside click
    const close = (e) => { if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 0);
  }

  async _viewFriendProfile(friend) {
    try {
      const data = await GameAPI.getUser(friend.username);
      if (data.error) { this._showMsg('Could not load profile.', '#e74c3c'); return; }
      // Delegate to HomeState's player profile modal if available
      const homeState = window._currentHomeState;
      if (homeState && typeof homeState._openPlayerProfileModal === 'function') {
        homeState._openPlayerProfileModal({
          username:      data.username,
          ingamename:    data.ingamename || data.username,
          avatar:        data.avatar     || 'lapu',
          frame:         data.activeframe|| 'none',
          overallwins:   data.overallwins   || 0,
          easywin:       data.easywin       || 0,
          mediumwin:     data.mediumwin     || 0,
          hardwin:       data.hardwin       || 0,
          easyloss:      data.easyloss      || 0,
          mediumloss:    data.mediumloss    || 0,
          hardloss:      data.hardloss      || 0,
          overalllosses: data.overalllosses || 0,
          pvpwins:       data.pvpwins       || 0,
          pvplosses:     data.pvplosses     || 0,
        });
      }
    } catch(e) {
      this._showMsg('Server error.', '#e74c3c');
    }
  }

  _renderRequestEntry(requester) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(184,216,248,0.07);gap:8px;';
    const name = document.createElement('div');
    name.style.cssText = 'color:#B8D8F8;font-size:11px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    name.textContent = requester;
    row.appendChild(name);

    const acceptBtn = document.createElement('button');
    acceptBtn.textContent = '✓';
    acceptBtn.title = 'Accept';
    acceptBtn.style.cssText = 'background:rgba(39,174,96,0.15);border:1px solid rgba(39,174,96,0.5);color:#27ae60;font-size:13px;padding:3px 8px;cursor:pointer;transition:all 0.15s;';
    acceptBtn.onmouseover = () => { acceptBtn.style.background = 'rgba(39,174,96,0.3)'; };
    acceptBtn.onmouseout  = () => { acceptBtn.style.background = 'rgba(39,174,96,0.15)'; };
    acceptBtn.addEventListener('click', () => this._onAccept(requester));

    const decBtn = document.createElement('button');
    decBtn.textContent = '✕';
    decBtn.title = 'Decline';
    decBtn.style.cssText = 'background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.35);color:#e74c3c;font-size:13px;padding:3px 8px;cursor:pointer;transition:all 0.15s;';
    decBtn.onmouseover = () => { decBtn.style.background = 'rgba(231,76,60,0.25)'; };
    decBtn.onmouseout  = () => { decBtn.style.background = 'rgba(231,76,60,0.1)'; };
    decBtn.addEventListener('click', () => this._onDecline(requester));

    row.appendChild(acceptBtn);
    row.appendChild(decBtn);
    return row;
  }

  // ── Action handlers ────────────────────────────────────

  async _onAddFriend() {
    const target = (this._inputEl.value || '').trim();
    if (!target) { this._showMsg('Enter a username.', '#e74c3c'); return; }
    if (target === this._username) { this._showMsg('You cannot add yourself.', '#e74c3c'); return; }

    this._showMsg('Sending…', '#94A3B8');
    try {
      const res = await GameAPI.sendFriendRequest(this._username, target);
      if (res.success) {
        this._inputEl.value = '';
        this._showMsg('Request sent!', '#27ae60');
        await this._loadAndRender();
      } else {
        this._showMsg(res.error || 'Failed to send request.', '#e74c3c');
      }
    } catch (e) {
      this._showMsg('Server error.', '#e74c3c');
    }
  }

  async _onAccept(requester) {
    try {
      const res = await GameAPI.acceptFriendRequest(this._username, requester);
      if (res.success) await this._loadAndRender();
      else this._showMsg(res.error || 'Failed.', '#e74c3c');
    } catch (e) { this._showMsg('Server error.', '#e74c3c'); }
  }

  async _onDecline(requester) {
    try {
      const res = await GameAPI.declineFriendRequest(this._username, requester);
      if (res.success) await this._loadAndRender();
      else this._showMsg(res.error || 'Failed.', '#e74c3c');
    } catch (e) { this._showMsg('Server error.', '#e74c3c'); }
  }

  _confirmRemoveFriend(friendUsername, displayName) {
    // Remove any existing confirm modal
    const existing = document.getElementById('remove-friend-confirm');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'remove-friend-confirm';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);display:flex;justify-content:center;align-items:center;z-index:2100;pointer-events:all;';

    modal.innerHTML =
      '<div style="background:linear-gradient(180deg,#141e30,#0a0e18);border:2px solid rgba(231,76,60,0.5);box-shadow:0 0 40px rgba(231,76,60,0.2);padding:28px 32px;font-family:Georgia,serif;text-align:center;min-width:300px;max-width:380px;">' +
        '<div style="color:#e74c3c;font-size:22px;margin-bottom:12px;">⚠</div>' +
        '<div style="color:#fff;font-size:14px;font-weight:bold;margin-bottom:8px;">Remove Friend?</div>' +
        '<div style="color:#94A3B8;font-size:12px;margin-bottom:24px;">Are you sure you want to remove <span style="color:#F8B700;font-weight:bold;">' + this._esc(displayName) + '</span> from your friends list?</div>' +
        '<div style="display:flex;gap:12px;justify-content:center;">' +
          '<button id="rm-confirm-yes" style="padding:10px 24px;font-family:Georgia,serif;font-size:12px;font-weight:bold;background:linear-gradient(180deg,#c0392b,#922b21);color:#fff;border:1px solid #e74c3c;cursor:pointer;letter-spacing:2px;transition:filter 0.15s;" onmouseover="this.style.filter=\'brightness(1.2)\'" onmouseout="this.style.filter=\'brightness(1)\'">REMOVE</button>' +
          '<button id="rm-confirm-no"  style="padding:10px 24px;font-family:Georgia,serif;font-size:12px;font-weight:bold;background:rgba(14,21,32,0.8);color:#94A3B8;border:1px solid rgba(184,216,248,0.25);cursor:pointer;letter-spacing:2px;transition:all 0.15s;" onmouseover="this.style.color=\'#fff\'" onmouseout="this.style.color=\'#94A3B8\'">CANCEL</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    modal.querySelector('#rm-confirm-yes').addEventListener('click', () => {
      modal.remove();
      this._onRemove(friendUsername);
    });
    modal.querySelector('#rm-confirm-no').addEventListener('click', () => {
      modal.remove();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  async _onRemove(friendUsername) {
    try {
      const res = await GameAPI.removeFriend(this._username, friendUsername);
      if (res.success) await this._loadAndRender();
      else this._showMsg(res.error || 'Failed.', '#e74c3c');
    } catch (e) { this._showMsg('Server error.', '#e74c3c'); }
  }

  _onChallenge(friend) {
    if (typeof PVPClient === 'undefined' || !PVPClient.socket || !PVPClient.socket.connected) {
      this._showMsg('PVP not available.', '#e74c3c');
      return;
    }

    // Disable all challenge buttons while invite is pending
    const allBtns = this._body.querySelectorAll('.pvp-challenge-btn');
    allBtns.forEach(b => { b.disabled = true; b.style.opacity = '0.4'; });

    this._showMsg('Invite sent to ' + this._esc(friend.ingamename || friend.username) + '…', '#F8B700');

    PVPClient.sendInvite(friend.username, {
      onDeclined: () => {
        this._restoreChallengeBtns();
        this._showMsg(this._esc(friend.ingamename || friend.username) + ' declined.', '#e74c3c');
      },
      onExpired: () => {
        this._restoreChallengeBtns();
        this._showMsg('Invite expired.', '#94A3B8');
      },
      onError: (data) => {
        this._restoreChallengeBtns();
        const msgs = { offline: 'Friend is offline.', already_in_session: 'You are already in a match.', target_in_session: 'Friend is already in a match.' };
        this._showMsg(msgs[data && data.reason] || 'Could not send invite.', '#e74c3c');
      }
    });
  }

  _restoreChallengeBtns() {
    if (!this._body) return;
    const allBtns = this._body.querySelectorAll('.pvp-challenge-btn');
    allBtns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
  }

  _showToast(msg, color) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:40px;left:50%;transform:translateX(-50%);background:rgba(8,14,28,0.95);border:1px solid ' + (color || '#3A88E8') + ';color:' + (color || '#B8D8F8') + ';padding:10px 22px;font-family:Georgia,serif;font-size:13px;z-index:9999;pointer-events:none;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 3000);
  }

  // Called from HomeState.enter() to wire up incoming invite notifications
  listenForInvites(game) {
    if (typeof PVPClient === 'undefined' || !PVPClient.socket) return;
    this._pvpInviteHandler = ({ roomId, inviterUsername }) => {
      this._showInviteModal(roomId, inviterUsername, game);
    };
    PVPClient.on('pvp:invite', this._pvpInviteHandler);

    // Register presence so friends see us online immediately on login
    // We fetch our friends list then notify the server
    GameAPI.getFriends(this._username).then((res) => {
      if (res && !res.error && PVPClient.socket && PVPClient.socket.connected) {
        const friendUsernames = (res.friends || []).map(f => f.username);
        if (friendUsernames.length > 0) {
          // Register friends for presence push notifications
          PVPClient.socket.emit('pvp:notify_presence', { friends: friendUsernames });
          // Store for re-use if drawer opens
          this._cachedFriendUsernames = friendUsernames;
        }
        // Set up presence listeners now so they work even before drawer opens
        this._setupPresenceListeners();
      }
    }).catch(() => {});
  }

  stopListeningForInvites() {
    if (typeof PVPClient !== 'undefined' && this._pvpInviteHandler) {
      PVPClient.off('pvp:invite', this._pvpInviteHandler);
      this._pvpInviteHandler = null;
    }
  }

  _showInviteModal(roomId, inviterUsername, game) {
    // Remove any existing invite modal
    const existing = document.getElementById('pvp-invite-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'pvp-invite-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:2000;pointer-events:all;';
    modal.innerHTML =
      '<div style="background:linear-gradient(180deg,#141e30,#0a0e18);border:2px solid rgba(248,183,0,0.4);box-shadow:0 0 60px rgba(248,183,0,0.2);padding:28px 36px;font-family:Georgia,serif;text-align:center;min-width:320px;">' +
        '<div style="color:#F8B700;font-size:16px;font-weight:bold;margin-bottom:10px;">⚔ PVP CHALLENGE</div>' +
        '<div style="color:#B8D8F8;font-size:13px;margin-bottom:20px;"><span style="color:#fff;font-weight:bold;">' + this._esc(inviterUsername) + '</span> challenged you to a fight!</div>' +
        '<div style="display:flex;gap:12px;justify-content:center;">' +
          '<button id="pvp-accept-btn" style="padding:10px 24px;font-family:Georgia,serif;font-size:12px;font-weight:bold;background:linear-gradient(180deg,#27ae60,#1e8449);color:#fff;border:1px solid #27ae60;cursor:pointer;letter-spacing:2px;">ACCEPT</button>' +
          '<button id="pvp-decline-btn" style="padding:10px 24px;font-family:Georgia,serif;font-size:12px;font-weight:bold;background:rgba(231,76,60,0.15);color:#e74c3c;border:1px solid rgba(231,76,60,0.5);cursor:pointer;letter-spacing:2px;">DECLINE</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    const removeModal = () => { if (modal.parentNode) modal.parentNode.removeChild(modal); };

    modal.querySelector('#pvp-accept-btn').addEventListener('click', () => {
      removeModal();
      if (typeof PVPClient !== 'undefined') {
        PVPClient.socket.emit('pvp:accept', { roomId });
      }
      if (game && typeof States !== 'undefined') {
        game.transition(States.PVP_LOBBY);
      }
    });

    modal.querySelector('#pvp-decline-btn').addEventListener('click', () => {
      removeModal();
      if (typeof PVPClient !== 'undefined') {
        PVPClient.socket.emit('pvp:decline', { roomId });
      }
    });

    // Auto-dismiss if server sends pvp:expired or pvp:cancelled
    const onDismiss = () => { removeModal(); };
    if (typeof PVPClient !== 'undefined') {
      PVPClient.socket.once('pvp:expired',   onDismiss);
      PVPClient.socket.once('pvp:cancelled', onDismiss);
    }
  }

  _esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
}
