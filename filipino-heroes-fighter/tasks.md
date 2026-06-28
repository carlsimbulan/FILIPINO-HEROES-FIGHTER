# Implementation Plan: Filipino Heroes Pixel Fighting Game

## Overview

Incrementally build the game from a working shell outward: scaffold the HTML/JS structure → core utilities (input, physics, state machine) → fighter logic with hit detection → AI → screens (login, home, hero select, win) → full fight screen wiring. Each step produces runnable code that can be opened directly in a browser.

## Tasks

- [x] 1. Scaffold project structure and HTML shell
  - Create `index.html` as the game shell with a full-screen `<canvas id="gameCanvas">` and script tags loading all JS modules in order
  - Create all empty JS files: `js/main.js`, `js/game.js`, `js/input.js`, `js/physics.js`, `js/renderer.js`, `js/assets.js`, `js/ai.js`, `js/states/loginState.js`, `js/states/homeState.js`, `js/states/heroSelectState.js`, `js/states/fightState.js`, `js/states/winState.js`, `js/fighters/fighter.js`, `js/fighters/lapuLapu.js`, `js/fighters/pacquiao.js`
  - In `js/main.js`: get canvas, set `ctx.imageSmoothingEnabled = false`, instantiate `GameStateMachine`, start the `requestAnimationFrame` loop
  - _Requirements: 11.2, 11.3, 12.1_

- [ ] 2. Implement GameStateMachine and InputHandler
  - [x] 2.1 Implement `GameStateMachine` in `js/game.js`
    - Define `States` constants: `LOGIN, HOME, HERO_SELECT, FIGHTING, WIN`
    - Implement `transition(newState, payload)` with the allowed transitions map; log error and stay on invalid transitions
    - Implement `update(dt)` and `render(ctx)` delegating to the active state object
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 2.2 Write property test for GameStateMachine state integrity
    - **Property 5: Game state machine integrity**
    - Generate random sequences of valid and invalid `transition()` calls; assert state is always one of the five valid values and invalid calls do not change state
    - **Validates: Requirements 12.1, 12.3**

  - [x] 2.3 Implement `InputHandler` in `js/input.js`
    - Listen to `keydown`/`keyup` on `window`; track held keys in a `Set`
    - Expose `isDown(key)` and `wasPressed(key)`; define key constants for LEFT, RIGHT, UP, LIGHT_ATTACK, HEAVY_ATTACK
    - _Requirements: 5.1–5.6_

- [ ] 3. Implement Fighter base class and hero stats
  - [x] 3.1 Implement `Fighter` in `js/fighters/fighter.js`
    - Fields: `x, y, vx, vy, width, height, facingRight, onGround, maxHealth, health, state, attackActive, attackType, attackCooldown, lastAttackDamageDealt`
    - Implement `getHitBox()` returning the body collision rect
    - Implement `getAttackHitBox()` returning the active attack rect (based on `facingRight`, `attackType`, and hero range constants) or `null` when not attacking
    - Implement `applyDamage(amount)`: subtract from health, clamp to 0, set `state = 'hurt'`, set `state = 'dead'` if health reaches 0
    - _Requirements: 8.2, 8.3, 8.4, 6.1–6.6, 7.1–7.7_

  - [x] 3.2 Write property test for health damage arithmetic (Property 1)
    - **Property 1: Health damage arithmetic and clamping**
    - Use `fast-check`: generate random `(health, damage)` pairs; assert `applyDamage` yields `Math.max(0, health - damage)`; run 100+ iterations
    - **Validates: Requirements 8.2, 8.3**

  - [x] 3.3 Implement `LapuLapu` in `js/fighters/lapuLapu.js`
    - Override: `lightDamage = 8`, `heavyDamage = 18`, `lightRange = 80`, `heavyRange = 100`, `lightDuration = 18` (frames), `heavyDuration = 30` (frames)
    - Implement `renderSprite(ctx)` — pixel art drawn with canvas rect/arc calls (colored shapes representing the character with Itak sword)
    - _Requirements: 6.1–6.6_

  - [x] 3.4 Implement `Pacquiao` in `js/fighters/pacquiao.js`
    - Override: `lightDamage = 6`, `heavyDamage = 15`, `lightRange = 70`, `heavyRange = 80`, `lightDuration = 12` (frames ≤18 = 300ms at 60fps), `heavyDuration = 25` (frames)
    - Implement `renderSprite(ctx)` — pixel art boxer with gloves
    - _Requirements: 7.1–7.7_

  - [x] 3.5 Write property test for attack hitbox range (Property 4)
    - **Property 4: Attack hitbox respects declared range for all heroes**
    - For random `(x, facingRight, attackType)` inputs on both hero classes, assert the far edge of `getAttackHitBox()` ≤ declared range constant
    - **Validates: Requirements 6.4, 6.5, 7.4, 7.5**

