# Requirements Document

## Introduction

A browser-based 2D pixel art fighting game featuring Filipino heroes, inspired by classic arcade fighters like Tekken. Built with vanilla HTML5 Canvas and JavaScript — no frameworks, no build tools — just files that run directly in the browser. The game includes a mock login page, a home page, a hero selection screen, and a 1v1 fight against an AI opponent. Two playable heroes are available at launch: Lapu-Lapu (melee swordsman) and Manny Pacquiao (boxer).

## Glossary

- **Game**: The complete browser-based Filipino Heroes Pixel Fighting Game application
- **Player**: The human user controlling their chosen hero via keyboard
- **AI**: The computer-controlled opponent
- **Hero**: A selectable character with unique stats, attacks, and pixel art sprites
- **Fighter**: Either the Player's or AI's active hero during a fight
- **Health**: A numeric value representing a Fighter's remaining vitality (0–100)
- **HitBox**: The rectangular collision region used to detect when an attack lands
- **Damage**: The numeric amount subtracted from a Fighter's Health when hit
- **Round**: A single fight session that ends when one Fighter's Health reaches 0
- **Frame**: A single rendered canvas update (targeting 60 frames per second)
- **Sprite**: A pixel art image representing a Fighter in a given animation state
- **AnimationState**: The current animation a Fighter is playing (idle, walk, attack, hurt, dead)
- **InputHandler**: The module that reads and tracks keyboard input from the Player
- **GameLoop**: The main update-and-render cycle driven by requestAnimationFrame
- **LoginPage**: The HTML page at index.html that handles mock authentication
- **HomePage**: The screen shown after login, containing the Start Game button
- **HeroSelectScreen**: The screen where the Player picks their hero and the AI's hero is assigned
- **FightScreen**: The screen where the 1v1 battle takes place
- **WinScreen**: The screen shown after a Round ends, declaring the winner
- **Itak**: The bolo sword weapon used by Lapu-Lapu
- **Combo**: A rapid sequence of attacks performed by the AI or Player

## Requirements

### Requirement 1: Mock Authentication

**User Story:** As a player, I want to log in with any username and password, so that I can access the game without a real account system.

#### Acceptance Criteria

1. WHEN a user submits the login form with any non-empty username and any non-empty password, THE LoginPage SHALL redirect the user to the HomePage.
2. WHEN a user submits the login form with an empty username or empty password, THE LoginPage SHALL display a validation error message and prevent navigation.
3. THE LoginPage SHALL store the entered username in browser sessionStorage so other screens can display it.

---

### Requirement 2: Home Page

**User Story:** As a player, I want a home page after login that shows my username and lets me start the game, so that I have a clear entry point.

#### Acceptance Criteria

1. WHEN the HomePage loads, THE Game SHALL display the logged-in username retrieved from sessionStorage.
2. WHEN the player clicks the "Start Game" button, THE Game SHALL navigate to the HeroSelectScreen.
3. IF sessionStorage does not contain a username, THEN THE HomePage SHALL redirect the user back to the LoginPage.

---

### Requirement 3: Hero Selection

**User Story:** As a player, I want to choose my hero before the fight, so that I can play with the character I prefer.

#### Acceptance Criteria

1. WHEN the HeroSelectScreen loads, THE Game SHALL display all available heroes (Lapu-Lapu and Manny Pacquiao) as selectable options with their name and a brief description.
2. WHEN the player selects a hero and confirms, THE Game SHALL assign the selected hero to the Player Fighter.
3. WHEN the player confirms hero selection, THE Game SHALL assign a hero to the AI Fighter — either randomly or as the remaining hero not chosen by the Player.
4. WHEN both heroes are assigned, THE Game SHALL navigate to the FightScreen.
5. THE HeroSelectScreen SHALL prevent confirmation until the player has selected a hero.

---

### Requirement 4: Fight Screen Layout

**User Story:** As a player, I want a clear fight screen with health bars and my characters, so that I can track the fight state at a glance.

#### Acceptance Criteria

1. WHEN the FightScreen loads, THE Game SHALL render both Fighters' pixel art sprites on a canvas with a background.
2. WHEN the FightScreen loads, THE Game SHALL display a health bar for each Fighter positioned at the top of the screen.
3. WHILE a Round is in progress, THE Game SHALL update each Fighter's health bar to reflect their current Health value in real time.
4. WHILE a Round is in progress, THE Game SHALL run the GameLoop at a target of 60 frames per second using requestAnimationFrame.

---

### Requirement 5: Player Controls

**User Story:** As a player, I want to control my hero with keyboard inputs, so that I can move and attack during the fight.

#### Acceptance Criteria

1. WHEN the player presses the right arrow key or D key, THE InputHandler SHALL move the Player Fighter to the right.
2. WHEN the player presses the left arrow key or A key, THE InputHandler SHALL move the Player Fighter to the left.
3. WHEN the player presses the up arrow key, W key, or spacebar, THE InputHandler SHALL make the Player Fighter jump.
4. WHEN the player presses the Z key, THE InputHandler SHALL trigger the Player Fighter's light attack.
5. WHEN the player presses the X key, THE InputHandler SHALL trigger the Player Fighter's heavy attack.
6. WHILE a key is held down, THE InputHandler SHALL keep the corresponding action active until the key is released.
7. IF the Player Fighter is in a dead AnimationState, THEN THE InputHandler SHALL ignore all movement and attack inputs.

---

### Requirement 6: Hero — Lapu-Lapu

