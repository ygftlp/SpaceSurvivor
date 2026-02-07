import SeededRandom from '../../../utils/SeededRandom.js';
import { GameConfig } from '../../../config.js';

/**
 * Factory for creating procedurally generated enemies.
 * Ensures that enemy ID #X always has the same stats and appearance.
 */
export default class EnemyFactory {

    /**
     * Generates a complete enemy configuration for a given ID (0-999+).
     * @param {number} id - Unique identifier for the enemy type.
     * @param {number} levelScaler - Optional multiplier for difficulty (default 1).
     */
    static createEnemyConfig(id, levelScaler = 1) {
        const rng = new SeededRandom(id);

        let type = 'FIGHTER';
        let scale = 1.0;
        let baseHp = 30;
        let baseSpeed = 100;
        let baseDmg = 10;

        // Randomly assign class with weights
        const roll = rng.next();
        if (roll < 0.3) {
            type = 'SCOUT';
            scale = 0.7;
            baseHp = 20;
            baseSpeed = 150;
            baseDmg = 5;
        } else if (roll < 0.7) {
            type = 'FIGHTER';
            scale = 1.0;
            baseHp = 50;
            baseSpeed = 100;
            baseDmg = 10;
        } else if (roll < 0.95) {
            type = 'TANK'; // Heavy
            scale = 1.4;
            baseHp = 150;
            baseSpeed = 50;
            baseDmg = 20;
        } else {
            type = 'ELITE';
            scale = 1.2;
            baseHp = 300;
            baseSpeed = 120;
            baseDmg = 25;
        }

        // 2. Generate Unique Stats (Variance)
        // Add random variance +/- 20%
        const hp = Math.floor(baseHp * rng.range(0.8, 1.2) * levelScaler);
        const speed = Math.floor(baseSpeed * rng.range(0.8, 1.2));
        const damage = Math.floor(baseDmg * rng.range(0.8, 1.2) * levelScaler);

        // 3. Generate Visual Genome
        const genome = this.generateGenome(rng, type);

        // 4. Generate Weapon Config
        const weaponConfig = this.generateWeaponConfig(rng, type, damage, genome.colors);

        // 5. Generate Movement Config (Procedural)
        const movePatterns = ['SINE', 'ZIGZAG', 'SPIRAL', 'SWOOP', 'NOISE', 'LINEAR'];
        const movePattern = rng.choice(movePatterns);
        const movementConfig = {
            pattern: movePattern,
            radius: rng.int(30, 150),
            speedX: rng.range(1.0, 4.0),
            phase: rng.range(0, Math.PI * 2),
            drift: rng.range(-20, 20)
        };

        // 6. Generate Name
        const name = this.generateName(rng, type);

        return {
            id: id,
            name: name,
            chassis: type, // Logical type for behavior selection
            scale: scale,
            hp: hp,
            speed: speed,
            damage: damage,
            score: Math.floor(hp / 2),
            color: genome.color,
            genome: genome, // Full visual instructions
            weaponConfig: weaponConfig, // Weapon visuals and stats
            movementConfig: movementConfig, // Movement behavior params
            // Behavior defaults
            movement: 'PROCEDURAL',
            weapon: 'PROCEDURAL'
        };
    }