- [ ] 4. Implement physics and hit detection
  - [x] 4.1 Implement physics helpers in `js/physics.js`
    - `applyGravity(fighter, dt)`: `vy += GRAVITY * dt`; clamp fighter to ground Y; set `onGround`
    - `moveHorizontal(fighter, dx)`: update `x`, clamp to canvas bounds
    - Export `GRAVITY`, `GROUND_Y` constants
    - _Requirements: 5.1–5.3_

  - [x] 4.2 Implement HitBox intersection utility
    - `rectsOverlap(a, b)`: returns `true` if two `{x, y, w, h}` rects overlap
    - Used by the fight update loop to detect hits
    - _Requirements: 8.1_

  - [x] 4.3 Write property test for attack damage and no-multi-hit (Properties 2 and 3)
    - **Property 2: Attack damage matches declared hero stats**
    - **Property 3: No multi-hit per attack swing**
    - Generate random overlapping positions; assert damage applied = declared value exactly once per attack instance regardless of overlap frame count
    - **Validates: Requirements 6.2, 6.3, 7.2, 7.3, 8.1, 8.5**

- [x] 5. Checkpoint — ensure fighter logic is solid
  - Ensure `applyDamage`, `getHitBox`, `getAttackHitBox`, `rectsOverlap` all work correctly; run any existing tests; open the browser and verify the canvas initializes without errors.

- [ ] 6. Implement Login and Home screens
  - [x] 6.1 Implement `LoginState` in `js/states/loginState.js`
    - Render a DOM form overlay (positioned over canvas) with username and password fields and a Submit button
    - On submit: validate both fields are non-empty/non-whitespace; on failure show inline error message; on success store username in `sessionStorage.setItem("fhf_username", username)` and call `game.transition(States.HOME)`
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 6.2 Write property test for login whitespace validation (Property 8)
    - **Property 8: Login rejects all-whitespace credentials**
    - Use `fast-check` with `fc.stringMatching(/^\s*$/)` for both fields; assert validation returns `false` for all whitespace inputs
    - **Validates: Requirements 1.2**

  - [x] 6.3 Write property test for username round-trip (Property 10)
    - **Property 10: Username round-trip through sessionStorage**
    - Generate random valid usernames; simulate login; assert `sessionStorage.getItem("fhf_username")` === submitted username
    - **Validates: Requirements 1.3, 2.1_

  - [x] 6.4 Implement `HomeState` in `js/states/homeState.js`
    - On enter: read username from `sessionStorage`; if missing, call `game.transition(States.LOGIN)`
    - Render: display "Welcome, [username]" and a "Start Game" button on canvas
    - On "Start Game" click: call `game.transition(States.HERO_SELECT)`
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 7. Implement Hero Select screen
  - [x] 7.1 Implement `HeroSelectState` in `js/states/heroSelectState.js`
    - Render both hero cards (Lapu-Lapu and Manny Pacquiao) with name and brief description
    - Track selected hero; disable/gray "Confirm" button until a hero is selected
    - On confirm: assign AI hero as the remaining hero (or random if same selected); call `game.transition(States.FIGHTING, { playerHero, aiHero })`
    - _Requirements: 3.1–3.5_

  - [x] 7.2 Write property test for hero assignment invariant (Property 9)
    - **Property 9: Hero assignment invariant on selection**
    - For both possible player selections, assert player gets chosen hero and AI gets a different valid hero
    - **Validates: Requirements 3.2, 3.3**

