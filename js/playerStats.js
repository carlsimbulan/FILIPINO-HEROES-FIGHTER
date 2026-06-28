// playerStats.js — local storage for wins, avatar, settings

const AVATARS = [
  { id: 'lapu',    src: 'hereoes images/lapu-lapu.png',        label: 'Lapu-Lapu'  },
  { id: 'pac',     src: 'hereoes images/manny pacquiao.png',   label: 'Pacquiao'   },
  { id: 'luna',    src: 'hereoes images/general luna.png',     label: 'Gen. Luna'  },
  { id: 'urduja',  src: 'hereoes images/princess urduja.png',  label: 'Urduja'     },
  { id: 'sultan',  src: 'hereoes images/sultan kudurat.png',   label: 'Sultan'     },
  { id: 'luces',   src: 'hereoes images/lucoes mercenary.png', label: 'Luções'     },
];

const AVATAR_FRAMES = [
  { id: 'none',     label: 'Default',        description: 'No frame',              cost: 0,     color: 'rgba(248,183,0,0.5)', effect: null       },
  { id: 'gold',     label: 'Gold Frame',     description: 'Shining gold border',   cost: 1000,  color: '#F8B700',             effect: 'gold'     },
  { id: 'fire',     label: 'Fire Frame',     description: 'Blazing fire effect',   cost: 10000, color: '#ff4400',             effect: 'fire'     },
  { id: 'darkfire', label: 'Dark Fire Frame',description: 'Dark black fire effect',cost: 15000, color: '#660022',             effect: 'darkfire' },
];

const COINS_PER_WIN = { easy: 100, medium: 200, hard: 1000 };

const PlayerStats = (() => {
  const KEY = 'fhf_stats';

  function _load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || _default();
    } catch(e) { return _default(); }
  }

  function _default() {
    return {
      avatar:       'lapu',
      frame:        'none',
      coins:        0,
      framesOwned:  ['none'],
      wins:   { overall: 0, easy: 0, medium: 0, hard: 0 },
      losses: { overall: 0, easy: 0, medium: 0, hard: 0 },
      musicOn: true,
      sfxOn:   true,
    };
  }

  function _save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) {}
  }

  function get() { return _load(); }

  function setAvatar(id) {
    const d = _load(); d.avatar = id; _save(d);
  }

  function recordWin(difficulty) {
    const d = _load();
    d.wins.overall++;
    d.wins[difficulty] = (d.wins[difficulty] || 0) + 1;
    // Add coins per difficulty
    const coinsEarned = COINS_PER_WIN[difficulty] || 100;
    d.coins = (d.coins || 0) + coinsEarned;
    _save(d);
    return coinsEarned;
  }

  function recordLoss(difficulty) {
    const d = _load();
    d.losses.overall++;
    d.losses[difficulty] = (d.losses[difficulty] || 0) + 1;
    _save(d);
  }

  function setMusic(on) {
    const d = _load(); d.musicOn = on; _save(d);
  }

  function setSfx(on) {
    const d = _load(); d.sfxOn = on; _save(d);
  }

  function getLeaderboard() {
    // Single-player game — leaderboard is just the current player
    // across sessions. Returns sorted list of difficulty wins.
    const d = _load();
    const username = (() => {
      try { return sessionStorage.getItem('fhf_username') || 'Warrior'; }
      catch(e) { return window._fhf_username || 'Warrior'; }
    })();
    return {
      username,
      avatar: d.avatar,
      wins: d.wins,
      losses: d.losses,
    };
  }

  function getAvatarById(id) {
    return AVATARS.find(a => a.id === id) || AVATARS[0];
  }

  function getFrameById(id) {
    return AVATAR_FRAMES.find(f => f.id === id) || AVATAR_FRAMES[0];
  }

  function setFrame(id) {
    const d = _load(); d.frame = id; _save(d);
  }

  function buyFrame(id) {
    const frame = AVATAR_FRAMES.find(f => f.id === id);
    if (!frame) return { success: false, error: 'Frame not found' };
    const d = _load();
    if (!d.framesOwned) d.framesOwned = ['none'];
    if (d.framesOwned.includes(id)) return { success: false, error: 'Already owned' };
    if ((d.coins || 0) < frame.cost) return { success: false, error: 'Not enough coins' };
    d.coins -= frame.cost;
    d.framesOwned.push(id);
    _save(d);
    return { success: true, coinsLeft: d.coins };
  }

  return {
    get, setAvatar, setFrame, buyFrame, getFrameById,
    recordWin, recordLoss, setMusic, setSfx,
    getLeaderboard, getAvatarById,
    AVATARS, AVATAR_FRAMES, COINS_PER_WIN
  };
})();
