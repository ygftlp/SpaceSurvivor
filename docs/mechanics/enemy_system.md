# Modular Enemy & Obstacle System Design

## 1. Design Philosophy
> **"Infinite Variety from Finite Assets"**
To achieve the goal of **1000+ Enemy Types** and **300+ Obstacles** without bloating the code size, we will use a **Procedural Generation** (Data-Driven) approach. Instead of writing `Enemy1.js` to `Enemy1000.js`, we will create a flexible `EnemyFactory` that assembles enemies from modular traits.

## 2. Enemy Composition System
An enemy is defined by mixing and matching 4 core components:

### A. Chassis (The Body) - 10 Types
Determines Health, Hitbox, and Base Speed.
- **Scout**: Tiny, Fast, Low HP.
- **Fighter**: Balanced.
- **Tank**: Giant, Slow, Massive HP.
- **Stealth**: Hard to see, low HP.
- **Kamikaze**: Spiked, fast.

### B. Movement Behavior (The Brain) - 10 Types
Determines how they fly.
- **Linear**: Moves straight down/diagonally.
- **Sine**: Moves in a wave pattern.
- **Tracker**: Follows the player.
- **Dasher**: Stops, then lunges.
- **Orbiter**: Circles a point or the player.
- **Swarm**: Moves in a group with separation rules.

### C. Weapon System (The Teeth) - 10 Types
Determines attack pattern.
- **Pea Shooter**: Single slow bullet.
- **Spread**: Shotgun style.
- **Laser**: Instant line damage.
- **Missile**: Homing projectiles.
- **Layer**: Deploys stationary mines.

### D. Elite Modifiers (The Spice) - 5 Types
- **Shielded**: Absorbs 1st hit.
- **Regen**: Heals over time.
- **Giant**: 2x Size, 4x HP.

### 🔢 The Math of Variety
`10 Chassis` × `10 Behaviors` × `10 Weapons` × `5 Modifiers` = **5,000 Unique Combinations**.
We can easily hit the 1000 target by defining specific cool combinations (e.g., "Sine Wave Laser Tank") as presets.

## 3. Obstacle System (300 Types)
Obstacles are environmental hazards.

### Types
1.  **Physical**: Asteroids (Small/Med/Large), Wreckage.
    *   *Variant*: Rotating, Drifting, Static.
2.  **Energy**: Nebulas (Slows player), Solar Flares (Damage zones).
3.  **Interactive**:
    *   **Explosive Barrel**: Damages enemies near it.
    *   **Wormhole**: Teleports player.

## 4. Implementation Logic
We will create a `EnemyConfig.js` containing the "DNA" of these types.

```javascript
// Example Config Entry
"Interceptor_Mk1": {
    chassis: "fighter",
    movement: "tracker",
    weapon: "spread",
    color: "#ff0000",
    scale: 1.0
}
```

The `EnemyFactory` will read this DNA and assemble the object at runtime.

## 5. Next Steps
1.  Refactor `Enemy.js` to accept `MovementStrategy` and `WeaponStrategy`.
2.  Create `Obstacle.js` base class.
3.  Implement basic patterns (Sine, Track).
4.  Start populating the "Database" of enemies.
