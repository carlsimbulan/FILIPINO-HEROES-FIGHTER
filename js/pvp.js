// pvp.js — Client-side PVP module for Filipino Heroes Fighter
// Exposes a global PVPClient object. Requires socket.io client loaded first.

const PVPClient = {
  socket:        null,
  roomId:        null,
  myPosition:    null,   // 'p1' | 'p2'
  myUsername:    null,
  opponentInput: { held: [], pressed: [], mouseX: 0 },

  // ── connect ──────────────────────────────────────────────────────────────
  // Call from HomeState.enter() after resolving rawUsername.
  connect(username, game) {
    if (this.socket && this.socket.connected) {
      // Already connected — re-auth and update game ref
      this.myUsername = username;
      this._game = game;
      this.socket.emit('pvp:auth', { username });
      return;
    }

    this.myUsername = username;
    this._game = game;
    this.socket = io(); // auto-connects to same origin

    this.socket.on('connect', () => {
      console.log('[PVP] connected:', this.socket.id);
      this.socket.emit('pvp:auth', { username });
    });

    // Opponent's input snapshot arrives each frame
    this.socket.on('pvp:input', (snapshot) => {
      if (snapshot) {
        this.opponentInput = snapshot;
      }
    });

    // Session accepted — store roomId + position and transition BOTH sides to lobby
    this.socket.on('pvp:accepted', ({ roomId, myPosition }) => {
      this.roomId     = roomId;
      this.myPosition = myPosition; // 'p1' for inviter, 'p2' for invitee
      console.log('[PVP] accepted — roomId:', roomId, 'position:', myPosition);
      if (this._game && typeof States !== 'undefined') {
        this._game.transition(States.PVP_LOBBY);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[PVP] disconnected:', reason);
    });

    this.socket.on('reconnect', () => {
      console.log('[PVP] reconnected — re-authing');
      this.socket.emit('pvp:auth', { username });
    });
  },

  // ── sendInvite ────────────────────────────────────────────────────────────
  // callbacks: { onDeclined, onExpired, onError }
  // Note: onAccepted is NOT needed — pvp:accepted is handled globally in connect()
  sendInvite(targetUsername, callbacks = {}) {
    if (!this.socket) return;

    const cleanup = () => {
      this.socket.off('pvp:declined', onDeclined);
      this.socket.off('pvp:expired',  onExpired);
      this.socket.off('pvp:error',    onError);
    };

    const onDeclined = (data) => { cleanup(); if (callbacks.onDeclined) callbacks.onDeclined(data); };
    const onExpired  = (data) => { cleanup(); if (callbacks.onExpired)  callbacks.onExpired(data);  };
    const onError    = (data) => { cleanup(); if (callbacks.onError)    callbacks.onError(data);    };

    this.socket.once('pvp:declined', onDeclined);
    this.socket.once('pvp:expired',  onExpired);
    this.socket.once('pvp:error',    onError);

    this.socket.emit('pvp:invite', { targetUsername });
  },

  // ── cancelInvite ──────────────────────────────────────────────────────────
  cancelInvite(roomId) {
    if (!this.socket) return;
    this.socket.emit('pvp:cancel', { roomId: roomId || this.roomId });
  },

  // ── sendHeroChoice ────────────────────────────────────────────────────────
  sendHeroChoice(heroId) {
    if (!this.socket) return;
    this.socket.emit('pvp:hero_chosen', { roomId: this.roomId, heroId });
  },

  // ── sendInput ─────────────────────────────────────────────────────────────
  // Called every game frame from PVPFightState.update()
  sendInput(snapshot) {
    if (!this.socket || !this.roomId) return;
    this.socket.emit('pvp:input', { roomId: this.roomId, snapshot });
  },

  // ── sendFightEnd ──────────────────────────────────────────────────────────
  sendFightEnd(winnerUsername) {
    if (!this.socket || !this.roomId) return;
    this.socket.emit('pvp:fight_end', { roomId: this.roomId, winner: winnerUsername });
  },

  // ── on / off ──────────────────────────────────────────────────────────────
  on(event, fn) {
    if (this.socket) this.socket.on(event, fn);
  },
  off(event, fn) {
    if (this.socket) this.socket.off(event, fn);
  },

  // ── reset ─────────────────────────────────────────────────────────────────
  // Call after fight ends or session cancelled to clear session state.
  reset() {
    this.roomId        = null;
    this.myPosition    = null;
    this.opponentInput = { held: [], pressed: [], mouseX: 0 };
    // Note: _game reference is kept so lobby transitions still work after reset
  }
};
