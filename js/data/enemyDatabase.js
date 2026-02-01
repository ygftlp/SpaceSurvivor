// Enemy Database
// Defines base templates for procedural generation to achieve "200+ types"

export const EnemyTiers = {
    TIER_1: { hp: 20, score: 10, speed: 100 }, // Drones
    TIER_2: { hp: 60, score: 30, speed: 120 }, // Fighters
    TIER_3: { hp: 150, score: 80, speed: 80 }, // Elites
    TIER_4: { hp: 500, score: 300, speed: 50 }, // Mini-Boss
    TIER_5: { hp: 2000, score: 1000, speed: 30 } // Battleships
};

export const ChassisTypes = ['SCOUT', 'FIGHTER', 'TANK', 'INTERCEPTOR', 'BOMBER'];
export const Colors = ['#ff3333', '#00ccff', '#33ff33', '#ffff00', '#cc00ff', '#ffffff'];

export default class EnemyDatabase {

    // Generate a specific enemy ID 
    // Format: "TIER_CHASSIS_WEAPON_COLOR" 
    // Example: "T2_SCOUT_LASER_RED"

    static generate(difficulty) {
        // Determine Tier based on difficulty curve
        let tierKey = 'TIER_1';
        if (difficulty > 10) tierKey = 'TIER_5';
        else if (difficulty > 6) tierKey = 'TIER_4';
        else if (difficulty > 4) tierKey = 'TIER_3';
        else if (difficulty > 2) tierKey = 'TIER_2';

        const tier = EnemyTiers[tierKey];

        // Randomize Components
        const chassis = ChassisTypes[Math.floor(Math.random() * ChassisTypes.length)];
        const color = Colors[Math.floor(Math.random() * Colors.length)];

        // Weapon scaling
        // (Simplified logic for now)
        const weapon = difficulty > 3 ? 'SPREAD_SHOT' : 'PEA_SHOOTER';

        return {
            chassis: chassis,
            color: color,
            weapon: weapon,
            hp: tier.hp * (0.8 + Math.random() * 0.4), // 20% variance
            speed: tier.speed * (0.9 + Math.random() * 0.2),
            score: tier.score,
            damage: 10 * difficulty
        };
    }
}
