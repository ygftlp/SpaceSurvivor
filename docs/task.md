# Space Survivor Development Tasks

## Phase 1: Core Framework & Scene Management [x]
- [x] Implement `SceneManager` to handle scene transitions.
- [x] Create distinct scenes: `Splash`, `Home`, `Battle`, `Result`, `Profile`.
- [x] Implement Platform Adapter (`wx`/`douyin`).

## Phase 2: UI/UX Redesign & Localization [x]
- [x] **Home Scene:** Sci-fi background, Equipment linking.
- [x] **Profile Scene:** Account stats, Inventory grid.
- [x] **Localization:** All text converted to Simplified Chinese.
- [x] **Project Rules:** Established localization guidelines.

## Phase 3: Gameplay Mechanics [x]
- [x] **Player Controller:** Joystick movement, auto-shoot.
- [x] **Wave System:** Enemy spawning and progression.
- [x] **Loot System:** Gold drops and Magnet effect.
- [x] **Battle Menu (Tactical Backpack):**
    - [x] Real-time interaction (No pause).
    - [x] Power-ups: Firepower, Speed, Scatter.
    - [x] Removed "Barrage" naming, now "Scatter".
    - [x] **Dynamic Boundaries:** Player clamped to screen edges.

## Phase 4: Fighter Hangar & Content [ ]
- [ ] **Fighter Design:**
    - [ ] Design 3 realistic fighter models (based on J-20, F-22, Su-57).
    - [ ] Generate high-quality assets.
- [ ] **Hangar System (ProfileScene):**
    - [ ] Implement Fighter selection tab.
    - [ ] Display fighter stats (Speed, Armor, Weapon Bias).
- [ ] **Game Integration:**
    - [ ] Update `Player` to render selected fighter.
    - [ ] Apply different base stats per fighter.

## Phase 5: Polish & Optimization [ ]
- [ ] Add sound effects for all interactions.
- [ ] Add particle effects for Power-up activation.
- [ ] Implement `Props` (Prop Shop/Inventory).