    /**
     * Generates a complex weapon profile (Firepower System)
     * Supports 100+ unique combinations of Pattern + Projectile + Behavior + Element
     */
    static generateWeaponConfig(rng, type, baseDamage, colors) {
        // A. Elements / Styles
        // Defines color palette and special effects
        const elements = [
            { name: 'PHYSICAL', color: '#ffaa00', effect: 'NONE' },
            { name: 'PLASMA', color: '#00ffff', effect: 'NONE' },
            { name: 'VOID', color: '#aa00ff', effect: 'PIERCING' },
            { name: 'CORROSIVE', color: '#00ff00', effect: 'SLOW' },
            { name: 'EXPLOSIVE', color: '#ff4400', effect: 'EXPLOSIVE' },
            { name: 'FROST', color: '#0088ff', effect: 'SLOW' },
            { name: 'ELECTRIC', color: '#ffff00', effect: 'STUN' }, // New
            { name: 'SONIC', color: '#ff00ff', effect: 'KNOCKBACK' } // New
        ];
        const element = rng.choice(elements);

        // B. Projectile Types (Visuals)
        const projectiles = ['rect', 'circle', 'orb', 'laser', 'shard', 'rocket', 'star', 'cross', 'ring', 'wave', 'bolt'];
        const projType = rng.choice(projectiles);

        // C. Behaviors (Logic)
        const behaviors = ['LINEAR', 'ACCELERATING', 'WOBBLY', 'HOMING'];
        // Weight behaviors: Mostly Linear
        let behavior = 'LINEAR';
        const bRoll = rng.next();
        if (bRoll > 0.7) behavior = 'WOBBLY';
        if (bRoll > 0.85) behavior = 'ACCELERATING';
        if (bRoll > 0.95) behavior = 'HOMING'; // Rare

        // D. Firing Patterns (Strategy)
        const patterns = ['SPREAD', 'RING', 'SPIRAL_EMITTER', 'V_SHAPE', 'RANDOM', 'STRAIGHT', 'CROSS', 'WAVE', 'TORNADO', 'TARGETED_SPREAD'];
        const pattern = rng.choice(patterns);

        // E. Visual Variance (Micro-uniqueness)
        // Adjust hue slightly for unique coloring
        const hueShift = rng.int(-20, 20);

        // Calculate Stats
        // Use STANDARDS
        const STDS = GameConfig.Standards.Speed;

        // Pick a base speed class
        let baseSpd = STDS.SLOW;
        const spdRoll = rng.next();
        if (spdRoll < 0.4) baseSpd = STDS.SLOW;       // 40% Slow (300)
        else if (spdRoll < 0.8) baseSpd = STDS.MEDIUM; // 40% Med (500)
        else if (spdRoll < 0.95) baseSpd = STDS.FAST;  // 15% Fast (800)
        else baseSpd = STDS.SNIPER;                    // 5% Sniper (1200)

        // Variance
        let speed = Math.floor(baseSpd * rng.range(0.9, 1.1));
        let rate = rng.range(1.0, 3.0); // Slower base fire rate for enemies
        let damage = baseDamage;

        // Stat Modifiers based on Behavior/Type
        if (behavior === 'HOMING') {
            speed *= 0.6; // Homing needs to be slower
            damage *= 0.8;
        }
        if (projType === 'rocket') {
            behavior = 'ACCELERATING';
            damage *= 2.0;
            rate *= 2.0; // Slower fire
            speed = 100; // Start slow
        }
        if (projType === 'laser' || projType === 'bolt') {
            speed *= 1.5; // Very fast
            damage *= 0.6;
        }
        if (projType === 'wave') {
            speed *= 0.8;
            damage *= 1.2;
        }

        // Color Logic: Use element color or enemy glow + Variance
        let baseColor = rng.next() > 0.5 ? element.color : (colors ? colors.glow : '#ff0000');

        const elementHues = {
            'PHYSICAL': 30, // Orange
            'PLASMA': 180, // Cyan
            'VOID': 270, // Purple
            'CORROSIVE': 120, // Green
            'EXPLOSIVE': 10, // Red-Orange
            'FROST': 200, // Blue
            'ELECTRIC': 60, // Yellow
            'SONIC': 300 // Magenta
        };
        const baseHue = elementHues[element.name] || 0;
        const uniqueHue = (baseHue + rng.int(-20, 20) + 360) % 360;
        const uniqueSat = rng.int(70, 100);
        const uniqueLig = rng.int(40, 80);
        const color = `hsl(${uniqueHue}, ${uniqueSat}%, ${uniqueLig}%)`;

        // Metadata for display
        const weaponName = this.generateWeaponName(rng, element.name, pattern, projType, behavior);
        const description = this.generateWeaponDescription(element.name, pattern, behavior, element.effect, projType);

        return {
            // Identity
            name: weaponName,
            description: description,

            // Visuals
            color: color,
            shape: projType,
            width: projType === 'wave' ? rng.int(15, 30) : rng.int(6, 14),
            height: projType === 'bolt' ? rng.int(30, 60) : rng.int(12, 30),
            visualVariant: rng.int(0, 6), // New: Visual style variant

            // Stats
            speed: Math.floor(speed),
            damage: Math.floor(damage),
            rate: parseFloat(rate.toFixed(2)),

            // Logic
            pattern: pattern,
            behavior: behavior,
            effect: element.effect,

            // Pattern Specifics
            count: rng.int(2, 8),
            spread: rng.int(10, 60),
            spinSpeed: rng.int(5, 20),
            accel: rng.int(200, 600), // For accelerating
            wobbleFreq: rng.range(2, 10),
            wobbleAmp: rng.range(2, 5),
            turnSpeed: rng.range(1.0, 4.0), // For homing

            // Metadata for display
            elementName: element.name
        };
    }

