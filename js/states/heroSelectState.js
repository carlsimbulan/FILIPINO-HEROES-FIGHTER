// heroSelectState.js — HERO SELECT screen (dark fantasy Warcraft theme)

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
    desc: 'Fearless chieftain of Mactan.\nItak blade master.',
    skills: [
      { key:'Q', name:'War Cry' }, { key:'E', name:'Itak Spin' },
      { key:'C', name:'Parry' },   { key:'R', name:'Katipunan Rage' }
    ],
    color: '#8b1a1a', accent: '#e74c3c'
  },
  {
    id: 'pacquiao', name: 'Manny Pacquiao', title: "PEOPLE'S CHAMP",
    desc: "Fastest fists in Philippines.\nDeadly boxing combos.",
    skills: [
      { key:'Q', name:'Stun Punch' }, { key:'E', name:'Flurry' },
      { key:'C', name:'Guard' },      { key:'R', name:'Giant Gloves' }
    ],
    color: '#023FA2', accent: '#3A88E8'
  },
  {
    id: 'antonioluna', name: 'Gen. Antonio Luna', title: 'FIERY TACTICIAN',
    desc: 'Military genius, deadly temper.\nSaber & revolver kombat.',
    skills: [
      { key:'Q', name:'Rage Mode' },    { key:'E', name:'Revolver Shot' },
      { key:'C', name:'Saber Parry' },  { key:'R', name:'Sharpshooter' }
    ],
    color: '#2d4a1e', accent: '#7CBA3B'
  },
  {
    id: 'urduja', name: 'Princess Urduja', title: 'AMAZONIAN SWORDMASTER',
    desc: 'Undefeated warrior princess.\nKampilan & Eskrima.',
    skills: [
      { key:'Q', name:'Eskrima Storm' }, { key:'E', name:'Kampilan Ctr' },
      { key:'C', name:"Warrior's Guard" },{ key:'R', name:"Amazon's Wrath" }
    ],
    color: '#6b1a6b', accent: '#c0a030'
  },
  {
    id: 'sultankudarat', name: 'Sultan Kudarat', title: 'UNCONQUERED SOVEREIGN',
    desc: 'Mighty Sultan of Maguindanao.\nUndefeated Kris powerhouse.',
    skills: [
      { key:'Q', name:'Spirit Armor' }, { key:'E', name:'Kris Slam' },
      { key:'C', name:'Sovereign Stand' },{ key:'R', name:'Maguindanao' }
    ],
    color: '#1a1a3a', accent: '#8B4500'
  },
  {
    id: 'luces', name: 'Luções Merc.', title: 'ELITE VANGUARD',
    desc: 'Feared mercenaries of Luzon.\nKarambit & FMA rushdown.',
    skills: [
      { key:'Q', name:'Karambit Rush' }, { key:'E', name:'Low Sweep' },
      { key:'C', name:'Evasive Roll' },  { key:'R', name:'Panantukan' }
    ],
    color: '#2d1a0a', accent: '#27ae60'
  }
];

