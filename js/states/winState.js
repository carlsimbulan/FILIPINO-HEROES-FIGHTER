// winState.js — WIN/LOSE screen (dark fantasy Warcraft theme)

class WinState {
  constructor(game) {
    this.game = game;
    this._winner = null;
    this._panel = null;
    this._t = 0;
  }

  enter(payload) {
    this._winner = payload ? payload.winner : 'player';
    this._t = 0;
    this._buildUI();
  }

  exit() {
    if (this._panel && this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
    this._panel = null;
  }

  update(dt) { this._t += dt; }

  render(ctx) {
    // Dark overlay
    ctx.fillStyle = 'rgba(6,10,16,0.82)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const isWin = this._winner === 'player';

    // Radial glow behind text
    const glowColor = isWin ? 'rgba(248,183,0,' : 'rgba(224,48,80,';
    const glow = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40, 220);
    glow.addColorStop(0, glowColor + '0.18)');
    glow.addColorStop(1, glowColor + '0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Animated border frame
    const pulse = 0.5 + 0.3 * Math.sin(this._t * 2.5);
    ctx.strokeStyle = isWin ? `rgba(248,183,0,${pulse})` : `rgba(224,48,80,${pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, CANVAS_WIDTH - 60, CANVAS_HEIGHT - 60);
    ctx.strokeStyle = isWin ? `rgba(248,183,0,${pulse * 0.4})` : `rgba(224,48,80,${pulse * 0.4})`;
    ctx.strokeRect(38, 38, CANVAS_WIDTH - 76, CANVAS_HEIGHT - 76);

    // Main result text
    ctx.save();
    ctx.textAlign = 'center';
    const mainText = isWin ? 'VICTORY' : 'DEFEATED';
    const mainColor = isWin ? '#F8B700' : '#F43F5E';
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 30 + 10 * Math.sin(this._t * 3);
    ctx.fillStyle = mainColor;
    ctx.font = 'bold 72px serif';
    ctx.fillText(mainText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    ctx.restore();

    // Sub text
    const subText = isWin ? 'The Philippines stands triumphant!' : 'Train harder, warrior...';
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '16px Georgia, serif';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(subText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 8);
    ctx.restore();

    // Decorative divider
    const dg = ctx.createLinearGradient(100, 0, CANVAS_WIDTH-100, 0);
    dg.addColorStop(0, 'rgba(248,183,0,0)');
    dg.addColorStop(0.5, `rgba(248,183,0,${pulse * 0.6})`);
    dg.addColorStop(1, 'rgba(248,183,0,0)');
    ctx.strokeStyle = dg;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, CANVAS_HEIGHT/2 + 22);
    ctx.lineTo(CANVAS_WIDTH - 100, CANVAS_HEIGHT/2 + 22);
    ctx.stroke();

    // Corner runes
    this._drawRune(ctx, 60, 60);
    this._drawRune(ctx, CANVAS_WIDTH - 60, 60);
    this._drawRune(ctx, 60, CANVAS_HEIGHT - 60);
    this._drawRune(ctx, CANVAS_WIDTH - 60, CANVAS_HEIGHT - 60);
  }

  _drawRune(ctx, cx, cy) {
    ctx.save();
    ctx.strokeStyle = 'rgba(248,183,0,0.2)';
    ctx.lineWidth = 1;
    ctx.translate(cx, cy);
    ctx.strokeRect(-12, -12, 24, 24);
    ctx.beginPath();
    ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
    ctx.moveTo(0, -12); ctx.lineTo(0, 12);
    ctx.stroke();
    ctx.restore();
  }

  _buildUI() {
    const overlay = document.getElementById('ui-overlay');
    const panel = document.createElement('div');
    panel.className = 'ui-panel';
    const isWin = this._winner === 'player';
    panel.style.cssText = `
      background: linear-gradient(180deg, #141e30 0%, #0a0e18 100%);
      border: 2px solid ${isWin ? 'rgba(248,183,0,0.5)' : 'rgba(224,48,80,0.5)'};
      box-shadow: 0 0 40px ${isWin ? 'rgba(248,183,0,0.15)' : 'rgba(224,48,80,0.15)'},
                  inset 0 1px 0 rgba(184,216,248,0.06);
      padding: 22px 40px;
      text-align: center;
      font-family: 'Georgia', serif;
      margin-top: 330px;
      min-width: 380px;
      display: flex;
      gap: 12px;
      justify-content: center;
    `;
    panel.innerHTML = `
      <button id="win-again-btn"
        style="flex:1;padding:13px 20px;font-family:'Georgia',serif;font-size:13px;font-weight:bold;
               background:linear-gradient(180deg,#024FCB,#023FA2);
               color:#F8B700;border:2px solid #3A88E8;cursor:pointer;
               letter-spacing:2px;text-transform:uppercase;
               box-shadow:inset rgba(184,216,248,0.1) 0 1px 0,rgba(0,0,0,0.4) 0 4px 10px -5px;
               transition:filter 0.15s,transform 0.1s;"
        onmouseover="this.style.filter='brightness(1.2)'"
        onmouseout="this.style.filter='brightness(1)'"
        onmousedown="this.style.transform='scale(0.98)'"
        onmouseup="this.style.transform='scale(1)'">
        ⚔ PLAY AGAIN
      </button>
      <button id="win-menu-btn"
        style="flex:1;padding:13px 20px;font-family:'Georgia',serif;font-size:13px;font-weight:bold;
               background:linear-gradient(180deg,#141e30,#0a0e18);
               color:#94A3B8;border:2px solid #1a3060;cursor:pointer;
               letter-spacing:2px;text-transform:uppercase;
               transition:filter 0.15s,transform 0.1s;"
        onmouseover="this.style.borderColor='#3A88E8';this.style.color='#F8B700'"
        onmouseout="this.style.borderColor='#1a3060';this.style.color='#94A3B8'"
        onmousedown="this.style.transform='scale(0.98)'"
        onmouseup="this.style.transform='scale(1)'">
        ⌂ MAIN MENU
      </button>
    `;
    overlay.appendChild(panel);
    this._panel = panel;

    document.getElementById('win-again-btn').addEventListener('click', () => { Audio.playButton(); this.game.transition(States.HERO_SELECT); });
    document.getElementById('win-menu-btn').addEventListener('click',  () => { Audio.playButton(); this.game.transition(States.HOME); });
  }
}