    static generateWeaponName(rng, element, pattern, shape, behavior) {
        const prefixes = {
            'PHYSICAL': ['Kinetic', 'Titanium', 'Heavy', 'Auto', 'Ballistic', 'Gauss'],
            'PLASMA': ['Plasma', 'Ion', 'Fusion', 'Solar', 'Flux', 'Arc'],
            'VOID': ['Void', 'Dark', 'Abyssal', 'Null', 'Shadow', 'Singularity'],
            'CORROSIVE': ['Acid', 'Toxic', 'Venom', 'Bio', 'Caustic', 'Viral'],
            'EXPLOSIVE': ['Pyro', 'Blast', 'Inferno', 'Hellfire', 'Magma', 'Detonator'],
            'FROST': ['Cryo', 'Frost', 'Glacial', 'Ice', 'Absolute', 'Zero'],
            'ELECTRIC': ['Thunder', 'Volt', 'Lightning', 'Shock', 'Tesla', 'Storm'],
            'SONIC': ['Sonic', 'Resonance', 'Echo', 'Vibro', 'Pulse', 'Wave']
        };

        const nouns = {
            'rect': 'Bolter',
            'circle': 'Orb',
            'orb': 'Cannon',
            'laser': 'Beam',
            'shard': 'Spike',
            'rocket': 'Missile',
            'star': 'Star',
            'cross': 'Cross',
            'ring': 'Ring',
            'wave': 'Slasher',
            'bolt': 'Striker'
        };

        const suffixes = {
            'SPREAD': 'Shotgun',
            'RING': 'Nova',
            'SPIRAL_EMITTER': 'Storm',
            'V_SHAPE': 'Twin',
            'RANDOM': 'Barrage',
            'STRAIGHT': 'Repeater',
            'CROSS': 'Crossfire',
            'WAVE': 'Wave',
            'TORNADO': 'Vortex',
            'TARGETED_SPREAD': 'Hunter'
        };

        const prefix = rng.choice(prefixes[element] || ['Standard']);

        let noun = nouns[shape] || 'Gun';
        if (behavior === 'HOMING') noun = 'Seeker';
        if (behavior === 'ACCELERATING') noun = 'Accelerator';
        if (shape === 'wave') noun = 'Cutter';
        if (shape === 'bolt') noun = 'Lancer';

        const suffix = suffixes[pattern] || 'System';

        // Mix and match formats
        const format = rng.int(0, 3);
        if (format === 0) return `${prefix} ${noun} ${suffix}`; // Plasma Bolter Nova
        if (format === 1) return `${prefix} ${suffix}`;        // Plasma Nova
        if (format === 2) return `${prefix} ${noun}`;          // Plasma Bolter
        return `${prefix} ${noun}`;
    }

    static generateWeaponDescription(element, pattern, behavior, effect, shape) {
        let desc = "Fires ";

        // Pattern part
        const patternDesc = {
            'SPREAD': "a wide spread of ",
            'RING': "an expanding ring of ",
            'SPIRAL_EMITTER': "a spiraling stream of ",
            'V_SHAPE': "dual angled ",
            'RANDOM': "chaotic bursts of ",
            'STRAIGHT': "rapid streams of ",
            'CROSS': "a cruciform pattern of ",
            'WAVE': "an oscillating wave of ",
            'TORNADO': "a twin vortex of ",
            'TARGETED_SPREAD': "a focused volley of "
        };

        let shapeDesc = "projectiles";
        if (shape === 'wave') shapeDesc = "crescent energy waves";
        if (shape === 'bolt') shapeDesc = "crackling lightning bolts";
        if (shape === 'laser') shapeDesc = "concentrated energy beams";
        if (shape === 'orb') shapeDesc = "unstable plasma orbs";
        if (shape === 'rocket') shapeDesc = "guided missiles";
        if (shape === 'ring') shapeDesc = "resonant energy rings";
        if (shape === 'star') shapeDesc = "spinning star-shurikens";

        desc += (patternDesc[pattern] || "volleys of ") + shapeDesc;

        // Element part
        const elementDesc = {
            'PHYSICAL': " (Kinetic)",
            'PLASMA': " (Plasma)",
            'VOID': " (Void)",
            'CORROSIVE': " (Acid)",
            'EXPLOSIVE': " (Explosive)",
            'FROST': " (Cryo)",
            'ELECTRIC': " (Shock)",
            'SONIC': " (Sonic)"
        };
        desc += elementDesc[element] || "";

        // Behavior part
        if (behavior === 'HOMING') desc += ", relentlessly tracking targets";
        else if (behavior === 'ACCELERATING') desc += ", accelerating mid-flight";
        else if (behavior === 'WOBBLY') desc += ", moving in unpredictable paths";

        // Effect suffix
        if (effect === 'SLOW') desc += ". Impacts slow engines.";
        else if (effect === 'PIERCING') desc += ". Pierces shields.";
        else if (effect === 'EXPLOSIVE') desc += ". Detonates on impact.";
        else if (effect === 'STUN') desc += ". May stun systems.";
        else if (effect === 'KNOCKBACK') desc += ". Knocks targets back.";
        else desc += ".";

        return desc;
    }

