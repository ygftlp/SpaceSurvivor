# Battleship Architecture Design (Boss System)

To make Bosses feel like "Capital Ships" rather than just big enemies, we will implement a component-based system.

## 1. Core Core (The Hull)
*   **HP Pool**: Massive health bar (e.g., 50,000 HP).
*   **Critical Weakness**: The Boss takes reduced damage (Armor) unless specific parts are destroyed or "Core" is exposed.

## 2. Defensive Systems
### Energy Shield (护盾)
*   **Mechanic**: An outer health bar (Blue) that must be depleted before Hull is damaged.
*   **Regeneration**: If the Boss hasn't taken damage for 5 seconds, the shield regenerates at 5% per second.
*   **Visual**: A glowing bubble that flares up when hit.

### Point Defense Turrets (近防炮)
*   **Purpose**: Automatically shoot down Player Missiles or small projectiles.
*   **Counterplay**: Player must overwhelm them or destroy them first.

## 3. Offensive Modules
### Main Batteries (主炮)
*   Large, slow-turning turrets that fire massive plasma blasts (high damage, easy to dodge).
*   **Target**: Can be targeted and destroyed to disable the heavy attacks.

### Hangar Bays (此时战机搭配)
*   **Carrier Interceptors**: The Boss spawns squads of small, fast "Interceptor" drones.
*   **Logic**: 
    *   *Phase 1*: Spawns 2 Scouts every 10s.
    *   *Phase 2*: Spawns "Suicide Drones" that ram the player.
*   **Destructible**: Destroying the Hangar Bay stops spawns.

## 4. Hierarchy Implementation
```javascript
class Boss extends Enemy {
    constructor() {
        this.modules = [
            new ShieldGenerator({ hp: 2000, regen: true }),
            new Turret({ type: 'LASER', x: -50, y: 20 }),
            new Turret({ type: 'MISSILE', x: 50, y: 20 }),
            new HangarBay({ spawnType: 'DRONE_SUICIDE', interval: 8 })
        ];
    }
    
    takeDamage(amount, hitLocation) {
        // Redirect damage to Shield first
        if (this.shield.active) {
            this.shield.takeDamage(amount);
            return;
        }
        // Then check module hits? (Simplified: Just Body)
        super.takeDamage(amount);
    }
}
```

## 5. Proposed Roadmap
1.  **Add Shield System** to `BaseBoss`.
2.  **Add Minion Spawning** (Hangar) to `TitanBattleship`.
3.  **Refine Turrets** to be independent objects.
