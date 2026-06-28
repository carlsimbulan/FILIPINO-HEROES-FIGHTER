// heroSelectState.js — HERO SELECT screen

const _selectBgImg = new Image();
_selectBgImg.src = 'home bg.png';

const _heroImgMap = {
  'lapulapu':      'hereoes images/lapu-lapu.png',
  'pacquiao':      'hereoes images/manny pacquiao.png',
  'antonioluna':   'hereoes images/general luna.png',
  'urduja':        'hereoes images/princess urduja.png',
  'sultankudarat': 'hereoes images/sultan kudurat.png',
  'luces':         'hereoes images/lucoes mercenary.png',
};

const HEROES = [
  {
    id: 'lapulapu', name: 'Lapu-Lapu', title: 'WARRIOR KING',
    desc: 'Fearless chieftain of Mactan. Itak blade master.',
    skills: [{ key:'Q', name:'War Cry' },{ key:'E', name:'Itak Spin' },{ key:'C', name:'Parry' },{ key:'R', name:'Katipunan Rage' }],
    color: '#8b1a1a', accent: '#e74c3c'
  },
  {
    id: 'pacquiao', name: 'Manny Pacquiao', title: "PEOPLE'S CHAMP",
    desc: "Fastest fists in Philippines. Deadly boxing combos.",
    skills: [{ key:'Q', name:'Stun Punch' },{ key:'E', name:'Flurry' },{ key:'C', name:'Guard' },{ key:'R', name:'Giant Gloves' }],
    color: '#023FA2', accent: '#3A88E8'
  },
  {
    id: 'antonioluna', name: 'Gen. Antonio Luna', title: 'FIERY TACTICIAN',
    desc: 'Military genius, deadly temper. Saber & revolver kombat.',
    skills: [{ key:'Q', name:'Rage Mode' },{ key:'E', name:'Revolver Shot' },{ key:'C', name:'Saber Parry' },{ key:'R', name:'Sharpshooter' }],
    color: '#2d4a1e', accent: '#7CBA3B'
  },
  {
    id: 'urduja', name: 'Princess Urduja', title: 'AMAZONIAN SWORDMASTER',
    desc: 'Undefeated warrior princess. Kampilan & Eskrima.',
    skills: [{ key:'Q', name:'Eskrima Storm' },{ key:'E', name:'Kampilan Ctr' },{ key:'C', name:"Warrior's Guard" },{ key:'R', name:"Amazon's Wrath" }],
    color: '#6b1a6b', accent: '#c0a030'
  },
  {
    id: 'sultankudarat', name: 'Sultan Kudurat', title: 'UNCONQUERED SOVEREIGN',
    desc: 'Mighty Sultan of Maguindanao. Undefeated Kris powerhouse.',
    skills: [{ key:'Q', name:'Spirit Armor' },{ key:'E', name:'Kris Slam' },{ key:'C', name:'Sovereign Stand' },{ key:'R', name:'Maguindanao' }],
    color: '#1a1a3a', accent: '#8B4500'
  },
  {
    id: 'luces', name: 'Luções Merc.', title: 'ELITE VANGUARD',
    desc: 'Feared mercenaries of Luzon. Karambit & FMA rushdown.',
    skills: [{ key:'Q', name:'Karambit Rush' },{ key:'E', name:'Low Sweep' },{ key:'C', name:'Evasive Roll' },{ key:'R', name:'Panantukan' }],
    color: '#2d1a0a', accent: '#27ae60'
  }
];

const DIFFICULTY_SETTINGS = {
  easy:   { label:'EASY',   color:'#27ae60', attackInterval:[1.2,2.0], damageMulti:0.6,  moveMulti:0.6  },
  medium: { label:'MEDIUM', color:'#F0A030', attackInterval:[0.6,1.3], damageMulti:1.0,  moveMulti:1.0  },
  hard:   { label:'HARD',   color:'#e74c3c', attackInterval:[0.3,0.7], damageMulti:1.4,  moveMulti:1.35 },
};
let _selectedDifficulty = 'medium';

function assignAIHero(playerHeroId) {
  const others = HEROES.filter(h => h.id !== playerHeroId);
  return others[Math.floor(Math.random() * others.length)].id;
}