- [ ] 8. Implement AI controller
  - [x] 8.1 Implement `AIController` in `js/ai.js`
    - Constructor takes `aiFighter` and `playerFighter`
    - Track `actionTimer`; randomize next action interval [400, 900] ms
    - On timer: if dead → stop; if within attack range → trigger light or heavy attack (60/40 random); else → move toward player
    - _Requirements: 9.1–9.4_

  - [x] 8.2 Write property test for AI behavior invariants
    - For AI with health = 0, assert `update()` never changes fighter position or triggers attacks
    - For AI alive and within range, assert attack is triggered within expected interval bounds
    - **Validates: Requirements 9.2, 9.4**

- [ ] 9. Implement Fight screen and game loop
  - [x] 9.1 Implement `FightState` in `js/states/fightState.js`
    - On enter: instantiate Player Fighter and AI Fighter from payload hero IDs; instantiate `AIController`
    - `update(dt)`: process player input → apply physics → AI update → resolve hit detection → check win condition
    - Hit detection: if `rectsOverlap(attacker.getAttackHitBox(), defender.getHitBox())` and `!attacker.lastAttackDamageDealt` → call `defender.applyDamage(damage)`, set `attacker.lastAttackDamageDealt = true`; reset flag when attack animation ends
    - Win check: if either fighter health === 0 → `game.transition(States.WIN, { winner: playerHealth > 0 ? 'player' : 'ai' })`
    - `render(ctx)`: call `renderer.drawBackground`, `renderer.drawHealthBars`, `renderer.drawFighter` for both
    - _Requirements: 4.1–4.4, 8.1–8.5, 10.1_

  - [x] 9.2 Write property test for health bar proportionality (Property 6)
    - **Property 6: Health bar rendering is proportional**
    - Generate random health values [0..100]; assert computed bar width = `Math.round((h / 100) * maxBarWidth)` clamped to [0, maxBarWidth]
    - **Validates: Requirements 4.3**

  - [x] 9.3 Write property test for round-end timing (Property 7)
    - **Property 7: Round ends on the frame health reaches zero**
    - Simulate scripted damage sequences; assert WIN transition fires on the exact frame health first hits 0
    - **Validates: Requirements 10.1**

- [ ] 10. Implement Win screen and renderer helpers
  - [x] 10.1 Implement `WinState` in `js/states/winState.js`
    - Read `winner` from payload
    - Render "YOU WIN!" or "YOU LOSE!" in large pixel-style text
    - Render "Play Again" button → `game.transition(States.HERO_SELECT)` and "Main Menu" button → `game.transition(States.HOME)`
    - _Requirements: 10.2–10.5_

  - [x] 10.2 Implement `Renderer` helpers in `js/renderer.js`
    - `drawBackground(ctx)` — draw a simple arena background with pixel art floor
    - `drawHealthBars(ctx, p1, p2)` — draw two health bars at top of screen using proportional width formula
    - `drawFighter(ctx, fighter)` — delegate to `fighter.renderSprite(ctx)` translated to fighter.x/y
    - `drawText(ctx, text, x, y, style)` — pixel-font style text using canvas fillText
    - _Requirements: 4.1, 4.2, 11.1_

- [ ] 11. Wire everything together and final integration
  - [x] 11.1 Connect `main.js` game loop
    - In `main.js`: create `GameStateMachine`, start with `States.LOGIN`, run `requestAnimationFrame` loop calling `game.update(dt)` then `game.render(ctx)` each frame
    - Ensure `dt` is computed from timestamp delta and capped to prevent spiral-of-death
    - _Requirements: 4.4, 12.1_

  - [ ] 11.2 Ensure all screens handle the back-navigation flows
    - WinScreen "Play Again" → HERO_SELECT works end-to-end
    - WinScreen "Main Menu" → HOME works end-to-end
    - HOME "Start Game" → HERO_SELECT → FIGHTING full chain works
    - _Requirements: 10.4, 10.5, 2.2_

- [x] 12. Final checkpoint — full game playable
  - Ensure all tests pass; open `index.html` in a browser and verify: login → home → hero select → fight → win screen complete flow works; pixel art renders crisply; health bars update correctly; AI moves and attacks. Ask the user if any questions arise.

## Notes

- Each task references specific requirements for traceability
- `fast-check` is the PBT library — load via `<script>` tag from CDN in test HTML files, or via `npm install fast-check --save-dev` if a minimal package.json is added for testing only
- Pixel art sprites are drawn procedurally with canvas rect/arc calls — no external image files needed to run the game
- All correctness property tests reference their design document property number