**User Story:** As a player, I want Lapu-Lapu to fight with his Itak at close range, so that the character feels authentic and distinct.

#### Acceptance Criteria

1. THE Hero Lapu-Lapu SHALL have a base Health of 100.
2. WHEN Lapu-Lapu performs a light attack (Itak slash), THE Fighter SHALL deal 8 Damage to the opponent if the attack HitBox intersects the opponent's HitBox.
3. WHEN Lapu-Lapu performs a heavy attack (Itak overhead strike), THE Fighter SHALL deal 18 Damage to the opponent if the attack HitBox intersects the opponent's HitBox.
4. THE light attack HitBox for Lapu-Lapu SHALL only extend to close range (within 80 pixels of the Fighter's center).
5. THE heavy attack HitBox for Lapu-Lapu SHALL only extend to close range (within 100 pixels of the Fighter's center).
6. WHEN Lapu-Lapu performs any attack, THE Fighter SHALL play the corresponding attack AnimationState for the duration of the attack.

---

### Requirement 7: Hero — Manny Pacquiao

**User Story:** As a player, I want Manny Pacquiao to fight with fast punching combos, so that he feels like a distinct, fast boxer.

#### Acceptance Criteria

1. THE Hero Manny Pacquiao SHALL have a base Health of 100.
2. WHEN Manny Pacquiao performs a light attack (jab), THE Fighter SHALL deal 6 Damage to the opponent if the attack HitBox intersects the opponent's HitBox.
3. WHEN Manny Pacquiao performs a heavy attack (power punch), THE Fighter SHALL deal 15 Damage to the opponent if the attack HitBox intersects the opponent's HitBox.
4. THE light attack HitBox for Manny Pacquiao SHALL only extend to close range (within 70 pixels of the Fighter's center).
5. THE heavy attack HitBox for Manny Pacquiao SHALL only extend to close range (within 80 pixels of the Fighter's center).
6. WHEN Manny Pacquiao performs a light attack, THE Fighter SHALL complete the attack AnimationState in no more than 300 milliseconds, reflecting his fast combos.
7. WHEN Manny Pacquiao performs any attack, THE Fighter SHALL play the corresponding attack AnimationState for the duration of the attack.

---

### Requirement 8: Hit Detection and Damage

**User Story:** As a player, I want attacks to register damage only when they visually connect, so that the combat feels fair and accurate.

#### Acceptance Criteria

1. WHEN an attacking Fighter's active attack HitBox overlaps the defending Fighter's HitBox, THE Game SHALL apply the attack's Damage to the defending Fighter's Health.
2. WHEN Damage is applied, THE Game SHALL subtract the Damage value from the defending Fighter's current Health.
3. IF the defending Fighter's Health after Damage would be less than 0, THEN THE Game SHALL set the defending Fighter's Health to 0.
4. WHEN a defending Fighter receives Damage, THE Game SHALL play the hurt AnimationState on the defending Fighter.
5. WHEN an attack lands, THE Game SHALL not apply Damage more than once per attack instance (no multi-hit on the same swing).

---

### Requirement 9: AI Opponent Behavior

**User Story:** As a player, I want the AI to move and attack so that the fight is challenging and feels like a real opponent.

#### Acceptance Criteria

1. WHILE the AI Fighter's Health is greater than 0, THE AI SHALL periodically attempt to move toward the Player Fighter.
2. WHILE the AI Fighter is within attack range of the Player Fighter, THE AI SHALL periodically trigger either a light or heavy attack.
3. THE AI SHALL introduce randomized delays between actions so that its behavior is not perfectly predictable.
4. IF the AI Fighter's Health reaches 0, THEN THE AI SHALL cease all movement and attack actions.

---

### Requirement 10: Win and Lose Conditions

**User Story:** As a player, I want a clear win or lose outcome after the fight, so that I know the result and can play again.

#### Acceptance Criteria

1. WHEN a Fighter's Health reaches 0, THE Game SHALL end the Round immediately.
2. WHEN the Round ends and the Player Fighter's Health is greater than 0, THE Game SHALL display the WinScreen with a "You Win!" message.
3. WHEN the Round ends and the AI Fighter's Health is greater than 0, THE Game SHALL display the WinScreen with a "You Lose!" message.
4. WHEN the WinScreen is displayed, THE Game SHALL show a "Play Again" button that navigates back to the HeroSelectScreen.
5. WHEN the WinScreen is displayed, THE Game SHALL show a "Main Menu" button that navigates back to the HomePage.

---

### Requirement 11: Pixel Art Visual Style

**User Story:** As a player, I want the entire game to look like a pixel art game, so that the visual style is consistent and charming.

#### Acceptance Criteria

1. THE Game SHALL render all Fighters, backgrounds, and UI elements using pixel art assets drawn on the HTML5 Canvas.
2. THE Game SHALL disable anti-aliasing on the Canvas context so that pixel art renders crisply without blurring.
3. WHEN scaling pixel art sprites, THE Game SHALL use nearest-neighbor interpolation to preserve pixel sharpness.

---

### Requirement 12: Game State Management

**User Story:** As a developer, I want a clear game state machine, so that screens transition correctly and the game never enters an invalid state.

#### Acceptance Criteria

1. THE Game SHALL maintain exactly one active state at all times: LOGIN, HOME, HERO_SELECT, FIGHTING, or WIN.
2. WHEN transitioning between states, THE Game SHALL cleanly initialize the new state and dispose of resources from the previous state.
3. IF an invalid state transition is attempted, THEN THE Game SHALL log an error and remain in the current state.
