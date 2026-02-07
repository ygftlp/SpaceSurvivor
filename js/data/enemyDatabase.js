// Enemy Database
// Defines base templates for procedural generation to achieve "200+ types"

export const EnemyTiers = {
    TIER_1: { hp: 15, score: 12, speed: 100 }, // Drones (hp 20→15, score +20%)
    TIER_2: { hp: 60, score: 36, speed: 120 }, // Fighters (score +20%)
    TIER_3: { hp: 150, score: 96, speed: 80 }, // Elites (score +20%)
    TIER_4: { hp: 500, score: 360, speed: 50 }, // Mini-Boss (score +20%)
    TIER_5: { hp: 2000, score: 1200, speed: 30 } // Battleships (score +20%)
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

        // 根据底盘类型设置高度倾向
        let altitude = 500; // 默认中空层
        switch (chassis) {
            case 'TANK':
                // 地面单位：低空 100-200
                altitude = 100 + Math.random() * 100;
                break;
            case 'SCOUT':
            case 'FIGHTER':
                // 飞行单位：中空 400-600
                altitude = 400 + Math.random() * 200;
                break;
            case 'INTERCEPTOR':
                // 狙击单位：高空 800-900
                altitude = 800 + Math.random() * 100;
                break;
            case 'BOMBER':
                // 轰炸机：从高空开始，之后俯冲
                altitude = 800 + Math.random() * 100;
                break;
            default:
                altitude = 400 + Math.random() * 200;
        }

        return {
            chassis: chassis,
            color: color,
            weapon: weapon,
            hp: tier.hp * (0.8 + Math.random() * 0.4), // 20% variance
            speed: tier.speed * (0.9 + Math.random() * 0.2),
            score: tier.score,
            damage: 10 * difficulty,
            altitude: altitude
        };
    }
}
