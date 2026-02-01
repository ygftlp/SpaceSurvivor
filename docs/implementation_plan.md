# Fighter Refactor Plan

## Goal
Refactor the fighter system to use individual classes for each fighter model (J-20, F-22, Su-57), inheriting from a common `BaseFighter`. This aims to improve code organization, allow for unique fighter attributes/equipment slots, and separate rendering logic.

## Structure
*   **Directory**: `js/object/fighter/`
*   **Classes**:
    *   `BaseFighter.js`: Common logic (stats, render placeholder, equip logic).
    *   `J20.js`: J-20 specific stats, rendering, and slots.
    *   `F22.js`: F-22 specific stats, rendering, and slots.
    *   `Su57.js`: Su-57 specific stats, rendering, and slots.
*   **Registry**: Update `GameConfig` or a new `FighterFactory` to map IDs ('J-20') to Classes.

## Changes

### 1. Create Fighter Classes
*   **BaseFighter**:
    *   Properties: `name`, `desc`, `hp`, `speed`, `unlockCost`.
    *   Methods: `render(ctx, size)`, `getLoadout()`.
*   **Subclasses (J20, F22, Su57)**:
    *   Override `render` with specific Canvas drawing (migrated from RenderUtils and improved).
    *   Define specific stats.

### 2. Update RenderUtils
*   Remove `drawFighter`, `drawJ20`, etc.
*   (Optional) Keep helper methods like `drawPanel` but delegate fighter drawing to the instances.

### 3. Update Player.js
*   Store `currentFighter` instance (e.g., `this.fighter = new J20()`).
*   Delegate rendering: `this.fighter.render(ctx, size)`.
*   Delegate stats: `this.hp = this.fighter.hp`.

### 4. Update ProfileScene.js
*   Instantiate fighters to read info/render previews.
*   (Optimization) Maybe singleton instances or static methods for config info to avoid creating objects just for UI text?
    *   *Decision*: Use static `config` property for UI info, instance `render` for preview.

## Verification
*   Verify Game runs and Player renders correctly.
*   Verify ProfileScene shows correct info and preview.
*   Check one fighter (e.g., Su-57) to ensure "ugliness" is addressed (will attempt to refine the drawing code during migration).