// Difficulty settings
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
  }

  enter() {
    this._selected = null;
    this._buildUI();
  }

  exit() {
    if (this._panel && this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
    this._panel = null;
  }

  update(dt) {}

  render(ctx) {
    if (_selectBgImg.complete && _selectBgImg.naturalWidth > 0) {
      ctx.drawImage(_selectBgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#060a10'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    ctx.fillStyle = 'rgba(6,10,16,0.62)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.shadowColor = '#024FCB'; ctx.shadowBlur = 20;
    ctx.fillStyle = '#F8B700';
    ctx.font = 'bold 26px serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚔  CHOOSE YOUR CHAMPION  ⚔', CANVAS_WIDTH / 2, 52);
    ctx.restore();

    ctx.fillStyle = '#94A3B8'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
    ctx.fillText('Select wisely — your fate depends on it', CANVAS_WIDTH / 2, 72);

    const grad = ctx.createLinearGradient(80, 0, CANVAS_WIDTH-80, 0);
    grad.addColorStop(0, 'rgba(248,183,0,0)');
    grad.addColorStop(0.5, 'rgba(248,183,0,0.5)');
    grad.addColorStop(1, 'rgba(248,183,0,0)');
    ctx.strokeStyle = grad; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80, 82); ctx.lineTo(CANVAS_WIDTH-80, 82); ctx.stroke();
  }

  _buildUI() {
    const overlay = document.getElementById('ui-overlay');
    const panel = document.createElement('div');
    panel.className = 'ui-panel';
    panel.style.cssText = `
      background: rgba(6,10,22,0.15);
      border: 1px solid rgba(184,216,248,0.2);
      box-shadow: 0 8px 40px rgba(2,79,203,0.2);
      padding: 16px 20px 20px;
      text-align: center;
      font-family: 'Georgia', serif;
      margin-top: 76px;
      width: 90vw;
      max-width: 880px;
      max-height: 82vh;
      overflow-y: auto;
    `;

    const heroCards = HEROES.map(h => `
      <div class="hero-card" data-id="${h.id}"
        style="padding:12px 10px 10px;border:2px solid rgba(58,136,232,0.2);cursor:pointer;
               background:rgba(8,14,28,0.55);box-shadow:0 4px 20px rgba(0,0,0,0.5);
               transition:border-color 0.15s,box-shadow 0.15s;">
        <div style="width:100%;height:100px;overflow:hidden;border:2px solid ${h.accent}55;
                    box-shadow:0 0 14px ${h.accent}40;position:relative;background:#0a0e18;margin-bottom:7px;">
          <img src="${_heroImgMap[h.id]}" style="width:100%;height:100%;object-fit:cover;object-position:top;" onerror="this.style.display='none'"/>
          <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:${h.accent};"></div>
        </div>
        <div style="color:#F8B700;font-size:11px;font-weight:bold;margin-bottom:1px;">${h.name}</div>
        <div style="color:${h.accent};font-size:7px;letter-spacing:2px;margin-bottom:6px;text-transform:uppercase;">${h.title}</div>
        <div style="color:#94A3B8;font-size:8px;white-space:pre-line;margin-bottom:6px;line-height:1.4;">${h.desc}</div>
        <div style="height:1px;background:rgba(58,136,232,0.2);margin-bottom:5px;"></div>
        <div style="text-align:left;">
          ${h.skills.map(sk => `
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;">
              <span style="display:inline-block;width:14px;height:14px;background:linear-gradient(180deg,#024FCB,#023FA2);
                           border:1px solid #3A88E8;color:#F8B700;font-size:7px;font-weight:bold;
                           text-align:center;line-height:14px;flex-shrink:0;">${sk.key}</span>
              <span style="color:#B8D8F8;font-size:7px;">${sk.name}</span>
            </div>`).join('')}
        </div>
      </div>`).join('');

    // Difficulty buttons HTML
    const diffBtns = Object.entries(DIFFICULTY_SETTINGS).map(([key, d]) => `
      <button class="diff-btn" data-diff="${key}"
        style="padding:8px 18px;font-family:'Georgia',serif;font-size:12px;font-weight:bold;
               background:${key === _selectedDifficulty ? d.color : 'rgba(14,21,32,0.7)'};
               color:${key === _selectedDifficulty ? '#fff' : '#94A3B8'};
               border:2px solid ${key === _selectedDifficulty ? d.color : '#1a3060'};
               cursor:pointer;letter-spacing:2px;text-transform:uppercase;transition:all 0.15s;margin:0 4px;">
        ${d.label}
      </button>`).join('');

    panel.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">${heroCards}</div>

      <!-- Difficulty row -->
      <div style="margin-bottom:12px;">
        <span style="color:#94A3B8;font-size:11px;letter-spacing:2px;margin-right:10px;text-transform:uppercase;">Difficulty:</span>
        ${diffBtns}
      </div>

      <!-- Action row: Back + Confirm -->
      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="back-btn"
          style="padding:12px 28px;font-family:'Georgia',serif;font-size:13px;font-weight:bold;
                 background:rgba(14,21,32,0.7);color:#94A3B8;border:2px solid #1a3060;
                 cursor:pointer;letter-spacing:2px;text-transform:uppercase;transition:all 0.15s;"
          onmouseover="this.style.borderColor='#3A88E8';this.style.color='#fff'"
          onmouseout="this.style.borderColor='#1a3060';this.style.color='#94A3B8'">
          ← BACK
        </button>
        <button id="confirm-btn" disabled
          style="padding:12px 48px;font-family:'Georgia',serif;font-size:14px;font-weight:bold;
                 background:#0e1520;color:#2a4060;border:2px solid #1a3060;
                 cursor:not-allowed;letter-spacing:3px;text-transform:uppercase;transition:all 0.15s;">
          SELECT A CHAMPION
        </button>
      </div>
    `;

    overlay.appendChild(panel);
    this._panel = panel;

    // Hero card selection
    panel.querySelectorAll('.hero-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (card.dataset.id !== this._selected) {
          card.style.borderColor = 'rgba(58,136,232,0.6)';
          card.style.boxShadow = '0 4px 24px rgba(2,79,203,0.3)';
        }
      });
      card.addEventListener('mouseleave', () => {
        if (card.dataset.id !== this._selected) {
          card.style.borderColor = 'rgba(58,136,232,0.2)';
          card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        }
      });
      card.addEventListener('click', () => {
        Audio.playButton();
        panel.querySelectorAll('.hero-card').forEach(c => {
          c.style.borderColor = 'rgba(58,136,232,0.2)';
          c.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        });
        card.style.borderColor = '#F8B700';
        card.style.boxShadow = '0 0 24px rgba(248,183,0,0.3), 0 4px 20px rgba(0,0,0,0.5)';
        this._selected = card.dataset.id;
        const btn = document.getElementById('confirm-btn');
        btn.disabled = false;
        btn.style.background = 'linear-gradient(180deg,#024FCB,#023FA2)';
        btn.style.color = '#F8B700';
        btn.style.borderColor = '#3A88E8';
        btn.style.cursor = 'pointer';
        btn.textContent = '⚔ ENTER BATTLE ⚔';
        btn.onmouseover = () => btn.style.filter = 'brightness(1.2)';
        btn.onmouseout  = () => btn.style.filter = 'brightness(1)';
        btn.onmousedown = () => btn.style.transform = 'scale(0.98)';
        btn.onmouseup   = () => btn.style.transform = 'scale(1)';
      });
    });

    // Difficulty selection
    panel.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Audio.playButton();
        _selectedDifficulty = btn.dataset.diff;
        panel.querySelectorAll('.diff-btn').forEach(b => {
          const d = DIFFICULTY_SETTINGS[b.dataset.diff];
          const active = b.dataset.diff === _selectedDifficulty;
          b.style.background = active ? d.color : 'rgba(14,21,32,0.7)';
          b.style.color = active ? '#fff' : '#94A3B8';
          b.style.borderColor = active ? d.color : '#1a3060';
        });
      });
    });

    // Back button
    document.getElementById('back-btn').addEventListener('click', () => {
      Audio.playButton();
      this.game.transition(States.HOME);
    });

    // Confirm button
    document.getElementById('confirm-btn').addEventListener('click', () => {
      if (!this._selected) return;
      Audio.playButton();
      const playerHero = this._selected;
      const aiHero = assignAIHero(playerHero);
      const diff = DIFFICULTY_SETTINGS[_selectedDifficulty];
      this.game.transition(States.FIGHTING, { playerHero, aiHero, difficulty: diff, difficultyKey: _selectedDifficulty });
    });
  }
}
