// pvpLobbyState.js — PVP Lobby / Hero Select screen

class PVPLobbyState {
  constructor(game) {
    this.game     = game;
    this._panel   = null;
    this._selected = null;
    this._confirmed = false;
    this._opponentConfirmed = false;
  }

  enter() {
    this._selected = null;
    this._confirmed = false;
    this._opponentConfirmed = false;
    this._buildUI();
    this._wireSocketEvents();
  }

  exit() {
    this._unwireSocketEvents();
    if (this._panel && this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
    this._panel = null;
  }

  update(dt) {}

  render(ctx) {
    ctx.fillStyle = '#060a10';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = 'rgba(6,10,16,0.75)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // ── Socket events ────────────────────────────────────

  _wireSocketEvents() {
    if (typeof PVPClient === 'undefined') return;

    this._onHeroAck = ({ username }) => {
      // If opponent confirmed, show indicator
      const myUser = PVPClient.myUsername;
      if (username !== myUser) {
        this._opponentConfirmed = true;
        const badge = document.getElementById('pvp-opponent-status');
        if (badge) { badge.textContent = '✓ Opponent ready'; badge.style.color = '#27ae60'; }
      }
    };

    this._onStartFight = (payload) => {
      // payload: { p1Hero, p2Hero, p1Username, p2Username, roomId }
      this.game.transition(States.PVP_FIGHTING, {
        p1Hero:      payload.p1Hero,
        p2Hero:      payload.p2Hero,
        myPosition:  PVPClient.myPosition,
        roomId:      PVPClient.roomId,
        p1Username:  payload.p1Username,
        p2Username:  payload.p2Username,
      });
    };

    this._onOpponentDisconnected = () => {
      this._showDisconnectModal();
    };

    this._onCancelled = () => {
      this._showDisconnectModal('The match was cancelled.');
    };

    PVPClient.on('pvp:hero_chosen_ack', this._onHeroAck);
    PVPClient.on('pvp:start_fight',     this._onStartFight);
    PVPClient.on('pvp:opponent_disconnected', this._onOpponentDisconnected);
    PVPClient.on('pvp:cancelled',       this._onCancelled);
  }

  _unwireSocketEvents() {
    if (typeof PVPClient === 'undefined') return;
    if (this._onHeroAck)              PVPClient.off('pvp:hero_chosen_ack', this._onHeroAck);
    if (this._onStartFight)           PVPClient.off('pvp:start_fight',     this._onStartFight);
    if (this._onOpponentDisconnected) PVPClient.off('pvp:opponent_disconnected', this._onOpponentDisconnected);
    if (this._onCancelled)            PVPClient.off('pvp:cancelled',       this._onCancelled);
  }

  // ── Actions ──────────────────────────────────────────

  _selectHero(id) {
    if (this._confirmed) return;
    this._selected = id;
    const hero = HEROES.find(h => h.id === id);
    if (!hero) return;

    // Highlight grid
    if (this._panel) {
      this._panel.querySelectorAll('.hero-thumb').forEach(c => {
        c.style.borderColor = c.dataset.id === id ? '#F8B700' : 'rgba(58,136,232,0.2)';
        c.style.boxShadow   = c.dataset.id === id ? '0 0 18px rgba(248,183,0,0.5)' : 'none';
      });
    }

    // Update preview
    const preview = document.getElementById('hs-preview');
    if (!preview) return;

    preview.innerHTML =
      '<div style="position:relative;width:100%;max-height:380px;overflow:hidden;border:2px solid ' + hero.accent + '44;margin-bottom:14px;background:#050810;display:flex;align-items:center;justify-content:center;">' +
        '<img src="' + _heroImgMap[id] + '" style="max-height:380px;width:auto;max-width:100%;object-fit:contain;display:block;"/>' +
        '<div style="position:absolute;bottom:0;left:0;right:0;padding:14px 12px;background:linear-gradient(0deg,rgba(6,10,22,0.95) 60%,rgba(6,10,22,0));">' +
          '<div style="color:#F8B700;font-size:20px;font-weight:bold;font-family:\'Georgia\',serif;">' + hero.name + '</div>' +
          '<div style="color:' + hero.accent + ';font-size:10px;letter-spacing:3px;">' + hero.title + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="color:#B8D8F8;font-size:11px;margin-bottom:12px;line-height:1.5;padding:0 4px;">' + hero.desc + '</div>' +
      '<div style="margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:5px;">' +
        hero.skills.map(function(sk) {
          return '<div style="display:flex;align-items:center;gap:6px;background:rgba(8,14,28,0.6);padding:5px 8px;border:1px solid rgba(58,136,232,0.15);">' +
            '<span style="display:inline-block;width:18px;height:18px;background:linear-gradient(180deg,#024FCB,#023FA2);border:1px solid #3A88E8;color:#F8B700;font-size:9px;font-weight:bold;text-align:center;line-height:18px;flex-shrink:0;">' + sk.key + '</span>' +
            '<span style="color:#fff;font-size:10px;">' + sk.name + '</span>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div id="pvp-opponent-status" style="text-align:center;color:#64748B;font-size:11px;margin-bottom:8px;">Waiting for opponent to choose…</div>' +
      '<div style="text-align:center;">' +
        '<button id="pvp-confirm-btn" style="display:inline-block;padding:11px 36px;font-family:\'Georgia\',serif;font-size:13px;font-weight:bold;background:linear-gradient(180deg,#024FCB,#023FA2);color:#F8B700;border:2px solid #3A88E8;cursor:pointer;letter-spacing:3px;" onmouseover="this.style.filter=\'brightness(1.2)\'" onmouseout="this.style.filter=\'brightness(1)\'">⚔ READY ⚔</button>' +
      '</div>';

    document.getElementById('pvp-confirm-btn').addEventListener('click', () => {
      if (typeof Audio !== 'undefined') Audio.playButton();
      this._confirmHero();
    });

    // Restore opponent status if already confirmed
    if (this._opponentConfirmed) {
      const badge = document.getElementById('pvp-opponent-status');
      if (badge) { badge.textContent = '✓ Opponent ready'; badge.style.color = '#27ae60'; }
    }
  }

  _confirmHero() {
    if (!this._selected || this._confirmed) return;
    this._confirmed = true;

    if (typeof PVPClient !== 'undefined') {
      PVPClient.sendHeroChoice(this._selected);
    }

    // Show waiting badge
    const btn = document.getElementById('pvp-confirm-btn');
    if (btn) {
      btn.textContent = '⏳ Waiting for opponent…';
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.style.cursor  = 'default';
    }
  }

  _leaveLobby() {
    if (typeof PVPClient !== 'undefined') {
      PVPClient.cancelInvite(PVPClient.roomId);
      PVPClient.reset();
    }
    this.game.transition(States.HOME);
  }

  _showDisconnectModal(msg) {
    const existing = document.getElementById('pvp-disconnect-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'pvp-disconnect-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:2000;pointer-events:all;';
    modal.innerHTML =
      '<div style="background:linear-gradient(180deg,#141e30,#0a0e18);border:2px solid rgba(231,76,60,0.5);padding:28px 36px;font-family:Georgia,serif;text-align:center;min-width:300px;">' +
        '<div style="color:#e74c3c;font-size:16px;font-weight:bold;margin-bottom:10px;">⚠ Opponent Disconnected</div>' +
        '<div style="color:#B8D8F8;font-size:12px;margin-bottom:20px;">' + (msg || 'Your opponent has left the lobby.') + '</div>' +
        '<button id="pvp-disc-home" style="padding:10px 24px;font-family:Georgia,serif;font-size:12px;font-weight:bold;background:linear-gradient(180deg,#024FCB,#023FA2);color:#F8B700;border:2px solid #3A88E8;cursor:pointer;letter-spacing:2px;">RETURN HOME</button>' +
      '</div>';
    document.body.appendChild(modal);

    modal.querySelector('#pvp-disc-home').addEventListener('click', () => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
      if (typeof PVPClient !== 'undefined') PVPClient.reset();
      this.game.transition(States.HOME);
    });
  }

  // ── UI ────────────────────────────────────────────────

  _buildUI() {
    const overlay = document.getElementById('ui-overlay');
    const panel = document.createElement('div');
    panel.className = 'ui-panel';
    panel.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;pointer-events:none;';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 24px;background:rgba(6,10,22,0.85);border-bottom:1px solid rgba(248,183,0,0.2);box-sizing:border-box;pointer-events:all;flex-shrink:0;';
    header.innerHTML =
      '<div style="color:#F8B700;font-size:18px;font-weight:bold;font-family:\'Georgia\',serif;letter-spacing:3px;">⚔ PVP — CHOOSE YOUR CHAMPION ⚔</div>' +
      '<div style="color:#64748B;font-size:11px;letter-spacing:1px;">Both players must choose before the fight starts</div>';

    const leaveBtn = document.createElement('button');
    leaveBtn.textContent = '✕ LEAVE LOBBY';
    leaveBtn.style.cssText = 'padding:8px 16px;font-family:Georgia,serif;font-size:11px;font-weight:bold;background:rgba(231,76,60,0.12);color:#e74c3c;border:1px solid rgba(231,76,60,0.4);cursor:pointer;letter-spacing:1px;transition:all 0.15s;pointer-events:all;';
    leaveBtn.onmouseover = () => { leaveBtn.style.background = 'rgba(231,76,60,0.25)'; };
    leaveBtn.onmouseout  = () => { leaveBtn.style.background = 'rgba(231,76,60,0.12)'; };
    leaveBtn.addEventListener('click', () => {
      if (typeof Audio !== 'undefined') Audio.playButton();
      this._leaveLobby();
    });
    header.appendChild(leaveBtn);

    // Content
    const content = document.createElement('div');
    content.style.cssText = 'flex:1;display:flex;gap:0;overflow:hidden;pointer-events:all;';

    // Left: hero grid
    const left = document.createElement('div');
    left.style.cssText = 'width:320px;flex-shrink:0;display:flex;flex-direction:column;background:rgba(6,10,22,0.7);border-right:1px solid rgba(184,216,248,0.1);overflow-y:auto;';

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px;';
    HEROES.forEach(hero => {
      const thumb = document.createElement('div');
      thumb.className = 'hero-thumb';
      thumb.dataset.id = hero.id;
      thumb.style.cssText = 'border:2px solid rgba(58,136,232,0.2);cursor:pointer;background:rgba(8,14,28,0.8);transition:border-color 0.15s,box-shadow 0.15s;overflow:hidden;';
      thumb.innerHTML =
        '<div style="height:110px;overflow:hidden;position:relative;background:#050810;display:flex;align-items:center;justify-content:center;">' +
          '<img src="' + _heroImgMap[hero.id] + '" style="width:auto;height:110px;object-fit:contain;"/>' +
          '<div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:' + hero.accent + ';"></div>' +
        '</div>' +
        '<div style="padding:4px 6px;">' +
          '<div style="color:#F8B700;font-size:9px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + hero.name + '</div>' +
          '<div style="color:' + hero.accent + ';font-size:7px;letter-spacing:1px;">' + hero.title.split(' ')[0] + '</div>' +
        '</div>';
      thumb.onmouseover = () => { if (this._selected !== hero.id) thumb.style.borderColor = 'rgba(58,136,232,0.6)'; };
      thumb.onmouseout  = () => { if (this._selected !== hero.id) { thumb.style.borderColor = 'rgba(58,136,232,0.2)'; thumb.style.boxShadow = 'none'; } };
      thumb.addEventListener('click', () => {
        if (!this._confirmed) {
          if (typeof Audio !== 'undefined') Audio.playButton();
          this._selectHero(hero.id);
        }
      });
      grid.appendChild(thumb);
    });
    left.appendChild(grid);
    content.appendChild(left);

    // Right: preview
    const right = document.createElement('div');
    right.style.cssText = 'flex:1;display:flex;flex-direction:column;padding:20px 24px;overflow-y:auto;';
    right.innerHTML =
      '<div id="hs-preview" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">' +
        '<div style="color:#2a4060;font-size:14px;font-family:\'Georgia\',serif;letter-spacing:2px;text-align:center;">SELECT A CHAMPION<br><span style="font-size:10px;color:#1a2a40;">← from the grid</span></div>' +
      '</div>';
    content.appendChild(right);

    panel.appendChild(header);
    panel.appendChild(content);
    overlay.appendChild(panel);
    this._panel = panel;
  }
}
