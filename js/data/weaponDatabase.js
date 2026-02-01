export const WeaponDatabase = {
    // Basic
    PEA_SHOOTER: {
        id: 'PEA_SHOOTER',
        name: 'Standard Autocannon',
        type: 'PROJECTILE',
        damage: 10,
        speed: 400,
        fireRate: 2.0,
        color: '#ffff00'
    },

    // Spread
    SPREAD_SHOT: {
        id: 'SPREAD_SHOT',
        name: 'Tri-Cannon',
        type: 'PROJECTILE',
        projectiles: 3,
        spread: 0.3, // Radians
        damage: 8,
        speed: 350,
        fireRate: 3.0,
        color: '#ffaa00'
    },

    // Rapid
    GATLING: {
        id: 'GATLING',
        name: 'Rapid Vulcan',
        type: 'PROJECTILE',
        damage: 4,
        speed: 600,
        fireRate: 0.1,
        accuracy: 0.1, // Jitter
        color: '#ff8800'
    },

    // Heavy
    PLASMA_CANNON: {
        id: 'PLASMA_CANNON',
        name: 'Plasma Devastator',
        type: 'PROJECTILE',
        damage: 50,
        speed: 250,
        size: 20, // Huge bullet
        fireRate: 5.0,
        color: '#00ffff'
    },

    // Tracking
    MISSILE_POD: {
        id: 'MISSILE_POD',
        name: 'Seeker Missiles',
        type: 'MISSILE',
        damage: 25,
        speed: 150,
        turnRate: 2.0,
        fireRate: 4.0,
        color: '#ff0000'
    }
};
