// api.js — game client API calls to the backend server

// Always point to the Express server on port 3000.
// Works whether the page is served from the game server directly,
// a live-reload extension, or opened as a file.
const _serverBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : location.origin;
const API_BASE = _serverBase + '/api';

const GameAPI = {
  // ── Auth ────────────────────────────────────────────────
  async login(username, password) {
    const res = await fetch(API_BASE + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  async register(username, password, ingamename) {
    const res = await fetch(API_BASE + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, ingamename })
    });
    return res.json();
  },

  // ── Stats ────────────────────────────────────────────────
  async recordWin(username, difficulty) {
    const res = await fetch(API_BASE + '/stats/win', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, difficulty })
    });
    return res.json();
  },

  async setAvatar(username, avatar) {
    const res = await fetch(API_BASE + '/stats/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, avatar })
    });
    return res.json();
  },

  async buyFrame(username, frameId) {
    const res = await fetch(API_BASE + '/stats/buyframe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, frameId })
    });
    return res.json();
  },

  async setFrame(username, frameId) {
    const res = await fetch(API_BASE + '/stats/setframe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, frameId })
    });
    return res.json();
  },
  // ── Leaderboard ──────────────────────────────────────────
  async getLeaderboard(tab = 'overall') {
    const res = await fetch(API_BASE + '/leaderboard?tab=' + tab);
    return res.json();
  },

  async getUser(username) {
    const res = await fetch(API_BASE + '/user/' + encodeURIComponent(username));
    return res.json();
  },

  // ── Friends ──────────────────────────────────────────────
  async getFriends(username) {
    const res = await fetch(API_BASE + '/friends/' + encodeURIComponent(username));
    return res.json();
  },

  async sendFriendRequest(from, to) {
    const res = await fetch(API_BASE + '/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to })
    });
    return res.json();
  },

  async acceptFriendRequest(username, requester) {
    const res = await fetch(API_BASE + '/friends/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, requester })
    });
    return res.json();
  },

  async declineFriendRequest(username, requester) {
    const res = await fetch(API_BASE + '/friends/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, requester })
    });
    return res.json();
  },

  async removeFriend(username, friendUsername) {
    const res = await fetch(API_BASE + '/friends/remove', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, friendUsername })
    });
    return res.json();
  }
};
