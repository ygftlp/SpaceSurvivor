# Fighter Customization & Social System Design

## 1. Core Philosophy: "My Fighter, My Legend"
As suggested, the ultimate retention hook is the player's emotional attachment to their unique war machine.
We will shift focus from just "Unlocking Fighters" to **"Customizing Fighters"**.

## 2. Visual Customization Layers
To maximize "Uniqueness" without creating infinite assets, we use a **Layered Composition System**:

### Layer 1: The Airframe (Base)
*   The core model (F-22, J-20, Su-57).
*   **Skinning**: Replace the static texture with a "Paint Mask" system.
    *   *Default*: Camouflage.
    *   *Gold*: Prestige unlock.
    *   *Neon*: Cyberpunk style.
    *   *User Color*: RGB Slider validation?

### Layer 2: Hardpoint Attachments (Gear)
Selected skills/weapons now appear visually on the ship:
*   **Wing Tips**: Speed Boosters / Stabilizers.
*   **Underwing**: Missile Pods / Bomb Racks.
*   **Nose**: Cannon variants (Gatling vs Railgun).
*   **Engine**: Thruster color changes (Blue -> Red -> Purple).

### Layer 3: Decals & Insignia
*   Allow placing a "Rank Badge" or "Squadron Logo" on the wing.
*   This connects to the Achievement System.

## 3. The "Hangar" Scene (Social Hub)
A new dedicated scene `HangarScene` updates the `ProfileScene`.
*   **360 View**: Drag to rotate the fighter.
*   **Modification Bay**: UI to equip items and change colors.
*   **Photo Mode**: Click "Snap" to generate a high-res poster:
    > "Captain [Name] - [Rank]"
    > "Piloting: [Fighter Name] (Custom)"
    > Stats: [Win Rate] [Top Score]
    > *Background: The Hangar Dock*

## 4. Implementation Strategy
1.  **Refactor Player Rendering**: Move from single-sprite to `CompositeSprite` (Body + Attachments).
2.  **Data Structure**: Update `PlayerData` to store `loadout: { skin, hardpoints: [...] }`.
3.  **Social API**: Use `wx.shareAppMessage` with the generated Hangar Snapshot.

## 5. Technical Stack
*   **Canvas Compositing**: Pre-render the custom fighter to an offscreen canvas to optimize performance during battle.
*   **Masking**: Use `globalCompositeOperation = 'source-atop'` for distinct paint jobs.