    static generateGenome(rng, type) {
        // Hues: Red(0), Orange(30), Green(120), Cyan(180), Blue(240), Purple(270)
        const hue = rng.int(0, 360);
        const sat = rng.int(40, 100);
        const lig = rng.int(30, 70);
        const color = `hsl(${hue}, ${sat}%, ${lig}%)`;

        // Secondary color (Complementary or Analogous)
        const secHue = (hue + rng.choice([30, 180])) % 360;
        const secColor = `hsl(${secHue}, ${sat}%, ${lig}%)`;
        const glowColor = `hsl(${hue}, 100%, 80%)`;

        const bodies = ['NEEDLE', 'STANDARD', 'BULK', 'ROUND', 'INSECT', 'DIAMOND'];
        const wings = ['DELTA', 'FORWARD_SWEPT', 'X_WING', 'BOX', 'NONE', 'RING', 'V_WING'];
        const cockpits = ['BUBBLE', 'SLIT', 'TRIANGLE', 'RED_EYE', 'DOME'];
        const engines = ['SINGLE', 'TWIN', 'QUAD', 'TRIPLE', 'RING_DRIVE'];
        const markings = ['NONE', 'STRIPES', 'CHEVRON', 'CAMO', 'CIRCUIT'];

        // Bias shapes based on type
        let bodyType = rng.choice(bodies);
        let wingType = rng.choice(wings);
        let engineType = rng.choice(engines);

        if (type === 'SCOUT') {
            bodyType = rng.choice(['NEEDLE', 'INSECT', 'STANDARD']);
            wingType = rng.choice(['DELTA', 'FORWARD_SWEPT', 'V_WING']);
            engineType = rng.choice(['SINGLE', 'TWIN']);
        } else if (type === 'TANK') {
            bodyType = rng.choice(['BULK', 'ROUND', 'DIAMOND']);
            wingType = rng.choice(['BOX', 'X_WING', 'RING']);
            engineType = rng.choice(['QUAD', 'RING_DRIVE', 'TRIPLE']);
        }

        // Adjust constraints based on body type to prevent ugly combinations
        let wModMin = 0.8, wModMax = 1.2;
        let lModMin = 0.9, lModMax = 1.2;

        if (bodyType === 'NEEDLE') {
            wModMax = 1.0; // Needle shouldn't be too wide
            lModMin = 1.0; // Needle should be long
        }
        if (bodyType === 'ROUND' || bodyType === 'BULK') {
            wModMin = 1.0; // Bulk shouldn't be too thin
        }

        return {
            colors: {
                primary: color,
                secondary: secColor,
                glow: glowColor
            },
            body: {
                type: bodyType,
                widthMod: rng.range(wModMin, wModMax),
                lengthMod: rng.range(lModMin, lModMax),
                cornerMod: rng.range(0.0, 10.0)
            },
            wings: {
                type: wingType,
                spanMod: rng.range(0.8, 1.4), // Tighter range
                sweepMod: rng.range(-5, 15),
                yOffset: rng.range(-10, 10)   // Reduced offset to keep wings attached
            },
            cockpit: {
                type: rng.choice(cockpits),
                sizeMod: rng.range(0.9, 1.3)
            },
            engines: {
                type: engineType,
                spreadMod: rng.range(0.8, 1.2) // Tighter spread
            },
            markings: {
                type: rng.choice(markings),
                density: rng.range(0.3, 0.7)
            },
            // Legacy color support
            color: color
        };
    }

    static generateName(rng, type) {
        const prefixes = ['Void', 'Star', 'Iron', 'Crimson', 'Shadow', 'Neon', 'Cyber', 'Dark', 'Solar', 'Lunar'];
        const suffixes = ['Viper', 'Hawk', 'Shark', 'Ghost', 'Raider', 'Stalker', 'Dread', 'Wing', 'Fang', 'Claw'];
        const romans = ['I', 'II', 'III', 'IV', 'V', 'X', 'Alpha', 'Omega'];

        const name = `${rng.choice(prefixes)} ${rng.choice(suffixes)} ${rng.choice(romans)}`;
        return name;
    }
}