class HeroSelectState {
  constructor(game) {
    this.game = game;
    this._panel = null;
    this._selected = null;
    this._timer = 50;
    this._timerInterval = null;
  }

  enter() {
    this._selected = null;
    this._timer = 50;
    this._buildUI();
    this._startTimer();
  }

  exit() {
    this._stopTimer();
    if (this._panel && this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
    this._panel = null;
  }

  _startTimer() {
    this._stopTimer();
    this._timer = 50;
    this._timerInterval = setInterval(() => {
      this._timer--;
      const el = document.getElementById('hs-timer');
      if (el) {
        el.textContent = this._timer + 's';
        el.style.color = this._timer <= 10 ? '#e74c3c' : this._timer <= 20 ? '#F0A030' : '#F8B700';
      }
      if (this._timer <= 0) {
        this._stopTimer();
        // Auto-pick random if none selected
        if (!this._selected) {
          const rand = HEROES[Math.floor(Math.random() * HEROES.length)];
          this._selectHero(rand.id);
        }
        this._confirm();
      }
    }, 1000);
  }

  _stopTimer() {
    if (this._timerInterval) { clearInterval(this._timerInterval); this._timerInterval = null; }
  }

  _selectHero(id) {
    this._selected = id;
    const hero = HEROES.find(h => h.id === id);
    if (!hero) return;

    // Update grid selection highlight
    if (this._panel) {
      this._panel.querySelectorAll('.hero-thumb').forEach(c => {
        c.style.borderColor = c.dataset.id === id ? '#F8B700' : 'rgba(58,136,232,0.2)';
        c.style.boxShadow   = c.dataset.id === id ? '0 0 18px rgba(248,183,0,0.5)' : 'none';
      });
    }

    // Update preview panel
    const preview = document.getElementById('hs-preview');
    if (!preview) return;

    preview.innerHTML =
      '<div style="position:relative;width:100%;max-height:420px;overflow:hidden;border:2px solid ' + hero.accent + '44;margin-bottom:14px;background:#050810;display:flex;align-items:center;justify-content:center;">' +
        '<img src="' + _heroImgMap[id] + '" style="max-height:420px;width:auto;max-width:100%;object-fit:contain;display:block;"/>' +
        '<div style="position:absolute;bottom:0;left:0;right:0;padding:14px 12px;background:linear-gradient(0deg,rgba(6,10,22,0.95) 60%,rgba(6,10,22,0));">' +
          '<div style="color:#F8B700;font-size:20px;font-weight:bold;font-family:\'Georgia\',serif;">' + hero.name + '</div>' +
          '<div style="color:' + hero.accent + ';font-size:10px;letter-spacing:3px;">' + hero.title + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="color:#B8D8F8;font-size:11px;margin-bottom:12px;line-height:1.5;padding:0 4px;">' + hero.desc + '</div>' +
      '<div style="margin-bottom:14px;">' +
        hero.skills.map(function(sk) {
          return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">' +
            '<span style="display:inline-block;width:20px;height:20px;background:linear-gradient(180deg,#024FCB,#023FA2);border:1px solid #3A88E8;color:#F8B700;font-size:9px;font-weight:bold;text-align:center;line-height:20px;flex-shrink:0;">' + sk.key + '</span>' +
            '<span style="color:#fff;font-size:11px;">' + sk.name + '</span>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<button id="hs-confirm" style="width:100%;padding:14px;font-family:\'Georgia\',serif;font-size:14px;font-weight:bold;background:linear-gradient(180deg,#024FCB,#023FA2);color:#F8B700;border:2px solid #3A88E8;cursor:pointer;letter-spacing:3px;" onmouseover="this.style.filter=\'brightness(1.2)\'" onmouseout="this.style.filter=\'brightness(1)\'">⚔ ENTER BATTLE ⚔</button>';

    document.getElementById('hs-confirm').addEventListener('click', () => {
      Audio.playButton();
      this._confirm();
    });
  }

  _confirm() {
    if (!this._selected) return;
    this._stopTimer();
    const playerHero = this._selected;
    const aiHero = assignAIHero(playerHero);
    const diff = DIFFICULTY_SETTINGS[_selectedDifficulty];
    this.game.transition(States.FIGHTING, { playerHero, aiHero, difficulty: diff, difficultyKey: _selectedDifficulty });
  }

  update(dt) {}

  render(ctx) {
    if (_selectBgImg.complete && _selectBgImg.naturalWidth > 0) {
      ctx.drawImage(_selectBgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#060a10'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    ctx.fillStyle = 'rgba(6,10,16,0.75)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  _buildUI() {
    const overlay = document.getElementById('ui-overlay');
    const panel = document.createElement('div');
    panel.className = 'ui-panel';
    panel.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;pointer-events:none;';

    // ── Header bar ───────────────────────────────────────
    const header = document.createElement('div');
    header.style.cssText = 'width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 24px;background:rgba(6,10,22,0.85);border-bottom:1px solid rgba(248,183,0,0.2);box-sizing:border-box;pointer-events:all;flex-shrink:0;';
    header.innerHTML =
      '<div style="color:#F8B700;font-size:18px;font-weight:bold;font-family:\'Georgia\',serif;letter-spacing:3px;">⚔ CHOOSE YOUR CHAMPION ⚔</div>' +
      '<div style="display:flex;align-items:center;gap:16px;">' +
        '<span style="color:#64748B;font-size:11px;letter-spacing:1px;">AUTO-SELECT IN</span>' +
        '<span id="hs-timer" style="color:#F8B700;font-size:22px;font-weight:bold;font-family:monospace;min-width:48px;text-align:right;">50s</span>' +
      '</div>';

    // ── Main content area ────────────────────────────────
    const content = document.createElement('div');
    content.style.cssText = 'flex:1;display:flex;gap:0;overflow:hidden;pointer-events:all;';

    // Left: champion grid + difficulty
    const left = document.createElement('div');
    left.style.cssText = 'width:320px;flex-shrink:0;display:flex;flex-direction:column;background:rgba(6,10,22,0.7);border-right:1px solid rgba(184,216,248,0.1);overflow-y:auto;';

    // Difficulty row
    const diffRow = document.createElement('div');
    diffRow.style.cssText = 'padding:10px 12px;border-bottom:1px solid rgba(184,216,248,0.1);display:flex;gap:6px;align-items:center;flex-shrink:0;';
    diffRow.innerHTML = '<span style="color:#64748B;font-size:9px;letter-spacing:2px;text-transform:uppercase;margin-right:4px;">DIFF:</span>';
    Object.entries(DIFFICULTY_SETTINGS).forEach(([key, d]) => {
      const btn = document.createElement('button');
      btn.className = 'diff-btn';
      btn.dataset.diff = key;
      btn.textContent = d.label;
      const active = key === _selectedDifficulty;
      btn.style.cssText = 'flex:1;padding:5px 0;font-family:\'Georgia\',serif;font-size:10px;font-weight:bold;letter-spacing:1px;cursor:pointer;border:2px solid ' + (active ? d.color : '#1a3060') + ';background:' + (active ? d.color : 'rgba(14,21,32,0.7)') + ';color:' + (active ? '#fff' : '#64748B') + ';transition:all 0.15s;';
      btn.addEventListener('click', () => {
        Audio.playButton();
        _selectedDifficulty = key;
        left.querySelectorAll('.diff-btn').forEach(b => {
          const dd = DIFFICULTY_SETTINGS[b.dataset.diff];
          const isActive = b.dataset.diff === _selectedDifficulty;
          b.style.background  = isActive ? dd.color : 'rgba(14,21,32,0.7)';
          b.style.color       = isActive ? '#fff' : '#64748B';
          b.style.borderColor = isActive ? dd.color : '#1a3060';
        });
      });
      diffRow.appendChild(btn);
    });
    left.appendChild(diffRow);

    // Champion grid (2 columns)
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

      thumb.onmouseover = () => { if (this._selected !== hero.id) { thumb.style.borderColor = 'rgba(58,136,232,0.6)'; } };
      thumb.onmouseout  = () => { if (this._selected !== hero.id) { thumb.style.borderColor = 'rgba(58,136,232,0.2)'; thumb.style.boxShadow = 'none'; } };
      thumb.addEventListener('click', () => { Audio.playButton(); this._selectHero(hero.id); });
      grid.appendChild(thumb);
    });
    left.appendChild(grid);
    content.appendChild(left);

    // Right: preview panel
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
