export const ObstacleTypes = {
    // Natural
    ASTEROID_ICE: { type: 'ASTEROID', name: 'Ice Comet', hp: 30, color: '#aaddff', damage: 20, size: 40 },
    ASTEROID_ROCK: { type: 'ASTEROID', name: 'rocky Asteroid', hp: 50, color: '#888888', damage: 30, size: 50 },
    ASTEROID_IRON: { type: 'ASTEROID', name: 'Iron Meteor', hp: 120, color: '#554433', damage: 50, size: 60 },

    // Man-made debris
    DEBRIS_PANEL: { type: 'WRECKAGE', name: 'Solar Panel', hp: 10, color: '#333399', damage: 10, size: 30 },
    DEBRIS_HULL: { type: 'WRECKAGE', name: 'Ship Hull', hp: 40, color: '#666666', damage: 20, size: 45 },

    // Hazards
    MINE_SPACE: { type: 'MINE', name: 'Space Mine', hp: 1, color: '#ff0000', damage: 100, size: 20, explode: true },
    SATELLITE_rogue: { type: 'SATELLITE', name: 'Rogue Satellite', hp: 80, color: '#ccccff', damage: 30, size: 40 }
};

export default class ObstacleDatabase {
    static generate(difficulty) {
        // 1. Pick Type based on environment/difficulty
        const keys = Object.keys(ObstacleTypes);
        const typeKey = keys[Math.floor(Math.random() * keys.length)];
        const template = ObstacleTypes[typeKey];

        // 2. Procedural Variation
        const scale = 0.8 + Math.random() * 0.5; // 0.8x to 1.3x size

        return {
            ...template,
            width: template.size * scale,
            height: template.size * scale,
            hp: template.hp * difficulty, // HP scales with difficulty
            vx: (Math.random() - 0.5) * 50, // Drifting
            vy: 50 + Math.random() * 100, // Falling speed
            rotationSpeed: (Math.random() - 0.5) * 2,
            loot: Math.random() > 0.8 ? 'gold_small' : null // 20% chance for loot inside
        };
    }
}
